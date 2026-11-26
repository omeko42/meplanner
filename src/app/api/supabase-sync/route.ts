import { NextRequest, NextResponse } from 'next/server';
import {
  SUPABASE_TABLE_NAME,
  SUPABASE_ROW_ID,
  mergeFullDatabaseMultiDevice,
} from '@/lib/supabaseCloud';
import { verifyAdminRequest } from '@/lib/auth';
import { WeddingDatabaseSchema } from '@/types';
import { apiError } from '@/lib/apiGuard';
import {
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from '@/lib/env';
import { stripCredentialFields } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

/**
 * Server-side Supabase credentials.
 *
 * The browser only ever holds the publishable anon key, and RLS is locked
 * down so that key cannot read or write anything on its own. This proxy is
 * the single place that touches the database, and it authenticates the caller
 * first. When a service_role key is configured it is used here so the server
 * bypasses RLS deliberately; otherwise the anon key is used, which only
 * works while the legacy open policies are still in place.
 */
function getSupabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.');
  }
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

export async function GET(req: NextRequest) {
  try {
    // The database holds guest PII and account data — never serve it without
    // a verified session.
    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const restUrl = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=id,data,updated_at`;
    const res = await fetch(restUrl, {
      method: 'GET',
      headers: getSupabaseHeaders({
        Accept: 'application/json',
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        {
          success: false,
          status: res.status,
          error: errText,
        },
        { status: res.status }
      );
    }

    const rows = await res.json();
    return NextResponse.json(
      {
        success: true,
        rows: Array.isArray(rows) ? rows : [],
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        status: 500,
        error: err instanceof Error ? err.message : 'Server proxy failed to reach Supabase',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      data?: WeddingDatabaseSchema;
      updatedAt?: string;
      forceOverwrite?: boolean;
      deletedGuestIds?: string[];
      deletedTaskIds?: string[];
      deletedWishIds?: string[];
      deletedBudgetIds?: string[];
    };

    if (!body || !body.data || typeof body.data !== 'object') {
      return NextResponse.json(
        {
          success: false,
          status: 400,
          error: 'Invalid payload: data object is required',
        },
        { status: 400 }
      );
    }

    const adminSession = verifyAdminRequest(req);
    const isAuthenticatedAdmin = Boolean(adminSession);

    // Writing to the shared database requires a verified session. Previously
    // an anonymous POST could rewrite the row, which allowed anyone to
    // overwrite adminUsers and erase the workspace.
    if (!isAuthenticatedAdmin) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const allowForceOverwrite = Boolean(body.forceOverwrite && isAuthenticatedAdmin);

    const syncTime = body.updatedAt || new Date().toISOString();
    let mergedData: WeddingDatabaseSchema = {
      ...body.data,
      lastSyncedAt: syncTime,
    };

    // Server-Side Multi-Device Full Database Merge
    // Protects guests, RSVP confirmations, wishes, tasks, budgets, adminUsers, and clientWorkspaces across concurrent users
    if (!allowForceOverwrite) {
      try {
        const existingRes = await fetch(
          `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=data`,
          {
            method: 'GET',
            headers: getSupabaseHeaders({ Accept: 'application/json' }),
            cache: 'no-store',
          }
        );

        if (existingRes.ok) {
          const existingRows = (await existingRes.json()) as Array<{
            data?: Partial<WeddingDatabaseSchema>;
          }>;
          const cloudData = existingRows?.[0]?.data;
          if (cloudData && typeof cloudData === 'object') {
            // Unauthenticated public callers (RSVP / Wishes / Gift Confirmation) cannot delete records or overwrite budgetItems/tasks/adminUsers
            const safeInputData: WeddingDatabaseSchema = isAuthenticatedAdmin
              ? mergedData
              : {
                  ...mergedData,
                  budgetItems: Array.isArray(cloudData.budgetItems)
                    ? cloudData.budgetItems
                    : mergedData.budgetItems,
                  tasks: Array.isArray(cloudData.tasks)
                    ? cloudData.tasks
                    : mergedData.tasks,
                  adminUsers: Array.isArray(cloudData.adminUsers)
                    ? cloudData.adminUsers
                    : mergedData.adminUsers,
                };

            mergedData = mergeFullDatabaseMultiDevice(
              safeInputData,
              cloudData,
              true,
              isAuthenticatedAdmin
                ? {
                    guests: new Set<string>(
                      Array.isArray(body.deletedGuestIds) ? body.deletedGuestIds : []
                    ),
                    tasks: new Set<string>(
                      Array.isArray(body.deletedTaskIds) ? body.deletedTaskIds : []
                    ),
                    wishes: new Set<string>(
                      Array.isArray(body.deletedWishIds) ? body.deletedWishIds : []
                    ),
                    budgets: new Set<string>(
                      Array.isArray(body.deletedBudgetIds) ? body.deletedBudgetIds : []
                    ),
                  }
                : undefined
            );
            mergedData = {
              ...mergedData,
              lastSyncedAt: syncTime,
            };
          }
        }
      } catch {
        // Proceed with client data if fetching existing row fails
      }
    }

    const upRes = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?on_conflict=id`,
      {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify({
          id: SUPABASE_ROW_ID,
          // The browser never receives password hashes, and a hash that
          // arrives here would be a client-supplied value we must not trust.
          // Strip them before the state reaches the database.
          data: stripCredentialFields(mergedData),
          updated_at: syncTime,
        }),
      }
    );

    if (!upRes.ok) {
      const errText = await upRes.text();
      return NextResponse.json(
        {
          success: false,
          status: upRes.status,
          error: errText,
        },
        { status: upRes.status }
      );
    }

    // Best-effort relational table sync & deletion pruning for public.wedding_guests & public.wedding_wishes
    if (Array.isArray(mergedData.guests) && mergedData.guests.length > 0) {
      try {
        const guestRows = mergedData.guests.map((g) => ({
          id: g.id,
          project_id: 'main',
          name: g.guestName,
          category: g.guestType,
          rsvp_status: g.rsvpStatus,
          pax: g.pax || 1,
          phone: g.phone || '',
          payload: g,
          updated_at: syncTime,
        }));
        await fetch(`${SUPABASE_URL}/rest/v1/wedding_guests?on_conflict=id`, {
          method: 'POST',
          headers: getSupabaseHeaders({
            Prefer: 'resolution=merge-duplicates,return=minimal',
          }),
          body: JSON.stringify(guestRows),
        });
        const cleanGuestIds = mergedData.guests
          .map((g) => String(g.id || '').trim())
          .filter(Boolean);
        if (cleanGuestIds.length > 0) {
          const filterExpr = `id=not.in.(${cleanGuestIds
            .map((k) => `"${k.replace(/"/g, '')}"`)
            .join(',')})`;
          await fetch(`${SUPABASE_URL}/rest/v1/wedding_guests?${filterExpr}`, {
            method: 'DELETE',
            headers: getSupabaseHeaders(),
          });
        }
      } catch {
        // Ignore relational table errors
      }
    }

    if (Array.isArray(mergedData.wishes)) {
      try {
        if (mergedData.wishes.length > 0) {
          const wishRows = mergedData.wishes.map((w) => ({
            id: w.id,
            project_id: 'main',
            name: w.guestName,
            attendance: w.rsvpStatus,
            message: w.message || '',
            created_at_label: w.createdAt || '',
            payload: w,
            updated_at: syncTime,
          }));
          await fetch(`${SUPABASE_URL}/rest/v1/wedding_wishes?on_conflict=id`, {
            method: 'POST',
            headers: getSupabaseHeaders({
              Prefer: 'resolution=merge-duplicates,return=minimal',
            }),
            body: JSON.stringify(wishRows),
          });
          const cleanWishIds = mergedData.wishes
            .map((w) => String(w.id || '').trim())
            .filter(Boolean);
          if (cleanWishIds.length > 0) {
            const filterExpr = `id=not.in.(${cleanWishIds
              .map((k) => `"${k.replace(/"/g, '')}"`)
              .join(',')})`;
            await fetch(`${SUPABASE_URL}/rest/v1/wedding_wishes?${filterExpr}`, {
              method: 'DELETE',
              headers: getSupabaseHeaders(),
            });
          }
        } else {
          await fetch(
            `${SUPABASE_URL}/rest/v1/wedding_wishes?project_id=eq.main`,
            {
              method: 'DELETE',
              headers: getSupabaseHeaders(),
            }
          );
        }
      } catch {
        // Ignore relational table errors
      }
    }

    return NextResponse.json({
      success: true,
      updatedAt: syncTime,
      guestsCount: Array.isArray(mergedData.guests) ? mergedData.guests.length : 0,
      wishesCount: Array.isArray(mergedData.wishes) ? mergedData.wishes.length : 0,
      data: mergedData,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        status: 500,
        error: err instanceof Error ? err.message : 'Server proxy POST failed',
      },
      { status: 500 }
    );
  }
}
