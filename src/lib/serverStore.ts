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

function persistStore(store: WeddingDatabaseSchema, updateTimestamp = true): void {
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
}

function getStore(): WeddingDatabaseSchema {
  if (!globalThis.__weddingGlobalStore) {
    globalThis.__weddingGlobalStore = readDbFromDisk();
    persistStore(globalThis.__weddingGlobalStore, false);
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
      return false; // Cannot delete the 4 default users
    }
    store.adminUsers = store.adminUsers.filter((u) => u.id !== id);
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

    const createdWish: GuestWish = {
      id: `wish_${Date.now().toString(36)}`,
      guestId: targetGuest.id,
      invitationCode: targetGuest.invitationCode,
      guestName: cleanName,
      institution: payload.institution || targetGuest.institution || '',
      relation: payload.relation || targetGuest.guestType || 'Tamu Kehormatan',
      rsvpStatus: payload.rsvpStatus,
      pax: payload.rsvpStatus === 'Hadir' ? submittedPax : 0,
      message: effectiveMessage,
      createdAt: new Date().toISOString(),
      isPinned: false,
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
