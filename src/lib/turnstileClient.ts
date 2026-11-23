/**
 * Client-safe access to the public Turnstile site key.
 *
 * This module is deliberately separate from `lib/turnstile.ts`: that file
 * imports `lib/env.ts`, which reads server-side secrets. Importing it from a
 * `'use client'` component would pull the server module into the browser
 * bundle. Only `NEXT_PUBLIC_*` values may be read here.
 */
export const TURNSTILE_PUBLIC_SITE_KEY =
  process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() || '';
