'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicInvitationView } from '@/components/PublicInvitationView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { AdminLoginModal } from '@/components/AdminLoginModal';
import {
  WeddingDatabaseSchema,
  WeddingTask,
  WeddingGuest,
  BudgetVendorItem,
  WeddingSettings,
  AdminUser,
  RsvpStatus,
  GuestWish,
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
  getInitialClientState,
  loadClientStateFromIndexedDB,
  saveClientState,
  getStoredAdminUser,
  saveStoredAdminUser,
  getStoredViewMode,
  saveStoredViewMode,
} from '@/lib/clientSync';
import {
  loadStateFromSupabase,
  saveStateToSupabase,
  appendAuditLog,
} from '@/lib/supabaseCloud';

function mergePreservingLocalMedia(
  serverState: WeddingDatabaseSchema,
  localState: WeddingDatabaseSchema
): WeddingDatabaseSchema {
  const localOriginalPhotos = localState.settings?.originalPhotos;

  return {
    ...serverState,
    settings: {
      ...serverState.settings,
      ...(localOriginalPhotos
        ? {
            originalPhotos: {
              ...localOriginalPhotos,
              ...(serverState.settings?.originalPhotos || {}),
            },
          }
        : {}),
    },
  };
}

function stripLargeAudioForServerPayload(payload: unknown): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  try {
    const rawJson = JSON.stringify(payload);
    // Vercel serverless body limit is 4.5MB; if under 3.6MB, send as-is
    if (rawJson.length < 3_600_000) return payload;

    const clone = JSON.parse(rawJson) as Record<string, unknown>;
    if (Array.isArray(clone.musicPlaylist)) {
      clone.musicPlaylist = (clone.musicPlaylist as Array<Record<string, unknown>>).map(
        (m) =>
          typeof m.url === 'string' && m.url.startsWith('data:audio/')
            ? { ...m, url: 'synth:canon-in-d' }
            : m
      );
    }
    if (clone.settings && typeof clone.settings === 'object') {
      const s = clone.settings as Record<string, unknown>;
      if (Array.isArray(s.musicPlaylist)) {
        s.musicPlaylist = (s.musicPlaylist as Array<Record<string, unknown>>).map((m) =>
          typeof m.url === 'string' && m.url.startsWith('data:audio/')
            ? { ...m, url: 'synth:canon-in-d' }
            : m
        );
      }
    }
    return clone;
  } catch {
    return payload;
  }
}

function WeddingAppContent() {
  const searchParams = useSearchParams();
  const urlGuestTo = searchParams.get('to') || '';
  const urlGuestCode = searchParams.get('code') || '';
  const urlMode = searchParams.get('mode') || '';

  const [state, setState] = useState<WeddingDatabaseSchema>(() =>
    getInitialClientState()
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() =>
    getStoredAdminUser()
  );
  const [viewMode, setViewMode] = useState<'PUBLIC' | 'ADMIN'>(() => {
    const storedMode = getStoredViewMode();
    const storedUser = getStoredAdminUser();
    if (storedUser && storedMode === 'ADMIN') return 'ADMIN';
    return 'PUBLIC';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [previewOverrideGuest, setPreviewOverrideGuest] = useState<WeddingGuest | null>(
    null
  );

  const changeViewMode = useCallback((mode: 'PUBLIC' | 'ADMIN') => {
    setViewMode(mode);
    saveStoredViewMode(mode);
  }, []);

  // Verify server-side HttpOnly Admin Session & reconcile IndexedDB + Supabase Cloud + Server state on mount
  useEffect(() => {
    let isMounted = true;

    fetch('/api/auth', { cache: 'no-store' })
      .then(async (res) => {
        if (!isMounted) return;
        if (!res.ok) {
          const cachedUser = getStoredAdminUser();
          if (!cachedUser) {
            setAdminUser(null);
            if (urlMode === 'admin') {
              setIsLoginModalOpen(true);
            }
          }
          return;
        }
        const authData = await res.json();
        if (authData.authenticated && authData.user) {
          setAdminUser(authData.user);
          saveStoredAdminUser(authData.user);
          if (urlMode === 'admin' || getStoredViewMode() === 'ADMIN') {
            changeViewMode('ADMIN');
          }
        } else if (urlMode === 'admin') {
          setIsLoginModalOpen(true);
        }
      })
      .catch(() => {
        if (urlMode === 'admin' && !getStoredAdminUser()) {
          setIsLoginModalOpen(true);
        }
      });

    (async () => {
      // 1. Load local cache for instant initial render before Supabase responds
      const lsState = getInitialClientState();
      const idbState = await loadClientStateFromIndexedDB();

      const lsTime = new Date(lsState.lastSyncedAt || 0).getTime() || 0;
      const idbTime = new Date(idbState?.lastSyncedAt || 0).getTime() || 0;
      const bestLocal = idbState && idbTime >= lsTime ? idbState : lsState;
      const localTime = Math.max(lsTime, idbTime);

      if (isMounted && bestLocal) {
        setState(bestLocal);
      }

      // 2. Fetch from Supabase Cloud (Primary 100% Main Database)
      const cloudResult = await loadStateFromSupabase();
      if (!isMounted) return;

      const cloudState = cloudResult.state;

      if (cloudState) {
        // Supabase Cloud is 100% the single source of truth
        const merged = mergePreservingLocalMedia(cloudState, bestLocal);
        setState(merged);
        saveClientState(merged, false);
      } else if (cloudResult.tableExists) {
        // Table exists in Supabase but no 'main' row yet -> initialize Supabase with current clean state
        setState(bestLocal);
        saveClientState(bestLocal, false);
        void saveStateToSupabase(bestLocal);
      } else {
        // Offline / table not created yet fallback
        setState(bestLocal);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [urlMode, changeViewMode]);

  const mutateServer = useCallback(
    async (action: string, payload: unknown): Promise<WeddingDatabaseSchema | null> => {
      try {
        const safePayload = stripLargeAudioForServerPayload(payload);
        const res = await fetch('/api/wedding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload: safePayload }),
        });

        if (res.status === 401 && action !== 'SUBMIT_RSVP') {
          return null;
        }

        const json = await res.json();
        if (json.success && json.data) {
          // Only update client state from server response for public SUBMIT_RSVP;
          // for all Admin actions, client state is already updated and synced directly to Supabase.
          if (action === 'SUBMIT_RSVP') {
            setState((prev) => {
              const merged = mergePreservingLocalMedia(
                json.data as WeddingDatabaseSchema,
                prev
              );
              saveClientState(merged, true);
              return merged;
            });
          }
          return json.data;
        }
      } catch {
        // Offline fallback: state is already saved in Supabase & IndexedDB
      }
      return null;
    },
    []
  );

  const handleOpenAdminPortal = () => {
    if (adminUser) {
      changeViewMode('ADMIN');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    saveStoredAdminUser(user);
    setIsLoginModalOpen(false);
    changeViewMode('ADMIN');
    appendAuditLog({
      actor: user.username,
      module: 'KEAMANAN',
      action: 'SIMPAN',
      status: 'SUCCESS',
      summary: `Login sesi Admin berhasil (${user.nama})`,
    });
  };

  const handleSyncStateAndUser = (
    nextState?: WeddingDatabaseSchema,
    nextUser?: AdminUser
  ) => {
    if (nextState) {
      setState((prev) => {
        const merged: WeddingDatabaseSchema = {
          ...prev,
          adminUsers:
            Array.isArray(nextState.adminUsers) && nextState.adminUsers.length > 0
              ? nextState.adminUsers
              : prev.adminUsers,
        };
        return saveClientState(merged, true);
      });
    }
    if (nextUser) {
      setAdminUser(nextUser);
      saveStoredAdminUser(nextUser);
    }
  };

  const handleLogoutAdmin = async () => {
    const actorName = adminUser?.username || 'admin';
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGOUT' }),
      });
    } catch {
      // Proceed with local cleanup
    }
    appendAuditLog({
      actor: actorName,
      module: 'KEAMANAN',
      action: 'SIMPAN',
      status: 'SUCCESS',
      summary: `Logout dari sesi Admin (${actorName})`,
    });
    setAdminUser(null);
    saveStoredAdminUser(null);
    changeViewMode('PUBLIC');
  };

  const handleSwitchToPublicPreview = (guest?: WeddingGuest) => {
    if (guest) {
      setPreviewOverrideGuest(guest);
    }
    changeViewMode('PUBLIC');
  };

  // Optimistic Local-First + Direct Supabase Cloud CRUD Handlers
  const handleUpsertTask = async (task: Partial<WeddingTask> & { title: string }) => {
    const isEdit = Boolean(task.id && state.tasks.some((t) => t.id === task.id));
    setState((prev) => {
      const exists = task.id && prev.tasks.some((t) => t.id === task.id);
      const nextTasks = exists
        ? prev.tasks.map((t) =>
            t.id === task.id
              ? ({
                  ...t,
                  ...task,
                  done:
                    typeof task.done === 'boolean'
                      ? task.done
                      : task.status === 'SELESAI',
                  status: task.status || (task.done ? 'SELESAI' : t.status),
                } as WeddingTask)
              : t
          )
        : [
            ...prev.tasks,
            {
              id: task.id || `tsk_${Date.now().toString(36)}`,
              category: task.category || 'Acara',
              timelinePhase: task.timelinePhase || 'H-60 s/d H-30',
              title: task.title,
              due: task.due || '2026-11-01',
              priority: task.priority || 'Sedang',
              owner: task.owner || 'Bersama',
              status: task.status || 'BELUM',
              notes: task.notes || '',
              done: Boolean(task.done),
              doneAt: task.doneAt || '',
              createdAt: new Date().toISOString().slice(0, 10),
              updatedAt: new Date().toISOString().slice(0, 10),
              updatedBy: adminUser?.username || 'admin',
            } as WeddingTask,
          ];
      return saveClientState({ ...prev, tasks: nextTasks }, true);
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'CHECKLIST',
      action: isEdit ? 'EDIT' : 'TAMBAH',
      status: 'SUCCESS',
      summary: `${isEdit ? 'Memperbarui' : 'Menambahkan'} tugas checklist: "${task.title}"`,
      detail: `Kategori: ${task.category || 'Acara'} • Status: ${task.status || 'BELUM'}`,
    });
    await mutateServer('UPSERT_TASK', task);
  };

  const handleDeleteTask = async (id: string) => {
    const target = state.tasks.find((t) => t.id === id);
    setState((prev) =>
      saveClientState(
        { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) },
        true
      )
    );
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'CHECKLIST',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus tugas checklist: "${target?.title || id}"`,
    });
    await mutateServer('DELETE_TASK', { id });
  };

  const handleUpsertGuest = async (
    guest: Partial<WeddingGuest> & { guestName: string }
  ) => {
    const isEdit = Boolean(guest.id && state.guests.some((g) => g.id === guest.id));
    setState((prev) => {
      const exists = guest.id && prev.guests.some((g) => g.id === guest.id);
      const nextGuests = exists
        ? prev.guests.map((g) =>
            g.id === guest.id ? ({ ...g, ...guest } as WeddingGuest) : g
          )
        : [
            ...prev.guests,
            {
              id: guest.id || `gst_${Date.now().toString(36)}`,
              invitationCode:
                guest.invitationCode ||
                `INV-${String(prev.guests.length + 1).padStart(4, '0')}`,
              guestName: guest.guestName,
              guestType: guest.guestType || 'Keluarga',
              side: guest.side || 'Pria',
              institution: guest.institution || '',
              invitationFormat: guest.invitationFormat || 'Cetak Tebal',
              priority: guest.priority || 'P2 - Utama',
              cardQty: Number(guest.cardQty) || 1,
              pax: Number(guest.pax) || 2,
              phone: guest.phone || '',
              address: guest.address || '',
              deliveryStatus: guest.deliveryStatus || 'Belum Dikirim',
              rsvpStatus: guest.rsvpStatus || 'Belum Konfirmasi',
              attendanceStatus: guest.attendanceStatus || 'Belum Hadir',
              notes: guest.notes || '',
              createdAt: new Date().toISOString().slice(0, 10),
              updatedAt: new Date().toISOString().slice(0, 10),
              updatedBy: adminUser?.username || 'admin',
            } as WeddingGuest,
          ];
      return saveClientState({ ...prev, guests: nextGuests }, true);
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'TAMU',
      action: isEdit ? 'EDIT' : 'TAMBAH',
      status: 'SUCCESS',
      summary: `${isEdit ? 'Memperbarui' : 'Menambahkan'} data tamu: "${guest.guestName}"`,
      detail: `Format: ${guest.invitationFormat || 'Cetak Tebal'} • RSVP: ${guest.rsvpStatus || 'Belum Konfirmasi'}`,
    });
    await mutateServer('UPSERT_GUEST', guest);
  };

  const handleDeleteGuest = async (id: string) => {
    const target = state.guests.find((g) => g.id === id);
    setState((prev) =>
      saveClientState(
        { ...prev, guests: prev.guests.filter((g) => g.id !== id) },
        true
      )
    );
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'TAMU',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus tamu undangan: "${target?.guestName || id}"`,
    });
    await mutateServer('DELETE_GUEST', { id });
  };

  const handleSubmitPublicRsvp = async (payload: {
    guestName: string;
    invitationCode?: string;
    institution?: string;
    relation?: string;
    phone?: string;
    rsvpStatus: RsvpStatus;
    pax: number;
    sessionChoice?: WeddingGuest['sessionChoice'];
    message?: string;
  }) => {
    const cleanName = payload.guestName.trim() || 'Tamu Kehormatan';
    const submittedPax = Math.max(0, Number(payload.pax) || 0);
    const nowIso = new Date().toISOString();
    const nowDate = nowIso.slice(0, 10);

    setState((prev) => {
      const nextGuests = [...prev.guests];
      let targetIdx = -1;
      if (payload.invitationCode) {
        targetIdx = nextGuests.findIndex(
          (g) =>
            g.invitationCode.toLowerCase() ===
            payload.invitationCode!.trim().toLowerCase()
        );
      }
      if (targetIdx < 0) {
        targetIdx = nextGuests.findIndex(
          (g) => g.guestName.toLowerCase() === cleanName.toLowerCase()
        );
      }

      let targetGuest: WeddingGuest;
      if (targetIdx >= 0) {
        const existing = nextGuests[targetIdx];
        targetGuest = {
          ...existing,
          rsvpStatus: payload.rsvpStatus,
          confirmedPax: payload.rsvpStatus === 'Hadir' ? submittedPax : 0,
          pax: submittedPax > 0 ? submittedPax : existing.pax,
          phone: payload.phone || existing.phone,
          institution: payload.institution || existing.institution,
          sessionChoice: payload.sessionChoice || existing.sessionChoice,
          wishes: payload.message || existing.wishes,
          updatedAt: nowDate,
          updatedBy: 'Public RSVP Online',
        };
        nextGuests[targetIdx] = targetGuest;
      } else {
        targetGuest = {
          id: `guest_rsvp_${Date.now().toString(36)}`,
          invitationCode:
            payload.invitationCode ||
            `INV-${String(nextGuests.length + 1).padStart(4, '0')}`,
          guestName: cleanName,
          guestType: 'Teman/Sahabat',
          side: 'Bersama',
          institution:
            payload.institution || payload.relation || 'Tamu Undangan Digital',
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
          createdAt: nowDate,
          updatedAt: nowDate,
          updatedBy: 'Public RSVP Online',
        };
        nextGuests.push(targetGuest);
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
        createdAt: nowIso,
        isPinned: false,
      };

      const nextState: WeddingDatabaseSchema = {
        ...prev,
        guests: nextGuests,
        wishes: [createdWish, ...prev.wishes],
      };
      return saveClientState(nextState, true);
    });

    appendAuditLog({
      actor: cleanName,
      module: 'DOA_RSVP',
      action: 'TAMBAH',
      status: 'SUCCESS',
      summary: `Konfirmasi RSVP & Doa masuk dari "${cleanName}" (${payload.rsvpStatus})`,
      detail: `Pax: ${submittedPax} • Pesan: ${(payload.message || '').slice(0, 120)}`,
    });

    await mutateServer('SUBMIT_RSVP', payload);
  };

  const handleTogglePinWish = async (id: string) => {
    const target = state.wishes.find((w) => w.id === id);
    setState((prev) =>
      saveClientState(
        {
          ...prev,
          wishes: prev.wishes.map((w) =>
            w.id === id ? { ...w, isPinned: !w.isPinned } : w
          ),
        },
        true
      )
    );
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DOA_RSVP',
      action: 'EDIT',
      status: 'SUCCESS',
      summary: `${target?.isPinned ? 'Melepas sematan' : 'Menyematkan'} ucapan doa dari "${target?.guestName || id}"`,
    });
    await mutateServer('TOGGLE_PIN_WISH', { id });
  };

  const handleReplyWish = async (id: string, replyFromCouple: string) => {
    const target = state.wishes.find((w) => w.id === id);
    setState((prev) =>
      saveClientState(
        {
          ...prev,
          wishes: prev.wishes.map((w) =>
            w.id === id ? { ...w, replyFromCouple } : w
          ),
        },
        true
      )
    );
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DOA_RSVP',
      action: 'EDIT',
      status: 'SUCCESS',
      summary: `Membalas ucapan doa dari "${target?.guestName || id}"`,
      detail: replyFromCouple.slice(0, 140),
    });
    await mutateServer('REPLY_WISH', { id, replyFromCouple });
  };

  const handleDeleteWish = async (id: string) => {
    const target = state.wishes.find((w) => w.id === id);
    setState((prev) =>
      saveClientState(
        { ...prev, wishes: prev.wishes.filter((w) => w.id !== id) },
        true
      )
    );
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DOA_RSVP',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus ucapan doa dari "${target?.guestName || id}"`,
    });
    await mutateServer('DELETE_WISH', { id });
  };

  const handleUpsertBudget = async (
    item: Partial<BudgetVendorItem> & { itemName: string }
  ) => {
    const isEdit = Boolean(
      item.id && state.budgetItems.some((b) => b.id === item.id)
    );
    setState((prev) => {
      const exists = item.id && prev.budgetItems.some((b) => b.id === item.id);
      const nextBudget = exists
        ? prev.budgetItems.map((b) =>
            b.id === item.id ? ({ ...b, ...item } as BudgetVendorItem) : b
          )
        : [
            ...prev.budgetItems,
            {
              id: item.id || `bgt_${Date.now().toString(36)}`,
              category: item.category || 'Administrasi & Lainnya',
              itemName: item.itemName,
              vendorName: item.vendorName || '',
              vendorContact: item.vendorContact || '',
              pic: item.pic || 'Bersama',
              estimatedCost: Number(item.estimatedCost) || 0,
              actualCost: Number(item.actualCost) || 0,
              paidAmount: Number(item.paidAmount) || 0,
              paymentStatus: item.paymentStatus || 'BELUM_DP',
              dueDate: item.dueDate || '2026-12-01',
              notes: item.notes || '',
              updatedAt: new Date().toISOString().slice(0, 10),
            } as BudgetVendorItem,
          ];
      return saveClientState({ ...prev, budgetItems: nextBudget }, true);
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'MONETER',
      action: isEdit ? 'EDIT' : 'TAMBAH',
      status: 'SUCCESS',
      summary: `${isEdit ? 'Memperbarui' : 'Menambahkan'} pos anggaran/vendor: "${item.itemName}"`,
      detail: `Kategori: ${item.category || '-'} • Status: ${item.paymentStatus || 'BELUM_DP'}`,
    });
    await mutateServer('UPSERT_BUDGET', item);
  };

  const handleDeleteBudget = async (id: string) => {
    const target = state.budgetItems.find((b) => b.id === id);
    setState((prev) =>
      saveClientState(
        { ...prev, budgetItems: prev.budgetItems.filter((b) => b.id !== id) },
        true
      )
    );
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'MONETER',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus pos anggaran/vendor: "${target?.itemName || id}"`,
    });
    await mutateServer('DELETE_BUDGET', { id });
  };

  const handleUpdateSettings = useCallback(
    async (partial: Partial<WeddingSettings>, silentAutoSave?: boolean) => {
      setState((prev) => {
        const nextSettings: WeddingSettings = {
          ...prev.settings,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        return saveClientState({ ...prev, settings: nextSettings }, true);
      });
      if (!silentAutoSave) {
        const changedKeys = Object.keys(partial).filter(
          (k) => k !== 'updatedAt' && k !== 'updatedBy'
        );
        appendAuditLog({
          actor: partial.updatedBy || adminUser?.username || 'admin',
          module: 'MEMPELAI',
          action: 'SIMPAN',
          status: 'SUCCESS',
          summary: 'Menyimpan perubahan pengaturan & konten undangan ke Supabase',
          detail: `Field: ${changedKeys.slice(0, 8).join(', ')}`,
        });
      }
      await mutateServer('UPDATE_SETTINGS', partial);
    },
    [mutateServer, adminUser]
  );

  const handleSyncGoogleSheets = async (): Promise<string> => {
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: state.settings.googleSheetId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        const saved = saveClientState(json.data, true);
        setState(saved);
        return json.message || 'Sinkronisasi berhasil!';
      }
      return json.error || 'Gagal melakukan sinkronisasi.';
    } catch {
      return 'Menggunakan database Supabase Cloud aktif.';
    }
  };

  const handleImportBackup = async (payload: Partial<WeddingDatabaseSchema>) => {
    setState((prev) => {
      const next: WeddingDatabaseSchema = {
        ...prev,
        ...(payload.settings
          ? { settings: { ...prev.settings, ...payload.settings } }
          : {}),
        ...(Array.isArray(payload.tasks) ? { tasks: payload.tasks } : {}),
        ...(Array.isArray(payload.guests) ? { guests: payload.guests } : {}),
        ...(Array.isArray(payload.wishes) ? { wishes: payload.wishes } : {}),
        ...(Array.isArray(payload.budgetItems)
          ? { budgetItems: payload.budgetItems }
          : {}),
      };
      return saveClientState(next, true);
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DATABASE',
      action: 'SIMPAN',
      status: 'SUCCESS',
      summary: 'Memulihkan (Import) data dari file Backup JSON ke Supabase',
    });
    await mutateServer('IMPORT_BACKUP', payload);
  };

  const handleResetDefault = async () => {
    setState((prev) => {
      const fresh: WeddingDatabaseSchema = {
        settings: { ...INITIAL_SETTINGS, updatedAt: new Date().toISOString() },
        tasks: [...INITIAL_TASKS],
        guests: [...INITIAL_GUESTS],
        wishes: [...INITIAL_WISHES],
        budgetItems: [...INITIAL_BUDGET_ITEMS],
        adminUsers: prev.adminUsers?.length ? prev.adminUsers : [...INITIAL_ADMIN_USERS],
        lastSyncedAt: new Date().toISOString(),
      };
      return saveClientState(fresh, true);
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DATABASE',
      action: 'HAPUS',
      status: 'WARNING',
      summary: 'Mereset seluruh database kembali ke pengaturan awal kosong',
    });
    await mutateServer('RESET_DEFAULT', {});
  };

  const effectiveGuestName = previewOverrideGuest?.guestName || urlGuestTo;
  const effectiveGuestCode = previewOverrideGuest?.invitationCode || urlGuestCode;

  return (
    <>
      {viewMode === 'ADMIN' && adminUser ? (
        <AdminDashboardView
          state={state}
          adminUser={adminUser}
          onSwitchToPublicPreview={handleSwitchToPublicPreview}
          onLogoutAdmin={handleLogoutAdmin}
          onUpsertTask={handleUpsertTask}
          onDeleteTask={handleDeleteTask}
          onUpsertGuest={handleUpsertGuest}
          onDeleteGuest={handleDeleteGuest}
          onTogglePinWish={handleTogglePinWish}
          onReplyWish={handleReplyWish}
          onDeleteWish={handleDeleteWish}
          onUpsertBudget={handleUpsertBudget}
          onDeleteBudget={handleDeleteBudget}
          onUpdateSettings={handleUpdateSettings}
          onSyncGoogleSheets={handleSyncGoogleSheets}
          onImportBackup={handleImportBackup}
          onResetDefault={handleResetDefault}
          onSyncStateAndUser={handleSyncStateAndUser}
        />
      ) : (
        <PublicInvitationView
          settings={state.settings}
          guests={state.guests}
          wishes={state.wishes}
          guestParamName={effectiveGuestName}
          guestParamCode={effectiveGuestCode}
          isAdminLoggedIn={Boolean(adminUser)}
          onOpenAdminPortal={handleOpenAdminPortal}
          onSubmitRsvp={handleSubmitPublicRsvp}
        />
      )}

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] text-[#8B6914] flex flex-col items-center justify-center gap-1 text-sm font-bold">
          <span>Memuat My Wedding Manager...</span>
          <span className="text-[11px] font-medium text-[#9A742B]">by omeko11</span>
        </div>
      }
    >
      <WeddingAppContent />
    </Suspense>
  );
}
