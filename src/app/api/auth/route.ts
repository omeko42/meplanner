import { NextRequest, NextResponse } from 'next/server';
import { randomBytes } from 'node:crypto';
import {
  authenticateAdminCredentials,
  checkRateLimit,
  clearFailedAttempts,
  createSessionToken,
  hashPassword,
  isPrivilegedDefaultOrSuperUser,
  recordFailedAttempt,
  type SessionUser,
  verifyAdminRequest,
  verifySuperadminIdentity,
  verifySuperadminPassword,
} from '@/lib/auth';
import { serverStore, setPendingRegistration } from '@/lib/serverStore';
import { apiError, rateLimitByIp } from '@/lib/apiGuard';
import type { AdminUser, EventCategoryType } from '@/types';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { buildVerificationEmail, sendEmail } from '@/lib/email';
import { SITE_URL, resolveClientIp } from '@/lib/env';
import {
  clearSessionCookie,
  readSessionToken,
  setSessionCookie,
} from '@/lib/authSession';
import {
  ensureDefaultTenant,
  findWorkspaceSlugForUser,
} from '@/lib/tenantResolver';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const user = verifyAdminRequest(request);
  if (!user) {
    const response = NextResponse.json(
      { authenticated: false, user: null },
      { status: 401 }
    );
    if (readSessionToken(request)) {
      clearSessionCookie(response);
    }
    return response;
  }
  const renewedToken = createSessionToken(user);
  const response = NextResponse.json({
    authenticated: true,
    user,
  });
  setSessionCookie(response, renewedToken);
  return response;
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
      clearSessionCookie(response);
      return response;
    }

    if (action === 'GOOGLE_OAUTH_LOGIN' && body.accessToken) {
      const accessToken = String(body.accessToken).trim();
      let verifiedEmail = '';
      let verifiedGoogleName = '';
      let verifiedPicture = '';

      try {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData?.email && gData?.email_verified !== false) {
            verifiedEmail = String(gData.email).trim().toLowerCase();
            verifiedGoogleName = String(gData.name || gData.given_name || '').trim();
            verifiedPicture = String(gData.picture || '').trim();
          }
        }
      } catch {
        // Ignore and check fallback
      }

      if (!verifiedEmail) {
        return NextResponse.json(
          { success: false, error: 'Token Google OAuth tidak valid atau telah kedaluwarsa.' },
          { status: 401 }
        );
      }

      const classifyAccountKind = (
        u: Pick<AdminUser, 'role' | 'jabatan'>
      ): 'SUPERADMIN' | 'PLANNER' | 'CLIENT' => {
        if (u.role === 'SUPERADMIN') return 'SUPERADMIN';
        const jab = (u.jabatan || '').toLowerCase();
        if (
          u.role === 'PANITIA' ||
          jab.includes('planner') ||
          jab.includes('panitia') ||
          jab.includes('wo')
        ) {
          return 'PLANNER';
        }
        return 'CLIENT';
      };

      const dbAdmins = serverStore.getAdminUsers();
      const matchedAdmins = dbAdmins.filter(
        (u) =>
          (u.email && u.email.trim().toLowerCase() === verifiedEmail) ||
          u.username.trim().toLowerCase() === verifiedEmail
      );

      const isOwnerSuperadmin = verifySuperadminIdentity(verifiedEmail);
      const requestedClientId = String(body.clientId || 'client-utama').trim();
      const requestedClientName = String(
        body.clientName ||
          (requestedClientId === 'client-demo'
            ? 'Klien Demo • Rayhan & Clarissa'
            : 'Klien Utama • Agung & Selo')
      ).trim();

      // Build unified list of authorized accounts for this verified Google email
      const candidateAccounts: AdminUser[] = [];
      if (isOwnerSuperadmin) {
        candidateAccounts.push({
          id: 'superadmin-owner',
          username: 'superadmin',
          nama: 'Eko Agung Krisdianto',
          role: 'SUPERADMIN',
          jabatan: 'Superadmin • Semua Ruang Kerja',
          email: verifiedEmail,
          isDefaultUser: true,
          clientId: requestedClientId,
          clientName: requestedClientName,
        });
      }
      for (const acc of matchedAdmins) {
        if (acc.id === 'superadmin-owner') continue;
        if (!candidateAccounts.some((c) => c.id === acc.id)) {
          candidateAccounts.push(acc);
        }
      }

      const selectedAccountId = String(body.selectedAccountId || '').trim();
      let chosenAccount: AdminUser | undefined;

      if (candidateAccounts.length > 1) {
        if (!selectedAccountId) {
          return NextResponse.json(
            {
              success: false,
              code: 'ROLE_SELECTION_REQUIRED',
              googleProfile: {
                email: verifiedEmail,
                name: verifiedGoogleName || verifiedEmail.split('@')[0],
                picture: verifiedPicture,
              },
              accounts: candidateAccounts.map((u) => ({
                id: u.id,
                username: u.username,
                nama: u.nama,
                role: u.role,
                jabatan: u.jabatan,
                clientId: u.clientId || 'client-utama',
                clientName: u.clientName || 'Klien Utama • Agung & Selo',
                accountKind: classifyAccountKind(u),
              })),
            },
            { status: 200 }
          );
        }
        chosenAccount = candidateAccounts.find((c) => c.id === selectedAccountId);
        if (!chosenAccount) {
          return NextResponse.json(
            {
              success: false,
              error: 'Akun pilihan tidak cocok dengan email Google yang terverifikasi.',
              code: 'ACCOUNT_MISMATCH',
            },
            { status: 403 }
          );
        }
      } else if (candidateAccounts.length === 1) {
        chosenAccount = candidateAccounts[0];
      }

      // An unknown Google account only receives a strictly isolated FREE
      // workspace when explicitly signing up (`allowAutoRegister: true`) after
      // Google has server-side verified the email address. Never escalates to
      // SUPERADMIN or grants access to `client-utama`.
      if (!chosenAccount) {
        if (!body.allowAutoRegister) {
          return NextResponse.json(
            {
              success: false,
              error:
                'Email Google ini belum tertaut ke ruang kerja mana pun. Pilih Tautkan Akun Klien atau Buat Ruang Kerja Baru.',
              code: 'ACCOUNT_NOT_REGISTERED',
              googleProfile: {
                email: verifiedEmail,
                name: verifiedGoogleName || verifiedEmail.split('@')[0],
                picture: verifiedPicture,
              },
            },
            { status: 403 }
          );
        }

        const slug = verifiedEmail.replace(/[^a-z0-9]/g, '').slice(0, 14) || 'planner';
        const newClientId = `client-gmail-${slug}`;
        const displayName =
          String(body.displayName || '').trim() ||
          verifiedGoogleName ||
          verifiedEmail.split('@')[0];
        const rawEventType = String(body.eventType || 'WEDDING').trim().toUpperCase();
        const eventType: EventCategoryType = (
          ['WEDDING', 'BIRTHDAY', 'GRADUATION', 'MEETING', 'GALA_DINNER'].includes(
            rawEventType
          )
            ? rawEventType
            : 'WEDDING'
        ) as EventCategoryType;
        const accountMode: 'CLIENT' | 'PLANNER' =
          String(body.accountMode || '').trim().toUpperCase() === 'PLANNER'
            ? 'PLANNER'
            : 'CLIENT';

        const clientDisplayLabel =
          accountMode === 'PLANNER'
            ? `Planner / WO • ${displayName}`
            : `Klien • ${displayName}`;

        chosenAccount = serverStore.updateAdminUser(`usr-gmail-${slug}`, {
          id: `usr-gmail-${slug}`,
          username: verifiedEmail,
          nama: displayName,
          role: 'MEMPELAI_PRIA',
          jabatan:
            accountMode === 'PLANNER'
              ? `Event Planner / WO • Paket GRATIS (${eventType})`
              : `Pemilik Acara (Klien) • Paket GRATIS (${eventType})`,
          email: verifiedEmail,
          isDefaultUser: true,
          clientId: newClientId,
          clientName: clientDisplayLabel,
        });

        serverStore.ensureCleanClientWorkspace({
          clientId: newClientId,
          clientCode: slug.toUpperCase(),
          clientName: clientDisplayLabel,
          coupleLabel: displayName,
          ownerEmail: verifiedEmail,
          eventType,
          accountMode,
        });

        await serverStore.persistStateToSupabaseDirect();
      }

      const resolvedClientId = chosenAccount.clientId || 'client-utama';
      const resolvedClientName =
        chosenAccount.clientName || 'Klien Utama • Agung & Selo';
      const resolvedTenantId = await ensureDefaultTenant(
        resolvedClientId,
        resolvedClientName
      );

      const sessionUser: SessionUser = {
        id: chosenAccount.id,
        username: chosenAccount.username,
        nama: chosenAccount.nama,
        role: chosenAccount.role,
        jabatan: chosenAccount.jabatan,
        email: chosenAccount.email || verifiedEmail,
        isDefaultUser: Boolean(chosenAccount.isDefaultUser),
        clientId: resolvedClientId,
        clientName: resolvedClientName,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      };

      const token = createSessionToken(sessionUser);
      const response = NextResponse.json({
        success: true,
        user: sessionUser,
      });
      setSessionCookie(response, token);
      return response;
    }

    if (action === 'LINK_GOOGLE_ACCOUNT' && body.accessToken) {
      const accessToken = String(body.accessToken).trim();
      const identifier = String(
        body.identifier || body.username || ''
      ).trim();
      const password = String(body.password || '');
      const ip =
        request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
        'local-client';
      const rateKey = `link:${ip}:${identifier.toLowerCase()}`;

      const rateStatus = checkRateLimit(rateKey);
      if (!rateStatus.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Terlalu banyak percobaan tautkan akun gagal. Coba lagi dalam ${rateStatus.retryAfterSeconds} detik.`,
          },
          { status: 429 }
        );
      }

      if (!identifier || !password) {
        return NextResponse.json(
          {
            success: false,
            error: 'Username dan kata sandi akun klien wajib diisi untuk menautkan Google.',
          },
          { status: 400 }
        );
      }

      let verifiedEmail = '';
      try {
        const gRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
          cache: 'no-store',
        });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (gData?.email && gData?.email_verified !== false) {
            verifiedEmail = String(gData.email).trim().toLowerCase();
          }
        }
      } catch {
        // Ignore
      }

      if (!verifiedEmail) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sesi Google telah kedaluwarsa. Silakan klik Masuk dengan Google ulang.',
          },
          { status: 401 }
        );
      }

      const authenticatedUser = authenticateAdminCredentials(identifier, password);
      if (!authenticatedUser) {
        recordFailedAttempt(rateKey);
        return NextResponse.json(
          {
            success: false,
            error: 'Username atau kata sandi akun tidak sesuai.',
          },
          { status: 401 }
        );
      }

      if (
        authenticatedUser.id === 'superadmin-owner' ||
        authenticatedUser.role === 'SUPERADMIN'
      ) {
        return NextResponse.json(
          {
            success: false,
            error: 'Akun Superadmin dilindungi dan tidak dapat ditautkan melalui alur ini.',
          },
          { status: 403 }
        );
      }

      clearFailedAttempts(rateKey);

      const updatedAdmin = serverStore.updateAdminUser(authenticatedUser.id, {
        email: verifiedEmail,
      });
      if (updatedAdmin.passwordHash) {
        await serverStore.persistUserCredentialToVault(updatedAdmin);
      }
      await serverStore.persistStateToSupabaseDirect();

      const resolvedClientId = updatedAdmin.clientId || 'client-utama';
      const resolvedClientName =
        updatedAdmin.clientName || 'Klien Utama • Agung & Selo';
      const resolvedTenantId = await ensureDefaultTenant(
        resolvedClientId,
        resolvedClientName
      );

      const sessionUser: SessionUser = {
        id: updatedAdmin.id,
        username: updatedAdmin.username,
        nama: updatedAdmin.nama,
        role: updatedAdmin.role,
        jabatan: updatedAdmin.jabatan,
        email: verifiedEmail,
        isDefaultUser: Boolean(updatedAdmin.isDefaultUser),
        clientId: resolvedClientId,
        clientName: resolvedClientName,
        ...(resolvedTenantId ? { tenantId: resolvedTenantId } : {}),
      };

      const token = createSessionToken(sessionUser);
      const response = NextResponse.json({
        success: true,
        user: sessionUser,
        linkedEmail: verifiedEmail,
        message: `Akun Google ${verifiedEmail} berhasil ditautkan ke @${updatedAdmin.username}!`,
      });
      setSessionCookie(response, token);
      return response;
    }

    if (action === 'SYNC_SESSION' && body.user && typeof body.user === 'object') {
      const existingSession = verifyAdminRequest(request);
      if (!existingSession) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sesi JWT tidak valid atau telah kedaluwarsa. Silakan login kembali.',
          },
          { status: 401 }
        );
      }

      const u = body.user;
      const requestedClientId = String(u.clientId || existingSession.clientId || 'client-utama').trim();
      const requestedClientName = String(u.clientName || existingSession.clientName || '').trim();

      const updatedSessionUser =
        existingSession.role === 'SUPERADMIN'
          ? {
              ...existingSession,
              clientId: requestedClientId,
              clientName: requestedClientName || existingSession.clientName,
            }
          : existingSession;

      const token = createSessionToken(updatedSessionUser);
      const response = NextResponse.json({
        success: true,
        user: updatedSessionUser,
      });
      setSessionCookie(response, token);
      return response;
    }

    if (action === 'REGISTER_WORKSPACE' && body.email) {
      const email = String(body.email).trim().toLowerCase();
      const displayName = String(body.displayName || '').trim();
      const eventType = String(body.eventType || 'WEDDING').trim();
      const packageId = String(body.packageId || 'GRATIS').trim();
      const catalogThemeId = String(body.catalogThemeId || '').trim();

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return apiError('Alamat email tidak valid.', 400, {
          code: 'INVALID_EMAIL',
        });
      }

      if (verifySuperadminIdentity(email)) {
        return apiError('Gunakan alur login untuk akun admin.', 403, {
          code: 'RESERVED_EMAIL',
        });
      }

      // Anti-abuse: captcha + per-IP rate limit before anything is created.
      const captcha = await verifyTurnstileToken(body.turnstileToken, {
        expectedAction: 'register',
        remoteIp: resolveClientIp(request.headers),
      });
      if (!captcha.success) {
        return apiError(
          captcha.skipped
            ? 'Verifikasi keamanan sedang tidak tersedia. Coba lagi nanti.'
            : 'Verifikasi keamanan gagal. Silakan coba lagi.',
          403,
          { code: 'CAPTCHA_FAILED' }
        );
      }

      const limit = rateLimitByIp(request, 'auth:register', {
        limit: 5,
        windowMs: 60 * 60 * 1000,
      });
      if (!limit.allowed) {
        return apiError(
          `Terlalu banyak percobaan pendaftaran. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
          429,
          {
            code: 'RATE_LIMITED',
            headers: { 'Retry-After': String(limit.retryAfterSeconds) },
          }
        );
      }

      const existingAdmins = serverStore.getAdminUsers();
      const alreadyRegistered = existingAdmins.some(
        (u) =>
          (u.email && u.email.trim().toLowerCase() === email) ||
          u.username.trim().toLowerCase() === email
      );
      if (alreadyRegistered) {
        // Do not leak whether the account exists beyond a generic message.
        return apiError(
          'Jika email ini terdaftar, gunakan tautan verifikasi atau hubungi admin.',
          409,
          { code: 'ACCOUNT_EXISTS' }
        );
      }

      // A session is NOT issued here. The user receives a verification link by
      // email and can only sign in once the address is confirmed.
      const slug = email.replace(/[^a-z0-9]/g, '').slice(0, 14) || 'planner';
      const clientId = `client-gmail-${slug}`;

      const verifyToken = randomBytes(32).toString('hex');
      const verifyUrl = `${SITE_URL}/auth/verify?token=${encodeURIComponent(
        verifyToken
      )}&email=${encodeURIComponent(email)}`;

      const emailResult = await sendEmail({
        to: email,
        ...buildVerificationEmail({ email, verifyUrl }),
      });

      if (!emailResult.ok) {
        // Without a delivered verification email the account cannot be
        // activated, so do not create it.
        return apiError(
          'Email verifikasi gagal terkirim. Silakan coba lagi atau hubungi admin.',
          503,
          { code: 'EMAIL_SEND_FAILED' }
        );
      }

      // Pending registration record: the account is only activated after the
      // emailed link is opened.
      setPendingRegistration(email, {
        id: `usr-gmail-${slug}`,
        username: email,
        nama: displayName || email.split('@')[0],
        role: 'MEMPELAI_PRIA' as const,
        jabatan: `Paket ${packageId} • ${eventType}`,
        clientId,
        clientName: `Client • ${displayName || email.split('@')[0]}`,
        packageId,
        eventType,
        catalogThemeId,
        verifyToken,
      });

      return NextResponse.json({
        success: true,
        message: 'Link verifikasi telah dikirim ke email Anda.',
        email,
        clientId,
      });
    }

    if (action === 'REGISTER_GMAIL_WORKSPACE' && body.user && typeof body.user === 'object') {
      // This action used to mint a session straight from an unverified
      // request body: any caller could POST {email, clientId} and receive a
      // valid cookie, without proving they own the mailbox.
      //
      // A session is now only issued after the emailed verification link is
      // opened (see /api/auth/verify). This branch exists purely to reject
      // the old bypass, whatever it carries.
      return NextResponse.json(
        {
          success: false,
          error:
            'Pendaftaran langsung tidak lagi diizinkan. Gunakan alur verifikasi email.',
          code: 'LEGACY_REGISTER_DISABLED',
        },
        { status: 403 }
      );
    }

    const identifier = String(
      body.identifier || body.username || body.email || ''
    ).trim();
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

    // Verify Cloudflare Turnstile on credential logins when configured
    const loginCaptcha = await verifyTurnstileToken(body.turnstileToken, {
      expectedAction: 'login',
      remoteIp: resolveClientIp(request.headers),
    });
    if (!loginCaptcha.success) {
      return apiError(
        loginCaptcha.skipped
          ? 'Verifikasi keamanan sedang tidak tersedia. Coba lagi nanti.'
          : 'Verifikasi keamanan Cloudflare Turnstile gagal. Silakan centang ulang lalu coba lagi.',
        403,
        { code: 'CAPTCHA_FAILED' }
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

    // Bind the session to a tenant. The tenant comes from server-side data,
    // never from the request, so every later query can be scoped to exactly
    // one workspace.
    const workspaceSlug =
      authenticatedUser.clientId?.trim() ||
      findWorkspaceSlugForUser(authenticatedUser) ||
      'client-utama';
    const tenantId = await ensureDefaultTenant(
      workspaceSlug,
      authenticatedUser.clientName || authenticatedUser.nama || workspaceSlug
    );

    const sessionUser: SessionUser = tenantId
      ? { ...authenticatedUser, tenantId }
      : { ...authenticatedUser };

    const token = createSessionToken(sessionUser);

    const response = NextResponse.json({
      success: true,
      user: authenticatedUser,
    });

    setSessionCookie(response, token);

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
  try {
    const body = await request.json();
    const sessionUser = verifyAdminRequest(request);

    if (!sessionUser) {
      return NextResponse.json(
        { success: false, error: 'Sesi JWT tidak valid atau telah berakhir. Silakan login kembali.' },
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

    const action = String(body.action || 'UPDATE_DEFAULT_USER').toUpperCase();

    // 1. Tambah / Edit Akun Panitia oleh User Default (Tanpa perlu konfirmasi superadmin)
    if (action === 'UPSERT_PANITIA') {
      const id = body.id ? String(body.id).trim() : undefined;
      const username = String(body.username || '').trim().toLowerCase();
      const nama = String(body.nama || '').trim();
      const email =
        body.email !== undefined
          ? String(body.email).trim().toLowerCase()
          : undefined;
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

      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return NextResponse.json(
          { success: false, error: 'Format email Google tertaut tidak valid.' },
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
        ...(email !== undefined ? { email } : {}),
        jabatan,
        clientId,
        clientName,
        ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
      });

      if (panitiaUser.passwordHash) {
        await serverStore.persistUserCredentialToVault(panitiaUser);
      }
      await serverStore.persistStateToSupabaseDirect();
      const fullState = serverStore.getFullState(false);

      return NextResponse.json({
        success: true,
        message: id
          ? `Akun Panitia "${panitiaUser.username}" berhasil diperbarui.`
          : `Akun Panitia "${panitiaUser.username}" berhasil ditambahkan.`,
        panitiaUser: {
          id: panitiaUser.id,
          username: panitiaUser.username,
          nama: panitiaUser.nama,
          email: panitiaUser.email,
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
      await serverStore.persistStateToSupabaseDirect();
      const fullState = serverStore.getFullState(false);
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

      if (superUser.passwordHash) {
        await serverStore.persistUserCredentialToVault(superUser);
      }
      await serverStore.persistStateToSupabaseDirect();
      const fullState = serverStore.getFullState(false);

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
      await serverStore.persistStateToSupabaseDirect();
      const fullState = serverStore.getFullState(false);
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

      await Promise.all(
        createdUsers.map((u) =>
          u.passwordHash
            ? serverStore.persistUserCredentialToVault(u)
            : Promise.resolve(false)
        )
      );
      await serverStore.persistStateToSupabaseDirect();
      const fullState = serverStore.getFullState(false);

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
      await serverStore.persistStateToSupabaseDirect();
      const fullState = serverStore.getFullState(false);
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

    const newEmail =
      body.newEmail !== undefined
        ? String(body.newEmail).trim().toLowerCase()
        : undefined;

    if (newEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      return NextResponse.json(
        { success: false, error: 'Format email Google tertaut tidak valid.' },
        { status: 400 }
      );
    }

    const updatedAdmin = serverStore.updateAdminUser(targetAdmin.id, {
      nama: newName,
      username: newUsername,
      ...(newEmail !== undefined
        ? { email: newEmail || `${newUsername}@wedding.local` }
        : {}),
      ...(body.clientId ? { clientId: String(body.clientId).trim() } : {}),
      ...(body.clientName ? { clientName: String(body.clientName).trim() } : {}),
      ...(newPassword
        ? {
            passwordHash: hashPassword(newPassword),
            password: '',
          }
        : {}),
    });

    if (updatedAdmin.passwordHash) {
      await serverStore.persistUserCredentialToVault(updatedAdmin);
    }
    await serverStore.persistStateToSupabaseDirect();
    const fullState = serverStore.getFullState(false);

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
      setSessionCookie(response, refreshedToken);
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
