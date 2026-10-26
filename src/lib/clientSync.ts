import {
  WeddingDatabaseSchema,
  WeddingGuest,
  GuestWish,
  WeddingSettings,
  WeddingScheduleEvent,
  WeddingTask,
  BudgetVendorItem,
  AdminUser,
  PhotoAdjustment,
  MusicTrackItem,
  LoveStoryItem,
  GalleryPhotoItem,
  InvitationAnalyticsData,
  InvitationAnalyticsEvent,
  InvitationInteractionType,
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
  queueSaveStateToSupabase,
  isInitialCloudHydrationComplete,
  SUPABASE_URL,
} from '@/lib/supabaseCloud';
import { computeGuestInvitationHash } from '@/lib/guestTokenHash';

const STORAGE_KEY = 'my_wedding_manager_state_v6';
const ADMIN_AUTH_KEY = 'my_wedding_manager_admin_auth_v2';
const VIEW_MODE_KEY = 'my_wedding_manager_view_mode_v2';
const IDB_NAME = 'my_wedding_manager_idb_v6';
const IDB_STORE = 'wedding_state_store';
const IDB_KEY = 'current_wedding_db';

export const MEPLANNER_BRAND_NAME = 'MEPlanner';
export const MEPLANNER_BRAND_TITLE = 'MEPlanner — My Event Planner';
export const MEPLANNER_DEFAULT_SITE_URL = 'https://meplanner.vercel.app';

function normalizeParsedState(
  parsed: Partial<WeddingDatabaseSchema>
): WeddingDatabaseSchema {
  const cleanTasks = Array.isArray(parsed.tasks)
    ? parsed.tasks.filter((t) => !/^g\d+$/i.test(String(t.id || '')))
    : INITIAL_TASKS;
  const filteredGuests = Array.isArray(parsed.guests)
    ? parsed.guests.filter((g) => !/^guest_[0-9a-f]{8}-/i.test(String(g.id || '')))
    : [];
  const cleanGuests =
    filteredGuests.length > 0 ? filteredGuests : INITIAL_GUESTS;

  const mergedSettings = parsed.settings
    ? { ...INITIAL_SETTINGS, ...parsed.settings }
    : { ...INITIAL_SETTINGS };
  if (!mergedSettings.siteTitle) {
    mergedSettings.siteTitle = MEPLANNER_BRAND_TITLE;
  } else if (/\bMEPlan\b/.test(mergedSettings.siteTitle)) {
    mergedSettings.siteTitle = mergedSettings.siteTitle.replace(
      /\bMEPlan\b/g,
      MEPLANNER_BRAND_NAME
    );
  }
  if (
    !mergedSettings.groomFullName ||
    mergedSettings.groomFullName === 'Eko' ||
    mergedSettings.groomFullName === 'Nama Mempelai Pria'
  ) {
    mergedSettings.groomFullName = INITIAL_SETTINGS.groomFullName;
    mergedSettings.groomNickname = INITIAL_SETTINGS.groomNickname;
    mergedSettings.groomRankAndTitle = INITIAL_SETTINGS.groomRankAndTitle;
    mergedSettings.groomUnit = INITIAL_SETTINGS.groomUnit;
    mergedSettings.groomParents = INITIAL_SETTINGS.groomParents;
    mergedSettings.groomOrigin = INITIAL_SETTINGS.groomOrigin;
  }
  if (
    !mergedSettings.groomParents ||
    mergedSettings.groomParents.includes('Putra dari Bapak ...')
  ) {
    mergedSettings.groomParents = INITIAL_SETTINGS.groomParents;
  }
  if (
    !mergedSettings.groomNickname ||
    mergedSettings.groomNickname === 'Mempelai Pria' ||
    mergedSettings.groomNickname === 'Eko'
  ) {
    mergedSettings.groomNickname = INITIAL_SETTINGS.groomNickname;
  }
  if (
    !mergedSettings.brideFullName ||
    mergedSettings.brideFullName === 'Nama Mempelai Wanita' ||
    mergedSettings.brideFullName === 'Sero Nelci Agustina'
  ) {
    mergedSettings.brideFullName = INITIAL_SETTINGS.brideFullName;
    mergedSettings.brideNickname = INITIAL_SETTINGS.brideNickname;
    mergedSettings.brideTitle = INITIAL_SETTINGS.brideTitle;
    mergedSettings.brideOrigin = INITIAL_SETTINGS.brideOrigin;
  }
  if (
    !mergedSettings.brideParents ||
    mergedSettings.brideParents.includes('Putri dari Bapak ...')
  ) {
    mergedSettings.brideParents = INITIAL_SETTINGS.brideParents;
  }
  if (
    !mergedSettings.brideNickname ||
    mergedSettings.brideNickname === 'Mempelai Wanita'
  ) {
    mergedSettings.brideNickname = INITIAL_SETTINGS.brideNickname;
  }
  if (
    !mergedSettings.groomPhotoUrl ||
    mergedSettings.groomPhotoUrl.includes('images.unsplash.com')
  ) {
    mergedSettings.groomPhotoUrl = INITIAL_SETTINGS.groomPhotoUrl;
  }
  if (
    !mergedSettings.bridePhotoUrl ||
    mergedSettings.bridePhotoUrl.includes('images.unsplash.com')
  ) {
    mergedSettings.bridePhotoUrl = INITIAL_SETTINGS.bridePhotoUrl;
  }
  if (
    !mergedSettings.coverBgUrl ||
    mergedSettings.coverBgUrl.includes('images.unsplash.com')
  ) {
    mergedSettings.coverBgUrl = INITIAL_SETTINGS.coverBgUrl;
  }
  if (
    !mergedSettings.heroPrewedUrl ||
    mergedSettings.heroPrewedUrl.includes('images.unsplash.com')
  ) {
    mergedSettings.heroPrewedUrl = INITIAL_SETTINGS.heroPrewedUrl;
  }
  if (
    !mergedSettings.pageBgUrl ||
    mergedSettings.pageBgUrl.includes('images.unsplash.com')
  ) {
    mergedSettings.pageBgUrl = INITIAL_SETTINGS.pageBgUrl;
  }
  if (
    !Array.isArray(mergedSettings.galleryPhotos) ||
    mergedSettings.galleryPhotos.length === 0
  ) {
    mergedSettings.galleryPhotos = INITIAL_SETTINGS.galleryPhotos;
  }
  if (
    !Array.isArray(mergedSettings.loveStory) ||
    mergedSettings.loveStory.length === 0
  ) {
    mergedSettings.loveStory = INITIAL_SETTINGS.loveStory;
  }
  if (
    !Array.isArray(mergedSettings.musicPlaylist) ||
    mergedSettings.musicPlaylist.length === 0
  ) {
    mergedSettings.musicPlaylist = INITIAL_SETTINGS.musicPlaylist;
    mergedSettings.activeMusicTrackId = INITIAL_SETTINGS.activeMusicTrackId;
    mergedSettings.musicTitle = INITIAL_SETTINGS.musicTitle;
    mergedSettings.musicArtist = INITIAL_SETTINGS.musicArtist;
  }

  if (Array.isArray(mergedSettings.musicPlaylist)) {
    mergedSettings.musicPlaylist = mergedSettings.musicPlaylist.map((m) => {
      const titleLower = (m.title || '').toLowerCase();
      const urlLower = (m.url || '').toLowerCase();
      if (
        titleLower.includes('pernikahan kita') ||
        urlLower.includes('pernikahan-kita') ||
        urlLower.includes('pernikahan_kita')
      ) {
        return { ...m, url: '/musik/pernikahan-kita.mp3' };
      }
      if (
        titleLower.includes('jalaraning tresna') ||
        urlLower.includes('jalaraning-tresna') ||
        urlLower.includes('jalaraning_tresna')
      ) {
        return { ...m, url: '/musik/jalaraning-tresna.mp3' };
      }
      if (
        titleLower.includes('cundamani') ||
        urlLower.includes('cundamani') ||
        urlLower.includes('music_mvgp1wrn')
      ) {
        return { ...m, url: '/musik/cundamani.mp3' };
      }
      if (
        titleLower.includes('marry your daughter') ||
        urlLower.includes('marry-your-daughter') ||
        urlLower.includes('marry_your_daughter') ||
        urlLower.includes('music_mvgp2o8h')
      ) {
        return { ...m, url: '/musik/marry-your-daughter.mp3' };
      }
      if (
        titleLower.includes('beautiful in white') ||
        urlLower.includes('beautiful-in-white') ||
        urlLower.includes('beautiful_in_white')
      ) {
        return { ...m, url: '/musik/beautiful-in-white.mp3' };
      }
      if (
        titleLower.includes('paint my love') ||
        urlLower.includes('paint-my-love') ||
        urlLower.includes('paint_my_love')
      ) {
        return { ...m, url: '/musik/paint-my-love.mp3' };
      }
      if (m.url && m.url.includes('gwoyalvivfemaeacbyvi.supabase.co')) {
        return {
          ...m,
          url: m.url.replace(
            'gwoyalvivfemaeacbyvi.supabase.co',
            'wkjnwkgpolpmzdfrfjso.supabase.co'
          ),
        };
      }
      return m;
    });
    if (
      mergedSettings.musicPlaylist.length > 0 &&
      (!mergedSettings.activeMusicTrackId ||
        !mergedSettings.musicPlaylist.some(
          (m) => m.id === mergedSettings.activeMusicTrackId
        ))
    ) {
      mergedSettings.activeMusicTrackId = mergedSettings.musicPlaylist[0].id;
      mergedSettings.musicTitle = mergedSettings.musicPlaylist[0].title;
      mergedSettings.musicArtist = mergedSettings.musicPlaylist[0].artist;
    }
  }

  if (
    typeof mergedSettings.musicVolume !== 'number' ||
    !Number.isFinite(mergedSettings.musicVolume)
  ) {
    mergedSettings.musicVolume = 80;
  } else if (mergedSettings.musicVolume > 0 && mergedSettings.musicVolume <= 5) {
    mergedSettings.musicVolume = 80;
  }

  if (
    !mergedSettings.subtitle ||
    mergedSettings.subtitle.includes('Biston: 18 Desember 2026')
  ) {
    mergedSettings.subtitle = buildScheduleSummarySubtitle(
      getEffectiveScheduleEvents(mergedSettings),
      mergedSettings.groomOrigin || 'Semarang'
    );
  }

  if (
    mergedSettings.developerCreditUrl &&
    mergedSettings.developerCreditUrl.includes('eko-agung-krisdianto-408955130')
  ) {
    mergedSettings.developerCreditUrl = mergedSettings.developerCreditUrl.replace(
      /eko-agung-krisdianto-408955130/g,
      'omeko42'
    );
  }
  if (
    mergedSettings.contactWhatsappNumber &&
    (/895[\s-]*3399[\s-]*69492/.test(mergedSettings.contactWhatsappNumber) ||
      mergedSettings.contactWhatsappNumber === '089638616516')
  ) {
    mergedSettings.contactWhatsappNumber = '';
  }
  if (!mergedSettings.contactBusinessEmail) {
    mergedSettings.contactBusinessEmail = 'e98.bisnis@gmail.com';
  }
  if (
    mergedSettings.commercialBankTransferInfo &&
    (/895[\s-]*3399[\s-]*69492/.test(mergedSettings.commercialBankTransferInfo) ||
      /Konfirmasi via WA/i.test(mergedSettings.commercialBankTransferInfo))
  ) {
    mergedSettings.commercialBankTransferInfo =
      'BCA / Mandiri / BRI / BNI (Konfirmasi via Email Resmi Gmail: e98.bisnis@gmail.com)';
  }

  // Purge any accidental non-superadmin / test workspaces so they never bloat JSON
  if (Array.isArray(mergedSettings.clientGroups)) {
    mergedSettings.clientGroups = mergedSettings.clientGroups.filter(
      (g) =>
        g.id !== 'client-gmail-agungkrisdiant' &&
        g.id !== 'client-gmail-pasanganmempel'
    );
  }
  if (mergedSettings.clientWorkspaces) {
    const nextWs = { ...mergedSettings.clientWorkspaces };
    delete nextWs['client-gmail-agungkrisdiant'];
    delete nextWs['client-gmail-pasanganmempel'];
    mergedSettings.clientWorkspaces = nextWs;
  }
  if (
    mergedSettings.activeClientId === 'client-gmail-agungkrisdiant' ||
    mergedSettings.activeClientId === 'client-gmail-pasanganmempel'
  ) {
    mergedSettings.activeClientId = 'client-utama';
  }
  if (
    mergedSettings.invitationAnalytics &&
    Array.isArray(mergedSettings.invitationAnalytics.recentEvents) &&
    mergedSettings.invitationAnalytics.recentEvents.length > 12
  ) {
    mergedSettings.invitationAnalytics = {
      ...mergedSettings.invitationAnalytics,
      recentEvents: mergedSettings.invitationAnalytics.recentEvents.slice(0, 12),
    };
  }

  const rawAdminUsers =
    Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
      ? parsed.adminUsers.filter(
          (u) =>
            u.id !== 'usr-gmail-agungkrisdiant' &&
            u.id !== 'usr-gmail-pasanganmempel' &&
            u.clientId !== 'client-gmail-agungkrisdiant' &&
            u.clientId !== 'client-gmail-pasanganmempel' &&
            u.username?.toLowerCase() !== 'agungkrisdianto98@gmail.com'
        )
      : INITIAL_ADMIN_USERS;

  return {
    settings: mergedSettings,
    tasks: cleanTasks,
    guests: cleanGuests,
    wishes: Array.isArray(parsed.wishes) ? parsed.wishes : INITIAL_WISHES,
    budgetItems: Array.isArray(parsed.budgetItems)
      ? parsed.budgetItems
      : INITIAL_BUDGET_ITEMS,
    adminUsers: rawAdminUsers.length > 0 ? rawAdminUsers : INITIAL_ADMIN_USERS,
    lastSyncedAt: parsed.lastSyncedAt || '2026-01-01T00:00:00.000Z',
  };
}

export function getInitialClientState(): WeddingDatabaseSchema {
  if (typeof window !== 'undefined') {
    try {
      // Purge legacy v1/v2/v3/v4/v5 local caches so Supabase is the clean source of truth
      localStorage.removeItem('my_wedding_manager_state_v1');
      localStorage.removeItem('my_wedding_manager_state_v2');
      localStorage.removeItem('my_wedding_manager_state_v3');
      localStorage.removeItem('my_wedding_manager_state_v4');
      localStorage.removeItem('my_wedding_manager_state_v5');
      if ('indexedDB' in window) {
        try {
          window.indexedDB.deleteDatabase('my_wedding_manager_idb_v2');
          window.indexedDB.deleteDatabase('my_wedding_manager_idb_v3');
          window.indexedDB.deleteDatabase('my_wedding_manager_idb_v4');
          window.indexedDB.deleteDatabase('my_wedding_manager_idb_v5');
        } catch {
          // Ignore
        }
      }

      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WeddingDatabaseSchema>;
        return normalizeParsedState(parsed);
      }
    } catch {
      // Fallback to seed data
    }
  }

  return {
    settings: INITIAL_SETTINGS,
    tasks: INITIAL_TASKS,
    guests: INITIAL_GUESTS,
    wishes: INITIAL_WISHES,
    budgetItems: INITIAL_BUDGET_ITEMS,
    adminUsers: INITIAL_ADMIN_USERS,
    lastSyncedAt: '2026-01-01T00:00:00.000Z',
  };
}

function openWeddingIdb(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    try {
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function loadClientStateFromIndexedDB(): Promise<WeddingDatabaseSchema | null> {
  const db = await openWeddingIdb();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const getReq = store.get(IDB_KEY);
      getReq.onsuccess = () => {
        if (getReq.result && typeof getReq.result === 'object') {
          resolve(normalizeParsedState(getReq.result as Partial<WeddingDatabaseSchema>));
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

export async function saveClientStateToIndexedDB(
  state: WeddingDatabaseSchema
): Promise<void> {
  const db = await openWeddingIdb();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      const store = tx.objectStore(IDB_STORE);
      store.put(state, IDB_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function saveClientState(
  state: WeddingDatabaseSchema,
  touchTimestamp = false
): WeddingDatabaseSchema {
  const syncedState: WeddingDatabaseSchema = {
    ...state,
    lastSyncedAt: touchTimestamp
      ? new Date().toISOString()
      : state.lastSyncedAt || new Date().toISOString(),
  };

  if (typeof window === 'undefined') return syncedState;

  // 1. Always save full state (including high-res photos & uploaded MP3 audio) to IndexedDB (500MB+ capacity)
  void saveClientStateToIndexedDB(syncedState);

  // 2. Also save to localStorage for instant synchronous hydration (without duplicate originalPhotos)
  try {
    const lsSettings: WeddingSettings = {
      ...syncedState.settings,
      originalPhotos: undefined,
      galleryPhotos: (syncedState.settings.galleryPhotos || []).map((g) => ({
        ...g,
        originalImageUrl: undefined,
      })),
    };
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...syncedState, settings: lsSettings })
    );
  } catch {
    // If localStorage hits 5MB limit due to large base64 audio/images, save a compact copy to localStorage
    // while IndexedDB & Supabase Cloud hold the complete media payload
    try {
      const compactSettings: WeddingSettings = {
        ...syncedState.settings,
        originalPhotos: undefined,
        musicPlaylist: (syncedState.settings.musicPlaylist || []).filter(
          (m) => !m.url.startsWith('data:audio/')
        ),
        galleryPhotos: (syncedState.settings.galleryPhotos || []).map((g) => ({
          ...g,
          originalImageUrl: undefined,
        })),
      };
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...syncedState,
          settings: compactSettings,
        })
      );
    } catch {
      // Ignore secondary quota errors; Supabase & IndexedDB have the full copy
    }
  }

  // 3. When user modifies state (touchTimestamp=true) AFTER initial cloud hydration, sync to Supabase Cloud with safe debounce
  if (touchTimestamp && isInitialCloudHydrationComplete()) {
    queueSaveStateToSupabase(syncedState, 380);
  }

  return syncedState;
}

export function getStoredViewMode(): 'PUBLIC' | 'ADMIN' | null {
  if (typeof window === 'undefined') return null;
  try {
    const val = localStorage.getItem(VIEW_MODE_KEY);
    if (val === 'ADMIN' || val === 'PUBLIC') return val;
    return null;
  } catch {
    return null;
  }
}

export function saveStoredViewMode(mode: 'PUBLIC' | 'ADMIN'): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(VIEW_MODE_KEY, mode);
  } catch {
    // Ignore
  }
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AdminUser;
    if (parsed.id === 'usr-gmail-agungkrisdiant') {
      localStorage.removeItem(ADMIN_AUTH_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveStoredAdminUser(user: AdminUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(user));
      const cleanEmail = (user.email || '').trim().toLowerCase();
      if (cleanEmail && cleanEmail.includes('@') && !cleanEmail.endsWith('.local')) {
        const cleanDisplayName = (user.nama || cleanEmail)
          .replace(/\s*\(Superadmin.*?\)/gi, '')
          .replace(/\s*\(GRATIS\)/gi, '')
          .trim();
        const rawList = localStorage.getItem('meplanner_browser_google_accounts_v1');
        const list: Array<{ email: string; name: string }> = rawList
          ? JSON.parse(rawList)
          : [];
        const filtered = list.filter((item) => item.email !== cleanEmail);
        filtered.unshift({ email: cleanEmail, name: cleanDisplayName });
        localStorage.setItem(
          'meplanner_browser_google_accounts_v1',
          JSON.stringify(filtered.slice(0, 5))
        );
      }
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function buildGuestInvitationUrl(
  guest: Pick<WeddingGuest, 'guestName' | 'invitationCode'> & {
    id?: string;
    invitationToken?: string;
  },
  originUrl?: string,
  clientSlug?: string
): string {
  const base =
    originUrl ||
    (typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || MEPLANNER_DEFAULT_SITE_URL);
  const hashToken = computeGuestInvitationHash(
    clientSlug || 'client-utama',
    guest
  );
  const params = new URLSearchParams();
  if (
    clientSlug &&
    clientSlug !== 'client-utama' &&
    clientSlug.toLowerCase() !== 'utama'
  ) {
    params.set('client', clientSlug.replace(/^client-/i, '').toLowerCase());
  }
  params.set('to', guest.guestName);
  params.set('code', hashToken);
  return `${base}/?${params.toString()}`;
}

export function sanitizeWhatsAppText(raw: string): string {
  if (!raw) return '';
  return raw
    // 1. Bersihkan mojibake UTF-8 umum & karakter replacement rusak ()
    .replace(/\uFFFD+/g, '•')
    .replace(/â€¢/g, '•')
    .replace(/â€”/g, '—')
    .replace(/â€“/g, '–')
    .replace(/âœ¨/g, '✨')
    // 2. Pastikan link undangan berada di baris bersih tanpa simbol di depannya agar OG Link Preview WhatsApp selalu terpicu
    .replace(/(?:👉|▸|\uFFFD)\s*(\{link_undangan\}|https?:\/\/)/g, '$1')
    // 3. Ganti emoji 4-byte surrogate pairs (U+10000+) yang sering rusak jadi '' di protokol URI WhatsApp Desktop Windows dengan simbol Unicode BMP 16-bit aman
    .replace(/💍/g, '✨')
    .replace(/📅|🗓️|🗓/g, '•')
    .replace(/📍/g, '❖')
    .replace(/🔑/g, '❖')
    .replace(/👉/g, '▸')
    .replace(/🙏🏻|🙏🏼|🙏🏽|🙏🏾|🙏🏿|🙏/g, '✨')
    .replace(/[\uD800-\uDBFF][\uDC00-\uDFFF]/g, '✨')
    // 4. Hapus surrogate yatim (unpaired surrogate) yang memicu karakter ''
    .replace(/[\uD800-\uDFFF]/g, '')
    // 5. Hapus variation selector yatim jika ada
    .replace(/\uFE0F/g, '');
}

export const DEFAULT_WA_TEMPLATE_VIP = [
  'Selamat Pagi/Siang/Sore Jenderal / Komandan,',
  'Kepada Yth.',
  '*{nama_tamu}*',
  '{instansi}',
  '',
  'Mohon izin Jenderal / Komandan, dengan penuh rasa hormat dan kerendahan hati, kami bermaksud menyampaikan undangan digital rangkaian acara pernikahan kami:',
  '',
  '✨ *{mempelai_pria}*',
  '&',
  '✨ *{mempelai_wanita}*',
  '',
  '{jadwal_acara}',
  '❖ *Lokasi:* {lokasi_utama}',
  '',
  'Tautan Undangan Resmi & Konfirmasi Kehadiran:',
  '{link_undangan}',
  '❖ *Kode Akses Undangan:* `{kode_undangan}`',
  '',
  'Merupakan suatu kehormatan dan kebahagiaan besar bagi kami apabila Jenderal / Komandan berkenan memberikan doa restu kepada kami berdua.',
  '',
  'Hormat kami,',
  '*{mempelai_pria}* & Keluarga',
].join('\n');

export const DEFAULT_WA_TEMPLATE_REGULAR = [
  'Kepada Yth. Bapak/Ibu/Saudara/i:',
  '*{nama_tamu}*',
  '{instansi}',
  '',
  'Dengan penuh rasa syukur ke hadirat Tuhan Yang Maha Pengasih, tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami:',
  '',
  '✨ *{mempelai_pria}*',
  '&',
  '✨ *{mempelai_wanita}*',
  '',
  '{jadwal_acara}',
  '❖ *Tempat:* {lokasi_utama}',
  '',
  'Silakan buka Undangan Digital lengkap beserta lokasi peta & konfirmasi kehadiran (RSVP) melalui tautan berikut:',
  '{link_undangan}',
  '❖ *Kode Akses Undangan:* `{kode_undangan}`',
  '',
  'Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan sukacita yang tak ternilai bagi kami.',
  '',
  'Salam kasih,',
  '*{panggilan_pria} & {panggilan_wanita}*',
].join('\n');

export function buildWaHref(phone: string | undefined, messageText: string): string {
  const digits = (phone || '').replace(/\D+/g, '');
  let normalizedPhone = '';
  if (digits.startsWith('08')) {
    normalizedPhone = `62${digits.slice(1)}`;
  } else if (digits.startsWith('62')) {
    normalizedPhone = digits;
  } else if (digits.length >= 9) {
    normalizedPhone = digits;
  }

  const safeText = sanitizeWhatsAppText(messageText).replace(/\r\n/g, '\n');
  const encodedText = encodeURIComponent(safeText);
  return normalizedPhone
    ? `https://api.whatsapp.com/send?phone=${normalizedPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;
}

export function generateWhatsAppMessage(
  guest: WeddingGuest,
  settings: WeddingSettings,
  originUrl?: string
): { inviteUrl: string; messageText: string; waHref: string; isVipPolri: boolean } {
  const inviteUrl = buildGuestInvitationUrl(
    guest,
    originUrl,
    settings.activeClientId
  );
  const isVipPolri =
    guest.guestType === 'Pejabat/VIP' ||
    guest.priority === 'P1 - VIP' ||
    /KOMJEN|IRJEN|BRIGJEN|KOMBES|AKBP|JENDERAL/i.test(guest.guestName);

  const activeEvents = getEffectiveScheduleEvents(settings).filter(
    (ev) => ev.showOnInvitation !== false
  );
  const jadwalAcaraText =
    activeEvents.length > 0
      ? activeEvents
          .map((ev) => `• *${ev.title}:* ${ev.dateLabel} (${ev.timeLabel})`)
          .join('\n')
      : [
          `• *${settings.event1Title}:* ${settings.event1DateLabel} (${settings.event1TimeLabel})`,
          `• *${settings.event2Title}:* ${settings.event2DateLabel} (${settings.event2TimeLabel})`,
          `• *${settings.event3Title}:* ${settings.event3DateLabel} (${settings.event3TimeLabel})`,
        ].join('\n');

  const lastEvent = activeEvents[activeEvents.length - 1];
  const lokasiUtamaText = lastEvent
    ? `${lastEvent.venue}${lastEvent.address ? ` — ${lastEvent.address}` : ''}`
    : `${settings.event3Venue}${settings.event3Address ? ` — ${settings.event3Address}` : ''}`;

  const rawTemplate = isVipPolri
    ? settings.waTemplateVip && settings.waTemplateVip.trim()
      ? sanitizeWhatsAppText(settings.waTemplateVip)
      : DEFAULT_WA_TEMPLATE_VIP
    : settings.waTemplateRegular && settings.waTemplateRegular.trim()
    ? sanitizeWhatsAppText(settings.waTemplateRegular)
    : DEFAULT_WA_TEMPLATE_REGULAR;

  const rawInstansi = (guest.institution || '').trim();
  const effectiveInstansi = rawInstansi && rawInstansi !== '-' ? rawInstansi : 'di Tempat';
  const instansiFormatted = isVipPolri
    ? `(${effectiveInstansi})`
    : `_${effectiveInstansi}_`;

  const guestHashToken = computeGuestInvitationHash(
    settings.activeClientId || 'client-utama',
    guest
  );

  const messageText = sanitizeWhatsAppText(
    rawTemplate
      .replace(/\{nama_tamu\}/g, guest.guestName || 'Tamu Kehormatan')
      .replace(/\{instansi\}/g, instansiFormatted)
      .replace(/\{link_undangan\}/g, inviteUrl)
      .replace(/\{mempelai_pria\}/g, settings.groomFullName || 'Mempelai Pria')
      .replace(/\{mempelai_wanita\}/g, settings.brideFullName || 'Mempelai Wanita')
      .replace(/\{panggilan_pria\}/g, settings.groomNickname || 'Mempelai Pria')
      .replace(/\{panggilan_wanita\}/g, settings.brideNickname || 'Mempelai Wanita')
      .replace(/\{jadwal_acara\}/g, jadwalAcaraText)
      .replace(/\{lokasi_utama\}/g, lokasiUtamaText)
      .replace(/\{kode_undangan\}/g, guestHashToken)
      .replace(/\n{3,}/g, '\n\n')
      .trim()
  );

  const waHref = buildWaHref(guest.phone, messageText);

  return { inviteUrl, messageText, waHref, isVipPolri };
}

function escapeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTasksToCsv(tasks: WeddingTask[]): string {
  const headers = [
    'id',
    'category',
    'timelinePhase',
    'title',
    'due',
    'priority',
    'owner',
    'status',
    'notes',
    'done',
    'doneAt',
    'createdAt',
    'updatedAt',
    'updatedBy',
  ];
  const rows = tasks.map((t) =>
    [
      t.id,
      t.category,
      t.timelinePhase,
      t.title,
      t.due,
      t.priority,
      t.owner,
      t.status,
      t.notes,
      t.done ? 'TRUE' : 'FALSE',
      t.doneAt,
      t.createdAt,
      t.updatedAt,
      t.updatedBy,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportGuestsToCsv(guests: WeddingGuest[]): string {
  // Exact 19 columns matching user's Google Sheet DB (gid=1134858514)
  const headers = [
    'id',
    'invitationCode',
    'guestName',
    'guestType',
    'side',
    'institution',
    'invitationFormat',
    'priority',
    'cardQty',
    'pax',
    'phone',
    'address',
    'deliveryStatus',
    'rsvpStatus',
    'attendanceStatus',
    'notes',
    'createdAt',
    'updatedAt',
    'updatedBy',
  ];
  const rows = guests.map((g) =>
    [
      g.id,
      g.invitationCode,
      g.guestName,
      g.guestType,
      g.side,
      g.institution,
      g.invitationFormat,
      g.priority,
      g.cardQty,
      g.pax,
      g.phone,
      g.address,
      g.deliveryStatus,
      g.rsvpStatus,
      g.attendanceStatus,
      g.notes,
      g.createdAt,
      g.updatedAt,
      g.updatedBy,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportBudgetToCsv(items: BudgetVendorItem[]): string {
  const headers = [
    'id',
    'category',
    'itemName',
    'vendorName',
    'vendorContact',
    'pic',
    'estimatedCost',
    'actualCost',
    'paidAmount',
    'paymentStatus',
    'dueDate',
    'notes',
    'updatedAt',
  ];
  const rows = items.map((b) =>
    [
      b.id,
      b.category,
      b.itemName,
      b.vendorName,
      b.vendorContact,
      b.pic,
      b.estimatedCost,
      b.actualCost,
      b.paidAmount,
      b.paymentStatus,
      b.dueDate,
      b.notes,
      b.updatedAt,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export const DEFAULT_MUSIC_PLAYLIST: MusicTrackItem[] = [
  {
    id: 'track-default-1',
    title: 'NCS — Eternal Promise (Canon Acoustic)',
    artist: 'NoCopyrightSounds • Royalty-Free Instrumental',
    url: 'synth:canon-in-d',
    isDefault: true,
  },
  {
    id: 'track-default-2',
    title: 'NCS — Golden Hour Harmony',
    artist: 'NoCopyrightSounds • Free Royalty Arpeggio',
    url: 'synth:thousand-years',
    isDefault: true,
  },
  {
    id: 'track-default-3',
    title: 'NCS — Symphony of Grace',
    artist: 'NoCopyrightSounds • Free Royalty Piano',
    url: 'synth:beautiful-in-white',
    isDefault: true,
  },
];

export const NCS_ROYALTY_FREE_PRESETS: MusicTrackItem[] = [
  ...DEFAULT_MUSIC_PLAYLIST,
  {
    id: 'track-ncs-4',
    title: 'NCS — Serenade of Dawn (Classic Harp)',
    artist: 'NoCopyrightSounds • Free Commercial Use',
    url: 'synth:canon-in-d',
    isDefault: true,
  },
  {
    id: 'track-ncs-5',
    title: 'NCS — Velvet Starlight (Romantic Acoustic)',
    artist: 'NoCopyrightSounds • Bebas Hak Cipta',
    url: 'synth:thousand-years',
    isDefault: true,
  },
];

export function parseExternalMusicEmbedUrl(rawUrl?: string): {
  provider: 'SPOTIFY' | 'YOUTUBE' | null;
  embedUrl: string | null;
} {
  const url = (rawUrl || '').trim();
  if (!url) return { provider: null, embedUrl: null };
  const spotifyMatch = url.match(
    /open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|playlist|album)\/([a-zA-Z0-9]+)/i
  );
  if (spotifyMatch) {
    return {
      provider: 'SPOTIFY',
      embedUrl: `https://open.spotify.com/embed/${spotifyMatch[1].toLowerCase()}/${spotifyMatch[2]}?utm_source=generator&theme=0`,
    };
  }
  const ytMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|music\.youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{6,})/i
  );
  if (ytMatch) {
    return {
      provider: 'YOUTUBE',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}?rel=0`,
    };
  }
  return { provider: null, embedUrl: null };
}

export function getEffectiveMusicPlaylist(settings: WeddingSettings): MusicTrackItem[] {
  if (Array.isArray(settings.musicPlaylist) && settings.musicPlaylist.length > 0) {
    return settings.musicPlaylist;
  }
  return DEFAULT_MUSIC_PLAYLIST;
}

export interface TrackAudioMeta {
  status: 'loading' | 'ready' | 'error';
  durationSec: number;
  probedUrl?: string;
}

export function formatAudioDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) return '00:00';
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

// Hybrid Audio Player: supports custom uploaded/URL MP3/M4A/WAV/OGG tracks + 3 Romantic Web Audio Synth tracks
class AmbientWeddingPlayer {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private audioEl: HTMLAudioElement | null = null;
  private currentAudioSrc = '';
  private isPlaying = false;
  private hasManualPreview = false;
  private step = 0;
  private volume = 75; // 0 to 100
  private isMuted = false;
  private playlist: MusicTrackItem[] = [...DEFAULT_MUSIC_PLAYLIST];
  private currentTrackId: string = DEFAULT_MUSIC_PLAYLIST[0].id;
  private trackMetaMap: Map<string, TrackAudioMeta> = new Map();
  private probingIds: Set<string> = new Set();
  private listeners: Set<() => void> = new Set();

  // 3 Romantic Synth Melodies (frequencies in Hz)
  private synthMelodies: Record<string, { notes: number[]; intervalMs: number; wave: OscillatorType }> = {
    'synth:canon-in-d': {
      intervalMs: 650,
      wave: 'sine',
      notes: [
        293.66, 440.0, 587.33, 739.99, // D major (D4, A4, D5, F#5)
        220.0, 329.63, 440.0, 659.25,  // A major (A3, E4, A4, E5)
        246.94, 369.99, 493.88, 587.33, // B minor (B3, F#4, B4, D5)
        185.0, 277.18, 369.99, 554.37, // F# minor (F#3, C#4, F#4, C#5)
        196.0, 293.66, 392.0, 587.33,  // G major (G3, D4, G4, D5)
        146.83, 220.0, 293.66, 440.0,  // D major low (D3, A3, D4, A4)
        196.0, 293.66, 392.0, 493.88,  // G major (G3, D4, G4, B4)
        220.0, 329.63, 440.0, 554.37,  // A major (A3, E4, A4, C#5)
      ],
    },
    'synth:thousand-years': {
      intervalMs: 560,
      wave: 'triangle',
      notes: [
        233.08, 293.66, 349.23, 466.16, 587.33, 466.16, // Bb major arpeggio
        174.61, 220.0, 261.63, 349.23, 440.0, 349.23,   // F major
        196.0, 233.08, 293.66, 392.0, 466.16, 392.0,    // G minor
        155.56, 196.0, 233.08, 311.13, 392.0, 349.23,   // Eb major -> F
      ],
    },
    'synth:beautiful-in-white': {
      intervalMs: 600,
      wave: 'sine',
      notes: [
        261.63, 329.63, 392.0, 523.25, // C major
        196.0, 246.94, 293.66, 493.88, // G major
        220.0, 261.63, 329.63, 440.0,  // A minor
        174.61, 220.0, 261.63, 349.23, // F major
        261.63, 329.63, 392.0, 493.88, // C maj7
        196.0, 293.66, 392.0, 440.0,   // G sus
      ],
    },
  };

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((fn) => {
      try {
        fn();
      } catch {
        // Ignore
      }
    });
  }

  private probePlaylistMetadata(list: MusicTrackItem[]): void {
    if (typeof window === 'undefined') return;
    // Purge deleted track IDs from metadata cache
    const validIds = new Set(list.map((t) => t.id));
    Array.from(this.trackMetaMap.keys()).forEach((id) => {
      if (!validIds.has(id)) {
        this.trackMetaMap.delete(id);
        this.probingIds.delete(id);
      }
    });

    list.forEach((track) => {
      if (!track.url || track.url.startsWith('synth:')) {
        this.trackMetaMap.set(track.id, {
          status: 'ready',
          durationSec: 180,
          probedUrl: track.url,
        });
        return;
      }
      const existing = this.trackMetaMap.get(track.id);
      if (
        existing &&
        existing.probedUrl === track.url &&
        (existing.status === 'ready' || existing.status === 'error')
      ) {
        return;
      }
      if (this.probingIds.has(track.id) && existing?.probedUrl === track.url) {
        return;
      }
      this.probingIds.add(track.id);
      this.trackMetaMap.set(track.id, {
        status: 'loading',
        durationSec: 0,
        probedUrl: track.url,
      });
      try {
        const probe = new window.Audio();
        probe.preload = 'metadata';
        probe.onloadedmetadata = () => {
          this.probingIds.delete(track.id);
          const dur = Number.isFinite(probe.duration) ? probe.duration : 0;
          this.trackMetaMap.set(track.id, {
            status: dur > 0 ? 'ready' : 'error',
            durationSec: dur,
            probedUrl: track.url,
          });
          this.notify();
        };
        probe.onerror = () => {
          this.probingIds.delete(track.id);
          this.trackMetaMap.set(track.id, {
            status: 'error',
            durationSec: 0,
            probedUrl: track.url,
          });
          this.notify();
        };
        probe.src = track.url;
      } catch {
        this.probingIds.delete(track.id);
        this.trackMetaMap.set(track.id, {
          status: 'error',
          durationSec: 0,
          probedUrl: track.url,
        });
      }
    });
  }

  public getTrackMeta(trackId: string): TrackAudioMeta {
    return (
      this.trackMetaMap.get(trackId) || {
        status: 'loading',
        durationSec: 0,
      }
    );
  }

  public syncFromSettings(settings: WeddingSettings): void {
    const list = getEffectiveMusicPlaylist(settings);
    this.playlist = list;
    this.probePlaylistMetadata(list);

    if (typeof settings.musicVolume === 'number' && Number.isFinite(settings.musicVolume)) {
      const rawVol =
        settings.musicVolume > 0 && settings.musicVolume <= 5
          ? settings.musicVolume === 1
            ? 80
            : Math.round(settings.musicVolume * 100)
          : settings.musicVolume;
      this.volume = Math.max(0, Math.min(100, rawVol));
      if (this.audioEl) {
        this.audioEl.volume = this.isMuted ? 0 : this.volume / 100;
      }
    }

    if (list.length === 0) {
      this.stop();
      this.currentTrackId = '';
      this.currentAudioSrc = '';
      if (this.audioEl) {
        try {
          this.audioEl.removeAttribute('src');
          this.audioEl.load();
        } catch {
          // Ignore
        }
      }
      this.notify();
      return;
    }

    const desiredId = settings.activeMusicTrackId;
    if (!list.some((t) => t.id === this.currentTrackId)) {
      // Current track was removed from playlist: completely clear old audio buffer
      this.hasManualPreview = false;
      this.pauseHtmlAudio();
      this.clearSynthTimer();
      this.currentAudioSrc = '';
      if (this.audioEl) {
        try {
          this.audioEl.removeAttribute('src');
          this.audioEl.load();
        } catch {
          // Ignore
        }
      }
      if (desiredId && list.some((t) => t.id === desiredId)) {
        this.currentTrackId = desiredId;
      } else {
        this.currentTrackId = list[0].id;
      }
      if (this.isPlaying) {
        this.restartCurrentTrack();
      }
    } else {
      if (
        !this.isPlaying &&
        !this.hasManualPreview &&
        desiredId &&
        list.some((t) => t.id === desiredId)
      ) {
        this.currentTrackId = desiredId;
      }
      // If the active track's URL changed (e.g., healed or replaced in cloud), switch audio source immediately
      const currentObj = list.find((t) => t.id === this.currentTrackId);
      if (
        currentObj &&
        this.currentAudioSrc &&
        this.currentAudioSrc !== currentObj.url
      ) {
        this.currentAudioSrc = '';
        if (this.isPlaying) {
          this.restartCurrentTrack();
        }
      }
    }
    this.notify();
  }

  public getPlaylist(): MusicTrackItem[] {
    return this.playlist;
  }

  public getCurrentTrack(): MusicTrackItem | null {
    if (this.playlist.length === 0) return null;
    return (
      this.playlist.find((t) => t.id === this.currentTrackId) || this.playlist[0] || null
    );
  }

  public getCurrentTime(): number {
    const track = this.getCurrentTrack();
    if (!track || !track.url || track.url.startsWith('synth:')) {
      return this.isPlaying ? (this.step % 180) : 0;
    }
    if (this.audioEl && Number.isFinite(this.audioEl.currentTime)) {
      return this.audioEl.currentTime;
    }
    return 0;
  }

  public getDuration(): number {
    const track = this.getCurrentTrack();
    if (!track) return 0;
    if (!track.url || track.url.startsWith('synth:')) {
      return 180;
    }
    if (
      this.audioEl &&
      this.currentAudioSrc === track.url &&
      Number.isFinite(this.audioEl.duration) &&
      this.audioEl.duration > 0
    ) {
      return this.audioEl.duration;
    }
    return this.trackMetaMap.get(track.id)?.durationSec || 0;
  }

  public seek(seconds: number): void {
    const track = this.getCurrentTrack();
    if (!track || !track.url || track.url.startsWith('synth:')) return;
    if (this.audioEl && this.currentAudioSrc === track.url) {
      const dur = this.getDuration();
      const clamped = Math.max(0, dur > 0 ? Math.min(dur, seconds) : seconds);
      try {
        this.audioEl.currentTime = clamped;
        this.notify();
      } catch {
        // Ignore seek error if not ready
      }
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setVolume(vol0to100: number): void {
    this.volume = Math.max(0, Math.min(100, Math.round(vol0to100)));
    if (this.volume > 0 && this.isMuted) {
      this.isMuted = false;
    }
    if (this.audioEl) {
      this.audioEl.volume = this.isMuted ? 0 : this.volume / 100;
    }
    this.notify();
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.audioEl) {
      this.audioEl.volume = this.isMuted ? 0 : this.volume / 100;
    }
    this.notify();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  private clearSynthTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private pauseHtmlAudio(): void {
    if (this.audioEl) {
      try {
        this.audioEl.pause();
      } catch {
        // Ignore
      }
    }
  }

  private ensureAudioEl(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioEl) {
      this.audioEl = new window.Audio();
      this.audioEl.preload = 'auto';
      this.audioEl.ontimeupdate = () => {
        this.notify();
      };
      this.audioEl.onloadedmetadata = () => {
        if (
          this.audioEl &&
          Number.isFinite(this.audioEl.duration) &&
          this.audioEl.duration > 0
        ) {
          this.trackMetaMap.set(this.currentTrackId, {
            status: 'ready',
            durationSec: this.audioEl.duration,
          });
        }
        this.notify();
      };
      this.audioEl.onerror = () => {
        this.trackMetaMap.set(this.currentTrackId, {
          status: 'error',
          durationSec: 0,
        });
        this.isPlaying = false;
        this.notify();
      };
      this.audioEl.onended = () => {
        if (this.playlist.length > 1) {
          this.nextTrack();
        } else if (this.audioEl) {
          this.audioEl.currentTime = 0;
          void this.audioEl.play().catch(() => {});
        }
      };
    }
    return this.audioEl;
  }

  private restartCurrentTrack(): boolean {
    if (typeof window === 'undefined') return false;
    const track = this.getCurrentTrack();
    if (!track) {
      this.stop();
      return false;
    }

    const isSynth = !track.url || track.url.startsWith('synth:');
    if (isSynth) {
      this.pauseHtmlAudio();
      this.clearSynthTimer();
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        if (!this.ctx) {
          this.ctx = new AudioCtx();
        }
        if (this.ctx.state === 'suspended') {
          void this.ctx.resume();
        }
        const melody =
          this.synthMelodies[track.url] || this.synthMelodies['synth:canon-in-d'];
        this.isPlaying = true;
        this.playTick();
        this.timer = window.setInterval(() => this.playTick(), melody.intervalMs);
        this.notify();
        return true;
      } catch {
        return false;
      }
    } else {
      // Real HTML5 Audio (uploaded MP3 data URL or external URL)
      this.clearSynthTimer();
      const audio = this.ensureAudioEl();
      if (!audio) return false;
      try {
        if (this.currentAudioSrc !== track.url) {
          this.currentAudioSrc = track.url;
          audio.src = track.url;
        }
        audio.volume = this.isMuted ? 0 : this.volume / 100;
        this.isPlaying = true;
        void audio.play().catch(() => {
          this.isPlaying = false;
          this.notify();
        });
        this.notify();
        return true;
      } catch {
        return false;
      }
    }
  }

  public start(): boolean {
    if (typeof window === 'undefined') return false;
    if (this.isPlaying) return true;
    return this.restartCurrentTrack();
  }

  public stop(): void {
    this.isPlaying = false;
    this.clearSynthTimer();
    this.pauseHtmlAudio();
    this.notify();
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    }
    return this.start();
  }

  public playTrack(trackId: string): boolean {
    const found = this.playlist.find((t) => t.id === trackId);
    if (!found) return false;
    const changed = this.currentTrackId !== found.id;
    this.currentTrackId = found.id;
    this.hasManualPreview = true;
    this.step = 0;
    if (changed && this.audioEl) {
      this.audioEl.currentTime = 0;
    }
    return this.restartCurrentTrack();
  }

  public nextTrack(): void {
    if (this.playlist.length === 0) return;
    const idx = this.playlist.findIndex((t) => t.id === this.currentTrackId);
    const nextIdx = idx >= 0 ? (idx + 1) % this.playlist.length : 0;
    this.playTrack(this.playlist[nextIdx].id);
  }

  public prevTrack(): void {
    if (this.playlist.length === 0) return;
    const idx = this.playlist.findIndex((t) => t.id === this.currentTrackId);
    const prevIdx =
      idx >= 0 ? (idx - 1 + this.playlist.length) % this.playlist.length : 0;
    this.playTrack(this.playlist[prevIdx].id);
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  private playTick(): void {
    if (!this.ctx || !this.isPlaying) return;
    if (this.isMuted || this.volume <= 0) {
      this.step += 1;
      return;
    }
    try {
      const track = this.getCurrentTrack();
      const melody =
        this.synthMelodies[track?.url || 'synth:canon-in-d'] ||
        this.synthMelodies['synth:canon-in-d'];
      const now = this.ctx.currentTime;
      const freq = melody.notes[this.step % melody.notes.length];
      this.step += 1;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = melody.wave;
      osc.frequency.setValueAtTime(freq, now);

      const peakGain = Math.max(0.002, (this.volume / 100) * 0.085);
      gain.gain.setValueAtTime(0.0008, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0006, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);
    } catch {
      // Ignore audio tick errors
    }
  }
}

export const weddingMusicPlayer = new AmbientWeddingPlayer();

const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatDateTimeToIndonesianLabels(isoOrLocal: string): {
  dateLabel: string;
  timeLabel: string;
} {
  try {
    const clean = (isoOrLocal || '').slice(0, 16);
    const [datePart, timePart] = clean.split('T');
    if (!datePart) {
      return {
        dateLabel: 'Sabtu, 19 Desember 2026',
        timeLabel: '09.00 WIB - Selesai',
      };
    }
    const [y, m, d] = datePart.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const dayName = HARI_INDONESIA[dt.getDay()] || 'Sabtu';
    const monthName = BULAN_INDONESIA[(m || 1) - 1] || 'Desember';
    const formattedTime = (timePart || '09:00').replace(':', '.');
    return {
      dateLabel: `${dayName}, ${d} ${monthName} ${y}`,
      timeLabel: `${formattedTime} WIB - Selesai`,
    };
  } catch {
    return {
      dateLabel: 'Sabtu, 19 Desember 2026',
      timeLabel: '09.00 WIB - Selesai',
    };
  }
}

export function getEffectiveScheduleEvents(
  settings: WeddingSettings
): WeddingScheduleEvent[] {
  if (Array.isArray(settings.scheduleEvents)) {
    if (settings.scheduleEvents.length > 0) {
      const events = settings.scheduleEvents;
      const hasExplicitMain = events.some((e) => e.isMainEvent === true);
      if (hasExplicitMain) {
        return events;
      }
      const regexMatchIdx = events.findIndex((e) =>
        /pemberkatan|akad|utama/i.test(`${e.title} ${e.badge}`)
      );
      const mainIdx = regexMatchIdx >= 0 ? regexMatchIdx : events[1] ? 1 : 0;
      return events.map((ev, idx) => ({
        ...ev,
        isMainEvent: idx === mainIdx,
      }));
    }
    return settings.scheduleEvents;
  }

  return [
    {
      id: 'ev-default-1',
      title: settings.event1Title || 'Acara Biston / Pertemuan Keluarga',
      badge: 'Acara 1 • Keluarga',
      subtitle:
        settings.event1Subtitle ||
        'Pertemuan hangat keluarga besar kedua mempelai',
      datetime: settings.bistonDatetime || '2026-12-18T18:00:00+07:00',
      dateLabel: settings.event1DateLabel || 'Jumat, 18 Desember 2026',
      timeLabel: settings.event1TimeLabel || '18.00 WIB - Selesai',
      venue: settings.event1Venue || 'Lokasi Biston Semarang',
      address: settings.event1Address || 'Semarang, Jawa Tengah',
      mapsUrl: settings.event1MapsUrl || 'https://maps.google.com',
      dresscode: settings.event1Dresscode || 'Batik / Formal Rapi',
      enableCountdown: true,
      showOnInvitation: settings.showEvent1 !== false,
      isMainEvent: false,
    },
    {
      id: 'ev-default-2',
      title: settings.event2Title || 'Ibadah Pemberkatan Pernikahan',
      badge: 'Pemberkatan / Akad',
      subtitle:
        settings.event2Subtitle || 'Peneguhan & Pemberkatan Nikah Kudus',
      datetime: settings.weddingDatetime || '2026-12-19T09:00:00+07:00',
      dateLabel: settings.event2DateLabel || 'Sabtu, 19 Desember 2026',
      timeLabel: settings.event2TimeLabel || '09.00 WIB - Selesai',
      venue: settings.event2Venue || 'Gereja di Semarang',
      address: settings.event2Address || 'Semarang, Jawa Tengah',
      mapsUrl: settings.event2MapsUrl || 'https://maps.google.com',
      dresscode: settings.event2Dresscode || 'Kebaya / Jas Formal',
      enableCountdown: true,
      showOnInvitation: settings.showEvent2 !== false,
      isMainEvent: true,
    },
    {
      id: 'ev-default-3',
      title: settings.event3Title || 'Resepsi Pernikahan',
      badge: 'Resepsi Utama',
      subtitle:
        settings.event3Subtitle || 'Ramah Tamah & Jamuan Syukur Pernikahan',
      datetime: '2026-12-19T18:30:00+07:00',
      dateLabel: settings.event3DateLabel || 'Sabtu, 19 Desember 2026',
      timeLabel: settings.event3TimeLabel || '18.30 WIB - Selesai',
      venue: settings.event3Venue || 'Gedung Resepsi Semarang',
      address: settings.event3Address || 'Semarang, Jawa Tengah',
      mapsUrl: settings.event3MapsUrl || 'https://maps.google.com',
      dresscode: settings.event3Dresscode || 'Formal / Batik Elegan',
      enableCountdown: false,
      showOnInvitation: settings.showEvent3 !== false,
      isMainEvent: false,
    },
  ];
}

export function buildScheduleSummarySubtitle(
  events: WeddingScheduleEvent[],
  originCity?: string
): string {
  const activeEvents = events.filter((e) => e.showOnInvitation !== false);
  const sourceEvents = activeEvents.length > 0 ? activeEvents : events;
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

  const city = (originCity || 'Semarang').trim();
  if (city && !parts.some((p) => p.toLowerCase().includes(city.toLowerCase()))) {
    parts.push(city);
  }
  return parts.join(' • ');
}

export function syncScheduleEventsToSettings(
  settings: WeddingSettings,
  events: WeddingScheduleEvent[]
): WeddingSettings {
  let normalizedEvents = events;
  if (events.length > 0 && !events.some((e) => e.isMainEvent === true)) {
    const regexMatchIdx = events.findIndex((e) =>
      /pemberkatan|akad|utama/i.test(`${e.title} ${e.badge}`)
    );
    const mainIdx = regexMatchIdx >= 0 ? regexMatchIdx : events[1] ? 1 : 0;
    normalizedEvents = events.map((ev, idx) => ({
      ...ev,
      isMainEvent: idx === mainIdx,
    }));
  }

  const next: WeddingSettings = {
    ...settings,
    scheduleEvents: normalizedEvents,
  };

  const mainEvent =
    normalizedEvents.find((e) => e.isMainEvent) ||
    normalizedEvents.find((e) =>
      /pemberkatan|akad|utama/i.test(e.title + ' ' + e.badge)
    ) ||
    normalizedEvents[1] ||
    normalizedEvents[0];

  const ev1 = normalizedEvents[0];
  const ev2 = normalizedEvents[1];
  const ev3 = normalizedEvents[2];

  if (ev1) {
    next.event1Title = ev1.title;
    next.event1Subtitle = ev1.subtitle;
    next.event1DateLabel = ev1.dateLabel;
    next.event1TimeLabel = ev1.timeLabel;
    next.event1Venue = ev1.venue;
    next.event1Address = ev1.address;
    next.event1MapsUrl = ev1.mapsUrl;
    next.event1Dresscode = ev1.dresscode;
    next.bistonDatetime = ev1.datetime;
    next.showEvent1 = ev1.showOnInvitation !== false;
  } else {
    next.showEvent1 = false;
  }

  if (ev2) {
    next.event2Title = ev2.title;
    next.event2Subtitle = ev2.subtitle;
    next.event2DateLabel = ev2.dateLabel;
    next.event2TimeLabel = ev2.timeLabel;
    next.event2Venue = ev2.venue;
    next.event2Address = ev2.address;
    next.event2MapsUrl = ev2.mapsUrl;
    next.event2Dresscode = ev2.dresscode;
    next.weddingDatetime = ev2.datetime;
    next.showEvent2 = ev2.showOnInvitation !== false;
  } else if (ev1) {
    next.weddingDatetime = ev1.datetime;
    next.showEvent2 = false;
  }

  if (ev3) {
    next.event3Title = ev3.title;
    next.event3Subtitle = ev3.subtitle;
    next.event3DateLabel = ev3.dateLabel;
    next.event3TimeLabel = ev3.timeLabel;
    next.event3Venue = ev3.venue;
    next.event3Address = ev3.address;
    next.event3MapsUrl = ev3.mapsUrl;
    next.event3Dresscode = ev3.dresscode;
    next.showEvent3 = ev3.showOnInvitation !== false;
  } else {
    next.showEvent3 = false;
  }

  // Ensure weddingDatetime reflects the primary countdown event if one is enabled
  const countdownEvents = normalizedEvents.filter((e) => e.enableCountdown);
  if (countdownEvents.length > 0) {
    const mainCountdown =
      countdownEvents.find((e) => e.isMainEvent) ||
      countdownEvents.find((e) =>
        /pemberkatan|akad|utama/i.test(e.title + ' ' + e.badge)
      ) ||
      countdownEvents[countdownEvents.length - 1];
    if (mainCountdown?.datetime) {
      next.weddingDatetime = mainCountdown.datetime;
    }
    if (countdownEvents[0]?.datetime) {
      next.bistonDatetime = countdownEvents[0].datetime;
    }
  }

  if (mainEvent) {
    next.weddingDatetime = mainEvent.datetime || next.weddingDatetime;
  }

  const prevHadVisible = Array.isArray(settings.scheduleEvents)
    ? settings.scheduleEvents.some((e) => e.showOnInvitation !== false)
    : true;
  const nowHasVisible = normalizedEvents.some(
    (e) => e.showOnInvitation !== false
  );
  next.showScheduleSection =
    settings.showScheduleSection === false && prevHadVisible
      ? false
      : nowHasVisible;

  // Automatically sync cover & schedule summary subtitle with the current schedule events
  const computedSubtitle = buildScheduleSummarySubtitle(
    normalizedEvents,
    next.groomOrigin || next.brideOrigin || 'Semarang'
  );
  if (computedSubtitle) {
    next.subtitle = computedSubtitle;
  }

  return next;
}

export function getPhotoAdjustStyle(adj?: PhotoAdjustment):
  | {
      objectFit?: 'cover' | 'contain';
      transformOrigin: string;
      transform: string;
    }
  | undefined {
  if (!adj || adj.baked) return undefined;
  const zoom = Number.isFinite(adj.zoom) ? adj.zoom : 1;
  const x = Number.isFinite(adj.x) ? adj.x : 0;
  const y = Number.isFinite(adj.y) ? adj.y : 0;
  const rot = Number.isFinite(adj.rotation) ? (adj.rotation || 0) : 0;
  const flipX = Boolean(adj.flipX);
  const fitMode = adj.fitMode || 'cover';

  if (zoom === 1 && x === 0 && y === 0 && rot === 0 && !flipX && fitMode === 'cover') {
    return undefined;
  }

  const scaleX = flipX ? -zoom : zoom;
  const scaleY = zoom;
  return {
    objectFit: fitMode,
    transformOrigin: 'center center',
    transform: `translate3d(${x}%, ${y}%, 0) rotate(${rot}deg) scale(${scaleX}, ${scaleY})`,
  };
}

export function resolveStageAspectRatio(
  shape: 'circle' | 'banner' | 'portrait' | 'gallery',
  aspectPref?: PhotoAdjustment['aspectRatio']
): number {
  if (aspectPref === '1:1') return 1;
  if (aspectPref === '16:9') return 16 / 9;
  if (aspectPref === '4:3') return 4 / 3;
  if (aspectPref === '3:4') return 3 / 4;
  if (aspectPref === '9:16') return 9 / 16;

  // 'auto' or 'free' default stage aspect ratio based on target slot
  if (shape === 'circle') return 1;
  if (shape === 'banner') return 16 / 9;
  if (shape === 'gallery') return 16 / 9;
  if (shape === 'portrait') return 9 / 16;
  return 4 / 3;
}

export function drawStagePhotoOnContext(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  adj: PhotoAdjustment,
  stageW: number,
  stageH: number,
  offsetX = 0,
  offsetY = 0
): void {
  const imgW = img.naturalWidth || img.width || 1;
  const imgH = img.naturalHeight || img.height || 1;
  const rot = (((adj.rotation || 0) % 360) + 360) % 360;
  const isRotated90 = rot === 90 || rot === 270;
  const effW = isRotated90 ? imgH : imgW;
  const effH = isRotated90 ? imgW : imgH;

  const fitMode = adj.fitMode || 'cover';
  const baseScale =
    fitMode === 'contain'
      ? Math.min(stageW / effW, stageH / effH)
      : Math.max(stageW / effW, stageH / effH);

  const zoom = Number.isFinite(adj.zoom) ? Math.max(0.2, adj.zoom) : 1;
  const finalScale = baseScale * zoom;

  const panX = ((Number.isFinite(adj.x) ? adj.x : 0) / 100) * stageW;
  const panY = ((Number.isFinite(adj.y) ? adj.y : 0) / 100) * stageH;

  const cx = offsetX + stageW / 2 + panX;
  const cy = offsetY + stageH / 2 + panY;

  ctx.save();
  ctx.translate(cx, cy);
  if (rot !== 0) {
    ctx.rotate((rot * Math.PI) / 180);
  }
  ctx.scale(adj.flipX ? -finalScale : finalScale, finalScale);
  ctx.drawImage(img, -imgW / 2, -imgH / 2, imgW, imgH);
  ctx.restore();
}

export function wrapRasterDataUrlInSvg(
  rasterDataUrl: string,
  width: number,
  height: number
): string {
  if (!rasterDataUrl || rasterDataUrl.startsWith('data:image/svg+xml')) {
    return rasterDataUrl;
  }
  const w = Math.max(1, Math.round(width || 1200));
  const h = Math.max(1, Math.round(height || 1200));
  const svgMarkup = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"><image width="${w}" height="${h}" preserveAspectRatio="none" href="${rasterDataUrl}" xlink:href="${rasterDataUrl}"/></svg>`;
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
    try {
      return `data:image/svg+xml;base64,${window.btoa(svgMarkup)}`;
    } catch {
      return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
    }
  }
  return `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
}

export function unwrapSvgEmbeddedRasterUrl(url: string): string {
  if (!url || typeof url !== 'string') return url;
  if (url.startsWith('data:image/svg+xml')) {
    try {
      const commaIdx = url.indexOf(',');
      if (commaIdx === -1) return url;
      const header = url.slice(0, commaIdx).toLowerCase();
      const body = url.slice(commaIdx + 1);
      const decodedSvg =
        header.includes(';base64') &&
        typeof window !== 'undefined' &&
        typeof window.atob === 'function'
          ? window.atob(body)
          : decodeURIComponent(body);
      const match = decodedSvg.match(
        /href=["'](data:image\/(?:webp|jpeg|jpg|png|avif);base64,[^"']+)["']/i
      );
      if (match && match[1]) {
        return match[1];
      }
    } catch {
      return url;
    }
  }
  return url;
}

export function extractEmbeddedJpegFromRawBuffer(
  buffer: ArrayBuffer
): Blob | null {
  try {
    const bytes = new Uint8Array(buffer);
    const len = bytes.length;
    if (len < 16384) return null;

    let bestStart = -1;
    let bestEnd = -1;
    let bestLen = 0;

    for (let i = 0; i < len - 3; i++) {
      // Look for JPEG SOI marker (0xFF 0xD8 0xFF) followed by standard APP/DQT/SOF markers (0xE0..0xEF, 0xDB, 0xC0, 0xC4)
      if (
        bytes[i] === 0xff &&
        bytes[i + 1] === 0xd8 &&
        bytes[i + 2] === 0xff &&
        ((bytes[i + 3] >= 0xe0 && bytes[i + 3] <= 0xef) ||
          bytes[i + 3] === 0xdb ||
          bytes[i + 3] === 0xc0 ||
          bytes[i + 3] === 0xc4)
      ) {
        const startIdx = i;
        let endIdx = -1;
        // Scan forward for EOI marker (0xFF 0xD9)
        for (let j = i + 4; j < len - 1; j++) {
          if (bytes[j] === 0xff && bytes[j + 1] === 0xd9) {
            endIdx = j + 2;
            const segLen = endIdx - startIdx;
            if (segLen > 16384 && segLen > bestLen) {
              bestStart = startIdx;
              bestEnd = endIdx;
              bestLen = segLen;
            }
          }
          // Stop scanning a single candidate if it exceeds 18 MB
          if (j - startIdx > 18 * 1024 * 1024) break;
        }
        if (endIdx > startIdx + 65536) {
          i = endIdx - 1;
        }
      }
    }

    if (bestStart >= 0 && bestEnd > bestStart && bestLen > 16384) {
      return new Blob([bytes.subarray(bestStart, bestEnd)], {
        type: 'image/jpeg',
      });
    }
    return null;
  } catch {
    return null;
  }
}

export async function exportCroppedPhotoDataUrl(
  imageUrl: string,
  adj: PhotoAdjustment,
  shape: 'circle' | 'banner' | 'portrait' | 'gallery',
  maxOutputDimension = shape === 'circle' ? 1080 : shape === 'gallery' ? 1500 : 1600,
  quality = 0.88
): Promise<string> {
  return new Promise((resolve, reject) => {
    const effectiveSourceUrl = unwrapSvgEmbeddedRasterUrl(imageUrl);
    const img = new window.Image();
    if (!effectiveSourceUrl.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onerror = () => reject(new Error('Gagal memuat gambar untuk dipotong (crop).'));
    img.onload = () => {
      try {
        const stageAspect = resolveStageAspectRatio(shape, adj.aspectRatio);
        const crop = adj.cropBox || { x: 0, y: 0, w: 100, h: 100 };
        const safeCropW = Math.max(10, Math.min(100, crop.w));
        const safeCropH = Math.max(10, Math.min(100, crop.h));
        const safeCropX = Math.max(0, Math.min(100 - safeCropW, crop.x));
        const safeCropY = Math.max(0, Math.min(100 - safeCropH, crop.y));

        // Base virtual stage dimensions
        let virtualStageW = 1600;
        let virtualStageH = Math.round(virtualStageW / stageAspect);
        if (virtualStageH > 2000) {
          virtualStageH = 2000;
          virtualStageW = Math.round(virtualStageH * stageAspect);
        }

        // Output dimensions proportional to the cropBox on the virtual stage
        let outW = Math.round(virtualStageW * (safeCropW / 100));
        let outH = Math.round(virtualStageH * (safeCropH / 100));

        // Scale output dimensions up/down so longest side is maxOutputDimension
        const maxSide = Math.max(outW, outH, 1);
        const scaleFactor = maxOutputDimension / maxSide;
        outW = Math.max(128, Math.round(outW * scaleFactor));
        outH = Math.max(128, Math.round(outH * scaleFactor));
        const scaledStageW = virtualStageW * scaleFactor;
        const scaledStageH = virtualStageH * scaleFactor;

        const canvas = document.createElement('canvas');
        canvas.width = outW;
        canvas.height = outH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context tidak tersedia.'));
          return;
        }

        // Fill subtle dark/ivory background in case user zoomed out or used contain mode
        ctx.fillStyle = shape === 'circle' ? '#FAF8F5' : '#1C1917';
        ctx.fillRect(0, 0, outW, outH);

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        const offsetX = -(safeCropX / 100) * scaledStageW;
        const offsetY = -(safeCropY / 100) * scaledStageH;

        drawStagePhotoOnContext(
          ctx,
          img,
          adj,
          scaledStageW,
          scaledStageH,
          offsetX,
          offsetY
        );

        let q = quality;
        let croppedDataUrl = canvas.toDataURL('image/webp', q);
        const useWebp = croppedDataUrl.startsWith('data:image/webp');
        if (!useWebp) {
          croppedDataUrl = canvas.toDataURL('image/jpeg', q);
        }

        while (croppedDataUrl.length > 520_000 && q > 0.52) {
          q = Math.max(0.52, Number((q - 0.08).toFixed(2)));
          croppedDataUrl = canvas.toDataURL(
            useWebp ? 'image/webp' : 'image/jpeg',
            q
          );
        }

        resolve(wrapRasterDataUrlInSvg(croppedDataUrl, outW, outH));
      } catch (err) {
        reject(err);
      }
    };
    img.src = effectiveSourceUrl;
  });
}

export const DEFAULT_LOVE_STORY_ITEMS: LoveStoryItem[] = [
  {
    id: 'story-default-1',
    dateLabel: '2022',
    title: 'Pertemuan Pertama',
    location: 'Semarang',
    description:
      'Awal mula perkenalan yang membawa kami saling mengenal lebih dekat dalam doa dan pengharapan.',
  },
  {
    id: 'story-default-2',
    dateLabel: '2024',
    title: 'Komitmen Bersama',
    location: 'Jakarta',
    description:
      'Menjalani suka duka bersama, saling menguatkan, dan memantapkan hati untuk melangkah ke jenjang serius.',
  },
  {
    id: 'story-default-3',
    dateLabel: 'Desember 2026',
    title: 'Ikatan Suci Pernikahan',
    location: 'Semarang',
    description:
      'Dengan berkat Tuhan serta doa restu kedua orang tua dan keluarga besar, kami mengikat janji suci pernikahan.',
  },
];

export const DEFAULT_GALLERY_PHOTOS: GalleryPhotoItem[] = [
  {
    id: 'gal-default-1',
    title: 'Golden Sunset Silhouette',
    caption: 'Momen keemasan yang abadi dalam bingkai kasih dan doa.',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    category: 'Prewedding',
  },
  {
    id: 'gal-default-2',
    title: 'Sacred Promises',
    caption: 'Melangkah berdua menuju hari bahagia yang telah dinantikan.',
    imageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
    category: 'Momen Bersama',
  },
  {
    id: 'gal-default-3',
    title: 'Timeless Elegance',
    caption: 'Setiap detik bersama adalah anugerah terindah.',
    imageUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85',
    category: 'Prewedding',
  },
  {
    id: 'gal-default-4',
    title: 'Forever Begins Here',
    caption: 'Menyatukan dua hati dalam satu ikatan suci selamanya.',
    imageUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85',
    category: 'Momen Bersama',
  },
];

export function getEffectiveLoveStory(settings: WeddingSettings): LoveStoryItem[] {
  if (Array.isArray(settings.loveStory)) {
    return settings.loveStory;
  }
  return [];
}

export function getEffectiveGalleryPhotos(settings: WeddingSettings): GalleryPhotoItem[] {
  if (Array.isArray(settings.galleryPhotos)) {
    return settings.galleryPhotos;
  }
  return [];
}

export const DEFAULT_BLOCKED_KEYWORDS: string[] = [
  'anjing',
  'anjir',
  'anjrit',
  'babi',
  'bangsat',
  'bajingan',
  'brengsek',
  'kampret',
  'tolol',
  'goblok',
  'bodoh',
  'idiot',
  'sinting',
  'tai',
  'taik',
  'kontol',
  'memek',
  'ngentot',
  'asu',
  'jancok',
  'jancuk',
  'pelakor',
  'pebinor',
  'selingkuh',
  'zina',
  'hamil duluan',
  'batal nikah',
  'cepat cerai',
  'kawin kontrak',
  'bayar utang',
  'bayar hutang',
  'penipu',
  'nipu',
  'maling',
  'laknat',
  'mampus',
  'mati aja',
  'najis',
  'sampah',
  'fuck',
  'shit',
  'bitch',
  'bastard',
  'judol',
  'slot gacor',
  'pinjol',
];

export interface WishModerationAnalysis {
  isNegative: boolean;
  isSpoofedIdentity: boolean;
  matchedKeywords: string[];
  reasons: string[];
  flaggedReason: string;
}

export function analyzeWishModeration(
  input: {
    guestName?: string;
    message?: string;
    institution?: string;
    originalUrlGuestParam?: string;
    matchedGuestRecordName?: string;
  },
  customKeywordsCsv?: string
): WishModerationAnalysis {
  const extraKeywords = (customKeywordsCsv || '')
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter((k) => k.length >= 2);

  const keywordList = Array.from(
    new Set([...DEFAULT_BLOCKED_KEYWORDS, ...extraKeywords])
  );

  const combinedText = `${input.guestName || ''} ${input.institution || ''} ${
    input.message || ''
  }`.toLowerCase();

  const matchedKeywords: string[] = [];
  for (const kw of keywordList) {
    const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(combinedText)) {
      matchedKeywords.push(kw);
    }
  }

  const reasons: string[] = [];
  if (matchedKeywords.length > 0) {
    reasons.push(`Kata negatif/terlarang: "${matchedKeywords.join(', ')}"`);
  }

  const cleanInputName = (input.guestName || '').trim().toLowerCase();
  const refOwner = (
    input.matchedGuestRecordName ||
    input.originalUrlGuestParam ||
    ''
  ).trim();
  const cleanRefOwner = refOwner.toLowerCase();

  let isSpoofedIdentity = false;
  if (
    cleanInputName &&
    cleanRefOwner &&
    cleanRefOwner !== 'bapak/ibu/saudara/i tamu kehormatan' &&
    cleanInputName !== cleanRefOwner &&
    !cleanRefOwner.includes(cleanInputName) &&
    !cleanInputName.includes(cleanRefOwner)
  ) {
    isSpoofedIdentity = true;
    reasons.push(
      `Anomali identitas: Input nama "${input.guestName?.trim()}" berbeda dengan pemilik link undangan "${refOwner}"`
    );
  }

  const isNegative = matchedKeywords.length > 0;
  return {
    isNegative,
    isSpoofedIdentity,
    matchedKeywords,
    reasons,
    flaggedReason: reasons.join(' • '),
  };
}

export function formatForensicUserAgent(ua?: string, platform?: string): string {
  if (!ua && !platform) return 'Perangkat Web / Browser Tamu';
  const raw = ua || '';
  let os = 'OS Tidak Diketahui';
  if (/android/i.test(raw)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(raw)) os = 'iPhone / iOS';
  else if (/windows/i.test(raw)) os = 'Windows PC';
  else if (/macintosh|mac os x/i.test(raw)) os = 'MacOS';
  else if (/linux/i.test(raw)) os = 'Linux';

  let browser = 'Browser';
  if (/edg\//i.test(raw)) browser = 'Edge';
  else if (/opr\/|opera/i.test(raw)) browser = 'Opera';
  else if (/chrome\//i.test(raw) && !/edg\//i.test(raw)) browser = 'Chrome';
  else if (/safari\//i.test(raw) && !/chrome\//i.test(raw)) browser = 'Safari';
  else if (/firefox\//i.test(raw)) browser = 'Firefox';

  return platform ? `${os} (${browser}) • ${platform}` : `${os} (${browser})`;
}

export function getEffectiveInvitationAnalytics(
  settings?: WeddingSettings,
  guests: WeddingGuest[] = [],
  wishes: GuestWish[] = []
): InvitationAnalyticsData {
  const stored = settings?.invitationAnalytics;
  const deliveredGuestsCount = guests.filter(
    (g) =>
      g.deliveryStatus === 'Sudah Dikirim' ||
      g.deliveryStatus === 'Sudah Diterima'
  ).length;
  const confirmedRsvpCount = Math.max(
    wishes.length,
    guests.filter((g) => g.rsvpStatus !== 'Belum Konfirmasi').length
  );

  if (stored && typeof stored.totalViews === 'number') {
    const waShares = Math.max(stored.waShares || 0, deliveredGuestsCount);
    const linkCopies = stored.linkCopies || 0;
    const totalShares = Math.max(
      stored.totalShares || 0,
      waShares + linkCopies
    );
    const rsvpSubmits = Math.max(stored.rsvpSubmits || 0, confirmedRsvpCount);
    const openCoverClicks = Math.max(
      stored.openCoverClicks || 0,
      rsvpSubmits
    );
    const mapsClicks = stored.mapsClicks || 0;
    const giftCopyClicks = stored.giftCopyClicks || 0;
    const qrisClicks = stored.qrisClicks || 0;
    const totalClicks = Math.max(
      stored.totalClicks || 0,
      openCoverClicks + mapsClicks + giftCopyClicks + qrisClicks + rsvpSubmits
    );
    const totalViews = Math.max(
      stored.totalViews || 0,
      openCoverClicks,
      confirmedRsvpCount
    );
    const uniqueVisitors = Math.max(
      stored.uniqueVisitors || 0,
      Array.isArray(stored.visitedGuestKeys)
        ? stored.visitedGuestKeys.length
        : 0,
      confirmedRsvpCount
    );

    return {
      totalShares,
      waShares,
      linkCopies,
      totalViews,
      uniqueVisitors: Math.min(totalViews, Math.max(1, uniqueVisitors)),
      totalClicks,
      openCoverClicks,
      mapsClicks,
      giftCopyClicks,
      qrisClicks,
      rsvpSubmits,
      visitedGuestKeys: Array.isArray(stored.visitedGuestKeys)
        ? stored.visitedGuestKeys
        : [],
      recentEvents: Array.isArray(stored.recentEvents)
        ? stored.recentEvents
        : [],
      lastUpdatedAt: stored.lastUpdatedAt,
    };
  }

  // Baseline derived from existing guest delivery & wishes when analytics hasn't been initialized yet
  const baseWaShares = deliveredGuestsCount;
  const baseLinkCopies = 0;
  const baseTotalShares = baseWaShares + baseLinkCopies;
  const baseRsvp = confirmedRsvpCount;
  const baseOpenCover = Math.max(baseRsvp, deliveredGuestsCount);
  const baseViews = Math.max(baseOpenCover, baseRsvp);

  const seedEvents: InvitationAnalyticsEvent[] = wishes
    .slice(0, 10)
    .map((w, idx) => ({
      id: `seed_evt_${w.id || idx}`,
      type: 'SUBMIT_RSVP',
      guestName: w.guestName,
      invitationCode: w.invitationCode,
      detail: `Konfirmasi RSVP (${w.rsvpStatus}) & kirim ucapan doa`,
      deviceInfo: formatForensicUserAgent(w.userAgent, w.devicePlatform),
      timestamp: w.createdAt || new Date().toISOString(),
    }));

  return {
    totalShares: baseTotalShares,
    waShares: baseWaShares,
    linkCopies: baseLinkCopies,
    totalViews: baseViews,
    uniqueVisitors: baseViews,
    totalClicks: baseOpenCover + baseRsvp,
    openCoverClicks: baseOpenCover,
    mapsClicks: 0,
    giftCopyClicks: 0,
    qrisClicks: 0,
    rsvpSubmits: baseRsvp,
    visitedGuestKeys: wishes.map((w) =>
      (w.invitationCode || w.guestName || '').toLowerCase()
    ),
    recentEvents: seedEvents,
    lastUpdatedAt: settings?.updatedAt || new Date().toISOString(),
  };
}

export function appendInvitationAnalyticsEvent(
  currentSettings: WeddingSettings,
  input: {
    type: InvitationInteractionType;
    guestName?: string;
    invitationCode?: string;
    detail?: string;
    deviceInfo?: string;
  },
  guests: WeddingGuest[] = [],
  wishes: GuestWish[] = []
): InvitationAnalyticsData {
  const base = getEffectiveInvitationAnalytics(currentSettings, guests, wishes);
  const nowIso = new Date().toISOString();
  const guestKey = (
    input.invitationCode ||
    input.guestName ||
    input.deviceInfo ||
    'anon'
  )
    .trim()
    .toLowerCase();

  const nextVisitedKeys = Array.from(
    new Set([...(base.visitedGuestKeys || []), guestKey])
  ).slice(-300);

  let {
    totalShares,
    waShares,
    linkCopies,
    totalViews,
    uniqueVisitors,
    totalClicks,
    openCoverClicks,
    mapsClicks,
    giftCopyClicks,
    qrisClicks,
    rsvpSubmits,
  } = base;

  if (input.type === 'SHARE_WA') {
    waShares += 1;
    totalShares += 1;
  } else if (input.type === 'COPY_LINK') {
    linkCopies += 1;
    totalShares += 1;
  } else if (input.type === 'PAGE_VIEW') {
    totalViews += 1;
    uniqueVisitors = Math.max(uniqueVisitors, nextVisitedKeys.length);
  } else if (input.type === 'OPEN_COVER') {
    openCoverClicks += 1;
    totalClicks += 1;
    totalViews = Math.max(totalViews, openCoverClicks);
  } else if (input.type === 'CLICK_MAPS') {
    mapsClicks += 1;
    totalClicks += 1;
  } else if (input.type === 'CLICK_GIFT_COPY') {
    giftCopyClicks += 1;
    totalClicks += 1;
  } else if (input.type === 'CLICK_QRIS') {
    qrisClicks += 1;
    totalClicks += 1;
  } else if (input.type === 'SUBMIT_RSVP') {
    rsvpSubmits += 1;
    totalClicks += 1;
  }

  const newEvent: InvitationAnalyticsEvent = {
    id: `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
    type: input.type,
    guestName: input.guestName || 'Tamu Undangan',
    invitationCode: input.invitationCode,
    detail: input.detail,
    deviceInfo: input.deviceInfo,
    timestamp: nowIso,
  };

  return {
    totalShares,
    waShares,
    linkCopies,
    totalViews,
    uniqueVisitors: Math.min(totalViews, Math.max(1, uniqueVisitors)),
    totalClicks,
    openCoverClicks,
    mapsClicks,
    giftCopyClicks,
    qrisClicks,
    rsvpSubmits,
    visitedGuestKeys: nextVisitedKeys.slice(-100),
    recentEvents: [newEvent, ...(base.recentEvents || [])].slice(0, 12),
    lastUpdatedAt: nowIso,
  };
}


