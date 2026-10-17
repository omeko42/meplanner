import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';
import { verifyAdminRequest } from '@/lib/auth';
import { inferTimelinePhase } from '@/data/seedData';
import {
  TaskCategory,
  TaskPriority,
  TaskOwner,
  GuestType,
  GuestSide,
  InvitationFormat,
  GuestPriority,
  DeliveryStatus,
  RsvpStatus,
  AttendanceStatus,
} from '@/types';

export const dynamic = 'force-dynamic';

function parseCsvRows(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentField += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentField += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (ch === '\n' || (ch === '\r' && next === '\n')) {
        if (ch === '\r') i++;
        currentRow.push(currentField.trim());
        if (currentRow.some((cell) => cell !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += ch;
      }
    }
  }
  if (currentField !== '' || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some((cell) => cell !== '')) {
      rows.push(currentRow);
    }
  }
  return rows;
}

export async function POST(req: NextRequest) {
  try {
    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return NextResponse.json(
        {
          success: false,
          error: 'Akses ditolak (401 Unauthorized). Silakan login sebagai Admin terlebih dahulu.',
        },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const sheetId =
      body.sheetId ||
      serverStore.getSettings().googleSheetId ||
      '1aajOKFxFktd56tkE--34gDWcoCWDDF_rOK8Q8_JpnlU';

    const tasksUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=786665557`;
    const guestsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=1134858514`;
    const settingsUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=487908567`;

    const [tasksRes, guestsRes, settingsRes] = await Promise.all([
      fetch(tasksUrl, { cache: 'no-store' }),
      fetch(guestsUrl, { cache: 'no-store' }),
      fetch(settingsUrl, { cache: 'no-store' }),
    ]);

    let syncedTasksCount = 0;
    let syncedGuestsCount = 0;

    if (tasksRes.ok) {
      const tasksCsv = await tasksRes.text();
      const rows = parseCsvRows(tasksCsv);
      if (rows.length > 1) {
        const dataRows = rows.slice(1);
        for (const r of dataRows) {
          const [
            id,
            category,
            title,
            due,
            priority,
            owner,
            notes,
            doneStr,
            doneAt,
            createdAt,
            updatedAt,
            updatedBy,
          ] = r;
          if (!title) continue;
          const isDone = String(doneStr).toUpperCase() === 'TRUE';
          const cat = (category || 'Acara') as TaskCategory;
          const dueVal = due || '2026-12-01';
          serverStore.upsertTask({
            id: id || `sheet_${syncedTasksCount + 1}`,
            category: cat,
            timelinePhase: inferTimelinePhase(dueVal, cat),
            title,
            due: dueVal,
            priority: (priority || 'Sedang') as TaskPriority,
            owner: (owner || 'Bersama') as TaskOwner,
            status: isDone ? 'SELESAI' : 'BELUM',
            notes: notes || '',
            done: isDone,
            doneAt: doneAt || '',
            createdAt: createdAt || '21/07/2026',
            updatedAt: updatedAt || '17/10/2026',
            updatedBy: updatedBy || 'agungkrisdianto98@gmail.com',
          });
          syncedTasksCount++;
        }
      }
    }

    if (guestsRes.ok) {
      const guestsCsv = await guestsRes.text();
      const rows = parseCsvRows(guestsCsv);
      if (rows.length > 1) {
        const dataRows = rows.slice(1);
        for (const r of dataRows) {
          const [
            id,
            invitationCode,
            guestName,
            guestType,
            side,
            institution,
            invitationFormat,
            priority,
            cardQty,
            pax,
            phone,
            address,
            deliveryStatus,
            rsvpStatus,
            attendanceStatus,
            notes,
            createdAt,
            updatedAt,
            updatedBy,
          ] = r;
          if (!guestName) continue;
          serverStore.upsertGuest({
            id: id || undefined,
            invitationCode: invitationCode || undefined,
            guestName,
            guestType: (guestType || 'Pejabat/VIP') as GuestType,
            side: (side || 'Mempelai Pria') as GuestSide,
            institution: institution || '',
            invitationFormat: (invitationFormat || 'Cetak Tebal') as InvitationFormat,
            priority: (priority || 'P1 - VIP') as GuestPriority,
            cardQty: Number(cardQty) || 1,
            pax: Number(pax) || 2,
            phone: phone || '',
            address: address || '',
            deliveryStatus: (deliveryStatus || 'Belum Disiapkan') as DeliveryStatus,
            rsvpStatus: (rsvpStatus || 'Belum Konfirmasi') as RsvpStatus,
            attendanceStatus: (attendanceStatus || 'Belum Dicek') as AttendanceStatus,
            notes: notes || '',
            createdAt: createdAt || '21/07/2026',
            updatedAt: updatedAt || '17/10/2026',
            updatedBy: updatedBy || 'agungkrisdianto98@gmail.com',
          });
          syncedGuestsCount++;
        }
      }
    }

    if (settingsRes.ok) {
      const settingsCsv = await settingsRes.text();
      const rows = parseCsvRows(settingsCsv);
      const map: Record<string, string> = {};
      for (const r of rows.slice(1)) {
        if (r[0] && r[1] !== undefined) {
          map[r[0].trim()] = r[1].trim();
        }
      }
      serverStore.updateSettings({
        siteTitle: map.site_title || undefined,
        subtitle: map.subtitle || undefined,
        weddingDatetime: map.wedding_datetime || undefined,
        bistonDatetime: map.biston_datetime || undefined,
        timezone: map.timezone || undefined,
        autoRefreshSeconds: map.auto_refresh_seconds
          ? Number(map.auto_refresh_seconds)
          : undefined,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sinkronisasi Google Sheets berhasil (${syncedTasksCount} tugas & ${syncedGuestsCount} tamu diselaraskan).`,
      data: serverStore.getFullState(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Gagal menyinkronkan data dari Google Spreadsheet',
      },
      { status: 500 }
    );
  }
}
