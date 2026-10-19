import { NextRequest, NextResponse } from 'next/server';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_TABLE_NAME,
  SUPABASE_ROW_ID,
  mergeFullDatabaseMultiDevice,
} from '@/lib/supabaseCloud';
import { WeddingDatabaseSchema } from '@/types';

export const dynamic = 'force-dynamic';

function getSupabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

export async function GET() {
  try {
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

    const syncTime = body.updatedAt || new Date().toISOString();
    let mergedData: WeddingDatabaseSchema = {
      ...body.data,
      lastSyncedAt: syncTime,
    };

    // Server-Side Multi-Device Full Database Merge
    // Protects guests, RSVP confirmations, wishes, tasks, budgets, adminUsers, and clientWorkspaces across concurrent users
    if (!body.forceOverwrite) {
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
            mergedData = mergeFullDatabaseMultiDevice(
              mergedData,
              cloudData,
              true,
              {
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
          data: mergedData,
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

    // Best-effort relational table sync for public.wedding_guests & public.wedding_wishes
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
      } catch {
        // Ignore relational table errors
      }
    }

    if (Array.isArray(mergedData.wishes) && mergedData.wishes.length > 0) {
      try {
        const wishRows = mergedData.wishes.map((w) => ({
          id: w.id,
          project_id: 'main',
          guest_name: w.guestName,
          message: w.message || '',
          rsvp_status: w.rsvpStatus,
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
