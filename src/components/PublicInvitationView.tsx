'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
} from 'lucide-react';
import {
  WeddingSettings,
  WeddingGuest,
  GuestWish,
  RsvpStatus,
  GalleryPhotoItem,
  MusicTrackItem,
} from '@/types';
import {
  weddingMusicPlayer,
  getEffectiveMusicPlaylist,
  getEffectiveScheduleEvents,
  getEffectiveLoveStory,
  getEffectiveGalleryPhotos,
  getPhotoAdjustStyle,
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
  }) => Promise<void>;
}

const DEFAULT_PREWED_BG =
  'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85';

export const PublicInvitationView: React.FC<PublicInvitationViewProps> = ({
  settings,
  guests,
  wishes,
  guestParamName,
  guestParamCode,
  isAdminLoggedIn,
  onOpenAdminPortal,
  onSubmitRsvp,
}) => {
  const [isOpened, setIsOpened] = useState(false);
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

  // Lookup matched guest from DB if ?code= or ?to= matches
  const matchedGuest = useMemo(() => {
    const cleanCode = (guestParamCode || '').trim().toLowerCase();
    const cleanName = (guestParamName || '').trim().toLowerCase();
    if (!cleanCode && !cleanName) return null;
    return (
      guests.find(
        (g) =>
          (cleanCode && g.invitationCode.toLowerCase() === cleanCode) ||
          (cleanName && g.guestName.trim().toLowerCase() === cleanName)
      ) || null
    );
  }, [guests, guestParamCode, guestParamName]);

  const resolvedGuestDisplayName =
    matchedGuest?.guestName ||
    (guestParamName ? guestParamName.trim() : 'Bapak/Ibu/Saudara/i Tamu Kehormatan');

  const isVipGuest =
    matchedGuest?.priority === 'P1 - VIP' ||
    matchedGuest?.guestType === 'Pejabat/VIP' ||
    /KOMJEN|IRJEN|BRIGJEN|KOMBES|AKBP|JENDERAL/i.test(resolvedGuestDisplayName);

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

  useEffect(() => {
    if (matchedGuest) {
      setRsvpName(matchedGuest.guestName);
      setRsvpInstitution(matchedGuest.institution || '');
      setRsvpPax(matchedGuest.pax || 2);
      if (matchedGuest.rsvpStatus !== 'Belum Konfirmasi') {
        setRsvpStatus(matchedGuest.rsvpStatus);
      }
    } else if (guestParamName) {
      setRsvpName(guestParamName.trim());
    }
  }, [matchedGuest, guestParamName]);

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

  const handleOpenInvitation = () => {
    setIsOpened(true);
    weddingMusicPlayer.start();
    setIsPlayingMusic(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleToggleMusic = () => {
    const nextState = weddingMusicPlayer.toggle();
    setIsPlayingMusic(nextState);
  };

  const handleCopyAccount = (id: string, numberStr: string) => {
    navigator.clipboard.writeText(numberStr);
    setCopiedAccountId(id);
    setTimeout(() => setCopiedAccountId(null), 2500);
  };

  const handleRsvpFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setIsSubmittingRsvp(true);
    try {
      await onSubmitRsvp({
        guestName: rsvpName.trim(),
        invitationCode: matchedGuest?.invitationCode || guestParamCode || undefined,
        institution: rsvpInstitution.trim(),
        relation: matchedGuest?.guestType || 'Tamu Undangan',
        phone: rsvpPhone.trim(),
        rsvpStatus,
        pax: rsvpStatus === 'Hadir' ? Number(rsvpPax) || 1 : 0,
        sessionChoice: rsvpSession,
        message: rsvpMessage.trim(),
      });
      setRsvpSubmittedSuccess(true);
      setRsvpMessage('');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  // ============================================================================
  // 1. COVER PEMBUKA (BRIGHT PREWEDDING SILHOUETTE & FROSTED GLASS GATE)
  // ============================================================================
  if (!isOpened) {
    return (
      <div className="min-h-[100dvh] relative flex flex-col justify-between overflow-x-hidden overflow-y-auto bg-[#FAF8F5] text-stone-800 select-none">
        {/* Background Prewedding Silhouette Photo + Adjustable Luminous Pearl Veil */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <img
            src={coverBgUrl}
            alt="Cover Background"
            className="w-full h-full object-cover object-center transition-transform duration-1000"
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
        <div className="relative z-10 flex items-center justify-between gap-2 px-3.5 sm:px-8 pt-4 sm:pt-5">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-md border border-[#D4AF37]/35 shadow-2xs min-w-0">
            <WeddingRingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#B68D40] shrink-0" />
            <span className="text-[10px] sm:text-[11px] font-semibold tracking-wider sm:tracking-[0.2em] uppercase text-[#8B6914] truncate">
              The Wedding Celebration
            </span>
          </div>

          <button
            type="button"
            onClick={onOpenAdminPortal}
            className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/80 hover:bg-white/95 backdrop-blur-md border border-stone-300/70 text-[10px] sm:text-[11px] text-stone-700 hover:text-[#8B6914] transition-all shadow-2xs shrink-0"
            title="Login Portal Manajemen Pernikahan"
          >
            <Lock className="w-3 h-3 text-[#B68D40]" />
            <span>{isAdminLoggedIn ? 'Dashboard Admin' : 'Portal Admin'}</span>
          </button>
        </div>

        {/* Center Cover Invitation Frosted Glass Card */}
        <div className="relative z-10 max-w-xl mx-auto px-3.5 sm:px-5 py-4 sm:py-6 text-center flex flex-col items-center my-auto w-full">
          <div className="w-full rounded-3xl sm:rounded-[2.25rem] bg-white/75 backdrop-blur-2xl border border-white/95 shadow-[0_25px_70px_rgba(160,130,85,0.18)] p-5 sm:p-10 relative overflow-hidden">
            <div className="absolute -top-20 -left-20 w-44 h-44 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-20 -right-20 w-44 h-44 rounded-full bg-[#D4AF37]/15 blur-2xl pointer-events-none" />

            {/* Pure Neutral Interlocking Wedding Rings Emblem */}
            <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto rounded-full bg-gradient-to-br from-white/95 via-[#FAF6EE] to-[#F3E7D3] border-2 border-[#D4AF37]/45 flex items-center justify-center shadow-[0_10px_30px_rgba(197,160,89,0.22)] mb-3.5 sm:mb-5">
              <WeddingRingsIcon className="w-9 h-9 sm:w-12 sm:h-12 text-[#B68D40]" />
            </div>

            <p className="text-[11px] sm:text-sm uppercase tracking-[0.25em] sm:tracking-[0.3em] text-[#9A742B] font-semibold mb-1.5 sm:mb-2">
              Undangan Pernikahan
            </p>

            <h1 className="font-serif text-2xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-tight mb-1.5 sm:mb-2 break-words">
              {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                ? settings.groomNickname
                : 'Eko'}{' '}
              <span className="text-[#C5A059] font-normal italic">&amp;</span>{' '}
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
                Kepada Yth.
              </p>

              {isVipGuest && (
                <div className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[10px] font-bold uppercase tracking-wider mb-2">
                  <Award className="w-3 h-3" /> Tamu Kehormatan VIP
                </div>
              )}

              <h2 className="font-serif text-base sm:text-2xl font-bold text-stone-900 break-words leading-snug">
                {resolvedGuestDisplayName}
              </h2>

              {matchedGuest?.institution && (
                <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mt-1 break-words">
                  {matchedGuest.institution}
                </p>
              )}

              <p className="text-[10px] sm:text-[11px] text-stone-400 mt-2.5 italic">
                *Mohon maaf apabila terdapat kekeliruan penulisan nama atau gelar
              </p>
            </div>

            {/* Open Invitation Button */}
            <button
              type="button"
              onClick={handleOpenInvitation}
              className="w-full sm:w-auto group relative inline-flex items-center justify-center gap-2.5 px-7 sm:px-8 py-3.5 sm:py-4 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] text-white font-bold text-sm sm:text-base shadow-[0_12px_30px_rgba(197,160,89,0.38)] hover:shadow-[0_15px_35px_rgba(197,160,89,0.55)] hover:scale-[1.02] active:scale-[0.99] transition-all"
            >
              <BookOpen className="w-4 h-4 transition-transform group-hover:rotate-6" />
              <span>Buka Undangan</span>
            </button>
          </div>
        </div>

        {/* Bottom Footer Note */}
        <div className="relative z-10 text-center pb-4 sm:pb-5 px-4">
          <p className="text-[11px] text-stone-500 font-medium">
            {settings.subtitle}
          </p>
        </div>
      </div>
    );
  }

  // ============================================================================
  // 2. MAIN OPENED INVITATION VIEW (SYMMETRICAL CARDS & CUSTOMIZABLE BG)
  // ============================================================================
  return (
    <div className="min-h-screen relative bg-[#FAF8F5] text-stone-800 pb-28 sm:pb-24 overflow-x-hidden selection:bg-[#D4AF37]/25 selection:text-stone-900">
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
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-[#D4AF37]/25 shadow-[0_4px_25px_rgba(180,150,100,0.08)]">
        <div className="max-w-5xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#FAF3E3] to-[#EFE1C6] border border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B] shrink-0 shadow-2xs">
              <WeddingRingsIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="truncate">
              <p className="font-serif text-xs sm:text-base font-bold text-stone-900 truncate">
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
            {/* Compact Play/Pause + Playlist & Volume Trigger */}
            <div className="inline-flex items-center rounded-full border border-[#D4AF37]/45 bg-white/90 shadow-2xs overflow-hidden">
              <button
                type="button"
                onClick={handleToggleMusic}
                className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all ${
                  isPlayingMusic
                    ? 'bg-[#FAF3E3] text-[#8B6914]'
                    : 'text-stone-600 hover:bg-stone-50'
                }`}
                title={isPlayingMusic ? 'Jeda Musik (Pause)' : 'Putar Musik (Play)'}
              >
                {isPlayingMusic ? (
                  <Pause className="w-3.5 h-3.5 text-[#B68D40]" />
                ) : (
                  <Play className="w-3.5 h-3.5 text-[#B68D40]" />
                )}
                <span className="hidden sm:inline max-w-[130px] truncate">
                  {currentTrack?.title || settings.musicTitle || 'Musik'}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setIsMusicPopoverOpen((v) => !v)}
                className={`px-2 sm:px-2.5 py-1.5 border-l border-[#D4AF37]/30 text-xs font-bold inline-flex items-center gap-1 transition-all ${
                  isMusicPopoverOpen
                    ? 'bg-[#B68D40] text-white'
                    : 'bg-white hover:bg-[#FAF3E3] text-[#8B6914]'
                }`}
                title="Buka Playlist & Pengaturan Volume"
              >
                <ListMusic className="w-3.5 h-3.5" />
                <span className="text-[10px] font-extrabold">{playlist.length}</span>
              </button>
            </div>

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
              onClick={onOpenAdminPortal}
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/90 hover:bg-[#FAF3E3] border border-[#D4AF37]/35 text-xs font-bold text-stone-700 hover:text-[#8B6914] transition-all shadow-2xs"
            >
              <Lock className="w-3.5 h-3.5 text-[#B68D40]" />
              <span>{isAdminLoggedIn ? 'Dashboard' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* HERO PREWEDDING SILHOUETTE BANNER & LIVE COUNTDOWN */}
      <section className="relative z-10 overflow-hidden pt-4 sm:pt-8 pb-8 sm:pb-12 px-3 sm:px-4">
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-3xl sm:rounded-[2.5rem] overflow-hidden border border-white/95 shadow-[0_25px_70px_rgba(160,130,85,0.16)] bg-white/75 backdrop-blur-xl">
            {/* Prewedding Silhouette Image Header (16:9 matching Crop Studio) */}
            <div className="relative w-full aspect-[16/9] max-h-[520px] overflow-hidden bg-stone-900">
              <img
                src={heroBgUrl}
                alt="Prewedding Banner"
                className="w-full h-full object-cover object-center"
                style={getPhotoAdjustStyle(settings.photoAdjustments?.heroPrewedUrl)}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white via-white/30 to-transparent pointer-events-none" />
              <div className="absolute top-3.5 sm:top-4 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full bg-white/85 backdrop-blur-md border border-[#D4AF37]/40 text-[#8B6914] text-[10px] sm:text-xs font-semibold tracking-wider sm:tracking-widest uppercase shadow-xs whitespace-nowrap">
                <WeddingRingsIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span>Holy Matrimony &amp; Reception</span>
              </div>
            </div>

            {/* Hero Content Overlapping Frosted Area */}
            <div className="px-4 sm:px-6 pb-7 sm:pb-10 pt-2 text-center -mt-12 sm:-mt-14 relative z-10">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto rounded-full bg-white/95 border border-[#D4AF37]/45 flex items-center justify-center text-[#B68D40] shadow-md mb-3.5 sm:mb-4">
                <WeddingRingsIcon className="w-8 h-8 sm:w-9 sm:h-9" />
              </div>

              <h1 className="font-serif text-2xl sm:text-5xl md:text-6xl font-bold text-stone-900 tracking-tight leading-snug mb-3 break-words">
                {settings.groomFullName}
                <span className="block text-lg sm:text-3xl font-normal italic text-[#B68D40] my-1 sm:my-1.5">
                  &amp;
                </span>
                {settings.brideFullName}
              </h1>

              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-stone-600 leading-relaxed mb-6 sm:mb-8">
                {settings.invitationOpeningText}
              </p>

              {/* Countdown Timer Boxes (Conditional via enableCountdown Switch) */}
              {activeCountdownEvent && (
                <div className="max-w-lg mx-auto mb-6 sm:mb-8 space-y-3">
                  {countdownEvents.length > 1 ? (
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
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] sm:text-xs font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Menuju {activeCountdownEvent.title}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-2 sm:gap-4 items-stretch">
                    {[
                      { label: 'Hari', value: countdown.days },
                      { label: 'Jam', value: countdown.hours },
                      { label: 'Menit', value: countdown.minutes },
                      { label: 'Detik', value: countdown.seconds },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="h-full rounded-2xl bg-white/90 backdrop-blur-md border border-[#D4AF37]/35 p-2.5 sm:p-4 shadow-[0_8px_25px_rgba(180,150,100,0.10)] flex flex-col items-center justify-center"
                      >
                        <div className="font-serif text-xl sm:text-4xl font-bold text-[#9A742B]">
                          {String(item.value).padStart(2, '0')}
                        </div>
                        <div className="text-[10px] sm:text-xs uppercase tracking-wider sm:tracking-widest text-stone-500 font-semibold mt-0.5">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Verse / Quote Card (Conditional via showQuoteSection) */}
              {settings.showQuoteSection !== false && settings.quoteVerse && (
                <div className="max-w-2xl mx-auto rounded-2xl bg-[#FAF6EE]/90 border border-[#D4AF37]/35 p-4 sm:p-6 shadow-2xs">
                  <p className="font-serif italic text-xs sm:text-base text-stone-700 leading-relaxed mb-2">
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
        </div>
      </section>

      {/* SECTION: PROFIL MEMPELAI (100% SYMMETRICAL 2-COLUMN CARDS) */}
      {settings.showCoupleSection !== false && (
        <section id="mempelai" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              The Happy Couple
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              Profil Kedua Mempelai
            </h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-2.5" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 items-stretch">
            {/* Groom Card */}
            <div className="h-full rounded-3xl bg-white/80 backdrop-blur-xl border border-white/95 p-5 sm:p-8 text-center flex flex-col items-center justify-between shadow-[0_18px_50px_rgba(175,145,95,0.12)]">
              <div className="flex flex-col items-center w-full">
                <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full p-1.5 bg-gradient-to-br from-[#E6C994] via-[#D4AF37] to-[#B68D40] shadow-lg mb-4 sm:mb-5 overflow-hidden shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-stone-100 relative">
                    <img
                      src={settings.groomPhotoUrl}
                      alt={settings.groomFullName}
                      className="w-full h-full object-cover object-center"
                      style={getPhotoAdjustStyle(settings.photoAdjustments?.groomPhotoUrl)}
                    />
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[11px] font-bold uppercase tracking-wider mb-2.5">
                  {settings.groomRankAndTitle || 'Mempelai Pria'}
                </span>
                <h3 className="font-serif text-xl sm:text-3xl font-bold text-stone-900 mb-1 break-words">
                  {settings.groomFullName}
                </h3>
                <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3 min-h-[1.25rem]">
                  {settings.groomUnit || settings.groomOrigin}
                </p>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                  {settings.groomParents}
                </p>
              </div>
              <div className="pt-3 border-t border-stone-200/80 w-full flex items-center justify-center gap-2 text-xs text-stone-500 font-medium mt-auto">
                <MapPin className="w-3.5 h-3.5 text-[#B68D40]" />
                <span>{settings.groomOrigin}</span>
              </div>
            </div>

            {/* Bride Card */}
            <div className="h-full rounded-3xl bg-white/80 backdrop-blur-xl border border-white/95 p-5 sm:p-8 text-center flex flex-col items-center justify-between shadow-[0_18px_50px_rgba(175,145,95,0.12)]">
              <div className="flex flex-col items-center w-full">
                <div className="w-32 h-32 sm:w-44 sm:h-44 rounded-full p-1.5 bg-gradient-to-br from-[#E6C994] via-[#D4AF37] to-[#B68D40] shadow-lg mb-4 sm:mb-5 overflow-hidden shrink-0">
                  <div className="w-full h-full rounded-full overflow-hidden bg-stone-100 relative">
                    <img
                      src={settings.bridePhotoUrl}
                      alt={settings.brideFullName}
                      className="w-full h-full object-cover object-center"
                      style={getPhotoAdjustStyle(settings.photoAdjustments?.bridePhotoUrl)}
                    />
                  </div>
                </div>
                <span className="px-3.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[11px] font-bold uppercase tracking-wider mb-2.5">
                  {settings.brideTitle || 'Mempelai Wanita'}
                </span>
                <h3 className="font-serif text-xl sm:text-3xl font-bold text-stone-900 mb-1 break-words">
                  {settings.brideFullName}
                </h3>
                <p className="text-xs sm:text-sm text-[#9A742B] font-semibold mb-3 min-h-[1.25rem]">
                  {settings.brideOrigin}
                </p>
                <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mb-4">
                  {settings.brideParents}
                </p>
              </div>
              <div className="pt-3 border-t border-stone-200/80 w-full flex items-center justify-center gap-2 text-xs text-stone-500 font-medium mt-auto">
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
          <div className="max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              Save The Date
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              Rangkaian Acara Pernikahan
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
                className={`h-full rounded-3xl p-5 sm:p-7 flex flex-col justify-between transition-all backdrop-blur-xl ${
                  ev.highlight
                    ? 'bg-gradient-to-b from-white/95 via-[#FFFDF9]/95 to-[#FAF3E3]/90 border-2 border-[#D4AF37]/60 shadow-[0_20px_55px_rgba(197,160,89,0.20)]'
                    : 'bg-white/80 border border-white/95 shadow-[0_15px_45px_rgba(175,145,95,0.12)]'
                }`}
              >
                <div className="flex flex-col flex-1">
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="px-3 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold uppercase tracking-wider">
                      {ev.badge}
                    </span>
                    <WeddingRingsIcon className="w-5 h-5 text-[#C5A059]" />
                  </div>

                  <h3 className="font-serif text-xl sm:text-2xl font-bold text-stone-900 mb-1">
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
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>Buka Lokasi di Google Maps</span>
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
          <div className="max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              {settings.gallerySectionSubtitle?.trim() || 'Our Journey & Moments'}
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              {settings.gallerySectionTitle?.trim() ||
                (showLoveStory && showGallery
                  ? 'Kisah Kasih & Galeri Momen'
                  : showLoveStory
                  ? 'Kisah Kasih Perjalanan Cinta'
                  : 'Galeri Momen Bahagia')}
            </h2>
            <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mt-3" />
          </div>

          {/* Love Story Timeline Cards */}
          {showLoveStory &&
            (effectiveLoveStory.length > 0 ? (
              <div
                className={`grid grid-cols-1 gap-4 sm:gap-5 mb-8 sm:mb-10 items-stretch ${
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
                    className="h-full rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-6 shadow-[0_14px_40px_rgba(175,145,95,0.10)] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#9A742B] bg-[#FAF3E3] px-3 py-0.5 rounded-full border border-[#D4AF37]/35">
                          {story.dateLabel}
                        </span>
                        <Heart className="w-4 h-4 text-[#C5A059]" />
                      </div>
                      <h3 className="font-serif text-lg font-bold text-stone-900 mb-1.5">
                        {story.title}
                      </h3>
                      <p className="text-xs text-stone-600 leading-relaxed">
                        {story.description}
                      </p>
                    </div>
                    {story.location && (
                      <div className="pt-3 mt-4 border-t border-stone-200/60 text-[11px] text-stone-500 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-[#B68D40]" />
                        <span>{story.location}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-xl mx-auto mb-8 sm:mb-10 rounded-3xl bg-white/85 backdrop-blur-xl border border-[#D4AF37]/35 p-6 text-center shadow-[0_14px_40px_rgba(175,145,95,0.10)]">
                <Heart className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                <p className="font-serif font-bold text-stone-800 text-base">
                  Kisah Perjalanan Cinta
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Belum ada momen perjalanan cinta yang ditambahkan.
                </p>
              </div>
            ))}

          {/* Smooth Auto-Sliding Photo Gallery Carousel (Steam-Style with Bottom-Center Dots Over Photo, No Navigation Arrows) */}
          {showGallery &&
            (effectiveGalleryPhotos.length > 0 ? (
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
                  {effectiveGalleryPhotos.map((photo, idx) => (
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
                        className="relative z-10 w-full h-full object-contain object-center transition-transform duration-1000 ease-out"
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
                        <h3 className="font-serif text-base sm:text-2xl font-bold drop-shadow-sm truncate">
                          {photo.title}
                        </h3>
                        {photo.caption && (
                          <p className="text-[11px] sm:text-sm text-stone-200/95 mt-0.5 line-clamp-1 drop-shadow-xs">
                            {photo.caption}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
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
            ) : (
              <div className="max-w-xl mx-auto rounded-3xl bg-white/85 backdrop-blur-xl border border-[#D4AF37]/35 p-6 text-center shadow-[0_14px_40px_rgba(175,145,95,0.10)]">
                <Sparkles className="w-6 h-6 text-[#C5A059] mx-auto mb-2" />
                <p className="font-serif font-bold text-stone-800 text-base">
                  Galeri Momen Bahagia
                </p>
                <p className="text-xs text-stone-500 mt-1">
                  Belum ada foto prewedding yang ditambahkan ke galeri.
                </p>
              </div>
            ))}
        </section>
      )}

      {/* SECTION: KONFIRMASI KEHADIRAN (RSVP) & BUKU TAMU REAL-TIME (100% SYMMETRICAL EQUAL-SIZE CARDS) */}
      {settings.showRsvpSection !== false && (
        <section id="rsvp" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="max-w-xl mx-auto text-center mb-7 sm:mb-10 rounded-3xl bg-white/88 backdrop-blur-xl border border-white/95 px-5 py-4 sm:py-5 shadow-[0_14px_40px_rgba(175,145,95,0.12)]">
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              RSVP &amp; Wedding Wishes
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-stone-900 mt-1">
              Konfirmasi Kehadiran &amp; Doa Restu
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 mt-1">
              Konfirmasi kehadiran dan ucapan Anda akan tersimpan otomatis secara real-time
            </p>
          </div>

          {/* Equal 2-Column Grid with items-stretch and fixed matched desktop height */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
            {/* Left Card: RSVP Form (Exact same width & height as Right Card) */}
            <form
              onSubmit={handleRsvpFormSubmit}
              className="h-full lg:h-[600px] rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-7 shadow-[0_18px_50px_rgba(175,145,95,0.12)] flex flex-col justify-between text-xs sm:text-sm"
            >
              <div className="space-y-3.5 sm:space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-200/80">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-[#B68D40]" />
                    <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                      Form RSVP Kehadiran
                    </h3>
                  </div>
                  <span className="text-[11px] text-[#9A742B] font-semibold">
                    Konfirmasi Online
                  </span>
                </div>

                {rsvpSubmittedSuccess && (
                  <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-2.5 text-xs font-medium">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        Terima kasih atas konfirmasi &amp; doa restu Anda!
                      </p>
                      <p className="text-emerald-700 mt-0.5">
                        Data kehadiran dan ucapan Anda telah tersimpan di buku tamu.
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Nama Lengkap / Gelar *
                  </label>
                  <input
                    type="text"
                    required
                    value={rsvpName}
                    onChange={(e) => setRsvpName(e.target.value)}
                    placeholder="Contoh: Bpk. Budi Santoso"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Instansi / Kerabat
                    </label>
                    <input
                      type="text"
                      value={rsvpInstitution}
                      onChange={(e) => setRsvpInstitution(e.target.value)}
                      placeholder="Keluarga / Rekan Kerja"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      No. WhatsApp (Opsional)
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
                      Status Kehadiran *
                    </label>
                    <select
                      value={rsvpStatus}
                      onChange={(e) => setRsvpStatus(e.target.value as RsvpStatus)}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                    >
                      <option value="Hadir">Hadir</option>
                      <option value="Tidak Hadir">Berhalangan Hadir</option>
                      <option value="Masih Ragu">Masih Ragu</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      Jumlah Orang (Pax)
                    </label>
                    <select
                      value={rsvpPax}
                      onChange={(e) => setRsvpPax(Number(e.target.value))}
                      disabled={rsvpStatus === 'Tidak Hadir'}
                      className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none disabled:opacity-50"
                    >
                      {[1, 2, 3, 4, 5].map((n) => (
                        <option key={n} value={n}>
                          {n} Orang
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Sesi Kehadiran
                  </label>
                  <select
                    value={rsvpSession}
                    onChange={(e) =>
                      setRsvpSession(e.target.value as WeddingGuest['sessionChoice'])
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none"
                  >
                    <option value="Pemberkatan & Resepsi">
                      {settings.event2Title} &amp; {settings.event3Title}
                    </option>
                    <option value="Resepsi Saja">{settings.event3Title} Saja</option>
                    <option value="Biston & Pemberkatan">
                      {settings.event1Title} &amp; {settings.event2Title}
                    </option>
                    <option value="Semua Sesi">Semua Rangkaian Acara</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Ucapan &amp; Doa Restu untuk Kedua Mempelai
                  </label>
                  <textarea
                    rows={3}
                    value={rsvpMessage}
                    onChange={(e) => setRsvpMessage(e.target.value)}
                    placeholder="Tuliskan doa restu dan harapan terbaik Anda..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-900 focus:border-[#C5A059] focus:outline-none resize-none"
                  />
                </div>
              </div>

              <div className="pt-4 mt-auto">
                <button
                  type="submit"
                  disabled={isSubmittingRsvp}
                  className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmittingRsvp
                      ? 'Menyimpan Konfirmasi...'
                      : 'Kirim Konfirmasi & Ucapan'}
                  </span>
                </button>
              </div>
            </form>

            {/* Right Card: Live Guestbook Wishes Feed (Exact same width & height as Left Card) */}
            <div className="h-full lg:h-[600px] rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-7 shadow-[0_18px_50px_rgba(175,145,95,0.12)] flex flex-col justify-between">
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200/80 shrink-0">
                <div className="flex items-center gap-2.5">
                  <MessageSquareHeart className="w-5 h-5 text-[#B68D40]" />
                  <h3 className="font-serif text-base sm:text-lg font-bold text-stone-900">
                    Buku Tamu &amp; Doa Restu ({wishes.length})
                  </h3>
                </div>
                <span className="text-[11px] text-[#9A742B] font-semibold">
                  Real-Time Feed
                </span>
              </div>

              <div className="flex-1 max-h-[380px] lg:max-h-none overflow-y-auto space-y-3 pr-1">
                {wishes.length === 0 ? (
                  <div className="h-full min-h-[260px] sm:min-h-[320px] rounded-2xl border border-dashed border-[#D4AF37]/40 bg-[#FAF8F5]/80 p-5 sm:p-6 flex flex-col items-center justify-center text-center">
                    <div className="w-12 h-12 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 flex items-center justify-center text-[#B68D40] mb-3">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <h4 className="font-serif text-base font-bold text-stone-800 mb-1">
                      Belum Ada Ucapan &amp; Doa
                    </h4>
                    <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                      Jadilah yang pertama menuliskan ucapan selamat dan doa restu untuk kedua mempelai melalui formulir di samping.
                    </p>
                  </div>
                ) : (
                  wishes.map((w) => (
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
                                <Pin className="w-2.5 h-2.5" /> Disematkan
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
                            Balasan Mempelai:
                          </span>
                          {w.replyFromCouple}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-3 mt-4 border-t border-stone-200/80 flex items-center justify-between gap-2 text-[11px] text-stone-500 shrink-0">
                <span className="truncate">Tersinkronisasi otomatis ke Dashboard</span>
                <span className="font-semibold text-[#9A742B] shrink-0">
                  {wishes.length} Doa Restu
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* SECTION: AMPLOP DIGITAL / WEDDING GIFT (CONDITIONAL & SYMMETRICAL) */}
      {settings.showGiftSection !== false && (
        <section id="gift" className="relative z-10 py-8 sm:py-10 px-3 sm:px-4 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-white/85 backdrop-blur-xl border border-white/95 p-5 sm:p-8 text-center shadow-[0_18px_50px_rgba(175,145,95,0.12)]">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF3E3] border border-[#D4AF37]/45 flex items-center justify-center mx-auto mb-3 text-[#9A742B]">
              <Gift className="w-6 h-6" />
            </div>
            <span className="text-xs uppercase tracking-[0.25em] text-[#9A742B] font-bold">
              Wedding Gift
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 mt-1 mb-2">
              Amplop Digital &amp; Tanda Kasih
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto mb-6">
              Doa restu Bapak/Ibu/Saudara/i merupakan karunia terindah bagi kami. Namun apabila ingin memberikan tanda kasih secara digital, dapat melalui informasi berikut:
            </p>

            {settings.bankAccounts.length > 0 && (
              <div
                className={`grid grid-cols-1 gap-4 mb-6 text-left items-stretch ${
                  settings.bankAccounts.length === 1
                    ? 'max-w-md mx-auto'
                    : settings.bankAccounts.length === 2
                    ? 'md:grid-cols-2 max-w-2xl mx-auto'
                    : 'md:grid-cols-3'
                }`}
              >
                {settings.bankAccounts.map((acc) => {
                  const isCopied = copiedAccountId === acc.id;
                  return (
                    <div
                      key={acc.id}
                      className="h-full rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/30 p-4 sm:p-5 flex flex-col justify-between shadow-2xs"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-[#9A742B] block mb-1">
                          {acc.bankName}
                        </span>
                        <p className="font-mono text-base sm:text-lg font-bold text-stone-900 tracking-wider mb-1 break-all">
                          {acc.accountNumber}
                        </p>
                        <p className="text-xs font-semibold text-stone-700">
                          a.n. {acc.accountHolder}
                        </p>
                        {acc.branchOrNote && (
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            {acc.branchOrNote}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyAccount(acc.id, acc.accountNumber)}
                        className={`mt-4 w-full py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                          isCopied
                            ? 'bg-emerald-600 text-white'
                            : 'bg-white hover:bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40'
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Nomor Disalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Salin No. Rekening</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {(settings.showQrisButton !== false || settings.giftShippingAddress) && (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-stone-200/80 text-xs text-stone-600">
                {settings.showQrisButton !== false && (
                  <button
                    type="button"
                    onClick={() => setShowQrisModal(true)}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] font-bold transition-all"
                  >
                    <QrCode className="w-4 h-4" />
                    <span>Tampilkan Barcode QRIS</span>
                  </button>
                )}
                {settings.giftShippingAddress && (
                  <span className="text-stone-500 break-words">
                    Alamat Kirim Kado:{' '}
                    <strong className="text-stone-800">
                      {settings.giftShippingAddress}
                    </strong>
                  </span>
                )}
              </div>
            )}
          </div>
        </section>
      )}

      {/* CLOSING FOOTER CARD (HIGH-CONTRAST PEARL & CHAMPAGNE GOLD CARD) */}
      <footer className="relative z-10 pt-2 pb-10 sm:pb-12 px-3 sm:px-4 max-w-5xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl bg-white/92 backdrop-blur-xl border border-white/95 p-6 sm:p-10 text-center shadow-[0_18px_50px_rgba(175,145,95,0.16)]">
          {/* Subtle Top & Bottom Champagne Gold Accent Lines */}
          <div className="w-28 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent mx-auto mb-5" />

          <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#F3E5C8] border border-[#D4AF37]/50 flex items-center justify-center text-[#9A742B] shadow-sm mb-3.5">
            <WeddingRingsIcon className="w-7 h-7" />
          </div>

          <span className="text-[11px] uppercase tracking-[0.28em] text-[#9A742B] font-bold block mb-2">
            Thank You &amp; Blessing
          </span>

          <p className="text-xs sm:text-base text-stone-700 font-medium leading-relaxed max-w-2xl mx-auto mb-6">
            {settings.invitationClosingText}
          </p>

          {/* Inner Champagne Gold Couple Signature Box */}
          <div className="max-w-md mx-auto rounded-2xl bg-gradient-to-b from-[#FAF8F5] to-[#FAF3E3]/75 border border-[#D4AF37]/40 px-5 py-4 sm:py-5 shadow-2xs">
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#9A742B] font-bold mb-1">
              Kami yang berbahagia,
            </p>
            <p className="font-serif text-2xl sm:text-3xl font-bold text-stone-900 tracking-wide">
              {settings.groomNickname && settings.groomNickname !== 'Mempelai Pria'
                ? settings.groomNickname
                : 'Eko'}{' '}
              <span className="text-[#C5A059] font-normal">&amp;</span>{' '}
              {settings.brideNickname && settings.brideNickname !== 'Mempelai Wanita'
                ? settings.brideNickname
                : 'Selo'}
            </p>
            <p className="text-[11px] sm:text-xs text-stone-600 font-medium mt-1.5">
              {settings.groomFullName} &amp; {settings.brideFullName}
            </p>
          </div>

          <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent mx-auto mt-6 mb-2.5" />
          <p className="text-[11px] font-semibold tracking-wider uppercase text-[#9A742B]/80">
            All-in-One Wedding Planner &amp; Digital Invitation
          </p>
        </div>
      </footer>

      {/* BOTTOM FLOATING NAVIGATION BAR (MOBILE DOCK WITH VISIBLE ICON + LABEL) */}
      <nav className="fixed bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.25rem)] max-w-md sm:w-auto sm:max-w-none bg-white/95 backdrop-blur-2xl border border-[#D4AF37]/45 rounded-2xl sm:rounded-full px-1.5 sm:px-3.5 py-1.5 sm:py-2 shadow-[0_12px_35px_rgba(160,130,85,0.24)] flex items-center justify-around sm:justify-center gap-0.5 sm:gap-2">
        {[
          ...(settings.showCoupleSection !== false
            ? [{ href: '#mempelai', label: 'Mempelai', icon: Heart }]
            : []),
          ...(visibleEvents.length > 0
            ? [{ href: '#acara', label: 'Acara', icon: Calendar }]
            : []),
          ...(showLoveStory || showGallery
            ? [
                {
                  href: '#galeri',
                  label: showGallery ? 'Galeri' : 'Kisah',
                  icon: showGallery ? Camera : Heart,
                },
              ]
            : []),
          ...(settings.showRsvpSection !== false
            ? [{ href: '#rsvp', label: 'RSVP & Doa', icon: MessageSquareHeart }]
            : []),
          ...(settings.showGiftSection !== false
            ? [{ href: '#gift', label: 'Amplop', icon: Gift }]
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
