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
} from '@/types';
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
} from '@/lib/supabaseCloud';

function mergePreservingLocalMedia(
  serverState: WeddingDatabaseSchema,
  localState: WeddingDatabaseSchema
): WeddingDatabaseSchema {
  const localPlaylist = localState.settings?.musicPlaylist || [];
  const serverPlaylist = serverState.settings?.musicPlaylist;

  const mergedPlaylist = Array.isArray(serverPlaylist)
    ? serverPlaylist.map((track) => {
        const localMatch = localPlaylist.find((lt) => lt.id === track.id);
        if (localMatch && localMatch.url.startsWith('data:audio/')) {
          return { ...track, url: localMatch.url };
        }
        return track;
      })
    : localPlaylist.length > 0
    ? localPlaylist
    : undefined;

  return {
    ...serverState,
    settings: {
      ...serverState.settings,
      ...(mergedPlaylist ? { musicPlaylist: mergedPlaylist } : {}),
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
      // 1. Load full state (including high-res photos & uploaded MP3s) from IndexedDB
      const lsState = getInitialClientState();
      const idbState = await loadClientStateFromIndexedDB();

      const lsTime = new Date(lsState.lastSyncedAt || 0).getTime() || 0;
      const idbTime = new Date(idbState?.lastSyncedAt || 0).getTime() || 0;
      const bestLocal = idbState && idbTime >= lsTime ? idbState : lsState;
      const bestLocalTime = Math.max(lsTime, idbTime);

      if (isMounted && bestLocalTime > 0) {
        setState(bestLocal);
      }

      // 2. Fetch both Supabase Cloud & Next.js Server state in parallel
      const [cloudResult, serverState] = await Promise.all([
        loadStateFromSupabase(),
        fetch('/api/wedding', { cache: 'no-store' })
          .then((r) => r.json())
          .then((j) => (j.success && j.data ? (j.data as WeddingDatabaseSchema) : null))
          .catch(() => null),
      ]);

      if (!isMounted) return;

      const cloudState = cloudResult.state;
      const cloudTime = new Date(cloudState?.lastSyncedAt || 0).getTime() || 0;
      const serverTime = new Date(serverState?.lastSyncedAt || 0).getTime() || 0;

      // Determine the newest state across Browser (IndexedDB), Supabase Cloud, and Next.js Server
      let winner: WeddingDatabaseSchema = bestLocal;
      let winnerTime = bestLocalTime;

      if (cloudState && cloudTime >= winnerTime) {
        winner = mergePreservingLocalMedia(cloudState, bestLocal);
        winnerTime = cloudTime;
      }
      if (serverState && serverTime > winnerTime) {
        winner = mergePreservingLocalMedia(serverState, bestLocal);
        winnerTime = serverTime;
      }

      setState(winner);
      saveClientState(winner, false);

      // If our winning state is newer than Supabase Cloud (and the table exists), push it to Supabase Cloud
      if (cloudResult.tableExists && (!cloudState || winnerTime > cloudTime)) {
        void saveStateToSupabase(winner);
      }

      // If our winning state is newer than Next.js Server, push it to Next.js Server
      if (!serverState || winnerTime > serverTime) {
        void fetch('/api/wedding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'IMPORT_BACKUP',
            payload: stripLargeAudioForServerPayload(winner),
          }),
        }).catch(() => {});
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
          // Even if server cookie expired, local state is already saved in IndexedDB & localStorage
          return null;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setState((prev) => {
            const merged = mergePreservingLocalMedia(
              json.data as WeddingDatabaseSchema,
              prev
            );
            saveClientState(merged, false);
            return merged;
          });
          return json.data;
        }
      } catch {
        // Offline fallback: local optimistic state is already saved in IndexedDB & localStorage
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
  };

  const handleSyncStateAndUser = (
    nextState?: WeddingDatabaseSchema,
    nextUser?: AdminUser
  ) => {
    if (nextState) {
      const saved = saveClientState(nextState, true);
      setState(saved);
    }
    if (nextUser) {
      setAdminUser(nextUser);
      saveStoredAdminUser(nextUser);
    }
  };

  const handleLogoutAdmin = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGOUT' }),
      });
    } catch {
      // Proceed with local cleanup
    }
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

  // Optimistic Local-First CRUD Handlers (saves to IndexedDB + localStorage immediately before network call)
  const handleUpsertTask = async (task: Partial<WeddingTask> & { title: string }) => {
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
    await mutateServer('UPSERT_TASK', task);
  };

  const handleDeleteTask = async (id: string) => {
    setState((prev) =>
      saveClientState(
        { ...prev, tasks: prev.tasks.filter((t) => t.id !== id) },
        true
      )
    );
    await mutateServer('DELETE_TASK', { id });
  };

  const handleUpsertGuest = async (
    guest: Partial<WeddingGuest> & { guestName: string }
  ) => {
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
    await mutateServer('UPSERT_GUEST', guest);
  };

  const handleDeleteGuest = async (id: string) => {
    setState((prev) =>
      saveClientState(
        { ...prev, guests: prev.guests.filter((g) => g.id !== id) },
        true
      )
    );
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
    const serverUpdated = await mutateServer('SUBMIT_RSVP', payload);
    if (serverUpdated) {
      saveClientState(serverUpdated, true);
    }
  };

  const handleTogglePinWish = async (id: string) => {
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
    await mutateServer('TOGGLE_PIN_WISH', { id });
  };

  const handleReplyWish = async (id: string, replyFromCouple: string) => {
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
    await mutateServer('REPLY_WISH', { id, replyFromCouple });
  };

  const handleDeleteWish = async (id: string) => {
    setState((prev) =>
      saveClientState(
        { ...prev, wishes: prev.wishes.filter((w) => w.id !== id) },
        true
      )
    );
    await mutateServer('DELETE_WISH', { id });
  };

  const handleUpsertBudget = async (
    item: Partial<BudgetVendorItem> & { itemName: string }
  ) => {
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
    await mutateServer('UPSERT_BUDGET', item);
  };

  const handleDeleteBudget = async (id: string) => {
    setState((prev) =>
      saveClientState(
        { ...prev, budgetItems: prev.budgetItems.filter((b) => b.id !== id) },
        true
      )
    );
    await mutateServer('DELETE_BUDGET', { id });
  };

  const handleUpdateSettings = useCallback(
    async (partial: Partial<WeddingSettings>) => {
      setState((prev) => {
        const nextSettings: WeddingSettings = {
          ...prev.settings,
          ...partial,
          updatedAt: new Date().toISOString(),
        };
        return saveClientState({ ...prev, settings: nextSettings }, true);
      });
      await mutateServer('UPDATE_SETTINGS', partial);
    },
    [mutateServer]
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
      return 'Menggunakan database lokal aktif.';
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
    await mutateServer('IMPORT_BACKUP', payload);
  };

  const handleResetDefault = async () => {
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
        <div className="min-h-screen bg-[#FAF8F5] text-[#8B6914] flex items-center justify-center text-sm font-bold">
          Memuat Undangan &amp; Wedding Readiness System...
        </div>
      }
    >
      <WeddingAppContent />
    </Suspense>
  );
}
