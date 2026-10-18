'use client';

import React, { useState, useEffect, useCallback, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicInvitationView } from '@/components/PublicInvitationView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { AdminLoginModal } from '@/components/AdminLoginModal';
import { CommercialLandingView } from '@/components/CommercialLandingView';
import {
  WeddingDatabaseSchema,
  WeddingTask,
  WeddingGuest,
  BudgetVendorItem,
  WeddingSettings,
  AdminUser,
  RsvpStatus,
  GuestWish,
  ClientGroupItem,
  ClientWorkspaceData,
  InvitationInteractionType,
  CommercialPaymentTransaction,
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
  analyzeWishModeration,
  appendInvitationAnalyticsEvent,
  weddingMusicPlayer,
} from '@/lib/clientSync';
import {
  loadStateFromSupabase,
  saveStateToSupabase,
  appendAuditLog,
  upsertCommercialPaymentToSupabase,
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

function buildEffectiveClientGroups(state: WeddingDatabaseSchema): ClientGroupItem[] {
  const baseGroup: ClientGroupItem = {
    id: 'client-utama',
    clientCode: 'UTAMA',
    clientName: `Client Utama • ${state.settings.groomNickname || 'Agung'} & ${
      state.settings.brideNickname || 'Selo'
    }`,
    coupleLabel: `${state.settings.groomNickname || 'Agung'} & ${
      state.settings.brideNickname || 'Selo'
    }`,
    packageTier: 'ROYAL_VIP',
    status: 'ACTIVE',
    eventDate: '2026-12-19',
    notes: 'Grup Klien Utama (Mempelai & Keluarga Inti)',
    createdAt: '2026-10-18T00:00:00.000Z',
  };
  const configured = Array.isArray(state.settings.clientGroups)
    ? state.settings.clientGroups
    : [];
  const map = new Map<string, ClientGroupItem>();
  map.set(baseGroup.id, baseGroup);
  for (const g of configured) {
    if (g && g.id) {
      map.set(g.id, g.id === 'client-utama' ? { ...baseGroup, ...g } : g);
    }
  }
  for (const u of state.adminUsers || []) {
    const cid = u.clientId || 'client-utama';
    if (!map.has(cid)) {
      map.set(cid, {
        id: cid,
        clientCode: cid.replace(/^client-/i, '').toUpperCase(),
        clientName: u.clientName || `Client ${cid}`,
        coupleLabel: u.clientName || cid,
        packageTier: 'EXCLUSIVE',
        status: 'ACTIVE',
        createdAt: '2026-10-18T00:00:00.000Z',
      });
    }
  }
  return Array.from(map.values());
}

function resolveClientIdFromParam(
  rawParam: string,
  groups: ClientGroupItem[]
): string {
  const clean = rawParam.trim().toLowerCase();
  if (
    !clean ||
    clean === 'utama' ||
    clean === 'client-utama' ||
    clean === 'agung_selo' ||
    clean === 'eko_selo'
  ) {
    return 'client-utama';
  }
  const exactMatch = groups.find(
    (g) =>
      g.id.toLowerCase() === clean ||
      g.clientCode.toLowerCase() === clean ||
      g.id.toLowerCase() === `client-${clean}`
  );
  if (exactMatch) return exactMatch.id;
  return clean.startsWith('client-') ? clean : `client-${clean}`;
}

function getOrCreateWorkspaceForClient(
  rootState: WeddingDatabaseSchema,
  clientId: string,
  groups: ClientGroupItem[]
): ClientWorkspaceData {
  const existing = rootState.settings.clientWorkspaces?.[clientId];
  if (existing) {
    return existing;
  }
  const grp = groups.find((g) => g.id === clientId);
  const coupleLabel = grp?.coupleLabel || clientId.replace(/^client-/i, '');
  const parts = coupleLabel.split('&').map((p) => p.trim());
  const groomPart = parts[0] || 'Mempelai Pria';
  const bridePart = parts[1] || 'Mempelai Wanita';
  const rawCode = (grp?.clientCode || clientId.replace(/^client-/i, '')).toLowerCase();

  const baseSettings: WeddingSettings = {
    ...INITIAL_SETTINGS,
    siteTitle: 'My Wedding Manager',
    activeClientId: clientId,
    groomFullName: groomPart,
    groomNickname: groomPart.split(' ')[0] || groomPart,
    groomRankAndTitle: 'Putra Pertama',
    groomUnit: '',
    groomParents: `Keluarga Besar Bapak & Ibu (${groomPart})`,
    brideFullName: bridePart,
    brideNickname: bridePart.split(' ')[0] || bridePart,
    brideTitle: 'Putri Pertama',
    brideParents: `Keluarga Besar Bapak & Ibu (${bridePart})`,
    subtitle: `Pernikahan ${groomPart} & ${bridePart} • ${
      grp?.eventDate || '2026-12-19'
    }`,
    updatedAt: new Date().toISOString(),
    updatedBy: 'system',
  };

  return {
    clientId,
    settings: baseSettings,
    tasks: INITIAL_TASKS.map((t, idx) => ({
      ...t,
      id: `tsk_${rawCode}_${idx + 1}`,
      done: false,
      status: 'BELUM',
      doneAt: '',
    })),
    guests: [],
    wishes: [],
    budgetItems: [],
    updatedAt: new Date().toISOString(),
  };
}

function projectStateForClient(
  rootState: WeddingDatabaseSchema,
  clientId: string,
  groups: ClientGroupItem[]
): WeddingDatabaseSchema {
  if (!clientId || clientId === 'client-utama') {
    return {
      ...rootState,
      settings: {
        ...rootState.settings,
        activeClientId: 'client-utama',
      },
    };
  }
  const ws = getOrCreateWorkspaceForClient(rootState, clientId, groups);
  return {
    ...rootState,
    settings: {
      ...ws.settings,
      activeClientId: clientId,
      clientGroups: rootState.settings.clientGroups,
      clientWorkspaces: rootState.settings.clientWorkspaces,
      storageQuotaLimitMb: rootState.settings.storageQuotaLimitMb,
      developerCreditUrl:
        ws.settings.developerCreditUrl || rootState.settings.developerCreditUrl,
      contactWhatsappNumber:
        ws.settings.contactWhatsappNumber ||
        rootState.settings.contactWhatsappNumber,
      commercialPaymentChannels:
        rootState.settings.commercialPaymentChannels ||
        ws.settings.commercialPaymentChannels,
      commercialPayments:
        rootState.settings.commercialPayments ||
        ws.settings.commercialPayments,
      commercialGatewayConfig:
        rootState.settings.commercialGatewayConfig ||
        ws.settings.commercialGatewayConfig,
    },
    tasks: ws.tasks || [],
    guests: ws.guests || [],
    wishes: ws.wishes || [],
    budgetItems: ws.budgetItems || [],
  };
}

function WeddingAppContent() {
  const searchParams = useSearchParams();
  const urlClientParam = searchParams.get('client') || '';
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

  const clientGroups = useMemo(() => buildEffectiveClientGroups(state), [state]);

  // Active workspace in Admin Dashboard (locked to user's clientId for non-utama clients)
  const [selectedAdminWorkspaceId, setSelectedAdminWorkspaceId] =
    useState<string>(() => {
      const storedUser = getStoredAdminUser();
      return storedUser?.clientId || 'client-utama';
    });

  const activeWorkspaceClientId = useMemo(() => {
    if (
      adminUser?.clientId &&
      adminUser.clientId !== 'client-utama'
    ) {
      return adminUser.clientId;
    }
    return selectedAdminWorkspaceId || 'client-utama';
  }, [adminUser, selectedAdminWorkspaceId]);

  // Public view routing: null = show Commercial Landing Page (/); string = show PublicInvitationView for that clientId
  const [publicSelectedClientId, setPublicSelectedClientId] = useState<
    string | null
  >(() => {
    if (urlClientParam || urlGuestTo || urlGuestCode) {
      return urlClientParam
        ? resolveClientIdFromParam(urlClientParam, [])
        : 'client-utama';
    }
    return null;
  });

  const [manualGuestLookup, setManualGuestLookup] = useState<{
    to?: string;
    code?: string;
  }>({});

  useEffect(() => {
    if (urlClientParam || urlGuestTo || urlGuestCode) {
      const resolved = urlClientParam
        ? resolveClientIdFromParam(urlClientParam, clientGroups)
        : 'client-utama';
      setPublicSelectedClientId(resolved);
    }
  }, [urlClientParam, urlGuestTo, urlGuestCode, clientGroups]);

  const changeViewMode = useCallback((mode: 'PUBLIC' | 'ADMIN') => {
    setViewMode(mode);
    saveStoredViewMode(mode);
  }, []);

  useEffect(() => {
    if (viewMode === 'ADMIN' || publicSelectedClientId === null) {
      weddingMusicPlayer.stop();
    }
  }, [viewMode, publicSelectedClientId]);

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
          if (authData.user.clientId) {
            setSelectedAdminWorkspaceId(authData.user.clientId);
          }
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

      if (isMounted && bestLocal) {
        setState(bestLocal);
      }

      // 2. Fetch from Supabase Cloud (Primary 100% Main Database)
      const cloudResult = await loadStateFromSupabase();
      if (!isMounted) return;

      const cloudState = cloudResult.state;

      if (cloudState) {
        const merged = mergePreservingLocalMedia(cloudState, bestLocal);
        setState(merged);
        saveClientState(merged, false);
      } else if (cloudResult.tableExists) {
        setState(bestLocal);
        saveClientState(bestLocal, false);
        void saveStateToSupabase(bestLocal);
      } else {
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
          return json.data;
        }
      } catch {
        // Offline fallback: state is already saved in Supabase & IndexedDB
      }
      return null;
    },
    []
  );

  // Helper to apply state updates to the active client workspace (either 'client-utama' or secondary workspace)
  const updateClientScopedState = useCallback(
    (
      targetClientId: string,
      updater: (scoped: WeddingDatabaseSchema) => WeddingDatabaseSchema
    ) => {
      setState((prevRoot) => {
        const groups = buildEffectiveClientGroups(prevRoot);
        if (!targetClientId || targetClientId === 'client-utama') {
          const updatedRoot = updater(prevRoot);
          return saveClientState(updatedRoot, true);
        }

        const projected = projectStateForClient(
          prevRoot,
          targetClientId,
          groups
        );
        const updatedProjected = updater(projected);

        const nextWorkspace: ClientWorkspaceData = {
          clientId: targetClientId,
          settings: {
            ...updatedProjected.settings,
            activeClientId: targetClientId,
          },
          tasks: updatedProjected.tasks,
          guests: updatedProjected.guests,
          wishes: updatedProjected.wishes,
          budgetItems: updatedProjected.budgetItems,
          updatedAt: new Date().toISOString(),
        };
        // Avoid nested recursive clientWorkspaces inside a secondary workspace's settings
        delete nextWorkspace.settings.clientWorkspaces;

        const nextRoot: WeddingDatabaseSchema = {
          ...prevRoot,
          adminUsers: updatedProjected.adminUsers || prevRoot.adminUsers,
          settings: {
            ...prevRoot.settings,
            clientGroups:
              updatedProjected.settings.clientGroups ||
              prevRoot.settings.clientGroups,
            developerCreditUrl:
              updatedProjected.settings.developerCreditUrl ??
              prevRoot.settings.developerCreditUrl,
            contactWhatsappNumber:
              updatedProjected.settings.contactWhatsappNumber ??
              prevRoot.settings.contactWhatsappNumber,
            commercialPaymentChannels:
              updatedProjected.settings.commercialPaymentChannels ||
              prevRoot.settings.commercialPaymentChannels,
            commercialPayments:
              updatedProjected.settings.commercialPayments ||
              prevRoot.settings.commercialPayments,
            commercialGatewayConfig:
              updatedProjected.settings.commercialGatewayConfig ||
              prevRoot.settings.commercialGatewayConfig,
            clientWorkspaces: {
              ...(prevRoot.settings.clientWorkspaces || {}),
              ...(updatedProjected.settings.clientWorkspaces || {}),
              [targetClientId]: nextWorkspace,
            },
            updatedAt: new Date().toISOString(),
          },
        };
        return saveClientState(nextRoot, true);
      });
    },
    []
  );

  const handleOpenAdminPortal = () => {
    weddingMusicPlayer.stop();
    if (adminUser) {
      changeViewMode('ADMIN');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    saveStoredAdminUser(user);
    setSelectedAdminWorkspaceId(user.clientId || 'client-utama');
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
          settings: nextState.settings
            ? {
                ...prev.settings,
                clientGroups:
                  nextState.settings.clientGroups || prev.settings.clientGroups,
                clientWorkspaces:
                  nextState.settings.clientWorkspaces ||
                  prev.settings.clientWorkspaces,
              }
            : prev.settings,
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
    weddingMusicPlayer.stop();
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
    setPublicSelectedClientId(activeWorkspaceClientId);
    changeViewMode('PUBLIC');
  };

  const handleOpenLandingPage = () => {
    weddingMusicPlayer.stop();
    setPreviewOverrideGuest(null);
    setManualGuestLookup({});
    setPublicSelectedClientId(null);
    changeViewMode('PUBLIC');
    if (typeof window !== 'undefined') {
      window.history.pushState({}, '', '/');
    }
  };

  const handleSelectClientInvitationFromLanding = (
    clientId: string,
    guestTo?: string,
    guestCode?: string
  ) => {
    setPreviewOverrideGuest(null);
    setManualGuestLookup({ to: guestTo, code: guestCode });
    setPublicSelectedClientId(clientId);
    changeViewMode('PUBLIC');
    if (typeof window !== 'undefined') {
      const grp = clientGroups.find((g) => g.id === clientId);
      const slug =
        clientId === 'client-utama'
          ? 'agung_selo'
          : (grp?.clientCode || clientId.replace(/^client-/i, '')).toLowerCase();
      const params = new URLSearchParams();
      params.set('client', slug);
      if (guestTo) params.set('to', guestTo);
      if (guestCode) params.set('code', guestCode);
      window.history.pushState({}, '', `/?${params.toString()}`);
    }
  };

  // Projected state for the active Admin Workspace
  const activeAdminState = useMemo(
    () => projectStateForClient(state, activeWorkspaceClientId, clientGroups),
    [state, activeWorkspaceClientId, clientGroups]
  );

  // Projected state for the active Public Invitation
  const activePublicClientId = publicSelectedClientId || 'client-utama';
  const activePublicState = useMemo(
    () => projectStateForClient(state, activePublicClientId, clientGroups),
    [state, activePublicClientId, clientGroups]
  );

  // Optimistic Local-First + Direct Supabase Cloud CRUD Handlers (Workspace-Scoped)
  const handleUpsertTask = async (task: Partial<WeddingTask> & { title: string }) => {
    const isEdit = Boolean(
      task.id && activeAdminState.tasks.some((t) => t.id === task.id)
    );
    updateClientScopedState(activeWorkspaceClientId, (prev) => {
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
      return { ...prev, tasks: nextTasks };
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'CHECKLIST',
      action: isEdit ? 'EDIT' : 'TAMBAH',
      status: 'SUCCESS',
      summary: `${isEdit ? 'Memperbarui' : 'Menambahkan'} tugas checklist: "${task.title}"`,
      detail: `Kategori: ${task.category || 'Acara'} • Status: ${task.status || 'BELUM'}`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('UPSERT_TASK', task);
    }
  };

  const handleDeleteTask = async (id: string) => {
    const target = activeAdminState.tasks.find((t) => t.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'CHECKLIST',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus tugas checklist: "${target?.title || id}"`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('DELETE_TASK', { id });
    }
  };

  const handleUpsertGuest = async (
    guest: Partial<WeddingGuest> & { guestName: string }
  ) => {
    const isEdit = Boolean(
      guest.id && activeAdminState.guests.some((g) => g.id === guest.id)
    );
    updateClientScopedState(activeWorkspaceClientId, (prev) => {
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
      return { ...prev, guests: nextGuests };
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'TAMU',
      action: isEdit ? 'EDIT' : 'TAMBAH',
      status: 'SUCCESS',
      summary: `${isEdit ? 'Memperbarui' : 'Menambahkan'} data tamu: "${guest.guestName}"`,
      detail: `Format: ${guest.invitationFormat || 'Cetak Tebal'} • RSVP: ${guest.rsvpStatus || 'Belum Konfirmasi'}`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('UPSERT_GUEST', guest);
    }
  };

  const handleDeleteGuest = async (id: string) => {
    const target = activeAdminState.guests.find((g) => g.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      guests: prev.guests.filter((g) => g.id !== id),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'TAMU',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus tamu undangan: "${target?.guestName || id}"`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('DELETE_GUEST', { id });
    }
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
    originalUrlGuestParam?: string;
    originalUrlCodeParam?: string;
    matchedGuestRecordName?: string;
    userAgent?: string;
    devicePlatform?: string;
  }) => {
    const cleanName = payload.guestName.trim() || 'Tamu Kehormatan';
    const submittedPax = Math.max(0, Number(payload.pax) || 0);
    const nowIso = new Date().toISOString();
    const nowDate = nowIso.slice(0, 10);

    const modAnalysis = analyzeWishModeration(
      {
        guestName: cleanName,
        message: payload.message || '',
        institution: payload.institution || '',
        originalUrlGuestParam: payload.originalUrlGuestParam,
        matchedGuestRecordName: payload.matchedGuestRecordName,
      },
      activePublicState.settings.moderationBlockedKeywords
    );

    updateClientScopedState(activePublicClientId, (prev) => {
      const nextGuests = [...prev.guests];
      let targetIdx = -1;
      if (payload.invitationCode) {
        targetIdx = nextGuests.findIndex(
          (g) =>
            g.invitationCode.toLowerCase() ===
            payload.invitationCode!.trim().toLowerCase()
        );
      }
      if (targetIdx < 0 && payload.originalUrlCodeParam) {
        targetIdx = nextGuests.findIndex(
          (g) =>
            g.invitationCode.toLowerCase() ===
            payload.originalUrlCodeParam!.trim().toLowerCase()
        );
      }
      if (targetIdx < 0) {
        targetIdx = nextGuests.findIndex(
          (g) => g.guestName.toLowerCase() === cleanName.toLowerCase()
        );
      }
      if (targetIdx < 0 && payload.matchedGuestRecordName) {
        targetIdx = nextGuests.findIndex(
          (g) =>
            g.guestName.toLowerCase() ===
            payload.matchedGuestRecordName!.trim().toLowerCase()
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
        phone: payload.phone || targetGuest.phone || '',
        rsvpStatus: payload.rsvpStatus,
        pax: payload.rsvpStatus === 'Hadir' ? submittedPax : 0,
        message: effectiveMessage,
        createdAt: nowIso,
        isPinned: false,
        moderationStatus: modAnalysis.isNegative ? 'FLAGGED' : 'APPROVED',
        flaggedReason: modAnalysis.flaggedReason || undefined,
        originalUrlGuestParam: payload.originalUrlGuestParam,
        originalUrlCodeParam: payload.originalUrlCodeParam,
        matchedGuestRecordName:
          payload.matchedGuestRecordName ||
          (targetIdx >= 0 ? targetGuest.guestName : undefined),
        userAgent: payload.userAgent,
        devicePlatform: payload.devicePlatform,
        clientId: activePublicClientId,
      };

      return {
        ...prev,
        guests: nextGuests,
        wishes: [createdWish, ...prev.wishes],
      };
    });

    appendAuditLog({
      actor: cleanName,
      module: 'DOA_RSVP',
      action: 'TAMBAH',
      status: modAnalysis.isNegative || modAnalysis.isSpoofedIdentity ? 'WARNING' : 'SUCCESS',
      summary: modAnalysis.isNegative
        ? `🚨 KOMENTAR NEGATIF TERDETEKSI dari "${cleanName}" (${modAnalysis.flaggedReason})`
        : `Konfirmasi RSVP & Doa masuk dari "${cleanName}" (${payload.rsvpStatus})`,
      detail: `Link Asli: ${payload.originalUrlGuestParam || '-'} (${
        payload.originalUrlCodeParam || '-'
      }) • WA: ${payload.phone || '-'} • Device: ${
        payload.devicePlatform || '-'
      } • Pesan: ${(payload.message || '').slice(0, 120)}`,
    });

    if (activePublicClientId === 'client-utama') {
      await mutateServer('SUBMIT_RSVP', payload);
    }
  };

  const handleTogglePinWish = async (id: string) => {
    const target = activeAdminState.wishes.find((w) => w.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      wishes: prev.wishes.map((w) =>
        w.id === id ? { ...w, isPinned: !w.isPinned } : w
      ),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DOA_RSVP',
      action: 'EDIT',
      status: 'SUCCESS',
      summary: `${target?.isPinned ? 'Melepas sematan' : 'Menyematkan'} ucapan doa dari "${target?.guestName || id}"`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('TOGGLE_PIN_WISH', { id });
    }
  };

  const handleReplyWish = async (id: string, replyFromCouple: string) => {
    const target = activeAdminState.wishes.find((w) => w.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      wishes: prev.wishes.map((w) =>
        w.id === id ? { ...w, replyFromCouple } : w
      ),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DOA_RSVP',
      action: 'EDIT',
      status: 'SUCCESS',
      summary: `Membalas ucapan doa dari "${target?.guestName || id}"`,
      detail: replyFromCouple.slice(0, 140),
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('REPLY_WISH', { id, replyFromCouple });
    }
  };

  const handleModerateWish = async (
    id: string,
    moderationStatus: 'APPROVED' | 'FLAGGED' | 'HIDDEN',
    flaggedReason?: string
  ) => {
    const target = activeAdminState.wishes.find((w) => w.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      wishes: prev.wishes.map((w) =>
        w.id === id
          ? {
              ...w,
              moderationStatus,
              ...(flaggedReason !== undefined ? { flaggedReason } : {}),
            }
          : w
      ),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'superadmin',
      module: 'MODERASI_KOMENTAR',
      action: 'EDIT',
      status: moderationStatus === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      summary: `Moderasi komentar "${target?.guestName || id}" diubah menjadi ${moderationStatus}`,
      detail: `Isi: ${(target?.message || '').slice(0, 100)}`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('MODERATE_WISH', {
        id,
        moderationStatus,
        flaggedReason,
      });
    }
  };

  const handleDeleteWish = async (id: string) => {
    const target = activeAdminState.wishes.find((w) => w.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      wishes: prev.wishes.filter((w) => w.id !== id),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DOA_RSVP',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus ucapan doa dari "${target?.guestName || id}"`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('DELETE_WISH', { id });
    }
  };

  const handleUpsertBudget = async (
    item: Partial<BudgetVendorItem> & { itemName: string }
  ) => {
    const isEdit = Boolean(
      item.id && activeAdminState.budgetItems.some((b) => b.id === item.id)
    );
    updateClientScopedState(activeWorkspaceClientId, (prev) => {
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
      return { ...prev, budgetItems: nextBudget };
    });
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'MONETER',
      action: isEdit ? 'EDIT' : 'TAMBAH',
      status: 'SUCCESS',
      summary: `${isEdit ? 'Memperbarui' : 'Menambahkan'} pos anggaran/vendor: "${item.itemName}"`,
      detail: `Kategori: ${item.category || '-'} • Status: ${item.paymentStatus || 'BELUM_DP'}`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('UPSERT_BUDGET', item);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    const target = activeAdminState.budgetItems.find((b) => b.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      budgetItems: prev.budgetItems.filter((b) => b.id !== id),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'MONETER',
      action: 'HAPUS',
      status: 'SUCCESS',
      summary: `Menghapus pos anggaran/vendor: "${target?.itemName || id}"`,
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('DELETE_BUDGET', { id });
    }
  };

  const handleUpdateSettings = useCallback(
    async (partial: Partial<WeddingSettings>, silentAutoSave?: boolean) => {
      updateClientScopedState(activeWorkspaceClientId, (prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...partial,
          updatedAt: new Date().toISOString(),
        },
      }));
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
      if (activeWorkspaceClientId === 'client-utama') {
        await mutateServer('UPDATE_SETTINGS', partial);
      }
    },
    [mutateServer, adminUser, activeWorkspaceClientId, updateClientScopedState]
  );

  const handleSyncGoogleSheets = async (): Promise<string> => {
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: activeAdminState.settings.googleSheetId }),
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
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
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
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DATABASE',
      action: 'SIMPAN',
      status: 'SUCCESS',
      summary: 'Memulihkan (Import) data dari file Backup JSON ke Supabase',
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('IMPORT_BACKUP', payload);
    }
  };

  const handleResetDefault = async () => {
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      settings: { ...INITIAL_SETTINGS, updatedAt: new Date().toISOString() },
      tasks: [...INITIAL_TASKS],
      guests: [...INITIAL_GUESTS],
      wishes: [...INITIAL_WISHES],
      budgetItems: [...INITIAL_BUDGET_ITEMS],
      adminUsers: prev.adminUsers?.length ? prev.adminUsers : [...INITIAL_ADMIN_USERS],
      lastSyncedAt: new Date().toISOString(),
    }));
    appendAuditLog({
      actor: adminUser?.username || 'admin',
      module: 'DATABASE',
      action: 'HAPUS',
      status: 'WARNING',
      summary: 'Mereset seluruh database kembali ke pengaturan awal kosong',
    });
    if (activeWorkspaceClientId === 'client-utama') {
      await mutateServer('RESET_DEFAULT', {});
    }
  };

  const handleTrackPublicAnalytics = useCallback(
    (payload: {
      type: InvitationInteractionType;
      guestName?: string;
      invitationCode?: string;
      detail?: string;
      deviceInfo?: string;
    }) => {
      updateClientScopedState(activePublicClientId, (prev) => {
        const nextAnalytics = appendInvitationAnalyticsEvent(
          prev.settings,
          payload,
          prev.guests,
          prev.wishes
        );
        if (activePublicClientId === 'client-utama') {
          void mutateServer('UPDATE_SETTINGS', {
            invitationAnalytics: nextAnalytics,
          });
        }
        return {
          ...prev,
          settings: {
            ...prev.settings,
            invitationAnalytics: nextAnalytics,
          },
        };
      });
    },
    [activePublicClientId, updateClientScopedState, mutateServer]
  );

  const handleUpsertCommercialPayment = useCallback(
    async (
      incomingTx: CommercialPaymentTransaction
    ): Promise<{
      ok: boolean;
      transaction: CommercialPaymentTransaction;
      timedOut?: boolean;
      error?: string;
    }> => {
      const nowIso = new Date().toISOString();
      let mergedTx: CommercialPaymentTransaction = {
        ...incomingTx,
        updatedAt: nowIso,
      };
      let capturedNextState: WeddingDatabaseSchema | null = null;

      setState((prev) => {
        const currentList = Array.isArray(prev.settings.commercialPayments)
          ? prev.settings.commercialPayments
          : [];
        const existingIdx = currentList.findIndex(
          (item) =>
            item.idempotencyKey === incomingTx.idempotencyKey ||
            item.id === incomingTx.id
        );

        let nextList: CommercialPaymentTransaction[];
        if (existingIdx >= 0) {
          const existing = currentList[existingIdx];
          mergedTx = {
            ...existing,
            ...incomingTx,
            id: existing.id,
            orderId: existing.orderId,
            idempotencyKey: existing.idempotencyKey,
            createdAt: existing.createdAt,
            retryCount:
              incomingTx.retryCount > existing.retryCount
                ? incomingTx.retryCount
                : existing.retryCount,
            updatedAt: nowIso,
          };
          nextList = currentList.map((item, idx) =>
            idx === existingIdx ? mergedTx : item
          );
        } else {
          mergedTx = {
            ...incomingTx,
            createdAt: incomingTx.createdAt || nowIso,
            updatedAt: nowIso,
          };
          nextList = [mergedTx, ...currentList];
        }

        let nextClientGroups = Array.isArray(prev.settings.clientGroups)
          ? [...prev.settings.clientGroups]
          : [];

        if (
          (mergedTx.status === 'PAID_VERIFIED' ||
            mergedTx.status === 'PENDING_VERIFICATION') &&
          prev.settings.commercialGatewayConfig?.autoProvisionClientOnPaid !==
            false &&
          mergedTx.buyerCoupleName?.trim()
        ) {
          const existingGroup = nextClientGroups.find(
            (g) =>
              g.notes?.includes(mergedTx.idempotencyKey) ||
              (mergedTx.provisionedClientId &&
                g.id === mergedTx.provisionedClientId)
          );
          if (existingGroup) {
            mergedTx = {
              ...mergedTx,
              provisionedClientId: existingGroup.id,
            };
            nextList = nextList.map((item) =>
              item.idempotencyKey === mergedTx.idempotencyKey ||
              item.id === mergedTx.id
                ? mergedTx
                : item
            );
          } else if (mergedTx.status === 'PAID_VERIFIED') {
            const cleanCouple = mergedTx.buyerCoupleName.trim();
            const rawCode =
              cleanCouple
                .replace(/[^a-zA-Z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '')
                .toUpperCase()
                .slice(0, 18) ||
              `VIP_${Date.now().toString(36).slice(-4).toUpperCase()}`;
            const newGroup: ClientGroupItem = {
              id: `client-${Date.now().toString(36)}`,
              clientCode: rawCode,
              clientName: `Client • ${cleanCouple}`,
              coupleLabel: cleanCouple,
              packageTier:
                mergedTx.packageTier === 'ROYAL VIP'
                  ? 'ROYAL_VIP'
                  : mergedTx.packageTier,
              status: 'ACTIVE',
              notes: `Auto-provisioned dari Order ${mergedTx.orderId} (${mergedTx.idempotencyKey})`,
              createdAt: nowIso,
            };
            nextClientGroups = [...nextClientGroups, newGroup];
            mergedTx = {
              ...mergedTx,
              provisionedClientId: newGroup.id,
            };
            nextList = nextList.map((item) =>
              item.idempotencyKey === mergedTx.idempotencyKey ||
              item.id === mergedTx.id
                ? mergedTx
                : item
            );
          }
        }

        const nextState: WeddingDatabaseSchema = {
          ...prev,
          settings: {
            ...prev.settings,
            commercialPayments: nextList,
            clientGroups: nextClientGroups,
            updatedAt: nowIso,
          },
          lastSyncedAt: nowIso,
        };
        const saved = saveClientState(nextState, true);
        capturedNextState = saved;
        return saved;
      });

      try {
        const [paymentRes] = await Promise.all([
          upsertCommercialPaymentToSupabase(mergedTx, 10000),
          capturedNextState
            ? saveStateToSupabase(capturedNextState)
            : Promise.resolve(true),
          mutateServer('UPDATE_SETTINGS', {
            commercialPayments: capturedNextState
              ? (capturedNextState as WeddingDatabaseSchema).settings
                  .commercialPayments
              : [mergedTx],
            ...(capturedNextState
              ? {
                  clientGroups: (capturedNextState as WeddingDatabaseSchema)
                    .settings.clientGroups,
                }
              : {}),
          }),
        ]);

        if (paymentRes.timedOut) {
          const timeoutReason =
            paymentRes.error ||
            'Koneksi database timeout — silakan klik Coba Lagi (Idempotency Key menjaga agar tidak terjadi tagihan ganda).';
          const timeoutTx: CommercialPaymentTransaction = {
            ...mergedTx,
            status: 'FAILED_TIMEOUT',
            lastErrorOrTimeoutReason: timeoutReason,
            updatedAt: new Date().toISOString(),
          };
          setState((prev) => {
            const list = Array.isArray(prev.settings.commercialPayments)
              ? prev.settings.commercialPayments
              : [];
            const nextList = list.map((item) =>
              item.idempotencyKey === timeoutTx.idempotencyKey ||
              item.id === timeoutTx.id
                ? timeoutTx
                : item
            );
            return saveClientState(
              {
                ...prev,
                settings: {
                  ...prev.settings,
                  commercialPayments: nextList,
                },
              },
              true
            );
          });
          appendAuditLog({
            actor: mergedTx.buyerEmail || 'checkout-public',
            module: 'MONETER',
            action: 'ERROR',
            status: 'WARNING',
            summary: `Timeout pembayaran paket ${mergedTx.packageTier} (${mergedTx.orderId}) — Idempotency Key diamankan`,
            detail: `Idempotency: ${mergedTx.idempotencyKey} • Retry: ${mergedTx.retryCount} • Channel: ${mergedTx.channelProviderName}`,
          });
          return {
            ok: false,
            transaction: timeoutTx,
            timedOut: true,
            error: timeoutReason,
          };
        }
      } catch (err) {
        const timeoutReason =
          err instanceof Error
            ? err.message
            : 'Gagal terhubung ke server pembayaran (Idempotency Key tetap aman).';
        const timeoutTx: CommercialPaymentTransaction = {
          ...mergedTx,
          status: 'FAILED_TIMEOUT',
          lastErrorOrTimeoutReason: timeoutReason,
          updatedAt: new Date().toISOString(),
        };
        setState((prev) => {
          const list = Array.isArray(prev.settings.commercialPayments)
            ? prev.settings.commercialPayments
            : [];
          const nextList = list.map((item) =>
            item.idempotencyKey === timeoutTx.idempotencyKey ||
            item.id === timeoutTx.id
              ? timeoutTx
              : item
          );
          return saveClientState(
            {
              ...prev,
              settings: {
                ...prev.settings,
                commercialPayments: nextList,
              },
            },
            true
          );
        });
        return {
          ok: false,
          transaction: timeoutTx,
          timedOut: true,
          error: timeoutReason,
        };
      }

      appendAuditLog({
        actor: mergedTx.buyerEmail || adminUser?.username || 'checkout-public',
        module: 'MONETER',
        action: 'SIMPAN',
        status: 'SUCCESS',
        summary: `Transaksi paket ${mergedTx.packageTier} (${mergedTx.orderId}) — Status: ${mergedTx.status}`,
        detail: `Pembeli: ${mergedTx.buyerCoupleName} (${mergedTx.buyerEmail}) • Nominal: ${mergedTx.amountDisplay} • Metode: ${mergedTx.channelProviderName} • Ref: ${mergedTx.paymentReference || '-'} • Idempotency: ${mergedTx.idempotencyKey}`,
      });

      return { ok: true, transaction: mergedTx };
    },
    [mutateServer, adminUser]
  );

  const effectiveGuestName =
    previewOverrideGuest?.guestName || manualGuestLookup.to || urlGuestTo;
  const effectiveGuestCode =
    previewOverrideGuest?.invitationCode ||
    manualGuestLookup.code ||
    urlGuestCode;

  return (
    <>
      {viewMode === 'ADMIN' && adminUser ? (
        <AdminDashboardView
          state={activeAdminState}
          adminUser={adminUser}
          onSwitchToPublicPreview={handleSwitchToPublicPreview}
          onLogoutAdmin={handleLogoutAdmin}
          onUpsertTask={handleUpsertTask}
          onDeleteTask={handleDeleteTask}
          onUpsertGuest={handleUpsertGuest}
          onDeleteGuest={handleDeleteGuest}
          onTogglePinWish={handleTogglePinWish}
          onReplyWish={handleReplyWish}
          onModerateWish={handleModerateWish}
          onDeleteWish={handleDeleteWish}
          onUpsertBudget={handleUpsertBudget}
          onDeleteBudget={handleDeleteBudget}
          onUpdateSettings={handleUpdateSettings}
          onSyncGoogleSheets={handleSyncGoogleSheets}
          onImportBackup={handleImportBackup}
          onResetDefault={handleResetDefault}
          onSyncStateAndUser={handleSyncStateAndUser}
          activeWorkspaceClientId={activeWorkspaceClientId}
          onSwitchWorkspaceClient={setSelectedAdminWorkspaceId}
          onOpenLandingPage={handleOpenLandingPage}
        />
      ) : publicSelectedClientId === null ? (
        <CommercialLandingView
          primarySettings={state.settings}
          primaryGuests={state.guests}
          clientGroups={clientGroups}
          clientWorkspaces={state.settings.clientWorkspaces}
          isAdminLoggedIn={Boolean(adminUser)}
          adminUserName={adminUser?.nama}
          onOpenAdminPortal={handleOpenAdminPortal}
          onSelectClientInvitation={handleSelectClientInvitationFromLanding}
          onUpsertCommercialPayment={handleUpsertCommercialPayment}
        />
      ) : (
        <div className="relative">
          {/* Floating Button to return to MWM Commercial Catalog when viewing without personal guest params */}
          {!urlGuestTo && !urlGuestCode && (
            <button
              type="button"
              onClick={handleOpenLandingPage}
              className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-stone-900/90 hover:bg-stone-900 text-[#FAF3E3] border border-[#D4AF37]/50 text-[11px] font-extrabold shadow-lg backdrop-blur-md transition-all"
              title="Kembali ke Halaman Depan My Wedding Manager (MWM)"
            >
              <span>&larr; Katalog MWM</span>
            </button>
          )}
          <PublicInvitationView
            settings={activePublicState.settings}
            guests={activePublicState.guests}
            wishes={activePublicState.wishes}
            guestParamName={effectiveGuestName}
            guestParamCode={effectiveGuestCode}
            isAdminLoggedIn={Boolean(adminUser)}
            onOpenAdminPortal={handleOpenAdminPortal}
            onTrackAnalytics={handleTrackPublicAnalytics}
            onSubmitRsvp={handleSubmitPublicRsvp}
          />
        </div>
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
