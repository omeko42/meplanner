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
    accountNumber: 'paypal.me/meplan-vip-2026',
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
        senderTitle: 'Tamu Kehormatan VVIP • INV-0001',
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
        senderTitle: 'Kolega RSUPN Dr. Cipto Mangunkusumo • INV-0002',
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
        senderTitle: 'Rekan Senior Batalyon Akpol • INV-0003',
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
        senderTitle: 'Keluarga Inti VIP • INV-0001',
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
        senderTitle: 'Best Friends Table • INV-0002',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Happy 17th Birthday Aurel!! Can’t wait to celebrate tonight at The Glasshouse!',
        timestamp: '19 menit lalu',
        hostReply: 'Thank you bestie! See you at the rooftop lounge!',
      },
      {
        id: 'w-bday-3',
        senderName: 'drg. Karina Putri & Partner',
        senderTitle: 'Tamu VIP • INV-0003',
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
        senderTitle: 'Dekan & Guru Besar • INV-0001',
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
        senderTitle: 'Sejawat Dokter Muda • INV-0002',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Selamat Bro dr. Kevin! Perjuangan koas terbayar lunas hari ini. Sampai jumpa di Padma Ballroom!',
        timestamp: '22 menit lalu',
        hostReply: 'Siap dr. Raka! Terima kasih perjuangan barengnya!',
      },
      {
        id: 'w-grad-3',
        senderName: 'Keluarga Besar Bapak H. Nugroho',
        senderTitle: 'Keluarga Kehormatan • INV-0003',
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
        senderTitle: 'Staf Ahli Utama Kementerian • INV-0001',
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
        senderTitle: 'Mitra Strategis Utama • INV-0002',
        attendanceBadge: 'Hadir • 2 Pax',
        message:
          'Kami siap hadir mendukung penuh kesuksesan Rakornas Transformasi Digital 2026.',
        timestamp: '28 menit lalu',
        hostReply: 'Terima kasih kepada jajaran Direksi atas dukungannya.',
      },
      {
        id: 'w-meet-3',
        senderName: 'Sekretariat Daerah Provinsi Jawa Timur',
        senderTitle: 'Delegasi Provinsi • INV-0003',
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
        senderTitle: 'VVIP Royal Table 01 • INV-0001',
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
        senderTitle: 'Platinum Patron • INV-0002',
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
        senderTitle: 'Philanthropy Ambassador • INV-0003',
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
    code: 'INV-0001',
    name: 'Komjen Pol (Purn.) Drs. H. Hendra Wijaya beserta Keluarga',
    institution: 'Tamu Kehormatan VVIP',
    priority: 'P1 - VIP',
    format: 'Cetak + Online',
    pax: 4,
    rsvp: 'Hadir (4 Pax)',
    phone: '0811-8800-001',
  },
  {
    code: 'INV-0002',
    name: 'Prof. Dr. dr. Clarissa Wijaya, Sp.GK. & Partner',
    institution: 'Dewan Guru Besar Kedokteran',
    priority: 'P1 - VIP',
    format: 'Online Link',
    pax: 2,
    rsvp: 'Hadir (2 Pax)',
    phone: '0812-9900-002',
  },
  {
    code: 'INV-0003',
    name: 'Kombes Pol Aditya Pratama, S.I.K., M.Si.',
    institution: 'Rekan Kehormatan & Keluarga',
    priority: 'P1 - VIP',
    format: 'Online Link',
    pax: 2,
    rsvp: 'Hadir (2 Pax)',
    phone: '0813-7700-003',
  },
  {
    code: 'INV-0004',
    name: 'Jajaran Direksi PT Mahakarya Nusantara Mandiri',
    institution: 'Mitra Strategis Eksekutif',
    priority: 'P1 - VIP',
    format: 'Cetak Tebal',
    pax: 4,
    rsvp: 'Menunggu Konfirmasi',
    phone: '0815-6600-004',
  },
  {
    code: 'INV-0005',
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
      'Kelola daftar tamu VIP (Cetak & Online), kode unik INV-0001..0005, kuota 410 Pax, status RSVP, serta pratinjau pesan WhatsApp personal 1-klik.',
    descEn:
      'Manage VIP guests, unique INV-0001..0005 codes, 410 Pax quota, RSVP statuses, and 1-click personalized WhatsApp messages.',
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
    useState<string>('INV-0001');
  const [copiedSimWaLinkKey, setCopiedSimWaLinkKey] = useState<string | null>(
    null
  );
  const [simStudioNavTab, setSimStudioNavTab] = useState<string>('konten');
  const [simStudioOrnaments, setSimStudioOrnaments] = useState<{
    floralCorner: boolean;
    floatingParticles: boolean;
    calendarBtn: boolean;
  }>({
    floralCorner: true,
    floatingParticles: true,
    calendarBtn: true,
  });
  const [simStudioTransition, setSimStudioTransition] = useState<
    'CROSSFADE' | 'ZOOM_BLUR' | 'SLIDE'
  >('CROSSFADE');

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
          ? 'Simulasi Buku Tamu Live • INV-SIM'
          : 'Live Guestbook Simulation • INV-SIM',
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
          ? 'SIMULASI UNDANGAN INTERAKTIF • 100% VECTOR-SHARP'
          : 'INTERACTIVE INVITATION SIMULATOR • 100% VECTOR-SHARP',
      desc:
        lang === 'ID'
          ? 'Pratinjau layar penuh undangan digital editorial lengkap dengan jadwal 2 sesi, galeri interaktif, buku tamu live, dan amplop digital EMV.'
          : 'Fullscreen live editorial digital invitation with 2-session schedule, interactive gallery, live guestbook, and EMV digital envelope.',
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
    const waPreviewLink = `https://meplan.app/?client=${clientSlug}&code=${selectedWaGuest.code}`;

    return (
      <div className="bg-[#FAF8F5] text-stone-800 p-4 sm:p-6 space-y-5 select-none">
        {/* Top Workspace Header + Interactive 5-Event Category Switcher */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-[#1C1613] via-[#241C16] to-[#2C221B] text-[#FAF3E3] border border-[#D4AF37]/50 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/50 text-[#E6C76B] flex items-center justify-center shrink-0">
              <CatalogEventCrest
                eventType={activePreset.eventType}
                className="w-5 h-5"
              />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[9px] font-extrabold uppercase">
                  LIVE WORKSPACE DUMMY • 100% TAJAM
                </span>
                <span className="text-[10px] font-mono text-[#E6C76B]">
                  ID: {clientSlug}
                </span>
              </div>
              <p className="font-serif text-sm sm:text-base font-extrabold text-white truncate mt-0.5">
                {activePreset.titleFull}
              </p>
            </div>
          </div>

          {/* Event Preset Pills inside Dashboard Mockup */}
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
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
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-extrabold transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 border-[#D4AF37] shadow-2xs'
                      : 'bg-white/10 hover:bg-white/20 text-[#FAF3E3] border-white/15'
                  }`}
                >
                  {lang === 'ID' ? p.tabLabelId : p.tabLabelEn}
                </button>
              );
            })}
          </div>
        </div>

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
                    {lang === 'ID' ? 'Tamu VIP & Reguler' : 'VIP & Guests'}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[9px] font-extrabold">
                    48 VVIP
                  </span>
                </div>
                <p className="text-xl font-extrabold text-stone-900">
                  180 {lang === 'ID' ? 'Undangan' : 'Invites'}
                </p>
                <p className="text-[11px] font-bold text-[#8B6914]">
                  {lang === 'ID'
                    ? 'Total Kuota: 410 Pax'
                    : 'Total Quota: 410 Pax'}
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
                  154 {lang === 'ID' ? 'Hadir' : 'Attending'}
                </p>
                <p className="text-[11px] font-semibold text-stone-600">
                  38 {lang === 'ID' ? 'Ucapan Doa Restu' : 'Guestbook Wishes'}
                </p>
              </div>
            </div>

            {/* Multi-Session Live Countdown + Domain Progress & Audit Log */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left 7 cols: Multi-Session Countdown + Progress Bars */}
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
                            className="py-1 rounded-lg bg-stone-900 text-[#E6C76B] text-center font-mono text-[10px] font-extrabold"
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
                    <span className="px-2 py-0.5 rounded-md bg-stone-900 text-[#E6C76B] font-mono text-[9px] font-extrabold">
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
            {/* Phase Filter Bar + Dynamic Progress Pill */}
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
                        ? 'bg-stone-900 text-[#E6C76B] border border-[#D4AF37]'
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

            {/* Interactive Checklist Rows */}
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
                          <span className="px-2 py-0.5 rounded-md bg-stone-900 text-[#E6C76B] font-mono text-[9px] font-extrabold">
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
            {/* 4 Financial Summary Cards */}
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

            {/* 5 Dummy Vendor Contracts Table */}
            <div className="rounded-2xl bg-white border border-[#D4AF37]/40 overflow-hidden">
              <div className="px-4 py-3 bg-[#FAF3E3] border-b border-[#D4AF37]/35 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-extrabold text-stone-900">
                  {lang === 'ID'
                    ? 'Rincian Kontrak Vendor & Status Pelunasan (5 Vendor Utama)'
                    : 'Vendor Contracts & Payment Settlement Breakdown (5 Core Vendors)'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-stone-900 text-[#E6C76B] font-mono text-[10px] font-extrabold">
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
            {/* Summary Pills */}
            <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-[#D4AF37]/40">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-xl bg-stone-900 text-[#E6C76B] text-xs font-extrabold">
                  ★ P1 - VIP: 48 Tamu
                </span>
                <span className="px-3 py-1 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-xs font-extrabold">
                  ✉️ Cetak Tebal: 60
                </span>
                <span className="px-3 py-1 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-xs font-extrabold">
                  🌐 Online Link: 120
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-extrabold">
                  👥 Total Kuota: 410 Pax
                </span>
              </div>
              <span className="text-[11px] font-bold text-stone-500">
                {lang === 'ID'
                  ? 'Klik "Kirim WA" untuk melihat pratinjau pesan otomatis:'
                  : 'Click "Send WA" to preview auto-generated message:'}
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left 7 Cols: 5 Dummy VIP Guests */}
              <div className="lg:col-span-7 rounded-2xl bg-white border border-[#D4AF37]/40 divide-y divide-stone-200/80 overflow-hidden">
                {DUMMY_DASHBOARD_GUESTS.map((g) => {
                  const isSelected = selectedWaGuest.code === g.code;
                  const guestLink = `https://meplan.app/?client=${clientSlug}&code=${g.code}`;
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
                          <span className="px-2 py-0.5 rounded-md bg-stone-900 text-[#E6C76B] font-mono text-[10px] font-extrabold">
                            {g.code}
                          </span>
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
                          {g.institution} • RSVP:{' '}
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
              <div className="lg:col-span-5 p-4 rounded-2xl bg-gradient-to-br from-emerald-950 via-stone-900 to-stone-950 text-emerald-50 border border-[#D4AF37]/50 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#E6C76B]">
                    {lang === 'ID'
                      ? 'Pratinjau Pesan WhatsApp Otomatis'
                      : 'Auto-Generated WhatsApp Preview'}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[9px] font-extrabold">
                    {selectedWaGuest.code} ({selectedWaGuest.pax} Pax)
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 text-[11px] leading-relaxed space-y-2 font-sans text-stone-200">
                  <p>
                    Kepada Yth.{' '}
                    <strong className="text-[#E6C76B]">
                      {selectedWaGuest.name}
                    </strong>
                  </p>
                  <p>
                    Tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu
                    untuk menghadiri acara{' '}
                    <strong className="text-white">
                      {activePreset.titleFull}
                    </strong>{' '}
                    pada <strong>{activePreset.eventDate}</strong> di{' '}
                    <strong>{activePreset.eventVenue}</strong>.
                  </p>
                  <p className="font-mono text-[10px] text-[#E6C76B] break-all bg-white/5 p-2 rounded-lg border border-[#D4AF37]/30">
                    🔗 Link Privat: {waPreviewLink}
                    <br />🔑 Kode Akses VIP: {selectedWaGuest.code} (Kuota:{' '}
                    {selectedWaGuest.pax} Pax)
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopySimWaLink('preview-wa', waPreviewLink);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 font-extrabold text-xs inline-flex items-center justify-center gap-1.5"
                >
                  {copiedSimWaLinkKey === 'preview-wa' ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>✓ Link Undangan Dummy Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Salin Link & Pesan WhatsApp Dummy</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* MODUL 5: STUDIO PENGATURAN UNDANGAN, 3 SLOT MEDIA & SLIDESHOW   */}
        {/* =============================================================== */}
        {moduleId === 'pengaturan' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Left Mini-Sidebar (5 Studio Sections) */}
            <div className="lg:col-span-3 p-3 rounded-2xl bg-white border border-[#D4AF37]/40 space-y-1.5">
              <p className="px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                {lang === 'ID'
                  ? 'Menu Studio Kustomisasi'
                  : 'Customization Studio Menu'}
              </p>
              {[
                {
                  id: 'konten',
                  label:
                    lang === 'ID' ? '1. Konten Undangan' : '1. Invitation Content',
                },
                {
                  id: 'tema',
                  label:
                    lang === 'ID'
                      ? '2. Tema & 3 Slot Media'
                      : '2. Theme & 3 Media Slots',
                },
                {
                  id: 'jadwal',
                  label:
                    lang === 'ID'
                      ? '3. Jadwal & Lokasi Maps'
                      : '3. Schedule & Maps',
                },
                {
                  id: 'akun',
                  label:
                    lang === 'ID' ? '4. Akun & Akses WO' : '4. Accounts & Access',
                },
                {
                  id: 'database',
                  label:
                    lang === 'ID'
                      ? '5. Cloud & Backup JSON'
                      : '5. Cloud & JSON Backup',
                },
              ].map((nav) => (
                <button
                  key={nav.id}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSimStudioNavTab(nav.id);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center justify-between ${
                    simStudioNavTab === nav.id
                      ? 'bg-stone-900 text-[#E6C76B] border border-[#D4AF37]'
                      : 'bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-700'
                  }`}
                >
                  <span>{nav.label}</span>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                </button>
              ))}
            </div>

            {/* Right Panel: 3 Separate Media Sections + Ornament Toggles + Slideshow Transitions */}
            <div className="lg:col-span-9 p-4 rounded-2xl bg-white border border-[#D4AF37]/40 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-stone-200">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                    {lang === 'ID'
                      ? 'Arsitektur 3 Slot Media Terpisah & Transisi Sinematik'
                      : '3 Separate Media Slots & Cinematic Transitions'}
                  </span>
                  <h5 className="text-sm font-extrabold text-stone-900">
                    {activePreset.titleShort} — Studio Visual & Ornamen
                  </h5>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                  ✓ Auto-Save Cloud Aktif
                </span>
              </div>

              {/* 3 Separate Media Slots */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-2">
                  <span className="px-2 py-0.5 rounded-md bg-stone-900 text-[#E6C76B] text-[9px] font-extrabold">
                    SLOT 1 • SAMPUL DEPAN (COVER)
                  </span>
                  <div className="h-20 rounded-lg overflow-hidden relative border border-stone-300">
                    <img
                      src={activePreset.galleryPhotos[0].url}
                      alt="Cover Slot"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
                      2 Foto HD • Slideshow
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-stone-600">
                    Mendukung s/d 3 Foto (Maks 10 MB/foto) + Studio Crop
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-2">
                  <span className="px-2 py-0.5 rounded-md bg-stone-900 text-[#E6C76B] text-[9px] font-extrabold">
                    SLOT 2 • BANNER HERO EDITORIAL
                  </span>
                  <div className="h-20 rounded-lg overflow-hidden relative border border-stone-300">
                    <img
                      src={activePreset.galleryPhotos[1].url}
                      alt="Hero Slot"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/75 text-white text-[9px] font-bold">
                      1 Foto Aktif • Feathered
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-stone-600">
                    Alpha-Mask Feathering Halus + Animasi Ken Burns
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-2">
                  <span className="px-2 py-0.5 rounded-md bg-stone-900 text-[#E6C76B] text-[9px] font-extrabold">
                    SLOT 3 • WALLPAPER LATAR (VIDEO)
                  </span>
                  <div className="h-20 rounded-lg overflow-hidden relative border border-stone-300 bg-stone-900 flex items-center justify-center">
                    <img
                      src={activePreset.galleryPhotos[2].url}
                      alt="Wallpaper Slot"
                      className="w-full h-full object-cover opacity-70"
                    />
                    <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-extrabold">
                      🎬 1 Video MP4 Aktif (18.4 MB)
                    </span>
                  </div>
                  <p className="text-[10px] font-bold text-stone-600">
                    Video MP4/WebM s/d 25 MB (Auto-Stretch HP ke PC)
                  </p>
                </div>
              </div>

              {/* Interactive Ornament Toggles & Slideshow Transition Controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600">
                    {lang === 'ID'
                      ? 'Toggle Ornamen & Fitur Interaktif (Klik untuk Uji):'
                      : 'Interactive Ornament Toggles (Click to Test):'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        key: 'floralCorner' as const,
                        label: `🌸 Ornamen Sudut: ${simStudioOrnaments.floralCorner ? 'ON' : 'OFF'}`,
                      },
                      {
                        key: 'floatingParticles' as const,
                        label: `✨ Partikel Melayang: ${simStudioOrnaments.floatingParticles ? 'ON' : 'OFF'}`,
                      },
                      {
                        key: 'calendarBtn' as const,
                        label: `📅 Tombol Kalender: ${simStudioOrnaments.calendarBtn ? 'ON' : 'OFF'}`,
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
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold border transition-all ${
                          simStudioOrnaments[tog.key]
                            ? 'bg-emerald-700 text-white border-emerald-600'
                            : 'bg-white text-stone-500 border-stone-300'
                        }`}
                      >
                        {tog.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-stone-200 space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-600">
                    {lang === 'ID'
                      ? 'Gaya Transisi Slideshow Latar:'
                      : 'Background Slideshow Transition Style:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { id: 'CROSSFADE' as const, label: 'Crossfade Halus' },
                      { id: 'ZOOM_BLUR' as const, label: 'Zoom & Blur' },
                      { id: 'SLIDE' as const, label: 'Geser Halus' },
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
                            ? 'bg-stone-900 text-[#E6C76B] border-[#D4AF37]'
                            : 'bg-white text-stone-700 border-stone-300'
                        }`}
                      >
                        {tr.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
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
                                onClick={openSimInvitationLightbox}
                                title={
                                  lang === 'ID'
                                    ? 'Buka Simulasi Undangan di Layar Penuh'
                                    : 'Open Invitation Simulator in Fullscreen'
                                }
                                className="px-2.5 py-1 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border border-[#D4AF37]/45 text-[11px] font-extrabold inline-flex items-center gap-1 transition-all whitespace-nowrap"
                              >
                                <Maximize2 className="w-3 h-3 shrink-0" />
                                <span className="hidden sm:inline">
                                  {lang === 'ID' ? 'Layar Penuh' : 'Fullscreen'}
                                </span>
                              </button>

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
                            (() => {
                              const safeGalleryIdx =
                                ((simGalleryIdx %
                                  simPreset.galleryPhotos.length) +
                                  simPreset.galleryPhotos.length) %
                                simPreset.galleryPhotos.length;
                              const activeGalleryPhoto =
                                simPreset.galleryPhotos[safeGalleryIdx];
                              const combinedWishes = [
                                ...(simCustomWishes[simPreset.eventType] || []),
                                ...simPreset.dummyWishes,
                              ];
                              const activeEnvelope =
                                DUMMY_ENVELOPE_CHANNELS[
                                  simEnvelopeIdx %
                                    DUMMY_ENVELOPE_CHANNELS.length
                                ];

                              return (
                                <div className="max-h-[760px] overflow-y-auto bg-gradient-to-b from-[#FFFDF9] via-[#FAF6EE] to-[#F5EFE2] relative">
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

                                      {/* 4-Box Countdown + Save to Calendar Pill */}
                                      <div className="pt-2 flex flex-col items-center gap-3">
                                        <div className="grid grid-cols-4 gap-2 max-w-xs w-full mx-auto">
                                          {[
                                            {
                                              val: '14',
                                              lbl:
                                                lang === 'ID' ? 'Hari' : 'Days',
                                            },
                                            {
                                              val: '08',
                                              lbl:
                                                lang === 'ID' ? 'Jam' : 'Hours',
                                            },
                                            {
                                              val: '45',
                                              lbl:
                                                lang === 'ID'
                                                  ? 'Menit'
                                                  : 'Mins',
                                            },
                                            {
                                              val: String(
                                                countdownSeconds % 60
                                              ).padStart(2, '0'),
                                              lbl:
                                                lang === 'ID'
                                                  ? 'Detik'
                                                  : 'Secs',
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

                                  <div className="px-4 sm:px-8 py-8 sm:py-10 space-y-8">
                                    {/* 2. AYAT / KUTIPAN PEMBUKA (QUOTE CARD) */}
                                    <div className="max-w-2xl mx-auto p-5 rounded-3xl bg-white/90 border border-[#D4AF37]/40 shadow-2xs text-center space-y-2 relative overflow-hidden">
                                      <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#8B6914]">
                                        {lang === 'ID'
                                          ? 'Kutipan & Untaian Doa Pembuka'
                                          : 'Opening Blessing & Quote'}
                                      </span>
                                      <p className="font-editorial text-sm sm:text-base italic text-stone-700 leading-relaxed">
                                        {simPreset.quote}
                                      </p>
                                    </div>

                                    {/* 3. PROFIL MEMPELAI / TOKOH UTAMA */}
                                    <div className="space-y-5">
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

                                          <div className="md:col-span-1 flex items-center justify-center py-1">
                                            <span className="font-script text-4xl sm:text-5xl text-[#B68D40]">
                                              &amp;
                                            </span>
                                          </div>

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
                                        /* 1-PROFILE CENTERED SPOTLIGHT LAYOUT */
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
                                    </div>

                                    {/* 4. RANGKAIAN JADWAL ACARA (2 SESI DUMMY + DRESSCODE + GOOGLE MAPS) */}
                                    <div className="max-w-3xl mx-auto space-y-3">
                                      <div className="text-center space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#8B6914]">
                                          {lang === 'ID'
                                            ? 'Rangkaian Jadwal & Lokasi Acara'
                                            : 'Event Schedule & Venue'}
                                        </span>
                                        <h6 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
                                          {simPreset.eventTitle}
                                        </h6>
                                      </div>

                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {simPreset.sessions.map((ses) => (
                                          <div
                                            key={ses.badge}
                                            className="p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#D4AF37]/45 shadow-2xs space-y-2.5 flex flex-col justify-between"
                                          >
                                            <div className="space-y-1.5">
                                              <span className="inline-block px-2.5 py-0.5 rounded-md bg-stone-900 text-[#E6C76B] font-mono text-[9px] font-extrabold">
                                                {ses.badge}
                                              </span>
                                              <h6 className="font-editorial text-lg font-bold text-stone-900">
                                                {ses.title}
                                              </h6>
                                              <p className="text-xs font-extrabold text-[#8B6914]">
                                                {ses.date} &bull; {ses.time}
                                              </p>
                                              <p className="text-xs text-stone-600 flex items-start gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-[#B68D40] shrink-0 mt-0.5" />
                                                <span>{ses.venue}</span>
                                              </p>
                                              <p className="text-[11px] text-stone-500">
                                                <strong>Dresscode:</strong>{' '}
                                                {ses.dresscode}
                                              </p>
                                            </div>
                                            <div className="pt-2 border-t border-stone-200/70 flex items-center justify-between gap-2">
                                              <a
                                                href={ses.mapsUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-extrabold transition-all"
                                              >
                                                <MapPin className="w-3 h-3" />
                                                <span>
                                                  {lang === 'ID'
                                                    ? 'Buka Google Maps'
                                                    : 'Open Google Maps'}
                                                </span>
                                              </a>
                                              <span className="text-[10px] font-bold text-emerald-700">
                                                ✓ QR Gate Ready
                                              </span>
                                            </div>
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* 5. KISAH PERJALANAN / MILESTONE & GALERI INTERAKTIF (3 FOTO DUMMY) */}
                                    <div className="max-w-3xl mx-auto space-y-4">
                                      <div className="text-center space-y-1">
                                        <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#8B6914]">
                                          {lang === 'ID'
                                            ? 'Kisah Perjalanan & Galeri Resolusi Tinggi'
                                            : 'Milestone Story & High-Resolution Gallery'}
                                        </span>
                                        <h6 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900">
                                          {lang === 'ID'
                                            ? 'Momen Berharga & Galeri Interaktif'
                                            : 'Cherished Milestones & Interactive Gallery'}
                                        </h6>
                                      </div>

                                      {/* 3 Milestones Row */}
                                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        {simPreset.milestones.map((ms) => (
                                          <div
                                            key={ms.year + ms.title}
                                            className="p-3.5 rounded-2xl bg-white/90 border border-[#D4AF37]/40 space-y-1"
                                          >
                                            <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-mono text-[10px] font-extrabold">
                                              {ms.year}
                                            </span>
                                            <p className="text-xs font-extrabold text-stone-900">
                                              {ms.title}
                                            </p>
                                            <p className="text-[11px] text-stone-600 leading-relaxed">
                                              {ms.desc}
                                            </p>
                                          </div>
                                        ))}
                                      </div>

                                      {/* Interactive Gallery Viewer with 3 Clickable Thumbnails */}
                                      <div className="p-3.5 rounded-3xl bg-white/95 border border-[#D4AF37]/45 shadow-2xs space-y-3">
                                        <div className="relative h-56 sm:h-72 rounded-2xl overflow-hidden bg-stone-900">
                                          <img
                                            src={activeGalleryPhoto.url}
                                            alt={activeGalleryPhoto.caption}
                                            className="w-full h-full object-cover transition-all duration-500"
                                          />
                                          <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-between gap-2 text-white">
                                            <span className="text-xs font-bold truncate">
                                              {activeGalleryPhoto.caption}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-md bg-[#D4AF37] text-stone-950 font-mono text-[10px] font-extrabold shrink-0">
                                              {safeGalleryIdx + 1} /{' '}
                                              {simPreset.galleryPhotos.length}
                                            </span>
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-2.5">
                                          {simPreset.galleryPhotos.map(
                                            (gItem, gIdx) => {
                                              const isCurr =
                                                safeGalleryIdx === gIdx;
                                              return (
                                                <button
                                                  key={gItem.url}
                                                  type="button"
                                                  onClick={() =>
                                                    setSimGalleryIdx(gIdx)
                                                  }
                                                  className={`relative h-16 sm:h-20 rounded-xl overflow-hidden border-2 transition-all ${
                                                    isCurr
                                                      ? 'border-[#B68D40] ring-2 ring-[#D4AF37]/40 scale-[1.01]'
                                                      : 'border-transparent opacity-75 hover:opacity-100'
                                                  }`}
                                                >
                                                  <img
                                                    src={gItem.url}
                                                    alt={gItem.caption}
                                                    className="w-full h-full object-cover"
                                                  />
                                                </button>
                                              );
                                            }
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* 6. SIMULASI FORM RSVP & BUKU TAMU DUMMY INTERAKTIF */}
                                    <div className="max-w-3xl mx-auto p-4 sm:p-6 rounded-3xl bg-white/95 border border-[#D4AF37]/45 shadow-2xs space-y-4">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div>
                                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                                            {lang === 'ID'
                                              ? 'Simulasi RSVP & Buku Tamu Doa Restu'
                                              : 'Interactive RSVP & Guestbook Simulation'}
                                          </span>
                                          <h6 className="font-editorial text-lg sm:text-xl font-bold text-stone-900">
                                            {lang === 'ID'
                                              ? `${combinedWishes.length} Ucapan Tamu VIP & Balasan Tuan Rumah`
                                              : `${combinedWishes.length} VIP Guest Wishes & Host Replies`}
                                          </h6>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                                          ✓ Uji Kirim Ucapan Live
                                        </span>
                                      </div>

                                      {/* Interactive Mini RSVP & Wish Form */}
                                      <form
                                        onSubmit={handleSubmitSimWish}
                                        className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35 space-y-2.5"
                                      >
                                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                                          <input
                                            type="text"
                                            value={simWishName}
                                            onChange={(e) =>
                                              setSimWishName(e.target.value)
                                            }
                                            placeholder={
                                              lang === 'ID'
                                                ? 'Nama Anda (contoh: Budi & Keluarga)...'
                                                : 'Your Name (e.g. John & Family)...'
                                            }
                                            className="sm:col-span-5 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 focus:border-[#B68D40] focus:outline-none"
                                          />
                                          <select
                                            value={simRsvpStatus}
                                            onChange={(e) =>
                                              setSimRsvpStatus(
                                                e.target.value as
                                                  | 'HADIR'
                                                  | 'BERHALANGAN'
                                              )
                                            }
                                            className="sm:col-span-4 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 focus:border-[#B68D40] focus:outline-none"
                                          >
                                            <option value="HADIR">
                                              {lang === 'ID'
                                                ? '✓ Hadir di Acara'
                                                : '✓ Attending'}
                                            </option>
                                            <option value="BERHALANGAN">
                                              {lang === 'ID'
                                                ? '🙏 Berhalangan (Doa Restu)'
                                                : '🙏 Warm Regards'}
                                            </option>
                                          </select>
                                          <select
                                            value={simRsvpPax}
                                            onChange={(e) =>
                                              setSimRsvpPax(
                                                Number(e.target.value)
                                              )
                                            }
                                            className="sm:col-span-3 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-800 focus:border-[#B68D40] focus:outline-none"
                                          >
                                            <option value={1}>1 Pax</option>
                                            <option value={2}>2 Pax</option>
                                            <option value={3}>3 Pax</option>
                                            <option value={4}>4 Pax</option>
                                          </select>
                                        </div>

                                        <div className="flex flex-col sm:flex-row gap-2">
                                          <input
                                            type="text"
                                            value={simWishText}
                                            onChange={(e) =>
                                              setSimWishText(e.target.value)
                                            }
                                            placeholder={
                                              lang === 'ID'
                                                ? 'Tulis ucapan doa restu simulasi atau langsung klik tombol kirim...'
                                                : 'Write a sample wish or click send directly...'
                                            }
                                            className="flex-1 px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs text-stone-800 focus:border-[#B68D40] focus:outline-none"
                                          />
                                          <button
                                            type="submit"
                                            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shrink-0 shadow-2xs"
                                          >
                                            <Send className="w-3.5 h-3.5" />
                                            <span>
                                              {lang === 'ID'
                                                ? 'Kirim Ucapan Dummy'
                                                : 'Send Dummy Wish'}
                                            </span>
                                          </button>
                                        </div>

                                        {simWishFeedback && (
                                          <p className="text-[11px] font-extrabold text-emerald-700">
                                            {simWishFeedback}
                                          </p>
                                        )}
                                      </form>

                                      {/* List of Guestbook Wishes */}
                                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                                        {combinedWishes.map((w) => (
                                          <div
                                            key={w.id}
                                            className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 space-y-2"
                                          >
                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                              <div>
                                                <p className="text-xs font-extrabold text-stone-900">
                                                  {w.senderName}
                                                </p>
                                                <p className="text-[10px] text-stone-500">
                                                  {w.senderTitle} &bull;{' '}
                                                  {w.timestamp}
                                                </p>
                                              </div>
                                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-extrabold">
                                                {w.attendanceBadge}
                                              </span>
                                            </div>
                                            <p className="text-xs text-stone-700 leading-relaxed">
                                              &ldquo;{w.message}&rdquo;
                                            </p>
                                            {w.hostReply && (
                                              <div className="p-2.5 rounded-xl bg-[#FAF3E3]/80 border-l-2 border-[#B68D40] text-[11px] text-stone-700">
                                                <span className="font-extrabold text-[#8B6914] block">
                                                  Balasan Tuan Rumah (
                                                  {simPreset.titleShort}):
                                                </span>
                                                <span>{w.hostReply}</span>
                                              </div>
                                            )}
                                          </div>
                                        ))}
                                      </div>
                                    </div>

                                    {/* 7. AMPLOP DIGITAL BER-CHIP EMV EMAS INTERAKTIF (4 KANAL DUMMY) */}
                                    <div className="max-w-3xl mx-auto p-5 rounded-3xl bg-gradient-to-br from-[#1C1613] via-[#251C16] to-[#33261D] text-[#FAF3E3] border-2 border-[#D4AF37]/65 shadow-md space-y-4 relative overflow-hidden">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2.5">
                                          <CatalogGoldEmvChip className="w-10 h-8" />
                                          <div>
                                            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#E6C76B] block">
                                              Amplop Digital Multi-Valuta (EMV
                                              Gold Chip)
                                            </span>
                                            <h6 className="font-editorial text-lg font-bold text-white">
                                              {activeEnvelope.provider}
                                            </h6>
                                          </div>
                                        </div>
                                        <span className="px-2.5 py-1 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/45 text-[#E6C76B] text-[10px] font-extrabold">
                                          {activeEnvelope.badge}
                                        </span>
                                      </div>

                                      {/* 4 Channel Selector Pills */}
                                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {DUMMY_ENVELOPE_CHANNELS.map(
                                          (env, envIdx) => {
                                            const isAct =
                                              activeEnvelope.id === env.id;
                                            return (
                                              <button
                                                key={env.id}
                                                type="button"
                                                onClick={() =>
                                                  setSimEnvelopeIdx(envIdx)
                                                }
                                                className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold border transition-all truncate ${
                                                  isAct
                                                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 border-[#D4AF37]'
                                                    : 'bg-white/10 hover:bg-white/20 text-[#FAF3E3] border-white/15'
                                                }`}
                                              >
                                                {env.label}
                                              </button>
                                            );
                                          }
                                        )}
                                      </div>

                                      <div className="p-3.5 rounded-2xl bg-black/40 border border-[#D4AF37]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                        <div className="min-w-0">
                                          <p className="font-mono text-sm sm:text-base font-extrabold tracking-wider text-white break-all">
                                            {activeEnvelope.accountNumber}
                                          </p>
                                          <p className="text-xs text-[#E6C76B] mt-0.5">
                                            a.n. {simPreset.titleShort} (Data
                                            Simulasi Resmi)
                                          </p>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleCopySimEnvelope(
                                              activeEnvelope.id,
                                              activeEnvelope.accountNumber
                                            )
                                          }
                                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] hover:from-[#C5A059] hover:to-[#D4AF37] text-stone-950 text-xs font-extrabold inline-flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-all"
                                        >
                                          {copiedSimEnvelopeKey ===
                                          activeEnvelope.id ? (
                                            <>
                                              <Check className="w-4 h-4 text-emerald-950" />
                                              <span>
                                                ✓ Nomor Dummy Tersalin!
                                              </span>
                                            </>
                                          ) : (
                                            <>
                                              <Copy className="w-3.5 h-3.5" />
                                              <span>Salin Rekening Dummy</span>
                                            </>
                                          )}
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })()
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
                              https://meplan.app/workspace/{currentShot.id}
                            </span>
                            <span className="hidden lg:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[9px] font-extrabold whitespace-nowrap">
                              ● LIVE UI • 100% VECTOR-SHARP
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

                        {/* Live Vector-Sharp Interactive React UI Viewport (Zero Raster Blur) */}
                        <div className="relative bg-[#FAF8F5] overflow-hidden">
                          {renderLiveDashboardModule(currentShot.id)}
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
                            <div className="relative h-28 bg-gradient-to-br from-stone-950 via-stone-900 to-[#221A14] overflow-hidden border-b border-stone-200/80 p-3 flex flex-col justify-between">
                              <div className="flex items-center justify-between gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-[#D4AF37]/20 border border-[#D4AF37]/45 text-[#E6C76B] font-mono text-[9px] font-extrabold whitespace-nowrap">
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
                                  className="p-1.5 rounded-lg bg-black/70 hover:bg-black text-white border border-white/20 transition-all"
                                >
                                  <Maximize2 className="w-3 h-3 text-[#E6C76B]" />
                                </button>
                              </div>
                              <div className="rounded-xl bg-white/10 border border-[#D4AF37]/30 px-2.5 py-2 flex items-center justify-between gap-2">
                                <span className="text-[10px] font-extrabold text-[#FAF3E3] truncate">
                                  {shot.kpiSummary}
                                </span>
                                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[8px] font-extrabold shrink-0">
                                  LIVE UI
                                </span>
                              </div>
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

      {/* FULLSCREEN LIVE VECTOR-SHARP UI LIGHTBOX MODAL */}
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
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-[9px] font-extrabold whitespace-nowrap">
                  ● 100% VECTOR-SHARP LIVE UI
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {lightboxScreenshot.mode !== 'invitation_sim' && (
                  <>
                    <button
                      type="button"
                      onClick={() => openLightboxAt(activeShowcaseIdx - 1)}
                      title={
                        lang === 'ID'
                          ? 'Modul Sebelumnya'
                          : 'Previous Module'
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF3E3] border border-white/15 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span className="hidden sm:inline">
                        {lang === 'ID' ? 'Sebelumnya' : 'Prev'}
                      </span>
                    </button>
                    <span className="text-xs font-mono font-bold text-[#E6C76B] px-1">
                      {activeShowcaseIdx + 1} /{' '}
                      {OFFICIAL_PRODUCT_SCREENSHOTS.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => openLightboxAt(activeShowcaseIdx + 1)}
                      title={
                        lang === 'ID' ? 'Modul Berikutnya' : 'Next Module'
                      }
                      className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#FAF3E3] border border-white/15 text-xs font-bold inline-flex items-center gap-1 whitespace-nowrap transition-all"
                    >
                      <span className="hidden sm:inline">
                        {lang === 'ID' ? 'Berikutnya' : 'Next'}
                      </span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
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

            {/* Live Vector-Sharp Interactive React Body */}
            <div className="flex-1 overflow-y-auto bg-[#FAF8F5]">
              {lightboxScreenshot.mode === 'invitation_sim' ? (
                (() => {
                  const activePreset =
                    SIMULATION_EVENT_PRESETS[simEventType] ||
                    SIMULATION_EVENT_PRESETS.WEDDING;
                  return (
                    <div className="p-4 sm:p-6 space-y-5">
                      <div className="rounded-3xl overflow-hidden border border-[#D4AF37]/45 bg-stone-950 text-[#FAF3E3] relative">
                        <div className="relative h-56 sm:h-72 overflow-hidden">
                          <img
                            src={activePreset.heroImage}
                            alt={activePreset.titleShort}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/60 to-transparent" />
                          <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-wrap items-end justify-between gap-3">
                            <div>
                              <span className="px-3 py-1 rounded-full bg-[#D4AF37]/25 border border-[#D4AF37]/60 text-[#FAF3E3] font-mono text-[10px] font-extrabold uppercase tracking-wider">
                                {lang === 'ID'
                                  ? activePreset.badgeId
                                  : activePreset.badgeEn}
                              </span>
                              <h3 className="font-editorial text-2xl sm:text-4xl font-bold text-white mt-2">
                                {activePreset.titleShort}
                              </h3>
                              <p className="text-xs sm:text-sm text-[#E6C76B] font-semibold mt-0.5">
                                {lang === 'ID'
                                  ? activePreset.eventDateId
                                  : activePreset.eventDateEn}{' '}
                                • {activePreset.venueName}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {(
                                Object.keys(
                                  SIMULATION_EVENT_PRESETS
                                ) as EventCategoryType[]
                              ).map((evKey) => {
                                const p = SIMULATION_EVENT_PRESETS[evKey];
                                const isSel = simEventType === evKey;
                                return (
                                  <button
                                    key={evKey}
                                    type="button"
                                    onClick={() => {
                                      setSimEventType(evKey);
                                      setSimGalleryIdx(0);
                                    }}
                                    className={`px-2.5 py-1.5 rounded-xl text-[10px] font-extrabold transition-all ${
                                      isSel
                                        ? 'bg-[#D4AF37] text-stone-950 shadow-2xs'
                                        : 'bg-black/60 text-[#FAF3E3] border border-white/20 hover:border-[#D4AF37]/50'
                                    }`}
                                  >
                                    {p.emoji}{' '}
                                    {lang === 'ID' ? p.labelId : p.labelEn}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                      {renderLiveDashboardModule('pengaturan')}
                    </div>
                  );
                })()
              ) : (
                renderLiveDashboardModule(
                  lightboxScreenshot.moduleId ||
                    OFFICIAL_PRODUCT_SCREENSHOTS[activeShowcaseIdx]?.id ||
                    'tracker'
                )
              )}
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
                      activeShowcaseIdx === idx &&
                      lightboxScreenshot.mode !== 'invitation_sim'
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
