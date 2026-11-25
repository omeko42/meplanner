import type { AdminUser } from '@/types';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/env';

export interface AuthProfileRecord {
  id: string;
  auth_user_id: string;
  email: string;
  username: string;
  full_name: string;
  role: AdminUser['role'];
  jabatan: string;
  is_default_user: boolean;
  client_id: string;
  client_name: string;
  is_active: boolean;
}

function serviceHeaders(extra?: Record<string, string>): Record<string, string> {
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.');
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

function toAdminUser(row: AuthProfileRecord): AdminUser {
  return {
    id: row.id,
    username: row.username,
    nama: row.full_name,
    role: row.role,
    jabatan: row.jabatan,
    email: row.email,
    isDefaultUser: Boolean(row.is_default_user),
    clientId: row.client_id,
    clientName: row.client_name,
  };
}

/**
 * Looks up the app profile bound to an Auth UID.
 *
 * The user must exist in app_user_profiles and be active. We do not use
 * user_metadata for role or tenant claims: those fields are user-controlled.
 */
export async function getProfileByAuthUserId(
  authUserId: string
): Promise<AdminUser | null> {
  const id = authUserId.trim();
  if (!id) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_user_profiles?auth_user_id=eq.${encodeURIComponent(
        id
      )}&is_active=eq.true&select=*`,
      {
        method: 'GET',
        headers: serviceHeaders({ Accept: 'application/json' }),
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;

    const rows = (await res.json().catch(() => [])) as AuthProfileRecord[];
    if (!Array.isArray(rows) || !rows[0]) return null;
    return toAdminUser(rows[0]);
  } catch {
    return null;
  }
}

/**
 * Looks up an app profile by email address. Used only after Supabase Auth has
 * already verified the email through the password grant / OAuth callback.
 */
export async function getProfileByEmail(email: string): Promise<AdminUser | null> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_user_profiles?email=ilike.${encodeURIComponent(
        cleanEmail
      )}&is_active=eq.true&select=*`,
      {
        method: 'GET',
        headers: serviceHeaders({ Accept: 'application/json' }),
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;

    const rows = (await res.json().catch(() => [])) as AuthProfileRecord[];
    if (!Array.isArray(rows) || !rows[0]) return null;
    return toAdminUser(rows[0]);
  } catch {
    return null;
  }
}

/**
 * Creates the app-side profile after Supabase Auth has created a user.
 * Role and tenant are supplied by the server flow, never copied from
 * user_metadata or a body field.
 */
export async function createAppUserProfile(input: {
  authUserId: string;
  email: string;
  username: string;
  fullName: string;
  role: AdminUser['role'];
  jabatan: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  isDefaultUser?: boolean;
}): Promise<{ ok: boolean; error?: string }> {
  try {
    const row = {
      auth_user_id: input.authUserId,
      email: input.email.trim().toLowerCase(),
      username: input.username.trim().toLowerCase(),
      full_name: input.fullName.trim(),
      role: input.role,
      jabatan: input.jabatan,
      tenant_id: input.tenantId,
      client_id: input.clientId,
      client_name: input.clientName,
      is_default_user: Boolean(input.isDefaultUser),
      is_active: true,
    };

    const res = await fetch(`${SUPABASE_URL}/rest/v1/app_user_profiles`, {
      method: 'POST',
      headers: serviceHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(row),
      cache: 'no-store',
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return { ok: false, error: `Database profile HTTP ${res.status}: ${detail.slice(0, 240)}` };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Gagal membuat profile aplikasi.',
    };
  }
}

/**
 * Resolves a user profile from verified Auth identity, in order of trust:
 * Auth UID first, then verified email. The requested email alone is never
 * accepted as identity.
 */
export async function resolveVerifiedProfile(
  authUserId: string,
  verifiedEmail: string
): Promise<AdminUser | null> {
  return (await getProfileByAuthUserId(authUserId)) ||
    (await getProfileByEmail(verifiedEmail));
}
