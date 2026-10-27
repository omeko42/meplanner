import { NextRequest, NextResponse } from 'next/server';
import {
  authenticateAdminCredentials,
  checkRateLimit,
  clearFailedAttempts,
  createSessionToken,
  hashPassword,
  isPrivilegedDefaultOrSuperUser,
  recordFailedAttempt,
  SESSION_COOKIE_NAME,
  verifyAdminRequest,
  verifySuperadminIdentity,
  verifySuperadminPassword,
} from '@/lib/auth';
import { serverStore } from '@/lib/serverStore';
import { saveStateToSupabase } from '@/lib/supabaseCloud';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = verifyAdminRequest(request);
  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 200 }
    );
  }
  return NextResponse.json({
    authenticated: true,
    user,
  });
}

export async function POST(request: NextRequest) {
  try {
    await serverStore.reconcileWithSupabase();
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
          error: 'Username dan Kata Sandi wajib diisi.',
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
          error: 'Username atau Kata Sandi tidak valid.',
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
  await serverStore.reconcileWithSupabase();
  const sessionUser = verifyAdminRequest(request);
  if (!sessionUser) {
    return NextResponse.json(
      { success: false, error: 'Sesi tidak valid. Silakan login kembali.' },
      { status: 401 }
    );
  }

  if (!isPrivilegedDefaultOrSuperUser(sessionUser)) {
    return NextResponse.json(
      {
        success: false,
        error: 'Akses ditolak. Akun Panitia tidak memiliki izin untuk mengubah akun atau manajemen user.',
      },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const action = String(body.action || 'UPDATE_DEFAULT_USER').toUpperCase();

    // 1. Tambah / Edit Akun Panitia oleh User Default (Tanpa perlu konfirmasi superadmin)
    if (action === 'UPSERT_PANITIA') {
      const id = body.id ? String(body.id).trim() : undefined;
      const username = String(body.username || '').trim().toLowerCase();
      const nama = String(body.nama || '').trim();
      const jabatan = String(body.jabatan || 'Panitia / WO').trim();
      const clientId = String(body.clientId || 'client-utama').trim();
      const clientName = String(body.clientName || 'Client Utama • Eko & Selo').trim();
      const newPassword = String(body.password || '').trim();

      if (!username || !nama) {
        return NextResponse.json(
          { success: false, error: 'Username dan Nama Panitia wajib diisi.' },
          { status: 400 }
        );
      }

      if (!id && (!newPassword || newPassword.length < 6)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Password untuk akun Panitia baru minimal 6 karakter.',
          },
          { status: 400 }
        );
      }

      const dbAdmins = serverStore.getAdminUsers();
      const collidingDefault = dbAdmins.find(
        (u) => u.isDefaultUser && u.username.toLowerCase() === username
      );
      if (collidingDefault) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username tersebut sudah digunakan oleh akun utama sistem.',
          },
          { status: 400 }
        );
      }

      const panitiaUser = serverStore.upsertPanitiaUser({
        id,
        username,
        nama,
        jabatan,
        clientId,
        clientName,
        ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      });

      const fullState = serverStore.getFullState(false);
      await saveStateToSupabase(fullState);

      return NextResponse.json({
        success: true,
        message: id
          ? `Akun Panitia "${panitiaUser.username}" berhasil diperbarui.`
          : `Akun Panitia "${panitiaUser.username}" berhasil ditambahkan.`,
        panitiaUser: {
          id: panitiaUser.id,
          username: panitiaUser.username,
          nama: panitiaUser.nama,
          role: panitiaUser.role,
          jabatan: panitiaUser.jabatan,
          clientId: panitiaUser.clientId,
          clientName: panitiaUser.clientName,
          isDefaultUser: false,
        },
        data: fullState,
      });
    }

    // 2. Hapus / Kurangi Akun Panitia oleh User Default
    if (action === 'DELETE_PANITIA') {
      const targetId = String(body.id || '').trim();
      if (!targetId) {
        return NextResponse.json(
          { success: false, error: 'ID akun Panitia wajib disertakan.' },
          { status: 400 }
        );
      }
      const deleted = serverStore.deletePanitiaUser(targetId);
      if (!deleted) {
        return NextResponse.json(
          {
            success: false,
            error: 'Akun tidak ditemukan atau merupakan akun default yang tidak dapat dihapus.',
          },
          { status: 400 }
        );
      }
      const fullState = serverStore.getFullState(false);
      await saveStateToSupabase(fullState);
      return NextResponse.json({
        success: true,
        message: 'Akun Panitia berhasil dihapus.',
        data: fullState,
      });
    }

    // 2A-SUPER. Tambah / Edit Akun Co-Superadmin / Partner Developer (Hanya oleh SUPERADMIN)
    if (action === 'UPSERT_SUPERADMIN') {
      if (sessionUser.role !== 'SUPERADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Hanya Superadmin yang dapat menambahkan atau mengubah akun Co-Superadmin / Developer.',
          },
          { status: 403 }
        );
      }

      const id = body.id ? String(body.id).trim() : undefined;
      const username = String(body.username || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_');
      const email = String(body.email || '').trim().toLowerCase();
      const nama = String(body.nama || '').trim();
      const jabatan = String(body.jabatan || 'Co-Developer & Superadmin').trim();
      const newPassword = String(body.password || '').trim();

      if (!username || !nama) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username dan Nama Lengkap Developer wajib diisi.',
          },
          { status: 400 }
        );
      }

      if (!id && (!newPassword || newPassword.length < 6)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Kata sandi untuk akun Co-Superadmin / Developer baru minimal 6 karakter.',
          },
          { status: 400 }
        );
      }

      const dbAdmins = serverStore.getAdminUsers();
      const collidingOther = dbAdmins.find(
        (u) =>
          u.id !== id &&
          (u.username.toLowerCase() === username ||
            (email && u.email && u.email.toLowerCase() === email))
      );
      if (collidingOther && collidingOther.role !== 'SUPERADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Username atau Email tersebut sudah dipakai oleh akun klien/panitia lain.',
          },
          { status: 400 }
        );
      }

      const superUser = serverStore.upsertSuperadminUser({
        id,
        username,
        email: email || `${username}@meplanner.id`,
        nama,
        jabatan,
        ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      });

      const fullState = serverStore.getFullState(false);
      await saveStateToSupabase(fullState);

      return NextResponse.json({
        success: true,
        message: id
          ? `Akun Co-Superadmin "${superUser.nama}" (@${superUser.username}) berhasil diperbarui.`
          : `Akun Co-Superadmin "${superUser.nama}" (@${superUser.username}) berhasil ditambahkan!`,
        superadminUser: superUser,
        data: fullState,
      });
    }

    // 2B-SUPER. Hapus Akun Co-Superadmin / Partner Developer (Hanya oleh SUPERADMIN)
    if (action === 'DELETE_SUPERADMIN') {
      if (sessionUser.role !== 'SUPERADMIN') {
        return NextResponse.json(
          {
            success: false,
            error: 'Hanya Superadmin yang dapat menghapus akun Co-Superadmin.',
          },
          { status: 403 }
        );
      }
      const targetId = String(body.id || '').trim();
      if (!targetId) {
        return NextResponse.json(
          { success: false, error: 'ID akun Co-Superadmin wajib disertakan.' },
          { status: 400 }
        );
      }
      const deleted = serverStore.deleteSuperadminUser(targetId);
      if (!deleted) {
        return NextResponse.json(
          {
            success: false,
            error: 'Akun tidak ditemukan atau merupakan akun Owner Utama yang dilindungi.',
          },
          { status: 400 }
        );
      }
      const fullState = serverStore.getFullState(false);
      await saveStateToSupabase(fullState);
      return NextResponse.json({
        success: true,
        message: 'Akun Co-Superadmin berhasil dihapus.',
        data: fullState,
      });
    }

    // 2B. Buat Grup Client Baru + 4 User Default Khusus Client (Superadmin / Komersialisasi)
    if (action === 'CREATE_CLIENT_GROUP_USERS') {
      const clientCode = String(body.clientCode || '')
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9_-]/g, '');
      const coupleLabel = String(body.coupleLabel || '').trim();
      const clientName =
        String(body.clientName || '').trim() ||
        `Client ${clientCode} • ${coupleLabel}`;
      const packageTier = (
        ['STARTER', 'EXCLUSIVE', 'ROYAL_VIP'].includes(String(body.packageTier))
          ? body.packageTier
          : 'EXCLUSIVE'
      ) as 'STARTER' | 'EXCLUSIVE' | 'ROYAL_VIP';
      const eventDate = String(body.eventDate || '2026-12-19').trim();
      const notes = String(body.notes || '').trim();
      const initialPassword = String(body.initialPassword || '').trim();

      if (!clientCode || !coupleLabel) {
        return NextResponse.json(
          {
            success: false,
            error: 'Kode Client dan Nama Pasangan Client wajib diisi.',
          },
          { status: 400 }
        );
      }

      if (!initialPassword || initialPassword.length < 6) {
        return NextResponse.json(
          {
            success: false,
            error: 'Password awal untuk 4 User Default Client minimal 6 karakter.',
          },
          { status: 400 }
        );
      }

      const clientId = `client-${clientCode.toLowerCase()}`;
      const createdUsers = serverStore.createClientDefaultUsersGroup({
        clientId,
        clientCode,
        clientName,
        coupleLabel,
        packageTier,
        eventDate,
        notes,
        passwordHash: hashPassword(initialPassword),
      });

      const fullState = serverStore.getFullState(false);
      await saveStateToSupabase(fullState);

      return NextResponse.json({
        success: true,
        message: `Grup "${clientName}" beserta ${createdUsers.length} User Default berhasil dibuat!`,
        createdUsers,
        data: fullState,
      });
    }

    // 2C. Hapus Grup Client Sekunder & Seluruh User-nya (Hard Delete)
    if (action === 'DELETE_CLIENT_GROUP') {
      const clientId = String(body.clientId || '').trim();
      if (!clientId || clientId === 'client-utama') {
        return NextResponse.json(
          {
            success: false,
            error: 'Grup Client Utama sistem tidak dapat dihapus.',
          },
          { status: 400 }
        );
      }
      const ok = serverStore.deleteClientGroupAndUsers(clientId);
      if (!ok) {
        return NextResponse.json(
          { success: false, error: 'Gagal menghapus grup client.' },
          { status: 400 }
        );
      }
      const fullState = serverStore.getFullState(false);
      await saveStateToSupabase(fullState);
      return NextResponse.json({
        success: true,
        message: 'Grup Client beserta seluruh akun di dalamnya berhasil dihapus bersih.',
        data: fullState,
      });
    }

    // 3. Ubah Username / Password Akun Default (WAJIB Konfirmasi Email & Password Superadmin kecuali sudah login sebagai SUPERADMIN)
    const superadminConfirmation = String(body.superadminConfirmation || '').trim();
    const superadminPassword = String(body.superadminPassword || '').trim();
    const isAlreadySuperadminSession = sessionUser.role === 'SUPERADMIN';
    if (
      !isAlreadySuperadminSession &&
      (!verifySuperadminIdentity(superadminConfirmation) ||
        !verifySuperadminPassword(superadminPassword))
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Email atau Password Superadmin (Pemilik Aplikasi) tidak valid. Perubahan username/password akun utama wajib diotorisasi oleh Superadmin.',
        },
        { status: 403 }
      );
    }

    const targetUserId = String(body.targetUserId || sessionUser.id).trim();
    const dbAdmins = serverStore.getAdminUsers();
    const targetAdmin =
      dbAdmins.find(
        (u) =>
          u.id === targetUserId ||
          u.username.toLowerCase() === targetUserId.toLowerCase()
      ) ||
      dbAdmins.find(
        (u) =>
          u.id === sessionUser.id ||
          u.username.toLowerCase() === sessionUser.username.toLowerCase()
      );

    if (!targetAdmin) {
      return NextResponse.json(
        { success: false, error: 'Akun target tidak ditemukan.' },
        { status: 404 }
      );
    }

    const newUsername = String(body.newUsername || targetAdmin.username)
      .trim()
      .toLowerCase();
    const newName = String(body.newName || targetAdmin.nama).trim();
    const newPassword = String(body.newPassword || '').trim();

    if (!newUsername) {
      return NextResponse.json(
        { success: false, error: 'Username tidak boleh kosong.' },
        { status: 400 }
      );
    }

    const duplicateOther = dbAdmins.find(
      (u) => u.id !== targetAdmin.id && u.username.toLowerCase() === newUsername
    );
    if (duplicateOther) {
      return NextResponse.json(
        { success: false, error: 'Username sudah dipakai oleh akun lain.' },
        { status: 400 }
      );
    }

    if (newPassword && newPassword.length < 6) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kata sandi baru minimal harus 6 karakter.',
        },
        { status: 400 }
      );
    }

    const updatedAdmin = serverStore.updateAdminUser(targetAdmin.id, {
      nama: newName,
      username: newUsername,
      ...(body.clientId ? { clientId: String(body.clientId).trim() } : {}),
      ...(body.clientName ? { clientName: String(body.clientName).trim() } : {}),
      ...(newPassword
        ? {
            passwordHash: hashPassword(newPassword),
            password: '',
          }
        : {}),
    });

    const fullState = serverStore.getFullState(false);
    await saveStateToSupabase(fullState);

    const isSelfUpdate =
      targetAdmin.id === sessionUser.id ||
      targetAdmin.username.toLowerCase() === sessionUser.username.toLowerCase();

    const responseUser = isSelfUpdate
      ? {
          id: updatedAdmin.id,
          username: updatedAdmin.username,
          nama: updatedAdmin.nama,
          role: updatedAdmin.role,
          jabatan: updatedAdmin.jabatan,
          email: updatedAdmin.email,
          isDefaultUser: updatedAdmin.isDefaultUser,
          clientId: updatedAdmin.clientId,
          clientName: updatedAdmin.clientName,
        }
      : sessionUser;

    const response = NextResponse.json({
      success: true,
      message: `Kredensial akun "${updatedAdmin.username}" berhasil diperbarui dengan verifikasi Superadmin.`,
      user: responseUser,
      data: fullState,
    });

    if (isSelfUpdate) {
      const refreshedToken = createSessionToken(updatedAdmin);
      response.cookies.set(SESSION_COOKIE_NAME, refreshedToken, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      });
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Gagal memperbarui kredensial akun.',
        detail: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
