import type { AdminUser } from '@/types';
import {
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
} from '@/lib/env';

export type AuthProvider = 'local' | 'supabase';

export interface SupabaseAuthTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  expires_at?: number;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
    email_confirmed_at?: string | null;
    confirmed_at?: string | null;
    user_metadata?: Record<string, unknown>;
    app_metadata?: Record<string, unknown>;
  };
}

export interface SupabaseAuthError {
  error?: string;
  error_description?: string;
  msg?: string;
  message?: string;
  code?: string;
}

export interface SupabaseAuthResult {
  ok: boolean;
  status: number;
  data?: SupabaseAuthTokenResponse;
  error?: string;
}

/**
 * Which provider handles new credential logins.
 *
 * `local` remains the default so existing users keep working. Set
 * `AUTH_PROVIDER=supabase` only after Supabase Auth users have been invited
 * and password resets are ready; do not flip this flag until migration
 * preconditions are complete.
 */
export function getAuthProvider(): AuthProvider {
  return process.env.AUTH_PROVIDER?.trim().toLowerCase() === 'supabase'
    ? 'supabase'
    : 'local';
}

/**
 * Sign in with Supabase Auth using the password grant.
 *
 * The service_role key is intentionally NOT used here: user login must be
 * performed with the public anon key and the user password, so the session
 * is a real Supabase Auth JWT that RLS can scope via auth.uid().
 */
export async function signInWithSupabasePassword(
  email: string,
  password: string
): Promise<SupabaseAuthResult> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !password) {
    return { ok: false, status: 400, error: 'Email dan kata sandi wajib diisi.' };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: cleanEmail, password }),
      cache: 'no-store',
    });

    const payload = (await res.json().catch(() => ({}))) as
      | SupabaseAuthTokenResponse
      | SupabaseAuthError;

    if (!res.ok) {
      const errorPayload = payload as SupabaseAuthError;
      return {
        ok: false,
        status: res.status,
        error:
          errorPayload.error_description ||
          errorPayload.msg ||
          errorPayload.message ||
          'Email atau kata sandi tidak valid.',
      };
    }

    const data = payload as SupabaseAuthTokenResponse;
    if (!data.access_token || !data.refresh_token || !data.user?.id) {
      return {
        ok: false,
        status: 502,
        error: 'Respons Supabase Auth tidak lengkap.',
      };
    }

    return { ok: true, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error:
        error instanceof Error
          ? `Tidak dapat menghubungi Supabase Auth: ${error.message}`
          : 'Tidak dapat menghubungi Supabase Auth.',
    };
  }
}

/**
 * Refresh a Supabase access token using its refresh token.
 */
export async function refreshSupabaseSession(
  refreshToken: string
): Promise<SupabaseAuthResult> {
  const cleanToken = refreshToken.trim();
  if (!cleanToken) {
    return { ok: false, status: 400, error: 'Refresh token kosong.' };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: cleanToken }),
      cache: 'no-store',
    });

    const payload = (await res.json().catch(() => ({}))) as
      | SupabaseAuthTokenResponse
      | SupabaseAuthError;

    if (!res.ok) {
      const errorPayload = payload as SupabaseAuthError;
      return {
        ok: false,
        status: res.status,
        error:
          errorPayload.error_description ||
          errorPayload.msg ||
          errorPayload.message ||
          'Sesi Supabase tidak dapat diperpanjang.',
      };
    }

    const data = payload as SupabaseAuthTokenResponse;
    if (!data.access_token || !data.refresh_token || !data.user?.id) {
      return {
        ok: false,
        status: 502,
        error: 'Respons refresh Supabase Auth tidak lengkap.',
      };
    }

    return { ok: true, status: res.status, data };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error:
        error instanceof Error
          ? `Tidak dapat menghubungi Supabase Auth: ${error.message}`
          : 'Tidak dapat menghubungi Supabase Auth.',
    };
  }
}

/**
 * Verifies an access token and maps it to the app's role/tenant profile.
 *
 * Role and tenant are taken from the app's own database mapping, never from
 * Supabase user_metadata. An authenticated email alone does not grant app
 * privileges.
 */
export async function verifySupabaseAccessToken(
  accessToken: string,
  lookupProfile: (authUserId: string, email: string) => Promise<AdminUser | null>
): Promise<AdminUser | null> {
  const token = accessToken.trim();
  if (!token) return null;

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: 'GET',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });

    if (!res.ok) return null;

    const user = (await res.json()) as {
      id?: string;
      email?: string;
    };

    if (!user.id || !user.email) return null;
    return lookupProfile(user.id, user.email.trim().toLowerCase());
  } catch {
    return null;
  }
}

/**
 * Creates a Supabase Auth user. This function is intended for server-only
 * registration / invitation flows. It does not assign roles: the caller must
 * create the app profile + tenant membership in the same transaction or fail.
 */
export async function createSupabaseAuthUser(
  email: string,
  password: string,
  options?: { emailConfirmed?: boolean; userMetadata?: Record<string, unknown> }
): Promise<{ ok: boolean; status: number; userId?: string; error?: string }> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!serviceKey) {
    return {
      ok: false,
      status: 503,
      error: 'SUPABASE_SERVICE_ROLE_KEY belum dikonfigurasi.',
    };
  }

  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
        email_confirm: options?.emailConfirmed ?? false,
        user_metadata: options?.userMetadata || {},
      }),
      cache: 'no-store',
    });

    const payload = (await res.json().catch(() => ({}))) as {
      id?: string;
      user?: { id?: string };
      msg?: string;
      message?: string;
      error_description?: string;
    };

    if (!res.ok) {
      return {
        ok: false,
        status: res.status,
        error:
          payload.error_description ||
          payload.msg ||
          payload.message ||
          'Gagal membuat user Supabase Auth.',
      };
    }

    const userId = payload.id || payload.user?.id;
    return userId
      ? { ok: true, status: res.status, userId }
      : {
          ok: false,
          status: 502,
          error: 'Supabase Auth tidak mengembalikan user id.',
        };
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error:
        error instanceof Error
          ? `Tidak dapat menghubungi Supabase Auth: ${error.message}`
          : 'Tidak dapat menghubungi Supabase Auth.',
    };
  }
}
