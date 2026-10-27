import type { Metadata } from 'next';
import { WeddingDatabaseSchema, WeddingGuest, WeddingSettings } from '@/types';
import { INITIAL_GUESTS, INITIAL_SETTINGS } from '@/data/seedData';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseCloud';
import {
  computeGuestInvitationHash,
  computeLegacyGuestInvitationHash,
  resolveGuestByHashTokenAcrossWorkspaces,
} from '@/lib/guestTokenHash';
import {
  SHOWCASE_DUMMY_CLIENT_METAS,
  getShowcaseDummyClientState,
} from '@/data/showcaseDummyClients';

export const SITE_BASE_URL = 'https://meplanner.vercel.app';
export const MEPLANNER_BRAND_OG_IMAGE_URL = `${SITE_BASE_URL}/og-meplanner-logo-m.jpg`;
export const FALLBACK_HERO_BANNER_URL = `${SITE_BASE_URL}/og-undangan-agung-selo.jpg`;

export function ensureWhatsAppCompatibleJpegUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return FALLBACK_HERO_BANNER_URL;
  }
  // Agung & Selo primary hero/cover photos -> serve our fast 84KB 1200x630 same-origin baseline JPEG
  if (
    trimmed.includes('hero_slide_hero_slide_1792846417331_1_h6da_5_43TUZpYY1qKbBk.webp') ||
    trimmed.includes('cover_slide_cover_2_3_FlWCY4lLxJp77h.webp') ||
    trimmed.includes('/media/utama/') ||
    trimmed === `${SITE_BASE_URL}/og-agung-selo.jpg` ||
    trimmed === `${SITE_BASE_URL}/og-undangan-agung-selo.jpg`
  ) {
    return FALLBACK_HERO_BANNER_URL;
  }
  // WhatsApp Link Preview crawler does NOT render .webp images or files > 300KB.
  // Convert any .webp or external image URL into a 1200x630 <100KB JPEG automatically.
  if (/\.webp(\?|$)/i.test(trimmed) || !/\.(jpe?g)(\?|$)/i.test(trimmed)) {
    return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=1200&h=630&fit=cover&a=attention&output=jpg&q=80`;
  }
  return trimmed;
}

export function resolveHeroImageFromSettings(
  settings?: Partial<WeddingSettings>
): string {
  if (!settings) return FALLBACK_HERO_BANNER_URL;
  const heroSlideUrl = Array.isArray(settings.heroSlides)
    ? settings.heroSlides[0]?.imageUrl
    : '';
  const coverSlideUrl = Array.isArray(settings.coverSlides)
    ? settings.coverSlides[0]?.imageUrl
    : '';
  const candidate =
    heroSlideUrl ||
    settings.heroPrewedUrl ||
    coverSlideUrl ||
    settings.coverBgUrl ||
    settings.groomPhotoUrl ||
    FALLBACK_HERO_BANNER_URL;
  return ensureWhatsAppCompatibleJpegUrl(candidate);
}

interface LightweightCloudProjection {
  guests?: WeddingGuest[];
  groomNickname?: string;
  brideNickname?: string;
  eventType?: WeddingSettings['eventType'];
  coverBadgeText?: string;
  subtitle?: string;
  event2DateLabel?: string;
  event2Venue?: string;
  heroPrewedUrl?: string;
  coverBgUrl?: string;
  clientWorkspaces?: WeddingDatabaseSchema['settings']['clientWorkspaces'];
}

async function fetchLightweightCloudStateForOg(): Promise<Partial<WeddingDatabaseSchema> | null> {
  try {
    const queryCols = [
      'guests:data->guests',
      'groomNickname:data->settings->>groomNickname',
      'brideNickname:data->settings->>brideNickname',
      'eventType:data->settings->>eventType',
      'coverBadgeText:data->settings->>coverBadgeText',
      'subtitle:data->settings->>subtitle',
      'event2DateLabel:data->settings->>event2DateLabel',
      'event2Venue:data->settings->>event2Venue',
      'heroPrewedUrl:data->settings->>heroPrewedUrl',
      'coverBgUrl:data->settings->>coverBgUrl',
      'clientWorkspaces:data->settings->clientWorkspaces',
    ].join(',');

    const fetchPromise = fetch(
      `${SUPABASE_URL}/rest/v1/wedding_state?id=eq.main&select=${encodeURIComponent(queryCols)}`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        next: { revalidate: 60 },
      }
    ).then(async (res) => {
      if (!res.ok) return null;
      const rows = (await res.json()) as LightweightCloudProjection[];
      const row = Array.isArray(rows) ? rows[0] : null;
      if (!row) return null;
      return {
        guests: Array.isArray(row.guests) ? row.guests : undefined,
        settings: {
          ...INITIAL_SETTINGS,
          ...(row.groomNickname ? { groomNickname: row.groomNickname } : {}),
          ...(row.brideNickname ? { brideNickname: row.brideNickname } : {}),
          ...(row.eventType ? { eventType: row.eventType } : {}),
          ...(row.coverBadgeText ? { coverBadgeText: row.coverBadgeText } : {}),
          ...(row.subtitle ? { subtitle: row.subtitle } : {}),
          ...(row.event2DateLabel ? { event2DateLabel: row.event2DateLabel } : {}),
          ...(row.event2Venue ? { event2Venue: row.event2Venue } : {}),
          ...(row.heroPrewedUrl ? { heroPrewedUrl: row.heroPrewedUrl } : {}),
          ...(row.coverBgUrl ? { coverBgUrl: row.coverBgUrl } : {}),
          ...(row.clientWorkspaces ? { clientWorkspaces: row.clientWorkspaces } : {}),
        },
      } as Partial<WeddingDatabaseSchema>;
    });

    const timeoutPromise = new Promise<null>((resolve) => {
      setTimeout(() => resolve(null), 650);
    });

    return await Promise.race([fetchPromise, timeoutPromise]);
  } catch {
    return null;
  }
}

export interface ResolvedOgCardPayload {
  title: string;
  description: string;
  siteName: string;
  canonicalUrl: string;
  imageUrl: string;
  imageAlt: string;
  matchedGuestName?: string;
}

function buildLocalSeedWorkspaces(): Array<{
  clientId: string;
  clientLabel: string;
  guests: WeddingGuest[];
  settings: WeddingSettings;
}> {
  const workspaces: Array<{
    clientId: string;
    clientLabel: string;
    guests: WeddingGuest[];
    settings: WeddingSettings;
  }> = [
    {
      clientId: 'client-utama',
      clientLabel: `${INITIAL_SETTINGS.groomNickname || 'Agung'} & ${
        INITIAL_SETTINGS.brideNickname || 'Selo'
      }`,
      guests: INITIAL_GUESTS,
      settings: INITIAL_SETTINGS,
    },
  ];

  for (const meta of SHOWCASE_DUMMY_CLIENT_METAS) {
    const dummyState = getShowcaseDummyClientState(meta.id, 'ROYAL VIP');
    workspaces.push({
      clientId: meta.id,
      clientLabel: meta.coupleLabel,
      guests: dummyState.guests,
      settings: dummyState.settings,
    });
  }

  return workspaces;
}

function formatOgCardFromWorkspace(
  activeSettings: WeddingSettings,
  cleanHash: string,
  guestName?: string
): ResolvedOgCardPayload {
  const heroImageUrl = resolveHeroImageFromSettings(activeSettings);

  const isSingleHost =
    activeSettings.showSecondProfile === false ||
    !activeSettings.brideNickname ||
    activeSettings.brideNickname.trim() === '-';
  const hostShortTitle = isSingleHost
    ? activeSettings.groomNickname || activeSettings.groomFullName || 'Acara'
    : `${activeSettings.groomNickname || 'Agung'} & ${
        activeSettings.brideNickname || 'Selo'
      }`;

  const categoryBadge =
    activeSettings.coverBadgeText?.trim() ||
    (activeSettings.eventType === 'BIRTHDAY'
      ? 'Undangan Ulang Tahun'
      : activeSettings.eventType === 'GRADUATION'
        ? 'Undangan Syukuran Wisuda'
        : activeSettings.eventType === 'MEETING'
          ? 'Undangan Rapat Resmi'
          : activeSettings.eventType === 'GALA_DINNER'
            ? 'Undangan Gala Dinner'
            : 'Undangan Pernikahan');

  const scheduleList = Array.isArray(activeSettings.scheduleEvents)
    ? activeSettings.scheduleEvents
    : [];
  const mainEvent =
    scheduleList.find((e) => e.isMainEvent) ||
    scheduleList.find((e) =>
      /pemberkatan|akad|utama/i.test(`${e.title} ${e.badge}`)
    ) ||
    scheduleList[1] ||
    scheduleList[0];

  const mainDate =
    mainEvent?.dateLabel ||
    activeSettings.event2DateLabel ||
    'Sabtu, 19 Desember 2026';
  const mainVenue =
    mainEvent?.venue ||
    activeSettings.event2Venue ||
    activeSettings.groomOrigin ||
    'Semarang';

  const guestGreeting = guestName ? ` — Kepada Yth. ${guestName}` : '';

  const ogTitle = `${categoryBadge} ${hostShortTitle}${guestGreeting}`;
  const ogDescription = `${mainDate} • ${mainVenue}. ${
    activeSettings.subtitle ||
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.'
  }`;

  const canonicalUrl = cleanHash
    ? `${SITE_BASE_URL}/${encodeURIComponent(cleanHash)}`
    : SITE_BASE_URL;

  return {
    title: ogTitle,
    description: ogDescription,
    siteName: `${categoryBadge} ${hostShortTitle}`,
    canonicalUrl,
    imageUrl: heroImageUrl,
    imageAlt: `${categoryBadge} ${hostShortTitle}`,
    matchedGuestName: guestName,
  };
}

function buildOfficialBrandOgPayload(canonicalUrl = SITE_BASE_URL): ResolvedOgCardPayload {
  return {
    title: 'MEPlanner — My Event Planner & Digital Invitation Suite',
    description:
      'Platform Persiapan Acara, Manajemen Tamu VIP & Undangan Digital Eksklusif (Pernikahan, Ulang Tahun, Wisuda, Rapat & Gala Dinner).',
    siteName: 'MEPlanner — My Event Planner',
    canonicalUrl,
    imageUrl: MEPLANNER_BRAND_OG_IMAGE_URL,
    imageAlt: 'MEPlanner — My Event Planner & Digital Invitation Suite',
  };
}

export async function resolveInvitationOgPayload(
  rawHashOrToken?: string,
  explicitGuestName?: string
): Promise<ResolvedOgCardPayload> {
  const cleanHash = (rawHashOrToken || '').trim();
  const cleanExplicitGuest = (explicitGuestName || '').trim();

  // 1. Root URL without guest token -> resolve MEPlanner Official Brand Card in 0ms
  if (!cleanHash && !cleanExplicitGuest) {
    return buildOfficialBrandOgPayload(SITE_BASE_URL);
  }

  // 2. Fast-path: check local INITIAL_GUESTS & SHOWCASE_DUMMY_CLIENT_METAS synchronously in 0ms!
  const localWorkspaces = buildLocalSeedWorkspaces();
  if (cleanHash) {
    const localMatch = resolveGuestByHashTokenAcrossWorkspaces(
      cleanHash,
      localWorkspaces
    );
    if (localMatch) {
      const targetWs =
        localWorkspaces.find((w) => w.clientId === localMatch.clientId) ||
        localWorkspaces[0];
      return formatOgCardFromWorkspace(
        targetWs.settings,
        cleanHash,
        localMatch.guest.guestName || cleanExplicitGuest
      );
    }
  }

  // 3. Only if not matched in local seed data, query lightweight projection from Supabase (< 650ms max)
  const cloudData = await fetchLightweightCloudStateForOg();
  const rootSettings: WeddingSettings = {
    ...INITIAL_SETTINGS,
    ...(cloudData?.settings || {}),
  };
  const rootGuests: WeddingGuest[] =
    Array.isArray(cloudData?.guests) && cloudData.guests.length > 0
      ? cloudData.guests
      : INITIAL_GUESTS;

  const cloudWorkspaces: Array<{
    clientId: string;
    clientLabel: string;
    guests: WeddingGuest[];
    settings: WeddingSettings;
  }> = [
    {
      clientId: 'client-utama',
      clientLabel: `${rootSettings.groomNickname || 'Agung'} & ${
        rootSettings.brideNickname || 'Selo'
      }`,
      guests: rootGuests,
      settings: rootSettings,
    },
  ];

  if (rootSettings.clientWorkspaces) {
    for (const [cid, ws] of Object.entries(rootSettings.clientWorkspaces)) {
      if (!ws || cid === 'client-utama') continue;
      cloudWorkspaces.push({
        clientId: cid,
        clientLabel: ws.settings?.groomNickname || cid,
        guests: ws.guests || [],
        settings: ws.settings || rootSettings,
      });
    }
  }

  const cloudMatch = cleanHash
    ? resolveGuestByHashTokenAcrossWorkspaces(cleanHash, cloudWorkspaces)
    : null;

  if (cloudMatch) {
    const activeWs =
      cloudWorkspaces.find((w) => w.clientId === cloudMatch.clientId) ||
      cloudWorkspaces[0];
    return formatOgCardFromWorkspace(
      activeWs.settings,
      cleanHash,
      cloudMatch.guest.guestName || cleanExplicitGuest || undefined
    );
  }

  // If explicit ?to=... parameter was provided without a hash match, use rootSettings
  if (cleanExplicitGuest) {
    return formatOgCardFromWorkspace(
      rootSettings,
      cleanHash,
      cleanExplicitGuest
    );
  }

  // Unrecognized/non-matching hash -> return MEPlanner Official Brand Card (never expose personal wedding)
  return buildOfficialBrandOgPayload(
    cleanHash
      ? `${SITE_BASE_URL}/${encodeURIComponent(cleanHash)}`
      : SITE_BASE_URL
  );
}

export function getAllStaticInvitationHashes(): Array<{ hash: string }> {
  const seen = new Set<string>();
  const result: Array<{ hash: string }> = [];
  const workspaces = buildLocalSeedWorkspaces();

  for (const ws of workspaces) {
    for (const guest of ws.guests) {
      const v2 = computeGuestInvitationHash(ws.clientId, guest);
      const v1 = computeLegacyGuestInvitationHash(ws.clientId, guest);
      for (const token of [v2, v1]) {
        if (token && !seen.has(token)) {
          seen.add(token);
          result.push({ hash: token });
        }
      }
    }
  }
  return result;
}

export async function buildInvitationOpenGraphMetadata(
  rawHashOrToken?: string,
  explicitGuestName?: string
): Promise<Metadata> {
  const payload = await resolveInvitationOgPayload(
    rawHashOrToken,
    explicitGuestName
  );

  return {
    metadataBase: new URL(SITE_BASE_URL),
    title: payload.title,
    description: payload.description,
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    },
    openGraph: {
      title: payload.title,
      description: payload.description,
      url: payload.canonicalUrl,
      siteName: payload.siteName,
      locale: 'id_ID',
      type: 'website',
      images: [
        {
          url: payload.imageUrl,
          secureUrl: payload.imageUrl,
          type: 'image/jpeg',
          width: 1200,
          height: 630,
          alt: payload.imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: payload.title,
      description: payload.description,
      images: [payload.imageUrl],
    },
  };
}
