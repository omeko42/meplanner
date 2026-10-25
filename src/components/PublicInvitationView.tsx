'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  Music,
  Volume2,
  VolumeX,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  ListMusic,
  Send,
  Copy,
  Check,
  Gift,
  CheckCircle2,
  Users,
  MessageSquareHeart,
  ExternalLink,
  QrCode,
  BookOpen,
  Camera,
  Lock,
  Award,
  Pin,
  X,
  Sparkles,
  Shield,
  Search,
  Globe,
} from 'lucide-react';
import {
  WeddingSettings,
  WeddingGuest,
  GuestWish,
  RsvpStatus,
  GalleryPhotoItem,
  BackgroundSlideItem,
  PhotoAdjustment,
  MusicTrackItem,
  InvitationInteractionType,
  EventCategoryType,
} from '@/types';
import {
  weddingMusicPlayer,
  getEffectiveMusicPlaylist,
  getEffectiveScheduleEvents,
  getEffectiveLoveStory,
  getEffectiveGalleryPhotos,
  getPhotoAdjustStyle,
  analyzeWishModeration,
  formatForensicUserAgent,
} from '@/lib/clientSync';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
import { InfoTooltip } from '@/components/InfoTooltip';
import {
  computeGuestInvitationHash,
  matchGuestWithinSingleClient,
} from '@/lib/guestTokenHash';
import {
  MEPLANNER_BRAND_LOGOS,
  MEPLANNER_ICONS,
  MEPLANNER_WEBKIT_COMPONENTS,
  MEPLANNER_THEME_ASSETS,
  resolveThemeWebkitBundle,
  ThemeWebkitBundle,
} from '@/lib/meplannerBrandKit';

interface PublicInvitationViewProps {
  settings: WeddingSettings;
  guests: WeddingGuest[];
  wishes: GuestWish[];
  guestParamName: string;
  guestParamCode: string;
  isAdminLoggedIn: boolean;
  defaultOpened?: boolean;
  externalLang?: 'ID' | 'EN';
  onOpenAdminPortal: () => void;
  onOpenLandingPage?: () => void;
  onTrackAnalytics?: (payload: {
    type: InvitationInteractionType;
    guestName?: string;
    invitationCode?: string;
    detail?: string;
    deviceInfo?: string;
  }) => void;
  onSubmitRsvp: (payload: {
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
  }) => Promise<void>;
}

type InvitationThemeKey =
  | 'champagne_gold'
  | 'sage_botanical'
  | 'blush_rose'
  | 'royal_navy'
  | 'terracotta_rust'
  | 'javanese_kraton'
  | 'wayang_gold'
  | 'midnight_elegance'
  | 'espresso_rustic'
  | 'blubloom_azure';

export type ThemeLayoutArchetype =
  | 'POLAROID_MAGAZINE'
  | 'BOTANICAL_AIRY'
  | 'NUSANTARA_HERITAGE'
  | 'MODERN_BENTO'
  | 'EDITORIAL_CLASSIC';

function resolveInvitationThemePreset(raw?: string): InvitationThemeKey {
  if (!raw) return 'champagne_gold';
  const normalized = raw.trim().toLowerCase();
  if (normalized === 'sage_botanical' || normalized === 'sage-garden') {
    return 'sage_botanical';
  }
  if (normalized === 'blush_rose' || normalized === 'ivory-rose') {
    return 'blush_rose';
  }
  if (normalized === 'royal_navy' || normalized === 'royal-navy') {
    return 'royal_navy';
  }
  if (normalized === 'terracotta_rust' || normalized === 'terracotta-rust') {
    return 'terracotta_rust';
  }
  if (normalized === 'javanese_kraton' || normalized === 'javanese-kraton') {
    return 'javanese_kraton';
  }
  if (normalized === 'wayang_gold' || normalized === 'wayang-gold') {
    return 'wayang_gold';
  }
  if (normalized === 'midnight_elegance' || normalized === 'midnight-elegance') {
    return 'midnight_elegance';
  }
  if (normalized === 'espresso_rustic' || normalized === 'espresso-rustic') {
    return 'espresso_rustic';
  }
  if (normalized === 'blubloom_azure' || normalized === 'blubloom-azure') {
    return 'blubloom_azure';
  }
  return 'champagne_gold';
}

function resolveThemeLayoutArchetype(
  settings: WeddingSettings,
  themeKey: InvitationThemeKey
): ThemeLayoutArchetype {
  const explicit = String(
    (settings as WeddingSettings & { themeLayoutArchetype?: string })
      .themeLayoutArchetype || ''
  )
    .trim()
    .toUpperCase();
  if (
    explicit === 'POLAROID_MAGAZINE' ||
    explicit === 'BOTANICAL_AIRY' ||
    explicit === 'NUSANTARA_HERITAGE' ||
    explicit === 'MODERN_BENTO' ||
    explicit === 'EDITORIAL_CLASSIC'
  ) {
    return explicit as ThemeLayoutArchetype;
  }

  const rawEventCategory = String(
    (settings as WeddingSettings & { eventCategoryType?: string })
      .eventCategoryType ||
      settings.eventType ||
      'WEDDING'
  )
    .trim()
    .toUpperCase();

  if (
    rawEventCategory === 'MEETING' ||
    rawEventCategory === 'GRADUATION' ||
    rawEventCategory === 'GALA_DINNER'
  ) {
    return 'MODERN_BENTO';
  }

  if (
    themeKey === 'terracotta_rust' ||
    themeKey === 'javanese_kraton' ||
    themeKey === 'wayang_gold'
  ) {
    return 'NUSANTARA_HERITAGE';
  }

  if (
    themeKey === 'sage_botanical' ||
    themeKey === 'blush_rose' ||
    themeKey === 'blubloom_azure'
  ) {
    return 'BOTANICAL_AIRY';
  }

  if (
    settings.profileFrameStyle === 'EDITORIAL_RECT' ||
    themeKey === 'espresso_rustic' ||
    rawEventCategory === 'BIRTHDAY'
  ) {
    return 'POLAROID_MAGAZINE';
  }

  if (themeKey === 'royal_navy' || themeKey === 'midnight_elegance') {
    return 'MODERN_BENTO';
  }

  return 'EDITORIAL_CLASSIC';
}

const INVITATION_THEME_VEIL_RGB: Record<InvitationThemeKey, string> = {
  champagne_gold: '255, 253, 249',
  sage_botanical: '247, 250, 247',
  blush_rose: '255, 247, 249',
  royal_navy: '245, 248, 252',
  terracotta_rust: '253, 248, 245',
  javanese_kraton: '255, 253, 249',
  wayang_gold: '255, 253, 249',
  midnight_elegance: '245, 248, 252',
  espresso_rustic: '253, 248, 245',
  blubloom_azure: '245, 248, 252',
};

interface FloralCornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  enabled?: boolean;
}

const FloralCornerOrnament: React.FC<FloralCornerOrnamentProps> = ({
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
      ? 'w-16 h-16 sm:w-20 sm:h-20'
      : size === 'lg'
      ? 'w-28 h-28 sm:w-36 sm:h-36'
      : 'w-20 h-20 sm:w-28 sm:h-28';

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
        {/* Soft Theme Glow Backdrop */}
        <circle
          cx="24"
          cy="24"
          r="22"
          style={{ fill: 'var(--inv-primary, #D4AF37)' }}
          fillOpacity="0.10"
        />
        {/* Main Curved Botanical Stems */}
        <path
          d="M6 108C8 64 34 32 106 8"
          style={{ stroke: 'var(--inv-mid, #C5A059)' }}
          strokeWidth="1.6"
          strokeLinecap="round"
        />
        <path
          d="M4 76C18 46 44 24 84 12"
          style={{ stroke: 'var(--inv-primary, #D4AF37)' }}
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeDasharray="2 2"
        />
        {/* Delicate Botanical Leaves Along Stem */}
        <path
          d="M22 72C12 64 12 50 24 46C30 56 28 66 22 72Z"
          style={{
            fill: 'var(--inv-leaf-fill, #E6C994)',
            stroke: 'var(--inv-dark, #B68D40)',
          }}
          fillOpacity="0.65"
          strokeWidth="1"
        />
        <path
          d="M42 50C34 38 38 24 52 22C54 34 50 44 42 50Z"
          style={{
            fill: 'var(--inv-soft-bg, #FAF3E3)',
            stroke: 'var(--inv-mid, #C5A059)',
          }}
          strokeWidth="1.1"
        />
        <path
          d="M68 28C64 18 70 10 82 10C82 18 76 25 68 28Z"
          style={{
            fill: 'var(--inv-leaf-fill, #E6C994)',
            stroke: 'var(--inv-dark, #B68D40)',
          }}
          fillOpacity="0.6"
          strokeWidth="1"
        />
        <path
          d="M34 62C46 58 56 64 58 76C46 76 38 70 34 62Z"
          style={{
            fill: 'var(--inv-soft-bg, #FAF3E3)',
            stroke: 'var(--inv-mid, #C5A059)',
          }}
          strokeWidth="1"
        />
        <path
          d="M56 38C68 36 76 42 78 52C67 52 60 46 56 38Z"
          style={{
            fill: 'var(--inv-leaf-fill, #E6C994)',
            stroke: 'var(--inv-dark, #B68D40)',
          }}
          fillOpacity="0.55"
          strokeWidth="1"
        />
        {/* Corner Rose / Jasmine Blossom */}
        <circle
          cx="28"
          cy="28"
          r="11"
          style={{
            fill: 'var(--inv-soft-bg, #FAF3E3)',
            stroke: 'var(--inv-mid, #C5A059)',
          }}
          strokeWidth="1.3"
        />
        <circle
          cx="28"
          cy="28"
          r="6.5"
          style={{
            fill: 'var(--inv-leaf-fill, #E6C994)',
            stroke: 'var(--inv-dark, #B68D40)',
          }}
          fillOpacity="0.75"
          strokeWidth="1"
        />
        <circle
          cx="28"
          cy="28"
          r="2.8"
          style={{ fill: 'var(--inv-text-muted, #9A742B)' }}
        />
        {/* Pearl & Theme Berries */}
        <circle
          cx="16"
          cy="46"
          r="3"
          style={{
            fill: 'var(--inv-card-tint, #FFFDF9)',
            stroke: 'var(--inv-mid, #C5A059)',
          }}
          strokeWidth="1"
        />
        <circle
          cx="48"
          cy="18"
          r="3.2"
          style={{
            fill: 'var(--inv-card-tint, #FFFDF9)',
            stroke: 'var(--inv-mid, #C5A059)',
          }}
          strokeWidth="1"
        />
        <circle
          cx="18"
          cy="88"
          r="2.5"
          style={{ fill: 'var(--inv-primary, #D4AF37)' }}
        />
        <circle
          cx="88"
          cy="16"
          r="2.5"
          style={{ fill: 'var(--inv-primary, #D4AF37)' }}
        />
        <circle
          cx="62"
          cy="56"
          r="2"
          style={{ fill: 'var(--inv-mid, #C5A059)' }}
        />
      </svg>
    </div>
  );
};

const BotanicalCornerSprig: React.FC<FloralCornerOrnamentProps> = (props) => (
  <FloralCornerOrnament {...props} />
);

const NusantaraGoldCornerBracket: React.FC<{
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  enabled?: boolean;
}> = ({ position, enabled = true }) => {
  if (!enabled) return null;
  const posClasses =
    position === 'top-left'
      ? 'top-3 left-3 border-t-2 border-l-2 rounded-tl-xl'
      : position === 'top-right'
      ? 'top-3 right-3 border-t-2 border-r-2 rounded-tr-xl'
      : position === 'bottom-left'
      ? 'bottom-3 left-3 border-b-2 border-l-2 rounded-bl-xl'
      : 'bottom-3 right-3 border-b-2 border-r-2 rounded-br-xl';
  const diamondPos =
    position === 'top-left'
      ? 'top-1.5 left-1.5'
      : position === 'top-right'
      ? 'top-1.5 right-1.5'
      : position === 'bottom-left'
      ? 'bottom-1.5 left-1.5'
      : 'bottom-1.5 right-1.5';
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none absolute z-10 w-10 h-10 sm:w-14 sm:h-14 border-[#C89D54] ${posClasses}`}
    >
      <span
        className={`absolute w-2.5 h-2.5 rotate-45 bg-[#C89D54]/30 border border-[#8b5a2b] ${diamondPos}`}
      />
    </div>
  );
};

const WebkitThreeLayerCornering: React.FC<{
  bundle: ThemeWebkitBundle;
  enabled?: boolean;
}> = ({ bundle, enabled = true }) => {
  if (!enabled) return null;
  const isDedicatedTop = bundle.cornerClusterTopSvg.includes('corner-top-');

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none absolute inset-0 overflow-hidden z-20"
    >
      {/* Top-Left Hanging Corner */}
      <div className="pointer-events-none select-none absolute -top-2 -left-2 w-28 h-28 sm:w-40 sm:h-40 origin-top-left animate-floral-sway">
        <img
          src={bundle.cornerClusterTopSvg}
          alt=""
          className={`w-full h-full object-contain ${
            isDedicatedTop ? '' : 'scale-y-[-1]'
          }`}
        />
      </div>

      {/* Top-Right Hanging Corner */}
      <div className="pointer-events-none select-none absolute -top-2 -right-2 w-28 h-28 sm:w-40 sm:h-40 origin-top-right animate-floral-sway-reverse">
        <img
          src={bundle.cornerClusterTopSvg}
          alt=""
          className={`w-full h-full object-contain scale-x-[-1] ${
            isDedicatedTop ? '' : 'scale-y-[-1]'
          }`}
        />
      </div>

      {/* Bottom-Left 3-Layer Bouquet Stack */}
      <div className="pointer-events-none select-none absolute -bottom-2 -left-2.5 w-32 h-32 sm:w-44 sm:h-44 z-[21] origin-bottom-left animate-floral-sway">
        <img
          src={bundle.cornerClusterBottomSvg}
          alt=""
          className="w-full h-full object-contain"
        />
      </div>
      <div className="pointer-events-none select-none absolute -bottom-5 left-5 sm:left-7 w-24 h-24 sm:w-32 sm:h-32 z-[22] origin-bottom-left rotate-6 scale-95 opacity-95 animate-floral-sway-reverse">
        <img
          src={bundle.cornerClusterBottomSvg}
          alt=""
          className="w-full h-full object-contain"
        />
      </div>
      <div className="pointer-events-none select-none absolute -bottom-7 left-12 sm:left-16 w-20 h-20 sm:w-28 sm:h-28 z-[23] origin-bottom rotate-12 scale-90 opacity-90 animate-floral-sway">
        <img
          src={bundle.cornerClusterBottomSvg}
          alt=""
          className="w-full h-full object-contain"
        />
      </div>

      {/* Bottom-Right 3-Layer Mirrored Bouquet Stack */}
      <div className="pointer-events-none select-none absolute -bottom-2 -right-2.5 w-32 h-32 sm:w-44 sm:h-44 z-[21] origin-bottom-right animate-floral-sway-reverse">
        <img
          src={bundle.cornerClusterBottomSvg}
          alt=""
          className="w-full h-full object-contain scale-x-[-1]"
        />
      </div>
      <div className="pointer-events-none select-none absolute -bottom-5 right-5 sm:right-7 w-24 h-24 sm:w-32 sm:h-32 z-[22] origin-bottom-right -rotate-6 scale-95 opacity-95 animate-floral-sway">
        <img
          src={bundle.cornerClusterBottomSvg}
          alt=""
          className="w-full h-full object-contain scale-x-[-1]"
        />
      </div>
      <div className="pointer-events-none select-none absolute -bottom-7 right-12 sm:right-16 w-20 h-20 sm:w-28 sm:h-28 z-[23] origin-bottom -rotate-12 scale-90 opacity-90 animate-floral-sway-reverse">
        <img
          src={bundle.cornerClusterBottomSvg}
          alt=""
          className="w-full h-full object-contain scale-x-[-1]"
        />
      </div>
    </div>
  );
};

const WebkitCardFourCorners: React.FC<{
  cornerSvg: string;
  size?: 'sm' | 'md';
  enabled?: boolean;
}> = ({ cornerSvg, size = 'md', enabled = true }) => {
  if (!enabled || !cornerSvg) return null;
  const dimClass =
    size === 'sm' ? 'w-9 h-9 sm:w-11 sm:h-11' : 'w-11 h-11 sm:w-14 sm:h-14';
  return (
    <>
      <img
        src={cornerSvg}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none select-none absolute top-1.5 left-1.5 z-10 object-contain opacity-80 ${dimClass}`}
      />
      <img
        src={cornerSvg}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none select-none absolute top-1.5 right-1.5 z-10 object-contain opacity-80 scale-x-[-1] ${dimClass}`}
      />
      <img
        src={cornerSvg}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none select-none absolute bottom-1.5 left-1.5 z-10 object-contain opacity-80 scale-y-[-1] ${dimClass}`}
      />
      <img
        src={cornerSvg}
        alt=""
        aria-hidden="true"
        className={`pointer-events-none select-none absolute bottom-1.5 right-1.5 z-10 object-contain opacity-80 scale-x-[-1] scale-y-[-1] ${dimClass}`}
      />
    </>
  );
};

const WebkitSectionDivider: React.FC<{
  src: string;
  className?: string;
}> = ({ src, className = '' }) => {
  if (!src) return null;
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none relative z-10 flex items-center justify-center py-2 sm:py-3.5 px-4 max-w-3xl mx-auto ${className}`}
    >
      <img
        src={src}
        alt=""
        className="w-52 sm:w-72 md:w-80 h-8 sm:h-12 object-contain opacity-90 drop-shadow-[0_2px_8px_rgba(197,160,89,0.24)]"
      />
    </div>
  );
};

function resolveNaturalEventBadge(
  rawBadge: string | undefined,
  eventType: EventCategoryType,
  lang: 'ID' | 'EN'
): string {
  const naturalByType: Record<EventCategoryType, string> = {
    WEDDING: lang === 'ID' ? 'Undangan Pernikahan' : 'The Wedding Of',
    BIRTHDAY: lang === 'ID' ? 'Perayaan Ulang Tahun' : 'Birthday Celebration',
    GRADUATION: lang === 'ID' ? 'Syukuran Wisuda' : 'Graduation Celebration',
    MEETING:
      lang === 'ID' ? 'Undangan Rapat Resmi' : 'Official Executive Invitation',
    GALA_DINNER:
      lang === 'ID' ? 'Malam Apresiasi & Gala Dinner' : 'Royal Gala Dinner',
  };
  const fallback = naturalByType[eventType] || naturalByType.WEDDING;
  if (!rawBadge || !rawBadge.trim()) return fallback;
  const cleaned = rawBadge.trim();
  if (/tema\s*:|theme\s*:/i.test(cleaned)) {
    return fallback;
  }
  if (
    lang === 'EN' &&
    /undangan|pernikahan|perayaan|syukuran|mempelai|hari bahagia/i.test(cleaned)
  ) {
    return fallback;
  }
  return cleaned;
}

const FLOATING_PETALS_DATA = [
  { id: 1, left: '6%', duration: '13s', delay: '0s', size: 14, isSparkle: false },
  { id: 2, left: '14%', duration: '16s', delay: '2.5s', size: 10, isSparkle: true },
  { id: 3, left: '23%', duration: '12s', delay: '1.2s', size: 16, isSparkle: false },
  { id: 4, left: '32%', duration: '18s', delay: '4.5s', size: 11, isSparkle: true },
  { id: 5, left: '41%', duration: '14s', delay: '0.8s', size: 15, isSparkle: false },
  { id: 6, left: '50%', duration: '17s', delay: '6.0s', size: 12, isSparkle: false },
  { id: 7, left: '59%', duration: '11s', delay: '3.2s', size: 10, isSparkle: true },
  { id: 8, left: '68%', duration: '15s', delay: '1.8s', size: 15, isSparkle: false },
  { id: 9, left: '76%', duration: '19s', delay: '5.4s', size: 11, isSparkle: true },
  { id: 10, left: '84%', duration: '13.5s', delay: '2.1s', size: 14, isSparkle: false },
  { id: 11, left: '91%', duration: '16.5s', delay: '7.5s', size: 12, isSparkle: false },
  { id: 12, left: '96%', duration: '12.5s', delay: '4.0s', size: 10, isSparkle: true },
];

const FloatingPetalsAmbient: React.FC = () => (
  <div
    aria-hidden="true"
    className="pointer-events-none fixed inset-0 z-20 overflow-hidden select-none"
  >
    {FLOATING_PETALS_DATA.map((p) => (
      <div
        key={p.id}
        className="absolute -top-8 animate-float-petal"
        style={{
          left: p.left,
          animationDuration: p.duration,
          animationDelay: p.delay,
        }}
      >
        {p.isSparkle ? (
          <div
            style={{ width: p.size, height: p.size }}
            className="rounded-full bg-gradient-to-br from-[#FFFDF9] via-[#F3D77D] to-[#C5A059] shadow-[0_0_12px_rgba(212,175,55,0.75)] opacity-75"
          />
        ) : (
          <svg
            width={p.size}
            height={p.size}
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="drop-shadow-[0_2px_6px_rgba(197,160,89,0.35)]"
          >
            <path
              d="M12 2C6.5 6.5 4 12.5 7.5 18C10 21.5 14 21.5 16.5 18C20 12.5 17.5 6.5 12 2Z"
              fill={`url(#petalGrad-${p.id})`}
              style={{ stroke: 'var(--inv-primary, #D4AF37)' }}
              strokeWidth="0.8"
              strokeOpacity="0.65"
            />
            <defs>
              <linearGradient
                id={`petalGrad-${p.id}`}
                x1="6"
                y1="2"
                x2="18"
                y2="21"
                gradientUnits="userSpaceOnUse"
              >
                <stop style={{ stopColor: 'var(--inv-card-tint, #FFFDF9)' }} />
                <stop
                  offset="0.55"
                  style={{ stopColor: 'var(--inv-soft-bg, #FAF3E3)' }}
                />
                <stop
                  offset="1"
                  style={{ stopColor: 'var(--inv-leaf-fill, #E6C994)' }}
                />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>
    ))}
  </div>
);

const GoldEmvChipIcon: React.FC<{ className?: string }> = ({ className = 'w-10 h-8' }) => (
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
      fill="url(#emvGoldGrad)"
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
      <linearGradient id="emvGoldGrad" x1="0" y1="0" x2="48" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FAF0CA" />
        <stop offset="0.45" stopColor="#D4AF37" />
        <stop offset="0.8" stopColor="#C5A059" />
        <stop offset="1" stopColor="#9A742B" />
      </linearGradient>
    </defs>
  </svg>
);

const EventCrestIcon: React.FC<{
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
          {/* Celebration Crown & Star Sparkles */}
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
          {/* Academic Mortarboard & Laurel Emblem */}
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
          {/* Executive Compass & Diamond Crest */}
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
          {/* Royal 8-Point Gala Star Crest */}
          <path
            d="M14 2.5L16.6 9.8L23.8 6.2L20.2 13.4L27.5 16L20.2 18.6L23.8 25.8L16.6 22.2L14 27.5L11.4 22.2L4.2 25.8L7.8 18.6L0.5 16L7.8 13.4L4.2 6.2L11.4 9.8L14 2.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
            fill="currentColor"
            fillOpacity="0.12"
          />
          <circle cx="14" cy="15.5" r="3" stroke="currentColor" strokeWidth="1.2" />
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
          {/* Tiny Diamond Star Sparkle Above */}
          <path
            d="M14 2.8L15.1 5.6L17.9 6.7L15.1 7.8L14 10.6L12.9 7.8L10.1 6.7L12.9 5.6L14 2.8Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          {/* Interlocking Twin Wedding Rings */}
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

const NusantaraCarvingOrnament: React.FC<{
  position?: 'top' | 'bottom';
  className?: string;
}> = ({ position = 'top', className = '' }) => (
  <div
    aria-hidden="true"
    className={`pointer-events-none select-none flex items-center justify-center gap-2 ${
      position === 'bottom' ? 'rotate-180' : ''
    } ${className}`}
  >
    <span className="w-10 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#C5A059] to-[#D4AF37]" />
    <svg
      viewBox="0 0 140 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-28 sm:w-36 h-6 text-[#B68D40] shrink-0"
    >
      {/* Ukiran Sulur & Gunungan Kraton Nusantara */}
      <path
        d="M70 2L77 12L70 22L63 12L70 2Z"
        fill="currentColor"
        fillOpacity="0.22"
        stroke="currentColor"
        strokeWidth="1.3"
      />
      <path
        d="M70 6L74 12L70 18L66 12L70 6Z"
        fill="currentColor"
        fillOpacity="0.8"
      />
      <path
        d="M58 14C48 6 36 6 28 14C34 20 44 18 48 13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M82 14C92 6 104 6 112 14C106 20 96 18 92 13"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="20" cy="14" r="2.2" fill="currentColor" fillOpacity="0.75" />
      <circle cx="120" cy="14" r="2.2" fill="currentColor" fillOpacity="0.75" />
      <circle cx="10" cy="14" r="1.4" fill="currentColor" fillOpacity="0.5" />
      <circle cx="130" cy="14" r="1.4" fill="currentColor" fillOpacity="0.5" />
    </svg>
    <span className="w-10 sm:w-20 h-px bg-gradient-to-l from-transparent via-[#C5A059] to-[#D4AF37]" />
  </div>
);

const EditorialSectionHeader: React.FC<{
  badge?: string;
  title: string;
  subtitle?: string;
  archetype?: ThemeLayoutArchetype;
}> = ({ badge, title, subtitle, archetype = 'EDITORIAL_CLASSIC' }) => (
  <div className="inv-reveal inv-reveal-up max-w-2xl mx-auto py-3 text-center mb-10 sm:mb-14 relative">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-8 -inset-y-2 rounded-full bg-white/55 blur-2xl -z-10"
    />
    {archetype === 'NUSANTARA_HERITAGE' && (
      <NusantaraCarvingOrnament position="top" className="mb-3" />
    )}
    {badge && badge.trim() !== '' && (
      <p
        className={`text-[10px] sm:text-xs font-bold uppercase tracking-[0.28em] text-[#9A742B] mb-2.5 sm:mb-3.5 ${
          archetype === 'POLAROID_MAGAZINE'
            ? 'inline-block px-3 py-1 rounded-md border border-dashed border-[#D4AF37]/70 bg-white/90 shadow-2xs'
            : archetype === 'MODERN_BENTO'
            ? 'inline-block px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40'
            : ''
        }`}
      >
        {badge}
      </p>
    )}
    <h2 className="font-editorial text-2xl sm:text-4xl md:text-5xl font-bold text-stone-900 leading-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.9)]">
      {title}
    </h2>
    {subtitle && subtitle.trim() !== '' && (
      <p className="text-xs sm:text-sm text-stone-600 mt-3 sm:mt-4 max-w-xl mx-auto leading-relaxed">
        {subtitle}
      </p>
    )}
    {archetype === 'NUSANTARA_HERITAGE' ? (
      <NusantaraCarvingOrnament position="bottom" className="mt-4 sm:mt-5" />
    ) : (
      <div
        aria-hidden="true"
        className="flex items-center justify-center gap-2.5 mt-4 sm:mt-5"
      >
        <span className="w-12 sm:w-20 h-px bg-gradient-to-r from-transparent via-[#C5A059] to-[#D4AF37]" />
        <svg
          viewBox="0 0 24 12"
          fill="none"
          className="w-5 h-2.5 text-[#B68D40] shrink-0"
        >
          <path
            d="M12 1L14.5 6L12 11L9.5 6L12 1Z"
            fill="currentColor"
            fillOpacity="0.85"
          />
          <circle cx="4" cy="6" r="1.4" fill="currentColor" fillOpacity="0.6" />
          <circle cx="20" cy="6" r="1.4" fill="currentColor" fillOpacity="0.6" />
        </svg>
        <span className="w-12 sm:w-20 h-px bg-gradient-to-l from-transparent via-[#C5A059] to-[#D4AF37]" />
      </div>
    )}
  </div>
);

interface AdaptiveVideoLayerProps {
  videoUrl?: string;
  posterUrl?: string;
  focusY?: number;
  desktopMode?: 'HIGHLIGHT_COVER' | 'CINEMA_BLUR';
  className?: string;
}

const AdaptiveVideoLayer: React.FC<AdaptiveVideoLayerProps> = ({
  videoUrl,
  posterUrl,
  focusY = 28,
  desktopMode = 'HIGHLIGHT_COVER',
  className = '',
}) => {
  if (!videoUrl || videoUrl.trim() === '') return null;
  const clampedFocusY = Math.min(100, Math.max(0, focusY));

  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}
    >
      {desktopMode === 'CINEMA_BLUR' && (
        <video
          src={videoUrl}
          poster={posterUrl}
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="hidden md:block absolute inset-0 w-full h-full object-cover scale-110 blur-xl opacity-55 pointer-events-none"
          style={{ objectPosition: `50% ${clampedFocusY}%` }}
        />
      )}
      <video
        src={videoUrl}
        poster={posterUrl}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className={`relative z-10 w-full h-full pointer-events-none ${
          desktopMode === 'CINEMA_BLUR'
            ? 'object-cover md:object-contain'
            : 'object-cover'
        }`}
        style={{ objectPosition: `50% ${clampedFocusY}%` }}
      />
    </div>
  );
};

interface BackgroundSlideshowLayerProps {
  slides: BackgroundSlideItem[];
  transitionStyle?: 'CROSSFADE' | 'ZOOM_DISSOLVE' | 'SMOOTH_SLIDE';
  transitionDurationMs?: number;
  slideIntervalSeconds?: number;
  fallbackAdjust?: PhotoAdjustment;
  altLabel?: string;
}

const BackgroundSlideshowLayer: React.FC<BackgroundSlideshowLayerProps> = ({
  slides,
  transitionStyle = 'CROSSFADE',
  transitionDurationMs = 1400,
  slideIntervalSeconds = 6,
  fallbackAdjust,
  altLabel = 'Background',
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1 || slideIntervalSeconds <= 0) return;
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % slides.length);
    }, slideIntervalSeconds * 1000);
    return () => clearInterval(timer);
  }, [slides.length, slideIntervalSeconds]);

  if (!slides || slides.length === 0) {
    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-br from-[#FAF8F5] via-[#F5E6C8]/60 to-[#E8D5B5]/50"
      />
    );
  }

  if (slides.length === 1) {
    const slide = slides[0];
    const effectiveAdj = slide.adjustment || fallbackAdjust;
    const isContain = effectiveAdj?.fitMode === 'contain';
    return (
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        {isContain && (
          <img
            src={slide.imageUrl}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-65 pointer-events-none"
          />
        )}
        <img
          src={slide.imageUrl}
          alt={slide.title || altLabel}
          className={`relative z-10 w-full h-full object-center transition-all ease-out ${
            isContain ? 'object-contain' : 'object-cover animate-ken-burns'
          }`}
          style={{
            ...getPhotoAdjustStyle(effectiveAdj),
            transitionDuration: `${transitionDurationMs}ms`,
          }}
        />
      </div>
    );
  }

  const safeIndex = activeIndex % slides.length;

  if (transitionStyle === 'SMOOTH_SLIDE') {
    return (
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="flex w-full h-full transition-transform will-change-transform"
          style={{
            transform: `translate3d(-${safeIndex * 100}%, 0, 0)`,
            transitionDuration: `${transitionDurationMs}ms`,
            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
          }}
        >
          {slides.map((slide, idx) => {
            const isSlideActive = idx === safeIndex;
            const effectiveAdj = slide.adjustment || fallbackAdjust;
            const isContain = effectiveAdj?.fitMode === 'contain';
            return (
              <div
                key={slide.id || `${slide.imageUrl}-${idx}`}
                className="relative w-full h-full shrink-0 overflow-hidden"
              >
                {isContain && (
                  <img
                    src={slide.imageUrl}
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-65 pointer-events-none"
                  />
                )}
                <img
                  src={slide.imageUrl}
                  alt={slide.title || `${altLabel} ${idx + 1}`}
                  className={`relative z-10 w-full h-full object-center ${
                    isContain
                      ? 'object-contain'
                      : `object-cover ${isSlideActive ? 'animate-ken-burns' : ''}`
                  }`}
                  style={getPhotoAdjustStyle(effectiveAdj)}
                />
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden pointer-events-none">
      {slides.map((slide, idx) => {
        const isSlideActive = idx === safeIndex;
        const effectiveAdj = slide.adjustment || fallbackAdjust;
        const isContain = effectiveAdj?.fitMode === 'contain';
        return (
          <div
            key={slide.id || `${slide.imageUrl}-${idx}`}
            style={{
              transitionDuration: `${transitionDurationMs}ms`,
              transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
            }}
            className={`absolute inset-0 w-full h-full overflow-hidden transition-all will-change-[opacity,transform,filter] ${
              isSlideActive
                ? 'opacity-100 scale-100 blur-0 z-10'
                : transitionStyle === 'ZOOM_DISSOLVE'
                ? 'opacity-0 scale-105 blur-xs z-0'
                : 'opacity-0 scale-[1.02] z-0'
            }`}
          >
            {isContain && (
              <img
                src={slide.imageUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-65 pointer-events-none"
              />
            )}
            <img
              src={slide.imageUrl}
              alt={slide.title || `${altLabel} ${idx + 1}`}
              className={`relative z-10 w-full h-full object-center ${
                isContain
                  ? 'object-contain'
                  : `object-cover ${isSlideActive ? 'animate-ken-burns' : ''}`
              }`}
              style={getPhotoAdjustStyle(effectiveAdj)}
            />
          </div>
        );
      })}
    </div>
  );
};

function resolveExternalMusicEmbed(rawUrl?: string): {
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

export const PublicInvitationView: React.FC<PublicInvitationViewProps> = ({
  settings,
  guests,
  wishes,
  guestParamName,
  guestParamCode,
  isAdminLoggedIn,
  defaultOpened = false,
  externalLang,
  onOpenAdminPortal,
  onOpenLandingPage,
  onTrackAnalytics,
  onSubmitRsvp,
}) => {
  const [isOpened, setIsOpened] = useState(Boolean(defaultOpened));
  const [isOpeningTransition, setIsOpeningTransition] = useState(false);
  const [lang, setLang] = useState<'ID' | 'EN'>(
    externalLang || settings.defaultLanguage || 'ID'
  );
  const [shareCopiedToast, setShareCopiedToast] = useState(false);
  const hasTrackedPageViewRef = useRef(false);
  const invitationContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (externalLang) {
      setLang(externalLang);
    }
  }, [externalLang]);

  useEffect(() => {
    if (!externalLang && settings.defaultLanguage) {
      setLang(settings.defaultLanguage);
    }
  }, [externalLang, settings.defaultLanguage]);

  const [isPlayingMusic, setIsPlayingMusic] = useState(() =>
    weddingMusicPlayer.getStatus()
  );
  const [musicVolume, setMusicVolume] = useState(() =>
    weddingMusicPlayer.getVolume()
  );
  const [isMusicMuted, setIsMusicMuted] = useState(() =>
    weddingMusicPlayer.getMuted()
  );
  const [currentTrack, setCurrentTrack] = useState<MusicTrackItem | null>(() =>
    weddingMusicPlayer.getCurrentTrack()
  );
  const [playlist, setPlaylist] = useState<MusicTrackItem[]>(() =>
    getEffectiveMusicPlaylist(settings)
  );
  const [isMusicPopoverOpen, setIsMusicPopoverOpen] = useState(false);
  const externalEmbed = useMemo(
    () =>
      resolveExternalMusicEmbed(
        settings.musicExternalUrl || currentTrack?.url
      ),
    [settings.musicExternalUrl, currentTrack?.url]
  );
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [showGuestQrModal, setShowGuestQrModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhotoItem | null>(null);

  const showLoveStory = settings.showLoveStorySection !== false;
  const showGallery = settings.showGallerySection !== false;
  const effectiveLoveStory = useMemo(
    () => getEffectiveLoveStory(settings),
    [settings]
  );
  const effectiveGalleryPhotos = useMemo(
    () => getEffectiveGalleryPhotos(settings),
    [settings]
  );

  const [activeGalleryIdx, setActiveGalleryIdx] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isGalleryHovered, setIsGalleryHovered] = useState(false);
  const safeGalleryIdx =
    effectiveGalleryPhotos.length > 0
      ? activeGalleryIdx % effectiveGalleryPhotos.length
      : 0;

  const gallerySlideSeconds =
    typeof (settings as WeddingSettings & { gallerySlideDurationSeconds?: number })
      .gallerySlideDurationSeconds === 'number'
      ? Math.max(
          0,
          Math.min(
            30,
            Number(
              (settings as WeddingSettings & { gallerySlideDurationSeconds?: number })
                .gallerySlideDurationSeconds
            )
          )
        )
      : 6;
  const galleryTransitionMs =
    typeof (settings as WeddingSettings & { galleryTransitionDurationMs?: number })
      .galleryTransitionDurationMs === 'number'
      ? Math.max(
          300,
          Math.min(
            4000,
            Number(
              (settings as WeddingSettings & { galleryTransitionDurationMs?: number })
                .galleryTransitionDurationMs
            )
          )
        )
      : 1400;
  const galleryTransitionStyle: 'CROSSFADE' | 'ZOOM_DISSOLVE' | 'SMOOTH_SLIDE' =
    ((settings as WeddingSettings & {
      galleryTransitionStyle?: 'CROSSFADE' | 'ZOOM_DISSOLVE' | 'SMOOTH_SLIDE';
    }).galleryTransitionStyle as
      | 'CROSSFADE'
      | 'ZOOM_DISSOLVE'
      | 'SMOOTH_SLIDE') || 'CROSSFADE';

  useEffect(() => {
    if (
      !showGallery ||
      effectiveGalleryPhotos.length <= 1 ||
      selectedPhoto ||
      isGalleryHovered ||
      gallerySlideSeconds <= 0
    ) {
      return;
    }
    const timer = setInterval(() => {
      setActiveGalleryIdx((prev) => (prev + 1) % effectiveGalleryPhotos.length);
    }, gallerySlideSeconds * 1000);
    return () => clearInterval(timer);
  }, [
    showGallery,
    effectiveGalleryPhotos.length,
    selectedPhoto,
    safeGalleryIdx,
    isGalleryHovered,
    gallerySlideSeconds,
  ]);

  useEffect(() => {
    weddingMusicPlayer.syncFromSettings(settings);
    const syncPlayerState = () => {
      setIsPlayingMusic(weddingMusicPlayer.getStatus());
      setMusicVolume(weddingMusicPlayer.getVolume());
      setIsMusicMuted(weddingMusicPlayer.getMuted());
      setCurrentTrack(weddingMusicPlayer.getCurrentTrack());
      setPlaylist([...weddingMusicPlayer.getPlaylist()]);
    };
    syncPlayerState();
    return weddingMusicPlayer.subscribe(syncPlayerState);
  }, [settings]);

  useEffect(() => {
    if (!isOpened) {
      weddingMusicPlayer.stop();
      setIsPlayingMusic(false);
    }
    return () => {
      weddingMusicPlayer.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      (!isOpened && !isOpeningTransition) ||
      settings.invitationModerationMode === 'MAINTENANCE'
    ) {
      weddingMusicPlayer.stop();
      setIsPlayingMusic(false);
    }
  }, [isOpened, isOpeningTransition, settings.invitationModerationMode]);

  const videoFocusY =
    typeof settings.videoFocusY === 'number'
      ? Math.min(100, Math.max(0, settings.videoFocusY))
      : 28;
  const videoDesktopMode = settings.videoDesktopMode || 'HIGHLIGHT_COVER';

  const coverBgUrl = (settings.coverBgUrl || '').trim();
  const heroPrewedUrl = (settings.heroPrewedUrl || '').trim();
  const pageBgUrl = (settings.pageBgUrl || '').trim();

  const coverAdj = settings.photoAdjustments?.coverBgUrl;
  const heroAdj = settings.photoAdjustments?.heroPrewedUrl;
  const pageBgAdj = settings.photoAdjustments?.pageBgUrl;

  const rawCoverSlides = (
    settings as WeddingSettings & { coverSlides?: BackgroundSlideItem[] }
  ).coverSlides;
  const rawHeroSlides = (
    settings as WeddingSettings & { heroSlides?: BackgroundSlideItem[] }
  ).heroSlides;
  const rawPageSlides = (
    settings as WeddingSettings & { pageSlides?: BackgroundSlideItem[] }
  ).pageSlides;

  const coverSlidesList = useMemo<BackgroundSlideItem[]>(() => {
    if (Array.isArray(rawCoverSlides)) {
      const valid = rawCoverSlides.filter(
        (s) => s && typeof s.imageUrl === 'string' && s.imageUrl.trim() !== ''
      );
      if (valid.length > 0) return valid;
    }
    if (coverBgUrl) {
      return [{ id: 'cover_default', imageUrl: coverBgUrl, adjustment: coverAdj }];
    }
    return [];
  }, [rawCoverSlides, coverBgUrl, coverAdj]);

  const heroSlidesList = useMemo<BackgroundSlideItem[]>(() => {
    if (Array.isArray(rawHeroSlides)) {
      const valid = rawHeroSlides.filter(
        (s) => s && typeof s.imageUrl === 'string' && s.imageUrl.trim() !== ''
      );
      if (valid.length > 0) return valid;
    }
    if (heroPrewedUrl) {
      return [{ id: 'hero_default', imageUrl: heroPrewedUrl, adjustment: heroAdj }];
    }
    return [];
  }, [rawHeroSlides, heroPrewedUrl, heroAdj]);

  const pageSlidesList = useMemo<BackgroundSlideItem[]>(() => {
    if (Array.isArray(rawPageSlides)) {
      const valid = rawPageSlides.filter(
        (s) => s && typeof s.imageUrl === 'string' && s.imageUrl.trim() !== ''
      );
      if (valid.length > 0) return valid;
    }
    if (pageBgUrl) {
      return [{ id: 'page_default', imageUrl: pageBgUrl, adjustment: pageBgAdj }];
    }
    return [];
  }, [rawPageSlides, pageBgUrl, pageBgAdj]);

  const overlayOpacity = Math.min(96, Math.max(40, settings.bgOverlayOpacity ?? 88));
  const blurClass =
    settings.bgBlurIntensity === 'none'
      ? 'backdrop-blur-none'
      : settings.bgBlurIntensity === 'md'
      ? 'backdrop-blur-md'
      : settings.bgBlurIntensity === 'lg'
      ? 'backdrop-blur-xl'
      : 'backdrop-blur-[2px]';

  const eventType = settings.eventType || 'WEDDING';
  const isWeddingEvent = eventType === 'WEDDING';
  const activeThemeKey = resolveInvitationThemePreset(settings.themePreset);
  const activeVeilRgb = INVITATION_THEME_VEIL_RGB[activeThemeKey];
  const layoutArchetype = resolveThemeLayoutArchetype(settings, activeThemeKey);
  const webkitBundle = useMemo(
    () =>
      resolveThemeWebkitBundle({
        catalogThemeId:
          (settings as WeddingSettings & { catalogThemeId?: string })
            .catalogThemeId || settings.selectedCatalogThemeId,
        themePreset: settings.themePreset,
        layoutArchetype: settings.themeLayoutArchetype || layoutArchetype,
        eventType: settings.eventType,
      }),
    [settings, layoutArchetype]
  );
  const showCorneringOrnaments = settings.showFloralOrnaments !== false;
  const showFloral =
    settings.showFloralOrnaments !== false && layoutArchetype === 'BOTANICAL_AIRY';
  const showPetals = settings.showFloatingPetals !== false;
  const hasSecondProfile =
    typeof settings.showSecondProfile === 'boolean'
      ? settings.showSecondProfile
      : isWeddingEvent ||
        Boolean(
          settings.brideFullName &&
            settings.brideFullName.trim() !== '' &&
            settings.brideFullName.trim() !== '-'
        );

  const initialsMonogram = hasSecondProfile
    ? `${(settings.groomNickname || settings.groomFullName || 'A')
        .trim()
        .charAt(0)
        .toUpperCase()}&${(settings.brideNickname || settings.brideFullName || 'S')
        .trim()
        .charAt(0)
        .toUpperCase()}`
    : (settings.groomNickname || settings.groomFullName || 'E')
        .trim()
        .slice(0, 2)
        .toUpperCase();

  const eventMeta = useMemo(() => {
    switch (eventType) {
      case 'BIRTHDAY':
        return {
          coverBadge:
            lang === 'ID' ? 'Undangan Ulang Tahun' : 'Birthday Celebration',
          heroBadge:
            lang === 'ID' ? 'Perayaan Ulang Tahun' : 'Birthday Party',
          profileSectionTitle:
            lang === 'ID' ? 'Profil Yang Berulang Tahun' : 'The Celebrant',
          primaryRoleBadge:
            settings.eventHostRoleLabel ||
            (lang === 'ID' ? 'Yang Berulang Tahun' : 'Birthday Celebrant'),
          secondaryRoleBadge:
            lang === 'ID' ? 'Co-Host / Keluarga' : 'Co-Host / Family',
          scheduleTitle:
            lang === 'ID' ? 'Susunan Acara Perayaan' : 'Party Schedule',
          storyTitle:
            lang === 'ID' ? 'Milestone & Perjalanan Hidup' : 'Life Milestones',
          rsvpTitle:
            lang === 'ID'
              ? 'Konfirmasi Kehadiran & Ucapan Selamat'
              : 'RSVP & Birthday Wishes',
          wishesTitle:
            lang === 'ID' ? 'Ucapan & Doa Ulang Tahun' : 'Birthday Wishes',
        };
      case 'GRADUATION':
        return {
          coverBadge:
            lang === 'ID'
              ? 'Syukuran Wisuda & Kelulusan'
              : 'Graduation Celebration',
          heroBadge:
            lang === 'ID' ? 'Perayaan Kelulusan' : 'Graduation Ceremony',
          profileSectionTitle:
            lang === 'ID' ? 'Profil Wisudawan' : 'The Graduate',
          primaryRoleBadge:
            settings.eventHostRoleLabel ||
            (lang === 'ID' ? 'Wisudawan / Lulusan' : 'The Graduate'),
          secondaryRoleBadge:
            lang === 'ID' ? 'Keluarga / Pendamping' : 'Family / Co-Host',
          scheduleTitle:
            lang === 'ID'
              ? 'Jadwal Acara Syukuran'
              : 'Graduation Event Schedule',
          storyTitle:
            lang === 'ID'
              ? 'Perjalanan Akademik & Pencapaian'
              : 'Academic Journey',
          rsvpTitle:
            lang === 'ID'
              ? 'Konfirmasi Kehadiran & Ucapan'
              : 'RSVP & Congratulatory Wishes',
          wishesTitle:
            lang === 'ID'
              ? 'Ucapan Selamat & Sukses'
              : 'Congratulatory Wishes',
        };
      case 'MEETING':
        return {
          coverBadge:
            lang === 'ID'
              ? 'Undangan Rapat & Agenda Resmi'
              : 'Official Meeting Invitation',
          heroBadge:
            lang === 'ID'
              ? 'Agenda Resmi & Konferensi'
              : 'Official Meeting & Forum',
          profileSectionTitle:
            lang === 'ID'
              ? 'Penyelenggara & Pimpinan Acara'
              : 'Host & Keynote Speaker',
          primaryRoleBadge:
            settings.eventHostRoleLabel ||
            (lang === 'ID' ? 'Pimpinan / Penyelenggara' : 'Keynote / Host'),
          secondaryRoleBadge:
            lang === 'ID' ? 'Narasumber / Co-Host' : 'Co-Host / Speaker',
          scheduleTitle:
            lang === 'ID'
              ? 'Susunan Agenda & Waktu'
              : 'Meeting Agenda & Schedule',
          storyTitle:
            lang === 'ID'
              ? 'Latar Belakang & Pokok Bahasan'
              : 'Background & Highlights',
          rsvpTitle:
            lang === 'ID'
              ? 'Registrasi Kehadiran Peserta'
              : 'Participant Attendance Registration',
          wishesTitle:
            lang === 'ID'
              ? 'Daftar Konfirmasi & Catatan Peserta'
              : 'Attendance Notes',
        };
      case 'GALA_DINNER':
        return {
          coverBadge:
            lang === 'ID'
              ? 'Undangan Eksklusif Gala Dinner'
              : 'Exclusive Gala Dinner Invitation',
          heroBadge:
            lang === 'ID'
              ? 'Malam Apresiasi & Gala Dinner'
              : 'Gala Dinner & Soirée',
          profileSectionTitle:
            lang === 'ID' ? 'Tuan Rumah & Penyelenggara' : 'Event Hosts',
          primaryRoleBadge:
            settings.eventHostRoleLabel ||
            (lang === 'ID' ? 'Host Utama' : 'Primary Host'),
          secondaryRoleBadge:
            lang === 'ID' ? 'Co-Host Kehormatan' : 'Co-Host',
          scheduleTitle:
            lang === 'ID'
              ? 'Rundown Malam Gala Dinner'
              : 'Gala Dinner Rundown',
          storyTitle:
            lang === 'ID' ? 'Sorotan & Sejarah Acara' : 'Event Highlights',
          rsvpTitle:
            lang === 'ID'
              ? 'Reservasi Kursi (RSVP) & Konfirmasi'
              : 'Table Reservation & RSVP',
          wishesTitle:
            lang === 'ID' ? 'Buku Tamu Kehormatan' : 'VIP Guestbook',
        };
      case 'WEDDING':
      default:
        return {
          coverBadge:
            lang === 'ID' ? 'Undangan Pernikahan' : 'The Wedding Celebration',
          heroBadge:
            lang === 'ID' ? 'Pernikahan Suci' : 'Holy Matrimony & Reception',
          profileSectionTitle:
            lang === 'ID' ? 'Profil Mempelai' : 'The Happy Couple',
          primaryRoleBadge:
            settings.eventHostRoleLabel ||
            (lang === 'ID' ? 'Mempelai Pria' : 'The Groom'),
          secondaryRoleBadge:
            lang === 'ID' ? 'Mempelai Wanita' : 'The Bride',
          scheduleTitle:
            lang === 'ID' ? 'Rangkaian Acara' : 'Event Schedule',
          storyTitle:
            lang === 'ID' ? 'Kisah Perjalanan Cinta' : 'Our Love Story',
          rsvpTitle:
            lang === 'ID'
              ? 'Konfirmasi Kehadiran & Ucapan'
              : 'RSVP & Best Wishes',
          wishesTitle:
            lang === 'ID' ? 'Buku Tamu & Doa Restu' : 'Guestbook & Wishes',
        };
    }
  }, [eventType, lang, settings.eventHostRoleLabel]);

  const displayTitleShort = hasSecondProfile
    ? `${settings.groomNickname} & ${settings.brideNickname}`
    : settings.groomNickname || settings.groomFullName;
  const displayTitleFull = hasSecondProfile
    ? `${settings.groomFullName} & ${settings.brideFullName}`
    : settings.groomFullName;

  const coverBadgeLabel = resolveNaturalEventBadge(
    settings.coverBadgeText,
    eventType,
    lang
  );
  const sanitizedHeroBadge = resolveNaturalEventBadge(
    settings.heroBadgeText,
    eventType,
    lang
  );
  const coverGreetingLabel =
    lang === 'EN'
      ? settings.coverGreetingLabel &&
        !/kepada\s*yth/i.test(settings.coverGreetingLabel)
        ? settings.coverGreetingLabel.trim()
        : 'Dear Honored Guest'
      : settings.coverGreetingLabel?.trim() || 'Kepada Yth.';
  const coverApology =
    lang === 'EN'
      ? '*We apologize if there is any misspelling of your name or title'
      : settings.coverApologyNote !== undefined
      ? settings.coverApologyNote.trim()
      : '*Mohon maaf apabila terdapat kekeliruan penulisan nama atau gelar';
  const coverButtonLabel =
    lang === 'EN'
      ? settings.coverButtonLabel &&
        !/buka\s*undangan/i.test(settings.coverButtonLabel)
        ? settings.coverButtonLabel.trim()
        : 'Open Invitation'
      : settings.coverButtonLabel?.trim() || 'Buka Undangan';
  const countdownLabel =
    lang === 'EN'
      ? isWeddingEvent
        ? 'Counting Down to the Wedding'
        : 'Counting Down to the Event'
      : settings.countdownSectionLabel?.trim() ||
        (isWeddingEvent ? 'Menuju Hari Bahagia' : 'Menuju Hari Pelaksanaan');
  const profileTitle =
    lang === 'EN'
      ? eventMeta.profileSectionTitle
      : settings.profileSectionTitle?.trim() || eventMeta.profileSectionTitle;
  const scheduleTitle =
    lang === 'EN'
      ? eventMeta.scheduleTitle
      : settings.scheduleSectionTitle?.trim() || eventMeta.scheduleTitle;
  const storyTitle =
    lang === 'EN'
      ? eventMeta.storyTitle
      : settings.storySectionTitle?.trim() || eventMeta.storyTitle;
  const rsvpTitle =
    lang === 'EN'
      ? eventMeta.rsvpTitle
      : settings.rsvpSectionTitle?.trim() || eventMeta.rsvpTitle;
  const rsvpSubtitle =
    lang === 'EN'
      ? 'Your attendance confirmation and warm wishes will be saved automatically in real-time'
      : settings.rsvpSectionSubtitle?.trim() ||
        'Konfirmasi kehadiran dan ucapan Anda akan tersimpan otomatis secara real-time';
  const rsvpMessageLabel =
    lang === 'EN'
      ? isWeddingEvent
        ? 'Warm Wishes & Blessings'
        : 'Wishes & Attendance Notes'
      : settings.rsvpMessageLabel?.trim() ||
        (isWeddingEvent ? 'Ucapan & Doa Restu' : 'Ucapan / Catatan Kehadiran');
  const wishesTitle =
    lang === 'EN'
      ? eventMeta.wishesTitle
      : settings.wishesSectionTitle?.trim() || eventMeta.wishesTitle;
  const closingBadge =
    settings.closingBadgeText !== undefined
      ? settings.closingBadgeText.trim()
      : 'Thank You & Blessing';
  const closingSignature =
    lang === 'EN'
      ? 'With love & gratitude,'
      : settings.closingSignatureLabel?.trim() ||
        (isWeddingEvent ? 'Kami yang berbahagia,' : 'Hormat kami,');

  const activeClientId = settings.activeClientId || 'client-utama';

  // Lookup matched guest from DB if ?code= or ?to= matches (21-char Base62 hash token, INV-xxxx, or guest name)
  const matchedGuest = useMemo(() => {
    if (guestParamCode?.trim()) {
      const byCodeOrHash = matchGuestWithinSingleClient(
        guestParamCode,
        activeClientId,
        guests
      );
      if (byCodeOrHash) return byCodeOrHash;
    }
    if (guestParamName?.trim()) {
      const byNameOrHash = matchGuestWithinSingleClient(
        guestParamName,
        activeClientId,
        guests
      );
      if (byNameOrHash) return byNameOrHash;
    }
    const cleanCode = (guestParamCode || '').trim().toLowerCase();
    const cleanName = (guestParamName || '').trim().toLowerCase();
    if (!cleanCode && !cleanName) return null;
    const exactMatch = guests.find(
      (g) =>
        (cleanCode && g.invitationCode.trim().toLowerCase() === cleanCode) ||
        (cleanName && g.guestName.trim().toLowerCase() === cleanName)
    );
    if (exactMatch) return exactMatch;
    if (cleanName.length >= 3) {
      return (
        guests.find((g) => {
          const gName = g.guestName.trim().toLowerCase();
          return gName.includes(cleanName) || cleanName.includes(gName);
        }) || null
      );
    }
    return null;
  }, [guests, guestParamCode, guestParamName, activeClientId]);

  const [selectedGuestFromSearch, setSelectedGuestFromSearch] =
    useState<WeddingGuest | null>(null);
  const [coverGuestSearch, setCoverGuestSearch] = useState('');
  const [verifiedGuestByCode, setVerifiedGuestByCode] = useState<WeddingGuest | null>(
    null
  );

  // Reset selected/verified guest if client database changes and guest is no longer in list
  useEffect(() => {
    if (
      selectedGuestFromSearch &&
      !guests.some((g) => g.id === selectedGuestFromSearch.id)
    ) {
      setSelectedGuestFromSearch(null);
    }
    if (
      verifiedGuestByCode &&
      !guests.some((g) => g.id === verifiedGuestByCode.id)
    ) {
      setVerifiedGuestByCode(null);
    }
  }, [guests, selectedGuestFromSearch, verifiedGuestByCode]);

  const effectiveMatchedGuest =
    selectedGuestFromSearch || verifiedGuestByCode || matchedGuest;

  const resolvedGuestDisplayName =
    effectiveMatchedGuest?.guestName ||
    (guestParamName
      ? guestParamName.trim()
      : lang === 'ID'
      ? 'Bapak/Ibu/Saudara/i Tamu Kehormatan'
      : 'Honored Guest');

  const allScheduleEvents = useMemo(
    () => getEffectiveScheduleEvents(settings),
    [settings]
  );

  const mainScheduleEvent = useMemo(
    () =>
      allScheduleEvents.find((ev) => ev.isMainEvent) ||
      allScheduleEvents.find((ev) =>
        /pemberkatan|akad|utama|resepsi/i.test(`${ev.title} ${ev.badge}`)
      ) ||
      allScheduleEvents[1] ||
      allScheduleEvents[0] ||
      null,
    [allScheduleEvents]
  );

  const countdownEvents = useMemo(
    () => allScheduleEvents.filter((ev) => ev.enableCountdown),
    [allScheduleEvents]
  );

  const [selectedCountdownEventId, setSelectedCountdownEventId] = useState<string>('');

  const activeCountdownEvent = useMemo(() => {
    if (countdownEvents.length === 0) return null;
    if (selectedCountdownEventId) {
      const found = countdownEvents.find((e) => e.id === selectedCountdownEventId);
      if (found) return found;
    }
    return (
      countdownEvents.find((e) => e.isMainEvent) ||
      countdownEvents.find((e) =>
        /pemberkatan|akad|utama/i.test(e.title + ' ' + e.badge)
      ) ||
      countdownEvents[0]
    );
  }, [countdownEvents, selectedCountdownEventId]);

  // Countdown state to Active Countdown Event
  const [countdown, setCountdown] = useState({
    days: 62,
    hours: 10,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetIso =
      activeCountdownEvent?.datetime ||
      settings.weddingDatetime ||
      '2026-12-19T09:00:00+07:00';
    const updateTimer = () => {
      const target = new Date(targetIso).getTime();
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [activeCountdownEvent, settings.weddingDatetime]);

  // RSVP Form State
  const [rsvpName, setRsvpName] = useState('');
  const [rsvpInstitution, setRsvpInstitution] = useState('');
  const [rsvpPhone, setRsvpPhone] = useState('');
  const [rsvpStatus, setRsvpStatus] = useState<RsvpStatus>('Hadir');
  const [rsvpPax, setRsvpPax] = useState<number>(2);
  const [rsvpSession, setRsvpSession] =
    useState<WeddingGuest['sessionChoice']>('Pemberkatan & Resepsi');
  const [rsvpMessage, setRsvpMessage] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);
  const [rsvpSubmittedSuccess, setRsvpSubmittedSuccess] = useState(false);

  useEffect(() => {
    if (effectiveMatchedGuest) {
      setRsvpName(effectiveMatchedGuest.guestName);
      setRsvpInstitution(effectiveMatchedGuest.institution || '');
      setRsvpPhone(effectiveMatchedGuest.phone || '');
      setRsvpPax(effectiveMatchedGuest.confirmedPax || effectiveMatchedGuest.pax || 2);
      if (
        effectiveMatchedGuest.rsvpStatus &&
        effectiveMatchedGuest.rsvpStatus !== 'Belum Konfirmasi'
      ) {
        setRsvpStatus(effectiveMatchedGuest.rsvpStatus);
      }
      if (effectiveMatchedGuest.sessionChoice) {
        setRsvpSession(effectiveMatchedGuest.sessionChoice);
      }
      if (effectiveMatchedGuest.wishes && !rsvpMessage) {
        setRsvpMessage(effectiveMatchedGuest.wishes);
      }
    } else if (guestParamName) {
      setRsvpName(guestParamName.trim());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [effectiveMatchedGuest, guestParamName]);

  const visibleEvents = useMemo(() => {
    if (settings.showScheduleSection === false) return [];
    return allScheduleEvents
      .filter((ev) => ev.showOnInvitation !== false)
      .map((ev, idx) => ({
        id: ev.id,
        badge: ev.badge || `Acara ${idx + 1}`,
        title: ev.title,
        subtitle: ev.subtitle,
        date: ev.dateLabel,
        time: ev.timeLabel,
        venue: ev.venue,
        address: ev.address,
        mapsUrl: (ev.mapsUrl || '').trim(),
        dresscode: ev.dresscode,
        highlight:
          ev.isMainEvent !== undefined
            ? Boolean(ev.isMainEvent)
            : idx === 1 || /pemberkatan|akad|utama/i.test(ev.title + ' ' + ev.badge),
      }));
  }, [allScheduleEvents, settings.showScheduleSection]);

  const sessionOptions = useMemo<{ value: string; label: string }[]>(() => {
    const rawOptions: { value: string; label: string }[] = [];

    if (visibleEvents.length === 0) {
      rawOptions.push({ value: 'Semua Sesi', label: 'Semua Rangkaian Acara' });
    } else if (visibleEvents.length === 1) {
      rawOptions.push(
        { value: visibleEvents[0].title, label: visibleEvents[0].title },
        { value: 'Semua Sesi', label: 'Semua Rangkaian Acara' }
      );
    } else {
      const primaryPairTitle =
        visibleEvents.length >= 3
          ? `${visibleEvents[1].title} & ${visibleEvents[2].title}`
          : `${visibleEvents[0].title} & ${visibleEvents[1].title}`;
      rawOptions.push({ value: primaryPairTitle, label: primaryPairTitle });

      visibleEvents.forEach((ev) => {
        rawOptions.push({
          value: `${ev.title} Saja`,
          label: ev.date ? `${ev.title} Saja (${ev.date})` : `${ev.title} Saja`,
        });
      });

      if (visibleEvents.length >= 3) {
        const firstSecondPair = `${visibleEvents[0].title} & ${visibleEvents[1].title}`;
        rawOptions.push({ value: firstSecondPair, label: firstSecondPair });
      }

      rawOptions.push({ value: 'Semua Sesi', label: 'Semua Rangkaian Acara' });
    }

    const deduped: { value: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const opt of rawOptions) {
      if (!seen.has(opt.value)) {
        seen.add(opt.value);
        deduped.push(opt);
      }
    }

    if (
      effectiveMatchedGuest?.sessionChoice &&
      !seen.has(effectiveMatchedGuest.sessionChoice)
    ) {
      deduped.unshift({
        value: effectiveMatchedGuest.sessionChoice,
        label: effectiveMatchedGuest.sessionChoice,
      });
    }

    return deduped;
  }, [visibleEvents, effectiveMatchedGuest]);

  useEffect(() => {
    if (sessionOptions.length === 0) return;
    const existsInOptions = sessionOptions.some((opt) => opt.value === rsvpSession);
    if (!existsInOptions) {
      setRsvpSession(
        effectiveMatchedGuest?.sessionChoice ||
          sessionOptions[0]?.value ||
          'Semua Sesi'
      );
    }
  }, [sessionOptions, rsvpSession, effectiveMatchedGuest]);

  const emitAnalytics = (
    type: InvitationInteractionType,
    detail?: string,
    overrideGuestName?: string,
    overrideCode?: string
  ) => {
    if (!onTrackAnalytics) return;
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
    const devPlatform =
      typeof window !== 'undefined'
        ? `${navigator.platform || 'Web'} • ${window.screen?.width || 0}x${
            window.screen?.height || 0
          }`
        : undefined;
    onTrackAnalytics({
      type,
      guestName:
        overrideGuestName ||
        effectiveMatchedGuest?.guestName ||
        (guestParamName ? guestParamName.trim() : 'Tamu Umum / Katalog'),
      invitationCode:
        overrideCode ||
        effectiveMatchedGuest?.invitationCode ||
        guestParamCode ||
        undefined,
      detail,
      deviceInfo: formatForensicUserAgent(ua, devPlatform),
    });
  };

  useEffect(() => {
    if (hasTrackedPageViewRef.current) return;
    hasTrackedPageViewRef.current = true;
    emitAnalytics(
      'PAGE_VIEW',
      `Membuka halaman tautan undangan (${
        guestParamName
          ? `?to=${guestParamName}`
          : guestParamCode
          ? `?code=${guestParamCode}`
          : 'Tautan Umum'
      })`
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenInvitation = () => {
    const resolvedGuestForOpen = effectiveMatchedGuest;
    emitAnalytics(
      'OPEN_COVER',
      'Klik tombol "Buka Undangan" pada sampul pembuka',
      resolvedGuestForOpen?.guestName,
      resolvedGuestForOpen?.invitationCode
    );
    if (weddingMusicPlayer.getVolume() <= 5) {
      weddingMusicPlayer.setVolume(
        settings.musicVolume && settings.musicVolume > 5 ? settings.musicVolume : 80
      );
    }
    const initialTrackId = currentTrack?.id || playlist[0]?.id;
    if (initialTrackId) {
      weddingMusicPlayer.playTrack(initialTrackId);
    } else {
      weddingMusicPlayer.start();
    }
    setIsPlayingMusic(true);
    setIsOpeningTransition(true);
    setTimeout(() => {
      setIsOpened(true);
      setIsOpeningTransition(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 720);
  };

  const googleCalendarUrl = useMemo(() => {
    const calTarget = activeCountdownEvent || mainScheduleEvent;
    const evTitle = calTarget?.title || eventMeta.coverBadge;
    const title = `${eventMeta.coverBadge}: ${displayTitleShort} (${evTitle})`;
    const rawIso =
      calTarget?.datetime ||
      settings.weddingDatetime ||
      '2026-12-19T09:00:00+07:00';
    const parsedStart = new Date(rawIso);
    const start = Number.isNaN(parsedStart.getTime())
      ? new Date('2026-12-19T09:00:00+07:00')
      : parsedStart;
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const dates = `${fmt(start)}/${fmt(end)}`;
    const location = calTarget
      ? `${calTarget.venue}, ${calTarget.address}`
      : `${settings.event2Venue || ''}, ${settings.event2Address || ''}`;
    const details = `${eventMeta.coverBadge} ${displayTitleFull} — ${evTitle} (${
      calTarget?.dateLabel || settings.event2DateLabel
    } • ${calTarget?.timeLabel || settings.event2TimeLabel}).`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${dates}&details=${encodeURIComponent(
      details
    )}&location=${encodeURIComponent(location)}`;
  }, [
    activeCountdownEvent,
    mainScheduleEvent,
    settings,
    eventMeta.coverBadge,
    displayTitleShort,
    displayTitleFull,
  ]);

  useEffect(() => {
    if (!isOpened) return;
    const rootEl = invitationContainerRef.current ?? document;
    const elements = Array.from(rootEl.querySelectorAll('.inv-reveal'));
    if (elements.length === 0) return;

    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      elements.forEach((el) => el.classList.add('inv-revealed'));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('inv-revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -30px 0px' }
    );

    elements.forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.92 && rect.bottom > 0) {
        el.classList.add('inv-revealed');
      } else {
        observer.observe(el);
      }
    });

    return () => observer.disconnect();
  }, [
    isOpened,
    showLoveStory,
    showGallery,
    visibleEvents.length,
    settings.showCoupleSection,
    settings.showRsvpSection,
    settings.showGiftSection,
  ]);

  const handleSharePublicLink = async () => {
    const shareUrl =
      typeof window !== 'undefined'
        ? effectiveMatchedGuest
          ? `${window.location.origin}/${computeGuestInvitationHash(
              activeClientId,
              effectiveMatchedGuest
            )}`
          : window.location.href
        : '';
    const coupleNames = `${settings.groomNickname || 'Eko'} & ${
      settings.brideNickname || 'Selo'
    }`;
    emitAnalytics(
      'COPY_LINK',
      `Membagikan / menyalin tautan undangan (${coupleNames})`
    );
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Undangan Pernikahan ${coupleNames}`,
          text: `Undangan Pernikahan ${coupleNames} — ${
            mainScheduleEvent?.dateLabel ||
            activeCountdownEvent?.dateLabel ||
            settings.event2DateLabel
          }`,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard copy
      }
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard && shareUrl) {
      await navigator.clipboard.writeText(shareUrl);
      setShareCopiedToast(true);
      setTimeout(() => setShareCopiedToast(false), 2500);
    }
  };

  const renderDeveloperCreditBar = (compact = false) => {
    if (settings.showFooterCredit === false) return null;
    const rawDevUrl = settings.developerCreditUrl?.trim() || '';
    const developerUrl =
      !rawDevUrl || /github\.com\/omeko11/i.test(rawDevUrl)
        ? 'https://github.com/omeko42'
        : rawDevUrl;
    const businessEmail =
      settings.contactBusinessEmail?.trim() || 'e98.bisnis@gmail.com';
    const brandLogoUrl =
      (settings as WeddingSettings & { brandLogoUrl?: string }).brandLogoUrl ||
      MEPLANNER_BRAND_LOGOS.iconBadge;

    return (
      <div
        className={`${
          compact ? 'mt-3 pt-3' : 'mt-5 pt-4 border-t border-[#D4AF37]/25'
        } flex flex-col items-center justify-center gap-2 text-center`}
      >
        <p className="inline-flex items-center justify-center gap-1.5 text-[11px] sm:text-xs font-bold tracking-wide text-stone-700 flex-wrap">
          {onOpenLandingPage ? (
            <button
              type="button"
              onClick={onOpenLandingPage}
              title="Buka Halaman Katalog Komersial MEPlanner — My Event Planner"
              className="inline-flex items-center gap-1.5 hover:text-[#8B6914] transition-colors cursor-pointer"
            >
              <WeddingRingsIcon
                className="w-4 h-4 shrink-0"
                logoUrl={brandLogoUrl}
              />
              <span className="underline decoration-[#D4AF37]/60 underline-offset-2 font-extrabold">
                MEPlanner &bull; My Event Planner
              </span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <WeddingRingsIcon
                className="w-4 h-4 shrink-0"
                logoUrl={brandLogoUrl}
              />
              <span>MEPlanner &bull; My Event Planner</span>
            </span>
          )}
          <span>
            by{' '}
            <a
              href={developerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#8B6914] hover:text-[#B68D40] underline decoration-[#D4AF37]/60 underline-offset-2 font-extrabold"
            >
              omeko42
            </a>{' '}
            &copy; 2026
          </span>
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {onOpenLandingPage && (
            <button
              type="button"
              onClick={onOpenLandingPage}
              title="Buka Halaman Katalog Komersial MEPlanner — My Event Planner"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-[#FAF3E3] via-[#FFFDF9] to-[#F3E5C8] hover:from-[#F3E5C8] hover:to-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/60 text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all hover:scale-[1.02] cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#D4AF37] shrink-0" />
              <span>{lang === 'ID' ? 'Katalog MEPlanner' : 'MEPlanner Catalog'}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => void handleSharePublicLink()}
            title="Bagikan atau salin tautan undangan ini"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/50 text-[#8B6914] text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all hover:scale-[1.02]"
          >
            {shareCopiedToast ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span className="text-emerald-700">
                  {lang === 'ID' ? 'Link Disalin!' : 'Link Copied!'}
                </span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-[#B68D40]" />
                <span>{lang === 'ID' ? 'Bagikan Link' : 'Share Link'}</span>
              </>
            )}
          </button>

          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-widest text-stone-500">
            Contact Us:
          </span>

          {/* Kontak Email Resmi MEPlanner */}
          <a
            href={`mailto:${businessEmail}`}
            title={`Hubungi Email Resmi MEPlanner (${businessEmail})`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/50 text-[#8B6914] text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all hover:scale-[1.02]"
          >
            <Send className="w-3 h-3 text-[#B68D40] shrink-0" />
            <span>{businessEmail}</span>
          </a>

          {/* LinkedIn Official Profile Badge Link */}
          <a
            href="https://www.linkedin.com/in/omeko42"
            target="_blank"
            rel="noopener noreferrer"
            title="Profil LinkedIn Resmi Eko Agung Krisdianto (omeko42)"
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all hover:scale-[1.02]"
          >
            {/* LinkedIn Official SVG Icon */}
            <svg
              className="w-3.5 h-3.5 fill-current shrink-0"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
            <span>Eko Agung Krisdianto</span>
          </a>
        </div>
      </div>
    );
  };

  const handleToggleMusic = () => {
    const nextState = weddingMusicPlayer.toggle();
    setIsPlayingMusic(nextState);
  };

  const handleCopyAccount = (id: string, numberStr: string) => {
    navigator.clipboard.writeText(numberStr);
    setCopiedAccountId(id);
    emitAnalytics('CLICK_GIFT_COPY', `Menyalin nomor rekening amplop digital (${numberStr})`);
    setTimeout(() => setCopiedAccountId(null), 2500);
  };

  const handleRsvpFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (settings.disableRsvpSubmission) return;
    if (!rsvpName.trim()) return;
    setIsSubmittingRsvp(true);
    try {
      const ua =
        typeof navigator !== 'undefined' ? navigator.userAgent : undefined;
      const devPlatform =
        typeof window !== 'undefined'
          ? `${navigator.platform || 'Web'} • ${window.screen?.width || 0}x${
              window.screen?.height || 0
            } • ${Intl.DateTimeFormat().resolvedOptions().timeZone || 'WIB'}`
          : undefined;

      emitAnalytics(
        'SUBMIT_RSVP',
        `Mengirim konfirmasi RSVP (${rsvpStatus}) & doa restu`,
        rsvpName.trim(),
        effectiveMatchedGuest?.invitationCode || guestParamCode || undefined
      );

      await onSubmitRsvp({
        guestName: rsvpName.trim(),
        invitationCode:
          effectiveMatchedGuest?.invitationCode || guestParamCode || undefined,
        institution: rsvpInstitution.trim(),
        relation: effectiveMatchedGuest?.guestType || 'Tamu Undangan',
        phone: rsvpPhone.trim(),
        rsvpStatus,
        pax: rsvpStatus === 'Hadir' ? Number(rsvpPax) || 1 : 0,
        sessionChoice: rsvpSession,
        message: rsvpMessage.trim(),
        originalUrlGuestParam: guestParamName || undefined,
        originalUrlCodeParam: guestParamCode || undefined,
        matchedGuestRecordName:
          effectiveMatchedGuest?.guestName ||
          matchedGuest?.guestName ||
          undefined,
        userAgent: ua,
        devicePlatform: devPlatform,
      });
      setRsvpSubmittedSuccess(true);
      setRsvpMessage('');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const publicVisibleWishes = useMemo(() => {
    const autoHide = settings.autoHideFlaggedWishes !== false;
    return wishes.filter((w) => {
      if (w.moderationStatus === 'HIDDEN') return false;
      if (w.moderationStatus === 'APPROVED') return true;
      if (autoHide) {
        if (w.moderationStatus === 'FLAGGED') return false;
        const analysis = analyzeWishModeration(
          w,
          settings.moderationBlockedKeywords
        );
        if (analysis.isNegative) return false;
      }
      return true;
    });
  }, [
    wishes,
    settings.autoHideFlaggedWishes,
    settings.moderationBlockedKeywords,
  ]);

  const filteredPublicWishes = useMemo(() => {
    const q = coverGuestSearch.trim().toLowerCase();
    if (!q) return publicVisibleWishes;
    return publicVisibleWishes.filter(
      (w) =>
        w.guestName.toLowerCase().includes(q) ||
        (w.institution || '').toLowerCase().includes(q) ||
        w.message.toLowerCase().includes(q)
    );
  }, [publicVisibleWishes, coverGuestSearch]);

  const coverFeatureImageUrl =
    coverSlidesList[0]?.imageUrl ||
    heroSlidesList[0]?.imageUrl ||
    coverBgUrl ||
    heroPrewedUrl ||
    settings.groomPhotoUrl;
  const heroFeatureImageUrl =
    heroSlidesList[0]?.imageUrl ||
    heroPrewedUrl ||
    coverSlidesList[0]?.imageUrl ||
    coverBgUrl ||
    settings.groomPhotoUrl;
  const [giftCategoryFilter, setGiftCategoryFilter] = useState<
    'ALL' | 'BANK' | 'QRIS' | 'GLOBAL_CRYPTO' | 'WISHLIST'
  >('ALL');

  // ============================================================================
  // 0. SUPERADMIN MODERATION: MAINTENANCE / PAUSED VIEW MODE
  // ============================================================================
  if (settings.invitationModerationMode === 'MAINTENANCE') {
    return (
      <div
        data-inv-theme={activeThemeKey}
        data-inv-archetype={layoutArchetype}
        className="min-h-[100dvh] relative flex flex-col justify-between pt-16 sm:pt-20 overflow-x-clip overflow-y-auto bg-[#FFFDF9] text-stone-800 select-none"
      >
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {settings.coverVideoUrl?.trim() ? (
            <AdaptiveVideoLayer
              videoUrl={settings.coverVideoUrl}
              posterUrl={coverSlidesList[0]?.imageUrl || coverBgUrl}
              focusY={videoFocusY}
              desktopMode={videoDesktopMode}
            />
          ) : (
            <BackgroundSlideshowLayer
              slides={coverSlidesList}
              transitionStyle={galleryTransitionStyle}
              transitionDurationMs={galleryTransitionMs}
              slideIntervalSeconds={gallerySlideSeconds}
              fallbackAdjust={coverAdj}
              altLabel="Background"
            />
          )}
        </div>
        <div
          className={`fixed inset-0 pointer-events-none bg-white/35 backdrop-blur-[2px] ${blurClass}`}
          style={{
            backgroundColor: `rgba(${activeVeilRgb}, ${(overlayOpacity / 100).toFixed(2)})`,
          }}
        />
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#FFFDF9]/85 via-white/45 to-[#FFFDF9]/92" />
        <header className="fixed top-0 inset-x-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#D4AF37]/25 shadow-2xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-3.5 sm:px-8 py-2.5 sm:py-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#D4AF37]/40 shadow-2xs min-w-0">
              <Shield className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-[#8B6914] truncate">
                Moderasi Undangan Aktif
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                weddingMusicPlayer.stop();
                setIsPlayingMusic(false);
                onOpenAdminPortal();
              }}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white border border-stone-300 text-[11px] font-bold text-stone-700 hover:text-[#8B6914] shadow-2xs shrink-0"
            >
              <Lock className="w-3 h-3 text-[#B68D40]" />
              <span>{isAdminLoggedIn ? 'Kembali ke Dashboard' : 'Portal Admin'}</span>
            </button>
          </div>
        </header>

        <div className="relative z-10 max-w-xl mx-auto px-4 py-6 text-center my-auto w-full">
          <div className="w-full rounded-3xl bg-white/90 backdrop-blur-2xl border border-white/95 shadow-[0_25px_70px_rgba(160,130,85,0.18)] p-6 sm:p-10 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF3E3] border-2 border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B]">
              <EventCrestIcon eventType={eventType} className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5" /> Mode Penyesuaian / Segera Hadir
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
              {displayTitleShort}
            </h1>
            <p className="text-xs sm:text-sm text-stone-700 leading-relaxed max-w-md mx-auto">
              {settings.invitationMaintenanceMessage ||
                'Mohon maaf, halaman undangan digital sedang dalam penyesuaian data oleh mempelai & tim pengelola. Silakan kunjungi kembali beberapa saat lagi.'}
            </p>
            {renderDeveloperCreditBar(false)}
          </div>
        </div>
        <div className="h-4" />
      </div>
    );
  }

  // ============================================================================
  // 1. COVER PEMBUKA (LIGHT AIRY EDITORIAL VEIL & ARCHETYPE-ADAPTIVE COVER GATE)
  // ============================================================================
  if (!isOpened) {
    const coverPrimaryDate =
      mainScheduleEvent?.dateLabel ||
      activeCountdownEvent?.dateLabel ||
      settings.event2DateLabel;
    const coverPrimaryVenue =
      mainScheduleEvent?.venue ||
      activeCountdownEvent?.venue ||
      settings.event2Venue ||
      (settings.groomOrigin && settings.groomOrigin.trim() !== '-'
        ? settings.groomOrigin
        : '');

    return (
      <div
        data-inv-theme={activeThemeKey}
        data-inv-archetype={layoutArchetype}
        className={`min-h-[100dvh] relative flex flex-col justify-between pt-16 sm:pt-20 overflow-x-clip overflow-y-auto bg-[#FFFDF9] text-stone-900 select-none transition-all duration-700 ease-in-out ${
          isOpeningTransition
            ? '-translate-y-full opacity-0 scale-105 pointer-events-none'
            : 'translate-y-0 opacity-100 scale-100'
        }`}
      >
        {showPetals && <FloatingPetalsAmbient />}

        {/* Cover Gate Background Layer + Light Airy Editorial Veil */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          {settings.coverVideoUrl?.trim() ? (
            <AdaptiveVideoLayer
              videoUrl={settings.coverVideoUrl}
              posterUrl={coverSlidesList[0]?.imageUrl || coverBgUrl}
              focusY={videoFocusY}
              desktopMode={videoDesktopMode}
            />
          ) : (
            <BackgroundSlideshowLayer
              slides={coverSlidesList}
              transitionStyle={galleryTransitionStyle}
              transitionDurationMs={galleryTransitionMs}
              slideIntervalSeconds={gallerySlideSeconds}
              fallbackAdjust={coverAdj}
              altLabel="Cover Background"
            />
          )}
        </div>
        <div
          className={`fixed inset-0 pointer-events-none bg-white/35 backdrop-blur-[2px] ${blurClass}`}
          style={{
            backgroundColor: `rgba(${activeVeilRgb}, ${(overlayOpacity / 100).toFixed(2)})`,
          }}
        />
        <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-[#FFFDF9]/85 via-white/45 to-[#FFFDF9]/92" />

        {/* Subtle Top Bar */}
        <header className="fixed top-0 inset-x-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#D4AF37]/25 shadow-2xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-3.5 sm:px-8 py-2.5 sm:py-3">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/35 shadow-2xs min-w-0">
              <EventCrestIcon
                eventType={eventType}
                className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B68D40] shrink-0"
              />
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider sm:tracking-[0.2em] uppercase text-[#8B6914] truncate">
                {coverBadgeLabel}
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/90 hover:bg-[#FAF3E3] backdrop-blur-md border border-[#D4AF37]/45 text-[10px] sm:text-[11px] font-bold text-[#8B6914] transition-all shadow-2xs"
                title="Switch Language (Bahasa Indonesia / English)"
              >
                <Globe className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                <span>{lang}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  weddingMusicPlayer.stop();
                  setIsPlayingMusic(false);
                  onOpenAdminPortal();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-white backdrop-blur-md border border-stone-300/70 text-[10px] sm:text-[11px] font-bold text-stone-700 hover:text-[#8B6914] transition-all shadow-2xs shrink-0"
                title={
                  isAdminLoggedIn
                    ? 'Buka Workspace Planner (My Event Planner)'
                    : 'Masuk ke Portal Planner (My Event Planner)'
                }
              >
                <Lock className="w-3.5 h-3.5 text-[#B68D40]" />
                <span className="hidden sm:inline">Planner</span>
              </button>
            </div>
          </div>
        </header>

        {/* Center Cover Invitation Gate Card — Distinct per Layout Archetype */}
        <div className="relative z-10 max-w-xl mx-auto px-3.5 sm:px-5 py-4 sm:py-6 text-center flex flex-col items-center my-auto w-full">
          <div
            className={`w-full backdrop-blur-2xl p-5 sm:p-10 relative overflow-hidden ${
              layoutArchetype === 'POLAROID_MAGAZINE'
                ? 'rounded-3xl bg-[#FFFDF9]/95 border border-stone-200/90 shadow-[0_25px_70px_rgba(160,130,85,0.18)]'
                : layoutArchetype === 'BOTANICAL_AIRY'
                ? 'rounded-t-[10rem] sm:rounded-t-[13rem] rounded-b-[2.5rem] bg-white/90 border-4 border-white shadow-[0_25px_70px_rgba(94,140,106,0.16)] pt-10 sm:pt-14'
                : layoutArchetype === 'NUSANTARA_HERITAGE'
                ? 'rounded-3xl bg-[radial-gradient(ellipse_at_top,_#f0d8b8,_#fdf8f0_70%)] border-y-4 border-double border-[#C89D54] border-x-2 border-x-[#C89D54]/80 shadow-[0_25px_70px_rgba(139,90,43,0.20)]'
                : layoutArchetype === 'MODERN_BENTO'
                ? 'rounded-3xl bg-white/92 border border-stone-200/90 shadow-[0_25px_70px_rgba(40,75,122,0.14)] p-5 sm:p-8'
                : 'rounded-3xl sm:rounded-[2.25rem] bg-white/85 border border-white/95 shadow-[0_25px_70px_rgba(160,130,85,0.18)]'
            }`}
          >
            <WebkitThreeLayerCornering
              bundle={webkitBundle}
              enabled={showCorneringOrnaments}
            />
            <FloralCornerOrnament position="top-left" enabled={showFloral} />
            <FloralCornerOrnament position="top-right" enabled={showFloral} />
            <FloralCornerOrnament position="bottom-left" enabled={showFloral} />
            <FloralCornerOrnament position="bottom-right" enabled={showFloral} />
            <NusantaraGoldCornerBracket
              position="top-left"
              enabled={layoutArchetype === 'NUSANTARA_HERITAGE'}
            />
            <NusantaraGoldCornerBracket
              position="top-right"
              enabled={layoutArchetype === 'NUSANTARA_HERITAGE'}
            />
            <NusantaraGoldCornerBracket
              position="bottom-left"
              enabled={layoutArchetype === 'NUSANTARA_HERITAGE'}
            />
            <NusantaraGoldCornerBracket
              position="bottom-right"
              enabled={layoutArchetype === 'NUSANTARA_HERITAGE'}
            />

            <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />

            {layoutArchetype === 'POLAROID_MAGAZINE' ? (
              /* ARCHETYPE 1: EDITORIAL MAGAZINE COVER WITH POLAROID FRAME & STAMP BADGE */
              <div className="relative z-10">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200/90">
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.24em] text-[#8B6914]">
                    <EventCrestIcon eventType={eventType} className="w-4 h-4 text-[#B68D40]" />
                    <span>{coverBadgeLabel}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg border-2 border-dashed border-[#D4AF37]/80 bg-[#FAF3E3] text-[#8B6914] text-[10px] sm:text-xs font-extrabold uppercase tracking-widest rotate-2 shadow-2xs">
                    <Calendar className="w-3 h-3 text-[#B68D40]" />
                    <span>{coverPrimaryDate}</span>
                  </span>
                </div>

                {/* Editorial Magazine Title Masthead */}
                <h1 className="font-editorial text-3xl sm:text-5xl font-bold tracking-tight text-stone-900 uppercase leading-tight mb-4 break-words">
                  {displayTitleShort}
                </h1>

                {/* Thick White Polaroid Photo Frame in Center of Cover */}
                {coverFeatureImageUrl && (
                  <div className="p-3 sm:p-4 pb-6 sm:pb-7 bg-white rounded-2xl shadow-xl border border-stone-200/90 max-w-[270px] sm:max-w-[310px] mx-auto mb-5 -rotate-1 hover:rotate-0 transition-transform duration-500">
                    <div className="relative aspect-[4/3] w-full rounded-xl overflow-hidden bg-[#FAF8F5]">
                      <img
                        src={coverFeatureImageUrl}
                        alt={displayTitleShort}
                        className="w-full h-full object-cover object-center"
                        style={getPhotoAdjustStyle(coverAdj || heroAdj)}
                      />
                    </div>
                    <p className="font-script text-xl sm:text-2xl text-[#8B6914] mt-3 -rotate-1 leading-none">
                      {displayTitleShort}
                    </p>
                    {coverPrimaryVenue && (
                      <p className="text-[10px] sm:text-[11px] uppercase tracking-widest text-stone-700 font-bold mt-1.5 truncate">
                        {coverPrimaryVenue}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* ARCHETYPES 2–5 HEADER & TITLE */
              <div className="relative z-10">
                {layoutArchetype === 'NUSANTARA_HERITAGE' && (
                  <NusantaraCarvingOrnament position="top" className="mb-4" />
                )}

                {layoutArchetype === 'BOTANICAL_AIRY' && coverFeatureImageUrl ? (
                  <div className="w-28 h-36 sm:w-36 sm:h-44 mx-auto rounded-t-[6rem] rounded-b-2xl border-4 border-white ring-2 ring-[#D4AF37]/40 shadow-lg overflow-hidden mb-5 bg-[#FAF8F5]">
                    <img
                      src={coverFeatureImageUrl}
                      alt={displayTitleShort}
                      className="w-full h-full object-cover object-center"
                      style={getPhotoAdjustStyle(coverAdj || heroAdj)}
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-full bg-gradient-to-br from-white/95 via-[#FAF6EE] to-[#F3E7D3] border-2 border-[#D4AF37]/45 flex items-center justify-center shadow-[0_10px_30px_rgba(197,160,89,0.22)] mb-5 sm:mb-6">
                    <EventCrestIcon
                      eventType={eventType}
                      className="w-8 h-8 sm:w-10 sm:h-10 text-[#B68D40]"
                    />
                  </div>
                )}

                <div className="mb-3.5 sm:mb-4">
                  <span className="inline-flex items-center px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[10px] sm:text-xs uppercase tracking-[0.22em] text-[#8B6914] font-bold">
                    {coverBadgeLabel}
                  </span>
                </div>

                <h1
                  className={`${
                    layoutArchetype === 'MODERN_BENTO'
                      ? 'font-editorial text-3xl sm:text-5xl font-bold tracking-tight'
                      : 'font-script text-4xl sm:text-6xl font-normal tracking-normal'
                  } text-stone-900 leading-normal mb-3 sm:mb-4 break-words py-2`}
                >
                  {displayTitleShort}
                </h1>

                {layoutArchetype === 'NUSANTARA_HERITAGE' && (
                  <NusantaraCarvingOrnament position="bottom" className="mb-4" />
                )}

                {layoutArchetype === 'MODERN_BENTO' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left mb-5">
                    <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-3 flex items-center gap-2.5 shadow-2xs">
                      <Calendar className="w-4 h-4 text-[#B68D40] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A742B]">
                          {lang === 'ID' ? 'Tanggal Acara' : 'Event Date'}
                        </p>
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {coverPrimaryDate}
                        </p>
                      </div>
                    </div>
                    <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-3 flex items-center gap-2.5 shadow-2xs">
                      <MapPin className="w-4 h-4 text-[#B68D40] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#9A742B]">
                          {lang === 'ID' ? 'Lokasi Utama' : 'Primary Venue'}
                        </p>
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {coverPrimaryVenue || (lang === 'ID' ? 'Lokasi Acara' : 'Venue')}
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-stone-700 font-medium tracking-wide mb-6 sm:mb-8">
                    {coverPrimaryDate}
                    {coverPrimaryVenue ? ` • ${coverPrimaryVenue}` : ''}
                  </p>
                )}
              </div>
            )}

            {/* Personalized Guest Card (Bright Crystal White Card) */}
            <div className="w-full rounded-2xl bg-white/90 backdrop-blur-xl border border-[#D4AF37]/40 p-5 sm:p-7 shadow-xl mb-6 sm:mb-8 relative z-10">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-stone-700 font-semibold mb-2.5 sm:mb-3">
                {coverGreetingLabel}
              </p>

              <h2 className="font-serif text-base sm:text-2xl font-bold text-stone-900 break-words leading-snug">
                {effectiveMatchedGuest?.guestName || resolvedGuestDisplayName}
              </h2>

              <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mt-2.5 sm:mt-3 break-words">
                {(() => {
                  const rawInst = (
                    effectiveMatchedGuest?.institution ||
                    matchedGuest?.institution ||
                    ''
                  ).trim();
                  return rawInst && rawInst !== '-'
                    ? rawInst
                    : lang === 'ID'
                      ? 'di Tempat'
                      : 'In Place';
                })()}
              </p>

              {coverApology && coverApology !== '-' && (
                <p className="text-[10px] sm:text-[11px] text-stone-600 mt-3.5 sm:mt-4 italic">
                  {coverApology}
                </p>
              )}
            </div>

            {/* Theme Wax Seal / Stamp / Medal / Crown Badge + Open Invitation Button */}
            <div className="relative z-10 flex flex-col items-center justify-center gap-3">
              {webkitBundle.badgeOrnamentSvg && (
                <img
                  src={webkitBundle.badgeOrnamentSvg}
                  alt=""
                  aria-hidden="true"
                  className="w-12 h-12 sm:w-14 sm:h-14 object-contain drop-shadow-[0_6px_16px_rgba(197,160,89,0.38)] pointer-events-none select-none"
                />
              )}
              <button
                type="button"
                onClick={handleOpenInvitation}
                className="w-full sm:w-auto group relative z-10 inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] text-white font-bold text-sm sm:text-base shadow-[0_12px_30px_rgba(197,160,89,0.38)] hover:shadow-[0_15px_35px_rgba(197,160,89,0.55)] hover:scale-[1.02] active:scale-[0.99] transition-all cursor-pointer"
              >
                <img
                  src={MEPLANNER_ICONS.btnBukaUndangan}
                  alt=""
                  className="w-5 h-5 shrink-0 transition-transform group-hover:rotate-6"
                />
                <span>{coverButtonLabel}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note + Developer Credit */}
        <div className="relative z-10 text-center pb-4 sm:pb-5 px-4">
          <p className="text-[11px] text-stone-700 font-medium">
            {settings.subtitle}
          </p>
          {renderDeveloperCreditBar(true)}
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. MAIN OPENED INVITATION VIEW (SYMMETRICAL CARDS & CUSTOMIZABLE BG)
  // ============================================================================
  return (
    <div
      ref={invitationContainerRef}
      data-inv-theme={activeThemeKey}
      data-inv-archetype={layoutArchetype}
      className="min-h-screen relative bg-[#FFFDF9] text-stone-800 pt-14 sm:pt-16 pb-28 sm:pb-24 overflow-x-clip selection:bg-[#D4AF37]/25 selection:text-stone-900"
    >
      {showPetals && <FloatingPetalsAmbient />}

      {/* FIXED CUSTOM WALLPAPER / PAGE BACKGROUND LAYER WITH ADJUSTABLE PEARL VEIL */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {settings.pageVideoUrl?.trim() ? (
          <AdaptiveVideoLayer
            videoUrl={settings.pageVideoUrl}
            posterUrl={pageSlidesList[0]?.imageUrl || pageBgUrl}
            focusY={videoFocusY}
            desktopMode={videoDesktopMode}
          />
        ) : (
          <BackgroundSlideshowLayer
            slides={pageSlidesList}
            transitionStyle={galleryTransitionStyle}
            transitionDurationMs={galleryTransitionMs}
            slideIntervalSeconds={gallerySlideSeconds}
            fallbackAdjust={pageBgAdj}
            altLabel="Page Wallpaper"
          />
        )}
        <div
          className={`absolute inset-0 z-20 ${blurClass}`}
          style={{
            backgroundColor: `rgba(${activeVeilRgb}, ${(overlayOpacity / 100).toFixed(2)})`,
          }}
        />
      </div>

      {/* TOP FLOATING GLASS NAVIGATION — ARCHETYPE-ADAPTIVE */}
      <header
        className={`fixed top-0 inset-x-0 z-40 backdrop-blur-xl transition-all ${
          layoutArchetype === 'NUSANTARA_HERITAGE'
            ? 'bg-[#fdf8f0]/95 border-b-2 border-double border-[#C89D54] shadow-[0_4px_25px_rgba(139,90,43,0.12)]'
            : layoutArchetype === 'POLAROID_MAGAZINE'
            ? 'bg-[#F7F3EE]/95 border-b border-stone-300/90 shadow-2xs'
            : layoutArchetype === 'BOTANICAL_AIRY'
            ? 'bg-[#F6FAF7]/90 border-b border-emerald-200/70 shadow-2xs'
            : layoutArchetype === 'MODERN_BENTO'
            ? 'bg-white/95 border-b border-stone-200/95 shadow-2xs'
            : 'bg-white/85 border-b border-[#D4AF37]/25 shadow-[0_4px_25px_rgba(180,150,100,0.08)]'
        }`}
      >
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center shrink-0 shadow-2xs ${
                layoutArchetype === 'NUSANTARA_HERITAGE'
                  ? 'rounded-lg bg-[#f5e9d6] border-2 border-[#C89D54] text-[#6b4226]'
                  : layoutArchetype === 'POLAROID_MAGAZINE'
                  ? 'rounded-lg bg-white border border-stone-300 text-stone-900 -rotate-3'
                  : layoutArchetype === 'MODERN_BENTO'
                  ? 'rounded-xl bg-stone-900 text-white'
                  : 'rounded-full bg-gradient-to-br from-[#FAF3E3] to-[#EFE1C6] border border-[#D4AF37]/50 text-[#8B6914]'
              }`}
            >
              <span className="font-editorial font-bold text-xs sm:text-sm tracking-tighter">
                {initialsMonogram}
              </span>
            </div>
            <div className="truncate">
              <p
                className={`font-editorial text-xs sm:text-base font-bold truncate ${
                  layoutArchetype === 'NUSANTARA_HERITAGE'
                    ? 'text-[#6b4226]'
                    : 'text-stone-900'
                }`}
              >
                {displayTitleShort}
              </p>
              <p className="text-[10px] text-[#9A742B] font-medium truncate">
                {sanitizedHeroBadge} &bull;{' '}
                {mainScheduleEvent?.dateLabel ||
                  activeCountdownEvent?.dateLabel ||
                  settings.event2DateLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
            {/* Button 1: Individual Play/Pause Pill with Official Spinning Vinyl Widget & Float Music Icons */}
            <button
              type="button"
              onClick={handleToggleMusic}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#D4AF37]/45 bg-white/90 shadow-2xs text-xs font-bold transition-all cursor-pointer ${
                isPlayingMusic
                  ? 'bg-[#FAF3E3] text-[#8B6914]'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
              title={isPlayingMusic ? 'Jeda Musik (Pause)' : 'Putar Musik (Play)'}
            >
              <img
                src={MEPLANNER_WEBKIT_COMPONENTS.widgetVinylMusicDisc}
                alt=""
                className={`w-5 h-5 object-contain shrink-0 ${
                  isPlayingMusic && !isMusicMuted ? 'animate-spin-vinyl' : ''
                }`}
              />
              <img
                src={
                  isPlayingMusic && !isMusicMuted
                    ? MEPLANNER_ICONS.floatMusicPlay
                    : MEPLANNER_ICONS.floatMusicMute
                }
                alt=""
                className="w-4 h-4 object-contain shrink-0"
              />
              <span className="hidden sm:inline max-w-[120px] truncate">
                {currentTrack?.title || settings.musicTitle || 'Musik'}
              </span>
              {isPlayingMusic && !isMusicMuted && (
                <span
                  aria-hidden="true"
                  className="inline-flex items-end gap-0.5 h-3 ml-0.5 shrink-0"
                >
                  <span className="w-0.5 h-3 rounded-full bg-[#B68D40] animate-eq-1" />
                  <span className="w-0.5 h-3 rounded-full bg-[#D4AF37] animate-eq-2" />
                  <span className="w-0.5 h-3 rounded-full bg-[#9A742B] animate-eq-3" />
                </span>
              )}
            </button>

            {/* Button 2: Individual Playlist & Volume Pill */}
            <button
              type="button"
              onClick={() => setIsMusicPopoverOpen((v) => !v)}
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full border border-[#D4AF37]/45 text-xs font-bold shadow-2xs transition-all cursor-pointer ${
                isMusicPopoverOpen
                  ? 'bg-[#B68D40] text-white'
                  : 'bg-white/90 hover:bg-[#FAF3E3] text-[#8B6914]'
              }`}
              title="Buka Playlist & Pengaturan Volume"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold">{playlist.length}</span>
            </button>

            {/* Button 3: Guest QR Check-in Pass Pill */}
            <button
              type="button"
              onClick={() => setShowGuestQrModal(true)}
              className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full bg-white/90 hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-xs font-bold shadow-2xs transition-all cursor-pointer"
              title={
                lang === 'ID'
                  ? 'Tiket & QR Check-in Buku Tamu'
                  : 'Guest QR Check-in Ticket'
              }
            >
              <img
                src={MEPLANNER_ICONS.floatQrCheckin}
                alt=""
                className="w-4 h-4 object-contain shrink-0"
              />
              <span className="hidden md:inline text-[11px]">QR Pass</span>
            </button>

            {/* Popover: Playlist, Play/Pause, Next/Prev & Volume Control */}
            {isMusicPopoverOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-2xl bg-white border-2 border-[#D4AF37] shadow-[0_20px_50px_rgba(0,0,0,0.28)] p-3.5 z-50 text-left"
                style={{ backgroundColor: '#FFFFFF' }}
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-stone-200 bg-white">
                  <div className="min-w-0">
                    <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#9A742B]">
                      Pemutar Musik &amp; Playlist
                    </p>
                    <p className="text-xs font-bold text-stone-900 truncate">
                      {currentTrack?.title || settings.musicTitle || 'Belum ada lagu'}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {currentTrack?.artist || settings.musicArtist || 'Instrumental'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMusicPopoverOpen(false)}
                    className="p-1.5 rounded-lg bg-stone-100 text-stone-500 hover:text-stone-800 hover:bg-stone-200 shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Official Spotify / YouTube External Embed Player (when configured) */}
                {externalEmbed.embedUrl && (
                  <div className="mt-2.5">
                    <div className="flex items-center justify-between gap-1.5 mb-1.5 px-0.5">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#8B6914]">
                        Koneksi Resmi {externalEmbed.provider}
                      </span>
                      {settings.musicExternalUrl && (
                        <a
                          href={settings.musicExternalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-[#B68D40] hover:underline"
                        >
                          <span>Buka App</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      )}
                    </div>
                    <iframe
                      src={externalEmbed.embedUrl}
                      title={`Official ${externalEmbed.provider} Embed Player`}
                      width="100%"
                      height={externalEmbed.provider === 'SPOTIFY' ? 152 : 160}
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-xl border border-[#D4AF37]/40 mb-2.5"
                    />
                  </div>
                )}

                {/* Transport Controls: Prev / Play-Pause / Next */}
                <div className="flex items-center justify-center gap-3 py-2.5 bg-white">
                  <button
                    type="button"
                    onClick={() => weddingMusicPlayer.prevTrack()}
                    disabled={playlist.length <= 1}
                    className="p-2 rounded-full border border-stone-200 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-700 disabled:opacity-40 transition-all"
                    title="Lagu Sebelumnya"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={handleToggleMusic}
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all"
                  >
                    {isPlayingMusic ? (
                      <>
                        <Pause className="w-3.5 h-3.5" /> Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" /> Play
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => weddingMusicPlayer.nextTrack()}
                    disabled={playlist.length <= 1}
                    className="p-2 rounded-full border border-stone-200 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-stone-700 disabled:opacity-40 transition-all"
                    title="Lagu Berikutnya"
                  >
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Volume Control */}
                <div className="bg-[#FAF8F5] rounded-xl p-2.5 border border-stone-200 mb-2.5">
                  <div className="flex items-center justify-between text-[11px] font-bold text-stone-700 mb-1">
                    <button
                      type="button"
                      onClick={() => weddingMusicPlayer.toggleMute()}
                      className="inline-flex items-center gap-1 text-[#8B6914] hover:underline"
                    >
                      {isMusicMuted || musicVolume === 0 ? (
                        <VolumeX className="w-3.5 h-3.5 text-rose-600" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-[#B68D40]" />
                      )}
                      <span>{isMusicMuted ? 'Muted' : 'Volume'}</span>
                    </button>
                    <span className="text-[11px] font-extrabold text-[#8B6914]">
                      {isMusicMuted ? '0%' : `${musicVolume}%`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={1}
                    value={isMusicMuted ? 0 : musicVolume}
                    onChange={(e) =>
                      weddingMusicPlayer.setVolume(parseInt(e.target.value, 10))
                    }
                    className="w-full accent-[#B68D40] cursor-pointer"
                  />
                </div>

                {/* Track List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 bg-white">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-stone-500 px-1">
                    Daftar Lagu ({playlist.length})
                  </p>
                  {playlist.map((track, idx) => {
                    const isCurrent = currentTrack?.id === track.id;
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => weddingMusicPlayer.playTrack(track.id)}
                        className={`w-full px-2.5 py-2 rounded-xl text-left flex items-center justify-between gap-2 transition-all border ${
                          isCurrent
                            ? 'bg-[#FAF3E3] border-[#D4AF37] text-[#8B6914] font-bold shadow-2xs'
                            : 'bg-[#FAF8F5] border-stone-200/80 hover:bg-[#FAF3E3]/60 text-stone-800'
                        }`}
                      >
                        <div className="min-w-0 flex items-center gap-2">
                          <span className="text-[10px] font-mono text-stone-500 w-4 shrink-0">
                            {idx + 1}.
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{track.title}</p>
                            <p className="text-[10px] text-stone-500 truncate">
                              {track.artist}
                            </p>
                          </div>
                        </div>
                        {isCurrent && isPlayingMusic ? (
                          <Music className="w-3.5 h-3.5 text-[#B68D40] animate-pulse shrink-0" />
                        ) : (
                          <Play className="w-3 h-3 text-stone-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="mt-2.5 pt-2 border-t border-stone-200/80 text-[9.5px] leading-snug text-stone-500">
                  <span className="font-bold text-[#8B6914]">Info Musik:</span> Lagu bawaan menggunakan instrumen <span className="font-semibold">NCS (NoCopyrightSounds)</span> bebas royalti. Penggunaan lagu kustom merupakan pilihan &amp; tanggung jawab penyelenggara acara.
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/90 hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-[11px] sm:text-xs font-bold text-[#8B6914] transition-all shadow-2xs"
              title="Switch Language (Bahasa Indonesia / English)"
            >
              <Globe className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
              <span>{lang}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                weddingMusicPlayer.stop();
                setIsPlayingMusic(false);
                onOpenAdminPortal();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-[#FAF3E3] border border-[#D4AF37]/35 text-xs font-bold text-stone-700 hover:text-[#8B6914] transition-all shadow-2xs"
              title={
                isAdminLoggedIn
                  ? 'Buka Workspace Planner (My Event Planner)'
                  : 'Masuk ke Portal Planner (My Event Planner)'
              }
            >
              <Lock className="w-3.5 h-3.5 text-[#B68D40]" />
              <span className="hidden sm:inline">Planner</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO PREWEDDING BANNER & LIVE COUNTDOWN — 5 DISTINCT WEBSITE ARCHETYPES */}
      <section
        id="pembuka"
        className="relative z-10 overflow-hidden pt-4 sm:pt-8 pb-10 sm:pb-14 px-3 sm:px-4"
      >
        <div className="max-w-5xl mx-auto">
          {layoutArchetype === 'NUSANTARA_HERITAGE' ? (
            /* ============================================================================
               A. NUSANTARA_HERITAGE (CULTURE: JAVANESE / WAYANG / SUNDANESE)
               Kraton Batik Parchment Hero + Top Royal Serif Names + Gunungan Arch Medallion
               ============================================================================ */
            <div className="inv-reveal inv-reveal-up relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-[radial-gradient(ellipse_at_top,_#f0d8b8,_#fdf8f0_70%)] border-y-4 border-double border-[#C89D54] border-x-2 border-x-[#C89D54]/80 py-10 sm:py-14 px-5 sm:px-12 text-center shadow-[0_25px_70px_rgba(139,90,43,0.18)]">
              <WebkitThreeLayerCornering
                bundle={webkitBundle}
                enabled={showCorneringOrnaments}
              />
              <NusantaraGoldCornerBracket position="top-left" />
              <NusantaraGoldCornerBracket position="top-right" />
              <NusantaraGoldCornerBracket position="bottom-left" />
              <NusantaraGoldCornerBracket position="bottom-right" />

              <div className="relative z-20 max-w-3xl mx-auto">
                {/* 1. Top Javanese Aksara & Gunungan/Carving Crest */}
                <p className="text-sm sm:text-base font-serif text-[#8b5a2b] tracking-[0.22em] mb-1.5">
                  ꧋ ꧁༺ ꦩꦠꦸꦂꦤꦸꦮꦸꦤ꧀ ༻꧂ ꧋
                </p>
                <NusantaraCarvingOrnament position="top" className="mb-3" />

                {/* 2. Event Title in Spaced Uppercase Serif */}
                <p className="text-[11px] sm:text-xs font-serif font-extrabold uppercase tracking-[0.32em] text-[#8b5a2b] mb-3">
                  {isWeddingEvent
                    ? lang === 'ID'
                      ? 'PAWIWAHAN AGENG • UNDANGAN PERNIKAHAN'
                      : 'ROYAL HERITAGE • THE WEDDING OF'
                    : sanitizedHeroBadge}
                </p>

                {/* 3. Couple / Host Names in Grand Javanese Royal Gold Serif at the Top */}
                {hasSecondProfile ? (
                  <h1 className="max-w-3xl mx-auto mb-4 flex flex-col items-center justify-center">
                    <span className="text-3xl sm:text-5xl font-editorial font-bold text-[#6b4226] tracking-tight leading-snug break-words">
                      {settings.groomFullName}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex items-center justify-center gap-3 my-2 sm:my-3"
                    >
                      <span className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent to-[#C89D54]" />
                      <span className="font-serif text-lg sm:text-2xl text-[#8b5a2b] font-bold px-2">
                        ꧁༺ &amp; ༻꧂
                      </span>
                      <span className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent to-[#C89D54]" />
                    </span>
                    <span className="text-3xl sm:text-5xl font-editorial font-bold text-[#6b4226] tracking-tight leading-snug break-words">
                      {settings.brideFullName}
                    </span>
                  </h1>
                ) : (
                  <h1 className="text-3xl sm:text-5xl font-editorial font-bold text-[#6b4226] tracking-tight leading-snug mb-4 break-words">
                    {displayTitleFull}
                  </h1>
                )}

                <NusantaraCarvingOrnament position="bottom" className="mb-6" />

                {/* 4. Centerpiece Javanese Gunungan / Arch Portrait Medallion */}
                {(Boolean(heroFeatureImageUrl) ||
                  heroSlidesList.length > 0 ||
                  Boolean(settings.heroVideoUrl?.trim())) && (
                  <div className="max-w-xs sm:max-w-sm mx-auto my-6 aspect-[4/5] rounded-t-full rounded-b-2xl overflow-hidden border-4 border-double border-[#C89D54] shadow-xl relative bg-[#f5e9d6]">
                    {settings.heroVideoUrl?.trim() ? (
                      <AdaptiveVideoLayer
                        videoUrl={settings.heroVideoUrl}
                        posterUrl={heroFeatureImageUrl}
                        focusY={videoFocusY}
                        desktopMode={videoDesktopMode}
                      />
                    ) : (
                      <BackgroundSlideshowLayer
                        slides={heroSlidesList}
                        transitionStyle={galleryTransitionStyle}
                        transitionDurationMs={galleryTransitionMs}
                        slideIntervalSeconds={gallerySlideSeconds}
                        fallbackAdjust={heroAdj}
                        altLabel="Nusantara Gunungan Medallion"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 z-10 bg-gradient-to-t from-[#6b4226]/55 to-transparent pointer-events-none" />
                  </div>
                )}

                <p className="max-w-2xl mx-auto text-xs sm:text-base text-[#6b4226]/90 leading-relaxed mb-6">
                  {settings.invitationOpeningText}
                </p>

                {/* 5. Traditional Date & Venue Plaque */}
                <div className="bg-[#f5e9d6] border border-[#d5be97] rounded-2xl p-4 sm:p-5 max-w-lg mx-auto mb-8 shadow-sm">
                  <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.25em] text-[#8b5a2b] mb-1">
                    {lang === 'ID' ? 'Wanci & Sasana Pawiwahan' : 'Sacred Date & Venue'}
                  </p>
                  <p className="font-editorial text-base sm:text-xl font-bold text-[#6b4226]">
                    {mainScheduleEvent?.dateLabel ||
                      activeCountdownEvent?.dateLabel ||
                      settings.event2DateLabel}
                  </p>
                  <p className="text-xs sm:text-sm font-semibold text-[#8b5a2b] mt-1">
                    {mainScheduleEvent?.venue ||
                      activeCountdownEvent?.venue ||
                      settings.event2Venue}
                  </p>
                </div>

                {/* Kraton Countdown */}
                {activeCountdownEvent && (
                  <div className="max-w-xl mx-auto mb-8 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#f5e9d6] border border-[#C89D54] text-[#6b4226] text-[10px] sm:text-xs font-bold">
                      <Clock className="w-3.5 h-3.5 text-[#8b5a2b]" />
                      <span>{countdownLabel}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                      {[
                        { label: lang === 'ID' ? 'Hari' : 'Days', value: countdown.days },
                        { label: lang === 'ID' ? 'Jam' : 'Hours', value: countdown.hours },
                        { label: lang === 'ID' ? 'Menit' : 'Minutes', value: countdown.minutes },
                        { label: lang === 'ID' ? 'Detik' : 'Seconds', value: countdown.seconds },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl bg-[#fdf8f0] border-2 border-[#C89D54] outline outline-1 outline-offset-2 outline-[#8b5a2b]/30 p-2.5 sm:p-4 shadow-md"
                        >
                          <div className="font-editorial text-xl sm:text-4xl font-bold text-[#6b4226]">
                            {String(item.value).padStart(2, '0')}
                          </div>
                          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-[#8b5a2b] font-semibold mt-0.5">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    {settings.showSaveToCalendarButton !== false && (
                      <div className="pt-2 flex justify-center">
                        <a
                          href={googleCalendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#f5e9d6] hover:bg-[#ebd8b7] border border-[#C89D54] text-[#6b4226] text-xs font-bold shadow-sm transition-all"
                        >
                          <img
                            src={MEPLANNER_ICONS.btnSaveCalendar}
                            alt=""
                            className="w-5 h-5 shrink-0"
                          />
                          <span>{lang === 'ID' ? 'Simpan ke Kalender' : 'Save to Calendar'}</span>
                          <ExternalLink className="w-3 h-3 text-[#8b5a2b]" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {settings.showQuoteSection !== false && settings.quoteVerse && (
                  <div className="max-w-2xl mx-auto rounded-2xl bg-[#f5e9d6]/90 border-2 border-[#C89D54]/80 p-5 sm:p-7 shadow-2xs">
                    <p className="font-editorial italic text-xs sm:text-base text-[#6b4226] leading-relaxed mb-2">
                      &ldquo;{settings.quoteVerse}&rdquo;
                    </p>
                    {settings.quoteSource && (
                      <p className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-[#8b5a2b]">
                        — {settings.quoteSource} —
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : layoutArchetype === 'MODERN_BENTO' ? (
            /* ============================================================================
               B. MODERN_BENTO (VISUAL JOURNEY / EXECUTIVE SUMMIT / CUM LAUDE)
               Desktop Split-Screen 12-Col Hero (Left 7 Cols Cinema Photo + Right 5 Cols Editorial Bento)
               ============================================================================ */
            <div className="inv-reveal inv-reveal-up relative grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-lg">
              <WebkitThreeLayerCornering
                bundle={webkitBundle}
                enabled={showCorneringOrnaments}
              />
              {/* Left 7 Cols: Full-Height Cinema Photo with Overlaid Names & Date at Bottom-Left */}
              <div className="lg:col-span-7 min-h-[420px] lg:min-h-[560px] relative flex flex-col justify-end p-6 sm:p-10 text-left overflow-hidden bg-stone-900">
                <div className="absolute inset-0 w-full h-full">
                  {settings.heroVideoUrl?.trim() ? (
                    <AdaptiveVideoLayer
                      videoUrl={settings.heroVideoUrl}
                      posterUrl={heroFeatureImageUrl}
                      focusY={videoFocusY}
                      desktopMode={videoDesktopMode}
                    />
                  ) : heroSlidesList.length > 0 ? (
                    <BackgroundSlideshowLayer
                      slides={heroSlidesList}
                      transitionStyle={galleryTransitionStyle}
                      transitionDurationMs={galleryTransitionMs}
                      slideIntervalSeconds={gallerySlideSeconds}
                      fallbackAdjust={heroAdj}
                      altLabel="Modern Bento Split-Screen Hero"
                    />
                  ) : (
                    <img
                      src={heroFeatureImageUrl}
                      alt={displayTitleFull}
                      className="absolute inset-0 w-full h-full object-cover object-center"
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-stone-900/35 to-transparent pointer-events-none z-10" />

                <div className="relative z-20 max-w-xl">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/35 text-white text-[10px] font-bold tracking-[0.22em] uppercase mb-3">
                    <EventCrestIcon eventType={eventType} className="w-3.5 h-3.5 text-[#F3D77D]" />
                    <span>{sanitizedHeroBadge}</span>
                  </span>

                  {hasSecondProfile ? (
                    <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-white drop-shadow-md tracking-tight leading-tight mb-3">
                      {settings.groomFullName}{' '}
                      <span className="font-script text-3xl sm:text-4xl text-[#F3D77D] font-normal px-1">
                        &amp;
                      </span>{' '}
                      {settings.brideFullName}
                    </h1>
                  ) : (
                    <h1 className="font-editorial text-2xl sm:text-4xl font-bold text-white drop-shadow-md tracking-tight leading-tight mb-3">
                      {displayTitleFull}
                    </h1>
                  )}

                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 text-white/95 text-xs font-semibold">
                    <Calendar className="w-3.5 h-3.5 text-[#F3D77D] shrink-0" />
                    <span>
                      {mainScheduleEvent?.dateLabel ||
                        activeCountdownEvent?.dateLabel ||
                        settings.event2DateLabel}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right 5 Cols: Clean White Editorial Column */}
              <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white text-left space-y-5">
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200/80">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                      <EventCrestIcon eventType={eventType} className="w-3.5 h-3.5 text-[#B68D40]" />
                      <span>{sanitizedHeroBadge}</span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-stone-400 uppercase tracking-widest">
                      {initialsMonogram}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5">
                    {settings.invitationOpeningText}
                  </p>

                  {/* 4-Box Bento Countdown */}
                  {activeCountdownEvent && (
                    <div className="space-y-2.5 mb-5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A742B] flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{countdownLabel}</span>
                        </span>
                        {settings.showSaveToCalendarButton !== false && (
                          <a
                            href={googleCalendarUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] font-bold text-[#8B6914] hover:underline inline-flex items-center gap-1.5"
                          >
                            <img
                              src={MEPLANNER_ICONS.btnSaveCalendar}
                              alt=""
                              className="w-4 h-4 shrink-0"
                            />
                            <span>{lang === 'ID' ? 'Simpan Kalender' : 'Save Date'}</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        )}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: lang === 'ID' ? 'Hari' : 'Days', value: countdown.days },
                          { label: lang === 'ID' ? 'Jam' : 'Hours', value: countdown.hours },
                          { label: lang === 'ID' ? 'Menit' : 'Minutes', value: countdown.minutes },
                          { label: lang === 'ID' ? 'Detik' : 'Seconds', value: countdown.seconds },
                        ].map((item) => (
                          <div
                            key={item.label}
                            className="rounded-2xl bg-[#FAF8F5] border border-stone-200/95 border-b-2 border-b-[#D4AF37]/60 p-2.5 text-center shadow-2xs"
                          >
                            <div className="font-editorial text-lg sm:text-2xl font-bold text-[#9A742B]">
                              {String(item.value).padStart(2, '0')}
                            </div>
                            <div className="text-[9px] sm:text-[10px] uppercase tracking-wider text-stone-500 font-semibold">
                              {item.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Primary Venue Card */}
                  <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-3.5 flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/45 flex items-center justify-center text-[#8B6914] shrink-0">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A742B]">
                        {lang === 'ID' ? 'Lokasi Utama' : 'Primary Venue'}
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-stone-900 truncate mt-0.5">
                        {mainScheduleEvent?.venue ||
                          activeCountdownEvent?.venue ||
                          settings.event2Venue}
                      </p>
                      <p className="text-[11px] text-stone-600 line-clamp-1">
                        {mainScheduleEvent?.address ||
                          activeCountdownEvent?.address ||
                          settings.event2Address}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quote in Right Bento Column */}
                {settings.showQuoteSection !== false && settings.quoteVerse && (
                  <div className="rounded-2xl bg-[#FAF6EE]/95 border border-[#D4AF37]/35 p-4">
                    <p className="font-editorial italic text-xs text-stone-700 leading-relaxed mb-1.5">
                      &ldquo;{settings.quoteVerse}&rdquo;
                    </p>
                    {settings.quoteSource && (
                      <p className="text-[10px] font-bold tracking-widest uppercase text-[#9A742B]">
                        — {settings.quoteSource}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : layoutArchetype === 'POLAROID_MAGAZINE' ? (
            /* ============================================================================
               C. POLAROID_MAGAZINE (TIMELESS SNAPSHOT / SNAP PHOTO / PHOTOVIT / PEPPY)
               Editorial Magazine / Scrapbook Collage Hero + Headline ABOVE Tilted Polaroid
               ============================================================================ */
            <div className="inv-reveal inv-reveal-up bg-[#F7F3EE] p-6 sm:p-10 rounded-3xl border border-stone-200/90 shadow-[0_22px_60px_rgba(28,25,23,0.12)] text-center relative overflow-hidden">
              <WebkitThreeLayerCornering
                bundle={webkitBundle}
                enabled={showCorneringOrnaments}
              />
              {/* Top Magazine Masthead Row */}
              <div className="flex flex-wrap items-center justify-between gap-2 pb-4 mb-6 border-b-2 border-stone-900/15">
                <span className="text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-[0.22em] text-stone-700">
                  ISSUE NO. 01 &bull; {sanitizedHeroBadge}
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md border-2 border-dashed border-[#8B6914]/70 bg-white text-[#8B6914] text-[10px] sm:text-xs font-mono font-extrabold uppercase tracking-widest rotate-1 shadow-2xs">
                  <Calendar className="w-3 h-3 text-[#B68D40]" />
                  <span>
                    {mainScheduleEvent?.dateLabel ||
                      activeCountdownEvent?.dateLabel ||
                      settings.event2DateLabel}
                  </span>
                </span>
              </div>

              {/* Large Editorial Magazine Headline ABOVE the Photo */}
              <p className="text-[10px] sm:text-xs font-extrabold uppercase tracking-[0.35em] text-[#8B6914] mb-2">
                {lang === 'ID' ? 'EDISI SPESIAL PERAYAAN' : 'THE CELEBRATION OF'}
              </p>
              {hasSecondProfile ? (
                <h1 className="max-w-3xl mx-auto font-editorial text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight uppercase leading-tight mb-6 break-words">
                  {settings.groomFullName}{' '}
                  <span className="font-script text-3xl sm:text-5xl text-[#B68D40] lowercase font-normal px-1">
                    &amp;
                  </span>{' '}
                  {settings.brideFullName}
                </h1>
              ) : (
                <h1 className="max-w-3xl mx-auto font-editorial text-3xl sm:text-5xl font-bold text-stone-900 tracking-tight uppercase leading-tight mb-6 break-words">
                  {displayTitleFull}
                </h1>
              )}

              {/* Centerpiece Tilted Polaroid Photo Frame */}
              {(Boolean(heroFeatureImageUrl) ||
                heroSlidesList.length > 0 ||
                Boolean(settings.heroVideoUrl?.trim())) && (
                <div className="max-w-md mx-auto my-6 bg-white p-3.5 sm:p-4 pb-10 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] border border-stone-200 rotate-[-1.5deg] relative z-20">
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-[#FAF8F5]">
                    {settings.heroVideoUrl?.trim() ? (
                      <AdaptiveVideoLayer
                        videoUrl={settings.heroVideoUrl}
                        posterUrl={heroFeatureImageUrl}
                        focusY={videoFocusY}
                        desktopMode={videoDesktopMode}
                      />
                    ) : (
                      <BackgroundSlideshowLayer
                        slides={heroSlidesList}
                        transitionStyle={galleryTransitionStyle}
                        transitionDurationMs={galleryTransitionMs}
                        slideIntervalSeconds={gallerySlideSeconds}
                        fallbackAdjust={heroAdj}
                        altLabel="Polaroid Magazine Snapshot"
                      />
                    )}
                  </div>
                  <div className="pt-4 px-2 flex items-center justify-between gap-2">
                    <p className="font-script text-2xl sm:text-3xl text-[#8B6914] leading-none">
                      {displayTitleShort}
                    </p>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-500">
                      {mainScheduleEvent?.venue ||
                        activeCountdownEvent?.venue ||
                        settings.event2Venue}
                    </span>
                  </div>
                </div>
              )}

              <p className="max-w-2xl mx-auto text-xs sm:text-base text-stone-600 leading-relaxed mt-6 mb-8">
                {settings.invitationOpeningText}
              </p>

              {/* Polaroid Capsule Countdown */}
              {activeCountdownEvent && (
                <div className="max-w-xl mx-auto mb-8 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white border border-stone-300 text-stone-800 text-[10px] sm:text-xs font-bold">
                    <Clock className="w-3.5 h-3.5 text-[#B68D40]" />
                    <span>{countdownLabel}</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                    {[
                      { label: lang === 'ID' ? 'Hari' : 'Days', value: countdown.days },
                      { label: lang === 'ID' ? 'Jam' : 'Hours', value: countdown.hours },
                      { label: lang === 'ID' ? 'Menit' : 'Minutes', value: countdown.minutes },
                      { label: lang === 'ID' ? 'Detik' : 'Seconds', value: countdown.seconds },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="rounded-full bg-white border-2 border-stone-200/90 py-3 sm:py-4 px-2 shadow-md"
                      >
                        <div className="font-editorial text-xl sm:text-4xl font-bold text-stone-900">
                          {String(item.value).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 font-semibold mt-0.5">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                  {settings.showSaveToCalendarButton !== false && (
                    <div className="pt-2 flex justify-center">
                      <a
                        href={googleCalendarUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-stone-300 text-stone-900 text-xs font-bold shadow-xs transition-all"
                      >
                        <img
                          src={MEPLANNER_ICONS.btnSaveCalendar}
                          alt=""
                          className="w-5 h-5 shrink-0"
                        />
                        <span>{lang === 'ID' ? 'Simpan ke Kalender' : 'Save to Calendar'}</span>
                        <ExternalLink className="w-3 h-3 text-[#B68D40]" />
                      </a>
                    </div>
                  )}
                </div>
              )}

              {settings.showQuoteSection !== false && settings.quoteVerse && (
                <div className="max-w-2xl mx-auto rounded-2xl bg-white border border-stone-200 p-5 sm:p-7 shadow-2xs">
                  <p className="font-editorial italic text-xs sm:text-base text-stone-700 leading-relaxed mb-2">
                    &ldquo;{settings.quoteVerse}&rdquo;
                  </p>
                  {settings.quoteSource && (
                    <p className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-[#9A742B]">
                      — {settings.quoteSource} —
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : layoutArchetype === 'BOTANICAL_AIRY' ? (
            /* ============================================================================
               D. BOTANICAL_AIRY (SEREIN / BLUBLOOM / MILDNESS / GARDEN PARTY)
               Pastel Watercolor & Tall Cathedral Arch Hero + Botanical Corner Sprigs
               ============================================================================ */
            <div className="inv-reveal inv-reveal-up relative overflow-hidden bg-gradient-to-b from-white via-[#F6FAF7] to-white p-6 sm:p-12 rounded-[2.5rem] border border-emerald-200/70 text-center shadow-[0_24px_65px_rgba(94,140,106,0.14)]">
              <WebkitThreeLayerCornering
                bundle={webkitBundle}
                enabled={showCorneringOrnaments}
              />
              <FloralCornerOrnament position="top-left" enabled={showFloral} />
              <FloralCornerOrnament position="top-right" enabled={showFloral} />
              <FloralCornerOrnament position="bottom-left" enabled={showFloral} />
              <FloralCornerOrnament position="bottom-right" enabled={showFloral} />

              <div className="relative z-20 max-w-3xl mx-auto">
                {/* Soft Pastel Pill Badge at the Very Top */}
                <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-300/70 text-[#8B6914] text-[10px] sm:text-xs font-bold tracking-[0.22em] uppercase shadow-2xs mb-4">
                  <Sparkles className="w-3.5 h-3.5 text-[#B68D40]" />
                  <span>{sanitizedHeroBadge}</span>
                </div>

                {/* Couple Names in Romantic Script / Serif ABOVE Cathedral Arch */}
                {hasSecondProfile ? (
                  <h1 className="max-w-3xl mx-auto mb-4 flex flex-col items-center justify-center">
                    <span className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-snug">
                      {settings.groomFullName}
                    </span>
                    <span className="font-script text-3xl sm:text-5xl text-[#B68D40] my-1.5 leading-none">
                      &amp;
                    </span>
                    <span className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-snug">
                      {settings.brideFullName}
                    </span>
                  </h1>
                ) : (
                  <h1 className="max-w-3xl mx-auto font-editorial text-2xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-snug mb-4">
                    {displayTitleFull}
                  </h1>
                )}

                {/* Tall Cathedral Arch Photo */}
                {(Boolean(heroFeatureImageUrl) ||
                  heroSlidesList.length > 0 ||
                  Boolean(settings.heroVideoUrl?.trim())) && (
                  <div className="relative max-w-xs sm:max-w-sm mx-auto my-6 aspect-[3/4] rounded-t-[10rem] rounded-b-3xl overflow-hidden border-4 border-white shadow-lg bg-[#FAF8F5]">
                    <BotanicalCornerSprig position="bottom-left" size="sm" enabled={showFloral} />
                    <BotanicalCornerSprig position="bottom-right" size="sm" enabled={showFloral} />
                    {settings.heroVideoUrl?.trim() ? (
                      <AdaptiveVideoLayer
                        videoUrl={settings.heroVideoUrl}
                        posterUrl={heroFeatureImageUrl}
                        focusY={videoFocusY}
                        desktopMode={videoDesktopMode}
                      />
                    ) : (
                      <BackgroundSlideshowLayer
                        slides={heroSlidesList}
                        transitionStyle={galleryTransitionStyle}
                        transitionDurationMs={galleryTransitionMs}
                        slideIntervalSeconds={gallerySlideSeconds}
                        fallbackAdjust={heroAdj}
                        altLabel="Botanical Cathedral Arch"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 z-10 bg-gradient-to-t from-white/80 to-transparent pointer-events-none" />
                  </div>
                )}

                <p className="max-w-2xl mx-auto text-xs sm:text-base text-stone-600 leading-relaxed mb-8">
                  {settings.invitationOpeningText}
                </p>

                {/* Airy Pill Countdown */}
                {activeCountdownEvent && (
                  <div className="max-w-xl mx-auto mb-8 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 border border-emerald-200/80 text-[#8B6914] text-[10px] sm:text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{countdownLabel}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                      {[
                        { label: lang === 'ID' ? 'Hari' : 'Days', value: countdown.days },
                        { label: lang === 'ID' ? 'Jam' : 'Hours', value: countdown.hours },
                        { label: lang === 'ID' ? 'Menit' : 'Minutes', value: countdown.minutes },
                        { label: lang === 'ID' ? 'Detik' : 'Seconds', value: countdown.seconds },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-full bg-white/95 backdrop-blur-md border-2 border-white ring-1 ring-[#D4AF37]/35 py-3.5 sm:py-5 px-2 shadow-[0_10px_28px_rgba(94,140,106,0.12)]"
                        >
                          <div className="font-editorial text-xl sm:text-4xl font-bold text-[#9A742B]">
                            {String(item.value).padStart(2, '0')}
                          </div>
                          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 font-semibold mt-0.5">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    {settings.showSaveToCalendarButton !== false && (
                      <div className="pt-2 flex justify-center">
                        <a
                          href={googleCalendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/50 text-[#8B6914] text-xs font-bold shadow-sm transition-all"
                        >
                          <img
                            src={MEPLANNER_ICONS.btnSaveCalendar}
                            alt=""
                            className="w-5 h-5 shrink-0"
                          />
                          <span>{lang === 'ID' ? 'Simpan ke Kalender' : 'Save to Calendar'}</span>
                          <ExternalLink className="w-3 h-3 text-[#B68D40]" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {settings.showQuoteSection !== false && settings.quoteVerse && (
                  <div className="max-w-2xl mx-auto rounded-3xl bg-white/90 border border-emerald-200/70 p-5 sm:p-7 shadow-2xs">
                    <p className="font-editorial italic text-xs sm:text-base text-stone-700 leading-relaxed mb-2">
                      &ldquo;{settings.quoteVerse}&rdquo;
                    </p>
                    {settings.quoteSource && (
                      <p className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-[#9A742B]">
                        — {settings.quoteSource} —
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ============================================================================
               E. EDITORIAL_CLASSIC (LIGHT LUXURY / CHAMPAGNE SYMPHONY / GOLDEN JUBILEE)
               Classic Ivory Luxury Card with Fine Gold Hairlines & Balanced Symmetry
               ============================================================================ */
            <div className="inv-reveal inv-reveal-up relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-[#FFFDF9] border border-[#D4AF37]/45 outline outline-1 -outline-offset-8 outline-[#D4AF37]/25 p-6 sm:p-12 text-center shadow-[0_25px_70px_rgba(160,130,85,0.16)]">
              <WebkitThreeLayerCornering
                bundle={webkitBundle}
                enabled={showCorneringOrnaments}
              />
              <div className="relative z-20 max-w-3xl mx-auto">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] sm:text-xs font-bold tracking-[0.25em] uppercase mb-5">
                  <EventCrestIcon eventType={eventType} className="w-3.5 h-3.5 text-[#B68D40]" />
                  <span>{sanitizedHeroBadge}</span>
                </div>

                {hasSecondProfile ? (
                  <h1 className="max-w-3xl mx-auto mb-5 flex flex-col items-center justify-center">
                    <span className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-snug">
                      {settings.groomFullName}
                    </span>
                    <span
                      aria-hidden="true"
                      className="flex items-center justify-center gap-3 my-2 sm:my-3"
                    >
                      <span className="w-10 sm:w-16 h-px bg-gradient-to-r from-transparent to-[#D4AF37]" />
                      <span className="font-script text-3xl sm:text-4xl text-[#B68D40] leading-none px-1">
                        &amp;
                      </span>
                      <span className="w-10 sm:w-16 h-px bg-gradient-to-l from-transparent to-[#D4AF37]" />
                    </span>
                    <span className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 tracking-tight leading-snug">
                      {settings.brideFullName}
                    </span>
                  </h1>
                ) : (
                  <h1 className="max-w-3xl mx-auto font-editorial text-2xl sm:text-4xl md:text-5xl font-bold text-stone-900 tracking-tight leading-snug mb-5">
                    {displayTitleFull}
                  </h1>
                )}

                {(Boolean(heroFeatureImageUrl) ||
                  heroSlidesList.length > 0 ||
                  Boolean(settings.heroVideoUrl?.trim())) && (
                  <div className="relative max-w-2xl mx-auto my-6 aspect-[16/10] rounded-t-[3.5rem] rounded-b-2xl overflow-hidden border-2 border-[#D4AF37]/50 shadow-xl bg-[#FAF8F5]">
                    {settings.heroVideoUrl?.trim() ? (
                      <AdaptiveVideoLayer
                        videoUrl={settings.heroVideoUrl}
                        posterUrl={heroFeatureImageUrl}
                        focusY={videoFocusY}
                        desktopMode={videoDesktopMode}
                      />
                    ) : (
                      <BackgroundSlideshowLayer
                        slides={heroSlidesList}
                        transitionStyle={galleryTransitionStyle}
                        transitionDurationMs={galleryTransitionMs}
                        slideIntervalSeconds={gallerySlideSeconds}
                        fallbackAdjust={heroAdj}
                        altLabel="Editorial Classic Banner"
                      />
                    )}
                    <div className="absolute inset-x-0 bottom-0 h-20 z-10 bg-gradient-to-t from-[#FFFDF9]/80 to-transparent pointer-events-none" />
                  </div>
                )}

                <p className="max-w-2xl mx-auto text-xs sm:text-base text-stone-600 leading-relaxed mb-8">
                  {settings.invitationOpeningText}
                </p>

                {activeCountdownEvent && (
                  <div className="max-w-xl mx-auto mb-8 space-y-4">
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] sm:text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{countdownLabel}</span>
                    </div>
                    <div className="grid grid-cols-4 gap-2.5 sm:gap-4">
                      {[
                        { label: lang === 'ID' ? 'Hari' : 'Days', value: countdown.days },
                        { label: lang === 'ID' ? 'Jam' : 'Hours', value: countdown.hours },
                        { label: lang === 'ID' ? 'Menit' : 'Minutes', value: countdown.minutes },
                        { label: lang === 'ID' ? 'Detik' : 'Seconds', value: countdown.seconds },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="rounded-2xl bg-white/95 border border-[#D4AF37]/40 p-2.5 sm:p-4 shadow-[0_8px_25px_rgba(180,150,100,0.10)]"
                        >
                          <div className="font-editorial text-xl sm:text-4xl font-bold text-[#9A742B]">
                            {String(item.value).padStart(2, '0')}
                          </div>
                          <div className="text-[10px] sm:text-xs uppercase tracking-widest text-stone-500 font-semibold mt-0.5">
                            {item.label}
                          </div>
                        </div>
                      ))}
                    </div>
                    {settings.showSaveToCalendarButton !== false && (
                      <div className="pt-2 flex justify-center">
                        <a
                          href={googleCalendarUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FAF3E3] via-white to-[#FAF3E3] border border-[#D4AF37]/60 text-[#8B6914] text-xs font-bold shadow-sm transition-all"
                        >
                          <img
                            src={MEPLANNER_ICONS.btnSaveCalendar}
                            alt=""
                            className="w-5 h-5 shrink-0"
                          />
                          <span>{lang === 'ID' ? 'Simpan ke Kalender' : 'Save to Calendar'}</span>
                          <ExternalLink className="w-3 h-3 text-[#B68D40]" />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {settings.showQuoteSection !== false && settings.quoteVerse && (
                  <div className="max-w-2xl mx-auto rounded-2xl bg-[#FAF6EE]/95 border border-[#D4AF37]/35 p-5 sm:p-7 shadow-2xs">
                    <p className="font-editorial italic text-xs sm:text-base text-stone-700 leading-relaxed mb-2">
                      &ldquo;{settings.quoteVerse}&rdquo;
                    </p>
                    {settings.quoteSource && (
                      <p className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-[#9A742B]">
                        — {settings.quoteSource} —
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      <WebkitSectionDivider src={webkitBundle.sectionDividerSvg} />

      {/* SECTION: PROFIL MEMPELAI / HOST (ARCHETYPE-DISTINCT PROFILE CARDS) */}
      {settings.showCoupleSection !== false && (
        <section id="mempelai" className="relative z-10 py-10 sm:py-16 px-3 sm:px-4 max-w-5xl mx-auto">
          {webkitBundle.themeOrnamentSvg && (
            <div
              aria-hidden="true"
              className="pointer-events-none select-none flex justify-center mb-2"
            >
              <img
                src={webkitBundle.themeOrnamentSvg}
                alt=""
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain opacity-90 drop-shadow-[0_4px_12px_rgba(197,160,89,0.25)]"
              />
            </div>
          )}
          <EditorialSectionHeader
            badge={coverBadgeLabel}
            title={profileTitle}
            archetype={layoutArchetype}
          />

          <div
            className={
              hasSecondProfile
                ? 'relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch'
                : 'relative max-w-lg mx-auto'
            }
          >
            {/* Primary Host / Groom Card */}
            <div
              className={`inv-reveal inv-reveal-left relative h-full min-w-0 overflow-hidden backdrop-blur-xl p-5 sm:p-8 flex flex-col justify-between transition-all ${
                layoutArchetype === 'NUSANTARA_HERITAGE'
                  ? 'rounded-3xl bg-[#fdf8f0]/95 border-2 border-[#C89D54] outline outline-1 outline-offset-4 outline-[#8b5a2b]/35 text-center items-center shadow-[0_18px_50px_rgba(139,90,43,0.15)]'
                  : layoutArchetype === 'MODERN_BENTO'
                  ? 'rounded-3xl bg-white border border-stone-200/95 text-center sm:text-left shadow-[0_18px_50px_rgba(40,75,122,0.10)]'
                  : layoutArchetype === 'POLAROID_MAGAZINE'
                  ? 'rounded-2xl bg-white border border-stone-200/95 text-center items-center shadow-[0_18px_45px_rgba(28,25,23,0.12)]'
                  : 'rounded-3xl bg-white/85 border border-white/95 text-center items-center shadow-[0_18px_50px_rgba(175,145,95,0.12)]'
              }`}
            >
              <FloralCornerOrnament position="top-left" size="sm" enabled={showFloral} />
              <FloralCornerOrnament position="top-right" size="sm" enabled={showFloral} />

              {layoutArchetype === 'NUSANTARA_HERITAGE' && (
                <NusantaraCarvingOrnament position="top" className="mb-3" />
              )}

              {layoutArchetype === 'MODERN_BENTO' ? (
                /* MODERN BENTO: Horizontal / Editorial Magazine Profile Layout */
                <div className="w-full relative z-10 flex flex-col h-full justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200/80">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                        <img
                          src={webkitBundle.categoryBadgeSvg}
                          alt=""
                          className="w-3.5 h-3.5 object-contain shrink-0"
                        />
                        <span>
                          {settings.eventHostRoleLabel ||
                            (settings.groomRankAndTitle &&
                            settings.groomRankAndTitle !== 'Mempelai Pria'
                              ? settings.groomRankAndTitle
                              : eventMeta.primaryRoleBadge)}
                        </span>
                      </span>
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">
                        PROFILE &bull; 01
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      {settings.showProfilePhotos !== false && (
                        <div className="w-36 h-44 sm:w-40 sm:h-48 rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 shrink-0 relative">
                          <img
                            src={settings.groomPhotoUrl}
                            alt={settings.groomFullName}
                            className="w-full h-full object-cover object-center"
                            style={getPhotoAdjustStyle(settings.photoAdjustments?.groomPhotoUrl)}
                          />
                          {webkitBundle.frameOverlaySvg && (
                            <img
                              src={webkitBundle.frameOverlaySvg}
                              alt=""
                              aria-hidden="true"
                              className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-10 opacity-75"
                            />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900 mb-1.5 leading-snug break-words">
                          {settings.groomFullName}
                        </h3>
                        {(settings.groomUnit || settings.groomOrigin) &&
                          (settings.groomUnit || settings.groomOrigin).trim() !== '-' && (
                            <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3">
                              {settings.groomUnit || settings.groomOrigin}
                            </p>
                          )}
                        {settings.groomParents &&
                          settings.groomParents.trim() !== '' &&
                          settings.groomParents.trim() !== '-' && (
                            <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-3 text-xs text-stone-600 leading-relaxed">
                              {settings.groomParents}
                            </div>
                          )}
                      </div>
                    </div>
                  </div>

                  {Boolean(
                    settings.groomUnit &&
                      settings.groomUnit.trim() !== '' &&
                      settings.groomOrigin &&
                      settings.groomOrigin.trim() !== '' &&
                      settings.groomOrigin.trim() !== '-'
                  ) && (
                    <div className="pt-3 mt-4 border-t border-stone-200/80 w-full flex items-center justify-center sm:justify-start gap-2 text-xs text-stone-500 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#B68D40]" />
                      <span>{settings.groomOrigin}</span>
                    </div>
                  )}
                </div>
              ) : (
                /* POLAROID_MAGAZINE / NUSANTARA_HERITAGE / BOTANICAL_AIRY / EDITORIAL_CLASSIC */
                <>
                  <div className="flex flex-col items-center w-full relative z-10">
                    {settings.showProfilePhotos !== false && (
                      <div className="relative mb-5 sm:mb-6 shrink-0">
                        <FloralCornerOrnament
                          position="bottom-left"
                          size="sm"
                          className="-bottom-3 -left-6 opacity-90"
                          enabled={showFloral}
                        />
                        <FloralCornerOrnament
                          position="bottom-right"
                          size="sm"
                          className="-bottom-3 -right-6 opacity-90"
                          enabled={showFloral}
                        />
                        {layoutArchetype === 'POLAROID_MAGAZINE' ? (
                          <div className="w-44 sm:w-52 p-2.5 pb-4 bg-white rounded-2xl border border-stone-200 shadow-[0_14px_32px_rgba(28,25,23,0.14)] rotate-[-1deg]">
                            <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-stone-100">
                              <img
                                src={settings.groomPhotoUrl}
                                alt={settings.groomFullName}
                                className="w-full h-full object-cover object-center"
                                style={getPhotoAdjustStyle(
                                  settings.photoAdjustments?.groomPhotoUrl
                                )}
                              />
                            </div>
                            <div className="pt-2.5 px-1 flex items-center justify-between gap-1 border-b border-dashed border-stone-200/80 pb-1">
                              <span className="font-script text-xl sm:text-2xl text-[#8B6914] leading-none truncate">
                                {settings.groomNickname || settings.groomFullName}
                              </span>
                              <Camera className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                            </div>
                          </div>
                        ) : (
                          <div
                            className={`${
                              layoutArchetype === 'NUSANTARA_HERITAGE'
                                ? 'w-36 h-48 sm:w-48 sm:h-64 rounded-2xl border-2 border-[#8b5a2b]/65 outline outline-1 outline-offset-4 outline-[#C89D54] shadow-xl'
                                : settings.profileFrameStyle === 'CIRCLE'
                                ? 'w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg'
                                : settings.profileFrameStyle === 'EDITORIAL_RECT'
                                ? 'w-40 h-52 sm:w-52 sm:h-64 rounded-[2rem] border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg'
                                : 'w-36 h-48 sm:w-48 sm:h-64 rounded-t-full rounded-b-3xl border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg'
                            } overflow-hidden bg-stone-100 relative`}
                          >
                            <img
                              src={settings.groomPhotoUrl}
                              alt={settings.groomFullName}
                              className="w-full h-full object-cover object-center"
                              style={getPhotoAdjustStyle(
                                settings.photoAdjustments?.groomPhotoUrl
                              )}
                            />
                            {webkitBundle.frameOverlaySvg && (
                              <img
                                src={webkitBundle.frameOverlaySvg}
                                alt=""
                                aria-hidden="true"
                                className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-10 opacity-80"
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[11px] font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
                      <img
                        src={webkitBundle.categoryBadgeSvg}
                        alt=""
                        className="w-3.5 h-3.5 object-contain shrink-0"
                      />
                      <span>
                        {settings.eventHostRoleLabel ||
                          (settings.groomRankAndTitle &&
                          settings.groomRankAndTitle !== 'Mempelai Pria'
                            ? settings.groomRankAndTitle
                            : eventMeta.primaryRoleBadge)}
                      </span>
                    </span>
                    <h3 className="font-editorial text-xl sm:text-3xl font-bold text-stone-900 mb-2 sm:mb-2.5 leading-snug break-words">
                      {settings.groomFullName}
                    </h3>
                    {(settings.groomUnit || settings.groomOrigin) &&
                      (settings.groomUnit || settings.groomOrigin).trim() !== '-' && (
                        <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3.5 sm:mb-4 min-h-[1.25rem]">
                          {settings.groomUnit || settings.groomOrigin}
                        </p>
                      )}
                    {settings.groomParents &&
                      settings.groomParents.trim() !== '' &&
                      settings.groomParents.trim() !== '-' && (
                        <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5">
                          {settings.groomParents}
                        </p>
                      )}
                  </div>
                  {Boolean(
                    settings.groomUnit &&
                      settings.groomUnit.trim() !== '' &&
                      settings.groomOrigin &&
                      settings.groomOrigin.trim() !== '' &&
                      settings.groomOrigin.trim() !== '-'
                  ) && (
                    <div className="pt-3 border-t border-stone-200/80 w-full flex items-center justify-center gap-2 text-xs text-stone-500 font-medium mt-auto relative z-10">
                      <MapPin className="w-3.5 h-3.5 text-[#B68D40]" />
                      <span>{settings.groomOrigin}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {hasSecondProfile && (
              <>
                {/* Calligraphic / Nusantara Ornament Separator Between Groom & Bride */}
                <div
                  aria-hidden="true"
                  className="flex md:hidden items-center justify-center -my-1"
                >
                  {layoutArchetype === 'NUSANTARA_HERITAGE' ? (
                    <span className="font-serif text-sm font-bold text-[#8b5a2b] px-4 py-1.5 rounded-full bg-[#fdf8f0] border-2 border-[#C89D54] shadow-sm tracking-widest">
                      ꧋ ꧁༺ &amp; ༻꧂ ꧋
                    </span>
                  ) : (
                    <span className="font-script text-4xl text-[#B68D40] px-4 py-1 rounded-full bg-white/90 border border-[#D4AF37]/45 shadow-sm">
                      &amp;
                    </span>
                  )}
                </div>
                <div
                  aria-hidden="true"
                  className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
                >
                  {layoutArchetype === 'NUSANTARA_HERITAGE' ? (
                    <span className="px-3.5 py-2 rounded-full bg-[#fdf8f0] border-2 border-[#C89D54] outline outline-1 outline-offset-2 outline-[#8b5a2b]/40 shadow-[0_10px_30px_rgba(139,90,43,0.25)] flex items-center justify-center font-serif text-xs font-bold text-[#8b5a2b] whitespace-nowrap">
                      ꧁༺ &amp; ༻꧂
                    </span>
                  ) : (
                    <span className="w-14 h-14 rounded-full bg-white/95 border-2 border-[#D4AF37]/60 shadow-[0_10px_30px_rgba(197,160,89,0.28)] flex items-center justify-center font-script text-4xl sm:text-5xl text-[#B68D40]">
                      &amp;
                    </span>
                  )}
                </div>

                {/* Secondary Host / Bride Card */}
                <div
                  className={`inv-reveal inv-reveal-right relative h-full min-w-0 overflow-hidden backdrop-blur-xl p-5 sm:p-8 flex flex-col justify-between transition-all ${
                    layoutArchetype === 'NUSANTARA_HERITAGE'
                      ? 'rounded-3xl bg-[#fdf8f0]/95 border-2 border-[#C89D54] outline outline-1 outline-offset-4 outline-[#8b5a2b]/35 text-center items-center shadow-[0_18px_50px_rgba(139,90,43,0.15)]'
                      : layoutArchetype === 'MODERN_BENTO'
                      ? 'rounded-3xl bg-white border border-stone-200/95 text-center sm:text-left shadow-[0_18px_50px_rgba(40,75,122,0.10)]'
                      : layoutArchetype === 'POLAROID_MAGAZINE'
                      ? 'rounded-2xl bg-white border border-stone-200/95 text-center items-center shadow-[0_18px_45px_rgba(28,25,23,0.12)]'
                      : 'rounded-3xl bg-white/85 border border-white/95 text-center items-center shadow-[0_18px_50px_rgba(175,145,95,0.12)]'
                  }`}
                >
                  <FloralCornerOrnament position="top-left" size="sm" enabled={showFloral} />
                  <FloralCornerOrnament position="top-right" size="sm" enabled={showFloral} />

                  {layoutArchetype === 'NUSANTARA_HERITAGE' && (
                    <NusantaraCarvingOrnament position="top" className="mb-3" />
                  )}

                  {layoutArchetype === 'MODERN_BENTO' ? (
                    /* MODERN BENTO: Horizontal / Editorial Magazine Profile Layout */
                    <div className="w-full relative z-10 flex flex-col h-full justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 pb-3 mb-4 border-b border-stone-200/80">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                            <img
                              src={webkitBundle.categoryBadgeSvg}
                              alt=""
                              className="w-3.5 h-3.5 object-contain shrink-0"
                            />
                            <span>
                              {settings.brideTitle &&
                              settings.brideTitle !== 'Mempelai Wanita'
                                ? settings.brideTitle
                                : eventMeta.secondaryRoleBadge}
                            </span>
                          </span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-stone-400">
                            PROFILE &bull; 02
                          </span>
                        </div>

                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                          {settings.showProfilePhotos !== false && (
                            <div className="w-36 h-44 sm:w-40 sm:h-48 rounded-2xl overflow-hidden border border-stone-200 shadow-md bg-stone-100 shrink-0 relative">
                              <img
                                src={settings.bridePhotoUrl}
                                alt={settings.brideFullName}
                                className="w-full h-full object-cover object-center"
                                style={getPhotoAdjustStyle(
                                  settings.photoAdjustments?.bridePhotoUrl
                                )}
                              />
                              {webkitBundle.frameOverlaySvg && (
                                <img
                                  src={webkitBundle.frameOverlaySvg}
                                  alt=""
                                  aria-hidden="true"
                                  className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-10 opacity-75"
                                />
                              )}
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <h3 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900 mb-1.5 leading-snug break-words">
                              {settings.brideFullName}
                            </h3>
                            {settings.brideOrigin && settings.brideOrigin.trim() !== '-' && (
                              <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3">
                                {settings.brideOrigin}
                              </p>
                            )}
                            {settings.brideParents &&
                              settings.brideParents.trim() !== '' &&
                              settings.brideParents.trim() !== '-' && (
                                <div className="rounded-2xl bg-[#FAF8F5] border border-stone-200/90 p-3 text-xs text-stone-600 leading-relaxed">
                                  {settings.brideParents}
                                </div>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* POLAROID_MAGAZINE / NUSANTARA_HERITAGE / BOTANICAL_AIRY / EDITORIAL_CLASSIC */
                    <div className="flex flex-col items-center w-full relative z-10">
                      {settings.showProfilePhotos !== false && (
                        <div className="relative mb-5 sm:mb-6 shrink-0">
                          <FloralCornerOrnament
                            position="bottom-left"
                            size="sm"
                            className="-bottom-3 -left-6 opacity-90"
                            enabled={showFloral}
                          />
                          <FloralCornerOrnament
                            position="bottom-right"
                            size="sm"
                            className="-bottom-3 -right-6 opacity-90"
                            enabled={showFloral}
                          />
                          {layoutArchetype === 'POLAROID_MAGAZINE' ? (
                            <div className="w-44 sm:w-52 p-2.5 pb-4 bg-white rounded-2xl border border-stone-200 shadow-[0_14px_32px_rgba(28,25,23,0.14)] rotate-[1deg]">
                              <div className="w-full aspect-[4/5] rounded-xl overflow-hidden bg-stone-100">
                                <img
                                  src={settings.bridePhotoUrl}
                                  alt={settings.brideFullName}
                                  className="w-full h-full object-cover object-center"
                                  style={getPhotoAdjustStyle(
                                    settings.photoAdjustments?.bridePhotoUrl
                                  )}
                                />
                              </div>
                              <div className="pt-2.5 px-1 flex items-center justify-between gap-1 border-b border-dashed border-stone-200/80 pb-1">
                                <span className="font-script text-xl sm:text-2xl text-[#8B6914] leading-none truncate">
                                  {settings.brideNickname || settings.brideFullName}
                                </span>
                                <Camera className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                              </div>
                            </div>
                          ) : (
                            <div
                              className={`${
                                layoutArchetype === 'NUSANTARA_HERITAGE'
                                  ? 'w-36 h-48 sm:w-48 sm:h-64 rounded-2xl border-2 border-[#8b5a2b]/65 outline outline-1 outline-offset-4 outline-[#C89D54] shadow-xl'
                                  : settings.profileFrameStyle === 'CIRCLE'
                                  ? 'w-36 h-36 sm:w-48 sm:h-48 rounded-full border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg'
                                  : settings.profileFrameStyle === 'EDITORIAL_RECT'
                                  ? 'w-40 h-52 sm:w-52 sm:h-64 rounded-[2rem] border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg'
                                  : 'w-36 h-48 sm:w-48 sm:h-64 rounded-t-full rounded-b-3xl border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg'
                              } overflow-hidden bg-stone-100 relative`}
                            >
                              <img
                                src={settings.bridePhotoUrl}
                                alt={settings.brideFullName}
                                className="w-full h-full object-cover object-center"
                                style={getPhotoAdjustStyle(
                                  settings.photoAdjustments?.bridePhotoUrl
                                )}
                              />
                              {webkitBundle.frameOverlaySvg && (
                                <img
                                  src={webkitBundle.frameOverlaySvg}
                                  alt=""
                                  aria-hidden="true"
                                  className="pointer-events-none select-none absolute inset-0 w-full h-full object-contain z-10 opacity-80"
                                />
                              )}
                            </div>
                          )}
                        </div>
                      )}
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[11px] font-bold uppercase tracking-wider mb-3.5 sm:mb-4">
                        <img
                          src={webkitBundle.categoryBadgeSvg}
                          alt=""
                          className="w-3.5 h-3.5 object-contain shrink-0"
                        />
                        <span>
                          {settings.brideTitle &&
                          settings.brideTitle !== 'Mempelai Wanita'
                            ? settings.brideTitle
                            : eventMeta.secondaryRoleBadge}
                        </span>
                      </span>
                      <h3 className="font-editorial text-xl sm:text-3xl font-bold text-stone-900 mb-2 sm:mb-2.5 leading-snug break-words">
                        {settings.brideFullName}
                      </h3>
                      {settings.brideOrigin && settings.brideOrigin.trim() !== '-' && (
                        <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3.5 sm:mb-4 min-h-[1.25rem]">
                          {settings.brideOrigin}
                        </p>
                      )}
                      {settings.brideParents &&
                        settings.brideParents.trim() !== '' &&
                        settings.brideParents.trim() !== '-' && (
                          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-5">
                            {settings.brideParents}
                          </p>
                        )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      )}

      {/* SECTION: JADWAL & LOKASI ACARA + INTEGRASI GOOGLE MAPS (SYMMETRICAL CARDS) */}
      {visibleEvents.length > 0 && (
        <>
          <WebkitSectionDivider src={webkitBundle.sectionDividerSvg} />
          <section id="acara" className="relative z-10 py-10 sm:py-16 px-3 sm:px-4 max-w-5xl mx-auto">
            <div id="lokasi" className="scroll-mt-24" />
            <EditorialSectionHeader
              badge={lang === 'ID' ? 'Agenda & Waktu' : 'Date & Venue'}
              title={scheduleTitle}
              subtitle={settings.subtitle}
              archetype={layoutArchetype}
            />

          <div
            className={`grid grid-cols-1 gap-4 sm:gap-6 items-stretch ${
              visibleEvents.length === 1
                ? 'max-w-lg mx-auto'
                : visibleEvents.length === 2 || visibleEvents.length === 4
                  ? 'md:grid-cols-2 max-w-4xl mx-auto'
                  : 'lg:grid-cols-3'
            }`}
          >
            {visibleEvents.map((ev, idx) => {
              const hasDresscode =
                Boolean(ev.dresscode) &&
                ev.dresscode.trim() !== '' &&
                ev.dresscode.trim() !== '-';
              const hasMapsUrl =
                Boolean(ev.mapsUrl) &&
                ev.mapsUrl.trim() !== '' &&
                ev.mapsUrl.trim() !== '#';

              return (
                <div
                  key={idx}
                  className={`inv-reveal inv-reveal-up relative h-full min-w-0 overflow-hidden rounded-3xl p-5 sm:p-7 flex flex-col justify-between transition-all backdrop-blur-xl ${
                    layoutArchetype === 'NUSANTARA_HERITAGE'
                      ? 'bg-[#FFFDF9]/95 border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30 shadow-[0_18px_50px_rgba(175,145,95,0.16)]'
                      : ev.highlight
                      ? 'bg-gradient-to-b from-white/95 via-[#FFFDF9]/95 to-[#FAF3E3]/90 border-2 border-[#D4AF37]/60 shadow-[0_20px_55px_rgba(197,160,89,0.20)]'
                      : 'bg-white/85 border border-white/95 shadow-[0_15px_45px_rgba(175,145,95,0.12)]'
                  }`}
                >
                  <WebkitCardFourCorners cornerSvg={webkitBundle.cardCornerSvg} />
                  <FloralCornerOrnament position="top-right" size="sm" enabled={showFloral} />
                  <div className="flex flex-col flex-1 relative z-10">
                    <div className="flex items-center justify-between gap-2 mb-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-3 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold uppercase tracking-wider">
                          {ev.badge}
                        </span>
                        {ev.highlight && (
                          <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white text-[10px] font-bold uppercase tracking-wider shadow-2xs">
                            {lang === 'ID' ? '★ Acara Utama' : '★ Main Event'}
                          </span>
                        )}
                      </div>
                      <EventCrestIcon
                        eventType={eventType}
                        className="w-5 h-5 text-[#C5A059] shrink-0"
                      />
                    </div>

                    <h3 className="font-editorial text-xl sm:text-2xl font-bold text-stone-900 mb-1">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-stone-500 mb-4 sm:mb-5 min-h-[2rem]">
                      {ev.subtitle}
                    </p>

                    <div className="space-y-3 text-xs sm:text-sm border-t border-stone-200/70 pt-4 mb-5 sm:mb-6">
                      <div className="flex items-start gap-2.5">
                        <Calendar className="w-4 h-4 text-[#B68D40] shrink-0 mt-0.5" />
                        <span className="font-bold text-stone-800">{ev.date}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-[#B68D40] shrink-0 mt-0.5" />
                        <span className="text-stone-700 font-medium">{ev.time}</span>
                      </div>
                      <div className="flex items-start gap-2.5">
                        <MapPin className="w-4 h-4 text-[#B68D40] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-stone-800">{ev.venue}</p>
                          <p className="text-xs text-stone-500 mt-0.5">{ev.address}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {(hasDresscode || hasMapsUrl) && (
                    <div className="space-y-3 pt-3 border-t border-stone-200/70 mt-auto relative z-10">
                      {hasDresscode && (
                        <div className="text-[11px] text-stone-500 break-words">
                          <span className="font-bold text-[#8B6914]">Dresscode:</span>{' '}
                          {ev.dresscode}
                        </div>
                      )}
                      {hasMapsUrl && (
                        <a
                          href={ev.mapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() =>
                            emitAnalytics(
                              'CLICK_MAPS',
                              `Membuka lokasi Google Maps: ${ev.title} (${ev.venue})`
                            )
                          }
                          className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        >
                          <img
                            src={MEPLANNER_ICONS.btnGoogleMaps}
                            alt=""
                            className="w-5 h-5 shrink-0"
                          />
                          <span>
                            {lang === 'ID' ? 'Buka Google Maps' : 'Open Google Maps'}
                          </span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* LIVE STREAMING ACARA CARD (WHEN ENABLED IN SETTINGS) */}
          {Boolean(settings.showLiveStreaming && settings.liveStreamingUrl?.trim()) && (
            <div className="mt-6 sm:mt-8 max-w-3xl mx-auto">
              <div
                className={`inv-reveal inv-reveal-up relative overflow-hidden rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl ${
                  layoutArchetype === 'NUSANTARA_HERITAGE'
                    ? 'bg-[#FFFDF9]/95 border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30 shadow-[0_18px_50px_rgba(175,145,95,0.16)]'
                    : 'bg-gradient-to-r from-white/95 via-[#FFFDF9]/95 to-[#FAF3E3]/85 border border-[#D4AF37]/50 shadow-[0_16px_45px_rgba(175,145,95,0.14)]'
                }`}
              >
                <div className="space-y-1.5 text-left min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                      <span>
                        {settings.liveStreamingPlatform?.trim() ||
                          'YouTube / Zoom Live'}
                      </span>
                    </span>
                    <span className="text-[11px] font-bold text-[#8B6914]">
                      {lang === 'ID' ? 'Siaran Langsung' : 'Live Broadcast'}
                    </span>
                  </div>
                  <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-900">
                    {settings.liveStreamingLabel?.trim() ||
                      (lang === 'ID'
                        ? '🎥 Live Streaming Acara'
                        : '🎥 Live Event Streaming')}
                  </h3>
                  <p className="text-xs text-stone-600 leading-relaxed">
                    {lang === 'ID'
                      ? 'Bagi Bapak/Ibu/Saudara/i yang berhalangan hadir secara langsung, silakan menyaksikan momen bahagia kami secara virtual melalui tautan resmi berikut.'
                      : 'For family and friends who are unable to attend in person, please join and witness our joyful moment virtually via the official stream link.'}
                  </p>
                </div>

                <a
                  href={settings.liveStreamingUrl?.trim()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto shrink-0 py-3 px-5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <img
                    src={MEPLANNER_ICONS.floatLivestream}
                    alt=""
                    className="w-5 h-5 shrink-0"
                  />
                  <span>
                    {lang === 'ID'
                      ? 'Tonton Live Streaming ↗'
                      : 'Watch Live Stream ↗'}
                  </span>
                </a>
              </div>
            </div>
          )}
        </section>
        </>
      )}

      {/* SECTION: LOVE STORY & GALERI PREWEDDING (CONDITIONAL & SYMMETRICAL) */}
      {(showLoveStory || showGallery) && (
        <>
          <WebkitSectionDivider src={webkitBundle.sectionDividerSvg} />
          <section id="galeri" className="relative z-10 py-10 sm:py-16 px-3 sm:px-4 max-w-5xl mx-auto">
          <EditorialSectionHeader
            badge={lang === 'ID' ? 'Momen Berharga' : 'Precious Moments'}
            title={
              settings.showLoveStorySection && settings.showGallerySection
                ? `${storyTitle} & ${
                    settings.gallerySectionTitle?.trim() ||
                    (lang === 'ID' ? 'Galeri' : 'Gallery')
                  }`
                : settings.showLoveStorySection
                ? storyTitle
                : settings.gallerySectionTitle?.trim() ||
                  (lang === 'ID' ? 'Galeri Momen' : 'Photo Gallery')
            }
            archetype={layoutArchetype}
          />

          {/* Love Story Timeline Cards with Connected Vertical Golden Timeline */}
          {showLoveStory &&
            (effectiveLoveStory.length > 0 ? (
              <div className="mb-8 sm:mb-10 space-y-4">
                <div className="relative">
                  {/* Decorative Vertical Golden Timeline Connector Line */}
                  <div
                    aria-hidden="true"
                    className="hidden md:block absolute left-1/2 top-4 bottom-4 w-px bg-gradient-to-b from-transparent via-[#D4AF37]/60 to-transparent -translate-x-1/2 pointer-events-none"
                  />
                  <div
                    className={`grid grid-cols-1 gap-4 sm:gap-5 items-stretch ${
                      effectiveLoveStory.length === 1
                        ? 'max-w-lg mx-auto'
                        : effectiveLoveStory.length === 3
                        ? 'md:grid-cols-3'
                        : 'sm:grid-cols-2'
                    }`}
                  >
                    {effectiveLoveStory.map((story, i) => (
                      <div
                        key={story.id || i}
                        className={`inv-reveal ${
                          i % 2 === 0 ? 'inv-reveal-left' : 'inv-reveal-right'
                        } relative h-full min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl p-5 sm:p-6 shadow-[0_14px_40px_rgba(175,145,95,0.10)] flex flex-col justify-between ${
                          layoutArchetype === 'NUSANTARA_HERITAGE'
                            ? 'border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30'
                            : 'border border-white/95'
                        }`}
                      >
                        <FloralCornerOrnament
                          position="bottom-right"
                          size="sm"
                          enabled={showFloral}
                        />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between gap-2 mb-2.5">
                            <div className="inline-flex items-center gap-1.5">
                              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-[#C5A059] to-[#9A742B] text-white text-[10px] font-extrabold flex items-center justify-center shadow-2xs">
                                {String(i + 1).padStart(2, '0')}
                              </span>
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A742B] bg-[#FAF3E3] px-3 py-0.5 rounded-full border border-[#D4AF37]/35">
                                {story.dateLabel}
                              </span>
                            </div>
                            <span className="w-7 h-7 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 flex items-center justify-center text-[#C5A059]">
                              <Heart className="w-3.5 h-3.5 fill-[#C5A059]/25" />
                            </span>
                          </div>
                          <h3 className="font-editorial text-lg font-bold text-stone-900 mb-1.5">
                            {story.title}
                          </h3>
                          <p className="text-xs text-stone-600 leading-relaxed">
                            {story.description}
                          </p>
                        </div>
                        {story.location && (
                          <div className="pt-3 mt-4 border-t border-stone-200/60 text-[11px] text-stone-500 flex items-center gap-1.5 relative z-10">
                            <MapPin className="w-3 h-3 text-[#B68D40]" />
                            <span>{story.location}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="inv-reveal inv-reveal-up max-w-xl mx-auto mb-8 sm:mb-10 rounded-3xl bg-white/85 backdrop-blur-xl border border-[#D4AF37]/35 p-6 text-center shadow-[0_14px_40px_rgba(175,145,95,0.10)]">
                <Heart className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                <p className="font-editorial font-bold text-stone-800 text-base">
                  {storyTitle}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {lang === 'ID'
                    ? 'Belum ada momen perjalanan yang ditambahkan.'
                    : 'No story moments have been added yet.'}
                </p>
              </div>
            ))}

          {showLoveStory && showGallery && (
            <WebkitSectionDivider
              src={webkitBundle.sectionDividerSvg}
              className="mb-4"
            />
          )}

          {/* Smooth Auto-Sliding Photo Gallery Carousel + Interactive Thumbnail Strip */}
          {showGallery &&
            (effectiveGalleryPhotos.length > 0 ? (
              <div
                className={`inv-reveal inv-reveal-up rounded-[2rem] bg-white/85 backdrop-blur-2xl p-3 sm:p-5 shadow-[0_24px_65px_rgba(160,130,85,0.16)] space-y-3.5 ${
                  layoutArchetype === 'NUSANTARA_HERITAGE'
                    ? 'border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30'
                    : 'border border-white/95'
                }`}
                onMouseEnter={() => setIsGalleryHovered(true)}
                onMouseLeave={() => setIsGalleryHovered(false)}
              >
                <div
                  className="group/stage relative w-full aspect-[16/9] rounded-2xl sm:rounded-3xl overflow-hidden border border-[#D4AF37]/35 bg-[#FAF8F5] shadow-[0_18px_50px_rgba(160,130,85,0.16)] select-none"
                  onTouchStart={(e) => {
                    setTouchStartX(e.touches[0]?.clientX ?? null);
                  }}
                  onTouchEnd={(e) => {
                    if (touchStartX === null || effectiveGalleryPhotos.length <= 1) return;
                    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
                    const diff = touchStartX - endX;
                    if (Math.abs(diff) > 40) {
                      if (diff > 0) {
                        setActiveGalleryIdx(
                          (prev) => (prev + 1) % effectiveGalleryPhotos.length
                        );
                      } else {
                        setActiveGalleryIdx(
                          (prev) =>
                            (prev - 1 + effectiveGalleryPhotos.length) %
                            effectiveGalleryPhotos.length
                        );
                      }
                    }
                    setTouchStartX(null);
                  }}
                >
                  {/* Adaptive Transition Stage: CROSSFADE / ZOOM_DISSOLVE / SMOOTH_SLIDE */}
                  <div
                    className={
                      galleryTransitionStyle === 'SMOOTH_SLIDE'
                        ? 'flex w-full h-full transition-transform will-change-transform'
                        : 'relative w-full h-full'
                    }
                    style={
                      galleryTransitionStyle === 'SMOOTH_SLIDE'
                        ? {
                            transform: `translate3d(-${safeGalleryIdx * 100}%, 0, 0)`,
                            transitionDuration: `${galleryTransitionMs}ms`,
                            transitionTimingFunction: 'cubic-bezier(0.22, 1, 0.36, 1)',
                          }
                        : undefined
                    }
                  >
                    {effectiveGalleryPhotos.map((photo, idx) => {
                      const isSlideActive = idx === safeGalleryIdx;
                      const slideFitMode = photo.adjustment?.fitMode;
                      const isContainMode = slideFitMode === 'contain';
                      const adjustStyle = getPhotoAdjustStyle(photo.adjustment);
                      return (
                        <div
                          key={photo.id || idx}
                          onClick={() => setSelectedPhoto(photo)}
                          style={
                            galleryTransitionStyle !== 'SMOOTH_SLIDE'
                              ? {
                                  transitionDuration: `${galleryTransitionMs}ms`,
                                  transitionTimingFunction:
                                    'cubic-bezier(0.22, 1, 0.36, 1)',
                                }
                              : undefined
                          }
                          className={
                            galleryTransitionStyle === 'SMOOTH_SLIDE'
                              ? 'relative w-full h-full shrink-0 overflow-hidden cursor-pointer group bg-[#FAF8F5]'
                              : `absolute inset-0 w-full h-full overflow-hidden cursor-pointer group bg-[#FAF8F5] transition-all will-change-[opacity,transform,filter] ${
                                  isSlideActive
                                    ? 'opacity-100 scale-100 blur-0 z-10 pointer-events-auto'
                                    : galleryTransitionStyle === 'ZOOM_DISSOLVE'
                                    ? 'opacity-0 scale-105 blur-xs z-0 pointer-events-none'
                                    : 'opacity-0 scale-[1.02] z-0 pointer-events-none'
                                }`
                          }
                        >
                          {/* Ultra-Smooth Ambient Blurred Backdrop */}
                          <img
                            src={photo.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover object-center blur-3xl scale-125 opacity-60 transition-all duration-1000 pointer-events-none"
                          />
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className={`relative z-10 w-full h-full transition-transform duration-1000 ease-out ${
                              isContainMode
                                ? 'object-contain object-center'
                                : `object-cover ${isSlideActive ? 'animate-ken-burns' : ''}`
                            }`}
                            style={
                              isContainMode
                                ? {
                                    ...adjustStyle,
                                    WebkitMaskImage:
                                      'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                                    maskImage:
                                      'linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)',
                                  }
                                : {
                                    objectPosition: '50% 25%',
                                    ...adjustStyle,
                                  }
                            }
                          />
                          {/* Soft Light Bottom Veil for Caption Legibility */}
                          <div className="absolute inset-x-0 bottom-0 h-32 z-10 bg-gradient-to-t from-[#FFFDF9]/92 via-[#FFFDF9]/45 to-transparent pointer-events-none" />

                          {/* Top Category Pill */}
                          {photo.category && photo.category.trim() !== '' && (
                            <div className="absolute top-3.5 sm:top-5 left-3.5 sm:left-5 z-20 flex items-center gap-2 pointer-events-none">
                              <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/45 text-[#8B6914] text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-2xs">
                                {photo.category}
                              </span>
                            </div>
                          )}

                          {/* Photo Title & Caption Centered Above the Bottom Dots */}
                          <div
                            className={`absolute bottom-11 sm:bottom-14 left-4 sm:left-8 right-4 sm:right-8 z-20 text-center text-stone-900 pointer-events-none transition-all duration-700 ${
                              isSlideActive
                                ? 'opacity-100 translate-y-0'
                                : 'opacity-0 translate-y-2'
                            }`}
                          >
                            <h3 className="font-editorial text-base sm:text-2xl font-bold drop-shadow-[0_1px_8px_rgba(255,255,255,0.95)] truncate">
                              {photo.title}
                            </h3>
                            {photo.caption && (
                              <p className="text-[11px] sm:text-sm text-stone-700 font-medium mt-0.5 line-clamp-1 drop-shadow-[0_1px_6px_rgba(255,255,255,0.95)]">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Subtle Translucent Timing Pill on Hover */}
                  <div className="absolute top-3.5 sm:top-5 right-3.5 sm:right-5 z-20 pointer-events-none opacity-0 group-hover/stage:opacity-100 transition-opacity duration-500">
                    <span
                      title={
                        lang === 'ID'
                          ? `Transisi halus ${(galleryTransitionMs / 1000).toFixed(1)} detik • Auto-slide ${gallerySlideSeconds > 0 ? `${gallerySlideSeconds} detik` : 'Manual'}`
                          : `Smooth ${(galleryTransitionMs / 1000).toFixed(1)}s transition • Auto-slide ${gallerySlideSeconds > 0 ? `${gallerySlideSeconds}s` : 'Manual'}`
                      }
                      className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-semibold tracking-wide shadow-2xs"
                    >
                      {(galleryTransitionMs / 1000).toFixed(1)}s &bull;{' '}
                      {gallerySlideSeconds > 0 ? `${gallerySlideSeconds}s` : 'Manual'}
                    </span>
                  </div>

                  {/* Centered Small Dots Overlaid on Bottom of Photo */}
                  <div
                    className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-[#D4AF37]/40 shadow-md"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {effectiveGalleryPhotos.map((photo, idx) => {
                      const isActive = idx === safeGalleryIdx;
                      return (
                        <button
                          key={photo.id || idx}
                          type="button"
                          aria-label={`Pilih foto ${idx + 1}: ${photo.title}`}
                          onClick={() => setActiveGalleryIdx(idx)}
                          title={photo.title}
                          className={`rounded-full transition-all duration-500 cursor-pointer focus:outline-none ${
                            isActive
                              ? 'w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#D4AF37] ring-2 ring-[#FAF3E3] scale-110'
                              : 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-stone-300 hover:bg-[#C5A059] hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Thumbnail Strip Below Main Gallery Stage */}
                {effectiveGalleryPhotos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-0.5">
                    {effectiveGalleryPhotos.map((photo, idx) => {
                      const isActive = idx === safeGalleryIdx;
                      return (
                        <button
                          key={`thumb-${photo.id || idx}`}
                          type="button"
                          onClick={() => setActiveGalleryIdx(idx)}
                          onDoubleClick={() => setSelectedPhoto(photo)}
                          title={`${photo.title} (Klik untuk melihat, klik 2x untuk memperbesar)`}
                          className={`group relative aspect-[16/10] rounded-2xl overflow-hidden transition-all duration-500 ease-out ${
                            isActive
                              ? 'ring-2 ring-[#D4AF37] border-2 border-white shadow-[0_8px_22px_rgba(197,160,89,0.32)] scale-[1.02]'
                              : 'border border-white/80 opacity-75 hover:opacity-100 hover:scale-[1.01]'
                          }`}
                        >
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            style={{
                              objectPosition: '50% 25%',
                              ...getPhotoAdjustStyle(photo.adjustment),
                            }}
                          />
                          <div
                            className={`absolute inset-0 transition-opacity duration-500 ${
                              isActive
                                ? 'bg-gradient-to-t from-[#FFFDF9]/80 via-transparent to-transparent'
                                : 'bg-white/10 group-hover:bg-transparent'
                            }`}
                          />
                          <span className="absolute bottom-1 left-2 right-2 text-[10px] font-bold text-stone-900 truncate drop-shadow-[0_1px_4px_rgba(255,255,255,0.95)] text-left hidden sm:block">
                            {photo.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <div className="inv-reveal inv-reveal-up max-w-xl mx-auto rounded-3xl bg-white/85 backdrop-blur-xl border border-[#D4AF37]/35 p-6 text-center shadow-[0_14px_40px_rgba(175,145,95,0.10)]">
                <Sparkles className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                <p className="font-editorial font-bold text-stone-800 text-base">
                  {lang === 'ID' ? 'Galeri Momen Bahagia' : 'Moments of Happiness'}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {lang === 'ID'
                    ? 'Belum ada foto prewedding yang ditambahkan ke galeri.'
                    : 'No prewedding photos have been added to the gallery yet.'}
                </p>
              </div>
            ))}
        </section>
        </>
      )}

      {/* SECTION: KONFIRMASI KEHADIRAN (RSVP) & BUKU TAMU REAL-TIME (100% SYMMETRICAL EQUAL-SIZE CARDS) */}
      {settings.showRsvpSection !== false && (
        <>
          <WebkitSectionDivider src={webkitBundle.sectionDividerSvg} />
          <section id="rsvp" className="relative z-10 py-10 sm:py-16 px-3 sm:px-4 max-w-5xl mx-auto">
            <div id="ucapan" className="scroll-mt-24" />
            <EditorialSectionHeader
              badge={lang === 'ID' ? 'RSVP & Buku Tamu' : 'RSVP & Guestbook'}
              title={rsvpTitle}
              subtitle={rsvpSubtitle}
              archetype={layoutArchetype}
            />

          {/* Equal 2-Column Grid with items-stretch and fixed matched desktop height */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {/* Left Card: RSVP Form (Exact same width & height as Right Card) */}
            <form
              onSubmit={handleRsvpFormSubmit}
              className={`inv-reveal inv-reveal-left relative h-full lg:h-[600px] min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl p-5 sm:p-7 shadow-[0_18px_50px_rgba(175,145,95,0.12)] flex flex-col justify-between text-xs sm:text-sm ${
                layoutArchetype === 'NUSANTARA_HERITAGE'
                  ? 'border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30'
                  : 'border border-white/95'
              }`}
            >
              <WebkitCardFourCorners cornerSvg={webkitBundle.cardCornerSvg} />
              <div className="space-y-3.5 sm:space-y-4 relative z-10">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/80 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={MEPLANNER_ICONS.btnRsvpTicket}
                      alt=""
                      className="w-5 h-5 object-contain shrink-0"
                    />
                    <h3 className="font-editorial text-base sm:text-lg font-bold text-stone-900 truncate">
                      {lang === 'ID' ? 'Form RSVP Kehadiran' : 'RSVP Attendance Form'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGuestQrModal(true)}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-bold transition-all shrink-0 cursor-pointer"
                  >
                    <img
                      src={MEPLANNER_ICONS.floatQrCheckin}
                      alt=""
                      className="w-3.5 h-3.5 object-contain shrink-0"
                    />
                    <span>{lang === 'ID' ? 'Tiket QR Tamu' : 'Guest QR Pass'}</span>
                  </button>
                </div>

                {rsvpSubmittedSuccess && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        {lang === 'ID'
                          ? 'Terima kasih atas konfirmasi & doa restu Anda!'
                          : 'Thank you for your RSVP & warm wishes!'}
                      </p>
                      <p className="text-emerald-700 mt-0.5">
                        {lang === 'ID'
                          ? 'Data kehadiran dan ucapan Anda telah tersimpan di buku tamu.'
                          : 'Your attendance and message have been recorded in our guestbook.'}
                      </p>
                    </div>
                  </div>
                )}

                <div className="relative">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-bold text-stone-700 truncate">
                      {lang === 'ID'
                        ? 'Nama Lengkap / Gelar *'
                        : 'Full Name / Title *'}
                    </label>
                  </div>
                  <input
                    type="text"
                    required
                    value={rsvpName}
                    onChange={(e) => {
                      const val = e.target.value;
                      setRsvpName(val);
                      if (
                        selectedGuestFromSearch &&
                        val.trim().toLowerCase() !==
                          selectedGuestFromSearch.guestName.trim().toLowerCase()
                      ) {
                        setSelectedGuestFromSearch(null);
                      }
                    }}
                    placeholder={
                      lang === 'ID'
                        ? 'Contoh: Bpk. Budi Santoso'
                        : 'Example: Mr. John Doe'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {lang === 'ID' ? 'Instansi / Kerabat' : 'Institution / Relation'}
                    </label>
                    <input
                      type="text"
                      value={rsvpInstitution}
                      onChange={(e) => setRsvpInstitution(e.target.value)}
                      placeholder={
                        lang === 'ID' ? 'Keluarga / Rekan Kerja' : 'Family / Colleague'
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {lang === 'ID'
                        ? 'No. WhatsApp (Opsional)'
                        : 'WhatsApp Number (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={rsvpPhone}
                      onChange={(e) => setRsvpPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {lang === 'ID' ? 'Status Kehadiran *' : 'Attendance Status *'}
                    </label>
                    <select
                      value={rsvpStatus}
                      onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                    >
                      <option value="Hadir">
                        {lang === 'ID' ? 'Hadir' : 'Will Attend (Hadir)'}
                      </option>
                      <option value="Tidak Hadir">
                        {lang === 'ID'
                          ? 'Berhalangan Hadir'
                          : 'Unable to Attend (Berhalangan)'}
                      </option>
                      <option value="Masih Ragu">
                        {lang === 'ID' ? 'Masih Ragu' : 'Tentative (Masih Ragu)'}
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {lang === 'ID' ? 'Jumlah Orang (Pax)' : 'Number of Guests (Pax)'}
                    </label>
                    <select
                      value={Math.max(1, Number(rsvpPax) || 1)}
                      onChange={(e) => setRsvpPax(Number(e.target.value))}
                      disabled={rsvpStatus === 'Tidak Hadir'}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none disabled:opacity-50"
                    >
                      {Array.from(
                        new Set([
                          1,
                          2,
                          3,
                          4,
                          5,
                          6,
                          7,
                          8,
                          9,
                          10,
                          12,
                          15,
                          20,
                          25,
                          30,
                          Math.max(1, Number(effectiveMatchedGuest?.pax) || 1),
                          Math.max(1, Number(effectiveMatchedGuest?.confirmedPax) || 1),
                          Math.max(1, Number(rsvpPax) || 1),
                        ])
                      )
                        .filter((n) => n > 0)
                        .sort((a, b) => a - b)
                        .map((n) => (
                          <option key={n} value={n}>
                            {n} {lang === 'ID' ? 'Orang' : 'Pax'}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <label className="block text-xs font-bold text-stone-700 truncate">
                      {lang === 'ID' ? 'Sesi Kehadiran' : 'Event Session'}
                    </label>
                    <span className="inline-flex items-center gap-1 shrink-0">
                      <span
                        title={`Opsi kehadiran otomatis mengikuti ${visibleEvents.length} jadwal acara aktif di database`}
                        className="text-[10px] font-semibold text-[#9A742B] whitespace-nowrap truncate shrink-0"
                      >
                        {lang === 'ID'
                          ? `${visibleEvents.length} Sesi`
                          : `${visibleEvents.length} Sessions`}
                      </span>
                      <InfoTooltip
                        text={
                          lang === 'ID'
                            ? `Pilihan sesi kehadiran otomatis mengikuti ${visibleEvents.length} jadwal acara aktif.`
                            : `Attendance session options automatically follow the ${visibleEvents.length} active schedule events.`
                        }
                      />
                    </span>
                  </div>
                  <select
                    value={rsvpSession}
                    onChange={(e) =>
                      setRsvpSession(e.target.value as WeddingGuest['sessionChoice'])
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                  >
                    {sessionOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    {rsvpMessageLabel}
                  </label>
                  <textarea
                    rows={3}
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    placeholder={
                      lang === 'ID'
                        ? 'Tuliskan doa restu dan harapan terbaik Anda...'
                        : 'Write your heartfelt wishes and prayers...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 mt-auto relative z-10">
                <button
                  type="submit"
                  disabled={isSubmittingRsvp || Boolean(settings.disableRsvpSubmission)}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <img
                    src={MEPLANNER_ICONS.btnRsvpTicket}
                    alt=""
                    className="w-5 h-5 shrink-0"
                  />
                  <span className="truncate">
                    {settings.disableRsvpSubmission
                      ? lang === 'ID'
                        ? 'Konfirmasi RSVP Telah Ditutup'
                        : 'RSVP Submission Closed'
                      : isSubmittingRsvp
                      ? lang === 'ID'
                        ? 'Menyimpan Konfirmasi...'
                        : 'Submitting RSVP...'
                      : lang === 'ID'
                      ? 'Kirim Konfirmasi & Ucapan'
                      : 'Send RSVP & Wishes'}
                  </span>
                </button>
              </div>
            </form>

            {/* Right Card: Live Guestbook Wishes Feed (Exact same width & height as Left Card) */}
            <div
              className={`inv-reveal inv-reveal-right relative h-full lg:h-[600px] min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl p-5 sm:p-7 shadow-[0_18px_50px_rgba(175,145,95,0.12)] flex flex-col justify-between ${
                layoutArchetype === 'NUSANTARA_HERITAGE'
                  ? 'border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30'
                  : 'border border-white/95'
              }`}
            >
              <WebkitCardFourCorners cornerSvg={webkitBundle.cardCornerSvg} />
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-200/80 shrink-0 flex-wrap relative z-10">
                <div className="flex items-center gap-2.5 min-w-0">
                  <img
                    src={MEPLANNER_ICONS.navUcapanWishes}
                    alt=""
                    className="w-5 h-5 object-contain shrink-0"
                  />
                  <h3 className="font-editorial text-base sm:text-lg font-bold text-stone-900 truncate">
                    {wishesTitle} ({publicVisibleWishes.length})
                  </h3>
                </div>
                <span className="text-[11px] text-[#9A742B] font-semibold shrink-0">
                  Real-Time Feed
                </span>
              </div>

              {/* Search Bar in Buku Tamu & Doa Restu Card */}
              <div className="mb-3 relative shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#B68D40] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={coverGuestSearch}
                    onChange={(e) => {
                      setCoverGuestSearch(e.target.value);
                    }}
                    placeholder={
                      lang === 'ID'
                        ? `Cari nama tamu atau ucapan di Buku Tamu...`
                        : `Search guest name or wishes in Guestbook...`
                    }
                    className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/40 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:border-[#8B6914]"
                  />
                  {coverGuestSearch && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverGuestSearch('');
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                      title="Reset pencarian"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex-1 max-h-[380px] lg:max-h-none overflow-y-auto space-y-3 pr-1">
                {filteredPublicWishes.length === 0 ? (
                  <div className="h-full min-h-[240px] sm:min-h-[280px] rounded-2xl border border-dashed border-[#D4AF37]/40 bg-[#FAF8F5]/80 p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 flex items-center justify-center text-[#B68D40] mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-stone-800 mb-1">
                      {coverGuestSearch.trim()
                        ? lang === 'ID'
                          ? 'Ucapan Tidak Ditemukan'
                          : 'No Matching Wishes Found'
                        : lang === 'ID'
                        ? 'Belum Ada Ucapan & Doa'
                        : 'No Wishes Yet'}
                    </h4>
                    <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                      {coverGuestSearch.trim()
                        ? lang === 'ID'
                          ? `Tidak ada ucapan untuk pencarian "${coverGuestSearch}". Silakan pilih nama Anda dari daftar untuk mengisi form RSVP.`
                          : `No wishes matched "${coverGuestSearch}". Select your name from the suggestions to fill the RSVP form.`
                        : lang === 'ID'
                        ? 'Jadilah yang pertama menuliskan ucapan selamat dan doa restu untuk kedua mempelai melalui formulir di samping.'
                        : 'Be the first to share your warm wishes and blessings for the couple using the form.'}
                    </p>
                  </div>
                ) : (
                  filteredPublicWishes.map((w) => (
                    <div
                      key={w.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                        w.isPinned
                          ? 'bg-[#FAF6EE] border-[#D4AF37]/50'
                          : 'bg-white/90 border-stone-200/80'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-xs sm:text-sm text-stone-900 break-words">
                              {w.guestName}
                            </h4>
                            {w.isPinned && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40 text-[10px] font-bold">
                                <Pin className="w-2.5 h-2.5" />{' '}
                                {lang === 'ID' ? 'Disematkan' : 'Pinned'}
                              </span>
                            )}
                          </div>
                          {w.institution && (
                            <p className="text-[11px] text-[#9A742B] font-medium truncate">
                              {w.institution}
                            </p>
                          )}
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                            w.rsvpStatus === 'Hadir'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : w.rsvpStatus === 'Tidak Hadir'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {w.rsvpStatus}{' '}
                          {w.rsvpStatus === 'Hadir' ? `(${w.pax} Pax)` : ''}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-stone-700 leading-relaxed break-words">
                        &ldquo;{w.message}&rdquo;
                      </p>

                      {w.replyFromCouple && (
                        <div className="mt-3 pl-3 border-l-2 border-[#D4AF37] bg-[#FAF8F5] p-2.5 rounded-r-xl text-xs text-stone-600">
                          <span className="font-bold text-[#8B6914] block mb-0.5">
                            {lang === 'ID' ? 'Balasan Mempelai:' : "Couple's Reply:"}
                          </span>
                          {w.replyFromCouple}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-stone-200/80 flex items-center justify-between gap-2 text-[11px] text-stone-500 shrink-0">
                <span className="truncate">
                  {lang === 'ID'
                    ? 'Tersinkronisasi otomatis ke Dashboard'
                    : 'Automatically synced to Dashboard'}
                </span>
                <span className="font-semibold text-[#9A742B] shrink-0">
                  {filteredPublicWishes.length}{' '}
                  {lang === 'ID' ? 'Doa Restu' : 'Wishes'}
                </span>
              </div>
            </div>
          </div>
        </section>
        </>
      )}

      {/* SECTION: AMPLOP DIGITAL & TANDA KASIH (LUXURY PEARL & CHAMPAGNE GOLD LIGHT CARDS) */}
      {settings.showGiftSection !== false && (
        <>
          <WebkitSectionDivider src={webkitBundle.sectionDividerSvg} />
          <section id="gift" className="relative z-10 py-10 sm:py-16 px-3 sm:px-4 max-w-5xl mx-auto">
            <div id="amplop" className="scroll-mt-20" />
            <div
              className={`inv-reveal inv-reveal-up relative min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl p-5 sm:p-8 text-center shadow-[0_18px_50px_rgba(175,145,95,0.12)] ${
                layoutArchetype === 'NUSANTARA_HERITAGE'
                  ? 'border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30'
                  : 'border border-white/95'
              }`}
            >
              <WebkitCardFourCorners cornerSvg={webkitBundle.cardCornerSvg} />
              <FloralCornerOrnament position="top-left" size="sm" enabled={showFloral} />
              <FloralCornerOrnament position="top-right" size="sm" enabled={showFloral} />

              {layoutArchetype === 'NUSANTARA_HERITAGE' && (
                <NusantaraCarvingOrnament position="top" className="mb-3" />
              )}

              <div className="w-12 h-12 rounded-2xl bg-[#FAF3E3] border border-[#D4AF37]/45 flex items-center justify-center mx-auto mb-3 text-[#9A742B] relative z-10 shadow-2xs">
                <img
                  src={MEPLANNER_ICONS.btnKirimHadiah}
                  alt=""
                  className="w-7 h-7 object-contain"
                />
              </div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold relative z-10">
              Wedding Gift
            </span>
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-stone-900 mt-1 mb-2 relative z-10">
              {settings.giftSectionTitle?.trim() ||
                (lang === 'ID'
                  ? 'Amplop Digital & Tanda Kasih'
                  : 'Digital Envelope & Wedding Gift')}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto mb-5 leading-relaxed relative z-10">
              {settings.giftSectionSubtitle?.trim() ||
                (lang === 'ID'
                  ? 'Doa restu Anda merupakan karunia terindah bagi kami. Namun apabila Bapak/Ibu/Saudara/i berkenan memberikan tanda kasih secara digital, kripto, atau pengiriman kado, dapat melalui informasi resmi berikut:'
                  : 'Your prayers and blessings are the greatest gift to us. However, if you wish to send a digital gift, crypto transfer, or wedding present, you may use the official channels below:')}
            </p>

            {/* Segmented Gift Category Filter Tabs (Semua | Rekening Bank | QRIS | Global & Crypto | Wishlist Kado) */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35 max-w-2xl mx-auto mb-6 relative z-10 shadow-2xs">
              {[
                {
                  id: 'ALL' as const,
                  label: lang === 'ID' ? 'Semua' : 'All Methods',
                },
                {
                  id: 'BANK' as const,
                  label: lang === 'ID' ? '🏦 Rekening Bank' : '🏦 Bank Transfer',
                },
                {
                  id: 'QRIS' as const,
                  label: '📱 QRIS',
                },
                {
                  id: 'GLOBAL_CRYPTO' as const,
                  label: lang === 'ID' ? '🌐 Global & Crypto' : '🌐 Global & Crypto',
                },
                ...(Array.isArray(settings.giftWishlistItems) &&
                settings.giftWishlistItems.length > 0
                  ? [
                      {
                        id: 'WISHLIST' as const,
                        label:
                          lang === 'ID' ? '🎁 Wishlist Kado' : '🎁 Gift Registry',
                      },
                    ]
                  : []),
              ].map((tab) => {
                const isSelected = giftCategoryFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setGiftCategoryFilter(tab.id)}
                    className={`px-3 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] text-white shadow-sm'
                        : 'bg-white/80 hover:bg-[#FAF3E3] text-stone-700 hover:text-[#8B6914] border border-stone-200/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {giftCategoryFilter !== 'QRIS' &&
              giftCategoryFilter !== 'WISHLIST' &&
              settings.bankAccounts.length > 0 && (
              <div
                className={`grid grid-cols-1 gap-4 mb-6 text-left items-stretch relative z-10 ${
                  settings.bankAccounts.length === 1
                    ? 'max-w-md mx-auto'
                    : settings.bankAccounts.length === 2
                    ? 'md:grid-cols-2 max-w-3xl mx-auto'
                    : 'md:grid-cols-3'
                }`}
              >
                {(settings.bankAccounts.filter((acc) => {
                  const accType = acc.type || 'BANK';
                  if (giftCategoryFilter === 'BANK') {
                    return accType === 'BANK' || accType === 'EWALLET';
                  }
                  if (giftCategoryFilter === 'GLOBAL_CRYPTO') {
                    return (
                      accType === 'CRYPTO' ||
                      accType === 'PAYPAL' ||
                      accType === 'EWALLET'
                    );
                  }
                  return true;
                }).length > 0
                  ? settings.bankAccounts.filter((acc) => {
                      const accType = acc.type || 'BANK';
                      if (giftCategoryFilter === 'BANK') {
                        return accType === 'BANK' || accType === 'EWALLET';
                      }
                      if (giftCategoryFilter === 'GLOBAL_CRYPTO') {
                        return (
                          accType === 'CRYPTO' ||
                          accType === 'PAYPAL' ||
                          accType === 'EWALLET'
                        );
                      }
                      return true;
                    })
                  : settings.bankAccounts
                ).map((acc) => {
                  const isCopied = copiedAccountId === acc.id;
                  const accType = acc.type || 'BANK';
                  const isCrypto = accType === 'CRYPTO';
                  const isPaypal = accType === 'PAYPAL';
                  const isEwallet = accType === 'EWALLET';

                  const rawPaypalCandidate =
                    acc.branchOrNote &&
                    /^(https?:\/\/|paypal\.me\/)/i.test(acc.branchOrNote.trim())
                      ? acc.branchOrNote.trim()
                      : acc.accountNumber &&
                        /^(https?:\/\/|paypal\.me\/)/i.test(acc.accountNumber.trim())
                      ? acc.accountNumber.trim()
                      : '';
                  const paypalDirectUrl = rawPaypalCandidate
                    ? /^https?:\/\//i.test(rawPaypalCandidate)
                      ? rawPaypalCandidate
                      : `https://${rawPaypalCandidate}`
                    : '';

                  return (
                    <div
                      key={acc.id}
                      className="inv-reveal inv-reveal-zoom relative h-full min-w-0 overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E3] to-[#F3E5C8] border border-[#D4AF37]/50 text-stone-900 shadow-lg transition-all"
                    >
                      <WebkitCardFourCorners
                        cornerSvg={webkitBundle.cardCornerSvg}
                        size="sm"
                      />
                      {/* Subtle Metallic Card Watermark Circle */}
                      <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -right-8 -top-8 w-28 h-28 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-transparent blur-md"
                      />

                      <div className="relative z-10">
                        <div className="flex items-center justify-between gap-1.5 flex-wrap mb-2.5">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                              isCrypto
                                ? 'bg-amber-100/80 text-amber-900 border-amber-300'
                                : isPaypal
                                ? 'bg-sky-100/80 text-sky-900 border-sky-300'
                                : isEwallet
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : 'bg-[#FAF3E3] text-[#8B6914] border-[#D4AF37]/40'
                            }`}
                          >
                            {isCrypto
                              ? 'CRYPTO WALLET'
                              : isPaypal
                              ? 'PAYPAL'
                              : isEwallet
                              ? 'E-WALLET'
                              : 'TRANSFER BANK'}
                          </span>

                          {isCrypto && (
                            <span className="px-2 py-0.5 rounded-md bg-white border border-amber-300/80 text-[10px] font-mono font-bold text-amber-900">
                              {acc.cryptoNetwork ||
                                acc.branchOrNote ||
                                'USDT • TRC20 / BEP20 / ERC20'}
                            </span>
                          )}
                        </div>

                        {/* Luxury Metallic VIP Card Row: Official ATM Chip SVG + Bank/Issuer Name */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <img
                            src={MEPLANNER_ICONS.badgeChipAtm}
                            alt=""
                            className="w-10 h-8 object-contain shrink-0 drop-shadow-2xs"
                          />
                          <span className="font-editorial text-xs sm:text-sm font-extrabold uppercase tracking-wider text-[#8B6914] text-right">
                            {acc.bankName || (isPaypal ? 'PayPal' : 'Bank')}
                          </span>
                        </div>

                        {isCrypto ? (
                          <div className="rounded-xl bg-white/90 border border-amber-200/90 px-3 py-2 mb-1.5">
                            <p className="font-mono text-xs sm:text-sm font-bold text-stone-900 break-all leading-snug">
                              {acc.accountNumber}
                            </p>
                          </div>
                        ) : (
                          <p className="font-mono text-base sm:text-lg font-extrabold text-stone-900 tracking-[0.12em] drop-shadow-[0_1px_0_rgba(255,255,255,0.95)] mb-1 break-all">
                            {acc.accountNumber}
                          </p>
                        )}

                        {acc.accountHolder && (
                          <p className="text-xs font-bold uppercase tracking-wider text-stone-700">
                            {isCrypto ? acc.accountHolder : `a.n. ${acc.accountHolder}`}
                          </p>
                        )}

                        {!isCrypto && acc.branchOrNote && (
                          <p className="text-[11px] text-stone-600 mt-0.5 break-words">
                            {acc.branchOrNote}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 space-y-2 relative z-10">
                        <button
                          type="button"
                          onClick={() => handleCopyAccount(acc.id, acc.accountNumber)}
                          className={`w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                            isCopied
                              ? 'bg-emerald-600 text-white'
                              : 'bg-white hover:bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40'
                          }`}
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">
                                {isCrypto
                                  ? lang === 'ID'
                                    ? 'Alamat Wallet Tersalin'
                                    : 'Wallet Copied!'
                                  : lang === 'ID'
                                  ? 'Nomor Disalin!'
                                  : 'Copied!'}
                              </span>
                            </>
                          ) : (
                            <>
                              <img
                                src={MEPLANNER_ICONS.btnCopyRekening}
                                alt=""
                                className="w-4 h-4 shrink-0"
                              />
                              <span className="truncate">
                                {isCrypto
                                  ? lang === 'ID'
                                    ? 'Salin Alamat Wallet Crypto'
                                    : 'Copy Crypto Wallet Address'
                                  : isPaypal
                                  ? lang === 'ID'
                                    ? 'Salin Akun PayPal'
                                    : 'Copy PayPal Account'
                                  : isEwallet
                                  ? lang === 'ID'
                                    ? 'Salin Nomor E-Wallet'
                                    : 'Copy E-Wallet Number'
                                  : lang === 'ID'
                                  ? 'Salin No. Rekening'
                                  : 'Copy Account Number'}
                              </span>
                            </>
                          )}
                        </button>

                        {isPaypal && paypalDirectUrl && (
                          <a
                            href={paypalDirectUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2 px-3 rounded-xl bg-[#0070BA] hover:bg-[#005ea6] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                          >
                            <span className="truncate">
                              {lang === 'ID' ? 'Buka PayPal.Me' : 'Open PayPal.Me'}
                            </span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* QRIS & Physical Gift Card Section */}
            {(settings.showQrisButton !== false ||
              (settings.showPhysicalGiftAddress !== false &&
                Boolean(settings.giftShippingAddress?.trim()))) && (
              <div className="pt-4 border-t border-stone-200/80 space-y-4">
                {settings.showQrisButton !== false && (
                  <div className="flex justify-center">
                    <button
                      type="button"
                      onClick={() => {
                        emitAnalytics(
                          'CLICK_QRIS',
                          'Membuka tampilan Barcode QRIS Amplop Digital'
                        );
                        setShowQrisModal(true);
                      }}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] text-xs font-bold transition-all cursor-pointer"
                    >
                      <img
                        src={MEPLANNER_ICONS.badgeChipAtm}
                        alt=""
                        className="w-5 h-4 object-contain shrink-0"
                      />
                      <QrCode className="w-4 h-4 shrink-0" />
                      <span>
                        {lang === 'ID'
                          ? 'Tampilkan Barcode QRIS'
                          : 'Show QRIS Barcode'}
                      </span>
                    </button>
                  </div>
                )}

                {settings.showPhysicalGiftAddress !== false &&
                  Boolean(settings.giftShippingAddress?.trim()) && (
                    <div className="max-w-2xl mx-auto min-w-0 overflow-hidden rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35 p-4 sm:p-5 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                            <img
                              src={MEPLANNER_ICONS.badgeKadoFisik}
                              alt=""
                              className="w-4 h-4 object-contain shrink-0"
                            />
                            <span>
                              {lang === 'ID'
                                ? 'KIRIM KADO / BINGKISAN FISIK'
                                : 'PHYSICAL WEDDING GIFT ADDRESS'}
                            </span>
                          </span>
                          {settings.giftRecipientName && (
                            <span className="text-xs font-bold text-stone-800">
                              {lang === 'ID' ? 'Penerima:' : 'Recipient:'}{' '}
                              {settings.giftRecipientName}
                            </span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm font-bold text-stone-900 break-words pt-0.5">
                          {settings.giftShippingAddress}
                        </p>
                        <p className="text-[11px] text-stone-500 italic">
                          {settings.giftShippingNote?.trim() ||
                            (lang === 'ID'
                              ? 'Konfirmasi pengiriman bingkisan dapat melalui keluarga atau panitia acara.'
                              : 'Please confirm physical gift delivery with our family or wedding committee.')}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyAccount(
                            'physical-gift-address',
                            `${
                              settings.giftRecipientName
                                ? `${settings.giftRecipientName} — `
                                : ''
                            }${settings.giftShippingAddress}`
                          )
                        }
                        className={`w-full sm:w-auto shrink-0 py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all ${
                          copiedAccountId === 'physical-gift-address'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40'
                        }`}
                      >
                        {copiedAccountId === 'physical-gift-address' ? (
                          <>
                            <Check className="w-3.5 h-3.5 shrink-0" />
                            <span>
                              {lang === 'ID' ? 'Alamat Tersalin!' : 'Address Copied!'}
                            </span>
                          </>
                        ) : (
                          <>
                            <img
                              src={MEPLANNER_ICONS.btnCopyRekening}
                              alt=""
                              className="w-4 h-4 shrink-0"
                            />
                            <span>
                              {lang === 'ID'
                                ? 'Salin Alamat Kado'
                                : 'Copy Shipping Address'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
              </div>
            )}

            {/* WISHLIST KADO / GIFT REGISTRY CARDS (WHEN CONFIGURED) */}
            {(giftCategoryFilter === 'ALL' || giftCategoryFilter === 'WISHLIST') &&
              Array.isArray(settings.giftWishlistItems) &&
              settings.giftWishlistItems.length > 0 && (
                <div className="pt-5 mt-5 border-t border-stone-200/80 space-y-4 relative z-10 text-left">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#9A742B]">
                        <img
                          src={MEPLANNER_ICONS.badgeKadoFisik}
                          alt=""
                          className="w-4 h-4 object-contain shrink-0"
                        />
                        <span>
                          {lang === 'ID'
                            ? 'Referensi Kado Pilihan (Gift Registry)'
                            : 'Curated Gift Wishlist Registry'}
                        </span>
                      </span>
                      <h3 className="font-editorial text-base sm:text-lg font-bold text-stone-900">
                        {lang === 'ID'
                          ? 'Daftar Wishlist Kado Mempelai / Tuan Rumah'
                          : 'Host & Couple Gift Registry'}
                      </h3>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-bold">
                      {settings.giftWishlistItems.length}{' '}
                      {lang === 'ID' ? 'Item Kado' : 'Wishlist Items'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {settings.giftWishlistItems.map((item, wIdx) => {
                      const targetHref =
                        item.storeUrl && item.storeUrl.trim() !== ''
                          ? item.storeUrl.trim()
                          : '#rsvp';
                      const isExternalStore = /^https?:\/\//i.test(targetHref);
                      return (
                        <div
                          key={item.id || wIdx}
                          className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 flex flex-col justify-between gap-3 shadow-2xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="px-2 py-0.5 rounded-md bg-white border border-[#D4AF37]/35 text-[#8B6914] text-[10px] font-extrabold">
                                🎁 Wishlist #{wIdx + 1}
                              </span>
                              {item.reservedBy && (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold truncate">
                                  ✓ {item.reservedBy}
                                </span>
                              )}
                            </div>
                            <p className="font-editorial text-sm sm:text-base font-bold text-stone-900 pt-1 break-words">
                              {item.itemName}
                            </p>
                            {item.priceEstimate && (
                              <p className="text-xs font-semibold text-[#9A742B]">
                                {item.priceEstimate}
                              </p>
                            )}
                          </div>

                          <a
                            href={targetHref}
                            target={isExternalStore ? '_blank' : undefined}
                            rel={
                              isExternalStore ? 'noopener noreferrer' : undefined
                            }
                            className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-all"
                          >
                            <img
                              src={MEPLANNER_ICONS.btnKirimHadiah}
                              alt=""
                              className="w-4 h-4 object-contain shrink-0"
                            />
                            <span>
                              {lang === 'ID'
                                ? 'Lihat Barang / Kirim Kado ↗'
                                : 'View Item / Send Gift ↗'}
                            </span>
                          </a>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
          </div>
        </section>
        </>
      )}

      {/* SECTION: FILTER & STORY INSTAGRAM (WHEN ENABLED IN SETTINGS) */}
      {Boolean(settings.showIgStorySection && settings.igFilterUrl?.trim()) && (
        <section className="relative z-10 py-4 sm:py-6 px-3 sm:px-4 max-w-5xl mx-auto">
          <div
            className={`inv-reveal inv-reveal-up relative overflow-hidden rounded-3xl p-5 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 backdrop-blur-xl ${
              layoutArchetype === 'NUSANTARA_HERITAGE'
                ? 'bg-[#FFFDF9]/95 border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30 shadow-[0_18px_50px_rgba(175,145,95,0.16)]'
                : 'bg-white/90 border border-[#D4AF37]/45 shadow-[0_15px_45px_rgba(175,145,95,0.12)]'
            }`}
          >
            <div className="flex items-start gap-3.5 text-left min-w-0">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#F3E5C8] border border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B] shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="space-y-1 min-w-0">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#9A742B]">
                  {lang === 'ID'
                    ? '📸 Filter & Story Instagram'
                    : '📸 Instagram Story & Filter'}
                </span>
                <h3 className="font-editorial text-lg sm:text-xl font-bold text-stone-900">
                  {lang === 'ID'
                    ? 'Bagikan Momen Kebahagiaan di Instagram Story'
                    : 'Share Our Joyful Moments on Instagram Story'}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {settings.igStoryNote?.trim() ||
                    (lang === 'ID'
                      ? 'Gunakan filter Instagram eksklusif acara kami dan tandai akun kami saat membagikan momen indah Anda.'
                      : 'Use our exclusive event Instagram filter and tag us when sharing your wonderful moments.')}
                </p>
              </div>
            </div>

            <a
              href={settings.igFilterUrl?.trim()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto shrink-0 py-3 px-5 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs inline-flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Camera className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'ID'
                  ? 'Buka Filter Instagram ↗'
                  : 'Open Instagram Filter ↗'}
              </span>
            </a>
          </div>
        </section>
      )}

      {/* WEBKIT SECTION DIVIDER */}
      <WebkitSectionDivider src={webkitBundle.sectionDividerSvg} />

      {/* CLOSING FOOTER CARD (HIGH-CONTRAST PEARL & CHAMPAGNE GOLD CARD) */}
      <footer className="relative z-10 pt-4 sm:pt-6 pb-12 sm:pb-16 px-3 sm:px-4 max-w-5xl mx-auto">
        <div
          className={`inv-reveal inv-reveal-up relative overflow-hidden rounded-3xl bg-[#FFFDF9]/96 backdrop-blur-2xl p-7 sm:p-12 md:p-14 text-center shadow-[0_18px_50px_rgba(175,145,95,0.16)] ${
            layoutArchetype === 'NUSANTARA_HERITAGE'
              ? 'border-2 border-[#C5A059]/60 outline outline-1 outline-offset-4 outline-[#C5A059]/30'
              : 'border border-white/95'
          }`}
        >
          {/* 3-Layer Stacked Cornering System on Closing Card */}
          <WebkitThreeLayerCornering
            bundle={webkitBundle}
            enabled={showCorneringOrnaments}
          />
          <FloralCornerOrnament position="top-left" enabled={showFloral} />
          <FloralCornerOrnament position="top-right" enabled={showFloral} />
          <FloralCornerOrnament position="bottom-left" enabled={showFloral} />
          <FloralCornerOrnament position="bottom-right" enabled={showFloral} />

          {layoutArchetype === 'NUSANTARA_HERITAGE' ? (
            <NusantaraCarvingOrnament position="top" className="mb-6 sm:mb-8 relative z-10" />
          ) : (
            <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-6 sm:mb-8 relative z-10" />
          )}

          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#F3E5C8] border border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B] shadow-sm mb-5 sm:mb-6 relative z-10">
            <EventCrestIcon eventType={eventType} className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>

          {closingBadge && closingBadge !== '-' && (
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#9A742B] font-bold block mb-4 sm:mb-5 relative z-10">
              {closingBadge}
            </span>
          )}

          <p className="text-xs sm:text-base text-stone-700 font-medium leading-relaxed max-w-2xl mx-auto mb-8 sm:mb-10 relative z-10">
            {settings.invitationClosingText}
          </p>

          {/* Inner Champagne Gold Couple Signature Box */}
          <div className="max-w-lg mx-auto rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-[#FAF3E3]/75 border border-[#D4AF37]/40 px-6 sm:px-10 py-6 sm:py-9 shadow-2xs relative z-10">
            <p className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#9A742B] font-bold mb-4 sm:mb-5">
              {closingSignature}
            </p>
            <p className="font-script text-3xl sm:text-5xl font-normal text-stone-900 py-2 leading-normal">
              {displayTitleShort}
            </p>
            {displayTitleFull !== displayTitleShort && (
              hasSecondProfile ? (
                <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-[#D4AF37]/30 flex flex-col items-center justify-center gap-2 sm:gap-3">
                  <span className="font-editorial text-xs sm:text-base text-stone-800 font-bold leading-snug break-words">
                    {settings.groomFullName}
                  </span>
                  <span className="block font-script text-2xl sm:text-3xl text-[#B68D40] leading-none py-0.5">
                    &amp;
                  </span>
                  <span className="font-editorial text-xs sm:text-base text-stone-800 font-bold leading-snug break-words">
                    {settings.brideFullName}
                  </span>
                </div>
              ) : (
                <p className="font-editorial text-xs sm:text-sm text-stone-700 font-semibold mt-4 pt-4 border-t border-[#D4AF37]/25">
                  {displayTitleFull}
                </p>
              )
            )}
          </div>

          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent mx-auto mt-8 sm:mt-10 mb-3.5 relative z-10" />
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#9A742B]/80 mb-2 relative z-10">
            All-in-One My Event Planner &amp; Digital Invitation
          </p>

          <div className="relative z-10">{renderDeveloperCreditBar(false)}</div>
        </div>
      </footer>

      {/* FLOATING SIDE UTILITY WIDGETS (SPINNING VINYL DISC + QR CHECK-IN PASS) */}
      <div className="fixed right-3 sm:right-5 bottom-20 sm:bottom-24 z-40 flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={() => setShowGuestQrModal(true)}
          title={lang === 'ID' ? 'Tiket QR Tamu' : 'Guest QR Pass'}
          className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/95 backdrop-blur-xl border border-[#D4AF37]/60 shadow-[0_8px_24px_rgba(160,130,85,0.28)] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
        >
          <img
            src={MEPLANNER_ICONS.floatQrCheckin}
            alt="QR Check-in"
            className="w-6 h-6 object-contain"
          />
        </button>

        <button
          type="button"
          onClick={handleToggleMusic}
          title={isPlayingMusic ? 'Pause Music' : 'Play Music'}
          className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 backdrop-blur-xl border border-[#D4AF37]/65 shadow-[0_8px_24px_rgba(160,130,85,0.3)] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
        >
          <img
            src={MEPLANNER_WEBKIT_COMPONENTS.widgetVinylMusicDisc}
            alt="Vinyl Music Disc"
            className={`w-9 h-9 sm:w-10 sm:h-10 object-contain ${
              isPlayingMusic && !isMusicMuted ? 'animate-spin' : 'opacity-65'
            }`}
            style={{ animationDuration: '6s' }}
          />
          <img
            src={
              isPlayingMusic && !isMusicMuted
                ? MEPLANNER_ICONS.floatMusicPlay
                : MEPLANNER_ICONS.floatMusicMute
            }
            alt={isPlayingMusic && !isMusicMuted ? 'Playing' : 'Muted'}
            className="w-4 h-4 object-contain absolute -bottom-0.5 -right-0.5 bg-white rounded-full p-0.5 shadow-xs border border-[#D4AF37]/40"
          />
        </button>
      </div>

      {/* BOTTOM FLOATING NAVIGATION BAR (6 OFFICIAL ANIMATED SVG ICONS FROM MEPLANNER_ICONS) */}
      <nav className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1rem)] max-w-lg sm:w-auto sm:max-w-none bg-white/95 backdrop-blur-2xl border border-[#D4AF37]/50 rounded-2xl sm:rounded-full px-1.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_12px_35px_rgba(160,130,85,0.26)] flex items-center justify-around sm:justify-center gap-0.5 sm:gap-1.5">
        {[
          {
            href: '#pembuka',
            label: lang === 'ID' ? 'Sampul' : 'Cover',
            iconSrc: MEPLANNER_ICONS.navCoverHome,
            visible: true,
          },
          {
            href: '#mempelai',
            label: lang === 'ID' ? 'Profil' : 'Profile',
            iconSrc: MEPLANNER_ICONS.navMempelaiHeart,
            visible: settings.showCoupleSection !== false,
          },
          {
            href: '#acara',
            label: lang === 'ID' ? 'Acara' : 'Schedule',
            iconSrc: MEPLANNER_ICONS.navAcaraCalendar,
            visible: visibleEvents.length > 0,
          },
          {
            href: '#lokasi',
            label: lang === 'ID' ? 'Lokasi' : 'Venue',
            iconSrc: MEPLANNER_ICONS.navLokasiMap,
            visible: visibleEvents.length > 0,
          },
          {
            href: '#galeri',
            label: lang === 'ID' ? 'Galeri' : 'Gallery',
            iconSrc: MEPLANNER_ICONS.navGaleriCamera,
            visible: showLoveStory || showGallery,
          },
          {
            href: '#rsvp',
            label: lang === 'ID' ? 'Ucapan' : 'Wishes',
            iconSrc: MEPLANNER_ICONS.navUcapanWishes,
            visible: settings.showRsvpSection !== false,
          },
        ]
          .filter((item) => item.visible)
          .map((nav) => (
            <a
              key={nav.href + nav.label}
              href={nav.href}
              onClick={(e) => {
                const targetEl = document.querySelector(nav.href);
                if (targetEl) {
                  e.preventDefault();
                  targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className="flex-1 sm:flex-initial px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold text-stone-700 hover:text-[#8B6914] hover:bg-[#FAF3E3] flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-all group"
            >
              <img
                src={nav.iconSrc}
                alt={nav.label}
                className="w-5 h-5 sm:w-4 sm:h-4 object-contain shrink-0 group-hover:scale-110 transition-transform"
              />
              <span className="truncate">{nav.label}</span>
            </a>
          ))}
      </nav>

      {/* GUEST QR CHECK-IN PASS MODAL */}
      {showGuestQrModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowGuestQrModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center text-stone-900 relative shadow-2xl border border-[#D4AF37]/55 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <WebkitCardFourCorners cornerSvg={webkitBundle.cardCornerSvg} />
            <button
              type="button"
              onClick={() => setShowGuestQrModal(false)}
              className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF3E3] border border-[#D4AF37]/45 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                <img
                  src={MEPLANNER_ICONS.floatQrCheckin}
                  alt="QR Check-in"
                  className="w-7 h-7 object-contain"
                />
              </div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#9A742B] font-bold block mb-1">
                {lang === 'ID' ? 'TIKET BUKU TAMU DIGITAL' : 'DIGITAL GUEST RECEPTION PASS'}
              </span>
              <h3 className="font-serif text-lg font-bold text-stone-900">
                {effectiveMatchedGuest?.guestName || resolvedGuestDisplayName}
              </h3>
              <p className="text-xs text-stone-500 mt-0.5 mb-4">
                {displayTitleShort}
                {mainScheduleEvent?.dateLabel ||
                activeCountdownEvent?.dateLabel ||
                settings.event2DateLabel
                  ? ` • ${
                      mainScheduleEvent?.dateLabel ||
                      activeCountdownEvent?.dateLabel ||
                      settings.event2DateLabel
                    }`
                  : ''}
              </p>

              <div className="w-52 h-52 mx-auto rounded-2xl border-2 border-[#D4AF37]/60 bg-[#FAF8F5] flex flex-col items-center justify-center p-3 mb-3 shadow-inner relative">
                <QrCode className="w-36 h-36 text-stone-800" />
                <span className="text-[10px] font-mono font-bold text-[#8B6914] mt-1.5 tracking-widest uppercase">
                  PASS-
                  {encodeURIComponent(
                    effectiveMatchedGuest?.guestName || resolvedGuestDisplayName || 'GUEST'
                  )
                    .slice(0, 8)
                    .toUpperCase()}
                </span>
              </div>

              <div className="rounded-xl bg-[#FAF8F5] border border-[#E6D5B8]/60 p-2.5 mb-4 flex items-center gap-2.5 text-left">
                <img
                  src={MEPLANNER_THEME_ASSETS.commercialGuestReceptionScreen}
                  alt="Guest Reception"
                  className="w-12 h-12 rounded-lg object-cover border border-[#D4AF37]/40 shrink-0"
                />
                <p className="text-[11px] text-stone-600 leading-snug">
                  {lang === 'ID'
                    ? 'Tunjukkan kode QR ini kepada petugas penerima tamu di meja registrasi untuk Check-In kehadiran otomatis.'
                    : 'Present this QR pass at the reception desk for instant digital guest check-in.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowGuestQrModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-sm"
              >
                <img
                  src={MEPLANNER_ICONS.btnRsvpTicket}
                  alt=""
                  className="w-4 h-4 object-contain"
                />
                <span>{lang === 'ID' ? 'Selesai & Tutup Tiket' : 'Done & Close Pass'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QRIS MODAL */}
      {showQrisModal && (
        <div
          className="fixed inset-0 z-50 bg-stone-900/55 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowQrisModal(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-sm w-full p-6 text-center text-stone-900 relative shadow-2xl border border-[#D4AF37]/50"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setShowQrisModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-600"
            >
              <X className="w-4 h-4" />
            </button>
            <QrCode className="w-8 h-8 text-[#B68D40] mx-auto mb-2" />
            <h3 className="font-serif text-lg font-bold">QRIS Wedding Gift</h3>
            <p className="text-xs text-stone-500 mb-4">
              a.n.{' '}
              {settings.giftRecipientName && settings.giftRecipientName !== 'Mempelai'
                ? settings.giftRecipientName
                : displayTitleFull}
            </p>
            {settings.qrisImageUrl && settings.qrisImageUrl.trim() !== '' ? (
              <div className="w-64 h-64 sm:w-72 sm:h-72 mx-auto rounded-2xl border-2 border-[#D4AF37]/60 bg-white flex flex-col items-center justify-center p-2.5 mb-4 shadow-inner overflow-hidden">
                <img
                  src={settings.qrisImageUrl}
                  alt="Barcode QRIS Wedding Gift"
                  className="w-full h-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="w-56 h-56 mx-auto rounded-2xl border-2 border-dashed border-[#D4AF37] bg-[#FAF8F5] flex flex-col items-center justify-center p-4 mb-4">
                <QrCode className="w-32 h-32 text-stone-800" />
                <span className="text-[10px] font-mono text-stone-500 mt-2">
                  SCAN QRIS BANK / E-WALLET
                </span>
              </div>
            )}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              {settings.qrisImageUrl && settings.qrisImageUrl.trim() !== '' && (
                <a
                  href={settings.qrisImageUrl}
                  download="QRIS-Wedding-Gift.webp"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/50 text-[#8B6914] font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Simpan Gambar QRIS</span>
                </a>
              )}
              <button
                type="button"
                onClick={() => setShowQrisModal(false)}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white font-bold text-xs"
              >
                Tutup QRIS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX MODAL */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 z-50 bg-stone-950/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div
            className="max-w-2xl w-full bg-white rounded-3xl overflow-hidden border border-[#D4AF37]/40 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative w-full max-h-[72vh] bg-stone-950 overflow-hidden flex items-center justify-center">
              <img
                src={selectedPhoto.imageUrl}
                alt={selectedPhoto.title}
                className="w-full max-h-[72vh] object-contain mx-auto block"
              />
            </div>
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4">
              <div className="min-w-0">
                {selectedPhoto.category && selectedPhoto.category.trim() !== '' && (
                  <span className="text-[10px] uppercase tracking-widest text-[#9A742B] font-bold block mb-0.5">
                    {selectedPhoto.category}
                  </span>
                )}
                {selectedPhoto.title && selectedPhoto.title.trim() !== '' && (
                  <h4 className="font-serif text-base sm:text-lg font-bold text-stone-900 truncate">
                    {selectedPhoto.title}
                  </h4>
                )}
                {selectedPhoto.caption && selectedPhoto.caption.trim() !== '' && (
                  <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                    {selectedPhoto.caption}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-bold text-stone-700 shrink-0"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
