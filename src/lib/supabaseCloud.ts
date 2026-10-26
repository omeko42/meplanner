import {
  AuditLogEntry,
  BackgroundSlideItem,
  ClientWorkspaceData,
  CommercialPaymentTransaction,
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
import {
  unwrapSvgEmbeddedRasterUrl,
  wrapRasterDataUrlInSvg,
} from './clientSync';

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
grant all on table public.wedding_users to anon, authenticated, service_role;

-- ============================================================================
-- 10. TABEL TRANSAKSI & PEMBAYARAN KOMERSIAL IDEMPOTEN (public.wedding_payments)
--     Menjamin idempotensi transaksi (anti-duplikasi saat timeout / retry)
-- ============================================================================
create table if not exists public.wedding_payments (
  id text primary key,
  idempotency_key text unique not null,
  order_id text unique not null,
  setting_id text references public.wedding_settings(id) on delete cascade default 'main',
  package_tier text not null,
  market_lang text default 'ID',
  currency text not null,
  amount_numeric numeric not null default 0,
  channel_id text,
  channel_category text,
  buyer_email text not null,
  buyer_couple_name text,
  payment_reference text,
  status text not null default 'PENDING_VERIFICATION',
  retry_count integer not null default 0,
  last_error_reason text,
  expires_at text,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.wedding_payments enable row level security;
drop policy if exists "wedding_payments_access" on public.wedding_payments;
create policy "wedding_payments_access" on public.wedding_payments
  for all to anon, authenticated using (true) with check (true);
grant all on table public.wedding_payments to anon, authenticated, service_role;`;

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

let hasCompletedInitialCloudHydration = false;
let lastKnownCloudState: WeddingDatabaseSchema | null = null;

export function isInitialCloudHydrationComplete(): boolean {
  return hasCompletedInitialCloudHydration;
}

export function markInitialCloudHydrationComplete(
  cloudState?: WeddingDatabaseSchema | null
): void {
  hasCompletedInitialCloudHydration = true;
  if (cloudState) {
    lastKnownCloudState = cloudState;
  }
}

const DELETED_IDS_STORAGE_KEY = 'mep_deleted_ids_registry_v1';

const explicitlyDeletedGuestIds = new Set<string>();
const explicitlyDeletedTaskIds = new Set<string>();
const explicitlyDeletedWishIds = new Set<string>();
const explicitlyDeletedBudgetIds = new Set<string>();

function loadDeletedIdsRegistryFromLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(DELETED_IDS_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as WeddingSettings['deletedIdsRegistry'];
    if (!parsed || typeof parsed !== 'object') return;
    (parsed.guests || []).forEach((id) => id && explicitlyDeletedGuestIds.add(id));
    (parsed.tasks || []).forEach((id) => id && explicitlyDeletedTaskIds.add(id));
    (parsed.wishes || []).forEach((id) => id && explicitlyDeletedWishIds.add(id));
    (parsed.budgets || []).forEach((id) => id && explicitlyDeletedBudgetIds.add(id));
  } catch {
    // Ignore storage read errors
  }
}

function persistDeletedIdsRegistryToLocal(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      DELETED_IDS_STORAGE_KEY,
      JSON.stringify({
        guests: Array.from(explicitlyDeletedGuestIds),
        tasks: Array.from(explicitlyDeletedTaskIds),
        wishes: Array.from(explicitlyDeletedWishIds),
        budgets: Array.from(explicitlyDeletedBudgetIds),
      })
    );
  } catch {
    // Ignore storage write errors
  }
}

export function hydrateDeletedIdsFromRegistry(
  reg?: WeddingSettings['deletedIdsRegistry']
): void {
  loadDeletedIdsRegistryFromLocal();
  if (!reg || typeof reg !== 'object') return;
  let changed = false;
  for (const id of reg.guests || []) {
    if (id && !explicitlyDeletedGuestIds.has(id)) {
      explicitlyDeletedGuestIds.add(id);
      changed = true;
    }
  }
  for (const id of reg.tasks || []) {
    if (id && !explicitlyDeletedTaskIds.has(id)) {
      explicitlyDeletedTaskIds.add(id);
      changed = true;
    }
  }
  for (const id of reg.wishes || []) {
    if (id && !explicitlyDeletedWishIds.has(id)) {
      explicitlyDeletedWishIds.add(id);
      changed = true;
    }
  }
  for (const id of reg.budgets || []) {
    if (id && !explicitlyDeletedBudgetIds.has(id)) {
      explicitlyDeletedBudgetIds.add(id);
      changed = true;
    }
  }
  if (changed) {
    persistDeletedIdsRegistryToLocal();
  }
}

const locallyTouchedIds = new Map<string, number>();

export function registerLocalItemTouch(id: string): void {
  if (!id) return;
  locallyTouchedIds.set(id, Date.now());
  explicitlyDeletedGuestIds.delete(id);
  explicitlyDeletedTaskIds.delete(id);
  explicitlyDeletedWishIds.delete(id);
  explicitlyDeletedBudgetIds.delete(id);
}

export function getExplicitlyDeletedIdsSnapshot(): {
  guests: string[];
  tasks: string[];
  wishes: string[];
  budgets: string[];
} {
  loadDeletedIdsRegistryFromLocal();
  return {
    guests: Array.from(explicitlyDeletedGuestIds),
    tasks: Array.from(explicitlyDeletedTaskIds),
    wishes: Array.from(explicitlyDeletedWishIds),
    budgets: Array.from(explicitlyDeletedBudgetIds),
  };
}

export function registerExplicitCloudDeletion(
  collection: 'guests' | 'tasks' | 'wishes' | 'budgets',
  id: string
): void {
  if (!id) return;
  loadDeletedIdsRegistryFromLocal();
  let relationalTable = '';
  if (collection === 'guests') {
    explicitlyDeletedGuestIds.add(id);
    relationalTable = 'wedding_guests';
  } else if (collection === 'tasks') {
    explicitlyDeletedTaskIds.add(id);
    relationalTable = 'wedding_tasks';
  } else if (collection === 'wishes') {
    explicitlyDeletedWishIds.add(id);
    relationalTable = 'wedding_wishes';
  } else if (collection === 'budgets') {
    explicitlyDeletedBudgetIds.add(id);
    relationalTable = 'wedding_budgets';
  }
  persistDeletedIdsRegistryToLocal();

  // Immediately delete from relational table in Supabase so deleted items never resurrect
  if (relationalTable) {
    void fetch(
      `${SUPABASE_URL}/rest/v1/${relationalTable}?id=eq.${encodeURIComponent(id)}`,
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

export function mergeGuestsMultiDevice(
  primaryGuests: WeddingDatabaseSchema['guests'],
  secondaryGuests: WeddingDatabaseSchema['guests'],
  respectExplicitDeletes = true,
  customDeletedGuestIds?: Set<string>
): WeddingDatabaseSchema['guests'] {
  const safePrimary = Array.isArray(primaryGuests) ? primaryGuests : [];
  const safeSecondary = Array.isArray(secondaryGuests) ? secondaryGuests : [];
  const deletedSet = customDeletedGuestIds || explicitlyDeletedGuestIds;

  const secondaryById = new Map<string, WeddingDatabaseSchema['guests'][number]>();
  const secondaryByName = new Map<string, WeddingDatabaseSchema['guests'][number]>();
  for (const cg of safeSecondary) {
    if (!cg || !cg.id) continue;
    if (respectExplicitDeletes && deletedSet.has(cg.id)) continue;
    secondaryById.set(cg.id, cg);
    const norm = (cg.guestName || '').trim().toLowerCase();
    if (norm && !secondaryByName.has(norm)) {
      secondaryByName.set(norm, cg);
    }
  }

  const merged: WeddingDatabaseSchema['guests'] = [];
  const usedIds = new Set<string>();
  const usedNames = new Set<string>();
  const usedCodes = new Set<string>();

  const nextAvailableCode = (): string => {
    let idx = merged.length + 1;
    while (true) {
      const candidate = `INV-${String(idx).padStart(4, '0')}`;
      if (!usedCodes.has(candidate.toUpperCase())) {
        return candidate;
      }
      idx++;
    }
  };

  for (const g of safePrimary) {
    if (!g || !g.id) continue;
    if (respectExplicitDeletes && deletedSet.has(g.id)) continue;
    const normName = (g.guestName || '').trim().toLowerCase();
    if (usedIds.has(g.id)) continue;

    const cg =
      secondaryById.get(g.id) ||
      (normName ? secondaryByName.get(normName) : undefined);

    let resolvedGuest = g;
    if (cg) {
      const isLocallyTouched = locallyTouchedIds.has(g.id);
      if (
        !isLocallyTouched &&
        cg.rsvpStatus &&
        cg.rsvpStatus !== 'Belum Konfirmasi' &&
        (!g.rsvpStatus || g.rsvpStatus === 'Belum Konfirmasi')
      ) {
        resolvedGuest = {
          ...g,
          rsvpStatus: cg.rsvpStatus,
          confirmedPax: cg.confirmedPax ?? g.confirmedPax,
          pax: cg.pax || g.pax,
          wishes: cg.wishes || g.wishes,
          sessionChoice: cg.sessionChoice || g.sessionChoice,
          attendanceStatus:
            cg.attendanceStatus && cg.attendanceStatus !== 'Belum Dicek'
              ? cg.attendanceStatus
              : g.attendanceStatus,
          phone: cg.phone || g.phone,
          institution: cg.institution || g.institution,
          deliveryStatus:
            cg.deliveryStatus && cg.deliveryStatus !== 'Belum Disiapkan'
              ? cg.deliveryStatus
              : g.deliveryStatus,
          updatedAt:
            (cg.updatedAt || '') > (g.updatedAt || '')
              ? cg.updatedAt
              : g.updatedAt,
        };
      } else if (
        !isLocallyTouched &&
        (cg.updatedAt || '') > (g.updatedAt || '')
      ) {
        resolvedGuest = {
          ...g,
          ...cg,
          id: g.id,
          invitationCode: g.invitationCode || cg.invitationCode,
        };
      }
    }

    usedIds.add(resolvedGuest.id);
    if (normName) usedNames.add(normName);
    const codeUpper = (resolvedGuest.invitationCode || '').trim().toUpperCase();
    if (codeUpper) usedCodes.add(codeUpper);
    merged.push(resolvedGuest);
  }

  for (const cg of safeSecondary) {
    if (!cg || !cg.id) continue;
    if (respectExplicitDeletes && deletedSet.has(cg.id)) continue;
    const normName = (cg.guestName || '').trim().toLowerCase();
    if (usedIds.has(cg.id) || (normName && usedNames.has(normName))) continue;

    let finalCode = (cg.invitationCode || '').trim();
    if (!finalCode || usedCodes.has(finalCode.toUpperCase())) {
      finalCode = nextAvailableCode();
    }
    usedIds.add(cg.id);
    if (normName) usedNames.add(normName);
    usedCodes.add(finalCode.toUpperCase());
    merged.push(
      finalCode !== cg.invitationCode ? { ...cg, invitationCode: finalCode } : cg
    );
  }

  return merged;
}

export function mergeWishesMultiDevice(
  primaryWishes: WeddingDatabaseSchema['wishes'],
  secondaryWishes: WeddingDatabaseSchema['wishes'],
  respectExplicitDeletes = true,
  customDeletedWishIds?: Set<string>
): WeddingDatabaseSchema['wishes'] {
  const safePrimary = Array.isArray(primaryWishes) ? primaryWishes : [];
  const safeSecondary = Array.isArray(secondaryWishes) ? secondaryWishes : [];
  const deletedSet = customDeletedWishIds || explicitlyDeletedWishIds;

  const secondaryById = new Map<string, WeddingDatabaseSchema['wishes'][number]>();
  for (const cw of safeSecondary) {
    if (!cw || !cw.id) continue;
    if (respectExplicitDeletes && deletedSet.has(cw.id)) continue;
    secondaryById.set(cw.id, cw);
  }

  const merged: WeddingDatabaseSchema['wishes'] = [];
  const usedIds = new Set<string>();

  for (const w of safePrimary) {
    if (!w || !w.id) continue;
    if (respectExplicitDeletes && deletedSet.has(w.id)) continue;
    if (usedIds.has(w.id)) continue;

    const cw = secondaryById.get(w.id);
    let resolved = w;
    if (cw && !locallyTouchedIds.has(w.id)) {
      resolved = {
        ...cw,
        ...w,
        replyFromCouple: w.replyFromCouple || cw.replyFromCouple,
        isPinned: w.isPinned ?? cw.isPinned,
        moderationStatus: w.moderationStatus || cw.moderationStatus,
        flaggedReason: w.flaggedReason || cw.flaggedReason,
      };
    }
    usedIds.add(resolved.id);
    merged.push(resolved);
  }

  for (const cw of safeSecondary) {
    if (!cw || !cw.id) continue;
    if (respectExplicitDeletes && deletedSet.has(cw.id)) continue;
    if (usedIds.has(cw.id)) continue;
    usedIds.add(cw.id);
    merged.push(cw);
  }

  return merged.sort((a, b) =>
    String(b.createdAt || '').localeCompare(String(a.createdAt || ''))
  );
}

export function mergeTasksMultiDevice(
  primaryTasks: WeddingDatabaseSchema['tasks'],
  secondaryTasks: WeddingDatabaseSchema['tasks'],
  respectExplicitDeletes = true,
  customDeletedTaskIds?: Set<string>
): WeddingDatabaseSchema['tasks'] {
  const safePrimary = Array.isArray(primaryTasks) ? primaryTasks : [];
  const safeSecondary = Array.isArray(secondaryTasks) ? secondaryTasks : [];
  const deletedSet = customDeletedTaskIds || explicitlyDeletedTaskIds;

  const secondaryById = new Map<string, WeddingDatabaseSchema['tasks'][number]>();
  for (const ct of safeSecondary) {
    if (!ct || !ct.id) continue;
    if (respectExplicitDeletes && deletedSet.has(ct.id)) continue;
    secondaryById.set(ct.id, ct);
  }

  const merged: WeddingDatabaseSchema['tasks'] = [];
  const usedIds = new Set<string>();

  for (const t of safePrimary) {
    if (!t || !t.id) continue;
    if (respectExplicitDeletes && deletedSet.has(t.id)) continue;
    if (usedIds.has(t.id)) continue;

    const ct = secondaryById.get(t.id);
    let resolved = t;
    if (
      ct &&
      !locallyTouchedIds.has(t.id) &&
      (ct.updatedAt || '') > (t.updatedAt || '')
    ) {
      resolved = ct;
    }
    usedIds.add(resolved.id);
    merged.push(resolved);
  }

  for (const ct of safeSecondary) {
    if (!ct || !ct.id) continue;
    if (respectExplicitDeletes && deletedSet.has(ct.id)) continue;
    if (usedIds.has(ct.id)) continue;
    usedIds.add(ct.id);
    merged.push(ct);
  }

  return merged;
}

export function mergeBudgetsMultiDevice(
  primaryBudgets: WeddingDatabaseSchema['budgetItems'],
  secondaryBudgets: WeddingDatabaseSchema['budgetItems'],
  respectExplicitDeletes = true,
  customDeletedBudgetIds?: Set<string>
): WeddingDatabaseSchema['budgetItems'] {
  const safePrimary = Array.isArray(primaryBudgets) ? primaryBudgets : [];
  const safeSecondary = Array.isArray(secondaryBudgets) ? secondaryBudgets : [];
  const deletedSet = customDeletedBudgetIds || explicitlyDeletedBudgetIds;

  const secondaryById = new Map<
    string,
    WeddingDatabaseSchema['budgetItems'][number]
  >();
  for (const cb of safeSecondary) {
    if (!cb || !cb.id) continue;
    if (respectExplicitDeletes && deletedSet.has(cb.id)) continue;
    secondaryById.set(cb.id, cb);
  }

  const merged: WeddingDatabaseSchema['budgetItems'] = [];
  const usedIds = new Set<string>();

  for (const b of safePrimary) {
    if (!b || !b.id) continue;
    if (respectExplicitDeletes && deletedSet.has(b.id)) continue;
    if (usedIds.has(b.id)) continue;

    const cb = secondaryById.get(b.id);
    let resolved = b;
    if (
      cb &&
      !locallyTouchedIds.has(b.id) &&
      (cb.updatedAt || '') > (b.updatedAt || '')
    ) {
      resolved = cb;
    }
    usedIds.add(resolved.id);
    merged.push(resolved);
  }

  for (const cb of safeSecondary) {
    if (!cb || !cb.id) continue;
    if (respectExplicitDeletes && deletedSet.has(cb.id)) continue;
    if (usedIds.has(cb.id)) continue;
    usedIds.add(cb.id);
    merged.push(cb);
  }

  return merged;
}

export function mergeFullDatabaseMultiDevice(
  localState: WeddingDatabaseSchema,
  cloudState: Partial<WeddingDatabaseSchema> | null | undefined,
  respectExplicitDeletes = true,
  customDeletes?: {
    guests?: Set<string>;
    tasks?: Set<string>;
    wishes?: Set<string>;
    budgets?: Set<string>;
  }
): WeddingDatabaseSchema {
  if (!cloudState) return localState;

  hydrateDeletedIdsFromRegistry(localState.settings?.deletedIdsRegistry);
  hydrateDeletedIdsFromRegistry(cloudState.settings?.deletedIdsRegistry);

  const deletedGuests = new Set<string>([
    ...Array.from(explicitlyDeletedGuestIds),
    ...(customDeletes?.guests ? Array.from(customDeletes.guests) : []),
    ...(localState.settings?.deletedIdsRegistry?.guests || []),
    ...(cloudState.settings?.deletedIdsRegistry?.guests || []),
  ]);
  const deletedTasks = new Set<string>([
    ...Array.from(explicitlyDeletedTaskIds),
    ...(customDeletes?.tasks ? Array.from(customDeletes.tasks) : []),
    ...(localState.settings?.deletedIdsRegistry?.tasks || []),
    ...(cloudState.settings?.deletedIdsRegistry?.tasks || []),
  ]);
  const deletedWishes = new Set<string>([
    ...Array.from(explicitlyDeletedWishIds),
    ...(customDeletes?.wishes ? Array.from(customDeletes.wishes) : []),
    ...(localState.settings?.deletedIdsRegistry?.wishes || []),
    ...(cloudState.settings?.deletedIdsRegistry?.wishes || []),
  ]);
  const deletedBudgets = new Set<string>([
    ...Array.from(explicitlyDeletedBudgetIds),
    ...(customDeletes?.budgets ? Array.from(customDeletes.budgets) : []),
    ...(localState.settings?.deletedIdsRegistry?.budgets || []),
    ...(cloudState.settings?.deletedIdsRegistry?.budgets || []),
  ]);

  // 1. Merge Guests (never resurrect deleted seed guests)
  const mergedGuests = mergeGuestsMultiDevice(
    localState.guests || [],
    cloudState.guests || [],
    respectExplicitDeletes,
    deletedGuests
  );

  // 2. Merge Wishes
  const mergedWishes = mergeWishesMultiDevice(
    localState.wishes || [],
    cloudState.wishes || [],
    respectExplicitDeletes,
    deletedWishes
  );

  // 3. Merge Tasks
  const mergedTasks = mergeTasksMultiDevice(
    localState.tasks || [],
    cloudState.tasks || [],
    respectExplicitDeletes,
    deletedTasks
  );

  // 4. Merge Budgets
  const mergedBudgets = mergeBudgetsMultiDevice(
    localState.budgetItems || [],
    cloudState.budgetItems || [],
    respectExplicitDeletes,
    deletedBudgets
  );

  // 5. Merge Admin Users
  const mergedUsers: WeddingDatabaseSchema['adminUsers'] = [];
  const usedUserIds = new Set<string>();
  const usedUsernames = new Set<string>();
  for (const u of [
    ...(Array.isArray(localState.adminUsers) ? localState.adminUsers : []),
    ...(Array.isArray(cloudState.adminUsers) ? cloudState.adminUsers : []),
  ]) {
    if (!u || !u.id) continue;
    const uname = (u.username || '').trim().toLowerCase();
    if (usedUserIds.has(u.id) || (uname && usedUsernames.has(uname))) continue;
    usedUserIds.add(u.id);
    if (uname) usedUsernames.add(uname);
    mergedUsers.push(u);
  }

  // 6. Merge Settings, Client Groups, Commercial Payments, & Secondary Client Workspaces
  const nextSettings: WeddingSettings = { ...localState.settings };
  const cs = cloudState.settings;
  if (cs) {
    if (
      nextSettings.groomParents === 'Putra dari Bapak ... & Ibu ...' &&
      cs.groomParents &&
      cs.groomParents !== 'Putra dari Bapak ... & Ibu ...'
    ) {
      nextSettings.groomFullName = cs.groomFullName || nextSettings.groomFullName;
      nextSettings.groomNickname = cs.groomNickname || nextSettings.groomNickname;
      nextSettings.groomRankAndTitle =
        cs.groomRankAndTitle ?? nextSettings.groomRankAndTitle;
      nextSettings.groomUnit = cs.groomUnit ?? nextSettings.groomUnit;
      nextSettings.groomParents = cs.groomParents || nextSettings.groomParents;
      nextSettings.groomOrigin = cs.groomOrigin || nextSettings.groomOrigin;
      nextSettings.groomInstagram =
        cs.groomInstagram ?? nextSettings.groomInstagram;
      nextSettings.groomPhotoUrl = cs.groomPhotoUrl || nextSettings.groomPhotoUrl;
      nextSettings.brideFullName = cs.brideFullName || nextSettings.brideFullName;
      nextSettings.brideNickname = cs.brideNickname || nextSettings.brideNickname;
      nextSettings.brideTitle = cs.brideTitle ?? nextSettings.brideTitle;
      nextSettings.brideParents = cs.brideParents || nextSettings.brideParents;
      nextSettings.brideOrigin = cs.brideOrigin || nextSettings.brideOrigin;
      nextSettings.brideInstagram =
        cs.brideInstagram ?? nextSettings.brideInstagram;
      nextSettings.bridePhotoUrl = cs.bridePhotoUrl || nextSettings.bridePhotoUrl;
      nextSettings.coverBgUrl = cs.coverBgUrl || nextSettings.coverBgUrl;
      nextSettings.heroPrewedUrl = cs.heroPrewedUrl || nextSettings.heroPrewedUrl;
      nextSettings.pageBgUrl = cs.pageBgUrl || nextSettings.pageBgUrl;
      nextSettings.coverVideoUrl = cs.coverVideoUrl || nextSettings.coverVideoUrl;
      nextSettings.heroVideoUrl = cs.heroVideoUrl || nextSettings.heroVideoUrl;
      nextSettings.pageVideoUrl = cs.pageVideoUrl || nextSettings.pageVideoUrl;
      nextSettings.eventType = nextSettings.eventType || cs.eventType || 'WEDDING';
      nextSettings.brandLogoUrl = nextSettings.brandLogoUrl ?? cs.brandLogoUrl;
      nextSettings.backgroundSlides =
        nextSettings.backgroundSlides ?? cs.backgroundSlides;
      nextSettings.coverSlides =
        nextSettings.coverSlides ?? cs.coverSlides;
      nextSettings.heroSlides =
        nextSettings.heroSlides ?? cs.heroSlides;
      nextSettings.pageSlides =
        nextSettings.pageSlides ?? cs.pageSlides;
      nextSettings.gallerySlideDurationSeconds =
        cs.gallerySlideDurationSeconds ?? nextSettings.gallerySlideDurationSeconds;
      nextSettings.galleryTransitionDurationMs =
        cs.galleryTransitionDurationMs ?? nextSettings.galleryTransitionDurationMs;
      nextSettings.galleryTransitionStyle =
        cs.galleryTransitionStyle ?? nextSettings.galleryTransitionStyle;
      nextSettings.qrisImageUrl = cs.qrisImageUrl ?? nextSettings.qrisImageUrl;
      nextSettings.photoAdjustments =
        cs.photoAdjustments || nextSettings.photoAdjustments;
      if (
        (!Array.isArray(nextSettings.galleryPhotos) ||
          nextSettings.galleryPhotos.length === 0) &&
        Array.isArray(cs.galleryPhotos) &&
        cs.galleryPhotos.length > 0
      ) {
        nextSettings.galleryPhotos = cs.galleryPhotos;
      }
      if (
        (!Array.isArray(nextSettings.bankAccounts) ||
          nextSettings.bankAccounts.length === 0) &&
        Array.isArray(cs.bankAccounts) &&
        cs.bankAccounts.length > 0
      ) {
        nextSettings.bankAccounts = cs.bankAccounts;
      }
      if (
        (!Array.isArray(nextSettings.loveStory) ||
          nextSettings.loveStory.length === 0) &&
        Array.isArray(cs.loveStory) &&
        cs.loveStory.length > 0
      ) {
        nextSettings.loveStory = cs.loveStory;
      }
      if (
        (!Array.isArray(nextSettings.musicPlaylist) ||
          nextSettings.musicPlaylist.length === 0) &&
        Array.isArray(cs.musicPlaylist) &&
        cs.musicPlaylist.length > 0
      ) {
        nextSettings.musicPlaylist = cs.musicPlaylist;
        nextSettings.activeMusicTrackId =
          cs.activeMusicTrackId || nextSettings.activeMusicTrackId;
        nextSettings.musicTitle = cs.musicTitle || nextSettings.musicTitle;
        nextSettings.musicArtist = cs.musicArtist || nextSettings.musicArtist;
      }
    }

    // Merge clientGroups by id
    if (
      Array.isArray(nextSettings.clientGroups) ||
      Array.isArray(cs.clientGroups)
    ) {
      const groupMap = new Map<
        string,
        NonNullable<WeddingSettings['clientGroups']>[number]
      >();
      for (const g of cs.clientGroups || []) {
        if (g && g.id) groupMap.set(g.id, g);
      }
      for (const g of nextSettings.clientGroups || []) {
        if (g && g.id) groupMap.set(g.id, g);
      }
      nextSettings.clientGroups = Array.from(groupMap.values());
    }

    // Merge commercialPayments by idempotencyKey / id
    if (
      Array.isArray(nextSettings.commercialPayments) ||
      Array.isArray(cs.commercialPayments)
    ) {
      const txList: CommercialPaymentTransaction[] = [];
      const usedTxKeys = new Set<string>();
      for (const tx of [
        ...(nextSettings.commercialPayments || []),
        ...(cs.commercialPayments || []),
      ]) {
        if (!tx || !tx.id) continue;
        const key = tx.idempotencyKey || tx.id;
        if (usedTxKeys.has(key) || usedTxKeys.has(tx.id)) continue;
        usedTxKeys.add(key);
        usedTxKeys.add(tx.id);
        txList.push(tx);
      }
      nextSettings.commercialPayments = txList;
    }

    // Merge clientWorkspaces per clientId (merging guests, wishes, tasks, budgets inside each workspace)
    if (nextSettings.clientWorkspaces || cs.clientWorkspaces) {
      const localWsMap = nextSettings.clientWorkspaces || {};
      const cloudWsMap = cs.clientWorkspaces || {};
      const allClientIds = Array.from(
        new Set([
          ...Object.keys(localWsMap),
          ...Object.keys(cloudWsMap),
        ])
      );
      const mergedWorkspaces: Record<string, ClientWorkspaceData> = {};

      for (const cid of allClientIds) {
        const lws = localWsMap[cid];
        const cws = cloudWsMap[cid];
        if (lws && cws) {
          mergedWorkspaces[cid] = {
            ...cws,
            ...lws,
            settings: {
              ...(cws.settings || {}),
              ...(lws.settings || {}),
            },
            guests: mergeGuestsMultiDevice(
              lws.guests || [],
              cws.guests || [],
              respectExplicitDeletes,
              deletedGuests
            ),
            wishes: mergeWishesMultiDevice(
              lws.wishes || [],
              cws.wishes || [],
              respectExplicitDeletes,
              deletedWishes
            ),
            tasks: mergeTasksMultiDevice(
              lws.tasks || [],
              cws.tasks || [],
              respectExplicitDeletes,
              deletedTasks
            ),
            budgetItems: mergeBudgetsMultiDevice(
              lws.budgetItems || [],
              cws.budgetItems || [],
              respectExplicitDeletes,
              deletedBudgets
            ),
            updatedAt:
              (lws.updatedAt || '') >= (cws.updatedAt || '')
                ? lws.updatedAt
                : cws.updatedAt,
          };
        } else if (lws) {
          mergedWorkspaces[cid] = lws;
        } else if (cws) {
          mergedWorkspaces[cid] = cws;
        }
      }
      nextSettings.clientWorkspaces = mergedWorkspaces;
    }

    if (nextSettings.backgroundSlides === undefined && cs.backgroundSlides) {
      nextSettings.backgroundSlides = cs.backgroundSlides;
    }
    if (nextSettings.coverSlides === undefined && cs.coverSlides) {
      nextSettings.coverSlides = cs.coverSlides;
    }
    if (nextSettings.heroSlides === undefined && cs.heroSlides) {
      nextSettings.heroSlides = cs.heroSlides;
    }
    if (nextSettings.pageSlides === undefined && cs.pageSlides) {
      nextSettings.pageSlides = cs.pageSlides;
    }
  }

  nextSettings.deletedIdsRegistry = {
    guests: Array.from(deletedGuests),
    tasks: Array.from(deletedTasks),
    wishes: Array.from(deletedWishes),
    budgets: Array.from(deletedBudgets),
  };

  const healedSettings = healStalePlaceholderSettings(nextSettings);

  return {
    ...localState,
    settings: healedSettings,
    guests: mergedGuests,
    wishes: mergedWishes,
    tasks: mergedTasks,
    budgetItems: mergedBudgets,
    adminUsers: mergedUsers.length > 0 ? mergedUsers : localState.adminUsers,
  };
}

async function fetchSupabaseWithRetry(
  url: string,
  init: RequestInit,
  timeoutMs = 6500,
  maxAttempts = 2
): Promise<Response> {
  let lastError: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        ...init,
        cache: 'no-store',
        signal: controller.signal,
      });
      return res;
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, 450 * attempt));
      }
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error('Gagal terhubung ke Supabase');
}

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
  if (
    !next.groomParents ||
    next.groomParents.includes('Putra dari Bapak ...')
  ) {
    next.groomParents = INITIAL_SETTINGS.groomParents;
  }
  if (
    !next.groomNickname ||
    next.groomNickname === 'Mempelai Pria' ||
    next.groomNickname === 'Eko'
  ) {
    next.groomNickname = INITIAL_SETTINGS.groomNickname;
  }
  if (
    !next.brideFullName ||
    next.brideFullName === 'Nama Mempelai Wanita' ||
    next.brideFullName === 'Sero Nelci Agustina'
  ) {
    next.brideFullName = INITIAL_SETTINGS.brideFullName;
    next.brideNickname = INITIAL_SETTINGS.brideNickname;
    next.brideTitle = INITIAL_SETTINGS.brideTitle;
    next.brideOrigin = INITIAL_SETTINGS.brideOrigin;
  }
  if (
    !next.brideParents ||
    next.brideParents.includes('Putri dari Bapak ...')
  ) {
    next.brideParents = INITIAL_SETTINGS.brideParents;
  }
  if (!next.brideNickname || next.brideNickname === 'Mempelai Wanita') {
    next.brideNickname = INITIAL_SETTINGS.brideNickname;
  }
  if (
    !next.groomPhotoUrl ||
    next.groomPhotoUrl.includes('images.unsplash.com') ||
    (next.groomPhotoUrl.includes('.supabase.co/') &&
      next.groomPhotoUrl.endsWith('.svg'))
  ) {
    next.groomPhotoUrl = INITIAL_SETTINGS.groomPhotoUrl;
  }
  if (
    !next.bridePhotoUrl ||
    next.bridePhotoUrl.includes('images.unsplash.com') ||
    (next.bridePhotoUrl.includes('.supabase.co/') &&
      next.bridePhotoUrl.endsWith('.svg'))
  ) {
    next.bridePhotoUrl = INITIAL_SETTINGS.bridePhotoUrl;
  }
  const hasUnifiedBgSlides = Array.isArray(next.backgroundSlides);
  if (
    !hasUnifiedBgSlides &&
    !Array.isArray(next.coverSlides) &&
    (!next.coverBgUrl ||
      next.coverBgUrl.includes('images.unsplash.com') ||
      (next.coverBgUrl.includes('.supabase.co/') &&
        next.coverBgUrl.endsWith('.svg')))
  ) {
    next.coverBgUrl = INITIAL_SETTINGS.coverBgUrl;
  }
  if (
    !hasUnifiedBgSlides &&
    !Array.isArray(next.heroSlides) &&
    (!next.heroPrewedUrl ||
      next.heroPrewedUrl.includes('images.unsplash.com') ||
      (next.heroPrewedUrl.includes('.supabase.co/') &&
        next.heroPrewedUrl.endsWith('.svg')))
  ) {
    next.heroPrewedUrl = INITIAL_SETTINGS.heroPrewedUrl;
  }
  if (
    !hasUnifiedBgSlides &&
    !Array.isArray(next.pageSlides) &&
    (!next.pageBgUrl ||
      next.pageBgUrl.includes('images.unsplash.com') ||
      (next.pageBgUrl.includes('.supabase.co/') &&
        next.pageBgUrl.endsWith('.svg')))
  ) {
    next.pageBgUrl = INITIAL_SETTINGS.pageBgUrl;
  }

  const legacyOrigPhotos = (
    next as WeddingSettings & { originalPhotoUrls?: WeddingSettings['originalPhotos'] }
  ).originalPhotoUrls;

  if (!Array.isArray(next.coverSlides)) {
    next.coverSlides = next.coverBgUrl?.trim()
      ? [
          {
            id: 'cover_slide_1',
            imageUrl: next.coverBgUrl.trim(),
            originalImageUrl:
              legacyOrigPhotos?.coverBgUrl ||
              next.originalPhotos?.coverBgUrl ||
              next.coverBgUrl.trim(),
            adjustment: next.photoAdjustments?.coverBgUrl,
          },
        ]
      : [];
  }
  if (!Array.isArray(next.heroSlides)) {
    next.heroSlides = next.heroPrewedUrl?.trim()
      ? [
          {
            id: 'hero_slide_1',
            imageUrl: next.heroPrewedUrl.trim(),
            originalImageUrl:
              legacyOrigPhotos?.heroPrewedUrl ||
              next.originalPhotos?.heroPrewedUrl ||
              next.heroPrewedUrl.trim(),
            adjustment: next.photoAdjustments?.heroPrewedUrl,
          },
        ]
      : [];
  }
  if (!Array.isArray(next.pageSlides)) {
    next.pageSlides = next.pageBgUrl?.trim()
      ? [
          {
            id: 'page_slide_1',
            imageUrl: next.pageBgUrl.trim(),
            originalImageUrl:
              legacyOrigPhotos?.pageBgUrl ||
              next.originalPhotos?.pageBgUrl ||
              next.pageBgUrl.trim(),
            adjustment: next.photoAdjustments?.pageBgUrl,
          },
        ]
      : [];
  }

  const rewriteToStaticCdnIfMigrated = (u?: string): string => {
    if (!u || typeof u !== 'string') return '';
    const map: Record<string, string> = {
      'groomPhotoUrl_1_13kNIKQ8cB774B.webp': '/media/utama/groom.webp',
      'groomPhotoUrl_dvaoiEHATEAA.webp': '/media/utama/groom.webp',
      'bridePhotoUrl_5_QRIA58sjV48jVz.webp': '/media/utama/bride.webp',
      'bridePhotoUrl_8powMHC94Aql.webp': '/media/utama/bride.webp',
      'cover_slide_cover_2_3_FlWCY4lLxJp77h.webp': '/media/utama/cover.webp',
      'hero_slide_hero_slide_1792846417331_1_h6da_5_43TUZpYY1qKbBk.webp':
        '/media/utama/hero.webp',
      'page_slide_page_slide_1792846456257_1_zlgo_3_7LcMhXIUFIxBMJ.webp':
        '/media/utama/page-1.webp',
      'pageBgUrl_9_wIjjmzLppiJL5K.webp': '/media/utama/page-1.webp',
      'page_slide_page_slide_1792900065299_1_0tck_5_eofRrtqF8YjfAc.webp':
        '/media/utama/page-2.webp',
      'qrisImageUrl_7_H3fEFgYXwW2R5G.webp': '/media/utama/qris.webp',
      'gallery_gal-default-1_3_YfAqp1GY5wxGu4.webp':
        '/media/utama/gallery-1.webp',
      'gallery_gal-default-1_hd.webp': '/media/utama/gallery-1.webp',
      'gallery_gal-default-2_5_TpivGl6rXLo89E.webp':
        '/media/utama/gallery-2.webp',
      'gallery_gal-default-2_hd.webp': '/media/utama/gallery-2.webp',
      'gallery_gal-default-3_5_v7oYDi5dVZzbr3.webp':
        '/media/utama/gallery-3.webp',
      'gallery_gal-default-3_hd.webp': '/media/utama/gallery-3.webp',
      'gallery_gal-default-4_1_2dlFZJo1vR2zyK.webp':
        '/media/utama/gallery-4.webp',
      'gallery_gal-default-4_hd.webp': '/media/utama/gallery-4.webp',
    };
    for (const [k, v] of Object.entries(map)) {
      if (u.includes(k)) return v;
    }
    return u;
  };

  next.groomPhotoUrl =
    rewriteToStaticCdnIfMigrated(next.groomPhotoUrl) ||
    INITIAL_SETTINGS.groomPhotoUrl;
  next.bridePhotoUrl =
    rewriteToStaticCdnIfMigrated(next.bridePhotoUrl) ||
    INITIAL_SETTINGS.bridePhotoUrl;
  if (next.qrisImageUrl) {
    next.qrisImageUrl = rewriteToStaticCdnIfMigrated(next.qrisImageUrl);
  }
  for (const slideKey of [
    'coverSlides',
    'heroSlides',
    'pageSlides',
    'backgroundSlides',
  ] as const) {
    const arr = next[slideKey];
    if (Array.isArray(arr)) {
      next[slideKey] = arr.map((bs) => ({
        ...bs,
        imageUrl: rewriteToStaticCdnIfMigrated(bs.imageUrl),
      }));
    }
  }

  next.coverBgUrl =
    rewriteToStaticCdnIfMigrated(next.coverSlides?.[0]?.imageUrl) ||
    rewriteToStaticCdnIfMigrated(next.coverBgUrl) ||
    '';
  next.heroPrewedUrl =
    rewriteToStaticCdnIfMigrated(next.heroSlides?.[0]?.imageUrl) ||
    rewriteToStaticCdnIfMigrated(next.heroPrewedUrl) ||
    '';
  next.pageBgUrl =
    rewriteToStaticCdnIfMigrated(next.pageSlides?.[0]?.imageUrl) ||
    rewriteToStaticCdnIfMigrated(next.pageBgUrl) ||
    '';
  if (!Array.isArray(next.galleryPhotos) || next.galleryPhotos.length === 0) {
    next.galleryPhotos = INITIAL_SETTINGS.galleryPhotos;
  } else {
    next.galleryPhotos = next.galleryPhotos.map((gp, idx) => {
      const url = rewriteToStaticCdnIfMigrated(gp.imageUrl || '');
      const isBrokenOrStale =
        !url ||
        url.includes('images.unsplash.com') ||
        (url.includes('.supabase.co/') && url.endsWith('.svg')) ||
        url.includes('gallery_gal-default-3_cpwHxflTQJ8y.webp') ||
        url.includes('gallery_gal-default-4_6exmkMDAAW72.webp');
      if (isBrokenOrStale) {
        const seedMatch =
          INITIAL_SETTINGS.galleryPhotos.find((sg) => sg.id === gp.id) ||
          INITIAL_SETTINGS.galleryPhotos[idx];
        if (seedMatch?.imageUrl) {
          return {
            ...gp,
            imageUrl: seedMatch.imageUrl,
          };
        }
      }
      return { ...gp, imageUrl: url };
    });
  }
  if (!Array.isArray(next.loveStory) || next.loveStory.length === 0) {
    next.loveStory = INITIAL_SETTINGS.loveStory;
  }
  if (!Array.isArray(next.musicPlaylist) || next.musicPlaylist.length === 0) {
    next.musicPlaylist = INITIAL_SETTINGS.musicPlaylist;
    next.activeMusicTrackId = INITIAL_SETTINGS.activeMusicTrackId;
    next.musicTitle = INITIAL_SETTINGS.musicTitle;
    next.musicArtist = INITIAL_SETTINGS.musicArtist;
  }

  // Heal custom tracks to serve from Vercel static CDN (/musik/...) with 0 Supabase Egress
  if (Array.isArray(next.musicPlaylist)) {
    next.musicPlaylist = next.musicPlaylist.map((m) => {
      const titleLower = (m.title || '').toLowerCase();
      const urlLower = (m.url || '').toLowerCase();
      if (
        titleLower.includes('pernikahan kita') ||
        urlLower.includes('pernikahan-kita')
      ) {
        return { ...m, url: '/musik/pernikahan-kita.mp3' };
      }
      if (
        titleLower.includes('jalaraning tresna') ||
        urlLower.includes('jalaraning-tresna')
      ) {
        return { ...m, url: '/musik/jalaraning-tresna.mp3' };
      }
      if (
        titleLower.includes('cundamani') ||
        urlLower.includes('music_mvgp1wrn')
      ) {
        return { ...m, url: '/musik/cundamani.mp3' };
      }
      if (
        titleLower.includes('marry your daughter') ||
        urlLower.includes('music_mvgp2o8h')
      ) {
        return { ...m, url: '/musik/marry-your-daughter.mp3' };
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
  if (Array.isArray(next.clientGroups)) {
    next.clientGroups = next.clientGroups.filter(
      (g) =>
        g &&
        g.id !== 'client-gmail-agungkrisdiant' &&
        g.id !== 'client-gmail-pasanganmempel'
    );
  }
  if (next.clientWorkspaces) {
    const nextWs = { ...next.clientWorkspaces };
    delete nextWs['client-gmail-agungkrisdiant'];
    delete nextWs['client-gmail-pasanganmempel'];
    next.clientWorkspaces = nextWs;
  }
  if (
    next.invitationAnalytics &&
    Array.isArray(next.invitationAnalytics.recentEvents) &&
    next.invitationAnalytics.recentEvents.length > 12
  ) {
    next.invitationAnalytics = {
      ...next.invitationAnalytics,
      recentEvents: next.invitationAnalytics.recentEvents.slice(0, 12),
    };
  }
  if (
    typeof next.musicVolume !== 'number' ||
    !Number.isFinite(next.musicVolume) ||
    (next.musicVolume > 0 && next.musicVolume <= 5)
  ) {
    next.musicVolume = 80;
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
  if (
    !next.siteTitle ||
    next.siteTitle === 'My Wedding Manager' ||
    /wedding\s*readiness\s*tracker/i.test(next.siteTitle)
  ) {
    next.siteTitle = 'My Event Planner';
  }
  if (
    next.developerCreditUrl &&
    /github\.com\/omeko11/i.test(next.developerCreditUrl)
  ) {
    next.developerCreditUrl = 'https://github.com/omeko42';
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

async function compressImageSourceToTinyWebpBlob(
  source: File | string,
  slotKey: string
): Promise<{ blob: Blob; contentType: string; ext: string } | null> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return null;
  }
  const isSmallSlot = /groomPhoto|bridePhoto|qris|logo/i.test(slotKey);
  const maxDim = isSmallSlot ? 560 : 900;
  const quality = isSmallSlot ? 0.68 : 0.65;

  return new Promise((resolve) => {
    let objectUrlToRevoke: string | null = null;
    try {
      const img = new window.Image();
      img.crossOrigin = 'anonymous';
      img.onerror = () => {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        resolve(null);
      };
      img.onload = () => {
        if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
        try {
          let w = img.naturalWidth || img.width || 800;
          let h = img.naturalHeight || img.height || 800;
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
            resolve(null);
            return;
          }
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, w, h);
          canvas.toBlob(
            (webpBlob) => {
              if (webpBlob && webpBlob.size > 0) {
                resolve({
                  blob: webpBlob,
                  contentType: 'image/webp',
                  ext: 'webp',
                });
              } else {
                canvas.toBlob(
                  (jpgBlob) => {
                    if (jpgBlob && jpgBlob.size > 0) {
                      resolve({
                        blob: jpgBlob,
                        contentType: 'image/jpeg',
                        ext: 'jpg',
                      });
                    } else {
                      resolve(null);
                    }
                  },
                  'image/jpeg',
                  quality
                );
              }
            },
            'image/webp',
            quality
          );
        } catch {
          resolve(null);
        }
      };

      if (typeof source === 'string') {
        img.src = source;
      } else {
        objectUrlToRevoke = URL.createObjectURL(source);
        img.src = objectUrlToRevoke;
      }
    } catch {
      if (objectUrlToRevoke) URL.revokeObjectURL(objectUrlToRevoke);
      resolve(null);
    }
  });
}

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
      let sourceDataUrl = fileOrDataUrl;
      // Always unwrap SVG-embedded raster data URLs before uploading to Supabase Storage
      // so Supabase CDN serves inline image/webp or image/jpeg instead of CSP-blocked image/svg+xml
      if (sourceDataUrl.startsWith('data:image/svg+xml')) {
        const unwrapped = unwrapSvgEmbeddedRasterUrl(sourceDataUrl);
        if (unwrapped !== sourceDataUrl && unwrapped.startsWith('data:image/')) {
          sourceDataUrl = unwrapped;
        }
      }

      cacheSig = `${slotKey}_${sourceDataUrl.length}_${sourceDataUrl
        .slice(-48)
        .replace(/[^a-zA-Z0-9]/g, '')
        .slice(0, 14)}`;
      const cachedUrl = uploadedImageUrlCache.get(cacheSig);
      if (cachedUrl) return cachedUrl;

      const compressed = await compressImageSourceToTinyWebpBlob(
        sourceDataUrl,
        slotKey
      );
      if (compressed) {
        bodyBlob = compressed.blob;
        contentType = compressed.contentType;
        ext = compressed.ext;
      } else {
        const mimeMatch = sourceDataUrl.match(/^data:([^;,]+)[;,]/i);
        if (mimeMatch && mimeMatch[1]) {
          contentType = mimeMatch[1];
          if (contentType.includes('svg')) ext = 'svg';
          else if (contentType.includes('png')) ext = 'png';
          else if (contentType.includes('jpeg') || contentType.includes('jpg'))
            ext = 'jpg';
          else if (contentType.includes('webp')) ext = 'webp';
        }
        const res = await fetch(sourceDataUrl);
        bodyBlob = await res.blob();
      }
    } else {
      cacheSig = `${slotKey}_${fileOrDataUrl.size}_${Date.now().toString(36)}`;
      const compressed = await compressImageSourceToTinyWebpBlob(
        fileOrDataUrl,
        slotKey
      );
      if (compressed) {
        bodyBlob = compressed.blob;
        contentType = compressed.contentType;
        ext = compressed.ext;
      } else {
        bodyBlob = fileOrDataUrl;
        contentType = fileOrDataUrl.type || 'image/webp';
        if (contentType.includes('svg')) ext = 'svg';
        else if (contentType.includes('png')) ext = 'png';
        else if (contentType.includes('jpeg') || contentType.includes('jpg'))
          ext = 'jpg';
      }
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
          'cache-control': 'max-age=31536000, immutable',
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

export const MAX_VIDEO_UPLOAD_BYTES = 25 * 1024 * 1024; // 25 MB

export async function uploadVideoToSupabaseStorage(
  file: File,
  slotKey: string
): Promise<{ url: string | null; error?: string }> {
  if (!file) return { url: null, error: 'File video tidak ditemukan.' };
  if (file.size > MAX_VIDEO_UPLOAD_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      url: null,
      error: `Ukuran video (${sizeMb} MB) melebihi batas maksimal 25 MB.`,
    };
  }
  try {
    let ext = 'mp4';
    const nameExt = file.name.split('.').pop()?.toLowerCase() || '';
    if (['mp4', 'webm', 'mov', 'm4v'].includes(nameExt)) {
      ext = nameExt === 'm4v' ? 'mp4' : nameExt;
    } else if (file.type.includes('webm')) {
      ext = 'webm';
    } else if (file.type.includes('quicktime')) {
      ext = 'mov';
    }
    const contentType =
      file.type && file.type.startsWith('video/')
        ? file.type
        : ext === 'webm'
          ? 'video/webm'
          : 'video/mp4';

    const safeSlot = slotKey.replace(/[^a-zA-Z0-9_-]/g, '_');
    const stamp = `${file.size.toString(36)}_${Date.now().toString(36)}`;
    const objectPath = `videos/${safeSlot}_${stamp}.${ext}`;

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
        body: file,
      }
    );
    if (!upRes.ok) {
      const errText = await upRes.text().catch(() => '');
      return {
        url: null,
        error: `Gagal mengunggah video ke Supabase Storage (HTTP ${upRes.status}): ${errText.slice(0, 120)}`,
      };
    }
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/wedding-media/${objectPath}`;
    return { url: publicUrl };
  } catch (err) {
    return {
      url: null,
      error:
        err instanceof Error
          ? err.message
          : 'Gagal mengunggah video ke Supabase Storage.',
    };
  }
}

/**
 * Automatic Zero-Trace Garbage Collector for Supabase Storage (`wedding-media`).
 * Deletes any file in `photos/`, `music/`, or `videos/` that is no longer referenced by the current settings.
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

    const registerSettingsMedia = (s?: Partial<WeddingSettings>) => {
      if (!s) return;
      registerUrl(s.brandLogoUrl);
      registerUrl(s.groomPhotoUrl);
      registerUrl(s.bridePhotoUrl);
      registerUrl(s.coverBgUrl);
      registerUrl(s.heroPrewedUrl);
      registerUrl(s.pageBgUrl);
      registerUrl(s.coverVideoUrl);
      registerUrl(s.heroVideoUrl);
      registerUrl(s.pageVideoUrl);
      registerUrl(s.qrisImageUrl);
      registerUrl(s.commercialQrisImageUrl);

      if (s.originalPhotos) {
        Object.values(s.originalPhotos).forEach((u) => registerUrl(u));
      }
      for (const slideList of [
        s.backgroundSlides,
        s.coverSlides,
        s.heroSlides,
        s.pageSlides,
      ]) {
        if (Array.isArray(slideList)) {
          slideList.forEach((bs) => {
            registerUrl(bs.imageUrl);
            registerUrl(bs.originalImageUrl);
          });
        }
      }
      if (Array.isArray(s.galleryPhotos)) {
        s.galleryPhotos.forEach((gp) => {
          registerUrl(gp.imageUrl);
          registerUrl(gp.originalImageUrl);
        });
      }
      if (Array.isArray(s.musicPlaylist)) {
        s.musicPlaylist.forEach((m) => registerUrl(m.url));
      }
      if (Array.isArray(s.commercialPaymentChannels)) {
        s.commercialPaymentChannels.forEach((ch) =>
          registerUrl(ch.qrCodeImageUrl)
        );
      }
    };

    registerSettingsMedia(settings);
    Object.values(settings.clientWorkspaces || {}).forEach((ws) => {
      if (ws?.settings) registerSettingsMedia(ws.settings);
    });

    // Extra safety guard: never delete anything if settings contain 0 wedding-media URLs
    if (activeObjectPaths.size === 0) {
      return;
    }

    for (const folder of ['photos', 'music', 'videos']) {
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

export interface SupabaseStorageFileEntry {
  folder: 'photos' | 'music' | 'videos';
  name: string;
  objectPath: string;
  sizeBytes: number;
  mimeType: string;
  publicUrl: string;
  isReferenced: boolean;
}

export interface SupabaseStorageCapacityReport {
  photoCount: number;
  photoBytes: number;
  musicCount: number;
  musicBytes: number;
  videoCount?: number;
  videoBytes?: number;
  totalStorageBytes: number;
  orphanCount: number;
  orphanBytes: number;
  files: SupabaseStorageFileEntry[];
  fetchedAt: string;
}

export async function fetchSupabaseStorageCapacity(
  settings: WeddingSettings
): Promise<SupabaseStorageCapacityReport> {
  const marker = '/storage/v1/object/public/wedding-media/';
  const activeObjectPaths = new Set<string>();
  const registerUrl = (u?: string) => {
    if (!u || typeof u !== 'string') return;
    const idx = u.indexOf(marker);
    if (idx === -1) return;
    const p = u.slice(idx + marker.length).split('?')[0];
    if (p) activeObjectPaths.add(p);
  };

  const registerSettingsMedia = (s?: Partial<WeddingSettings>) => {
    if (!s) return;
    registerUrl(s.brandLogoUrl);
    registerUrl(s.groomPhotoUrl);
    registerUrl(s.bridePhotoUrl);
    registerUrl(s.coverBgUrl);
    registerUrl(s.heroPrewedUrl);
    registerUrl(s.pageBgUrl);
    registerUrl(s.coverVideoUrl);
    registerUrl(s.heroVideoUrl);
    registerUrl(s.pageVideoUrl);
    registerUrl(s.qrisImageUrl);
    registerUrl(s.commercialQrisImageUrl);

    if (s.originalPhotos) {
      Object.values(s.originalPhotos).forEach((u) => registerUrl(u));
    }
    for (const slideList of [
      s.backgroundSlides,
      s.coverSlides,
      s.heroSlides,
      s.pageSlides,
    ]) {
      if (Array.isArray(slideList)) {
        slideList.forEach((bs) => {
          registerUrl(bs.imageUrl);
          registerUrl(bs.originalImageUrl);
        });
      }
    }
    if (Array.isArray(s.galleryPhotos)) {
      s.galleryPhotos.forEach((gp) => {
        registerUrl(gp.imageUrl);
        registerUrl(gp.originalImageUrl);
      });
    }
    if (Array.isArray(s.musicPlaylist)) {
      s.musicPlaylist.forEach((m) => registerUrl(m.url));
    }
    if (Array.isArray(s.commercialPaymentChannels)) {
      s.commercialPaymentChannels.forEach((ch) =>
        registerUrl(ch.qrCodeImageUrl)
      );
    }
  };

  registerSettingsMedia(settings);
  Object.values(settings.clientWorkspaces || {}).forEach((ws) => {
    if (ws?.settings) registerSettingsMedia(ws.settings);
  });

  let photoCount = 0;
  let photoBytes = 0;
  let musicCount = 0;
  let musicBytes = 0;
  let videoCount = 0;
  let videoBytes = 0;
  let orphanCount = 0;
  let orphanBytes = 0;
  const files: SupabaseStorageFileEntry[] = [];

  for (const folder of ['photos', 'music', 'videos'] as const) {
    try {
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
        metadata?: {
          size?: number;
          mimetype?: string;
        };
      }>;
      if (!Array.isArray(items)) continue;

      for (const item of items) {
        if (!item.name || item.name === '.emptyFolderPlaceholder') continue;
        const objectPath = `${folder}/${item.name}`;
        const sizeBytes = Number(item.metadata?.size || 0);
        const mimeType =
          item.metadata?.mimetype ||
          (folder === 'photos'
            ? 'image/webp'
            : folder === 'videos'
              ? 'video/mp4'
              : 'audio/mpeg');
        const isReferenced = activeObjectPaths.has(objectPath);
        const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/wedding-media/${objectPath}`;

        if (folder === 'photos') {
          photoCount += 1;
          photoBytes += sizeBytes;
        } else if (folder === 'videos') {
          videoCount += 1;
          videoBytes += sizeBytes;
        } else {
          musicCount += 1;
          musicBytes += sizeBytes;
        }

        if (!isReferenced) {
          orphanCount += 1;
          orphanBytes += sizeBytes;
        }

        files.push({
          folder,
          name: item.name,
          objectPath,
          sizeBytes,
          mimeType,
          publicUrl,
          isReferenced,
        });
      }
    } catch {
      // Ignore folder fetch error
    }
  }

  return {
    photoCount,
    photoBytes,
    musicCount,
    musicBytes,
    videoCount,
    videoBytes,
    totalStorageBytes: photoBytes + musicBytes + videoBytes,
    orphanCount,
    orphanBytes,
    files,
    fetchedAt: new Date().toISOString(),
  };
}

function normalizeCloudState(
  parsed: Partial<WeddingDatabaseSchema>,
  fallbackTimestamp?: string
): WeddingDatabaseSchema {
  hydrateDeletedIdsFromRegistry(parsed.settings?.deletedIdsRegistry);

  const cleanTasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.filter(
        (t) =>
          t &&
          t.id &&
          !/^g\d+$/i.test(String(t.id || '')) &&
          !explicitlyDeletedTaskIds.has(t.id)
      )
    : INITIAL_TASKS;
  const cleanGuests = Array.isArray(parsed.guests)
    ? parsed.guests.filter(
        (g) =>
          g &&
          g.id &&
          !/^guest_[0-9a-f]{8}-/i.test(String(g.id || '')) &&
          !explicitlyDeletedGuestIds.has(g.id)
      )
    : INITIAL_GUESTS;
  const cleanWishes = Array.isArray(parsed.wishes)
    ? parsed.wishes.filter(
        (w) => w && w.id && !explicitlyDeletedWishIds.has(w.id)
      )
    : INITIAL_WISHES;
  const cleanBudgets = Array.isArray(parsed.budgetItems)
    ? parsed.budgetItems.filter(
        (b) => b && b.id && !explicitlyDeletedBudgetIds.has(b.id)
      )
    : INITIAL_BUDGET_ITEMS;

  const normalizedSettings = healStalePlaceholderSettings(
    (parsed.settings || INITIAL_SETTINGS) as WeddingSettings
  );
  if (
    normalizedSettings.developerCreditUrl &&
    /github\.com\/omeko11/i.test(normalizedSettings.developerCreditUrl)
  ) {
    normalizedSettings.developerCreditUrl = 'https://github.com/omeko42';
  }

  return {
    settings: normalizedSettings,
    tasks: cleanTasks,
    guests: cleanGuests,
    wishes: cleanWishes,
    budgetItems: cleanBudgets,
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
  if (dataUrl.length <= maxAllowedChars) return dataUrl;

  let sourceToCompress = dataUrl;
  if (dataUrl.startsWith('data:image/svg+xml')) {
    const inner = unwrapSvgEmbeddedRasterUrl(dataUrl);
    if (inner === dataUrl) return dataUrl;
    sourceToCompress = inner;
  }

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
          const svgWrapped = wrapRasterDataUrlInSvg(out, w, h);
          compressedDataUrlCache.set(cacheKey, svgWrapped);
          resolve(svgWrapped);
        } catch {
          resolve(dataUrl);
        }
      };
      img.src = sourceToCompress;
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

  if (Array.isArray(rawSettings.backgroundSlides)) {
    const cleanedSlides: BackgroundSlideItem[] = await Promise.all(
      rawSettings.backgroundSlides.map(async (bs, idx) => {
        const copy: BackgroundSlideItem = { ...bs };
        delete copy.originalImageUrl;
        const resolvedUrl = await resolveCloudImageSlot(
          copy.imageUrl,
          `bg_slide_${copy.id || idx}`,
          bannerDim,
          qual,
          maxChars
        );
        if (resolvedUrl) copy.imageUrl = resolvedUrl;
        return copy;
      })
    );
    rawSettings.backgroundSlides = cleanedSlides;
  }

  for (const [slideKey, prefix] of [
    ['coverSlides', 'cover_slide'],
    ['heroSlides', 'hero_slide'],
    ['pageSlides', 'page_slide'],
  ] as const) {
    const list = rawSettings[slideKey];
    if (Array.isArray(list)) {
      rawSettings[slideKey] = await Promise.all(
        list.map(async (bs, idx) => {
          const copy: BackgroundSlideItem = { ...bs };
          delete copy.originalImageUrl;
          const resolvedUrl = await resolveCloudImageSlot(
            copy.imageUrl,
            `${prefix}_${copy.id || idx}`,
            bannerDim,
            qual,
            maxChars
          );
          if (resolvedUrl) copy.imageUrl = resolvedUrl;
          return copy;
        })
      );
    }
  }

  rawSettings.coverBgUrl = rawSettings.coverSlides?.[0]?.imageUrl || '';
  rawSettings.heroPrewedUrl = rawSettings.heroSlides?.[0]?.imageUrl || '';
  rawSettings.pageBgUrl = rawSettings.pageSlides?.[0]?.imageUrl || '';

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

  rawSettings.deletedIdsRegistry = getExplicitlyDeletedIdsSnapshot();

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
      'coverSlides',
      'heroSlides',
      'pageSlides',
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

async function recoverFromRelationalTablesIfNeeded(
  base: WeddingDatabaseSchema
): Promise<WeddingDatabaseSchema> {
  hydrateDeletedIdsFromRegistry(base.settings?.deletedIdsRegistry);

  // If `base` came from an existing `public.wedding_state` row, its empty arrays (`wishes: []`, `tasks: []`, `budgetItems: []`)
  // are intentional user states (e.g., user cleared Buku Tamu or Tasks). Never resurrect deleted items from relational tables!
  const hasExistingCloudSnapshot = Boolean(
    base.lastSyncedAt && base.lastSyncedAt !== '2026-01-01T00:00:00.000Z'
  );
  if (hasExistingCloudSnapshot) {
    return base;
  }

  const needsGuests = base.guests.length === 0;
  const needsTasks = base.tasks.length === 0;
  const needsWishes = base.wishes.length === 0;
  const needsBudgets = base.budgetItems.length === 0;
  const needsSettings =
    base.settings.groomParents === INITIAL_SETTINGS.groomParents;

  if (
    !needsGuests &&
    !needsTasks &&
    !needsWishes &&
    !needsBudgets &&
    !needsSettings
  ) {
    return base;
  }

  try {
    const fetchJson = async (path: string) => {
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
        method: 'GET',
        headers: getSupabaseHeaders({ Accept: 'application/json' }),
        cache: 'no-store',
      });
      if (!r.ok) return null;
      return r.json();
    };

    const [guestsRows, tasksRows, wishesRows, budgetsRows, settingsRows, mediaRows] =
      await Promise.all([
        needsGuests ? fetchJson('wedding_guests?select=*') : Promise.resolve(null),
        needsTasks ? fetchJson('wedding_tasks?select=*') : Promise.resolve(null),
        needsWishes ? fetchJson('wedding_wishes?select=*') : Promise.resolve(null),
        needsBudgets ? fetchJson('wedding_budgets?select=*') : Promise.resolve(null),
        needsSettings
          ? fetchJson('wedding_settings?id=eq.main&select=*')
          : Promise.resolve(null),
        needsSettings
          ? fetchJson('wedding_media?select=*')
          : Promise.resolve(null),
      ]);

    const nextState: WeddingDatabaseSchema = {
      ...base,
      settings: { ...base.settings },
    };

    if (Array.isArray(guestsRows) && guestsRows.length > 0) {
      const recoveredGuests = (
        guestsRows
          .map((r: { payload?: unknown; data?: unknown }) => r?.payload ?? r?.data)
          .filter(Boolean) as WeddingDatabaseSchema['guests']
      ).filter((g) => g && g.id && !explicitlyDeletedGuestIds.has(g.id));
      if (recoveredGuests.length > 0) {
        nextState.guests = recoveredGuests;
      }
    }

    if (Array.isArray(tasksRows) && tasksRows.length > 0) {
      const recoveredTasks = (
        tasksRows
          .map((r: { payload?: unknown; data?: unknown }) => r?.payload ?? r?.data)
          .filter(Boolean) as WeddingDatabaseSchema['tasks']
      ).filter((t) => t && t.id && !explicitlyDeletedTaskIds.has(t.id));
      if (recoveredTasks.length > 0) {
        nextState.tasks = recoveredTasks;
      }
    }

    if (Array.isArray(wishesRows) && wishesRows.length > 0) {
      const recoveredWishes = (
        wishesRows
          .map((r: { payload?: unknown; data?: unknown }) => r?.payload ?? r?.data)
          .filter(Boolean) as WeddingDatabaseSchema['wishes']
      ).filter((w) => w && w.id && !explicitlyDeletedWishIds.has(w.id));
      if (recoveredWishes.length > 0) {
        nextState.wishes = recoveredWishes;
      }
    }

    if (Array.isArray(budgetsRows) && budgetsRows.length > 0) {
      const recoveredBudgets = (
        budgetsRows
          .map((r: { payload?: unknown; data?: unknown }) => r?.payload ?? r?.data)
          .filter(Boolean) as WeddingDatabaseSchema['budgetItems']
      ).filter((b) => b && b.id && !explicitlyDeletedBudgetIds.has(b.id));
      if (recoveredBudgets.length > 0) {
        nextState.budgetItems = recoveredBudgets;
      }
    }

    const rawSettingsObj =
      Array.isArray(settingsRows) && settingsRows[0]
        ? settingsRows[0].payload ?? settingsRows[0].settings_json
        : null;
    if (rawSettingsObj && typeof rawSettingsObj === 'object') {
      nextState.settings = healStalePlaceholderSettings({
        ...nextState.settings,
        ...(rawSettingsObj as Partial<WeddingSettings>),
      });
    }

    if (Array.isArray(mediaRows) && mediaRows.length > 0) {
      const galleryRecovered: GalleryPhotoItem[] = [];
      for (const m of mediaRows as Array<{
        slot_key?: string;
        data_url?: string;
        media_url?: string;
        title?: string;
        caption?: string;
        category?: string;
        adjustment?: Record<string, unknown>;
      }>) {
        const resolvedUrl = m.data_url || m.media_url;
        if (!m.slot_key || !resolvedUrl) continue;
        if (
          m.slot_key === 'groomPhotoUrl' ||
          m.slot_key === 'bridePhotoUrl' ||
          m.slot_key === 'coverBgUrl' ||
          m.slot_key === 'heroPrewedUrl' ||
          m.slot_key === 'pageBgUrl' ||
          m.slot_key === 'qrisImageUrl'
        ) {
          (nextState.settings as unknown as Record<string, unknown>)[m.slot_key] =
            resolvedUrl;
        } else if (m.slot_key.startsWith('gallery_')) {
          galleryRecovered.push({
            id: m.slot_key.replace(/^gallery_/, ''),
            title: m.title || 'Foto Prewedding',
            caption: m.caption || '',
            category: m.category || 'Prewedding',
            imageUrl: resolvedUrl,
          });
        }
      }
      if (
        galleryRecovered.length > 0 &&
        (!Array.isArray(nextState.settings.galleryPhotos) ||
          nextState.settings.galleryPhotos.length === 0)
      ) {
        nextState.settings.galleryPhotos = galleryRecovered;
      }
    }

    return nextState;
  } catch {
    return base;
  }
}

/**
 * Lightweight 45-byte check to see if `public.wedding_state` (`id = 'main'`)
 * has been updated on another device without downloading the full JSON column.
 */
export async function checkCloudStateUpdatedAt(): Promise<string | null> {
  try {
    const restUrl = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=updated_at`;
    const res = await fetchSupabaseWithRetry(
      restUrl,
      {
        method: 'GET',
        headers: getSupabaseHeaders({ Accept: 'application/json' }),
      },
      3500,
      1
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ updated_at?: string }>;
    return Array.isArray(rows) && rows[0]?.updated_at
      ? rows[0].updated_at
      : null;
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
  const tryLoadViaSameOriginProxy = async (): Promise<{
    state: WeddingDatabaseSchema | null;
    tableExists: boolean;
  } | null> => {
    if (typeof window === 'undefined') return null;
    try {
      const proxyRes = await fetch('/api/supabase-sync', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!proxyRes.ok) return null;
      const proxyJson = (await proxyRes.json()) as {
        ok?: boolean;
        rows?: Array<{
          id: string;
          data: Partial<WeddingDatabaseSchema>;
          updated_at?: string;
        }>;
      };
      const rows = proxyJson?.rows;
      if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
        const normalized = normalizeCloudState(rows[0].data, rows[0].updated_at);
        const loaded = await recoverFromRelationalTablesIfNeeded(normalized);
        markInitialCloudHydrationComplete(loaded);
        setCloudStatus('SYNCED', loaded.lastSyncedAt || '');
        return { state: loaded, tableExists: true };
      }
      if (Array.isArray(rows)) {
        markInitialCloudHydrationComplete(null);
        setCloudStatus('SYNCED', 'Tabel siap (belum ada baris)');
        return { state: null, tableExists: true };
      }
    } catch {
      // Ignore proxy fallback error and proceed
    }
    return null;
  };

  try {
    const restUrl = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=id,data,updated_at`;
    let res: Response | null = null;
    let directFetchError: unknown = null;

    try {
      res = await fetchSupabaseWithRetry(
        restUrl,
        {
          method: 'GET',
          headers: getSupabaseHeaders({
            Accept: 'application/json',
          }),
        },
        6500,
        2
      );
    } catch (fetchErr) {
      directFetchError = fetchErr;
    }

    if (!res) {
      const proxyResult = await tryLoadViaSameOriginProxy();
      if (proxyResult) return proxyResult;
      throw directFetchError instanceof Error
        ? directFetchError
        : new Error('Gagal terhubung ke Supabase');
    }

    if (res.ok) {
      const rows = (await res.json()) as Array<{
        id: string;
        data: Partial<WeddingDatabaseSchema>;
        updated_at?: string;
      }>;
      if (Array.isArray(rows) && rows.length > 0 && rows[0].data) {
        const normalized = normalizeCloudState(rows[0].data, rows[0].updated_at);
        const loaded = await recoverFromRelationalTablesIfNeeded(normalized);
        markInitialCloudHydrationComplete(loaded);
        setCloudStatus('SYNCED', loaded.lastSyncedAt || '');
        return { state: loaded, tableExists: true };
      }
      // Table exists, just empty (no row yet)
      markInitialCloudHydrationComplete(null);
      setCloudStatus('SYNCED', 'Tabel siap (belum ada baris)');
      return { state: null, tableExists: true };
    }

    if (res.status !== 404) {
      const proxyResult = await tryLoadViaSameOriginProxy();
      if (proxyResult) return proxyResult;
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
      const recoveredRaw = await recoverStateFromSupabaseBySlices();
      if (recoveredRaw) {
        const recovered = await recoverFromRelationalTablesIfNeeded(recoveredRaw);
        markInitialCloudHydrationComplete(recovered);
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
    if (cleanKeys.length === 0) {
      // When wishes, tasks, or budgets are intentionally cleared to [], delete all rows for project_id=eq.main
      if (
        tableName === 'wedding_wishes' ||
        tableName === 'wedding_tasks' ||
        tableName === 'wedding_budgets'
      ) {
        await fetch(
          `${SUPABASE_URL}/rest/v1/${tableName}?project_id=eq.main`,
          {
            method: 'DELETE',
            headers: getSupabaseHeaders(),
          }
        );
      }
      return;
    }
    const filterExpr = `${pkColumn}=not.in.(${cleanKeys
      .map((k) => `"${k.replace(/"/g, '')}"`)
      .join(',')})`;
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
    const tasksList = Array.isArray(state.tasks) ? state.tasks : [];
    const guestsList = Array.isArray(state.guests) ? state.guests : [];
    const wishesList = Array.isArray(state.wishes) ? state.wishes : [];
    const budgetsList = Array.isArray(state.budgetItems)
      ? state.budgetItems
      : [];

    // 0. Prune deleted relational rows FIRST so any database trigger on wedding_settings / wedding_guests / wedding_wishes
    // never resurrects deleted rows back into public.wedding_state!
    await Promise.all([
      pruneDeletedRelationalRows(
        'wedding_tasks',
        'id',
        tasksList.map((t) => t.id)
      ),
      pruneDeletedRelationalRows(
        'wedding_guests',
        'id',
        guestsList.map((g) => g.id)
      ),
      pruneDeletedRelationalRows(
        'wedding_wishes',
        'id',
        wishesList.map((w) => w.id)
      ),
      pruneDeletedRelationalRows(
        'wedding_budgets',
        'id',
        budgetsList.map((b) => b.id)
      ),
    ]);

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
          project_id: 'main',
          site_title: s.siteTitle,
          groom_full_name: s.groomFullName,
          bride_full_name: s.brideFullName,
          wedding_datetime: s.weddingDatetime,
          total_budget_cap: s.totalBudgetCap || 0,
          payload: lightSettingsCopy,
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
        project_id: 'main',
        media_type: 'couple_groom',
        title: s.groomFullName || 'Mempelai Pria',
        category: 'Profil Mempelai',
        caption: 'Foto Profil Mempelai Pria',
        size_kb: 0,
        data_url: s.groomPhotoUrl || '',
        adjustment: s.photoAdjustments?.groomPhotoUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'bridePhotoUrl',
        project_id: 'main',
        media_type: 'couple_bride',
        title: s.brideFullName || 'Mempelai Wanita',
        category: 'Profil Mempelai',
        caption: 'Foto Profil Mempelai Wanita',
        size_kb: 0,
        data_url: s.bridePhotoUrl || '',
        adjustment: s.photoAdjustments?.bridePhotoUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'coverBgUrl',
        project_id: 'main',
        media_type: 'theme_cover',
        title: 'Sampul Pembuka (Cover)',
        category: 'Tema & Latar',
        caption: 'Background Sampul Pembuka',
        size_kb: 0,
        data_url: s.coverBgUrl || '',
        adjustment: s.photoAdjustments?.coverBgUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'heroPrewedUrl',
        project_id: 'main',
        media_type: 'theme_hero',
        title: 'Banner Utama (Hero)',
        category: 'Tema & Latar',
        caption: 'Banner Hero Prewedding',
        size_kb: 0,
        data_url: s.heroPrewedUrl || '',
        adjustment: s.photoAdjustments?.heroPrewedUrl || {},
        updated_at: updatedAt,
      },
      {
        slot_key: 'pageBgUrl',
        project_id: 'main',
        media_type: 'theme_bg',
        title: 'Wallpaper Latar Undangan',
        category: 'Tema & Latar',
        caption: 'Background Halaman Undangan',
        size_kb: 0,
        data_url: s.pageBgUrl || '',
        adjustment: s.photoAdjustments?.pageBgUrl || {},
        updated_at: updatedAt,
      },
      ...(s.qrisImageUrl
        ? [
            {
              slot_key: 'qrisImageUrl',
              project_id: 'main',
              media_type: 'gift_qris',
              title: 'Barcode QRIS Amplop Digital',
              category: 'Amplop Digital',
              caption: 'QRIS Pernikahan',
              size_kb: 0,
              data_url: s.qrisImageUrl,
              adjustment: {},
              updated_at: updatedAt,
            },
          ]
        : []),
      ...(Array.isArray(s.galleryPhotos)
        ? s.galleryPhotos.map((gp) => ({
            slot_key: `gallery_${gp.id}`,
            project_id: 'main',
            media_type: 'gallery_photo',
            title: gp.title || 'Foto Galeri',
            category: gp.category || 'Galeri Prewedding',
            caption: gp.caption || '',
            size_kb: 0,
            data_url: gp.imageUrl || '',
            adjustment: gp.adjustment || {},
            updated_at: updatedAt,
          }))
        : []),
    ];

    await fetch(`${SUPABASE_URL}/rest/v1/wedding_media?on_conflict=slot_key`, {
      method: 'POST',
      headers: getSupabaseHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      body: JSON.stringify(mediaRows),
    }).catch(() => {});
    await pruneDeletedRelationalRows(
      'wedding_media',
      'slot_key',
      mediaRows.map((m) => m.slot_key)
    );

    // 3. Upsert & hard-delete removed rows in Tasks, Guests, Wishes, Budgets, Users
    if (tasksList.length > 0) {
      const taskRows = tasksList.map((t) => ({
        id: t.id,
        project_id: 'main',
        category: t.category,
        title: t.title,
        status: t.status,
        done: Boolean(t.done),
        payload: t,
        updated_at: updatedAt,
      }));
      await fetch(`${SUPABASE_URL}/rest/v1/wedding_tasks?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(taskRows),
      }).catch(() => {});
    }

    if (guestsList.length > 0) {
      const guestRows = guestsList.map((g) => ({
        id: g.id,
        project_id: 'main',
        name: g.guestName,
        category: g.guestType,
        rsvp_status: g.rsvpStatus,
        pax: g.pax || 1,
        phone: g.phone || '',
        payload: g,
        updated_at: updatedAt,
      }));
      await fetch(`${SUPABASE_URL}/rest/v1/wedding_guests?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(guestRows),
      }).catch(() => {});
    }

    if (wishesList.length > 0) {
      const wishRows = wishesList.map((w) => ({
        id: w.id,
        project_id: 'main',
        name: w.guestName,
        attendance: w.rsvpStatus,
        message: w.message || '',
        created_at_label: w.createdAt || '',
        payload: w,
        updated_at: updatedAt,
      }));
      await fetch(`${SUPABASE_URL}/rest/v1/wedding_wishes?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(wishRows),
      }).catch(() => {});
    }

    if (budgetsList.length > 0) {
      const budgetRows = budgetsList.map((b) => ({
        id: b.id,
        project_id: 'main',
        category: b.category,
        item_name: b.itemName,
        estimated_cost: b.estimatedCost || 0,
        actual_cost: b.actualCost || 0,
        payload: b,
        updated_at: updatedAt,
      }));
      await fetch(`${SUPABASE_URL}/rest/v1/wedding_budgets?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(budgetRows),
      }).catch(() => {});
    }

    const usersList = Array.isArray(state.adminUsers) ? state.adminUsers : [];
    if (usersList.length > 0) {
      const userRows = usersList.map((u) => ({
        id: u.id,
        project_id: 'main',
        username: u.username,
        full_name: u.nama,
        role: u.role,
        committee_role: u.jabatan || '',
        payload: u,
        updated_at: updatedAt,
      }));
      await fetch(`${SUPABASE_URL}/rest/v1/wedding_users?on_conflict=id`, {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify(userRows),
      }).catch(() => {});
    }
    await pruneDeletedRelationalRows(
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
let queuedLatestState: {
  state: WeddingDatabaseSchema;
  options?: { forceOverwrite?: boolean };
} | null = null;

async function executeSingleFlightSave(
  initialState: WeddingDatabaseSchema,
  options?: { forceOverwrite?: boolean }
): Promise<boolean> {
  queuedLatestState = { state: initialState, options };

  if (inFlightSavePromise) {
    return inFlightSavePromise;
  }

  inFlightSavePromise = (async () => {
    let lastResult = false;
    while (queuedLatestState !== null) {
      const itemToProcess = queuedLatestState;
      queuedLatestState = null;
      lastResult = await performActualSupabaseUpsert(
        itemToProcess.state,
        itemToProcess.options
      );
    }
    inFlightSavePromise = null;
    return lastResult;
  })();

  return inFlightSavePromise;
}

async function performActualSupabaseUpsert(
  rawState: WeddingDatabaseSchema,
  options?: { forceOverwrite?: boolean }
): Promise<boolean> {
  setCloudStatus('SYNCING', 'Menyimpan ke Supabase...');
  let state = rawState;

  // Pre-Write Fresh Cloud Fetch & Multi-Device Full Database Merge:
  // First check 45-byte `updated_at` so we ONLY download `data` if another device wrote a newer snapshot!
  if (!options?.forceOverwrite) {
    try {
      const remoteUpdatedAt = await checkCloudStateUpdatedAt();
      const knownSync = lastKnownCloudState?.lastSyncedAt || '';
      const needsFullFetch =
        !lastKnownCloudState ||
        (remoteUpdatedAt &&
          new Date(remoteUpdatedAt).getTime() >
            new Date(knownSync || 0).getTime() + 500);

      if (needsFullFetch) {
        const freshRes = await fetchSupabaseWithRetry(
          `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=data,updated_at`,
          {
            method: 'GET',
            headers: getSupabaseHeaders({ Accept: 'application/json' }),
          },
          3500,
          1
        ).catch(() => null);
        if (freshRes && freshRes.ok) {
          const freshRows = (await freshRes.json().catch(() => null)) as Array<{
            data?: Partial<WeddingDatabaseSchema>;
            updated_at?: string;
          }> | null;
          if (Array.isArray(freshRows) && freshRows[0]?.data) {
            lastKnownCloudState = normalizeCloudState(
              freshRows[0].data,
              freshRows[0].updated_at
            );
          }
        }
      }
    } catch {
      // Ignore pre-write fetch failure and fall back to existing lastKnownCloudState
    }

    if (lastKnownCloudState) {
      state = mergeFullDatabaseMultiDevice(state, lastKnownCloudState, true);
    }
  }

  const updatedAt = state.lastSyncedAt || new Date().toISOString();

  const tryUpsertTable = async (
    dataToSave: WeddingDatabaseSchema
  ): Promise<Response> => {
    const restUrl = `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?on_conflict=id`;
    return fetchSupabaseWithRetry(
      restUrl,
      {
        method: 'POST',
        headers: getSupabaseHeaders({
          Prefer: 'resolution=merge-duplicates,return=minimal',
        }),
        body: JSON.stringify({
          id: SUPABASE_ROW_ID,
          data: dataToSave,
          updated_at: updatedAt,
        }),
      },
      6500,
      2
    );
  };

  const tryUpsertViaSameOriginProxy = async (
    payloadToSave: WeddingDatabaseSchema
  ): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    try {
      const deletedSnap = getExplicitlyDeletedIdsSnapshot();
      const proxyRes = await fetch('/api/supabase-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: payloadToSave,
          updatedAt,
          forceOverwrite: Boolean(options?.forceOverwrite),
          deletedGuestIds: deletedSnap.guests,
          deletedTaskIds: deletedSnap.tasks,
          deletedWishIds: deletedSnap.wishes,
          deletedBudgetIds: deletedSnap.budgets,
        }),
      });
      if (proxyRes.ok) {
        const proxyJson = await proxyRes.json().catch(() => null);
        if (proxyJson?.data) {
          lastKnownCloudState = normalizeCloudState(proxyJson.data, updatedAt);
        } else {
          lastKnownCloudState = payloadToSave;
        }
        setCloudStatus('SYNCED', updatedAt);
        return true;
      }
    } catch {
      // Ignore proxy fallback error
    }
    return false;
  };

  try {
    let cloudSafePayload = await prepareCloudSafeState(
      { ...state, lastSyncedAt: updatedAt },
      false
    );

    let res: Response | null = null;
    let directUpsertError: unknown = null;

    try {
      res = await tryUpsertTable(cloudSafePayload);
    } catch (upsertErr) {
      directUpsertError = upsertErr;
    }

    // If payload hit timeout (500 / 57014 / 504) or 413, retry with optimized payload
    if (
      res &&
      (res.status === 413 ||
        res.status === 500 ||
        res.status === 502 ||
        res.status === 504)
    ) {
      cloudSafePayload = await prepareCloudSafeState(
        { ...state, lastSyncedAt: updatedAt },
        true
      );
      try {
        res = await tryUpsertTable(cloudSafePayload);
      } catch (retryErr) {
        directUpsertError = retryErr;
        res = null;
      }
    }

    if (!res) {
      const proxySaved = await tryUpsertViaSameOriginProxy(cloudSafePayload);
      if (proxySaved) {
        return true;
      }
      throw directUpsertError instanceof Error
        ? directUpsertError
        : new Error('Gagal menyimpan ke Supabase');
    }

    if (res.ok) {
      lastKnownCloudState = cloudSafePayload;
      setCloudStatus('SYNCED', updatedAt);
      return true;
    }

    if (res.status !== 404) {
      const proxySaved = await tryUpsertViaSameOriginProxy(cloudSafePayload);
      if (proxySaved) {
        return true;
      }
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
  state: WeddingDatabaseSchema,
  options?: { forceOverwrite?: boolean }
): Promise<boolean> {
  return executeSingleFlightSave(state, options);
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
  // Never queue a save to Supabase before initial cloud hydration has completed!
  if (!hasCompletedInitialCloudHydration) {
    return;
  }
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

/**
 * Idempotent upsert for Commercial Payment Transactions (`public.wedding_payments`).
 * Uses `on_conflict=idempotency_key` so retries after timeout never create duplicate rows.
 */
export async function upsertCommercialPaymentToSupabase(
  tx: CommercialPaymentTransaction,
  timeoutMs = 10000
): Promise<{ ok: boolean; timedOut?: boolean; error?: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const restUrl = `${SUPABASE_URL}/rest/v1/wedding_payments?on_conflict=idempotency_key`;
    const res = await fetch(restUrl, {
      method: 'POST',
      headers: getSupabaseHeaders({
        Prefer: 'resolution=merge-duplicates,return=minimal',
      }),
      signal: controller.signal,
      body: JSON.stringify({
        id: tx.id,
        idempotency_key: tx.idempotencyKey,
        order_id: tx.orderId,
        setting_id: SUPABASE_ROW_ID,
        package_tier: tx.packageTier,
        market_lang: tx.marketLang,
        currency: tx.currency,
        amount_numeric: tx.amountNumeric,
        channel_id: tx.channelId,
        channel_category: tx.channelCategory,
        buyer_email: tx.buyerEmail,
        buyer_couple_name: tx.buyerCoupleName,
        payment_reference: tx.paymentReference || '',
        status: tx.status,
        retry_count: tx.retryCount,
        last_error_reason: tx.lastErrorOrTimeoutReason || null,
        expires_at: tx.expiresAt,
        data: tx,
        updated_at: tx.updatedAt || new Date().toISOString(),
      }),
    });

    clearTimeout(timer);

    if (res.ok) {
      return { ok: true };
    }

    const errText = await res.text();
    const isTableMissing =
      res.status === 404 ||
      errText.includes('42P01') ||
      errText.includes('PGRST205') ||
      errText.includes('Could not find the table') ||
      errText.includes('relation') ||
      errText.includes('does not exist');

    if (isTableMissing) {
      // Graceful fallback when table `wedding_payments` is not yet created:
      // `commercialPayments` is still persisted in `wedding_settings` / `wedding_state`.
      return { ok: true };
    }

    if (res.status === 504 || res.status === 408 || errText.includes('57014')) {
      return {
        ok: false,
        timedOut: true,
        error:
          'Database request timed out (Idempotency Key preserved for safe retry)',
      };
    }

    return {
      ok: false,
      error: `HTTP ${res.status}: ${errText.slice(0, 140)}`,
    };
  } catch (err) {
    clearTimeout(timer);
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || /abort|timeout/i.test(err.message));
    return {
      ok: false,
      timedOut: true,
      error: isAbort
        ? 'Database request timed out (Idempotency Key preserved for safe retry)'
        : 'Network/connection timeout (Idempotency Key preserved for safe retry)',
    };
  }
}

