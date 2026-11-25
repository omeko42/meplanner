'use client';

import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import type { BudgetVendorItem, WeddingGuest, WeddingSettings } from '@/types';

function formatIdr(amount: number): string {
  return `Rp ${Math.round(amount || 0).toLocaleString('id-ID')}`;
}

function getFileStamp(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}

function getCoupleHeading(settings: WeddingSettings): string {
  const g = settings.groomNickname || settings.groomFullName || 'Mempelai Pria';
  const b = settings.brideNickname || settings.brideFullName || 'Mempelai Wanita';
  return `${g} & ${b}`;
}

/**
 * Export full RAB / Budget report to a clean, branded PDF document.
 */
export function exportBudgetToPdf(
  items: BudgetVendorItem[],
  settings: WeddingSettings
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const couple = getCoupleHeading(settings);

  const totalActual = items.reduce(
    (acc, item) => acc + (Number(item.actualCost || item.estimatedCost) || 0),
    0
  );
  const totalPaid = items.reduce(
    (acc, item) => acc + (Number(item.paidAmount) || 0),
    0
  );
  const totalRemaining = Math.max(0, totalActual - totalPaid);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(28, 22, 16);
  doc.text(`LAPORAN ANGGARAN & RAB — ${couple.toUpperCase()}`, 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 100, 90);
  doc.text(
    `MEPlanner Event Suite • Dicetak: ${new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    })} WIB • Total ${items.length} Pos Anggaran`,
    40,
    58
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(28, 22, 16);
  doc.text(
    `Total Kebutuhan: ${formatIdr(totalActual)}   |   Sudah Dibayar: ${formatIdr(
      totalPaid
    )}   |   Sisa Pelunasan: ${formatIdr(totalRemaining)}`,
    40,
    78
  );

  autoTable(doc, {
    startY: 92,
    head: [
      [
        'No',
        'Kategori',
        'Item / Pos Anggaran',
        'Vendor / PIC',
        'Biaya Aktual',
        'Sudah Dibayar',
        'Sisa',
        'Status',
      ],
    ],
    body: items.map((item, index) => {
      const actual = Number(item.actualCost || item.estimatedCost) || 0;
      const paid = Number(item.paidAmount) || 0;
      const rem = Math.max(0, actual - paid);
      return [
        String(index + 1),
        item.category || '-',
        item.itemName || '-',
        item.vendorName || item.pic || '-',
        formatIdr(actual),
        formatIdr(paid),
        formatIdr(rem),
        item.paymentStatus || '-',
      ];
    }),
    styles: { fontSize: 8.5, cellPadding: 5 },
    headStyles: { fillColor: [182, 141, 64], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [250, 248, 245] },
  });

  doc.save(`MEPlanner_RAB_${getFileStamp()}.pdf`);
}

/**
 * Export full RAB / Budget report to a multi-sheet Excel (.xlsx) workbook.
 */
export function exportBudgetToExcel(
  items: BudgetVendorItem[],
  settings: WeddingSettings
): void {
  const totalActual = items.reduce(
    (acc, item) => acc + (Number(item.actualCost || item.estimatedCost) || 0),
    0
  );
  const totalPaid = items.reduce(
    (acc, item) => acc + (Number(item.paidAmount) || 0),
    0
  );
  const totalRemaining = Math.max(0, totalActual - totalPaid);

  const summaryRows = [
    { Keterangan: 'Acara / Mempelai', Nilai: getCoupleHeading(settings) },
    { Keterangan: 'Jumlah Pos Anggaran', Nilai: items.length },
    { Keterangan: 'Total Kebutuhan Biaya (IDR)', Nilai: totalActual },
    { Keterangan: 'Total Sudah Dibayar / Dibendel (IDR)', Nilai: totalPaid },
    { Keterangan: 'Sisa Belum Dibayar (IDR)', Nilai: totalRemaining },
    {
      Keterangan: 'Tanggal Ekspor',
      Nilai: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    },
  ];

  const detailRows = items.map((item, idx) => {
    const actual = Number(item.actualCost || item.estimatedCost) || 0;
    const paid = Number(item.paidAmount) || 0;
    return {
      No: idx + 1,
      Kode: item.id,
      Kategori: item.category,
      'Pos Anggaran': item.itemName,
      Vendor: item.vendorName || '-',
      PIC: item.pic || '-',
      'Estimasi (Rp)': Number(item.estimatedCost) || 0,
      'Aktual (Rp)': actual,
      'Terbayar (Rp)': paid,
      'Sisa (Rp)': Math.max(0, actual - paid),
      Status: item.paymentStatus,
      'Jatuh Tempo': item.dueDate || '-',
      Catatan: item.notes || '',
    };
  });

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan RAB');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Detail Anggaran');
  XLSX.writeFile(wb, `MEPlanner_RAB_${getFileStamp()}.xlsx`);
}

/**
 * Export full Guest List & RSVP ledger to PDF.
 */
export function exportGuestsToPdf(
  guests: WeddingGuest[],
  settings: WeddingSettings
): void {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
  const couple = getCoupleHeading(settings);

  const totalPax = guests.reduce((sum, g) => sum + (Number(g.pax) || 1), 0);
  const hadirCount = guests.filter((g) => g.rsvpStatus === 'Hadir').length;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(28, 22, 16);
  doc.text(`DAFTAR TAMU & BUKU RSVP — ${couple.toUpperCase()}`, 40, 42);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 100, 90);
  doc.text(
    `MEPlanner Event Suite • Dicetak: ${new Date().toLocaleString('id-ID', {
      timeZone: 'Asia/Jakarta',
    })} WIB`,
    40,
    58
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(28, 22, 16);
  doc.text(
    `Total Undangan: ${guests.length} Tamu   |   Total Kuota: ${totalPax} Pax   |   Konfirmasi Hadir: ${hadirCount} Tamu`,
    40,
    78
  );

  autoTable(doc, {
    startY: 92,
    head: [
      [
        'No',
        'Kode',
        'Nama Tamu',
        'Instansi / Relasi',
        'Pihak',
        'Pax',
        'Format',
        'No. WhatsApp',
        'RSVP',
      ],
    ],
    body: guests.map((g, index) => [
      String(index + 1),
      g.invitationCode || '-',
      g.guestName || '-',
      g.institution || g.guestType || '-',
      g.side || '-',
      String(g.pax || 1),
      g.invitationFormat || '-',
      g.phone || '-',
      g.rsvpStatus || 'Belum Konfirmasi',
    ]),
    styles: { fontSize: 8, cellPadding: 4.5 },
    headStyles: { fillColor: [28, 22, 16], textColor: [212, 175, 55] },
    alternateRowStyles: { fillColor: [250, 248, 245] },
  });

  doc.save(`MEPlanner_BukuTamu_${getFileStamp()}.pdf`);
}

/**
 * Export full Guest List & RSVP ledger to Excel (.xlsx).
 */
export function exportGuestsToExcel(
  guests: WeddingGuest[],
  settings: WeddingSettings
): void {
  const totalPax = guests.reduce((sum, g) => sum + (Number(g.pax) || 1), 0);
  const hadirCount = guests.filter((g) => g.rsvpStatus === 'Hadir').length;

  const summaryRows = [
    { Keterangan: 'Acara / Mempelai', Nilai: getCoupleHeading(settings) },
    { Keterangan: 'Total Undangan (Tamu)', Nilai: guests.length },
    { Keterangan: 'Total Kuota (Pax)', Nilai: totalPax },
    { Keterangan: 'Konfirmasi Hadir', Nilai: hadirCount },
    {
      Keterangan: 'Tanggal Ekspor',
      Nilai: new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
    },
  ];

  const detailRows = guests.map((g, idx) => ({
    No: idx + 1,
    Kode: g.invitationCode || '-',
    'Nama Tamu': g.guestName,
    Kategori: g.guestType || '-',
    Pihak: g.side || '-',
    Instansi: g.institution || '-',
    Prioritas: g.priority || '-',
    'Kuota Pax': g.pax || 1,
    Format: g.invitationFormat || '-',
    'No. WhatsApp': g.phone || '-',
    Alamat: g.address || '-',
    'Status Kirim': g.deliveryStatus || '-',
    'Status RSVP': g.rsvpStatus || '-',
    'Status Kehadiran': g.attendanceStatus || '-',
    Catatan: g.notes || '',
  }));

  const wb = XLSX.utils.book_new();
  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  const wsDetail = XLSX.utils.json_to_sheet(detailRows);
  XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Tamu');
  XLSX.utils.book_append_sheet(wb, wsDetail, 'Daftar Tamu');
  XLSX.writeFile(wb, `MEPlanner_BukuTamu_${getFileStamp()}.xlsx`);
}
