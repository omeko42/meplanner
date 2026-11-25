import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { apiError, rejectDisallowedOrigin } from '@/lib/apiGuard';
import {
  dbFetch,
  dbHeaders,
  scopeRowsToTenant,
  withTenantFilter,
} from '@/lib/tenantScope';

export const dynamic = 'force-dynamic';

/**
 * Tables the browser is allowed to touch through this proxy.
 *
 * The browser never talks to Supabase directly, so this whitelist is the
 * complete surface it can reach. `app_user_credentials` is deliberately
 * absent: password hashes are server-only.
 */
const ALLOWED_TABLES = new Set([
  'wedding_state',
  'wedding_settings',
  'wedding_media',
  'wedding_tasks',
  'wedding_guests',
  'wedding_wishes',
  'wedding_budgets',
  'wedding_users',
  'wedding_payments',
  'tenant_guests',
  'tenant_wishes',
  'tenant_tasks',
  'tenant_budget_items',
  'tenant_settings',
]);

/** Only `main` exists as the single-workspace row today. */
const SINGLETON_TABLES = new Set(['wedding_state']);

/**
 * Strips credential material from a row before it is written.
 *
 * `wedding_users.payload` used to carry the full admin user object including
 * the scrypt hash. The hash now lives only in the server-side credential
 * vault, so it must never be written from a browser-originated payload.
 */
function stripCredentialsFromRows(table: string, rows: unknown): unknown {
  if (table !== 'wedding_users') return rows;
  const list = Array.isArray(rows) ? rows : [rows];
  return list.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const record = { ...(row as Record<string, unknown>) };
    const payload = record.payload;
    if (payload && typeof payload === 'object') {
      const cleanPayload = { ...(payload as Record<string, unknown>) };
      delete cleanPayload.passwordHash;
      delete cleanPayload.password;
      record.payload = cleanPayload;
    }
    delete record.passwordHash;
    delete record.password;
    return record;
  });
}

function readTable(req: NextRequest): string | null {
  const table = req.nextUrl.searchParams.get('table') || '';
  return ALLOWED_TABLES.has(table) ? table : null;
}

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

    const table = readTable(req);
    if (!table) {
      return apiError('Tabel tidak diizinkan.', 400, { code: 'INVALID_TABLE' });
    }

    const select = req.nextUrl.searchParams.get('select');
    const filters = req.nextUrl.searchParams.get('filters');

    // The tenant comes from the verified session, never from the browser.
    // The service-role key bypasses RLS, so this server-side filter is the
    // thing that actually keeps workspaces apart.
    const scopedFilters = withTenantFilter(
      filters || '',
      table,
      adminSession.tenantId
    );

    const parts = [] as string[];
    if (select) parts.push(`select=${encodeURIComponent(select)}`);
    if (scopedFilters) parts.push(scopedFilters);

    const query = parts.length > 0 ? `?${parts.join('&')}` : '';
    const res = await dbFetch(`${table}${query}`, {
      method: 'GET',
      headers: dbHeaders({ Accept: 'application/json' }),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: errText.slice(0, 300) },
        { status: res.status }
      );
    }

    const rows = await res.json();
    return NextResponse.json(
      { success: true, rows: Array.isArray(rows) ? rows : [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal membaca data.',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const originGuard = rejectDisallowedOrigin(req);
    if (originGuard) return originGuard;

    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const table = readTable(req);
    if (!table) {
      return apiError('Tabel tidak diizinkan.', 400, { code: 'INVALID_TABLE' });
    }

    const body = await req.json().catch(() => null);
    const rawRows = body?.rows ?? body;
    const rows = scopeRowsToTenant(
      table,
      stripCredentialsFromRows(table, rawRows),
      adminSession.tenantId
    );

    const res = await dbFetch(`${table}?on_conflict=id`, {
      method: 'POST',
      headers: dbHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(rows),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: errText.slice(0, 300) },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal menyimpan data.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const originGuard = rejectDisallowedOrigin(req);
    if (originGuard) return originGuard;

    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const table = readTable(req);
    if (!table) {
      return apiError('Tabel tidak diizinkan.', 400, { code: 'INVALID_TABLE' });
    }

    const body = await req.json().catch(() => null);
    const id = typeof body?.id === 'string' ? body.id : '';
    const projectWide = body?.projectWide === true;
    const keepIds = Array.isArray(body?.keepIds)
      ? body.keepIds.filter((v: unknown) => typeof v === 'string')
      : null;

    if (!id && !projectWide && !keepIds) {
      return apiError('ID, keepIds, atau projectWide diperlukan.', 400, {
        code: 'INVALID_PAYLOAD',
      });
    }

    // The singleton row must never be deleted — it holds the whole workspace.
    if (SINGLETON_TABLES.has(table)) {
      return apiError('Baris utama tidak dapat dihapus.', 400, {
        code: 'PROTECTED_ROW',
      });
    }

    // `keepIds` prunes rows that are no longer present: everything except the
    // ids the client still has.
    const filterParts = [
      id !== ''
        ? `id=eq.${encodeURIComponent(id)}`
        : projectWide
          ? 'project_id=eq.main'
          : `id=not.in.(${keepIds!.map((k: string) => `"${k.replace(/"/g, '')}"`).join(',')})`,
    ];

    // Tenant-scoped deletes must never reach another workspace's rows.
    const scoped = withTenantFilter(
      filterParts.join('&'),
      table,
      adminSession.tenantId
    );

    const res = await dbFetch(`${table}?${scoped}`, {
      method: 'DELETE',
      headers: dbHeaders(),
    });

    if (!res.ok && res.status !== 404) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: errText.slice(0, 300) },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal menghapus data.',
      },
      { status: 500 }
    );
  }
}
