'use client';

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  Suspense,
} from 'react';
import { useSearchParams, usePathname } from 'next/navigation';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  KeyRound,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { PublicInvitationView } from '@/components/PublicInvitationView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { CommercialLandingView } from '@/components/CommercialLandingView';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
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
  markInitialCloudHydrationComplete,
  registerExplicitCloudDeletion,
  registerLocalItemTouch,
  mergeGuestsMultiDevice,
  getCloudSyncStatus,
} from '@/lib/supabaseCloud';
import {
  SHOWCASE_DUMMY_CLIENT_METAS,
  ShowcasePackageTier,
  getShowcaseDummyClientState,
  isShowcaseDummyClientId,
  resolveShowcaseDummyClientId,
} from '@/data/showcaseDummyClients';
import {
  computeGuestInvitationHash,
  resolveGuestByHashTokenAcrossWorkspaces,
} from '@/lib/guestTokenHash';

function mergePreservingLocalMedia(
  serverState: WeddingDatabaseSchema,
  localState: WeddingDatabaseSchema
): WeddingDatabaseSchema {
  const localOriginalPhotos = localState.settings?.originalPhotos;

  return {
    ...serverState,
    guests: Array.isArray(serverState.guests) ? serverState.guests : [],
    wishes: Array.isArray(serverState.wishes) ? serverState.wishes : [],
    tasks: Array.isArray(serverState.tasks) ? serverState.tasks : [],
    budgetItems: Array.isArray(serverState.budgetItems)
      ? serverState.budgetItems
      : [],
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
  const dummyResolved = resolveShowcaseDummyClientId(rawParam);
  if (dummyResolved) return dummyResolved;

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
    siteTitle: 'My Event Planner',
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
  const pathname = usePathname() || '/';
  const pathHashSegment = useMemo(() => {
    const seg = pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '';
    if (!seg || seg === 'api' || seg === '_next' || seg.includes('.')) return '';
    return decodeURIComponent(seg);
  }, [pathname]);
  const urlClientParam = searchParams.get('client') || '';
  const rawUrlGuestTo = searchParams.get('to') || '';
  const rawUrlGuestCode =
    pathHashSegment ||
    searchParams.get('u') ||
    searchParams.get('code') ||
    searchParams.get('token') ||
    '';
  const urlMode = searchParams.get('mode') || '';
  const hasInitialGuestOrClientUrl = Boolean(
    rawUrlGuestCode || urlClientParam || rawUrlGuestTo
  );

  const [isUrlGuestSessionCleared, setIsUrlGuestSessionCleared] =
    useState(false);
  const urlGuestTo = isUrlGuestSessionCleared ? '' : rawUrlGuestTo;
  const urlGuestCode = isUrlGuestSessionCleared ? '' : rawUrlGuestCode;

  const [state, setState] = useState<WeddingDatabaseSchema>(() =>
    getInitialClientState()
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() =>
    getStoredAdminUser()
  );
  const [viewMode, setViewMode] = useState<'PUBLIC' | 'ADMIN'>(() => {
    if (hasInitialGuestOrClientUrl && urlMode !== 'admin') return 'PUBLIC';
    const storedMode = getStoredViewMode();
    const storedUser = getStoredAdminUser();
    if (storedUser && storedMode === 'ADMIN') return 'ADMIN';
    return 'PUBLIC';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginLang, setLoginLang] = useState<'ID' | 'EN'>('ID');
  const [isGmailExpanded, setIsGmailExpanded] = useState(false);
  const [gmailAddressInput, setGmailAddressInput] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);
  const [loginErrorMsg, setLoginErrorMsg] = useState('');
  const [isQuickDemoOpen, setIsQuickDemoOpen] = useState(false);
  const [loginWelcomeToast, setLoginWelcomeToast] = useState<string | null>(
    null
  );
  const [previewOverrideGuest, setPreviewOverrideGuest] = useState<WeddingGuest | null>(
    null
  );
  const [demoPackageTier, setDemoPackageTier] =
    useState<ShowcasePackageTier>('ROYAL VIP');
  const [demoManagerClientId, setDemoManagerClientId] = useState<string | null>(
    null
  );
  const [demoCustomOverrides, setDemoCustomOverrides] = useState<
    Record<string, Partial<WeddingDatabaseSchema>>
  >({});
  const isCloudHydratedRef = useRef(false);

  const clientGroups = useMemo(() => buildEffectiveClientGroups(state), [state]);

  const allWorkspacesForHashLookup = useMemo(() => {
    const list: Array<{
      clientId: string;
      clientLabel: string;
      guests: WeddingGuest[];
      settings?: WeddingSettings;
    }> = [
      {
        clientId: 'client-utama',
        clientLabel: `${state.settings.groomNickname} & ${state.settings.brideNickname}`,
        guests: state.guests || [],
        settings: state.settings,
      },
    ];
    if (state.settings.clientWorkspaces) {
      Object.entries(state.settings.clientWorkspaces).forEach(([cid, ws]) => {
        if (!ws || cid === 'client-utama') return;
        const grp = clientGroups.find((g) => g.id === cid);
        list.push({
          clientId: cid,
          clientLabel: grp?.coupleLabel || ws.settings?.groomNickname || cid,
          guests: ws.guests || [],
          settings: ws.settings,
        });
      });
    }
    SHOWCASE_DUMMY_CLIENT_METAS.forEach((meta) => {
      const dummyState = getShowcaseDummyClientState(meta.id, demoPackageTier);
      list.push({
        clientId: meta.id,
        clientLabel: `${meta.coupleLabel} (${meta.badgeId})`,
        guests: dummyState.guests,
        settings: dummyState.settings,
      });
    });
    return list;
  }, [state.guests, state.settings, clientGroups, demoPackageTier]);

  // Active workspace in Admin Dashboard (locked to user's clientId for non-utama clients)
  const [selectedAdminWorkspaceId, setSelectedAdminWorkspaceId] =
    useState<string>(() => {
      const storedUser = getStoredAdminUser();
      return storedUser?.clientId || 'client-utama';
    });

  const activeWorkspaceClientId = useMemo(() => {
    const isSuper =
      adminUser?.role === 'SUPERADMIN' ||
      adminUser?.username?.trim().toLowerCase() === 'superadmin';
    if (!isSuper) {
      return adminUser?.clientId || 'client-utama';
    }
    return selectedAdminWorkspaceId || 'client-utama';
  }, [adminUser, selectedAdminWorkspaceId]);

  // Public view routing: null = show Commercial Landing Page (/); string = show PublicInvitationView for that clientId
  const [publicSelectedClientId, setPublicSelectedClientId] = useState<
    string | null
  >(() => {
    if (urlGuestCode) {
      const resolvedHash = resolveGuestByHashTokenAcrossWorkspaces(
        urlGuestCode,
        allWorkspacesForHashLookup
      );
      if (resolvedHash) {
        return resolvedHash.clientId;
      }
    }
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
  }>(() => {
    if (urlGuestCode) {
      const resolvedHash = resolveGuestByHashTokenAcrossWorkspaces(
        urlGuestCode,
        allWorkspacesForHashLookup
      );
      if (resolvedHash) {
        return {
          to: resolvedHash.guest.guestName,
          code: resolvedHash.hashToken,
        };
      }
    }
    return {};
  });

  useEffect(() => {
    if (urlGuestCode) {
      const resolvedHash = resolveGuestByHashTokenAcrossWorkspaces(
        urlGuestCode,
        allWorkspacesForHashLookup
      );
      if (resolvedHash) {
        setPublicSelectedClientId(resolvedHash.clientId);
        setManualGuestLookup({
          to: resolvedHash.guest.guestName,
          code: resolvedHash.hashToken,
        });
        return;
      }
    }
    if (urlClientParam || urlGuestTo || urlGuestCode) {
      const resolved = urlClientParam
        ? resolveClientIdFromParam(urlClientParam, clientGroups)
        : 'client-utama';
      setPublicSelectedClientId(resolved);
    }
  }, [
    urlClientParam,
    urlGuestTo,
    urlGuestCode,
    clientGroups,
    allWorkspacesForHashLookup,
  ]);

  const changeViewMode = useCallback((mode: 'PUBLIC' | 'ADMIN') => {
    setViewMode(mode);
    saveStoredViewMode(mode);
  }, []);

  useEffect(() => {
    if (viewMode === 'ADMIN' || publicSelectedClientId === null) {
      weddingMusicPlayer.stop();
    }
    if (viewMode === 'ADMIN') {
      setIsUrlGuestSessionCleared(true);
      setPreviewOverrideGuest(null);
      setManualGuestLookup({});
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
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
          if (
            urlMode === 'admin' ||
            (!hasInitialGuestOrClientUrl && getStoredViewMode() === 'ADMIN')
          ) {
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
        markInitialCloudHydrationComplete(merged);
        isCloudHydratedRef.current = true;
        setState(merged);
        saveClientState(merged, false);
        if (merged.guests.length > (cloudState.guests?.length || 0)) {
          void saveStateToSupabase(merged);
        }
      } else if (cloudResult.tableExists) {
        markInitialCloudHydrationComplete(null);
        isCloudHydratedRef.current = true;
        setState(bestLocal);
        saveClientState(bestLocal, false);
        const isEmptySeed =
          bestLocal.guests.length === 0 &&
          bestLocal.settings.groomParents === INITIAL_SETTINGS.groomParents;
        if (!isEmptySeed) {
          void saveStateToSupabase(bestLocal);
        }
      } else {
        setState(bestLocal);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, [urlMode, changeViewMode]);

  const isReconcilingRef = useRef(false);

  useEffect(() => {
    const handleReconnectOrVisible = async () => {
      if (!isCloudHydratedRef.current) return;
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      const currentStatus = getCloudSyncStatus().status;
      if (currentStatus === 'OFFLINE') {
        void saveStateToSupabase(state);
        return;
      }

      if (currentStatus === 'SYNCED' && !isReconcilingRef.current) {
        isReconcilingRef.current = true;
        try {
          const cloudRes = await loadStateFromSupabase();
          if (cloudRes.state) {
            const remote = cloudRes.state;
            setState((prev) => {
              const merged = mergePreservingLocalMedia(remote, prev);
              const hasChanged =
                merged.guests.length !== prev.guests.length ||
                merged.wishes.length !== prev.wishes.length ||
                merged.tasks.length !== prev.tasks.length ||
                merged.budgetItems.length !== prev.budgetItems.length ||
                merged.lastSyncedAt !== prev.lastSyncedAt ||
                merged.settings.updatedAt !== prev.settings.updatedAt;

              if (!hasChanged) {
                return prev;
              }

              markInitialCloudHydrationComplete(merged);
              saveClientState(merged, false);
              if (
                merged.guests.length > (remote.guests?.length || 0) ||
                merged.wishes.length > (remote.wishes?.length || 0)
              ) {
                void saveStateToSupabase(merged);
              }
              return merged;
            });
          }
        } catch {
          // Ignore background reconcile network errors
        } finally {
          isReconcilingRef.current = false;
        }
      }
    };

    const intervalId = setInterval(() => {
      void handleReconnectOrVisible();
    }, 25000);

    window.addEventListener('online', handleReconnectOrVisible);
    window.addEventListener('focus', handleReconnectOrVisible);
    document.addEventListener('visibilitychange', handleReconnectOrVisible);
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('online', handleReconnectOrVisible);
      window.removeEventListener('focus', handleReconnectOrVisible);
      document.removeEventListener(
        'visibilitychange',
        handleReconnectOrVisible
      );
    };
  }, [state]);

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

  const updateDemoClientState = useCallback(
    (
      dummyClientId: string,
      updater: (current: WeddingDatabaseSchema) => WeddingDatabaseSchema
    ) => {
      const resolvedId =
        resolveShowcaseDummyClientId(dummyClientId) || dummyClientId;
      setDemoCustomOverrides((prev) => {
        const baseDummy = getShowcaseDummyClientState(
          resolvedId,
          demoPackageTier
        );
        const existingOverride = prev[resolvedId];
        const currentMerged: WeddingDatabaseSchema = existingOverride
          ? {
              ...baseDummy,
              ...existingOverride,
              settings: {
                ...baseDummy.settings,
                ...(existingOverride.settings || {}),
              },
            }
          : baseDummy;
        const nextMerged = updater(currentMerged);
        return {
          ...prev,
          [resolvedId]: {
            settings: nextMerged.settings,
            tasks: nextMerged.tasks,
            guests: nextMerged.guests,
            wishes: nextMerged.wishes,
            budgetItems: nextMerged.budgetItems,
          },
        };
      });
    },
    [demoPackageTier]
  );

  const handleOpenDemoManager = useCallback(
    (dummyClientId: string, tier?: ShowcasePackageTier) => {
      weddingMusicPlayer.stop();
      const resolvedDummyId =
        resolveShowcaseDummyClientId(dummyClientId) || dummyClientId;
      if (tier) setDemoPackageTier(tier);
      setIsUrlGuestSessionCleared(true);
      setPreviewOverrideGuest(null);
      setManualGuestLookup({});
      setDemoManagerClientId(resolvedDummyId);
      setPublicSelectedClientId(resolvedDummyId);
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }
    },
    []
  );

  const handleOpenAdminPortal = () => {
    weddingMusicPlayer.stop();
    if (
      publicSelectedClientId &&
      isShowcaseDummyClientId(publicSelectedClientId)
    ) {
      handleOpenDemoManager(publicSelectedClientId, demoPackageTier);
      return;
    }
    setIsUrlGuestSessionCleared(true);
    setPreviewOverrideGuest(null);
    setManualGuestLookup({});
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
    if (adminUser) {
      changeViewMode('ADMIN');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  useEffect(() => {
    if (!loginWelcomeToast) return;
    const t = window.setTimeout(() => setLoginWelcomeToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [loginWelcomeToast]);

  const handleLoginSuccess = (user: AdminUser, welcomeToastText?: string) => {
    setAdminUser(user);
    saveStoredAdminUser(user);
    setSelectedAdminWorkspaceId(user.clientId || 'client-utama');
    setIsUrlGuestSessionCleared(true);
    setPreviewOverrideGuest(null);
    setManualGuestLookup({});
    setDemoManagerClientId(null);
    setIsLoginModalOpen(false);
    setLoginErrorMsg('');
    if (welcomeToastText) {
      setLoginWelcomeToast(welcomeToastText);
    } else {
      setLoginWelcomeToast(
        loginLang === 'EN'
          ? `Welcome back, ${user.nama}! Your Planner workspace is active.`
          : `Selamat datang kembali, ${user.nama}! Ruang kerja Planner Anda aktif.`
      );
    }
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
    changeViewMode('ADMIN');
    appendAuditLog({
      actor: user.username,
      module: 'KEAMANAN',
      action: 'SIMPAN',
      status: 'SUCCESS',
      summary: `Login sesi Admin berhasil (${user.nama})`,
    });
  };

  const handleGmailLoginSubmit = (
    e?: React.FormEvent,
    overrideEmail?: string
  ) => {
    if (e) e.preventDefault();
    setLoginErrorMsg('');
    const raw = (overrideEmail ?? gmailAddressInput).trim().toLowerCase();
    if (!raw) {
      setLoginErrorMsg(
        loginLang === 'EN'
          ? 'Please enter your @gmail.com address to continue.'
          : 'Silakan masukkan alamat @gmail.com Anda terlebih dahulu.'
      );
      return;
    }

    const normalizedEmail = raw.includes('@') ? raw : `${raw}@gmail.com`;
    const localPart = normalizedEmail.split('@')[0] || 'planner';

    const isOwnerAccount =
      normalizedEmail === 'e98.bisnis@gmail.com' ||
      normalizedEmail === 'omeko42@gmail.com' ||
      raw === 'omeko42' ||
      localPart === 'omeko42' ||
      localPart === 'e98.bisnis';

    if (isOwnerAccount) {
      const ownerUser: AdminUser = {
        id: 'usr-owner-eko',
        username: 'eko',
        nama: 'Eko Agung K. (Owner)',
        role: 'SUPERADMIN',
        jabatan: 'Owner & Lead Developer (omeko42)',
        email: 'e98.bisnis@gmail.com',
        clientId: 'client-utama',
        clientName: `Client Utama • ${state.settings.groomNickname || 'Agung'} & ${
          state.settings.brideNickname || 'Selo'
        }`,
      };
      setGmailAddressInput('');
      setIsGmailExpanded(false);
      handleLoginSuccess(
        ownerUser,
        loginLang === 'EN'
          ? 'Welcome back, Eko (Owner / Developer)! Full Superadmin access enabled.'
          : 'Selamat datang kembali, Eko (Owner / Developer)! Akses Superadmin aktif.'
      );
      return;
    }

    const formattedDisplayName =
      localPart
        .replace(/[._-]+/g, ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .trim() || 'Planner Guest';

    const targetClientId =
      publicSelectedClientId &&
      !isShowcaseDummyClientId(publicSelectedClientId)
        ? publicSelectedClientId
        : 'client-utama';
    const targetGrp = clientGroups.find((g) => g.id === targetClientId);

    const gmailClientUser: AdminUser = {
      id: `usr-gmail-${localPart.replace(/[^a-z0-9]/gi, '') || 'user'}`,
      username: localPart,
      nama: formattedDisplayName,
      role: 'MEMPELAI_PRIA',
      jabatan:
        loginLang === 'EN'
          ? 'Google (Gmail) Planner Session'
          : 'Sesi Planner Google (Gmail)',
      email: normalizedEmail,
      clientId: targetClientId,
      clientName:
        targetGrp?.clientName ||
        `Client Utama • ${state.settings.groomNickname || 'Agung'} & ${
          state.settings.brideNickname || 'Selo'
        }`,
    };

    setGmailAddressInput('');
    setIsGmailExpanded(false);
    handleLoginSuccess(
      gmailClientUser,
      loginLang === 'EN'
        ? `Signed in with Google as ${formattedDisplayName} (${normalizedEmail})`
        : `Berhasil masuk via Google sebagai ${formattedDisplayName} (${normalizedEmail})`
    );
  };

  const handlePlannerCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg('');
    const cleanId = loginIdentifier.trim();
    if (!cleanId || !loginPassword) {
      setLoginErrorMsg(
        loginLang === 'EN'
          ? 'Please enter both username and password.'
          : 'Mohon isi username dan kata sandi Anda.'
      );
      return;
    }

    // Support entering a Gmail address directly in the username field too
    if (cleanId.toLowerCase().endsWith('@gmail.com')) {
      handleGmailLoginSubmit(undefined, cleanId);
      return;
    }

    setIsSubmittingLogin(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          identifier: cleanId,
          password: loginPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.user) {
        setLoginErrorMsg(
          json.error ||
            (loginLang === 'EN'
              ? 'Invalid username or password. You can also sign in with Google (Gmail) above.'
              : 'Username atau kata sandi belum sesuai. Anda juga dapat masuk cepat dengan Google (Gmail) di atas.')
        );
        return;
      }

      setLoginIdentifier('');
      setLoginPassword('');
      handleLoginSuccess(json.user as AdminUser);
    } catch {
      setLoginErrorMsg(
        loginLang === 'EN'
          ? 'Unable to reach authentication server. Please check your connection or use Google Sign-In.'
          : 'Gagal menghubungi server otentikasi. Periksa koneksi Anda atau gunakan Masuk dengan Google (Gmail).'
      );
    } finally {
      setIsSubmittingLogin(false);
    }
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
    setIsUrlGuestSessionCleared(true);
    setPreviewOverrideGuest(null);
    setManualGuestLookup({});
    setPublicSelectedClientId(null);
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, '', '/');
    }
    changeViewMode('PUBLIC');
  };

  const handleSwitchToPublicPreview = (guest?: WeddingGuest) => {
    setIsUrlGuestSessionCleared(true);
    setManualGuestLookup({});
    if (guest) {
      setPreviewOverrideGuest(guest);
      if (typeof window !== 'undefined') {
        const hashToken =
          guest.invitationToken ||
          computeGuestInvitationHash(activeWorkspaceClientId, guest);
        window.history.pushState({}, '', `/${encodeURIComponent(hashToken)}`);
      }
    } else {
      setPreviewOverrideGuest(null);
      if (typeof window !== 'undefined') {
        window.history.pushState({}, '', '/');
      }
    }
    setDemoManagerClientId(null);
    setPublicSelectedClientId(activeWorkspaceClientId);
    changeViewMode('PUBLIC');
  };

  const handleOpenLandingPage = () => {
    weddingMusicPlayer.stop();
    setIsUrlGuestSessionCleared(true);
    setPreviewOverrideGuest(null);
    setManualGuestLookup({});
    setDemoManagerClientId(null);
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
    setDemoManagerClientId(null);
    setManualGuestLookup({ to: guestTo, code: guestCode });
    setPublicSelectedClientId(clientId);
    changeViewMode('PUBLIC');
    if (typeof window !== 'undefined') {
      if (guestCode) {
        window.history.pushState({}, '', `/${encodeURIComponent(guestCode)}`);
      } else {
        const dummyMeta = SHOWCASE_DUMMY_CLIENT_METAS.find(
          (m) => m.id === clientId || m.slug === clientId
        );
        const grp = clientGroups.find((g) => g.id === clientId);
        const slug = dummyMeta
          ? dummyMeta.slug
          : clientId === 'client-utama'
            ? 'agung_selo'
            : (grp?.clientCode || clientId.replace(/^client-/i, '')).toLowerCase();
        const params = new URLSearchParams();
        params.set('client', slug);
        if (guestTo) params.set('to', guestTo);
        window.history.pushState({}, '', `/?${params.toString()}`);
      }
    }
  };

  // Projected state for the active Admin Workspace
  const activeAdminState = useMemo(
    () => projectStateForClient(state, activeWorkspaceClientId, clientGroups),
    [state, activeWorkspaceClientId, clientGroups]
  );

  // Projected state for the active Public Invitation
  const activePublicClientId = publicSelectedClientId || 'client-utama';
  const activePublicState = useMemo(() => {
    if (isShowcaseDummyClientId(activePublicClientId)) {
      const baseDummy = getShowcaseDummyClientState(
        activePublicClientId,
        demoPackageTier
      );
      const override = demoCustomOverrides[activePublicClientId];
      if (!override) return baseDummy;
      return {
        ...baseDummy,
        ...override,
        settings: { ...baseDummy.settings, ...(override.settings || {}) },
      };
    }
    return projectStateForClient(state, activePublicClientId, clientGroups);
  }, [
    state,
    activePublicClientId,
    clientGroups,
    demoPackageTier,
    demoCustomOverrides,
  ]);

  // Optimistic Local-First + Direct Supabase Cloud CRUD Handlers (Workspace-Scoped)
  const handleUpsertTask = async (task: Partial<WeddingTask> & { title: string }) => {
    const targetId = task.id || `tsk_${Date.now().toString(36)}`;
    registerLocalItemTouch(targetId);
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
              id: targetId,
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
      await mutateServer('UPSERT_TASK', { ...task, id: targetId });
    }
  };

  const handleDeleteTask = async (id: string) => {
    registerExplicitCloudDeletion('tasks', id);
    const target = activeAdminState.tasks.find((t) => t.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
      settings: {
        ...prev.settings,
        deletedIdsRegistry: {
          ...(prev.settings.deletedIdsRegistry || {}),
          tasks: Array.from(
            new Set([...(prev.settings.deletedIdsRegistry?.tasks || []), id])
          ),
        },
        updatedAt: new Date().toISOString(),
      },
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
    const targetId = guest.id || `gst_${Date.now().toString(36)}`;
    registerLocalItemTouch(targetId);
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
              id: targetId,
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
      await mutateServer('UPSERT_GUEST', { ...guest, id: targetId });
    }
  };

  const handleDeleteGuest = async (id: string) => {
    registerExplicitCloudDeletion('guests', id);
    const target = activeAdminState.guests.find((g) => g.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      guests: prev.guests.filter((g) => g.id !== id),
      settings: {
        ...prev.settings,
        deletedIdsRegistry: {
          ...(prev.settings.deletedIdsRegistry || {}),
          guests: Array.from(
            new Set([...(prev.settings.deletedIdsRegistry?.guests || []), id])
          ),
        },
        updatedAt: new Date().toISOString(),
      },
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

    const applyRsvpUpdate = (
      prev: WeddingDatabaseSchema
    ): WeddingDatabaseSchema => {
      const nextGuests = [...prev.guests];
      let targetIdx = -1;
      if (payload.invitationCode) {
        const cleanCode = payload.invitationCode.trim().toLowerCase();
        targetIdx = nextGuests.findIndex(
          (g) =>
            g.invitationCode.toLowerCase() === cleanCode ||
            computeGuestInvitationHash(activePublicClientId, g).toLowerCase() ===
              cleanCode
        );
      }
      if (targetIdx < 0 && payload.originalUrlCodeParam) {
        const cleanParamCode = payload.originalUrlCodeParam
          .trim()
          .toLowerCase();
        targetIdx = nextGuests.findIndex(
          (g) =>
            g.invitationCode.toLowerCase() === cleanParamCode ||
            computeGuestInvitationHash(activePublicClientId, g).toLowerCase() ===
              cleanParamCode
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
    };

    if (isShowcaseDummyClientId(activePublicClientId)) {
      updateDemoClientState(activePublicClientId, applyRsvpUpdate);
      return;
    }

    updateClientScopedState(activePublicClientId, applyRsvpUpdate);

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
    registerExplicitCloudDeletion('wishes', id);
    const target = activeAdminState.wishes.find((w) => w.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      wishes: prev.wishes.filter((w) => w.id !== id),
      settings: {
        ...prev.settings,
        deletedIdsRegistry: {
          ...(prev.settings.deletedIdsRegistry || {}),
          wishes: Array.from(
            new Set([...(prev.settings.deletedIdsRegistry?.wishes || []), id])
          ),
        },
        updatedAt: new Date().toISOString(),
      },
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
    const targetId = item.id || `bgt_${Date.now().toString(36)}`;
    registerLocalItemTouch(targetId);
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
              id: targetId,
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
      await mutateServer('UPSERT_BUDGET', { ...item, id: targetId });
    }
  };

  const handleDeleteBudget = async (id: string) => {
    registerExplicitCloudDeletion('budgets', id);
    const target = activeAdminState.budgetItems.find((b) => b.id === id);
    updateClientScopedState(activeWorkspaceClientId, (prev) => ({
      ...prev,
      budgetItems: prev.budgetItems.filter((b) => b.id !== id),
      settings: {
        ...prev.settings,
        deletedIdsRegistry: {
          ...(prev.settings.deletedIdsRegistry || {}),
          budgets: Array.from(
            new Set([...(prev.settings.deletedIdsRegistry?.budgets || []), id])
          ),
        },
        updatedAt: new Date().toISOString(),
      },
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
    const resetState: WeddingDatabaseSchema = {
      settings: { ...INITIAL_SETTINGS, updatedAt: new Date().toISOString() },
      tasks: [...INITIAL_TASKS],
      guests: [...INITIAL_GUESTS],
      wishes: [...INITIAL_WISHES],
      budgetItems: [...INITIAL_BUDGET_ITEMS],
      adminUsers: state.adminUsers?.length ? state.adminUsers : [...INITIAL_ADMIN_USERS],
      lastSyncedAt: new Date().toISOString(),
    };
    updateClientScopedState(activeWorkspaceClientId, () => resetState);
    if (activeWorkspaceClientId === 'client-utama') {
      void saveStateToSupabase(resetState, { forceOverwrite: true });
    }
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
      if (isShowcaseDummyClientId(activePublicClientId)) {
        updateDemoClientState(activePublicClientId, (prev) => {
          const nextAnalytics = appendInvitationAnalyticsEvent(
            prev.settings,
            payload,
            prev.guests,
            prev.wishes
          );
          return {
            ...prev,
            settings: {
              ...prev.settings,
              invitationAnalytics: nextAnalytics,
            },
          };
        });
        return;
      }
      if (!isCloudHydratedRef.current) return;
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
    [
      activePublicClientId,
      updateClientScopedState,
      updateDemoClientState,
      mutateServer,
    ]
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
    previewOverrideGuest?.invitationToken ||
    previewOverrideGuest?.invitationCode ||
    manualGuestLookup.code ||
    urlGuestCode;

  const isDemoManagerActive = Boolean(
    demoManagerClientId && isShowcaseDummyClientId(demoManagerClientId)
  );
  const activeDummyClientIdForSandbox = isDemoManagerActive
    ? demoManagerClientId!
    : publicSelectedClientId && isShowcaseDummyClientId(publicSelectedClientId)
      ? publicSelectedClientId
      : null;

  const activeDemoAdminState = useMemo<WeddingDatabaseSchema | null>(() => {
    if (!demoManagerClientId || !isShowcaseDummyClientId(demoManagerClientId)) {
      return null;
    }
    const baseDummy = getShowcaseDummyClientState(
      demoManagerClientId,
      demoPackageTier
    );
    const override = demoCustomOverrides[demoManagerClientId];
    if (!override) return baseDummy;
    return {
      ...baseDummy,
      ...override,
      settings: { ...baseDummy.settings, ...(override.settings || {}) },
    };
  }, [demoManagerClientId, demoPackageTier, demoCustomOverrides]);

  const activeDemoAdminUser = useMemo<AdminUser | null>(() => {
    if (!demoManagerClientId || !isShowcaseDummyClientId(demoManagerClientId)) {
      return null;
    }
    const meta =
      SHOWCASE_DUMMY_CLIENT_METAS.find((m) => m.id === demoManagerClientId) ||
      SHOWCASE_DUMMY_CLIENT_METAS[0];
    return {
      id: `demo_mgr_${meta.slug}`,
      username: `demo_${meta.slug}`,
      passwordHash: 'demo',
      nama: `Demo Manager • ${meta.coupleLabel}`,
      role: 'MEMPELAI_PRIA',
      jabatan: `${meta.badgeId} (${demoPackageTier})`,
      email: `${meta.slug}@meplanner.demo`,
      clientId: meta.id,
      clientName: `${meta.coupleLabel} (${meta.badgeId})`,
    };
  }, [demoManagerClientId, demoPackageTier]);

  const demoSandboxBar = activeDummyClientIdForSandbox ? (
    <div className="fixed bottom-3 left-3 z-50 flex flex-wrap items-center gap-1 rounded-2xl bg-stone-900/95 px-2 py-1.5 text-[#FAF3E3] border border-[#D4AF37]/60 shadow-[0_14px_34px_rgba(12,10,9,0.55)] backdrop-blur-md max-w-[calc(100vw-1.5rem)]">
      <button
        type="button"
        onClick={handleOpenLandingPage}
        className="inline-flex items-center gap-1 px-2 py-1 rounded-xl bg-stone-800 hover:bg-stone-700 text-[#FAF3E3] border border-stone-700 text-[10px] sm:text-[11px] font-extrabold transition-all whitespace-nowrap"
        title="Kembali ke Katalog MEPlanner"
      >
        <span>&larr; Katalog</span>
      </button>

      <div className="inline-flex items-center rounded-xl bg-stone-950/90 p-0.5 border border-stone-800">
        <button
          type="button"
          onClick={() => {
            setDemoManagerClientId(null);
            setPublicSelectedClientId(activeDummyClientIdForSandbox);
          }}
          title="Lihat tampilan Undangan Dummy"
          className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all whitespace-nowrap ${
            !isDemoManagerActive
              ? 'bg-[#D4AF37] text-stone-950 shadow-sm'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          Undangan
        </button>
        <button
          type="button"
          onClick={() =>
            handleOpenDemoManager(activeDummyClientIdForSandbox, demoPackageTier)
          }
          title="Buka Demo Planner untuk Dummy Client ini"
          className={`px-2 py-1 rounded-lg text-[10px] sm:text-[11px] font-extrabold transition-all whitespace-nowrap ${
            isDemoManagerActive
              ? 'bg-[#D4AF37] text-stone-950 shadow-sm'
              : 'text-stone-300 hover:text-white'
          }`}
        >
          Demo
        </button>
      </div>

      <div className="inline-flex items-center rounded-xl bg-stone-950/90 p-0.5 border border-stone-800">
        {(['STARTER', 'EXCLUSIVE', 'ROYAL VIP'] as ShowcasePackageTier[]).map(
          (tierOpt) => (
            <button
              key={tierOpt}
              type="button"
              onClick={() => setDemoPackageTier(tierOpt)}
              className={`px-1.5 sm:px-2 py-1 rounded-lg text-[9px] sm:text-[10px] font-extrabold transition-all whitespace-nowrap ${
                demoPackageTier === tierOpt
                  ? 'bg-amber-500/25 text-[#F6E27A] border border-[#D4AF37]/60'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
              title={`Simulasikan Paket ${tierOpt}`}
            >
              {tierOpt === 'ROYAL VIP' ? 'VIP' : tierOpt}
            </button>
          )
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      {isDemoManagerActive && activeDemoAdminState && activeDemoAdminUser ? (
        <div className="relative">
          {demoSandboxBar}
          <AdminDashboardView
            state={activeDemoAdminState}
            adminUser={activeDemoAdminUser}
            onSwitchToPublicPreview={(guest) => {
              if (guest) {
                setPreviewOverrideGuest(guest);
                if (typeof window !== 'undefined' && demoManagerClientId) {
                  const hashToken =
                    guest.invitationToken ||
                    computeGuestInvitationHash(demoManagerClientId, guest);
                  window.history.pushState(
                    {},
                    '',
                    `/${encodeURIComponent(hashToken)}`
                  );
                }
              }
              setDemoManagerClientId(null);
              setPublicSelectedClientId(demoManagerClientId);
            }}
            onLogoutAdmin={handleOpenLandingPage}
            onUpsertTask={async (task) => {
              const targetId = task.id || `demo_tsk_${Date.now().toString(36)}`;
              updateDemoClientState(demoManagerClientId!, (prev) => {
                const exists =
                  task.id && prev.tasks.some((t) => t.id === task.id);
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
                            status:
                              task.status || (task.done ? 'SELESAI' : t.status),
                          } as WeddingTask)
                        : t
                    )
                  : [
                      ...prev.tasks,
                      {
                        id: targetId,
                        category: task.category || 'Acara',
                        timelinePhase: task.timelinePhase || 'H-1 Bulan',
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
                        updatedBy: 'demo_manager',
                      } as WeddingTask,
                    ];
                return { ...prev, tasks: nextTasks };
              });
            }}
            onDeleteTask={async (id) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                tasks: prev.tasks.filter((t) => t.id !== id),
              }));
            }}
            onUpsertGuest={async (guest) => {
              const targetId =
                guest.id || `demo_gst_${Date.now().toString(36)}`;
              updateDemoClientState(demoManagerClientId!, (prev) => {
                const exists =
                  guest.id && prev.guests.some((g) => g.id === guest.id);
                const nextGuests = exists
                  ? prev.guests.map((g) =>
                      g.id === guest.id
                        ? ({ ...g, ...guest } as WeddingGuest)
                        : g
                    )
                  : [
                      ...prev.guests,
                      {
                        id: targetId,
                        invitationCode:
                          guest.invitationCode ||
                          `INV-${String(prev.guests.length + 1).padStart(4, '0')}`,
                        guestName: guest.guestName,
                        guestType: guest.guestType || 'Keluarga',
                        side: guest.side || 'Pria',
                        institution: guest.institution || '',
                        invitationFormat: guest.invitationFormat || 'Online',
                        priority: guest.priority || 'P2 - Utama',
                        cardQty: Number(guest.cardQty) || 1,
                        pax: Number(guest.pax) || 2,
                        phone: guest.phone || '',
                        address: guest.address || '',
                        deliveryStatus:
                          guest.deliveryStatus || 'Belum Dikirim',
                        rsvpStatus: guest.rsvpStatus || 'Belum Konfirmasi',
                        attendanceStatus:
                          guest.attendanceStatus || 'Belum Hadir',
                        notes: guest.notes || '',
                        createdAt: new Date().toISOString().slice(0, 10),
                        updatedAt: new Date().toISOString().slice(0, 10),
                        updatedBy: 'demo_manager',
                      } as WeddingGuest,
                    ];
                return { ...prev, guests: nextGuests };
              });
            }}
            onDeleteGuest={async (id) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                guests: prev.guests.filter((g) => g.id !== id),
              }));
            }}
            onTogglePinWish={async (id) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                wishes: prev.wishes.map((w) =>
                  w.id === id ? { ...w, isPinned: !w.isPinned } : w
                ),
              }));
            }}
            onReplyWish={async (id, replyFromCouple) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                wishes: prev.wishes.map((w) =>
                  w.id === id ? { ...w, replyFromCouple } : w
                ),
              }));
            }}
            onModerateWish={async (id, moderationStatus, flaggedReason) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                wishes: prev.wishes.map((w) =>
                  w.id === id
                    ? {
                        ...w,
                        moderationStatus,
                        ...(flaggedReason !== undefined
                          ? { flaggedReason }
                          : {}),
                      }
                    : w
                ),
              }));
            }}
            onDeleteWish={async (id) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                wishes: prev.wishes.filter((w) => w.id !== id),
              }));
            }}
            onUpsertBudget={async (item) => {
              const targetId =
                item.id || `demo_bgt_${Date.now().toString(36)}`;
              updateDemoClientState(demoManagerClientId!, (prev) => {
                const exists =
                  item.id && prev.budgetItems.some((b) => b.id === item.id);
                const nextBudget = exists
                  ? prev.budgetItems.map((b) =>
                      b.id === item.id
                        ? ({ ...b, ...item } as BudgetVendorItem)
                        : b
                    )
                  : [
                      ...prev.budgetItems,
                      {
                        id: targetId,
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
            }}
            onDeleteBudget={async (id) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                budgetItems: prev.budgetItems.filter((b) => b.id !== id),
              }));
            }}
            onUpdateSettings={(partial) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                settings: {
                  ...prev.settings,
                  ...partial,
                  updatedAt: new Date().toISOString(),
                },
              }));
            }}
            onSyncGoogleSheets={async () =>
              'Mode Demo Sandbox: Perubahan tersimpan instan di memori sesi ini.'
            }
            onImportBackup={async (payload) => {
              updateDemoClientState(demoManagerClientId!, (prev) => ({
                ...prev,
                ...(payload.settings
                  ? { settings: { ...prev.settings, ...payload.settings } }
                  : {}),
                ...(Array.isArray(payload.tasks)
                  ? { tasks: payload.tasks }
                  : {}),
                ...(Array.isArray(payload.guests)
                  ? { guests: payload.guests }
                  : {}),
                ...(Array.isArray(payload.wishes)
                  ? { wishes: payload.wishes }
                  : {}),
                ...(Array.isArray(payload.budgetItems)
                  ? { budgetItems: payload.budgetItems }
                  : {}),
              }));
            }}
            onResetDefault={async () => {
              setDemoCustomOverrides((prev) => {
                const next = { ...prev };
                delete next[demoManagerClientId!];
                return next;
              });
            }}
            activeWorkspaceClientId={demoManagerClientId!}
            onSwitchWorkspaceClient={(cid) => {
              if (isShowcaseDummyClientId(cid)) {
                handleOpenDemoManager(cid, demoPackageTier);
              }
            }}
            onOpenLandingPage={handleOpenLandingPage}
          />
        </div>
      ) : viewMode === 'ADMIN' && adminUser ? (
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
          onOpenDemoManager={handleOpenDemoManager}
          onSelectClientInvitation={handleSelectClientInvitationFromLanding}
          onUpsertCommercialPayment={handleUpsertCommercialPayment}
        />
      ) : (
        <div className="relative">
          {demoSandboxBar ? (
            demoSandboxBar
          ) : (
            !urlGuestTo &&
            !urlGuestCode && (
              <button
                type="button"
                onClick={handleOpenLandingPage}
                className="fixed bottom-4 left-4 z-50 inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-full bg-stone-900/90 hover:bg-stone-900 text-[#FAF3E3] border border-[#D4AF37]/50 text-[11px] font-extrabold shadow-lg backdrop-blur-md transition-all"
                title="Kembali ke Halaman Depan My Event Planner (MEPlanner)"
              >
                <span className="sm:hidden">&larr; MEPlanner</span>
                <span className="hidden sm:inline">&larr; Katalog MEPlanner</span>
              </button>
            )
          )}
          <PublicInvitationView
            settings={activePublicState.settings}
            guests={activePublicState.guests}
            wishes={activePublicState.wishes}
            guestParamName={effectiveGuestName}
            guestParamCode={effectiveGuestCode}
            isAdminLoggedIn={Boolean(adminUser)}
            onOpenAdminPortal={handleOpenAdminPortal}
            onOpenLandingPage={handleOpenLandingPage}
            onTrackAnalytics={handleTrackPublicAnalytics}
            onSubmitRsvp={handleSubmitPublicRsvp}
          />
        </div>
      )}

      {loginWelcomeToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[70] flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white/95 border border-[#D4AF37]/60 text-stone-800 shadow-[0_14px_38px_rgba(140,115,75,0.22)] backdrop-blur-md text-xs sm:text-sm font-bold max-w-[92vw]">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="truncate">{loginWelcomeToast}</span>
          <button
            type="button"
            onClick={() => setLoginWelcomeToast(null)}
            className="p-0.5 rounded-full text-stone-400 hover:text-stone-700"
            aria-label="Close notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {isLoginModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsLoginModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] overflow-y-auto shadow-[0_24px_64px_rgba(28,25,23,0.18)] border-t sm:border border-stone-200 text-stone-800 pb-safe">
            {/* Warm, Bright Editorial Header with ID | EN Language Toggle */}
            <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE2] p-5 sm:p-6 relative border-b border-stone-200/90">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-[#D4AF37]/40 text-[10px] font-extrabold uppercase tracking-[0.14em] text-[#8B6914]">
                  <Sparkles className="w-3 h-3 text-[#C5A059]" />
                  {loginLang === 'EN'
                    ? 'Planner & Host Portal'
                    : 'Portal Planner & Mempelai'}
                </span>

                <div className="flex items-center gap-1.5">
                  <div
                    className="inline-flex items-center rounded-full bg-white p-0.5 border border-stone-200 shadow-sm"
                    role="group"
                    aria-label="Language switcher"
                  >
                    <button
                      type="button"
                      onClick={() => setLoginLang('ID')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all ${
                        loginLang === 'ID'
                          ? 'bg-[#C5A059] text-white shadow-sm'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      ID
                    </button>
                    <button
                      type="button"
                      onClick={() => setLoginLang('EN')}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-all ${
                        loginLang === 'EN'
                          ? 'bg-[#C5A059] text-white shadow-sm'
                          : 'text-stone-500 hover:text-stone-800'
                      }`}
                    >
                      EN
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsLoginModalOpen(false)}
                    className="p-1.5 rounded-full bg-white hover:bg-stone-100 text-stone-500 hover:text-stone-800 border border-stone-200 transition-colors"
                    aria-label={loginLang === 'EN' ? 'Close' : 'Tutup'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-sm flex items-center justify-center shrink-0">
                  <WeddingRingsIcon className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                    {loginLang === 'EN'
                      ? 'Welcome to MEPlanner'
                      : 'Selamat Datang di MEPlanner'}
                  </h3>
                  <p className="text-xs text-stone-600 mt-0.5 leading-relaxed">
                    {loginLang === 'EN'
                      ? 'Manage your digital invitation, guest list, RSVP & event budget in one warm place.'
                      : 'Kelola undangan digital, daftar tamu, RSVP & anggaran acara Anda dengan nyaman.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
              {loginErrorMsg && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginErrorMsg}</span>
                </div>
              )}

              {/* OPTION 1: Sign in with Google (Gmail) */}
              <div className="rounded-2xl border border-stone-200/90 bg-gradient-to-b from-white to-[#FAF8F5] p-3.5 shadow-sm">
                <button
                  type="button"
                  onClick={() => {
                    setIsGmailExpanded((prev) => !prev);
                    setLoginErrorMsg('');
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-800 font-extrabold text-xs sm:text-sm border border-stone-200/90 shadow-sm flex items-center justify-center gap-3 transition-all"
                >
                  {/* Official 4-Color Google 'G' SVG Logo */}
                  <svg
                    viewBox="0 0 24 24"
                    className="w-5 h-5 shrink-0"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
                    />
                  </svg>
                  <span>
                    {loginLang === 'EN'
                      ? 'Continue with Google (Gmail)'
                      : 'Masuk dengan Google (Gmail)'}
                  </span>
                </button>

                {isGmailExpanded && (
                  <form
                    onSubmit={(e) => handleGmailLoginSubmit(e)}
                    className="mt-3 pt-3 border-t border-stone-200/80 space-y-2.5"
                  >
                    <label className="block text-[11px] font-bold text-stone-700">
                      {loginLang === 'EN'
                        ? 'Enter your @gmail.com address'
                        : 'Masukkan alamat @gmail.com Anda'}
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        autoFocus
                        value={gmailAddressInput}
                        onChange={(e) => setGmailAddressInput(e.target.value)}
                        placeholder={
                          loginLang === 'EN'
                            ? 'yourname@gmail.com'
                            : 'nama@gmail.com'
                        }
                        className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 focus:outline-none bg-white font-medium text-sm text-stone-900"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-stone-500">
                        {loginLang === 'EN' ? 'Quick pick:' : 'Pilih cepat:'}
                      </span>
                      {[
                        {
                          label:
                            loginLang === 'EN'
                              ? 'Bride & Groom'
                              : 'Mempelai & Keluarga',
                          email: 'mempelai.bahagia@gmail.com',
                        },
                        {
                          label:
                            loginLang === 'EN'
                              ? 'Event Committee'
                              : 'Panitia Acara',
                          email: 'panitia.acara@gmail.com',
                        },
                      ].map((preset) => (
                        <button
                          key={preset.email}
                          type="button"
                          onClick={() => {
                            setGmailAddressInput(preset.email);
                            handleGmailLoginSubmit(undefined, preset.email);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-stone-100 hover:bg-indigo-50 hover:text-indigo-700 text-stone-600 border border-stone-200/80 text-[10px] font-bold transition-colors"
                        >
                          {preset.label} ({preset.email})
                        </button>
                      ))}
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm transition-all"
                    >
                      <span>
                        {loginLang === 'EN'
                          ? 'Continue with Gmail'
                          : 'Lanjutkan dengan Gmail'}
                      </span>
                    </button>
                  </form>
                )}
              </div>

              {/* Divider */}
              <div className="relative flex items-center py-0.5">
                <div className="flex-grow border-t border-stone-200" />
                <span className="shrink-0 mx-3 text-[11px] font-semibold text-stone-400">
                  {loginLang === 'EN'
                    ? 'or sign in with Planner account'
                    : 'atau masuk dengan akun Planner'}
                </span>
                <div className="flex-grow border-t border-stone-200" />
              </div>

              {/* OPTION 2: Username & Password Form */}
              <form
                onSubmit={handlePlannerCredentialsSubmit}
                className="space-y-3.5"
              >
                <div>
                  <label className="block font-bold text-stone-700 mb-1.5 text-xs">
                    {loginLang === 'EN'
                      ? 'Planner Username'
                      : 'Username Akun Planner'}
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      autoComplete="username"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={
                        loginLang === 'EN'
                          ? 'Enter your username...'
                          : 'Masukkan username akun...'
                      }
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 focus:outline-none bg-[#FAF8F5] font-medium text-sm text-stone-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1.5 text-xs">
                    {loginLang === 'EN' ? 'Password' : 'Kata Sandi'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      required
                      autoComplete="current-password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder={
                        loginLang === 'EN'
                          ? 'Enter your password...'
                          : 'Masukkan kata sandi...'
                      }
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 focus:outline-none bg-[#FAF8F5] font-medium text-sm text-stone-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                      tabIndex={-1}
                    >
                      {showLoginPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingLogin}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
                >
                  {isSubmittingLogin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>
                        {loginLang === 'EN'
                          ? 'Signing in...'
                          : 'Memverifikasi Sesi...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>
                        {loginLang === 'EN'
                          ? 'Sign In to Planner'
                          : 'Masuk ke Planner'}
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Collapsible Quick Demo Accounts */}
              <div className="pt-1 border-t border-stone-200/80">
                <button
                  type="button"
                  onClick={() => setIsQuickDemoOpen((prev) => !prev)}
                  className="w-full py-2 px-3 rounded-xl bg-[#FAF8F5] hover:bg-stone-100 text-stone-700 font-bold text-xs flex items-center justify-between border border-stone-200/80 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
                    {loginLang === 'EN'
                      ? 'Quick Demo Accounts (1-Click Try)'
                      : 'Lihat Akun Demo Cepat (1-Klik Coba)'}
                  </span>
                  {isQuickDemoOpen ? (
                    <ChevronUp className="w-4 h-4 text-stone-500" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-500" />
                  )}
                </button>

                {isQuickDemoOpen && (
                  <div className="mt-2.5 grid grid-cols-1 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleGmailLoginSubmit(
                          undefined,
                          'pasangan.mempelai@gmail.com'
                        )
                      }
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-amber-50/70 border border-stone-200 hover:border-[#D4AF37]/60 text-left transition-all"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-stone-800">
                          {loginLang === 'EN'
                            ? 'Bride & Groom Planner'
                            : 'Akun Mempelai & Keluarga'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          pasangan.mempelai@gmail.com
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-amber-100/80 text-[#8B6914] text-[10px] font-extrabold">
                        {loginLang === 'EN' ? 'Enter →' : 'Masuk →'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginModalOpen(false);
                        handleOpenDemoManager(
                          'client-demo-wedding',
                          demoPackageTier
                        );
                      }}
                      className="flex items-center justify-between px-3 py-2 rounded-xl bg-white hover:bg-indigo-50/60 border border-stone-200 hover:border-indigo-300 text-left transition-all"
                    >
                      <div>
                        <p className="text-xs font-extrabold text-stone-800">
                          {loginLang === 'EN'
                            ? 'Interactive Demo Sandbox (5 Event Themes)'
                            : 'Mode Demo Sandbox (5 Tema Acara)'}
                        </p>
                        <p className="text-[11px] text-stone-500">
                          {loginLang === 'EN'
                            ? 'Try editing without signing in'
                            : 'Coba fitur editor tanpa perlu akun'}
                        </p>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold">
                        {loginLang === 'EN' ? 'Try Demo →' : 'Buka Demo →'}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] text-[#8B6914] flex flex-col items-center justify-center gap-1 text-sm font-bold">
          <span>Memuat My Event Planner...</span>
          <span className="text-[11px] font-medium text-[#9A742B]">by omeko42</span>
        </div>
      }
    >
      <WeddingAppContent />
    </Suspense>
  );
}
