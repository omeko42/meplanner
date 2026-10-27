import { WeddingGuest, WeddingSettings } from '@/types';

const BASE62_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function fnv1a32(input: string, seed: number): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  // Final avalanche mix
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

function uint32ToBase62(num: number, length: number): string {
  let v = num >>> 0;
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += BASE62_ALPHABET[v % 62];
    v = Math.floor(v / 62);
  }
  return out;
}

function buildBase62HashWithPrefix(
  prefix: string,
  clientId: string | undefined | null,
  guest: {
    id?: string;
    invitationCode?: string;
    guestName?: string;
  }
): string {
  const normalizedClient = (clientId || 'client-utama').trim().toLowerCase();
  const guestKey = `${normalizedClient}::${(guest.id || '').trim()}::${(
    guest.invitationCode || ''
  ).trim()}::${(guest.guestName || '').trim().toLowerCase()}`;

  const p1 = uint32ToBase62(fnv1a32(`${prefix}_s1_${guestKey}`, 0x811c9dc5), 6);
  const p2 = uint32ToBase62(fnv1a32(`${prefix}_s2_${guestKey}`, 0x9e3779b9), 5);
  const p3 = uint32ToBase62(fnv1a32(`${prefix}_s3_${guestKey}`, 0x517cc1b7), 5);
  const p4 = uint32ToBase62(fnv1a32(`${prefix}_s4_${guestKey}`, 0x27d4eb2f), 5);

  return `${p1}${p2}${p3}${p4}`; // 21 Base62 characters
}

export function computeLegacyGuestInvitationHash(
  clientId: string | undefined | null,
  guest: {
    id?: string;
    invitationCode?: string;
    guestName?: string;
    invitationToken?: string;
  }
): string {
  const explicitToken = guest.invitationToken?.trim();
  if (
    explicitToken &&
    explicitToken.length >= 12 &&
    !/^INV-\d+$/i.test(explicitToken)
  ) {
    return explicitToken;
  }
  return buildBase62HashWithPrefix('mep', clientId, guest);
}

/**
 * Generates a deterministic 21-character Base62 invitation hash token
 * (e.g. "JHi4b3XgT2RQIDhZ9coLw") that uniquely identifies both the Client
 * Workspace and the Guest across the entire multi-client platform.
 */
export function computeGuestInvitationHash(
  clientId: string | undefined | null,
  guest: {
    id?: string;
    invitationCode?: string;
    guestName?: string;
    invitationToken?: string;
  }
): string {
  const explicitToken = guest.invitationToken?.trim();
  if (
    explicitToken &&
    explicitToken.length >= 12 &&
    !/^INV-\d+$/i.test(explicitToken)
  ) {
    return explicitToken;
  }
  return buildBase62HashWithPrefix('mep_v2', clientId, guest);
}

export interface ResolvedMultiClientGuestMatch {
  clientId: string;
  clientLabel: string;
  guest: WeddingGuest;
  hashToken: string;
}

export function resolveGuestByHashTokenAcrossWorkspaces(
  rawQuery: string,
  workspaces: Array<{
    clientId: string;
    clientLabel: string;
    guests: WeddingGuest[];
  }>
): ResolvedMultiClientGuestMatch | null {
  const q = rawQuery.trim();
  if (!q) return null;
  const qLower = q.toLowerCase();

  // 1. Exact Base62 Hash Token match (current v2 or legacy v1, case-sensitive first, then case-insensitive)
  for (const ws of workspaces) {
    for (const guest of ws.guests || []) {
      const hashToken = computeGuestInvitationHash(ws.clientId, guest);
      const legacyToken = computeLegacyGuestInvitationHash(ws.clientId, guest);
      if (
        hashToken === q ||
        hashToken.toLowerCase() === qLower ||
        legacyToken === q ||
        legacyToken.toLowerCase() === qLower
      ) {
        const matchedToken =
          legacyToken === q || legacyToken.toLowerCase() === qLower
            ? legacyToken
            : hashToken;
        return {
          clientId: ws.clientId,
          clientLabel: ws.clientLabel,
          guest,
          hashToken: matchedToken,
        };
      }
    }
  }

  // 2. Fallback: if someone enters a full client+code or >= 8 char prefix of hashToken / legacyToken
  if (q.length >= 8) {
    for (const ws of workspaces) {
      for (const guest of ws.guests || []) {
        const hashToken = computeGuestInvitationHash(ws.clientId, guest);
        const legacyToken = computeLegacyGuestInvitationHash(ws.clientId, guest);
        if (
          hashToken.toLowerCase().startsWith(qLower) ||
          legacyToken.toLowerCase().startsWith(qLower)
        ) {
          return {
            clientId: ws.clientId,
            clientLabel: ws.clientLabel,
            guest,
            hashToken,
          };
        }
      }
    }
  }

  return null;
}

export function matchGuestWithinSingleClient(
  rawQuery: string,
  clientId: string | undefined,
  guests: WeddingGuest[]
): WeddingGuest | null {
  const q = rawQuery.trim();
  if (!q) return null;
  const qLower = q.toLowerCase();

  for (const g of guests) {
    const hashToken = computeGuestInvitationHash(clientId, g);
    const legacyToken = computeLegacyGuestInvitationHash(clientId, g);
    if (
      hashToken === q ||
      hashToken.toLowerCase() === qLower ||
      legacyToken === q ||
      legacyToken.toLowerCase() === qLower ||
      g.invitationCode.trim().toLowerCase() === qLower ||
      g.guestName.trim().toLowerCase() === qLower
    ) {
      return g;
    }
  }
  return null;
}
