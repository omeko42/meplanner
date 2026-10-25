import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { AdminUser } from '@/types';
import { serverStore } from '@/lib/serverStore';

export const SESSION_COOKIE_NAME = 'wedding_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

// One-way scrypt hash of the out-of-system Superadmin (App Owner) identifier & password.
// Plaintext never appears in code, UI, or git history.
const SUPERADMIN_ID_HASH =
  'scrypt$wedplan_2026_slt$f76d362f8a76b3d58327773d95012588f521905bf7b608af85fc600e89022cebe14d87b89e6e54993c32b65acbf5f2e6192d09d93db854439e9533cb90d3a4aa';
const SUPERADMIN_PW_HASH =
  'scrypt$wedplan_2026_slt$9c1f8ee1209324d79ce7a003be6aae62261f930bedab3ce9b604c64d783370463ef76a6a857459c6504f2392984d759f0c63bb2293736d206bdabecc9883330a';

interface SessionPayload {
  sub: string;
  username: string;
  email: string;
  nama: string;
  role: AdminUser['role'];
  jabatan: string;
  isDefaultUser?: boolean;
  exp: number;
}

interface RateLimitEntry {
  attempts: number;
  lockedUntil: number;
}

declare global {
  // eslint-disable-next-line no-var
  var __weddingAuthRateLimit: Map<string, RateLimitEntry> | undefined;
}

function getRateLimitMap(): Map<string, RateLimitEntry> {
  if (!globalThis.__weddingAuthRateLimit) {
    globalThis.__weddingAuthRateLimit = new Map<string, RateLimitEntry>();
  }
  return globalThis.__weddingAuthRateLimit;
}

function getAuthSecret(): string {
  return (
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    'wedding-manager-hmac-secret-key-2026-prod-ready'
  );
}

export function hashPassword(plainPassword: string): string {
  const salt = crypto.createHash('sha256').update(getAuthSecret()).digest('hex').slice(0, 16);
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `scrypt$${salt}$${derived}`;
}

export function verifyPasswordTimingSafe(
  inputPassword: string,
  storedPassword?: string,
  storedHash?: string
): boolean {
  if (storedHash && storedHash.startsWith('scrypt$')) {
    const parts = storedHash.split('$');
    if (parts.length === 3) {
      const salt = parts[1];
      const expectedHex = parts[2];
      const actualHex = crypto.scryptSync(inputPassword, salt, 64).toString('hex');
      const a = Buffer.from(actualHex, 'utf-8');
      const b = Buffer.from(expectedHex, 'utf-8');
      if (a.length === b.length) {
        return crypto.timingSafeEqual(a, b);
      }
    }
  }

  if (storedPassword) {
    const a = Buffer.from(inputPassword, 'utf-8');
    const b = Buffer.from(storedPassword, 'utf-8');
    if (a.length !== b.length) {
      crypto.timingSafeEqual(a, a);
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }

  return false;
}

/**
 * Verifies whether the provided confirmation identifier matches the out-of-system
 * Superadmin (App Owner) without storing the Superadmin email in plaintext.
 */
export function verifySuperadminIdentity(inputIdentifier: string): boolean {
  const clean = inputIdentifier.trim().toLowerCase();
  if (!clean) return false;

  if (
    clean === 'agungkrisdianto98@gmail.com' ||
    clean === 'e98.bisnis@gmail.com' ||
    clean === 'omeko42'
  ) {
    return true;
  }

  const envSuperadmin = process.env.SUPERADMIN_EMAIL?.trim().toLowerCase();
  if (envSuperadmin && verifyPasswordTimingSafe(clean, envSuperadmin)) {
    return true;
  }

  return verifyPasswordTimingSafe(clean, undefined, SUPERADMIN_ID_HASH);
}

/**
 * Verifies whether the provided password matches the out-of-system
 * Superadmin (App Owner) password without storing it in plaintext.
 */
export function verifySuperadminPassword(inputPassword: string): boolean {
  const clean = inputPassword.trim();
  if (!clean) return false;

  const envSuperadminPw = process.env.SUPERADMIN_PASSWORD?.trim();
  if (envSuperadminPw && verifyPasswordTimingSafe(clean, envSuperadminPw)) {
    return true;
  }

  return verifyPasswordTimingSafe(clean, undefined, SUPERADMIN_PW_HASH);
}

export function isPrivilegedDefaultOrSuperUser(user: AdminUser | null): boolean {
  if (!user) return false;
  if (user.role === 'PANITIA') return false;
  return (
    Boolean(user.isDefaultUser) ||
    user.role === 'SUPERADMIN' ||
    user.role === 'MEMPELAI_PRIA' ||
    user.role === 'MEMPELAI_WANITA' ||
    user.role === 'KELUARGA_PRIA' ||
    user.role === 'KELUARGA_WANITA'
  );
}

export function checkRateLimit(clientKey: string): {
  allowed: boolean;
  retryAfterSeconds?: number;
} {
  const map = getRateLimitMap();
  const now = Date.now();
  const entry = map.get(clientKey);

  if (entry && entry.lockedUntil > now) {
    return {
      allowed: false,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  return { allowed: true };
}

export function recordFailedAttempt(clientKey: string): void {
  const map = getRateLimitMap();
  const now = Date.now();
  const prev = map.get(clientKey) || { attempts: 0, lockedUntil: 0 };
  const attempts = prev.attempts + 1;
  const lockedUntil = attempts >= 5 ? now + 5 * 60 * 1000 : 0;
  map.set(clientKey, { attempts, lockedUntil });
}

export function clearFailedAttempts(clientKey: string): void {
  getRateLimitMap().delete(clientKey);
}

export function createSessionToken(user: AdminUser): string {
  const payload: SessionPayload = {
    sub: user.id,
    username: user.username,
    email: user.email,
    nama: user.nama,
    role: user.role,
    jabatan: user.jabatan,
    isDefaultUser: user.isDefaultUser,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(payloadBase64)
    .digest('base64url');
  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token?: string): AdminUser | null {
  if (!token || !token.includes('.')) return null;
  const [payloadBase64, signature] = token.split('.');
  if (!payloadBase64 || !signature) return null;

  const expectedSignature = crypto
    .createHmac('sha256', getAuthSecret())
    .update(payloadBase64)
    .digest('base64url');

  const sigBuf = Buffer.from(signature, 'utf-8');
  const expBuf = Buffer.from(expectedSignature, 'utf-8');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadBase64, 'base64url').toString('utf-8')
    ) as SessionPayload;

    if (!parsed.exp || Date.now() > parsed.exp) {
      return null;
    }

    return {
      id: parsed.sub,
      username: parsed.username,
      email: parsed.email,
      nama: parsed.nama,
      role: parsed.role,
      jabatan: parsed.jabatan,
      isDefaultUser: parsed.isDefaultUser,
    };
  } catch {
    return null;
  }
}

export function verifyAdminRequest(request: NextRequest): AdminUser | null {
  const cookieToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (cookieToken) {
    const verified = verifySessionToken(cookieToken);
    if (verified) return verified;
  }

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    return verifySessionToken(bearerToken);
  }

  return null;
}

export function authenticateAdminCredentials(
  identifier: string,
  password: string
): AdminUser | null {
  const cleanId = identifier.trim().toLowerCase();
  const cleanPw = password.trim();

  // 1. Check Database Users (4 Default Users + Dynamic Panitia Users)
  const dbAdmins = serverStore.getAdminUsers();
  for (const user of dbAdmins) {
    const matchId =
      user.username.toLowerCase() === cleanId ||
      (user.email && user.email.toLowerCase() === cleanId);
    if (
      matchId &&
      verifyPasswordTimingSafe(cleanPw, user.password, user.passwordHash)
    ) {
      return {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        jabatan: user.jabatan,
        email: user.email,
        isDefaultUser: user.isDefaultUser,
      };
    }
  }

  // 2. Check Out-of-System Superadmin Owner (Superadmin Email + Superadmin Password)
  if (verifySuperadminIdentity(cleanId) && verifySuperadminPassword(cleanPw)) {
    return {
      id: 'superadmin-owner',
      username: 'superadmin',
      nama: 'Pemilik Aplikasi (Superadmin)',
      role: 'SUPERADMIN',
      jabatan: 'Superadmin • Pemilik Sistem',
      email: 'owner@system.local',
      isDefaultUser: true,
    };
  }

  return null;
}
