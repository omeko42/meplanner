import {
  WeddingDatabaseSchema,
  WeddingSettings,
  WeddingTask,
  WeddingGuest,
  GuestWish,
  BudgetVendorItem,
  EventCategoryType,
  InvitationThemePresetId,
} from '@/types';
import { INITIAL_SETTINGS, INITIAL_ADMIN_USERS } from '@/data/seedData';
import { computeGuestInvitationHash } from '@/lib/guestTokenHash';

export type ShowcasePackageTier =
  | 'STARTER'
  | 'EXCLUSIVE'
  | 'ROYAL VIP'
  | 'GRATIS'
  | 'PREMIUM'
  | 'BUSINESS'
  | 'ENTERPRISE'
  | 'MITRA_SILVER'
  | 'MITRA_GOLD';

export type ThemeLayoutArchetype =
  | 'EDITORIAL_CLASSIC'
  | 'POLAROID_MAGAZINE'
  | 'BOTANICAL_AIRY'
  | 'NUSANTARA_HERITAGE'
  | 'MODERN_BENTO';

export interface MeplannerPackageTierItem {
  id: ShowcasePackageTier;
  legacyTier: 'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP';
  category: 'PERSONAL' | 'MITRA_EO_WO';
  nameId: string;
  nameEn: string;
  badgeId: string;
  badgeEn: string;
  priceIdr: number;
  normalPriceIdr: number;
  priceUsd: number;
  priceUsdt: number;
  activePeriodId: string;
  activePeriodEn: string;
  guestQuotaLabelId: string;
  guestQuotaLabelEn: string;
  featuresId: string[];
  featuresEn: string[];
  isBestSeller?: boolean;
  isFlagship?: boolean;
}

export const MEPLANNER_PACKAGE_TIERS: MeplannerPackageTierItem[] = [
  {
    id: 'GRATIS',
    legacyTier: 'STARTER',
    category: 'PERSONAL',
    nameId: 'Coba Dulu Gratis',
    nameEn: 'Free Trial',
    badgeId: 'Uji Coba Gratis • 14 Hari',
    badgeEn: 'Free Trial • 14 Days',
    priceIdr: 0,
    normalPriceIdr: 0,
    priceUsd: 0,
    priceUsdt: 0,
    activePeriodId: 'Masa Aktif 14 Hari',
    activePeriodEn: '14 Days Active',
    guestQuotaLabelId: 'Kuota Tamu Terbatas (s/d 30 Tamu)',
    guestQuotaLabelEn: 'Limited Guests (Up to 30)',
    featuresId: [
      '1 Undangan Standar + Event Planner Dasar',
      'Aktif 14 Hari (Upgrade Kapan Saja)',
      'Kuota Tamu Terbatas (s/d 30 Tamu)',
      'Galeri Foto & Video Terbatas',
      'Musik Latar NCS Bebas Royalti',
      'Ucapan & Doa + Konfirmasi RSVP',
      'Pilihan Tema Terbatas',
      'Gift Registry Free',
    ],
    featuresEn: [
      '1 Standard Invitation + Basic Event Planner',
      'Active 14 Days (Upgrade Anytime)',
      'Limited Guest Quota (Up to 30 Guests)',
      'Limited Photo & Video Gallery',
      'Royalty-Free NCS Background Music',
      'Guestbook Wishes & RSVP Confirmation',
      'Standard Theme Selection',
      'Free Gift Registry',
    ],
  },
  {
    id: 'PREMIUM',
    legacyTier: 'STARTER',
    category: 'PERSONAL',
    nameId: 'Premium',
    nameEn: 'Premium',
    badgeId: 'Promo 31% OFF • Paling Favorit',
    badgeEn: 'Promo 31% OFF • Most Popular',
    priceIdr: 51750,
    normalPriceIdr: 75000,
    priceUsd: 4,
    priceUsdt: 4,
    activePeriodId: 'Undangan Aktif Selamanya (Sekali Bayar)',
    activePeriodEn: 'Lifetime Active (One-Time Payment)',
    guestQuotaLabelId: 'Unlimited Kuota Tamu',
    guestQuotaLabelEn: 'Unlimited Guests',
    isBestSeller: true,
    featuresId: [
      'Upgrade Undangan Premium (1 Undangan)',
      'Undangan Aktif Selamanya (Sekali Bayar)',
      'Unlimited Kuota Tamu & Key Hash Unik',
      'Unlimited Foto & Video Gallery',
      'Musik Latar (NCS / Spotify / YouTube / MP3)',
      'Ucapan & Doa + Premium RSVP',
      'Bebas Pilih Semua Tema Premium (25+ Tema Event)',
      'Link Live Streaming (YouTube / Zoom / IG)',
      'Kado Cashless / Donasi & Gift Registry',
      'Layar Penerima Tamu (Guest Reception Check-In)',
      'Story Instagram',
    ],
    featuresEn: [
      'Upgrade 1 Premium Invitation',
      'Lifetime Active Invitation (One-Time Payment)',
      'Unlimited Guest Quota & Unique Key Hash',
      'Unlimited Photo & Video Gallery',
      'Background Music (NCS / Spotify / YouTube / MP3)',
      'Guestbook Wishes & Premium RSVP',
      'All 25+ Multi-Event Premium Themes',
      'Live Streaming Link (YouTube / Zoom / IG)',
      'Cashless Gift / Donation & Gift Registry',
      'Guest Reception Check-In Screen',
      'Instagram Story Template',
    ],
  },
  {
    id: 'BUSINESS',
    legacyTier: 'EXCLUSIVE',
    category: 'PERSONAL',
    nameId: 'Business',
    nameEn: 'Business',
    badgeId: 'Promo 50% OFF • Untuk 2 Acara',
    badgeEn: 'Promo 50% OFF • For 2 Events',
    priceIdr: 74250,
    normalPriceIdr: 150000,
    priceUsd: 6,
    priceUsdt: 6,
    activePeriodId: 'Undangan Aktif Selamanya (2 Undangan)',
    activePeriodEn: 'Lifetime Active (2 Invitations)',
    guestQuotaLabelId: '2 Undangan Premium • Unlimited Tamu',
    guestQuotaLabelEn: '2 Premium Invitations • Unlimited Guests',
    featuresId: [
      'Upgrade Premium +1 Undangan (2 Undangan Premium dalam 1 Akun)',
      'Undangan Aktif Selamanya',
      'Unlimited Kuota Tamu & Blast WhatsApp 1-Klik',
      'Unlimited Foto & Video Gallery + Smooth Slideshow',
      'Musik Latar & Ucapan Doa',
      'Bebas Pilih Semua Tema Premium',
      'Link Streaming & Story Instagram',
      'Kado Cashless / Donasi & Gift Registry',
      'Layar Penerima Tamu (Guest Reception)',
      'Premium RSVP & Open Registration',
      'Full Event Planner (Budget Moneter, Vendor & Checklist)',
      'Mitra Bronze',
    ],
    featuresEn: [
      'Upgrade Premium +1 Invitation (2 Premium Invitations in 1 Account)',
      'Lifetime Active Invitations',
      'Unlimited Guest Quota & 1-Click WhatsApp Blast',
      'Unlimited Photo & Video Gallery + Smooth Slideshow',
      'Background Music & Guestbook Wishes',
      'All Premium Multi-Event Themes',
      'Live Streaming Link & Instagram Story',
      'Cashless Gift / Donation & Gift Registry',
      'Guest Reception Check-In Screen',
      'Premium RSVP & Open Registration',
      'Full Event Planner (Monetary Budget, Vendors & Checklist)',
      'Bronze Partner Access',
    ],
  },
  {
    id: 'ENTERPRISE',
    legacyTier: 'ROYAL VIP',
    category: 'PERSONAL',
    nameId: 'Enterprise',
    nameEn: 'Enterprise',
    badgeId: 'Promo 52% OFF • Untuk 5 Acara',
    badgeEn: 'Promo 52% OFF • For 5 Events',
    priceIdr: 180000,
    normalPriceIdr: 375000,
    priceUsd: 12,
    priceUsdt: 12,
    activePeriodId: 'Undangan Aktif Selamanya (5 Undangan)',
    activePeriodEn: 'Lifetime Active (5 Invitations)',
    guestQuotaLabelId: 'Upgrade Premium +4 Undangan (Total 5 Undangan)',
    guestQuotaLabelEn: 'Upgrade Premium +4 Invitations (5 Total)',
    isFlagship: true,
    featuresId: [
      'Upgrade Premium +4 Undangan (Total 5 Undangan Premium)',
      'Undangan Aktif Selamanya',
      'Unlimited Kuota Tamu & Multi-Akses Panitia/Keluarga',
      'Foto & Video Gallery + Video Background Sinematik 25 MB',
      'Ucapan & Doa + AI Wishes Insight',
      'Semua Tema Premium Multi-Event (25+ Tema)',
      'Link Streaming',
      'Kado Cashless / Donasi Global (Bank, QRIS, PayPal & Crypto USDT)',
      'Layar Penerima Tamu & Check-In Management',
    ],
    featuresEn: [
      'Upgrade Premium +4 Invitations (5 Total Premium Invitations)',
      'Lifetime Active Invitations',
      'Unlimited Guest Quota & Multi-User Committee RBAC',
      'Photo & Video Gallery + 25 MB Cinematic Video Background',
      'Guestbook Wishes & AI Wishes Insight',
      'All 25+ Multi-Event Premium Themes',
      'Live Streaming Link',
      'Global Cashless Gift (Bank, QRIS, PayPal & Crypto USDT)',
      'Guest Reception Screen & Check-In Management',
    ],
  },
  {
    id: 'MITRA_SILVER',
    legacyTier: 'EXCLUSIVE',
    category: 'MITRA_EO_WO',
    nameId: 'Mitra - Silver',
    nameEn: 'Partner - Silver',
    badgeId: 'Promo 54% OFF • Paket WO / EO 11 Undangan',
    badgeEn: 'Promo 54% OFF • WO / EO 11 Invitations',
    priceIdr: 375000,
    normalPriceIdr: 825000,
    priceUsd: 25,
    priceUsdt: 25,
    activePeriodId: 'Undangan Aktif Selamanya (+10 Undangan)',
    activePeriodEn: 'Lifetime Active (+10 Invitations)',
    guestQuotaLabelId: 'Upgrade Premium +10 Undangan (11 Undangan)',
    guestQuotaLabelEn: 'Upgrade Premium +10 Invitations (11 Total)',
    featuresId: [
      'Upgrade Premium +10 Undangan (Total 11 Undangan Premium)',
      'Undangan Aktif Selamanya',
      'Unlimited Kuota Tamu',
      'Foto & Video Gallery',
      'Ucapan & Doa',
      'Tema Premium (25+ Tema Multi-Event)',
      'Link Streaming',
      'Kado Cashless / Donasi',
      'Layar Penerima Tamu (Guest Reception)',
      '✨ Branding Teks (White-Label Nama WO/EO Anda)',
    ],
    featuresEn: [
      'Upgrade Premium +10 Invitations (11 Total Premium Invitations)',
      'Lifetime Active Invitations',
      'Unlimited Guest Quota',
      'Photo & Video Gallery',
      'Guestbook Wishes & RSVP',
      'All 25+ Multi-Event Premium Themes',
      'Live Streaming Link',
      'Cashless Gift / Donation',
      'Guest Reception Check-In Screen',
      '✨ Custom Text Branding (White-Label Your WO/EO Name)',
    ],
  },
  {
    id: 'MITRA_GOLD',
    legacyTier: 'ROYAL VIP',
    category: 'MITRA_EO_WO',
    nameId: 'Mitra - Gold',
    nameEn: 'Partner - Gold',
    badgeId: 'Promo 56% OFF • Paket Agensi VIP 23 Undangan',
    badgeEn: 'Promo 56% OFF • VIP Agency 23 Invitations',
    priceIdr: 750000,
    normalPriceIdr: 1725000,
    priceUsd: 49,
    priceUsdt: 49,
    activePeriodId: 'Undangan Aktif Selamanya (+22 Undangan)',
    activePeriodEn: 'Lifetime Active (+22 Invitations)',
    guestQuotaLabelId: 'Upgrade Premium +22 Undangan (23 Undangan)',
    guestQuotaLabelEn: 'Upgrade Premium +22 Invitations (23 Total)',
    featuresId: [
      'Upgrade Premium +22 Undangan (Total 23 Undangan Premium)',
      'Undangan Aktif Selamanya',
      'Unlimited Kuota Tamu',
      'Foto & Video Gallery',
      'Ucapan & Doa',
      'Tema Premium (25+ Tema Multi-Event)',
      'Link Streaming',
      'Kado Cashless / Donasi',
      'Layar Penerima Tamu (Guest Reception)',
      '✨ Branding Teks (White-Label Nama WO/EO Anda)',
      '👑 Branding Logo (White-Label Logo Eksklusif WO/EO Anda)',
    ],
    featuresEn: [
      'Upgrade Premium +22 Invitations (23 Total Premium Invitations)',
      'Lifetime Active Invitations',
      'Unlimited Guest Quota',
      'Photo & Video Gallery',
      'Guestbook Wishes & RSVP',
      'All 25+ Multi-Event Premium Themes',
      'Live Streaming Link',
      'Cashless Gift / Donation',
      'Guest Reception Check-In Screen',
      '✨ Custom Text Branding (White-Label Your WO/EO Name)',
      '👑 Custom Logo Branding (White-Label Your Exclusive WO/EO Logo)',
    ],
  },
];

export interface MeplannerThemeCatalogItem {
  id: string;
  aliases?: string[];
  name: string;
  styleBadge: string;
  eventType: EventCategoryType;
  dummyClientId: string;
  themePreset: InvitationThemePresetId;
  frameStyle: 'ARCH_DOME' | 'CIRCLE' | 'EDITORIAL_RECT';
  layoutArchetype:
    | 'EDITORIAL_CLASSIC'
    | 'POLAROID_MAGAZINE'
    | 'BOTANICAL_AIRY'
    | 'NUSANTARA_HERITAGE'
    | 'MODERN_BENTO';
  swatches: [string, string, string];
  heroImageUrl: string;
  coverImageUrl: string;
  accentHex: string;
  previewSubtitle: string;
  description: string;
  showFloralCorners?: boolean;
}

export const MEPLANNER_THEME_PRESETS: MeplannerThemeCatalogItem[] = [
  // ============================================================================
  // WEDDING THEMES (WEDDING -> client-demo-wedding)
  // ============================================================================
  {
    id: 'timeless-snapshot',
    aliases: ['wed-timeless-snapshot'],
    name: 'Klasik Champagne & Gading',
    styleBadge: 'Klasik Elegan',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'champagne_gold',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    swatches: ['#D4AF37', '#FAF3E3', '#8B6914'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D4AF37',
    previewSubtitle: 'Resepsi Ballroom & Potret Klasik',
    description:
      'Tampilan hangat bernuansa gading dan emas lembut yang menonjolkan foto kebersamaan mempelai.',
    showFloralCorners: true,
  },
  {
    id: 'serein-botanical',
    aliases: ['wed-serein', 'serein'],
    name: 'Taman Hijau Sage',
    styleBadge: 'Taman & Daun',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'sage_botanical',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'BOTANICAL_AIRY',
    swatches: ['#5E8C6A', '#EBF3ED', '#23422C'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#5E8C6A',
    previewSubtitle: 'Resepsi Taman & Outdoor Asri',
    description:
      'Nuansa teduh dedaunan hijau sage yang segar, cocok untuk acara pernikahan di taman atau ruang terbuka.',
    showFloralCorners: true,
  },
  {
    id: 'mildness-blush',
    aliases: ['wed-mildness', 'mildness', 'mildness-ivory'],
    name: 'Mawar Pastel Romantis',
    styleBadge: 'Pastel Lembut',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'blush_rose',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'BOTANICAL_AIRY',
    swatches: ['#D88290', '#FCECEF', '#8E3546'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D88290',
    previewSubtitle: 'Perayaan Intim & Hangat',
    description:
      'Sentuhan merah muda pastel yang lembut dengan bingkai foto melingkar untuk suasana pernikahan yang akrab.',
    showFloralCorners: false,
  },
  {
    id: 'snap-photo',
    aliases: ['wed-snap-photo'],
    name: 'Album Kolase Polaroid',
    styleBadge: 'Kolase Foto',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'blush_rose',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'POLAROID_MAGAZINE',
    swatches: ['#D88290', '#FFF7F9', '#A84456'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D88290',
    previewSubtitle: 'Galeri Cerita & Potret Polaroid',
    description:
      'Susunan foto bergaya album polaroid untuk membagikan momen prewedding secara santai dan berkesan.',
    showFloralCorners: false,
  },
  {
    id: 'visual-journey',
    aliases: ['wed-visual-journey'],
    name: 'Cerita Cinta Sinematik',
    styleBadge: 'Galeri Penuh',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'terracotta_rust',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'POLAROID_MAGAZINE',
    swatches: ['#CC704E', '#F9EBE4', '#7D341A'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#CC704E',
    previewSubtitle: 'Kisah Perjalanan & Galeri Layar Penuh',
    description:
      'Tampilan layar penuh dengan warna terakota hangat yang mengalirkan cerita perjalanan cinta kedua mempelai.',
    showFloralCorners: true,
  },
  {
    id: 'elegant-light',
    aliases: ['wed-elegant-light', 'light-luxury'],
    name: 'Putih Mutiara & Emas',
    styleBadge: 'Ballroom Mewah',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'champagne_gold',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    swatches: ['#D4AF37', '#FFFDF9', '#9A742B'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D4AF37',
    previewSubtitle: 'Resepsi Gedung & Ballroom Terang',
    description:
      'Perpaduan warna putih mutiara dan aksen bunga emas yang bersih untuk resepsi gedung maupun hotel.',
    showFloralCorners: true,
  },
  {
    id: 'culture-javanese',
    aliases: ['wed-culture-javanese', 'wed-royal-heritage', 'royal-heritage'],
    name: 'Adat Jawa & Keraton',
    styleBadge: 'Adat Nusantara',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'javanese_kraton' as any,
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    swatches: ['#B8862D', '#F7EFE0', '#4A2E07'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#B8862D',
    previewSubtitle: 'Prosesi Panggih & Resepsi Adat',
    description:
      'Nuansa sogan keraton dan ukiran tradisional yang khidmat untuk pernikahan adat Jawa, Sunda, maupun Nusantara.',
    showFloralCorners: true,
  },
  {
    id: 'wayang-heritage',
    aliases: ['wed-wayang', 'wayang'],
    name: 'Wayang & Gunungan Emas',
    styleBadge: 'Warisan Budaya',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'wayang_gold' as any,
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    swatches: ['#C89B3C', '#F8F1E1', '#5C3D09'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#C89B3C',
    previewSubtitle: 'Pawiwahan Agung & Budaya Klasik',
    description:
      'Ornamen gunungan wayang berlapis warna emas klasik untuk resepsi adat yang anggun dan berwibawa.',
    showFloralCorners: true,
  },
  {
    id: 'blubloom-azure',
    aliases: ['wed-blubloom', 'blubloom', 'blubloom-floral'],
    name: 'Biru Langit Hydrangea',
    styleBadge: 'Bunga Biru',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'blubloom_azure' as any,
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'BOTANICAL_AIRY',
    swatches: ['#5A8BB0', '#EDF4F9', '#1D3E57'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#5A8BB0',
    previewSubtitle: 'Taman Bunga Biru & Ballroom',
    description:
      'Kombinasi bunga hydrangea biru langit dan latar bersih yang menghadirkan kesan sejuk serta romantis.',
    showFloralCorners: true,
  },
  {
    id: 'midnight-elegance',
    aliases: [
      'wed-midnight-elegance',
      'pearl-ivory-elegance',
      'wed-pearl-ivory-elegance',
    ],
    name: 'Biru Malam & Bintang',
    styleBadge: 'Malam Elegan',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'midnight_elegance' as any,
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    swatches: ['#4A6984', '#ECF1F5', '#172836'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#4A6984',
    previewSubtitle: 'Resepsi Malam & Jamuan Kehormatan',
    description:
      'Palet biru malam dengan sentuhan perak keemasan yang tenang untuk acara resepsi malam hari.',
    showFloralCorners: true,
  },
  {
    id: 'espresso-rustic',
    aliases: ['wed-espresso', 'espresso', 'espresso-editorial'],
    name: 'Rustik Kayu & Kopi',
    styleBadge: 'Rustik Hangat',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'espresso_rustic' as any,
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'POLAROID_MAGAZINE',
    swatches: ['#8C6245', '#F5EDE6', '#3E2616'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#8C6245',
    previewSubtitle: 'Perayaan Hangat & Kekeluargaan',
    description:
      'Perpaduan warna cokelat kopi dan krem linen yang menghadirkan suasana akrab bersama keluarga dan sahabat.',
    showFloralCorners: false,
  },
  {
    id: 'simple-rustic-3',
    aliases: ['wed-simple-rustic-3'],
    name: 'Terakota & Linen Hangat',
    styleBadge: 'Minimalis Hangat',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'terracotta_rust',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'BOTANICAL_AIRY',
    swatches: ['#C87D55', '#F9EBE4', '#7D341A'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#C87D55',
    previewSubtitle: 'Pernikahan Outdoor & Sederhana',
    description:
      'Desain minimalis dengan warna tanah terakota dan krem alami yang terasa bersahaja namun tetap rapi.',
    showFloralCorners: true,
  },
  {
    id: 'photovit-editorial',
    aliases: ['wed-photovit-black', 'photovit-black', 'photovit-magazine'],
    name: 'Majalah Potret Modern',
    styleBadge: 'Editorial Bersih',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'royal_navy',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'MODERN_BENTO',
    swatches: ['#3B669E', '#EBF1F8', '#162F50'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#3B669E',
    previewSubtitle: 'Tata Letak Rapi & Fokus Potret',
    description:
      'Susunan halaman bergaya majalah modern yang bersih untuk menonjolkan koleksi foto pasangan.',
    showFloralCorners: false,
  },
  {
    id: 'photovit-green',
    aliases: ['wed-photovit-green'],
    name: 'Zamrud Tropis Modern',
    styleBadge: 'Hijau Zamrud',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'sage_botanical',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'MODERN_BENTO',
    swatches: ['#4A6B53', '#EBF3ED', '#23422C'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#4A6B53',
    previewSubtitle: 'Kebun Tropis & Nuansa Segar',
    description:
      'Sentuhan hijau zamrud tropis dengan tata letak kotak modern yang segar dan nyaman dibaca.',
    showFloralCorners: true,
  },
  {
    id: 'peppy-modern',
    aliases: ['wed-peppy', 'peppy', 'peppy-pastel'],
    name: 'Ceria & Penuh Warna',
    styleBadge: 'Muda & Ceria',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    themePreset: 'blush_rose',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'POLAROID_MAGAZINE',
    swatches: ['#C86D7C', '#FCECEF', '#8E3546'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#C86D7C',
    previewSubtitle: 'Perayaan Penuh Sukacita',
    description:
      'Gaya ceria dengan warna-warna hangat untuk pasangan yang menginginkan suasana pesta yang santai.',
    showFloralCorners: true,
  },

  // ============================================================================
  // 4 BIRTHDAY THEMES (BIRTHDAY -> client-demo-birthday)
  // ============================================================================
  {
    id: 'bday-sweet-17',
    aliases: ['bday-sweet-17-rose', 'sweet-17', 'sweet-17-rose'],
    name: 'Sweet Seventeen Rose',
    styleBadge: 'Ulang Tahun ke-17',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    themePreset: 'blush_rose',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'BOTANICAL_AIRY',
    swatches: ['#D88290', '#FCECEF', '#8E3546'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D88290',
    previewSubtitle: 'Perayaan Usia ke-17 & Tiup Lilin',
    description:
      'Tema manis bernuansa mawar pastel untuk merayakan momen spesial ulang tahun ke-17 bersama sahabat dan keluarga.',
    showFloralCorners: true,
  },
  {
    id: 'bday-peppy-pop',
    aliases: ['bday-peppy-confetti', 'peppy-confetti', 'peppy-pop'],
    name: 'Pesta Ulang Tahun Ceria',
    styleBadge: 'Meriah & Hangat',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    themePreset: 'champagne_gold',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'POLAROID_MAGAZINE',
    swatches: ['#D4AF37', '#FAF3E3', '#8B6914'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D4AF37',
    previewSubtitle: 'Makan Malam & Kumpul Sahabat',
    description:
      'Desain hangat dengan bingkai kolase foto untuk mengundang keluarga dan teman dekat ke acara ulang tahun.',
    showFloralCorners: false,
  },
  {
    id: 'bday-golden-50',
    aliases: ['bday-golden-jubilee', 'golden-50', 'golden-jubilee'],
    name: 'Syukuran Usia Emas (50/60 Thn)',
    styleBadge: 'Syukuran Keluarga',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    themePreset: 'champagne_gold',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    swatches: ['#C5A059', '#FAF3E3', '#8B6914'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#C5A059',
    previewSubtitle: 'Tasyakuran Keluarga Besar',
    description:
      'Tampilan klasik dan sopan bernuansa keemasan untuk acara syukuran usia ke-50, ke-60, atau ulang tahun orang tua.',
    showFloralCorners: true,
  },
  {
    id: 'bday-garden-party',
    aliases: ['bday-botanical-garden', 'botanical-garden', 'garden-party'],
    name: 'Pesta Kebun & Santap Sore',
    styleBadge: 'Taman Segar',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    themePreset: 'sage_botanical',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'BOTANICAL_AIRY',
    swatches: ['#5E8C6A', '#EBF3ED', '#23422C'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#5E8C6A',
    previewSubtitle: 'Jamuan Taman & Kumpul Santai',
    description:
      'Nuansa taman hijau yang asri untuk perayaan ulang tahun santai di ruang terbuka atau kafe taman.',
    showFloralCorners: true,
  },

  // ============================================================================
  // 4 GRADUATION THEMES (GRADUATION -> client-demo-graduation)
  // ============================================================================
  {
    id: 'grad-cum-laude',
    aliases: ['grad-cum-laude-gold', 'cum-laude', 'cum-laude-gold'],
    name: 'Tasyakuran Wisuda & Cum Laude',
    styleBadge: 'Wisuda & Gelar',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    themePreset: 'champagne_gold',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    swatches: ['#D4AF37', '#FAF3E3', '#8B6914'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D4AF37',
    previewSubtitle: 'Syukuran Kelulusan & Pengukuhan Gelar',
    description:
      'Undangan syukuran kelulusan bernuansa emas rapi untuk merayakan pencapaian akademik bersama keluarga dan kolega.',
    showFloralCorners: false,
  },
  {
    id: 'grad-sumpah-dokter',
    aliases: ['grad-sumpah-dokter-emerald', 'sumpah-dokter'],
    name: 'Sumpah Dokter & Profesi',
    styleBadge: 'Pelantikan Profesi',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    themePreset: 'sage_botanical',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'MODERN_BENTO',
    swatches: ['#4A6B53', '#EBF3ED', '#23422C'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#4A6B53',
    previewSubtitle: 'Pelantikan Dokter, Spesialis & Profesi',
    description:
      'Tampilan bersih bernuansa hijau zamrud yang dirancang untuk acara angkat sumpah dokter dan pelantikan profesi.',
    showFloralCorners: false,
  },
  {
    id: 'grad-alma-mater',
    aliases: ['grad-royal-alma-mater', 'alma-mater', 'royal-alma-mater'],
    name: 'Kebanggaan Almamater (Navy)',
    styleBadge: 'Formal Kampus',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    themePreset: 'royal_navy',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'MODERN_BENTO',
    swatches: ['#3B669E', '#EBF1F8', '#162F50'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#3B669E',
    previewSubtitle: 'Sidang Terbuka & Jamuan Wisuda',
    description:
      'Nuansa biru tua formal dengan susunan rapi untuk undangan ramah tamah wisuda sarjana hingga pascasarjana.',
    showFloralCorners: false,
  },
  {
    id: 'grad-terracotta-scholar',
    aliases: ['grad-modern-scholar', 'modern-scholar', 'terracotta-scholar'],
    name: 'Ramah Tamah Kelulusan',
    styleBadge: 'Syukuran Hangat',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    themePreset: 'terracotta_rust',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'POLAROID_MAGAZINE',
    swatches: ['#CC704E', '#F9EBE4', '#7D341A'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#CC704E',
    previewSubtitle: 'Makan Malam Syukuran Kelulusan',
    description:
      'Gaya hangat bernuansa terakota untuk acara makan malam syukuran kelulusan bersama keluarga dan sahabat kampus.',
    showFloralCorners: false,
  },

  // ============================================================================
  // 4 CORPORATE / OFFICIAL MEETING THEMES (MEETING -> client-demo-meeting)
  // ============================================================================
  {
    id: 'corp-rakornas-navy',
    aliases: [
      'corp-executive-summit',
      'meet-executive-summit',
      'executive-summit',
      'rakornas-navy',
    ],
    name: 'Forum Eksekutif & Rakornas',
    styleBadge: 'Korporat Resmi',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    themePreset: 'royal_navy',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'MODERN_BENTO',
    swatches: ['#284B7A', '#EBF1F8', '#162F50'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#284B7A',
    previewSubtitle: 'Rapat Koordinasi & Forum Pimpinan',
    description:
      'Format undangan resmi tanpa ornamen bunga untuk rapat kerja nasional, RUPS, dan pertemuan pimpinan perusahaan.',
    showFloralCorners: false,
  },
  {
    id: 'corp-state-gold',
    aliases: [
      'corp-protokol-instansi',
      'meet-protokol-instansi',
      'protokol-instansi',
      'state-gold',
    ],
    name: 'Protokol Instansi & Kedinasan',
    styleBadge: 'Instansi / Polri / BUMN',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    themePreset: 'champagne_gold',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    swatches: ['#D4AF37', '#FAF3E3', '#8B6914'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D4AF37',
    previewSubtitle: 'Undangan Kedinasan & Serah Terima Jabatan',
    description:
      'Tata letak protokoler bernuansa emas resmi untuk undangan kegiatan kementerian, lembaga, TNI/Polri, dan BUMN.',
    showFloralCorners: false,
  },
  {
    id: 'corp-green-esg',
    aliases: ['meet-green-esg-forum', 'green-esg', 'green-esg-forum'],
    name: 'Seminar & Konferensi Hijau',
    styleBadge: 'Forum & Seminar',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    themePreset: 'sage_botanical',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'BOTANICAL_AIRY',
    swatches: ['#5E8C6A', '#EBF3ED', '#23422C'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#5E8C6A',
    previewSubtitle: 'Seminar Nasional & Diskusi Panel',
    description:
      'Tampilan segar dan profesional bernuansa hijau untuk acara seminar, lokakarya, maupun konferensi bersama mitra.',
    showFloralCorners: false,
  },
  {
    id: 'corp-tech-keynote',
    aliases: ['meet-tech-keynote', 'tech-keynote'],
    name: 'Peluncuran Produk & Inovasi',
    styleBadge: 'Teknologi & Bisnis',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    themePreset: 'royal_navy',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'MODERN_BENTO',
    swatches: ['#3B669E', '#F1F5F9', '#162F50'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#3B669E',
    previewSubtitle: 'Peluncuran Produk & Temu Mitra Bisnis',
    description:
      'Desain modern dan ringkas untuk acara peluncuran produk, temu investor, maupun konferensi bisnis.',
    showFloralCorners: false,
  },

  // ============================================================================
  // 4 VIP GALA DINNER THEMES (GALA_DINNER -> client-demo-gala)
  // ============================================================================
  {
    id: 'gala-royal-sapphire',
    aliases: ['royal-sapphire', 'royal-sapphire-gala'],
    name: 'Jamuan Malam Safir (VIP)',
    styleBadge: 'Malam Penghargaan',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    themePreset: 'royal_navy',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'MODERN_BENTO',
    swatches: ['#3B669E', '#EBF1F8', '#162F50'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#3B669E',
    previewSubtitle: 'Jamuan Makan Malam & Apresiasi Mitra',
    description:
      'Nuansa biru safir yang anggun untuk undangan jamuan makan malam resmi dan malam apresiasi mitra.',
    showFloralCorners: false,
  },
  {
    id: 'gala-champagne-symphony',
    aliases: ['gala-champagne-orchestra', 'champagne-symphony', 'champagne-orchestra'],
    name: 'Perjamuan Simfoni Emas',
    styleBadge: 'Anniversary & Jamuan',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    themePreset: 'champagne_gold',
    frameStyle: 'ARCH_DOME',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    swatches: ['#D4AF37', '#FAF3E3', '#8B6914'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D4AF37',
    previewSubtitle: 'Perayaan Hari Jadi & Jamuan Kehormatan',
    description:
      'Balutan warna emas champagne untuk acara perayaan hari jadi perusahaan maupun jamuan makan malam eksklusif.',
    showFloralCorners: true,
  },
  {
    id: 'gala-velvet-rose',
    aliases: [
      'gala-velvet-red',
      'gala-velvet-red-carpet',
      'velvet-red',
      'velvet-red-carpet',
      'velvet-rose',
    ],
    name: 'Malam Karpet Merah',
    styleBadge: 'Gala & Apresiasi',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    themePreset: 'blush_rose',
    frameStyle: 'EDITORIAL_RECT',
    layoutArchetype: 'POLAROID_MAGAZINE',
    swatches: ['#D88290', '#FCECEF', '#8E3546'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#D88290',
    previewSubtitle: 'Malam Perayaan & Jamuan Undangan Khusus',
    description:
      'Sentuhan warna rose hangat untuk acara malam keakraban, perjamuan komunitas, dan perayaan khusus.',
    showFloralCorners: false,
  },
  {
    id: 'gala-starlight-award',
    aliases: ['starlight-award'],
    name: 'Anugerah Prestasi Tahunan',
    styleBadge: 'Malam Anugerah',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    themePreset: 'terracotta_rust',
    frameStyle: 'CIRCLE',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    swatches: ['#CC704E', '#F9EBE4', '#7D341A'],
    coverImageUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=85',
    heroImageUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1600&q=85',
    accentHex: '#CC704E',
    previewSubtitle: 'Malam Penganugerahan & Apresiasi Tahunan',
    description:
      'Perpaduan warna terakota dan emas hangat untuk acara pemberian penghargaan tahunan dan ramah tamah.',
    showFloralCorners: false,
  },
];

export function findCatalogThemePreset(
  themeId?: string | null
): MeplannerThemeCatalogItem | undefined {
  if (!themeId) return undefined;
  const raw = themeId.trim().toLowerCase();
  if (!raw) return undefined;

  const normalizeKey = (val: string) =>
    val
      .trim()
      .toLowerCase()
      .replace(/^(culture|aesthetic|luxury|modern|classic|editorial):\s*/i, '')
      .replace(/^client[-_]/, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const stripCategoryPrefix = (val: string) =>
    normalizeKey(val).replace(/^(wed|bday|grad|corp|meet|gala)-/, '');

  const clean = normalizeKey(raw);
  const stripped = stripCategoryPrefix(raw);

  return MEPLANNER_THEME_PRESETS.find((t) => {
    const tId = normalizeKey(t.id);
    const tStripped = stripCategoryPrefix(t.id);
    const tName = t.name.trim().toLowerCase();
    if (tId === clean || tStripped === stripped || tName === raw) {
      return true;
    }
    if (
      Array.isArray(t.aliases) &&
      t.aliases.some((alias) => {
        const aClean = normalizeKey(alias);
        const aStripped = stripCategoryPrefix(alias);
        return aClean === clean || aStripped === stripped;
      })
    ) {
      return true;
    }
    return false;
  });
}

export function getMeplannerThemeById(
  themeId?: string | null
): MeplannerThemeCatalogItem | undefined {
  return findCatalogThemePreset(themeId);
}

export function applyCatalogThemeToSettings(
  settings: WeddingSettings,
  themeId?: string | null,
  options?: { preserveCustomPhotos?: boolean } | boolean
): WeddingSettings {
  const matched = findCatalogThemePreset(themeId);
  if (!matched) return settings;

  const showFlorals =
    matched.showFloralCorners !== undefined
      ? matched.showFloralCorners
      : matched.layoutArchetype === 'BOTANICAL_AIRY';

  const explicitPreserve =
    typeof options === 'boolean'
      ? options
      : options && typeof options === 'object'
        ? options.preserveCustomPhotos
        : undefined;

  const isDummyClient = isShowcaseDummyClientId(settings.activeClientId);
  const hasRealClientPhotos =
    !isDummyClient &&
    Boolean(
      (settings.coverBgUrl && settings.coverBgUrl.trim()) ||
        (settings.heroPrewedUrl && settings.heroPrewedUrl.trim())
    );

  const shouldPreservePhotos =
    explicitPreserve !== undefined ? explicitPreserve : hasRealClientPhotos;

  const existingExtraCoverSlides = Array.isArray(settings.coverSlides)
    ? settings.coverSlides.slice(1)
    : [];
  const existingExtraHeroSlides = Array.isArray(settings.heroSlides)
    ? settings.heroSlides.slice(1)
    : [];

  const nextSettings: WeddingSettings & {
    showFloralCorners?: boolean;
    layoutArchetype?: ThemeLayoutArchetype;
  } = {
    ...settings,
    selectedCatalogThemeId: matched.id,
    selectedCatalogThemeName: matched.name,
    themePreset: matched.themePreset,
    themeLayoutArchetype: matched.layoutArchetype,
    layoutArchetype: matched.layoutArchetype,
    profileFrameStyle: matched.frameStyle,
    coverBgUrl: shouldPreservePhotos
      ? settings.coverBgUrl || matched.coverImageUrl
      : matched.coverImageUrl,
    heroPrewedUrl: shouldPreservePhotos
      ? settings.heroPrewedUrl || matched.heroImageUrl
      : matched.heroImageUrl,
    coverSlides:
      shouldPreservePhotos &&
      Array.isArray(settings.coverSlides) &&
      settings.coverSlides.length > 0
        ? settings.coverSlides
        : [
            {
              id: 'cat-cover-1',
              imageUrl: matched.coverImageUrl,
              url: matched.coverImageUrl,
              title: matched.name,
              caption: matched.name,
            } as any,
            ...existingExtraCoverSlides,
          ],
    heroSlides:
      shouldPreservePhotos &&
      Array.isArray(settings.heroSlides) &&
      settings.heroSlides.length > 0
        ? settings.heroSlides
        : [
            {
              id: 'cat-hero-1',
              imageUrl: matched.heroImageUrl,
              url: matched.heroImageUrl,
              title: matched.name,
              caption: matched.name,
            } as any,
            ...existingExtraHeroSlides,
          ],
    showFloralOrnaments: showFlorals,
    showFloralCorners: showFlorals,
  };

  return nextSettings;
}

export const USER_REAL_QRIS_URL = '/media/utama/qris.webp';

export interface ShowcaseDummyClientMeta {
  id: string;
  slug: string;
  eventType: EventCategoryType;
  themePreset: InvitationThemePresetId;
  themeLabel: string;
  layoutArchetype: ThemeLayoutArchetype;
  badgeId: string;
  badgeEn: string;
  labelId: string;
  labelEn: string;
  coupleLabel: string;
  venueSummary: string;
  dateSummary: string;
  sampleGuestName: string;
  sampleHashToken: string;
}

export const SHOWCASE_DUMMY_CLIENT_METAS: ShowcaseDummyClientMeta[] = [
  {
    id: 'client-demo-wedding',
    slug: 'demo_wedding',
    eventType: 'WEDDING',
    themePreset: 'champagne_gold',
    themeLabel: 'Champagne Gold',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    badgeId: 'Undangan Pernikahan',
    badgeEn: 'The Wedding Celebration',
    labelId: '💍 Wedding',
    labelEn: '💍 Wedding',
    coupleLabel: 'Rayhan & Clarissa',
    venueSummary: 'Grand Ballroom Hotel Mulia Senayan, Jakarta',
    dateSummary: 'Sabtu, 24 Oktober 2026',
    sampleGuestName: 'Fiorencia & Partner',
    sampleHashToken: 'JHi4b3XgT2RQIDhZ9coLw',
  },
  {
    id: 'client-demo-birthday',
    slug: 'demo_birthday',
    eventType: 'BIRTHDAY',
    themePreset: 'blush_rose',
    themeLabel: 'Blush Rose',
    layoutArchetype: 'BOTANICAL_AIRY',
    badgeId: 'Sweet 17th Birthday',
    badgeEn: 'Sweet 17th Soirée',
    labelId: '🎂 Birthday',
    labelEn: '🎂 Birthday',
    coupleLabel: 'Aurelia Valerie (17th)',
    venueSummary: 'The Glasshouse Ritz-Carlton Pacific Place',
    dateSummary: 'Minggu, 15 November 2026',
    sampleGuestName: 'Keluarga Besar Wijaya',
    sampleHashToken: 'B7k9Lm2pQx8vWz4nRt6Yu',
  },
  {
    id: 'client-demo-graduation',
    slug: 'demo_graduation',
    eventType: 'GRADUATION',
    themePreset: 'royal_navy',
    themeLabel: 'Royal Navy',
    layoutArchetype: 'MODERN_BENTO',
    badgeId: 'Syukuran Wisuda & Doktor',
    badgeEn: 'Doctoral Graduation',
    labelId: '🎓 Graduation',
    labelEn: '🎓 Graduation',
    coupleLabel: 'Dr. Bagaskara Putra, M.Sc.',
    venueSummary: 'Aula Barat ITB & Plataran Bandung',
    dateSummary: 'Sabtu, 28 November 2026',
    sampleGuestName: 'Prof. Dr. Hendra Gunawan',
    sampleHashToken: 'G4m8Np3sVy7xZa2cDf9Hj',
  },
  {
    id: 'client-demo-meeting',
    slug: 'demo_meeting',
    eventType: 'MEETING',
    themePreset: 'sage_botanical',
    themeLabel: 'Sage Botanical',
    layoutArchetype: 'MODERN_BENTO',
    badgeId: 'Rapat Kerja & Executive Forum',
    badgeEn: 'Executive Corporate Summit',
    labelId: '🏛️ Rapat',
    labelEn: '🏛️ Corporate',
    coupleLabel: 'Rakornas Nusantara Global 2026',
    venueSummary: 'Raffles Hotel Grand Ballroom, Jakarta',
    dateSummary: 'Kamis, 3 Desember 2026',
    sampleGuestName: 'Direksi PT Mitra Energi',
    sampleHashToken: 'M9p2Qr6tWx3zBc8fHk5Ln',
  },
  {
    id: 'client-demo-gala',
    slug: 'demo_gala',
    eventType: 'GALA_DINNER',
    themePreset: 'terracotta_rust',
    themeLabel: 'Terracotta Rust',
    layoutArchetype: 'POLAROID_MAGAZINE',
    badgeId: '25th Anniversary Gala Dinner',
    badgeEn: '25th Anniversary Gala Dinner',
    labelId: '🥂 Gala Dinner',
    labelEn: '🥂 Gala Dinner',
    coupleLabel: 'Wijaya Kusuma 25th Gala',
    venueSummary: 'St. Regis Astor Ballroom, Jakarta',
    dateSummary: 'Jumat, 11 Desember 2026',
    sampleGuestName: 'Bapak/Ibu Komisaris Utama',
    sampleHashToken: 'V5x8Zb2dFg7jKm4pRs9Tw',
  },
];

export function isShowcaseDummyClientId(
  clientId?: string | null
): boolean {
  if (!clientId) return false;
  const clean = clientId.trim().toLowerCase();
  if (
    SHOWCASE_DUMMY_CLIENT_METAS.some(
      (m) => m.id === clean || m.slug === clean || `client-${m.slug}` === clean
    )
  ) {
    return true;
  }
  return Boolean(getMeplannerThemeById(clean));
}

export function resolveShowcaseDummyClientId(
  rawParam?: string | null
): string | null {
  if (!rawParam) return null;
  const clean = rawParam.trim().toLowerCase().replace(/-/g, '_');
  const found = SHOWCASE_DUMMY_CLIENT_METAS.find(
    (m) =>
      m.id.replace(/-/g, '_') === clean ||
      m.slug === clean ||
      `client_${m.slug}` === clean
  );
  if (found) return found.id;
  const foundTheme = getMeplannerThemeById(rawParam);
  return foundTheme ? foundTheme.id : null;
}

function buildDummyGuestsForClient(
  meta: ShowcaseDummyClientMeta
): WeddingGuest[] {
  const rawListByEvent: Record<
    EventCategoryType,
    Array<{
      name: string;
      inst: string;
      type: WeddingGuest['guestType'];
      prio: WeddingGuest['priority'];
      pax: number;
      rsvp: WeddingGuest['rsvpStatus'];
      side: string;
      token?: string;
    }>
  > = {
    WEDDING: [
      {
        name: meta.sampleGuestName,
        inst: 'Sahabat Kehormatan VVIP',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Mempelai Pria',
        token: meta.sampleHashToken,
      },
      {
        name: 'Irjen Pol. (Purn.) Drs. Hendrawan Dirgantara & Ibu',
        inst: 'Keluarga Besar Mempelai Pria',
        type: 'Keluarga',
        prio: 'P1 - VIP',
        pax: 4,
        rsvp: 'Hadir',
        side: 'Mempelai Pria',
      },
      {
        name: 'Prof. dr. Haryanto Kusuma, Sp.JP(K) & Keluarga',
        inst: 'Keluarga Besar Mempelai Wanita (RSCM)',
        type: 'Keluarga',
        prio: 'P1 - VIP',
        pax: 4,
        rsvp: 'Hadir',
        side: 'Mempelai Wanita',
      },
      {
        name: 'Kombes Pol. Aditya Pratama, S.I.K., M.Si.',
        inst: 'Bareskrim Polri',
        type: 'Rekan Kerja/Polri',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Mempelai Pria',
      },
      {
        name: 'dr. Nadia Maharani, Sp.A & Partner',
        inst: 'Ikatan Dokter Spesialis FK UI',
        type: 'Teman/Sahabat',
        prio: 'P2 - Utama',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Mempelai Wanita',
      },
      {
        name: 'AKBP Yudhistira Mahendra, S.I.K. & Ibu',
        inst: 'Polda Metro Jaya',
        type: 'Rekan Kerja/Polri',
        prio: 'P2 - Utama',
        pax: 2,
        rsvp: 'Belum Konfirmasi',
        side: 'Mempelai Pria',
      },
    ],
    BIRTHDAY: [
      {
        name: meta.sampleGuestName,
        inst: 'Keluarga Inti & Kehormatan',
        type: 'Keluarga',
        prio: 'P1 - VIP',
        pax: 4,
        rsvp: 'Hadir',
        side: 'Keluarga Aurelia',
        token: meta.sampleHashToken,
      },
      {
        name: 'Michelle Valencia & Sahabat Santa Ursula',
        inst: 'SMA Katolik Santa Ursula Jakarta',
        type: 'Teman/Sahabat',
        prio: 'P1 - VIP',
        pax: 3,
        rsvp: 'Hadir',
        side: 'Sahabat SMA',
      },
      {
        name: 'Kevin Alexander & Music Ensemble',
        inst: 'Jakarta Youth Classical Piano Club',
        type: 'Teman/Sahabat',
        prio: 'P2 - Utama',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Klub Piano',
      },
      {
        name: 'Bapak Hendrawan Wijaya & Ibu Clarissa',
        inst: 'Orang Tua & Tuan Rumah',
        type: 'Keluarga',
        prio: 'P1 - VIP',
        pax: 4,
        rsvp: 'Hadir',
        side: 'Keluarga Aurelia',
      },
      {
        name: 'Jessica Tan & Stephanie Liem',
        inst: 'Bestie Dance & Debate Squad',
        type: 'Teman/Sahabat',
        prio: 'P2 - Utama',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Sahabat SMA',
      },
      {
        name: 'Keluarga Oom Richard Maharani',
        inst: 'Keluarga Besar Pondok Indah',
        type: 'Keluarga',
        prio: 'P2 - Utama',
        pax: 3,
        rsvp: 'Belum Konfirmasi',
        side: 'Keluarga Aurelia',
      },
    ],
    GRADUATION: [
      {
        name: meta.sampleGuestName,
        inst: 'Ketua Tim Promotor STEI ITB',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Sivitas Akademika ITB',
        token: meta.sampleHashToken,
      },
      {
        name: 'Prof. Dr. Ir. Bambang Riyanto, M.Sc.',
        inst: 'Guru Besar & Ko-Promotor ITB',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Sivitas Akademika ITB',
      },
      {
        name: 'Keluarga Besar Prof. Drs. Santoso Putra',
        inst: 'Keluarga Wisudawan Bandung',
        type: 'Keluarga',
        prio: 'P1 - VIP',
        pax: 4,
        rsvp: 'Hadir',
        side: 'Keluarga Wisudawan',
      },
      {
        name: 'Dr. Eng. Raka Pradipta, S.T., M.T.',
        inst: 'Rekan Dosen & Lab AI ITB',
        type: 'Teman/Sahabat',
        prio: 'P2 - Utama',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Kolega Dosen',
      },
      {
        name: 'Himpunan Alumni Doktor Informatika',
        inst: 'Ikatan Alumni ITB',
        type: 'Teman/Sahabat',
        prio: 'P2 - Utama',
        pax: 3,
        rsvp: 'Belum Konfirmasi',
        side: 'Kolega Dosen',
      },
    ],
    MEETING: [
      {
        name: meta.sampleGuestName,
        inst: 'Dewan Direksi Subsidiary',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Delegasi Direksi',
        token: meta.sampleHashToken,
      },
      {
        name: 'Bapak Dr. H. Mahendra Kusuma, M.B.A.',
        inst: 'Komisaris Utama Nusantara Global Holding',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Dewan Komisaris',
      },
      {
        name: 'Ibu Diana Kartika, S.E., M.M.',
        inst: 'VP Corporate Strategy & Digital Transformation',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 1,
        rsvp: 'Hadir',
        side: 'Pimpinan Divisi',
      },
      {
        name: 'Bapak Reza Pahlevi, S.T.',
        inst: 'General Manager Regional Jawa-Bali',
        type: 'Teman/Sahabat',
        prio: 'P2 - Utama',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Pimpinan Wilayah',
      },
      {
        name: 'Delegasi Regional Sumatera & Kalimantan',
        inst: 'Pimpinan Cabang Utama',
        type: 'Teman/Sahabat',
        prio: 'P2 - Utama',
        pax: 4,
        rsvp: 'Belum Konfirmasi',
        side: 'Pimpinan Wilayah',
      },
    ],
    GALA_DINNER: [
      {
        name: meta.sampleGuestName,
        inst: 'Dewan Komisaris Utama Wijaya Kusuma Group',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'VVIP Kehormatan',
        token: meta.sampleHashToken,
      },
      {
        name: 'H.E. Ambassador Laurentius Tan & Madam',
        inst: 'Diplomatic Corps & Strategic Partner',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'VVIP Kehormatan',
      },
      {
        name: 'Bapak Alexander Tanuwijaya & Ibu',
        inst: 'Managing Director Corporate Banking',
        type: 'Pejabat/VIP',
        prio: 'P1 - VIP',
        pax: 2,
        rsvp: 'Hadir',
        side: 'Mitra Perbankan',
      },
      {
        name: 'Ibu Cynthia Halim & Philanthropy Board',
        inst: 'Wijaya Kusuma Charity Foundation',
        type: 'Keluarga',
        prio: 'P1 - VIP',
        pax: 3,
        rsvp: 'Hadir',
        side: 'Tuan Rumah',
      },
      {
        name: 'Bapak Victor Gunawan & Partner',
        inst: 'Mitra Eksekutif Asia Pasifik',
        type: 'Pejabat/VIP',
        prio: 'P2 - Utama',
        pax: 2,
        rsvp: 'Belum Konfirmasi',
        side: 'Mitra Strategis',
      },
    ],
  };

  const rawList = rawListByEvent[meta.eventType] || rawListByEvent.WEDDING;

  return rawList.map((item, idx) => {
    const id = `gst_${meta.slug}_${idx + 1}`;
    const code = `INV-${String(idx + 1).padStart(4, '0')}`;
    const token =
      item.token ||
      computeGuestInvitationHash(meta.id, {
        id,
        invitationCode: code,
        guestName: item.name,
      });
    return {
      id,
      invitationCode: code,
      invitationToken: token,
      guestName: item.name,
      guestType: item.type,
      side: (item.side === 'Mempelai Pria' || item.side === 'Mempelai Wanita'
        ? item.side
        : 'Bersama') as WeddingGuest['side'],
      institution: item.inst,
      invitationFormat: idx < 3 ? 'Cetak Tebal' : 'Online',
      priority: item.prio,
      cardQty: idx < 3 ? 1 : 0,
      pax: item.pax,
      confirmedPax: item.rsvp === 'Hadir' ? item.pax : 0,
      phone: `0812889900${idx + 10}`,
      address: meta.eventType === 'GRADUATION' ? 'Bandung' : 'Jakarta Selatan',
      deliveryStatus: 'Sudah Dikirim',
      rsvpStatus: item.rsvp,
      attendanceStatus: 'Belum Dicek',
      notes: `Link Personal: /${token}`,
      sessionChoice: 'Semua Sesi',
      createdAt: '2026-10-18',
      updatedAt: '2026-10-24',
      updatedBy: 'demo_manager',
    };
  });
}

function buildDummyTasksForClient(
  meta: ShowcaseDummyClientMeta
): WeddingTask[] {
  const tasksByEvent: Record<
    EventCategoryType,
    Array<{
      cat: WeddingTask['category'];
      phase: WeddingTask['timelinePhase'];
      title: string;
      owner: WeddingTask['owner'];
      done: boolean;
    }>
  > = {
    WEDDING: [
      {
        cat: 'Acara',
        phase: 'H-6 Bulan',
        title: 'Booking Grand Ballroom Hotel Mulia Senayan & Jadwal Pemberkatan',
        owner: 'Bersama',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-3 Bulan',
        title: 'Kontrak Dekorasi Pelaminan Floral, Katering VIP & Dokumentasi 4K',
        owner: 'WO / Panitia',
        done: true,
      },
      {
        cat: 'Kependudukan',
        phase: 'H-3 Bulan',
        title: 'Kelengkapan Administrasi Pernikahan & Berkas KUA / Catatan Sipil',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-1 Bulan',
        title: 'Fitting Busana Pengantin Adat & Gaun Resepsi Malam',
        owner: 'Calon',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'H-7',
        title: 'Distribusi Link Undangan Personal Hash kedua Mempelai',
        owner: 'Keluarga',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'Hari-H',
        title: 'Koordinasi Prosesi Kirab & Registrasi QR Tamu VVIP',
        owner: 'WO / Panitia',
        done: false,
      },
    ],
    BIRTHDAY: [
      {
        cat: 'Acara',
        phase: 'H-3 Bulan',
        title: 'Reservasi Eksklusif The Glasshouse Ritz-Carlton Pacific Place',
        owner: 'Keluarga',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-1 Bulan',
        title: 'Pemesanan Custom 5-Tier Sweet 17th Birthday Cake & Dessert Table',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-1 Bulan',
        title: 'Fitting Gaun Malam Blush Rose & Sesi Foto Portrait 17th Aurelia',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'H-7',
        title: 'Persiapan List 17 Lilin Kehormatan (Candle Ceremony) & Wishes',
        owner: 'Keluarga',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-7',
        title: 'Kirim Link Undangan Digital ke Sahabat SMA Santa Ursula',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'Hari-H',
        title: 'Soundcheck Live DJ Acoustic & Setup Photobooth 360',
        owner: 'WO / Panitia',
        done: false,
      },
    ],
    GRADUATION: [
      {
        cat: 'Kependudukan',
        phase: 'H-3 Bulan',
        title: 'Yudisium Doktor Cum Laude & Pendaftaran Wisuda ITB Bandung',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-1 Bulan',
        title: 'Reservasi Private Dining Plataran Bandung untuk Tasyakuran Doktor',
        owner: 'Keluarga',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-7',
        title: 'Pengambilan Toga Doktor ITB & Cetak Hardcover Buku Disertasi',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'H-7',
        title: 'Pengiriman Undangan Kehormatan kepada Tim Promotor & Guru Besar',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'Hari-H',
        title: 'Prosesi Sidang Terbuka Aula Barat ITB & Dokumentasi Keluarga',
        owner: 'WO / Panitia',
        done: false,
      },
    ],
    MEETING: [
      {
        cat: 'Acara',
        phase: 'H-3 Bulan',
        title: 'Penetapan Agenda Strategis Rakornas 2026 & Booking Raffles Ballroom',
        owner: 'WO / Panitia',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-1 Bulan',
        title: 'Produksi LED Giant Screen, Sistem Voting & Materi Keynote Direksi',
        owner: 'WO / Panitia',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-7',
        title: 'Pengadaan Seminar Kit Eksekutif, Plakat & Akomodasi Pimpinan Wilayah',
        owner: 'WO / Panitia',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'H-7',
        title: 'Distribusi Akses Link Undangan Delegasi & Konfirmasi Kehadiran',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'Hari-H',
        title: 'Registrasi Meja Delegasi, Plenary Session & Penandatanganan Pakta 2027',
        owner: 'WO / Panitia',
        done: false,
      },
    ],
    GALA_DINNER: [
      {
        cat: 'Acara',
        phase: 'H-6 Bulan',
        title: 'Reservasi Astor Ballroom St. Regis Jakarta untuk 25th Silver Jubilee',
        owner: 'WO / Panitia',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-3 Bulan',
        title: 'Kurasi Menu 6-Course Royal Fine Dining bersama Executive Chef',
        owner: 'Keluarga',
        done: true,
      },
      {
        cat: 'Vendor & Logistik',
        phase: 'H-1 Bulan',
        title: 'Kontrak Chamber Orchestra, Grand Lighting & Trofi Penghargaan Kristal',
        owner: 'WO / Panitia',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'H-7',
        title: 'Konfirmasi Seating Table VVIP Duta Besar & Mitra Perbankan',
        owner: 'Saya',
        done: true,
      },
      {
        cat: 'Acara',
        phase: 'Hari-H',
        title: 'Red Carpet Welcome Cocktail, Awarding Night & Toast 25 Tahun',
        owner: 'WO / Panitia',
        done: false,
      },
    ],
  };

  const items = tasksByEvent[meta.eventType] || tasksByEvent.WEDDING;

  return items.map((t, i) => ({
    id: `tsk_${meta.slug}_${i + 1}`,
    category: t.cat,
    timelinePhase: t.phase,
    title: t.title,
    due: '2026-10-24',
    priority: i < 3 ? 'Tinggi' : 'Sedang',
    owner: t.owner,
    status: t.done ? 'SELESAI' : 'PROSES',
    notes: `Agenda persiapan ${meta.coupleLabel}`,
    done: t.done,
    doneAt: t.done ? '2026-10-20' : '',
    createdAt: '2026-10-18',
    updatedAt: '2026-10-24',
    updatedBy: 'demo_manager',
  }));
}

function buildDummyBudgetForClient(
  meta: ShowcaseDummyClientMeta
): BudgetVendorItem[] {
  const budgetByEvent: Record<
    EventCategoryType,
    Array<{
      category: BudgetVendorItem['category'];
      itemName: string;
      vendorName: string;
      pic: string;
      estimatedCost: number;
      actualCost: number;
      paidAmount: number;
      paymentStatus: BudgetVendorItem['paymentStatus'];
      notes: string;
    }>
  > = {
    WEDDING: [
      {
        category: 'Gedung & Venue',
        itemName: 'Sewa Grand Ballroom Hotel Mulia Senayan & Ruang VIP',
        vendorName: 'Hotel Mulia Senayan Jakarta',
        pic: 'Koordinator WO',
        estimatedCost: 85000000,
        actualCost: 80000000,
        paidAmount: 80000000,
        paymentStatus: 'LUNAS',
        notes: 'Lunas 100% termasuk ruang tunggu kedua keluarga',
      },
      {
        category: 'Katering & Jamuan',
        itemName: 'Buffet Royal Wedding & Pondokan Nusantara 500 Pax',
        vendorName: 'Mulia Culinary Banquet',
        pic: 'Keluarga',
        estimatedCost: 65000000,
        actualCost: 62000000,
        paidAmount: 45000000,
        paymentStatus: 'DP_TERBAYAR',
        notes: 'Food tasting selesai, pelunasan H-7',
      },
      {
        category: 'Dekorasi & Lighting',
        itemName: 'Dekorasi Pelaminan Champagne Floral & Lorong Masuk',
        vendorName: 'Lumina Wedding Atelier',
        pic: 'Koordinator WO',
        estimatedCost: 35000000,
        actualCost: 32000000,
        paidAmount: 32000000,
        paymentStatus: 'LUNAS',
        notes: 'Bunga segar full import & ambient lighting',
      },
      {
        category: 'Dokumentasi Foto & Video',
        itemName: 'Liputan Prewedding, Pemberkatan & Resepsi 4K',
        vendorName: 'Velvet Frame Wedding Cinema',
        pic: 'Mempelai',
        estimatedCost: 18000000,
        actualCost: 16500000,
        paidAmount: 16500000,
        paymentStatus: 'LUNAS',
        notes: 'Termasuk Same Day Edit Video',
      },
    ],
    BIRTHDAY: [
      {
        category: 'Gedung & Venue',
        itemName: 'Private Glasshouse Soirée & Teen Buffet Package (150 Pax)',
        vendorName: 'The Glasshouse Ritz-Carlton Pacific Place',
        pic: 'Orang Tua Aurelia',
        estimatedCost: 42000000,
        actualCost: 40000000,
        paidAmount: 40000000,
        paymentStatus: 'LUNAS',
        notes: 'Lunas 100% termasuk mocktail bar remaja',
      },
      {
        category: 'Dekorasi & Lighting',
        itemName: 'Blush Rose Balloon Garland, Neon Sign & 17 Candle Stage',
        vendorName: 'Petite Fleur Party Styling',
        pic: 'Aurelia & Mama',
        estimatedCost: 16000000,
        actualCost: 15000000,
        paidAmount: 15000000,
        paymentStatus: 'LUNAS',
        notes: 'Tema Blush Rose & Fairy Lights',
      },
      {
        category: 'Katering & Jamuan',
        itemName: 'Custom 5-Tier Sweet 17th Fondant Cake & Macaron Tower',
        vendorName: 'Patisserie Valerie Jakarta',
        pic: 'Mama Clarissa',
        estimatedCost: 8500000,
        actualCost: 8000000,
        paidAmount: 8000000,
        paymentStatus: 'LUNAS',
        notes: 'Desain mahkota emas & bunga gula handmade',
      },
      {
        category: 'Hiburan & Musik',
        itemName: 'MC Youth Party, Live DJ Acoustic & Photobooth 360 Spin',
        vendorName: 'Sparkle Entertainment ID',
        pic: 'Koordinator Party',
        estimatedCost: 12000000,
        actualCost: 11000000,
        paidAmount: 8000000,
        paymentStatus: 'DP_TERBAYAR',
        notes: 'Sisa pelunasan saat Hari-H',
      },
    ],
    GRADUATION: [
      {
        category: 'Katering & Jamuan',
        itemName: 'Reservasi Private Dining Tasyakuran Doktor (80 Pax VIP)',
        vendorName: 'Plataran Bandung Heritage Dining',
        pic: 'Keluarga Dr. Bagaskara',
        estimatedCost: 28000000,
        actualCost: 26500000,
        paidAmount: 26500000,
        paymentStatus: 'LUNAS',
        notes: 'Jamuan makan siang keluarga & tim promotor ITB',
      },
      {
        category: 'Undangan & Souvenir',
        itemName: 'Cetak Eksklusif Buku Disertasi Hardcover & Plakat Promotor',
        vendorName: 'ITB Press & Artisan Plaque',
        pic: 'Dr. Bagaskara Putra',
        estimatedCost: 7500000,
        actualCost: 7200000,
        paidAmount: 7200000,
        paymentStatus: 'LUNAS',
        notes: '30 eksemplar buku disertasi & cendera mata',
      },
      {
        category: 'Dokumentasi Foto & Video',
        itemName: 'Fotografi Wisuda Aula Barat ITB & Potret Studio Keluarga',
        vendorName: 'Ganesha Portrait Studio',
        pic: 'Dr. Bagaskara Putra',
        estimatedCost: 6500000,
        actualCost: 6000000,
        paidAmount: 6000000,
        paymentStatus: 'LUNAS',
        notes: 'Lunas termasuk cetak kanvas akademik',
      },
      {
        category: 'Dekorasi & Lighting',
        itemName: 'Backdrop Tasyakuran Royal Navy & Rangkaian Bunga Meja',
        vendorName: 'Bandung Floral Design',
        pic: 'Keluarga',
        estimatedCost: 6000000,
        actualCost: 5500000,
        paidAmount: 4000000,
        paymentStatus: 'DP_TERBAYAR',
        notes: 'Pelunasan saat setup di Plataran Bandung',
      },
    ],
    MEETING: [
      {
        category: 'Gedung & Venue',
        itemName: 'Full-Day Executive Conference Package & Summit Hall (250 Delegasi)',
        vendorName: 'Raffles Hotel Jakarta',
        pic: 'Sekretariat Rakornas',
        estimatedCost: 95000000,
        actualCost: 92000000,
        paidAmount: 92000000,
        paymentStatus: 'LUNAS',
        notes: 'Termasuk 2x Coffee Break & Executive Luncheon',
      },
      {
        category: 'Dekorasi & Lighting',
        itemName: 'Produksi Stage Panggung Korporat, Giant LED P2.5 & Live Cam',
        vendorName: 'Nusantara Visual Production',
        pic: 'Divisi IT & Multimedia',
        estimatedCost: 45000000,
        actualCost: 42000000,
        paidAmount: 42000000,
        paymentStatus: 'LUNAS',
        notes: 'Lunas — siap gladi bersih H-1',
      },
      {
        category: 'Undangan & Souvenir',
        itemName: 'Executive Seminar Kit, Leather Folder & Smart ID Card Delegasi',
        vendorName: ' Sovereign Corporate Merch',
        pic: 'Divisi Procurement',
        estimatedCost: 22000000,
        actualCost: 21000000,
        paidAmount: 21000000,
        paymentStatus: 'LUNAS',
        notes: '250 paket delegasi wilayah',
      },
      {
        category: 'Administrasi & Lainnya',
        itemName: 'Protokoler VIP, Akomodasi Pimpinan Wilayah & Dokumentasi Pers',
        vendorName: 'Komite Eksekutif Nasional',
        pic: 'Sekretaris Korporat',
        estimatedCost: 30000000,
        actualCost: 28000000,
        paidAmount: 20000000,
        paymentStatus: 'DP_TERBAYAR',
        notes: 'Settlement pasca penutupan Rakornas',
      },
    ],
    GALA_DINNER: [
      {
        category: 'Gedung & Venue',
        itemName: 'Astor Ballroom & 6-Course Royal Fine Dining (300 VVIP)',
        vendorName: 'The St. Regis Jakarta',
        pic: 'Komite 25th Silver Jubilee',
        estimatedCost: 140000000,
        actualCost: 135000000,
        paidAmount: 135000000,
        paymentStatus: 'LUNAS',
        notes: 'Lunas 100% termasuk Welcome Symphony Cocktail',
      },
      {
        category: 'Hiburan & Musik',
        itemName: 'Chamber Symphony Orchestra & Grand Architectural Lighting',
        vendorName: 'Batavia Philharmonic Ensemble',
        pic: 'Show Director',
        estimatedCost: 48000000,
        actualCost: 45000000,
        paidAmount: 45000000,
        paymentStatus: 'LUNAS',
        notes: '24 musisi orkestra malam penghargaan',
      },
      {
        category: 'Undangan & Souvenir',
        itemName: 'Trofi Kristal 25th Anniversary & Hampers Eksklusif VVIP',
        vendorName: 'Royal Crystal Atelier',
        pic: 'Corporate Relations',
        estimatedCost: 32000000,
        actualCost: 30000000,
        paidAmount: 25000000,
        paymentStatus: 'DP_TERBAYAR',
        notes: '25 plakat penghargaan mitra utama',
      },
      {
        category: 'Dokumentasi Foto & Video',
        itemName: 'Red Carpet Glambot, Multi-Cam Gala & Buku Histori 25 Tahun',
        vendorName: 'Prestige Media House',
        pic: 'Humas Wijaya Kusuma',
        estimatedCost: 24000000,
        actualCost: 22500000,
        paidAmount: 22500000,
        paymentStatus: 'LUNAS',
        notes: 'Lunas',
      },
    ],
  };

  const list = budgetByEvent[meta.eventType] || budgetByEvent.WEDDING;

  return list.map((b, idx) => ({
    id: `bdg_${meta.slug}_${idx + 1}`,
    category: b.category,
    itemName: b.itemName,
    vendorName: b.vendorName,
    vendorContact: `021-57900${idx + 11}`,
    pic: b.pic,
    estimatedCost: b.estimatedCost,
    actualCost: b.actualCost,
    paidAmount: b.paidAmount,
    paymentStatus: b.paymentStatus,
    dueDate: '2026-10-15',
    notes: b.notes,
    updatedAt: '2026-10-24',
  }));
}

function buildDummyWishesForClient(
  meta: ShowcaseDummyClientMeta,
  guests: WeddingGuest[]
): GuestWish[] {
  const g1 = guests[0];
  const g2 = guests[1] || guests[0];
  const g3 = guests[2] || guests[0];

  if (meta.eventType === 'BIRTHDAY') {
    return [
      {
        id: `wsh_${meta.slug}_1`,
        invitationCode: g1.invitationToken || meta.sampleHashToken,
        guestName: g1.guestName,
        institution: g1.institution,
        relation: 'Keluarga',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 4,
        message:
          'Happy Sweet 17th Aurelia sayang! Semoga di usia ke-17 ini Aurelia selalu diberkati kesehatan, kebahagiaan, makin berprestasi di musik maupun sekolah, dan menjadi kebanggaan keluarga!',
        createdAt: '2026-10-24T10:15:00.000Z',
        isPinned: true,
        replyFromCouple:
          'Terima kasih banyak Keluarga Besar Wijaya atas doa dan kasih sayangnya untuk Aurelia! Sampai bertemu di malam Candle Ceremony ya!',
        moderationStatus: 'APPROVED',
      },
      {
        id: `wsh_${meta.slug}_2`,
        invitationCode: g2.invitationToken || 'B7k9Lm2pQx8vWz4nRt6Yu',
        guestName: g2.guestName,
        institution: g2.institution,
        relation: 'Teman/Sahabat',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 3,
        message:
          'Happy 17th Birthday Aurelia!! Ga sabar banget buat seru-seruan bareng di Glasshouse! Wishing you endless joy and bright future ahead bestie!',
        createdAt: '2026-10-24T09:30:00.000Z',
        isPinned: false,
        replyFromCouple:
          'Thank you besties!! See you on the dance floor!',
        moderationStatus: 'APPROVED',
      },
      {
        id: `wsh_${meta.slug}_3`,
        invitationCode: g3.invitationToken || 'B7k9Lm2pQx8vWz4nRt6Yu',
        guestName: g3.guestName,
        institution: g3.institution,
        relation: 'Teman/Sahabat',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 2,
        message:
          'Selamat ulang tahun ke-17 Aurelia! Teruslah menginspirasi lewat alunan musik pianomu. Kami pasti hadir tepat waktu!',
        createdAt: '2026-10-24T08:45:00.000Z',
        isPinned: false,
        moderationStatus: 'APPROVED',
      },
    ];
  }

  if (meta.eventType === 'GRADUATION') {
    return [
      {
        id: `wsh_${meta.slug}_1`,
        invitationCode: g1.invitationToken || meta.sampleHashToken,
        guestName: g1.guestName,
        institution: g1.institution,
        relation: 'Pejabat/VIP',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 2,
        message:
          'Selamat dan sukses kepada Dr. Bagaskara Putra, S.T., M.Sc. atas diraihnya gelar Doktor Teknik Informatika ITB dengan predikat Cum Laude. Semoga riset dan ilmunya terus membawa kemajuan bagi Indonesia.',
        createdAt: '2026-10-24T10:15:00.000Z',
        isPinned: true,
        replyFromCouple:
          'Hatur nuhun yang sebesar-besarnya Prof. Hendra atas bimbingan, ilmu, dan keteladanan Bapak selama masa studi doktoral saya.',
        moderationStatus: 'APPROVED',
      },
      {
        id: `wsh_${meta.slug}_2`,
        invitationCode: g2.invitationToken || meta.sampleHashToken,
        guestName: g2.guestName,
        institution: g2.institution,
        relation: 'Pejabat/VIP',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 2,
        message:
          'Turut bangga atas pencapaian akademik tertinggi Dr. Bagaskara. Sampai berjumpa pada Sidang Terbuka di Aula Barat ITB dan jamuan syukuran di Plataran.',
        createdAt: '2026-10-24T09:30:00.000Z',
        isPinned: false,
        replyFromCouple:
          'Terima kasih banyak Prof. Bambang atas kehormatan kehadirannya.',
        moderationStatus: 'APPROVED',
      },
      {
        id: `wsh_${meta.slug}_3`,
        invitationCode: g3.invitationToken || meta.sampleHashToken,
        guestName: g3.guestName,
        institution: g3.institution,
        relation: 'Keluarga',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 4,
        message:
          'Alhamdulillah, rasa syukur tak terhingga atas kelulusan Doktor Bagaskara. Doa keluarga besar senantiasa menyertai langkah pengabdianmu.',
        createdAt: '2026-10-24T08:45:00.000Z',
        isPinned: false,
        moderationStatus: 'APPROVED',
      },
    ];
  }

  if (meta.eventType === 'MEETING') {
    return [
      {
        id: `wsh_${meta.slug}_1`,
        invitationCode: g1.invitationToken || meta.sampleHashToken,
        guestName: g1.guestName,
        institution: g1.institution,
        relation: 'Pejabat/VIP',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 2,
        message:
          'Delegasi Direksi PT Mitra Energi mengonfirmasi kehadiran penuh pada Plenary Session & Sidang Komisi Rakornas Nusantara Global 2026. Siap mendukung akselerasi strategis 2027.',
        createdAt: '2026-10-24T10:15:00.000Z',
        isPinned: true,
        replyFromCouple:
          'Terima kasih kepada jajaran Direksi PT Mitra Energi. Akses meja VIP telah disiapkan oleh Sekretariat Rakornas.',
        moderationStatus: 'APPROVED',
      },
      {
        id: `wsh_${meta.slug}_2`,
        invitationCode: g2.invitationToken || meta.sampleHashToken,
        guestName: g2.guestName,
        institution: g2.institution,
        relation: 'Pejabat/VIP',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 2,
        message:
          'Selamat menyelenggarakan Rakornas Nusantara Global 2026. Mari jadikan forum eksekutif ini momentum penguatan tata kelola dan inovasi grup.',
        createdAt: '2026-10-24T09:30:00.000Z',
        isPinned: false,
        moderationStatus: 'APPROVED',
      },
    ];
  }

  if (meta.eventType === 'GALA_DINNER') {
    return [
      {
        id: `wsh_${meta.slug}_1`,
        invitationCode: g1.invitationToken || meta.sampleHashToken,
        guestName: g1.guestName,
        institution: g1.institution,
        relation: 'Pejabat/VIP',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 2,
        message:
          'Selamat merayakan 25th Silver Anniversary Wijaya Kusuma Group! Dua setengah dekade perjalanan luar biasa yang penuh integritas dan kontribusi nyata bagi negeri.',
        createdAt: '2026-10-24T10:15:00.000Z',
        isPinned: true,
        replyFromCouple:
          'Suatu kehormatan besar bagi kami menyambut Bapak/Ibu Komisaris Utama pada malam Royal Gala di St. Regis Jakarta.',
        moderationStatus: 'APPROVED',
      },
      {
        id: `wsh_${meta.slug}_2`,
        invitationCode: g2.invitationToken || meta.sampleHashToken,
        guestName: g2.guestName,
        institution: g2.institution,
        relation: 'Pejabat/VIP',
        rsvpStatus: 'Hadir',
        sessionChoice: 'Semua Sesi',
        pax: 2,
        message:
          'Warmest congratulations on the 25th Silver Jubilee of Wijaya Kusuma. We are honored to attend the Royal Gala Fine Dining & Awarding Night.',
        createdAt: '2026-10-24T09:30:00.000Z',
        isPinned: false,
        moderationStatus: 'APPROVED',
      },
    ];
  }

  return [
    {
      id: `wsh_${meta.slug}_1`,
      invitationCode: g1.invitationToken || meta.sampleHashToken,
      guestName: g1.guestName,
      institution: g1.institution,
      relation: 'Pejabat/VIP',
      rsvpStatus: 'Hadir',
      sessionChoice: 'Semua Sesi',
      pax: 2,
      message:
        'Selamat menempuh hidup baru AKP Rayhan & dr. Clarissa! Semoga cinta kasih senantiasa mempersatukan dan memberkati rumah tangga kalian hingga kekal abadi.',
      createdAt: '2026-10-24T10:15:00.000Z',
      isPinned: true,
      replyFromCouple: `Terima kasih banyak ${g1.guestName} atas doa tulus dan konfirmasi kehadirannya! Kami sangat menantikan kehadiran Anda.`,
      moderationStatus: 'APPROVED',
    },
    {
      id: `wsh_${meta.slug}_2`,
      invitationCode: g2.invitationToken || meta.sampleHashToken,
      guestName: g2.guestName,
      institution: g2.institution,
      relation: 'Keluarga',
      rsvpStatus: 'Hadir',
      sessionChoice: 'Semua Sesi',
      pax: 4,
      message:
        'Doa restu terbaik dari kami sekeluarga untuk ananda Rayhan & Clarissa. Semoga menjadi keluarga yang rukun, bahagia, dan penuh berkat Tuhan.',
      createdAt: '2026-10-24T09:30:00.000Z',
      isPinned: false,
      replyFromCouple:
        'Terima kasih sebesar-besarnya atas doa restu Bapak & Ibu sekeluarga.',
      moderationStatus: 'APPROVED',
    },
    {
      id: `wsh_${meta.slug}_3`,
      invitationCode: g3.invitationToken || meta.sampleHashToken,
      guestName: g3.guestName,
      institution: g3.institution,
      relation: 'Keluarga',
      rsvpStatus: 'Hadir',
      sessionChoice: 'Semua Sesi',
      pax: 4,
      message:
        'Selamat berbahagia Rayhan & Clarissa! Undangan digitalnya sangat anggun, kami sekeluarga siap hadir di Pemberkatan & Resepsi.',
      createdAt: '2026-10-24T08:45:00.000Z',
      isPinned: false,
      moderationStatus: 'APPROVED',
    },
  ];
}

export function getShowcaseDummyClientState(
  clientIdOrThemeId: string,
  packageTier: ShowcasePackageTier = 'ROYAL VIP',
  customThemeId?: string
): WeddingDatabaseSchema {
  const matchedTheme =
    getMeplannerThemeById(customThemeId) ||
    getMeplannerThemeById(clientIdOrThemeId);
  const resolvedId = matchedTheme
    ? matchedTheme.dummyClientId
    : resolveShowcaseDummyClientId(clientIdOrThemeId) || 'client-demo-wedding';
  const meta =
    SHOWCASE_DUMMY_CLIENT_METAS.find((m) => m.id === resolvedId) ||
    SHOWCASE_DUMMY_CLIENT_METAS[0];

  const tier = packageTier || 'ROYAL VIP';
  const isStarterTier = tier === 'STARTER' || tier === 'GRATIS';
  const isMidTier =
    tier === 'EXCLUSIVE' ||
    tier === 'PREMIUM' ||
    tier === 'BUSINESS' ||
    tier === 'MITRA_SILVER';

  const isWedding = meta.eventType === 'WEDDING';

  const defaultCover1 =
    meta.eventType === 'WEDDING'
      ? 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85'
      : meta.eventType === 'BIRTHDAY'
        ? 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85'
        : meta.eventType === 'GRADUATION'
          ? 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85'
          : meta.eventType === 'MEETING'
            ? 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85'
            : 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85';

  const defaultHero1 =
    meta.eventType === 'WEDDING'
      ? 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85'
      : meta.eventType === 'BIRTHDAY'
        ? 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1600&q=85'
        : meta.eventType === 'GRADUATION'
          ? 'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=1600&q=85'
          : meta.eventType === 'MEETING'
            ? 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=85'
            : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85';

  const imgCover1 = matchedTheme?.coverImageUrl || defaultCover1;
  const imgHero1 = matchedTheme?.heroImageUrl || defaultHero1;

  const imgPage1 =
    meta.eventType === 'BIRTHDAY'
      ? 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1600&q=85'
      : meta.eventType === 'GRADUATION'
        ? 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1600&q=85'
        : meta.eventType === 'MEETING'
          ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1600&q=85'
          : meta.eventType === 'GALA_DINNER'
            ? 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=1600&q=85'
            : 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85';

  const imgAlt2 =
    meta.eventType === 'BIRTHDAY'
      ? 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=85'
      : meta.eventType === 'GRADUATION'
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1400&q=85'
        : meta.eventType === 'MEETING'
          ? 'https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=1400&q=85'
          : meta.eventType === 'GALA_DINNER'
            ? 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85'
            : 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=85';

  const imgAlt3 =
    meta.eventType === 'BIRTHDAY'
      ? 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=85'
      : meta.eventType === 'GRADUATION'
        ? 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85'
        : meta.eventType === 'MEETING'
          ? 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85'
          : meta.eventType === 'GALA_DINNER'
            ? 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=1400&q=85'
            : 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=85';

  const slideLimit = isStarterTier ? 1 : isMidTier ? 2 : 3;

  const fullCoverSlides = [
    {
      id: 'cs_1',
      imageUrl: imgCover1,
      title: matchedTheme ? `${matchedTheme.name} Cover` : 'Cover Utama',
    },
    { id: 'cs_2', imageUrl: imgAlt2, title: 'Cover Slide 2' },
    { id: 'cs_3', imageUrl: imgAlt3, title: 'Cover Slide 3' },
  ].slice(0, slideLimit);

  const fullHeroSlides = [
    {
      id: 'hs_1',
      imageUrl: imgHero1,
      title: matchedTheme ? `${matchedTheme.name} Hero` : 'Hero Utama',
    },
    { id: 'hs_2', imageUrl: imgCover1, title: 'Hero Slide 2' },
    { id: 'hs_3', imageUrl: imgAlt2, title: 'Hero Slide 3' },
  ].slice(0, slideLimit);

  const fullPageSlides = [
    { id: 'ps_1', imageUrl: imgPage1, title: 'Wallpaper Utama' },
    { id: 'ps_2', imageUrl: imgAlt3, title: 'Wallpaper Slide 2' },
    { id: 'ps_3', imageUrl: imgCover1, title: 'Wallpaper Slide 3' },
  ].slice(0, slideLimit);

  // Real user BCA & QRIS Digital Envelope:
  // - Wedding (2 Mempelai) -> 2 Rekening BCA
  // - Single-Host Event (Birthday, Graduation, Meeting, Gala Dinner) -> 1 Rekening BCA
  const bankAccountsForEvent: NonNullable<WeddingSettings['bankAccounts']> =
    isWedding
      ? [
          {
            id: 'ba_demo_wedding_1',
            type: 'BANK',
            bankName: 'BANK BCA',
            accountNumber: '6790440143',
            accountHolder: 'Eko Agung Krisdianto (Mempelai Pria)',
            branchOrNote: 'Transfer Amplop Digital',
          },
          {
            id: 'ba_demo_wedding_2',
            type: 'BANK',
            bankName: 'BANK BCA',
            accountNumber: '5005205708',
            accountHolder: 'Selo Nelci Agustina (Mempelai Wanita)',
            branchOrNote: 'Transfer Amplop Digital',
          },
        ]
      : meta.eventType === 'BIRTHDAY'
        ? [
            {
              id: 'ba_demo_birthday_1',
              type: 'BANK',
              bankName: 'BANK BCA',
              accountNumber: '6790440143',
              accountHolder: 'Aurelia Valerie (a.n. Eko Agung Krisdianto)',
              branchOrNote: 'Kado Digital Sweet 17th',
            },
          ]
        : meta.eventType === 'GRADUATION'
          ? [
              {
                id: 'ba_demo_graduation_1',
                type: 'BANK',
                bankName: 'BANK BCA',
                accountNumber: '6790440143',
                accountHolder:
                  'Dr. Bagaskara Putra, M.Sc. (a.n. Eko Agung Krisdianto)',
                branchOrNote: 'Tanda Kasih Syukuran Wisuda',
              },
            ]
          : meta.eventType === 'MEETING'
            ? [
                {
                  id: 'ba_demo_meeting_1',
                  type: 'BANK',
                  bankName: 'BANK BCA',
                  accountNumber: '6790440143',
                  accountHolder:
                    'Panitia Rakornas Nusantara (a.n. Eko Agung Krisdianto)',
                  branchOrNote: 'Kontribusi & Sponsorship Resmi',
                },
              ]
            : [
                {
                  id: 'ba_demo_gala_1',
                  type: 'BANK',
                  bankName: 'BANK BCA',
                  accountNumber: '6790440143',
                  accountHolder:
                    'Wijaya Kusuma Foundation (a.n. Eko Agung Krisdianto)',
                  branchOrNote: 'Apresiasi & Charity Gala Dinner',
                },
              ];

  const profileConfig =
    meta.eventType === 'BIRTHDAY'
      ? {
          showSecondProfile: false,
          profileSectionTitle: 'Profil Yang Berulang Tahun',
          eventHostRoleLabel: 'The Celebrant • Sweet 17th',
          groomFullName: 'Aurelia Valerie Maharani',
          groomNickname: 'Aurelia',
          groomRankAndTitle: 'Sweet 17th Birthday Celebrant',
          groomUnit: 'SMA Katolik Santa Ursula Jakarta',
          groomOrigin: 'Jakarta',
          groomParents:
            'Putri Tercinta dari Bapak Hendrawan Wijaya & Ibu Clarissa Maharani',
          groomPhotoUrl:
            'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=85',
          brideFullName: '',
          brideNickname: '',
          brideTitle: '',
          brideOrigin: '',
          brideParents: '',
          bridePhotoUrl: '',
          quoteVerse:
            'Bersyukur atas setiap langkah pertumbuhan, cinta keluarga, dan persahabatan indah di usia ke-17 tahun.',
          quoteSource: 'Sweet 17th Milestone — Aurelia Valerie',
          invitationOpeningText:
            'Dengan penuh sukacita, kami mengundang sahabat dan keluarga tercinta untuk merayakan malam spesial Sweet 17th Birthday Aurelia Valerie.',
          invitationClosingText:
            'Kehadiran dan doa terbaik dari teman-teman serta keluarga adalah kado terindah di hari ulang tahunku yang ke-17.',
          storySectionTitle: 'Perjalanan Usia Aurelia',
          giftSectionTitle: 'Kado Digital & QRIS',
          giftRecipientName: 'Aurelia Valerie Maharani',
        }
      : meta.eventType === 'GRADUATION'
        ? {
            showSecondProfile: false,
            profileSectionTitle: 'Profil Wisudawan',
            eventHostRoleLabel: 'Wisudawan Doktor • Cum Laude',
            groomFullName: 'Dr. Bagaskara Putra, S.T., M.Sc.',
            groomNickname: 'Bagaskara',
            groomRankAndTitle: 'Doktor Teknik Informatika (Predikat Cum Laude)',
            groomUnit: 'Institut Teknologi Bandung (ITB)',
            groomOrigin: 'Bandung',
            groomParents:
              'Putra dari Bapak Prof. Drs. Santoso Putra & Ibu Dra. Dewi Sartika',
            groomPhotoUrl:
              'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=85',
            brideFullName: '',
            brideNickname: '',
            brideTitle: '',
            brideOrigin: '',
            brideParents: '',
            bridePhotoUrl: '',
            quoteVerse:
              'Ilmu pengetahuan adalah pelita pengabdian; setiap gelar adalah amanah untuk memberi manfaat yang lebih luas bagi bangsa.',
            quoteSource: 'Syukuran Promosi Doktor ITB — 2026',
            invitationOpeningText:
              'Ungkapan syukur yang mendalam atas diraihnya gelar Doktor, kami mengundang Bapak/Ibu/Kolega untuk hadir pada acara Syukuran Wisuda Doktor.',
            invitationClosingText:
              'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Rekan Akademisi berkenan hadir memberikan doa restu.',
            storySectionTitle: 'Jejak Langkah Akademik',
            giftSectionTitle: 'Tanda Kasih & Apresiasi Digital',
            giftRecipientName: 'Dr. Bagaskara Putra, S.T., M.Sc.',
          }
        : meta.eventType === 'MEETING'
          ? {
              showSecondProfile: false,
              profileSectionTitle: 'Penyelenggara & Keynote Utama',
              eventHostRoleLabel: 'Komite Eksekutif Nasional',
              groomFullName: 'Komite Eksekutif Rakornas Nusantara Global',
              groomNickname: 'Rakornas 2026',
              groomRankAndTitle: 'Dewan Direksi & Pimpinan Wilayah Se-Indonesia',
              groomUnit: 'Nusantara Global Holding Tbk',
              groomOrigin: 'Jakarta',
              groomParents: 'Sekretariat Jenderal Korporat • Jakarta Pusat',
              groomPhotoUrl:
                'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=800&q=85',
              brideFullName: '',
              brideNickname: '',
              brideTitle: '',
              brideOrigin: '',
              brideParents: '',
              bridePhotoUrl: '',
              quoteVerse:
                'Sinergi kepemimpinan, transformasi digital, dan tata kelola berintegritas menuju pertumbuhan berkelanjutan 2027.',
              quoteSource: 'Piagam Rakornas Nusantara Global',
              invitationOpeningText:
                'Dengan hormat, kami mengundang jajaran Dewan Komisaris, Direksi, dan Pimpinan Wilayah untuk menghadiri Rapat Koordinasi Nasional Nusantara Global 2026.',
              invitationClosingText:
                'Partisipasi aktif dan kehadiran tepat waktu seluruh delegasi sangat menentukan keberhasilan penyusunan Rencana Strategis 2027.',
              storySectionTitle: 'Tonggak Transformasi Korporasi',
              giftSectionTitle: 'Kontribusi & Sponsorship Resmi',
              giftRecipientName: 'Sekretariat Rakornas Nusantara Global',
            }
          : meta.eventType === 'GALA_DINNER'
            ? {
                showSecondProfile: false,
                profileSectionTitle: 'Tuan Rumah Kehormatan',
                eventHostRoleLabel: 'Executive Host • 25th Silver Jubilee',
                groomFullName:
                  'Bapak Ir. H. Baskoro Wijaya Kusuma & Dewan Komisaris',
                groomNickname: 'Wijaya Kusuma Gala',
                groomRankAndTitle: 'Founder & Chairman Wijaya Kusuma Group',
                groomUnit: '25th Silver Anniversary Appreciation Night',
                groomOrigin: 'Jakarta',
                groomParents:
                  'Menghormati Seluruh Mitra Strategis & Sahabat Kehormatan',
                groomPhotoUrl:
                  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=85',
                brideFullName: '',
                brideNickname: '',
                brideTitle: '',
                brideOrigin: '',
                brideParents: '',
                bridePhotoUrl: '',
                quoteVerse:
                  'Dua puluh lima tahun berkarya bersama dalam kepercayaan, dedikasi, dan persahabatan yang tak ternilai.',
                quoteSource: '25th Silver Jubilee — Wijaya Kusuma',
                invitationOpeningText:
                  'Merayakan 25 tahun perjalanan penuh makna, kami mengundang Bapak/Ibu Tamu Kehormatan VVIP pada malam Royal Gala Dinner Wijaya Kusuma.',
                invitationClosingText:
                  'Kehadiran Bapak/Ibu merupakan kehormatan tertinggi dalam perayaan 25th Silver Anniversary ini.',
                storySectionTitle: '25 Tahun Jejak Karya',
                giftSectionTitle: 'Apresiasi & Charity Foundation',
                giftRecipientName: 'Wijaya Kusuma Charity Foundation',
              }
            : {
                showSecondProfile: true,
                profileSectionTitle: 'Profil Kedua Mempelai',
                eventHostRoleLabel: 'Mempelai Pria & Wanita',
                groomFullName: 'AKP Rayhan Dirgantara, S.Tr.K., S.I.K.',
                groomNickname: 'Rayhan',
                groomRankAndTitle: 'Mempelai Pria',
                groomUnit: 'Bareskrim Polri',
                groomOrigin: 'Jakarta',
                groomParents:
                  'Putra Pertama dari Bapak Irjen Pol. (Purn.) Drs. Hendrawan Dirgantara & Ibu Hj. Ratna Kusuma',
                groomPhotoUrl:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85',
                brideFullName: 'dr. Clarissa Aurelia Putri, Sp.DV',
                brideNickname: 'Clarissa',
                brideTitle: 'Mempelai Wanita',
                brideOrigin: 'Bandung',
                brideParents:
                  'Putri Kedua dari Bapak Prof. dr. Haryanto Kusuma, Sp.JP(K) & Ibu drg. Sylvia Anggraini',
                bridePhotoUrl:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
                quoteVerse:
                  'Dan di atas semuanya itu: kenakanlah kasih, sebagai pengikat yang mempersatukan dan menyempurnakan.',
                quoteSource: 'Kolose 3 : 14',
                invitationOpeningText:
                  'Dengan memohon kasih dan berkat Tuhan Yang Maha Esa, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri pernikahan putra-putri kami.',
                invitationClosingText:
                  'Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.',
                storySectionTitle: 'Kisah Perjalanan Cinta',
                giftSectionTitle: 'Amplop Digital & Tanda Kasih',
                giftRecipientName: 'Rayhan Dirgantara & Clarissa Aurelia',
              };

  const scheduleEventsForType: NonNullable<WeddingSettings['scheduleEvents']> =
    meta.eventType === 'BIRTHDAY'
      ? [
          {
            id: `ev_${meta.slug}_1`,
            badge: 'SESI 1 • CANDLE CEREMONY',
            title: 'Candle Ceremony & 17 Wishes',
            subtitle: 'Prosesi Tiup 17 Lilin Kehormatan & Doa Keluarga',
            dateLabel: meta.dateSummary,
            timeLabel: '18.30 - 19.30 WIB',
            datetime: '2026-11-15T18:30:00+07:00',
            venue: 'The Glasshouse Ritz-Carlton Pacific Place',
            address: 'SCBD Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
            mapsUrl: 'https://maps.google.com',
            dresscode: 'Cocktail Attire — Pastel / Blush Gold / White',
            isMainEvent: true,
            enableCountdown: true,
            showOnInvitation: true,
          },
          {
            id: `ev_${meta.slug}_2`,
            badge: 'SESI 2 • DINNER & PARTY',
            title: 'Birthday Dinner & After Party DJ',
            subtitle: 'Fine Buffet, Games & Live DJ Performance',
            dateLabel: meta.dateSummary,
            timeLabel: '19.30 - 22.00 WIB',
            datetime: '2026-11-15T19:30:00+07:00',
            venue: 'The Glasshouse Ritz-Carlton Pacific Place',
            address: 'SCBD Jl. Jend. Sudirman Kav. 52-53, Jakarta Selatan',
            mapsUrl: 'https://maps.google.com',
            dresscode: 'Party Chic / Semi-Formal',
            isMainEvent: false,
            enableCountdown: true,
            showOnInvitation: true,
          },
        ]
      : meta.eventType === 'GRADUATION'
        ? [
            {
              id: `ev_${meta.slug}_1`,
              badge: 'SESI 1 • SIDANG WISUDA',
              title: 'Sidang Terbuka Wisuda & Pengukuhan Doktor',
              subtitle: 'Prosesi Akademik Resmi Senat ITB',
              dateLabel: meta.dateSummary,
              timeLabel: '08.00 - 11.00 WIB',
              datetime: '2026-11-28T08:00:00+07:00',
              venue: 'Aula Barat Institut Teknologi Bandung (ITB)',
              address: 'Jl. Ganesha No. 10, Coblong, Kota Bandung',
              mapsUrl: 'https://maps.google.com',
              dresscode: 'PSL / Jas Formal / Batik Lengan Panjang',
              isMainEvent: true,
              enableCountdown: true,
              showOnInvitation: true,
            },
            {
              id: `ev_${meta.slug}_2`,
              badge: 'SESI 2 • TASYAKURAN',
              title: 'Tasyakuran Kelulusan & Jamuan Siang',
              subtitle: 'Ramah Tamah Keluarga, Promotor & Kolega',
              dateLabel: meta.dateSummary,
              timeLabel: '12.30 - 15.30 WIB',
              datetime: '2026-11-28T12:30:00+07:00',
              venue: 'Plataran Bandung Heritage Dining',
              address: 'Jl. Diponegoro No. 27, Citarum, Kota Bandung',
              mapsUrl: 'https://maps.google.com',
              dresscode: 'Smart Formal / Batik Eksekutif',
              isMainEvent: false,
              enableCountdown: true,
              showOnInvitation: true,
            },
          ]
        : meta.eventType === 'MEETING'
          ? [
              {
                id: `ev_${meta.slug}_1`,
                badge: 'SESI 1 • PLENARY SUMMIT',
                title: 'Plenary Session & Keynote Speech Direktur Utama',
                subtitle: 'Paparan Kinerja 2026 & Cetak Biru Korporasi 2027',
                dateLabel: meta.dateSummary,
                timeLabel: '08.30 - 12.00 WIB',
                datetime: '2026-12-03T08:30:00+07:00',
                venue: 'Raffles Grand Ballroom Jakarta',
                address: 'Ciputra World 1, Jl. Prof. Dr. Satrio Kav. 3-5, Jakarta',
                mapsUrl: 'https://maps.google.com',
                dresscode: 'Executive Business Suit / Lounge Suit',
                isMainEvent: true,
                enableCountdown: true,
                showOnInvitation: true,
              },
              {
                id: `ev_${meta.slug}_2`,
                badge: 'SESI 2 • SIDANG KOMISI',
                title: 'Sidang Komisi Strategis & Penandatanganan Pakta',
                subtitle: 'Konsolidasi Target Regional & Komitmen Kinerja',
                dateLabel: meta.dateSummary,
                timeLabel: '13.30 - 17.00 WIB',
                datetime: '2026-12-03T13:30:00+07:00',
                venue: 'Raffles Summit Hall Lt. 3',
                address: 'Ciputra World 1, Jl. Prof. Dr. Satrio Kav. 3-5, Jakarta',
                mapsUrl: 'https://maps.google.com',
                dresscode: 'Batik Korporat Nusantara / Formal',
                isMainEvent: false,
                enableCountdown: true,
                showOnInvitation: true,
              },
            ]
          : meta.eventType === 'GALA_DINNER'
            ? [
                {
                  id: `ev_${meta.slug}_1`,
                  badge: 'SESI 1 • RED CARPET',
                  title: 'Red Carpet & Welcome Symphony Cocktail',
                  subtitle: 'Penyambutan Tamu VVIP & Pameran 25 Tahun Karya',
                  dateLabel: meta.dateSummary,
                  timeLabel: '18.30 - 19.30 WIB',
                  datetime: '2026-12-11T18:30:00+07:00',
                  venue: 'Astor Foyer — The St. Regis Jakarta',
                  address: 'Rajawali Place, Jl. HR Rasuna Said, Kuningan, Jakarta',
                  mapsUrl: 'https://maps.google.com',
                  dresscode: 'Black Tie / Evening Gown / Tuxedo',
                  isMainEvent: false,
                  enableCountdown: true,
                  showOnInvitation: true,
                },
                {
                  id: `ev_${meta.slug}_2`,
                  badge: 'SESI 2 • ROYAL GALA',
                  title: 'Royal Gala Fine Dining & Awarding Night',
                  subtitle: 'Perjamuan 6-Course, Konser Orkestra & Penganugerahan',
                  dateLabel: meta.dateSummary,
                  timeLabel: '19.30 - 22.30 WIB',
                  datetime: '2026-12-11T19:30:00+07:00',
                  venue: 'Astor Ballroom — The St. Regis Jakarta',
                  address: 'Rajawali Place, Jl. HR Rasuna Said, Kuningan, Jakarta',
                  mapsUrl: 'https://maps.google.com',
                  dresscode: 'Black Tie / National High Couture',
                  isMainEvent: true,
                  enableCountdown: true,
                  showOnInvitation: true,
                },
              ]
            : [
                {
                  id: `ev_${meta.slug}_1`,
                  badge: 'PRA-ACARA • KELUARGA',
                  title: 'Biston & Pertemuan Keluarga Besar',
                  subtitle: 'Silaturahmi & Doa Restu Kedua Keluarga',
                  dateLabel: 'Jumat, 16 Oktober 2026',
                  timeLabel: '16.00 - 19.00 WIB',
                  datetime: '2026-10-16T16:00:00+07:00',
                  venue: 'Kediaman Keluarga Dirgantara',
                  address: 'Kebayoran Baru, Jakarta Selatan',
                  mapsUrl: 'https://maps.google.com',
                  dresscode: 'Batik Keluarga / Smart Casual',
                  isMainEvent: false,
                  enableCountdown: true,
                  showOnInvitation: true,
                },
                {
                  id: `ev_${meta.slug}_2`,
                  badge: 'ACARA UTAMA • PEMBERKATAN',
                  title: 'Pemberkatan / Akad Nikah Suci',
                  subtitle: 'Pengucapan Janji Suci Pernikahan',
                  dateLabel: meta.dateSummary,
                  timeLabel: '09.00 - 11.00 WIB',
                  datetime: '2026-10-24T09:00:00+07:00',
                  venue: meta.venueSummary,
                  address: 'Jl. Asia Afrika, Senayan, Jakarta Pusat',
                  mapsUrl: 'https://maps.google.com',
                  dresscode: 'Putih / Champagne / Kebaya Formal',
                  isMainEvent: true,
                  enableCountdown: true,
                  showOnInvitation: true,
                },
                {
                  id: `ev_${meta.slug}_3`,
                  badge: 'PUNCAK ACARA • RESEPSI',
                  title: 'Resepsi Malam Kehormatan',
                  subtitle: 'Perjamuan Malam & Ramah Tamah Tamu VVIP',
                  dateLabel: meta.dateSummary,
                  timeLabel: '18.30 - 21.30 WIB',
                  datetime: '2026-10-24T18:30:00+07:00',
                  venue: meta.venueSummary,
                  address: 'Jl. Asia Afrika, Senayan, Jakarta Pusat',
                  mapsUrl: 'https://maps.google.com',
                  dresscode: 'Jas Formal /PDU / Gaun Malam / Batik Eksekutif',
                  isMainEvent: false,
                  enableCountdown: true,
                  showOnInvitation: true,
                },
              ];

  const loveStoryForType: WeddingSettings['loveStory'] =
    meta.eventType === 'BIRTHDAY'
      ? [
          {
            id: 'ls_bday_1',
            dateLabel: '15 November 2009',
            title: 'Kelahiran Sang Buah Hati',
            location: 'Jakarta',
            description:
              'Awal kebahagiaan keluarga Bapak Hendrawan & Ibu Clarissa menyambut hadirnya Aurelia Valerie di dunia.',
          },
          {
            id: 'ls_bday_2',
            dateLabel: '2022 – 2025',
            title: 'Prestasi Musik & Persahabatan',
            location: 'SMA Santa Ursula Jakarta',
            description:
              'Memenangkan kejuaraan piano klasik remaja tingkat nasional dan tumbuh bersama sahabat-sahabat terbaik.',
          },
          {
            id: 'ls_bday_3',
            dateLabel: '15 November 2026',
            title: 'Sweet 17th Milestone',
            location: 'The Glasshouse Ritz-Carlton',
            description:
              'Melangkah menuju usia dewasa muda dengan penuh rasa syukur, doa orang tua, dan cita-cita mulia.',
          },
        ]
      : meta.eventType === 'GRADUATION'
        ? [
            {
              id: 'ls_grad_1',
              dateLabel: '2017',
              title: 'Sarjana Teknik Informatika (S.T.)',
              location: 'Bandung',
              description:
                'Menyelesaikan studi sarjana dengan fokus riset awal pada sistem terdistribusi dan kecerdasan buatan.',
            },
            {
              id: 'ls_grad_2',
              dateLabel: '2020',
              title: 'Magister Sains (M.Sc.) & Publikasi Riset',
              location: 'ITB Bandung',
              description:
                'Melanjutkan riset pascasarjana serta memublikasikan makalah ilmiah pada jurnal internasional bereputasi.',
            },
            {
              id: 'ls_grad_3',
              dateLabel: '28 November 2026',
              title: 'Promosi Doktor (Dr. Cum Laude)',
              location: 'Aula Barat ITB Bandung',
              description:
                'Meraih gelar akademik tertinggi Doktor dengan predikat Cum Laude berkat doa keluarga dan bimbingan tim promotor.',
            },
          ]
        : meta.eventType === 'MEETING'
          ? [
              {
                id: 'ls_meet_1',
                dateLabel: 'Kuartal I — 2025',
                title: 'Integrasi Ekosistem Digital Nasional',
                location: 'Kantor Pusat Jakarta',
                description:
                  'Penyatuan infrastruktur teknologi seluruh entitas anak usaha dalam satu platform terpadu.',
              },
              {
                id: 'ls_meet_2',
                dateLabel: 'Kuartal II — 2026',
                title: 'Ekspansi 34 Wilayah Operasional',
                location: 'Nusantara Regional',
                description:
                  'Pencapaian pertumbuhan kinerja positif di seluruh wilayah operasional Indonesia.',
              },
              {
                id: 'ls_meet_3',
                dateLabel: '3 Desember 2026',
                title: 'Rakornas & Pakta Strategis 2027',
                location: 'Raffles Hotel Jakarta',
                description:
                  'Penyelarasan visi jajaran Komisaris, Direksi, dan Pimpinan Wilayah menuju lompatan kinerja 2027.',
              },
            ]
          : meta.eventType === 'GALA_DINNER'
            ? [
                {
                  id: 'ls_gala_1',
                  dateLabel: 'Desember 2001',
                  title: 'Fondasi Pertama Wijaya Kusuma',
                  location: 'Jakarta',
                  description:
                    'Berdirinya Wijaya Kusuma Group dengan komitmen luhur terhadap kualitas, integritas, dan kemitraan.',
                },
                {
                  id: 'ls_gala_2',
                  dateLabel: '2015',
                  title: 'Transformasi Global & Filantropi',
                  location: 'Asia Pasifik',
                  description:
                    'Perluasan jejaring mitra internasional sekaligus pendirian Wijaya Kusuma Charity Foundation.',
                },
                {
                  id: 'ls_gala_3',
                  dateLabel: '11 Desember 2026',
                  title: '25th Silver Jubilee Royal Gala',
                  location: 'The St. Regis Jakarta',
                  description:
                    'Malam apresiasi tertinggi bagi para sahabat, mitra strategis, dan insan terbaik selama 25 tahun berkarya.',
                },
              ]
            : [
                {
                  id: 'ls_wed_1',
                  dateLabel: 'Mei 2022',
                  title: 'Pertemuan Pertama',
                  location: 'Jakarta Pusat',
                  description:
                    'Pertemuan tak terduga dalam penugasan bakti kesehatan bersama yang menumbuhkan kekaguman dan rasa saling menghormati.',
                },
                {
                  id: 'ls_wed_2',
                  dateLabel: 'Agustus 2025',
                  title: 'Lamaran Resmi Kedua Keluarga',
                  location: 'Bandung',
                  description:
                    'Dengan restu penuh kedua orang tua, Rayhan meminang Clarissa dalam suasana hangat dan khidmat.',
                },
                {
                  id: 'ls_wed_3',
                  dateLabel: '24 Oktober 2026',
                  title: 'Ikatan Janji Suci Pernikahan',
                  location: 'Hotel Mulia Senayan, Jakarta',
                  description:
                    'Melangkah bersama dalam ikatan pernikahan suci untuk membangun rumah tangga yang diberkati selamanya.',
                },
              ];

  const galleryPhotosForType: WeddingSettings['galleryPhotos'] =
    meta.eventType === 'BIRTHDAY'
      ? [
          {
            id: 'gp_bday_1',
            title: 'Sweet 17th Portrait — Aurelia',
            caption: 'Potret anggun Aurelia Valerie menyambut usia ke-17 tahun.',
            imageUrl: imgCover1,
            category: 'Sweet 17th',
          },
          {
            id: 'gp_bday_2',
            title: 'Golden Candlelight Wishes',
            caption: 'tujuh belas lilin harapan dan doa terbaik.',
            imageUrl: imgHero1,
            category: 'Celebration',
          },
          {
            id: 'gp_bday_3',
            title: 'Blush Rose Editorial',
            caption: 'Pesona masa remaja yang penuh semangat dan keceriaan.',
            imageUrl: imgAlt2,
            category: 'Portrait',
          },
          {
            id: 'gp_bday_4',
            title: 'Sparkling Soirée Moments',
            caption: 'Kebersamaan hangat bersama keluarga dan sahabat tercinta.',
            imageUrl: imgAlt3,
            category: 'Party',
          },
        ]
      : meta.eventType === 'GRADUATION'
        ? [
            {
              id: 'gp_grad_1',
              title: 'Pengukuhan Doktor ITB',
              caption: 'Momen bersejarah kelulusan Doktor dengan predikat Cum Laude.',
              imageUrl: imgCover1,
              category: 'Wisuda ITB',
            },
            {
              id: 'gp_grad_2',
              title: 'Aula Barat Ganesha',
              caption: 'Dedikasi riset dan pengabdian ilmu pengetahuan.',
              imageUrl: imgHero1,
              category: 'Akademik',
            },
            {
              id: 'gp_grad_3',
              title: 'Dr. Bagaskara Putra, S.T., M.Sc.',
              caption: 'Potret resmi wisudawan program Doktor Teknik Informatika.',
              imageUrl: imgAlt2,
              category: 'Portrait',
            },
            {
              id: 'gp_grad_4',
              title: 'Syukuran Bersama Kolega & Promotor',
              caption: 'Ungkapan terima kasih kepada keluarga dan guru besar.',
              imageUrl: imgAlt3,
              category: 'Tasyakuran',
            },
          ]
        : meta.eventType === 'MEETING'
          ? [
              {
                id: 'gp_meet_1',
                title: 'Plenary Hall Rakornas 2026',
                caption: 'Forum pimpinan eksekutif Nusantara Global se-Indonesia.',
                imageUrl: imgCover1,
                category: 'Plenary',
              },
              {
                id: 'gp_meet_2',
                title: 'Keynote & Strategic Vision',
                caption: 'Paparan peta jalan transformasi digital 2027.',
                imageUrl: imgHero1,
                category: 'Keynote',
              },
              {
                id: 'gp_meet_3',
                title: 'Executive Boardroom',
                caption: 'Sinergi kepemimpinan lintas divisi dan regional.',
                imageUrl: imgAlt2,
                category: 'Leadership',
              },
              {
                id: 'gp_meet_4',
                title: 'National Summit Delegation',
                caption: 'Komitmen bersama menuju pertumbuhan berkelanjutan.',
                imageUrl: imgAlt3,
                category: 'Summit',
              },
            ]
          : meta.eventType === 'GALA_DINNER'
            ? [
                {
                  id: 'gp_gala_1',
                  title: '25th Silver Jubilee Ballroom',
                  caption: 'Kemegahan malam perayaan 25 tahun Wijaya Kusuma.',
                  imageUrl: imgCover1,
                  category: 'Royal Gala',
                },
                {
                  id: 'gp_gala_2',
                  title: 'Symphony & Toast of Honor',
                  caption: 'Alunan orkestra mengiringi malam apresiasi mitra VVIP.',
                  imageUrl: imgHero1,
                  category: 'Symphony',
                },
                {
                  id: 'gp_gala_3',
                  title: 'Fine Dining Table Setting',
                  caption: 'Perjamuan kehormatan berstandar internasional.',
                  imageUrl: imgAlt2,
                  category: 'Fine Dining',
                },
                {
                  id: 'gp_gala_4',
                  title: 'Silver Anniversary Awarding',
                  caption: 'Penghargaan tertinggi bagi insan dan mitra berdedikasi.',
                  imageUrl: imgAlt3,
                  category: 'Awarding',
                },
              ]
            : [
                {
                  id: 'gp_wed_1',
                  title: 'Eternal Promise — Rayhan & Clarissa',
                  caption: 'Potret utama kedua mempelai dalam balutan cahaya keemasan.',
                  imageUrl: imgCover1,
                  category: 'Prewedding',
                },
                {
                  id: 'gp_wed_2',
                  title: 'Two Souls One Heart',
                  caption: 'Langkah bersama menuju janji suci pernikahan.',
                  imageUrl: imgHero1,
                  category: 'Highlight',
                },
                {
                  id: 'gp_wed_3',
                  title: 'Grace & Devotion',
                  caption: 'Keanggunan cinta kasih yang mempersatukan.',
                  imageUrl: imgAlt2,
                  category: 'Editorial',
                },
                {
                  id: 'gp_wed_4',
                  title: 'Symphony of Blessing',
                  caption: 'Doa restu keluarga mengiringi hari bahagia.',
                  imageUrl: imgAlt3,
                  category: 'Exclusive',
                },
              ];

  const primaryEvent = scheduleEventsForType[0];
  const secondaryEvent = scheduleEventsForType[scheduleEventsForType.length - 1];

  const showFlorals =
    matchedTheme?.showFloralCorners !== undefined
      ? matchedTheme.showFloralCorners
      : meta.eventType !== 'MEETING';

  const defaultLayoutArchetype: ThemeLayoutArchetype =
    meta.eventType === 'WEDDING'
      ? 'EDITORIAL_CLASSIC'
      : meta.eventType === 'BIRTHDAY'
        ? 'BOTANICAL_AIRY'
        : meta.eventType === 'GRADUATION'
          ? 'MODERN_BENTO'
          : meta.eventType === 'MEETING'
            ? 'MODERN_BENTO'
            : 'POLAROID_MAGAZINE';

  const effectiveLayoutArchetype: ThemeLayoutArchetype =
    matchedTheme?.layoutArchetype || meta.layoutArchetype || defaultLayoutArchetype;

  const customSettings: WeddingSettings & {
    showFloralCorners?: boolean;
    themeLayoutArchetype?: ThemeLayoutArchetype;
    layoutArchetype?: ThemeLayoutArchetype;
  } = {
    ...INITIAL_SETTINGS,
    siteTitle: 'MEPlanner — My Event Planner',
    subtitle: matchedTheme
      ? `${matchedTheme.name} (${matchedTheme.styleBadge}) • ${matchedTheme.previewSubtitle} • ${meta.dateSummary}`
      : `${meta.badgeId} • ${meta.dateSummary} • ${meta.venueSummary}`,
    activeClientId: matchedTheme ? matchedTheme.id : meta.id,
    eventType: matchedTheme ? matchedTheme.eventType : meta.eventType,
    themePreset: matchedTheme ? matchedTheme.themePreset : meta.themePreset,
    themeLayoutArchetype: effectiveLayoutArchetype,
    layoutArchetype: effectiveLayoutArchetype,
    showFloralOrnaments: showFlorals,
    showFloralCorners: showFlorals,
    showFloatingPetals: showFlorals,
    showSaveToCalendarButton: true,
    showSecondProfile: profileConfig.showSecondProfile,
    profileSectionTitle: profileConfig.profileSectionTitle,
    eventHostRoleLabel: profileConfig.eventHostRoleLabel,
    profileFrameStyle: matchedTheme
      ? matchedTheme.frameStyle
      : meta.eventType === 'WEDDING'
        ? 'ARCH_DOME'
        : meta.eventType === 'BIRTHDAY'
          ? 'CIRCLE'
          : 'EDITORIAL_RECT',
    coverBadgeText: matchedTheme
      ? `${meta.badgeId} • ${matchedTheme.name}`
      : meta.badgeId,
    groomFullName: profileConfig.groomFullName,
    groomNickname: profileConfig.groomNickname,
    groomRankAndTitle: profileConfig.groomRankAndTitle,
    groomUnit: profileConfig.groomUnit,
    groomOrigin: profileConfig.groomOrigin,
    groomParents: profileConfig.groomParents,
    groomPhotoUrl: profileConfig.groomPhotoUrl,
    brideFullName: profileConfig.brideFullName,
    brideNickname: profileConfig.brideNickname,
    brideTitle: profileConfig.brideTitle,
    brideOrigin: profileConfig.brideOrigin,
    brideParents: profileConfig.brideParents,
    bridePhotoUrl: profileConfig.bridePhotoUrl,
    quoteVerse: profileConfig.quoteVerse,
    quoteSource: profileConfig.quoteSource,
    invitationOpeningText: profileConfig.invitationOpeningText,
    invitationClosingText: profileConfig.invitationClosingText,
    storySectionTitle: profileConfig.storySectionTitle,
    giftSectionTitle: profileConfig.giftSectionTitle,
    coverBgUrl: imgCover1,
    heroPrewedUrl: imgHero1,
    pageBgUrl: imgPage1,
    coverSlides: fullCoverSlides,
    heroSlides: fullHeroSlides,
    pageSlides: fullPageSlides,
    event1Title: primaryEvent.title,
    event1DateLabel: primaryEvent.dateLabel,
    event1TimeLabel: primaryEvent.timeLabel,
    event1Venue: primaryEvent.venue,
    event1Address: primaryEvent.address,
    event2Title: secondaryEvent.title,
    event2DateLabel: secondaryEvent.dateLabel,
    event2TimeLabel: secondaryEvent.timeLabel,
    event2Venue: secondaryEvent.venue,
    event2Address: secondaryEvent.address,
    scheduleEvents: scheduleEventsForType,
    showLoveStorySection: !isStarterTier,
    showGallerySection: !isStarterTier,
    musicSourceType: 'NCS_BUILTIN',
    musicTitle: 'NCS — Eternal Promise (NoCopyrightSounds)',
    musicArtist: 'NCS • Royalty-Free Instrumental',
    activeMusicTrackId: 'track-default-1',
    musicPlaylist: [
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
    ],
    musicAutoplay: !isStarterTier,
    showPhysicalGiftAddress: !isStarterTier,
    showQrisButton: true,
    qrisImageUrl: USER_REAL_QRIS_URL,
    bankAccounts: bankAccountsForEvent,
    giftRecipientName: profileConfig.giftRecipientName,
    giftShippingNote:
      'Konfirmasi Pengiriman via Email Resmi: e98.bisnis@gmail.com (Eko Agung K)',
    giftShippingAddress:
      meta.eventType === 'GRADUATION'
        ? 'Jl. Dago Asri I No. 18, Coblong, Kota Bandung 40135'
        : 'Residence One Senayan Tower A Lt. 18, Kebayoran Baru, Jakarta Selatan 12190',
    loveStory: loveStoryForType,
    galleryPhotos: galleryPhotosForType,
    updatedAt: '2026-10-24T12:00:00.000Z',
    updatedBy: 'demo_showcase',
  };

  const finalSettings =
    customThemeId || matchedTheme
      ? applyCatalogThemeToSettings(customSettings, customThemeId || matchedTheme?.id)
      : customSettings;

  const allGuests = buildDummyGuestsForClient(meta);
  const allTasks = buildDummyTasksForClient(meta);
  const allBudget = buildDummyBudgetForClient(meta);
  const allWishes = buildDummyWishesForClient(meta, allGuests);

  return {
    settings: finalSettings,
    tasks: allTasks,
    guests: isStarterTier ? allGuests.slice(0, 4) : allGuests,
    wishes: allWishes,
    budgetItems: isStarterTier ? [] : allBudget,
    adminUsers: INITIAL_ADMIN_USERS,
    lastSyncedAt: '2026-10-24T12:00:00.000Z',
  };
}
