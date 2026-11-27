import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  WeddingDatabaseSchema,
  WeddingSettings,
  WeddingTask,
  WeddingGuest,
  GuestWish,
  BudgetVendorItem,
  RsvpStatus,
  AdminUser,
} from '@/types';
import {
  INITIAL_SETTINGS,
  INITIAL_TASKS,
  INITIAL_GUESTS,
  INITIAL_WISHES,
  INITIAL_BUDGET_ITEMS,
  INITIAL_ADMIN_USERS,
  inferTimelinePhase,
} from '@/data/seedData';
import {
  normalizeCloudState,
  saveStateToSupabase,
} from '@/lib/supabaseCloud';
import {
  SUPABASE_ANON_KEY,
  SUPABASE_ROW_ID,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_TABLE_NAME,
  SUPABASE_URL,
} from '@/lib/env';
import { analyzeWishModeration } from '@/lib/clientSync';

const PRIMARY_DB_PATH = path.join(process.cwd(), 'database', 'wedding_db.json');
const LOCAL_DB_PATH = path.join(process.cwd(), '.data', 'wedding_db.json');
const BACKUP_DB_PATH = path.join(
  process.cwd(),
  'data_aplikasi',
  'backups',
  'wedding_db_terbaru.json'
);
const TMP_DB_PATH = path.join('/tmp', 'wedding_db.json');

declare global {
  // eslint-disable-next-line no-var
  var __weddingGlobalStore: WeddingDatabaseSchema | undefined;
}

function createDefaultStore(): WeddingDatabaseSchema {
  return {
    settings: { ...INITIAL_SETTINGS },
    tasks: [...INITIAL_TASKS],
    guests: [...INITIAL_GUESTS],
    wishes: [...INITIAL_WISHES],
    budgetItems: [...INITIAL_BUDGET_ITEMS],
    adminUsers: [...INITIAL_ADMIN_USERS],
    lastSyncedAt: '2026-01-01T00:00:00.000Z',
  };
}

function readDbFromDisk(): WeddingDatabaseSchema {
  const defaultStore = createDefaultStore();
  const candidatePaths = [TMP_DB_PATH, LOCAL_DB_PATH, PRIMARY_DB_PATH, BACKUP_DB_PATH];

  let bestCandidate: WeddingDatabaseSchema | null = null;
  let bestTime = -1;

  for (const dbPath of candidatePaths) {
    try {
      if (fs.existsSync(dbPath)) {
        const raw = fs.readFileSync(dbPath, 'utf-8');
        const parsed = JSON.parse(raw) as Partial<WeddingDatabaseSchema>;

        const syncedIso = parsed.lastSyncedAt || '2026-01-01T00:00:00.000Z';
        const candidateTime = new Date(syncedIso).getTime() || 0;

        const candidate: WeddingDatabaseSchema = {
          settings: parsed.settings
            ? { ...defaultStore.settings, ...parsed.settings }
            : defaultStore.settings,
          tasks: Array.isArray(parsed.tasks)
            ? parsed.tasks.map((t) => ({
                ...t,
                timelinePhase: t.timelinePhase || inferTimelinePhase(t.due, t.category),
                status: t.done ? 'SELESAI' : t.status || 'BELUM',
              }))
            : defaultStore.tasks,
          guests: Array.isArray(parsed.guests) ? parsed.guests : defaultStore.guests,
          wishes: Array.isArray(parsed.wishes) ? parsed.wishes : defaultStore.wishes,
          budgetItems: Array.isArray(parsed.budgetItems)
            ? parsed.budgetItems
            : defaultStore.budgetItems,
          adminUsers:
            Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
              ? parsed.adminUsers
              : defaultStore.adminUsers,
          lastSyncedAt: syncedIso,
        };

        if (
          !candidate.settings.siteTitle ||
          candidate.settings.siteTitle === 'My Wedding Manager' ||
          /wedding\s*readiness\s*tracker/i.test(candidate.settings.siteTitle)
        ) {
          candidate.settings.siteTitle = 'My Event Planner';
        }

        if (!bestCandidate || candidateTime > bestTime) {
          bestCandidate = candidate;
          bestTime = candidateTime;
        }
      }
    } catch {
      // Continue to next path or fallback
    }
  }

  return bestCandidate || defaultStore;
}

function persistStore(
  store: WeddingDatabaseSchema,
  updateTimestamp = true,
  syncCloud = false
): void {
  if (updateTimestamp || !store.lastSyncedAt) {
    store.lastSyncedAt = new Date().toISOString();
  }
  globalThis.__weddingGlobalStore = store;
  const serialized = JSON.stringify(store, null, 2);

  for (const targetPath of [PRIMARY_DB_PATH, LOCAL_DB_PATH, BACKUP_DB_PATH, TMP_DB_PATH]) {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, serialized, 'utf-8');
    } catch {
      // Ignore individual path error in restricted serverless environments
    }
  }

  if (updateTimestamp && syncCloud) {
    void saveStateToSupabase(store);
  }
}

function getStore(): WeddingDatabaseSchema {
  if (!globalThis.__weddingGlobalStore) {
    globalThis.__weddingGlobalStore = readDbFromDisk();
    persistStore(globalThis.__weddingGlobalStore, false, false);
  }
  return globalThis.__weddingGlobalStore;
}

/**
 * Strips every credential material before a state object leaves the server.
 *
 * `password` (plaintext) and `passwordHash` must never be serialised into an
 * HTTP response, a browser cache, or the client-side localStorage snapshot.
 * They stay server-side only; the client identifies accounts by id/username/
 * email/role and authenticates through the session cookie.
 */
function sanitizeStoreForClient(store: WeddingDatabaseSchema): WeddingDatabaseSchema {
  return {
    ...store,
    adminUsers: store.adminUsers.map((u) => ({
      id: u.id,
      username: u.username,
      nama: u.nama,
      role: u.role,
      jabatan: u.jabatan,
      email: u.email,
      isDefaultUser: u.isDefaultUser,
      clientId: u.clientId || 'client-utama',
      clientName: u.clientName || 'Client Utama • Eko & Selo',
    })),
  };
}

/**
 * Removes credential material from a state object before it is written to the
 * cloud. The password hashes live in the server-side credential vault only.
 */
export function stripCredentialFields(
  store: WeddingDatabaseSchema
): WeddingDatabaseSchema {
  return {
    ...store,
    adminUsers: store.adminUsers.map((u) => ({
      id: u.id,
      username: u.username,
      nama: u.nama,
      role: u.role,
      jabatan: u.jabatan,
      email: u.email,
      isDefaultUser: u.isDefaultUser,
      clientId: u.clientId || 'client-utama',
      clientName: u.clientName || 'Client Utama • Eko & Selo',
    })),
  };
}

/**
 * Re-attaches server-held password hashes to an incoming user list.
 *
 * The browser never receives password hashes (see `sanitizeStoreForClient`),
 * so a full-state write coming back from a client has users without hashes.
 * Without this, a routine sync would erase every stored credential and lock
 * all accounts out. Only a server-side write may change a hash.
 */
export function preserveCredentials(
  existing: AdminUser[],
  incoming: AdminUser[]
): AdminUser[] {
  const byId = new Map<string, AdminUser>();
  const byUsername = new Map<string, AdminUser>();

  for (const user of existing) {
    if (user?.id) byId.set(user.id, user);
    const uname = (user?.username || '').trim().toLowerCase();
    if (uname) byUsername.set(uname, user);
  }

  return incoming.map((user) => {
    const prior =
      byId.get(user.id) ||
      byUsername.get((user.username || '').trim().toLowerCase());
    if (!prior) return user;
    if (prior.passwordHash && !user.passwordHash) {
      return { ...user, passwordHash: prior.passwordHash };
    }
    return user;
  });
}

function formatDateSlash(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

/* -------------------------------------------------------------------------- */
/* Pending registrations (email verification)                                 */
/* -------------------------------------------------------------------------- */

export interface PendingRegistration {
  userId: string;
  username: string;
  email: string;
  nama: string;
  role: AdminUser['role'];
  jabatan: string;
  clientId: string;
  clientName: string;
  packageId: string;
  eventType: string;
  catalogThemeId: string;
  /** SHA-256 of the emailed token. The raw token is never stored. */
  tokenHash: string;
  expiresAt: number;
}

const PENDING_REGISTRATIONS_PATH = path.join(
  process.cwd(),
  '.data',
  'pending_registrations.json'
);

let pendingRegistrations: Map<string, PendingRegistration> | null = null;

function loadPendingRegistrations(): Map<string, PendingRegistration> {
  if (pendingRegistrations) return pendingRegistrations;
  const map = new Map<string, PendingRegistration>();
  try {
    if (fs.existsSync(PENDING_REGISTRATIONS_PATH)) {
      const parsed = JSON.parse(
        fs.readFileSync(PENDING_REGISTRATIONS_PATH, 'utf-8')
      ) as PendingRegistration[];
      if (Array.isArray(parsed)) {
        const now = Date.now();
        for (const entry of parsed) {
          if (entry?.email && entry.expiresAt > now) {
            map.set(entry.email.toLowerCase(), entry);
          }
        }
      }
    }
  } catch {
    // Ignore unreadable cache — the user can simply register again.
  }
  pendingRegistrations = map;
  return map;
}

function persistPendingRegistrations(): void {
  try {
    const map = loadPendingRegistrations();
    const dir = path.dirname(PENDING_REGISTRATIONS_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      PENDING_REGISTRATIONS_PATH,
      JSON.stringify(Array.from(map.values()), null, 2),
      'utf-8'
    );
  } catch {
    // Ignore write errors in restricted serverless environments.
  }
}

/**
 * Stores a registration that is waiting for email verification.
 *
 * Only the hash of the verification token is kept, so a leaked file cannot be
 * used to activate an account.
 */
export function setPendingRegistration(
  email: string,
  data: {
    id: string;
    username: string;
    nama: string;
    role: AdminUser['role'];
    jabatan: string;
    clientId: string;
    clientName: string;
    packageId: string;
    eventType: string;
    catalogThemeId: string;
    verifyToken: string;
  }
): PendingRegistration {
  const map = loadPendingRegistrations();
  const entry: PendingRegistration = {
    userId: data.id,
    username: data.username,
    email: email.toLowerCase(),
    nama: data.nama,
    role: data.role,
    jabatan: data.jabatan,
    clientId: data.clientId,
    clientName: data.clientName,
    packageId: data.packageId,
    eventType: data.eventType,
    catalogThemeId: data.catalogThemeId,
    tokenHash: hashVerificationToken(data.verifyToken),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };
  map.set(entry.email, entry);
  persistPendingRegistrations();
  return entry;
}

/**
 * Consumes a pending registration when a valid verification token is
 * presented. Returns null when the token is unknown, expired or already used.
 */
export function consumePendingRegistration(
  email: string,
  rawToken: string
): PendingRegistration | null {
  const map = loadPendingRegistrations();
  const key = email.trim().toLowerCase();
  const entry = map.get(key);
  if (!entry) return null;
  if (entry.expiresAt <= Date.now()) {
    map.delete(key);
    persistPendingRegistrations();
    return null;
  }
  if (entry.tokenHash !== hashVerificationToken(rawToken)) {
    return null;
  }
  map.delete(key);
  persistPendingRegistrations();
  return entry;
}

export function hashVerificationToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
}

interface VaultCredentialRow {
  user_id?: string;
  username?: string;
  email?: string | null;
  password_hash?: string;
  role?: string;
  client_id?: string | null;
}

async function fetchVaultCredentials(): Promise<VaultCredentialRow[]> {
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !SUPABASE_URL) return [];
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_user_credentials?select=user_id,username,email,password_hash,role,client_id`,
      {
        method: 'GET',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return [];
    const rows = (await res.json().catch(() => null)) as VaultCredentialRow[] | null;
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

async function upsertVaultCredential(user: AdminUser): Promise<boolean> {
  const key = SUPABASE_SERVICE_ROLE_KEY;
  if (!key || !SUPABASE_URL || !user.id || !user.passwordHash) return false;
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/app_user_credentials?on_conflict=user_id`,
      {
        method: 'POST',
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
          Prefer: 'resolution=merge-duplicates,return=minimal',
        },
        body: JSON.stringify({
          user_id: user.id,
          username: (user.username || '').trim().toLowerCase(),
          email: user.email ? user.email.trim().toLowerCase() : null,
          password_hash: user.passwordHash,
          role: user.role || 'PANITIA',
          client_id: user.clientId || 'client-utama',
          updated_at: new Date().toISOString(),
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

function mergeVaultCredentials(
  vaultRows: VaultCredentialRow[],
  incoming: AdminUser[]
): AdminUser[] {
  if (!vaultRows.length) return incoming;
  const byId = new Map<string, string>();
  const byUsername = new Map<string, string>();
  const byEmail = new Map<string, string>();

  for (const row of vaultRows) {
    if (!row?.password_hash) continue;
    if (row.user_id) byId.set(row.user_id, row.password_hash);
    const uname = (row.username || '').trim().toLowerCase();
    if (uname) byUsername.set(uname, row.password_hash);
    const em = (row.email || '').trim().toLowerCase();
    if (em) byEmail.set(em, row.password_hash);
  }

  return incoming.map((user) => {
    const hash =
      byId.get(user.id) ||
      byUsername.get((user.username || '').trim().toLowerCase()) ||
      (user.email ? byEmail.get(user.email.trim().toLowerCase()) : undefined);
    if (hash) {
      return { ...user, passwordHash: hash };
    }
    return user;
  });
}

export const serverStore = {
  persistUserCredentialToVault: async (user: AdminUser): Promise<boolean> => {
    return upsertVaultCredential(user);
  },

  persistStateToSupabaseDirect: async (): Promise<boolean> => {
    const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
    if (!key || !SUPABASE_URL) return false;
    try {
      const store = getStore();
      const syncTime = new Date().toISOString();
      store.lastSyncedAt = syncTime;
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?on_conflict=id`,
        {
          method: 'POST',
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({
            id: SUPABASE_ROW_ID,
            data: stripCredentialFields(store),
            updated_at: syncTime,
          }),
        }
      );
      return res.ok;
    } catch {
      return false;
    }
  },

  ensureCleanClientWorkspace: (input: {
    clientId: string;
    clientCode: string;
    clientName: string;
    coupleLabel: string;
    ownerEmail: string;
    eventType?: WeddingSettings['eventType'];
    accountMode?: 'CLIENT' | 'PLANNER';
  }): void => {
    const store = getStore();
    const nowIso = new Date().toISOString();
    const cleanCouple = input.coupleLabel.trim() || input.clientName;
    const parts = cleanCouple.split('&').map((p) => p.trim());
    const groomPart = parts[0] || cleanCouple;
    const bridePart = parts[1] || 'Pasangan';
    const hasSecond =
      (input.eventType || 'WEDDING') === 'WEDDING' || parts.length > 1;

    const existingGroups = Array.isArray(store.settings.clientGroups)
      ? [...store.settings.clientGroups]
      : [];
    if (!existingGroups.some((g) => g.id === input.clientId)) {
      existingGroups.push({
        id: input.clientId,
        clientCode: input.clientCode.toUpperCase().slice(0, 12),
        clientName: input.clientName,
        coupleLabel: cleanCouple,
        packageTier: 'STARTER',
        status: 'ACTIVE',
        eventType: input.eventType || 'WEDDING',
        notes: `${
          input.accountMode === 'PLANNER' ? 'Event Planner / WO' : 'Klien Acara'
        } (${input.ownerEmail}) • Paket GRATIS`,
        createdAt: nowIso,
      });
    }

    const existingWorkspaces = { ...(store.settings.clientWorkspaces || {}) };
    if (!existingWorkspaces[input.clientId]) {
      const cleanSettings: WeddingSettings = {
        ...INITIAL_SETTINGS,
        siteTitle: 'MEPlanner — My Event Planner',
        activeClientId: input.clientId,
        eventType: input.eventType || 'WEDDING',
        storageQuotaLimitMb: 50,
        subscriptionPackageId: 'GRATIS',
        ownerGoogleEmail: input.ownerEmail,
        groomFullName: groomPart,
        groomNickname: groomPart.split(' ')[0] || groomPart,
        groomRankAndTitle:
          input.accountMode === 'PLANNER' ? 'Penyelenggara / WO' : 'Mempelai Pria',
        groomUnit: '',
        groomParents: `Keluarga Besar ${groomPart}`,
        groomOrigin: '',
        brideFullName: bridePart,
        brideNickname: bridePart.split(' ')[0] || bridePart,
        brideTitle: 'Mempelai Wanita',
        brideParents: `Keluarga Besar ${bridePart}`,
        brideOrigin: '',
        showSecondProfile: hasSecond,
        event1Title: 'Acara Inti / Pemberkatan',
        event1Subtitle: 'Rangkaian Acara Utama',
        event1DateLabel: 'Tanggal Belum Diatur',
        event1TimeLabel: '09.00 WIB - Selesai',
        event1Venue: 'Lokasi Acara Belum Diatur',
        event1Address: '',
        event2Title: 'Resepsi / Ramah Tamah',
        event2Subtitle: 'Silakan lengkapi detail jadwal di menu Pengaturan',
        event2DateLabel: 'Tanggal Belum Diatur',
        event2TimeLabel: '11.00 WIB - Selesai',
        event2Venue: 'Lokasi Resepsi Belum Diatur',
        event2Address: '',
        event3Title: '',
        event3Subtitle: '',
        event3DateLabel: '',
        event3TimeLabel: '',
        event3Venue: '',
        event3Address: '',
        showEvent3: false,
        scheduleEvents: [
          {
            id: `ev_${input.clientCode.toLowerCase()}_1`,
            badge: 'Acara Utama',
            title: 'Acara Inti / Resepsi',
            venue: 'Lokasi Acara Belum Diatur',
            address: '',
            mapsUrl: '',
            datetime: '',
            subtitle: 'Silakan lengkapi detail acara di menu Pengaturan',
            dateLabel: 'Tanggal Belum Diatur',
            dresscode: '',
            timeLabel: '10.00 WIB - Selesai',
            enableCountdown: true,
            showOnInvitation: true,
          },
        ],
        loveStory: [],
        subtitle: cleanCouple,
        updatedAt: nowIso,
        updatedBy: input.ownerEmail,
      };
      delete cleanSettings.clientWorkspaces;

      existingWorkspaces[input.clientId] = {
        clientId: input.clientId,
        settings: cleanSettings,
        tasks: [],
        guests: [],
        wishes: [],
        budgetItems: [],
        updatedAt: nowIso,
      };
    }

    store.settings = {
      ...store.settings,
      clientGroups: existingGroups,
      clientWorkspaces: existingWorkspaces,
      updatedAt: nowIso,
    };
    persistStore(store, true, false);
  },

  reconcileWithSupabase: async (): Promise<WeddingDatabaseSchema> => {
    const localStore = getStore();
    try {
      const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
      if (key && SUPABASE_URL) {
        const [res, vaultRows] = await Promise.all([
          fetch(
            `${SUPABASE_URL}/rest/v1/${SUPABASE_TABLE_NAME}?id=eq.${SUPABASE_ROW_ID}&select=id,data,updated_at`,
            {
              method: 'GET',
              headers: {
                apikey: key,
                Authorization: `Bearer ${key}`,
                Accept: 'application/json',
              },
              cache: 'no-store',
            }
          ),
          fetchVaultCredentials(),
        ]);
        if (res.ok) {
          const rows = (await res.json()) as Array<{
            id?: string;
            data?: Partial<WeddingDatabaseSchema>;
            updated_at?: string;
          }>;
          const row = Array.isArray(rows) ? rows[0] : undefined;
          if (row?.data) {
            const cloudState = normalizeCloudState(row.data, row.updated_at);
            // 1. Re-attach persistent server-side password hashes from app_user_credentials vault
            cloudState.adminUsers = mergeVaultCredentials(
              vaultRows,
              cloudState.adminUsers
            );
            // 2. Fallback to in-memory / seed hashes for any user not yet migrated into vault
            cloudState.adminUsers = preserveCredentials(
              localStore.adminUsers,
              cloudState.adminUsers
            );
            persistStore(cloudState, false, false);
            return cloudState;
          }
        }
      }
    } catch {
      // Fallback to localStore
    }
    return localStore;
  },

  getFullState: (hideBudgetForPanitia = false): WeddingDatabaseSchema => {
    const sanitized = sanitizeStoreForClient(getStore());
    if (hideBudgetForPanitia) {
      return {
        ...sanitized,
        budgetItems: [],
        settings: {
          ...sanitized.settings,
          totalBudgetCap: 0,
        },
      };
    }
    return sanitized;
  },

  getAdminUsers: (): AdminUser[] => {
    return getStore().adminUsers;
  },

  updateAdminUser: (id: string, partial: Partial<AdminUser>): AdminUser => {
    const store = getStore();
    const idx = store.adminUsers.findIndex((u) => u.id === id);
    if (idx >= 0) {
      store.adminUsers[idx] = {
        ...store.adminUsers[idx],
        ...partial,
      };
      persistStore(store);
      return store.adminUsers[idx];
    }
    const fallback: AdminUser = {
      id: id || `usr_${Date.now().toString(36)}`,
      username: partial.username || 'user',
      nama: partial.nama || 'User',
      role: partial.role || 'PANITIA',
      jabatan: partial.jabatan || 'Panitia',
      email: partial.email || '',
      isDefaultUser: Boolean(partial.isDefaultUser),
      clientId: partial.clientId || 'client-utama',
      clientName: partial.clientName || 'Client Utama • Eko & Selo',
      passwordHash: partial.passwordHash,
    };
    store.adminUsers.push(fallback);
    persistStore(store);
    return fallback;
  },

  upsertPanitiaUser: (input: {
    id?: string;
    username: string;
    nama: string;
    email?: string;
    jabatan?: string;
    clientId?: string;
    clientName?: string;
    passwordHash?: string;
  }): AdminUser => {
    const store = getStore();
    const cleanUsername = input.username.trim().toLowerCase();
    const cleanEmail =
      input.email !== undefined ? input.email.trim().toLowerCase() : undefined;
    const existingIdx = input.id
      ? store.adminUsers.findIndex((u) => u.id === input.id)
      : store.adminUsers.findIndex(
          (u) => !u.isDefaultUser && u.username.toLowerCase() === cleanUsername
        );

    if (existingIdx >= 0) {
      const prev = store.adminUsers[existingIdx];
      const updated: AdminUser = {
        ...prev,
        username: cleanUsername,
        nama: input.nama.trim(),
        jabatan: input.jabatan || prev.jabatan || 'Panitia Operasional',
        email:
          cleanEmail !== undefined
            ? cleanEmail || `${cleanUsername}@wedding.local`
            : prev.email || `${cleanUsername}@wedding.local`,
        clientId: input.clientId || prev.clientId || 'client-utama',
        clientName: input.clientName || prev.clientName || 'Client Utama • Eko & Selo',
        ...(input.passwordHash ? { passwordHash: input.passwordHash, password: '' } : {}),
      };
      store.adminUsers[existingIdx] = updated;
      persistStore(store);
      return updated;
    }

    const newPanitia: AdminUser = {
      id: `panitia_${Date.now().toString(36)}`,
      username: cleanUsername,
      nama: input.nama.trim(),
      role: 'PANITIA',
      jabatan: input.jabatan || 'Panitia / WO (Akses Non-Budgeting)',
      email: cleanEmail || `${cleanUsername}@wedding.local`,
      isDefaultUser: false,
      clientId: input.clientId || 'client-utama',
      clientName: input.clientName || 'Client Utama • Eko & Selo',
      passwordHash: input.passwordHash,
    };
    store.adminUsers.push(newPanitia);
    persistStore(store);
    return newPanitia;
  },

  deletePanitiaUser: (id: string): boolean => {
    const store = getStore();
    const target = store.adminUsers.find((u) => u.id === id);
    if (!target || target.isDefaultUser) {
      return false; // Cannot delete default users via panitia delete
    }
    store.adminUsers = store.adminUsers.filter((u) => u.id !== id);
    persistStore(store);
    return true;
  },

  upsertSuperadminUser: (input: {
    id?: string;
    username: string;
    email?: string;
    nama: string;
    jabatan?: string;
    passwordHash?: string;
  }): AdminUser => {
    const store = getStore();
    const cleanUsername = input.username.trim().toLowerCase();
    const cleanEmail = (input.email || '').trim().toLowerCase() || `${cleanUsername}@meplanner.id`;
    const existingIdx = input.id
      ? store.adminUsers.findIndex((u) => u.id === input.id)
      : store.adminUsers.findIndex(
          (u) =>
            u.role === 'SUPERADMIN' &&
            (u.username.toLowerCase() === cleanUsername ||
              (u.email && u.email.toLowerCase() === cleanEmail))
        );

    if (existingIdx >= 0) {
      const prev = store.adminUsers[existingIdx];
      const updated: AdminUser = {
        ...prev,
        username: cleanUsername,
        email: cleanEmail,
        nama: input.nama.trim(),
        role: 'SUPERADMIN',
        jabatan: input.jabatan || prev.jabatan || 'Co-Developer & Superadmin',
        clientId: 'client-demo',
        clientName: 'Klien Demo • Rayhan & Clarissa',
        isDefaultUser: false,
        ...(input.passwordHash ? { passwordHash: input.passwordHash, password: '' } : {}),
      };
      store.adminUsers[existingIdx] = updated;
      persistStore(store);
      return updated;
    }

    const newSuperadmin: AdminUser = {
      id: `superadmin_${Date.now().toString(36)}`,
      username: cleanUsername,
      email: cleanEmail,
      nama: input.nama.trim(),
      role: 'SUPERADMIN',
      jabatan: input.jabatan || 'Co-Developer & Superadmin',
      isDefaultUser: false,
      clientId: 'client-demo',
      clientName: 'Klien Demo • Rayhan & Clarissa',
      passwordHash: input.passwordHash,
    };
    store.adminUsers.push(newSuperadmin);
    persistStore(store);
    return newSuperadmin;
  },

  deleteSuperadminUser: (id: string): boolean => {
    const store = getStore();
    const target = store.adminUsers.find((u) => u.id === id && u.role === 'SUPERADMIN');
    if (!target) return false;
    const lowerUser = (target.username || '').toLowerCase();
    const lowerEmail = (target.email || '').toLowerCase();
    if (
      target.id === 'superadmin-owner' ||
      lowerUser === 'superadmin' ||
      lowerUser === 'omeko42' ||
      lowerEmail === 'agungkrisdianto98@gmail.com' ||
      lowerEmail === 'e98.bisnis@gmail.com'
    ) {
      return false; // Primary owner cannot be deleted
    }
    store.adminUsers = store.adminUsers.filter((u) => u.id !== id);
    persistStore(store);
    return true;
  },

  createClientDefaultUsersGroup: (input: {
    clientId: string;
    clientCode: string;
    clientName: string;
    coupleLabel: string;
    packageTier: 'STARTER' | 'EXCLUSIVE' | 'ROYAL_VIP';
    eventDate?: string;
    notes?: string;
    passwordHash: string;
  }): AdminUser[] => {
    const store = getStore();
    const prefix = input.clientCode
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/^_+|_+$/g, '') || `client_${Date.now().toString(36).slice(-4)}`;

    const templates: Array<{
      suffix: string;
      nama: string;
      role: AdminUser['role'];
      jabatan: string;
    }> = [
      {
        suffix: 'pria',
        nama: `Mempelai Pria (${input.coupleLabel})`,
        role: 'MEMPELAI_PRIA',
        jabatan: `User Default • Mempelai Pria (${input.clientCode})`,
      },
      {
        suffix: 'wanita',
        nama: `Mempelai Wanita (${input.coupleLabel})`,
        role: 'MEMPELAI_WANITA',
        jabatan: `User Default • Mempelai Wanita (${input.clientCode})`,
      },
      {
        suffix: 'kel_pria',
        nama: `Keluarga Pria (${input.coupleLabel})`,
        role: 'KELUARGA_PRIA',
        jabatan: `User Default • Keluarga Pria (${input.clientCode})`,
      },
      {
        suffix: 'kel_wanita',
        nama: `Keluarga Wanita (${input.coupleLabel})`,
        role: 'KELUARGA_WANITA',
        jabatan: `User Default • Keluarga Wanita (${input.clientCode})`,
      },
    ];

    const createdUsers: AdminUser[] = [];
    for (const tpl of templates) {
      const candidateUsername = `${prefix}_${tpl.suffix}`;
      const existing = store.adminUsers.find(
        (u) => u.username.toLowerCase() === candidateUsername
      );
      if (existing) {
        createdUsers.push(existing);
        continue;
      }
      const newUser: AdminUser = {
        id: `usr_${prefix}_${tpl.suffix}_${Date.now().toString(36).slice(-4)}`,
        username: candidateUsername,
        nama: tpl.nama,
        role: tpl.role,
        jabatan: tpl.jabatan,
        email: `${candidateUsername}@wedding.local`,
        isDefaultUser: true,
        clientId: input.clientId,
        clientName: input.clientName,
        passwordHash: input.passwordHash,
      };
      store.adminUsers.push(newUser);
      createdUsers.push(newUser);
    }

    const existingGroups = Array.isArray(store.settings.clientGroups)
      ? [...store.settings.clientGroups]
      : [];
    if (!existingGroups.some((g) => g.id === input.clientId)) {
      existingGroups.push({
        id: input.clientId,
        clientCode: input.clientCode.toUpperCase(),
        clientName: input.clientName,
        coupleLabel: input.coupleLabel,
        packageTier: input.packageTier,
        status: 'ACTIVE',
        eventDate: input.eventDate || '2026-12-19',
        notes: input.notes || '',
        createdAt: new Date().toISOString(),
      });
      store.settings = {
        ...store.settings,
        clientGroups: existingGroups,
        updatedAt: new Date().toISOString(),
      };
    }

    persistStore(store);
    return createdUsers;
  },

  deleteClientGroupAndUsers: (clientId: string): boolean => {
    if (!clientId || clientId === 'client-utama') return false;
    const store = getStore();
    store.adminUsers = store.adminUsers.filter(
      (u) => (u.clientId || 'client-utama') !== clientId
    );
    if (Array.isArray(store.settings.clientGroups)) {
      store.settings = {
        ...store.settings,
        clientGroups: store.settings.clientGroups.filter((g) => g.id !== clientId),
        activeClientId:
          store.settings.activeClientId === clientId
            ? 'client-utama'
            : store.settings.activeClientId,
        updatedAt: new Date().toISOString(),
      };
    }
    persistStore(store);
    return true;
  },

  getSettings: (): WeddingSettings => {
    return getStore().settings;
  },

  updateSettings: (partial: Partial<WeddingSettings>): WeddingSettings => {
    const store = getStore();
    store.settings = {
      ...store.settings,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    persistStore(store);
    return store.settings;
  },

  getTasks: (): WeddingTask[] => {
    return getStore().tasks;
  },

  upsertTask: (taskInput: Partial<WeddingTask> & { title: string }): WeddingTask => {
    const store = getStore();
    const nowSlash = formatDateSlash();
    const existingIdx = taskInput.id
      ? store.tasks.findIndex((t) => t.id === taskInput.id)
      : -1;

    const isDone =
      taskInput.done !== undefined
        ? Boolean(taskInput.done)
        : taskInput.status === 'SELESAI';
    const resolvedStatus = isDone
      ? 'SELESAI'
      : taskInput.status || 'BELUM';
    const resolvedCategory = taskInput.category || 'Acara';
    const resolvedDue = taskInput.due || '2026-12-01';

    if (existingIdx >= 0) {
      const prev = store.tasks[existingIdx];
      const updated: WeddingTask = {
        ...prev,
        ...taskInput,
        category: resolvedCategory,
        due: resolvedDue,
        timelinePhase:
          taskInput.timelinePhase ||
          prev.timelinePhase ||
          inferTimelinePhase(resolvedDue, resolvedCategory),
        done: isDone,
        status: resolvedStatus,
        doneAt: isDone ? prev.doneAt || nowSlash : '',
        updatedAt: nowSlash,
        updatedBy: taskInput.updatedBy || prev.updatedBy || 'mempelai_pria',
      };
      store.tasks[existingIdx] = updated;
      persistStore(store);
      return updated;
    }

    const newTask: WeddingTask = {
      id: taskInput.id || `task_${Date.now().toString(36)}`,
      category: resolvedCategory,
      timelinePhase:
        taskInput.timelinePhase || inferTimelinePhase(resolvedDue, resolvedCategory),
      title: taskInput.title.trim(),
      due: resolvedDue,
      priority: taskInput.priority || 'Sedang',
      owner: taskInput.owner || 'Bersama',
      status: resolvedStatus,
      notes: taskInput.notes || '',
      done: isDone,
      doneAt: isDone ? nowSlash : '',
      createdAt: nowSlash,
      updatedAt: nowSlash,
      updatedBy: taskInput.updatedBy || 'mempelai_pria',
    };

    store.tasks.push(newTask);
    persistStore(store);
    return newTask;
  },

  deleteTask: (id: string): boolean => {
    const store = getStore();
    const before = store.tasks.length;
    store.tasks = store.tasks.filter((t) => t.id !== id);
    if (store.tasks.length !== before) {
      persistStore(store);
      return true;
    }
    return false;
  },

  getGuests: (): WeddingGuest[] => {
    return getStore().guests;
  },

  upsertGuest: (guestInput: Partial<WeddingGuest> & { guestName: string }): WeddingGuest => {
    const store = getStore();
    const nowSlash = formatDateSlash();
    const existingIdx = guestInput.id
      ? store.guests.findIndex((g) => g.id === guestInput.id)
      : guestInput.invitationCode
      ? store.guests.findIndex((g) => g.invitationCode === guestInput.invitationCode)
      : -1;

    if (existingIdx >= 0) {
      const prev = store.guests[existingIdx];
      const nextPax =
        guestInput.pax !== undefined ? Number(guestInput.pax) : prev.pax;
      const nextRsvp = guestInput.rsvpStatus || prev.rsvpStatus;
      const nextConfirmedPax =
        nextRsvp === 'Tidak Hadir'
          ? 0
          : guestInput.confirmedPax !== undefined &&
            guestInput.pax === prev.pax
          ? Number(guestInput.confirmedPax)
          : nextPax;
      const updated: WeddingGuest = {
        ...prev,
        ...guestInput,
        pax: nextPax,
        confirmedPax: nextConfirmedPax,
        guestName: guestInput.guestName.trim(),
        updatedAt: nowSlash,
        updatedBy: guestInput.updatedBy || prev.updatedBy || 'mempelai_pria',
      };
      store.guests[existingIdx] = updated;
      persistStore(store);
      return updated;
    }

    const maxCodeNum = store.guests.reduce((max, g) => {
      const match = /INV-(\d+)/i.exec(g.invitationCode || '');
      const num = match ? parseInt(match[1], 10) : 0;
      return num > max ? num : max;
    }, 0);
    const nextCode =
      guestInput.invitationCode || `INV-${String(maxCodeNum + 1).padStart(4, '0')}`;

    const initialPax = guestInput.pax !== undefined ? Number(guestInput.pax) : 2;
    const initialRsvp = guestInput.rsvpStatus || 'Belum Konfirmasi';
    const newGuest: WeddingGuest = {
      id: guestInput.id || `guest_${Date.now().toString(36)}`,
      invitationCode: nextCode,
      guestName: guestInput.guestName.trim(),
      guestType: guestInput.guestType || 'Teman/Sahabat',
      side: guestInput.side || 'Bersama',
      institution: guestInput.institution || '',
      invitationFormat: guestInput.invitationFormat || 'Cetak Tebal',
      priority: guestInput.priority || 'P2 - Utama',
      cardQty: guestInput.cardQty !== undefined ? Number(guestInput.cardQty) : 1,
      pax: initialPax,
      confirmedPax:
        initialRsvp === 'Tidak Hadir'
          ? 0
          : guestInput.confirmedPax !== undefined
          ? Number(guestInput.confirmedPax)
          : initialPax,
      phone: guestInput.phone || '',
      address: guestInput.address || '',
      deliveryStatus: guestInput.deliveryStatus || 'Belum Disiapkan',
      rsvpStatus: initialRsvp,
      attendanceStatus: guestInput.attendanceStatus || 'Belum Dicek',
      notes: guestInput.notes || '',
      wishes: guestInput.wishes || '',
      sessionChoice: guestInput.sessionChoice || 'Pemberkatan & Resepsi',
      createdAt: nowSlash,
      updatedAt: nowSlash,
      updatedBy: guestInput.updatedBy || 'mempelai_pria',
    };

    store.guests.push(newGuest);
    persistStore(store);
    return newGuest;
  },

  deleteGuest: (id: string): boolean => {
    const store = getStore();
    const before = store.guests.length;
    store.guests = store.guests.filter((g) => g.id !== id);
    if (store.guests.length !== before) {
      persistStore(store);
      return true;
    }
    return false;
  },

  submitPublicRsvp: (payload: {
    guestName: string;
    invitationCode?: string;
    institution?: string;
    relation?: string;
    phone?: string;
    rsvpStatus: RsvpStatus;
    pax: number;
    sessionChoice?: WeddingGuest['sessionChoice'];
    message?: string;
    originalUrlGuestParam?: string;
    originalUrlCodeParam?: string;
    matchedGuestRecordName?: string;
    ipAddress?: string;
    userAgent?: string;
    devicePlatform?: string;
  }): { guest: WeddingGuest; wish?: GuestWish } => {
    const store = getStore();
    const nowSlash = formatDateSlash();
    const cleanName = payload.guestName.trim();
    const submittedPax = Math.max(0, Number(payload.pax) || 1);

    const matchIdx = store.guests.findIndex(
      (g) =>
        (payload.invitationCode &&
          g.invitationCode.toLowerCase() === payload.invitationCode.trim().toLowerCase()) ||
        g.guestName.trim().toLowerCase() === cleanName.toLowerCase()
    );

    let targetGuest: WeddingGuest;
    if (matchIdx >= 0) {
      const prev = store.guests[matchIdx];
      targetGuest = {
        ...prev,
        rsvpStatus: payload.rsvpStatus,
        pax: payload.rsvpStatus === 'Hadir' ? submittedPax : prev.pax,
        confirmedPax: payload.rsvpStatus === 'Hadir' ? submittedPax : 0,
        phone: payload.phone || prev.phone,
        institution: payload.institution || prev.institution,
        sessionChoice: payload.sessionChoice || prev.sessionChoice || 'Pemberkatan & Resepsi',
        wishes: payload.message || prev.wishes,
        updatedAt: nowSlash,
        updatedBy: 'Public RSVP Online',
      };
      store.guests[matchIdx] = targetGuest;
    } else {
      const maxCodeNum = store.guests.reduce((max, g) => {
        const match = /INV-(\d+)/i.exec(g.invitationCode || '');
        const num = match ? parseInt(match[1], 10) : 0;
        return num > max ? num : max;
      }, 0);
      const nextCode = `INV-${String(maxCodeNum + 1).padStart(4, '0')}`;
      targetGuest = {
        id: `guest_rsvp_${Date.now().toString(36)}`,
        invitationCode: nextCode,
        guestName: cleanName,
        guestType: 'Teman/Sahabat',
        side: 'Bersama',
        institution: payload.institution || payload.relation || 'Tamu Undangan Digital',
        invitationFormat: 'Online',
        priority: 'P2 - Utama',
        cardQty: 0,
        pax: submittedPax || 2,
        confirmedPax: payload.rsvpStatus === 'Hadir' ? submittedPax : 0,
        phone: payload.phone || '',
        address: '',
        deliveryStatus: 'Sudah Diterima',
        rsvpStatus: payload.rsvpStatus,
        attendanceStatus: 'Belum Dicek',
        notes: 'Konfirmasi mandiri melalui halaman Undangan Digital',
        wishes: payload.message || '',
        sessionChoice: payload.sessionChoice || 'Pemberkatan & Resepsi',
        createdAt: nowSlash,
        updatedAt: nowSlash,
        updatedBy: 'Public RSVP Online',
      };
      store.guests.push(targetGuest);
    }

    const effectiveMessage =
      payload.message && payload.message.trim()
        ? payload.message.trim()
        : payload.rsvpStatus === 'Hadir'
        ? `Konfirmasi hadir (${submittedPax} Pax) pada sesi ${
            payload.sessionChoice || 'Pemberkatan & Resepsi'
          }.`
        : `Konfirmasi kehadiran: ${payload.rsvpStatus}.`;

    const modAnalysis = analyzeWishModeration(
      {
        guestName: cleanName,
        message: effectiveMessage,
        institution: payload.institution || targetGuest.institution || '',
        originalUrlGuestParam: payload.originalUrlGuestParam,
        matchedGuestRecordName:
          payload.matchedGuestRecordName ||
          (matchIdx >= 0 ? targetGuest.guestName : undefined),
      },
      store.settings.moderationBlockedKeywords
    );

    const createdWish: GuestWish = {
      id: `wish_${Date.now().toString(36)}`,
      guestId: targetGuest.id,
      invitationCode: targetGuest.invitationCode,
      guestName: cleanName,
      institution: payload.institution || targetGuest.institution || '',
      relation: payload.relation || targetGuest.guestType || 'Tamu Kehormatan',
      phone: payload.phone || targetGuest.phone || '',
      rsvpStatus: payload.rsvpStatus,
      pax: payload.rsvpStatus === 'Hadir' ? submittedPax : 0,
      message: effectiveMessage,
      createdAt: new Date().toISOString(),
      isPinned: false,
      moderationStatus: modAnalysis.isNegative ? 'FLAGGED' : 'APPROVED',
      flaggedReason: modAnalysis.flaggedReason || undefined,
      originalUrlGuestParam: payload.originalUrlGuestParam,
      originalUrlCodeParam: payload.originalUrlCodeParam,
      matchedGuestRecordName:
        payload.matchedGuestRecordName ||
        (matchIdx >= 0 ? targetGuest.guestName : undefined),
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      devicePlatform: payload.devicePlatform,
      clientId: 'client-utama',
    };
    store.wishes.unshift(createdWish);

    persistStore(store);
    return { guest: targetGuest, wish: createdWish };
  },

  getWishes: (): GuestWish[] => {
    return getStore().wishes;
  },

  togglePinWish: (id: string): GuestWish | null => {
    const store = getStore();
    const target = store.wishes.find((w) => w.id === id);
    if (!target) return null;
    target.isPinned = !target.isPinned;
    persistStore(store);
    return target;
  },

  replyToWish: (id: string, replyFromCouple: string): GuestWish | null => {
    const store = getStore();
    const target = store.wishes.find((w) => w.id === id);
    if (!target) return null;
    target.replyFromCouple = replyFromCouple.trim();
    persistStore(store);
    return target;
  },

  moderateWish: (
    id: string,
    moderationStatus: 'APPROVED' | 'FLAGGED' | 'HIDDEN',
    flaggedReason?: string
  ): GuestWish | null => {
    const store = getStore();
    const target = store.wishes.find((w) => w.id === id);
    if (!target) return null;
    target.moderationStatus = moderationStatus;
    if (flaggedReason !== undefined) {
      target.flaggedReason = flaggedReason;
    }
    persistStore(store);
    return target;
  },

  deleteWish: (id: string): boolean => {
    const store = getStore();
    const target = store.wishes.find((w) => w.id === id);
    const before = store.wishes.length;
    store.wishes = store.wishes.filter((w) => w.id !== id);

    const syntheticGuestId = id.startsWith('rsvp_guest_')
      ? id.replace(/^rsvp_guest_/, '')
      : undefined;

    const matchedGuestIdx = store.guests.findIndex((g) => {
      if (syntheticGuestId && g.id === syntheticGuestId) return true;
      if (!target) return false;
      return (
        (target.guestId && g.id === target.guestId) ||
        (target.invitationCode &&
          g.invitationCode &&
          g.invitationCode.toLowerCase() === target.invitationCode.toLowerCase()) ||
        g.guestName.trim().toLowerCase() === target.guestName.trim().toLowerCase()
      );
    });

    let guestChanged = false;
    if (matchedGuestIdx >= 0) {
      const g = store.guests[matchedGuestIdx];
      if (g.id.startsWith('guest_rsvp_')) {
        store.guests.splice(matchedGuestIdx, 1);
        guestChanged = true;
      } else {
        store.guests[matchedGuestIdx] = {
          ...g,
          rsvpStatus: 'Belum Konfirmasi',
          attendanceStatus: 'Belum Dicek',
          wishes: '',
        };
        guestChanged = true;
      }
    }

    if (store.wishes.length !== before || guestChanged) {
      persistStore(store);
      return true;
    }
    return false;
  },

  getBudgetItems: (): BudgetVendorItem[] => {
    return getStore().budgetItems;
  },

  upsertBudgetItem: (
    input: Partial<BudgetVendorItem> & { itemName: string }
  ): BudgetVendorItem => {
    const store = getStore();
    const existingIdx = input.id
      ? store.budgetItems.findIndex((b) => b.id === input.id)
      : -1;

    const estimated = Number(input.estimatedCost) || 0;
    const actual = Number(input.actualCost) || 0;
    const paid = Number(input.paidAmount) || 0;
    const effectiveTotal = actual > 0 ? actual : estimated;
    const autoPaymentStatus =
      input.paymentStatus ||
      (paid <= 0
        ? 'BELUM_DP'
        : paid >= effectiveTotal && effectiveTotal > 0
        ? 'LUNAS'
        : 'DP_TERBAYAR');

    if (existingIdx >= 0) {
      const prev = store.budgetItems[existingIdx];
      const costChanged =
        prev.estimatedCost !== estimated || prev.actualCost !== actual;
      const updated: BudgetVendorItem = {
        ...prev,
        ...input,
        estimatedCost: estimated,
        actualCost: actual,
        paidAmount: paid,
        paymentStatus: autoPaymentStatus,
        revisionCount:
          (prev.revisionCount || 0) + (costChanged || input.revisionNote ? 1 : 0),
        revisionNote: input.revisionNote ?? prev.revisionNote ?? '',
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      store.budgetItems[existingIdx] = updated;
      persistStore(store);
      return updated;
    }

    const newItem: BudgetVendorItem = {
      id: input.id || `bgt_${Date.now().toString(36)}`,
      category: input.category || 'Administrasi & Lainnya',
      itemName: input.itemName.trim(),
      vendorName: input.vendorName || '',
      vendorContact: input.vendorContact || '',
      pic: input.pic || 'Bersama',
      estimatedCost: estimated,
      actualCost: actual,
      paidAmount: paid,
      paymentStatus: autoPaymentStatus,
      dueDate: input.dueDate || '2026-12-01',
      notes: input.notes || '',
      revisionNote: input.revisionNote || '',
      revisionCount: 0,
      updatedAt: new Date().toISOString().slice(0, 10),
    };

    store.budgetItems.push(newItem);
    persistStore(store);
    return newItem;
  },

  deleteBudgetItem: (id: string): boolean => {
    const store = getStore();
    const before = store.budgetItems.length;
    store.budgetItems = store.budgetItems.filter((b) => b.id !== id);
    if (store.budgetItems.length !== before) {
      persistStore(store);
      return true;
    }
    return false;
  },

  importFullBackup: (payload: Partial<WeddingDatabaseSchema>): WeddingDatabaseSchema => {
    const store = getStore();
    if (payload.settings) {
      store.settings = { ...store.settings, ...payload.settings };
    }
    if (Array.isArray(payload.tasks)) {
      store.tasks = payload.tasks.map((t) => ({
        ...t,
        timelinePhase: t.timelinePhase || inferTimelinePhase(t.due, t.category),
        status: t.done ? 'SELESAI' : t.status || 'BELUM',
      }));
    }
    if (Array.isArray(payload.guests)) {
      store.guests = payload.guests;
    }
    if (Array.isArray(payload.wishes)) {
      store.wishes = payload.wishes;
    }
    if (Array.isArray(payload.budgetItems)) {
      store.budgetItems = payload.budgetItems;
    }
    persistStore(store);
    return sanitizeStoreForClient(store);
  },

  resetToDefault: (): WeddingDatabaseSchema => {
    const fresh = createDefaultStore();
    persistStore(fresh);
    return sanitizeStoreForClient(fresh);
  },
};
