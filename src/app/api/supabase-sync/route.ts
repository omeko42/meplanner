import { NextRequest, NextResponse } from 'next/server';
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_TABLE_NAME,
  SUPABASE_ROW_ID,
} from '@/lib/supabaseCloud';
import { WeddingDatabaseSchema, WeddingGuest } from '@/types';

export const dynamic = 'force-dynamic';

function getSupabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

function normalizeGuestListWithUniqueCodes(guests: WeddingGuest[]): WeddingGuest[] {
  const usedCodes = new Set<string>();
  let maxNum = 0;

  for (const g of guests) {
    const m = /^INV-(\d+)$/i.exec((g.invitationCode || '').trim());
    if (m) {
      const n = parseInt(m[1], 10);
      if (n > maxNum) maxNum = n;
    }
  }

  return guests.map((g) => {
    const code = (g.invitationCode || '').trim().toUpperCase();
    if (code && !usedCodes.has(code)) {
      usedCodes.add(code);
      return g;
    }
    maxNum += 1;
    const nextCode = `INV-${String(maxNum).padStart(4, '0')}`;
    usedCodes.add(nextCode);
    return {
      ...g,
      invitationCode: nextCode,
    };
  });
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

    // Server-Side Multi-Device Guest Merge (prevents PC & Mobile from overwriting each other's newly added guests)
    if (!body.forceOverwrite && Array.isArray(mergedData.guests)) {
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
          if (cloudData && Array.isArray(cloudData.guests)) {
            const deletedSet = new Set<string>(
              Array.isArray(body.deletedGuestIds) ? body.deletedGuestIds : []
            );

            const clientGuests = mergedData.guests.filter(
              (g) => g && g.id && !deletedSet.has(g.id)
            );
            const combined: WeddingGuest[] = [...clientGuests];

            for (const cg of cloudData.guests) {
              if (!cg || !cg.id || deletedSet.has(cg.id)) continue;
              const cgNameNorm = (cg.guestName || '').trim().toLowerCase();
              const alreadyExists = combined.some(
                (g) =>
                  g.id === cg.id ||
                  (cgNameNorm &&
                    (g.guestName || '').trim().toLowerCase() === cgNameNorm)
              );
              if (!alreadyExists) {
                combined.push(cg);
              }
            }

            mergedData = {
              ...mergedData,
              guests: normalizeGuestListWithUniqueCodes(combined),
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

    // Best-effort relational table sync for public.wedding_guests
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

    return NextResponse.json({
      success: true,
      updatedAt: syncTime,
      guestsCount: Array.isArray(mergedData.guests) ? mergedData.guests.length : 0,
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
