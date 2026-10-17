import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const state = serverStore.getFullState();
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

    switch (action) {
      case 'UPSERT_TASK': {
        const task = serverStore.upsertTask(payload);
        return NextResponse.json({
          success: true,
          task,
          data: serverStore.getFullState(),
        });
      }

      case 'DELETE_TASK': {
        serverStore.deleteTask(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(),
        });
      }

      case 'UPSERT_GUEST': {
        const guest = serverStore.upsertGuest(payload);
        return NextResponse.json({
          success: true,
          guest,
          data: serverStore.getFullState(),
        });
      }

      case 'DELETE_GUEST': {
        serverStore.deleteGuest(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(),
        });
      }

      case 'SUBMIT_RSVP': {
        const result = serverStore.submitPublicRsvp(payload);
        return NextResponse.json({
          success: true,
          guest: result.guest,
          wish: result.wish,
          data: serverStore.getFullState(),
        });
      }

      case 'TOGGLE_PIN_WISH': {
        serverStore.togglePinWish(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(),
        });
      }

      case 'REPLY_WISH': {
        serverStore.replyToWish(payload.id, payload.replyFromCouple);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(),
        });
      }

      case 'DELETE_WISH': {
        serverStore.deleteWish(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(),
        });
      }

      case 'UPSERT_BUDGET': {
        const budgetItem = serverStore.upsertBudgetItem(payload);
        return NextResponse.json({
          success: true,
          budgetItem,
          data: serverStore.getFullState(),
        });
      }

      case 'DELETE_BUDGET': {
        serverStore.deleteBudgetItem(payload.id);
        return NextResponse.json({
          success: true,
          data: serverStore.getFullState(),
        });
      }

      case 'UPDATE_SETTINGS': {
        const settings = serverStore.updateSettings(payload);
        return NextResponse.json({
          success: true,
          settings,
          data: serverStore.getFullState(),
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
