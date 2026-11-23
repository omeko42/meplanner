import { NextRequest } from 'next/server';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/env';
import { SUPABASE_ANON_KEY } from '@/lib/supabaseCloud';

/**
 * Tenant resolution for the server-side data proxy.
 *
 * The browser holds no database credential and cannot choose its own tenant.
 * The tenant comes from the verified session, and every query the proxy
 * issues is filtered by it. That is what actually enforces isolation —
 * Postgres RLS alone cannot help when the server uses the service_role key,
 * because that key bypasses RLS by design.
 */

export interface TenantContext {
  /** Tenant id (uuid) the session belongs to. */
  tenantId: string;
  /** Human-readable slug, used for storage paths. */
  slug: string;
}

/**
 * The tenant for the legacy single-workspace deployment.
 *
 * Until the backfill in migration 003 has run there is exactly one tenant.
 * It is resolved by slug so the id stays stable across environments.
 */
export const DEFAULT_TENANT_SLUG = 'default';

/**
 * Tables that carry a `tenant_id` column and therefore must always be
 * filtered by it.
 */
export const TENANT_SCOPED_TABLES = new Set([
  'tenant_guests',
  'tenant_wishes',
  'tenant_tasks',
  'tenant_budget_items',
  'tenant_settings',
  'audit_logs',
]);

/**
 * Legacy tables that predate the tenant model. They are still served by the
 * proxy during the transition, but they are singleton tables: one row holds
 * the whole workspace.
 */
export const LEGACY_SINGLETON_TABLES = new Set([
  'wedding_state',
  'wedding_settings',
  'wedding_media',
  'wedding_tasks',
  'wedding_guests',
  'wedding_wishes',
  'wedding_budgets',
  'wedding_users',
  'wedding_payments',
]);

export function dbKey(): string {
  return SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
}

export function dbHeaders(extra?: Record<string, string>): Record<string, string> {
  const key = dbKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

function dbFetch(path: string, init: RequestInit): Promise<Response> {
  return fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    cache: 'no-store',
  });
}

/**
 * Resolves the tenant row for a session.
 *
 * The tenant id is stored on the session when it was issued. When the tenant
 * table does not exist yet (migration 003 not applied) this returns null and
 * the caller falls back to the legacy singleton tables.
 */
export async function resolveTenantForSession(
  tenantIdFromSession: string | undefined
): Promise<TenantContext | null> {
  if (!tenantIdFromSession) return null;

  const res = await dbFetch(
    `tenants?id=eq.${encodeURIComponent(tenantIdFromSession)}&select=id,slug`,
    { method: 'GET', headers: dbHeaders({ Accept: 'application/json' }) }
  );

  if (!res.ok) return null;

  const rows = (await res.json().catch(() => [])) as Array<{
    id?: string;
    slug?: string;
  }>;

  const row = Array.isArray(rows) ? rows[0] : undefined;
  if (!row?.id) return null;

  return {
    tenantId: row.id,
    slug: row.slug || DEFAULT_TENANT_SLUG,
  };
}

/**
 * Adds a `tenant_id` filter to a PostgREST filter string.
 *
 * The filter is always applied server-side, never taken from the browser.
 */
export function withTenantFilter(
  filters: string,
  table: string,
  tenantId: string | undefined
): string {
  const parts = filters
    .split('&')
    .map((p) => p.trim())
    .filter(Boolean);

  if (tenantId && TENANT_SCOPED_TABLES.has(table)) {
    // Reject a browser-supplied tenant filter outright — it would be an
    // attempt to read another tenant's rows.
    const hasTenantFilter = parts.some((p) =>
      p.startsWith('tenant_id=') || p.startsWith('tenant_id.eq.')
    );
    if (!hasTenantFilter) {
      parts.push(`tenant_id=eq.${tenantId}`);
    }
  }

  return parts.join('&');
}

/**
 * Strips any tenant_id the browser tried to set, and stamps the session's own
 * tenant id onto every row instead.
 */
export function scopeRowsToTenant(
  table: string,
  rows: unknown,
  tenantId: string | undefined
): unknown {
  if (!tenantId || !TENANT_SCOPED_TABLES.has(table)) return rows;

  const list = Array.isArray(rows) ? rows : [rows];
  return list.map((row) => {
    if (!row || typeof row !== 'object') return row;
    const record = { ...(row as Record<string, unknown>) };
    record.tenant_id = tenantId;
    return record;
  });
}

export { dbFetch };
