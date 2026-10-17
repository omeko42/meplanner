import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateAdminCredentials,
  checkRateLimit,
  clearFailedAttempts,
  createSessionToken,
  hashPassword,
  recordFailedAttempt,
  SESSION_COOKIE_NAME,
  verifyAdminRequest,
  verifyPasswordTimingSafe,
} from '@/lib/auth';
import { serverStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = verifyAdminRequest(request);
  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
  }
  return NextResponse.json({
    authenticated: true,
    user,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const action = String(body.action || 'LOGIN').toUpperCase();

    if (action === 'LOGOUT') {
      const response = NextResponse.json({
        success: true,
        message: 'Berhasil keluar dari sesi Admin.',
      });
      response.cookies.set(SESSION_COOKIE_NAME, '', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 0,
      });
      return response;
    }

    const identifier = String(body.identifier || '').trim();
    const password = String(body.password || '');
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      'local-client';
    const rateKey = `${ip}:${identifier.toLowerCase()}`;

    const rateStatus = checkRateLimit(rateKey);
    if (!rateStatus.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: `Terlalu banyak percobaan login gagal. Silakan coba lagi dalam ${rateStatus.retryAfterSeconds} detik.`,
        },
        { status: 429 }
      );
    }

    if (!identifier || !password) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email/Username dan Kata Sandi wajib diisi.',
        },
        { status: 400 }
      );
    }

    const authenticatedUser = authenticateAdminCredentials(identifier, password);
    if (!authenticatedUser) {
      recordFailedAttempt(rateKey);
      return NextResponse.json(
        {
          success: false,
          error: 'Email/Username atau Kata Sandi tidak valid.',
        },
        { status: 401 }
      );
    }

    clearFailedAttempts(rateKey);
    const token = createSessionToken(authenticatedUser);

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
    });

    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Terjadi kesalahan pada server otentikasi.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const sessionUser = verifyAdminRequest(request);
  if (!sessionUser) {
    return NextResponse.json(
      { success: false, error: 'Sesi tidak valid. Silakan login kembali.' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const currentPassword = String(body.currentPassword || '');
    const newPassword = String(body.newPassword || '').trim();
    const newEmail = String(body.newEmail || sessionUser.email).trim();
    const newName = String(body.newName || sessionUser.nama).trim();
    const newUsername = String(body.newUsername || sessionUser.username).trim();

    const dbAdmins = serverStore.getAdminUsers();
    const targetAdmin =
      dbAdmins.find(
        (u) =>
          u.id === sessionUser.id ||
          u.username.toLowerCase() === sessionUser.username.toLowerCase()
      ) || dbAdmins[0];

    if (
      targetAdmin &&
      !verifyPasswordTimingSafe(
        currentPassword,
        targetAdmin.password,
        targetAdmin.passwordHash
      )
    ) {
      return NextResponse.json(
        { success: false, error: 'Kata sandi saat ini tidak sesuai.' },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 8) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kata sandi baru minimal harus 8 karakter.',
        },
        { status: 400 }
      );
    }

    const updatedAdmin = serverStore.updateAdminUser(targetAdmin?.id || 'adm-1', {
      nama: newName,
      email: newEmail,
      username: newUsername,
      ...(newPassword
        ? {
            passwordHash: hashPassword(newPassword),
            password: '', // Remove plaintext password once hashed
          }
        : {}),
    });

    const refreshedToken = createSessionToken(updatedAdmin);
    const response = NextResponse.json({
      success: true,
      message: 'Kredensial & profil keamanan Admin berhasil diperbarui.',
      user: {
        id: updatedAdmin.id,
        username: updatedAdmin.username,
        nama: updatedAdmin.nama,
        role: updatedAdmin.role,
        jabatan: updatedAdmin.jabatan,
        email: updatedAdmin.email,
      },
    });

    response.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memperbarui kredensial Admin.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
