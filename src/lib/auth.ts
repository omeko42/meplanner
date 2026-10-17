import crypto from 'crypto';
import { NextRequest } from 'next/server';
import { AdminUser } from '@/types';
import { serverStore } from '@/lib/serverStore';

export const SESSION_COOKIE_NAME = 'wedding_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

interface SessionPayload {
  sub: string;
  username: string;
  email: string;
  nama: string;
  role: AdminUser['role'];
  jabatan: string;
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
      // Constant-time dummy comparison
      crypto.timingSafeEqual(a, a);
      return false;
    }
    return crypto.timingSafeEqual(a, b);
  }

  return false;
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
  const lockedUntil = attempts >= 5 ? now + 5 * 60 * 1000 : 0; // Lock 5 mins after 5 failed tries
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

  // 1. Check Production Environment Variable Override first (if configured on Vercel / .env.local)
  const envEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const envUsername = (process.env.ADMIN_USERNAME || 'admin').trim().toLowerCase();
  const envPassword = process.env.ADMIN_PASSWORD?.trim();
  const envName = process.env.ADMIN_NAME || 'Administrator Utama';

  if (envPassword && (cleanId === envEmail || cleanId === envUsername)) {
    if (verifyPasswordTimingSafe(cleanPw, envPassword)) {
      return {
        id: 'env-admin-1',
        username: envUsername,
        nama: envName,
        role: 'MEMPELAI_PRIA',
        jabatan: 'Superadmin • Mempelai & Keluarga',
        email: envEmail || 'admin@wedding.id',
      };
    }
  }

  // 2. Check Local Database Admin Users
  const dbAdmins = serverStore.getAdminUsers();
  for (const user of dbAdmins) {
    const matchId =
      user.username.toLowerCase() === cleanId || user.email.toLowerCase() === cleanId;
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
      };
    }
  }

  return null;
}
