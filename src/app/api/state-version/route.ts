import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { apiError } from '@/lib/apiGuard';
import {
  SUPABASE_URL,
  SUPABASE_TABLE_NAME,
  SUPABASE_ROW_ID,
} from '@/lib/supabaseCloud';
import { SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * Lightweight "has the cloud snapshot changed?" probe.
 *
 * The client polls this every few seconds to detect writes from another
 * device. It returns only a timestamp — never the payload — so the poll is
 * cheap and cannot leak data. The browser is not allowed to talk to Supabase
 * directly because the anon key must not carry read access.
 */
export async function GET(req: NextRequest) {
  try {
    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    const headers: Record<string, string> = {
      apikey: key || '',
      Authorization: `Bearer ${key || ''}`,
      Accept: 'application/json',
    };

    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=updated_at`,
      { method: 'GET', headers, cache: 'no-store' }
    );

    if (!res.ok) {
      return NextResponse.json(
        { success: false, updatedAt: null },
        { status: res.status }
      );
    }

    const rows = (await res.json().catch(() => null)) as Array<{
      updated_at?: string;
    }> | null;

    return NextResponse.json(
      {
        success: true,
        updatedAt:
          Array.isArray(rows) && rows[0]?.updated_at ? rows[0].updated_at : null,
      },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        updatedAt: null,
        error: err instanceof Error ? err.message : 'Gagal memeriksa versi state.',
      },
      { status: 500 }
    );
  }
}
