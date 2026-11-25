import { NextRequest, NextResponse } from 'next/server';
import { isProduction } from '@/lib/env';
import type { SessionUser } from '@/lib/auth';

export const SUPABASE_ACCESS_COOKIE = 'mep_supa_access';
export const SUPABASE_REFRESH_COOKIE = 'mep_supa_refresh';
export const LOCAL_SESSION_COOKIE = 'wedding_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 4;

/**
 * On production the session cookie uses the `__Host-` prefix, which browsers
 * enforce must be Secure, Path=/ and have no Domain attribute.
 */
export const ACTIVE_LOCAL_SESSION_COOKIE = isProduction
  ? `__Host-${LOCAL_SESSION_COOKIE}`
  : LOCAL_SESSION_COOKIE;

export const ACTIVE_SUPABASE_ACCESS_COOKIE = isProduction
  ? '__Host-mep_supa_access'
  : SUPABASE_ACCESS_COOKIE;

export const ACTIVE_SUPABASE_REFRESH_COOKIE = isProduction
  ? '__Host-mep_supa_refresh'
  : SUPABASE_REFRESH_COOKIE;

const commonCookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: 'lax' as const,
  path: '/',
};

/** Issues the existing local session cookie (legacy auth provider). */
export function setLocalSessionCookie(
  response: NextResponse,
  token: string,
  maxAge = SESSION_TTL_SECONDS
): NextResponse {
  response.cookies.set(ACTIVE_LOCAL_SESSION_COOKIE, token, {
    ...commonCookieOptions,
    maxAge,
  });
  return response;
}

/**
 * Stores Supabase access + refresh tokens in HttpOnly cookies. The browser
 * never receives a token it can exfiltrate with JavaScript; requests go
 * through the server, which attaches the token to Supabase calls.
 */
export function setSupabaseSessionCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string,
  expiresIn = SESSION_TTL_SECONDS
): NextResponse {
  response.cookies.set(ACTIVE_SUPABASE_ACCESS_COOKIE, accessToken, {
    ...commonCookieOptions,
    maxAge: Math.max(60, Math.min(expiresIn, SESSION_TTL_SECONDS)),
  });
  // Refresh tokens are long-lived and rotated by Supabase. Keep the cookie
  // at the provider's maximum session length but never expose it to JS.
  response.cookies.set(ACTIVE_SUPABASE_REFRESH_COOKIE, refreshToken, {
    ...commonCookieOptions,
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

/** Clears all supported session cookies on logout. */
export function clearAuthCookies(response: NextResponse): NextResponse {
  for (const name of [
    ACTIVE_LOCAL_SESSION_COOKIE,
    ACTIVE_SUPABASE_ACCESS_COOKIE,
    ACTIVE_SUPABASE_REFRESH_COOKIE,
    LOCAL_SESSION_COOKIE,
    SUPABASE_ACCESS_COOKIE,
    SUPABASE_REFRESH_COOKIE,
  ]) {
    response.cookies.set(name, '', {
      ...commonCookieOptions,
      maxAge: 0,
    });
  }
  return response;
}

/** Reads the Supabase access token from the request cookies. */
export function readSupabaseAccessToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(ACTIVE_SUPABASE_ACCESS_COOKIE)?.value ||
    request.cookies.get(SUPABASE_ACCESS_COOKIE)?.value ||
    undefined
  );
}

/** Reads the Supabase refresh token from the request cookies. */
export function readSupabaseRefreshToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(ACTIVE_SUPABASE_REFRESH_COOKIE)?.value ||
    request.cookies.get(SUPABASE_REFRESH_COOKIE)?.value ||
    undefined
  );
}

/** Reads the custom local session token from the request cookies. */
export function readLocalSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(ACTIVE_LOCAL_SESSION_COOKIE)?.value ||
    request.cookies.get(LOCAL_SESSION_COOKIE)?.value ||
    undefined
  );
}

/**
 * Issues auth cookies and a common AdminUser response shape.
 * The response object itself contains only the safe profile, never the
 * access/refresh tokens.
 */
export function issueSupabaseSession(
  response: NextResponse,
  session: { accessToken: string; refreshToken: string; expiresIn?: number },
  user: SessionUser
): NextResponse {
  setSupabaseSessionCookies(
    response,
    session.accessToken,
    session.refreshToken,
    session.expiresIn
  );
  return response;
}

/** Safe profile projection for API responses. */
export function publicSessionUser(user: SessionUser): SessionUser {
  return {
    id: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role,
    jabatan: user.jabatan,
    email: user.email,
    isDefaultUser: user.isDefaultUser,
    clientId: user.clientId,
    clientName: user.clientName,
    tenantId: user.tenantId,
  };
}
