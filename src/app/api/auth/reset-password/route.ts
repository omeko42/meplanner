import crypto from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { hashPassword } from '@/lib/auth';
import { apiError, rateLimit, rejectDisallowedOrigin } from '@/lib/apiGuard';
import { buildPasswordResetEmail, sendEmail } from '@/lib/email';
import {
  SITE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
  resolveClientIp,
} from '@/lib/env';
import { serverStore } from '@/lib/serverStore';
import { saveStateToSupabase } from '@/lib/supabaseCloud';
import { verifyTurnstileToken } from '@/lib/turnstile';

export const dynamic = 'force-dynamic';

interface MemoryResetToken {
  id: string;
  email: string;
  tokenHash: string;
  expiresAtMs: number;
  consumedAt?: string;
}

declare global {
  // eslint-disable-next-line no-var
  var __meplannerResetTokens: Map<string, MemoryResetToken> | undefined;
}

function getMemoryTokenMap(): Map<string, MemoryResetToken> {
  if (!globalThis.__meplannerResetTokens) {
    globalThis.__meplannerResetTokens = new Map();
  }
  return globalThis.__meplannerResetTokens;
}

function sha256Hex(raw: string): string {
  return crypto.createHash('sha256').update(raw).digest('hex');
}

function serviceHeaders(extra?: Record<string, string>): Record<string, string> {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY || '',
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY || ''}`,
    'Content-Type': 'application/json',
    ...(extra || {}),
  };
}

async function storeResetToken(email: string, rawToken: string): Promise<void> {
  const id = `rst_${crypto.randomBytes(8).toString('hex')}`;
  const tokenHash = sha256Hex(rawToken);
  const expiresAtMs = Date.now() + 30 * 60 * 1000; // 30 minutes
  const expiresAtIso = new Date(expiresAtMs).toISOString();

  getMemoryTokenMap().set(tokenHash, {
    id,
    email,
    tokenHash,
    expiresAtMs,
  });

  if (SUPABASE_SERVICE_ROLE_KEY) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/app_email_tokens`, {
        method: 'POST',
        headers: serviceHeaders({ Prefer: 'return=minimal' }),
        body: JSON.stringify({
          id,
          email,
          token_hash: tokenHash,
          purpose: 'RESET_PASSWORD',
          expires_at: expiresAtIso,
        }),
        cache: 'no-store',
      });
    } catch {
      // Fallback already recorded in memory map.
    }
  }
}

async function consumeResetToken(rawToken: string): Promise<string | null> {
  const tokenHash = sha256Hex(rawToken);
  const nowIso = new Date().toISOString();

  if (SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const lookupRes = await fetch(
        `${SUPABASE_URL}/rest/v1/app_email_tokens?token_hash=eq.${encodeURIComponent(
          tokenHash
        )}&purpose=eq.RESET_PASSWORD&consumed_at=is.null&select=id,email,expires_at`,
        {
          method: 'GET',
          headers: serviceHeaders({ Accept: 'application/json' }),
          cache: 'no-store',
        }
      );
      if (lookupRes.ok) {
        const rows = (await lookupRes.json().catch(() => [])) as Array<{
          id: string;
          email: string;
          expires_at: string;
        }>;
        const row = rows[0];
        if (row && Date.parse(row.expires_at) > Date.now()) {
          await fetch(
            `${SUPABASE_URL}/rest/v1/app_email_tokens?id=eq.${encodeURIComponent(row.id)}`,
            {
              method: 'PATCH',
              headers: serviceHeaders({ Prefer: 'return=minimal' }),
              body: JSON.stringify({ consumed_at: nowIso }),
              cache: 'no-store',
            }
          );
          return row.email.trim().toLowerCase();
        }
      }
    } catch {
      // Fall through to memory map
    }
  }

  const mem = getMemoryTokenMap().get(tokenHash);
  if (!mem || mem.consumedAt || mem.expiresAtMs <= Date.now()) {
    return null;
  }
  mem.consumedAt = nowIso;
  return mem.email.trim().toLowerCase();
}

export async function POST(request: NextRequest) {
  const originReject = rejectDisallowedOrigin(request);
  if (originReject) return originReject;

  const ip = resolveClientIp(request.headers);
  const rate = rateLimit(`reset-password:${ip}`, {
    limit: 10,
    windowMs: 15 * 60 * 1000,
  });
  if (!rate.allowed) {
    return apiError(
      'Terlalu banyak permintaan reset sandi. Coba lagi dalam beberapa menit.',
      429,
      { code: 'RATE_LIMITED' }
    );
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      email?: string;
      token?: string;
      newPassword?: string;
      turnstileToken?: string;
    };

    const action = String(body.action || 'REQUEST').toUpperCase();

    if (action === 'REQUEST') {
      const turnstile = await verifyTurnstileToken(body.turnstileToken, {
        expectedAction: 'reset-password',
        remoteIp: ip,
      });
      if (!turnstile.success) {
        return apiError(turnstile.reason || 'Verifikasi keamanan gagal.', 400, {
          code: 'TURNSTILE_FAILED',
        });
      }

      const email = String(body.email || '').trim().toLowerCase();
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return apiError('Format alamat email tidak valid.', 400, {
          code: 'INVALID_EMAIL',
        });
      }

      await serverStore.reconcileWithSupabase();
      const matched = serverStore
        .getAdminUsers()
        .find((u) => (u.email || '').trim().toLowerCase() === email);

      // Always respond with a neutral success message to prevent email enumeration.
      if (matched) {
        const rawToken = crypto.randomBytes(32).toString('base64url');
        await storeResetToken(email, rawToken);
        const resetUrl = `${SITE_URL.replace(/\/+$/, '')}/reset-password?token=${encodeURIComponent(
          rawToken
        )}`;
        const mail = buildPasswordResetEmail({ email, resetUrl });
        await sendEmail({
          to: email,
          subject: mail.subject,
          html: mail.html,
          text: mail.text,
        });
      }

      return NextResponse.json({
        success: true,
        message:
          'Jika email terdaftar di MEPlanner, tautan atur ulang kata sandi telah dikirim ke kotak masuk Anda (berlaku 30 menit).',
      });
    }

    if (action === 'CONFIRM') {
      const token = String(body.token || '').trim();
      const newPassword = String(body.newPassword || '').trim();

      if (!token) {
        return apiError('Token reset kata sandi tidak ditemukan.', 400, {
          code: 'MISSING_TOKEN',
        });
      }
      if (newPassword.length < 8) {
        return apiError('Kata sandi baru minimal 8 karakter.', 400, {
          code: 'WEAK_PASSWORD',
        });
      }

      const verifiedEmail = await consumeResetToken(token);
      if (!verifiedEmail) {
        return apiError(
          'Tautan reset kata sandi tidak valid atau sudah kedaluwarsa.',
          400,
          { code: 'INVALID_OR_EXPIRED_TOKEN' }
        );
      }

      await serverStore.reconcileWithSupabase();
      const targetUser = serverStore
        .getAdminUsers()
        .find((u) => (u.email || '').trim().toLowerCase() === verifiedEmail);

      if (!targetUser) {
        return apiError('Akun tidak ditemukan.', 404, { code: 'USER_NOT_FOUND' });
      }

      const nextHash = hashPassword(newPassword);
      serverStore.updateAdminUser(targetUser.id, {
        passwordHash: nextHash,
        password: '',
      });

      const nextState = serverStore.getFullState();
      await saveStateToSupabase(nextState).catch(() => null);

      return NextResponse.json({
        success: true,
        message:
          'Kata sandi berhasil diperbarui. Silakan masuk kembali menggunakan kata sandi baru Anda.',
      });
    }

    return apiError('Aksi tidak dikenali.', 400, { code: 'INVALID_ACTION' });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : 'Gagal memproses reset kata sandi.',
      500
    );
  }
}
