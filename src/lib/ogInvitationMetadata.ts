import type { Metadata } from 'next';
import { WeddingDatabaseSchema, WeddingGuest, WeddingSettings } from '@/types';
import { INITIAL_GUESTS, INITIAL_SETTINGS } from '@/data/seedData';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/lib/supabaseCloud';
import { resolveGuestByHashTokenAcrossWorkspaces } from '@/lib/guestTokenHash';
import {
  SHOWCASE_DUMMY_CLIENT_METAS,
  getShowcaseDummyClientState,
} from '@/data/showcaseDummyClients';

const SITE_BASE_URL = 'https://meplanner.vercel.app';
const FALLBACK_HERO_BANNER_URL = `${SITE_BASE_URL}/og-agung-selo.jpg`;

function ensureWhatsAppCompatibleJpegUrl(rawUrl: string): string {
  const trimmed = (rawUrl || '').trim();
  if (!trimmed || !/^https?:\/\//i.test(trimmed)) {
    return FALLBACK_HERO_BANNER_URL;
  }
  // Agung & Selo primary hero/cover WebP photos -> serve our fast 99KB 1200x630 same-origin JPEG
  if (
    trimmed.includes('hero_slide_hero_slide_1792846417331_1_h6da_5_43TUZpYY1qKbBk.webp') ||
    trimmed.includes('cover_slide_cover_2_3_FlWCY4lLxJp77h.webp') ||
    trimmed === `${SITE_BASE_URL}/og-agung-selo.jpg`
  ) {
    return FALLBACK_HERO_BANNER_URL;
  }
  // WhatsApp Link Preview crawler does NOT render .webp images or files > 300KB.
  // Convert any .webp or external image URL into a 1200x630 <120KB JPEG automatically.
  if (/\.webp(\?|$)/i.test(trimmed) || !/\.(jpe?g)(\?|$)/i.test(trimmed)) {
    return `https://wsrv.nl/?url=${encodeURIComponent(trimmed)}&w=1200&h=630&fit=cover&a=attention&output=jpg&q=82`;
  }
  return trimmed;
}

async function fetchLiveCloudStateForOg(): Promise<Partial<WeddingDatabaseSchema> | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/wedding_state?id=eq.main&select=data`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        signal: controller.signal,
        next: { revalidate: 30 },
      }
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const rows = await res.json();
    if (Array.isArray(rows) && rows[0]?.data) {
      return rows[0].data as Partial<WeddingDatabaseSchema>;
    }
    return null;
  } catch {
    return null;
  }
}

function resolveHeroImageFromSettings(settings?: Partial<WeddingSettings>): string {
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

export async function buildInvitationOpenGraphMetadata(
  rawHashOrToken?: string
): Promise<Metadata> {
  const cloudData = await fetchLiveCloudStateForOg();
  const rootSettings: WeddingSettings = {
    ...INITIAL_SETTINGS,
    ...(cloudData?.settings || {}),
  };
  const rootGuests: WeddingGuest[] =
    Array.isArray(cloudData?.guests) && cloudData.guests.length > 0
      ? cloudData.guests
      : INITIAL_GUESTS;

  const cleanHash = (rawHashOrToken || '').trim();

  if (!cleanHash) {
    const heroImg = resolveHeroImageFromSettings(rootSettings);
    return {
      metadataBase: new URL(SITE_BASE_URL),
      title: 'MEPlanner — My Event Planner & Digital Invitation Suite',
      description:
        'Platform Persiapan Acara & Undangan Digital Eksklusif (Wedding, Birthday, Graduation, Rapat & Gala Dinner).',
      icons: {
        icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
        apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      },
      openGraph: {
        title: 'Undangan Pernikahan Agung & Selo • MEPlanner Digital Invitation',
        description:
          'Sabtu, 19 Desember 2026 • GKJ Immanuel Ungaran, Semarang. Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.',
        url: SITE_BASE_URL,
        siteName: 'MEPlanner Digital Invitation',
        locale: 'id_ID',
        type: 'website',
        images: [
          {
            url: heroImg,
            secureUrl: heroImg,
            type: 'image/jpeg',
            width: 1200,
            height: 630,
            alt: 'Undangan Pernikahan Agung & Selo',
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title: 'Undangan Pernikahan Agung & Selo • MEPlanner Digital Invitation',
        description:
          'Sabtu, 19 Desember 2026 • GKJ Immanuel Ungaran, Semarang.',
        images: [heroImg],
      },
    };
  }

  // Build workspace list across client-utama, clientWorkspaces, and showcase dummy clients
  const workspaces: Array<{
    clientId: string;
    clientLabel: string;
    guests: WeddingGuest[];
    settings?: WeddingSettings;
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
      workspaces.push({
        clientId: cid,
        clientLabel: ws.settings?.groomNickname || cid,
        guests: ws.guests || [],
        settings: ws.settings,
      });
    }
  }

  for (const meta of SHOWCASE_DUMMY_CLIENT_METAS) {
    const dummyState = getShowcaseDummyClientState(meta.id, 'ROYAL VIP');
    workspaces.push({
      clientId: meta.id,
      clientLabel: meta.coupleLabel,
      guests: dummyState.guests,
      settings: dummyState.settings,
    });
  }

  const matched = resolveGuestByHashTokenAcrossWorkspaces(cleanHash, workspaces);
  const targetWorkspace = matched
    ? workspaces.find((w) => w.clientId === matched.clientId) || workspaces[0]
    : workspaces[0];
  const activeSettings = targetWorkspace.settings || rootSettings;
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

  const guestGreeting = matched?.guest?.guestName
    ? ` — Kepada Yth. ${matched.guest.guestName}`
    : '';

  const ogTitle = `${categoryBadge} ${hostShortTitle}${guestGreeting}`;
  const ogDescription = `${mainDate} • ${mainVenue}. ${
    activeSettings.subtitle ||
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir.'
  }`;

  return {
    metadataBase: new URL(SITE_BASE_URL),
    title: ogTitle,
    description: ogDescription,
    icons: {
      icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `${SITE_BASE_URL}/${encodeURIComponent(cleanHash)}`,
      siteName: `${categoryBadge} ${hostShortTitle}`,
      locale: 'id_ID',
      type: 'website',
      images: [
        {
          url: heroImageUrl,
          secureUrl: heroImageUrl,
          type: 'image/jpeg',
          width: 1200,
          height: 630,
          alt: `${categoryBadge} ${hostShortTitle}`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: ogDescription,
      images: [heroImageUrl],
    },
  };
}
