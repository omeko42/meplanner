import { NextRequest, NextResponse } from 'next/server';
import { consumePendingRegistration, serverStore } from '@/lib/serverStore';
import { createSessionToken } from '@/lib/auth';
import { setSessionCookie } from '@/lib/authSession';
import { apiError } from '@/lib/apiGuard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/verify?token=...&email=...
 *
 * Completes a self-service registration. The emailed token is single-use and
 * short-lived; on success the account is activated and a session cookie is
 * issued. Without a valid token nothing is created.
 */
export async function GET(req: NextRequest) {
  try {
    const token = (req.nextUrl.searchParams.get('token') || '').trim();
    const email = (req.nextUrl.searchParams.get('email') || '').trim();

    if (!token || !email) {
      return apiError('Token atau email tidak valid.', 400, {
        code: 'INVALID_REQUEST',
      });
    }

    const registration = consumePendingRegistration(email, token);
    if (!registration) {
      return apiError(
        'Tautan verifikasi tidak valid atau sudah kedaluwarsa.',
        400,
        { code: 'INVALID_TOKEN' }
      );
    }

    // Activate the account: the user record now exists server-side.
    const store = serverStore.getFullState(false);
    const alreadyExists = store.adminUsers.some(
      (u) =>
        (u.email && u.email.trim().toLowerCase() === registration.email) ||
        u.username.trim().toLowerCase() === registration.username
    );

    if (!alreadyExists) {
      serverStore.updateAdminUser(registration.userId, {
        id: registration.userId,
        username: registration.username,
        nama: registration.nama,
        role: registration.role,
        jabatan: registration.jabatan,
        email: registration.email,
        isDefaultUser: true,
        clientId: registration.clientId,
        clientName: registration.clientName,
      });
    }

    const sessionUser = {
      id: registration.userId,
      username: registration.username,
      nama: registration.nama,
      role: registration.role,
      jabatan: registration.jabatan,
      email: registration.email,
      isDefaultUser: true,
      clientId: registration.clientId,
      clientName: registration.clientName,
    };

    const response = NextResponse.json({
      success: true,
      user: sessionUser,
    });
    setSessionCookie(response, createSessionToken(sessionUser));
    return response;
  } catch (error) {
    return apiError(
      error instanceof Error ? error.message : 'Verifikasi gagal.',
      500
    );
  }
}
