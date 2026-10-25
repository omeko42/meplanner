'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  ChevronDown,
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
  GuestWish,
  InvitationThemePresetId,
  RsvpStatus,
  WeddingGuest,
  WeddingSettings,
} from '@/types';
import { DEFAULT_COMMERCIAL_PAYMENT_CHANNELS } from '@/data/seedData';
import {
  computeGuestInvitationHash,
  resolveGuestByHashTokenAcrossWorkspaces,
} from '@/lib/guestTokenHash';
import {
  SHOWCASE_DUMMY_CLIENT_METAS,
  getShowcaseDummyClientState,
  ShowcasePackageTier,
} from '@/data/showcaseDummyClients';
import { PublicInvitationView } from '@/components/PublicInvitationView';

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

interface SimulationScheduleSession {
  badge: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  dresscode: string;
  mapsUrl: string;
}

interface SimulationMilestoneItem {
  year: string;
  title: string;
  desc: string;
}

interface SimulationGalleryPhoto {
  url: string;
  caption: string;
}

interface SimulationGuestWish {
  id: string;
  senderName: string;
  senderTitle: string;
  attendanceBadge: string;
  message: string;
  timestamp: string;
  hostReply?: string;
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
  sessions: [SimulationScheduleSession, SimulationScheduleSession];
  milestones: [
    SimulationMilestoneItem,
    SimulationMilestoneItem,
    SimulationMilestoneItem,
  ];
  galleryPhotos: [
    SimulationGalleryPhoto,
    SimulationGalleryPhoto,
    SimulationGalleryPhoto,
  ];
  dummyWishes: SimulationGuestWish[];
}

const DUMMY_ENVELOPE_CHANNELS = [
  {
    id: 'bca',
    label: 'Bank BCA',
    provider: 'Bank Central Asia (BCA Prioritas)',
    accountNumber: '8820 4591 2026',
    badge: 'Transfer Bank Instan',
  },
  {
    id: 'qris',
    label: 'QRIS Nasional',
    provider: 'QRIS Merchant Resmi • NMID ID2026008820',
    accountNumber: 'NMID-ID2026-8820-MEP',
    badge: 'Bebas Biaya Admin',
  },
  {
    id: 'usdt',
    label: 'Crypto USDT TRC20',
    provider: 'Tether USD (TRON Network TRC20)',
    accountNumber: 'TX9k8mQ2vR7pL4nW6yB3cH1jF5dG8sK2mP',
    badge: 'Web3 On-Chain',
  },
  {
    id: 'paypal',
    label: 'PayPal Global',
    provider: 'PayPal International Express',
    accountNumber: 'paypal.me/meplanner-vip-2026',
    badge: 'USD / Multi-Currency',
  },
] as const;

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
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    profileCount: 2,
    frameStyle: 'ARCH_DOME',
    showFloral: true,
    host1: {
      name: 'AKP Rayhan Dirgantara, S.Tr.K., S.I.K.',
      role: 'Mempelai Pria',
      parents: 'Putra dari Bapak Ir. H. Baskoro & Ibu Hj. Ratna Sari',
      photo:
        'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1400&q=85',
    },
    host2: {
      name: 'dr. Clarissa Aurelia, Sp.DV',
      role: 'Mempelai Wanita',
      parents: 'Putri dari Bapak Prof. Dr. Hendra Wijaya & Ibu Dra. Sylvia',
      photo:
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85',
    },
    eventTitle: 'Pemberkatan & Grand Resepsi',
    eventDate: 'Sabtu, 24 Oktober 2026 • 18.30 WIB',
    eventVenue: 'Grand Ballroom Hotel Mulia Senayan, Jakarta',
    musicTrackLabel: 'Romantic Strings Serenade (Royalty-Free Preview)',
    sessions: [
      {
        badge: 'SESI 1 • AKAD / PEMBERKATAN',
        title: 'Upacara Pemberkatan Nikah Kudus',
        date: 'Sabtu, 24 Oktober 2026',
        time: '09.00 – 11.00 WIB',
        venue: 'Sanctuary Chapel & Heritage Hall, Jakarta Pusat',
        dresscode: 'Formal Putih Gading & Champagne Gold',
        mapsUrl: 'https://maps.google.com/?q=Hotel+Mulia+Senayan+Jakarta',
      },
      {
        badge: 'SESI 2 • GRAND RESEPSI VIP',
        title: 'Pedang Pora & Grand Ballroom Reception',
        date: 'Sabtu, 24 Oktober 2026',
        time: '18.30 – 21.30 WIB',
        venue: 'Grand Ballroom Hotel Mulia Senayan, Jakarta',
        dresscode: 'PDU / Black Tie / Kebaya & Batik Tulis Eksklusif',
        mapsUrl: 'https://maps.google.com/?q=Hotel+Mulia+Senayan+Jakarta',
      },
    ],
    milestones: [
      {
        year: '2022',
        title: 'Pertemuan Pertama',
        desc: 'Berawal dari penugasan kolaborasi bakti kesehatan dan kemanusiaan di Jakarta.',
      },
      {
        year: '2025',
        title: 'Pertunangan & Lamaran Resmi',
        desc: 'Pengikatan janji suci di hadapan kedua keluarga besar dengan restu penuh.',
      },
      {
        year: '2026',
        title: 'Ikatan Suci Pernikahan',
        desc: 'Melangkah bersama memulai bahtera rumah tangga pada 24 Oktober 2026.',
      },
    ],
    galleryPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
        caption: 'The Royal Ballroom Editorial Portrait — Rayhan & Clarissa',
      },
      {
        url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85',
        caption: 'Golden Hour Vows &Sacred Rings Ceremony',
      },
      {
        url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
        caption: 'Classic Heritage Garden Prewedding Suite',
      },
    ],
    dummyWishes: [
      {
        id: 'w-wed-1',
        senderName: 'Komjen Pol (Purn.) Drs. H. Hendra Wijaya',
        senderTitle: 'Tamu Kehormatan VVIP',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Selamat menempuh hidup baru untuk AKP Rayhan & dr. Clarissa. Semoga menjadi keluarga yang rukun, penuh berkat, dan selalu menjadi teladan.',
        timestamp: 'Baru saja',
        hostReply:
          'Terima kasih banyak Bapak Jenderal beserta Ibu atas doa restu dan kehadirannya.',
      },
      {
        id: 'w-wed-2',
        senderName: 'Prof. Dr. dr. Setyo Wibowo, Sp.PD-KGEH',
        senderTitle: 'Kolega RSUPN Dr. Cipto Mangunkusumo',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Selamat berbahagia dr. Clarissa & AKP Rayhan! Semoga cinta kasih selalu menyertai perjalanan rumah tangga kalian.',
        timestamp: '14 menit lalu',
        hostReply:
          'Terima kasih banyak Prof. Setyo atas doa terbaiknya untuk kami berdua.',
      },
      {
        id: 'w-wed-3',
        senderName: 'Kombes Pol Aditya Pratama, S.I.K., M.Si.',
        senderTitle: 'Rekan Senior Batalyon Akpol',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Lancar jaya sampai hari H Komandan Rayhan & dr. Clarissa! Kami beserta keluarga siap hadir di Grand Ballroom Mulia.',
        timestamp: '38 menit lalu',
      },
    ],
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
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    profileCount: 1,
    frameStyle: 'CIRCLE',
    showFloral: true,
    host1: {
      name: 'Aurelia Maharani Putri',
      role: 'The Celebrant • Sweet 17th',
      parents: 'Putri Tercinta dari Bapak Pratama & Ibu Indah',
      photo:
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=85',
    },
    eventTitle: 'Birthday Dinner & Candle Ceremony',
    eventDate: 'Minggu, 15 November 2026 • 19.00 WIB',
    eventVenue: 'The Glasshouse Rooftop Lounge, Surabaya',
    musicTrackLabel: 'Champagne Waltz & Acoustic Piano',
    sessions: [
      {
        badge: 'SESI 1 • WELCOME MOCKTAIL & PHOTO',
        title: 'Red Carpet Arrival & Sunset Rooftop Session',
        date: 'Minggu, 15 November 2026',
        time: '17.30 – 18.45 WIB',
        venue: 'Sky Foyer The Glasshouse, Surabaya',
        dresscode: 'Champagne Gold & Pastel Glam Attire',
        mapsUrl: 'https://maps.google.com/?q=Surabaya+Rooftop+Lounge',
      },
      {
        badge: 'SESI 2 • 17 CANDLES & GALA DINNER',
        title: 'Sweet 17th Candle Ceremony & Fine Dining',
        date: 'Minggu, 15 November 2026',
        time: '19.00 – 22.00 WIB',
        venue: 'The Glasshouse Rooftop Lounge, Surabaya',
        dresscode: 'Evening Gown & Smart Tailored Suit',
        mapsUrl: 'https://maps.google.com/?q=Surabaya+Rooftop+Lounge',
      },
    ],
    milestones: [
      {
        year: '2009',
        title: 'Kelahiran Penuh Sukacita',
        desc: 'Kelahiran Aurelia yang membawa kebahagiaan di tengah keluarga besar.',
      },
      {
        year: '2023',
        title: 'Penghargaan Musik & Akademik',
        desc: 'Meraih juara pertama resital piano klasik dan delegasi olimpiade sains.',
      },
      {
        year: '2026',
        title: 'Sweet Seventeen Soirée',
        desc: 'Merayakan usia ke-17 dengan penuh syukur bersama keluarga dan sahabat.',
      },
    ],
    galleryPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
        caption: 'Sweet 17th Editorial Spotlight — Aurelia Putri',
      },
      {
        url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=85',
        caption: 'Golden Confetti & 17 Candles Wish Ceremony',
      },
      {
        url: 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1400&q=85',
        caption: 'The Glasshouse Rooftop Soirée Ambience',
      },
    ],
    dummyWishes: [
      {
        id: 'w-bday-1',
        senderName: 'Keluarga Besar Ir. H. Darmawan',
        senderTitle: 'Keluarga Inti VIP',
        attendanceBadge: 'Hadir • 4 Pax',
        message:
          'Happy Sweet 17th Aurelia sayang! Semoga semakin sukses, sehat, dan selalu membanggakan Papa & Mama.',
        timestamp: '5 menit lalu',
        hostReply:
          'Terima kasih banyak Om & Tante atas doa dan kehadirannya!',
      },
      {
        id: 'w-bday-2',
        senderName: 'Michelle & Sahabat St. Louis',
        senderTitle: 'Best Friends Table',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Happy 17th Birthday Aurel!! Can’t wait to celebrate tonight at The Glasshouse!',
        timestamp: '19 menit lalu',
        hostReply: 'Thank you bestie! See you at the rooftop lounge!',
      },
      {
        id: 'w-bday-3',
        senderName: 'drg. Karina Putri & Partner',
        senderTitle: 'Tamu VIP',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Selamat ulang tahun ke-17 Aurelia. Semoga segala cita-cita muliamu tercapai.',
        timestamp: '42 menit lalu',
      },
    ],
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
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=85',
    profileCount: 1,
    frameStyle: 'ARCH_DOME',
    showFloral: false,
    host1: {
      name: 'dr. Kevin Pratama, S.Ked.',
      role: 'Wisudawan • Cum Laude',
      parents: 'Putra dari Bapak Drs. Santoso & Ibu Dewi',
      photo:
        'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1400&q=85',
    },
    eventTitle: 'Tasyakuran Kelulusan & Ramah Tamah',
    eventDate: 'Sabtu, 28 November 2026 • 12.00 WIB',
    eventVenue: 'Padma Hotel Grand Ballroom, Semarang',
    musicTrackLabel: 'Grand Academic Orchestra Suite',
    sessions: [
      {
        badge: 'SESI 1 • PROSESI SUMPAH DOKTER',
        title: 'Sidang Terbuka Senat & Pelantikan Dokter',
        date: 'Sabtu, 28 November 2026',
        time: '08.00 – 11.00 WIB',
        venue: 'Auditorium Utama Fakultas Kedokteran, Semarang',
        dresscode: 'Toga Akademik / Pakaian Sipil Lengkap (PSL)',
        mapsUrl: 'https://maps.google.com/?q=Padma+Hotel+Semarang',
      },
      {
        badge: 'SESI 2 • TASYAKURAN & JAMUAN VIP',
        title: 'Syukuran Kelulusan & Ramah Tamah Keluarga',
        date: 'Sabtu, 28 November 2026',
        time: '12.00 – 15.00 WIB',
        venue: 'Padma Hotel Grand Ballroom, Semarang',
        dresscode: 'Batik Tulis Lengan Panjang / Smart Formal',
        mapsUrl: 'https://maps.google.com/?q=Padma+Hotel+Semarang',
      },
    ],
    milestones: [
      {
        year: '2020',
        title: 'Awal Studi Kedokteran',
        desc: 'Memulai pendidikan sarjana kedokteran dengan komitmen akademik penuh.',
      },
      {
        year: '2024',
        title: 'Kepaniteraan Klinik (Koas)',
        desc: 'Menyelesaikan rotasi klinik di rumah sakit pendidikan utama.',
      },
      {
        year: '2026',
        title: 'Sumpah Dokter • Cum Laude',
        desc: 'Resmi dilantik sebagai dokter dengan predikat kehormatan Cum Laude.',
      },
    ],
    galleryPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=85',
        caption: 'Grand Convocation & Medical Oath Ceremony',
      },
      {
        url: 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
        caption: 'Cum Laude Academic Portrait — dr. Kevin Pratama',
      },
      {
        url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85',
        caption: 'Family Tribute & Colleagues Celebration',
      },
    ],
    dummyWishes: [
      {
        id: 'w-grad-1',
        senderName: 'Prof. Dr. dr. Bambang Wibisono, Sp.B',
        senderTitle: 'Dekan & Guru Besar',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Selamat atas pelantikan dr. Kevin Pratama dengan predikat Cum Laude. Selamat mengabdi bagi masyarakat dan kemanusiaan.',
        timestamp: '8 menit lalu',
        hostReply:
          'Terima kasih sebesar-besarnya Prof. Bambang atas bimbingan selama masa studi.',
      },
      {
        id: 'w-grad-2',
        senderName: 'dr. Raka Aditama & Rekan Sejawat',
        senderTitle: 'Sejawat Dokter Muda',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Selamat Bro dr. Kevin! Perjuangan koas terbayar lunas hari ini. Sampai jumpa di Padma Ballroom!',
        timestamp: '22 menit lalu',
        hostReply: 'Siap dr. Raka! Terima kasih perjuangan barengnya!',
      },
      {
        id: 'w-grad-3',
        senderName: 'Keluarga Besar Bapak H. Nugroho',
        senderTitle: 'Keluarga Kehormatan',
        attendanceBadge: 'Hadir • 3 Pax',
        message:
          'Turut bersyukur dan bangga atas kelulusan dr. Kevin. Semoga ilmunya selalu membawa keberkahan.',
        timestamp: '45 menit lalu',
      },
    ],
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
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
    profileCount: 1,
    frameStyle: 'EDITORIAL_RECT',
    showFloral: false,
    host1: {
      name: 'Komite Eksekutif & Keynote Speaker',
      role: 'Penyelenggara Utama',
      parents: 'Dewan Transformasi Digital & Mitra Strategis Nasional',
      photo:
        'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=1400&q=85',
    },
    eventTitle: 'Plenary Session & Executive Forum',
    eventDate: 'Kamis, 10 Desember 2026 • 08.30 WIB',
    eventVenue: 'Jakarta International Convention Center (JICC)',
    musicTrackLabel: 'Ambient Executive Lounge Instrumental',
    sessions: [
      {
        badge: 'SESI 1 • REGISTRASI VVIP & PLENARY',
        title: 'Registrasi Delegasi & Keynote Opening Ceremony',
        date: 'Kamis, 10 Desember 2026',
        time: '08.30 – 12.00 WIB',
        venue: 'Assembly Hall JICC Senayan, Jakarta',
        dresscode: 'Pakaian Sipil Lengkap (PSL) / Jas Formal Gelap',
        mapsUrl: 'https://maps.google.com/?q=JICC+Senayan+Jakarta',
      },
      {
        badge: 'SESI 2 • SIDANG KOMISI & MOU SIGNING',
        title: 'Executive Forum & Penandatanganan Pakta Integritas',
        date: 'Kamis, 10 Desember 2026',
        time: '13.30 – 17.00 WIB',
        venue: 'Summit Room JICC Senayan, Jakarta',
        dresscode: 'Executive Business Attire / Batik Resmi Lengan Panjang',
        mapsUrl: 'https://maps.google.com/?q=JICC+Senayan+Jakarta',
      },
    ],
    milestones: [
      {
        year: 'Q1 2026',
        title: 'Perumusan Cetak Biru Nasional',
        desc: 'Penyusunan arsitektur tata kelola digital terpadu lintas instansi.',
      },
      {
        year: 'Q3 2026',
        title: 'Integrasi & Audit Keamanan Cloud',
        desc: 'Standardisasi enkripsi data dan kesiapan infrastruktur di 38 provinsi.',
      },
      {
        year: 'Q4 2026',
        title: 'Rakornas & Peluncuran Ekosistem',
        desc: 'Konsolidasi pimpinan nasional pada 10 Desember 2026 di JICC Senayan.',
      },
    ],
    galleryPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
        caption: 'Main Plenary Hall & Keynote Stage — JICC Senayan',
      },
      {
        url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85',
        caption: 'Executive Delegation & Strategic Panel Session',
      },
      {
        url: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1400&q=85',
        caption: 'National Digital Transformation MoU Signing',
      },
    ],
    dummyWishes: [
      {
        id: 'w-meet-1',
        senderName: 'Dr. Ir. H. Prasetyo Hadi, M.Eng.',
        senderTitle: 'Staf Ahli Utama Kementerian',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Konfirmasi hadir pada sesi Plenary & Penandatanganan MoU. Apresiasi tinggi atas sistem registrasi digital yang sangat rapi.',
        timestamp: '10 menit lalu',
        hostReply:
          'Terima kasih Bapak Dr. Prasetyo. Kursi VVIP Baris A-01 telah disiapkan oleh tim protokol.',
      },
      {
        id: 'w-meet-2',
        senderName: 'Direksi PT Nusantara Cloud Mandiri',
        senderTitle: 'Mitra Strategis Utama',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Kami siap hadir mendukung penuh kesuksesan Rakornas Transformasi Digital 2026.',
        timestamp: '28 menit lalu',
        hostReply: 'Terima kasih kepada jajaran Direksi atas dukungannya.',
      },
      {
        id: 'w-meet-3',
        senderName: 'Sekretariat Daerah Provinsi Jawa Timur',
        senderTitle: 'Delegasi Provinsi',
        attendanceBadge: 'Hadir • 3 Pax',
        message:
          'Delegasi Pemprov Jatim telah tiba di Jakarta dan siap menghadiri seluruh rangkaian sidang komisi.',
        timestamp: '1 jam lalu',
      },
    ],
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
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
    profileCount: 1,
    frameStyle: 'EDITORIAL_RECT',
    showFloral: false,
    host1: {
      name: 'Board of Directors & VIP Hosts',
      role: 'Tuan Rumah Kehormatan',
      parents: 'Royal Sapphire Enterprise & Executive Philanthropy Council',
      photo:
        'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=1400&q=85',
    },
    eventTitle: 'Red Carpet, Fine Dining & Awarding Night',
    eventDate: 'Jumat, 18 Desember 2026 • 19.00 WIB',
    eventVenue: 'The Ritz-Carlton Pacific Place Ballroom, Jakarta',
    musicTrackLabel: 'Luxury Jazz & Velvet Evening Quartet',
    sessions: [
      {
        badge: 'SESI 1 • RED CARPET & CHAMPAGNE LOUNGE',
        title: 'VVIP Arrival, Red Carpet & Symphony Aperitif',
        date: 'Jumat, 18 Desember 2026',
        time: '18.00 – 19.00 WIB',
        venue: 'Grand Foyer The Ritz-Carlton Pacific Place, Jakarta',
        dresscode: 'Black Tie / Luxury Evening Gown',
        mapsUrl: 'https://maps.google.com/?q=Ritz+Carlton+Pacific+Place+Jakarta',
      },
      {
        badge: 'SESI 2 • 5-COURSE ROYAL GALA & AWARDING',
        title: 'Fine Dining, Charity Auction & Appreciation Night',
        date: 'Jumat, 18 Desember 2026',
        time: '19.00 – 22.30 WIB',
        venue: 'The Ritz-Carlton Grand Ballroom, Jakarta',
        dresscode: 'Black Tie & Royal Sapphire Accent',
        mapsUrl: 'https://maps.google.com/?q=Ritz+Carlton+Pacific+Place+Jakarta',
      },
    ],
    milestones: [
      {
        year: '2016',
        title: 'Inisiasi Royal Sapphire Council',
        desc: 'Berdirinya forum kemitraan strategis dan filantropi korporasi.',
      },
      {
        year: '2021',
        title: 'Satu Dekade Kolaborasi Regional',
        desc: 'Memperluas jejaring investasi berkelanjutan di Asia Tenggara.',
      },
      {
        year: '2026',
        title: 'Annual Appreciation Gala 2026',
        desc: 'Malam penganugerahan tertinggi bagi 180 pemimpin & mitra kehormatan.',
      },
    ],
    galleryPhotos: [
      {
        url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
        caption: 'The Ritz-Carlton Candlelight Grand Ballroom',
      },
      {
        url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85',
        caption: 'Symphony Orchestra & Royal Sapphire Awarding Stage',
      },
      {
        url: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=85',
        caption: '5-Course Executive Michelin Curated Dining',
      },
    ],
    dummyWishes: [
      {
        id: 'w-gala-1',
        senderName: 'Dato’ Sri Alexander Tan & Madam Evelyn',
        senderTitle: 'VVIP Royal Table 01',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'An honor to attend the Royal Sapphire Annual Gala 2026. Looking forward to a magnificent evening of fellowship.',
        timestamp: '6 menit lalu',
        hostReply:
          'We are deeply honored by your presence, Dato’ Sri & Madam Evelyn.',
      },
      {
        id: 'w-gala-2',
        senderName: 'Komisaris Utama PT Mahakarya Investama',
        senderTitle: 'Platinum Patron',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Selamat atas penyelenggaraan Royal Sapphire Gala 2026. Konfirmasi hadir di Meja VVIP 02.',
        timestamp: '19 menit lalu',
        hostReply:
          'Terima kasih Bapak Komisaris Utama. Tim concierge kami siap menyambut.',
      },
      {
        id: 'w-gala-3',
        senderName: 'dr. Clarissa Aurelia & Partner',
        senderTitle: 'Philanthropy Ambassador',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Sukses untuk malam apresiasi dan lelang amal Royal Sapphire 2026!',
        timestamp: '42 menit lalu',
      },
    ],
  },
};

const SIMULATION_EVENT_KEYS: EventCategoryType[] = [
  'WEDDING',
  'BIRTHDAY',
  'GRADUATION',
  'MEETING',
  'GALA_DINNER',
];

const DUMMY_DASHBOARD_TASKS = [
  {
    id: 'tsk-1',
    phase: 'H-6 Bulan',
    titleId: 'Penetapan Tanggal Utama & Kontrak Grand Ballroom Venue',
    titleEn: 'Lock Primary Event Date & Grand Ballroom Venue Contract',
    category: 'Venue & Catering',
    pic: 'Host Utama',
    priority: 'Utama',
    defaultDone: true,
  },
  {
    id: 'tsk-2',
    phase: 'H-3 Bulan',
    titleId: 'Finalisasi Berkas Administrasi, Perizinan & Katering VIP 400 Pax',
    titleEn: 'Finalize Permits, Administration & 400 Pax VIP Catering',
    category: 'Administrasi & VIP',
    pic: 'EO / Panitia',
    priority: 'Prioritas Tinggi',
    defaultDone: true,
  },
  {
    id: 'tsk-3',
    phase: 'H-3 Bulan',
    titleId: 'Kurasi Tema Dekorasi Floral, Lighting & Sesi Foto/Video HD',
    titleEn: 'Curate Floral Decor, Architectural Lighting & HD Photo/Video',
    category: 'Dekorasi & Dokumentasi',
    pic: 'EO / Panitia',
    priority: 'Prioritas Tinggi',
    defaultDone: true,
  },
  {
    id: 'tsk-4',
    phase: 'H-1 Bulan',
    titleId: 'Validasi Kuota 180 Undangan VIP (410 Pax) & Distribusi Blast WA',
    titleEn: 'Validate 180 VIP Invitations (410 Pax) & 1-Click WA Blast',
    category: 'CRM Tamu & WA',
    pic: 'Keluarga',
    priority: 'Utama',
    defaultDone: true,
  },
  {
    id: 'tsk-5',
    phase: 'H-1 Bulan',
    titleId: 'Gladi Kotor, Pelunasan Vendor Dekorasi & Konfirmasi Kursi VVIP',
    titleEn: 'Technical Rehearsal, Decor Balance Settlement & VVIP Seating',
    category: 'Operasional',
    pic: 'EO / Panitia',
    priority: 'Prioritas Tinggi',
    defaultDone: false,
  },
  {
    id: 'tsk-6',
    phase: 'Hari-H',
    titleId: 'Briefing Protokol Sambutan VVIP, QR Gate Check-In & Dokumentasi Live',
    titleEn: 'VVIP Protocol Briefing, QR Gate Check-In & Live Documentation',
    category: 'Eksekusi Hari-H',
    pic: 'EO / Panitia',
    priority: 'Utama',
    defaultDone: false,
  },
] as const;

const DUMMY_DASHBOARD_VENDORS = [
  {
    id: 'vnd-1',
    name: 'Grand Ballroom & Executive Venue',
    category: 'Venue Utama',
    pagu: 'Rp 65.000.000',
    realisasi: 'Rp 60.000.000',
    terbayar: 'Rp 60.000.000',
    sisa: 'Rp 0',
    status: 'LUNAS' as const,
  },
  {
    id: 'vnd-2',
    name: 'Katering Eksklusif 400 Pax & VIP Stall',
    category: 'F&B Banquet',
    pagu: 'Rp 45.000.000',
    realisasi: 'Rp 42.500.000',
    terbayar: 'Rp 30.000.000',
    sisa: 'Rp 12.500.000',
    status: 'DP TERBAYAR' as const,
  },
  {
    id: 'vnd-3',
    name: 'Dekorasi Floral & Architectural Lighting',
    category: 'Dekorasi & Stage',
    pagu: 'Rp 25.000.000',
    realisasi: 'Rp 22.000.000',
    terbayar: 'Rp 12.000.000',
    sisa: 'Rp 10.000.000',
    status: 'DP TERBAYAR' as const,
  },
  {
    id: 'vnd-4',
    name: 'Dokumentasi Cinema 4K & Editorial Photo',
    category: 'Foto & Video',
    pagu: 'Rp 15.000.000',
    realisasi: 'Rp 14.500.000',
    terbayar: 'Rp 14.500.000',
    sisa: 'Rp 0',
    status: 'LUNAS' as const,
  },
  {
    id: 'vnd-5',
    name: 'Orchestra Entertainment & Sound System',
    category: 'Musik & Audio',
    pagu: 'Rp 10.000.000',
    realisasi: 'Rp 9.500.000',
    terbayar: 'Rp 2.000.000',
    sisa: 'Rp 7.500.000',
    status: 'DP TERBAYAR' as const,
  },
] as const;

const DUMMY_DASHBOARD_GUESTS = [
  {
    code: 'JHi4b3XgT2RQIDhZ9coLw',
    name: 'Komjen Pol (Purn.) Drs. H. Hendra Wijaya beserta Keluarga',
    institution: 'Tamu Kehormatan VVIP',
    priority: 'P1 - VIP',
    format: 'Cetak + Online',
    pax: 4,
    rsvp: 'Hadir (4 Pax)',
    phone: '0811-8800-001',
  },
  {
    code: 'K9m2pL7vR4xQ8nW3yB6cH',
    name: 'Prof. Dr. dr. Clarissa Wijaya, Sp.GK. & Partner',
    institution: 'Dewan Guru Besar Kedokteran',
    priority: 'P1 - VIP',
    format: 'Online Link',
    pax: 2,
    rsvp: 'Hadir (2 Pax)',
    phone: '0812-9900-002',
  },
  {
    code: 'M4n8rT1kZ5vB9qP2wX7jD',
    name: 'Kombes Pol Aditya Pratama, S.I.K., M.Si.',
    institution: 'Rekan Kehormatan & Keluarga',
    priority: 'P1 - VIP',
    format: 'Online Link',
    pax: 2,
    rsvp: 'Hadir (2 Pax)',
    phone: '0813-7700-003',
  },
  {
    code: 'P7q3wY6mN9cX2bV5kL8rF',
    name: 'Jajaran Direksi PT Mahakarya Nusantara Mandiri',
    institution: 'Mitra Strategis Eksekutif',
    priority: 'P1 - VIP',
    format: 'Cetak Tebal',
    pax: 4,
    rsvp: 'Menunggu Konfirmasi',
    phone: '0815-6600-004',
  },
  {
    code: 'R2t6yU9pL3kM7nB4vC8xZ',
    name: 'dr. Raka Aditama, Sp.JP (K) beserta Keluarga',
    institution: 'Kolega Rumah Sakit Pusat',
    priority: 'P2 - Kolega',
    format: 'Online Link',
    pax: 3,
    rsvp: 'Hadir (3 Pax)',
    phone: '0816-5500-005',
  },
] as const;

const OFFICIAL_PRODUCT_SCREENSHOTS = [
  {
    id: 'tracker',
    tabId: '1. Tracker',
    tabEn: '1. Tracker',
    badge: 'MODUL 1 • EXECUTIVE TRACKER',
    titleId: 'Executive Readiness Tracker & Countdown Multi-Acara',
    titleEn: 'Executive Readiness Tracker & Multi-Event Countdown',
    descId:
      'Pantau hitung mundur hari/jam/menit/detik tiap sesi acara, persentase kesiapan 92%, ringkasan moneter, dan statistik kehadiran tamu secara real-time.',
    descEn:
      'Monitor live countdowns across event sessions, 92% readiness score, budget overview, and guest attendance in real time.',
    kpiSummary: '92% Siap • 23/25 Tugas • 410 Pax',
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
      'Kelola daftar tugas dan dokumen penting berdasarkan fase waktu (H-6 Bulan s/d Hari-H), status interaktif, serta pembagian PIC tim/keluarga.',
    descEn:
      'Organize critical tasks and documents by timeline phase, interactive status checkboxes, and PIC assignment.',
    kpiSummary: '4 Fase • Filter PIC • Toggle Status Live',
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
      'Kontrol target pagu Rp 160 Jt, realisasi kontrak Rp 148,5 Jt, DP terbayar Rp 118,5 Jt, hingga sisa pelunasan Rp 30 Jt secara transparan.',
    descEn:
      'Control target budget caps, actual vendor contracts, paid deposits, and remaining balances transparently.',
    kpiSummary: 'Pagu Rp 160 Jt • Hemat Rp 11,5 Jt • 5 Vendor',
    imageUrl: '/showcase/showcase-3-moneter.png',
  },
  {
    id: 'tamu',
    tabId: '4. Tamu & WA',
    tabEn: '4. Guests & WA',
    badge: 'MODUL 4 • CRM TAMU & BLAST WA',
    titleId: 'CRM Tamu VIP, Kuota Pax & Blast WhatsApp 1-Klik',
    titleEn: 'VIP Guest CRM, Pax Quota & 1-Click WhatsApp Blast',
    descId:
      'Kelola daftar tamu VIP (Cetak & Online), tautan personal tiap tamu, kuota 410 Pax, status RSVP, serta pratinjau pesan WhatsApp personal 1-klik.',
    descEn:
      'Manage VIP guests, personal direct invitation links, 410 Pax quota, RSVP statuses, and 1-click personalized WhatsApp messages.',
    kpiSummary: '180 Undangan • 48 VVIP • Auto-WA Link',
    imageUrl: '/showcase/showcase-4-tamu.png',
  },
  {
    id: 'pengaturan',
    tabId: '5. Studio Undangan',
    tabEn: '5. Invitation Studio',
    badge: 'MODUL 5 • STUDIO UNDANGAN & VIDEO',
    titleId: 'Studio Kustomisasi Konten, 3 Bagian Media & Transisi Slideshow',
    titleEn: 'Custom Invitation Studio, 3 Media Slots & Slideshow Transitions',
    descId:
      'Atur 3 slot media terpisah (Sampul, Hero, Wallpaper Video MP4), toggle ornamen floral/partikel, dan efek transisi slideshow secara instan.',
    descEn:
      'Configure 3 separate media slots (Cover, Hero, MP4 Video Wallpaper), ornament toggles, and slideshow transitions.',
    kpiSummary: '3 Slot Media • Ornamen ON • Slideshow HD',
    imageUrl: '/showcase/showcase-5-pengaturan.png',
  },
] as const;

type WevPackageId =
  | 'GRATIS'
  | 'PREMIUM'
  | 'BUSINESS'
  | 'ENTERPRISE'
  | 'MITRA_SILVER'
  | 'MITRA_GOLD';

type CatalogThemeStyle =
  | 'Minimalis'
  | 'Floral'
  | 'Adat & Budaya'
  | 'Editorial Foto'
  | 'Light Luxury';

type ThemeLayoutArchetype =
  | 'EDITORIAL_CLASSIC'
  | 'POLAROID_MAGAZINE'
  | 'BOTANICAL_AIRY'
  | 'NUSANTARA_HERITAGE'
  | 'MODERN_BENTO';

interface CatalogThemeItem {
  id: string;
  name: string;
  eventType: EventCategoryType;
  dummyClientId: string;
  styleCategory: CatalogThemeStyle;
  layoutArchetype: ThemeLayoutArchetype;
  themePreset:
    | 'champagne_gold'
    | 'sage_botanical'
    | 'blush_rose'
    | 'royal_navy'
    | 'terracotta_rust';
  profileFrameStyle: 'ARCH_DOME' | 'CIRCLE' | 'EDITORIAL_RECT';
  showFloralOrnaments: boolean;
  paletteColors: [string, string, string];
  thumbnailUrl: string;
  heroPrewedUrl: string;
  coverBgUrl: string;
  taglineId: string;
  taglineEn: string;
  tierBadge: string;
}

const MULTI_EVENT_THEME_CATALOG: CatalogThemeItem[] = [
  // =========================================================================
  // 💍 PERNIKAHAN (15 TEMA EKSKLUSIF — KOLEKSI KURASI MEPLANNER)
  // =========================================================================
  {
    id: 'wed-timeless-snapshot',
    name: 'Timeless Snapshot',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Editorial Foto',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: true,
    paletteColors: ['#D4AF37', '#FAF3E3', '#2A2118'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Potret editorial klasik dengan bingkai foto jurnalistik abadi',
    taglineEn: 'Classic editorial portrait with timeless photojournalism frame',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-serein',
    name: 'Serein',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Minimalis',
    layoutArchetype: 'BOTANICAL_AIRY',
    themePreset: 'sage_botanical',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#5E8C6A', '#F4F7F4', '#2C3E35'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Nuansa embun senja yang tenang dengan aksen dedaunan sage lembut',
    taglineEn: 'Serene evening mist aesthetic with soft sage botanical accents',
    tierBadge: 'Gratis / Premium',
  },
  {
    id: 'wed-mildness',
    name: 'Mildness',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Minimalis',
    layoutArchetype: 'BOTANICAL_AIRY',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: false,
    paletteColors: ['#E6C994', '#FFFDF9', '#5C4D3C'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Tipografi bersih nan hangat dengan estetika krem gading minimalis',
    taglineEn: 'Warm clean typography with minimalist ivory cream aesthetic',
    tierBadge: 'Gratis / Premium',
  },
  {
    id: 'wed-snap-photo',
    name: 'Snap Photo',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Editorial Foto',
    layoutArchetype: 'POLAROID_MAGAZINE',
    themePreset: 'blush_rose',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#D88290', '#FDF6F7', '#3D2328'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Kolase polaroid romantis untuk menonjolkan galeri prewedding HD',
    taglineEn: 'Romantic polaroid collage showcasing HD prewedding photography',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-visual-journey',
    name: 'Visual Journey',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Editorial Foto',
    layoutArchetype: 'POLAROID_MAGAZINE',
    themePreset: 'terracotta_rust',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#CC704E', '#FBF5F2', '#3B231A'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Alur cerita cinta sinematik dengan transisi slideshow layar penuh',
    taglineEn: 'Cinematic love story flow with full-bleed slideshow transitions',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-elegant-light',
    name: 'Elegant Light',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Floral',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#D4AF37', '#FFFDF9', '#8B6914'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Kemewahan ballroom terang dengan ornamen sudut bunga emas berkilau',
    taglineEn: 'Luminous ballroom luxury with shimmering gold floral corners',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-espresso',
    name: 'Espresso & Warm Linen',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'POLAROID_MAGAZINE',
    themePreset: 'terracotta_rust',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#8C523A', '#F5EDE4', '#CC704E'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Palet hangat linen krem & perunggu espresso untuk resepsi intim',
    taglineEn: 'Warm linen cream & bronze espresso palette for intimate receptions',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-peppy',
    name: 'Peppy',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Floral',
    layoutArchetype: 'POLAROID_MAGAZINE',
    themePreset: 'blush_rose',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: true,
    paletteColors: ['#E06D85', '#FFEBF0', '#592531'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Nuansa ceria penuh bunga pastel merah muda yang segar dan modern',
    taglineEn: 'Cheerful pastel blush blossoms with a fresh modern vibe',
    tierBadge: 'Gratis / Premium',
  },
  {
    id: 'wed-photovit-black',
    name: 'Photovit: Editorial',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'MODERN_BENTO',
    themePreset: 'royal_navy',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#3B669E', '#F8FAFC', '#D4AF37'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Tata letak majalah mode modern dengan grid Bento bersih & elegan',
    taglineEn: 'High-fashion modern magazine aesthetic with clean Bento grid',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-blubloom',
    name: 'BluBloom',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Floral',
    layoutArchetype: 'BOTANICAL_AIRY',
    themePreset: 'royal_navy',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#3B669E', '#EBF3FA', '#1B355A'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Bunga hydrangea biru langit cerah berpadu kubah arsitektur elegan',
    taglineEn: 'Bright sky blue hydrangea florals paired with elegant arch domes',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-wayang',
    name: 'Wayang Heritage',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Adat & Budaya',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#C5A059', '#F8F1E6', '#8B5A2B'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Filosofi gunungan wayang & ukiran emas keraton yang agung',
    taglineEn: 'Sacred Javanese Wayang Gunungan & royal gold heritage motifs',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-photovit-green',
    name: 'Photovit: Green',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Editorial Foto',
    layoutArchetype: 'MODERN_BENTO',
    themePreset: 'sage_botanical',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: true,
    paletteColors: ['#4A7856', '#EAF2EC', '#1E3323'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1509927083803-4bd519298ac4?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Editorial outdoor garden wedding dengan bingkai zamrud tropis',
    taglineEn: 'Outdoor garden wedding editorial with emerald botanical frames',
    tierBadge: 'Premium',
  },
  {
    id: 'wed-midnight-elegance',
    name: 'Pearl & Ivory Elegance',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    themePreset: 'royal_navy',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#3B669E', '#FFFDF9', '#D4AF37'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Kemegahan mutiara gading & safir terang dengan aksen emas VVIP',
    taglineEn: 'Luminous pearl ivory & sapphire grandeur with VVIP gold accents',
    tierBadge: 'Business / VIP',
  },
  {
    id: 'wed-simple-rustic-3',
    name: 'Simple Rustic #3',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Minimalis',
    layoutArchetype: 'BOTANICAL_AIRY',
    themePreset: 'terracotta_rust',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: true,
    paletteColors: ['#C87D55', '#F5EDE4', '#4A3222'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Sentuhan rustic terracotta & linen krem yang hangat dan bersahaja',
    taglineEn: 'Warm terracotta rustic charm with natural linen cream tones',
    tierBadge: 'Gratis / Premium',
  },
  {
    id: 'wed-culture-javanese',
    name: 'Culture: Javanese',
    eventType: 'WEDDING',
    dummyClientId: 'client-demo-wedding',
    styleCategory: 'Adat & Budaya',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    themePreset: 'terracotta_rust',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#9A5B3E', '#FDF8F0', '#D4AF37'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Keagungan adat Jawa klasik dengan motif batik sogan & gebyok emas',
    taglineEn: 'Noble Javanese heritage with classic sogan batik & gold gebyok',
    tierBadge: 'Premium',
  },

  // =========================================================================
  // 🎂 ULANG TAHUN (4 TEMA SPESIAL)
  // =========================================================================
  {
    id: 'bday-sweet-17-rose',
    name: 'Sweet 17th Rose Soirée',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    styleCategory: 'Floral',
    layoutArchetype: 'BOTANICAL_AIRY',
    themePreset: 'blush_rose',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: true,
    paletteColors: ['#D88290', '#FFF0F3', '#8C3B4A'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Perayaan Sweet Seventeen glamor dengan nuansa mawar merah muda',
    taglineEn: 'Glamorous Sweet Seventeen soirée in blush rose & crystal',
    tierBadge: 'Premium',
  },
  {
    id: 'bday-peppy-confetti',
    name: 'Peppy Confetti Pop',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    styleCategory: 'Editorial Foto',
    layoutArchetype: 'POLAROID_MAGAZINE',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#D4AF37', '#FFF9F0', '#B68D40'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Desain pesta ulang tahun meriah dengan bingkai foto polaroid & confetti',
    taglineEn: 'Festive birthday celebration design with polaroid frames & confetti',
    tierBadge: 'Gratis / Premium',
  },
  {
    id: 'bday-golden-jubilee',
    name: 'Golden Jubilee 50th',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#C5A059', '#FAF3E3', '#8B6914'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Tasyakuran usia emas & milestone keluarga yang hangat dan berwibawa',
    taglineEn: 'Dignified golden milestone & family appreciation celebration',
    tierBadge: 'Premium',
  },
  {
    id: 'bday-botanical-garden',
    name: 'Botanical Garden Party',
    eventType: 'BIRTHDAY',
    dummyClientId: 'client-demo-birthday',
    styleCategory: 'Minimalis',
    layoutArchetype: 'BOTANICAL_AIRY',
    themePreset: 'sage_botanical',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: true,
    paletteColors: ['#5E8C6A', '#F3F8F4', '#2D4734'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Perjamuan ulang tahun outdoor asri di taman kaca tropis',
    taglineEn: 'Lush outdoor glasshouse garden birthday brunch & dinner',
    tierBadge: 'Gratis / Premium',
  },

  // =========================================================================
  // 🎓 WISUDA (4 TEMA AKADEMIK & PELANTIKAN)
  // =========================================================================
  {
    id: 'grad-cum-laude-gold',
    name: 'Cum Laude Academic Gold',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: false,
    paletteColors: ['#D4AF37', '#FAF3E3', '#8B6914'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Tasyakuran kelulusan Cum Laude & Doktor dengan medali emas kehormatan',
    taglineEn: 'Cum Laude & Doctoral convocation tribute with academic gold',
    tierBadge: 'Premium',
  },
  {
    id: 'grad-sumpah-dokter-emerald',
    name: 'Sumpah Dokter Emerald',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    styleCategory: 'Minimalis',
    layoutArchetype: 'MODERN_BENTO',
    themePreset: 'sage_botanical',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#5E8C6A', '#F2F7F4', '#1F3A28'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Khusus pelantikan Sumpah Dokter & Spesialis bernuansa hijau medis',
    taglineEn: 'Tailored for Medical Oath & Specialist inauguration in emerald',
    tierBadge: 'Premium',
  },
  {
    id: 'grad-royal-alma-mater',
    name: 'Royal Alma Mater Navy',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    styleCategory: 'Editorial Foto',
    layoutArchetype: 'MODERN_BENTO',
    themePreset: 'royal_navy',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: false,
    paletteColors: ['#3B669E', '#EBF2FA', '#162844'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Kebanggaan almamater biru navy untuk sidang terbuka & ramah tamah',
    taglineEn: 'Classic alma mater royal navy for convocation & family banquet',
    tierBadge: 'Gratis / Premium',
  },
  {
    id: 'grad-modern-scholar',
    name: 'Modern Scholar Terracotta',
    eventType: 'GRADUATION',
    dummyClientId: 'client-demo-graduation',
    styleCategory: 'Minimalis',
    layoutArchetype: 'POLAROID_MAGAZINE',
    themePreset: 'terracotta_rust',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: false,
    paletteColors: ['#CC704E', '#FDF6F3', '#422217'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1627556704290-2b1f5853ff78?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Gaya editorial hangat bagi wisudawan sarjana, magister & kreatif',
    taglineEn: 'Warm modern editorial style for graduates & young scholars',
    tierBadge: 'Gratis / Premium',
  },

  // =========================================================================
  // 🏛️ RAPAT & KORPORAT (4 TEMA RESMI & EKSEKUTIF)
  // =========================================================================
  {
    id: 'meet-executive-summit',
    name: 'Executive Summit Navy',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    styleCategory: 'Minimalis',
    layoutArchetype: 'MODERN_BENTO',
    themePreset: 'royal_navy',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#3B669E', '#E8F0F8', '#162844'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Undangan Rakornas, RUPS & Forum Direksi berstandar korporasi global',
    taglineEn: 'Corporate summit, AGM & board meeting invitation suite',
    tierBadge: 'Business / VIP',
  },
  {
    id: 'meet-protokol-instansi',
    name: 'Protokol Instansi & Polri',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    styleCategory: 'Adat & Budaya',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: false,
    paletteColors: ['#D4AF37', '#FAF3E3', '#8B6914'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Tata protokol resmi Kementerian, Polri/TNI & pelantikan jabatan',
    taglineEn: 'Official state protocol, Ministry, Police/Military & inauguration',
    tierBadge: 'Business / VIP',
  },
  {
    id: 'meet-green-esg-forum',
    name: 'Green ESG Forum',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    styleCategory: 'Minimalis',
    layoutArchetype: 'BOTANICAL_AIRY',
    themePreset: 'sage_botanical',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#5E8C6A', '#F0F7F2', '#1C3624'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Konferensi keberlanjutan ESG, seminar nasional & ramah lingkungan',
    taglineEn: 'Sustainable ESG conference, green energy forum & symposium',
    tierBadge: 'Premium',
  },
  {
    id: 'meet-tech-keynote',
    name: 'Tech Keynote Modern',
    eventType: 'MEETING',
    dummyClientId: 'client-demo-meeting',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'MODERN_BENTO',
    themePreset: 'royal_navy',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: false,
    paletteColors: ['#3B669E', '#F1F5F9', '#0284C7'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Peluncuran produk teknologi, startup townhall & konferensi inovasi',
    taglineEn: 'Tech product launch, startup townhall & digital innovation keynote',
    tierBadge: 'Premium',
  },

  // =========================================================================
  // 🥂 GALA DINNER (4 TEMA VVIP & PENGHARGAAN)
  // =========================================================================
  {
    id: 'gala-royal-sapphire',
    name: 'Royal Sapphire Gala',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'MODERN_BENTO',
    themePreset: 'royal_navy',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#3B669E', '#F8FAFC', '#D4AF37'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Jamuan malam apresiasi mitra VVIP & filantropi bernuansa safir terang',
    taglineEn: 'VVIP partner appreciation & philanthropy gala in royal sapphire',
    tierBadge: 'Business / VIP',
  },
  {
    id: 'gala-champagne-orchestra',
    name: 'Champagne Gold Orchestra',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    styleCategory: 'Light Luxury',
    layoutArchetype: 'EDITORIAL_CLASSIC',
    themePreset: 'champagne_gold',
    profileFrameStyle: 'ARCH_DOME',
    showFloralOrnaments: true,
    paletteColors: ['#D4AF37', '#FFFDF9', '#8B6914'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Konser simfoni & fine dining dengan kemewahan emas champagne',
    taglineEn: 'Symphony orchestra & 6-course fine dining in champagne gold',
    tierBadge: 'Business / VIP',
  },
  {
    id: 'gala-velvet-red-carpet',
    name: 'Velvet Red Carpet',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    styleCategory: 'Editorial Foto',
    layoutArchetype: 'POLAROID_MAGAZINE',
    themePreset: 'blush_rose',
    profileFrameStyle: 'EDITORIAL_RECT',
    showFloralOrnaments: false,
    paletteColors: ['#D88290', '#FFF5F7', '#8C3B4A'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Malam karpet merah eksklusif, fashion gala & perayaan silver jubilee',
    taglineEn: 'Exclusive red carpet arrival, fashion gala & silver jubilee night',
    tierBadge: 'Premium',
  },
  {
    id: 'gala-starlight-award',
    name: 'Starlight Award Night',
    eventType: 'GALA_DINNER',
    dummyClientId: 'client-demo-gala',
    styleCategory: 'Minimalis',
    layoutArchetype: 'NUSANTARA_HERITAGE',
    themePreset: 'terracotta_rust',
    profileFrameStyle: 'CIRCLE',
    showFloralOrnaments: false,
    paletteColors: ['#CC704E', '#FDF8F4', '#D4AF37'],
    thumbnailUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=900&q=80',
    heroPrewedUrl:
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?auto=format&fit=crop&w=1400&q=85',
    coverBgUrl:
      'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1400&q=85',
    taglineId: 'Malam penganugerahan prestasi tahunan & apresiasi korporasi',
    taglineEn: 'Annual achievement award night & corporate appreciation dinner',
    tierBadge: 'Premium',
  },
];

interface BlogArticleItem {
  id: string;
  category: string;
  readTime: string;
  titleId: string;
  titleEn: string;
  excerptId: string;
  excerptEn: string;
  imageUrl: string;
  highlightsId: string[];
  highlightsEn: string[];
  conclusionId: string;
  conclusionEn: string;
}

const BLOG_ARTICLES: BlogArticleItem[] = [
  {
    id: 'blog-ai-wishes',
    category: 'MEPlanner AI & Inovasi',
    readTime: '4 Menit Baca',
    titleId:
      'Analisis Ucapan & Doa Berbasis AI: Cara MEPlanner AI Merangkum Ratusan Doa Tamu',
    titleEn:
      'AI-Powered Wishes Insight: How MEPlanner AI Summarizes Hundreds of Guest Wishes',
    excerptId:
      'Tak perlu lagi membaca ratusan pesan satu per satu secara manual. Fitur MEPlanner AI merangkum sentimen, doa terpopuler, dan daftar tamu VIP yang perlu dibalas prioritas.',
    excerptEn:
      'No need to manually sift through hundreds of guestbook messages. MEPlanner AI summarizes sentiment, top blessings, and VIP guests needing priority replies.',
    imageUrl:
      'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80',
    highlightsId: [
      'Ringkasan Sentimen Otomatis: Mengelompokkan ucapan doa berdasarkan kategori (Keluarga, Rekan Kerja/Polri, Sahabat, Kolega VIP).',
      'Rekomendasi Balasan Cerdas: Menghasilkan draf balasan sopan dan personal untuk tiap tamu hanya dalam 1 klik.',
      'Audit Moderasi Real-Time: Menyaring komentar spam atau kata tidak pantas secara otomatis sebelum tampil di layar publik.',
      'Sinkronisasi Layar Penerima Tamu: Menampilkan ucapan terpilih secara elegan di layar proyektor ballroom saat Hari-H.',
    ],
    highlightsEn: [
      'Automated Sentiment Summary: Groups wishes by guest relationship (Family, VIP Officials, Colleagues, Friends).',
      'Smart Reply Suggestions: Generates polite, personalized host replies in 1 click.',
      'Real-Time Moderation Audit: Automatically filters spam or inappropriate words before public display.',
      'Live Reception Screen Sync: Displays curated wishes on the ballroom projector during the event.',
    ],
    conclusionId:
      'Fitur AI Wishes Insight & Moderasi tersedia langsung di ekosistem MEPlanner untuk memastikan setiap doa tulus dari tamu Anda mendapatkan apresiasi terbaik.',
    conclusionEn:
      'AI Wishes Insight & Moderation is built right into the MEPlanner ecosystem so every heartfelt blessing is cherished.',
  },
  {
    id: 'blog-85-questions',
    category: 'Persiapan Pernikahan',
    readTime: '6 Menit Baca',
    titleId:
      '85 Pertanyaan Penting Sebelum Menikah untuk Menyatukan Visi Finansial & Keluarga',
    titleEn:
      '85 Essential Questions Before Marriage to Align Financial & Family Visions',
    excerptId:
      'Persiapan pernikahan bukan hanya soal gedung dan katering, tetapi juga menyelaraskan nilai hidup, pengelolaan anggaran rumah tangga, hingga batas peran keluarga besar.',
    excerptEn:
      'Wedding preparation goes beyond venues and catering—it is about aligning life values, household budgets, and extended family boundaries.',
    imageUrl:
      'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80',
    highlightsId: [
      'Visi Finansial & Transparansi: Bagaimana pembagian rekening tabungan, dana darurat, dan batas pagu biaya resepsi agar bebas utang?',
      'Komunikasi & Resolusi Konflik: Bagaimana cara menyepakati keputusan besar saat ada perbedaan pendapat antara pasangan atau orang tua?',
      'Karier, Domisili & Rencana Masa Depan: Kesepakatan mengenai mobilitas dinas/pekerjaan, tempat tinggal pasca-nikah, dan perencanaan anak.',
      'Pembagian Peran Persiapan Acara: Gunakan Modul Checklist H-6 Bulan di MEPlanner untuk membagi PIC antara Mempelai, Keluarga, dan WO secara adil.',
    ],
    highlightsEn: [
      'Financial Transparency: How will you manage joint savings, emergency funds, and a debt-free wedding budget cap?',
      'Conflict Resolution: How will you navigate major decisions when opinions differ between partners or parents?',
      'Career & Relocation: Aligning on job transfers, post-wedding residence, and family planning.',
      'Fair Task Delegation: Use MEPlanner’s 6-Month Checklist to assign clear PIC roles across Couple, Family, and WO.',
    ],
    conclusionId:
      'Mulai langkah awal yang harmonis dengan mengelola anggaran dan daftar tugas bersama pasangan di Workspace Planner MEPlanner.',
    conclusionEn:
      'Start your journey harmoniously by managing budgets and checklists together inside MEPlanner Workspace.',
  },
  {
    id: 'blog-7-qr-checkin',
    category: 'Manajemen Tamu Hari-H',
    readTime: '5 Menit Baca',
    titleId:
      '7 Tanda Acara Anda Perlu Sistem QR Code & 21-Char Hash Check-In di Meja Penerima Tamu',
    titleEn:
      '7 Signs Your Event Needs QR Code & 21-Char Hash Check-In at Guest Reception',
    excerptId:
      'Antrean panjang di buku tamu fisik sering membuat tamu VVIP menunggu lama. Ketahui mengapa sistem Layar Penerima Tamu digital kini menjadi standar baru.',
    excerptEn:
      'Long queues at physical guestbooks frustrate VVIP guests. Discover why digital Guest Reception check-in is the new gold standard.',
    imageUrl:
      'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=900&q=80',
    highlightsId: [
      'Jumlah Tamu di Atas 100 Orang: Buku tamu manual memicu penumpukan di pintu masuk ballroom pada jam puncak acara.',
      'Kehadiran Pejabat / Tamu VVIP: Deteksi instan lencana P1-VIP di Layar Penerima Tamu agar tim protokol langsung mengarahkan ke meja kehormatan.',
      'Kontrol Kuota Pax Katering Akurat: Mencegah tamu tak diundang masuk sekaligus memantau jumlah pax real-time yang hadir di lokasi.',
      'Kode Undangan Personal Tamu: Setiap undangan di MEPlanner dilengkapi kode tautan unik khusus untuk masing-masing tamu.',
    ],
    highlightsEn: [
      'Over 100 Invited Guests: Physical guestbooks create bottlenecks at the ballroom entrance during peak arrival.',
      'VVIP & Official Protocol: Instant P1-VIP badge detection alerts ushers to escort honored guests to their reserved tables.',
      'Accurate Catering Pax Control: Tracks real-time headcount on site against confirmed RSVP pax.',
      'Personalized Guest Invitation Code: Every MEPlanner invitation includes a unique personal link for each guest.',
    ],
    conclusionId:
      'Fitur Layar Penerima Tamu (Guest Reception) sudah termasuk di semua paket berbayar MEPlanner mulai dari Rp 51.750!',
    conclusionEn:
      'The Guest Reception screen is included in all paid MEPlanner tiers starting from just Rp 51,750!',
  },
  {
    id: 'blog-11-vendor-dp',
    category: 'Tips Anggaran & Vendor',
    readTime: '5 Menit Baca',
    titleId:
      'Jangan Transfer DP Vendor Sebelum 11 Hal Penting Ini Tertulis Jelas di Kontrak!',
    titleEn:
      'Never Transfer Vendor Deposits Before These 11 Clauses Are Written in the Contract!',
    excerptId:
      'Hindari biaya siluman (hidden charge) menjelang Hari-H. Pastikan 11 poin krusial ini tercatat di kontrak dan terpantau di Modul Moneter Anda.',
    excerptEn:
      'Avoid surprise hidden charges right before your event day. Make sure these 11 critical points are locked into your vendor contracts.',
    imageUrl:
      'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=900&q=80',
    highlightsId: [
      'Rincian Spesifikasi Item & Jam Kerja: Pastikan durasi sewa ballroom, jam loading dekorasi, dan jumlah kru dokumentasi tertulis rinci.',
      'Kebijakan Perubahan Tanggal (Force Majeure) & Pembatalan: Ketahui syarat refund atau reschedule sejak awal.',
      'Jadwal Termin Pembayaran (DP, Cicilan, Pelunasan): Catat jatuh tempo H-30 atau H-14 di Modul Moneter MEPlanner agar tidak terkena denda keterlambatan.',
      'Biaya Overtime & Charge Venue: Tanyakan apakah harga sudah termasuk pajak PB1, listrik genset, dan biaya kebersihan gedung.',
    ],
    highlightsEn: [
      'Detailed Deliverables & Hours: Lock in ballroom rental hours, decoration loading times, and documentation crew size.',
      'Force Majeure & Reschedule Policy: Clarify refund and date-change terms upfront.',
      'Payment Milestone Schedule: Track DP, installments, and H-14 final settlement inside MEPlanner Budget Module.',
      'Overtime & Venue Corkage Fees: Confirm whether taxes, generator power, and security fees are included.',
    ],
    conclusionId:
      'Gunakan Kalkulator Pagu Moneter & Pelacakan Kontrak Vendor di MEPlanner untuk menghemat rata-rata 10–15% dari plafon anggaran Anda.',
    conclusionEn:
      'Use MEPlanner’s Budget Cap Calculator & Vendor Contract Tracker to save 10–15% on your event budget.',
  },
  {
    id: 'blog-10-wa-templates',
    category: 'Etika & Template WA',
    readTime: '4 Menit Baca',
    titleId:
      '10 Contoh Kata-Kata Pengantar Undangan Digital WhatsApp yang Sopan untuk Tamu VIP & Sahabat',
    titleEn:
      '10 Polite WhatsApp Digital Invitation Wording Templates for VIPs & Friends',
    excerptId:
      'Mengirim tautan undangan tidak boleh terkesan asal tempel. Berikut panduan etika dan template kalimat otomatis yang langsung menyertakan nama & gelar tamu.',
    excerptEn:
      'Sending digital invitations requires warm etiquette. Explore auto-personalized WhatsApp templates tailored for VIP officials, family, and friends.',
    imageUrl:
      'https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=900&q=80',
    highlightsId: [
      'Template Pejabat / Pimpinan / Perwira Tinggi: Menggunakan sapaan kehormatan formal, permohonan maaf bila berbagi via tautan digital, serta rincian waktu & dresscode.',
      'Template Keluarga Besar & Sesepuh: Menekankan permohonan doa restu dengan bahasa yang hangat dan penuh hormat.',
      'Template Rekan Kerja & Sahabat: Ringkas, hangat, dan langsung mengarahkan ke pengisian form RSVP agar kuota meja segera terkunci.',
      'Auto-Generator 1-Klik di MEPlanner: Variabel {nama_tamu} dan {link_hash} terisi otomatis tanpa perlu ketik manual satu per satu!',
    ],
    highlightsEn: [
      'VIP & Executive Protocol Template: Formal salutation, respectful digital note, and clear session & dresscode details.',
      'Extended Family & Elders Template: Warm, respectful wording emphasizing family blessings.',
      'Colleagues & Friends Template: Friendly, concise, and encourages immediate RSVP confirmation.',
      '1-Click Auto-Generator in MEPlanner: Automatically injects {guest_name} and {hash_link} with zero manual typing!',
    ],
    conclusionId:
      'Coba langsung fitur Generator Blast WhatsApp 1-Klik di Modul Tamu MEPlanner sekarang juga.',
    conclusionEn:
      'Test the 1-Click WhatsApp Blast Generator inside MEPlanner’s Guest CRM Module today.',
  },
];

const FAQ_ITEMS = [
  {
    qId: 'Mengapa harga paket resmi MEPlanner sangat terjangkau dengan fitur perencanaan acara terlengkap?',
    qEn: 'Why are MEPlanner official packages so affordable while offering the most complete event planning suite?',
    aId: 'Kami membangun infrastruktur cloud modern yang efisien di atas Supabase & Vercel serta menggabungkan 5 jenis acara (Pernikahan, Ulang Tahun, Wisuda, Rapat Resmi, Gala Dinner) + Full Event Planner dalam satu ekosistem terpadu. Hasilnya, Anda mendapatkan fitur undangan digital kelas atas ditambah 8 Tahap Persiapan Acara, Kalkulator Vendor, dan Kode Undangan Personal Tamu dengan harga resmi terbaik: Gratis Rp 0, Premium Rp 51.750, Business Rp 74.250, Enterprise Rp 180.000, Mitra Silver Rp 375.000, dan Mitra Gold Rp 750.000.',
    aEn: 'Our modern cloud architecture combines 5 event categories plus a full 8-Stage Event Planner in one unified platform—delivering all premium digital invitation features at official transparent pricing across every tier.',
  },
  {
    qId: 'Apakah undangan digital di MEPlanner benar-benar aktif selamanya (sekali bayar tanpa biaya bulanan)?',
    qEn: 'Are MEPlanner digital invitations truly active forever (one-time payment with no monthly fees)?',
    aId: 'Ya! Untuk seluruh paket berbayar (Premium Rp 51.750 hingga Mitra Gold Rp 750.000), pembayaran hanya dilakukan sekali di awal (One-Time License) dan undangan digital beserta kenangan galeri foto serta ucapan doa tamu tetap aktif selamanya. Paket Gratis (Rp 0) aktif selama 14 hari untuk uji coba penuh.',
    aEn: 'Yes! All paid tiers (from Premium Rp 51,750 to Mitra Gold Rp 750,000) are a one-time payment with lifetime active access. The Free tier (Rp 0) stays active for 14 days so you can test everything risk-free.',
  },
  {
    qId: 'Apakah saya bisa mengganti tema dan struktur tata letak (Layout Archetype) setelah mengisi data acara?',
    qEn: 'Can I switch themes and layout structures anytime after entering my event details and guest list?',
    aId: 'Tentu saja! Seluruh 31+ tema desain di MEPlanner dilengkapi 5 Arketipe Tata Letak berbeda (Editorial Classic, Polaroid Magazine, Botanical Airy, Nusantara Heritage, dan Modern Bento) yang terpisah dari data konten Anda. Anda bebas berganti tema, struktur layout, palet warna, hingga bingkai foto kapan saja dalam 1 klik tanpa kehilangan data tamu atau RSVP.',
    aEn: 'Absolutely! All 31+ themes feature 5 distinct Layout Archetypes decoupled from your event data. You can switch themes, layout structures, color palettes, and profile frames anytime in 1 click without losing any guest or RSVP data.',
  },
  {
    qId: 'Apa keunggulan paket Business (Rp 74.250) dan Enterprise (Rp 180.000) dibanding Premium?',
    qEn: 'What is the difference between Premium (Rp 51,750), Business (Rp 74,250), and Enterprise (Rp 180,000)?',
    aId: 'Paket Premium (Rp 51.750) mencakup 1 Undangan Premium aktif selamanya dengan kuota tamu unlimited. Paket Business (Rp 74.250) memberikan 2 Undangan Premium sekaligus (cocok untuk acara Ngunduh Mantu / 2 lokasi berbeda atau pasangan + bisnis) lengkap dengan Full Event Planner & status Mitra Bronze. Paket Enterprise (Rp 180.000) memberikan 5 Undangan Premium lengkap dengan Video Background HD 25MB, AI Wishes Insight, serta Amplop Digital Global (Bank, QRIS, PayPal & Crypto USDT).',
    aEn: 'Premium (Rp 51,750) includes 1 lifetime Premium Invitation. Business (Rp 74,250) gives you 2 Premium Invitations plus Full Event Planner & Mitra Bronze. Enterprise (Rp 180,000) unlocks 5 Premium Invitations, 25MB HD Video Backgrounds, AI Wishes Insight, and Global Multi-Currency Envelopes.',
  },
  {
    qId: 'Bagaimana cara kerja fitur White-Label pada paket Mitra Silver (Rp 375.000) & Mitra Gold (Rp 750.000) untuk WO/EO?',
    qEn: 'How does White-Label branding work on Mitra Silver (Rp 375,000) & Mitra Gold (Rp 750,000) for Wedding/Event Organizers?',
    aId: 'Paket Mitra dirancang khusus untuk Wedding Organizer (WO), Event Organizer (EO), dan vendor percetakan. Mitra Silver (11 Undangan Premium • Rp 375.000) membuka fitur Branding Teks (mencantumkan nama WO/EO Anda di footer undangan klien). Mitra Gold (23 Undangan Premium • Rp 750.000) membuka Branding Teks + Branding Logo kustom milik agensi WO/EO Anda sendiri!',
    aEn: 'Mitra Silver (11 Premium Invitations • Rp 375,000) unlocks Custom Text Branding for your WO/EO agency name. Mitra Gold (23 Premium Invitations • Rp 750,000) unlocks full White-Label Text + Custom Agency Logo Branding on all client invitations.',
  },
  {
    qId: 'Bagaimana cara menghubungi tim resmi MEPlanner untuk bantuan teknis atau konfirmasi lisensi?',
    qEn: 'How can I contact the official MEPlanner team for technical support or license confirmation?',
    aId: 'Seluruh korespondensi resmi, konfirmasi bukti pembayaran lisensi, dan dukungan pelanggan MEPlanner dilayani melalui Email Resmi Gmail di e98.bisnis@gmail.com (Jam Operasional Setiap Hari 08.00 – 20.00 WIB).',
    aEn: 'All official support, license payment confirmations, and inquiries are handled via our Official Business Gmail at e98.bisnis@gmail.com (Daily 08:00 – 20:00 WIB).',
  },
] as const;

const AI_QUICK_PROMPTS = [
  {
    id: 'ai-price',
    questionId: '💰 Rincian harga resmi 6 paket MEPlanner',
    questionEn: '💰 Official pricing for all 6 MEPlanner packages',
    answerId:
      '🤖 MEPlanner AI: Berikut daftar harga resmi MEPlanner (Sekali Bayar • Aktif Selamanya): Paket Gratis Rp 0 (Uji Coba 14 Hari), Paket Premium Rp 51.750 (1 Undangan Premium Unlimited), Business Rp 74.250 (2 Undangan Premium + Full Event Planner), Enterprise Rp 180.000 (5 Undangan Premium + Video HD & Global Gift), Mitra Silver Rp 375.000 (11 Undangan + Branding Teks WO/EO), dan Mitra Gold Rp 750.000 (23 Undangan + Branding Logo WO/EO)!',
    answerEn:
      '🤖 MEPlanner AI: Official MEPlanner one-time pricing: Free Rp 0 (14-Day Trial), Premium Rp 51,750 (1 Unlimited Invitation), Business Rp 74,250 (2 Invitations + Full Event Planner), Enterprise Rp 180,000 (5 Invitations + HD Video & Global Gift), Mitra Silver Rp 375,000 (11 Invitations + Text Branding), and Mitra Gold Rp 750,000 (23 Invitations + Logo Branding)!',
  },
  {
    id: 'ai-theme',
    questionId: '🎨 Rekomendasi tema & layout sesuai jenis acara saya',
    questionEn: '🎨 Recommend a theme & layout for my event type',
    answerId:
      '🤖 MEPlanner AI: Setiap tema di MEPlanner memiliki arketipe tata letak (Layout Archetype) yang unik! Untuk Pernikahan Adat & Keraton, gunakan "Wayang Heritage" atau "Culture: Javanese" (Nusantara Heritage Layout). Untuk gaya majalah & polaroid modern, pilih "Snap Photo", "Visual Journey", atau "Peppy" (Polaroid Magazine Layout). Untuk nuansa taman minimalis, pilih "Serein", "Mildness", atau "BluBloom" (Botanical Airy Layout). Untuk Ballroom & Eksekutif, pilih "Timeless Snapshot", "Elegant Light", atau "Pearl & Ivory Elegance"!',
    answerEn:
      '🤖 MEPlanner AI: Every MEPlanner theme features a distinct Layout Archetype! For Heritage Weddings, try "Wayang Heritage" or "Culture: Javanese". For Polaroid & Magazine vibes, pick "Snap Photo", "Visual Journey", or "Peppy". For Botanical Minimalist, choose "Serein", "Mildness", or "BluBloom"!',
  },
  {
    id: 'ai-planner',
    questionId: '📊 Apa saja fitur Event Planner & Layar Tamu Hari-H?',
    questionEn: '📊 What is included in Event Planner & Guest Reception?',
    answerId:
      '🤖 MEPlanner AI: Selain undangan digital, Anda mendapatkan: (1) 8 Tahap Persiapan Acara, (2) Checklist H-6 Bulan s/d Hari-H dengan pembagian PIC, (3) Kalkulator Pagu Anggaran & Pelunasan Vendor, (4) Daftar Tamu VIP dengan Kirim WA 1-Klik & Kode Undangan Personal Tamu, serta (5) Layar Penerima Tamu (Guest Reception) untuk check-in tamu saat Hari-H.',
    answerEn:
      '🤖 MEPlanner AI: Beyond digital invitations, you get an 8-Stage Event Readiness Tracker, Phased Checklist with PIC roles, Vendor Budget Calculator, 1-Click WhatsApp Guest CRM with Personalized Guest Codes, and a Live Guest Reception Check-In Screen.',
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
  onOpenDemoManager?: (
    dummyClientId: string,
    tier: ShowcasePackageTier,
    catalogThemeId?: string
  ) => void;
  onQuickCreateWithGoogle?: (payload: {
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
    themeLayoutArchetype?: ThemeLayoutArchetype;
    coverImageUrl?: string;
    heroImageUrl?: string;
  }) => void;
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
  onOpenDemoManager,
  onQuickCreateWithGoogle,
  onSelectClientInvitation,
  onUpsertCommercialPayment,
}) => {
  const [lang, setLang] = useState<'ID' | 'EN'>(
    primarySettings.defaultLanguage || 'ID'
  );
  const [copiedPaymentKey, setCopiedPaymentKey] = useState<string | null>(null);
  const [isPlannerMenuOpen, setIsPlannerMenuOpen] = useState(false);
  const plannerMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isPlannerMenuOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        plannerMenuRef.current &&
        !plannerMenuRef.current.contains(e.target as Node)
      ) {
        setIsPlannerMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsPlannerMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isPlannerMenuOpen]);

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
  const [selectedWevPackageId, setSelectedWevPackageId] =
    useState<WevPackageId>('PREMIUM');
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

  // Commercial Catalog Modals & Interactive States
  const [selectedCatalogThemeId, setSelectedCatalogThemeId] = useState<string>(
    'wed-timeless-snapshot'
  );
  const [catalogEventFilter, setCatalogEventFilter] = useState<
    'ALL' | EventCategoryType
  >('ALL');
  const [catalogStyleFilter, setCatalogStyleFilter] = useState<
    'ALL' | CatalogThemeStyle
  >('ALL');
  const [catalogSearchQuery, setCatalogSearchQuery] = useState<string>('');
  const [showAllCatalogThemes, setShowAllCatalogThemes] =
    useState<boolean>(false);
  const [isEcoModalOpen, setIsEcoModalOpen] = useState<boolean>(false);
  const [isGuestLookupModalOpen, setIsGuestLookupModalOpen] =
    useState<boolean>(false);
  const [activeBlogArticle, setActiveBlogArticle] =
    useState<BlogArticleItem | null>(null);
  const [openFaqIdx, setOpenFaqIdx] = useState<number>(0);
  const [selectedAiPromptIdx, setSelectedAiPromptIdx] = useState<number>(0);

  // Instant Google / Gmail Workspace Creation Modal States
  const [isGoogleOnboardingModalOpen, setIsGoogleOnboardingModalOpen] =
    useState(false);
  const [googleOnboardingPackageId, setGoogleOnboardingPackageId] = useState<
    | 'GRATIS'
    | 'PREMIUM'
    | 'BUSINESS'
    | 'ENTERPRISE'
    | 'MITRA_SILVER'
    | 'MITRA_GOLD'
  >('GRATIS');
  const [googleOnboardingEmail, setGoogleOnboardingEmail] = useState('');
  const [googleOnboardingEventTitle, setGoogleOnboardingEventTitle] =
    useState('');
  const [googleOnboardingEventType, setGoogleOnboardingEventType] =
    useState<EventCategoryType>('WEDDING');
  const [googleOnboardingThemeId, setGoogleOnboardingThemeId] =
    useState<string>('wed-timeless-snapshot');

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
    const tierCode = selectedWevPackageId.replace(/[^A-Z0-9]/g, '');
    const hashSuffix = computeDeterministicHash(
      `${buyerEmail.trim().toLowerCase() || 'guest'}|${tierCode}|${lang}`
    );
    return {
      currentIdempotencyKey: `IDEMP-MEP-${lang}-${tierCode}-${cleanEmail}-${hashSuffix}`,
      currentOrderId: `ORD-MEP-${tierCode.slice(0, 4)}-${hashSuffix}`,
    };
  }, [buyerEmail, selectedWevPackageId, lang]);

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
  const [selectedLookupClientId] = useState<string>('client-utama');
  const [showLookupSuggestions, setShowLookupSuggestions] = useState(false);
  const [lookupGateError, setLookupGateError] = useState<string | null>(null);
  const [activeShowcaseIdx, setActiveShowcaseIdx] = useState<number>(0);
  const [showcaseViewMode, setShowcaseViewMode] = useState<
    'invitation_sim' | 'dashboard_modules'
  >('invitation_sim');
  const [simPackageTier, setSimPackageTier] = useState<
    'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP'
  >('ROYAL VIP');
  const [selectedDemoClientId, setSelectedDemoClientId] = useState<string>(
    'client-demo-wedding'
  );
  const [customDummyWishesByClient, setCustomDummyWishesByClient] = useState<
    Record<string, GuestWish[]>
  >({});
  const [simSectionToggles, setSimSectionToggles] = useState<{
    cover: boolean;
    quote: boolean;
    couple: boolean;
    events: boolean;
    story: boolean;
    gallery: boolean;
    rsvp: boolean;
    gift: boolean;
    wishes: boolean;
  }>({
    cover: true,
    quote: true,
    couple: true,
    events: true,
    story: true,
    gallery: true,
    rsvp: true,
    gift: true,
    wishes: true,
  });
  const [simEventType, setSimEventType] = useState<
    'WEDDING' | 'BIRTHDAY' | 'GRADUATION' | 'MEETING' | 'GALA_DINNER'
  >('WEDDING');
  const [simIsOpened, setSimIsOpened] = useState<boolean>(true);
  const [simThemeOverride, setSimThemeOverride] = useState<
    | 'champagne_gold'
    | 'sage_botanical'
    | 'blush_rose'
    | 'royal_navy'
    | 'terracotta_rust'
    | null
  >(null);

  // Sync selectedDemoClientId whenever simEventType changes
  useEffect(() => {
    const matched = SHOWCASE_DUMMY_CLIENT_METAS.find(
      (m) => m.eventType === simEventType
    );
    if (matched && matched.id !== selectedDemoClientId) {
      setSelectedDemoClientId(matched.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [simEventType]);

  const handleSelectDummyClient = (dummyClientId: string) => {
    setSelectedDemoClientId(dummyClientId);
    setSimThemeOverride(null);
    const matched = SHOWCASE_DUMMY_CLIENT_METAS.find(
      (m) => m.id === dummyClientId
    );
    if (matched) {
      if (matched.eventType !== simEventType) {
        setSimEventType(matched.eventType);
      }
      const firstThemeForEvent = MULTI_EVENT_THEME_CATALOG.find(
        (t) => t.eventType === matched.eventType
      );
      if (firstThemeForEvent) {
        setSelectedCatalogThemeId(firstThemeForEvent.id);
      }
    }
  };

  const handleApplyCatalogThemeDemo = (theme: CatalogThemeItem) => {
    setSelectedCatalogThemeId(theme.id);
    setSelectedDemoClientId(theme.dummyClientId);
    setSimEventType(theme.eventType);
    setSimThemeOverride(theme.themePreset);
    setShowcaseViewMode('invitation_sim');
    setSimIsOpened(true);
    setIsCheckoutPageOpen(false);
    setLightboxScreenshot({
      title: `${theme.name} — ${theme.styleCategory}`,
      badge:
        lang === 'ID'
          ? `PRATINJAU TEMA • ${theme.tierBadge}`
          : `THEME DEMO • ${theme.tierBadge}`,
      desc: lang === 'ID' ? theme.taglineId : theme.taglineEn,
      imageUrl: theme.coverBgUrl || theme.thumbnailUrl,
      mode: 'invitation_sim',
    });
  };

  const activeDummyMeta = useMemo(
    () =>
      SHOWCASE_DUMMY_CLIENT_METAS.find((m) => m.id === selectedDemoClientId) ||
      SHOWCASE_DUMMY_CLIENT_METAS.find((m) => m.eventType === simEventType) ||
      SHOWCASE_DUMMY_CLIENT_METAS[0],
    [selectedDemoClientId, simEventType]
  );

  const activeCatalogTheme = useMemo<CatalogThemeItem | null>(() => {
    const byId = MULTI_EVENT_THEME_CATALOG.find(
      (t) => t.id === selectedCatalogThemeId
    );
    if (byId && byId.eventType === activeDummyMeta.eventType) {
      return byId;
    }
    return (
      MULTI_EVENT_THEME_CATALOG.find(
        (t) => t.eventType === activeDummyMeta.eventType
      ) || null
    );
  }, [selectedCatalogThemeId, activeDummyMeta.eventType]);

  const effectiveSimThemePreset =
    simThemeOverride ||
    activeCatalogTheme?.themePreset ||
    activeDummyMeta.themePreset;

  const activeDummyState = useMemo(() => {
    const base = getShowcaseDummyClientState(activeDummyMeta.id, simPackageTier);
    const resolvedPreset =
      simThemeOverride ||
      activeCatalogTheme?.themePreset ||
      base.settings.themePreset;
    return {
      ...base,
      settings: {
        ...base.settings,
        themePreset: resolvedPreset,
        ...(activeCatalogTheme
          ? {
              themeLayoutArchetype: activeCatalogTheme.layoutArchetype,
              profileFrameStyle: activeCatalogTheme.profileFrameStyle,
              showFloralOrnaments: activeCatalogTheme.showFloralOrnaments,
              coverBgUrl: activeCatalogTheme.coverBgUrl,
              heroPrewedUrl: activeCatalogTheme.heroPrewedUrl,
            }
          : {}),
      } as WeddingSettings,
    };
  }, [
    activeDummyMeta.id,
    activeDummyMeta.badgeId,
    simPackageTier,
    simThemeOverride,
    activeCatalogTheme,
  ]);

  const filteredCatalogThemes = useMemo<CatalogThemeItem[]>(() => {
    const q = catalogSearchQuery.trim().toLowerCase();
    return MULTI_EVENT_THEME_CATALOG.filter((item) => {
      if (catalogEventFilter !== 'ALL' && item.eventType !== catalogEventFilter) {
        return false;
      }
      if (
        catalogStyleFilter !== 'ALL' &&
        item.styleCategory !== catalogStyleFilter
      ) {
        return false;
      }
      if (q.length > 0) {
        const hay =
          `${item.name} ${item.styleCategory} ${item.taglineId} ${item.taglineEn} ${item.eventType}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [catalogEventFilter, catalogStyleFilter, catalogSearchQuery]);

  const effectiveDummyWishes = useMemo(
    () => [
      ...(customDummyWishesByClient[activeDummyMeta.id] || []),
      ...activeDummyState.wishes,
    ],
    [customDummyWishesByClient, activeDummyMeta.id, activeDummyState.wishes]
  );

  const handleDummyLiveRsvpSubmit = async (payload: {
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
    const newWish: GuestWish = {
      id: `wsh_live_${Date.now()}`,
      invitationCode: payload.invitationCode || activeDummyMeta.sampleHashToken,
      guestName: payload.guestName || activeDummyMeta.sampleGuestName,
      institution: payload.institution || 'Tamu Simulasi Katalog',
      relation: payload.relation || 'Tamu Kehormatan',
      rsvpStatus: payload.rsvpStatus,
      sessionChoice: payload.sessionChoice || 'Semua Sesi',
      pax: payload.pax || 2,
      message:
        payload.message ||
        `Selamat & sukses untuk acara ${activeDummyMeta.coupleLabel}!`,
      createdAt: new Date().toISOString(),
      isPinned: false,
      replyFromCouple: `Terima kasih banyak ${
        payload.guestName || activeDummyMeta.sampleGuestName
      } atas konfirmasi RSVP dan doa terbaiknya!`,
      moderationStatus: 'APPROVED',
    };
    setCustomDummyWishesByClient((prev) => ({
      ...prev,
      [activeDummyMeta.id]: [newWish, ...(prev[activeDummyMeta.id] || [])],
    }));
  };
  const [simIsOpeningAnim, setSimIsOpeningAnim] = useState<boolean>(false);
  const [simGalleryIdx, setSimGalleryIdx] = useState<number>(0);
  const [simRsvpStatus, setSimRsvpStatus] = useState<'HADIR' | 'BERHALANGAN'>(
    'HADIR'
  );
  const [simRsvpPax, setSimRsvpPax] = useState<number>(2);
  const [simWishName, setSimWishName] = useState<string>('');
  const [simWishText, setSimWishText] = useState<string>('');
  const [simCustomWishes, setSimCustomWishes] = useState<
    Partial<Record<EventCategoryType, SimulationGuestWish[]>>
  >({});
  const [simWishFeedback, setSimWishFeedback] = useState<string | null>(null);
  const [simEnvelopeIdx, setSimEnvelopeIdx] = useState<number>(0);
  const [copiedSimEnvelopeKey, setCopiedSimEnvelopeKey] = useState<
    string | null
  >(null);

  // Interactive Dummy Dashboard Module States
  const [simChecklistPhase, setSimChecklistPhase] =
    useState<string>('ALL');
  const [simDoneTaskIds, setSimDoneTaskIds] = useState<string[]>(() =>
    DUMMY_DASHBOARD_TASKS.filter((t) => t.defaultDone).map((t) => t.id)
  );
  const [simSelectedWaGuestCode, setSimSelectedWaGuestCode] =
    useState<string>('JHi4b3XgT2RQIDhZ9coLw');
  const [copiedSimWaLinkKey, setCopiedSimWaLinkKey] = useState<string | null>(
    null
  );
  const [simStudioNavTab, setSimStudioNavTab] = useState<string>('konten');
  const [simStudioOrnaments, setSimStudioOrnaments] = useState<{
    floralCorner: boolean;
    floatingParticles: boolean;
    calendarBtn: boolean;
    heroBadge: boolean;
  }>({
    floralCorner: true,
    floatingParticles: true,
    calendarBtn: true,
    heroBadge: false,
  });
  const [simStudioTransition, setSimStudioTransition] = useState<
    'CROSSFADE' | 'ZOOM_BLUR' | 'SLIDE'
  >('CROSSFADE');
  const [simVideoFitMode, setSimVideoFitMode] = useState<
    'AUTO_STRETCH' | 'COVER_CENTER' | 'CONTAIN_FULL'
  >('AUTO_STRETCH');

  const [lightboxScreenshot, setLightboxScreenshot] = useState<{
    title: string;
    badge: string;
    desc: string;
    imageUrl: string;
    mode?: 'dashboard_module' | 'invitation_sim';
    moduleId?: string;
  } | null>(null);

  const handleTriggerSimCoverOpen = () => {
    if (simIsOpeningAnim) return;
    setSimIsOpeningAnim(true);
    window.setTimeout(() => {
      setSimIsOpened(true);
      setSimIsOpeningAnim(false);
    }, 520);
  };

  const handleCopySimEnvelope = (key: string, accountValue: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(accountValue);
    }
    setCopiedSimEnvelopeKey(key);
    window.setTimeout(() => setCopiedSimEnvelopeKey(null), 2200);
  };

  const handleCopySimWaLink = (key: string, urlValue: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(urlValue);
    }
    setCopiedSimWaLinkKey(key);
    window.setTimeout(() => setCopiedSimWaLinkKey(null), 2200);
  };

  const handleToggleSimTaskDone = (taskId: string) => {
    setSimDoneTaskIds((prev) =>
      prev.includes(taskId)
        ? prev.filter((id) => id !== taskId)
        : [...prev, taskId]
    );
  };

  const handleSubmitSimWish = (e: React.FormEvent) => {
    e.preventDefault();
    const activePreset =
      SIMULATION_EVENT_PRESETS[simEventType] ||
      SIMULATION_EVENT_PRESETS.WEDDING;
    const sender =
      simWishName.trim() ||
      (lang === 'ID'
        ? 'Bapak/Ibu Tamu Simulasi VIP'
        : 'Honored VIP Simulation Guest');
    const msg =
      simWishText.trim() ||
      (lang === 'ID'
        ? `Selamat & sukses untuk acara ${activePreset.titleShort}! Semoga seluruh rangkaian berjalan lancar dan penuh berkah.`
        : `Congratulations & best wishes for ${activePreset.titleShort}! Wishing a wonderful and blessed celebration.`);
    const badge =
      simRsvpStatus === 'HADIR'
        ? `${lang === 'ID' ? 'Hadir' : 'Attending'} • ${simRsvpPax} Pax`
        : lang === 'ID'
          ? 'Berhalangan • Doa Restu'
          : 'Warmest Regards';

    const newWish: SimulationGuestWish = {
      id: `sim-wish-${Date.now()}`,
      senderName: sender,
      senderTitle:
        lang === 'ID'
          ? 'Simulasi Buku Tamu Live'
          : 'Live Guestbook Simulation',
      attendanceBadge: badge,
      message: msg,
      timestamp: lang === 'ID' ? 'Baru saja (Live)' : 'Just now (Live)',
      hostReply:
        lang === 'ID'
          ? `Terima kasih banyak ${sender} atas konfirmasi RSVP dan doa restunya!`
          : `Thank you so much ${sender} for your RSVP and kind wishes!`,
    };

    setSimCustomWishes((prev) => ({
      ...prev,
      [simEventType]: [newWish, ...(prev[simEventType] || [])],
    }));
    setSimWishName('');
    setSimWishText('');
    setSimWishFeedback(
      lang === 'ID'
        ? '✓ RSVP & Ucapan Simulasi berhasil ditambahkan ke Buku Tamu!'
        : '✓ Simulated RSVP & Wish added to the live Guestbook!'
    );
    window.setTimeout(() => setSimWishFeedback(null), 3200);
  };

  // Combined Multi-Client Workspaces for 21-Char Hash Token Lookup
  const allWorkspacesForHashLookup = useMemo<
    Array<{
      clientId: string;
      clientLabel: string;
      guests: WeddingGuest[];
    }>
  >(() => {
    const workspaces: Array<{
      clientId: string;
      clientLabel: string;
      guests: WeddingGuest[];
    }> = [];
    const seenClientIds = new Set<string>();

    // 1. Primary Client ('client-utama')
    const primaryLabel = `${primarySettings.groomNickname || 'Agung'} & ${
      primarySettings.brideNickname || 'Selo'
    } (Client Utama)`;
    workspaces.push({
      clientId: 'client-utama',
      clientLabel: primaryLabel,
      guests: primaryGuests || [],
    });
    seenClientIds.add('client-utama');

    // 2. All configured clientWorkspaces
    if (clientWorkspaces) {
      for (const [cid, ws] of Object.entries(clientWorkspaces)) {
        if (seenClientIds.has(cid)) continue;
        seenClientIds.add(cid);
        const grp = clientGroups.find((g) => g.id === cid);
        const label =
          grp?.coupleLabel ||
          grp?.clientName ||
          (ws?.settings?.groomNickname
            ? `${ws.settings.groomNickname}${
                ws.settings.brideNickname && ws.settings.brideNickname !== '-'
                  ? ` & ${ws.settings.brideNickname}`
                  : ''
              }`
            : cid);
        workspaces.push({
          clientId: cid,
          clientLabel: label,
          guests: ws?.guests || [],
        });
      }
    }

    // 3. All 5 Separated Showcase Dummy Clients
    for (const meta of SHOWCASE_DUMMY_CLIENT_METAS) {
      if (seenClientIds.has(meta.id)) continue;
      seenClientIds.add(meta.id);
      const dummyState = getShowcaseDummyClientState(meta.id, simPackageTier);
      workspaces.push({
        clientId: meta.id,
        clientLabel: `${meta.coupleLabel} (${meta.badgeId})`,
        guests: dummyState.guests || [],
      });
    }

    return workspaces;
  }, [
    primarySettings.groomNickname,
    primarySettings.brideNickname,
    primaryGuests,
    clientWorkspaces,
    clientGroups,
    simPackageTier,
  ]);

  // Flatten all searchable guests with their deterministic 21-char Hash Token
  const allSearchableClientGuests = useMemo<
    Array<{
      clientId: string;
      clientLabel: string;
      guest: WeddingGuest;
      hashToken: string;
    }>
  >(() => {
    const list: Array<{
      clientId: string;
      clientLabel: string;
      guest: WeddingGuest;
      hashToken: string;
    }> = [];
    const seenKeys = new Set<string>();

    for (const ws of allWorkspacesForHashLookup) {
      for (const g of ws.guests || []) {
        const hashToken = computeGuestInvitationHash(ws.clientId, g);
        const k = `${ws.clientId}:${hashToken}:${g.id || g.invitationCode}`;
        if (!seenKeys.has(k)) {
          seenKeys.add(k);
          list.push({
            clientId: ws.clientId,
            clientLabel: ws.clientLabel,
            guest: g,
            hashToken,
          });
        }
      }
    }
    return list;
  }, [allWorkspacesForHashLookup]);

  const filteredLookupGuests = useMemo<
    Array<{
      clientId: string;
      clientLabel: string;
      guest: WeddingGuest;
      hashToken: string;
    }>
  >(() => {
    const q = guestCodeInput.trim().toLowerCase();
    if (q.length < 2) {
      return [];
    }
    return allSearchableClientGuests
      .filter(
        ({ guest: g, hashToken, clientLabel }) =>
          hashToken.toLowerCase().includes(q) ||
          g.guestName.toLowerCase().includes(q) ||
          g.invitationCode.toLowerCase().includes(q) ||
          (g.institution || '').toLowerCase().includes(q) ||
          clientLabel.toLowerCase().includes(q)
      )
      .slice(0, 6);
  }, [allSearchableClientGuests, guestCodeInput]);

  const rawDeveloperUrl = primarySettings.developerCreditUrl?.trim() || '';
  const developerUrl =
    !rawDeveloperUrl || /github\.com\/omeko11/i.test(rawDeveloperUrl)
      ? 'https://github.com/omeko42'
      : rawDeveloperUrl;
  const rawPaypalConfig = primarySettings.commercialPaypalUrl?.trim() || '';
  const paypalHref =
    /^https?:\/\//i.test(rawPaypalConfig) &&
    rawPaypalConfig !== 'https://paypal.me/omeko42'
      ? rawPaypalConfig
      : 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY';

  // Official business email (e98.bisnis@gmail.com)
  const businessEmail =
    primarySettings.contactBusinessEmail?.trim() || 'e98.bisnis@gmail.com';
  const mailtoGeneralSupportUrl = `mailto:${businessEmail}?subject=${encodeURIComponent(
    lang === 'ID'
      ? 'Konsultasi & Dukungan Resmi MEPlanner — My Event Planner'
      : 'Official Inquiry & Support — MEPlanner'
  )}`;
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
          id: 'GRATIS' as WevPackageId,
          tier: 'STARTER' as const,
          simTier: 'STARTER' as const,
          badge:
            lang === 'ID'
              ? '🌱 COBA DULU GRATIS • AKTIF 14 HARI'
              : '🌱 FREE TRIAL • 14 DAYS ACTIVE',
          name: 'Gratis',
          subtitle:
            lang === 'ID'
              ? 'Cocok untuk uji coba fitur dasar sebelum upgrade'
              : 'Ideal for testing core features before upgrading',
          normalPriceLabel: lang === 'ID' ? 'Uji Coba Gratis' : 'Free Trial',
          discountBadge: 'PROMO AKTIF',
          priceMain: lang === 'ID' ? 'Rp 0' : '$0 USD',
          priceCryptoDisplay: '0 USDT',
          amountNumeric: 0,
          priceStrike: lang === 'ID' ? 'Rp 25.000' : '$2 USD',
          priceSubBadge:
            lang === 'ID'
              ? 'Promo Aktif • 1 Undangan Standar (Aktif 14 Hari)'
              : 'Active Promo • 1 Standard Invitation (14 Days)',
          styleVariant: 'starter' as const,
          features:
            lang === 'ID'
              ? [
                  '1 Undangan Standar (Masa Aktif 14 Hari)',
                  'Kuota Tamu s/d 30 Tamu Undangan',
                  'Foto & Video Gallery Terbatas',
                  'Musik Latar NCS (Built-In Royalty Free)',
                  'Ucapan & Doa + Konfirmasi RSVP Dasar',
                  'Pilihan Tema Dasar Multi-Event',
                  'Gift Registry & Amplop Digital Dasar',
                ]
              : [
                  '1 Standard Invitation (Active for 14 Days)',
                  'Guest Quota up to 30 Invited Guests',
                  'Limited Photo & Video Gallery',
                  'NCS Background Music (Royalty-Free)',
                  'Guestbook Wishes & Basic RSVP',
                  'Basic Multi-Event Theme Selection',
                  'Basic Gift Registry & Digital Envelope',
                ],
        },
        {
          id: 'PREMIUM' as WevPackageId,
          tier: 'STARTER' as const,
          simTier: 'EXCLUSIVE' as const,
          badge:
            lang === 'ID'
              ? '★ PALING FAVORIT • PREMIUM'
              : '★ MOST FAVORITE • PREMIUM',
          name: 'Premium',
          subtitle:
            lang === 'ID'
              ? 'Cocok untuk pasangan mempelai / individu (1 Acara)'
              : 'Best for couples or individuals (1 Event)',
          normalPriceLabel:
            lang === 'ID' ? 'Harga Normal: Rp 75.000' : 'Regular: $7.50 USD',
          discountBadge: 'PROMO 31% OFF • TERPOPULER',
          priceMain: lang === 'ID' ? 'Rp 51.750' : '$3.75 USD',
          priceCryptoDisplay: '3.75 USDT',
          amountNumeric: lang === 'ID' ? 51750 : 4,
          priceStrike: lang === 'ID' ? 'Rp 75.000' : '$7.50 USD',
          priceSubBadge:
            lang === 'ID'
              ? '1 Undangan Premium Unlimited • Sekali Bayar Aktif Selamanya'
              : '1 Unlimited Premium Invitation • One-Time Payment Active Forever',
          styleVariant: 'exclusive' as const,
          features:
            lang === 'ID'
              ? [
                  'Upgrade 1 Undangan Premium',
                  'Undangan Aktif Selamanya (Sekali Bayar)',
                  'Unlimited Kuota Tamu',
                  'Unlimited Foto & Video Gallery',
                  'Musik Latar (NCS / Spotify / YouTube / MP3)',
                  'Ucapan & Doa + Premium RSVP',
                  'Bebas Pilih Semua Tema Premium (31+ Tema)',
                  'Link Live Streaming',
                  'Kado Cashless / Donasi & Gift Registry',
                  'Layar Penerima Tamu (Guest Reception)',
                  'Story Instagram',
                ]
              : [
                  'Upgrade 1 Premium Invitation',
                  'Active Forever (One-Time Payment)',
                  'Unlimited Guest Quota',
                  'Unlimited Photo & Video Gallery',
                  'Background Music (NCS / Spotify / YouTube / MP3)',
                  'Guestbook Wishes + Premium RSVP',
                  'Unlock All 31+ Premium Multi-Event Themes',
                  'Live Streaming Link Integration',
                  'Cashless Gift / Donation & Gift Registry',
                  'Guest Reception Check-In Screen',
                  'Instagram Story Template',
                ],
        },
        {
          id: 'BUSINESS' as WevPackageId,
          tier: 'EXCLUSIVE' as const,
          simTier: 'EXCLUSIVE' as const,
          badge:
            lang === 'ID'
              ? '💼 UNTUK 2 ACARA • BUSINESS'
              : '💼 FOR 2 EVENTS • BUSINESS',
          name: 'Business',
          subtitle:
            lang === 'ID'
              ? 'Cocok untuk pasangan (Resepsi + Ngunduh Mantu) / bisnis kecil'
              : 'Ideal for 2 events or couples + small businesses',
          normalPriceLabel:
            lang === 'ID' ? 'Harga Normal: Rp 150.000' : 'Regular: $11 USD',
          discountBadge: 'PROMO 50% OFF • 2 ACARA',
          priceMain: lang === 'ID' ? 'Rp 74.250' : '$5.25 USD',
          priceCryptoDisplay: '5.25 USDT',
          amountNumeric: lang === 'ID' ? 74250 : 5,
          priceStrike: lang === 'ID' ? 'Rp 150.000' : '$11 USD',
          priceSubBadge:
            lang === 'ID'
              ? '2 Undangan Premium + Full Event Planner • Aktif Selamanya'
              : '2 Premium Invitations + Full Event Planner • Active Forever',
          styleVariant: 'exclusive' as const,
          features:
            lang === 'ID'
              ? [
                  'Upgrade Premium +1 Undangan (2 Undangan Premium dalam 1 Akun)',
                  'Undangan Aktif Selamanya',
                  'Unlimited Kuota Tamu & Blast WA',
                  'Unlimited Foto & Video Gallery',
                  'Ucapan & Doa',
                  'Bebas Pilih Tema Premium',
                  'Link Streaming',
                  'Kado Cashless / Donasi & Gift Registry',
                  'Layar Penerima Tamu',
                  'Story Instagram',
                  'Premium RSVP & Open Registration',
                  'Full Event Planner (Budget, Vendor & Checklist)',
                  'Mitra Bronze',
                ]
              : [
                  'Upgrade Premium +1 Invitation (2 Premium Invitations in 1 Account)',
                  'Invitations Active Forever',
                  'Unlimited Guest Quota & 1-Click WA Blast',
                  'Unlimited Photo & Video Gallery',
                  'Guestbook Wishes & Moderation',
                  'Unlock All Premium Themes',
                  'Live Streaming Link',
                  'Cashless Gift / Donation & Gift Registry',
                  'Guest Reception Screen',
                  'Instagram Story Template',
                  'Premium RSVP & Open Registration',
                  'Full Event Planner (Budget, Vendor & Checklist)',
                  'Mitra Bronze Partner Status',
                ],
        },
        {
          id: 'ENTERPRISE' as WevPackageId,
          tier: 'ROYAL VIP' as const,
          simTier: 'ROYAL VIP' as const,
          badge:
            lang === 'ID'
              ? '🏛️ 5 UNDANGAN • ENTERPRISE'
              : '🏛️ 5 INVITATIONS • ENTERPRISE',
          name: 'Enterprise',
          subtitle:
            lang === 'ID'
              ? 'Cocok untuk bisnis menengah / keluarga besar — 5 Undangan'
              : 'Ideal for medium businesses or large families — 5 Invitations',
          normalPriceLabel:
            lang === 'ID' ? 'Harga Normal: Rp 375.000' : 'Regular: $25 USD',
          discountBadge: 'PROMO 52% OFF • 5 ACARA',
          priceMain: lang === 'ID' ? 'Rp 180.000' : '$12 USD',
          priceCryptoDisplay: '12 USDT',
          amountNumeric: lang === 'ID' ? 180000 : 12,
          priceStrike: lang === 'ID' ? 'Rp 375.000' : '$25 USD',
          priceSubBadge:
            lang === 'ID'
              ? '5 Undangan Premium + Video HD & Global Gift • Aktif Selamanya'
              : '5 Premium Invitations + HD Video & Global Gift • Active Forever',
          styleVariant: 'royal' as const,
          features:
            lang === 'ID'
              ? [
                  'Upgrade Premium +4 Undangan (5 Undangan Premium)',
                  'Undangan Aktif Selamanya',
                  'Unlimited Kuota Tamu',
                  'Foto & Video Gallery + Video Background HD',
                  'Ucapan & Doa + AI Wishes Insight',
                  'Tema Premium Multi-Event',
                  'Link Streaming',
                  'Kado Cashless Global (Bank, QRIS, PayPal, Crypto USDT)',
                  'Layar Penerima Tamu & Check-In Management',
                ]
              : [
                  'Upgrade Premium +4 Invitations (5 Premium Invitations)',
                  'Invitations Active Forever',
                  'Unlimited Guest Quota',
                  'Photo & Video Gallery + 25MB HD Video Background',
                  'Guestbook Wishes + AI Wishes Insight',
                  'All Multi-Event Premium Themes',
                  'Live Streaming Link',
                  'Global Cashless Gift (Bank, QRIS, PayPal, Crypto USDT)',
                  'Guest Reception & Check-In Management',
                ],
        },
        {
          id: 'MITRA_SILVER' as WevPackageId,
          tier: 'ROYAL VIP' as const,
          simTier: 'ROYAL VIP' as const,
          badge:
            lang === 'ID'
              ? '✨ 11 UNDANGAN WO/EO • MITRA - SILVER'
              : '✨ 11 INVITATIONS WO/EO • MITRA - SILVER',
          name: 'Mitra - Silver',
          subtitle:
            lang === 'ID'
              ? 'Cocok untuk bisnis besar / WO / EO — 11 Undangan'
              : 'Designed for Wedding & Event Organizers — 11 Invitations',
          normalPriceLabel:
            lang === 'ID' ? 'Harga Normal: Rp 825.000' : 'Regular: $55 USD',
          discountBadge: 'PROMO 54% OFF • PAKET WO/EO',
          priceMain: lang === 'ID' ? 'Rp 375.000' : '$25 USD',
          priceCryptoDisplay: '25 USDT',
          amountNumeric: lang === 'ID' ? 375000 : 25,
          priceStrike: lang === 'ID' ? 'Rp 825.000' : '$55 USD',
          priceSubBadge:
            lang === 'ID'
              ? '11 Undangan Premium + White-Label Branding Teks WO/EO'
              : '11 Premium Invitations + White-Label Text Branding',
          styleVariant: 'royal' as const,
          features:
            lang === 'ID'
              ? [
                  'Upgrade Premium +10 Undangan (11 Undangan Premium)',
                  'Undangan Aktif Selamanya',
                  'Unlimited Kuota Tamu',
                  'Foto & Video Gallery',
                  'Ucapan & Doa',
                  'Tema Premium',
                  'Link Streaming',
                  'Kado Cashless / Donasi',
                  'Layar Penerima Tamu',
                  '✨ Branding Teks (White-Label Nama WO/EO)',
                ]
              : [
                  'Upgrade Premium +10 Invitations (11 Premium Invitations)',
                  'Invitations Active Forever',
                  'Unlimited Guest Quota',
                  'Photo & Video Gallery',
                  'Guestbook Wishes',
                  'All Premium Themes',
                  'Live Streaming Link',
                  'Cashless Gift / Donation',
                  'Guest Reception Screen',
                  '✨ Custom Text Branding (White-Label WO/EO Name)',
                ],
        },
        {
          id: 'MITRA_GOLD' as WevPackageId,
          tier: 'ROYAL VIP' as const,
          simTier: 'ROYAL VIP' as const,
          badge:
            lang === 'ID'
              ? '👑 23 UNDANGAN AGENSI • MITRA - GOLD'
              : '👑 23 INVITATIONS AGENCY • MITRA - GOLD',
          name: 'Mitra - Gold',
          subtitle:
            lang === 'ID'
              ? 'Cocok untuk Agensi WO / EO Enterprise — 23 Undangan'
              : 'Flagship for Enterprise WO / EO Agencies — 23 Invitations',
          normalPriceLabel:
            lang === 'ID' ? 'Harga Normal: Rp 1.725.000' : 'Regular: $110 USD',
          discountBadge: 'PROMO 56% OFF • AGENSI VIP',
          priceMain: lang === 'ID' ? 'Rp 750.000' : '$49 USD',
          priceCryptoDisplay: '49 USDT',
          amountNumeric: lang === 'ID' ? 750000 : 49,
          priceStrike: lang === 'ID' ? 'Rp 1.725.000' : '$110 USD',
          priceSubBadge:
            lang === 'ID'
              ? '23 Undangan Premium + White-Label Branding Logo WO/EO'
              : '23 Premium Invitations + Full White-Label Logo Branding',
          styleVariant: 'royal' as const,
          features:
            lang === 'ID'
              ? [
                  'Upgrade Premium +22 Undangan (23 Undangan Premium)',
                  'Undangan Aktif Selamanya',
                  'Unlimited Kuota Tamu',
                  'Foto & Video Gallery',
                  'Ucapan & Doa',
                  'Tema Premium',
                  'Link Streaming',
                  'Kado Cashless / Donasi',
                  'Layar Penerima Tamu',
                  '✨ Branding Teks (White-Label Nama WO/EO)',
                  '👑 Branding Logo (White-Label Logo WO/EO Sendiri)',
                ]
              : [
                  'Upgrade Premium +22 Invitations (23 Premium Invitations)',
                  'Invitations Active Forever',
                  'Unlimited Guest Quota',
                  'Photo & Video Gallery',
                  'Guestbook Wishes',
                  'All Premium Themes',
                  'Live Streaming Link',
                  'Cashless Gift / Donation',
                  'Guest Reception Screen',
                  '✨ Custom Text Branding (White-Label WO/EO Name)',
                  '👑 Custom Logo Branding (Your Own WO/EO Agency Logo)',
                ],
        },
      ] as const,
    [lang]
  );

  const activeSelectedPackage = useMemo(
    () =>
      commercialPackages.find((p) => p.id === selectedWevPackageId) ||
      commercialPackages.find((p) => p.tier === selectedCheckoutTier) ||
      commercialPackages[1],
    [commercialPackages, selectedWevPackageId, selectedCheckoutTier]
  );

  const activeCheckoutAmountDisplay = useMemo(() => {
    if (lang === 'EN' && selectedChannel?.category === 'CRYPTO') {
      return `${activeSelectedPackage.priceCryptoDisplay} (${activeSelectedPackage.priceMain})`;
    }
    return activeSelectedPackage.priceMain;
  }, [lang, selectedChannel, activeSelectedPackage]);

  const openGoogleOnboardingModal = (
    pkgId:
      | 'GRATIS'
      | 'PREMIUM'
      | 'BUSINESS'
      | 'ENTERPRISE'
      | 'MITRA_SILVER'
      | 'MITRA_GOLD' = 'GRATIS'
  ) => {
    const initialEvType: EventCategoryType =
      activeCatalogTheme?.eventType || simEventType || 'WEDDING';
    const matchingTheme =
      activeCatalogTheme && activeCatalogTheme.eventType === initialEvType
        ? activeCatalogTheme
        : MULTI_EVENT_THEME_CATALOG.find(
            (t) => t.eventType === initialEvType
          ) || MULTI_EVENT_THEME_CATALOG[0];

    setGoogleOnboardingPackageId(pkgId);
    setGoogleOnboardingEventType(initialEvType);
    setGoogleOnboardingThemeId(matchingTheme?.id || 'wed-timeless-snapshot');
    setIsGoogleOnboardingModalOpen(true);
  };

  const handleGoogleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const chosenTheme =
      MULTI_EVENT_THEME_CATALOG.find((t) => t.id === googleOnboardingThemeId) ||
      activeCatalogTheme ||
      MULTI_EVENT_THEME_CATALOG[0];

    const defaultTitleByEvent: Record<EventCategoryType, string> = {
      WEDDING: 'Rayhan & Clarissa',
      BIRTHDAY: 'Sweet 17th Aurelia',
      GRADUATION: 'Syukuran Wisuda Kevin',
      MEETING: 'Rapat Tahunan Nusantara',
      GALA_DINNER: 'Royal Anniversary Gala',
    };

    const finalEmail =
      googleOnboardingEmail.trim() || 'pasangan.bahagia@gmail.com';
    const finalTitle =
      googleOnboardingEventTitle.trim() ||
      defaultTitleByEvent[googleOnboardingEventType] ||
      'Rayhan & Clarissa';

    setIsGoogleOnboardingModalOpen(false);

    if (onQuickCreateWithGoogle) {
      onQuickCreateWithGoogle({
        email: finalEmail,
        displayName: finalTitle,
        eventTitle: finalTitle,
        eventType: googleOnboardingEventType,
        packageId: googleOnboardingPackageId,
        catalogThemeId: chosenTheme?.id,
        catalogThemeName: chosenTheme?.name,
        themePreset: chosenTheme?.themePreset,
        themeLayoutArchetype: chosenTheme?.layoutArchetype,
        coverImageUrl: chosenTheme?.coverBgUrl || chosenTheme?.thumbnailUrl,
        heroImageUrl: chosenTheme?.heroPrewedUrl || chosenTheme?.thumbnailUrl,
      });
    } else if (onOpenDemoManager) {
      onOpenDemoManager(activeDummyMeta.id, simPackageTier, chosenTheme?.id);
    } else {
      onOpenAdminPortal();
    }
  };

  const handleSelectPackageForCheckout = (
    pkgIdOrTier: WevPackageId | 'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP'
  ) => {
    const matchedById = commercialPackages.find((p) => p.id === pkgIdOrTier);
    const matchedByTier = commercialPackages.find(
      (p) => p.tier === pkgIdOrTier
    );
    const chosen = matchedById || matchedByTier || commercialPackages[1];
    setSelectedWevPackageId(chosen.id);
    setSelectedCheckoutTier(chosen.tier);
    if (chosen.id === 'GRATIS') {
      openGoogleOnboardingModal('GRATIS');
      return;
    }
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
      mode: 'dashboard_module',
      moduleId: shot.id,
    });
  };

  const openSimInvitationLightbox = () => {
    const activePreset =
      SIMULATION_EVENT_PRESETS[simEventType] ||
      SIMULATION_EVENT_PRESETS.WEDDING;
    setLightboxScreenshot({
      title: `${activePreset.titleShort} — ${
        lang === 'ID' ? activePreset.badgeId : activePreset.badgeEn
      }`,
      badge:
        lang === 'ID'
          ? 'PRATINJAU UNDANGAN INTERAKTIF LANGSUNG'
          : 'LIVE INTERACTIVE INVITATION PREVIEW',
      desc:
        lang === 'ID'
          ? 'Pratinjau layar penuh undangan digital interaktif lengkap dengan jadwal acara, galeri foto, buku tamu langsung, dan tanda kasih digital.'
          : 'Fullscreen live digital invitation with event schedule, interactive gallery, live guestbook, and digital gift envelope.',
      imageUrl: activePreset.heroImage,
      mode: 'invitation_sim',
    });
  };

  const renderLiveDashboardModule = (moduleId: string) => {
    const activePreset =
      SIMULATION_EVENT_PRESETS[simEventType] ||
      SIMULATION_EVENT_PRESETS.WEDDING;
    const doneTasksCount = simDoneTaskIds.length;
    const totalTasksCount = DUMMY_DASHBOARD_TASKS.length;
    const dynamicChecklistPct = Math.round(
      (doneTasksCount / totalTasksCount) * 100
    );
    const filteredTasks =
      simChecklistPhase === 'ALL'
        ? DUMMY_DASHBOARD_TASKS
        : DUMMY_DASHBOARD_TASKS.filter((t) => t.phase === simChecklistPhase);
    const selectedWaGuest =
      DUMMY_DASHBOARD_GUESTS.find((g) => g.code === simSelectedWaGuestCode) ||
      DUMMY_DASHBOARD_GUESTS[0];
    const clientSlug = activePreset.titleShort
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-');
    const waPreviewLink = `https://meplanner.vercel.app/?u=${selectedWaGuest.code}`;

    const isStarterTier = simPackageTier === 'STARTER';
    const isRoyalTier = simPackageTier === 'ROYAL VIP';
    const tierQuotaLabel = isStarterTier
      ? 'Maks 50 Tamu'
      : isRoyalTier
        ? 'Unlimited Tamu VIP'
        : 'Maks 350 Tamu';
    const tierLoginLabel = isStarterTier
      ? '2 Akun Inti'
      : isRoyalTier
        ? '4 Akun Inti + Unlimited Panitia EO/WO'
        : '4 Akun Inti + 3 Panitia EO/WO';

    return (
      <div className="bg-[#FAF8F5] text-stone-800 select-none">
        {/* ================================================================= */}
        {/* 1:1 REPLICA OF AdminDashboardView.tsx 2-ROW TOP STICKY HEADER      */}
        {/* ================================================================= */}
        <div className="bg-white/95 backdrop-blur-md border-b border-[#D4AF37]/30 shadow-[0_4px_20px_rgba(182,141,64,0.08)]">
          <div className="px-4 sm:px-6">
            {/* ROW 1: Brand Title + Event Switcher + Quick Navigation Buttons */}
            <div className="flex items-center justify-between min-h-14 py-2 gap-2 border-b border-[#D4AF37]/20 flex-wrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FBF6EA] to-[#EFE1C6] border border-[#D4AF37]/50 flex items-center justify-center shadow-2xs shrink-0">
                  <WeddingRingsIcon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h4 className="font-serif text-xs sm:text-sm font-bold text-stone-800 tracking-wide truncate">
                      MEPlanner
                    </h4>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[9px] font-extrabold uppercase tracking-wider">
                      {simPackageTier}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#9A742B] font-semibold tracking-wider uppercase truncate">
                    {activePreset.titleShort} &bull; {activePreset.eventDate}
                  </p>
                </div>
              </div>

              {/* Center: 5 Event Category Switcher Pills */}
              <div className="flex flex-wrap items-center gap-1">
                {SIMULATION_EVENT_KEYS.map((evKey) => {
                  const p = SIMULATION_EVENT_PRESETS[evKey];
                  const isSelected = simEventType === evKey;
                  return (
                    <button
                      key={evKey}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSimEventType(evKey);
                      }}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold transition-all border ${
                        isSelected
                          ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40] shadow-2xs'
                          : 'bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-700 border-[#D4AF37]/30'
                      }`}
                    >
                      {lang === 'ID' ? p.tabLabelId : p.tabLabelEn}
                    </button>
                  );
                })}
              </div>

              {/* Right: Quick View Switcher matching AdminDashboardView */}
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="hidden xl:inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold">
                  ● Tuan Rumah (Simulasi)
                </span>
                <div className="inline-flex items-center p-0.5 rounded-full bg-[#FAF3E3]/90 border border-[#D4AF37]/40">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowcaseViewMode('invitation_sim');
                    }}
                    title="Buka Simulasi Undangan Tamu 1:1"
                    className="px-2.5 py-1 rounded-full text-[10px] font-bold text-[#8B6914] hover:bg-white/70 transition-all"
                  >
                    Undangan
                  </button>
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white shadow-2xs">
                    Planner
                  </span>
                </div>
              </div>
            </div>

            {/* ROW 2: Horizontal Scrollable Module Navigation Bar (Matching AdminDashboardView 1:1) */}
            <div className="flex items-center justify-between gap-2 py-2 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                {OFFICIAL_PRODUCT_SCREENSHOTS.map((shot, idx) => {
                  const isActive = moduleId === shot.id;
                  const shortLabels: Record<string, string> = {
                    tracker: `Tracker (92%)`,
                    checklist: `Checklist (${doneTasksCount}/${totalTasksCount})`,
                    moneter: lang === 'ID' ? 'Moneter' : 'Budget',
                    tamu: lang === 'ID' ? 'Tamu' : 'Guests',
                    pengaturan:
                      lang === 'ID' ? 'Pengaturan (Studio)' : 'Settings (Studio)',
                  };
                  return (
                    <button
                      key={shot.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveShowcaseIdx(idx);
                      }}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all inline-flex items-center gap-1.5 whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] text-white shadow-xs'
                          : 'bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-600 border border-[#D4AF37]/25'
                      }`}
                    >
                      <span>{shortLabels[shot.id] || shot.tabId}</span>
                    </button>
                  );
                })}
              </div>

              <div className="hidden md:flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveShowcaseIdx(4);
                    setSimStudioNavTab('database');
                  }}
                  className="px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-[10px] font-extrabold inline-flex items-center gap-1 transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Data &amp; Cloud</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Workspace Body */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* =============================================================== */}
          {/* MODUL 1: EXECUTIVE READINESS TRACKER & MULTI-SESSION COUNTDOWN  */}
          {/* =============================================================== */}
          {moduleId === 'tracker' && (
            <div className="space-y-4">
              {/* 4 Crisp KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                      {lang === 'ID' ? 'Kesiapan Acara' : 'Event Readiness'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                      ON TRACK
                    </span>
                  </div>
                  <p className="text-2xl font-extrabold text-stone-900">92%</p>
                  <p className="text-[11px] font-bold text-[#8B6914]">
                    {lang === 'ID'
                      ? '23 / 25 Tugas Selesai'
                      : '23 / 25 Tasks Completed'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                      {lang === 'ID' ? 'Pagu Moneter' : 'Budget Cap'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40 text-[9px] font-extrabold">
                      HEMAT 9,3%
                    </span>
                  </div>
                  <p className="text-lg sm:text-xl font-extrabold text-stone-900 truncate">
                    Rp 145.000.000
                  </p>
                  <p className="text-[11px] font-semibold text-stone-500">
                    {lang === 'ID'
                      ? 'dari Pagu Rp 160.000.000'
                      : 'of Rp 160,000,000 Cap'}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                      {lang === 'ID' ? 'Kuota Paket Aktif' : 'Active Tier Quota'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                      {simPackageTier}
                    </span>
                  </div>
                  <p className="text-xl font-extrabold text-stone-900">
                    {isStarterTier ? '50 Tamu' : '180 Undangan'}
                  </p>
                  <p className="text-[11px] font-bold text-[#8B6914]">
                    {tierQuotaLabel}
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-2xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                      {lang === 'ID' ? 'Konfirmasi RSVP' : 'RSVP Confirmed'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                      LIVE SYNC
                    </span>
                  </div>
                  <p className="text-xl font-extrabold text-emerald-700">
                    {isStarterTier ? '42' : '154'}{' '}
                    {lang === 'ID' ? 'Hadir' : 'Attending'}
                  </p>
                  <p className="text-[11px] font-semibold text-stone-600">
                    38 {lang === 'ID' ? 'Ucapan Doa Restu' : 'Guestbook Wishes'}
                  </p>
                </div>
              </div>

              {/* Multi-Session Live Countdown + Domain Progress & Audit Log */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-7 p-4 rounded-2xl bg-white border border-[#D4AF37]/40 space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-[#B68D40]" />
                      <span>
                        {lang === 'ID'
                          ? 'Hitung Mundur Multi-Sesi & Progress Kategori'
                          : 'Multi-Session Countdown & Category Progress'}
                      </span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#8B6914] bg-[#FAF3E3] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/35">
                      {activePreset.eventDate}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {activePreset.sessions.map((ses, sIdx) => (
                      <div
                        key={ses.badge}
                        className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/35 space-y-1.5"
                      >
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[#8B6914] block">
                          {ses.badge}
                        </span>
                        <p className="text-xs font-extrabold text-stone-900 truncate">
                          {ses.title}
                        </p>
                        <p className="text-[10px] text-stone-600 truncate">
                          {ses.time} • {ses.venue}
                        </p>
                        <div className="grid grid-cols-4 gap-1.5 pt-1">
                          {[
                            { v: sIdx === 0 ? '14' : '14', l: 'H' },
                            { v: sIdx === 0 ? '08' : '17', l: 'J' },
                            { v: '45', l: 'M' },
                            {
                              v: String(countdownSeconds % 60).padStart(2, '0'),
                              l: 'D',
                            },
                          ].map((b) => (
                            <div
                              key={b.l}
                              className="py-1 rounded-lg bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-center font-mono text-[10px] font-extrabold"
                            >
                              {b.v}
                              {b.l}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Category Progress Bars */}
                  <div className="space-y-2.5 pt-1">
                    {[
                      {
                        label:
                          lang === 'ID'
                            ? 'Venue Utama & Katering VIP (400 Pax)'
                            : 'Main Venue & VIP Catering (400 Pax)',
                        pct: 100,
                        color: 'bg-emerald-600',
                      },
                      {
                        label:
                          lang === 'ID'
                            ? 'Dekorasi Floral, Lighting & Dokumentasi 4K'
                            : 'Floral Decor, Lighting & 4K Documentation',
                        pct: 90,
                        color: 'bg-[#C5A059]',
                      },
                      {
                        label:
                          lang === 'ID'
                            ? 'Administrasi, Perizinan & Distribusi VIP'
                            : 'Permits, Administration & VIP Distribution',
                        pct: 85,
                        color: 'bg-amber-600',
                      },
                    ].map((bar) => (
                      <div key={bar.label} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px] font-bold">
                          <span className="text-stone-700">{bar.label}</span>
                          <span className="text-[#8B6914] font-extrabold">
                            {bar.pct}%
                          </span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${bar.color}`}
                            style={{ width: `${bar.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right 5 cols: Live Audit & Activity Feed */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-white border border-[#D4AF37]/40 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-stone-900">
                        {lang === 'ID'
                          ? 'Log Aktivitas & Audit Kesiapan Live'
                          : 'Live Readiness & Activity Audit Log'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] font-mono text-[9px] font-extrabold">
                        REAL-TIME
                      </span>
                    </div>

                    <div className="space-y-2">
                      {[
                        {
                          badge: 'MONETER',
                          text:
                            lang === 'ID'
                              ? '✓ Kontrak Vendor Grand Ballroom & Katering VIP Lunas/DP Terverifikasi'
                              : '✓ Grand Ballroom & VIP Catering Vendor Contracts Verified',
                          time: '5m lalu',
                        },
                        {
                          badge: 'CRM WA',
                          text:
                            lang === 'ID'
                              ? '✓ 45 Undangan WhatsApp VVIP (INV-0001 s/d INV-0045) Terkirim'
                              : '✓ 45 VVIP WhatsApp Invitations (INV-0001..0045) Delivered',
                          time: '18m lalu',
                        },
                        {
                          badge: 'RSVP LIVE',
                          text:
                            lang === 'ID'
                              ? `✓ RSVP Hadir: ${activePreset.dummyWishes[0]?.senderName || 'Tamu VVIP'} (2 Pax)`
                              : `✓ RSVP Attending: ${activePreset.dummyWishes[0]?.senderName || 'VVIP Guest'} (2 Pax)`,
                          time: '32m lalu',
                        },
                      ].map((log) => (
                        <div
                          key={log.text}
                          className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/90 text-[11px] space-y-0.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-[9px] font-extrabold text-[#8B6914]">
                              [{log.badge}]
                            </span>
                            <span className="text-[10px] text-stone-400">
                              {log.time}
                            </span>
                          </div>
                          <p className="font-semibold text-stone-800 leading-snug">
                            {log.text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-[11px] font-bold flex items-center justify-between">
                    <span>
                      {lang === 'ID'
                        ? '✓ Sinkronisasi Cloud & Google Sheets Aktif'
                        : '✓ Cloud & Google Sheets Sync Active'}
                    </span>
                    <span className="font-mono text-[10px]">100% OK</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODUL 2: INTERACTIVE PHASED CHECKLIST (H-6 BULAN S/D HARI-H)    */}
          {/* =============================================================== */}
          {moduleId === 'checklist' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-[#D4AF37]/40">
                <div className="flex flex-wrap items-center gap-1.5">
                  {[
                    {
                      id: 'ALL',
                      label:
                        lang === 'ID'
                          ? `Semua Fase (${DUMMY_DASHBOARD_TASKS.length})`
                          : `All Phases (${DUMMY_DASHBOARD_TASKS.length})`,
                    },
                    { id: 'H-6 Bulan', label: 'H-6 Bulan' },
                    { id: 'H-3 Bulan', label: 'H-3 Bulan' },
                    { id: 'H-1 Bulan', label: 'H-1 Bulan' },
                    { id: 'Hari-H', label: 'Hari-H' },
                  ].map((ph) => (
                    <button
                      key={ph.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSimChecklistPhase(ph.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                        simChecklistPhase === ph.id
                          ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border border-[#B68D40]'
                          : 'bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-700 border border-stone-200'
                      }`}
                    >
                      {ph.label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-extrabold text-[#8B6914] bg-[#FAF3E3] px-3 py-1 rounded-xl border border-[#D4AF37]/40">
                    {lang === 'ID'
                      ? `Selesai: ${doneTasksCount}/${totalTasksCount} (${dynamicChecklistPct}%) — Klik tugas untuk uji coba!`
                      : `Done: ${doneTasksCount}/${totalTasksCount} (${dynamicChecklistPct}%) — Click any task to toggle!`}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTasks.map((task) => {
                  const isDone = simDoneTaskIds.includes(task.id);
                  return (
                    <div
                      key={task.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleSimTaskDone(task.id);
                      }}
                      className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-300/90 shadow-2xs'
                          : 'bg-white hover:bg-[#FAF3E3]/40 border-[#D4AF37]/40 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSimTaskDone(task.id);
                          }}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 font-extrabold transition-all ${
                            isDone
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white border-2 border-[#B68D40] text-transparent'
                          }`}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] font-mono text-[9px] font-extrabold">
                              {task.phase}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[9px] font-extrabold">
                              PIC: {task.pic}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                              {task.priority}
                            </span>
                          </div>
                          <p
                            className={`text-xs font-extrabold leading-snug ${
                              isDone
                                ? 'line-through text-stone-500'
                                : 'text-stone-900'
                            }`}
                          >
                            {lang === 'ID' ? task.titleId : task.titleEn}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          isDone
                            ? 'bg-emerald-600 text-white'
                            : 'bg-amber-100 text-amber-900 border border-amber-300'
                        }`}
                      >
                        {isDone
                          ? lang === 'ID'
                            ? '✓ Selesai'
                            : '✓ Done'
                          : lang === 'ID'
                            ? '⏳ Proses'
                            : '⏳ In Progress'}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODUL 3: MONETER, PAGU ANGGARAN & KONTRAK PELUNASAN VENDOR      */}
          {/* =============================================================== */}
          {moduleId === 'moneter' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/40">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                    {lang === 'ID' ? 'Target Pagu Anggaran' : 'Target Budget Cap'}
                  </p>
                  <p className="text-lg font-extrabold text-stone-900 mt-1">
                    Rp 160.000.000
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-stone-500">
                    100% Plafon Maksimal
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/40">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                    {lang === 'ID'
                      ? 'Total Kontrak Realisasi'
                      : 'Actual Contracts'}
                  </p>
                  <p className="text-lg font-extrabold text-[#8B6914] mt-1">
                    Rp 148.500.000
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[9px] font-extrabold">
                    ✓ HEMAT Rp 11,5 Jt di Bawah Pagu
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/40">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                    {lang === 'ID'
                      ? 'Sudah Dibayar (DP / Lunas)'
                      : 'Paid (Deposit / Full)'}
                  </p>
                  <p className="text-lg font-extrabold text-emerald-700 mt-1">
                    Rp 118.500.000
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-emerald-700">
                    79,8% Terbayar Resmi
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#D4AF37]/40">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500">
                    {lang === 'ID'
                      ? 'Sisa Pelunasan Vendor'
                      : 'Remaining Balance'}
                  </p>
                  <p className="text-lg font-extrabold text-amber-800 mt-1">
                    Rp 30.000.000
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-bold text-amber-800">
                    Jatuh Tempo H-14 Acara
                  </span>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-[#D4AF37]/40 overflow-hidden">
                <div className="px-4 py-3 bg-[#FAF3E3] border-b border-[#D4AF37]/35 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-extrabold text-stone-900">
                    {lang === 'ID'
                      ? 'Rincian Kontrak Vendor & Status Pelunasan (5 Vendor Utama)'
                      : 'Vendor Contracts & Payment Settlement Breakdown (5 Core Vendors)'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white border border-[#D4AF37]/50 text-[#8B6914] font-mono text-[10px] font-extrabold">
                    AUDIT MONETER TRANSPARAN
                  </span>
                </div>

                <div className="divide-y divide-stone-200/80">
                  {DUMMY_DASHBOARD_VENDORS.map((v) => (
                    <div
                      key={v.id}
                      className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5] transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/35 text-[#8B6914] text-[9px] font-extrabold">
                            {v.category}
                          </span>
                          <p className="text-xs font-extrabold text-stone-900 truncate">
                            {v.name}
                          </p>
                        </div>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          Pagu: <strong>{v.pagu}</strong> &bull; Kontrak
                          Realisasi:{' '}
                          <strong className="text-stone-800">
                            {v.realisasi}
                          </strong>
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 sm:gap-3 shrink-0">
                        <div className="text-left sm:text-right text-[11px]">
                          <p className="text-emerald-700 font-extrabold">
                            Dibayar: {v.terbayar}
                          </p>
                          <p className="text-stone-500 font-semibold">
                            Sisa: {v.sisa}
                          </p>
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                            v.status === 'LUNAS'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-amber-100 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {v.status === 'LUNAS' ? '✓ LUNAS' : '⏳ DP TERBAYAR'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODUL 4: CRM TAMU VIP, KUOTA PAX & BLAST WHATSAPP 1-KLIK        */}
          {/* =============================================================== */}
          {moduleId === 'tamu' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-[#D4AF37]/40">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white text-xs font-extrabold">
                    Paket {simPackageTier}: {tierQuotaLabel}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-xs font-extrabold">
                    ★ P1 - VIP: {isStarterTier ? '15' : '48'} Tamu
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                    👥 Total Kuota: {isStarterTier ? '100' : '410'} Pax
                  </span>
                </div>
                <span className="text-[11px] font-bold text-stone-500">
                  {lang === 'ID'
                    ? 'Klik "Kirim WA" untuk melihat pratinjau pesan otomatis:'
                    : 'Click "Send WA" to preview auto-generated message:'}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                <div className="lg:col-span-7 rounded-2xl bg-white border border-[#D4AF37]/40 divide-y divide-stone-200/80 overflow-hidden">
                  {DUMMY_DASHBOARD_GUESTS.map((g) => {
                    const isSelected = selectedWaGuest.code === g.code;
                    const guestLink = `https://meplanner.vercel.app/?u=${g.code}`;
                    return (
                      <div
                        key={g.code}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSimSelectedWaGuestCode(g.code);
                        }}
                        className={`p-3.5 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                          isSelected ? 'bg-[#FAF3E3]/70' : 'hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                              {g.priority}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white border border-stone-200 text-stone-700 text-[9px] font-bold">
                              {g.pax} Pax • {g.format}
                            </span>
                          </div>
                          <p className="text-xs font-extrabold text-stone-900 truncate">
                            {g.name}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate">
                            {!g.institution ||
                            g.institution.trim() === '' ||
                            g.institution.trim() === '-'
                              ? 'di Tempat'
                              : g.institution}{' '}
                            • RSVP:{' '}
                            <strong className="text-emerald-700">{g.rsvp}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSimSelectedWaGuestCode(g.code);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-extrabold inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Send className="w-3 h-3" />
                            <span>Kirim WA</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopySimWaLink(g.code, guestLink);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-extrabold inline-flex items-center gap-1"
                          >
                            {copiedSimWaLinkKey === g.code ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" />
                                <span>Tersalin!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Salin Link</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Right 5 Cols: Live Auto-Generated WhatsApp Message Preview */}
                <div className="lg:col-span-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-50 via-[#F4FBF7] to-white text-stone-900 border border-emerald-300 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800">
                      {lang === 'ID'
                        ? 'Pratinjau Pesan WhatsApp Otomatis'
                        : 'Auto-Generated WhatsApp Preview'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 border border-emerald-300 text-emerald-800 font-mono text-[9px] font-extrabold">
                      {selectedWaGuest.pax} Pax • Link Personal
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-emerald-200 text-[11px] leading-relaxed space-y-2 font-sans text-stone-800 shadow-2xs">
                    <p>
                      Kepada Yth.{' '}
                      <strong className="text-emerald-800">
                        {selectedWaGuest.name}
                      </strong>
                    </p>
                    <p>
                      Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu
                      untuk menghadiri acara{' '}
                      <strong className="text-stone-900">
                        {activePreset.titleFull}
                      </strong>{' '}
                      pada <strong>{activePreset.eventDate}</strong> di{' '}
                      <strong>{activePreset.eventVenue}</strong>.
                    </p>
                    <p className="font-mono text-[10px] text-[#8B6914] break-all bg-[#FAF3E3]/70 p-2 rounded-lg border border-[#D4AF37]/40">
                      🔗 Link Undangan Personal: {waPreviewLink}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopySimWaLink('preview-wa', waPreviewLink);
                    }}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {copiedSimWaLinkKey === 'preview-wa' ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>✓ Link Undangan Dummy Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Salin Link &amp; Pesan WhatsApp Dummy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MODUL 5: STUDIO PENGATURAN UNDANGAN (1:1 REPLICA WIRA SATYA 96) */}
          {/* =============================================================== */}
          {moduleId === 'pengaturan' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              {/* Left Sidebar (Matching AdminDashboardView Settings Left Column 1:1) */}
              <div className="lg:col-span-3 rounded-3xl bg-white border border-[#D4AF37]/40 p-3.5 shadow-2xs space-y-1.5">
                <div className="px-2.5 py-1.5 border-b border-stone-100 mb-1">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                    {lang === 'ID'
                      ? 'Studio Pengaturan'
                      : 'Customization Studio'}
                  </p>
                  <p className="text-[11px] font-bold text-stone-500 truncate">
                    {activePreset.titleShort}
                  </p>
                </div>
                {[
                  {
                    id: 'konten',
                    label:
                      lang === 'ID' ? 'Konten Undangan' : 'Invitation Content',
                    sub: '9 Seksi & Ornamen',
                  },
                  {
                    id: 'tema',
                    label: lang === 'ID' ? 'Tema & Latar' : 'Theme & Media',
                    sub: '3 Slot Media & Video 25MB',
                  },
                  {
                    id: 'jadwal',
                    label: lang === 'ID' ? 'Jadwal Acara' : 'Event Schedule',
                    sub: '2 Sesi & Google Maps',
                  },
                  {
                    id: 'akun',
                    label: lang === 'ID' ? 'Akun & Akses' : 'Accounts & Roles',
                    sub: tierLoginLabel,
                  },
                  {
                    id: 'database',
                    label: lang === 'ID' ? 'Database' : 'Cloud & Backup',
                    sub: 'Supabase & JSON',
                  },
                ].map((nav) => {
                  const isAct = simStudioNavTab === nav.id;
                  return (
                    <button
                      key={nav.id}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSimStudioNavTab(nav.id);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-2xl transition-all flex items-center justify-between gap-2 ${
                        isAct
                          ? 'bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] text-white shadow-xs'
                          : 'bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-700 border border-transparent hover:border-[#D4AF37]/30'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-extrabold truncate">
                          {nav.label}
                        </p>
                        <p
                          className={`text-[10px] truncate ${
                            isAct ? 'text-white/90' : 'text-stone-500'
                          }`}
                        >
                          {nav.sub}
                        </p>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  );
                })}
              </div>

              {/* Right Content Panel (Switches dynamically between konten, tema, jadwal, akun, database) */}
              <div className="lg:col-span-9 rounded-3xl bg-white border border-[#D4AF37]/40 p-4 sm:p-6 shadow-2xs space-y-5">
                {simStudioNavTab === 'konten' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                          {lang === 'ID'
                            ? 'Manajemen Konten & 9 Seksi Undangan Publik'
                            : 'Public Invitation 9-Section Visibility & Ornaments'}
                        </span>
                        <h5 className="font-serif text-base font-extrabold text-stone-900">
                          {lang === 'ID'
                            ? 'Atur Visibilitas Seksi (ON/OFF Terhubung ke Undangan Dummy)'
                            : 'Toggle Section Visibility (Connected Live to Dummy Invitation)'}
                        </h5>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowcaseViewMode('invitation_sim');
                          setSimIsOpened(true);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white border border-[#B68D40] text-[11px] font-extrabold inline-flex items-center gap-1.5 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Hasil di Undangan</span>
                      </button>
                    </div>

                    {/* Visual Ornaments Quick Toggles */}
                    <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35 space-y-2">
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                        {lang === 'ID'
                          ? 'Ornamen Editorial & Lencana Atas Foto (Klik untuk Uji Coba):'
                          : 'Editorial Ornaments & Top Photo Badge (Click to Toggle):'}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          {
                            key: 'floralCorner' as const,
                            label: `🌸 Ornamen Sudut Floral: ${simStudioOrnaments.floralCorner ? 'ON' : 'OFF'}`,
                          },
                          {
                            key: 'heroBadge' as const,
                            label: `🏷️ Lencana Atas Foto Hero: ${simStudioOrnaments.heroBadge ? 'ON' : 'OFF (Default Bersih)'}`,
                          },
                          {
                            key: 'floatingParticles' as const,
                            label: `✨ Partikel Emas: ${simStudioOrnaments.floatingParticles ? 'ON' : 'OFF'}`,
                          },
                          {
                            key: 'calendarBtn' as const,
                            label: `📅 Tombol Google Calendar: ${simStudioOrnaments.calendarBtn ? 'ON' : 'OFF'}`,
                          },
                        ].map((tog) => (
                          <button
                            key={tog.key}
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSimStudioOrnaments((prev) => ({
                                ...prev,
                                [tog.key]: !prev[tog.key],
                              }));
                            }}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-extrabold border transition-all ${
                              simStudioOrnaments[tog.key]
                                ? 'bg-emerald-700 text-white border-emerald-600 shadow-2xs'
                                : 'bg-white text-stone-600 border-stone-300'
                            }`}
                          >
                            {tog.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 9 Invitation Section Cards matching AdminDashboardView */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {[
                        {
                          key: 'cover' as const,
                          num: '01',
                          title: 'Sampul & Judul Hero',
                          desc: 'Layar pembuka tirai & judul utama',
                        },
                        {
                          key: 'quote' as const,
                          num: '02',
                          title: 'Ayat / Kutipan Doa',
                          desc: 'Untaian doa & kutipan pembuka',
                        },
                        {
                          key: 'couple' as const,
                          num: '03',
                          title: 'Profil Tuan Rumah',
                          desc: `${activePreset.profileCount} Profil (${activePreset.frameStyle})`,
                        },
                        {
                          key: 'events' as const,
                          num: '04',
                          title: 'Rangkaian Acara',
                          desc: '2 Sesi Jadwal, Dresscode & Maps',
                        },
                        {
                          key: 'story' as const,
                          num: '05',
                          title: 'Kisah & Milestone',
                          desc: isStarterTier
                            ? '🔒 Eksklusif Paket EXCLUSIVE+'
                            : '3 Babak Perjalanan Hidup',
                        },
                        {
                          key: 'gallery' as const,
                          num: '06',
                          title: 'Galeri Momen HD',
                          desc: isStarterTier
                            ? '🔒 Eksklusif Paket EXCLUSIVE+'
                            : '12 Foto Pre-Event Ultra-HD',
                        },
                        {
                          key: 'rsvp' as const,
                          num: '07',
                          title: 'Konfirmasi RSVP',
                          desc: 'Form Kehadiran & Kuota Pax',
                        },
                        {
                          key: 'gift' as const,
                          num: '08',
                          title: 'Amplop Digital EMV',
                          desc: isRoyalTier
                            ? 'Bank, QRIS, PayPal & Crypto USDT'
                            : 'Transfer Bank & QRIS (Domestik)',
                        },
                        {
                          key: 'wishes' as const,
                          num: '09',
                          title: 'Ucapan & Penutup',
                          desc: 'Buku Tamu Live & Balasan Host',
                        },
                      ].map((sec) => {
                        const isOn = simSectionToggles[sec.key];
                        return (
                          <div
                            key={sec.key}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSimSectionToggles((prev) => ({
                                ...prev,
                                [sec.key]: !prev[sec.key],
                              }));
                            }}
                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-2 ${
                              isOn
                                ? 'bg-[#FAF3E3]/55 border-[#D4AF37]/60 shadow-2xs'
                                : 'bg-stone-50 border-stone-200 opacity-75'
                            }`}
                          >
                            <div className="min-w-0 space-y-0.5">
                              <span className="text-[9px] font-mono font-extrabold text-[#8B6914]">
                                SEKSI {sec.num}
                              </span>
                              <p className="text-xs font-extrabold text-stone-900 truncate">
                                {sec.title}
                              </p>
                              <p className="text-[10px] text-stone-500 truncate">
                                {sec.desc}
                              </p>
                            </div>
                            <span
                              className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                                isOn
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-stone-300 text-stone-700'
                              }`}
                            >
                              {isOn ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {simStudioNavTab === 'tema' && (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-200/80">
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                          {lang === 'ID'
                            ? 'Arsitektur 3 Slot Media Terpisah & Video Latar 25 MB'
                            : '3 Separate Media Slots & 25 MB Video Background'}
                        </span>
                        <h5 className="font-serif text-base font-extrabold text-stone-900">
                          {activePreset.titleShort} — Tema, Foto &amp; Video
                          Sinematik
                        </h5>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                        ✓ Supabase CDN Aktif
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[9px] font-extrabold">
                          1. SAMPUL DEPAN (COVER)
                        </span>
                        <div className="h-24 rounded-xl overflow-hidden relative border border-stone-300">
                          <img
                            src={activePreset.galleryPhotos[0].url}
                            alt="Cover Slot"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-white/90 text-stone-900 border border-stone-200 text-[9px] font-bold shadow-2xs">
                            {isStarterTier
                              ? '1 Foto HD'
                              : '3 Foto HD • Slideshow'}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-stone-600">
                          Maks 10 MB/foto + Interactive Studio Cropper
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[9px] font-extrabold">
                          2. BANNER HERO ATAS
                        </span>
                        <div className="h-24 rounded-xl overflow-hidden relative border border-stone-300">
                          <img
                            src={activePreset.galleryPhotos[1].url}
                            alt="Hero Slot"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-white/90 text-stone-900 border border-stone-200 text-[9px] font-bold shadow-2xs">
                            Feathered Alpha-Mask
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-stone-600">
                          Transisi gradasi menyatu mulus dengan kertas krem
                        </p>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-2">
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[9px] font-extrabold">
                          3. WALLPAPER &amp; VIDEO 25 MB
                        </span>
                        <div className="h-24 rounded-xl overflow-hidden relative border border-stone-300 bg-[#FAF3E3]">
                          <img
                            src={activePreset.galleryPhotos[2].url}
                            alt="Wallpaper Slot"
                            className="w-full h-full object-cover opacity-85"
                          />
                          <span className="absolute inset-0 flex items-center justify-center text-stone-900 text-[10px] font-extrabold bg-white/65 backdrop-blur-2xs">
                            {isStarterTier
                              ? '🔒 Video 25MB (EXCLUSIVE+)'
                              : '🎬 MP4 18.4 MB Aktif'}
                          </span>
                        </div>
                        <p className="text-[10px] font-bold text-stone-600">
                          Mode Video: Auto-Stretch Responsif (9:16 HP ↔ 16:9 PC)
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600">
                          Gaya Transisi Slideshow Latar:
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            { id: 'CROSSFADE' as const, label: 'Crossfade Halus' },
                            { id: 'ZOOM_BLUR' as const, label: 'Zoom & Blur' },
                            { id: 'SLIDE' as const, label: 'Geser Sinematik' },
                          ].map((tr) => (
                            <button
                              key={tr.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSimStudioTransition(tr.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                                simStudioTransition === tr.id
                                  ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40]'
                                  : 'bg-white text-stone-700 border-stone-300'
                              }`}
                            >
                              {tr.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600">
                          Mode Fit Video Latar (MP4/WebM s/d 25 MB):
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {[
                            {
                              id: 'AUTO_STRETCH' as const,
                              label: 'Auto-Stretch (HP & PC)',
                            },
                            {
                              id: 'COVER_CENTER' as const,
                              label: 'Cover Center Proporsional',
                            },
                            { id: 'CONTAIN_FULL' as const, label: 'Contain Utuh' },
                          ].map((vf) => (
                            <button
                              key={vf.id}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSimVideoFitMode(vf.id);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                                simVideoFitMode === vf.id
                                  ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40]'
                                  : 'bg-white text-stone-700 border-stone-300'
                              }`}
                            >
                              {vf.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {simStudioNavTab === 'jadwal' && (
                  <div className="space-y-3">
                    <h5 className="font-serif text-base font-extrabold text-stone-900">
                      {lang === 'ID'
                        ? 'Pengaturan 2 Sesi Acara & Titik Koordinat Google Maps'
                        : '2 Event Sessions & Google Maps Pin Configuration'}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {activePreset.sessions.map((ses) => (
                        <div
                          key={ses.badge}
                          className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-1.5"
                        >
                          <span className="px-2 py-0.5 rounded bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] font-mono text-[9px] font-extrabold">
                            {ses.badge}
                          </span>
                          <p className="text-sm font-extrabold text-stone-900">
                            {ses.title}
                          </p>
                          <p className="text-xs font-bold text-[#8B6914]">
                            {ses.date} • {ses.time}
                          </p>
                          <p className="text-xs text-stone-600">{ses.venue}</p>
                          <p className="text-[11px] text-stone-500">
                            Dresscode: <strong>{ses.dresscode}</strong>
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {simStudioNavTab === 'akun' && (
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h5 className="font-serif text-base font-extrabold text-stone-900">
                        Manajemen Akun Login Keluarga &amp; Tim Panitia EO/WO
                      </h5>
                      <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white text-[10px] font-extrabold">
                        Paket {simPackageTier}: {tierLoginLabel}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        {
                          role: 'Akun Utama 1 (Host / Mempelai Pria)',
                          user: `${clientSlug}_host1`,
                          status: 'AKTIF',
                        },
                        {
                          role: 'Akun Utama 2 (Co-Host / Mempelai Wanita)',
                          user: `${clientSlug}_host2`,
                          status: 'AKTIF',
                        },
                        {
                          role: 'Akun Keluarga Pria (Orang Tua)',
                          user: `${clientSlug}_kel1`,
                          status: isStarterTier ? '🔒 EXCLUSIVE+' : 'AKTIF',
                        },
                        {
                          role: 'Akun Koordinator Panitia EO / WO',
                          user: `${clientSlug}_wo1`,
                          status: isStarterTier
                            ? '🔒 EXCLUSIVE+'
                            : isRoyalTier
                              ? 'UNLIMITED WO'
                              : '3 AKUN WO',
                        },
                      ].map((acc) => (
                        <div
                          key={acc.user}
                          className="p-3 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex items-center justify-between gap-2"
                        >
                          <div>
                            <p className="text-xs font-extrabold text-stone-900">
                              {acc.role}
                            </p>
                            <p className="font-mono text-[10px] text-stone-500">
                              ID: {acc.user}
                            </p>
                          </div>
                          <span className="px-2.5 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold">
                            {acc.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {simStudioNavTab === 'database' && (
                  <div className="space-y-3">
                    <h5 className="font-serif text-base font-extrabold text-stone-900">
                      Sinkronisasi Cloud Supabase, Google Sheets &amp; Backup JSON
                    </h5>
                    <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-950">
                      <p className="font-extrabold">
                        ✓ Workspace Terhubung ke Cloud Database &amp; CDN Storage
                      </p>
                      <p className="text-[11px] leading-relaxed">
                        Seluruh perubahan checklist, kontrak vendor, daftar tamu
                        VIP, dan foto/video undangan otomatis tersimpan secara
                        real-time serta dapat diekspor ke file Backup JSON kapan
                        saja.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
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

  const getEventCategoryLabel = (
    eventType: EventCategoryType,
    currentLang: 'ID' | 'EN'
  ): string => {
    switch (eventType) {
      case 'WEDDING':
        return currentLang === 'ID' ? '💍 Pernikahan' : '💍 Wedding';
      case 'BIRTHDAY':
        return currentLang === 'ID' ? '🎂 Ulang Tahun' : '🎂 Birthday';
      case 'GRADUATION':
        return currentLang === 'ID' ? '🎓 Wisuda' : '🎓 Graduation';
      case 'MEETING':
        return currentLang === 'ID' ? '🏛️ Rapat Resmi' : '🏛️ Corporate';
      case 'GALA_DINNER':
        return currentLang === 'ID' ? '🥂 Gala Dinner' : '🥂 Gala Dinner';
      default:
        return currentLang === 'ID' ? '💍 Pernikahan' : '💍 Wedding';
    }
  };

  const handleQuickLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLookupSuggestions(false);
    const cleanKey = guestCodeInput.trim();
    if (!cleanKey) {
      setLookupGateError(
        lang === 'ID'
          ? 'Key undangan tidak valid atau tidak ditemukan. Pastikan Anda memasukkan Key unik yang dikirimkan kepada Anda.'
          : 'Invalid or unknown Invitation Key. Please enter the exact unique Key sent to you.'
      );
      return;
    }

    const exactKeyMatch = allSearchableClientGuests.find(
      (item) => item.hashToken === cleanKey
    );
    if (exactKeyMatch) {
      setLookupGateError(null);
      setIsGuestLookupModalOpen(false);
      onSelectClientInvitation(
        exactKeyMatch.clientId,
        exactKeyMatch.guest.guestName,
        exactKeyMatch.hashToken
      );
      return;
    }

    setLookupGateError(
      lang === 'ID'
        ? 'Key undangan tidak valid atau tidak ditemukan. Pastikan Anda memasukkan Key unik yang dikirimkan kepada Anda.'
        : 'Invalid or unknown Invitation Key. Please enter the exact unique Key sent to you.'
    );
  };

  return (
    <div className="min-h-screen pt-16 sm:pt-18 overflow-x-clip bg-white text-stone-900 flex flex-col justify-between selection:bg-[#9E1B46]/15">
      {/* CLEAN TOP NAVBAR — WEVITATION-INSPIRED AIRY EDITORIAL HEADER REBRANDED AS MEPLANNER */}
      <header className="fixed top-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-b border-stone-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3">
          {/* Left: Logo + MEPlanner (online event & wedding invitation) */}
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={() => setIsCheckoutPageOpen(false)}
              className="flex items-center justify-center shrink-0 hover:scale-105 transition-transform cursor-pointer"
              title="MEPlanner — online event & wedding invitation"
            >
              <WeddingRingsIcon
                className="w-8 h-8 sm:w-9 sm:h-9"
                logoUrl={(primarySettings as any).brandLogoUrl}
              />
            </button>
            <div className="min-w-0">
              <button
                type="button"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="font-sans font-extrabold text-base sm:text-xl text-stone-900 tracking-tight leading-none text-left block cursor-pointer"
              >
                ME<span className="text-[#9E1B46]">Planner</span>
              </button>
              <p className="text-[10px] sm:text-[11px] font-medium text-stone-500 leading-tight truncate mt-0.5">
                online event &amp; wedding invitation
              </p>
            </div>
          </div>

          {/* Right: Clean Borderless Text Links + Cek Undangan + ID/EN + Solid Burgundy Login Button */}
          <div className="flex items-center gap-3 sm:gap-6 shrink-0">
            <nav className="hidden md:flex items-center gap-5 lg:gap-6">
              <a
                href="#"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="text-sm font-medium text-stone-700 hover:text-[#9E1B46] transition-colors"
              >
                {lang === 'ID' ? 'Beranda' : 'Home'}
              </a>
              <a
                href="#tema"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="text-sm font-medium text-stone-700 hover:text-[#9E1B46] transition-colors"
              >
                {lang === 'ID' ? 'Tema' : 'Themes'}
              </a>
              <a
                href="#fitur"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="text-sm font-medium text-stone-700 hover:text-[#9E1B46] transition-colors"
              >
                {lang === 'ID' ? 'Fitur' : 'Features'}
              </a>
              <a
                href="#paket"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="text-sm font-medium text-stone-700 hover:text-[#9E1B46] transition-colors"
              >
                {lang === 'ID' ? 'Harga' : 'Pricing'}
              </a>
              <a
                href="#blog"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="text-sm font-medium text-stone-700 hover:text-[#9E1B46] transition-colors"
              >
                Blog
              </a>
              <a
                href="#faq"
                onClick={() => setIsCheckoutPageOpen(false)}
                className="text-sm font-medium text-stone-700 hover:text-[#9E1B46] transition-colors"
              >
                FAQ
              </a>
            </nav>

            <button
              type="button"
              onClick={() => {
                setLookupGateError(null);
                setGuestCodeInput('');
                setIsGuestLookupModalOpen(true);
              }}
              className="text-xs sm:text-sm font-semibold text-stone-700 hover:text-[#9E1B46] transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              title={
                lang === 'ID'
                  ? 'Cek Undangan dengan Key Unik'
                  : 'Check Invitation by Unique Key'
              }
            >
              <KeyRound className="w-3.5 h-3.5 text-[#9E1B46] shrink-0" />
              <span>{lang === 'ID' ? 'Cek Undangan' : 'Check Invitation'}</span>
            </button>

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
              className="text-xs sm:text-sm font-semibold text-stone-600 hover:text-[#9E1B46] transition-colors cursor-pointer"
              title={
                lang === 'ID'
                  ? 'Switch Language to English (EN)'
                  : 'Ganti Bahasa ke Indonesia (ID)'
              }
            >
              {lang}
            </button>

            <button
              type="button"
              onClick={() => onOpenAdminPortal()}
              className="px-5 py-2 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              {isAdminLoggedIn
                ? lang === 'ID'
                  ? 'Dashboard'
                  : 'Dashboard'
                : 'Login'}
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
                      ? 'bg-[#8B6914] text-white border-[#8B6914] ring-2 ring-[#D4AF37]/40'
                      : 'bg-white text-[#8B6914] border-[#D4AF37]/40 hover:bg-[#FAF3E3]'
                  }`}
                >
                  <span className="sm:hidden truncate">
                    1. {lang === 'ID' ? 'Metode' : 'Method'}
                  </span>
                  <span className="hidden sm:inline truncate">
                    1.{' '}
                    {lang === 'ID'
                      ? `Identitas & Metode (${activeSelectedPackage.name})`
                      : `Identity & Method (${activeSelectedPackage.name})`}
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
                      ? 'bg-[#8B6914] text-white border-[#8B6914] ring-2 ring-[#D4AF37]/40'
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
                      ? 'bg-emerald-700 text-white border-emerald-600 ring-2 ring-emerald-400/40'
                      : hasCompletedPayment
                        ? 'bg-emerald-600 text-white border-emerald-500 hover:bg-emerald-700'
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
              {/* LEFT COLUMN (lg:col-span-5): INVOICE SUMMARY, 6-PACKAGE SWITCHER & IDEMPOTENCY PROTECTION */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 min-w-0 space-y-5">
                <div className="rounded-3xl bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E3] to-[#F3E5C8] text-stone-900 border-2 border-[#D4AF37] p-5 sm:p-6 shadow-[0_16px_40px_rgba(182,141,64,0.16)] space-y-5 min-w-0 overflow-hidden">
                  {/* Quick 6-Tier Switcher Tabs (Gratis, Premium, Business, Enterprise, Mitra Silver, Mitra Gold) */}
                  <div className="space-y-1.5 min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                      {lang === 'ID'
                        ? 'Pilih / Ganti Paket Resmi MEPlanner:'
                        : 'Select / Switch Official MEPlanner Package:'}
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 min-w-0">
                      {commercialPackages.map((pkgItem) => {
                        const isSelectedPkg =
                          activeSelectedPackage.id === pkgItem.id;
                        return (
                          <button
                            key={pkgItem.id}
                            type="button"
                            onClick={() => {
                              setSelectedWevPackageId(pkgItem.id);
                              setSelectedCheckoutTier(pkgItem.tier);
                            }}
                            className={`min-w-0 truncate py-2 px-2 rounded-xl border border-[#D4AF37]/45 text-[10px] font-extrabold transition-all flex flex-col items-center justify-center ${
                              isSelectedPkg
                                ? 'bg-gradient-to-r from-[#C5A059] to-[#9A742B] text-white shadow-2xs'
                                : 'bg-white/85 text-stone-800 hover:bg-white'
                            }`}
                          >
                            <span className="truncate max-w-full">
                              {pkgItem.name}
                            </span>
                            <span
                              className={`text-[9px] font-mono ${
                                isSelectedPkg ? 'text-amber-100' : 'text-[#8B6914]'
                              }`}
                            >
                              {pkgItem.priceMain}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Package Details */}
                  <div className="space-y-3 pt-2 border-t border-[#D4AF37]/30 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-white/90 border border-[#D4AF37]/50 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                        {activeSelectedPackage.badge}
                      </span>
                      <span className="text-[10px] font-mono text-stone-600">
                        {activeTransaction?.orderId || currentOrderId}
                      </span>
                    </div>

                    <div className="space-y-0.5">
                      <h2 className="font-serif text-2xl font-extrabold text-stone-900">
                        Paket {activeSelectedPackage.name}
                      </h2>
                      <p className="text-xs text-stone-700">
                        {activeSelectedPackage.subtitle}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/90 border border-[#D4AF37]/45 space-y-1.5 shadow-2xs">
                      <div className="flex flex-wrap items-center justify-between gap-1.5">
                        <p className="text-[10px] uppercase tracking-widest text-[#8B6914] font-extrabold">
                          {lang === 'ID'
                            ? 'Total Tagihan Resmi MEPlanner'
                            : 'Official MEPlanner License Amount'}
                        </p>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9px] font-extrabold">
                          {activeSelectedPackage.discountBadge}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2.5 flex-wrap">
                        <span className="text-3xl font-extrabold text-stone-900">
                          {activeCheckoutAmountDisplay}
                        </span>
                        <span className="text-xs font-bold line-through text-stone-400">
                          {activeSelectedPackage.priceStrike}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-[#8B6914]">
                        {activeSelectedPackage.normalPriceLabel} &rarr;{' '}
                        MEPlanner: {activeSelectedPackage.priceMain}
                      </p>
                      <p className="text-[11px] text-stone-600">
                        {activeSelectedPackage.priceSubBadge}
                      </p>
                    </div>

                    <div className="space-y-2 pt-1">
                      <p className="text-[11px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                        {lang === 'ID'
                          ? 'Fitur & Fasilitas Paket:'
                          : 'Included Plan Features:'}
                      </p>
                      <ul className="space-y-2 text-xs text-stone-800">
                        {activeSelectedPackage.features.map((feat) => (
                          <li key={feat} className="flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-[#B68D40] shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Transaction Security & Anti-Duplicate Protection Box */}
                  <div className="p-4 rounded-2xl bg-white/90 border border-[#D4AF37]/40 space-y-2 text-xs min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-extrabold text-[#8B6914] flex items-center gap-1.5">
                        <Shield className="w-4 h-4 text-[#B68D40] shrink-0" />
                        <span>
                          {lang === 'ID'
                            ? 'Jaminan Transaksi Aman Anti-Duplikat'
                            : 'Safe & Anti-Duplicate Transaction Protection'}
                        </span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                        RESMI &amp; AMAN
                      </span>
                    </div>
                    <div className="font-mono text-[10px] text-stone-700 space-y-0.5 bg-[#FAF8F5] p-2.5 rounded-xl border border-stone-200/90 min-w-0 overflow-hidden">
                      <p className="truncate">
                        <span className="text-stone-500">Order ID:</span>{' '}
                        <strong className="text-stone-900">
                          {activeTransaction?.orderId || currentOrderId}
                        </strong>
                      </p>
                      <p className="truncate">
                        <span className="text-stone-500">
                          {lang === 'ID'
                            ? 'Kode Unik Transaksi:'
                            : 'Unique Transaction Key:'}
                        </span>{' '}
                        <strong className="text-[#8B6914]">
                          {activeTransaction?.idempotencyKey ||
                            currentIdempotencyKey}
                        </strong>
                      </p>
                    </div>
                    <p className="text-[11px] text-stone-600 leading-relaxed">
                      {lang === 'ID'
                        ? 'Dilindungi Sistem Keamanan Transaksi: Jika koneksi terputus saat konfirmasi, Anda dapat mengulangi verifikasi kapan saja tanpa khawatir pesanan ganda.'
                        : 'Protected by Transaction Security: If your connection drops during confirmation, you can safely retry without duplicate orders.'}
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
                                      ? 'bg-gradient-to-br from-[#C5A059] to-[#B68D40] text-white shadow-2xs'
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
                          ? 'Lanjut ke Pembayaran Otomatis (Langkah 2)'
                          : 'Proceed to Automated Payment (Step 2)'}
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
                        className="max-w-full inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/50 text-[#8B6914] text-xs font-mono font-extrabold shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
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
                          className="w-full max-w-full py-2 px-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                        >
                          {copiedPaymentKey === 'target-wallet' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white shrink-0" />
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
                          className="w-full max-w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white border border-[#B68D40] font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all text-center leading-snug"
                        >
                          <Coins className="w-4 h-4 text-white shrink-0" />
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

                    {/* Timeout Recovery Banner inside Step 2 */}
                    {activeTransaction?.status === 'FAILED_TIMEOUT' && (
                      <div className="p-4 rounded-2xl bg-amber-50 text-stone-900 border-2 border-amber-400 shadow-sm space-y-3 min-w-0">
                        <div className="flex items-start gap-3 min-w-0">
                          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                          <div className="space-y-1 text-xs leading-relaxed min-w-0">
                            <p className="font-extrabold text-amber-800 uppercase tracking-wider">
                              {lang === 'ID'
                                ? `Peringatan Koneksi Terputus (Percobaan #${activeTransaction.retryCount || 0})`
                                : `Network Interrupted (Retry #${activeTransaction.retryCount || 0})`}
                            </p>
                            <p className="text-stone-700">{activeTransaction.lastErrorOrTimeoutReason}</p>
                            <p className="font-mono text-[10px] text-[#8B6914] break-all">
                              {lang === 'ID' ? 'Kode Unik Transaksi:' : 'Unique Transaction Key:'}{' '}
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
                              ? 'Ulangi Verifikasi Pembayaran'
                              : 'Retry Payment Verification'}
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
                          {lang === 'ID' ? 'Kode Unik Transaksi:' : 'Unique Transaction Key:'} {currentIdempotencyKey}
                        </span>
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
                  <div className="rounded-3xl bg-gradient-to-br from-emerald-50/90 via-[#FFFDF9] to-amber-50/60 border-2 border-emerald-400 text-stone-900 p-5 sm:p-7 shadow-[0_18px_45px_rgba(16,185,129,0.12)] space-y-5 animate-fadeIn min-w-0 overflow-hidden">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-emerald-200">
                      <div className="min-w-0">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-800">
                          {lang === 'ID'
                            ? 'Langkah 3 dari 3 • Pembayaran Tercatat & Sertifikat Keamanan'
                            : 'Step 3 of 3 • Payment Recorded & Security Certificate'}
                        </span>
                        <h3 className="font-serif text-xl sm:text-2xl font-extrabold text-stone-900 mt-0.5 flex items-center gap-2">
                          <FileCheck2 className="w-6 h-6 text-emerald-600 shrink-0" />
                          <span>
                            {lang === 'ID'
                              ? 'Bukti Konfirmasi Pembayaran Resmi'
                              : 'Official Payment Confirmation Certificate'}
                          </span>
                        </h3>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                          activeTransaction?.onChainVerified ||
                          activeTransaction?.status === 'PAID_VERIFIED'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]'
                        }`}
                      >
                        {activeTransaction?.onChainVerified
                          ? '⛓️ PAID_VERIFIED (On-Chain Confirmed)'
                          : activeTransaction?.status === 'PAID_VERIFIED'
                            ? lang === 'ID'
                              ? '✓ LUNAS TERVERIFIKASI'
                              : '✓ PAID_VERIFIED'
                            : lang === 'ID'
                              ? '⏳ MENUNGGU VERIFIKASI (MAKS. H+3)'
                              : '⏳ PENDING VERIFICATION (MAX D+3)'}
                      </span>
                    </div>

                    {/* Digital Certificate Details */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-white p-4 rounded-2xl border border-emerald-200 text-stone-800 font-mono min-w-0 shadow-2xs">
                      <div className="min-w-0">
                        <span className="text-emerald-700 text-[10px] font-bold block">
                          Order ID:
                        </span>
                        <strong className="text-stone-900 break-all">
                          {activeTransaction?.orderId || currentOrderId}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-emerald-700 text-[10px] font-bold block">
                          {lang === 'ID'
                            ? 'Kode Unik Transaksi:'
                            : 'Unique Transaction Key:'}
                        </span>
                        <strong className="text-[#8B6914] break-all">
                          {activeTransaction?.idempotencyKey ||
                            currentIdempotencyKey}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-emerald-700 text-[10px] font-bold block">
                          {lang === 'ID'
                            ? 'Paket & Nominal:'
                            : 'Plan & Amount:'}
                        </span>
                        <strong className="text-stone-900 break-words">
                          {activeTransaction?.packageTier ||
                            selectedCheckoutTier}{' '}
                          •{' '}
                          {activeTransaction?.amountDisplay ||
                            activeCheckoutAmountDisplay}
                        </strong>
                      </div>
                      <div className="min-w-0">
                        <span className="text-emerald-700 text-[10px] font-bold block">
                          {lang === 'ID'
                            ? 'Metode & Referensi:'
                            : 'Wallet & Reference:'}
                        </span>
                        <strong className="text-stone-900 break-all">
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
                            className="max-w-full inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37] text-[#8B6914] text-xs font-extrabold transition-all"
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
                          <span className="max-w-full inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-extrabold break-all">
                            🚀 Workspace Klien Otomatis Siap (
                            {activeTransaction.provisionedClientId})
                          </span>
                        )}
                      </div>
                    )}

                    {/* Exact SLA Message & Priority Email Contact */}
                    <div className="p-4 rounded-2xl bg-white border border-[#D4AF37]/50 flex items-start gap-3 min-w-0 shadow-2xs">
                      <div className="w-9 h-9 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/50 text-[#8B6914] flex items-center justify-center shrink-0 mt-0.5">
                        <Clock className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5 text-xs sm:text-sm text-stone-700 leading-relaxed min-w-0">
                        {lang === 'ID' ? (
                          <p>
                            Terima kasih! Pembayaran Anda telah tercatat. Tim
                            kami akan menghubungi Anda melalui email maksimal{' '}
                            <strong className="text-[#8B6914] underline decoration-[#D4AF37]/60 underline-offset-2">
                              H+3 setelah pembayaran
                            </strong>{' '}
                            untuk pengiriman akses 4 Akun Default &amp;
                            Workspace Klien. Untuk konfirmasi bukti bayar
                            prioritas, silakan hubungi:{' '}
                            <a
                              href={mailtoPostPaymentUrl}
                              className="font-extrabold text-emerald-700 underline hover:text-emerald-900 break-all"
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
                            <strong className="text-[#8B6914] underline decoration-[#D4AF37]/60 underline-offset-2">
                              3 days (D+3) after payment
                            </strong>{' '}
                            with your 4 Core Accounts &amp; Client Workspace
                            credentials. For priority payment receipt
                            confirmation, please contact:{' '}
                            <a
                              href={mailtoPostPaymentUrl}
                              className="font-extrabold text-emerald-700 underline hover:text-emerald-900 break-all"
                            >
                              {businessEmail}
                            </a>
                            .
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons on Step 3 */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-emerald-200 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCheckoutPageOpen(false);
                            if (onQuickCreateWithGoogle) {
                              onQuickCreateWithGoogle({
                                email:
                                  buyerEmail.trim() || 'klien@gmail.com',
                                displayName:
                                  buyerCoupleName.trim() || 'Rayhan & Clarissa',
                                eventTitle:
                                  buyerCoupleName.trim() || 'Rayhan & Clarissa',
                                eventType:
                                  activeCatalogTheme?.eventType ||
                                  simEventType ||
                                  'WEDDING',
                                packageId: selectedWevPackageId,
                                catalogThemeId: activeCatalogTheme?.id,
                                catalogThemeName: activeCatalogTheme?.name,
                                themePreset: activeCatalogTheme?.themePreset,
                                themeLayoutArchetype:
                                  activeCatalogTheme?.layoutArchetype,
                                coverImageUrl:
                                  activeCatalogTheme?.coverBgUrl ||
                                  activeCatalogTheme?.thumbnailUrl,
                                heroImageUrl:
                                  activeCatalogTheme?.heroPrewedUrl ||
                                  activeCatalogTheme?.thumbnailUrl,
                              });
                            } else if (onOpenDemoManager) {
                              onOpenDemoManager(
                                activeDummyMeta.id,
                                simPackageTier,
                                activeCatalogTheme?.id
                              );
                            } else {
                              onOpenAdminPortal();
                            }
                          }}
                          className="max-w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm transition-all text-center leading-snug cursor-pointer"
                        >
                          <LayoutDashboard className="w-4 h-4 shrink-0" />
                          <span className="min-w-0 break-words">
                            {lang === 'ID'
                              ? '🚀 Buka Management Planner Sesuai Paket Ini'
                              : '🚀 Open Management Planner for This Package'}
                          </span>
                        </button>
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
                          className="max-w-full py-2.5 px-3.5 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 font-bold text-xs inline-flex items-center gap-1.5 transition-all shadow-2xs"
                        >
                          {copiedPaymentKey === 'official-email' ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span>
                                {lang === 'ID'
                                  ? 'Email Tersalin!'
                                  : 'Email Copied!'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#8B6914] shrink-0" />
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
                        className="max-w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FAF3E3] border border-stone-200 text-stone-700 text-xs font-bold transition-all shadow-2xs"
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
          /* MAIN LANDING PAGE VIEW — CLEAN AIRY WEVITATION-INSPIRED LAYOUT REBRANDED AS MEPLANNER */
          <>
            {/* ================================================================= */}
            {/* SECTION 1: CLEAN SPLIT HERO WITH REALISTIC IPHONE 15 PRO MOCKUP   */}
            {/* ================================================================= */}
            <section className="bg-[#FCF5F6] py-14 sm:py-20 border-b border-rose-100/70">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                {/* Left 7 Cols */}
                <div className="lg:col-span-7 text-left">
                  <h1 className="font-editorial text-3xl sm:text-5xl lg:text-[52px] font-bold text-stone-900 leading-[1.15] tracking-tight">
                    {lang === 'ID'
                      ? 'Undangan Digital Modern & Elegan, Siap Dibagikan Dalam Hitungan Menit'
                      : 'Modern & Elegant Digital Invitations, Ready to Share in Minutes'}
                  </h1>

                  <p className="text-stone-600 text-sm sm:text-base leading-relaxed mt-5 max-w-xl">
                    {lang === 'ID'
                      ? 'Buat undangan digital yang cantik, cepat dan mudah diedit – lengkap dengan RSVP Online, Galeri, Musik, Kado, Event Planner dan fitur AI yang membantu persiapan hari bahagiamu.'
                      : 'Create beautiful, fast, and easy-to-edit digital invitations – complete with Online RSVP, Gallery, Music, Gift Registry, Event Planner, and AI features for your special day.'}
                  </p>

                  {/* 2 Clean CTA Buttons */}
                  <div className="mt-7 flex flex-wrap items-center gap-3.5">
                    <button
                      type="button"
                      onClick={() => onOpenAdminPortal()}
                      className="px-6 py-3.5 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white font-bold text-sm shadow-sm transition-all cursor-pointer"
                    >
                      {lang === 'ID'
                        ? 'Buat Undangan Gratis'
                        : 'Create Free Invitation'}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        document
                          .getElementById('tema')
                          ?.scrollIntoView({ behavior: 'smooth' })
                      }
                      className="px-6 py-3.5 rounded-xl bg-white hover:bg-rose-50 text-[#9E1B46] border border-[#E6A8B8] font-bold text-sm transition-all cursor-pointer"
                    >
                      {lang === 'ID' ? 'Lihat Demo' : 'View Demo'}
                    </button>
                  </div>

                  {/* Single-Line Social Proof Stats */}
                  <div className="mt-8 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-stone-600">
                    <div>
                      <strong className="font-bold text-stone-900">
                        203.4K+
                      </strong>{' '}
                      {lang === 'ID' ? 'Pasangan & Acara' : 'Couples & Events'}
                    </div>
                    <span className="text-stone-300">|</span>
                    <div>
                      <strong className="font-bold text-stone-900">
                        3.1M+
                      </strong>{' '}
                      {lang === 'ID' ? 'Tamu Undangan' : 'Invited Guests'}
                    </div>
                    <span className="text-stone-300">|</span>
                    <div>
                      <strong className="font-bold text-stone-900">
                        561.1K+
                      </strong>{' '}
                      {lang === 'ID' ? 'Ucapan & Doa' : 'Wishes & Prayers'}
                    </div>
                  </div>
                </div>

                {/* Right 5 Cols — Realistic iPhone 15 Pro Mockup Frame */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  {(() => {
                    const heroThemes = MULTI_EVENT_THEME_CATALOG.slice(0, 8);
                    const currentPhoneTheme =
                      activeCatalogTheme || heroThemes[0];
                    const phoneCoverImg =
                      currentPhoneTheme?.coverBgUrl ||
                      currentPhoneTheme?.thumbnailUrl ||
                      activeDummyState.settings.coverBgUrl;

                    return (
                      <>
                        <div
                          onClick={() => {
                            if (currentPhoneTheme) {
                              handleApplyCatalogThemeDemo(currentPhoneTheme);
                            } else {
                              openSimInvitationLightbox();
                            }
                          }}
                          title={
                            lang === 'ID'
                              ? 'Klik layar HP untuk membuka Demo Interaktif'
                              : 'Click phone screen to open Interactive Demo'
                          }
                          className="w-[270px] sm:w-[295px] mx-auto rounded-[46px] border-[10px] border-stone-900 bg-white shadow-[0_25px_60px_rgba(0,0,0,0.18)] overflow-hidden relative cursor-pointer group"
                        >
                          {/* Inside Phone Screen */}
                          <div className="h-[500px] overflow-hidden relative bg-stone-950 flex flex-col justify-between">
                            {/* Background Cover Photo */}
                            <img
                              src={phoneCoverImg}
                              alt={
                                currentPhoneTheme?.name || 'Invitation Preview'
                              }
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-stone-950/60 via-stone-950/40 to-stone-950/85" />

                            {/* Top Dynamic Island Pill */}
                            <div className="relative z-10 pt-2">
                              <div className="w-24 h-5 bg-stone-950 rounded-full mx-auto shadow-inner" />
                            </div>

                            {/* Center Couple Names & Countdown Circles */}
                            <div className="relative z-10 px-5 text-center text-white space-y-3 my-auto">
                              <p className="text-[10px] uppercase tracking-[0.25em] text-rose-100 font-semibold">
                                {currentPhoneTheme?.eventType === 'BIRTHDAY'
                                  ? 'BIRTHDAY CELEBRATION'
                                  : currentPhoneTheme?.eventType ===
                                      'GRADUATION'
                                    ? 'GRADUATION CELEBRATION'
                                    : currentPhoneTheme?.eventType === 'MEETING'
                                      ? 'EXECUTIVE SUMMIT'
                                      : currentPhoneTheme?.eventType ===
                                          'GALA_DINNER'
                                        ? 'ROYAL GALA DINNER'
                                        : 'THE WEDDING OF'}
                              </p>
                              <h3 className="font-editorial italic text-2xl sm:text-3xl font-bold tracking-wide text-white drop-shadow-sm">
                                {activeDummyMeta.coupleLabel}
                              </h3>
                              <p className="text-[11px] text-white/90 font-medium">
                                {currentPhoneTheme?.name ||
                                  activeDummyMeta.themeLabel}
                              </p>

                              {/* 4 Countdown Circles */}
                              <div className="grid grid-cols-4 gap-2 pt-2 max-w-[220px] mx-auto">
                                {[
                                  { val: '151', label: 'Days' },
                                  { val: '22', label: 'Hrs' },
                                  { val: '12', label: 'Min' },
                                  { val: '36', label: 'Sec' },
                                ].map((cd) => (
                                  <div
                                    key={cd.label}
                                    className="rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 py-2 px-1 text-center"
                                  >
                                    <p className="text-xs font-extrabold text-white leading-none">
                                      {cd.val}
                                    </p>
                                    <p className="text-[9px] text-rose-100 mt-0.5">
                                      {cd.label}
                                    </p>
                                  </div>
                                ))}
                              </div>

                              {/* Guest Name Box */}
                              <div className="pt-2">
                                <div className="inline-block px-4 py-2 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25">
                                  <p className="text-[9px] uppercase tracking-widest text-rose-100">
                                    To:
                                  </p>
                                  <p className="text-xs font-bold text-white mt-0.5">
                                    {lang === 'ID'
                                      ? 'Tamu Kehormatan'
                                      : 'Honored Guest'}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Bottom Navigation Dock inside Phone */}
                            <div className="relative z-10 px-4 pb-4">
                              <div className="rounded-2xl bg-white/95 backdrop-blur-md px-3 py-2 flex items-center justify-around text-[9px] font-bold text-stone-800 shadow-lg">
                                <span className="text-[#9E1B46]">Home</span>
                                <span>Acara</span>
                                <span>Galeri</span>
                                <span>Kado</span>
                                <span>RSVP</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Pink Pagination Dots Below Phone */}
                        <div className="flex justify-center items-center gap-2 mt-5">
                          {heroThemes.map((tItem) => {
                            const isDotActive =
                              currentPhoneTheme?.id === tItem.id;
                            return (
                              <button
                                key={tItem.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCatalogThemeId(tItem.id);
                                  setSelectedDemoClientId(tItem.dummyClientId);
                                  setSimEventType(tItem.eventType);
                                  setSimThemeOverride(tItem.themePreset);
                                }}
                                title={tItem.name}
                                className={`h-2.5 rounded-full transition-all cursor-pointer ${
                                  isDotActive
                                    ? 'w-7 bg-[#9E1B46]'
                                    : 'w-2.5 bg-rose-200 hover:bg-rose-300'
                                }`}
                              />
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 2: KENAPA RATUSAN RIBU PASANGAN MEMILIH MEPLANNER?        */}
            {/* ================================================================= */}
            <section className="bg-white py-16 sm:py-20">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                    {lang === 'ID'
                      ? 'Kenapa Ratusan Ribu Pasangan Memilih MEPlanner?'
                      : 'Why Do Hundreds of Thousands of Couples Choose MEPlanner?'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
                    {lang === 'ID'
                      ? 'Dirancang agar siapa saja bisa membuat undangan digital yang tampak mewah, hangat, dan siap dibagikan tanpa ribet.'
                      : 'Designed so anyone can create a luxurious, warm digital invitation ready to share effortlessly.'}
                  </p>
                </div>

                {/* 4 Clean Borderless Columns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 text-center">
                  {[
                    {
                      icon: Sparkles,
                      title:
                        lang === 'ID'
                          ? 'Desain Eksklusif & Modern'
                          : 'Exclusive & Modern Designs',
                      desc:
                        lang === 'ID'
                          ? 'Puluhan tema siap pakai untuk berbagai acara spesialmu.'
                          : 'Dozens of ready-to-use themes for your special celebrations.',
                    },
                    {
                      icon: LayoutDashboard,
                      title:
                        lang === 'ID'
                          ? 'Edit Mudah Tanpa Skill'
                          : 'Easy Editing Without Skills',
                      desc:
                        lang === 'ID'
                          ? 'Ubah teks, foto, musik dan warna dalam hitungan menit.'
                          : 'Customize text, photos, music, and colors in minutes.',
                    },
                    {
                      icon: Send,
                      title:
                        lang === 'ID'
                          ? 'Personalisasi Undangan'
                          : 'Personalized Invitations',
                      desc:
                        lang === 'ID'
                          ? 'Tulis nama tamu & kirim cepat lewat WhatsApp atau link pribadi.'
                          : 'Add guest names & share quickly via WhatsApp or personal link.',
                    },
                    {
                      icon: Award,
                      title:
                        lang === 'ID'
                          ? 'Fitur Paling Lengkap'
                          : 'Most Complete Features',
                      desc:
                        lang === 'ID'
                          ? 'Dari RSVP, Galeri, Buku Tamu, Kado, Event Planner hingga AI.'
                          : 'From RSVP, Gallery, Guestbook, Gifts, Event Planner to AI.',
                    },
                  ].map((item) => {
                    const IconComp = item.icon;
                    return (
                      <div
                        key={item.title}
                        className="flex flex-col items-center"
                      >
                        <div className="w-36 h-36 mx-auto mb-5 rounded-3xl bg-[#FDF4F6] flex items-center justify-center text-[#9E1B46]">
                          <IconComp className="w-12 h-12 stroke-[1.6]" />
                        </div>
                        <h3 className="text-base font-bold text-stone-900">
                          {item.title}
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-600 mt-1.5 leading-relaxed max-w-xs">
                          {item.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 3: DAMPAK KAMI HINGGA SAAT INI (MINT-SAGE ECO SECTION)    */}
            {/* ================================================================= */}
            <section className="bg-[#EFF8F4] py-14 sm:py-16">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-3xl mx-auto space-y-3">
                  <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                    {lang === 'ID'
                      ? 'Dampak Kami Hingga Saat Ini'
                      : 'Our Impact So Far'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    {lang === 'ID'
                      ? 'Setiap undangan digital yang dibuat di MEPlanner membantu mengurangi penggunaan kertas dari undangan cetak serta emisi karbon dari proses produksi dan distribusinya.'
                      : 'Every digital invitation created on MEPlanner helps reduce paper waste from printed cards and carbon emissions from production and courier delivery.'}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsEcoModalOpen(true)}
                      className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline underline-offset-4 cursor-pointer"
                    >
                      {lang === 'ID'
                        ? 'Bagaimana kami menghitung dampak ini?'
                        : 'How do we calculate this impact?'}
                    </button>
                  </div>
                </div>

                {/* 3 Clean White Horizontal Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-5xl mx-auto">
                  <div className="bg-white rounded-2xl p-6 shadow-2xs border-l-4 border-emerald-500 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xl">
                      🌿
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                        56.4 Ton
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-stone-600 mt-0.5">
                        {lang === 'ID'
                          ? 'Kertas berhasil dihindari'
                          : 'Paper waste avoided'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-2xs border-l-4 border-emerald-500 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xl">
                      🌍
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                        347 tCO2e
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-stone-600 mt-0.5">
                        {lang === 'ID'
                          ? 'Emisi karbon berhasil dikurangi'
                          : 'Carbon emissions reduced'}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-6 shadow-2xs border-l-4 border-emerald-500 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 font-bold text-xl">
                      💌
                    </div>
                    <div>
                      <p className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                        3.1M+
                      </p>
                      <p className="text-xs sm:text-sm font-medium text-stone-600 mt-0.5">
                        {lang === 'ID'
                          ? 'Undangan digital dibagikan'
                          : 'Digital invitations shared'}
                      </p>
                    </div>
                  </div>
                </div>

                <p className="text-center text-xs sm:text-sm text-emerald-950 font-medium mt-8">
                  {lang === 'ID'
                    ? '💚 Bersama kita ciptakan kenangan indah tanpa meninggalkan jejak negatif pada bumi.'
                    : '💚 Together we create beautiful memories without leaving a negative footprint on our planet.'}
                </p>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 4: LEBIH DARI SEKEDAR UNDANGAN DIGITAL (#fitur)           */}
            {/* ================================================================= */}
            <section id="fitur" className="bg-white py-16 sm:py-20 scroll-mt-16">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                    {lang === 'ID'
                      ? 'Lebih dari Sekedar Undangan Digital'
                      : 'More Than Just a Digital Invitation'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
                    {lang === 'ID'
                      ? 'MEPlanner menghadirkan ekosistem lengkap yang membuat persiapan dan hari bahagiamu semakin berkesan.'
                      : 'MEPlanner brings a complete ecosystem that makes your preparation and special day truly unforgettable.'}
                  </p>
                </div>

                {/* 4 Pastel Tinted Vertical Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 max-w-6xl mx-auto">
                  {/* Card 1: Undangan Digital */}
                  <div className="bg-[#FFF9FA] border border-[#F8DCE3] rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-rose-100/80 text-[#9E1B46] flex items-center justify-center">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-stone-900">
                        {lang === 'ID'
                          ? 'Undangan Digital'
                          : 'Digital Invitations'}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {lang === 'ID'
                          ? 'Beragam tema modern yang bisa disesuaikan penuh untuk pernikahan atau acara spesialmu.'
                          : 'Modern themes fully customizable for your wedding or special event.'}
                      </p>
                    </div>
                    <ul className="space-y-2 pt-5 mt-5 border-t border-rose-200/60 text-xs font-semibold text-stone-800">
                      {[
                        lang === 'ID'
                          ? 'Puluhan Tema Siap Pakai'
                          : '31+ Ready-to-Use Themes',
                        lang === 'ID'
                          ? 'Kustomisasi Fleksibel'
                          : 'Flexible Customization',
                        lang === 'ID'
                          ? 'Aktif Selamanya'
                          : 'Active Forever',
                      ].map((pt) => (
                        <li key={pt} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#9E1B46] shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 2: Kado Hadiah */}
                  <div className="bg-[#FFFDF7] border border-[#F7E5C8] rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100/80 text-amber-800 flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-stone-900">
                        {lang === 'ID' ? 'Kado Hadiah' : 'Gift Registry'}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {lang === 'ID'
                          ? 'Terima kado dengan cara modern, cashless, langsung ke alamat atau lewat daftar impianmu.'
                          : 'Receive gifts the modern way: cashless, shipped to your address, or via wishlist.'}
                      </p>
                    </div>
                    <ul className="space-y-2 pt-5 mt-5 border-t border-amber-200/60 text-xs font-semibold text-stone-800">
                      {[
                        lang === 'ID' ? 'Kado Cashless' : 'Cashless Envelope',
                        lang === 'ID' ? 'Kirim ke Alamat' : 'Ship to Address',
                        lang === 'ID' ? 'Wishlist Kado' : 'Gift Wishlist',
                      ].map((pt) => (
                        <li key={pt} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 3: Event Planner */}
                  <div className="bg-[#F8FCF9] border border-[#D5EEDB] rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-stone-900">
                        Event Planner
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {lang === 'ID'
                          ? 'Rencanakan pernikahan lebih terarah dengan manajemen Budget dan To-Do List.'
                          : 'Plan your celebration systematically with integrated Budget and To-Do List management.'}
                      </p>
                    </div>
                    <ul className="space-y-2 pt-5 mt-5 border-t border-emerald-200/60 text-xs font-semibold text-stone-800">
                      {[
                        lang === 'ID' ? 'Manajemen Budget' : 'Budget Tracker',
                        lang === 'ID'
                          ? 'To-Do List Terarah'
                          : 'Guided To-Do List',
                        lang === 'ID'
                          ? 'Ringkas & Mudah Dipakai'
                          : 'Simple & Easy to Use',
                      ].map((pt) => (
                        <li key={pt} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Card 4: MEPlanner AI */}
                  <div className="bg-[#F7FAFF] border border-[#D6E6FC] rounded-3xl p-6 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <h3 className="text-lg font-bold text-stone-900">
                        MEPlanner AI
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {lang === 'ID'
                          ? 'Teknologi AI pintar untuk merangkum ucapan & doa tamu jadi insight hangat penuh makna.'
                          : 'Smart AI technology summarizing guest wishes & prayers into warm, meaningful insights.'}
                      </p>
                    </div>
                    <ul className="space-y-2 pt-5 mt-5 border-t border-blue-200/60 text-xs font-semibold text-stone-800">
                      {[
                        'AI Wishes Insight',
                        lang === 'ID'
                          ? 'Moderasi Otomatis'
                          : 'Auto Moderation',
                        lang === 'ID' ? 'Cepat & Akurat' : 'Fast & Accurate',
                      ].map((pt) => (
                        <li key={pt} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 5: DEEP BURGUNDY BANNER "SAMBUT SETIAP TAMU LEBIH RAPI"   */}
            {/* ================================================================= */}
            <section className="py-6">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="rounded-3xl bg-gradient-to-r from-[#4A0E23] via-[#631530] to-[#4A0E23] text-white p-8 sm:p-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl">
                  <div className="lg:col-span-7 space-y-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-amber-200">
                      {lang === 'ID'
                        ? 'LAYANAN EKSKLUSIF DI HARI-H'
                        : 'EXCLUSIVE EVENT-DAY SERVICE'}
                    </p>
                    <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-white leading-tight">
                      {lang === 'ID'
                        ? 'Sambut Setiap Tamu dengan Lebih Rapi'
                        : 'Welcome Every Guest with Seamless Elegance'}
                    </h2>
                    <p className="text-xs sm:text-sm text-rose-100 leading-relaxed max-w-xl">
                      {lang === 'ID'
                        ? 'Dengan Guest Reception, proses check-in tamu menjadi lebih cepat, terdata otomatis dan memberikan kesan profesional sejak langkah pertama.'
                        : 'With Guest Reception, guest check-in becomes faster, automatically recorded, and leaves a professional impression from the very first step.'}
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenDemoManager) {
                            onOpenDemoManager(
                              activeDummyMeta.id,
                              simPackageTier,
                              activeCatalogTheme?.id
                            );
                          } else {
                            onOpenAdminPortal();
                          }
                        }}
                        className="px-6 py-3 rounded-xl bg-white text-[#631530] font-bold text-sm hover:bg-rose-50 transition-all shadow-sm cursor-pointer"
                      >
                        {lang === 'ID'
                          ? 'Kenali Guest Reception'
                          : 'Explore Guest Reception'}
                      </button>
                    </div>
                  </div>

                  {/* Right 5 Cols: Clean Visual Preview Card of Guest Reception */}
                  <div className="lg:col-span-5">
                    <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-5 space-y-4">
                      <div className="flex items-center justify-between gap-2 border-b border-white/15 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                          <span className="text-xs font-bold text-white">
                            Guest Reception Live Screen
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-200">
                          QR Check-In Ready
                        </span>
                      </div>
                      <div className="rounded-xl bg-white text-stone-900 p-4 flex items-center gap-3.5 shadow-md">
                        <div className="w-12 h-12 rounded-xl bg-[#FDF4F6] text-[#9E1B46] flex items-center justify-center shrink-0">
                          <QrCode className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-[#9E1B46]">
                            {lang === 'ID'
                              ? 'SELAMAT DATANG TAMU KEHORMATAN'
                              : 'WELCOME HONORED GUEST'}
                          </p>
                          <p className="text-sm font-extrabold text-stone-900 truncate">
                            Bpk/Ibu Tamu VIP &amp; Keluarga
                          </p>
                          <p className="text-[11px] text-stone-600">
                            VIP Table 01 &bull; 2 Pax Terverifikasi
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 6: #tema PILIHAN TEMA UNDANGAN DI DALAM PHONE MOCKUP      */}
            {/* ================================================================= */}
            <section
              id="tema"
              className="bg-[#FCF6F7] py-16 sm:py-20 scroll-mt-16"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                    {lang === 'ID'
                      ? 'Pilihan Tema Undangan yang Siap Dipakai'
                      : 'Ready-to-Use Invitation Themes'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
                    {lang === 'ID'
                      ? 'Setiap tema dirancang dengan detail, responsif di semua perangkat dan mudah disesuaikan.'
                      : 'Every theme is crafted with care, responsive across all devices, and effortless to customize.'}
                  </p>
                </div>

                {/* Clean Category Filter Tabs */}
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                  {(
                    [
                      {
                        id: 'ALL' as const,
                        label: lang === 'ID' ? 'Semua Tema' : 'All Themes',
                      },
                      {
                        id: 'WEDDING' as const,
                        label: lang === 'ID' ? 'Pernikahan' : 'Wedding',
                      },
                      {
                        id: 'BIRTHDAY' as const,
                        label: lang === 'ID' ? 'Ulang Tahun' : 'Birthday',
                      },
                      {
                        id: 'GRADUATION' as const,
                        label: lang === 'ID' ? 'Wisuda' : 'Graduation',
                      },
                      {
                        id: 'MEETING' as const,
                        label: lang === 'ID' ? 'Rapat Resmi' : 'Corporate',
                      },
                      {
                        id: 'GALA_DINNER' as const,
                        label: lang === 'ID' ? 'Gala Dinner' : 'Gala Dinner',
                      },
                    ] as const
                  ).map((evBtn) => {
                    const isAct = catalogEventFilter === evBtn.id;
                    return (
                      <button
                        key={evBtn.id}
                        type="button"
                        onClick={() => {
                          setCatalogEventFilter(evBtn.id);
                          setCatalogStyleFilter('ALL');
                        }}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                          isAct
                            ? 'bg-[#9E1B46] text-white shadow-xs'
                            : 'bg-white hover:bg-rose-50 text-stone-800 border border-stone-200/80'
                        }`}
                      >
                        {evBtn.label}
                      </button>
                    );
                  })}
                </div>

                {/* 4-Column Grid of Clean Phone Mockup Cards (Zero Cluttered Overlay Badges!) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-10 max-w-6xl mx-auto">
                  {(showAllCatalogThemes
                    ? filteredCatalogThemes
                    : filteredCatalogThemes.slice(0, 8)
                  ).map((theme) => {
                    const dummyMetaForTheme =
                      SHOWCASE_DUMMY_CLIENT_METAS.find(
                        (m) => m.id === theme.dummyClientId
                      ) || SHOWCASE_DUMMY_CLIENT_METAS[0];
                    const cleanCategoryText =
                      theme.eventType === 'WEDDING'
                        ? lang === 'ID'
                          ? 'Pernikahan'
                          : 'Wedding'
                        : theme.eventType === 'BIRTHDAY'
                          ? lang === 'ID'
                            ? 'Ulang Tahun'
                            : 'Birthday'
                          : theme.eventType === 'GRADUATION'
                            ? lang === 'ID'
                              ? 'Wisuda'
                              : 'Graduation'
                            : theme.eventType === 'MEETING'
                              ? lang === 'ID'
                                ? 'Rapat Resmi'
                                : 'Corporate'
                              : 'Gala Dinner';

                    return (
                      <div
                        key={theme.id}
                        className="bg-white rounded-3xl p-4 border border-stone-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col items-center"
                      >
                        {/* Realistic iPhone Mockup — Clean Unobstructed Cover */}
                        <div
                          onClick={() => handleApplyCatalogThemeDemo(theme)}
                          className="w-[200px] mx-auto rounded-[32px] border-[6px] border-stone-900 aspect-[9/18] overflow-hidden relative shadow-md bg-stone-950 cursor-pointer group"
                        >
                          <img
                            src={theme.coverBgUrl || theme.thumbnailUrl}
                            alt={theme.name}
                            loading="lazy"
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/25 to-black/80" />

                          {/* Dynamic Island Notch */}
                          <div className="w-14 h-3 bg-stone-950 rounded-full mx-auto mt-1.5 relative z-10" />

                          {/* Phone Screen Content — Clean High-Contrast White Typography */}
                          <div className="relative z-10 h-[calc(100%-20px)] flex flex-col justify-between p-4 text-center text-white">
                            <div className="pt-2">
                              <p className="text-[8px] uppercase tracking-[0.22em] text-white/90 font-semibold">
                                {theme.eventType === 'WEDDING'
                                  ? 'THE WEDDING OF'
                                  : cleanCategoryText.toUpperCase()}
                              </p>
                            </div>

                            <div className="space-y-1.5 my-auto">
                              <h4 className="font-editorial italic text-lg font-bold text-white leading-snug drop-shadow-sm">
                                {dummyMetaForTheme.coupleLabel}
                              </h4>
                              <p className="text-[10px] text-white/90 font-medium">
                                {theme.styleCategory}
                              </p>
                            </div>

                            <div className="pb-1">
                              <span className="inline-block px-3.5 py-1.5 rounded-full bg-white text-stone-900 text-[9px] font-bold shadow-xs">
                                {lang === 'ID'
                                  ? 'Buka Undangan'
                                  : 'Open Invitation'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Centered High-Contrast Theme Title & Subtle Category Text on White Card */}
                        <div className="text-center mt-3.5 mb-3">
                          <h3 className="text-sm font-bold text-stone-900">
                            {theme.name}
                          </h3>
                          <p className="text-[11px] font-medium text-stone-500 mt-0.5">
                            {cleanCategoryText} &bull; {theme.styleCategory}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleApplyCatalogThemeDemo(theme)}
                          className="w-full py-2.5 rounded-xl bg-[#F06292] hover:bg-[#EC407A] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 shrink-0" />
                          <span>
                            {lang === 'ID' ? 'Lihat Demo' : 'View Demo'}
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Pagination / View All 31 Themes Controls */}
                {filteredCatalogThemes.length > 8 && (
                  <div className="mt-10 flex flex-col items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setShowAllCatalogThemes((prev) => !prev)}
                      className="px-6 py-3 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <span>
                        {showAllCatalogThemes
                          ? lang === 'ID'
                            ? 'Tampilkan Lebih Sedikit (8 Tema Utama)'
                            : 'Show Compact Grid (8 Themes)'
                          : lang === 'ID'
                            ? `Lihat Semua ${filteredCatalogThemes.length} Tema`
                            : `View All ${filteredCatalogThemes.length} Themes`}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 7: CARA BARU MENERIMA KADO DENGAN LEBIH MUDAH             */}
            {/* ================================================================= */}
            <section className="bg-white py-16 sm:py-20 border-b border-stone-100">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center max-w-2xl mx-auto">
                  <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                    {lang === 'ID'
                      ? 'Cara Baru Menerima Kado dengan Lebih Mudah'
                      : 'An Easier New Way to Receive Gifts'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600 mt-3 leading-relaxed">
                    {lang === 'ID'
                      ? 'Tamu bisa memilih cara memberi yang paling nyaman, sementara kamu menerimanya dengan aman dan praktis.'
                      : 'Guests can choose the most convenient way to give, while you receive their gifts safely and effortlessly.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 max-w-5xl mx-auto">
                  {[
                    {
                      icon: CreditCard,
                      title:
                        lang === 'ID' ? 'Kado Cashless' : 'Cashless Envelope',
                      desc:
                        lang === 'ID'
                          ? 'Terima kado secara cashless dengan cepat, aman dan transparan melalui Bank, QRIS, PayPal & USDT.'
                          : 'Receive cashless gifts quickly, safely, and transparently via Bank Transfer, QRIS, PayPal & USDT.',
                    },
                    {
                      icon: Building2,
                      title:
                        lang === 'ID' ? 'Kirim ke Alamat' : 'Ship to Address',
                      desc:
                        lang === 'ID'
                          ? 'Tamu dapat mengirim kado langsung ke alamat yang telah ditentukan lengkap dengan petunjuk kurir.'
                          : 'Guests can ship physical gifts directly to your designated recipient address with courier notes.',
                    },
                    {
                      icon: Sparkles,
                      title: lang === 'ID' ? 'Wishlist Kado' : 'Gift Wishlist',
                      desc:
                        lang === 'ID'
                          ? 'Buat daftar kado impian agar hadiah yang diterima sesuai kebutuhan dan tidak dobel.'
                          : 'Create a dream gift wishlist so every present you receive matches your needs without duplicates.',
                    },
                  ].map((giftCard) => {
                    const IconComp = giftCard.icon;
                    return (
                      <div
                        key={giftCard.title}
                        className="rounded-3xl bg-white border border-stone-200/80 p-6 shadow-2xs space-y-3 text-center"
                      >
                        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FDF4F6] text-[#9E1B46] flex items-center justify-center">
                          <IconComp className="w-7 h-7" />
                        </div>
                        <h3 className="text-base font-bold text-stone-900">
                          {giftCard.title}
                        </h3>
                        <p className="text-xs text-stone-600 leading-relaxed">
                          {giftCard.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 8: 6 PAKET KOMERSIAL RESMI MEPLANNER (#paket)             */}
            {/* ================================================================= */}
            <section
              id="paket"
              className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-16"
            >
              <div className="text-center max-w-2xl mx-auto space-y-3">
                <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                  {lang === 'ID'
                    ? 'Pilihan Paket Harga MEPlanner'
                    : 'MEPlanner Pricing Plans'}
                </h2>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                  {lang === 'ID'
                    ? 'Mulai dari paket Gratis atau pilih paket lengkap dengan fitur RSVP, Galeri, Musik, Kado, Event Planner & AI. Sekali bayar, aktif selamanya.'
                    : 'Start free or unlock complete features with RSVP, Gallery, Music, Gift Registry, Event Planner & AI. One-time payment, active forever.'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch min-w-0">
                {commercialPackages.map((pkg) => {
                  const isRoyal = pkg.styleVariant === 'royal';
                  const isExclusive = pkg.styleVariant === 'exclusive';

                  return (
                    <div
                      key={pkg.id}
                      className={`min-w-0 overflow-hidden rounded-3xl p-6 flex flex-col justify-between transition-all ${
                        isRoyal
                          ? 'bg-[#FFFDF9] text-stone-900 border-2 border-[#D4AF37] shadow-md relative'
                          : isExclusive
                            ? 'bg-[#FFF9FA] text-stone-900 border-2 border-[#9E1B46] shadow-md'
                            : 'bg-white text-stone-900 border border-stone-200/90 shadow-2xs'
                      }`}
                    >
                      <div className="space-y-4 min-w-0">
                        <div className="min-w-0">
                          <div className="flex items-baseline justify-between gap-2">
                            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
                              {pkg.name}
                            </h3>
                            <span className="text-[11px] font-bold text-[#9E1B46]">
                              {pkg.discountBadge}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 mt-1">
                            {pkg.subtitle}
                          </p>

                          <div className="mt-4 pt-4 border-t border-stone-200/80">
                            <div className="flex items-baseline gap-2.5 flex-wrap">
                              <span
                                className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                                  isRoyal
                                    ? 'text-[#8B6914]'
                                    : isExclusive
                                      ? 'text-[#9E1B46]'
                                      : 'text-stone-900'
                                }`}
                              >
                                {pkg.priceMain}
                              </span>
                              <span className="text-xs font-bold line-through text-stone-400">
                                {pkg.priceStrike}
                              </span>
                            </div>
                            <p className="text-[11px] font-medium text-stone-600 mt-1">
                              {pkg.priceSubBadge}
                            </p>
                          </div>
                        </div>

                        <ul className="space-y-2 text-xs pt-1">
                          {pkg.features.map((f) => (
                            <li key={f} className="flex items-start gap-2">
                              <CheckCircle2
                                className={`w-4 h-4 shrink-0 mt-0.5 ${
                                  isRoyal
                                    ? 'text-[#9A742B]'
                                    : isExclusive
                                      ? 'text-[#9E1B46]'
                                      : 'text-emerald-600'
                                }`}
                              />
                              <span className="text-stone-700">{f}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="pt-5 mt-5 border-t border-stone-200/80 space-y-2 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleSelectPackageForCheckout(pkg.id)}
                          className={`w-full max-w-full py-3.5 px-4 rounded-xl font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer ${
                            isRoyal
                              ? 'bg-[#8B6914] hover:bg-[#735610] text-white shadow-xs'
                              : isExclusive
                                ? 'bg-[#9E1B46] hover:bg-[#821539] text-white shadow-xs'
                                : 'bg-stone-900 hover:bg-stone-800 text-white shadow-2xs'
                          }`}
                        >
                          <span className="truncate">
                            {lang === 'ID'
                              ? `Pilih Paket ${pkg.name}`
                              : `Select ${pkg.name}`}
                          </span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 9: ARTIKEL & INSPIRASI TERBARU (#blog)                    */}
            {/* ================================================================= */}
            <section
              id="blog"
              className="py-16 sm:py-20 bg-[#FCF6F7] border-t border-stone-200/70 scroll-mt-16"
            >
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
                <div className="text-center max-w-2xl mx-auto space-y-2">
                  <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900">
                    {lang === 'ID'
                      ? 'Artikel & Inspirasi Terbaru'
                      : 'Latest Articles & Inspiration'}
                  </h2>
                  <p className="text-xs sm:text-sm text-stone-600">
                    {lang === 'ID'
                      ? 'Panduan praktis dan inspirasi untuk membantu persiapan hari bahagiamu.'
                      : 'Practical guides and inspiration to help prepare your special celebration.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
                  {BLOG_ARTICLES.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => setActiveBlogArticle(art)}
                      className="group cursor-pointer rounded-2xl bg-white border border-stone-200/80 hover:border-[#9E1B46] overflow-hidden flex flex-col justify-between transition-all shadow-2xs"
                    >
                      <div>
                        <div className="relative h-36 overflow-hidden">
                          <img
                            src={art.imageUrl}
                            alt={lang === 'ID' ? art.titleId : art.titleEn}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                        <div className="p-4 space-y-2">
                          <p className="text-[10px] font-bold text-[#9E1B46] uppercase tracking-wider">
                            {art.category} &bull; {art.readTime}
                          </p>
                          <h3 className="font-sans text-xs sm:text-sm font-bold text-stone-900 line-clamp-3 group-hover:text-[#9E1B46] transition-colors leading-snug">
                            {lang === 'ID' ? art.titleId : art.titleEn}
                          </h3>
                          <p className="text-[11px] text-stone-600 line-clamp-3 leading-relaxed">
                            {lang === 'ID' ? art.excerptId : art.excerptEn}
                          </p>
                        </div>
                      </div>
                      <div className="px-4 py-2.5 border-t border-stone-100 flex items-center justify-between text-[11px] font-bold text-[#9E1B46]">
                        <span>
                          {lang === 'ID'
                            ? 'Baca Selengkapnya'
                            : 'Read Full Article'}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ================================================================= */}
            {/* SECTION 10: FAQ INTERAKTIF & CUSTOMER SERVICE (#faq)              */}
            {/* ================================================================= */}
            <section
              id="faq"
              className="py-16 sm:py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 scroll-mt-16"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left 7 Cols: Interactive FAQ Accordion */}
                <div className="lg:col-span-7 space-y-5">
                  <div>
                    <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900">
                      {lang === 'ID'
                        ? 'Pertanyaan yang Sering Diajukan'
                        : 'Frequently Asked Questions'}
                    </h2>
                    <p className="text-xs sm:text-sm text-stone-600 mt-1.5">
                      {lang === 'ID'
                        ? 'Jawaban cepat seputar pembuatan undangan digital dan fitur MEPlanner.'
                        : 'Quick answers about creating digital invitations and MEPlanner features.'}
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {FAQ_ITEMS.map((item, idx) => {
                      const isOpen = openFaqIdx === idx;
                      return (
                        <div
                          key={item.qId}
                          className={`rounded-2xl border transition-all overflow-hidden ${
                            isOpen
                              ? 'bg-white border-[#9E1B46] shadow-2xs'
                              : 'bg-white border-stone-200/90 hover:border-stone-300'
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => setOpenFaqIdx(isOpen ? -1 : idx)}
                            className="w-full p-4 text-left flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <span className="text-xs sm:text-sm font-bold text-stone-900 leading-snug">
                              {lang === 'ID' ? item.qId : item.qEn}
                            </span>
                            <ChevronDown
                              className={`w-4 h-4 text-[#9E1B46] shrink-0 transition-transform ${
                                isOpen ? 'rotate-180' : ''
                              }`}
                            />
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 pt-2 border-t border-stone-100 text-xs text-stone-600 leading-relaxed bg-[#FCF6F7]/50">
                              {lang === 'ID' ? item.aId : item.aEn}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 5 Cols: Customer Service & MEPlanner AI Assistant */}
                <div className="lg:col-span-5 rounded-3xl bg-[#FCF5F6] border border-rose-200/80 p-6 space-y-5">
                  <div>
                    <h3 className="font-editorial text-xl font-bold text-stone-900">
                      {lang === 'ID'
                        ? 'Masih Ada Pertanyaan? Tanya MEPlanner AI atau CS Kami'
                        : 'Still Have Questions? Ask MEPlanner AI or Our CS'}
                    </h3>
                    <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">
                      {lang === 'ID'
                        ? 'Pilih topik di bawah untuk jawaban instan dari MEPlanner AI, atau hubungi tim Customer Service kami.'
                        : 'Select a topic below for an instant answer from MEPlanner AI, or contact our Customer Service.'}
                    </p>
                  </div>

                  {/* Interactive AI Quick Prompts */}
                  <div className="space-y-2">
                    <div className="flex flex-col gap-1.5">
                      {AI_QUICK_PROMPTS.map((prm, pIdx) => {
                        const isSelected = selectedAiPromptIdx === pIdx;
                        return (
                          <button
                            key={prm.id}
                            type="button"
                            onClick={() => setSelectedAiPromptIdx(pIdx)}
                            className={`text-left px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-[#9E1B46] text-white border-[#9E1B46] shadow-2xs'
                                : 'bg-white hover:bg-rose-50 text-stone-800 border-stone-200'
                            }`}
                          >
                            {lang === 'ID' ? prm.questionId : prm.questionEn}
                          </button>
                        );
                      })}
                    </div>

                    <div className="p-3.5 rounded-2xl bg-white border border-rose-200 text-xs text-stone-800 leading-relaxed font-medium">
                      {lang === 'ID'
                        ? AI_QUICK_PROMPTS[selectedAiPromptIdx]?.answerId
                        : AI_QUICK_PROMPTS[selectedAiPromptIdx]?.answerEn}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-rose-200/60 flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={mailtoGeneralSupportUrl}
                      className="flex-1 py-3 px-4 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-2xs transition-all"
                    >
                      <Mail className="w-4 h-4 shrink-0" />
                      <span>
                        {lang === 'ID'
                          ? `Hubungi CS (${businessEmail})`
                          : `Email Support (${businessEmail})`}
                      </span>
                    </a>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
      </main>

      {/* ================================================================= */}
      {/* MODAL 1: BAGAIMANA KAMI MENGHITUNG DAMPAK LINGKUNGAN (ECO-MODAL)   */}
      {/* ================================================================= */}
      {isEcoModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEcoModalOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white border border-emerald-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-emerald-50 border-b border-emerald-200 flex items-center justify-between gap-3">
              <h4 className="font-sans text-sm sm:text-base font-bold text-stone-900">
                {lang === 'ID'
                  ? 'Bagaimana Kami Menghitung Dampak Ini?'
                  : 'How Do We Calculate This Environmental Impact?'}
              </h4>
              <button
                type="button"
                onClick={() => setIsEcoModalOpen(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs text-stone-700 leading-relaxed max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-emerald-200 space-y-1.5">
                  <p className="font-extrabold text-emerald-800 text-sm">
                    1. Kertas (Undangan A5 &amp; Amplop)
                  </p>
                  <p className="text-stone-600">
                    Satu set undangan cetak fisik rata-rata membutuhkan kartu A5
                    art carton tebal (210–260 gsm), amplop berlapis, serta plastik
                    kemasan (~18–20 gram per undangan). Mengalikan jutaan
                    undangan digital yang dibagikan menghasilkan penghematan{' '}
                    <strong className="text-stone-900">56.4 Ton kertas</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-emerald-200 space-y-1.5">
                  <p className="font-extrabold text-stone-900 text-sm">
                    2. Tinta Cetak &amp; Laminasi Kimia
                  </p>
                  <p className="text-stone-600">
                    Meniadakan penggunaan tinta offset berbasis minyak, foil emas
                    panas (hotprint), dan laminasi plastik doff/glossy yang sulit
                    terurai di tanah dalam puluhan tahun.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-emerald-200 space-y-1.5">
                  <p className="font-extrabold text-stone-900 text-sm">
                    3. Distribusi &amp; Emisi Transportasi
                  </p>
                  <p className="text-stone-600">
                    Undangan fisik memerlukan pengiriman kurir motor/mobil/pesawat
                    ke tiap alamat tamu. Distribusi digital via WhatsApp menekan
                    emisi hingga <strong className="text-stone-900">347 tCO2e</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-emerald-200 space-y-1.5">
                  <p className="font-extrabold text-emerald-800 text-sm">
                    4. Prinsip Perhitungan Konservatif
                  </p>
                  <p className="text-stone-600">
                    Kami menggunakan faktor konversi siklus hidup kertas &amp;
                    logistik konservatif setelah dikurangi estimasi konsumsi
                    energi server cloud modern yang efisien.
                  </p>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setIsEcoModalOpen(false)}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer"
                >
                  {lang === 'ID' ? 'Mengerti & Tutup' : 'Got It & Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL 2: PEMBACA ARTIKEL & INSPIRASI BLOG (activeBlogArticle)      */}
      {/* ================================================================= */}
      {activeBlogArticle && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setActiveBlogArticle(null)}
        >
          <div
            className="w-full max-w-2xl rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-48 overflow-hidden">
              <img
                src={activeBlogArticle.imageUrl}
                alt={
                  lang === 'ID'
                    ? activeBlogArticle.titleId
                    : activeBlogArticle.titleEn
                }
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveBlogArticle(null)}
                className="absolute top-3 right-3 p-2 rounded-xl bg-white/90 hover:bg-white text-stone-900 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-5 right-5 space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-wider text-rose-200">
                  {activeBlogArticle.category} &bull; {activeBlogArticle.readTime}
                </p>
                <h4 className="font-sans text-base sm:text-xl font-bold text-white">
                  {lang === 'ID'
                    ? activeBlogArticle.titleId
                    : activeBlogArticle.titleEn}
                </h4>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-4 text-xs text-stone-700 leading-relaxed max-h-[65vh] overflow-y-auto">
              <p className="text-stone-600 text-xs sm:text-sm">
                {lang === 'ID'
                  ? activeBlogArticle.excerptId
                  : activeBlogArticle.excerptEn}
              </p>

              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-2.5">
                <p className="font-bold text-[#9E1B46] uppercase tracking-wider text-[10px]">
                  {lang === 'ID'
                    ? 'Poin Utama & Checklist Praktis:'
                    : 'Key Takeaways & Practical Checklist:'}
                </p>
                <ul className="space-y-2">
                  {(lang === 'ID'
                    ? activeBlogArticle.highlightsId
                    : activeBlogArticle.highlightsEn
                  ).map((pt) => (
                    <li key={pt} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold">
                {lang === 'ID'
                  ? activeBlogArticle.conclusionId
                  : activeBlogArticle.conclusionEn}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveBlogArticle(null);
                    handleSelectPackageForCheckout('PREMIUM');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white font-bold text-xs cursor-pointer"
                >
                  {lang === 'ID'
                    ? 'Coba di Paket Premium (Rp 51.750)'
                    : 'Unlock in Premium Plan (Rp 51,750)'}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBlogArticle(null)}
                  className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold text-xs cursor-pointer"
                >
                  {lang === 'ID' ? 'Tutup Artikel' : 'Close Article'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN LIVE INTERACTIVE UI LIGHTBOX MODAL */}
      {lightboxScreenshot && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6"
          onClick={() => setLightboxScreenshot(null)}
        >
          <div
            className="w-full max-w-6xl max-h-[92vh] rounded-3xl bg-white border border-stone-200 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 bg-white border-b border-stone-200 flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0 flex items-center gap-2.5">
                <h4 className="font-editorial text-sm sm:text-lg font-bold text-stone-900 truncate">
                  {lightboxScreenshot.title}
                </h4>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {lightboxScreenshot.mode === 'invitation_sim' && (
                  <button
                    type="button"
                    onClick={() => {
                      setLightboxScreenshot(null);
                      if (onOpenDemoManager) {
                        onOpenDemoManager(
                          activeDummyMeta.id,
                          simPackageTier,
                          activeCatalogTheme?.id
                        );
                      } else {
                        onOpenAdminPortal();
                      }
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                  >
                    <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      {lang === 'ID'
                        ? 'Buka di Management Planner'
                        : 'Open in Management Planner'}
                    </span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setLightboxScreenshot(null)}
                  title={
                    lang === 'ID' ? 'Tutup Layar Penuh' : 'Close Fullscreen'
                  }
                  className="px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>{lang === 'ID' ? 'Tutup' : 'Close'}</span>
                </button>
              </div>
            </div>

            {/* Live Interactive React Body */}
            <div className="flex-1 overflow-y-auto bg-[#FAF8F5]">
              {lightboxScreenshot.mode === 'invitation_sim' ? (
                <PublicInvitationView
                  key={`lightbox-${activeDummyMeta.id}-${simPackageTier}-${selectedCatalogThemeId}-${lang}`}
                  settings={activeDummyState.settings}
                  guests={activeDummyState.guests}
                  wishes={effectiveDummyWishes}
                  guestParamName={activeDummyMeta.sampleGuestName}
                  guestParamCode={activeDummyMeta.sampleHashToken}
                  defaultOpened={simIsOpened}
                  isAdminLoggedIn={false}
                  onOpenAdminPortal={() => {
                    setLightboxScreenshot(null);
                    if (onOpenDemoManager) {
                      onOpenDemoManager(
                        activeDummyMeta.id,
                        simPackageTier,
                        activeCatalogTheme?.id
                      );
                    } else {
                      onOpenAdminPortal();
                    }
                  }}
                  onSubmitRsvp={handleDummyLiveRsvpSubmit}
                  {...({ externalLang: lang } as any)}
                />
              ) : (
                renderLiveDashboardModule(
                  lightboxScreenshot.moduleId ||
                    OFFICIAL_PRODUCT_SCREENSHOTS[activeShowcaseIdx]?.id ||
                    'tracker'
                )
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL CEK UNDANGAN DENGAN KEY (EXACT HASH TOKEN ONLY — ZERO LEAK) */}
      {/* ================================================================= */}
      {isGuestLookupModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsGuestLookupModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-3xl bg-white border border-stone-200/90 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 bg-[#FCF5F6] border-b border-rose-100 flex items-center justify-between gap-3">
              <div>
                <h4 className="font-editorial text-base sm:text-lg font-bold text-stone-900">
                  {lang === 'ID'
                    ? '🔑 Cek Undangan dengan Key'
                    : '🔑 Check Invitation by Key'}
                </h4>
                <p className="text-[11px] text-stone-600 mt-0.5">
                  {lang === 'ID'
                    ? 'Masukkan Key unik undangan yang tertera pada pesan undangan personal Anda.'
                    : 'Enter the unique Invitation Key included in your personal invitation message.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsGuestLookupModalOpen(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer shrink-0"
                title={lang === 'ID' ? 'Tutup' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body — Exact Key Input Only, Zero Dropdown, Zero Sample Guest List */}
            <div className="p-5 sm:p-6">
              <form onSubmit={handleQuickLookupSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-stone-800 mb-1.5">
                    {lang === 'ID'
                      ? 'Key Undangan Unik'
                      : 'Unique Invitation Key'}
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={guestCodeInput}
                      onChange={(e) => {
                        setGuestCodeInput(e.target.value);
                        setLookupGateError(null);
                      }}
                      placeholder={
                        lang === 'ID'
                          ? 'Tempel Key Undangan di sini...'
                          : 'Paste your Invitation Key here...'
                      }
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-mono font-semibold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9E1B46]/30 focus:border-[#9E1B46]"
                      autoFocus
                    />
                  </div>
                </div>

                {lookupGateError && (
                  <p className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold leading-relaxed">
                    {lookupGateError}
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <span>
                    {lang === 'ID' ? 'Buka Undangan →' : 'Open Invitation →'}
                  </span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL BUAT UNDANGAN VIA AKUN GOOGLE (GMAIL)                       */}
      {/* ================================================================= */}
      {isGoogleOnboardingModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setIsGoogleOnboardingModalOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white border border-stone-200/90 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 sm:px-6 py-4 bg-[#FCF5F6] border-b border-rose-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-white border border-stone-200 shadow-2xs flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M23.49 12.275c0-.85-.075-1.675-.215-2.475H12v4.685h6.445a5.51 5.51 0 0 1-2.39 3.615v3.005h3.87c2.265-2.085 3.565-5.155 3.565-8.83Z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.87-3.005c-1.075.72-2.45 1.145-4.07 1.145-3.13 0-5.78-2.115-6.725-4.955H1.275v3.1C3.25 21.3 7.31 24 12 24Z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.275 14.275A7.21 7.21 0 0 1 4.9 12c0-.79.135-1.555.375-2.275v-3.1H1.275A11.99 11.99 0 0 0 0 12c0 1.935.465 3.765 1.275 5.375l4-3.1Z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.77c1.76 0 3.34.605 4.585 1.795l3.44-3.44C17.95 1.19 15.235 0 12 0 7.31 0 3.25 2.7 1.275 6.625l4 3.1C6.22 6.885 8.87 4.77 12 4.77Z"
                    />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-bold text-[#9E1B46]">
                    {lang === 'ID'
                      ? `Paket Terpilih: ${googleOnboardingPackageId}`
                      : `Selected Plan: ${googleOnboardingPackageId}`}
                  </p>
                  <h4 className="font-editorial text-base sm:text-lg font-bold text-stone-900 truncate">
                    {lang === 'ID'
                      ? 'Buat Undangan via Akun Google (Gmail)'
                      : 'Create Invitation via Google Account (Gmail)'}
                  </h4>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGoogleOnboardingModalOpen(false)}
                className="p-1.5 rounded-xl bg-white hover:bg-stone-100 border border-stone-200 text-stone-600 hover:text-stone-900 transition-all cursor-pointer shrink-0"
                title={lang === 'ID' ? 'Tutup' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body Form */}
            <form
              onSubmit={handleGoogleOnboardingSubmit}
              className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto"
            >
              {/* Field 1: Alamat Akun Google (@gmail.com) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-700">
                  {lang === 'ID'
                    ? '1. Alamat Akun Google (@gmail.com) *'
                    : '1. Google Account Email (@gmail.com) *'}
                </label>
                <input
                  type="email"
                  required
                  value={googleOnboardingEmail}
                  onChange={(e) => setGoogleOnboardingEmail(e.target.value)}
                  placeholder="nama.anda@gmail.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9E1B46]/30 focus:border-[#9E1B46]"
                />
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-semibold text-stone-500">
                    {lang === 'ID' ? 'Contoh cepat:' : 'Quick fill:'}
                  </span>
                  {[
                    'pasangan.bahagia@gmail.com',
                    'panitia.acara@gmail.com',
                  ].map((sampleEmail) => (
                    <button
                      key={sampleEmail}
                      type="button"
                      onClick={() => setGoogleOnboardingEmail(sampleEmail)}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-[#9E1B46] text-[10px] font-bold transition-all cursor-pointer"
                    >
                      {sampleEmail}
                    </button>
                  ))}
                </div>
              </div>

              {/* Field 2: Kategori Acara (5 Pills) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-700">
                  {lang === 'ID'
                    ? '2. Pilih Kategori Acara'
                    : '2. Select Event Category'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    [
                      { id: 'WEDDING' as const, label: 'Pernikahan' },
                      { id: 'BIRTHDAY' as const, label: 'Ulang Tahun' },
                      { id: 'GRADUATION' as const, label: 'Wisuda' },
                      { id: 'MEETING' as const, label: 'Rapat Resmi' },
                      { id: 'GALA_DINNER' as const, label: 'Gala Dinner' },
                    ] as const
                  ).map((evItem) => {
                    const isSelected = googleOnboardingEventType === evItem.id;
                    return (
                      <button
                        key={evItem.id}
                        type="button"
                        onClick={() => {
                          setGoogleOnboardingEventType(evItem.id);
                          const firstTheme = MULTI_EVENT_THEME_CATALOG.find(
                            (t) => t.eventType === evItem.id
                          );
                          if (firstTheme) {
                            setGoogleOnboardingThemeId(firstTheme.id);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#9E1B46] text-white border-[#9E1B46]'
                            : 'bg-stone-50 hover:bg-rose-50 text-stone-700 border-stone-200'
                        }`}
                      >
                        {evItem.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Field 3: Nama Pasangan / Judul Acara */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-700">
                  {lang === 'ID'
                    ? '3. Nama Pasangan / Judul Acara'
                    : '3. Couple Name / Event Title'}
                </label>
                <input
                  type="text"
                  value={googleOnboardingEventTitle}
                  onChange={(e) =>
                    setGoogleOnboardingEventTitle(e.target.value)
                  }
                  placeholder={
                    googleOnboardingEventType === 'BIRTHDAY'
                      ? 'Contoh: Sweet 17th Aurelia'
                      : googleOnboardingEventType === 'GRADUATION'
                        ? 'Contoh: Syukuran Wisuda Kevin'
                        : googleOnboardingEventType === 'MEETING'
                          ? 'Contoh: Rapat Tahunan Nusantara'
                          : googleOnboardingEventType === 'GALA_DINNER'
                            ? 'Contoh: Royal Anniversary Gala'
                            : 'Contoh: Rayhan & Clarissa'
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9E1B46]/30 focus:border-[#9E1B46]"
                />
              </div>

              {/* Field 4: Pilih Tema Awal (Sinkron 31 Tema Katalog) */}
              <div className="space-y-1.5">
                <label className="block text-[11px] font-extrabold text-stone-700">
                  {lang === 'ID'
                    ? '4. Pilih Tema Awal (Sinkron 31 Tema Katalog)'
                    : '4. Choose Initial Theme (Synced with 31 Catalog Themes)'}
                </label>
                <select
                  value={googleOnboardingThemeId}
                  onChange={(e) => setGoogleOnboardingThemeId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-stone-50 border border-stone-300 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-[#9E1B46]/30 focus:border-[#9E1B46]"
                >
                  {MULTI_EVENT_THEME_CATALOG.filter(
                    (t) => t.eventType === googleOnboardingEventType
                  ).map((themeItem) => (
                    <option key={themeItem.id} value={themeItem.id}>
                      {themeItem.name} — {themeItem.styleCategory}
                    </option>
                  ))}
                </select>
              </div>

              {/* Primary CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-xl bg-[#9E1B46] hover:bg-[#821539] text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                >
                  <span>
                    {lang === 'ID'
                      ? 'Masuk dengan Google & Buka Management Sekarang'
                      : 'Sign in with Google & Open Management Now'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CLEAN FOOTER */}
      <footer className="bg-white border-t border-stone-200/80 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="flex items-center justify-center shrink-0">
              <WeddingRingsIcon
                className="w-8 h-8"
                logoUrl={(primarySettings as any).brandLogoUrl}
              />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-stone-900">
                MEPlanner — My Event Planner by{' '}
                <a
                  href={developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#9E1B46] hover:underline"
                >
                  omeko42
                </a>{' '}
                &copy; 2026
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {lang === 'ID'
                  ? 'Platform Undangan Digital & Persiapan Acara Modern'
                  : 'Modern Digital Invitation & Event Planning Platform'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={mailtoGeneralSupportUrl}
              title={`Hubungi Email Resmi MEPlanner (${businessEmail})`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-all"
            >
              <Mail className="w-3.5 h-3.5 text-[#9E1B46]" />
              <span>{businessEmail}</span>
            </a>

            <a
              href="https://www.linkedin.com/in/omeko42"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0A66C2] hover:bg-[#004182] text-white text-xs font-semibold transition-all"
            >
              <span>Eko Agung Krisdianto</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};
