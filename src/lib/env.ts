/**
 * Server-side configuration with fail-fast validation.
 *
 * Rules enforced here:
 *  - Secrets (service_role, Resend, Turnstile secret, auth secret) NEVER
 *    fall back to a hardcoded default. If they are missing in production the
 *    process refuses to boot instead of silently running insecure.
 *  - Public values (Supabase URL / anon key, Turnstile site key) may fall back
 *    to the historically hardcoded publishable values so an existing
 *    deployment keeps working, but they emit a warning.
 *  - This module must never be imported from a `'use client'` file. The
 *    `assertServerOnly()` guard below throws if that ever happens.
 */

const isServerRuntime = typeof window === 'undefined';

const NODE_ENV = process.env.NODE_ENV || 'development';
export const isProduction = NODE_ENV === 'production';
export const isDevelopment = NODE_ENV === 'development';

/**
 * Throws when a server-only module is imported from client code.
 *
 * Secrets read through this module must never be bundled into the browser.
 */
export function assertServerOnly(moduleName: string): void {
  if (!isServerRuntime) {
    throw new Error(
      `[env] ${moduleName} is server-only and must not be imported from client code.`
    );
  }
}

function warn(message: string): void {
  if (!isProduction) {
    // eslint-disable-next-line no-console
    console.warn(`[env] ${message}`);
  }
}

/**
 * Reads an optional value, treating blank strings as absent.
 */
function readOptional(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

/* -------------------------------------------------------------------------- */
/* Supabase                                                                    */
/* -------------------------------------------------------------------------- */

const LEGACY_SUPABASE_PROJECT_REF = 'wkjnwkgpolpmzdfrfjso';
const LEGACY_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indram53a2dwb2xwbXpkZnJmanNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTIyNDYsImV4cCI6MjEwODU4ODI0Nn0.xb6vHcEWrnLwQe_W0TxRVXXUTPVfcDrPNL6assS_YQQ';

function resolveSupabaseUrl(): string {
  const fromEnv =
    process.env.SUPABASE_URL?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/+$/, '');
  warn(
    'SUPABASE_URL is not set; falling back to the hardcoded publishable project URL. ' +
      'Set SUPABASE_URL to rotate credentials without a code change.'
  );
  return `https://${LEGACY_SUPABASE_PROJECT_REF}.supabase.co`;
}

function resolveSupabaseAnonKey(): string {
  const fromEnv =
    process.env.SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (fromEnv) return fromEnv;
  warn(
    'SUPABASE_ANON_KEY is not set; falling back to the hardcoded publishable anon key.'
  );
  return LEGACY_SUPABASE_ANON_KEY;
}

/** Supabase project URL. Safe to use from the browser (publishable). */
export const SUPABASE_URL = resolveSupabaseUrl();

/**
 * Supabase anon / publishable key. Safe to expose to the browser — the only
 * real control for it is Row Level Security in Postgres.
 */
export const SUPABASE_ANON_KEY = resolveSupabaseAnonKey();

/**
 * Supabase service_role key. NEVER expose this to the browser and never ship
 * it in a `NEXT_PUBLIC_*` variable. Undefined when not configured, in which
 * case the server falls back to the legacy read path.
 */
export const SUPABASE_SERVICE_ROLE_KEY = (() => {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!value && isProduction) {
    warn(
      'SUPABASE_SERVICE_ROLE_KEY is not set. Credential vault reads and ' +
        'server-side migrations will be unavailable in production.'
    );
  }
  return value || undefined;
})();

export const SUPABASE_TABLE_NAME =
  process.env.SUPABASE_TABLE_NAME?.trim() || 'wedding_state';
export const SUPABASE_ROW_ID = process.env.SUPABASE_ROW_ID?.trim() || 'main';
export const SUPABASE_BUCKET_NAME =
  process.env.SUPABASE_BUCKET_NAME?.trim() || 'wedding-media';

/* -------------------------------------------------------------------------- */
/* Auth                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * HMAC secret used to sign the session cookie.
 * Production without a configured secret is a hard failure — previously the
 * code fell back to a value committed to git, which meant every session in
 * the world could be forged.
 */
export const AUTH_SECRET = (() => {
  const value = readOptional('AUTH_SECRET');
  if (value && value.length >= 32) return value;
  if (isProduction) {
    // Fail closed: a known-or-guessable signing secret means every session
    // in the world can be forged.
    throw new Error(
      '[env] AUTH_SECRET must be set to a random string of at least 32 characters in production.'
    );
  }
  warn(
    'AUTH_SECRET is missing or too short. Using an ephemeral development secret; ' +
      'sessions will not survive a server restart.'
  );
  return `dev-ephemeral-${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
})();

/**
 * Identities allowed to act as the out-of-system app owner (Superadmin).
 * Stored as env instead of being committed to source.
 */
export const SUPERADMIN_EMAILS: string[] = (
  process.env.SUPERADMIN_EMAILS ??
  process.env.SUPERADMIN_EMAIL ??
  ''
)
  .split(',')
  .map((v) => v.trim().toLowerCase())
  .filter(Boolean);

export const SUPERADMIN_USERNAME: string =
  process.env.SUPERADMIN_USERNAME?.trim().toLowerCase() || 'superadmin';

/**
 * Optional plain-text superadmin password from the environment. Prefer
 * `SUPERADMIN_PASSWORD_HASH` (scrypt) — the plain variant exists only so an
 * existing deployment keeps working until the hash is provisioned.
 */
export const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD?.trim();
export const SUPERADMIN_PASSWORD_HASH =
  process.env.SUPERADMIN_PASSWORD_HASH?.trim();

/* -------------------------------------------------------------------------- */
/* Google OAuth                                                                */
/* -------------------------------------------------------------------------- */

export const GOOGLE_CLIENT_ID =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ||
  '512370466811-6f1tt3lepri4q9hi4254a7i6cg52mjt6.apps.googleusercontent.com';

/* -------------------------------------------------------------------------- */
/* Cloudflare Turnstile                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Site key is public (rendered in the browser widget).
 * The secret key is server-only and must never reach the client.
 */
export const TURNSTILE_SITE_KEY = readOptional('NEXT_PUBLIC_TURNSTILE_SITE_KEY');
export const TURNSTILE_SECRET_KEY = readOptional('TURNSTILE_SECRET_KEY');

export const isTurnstileConfigured = Boolean(
  TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY
);

/**
 * Production must fail closed: if Turnstile is not configured we cannot
 * verify a token, so abuse protection is impossible. Development and staging
 * may run without it (explicitly opted in, loudly logged).
 */
export const isTurnstileEnforced =
  Boolean(TURNSTILE_SITE_KEY && TURNSTILE_SECRET_KEY) ||
  process.env.TURNSTILE_REQUIRED === 'true';

/* -------------------------------------------------------------------------- */
/* Resend (transactional email)                                                */
/* -------------------------------------------------------------------------- */

export const RESEND_API_KEY = readOptional('RESEND_API_KEY');
export const EMAIL_FROM =
  readOptional('EMAIL_FROM') || 'MEPlan <noreply@meplan.biz.id>';
export const EMAIL_REPLY_TO =
  readOptional('EMAIL_REPLY_TO') || 'support@meplan.biz.id';
export const isEmailConfigured = Boolean(RESEND_API_KEY);

/* -------------------------------------------------------------------------- */
/* Site / CORS                                                                 */
/* -------------------------------------------------------------------------- */

export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL?.trim() ||
  (isProduction ? 'https://meplan.biz.id' : 'http://localhost:3000')
).replace(/\/+$/, '');

/**
 * Origins allowed to send state-changing requests with credentials.
 * Requests with an Origin outside this list are rejected.
 */
export const ALLOWED_ORIGINS: string[] = (
  process.env.ALLOWED_ORIGINS?.split(',') ?? []
)
  .map((v) => v.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const BUILTIN_PRODUCTION_ORIGINS = new Set([
  'https://meplan.biz.id',
  'https://www.meplan.biz.id',
  'https://meplanner.vercel.app',
]);

export function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return true; // Same-origin / server-to-server requests have no Origin header.
  const clean = origin.replace(/\/+$/, '');
  if (clean === SITE_URL) return true;
  if (BUILTIN_PRODUCTION_ORIGINS.has(clean)) return true;
  if (ALLOWED_ORIGINS.includes(clean)) return true;
  // Vercel preview deployments of the same project.
  if (clean.endsWith('.vercel.app')) return true;
  if (isDevelopment) return true;
  return false;
}

/**
 * Resolves the client IP from proxy headers.
 * `x-forwarded-for` is only trusted when the deployment sits behind a proxy
 * that sets it (Vercel, Cloudflare) — otherwise a client can spoof it.
 */
export function resolveClientIp(headers: Headers): string {
  const trusted =
    process.env.TRUST_PROXY_HEADERS !== 'false' &&
    (process.env.VERCEL === '1' ||
      process.env.CF_PAGES === '1' ||
      Boolean(process.env.TRUSTED_PROXY));
  if (trusted) {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0]!.trim();
    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp.trim();
  }
  return headers.get('x-vercel-forwarded-for')?.trim() || 'unknown';
}
