import fs from 'fs';
import path from 'path';
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
  loadStateFromSupabase,
  saveStateToSupabase,
} from '@/lib/supabaseCloud';
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
      passwordHash: u.passwordHash,
    })),
  };
}

function formatDateSlash(date: Date = new Date()): string {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

export const serverStore = {
  reconcileWithSupabase: async (): Promise<WeddingDatabaseSchema> => {
    const localStore = getStore();
    try {
      const { state: cloudState, tableExists } = await loadStateFromSupabase();
      if (cloudState) {
        persistStore(cloudState, false, false);
        return cloudState;
      } else if (tableExists) {
        await saveStateToSupabase(localStore);
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
    jabatan?: string;
    clientId?: string;
    clientName?: string;
    passwordHash?: string;
  }): AdminUser => {
    const store = getStore();
    const cleanUsername = input.username.trim().toLowerCase();
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
      email: `${cleanUsername}@wedding.local`,
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
    const before = store.wishes.length;
    store.wishes = store.wishes.filter((w) => w.id !== id);
    if (store.wishes.length !== before) {
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
