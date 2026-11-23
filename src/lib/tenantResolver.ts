import { serverStore } from '@/lib/serverStore';
import {
  DEFAULT_TENANT_SLUG,
  dbFetch,
  dbHeaders,
} from '@/lib/tenantScope';

/**
 * Binds a session to a tenant.
 *
 * The tenant is resolved from data the server owns — the workspace row in the
 * database — never from anything the browser sent. If the tenant table does
 * not exist yet (migration 003 not applied) this returns undefined and the
 * app keeps serving the legacy single-workspace tables.
 */
export async function resolveTenantIdForUser(
  user: { id: string; email?: string; clientId?: string } | null
): Promise<string | undefined> {
  if (!user) return undefined;

  // Prefer an explicit workspace id stored on the admin user record.
  const clientId = (user.clientId || '').trim();
  if (!clientId) return undefined;

  try {
    const res = await dbFetch(
      `tenants?slug=eq.${encodeURIComponent(clientId)}&select=id,slug&limit=1`,
      { method: 'GET', headers: dbHeaders({ Accept: 'application/json' }) }
    );

    if (!res.ok) return undefined;

    const rows = (await res.json().catch(() => [])) as Array<{
      id?: string;
      slug?: string;
    }>;

    const row = Array.isArray(rows) ? rows[0] : undefined;
    if (row?.id) return row.id;
  } catch {
    // Tenant table unavailable — fall through to the legacy path.
  }

  return undefined;
}

/**
 * Returns the tenant slug for a session, used for storage paths.
 */
export async function resolveTenantSlugForUser(
  user: { clientId?: string } | null
): Promise<string> {
  const clientId = (user?.clientId || '').trim();
  return clientId || DEFAULT_TENANT_SLUG;
}

/**
 * Ensures the legacy single-workspace deployment has a tenant row.
 *
 * Called lazily on login so the first request after the migration creates
 * the row and binds it to the session. Safe to call repeatedly.
 */
export async function ensureDefaultTenant(
  clientId: string,
  displayName: string
): Promise<string | undefined> {
  const slug = (clientId || '').trim() || DEFAULT_TENANT_SLUG;

  try {
    const existing = await dbFetch(
      `tenants?slug=eq.${encodeURIComponent(slug)}&select=id&limit=1`,
      { method: 'GET', headers: dbHeaders({ Accept: 'application/json' }) }
    );
    if (existing.ok) {
      const rows = (await existing.json().catch(() => [])) as Array<{
        id?: string;
      }>;
      const row = Array.isArray(rows) ? rows[0] : undefined;
      if (row?.id) return row.id;
    }

    const created = await dbFetch('tenants', {
      method: 'POST',
      headers: dbHeaders({
        Prefer: 'resolution=ignore-duplicates,return=representation',
      }),
      body: JSON.stringify({
        slug,
        display_name: displayName || slug,
        package_tier: 'STARTER',
        settings: {},
      }),
    });

    if (!created.ok) return undefined;

    const rows = (await created.json().catch(() => [])) as Array<{
      id?: string;
    }>;
    const row = Array.isArray(rows) ? rows[0] : undefined;
    return row?.id;
  } catch {
    return undefined;
  }
}

/**
 * Best-effort lookup of the admin user's stored workspace slug.
 */
export function findWorkspaceSlugForUser(user: {
  id: string;
  email?: string;
}): string | undefined {
  const admins = serverStore.getAdminUsers();
  const match = admins.find(
    (u) =>
      u.id === user.id ||
      (user.email &&
        u.email &&
        u.email.trim().toLowerCase() === user.email.trim().toLowerCase())
  );
  return match?.clientId?.trim() || undefined;
}
