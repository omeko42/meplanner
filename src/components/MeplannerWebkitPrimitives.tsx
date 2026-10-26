'use client';

import React, { useState } from 'react';
import {
  MEPLANNER_BRAND_LOGOS,
  MEPLANNER_ICONS,
  MEPLANNER_THEME_ASSETS,
  MEPLANNER_WEBKIT_COMPONENTS,
  resolveThemeWebkitBundle,
  type WebkitButtonStyleFamily,
} from '@/lib/meplannerBrandKit';

/**
 * 1. OFFICIAL MEPLANNER LOGO WORDMARK & GOLD RIBBON "M" SQUIRCLE ICON
 * Built directly from: D:\EKO\FOTO\MEPlan_Brand_Kit\concepts\meplanner_official_logo_sheet.jpg
 */
export const MeplannerOfficialLogo: React.FC<{
  variant?: 'dark-bg' | 'light-bg' | 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}> = ({
  variant = 'light-bg',
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const isDarkBg = variant === 'dark-bg' || variant === 'dark';
  const iconSize =
    size === 'sm'
      ? 'w-8 h-8 rounded-lg'
      : size === 'lg'
        ? 'w-12 h-12 rounded-2xl'
        : 'w-10 h-10 rounded-xl';
  const titleSize =
    size === 'sm'
      ? 'text-base'
      : size === 'lg'
        ? 'text-2xl'
        : 'text-lg sm:text-xl';
  const subSize =
    size === 'sm' ? 'text-[7px]' : size === 'lg' ? 'text-[9px]' : 'text-[8px]';

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Obsidian Squircle with 3D Gold Ribbon "M" + 4-Point Star Sparkle */}
      <div
        className={`relative ${iconSize} bg-gradient-to-br from-[#1C2230] via-[#0F131C] to-[#080A0F] border border-[#D4AF37]/45 shadow-[0_6px_18px_rgba(15,19,28,0.35),inset_0_1px_1px_rgba(255,255,255,0.18)] flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <svg
          viewBox="0 0 64 64"
          className="w-[76%] h-[76%] drop-shadow-[0_2px_6px_rgba(212,175,55,0.35)]"
          fill="none"
        >
          <defs>
            <linearGradient
              id="mepGoldRibbon1"
              x1="10"
              y1="12"
              x2="54"
              y2="54"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#FFF6D6" />
              <stop offset="35%" stopColor="#E5C158" />
              <stop offset="70%" stopColor="#C59B27" />
              <stop offset="100%" stopColor="#8A6412" />
            </linearGradient>
            <linearGradient
              id="mepGoldRibbon2"
              x1="14"
              y1="52"
              x2="48"
              y2="14"
              gradientUnits="userSpaceOnUse"
            >
              <stop offset="0%" stopColor="#9A7218" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#FFF2B2" />
            </linearGradient>
          </defs>
          {/* Left Vertical Pillar of M */}
          <path
            d="M12 16C12 13.8 13.8 12 16 12H21C22.8 12 24.4 13.1 25.1 14.8L32 32L24 42L12 16Z"
            fill="url(#mepGoldRibbon1)"
          />
          <rect
            x="12"
            y="14"
            width="9.5"
            height="36"
            rx="2.5"
            fill="url(#mepGoldRibbon2)"
          />
          {/* Center V Ribbon Fold */}
          <path
            d="M19 13L31.5 39.5H36.5L48.5 13H40.5L33.5 29.5L26 13H19Z"
            fill="url(#mepGoldRibbon1)"
          />
          {/* Right Pillar of M */}
          <rect
            x="41.5"
            y="13"
            width="9"
            height="34"
            rx="2.5"
            fill="url(#mepGoldRibbon2)"
          />
          {/* 4-Point Star Sparkle Overlapping Bottom-Right */}
          <path
            d="M46 25C46 34.5 48.5 37 58 37C48.5 37 46 39.5 46 49C46 39.5 43.5 37 34 37C43.5 37 46 34.5 46 25Z"
            fill="url(#mepGoldRibbon1)"
          />
        </svg>
      </div>

      {/* MEPlanner Wordmark + MY EVENT PLANNER Subtitle */}
      <div className="flex flex-col leading-none">
        <span
          className={`${titleSize} font-extrabold tracking-tight ${
            isDarkBg ? 'text-white' : 'text-[#141413]'
          }`}
        >
          <span className="text-[#D4AF37]">
            ME
          </span>
          Planner
        </span>
        {showSubtitle && (
          <span
            className={`${subSize} font-extrabold uppercase tracking-[0.26em] mt-1 ${
              isDarkBg ? 'text-[#D4AF37]/90' : 'text-stone-600'
            }`}
          >
            MY EVENT PLANNER
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * 2. SECONDARY BRAND EMBLEM: CIRCULAR NAVY & GOLD "MEP OFFICIAL PARTNER" MEDALLION
 * Built directly from: D:\EKO\FOTO\MEPlan_Brand_Kit\concepts\meplanner_official_logo_sheet.jpg
 */
export const MeplannerPartnerMedallion: React.FC<{
  size?: number;
  className?: string;
}> = ({ size = 64, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 128"
    fill="none"
    className={`shrink-0 select-none ${className}`}
    aria-label="MEPlanner Official Partner Seal"
  >
    <defs>
      <linearGradient id="medGoldOuter" x1="0" y1="0" x2="120" y2="128" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFF3B8" />
        <stop offset="45%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#8A6412" />
      </linearGradient>
      <radialGradient id="medGoldInner" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stopColor="#FFF7CC" />
        <stop offset="65%" stopColor="#D4AF37" />
        <stop offset="100%" stopColor="#9A7218" />
      </radialGradient>
    </defs>
    {/* Shield Pointer Base */}
    <path
      d="M60 4C91 4 116 29 116 60C116 86 94 111 60 124C26 111 4 86 4 60C4 29 29 4 60 4Z"
      fill="url(#medGoldOuter)"
    />
    {/* Deep Royal Navy Ring */}
    <path
      d="M60 9C88 9 111 32 111 60C111 83 91 105 60 117C29 105 9 83 9 60C9 32 32 9 60 9Z"
      fill="#10203B"
      stroke="url(#medGoldOuter)"
      strokeWidth="1.5"
    />
    {/* Center Gold Coin */}
    <circle
      cx="60"
      cy="60"
      r="33"
      fill="url(#medGoldInner)"
      stroke="#FFF6D6"
      strokeWidth="1.5"
    />
    <circle
      cx="60"
      cy="60"
      r="29"
      fill="none"
      stroke="#8A6412"
      strokeWidth="0.8"
      strokeDasharray="2 2"
    />
    {/* Interlocking MEP Monogram */}
    <text
      x="60"
      y="67"
      textAnchor="middle"
      fill="#3B2806"
      fontFamily="Georgia, serif"
      fontSize="22"
      fontWeight="bold"
      letterSpacing="-1"
    >
      MEP
    </text>
    {/* Top & Bottom Rim Dots */}
    <circle cx="19" cy="60" r="2.2" fill="#D4AF37" />
    <circle cx="101" cy="60" r="2.2" fill="#D4AF37" />
    <text
      x="60"
      y="22"
      textAnchor="middle"
      fill="#FAF0CA"
      fontFamily="sans-serif"
      fontSize="6.5"
      fontWeight="bold"
      letterSpacing="1.6"
    >
      MEPLANNER PARTNER
    </text>
    <text
      x="60"
      y="105"
      textAnchor="middle"
      fill="#D4AF37"
      fontFamily="sans-serif"
      fontSize="7"
      fontWeight="bold"
      letterSpacing="2"
    >
      OFFICIAL SEAL
    </text>
  </svg>
);

/**
 * 3. REAL DIGITAL ENVELOPE & CASHLESS GIFT CREDIT CARD
 * Built directly from: D:\EKO\FOTO\MEPlan_Brand_Kit\themes\mockup-8-commercial-envelope-and-certificate.jpg
 * Features:
 * - Brushed Champagne Gold upper body (60%) + Obsidian Black Glassmorphism lower body (40%)
 * - Realistic 3D Gold EMV Chip (icon-badge-1-chip-atm.svg)
 * - White QRIS Nasional Box with red corner accents & live QR matrix
 * - Recipient Account details + Brushed Champagne Gold "Salin No. Rekening" pill button
 */
export const MeplannerDigitalEnvelopeCard: React.FC<{
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  qrisImageUrl?: string;
  badgeLabel?: string;
  onCopy?: (accountNumber: string) => void;
  onCopyAccount?: (accountNumber: string) => void;
  copied?: boolean;
  lang?: 'ID' | 'EN';
  className?: string;
}> = ({
  bankName,
  accountNumber,
  accountHolder,
  qrisImageUrl,
  badgeLabel,
  onCopy,
  onCopyAccount,
  copied: externalCopied,
  lang = 'ID',
  className = '',
}) => {
  const [internalCopied, setInternalCopied] = useState(false);
  const isCopied = externalCopied ?? internalCopied;

  const handleCopyClick = () => {
    const copyHandler = onCopy || onCopyAccount;
    if (copyHandler) {
      copyHandler(accountNumber);
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      void navigator.clipboard.writeText(accountNumber);
    }
    setInternalCopied(true);
    setTimeout(() => setInternalCopied(false), 2000);
  };

  return (
    <div
      className={`relative rounded-[26px] overflow-hidden border border-[#D4AF37]/60 shadow-[0_22px_50px_rgba(12,14,20,0.45),inset_0_1px_1px_rgba(255,255,255,0.45)] select-none ${className}`}
    >
      {/* Top 62%: Brushed Champagne Gold Metallic Surface */}
      <div
        className="relative px-6 pt-5 pb-5 text-[#1C1917]"
        style={{
          background:
            'linear-gradient(125deg, #F5E6C4 0%, #DFC286 38%, #C8A45D 72%, #E8D2A0 100%)',
        }}
      >
        {/* Subtle Brushed Metal Horizontal Sheen Lines */}
        <div
          className="absolute inset-0 opacity-25 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 1px, transparent 1px, transparent 3px)',
          }}
        />

        <div className="relative z-10 flex items-start justify-between gap-4">
          {/* Left: MEPlanner Wordmark + 3D Gold EMV Chip */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-extrabold tracking-tight text-[#1C1917]">
                MEPlanner
              </span>
              {badgeLabel && (
                <span className="px-2 py-0.5 rounded-full bg-[#1C1917]/10 border border-[#1C1917]/20 text-[9px] font-extrabold uppercase tracking-wider text-[#1C1917]">
                  {badgeLabel}
                </span>
              )}
            </div>

            {/* EMV Gold Bank Chip */}
            <div className="flex items-center gap-3">
              <img
                src={MEPLANNER_ICONS.badgeChipAtm}
                alt="EMV Chip"
                className="w-13 h-10 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.25)]"
              />
              <svg
                viewBox="0 0 24 24"
                className="w-5 h-5 text-[#1C1917]/65"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M8.5 14.5A4 4 0 0 0 8.5 9.5" strokeLinecap="round" />
                <path d="M11.5 17A7.5 7.5 0 0 0 11.5 7" strokeLinecap="round" />
                <path d="M14.5 19.5A11 11 0 0 0 14.5 4.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Right: White QRIS Nasional Card Box with Red Corner Accents */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white p-2 shadow-[0_8px_20px_rgba(0,0,0,0.18)] border border-stone-200 flex flex-col justify-between shrink-0 overflow-hidden">
            {/* Red QRIS Corner Wedges */}
            <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#E11D48] rounded-r" />
            <div className="absolute right-0 bottom-0 w-4 h-4 bg-[#E11D48] [clip-path:polygon(100%_0,0_100%,100%_100%)]" />
            <div className="flex items-center justify-between px-1">
              <span className="text-[8px] font-black tracking-tighter text-stone-900">
                QRIS
              </span>
              <span className="text-[6px] font-bold uppercase text-stone-500">
                Nasional
              </span>
            </div>
            {qrisImageUrl ? (
              <img
                src={qrisImageUrl}
                alt="QRIS"
                className="w-full h-16 sm:h-18 object-contain mx-auto"
              />
            ) : (
              /* Crisp Vector QR Matrix with Center QRIS Tag */
              <svg
                viewBox="0 0 100 100"
                className="w-full h-16 sm:h-18 mx-auto"
                fill="#111827"
              >
                <rect x="6" y="6" width="26" height="26" rx="3" fill="none" stroke="#111827" strokeWidth="6" />
                <rect x="14" y="14" width="10" height="10" />
                <rect x="68" y="6" width="26" height="26" rx="3" fill="none" stroke="#111827" strokeWidth="6" />
                <rect x="76" y="14" width="10" height="10" />
                <rect x="6" y="68" width="26" height="26" rx="3" fill="none" stroke="#111827" strokeWidth="6" />
                <rect x="14" y="76" width="10" height="10" />
                {/* Data Modules */}
                <rect x="40" y="8" width="6" height="6" />
                <rect x="52" y="8" width="8" height="6" />
                <rect x="40" y="20" width="12" height="6" />
                <rect x="8" y="40" width="8" height="8" />
                <rect x="22" y="42" width="10" height="6" />
                <rect x="68" y="40" width="8" height="8" />
                <rect x="82" y="42" width="10" height="10" />
                <rect x="40" y="68" width="8" height="8" />
                <rect x="54" y="72" width="10" height="6" />
                <rect x="70" y="68" width="12" height="8" />
                <rect x="86" y="70" width="8" height="12" />
                <rect x="42" y="84" width="16" height="8" />
                <rect x="68" y="82" width="14" height="10" />
                {/* Center QRIS Box */}
                <rect x="33" y="38" width="34" height="22" rx="4" fill="#FFFFFF" stroke="#111827" strokeWidth="2.5" />
                <text x="50" y="53" textAnchor="middle" fontSize="10" fontWeight="900" fontFamily="sans-serif" fill="#111827">
                  QRIS
                </text>
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Gold Rim Divider Line */}
      <div className="h-[1.5px] w-full bg-gradient-to-r from-[#8A6412] via-[#FFF6D6] to-[#8A6412]" />

      {/* Bottom 38%: Obsidian Black Glassmorphism Bar */}
      <div
        className="relative px-6 py-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        style={{
          background:
            'linear-gradient(135deg, #16181F 0%, #0B0D12 55%, #07080B 100%)',
        }}
      >
        <div className="min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest text-stone-400">
            {lang === 'ID' ? 'Rekening Penerima' : 'Recipient Account'}
          </p>
          <p className="text-sm sm:text-base font-bold text-white truncate mt-0.5">
            {bankName} - <span className="font-mono tracking-wider text-[#F5E6C4]">{accountNumber}</span>
          </p>
          <p className="text-xs font-medium text-stone-300 truncate">
            An. {accountHolder}
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyClick}
          className="px-4 py-2.5 rounded-full font-bold text-xs text-[#1C1917] shadow-[0_6px_16px_rgba(212,175,55,0.35)] hover:brightness-110 active:scale-95 transition-all cursor-pointer inline-flex items-center justify-center gap-2 shrink-0"
          style={{
            background:
              'linear-gradient(135deg, #F5E6C4 0%, #D4AF37 55%, #B68D40 100%)',
          }}
        >
          <img
            src={MEPLANNER_ICONS.btnCopyRekening}
            alt=""
            className="w-4 h-4 object-contain"
          />
          <span>
            {isCopied
              ? lang === 'ID'
                ? 'Tersalin!'
                : 'Copied!'
              : lang === 'ID'
                ? 'Salin No. Rekening'
                : 'Copy Account No.'}
          </span>
        </button>
      </div>
    </div>
  );
};

/**
 * 4. OFFICIAL MEPLANNER COMMERCIAL LICENSE CERTIFICATE CARD (MITRA GOLD / ACTIVE TIER)
 * Built directly from: D:\EKO\FOTO\MEPlan_Brand_Kit\themes\mockup-8-commercial-envelope-and-certificate.jpg
 */
export const MeplannerLicenseCertificateCard: React.FC<{
  tierLabel?: string;
  licenseKey?: string;
  holderName?: string;
  partnerName?: string;
  statusLabel?: string;
  subtitle?: string;
  onActionClick?: () => void;
  actionLabel?: string;
  className?: string;
}> = ({
  tierLabel = 'MITRA GOLD',
  licenseKey = 'MEP-GOLD-8821-X901-KOKO',
  holderName,
  partnerName,
  statusLabel = 'VERIFIED PARTNER',
  subtitle = 'Illuminated Commercial License Key',
  onActionClick,
  actionLabel,
  className = '',
}) => {
  const effectiveHolderName = holderName || partnerName;
  return (
    <div
      className={`relative rounded-[26px] p-3 sm:p-4 overflow-hidden border border-[#D4AF37]/65 shadow-[0_24px_60px_rgba(8,10,16,0.6)] text-center select-none ${className}`}
      style={{
        background:
          'radial-gradient(circle at 50% 25%, #1D2233 0%, #10131D 60%, #090B10 100%)',
      }}
    >
      {/* Intricate Double Gold Guilloche Security Wave Frame */}
      <div className="relative rounded-[18px] border-2 border-[#D4AF37]/55 p-5 sm:p-7 overflow-hidden">
        {/* Inner Guilloche Pattern Border */}
        <div
          className="
            pointer-events-none absolute inset-1.5 rounded-[14px] border border-dashed border-[#F5E6C4]/35
          "
        />
        {/* Corner Gold Filigree Accents */}
        <img
          src={MEPLANNER_WEBKIT_COMPONENTS.corner1NusantaraUkir}
          alt=""
          className="pointer-events-none absolute top-1.5 left-1.5 w-10 h-10 object-contain opacity-75"
        />
        <img
          src={MEPLANNER_WEBKIT_COMPONENTS.corner1NusantaraUkir}
          alt=""
          className="pointer-events-none absolute top-1.5 right-1.5 w-10 h-10 object-contain -scale-x-100 opacity-75"
        />
        <img
          src={MEPLANNER_WEBKIT_COMPONENTS.corner1NusantaraUkir}
          alt=""
          className="pointer-events-none absolute bottom-1.5 left-1.5 w-10 h-10 object-contain -scale-y-100 opacity-75"
        />
        <img
          src={MEPLANNER_WEBKIT_COMPONENTS.corner1NusantaraUkir}
          alt=""
          className="pointer-events-none absolute bottom-1.5 right-1.5 w-10 h-10 object-contain -scale-x-100 -scale-y-100 opacity-75"
        />

        {/* Center 3D Metallic Gold Shield Emblem */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative w-24 h-28 sm:w-28 sm:h-32 flex items-center justify-center drop-shadow-[0_12px_24px_rgba(212,175,55,0.4)]">
            <svg viewBox="0 0 120 136" className="w-full h-full" fill="none">
              <defs>
                <linearGradient
                  id="certShieldGold"
                  x1="10"
                  y1="8"
                  x2="110"
                  y2="128"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#FFF7D6" />
                  <stop offset="35%" stopColor="#E6C35C" />
                  <stop offset="70%" stopColor="#C59B27" />
                  <stop offset="100%" stopColor="#7A5810" />
                </linearGradient>
                <linearGradient
                  id="certShieldInner"
                  x1="20"
                  y1="16"
                  x2="100"
                  y2="118"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop offset="0%" stopColor="#DFB94B" />
                  <stop offset="50%" stopColor="#F9E8A2" />
                  <stop offset="100%" stopColor="#9C7316" />
                </linearGradient>
              </defs>
              {/* Outer 3D Beveled Shield */}
              <path
                d="M60 6L110 22V64C110 98 86 120 60 130C34 120 10 98 10 64V22L60 6Z"
                fill="url(#certShieldGold)"
                stroke="#FFF8DC"
                strokeWidth="2"
              />
              {/* Inner Recessed Gold Shield */}
              <path
                d="M60 15L101 28V63C101 91 81 110 60 119C39 110 19 91 19 63V28L60 15Z"
                fill="url(#certShieldInner)"
                stroke="#6E4E0E"
                strokeWidth="1.5"
              />
              <text
                x="60"
                y="58"
                textAnchor="middle"
                fill="#2B1D03"
                fontFamily="sans-serif"
                fontSize="24"
                fontWeight="900"
                letterSpacing="1"
              >
                MEP
              </text>
              <text
                x="60"
                y="78"
                textAnchor="middle"
                fill="#2B1D03"
                fontFamily="sans-serif"
                fontSize="11"
                fontWeight="800"
                letterSpacing="1.5"
              >
                {tierLabel.split(' ')[0] || 'MITRA'}
              </text>
              <text
                x="60"
                y="93"
                textAnchor="middle"
                fill="#2B1D03"
                fontFamily="sans-serif"
                fontSize="11"
                fontWeight="900"
                letterSpacing="1.5"
              >
                {tierLabel.split(' ').slice(1).join(' ') || 'GOLD'}
              </text>
            </svg>
          </div>

          <p className="mt-2 text-[10px] sm:text-xs font-medium text-[#D4AF37]/90 tracking-wider">
            {subtitle}
          </p>
          {effectiveHolderName && (
            <p className="text-xs font-bold text-stone-300 mt-0.5">
              {effectiveHolderName}
            </p>
          )}

          {/* Illuminated Commercial License Key Pill */}
          <div className="mt-2.5 px-5 py-2.5 rounded-xl bg-[#1A1F2E]/90 border border-[#D4AF37]/55 shadow-[0_0_25px_rgba(212,175,55,0.2)]">
            <span className="font-mono text-xs sm:text-sm font-black tracking-[0.14em] text-[#FAF0CA]">
              {licenseKey}
            </span>
          </div>

          {/* Glowing Emerald Verified Partner Pill */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/80 shadow-[0_0_18px_rgba(16,185,129,0.45)]">
            <span className="w-3.5 h-3.5 rounded-full bg-emerald-400 text-emerald-950 flex items-center justify-center text-[9px] font-black">
              ✓
            </span>
            <span className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
              {statusLabel}
            </span>
          </div>

          {onActionClick && actionLabel && (
            <button
              type="button"
              onClick={onActionClick}
              className="mt-4 px-5 py-2 rounded-full text-xs font-extrabold text-[#170F04] bg-gradient-to-r from-[#FAF0CA] via-[#D4AF37] to-[#9A742B] shadow-md hover:brightness-110 transition cursor-pointer"
            >
              {actionLabel}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 5. LIVE GUEST RECEPTION & QR CHECK-IN TERMINAL
 * Built directly from: D:\EKO\FOTO\MEPlan_Brand_Kit\themes\commercial-guest-reception-screen.svg
 */
export const MeplannerGuestReceptionTerminal: React.FC<{
  eventTitle?: string;
  guestName?: string;
  guestSubtitle?: string;
  tableLabel?: string;
  paxLabel?: string;
  tokenKey?: string;
  tokenHash?: string;
  onScanClick?: () => void;
  lang?: 'ID' | 'EN';
  className?: string;
}> = ({
  eventTitle,
  guestName = 'Komjen Pol (Purn.) Hendra W.',
  guestSubtitle = 'Beserta Ibu • Tamu Kehormatan Mempelai',
  tableLabel = 'VVIP TABLE 01',
  paxLabel = '2 PAX HADIR',
  tokenKey,
  tokenHash,
  onScanClick,
  lang = 'ID',
  className = '',
}) => {
  const effectiveToken = tokenKey || tokenHash || 'JHi4b3XgT2RQIDhZ9coLw';
  const effectiveSubtitle = eventTitle
    ? `${eventTitle} • ${guestSubtitle}`
    : guestSubtitle;
  return (
    <div
      className={`rounded-[26px] p-4 sm:p-6 border-2 border-[#D4AF37]/50 shadow-[0_24px_60px_rgba(8,10,18,0.55)] text-white select-none ${className}`}
      style={{
        background:
          'linear-gradient(135deg, #141726 0%, #0D101B 55%, #080A12 100%)',
      }}
    >
      {/* Top Status Bar */}
      <div className="px-4 py-3 rounded-2xl bg-[#1A1F33] border border-[#2E3654] flex flex-wrap items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#10B981]" />
          <span className="text-[11px] sm:text-xs font-extrabold tracking-wider uppercase text-white">
            MEPLANNER • LIVE GUEST RECEPTION & QR CHECK-IN TERMINAL
          </span>
        </div>
        <span className="px-3 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400 text-emerald-300 font-mono text-[10px] font-bold">
          ● KEY & QR READY
        </span>
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left VIP Welcome Display Card (7 Cols) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#181D30] border border-[#D4AF37]/45 p-5 flex flex-col justify-between gap-4">
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-[#D4AF37]">
              {lang === 'ID'
                ? 'SELAMAT DATANG TAMU KEHORMATAN VVIP'
                : 'WELCOME HONORED VVIP GUEST'}
            </p>
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white mt-1.5">
              {guestName}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{effectiveSubtitle}</p>
          </div>

          {/* Table & Pax Pills */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-[#222942] border border-[#D4AF37]/50 p-3.5">
              <p className="font-mono text-[9px] font-bold uppercase text-[#D4AF37]">
                NOMOR MEJA / SEAT
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {tableLabel}
              </p>
            </div>
            <div className="rounded-2xl bg-[#222942] border border-cyan-400/40 p-3.5">
              <p className="font-mono text-[9px] font-bold uppercase text-cyan-300">
                KUOTA TERVERIFIKASI
              </p>
              <p className="text-lg sm:text-xl font-extrabold text-white mt-1">
                {paxLabel}
              </p>
            </div>
          </div>

          {/* Unique 21-Char Token Footer */}
          <div className="rounded-xl bg-[#101422] border border-[#2B3554] p-3">
            <p className="font-mono text-[9px] text-slate-400">
              TOKEN KEY 21-KARAKTER TERVERIFIKASI:
            </p>
            <p className="font-mono text-xs sm:text-sm font-bold text-sky-400 mt-0.5 tracking-wider break-all">
              {effectiveToken}
            </p>
          </div>
        </div>

        {/* Right Live QR Scanner & Attendance Stats (5 Cols) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#181D30] border border-[#2E3654] p-5 flex flex-col items-center justify-between text-center gap-3">
          {/* QR Box with Laser Scan Line */}
          <div className="relative w-36 h-36 rounded-2xl bg-white p-3 shadow-lg flex items-center justify-center overflow-hidden">
            <img
              src={MEPLANNER_ICONS.floatQrCheckin}
              alt="QR Scanner"
              className="w-28 h-28 object-contain"
            />
            <div className="absolute inset-x-2 top-1/2 h-0.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
          </div>

          <div>
            <p className="text-sm font-bold text-white">
              Check-In Instan 0.2 Detik
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Scan QR Undangan / Input Key Unik
            </p>
          </div>

          <button
            type="button"
            onClick={onScanClick}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#06281E] font-extrabold text-[11px] uppercase tracking-widest transition cursor-pointer shadow-md"
          >
            ✓ CHECK-IN TERKONFIRMASI
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 6. THEME-ADAPTIVE BUTTON WITH AUTHENTIC TEXTURES, WASHI TAPE, WAX SEAL & BARCODE STUB
 * Built directly from:
 * - D:\EKO\FOTO\MEPlan_Brand_Kit\icons\sheet-theme-adaptive-buttons.jpg
 * - D:\EKO\FOTO\MEPlan_Brand_Kit\icon-button-studio.html
 */
export const MeplannerAdaptiveButton: React.FC<{
  family?: WebkitButtonStyleFamily;
  themeStyle?: WebkitButtonStyleFamily;
  iconSvg?: string;
  label: string;
  onClick?: () => void;
  showWaxSealTop?: boolean;
  showTicketBarcodeStub?: boolean;
  disabled?: boolean;
  className?: string;
}> = ({
  family,
  themeStyle,
  iconSvg,
  label,
  onClick,
  showWaxSealTop = false,
  showTicketBarcodeStub = false,
  disabled = false,
  className = '',
}) => {
  const effectiveFamily: WebkitButtonStyleFamily =
    family || themeStyle || 'nusantara';
  if (showTicketBarcodeStub) {
    // Polaroid Magazine Perforated Ticket CTA Button (Mockup 2)
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className={`relative w-full py-3 px-5 rounded-xl bg-[#C86D51] hover:bg-[#B55B3F] text-white font-sans font-extrabold text-xs uppercase tracking-[0.18em] flex items-center justify-between gap-3 shadow-[0_8px_20px_rgba(200,109,81,0.35)] transition cursor-pointer disabled:opacity-60 overflow-hidden ${className}`}
      >
        {/* Left & Right Ticket Punch Notches */}
        <span className="w-3.5 h-3.5 rounded-full bg-[#FAF6EE] -ml-7 shrink-0" />
        <span className="flex items-center justify-center gap-2 flex-1">
          {iconSvg && <img src={iconSvg} alt="" className="w-4 h-4 object-contain" />}
          <span>{label}</span>
        </span>
        {/* Perforated Vertical Line + Barcode Stub */}
        <span className="pl-3 border-l-2 border-dashed border-[#FAF6EE]/70 flex items-center gap-0.5 shrink-0">
          <span className="w-0.5 h-5 bg-white/90" />
          <span className="w-1 h-5 bg-white/90" />
          <span className="w-0.5 h-5 bg-white/70" />
          <span className="w-1.5 h-5 bg-white/95" />
          <span className="w-0.5 h-5 bg-white/80" />
          <span className="w-1 h-5 bg-white/90" />
        </span>
        <span className="w-3.5 h-3.5 rounded-full bg-[#FAF6EE] -mr-7 shrink-0" />
      </button>
    );
  }

  const getFamilyStyles = (): React.CSSProperties => {
    switch (effectiveFamily) {
      case 'nusantara':
        return {
          background:
            'linear-gradient(135deg, #E7C66B 0%, #C59B27 50%, #9A7218 100%)',
          border: '2px solid #FFF3B8',
          color: '#1B0E08',
          boxShadow:
            '0 8px 24px rgba(212,175,55,0.38), inset 0 1px 2px rgba(255,255,255,0.65)',
        };
      case 'botanical':
        return {
          background:
            'linear-gradient(135deg, rgba(110,146,119,0.92) 0%, rgba(73,106,82,0.96) 100%)',
          border: '1.5px solid rgba(237,243,238,0.75)',
          color: '#FFFFFF',
          boxShadow: '0 8px 22px rgba(58,88,67,0.32)',
        };
      case 'glamour':
        return {
          background:
            'linear-gradient(135deg, #F6D0DD 0%, #E5A4B8 50%, #C97A93 100%)',
          border: '2px dotted #FFFFFF',
          color: '#4A1526',
          boxShadow:
            '0 8px 24px rgba(201,100,128,0.35), inset 0 1px 6px rgba(255,255,255,0.7)',
        };
      case 'editorial':
        return {
          background: '#F5EFE6',
          border: '1.5px dashed #1C1917',
          color: '#1C1917',
          boxShadow: '4px 4px 0px #C86D51',
        };
      case 'academic':
        return {
          background: 'linear-gradient(135deg, #162B4C 0%, #0E1D36 100%)',
          border: '1.5px solid #D4AF37',
          color: '#FAF0CA',
          boxShadow: '0 8px 22px rgba(14,29,54,0.45)',
        };
      case 'kids':
        return {
          background: 'linear-gradient(180deg, #FB8C78 0%, #F06A54 100%)',
          border: '2px solid #FFFFFF',
          color: '#FFFFFF',
          boxShadow: '0 5px 0px #C2412D, 0 10px 20px rgba(240,106,84,0.35)',
        };
    }
  };

  return (
    <div className={`relative inline-flex flex-col items-center ${className}`}>
      {showWaxSealTop && (
        <img
          src={MEPLANNER_WEBKIT_COMPONENTS.sealWaxRoyalCrimson}
          alt="Wax Seal"
          className="w-10 h-10 object-contain -mb-4 z-20 drop-shadow-[0_4px_8px_rgba(0,0,0,0.45)] pointer-events-none"
        />
      )}
      {effectiveFamily === 'editorial' && (
        <>
          {/* Washi Masking Tape Strips on Top-Left and Bottom-Right (from sheet-theme-adaptive-buttons.jpg) */}
          <span className="pointer-events-none absolute -top-1.5 -left-2 w-8 h-2.5 bg-[#E6D5B8]/85 -rotate-12 z-20 shadow-2xs" />
          <span className="pointer-events-none absolute -bottom-1.5 -right-2 w-8 h-2.5 bg-[#E6D5B8]/85 -rotate-12 z-20 shadow-2xs" />
        </>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        style={getFamilyStyles()}
        className="relative z-10 w-full px-6 py-3 rounded-full font-bold text-xs sm:text-sm tracking-wider flex items-center justify-center gap-2.5 transition-all hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-60"
      >
        {iconSvg && (
          <img src={iconSvg} alt="" className="w-5 h-5 object-contain shrink-0" />
        )}
        <span>{label}</span>
      </button>
    </div>
  );
};
