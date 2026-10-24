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
  WeddingGuest,
  WeddingSettings,
} from '@/types';
import { DEFAULT_COMMERCIAL_PAYMENT_CHANNELS } from '@/data/seedData';

const IDEMPOTENT_TX_STORAGE_KEY = 'mwm_active_idempotent_tx_v1';

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
  const [lightboxScreenshot, setLightboxScreenshot] = useState<{
    title: string;
    badge: string;
    desc: string;
    imageUrl: string;
  } | null>(null);

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

  const developerUrl =
    primarySettings.developerCreditUrl?.trim() ||
    'https://github.com/omeko11';
  const rawWa =
    primarySettings.contactWhatsappNumber?.trim() || '089638616516';
  const whatsappUrl = /^https?:\/\//i.test(rawWa)
    ? rawWa
    : `https://wa.me/${rawWa.replace(/\D/g, '').replace(/^0/, '62')}`;

  const rawPaypalConfig = primarySettings.commercialPaypalUrl?.trim() || '';
  const paypalHref =
    /^https?:\/\//i.test(rawPaypalConfig) &&
    rawPaypalConfig !== 'https://paypal.me/omeko11'
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
                  title="GitHub Profile @omeko11"
                >
                  omeko11
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
            <section className="relative py-12 sm:py-16 lg:py-20 border-b border-[#D4AF37]/25 bg-gradient-to-b from-[#FFFDF9] via-[#FAF3E3]/45 to-[#FAF8F5]">
              <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
                <div
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-[#D4AF37]/45 shadow-2xs text-[#8B6914] text-[11px] font-extrabold uppercase tracking-widest max-w-full"
                  title="My Event Planner — Platform Multi-Event & Undangan Digital Eksklusif by omeko11"
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
                      omeko11
                    </a>
                  </span>
                </div>

                <h2 className="font-serif text-3xl sm:text-5xl font-extrabold text-stone-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
                  {lang === 'ID' ? (
                    <>
                      Platform Manajemen Persiapan Acara &amp;{' '}
                      <span className="bg-gradient-to-r from-[#8B6914] via-[#B68D40] to-[#8B6914] bg-clip-text text-transparent">
                        Undangan Digital Multi-Event
                      </span>
                    </>
                  ) : (
                    <>
                      All-in-One Multi-Event Readiness &amp;{' '}
                      <span className="bg-gradient-to-r from-[#8B6914] via-[#B68D40] to-[#8B6914] bg-clip-text text-transparent">
                        Luxury Digital Invitation Suite
                      </span>
                    </>
                  )}
                </h2>

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
                        Studio Undangan Digital Interaktif &amp; Video Background
                      </strong>{' '}
                      untuk berbagai jenis acara.
                    </>
                  ) : (
                    <>
                      One unified platform to manage your{' '}
                      <strong>Executive Readiness Tracker</strong>,{' '}
                      <strong>6-Month Countdown Checklist</strong>,{' '}
                      <strong>Vendor Budget &amp; Contracts</strong>,{' '}
                      <strong>1-Click VIP WhatsApp Invitations</strong>, and{' '}
                      <strong>
                        Interactive Digital Invitations with Adaptive Video
                        Backgrounds
                      </strong>{' '}
                      &amp; Digital Envelopes (Bank, PayPal &amp; Crypto USDT).
                    </>
                  )}
                </p>

                {/* Supported Multi-Event Category Pills + 25 MB Video Background Pill */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1 max-w-4xl mx-auto">
                  {[
                    {
                      label: '💍 Wedding',
                      title:
                        lang === 'ID'
                          ? 'Manajemen Persiapan Pernikahan (Akad, Pemberkatan, Adat & Resepsi) + Undangan Digital'
                          : 'Wedding Readiness Management (Ceremony, Custom & Reception) + Digital Invitation',
                    },
                    {
                      label: '🎂 Birthday',
                      title:
                        lang === 'ID'
                          ? 'Manajemen Acara & Undangan Digital Ulang Tahun / Sweet Seventeen / Milestone'
                          : 'Birthday Party, Sweet 17 & Milestone Event Management + Digital Invitation',
                    },
                    {
                      label: '🎓 Graduation',
                      title:
                        lang === 'ID'
                          ? 'Acara Wisuda, Syukuran Kelulusan & Perayaan Akademik'
                          : 'Graduation Ceremony, Academic Celebration & Alumni Gathering',
                    },
                    {
                      label: '🏛️ Rapat / Corporate',
                      title:
                        lang === 'ID'
                          ? 'Rapat Kerja, Konferensi, Seminar, Townhall & Acara Resmi Instansi/Korporat'
                          : 'Corporate Meetings, Conferences, Seminars, Townhalls & Official Institutional Events',
                    },
                    {
                      label: '🥂 Gala Dinner',
                      title:
                        lang === 'ID'
                          ? 'Gala Dinner VIP, Malam Penghargaan, Charity & Jamuan Eksklusif'
                          : 'VIP Gala Dinners, Award Nights, Charity Galas & Exclusive Banquets',
                    },
                    {
                      label:
                        lang === 'ID'
                          ? '🎬 Video Latar 25 MB'
                          : '🎬 25 MB Video Bg',
                      title:
                        lang === 'ID'
                          ? 'Mendukung Upload Video Background Sinematik s/d 25 MB dengan Auto-Stretch Responsif (9:16 HP ↔ 16:9 PC)'
                          : 'Supports up to 25 MB Cinematic Video Backgrounds with Adaptive 9:16 Mobile to 16:9 PC Auto-Stretch',
                    },
                  ].map((pill) => (
                    <span
                      key={pill.label}
                      title={pill.title}
                      className="inline-flex items-center px-3 py-1.5 rounded-full bg-white/95 border border-[#D4AF37]/45 text-stone-800 text-[11px] sm:text-xs font-extrabold shadow-2xs whitespace-nowrap truncate max-w-full"
                    >
                      {pill.label}
                    </span>
                  ))}
                </div>

                {/* Primary Hero CTAs */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={scrollToShowcase}
                    title={
                      lang === 'ID'
                        ? 'Lihat 5 Screenshot Resmi Modul My Event Planner (Tanpa Membuka Undangan Privat Klien)'
                        : 'Inspect 5 Official Module Screenshots of My Event Planner (Privacy & Copyright Safe)'
                    }
                    className="w-full sm:w-auto max-w-full justify-center inline-flex items-center gap-2 px-6 py-3.5 rounded-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm shadow-md transition-all whitespace-nowrap truncate"
                  >
                    <Eye className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap truncate">
                      {lang === 'ID'
                        ? 'Lihat Katalog Tampilan & Fitur (5 Modul)'
                        : 'Explore Product Screenshots (5 Modules)'}
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

                {/* Quick Guest Invitation Lookup Card (Private Guest Gate) */}
                <div className="max-w-2xl mx-auto mt-8 p-4 sm:p-5 rounded-3xl bg-white/95 border border-[#D4AF37]/40 shadow-[0_12px_36px_rgba(182,141,64,0.12)] text-left">
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
            </section>

            {/* SECTION 1: INTERACTIVE PRODUCT SCREENSHOT CATALOG (5 OFFICIAL MODULES) */}
            <section
              id="showcase"
              className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6"
            >
              {/* Section Header + Privacy Note Pill */}
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#8B6914]">
                      Official Product Tour &bull; Copyright-Safe Preview
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
                            ? 'Undangan aktif klien dan musik kustom bersifat privat untuk melindungi privasi acara & hak cipta audio.'
                            : 'Active client invitations and custom music are private to protect event privacy and audio copyright.'
                        }
                      />
                    </span>
                  </div>
                  <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900">
                    {lang === 'ID'
                      ? 'Katalog Tampilan & Fitur My Event Planner (5 Modul Inti)'
                      : 'My Event Planner Interface & Feature Showcase (5 Core Modules)'}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 max-w-3xl leading-relaxed">
                    {lang === 'ID'
                      ? 'Jelajahi tangkapan layar asli dari 5 modul utama sistem manajemen acara & undangan digital kami. Klik tab modul atau tombol Perbesar Layar Penuh untuk melihat detail antarmuka resolusi tinggi.'
                      : 'Explore authentic interface screenshots across our 5 core event management and digital invitation modules. Click any module tab or Zoom Fullscreen to inspect high-resolution details.'}
                  </p>
                </div>

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
                      {lang === 'ID' ? 'Buka Portal Login' : 'Open Login Portal'}
                    </span>
                  </button>
                </div>
              </div>

              {/* Row of 5 Interactive Module Tabs */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {OFFICIAL_PRODUCT_SCREENSHOTS.map((shot, idx) => {
                  const isActive = activeShowcaseIdx === idx;
                  const tabLabel = lang === 'ID' ? shot.tabId : shot.tabEn;
                  const fullTitle = lang === 'ID' ? shot.titleId : shot.titleEn;
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
                                (prev - 1 + OFFICIAL_PRODUCT_SCREENSHOTS.length) %
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
                                (prev + 1) % OFFICIAL_PRODUCT_SCREENSHOTS.length
                            )
                          }
                          title={
                            lang === 'ID' ? 'Modul Berikutnya' : 'Next Module'
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
                                (prev - 1 + OFFICIAL_PRODUCT_SCREENSHOTS.length) %
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
                          <span>{lang === 'ID' ? 'Sebelumnya' : 'Prev'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActiveShowcaseIdx(
                              (prev) =>
                                (prev + 1) % OFFICIAL_PRODUCT_SCREENSHOTS.length
                            )
                          }
                          title={
                            lang === 'ID'
                              ? 'Lihat Screenshot Modul Berikutnya'
                              : 'View Next Module Screenshot'
                          }
                          className="px-3 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white text-xs font-extrabold inline-flex items-center gap-1 whitespace-nowrap shadow-2xs transition-all"
                        >
                          <span>{lang === 'ID' ? 'Berikutnya' : 'Next'}</span>
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
                  const shotDesc = lang === 'ID' ? shot.descId : shot.descEn;
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
                  <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                    {lang === 'ID'
                      ? '6 Modul Terintegrasi dalam 1 Ekosistem'
                      : '6 Integrated Modules in 1 Ecosystem'}
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-500 mt-1">
                    {lang === 'ID' ? (
                      <>
                        Dirancang khusus agar calon pengantin, keluarga besar,
                        dan tim Wedding Organizer (WO) dapat berkolaborasi
                        secara <em>real-time</em>.
                      </>
                    ) : (
                      <>
                        Purpose-built so couples, families, and Wedding
                        Organizer (WO) teams can collaborate in{' '}
                        <em>real-time</em>.
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
                <h3 className="font-serif text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
                  {lang === 'ID'
                    ? 'Pilihan Paket My Event Planner'
                    : 'My Event Planner Packages'}
                </h3>
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
                    omeko11
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
