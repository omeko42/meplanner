import { NextResponse } from 'next/server';
import { isAllowedOrigin, resolveClientIp } from '@/lib/env';

export interface ApiErrorBody {
  success: false;
  error: string;
  code?: string;
}

/**
 * Consistent JSON error response for API routes.
 */
export function apiError(
  message: string,
  status: number,
  options?: { code?: string; headers?: Record<string, string> }
): NextResponse<ApiErrorBody> {
  return NextResponse.json(
    { success: false, error: message, ...(options?.code ? { code: options.code } : {}) },
    { status, headers: options?.headers }
  );
}

export function apiOk<T extends object>(
  payload: T,
  status = 200,
  headers?: Record<string, string>
): NextResponse<T & { success: true }> {
  return NextResponse.json(
    { success: true, ...payload } as T & { success: true },
    { status, headers }
  );
}

/**
 * Rejects state-changing requests whose Origin is not allowed.
 *
 * SameSite=Lax already blocks cross-site cookie sends on POST, but an
 * explicit Origin check closes the gap for browsers that do send Origin on
 * cross-origin requests and for non-browser clients.
 */
export function rejectDisallowedOrigin(request: Request): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!isAllowedOrigin(origin)) {
    return apiError('Origin tidak diizinkan.', 403, { code: 'BAD_ORIGIN' });
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Rate limiting                                                               */
/* -------------------------------------------------------------------------- */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __mepRateLimitStore: Map<string, RateLimitEntry> | undefined;
}

function getStore(): Map<string, RateLimitEntry> {
  if (!globalThis.__mepRateLimitStore) {
    globalThis.__mepRateLimitStore = new Map<string, RateLimitEntry>();
  }
  return globalThis.__mepRateLimitStore;
}

/**
 * In-process fixed-window rate limiter.
 *
 * This is a mitigation, not a hard boundary: on serverless each instance
 * keeps its own counters, so a distributed attacker can multiply the limit
 * by the instance count. A shared store (Upstash/Redis) is the durable fix —
 * see docs/SECURITY-HARDENING.md. The point of keeping it here is that a
 * single instance still refuses the obvious burst.
 */
export function rateLimit(
  key: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const now = Date.now();
  const store = getStore();
  const existing = store.get(key);

  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + options.windowMs });
    return {
      allowed: true,
      remaining: options.limit - 1,
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= options.limit) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds: Math.ceil((existing.resetAt - now) / 1000),
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: options.limit - existing.count,
    retryAfterSeconds: 0,
  };
}

/**
 * Rate limit keyed by client IP + an arbitrary scope (e.g. action or email).
 */
export function rateLimitByIp(
  request: Request,
  scope: string,
  options: { limit: number; windowMs: number }
): { allowed: boolean; remaining: number; retryAfterSeconds: number } {
  const ip = resolveClientIp(request.headers);
  return rateLimit(`${scope}:${ip}`, options);
}

/** Removes expired entries so the in-process map cannot grow without bound. */
export function pruneRateLimitStore(): void {
  const now = Date.now();
  const store = getStore();
  const expiredKeys: string[] = [];
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) expiredKeys.push(key);
  });
  for (const key of expiredKeys) store.delete(key);
}
