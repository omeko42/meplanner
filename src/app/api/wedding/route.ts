import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';
import { isPrivilegedDefaultOrSuperUser, verifyAdminRequest } from '@/lib/auth';
import { apiError, rateLimitByIp, rejectDisallowedOrigin } from '@/lib/apiGuard';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { resolveClientIp } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // The full database (guest PII, wishes, settings) must never be readable
    // without a verified session.
    const sessionUser = verifyAdminRequest(req);
    if (!sessionUser) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    await serverStore.reconcileWithSupabase();
    const hideBudget = !isPrivilegedDefaultOrSuperUser(sessionUser);
    const state = serverStore.getFullState(hideBudget);
    return NextResponse.json({
      success: true,
      data: state,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Gagal memuat data pernikahan',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const originGuard = rejectDisallowedOrigin(req);
    if (originGuard) return originGuard;

    const body = await req.json();
    const { action, payload } = body;

    if (action === 'SUBMIT_RSVP' || action === 'PUBLIC_CHECKIN_QR') {
      await serverStore.reconcileWithSupabase();
    }

    const adminSession = verifyAdminRequest(req);

    // SUBMIT_RSVP and PUBLIC_CHECKIN_QR are public; all other actions require a verified Admin Session
    if (action !== 'SUBMIT_RSVP' && action !== 'PUBLIC_CHECKIN_QR') {
      if (!adminSession) {
        return apiError(
          'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
          401,
          { code: 'UNAUTHENTICATED' }
        );
      }
    }

    // Public write endpoints are abuse-prone: gate them with Turnstile and a
    // per-IP rate limit. Without a captcha a bot can fill the guest book.
    if (action === 'SUBMIT_RSVP' || action === 'PUBLIC_CHECKIN_QR') {
      const ip = resolveClientIp(req.headers);
      const limit = rateLimitByIp(req, `wedding:${action}`, {
        limit: 20,
        windowMs: 10 * 60 * 1000,
      });
      if (!limit.allowed) {
        return apiError(
          `Terlalu banyak permintaan. Silakan coba lagi dalam ${limit.retryAfterSeconds} detik.`,
          429,
          {
            code: 'RATE_LIMITED',
            headers: { 'Retry-After': String(limit.retryAfterSeconds) },
          }
        );
      }

      const captcha = await verifyTurnstileToken(
        (payload as Record<string, unknown> | undefined)?.turnstileToken as
          | string
          | undefined,
        { expectedAction: 'public_form', remoteIp: ip }
      );
      if (!captcha.success) {
        return apiError(
          captcha.skipped
            ? 'Verifikasi keamanan tidak tersedia.'
            : 'Verifikasi keamanan gagal. Silakan coba lagi.',
          403,
          { code: 'CAPTCHA_FAILED' }
        );
      }
    }

    const isPanitia = adminSession?.role === 'PANITIA';
    const hideBudget = !isPrivilegedDefaultOrSuperUser(adminSession);

    // Panitia is strictly forbidden from accessing or modifying Budgeting
    if (
      isPanitia &&
      (action === 'UPSERT_BUDGET' ||
        action === 'DELETE_BUDGET' ||
        action === 'RESET_DEFAULT' ||
        action === 'IMPORT_BACKUP')
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Akses ditolak (403 Forbidden). Akun Panitia tidak memiliki akses ke modul Anggaran / Budgeting.',
        },
        { status: 403 }
      );
    }

    switch (action) {
      case 'UPSERT_TASK': {
        const task = serverStore.upsertTask(payload);
        return NextResponse.json({
          success: true,
          task,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'DELETE_TASK': {
        serverStore.deleteTask(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'UPSERT_GUEST': {
        const guest = serverStore.upsertGuest(payload);
        return NextResponse.json({
          success: true,
          guest,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'PUBLIC_CHECKIN_QR': {
        const guest = serverStore.upsertGuest({
          ...payload,
          rsvpStatus: 'Hadir',
          attendanceStatus: 'Hadir di Lokasi',
          updatedBy: 'QR Scan Check-In',
        });
        // Public endpoint: return only the affected record. Returning the whole
        // database would expose every guest (name, phone, address) and the
        // admin account list to an unauthenticated caller.
        return NextResponse.json({
          success: true,
          guest,
        });
      }

      case 'DELETE_GUEST': {
        serverStore.deleteGuest(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'SUBMIT_RSVP': {
        const ipAddress = resolveClientIp(req.headers);
        const userAgent =
          req.headers.get('user-agent') || payload?.userAgent || '';
        const result = serverStore.submitPublicRsvp({
          ...payload,
          ipAddress,
          userAgent,
        });
        // Public endpoint: minimal response only. The caller already updates
        // its local state; echoing the full database leaks PII and account data.
        return NextResponse.json({
          success: true,
          guest: result.guest,
          wish: result.wish,
        });
      }

      case 'TOGGLE_PIN_WISH': {
        serverStore.togglePinWish(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'REPLY_WISH': {
        serverStore.replyToWish(payload.id, payload.replyFromCouple);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'MODERATE_WISH': {
        serverStore.moderateWish(
          payload.id,
          payload.moderationStatus,
          payload.flaggedReason
        );
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'DELETE_WISH': {
        serverStore.deleteWish(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'UPSERT_BUDGET': {
        const budgetItem = serverStore.upsertBudgetItem(payload);
        return NextResponse.json({
          success: true,
          budgetItem,
          data: serverStore.getFullState(false),
        });
      }

      case 'DELETE_BUDGET': {
        serverStore.deleteBudgetItem(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(false),
        });
      }

      case 'UPDATE_SETTINGS': {
        // If Panitia updates settings, prevent modifying totalBudgetCap
        const safePayload = isPanitia
          ? (() => {
              const copy = { ...payload };
              delete copy.totalBudgetCap;
              return copy;
            })()
          : payload;
        const settings = serverStore.updateSettings(safePayload);
        return NextResponse.json({
          success: true,
          settings,
          data: serverStore.getFullState(hideBudget),
        });
      }

      case 'IMPORT_BACKUP': {
        const state = serverStore.importFullBackup(payload);
        return NextResponse.json({
          success: true,
          data: state,
        });
      }

      case 'RESET_DEFAULT': {
        const state = serverStore.resetToDefault();
        return NextResponse.json({
          success: true,
          data: state,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: `Action tidak dikenali: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Terjadi kesalahan server',
      },
      { status: 500 }
    );
  }
}
