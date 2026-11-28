import type { AdminUser } from '@/types';

/**
 * Repairs double-encoded UTF-8 mojibake artifacts (e.g. `â€¢`, `Ã¢â‚¬Â¢`, `â€”`)
 * that can appear in legacy database strings, returning crisp typography.
 */
export function cleanMojibake(raw?: string | null): string {
  if (!raw) return '';
  return String(raw)
    .replace(/Ã¢â‚¬Â¢|â€¢|â€¢|\uFFFD+/g, '•')
    .replace(/Ã¢â‚¬â€|â€”/g, '—')
    .replace(/Ã¢â‚¬â€œ|â€“/g, '–')
    .replace(/Ã‚Â·|Â·/g, '·')
    .replace(/Ã‚Â|Â(?=\s|$)/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Extracts a clean, human-readable sub-role (e.g. "Mempelai Pria", "Koordinator WO")
 * by stripping robotic internal prefixes like "User Default • ".
 */
export function extractCustomSubRole(
  user: Pick<AdminUser, 'role' | 'jabatan'>
): string {
  const cleaned = cleanMojibake(user.jabatan)
    .replace(/^(?:user|akun)\s+default\s*[^a-zA-Z0-9]+\s*/i, '')
    .replace(/^klien\s*:\s*/i, '')
    .trim();

  if (cleaned && !/^user\s+default$/i.test(cleaned)) {
    return cleaned;
  }

  switch (user.role) {
    case 'SUPERADMIN':
      return 'Superadmin';
    case 'MEMPELAI_PRIA':
      return 'Mempelai Pria';
    case 'MEMPELAI_WANITA':
      return 'Mempelai Wanita';
    case 'KELUARGA_PRIA':
      return 'Keluarga Mempelai Pria';
    case 'KELUARGA_WANITA':
      return 'Keluarga Mempelai Wanita';
    case 'PANITIA':
      return 'EO / Panitia Acara';
    default:
      return 'Pengelola Acara';
  }
}

/**
 * Extracts a clean event/couple label (e.g. "Agung & Selo") from a clientName
 * or coupleLabel string.
 */
export function extractCleanEventLabel(
  rawLabel?: string | null,
  fallback = 'Agung & Selo'
): string {
  const cleaned = cleanMojibake(rawLabel);
  if (!cleaned) return fallback;
  const stripped = cleaned
    .replace(/^(?:client|klien)\s*(?:utama|demo)?\s*[•·—–:-]\s*/i, '')
    .replace(/^(?:planner|wo|eo)\s*(?:\/\s*wo)?\s*[•·—–:-]\s*/i, '')
    .trim();
  return stripped || cleaned;
}

/**
 * Formats an account's role & workspace in clear, natural Indonesian:
 * e.g. "Klien: Agung & Selo — Mempelai Pria"
 * or   "EO / Panitia: Agung & Selo — Koordinator WO"
 */
export function formatHumanAccountRole(
  user: Pick<AdminUser, 'role' | 'jabatan' | 'clientName'>,
  coupleLabelOverride?: string | null
): string {
  const subRole = extractCustomSubRole(user);
  if (user.role === 'SUPERADMIN') {
    return subRole === 'Superadmin'
      ? 'Superadmin — Pengelola Platform'
      : `Superadmin — ${subRole}`;
  }

  const eventLabel = extractCleanEventLabel(
    coupleLabelOverride || user.clientName,
    'Acara Utama'
  );

  const isPlannerOrEo =
    user.role === 'PANITIA' ||
    /\b(panitia|wo|eo|planner|organizer)\b/i.test(subRole);

  if (isPlannerOrEo) {
    return `EO / Panitia: ${eventLabel} — ${subRole}`;
  }

  return `Klien: ${eventLabel} — ${subRole}`;
}

/**
 * Formats internal package tier enums (`ROYAL_VIP`, `MITRA_GOLD`, etc.) into
 * clean display badges.
 */
export function formatPackageTierLabel(rawTier?: string | null): string {
  const clean = cleanMojibake(rawTier).toUpperCase().replace(/\s+/g, '_');
  switch (clean) {
    case 'ROYAL_VIP':
      return 'Royal VIP';
    case 'EXCLUSIVE':
      return 'Exclusive';
    case 'STARTER':
      return 'Starter';
    case 'GRATIS':
      return 'Gratis';
    case 'PREMIUM':
      return 'Premium';
    case 'BUSINESS':
      return 'Business';
    case 'ENTERPRISE':
      return 'Enterprise';
    case 'MITRA_SILVER':
      return 'Mitra Silver';
    case 'MITRA_GOLD':
      return 'Mitra Gold';
    default:
      return cleanMojibake(rawTier).replace(/_/g, ' ') || 'Gratis';
  }
}
