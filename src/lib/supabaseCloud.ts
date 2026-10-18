import {
  AuditLogEntry,
  GalleryPhotoItem,
  WeddingDatabaseSchema,
  WeddingSettings,
} from '@/types';
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

export const SUPABASE_SETUP_SQL = `-- ============================================================================
-- 1. NAIKKAN BATAS TIMEOUT DATABASE (MENCEGAH ERROR 57014 STATEMENT TIMEOUT)
-- ============================================================================
alter role anon set statement_timeout = '30s';
alter role authenticated set statement_timeout = '30s';
alter role service_role set statement_timeout = '60s';

-- ============================================================================
-- 2. TABEL UTAMA SNAPSHOT & SHARDING (public.wedding_state)
-- ============================================================================
create table if not exists public.wedding_state (
  id text primary key,
  data jsonb not null,
  updated_at timestamptz default now()
);
alter table public.wedding_state enable row level security;
drop policy if exists "allow_all" on public.wedding_state;
drop policy if exists "wedding_state_main_access" on public.wedding_state;
drop policy if exists "wedding_state_full_access" on public.wedding_state;
create policy "wedding_state_full_access" on public.wedding_state
  for all to anon, authenticated
  using (true) with check (true);
grant all on table public.wedding_state to anon, authenticated, service_role;

-- ============================================================================
-- 3. TABEL PENGATURAN & PROFIL MEMPELAI (public.wedding_settings)
-- ============================================================================
create table if not exists public.wedding_settings (
  id text primary key default 'main',
  site_title text,
  groom_full_name text,
  bride_full_name text,
  wedding_datetime text,
  biston_datetime text,
  total_budget_cap numeric default 0,
  settings_json jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wedding_settings enable row level security;
drop policy if exists "wedding_settings_access" on public.wedding_settings;
create policy "wedding_settings_access" on public.wedding_settings
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_settings to anon, authenticated, service_role;

-- ============================================================================
-- 4. TABEL PENYIMPANAN FOTO & MEDIA TERPISAH (public.wedding_media)
--    Menyimpan foto per slot agar edit teks/tamu tidak meng-upload ulang semua foto
-- ============================================================================
create table if not exists public.wedding_media (
  slot_key text primary key,
  setting_id text references public.wedding_settings(id) on delete cascade default 'main',
  label text,
  media_type text default 'image',
  media_url text not null,
  adjustment jsonb default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wedding_media enable row level security;
drop policy if exists "wedding_media_access" on public.wedding_media;
create policy "wedding_media_access" on public.wedding_media
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_media to anon, authenticated, service_role;

-- ============================================================================
-- 5. TABEL CHECKLIST KESIAPAN PANITIA (public.wedding_tasks)
-- ============================================================================
create table if not exists public.wedding_tasks (
  id text primary key,
  setting_id text references public.wedding_settings(id) on delete cascade default 'main',
  category text,
  timeline_phase text,
  title text not null,
  due text,
  priority text,
  owner text,
  status text,
  done boolean default false,
  notes text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wedding_tasks enable row level security;
drop policy if exists "wedding_tasks_access" on public.wedding_tasks;
create policy "wedding_tasks_access" on public.wedding_tasks
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_tasks to anon, authenticated, service_role;

-- ============================================================================
-- 6. TABEL DAFTAR TAMU & KONFIRMASI RSVP (public.wedding_guests)
-- ============================================================================
create table if not exists public.wedding_guests (
  id text primary key,
  setting_id text references public.wedding_settings(id) on delete cascade default 'main',
  invitation_code text,
  guest_name text not null,
  guest_type text,
  side text,
  institution text,
  invitation_format text,
  priority text,
  pax integer default 2,
  rsvp_status text,
  delivery_status text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wedding_guests enable row level security;
drop policy if exists "wedding_guests_access" on public.wedding_guests;
create policy "wedding_guests_access" on public.wedding_guests
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_guests to anon, authenticated, service_role;

-- ============================================================================
-- 7. TABEL BUKU TAMU & UCAPAN DOA (public.wedding_wishes)
-- ============================================================================
create table if not exists public.wedding_wishes (
  id text primary key,
  setting_id text references public.wedding_settings(id) on delete cascade default 'main',
  guest_name text not null,
  institution text,
  relation text,
  rsvp_status text,
  pax integer default 0,
  message text,
  is_pinned boolean default false,
  reply_from_couple text,
  created_at text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wedding_wishes enable row level security;
drop policy if exists "wedding_wishes_access" on public.wedding_wishes;
create policy "wedding_wishes_access" on public.wedding_wishes
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_wishes to anon, authenticated, service_role;

-- ============================================================================
-- 8. TABEL ANGGARAN & VENDOR MONETER (public.wedding_budgets)
-- ============================================================================
create table if not exists public.wedding_budgets (
  id text primary key,
  setting_id text references public.wedding_settings(id) on delete cascade default 'main',
  category text,
  item_name text not null,
  vendor_name text,
  estimated_cost numeric default 0,
  actual_cost numeric default 0,
  paid_amount numeric default 0,
  payment_status text,
  due_date text,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wedding_budgets enable row level security;
drop policy if exists "wedding_budgets_access" on public.wedding_budgets;
create policy "wedding_budgets_access" on public.wedding_budgets
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_budgets to anon, authenticated, service_role;

-- ============================================================================
-- 9. TABEL AKUN INTI & PANITIA (public.wedding_users)
-- ============================================================================
create table if not exists public.wedding_users (
  id text primary key,
  setting_id text references public.wedding_settings(id) on delete cascade default 'main',
  username text not null,
  nama text not null,
  role text not null,
  jabatan text,
  is_default_user boolean default false,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wedding_users enable row level security;
drop policy if exists "wedding_users_access" on public.wedding_users;
create policy "wedding_users_access" on public.wedding_users
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_users to anon, authenticated, service_role;`;

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

// ============================================================================
// REAL-TIME AUDIT & ERROR LOG SYSTEM
// ============================================================================
const AUDIT_LOG_STORAGE_KEY = 'my_wedding_manager_audit_logs_v1';
const MAX_AUDIT_LOGS = 250;
type AuditLogListener = (logs: AuditLogEntry[]) => void;
const auditListeners = new Set<AuditLogListener>();
let memoryAuditLogs: AuditLogEntry[] | null = null;

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return memoryAuditLogs || [];
  if (memoryAuditLogs !== null) return memoryAuditLogs;
  try {
    const raw = localStorage.getItem(AUDIT_LOG_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        memoryAuditLogs = parsed;
        return memoryAuditLogs;
      }
    }
  } catch {
    // Ignore storage read error
  }
  memoryAuditLogs = [];
  return memoryAuditLogs;
}

export function appendAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'timestamp'> & { timestamp?: string }
): AuditLogEntry {
  const newEntry: AuditLogEntry = {
    id: `log_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: entry.timestamp || new Date().toISOString(),
    actor: entry.actor || 'admin',
    module: entry.module,
    action: entry.action,
    status: entry.status,
    summary: entry.summary,
    detail: entry.detail,
  };

  if (typeof window !== 'undefined') {
    const prefix = `[AUDIT][${newEntry.status}][${newEntry.module}:${newEntry.action}]`;
    if (newEntry.status === 'ERROR') {
      console.warn(prefix, newEntry.summary, newEntry.detail || '');
    } else {
      console.info(prefix, newEntry.summary, newEntry.detail || '');
    }
  }

  const current = getAuditLogs();
  const next = [newEntry, ...current].slice(0, MAX_AUDIT_LOGS);
  memoryAuditLogs = next;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(AUDIT_LOG_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignore quota exceeded
    }
  }

  auditListeners.forEach((fn) => {
    try {
      fn(next);
    } catch {
      // Ignore listener error
    }
  });

  return newEntry;
}

export function clearAuditLogs(): void {
  memoryAuditLogs = [];
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(AUDIT_LOG_STORAGE_KEY);
    } catch {
      // Ignore
    }
  }
  auditListeners.forEach((fn) => {
    try {
      fn([]);
    } catch {
      // Ignore
    }
  });
}

export function subscribeAuditLogs(listener: AuditLogListener): () => void {
  auditListeners.add(listener);
  listener(getAuditLogs());
  return () => {
    auditListeners.delete(listener);
  };
}

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

function healStalePlaceholderSettings(s: WeddingSettings): WeddingSettings {
  const next = { ...INITIAL_SETTINGS, ...s };
  if (
    !next.groomFullName ||
    next.groomFullName === 'Eko' ||
    next.groomFullName === 'Nama Mempelai Pria'
  ) {
    next.groomFullName = INITIAL_SETTINGS.groomFullName;
    next.groomNickname = INITIAL_SETTINGS.groomNickname;
    next.groomRankAndTitle = INITIAL_SETTINGS.groomRankAndTitle;
    next.groomUnit = INITIAL_SETTINGS.groomUnit;
    next.groomParents = INITIAL_SETTINGS.groomParents;
    next.groomOrigin = INITIAL_SETTINGS.groomOrigin;
  }
  if (!next.groomNickname || next.groomNickname === 'Mempelai Pria') {
    next.groomNickname = INITIAL_SETTINGS.groomNickname;
  }
  if (
    !next.brideFullName ||
    next.brideFullName === 'Nama Mempelai Wanita'
  ) {
    next.brideFullName = INITIAL_SETTINGS.brideFullName;
    next.brideNickname = INITIAL_SETTINGS.brideNickname;
    next.brideTitle = INITIAL_SETTINGS.brideTitle;
    next.brideParents = INITIAL_SETTINGS.brideParents;
    next.brideOrigin = INITIAL_SETTINGS.brideOrigin;
  }
  if (!next.brideNickname || next.brideNickname === 'Mempelai Wanita') {
    next.brideNickname = INITIAL_SETTINGS.brideNickname;
  }

  // Heal custom tracks whose URL was previously overwritten with '/musik/beautiful-in-white.mp3'
  if (Array.isArray(next.musicPlaylist)) {
    next.musicPlaylist = next.musicPlaylist.map((m) => {
      if (m.url === '/musik/beautiful-in-white.mp3' && !/beautiful\s*in\s*white/i.test(m.title || '')) {
        if (/pernikahan\s*kita/i.test(m.title || '')) {
          return {
            ...m,
            url: `${SUPABASE_URL}/storage/v1/object/public/wedding-media/music/pernikahan-kita.mp3`,
          };
        }
        if (/jalaraning\s*tresna/i.test(m.title || '')) {
          return {
            ...m,
            url: `${SUPABASE_URL}/storage/v1/object/public/wedding-media/music/jalaraning-tresna-woro.mp3`,
          };
        }
      }
      return m;
    });
    if (
      next.musicPlaylist.length > 0 &&
      (!next.activeMusicTrackId ||
        !next.musicPlaylist.some((m) => m.id === next.activeMusicTrackId))
    ) {
      next.activeMusicTrackId = next.musicPlaylist[0].id;
      next.musicTitle = next.musicPlaylist[0].title;
      next.musicArtist = next.musicPlaylist[0].artist;
    }
  }
  if (!next.subtitle || next.subtitle.includes('Biston: 18 Desember 2026')) {
    if (Array.isArray(next.scheduleEvents) && next.scheduleEvents.length > 0) {
      const activeEvents = next.scheduleEvents.filter(
        (e) => e.showOnInvitation !== false
      );
      const sourceEvents =
        activeEvents.length > 0 ? activeEvents : next.scheduleEvents;
      const parts = sourceEvents
        .map((ev) => {
          const shortTitle =
            (ev.title || '')
              .trim()
              .replace(/^Acara\s+/i, '')
              .replace(/^Ibadah\s+/i, '')
              .replace(/\s*\/.*$/, '')
              .replace(/\s+Pernikahan$/i, '')
              .trim() || (ev.title || '').trim();
          const cleanDate =
            (ev.dateLabel || '').replace(/^[A-Za-zÀ-ÿ]+,\s*/, '').trim() ||
            (ev.dateLabel || '').trim();
          if (!shortTitle && !cleanDate) return '';
          if (!cleanDate) return shortTitle;
          return `${shortTitle}: ${cleanDate}`;
        })
        .filter(Boolean);
      const city = (next.groomOrigin || next.brideOrigin || 'Semarang').trim();
      if (
        city &&
        !parts.some((p) => p.toLowerCase().includes(city.toLowerCase()))
      ) {
        parts.push(city);
      }
      next.subtitle = parts.join(' • ');
    } else {
      next.subtitle = INITIAL_SETTINGS.subtitle;
    }
  }
  return next;
}

export async function uploadAudioToSupabaseStorage(
  fileOrDataUrl: File | string,
  trackId: string
): Promise<string | null> {
  try {
    let bodyBlob: Blob | File;
    let contentType = 'audio/mpeg';
    let ext = 'mp3';

    if (typeof fileOrDataUrl === 'string') {
      if (!fileOrDataUrl.startsWith('data:')) return fileOrDataUrl;
      const mimeMatch = fileOrDataUrl.match(/^data:([^;]+);base64,/i);
      if (mimeMatch && mimeMatch[1]) {
        contentType = mimeMatch[1];
        if (contentType.includes('wav')) ext = 'wav';
        else if (contentType.includes('ogg')) ext = 'ogg';
        else if (contentType.includes('mp4') || contentType.includes('m4a')) ext = 'm4a';
      }
      const res = await fetch(fileOrDataUrl);
      bodyBlob = await res.blob();
    } else {
      bodyBlob = fileOrDataUrl;
      contentType = fileOrDataUrl.type || 'audio/mpeg';
      const nameExt = fileOrDataUrl.name.split('.').pop()?.toLowerCase();
      if (nameExt && ['mp3', 'm4a', 'wav', 'ogg', 'aac'].includes(nameExt)) {
        ext = nameExt;
      }
    }

    const safeId = trackId.replace(/[^a-zA-Z0-9_-]/g, '_');
    const objectPath = `music/${safeId}.${ext}`;
    const upRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/wedding-media/${objectPath}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: bodyBlob,
      }
    );
    if (!upRes.ok) return null;
    return `${SUPABASE_URL}/storage/v1/object/public/wedding-media/${objectPath}`;
  } catch {
    return null;
  }
}

export async function deleteMediaFromSupabaseStorage(
  mediaUrl?: string
): Promise<void> {
  if (!mediaUrl || typeof mediaUrl !== 'string') return;
  try {
    const marker = '/storage/v1/object/public/wedding-media/';
    const idx = mediaUrl.indexOf(marker);
    if (idx === -1) return;
    const objectPath = mediaUrl.slice(idx + marker.length).split('?')[0];
    if (!objectPath) return;
    await fetch(`${SUPABASE_URL}/storage/v1/object/wedding-media/${objectPath}`, {
      method: 'DELETE',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      },
    });
  } catch {
    // Ignore storage delete errors
  }
}

export const deleteAudioFromSupabaseStorage = deleteMediaFromSupabaseStorage;

const uploadedImageUrlCache = new Map<string, string>();

export async function uploadImageToSupabaseStorage(
  fileOrDataUrl: File | string | undefined,
  slotKey: string
): Promise<string | null> {
  if (!fileOrDataUrl) return null;
  if (typeof fileOrDataUrl === 'string' && !fileOrDataUrl.startsWith('data:')) {
    return fileOrDataUrl;
  }

  try {
    let bodyBlob: Blob | File;
    let contentType = 'image/webp';
    let ext = 'webp';
    let cacheSig = '';

    if (typeof fileOrDataUrl === 'string') {
      cacheSig = `${slotKey}_${fileOrDataUrl.length}_${fileOrDataUrl
        .slice(-48)
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 14)}`;
      const cachedUrl = uploadedImageUrlCache.get(cacheSig);
      if (cachedUrl) return cachedUrl;

      const mimeMatch = fileOrDataUrl.match(/^data:([^;,]+)[;,]/i);
      if (mimeMatch && mimeMatch[1]) {
        contentType = mimeMatch[1];
        if (contentType.includes('svg')) ext = 'svg';
        else if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('jpeg') || contentType.includes('jpg'))
          ext = 'jpg';
        else if (contentType.includes('webp')) ext = 'webp';
      }
      const res = await fetch(fileOrDataUrl);
      bodyBlob = await res.blob();
    } else {
      bodyBlob = fileOrDataUrl;
      contentType = fileOrDataUrl.type || 'image/webp';
      if (contentType.includes('svg')) ext = 'svg';
      else if (contentType.includes('png')) ext = 'png';
      else if (contentType.includes('jpeg') || contentType.includes('jpg'))
        ext = 'jpg';
      cacheSig = `${slotKey}_${fileOrDataUrl.size}_${Date.now().toString(36)}`;
    }

    const safeSlot = slotKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const shortHash = cacheSig
      .replace(/[^a-zA-Z0-9_-]/g, '')
      .slice(-16);
    const objectPath = `photos/${safeSlot}_${shortHash}.${ext}`;

    const upRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/wedding-media/${objectPath}`,
      {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': contentType,
          'x-upsert': 'true',
        },
        body: bodyBlob,
      }
    );
    if (!upRes.ok) return null;
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/wedding-media/${objectPath}`;
    if (cacheSig) {
      uploadedImageUrlCache.set(cacheSig, publicUrl);
    }
    return publicUrl;
  } catch {
    return null;
  }
}

/**
 * Automatic Zero-Trace Garbage Collector for Supabase Storage (`wedding-media`).
 * Deletes any file in `photos/` or `music/` that is no longer referenced by the current settings.
 */
export async function cleanupOrphanedStorageMedia(
  settings: WeddingSettings
): Promise<void> {
  try {
    const marker = '/storage/v1/object/public/wedding-media/';
    const activeObjectPaths = new Set<string>();
    const registerUrl = (u?: string) => {
      if (!u || typeof u !== 'string') return;
      const idx = u.indexOf(marker);
      if (idx === -1) return;
      const p = u.slice(idx + marker.length).split('?')[0];
      if (p) activeObjectPaths.add(p);
    };

    registerUrl(settings.groomPhotoUrl);
    registerUrl(settings.bridePhotoUrl);
    registerUrl(settings.coverBgUrl);
    registerUrl(settings.heroPrewedUrl);
    registerUrl(settings.pageBgUrl);
    registerUrl(settings.qrisImageUrl);

    if (settings.originalPhotos) {
      Object.values(settings.originalPhotos).forEach((u) => registerUrl(u));
    }
    if (Array.isArray(settings.galleryPhotos)) {
      settings.galleryPhotos.forEach((gp) => {
        registerUrl(gp.imageUrl);
        registerUrl(gp.originalImageUrl);
      });
    }
    if (Array.isArray(settings.musicPlaylist)) {
      settings.musicPlaylist.forEach((m) => registerUrl(m.url));
    }

    for (const folder of ['photos', 'music']) {
      const listRes = await fetch(
        `${SUPABASE_URL}/storage/v1/object/list/wedding-media`,
        {
          method: 'POST',
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prefix: folder,
            limit: 300,
            offset: 0,
          }),
        }
      );
      if (!listRes.ok) continue;
      const items = (await listRes.json()) as Array<{
        name: string;
        id?: string | null;
      }>;
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (!item.name || item.name === '.emptyFolderPlaceholder') continue;
        const fullObjectPath = `${folder}/${item.name}`;
        if (!activeObjectPaths.has(fullObjectPath)) {
          await fetch(
            `${SUPABASE_URL}/storage/v1/object/wedding-media/${fullObjectPath}`,
            {
              method: 'DELETE',
              headers: {
                apikey: SUPABASE_ANON_KEY,
                Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
              },
            }
          ).catch(() => {});
        }
      }
    }
  } catch {
    // Ignore background storage cleanup errors
  }
}

function normalizeCloudState(
  parsed: Partial<WeddingDatabaseSchema>,
  fallbackTimestamp?: string
): WeddingDatabaseSchema {
  const cleanTasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.filter((t) => !/^g\d+$/i.test(String(t.id || '')))
    : INITIAL_TASKS;
  const cleanGuests = Array.isArray(parsed.guests)
    ? parsed.guests.filter((g) => !/^guest_[0-9a-f]{8}-/i.test(String(g.id || '')))
    : INITIAL_GUESTS;

  return {
    settings: parsed.settings
      ? healStalePlaceholderSettings(parsed.settings as WeddingSettings)
      : INITIAL_SETTINGS,
    tasks: cleanTasks,
    guests: cleanGuests,
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

// ============================================================================
// CLOUD PAYLOAD OPTIMIZER (SUPABASE STORAGE BUCKET + ANTI-TIMEOUT)
// ============================================================================
const compressedDataUrlCache = new Map<string, string>();

async function compressDataUrlForCloud(
  dataUrl: string | undefined,
  maxDim: number,
  quality: number,
  maxAllowedChars = 250_000
): Promise<string | undefined> {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl;
  if (!dataUrl.startsWith('data:image/')) return dataUrl;
  if (dataUrl.startsWith('data:image/svg+xml')) return dataUrl;
  if (dataUrl.length <= maxAllowedChars) return dataUrl;

  const cacheKey = `${dataUrl.slice(0, 64)}_${dataUrl.slice(-64)}_${dataUrl.length}_${maxDim}_${quality}`;
  const cached = compressedDataUrlCache.get(cacheKey);
  if (cached) return cached;

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return dataUrl;
  }

  return new Promise((resolve) => {
    try {
      const img = new window.Image();
      img.onerror = () => resolve(dataUrl);
      img.onload = () => {
        try {
          let w = img.naturalWidth || img.width || 1000;
          let h = img.naturalHeight || img.height || 1000;
          if (w > maxDim || h > maxDim) {
            if (w >= h) {
              h = Math.max(1, Math.round((h * maxDim) / w));
              w = maxDim;
            } else {
              w = Math.max(1, Math.round((w * maxDim) / h));
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          let out = canvas.toDataURL('image/webp', quality);
          if (!out.startsWith('data:image/webp')) {
            out = canvas.toDataURL('image/jpeg', quality);
          }
          compressedDataUrlCache.set(cacheKey, out);
          resolve(out);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

async function resolveCloudImageSlot(
  rawUrl: string | undefined,
  slotKey: string,
  fallbackDim: number,
  fallbackQual: number,
  fallbackMaxChars: number
): Promise<string | undefined> {
  if (!rawUrl || typeof rawUrl !== 'string') return rawUrl;
  if (rawUrl.startsWith('data:image/')) {
    const storageUrl = await uploadImageToSupabaseStorage(rawUrl, slotKey);
    if (storageUrl) return storageUrl;
    return compressDataUrlForCloud(
      rawUrl,
      fallbackDim,
      fallbackQual,
      fallbackMaxChars
    );
  }
  return rawUrl;
}

/**
 * Uploads inline `data:image/` photos (up to 10 MB Ultra-HD) and `data:audio/` MP3s
 * directly to Supabase Storage bucket `wedding-media` so photos stay 100% sharp
 * while `public.wedding_state` (`id = 'main'`) stays ultra-light (~25 KB) and never hits timeout.
 */
async function prepareCloudSafeState(
  state: WeddingDatabaseSchema,
  aggressiveMode = false
): Promise<WeddingDatabaseSchema> {
  const rawSettings: WeddingSettings = healStalePlaceholderSettings(
    state.settings
  );
  // Never store duplicate uncropped originalPhotos in the cloud main row (kept in local IndexedDB)
  delete rawSettings.originalPhotos;

  // Upload any inline data:audio/ MP3 to Supabase Storage bucket wedding-media so every track keeps its real audio URL
  if (Array.isArray(rawSettings.musicPlaylist)) {
    rawSettings.musicPlaylist = await Promise.all(
      rawSettings.musicPlaylist.map(async (m) => {
        if (m.url && m.url.startsWith('data:audio/')) {
          const uploadedUrl = await uploadAudioToSupabaseStorage(m.url, m.id);
          if (uploadedUrl) {
            return { ...m, url: uploadedUrl };
          }
        }
        return m;
      })
    );
  }

  const avatarDim = aggressiveMode ? 900 : 1400;
  const bannerDim = aggressiveMode ? 1400 : 2400;
  const qual = aggressiveMode ? 0.8 : 0.9;
  const maxChars = aggressiveMode ? 120_000 : 250_000;

  const [
    groomPhotoUrl,
    bridePhotoUrl,
    coverBgUrl,
    heroPrewedUrl,
    pageBgUrl,
    qrisImageUrl,
  ] = await Promise.all([
    resolveCloudImageSlot(
      rawSettings.groomPhotoUrl,
      'groomPhotoUrl',
      avatarDim,
      qual,
      maxChars
    ),
    resolveCloudImageSlot(
      rawSettings.bridePhotoUrl,
      'bridePhotoUrl',
      avatarDim,
      qual,
      maxChars
    ),
    resolveCloudImageSlot(
      rawSettings.coverBgUrl,
      'coverBgUrl',
      bannerDim,
      qual,
      maxChars
    ),
    resolveCloudImageSlot(
      rawSettings.heroPrewedUrl,
      'heroPrewedUrl',
      bannerDim,
      qual,
      maxChars
    ),
    resolveCloudImageSlot(
      rawSettings.pageBgUrl,
      'pageBgUrl',
      bannerDim,
      qual,
      maxChars
    ),
    resolveCloudImageSlot(
      rawSettings.qrisImageUrl,
      'qrisImageUrl',
      avatarDim,
      qual,
      maxChars
    ),
  ]);

  rawSettings.groomPhotoUrl = groomPhotoUrl || rawSettings.groomPhotoUrl;
  rawSettings.bridePhotoUrl = bridePhotoUrl || rawSettings.bridePhotoUrl;
  if (coverBgUrl) rawSettings.coverBgUrl = coverBgUrl;
  if (heroPrewedUrl) rawSettings.heroPrewedUrl = heroPrewedUrl;
  if (pageBgUrl) rawSettings.pageBgUrl = pageBgUrl;
  if (qrisImageUrl) rawSettings.qrisImageUrl = qrisImageUrl;

  if (Array.isArray(rawSettings.galleryPhotos)) {
    const cleanedGallery: GalleryPhotoItem[] = await Promise.all(
      rawSettings.galleryPhotos.map(async (gp, idx) => {
        const copy: GalleryPhotoItem = { ...gp };
        delete copy.originalImageUrl;
        const resolvedUrl = await resolveCloudImageSlot(
          copy.imageUrl,
          `gallery_${copy.id || idx}`,
          bannerDim,
          qual,
          maxChars
        );
        if (resolvedUrl) copy.imageUrl = resolvedUrl;
        return copy;
      })
    );
    rawSettings.galleryPhotos = cleanedGallery;
  }

  // Trigger background Zero-Trace Storage Garbage Collector to purge any replaced/deleted files
  void cleanupOrphanedStorageMedia({
    ...rawSettings,
    originalPhotos: state.settings.originalPhotos,
  });

  return {
    ...state,
    settings: rawSettings,
  };
}

/**
 * Self-healing slice recovery in case `id = 'main'` in `public.wedding_state`
 * ever exceeds statement_timeout during a full `SELECT data`.
 */
async function recoverStateFromSupabaseBySlices(): Promise<WeddingDatabaseSchema | null> {
  try {
    const fetchSlice = async (selectExpr: string) => {
      const url = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=${encodeURIComponent(
        selectExpr
      )}`;
      const r = await fetch(url, {
        method: 'GET',
        headers: getSupabaseHeaders({ Accept: 'application/json' }),
        cache: 'no-store',
      });
      if (!r.ok) return null;
      const rows = await r.json();
      return Array.isArray(rows) && rows[0] ? rows[0] : null;
    };

    const metaRow = await fetchSlice('updated_at,lastSyncedAt:data->>lastSyncedAt');
    if (!metaRow) return null;

    const [tasksRow, guestsRow, wishesRow, budgetsRow, usersRow] =
      await Promise.all([
        fetchSlice('v:data->tasks'),
        fetchSlice('v:data->guests'),
        fetchSlice('v:data->wishes'),
        fetchSlice('v:data->budgetItems'),
        fetchSlice('v:data->adminUsers'),
      ]);

    const settingsKeys = Object.keys(INITIAL_SETTINGS).filter(
      (k) => k !== 'originalPhotos'
    );
    const recoveredSettings: Record<string, unknown> = { ...INITIAL_SETTINGS };

    for (let i = 0; i < settingsKeys.length; i += 2) {
      const batch = settingsKeys.slice(i, i + 2);
      const expr = batch.map((k) => `${k}:data->settings->${k}`).join(',');
      const row = await fetchSlice(expr);
      if (row) {
        for (const k of batch) {
          if (row[k] !== null && row[k] !== undefined) {
            recoveredSettings[k] = row[k];
          }
        }
      }
    }

    for (const extraKey of [
      'scheduleEvents',
      'photoAdjustments',
      'musicPlaylist',
      'waTemplateVip',
      'waTemplateRegular',
    ]) {
      const row = await fetchSlice(`v:data->settings->${extraKey}`);
      if (row && row.v !== null && row.v !== undefined) {
        recoveredSettings[extraKey] = row.v;
      }
    }

    const normalized = normalizeCloudState(
      {
        settings: recoveredSettings as unknown as WeddingSettings,
        tasks: tasksRow?.v,
        guests: guestsRow?.v,
        wishes: wishesRow?.v,
        budgetItems: budgetsRow?.v,
        adminUsers: usersRow?.v,
        lastSyncedAt: metaRow.lastSyncedAt || metaRow.updated_at,
      },
      metaRow.updated_at
    );

    // Immediately heal the bloated row in Supabase in the background
    void saveStateToSupabase(normalized);
    return normalized;
  } catch {
    return null;
  }
}

/**
 * Load WeddingDatabaseSchema from Supabase PostgreSQL table `public.wedding_state`
 * (with automatic slice-recovery if statement_timeout 57014 occurs).
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

    const errText = await res.text();

    // If GET timed out (57014 statement timeout / 500 / 504), self-heal via slice recovery!
    if (
      res.status === 500 ||
      res.status === 504 ||
      res.status === 502 ||
      errText.includes('57014') ||
      errText.includes('statement timeout')
    ) {
      const recovered = await recoverStateFromSupabaseBySlices();
      if (recovered) {
        setCloudStatus('SYNCED', recovered.lastSyncedAt || '');
        appendAuditLog({
          actor: 'system',
          module: 'DATABASE',
          action: 'SYNC',
          status: 'SUCCESS',
          summary:
            'Optimasi otomatis ukuran payload database Supabase berhasil dijalankan',
        });
        return { state: recovered, tableExists: true };
      }
    }

    const isTableMissing =
      res.status === 404 ||
      errText.includes('PGRST205') ||
      errText.includes('Could not find the table') ||
      errText.includes('relation') ||
      errText.includes('does not exist');

    if (isTableMissing) {
      setCloudStatus(
        'NEEDS_TABLE_SETUP',
        'Tabel public.wedding_state belum dibuat di SQL Editor Supabase'
      );
      appendAuditLog({
        actor: 'system',
        module: 'DATABASE',
        action: 'ERROR',
        status: 'WARNING',
        summary: 'Tabel public.wedding_state belum ditemukan di Supabase',
        detail: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
      });
      return { state: null, tableExists: false };
    }

    setCloudStatus('OFFLINE', `HTTP ${res.status}`);
    appendAuditLog({
      actor: 'system',
      module: 'DATABASE',
      action: 'ERROR',
      status: 'ERROR',
      summary: `Gagal memuat data dari Supabase (HTTP ${res.status})`,
      detail: errText.slice(0, 250),
    });
    return { state: null, tableExists: false };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Gagal terhubung ke Supabase';
    setCloudStatus('OFFLINE', msg);
    return { state: null, tableExists: false };
  }
}

// ============================================================================
// MULTI-TABLE RELATIONAL BACKGROUND SYNC (WHEN MULTI-TABLES ARE CREATED)
// ============================================================================
let multiTableAvailability: 'UNKNOWN' | 'AVAILABLE' | 'MISSING' = 'UNKNOWN';

async function pruneDeletedRelationalRows(
  tableName: string,
  pkColumn: string,
  activeKeys: string[]
): Promise<void> {
  try {
    const cleanKeys = activeKeys
      .map((k) => String(k || '').trim())
      .filter(Boolean);
    const filterExpr =
      cleanKeys.length > 0
        ? `${pkColumn}=not.in.(${cleanKeys
            .map((k) => `"${k.replace(/"/g, '')}"`)
            .join(',')})`
        : `${pkColumn}=neq.__none__`;
    await fetch(`${SUPABASE_URL}/rest/v1/${tableName}?${filterExpr}`, {
      method: 'DELETE',
      headers: getSupabaseHeaders(),
    });
  } catch {
    // Ignore optional prune errors
  }
}

async function syncRelationalTablesInBackground(
  state: WeddingDatabaseSchema,
  updatedAt: string
): Promise<void> {
  if (multiTableAvailability === 'MISSING') return;

  try {
    const s = state.settings;
    // 1. Upsert into public.wedding_settings
    const lightSettingsCopy: Record<string, unknown> = { ...s };
    delete lightSettingsCopy.originalPhotos;
    delete lightSettingsCopy.groomPhotoUrl;
    delete lightSettingsCopy.bridePhotoUrl;
    delete lightSettingsCopy.coverBgUrl;
    delete lightSettingsCopy.heroPrewedUrl;
    delete lightSettingsCopy.pageBgUrl;
    delete lightSettingsCopy.galleryPhotos;

    const settingsRes = await fetch(
      `${SUPABASE_URL}/rest/v1/wedding_settings?on_conflict=id`,
      {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify({
          id: 'main',
          site_title: s.siteTitle,
          groom_full_name: s.groomFullName,
          bride_full_name: s.brideFullName,
          wedding_datetime: s.weddingDatetime,
          biston_datetime: s.bistonDatetime,
          total_budget_cap: s.totalBudgetCap || 0,
          settings_json: lightSettingsCopy,
          updated_at: updatedAt,
        }),
      }
    );

    if (settingsRes.status === 404) {
      multiTableAvailability = 'MISSING';
      return;
    }
    if (!settingsRes.ok) return;
    multiTableAvailability = 'AVAILABLE';

    // 2. Upsert Media Slots into public.wedding_media & hard-delete removed slots
    const mediaRows = [
      {
        slot_key: 'groomPhotoUrl',
        setting_id: 'main',
        label: 'Foto Profil Mempelai Pria',
        media_type: 'image',
        media_url: s.groomPhotoUrl || '',
        adjustment: s.photoAdjustments?.groomPhotoUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'bridePhotoUrl',
        setting_id: 'main',
        label: 'Foto Profil Mempelai Wanita',
        media_type: 'image',
        media_url: s.bridePhotoUrl || '',
        adjustment: s.photoAdjustments?.bridePhotoUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'coverBgUrl',
        setting_id: 'main',
        label: 'Foto Sampul Undangan',
        media_type: 'image',
        media_url: s.coverBgUrl || '',
        adjustment: s.photoAdjustments?.coverBgUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'heroPrewedUrl',
        setting_id: 'main',
        label: 'Foto Utama Prewedding',
        media_type: 'image',
        media_url: s.heroPrewedUrl || '',
        adjustment: s.photoAdjustments?.heroPrewedUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'pageBgUrl',
        setting_id: 'main',
        label: 'Foto Latar Belakang',
        media_type: 'image',
        media_url: s.pageBgUrl || '',
        adjustment: s.photoAdjustments?.pageBgUrl || {},
        updated_at: updatedAt,
      },
      ...(s.qrisImageUrl
        ? [
            {
              slot_key: 'qrisImageUrl',
              setting_id: 'main',
              label: 'Barcode QRIS Amplop Digital',
              media_type: 'image',
              media_url: s.qrisImageUrl,
              adjustment: {},
              updated_at: updatedAt,
            },
          ]
        : []),
      ...(Array.isArray(s.galleryPhotos)
        ? s.galleryPhotos.map((gp) => ({
            slot_key: `gallery_${gp.id}`,
            setting_id: 'main',
            label: gp.title || 'Foto Galeri',
            media_type: 'image',
            media_url: gp.imageUrl || '',
            adjustment: gp.adjustment || {},
            updated_at: updatedAt,
          }))
        : []),
    ];

    void fetch(`${SUPABASE_URL}/rest/v1/wedding_media?on_conflict=slot_key`, {
      method: 'POST',
      headers: getSupabaseHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(mediaRows),
    }).catch(() => {});
    void pruneDeletedRelationalRows(
      'wedding_media',
      'slot_key',
      mediaRows.map((m) => m.slot_key)
    );

    // 3. Upsert & hard-delete removed rows in Tasks, Guests, Wishes, Budgets, Users
    const tasksList = Array.isArray(state.tasks) ? state.tasks : [];
    if (tasksList.length > 0) {
      const taskRows = tasksList.map((t) => ({
        id: t.id,
        setting_id: 'main',
        category: t.category,
        timeline_phase: t.timelinePhase,
        title: t.title,
        due: t.due,
        priority: t.priority,
        owner: t.owner,
        status: t.status,
        done: Boolean(t.done),
        notes: t.notes || '',
        data: t,
        updated_at: updatedAt,
      }));
      void fetch(`${SUPABASE_URL}/rest/v1/wedding_tasks?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(taskRows),
      }).catch(() => {});
    }
    void pruneDeletedRelationalRows(
      'wedding_tasks',
      'id',
      tasksList.map((t) => t.id)
    );

    const guestsList = Array.isArray(state.guests) ? state.guests : [];
    if (guestsList.length > 0) {
      const guestRows = guestsList.map((g) => ({
        id: g.id,
        setting_id: 'main',
        invitation_code: g.invitationCode,
        guest_name: g.guestName,
        guest_type: g.guestType,
        side: g.side,
        institution: g.institution || '',
        invitation_format: g.invitationFormat,
        priority: g.priority,
        pax: g.pax || 2,
        rsvp_status: g.rsvpStatus,
        delivery_status: g.deliveryStatus,
        data: g,
        updated_at: updatedAt,
      }));
      void fetch(`${SUPABASE_URL}/rest/v1/wedding_guests?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(guestRows),
      }).catch(() => {});
    }
    void pruneDeletedRelationalRows(
      'wedding_guests',
      'id',
      guestsList.map((g) => g.id)
    );

    const wishesList = Array.isArray(state.wishes) ? state.wishes : [];
    if (wishesList.length > 0) {
      const wishRows = wishesList.map((w) => ({
        id: w.id,
        setting_id: 'main',
        guest_name: w.guestName,
        institution: w.institution || '',
        relation: w.relation || '',
        rsvp_status: w.rsvpStatus,
        pax: w.pax || 0,
        message: w.message || '',
        is_pinned: Boolean(w.isPinned),
        reply_from_couple: w.replyFromCouple || '',
        created_at: w.createdAt,
        data: w,
        updated_at: updatedAt,
      }));
      void fetch(`${SUPABASE_URL}/rest/v1/wedding_wishes?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(wishRows),
      }).catch(() => {});
    }
    void pruneDeletedRelationalRows(
      'wedding_wishes',
      'id',
      wishesList.map((w) => w.id)
    );

    const budgetsList = Array.isArray(state.budgetItems)
      ? state.budgetItems
      : [];
    if (budgetsList.length > 0) {
      const budgetRows = budgetsList.map((b) => ({
        id: b.id,
        setting_id: 'main',
        category: b.category,
        item_name: b.itemName,
        vendor_name: b.vendorName || '',
        estimated_cost: b.estimatedCost || 0,
        actual_cost: b.actualCost || 0,
        paid_amount: b.paidAmount || 0,
        payment_status: b.paymentStatus,
        due_date: b.dueDate || '',
        data: b,
        updated_at: updatedAt,
      }));
      void fetch(`${SUPABASE_URL}/rest/v1/wedding_budgets?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(budgetRows),
      }).catch(() => {});
    }
    void pruneDeletedRelationalRows(
      'wedding_budgets',
      'id',
      budgetsList.map((b) => b.id)
    );

    const usersList = Array.isArray(state.adminUsers) ? state.adminUsers : [];
    if (usersList.length > 0) {
      const userRows = usersList.map((u) => ({
        id: u.id,
        setting_id: 'main',
        username: u.username,
        nama: u.nama,
        role: u.role,
        jabatan: u.jabatan || '',
        is_default_user: Boolean(u.isDefaultUser),
        data: u,
        updated_at: updatedAt,
      }));
      void fetch(`${SUPABASE_URL}/rest/v1/wedding_users?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(userRows),
      }).catch(() => {});
    }
    void pruneDeletedRelationalRows(
      'wedding_users',
      'id',
      usersList.map((u) => u.id)
    );
  } catch {
    // Ignore optional relational table sync errors
  }
}

// ============================================================================
// SINGLE-FLIGHT SERIALIZED UPSERT ENGINE (NO OVERLAPPING ROW LOCKS)
// ============================================================================
let inFlightSavePromise: Promise<boolean> | null = null;
let queuedLatestState: WeddingDatabaseSchema | null = null;

async function executeSingleFlightSave(
  initialState: WeddingDatabaseSchema
): Promise<boolean> {
  queuedLatestState = initialState;

  if (inFlightSavePromise) {
    return inFlightSavePromise;
  }

  inFlightSavePromise = (async () => {
    let lastResult = false;
    while (queuedLatestState !== null) {
      const stateToProcess = queuedLatestState;
      queuedLatestState = null;
      lastResult = await performActualSupabaseUpsert(stateToProcess);
    }
    inFlightSavePromise = null;
    return lastResult;
  })();

  return inFlightSavePromise;
}

async function performActualSupabaseUpsert(
  state: WeddingDatabaseSchema
): Promise<boolean> {
  setCloudStatus('SYNCING', 'Menyimpan ke Supabase...');
  const updatedAt = state.lastSyncedAt || new Date().toISOString();

  const tryUpsertTable = async (
    dataToSave: WeddingDatabaseSchema
  ): Promise<Response> => {
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
    const cloudSafePayload = await prepareCloudSafeState(
      { ...state, lastSyncedAt: updatedAt },
      false
    );

    let res = await tryUpsertTable(cloudSafePayload);

    // If payload hit timeout (500 / 57014 / 504) or 413, retry with optimized payload
    if (
      res.status === 413 ||
      res.status === 500 ||
      res.status === 502 ||
      res.status === 504
    ) {
      const ultraCompactPayload = await prepareCloudSafeState(
        { ...state, lastSyncedAt: updatedAt },
        true
      );
      res = await tryUpsertTable(ultraCompactPayload);
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

    if (isTableMissing) {
      setCloudStatus(
        'NEEDS_TABLE_SETUP',
        'Tabel public.wedding_state belum dibuat di SQL Editor Supabase'
      );
      appendAuditLog({
        actor: state.settings?.updatedBy || 'system',
        module: 'DATABASE',
        action: 'ERROR',
        status: 'WARNING',
        summary: 'Gagal simpan ke Supabase: Tabel public.wedding_state belum dibuat',
        detail: `HTTP ${res.status}: ${errText.slice(0, 200)}`,
      });
      return false;
    }

    const errMsg = `HTTP ${res.status}: ${errText.slice(0, 120)}`;
    setCloudStatus('OFFLINE', errMsg);
    appendAuditLog({
      actor: state.settings?.updatedBy || 'system',
      module: 'DATABASE',
      action: 'ERROR',
      status: 'ERROR',
      summary: `Gagal menyimpan data ke Supabase (HTTP ${res.status})`,
      detail: errText.slice(0, 300),
    });
    return false;
  } catch (err) {
    const msg =
      err instanceof Error ? err.message : 'Gagal menyimpan ke Supabase';
    setCloudStatus('OFFLINE', msg);
    appendAuditLog({
      actor: state.settings?.updatedBy || 'system',
      module: 'DATABASE',
      action: 'ERROR',
      status: 'ERROR',
      summary: 'Terjadi kesalahan jaringan saat menyimpan ke Supabase',
      detail: msg,
    });
    return false;
  }
}

/**
 * Upsert WeddingDatabaseSchema to Supabase PostgreSQL table `public.wedding_state`
 * (and relational tables if created). Uses a single-flight lock so concurrent
 * requests never collide on the same row.
 */
export async function saveStateToSupabase(
  state: WeddingDatabaseSchema
): Promise<boolean> {
  return executeSingleFlightSave(state);
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: WeddingDatabaseSchema | null = null;

/**
 * Debounced background save to Supabase for client-side interactive edits.
 */
export function queueSaveStateToSupabase(
  state: WeddingDatabaseSchema,
  delayMs = 400
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
