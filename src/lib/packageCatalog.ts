/**
 * Server-authoritative commercial package catalogue.
 *
 * The pricing used to live only in the React landing page, so the browser
 * decided what a package costs and what wallet should receive the money.
 * A tampered client could therefore claim to have paid Rp 1 instead of
 * Rp 375.000 and the server had no way to disagree.
 *
 * The catalogue now lives on the server. The UI reads it from
 * `GET /api/payment/catalog`; the payment verifier compares the on-chain
 * amount and recipient against these values.
 */

export type CatalogCurrency = 'IDR' | 'USD';

export interface CatalogPackage {
  id: string;
  tier: string;
  name: string;
  /** Amount charged, in the currency's minor unit (IDR has no decimals). */
  amount: number;
  currency: CatalogCurrency;
  /** Crypto amount in whole units, used for on-chain comparison. */
  cryptoAmount: number;
  /** Invitations included. */
  invitations: number;
  /** Days of validity; 0 means lifetime. */
  validityDays: number;
}

export const PACKAGE_CATALOG: CatalogPackage[] = [
  {
    id: 'GRATIS',
    tier: 'STARTER',
    name: 'Gratis',
    amount: 0,
    currency: 'IDR',
    cryptoAmount: 0,
    invitations: 1,
    validityDays: 14,
  },
  {
    id: 'PREMIUM',
    tier: 'STARTER',
    name: 'Premium',
    amount: 51750,
    currency: 'IDR',
    cryptoAmount: 4,
    invitations: 1,
    validityDays: 0,
  },
  {
    id: 'BUSINESS',
    tier: 'EXCLUSIVE',
    name: 'Business',
    amount: 74250,
    currency: 'IDR',
    cryptoAmount: 5,
    invitations: 2,
    validityDays: 0,
  },
  {
    id: 'ENTERPRISE',
    tier: 'ROYAL VIP',
    name: 'Enterprise',
    amount: 180000,
    currency: 'IDR',
    cryptoAmount: 12,
    invitations: 5,
    validityDays: 0,
  },
  {
    id: 'MITRA_SILVER',
    tier: 'ROYAL VIP',
    name: 'Mitra - Silver',
    amount: 375000,
    currency: 'IDR',
    cryptoAmount: 25,
    invitations: 11,
    validityDays: 0,
  },
  {
    id: 'MITRA_GOLD',
    tier: 'ROYAL VIP',
    name: 'Mitra - Gold',
    amount: 750000,
    currency: 'IDR',
    cryptoAmount: 49,
    invitations: 23,
    validityDays: 0,
  },
];

const CATALOG_BY_ID = new Map(PACKAGE_CATALOG.map((p) => [p.id, p]));

export type PackageTierKey =
  | 'GRATIS'
  | 'PREMIUM'
  | 'BUSINESS'
  | 'ENTERPRISE'
  | 'MITRA_SILVER'
  | 'MITRA_GOLD';

export interface PackageCapabilities {
  tierKey: PackageTierKey;
  rank: number;
  packageName: string;
  priceLabel: string;
  maxInvitations: number;
  maxGuests: number;
  maxGalleryPhotos: number;
  storageQuotaMb: number;
  activePeriodLabel: string;
  canUsePremiumThemes: boolean;
  canUseGuestReception: boolean;
  canUseBudgetPlanner: boolean;
  canExportReports: boolean;
  canManagePanitia: boolean;
  hasWhiteLabelText: boolean;
  hasWhiteLabelLogo: boolean;
}

/**
 * Single authoritative capability resolver for all 6 commercial tiers
 * (Gratis -> Premium -> Business -> Enterprise -> Mitra Silver -> Mitra Gold).
 * Handles legacy tier aliases (`STARTER`, `EXCLUSIVE`, `ROYAL_VIP`) cleanly.
 */
export function resolvePackageCapabilities(rawInput?: string | null): PackageCapabilities {
  const rawTier = String(rawInput || 'GRATIS')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');

  if (
    rawTier === 'GRATIS' ||
    rawTier === 'STARTER' ||
    rawTier === 'FREE' ||
    rawTier === 'TRIAL'
  ) {
    return {
      tierKey: 'GRATIS',
      rank: 0,
      packageName: 'Paket Gratis',
      priceLabel: 'Rp 0',
      maxInvitations: 1,
      maxGuests: 30,
      maxGalleryPhotos: 4,
      storageQuotaMb: 50,
      activePeriodLabel: 'Uji Coba Gratis • Aktif 14 Hari',
      canUsePremiumThemes: false,
      canUseGuestReception: false,
      canUseBudgetPlanner: false,
      canExportReports: false,
      canManagePanitia: false,
      hasWhiteLabelText: false,
      hasWhiteLabelLogo: false,
    };
  }

  if (rawTier === 'PREMIUM') {
    return {
      tierKey: 'PREMIUM',
      rank: 1,
      packageName: 'Paket Premium',
      priceLabel: 'Rp 51.750',
      maxInvitations: 1,
      maxGuests: Infinity,
      maxGalleryPhotos: Infinity,
      storageQuotaMb: 250,
      activePeriodLabel: 'Aktif Selamanya (1 Undangan Premium)',
      canUsePremiumThemes: true,
      canUseGuestReception: true,
      canUseBudgetPlanner: false,
      canExportReports: false,
      canManagePanitia: false,
      hasWhiteLabelText: false,
      hasWhiteLabelLogo: false,
    };
  }

  if (rawTier === 'MITRA_SILVER' || rawTier === 'SILVER') {
    return {
      tierKey: 'MITRA_SILVER',
      rank: 4,
      packageName: 'Paket Mitra Silver',
      priceLabel: 'Rp 375.000',
      maxInvitations: 11,
      maxGuests: Infinity,
      maxGalleryPhotos: Infinity,
      storageQuotaMb: 2048,
      activePeriodLabel: 'Aktif Selamanya (Kuota 11 Undangan WO/EO)',
      canUsePremiumThemes: true,
      canUseGuestReception: true,
      canUseBudgetPlanner: true,
      canExportReports: true,
      canManagePanitia: true,
      hasWhiteLabelText: true,
      hasWhiteLabelLogo: false,
    };
  }

  if (rawTier === 'MITRA_GOLD' || rawTier === 'GOLD') {
    return {
      tierKey: 'MITRA_GOLD',
      rank: 5,
      packageName: 'Paket Mitra Gold',
      priceLabel: 'Rp 750.000',
      maxInvitations: 23,
      maxGuests: Infinity,
      maxGalleryPhotos: Infinity,
      storageQuotaMb: 5120,
      activePeriodLabel: 'Aktif Selamanya (Kuota 23 Undangan Agensi VIP)',
      canUsePremiumThemes: true,
      canUseGuestReception: true,
      canUseBudgetPlanner: true,
      canExportReports: true,
      canManagePanitia: true,
      hasWhiteLabelText: true,
      hasWhiteLabelLogo: true,
    };
  }

  if (rawTier === 'ENTERPRISE' || rawTier === 'ROYAL_VIP') {
    return {
      tierKey: 'ENTERPRISE',
      rank: 3,
      packageName: 'Paket Enterprise',
      priceLabel: 'Rp 180.000',
      maxInvitations: 5,
      maxGuests: Infinity,
      maxGalleryPhotos: Infinity,
      storageQuotaMb: 1024,
      activePeriodLabel: 'Aktif Selamanya (Kuota 5 Undangan Premium)',
      canUsePremiumThemes: true,
      canUseGuestReception: true,
      canUseBudgetPlanner: true,
      canExportReports: true,
      canManagePanitia: true,
      hasWhiteLabelText: false,
      hasWhiteLabelLogo: false,
    };
  }

  return {
    tierKey: 'BUSINESS',
    rank: 2,
    packageName: 'Paket Business',
    priceLabel: 'Rp 74.250',
    maxInvitations: 2,
    maxGuests: Infinity,
    maxGalleryPhotos: Infinity,
    storageQuotaMb: 500,
    activePeriodLabel: 'Aktif Selamanya (Kuota 2 Undangan Premium)',
    canUsePremiumThemes: true,
    canUseGuestReception: true,
    canUseBudgetPlanner: true,
    canExportReports: true,
    canManagePanitia: false,
    hasWhiteLabelText: false,
    hasWhiteLabelLogo: false,
  };
}

export function getCatalogPackage(id: string): CatalogPackage | undefined {
  return CATALOG_BY_ID.get((id || '').trim().toUpperCase());
}

/**
 * Resolves the amount that must actually be received for a package.
 *
 * Returns null for unknown packages so the caller can reject the order
 * instead of falling back to a zero amount.
 */
export function resolveExpectedAmount(
  packageId: string
): { amount: number; cryptoAmount: number; currency: CatalogCurrency } | null {
  const pkg = getCatalogPackage(packageId);
  if (!pkg) return null;
  return {
    amount: pkg.amount,
    cryptoAmount: pkg.cryptoAmount,
    currency: pkg.currency,
  };
}

/**
 * Compares the observed on-chain amount against the expected one.
 *
 * A small tolerance absorbs exchange-rate drift for stablecoins, but a
 * materially different amount is rejected.
 */
export function isAmountSatisfied(
  observedAmount: number,
  expectedAmount: number,
  toleranceRatio = 0.02
): boolean {
  if (!Number.isFinite(observedAmount) || !Number.isFinite(expectedAmount)) {
    return false;
  }
  if (expectedAmount <= 0) return observedAmount >= 0;
  const tolerance = expectedAmount * toleranceRatio;
  return observedAmount >= expectedAmount - tolerance;
}

/**
 * Wallet addresses that are allowed to receive funds.
 *
 * Configured via env so the addresses can be rotated without a deploy, and so
 * an empty list means "no crypto channel is enabled" rather than "accept any
 * address".
 */
export function getAllowedRecipientAddresses(): string[] {
  const raw =
    process.env.PAYMENT_CRYPTO_RECIPIENTS?.split(',').map((v) => v.trim()) ?? [];
  return raw.filter(Boolean);
}

/**
 * Checks a transaction recipient against the allow-list.
 *
 * Comparison is case-insensitive for the common hex address formats.
 */
export function isAllowedRecipient(address: string | undefined): boolean {
  const allowed = getAllowedRecipientAddresses();
  if (allowed.length === 0) return false;
  if (!address) return false;
  const clean = address.trim().toLowerCase();
  return allowed.some((a) => a.trim().toLowerCase() === clean);
}
