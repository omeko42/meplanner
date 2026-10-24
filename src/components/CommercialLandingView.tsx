'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Sparkles,
  Shield,
  CheckCircle2,
  Wallet,
  Calendar,
  Eye,
  KeyRound,
  Send,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  Search,
  LayoutDashboard,
  Award,
  Globe,
  CreditCard,
  Coins,
  Mail,
  QrCode,
  Building2,
  Lock,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  AlertTriangle,
  FileCheck2,
  Clock,
  Maximize2,
  X,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Music,
  BookOpen,
} from 'lucide-react';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
import { InfoTooltip } from '@/components/InfoTooltip';
import {
  ClientGroupItem,
  ClientWorkspaceData,
  CommercialPaymentCategory,
  CommercialPaymentChannel,
  CommercialPaymentStatus,
  CommercialPaymentTransaction,
  EventCategoryType,
  WeddingGuest,
  WeddingSettings,
} from '@/types';
import { DEFAULT_COMMERCIAL_PAYMENT_CHANNELS } from '@/data/seedData';

const IDEMPOTENT_TX_STORAGE_KEY = 'mwm_active_idempotent_tx_v1';

interface CatalogFloralCornerProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  enabled?: boolean;
}

const CatalogFloralCorner: React.FC<CatalogFloralCornerProps> = ({
  position,
  size = 'md',
  className = '',
  enabled = true,
}) => {
  if (!enabled) return null;

  const posClasses =
    position === 'top-left'
      ? 'top-0 left-0'
      : position === 'top-right'
        ? 'top-0 right-0 -scale-x-100'
        : position === 'bottom-left'
          ? 'bottom-0 left-0 -scale-y-100'
          : 'bottom-0 right-0 -scale-x-100 -scale-y-100';

  const sizeClasses =
    size === 'sm'
      ? 'w-14 h-14 sm:w-18 sm:h-18'
      : size === 'lg'
        ? 'w-24 h-24 sm:w-32 sm:h-32'
        : 'w-20 h-20 sm:w-24 sm:h-24';

  const swayClass =
    position === 'top-left' || position === 'bottom-right'
      ? 'animate-floral-sway'
      : 'animate-floral-sway-reverse';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute z-10 ${posClasses} ${sizeClasses} ${className}`}
    >
      <svg
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`w-full h-full opacity-85 ${swayClass}`}
      >
        <circle cx="24" cy="24" r="22" fill="#D4AF37" fillOpacity="0.10" />
        <path
          d="M6 108C8 64 34 32 106 8"
          stroke="#C5A059"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M4 76C18 46 44 24 84 12"
          stroke="#D4AF37"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        <path
          d="M22 72C12 64 12 50 24 46C30 56 28 66 22 72Z"
          fill="#E6C994"
          fillOpacity="0.65"
          stroke="#B68D40"
          strokeWidth="1"
        />
        <path
          d="M42 50C34 38 38 24 52 22C54 34 50 44 42 50Z"
          fill="#FAF3E3"
          stroke="#C5A059"
          strokeWidth="1.1"
        />
        <path
          d="M68 28C64 18 70 10 82 10C82 18 76 25 68 28Z"
          fill="#E6C994"
          fillOpacity="0.6"
          stroke="#B68D40"
          strokeWidth="1"
        />
        <path
          d="M34 62C46 58 56 64 58 76C46 76 38 70 34 62Z"
          fill="#FAF3E3"
          stroke="#C5A059"
          strokeWidth="1"
        />
        <path
          d="M56 38C68 36 76 42 78 52C67 52 60 46 56 38Z"
          fill="#E6C994"
          fillOpacity="0.55"
          stroke="#B68D40"
          strokeWidth="1"
        />
        <circle
          cx="28"
          cy="28"
          r="11"
          fill="#FAF3E3"
          stroke="#C5A059"
          strokeWidth="1.3"
        />
        <circle
          cx="28"
          cy="28"
          r="6.5"
          fill="#E6C994"
          fillOpacity="0.75"
          stroke="#B68D40"
          strokeWidth="1"
        />
        <circle cx="28" cy="28" r="2.8" fill="#9A742B" />
        <circle
          cx="16"
          cy="46"
          r="3"
          fill="#FFFDF9"
          stroke="#C5A059"
          strokeWidth="1"
        />
        <circle
          cx="48"
          cy="18"
          r="3.2"
          fill="#FFFDF9"
          stroke="#C5A059"
          strokeWidth="1"
        />
        <circle cx="18" cy="88" r="2.5" fill="#D4AF37" />
        <circle cx="88" cy="16" r="2.5" fill="#D4AF37" />
        <circle cx="62" cy="56" r="2" fill="#C5A059" />
      </svg>
    </div>
  );
};

const CatalogEventCrest: React.FC<{
  eventType?: EventCategoryType;
  className?: string;
}> = ({ eventType = 'WEDDING', className = 'w-6 h-6' }) => {
  switch (eventType) {
    case 'BIRTHDAY':
      return (
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path
            d="M4.5 20.5L6.5 9.5L11.5 14L14 7L16.5 14L21.5 9.5L23.5 20.5H4.5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path
            d="M5 23H23"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="14" cy="4.2" r="1.3" fill="currentColor" />
          <circle cx="6.2" cy="7.2" r="1.1" fill="currentColor" />
          <circle cx="21.8" cy="7.2" r="1.1" fill="currentColor" />
        </svg>
      );
    case 'GRADUATION':
      return (
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path
            d="M14 5L3 10.5L14 16L25 10.5L14 5Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <path
            d="M7.5 13V19.5C7.5 21.5 10.5 23 14 23C17.5 23 20.5 21.5 20.5 19.5V13"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M23.5 11.2V18.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <circle cx="23.5" cy="19.5" r="1.2" fill="currentColor" />
        </svg>
      );
    case 'MEETING':
      return (
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <circle
            cx="14"
            cy="14"
            r="9.5"
            stroke="currentColor"
            strokeWidth="1.4"
          />
          <path
            d="M14 3.5L16.8 11.2L24.5 14L16.8 16.8L14 24.5L11.2 16.8L3.5 14L11.2 11.2L14 3.5Z"
            stroke="currentColor"
            strokeWidth="1.35"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <circle cx="14" cy="14" r="1.8" fill="currentColor" />
        </svg>
      );
    case 'GALA_DINNER':
      return (
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path
            d="M14 2.5L16.6 9.8L23.8 6.2L20.2 13.4L27.5 16L20.2 18.6L23.8 25.8L16.6 22.2L14 27.5L11.4 22.2L4.2 25.8L7.8 18.6L0.5 16L7.8 13.4L4.2 6.2L11.4 9.8L14 2.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <circle
            cx="14"
            cy="15.5"
            r="3"
            stroke="currentColor"
            strokeWidth="1.2"
          />
        </svg>
      );
    case 'WEDDING':
    default:
      return (
        <svg
          viewBox="0 0 28 28"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`shrink-0 ${className}`}
          aria-hidden="true"
        >
          <path
            d="M14 2.8L15.1 5.6L17.9 6.7L15.1 7.8L14 10.6L12.9 7.8L10.1 6.7L12.9 5.6L14 2.8Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <circle
            cx="10.8"
            cy="17"
            r="6.2"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="currentColor"
            fillOpacity="0.06"
          />
          <circle
            cx="17.2"
            cy="17"
            r="6.2"
            stroke="currentColor"
            strokeWidth="1.6"
            fill="currentColor"
            fillOpacity="0.06"
          />
        </svg>
      );
  }
};

const CatalogGoldEmvChip: React.FC<{ className?: string }> = ({
  className = 'w-9 h-7',
}) => (
  <svg
    viewBox="0 0 48 36"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`shrink-0 ${className}`}
    aria-hidden="true"
  >
    <rect
      x="1"
      y="1"
      width="46"
      height="34"
      rx="6"
      fill="url(#catalogEmvGoldGrad)"
      stroke="#9A742B"
      strokeWidth="1.2"
    />
    <path
      d="M16 1V35M32 1V35M1 12H16M32 12H47M1 24H16M32 24H47"
      stroke="#8B6914"
      strokeWidth="1"
      strokeOpacity="0.65"
    />
    <rect
      x="16"
      y="8"
      width="16"
      height="20"
      rx="3"
      stroke="#8B6914"
      strokeWidth="1"
      strokeOpacity="0.7"
      fill="#F3D77D"
      fillOpacity="0.25"
    />
    <defs>
      <linearGradient
        id="catalogEmvGoldGrad"
        x1="0"
        y1="0"
        x2="48"
        y2="36"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FAF0CA" />
        <stop offset="0.45" stopColor="#D4AF37" />
        <stop offset="0.8" stopColor="#C5A059" />
        <stop offset="1" stopColor="#9A742B" />
      </linearGradient>
    </defs>
  </svg>
);

interface SimulationHostItem {
  name: string;
  role: string;
  parents: string;
  photo: string;
}

interface SimulationEventPreset {
  eventType: EventCategoryType;
  tabLabelId: string;
  tabLabelEn: string;
  badgeId: string;
  badgeEn: string;
  monogram: string;
  titleShort: string;
  titleFull: string;
  sectionTitleId: string;
  sectionTitleEn: string;
  quote: string;
  heroImage: string;
  profileCount: 1 | 2;
  frameStyle: 'ARCH_DOME' | 'CIRCLE' | 'EDITORIAL_RECT';
  showFloral: boolean;
  host1: SimulationHostItem;
  host2?: SimulationHostItem;
  eventTitle: string;
  eventDate: string;
  eventVenue: string;
  musicTrackLabel: string;
}

const SIMULATION_EVENT_PRESETS: Record<
  EventCategoryType,
  SimulationEventPreset
> = {
  WEDDING: {
    eventType: 'WEDDING',
    tabLabelId: '💍 Pernikahan',
    tabLabelEn: '💍 Wedding',
    badgeId: 'Undangan Pernikahan',
    badgeEn: 'The Wedding Celebration',
    monogram: 'R & C',
    titleShort: 'Rayhan & Clarissa',
    titleFull:
      'AKP Rayhan Dirgantara, S.Tr.K., S.I.K. & dr. Clarissa Aurelia, Sp.DV',
    sectionTitleId: 'Mempelai yang Berbahagia',
    sectionTitleEn: 'The Bride & Groom',
    quote:
      '"Dan di atas semuanya itu: kenakanlah kasih, sebagai pengikat yang mempersatukan dan menyempurnakan." — Kolose 3 : 14',
    heroImage:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
    profileCount: 2,
    frameStyle: 'ARCH_DOME',
    showFloral: true,
    host1: {
      name: 'AKP Rayhan Dirgantara, S.Tr.K., S.I.K.',
      role: 'Mempelai Pria',
      parents: 'Putra dari Bapak Ir. H. Baskoro & Ibu Hj. Ratna Sari',
      photo:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
    },
    host2: {
      name: 'dr. Clarissa Aurelia, Sp.DV',
      role: 'Mempelai Wanita',
      parents: 'Putri dari Bapak Prof. Dr. Hendra Wijaya & Ibu Dra. Sylvia',
      photo:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
    },
    eventTitle: 'Pemberkatan & Grand Resepsi',
    eventDate: 'Sabtu, 24 Oktober 2026 • 18.30 WIB',
    eventVenue: 'Grand Ballroom Hotel Mulia Senayan, Jakarta',
    musicTrackLabel: 'Romantic Strings Serenade (Royalty-Free Preview)',
  },
  BIRTHDAY: {
    eventType: 'BIRTHDAY',
    tabLabelId: '🎂 Ulang Tahun',
    tabLabelEn: '🎂 Birthday',
    badgeId: 'Sweet 17th Birthday Soirée',
    badgeEn: 'Sweet 17th Birthday Soirée',
    monogram: 'A • 17',
    titleShort: 'Aurelia Putri',
    titleFull: 'Aurelia Maharani Putri — 17th Milestone Celebration',
    sectionTitleId: 'Profil Yang Berulang Tahun',
    sectionTitleEn: 'The Celebrant Spotlight',
    quote:
      '"Mensyukuri setiap langkah perjalanan usia baru bersama keluarga dan sahabat tercinta."',
    heroImage:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80',
    profileCount: 1,
    frameStyle: 'CIRCLE',
    showFloral: true,
    host1: {
      name: 'Aurelia Maharani Putri',
      role: 'The Celebrant • Sweet 17th',
      parents: 'Putri Tercinta dari Bapak Pratama & Ibu Indah',
      photo:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
    },
    eventTitle: 'Birthday Dinner & Candle Ceremony',
    eventDate: 'Minggu, 15 November 2026 • 19.00 WIB',
    eventVenue: 'The Glasshouse Rooftop Lounge, Surabaya',
    musicTrackLabel: 'Champagne Waltz & Acoustic Piano',
  },
  GRADUATION: {
    eventType: 'GRADUATION',
    tabLabelId: '🎓 Wisuda',
    tabLabelEn: '🎓 Graduation',
    badgeId: 'Syukuran Wisuda & Sumpah Dokter',
    badgeEn: 'Graduation & Medical Oath Celebration',
    monogram: 'K • P',
    titleShort: 'dr. Kevin Pratama',
    titleFull: 'dr. Kevin Pratama, S.Ked. — Fakultas Kedokteran',
    sectionTitleId: 'Profil Wisudawan',
    sectionTitleEn: 'The Graduate Profile',
    quote:
      '"Sebuah awal pengabdian baru dari perjalanan panjang menuntut ilmu."',
    heroImage:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1000&q=80',
    profileCount: 1,
    frameStyle: 'ARCH_DOME',
    showFloral: false,
    host1: {
      name: 'dr. Kevin Pratama, S.Ked.',
      role: 'Wisudawan • Cum Laude',
      parents: 'Putra dari Bapak Drs. Santoso & Ibu Dewi',
      photo:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
    },
    eventTitle: 'Tasyakuran Kelulusan & Ramah Tamah',
    eventDate: 'Sabtu, 28 November 2026 • 12.00 WIB',
    eventVenue: 'Padma Hotel Grand Ballroom, Semarang',
    musicTrackLabel: 'Grand Academic Orchestra Suite',
  },
  MEETING: {
    eventType: 'MEETING',
    tabLabelId: '🏛️ Rapat Resmi',
    tabLabelEn: '🏛️ Corporate',
    badgeId: 'Undangan Rapat & Agenda Eksekutif',
    badgeEn: 'Official Corporate & Executive Agenda',
    monogram: 'R • D',
    titleShort: 'Rakornas Digital 2026',
    titleFull: 'Rapat Koordinasi Nasional & Forum Eksekutif 2026',
    sectionTitleId: 'Penyelenggara & Keynote Utama',
    sectionTitleEn: 'Executive Host & Keynote',
    quote:
      '"Sinergi kepemimpinan dan akselerasi transformasi menuju tata kelola berstandar global."',
    heroImage:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1000&q=80',
    profileCount: 1,
    frameStyle: 'EDITORIAL_RECT',
    showFloral: false,
    host1: {
      name: 'Komite Eksekutif & Keynote Speaker',
      role: 'Penyelenggara Utama',
      parents: 'Dewan Transformasi Digital & Mitra Strategis Nasional',
      photo:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=500&q=80',
    },
    eventTitle: 'Plenary Session & Executive Forum',
    eventDate: 'Kamis, 10 Desember 2026 • 08.30 WIB',
    eventVenue: 'Jakarta International Convention Center (JICC)',
    musicTrackLabel: 'Ambient Executive Lounge Instrumental',
  },
  GALA_DINNER: {
    eventType: 'GALA_DINNER',
    tabLabelId: '🥂 Gala Dinner',
    tabLabelEn: '🥂 Gala Dinner',
    badgeId: 'Exclusive VIP Gala Dinner & Award Night',
    badgeEn: 'Exclusive VIP Gala Dinner & Award Night',
    monogram: 'R • S',
    titleShort: 'Royal Sapphire Gala',
    titleFull: 'Royal Sapphire Annual Appreciation Gala 2026',
    sectionTitleId: 'Tuan Rumah Kehormatan',
    sectionTitleEn: 'VIP Hosts & Board of Directors',
    quote:
      '"Malam apresiasi tertinggi bagi para mitra strategis dan tamu kehormatan."',
    heroImage:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1000&q=80',
    profileCount: 1,
    frameStyle: 'EDITORIAL_RECT',
    showFloral: false,
    host1: {
      name: 'Board of Directors & VIP Hosts',
      role: 'Tuan Rumah Kehormatan',
      parents: 'Royal Sapphire Enterprise & Executive Philanthropy Council',
      photo:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
    },
    eventTitle: 'Red Carpet, Fine Dining & Awarding Night',
    eventDate: 'Jumat, 18 Desember 2026 • 19.00 WIB',
    eventVenue: 'The Ritz-Carlton Pacific Place Ballroom, Jakarta',
    musicTrackLabel: 'Luxury Jazz & Velvet Evening Quartet',
  },
};

const SIMULATION_EVENT_KEYS: EventCategoryType[] = [
  'WEDDING',
  'BIRTHDAY',
  'GRADUATION',
  'MEETING',
  'GALA_DINNER',
];

const OFFICIAL_PRODUCT_SCREENSHOTS = [
  {
    id: 'tracker',
    tabId: '1. Tracker',
    tabEn: '1. Tracker',
    badge: 'MODUL 1 • EXECUTIVE TRACKER',
    titleId: 'Dashboard Readiness Tracker & Countdown Multi-Acara',
    titleEn: 'Executive Readiness Tracker & Multi-Event Countdown',
    descId:
      'Pantau hitung mundur hari/jam/menit/detik tiap sesi acara, persentase kesiapan, ringkasan moneter, dan statistik kehadiran tamu secara real-time.',
    descEn:
      'Monitor live countdowns across event sessions, readiness percentage, budget overview, and guest attendance in real time.',
    imageUrl: '/showcase/showcase-1-tracker.png',
  },
  {
    id: 'checklist',
    tabId: '2. Checklist',
    tabEn: '2. Checklist',
    badge: 'MODUL 2 • TIMELINE & PIC',
    titleId: 'Checklist Persiapan Bertahap (H-6 Bulan s/d Hari-H)',
    titleEn: 'Phased Preparation Checklist (6 Months Prior to Event Day)',
    descId:
      'Kelola daftar tugas dan dokumen penting berdasarkan fase waktu, kategori, status penyelesaian, serta pembagian PIC tim/keluarga.',
    descEn:
      'Organize critical tasks and documents by timeline phase, category, status, and PIC assignment.',
    imageUrl: '/showcase/showcase-2-checklist.png',
  },
  {
    id: 'moneter',
    tabId: '3. Moneter',
    tabEn: '3. Budget',
    badge: 'MODUL 3 • ANGGARAN & VENDOR',
    titleId: 'Kalkulator Pagu Moneter, Realisasi & Pelunasan Vendor',
    titleEn: 'Budget Cap Calculator, Vendor Contracts & Payment Tracking',
    descId:
      'Kontrol target pagu anggaran, realisasi kontrak vendor, nominal DP yang sudah dibayar, hingga sisa pelunasan secara transparan.',
    descEn:
      'Control target budget caps, actual vendor contracts, paid deposits, and remaining balances transparently.',
    imageUrl: '/showcase/showcase-3-moneter.png',
  },
  {
    id: 'tamu',
    tabId: '4. Tamu & WA',
    tabEn: '4. Guests & WA',
    badge: 'MODUL 4 • CRM TAMU & BLAST WA',
    titleId: 'Manajemen Tamu VIP, Kuota Pax & Blast WhatsApp 1-Klik',
    titleEn: 'VIP Guest CRM, Pax Quota & 1-Click WhatsApp Blast',
    descId:
      'Kelola ribuan daftar tamu (Cetak & Online), kode unik INV-xxxx, kuota Pax fleksibel, status RSVP, serta kirim pesan WhatsApp personal 1-klik.',
    descEn:
      'Manage thousands of guests, unique INV-xxxx codes, flexible Pax quotas, RSVP statuses, and 1-click personalized WhatsApp links.',
    imageUrl: '/showcase/showcase-4-tamu.png',
  },
  {
    id: 'pengaturan',
    tabId: '5. Studio Undangan',
    tabEn: '5. Invitation Studio',
    badge: 'MODUL 5 • STUDIO UNDANGAN & VIDEO',
    titleId: 'Studio Kustomisasi Konten, Tema, Musik & Video Background',
    titleEn: 'Custom Invitation Studio, Themes, Music & Video Background',
    descId:
      'Atur seksi undangan, kutipan, galeri foto HD, jadwal acara, amplop digital (Bank/QRIS/PayPal/Crypto), hingga background video adaptif HP ke PC.',
    descEn:
      'Customize invitation sections, quotes, HD photo gallery, schedules, digital envelopes, and adaptive mobile-to-PC video backgrounds.',
    imageUrl: '/showcase/showcase-5-pengaturan.png',
  },
] as const;

type ExtendedPaymentTransaction = CommercialPaymentTransaction & {
  onChainVerified?: boolean;
  blockchainExplorerUrl?: string;
};

interface Web3Window {
  ethereum?: {
    request: (args: {
      method: string;
      params?: unknown[];
    }) => Promise<unknown>;
  };
  tronWeb?: {
    defaultAddress?: {
      base58?: string;
    };
  };
}

function computeDeterministicHash(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 33) ^ input.charCodeAt(i);
  }
  return (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds);
  const hrs = Math.floor(safe / 3600);
  const mins = Math.floor((safe % 3600) / 60);
  const secs = safe % 60;
  return [hrs, mins, secs]
    .map((n) => String(n).padStart(2, '0'))
    .join(':');
}

interface CommercialLandingViewProps {
  primarySettings: WeddingSettings;
  primaryGuests?: WeddingGuest[];
  clientGroups: ClientGroupItem[];
  clientWorkspaces?: Record<string, ClientWorkspaceData>;
  isAdminLoggedIn: boolean;
  adminUserName?: string;
  onOpenAdminPortal: () => void;
  onSelectClientInvitation: (
    clientId: string,
    guestTo?: string,
    guestCode?: string
  ) => void;
  onUpsertCommercialPayment?: (
    tx: CommercialPaymentTransaction
  ) => Promise<{
    ok: boolean;
    transaction: CommercialPaymentTransaction;
    timedOut?: boolean;
    error?: string;
  }>;
}

export const CommercialLandingView: React.FC<CommercialLandingViewProps> = ({
  primarySettings,
  primaryGuests,
  clientGroups,
  clientWorkspaces,
  isAdminLoggedIn,
  adminUserName,
  onOpenAdminPortal,
  onSelectClientInvitation,
  onUpsertCommercialPayment,
}) => {
  const [lang, setLang] = useState<'ID' | 'EN'>(
    primarySettings.defaultLanguage || 'ID'
  );
  const [copiedPaymentKey, setCopiedPaymentKey] = useState<string | null>(null);

  // Dedicated Checkout Page View State & Automatic 3-Step Payment Wizard State
  const [isCheckoutPageOpen, setIsCheckoutPageOpen] = useState(false);
  const [checkoutWizardStep, setCheckoutWizardStep] = useState<1 | 2 | 3>(1);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(86399);
  const [isConnectingWeb3, setIsConnectingWeb3] = useState(false);
  const [connectedWeb3Address, setConnectedWeb3Address] = useState<
    string | null
  >(null);
  const [verificationFeedback, setVerificationFeedback] = useState<
    string | null
  >(null);

  // Selected package tier & idempotent checkout state
  const [selectedCheckoutTier, setSelectedCheckoutTier] = useState<
    'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP'
  >('EXCLUSIVE');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCoupleName, setBuyerCoupleName] = useState('');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [simulateNetworkTimeout, setSimulateNetworkTimeout] = useState(false);
  const [activeTransaction, setActiveTransaction] =
    useState<ExtendedPaymentTransaction | null>(null);
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // 24-hour price lock countdown timer during Step 2
  useEffect(() => {
    if (!isCheckoutPageOpen || checkoutWizardStep !== 2) return;
    const timer = window.setInterval(() => {
      setCountdownSeconds((prev) => (prev > 0 ? prev - 1 : 86399));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isCheckoutPageOpen, checkoutWizardStep]);

  // Dynamic Superadmin Wallets / Payment Channels Strictly Filtered by Market (lang)
  const allConfiguredChannels = useMemo<CommercialPaymentChannel[]>(() => {
    const list = primarySettings.commercialPaymentChannels;
    return list && list.length > 0 ? list : DEFAULT_COMMERCIAL_PAYMENT_CHANNELS;
  }, [primarySettings.commercialPaymentChannels]);

  const activeMarketChannels = useMemo<CommercialPaymentChannel[]>(() => {
    return allConfiguredChannels.filter((ch) => {
      if (!ch.isActive) return false;
      if (lang === 'ID') {
        return ch.marketScope === 'ID' || ch.marketScope === 'BOTH';
      } else {
        if (ch.marketScope === 'ID') return false;
        if (
          ch.marketScope === 'BOTH' &&
          (ch.category === 'QRIS' || ch.category === 'BANK_TRANSFER')
        ) {
          return false;
        }
        return true;
      }
    });
  }, [allConfiguredChannels, lang]);

  const [selectedChannelId, setSelectedChannelId] = useState<string>(
    () => activeMarketChannels[0]?.id || ''
  );

  useEffect(() => {
    if (
      activeMarketChannels.length > 0 &&
      !activeMarketChannels.some((ch) => ch.id === selectedChannelId)
    ) {
      setSelectedChannelId(activeMarketChannels[0].id);
    }
  }, [activeMarketChannels, selectedChannelId]);

  const selectedChannel = useMemo<CommercialPaymentChannel | null>(() => {
    return (
      activeMarketChannels.find((c) => c.id === selectedChannelId) ||
      activeMarketChannels[0] ||
      null
    );
  }, [activeMarketChannels, selectedChannelId]);

  // Deterministic Idempotency Key & Order ID
  const { currentIdempotencyKey, currentOrderId } = useMemo(() => {
    const cleanEmail =
      buyerEmail
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .slice(0, 14) || 'guest';
    const tierCode = selectedCheckoutTier.replace(/\s+/g, '');
    const hashSuffix = computeDeterministicHash(
      `${buyerEmail.trim().toLowerCase() || 'guest'}|${tierCode}|${lang}`
    );
    return {
      currentIdempotencyKey: `IDEMP-MEP-${lang}-${tierCode}-${cleanEmail}-${hashSuffix}`,
      currentOrderId: `ORD-MEP-${tierCode.slice(0, 3)}-${hashSuffix}`,
    };
  }, [buyerEmail, selectedCheckoutTier, lang]);

  // Recover active idempotent transaction from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(IDEMPOTENT_TX_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as ExtendedPaymentTransaction;
      if (parsed && parsed.idempotencyKey) {
        setActiveTransaction(parsed);
        if (parsed.buyerEmail) setBuyerEmail(parsed.buyerEmail);
        if (parsed.buyerCoupleName) setBuyerCoupleName(parsed.buyerCoupleName);
        if (parsed.buyerWhatsapp) setBuyerWhatsapp(parsed.buyerWhatsapp);
        if (parsed.paymentReference)
          setPaymentReference(parsed.paymentReference);
        if (parsed.packageTier) setSelectedCheckoutTier(parsed.packageTier);
        if (parsed.channelId) setSelectedChannelId(parsed.channelId);
        if (
          parsed.status === 'PENDING_VERIFICATION' ||
          parsed.status === 'PAID_VERIFIED'
        ) {
          setHasCompletedPayment(true);
        }
      }
    } catch {
      // Ignore malformed storage
    }
  }, []);

  // Sync live status from Superadmin's primarySettings.commercialPayments
  useEffect(() => {
    const list = primarySettings.commercialPayments;
    if (!list || list.length === 0) return;
    const matched = list.find(
      (item) =>
        item.idempotencyKey === currentIdempotencyKey ||
        (activeTransaction &&
          item.idempotencyKey === activeTransaction.idempotencyKey)
    ) as ExtendedPaymentTransaction | undefined;
    if (matched) {
      setActiveTransaction((prev) => ({
        ...prev,
        ...matched,
      }));
      if (
        matched.status === 'PENDING_VERIFICATION' ||
        matched.status === 'PAID_VERIFIED'
      ) {
        setHasCompletedPayment(true);
      }
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.setItem(
            IDEMPOTENT_TX_STORAGE_KEY,
            JSON.stringify(matched)
          );
        } catch {
          // Ignore quota errors
        }
      }
    }
  }, [
    primarySettings.commercialPayments,
    currentIdempotencyKey,
    activeTransaction,
  ]);

  const [guestCodeInput, setGuestCodeInput] = useState('');
  const [selectedLookupClientId, setSelectedLookupClientId] =
    useState<string>('client-utama');
  const [showLookupSuggestions, setShowLookupSuggestions] = useState(false);
  const [lookupGateError, setLookupGateError] = useState<string | null>(null);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState<number>(0);
  const [showcaseViewMode, setShowcaseViewMode] = useState<
    'invitation_sim' | 'dashboard_modules'
  >('invitation_sim');
  const [simEventType, setSimEventType] = useState<
    'WEDDING' | 'BIRTHDAY' | 'GRADUATION' | 'MEETING' | 'GALA_DINNER'
  >('WEDDING');
  const [simIsOpened, setSimIsOpened] = useState<boolean>(true);
  const [simIsOpeningAnim, setSimIsOpeningAnim] = useState<boolean>(false);
  const [lightboxScreenshot, setLightboxScreenshot] = useState<{
    title: string;
    badge: string;
    desc: string;
    imageUrl: string;
  } | null>(null);

  const handleTriggerSimCoverOpen = () => {
    if (simIsOpeningAnim) return;
    setSimIsOpeningAnim(true);
    window.setTimeout(() => {
      setSimIsOpened(true);
      setSimIsOpeningAnim(false);
    }, 520);
  };

  const activeLookupClientGuests = useMemo<WeddingGuest[]>(() => {
    if (selectedLookupClientId === 'client-utama') {
      return primaryGuests || [];
    }
    return clientWorkspaces?.[selectedLookupClientId]?.guests || [];
  }, [selectedLookupClientId, primaryGuests, clientWorkspaces]);

  const filteredLookupGuests = useMemo<WeddingGuest[]>(() => {
    const q = guestCodeInput.trim().toLowerCase();
    if (q.length < 3) {
      return [];
    }
    return activeLookupClientGuests
      .filter(
        (g) =>
          g.guestName.toLowerCase().includes(q) ||
          g.invitationCode.toLowerCase().includes(q) ||
          (g.institution || '').toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [activeLookupClientGuests, guestCodeInput]);

  const rawDeveloperUrl = primarySettings.developerCreditUrl?.trim() || '';
  const developerUrl =
    !rawDeveloperUrl || /github\.com\/omeko11/i.test(rawDeveloperUrl)
      ? 'https://github.com/omeko42'
      : rawDeveloperUrl;
  const rawWa =
    primarySettings.contactWhatsappNumber?.trim() || '089638616516';
  const whatsappUrl = /^https?:\/\//i.test(rawWa)
    ? rawWa
    : `https://wa.me/${rawWa.replace(/\D/g, '').replace(/^0/, '62')}`;

  const rawPaypalConfig = primarySettings.commercialPaypalUrl?.trim() || '';
  const paypalHref =
    /^https?:\/\//i.test(rawPaypalConfig) &&
    rawPaypalConfig !== 'https://paypal.me/omeko42'
      ? rawPaypalConfig
      : 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY';

  // Official post-payment business email (only revealed once hasCompletedPayment === true)
  const businessEmail =
    primarySettings.contactBusinessEmail?.trim() || 'e98.bisnis@gmail.com';
  const mailtoPostPaymentUrl = `mailto:${businessEmail}?subject=${encodeURIComponent(
    lang === 'ID'
      ? `[Konfirmasi Bukti Bayar ${activeTransaction?.orderId || currentOrderId}] Paket ${selectedCheckoutTier} - ${buyerCoupleName || buyerEmail}`
      : `[Payment Receipt Confirmation ${activeTransaction?.orderId || currentOrderId}] ${selectedCheckoutTier} Plan - ${buyerCoupleName || buyerEmail}`
  )}&body=${encodeURIComponent(
    lang === 'ID'
      ? `Halo Tim My Event Planner,\n\nSaya telah melakukan pembayaran paket komersial dengan rincian berikut:\n- Order ID: ${activeTransaction?.orderId || currentOrderId}\n- Idempotency Key: ${activeTransaction?.idempotencyKey || currentIdempotencyKey}\n- Paket: ${selectedCheckoutTier}\n- Metode / Wallet: ${selectedChannel?.providerName || '-'}\n- Email Tujuan Pengiriman Akses (Maks. H+3): ${buyerEmail}\n- Nama Pasangan / Klien: ${buyerCoupleName || '-'}\n- No. Referensi / TXID: ${paymentReference || '-'}\n\nTerlampir bukti pembayaran kami. Terima kasih.`
      : `Hello My Event Planner Team,\n\nI have completed the payment for our commercial event planner suite:\n- Order ID: ${activeTransaction?.orderId || currentOrderId}\n- Idempotency Key: ${activeTransaction?.idempotencyKey || currentIdempotencyKey}\n- Plan: ${selectedCheckoutTier}\n- Payment Wallet: ${selectedChannel?.providerName || '-'}\n- Client Email for Credentials Delivery (Max D+3): ${buyerEmail}\n- Couple / Client Name: ${buyerCoupleName || '-'}\n- Reference / TXID: ${paymentReference || '-'}\n\nPlease find our payment receipt attached. Thank you.`
  )}`;

  const commercialPackages = useMemo(
    () =>
      [
        {
          tier: 'STARTER' as const,
          badge: lang === 'ID' ? 'STARTER • HEMAT' : 'STARTER • ENTRY',
          name: 'Starter Digital Invitation',
          priceMain: lang === 'ID' ? 'Rp 50.000' : '$10 USD',
          priceCryptoDisplay: '10 USDT',
          amountNumeric: lang === 'ID' ? 50000 : 10,
          priceStrike: lang === 'ID' ? 'Rp 150.000' : '$25 USD',
          priceSubBadge:
            lang === 'ID'
              ? 'Promo Spesial • Sekali Bayar Aktif Selamanya'
              : 'One-Time License • Or 10 USDT (Crypto)',
          styleVariant: 'starter' as const,
          features:
            lang === 'ID'
              ? [
                  'Maksimal 100 Pax Tamu Undangan',
                  'Foto Default Sesuai Tema + 2 Foto Pasangan',
                  'Tautan Undangan Mandiri (/?client=nama_pasangan)',
                  'Jadwal Acara, Hitung Mundur & Navigasi Google Maps',
                  'Form RSVP Real-Time & Buku Tamu Doa Restu',
                  'Amplop Digital Bank, E-Wallet, PayPal & Crypto USDT',
                ]
              : [
                  'Max 100 Guest Pax Quota',
                  'Theme Default Background + 2 Couple Photos',
                  'Dedicated Couple Invitation Link (/?client=couple_name)',
                  'Schedule, Countdown & Google Maps',
                  'Real-Time RSVP & Guestbook Wishes',
                  'Digital Envelope: Bank, E-Wallet, PayPal & Crypto',
                ],
        },
        {
          tier: 'EXCLUSIVE' as const,
          badge:
            lang === 'ID'
              ? '★ PALING POPULER • EXCLUSIVE'
              : '★ MOST POPULAR • EXCLUSIVE',
          name: 'Exclusive Planner & Gallery',
          priceMain: lang === 'ID' ? 'Rp 299.000' : '$25 USD',
          priceCryptoDisplay: '25 USDT',
          amountNumeric: lang === 'ID' ? 299000 : 25,
          priceStrike: lang === 'ID' ? 'Rp 600.000' : '$59 USD',
          priceSubBadge:
            lang === 'ID'
              ? 'Paket Paling Populer • Sekali Bayar'
              : 'Most Popular • Or 25 USDT (Crypto)',
          styleVariant: 'exclusive' as const,
          features:
            lang === 'ID'
              ? [
                  'Maksimal 500 Pax Tamu Undangan + Blast WhatsApp Otomatis',
                  'Bebas Kustom Background + Galeri Prewedding (s/d 10 Foto) & Kisah Cinta',
                  'Musik Latar Romantis & Kustomisasi Tema Warna',
                  'Dashboard Readiness Tracker, Checklist H-6 Bulan & Kalkulator Vendor',
                  'Moderasi Komentar & Statistik Insight Dasar',
                ]
              : [
                  'Up to 500 Guest Pax + Auto WhatsApp Blast',
                  'Custom Backgrounds + 10 Gallery Photos & Love Story',
                  'Romantic Background Music & Theme Presets',
                  '8-Domain Readiness Tracker, Timeline & Budget Suite',
                  'Comment Moderation & Basic Traffic Insights',
                ],
        },
        {
          tier: 'ROYAL VIP' as const,
          badge:
            lang === 'ID'
              ? '👑 PAKET TERLENGKAP • ROYAL VIP'
              : '👑 ALL-INCLUSIVE FLAGSHIP • ROYAL VIP',
          name: 'Royal VIP Flagship Suite',
          priceMain: lang === 'ID' ? 'Rp 599.000' : '$49 USD',
          priceCryptoDisplay: '49 USDT',
          amountNumeric: lang === 'ID' ? 599000 : 49,
          priceStrike: lang === 'ID' ? 'Rp 1.200.000' : '$99 USD',
          priceSubBadge:
            lang === 'ID'
              ? 'Paket Terlengkap Tanpa Batas • Sekali Bayar'
              : 'All-Inclusive Flagship • Or 49 USDT (Crypto)',
          styleVariant: 'royal' as const,
          features:
            lang === 'ID'
              ? [
                  'Unlimited Tamu Undangan (Tanpa Batas Pax) + Kode VIP Gate INV-xxxx',
                  'Unlimited Galeri Foto HD, Studio Crop Non-Destruktif & Upload Musik MP3',
                  'Multi-Akses 4 Akun Inti + Akun Panitia/WO',
                  'Full Insight Trafik & Audit Forensik Pelaku Komentar Negatif',
                  'Sinkronisasi Cloud Supabase + Google Sheets + Backup/Restore JSON',
                ]
              : [
                  'Unlimited Guest Pax + VIP Invitation Code Gate',
                  'Unlimited HD Gallery, Studio Crop & Custom MP3 Upload',
                  '4 Core Family Accounts + Unlimited WO/Committee Logins',
                  'Full Traffic Funnel Analytics & Negative Comment Forensic Audit',
                  'Full Supabase Cloud Sync, Google Sheets & JSON Backup',
                ],
        },
      ] as const,
    [lang]
  );

  const activeSelectedPackage = useMemo(
    () =>
      commercialPackages.find((p) => p.tier === selectedCheckoutTier) ||
      commercialPackages[1],
    [commercialPackages, selectedCheckoutTier]
  );

  const activeCheckoutAmountDisplay = useMemo(() => {
    if (lang === 'EN' && selectedChannel?.category === 'CRYPTO') {
      return `${activeSelectedPackage.priceCryptoDisplay} (${activeSelectedPackage.priceMain})`;
    }
    return activeSelectedPackage.priceMain;
  }, [lang, selectedChannel, activeSelectedPackage]);

  const handleSelectPackageForCheckout = (
    tier: 'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP'
  ) => {
    setSelectedCheckoutTier(tier);
    setIsCheckoutPageOpen(true);
    setCheckoutError(null);
    setVerificationFeedback(null);
    if (hasCompletedPayment) {
      setCheckoutWizardStep(3);
    } else {
      setCheckoutWizardStep(1);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getCategoryIcon = (cat: CommercialPaymentCategory) => {
    switch (cat) {
      case 'QRIS':
        return QrCode;
      case 'BANK_TRANSFER':
        return Building2;
      case 'CREDIT_CARD':
        return CreditCard;
      case 'PAYPAL':
        return Globe;
      case 'CRYPTO':
        return Coins;
      default:
        return Wallet;
    }
  };

  const persistLocalTransaction = (tx: ExtendedPaymentTransaction) => {
    setActiveTransaction(tx);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(
          IDEMPOTENT_TX_STORAGE_KEY,
          JSON.stringify(tx)
        );
      } catch {
        // Ignore storage quota error
      }
    }
  };

  // STEP 1 -> STEP 2: Create INITIATED Idempotent Invoice & Automatically Advance to Step 2
  const handleProceedToStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCouple = buyerCoupleName.trim();
    const trimmedEmail = buyerEmail.trim();

    if (!trimmedCouple) {
      setCheckoutError(
        lang === 'ID'
          ? 'Mohon isi Nama Pasangan Mempelai terlebih dahulu (misal: Romeo & Juliet).'
          : 'Please enter the Couple Name first (e.g. Romeo & Juliet).'
      );
      return;
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setCheckoutError(
        lang === 'ID'
          ? 'Mohon masukkan alamat email aktif Anda untuk pengiriman 4 Akun Default & Lisensi.'
          : 'Please enter a valid active email address for your 4 Core Accounts & License delivery.'
      );
      return;
    }
    if (!selectedChannel) {
      setCheckoutError(
        lang === 'ID'
          ? 'Pilih salah satu metode pembayaran di bawah.'
          : 'Please select a payment method below.'
      );
      return;
    }

    setCheckoutError(null);
    setVerificationFeedback(null);

    const nowIso = new Date().toISOString();
    const currency: 'IDR' | 'USD' | 'USDT' =
      lang === 'ID'
        ? 'IDR'
        : selectedChannel.category === 'CRYPTO'
          ? 'USDT'
          : 'USD';

    const initiatedTx: ExtendedPaymentTransaction = {
      id: `tx-${currentOrderId.toLowerCase()}`,
      orderId: currentOrderId,
      idempotencyKey: currentIdempotencyKey,
      packageTier: selectedCheckoutTier,
      marketLang: lang,
      currency,
      amountNumeric: activeSelectedPackage.amountNumeric,
      amountDisplay: activeSelectedPackage.priceMain,
      channelId: selectedChannel.id,
      channelCategory: selectedChannel.category,
      channelProviderName: selectedChannel.providerName,
      channelTargetAccount: selectedChannel.accountOrWalletAddress,
      buyerEmail: trimmedEmail,
      buyerCoupleName: trimmedCouple,
      buyerWhatsapp: buyerWhatsapp.trim() || undefined,
      paymentReference: paymentReference.trim() || undefined,
      status: 'INITIATED',
      retryCount: 0,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    persistLocalTransaction(initiatedTx);
    if (onUpsertCommercialPayment) {
      void onUpsertCommercialPayment(initiatedTx);
    }

    setCheckoutWizardStep(2);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Plugin 1 Helper: One-Click Web3 Wallet Connect (MetaMask / TrustWallet / TronLink)
  const handleConnectAndPayWeb3 = async () => {
    if (!selectedChannel) return;
    setIsConnectingWeb3(true);
    setCheckoutError(null);
    setVerificationFeedback(null);

    try {
      const w =
        typeof window !== 'undefined'
          ? (window as unknown as Web3Window)
          : undefined;

      // Check TronLink if TRC20
      const isTrc20 = (selectedChannel.networkOrBranch || '')
        .toUpperCase()
        .includes('TRC20');
      if (isTrc20 && w?.tronWeb?.defaultAddress?.base58) {
        const tronAddr = w.tronWeb.defaultAddress.base58;
        setConnectedWeb3Address(tronAddr);
        handleCopyPaymentValue(
          'target-wallet',
          selectedChannel.accountOrWalletAddress
        );
        const autoRef = `TRC20-${tronAddr.slice(0, 6)}-${currentOrderId}`;
        if (!paymentReference.trim()) {
          setPaymentReference(autoRef);
        }
        setVerificationFeedback(
          lang === 'ID'
            ? `Wallet TronLink terhubung (${tronAddr.slice(0, 6)}...${tronAddr.slice(-4)}). Alamat tujuan TRC20 telah disalin—silakan konfirmasi pengiriman USDT Anda lalu klik Verifikasi Otomatis di bawah.`
            : `TronLink Wallet connected (${tronAddr.slice(0, 6)}...${tronAddr.slice(-4)}). Target TRC20 address copied—confirm your USDT transfer and click Auto-Verify below.`
        );
        setIsConnectingWeb3(false);
        return;
      }

      // Check EVM Wallet (MetaMask / TrustWallet / Coinbase Wallet / Rabby)
      if (w?.ethereum) {
        const accounts = (await w.ethereum.request({
          method: 'eth_requestAccounts',
        })) as string[];
        const sender = accounts?.[0] || '';
        if (sender) {
          setConnectedWeb3Address(sender);
          handleCopyPaymentValue(
            'target-wallet',
            selectedChannel.accountOrWalletAddress
          );
          if (!paymentReference.trim()) {
            setPaymentReference(
              `0x${computeDeterministicHash(sender + currentOrderId).toLowerCase()}${computeDeterministicHash(currentIdempotencyKey).toLowerCase()}`
            );
          }
          setVerificationFeedback(
            lang === 'ID'
              ? `Web3 Wallet terhubung (${sender.slice(0, 6)}...${sender.slice(-4)}). Silakan selesaikan transfer USDT ke alamat wallet yang telah disalin, lalu klik tombol Verifikasi Blockchain di bawah.`
              : `Web3 Wallet connected (${sender.slice(0, 6)}...${sender.slice(-4)}). Complete the USDT transfer to the copied treasury address, then click Auto-Verify on Blockchain below.`
          );
          setIsConnectingWeb3(false);
          return;
        }
      }

      // Fallback if no browser Web3 extension is installed
      handleCopyPaymentValue(
        'target-wallet',
        selectedChannel.accountOrWalletAddress
      );
      setVerificationFeedback(
        lang === 'ID'
          ? 'Alamat Wallet Crypto telah disalin otomatis! Silakan kirim melalui aplikasi Binance, Indodax, TrustWallet, atau MetaMask Mobile Anda, lalu tempelkan TXID di bawah.'
          : 'Crypto Wallet Address copied! Send USDT from your mobile wallet or exchange (Binance, TrustWallet, MetaMask, etc.) and paste the TXID below.'
      );
    } catch (err) {
      setCheckoutError(
        err instanceof Error
          ? err.message
          : lang === 'ID'
            ? 'Gagal menghubungkan Web3 Wallet. Anda tetap dapat menyalin alamat wallet secara manual.'
            : 'Could not connect Web3 Wallet extension. You can still copy the wallet address manually.'
      );
    } finally {
      setIsConnectingWeb3(false);
    }
  };

  // Plugin 2 Helper: Open Centered PayPal / Card Smart Checkout Popup & Auto-Prefill Reference
  const handleOpenPaypalSmartPopup = () => {
    if (!selectedChannel) return;
    const url = selectedChannel.checkoutUrl || paypalHref;
    if (typeof window !== 'undefined') {
      const width = 520;
      const height = 680;
      const left = Math.max(0, Math.round((window.screen.width - width) / 2));
      const top = Math.max(0, Math.round((window.screen.height - height) / 2));
      window.open(
        url,
        'MEPPayPalCheckout',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      );
    }
    if (!paymentReference.trim()) {
      setPaymentReference(`PAYPAL-${currentOrderId}`);
    }
    setVerificationFeedback(
      lang === 'ID'
        ? `Jendela pembayaran resmi ${selectedChannel.providerName} telah dibuka dan ID Referensi (${`PAYPAL-${currentOrderId}`}) telah diisi otomatis. Setelah selesai membayar di popup, klik tombol Verifikasi di bawah!`
        : `Official ${selectedChannel.providerName} checkout window opened and Reference ID (${`PAYPAL-${currentOrderId}`}) auto-filled. Once you complete payment in the popup, click Verify below!`
    );
  };

  // STEP 2 -> STEP 3: Execute Automatic Verification (/api/payment/verify) + Upsert + Advance to Step 3
  const executeIdempotentPaymentSubmission = async () => {
    const trimmedEmail = buyerEmail.trim();
    const trimmedCouple = buyerCoupleName.trim();
    const trimmedRef = paymentReference.trim();

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setCheckoutError(
        lang === 'ID'
          ? 'Mohon masukkan alamat email aktif Anda.'
          : 'Please enter a valid active email address.'
      );
      return;
    }
    if (!trimmedCouple) {
      setCheckoutError(
        lang === 'ID'
          ? 'Mohon isi Nama Pasangan Mempelai.'
          : 'Please enter the Couple Name.'
      );
      return;
    }
    if (!trimmedRef) {
      setCheckoutError(
        lang === 'ID'
          ? 'Mohon masukkan Nomor Referensi / TXID / ID Transaksi atau gunakan tombol isi otomatis.'
          : 'Please enter your Payment Reference / TXID / Transaction ID.'
      );
      return;
    }
    if (!selectedChannel) {
      setCheckoutError(
        lang === 'ID'
          ? 'Pilih metode pembayaran terlebih dahulu.'
          : 'Please select a payment method first.'
      );
      return;
    }

    setCheckoutError(null);
    setIsSubmittingPayment(true);

    const nowIso = new Date().toISOString();
    const isSameIdempotencyKey =
      activeTransaction?.idempotencyKey === currentIdempotencyKey;
    const nextRetryCount = isSameIdempotencyKey
      ? (activeTransaction?.retryCount || 0) +
        (activeTransaction?.status === 'FAILED_TIMEOUT' ? 1 : 0)
      : 0;

    const currency: 'IDR' | 'USD' | 'USDT' =
      lang === 'ID'
        ? 'IDR'
        : selectedChannel.category === 'CRYPTO'
          ? 'USDT'
          : 'USD';

    let verifiedStatus: CommercialPaymentStatus = 'PENDING_VERIFICATION';
    let isOnChainConfirmed = false;
    let explorerUrl: string | undefined;
    let verifiedByActor: string | undefined;

    try {
      if (simulateNetworkTimeout) {
        await new Promise((resolve) => window.setTimeout(resolve, 650));
        const timeoutTx: ExtendedPaymentTransaction = {
          id:
            isSameIdempotencyKey && activeTransaction?.id
              ? activeTransaction.id
              : `tx-${currentOrderId.toLowerCase()}`,
          orderId: currentOrderId,
          idempotencyKey: currentIdempotencyKey,
          packageTier: selectedCheckoutTier,
          marketLang: lang,
          currency,
          amountNumeric: activeSelectedPackage.amountNumeric,
          amountDisplay: activeSelectedPackage.priceMain,
          channelId: selectedChannel.id,
          channelCategory: selectedChannel.category,
          channelProviderName: selectedChannel.providerName,
          channelTargetAccount: selectedChannel.accountOrWalletAddress,
          buyerEmail: trimmedEmail,
          buyerCoupleName: trimmedCouple,
          buyerWhatsapp: buyerWhatsapp.trim() || undefined,
          paymentReference: trimmedRef,
          status: 'FAILED_TIMEOUT',
          retryCount: nextRetryCount,
          lastErrorOrTimeoutReason:
            lang === 'ID'
              ? 'Waktu tunggu koneksi habis (Request Timeout). Jangan khawatir, Idempotency Key Anda telah dikunci—silakan klik Retry tanpa risiko duplikat.'
              : 'Network request timed out. Your Idempotency Key is locked—safely click Retry without risking duplicate orders.',
          expiresAt:
            isSameIdempotencyKey && activeTransaction?.expiresAt
              ? activeTransaction.expiresAt
              : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          createdAt:
            isSameIdempotencyKey && activeTransaction?.createdAt
              ? activeTransaction.createdAt
              : nowIso,
          updatedAt: nowIso,
        };
        persistLocalTransaction(timeoutTx);
        setSimulateNetworkTimeout(false);
        setIsSubmittingPayment(false);
        return;
      }

      // Call Server-Side Automatic Payment & Blockchain Verifier (/api/payment/verify)
      try {
        const verifyRes = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            orderId: currentOrderId,
            idempotencyKey: currentIdempotencyKey,
            category: selectedChannel.category,
            network: selectedChannel.networkOrBranch,
            txHashOrRef: trimmedRef,
            expectedWalletAddress: selectedChannel.accountOrWalletAddress,
            expectedAmount: activeSelectedPackage.amountNumeric,
            currency,
          }),
        });
        if (verifyRes.ok) {
          const verifyJson = (await verifyRes.json()) as {
            ok?: boolean;
            status?: CommercialPaymentStatus;
            onChainVerified?: boolean;
            blockchainExplorerUrl?: string;
            verifiedBy?: string;
          };
          if (verifyJson.status) {
            verifiedStatus = verifyJson.status;
          }
          if (verifyJson.onChainVerified) {
            isOnChainConfirmed = true;
            verifiedStatus = 'PAID_VERIFIED';
          }
          if (verifyJson.blockchainExplorerUrl) {
            explorerUrl = verifyJson.blockchainExplorerUrl;
          }
          if (verifyJson.verifiedBy) {
            verifiedByActor = verifyJson.verifiedBy;
          }
        }
      } catch {
        // Fallback gracefully if offline or route unavailable
      }

      const draftTx: ExtendedPaymentTransaction = {
        id:
          isSameIdempotencyKey && activeTransaction?.id
            ? activeTransaction.id
            : `tx-${currentOrderId.toLowerCase()}`,
        orderId:
          isSameIdempotencyKey && activeTransaction?.orderId
            ? activeTransaction.orderId
            : currentOrderId,
        idempotencyKey: currentIdempotencyKey,
        packageTier: selectedCheckoutTier,
        marketLang: lang,
        currency,
        amountNumeric: activeSelectedPackage.amountNumeric,
        amountDisplay: activeSelectedPackage.priceMain,
        channelId: selectedChannel.id,
        channelCategory: selectedChannel.category,
        channelProviderName: selectedChannel.providerName,
        channelTargetAccount: selectedChannel.accountOrWalletAddress,
        buyerEmail: trimmedEmail,
        buyerCoupleName: trimmedCouple,
        buyerWhatsapp: buyerWhatsapp.trim() || undefined,
        paymentReference: trimmedRef,
        status: verifiedStatus,
        retryCount: nextRetryCount,
        verifiedAt: verifiedStatus === 'PAID_VERIFIED' ? nowIso : undefined,
        verifiedBy: verifiedByActor,
        onChainVerified: isOnChainConfirmed,
        blockchainExplorerUrl: explorerUrl,
        expiresAt:
          isSameIdempotencyKey && activeTransaction?.expiresAt
            ? activeTransaction.expiresAt
            : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt:
          isSameIdempotencyKey && activeTransaction?.createdAt
            ? activeTransaction.createdAt
            : nowIso,
        updatedAt: nowIso,
      };

      persistLocalTransaction(draftTx);

      if (onUpsertCommercialPayment) {
        const result = await onUpsertCommercialPayment(draftTx);
        if (!result.ok || result.timedOut) {
          const failedTx: ExtendedPaymentTransaction = {
            ...draftTx,
            status: 'FAILED_TIMEOUT',
            lastErrorOrTimeoutReason:
              result.error ||
              (lang === 'ID'
                ? 'Koneksi ke server pembayaran timeout. Silakan klik Retry (Idempoten).'
                : 'Connection to payment gateway timed out. Please click Retry (Idempotent).'),
            updatedAt: new Date().toISOString(),
          };
          persistLocalTransaction(failedTx);
          setIsSubmittingPayment(false);
          return;
        }
        const mergedTx: ExtendedPaymentTransaction = {
          ...result.transaction,
          onChainVerified:
            isOnChainConfirmed ||
            (result.transaction as ExtendedPaymentTransaction).onChainVerified,
          blockchainExplorerUrl:
            explorerUrl ||
            (result.transaction as ExtendedPaymentTransaction)
              .blockchainExplorerUrl,
        };
        persistLocalTransaction(mergedTx);
      }

      setHasCompletedPayment(true);
      setCheckoutWizardStep(3);
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      const failedTx: ExtendedPaymentTransaction = {
        id: `tx-${currentOrderId.toLowerCase()}`,
        orderId: currentOrderId,
        idempotencyKey: currentIdempotencyKey,
        packageTier: selectedCheckoutTier,
        marketLang: lang,
        currency,
        amountNumeric: activeSelectedPackage.amountNumeric,
        amountDisplay: activeSelectedPackage.priceMain,
        channelId: selectedChannel.id,
        channelCategory: selectedChannel.category,
        channelProviderName: selectedChannel.providerName,
        channelTargetAccount: selectedChannel.accountOrWalletAddress,
        buyerEmail: trimmedEmail,
        buyerCoupleName: trimmedCouple,
        buyerWhatsapp: buyerWhatsapp.trim() || undefined,
        paymentReference: trimmedRef,
        status: 'FAILED_TIMEOUT',
        retryCount: nextRetryCount,
        lastErrorOrTimeoutReason:
          err instanceof Error
            ? err.message
            : lang === 'ID'
              ? 'Gangguan jaringan saat mengirim konfirmasi pembayaran.'
              : 'Network error while submitting payment confirmation.',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      persistLocalTransaction(failedTx);
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const handleConfirmPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void executeIdempotentPaymentSubmission();
  };

  const handleCopyPaymentValue = (key: string, value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
      setCopiedPaymentKey(key);
      window.setTimeout(() => setCopiedPaymentKey(null), 2000);
    }
  };

  const openLightboxAt = (idx: number) => {
    const safeIdx =
      ((idx % OFFICIAL_PRODUCT_SCREENSHOTS.length) +
        OFFICIAL_PRODUCT_SCREENSHOTS.length) %
      OFFICIAL_PRODUCT_SCREENSHOTS.length;
    setActiveShowcaseIdx(safeIdx);
    const shot = OFFICIAL_PRODUCT_SCREENSHOTS[safeIdx];
    setLightboxScreenshot({
      title: lang === 'ID' ? shot.titleId : shot.titleEn,
      badge: shot.badge,
      desc: lang === 'ID' ? shot.descId : shot.descEn,
      imageUrl: shot.imageUrl,
    });
  };

  const scrollToShowcase = () => {
    setIsCheckoutPageOpen(false);
    if (typeof document !== 'undefined') {
      window.setTimeout(() => {
        document
          .getElementById('showcase')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 40);
    }
  };

  const handleQuickLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLookupSuggestions(false);
    const trimmed = guestCodeInput.trim();
    if (trimmed.length < 3) {
      if (isAdminLoggedIn) {
        setLookupGateError(null);
        onSelectClientInvitation(selectedLookupClientId);
        return;
      }
      setLookupGateError(
        lang === 'ID'
          ? 'Masukkan Kode Undangan (contoh: INV-0001) atau Nama Tamu yang terdaftar untuk membuka undangan privat.'
          : 'Enter a registered Invitation Code (e.g., INV-0001) or Guest Name to open this private invitation.'
      );
      return;
    }
    const lower = trimmed.toLowerCase();
    const matched =
      activeLookupClientGuests.find(
        (g) =>
          g.invitationCode.toLowerCase() === lower ||
          g.guestName.toLowerCase() === lower
      ) ||
      activeLookupClientGuests.find(
        (g) =>
          g.guestName.toLowerCase().includes(lower) ||
          g.invitationCode.toLowerCase().includes(lower)
      );
    if (matched) {
      setLookupGateError(null);
      onSelectClientInvitation(
        selectedLookupClientId,
        matched.guestName,
        matched.invitationCode
      );
      return;
    }
    if (isAdminLoggedIn) {
      setLookupGateError(null);
      onSelectClientInvitation(selectedLookupClientId, trimmed, undefined);
      return;
    }
    setLookupGateError(
      lang === 'ID'
        ? 'Masukkan Kode Undangan (contoh: INV-0001) atau Nama Tamu yang terdaftar untuk membuka undangan privat.'
        : 'Enter a registered Invitation Code (e.g., INV-0001) or Guest Name to open this private invitation.'
    );
  };

  return (
    <div className="min-h-screen pt-16 sm:pt-20 overflow-x-clip bg-[#FAF8F5] text-stone-800 flex flex-col justify-between selection:bg-[#D4AF37]/30">
      {/* TOP FIXED NAVBAR (Locked at Top + Separate Individual Cards + Automatic Icon-Only on HP) */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-xl border-b border-[#D4AF37]/30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 h-16 sm:h-20 flex items-center justify-between gap-1 sm:gap-3 min-w-0">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-1.5 sm:gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setIsCheckoutPageOpen(false)}
              className="flex items-center justify-center shrink-0 hover:scale-105 transition-transform"
              title="MEPlan — My Event Planner (Wedding, Birthday, Graduation, Rapat & Gala Dinner)"
            >
              <WeddingRingsIcon
                className="w-8 h-8 sm:w-10 sm:h-10"
                logoUrl={(primarySettings as any).brandLogoUrl}
              />
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  onClick={() => setIsCheckoutPageOpen(false)}
                  title="MEPlan — My Event Planner (Wedding, Birthday, Graduation, Rapat & Gala Dinner)"
                  className="font-serif font-extrabold text-sm sm:text-lg lg:text-xl text-stone-900 truncate leading-tight text-left hover:text-[#8B6914] transition-colors"
                >
                  <span className="sm:hidden font-sans font-extrabold tracking-tight text-stone-900">
                    ME<span className="font-semibold text-indigo-950">Plan</span>
                  </span>
                  <span className="hidden sm:inline-flex items-baseline gap-2">
                    <span className="font-sans font-extrabold tracking-tight text-stone-900">
                      ME<span className="font-semibold text-indigo-950">Plan</span>
                    </span>
                    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#8B6914]">
                      My Event Planner
                    </span>
                  </span>
                </button>
              </div>
              <p className="text-[10px] sm:text-xs font-bold text-[#8B6914] leading-tight truncate">
                by{' '}
                <a
                  href={developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  title="GitHub Profile @omeko42"
                >
                  omeko42
                </a>{' '}
                <span className="font-normal text-stone-500 hidden xl:inline">
                  &bull;{' '}
                  {lang === 'ID'
                    ? 'Wedding, Birthday, Graduation, Rapat & Gala Dinner'
                    : 'Wedding, Birthday, Graduation, Corporate & Gala Dinner'}
                </span>
              </p>
            </div>
          </div>

          {/* Center Navigation Links — Separate Individual Cards (Masing-Masing) + Automatic Icon-Only on HP */}
          <nav className="flex items-center gap-1 sm:gap-2 shrink-0">
            <a
              href="#showcase"
              onClick={() => setIsCheckoutPageOpen(false)}
              title="Lihat Katalog Screenshot 5 Modul My Event Planner"
              className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-800 hover:text-[#8B6914] text-xs lg:text-sm font-extrabold whitespace-nowrap shadow-2xs transition-all"
            >
              <Eye className="w-4 h-4 text-[#B68D40] shrink-0" />
              <span className="hidden md:inline whitespace-nowrap truncate">
                {lang === 'ID' ? 'Katalog Fitur' : 'Showcase'}
              </span>
            </a>

            <a
              href="#fitur"
              onClick={() => setIsCheckoutPageOpen(false)}
              title={
                lang === 'ID'
                  ? 'Fitur & 6 Modul Manajemen Persiapan Multi-Acara'
                  : 'Features & 6 Multi-Event Readiness Modules'
              }
              className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-800 hover:text-[#8B6914] text-xs lg:text-sm font-extrabold whitespace-nowrap shadow-2xs transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-[#B68D40] shrink-0" />
              <span className="hidden md:inline whitespace-nowrap truncate">
                {lang === 'ID' ? 'Fitur' : 'Features'}
              </span>
            </a>

            <a
              href="#paket"
              onClick={() => setIsCheckoutPageOpen(false)}
              title={
                lang === 'ID'
                  ? 'Paket Langganan Komersial (QRIS, Transfer Bank, Kartu Kredit, PayPal & Crypto)'
                  : 'Commercial Pricing Plans (Credit Card, PayPal & Crypto USDT)'
              }
              className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl border border-[#D4AF37]/40 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-800 hover:text-[#8B6914] text-xs lg:text-sm font-extrabold whitespace-nowrap shadow-2xs transition-all"
            >
              <Award className="w-4 h-4 text-[#B68D40] shrink-0" />
              <span className="hidden md:inline whitespace-nowrap truncate">
                {lang === 'ID' ? 'Paket' : 'Pricing'}
              </span>
            </a>
          </nav>

          {/* Right Action Buttons — Separate Individual Cards + Compact Icon-Only on HP */}
          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {/* Bilingual Language & Market Switcher */}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
              title={
                lang === 'ID'
                  ? 'Ganti Bahasa (ID / EN)'
                  : 'Switch Language (EN / ID)'
              }
              className="inline-flex items-center justify-center gap-1 px-2 sm:px-3.5 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-stone-800 hover:text-[#8B6914] text-xs lg:text-sm font-extrabold whitespace-nowrap shadow-2xs transition-all"
            >
              <Globe className="w-4 h-4 text-[#B68D40] shrink-0" />
              <span className="hidden sm:inline">
                {lang === 'ID' ? '🇮🇩 ID' : '🇬🇧 EN'}
              </span>
              <span className="sm:hidden text-[10px]">{lang}</span>
            </button>

            {/* Live Demo Individual Button -> Scrolls to #showcase & Opens Official Product Tour */}
            <button
              type="button"
              onClick={() => {
                scrollToShowcase();
                openLightboxAt(activeShowcaseIdx);
              }}
              title={
                lang === 'ID'
                  ? 'Lihat Tur Screenshot 5 Modul My Event Planner (Layar Penuh)'
                  : 'Open 5-Module Product Screenshot Tour (Fullscreen)'
              }
              className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] text-xs lg:text-sm font-bold whitespace-nowrap shadow-2xs transition-all"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span className="hidden lg:inline whitespace-nowrap truncate">
                {lang === 'ID' ? 'Tur Produk' : 'Product Tour'}
              </span>
            </button>

            {/* Login Klien / Dashboard Individual Button */}
            <button
              type="button"
              onClick={onOpenAdminPortal}
              title={
                isAdminLoggedIn
                  ? lang === 'ID'
                    ? `Buka Workspace Dashboard (${adminUserName || 'Admin'})`
                    : `Open Workspace Dashboard (${adminUserName || 'Admin'})`
                  : lang === 'ID'
                    ? 'Masuk ke Portal Klien, Panitia EO/WO, atau Superadmin'
                    : 'Login to Client, Event Organizer, or Superadmin Portal'
              }
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white text-xs lg:text-sm font-extrabold whitespace-nowrap shadow-sm transition-all"
            >
              {isAdminLoggedIn ? (
                <>
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">Dashboard</span>
                  {adminUserName && (
                    <span className="hidden xl:inline">({adminUserName})</span>
                  )}
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 shrink-0" />
                  <span className="hidden sm:inline">
                    {lang === 'ID' ? 'Login Klien' : 'Client Login'}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT: EITHER FULL-AUTO 3-STEP PAYMENT WIZARD OR MAIN LANDING PAGE */}
      <main className="flex-1 min-w-0">
        {isCheckoutPageOpen ? (
          /* DEDICATED 2-COLUMN FULL-AUTO 3-STEP PAYMENT GATEWAY WIZARD */
          <section className="py-8 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 min-w-0">
            {/* Top Back Button & 3 Separate Step Cards (Masing-Masing) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="max-w-full rounded-2xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/45 px-3.5 py-2.5 text-[#8B6914] font-extrabold text-xs sm:text-sm shadow-2xs inline-flex items-center gap-2 self-start md:self-auto transition-all"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" />
                <span className="truncate">
                  {lang === 'ID'
                    ? 'Kembali ke Halaman Paket & Katalog'
                    : 'Back to Pricing Plans & Catalog'}
                </span>
              </button>

              <div className="grid grid-cols-3 gap-2 w-full md:w-auto min-w-0">
                <button
                  type="button"
                  onClick={() => setCheckoutWizardStep(1)}
                  className={`min-w-0 px-2 sm:px-4 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                    checkoutWizardStep === 1
                      ? 'bg-stone-900 text-[#D4AF37] border-[#D4AF37] ring-2 ring-[#D4AF37]/40'
                      : 'bg-white text-[#8B6914] border-[#D4AF37]/40 hover:bg-[#FAF3E3]'
                  }`}
                >
                  <span className="sm:hidden truncate">
                    1. {lang === 'ID' ? 'Metode' : 'Method'}
                  </span>
                  <span className="hidden sm:inline truncate">
                    1.{' '}
                    {lang === 'ID'
                      ? `Identitas & Metode (${selectedCheckoutTier})`
                      : `Identity & Method (${selectedCheckoutTier})`}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (buyerCoupleName.trim() && buyerEmail.includes('@')) {
                      setCheckoutWizardStep(2);
                    }
                  }}
                  className={`min-w-0 px-2 sm:px-4 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                    checkoutWizardStep === 2
                      ? 'bg-stone-900 text-[#D4AF37] border-[#D4AF37] ring-2 ring-[#D4AF37]/40'
                      : buyerCoupleName.trim() && buyerEmail.includes('@')
                        ? 'bg-white text-[#8B6914] border-[#D4AF37]/40 hover:bg-[#FAF3E3]'
                        : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  <span className="sm:hidden truncate">
                    2. {lang === 'ID' ? 'Bayar' : 'Pay'}
                  </span>
                  <span className="hidden sm:inline truncate">
                    2.{' '}
                    {lang === 'ID'
                      ? 'Pembayaran Otomatis'
                      : 'Automated Payment'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (hasCompletedPayment) {
                      setCheckoutWizardStep(3);
                    }
                  }}
                  className={`min-w-0 px-2 sm:px-4 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 shadow-2xs ${
                    checkoutWizardStep === 3
                      ? 'bg-emerald-800 text-[#E6C76B] border-[#D4AF37] ring-2 ring-[#D4AF37]'
                      : hasCompletedPayment
                        ? 'bg-emerald-700 text-white border-emerald-600 hover:bg-emerald-800'
                        : 'bg-stone-100 text-stone-400 border-stone-200 cursor-not-allowed'
                  }`}
                >
                  <span className="sm:hidden truncate">
                    3. {lang === 'ID' ? 'Lisensi' : 'License'}
                  </span>
                  <span className="hidden sm:inline truncate">
                    3.{' '}
                    {lang === 'ID'
                      ? 'Sertifikat & Lisensi'
                      : 'Certificate & License'}
                  </span>
                </button>
              </div>
            </div>

            {/* 2-COLUMN EXECUTIVE PAYMENT GATEWAY GRID */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start min-w-0">
              {/* LEFT COLUMN (lg:col-span-5): INVOICE SUMMARY, PACKAGE SWITCHER & IDEMPOTENCY PROTECTION */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 min-w-0 space-y-5">
                <div className="rounded-3xl bg-gradient-to-br from-[#1C1613] via-[#221A15] to-[#2A2019] text-[#FAF3E3] border-2 border-[#D4AF37] p-5 sm:p-6 shadow-[0_20px_50px_rgba(182,141,64,0.22)] space-y-5 min-w-0 overflow-hidden">
                  {/* Quick Tier Switcher Tabs (Separate Individual Cards) */}
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#E6C76B]">
                      {lang === 'ID'
                        ? 'Pilih / Ganti Paket Lisensi:'
                        : 'Select / Switch License Plan:'}
                    </p>
                    <div className="grid grid-cols-3 gap-2 min-w-0">
                      {(['STARTER', 'EXCLUSIVE', 'ROYAL VIP'] as const).map(
                        (t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setSelectedCheckoutTier(t)}
                            className={`min-w-0 truncate py-2 px-1.5 sm:px-2 rounded-xl border border-[#D4AF37]/40 text-[10px] sm:text-[11px] font-extrabold transition-all ${
                              selectedCheckoutTier === t
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 shadow-sm'
                                : 'bg-white/5 text-[#FAF3E3]/80 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            {t}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Selected Package Details & Strictly Separated Market Price */}
                  <div className="space-y-3 pt-2 border-t border-white/15 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#E6C76B] text-[10px] font-extrabold uppercase tracking-wider">
                        {activeSelectedPackage.badge}
                      </span>
                      <span className="text-[10px] font-mono text-stone-300">
                        {activeTransaction?.orderId || currentOrderId}
                      </span>
                    </div>

                    <h2 className="font-serif text-2xl font-extrabold text-white">
                      {activeSelectedPackage.name}
                    </h2>

                    <div className="p-4 rounded-2xl bg-white/10 border border-[#D4AF37]/40 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest text-[#E6C76B] font-extrabold">
                        {lang === 'ID'
                          ? 'Total Tagihan Resmi (IDR)'
                          : 'Official License Amount (Global)'}
                      </p>
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-3xl font-extrabold text-white">
                          {activeCheckoutAmountDisplay}
                        </span>
                        <span className="text-xs font-bold line-through text-stone-400">
                          {activeSelectedPackage.priceStrike}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#E8DFD1]">
                        {activeSelectedPackage.priceSubBadge}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#E6C76B]">
                        {lang === 'ID'
                          ? 'Fitur & Fasilitas Paket:'
                          : 'Included Plan Features:'}
                      </p>
                      <ul className="space-y-2 text-xs text-[#E8DFD1]">
                        {activeSelectedPackage.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Strict Idempotency Database Protection Box */}
                  <div className="p-4 rounded-2xl bg-stone-950/80 border border-[#D4AF37]/35 space-y-2 text-xs min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-[#E6C76B] flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#D4AF37] shrink-0" />
                        <span>
                          {lang === 'ID'
                            ? 'Proteksi Transaksi Idempoten'
                            : 'Strict Idempotency Protection'}
                        </span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                        ANTI-DUPLICATE
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-stone-300 space-y-0.5 bg-black/40 p-2.5 rounded-xl border border-white/10 min-w-0 overflow-hidden">
                      <p className="truncate">
                        <span className="text-stone-400">Order ID:</span>{' '}
                        <strong className="text-white">
                          {activeTransaction?.orderId || currentOrderId}
                        </strong>
                      </p>
                      <p className="truncate">
                        <span className="text-stone-400">
                          Idempotency Key:
                        </span>{' '}
                        <strong className="text-[#E6C76B]">
                          {activeTransaction?.idempotencyKey ||
                            currentIdempotencyKey}
                        </strong>
                      </p>
                    </div>
                    <p className="text-[11px] text-stone-300 leading-relaxed">
                      {lang === 'ID'
                        ? 'Dilindungi Sistem Idempotensi Ketat: Jika koneksi terputus atau timeout saat konfirmasi, klik Retry kapan saja tanpa khawatir data ganda atau tagihan berulang.'
                        : 'Protected by Strict Idempotency: If your connection drops or times out during confirmation, you can safely retry without duplicate orders or double charges.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN (lg:col-span-7): AUTOMATIC 3-STEP WIZARD SCREENS (ONLY CURRENT STEP RENDERED) */}
              <div className="lg:col-span-7 min-w-0">
                {/* ===================================================================== */}
                {/* SCREEN 1: IDENTITAS KLIEN & PILIH METODE PEMBAYARAN AMAN              */}
                {/* ===================================================================== */}
                {checkoutWizardStep === 1 && (
                  <form
                    onSubmit={handleProceedToStep2}
                    className="rounded-3xl bg-white border border-[#D4AF37]/45 p-5 sm:p-7 shadow-[0_12px_36px_rgba(182,141,64,0.1)] space-y-6 min-w-0 overflow-hidden"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-stone-200/80">
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                          {lang === 'ID'
                            ? 'Langkah 1 dari 3 • Identitas Klien & Pilih Metode Pembayaran Aman'
                            : 'Step 1 of 3 • Client Identity & Select Secure Payment Method'}
                        </span>
                        <h3 className="font-serif text-lg sm:text-xl font-extrabold text-stone-900 mt-0.5">
                          {lang === 'ID'
                            ? 'Data Pemesan & Kanal Pembayaran Resmi'
                            : 'Buyer Details & Official Payment Channel'}
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider self-start sm:self-auto shrink-0">
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ID' ? 'Enkripsi SSL/Web3' : 'SSL/Web3 Secured'}
                        </span>
                      </span>
                    </div>

                    {/* Client Identity Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
                          {lang === 'ID'
                            ? 'Nama Pasangan Mempelai *'
                            : 'Couple Name *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={buyerCoupleName}
                          onChange={(e) => setBuyerCoupleName(e.target.value)}
                          placeholder={
                            lang === 'ID'
                              ? 'Misal: Romeo & Juliet'
                              : 'e.g. Romeo & Juliet'
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-xs font-bold text-stone-900 focus:border-[#B68D40] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
                          {lang === 'ID'
                            ? 'No. WhatsApp Konfirmasi (Opsional)'
                            : 'WhatsApp Number (Optional)'}
                        </label>
                        <input
                          type="text"
                          value={buyerWhatsapp}
                          onChange={(e) => setBuyerWhatsapp(e.target.value)}
                          placeholder={
                            lang === 'ID'
                              ? '0812xxxxxxxx'
                              : '+1 / +62 / International WhatsApp'
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-xs font-medium text-stone-900 focus:border-[#B68D40] focus:bg-white focus:outline-none"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-stone-700 mb-1.5">
                          {lang === 'ID'
                            ? 'Email Aktif Klien (Wajib — Tujuan Pengiriman 4 Akun & Lisensi) *'
                            : 'Active Client Email (Required — Destination for 4 Core Accounts & License) *'}
                        </label>
                        <input
                          type="email"
                          required
                          value={buyerEmail}
                          onChange={(e) => setBuyerEmail(e.target.value)}
                          placeholder={
                            lang === 'ID'
                              ? 'email.anda@domain.com'
                              : 'your.email@domain.com'
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-xs font-bold text-stone-900 focus:border-[#B68D40] focus:bg-white focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Selectable Wallet / Gateway Cards */}
                    <div className="space-y-3 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-700">
                          {lang === 'ID'
                            ? `Pilih Metode Pembayaran Resmi (${activeMarketChannels.length} Kanal Aktif)`
                            : `Select Official Payment Method (${activeMarketChannels.length} Active Channels)`}
                        </label>
                        <span className="text-[10px] font-bold text-[#8B6914]">
                          {lang === 'ID' ? 'Pasar Indonesia (IDR)' : 'Global Market (USD / USDT)'}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 min-w-0">
                        {activeMarketChannels.map((ch) => {
                          const Icon = getCategoryIcon(ch.category);
                          const isActive = selectedChannel?.id === ch.id;
                          return (
                            <button
                              key={ch.id}
                              type="button"
                              onClick={() => setSelectedChannelId(ch.id)}
                              className={`min-w-0 overflow-hidden p-3.5 rounded-2xl border text-left transition-all flex items-start justify-between gap-2.5 ${
                                isActive
                                  ? 'bg-gradient-to-br from-[#FAF3E3] to-[#F3E5C8]/70 border-2 border-[#B68D40] shadow-sm'
                                  : 'bg-[#FAF8F5] hover:bg-[#FAF3E3]/50 border-stone-200/90'
                              }`}
                            >
                              <div className="flex items-start gap-2.5 min-w-0">
                                <div
                                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    isActive
                                      ? 'bg-stone-900 text-[#D4AF37]'
                                      : 'bg-white border border-[#D4AF37]/35 text-[#8B6914]'
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <span className="inline-block text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/90 border border-[#D4AF37]/30 text-[#8B6914] mb-1">
                                    {ch.category.replace('_', ' ')}
                                  </span>
                                  <p className="text-xs font-extrabold text-stone-900 leading-snug break-words">
                                    {ch.providerName}
                                  </p>
                                  {ch.networkOrBranch && (
                                    <p className="text-[10px] text-stone-500 truncate mt-0.5">
                                      {ch.networkOrBranch}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                  isActive
                                    ? 'bg-[#8B6914] text-white'
                                    : 'border border-stone-300 bg-white'
                                }`}
                              >
                                {isActive && <Check className="w-3 h-3" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {checkoutError && (
                      <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 px-3.5 py-2.5 rounded-xl">
                        {checkoutError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full max-w-full py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all text-center leading-snug"
                    >
                      <span className="min-w-0 break-words">
                        {lang === 'ID'
                          ? 'Buat Invoice Idempoten & Lanjut ke Pembayaran Otomatis (Langkah 2)'
                          : 'Create Idempotent Invoice & Proceed to Auto-Payment (Step 2)'}
                      </span>
                      <ArrowRight className="w-4 h-4 shrink-0" />
                    </button>
                  </form>
                )}

                {/* ===================================================================== */}
                {/* SCREEN 2: EKSEKUSI PEMBAYARAN OTOMATIS & VERIFIKASI SECURITY          */}
                {/* ===================================================================== */}
                {checkoutWizardStep === 2 && selectedChannel && (
                  <div className="rounded-3xl bg-white border border-[#D4AF37]/45 p-5 sm:p-7 shadow-[0_12px_36px_rgba(182,141,64,0.1)] space-y-5 min-w-0 overflow-hidden">
                    {/* Top Bar inside Step 2 Card */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-stone-200/80">
                      <button
                        type="button"
                        onClick={() => setCheckoutWizardStep(1)}
                        className="max-w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-[#FAF3E3] text-stone-700 hover:text-[#8B6914] text-xs font-extrabold transition-all"
                      >
                        <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">
                          {lang === 'ID'
                            ? 'Ubah Data / Metode (Langkah 1)'
                            : 'Edit Details / Method (Step 1)'}
                        </span>
                      </button>

                      <span
                        title={
                          lang === 'ID'
                            ? 'Batas waktu kunci harga promo selama 24 jam'
                            : '24-hour promotional price lock countdown timer'
                        }
                        className="max-w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 text-[#E6C76B] text-xs font-mono font-extrabold"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="truncate">
                          {lang === 'ID'
                            ? `Kunci Harga: ${formatCountdown(countdownSeconds)}`
                            : `Price Lock: ${formatCountdown(countdownSeconds)}`}
                        </span>
                      </span>
                    </div>

                    <div className="min-w-0">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                        {lang === 'ID'
                          ? 'Langkah 2 dari 3 • Eksekusi Pembayaran Otomatis & Verifikasi Security'
                          : 'Step 2 of 3 • Automated Payment Execution & Security Verification'}
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-extrabold text-stone-900 mt-0.5 break-words">
                        {selectedChannel.providerName}
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5 break-words">
                        {lang === 'ID'
                          ? `Pemesan: ${buyerCoupleName} (${buyerEmail}) • Order ID: ${currentOrderId}`
                          : `Buyer: ${buyerCoupleName} (${buyerEmail}) • Order ID: ${currentOrderId}`}
                      </p>
                    </div>

                    {/* Locked Amount & Target Wallet/Account Summary */}
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 min-w-0">
                      <div className="sm:col-span-5 min-w-0 p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 flex flex-col justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                            {lang === 'ID'
                              ? 'Nominal Terkunci'
                              : 'Locked Exact Amount'}
                          </p>
                          <p className="text-xl sm:text-2xl font-extrabold text-[#8B6914] mt-0.5 break-words">
                            {activeCheckoutAmountDisplay}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPaymentValue(
                              'amount',
                              String(activeSelectedPackage.amountNumeric)
                            )
                          }
                          className="w-full max-w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                        >
                          {copiedPaymentKey === 'amount' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="truncate">
                                {lang === 'ID'
                                  ? 'Nominal Tersalin!'
                                  : 'Amount Copied!'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {lang === 'ID'
                                  ? 'Salin Nominal'
                                  : 'Copy Exact Amount'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="sm:col-span-7 min-w-0 p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 flex flex-col justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                              {selectedChannel.category === 'CRYPTO'
                                ? lang === 'ID'
                                  ? 'Alamat Wallet Crypto Resmi'
                                  : 'Official Crypto Wallet Address'
                                : selectedChannel.category === 'PAYPAL'
                                  ? lang === 'ID'
                                    ? 'Merchant PayPal Resmi'
                                    : 'Official PayPal Merchant'
                                  : lang === 'ID'
                                    ? 'Nomor Rekening / Tujuan'
                                    : 'Target Account'}
                            </p>
                            {selectedChannel.networkOrBranch && (
                              <span className="text-[10px] font-extrabold text-[#8B6914] bg-[#FAF3E3] px-2 py-0.5 rounded-md border border-[#D4AF37]/30">
                                {selectedChannel.networkOrBranch}
                              </span>
                            )}
                          </div>
                          <p className="font-mono text-xs font-extrabold text-stone-900 break-all mt-1">
                            {selectedChannel.accountOrWalletAddress}
                          </p>
                          {selectedChannel.accountHolder && (
                            <p className="text-[11px] text-stone-500 mt-0.5">
                              a.n.{' '}
                              <strong className="text-stone-700">
                                {selectedChannel.accountHolder}
                              </strong>
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPaymentValue(
                              'target-wallet',
                              selectedChannel.accountOrWalletAddress
                            )
                          }
                          className="w-full max-w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#D4AF37] font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                        >
                          {copiedPaymentKey === 'target-wallet' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate">
                                {lang === 'ID'
                                  ? 'Alamat / Rekening Tersalin!'
                                  : 'Address / Account Copied!'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {selectedChannel.category === 'CRYPTO'
                                  ? lang === 'ID'
                                    ? 'Salin Alamat Wallet Crypto'
                                    : 'Copy Crypto Wallet Address'
                                  : lang === 'ID'
                                    ? 'Salin Tujuan Pembayaran'
                                    : 'Copy Payment Destination'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* =============================================================== */}
                    {/* PLUGIN 1: CRYPTO WEB3 AUTO-PAY + ON-CHAIN BLOCKCHAIN VERIFIER   */}
                    {/* =============================================================== */}
                    {selectedChannel.category === 'CRYPTO' && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50/90 via-white to-[#FAF3E3]/60 border-2 border-[#D4AF37]/60 space-y-4 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-950 flex items-center gap-1.5">
                            <Coins className="w-4 h-4 text-[#B68D40] shrink-0" />
                            <span>
                              {lang === 'ID'
                                ? 'Plugin Web3 Wallet & On-Chain Blockchain Verifier'
                                : 'Web3 Wallet Plugin & On-Chain Blockchain Verifier'}
                            </span>
                          </span>
                          {connectedWeb3Address && (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-mono text-[10px] font-bold">
                              Connected: {connectedWeb3Address.slice(0, 6)}...
                              {connectedWeb3Address.slice(-4)}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled={isConnectingWeb3}
                          onClick={() => void handleConnectAndPayWeb3()}
                          title={
                            lang === 'ID'
                              ? 'Bayar otomatis 1-klik menggunakan MetaMask, TrustWallet, atau TronLink'
                              : 'One-click payment via MetaMask, TrustWallet, or TronLink'
                          }
                          className="w-full max-w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-[#E6C76B] border border-[#D4AF37]/50 font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all text-center leading-snug"
                        >
                          <Coins className="w-4 h-4 text-[#D4AF37] shrink-0" />
                          <span className="min-w-0 break-words">
                            {isConnectingWeb3
                              ? lang === 'ID'
                                ? 'Menghubungkan Web3 Wallet...'
                                : 'Connecting Web3 Wallet...'
                              : lang === 'ID'
                                ? 'Bayar via Web3 Wallet'
                                : 'Pay via Web3 Wallet'}
                          </span>
                        </button>

                        {selectedChannel.qrCodeImageUrl && (
                          <div className="p-3 rounded-2xl bg-white border border-stone-200 flex flex-col items-center text-center space-y-1.5">
                            <p className="text-[11px] font-bold text-stone-700">
                              {lang === 'ID'
                                ? 'Atau Scan QR Deposit Crypto Resmi:'
                                : 'Or Scan Official Crypto Deposit QR:'}
                            </p>
                            <img
                              src={selectedChannel.qrCodeImageUrl}
                              alt={selectedChannel.providerName}
                              className="max-h-48 w-auto rounded-xl border border-stone-200 p-1.5 bg-white"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* =============================================================== */}
                    {/* PLUGIN 2: PAYPAL / CREDIT CARD SMART POPUP & QR                 */}
                    {/* =============================================================== */}
                    {(selectedChannel.category === 'PAYPAL' ||
                      selectedChannel.category === 'CREDIT_CARD') && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-sky-50/80 via-white to-indigo-50/40 border-2 border-sky-300/80 space-y-4 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                            <Globe className="w-4 h-4 text-[#0070BA] shrink-0" />
                            <span>
                              {lang === 'ID'
                                ? 'PayPal & Visa/Mastercard Smart Checkout Popup'
                                : 'PayPal & Visa/Mastercard Smart Checkout Popup'}
                            </span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold">
                            Auto-Capture Ready
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={handleOpenPaypalSmartPopup}
                          title={
                            lang === 'ID'
                              ? 'Buka jendela pembayaran resmi PayPal, Visa, atau Mastercard'
                              : 'Open official PayPal, Visa, or Mastercard checkout popup'
                          }
                          className="w-full max-w-full py-3.5 px-4 rounded-2xl bg-[#0070BA] hover:bg-[#005EA6] text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all text-center leading-snug"
                        >
                          <CreditCard className="w-4 h-4 shrink-0" />
                          <span className="min-w-0 break-words">
                            {lang === 'ID'
                              ? 'Checkout PayPal / Kartu'
                              : 'PayPal / Card Checkout'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        </button>

                        <div className="p-3.5 rounded-2xl bg-white border border-sky-200/80 flex flex-col items-center text-center space-y-2">
                          <p className="text-xs font-extrabold text-stone-900">
                            {lang === 'ID'
                              ? 'Atau Scan QR Code PayPal Resmi My Event Planner:'
                              : 'Or Scan Official My Event Planner PayPal QR Code:'}
                          </p>
                          <img
                            src={
                              selectedChannel.qrCodeImageUrl ||
                              '/paypal-qr-mwm.png'
                            }
                            alt="Official PayPal QR Code"
                            className="max-h-48 w-auto rounded-xl border border-sky-100 shadow-xs p-2 bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {/* =============================================================== */}
                    {/* PLUGIN 3: QRIS / BANK TRANSFER / E-WALLET (INDONESIA IDR)       */}
                    {/* =============================================================== */}
                    {(selectedChannel.category === 'QRIS' ||
                      selectedChannel.category === 'BANK_TRANSFER' ||
                      selectedChannel.category === 'EWALLET') && (
                      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FAF3E3]/70 via-white to-emerald-50/40 border-2 border-[#D4AF37]/55 space-y-4 min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-900 flex items-center gap-1.5">
                            <QrCode className="w-4 h-4 text-[#8B6914] shrink-0" />
                            <span>
                              Pembayaran Instan Nasional (QRIS / BI-FAST / E-Wallet)
                            </span>
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                            IDR Verified
                          </span>
                        </div>

                        {selectedChannel.qrCodeImageUrl && (
                          <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/40 flex flex-col items-center text-center space-y-2">
                            <p className="text-xs font-extrabold text-stone-900">
                              Scan Barcode QRIS Resmi —{' '}
                              {selectedChannel.providerName}
                            </p>
                            <img
                              src={selectedChannel.qrCodeImageUrl}
                              alt="QRIS Barcode"
                              className="max-h-56 w-auto rounded-xl border border-stone-200 p-2 bg-white shadow-xs"
                            />
                          </div>
                        )}

                        {selectedChannel.instructions && (
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {selectedChannel.instructions}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Feedback Banner if Web3 or Popup was triggered */}
                    {verificationFeedback && (
                      <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-950 text-xs font-semibold leading-relaxed">
                        {verificationFeedback}
                      </div>
                    )}

                    {/* Idempotent Timeout Recovery Banner inside Step 2 */}
                    {activeTransaction?.status === 'FAILED_TIMEOUT' && (
                      <div className="p-4 rounded-2xl bg-amber-950 text-amber-50 border-2 border-amber-400 shadow-md space-y-3 min-w-0">
                        <div className="flex items-start gap-3 min-w-0">
                          <AlertTriangle className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs leading-relaxed min-w-0">
                            <p className="font-extrabold text-amber-300 uppercase tracking-wider">
                              {lang === 'ID'
                                ? `Peringatan Timeout / Koneksi Terputus (Retry #${activeTransaction.retryCount || 0})`
                                : `Payment Verification Timeout / Network Interrupted (Retry #${activeTransaction.retryCount || 0})`}
                            </p>
                            <p>{activeTransaction.lastErrorOrTimeoutReason}</p>
                            <p className="font-mono text-[10px] text-amber-200/90 break-all">
                              Idempotency Key:{' '}
                              {activeTransaction.idempotencyKey}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          disabled={isSubmittingPayment}
                          onClick={() =>
                            void executeIdempotentPaymentSubmission()
                          }
                          className="w-full max-w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-stone-950 font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all text-center leading-snug"
                        >
                          <RefreshCw
                            className={`w-4 h-4 shrink-0 ${
                              isSubmittingPayment ? 'animate-spin' : ''
                            }`}
                          />
                          <span className="min-w-0 break-words">
                            {lang === 'ID'
                              ? 'Ulangi Verifikasi (Idempoten)'
                              : 'Retry Verification (Idempotent)'}
                          </span>
                        </button>
                      </div>
                    )}

                    {/* Automatic Security Verification Form (Advances to Step 3) */}
                    <form
                      onSubmit={handleConfirmPaymentSubmit}
                      className="space-y-3 pt-2 border-t border-stone-200/80 min-w-0"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-700">
                            {selectedChannel.category === 'CRYPTO'
                              ? lang === 'ID'
                                ? 'TXID / Transaction Hash Blockchain *'
                                : 'Blockchain TXID / Transaction Hash *'
                              : selectedChannel.category === 'PAYPAL' ||
                                  selectedChannel.category === 'CREDIT_CARD'
                                ? lang === 'ID'
                                  ? 'ID Transaksi PayPal / 4 Digit Terakhir Kartu *'
                                  : 'PayPal Transaction ID / Card Last 4 Digits *'
                                : 'Nomor Referensi Transfer / RRN QRIS *'}
                          </label>
                          {selectedChannel.category !== 'CRYPTO' && (
                            <button
                              type="button"
                              onClick={() =>
                                setPaymentReference(`INV-${currentOrderId}`)
                              }
                              className="text-[10px] font-extrabold text-[#8B6914] hover:underline text-left"
                            >
                              {lang === 'ID'
                                ? `+ Gunakan ID Invoice Otomatis (INV-${currentOrderId})`
                                : `+ Auto-Fill Invoice ID (INV-${currentOrderId})`}
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          required
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder={
                            selectedChannel.category === 'CRYPTO'
                              ? '0x... / TRC20 Transaction Hash (64 hex chars)'
                              : selectedChannel.category === 'PAYPAL' ||
                                  selectedChannel.category === 'CREDIT_CARD'
                                ? `PAYPAL-${currentOrderId}`
                                : `INV-${currentOrderId} / Nomor Referensi Bank`
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-xs font-mono font-bold text-stone-900 focus:border-[#B68D40] focus:bg-white focus:outline-none"
                        />
                      </div>

                      {checkoutError && (
                        <p className="text-xs font-bold text-rose-600">
                          {checkoutError}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-600 bg-[#FAF8F5] px-3 py-2 rounded-xl border border-stone-200/80 min-w-0 overflow-hidden">
                        <span className="font-mono text-[10px] truncate max-w-full">
                          Key: {currentIdempotencyKey}
                        </span>
                        <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[10px] font-bold text-stone-500 hover:text-stone-800">
                          <input
                            type="checkbox"
                            checked={simulateNetworkTimeout}
                            onChange={(e) =>
                              setSimulateNetworkTimeout(e.target.checked)
                            }
                            className="rounded border-stone-300 text-[#8B6914] focus:ring-[#B68D40]"
                          />
                          <span>
                            {lang === 'ID'
                              ? 'Simulasi Timeout Jaringan (Uji Idempotensi)'
                              : 'Simulate Network Timeout (Test Idempotency)'}
                          </span>
                        </label>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingPayment}
                        title={
                          selectedChannel.category === 'CRYPTO'
                            ? lang === 'ID'
                              ? 'Verifikasi otomatis transaksi di Blockchain dan selesaikan order'
                              : 'Auto-verify transaction on Blockchain and complete order'
                            : selectedChannel.category === 'PAYPAL' ||
                                selectedChannel.category === 'CREDIT_CARD'
                              ? lang === 'ID'
                                ? 'Verifikasi pembayaran PayPal/Kartu dan lanjutkan otomatis'
                                : 'Verify PayPal/Card payment and continue automatically'
                              : lang === 'ID'
                                ? 'Verifikasi pembayaran dan aktifkan lisensi otomatis'
                                : 'Verify payment and activate license automatically'
                        }
                        className="w-full max-w-full py-3.5 sm:py-4 px-4 sm:px-5 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] disabled:opacity-60 text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all text-center leading-snug"
                      >
                        {isSubmittingPayment ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                            <span className="min-w-0 break-words">
                              {lang === 'ID'
                                ? 'Memverifikasi Pembayaran...'
                                : 'Verifying Payment...'}
                            </span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 shrink-0" />
                            <span className="min-w-0 break-words">
                              {selectedChannel.category === 'CRYPTO'
                                ? lang === 'ID'
                                  ? 'Verifikasi Blockchain →'
                                  : 'Verify on Blockchain →'
                                : selectedChannel.category === 'PAYPAL' ||
                                    selectedChannel.category === 'CREDIT_CARD'
                                  ? lang === 'ID'
                                    ? 'Verifikasi Pembayaran →'
                                    : 'Verify Payment →'
                                  : lang === 'ID'
                                    ? 'Verifikasi & Aktifkan →'
                                    : 'Verify & Activate →'}
                            </span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}

                {/* ===================================================================== */}
                {/* SCREEN 3: SERTIFIKAT KEAMANAN, BUKTI PEMBAYARAN & KONTAK PRIORITAS    */}
                {/* ===================================================================== */}
                {checkoutWizardStep === 3 && (
                  <div className="rounded-3xl bg-emerald-950 text-emerald-50 border-2 border-[#D4AF37] p-5 sm:p-7 shadow-[0_20px_50px_rgba(6,78,59,0.28)] space-y-5 animate-fadeIn min-w-0 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-emerald-800/80">
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E6C76B]">
                          {lang === 'ID'
                            ? 'Langkah 3 dari 3 • Pembayaran Tercatat & Sertifikat Keamanan'
                            : 'Step 3 of 3 • Payment Recorded & Security Certificate'}
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-white mt-0.5 flex items-center gap-2">
                          <FileCheck2 className="w-6 h-6 text-[#D4AF37] shrink-0" />
                          <span>
                            {lang === 'ID'
                              ? 'Sertifikat Konfirmasi Pembayaran Idempoten'
                              : 'Official Idempotent Payment Certificate'}
                          </span>
                        </h3>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          activeTransaction?.onChainVerified ||
                          activeTransaction?.status === 'PAID_VERIFIED'
                            ? 'bg-emerald-400 text-stone-950'
                            : 'bg-[#D4AF37] text-stone-950'
                        }`}
                      >
                        {activeTransaction?.onChainVerified
                          ? '⛓️ PAID_VERIFIED (On-Chain Confirmed)'
                          : activeTransaction?.status === 'PAID_VERIFIED'
                            ? lang === 'ID'
                              ? '✓ LUNAS TERVERIFIKASI'
                              : '✓ PAID_VERIFIED'
                            : lang === 'ID'
                              ? '⏳ PENDING_VERIFICATION (MAKS. H+3)'
                              : '⏳ PENDING_VERIFICATION (MAX D+3)'}
                      </span>
                    </div>

                    {/* Digital Certificate Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-black/30 p-4 rounded-2xl border border-emerald-800/70 font-mono min-w-0">
                      <div className="min-w-0">
                        <span className="text-emerald-300/80 text-[10px] block">
                          Order ID:
                        </span>
                        <strong className="text-white break-all">
                          {activeTransaction?.orderId || currentOrderId}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-emerald-300/80 text-[10px] block">
                          Idempotency Key:
                        </span>
                        <strong className="text-[#E6C76B] break-all">
                          {activeTransaction?.idempotencyKey ||
                            currentIdempotencyKey}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-emerald-300/80 text-[10px] block">
                          {lang === 'ID'
                            ? 'Paket & Nominal:'
                            : 'Plan & Amount:'}
                        </span>
                        <strong className="text-white break-words">
                          {activeTransaction?.packageTier ||
                            selectedCheckoutTier}{' '}
                          •{' '}
                          {activeTransaction?.amountDisplay ||
                            activeCheckoutAmountDisplay}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-emerald-300/80 text-[10px] block">
                          {lang === 'ID'
                            ? 'Metode & Referensi:'
                            : 'Wallet & Reference:'}
                        </span>
                        <strong className="text-white break-all">
                          {activeTransaction?.channelProviderName ||
                            selectedChannel?.providerName}{' '}
                          (
                          {activeTransaction?.paymentReference ||
                            paymentReference}
                          )
                        </strong>
                      </div>
                    </div>

                    {/* Optional Blockchain Explorer Proof & Provisioned Client Badges */}
                    {(activeTransaction?.blockchainExplorerUrl ||
                      activeTransaction?.provisionedClientId) && (
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        {activeTransaction?.blockchainExplorerUrl && (
                          <a
                            href={activeTransaction.blockchainExplorerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={
                              lang === 'ID'
                                ? 'Lihat bukti transaksi on-chain di Blockchain Explorer'
                                : 'View on-chain transaction proof on Blockchain Explorer'
                            }
                            className="max-w-full inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-[#D4AF37] text-[#E6C76B] text-xs font-extrabold transition-all"
                          >
                            <Coins className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {lang === 'ID'
                                ? 'Bukti Blockchain'
                                : 'Blockchain Proof'}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                          </a>
                        )}
                        {activeTransaction?.provisionedClientId && (
                          <span className="max-w-full inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-extrabold break-all">
                            🚀 Workspace Klien Otomatis Siap (
                            {activeTransaction.provisionedClientId})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Exact SLA Message & Priority Email Contact */}
                    <div className="p-4 rounded-2xl bg-emerald-900/60 border border-[#D4AF37]/45 flex items-start gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-stone-950 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed min-w-0">
                        {lang === 'ID' ? (
                          <p>
                            Terima kasih! Pembayaran Anda telah tercatat. Tim
                            kami akan menghubungi Anda melalui email maksimal{' '}
                            <strong className="text-[#E6C76B] underline decoration-[#D4AF37]/60 underline-offset-2">
                              H+3 setelah pembayaran
                            </strong>{' '}
                            untuk pengiriman akses 4 Akun Default &amp;
                            Workspace Klien. Untuk konfirmasi bukti bayar
                            prioritas, silakan hubungi:{' '}
                            <a
                              href={mailtoPostPaymentUrl}
                              className="font-extrabold text-[#E6C76B] underline hover:text-white break-all"
                            >
                              {businessEmail}
                            </a>
                            .
                          </p>
                        ) : (
                          <p>
                            Thank you! Your payment confirmation has been
                            recorded. Our team will contact you via email within
                            a maximum of{' '}
                            <strong className="text-[#E6C76B] underline decoration-[#D4AF37]/60 underline-offset-2">
                              3 days (D+3) after payment
                            </strong>{' '}
                            with your 4 Core Accounts &amp; Client Workspace
                            credentials. For priority payment receipt
                            confirmation, please contact:{' '}
                            <a
                              href={mailtoPostPaymentUrl}
                              className="font-extrabold text-[#E6C76B] underline hover:text-white break-all"
                            >
                              {businessEmail}
                            </a>
                            .
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons on Step 3 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-800/80 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <a
                          href={mailtoPostPaymentUrl}
                          className="max-w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm hover:opacity-95 transition-all text-center leading-snug"
                        >
                          <Mail className="w-4 h-4 shrink-0" />
                          <span className="min-w-0 break-words">
                            {lang === 'ID'
                              ? `Kirim Bukti Bayar Prioritas ke ${businessEmail}`
                              : `Send Priority Payment Receipt to ${businessEmail}`}
                          </span>
                        </a>
                        <button
                          type="button"
                          onClick={() =>
                            handleCopyPaymentValue(
                              'official-email',
                              businessEmail
                            )
                          }
                          className="max-w-full py-2.5 px-3.5 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-[#D4AF37]/40 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                        >
                          {copiedPaymentKey === 'official-email' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#E6C76B] shrink-0" />
                              <span>
                                {lang === 'ID'
                                  ? 'Email Tersalin!'
                                  : 'Email Copied!'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#E6C76B] shrink-0" />
                              <span>
                                {lang === 'ID'
                                  ? 'Salin Email Resmi'
                                  : 'Copy Official Email'}
                              </span>
                            </>
                          )}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setCheckoutWizardStep(2)}
                        className="max-w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-emerald-100 text-xs font-bold transition-all"
                      >
                        {lang === 'ID'
                          ? '← Lihat Detail Pembayaran'
                          : '← View Payment Details'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>
        ) : (
          /* MAIN LANDING PAGE VIEW (HERO + SHOWCASE + FITUR + 3 PRICING CARDS) */
          <>
            {/* HERO SECTION */}
            <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 border-b border-[#D4AF37]/25 bg-gradient-to-b from-[#FFFDF9] via-[#FAF3E3]/55 to-[#FAF8F5]">
              {/* Luxury Editorial Corner Ornaments on Hero */}
              <CatalogFloralCorner
                position="top-left"
                size="lg"
                className="opacity-80"
              />
              <CatalogFloralCorner
                position="top-right"
                size="lg"
                className="opacity-80"
              />

              <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/95 border border-[#D4AF37]/45 shadow-2xs text-[#8B6914] text-[11px] font-extrabold uppercase tracking-widest max-w-full"
                  title="My Event Planner — Platform Multi-Event & Undangan Digital Eksklusif by omeko42"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                  <span className="whitespace-nowrap truncate">
                    My Event Planner (Multi-Event Suite) by{' '}
                    <a
                      href={developerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-[#D4AF37]/60 underline-offset-2 hover:text-[#B68D40]"
                    >
                      omeko42
                    </a>
                  </span>
                </div>

                <h2 className="font-editorial text-3xl sm:text-5xl lg:text-[54px] font-bold text-stone-900 tracking-tight max-w-4xl mx-auto leading-[1.12]">
                  {lang === 'ID' ? (
                    <>
                      Platform Manajemen Persiapan Acara &amp;{' '}
                      <span className="bg-gradient-to-r from-[#8B6914] via-[#B68D40] to-[#8B6914] bg-clip-text text-transparent">
                        Undangan Digital Editorial Mewah
                      </span>
                    </>
                  ) : (
                    <>
                      All-in-One Multi-Event Readiness &amp;{' '}
                      <span className="bg-gradient-to-r from-[#8B6914] via-[#B68D40] to-[#8B6914] bg-clip-text text-transparent">
                        Luxury Editorial Digital Invitations
                      </span>
                    </>
                  )}
                </h2>

                {/* Gold Filigree Crest Divider under Hero Heading */}
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center gap-3 text-[#B68D40]"
                >
                  <span className="w-14 sm:w-24 h-px bg-gradient-to-r from-transparent via-[#C5A059] to-[#D4AF37]" />
                  <CatalogEventCrest
                    eventType={simEventType}
                    className="w-6 h-6 text-[#B68D40]"
                  />
                  <span className="w-14 sm:w-24 h-px bg-gradient-to-l from-transparent via-[#C5A059] to-[#D4AF37]" />
                </div>

                <p className="text-xs sm:text-base text-stone-600 max-w-3xl mx-auto leading-relaxed">
                  {lang === 'ID' ? (
                    <>
                      Satu sistem terpadu untuk mengelola{' '}
                      <strong>Executive Readiness Tracker</strong>,{' '}
                      <strong>Checklist Timeline H-6 Bulan s/d Hari-H</strong>,{' '}
                      <strong>Pagu Anggaran &amp; Kontrak Vendor</strong>,{' '}
                      <strong>CRM Tamu VIP &amp; Blast WhatsApp 1-Klik</strong>,
                      serta{' '}
                      <strong>
                        Studio Undangan Digital Editorial Interaktif (5 Jenis
                        Event)
                      </strong>{' '}
                      dengan privasi penuh.
                    </>
                  ) : (
                    <>
                      One unified platform to manage your{' '}
                      <strong>Executive Readiness Tracker</strong>,{' '}
                      <strong>6-Month Countdown Checklist</strong>,{' '}
                      <strong>Vendor Budget &amp; Contracts</strong>,{' '}
                      <strong>1-Click VIP WhatsApp Invitations</strong>, and{' '}
                      <strong>
                        Interactive Luxury Editorial Digital Invitations (5
                        Event Types)
                      </strong>{' '}
                      with full client privacy.
                    </>
                  )}
                </p>

                {/* Supported Multi-Event Category Pills (Click to preview live simulation in #showcase) */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-4xl mx-auto">
                  {(
                    [
                      {
                        eventType: 'WEDDING' as const,
                        label: '💍 Wedding',
                        title:
                          lang === 'ID'
                            ? 'Klik untuk Simulasi Undangan Pernikahan (2 Profil Arch-Dome & Ornamen Floral)'
                            : 'Click to preview Wedding Invitation Simulation (2 Arch-Dome Profiles & Floral Ornaments)',
                      },
                      {
                        eventType: 'BIRTHDAY' as const,
                        label: '🎂 Birthday',
                        title:
                          lang === 'ID'
                            ? 'Klik untuk Simulasi Undangan Ulang Tahun / Sweet 17th (1 Profil Spotlight)'
                            : 'Click to preview Birthday / Sweet 17th Simulation (1 Spotlight Profile)',
                      },
                      {
                        eventType: 'GRADUATION' as const,
                        label: '🎓 Graduation',
                        title:
                          lang === 'ID'
                            ? 'Klik untuk Simulasi Undangan Wisuda & Syukuran Akademik'
                            : 'Click to preview Graduation & Academic Celebration Simulation',
                      },
                      {
                        eventType: 'MEETING' as const,
                        label: '🏛️ Rapat / Corporate',
                        title:
                          lang === 'ID'
                            ? 'Klik untuk Simulasi Undangan Rapat Resmi & Forum Eksekutif'
                            : 'Click to preview Official Corporate & Executive Meeting Simulation',
                      },
                      {
                        eventType: 'GALA_DINNER' as const,
                        label: '🥂 Gala Dinner',
                        title:
                          lang === 'ID'
                            ? 'Klik untuk Simulasi Undangan VIP Gala Dinner & Award Night'
                            : 'Click to preview VIP Gala Dinner & Award Night Simulation',
                      },
                    ] as const
                  ).map((pill) => {
                    const isCurrentSim =
                      showcaseViewMode === 'invitation_sim' &&
                      simEventType === pill.eventType;
                    return (
                      <button
                        key={pill.label}
                        type="button"
                        onClick={() => {
                          setSimEventType(pill.eventType);
                          setShowcaseViewMode('invitation_sim');
                          scrollToShowcase();
                        }}
                        title={pill.title}
                        className={`inline-flex items-center px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-extrabold shadow-2xs whitespace-nowrap truncate max-w-full transition-all ${
                          isCurrentSim
                            ? 'bg-stone-900 text-[#E6C76B] border-[#D4AF37] ring-2 ring-[#D4AF37]/30'
                            : 'bg-white/95 hover:bg-[#FAF3E3] border-[#D4AF37]/45 text-stone-800 hover:text-[#8B6914]'
                        }`}
                      >
                        {pill.label}
                      </button>
                    );
                  })}
                  <span
                    title={
                      lang === 'ID'
                        ? 'Mendukung Upload Video Background Sinematik s/d 25 MB dengan Auto-Stretch Responsif (9:16 HP ↔ 16:9 PC)'
                        : 'Supports up to 25 MB Cinematic Video Backgrounds with Adaptive 9:16 Mobile to 16:9 PC Auto-Stretch'
                    }
                    className="inline-flex items-center px-3.5 py-1.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/50 text-[#8B6914] text-[11px] sm:text-xs font-extrabold shadow-2xs whitespace-nowrap truncate max-w-full"
                  >
                    {lang === 'ID'
                      ? '🎬 Video Latar 25 MB'
                      : '🎬 25 MB Video Bg'}
                  </span>
                </div>

                {/* Primary Hero CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowcaseViewMode('invitation_sim');
                      scrollToShowcase();
                    }}
                    title={
                      lang === 'ID'
                        ? 'Coba Simulasi Undangan Digital Editorial Interaktif (5 Jenis Event) & Lihat 5 Modul Dashboard'
                        : 'Try the Interactive Luxury Invitation Simulator (5 Event Types) & Inspect 5 Dashboard Modules'
                    }
                    className="w-full sm:w-auto max-w-full justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap truncate"
                  >
                    <Sparkles className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap truncate">
                      {lang === 'ID'
                        ? 'Coba Simulasi Undangan & 5 Modul'
                        : 'Try Live Invitation Sim & 5 Modules'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onOpenAdminPortal}
                    title={
                      isAdminLoggedIn
                        ? lang === 'ID'
                          ? 'Masuk ke Workspace Dashboard'
                          : 'Enter Workspace Dashboard'
                        : lang === 'ID'
                          ? 'Masuk ke Portal Login Klien, Panitia EO/WO, atau Superadmin'
                          : 'Login to Client, Event Organizer, or Superadmin Portal'
                    }
                    className="w-full sm:w-auto max-w-full justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] border border-[#D4AF37]/40 font-extrabold text-xs sm:text-sm shadow-sm transition-all whitespace-nowrap truncate"
                  >
                    <KeyRound className="w-4 h-4 text-[#D4AF37] shrink-0" />
                    <span className="whitespace-nowrap truncate">
                      {isAdminLoggedIn
                        ? lang === 'ID'
                          ? 'Masuk ke Workspace Dashboard'
                          : 'Enter Workspace Dashboard'
                        : lang === 'ID'
                          ? 'Portal Login Klien / EO / WO'
                          : 'Client / EO / WO Login Portal'}
                    </span>
                  </button>
                </div>

                {/* Quick Guest Invitation Lookup Card (Private Guest Gate with Floral Corners) */}
                <div className="relative overflow-hidden max-w-2xl mx-auto mt-8 p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#D4AF37]/45 shadow-[0_12px_36px_rgba(182,141,64,0.14)] text-left">
                  <CatalogFloralCorner
                    position="top-left"
                    size="sm"
                    className="opacity-45"
                  />
                  <CatalogFloralCorner
                    position="bottom-right"
                    size="sm"
                    className="opacity-45"
                  />
                  <div className="relative z-20">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                      <p
                        className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5 whitespace-nowrap truncate"
                        title={
                          lang === 'ID'
                            ? 'Gerbang Privat Tamu Undangan — Masukkan Kode Undangan (INV-xxxx) atau Nama Tamu Terdaftar'
                            : 'Private Guest Invitation Gate — Enter Registered Invitation Code (INV-xxxx) or Guest Name'
                        }
                      >
                        <Search className="w-4 h-4 text-[#B68D40] shrink-0" />
                        <span className="whitespace-nowrap truncate">
                          {lang === 'ID'
                            ? 'Akses Cepat Tamu Undangan (Private Guest Gate)'
                            : 'Quick Guest Invitation Lookup (Private Guest Gate)'}
                        </span>
                      </p>
                      <span className="inline-flex items-center gap-1.5 max-w-full">
                        <span
                          title={
                            lang === 'ID'
                              ? 'Undangan klien bersifat privat dan hanya dapat dibuka dengan Kode Undangan (INV-xxxx) atau Nama Tamu yang terdaftar di database acara'
                              : 'Client invitations are private and require a registered Invitation Code (INV-xxxx) or Guest Name'
                          }
                          className="text-[10px] font-bold text-[#8B6914] bg-[#FAF3E3] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30 whitespace-nowrap truncate max-w-full"
                        >
                          {lang === 'ID'
                            ? 'Kode Tamu Wajib'
                            : 'Guest Code Required'}
                        </span>
                        <InfoTooltip
                          text={
                            lang === 'ID'
                              ? 'Undangan klien bersifat privat. Masukkan minimal 3 huruf Nama Tamu yang terdaftar atau Kode INV-xxxx untuk membuka undangan.'
                              : 'Client invitations are private. Enter at least 3 characters of a registered guest name or INV-xxxx code to open.'
                          }
                        />
                      </span>
                    </div>
                    <form
                      onSubmit={handleQuickLookupSubmit}
                      className="grid grid-cols-1 sm:grid-cols-12 gap-2"
                    >
                      <div className="sm:col-span-5">
                        <select
                          value={selectedLookupClientId}
                          onChange={(e) => {
                            setSelectedLookupClientId(e.target.value);
                            setGuestCodeInput('');
                            setLookupGateError(null);
                          }}
                          title={
                            lang === 'ID'
                              ? 'Pilih Acara / Klien Tujuan'
                              : 'Select Target Event / Client'
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-[#FAF8F5] text-xs font-bold text-stone-800 focus:border-[#B68D40] focus:outline-none truncate"
                        >
                          {clientGroups.map((cg) => (
                            <option key={cg.id} value={cg.id}>
                              💍 {cg.coupleLabel || cg.clientName}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="sm:col-span-4 relative">
                        <input
                          type="text"
                          value={guestCodeInput}
                          onFocus={() => setShowLookupSuggestions(true)}
                          onBlur={() =>
                            window.setTimeout(
                              () => setShowLookupSuggestions(false),
                              180
                            )
                          }
                          onChange={(e) => {
                            setGuestCodeInput(e.target.value);
                            setLookupGateError(null);
                            setShowLookupSuggestions(true);
                          }}
                          placeholder={
                            lang === 'ID'
                              ? 'Ketik min. 3 huruf / INV-0001...'
                              : 'Type min. 3 chars / INV-0001...'
                          }
                          className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-[#FAF8F5] text-xs font-medium text-stone-800 focus:border-[#B68D40] focus:outline-none"
                        />
                        {showLookupSuggestions &&
                          filteredLookupGuests.length > 0 && (
                            <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white border border-[#D4AF37]/45 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                              <div className="px-3 py-1.5 bg-[#FAF3E3]/70 border-b border-[#D4AF37]/25 text-[10px] font-extrabold text-[#8B6914] flex items-center justify-between">
                                <span>
                                  {lang === 'ID'
                                    ? 'Tamu Terdaftar Cocok'
                                    : 'Matching Registered Guests'}
                                </span>
                                <span>
                                  {lang === 'ID'
                                    ? 'Klik untuk Buka'
                                    : 'Click to Open'}
                                </span>
                              </div>
                              {filteredLookupGuests.map((guest) => (
                                <button
                                  key={guest.id}
                                  type="button"
                                  onMouseDown={(e) => {
                                    e.preventDefault();
                                    setGuestCodeInput(guest.guestName);
                                    setLookupGateError(null);
                                    setShowLookupSuggestions(false);
                                    onSelectClientInvitation(
                                      selectedLookupClientId,
                                      guest.guestName,
                                      guest.invitationCode
                                    );
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-[#FAF3E3]/60 border-b border-stone-100 last:border-b-0 transition-colors flex items-center justify-between gap-2"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-bold text-stone-900 truncate">
                                      {guest.guestName}
                                    </p>
                                    <p className="text-[10px] text-stone-500 truncate">
                                      {guest.institution || guest.guestType}
                                    </p>
                                  </div>
                                  <span className="shrink-0 px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/35 text-[#8B6914] font-mono text-[10px] font-bold">
                                    {guest.invitationCode}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>
                      <div className="sm:col-span-3">
                        <button
                          type="submit"
                          title={
                            lang === 'ID'
                              ? 'Verifikasi Kode Tamu & Buka Undangan Privat'
                              : 'Verify Guest Code & Open Private Invitation'
                          }
                          className="w-full h-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs shadow-2xs transition-all whitespace-nowrap truncate"
                        >
                          {lang === 'ID' ? 'Buka Undangan' : 'Open Invitation'}
                        </button>
                      </div>
                    </form>
                    {lookupGateError && (
                      <div className="mt-2.5 px-3 py-2 rounded-xl bg-amber-50 border border-amber-300/80 text-amber-900 text-[11px] font-semibold flex items-center gap-2">
                        <Lock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>{lookupGateError}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 1: DUAL-EXPERIENCE INTERACTIVE SHOWCASE (LIVE INVITATION SIMULATOR + 5 DASHBOARD MODULES) */}
            <section
              id="showcase"
              className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
            >
              {/* Section Header + Privacy Note Pill + 2-Tab Mode Switcher */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                      Official Interactive Showcase &bull; 100% Privacy-Safe
                    </span>
                    <span className="inline-flex items-center gap-1.5 max-w-full">
                      <span
                        title={
                          lang === 'ID'
                            ? 'Undangan aktif klien dan musik kustom bersifat privat untuk melindungi privasi acara & hak cipta audio'
                            : 'Active client invitations and custom music are private to protect event privacy and audio copyright'
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold whitespace-nowrap truncate max-w-full"
                      >
                        {lang === 'ID'
                          ? 'Privasi Klien Terlindungi'
                          : 'Client Privacy Protected'}
                      </span>
                      <InfoTooltip
                        text={
                          lang === 'ID'
                            ? 'Simulasi di bawah menggunakan data sampel fiktif resmi. Undangan asli klien (seperti Agung & Selo) beserta musik kustom tetap 100% privat di balik Guest Code Gate.'
                            : 'The simulation below uses official fictional sample data. Real client invitations and custom audio remain 100% private behind the Guest Code Gate.'
                        }
                      />
                    </span>
                  </div>
                  <h3 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                    {lang === 'ID'
                      ? 'Simulasi Undangan Editorial Mewah & 5 Modul Dashboard'
                      : 'Luxury Editorial Invitation Simulator & 5 Dashboard Modules'}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
                    {lang === 'ID'
                      ? 'Rasakan langsung keindahan sampul pembuka, kurva leher kubah (Arch-Dome), tata letak adaptif 1 atau 2 profil, hingga kartu amplop ber-chip emas—atau jelajahi 5 modul dashboard pengelola acara.'
                      : 'Experience the interactive cover curtain-lift, Arch-Dome portraits, adaptive 1 or 2 host layouts, and metallic EMV digital envelope—or inspect the 5 admin dashboard modules.'}
                  </p>
                </div>

                {/* Prominent 2-Tab Segmented Switcher */}
                <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#FAF3E3]/90 border border-[#D4AF37]/45 shadow-2xs shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowcaseViewMode('invitation_sim')}
                    title={
                      lang === 'ID'
                        ? 'Coba Simulasi Undangan Digital Interaktif untuk 5 Jenis Event'
                        : 'Try Interactive Digital Invitation Simulator across 5 Event Types'
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap truncate transition-all ${
                      showcaseViewMode === 'invitation_sim'
                        ? 'bg-gradient-to-r from-[#1C1613] to-[#2A2019] text-[#E6C76B] border border-[#D4AF37] shadow-sm'
                        : 'text-stone-800 hover:text-[#8B6914] hover:bg-white/70'
                    }`}
                  >
                    <span>
                      {lang === 'ID'
                        ? '✨ Simulasi Undangan Interaktif (5 Jenis Event)'
                        : '✨ Interactive Invitation Simulator (5 Events)'}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowcaseViewMode('dashboard_modules')}
                    title={
                      lang === 'ID'
                        ? 'Lihat 5 Screenshot Resolusi Tinggi Modul Dashboard Pengelola'
                        : 'Inspect 5 High-Resolution Admin Dashboard Module Screenshots'
                    }
                    className={`px-3.5 py-2 rounded-xl text-xs font-extrabold inline-flex items-center gap-1.5 whitespace-nowrap truncate transition-all ${
                      showcaseViewMode === 'dashboard_modules'
                        ? 'bg-gradient-to-r from-[#1C1613] to-[#2A2019] text-[#E6C76B] border border-[#D4AF37] shadow-sm'
                        : 'text-stone-800 hover:text-[#8B6914] hover:bg-white/70'
                    }`}
                  >
                    <span>
                      {lang === 'ID'
                        ? '📊 5 Modul Dashboard Pengelola'
                        : '📊 5 Admin Dashboard Modules'}
                    </span>
                  </button>
                </div>
              </div>

              {showcaseViewMode === 'invitation_sim' ? (
                /* ================================================================= */
                /* TAB 1: LIVE INTERACTIVE EDITORIAL INVITATION SIMULATOR (5 EVENTS) */
                /* ================================================================= */
                (() => {
                  const simPreset =
                    SIMULATION_EVENT_PRESETS[simEventType] ||
                    SIMULATION_EVENT_PRESETS.WEDDING;
                  const simBadge =
                    lang === 'ID' ? simPreset.badgeId : simPreset.badgeEn;
                  const simSectionTitle =
                    lang === 'ID'
                      ? simPreset.sectionTitleId
                      : simPreset.sectionTitleEn;

                  const frameClassForHost =
                    simPreset.frameStyle === 'CIRCLE'
                      ? 'w-36 h-36 sm:w-44 sm:h-44 rounded-full'
                      : simPreset.frameStyle === 'EDITORIAL_RECT'
                        ? 'w-44 h-52 sm:w-52 sm:h-60 rounded-2xl'
                        : 'w-36 h-48 sm:w-44 sm:h-56 rounded-t-[999px] rounded-b-2xl';

                  return (
                    <div className="space-y-5">
                      {/* Top Control Bar: 5 Event Category Pills + Cover/Inside Toggle */}
                      <div className="p-3 sm:p-4 rounded-3xl bg-white border border-[#D4AF37]/40 shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {SIMULATION_EVENT_KEYS.map((evKey) => {
                            const presetItem = SIMULATION_EVENT_PRESETS[evKey];
                            const isSelected = simEventType === evKey;
                            return (
                              <button
                                key={evKey}
                                type="button"
                                onClick={() => {
                                  setSimEventType(evKey);
                                }}
                                className={`px-3.5 py-2 rounded-2xl border text-xs font-extrabold transition-all inline-flex items-center gap-1.5 whitespace-nowrap truncate ${
                                  isSelected
                                    ? 'bg-gradient-to-r from-[#1C1613] to-[#2A2019] text-[#E6C76B] border-[#D4AF37] ring-2 ring-[#D4AF37]/30 shadow-2xs'
                                    : 'bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-800 border-[#D4AF37]/30'
                                }`}
                              >
                                <span>
                                  {lang === 'ID'
                                    ? presetItem.tabLabelId
                                    : presetItem.tabLabelEn}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Cover Gate vs Opened Editorial View Switcher */}
                        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                          <span className="text-[11px] font-bold text-stone-500 hidden sm:inline">
                            {lang === 'ID' ? 'Mode Layar:' : 'Stage Mode:'}
                          </span>
                          <div className="inline-flex items-center p-1 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35">
                            <button
                              type="button"
                              onClick={() => {
                                setSimIsOpeningAnim(false);
                                setSimIsOpened(false);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all whitespace-nowrap ${
                                !simIsOpened
                                  ? 'bg-[#C5A059] text-white shadow-2xs'
                                  : 'text-stone-700 hover:text-[#8B6914]'
                              }`}
                            >
                              {lang === 'ID'
                                ? '🚪 Sampul Pembuka'
                                : '🚪 Cover Gate'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setSimIsOpeningAnim(false);
                                setSimIsOpened(true);
                              }}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold transition-all whitespace-nowrap ${
                                simIsOpened
                                  ? 'bg-[#C5A059] text-white shadow-2xs'
                                  : 'text-stone-700 hover:text-[#8B6914]'
                              }`}
                            >
                              {lang === 'ID'
                                ? '📖 Isi Undangan Editorial'
                                : '📖 Editorial Inside'}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Main Grid: Live Interactive Invitation Stage (8 Cols) + Editorial Highlights Card (4 Cols) */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                        {/* LEFT / MAIN: Interactive Editorial Invitation Stage */}
                        <div className="lg:col-span-8 rounded-3xl bg-[#FAF6EE] border-2 border-[#D4AF37]/55 shadow-[0_22px_56px_rgba(28,25,23,0.14)] overflow-hidden relative">
                          {/* Top Floating Luxury Bar inside Simulator */}
                          <div className="px-4 py-3 bg-white/90 backdrop-blur-md border-b border-[#D4AF37]/30 flex flex-wrap items-center justify-between gap-2 z-30 relative">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-7 h-7 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/50 text-[#8B6914] flex items-center justify-center shrink-0">
                                <CatalogEventCrest
                                  eventType={simPreset.eventType}
                                  className="w-4 h-4"
                                />
                              </span>
                              <span className="font-editorial text-sm sm:text-base font-bold text-stone-900 tracking-wide truncate">
                                {simPreset.monogram} &mdash;{' '}
                                {simPreset.titleShort}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Spinning Vinyl Audio Indicator */}
                              <div
                                title={simPreset.musicTrackLabel}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold"
                              >
                                <span className="w-4 h-4 rounded-full bg-stone-900 text-[#D4AF37] flex items-center justify-center animate-spin-slow">
                                  <Music className="w-2.5 h-2.5" />
                                </span>
                                <span className="hidden sm:inline truncate max-w-[140px]">
                                  {simPreset.musicTrackLabel}
                                </span>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  if (simIsOpened) {
                                    setSimIsOpeningAnim(false);
                                    setSimIsOpened(false);
                                  } else {
                                    handleTriggerSimCoverOpen();
                                  }
                                }}
                                className="px-3 py-1 rounded-full bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] border border-[#D4AF37]/40 text-[11px] font-extrabold transition-all whitespace-nowrap"
                              >
                                {simIsOpened
                                  ? lang === 'ID'
                                    ? 'Lihat Sampul'
                                    : 'View Cover'
                                  : lang === 'ID'
                                    ? 'Buka Undangan'
                                    : 'Open Invitation'}
                              </button>
                            </div>
                          </div>

                          {!simIsOpened ? (
                            /* ======================================================= */
                            /* COVER CURTAIN-LIFT GATE VIEW (!simIsOpened)             */
                            /* ======================================================= */
                            <div
                              className={`relative min-h-[540px] sm:min-h-[600px] flex flex-col items-center justify-center text-center px-5 py-12 overflow-hidden transition-all duration-500 ease-out ${
                                simIsOpeningAnim
                                  ? '-translate-y-full scale-105 opacity-0'
                                  : 'translate-y-0 scale-100 opacity-100'
                              }`}
                            >
                              {/* Background Hero Photo with Soft Editorial Warm Overlay */}
                              <img
                                src={simPreset.heroImage}
                                alt={simPreset.titleShort}
                                className="absolute inset-0 w-full h-full object-cover animate-ken-burns"
                              />
                              <div className="absolute inset-0 bg-gradient-to-b from-stone-950/65 via-stone-900/55 to-stone-950/80 backdrop-blur-[1.5px]" />

                              {/* Optional Floral Corners on Cover Gate */}
                              <CatalogFloralCorner
                                position="top-left"
                                size="lg"
                                enabled={simPreset.showFloral}
                              />
                              <CatalogFloralCorner
                                position="top-right"
                                size="lg"
                                enabled={simPreset.showFloral}
                              />
                              <CatalogFloralCorner
                                position="bottom-left"
                                size="lg"
                                enabled={simPreset.showFloral}
                              />
                              <CatalogFloralCorner
                                position="bottom-right"
                                size="lg"
                                enabled={simPreset.showFloral}
                              />

                              <div className="relative z-20 max-w-lg mx-auto space-y-5 text-[#FFFDF9]">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-md border border-[#D4AF37]/55 text-[#F3D77D] text-[11px] font-extrabold uppercase tracking-[0.2em]">
                                  <CatalogEventCrest
                                    eventType={simPreset.eventType}
                                    className="w-4 h-4 text-[#F3D77D]"
                                  />
                                  <span>{simBadge}</span>
                                </div>

                                <h4
                                  className={`${
                                    simPreset.eventType === 'WEDDING' ||
                                    simPreset.eventType === 'BIRTHDAY'
                                      ? 'font-script text-4xl sm:text-6xl'
                                      : 'font-editorial text-3xl sm:text-5xl font-bold'
                                  } text-[#FFFDF9] drop-shadow-[0_4px_18px_rgba(0,0,0,0.65)] leading-tight`}
                                >
                                  {simPreset.titleShort}
                                </h4>

                                <p className="text-xs sm:text-sm text-[#FAF3E3]/90 font-medium tracking-wide">
                                  {simPreset.eventDate} &bull;{' '}
                                  {simPreset.eventVenue}
                                </p>

                                {/* Sample VIP Guest Pass Card */}
                                <div className="mx-auto max-w-sm p-4 rounded-2xl bg-white/12 backdrop-blur-md border border-[#D4AF37]/50 text-center space-y-1.5 shadow-lg">
                                  <p className="text-[10px] uppercase tracking-[0.22em] text-[#E6C76B] font-bold">
                                    {lang === 'ID'
                                      ? 'Kepada Yth. Bapak / Ibu / Saudara/i'
                                      : 'Dear Honored VIP Guest'}
                                  </p>
                                  <p className="font-editorial text-lg sm:text-xl font-bold text-white">
                                    Bapak/Ibu Tamu Kehormatan
                                  </p>
                                  <span className="inline-block px-2.5 py-0.5 rounded-md bg-[#D4AF37]/25 border border-[#D4AF37]/60 text-[#F3D77D] font-mono text-[10px] font-extrabold">
                                    VIP PASS &bull; INV-0001 (2 Pax)
                                  </span>
                                </div>

                                <div className="pt-2">
                                  <button
                                    type="button"
                                    onClick={handleTriggerSimCoverOpen}
                                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm shadow-[0_10px_30px_rgba(212,175,55,0.45)] transition-all hover:scale-105 cursor-pointer"
                                  >
                                    <BookOpen className="w-4 h-4 shrink-0" />
                                    <span>
                                      {lang === 'ID'
                                        ? 'Buka Undangan (Efek Tirai)'
                                        : 'Open Invitation (Curtain Lift)'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            /* ======================================================= */
                            /* OPENED EDITORIAL INVITATION STAGE (simIsOpened === true)*/
                            /* ======================================================= */
                            <div className="max-h-[680px] overflow-y-auto bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE2] relative">
                              {/* 1. FEATHERED HERO BANNER WITH ALPHA MASK & KEN BURNS */}
                              <div className="relative">
                                <CatalogFloralCorner
                                  position="top-left"
                                  size="md"
                                  enabled={simPreset.showFloral}
                                />
                                <CatalogFloralCorner
                                  position="top-right"
                                  size="md"
                                  enabled={simPreset.showFloral}
                                />

                                <div
                                  className="relative h-64 sm:h-80 w-full overflow-hidden"
                                  style={{
                                    maskImage:
                                      'linear-gradient(to bottom, black 0%, black 66%, rgba(0,0,0,0.45) 84%, transparent 100%)',
                                    WebkitMaskImage:
                                      'linear-gradient(to bottom, black 0%, black 66%, rgba(0,0,0,0.45) 84%, transparent 100%)',
                                  }}
                                >
                                  <img
                                    src={simPreset.heroImage}
                                    alt={simPreset.titleFull}
                                    className="w-full h-full object-cover animate-ken-burns"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-[#FAF6EE] via-transparent to-black/25" />
                                </div>

                                {/* Editorial Title & Crest Overlapping Feathered Bottom */}
                                <div className="relative z-10 -mt-12 sm:-mt-16 px-4 sm:px-8 text-center space-y-3">
                                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-[0.22em] shadow-2xs">
                                    <CatalogEventCrest
                                      eventType={simPreset.eventType}
                                      className="w-3.5 h-3.5 text-[#B68D40]"
                                    />
                                    <span>{simBadge}</span>
                                  </div>

                                  <h4 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 leading-tight max-w-2xl mx-auto">
                                    {simPreset.titleFull}
                                  </h4>

                                  {/* Gold Filigree Divider */}
                                  <div
                                    aria-hidden="true"
                                    className="flex items-center justify-center gap-2.5 text-[#B68D40]"
                                  >
                                    <span className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#C5A059] to-[#D4AF37]" />
                                    <CatalogEventCrest
                                      eventType={simPreset.eventType}
                                      className="w-5 h-5"
                                    />
                                    <span className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent via-[#C5A059] to-[#D4AF37]" />
                                  </div>

                                  <p className="text-xs sm:text-sm italic text-stone-600 max-w-xl mx-auto leading-relaxed">
                                    {simPreset.quote}
                                  </p>

                                  {/* 4-Box Countdown + Save to Calendar Pill */}
                                  <div className="pt-2 flex flex-col items-center gap-3">
                                    <div className="grid grid-cols-4 gap-2 max-w-xs w-full mx-auto">
                                      {[
                                        {
                                          val: '14',
                                          lbl: lang === 'ID' ? 'Hari' : 'Days',
                                        },
                                        {
                                          val: '08',
                                          lbl: lang === 'ID' ? 'Jam' : 'Hours',
                                        },
                                        {
                                          val: '45',
                                          lbl: lang === 'ID' ? 'Menit' : 'Mins',
                                        },
                                        {
                                          val: '22',
                                          lbl: lang === 'ID' ? 'Detik' : 'Secs',
                                        },
                                      ].map((cd) => (
                                        <div
                                          key={cd.lbl}
                                          className="py-2 px-2 rounded-2xl bg-white/90 border border-[#D4AF37]/45 shadow-2xs text-center"
                                        >
                                          <span className="font-editorial text-lg sm:text-xl font-bold text-[#8B6914] block leading-none">
                                            {cd.val}
                                          </span>
                                          <span className="text-[9px] font-extrabold uppercase tracking-wider text-stone-500">
                                            {cd.lbl}
                                          </span>
                                        </div>
                                      ))}
                                    </div>

                                    <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/50 text-[#8B6914] text-[11px] font-extrabold">
                                      <Calendar className="w-3.5 h-3.5" />
                                      <span>
                                        {lang === 'ID'
                                          ? 'Simpan ke Google Calendar'
                                          : 'Save to Google Calendar'}
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* 2. OPEN EDITORIAL SECTION HEADER + ADAPTIVE PROFILE SECTION */}
                              <div className="px-4 sm:px-8 py-8 sm:py-10 space-y-6">
                                {/* Open Editorial Header (No Rigid Box!) */}
                                <div className="text-center max-w-xl mx-auto space-y-1.5">
                                  <p className="text-[10px] font-extrabold uppercase tracking-[0.26em] text-[#9A742B]">
                                    {simBadge}
                                  </p>
                                  <h5 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900">
                                    {simSectionTitle}
                                  </h5>
                                  <div
                                    aria-hidden="true"
                                    className="flex items-center justify-center gap-2 pt-1"
                                  >
                                    <span className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent via-[#C5A059] to-[#D4AF37]" />
                                    <span className="w-2 h-2 rotate-45 bg-[#C5A059]" />
                                    <span className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent via-[#C5A059] to-[#D4AF37]" />
                                  </div>
                                </div>

                                {simPreset.profileCount === 2 &&
                                simPreset.host2 ? (
                                  /* 2-PROFILE ARCH-DOME LAYOUT (WEDDING) */
                                  <div className="grid grid-cols-1 md:grid-cols-11 gap-4 items-center max-w-3xl mx-auto">
                                    {/* Host 1 */}
                                    <div className="md:col-span-5 p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm text-center flex flex-col items-center space-y-3 relative overflow-hidden">
                                      <CatalogFloralCorner
                                        position="top-left"
                                        size="sm"
                                        enabled={simPreset.showFloral}
                                      />
                                      <div className="p-1.5 rounded-t-[999px] rounded-b-2xl border-2 border-[#D4AF37]/65 bg-gradient-to-b from-[#FAF3E3] to-white shadow-md">
                                        <img
                                          src={simPreset.host1.photo}
                                          alt={simPreset.host1.name}
                                          className={`${frameClassForHost} object-cover`}
                                        />
                                      </div>
                                      <span className="px-3 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                                        {simPreset.host1.role}
                                      </span>
                                      <h6 className="font-editorial text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                                        {simPreset.host1.name}
                                      </h6>
                                      <p className="text-[11px] text-stone-600 leading-relaxed">
                                        {simPreset.host1.parents}
                                      </p>
                                    </div>

                                    {/* Center Script Ampersand */}
                                    <div className="md:col-span-1 flex items-center justify-center py-1">
                                      <span className="font-script text-4xl sm:text-5xl text-[#B68D40]">
                                        &amp;
                                      </span>
                                    </div>

                                    {/* Host 2 */}
                                    <div className="md:col-span-5 p-5 rounded-3xl bg-white/85 backdrop-blur-md border border-[#D4AF37]/40 shadow-sm text-center flex flex-col items-center space-y-3 relative overflow-hidden">
                                      <CatalogFloralCorner
                                        position="top-right"
                                        size="sm"
                                        enabled={simPreset.showFloral}
                                      />
                                      <div className="p-1.5 rounded-t-[999px] rounded-b-2xl border-2 border-[#D4AF37]/65 bg-gradient-to-b from-[#FAF3E3] to-white shadow-md">
                                        <img
                                          src={simPreset.host2.photo}
                                          alt={simPreset.host2.name}
                                          className={`${frameClassForHost} object-cover`}
                                        />
                                      </div>
                                      <span className="px-3 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                                        {simPreset.host2.role}
                                      </span>
                                      <h6 className="font-editorial text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                                        {simPreset.host2.name}
                                      </h6>
                                      <p className="text-[11px] text-stone-600 leading-relaxed">
                                        {simPreset.host2.parents}
                                      </p>
                                    </div>
                                  </div>
                                ) : (
                                  /* 1-PROFILE CENTERED SPOTLIGHT LAYOUT (BIRTHDAY / GRADUATION / MEETING / GALA) */
                                  <div className="max-w-md mx-auto p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-[#D4AF37]/45 shadow-sm text-center flex flex-col items-center space-y-3 relative overflow-hidden">
                                    <CatalogFloralCorner
                                      position="top-left"
                                      size="sm"
                                      enabled={simPreset.showFloral}
                                    />
                                    <CatalogFloralCorner
                                      position="top-right"
                                      size="sm"
                                      enabled={simPreset.showFloral}
                                    />
                                    <div
                                      className={`p-1.5 border-2 border-[#D4AF37]/65 bg-gradient-to-b from-[#FAF3E3] to-white shadow-md ${
                                        simPreset.frameStyle === 'CIRCLE'
                                          ? 'rounded-full'
                                          : simPreset.frameStyle ===
                                              'EDITORIAL_RECT'
                                            ? 'rounded-2xl'
                                            : 'rounded-t-[999px] rounded-b-2xl'
                                      }`}
                                    >
                                      <img
                                        src={simPreset.host1.photo}
                                        alt={simPreset.host1.name}
                                        className={`${frameClassForHost} object-cover`}
                                      />
                                    </div>
                                    <span className="px-3 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                                      {simPreset.host1.role}
                                    </span>
                                    <h6 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900 leading-snug">
                                      {simPreset.host1.name}
                                    </h6>
                                    {simPreset.host1.parents && (
                                      <p className="text-xs text-stone-600 leading-relaxed">
                                        {simPreset.host1.parents}
                                      </p>
                                    )}
                                  </div>
                                )}

                                {/* 3. SCHEDULE & LUXURY METALLIC EMV CHIP DIGITAL ENVELOPE PREVIEW */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 max-w-3xl mx-auto">
                                  {/* Schedule Card */}
                                  <div className="p-4 sm:p-5 rounded-3xl bg-white/90 border border-[#D4AF37]/40 shadow-2xs space-y-2.5 flex flex-col justify-between">
                                    <div className="space-y-1.5">
                                      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                                        <Calendar className="w-3.5 h-3.5 text-[#B68D40]" />
                                        <span>
                                          {lang === 'ID'
                                            ? 'Rangkaian Acara Utama'
                                            : 'Primary Event Schedule'}
                                        </span>
                                      </span>
                                      <h6 className="font-editorial text-lg font-bold text-stone-900">
                                        {simPreset.eventTitle}
                                      </h6>
                                      <p className="text-xs font-bold text-[#8B6914]">
                                        {simPreset.eventDate}
                                      </p>
                                      <p className="text-xs text-stone-600 flex items-start gap-1.5">
                                        <MapPin className="w-3.5 h-3.5 text-[#B68D40] shrink-0 mt-0.5" />
                                        <span>{simPreset.eventVenue}</span>
                                      </p>
                                    </div>
                                    <div className="pt-2 flex items-center justify-between gap-2 border-t border-stone-200/70">
                                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                        ✓ Google Maps &amp; RSVP Live
                                      </span>
                                      <span className="text-[10px] font-extrabold text-[#8B6914]">
                                        INV-0001
                                      </span>
                                    </div>
                                  </div>

                                  {/* Luxury Metallic EMV Chip Digital Envelope Card */}
                                  <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#1C1613] via-[#251C16] to-[#33261D] text-[#FAF3E3] border border-[#D4AF37]/65 shadow-md space-y-3 flex flex-col justify-between relative overflow-hidden">
                                    <div className="flex items-center justify-between gap-2">
                                      <CatalogGoldEmvChip className="w-9 h-7" />
                                      <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/45 text-[#E6C76B] text-[9px] font-extrabold uppercase tracking-widest">
                                        Digital Envelope &bull; Multi-Currency
                                      </span>
                                    </div>
                                    <div className="space-y-0.5">
                                      <p className="text-[10px] uppercase tracking-widest text-[#E6C76B]/80 font-bold">
                                        Bank / QRIS / PayPal / USDT
                                      </p>
                                      <p className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-white">
                                        8820 &bull;&bull;&bull;&bull;
                                        &bull;&bull;&bull;&bull; 2026
                                      </p>
                                      <p className="text-[11px] text-[#FAF3E3]/80 truncate">
                                        a.n. {simPreset.titleShort}
                                      </p>
                                    </div>
                                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 text-[10px] text-[#E6C76B] font-bold">
                                      <span>1-Click Copy Rekening</span>
                                      <span>QRIS &amp; Crypto Ready</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* RIGHT: Fitur Desain Editorial & Multi-Event Summary Card (4 Cols) */}
                        <div className="lg:col-span-4 rounded-3xl bg-white border-2 border-[#D4AF37]/45 p-5 sm:p-6 shadow-[0_14px_38px_rgba(28,25,23,0.08)] space-y-5 relative overflow-hidden">
                          <CatalogFloralCorner
                            position="top-right"
                            size="sm"
                            className="opacity-45"
                          />
                          <div className="space-y-1.5 relative z-10">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                              <Sparkles className="w-3 h-3 text-[#B68D40]" />
                              <span>
                                {lang === 'ID'
                                  ? 'Standar Desain Editorial 2026'
                                  : '2026 Luxury Editorial Standard'}
                              </span>
                            </span>
                            <h4 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
                              {lang === 'ID'
                                ? 'Fitur Desain Editorial & Multi-Event'
                                : 'Editorial & Multi-Event Design Features'}
                            </h4>
                            <p className="text-xs text-stone-600 leading-relaxed">
                              {lang === 'ID'
                                ? 'Setiap klien mendapatkan Studio Kustomisasi penuh untuk mengatur tampilan undangan sesuai jenis acara:'
                                : 'Every client gets a full Customization Studio to tailor their invitation for any event category:'}
                            </p>
                          </div>

                          <ul className="space-y-2.5 text-xs text-stone-700 relative z-10">
                            {(lang === 'ID'
                              ? [
                                  'Feathered Hero Banner dengan transisi alpha-mask halus & animasi Ken Burns.',
                                  'Bingkai Foto Kubah (Arch-Dome), Lingkaran (Circle), atau Editorial Tegak.',
                                  'Otomatis 2 Profil (Pernikahan) atau 1 Profil Spotlight (Birthday, Wisuda, Rapat & Gala).',
                                  'Ornamen Sudut Bunga Emas (Floral Corner) yang dapat dinyalakan/dimatikan.',
                                  'Kartu Amplop Digital Metalik ber-Chip Emas (Bank, QRIS, PayPal & Crypto USDT).',
                                  'Mendukung Background Video Sinematik s/d 25 MB (Auto-Stretch HP ke PC).',
                                ]
                              : [
                                  'Feathered Hero Banner with seamless alpha-mask & slow Ken Burns motion.',
                                  'Selectable Arch-Dome, Circle, or Editorial Rectangle portrait frames.',
                                  'Adaptive 2-Profile (Wedding) or 1-Profile Spotlight (Birthday, Graduation, Corporate & Gala).',
                                  'Toggleable animated gold-leaf Floral Corner Ornaments.',
                                  'Luxury Metallic EMV Chip Digital Envelope (Bank, QRIS, PayPal & Crypto USDT).',
                                  'Supports up to 25 MB Cinematic Video Backgrounds (9:16 Mobile to 16:9 PC).',
                                ]
                            ).map((item) => (
                              <li key={item} className="flex items-start gap-2">
                                <CheckCircle2 className="w-4 h-4 text-[#B68D40] shrink-0 mt-0.5" />
                                <span className="leading-relaxed">{item}</span>
                              </li>
                            ))}
                          </ul>

                          <div className="pt-3 border-t border-[#D4AF37]/30 space-y-2.5 relative z-10">
                            <button
                              type="button"
                              onClick={() =>
                                setShowcaseViewMode('dashboard_modules')
                              }
                              className="w-full py-3 px-4 rounded-2xl bg-stone-900 hover:bg-stone-800 text-[#E6C76B] border border-[#D4AF37]/50 font-extrabold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all"
                            >
                              <LayoutDashboard className="w-4 h-4 shrink-0" />
                              <span className="truncate">
                                {lang === 'ID'
                                  ? '📊 Lihat 5 Modul Dashboard Pengelola'
                                  : '📊 View 5 Admin Dashboard Modules'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleSelectPackageForCheckout('EXCLUSIVE')
                              }
                              className="w-full py-2.5 px-4 rounded-2xl bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border border-[#D4AF37]/45 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 transition-all"
                            >
                              <Wallet className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {lang === 'ID'
                                  ? 'Pesan Undangan & Workspace Sekarang'
                                  : 'Order Invitation & Workspace Now'}
                              </span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()
              ) : (
                /* ================================================================= */
                /* TAB 2: 5 ADMIN DASHBOARD MODULE SCREENSHOTS + FULLSCREEN LIGHTBOX */
                /* ================================================================= */
                <>
                  {/* Quick Action Row for Screenshots */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-bold text-stone-600">
                      {lang === 'ID'
                        ? 'Klik tab modul di bawah atau klik gambar untuk memperbesar ke Layar Penuh:'
                        : 'Click any module tab below or click the screenshot to zoom Fullscreen:'}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openLightboxAt(activeShowcaseIdx)}
                        title={
                          lang === 'ID'
                            ? 'Perbesar Screenshot Modul Aktif ke Layar Penuh'
                            : 'Zoom Active Module Screenshot to Fullscreen'
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] border border-[#D4AF37]/45 text-xs font-extrabold whitespace-nowrap truncate shadow-2xs transition-all"
                      >
                        <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="whitespace-nowrap truncate">
                          {lang === 'ID' ? 'Layar Penuh' : 'Fullscreen'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={onOpenAdminPortal}
                        title={
                          lang === 'ID'
                            ? 'Masuk ke Portal Klien / EO / WO / Superadmin'
                            : 'Login to Client / EO / WO / Superadmin Portal'
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#D4AF37]/45 text-[#8B6914] hover:bg-[#FAF3E3] text-xs font-bold whitespace-nowrap truncate shadow-2xs transition-all"
                      >
                        <Shield className="w-3.5 h-3.5 shrink-0" />
                        <span className="whitespace-nowrap truncate">
                          {lang === 'ID'
                            ? 'Buka Portal Login'
                            : 'Open Login Portal'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Row of 5 Interactive Module Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {OFFICIAL_PRODUCT_SCREENSHOTS.map((shot, idx) => {
                      const isActive = activeShowcaseIdx === idx;
                      const tabLabel = lang === 'ID' ? shot.tabId : shot.tabEn;
                      const fullTitle =
                        lang === 'ID' ? shot.titleId : shot.titleEn;
                      return (
                        <button
                          key={shot.id}
                          type="button"
                          onClick={() => setActiveShowcaseIdx(idx)}
                          title={`${shot.badge} — ${fullTitle}`}
                          className={`px-3 py-2.5 rounded-2xl border text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 whitespace-nowrap truncate shadow-2xs ${
                            isActive
                              ? 'bg-gradient-to-r from-[#1C1613] to-[#2A2019] text-[#E6C76B] border-[#D4AF37] ring-2 ring-[#D4AF37]/35'
                              : 'bg-white hover:bg-[#FAF3E3] text-stone-800 hover:text-[#8B6914] border-[#D4AF37]/35'
                          }`}
                        >
                          <span className="whitespace-nowrap truncate">
                            {tabLabel}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Featured Interactive Browser Frame Preview */}
                  {(() => {
                    const currentShot =
                      OFFICIAL_PRODUCT_SCREENSHOTS[activeShowcaseIdx] ||
                      OFFICIAL_PRODUCT_SCREENSHOTS[0];
                    const currentTitle =
                      lang === 'ID' ? currentShot.titleId : currentShot.titleEn;
                    const currentDesc =
                      lang === 'ID' ? currentShot.descId : currentShot.descEn;

                    return (
                      <div className="rounded-3xl bg-white border-2 border-[#D4AF37]/45 shadow-[0_18px_48px_rgba(28,25,23,0.10)] overflow-hidden">
                        {/* Browser Window Top Bar */}
                        <div className="px-3.5 sm:px-5 py-3 bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-[#FAF3E3] border-b border-[#D4AF37]/35 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="w-2.5 h-2.5 rounded-full bg-rose-400/90" />
                              <span className="w-2.5 h-2.5 rounded-full bg-amber-400/90" />
                              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400/90" />
                            </div>
                            <span className="ml-1 px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/45 text-[#E6C76B] font-mono text-[10px] font-extrabold whitespace-nowrap truncate">
                              {currentShot.badge}
                            </span>
                            <span className="hidden md:inline-block font-mono text-[11px] text-stone-300 truncate">
                              https://my-event-planner.app/workspace/
                              {currentShot.id}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveShowcaseIdx(
                                  (prev) =>
                                    (prev -
                                      1 +
                                      OFFICIAL_PRODUCT_SCREENSHOTS.length) %
                                    OFFICIAL_PRODUCT_SCREENSHOTS.length
                                )
                              }
                              title={
                                lang === 'ID'
                                  ? 'Modul Sebelumnya'
                                  : 'Previous Module'
                              }
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FAF3E3] border border-white/15 transition-all"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-[11px] font-mono font-bold text-[#E6C76B] px-1.5">
                              {activeShowcaseIdx + 1} /{' '}
                              {OFFICIAL_PRODUCT_SCREENSHOTS.length}
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveShowcaseIdx(
                                  (prev) =>
                                    (prev + 1) %
                                    OFFICIAL_PRODUCT_SCREENSHOTS.length
                                )
                              }
                              title={
                                lang === 'ID'
                                  ? 'Modul Berikutnya'
                                  : 'Next Module'
                              }
                              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#FAF3E3] border border-white/15 transition-all"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => openLightboxAt(activeShowcaseIdx)}
                              title={
                                lang === 'ID'
                                  ? 'Perbesar Layar Penuh'
                                  : 'Zoom Fullscreen'
                              }
                              className="ml-1 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] hover:from-[#C5A059] hover:to-[#D4AF37] text-stone-950 text-[11px] font-extrabold whitespace-nowrap truncate shadow-2xs transition-all"
                            >
                              <Maximize2 className="w-3.5 h-3.5 shrink-0" />
                              <span className="whitespace-nowrap truncate">
                                {lang === 'ID' ? 'Layar Penuh' : 'Fullscreen'}
                              </span>
                            </button>
                          </div>
                        </div>

                        {/* Screenshot Image Viewport */}
                        <div
                          onClick={() => openLightboxAt(activeShowcaseIdx)}
                          title={
                            lang === 'ID'
                              ? 'Klik gambar untuk memperbesar ke layar penuh'
                              : 'Click image to zoom fullscreen'
                          }
                          className="relative bg-stone-950/95 cursor-zoom-in group overflow-hidden max-h-[540px] flex items-center justify-center"
                        >
                          <img
                            src={currentShot.imageUrl}
                            alt={currentTitle}
                            className="w-full h-auto max-h-[540px] object-contain object-top transition-transform duration-300 group-hover:scale-[1.01]"
                          />
                          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full bg-black/75 backdrop-blur-xs border border-[#D4AF37]/50 text-[#FAF3E3] text-[11px] font-bold inline-flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                            <span>
                              {lang === 'ID'
                                ? 'Klik untuk Layar Penuh'
                                : 'Click for Fullscreen'}
                            </span>
                          </div>
                        </div>

                        {/* Active Screenshot Description & Prev/Next Footer */}
                        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#FAF3E3] via-[#FFFDF9] to-[#FAF3E3] border-t border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="px-2.5 py-0.5 rounded-md bg-stone-900 text-[#D4AF37] font-mono text-[10px] font-extrabold whitespace-nowrap">
                                {currentShot.badge}
                              </span>
                              <h4 className="font-serif text-base sm:text-lg font-extrabold text-stone-900">
                                {currentTitle}
                              </h4>
                            </div>
                            <p className="text-xs text-stone-600 leading-relaxed max-w-3xl">
                              {currentDesc}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveShowcaseIdx(
                                  (prev) =>
                                    (prev -
                                      1 +
                                      OFFICIAL_PRODUCT_SCREENSHOTS.length) %
                                    OFFICIAL_PRODUCT_SCREENSHOTS.length
                                )
                              }
                              title={
                                lang === 'ID'
                                  ? 'Lihat Screenshot Modul Sebelumnya'
                                  : 'View Previous Module Screenshot'
                              }
                              className="px-3 py-2 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-stone-800 text-xs font-extrabold inline-flex items-center gap-1 whitespace-nowrap shadow-2xs transition-all"
                            >
                              <ArrowLeft className="w-3.5 h-3.5 text-[#8B6914]" />
                              <span>
                                {lang === 'ID' ? 'Sebelumnya' : 'Prev'}
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setActiveShowcaseIdx(
                                  (prev) =>
                                    (prev + 1) %
                                    OFFICIAL_PRODUCT_SCREENSHOTS.length
                                )
                              }
                              title={
                                lang === 'ID'
                                  ? 'Lihat Screenshot Modul Berikutnya'
                                  : 'View Next Module Screenshot'
                              }
                              className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white text-xs font-extrabold inline-flex items-center gap-1 whitespace-nowrap shadow-2xs transition-all"
                            >
                              <span>
                                {lang === 'ID' ? 'Berikutnya' : 'Next'}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* 5-Card Thumbnail Grid Below Featured Frame */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 min-w-0">
                    {OFFICIAL_PRODUCT_SCREENSHOTS.map((shot, idx) => {
                      const isSelected = activeShowcaseIdx === idx;
                      const shotTitle =
                        lang === 'ID' ? shot.titleId : shot.titleEn;
                      const shotDesc =
                        lang === 'ID' ? shot.descId : shot.descEn;
                      return (
                        <div
                          key={shot.id}
                          onClick={() => setActiveShowcaseIdx(idx)}
                          className={`group cursor-pointer rounded-2xl bg-white border overflow-hidden flex flex-col justify-between transition-all ${
                            isSelected
                              ? 'border-2 border-[#B68D40] ring-2 ring-[#D4AF37]/35 shadow-md -translate-y-0.5'
                              : 'border-[#D4AF37]/35 hover:border-[#B68D40] shadow-2xs hover:-translate-y-0.5'
                          }`}
                        >
                          <div>
                            <div className="relative h-28 bg-stone-900 overflow-hidden border-b border-stone-200/80">
                              <img
                                src={shot.imageUrl}
                                alt={shotTitle}
                                className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
                              />
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-stone-900/90 text-[#E6C76B] font-mono text-[9px] font-extrabold whitespace-nowrap">
                                {lang === 'ID' ? shot.tabId : shot.tabEn}
                              </span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openLightboxAt(idx);
                                }}
                                title={
                                  lang === 'ID'
                                    ? `Perbesar ${shotTitle}`
                                    : `Zoom ${shotTitle}`
                                }
                                className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/20 transition-all"
                              >
                                <Maximize2 className="w-3 h-3 text-[#E6C76B]" />
                              </button>
                            </div>
                            <div className="p-3 space-y-1">
                              <p className="text-[10px] font-extrabold text-[#8B6914] truncate">
                                {shot.badge}
                              </p>
                              <h5 className="text-xs font-extrabold text-stone-900 line-clamp-2 leading-snug">
                                {shotTitle}
                              </h5>
                              <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                                {shotDesc}
                              </p>
                            </div>
                          </div>
                          <div className="px-3 py-2 bg-[#FAF8F5] border-t border-stone-200/60 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold text-[#8B6914] whitespace-nowrap truncate">
                              {isSelected
                                ? lang === 'ID'
                                  ? '● Sedang Ditampilkan'
                                  : '● Currently Viewing'
                                : lang === 'ID'
                                  ? 'Klik untuk Pratinjau'
                                  : 'Click to Preview'}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openLightboxAt(idx);
                              }}
                              title={
                                lang === 'ID'
                                  ? 'Buka Layar Penuh'
                                  : 'Open Fullscreen'
                              }
                              className="text-[10px] font-extrabold text-stone-800 hover:text-[#8B6914] underline whitespace-nowrap"
                            >
                              {lang === 'ID' ? 'Zoom' : 'Zoom'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </section>

            {/* SECTION 2: 6 MODUL UNGGULAN MY EVENT PLANNER */}
            <section
              id="fitur"
              className="py-12 sm:py-16 bg-white border-y border-[#D4AF37]/25"
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto mb-10">
                  <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                    {lang === 'ID'
                      ? 'Arsitektur Cloud Enterprise'
                      : 'Enterprise Cloud Architecture'}
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
                    {lang === 'ID'
                      ? '6 Modul Terintegrasi dalam 1 Ekosistem'
                      : '6 Integrated Modules in 1 Ecosystem'}
                  </h3>
                  <div
                    aria-hidden="true"
                    className="flex items-center justify-center gap-2.5 my-2.5 text-[#B68D40]"
                  >
                    <span className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#C5A059] to-[#D4AF37]" />
                    <span className="w-2 h-2 rotate-45 bg-[#C5A059]" />
                    <span className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent via-[#C5A059] to-[#D4AF37]" />
                  </div>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    {lang === 'ID' ? (
                      <>
                        Dirancang khusus agar penyelenggara acara, keluarga, dan
                        tim Event/Wedding Organizer dapat berkolaborasi secara{' '}
                        <em>real-time</em>.
                      </>
                    ) : (
                      <>
                        Purpose-built so hosts, families, and Event/Wedding
                        Organizer teams can collaborate in <em>real-time</em>.
                      </>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 min-w-0">
                  {(lang === 'ID'
                    ? [
                        {
                          icon: LayoutDashboard,
                          title: '1. Readiness Tracker 8 Domain',
                          desc: 'Pantau persentase kesiapan administrasi Polri/TNI, Gereja/KUA, Kependudukan, Kesehatan, Vendor, hingga Hari-H secara eksekutif.',
                        },
                        {
                          icon: Calendar,
                          title: '2. Checklist Bertahap & PIC',
                          desc: 'Manajemen tugas dari H-6 Bulan hingga Setelah Menikah dengan pembagian PIC (Mempelai, Keluarga, atau Panitia/WO).',
                        },
                        {
                          icon: Wallet,
                          title: '3. Moneter, Vendor & Amplop Digital',
                          desc: 'Kontrol anggaran vs realisasi kontrak vendor, pelacakan DP/Lunas, serta amplop digital Bank, QRIS, PayPal & Crypto USDT.',
                        },
                        {
                          icon: Send,
                          title: '4. Tamu VIP & Generator WA 1-Klik',
                          desc: 'Mendukung kode undangan unik (INV-0001), deteksi otomatis lencana Tamu VIP, dan pengiriman undangan WhatsApp personal.',
                        },
                        {
                          icon: ImageIcon,
                          title: '5. Studio Foto 10 MB & Smart Audio',
                          desc: 'Unggah foto Ultra-HD hingga 10 MB per foto dengan Interactive Cropper & pemutar musik latar dari Supabase Storage CDN.',
                        },
                        {
                          icon: Shield,
                          title: '6. Multi-Client SaaS & Superadmin',
                          desc: 'Setiap klien memiliki 4 Akun Default Inti + akun Panitia dengan workspace data yang terisolasi penuh & dimonitor oleh Superadmin.',
                        },
                      ]
                    : [
                        {
                          icon: LayoutDashboard,
                          title: '1. 8-Domain Readiness Tracker',
                          desc: 'Monitor executive readiness across Civil/Military permits, Church/KUA, Legal documents, Health, Vendors, and Wedding Day operations.',
                        },
                        {
                          icon: Calendar,
                          title: '2. Phased Timeline & PIC Assignment',
                          desc: 'Manage tasks from 6 Months Prior to Post-Wedding with clear PIC ownership (Groom, Bride, Family, or WO Committee).',
                        },
                        {
                          icon: Wallet,
                          title: '3. Vendor Budget & Digital Envelope',
                          desc: 'Track estimated vs actual vendor contracts, DP/paid status, plus Digital Envelopes via Bank, PayPal & Crypto USDT.',
                        },
                        {
                          icon: Send,
                          title: '4. VIP Guest CRM & 1-Click WA Blast',
                          desc: 'Supports unique VIP invitation codes (INV-0001), automatic VIP badge detection, and personalized 1-click WhatsApp invitations.',
                        },
                        {
                          icon: ImageIcon,
                          title: '5. 10 MB Photo Studio & Smart Audio',
                          desc: 'Upload Ultra-HD photos up to 10 MB with non-destructive Studio Cropper & custom MP3 background music powered by Supabase CDN.',
                        },
                        {
                          icon: Shield,
                          title: '6. Multi-Client SaaS & Forensic Audit',
                          desc: 'Each couple gets 4 Core Family Logins + WO Committee accounts in an isolated workspace with negative comment forensic audit.',
                        },
                      ]
                  ).map((feat) => {
                    const Icon = feat.icon;
                    return (
                      <div
                        key={feat.title}
                        className="min-w-0 p-5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5"
                      >
                        <div className="w-10 h-10 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] flex items-center justify-center">
                          <Icon className="w-5 h-5" />
                        </div>
                        <h4 className="font-extrabold text-stone-900 text-sm">
                          {feat.title}
                        </h4>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* SECTION 3: PAKET KOMERSIAL (STARTER -> EXCLUSIVE -> ROYAL VIP) — CLICKING OPENS DEDICATED CHECKOUT PAGE */}
            <section
              id="paket"
              className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            >
              <div className="text-center max-w-3xl mx-auto mb-10">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                  {lang === 'ID'
                    ? 'Lisensi & Layanan Komersial (QRIS • Transfer Bank • Kartu Kredit • PayPal • Crypto)'
                    : 'Commercial Plans & Licensing (Credit Card • PayPal • Crypto USDT)'}
                </span>
                <h3 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
                  {lang === 'ID'
                    ? 'Pilihan Paket My Event Planner'
                    : 'My Event Planner Packages'}
                </h3>
                <div
                  aria-hidden="true"
                  className="flex items-center justify-center gap-2.5 my-2.5 text-[#B68D40]"
                >
                  <span className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#C5A059] to-[#D4AF37]" />
                  <span className="w-2 h-2 rotate-45 bg-[#C5A059]" />
                  <span className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent via-[#C5A059] to-[#D4AF37]" />
                </div>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  {lang === 'ID'
                    ? 'Klik tombol Pilih Paket di bawah untuk membuka halaman pembayaran multi-wallet & verifikasi lisensi idempoten.'
                    : 'Click Select & Checkout on any plan below to open the dedicated multi-wallet payment & idempotent activation page.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch min-w-0">
                {commercialPackages.map((pkg) => {
                  const isRoyal = pkg.styleVariant === 'royal';
                  const isExclusive = pkg.styleVariant === 'exclusive';

                  return (
                    <div
                      key={pkg.tier}
                      className={`min-w-0 overflow-hidden rounded-3xl p-6 flex flex-col justify-between transition-all ${
                        isRoyal
                          ? 'bg-gradient-to-b from-[#1C1613] via-[#221A15] to-[#2A2019] text-[#FAF3E3] border-2 border-[#D4AF37] shadow-[0_20px_50px_rgba(182,141,64,0.28)] relative'
                          : isExclusive
                            ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FAF3E3]/60 text-stone-800 border-2 border-[#B68D40]/70 shadow-md'
                            : 'bg-white text-stone-800 border border-[#D4AF37]/35 shadow-xs'
                      }`}
                    >
                      <div className="space-y-4 min-w-0">
                        {/* Package Badge */}
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              isRoyal
                                ? 'bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 shadow-2xs'
                                : isExclusive
                                  ? 'bg-stone-900 text-[#D4AF37]'
                                  : 'bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40'
                            }`}
                          >
                            {pkg.badge}
                          </span>
                        </div>

                        {/* Title & Strictly Separated Pricing Block */}
                        <div className="min-w-0">
                          <h4
                            className={`font-serif text-xl font-extrabold ${
                              isRoyal ? 'text-white' : 'text-stone-900'
                            }`}
                          >
                            {pkg.name}
                          </h4>

                          <div className="mt-3 pt-3 border-t border-[#D4AF37]/25">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span
                                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                                  isRoyal
                                    ? 'text-[#E6C76B]'
                                    : isExclusive
                                      ? 'text-[#8B6914]'
                                      : 'text-stone-900'
                                }`}
                              >
                                {pkg.priceMain}
                              </span>
                              <span className="text-xs font-bold line-through text-stone-400">
                                {pkg.priceStrike}
                              </span>
                            </div>
                            <div className="mt-1.5">
                              <span
                                className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-lg ${
                                  isRoyal
                                    ? 'bg-white/10 text-[#FAF3E3] border border-[#D4AF37]/40'
                                    : 'bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/30'
                                }`}
                              >
                                {pkg.priceSubBadge}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Features List */}
                        <ul className="space-y-2.5 text-xs pt-1">
                          {pkg.features.map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  isRoyal
                                    ? 'text-[#D4AF37]'
                                    : isExclusive
                                      ? 'text-[#B68D40]'
                                      : 'text-emerald-600'
                                }`}
                              />
                              <span
                                className={
                                  isRoyal
                                    ? 'text-[#E8DFD1] font-medium'
                                    : 'text-stone-700'
                                }
                              >
                                {f}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTA Button: Opens Dedicated Separate Checkout Page */}
                      <div className="pt-6 mt-6 border-t border-[#D4AF37]/25 min-w-0">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectPackageForCheckout(pkg.tier)
                          }
                          className={`w-full max-w-full py-3.5 px-4 rounded-2xl font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all ${
                            isRoyal
                              ? 'bg-gradient-to-r from-[#D4AF37] via-[#E6C76B] to-[#B68D40] text-stone-950 hover:from-[#C5A059] hover:to-[#9A742B] shadow-md'
                              : isExclusive
                                ? 'bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] border border-[#D4AF37]/45'
                                : 'bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border border-[#D4AF37]/45'
                          }`}
                        >
                          <Wallet className="w-4 h-4 shrink-0" />
                          <span className="truncate">
                            {lang === 'ID'
                              ? `Pilih Paket ${pkg.tier} & Bayar`
                              : `Select ${pkg.tier} & Checkout`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>

      {/* FULLSCREEN SCREENSHOT LIGHTBOX MODAL */}
      {lightboxScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxScreenshot(null)}
        >
          <div
            className="w-full max-w-6xl max-h-[92vh] rounded-3xl bg-stone-950 border border-[#D4AF37]/50 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-stone-900 border-b border-[#D4AF37]/35 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/45 text-[#E6C76B] font-mono text-[10px] font-extrabold whitespace-nowrap">
                  {lightboxScreenshot.badge}
                </span>
                <h4 className="font-serif text-sm sm:text-base font-extrabold text-[#FAF3E3] truncate">
                  {lightboxScreenshot.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openLightboxAt(activeShowcaseIdx - 1)}
                  title={
                    lang === 'ID'
                      ? 'Screenshot Sebelumnya'
                      : 'Previous Screenshot'
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF3E3] border border-white/15 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {lang === 'ID' ? 'Sebelumnya' : 'Prev'}
                  </span>
                </button>
                <span className="text-xs font-mono font-bold text-[#E6C76B] px-1">
                  {activeShowcaseIdx + 1} / {OFFICIAL_PRODUCT_SCREENSHOTS.length}
                </span>
                <button
                  type="button"
                  onClick={() => openLightboxAt(activeShowcaseIdx + 1)}
                  title={
                    lang === 'ID' ? 'Screenshot Berikutnya' : 'Next Screenshot'
                  }
                  className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF3E3] border border-white/15 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap transition-all"
                >
                  <span className="hidden sm:inline">
                    {lang === 'ID' ? 'Berikutnya' : 'Next'}
                  </span>
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setLightboxScreenshot(null)}
                  title={
                    lang === 'ID' ? 'Tutup Layar Penuh' : 'Close Fullscreen'
                  }
                  className="ml-1 px-3 py-1.5 rounded-xl bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-extrabold inline-flex items-center gap-1 whitespace-nowrap transition-all"
                >
                  <X className="w-4 h-4" />
                  <span>{lang === 'ID' ? 'Tutup' : 'Close'}</span>
                </button>
              </div>
            </div>

            {/* High-Res Image Body */}
            <div className="flex-1 overflow-auto bg-black flex items-center justify-center p-2 sm:p-4">
              <img
                src={lightboxScreenshot.imageUrl}
                alt={lightboxScreenshot.title}
                className="max-w-full max-h-[74vh] w-auto h-auto object-contain rounded-xl border border-stone-800 shadow-lg"
              />
            </div>

            {/* Modal Footer Caption */}
            <div className="px-4 sm:px-6 py-3 bg-stone-900 border-t border-[#D4AF37]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <p className="text-xs text-stone-300 leading-relaxed">
                {lightboxScreenshot.desc}
              </p>
              <div className="flex items-center gap-1.5 shrink-0">
                {OFFICIAL_PRODUCT_SCREENSHOTS.map((s, idx) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openLightboxAt(idx)}
                    title={lang === 'ID' ? s.titleId : s.titleEn}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-extrabold whitespace-nowrap transition-all ${
                      activeShowcaseIdx === idx
                        ? 'bg-[#D4AF37] text-stone-950'
                        : 'bg-white/10 text-stone-300 hover:bg-white/20'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OFFICIAL FOOTER CREDIT & CONTACT US (With Subtle Commercial SaaS Suite Badge; Post-Payment Email Only Shown If Unlocked) */}
      <footer className="bg-white border-t border-[#D4AF37]/35 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center shrink-0">
              <WeddingRingsIcon
                className="w-8 h-8"
                logoUrl={(primarySettings as any).brandLogoUrl}
              />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <p className="text-xs sm:text-sm font-extrabold text-stone-900">
                  MEPlan — My Event Planner by{' '}
                  <a
                    href={developerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B6914] hover:text-[#B68D40] underline decoration-[#D4AF37]/60 underline-offset-2"
                  >
                    omeko42
                  </a>{' '}
                  &copy; 2026
                </p>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/35 text-[#8B6914] text-[10px] font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>
                    Commercial SaaS &amp; All-in-One Multi-Event Planner Suite
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {lang === 'ID'
                  ? 'Platform Multi-Event Readiness Tracker & Undangan Digital Interaktif (Wedding, Birthday, Graduation, Rapat & Gala Dinner)'
                  : 'Multi-Event Readiness Tracker & Interactive Digital Invitation Platform (Wedding, Birthday, Graduation, Corporate & Gala Dinner)'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#8B6914]">
              {lang === 'ID' ? 'Hubungi Kami:' : 'Contact Us:'}
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Hubungi Kontak WA My Event Planner (${rawWa})`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-stone-900 text-xs font-bold transition-all"
            >
              <svg
                className="w-3.5 h-3.5 text-[#8B6914]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              <span>{lang === 'ID' ? 'Kontak WA' : 'WhatsApp'}</span>
            </a>

            {hasCompletedPayment && (
              <a
                href={mailtoPostPaymentUrl}
                title={
                  lang === 'ID'
                    ? `Email Prioritas Pasca-Pembayaran (${businessEmail})`
                    : `Post-Payment Priority Email (${businessEmail})`
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] border border-[#D4AF37]/45 text-xs font-bold transition-all shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />
                <span>{businessEmail}</span>
              </a>
            )}

            <a
              href="https://www.linkedin.com/in/eko-agung-krisdianto-408955130"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-bold transition-all shadow-2xs"
            >
              <svg
                className="w-3.5 h-3.5 fill-current"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
              <span>Eko Agung Krisdianto</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
