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
  KeyRound,
  Search,
} from 'lucide-react';
import {
  WeddingSettings,
  WeddingGuest,
  GuestWish,
  RsvpStatus,
  GalleryPhotoItem,
  MusicTrackItem,
  InvitationInteractionType,
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

interface PublicInvitationViewProps {
  settings: WeddingSettings;
  guests: WeddingGuest[];
  wishes: GuestWish[];
  guestParamName: string;
  guestParamCode: string;
  isAdminLoggedIn: boolean;
  onOpenAdminPortal: () => void;
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

const DEFAULT_PREWED_BG =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

interface FloralCornerOrnamentProps {
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const FloralCornerOrnament: React.FC<FloralCornerOrnamentProps> = ({
  position,
  size = 'md',
  className = '',
}) => {
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
        {/* Soft Pearl & Champagne Glow Backdrop */}
        <circle cx="24" cy="24" r="22" fill="#D4AF37" fillOpacity="0.10" />
        {/* Main Curved Botanical Stems */}
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
        {/* Delicate Gold Leaves Along Stem */}
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
        {/* Corner Rose / Jasmine Blossom */}
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
        {/* Pearl & Gold Berries */}
        <circle cx="16" cy="46" r="3" fill="#FFFDF9" stroke="#C5A059" strokeWidth="1" />
        <circle cx="48" cy="18" r="3.2" fill="#FFFDF9" stroke="#C5A059" strokeWidth="1" />
        <circle cx="18" cy="88" r="2.5" fill="#D4AF37" />
        <circle cx="88" cy="16" r="2.5" fill="#D4AF37" />
        <circle cx="62" cy="56" r="2" fill="#C5A059" />
      </svg>
    </div>
  );
};

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
              fill="url(#petalGrad)"
              stroke="#D4AF37"
              strokeWidth="0.8"
              strokeOpacity="0.65"
            />
            <defs>
              <linearGradient id="petalGrad" x1="6" y1="2" x2="18" y2="21" gradientUnits="userSpaceOnUse">
                <stop stopColor="#FFFDF9" />
                <stop offset="0.55" stopColor="#FAF3E3" />
                <stop offset="1" stopColor="#E6C994" />
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

export const PublicInvitationView: React.FC<PublicInvitationViewProps> = ({
  settings,
  guests,
  wishes,
  guestParamName,
  guestParamCode,
  isAdminLoggedIn,
  onOpenAdminPortal,
  onTrackAnalytics,
  onSubmitRsvp,
}) => {
  const [isOpened, setIsOpened] = useState(false);
  const [isOpeningTransition, setIsOpeningTransition] = useState(false);
  const [lang, setLang] = useState<'ID' | 'EN'>(settings.defaultLanguage || 'ID');
  const [shareCopiedToast, setShareCopiedToast] = useState(false);
  const hasTrackedPageViewRef = useRef(false);
  const invitationContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (settings.defaultLanguage) {
      setLang(settings.defaultLanguage);
    }
  }, [settings.defaultLanguage]);

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
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const [showQrisModal, setShowQrisModal] = useState(false);
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
  const safeGalleryIdx =
    effectiveGalleryPhotos.length > 0
      ? activeGalleryIdx % effectiveGalleryPhotos.length
      : 0;

  useEffect(() => {
    if (!showGallery || effectiveGalleryPhotos.length <= 1 || selectedPhoto) {
      return;
    }
    const timer = setInterval(() => {
      setActiveGalleryIdx((prev) => (prev + 1) % effectiveGalleryPhotos.length);
    }, 4200);
    return () => clearInterval(timer);
  }, [showGallery, effectiveGalleryPhotos.length, selectedPhoto, safeGalleryIdx]);

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

  const coverBgUrl = settings.coverBgUrl || settings.heroPrewedUrl || DEFAULT_PREWED_BG;
  const heroBgUrl = settings.heroPrewedUrl || DEFAULT_PREWED_BG;
  const pageBgUrl = settings.pageBgUrl || settings.heroPrewedUrl || DEFAULT_PREWED_BG;
  const overlayOpacity = Math.min(96, Math.max(40, settings.bgOverlayOpacity ?? 88));
  const blurClass =
    settings.bgBlurIntensity === 'none'
      ? 'backdrop-blur-none'
      : settings.bgBlurIntensity === 'md'
      ? 'backdrop-blur-md'
      : settings.bgBlurIntensity === 'lg'
      ? 'backdrop-blur-xl'
      : 'backdrop-blur-[2px]';

  // Lookup matched guest from DB if ?code= or ?to= matches (exact or partial)
  const matchedGuest = useMemo(() => {
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
  }, [guests, guestParamCode, guestParamName]);

  const [selectedGuestFromSearch, setSelectedGuestFromSearch] =
    useState<WeddingGuest | null>(null);
  const [showGuestSuggestions, setShowGuestSuggestions] = useState(false);
  const [coverGuestSearch, setCoverGuestSearch] = useState('');
  const [showCoverGuestSuggestions, setShowCoverGuestSuggestions] = useState(false);

  const [vipCodeInput, setVipCodeInput] = useState('');
  const [vipCodeError, setVipCodeError] = useState('');
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
      countdownEvents.find((e) =>
        /pemberkatan|akad|utama/i.test(e.title + ' ' + e.badge)
      ) || countdownEvents[0]
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

  const applyGuestToForm = (guest: WeddingGuest) => {
    setSelectedGuestFromSearch(guest);
    setRsvpName(guest.guestName);
    setRsvpInstitution(guest.institution || '');
    setRsvpPhone(guest.phone || '');
    setRsvpPax(guest.confirmedPax || guest.pax || 2);
    if (guest.rsvpStatus && guest.rsvpStatus !== 'Belum Konfirmasi') {
      setRsvpStatus(guest.rsvpStatus);
    }
    if (guest.sessionChoice) {
      setRsvpSession(guest.sessionChoice);
    }
    if (guest.wishes && !rsvpMessage) {
      setRsvpMessage(guest.wishes);
    }
    setShowGuestSuggestions(false);
    setShowCoverGuestSuggestions(false);
    setVipCodeInput(guest.invitationCode);
    setVipCodeError('');
  };

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
        mapsUrl: ev.mapsUrl || 'https://maps.google.com',
        dresscode: ev.dresscode,
        highlight:
          ev.enableCountdown &&
          (/pemberkatan|akad|utama/i.test(ev.title + ' ' + ev.badge) || idx === 1),
      }));
  }, [allScheduleEvents]);

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

  const matchingGuestSuggestions = useMemo(() => {
    if (guests.length === 0) return [];
    const query = rsvpName.trim().toLowerCase();
    if (!query) {
      return guests.slice(0, 6);
    }
    return guests
      .filter(
        (g) =>
          g.guestName.toLowerCase().includes(query) ||
          g.invitationCode.toLowerCase().includes(query) ||
          (g.institution || '').toLowerCase().includes(query)
      )
      .slice(0, 8);
  }, [guests, rsvpName]);

  const requiresVipCodeGate =
    settings.invitationModerationMode === 'VIP_CODE_ONLY' && !effectiveMatchedGuest;

  const coverMatchingGuests = useMemo(() => {
    if (guests.length === 0) return [];
    const rawQuery = (
      !isOpened && requiresVipCodeGate ? vipCodeInput : coverGuestSearch
    )
      .trim()
      .toLowerCase();
    if (!rawQuery) {
      return guests.slice(0, 6);
    }
    return guests
      .filter(
        (g) =>
          g.guestName.toLowerCase().includes(rawQuery) ||
          g.invitationCode.toLowerCase().includes(rawQuery) ||
          (g.institution || '').toLowerCase().includes(rawQuery)
      )
      .slice(0, 8);
  }, [guests, coverGuestSearch, vipCodeInput, requiresVipCodeGate, isOpened]);

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
    let resolvedGuestForOpen = effectiveMatchedGuest;
    if (requiresVipCodeGate) {
      const cleanInput = vipCodeInput.trim().toLowerCase();
      if (!cleanInput) {
        setVipCodeError(
          'Masukkan Kode Undangan (contoh: INV-0001) atau Nama Tamu terdaftar untuk membuka undangan.'
        );
        return;
      }
      const found = guests.find(
        (g) =>
          (g.invitationCode || '').trim().toLowerCase() === cleanInput ||
          g.guestName.trim().toLowerCase() === cleanInput ||
          (cleanInput.length >= 3 &&
            g.guestName.trim().toLowerCase().includes(cleanInput))
      );
      if (!found && guests.length > 0) {
        setVipCodeError(
          'Kode Undangan atau Nama Tamu tidak ditemukan dalam daftar tamu terdaftar.'
        );
        return;
      }
      if (found) {
        resolvedGuestForOpen = found;
        setVerifiedGuestByCode(found);
        applyGuestToForm(found);
      }
      setVipCodeError('');
    }
    emitAnalytics(
      'OPEN_COVER',
      'Klik tombol "Buka Undangan" pada sampul pembuka',
      resolvedGuestForOpen?.guestName,
      resolvedGuestForOpen?.invitationCode
    );
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
    const groomNick =
      settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
        ? settings.groomNickname
        : 'Eko';
    const brideNick =
      settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
        ? settings.brideNickname
        : 'Selo';
    const evTitle = activeCountdownEvent?.title || 'Pernikahan';
    const title = `The Wedding of ${groomNick} & ${brideNick} (${evTitle})`;
    const rawIso =
      activeCountdownEvent?.datetime ||
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
    const location = activeCountdownEvent
      ? `${activeCountdownEvent.venue}, ${activeCountdownEvent.address}`
      : `${settings.event2Venue || ''}, ${settings.event2Address || ''}`;
    const details = `Undangan Pernikahan ${settings.groomFullName} & ${settings.brideFullName} — ${evTitle} (${
      activeCountdownEvent?.dateLabel || settings.event2DateLabel
    } • ${activeCountdownEvent?.timeLabel || settings.event2TimeLabel}).`;
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      title
    )}&dates=${dates}&details=${encodeURIComponent(
      details
    )}&location=${encodeURIComponent(location)}`;
  }, [activeCountdownEvent, settings]);

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
      typeof window !== 'undefined' ? window.location.href : '';
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
          text: `Undangan Pernikahan ${coupleNames} — ${settings.event2DateLabel}`,
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
    const developerUrl =
      settings.developerCreditUrl?.trim() ||
      'https://github.com/omeko11';
    const rawWa = settings.contactWhatsappNumber?.trim() || '089638616516';
    const whatsappUrl = /^https?:\/\//i.test(rawWa)
      ? rawWa
      : `https://wa.me/${rawWa.replace(/\D/g, '').replace(/^0/, '62')}`;

    return (
      <div
        className={`${
          compact ? 'mt-3 pt-3' : 'mt-5 pt-4 border-t border-[#D4AF37]/25'
        } flex flex-col items-center justify-center gap-2 text-center`}
      >
        <p className="text-[11px] sm:text-xs font-bold tracking-wide text-stone-700">
          My Wedding Manager by{' '}
          <a
            href={developerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#8B6914] hover:text-[#B68D40] underline decoration-[#D4AF37]/60 underline-offset-2 font-extrabold"
          >
            omeko11
          </a>{' '}
          &copy; 2026
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2">
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

          {/* Kontak WA / Layanan Platform Icon Pill */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={`Hubungi Kontak WA My Wedding Manager (${rawWa})`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/50 text-[#8B6914] text-[10px] sm:text-[11px] font-bold shadow-2xs transition-all hover:scale-[1.02]"
          >
            <svg
              className="w-3.5 h-3.5 text-[#B68D40] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>Kontak WA</span>
          </a>

          {/* LinkedIn Official Profile Badge Link */}
          <a
            href="https://www.linkedin.com/in/eko-agung-krisdianto-408955130"
            target="_blank"
            rel="noopener noreferrer"
            title="Profil LinkedIn Resmi Eko Agung Krisdianto (omeko11)"
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
        (w.invitationCode || '').toLowerCase().includes(q) ||
        w.message.toLowerCase().includes(q)
    );
  }, [publicVisibleWishes, coverGuestSearch]);

  // ============================================================================
  // 0. SUPERADMIN MODERATION: MAINTENANCE / PAUSED VIEW MODE
  // ============================================================================
  if (settings.invitationModerationMode === 'MAINTENANCE') {
    return (
      <div className="min-h-[100dvh] relative flex flex-col justify-between pt-16 sm:pt-20 overflow-x-clip overflow-y-auto bg-[#FAF8F5] text-stone-800 select-none">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <img
            src={coverBgUrl}
            alt="Background"
            className="w-full h-full object-cover object-center"
            style={getPhotoAdjustStyle(settings.photoAdjustments?.coverBgUrl)}
          />
        </div>
        <div
          className={`fixed inset-0 pointer-events-none ${blurClass}`}
          style={{
            backgroundColor: `rgba(250, 248, 245, ${(overlayOpacity / 100).toFixed(2)})`,
          }}
        />
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
          <div className="w-full rounded-3xl bg-white/85 backdrop-blur-2xl border border-white/95 shadow-[0_25px_70px_rgba(160,130,85,0.18)] p-6 sm:p-10 space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#FAF3E3] border-2 border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B]">
              <WeddingRingsIcon className="w-9 h-9" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-bold">
              <Clock className="w-3.5 h-3.5" /> Mode Penyesuaian / Segera Hadir
            </span>
            <h1 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900">
              {settings.groomNickname || 'Eko'} &amp; {settings.brideNickname || 'Selo'}
            </h1>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed max-w-md mx-auto">
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
  // 1. COVER PEMBUKA (BRIGHT PREWEDDING SILHOUETTE & FROSTED GLASS GATE)
  // ============================================================================
  if (!isOpened) {
    const coverFitMode = settings.photoAdjustments?.coverBgUrl?.fitMode;
    return (
      <div
        className={`min-h-[100dvh] relative flex flex-col justify-between pt-16 sm:pt-20 overflow-x-clip overflow-y-auto bg-[#FAF8F5] text-stone-800 select-none transition-all duration-700 ease-in-out ${
          isOpeningTransition
            ? '-translate-y-full opacity-0 scale-105 pointer-events-none'
            : 'translate-y-0 opacity-100 scale-100'
        }`}
      >
        <FloatingPetalsAmbient />

        {/* Background Prewedding Silhouette Photo + Adjustable Luminous Pearl Veil */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <img
            src={coverBgUrl}
            alt="Cover Background"
            className={`w-full h-full object-cover object-center transition-transform duration-1000 ${
              coverFitMode !== 'contain' ? 'animate-ken-burns' : ''
            }`}
            style={getPhotoAdjustStyle(settings.photoAdjustments?.coverBgUrl)}
          />
        </div>
        <div
          className={`fixed inset-0 pointer-events-none ${blurClass}`}
          style={{
            backgroundColor: `rgba(250, 248, 245, ${(overlayOpacity / 100).toFixed(2)})`,
          }}
        />
        <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.20)_0%,rgba(250,248,245,0.80)_100%)] pointer-events-none" />

        {/* Subtle Top Bar */}
        <header className="fixed top-0 inset-x-0 z-40 bg-white/75 backdrop-blur-xl border-b border-[#D4AF37]/25 shadow-2xs">
          <div className="max-w-5xl mx-auto flex items-center justify-between gap-2 px-3.5 sm:px-8 py-2.5 sm:py-3">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#D4AF37]/35 shadow-2xs min-w-0">
              <WeddingRingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B68D40] shrink-0" />
              <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider sm:tracking-[0.2em] uppercase text-[#8B6914] truncate">
                The Wedding Celebration
              </span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
                className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/85 hover:bg-[#FAF3E3] backdrop-blur-md border border-[#D4AF37]/45 text-[10px] sm:text-[11px] font-bold text-[#8B6914] transition-all shadow-2xs"
                title="Switch Language (Bahasa Indonesia / English)"
              >
                <span>{lang === 'ID' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  weddingMusicPlayer.stop();
                  setIsPlayingMusic(false);
                  onOpenAdminPortal();
                }}
                className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white/95 backdrop-blur-md border border-stone-300/70 text-[10px] sm:text-[11px] font-bold text-stone-700 hover:text-[#8B6914] transition-all shadow-2xs shrink-0"
                title="Login Portal Manajemen Pernikahan"
              >
                <Lock className="w-3.5 h-3.5 text-[#B68D40]" />
                <span className="hidden sm:inline">
                  {isAdminLoggedIn ? 'Dashboard Admin' : 'Portal Admin'}
                </span>
              </button>
            </div>
          </div>
        </header>

        {/* Center Cover Invitation Frosted Glass Card */}
        <div className="relative z-10 max-w-xl mx-auto px-3.5 sm:px-5 py-4 sm:py-6 text-center flex flex-col items-center my-auto w-full">
          <div className="w-full rounded-3xl sm:rounded-[2.25rem] bg-white/75 backdrop-blur-2xl border border-white/95 shadow-[0_25px_70px_rgba(160,130,85,0.18)] p-5 sm:p-10 relative overflow-hidden">
            <FloralCornerOrnament position="top-left" />
            <FloralCornerOrnament position="top-right" />
            <FloralCornerOrnament position="bottom-left" />
            <FloralCornerOrnament position="bottom-right" />

            <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />

            {/* Pure Neutral Interlocking Wedding Rings Emblem */}
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-white/95 via-[#FAF6EE] to-[#F3E7D3] border-2 border-[#D4AF37]/45 flex items-center justify-center shadow-[0_10px_30px_rgba(197,160,89,0.22)] mb-3.5 sm:mb-5 relative z-10">
              <WeddingRingsIcon className="w-9 h-9 sm:w-12 sm:h-12 text-[#B68D40]" />
            </div>

            <p className="text-[11px] sm:text-xs uppercase tracking-[0.28em] sm:tracking-[0.34em] text-[#9A742B] font-bold mb-1">
              The Wedding Of
            </p>
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.2em] text-stone-500 font-semibold mb-2">
              {lang === 'ID' ? 'Undangan Pernikahan' : 'Wedding Invitation'}
            </p>

            <h1 className="font-script text-4xl sm:text-6xl font-normal tracking-normal text-stone-900 leading-tight mb-2 break-words py-1">
              {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                ? settings.groomNickname
                : 'Eko'}{' '}
              <span className="text-[#C5A059]">&amp;</span>{' '}
              {settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
                ? settings.brideNickname
                : 'Selo'}
            </h1>

            <p className="text-xs sm:text-sm text-stone-600 font-medium tracking-wide mb-4 sm:mb-6">
              {settings.event2DateLabel} &bull; {settings.groomOrigin}
            </p>

            {/* Personalized Guest Card (Translucent Glass) */}
            <div className="w-full rounded-2xl bg-white/85 backdrop-blur-xl border border-[#D4AF37]/35 p-4 sm:p-6 shadow-sm mb-5 sm:mb-6">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.18em] sm:tracking-[0.22em] text-stone-500 mb-1.5">
                {lang === 'ID' ? 'Kepada Yth.' : 'Dear Honored Guest'}
              </p>

              <h2 className="font-serif text-base sm:text-2xl font-bold text-stone-900 break-words leading-snug">
                {effectiveMatchedGuest?.guestName || resolvedGuestDisplayName}
              </h2>

              {(effectiveMatchedGuest?.institution || matchedGuest?.institution) && (
                <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mt-1 break-words">
                  {effectiveMatchedGuest?.institution || matchedGuest?.institution}
                </p>
              )}

              <p className="text-[10px] sm:text-[11px] text-stone-400 mt-2.5 italic">
                {lang === 'ID'
                  ? '*Mohon maaf apabila terdapat kekeliruan penulisan nama atau gelar'
                  : '*We apologize if there is any misspelling of your name or title'}
              </p>
            </div>

            {/* Optional Superadmin VIP Code Gate Input */}
            {requiresVipCodeGate && (
              <div className="w-full rounded-2xl bg-[#FAF8F5]/95 border border-[#D4AF37]/50 p-3.5 sm:p-4 mb-4 text-left space-y-2 relative">
                <label className="text-[11px] font-bold text-[#8B6914] flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-[#B68D40]" />
                  <span>
                    {lang === 'ID'
                      ? 'Mode Undangan Privat VIP — Masukkan Kode / Nama Tamu:'
                      : 'VIP Private Invitation — Enter Invitation Code / Guest Name:'}
                  </span>
                </label>
                <input
                  type="text"
                  value={vipCodeInput}
                  onFocus={() => setShowCoverGuestSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowCoverGuestSuggestions(false), 180)
                  }
                  onChange={(e) => {
                    setVipCodeInput(e.target.value);
                    setVipCodeError('');
                    setShowCoverGuestSuggestions(true);
                  }}
                  placeholder={
                    lang === 'ID'
                      ? 'Contoh: INV-0001 atau ketik nama Anda'
                      : 'Example: INV-0001 or type your name'
                  }
                  className="w-full px-3.5 py-2 rounded-xl bg-white border border-[#D4AF37]/50 font-mono text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:border-[#8B6914]"
                />
                {showCoverGuestSuggestions && coverMatchingGuests.length > 0 && (
                  <div className="max-h-40 overflow-y-auto rounded-xl bg-white border border-[#D4AF37]/50 shadow-lg divide-y divide-stone-100">
                    {coverMatchingGuests.map((guest) => (
                      <button
                        key={guest.id}
                        type="button"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          setVerifiedGuestByCode(guest);
                          applyGuestToForm(guest);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-[#FAF3E3]/70 flex items-center justify-between gap-2 transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-stone-900 truncate">
                            {guest.guestName}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate">
                            {guest.institution || guest.guestType} &bull; {guest.pax} Pax
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/40 font-mono text-[10px] font-bold text-[#8B6914] shrink-0">
                          {guest.invitationCode}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
                {vipCodeError && (
                  <p className="text-[11px] font-semibold text-rose-600">
                    {vipCodeError}
                  </p>
                )}
              </div>
            )}

            {/* Open Invitation Button */}
            <button
              type="button"
              onClick={handleOpenInvitation}
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] text-white font-bold text-sm sm:text-base shadow-[0_12px_30px_rgba(197,160,89,0.38)] hover:shadow-[0_15px_35px_rgba(197,160,89,0.55)] hover:scale-[1.02] active:scale-[0.99] transition-all"
            >
              <BookOpen className="w-4 h-4 transition-transform group-hover:rotate-6" />
              <span>{lang === 'ID' ? 'Buka Undangan' : 'Open Invitation'}</span>
            </button>
          </div>
        </div>

        {/* Bottom Footer Note + Developer Credit */}
        <div className="relative z-10 text-center pb-4 sm:pb-5 px-4">
          <p className="text-[11px] text-stone-500 font-medium">
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
  const heroFitMode = settings.photoAdjustments?.heroPrewedUrl?.fitMode;
  return (
    <div
      ref={invitationContainerRef}
      className="min-h-screen relative bg-[#FAF8F5] text-stone-800 pt-14 sm:pt-16 pb-28 sm:pb-24 overflow-x-clip selection:bg-[#D4AF37]/25 selection:text-stone-900"
    >
      <FloatingPetalsAmbient />

      {/* FIXED CUSTOM WALLPAPER / PREWEDDING BACKGROUND WITH ADJUSTABLE PEARL VEIL */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <img
          src={pageBgUrl}
          alt="Page Wallpaper"
          className="absolute inset-0 w-full h-full object-cover object-center"
          style={getPhotoAdjustStyle(settings.photoAdjustments?.pageBgUrl)}
        />
        <div
          className={`absolute inset-0 ${blurClass}`}
          style={{
            backgroundColor: `rgba(250, 248, 245, ${(overlayOpacity / 100).toFixed(2)})`,
          }}
        />
      </div>

      {/* TOP FLOATING GLASS NAVIGATION */}
      <header className="fixed top-0 inset-x-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#D4AF37]/25 shadow-[0_4px_25px_rgba(180,150,100,0.08)]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#FAF3E3] to-[#EFE1C6] border border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B] shrink-0 shadow-2xs">
              <WeddingRingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="truncate">
              <p className="font-editorial text-xs sm:text-base font-bold text-stone-900 truncate">
                {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                  ? settings.groomNickname
                  : 'Eko'}{' '}
                &amp;{' '}
                {settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
                  ? settings.brideNickname
                  : 'Selo'}
              </p>
              <p className="text-[10px] text-[#9A742B] font-medium truncate">
                {settings.event2DateLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 relative">
            {/* Button 1: Individual Play/Pause Pill with Spinning Vinyl & Equalizer Bars */}
            <button
              type="button"
              onClick={handleToggleMusic}
              className={`inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border border-[#D4AF37]/45 bg-white/90 shadow-2xs text-xs font-bold transition-all ${
                isPlayingMusic
                  ? 'bg-[#FAF3E3] text-[#8B6914]'
                  : 'text-stone-600 hover:bg-stone-50'
              }`}
              title={isPlayingMusic ? 'Jeda Musik (Pause)' : 'Putar Musik (Play)'}
            >
              {isPlayingMusic ? (
                <span className="relative inline-flex items-center justify-center w-4 h-4 rounded-full bg-gradient-to-br from-[#D4AF37] via-[#8B6914] to-stone-900 animate-spin-vinyl shrink-0 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FAF3E3]" />
                </span>
              ) : (
                <Play className="w-3.5 h-3.5 text-[#B68D40]" />
              )}
              <span className="hidden sm:inline max-w-[130px] truncate">
                {currentTrack?.title || settings.musicTitle || 'Musik'}
              </span>
              {isPlayingMusic && (
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
              className={`inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-full border border-[#D4AF37]/45 text-xs font-bold shadow-2xs transition-all ${
                isMusicPopoverOpen
                  ? 'bg-[#B68D40] text-white'
                  : 'bg-white/90 hover:bg-[#FAF3E3] text-[#8B6914]'
              }`}
              title="Buka Playlist & Pengaturan Volume"
            >
              <ListMusic className="w-3.5 h-3.5" />
              <span className="text-[10px] font-extrabold">{playlist.length}</span>
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
              </div>
            )}

            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
              className="inline-flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-full bg-white/90 hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-[11px] sm:text-xs font-bold text-[#8B6914] transition-all shadow-2xs"
              title="Switch Language (Bahasa Indonesia / English)"
            >
              <span>{lang === 'ID' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                weddingMusicPlayer.stop();
                setIsPlayingMusic(false);
                onOpenAdminPortal();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-[#FAF3E3] border border-[#D4AF37]/35 text-xs font-bold text-stone-700 hover:text-[#8B6914] transition-all shadow-2xs"
              title={isAdminLoggedIn ? 'Dashboard Admin' : 'Portal Admin'}
            >
              <Lock className="w-3.5 h-3.5 text-[#B68D40]" />
              <span className="hidden sm:inline">
                {isAdminLoggedIn ? 'Dashboard' : 'Admin'}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO PREWEDDING SILHOUETTE BANNER & LIVE COUNTDOWN */}
      <section className="relative z-10 overflow-hidden pt-4 sm:pt-8 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="inv-reveal inv-reveal-up relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-white/95 shadow-[0_25px_70px_rgba(160,130,85,0.16)] bg-white/75 backdrop-blur-xl">
            <FloralCornerOrnament position="top-left" />
            <FloralCornerOrnament position="top-right" />
            <FloralCornerOrnament position="bottom-left" />
            <FloralCornerOrnament position="bottom-right" />

            {/* Prewedding Silhouette Image Header (16:9 matching Crop Studio) */}
            <div className="relative w-full aspect-[16/9] max-h-[520px] overflow-hidden bg-stone-900">
              <img
                src={heroBgUrl}
                alt="Prewedding Banner"
                className={`w-full h-full object-cover object-center ${
                  heroFitMode !== 'contain' ? 'animate-ken-burns' : ''
                }`}
                style={getPhotoAdjustStyle(settings.photoAdjustments?.heroPrewedUrl)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-stone-950/20 to-transparent pointer-events-none" />
              <div className="absolute top-3.5 sm:top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#D4AF37]/40 text-[#8B6914] text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase shadow-xs whitespace-nowrap">
                <WeddingRingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Holy Matrimony &amp; Reception</span>
              </div>

              {/* Romantic Script Nickname Accent Over Hero Photo */}
              <div className="absolute bottom-14 sm:bottom-16 inset-x-0 text-center pointer-events-none px-4">
                <p className="font-script text-3xl sm:text-5xl text-[#F5E6C8] drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)]">
                  {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                    ? settings.groomNickname
                    : 'Eko'}{' '}
                  &amp;{' '}
                  {settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
                    ? settings.brideNickname
                    : 'Selo'}
                </p>
              </div>
            </div>

            {/* Hero Content Overlapping Frosted Area */}
            <div className="px-4 sm:px-6 pb-7 sm:pb-10 pt-2 text-center -mt-12 sm:-mt-14 relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-white/95 border border-[#D4AF37]/45 flex items-center justify-center text-[#B68D40] shadow-md mb-3.5 sm:mb-4">
                <WeddingRingsIcon className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>

              <h1 className="font-editorial text-2xl sm:text-5xl md:text-6xl font-bold text-stone-900 tracking-tight leading-snug mb-3 break-words">
                {settings.groomFullName}
                <span className="block font-script text-3xl sm:text-5xl font-normal text-[#B68D40] my-1 sm:my-1.5">
                  &amp;
                </span>
                {settings.brideFullName}
              </h1>

              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-stone-600 leading-relaxed mb-6 sm:mb-8">
                {settings.invitationOpeningText}
              </p>

              {/* Countdown Timer Boxes (Conditional via enableCountdown Switch) */}
              {activeCountdownEvent && (
                <div className="max-w-lg mx-auto mb-6 sm:mb-8 space-y-3.5">
                  <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] sm:text-xs font-bold">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ID'
                        ? 'Menuju Hari Bahagia'
                        : 'Counting Down to the Big Day'}
                      {countdownEvents.length === 1
                        ? ` • ${activeCountdownEvent.title}`
                        : ''}
                    </span>
                  </div>

                  {countdownEvents.length > 1 && (
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      {countdownEvents.map((ev) => {
                        const isSelected = activeCountdownEvent.id === ev.id;
                        return (
                          <button
                            key={ev.id}
                            type="button"
                            onClick={() => setSelectedCountdownEventId(ev.id)}
                            className={`px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold border transition-all ${
                              isSelected
                                ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40] shadow-xs'
                                : 'bg-white/85 hover:bg-[#FAF3E3] text-[#8B6914] border-[#D4AF37]/40'
                            }`}
                          >
                            {ev.title}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 sm:gap-4 items-stretch">
                    {[
                      { label: lang === 'ID' ? 'Hari' : 'Days', value: countdown.days },
                      { label: lang === 'ID' ? 'Jam' : 'Hours', value: countdown.hours },
                      {
                        label: lang === 'ID' ? 'Menit' : 'Minutes',
                        value: countdown.minutes,
                      },
                      {
                        label: lang === 'ID' ? 'Detik' : 'Seconds',
                        value: countdown.seconds,
                      },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="inv-reveal inv-reveal-zoom h-full rounded-2xl bg-white/90 backdrop-blur-md border border-[#D4AF37]/35 p-2.5 sm:p-4 shadow-[0_8px_25px_rgba(180,150,100,0.10)] flex flex-col items-center justify-center"
                      >
                        <div className="font-editorial text-xl sm:text-4xl font-bold text-[#9A742B]">
                          {String(item.value).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-stone-500 font-semibold mt-0.5">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Save The Date (Google Calendar) Interactive Pill Button */}
                  <div className="pt-1 flex justify-center">
                    <a
                      href={googleCalendarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-[#FAF3E3] via-white to-[#FAF3E3] hover:from-[#F3E5C8] hover:to-[#FAF3E3] border border-[#D4AF37]/60 text-[#8B6914] text-xs font-bold shadow-[0_6px_20px_rgba(197,160,89,0.18)] hover:shadow-[0_10px_25px_rgba(197,160,89,0.28)] hover:scale-[1.02] transition-all"
                    >
                      <Calendar className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                      <span>
                        {lang === 'ID'
                          ? '📅 Simpan Tanggal di Google Calendar (Save The Date)'
                          : '📅 Save The Date to Google Calendar'}
                      </span>
                      <ExternalLink className="w-3 h-3 text-[#B68D40] shrink-0" />
                    </a>
                  </div>
                </div>
              )}

              {/* Verse / Quote Card (Conditional via showQuoteSection) */}
              {settings.showQuoteSection !== false && settings.quoteVerse && (
                <div className="inv-reveal inv-reveal-up max-w-2xl mx-auto rounded-2xl bg-[#FAF6EE]/90 border border-[#D4AF37]/35 p-4 sm:p-6 shadow-2xs">
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

              {/* Animated Scroll-Down Mouse Indicator Pill */}
              <div className="mt-6 flex justify-center">
                <a
                  href="#mempelai"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#D4AF37]/35 text-[10px] sm:text-xs font-semibold text-[#8B6914] shadow-2xs hover:bg-[#FAF3E3] transition-all"
                >
                  <span className="w-4 h-6 rounded-full border-2 border-[#B68D40] flex items-start justify-center p-0.5">
                    <span className="w-1 h-1.5 rounded-full bg-[#B68D40] animate-bounce" />
                  </span>
                  <span>
                    {lang === 'ID'
                      ? 'Gulir untuk melihat rangkaian acara'
                      : 'Scroll down to explore'}
                  </span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION: PROFIL MEMPELAI (100% SYMMETRICAL 2-COLUMN CARDS WITH ARCH PORTRAITS) */}
      {settings.showCoupleSection !== false && (
        <section id="mempelai" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="inv-reveal inv-reveal-up max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              The Happy Couple
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              {lang === 'ID' ? 'Mempelai yang Berbahagia' : 'The Happy Couple'}
            </h2>
            <p className="font-script text-3xl sm:text-4xl text-[#B68D40] mt-1">
              {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                ? settings.groomNickname
                : 'Eko'}{' '}
              &amp;{' '}
              {settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
                ? settings.brideNickname
                : 'Selo'}
            </p>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-2" />
          </div>

          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Groom Card */}
            <div className="inv-reveal inv-reveal-left relative h-full min-w-0 overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/95 p-5 sm:p-8 text-center flex flex-col items-center justify-between shadow-[0_18px_50px_rgba(175,145,95,0.12)]">
              <FloralCornerOrnament position="top-left" size="sm" />
              <FloralCornerOrnament position="top-right" size="sm" />

              <div className="flex flex-col items-center w-full relative z-10">
                <div className="relative mb-5 sm:mb-6 shrink-0">
                  <FloralCornerOrnament
                    position="bottom-left"
                    size="sm"
                    className="-bottom-3 -left-6 opacity-90"
                  />
                  <FloralCornerOrnament
                    position="bottom-right"
                    size="sm"
                    className="-bottom-3 -right-6 opacity-90"
                  />
                  <div className="w-36 h-48 sm:w-48 sm:h-64 rounded-t-full rounded-b-3xl border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg overflow-hidden bg-stone-100 relative">
                    <img
                      src={settings.groomPhotoUrl}
                      alt={settings.groomFullName}
                      className="w-full h-full object-cover object-center"
                      style={getPhotoAdjustStyle(settings.photoAdjustments?.groomPhotoUrl)}
                    />
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[11px] font-bold uppercase tracking-wider mb-2">
                  {settings.groomRankAndTitle || (lang === 'ID' ? 'Mempelai Pria' : 'The Groom')}
                </span>
                <p className="font-script text-3xl sm:text-4xl text-[#B68D40] mb-0.5">
                  {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                    ? settings.groomNickname
                    : 'Eko'}
                </p>
                <h3 className="font-editorial text-xl sm:text-3xl font-bold text-stone-900 mb-1 break-words">
                  {settings.groomFullName}
                </h3>
                <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3 min-h-[1.25rem]">
                  {settings.groomUnit || settings.groomOrigin}
                </p>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                  {settings.groomParents}
                </p>
              </div>
              <div className="pt-3 border-t border-stone-200/80 w-full flex items-center justify-center gap-2 text-xs text-stone-500 font-medium mt-auto relative z-10">
                <MapPin className="w-3.5 h-3.5 text-[#B68D40]" />
                <span>{settings.groomOrigin}</span>
              </div>
            </div>

            {/* Calligraphic "&" Separator Between Groom & Bride */}
            <div
              aria-hidden="true"
              className="flex md:hidden items-center justify-center -my-1"
            >
              <span className="font-script text-4xl text-[#B68D40] px-4 py-1 rounded-full bg-white/90 border border-[#D4AF37]/45 shadow-sm">
                &amp;
              </span>
            </div>
            <div
              aria-hidden="true"
              className="hidden md:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 pointer-events-none"
            >
              <span className="w-14 h-14 rounded-full bg-white/95 border-2 border-[#D4AF37]/60 shadow-[0_10px_30px_rgba(197,160,89,0.28)] flex items-center justify-center font-script text-4xl sm:text-5xl text-[#B68D40]">
                &amp;
              </span>
            </div>

            {/* Bride Card */}
            <div className="inv-reveal inv-reveal-right relative h-full min-w-0 overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl border border-white/95 p-5 sm:p-8 text-center flex flex-col items-center justify-between shadow-[0_18px_50px_rgba(175,145,95,0.12)]">
              <FloralCornerOrnament position="top-left" size="sm" />
              <FloralCornerOrnament position="top-right" size="sm" />

              <div className="flex flex-col items-center w-full relative z-10">
                <div className="relative mb-5 sm:mb-6 shrink-0">
                  <FloralCornerOrnament
                    position="bottom-left"
                    size="sm"
                    className="-bottom-3 -left-6 opacity-90"
                  />
                  <FloralCornerOrnament
                    position="bottom-right"
                    size="sm"
                    className="-bottom-3 -right-6 opacity-90"
                  />
                  <div className="w-36 h-48 sm:w-48 sm:h-64 rounded-t-full rounded-b-3xl border-4 border-[#D4AF37] ring-4 ring-[#FAF3E3] shadow-lg overflow-hidden bg-stone-100 relative">
                    <img
                      src={settings.bridePhotoUrl}
                      alt={settings.brideFullName}
                      className="w-full h-full object-cover object-center"
                      style={getPhotoAdjustStyle(settings.photoAdjustments?.bridePhotoUrl)}
                    />
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[11px] font-bold uppercase tracking-wider mb-2">
                  {settings.brideTitle || (lang === 'ID' ? 'Mempelai Wanita' : 'The Bride')}
                </span>
                <p className="font-script text-3xl sm:text-4xl text-[#B68D40] mb-0.5">
                  {settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
                    ? settings.brideNickname
                    : 'Selo'}
                </p>
                <h3 className="font-editorial text-xl sm:text-3xl font-bold text-stone-900 mb-1 break-words">
                  {settings.brideFullName}
                </h3>
                <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3 min-h-[1.25rem]">
                  {settings.brideOrigin}
                </p>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                  {settings.brideParents}
                </p>
              </div>
              <div className="pt-3 border-t border-stone-200/80 w-full flex items-center justify-center gap-2 text-xs text-stone-500 font-medium mt-auto relative z-10">
                <MapPin className="w-3.5 h-3.5 text-[#B68D40]" />
                <span>{settings.brideOrigin}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: JADWAL & LOKASI ACARA + INTEGRASI GOOGLE MAPS (SYMMETRICAL CARDS) */}
      {visibleEvents.length > 0 && (
        <section id="acara" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="inv-reveal inv-reveal-up max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              Save The Date
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              {lang === 'ID'
                ? 'Rangkaian Acara Pernikahan'
                : 'Wedding Events Schedule'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              {settings.subtitle}
            </p>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-2.5" />
          </div>

          <div
            className={`grid grid-cols-1 gap-4 sm:gap-6 items-stretch ${
              visibleEvents.length === 1
                ? 'max-w-lg mx-auto'
                : visibleEvents.length === 2
                ? 'md:grid-cols-2'
                : 'lg:grid-cols-3'
            }`}
          >
            {visibleEvents.map((ev, idx) => (
              <div
                key={idx}
                className={`inv-reveal inv-reveal-up relative h-full min-w-0 overflow-hidden rounded-3xl p-5 sm:p-7 flex flex-col justify-between transition-all backdrop-blur-xl ${
                  ev.highlight
                    ? 'bg-gradient-to-b from-white/95 via-[#FFFDF9]/95 to-[#FAF3E3]/90 border-2 border-[#D4AF37]/60 shadow-[0_20px_55px_rgba(197,160,89,0.20)]'
                    : 'bg-white/80 border border-white/95 shadow-[0_15px_45px_rgba(175,145,95,0.12)]'
                }`}
              >
                <FloralCornerOrnament position="top-right" size="sm" />
                <div className="flex flex-col flex-1 relative z-10">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold uppercase tracking-wider">
                      {ev.badge}
                    </span>
                    <WeddingRingsIcon className="w-5 h-5 text-[#C5A059]" />
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

                <div className="space-y-3 pt-3 border-t border-stone-200/70 mt-auto">
                  <div className="text-[11px] text-stone-500 break-words">
                    <span className="font-bold text-[#8B6914]">Dresscode:</span>{' '}
                    {ev.dresscode}
                  </div>
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
                    <MapPin className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ID' ? 'Buka Google Maps' : 'Open Google Maps'}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION: LOVE STORY & GALERI PREWEDDING (CONDITIONAL & SYMMETRICAL) */}
      {(showLoveStory || showGallery) && (
        <section id="galeri" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="inv-reveal inv-reveal-up max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              {settings.gallerySectionSubtitle?.trim() ||
                (showLoveStory && !showGallery
                  ? lang === 'ID'
                    ? 'Kisah Perjalanan Cinta'
                    : 'Our Love Story'
                  : 'Our Journey & Moments')}
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              {settings.gallerySectionTitle?.trim() ||
                (showLoveStory && !showGallery
                  ? lang === 'ID'
                    ? 'Kisah Perjalanan Cinta'
                    : 'Our Love Story'
                  : lang === 'ID'
                  ? 'Galeri Momen Bahagia'
                  : 'Moments of Happiness')}
            </h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-3" />
          </div>

          {/* Love Story Timeline Cards with Connected Vertical Golden Timeline */}
          {showLoveStory &&
            (effectiveLoveStory.length > 0 ? (
              <div className="mb-8 sm:mb-10 space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <Heart className="w-3.5 h-3.5 text-[#C5A059]" />
                  <span className="text-xs font-bold uppercase tracking-widest text-[#8B6914]">
                    {lang === 'ID' ? 'Kisah Perjalanan Cinta' : 'Our Love Story'}
                  </span>
                </div>
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
                        } relative h-full min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-6 shadow-[0_14px_40px_rgba(175,145,95,0.10)] flex flex-col justify-between`}
                      >
                        <FloralCornerOrnament position="bottom-right" size="sm" />
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
                  {lang === 'ID' ? 'Kisah Perjalanan Cinta' : 'Our Love Story'}
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  {lang === 'ID'
                    ? 'Belum ada momen perjalanan cinta yang ditambahkan.'
                    : 'No love story moments have been added yet.'}
                </p>
              </div>
            ))}

          {/* Smooth Auto-Sliding Photo Gallery Carousel + Interactive Thumbnail Strip */}
          {showGallery &&
            (effectiveGalleryPhotos.length > 0 ? (
              <div className="inv-reveal inv-reveal-up space-y-3">
                <div
                  className="relative w-full aspect-[16/9] rounded-3xl overflow-hidden border-2 border-white/95 bg-stone-900 shadow-[0_22px_60px_rgba(160,130,85,0.18)] select-none"
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
                  {/* Horizontal Smooth Sliding Track */}
                  <div
                    className="flex w-full h-full transition-transform duration-1000 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
                    style={{
                      transform: `translate3d(-${safeGalleryIdx * 100}%, 0, 0)`,
                    }}
                  >
                    {effectiveGalleryPhotos.map((photo, idx) => {
                      const isSlideActive = idx === safeGalleryIdx;
                      const slideFitMode = photo.adjustment?.fitMode;
                      return (
                        <div
                          key={photo.id || idx}
                          onClick={() => setSelectedPhoto(photo)}
                          className="relative w-full h-full shrink-0 overflow-hidden cursor-pointer group bg-stone-950"
                        >
                          {/* Ambient Blurred Backdrop so custom/portrait crops never have harsh black bars or get cut off */}
                          <img
                            src={photo.imageUrl}
                            alt=""
                            aria-hidden="true"
                            className="absolute inset-0 w-full h-full object-cover object-center blur-2xl scale-110 opacity-55 pointer-events-none"
                          />
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className={`relative z-10 w-full h-full object-contain object-center transition-transform duration-1000 ease-out ${
                              isSlideActive && slideFitMode !== 'contain'
                                ? 'animate-ken-burns'
                                : ''
                            }`}
                            style={getPhotoAdjustStyle(photo.adjustment)}
                          />
                          {/* Soft Gradient Overlay for Caption & Bottom Dots */}
                          <div className="absolute inset-0 z-10 bg-gradient-to-t from-stone-950/85 via-stone-950/10 to-transparent pointer-events-none" />

                          {/* Top Category Pill */}
                          {photo.category && photo.category.trim() !== '' && (
                            <div className="absolute top-3.5 sm:top-5 left-3.5 sm:left-5 z-20 flex items-center gap-2 pointer-events-none">
                              <span className="px-3 py-1 rounded-full bg-stone-950/55 backdrop-blur-md border border-[#D4AF37]/45 text-[#F3D77D] text-[10px] sm:text-xs font-bold uppercase tracking-wider">
                                {photo.category}
                              </span>
                            </div>
                          )}

                          {/* Photo Title & Caption Centered Above the Bottom Dots */}
                          <div className="absolute bottom-11 sm:bottom-14 left-4 sm:left-8 right-4 sm:right-8 z-20 text-center text-white pointer-events-none">
                            <h3 className="font-editorial text-base sm:text-2xl font-bold drop-shadow-sm truncate">
                              {photo.title}
                            </h3>
                            {photo.caption && (
                              <p className="text-[11px] sm:text-sm text-stone-200/95 mt-0.5 line-clamp-1 drop-shadow-xs">
                                {photo.caption}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Centered Small Dots Overlaid on Bottom of Photo (No Navigation Arrows) */}
                  <div
                    className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-950/45 backdrop-blur-md border border-white/25 shadow-lg"
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
                              ? 'w-3 h-3 sm:w-3.5 sm:h-3.5 bg-[#F3D77D] ring-2 ring-[#D4AF37]/70 scale-110 shadow-[0_0_10px_rgba(243,215,125,0.85)]'
                              : 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white/55 hover:bg-white/95 hover:scale-110'
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Interactive Thumbnail Strip Below Main Gallery Stage */}
                {effectiveGalleryPhotos.length > 1 && (
                  <div className="grid grid-cols-4 gap-2 sm:gap-3 pt-1">
                    {effectiveGalleryPhotos.map((photo, idx) => {
                      const isActive = idx === safeGalleryIdx;
                      return (
                        <button
                          key={`thumb-${photo.id || idx}`}
                          type="button"
                          onClick={() => setActiveGalleryIdx(idx)}
                          onDoubleClick={() => setSelectedPhoto(photo)}
                          title={`${photo.title} (Klik untuk melihat, klik 2x untuk memperbesar)`}
                          className={`group relative aspect-[16/10] rounded-2xl overflow-hidden transition-all duration-300 ${
                            isActive
                              ? 'ring-2 ring-[#D4AF37] border-2 border-white shadow-[0_8px_22px_rgba(197,160,89,0.32)] scale-[1.02]'
                              : 'border border-white/80 opacity-70 hover:opacity-100 hover:scale-[1.01]'
                          }`}
                        >
                          <img
                            src={photo.imageUrl}
                            alt={photo.title}
                            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            style={getPhotoAdjustStyle(photo.adjustment)}
                          />
                          <div
                            className={`absolute inset-0 transition-opacity ${
                              isActive
                                ? 'bg-gradient-to-t from-stone-950/45 via-transparent to-transparent'
                                : 'bg-stone-950/20 group-hover:bg-transparent'
                            }`}
                          />
                          <span className="absolute bottom-1.5 left-2 right-2 text-[10px] font-bold text-white truncate drop-shadow-xs text-left hidden sm:block">
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
      )}

      {/* SECTION: KONFIRMASI KEHADIRAN (RSVP) & BUKU TAMU REAL-TIME (100% SYMMETRICAL EQUAL-SIZE CARDS) */}
      {settings.showRsvpSection !== false && (
        <section id="rsvp" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="inv-reveal inv-reveal-up max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              RSVP &amp; Wedding Wishes
            </span>
            <h2 className="font-editorial text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              {lang === 'ID'
                ? 'Konfirmasi Kehadiran & Doa Restu'
                : 'RSVP & Wedding Wishes'}
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              {lang === 'ID'
                ? 'Konfirmasi kehadiran dan ucapan Anda akan tersimpan otomatis secara real-time'
                : 'Your attendance confirmation and wishes will be saved automatically in real-time'}
            </p>
          </div>

          {/* Equal 2-Column Grid with items-stretch and fixed matched desktop height */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {/* Left Card: RSVP Form (Exact same width & height as Right Card) */}
            <form
              onSubmit={handleRsvpFormSubmit}
              className="inv-reveal inv-reveal-left h-full lg:h-[600px] min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-7 shadow-[0_18px_50px_rgba(175,145,95,0.12)] flex flex-col justify-between text-xs sm:text-sm"
            >
              <div className="space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-stone-200/80 flex-wrap">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Users className="w-5 h-5 text-[#B68D40] shrink-0" />
                    <h3 className="font-editorial text-base sm:text-lg font-bold text-stone-900 truncate">
                      {lang === 'ID' ? 'Form RSVP Kehadiran' : 'RSVP Attendance Form'}
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#9A742B] font-semibold shrink-0">
                    {lang === 'ID' ? 'Konfirmasi Online' : 'Online RSVP'}
                  </span>
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
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <label className="block text-xs font-bold text-stone-700">
                      {lang === 'ID'
                        ? 'Nama Lengkap / Gelar *'
                        : 'Full Name / Title *'}
                    </label>
                    {guests.length > 0 && (
                      <span className="text-[10px] font-semibold text-[#9A742B]">
                        {lang === 'ID'
                          ? `🔍 Ketik nama untuk cari dari ${guests.length} tamu terdaftar`
                          : `🔍 Type your name to search ${guests.length} registered guests`}
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    value={rsvpName}
                    onFocus={() => setShowGuestSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowGuestSuggestions(false), 180)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setRsvpName(val);
                      setShowGuestSuggestions(true);
                      const exact = guests.find(
                        (g) =>
                          g.guestName.trim().toLowerCase() ===
                            val.trim().toLowerCase() ||
                          g.invitationCode.trim().toLowerCase() ===
                            val.trim().toLowerCase()
                      );
                      if (exact) {
                        applyGuestToForm(exact);
                      } else if (
                        selectedGuestFromSearch &&
                        val.trim().toLowerCase() !==
                          selectedGuestFromSearch.guestName.trim().toLowerCase()
                      ) {
                        setSelectedGuestFromSearch(null);
                      }
                    }}
                    placeholder={
                      lang === 'ID'
                        ? 'Contoh: Bpk. Budi Santoso (Ketik untuk cari database tamu)'
                        : 'Example: Mr. John Doe (Type to search guest database)'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                  />

                  {showGuestSuggestions && matchingGuestSuggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-48 overflow-y-auto rounded-2xl bg-white border border-[#D4AF37]/50 shadow-xl divide-y divide-stone-100 z-30">
                      {matchingGuestSuggestions.map((guest) => (
                        <button
                          key={guest.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyGuestToForm(guest);
                          }}
                          className="w-full px-3.5 py-2 text-left hover:bg-[#FAF3E3]/70 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {guest.guestName}
                            </p>
                            <p className="text-[10px] text-stone-500 truncate">
                              {guest.institution || guest.guestType} &bull;{' '}
                              {guest.confirmedPax || guest.pax || 2} Pax
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/40 font-mono text-[10px] font-bold text-[#8B6914] shrink-0">
                            {guest.invitationCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
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
                  <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                    <label className="block text-xs font-bold text-stone-700">
                      {lang === 'ID' ? 'Sesi Kehadiran' : 'Event Session'}
                    </label>
                    <span className="text-[10px] font-semibold text-[#9A742B]">
                      {lang === 'ID'
                        ? `Sinkron Jadwal Acara Database (${visibleEvents.length} Sesi)`
                        : `Synced Event Schedule (${visibleEvents.length} Sessions)`}
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
                    {lang === 'ID'
                      ? 'Ucapan & Doa Restu untuk Kedua Mempelai'
                      : 'Wedding Wishes & Prayers for the Couple'}
                  </label>
                  <textarea
                    rows={3}
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    placeholder={
                      lang === 'ID'
                        ? 'Tuliskan doa restu dan harapan terbaik Anda...'
                        : 'Write your heartfelt wishes and prayers for the couple...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={isSubmittingRsvp || Boolean(settings.disableRsvpSubmission)}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4 shrink-0" />
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
            <div className="inv-reveal inv-reveal-right h-full lg:h-[600px] min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-7 shadow-[0_18px_50px_rgba(175,145,95,0.12)] flex flex-col justify-between">
              <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-200/80 shrink-0 flex-wrap">
                <div className="flex items-center gap-2.5 min-w-0">
                  <MessageSquareHeart className="w-5 h-5 text-[#B68D40] shrink-0" />
                  <h3 className="font-editorial text-base sm:text-lg font-bold text-stone-900 truncate">
                    {lang === 'ID'
                      ? 'Buku Tamu & Doa Restu'
                      : 'Wedding Guestbook & Wishes'}{' '}
                    ({publicVisibleWishes.length})
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
                    onFocus={() => setShowCoverGuestSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowCoverGuestSuggestions(false), 180)
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      setCoverGuestSearch(val);
                      setShowCoverGuestSuggestions(true);
                      const exact = guests.find(
                        (g) =>
                          g.guestName.trim().toLowerCase() ===
                            val.trim().toLowerCase() ||
                          g.invitationCode.trim().toLowerCase() ===
                            val.trim().toLowerCase()
                      );
                      if (exact) {
                        applyGuestToForm(exact);
                      }
                    }}
                    placeholder={
                      lang === 'ID'
                        ? `Cari nama tamu / kode undangan / ucapan di Buku Tamu...`
                        : `Search guest name / invitation code / wishes in Guestbook...`
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

                {showCoverGuestSuggestions &&
                  coverGuestSearch.trim().length > 0 &&
                  coverMatchingGuests.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 max-h-44 overflow-y-auto rounded-xl bg-white border border-[#D4AF37]/50 shadow-lg divide-y divide-stone-100 z-30">
                      {coverMatchingGuests.map((guest) => (
                        <button
                          key={guest.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            applyGuestToForm(guest);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-[#FAF3E3]/70 flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-stone-900 truncate">
                              {guest.guestName}
                            </p>
                            <p className="text-[10px] text-stone-500 truncate">
                              {guest.institution || guest.guestType} &bull;{' '}
                              {guest.confirmedPax || guest.pax || 2} Pax
                            </p>
                          </div>
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/40 font-mono text-[10px] font-bold text-[#8B6914] shrink-0">
                            {guest.invitationCode}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
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
      )}

      {/* SECTION: AMPLOP DIGITAL & TANDA KASIH (CUSTOMIZABLE + CRYPTO / PAYPAL / BANK / E-WALLET / PHYSICAL GIFT) */}
      {settings.showGiftSection !== false && (
        <section id="gift" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="inv-reveal inv-reveal-up relative min-w-0 overflow-hidden rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-8 text-center shadow-[0_18px_50px_rgba(175,145,95,0.12)]">
            <FloralCornerOrnament position="top-left" size="sm" />
            <FloralCornerOrnament position="top-right" size="sm" />

            <div className="w-12 h-12 rounded-2xl bg-[#FAF3E3] border border-[#D4AF37]/45 flex items-center justify-center mx-auto mb-3 text-[#9A742B] relative z-10">
              <Gift className="w-6 h-6" />
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
            <p className="text-xs sm:text-sm text-stone-600 max-w-2xl mx-auto mb-6 leading-relaxed relative z-10">
              {settings.giftSectionSubtitle?.trim() ||
                (lang === 'ID'
                  ? 'Doa restu Anda merupakan karunia terindah bagi kami. Namun apabila Bapak/Ibu/Saudara/i berkenan memberikan tanda kasih secara digital, kripto, atau pengiriman kado, dapat melalui informasi resmi berikut:'
                  : 'Your prayers and blessings are the greatest gift to us. However, if you wish to send a digital gift, crypto transfer, or wedding present, you may use the official channels below:')}
            </p>

            {settings.bankAccounts.length > 0 && (
              <div
                className={`grid grid-cols-1 gap-4 mb-6 text-left items-stretch relative z-10 ${
                  settings.bankAccounts.length === 1
                    ? 'max-w-md mx-auto'
                    : settings.bankAccounts.length === 2
                    ? 'md:grid-cols-2 max-w-3xl mx-auto'
                    : 'md:grid-cols-3'
                }`}
              >
                {settings.bankAccounts.map((acc) => {
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
                      className={`inv-reveal inv-reveal-zoom relative h-full min-w-0 overflow-hidden rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_12px_32px_rgba(175,145,95,0.14)] border transition-all ${
                        isCrypto
                          ? 'bg-gradient-to-br from-[#FFFDF9] via-amber-50/70 to-[#F3E5C8]/65 border-amber-300/75'
                          : isPaypal
                          ? 'bg-gradient-to-br from-[#FFFDF9] via-sky-50/70 to-[#FAF3E3]/70 border-sky-200/85'
                          : 'bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E3]/80 to-[#F3E5C8]/60 border-[#D4AF37]/45'
                      }`}
                    >
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
                              ? '🪙 CRYPTO / WEB3 WALLET'
                              : isPaypal
                              ? '🌐 PAYPAL INTERNATIONAL'
                              : isEwallet
                              ? '📱 E-WALLET DIGITAL'
                              : '🏦 TRANSFER BANK'}
                          </span>

                          {isCrypto && (
                            <span className="px-2 py-0.5 rounded-md bg-white border border-amber-300/80 text-[10px] font-mono font-bold text-amber-900">
                              {acc.cryptoNetwork ||
                                acc.branchOrNote ||
                                'USDT • TRC20 / BEP20 / ERC20'}
                            </span>
                          )}
                        </div>

                        {/* Luxury Metallic VIP Card Row: EMV Smart Chip + Bank/Issuer Name */}
                        <div className="flex items-center justify-between gap-2 mb-2.5">
                          <GoldEmvChipIcon className="w-10 h-7 drop-shadow-2xs" />
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
                          <p className="text-[11px] text-stone-500 mt-0.5 break-words">
                            {acc.branchOrNote}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 space-y-2">
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
                              <Copy className="w-3.5 h-3.5 shrink-0" />
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
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] text-xs font-bold transition-all"
                    >
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
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider">
                            🎁{' '}
                            {lang === 'ID'
                              ? 'KIRIM KADO / BINGKISAN FISIK'
                              : 'PHYSICAL WEDDING GIFT ADDRESS'}
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
                            <Copy className="w-3.5 h-3.5 shrink-0" />
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
          </div>
        </section>
      )}

      {/* CLOSING FOOTER CARD (HIGH-CONTRAST PEARL & CHAMPAGNE GOLD CARD) */}
      <footer className="relative z-10 pt-2 pb-10 sm:pb-12 px-3 sm:px-4 max-w-5xl mx-auto">
        <div className="inv-reveal inv-reveal-up relative overflow-hidden rounded-3xl bg-white/92 backdrop-blur-xl border border-white/95 p-6 sm:p-10 text-center shadow-[0_18px_50px_rgba(175,145,95,0.16)]">
          <FloralCornerOrnament position="top-left" />
          <FloralCornerOrnament position="top-right" />
          <FloralCornerOrnament position="bottom-left" />
          <FloralCornerOrnament position="bottom-right" />

          {/* Subtle Top & Bottom Champagne Gold Accent Lines */}
          <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-5 relative z-10" />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#F3E5C8] border border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B] shadow-sm mb-3.5 relative z-10">
            <WeddingRingsIcon className="w-7 h-7" />
          </div>

          <span className="text-[11px] uppercase tracking-[0.28em] text-[#9A742B] font-bold block mb-2 relative z-10">
            Thank You &amp; Blessing
          </span>

          <p className="text-xs sm:text-base text-stone-700 font-medium leading-relaxed max-w-2xl mx-auto mb-6 relative z-10">
            {settings.invitationClosingText}
          </p>

          {/* Inner Champagne Gold Couple Signature Box */}
          <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-[#FAF3E3]/75 border border-[#D4AF37]/40 px-5 py-4 sm:py-5 shadow-2xs relative z-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A742B] font-bold mb-1">
              {lang === 'ID' ? 'Kami yang berbahagia,' : 'With love & gratitude,'}
            </p>
            <p className="font-script text-3xl sm:text-5xl font-normal text-stone-900 py-1">
              {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                ? settings.groomNickname
                : 'Eko'}{' '}
              <span className="text-[#C5A059]">&amp;</span>{' '}
              {settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
                ? settings.brideNickname
                : 'Selo'}
            </p>
            <p className="font-editorial text-xs sm:text-sm text-stone-700 font-semibold mt-1">
              {settings.groomFullName} &amp; {settings.brideFullName}
            </p>
          </div>

          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent mx-auto mt-6 mb-2.5" />
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#9A742B]/80">
            All-in-One Wedding Planner &amp; Digital Invitation
          </p>

          {renderDeveloperCreditBar(false)}
        </div>
      </footer>

      {/* BOTTOM FLOATING NAVIGATION BAR (MOBILE DOCK WITH VISIBLE ICON + LABEL) */}
      <nav className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-md sm:w-auto sm:max-w-none bg-white/95 backdrop-blur-2xl border border-[#D4AF37]/45 rounded-2xl sm:rounded-full px-1.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_12px_35px_rgba(160,130,85,0.24)] flex items-center justify-around sm:justify-center gap-0.5 sm:gap-2">
        {[
          ...(settings.showCoupleSection !== false
            ? [
                {
                  href: '#mempelai',
                  label: lang === 'ID' ? 'Mempelai' : 'Couple',
                  icon: Heart,
                },
              ]
            : []),
          ...(visibleEvents.length > 0
            ? [
                {
                  href: '#acara',
                  label: lang === 'ID' ? 'Acara' : 'Schedule',
                  icon: Calendar,
                },
              ]
            : []),
          ...(showLoveStory || showGallery
            ? [
                {
                  href: '#galeri',
                  label: showGallery
                    ? lang === 'ID'
                      ? 'Galeri'
                      : 'Gallery'
                    : lang === 'ID'
                    ? 'Kisah'
                    : 'Story',
                  icon: showGallery ? Camera : Heart,
                },
              ]
            : []),
          ...(settings.showRsvpSection !== false
            ? [
                {
                  href: '#rsvp',
                  label: lang === 'ID' ? 'RSVP & Doa' : 'RSVP & Wishes',
                  icon: MessageSquareHeart,
                },
              ]
            : []),
          ...(settings.showGiftSection !== false
            ? [
                {
                  href: '#gift',
                  label: lang === 'ID' ? 'Amplop' : 'Gift',
                  icon: Gift,
                },
              ]
            : []),
        ].map((nav) => {
          const IconComp = nav.icon;
          return (
            <a
              key={nav.href}
              href={nav.href}
              className="flex-1 sm:flex-initial px-1.5 sm:px-3 py-1 sm:py-1.5 rounded-xl sm:rounded-full text-[10px] sm:text-xs font-bold text-stone-700 hover:text-[#8B6914] hover:bg-[#FAF3E3] flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 transition-colors"
            >
              <IconComp className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-[#B68D40] shrink-0" />
              <span className="truncate">{nav.label}</span>
            </a>
          );
        })}
      </nav>

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
                : `${settings.groomFullName} & ${settings.brideFullName}`}
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
