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
  ReactGoogleLoginButton,
  type GoogleLoginResponse,
} from '@/components/ReactGoogleLoginButton';
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
  EventCategoryType,
  InvitationThemePresetId,
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
  checkCloudStateUpdatedAt,
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

function mergeGuestCheckInStatus(
  remoteGuests: WeddingGuest[],
  localGuests: WeddingGuest[]
): WeddingGuest[] {
  const safeRemote = Array.isArray(remoteGuests) ? [...remoteGuests] : [];
  const safeLocal = Array.isArray(localGuests) ? localGuests : [];
  for (const lg of safeLocal) {
    if (lg.attendanceStatus !== 'Hadir di Lokasi') continue;
    const idx = safeRemote.findIndex(
      (rg) =>
        rg.id === lg.id ||
        (rg.invitationCode &&
          lg.invitationCode &&
          rg.invitationCode.toLowerCase() === lg.invitationCode.toLowerCase()) ||
        rg.guestName.trim().toLowerCase() === lg.guestName.trim().toLowerCase()
    );
    if (idx >= 0) {
      if (safeRemote[idx].attendanceStatus !== 'Hadir di Lokasi') {
        safeRemote[idx] = {
          ...safeRemote[idx],
          rsvpStatus: 'Hadir',
          attendanceStatus: 'Hadir di Lokasi',
          confirmedPax:
            lg.confirmedPax ||
            safeRemote[idx].confirmedPax ||
            safeRemote[idx].pax ||
            2,
          updatedAt: lg.updatedAt || safeRemote[idx].updatedAt,
          updatedBy: lg.updatedBy || 'QR Scan Check-In',
        };
      }
    } else if (lg.id.startsWith('guest_qr_')) {
      safeRemote.push(lg);
    }
  }
  return safeRemote;
}

function mergePreservingLocalMedia(
  serverState: WeddingDatabaseSchema,
  localState: WeddingDatabaseSchema
): WeddingDatabaseSchema {
  const localOriginalPhotos = localState.settings?.originalPhotos;
  const mergedRootGuests = mergeGuestCheckInStatus(
    Array.isArray(serverState.guests) ? serverState.guests : [],
    Array.isArray(localState.guests) ? localState.guests : []
  );

  const remoteWorkspaces = { ...(serverState.settings?.clientWorkspaces || {}) };
  const localWorkspaces = localState.settings?.clientWorkspaces || {};
  for (const [wsId, localWs] of Object.entries(localWorkspaces)) {
    if (!localWs) continue;
    const remoteWs = remoteWorkspaces[wsId];
    if (remoteWs) {
      remoteWorkspaces[wsId] = {
        ...remoteWs,
        guests: mergeGuestCheckInStatus(
          remoteWs.guests || [],
          localWs.guests || []
        ),
      };
    } else {
      remoteWorkspaces[wsId] = localWs;
    }
  }

  return {
    ...serverState,
    guests: mergedRootGuests,
    wishes: Array.isArray(serverState.wishes) ? serverState.wishes : [],
    tasks: Array.isArray(serverState.tasks) ? serverState.tasks : [],
    budgetItems: Array.isArray(serverState.budgetItems)
      ? serverState.budgetItems
      : [],
    settings: {
      ...serverState.settings,
      clientWorkspaces: remoteWorkspaces,
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

function isSuperadminUser(u?: AdminUser | null): boolean {
  if (!u) return false;
  const lowerUser = (u.username || '').trim().toLowerCase();
  const lowerEmail = (u.email || '').trim().toLowerCase();
  return (
    u.role === 'SUPERADMIN' ||
    lowerUser === 'superadmin' ||
    lowerUser === 'omeko42' ||
    lowerUser === 'agungkrisdianto98@gmail.com' ||
    lowerUser === 'e98.bisnis@gmail.com' ||
    lowerEmail === 'agungkrisdianto98@gmail.com' ||
    lowerEmail === 'e98.bisnis@gmail.com'
  );
}

function buildEffectiveClientGroups(state: WeddingDatabaseSchema): ClientGroupItem[] {
  const demoGroup: ClientGroupItem = {
    id: 'client-demo',
    clientCode: 'DEMO',
    clientName: 'Klien Demo • Rayhan & Clarissa',
    coupleLabel: 'Rayhan & Clarissa',
    packageTier: 'ROYAL_VIP',
    status: 'ACTIVE',
    eventDate: '2026-10-24',
    notes: 'Ruang Kerja Demo Bawaan Superadmin',
    createdAt: '2026-10-18T00:00:00.000Z',
  };
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
  map.set(demoGroup.id, demoGroup);
  map.set(baseGroup.id, baseGroup);
  for (const g of configured) {
    if (g && g.id) {
      map.set(
        g.id,
        g.id === 'client-demo'
          ? {
              ...demoGroup,
              ...g,
              clientName: demoGroup.clientName,
              coupleLabel: demoGroup.coupleLabel,
            }
          : g.id === 'client-utama'
            ? {
                ...baseGroup,
                ...g,
                clientName: baseGroup.clientName,
                coupleLabel: baseGroup.coupleLabel,
              }
            : g
      );
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
  if (clean === 'demo' || clean === 'client-demo') {
    return 'client-demo';
  }
  const dummyResolved = resolveShowcaseDummyClientId(rawParam);
  if (dummyResolved) return dummyResolved;

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
  if (clientId === 'client-demo') {
    const demoState = getShowcaseDummyClientState('client-demo-wedding', 'ROYAL VIP');
    return {
      clientId: 'client-demo',
      settings: {
        ...demoState.settings,
        activeClientId: 'client-demo',
      },
      tasks: demoState.tasks,
      guests: demoState.guests,
      wishes: demoState.wishes,
      budgetItems: demoState.budgetItems,
      updatedAt: demoState.lastSyncedAt || new Date().toISOString(),
    };
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
  const urlCheckinParam = searchParams.get('checkin') || '';
  const hasInitialGuestOrClientUrl = Boolean(
    rawUrlGuestCode || urlClientParam || rawUrlGuestTo || urlCheckinParam
  );

  const [isUrlGuestSessionCleared, setIsUrlGuestSessionCleared] =
    useState(false);
  const urlGuestTo = isUrlGuestSessionCleared ? '' : rawUrlGuestTo;
  const urlGuestCode = isUrlGuestSessionCleared ? '' : rawUrlGuestCode;

  const [state, setState] = useState<WeddingDatabaseSchema>(() =>
    getInitialClientState()
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(() => {
    const stored = getStoredAdminUser();
    if (!stored) return null;
    if (
      isSuperadminUser(stored) &&
      (!stored.clientId || stored.clientId === 'client-utama')
    ) {
      return {
        ...stored,
        role: 'SUPERADMIN',
        clientId: 'client-demo',
        clientName: 'Klien Demo • Rayhan & Clarissa',
      };
    }
    return stored;
  });
  const [viewMode, setViewMode] = useState<'PUBLIC' | 'ADMIN'>(() => {
    if (hasInitialGuestOrClientUrl && urlMode !== 'admin') return 'PUBLIC';
    const storedMode = getStoredViewMode();
    const storedUser = getStoredAdminUser();
    if (storedUser && storedMode === 'ADMIN') return 'ADMIN';
    return 'PUBLIC';
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginLang, setLoginLang] = useState<'ID' | 'EN'>('ID');
  const [authModalMode, setAuthModalMode] = useState<
    'SIGN_IN' | 'ACCESS_CODE' | 'REGISTER' | 'GOOGLE_CHOOSER'
  >('SIGN_IN');
  const [showCustomGoogleInput, setShowCustomGoogleInput] = useState(false);
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [registerPasswordInput, setRegisterPasswordInput] = useState('');
  const [isGmailExpanded, setIsGmailExpanded] = useState(false);
  const [gmailAddressInput, setGmailAddressInput] = useState('');
  const [gmailEventTitleInput, setGmailEventTitleInput] = useState('');
  const [gmailEventTypeInput, setGmailEventTypeInput] =
    useState<EventCategoryType>('WEDDING');
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
  const [demoSelectedThemeId, setDemoSelectedThemeId] = useState<
    string | undefined
  >(undefined);
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
      if (isSuperadminUser(storedUser)) {
        return storedUser?.clientId &&
          storedUser.clientId !== 'client-utama' &&
          storedUser.clientId !== 'client-gmail-agungkrisdiant'
          ? storedUser.clientId
          : 'client-demo';
      }
      return storedUser?.clientId || 'client-utama';
    });

  const activeWorkspaceClientId = useMemo(() => {
    if (!isSuperadminUser(adminUser)) {
      return adminUser?.clientId || 'client-utama';
    }
    return selectedAdminWorkspaceId === 'client-gmail-agungkrisdiant'
      ? 'client-demo'
      : selectedAdminWorkspaceId || 'client-demo';
  }, [adminUser, selectedAdminWorkspaceId]);

  const resolveExactKeyAcrossWorkspaces = useCallback(
    (rawKey: string) => {
      const k = rawKey.trim();
      if (!k) return null;
      const hashMatch = resolveGuestByHashTokenAcrossWorkspaces(
        k,
        allWorkspacesForHashLookup
      );
      if (hashMatch && hashMatch.hashToken === k) {
        return hashMatch;
      }
      const kUpper = k.toUpperCase();
      for (const ws of allWorkspacesForHashLookup) {
        for (const g of ws.guests || []) {
          const explicitToken = g.invitationToken?.trim();
          const invCode = g.invitationCode?.trim();
          if (
            (explicitToken && explicitToken === k) ||
            (invCode && invCode.toUpperCase() === kUpper)
          ) {
            return {
              clientId: ws.clientId,
              clientLabel: ws.clientLabel,
              guest: g,
              hashToken: computeGuestInvitationHash(ws.clientId, g),
            };
          }
        }
      }
      return hashMatch;
    },
    [allWorkspacesForHashLookup]
  );

  // Public view routing: null = show Commercial Landing Page (/); string = show PublicInvitationView for that clientId
  const [publicSelectedClientId, setPublicSelectedClientId] = useState<
    string | null
  >(() => {
    if (urlGuestCode) {
      const resolvedKey = resolveGuestByHashTokenAcrossWorkspaces(
        urlGuestCode,
        allWorkspacesForHashLookup
      );
      if (resolvedKey) {
        return resolvedKey.clientId;
      }
    }
    if (urlClientParam || urlGuestTo) {
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
      const resolvedKey = resolveGuestByHashTokenAcrossWorkspaces(
        urlGuestCode,
        allWorkspacesForHashLookup
      );
      if (resolvedKey) {
        return {
          to: resolvedKey.guest.guestName,
          code: resolvedKey.hashToken,
        };
      }
    }
    return {};
  });

  useEffect(() => {
    if (urlGuestCode) {
      const resolvedKey = resolveExactKeyAcrossWorkspaces(urlGuestCode);
      if (resolvedKey) {
        setPublicSelectedClientId(resolvedKey.clientId);
        setManualGuestLookup({
          to: resolvedKey.guest.guestName,
          code: resolvedKey.hashToken,
        });
        return;
      }
    }
    if (urlClientParam || urlGuestTo) {
      const resolved = urlClientParam
        ? resolveClientIdFromParam(urlClientParam, clientGroups)
        : 'client-utama';
      setPublicSelectedClientId(resolved);
    }
  }, [
    urlClientParam,
    urlGuestTo,
    urlGuestCode,
    urlCheckinParam,
    clientGroups,
    resolveExactKeyAcrossWorkspaces,
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
          } else {
            setAdminUser(cachedUser);
            if (
              isSuperadminUser(cachedUser) &&
              (selectedAdminWorkspaceId === 'client-gmail-agungkrisdiant' ||
                selectedAdminWorkspaceId === 'client-utama')
            ) {
              setSelectedAdminWorkspaceId('client-demo');
            }
          }
          return;
        }
        const authData = await res.json();
        if (authData.authenticated && authData.user) {
          const isSuper = isSuperadminUser(authData.user);
          const resolvedDefaultWs = isSuper
            ? authData.user.clientId && authData.user.clientId !== 'client-utama'
              ? authData.user.clientId
              : 'client-demo'
            : authData.user.clientId || 'client-utama';
          const normalizedUser: AdminUser = isSuper
            ? {
                ...authData.user,
                role: 'SUPERADMIN',
                clientId: resolvedDefaultWs,
                clientName:
                  resolvedDefaultWs === 'client-demo'
                    ? 'Klien Demo • Rayhan & Clarissa'
                    : authData.user.clientName,
              }
            : authData.user;
          setAdminUser(normalizedUser);
          saveStoredAdminUser(normalizedUser);
          setSelectedAdminWorkspaceId(resolvedDefaultWs);
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
  const lastReconcileCheckMsRef = useRef(0);

  useEffect(() => {
    const handleReconnectOrVisible = async () => {
      if (!isCloudHydratedRef.current) return;
      if (
        typeof document !== 'undefined' &&
        document.visibilityState === 'hidden'
      ) {
        return;
      }

      const nowMs = Date.now();
      if (nowMs - lastReconcileCheckMsRef.current < 15000) {
        return;
      }
      lastReconcileCheckMsRef.current = nowMs;

      const currentStatus = getCloudSyncStatus().status;
      if (currentStatus === 'OFFLINE') {
        void saveStateToSupabase(state);
        return;
      }

      if (currentStatus === 'SYNCED' && !isReconcilingRef.current) {
        isReconcilingRef.current = true;
        try {
          // 1. Lightweight 45-byte check: only download JSON if `updated_at` on Supabase is newer
          const remoteUpdatedAt = await checkCloudStateUpdatedAt();
          const localSyncMs = new Date(state.lastSyncedAt || 0).getTime() || 0;
          const remoteSyncMs = remoteUpdatedAt
            ? new Date(remoteUpdatedAt).getTime() || 0
            : 0;
          if (!remoteUpdatedAt || remoteSyncMs <= localSyncMs + 500) {
            return;
          }

          // 2. Full fetch ONLY when another device actually saved newer data
          const cloudRes = await loadStateFromSupabase();
          if (cloudRes.state) {
            const remote = cloudRes.state;
            setState((prev) => {
              const merged = mergePreservingLocalMedia(remote, prev);
              const prevCheckedInCount = prev.guests.filter(
                (g) => g.attendanceStatus === 'Hadir di Lokasi'
              ).length;
              const mergedCheckedInCount = merged.guests.filter(
                (g) => g.attendanceStatus === 'Hadir di Lokasi'
              ).length;
              const hasChanged =
                merged.guests.length !== prev.guests.length ||
                mergedCheckedInCount !== prevCheckedInCount ||
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
    }, 10000);

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

        if (
          res.status === 401 &&
          action !== 'SUBMIT_RSVP' &&
          action !== 'PUBLIC_CHECKIN_QR'
        ) {
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
          demoPackageTier,
          demoSelectedThemeId
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
    [demoPackageTier, demoSelectedThemeId]
  );

  const handleOpenDemoManager = useCallback(
    (
      dummyClientId: string,
      tier?: ShowcasePackageTier,
      catalogThemeId?: string
    ) => {
      weddingMusicPlayer.stop();
      const resolvedDummyId =
        resolveShowcaseDummyClientId(dummyClientId) || dummyClientId;
      if (tier) setDemoPackageTier(tier);
      if (catalogThemeId !== undefined) {
        setDemoSelectedThemeId(catalogThemeId);
      } else if (!SHOWCASE_DUMMY_CLIENT_METAS.some((m) => m.id === dummyClientId || m.slug === dummyClientId)) {
        setDemoSelectedThemeId(dummyClientId);
      }
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
      handleOpenDemoManager(
        publicSelectedClientId,
        demoPackageTier,
        demoSelectedThemeId
      );
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
      setAuthModalMode('SIGN_IN');
      setShowCustomGoogleInput(false);
      setLoginErrorMsg('');
      setIsLoginModalOpen(true);
    }
  };

  useEffect(() => {
    if (isLoginModalOpen) {
      setAuthModalMode('SIGN_IN');
      setShowCustomGoogleInput(false);
      setLoginErrorMsg('');
    }
  }, [isLoginModalOpen]);

  useEffect(() => {
    if (!loginWelcomeToast) return;
    const t = window.setTimeout(() => setLoginWelcomeToast(null), 4500);
    return () => window.clearTimeout(t);
  }, [loginWelcomeToast]);

  const handleLoginSuccess = (user: AdminUser, welcomeToastText?: string) => {
    const resolvedWs = isSuperadminUser(user)
      ? user.clientId && user.clientId !== 'client-utama'
        ? user.clientId
        : 'client-demo'
      : user.clientId || 'client-utama';
    const normalizedUser: AdminUser = isSuperadminUser(user)
      ? {
          ...user,
          clientId: resolvedWs,
          clientName:
            user.clientName && user.clientId !== 'client-utama'
              ? user.clientName
              : 'Klien Demo • Rayhan & Clarissa',
        }
      : user;
    setAdminUser(normalizedUser);
    saveStoredAdminUser(normalizedUser);
    void fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'SYNC_SESSION', user: normalizedUser }),
    }).catch(() => {});
    setSelectedAdminWorkspaceId(resolvedWs);
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

  const handleQuickCreateWithGoogle = useCallback(
    async (payload: {
      email: string;
      displayName?: string;
      eventTitle?: string;
      eventType?: EventCategoryType;
      packageId:
        | 'GRATIS'
        | 'PREMIUM'
        | 'BUSINESS'
        | 'ENTERPRISE'
        | 'MITRA_SILVER'
        | 'MITRA_GOLD';
      catalogThemeId?: string;
      catalogThemeName?: string;
      themePreset?: InvitationThemePresetId;
      themeLayoutArchetype?:
        | 'EDITORIAL_CLASSIC'
        | 'POLAROID_MAGAZINE'
        | 'BOTANICAL_AIRY'
        | 'NUSANTARA_HERITAGE'
        | 'MODERN_BENTO';
      coverImageUrl?: string;
      heroImageUrl?: string;
      isOAuthVerified?: boolean;
    }) => {
      weddingMusicPlayer.stop();
      const rawEmail = payload.email.trim().toLowerCase();
      const email = rawEmail.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;
      const localPart = email.split('@')[0] || 'planner';

      const isOwnerAccount =
        email === 'agungkrisdianto98@gmail.com' ||
        email === 'e98.bisnis@gmail.com' ||
        email === 'omeko42@gmail.com' ||
        rawEmail === 'agungkrisdianto98' ||
        rawEmail === 'omeko42' ||
        localPart === 'agungkrisdianto98' ||
        localPart === 'omeko42' ||
        localPart === 'e98.bisnis';

      const matchedCoSuperadmin = (state.adminUsers || []).find(
        (u) =>
          u.role === 'SUPERADMIN' &&
          ((u.email && u.email.trim().toLowerCase() === email) ||
            u.username.trim().toLowerCase() === rawEmail ||
            u.username.trim().toLowerCase() === localPart)
      );

      if (isOwnerAccount || matchedCoSuperadmin) {
        if (payload.isOAuthVerified) {
          const superUser: AdminUser = matchedCoSuperadmin
            ? {
                ...matchedCoSuperadmin,
                role: 'SUPERADMIN',
                clientId: 'client-demo',
                clientName: 'Klien Demo • Rayhan & Clarissa',
              }
            : {
                id: 'superadmin-owner',
                username: 'superadmin',
                nama: 'Eko Agung Krisdianto (Superadmin)',
                role: 'SUPERADMIN',
                jabatan: 'Superadmin • Pemilik Sistem (omeko42)',
                email:
                  email === 'e98.bisnis@gmail.com'
                    ? 'e98.bisnis@gmail.com'
                    : 'agungkrisdianto98@gmail.com',
                isDefaultUser: true,
                clientId: 'client-demo',
                clientName: 'Klien Demo • Rayhan & Clarissa',
              };
          handleLoginSuccess(
            superUser,
            loginLang === 'EN'
              ? `Welcome back, ${superUser.nama}! Verified via Google OAuth.`
              : `Selamat datang kembali, ${superUser.nama}! Terverifikasi via Google OAuth.`
          );
          return;
        }
        setIsLoginModalOpen(true);
        setAuthModalMode('SIGN_IN');
        setLoginIdentifier(email);
        setLoginErrorMsg(
          loginLang === 'EN'
            ? 'Superadmin / Developer account detected. Please enter your password to verify access.'
            : 'Akun Superadmin / Developer terdeteksi. Silakan masukkan kata sandi Anda untuk verifikasi akses.'
        );
        return;
      }

      const cleanSlug =
        email.replace(/[^a-z0-9]/g, '').slice(0, 14) || 'planner';
      const clientId = `client-gmail-${cleanSlug}`;

      const mappedTier: 'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP' =
        payload.packageId === 'GRATIS'
          ? 'STARTER'
          : payload.packageId === 'PREMIUM' || payload.packageId === 'BUSINESS'
            ? 'EXCLUSIVE'
            : 'ROYAL VIP';
      const groupTier: ClientGroupItem['packageTier'] =
        mappedTier === 'ROYAL VIP' ? 'ROYAL_VIP' : mappedTier;
      const storageQuotaMb =
        payload.packageId === 'GRATIS'
          ? 50
          : payload.packageId === 'PREMIUM' || payload.packageId === 'BUSINESS'
            ? 500
            : 2048;

      const effectiveEventType: EventCategoryType =
        payload.eventType || 'WEDDING';
      const dummyIdForEvent =
        effectiveEventType === 'BIRTHDAY'
          ? 'client-demo-birthday'
          : effectiveEventType === 'GRADUATION'
            ? 'client-demo-graduation'
            : effectiveEventType === 'MEETING'
              ? 'client-demo-meeting'
              : effectiveEventType === 'GALA_DINNER'
                ? 'client-demo-gala'
                : 'client-demo-wedding';

      const baseTemplate = getShowcaseDummyClientState(
        dummyIdForEvent,
        mappedTier,
        payload.catalogThemeId || demoSelectedThemeId
      );

      const formattedDisplayName =
        payload.displayName?.trim() ||
        localPart
          .replace(/[._-]+/g, ' ')
          .replace(/\b\w/g, (c) => c.toUpperCase())
          .trim() ||
        'Planner Host';

      const cleanEventTitle = payload.eventTitle?.trim() || '';
      const effectiveCoupleLabel =
        cleanEventTitle ||
        (effectiveEventType === 'WEDDING'
          ? `${formattedDisplayName} & Partner`
          : formattedDisplayName);

      let profileOverrides: Partial<WeddingSettings> = {};
      if (cleanEventTitle) {
        if (cleanEventTitle.includes('&')) {
          const parts = cleanEventTitle.split('&').map((p) => p.trim());
          const p1 = parts[0] || formattedDisplayName;
          const p2 = parts[1] || 'Partner';
          profileOverrides = {
            groomFullName: p1,
            groomNickname: p1.split(' ')[0] || p1,
            brideFullName: p2,
            brideNickname: p2.split(' ')[0] || p2,
            showSecondProfile: true,
          };
        } else {
          profileOverrides = {
            groomFullName: cleanEventTitle,
            groomNickname: cleanEventTitle.split(' ')[0] || cleanEventTitle,
            showSecondProfile: false,
          };
        }
      }

      const nowIso = new Date().toISOString();
      const customizedSettings: WeddingSettings & Record<string, unknown> = {
        ...baseTemplate.settings,
        ...profileOverrides,
        siteTitle: 'MEPlanner — My Event Planner',
        activeClientId: clientId,
        eventType: effectiveEventType,
        storageQuotaLimitMb: storageQuotaMb,
        subscriptionPackageId: payload.packageId,
        ownerGoogleEmail: email,
        selectedCatalogThemeId: payload.catalogThemeId || demoSelectedThemeId,
        selectedCatalogThemeName: payload.catalogThemeName,
        ...(payload.themePreset ? { themePreset: payload.themePreset } : {}),
        ...(payload.themeLayoutArchetype
          ? {
              themeLayoutArchetype: payload.themeLayoutArchetype,
              layoutArchetype: payload.themeLayoutArchetype,
              showFloralOrnaments:
                payload.themeLayoutArchetype === 'BOTANICAL_AIRY',
            }
          : {}),
        ...(payload.coverImageUrl
          ? {
              coverBgUrl: payload.coverImageUrl,
              coverSlides: [
                {
                  id: 'g-cov-1',
                  imageUrl: payload.coverImageUrl,
                  title: payload.catalogThemeName || 'Cover',
                },
              ],
            }
          : {}),
        ...(payload.heroImageUrl
          ? {
              heroPrewedUrl: payload.heroImageUrl,
              heroSlides: [
                {
                  id: 'g-her-1',
                  imageUrl: payload.heroImageUrl,
                  title: payload.catalogThemeName || 'Hero',
                },
              ],
            }
          : {}),
        updatedAt: nowIso,
        updatedBy: email,
      };
      delete customizedSettings.clientWorkspaces;

      const newGroup: ClientGroupItem = {
        id: clientId,
        clientCode: cleanSlug.toUpperCase().slice(0, 12),
        clientName: `Client (${payload.packageId}) • ${effectiveCoupleLabel}`,
        coupleLabel: effectiveCoupleLabel,
        packageTier: groupTier,
        status: 'ACTIVE',
        eventType: effectiveEventType,
        notes: `Google Workspace (${email}) • Paket ${payload.packageId} • Quota ${storageQuotaMb}MB`,
        createdAt: nowIso,
      };

      const nextWorkspace: ClientWorkspaceData = {
        clientId,
        settings: customizedSettings,
        tasks: baseTemplate.tasks,
        guests: baseTemplate.guests,
        wishes: baseTemplate.wishes,
        budgetItems: baseTemplate.budgetItems,
        updatedAt: nowIso,
      };

      const sessionUser: AdminUser = {
        id: `usr-gmail-${cleanSlug}`,
        username: email,
        nama: `${formattedDisplayName} (${payload.packageId})`,
        role: 'MEMPELAI_PRIA',
        jabatan: `Paket ${payload.packageId} • ${effectiveEventType}`,
        email,
        clientId,
        clientName: newGroup.clientName,
      };

      let savedRootState: WeddingDatabaseSchema | null = null;
      setState((prevRoot) => {
        const existingGroups = Array.isArray(prevRoot.settings.clientGroups)
          ? [...prevRoot.settings.clientGroups]
          : [];
        const existingGroupIdx = existingGroups.findIndex(
          (g) => g.id === clientId
        );
        if (existingGroupIdx >= 0) {
          existingGroups[existingGroupIdx] = {
            ...existingGroups[existingGroupIdx],
            ...newGroup,
          };
        } else {
          existingGroups.push(newGroup);
        }

        const existingWorkspace = prevRoot.settings.clientWorkspaces?.[clientId];
        const mergedWorkspace: ClientWorkspaceData =
          existingWorkspace && !cleanEventTitle && !payload.catalogThemeId
            ? {
                ...existingWorkspace,
                settings: {
                  ...existingWorkspace.settings,
                  subscriptionPackageId: payload.packageId,
                  ownerGoogleEmail: email,
                  storageQuotaLimitMb: storageQuotaMb,
                  updatedAt: nowIso,
                } as WeddingSettings,
                updatedAt: nowIso,
              }
            : nextWorkspace;

        const existingUsers = Array.isArray(prevRoot.adminUsers)
          ? [...prevRoot.adminUsers]
          : [];
        const userIdx = existingUsers.findIndex(
          (u) => u.id === sessionUser.id || u.username === email
        );
        if (userIdx >= 0) {
          existingUsers[userIdx] = { ...existingUsers[userIdx], ...sessionUser };
        } else {
          existingUsers.push(sessionUser);
        }

        const nextRoot: WeddingDatabaseSchema = {
          ...prevRoot,
          adminUsers: existingUsers,
          settings: {
            ...prevRoot.settings,
            activeClientId: clientId,
            clientGroups: existingGroups,
            clientWorkspaces: {
              ...(prevRoot.settings.clientWorkspaces || {}),
              [clientId]: mergedWorkspace,
            },
            updatedAt: nowIso,
          },
          lastSyncedAt: nowIso,
        };
        const saved = saveClientState(nextRoot, true);
        savedRootState = saved;
        return saved;
      });

      if (savedRootState) {
        void saveStateToSupabase(savedRootState);
      }

      setSelectedAdminWorkspaceId(clientId);
      setAdminUser(sessionUser);
      saveStoredAdminUser(sessionUser);
      setIsUrlGuestSessionCleared(true);
      setPreviewOverrideGuest(null);
      setManualGuestLookup({});
      setDemoManagerClientId(null);
      setPublicSelectedClientId(clientId);
      setIsLoginModalOpen(false);
      setLoginErrorMsg('');
      setLoginWelcomeToast(
        loginLang === 'EN'
          ? `Workspace "${effectiveCoupleLabel}" (${payload.packageId}) created! Welcome to Management.`
          : `Workspace "${effectiveCoupleLabel}" (Paket ${payload.packageId}) berhasil dibuat! Selamat datang di Management.`
      );
      if (typeof window !== 'undefined') {
        window.history.replaceState({}, '', '/');
      }
      changeViewMode('ADMIN');
    },
    [
      state.settings.groomNickname,
      state.settings.brideNickname,
      demoSelectedThemeId,
      loginLang,
      changeViewMode,
    ]
  );

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
      normalizedEmail === 'agungkrisdianto98@gmail.com' ||
      normalizedEmail === 'e98.bisnis@gmail.com' ||
      normalizedEmail === 'omeko42@gmail.com' ||
      raw === 'agungkrisdianto98' ||
      raw === 'omeko42' ||
      localPart === 'agungkrisdianto98' ||
      localPart === 'omeko42' ||
      localPart === 'e98.bisnis';

    const matchedCoSuperadmin = (state.adminUsers || []).find(
      (u) =>
        u.role === 'SUPERADMIN' &&
        ((u.email && u.email.trim().toLowerCase() === normalizedEmail) ||
          u.username.trim().toLowerCase() === raw ||
          u.username.trim().toLowerCase() === localPart)
    );

    if (isOwnerAccount || matchedCoSuperadmin) {
      setGmailAddressInput('');
      setGmailEventTitleInput('');
      setIsGmailExpanded(false);
      setAuthModalMode('SIGN_IN');
      setLoginIdentifier(normalizedEmail);
      setLoginErrorMsg(
        loginLang === 'EN'
          ? 'Superadmin / Developer account detected. Please enter your password to verify access.'
          : 'Akun Superadmin / Developer terdeteksi. Silakan masukkan kata sandi Anda untuk verifikasi akses.'
      );
      return;
    }

    const titleToUse = gmailEventTitleInput.trim();
    setGmailAddressInput('');
    setGmailEventTitleInput('');
    setIsGmailExpanded(false);
    void handleQuickCreateWithGoogle({
      email: normalizedEmail,
      eventTitle: titleToUse || undefined,
      eventType: gmailEventTypeInput,
      packageId: 'GRATIS',
      catalogThemeId: demoSelectedThemeId,
    });
  };

  const handlePlannerCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg('');
    const cleanId = loginIdentifier.trim();
    if (!cleanId || !loginPassword) {
      setLoginErrorMsg(
        loginLang === 'EN'
          ? 'Please enter both email/username and password.'
          : 'Mohon isi email/username dan kata sandi Anda.'
      );
      return;
    }

    const lowerId = cleanId.toLowerCase();
    const isProtectedSuperadmin =
      lowerId === 'agungkrisdianto98@gmail.com' ||
      lowerId === 'e98.bisnis@gmail.com' ||
      lowerId === 'omeko42@gmail.com' ||
      lowerId === 'agungkrisdianto98' ||
      lowerId === 'omeko42' ||
      lowerId === 'superadmin' ||
      (state.adminUsers || []).some(
        (u) =>
          u.role === 'SUPERADMIN' &&
          (u.username.toLowerCase() === lowerId ||
            (u.email && u.email.toLowerCase() === lowerId))
      );

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
      if (res.ok && json.success && json.user) {
        setLoginIdentifier('');
        setLoginPassword('');
        handleLoginSuccess(json.user as AdminUser);
        return;
      }

      // Never allow Superadmin accounts to bypass password verification
      if (!isProtectedSuperadmin && lowerId.endsWith('@gmail.com')) {
        setLoginIdentifier('');
        setLoginPassword('');
        handleGmailLoginSubmit(undefined, cleanId);
        return;
      }

      setLoginErrorMsg(
        json.error ||
          (loginLang === 'EN'
            ? 'Invalid email/username or password.'
            : 'Email/username atau kata sandi belum sesuai.')
      );
    } catch {
      if (!isProtectedSuperadmin && lowerId.endsWith('@gmail.com')) {
        setLoginIdentifier('');
        setLoginPassword('');
        handleGmailLoginSubmit(undefined, cleanId);
        return;
      }
      setLoginErrorMsg(
        loginLang === 'EN'
          ? 'Unable to reach authentication server. Please check your connection or use Google Sign-In.'
          : 'Gagal menghubungi server otentikasi. Periksa koneksi Anda atau gunakan Masuk dengan Google.'
      );
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleAccessCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg('');
    const code = accessCodeInput.trim();
    if (!code) {
      setLoginErrorMsg(
        loginLang === 'ID'
          ? 'Silakan masukkan kode akses undangan atau workspace.'
          : 'Please enter an invitation or workspace access code.'
      );
      return;
    }

    const lower = code.toLowerCase();
    if (
      lower === 'omeko42' ||
      lower === 'e98.bisnis@gmail.com' ||
      lower === 'agungkrisdianto98@gmail.com'
    ) {
      setAccessCodeInput('');
      setAuthModalMode('SIGN_IN');
      setLoginIdentifier(lower);
      setLoginErrorMsg(
        loginLang === 'ID'
          ? 'Akun Pemilik Sistem terdeteksi. Silakan masukkan kata sandi Anda untuk verifikasi.'
          : 'System Owner account detected. Please enter your password to verify.'
      );
      return;
    }

    const keyMatch = resolveExactKeyAcrossWorkspaces(code);
    if (keyMatch) {
      setAccessCodeInput('');
      setIsLoginModalOpen(false);
      handleSelectClientInvitationFromLanding(
        keyMatch.clientId,
        keyMatch.guest.guestName,
        keyMatch.hashToken
      );
      return;
    }

    const dummyMeta = SHOWCASE_DUMMY_CLIENT_METAS.find(
      (m) =>
        m.id.toLowerCase() === lower ||
        m.slug.toLowerCase() === lower
    );
    if (dummyMeta) {
      setAccessCodeInput('');
      setIsLoginModalOpen(false);
      handleOpenDemoManager(
        dummyMeta.id,
        demoPackageTier,
        demoSelectedThemeId
      );
      return;
    }

    const matchedGroup = clientGroups.find(
      (g) =>
        g.id.toLowerCase() === lower ||
        g.clientCode.toLowerCase() === lower
    );
    if (matchedGroup) {
      setAccessCodeInput('');
      const wsUser: AdminUser = {
        id: `usr-code-${matchedGroup.id}`,
        username: matchedGroup.clientCode.toLowerCase(),
        nama: matchedGroup.coupleLabel || matchedGroup.clientName,
        role: 'MEMPELAI_PRIA',
        jabatan: `Workspace • ${matchedGroup.packageTier}`,
        email: `${matchedGroup.clientCode.toLowerCase()}@meplanner.id`,
        clientId: matchedGroup.id,
        clientName: matchedGroup.clientName,
      };
      handleLoginSuccess(wsUser);
      return;
    }

    setLoginErrorMsg(
      loginLang === 'ID'
        ? 'Kode akses tidak ditemukan. Pastikan kode akses 21 karakter atau kode workspace sesuai.'
        : 'Access code not found. Please check your 21-character invitation key or workspace code.'
    );
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrorMsg('');
    const rawEmail = gmailAddressInput.trim().toLowerCase();
    const rawTitle = gmailEventTitleInput.trim();
    if (!rawEmail) {
      setLoginErrorMsg(
        loginLang === 'ID'
          ? 'Mohon isi alamat Email Anda.'
          : 'Please enter your Email address.'
      );
      return;
    }
    const normalizedEmail = rawEmail.includes('@')
      ? rawEmail
      : `${rawEmail}@gmail.com`;
    setGmailAddressInput('');
    setGmailEventTitleInput('');
    setRegisterPasswordInput('');
    void handleQuickCreateWithGoogle({
      email: normalizedEmail,
      displayName: rawTitle || undefined,
      eventTitle: rawTitle || undefined,
      eventType: gmailEventTypeInput,
      packageId: 'GRATIS',
      catalogThemeId: demoSelectedThemeId,
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
        demoPackageTier,
        demoSelectedThemeId
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
    demoSelectedThemeId,
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
    const existingGuest = guest.id
      ? activeAdminState.guests.find((g) => g.id === guest.id)
      : undefined;
    const isEdit = Boolean(existingGuest);
    const maxCodeNum = activeAdminState.guests.reduce((max, g) => {
      const m = /INV-(\d+)/i.exec(g.invitationCode || '');
      const num = m ? parseInt(m[1], 10) : 0;
      return num > max ? num : max;
    }, activeAdminState.guests.length);
    const resolvedInvitationCode =
      guest.invitationCode ||
      existingGuest?.invitationCode ||
      `INV-${String(maxCodeNum + 1).padStart(4, '0')}`;
    const resolvedInvitationToken =
      guest.invitationToken ||
      existingGuest?.invitationToken ||
      computeGuestInvitationHash(activeWorkspaceClientId, {
        id: targetId,
        invitationCode: resolvedInvitationCode,
        guestName: guest.guestName,
      });

    updateClientScopedState(activeWorkspaceClientId, (prev) => {
      const exists = guest.id && prev.guests.some((g) => g.id === guest.id);
      const nextGuests = exists
        ? prev.guests.map((g) =>
            g.id === guest.id
              ? ({
                  ...g,
                  ...guest,
                  invitationCode: g.invitationCode || resolvedInvitationCode,
                  invitationToken: g.invitationToken || resolvedInvitationToken,
                } as WeddingGuest)
              : g
          )
        : [
            ...prev.guests,
            {
              id: targetId,
              invitationCode: resolvedInvitationCode,
              invitationToken: resolvedInvitationToken,
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
      await mutateServer('UPSERT_GUEST', {
        ...guest,
        id: targetId,
        invitationCode: resolvedInvitationCode,
        invitationToken: resolvedInvitationToken,
      });
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

  const handlePublicGuestCheckIn = async (payload: {
    guestId?: string;
    invitationCode?: string;
    hashToken?: string;
    guestName?: string;
    pax?: number;
  }): Promise<WeddingGuest> => {
    const cleanName = (payload.guestName || '').trim() || 'Tamu Kehormatan';
    const cleanCode = (payload.invitationCode || '').trim().toLowerCase();
    const cleanHash = (payload.hashToken || '').trim().toLowerCase();
    const nowDate = new Date().toISOString().slice(0, 10);

    let resolvedGuest: WeddingGuest | null = null;

    const applyCheckInUpdate = (
      prev: WeddingDatabaseSchema
    ): WeddingDatabaseSchema => {
      const nextGuests = [...prev.guests];
      let targetIdx = -1;

      if (payload.guestId) {
        targetIdx = nextGuests.findIndex((g) => g.id === payload.guestId);
      }
      if (targetIdx < 0 && cleanHash) {
        targetIdx = nextGuests.findIndex(
          (g) =>
            (g.invitationToken || '').trim().toLowerCase() === cleanHash ||
            computeGuestInvitationHash(activePublicClientId, g).toLowerCase() ===
              cleanHash ||
            g.invitationCode.trim().toLowerCase() === cleanHash
        );
      }
      if (targetIdx < 0 && cleanCode) {
        targetIdx = nextGuests.findIndex(
          (g) =>
            g.invitationCode.trim().toLowerCase() === cleanCode ||
            computeGuestInvitationHash(activePublicClientId, g).toLowerCase() ===
              cleanCode
        );
      }
      if (targetIdx < 0 && cleanName) {
        targetIdx = nextGuests.findIndex(
          (g) => g.guestName.trim().toLowerCase() === cleanName.toLowerCase()
        );
      }

      if (targetIdx >= 0) {
        const existing = nextGuests[targetIdx];
        const nextPax =
          Number(payload.pax) || existing.confirmedPax || existing.pax || 2;
        const updated: WeddingGuest = {
          ...existing,
          rsvpStatus: 'Hadir',
          attendanceStatus: 'Hadir di Lokasi',
          confirmedPax: nextPax,
          updatedAt: nowDate,
          updatedBy: 'QR Scan Check-In',
        };
        nextGuests[targetIdx] = updated;
        resolvedGuest = updated;
      } else {
        const created: WeddingGuest = {
          id: `guest_qr_${Date.now().toString(36)}`,
          invitationCode:
            payload.invitationCode ||
            `INV-${String(nextGuests.length + 1).padStart(4, '0')}`,
          guestName: cleanName,
          guestType: 'Teman/Sahabat',
          side: 'Bersama',
          institution: 'Tamu Check-In QR',
          invitationFormat: 'Online',
          priority: 'P2 - Utama',
          cardQty: 0,
          pax: Number(payload.pax) || 2,
          confirmedPax: Number(payload.pax) || 2,
          phone: '',
          address: '',
          deliveryStatus: 'Sudah Diterima',
          rsvpStatus: 'Hadir',
          attendanceStatus: 'Hadir di Lokasi',
          notes: 'Check-In otomatis melalui Scan QR Code Lokasi',
          createdAt: nowDate,
          updatedAt: nowDate,
          updatedBy: 'QR Scan Check-In',
        };
        nextGuests.push(created);
        resolvedGuest = created;
      }

      return {
        ...prev,
        guests: nextGuests,
      };
    };

    markInitialCloudHydrationComplete();

    if (isShowcaseDummyClientId(activePublicClientId)) {
      updateDemoClientState(activePublicClientId, applyCheckInUpdate);
    } else {
      updateClientScopedState(activePublicClientId, applyCheckInUpdate);
    }

    const finalGuest: WeddingGuest = resolvedGuest || {
      id: `guest_qr_${Date.now().toString(36)}`,
      invitationCode: payload.invitationCode || 'INV-QR',
      guestName: cleanName,
      guestType: 'Teman/Sahabat',
      side: 'Bersama',
      institution: 'Tamu Check-In QR',
      invitationFormat: 'Online',
      priority: 'P2 - Utama',
      cardQty: 0,
      pax: Number(payload.pax) || 2,
      confirmedPax: Number(payload.pax) || 2,
      phone: '',
      address: '',
      deliveryStatus: 'Sudah Diterima',
      rsvpStatus: 'Hadir',
      attendanceStatus: 'Hadir di Lokasi',
      notes: 'Check-In otomatis melalui Scan QR Code Lokasi',
      createdAt: nowDate,
      updatedAt: nowDate,
      updatedBy: 'QR Scan Check-In',
    };

    registerLocalItemTouch(finalGuest.id);

    appendAuditLog({
      actor: finalGuest.guestName,
      module: 'TAMU',
      action: 'EDIT',
      status: 'SUCCESS',
      summary: `✓ CHECK-IN QR: "${finalGuest.guestName}" (${finalGuest.invitationCode}) tercatat Hadir di Lokasi`,
      detail: `Kuota: ${finalGuest.confirmedPax || finalGuest.pax || 2} Pax • Prioritas: ${finalGuest.priority}`,
    });

    if (activePublicClientId === 'client-utama') {
      await mutateServer('PUBLIC_CHECKIN_QR', finalGuest);
    }

    return finalGuest;
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
      // Only sync to Supabase Cloud on intentional RSVP/share actions; passive page views stay local to save Egress
      const shouldSyncToCloud =
        payload.type === 'SUBMIT_RSVP' ||
        payload.type === 'SHARE_WA' ||
        payload.type === 'COPY_LINK';

      setState((prevRoot) => {
        if (!activePublicClientId || activePublicClientId === 'client-utama') {
          const nextAnalytics = appendInvitationAnalyticsEvent(
            prevRoot.settings,
            payload,
            prevRoot.guests,
            prevRoot.wishes
          );
          const updatedRoot: WeddingDatabaseSchema = {
            ...prevRoot,
            settings: {
              ...prevRoot.settings,
              invitationAnalytics: nextAnalytics,
            },
          };
          return saveClientState(updatedRoot, shouldSyncToCloud);
        }
        return prevRoot;
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
        let nextClientWorkspaces = {
          ...(prev.settings.clientWorkspaces || {}),
        };
        let nextAdminUsers = Array.isArray(prev.adminUsers)
          ? [...prev.adminUsers]
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
              provisionedClientCode:
                mergedTx.provisionedClientCode || existingGroup.clientCode,
              provisionedInitialPassword:
                mergedTx.provisionedInitialPassword ||
                `${existingGroup.clientCode.toLowerCase()}12345`,
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
            const lowerCode = rawCode.toLowerCase();
            const initialPassword = `${lowerCode}12345`;
            const newGroup: ClientGroupItem = {
              id: `client-${Date.now().toString(36)}`,
              clientCode: rawCode,
              clientName: `Klien • ${cleanCouple}`,
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

            const effectiveEventType: EventCategoryType =
              mergedTx.eventType || 'WEDDING';
            const dummyIdForEvent =
              effectiveEventType === 'BIRTHDAY'
                ? 'client-demo-birthday'
                : effectiveEventType === 'GRADUATION'
                  ? 'client-demo-graduation'
                  : effectiveEventType === 'MEETING'
                    ? 'client-demo-meeting'
                    : effectiveEventType === 'GALA_DINNER'
                      ? 'client-demo-gala'
                      : 'client-demo-wedding';
            const mappedTier: ShowcasePackageTier =
              mergedTx.packageTier === 'STARTER'
                ? 'STARTER'
                : mergedTx.packageTier === 'EXCLUSIVE'
                  ? 'EXCLUSIVE'
                  : 'ROYAL VIP';
            const baseTemplate = getShowcaseDummyClientState(
              dummyIdForEvent,
              mappedTier,
              mergedTx.selectedThemeId
            );
            const parts = cleanCouple.split('&').map((p) => p.trim());
            const groomPart = parts[0] || cleanCouple;
            const bridePart = parts[1] || 'Partner';

            nextClientWorkspaces[newGroup.id] = {
              clientId: newGroup.id,
              settings: {
                ...baseTemplate.settings,
                activeClientId: newGroup.id,
                eventType: effectiveEventType,
                groomFullName: groomPart,
                groomNickname: groomPart.split(' ')[0] || groomPart,
                brideFullName: bridePart,
                brideNickname: bridePart.split(' ')[0] || bridePart,
                subtitle: `${cleanCouple} • ${
                  mergedTx.selectedThemeName || baseTemplate.settings.subtitle
                }`,
                updatedAt: nowIso,
                updatedBy: 'auto-provision',
              },
              tasks: baseTemplate.tasks.map((t, idx) => ({
                ...t,
                id: `tsk_${lowerCode}_${idx + 1}`,
                done: false,
                status: 'BELUM',
                doneAt: '',
              })),
              guests: [],
              wishes: [],
              budgetItems: [],
              updatedAt: nowIso,
            };

            const defaultFourUsers: AdminUser[] = [
              {
                id: `adm-${lowerCode}-pria`,
                username: `${lowerCode}_pria`,
                nama: `${groomPart} (Mempelai Pria)`,
                role: 'MEMPELAI_PRIA',
                jabatan: `Mempelai Pria • ${cleanCouple}`,
                email: `${lowerCode}.pria@meplanner.id`,
                password: initialPassword,
                isDefaultUser: true,
                clientId: newGroup.id,
                clientName: newGroup.clientName,
              },
              {
                id: `adm-${lowerCode}-wanita`,
                username: `${lowerCode}_wanita`,
                nama: `${bridePart} (Mempelai Wanita)`,
                role: 'MEMPELAI_WANITA',
                jabatan: `Mempelai Wanita • ${cleanCouple}`,
                email: `${lowerCode}.wanita@meplanner.id`,
                password: initialPassword,
                isDefaultUser: true,
                clientId: newGroup.id,
                clientName: newGroup.clientName,
              },
              {
                id: `adm-${lowerCode}-kel-pria`,
                username: `${lowerCode}_kel_pria`,
                nama: `Keluarga ${groomPart} (Pria)`,
                role: 'KELUARGA_PRIA',
                jabatan: `Keluarga Pria • ${cleanCouple}`,
                email: `${lowerCode}.kel.pria@meplanner.id`,
                password: initialPassword,
                isDefaultUser: true,
                clientId: newGroup.id,
                clientName: newGroup.clientName,
              },
              {
                id: `adm-${lowerCode}-kel-wanita`,
                username: `${lowerCode}_kel_wanita`,
                nama: `Keluarga ${bridePart} (Wanita)`,
                role: 'KELUARGA_WANITA',
                jabatan: `Keluarga Wanita • ${cleanCouple}`,
                email: `${lowerCode}.kel.wanita@meplanner.id`,
                password: initialPassword,
                isDefaultUser: true,
                clientId: newGroup.id,
                clientName: newGroup.clientName,
              },
            ];
            for (const u of defaultFourUsers) {
              if (
                !nextAdminUsers.some(
                  (ex) => ex.username.toLowerCase() === u.username.toLowerCase()
                )
              ) {
                nextAdminUsers.push(u);
              }
            }

            void fetch('/api/auth', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                action: 'CREATE_CLIENT_GROUP_USERS',
                clientId: newGroup.id,
                clientCode: rawCode,
                clientName: newGroup.clientName,
                coupleLabel: cleanCouple,
                initialPassword,
              }),
            }).catch(() => {});

            mergedTx = {
              ...mergedTx,
              provisionedClientId: newGroup.id,
              provisionedClientCode: rawCode,
              provisionedInitialPassword: initialPassword,
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
          adminUsers: nextAdminUsers,
          settings: {
            ...prev.settings,
            commercialPayments: nextList,
            clientGroups: nextClientGroups,
            clientWorkspaces: nextClientWorkspaces,
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
                  clientWorkspaces: (capturedNextState as WeddingDatabaseSchema)
                    .settings.clientWorkspaces,
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
      demoPackageTier,
      demoSelectedThemeId
    );
    const override = demoCustomOverrides[demoManagerClientId];
    if (!override) return baseDummy;
    return {
      ...baseDummy,
      ...override,
      settings: { ...baseDummy.settings, ...(override.settings || {}) },
    };
  }, [
    demoManagerClientId,
    demoPackageTier,
    demoSelectedThemeId,
    demoCustomOverrides,
  ]);

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
            handleOpenDemoManager(
              activeDummyClientIdForSandbox,
              demoPackageTier,
              demoSelectedThemeId
            )
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
                handleOpenDemoManager(cid, demoPackageTier, demoSelectedThemeId);
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
          onQuickCreateWithGoogle={handleQuickCreateWithGoogle}
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
                title="Kembali ke Katalog"
              >
                <span>&larr; Katalog</span>
              </button>
            )
          )}
          <PublicInvitationView
            settings={activePublicState.settings}
            guests={activePublicState.guests}
            wishes={activePublicState.wishes}
            guestParamName={effectiveGuestName}
            guestParamCode={effectiveGuestCode}
            autoCheckInParam={urlCheckinParam}
            isAdminLoggedIn={Boolean(adminUser)}
            onOpenAdminPortal={handleOpenAdminPortal}
            onOpenLandingPage={handleOpenLandingPage}
            onTrackAnalytics={handleTrackPublicAnalytics}
            onSubmitRsvp={handleSubmitPublicRsvp}
            onCheckInGuest={handlePublicGuestCheckIn}
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
          className="fixed inset-0 z-50 bg-stone-900/55 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsLoginModalOpen(false);
            }
          }}
        >
          <div className="max-w-[420px] w-full my-auto">
            {/* Top Brand Bar */}
            <div className="flex items-center justify-between mb-4 px-1">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/95 shadow-sm flex items-center justify-center shrink-0">
                  <WeddingRingsIcon className="w-6 h-6" />
                </div>
                <div className="leading-tight">
                  <p className="text-base font-extrabold text-white tracking-tight">
                    MEPlanner
                  </p>
                  <p className="text-[11px] text-stone-200 font-medium">
                    My Event Planner &bull; Undangan &amp; Manajemen Acara
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <div
                  className="inline-flex items-center rounded-lg bg-white/15 p-0.5 border border-white/20 backdrop-blur-xs"
                  role="group"
                  aria-label="Language switcher"
                >
                  <button
                    type="button"
                    onClick={() => setLoginLang('ID')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      loginLang === 'ID'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    ID
                  </button>
                  <button
                    type="button"
                    onClick={() => setLoginLang('EN')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      loginLang === 'EN'
                        ? 'bg-white text-stone-900 shadow-xs'
                        : 'text-white/80 hover:text-white'
                    }`}
                  >
                    EN
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsLoginModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label={loginLang === 'EN' ? 'Close' : 'Tutup'}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Minimalist White Card (max-w-[420px] w-full rounded-2xl bg-white p-8 sm:p-10 shadow-2xl) */}
            <div className="max-w-[420px] w-full rounded-2xl bg-white p-8 sm:p-10 shadow-2xl text-stone-800">
              {loginErrorMsg && (
                <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{loginErrorMsg}</span>
                </div>
              )}

              {authModalMode === 'SIGN_IN' && (
                <>
                  <div className="text-center mb-6">
                    <p className="text-sm font-medium text-stone-600">
                      {loginLang === 'ID' ? 'Masuk ke Ruang Kerja' : 'Sign In to Workspace'}
                    </p>
                    <h3 className="text-2xl font-extrabold text-stone-900 mt-0.5">
                      ME<span className="text-[#8B6914]">Planner</span>
                    </h3>
                  </div>

                  <form
                    onSubmit={handlePlannerCredentialsSubmit}
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        {loginLang === 'ID' ? 'Email atau Username' : 'Email or Username'}
                      </label>
                      <input
                        type="text"
                        value={loginIdentifier}
                        onChange={(e) => setLoginIdentifier(e.target.value)}
                        placeholder={
                          loginLang === 'ID'
                            ? 'Masukkan email atau username Anda'
                            : 'Enter your email or username'
                        }
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-stone-800">
                          Password
                        </label>
                        <button
                          type="button"
                          onClick={() =>
                            setLoginErrorMsg(
                              loginLang === 'ID'
                                ? 'Silakan hubungi e98.bisnis@gmail.com untuk bantuan reset kata sandi.'
                                : 'Please contact e98.bisnis@gmail.com for password reset assistance.'
                            )
                          }
                          className="text-xs font-semibold text-[#8B6914] hover:underline cursor-pointer"
                        >
                          {loginLang === 'ID'
                            ? 'Lupa Password?'
                            : 'Forgot Password?'}
                        </button>
                      </div>
                      <input
                        type="password"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingLogin}
                      className="w-full h-11 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer disabled:opacity-60"
                    >
                      {isSubmittingLogin
                        ? loginLang === 'ID'
                          ? 'Memproses...'
                          : 'Signing In...'
                        : loginLang === 'ID'
                          ? 'Masuk'
                          : 'Sign In'}
                    </button>
                  </form>

                  <div className="py-3 text-center text-xs font-medium text-stone-400 uppercase tracking-wider">
                    {loginLang === 'ID' ? 'ATAU' : 'OR'}
                  </div>

                  <div className="space-y-2.5">
                    <ReactGoogleLoginButton
                      lang={loginLang}
                      buttonText={
                        loginLang === 'ID'
                          ? 'Masuk dengan Google'
                          : 'Sign in with Google'
                      }
                      onSuccess={(response: GoogleLoginResponse) => {
                        setLoginErrorMsg('');
                        if (response.verifiedAdminUser) {
                          handleLoginSuccess(
                            response.verifiedAdminUser as AdminUser,
                            loginLang === 'EN'
                              ? `Signed in with Google as ${response.profileObj.name}.`
                              : `Berhasil masuk dengan Google sebagai ${response.profileObj.name}.`
                          );
                          return;
                        }
                        void handleQuickCreateWithGoogle({
                          email: response.profileObj.email,
                          displayName: response.profileObj.name,
                          packageId: 'GRATIS',
                          catalogThemeId: demoSelectedThemeId,
                          isOAuthVerified: response.isOAuthVerified,
                        });
                      }}
                      onFailure={(err) => {
                        if (err.error === 'popup_blocked_by_browser') {
                          setShowCustomGoogleInput(true);
                          setAuthModalMode('GOOGLE_CHOOSER');
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setLoginErrorMsg('');
                        setAuthModalMode('ACCESS_CODE');
                      }}
                      className="w-full h-11 rounded-lg bg-[#FAF8F5] hover:bg-stone-100 border border-stone-200 text-stone-800 font-semibold text-sm transition-all cursor-pointer"
                    >
                      {loginLang === 'ID'
                        ? 'Masuk dengan Kode Akses Workspace'
                        : 'Sign in with Workspace Access Code'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setLoginErrorMsg('');
                        setAuthModalMode('REGISTER');
                      }}
                      className="w-full h-11 rounded-lg bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] font-semibold text-sm transition-all cursor-pointer"
                    >
                      {loginLang === 'ID'
                        ? 'Buat Akun Baru (Gratis)'
                        : 'Create New Account (Free)'}
                    </button>
                  </div>
                </>
              )}

              {authModalMode === 'GOOGLE_CHOOSER' && (
                <div>
                  <div className="flex flex-col items-center text-center mb-5">
                    <svg
                      viewBox="0 0 24 24"
                      className="w-7 h-7 mb-2.5"
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
                    <h3 className="text-xl font-bold text-stone-900">
                      {loginLang === 'ID'
                        ? 'Masuk dengan Google'
                        : 'Sign in with Google'}
                    </h3>
                    <p className="text-xs text-stone-500 mt-1">
                      {loginLang === 'ID'
                        ? 'Gunakan akun Google Anda untuk melanjutkan ke '
                        : 'Use your Google account to continue to '}
                      <span className="font-bold text-[#8B6914]">MEPlanner</span>
                    </p>
                  </div>

                  <form
                    onSubmit={(e) => handleGmailLoginSubmit(e)}
                    className="space-y-3.5"
                  >
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        {loginLang === 'ID'
                          ? 'Alamat Email Google (@gmail.com)'
                          : 'Google Email Address (@gmail.com)'}
                      </label>
                      <input
                        type="email"
                        autoFocus
                        value={gmailAddressInput}
                        onChange={(e) => setGmailAddressInput(e.target.value)}
                        placeholder={
                          loginLang === 'ID'
                            ? 'nama.anda@gmail.com'
                            : 'your.name@gmail.com'
                        }
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        {loginLang === 'ID'
                          ? 'Nama Pasangan / Acara (Opsional untuk Akun Baru)'
                          : 'Couple / Event Name (Optional for New Workspace)'}
                      </label>
                      <input
                        type="text"
                        value={gmailEventTitleInput}
                        onChange={(e) =>
                          setGmailEventTitleInput(e.target.value)
                        }
                        placeholder={
                          loginLang === 'ID'
                            ? 'Contoh: Andi & Rina'
                            : 'Example: Andi & Rina'
                        }
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all cursor-pointer"
                    >
                      {loginLang === 'ID' ? 'Lanjutkan' : 'Continue'}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginErrorMsg('');
                      setAuthModalMode('SIGN_IN');
                    }}
                    className="mt-5 w-full text-center text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
                  >
                    {loginLang === 'ID'
                      ? '← Kembali ke halaman Sign In'
                      : '← Back to Sign In'}
                  </button>
                </div>
              )}

              {authModalMode === 'ACCESS_CODE' && (
                <div>
                  <div className="text-center mb-6">
                    <p className="text-base font-medium text-stone-700">
                      {loginLang === 'ID' ? 'Masuk dengan' : 'Sign In with'}
                    </p>
                    <h3 className="text-2xl font-extrabold text-stone-900 mt-0.5">
                      {loginLang === 'ID' ? 'Kode Akses' : 'Access Code'}
                    </h3>
                  </div>

                  <form onSubmit={handleAccessCodeSubmit} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1.5">
                        {loginLang === 'ID'
                          ? 'Kode Akses Undangan / Workspace'
                          : 'Invitation / Workspace Access Code'}
                      </label>
                      <input
                        type="text"
                        autoFocus
                        value={accessCodeInput}
                        onChange={(e) => setAccessCodeInput(e.target.value)}
                        placeholder={
                          loginLang === 'ID'
                            ? 'Masukkan kode akses...'
                            : 'Enter access code...'
                        }
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all cursor-pointer"
                    >
                      {loginLang === 'ID' ? 'Masuk' : 'Sign In'}
                    </button>
                  </form>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginErrorMsg('');
                      setAuthModalMode('SIGN_IN');
                    }}
                    className="mt-5 w-full text-center text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
                  >
                    {loginLang === 'ID'
                      ? '← Kembali ke Sign In'
                      : '← Back to Sign In'}
                  </button>
                </div>
              )}

              {authModalMode === 'REGISTER' && (
                <div>
                  <div className="text-center mb-5">
                    <p className="text-sm font-medium text-stone-600">
                      {loginLang === 'ID' ? 'Buat Ruang Kerja Baru' : 'Create New Workspace'}
                    </p>
                    <h3 className="text-2xl font-extrabold text-stone-900 mt-0.5">
                      ME<span className="text-[#8B6914]">Planner</span>
                    </h3>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {loginLang === 'ID'
                          ? 'Nama Pasangan / Acara'
                          : 'Couple / Event Name'}
                      </label>
                      <input
                        type="text"
                        value={gmailEventTitleInput}
                        onChange={(e) =>
                          setGmailEventTitleInput(e.target.value)
                        }
                        placeholder={
                          loginLang === 'ID'
                            ? 'Contoh: Andi & Rina'
                            : 'Example: Andi & Rina'
                        }
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        {loginLang === 'ID'
                          ? 'Kategori Acara'
                          : 'Event Category'}
                      </label>
                      <select
                        value={gmailEventTypeInput}
                        onChange={(e) =>
                          setGmailEventTypeInput(
                            e.target.value as EventCategoryType
                          )
                        }
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                      >
                        <option value="WEDDING">
                          {loginLang === 'ID' ? 'Pernikahan' : 'Wedding'}
                        </option>
                        <option value="BIRTHDAY">
                          {loginLang === 'ID' ? 'Ulang Tahun' : 'Birthday'}
                        </option>
                        <option value="GRADUATION">
                          {loginLang === 'ID' ? 'Wisuda' : 'Graduation'}
                        </option>
                        <option value="MEETING">
                          {loginLang === 'ID' ? 'Rapat Resmi' : 'Corporate Meeting'}
                        </option>
                        <option value="GALA_DINNER">Gala Dinner</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={gmailAddressInput}
                        onChange={(e) => setGmailAddressInput(e.target.value)}
                        placeholder="nama@gmail.com"
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-800 mb-1">
                        Password
                      </label>
                      <input
                        type="password"
                        value={registerPasswordInput}
                        onChange={(e) =>
                          setRegisterPasswordInput(e.target.value)
                        }
                        className="w-full h-11 px-4 rounded-lg bg-[#FAF8F5] border border-stone-200 focus:border-[#B68D40] focus:bg-white outline-none text-sm text-stone-900 transition-all"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full h-11 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold text-sm transition-all shadow-xs cursor-pointer"
                    >
                      {loginLang === 'ID'
                        ? 'Buat Akun Gratis & Masuk ke Management'
                        : 'Create Free Account & Enter Management'}
                    </button>
                  </form>

                  <div className="mt-2.5">
                    <ReactGoogleLoginButton
                      lang={loginLang}
                      buttonText={
                        loginLang === 'ID'
                          ? 'Daftar dengan Google'
                          : 'Sign up with Google'
                      }
                      onSuccess={(response: GoogleLoginResponse) => {
                        setLoginErrorMsg('');
                        if (response.verifiedAdminUser) {
                          handleLoginSuccess(
                            response.verifiedAdminUser as AdminUser,
                            loginLang === 'EN'
                              ? `Signed in with Google as ${response.profileObj.name}.`
                              : `Berhasil masuk dengan Google sebagai ${response.profileObj.name}.`
                          );
                          return;
                        }
                        const rawTitle = gmailEventTitleInput.trim();
                        void handleQuickCreateWithGoogle({
                          email: response.profileObj.email,
                          displayName: rawTitle || response.profileObj.name,
                          eventTitle: rawTitle || undefined,
                          eventType: gmailEventTypeInput,
                          packageId: 'GRATIS',
                          catalogThemeId: demoSelectedThemeId,
                        });
                      }}
                      onFailure={(err) => {
                        if (err.error === 'popup_blocked_by_browser') {
                          setShowCustomGoogleInput(true);
                          setAuthModalMode('GOOGLE_CHOOSER');
                        }
                      }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setLoginErrorMsg('');
                      setAuthModalMode('SIGN_IN');
                    }}
                    className="mt-4 w-full text-center text-xs font-semibold text-stone-500 hover:text-stone-900 cursor-pointer"
                  >
                    {loginLang === 'ID'
                      ? '← Kembali ke Sign In'
                      : '← Back to Sign In'}
                  </button>
                </div>
              )}
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
