'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Shield,
  CheckCircle2,
  Users,
  Wallet,
  Calendar,
  Eye,
  KeyRound,
  Send,
  Music,
  Image as ImageIcon,
  ExternalLink,
  Copy,
  Check,
  Search,
  LayoutDashboard,
  Heart,
  Award,
} from 'lucide-react';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
import {
  ClientGroupItem,
  ClientWorkspaceData,
  WeddingSettings,
} from '@/types';

interface CommercialLandingViewProps {
  primarySettings: WeddingSettings;
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
}

export const CommercialLandingView: React.FC<CommercialLandingViewProps> = ({
  primarySettings,
  clientGroups,
  clientWorkspaces,
  isAdminLoggedIn,
  adminUserName,
  onOpenAdminPortal,
  onSelectClientInvitation,
}) => {
  const [guestCodeInput, setGuestCodeInput] = useState('');
  const [selectedLookupClientId, setSelectedLookupClientId] =
    useState<string>('client-utama');
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const developerUrl =
    primarySettings.developerCreditUrl?.trim() ||
    'https://github.com/omeko11/my_wedding_manager';
  const rawWa =
    primarySettings.contactWhatsappNumber?.trim() || '089638616516';
  const whatsappUrl = /^https?:\/\//i.test(rawWa)
    ? rawWa
    : `https://wa.me/${rawWa.replace(/\D/g, '').replace(/^0/, '62')}`;

  const handleQuickLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = guestCodeInput.trim();
    if (!trimmed) {
      onSelectClientInvitation(selectedLookupClientId);
      return;
    }
    if (/^INV-/i.test(trimmed)) {
      onSelectClientInvitation(
        selectedLookupClientId,
        undefined,
        trimmed.toUpperCase()
      );
    } else {
      onSelectClientInvitation(selectedLookupClientId, trimmed, undefined);
    }
  };

  const getClientSlug = (cg: ClientGroupItem) => {
    if (cg.id === 'client-utama') return 'agung_selo';
    return cg.clientCode.toLowerCase();
  };

  const handleCopyClientUrl = (cg: ClientGroupItem) => {
    const origin =
      typeof window !== 'undefined'
        ? window.location.origin
        : 'https://my-wedding-manager.vercel.app';
    const slug = getClientSlug(cg);
    const url = `${origin}/?client=${encodeURIComponent(slug)}`;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(url);
      setCopiedClientId(cg.id);
      window.setTimeout(() => setCopiedClientId(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-between selection:bg-[#D4AF37]/30">
      {/* TOP STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-[#D4AF37]/30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#EAD3A8] border border-[#D4AF37]/55 text-[#8B6914] flex items-center justify-center shadow-2xs shrink-0">
              <WeddingRingsIcon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-extrabold text-base sm:text-lg text-stone-900 truncate leading-tight">
                  <span className="sm:hidden tracking-wider">MWM</span>
                  <span className="hidden sm:inline">My Wedding Manager</span>
                </h1>
                <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold">
                  <Sparkles className="w-3 h-3" /> Commercial SaaS Suite
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#8B6914] leading-tight">
                by{' '}
                <a
                  href={developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                >
                  omeko11
                </a>{' '}
                <span className="font-normal text-stone-500 hidden sm:inline">
                  &bull; Enterprise Wedding Planner &amp; Digital Invitation
                </span>
              </p>
            </div>
          </div>

          {/* Center Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-bold text-stone-600">
            <a
              href="#showcase"
              className="hover:text-[#8B6914] transition-colors"
            >
              Katalog Undangan Klien ({clientGroups.length})
            </a>
            <a href="#fitur" className="hover:text-[#8B6914] transition-colors">
              6 Modul Terpadu
            </a>
            <a href="#paket" className="hover:text-[#8B6914] transition-colors">
              Paket Komersial
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => onSelectClientInvitation('client-utama')}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] text-xs font-bold transition-all"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Live Demo</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white text-xs font-extrabold shadow-sm transition-all"
            >
              {isAdminLoggedIn ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>
                    Dashboard {adminUserName ? `(${adminUserName})` : ''}
                  </span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Login Klien / Admin</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-12 sm:py-16 lg:py-20 border-b border-[#D4AF37]/25 bg-gradient-to-b from-[#FFFDF9] via-[#FAF3E3]/45 to-[#FAF8F5]">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/45 shadow-2xs text-[#8B6914] text-[11px] font-extrabold uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-[#B68D40]" />
              <span>
                My Wedding Manager (MWM) by{' '}
                <a
                  href={developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline decoration-[#D4AF37]/60 underline-offset-2 hover:text-[#B68D40]"
                >
                  omeko11
                </a>
              </span>
            </div>

            <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
              Platform Manajemen Persiapan Pernikahan &amp;{' '}
              <span className="bg-gradient-to-r from-[#8B6914] via-[#B68D40] to-[#8B6914] bg-clip-text text-transparent">
                Undangan Digital Eksklusif
              </span>
            </h2>

            <p className="text-xs sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
              Satu sistem terpadu untuk mengelola <strong>Readiness Tracker 8 Domain</strong>,{' '}
              <strong>Checklist Timeline H-6 Bulan s/d Hari-H</strong>,{' '}
              <strong>Anggaran &amp; Kontrak Vendor</strong>,{' '}
              <strong>Generator WhatsApp Tamu VIP</strong>, serta{' '}
              <strong>Undangan Digital Interaktif Real-Time</strong> untuk setiap pasangan klien.
            </p>

            {/* Primary Hero CTAs */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onSelectClientInvitation('client-utama')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all"
              >
                <Eye className="w-4 h-4" />
                <span>
                  Buka Live Showcase ({primarySettings.groomNickname} &amp;{' '}
                  {primarySettings.brideNickname})
                </span>
              </button>

              <button
                type="button"
                onClick={onOpenAdminPortal}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] border border-[#D4AF37]/40 font-extrabold text-xs sm:text-sm shadow-sm transition-all"
              >
                <KeyRound className="w-4 h-4 text-[#D4AF37]" />
                <span>
                  {isAdminLoggedIn
                    ? 'Masuk ke Workspace Dashboard'
                    : 'Portal Login Mempelai / WO'}
                </span>
              </button>
            </div>

            {/* Quick Guest Invitation Lookup Card */}
            <div className="max-w-2xl mx-auto mt-8 p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#D4AF37]/40 shadow-[0_12px_36px_rgba(182,141,64,0.12)] text-left">
              <div className="flex items-center justify-between gap-2 mb-2.5">
                <p className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-[#B68D40]" />
                  <span>Akses Cepat Tamu Undangan</span>
                </p>
                <span className="text-[10px] font-bold text-[#8B6914] bg-[#FAF3E3] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  Pilih Mempelai &amp; Masukkan Nama / Kode VIP
                </span>
              </div>
              <form
                onSubmit={handleQuickLookupSubmit}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2"
              >
                <div className="sm:col-span-5">
                  <select
                    value={selectedLookupClientId}
                    onChange={(e) => setSelectedLookupClientId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-[#FAF8F5] text-xs font-bold text-stone-800 focus:border-[#B68D40] focus:outline-none"
                  >
                    {clientGroups.map((cg) => (
                      <option key={cg.id} value={cg.id}>
                        💍 {cg.coupleLabel || cg.clientName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <input
                    type="text"
                    value={guestCodeInput}
                    onChange={(e) => setGuestCodeInput(e.target.value)}
                    placeholder="Kode INV-0001 / Nama Tamu..."
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-[#FAF8F5] text-xs font-medium text-stone-800 focus:border-[#B68D40] focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <button
                    type="submit"
                    className="w-full h-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs shadow-2xs transition-all"
                  >
                    Buka Undangan
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* SECTION 1: SHOWCASE & KATALOG UNDANGAN KLIEN AKTIF */}
        <section id="showcase" className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                Multi-Client Live Showcase
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                Katalog Undangan Klien Aktif ({clientGroups.length} Pasangan)
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Setiap pasangan klien memiliki <strong>Link Undangan Mandiri</strong> dan{' '}
                <strong>Workspace Dashboard Terisolasi</strong> (Mempelai, Foto, Tamu, Checklist &amp; Budget terpisah).
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#D4AF37]/45 text-[#8B6914] hover:bg-[#FAF3E3] text-xs font-bold self-start sm:self-auto shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Kelola Klien di Modul Superadmin</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {clientGroups.map((cg, idx) => {
              const wsSettings =
                cg.id === 'client-utama'
                  ? primarySettings
                  : clientWorkspaces?.[cg.id]?.settings;
              const groomNick =
                wsSettings?.groomNickname ||
                cg.coupleLabel.split('&')[0]?.trim() ||
                'Mempelai Pria';
              const brideNick =
                wsSettings?.brideNickname ||
                cg.coupleLabel.split('&')[1]?.trim() ||
                'Mempelai Wanita';
              const subtitleText =
                wsSettings?.subtitle ||
                `Tanggal Acara: ${cg.eventDate || '19 Desember 2026'}`;
              const slug = getClientSlug(cg);

              return (
                <div
                  key={cg.id}
                  className="rounded-3xl bg-white border border-[#D4AF37]/40 shadow-[0_12px_32px_rgba(28,25,23,0.06)] overflow-hidden flex flex-col justify-between transition-all hover:shadow-[0_16px_44px_rgba(182,141,64,0.16)] hover:-translate-y-0.5"
                >
                  <div>
                    {/* Top Card Banner */}
                    <div className="p-5 bg-gradient-to-br from-[#FAF3E3] via-[#FFFDF9] to-[#F3E5C8] border-b border-[#D4AF37]/30">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <span className="px-2.5 py-0.5 rounded-full bg-stone-900 text-[#D4AF37] font-mono text-[10px] font-extrabold">
                          {idx === 0 ? '★ FEATURED SHOWCASE' : cg.clientCode}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                          {cg.packageTier}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-[#D4AF37]/45 flex items-center justify-center text-[#8B6914] shadow-2xs shrink-0">
                          <WeddingRingsIcon className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-[#8B6914]">
                            The Wedding Of
                          </p>
                          <h4 className="font-serif text-xl font-extrabold text-stone-900 truncate">
                            {groomNick} &amp; {brideNick}
                          </h4>
                        </div>
                      </div>
                    </div>

                    {/* Card Details */}
                    <div className="p-5 space-y-3 text-xs">
                      <p className="text-stone-600 line-clamp-2 leading-relaxed">
                        {subtitleText}
                      </p>

                      <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-stone-200/80 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] text-stone-400 font-semibold">
                            Tautan Undangan Khusus Klien:
                          </p>
                          <p className="font-mono text-[11px] font-bold text-[#8B6914] truncate">
                            /?client={slug}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyClientUrl(cg)}
                          className="px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-bold text-[11px] inline-flex items-center gap-1 shrink-0"
                        >
                          {copiedClientId === cg.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Tersalin</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Salin Link</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer Buttons */}
                  <div className="px-5 py-3.5 bg-[#FAF8F5] border-t border-stone-200/70 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSelectClientInvitation(cg.id)}
                      className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs inline-flex items-center justify-center gap-1.5 shadow-2xs transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Buka Undangan Live</span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAdminPortal}
                      className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-bold text-xs inline-flex items-center gap-1"
                      title="Login ke Workspace Klien Ini"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 2: 6 MODUL UNGGULAN MY WEDDING MANAGER */}
        <section
          id="fitur"
          className="py-12 sm:py-16 bg-white border-y border-[#D4AF37]/25"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10">
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                Arsitektur Cloud Enterprise
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                6 Modul Terintegrasi dalam 1 Ekosistem
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                Dirancang khusus agar calon pengantin, keluarga besar, dan tim Wedding Organizer (WO) dapat berkolaborasi secara <em>real-time</em>.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[
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
                  title: '3. Moneter, Vendor & Amplop QRIS',
                  desc: 'Kontrol anggaran vs realisasi kontrak vendor, pelacakan DP/Lunas, serta pengaturan rekening amplop digital & QRIS.',
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
              ].map((feat) => {
                const Icon = feat.icon;
                return (
                  <div
                    key={feat.title}
                    className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5"
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

        {/* SECTION 3: PAKET KOMERSIAL */}
        <section
          id="paket"
          className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
              Lisensi &amp; Layanan Komersial
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              Pilihan Paket My Wedding Manager
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              Hubungi kami untuk pembuatan Workspace Klien baru beserta 4 Akun Default Mempelai &amp; Keluarga.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                tier: 'STARTER',
                name: 'Digital Invitation Suite',
                highlight: false,
                features: [
                  'Undangan Digital Interaktif & Responsif',
                  'Personalisasi Nama Tamu & Kode INV-xxxx',
                  'RSVP & Buku Tamu Doa Restu Real-Time',
                  'Amplop Digital Rekening & QRIS',
                ],
              },
              {
                tier: 'ROYAL VIP',
                name: 'All-in-One Planner + VIP Invitation',
                highlight: true,
                features: [
                  'Workspace Terisolasi Penuh (Data Mempelai Sendiri)',
                  '4 Akun User Default Inti + Akun Panitia/WO Unlimited',
                  'Readiness Tracker 8 Domain & Moneter Vendor Tracker',
                  'Studio Foto Ultra-HD 10 MB & Playlist Musik Kustom',
                  'Generator Undangan WhatsApp Pejabat/VIP & Reguler',
                ],
              },
              {
                tier: 'EXCLUSIVE',
                name: 'Wedding Readiness & Guest CRM',
                highlight: false,
                features: [
                  '4 Akun User Default Inti + Akun Panitia WO',
                  'Checklist Persiapan & Manajemen Daftar Tamu',
                  'Galeri Foto Lightbox & Kisah Cinta Mempelai',
                  'Backup & Export Laporan Excel (.CSV) & JSON',
                ],
              },
            ].map((pkg) => (
              <div
                key={pkg.tier}
                className={`rounded-3xl p-6 flex flex-col justify-between border ${
                  pkg.highlight
                    ? 'bg-gradient-to-b from-[#1C1613] to-[#2A2019] text-[#FAF3E3] border-[#D4AF37] shadow-xl'
                    : 'bg-white text-stone-800 border-[#D4AF37]/35 shadow-xs'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                        pkg.highlight
                          ? 'bg-[#D4AF37] text-stone-950'
                          : 'bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40'
                      }`}
                    >
                      {pkg.tier}
                    </span>
                    {pkg.highlight && (
                      <span className="text-[11px] font-bold text-[#E6C76B] flex items-center gap-1">
                        <Award className="w-3.5 h-3.5" /> Paling Populer
                      </span>
                    )}
                  </div>

                  <h4
                    className={`font-serif text-xl font-extrabold ${
                      pkg.highlight ? 'text-white' : 'text-stone-900'
                    }`}
                  >
                    {pkg.name}
                  </h4>

                  <ul className="space-y-2.5 text-xs">
                    {pkg.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            pkg.highlight ? 'text-[#D4AF37]' : 'text-emerald-600'
                          }`}
                        />
                        <span
                          className={
                            pkg.highlight ? 'text-[#E8DFD1]' : 'text-stone-600'
                          }
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 mt-6 border-t border-[#D4AF37]/25">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all ${
                      pkg.highlight
                        ? 'bg-gradient-to-r from-[#D4AF37] to-[#B68D40] text-stone-950 hover:from-[#C5A059] hover:to-[#9A742B]'
                        : 'bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border border-[#D4AF37]/45'
                    }`}
                  >
                    <span>Hubungi Kami / Pesan Paket</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* OFFICIAL FOOTER CREDIT & CONTACT US */}
      <footer className="bg-white border-t border-[#D4AF37]/35 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-[#D4AF37] flex items-center justify-center shrink-0">
              <WeddingRingsIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-extrabold text-stone-900">
                My Wedding Manager by{' '}
                <a
                  href={developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#8B6914] hover:text-[#B68D40] underline decoration-[#D4AF37]/60 underline-offset-2"
                >
                  omeko11
                </a>{' '}
                &copy; 2026
              </p>
              <p className="text-[11px] text-stone-500">
                Multi-Client Wedding Readiness Tracker &amp; Interactive Digital Invitation Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] uppercase tracking-widest font-extrabold text-[#8B6914]">
              Contact Us:
            </span>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              title={`Hubungi Kontak WA My Wedding Manager (${rawWa})`}
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
              <span>Kontak WA</span>
            </a>

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
