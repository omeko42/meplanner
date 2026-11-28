import { cookies } from 'next/headers';
import type { NextRequest, NextResponse } from 'next/server';
import { isProduction } from '@/lib/env';

export const SESSION_COOKIE_NAME = 'wedding_admin_session';
export const SESSION_TTL_SECONDS = 60 * 60 * 4; // 4 jam, sliding

/**
 * In production the cookie uses the `__Host-` prefix, which browsers enforce:
 * it must be Secure, have no Domain attribute, and Path=/. That removes the
 * cookie-injection and subdomain-takeover vectors.
 */
export const ACTIVE_SESSION_COOKIE_NAME = isProduction
  ? `__Host-${SESSION_COOKIE_NAME}`
  : SESSION_COOKIE_NAME;

export interface SessionCookieOptions {
  maxAge?: number;
}

/**
 * Writes the session cookie on a response.
 */
export function setSessionCookie(
  response: NextResponse,
  token: string,
  options?: SessionCookieOptions
): NextResponse {
  response.cookies.set(ACTIVE_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: options?.maxAge ?? SESSION_TTL_SECONDS,
  });
  return response;
}

/**
 * Removes the session cookie on a response.
 */
export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(ACTIVE_SESSION_COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    path: '/',
    maxAge: 0,
  });
  if (ACTIVE_SESSION_COOKIE_NAME !== SESSION_COOKIE_NAME) {
    response.cookies.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      sameSite: 'lax',
      secure: isProduction,
      path: '/',
      maxAge: 0,
    });
  }
  return response;
}

/**
 * Reads the session token from a request.
 */
export function readSessionToken(request: NextRequest): string | undefined {
  return (
    request.cookies.get(ACTIVE_SESSION_COOKIE_NAME)?.value ||
    request.cookies.get(SESSION_COOKIE_NAME)?.value ||
    undefined
  );
}

/**
 * Reads the session token from the server-side cookie store.
 * Used by route handlers and server components that have no request object.
 */
export function readSessionTokenFromStore(): string | undefined {
  try {
    return cookies().get(ACTIVE_SESSION_COOKIE_NAME)?.value ||
      cookies().get(SESSION_COOKIE_NAME)?.value ||
      undefined;
  } catch {
    return undefined;
  }
}
