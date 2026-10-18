import { WeddingDatabaseSchema, WeddingSettings } from '@/types';
import {
  INITIAL_SETTINGS,
  INITIAL_TASKS,
  INITIAL_GUESTS,
  INITIAL_WISHES,
  INITIAL_BUDGET_ITEMS,
  INITIAL_ADMIN_USERS,
} from '@/data/seedData';

export const SUPABASE_PROJECT_REF = 'gwoyalvivfemaeacbyvi';
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  `https://${SUPABASE_PROJECT_REF}.supabase.co`;

export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3b3lhbHZpdmZlbWFlYWNieXZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTIyNzQ3MDYsImV4cCI6MjEwNzg1MDcwNn0.TbcDMu0IYjfh4B7UW7Q5laVXlDQ_OhazvL4jXAB-o34';

export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  'sb_publishable_huGPlGBgndER8CbMPtTH-g_gCbYXkKT';

export const SUPABASE_TABLE_NAME = 'wedding_state';
export const SUPABASE_ROW_ID = 'main';
export const SUPABASE_BUCKET_NAME = 'wedding';
export const SUPABASE_OBJECT_PATH = 'wedding_db.json';

export const SUPABASE_SETUP_SQL = `create table if not exists public.wedding_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.wedding_state disable row level security;
grant all on table public.wedding_state to anon, authenticated, service_role;`;

export type CloudSyncStatus =
  | 'IDLE'
  | 'SYNCING'
  | 'SYNCED'
  | 'NEEDS_TABLE_SETUP'
  | 'OFFLINE';

type StatusListener = (status: CloudSyncStatus, lastDetail?: string) => void;

let currentCloudStatus: CloudSyncStatus = 'IDLE';
let currentCloudDetail = '';
const statusListeners = new Set<StatusListener>();

export function getCloudSyncStatus(): {
  status: CloudSyncStatus;
  detail: string;
} {
  return { status: currentCloudStatus, detail: currentCloudDetail };
}

export function subscribeCloudSyncStatus(
  listener: StatusListener
): () => void {
  statusListeners.add(listener);
  listener(currentCloudStatus, currentCloudDetail);
  return () => {
    statusListeners.delete(listener);
  };
}

function setCloudStatus(status: CloudSyncStatus, detail = ''): void {
  currentCloudStatus = status;
  currentCloudDetail = detail;
  statusListeners.forEach((fn) => {
    try {
      fn(status, detail);
    } catch {
      // Ignore listener error
    }
  });
}

function getSupabaseHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

function normalizeCloudState(
  parsed: Partial<WeddingDatabaseSchema>,
  fallbackTimestamp?: string
): WeddingDatabaseSchema {
  return {
    settings: parsed.settings
      ? { ...INITIAL_SETTINGS, ...parsed.settings }
      : INITIAL_SETTINGS,
    tasks: Array.isArray(parsed.tasks) ? parsed.tasks : INITIAL_TASKS,
    guests: Array.isArray(parsed.guests) ? parsed.guests : INITIAL_GUESTS,
    wishes: Array.isArray(parsed.wishes) ? parsed.wishes : INITIAL_WISHES,
    budgetItems: Array.isArray(parsed.budgetItems)
      ? parsed.budgetItems
      : INITIAL_BUDGET_ITEMS,
    adminUsers:
      Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
        ? parsed.adminUsers
        : INITIAL_ADMIN_USERS,
    lastSyncedAt:
      parsed.lastSyncedAt || fallbackTimestamp || '2026-01-01T00:00:00.000Z',
  };
}

function createCompactAudioCopy(
  state: WeddingDatabaseSchema
): WeddingDatabaseSchema {
  const compactSettings: WeddingSettings = {
    ...state.settings,
    musicPlaylist: (state.settings.musicPlaylist || []).map((m) =>
      m.url && m.url.startsWith('data:audio/')
        ? { ...m, url: 'synth:canon-in-d' }
        : m
    ),
  };
  return {
    ...state,
    settings: compactSettings,
  };
}

/**
 * Load WeddingDatabaseSchema from Supabase PostgreSQL table `public.wedding_state`
 * (or fallback to Supabase Storage bucket `wedding/wedding_db.json` if configured).
 */
export async function loadStateFromSupabase(): Promise<{
  state: WeddingDatabaseSchema | null;
  tableExists: boolean;
}> {
  try {
    const restUrl = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=id,data,updated_at`;
    const res = await fetch(restUrl, {
      method: 'GET',
      headers: getSupabaseHeaders({
        Accept: 'application/json',
      }),
      cache: 'no-store',
    });

    if (res.ok) {
      const rows = (await res.json()) as Array<{
        id: string;
        data: Partial<WeddingDatabaseSchema>;
        updated_at?: string;
      }>;
      if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
        const loaded = normalizeCloudState(rows[0].data, rows[0].updated_at);
        setCloudStatus('SYNCED', loaded.lastSyncedAt || '');
        return { state: loaded, tableExists: true };
      }
      // Table exists, just empty (no row yet)
      setCloudStatus('SYNCED', 'Tabel siap (belum ada baris)');
      return { state: null, tableExists: true };
    }

    // Check if 404 / PGRST205 (table not created yet)
    const errText = await res.text();
    const isTableMissing =
      res.status === 404 ||
      errText.includes('PGRST205') ||
      errText.includes('Could not find the table') ||
      errText.includes('relation') ||
      errText.includes('does not exist');

    // Try Storage Bucket fallback (`wedding/wedding_db.json`)
    try {
      const storageUrl = `${SUPABASE_URL}/storage/v1/object/public/${SUPABASE_BUCKET_NAME}/${SUPABASE_OBJECT_PATH}?t=${Date.now()}`;
      const stRes = await fetch(storageUrl, { cache: 'no-store' });
      if (stRes.ok) {
        const stData = (await stRes.json()) as Partial<WeddingDatabaseSchema>;
        const loaded = normalizeCloudState(stData);
        setCloudStatus('SYNCED', loaded.lastSyncedAt || '');
        return { state: loaded, tableExists: true };
      }
    } catch {
      // Ignore storage fallback error
    }

    if (isTableMissing) {
      setCloudStatus(
        'NEEDS_TABLE_SETUP',
        'Tabel public.wedding_state belum dibuat di SQL Editor Supabase'
      );
      return { state: null, tableExists: false };
    }

    setCloudStatus('OFFLINE', `HTTP ${res.status}`);
    return { state: null, tableExists: false };
  } catch (err) {
    setCloudStatus(
      'OFFLINE',
      err instanceof Error ? err.message : 'Gagal terhubung ke Supabase'
    );
    return { state: null, tableExists: false };
  }
}

/**
 * Upsert WeddingDatabaseSchema to Supabase PostgreSQL table `public.wedding_state`
 * (and Storage bucket fallback if needed).
 */
export async function saveStateToSupabase(
  state: WeddingDatabaseSchema
): Promise<boolean> {
  setCloudStatus('SYNCING', 'Menyimpan ke Supabase...');
  const updatedAt = state.lastSyncedAt || new Date().toISOString();
  const payloadState: WeddingDatabaseSchema = {
    ...state,
    lastSyncedAt: updatedAt,
  };

  const tryUpsertTable = async (dataToSave: WeddingDatabaseSchema): Promise<Response> => {
    const restUrl = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?on_conflict=id`;
    return fetch(restUrl, {
      method: 'POST',
      headers: getSupabaseHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify({
        id: SUPABASE_ROW_ID,
        data: dataToSave,
        updated_at: updatedAt,
      }),
    });
  };

  try {
    let res = await tryUpsertTable(payloadState);

    // If payload was too large due to embedded base64 audio, retry with compact audio copy
    if (res.status === 413) {
      res = await tryUpsertTable(createCompactAudioCopy(payloadState));
    }

    if (res.ok) {
      setCloudStatus('SYNCED', updatedAt);
      return true;
    }

    const errText = await res.text();
    const isTableMissing =
      res.status === 404 ||
      errText.includes('PGRST205') ||
      errText.includes('Could not find the table') ||
      errText.includes('relation') ||
      errText.includes('does not exist');

    // Also try Storage Bucket fallback in case bucket `wedding` exists
    try {
      const storageUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET_NAME}/${SUPABASE_OBJECT_PATH}`;
      const stRes = await fetch(storageUrl, {
        method: 'POST',
        headers: getSupabaseHeaders({
          'x-upsert': 'true',
        }),
        body: JSON.stringify(payloadState),
      });
      if (stRes.ok) {
        setCloudStatus('SYNCED', updatedAt);
        return true;
      }
    } catch {
      // Ignore storage fallback error
    }

    if (isTableMissing) {
      setCloudStatus(
        'NEEDS_TABLE_SETUP',
        'Tabel public.wedding_state belum dibuat di SQL Editor Supabase'
      );
      return false;
    }

    setCloudStatus('OFFLINE', `HTTP ${res.status}: ${errText.slice(0, 120)}`);
    return false;
  } catch (err) {
    setCloudStatus(
      'OFFLINE',
      err instanceof Error ? err.message : 'Gagal menyimpan ke Supabase'
    );
    return false;
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: WeddingDatabaseSchema | null = null;

/**
 * Debounced background save to Supabase for client-side interactive edits.
 */
export function queueSaveStateToSupabase(
  state: WeddingDatabaseSchema,
  delayMs = 500
): void {
  pendingState = state;
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    const toSave = pendingState;
    pendingState = null;
    debounceTimer = null;
    if (toSave) {
      void saveStateToSupabase(toSave);
    }
  }, delayMs);
}
