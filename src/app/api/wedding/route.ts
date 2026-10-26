import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';
import { isPrivilegedDefaultOrSuperUser, verifyAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    await serverStore.reconcileWithSupabase();
    const sessionUser = verifyAdminRequest(req);
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
    const body = await req.json();
    const { action, payload } = body;

    if (action === 'SUBMIT_RSVP' || action === 'PUBLIC_CHECKIN_QR') {
      await serverStore.reconcileWithSupabase();
    }

    const adminSession = verifyAdminRequest(req);

    // SUBMIT_RSVP and PUBLIC_CHECKIN_QR are public; all other actions require a verified Admin Session
    if (action !== 'SUBMIT_RSVP' && action !== 'PUBLIC_CHECKIN_QR') {
      if (!adminSession) {
        return NextResponse.json(
          {
            success: false,
            error: 'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
          },
          { status: 401 }
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

      case 'UPSERT_GUEST':
      case 'PUBLIC_CHECKIN_QR': {
        const guest = serverStore.upsertGuest(
          action === 'PUBLIC_CHECKIN_QR'
            ? {
                ...payload,
                rsvpStatus: 'Hadir',
                attendanceStatus: 'Hadir di Lokasi',
                updatedBy: 'QR Scan Check-In',
              }
            : payload
        );
        return NextResponse.json({
          success: true,
          guest,
          data: serverStore.getFullState(hideBudget),
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
        const forwardedFor = req.headers.get('x-forwarded-for');
        const realIp = req.headers.get('x-real-ip');
        const ipAddress =
          (forwardedFor ? forwardedFor.split(',')[0].trim() : realIp) ||
          payload?.ipAddress ||
          'Client Direct';
        const userAgent =
          req.headers.get('user-agent') || payload?.userAgent || '';
        const result = serverStore.submitPublicRsvp({
          ...payload,
          ipAddress,
          userAgent,
        });
        return NextResponse.json({
          success: true,
          guest: result.guest,
          wish: result.wish,
          data: serverStore.getFullState(hideBudget),
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
