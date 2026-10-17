'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Heart,
  Calendar,
  MapPin,
  Clock,
  Music,
  VolumeX,
  Send,
  Copy,
  Check,
  Gift,
  Sparkles,
  CheckCircle2,
  Users,
  MessageSquareHeart,
  Shield,
  ExternalLink,
  QrCode,
  BookOpen,
  Camera,
  Lock,
  ChevronRight,
  Award,
  Pin,
  X,
} from 'lucide-react';
import {
  WeddingSettings,
  WeddingGuest,
  GuestWish,
  RsvpStatus,
  GalleryPhotoItem,
} from '@/types';
import { weddingMusicPlayer } from '@/lib/clientSync';

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
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const [copiedAccountId, setCopiedAccountId] = useState<string | null>(null);
  const [showQrisModal, setShowQrisModal] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<GalleryPhotoItem | null>(null);

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

  // Countdown state to Wedding Day (19 Dec 2026)
  const [countdown, setCountdown] = useState({
    days: 62,
    hours: 10,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const updateTimer = () => {
      const target = new Date(settings.weddingDatetime || '2026-12-19T09:00:00+07:00').getTime();
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
  }, [settings.weddingDatetime]);

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

  const handleOpenInvitation = (withMusic: boolean) => {
    setIsOpened(true);
    if (withMusic) {
      const started = weddingMusicPlayer.start();
      setIsPlayingMusic(started);
    }
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleToggleMusic = () => {
    const nextState = weddingMusicPlayer.toggle();
    setIsPlayingMusic(nextState);
  };

  const handleCopyAccount = (id: string, numberStr: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(numberStr);
      setCopiedAccountId(id);
      setTimeout(() => setCopiedAccountId(null), 2500);
    }
  };

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rsvpName.trim()) return;
    setIsSubmittingRsvp(true);
    try {
      await onSubmitRsvp({
        guestName: rsvpName.trim(),
        invitationCode: matchedGuest?.invitationCode || guestParamCode || undefined,
        institution: rsvpInstitution.trim() || undefined,
        phone: rsvpPhone.trim() || undefined,
        rsvpStatus,
        pax: rsvpStatus === 'Hadir' ? rsvpPax : 0,
        sessionChoice: rsvpSession,
        message: rsvpMessage.trim() || undefined,
      });
      setRsvpSubmittedSuccess(true);
      setRsvpMessage('');
    } finally {
      setIsSubmittingRsvp(false);
    }
  };

  const scrollToSection = (id: string) => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // COVER PEMBUKA FULLSCREEN (Sebelum Klik "Buka Undangan")
  if (!isOpened) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#061020] via-[#0A192F] to-[#061020] text-white flex flex-col justify-between relative overflow-hidden px-4 py-8 sm:py-12">
        {/* Decorative Luxury Background Glow */}
        <div className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[520px] h-[520px] rounded-full bg-amber-500/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 w-[420px] h-[320px] rounded-full bg-amber-400/10 blur-3xl" />

        {/* Top Bar: Subtle Admin Switcher if Admin is already logged in */}
        <div className="relative z-10 max-w-lg mx-auto w-full flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-amber-400/30 text-amber-300 text-[11px] font-semibold tracking-wider uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            The Wedding Invitation
          </span>
          <button
            type="button"
            onClick={onOpenAdminPortal}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-slate-300 hover:text-amber-300 text-[11px] font-medium transition-colors"
          >
            <Lock className="w-3 h-3" />
            {isAdminLoggedIn ? 'Ke Dashboard Admin' : 'Login Admin'}
          </button>
        </div>

        {/* Center Monogram & Couple Names */}
        <div className="relative z-10 max-w-lg mx-auto w-full my-auto py-6 text-center space-y-6">
          {/* Emblem / Monogram */}
          <div className="mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-amber-300/20 via-amber-500/10 to-transparent border-2 border-amber-400/50 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(197,160,89,0.25)]">
            <Heart className="w-5 h-5 text-amber-300 mb-1 fill-amber-300/30" />
            <span className="font-serif text-2xl sm:text-3xl font-bold tracking-widest text-amber-200">
              E &amp; J
            </span>
          </div>

          <div className="space-y-2">
            <p className="text-xs sm:text-sm uppercase tracking-[0.28em] text-amber-300/90 font-medium">
              Biston &amp; Pemberkatan Nikah Kudus
            </p>
            <h1 className="font-serif text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
              {settings.groomNickname} <span className="text-amber-400 font-normal">&amp;</span>{' '}
              {settings.brideNickname}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium">
              {settings.groomFullName} &bull; {settings.brideFullName}
            </p>
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm text-amber-200/90 bg-amber-500/10 border border-amber-400/25 px-3.5 py-1 rounded-full mt-1">
              <Calendar className="w-3.5 h-3.5 text-amber-300" />
              18 – 19 Desember 2026 &bull; Semarang
            </p>
          </div>

          {/* Personalized Recipient Card from URL ?to=Nama+Tamu */}
          <div className="bg-white/[0.06] backdrop-blur-md border border-amber-400/35 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-3 text-center">
            <p className="text-xs text-slate-300 tracking-wide">
              Kepada Yth. Bapak / Ibu / Saudara / i:
            </p>

            {isVipGuest && (
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/20 border border-amber-300/50 text-amber-200 text-[11px] font-bold tracking-wide">
                <Award className="w-3.5 h-3.5 text-amber-300" />
                TAMU KEHORMATAN / VIP
              </div>
            )}

            <div className="py-1">
              <h2 className="text-lg sm:text-2xl font-extrabold text-amber-200 tracking-wide break-words">
                {resolvedGuestDisplayName}
              </h2>
              {matchedGuest?.institution && (
                <p className="text-xs sm:text-sm font-semibold text-amber-300/80 mt-1">
                  {matchedGuest.institution}
                </p>
              )}
              {matchedGuest?.invitationCode && (
                <span className="inline-block mt-1.5 text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded bg-slate-900/70 text-slate-300 border border-slate-700">
                  Kode Undangan: {matchedGuest.invitationCode} &bull; Kuota {matchedGuest.pax} Pax
                </span>
              )}
            </div>

            <p className="text-[11px] sm:text-xs text-slate-300/80 leading-relaxed">
              Mohon maaf apabila terdapat kesalahan penulisan nama maupun gelar/pangkat.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              <button
                type="button"
                onClick={() => handleOpenInvitation(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 font-extrabold text-sm shadow-[0_8px_25px_rgba(245,158,11,0.35)] transition-all active:scale-[0.99]"
              >
                <BookOpen className="w-4 h-4" />
                Buka Undangan (Dengan Musik)
              </button>
              <button
                type="button"
                onClick={() => handleOpenInvitation(false)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs font-semibold transition-all"
              >
                Tanpa Musik
              </button>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <div className="relative z-10 text-center text-[11px] text-slate-400">
          All-in-One Digital Wedding Invitation &bull; Semarang, 18–19 Desember 2026
        </div>
      </div>
    );
  }

  // ISI LENGKAP UNDANGAN DIGITAL (Setelah dibuka)
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 pb-28 relative">
      {/* Top Sticky Guest Bar */}
      <div className="sticky top-0 z-30 bg-[#0A192F]/95 backdrop-blur-md text-white border-b border-amber-400/30 px-3 sm:px-6 py-2.5 shadow-md">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/50 flex items-center justify-center shrink-0 font-serif font-bold text-amber-300 text-xs">
              E&amp;J
            </div>
            <div className="min-w-0">
              <p className="text-xs sm:text-sm font-bold text-white truncate">
                {settings.groomNickname} &amp; {settings.brideNickname}
              </p>
              <p className="text-[10px] sm:text-xs text-amber-300 truncate">
                Yth. {resolvedGuestDisplayName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={handleToggleMusic}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                isPlayingMusic
                  ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-xs'
                  : 'bg-white/10 text-slate-200 border-white/20 hover:bg-white/15'
              }`}
              title={isPlayingMusic ? 'Matikan Musik Latar' : 'Putar Musik Latar'}
            >
              {isPlayingMusic ? (
                <>
                  <Music className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">Musik Aktif</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Putar Musik</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-amber-400 hover:text-slate-950 text-amber-200 border border-amber-400/30 text-xs font-bold transition-all"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Dashboard Admin' : 'Admin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* SECTION 1: HERO & COUNTDOWN HARI-H */}
      <section
        id="sec-hero"
        className="relative bg-gradient-to-b from-[#0A192F] via-[#112240] to-[#0A192F] text-white py-12 sm:py-20 px-4 overflow-hidden border-b-4 border-amber-500/40"
      >
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-400/15 border border-amber-400/35 text-amber-300 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" />
            Undangan Pernikahan Resmi
          </div>

          <h1 className="font-serif text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white">
            {settings.groomFullName}
            <span className="block text-amber-400 font-normal text-2xl sm:text-4xl my-2">
              &amp;
            </span>
            {settings.brideFullName}
          </h1>

          <p className="max-w-2xl mx-auto text-xs sm:text-base text-slate-200 leading-relaxed">
            {settings.invitationOpeningText}
          </p>

          {/* Sacred Verse Box */}
          <div className="max-w-2xl mx-auto bg-white/[0.06] border border-amber-400/25 rounded-2xl p-4 sm:p-6 backdrop-blur-xs">
            <p className="font-serif italic text-sm sm:text-base text-amber-100 leading-relaxed">
              &ldquo;{settings.quoteVerse}&rdquo;
            </p>
            <p className="text-xs font-bold text-amber-400 mt-2 tracking-wider uppercase">
              — {settings.quoteSource}
            </p>
          </div>

          {/* Live Countdown Hari-H */}
          <div className="pt-4 space-y-3">
            <p className="text-xs uppercase tracking-[0.2em] text-amber-300 font-semibold">
              Menuju Hari Pemberkatan &amp; Resepsi (19 Desember 2026)
            </p>
            <div className="grid grid-cols-4 gap-2.5 sm:gap-4 max-w-md mx-auto">
              {[
                { label: 'Hari', value: countdown.days },
                { label: 'Jam', value: countdown.hours },
                { label: 'Menit', value: countdown.minutes },
                { label: 'Detik', value: countdown.seconds },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-slate-900/90 border border-amber-400/40 rounded-2xl py-3 sm:py-4 px-2 shadow-lg"
                >
                  <div className="text-2xl sm:text-4xl font-extrabold text-amber-300 font-mono">
                    {String(item.value).padStart(2, '0')}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-300 uppercase tracking-wider mt-0.5">
                    {item.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: PROFIL MEMPELAI */}
      <section id="sec-mempelai" className="py-12 sm:py-16 px-4 max-w-5xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Profil Kedua Mempelai
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
            Dipersatukan Dalam Kasih
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Memohon doa restu untuk putra-putri kami tercinta yang akan mengikat janji suci pernikahan
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">
          {/* Groom Card */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-md p-6 sm:p-8 text-center flex flex-col items-center justify-between relative overflow-hidden">
            <div className="w-full flex flex-col items-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-gradient-to-tr from-[#0A192F] via-amber-500 to-amber-300 shadow-xl mb-5">
                <img
                  src={settings.groomPhotoUrl}
                  alt={settings.groomFullName}
                  className="w-full h-full object-cover rounded-full border-2 border-white"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0A192F] text-amber-300 text-[11px] font-bold tracking-wide mb-2">
                <Shield className="w-3.5 h-3.5" />
                MEMPELAI PRIA
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                {settings.groomFullName}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-amber-800 mt-1">
                {settings.groomRankAndTitle}
              </p>
              <p className="text-xs text-slate-500">{settings.groomUnit}</p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 w-full space-y-1">
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                {settings.groomParents}
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {settings.groomOrigin}
              </p>
            </div>
          </div>

          {/* Bride Card */}
          <div className="bg-white rounded-3xl border border-amber-200/80 shadow-md p-6 sm:p-8 text-center flex flex-col items-center justify-between relative overflow-hidden">
            <div className="w-full flex flex-col items-center">
              <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full p-1.5 bg-gradient-to-tr from-amber-600 via-amber-400 to-rose-300 shadow-xl mb-5">
                <img
                  src={settings.bridePhotoUrl}
                  alt={settings.brideFullName}
                  className="w-full h-full object-cover rounded-full border-2 border-white"
                />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-bold tracking-wide mb-2">
                <Heart className="w-3.5 h-3.5 text-rose-600 fill-rose-500" />
                MEMPELAI WANITA
              </span>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                {settings.brideFullName}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-amber-800 mt-1">
                {settings.brideTitle}
              </p>
              <p className="text-xs text-slate-500">Jakarta Timur &bull; Semarang</p>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100 w-full space-y-1">
              <p className="text-xs sm:text-sm text-slate-700 font-medium">
                {settings.brideParents}
              </p>
              <p className="text-xs text-slate-500 flex items-center justify-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                {settings.brideOrigin}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: DETAIL RANGKAIAN ACARA (BISTON 18 DES, PEMBERKATAN 19 DES, RESEPSI 19 DES) + GOOGLE MAPS */}
      <section
        id="sec-acara"
        className="py-12 sm:py-16 px-4 bg-gradient-to-b from-[#F4EFE6] to-[#FAF8F5] border-y border-amber-200/70"
      >
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Rangkaian Acara Suci &amp; Kehormatan
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
              Waktu &amp; Tempat Pelaksanaan
            </h2>
            <p className="text-xs sm:text-sm text-slate-600">
              Diselenggarakan di Kota Semarang, Jawa Tengah pada 18 – 19 Desember 2026
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                badge: 'ACARA 1 • H-1',
                title: settings.event1Title,
                subtitle: settings.event1Subtitle,
                dateLabel: settings.event1DateLabel,
                timeLabel: settings.event1TimeLabel,
                venue: settings.event1Venue,
                address: settings.event1Address,
                mapsUrl: settings.event1MapsUrl,
                dresscode: settings.event1Dresscode,
                accent: 'from-slate-900 to-[#112240]',
              },
              {
                badge: 'ACARA UTAMA • PEMBERKATAN',
                title: settings.event2Title,
                subtitle: settings.event2Subtitle,
                dateLabel: settings.event2DateLabel,
                timeLabel: settings.event2TimeLabel,
                venue: settings.event2Venue,
                address: settings.event2Address,
                mapsUrl: settings.event2MapsUrl,
                dresscode: settings.event2Dresscode,
                accent: 'from-[#0A192F] to-amber-900',
              },
              {
                badge: 'ACARA PUNCAK • RESEPSI',
                title: settings.event3Title,
                subtitle: settings.event3Subtitle,
                dateLabel: settings.event3DateLabel,
                timeLabel: settings.event3TimeLabel,
                venue: settings.event3Venue,
                address: settings.event3Address,
                mapsUrl: settings.event3MapsUrl,
                dresscode: settings.event3Dresscode,
                accent: 'from-[#0A192F] to-[#1e293b]',
              },
            ].map((ev, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl border border-amber-200/90 shadow-md overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className={`bg-gradient-to-r ${ev.accent} text-white p-5`}>
                    <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 mb-2">
                      {ev.badge}
                    </span>
                    <h3 className="font-serif text-lg sm:text-xl font-bold text-white leading-snug">
                      {ev.title}
                    </h3>
                    <p className="text-xs text-slate-300 mt-1">{ev.subtitle}</p>
                  </div>

                  <div className="p-5 sm:p-6 space-y-3.5 text-sm">
                    <div className="flex items-start gap-3">
                      <Calendar className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">{ev.dateLabel}</p>
                        <p className="text-xs text-slate-500">Zona Waktu: WIB (Asia/Jakarta)</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <Clock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold text-slate-800">{ev.timeLabel}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-slate-900">{ev.venue}</p>
                        <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                          {ev.address}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                        Dresscode / Busana:
                      </p>
                      <p className="text-xs font-medium text-slate-800 mt-0.5">{ev.dresscode}</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2">
                  <a
                    href={ev.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-bold text-xs transition-all shadow-xs"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    Buka Petunjuk Google Maps
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: LOVE STORY & GALERI FOTO */}
      <section id="sec-galeri" className="py-12 sm:py-16 px-4 max-w-5xl mx-auto space-y-14">
        {/* Love Story Timeline */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Perjalanan Kasih
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
              Kisah Cinta Kami
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {settings.loveStory.map((story, index) => (
              <div
                key={story.id}
                className="bg-white rounded-2xl border border-amber-200/80 p-5 shadow-xs flex flex-col justify-between relative"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-[#0A192F] text-amber-300 font-bold text-xs flex items-center justify-center">
                      0{index + 1}
                    </span>
                    <span className="text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      {story.dateLabel}
                    </span>
                  </div>
                  <h3 className="font-serif font-bold text-base text-slate-900 mb-1.5">
                    {story.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{story.description}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center gap-1 text-[11px] text-slate-500">
                  <MapPin className="w-3 h-3 text-amber-600" />
                  {story.location}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Photo Gallery */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
              Momen Bahagia
            </span>
            <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
              Galeri Foto &amp; Kenangan
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5">
            {settings.galleryPhotos.map((photo) => (
              <div
                key={photo.id}
                onClick={() => setSelectedPhoto(photo)}
                className="group relative rounded-2xl overflow-hidden border border-amber-200/80 bg-slate-900 aspect-[4/3] cursor-pointer shadow-xs"
              >
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent opacity-90 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 sm:p-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                    {photo.category}
                  </span>
                  <h4 className="text-xs sm:text-sm font-bold text-white leading-snug">
                    {photo.title}
                  </h4>
                  <p className="text-[11px] text-slate-300 line-clamp-1 hidden sm:block">
                    {photo.caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5: FORM KONFIRMASI KEHADIRAN (RSVP) & BUKU TAMU (UCAPAN & DOA) REAL-TIME */}
      <section
        id="sec-rsvp"
        className="py-12 sm:py-16 px-4 bg-gradient-to-b from-[#0A192F] via-[#112240] to-[#0A192F] text-white"
      >
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: RSVP Form (5 cols) */}
          <div className="lg:col-span-5 bg-white text-slate-900 rounded-3xl p-6 sm:p-7 shadow-xl border border-amber-300/60">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-[#0A192F] text-amber-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif text-xl font-bold text-slate-900">
                  Konfirmasi Kehadiran (RSVP)
                </h3>
                <p className="text-xs text-slate-500">
                  Tersimpan otomatis ke Dashboard Panitia &amp; Buku Tamu
                </p>
              </div>
            </div>

            {rsvpSubmittedSuccess && (
              <div className="mb-4 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 flex items-start gap-2.5 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Terima kasih! Konfirmasi RSVP &amp; Doa Anda telah tercatat.</p>
                  <p className="text-emerald-700 mt-0.5">
                    Data kehadiran Anda langsung terhubung secara real-time ke sistem panitia pernikahan.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handleRsvpSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar / Pangkat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={rsvpName}
                  onChange={(e) => setRsvpName(e.target.value)}
                  placeholder="Contoh: Kombes Pol Budi Santoso, S.I.K."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A192F] focus:outline-none bg-slate-50/70 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Instansi / Satker / Hubungan
                  </label>
                  <input
                    type="text"
                    value={rsvpInstitution}
                    onChange={(e) => setRsvpInstitution(e.target.value)}
                    placeholder="Bareskrim Polri / Keluarga"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A192F] focus:outline-none bg-slate-50/70"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Nomor WhatsApp (Opsional)
                  </label>
                  <input
                    type="text"
                    value={rsvpPhone}
                    onChange={(e) => setRsvpPhone(e.target.value)}
                    placeholder="0812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A192F] focus:outline-none bg-slate-50/70"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  Konfirmasi Kehadiran <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Hadir', 'Masih Ragu', 'Tidak Hadir'] as RsvpStatus[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setRsvpStatus(st)}
                      className={`py-2.5 px-2 rounded-xl font-bold text-xs border transition-all ${
                        rsvpStatus === st
                          ? st === 'Hadir'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : st === 'Tidak Hadir'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                            : 'bg-amber-500 text-slate-950 border-amber-500 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {rsvpStatus === 'Hadir' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Jumlah Kehadiran (Pax)
                    </label>
                    <select
                      value={rsvpPax}
                      onChange={(e) => setRsvpPax(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-semibold"
                    >
                      {[1, 2, 3, 4, 5].map((num) => (
                        <option key={num} value={num}>
                          {num} Orang (Pax)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Sesi Acara</label>
                    <select
                      value={rsvpSession}
                      onChange={(e) =>
                        setRsvpSession(e.target.value as WeddingGuest['sessionChoice'])
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50/70 font-semibold"
                    >
                      <option value="Pemberkatan & Resepsi">Pemberkatan &amp; Resepsi (19 Des)</option>
                      <option value="Resepsi Saja">Resepsi Saja (19 Des Malam)</option>
                      <option value="Biston & Pemberkatan">Biston (18 Des) &amp; Pemberkatan</option>
                      <option value="Semua Sesi">Semua Sesi (18 &amp; 19 Des)</option>
                    </select>
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Ucapan Selamat &amp; Doa Restu
                </label>
                <textarea
                  rows={3}
                  value={rsvpMessage}
                  onChange={(e) => setRsvpMessage(e.target.value)}
                  placeholder="Tuliskan ucapan selamat dan doa terbaik untuk kedua mempelai..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A192F] focus:outline-none bg-slate-50/70"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingRsvp}
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-[#0A192F] via-[#112240] to-[#0A192F] hover:from-slate-800 hover:to-slate-900 text-amber-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg transition-all disabled:opacity-60"
              >
                <Send className="w-4 h-4" />
                {isSubmittingRsvp ? 'Menyimpan Konfirmasi...' : 'Kirim Konfirmasi & Ucapan Doa'}
              </button>
            </form>
          </div>

          {/* Right: Live Buku Tamu / Ucapan & Doa (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-300">
                  Buku Tamu Digital ({wishes.length} Ucapan)
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-bold text-white">
                  Untaian Doa &amp; Ucapan Restu
                </h3>
              </div>
            </div>

            <div className="space-y-3 max-h-[540px] overflow-y-auto pr-1">
              {wishes.map((w) => (
                <div
                  key={w.id}
                  className={`rounded-2xl p-4 sm:p-5 border transition-all ${
                    w.isPinned
                      ? 'bg-amber-400/15 border-amber-400/50'
                      : 'bg-white/[0.07] border-white/15'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-sm sm:text-base text-amber-200">
                          {w.guestName}
                        </h4>
                        {w.isPinned && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/25 text-amber-200 text-[10px] font-bold">
                            <Pin className="w-2.5 h-2.5" /> Disematkan
                          </span>
                        )}
                      </div>
                      {(w.institution || w.relation) && (
                        <p className="text-xs text-slate-300">
                          {w.institution || w.relation}
                        </p>
                      )}
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 ${
                        w.rsvpStatus === 'Hadir'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                          : w.rsvpStatus === 'Tidak Hadir'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-400/30'
                          : 'bg-amber-500/20 text-amber-200 border border-amber-400/30'
                      }`}
                    >
                      {w.rsvpStatus} {w.rsvpStatus === 'Hadir' && w.pax > 0 ? `(${w.pax} Pax)` : ''}
                    </span>
                  </div>

                  <p className="mt-2.5 text-xs sm:text-sm text-slate-100 leading-relaxed">
                    &ldquo;{w.message}&rdquo;
                  </p>

                  {w.replyFromCouple && (
                    <div className="mt-3 pl-3 border-l-2 border-amber-400/60 bg-slate-900/50 rounded-r-xl p-2.5 text-xs">
                      <p className="font-bold text-amber-300">
                        Balasan {settings.groomNickname} &amp; {settings.brideNickname}:
                      </p>
                      <p className="text-slate-200 mt-0.5">{w.replyFromCouple}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 6: AMPLOP DIGITAL / WEDDING GIFT */}
      <section id="sec-gift" className="py-12 sm:py-16 px-4 max-w-4xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">
            Wedding Gift &amp; Tanda Kasih
          </span>
          <h2 className="font-serif text-2xl sm:text-4xl font-bold text-slate-900">
            Amplop Digital
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Doa restu Bapak/Ibu/Saudara/i merupakan karunia terindah bagi kami. Namun apabila ingin memberikan tanda kasih secara digital, dapat melalui rekening resmi berikut:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {settings.bankAccounts.map((acc) => {
            const isCopied = copiedAccountId === acc.id;
            return (
              <div
                key={acc.id}
                className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-[#0A192F] text-amber-300 font-bold text-xs">
                      {acc.bankName}
                    </span>
                    <Gift className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs text-slate-500">Nomor Rekening:</p>
                  <p className="font-mono text-lg sm:text-xl font-extrabold text-slate-900 tracking-wider my-1">
                    {acc.accountNumber}
                  </p>
                  <p className="text-xs font-bold text-slate-800">a.n. {acc.accountHolder}</p>
                  {acc.branchOrNote && (
                    <p className="text-[11px] text-slate-500 mt-0.5">{acc.branchOrNote}</p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyAccount(acc.id, acc.accountNumber)}
                  className={`mt-4 w-full py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                    isCopied
                      ? 'bg-emerald-600 text-white'
                      : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                  }`}
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5" /> Nomor Rekening Tersalin!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Salin Nomor Rekening
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* Physical Gift & QRIS Card */}
        <div className="bg-white rounded-2xl border border-amber-200/90 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h4 className="font-bold text-sm sm:text-base text-slate-900 flex items-center justify-center sm:justify-start gap-2">
              <Gift className="w-4 h-4 text-amber-700" />
              Pengiriman Kado Fisik &amp; QRIS Wedding Gift
            </h4>
            <p className="text-xs text-slate-600">
              Penerima: <span className="font-semibold text-slate-900">{settings.giftRecipientName}</span> &bull;{' '}
              {settings.giftShippingAddress}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowQrisModal(true)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-bold text-xs transition-all"
          >
            <QrCode className="w-4 h-4" />
            Tampilkan Kode QRIS
          </button>
        </div>
      </section>

      {/* CLOSING FOOTER */}
      <footer className="bg-[#061020] text-slate-300 py-10 px-4 text-center border-t border-amber-400/20">
        <div className="max-w-2xl mx-auto space-y-4">
          <p className="text-xs sm:text-sm leading-relaxed text-slate-300">
            {settings.invitationClosingText}
          </p>
          <p className="font-serif text-xl sm:text-2xl font-bold text-amber-300">
            {settings.groomFullName} &amp; {settings.brideFullName}
          </p>
          <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <span>Wedding Readiness &amp; Digital Invitation &bull; Semarang 2026</span>
            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="inline-flex items-center gap-1 text-amber-300 hover:underline font-semibold"
            >
              <Lock className="w-3 h-3" />
              {isAdminLoggedIn
                ? 'Kembali ke Dashboard Manajemen Pernikahan'
                : 'Login Pengantin / Panitia (Admin)'}
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </footer>

      {/* BOTTOM FLOATING QUICK NAVIGATION (Safe padding so it never blocks content) */}
      <nav
        aria-label="Navigasi Undangan"
        className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 bg-[#0A192F]/95 backdrop-blur-md border border-amber-400/35 rounded-2xl px-2 py-1.5 shadow-2xl flex items-center gap-1 sm:gap-2 max-w-[95vw]"
      >
        {[
          { id: 'sec-hero', label: 'Pembuka', icon: Heart },
          { id: 'sec-mempelai', label: 'Mempelai', icon: Users },
          { id: 'sec-acara', label: 'Acara', icon: Calendar },
          { id: 'sec-galeri', label: 'Galeri', icon: Camera },
          { id: 'sec-rsvp', label: 'RSVP & Doa', icon: MessageSquareHeart },
          { id: 'sec-gift', label: 'Amplop', icon: Gift },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-white/10 text-slate-200 hover:text-amber-300 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-300" />
              <span className="text-[10px] font-semibold whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* QRIS MODAL */}
      {showQrisModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-amber-300">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-amber-800">
                QRIS Wedding Gift
              </span>
              <button
                type="button"
                onClick={() => setShowQrisModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center">
              <div className="w-48 h-48 bg-white p-3 rounded-xl border border-slate-300 flex flex-col items-center justify-center">
                <QrCode className="w-36 h-36 text-[#0A192F]" />
              </div>
              <p className="text-xs font-bold text-slate-900 mt-3">
                {settings.groomFullName} &amp; {settings.brideNickname}
              </p>
              <p className="text-[11px] text-slate-500">
                Mendukung seluruh Mobile Banking &amp; E-Wallet (BRI, BCA, Mandiri, GoPay, OVO, Dana)
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowQrisModal(false)}
              className="w-full py-2.5 rounded-xl bg-[#0A192F] text-amber-300 font-bold text-xs"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* LIGHTBOX PHOTO MODAL */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-slate-900 border border-amber-400/30 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl"
          >
            <img
              src={selectedPhoto.imageUrl}
              alt={selectedPhoto.title}
              className="w-full max-h-[70vh] object-cover"
            />
            <div className="p-4 sm:p-5 flex items-center justify-between gap-4 text-white">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300">
                  {selectedPhoto.category}
                </span>
                <h4 className="font-bold text-base">{selectedPhoto.title}</h4>
                <p className="text-xs text-slate-300 mt-0.5">{selectedPhoto.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold shrink-0"
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
