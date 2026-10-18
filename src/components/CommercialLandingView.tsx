'use client';

import React, { useMemo, useState } from 'react';
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
} from 'lucide-react';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
import {
  ClientGroupItem,
  ClientWorkspaceData,
  WeddingGuest,
  WeddingSettings,
} from '@/types';

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
}) => {
  const [lang, setLang] = useState<'ID' | 'EN'>(
    primarySettings.defaultLanguage || 'ID'
  );
  const [copiedCryptoWallet, setCopiedCryptoWallet] = useState(false);
  const [copiedPaymentKey, setCopiedPaymentKey] = useState<string | null>(null);
  const [showCommercialQrisModal, setShowCommercialQrisModal] = useState(false);

  // Post-payment confirmation & SLA flow state (email e98.bisnis@gmail.com is unlocked ONLY after payment confirmation)
  const [selectedCheckoutTier, setSelectedCheckoutTier] = useState<
    'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP'
  >('EXCLUSIVE');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'QRIS' | 'BANK_TRANSFER' | 'CREDIT_CARD' | 'PAYPAL' | 'CRYPTO_USDT'
  >('QRIS');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerCoupleName, setBuyerCoupleName] = useState('');
  const [paymentReference, setPaymentReference] = useState('');
  const [hasCompletedPayment, setHasCompletedPayment] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const [guestCodeInput, setGuestCodeInput] = useState('');
  const [selectedLookupClientId, setSelectedLookupClientId] =
    useState<string>('client-utama');
  const [showLookupSuggestions, setShowLookupSuggestions] = useState(false);
  const [copiedClientId, setCopiedClientId] = useState<string | null>(null);

  const activeLookupClientGuests = useMemo<WeddingGuest[]>(() => {
    if (selectedLookupClientId === 'client-utama') {
      return primaryGuests || [];
    }
    return clientWorkspaces?.[selectedLookupClientId]?.guests || [];
  }, [selectedLookupClientId, primaryGuests, clientWorkspaces]);

  const filteredLookupGuests = useMemo<WeddingGuest[]>(() => {
    const q = guestCodeInput.trim().toLowerCase();
    if (!q) {
      return activeLookupClientGuests.slice(0, 6);
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

  const developerUrl =
    primarySettings.developerCreditUrl?.trim() ||
    'https://github.com/omeko11';
  const rawWa =
    primarySettings.contactWhatsappNumber?.trim() || '089638616516';
  const whatsappUrl = /^https?:\/\//i.test(rawWa)
    ? rawWa
    : `https://wa.me/${rawWa.replace(/\D/g, '').replace(/^0/, '62')}`;

  // Official post-payment business email (only revealed once hasCompletedPayment === true)
  const businessEmail =
    primarySettings.contactBusinessEmail?.trim() || 'e98.bisnis@gmail.com';
  const mailtoPostPaymentUrl = `mailto:${businessEmail}?subject=${encodeURIComponent(
    lang === 'ID'
      ? `[Konfirmasi Bukti Bayar] Paket ${selectedCheckoutTier} - ${buyerCoupleName || buyerEmail}`
      : `[Payment Receipt Confirmation] ${selectedCheckoutTier} Plan - ${buyerCoupleName || buyerEmail}`
  )}&body=${encodeURIComponent(
    lang === 'ID'
      ? `Halo Tim My Wedding Manager,\n\nSaya telah melakukan pembayaran paket komersial dengan rincian berikut:\n- Paket: ${selectedCheckoutTier}\n- Metode Pembayaran: ${selectedPaymentMethod}\n- Email Tujuan Pengiriman Akses (Maks. H+3): ${buyerEmail}\n- Nama Pasangan / Klien: ${buyerCoupleName || '-'}\n- No. Referensi / TXID: ${paymentReference || '-'}\n\nTerlampir bukti pembayaran kami. Terima kasih.`
      : `Hello My Wedding Manager Team,\n\nI have completed the payment for our commercial wedding suite:\n- Plan: ${selectedCheckoutTier}\n- Payment Method: ${selectedPaymentMethod}\n- Client Email for Credentials Delivery (Max D+3): ${buyerEmail}\n- Couple / Client Name: ${buyerCoupleName || '-'}\n- Reference / TXID: ${paymentReference || '-'}\n\nPlease find our payment receipt attached. Thank you.`
  )}`;

  const bankTransferInfo =
    primarySettings.commercialBankTransferInfo?.trim() ||
    (lang === 'ID'
      ? 'BCA / Mandiri / BNI / BRI — Silakan transfer sesuai nominal paket atau klik WA untuk nomor rekening aktif'
      : 'BCA / Mandiri / BNI / BRI — Transfer according to package price or click WA for active bank account');

  const commercialQrisImageUrl =
    primarySettings.commercialQrisImageUrl?.trim() || '';

  const creditCardUrl =
    primarySettings.commercialCreditCardUrl?.trim() ||
    'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY';

  const rawPaypalConfig = primarySettings.commercialPaypalUrl?.trim() || '';
  const paypalHref = /^https?:\/\//i.test(rawPaypalConfig)
    ? rawPaypalConfig
    : 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY';

  const cryptoNetwork =
    primarySettings.commercialCryptoNetwork?.trim() ||
    'USDT • TRC20 / BEP20 / ERC20 (Min. Transfer 10 USDT)';
  const rawCryptoWalletAddress =
    primarySettings.commercialCryptoWalletAddress?.trim() || '';
  const displayCryptoWalletAddress =
    rawCryptoWalletAddress ||
    (lang === 'ID'
      ? 'Hubungi WA Admin untuk Alamat Deposit USDT Resmi'
      : 'Contact Admin WA for Official USDT Deposit Address');

  const handleSelectPackageForCheckout = (
    tier: 'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP'
  ) => {
    setSelectedCheckoutTier(tier);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('checkout-pembayaran');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  const handleConfirmPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedEmail = buyerEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setCheckoutError(
        lang === 'ID'
          ? 'Mohon masukkan alamat email aktif Anda untuk pengiriman akses 4 Akun Default & Workspace Klien.'
          : 'Please enter a valid email address to receive your 4 Core Accounts & Client Workspace credentials.'
      );
      return;
    }
    setCheckoutError(null);
    setHasCompletedPayment(true);
  };

  const handleCopyCryptoWallet = () => {
    const textToCopy = rawCryptoWalletAddress || displayCryptoWalletAddress;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(textToCopy);
      setCopiedCryptoWallet(true);
      window.setTimeout(() => setCopiedCryptoWallet(false), 2000);
    }
  };

  const handleCopyPaymentValue = (key: string, value: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(value);
      setCopiedPaymentKey(key);
      window.setTimeout(() => setCopiedPaymentKey(null), 2000);
    }
  };

  const handleQuickLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowLookupSuggestions(false);
    const trimmed = guestCodeInput.trim();
    if (!trimmed) {
      onSelectClientInvitation(selectedLookupClientId);
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
      onSelectClientInvitation(
        selectedLookupClientId,
        matched.guestName,
        matched.invitationCode
      );
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          {/* Brand Logo & Title (Clean without Commercial SaaS Suite pill) */}
          <div className="flex items-center gap-2.5 min-w-0 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#EAD3A8] border border-[#D4AF37]/55 text-[#8B6914] flex items-center justify-center shadow-2xs shrink-0">
              <WeddingRingsIcon className="w-5 h-5 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-extrabold text-sm sm:text-base lg:text-lg text-stone-900 truncate leading-tight">
                  <span className="sm:hidden tracking-wider">MWM</span>
                  <span className="hidden sm:inline">My Wedding Manager</span>
                </h1>
              </div>
              <p className="text-[10px] sm:text-[11px] font-bold text-[#8B6914] leading-tight whitespace-nowrap">
                by{' '}
                <a
                  href={developerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline"
                  title="GitHub Profile @omeko11"
                >
                  omeko11
                </a>{' '}
                <span className="font-normal text-stone-500 hidden xl:inline">
                  &bull;{' '}
                  {lang === 'ID'
                    ? 'Manajemen Persiapan & Undangan Digital'
                    : 'Wedding Readiness & Digital Invitation'}
                </span>
              </p>
            </div>
          </div>

          {/* Center Compact Single-Line Nav Links with Icons + Tooltips */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0">
            <a
              href="#showcase"
              title={
                lang === 'ID'
                  ? 'Lihat Katalog Undangan Klien Aktif & Showcase Live'
                  : 'View Active Client Invitation Catalog & Live Showcase'
              }
              className="text-[11px] font-bold whitespace-nowrap px-2.5 py-1.5 rounded-xl hover:bg-[#FAF3E3] text-stone-700 hover:text-[#8B6914] inline-flex items-center gap-1.5 transition-all"
            >
              <Eye className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
              <span>
                {lang === 'ID'
                  ? `Katalog (${clientGroups.length})`
                  : `Catalog (${clientGroups.length})`}
              </span>
            </a>
            <a
              href="#fitur"
              title={
                lang === 'ID'
                  ? '8 Modul Manajemen Persiapan Pernikahan & Undangan Digital Terpadu'
                  : '8 Integrated Wedding Readiness & Digital Invitation Modules'
              }
              className="text-[11px] font-bold whitespace-nowrap px-2.5 py-1.5 rounded-xl hover:bg-[#FAF3E3] text-stone-700 hover:text-[#8B6914] inline-flex items-center gap-1.5 transition-all"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
              <span>{lang === 'ID' ? 'Fitur' : 'Features'}</span>
            </a>
            <a
              href="#paket"
              title={
                lang === 'ID'
                  ? 'Paket Langganan Komersial (IDR, Kartu Kredit, QRIS, PayPal & Crypto USDT)'
                  : 'Commercial Pricing Plans (IDR, Credit Card, QRIS, PayPal & Crypto USDT)'
              }
              className="text-[11px] font-bold whitespace-nowrap px-2.5 py-1.5 rounded-xl hover:bg-[#FAF3E3] text-stone-700 hover:text-[#8B6914] inline-flex items-center gap-1.5 transition-all"
            >
              <Award className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
              <span>{lang === 'ID' ? 'Paket' : 'Pricing'}</span>
            </a>
          </nav>

          {/* Right Action Buttons + Bilingual Switcher */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Bilingual Language & Market Switcher */}
            <button
              type="button"
              onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
              title="Ganti Bahasa & Mata Uang Pasar (Indonesia IDR / Global English USD-USDT)"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stone-100 hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-stone-800 hover:text-[#8B6914] text-[11px] font-extrabold whitespace-nowrap transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
              <span>{lang === 'ID' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
            </button>

            <button
              type="button"
              onClick={() => onSelectClientInvitation('client-utama')}
              title={
                lang === 'ID'
                  ? 'Buka Contoh Undangan Digital Interaktif (Live Demo)'
                  : 'Open Interactive Digital Invitation Showcase (Live Demo)'
              }
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] text-[11px] font-bold whitespace-nowrap transition-all"
            >
              <Eye className="w-3.5 h-3.5 shrink-0" />
              <span>Live Demo</span>
            </button>

            <button
              type="button"
              onClick={onOpenAdminPortal}
              title={
                isAdminLoggedIn
                  ? lang === 'ID'
                    ? `Buka Workspace Dashboard (${adminUserName || 'Admin'})`
                    : `Open Workspace Dashboard (${adminUserName || 'Admin'})`
                  : lang === 'ID'
                    ? 'Masuk ke Portal Klien Mempelai, Panitia WO, atau Superadmin'
                    : 'Login to Couple, Wedding Organizer, or Superadmin Portal'
              }
              className="inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white text-[11px] font-extrabold whitespace-nowrap shadow-sm transition-all"
            >
              {isAdminLoggedIn ? (
                <>
                  <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    Dashboard{adminUserName ? ` (${adminUserName})` : ''}
                  </span>
                </>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'ID' ? 'Login Klien' : 'Client Login'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative py-12 sm:py-16 lg:py-20 border-b border-[#D4AF37]/25 bg-gradient-to-b from-[#FFFDF9] via-[#FAF3E3]/45 to-[#FAF8F5]">
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
              {lang === 'ID' ? (
                <>
                  Platform Manajemen Persiapan Pernikahan &amp;{' '}
                  <span className="bg-gradient-to-r from-[#8B6914] via-[#B68D40] to-[#8B6914] bg-clip-text text-transparent">
                    Undangan Digital Eksklusif
                  </span>
                </>
              ) : (
                <>
                  All-in-One Wedding Readiness &amp;{' '}
                  <span className="bg-gradient-to-r from-[#8B6914] via-[#B68D40] to-[#8B6914] bg-clip-text text-transparent">
                    Luxury Digital Invitation Suite
                  </span>
                </>
              )}
            </h2>

            <p className="text-xs sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
              {lang === 'ID' ? (
                <>
                  Satu sistem terpadu untuk mengelola{' '}
                  <strong>Readiness Tracker 8 Domain</strong>,{' '}
                  <strong>Checklist Timeline H-6 Bulan s/d Hari-H</strong>,{' '}
                  <strong>Anggaran &amp; Kontrak Vendor</strong>,{' '}
                  <strong>Generator WhatsApp Tamu VIP</strong>, serta{' '}
                  <strong>Undangan Digital Interaktif Real-Time</strong> untuk
                  setiap pasangan klien.
                </>
              ) : (
                <>
                  One unified platform to manage your{' '}
                  <strong>8-Domain Wedding Readiness Tracker</strong>,{' '}
                  <strong>6-Month Countdown Checklist</strong>,{' '}
                  <strong>Vendor Budget &amp; Contracts</strong>,{' '}
                  <strong>1-Click VIP WhatsApp Invitations</strong>, and{' '}
                  <strong>Interactive Real-Time Digital Invitations</strong>{' '}
                  with multi-currency Digital Envelopes (IDR, PayPal &amp;
                  Crypto USDT).
                </>
              )}
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
                  {lang === 'ID'
                    ? `Buka Live Showcase (${primarySettings.groomNickname} & ${primarySettings.brideNickname})`
                    : `Open Live Showcase (${primarySettings.groomNickname} & ${primarySettings.brideNickname})`}
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
                    ? lang === 'ID'
                      ? 'Masuk ke Workspace Dashboard'
                      : 'Enter Workspace Dashboard'
                    : lang === 'ID'
                      ? 'Portal Login Mempelai / WO'
                      : 'Couple / WO Login Portal'}
                </span>
              </button>
            </div>

            {/* Quick Guest Invitation Lookup Card */}
            <div className="max-w-2xl mx-auto mt-8 p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#D4AF37]/40 shadow-[0_12px_36px_rgba(182,141,64,0.12)] text-left">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
                <p className="text-xs font-extrabold text-stone-900 flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-[#B68D40]" />
                  <span>
                    {lang === 'ID'
                      ? 'Akses Cepat Tamu Undangan'
                      : 'Quick Guest Invitation Lookup'}
                  </span>
                </p>
                <span className="text-[10px] font-bold text-[#8B6914] bg-[#FAF3E3] px-2.5 py-0.5 rounded-full border border-[#D4AF37]/30">
                  {lang === 'ID'
                    ? `Pilih Mempelai & Masukkan Nama / Kode VIP (${activeLookupClientGuests.length} Tamu Terdaftar)`
                    : `Select Couple & Enter Guest Name / VIP Code (${activeLookupClientGuests.length} Registered Guests)`}
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
                    }}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-[#FAF8F5] text-xs font-bold text-stone-800 focus:border-[#B68D40] focus:outline-none"
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
                      setShowLookupSuggestions(true);
                    }}
                    placeholder={
                      lang === 'ID'
                        ? 'Kode INV-0001 / Nama Tamu...'
                        : 'Code INV-0001 / Guest Name...'
                    }
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-stone-200 bg-[#FAF8F5] text-xs font-medium text-stone-800 focus:border-[#B68D40] focus:outline-none"
                  />
                  {showLookupSuggestions && filteredLookupGuests.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-2xl bg-white border border-[#D4AF37]/45 shadow-xl overflow-hidden max-h-60 overflow-y-auto">
                      <div className="px-3 py-1.5 bg-[#FAF3E3]/70 border-b border-[#D4AF37]/25 text-[10px] font-extrabold text-[#8B6914] flex items-center justify-between">
                        <span>
                          {lang === 'ID'
                            ? 'Tamu Terdaftar di Database'
                            : 'Registered Guests in Database'}
                        </span>
                        <span>
                          {lang === 'ID' ? 'Klik untuk Buka' : 'Click to Open'}
                        </span>
                      </div>
                      {filteredLookupGuests.map((guest) => (
                        <button
                          key={guest.id}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setGuestCodeInput(guest.guestName);
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
                    className="w-full h-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs shadow-2xs transition-all"
                  >
                    {lang === 'ID' ? 'Buka Undangan' : 'Open Invitation'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* SECTION 1: SHOWCASE & KATALOG UNDANGAN KLIEN AKTIF */}
        <section
          id="showcase"
          className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                Multi-Client Live Showcase
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                {lang === 'ID'
                  ? `Katalog Undangan Klien Aktif (${clientGroups.length} Pasangan)`
                  : `Active Client Invitation Catalog (${clientGroups.length} Couples)`}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {lang === 'ID' ? (
                  <>
                    Setiap pasangan klien memiliki{' '}
                    <strong>Link Undangan Mandiri</strong> dan{' '}
                    <strong>Workspace Dashboard Terisolasi</strong> (Mempelai,
                    Foto, Tamu, Checklist &amp; Budget terpisah).
                  </>
                ) : (
                  <>
                    Every couple receives a{' '}
                    <strong>Dedicated Invitation URL</strong> and an{' '}
                    <strong>Isolated Dashboard Workspace</strong> (Separate
                    Profile, Gallery, Guests, Checklist &amp; Budget).
                  </>
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenAdminPortal}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-[#D4AF37]/45 text-[#8B6914] hover:bg-[#FAF3E3] text-xs font-bold self-start sm:self-auto shadow-2xs"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>
                {lang === 'ID'
                  ? 'Kelola Klien di Modul Superadmin'
                  : 'Manage Clients in Superadmin Module'}
              </span>
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
                (lang === 'ID' ? 'Mempelai Pria' : 'Groom');
              const brideNick =
                wsSettings?.brideNickname ||
                cg.coupleLabel.split('&')[1]?.trim() ||
                (lang === 'ID' ? 'Mempelai Wanita' : 'Bride');
              const subtitleText =
                wsSettings?.subtitle ||
                (lang === 'ID'
                  ? `Tanggal Acara: ${cg.eventDate || '19 Desember 2026'}`
                  : `Wedding Date: ${cg.eventDate || 'December 19, 2026'}`);
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
                            {lang === 'ID'
                              ? 'Tautan Undangan Khusus Klien:'
                              : 'Dedicated Client Invitation Link:'}
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
                              <span>
                                {lang === 'ID' ? 'Tersalin' : 'Copied'}
                              </span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>
                                {lang === 'ID' ? 'Salin Link' : 'Copy Link'}
                              </span>
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
                      <span>
                        {lang === 'ID'
                          ? 'Buka Undangan Live'
                          : 'Open Live Invitation'}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={onOpenAdminPortal}
                      className="py-2.5 px-3.5 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-bold text-xs inline-flex items-center gap-1"
                      title={
                        lang === 'ID'
                          ? 'Login ke Workspace Klien Ini'
                          : 'Login to This Client Workspace'
                      }
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
                {lang === 'ID'
                  ? 'Arsitektur Cloud Enterprise'
                  : 'Enterprise Cloud Architecture'}
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                {lang === 'ID'
                  ? '6 Modul Terintegrasi dalam 1 Ekosistem'
                  : '6 Integrated Modules in 1 Ecosystem'}
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 mt-1">
                {lang === 'ID' ? (
                  <>
                    Dirancang khusus agar calon pengantin, keluarga besar, dan
                    tim Wedding Organizer (WO) dapat berkolaborasi secara{' '}
                    <em>real-time</em>.
                  </>
                ) : (
                  <>
                    Purpose-built so couples, families, and Wedding Organizer
                    (WO) teams can collaborate in <em>real-time</em>.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                      title: '3. Moneter, Vendor & Amplop Multi-Currency',
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
                      title: '3. Vendor Budget & Multi-Currency Gift',
                      desc: 'Track estimated vs actual vendor contracts, DP/paid status, plus Digital Envelopes via Bank, QRIS, PayPal & Crypto USDT.',
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

        {/* SECTION 3: PAKET KOMERSIAL (STARTER -> EXCLUSIVE -> ROYAL VIP) */}
        <section
          id="paket"
          className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        >
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
              {lang === 'ID'
                ? 'Lisensi & Layanan Komersial (IDR • Visa/Mastercard • QRIS • PayPal • Crypto USDT)'
                : 'Commercial Plans & Licensing (IDR • Visa/Mastercard • QRIS • PayPal • Crypto USDT)'}
            </span>
            <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
              {lang === 'ID'
                ? 'Pilihan Paket My Wedding Manager'
                : 'Choose Your Wedding Suite Plan'}
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 mt-1">
              {lang === 'ID'
                ? 'Pilih paket sesuai kebutuhan Anda, lakukan pembayaran via metode lokal/global di bawah, lalu konfirmasi email Anda untuk pengiriman akses maksimal H+3.'
                : 'Select your preferred tier, complete payment via local or global methods below, and submit your email to receive your credentials within 3 days (D+3).'}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {(
              [
                {
                  tier: 'STARTER' as const,
                  badge:
                    lang === 'ID' ? 'STARTER • HEMAT' : 'STARTER • ENTRY',
                  name: 'Starter Digital Invitation',
                  priceMain:
                    lang === 'ID' ? 'Rp 50.000' : '$10 USD / 10 USDT',
                  priceStrike: lang === 'ID' ? 'Rp 150.000' : '$25 USD',
                  priceSubBadge:
                    lang === 'ID'
                      ? 'Global: $10 USD / 10 USDT (Min. Transfer Crypto)'
                      : 'Indonesia Promo: Rp 50.000 (*Min. Crypto Transfer 10 USDT)',
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
                  priceMain:
                    lang === 'ID' ? 'Rp 149.000' : '$25 USD / 25 USDT',
                  priceStrike: lang === 'ID' ? 'Rp 350.000' : '$59 USD',
                  priceSubBadge:
                    lang === 'ID'
                      ? 'Global: $25 USD / 25 USDT'
                      : 'Indonesia: Rp 149.000',
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
                  priceMain:
                    lang === 'ID' ? 'Rp 299.000' : '$49 USD / 49 USDT',
                  priceStrike: lang === 'ID' ? 'Rp 650.000' : '$99 USD',
                  priceSubBadge:
                    lang === 'ID'
                      ? 'Global: $49 USD / 49 USDT'
                      : 'Indonesia: Rp 299.000',
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
              ] as const
            ).map((pkg) => {
              const isRoyal = pkg.styleVariant === 'royal';
              const isExclusive = pkg.styleVariant === 'exclusive';
              const isSelected = selectedCheckoutTier === pkg.tier;

              return (
                <div
                  key={pkg.tier}
                  className={`rounded-3xl p-6 flex flex-col justify-between transition-all ${
                    isRoyal
                      ? 'bg-gradient-to-b from-[#1C1613] via-[#221A15] to-[#2A2019] text-[#FAF3E3] border-2 border-[#D4AF37] shadow-[0_20px_50px_rgba(182,141,64,0.28)] relative'
                      : isExclusive
                        ? 'bg-gradient-to-b from-[#FFFDF9] to-[#FAF3E3]/60 text-stone-800 border-2 border-[#B68D40]/70 shadow-md'
                        : 'bg-white text-stone-800 border border-[#D4AF37]/35 shadow-xs'
                  } ${isSelected ? 'ring-2 ring-[#D4AF37] ring-offset-2' : ''}`}
                >
                  <div className="space-y-4">
                    {/* Package Badge */}
                    <div className="flex items-center justify-between gap-2">
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
                      {isSelected && (
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            isRoyal
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {lang === 'ID' ? '✓ Dipilih' : '✓ Selected'}
                        </span>
                      )}
                    </div>

                    {/* Title & Pricing Block */}
                    <div>
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

                  {/* CTA Buttons (Select Plan & Proceed to Checkout) */}
                  <div className="pt-6 mt-6 border-t border-[#D4AF37]/25 space-y-2">
                    <button
                      type="button"
                      onClick={() => handleSelectPackageForCheckout(pkg.tier)}
                      className={`w-full py-3 px-4 rounded-2xl font-extrabold text-xs inline-flex items-center justify-center gap-2 transition-all ${
                        isRoyal
                          ? 'bg-gradient-to-r from-[#D4AF37] via-[#E6C76B] to-[#B68D40] text-stone-950 hover:from-[#C5A059] hover:to-[#9A742B] shadow-md'
                          : isExclusive
                            ? 'bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] border border-[#D4AF37]/45'
                            : 'bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border border-[#D4AF37]/45'
                      }`}
                    >
                      <Wallet className="w-3.5 h-3.5" />
                      <span>
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

          {/* OFFICIAL LOCAL & GLOBAL PAYMENT METHODS + POST-PAYMENT EMAIL CONFIRMATION FLOW */}
          <div
            id="checkout-pembayaran"
            className="mt-8 rounded-3xl bg-white border border-[#D4AF37]/45 p-5 sm:p-6 shadow-[0_12px_36px_rgba(182,141,64,0.1)]"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 mb-5 border-b border-stone-200/80">
              <div>
                <h4 className="font-serif text-base sm:text-lg font-extrabold text-stone-900 flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-[#B68D40]" />
                  <span>
                    {lang === 'ID'
                      ? 'Metode Pembayaran Resmi (Lokal Indonesia & Global International)'
                      : 'Supported Payment Methods (Indonesia Local & Global International)'}
                  </span>
                </h4>
                <p className="text-xs text-stone-500 mt-0.5">
                  {lang === 'ID'
                    ? 'Langkah 1: Lakukan pembayaran sesuai paket pilihan Anda melalui salah satu metode resmi di bawah ini.'
                    : 'Step 1: Complete your payment for your selected plan using any of the official payment methods below.'}
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider self-start lg:self-auto">
                <Shield className="w-3.5 h-3.5" />
                <span>
                  {lang === 'ID'
                    ? `Paket Dipilih: ${selectedCheckoutTier}`
                    : `Selected Plan: ${selectedCheckoutTier}`}
                </span>
              </span>
            </div>

            {/* 5 Official Payment Method Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 1. Transfer Bank (BCA, Mandiri, BNI, BRI) */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> BANK TRANSFER (IDR)
                    </span>
                    <span className="text-[11px] font-extrabold text-[#8B6914]">
                      {lang === 'ID' ? 'Mulai Rp 50.000' : 'From Rp 50.000'}
                    </span>
                  </div>
                  <h5 className="text-xs font-extrabold text-stone-900">
                    {lang === 'ID'
                      ? 'Transfer Bank (BCA, Mandiri, BNI, BRI)'
                      : 'Indonesian Bank Transfer (BCA, Mandiri, BNI, BRI)'}
                  </h5>
                  <div className="p-2 rounded-xl bg-white border border-stone-200/90 text-[11px] font-semibold text-stone-700 leading-snug">
                    {bankTransferInfo}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMethod('BANK_TRANSFER');
                      handleCopyPaymentValue('bank', bankTransferInfo);
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copiedPaymentKey === 'bank' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          {lang === 'ID' ? 'Tersalin!' : 'Copied!'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ID' ? 'Salin Info Bank' : 'Copy Bank Info'}
                        </span>
                      </>
                    )}
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-stone-900 font-extrabold text-[11px] inline-flex items-center justify-center gap-1 transition-all"
                    title="Tanya Nomor Rekening via WhatsApp"
                  >
                    <span>WA</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* 2. QRIS Nasional (All Bank & E-Wallet Indonesia) */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 inline-flex items-center gap-1">
                      <QrCode className="w-3 h-3" /> QRIS NASIONAL (IDR)
                    </span>
                    <span className="text-[11px] font-extrabold text-rose-800">
                      All E-Wallet &amp; M-Banking
                    </span>
                  </div>
                  <h5 className="text-xs font-extrabold text-stone-900">
                    {lang === 'ID'
                      ? 'QRIS Nasional (All Bank & E-Wallet Indonesia)'
                      : 'National QRIS (GoPay, OVO, Dana, ShopeePay, M-Banking)'}
                  </h5>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {lang === 'ID'
                      ? 'Scan QRIS instan dari aplikasi M-Banking, GoPay, OVO, DANA, ShopeePay, atau LinkAja.'
                      : 'Instant QR scan from any Indonesian Mobile Banking or E-Wallet app.'}
                  </p>
                </div>
                {commercialQrisImageUrl ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMethod('QRIS');
                      setShowCommercialQrisModal((prev) => !prev);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#FAF3E3] font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5 text-[#D4AF37]" />
                    <span>
                      {showCommercialQrisModal
                        ? lang === 'ID'
                          ? 'Tutup Barcode QRIS'
                          : 'Hide QRIS Barcode'
                        : lang === 'ID'
                          ? 'Lihat & Scan Barcode QRIS'
                          : 'View & Scan QRIS Barcode'}
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('QRIS')}
                    className="w-full py-2 px-3 rounded-xl bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ID'
                        ? 'Pilih Pembayaran QRIS Nasional'
                        : 'Select National QRIS Payment'}
                    </span>
                  </button>
                )}
              </div>

              {/* 3. Kartu Kredit / Debit Internasional (Visa / Mastercard) */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-indigo-100 text-indigo-900 inline-flex items-center gap-1">
                      <CreditCard className="w-3 h-3" /> VISA / MASTERCARD
                    </span>
                    <span className="text-[11px] font-extrabold text-indigo-900">
                      Global Card
                    </span>
                  </div>
                  <h5 className="text-xs font-extrabold text-stone-900">
                    {lang === 'ID'
                      ? 'Kartu Kredit / Debit Internasional (Visa / Mastercard)'
                      : 'International Credit / Debit Card (Visa / Mastercard)'}
                  </h5>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {lang === 'ID'
                      ? 'Mendukung pembayaran Kartu Kredit & Debit Visa, Mastercard, JCB, atau Amex untuk klien lokal maupun internasional.'
                      : 'Supports Visa, Mastercard, JCB & Amex credit or debit cards for global and domestic clients.'}
                  </p>
                </div>
                {creditCardUrl ? (
                  <a
                    href={creditCardUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setSelectedPaymentMethod('CREDIT_CARD')}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-900 hover:bg-indigo-800 text-white font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ID'
                        ? 'Bayar dengan Kartu Kredit / Debit'
                        : 'Pay with Credit / Debit Card'}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => setSelectedPaymentMethod('CREDIT_CARD')}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-950 hover:bg-indigo-900 text-white font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>
                      {lang === 'ID'
                        ? 'Pilih Kartu Kredit / Debit (Visa/Mastercard)'
                        : 'Select Credit / Debit Card (Visa/Mastercard)'}
                    </span>
                  </button>
                )}
              </div>

              {/* 4. PayPal International (USD — Mulai $10 USD) */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200/90 flex flex-col justify-between gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-sky-100 text-sky-800 inline-flex items-center gap-1">
                      <Globe className="w-3 h-3" /> PAYPAL INTERNATIONAL (USD)
                    </span>
                    <span className="text-[11px] font-extrabold text-sky-800">
                      {lang === 'ID' ? 'Mulai $10 USD' : 'From $10 USD'}
                    </span>
                  </div>
                  <h5 className="text-xs font-extrabold text-stone-900">
                    PayPal International (USD — Mulai $10 USD)
                  </h5>
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    {lang === 'ID'
                      ? 'Pembayaran global cepat & aman menggunakan PayPal International ($10 / $25 / $49 USD).'
                      : 'Fast & secure global checkout via PayPal International ($10 / $25 / $49 USD).'}
                  </p>
                </div>
                <a
                  href={paypalHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setSelectedPaymentMethod('PAYPAL')}
                  className="w-full py-2 px-3 rounded-xl bg-[#0070BA] hover:bg-[#005EA6] text-white font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all shadow-2xs"
                >
                  <span>
                    {lang === 'ID'
                      ? 'Bayar via PayPal International'
                      : 'Pay via PayPal International'}
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* 5. Crypto / USDT Wallet (TRC20 / BEP20 / ERC20 — Min. 10 USDT) */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/45 flex flex-col justify-between gap-3 md:col-span-2 lg:col-span-2">
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-900 inline-flex items-center gap-1">
                      <Coins className="w-3 h-3" /> CRYPTO / USDT WALLET (GLOBAL WEB3)
                    </span>
                    <span className="text-[11px] font-extrabold text-[#8B6914]">
                      Min. Transfer 10 USDT (TRC20 / BEP20 / ERC20)
                    </span>
                  </div>
                  <h5 className="text-xs font-extrabold text-stone-900">
                    Crypto / USDT Wallet (Min. 10 USDT — TRC20 / BEP20 / ERC20)
                  </h5>
                  <p className="text-[10px] font-bold text-[#8B6914]">
                    {cryptoNetwork}
                  </p>
                  <div className="p-2.5 rounded-xl bg-white border border-stone-200/90 font-mono text-[11px] text-stone-800 break-all">
                    {displayCryptoWalletAddress}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPaymentMethod('CRYPTO_USDT');
                      handleCopyCryptoWallet();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-[#D4AF37] font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    {copiedCryptoWallet ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>
                          {lang === 'ID'
                            ? 'Alamat USDT Tersalin!'
                            : 'USDT Address Copied!'}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ID'
                            ? 'Salin Alamat USDT'
                            : 'Copy USDT Address'}
                        </span>
                      </>
                    )}
                  </button>
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2 px-3 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] font-extrabold text-[11px] inline-flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>
                      {lang === 'ID'
                        ? 'Tanya via WhatsApp'
                        : 'Ask via WhatsApp'}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>

            {/* Inline Preview of Commercial QRIS if toggled */}
            {showCommercialQrisModal && commercialQrisImageUrl && (
              <div className="mt-4 p-4 rounded-2xl bg-[#FAF3E3]/50 border border-[#D4AF37]/45 flex flex-col items-center text-center space-y-2">
                <p className="text-xs font-extrabold text-stone-900">
                  {lang === 'ID'
                    ? 'Scan Barcode QRIS Resmi My Wedding Manager'
                    : 'Scan Official My Wedding Manager QRIS Barcode'}
                </p>
                <img
                  src={commercialQrisImageUrl}
                  alt="Commercial QRIS Barcode"
                  className="max-h-64 w-auto rounded-2xl border border-[#D4AF37]/40 shadow-md bg-white p-2"
                />
                <p className="text-[11px] text-stone-600">
                  {lang === 'ID'
                    ? 'Setelah melakukan pembayaran QRIS, lengkapi form Konfirmasi Sudah Bayar di bawah ini.'
                    : 'After completing QRIS payment, fill out the Payment Confirmation form below.'}
                </p>
              </div>
            )}

            {/* STEP 2: KONFIRMASI SUDAH BAYAR & MASUKKAN EMAIL ANDA (UNLOCKS OFFICIAL POST-PAYMENT EMAIL & H+3 SLA) */}
            <div className="mt-6 pt-6 border-t border-[#D4AF37]/35">
              <div className="rounded-3xl bg-gradient-to-br from-[#FAF3E3]/70 via-[#FFFDF9] to-[#F3E5C8]/45 border border-[#D4AF37]/50 p-5 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                      {lang === 'ID'
                        ? 'Langkah 2 • Verifikasi & Pengiriman Lisensi Klien'
                        : 'Step 2 • Verification & Client License Delivery'}
                    </span>
                    <h5 className="font-serif text-base sm:text-lg font-extrabold text-stone-900 mt-0.5">
                      {lang === 'ID'
                        ? 'Konfirmasi Sudah Bayar & Masukkan Email Anda'
                        : 'I Have Paid & Submit Email for Account Activation'}
                    </h5>
                  </div>
                  {!hasCompletedPayment && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900 text-[#D4AF37] text-[10px] font-bold self-start sm:self-auto">
                      <Lock className="w-3 h-3" />
                      <span>
                        {lang === 'ID'
                          ? 'Kontak Prioritas Terbuka Setelah Konfirmasi Bayar'
                          : 'Priority Contact Unlocks After Payment Confirmation'}
                      </span>
                    </span>
                  )}
                </div>

                <form
                  onSubmit={handleConfirmPaymentSubmit}
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3"
                >
                  <div className="lg:col-span-3">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'ID' ? 'Paket yang Dibayar' : 'Selected Plan'}
                    </label>
                    <select
                      value={selectedCheckoutTier}
                      onChange={(e) =>
                        setSelectedCheckoutTier(
                          e.target.value as
                            | 'STARTER'
                            | 'EXCLUSIVE'
                            | 'ROYAL VIP'
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:border-[#B68D40] focus:outline-none"
                    >
                      <option value="STARTER">
                        STARTER (Rp 50.000 / $10 USDT)
                      </option>
                      <option value="EXCLUSIVE">
                        EXCLUSIVE (Rp 149.000 / $25 USDT)
                      </option>
                      <option value="ROYAL VIP">
                        ROYAL VIP (Rp 299.000 / $49 USDT)
                      </option>
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'ID' ? 'Metode Pembayaran' : 'Payment Method'}
                    </label>
                    <select
                      value={selectedPaymentMethod}
                      onChange={(e) =>
                        setSelectedPaymentMethod(
                          e.target.value as
                            | 'QRIS'
                            | 'BANK_TRANSFER'
                            | 'CREDIT_CARD'
                            | 'PAYPAL'
                            | 'CRYPTO_USDT'
                        )
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-bold text-stone-900 focus:border-[#B68D40] focus:outline-none"
                    >
                      <option value="QRIS">QRIS Nasional (IDR)</option>
                      <option value="BANK_TRANSFER">
                        Transfer Bank (BCA/Mandiri/BNI/BRI)
                      </option>
                      <option value="CREDIT_CARD">
                        Kartu Kredit / Debit (Visa / Mastercard)
                      </option>
                      <option value="PAYPAL">PayPal International (USD)</option>
                      <option value="CRYPTO_USDT">
                        Crypto / USDT (TRC20/BEP20/ERC20)
                      </option>
                    </select>
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'ID'
                        ? 'Email Aktif Anda (Wajib)'
                        : 'Your Active Email (Required)'}
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
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-900 focus:border-[#B68D40] focus:outline-none"
                    />
                  </div>

                  <div className="lg:col-span-3">
                    <label className="block text-[10px] font-extrabold uppercase tracking-wider text-stone-600 mb-1">
                      {lang === 'ID'
                        ? 'Nama Pasangan / Ref Bayar'
                        : 'Couple Name / Payment Ref'}
                    </label>
                    <input
                      type="text"
                      value={buyerCoupleName}
                      onChange={(e) => {
                        setBuyerCoupleName(e.target.value);
                        setPaymentReference(e.target.value);
                      }}
                      placeholder={
                        lang === 'ID'
                          ? 'Mis: Romeo & Juliet / TXID'
                          : 'e.g. Romeo & Juliet / TXID'
                      }
                      className="w-full px-3 py-2.5 rounded-xl border border-stone-300 bg-white text-xs font-medium text-stone-900 focus:border-[#B68D40] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 lg:col-span-12 pt-1">
                    {checkoutError && (
                      <p className="text-xs font-bold text-rose-600 mb-2">
                        {checkoutError}
                      </p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3 px-5 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 shadow-md transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        {lang === 'ID'
                          ? 'Konfirmasi Sudah Bayar & Masukkan Email Anda'
                          : 'I Have Paid & Submit Email'}
                      </span>
                    </button>
                  </div>
                </form>

                {/* UNLOCKED POST-PAYMENT SLA & PRIORITY RECEIPT CONTACT (ONLY VISIBLE AFTER PAYMENT CONFIRMATION) */}
                {hasCompletedPayment && (
                  <div className="mt-5 p-5 rounded-2xl bg-emerald-950 text-emerald-50 border-2 border-[#D4AF37] shadow-lg space-y-3 animate-fadeIn">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#D4AF37] text-stone-950 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div className="space-y-1.5 text-xs sm:text-sm leading-relaxed">
                        <p className="font-extrabold text-[#E6C76B] uppercase tracking-wider text-[11px]">
                          {lang === 'ID'
                            ? `✓ Konfirmasi Pembayaran Paket ${selectedCheckoutTier} Tercatat (${buyerEmail})`
                            : `✓ ${selectedCheckoutTier} Plan Payment Confirmation Recorded (${buyerEmail})`}
                        </p>
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
                              className="font-extrabold text-[#E6C76B] underline hover:text-white"
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
                              className="font-extrabold text-[#E6C76B] underline hover:text-white"
                            >
                              {businessEmail}
                            </a>
                            .
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-800/80">
                      <a
                        href={mailtoPostPaymentUrl}
                        className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#E6C76B] text-stone-950 font-extrabold text-xs inline-flex items-center gap-1.5 shadow-sm hover:opacity-95 transition-all"
                      >
                        <Mail className="w-3.5 h-3.5" />
                        <span>
                          {lang === 'ID'
                            ? `Kirim Bukti Bayar Prioritas ke ${businessEmail}`
                            : `Send Priority Payment Receipt to ${businessEmail}`}
                        </span>
                      </a>
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyPaymentValue('official-email', businessEmail)
                        }
                        className="py-2 px-3 rounded-xl bg-emerald-900/90 hover:bg-emerald-800 text-emerald-100 border border-[#D4AF37]/40 font-bold text-xs inline-flex items-center gap-1.5 transition-all"
                      >
                        {copiedPaymentKey === 'official-email' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-[#E6C76B]" />
                            <span>
                              {lang === 'ID'
                                ? 'Email Tersalin!'
                                : 'Email Copied!'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-[#E6C76B]" />
                            <span>
                              {lang === 'ID'
                                ? 'Salin Email Resmi'
                                : 'Copy Official Email'}
                            </span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* OFFICIAL FOOTER CREDIT & CONTACT US (With Subtle Commercial SaaS Suite Badge; Post-Payment Email Only Shown If Unlocked) */}
      <footer className="bg-white border-t border-[#D4AF37]/35 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-9 h-9 rounded-xl bg-stone-900 text-[#D4AF37] flex items-center justify-center shrink-0">
              <WeddingRingsIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
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
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/35 text-[#8B6914] text-[10px] font-bold">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>
                    Commercial SaaS &amp; All-in-One Wedding Planner Suite
                  </span>
                </span>
              </div>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {lang === 'ID'
                  ? 'Platform Multi-Klien Readiness Tracker Pernikahan & Undangan Digital Interaktif'
                  : 'Multi-Client Wedding Readiness Tracker & Interactive Digital Invitation Platform'}
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
