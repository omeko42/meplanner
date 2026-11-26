/**
 * Client-safe public Supabase configuration.
 *
 * Only `NEXT_PUBLIC_*` publishable values live here so client components
 * (via `supabaseCloud.ts`) never pull server-only `@/lib/env` into the
 * browser bundle.
 */

const LEGACY_SUPABASE_PROJECT_REF = 'wkjnwkgpolpmzdfrfjso';
const LEGACY_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indram53a2dwb2xwbXpkZnJmanNvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMwMTIyNDYsImV4cCI6MjEwODU4ODI0Nn0.xb6vHcEWrnLwQe_W0TxRVXXUTPVfcDrPNL6assS_YQQ';

export const PUBLIC_SUPABASE_URL = (
  process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
  `https://${LEGACY_SUPABASE_PROJECT_REF}.supabase.co`
).replace(/\/+$/, '');

export const PUBLIC_SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || LEGACY_SUPABASE_ANON_KEY;

export const PUBLIC_SUPABASE_TABLE_NAME =
  process.env.NEXT_PUBLIC_SUPABASE_TABLE_NAME?.trim() || 'wedding_state';

export const PUBLIC_SUPABASE_ROW_ID =
  process.env.NEXT_PUBLIC_SUPABASE_ROW_ID?.trim() || 'main';

export const PUBLIC_SUPABASE_BUCKET_NAME =
  process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET?.trim() || 'wedding-media';
