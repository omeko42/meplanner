import {
  WeddingDatabaseSchema,
  WeddingGuest,
  WeddingSettings,
  WeddingScheduleEvent,
  WeddingTask,
  BudgetVendorItem,
  AdminUser,
} from '@/types';
import {
  INITIAL_SETTINGS,
  INITIAL_TASKS,
  INITIAL_GUESTS,
  INITIAL_WISHES,
  INITIAL_BUDGET_ITEMS,
  INITIAL_ADMIN_USERS,
} from '@/data/seedData';

const STORAGE_KEY = 'my_wedding_manager_state_v2';
const ADMIN_AUTH_KEY = 'my_wedding_manager_admin_auth_v2';

export function getInitialClientState(): WeddingDatabaseSchema {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<WeddingDatabaseSchema>;
        return {
          settings: parsed.settings
            ? { ...INITIAL_SETTINGS, ...parsed.settings }
            : INITIAL_SETTINGS,
          tasks:
            Array.isArray(parsed.tasks) && parsed.tasks.length > 0
              ? parsed.tasks
              : INITIAL_TASKS,
          guests:
            Array.isArray(parsed.guests) && parsed.guests.length > 0
              ? parsed.guests
              : INITIAL_GUESTS,
          wishes:
            Array.isArray(parsed.wishes) && parsed.wishes.length > 0
              ? parsed.wishes
              : INITIAL_WISHES,
          budgetItems:
            Array.isArray(parsed.budgetItems) && parsed.budgetItems.length > 0
              ? parsed.budgetItems
              : INITIAL_BUDGET_ITEMS,
          adminUsers:
            Array.isArray(parsed.adminUsers) && parsed.adminUsers.length > 0
              ? parsed.adminUsers
              : INITIAL_ADMIN_USERS,
          lastSyncedAt: parsed.lastSyncedAt || new Date().toISOString(),
        };
      }
    } catch {
      // Fallback to seed data
    }
  }

  return {
    settings: INITIAL_SETTINGS,
    tasks: INITIAL_TASKS,
    guests: INITIAL_GUESTS,
    wishes: INITIAL_WISHES,
    budgetItems: INITIAL_BUDGET_ITEMS,
    adminUsers: INITIAL_ADMIN_USERS,
    lastSyncedAt: new Date().toISOString(),
  };
}

export function saveClientState(state: WeddingDatabaseSchema): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...state,
        lastSyncedAt: new Date().toISOString(),
      })
    );
  } catch {
    // Ignore quota errors
  }
}

export function getStoredAdminUser(): AdminUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(ADMIN_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function saveStoredAdminUser(user: AdminUser | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(ADMIN_AUTH_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(ADMIN_AUTH_KEY);
    }
  } catch {
    // Ignore storage errors
  }
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

export function buildGuestInvitationUrl(
  guest: Pick<WeddingGuest, 'guestName' | 'invitationCode'>,
  originUrl?: string
): string {
  const base =
    originUrl ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://my-wedding-manager.vercel.app');
  const params = new URLSearchParams();
  params.set('to', guest.guestName);
  if (guest.invitationCode) {
    params.set('code', guest.invitationCode);
  }
  return `${base}/?${params.toString()}`;
}

export function generateWhatsAppMessage(
  guest: WeddingGuest,
  settings: WeddingSettings,
  originUrl?: string
): { inviteUrl: string; messageText: string; waHref: string } {
  const inviteUrl = buildGuestInvitationUrl(guest, originUrl);
  const isVipPolri =
    guest.guestType === 'Pejabat/VIP' ||
    guest.priority === 'P1 - VIP' ||
    /KOMJEN|IRJEN|BRIGJEN|KOMBES|AKBP|JENDERAL/i.test(guest.guestName);

  let messageText = '';

  if (isVipPolri) {
    messageText = [
      `Selamat Pagi/Siang/Sore Jenderal / Komandan,`,
      `Kepada Yth.`,
      `*${guest.guestName}*`,
      guest.institution ? `(${guest.institution})` : '',
      ``,
      `Mohon izin Jenderal / Komandan, dengan penuh rasa hormat dan kerendahan hati, kami bermaksud menyampaikan undangan digital rangkaian acara pernikahan kami:`,
      ``,
      `💍 *${settings.groomFullName}*`,
      `&`,
      `💍 *${settings.brideFullName}*`,
      ``,
      `📅 *Ibadah Biston:* ${settings.event1DateLabel} (${settings.event1TimeLabel})`,
      `📅 *Pemberkatan Nikah:* ${settings.event2DateLabel} (${settings.event2TimeLabel})`,
      `📅 *Resepsi Kehormatan:* ${settings.event3DateLabel} (${settings.event3TimeLabel})`,
      `📍 *Lokasi:* ${settings.event3Venue}, Semarang`,
      ``,
      `Tautan Undangan Resmi & Konfirmasi Kehadiran:`,
      `${inviteUrl}`,
      ``,
      `Merupakan suatu kehormatan dan kebahagiaan besar bagi kami apabila Jenderal / Komandan berkenan memberikan doa restu kepada kami berdua.`,
      ``,
      `Hormat kami,`,
      `*${settings.groomFullName}* & Keluarga`,
    ]
      .filter((line) => line !== undefined)
      .join('\n');
  } else {
    messageText = [
      `Kepada Yth. Bapak/Ibu/Saudara/i:`,
      `*${guest.guestName}*`,
      guest.institution ? `_${guest.institution}_` : '',
      ``,
      `Dengan penuh rasa syukur ke hadirat Tuhan Yang Maha Pengasih, tanpa mengurangi rasa hormat, perkenankan kami mengundang Bapak/Ibu/Saudara/i untuk hadir dan memberikan doa restu pada acara pernikahan kami:`,
      ``,
      `✨ *${settings.groomFullName}*`,
      `&`,
      `✨ *${settings.brideFullName}*`,
      ``,
      `🗓️ *Biston:* ${settings.event1DateLabel} (${settings.event1TimeLabel})`,
      `🗓️ *Pemberkatan:* ${settings.event2DateLabel} (${settings.event2TimeLabel})`,
      `🗓️ *Resepsi:* ${settings.event3DateLabel} (${settings.event3TimeLabel})`,
      `📍 *Tempat:* ${settings.event3Venue} — ${settings.event3Address}`,
      ``,
      `Silakan buka Undangan Digital lengkap beserta lokasi peta & konfirmasi kehadiran (RSVP) melalui tautan berikut:`,
      `👉 ${inviteUrl}`,
      ``,
      `Kehadiran dan doa restu Bapak/Ibu/Saudara/i merupakan sukacita yang tak ternilai bagi kami.`,
      ``,
      `Salam kasih,`,
      `*${settings.groomNickname} & ${settings.brideNickname}*`,
    ]
      .filter((line) => line !== undefined)
      .join('\n');
  }

  // Normalize phone number for wa.me
  const digits = (guest.phone || '').replace(/\D+/g, '');
  let normalizedPhone = '';
  if (digits.startsWith('08')) {
    normalizedPhone = `62${digits.slice(1)}`;
  } else if (digits.startsWith('62')) {
    normalizedPhone = digits;
  } else if (digits.length >= 9) {
    normalizedPhone = digits;
  }

  const encodedText = encodeURIComponent(messageText);
  const waHref = normalizedPhone
    ? `https://wa.me/${normalizedPhone}?text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return { inviteUrl, messageText, waHref };
}

function escapeCsvCell(val: unknown): string {
  const str = val === null || val === undefined ? '' : String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportTasksToCsv(tasks: WeddingTask[]): string {
  const headers = [
    'id',
    'category',
    'timelinePhase',
    'title',
    'due',
    'priority',
    'owner',
    'status',
    'notes',
    'done',
    'doneAt',
    'createdAt',
    'updatedAt',
    'updatedBy',
  ];
  const rows = tasks.map((t) =>
    [
      t.id,
      t.category,
      t.timelinePhase,
      t.title,
      t.due,
      t.priority,
      t.owner,
      t.status,
      t.notes,
      t.done ? 'TRUE' : 'FALSE',
      t.doneAt,
      t.createdAt,
      t.updatedAt,
      t.updatedBy,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportGuestsToCsv(guests: WeddingGuest[]): string {
  // Exact 19 columns matching user's Google Sheet DB (gid=1134858514)
  const headers = [
    'id',
    'invitationCode',
    'guestName',
    'guestType',
    'side',
    'institution',
    'invitationFormat',
    'priority',
    'cardQty',
    'pax',
    'phone',
    'address',
    'deliveryStatus',
    'rsvpStatus',
    'attendanceStatus',
    'notes',
    'createdAt',
    'updatedAt',
    'updatedBy',
  ];
  const rows = guests.map((g) =>
    [
      g.id,
      g.invitationCode,
      g.guestName,
      g.guestType,
      g.side,
      g.institution,
      g.invitationFormat,
      g.priority,
      g.cardQty,
      g.pax,
      g.phone,
      g.address,
      g.deliveryStatus,
      g.rsvpStatus,
      g.attendanceStatus,
      g.notes,
      g.createdAt,
      g.updatedAt,
      g.updatedBy,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function exportBudgetToCsv(items: BudgetVendorItem[]): string {
  const headers = [
    'id',
    'category',
    'itemName',
    'vendorName',
    'vendorContact',
    'pic',
    'estimatedCost',
    'actualCost',
    'paidAmount',
    'paymentStatus',
    'dueDate',
    'notes',
    'updatedAt',
  ];
  const rows = items.map((b) =>
    [
      b.id,
      b.category,
      b.itemName,
      b.vendorName,
      b.vendorContact,
      b.pic,
      b.estimatedCost,
      b.actualCost,
      b.paidAmount,
      b.paymentStatus,
      b.dueDate,
      b.notes,
      b.updatedAt,
    ]
      .map(escapeCsvCell)
      .join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

export function triggerFileDownload(filename: string, content: string, mimeType: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Gentle Web Audio API Synthesizer for Romantic Piano/Chime Background Music (Canon in D progression)
class AmbientWeddingPlayer {
  private ctx: AudioContext | null = null;
  private timer: number | null = null;
  private isPlaying = false;
  private step = 0;

  // Canon in D major chord arpeggio notes (frequencies in Hz)
  private sequence = [
    293.66, 440.0, 587.33, 739.99, // D major (D4, A4, D5, F#5)
    220.0, 329.63, 440.0, 659.25,  // A major (A3, E4, A4, E5)
    246.94, 369.99, 493.88, 587.33, // B minor (B3, F#4, B4, D5)
    185.0, 277.18, 369.99, 554.37, // F# minor (F#3, C#4, F#4, C#5)
    196.0, 293.66, 392.0, 587.33,  // G major (G3, D4, G4, D5)
    146.83, 220.0, 293.66, 440.0,  // D major low (D3, A3, D4, A4)
    196.0, 293.66, 392.0, 493.88,  // G major (G3, D4, G4, B4)
    220.0, 329.63, 440.0, 554.37,  // A major (A3, E4, A4, C#5)
  ];

  public start(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!this.ctx) {
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      if (this.isPlaying) return true;
      this.isPlaying = true;
      this.playTick();
      this.timer = window.setInterval(() => this.playTick(), 650);
      return true;
    } catch {
      return false;
    }
  }

  public stop(): void {
    this.isPlaying = false;
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  public toggle(): boolean {
    if (this.isPlaying) {
      this.stop();
      return false;
    }
    return this.start();
  }

  public getStatus(): boolean {
    return this.isPlaying;
  }

  private playTick(): void {
    if (!this.ctx || !this.isPlaying) return;
    try {
      const now = this.ctx.currentTime;
      const freq = this.sequence[this.step % this.sequence.length];
      this.step += 1;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 1.45);
    } catch {
      // Ignore audio tick errors
    }
  }
}

export const weddingMusicPlayer = new AmbientWeddingPlayer();

const HARI_INDONESIA = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const BULAN_INDONESIA = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

export function formatDateTimeToIndonesianLabels(isoOrLocal: string): {
  dateLabel: string;
  timeLabel: string;
} {
  try {
    const clean = (isoOrLocal || '').slice(0, 16);
    const [datePart, timePart] = clean.split('T');
    if (!datePart) {
      return {
        dateLabel: 'Sabtu, 19 Desember 2026',
        timeLabel: '09.00 WIB - Selesai',
      };
    }
    const [y, m, d] = datePart.split('-').map(Number);
    const dt = new Date(y, (m || 1) - 1, d || 1);
    const dayName = HARI_INDONESIA[dt.getDay()] || 'Sabtu';
    const monthName = BULAN_INDONESIA[(m || 1) - 1] || 'Desember';
    const formattedTime = (timePart || '09:00').replace(':', '.');
    return {
      dateLabel: `${dayName}, ${d} ${monthName} ${y}`,
      timeLabel: `${formattedTime} WIB - Selesai`,
    };
  } catch {
    return {
      dateLabel: 'Sabtu, 19 Desember 2026',
      timeLabel: '09.00 WIB - Selesai',
    };
  }
}

export function getEffectiveScheduleEvents(
  settings: WeddingSettings
): WeddingScheduleEvent[] {
  if (Array.isArray(settings.scheduleEvents)) {
    return settings.scheduleEvents;
  }

  return [
    {
      id: 'ev-default-1',
      title: settings.event1Title || 'Acara Biston / Pertemuan Keluarga',
      badge: 'Acara 1 • Keluarga',
      subtitle:
        settings.event1Subtitle ||
        'Pertemuan hangat keluarga besar kedua mempelai',
      datetime: settings.bistonDatetime || '2026-12-18T18:00:00+07:00',
      dateLabel: settings.event1DateLabel || 'Jumat, 18 Desember 2026',
      timeLabel: settings.event1TimeLabel || '18.00 WIB - Selesai',
      venue: settings.event1Venue || 'Lokasi Biston Semarang',
      address: settings.event1Address || 'Semarang, Jawa Tengah',
      mapsUrl: settings.event1MapsUrl || 'https://maps.google.com',
      dresscode: settings.event1Dresscode || 'Batik / Formal Rapi',
      enableCountdown: true,
      showOnInvitation: settings.showEvent1 !== false,
    },
    {
      id: 'ev-default-2',
      title: settings.event2Title || 'Ibadah Pemberkatan Pernikahan',
      badge: 'Pemberkatan / Akad',
      subtitle:
        settings.event2Subtitle || 'Peneguhan & Pemberkatan Nikah Kudus',
      datetime: settings.weddingDatetime || '2026-12-19T09:00:00+07:00',
      dateLabel: settings.event2DateLabel || 'Sabtu, 19 Desember 2026',
      timeLabel: settings.event2TimeLabel || '09.00 WIB - Selesai',
      venue: settings.event2Venue || 'Gereja di Semarang',
      address: settings.event2Address || 'Semarang, Jawa Tengah',
      mapsUrl: settings.event2MapsUrl || 'https://maps.google.com',
      dresscode: settings.event2Dresscode || 'Kebaya / Jas Formal',
      enableCountdown: true,
      showOnInvitation: settings.showEvent2 !== false,
    },
    {
      id: 'ev-default-3',
      title: settings.event3Title || 'Resepsi Pernikahan',
      badge: 'Resepsi Utama',
      subtitle:
        settings.event3Subtitle || 'Ramah Tamah & Jamuan Syukur Pernikahan',
      datetime: '2026-12-19T18:30:00+07:00',
      dateLabel: settings.event3DateLabel || 'Sabtu, 19 Desember 2026',
      timeLabel: settings.event3TimeLabel || '18.30 WIB - Selesai',
      venue: settings.event3Venue || 'Gedung Resepsi Semarang',
      address: settings.event3Address || 'Semarang, Jawa Tengah',
      mapsUrl: settings.event3MapsUrl || 'https://maps.google.com',
      dresscode: settings.event3Dresscode || 'Formal / Batik Elegan',
      enableCountdown: false,
      showOnInvitation: settings.showEvent3 !== false,
    },
  ];
}

export function syncScheduleEventsToSettings(
  settings: WeddingSettings,
  events: WeddingScheduleEvent[]
): WeddingSettings {
  const next: WeddingSettings = {
    ...settings,
    scheduleEvents: events,
  };

  const ev1 = events[0];
  const ev2 = events[1];
  const ev3 = events[2];

  if (ev1) {
    next.event1Title = ev1.title;
    next.event1Subtitle = ev1.subtitle;
    next.event1DateLabel = ev1.dateLabel;
    next.event1TimeLabel = ev1.timeLabel;
    next.event1Venue = ev1.venue;
    next.event1Address = ev1.address;
    next.event1MapsUrl = ev1.mapsUrl;
    next.event1Dresscode = ev1.dresscode;
    next.bistonDatetime = ev1.datetime;
    next.showEvent1 = ev1.showOnInvitation !== false;
  } else {
    next.showEvent1 = false;
  }

  if (ev2) {
    next.event2Title = ev2.title;
    next.event2Subtitle = ev2.subtitle;
    next.event2DateLabel = ev2.dateLabel;
    next.event2TimeLabel = ev2.timeLabel;
    next.event2Venue = ev2.venue;
    next.event2Address = ev2.address;
    next.event2MapsUrl = ev2.mapsUrl;
    next.event2Dresscode = ev2.dresscode;
    next.weddingDatetime = ev2.datetime;
    next.showEvent2 = ev2.showOnInvitation !== false;
  } else if (ev1) {
    next.weddingDatetime = ev1.datetime;
    next.showEvent2 = false;
  }

  if (ev3) {
    next.event3Title = ev3.title;
    next.event3Subtitle = ev3.subtitle;
    next.event3DateLabel = ev3.dateLabel;
    next.event3TimeLabel = ev3.timeLabel;
    next.event3Venue = ev3.venue;
    next.event3Address = ev3.address;
    next.event3MapsUrl = ev3.mapsUrl;
    next.event3Dresscode = ev3.dresscode;
    next.showEvent3 = ev3.showOnInvitation !== false;
  } else {
    next.showEvent3 = false;
  }

  // Ensure weddingDatetime reflects the primary countdown event if one is enabled
  const countdownEvents = events.filter((e) => e.enableCountdown);
  if (countdownEvents.length > 0) {
    const mainCountdown =
      countdownEvents.find((e) => /pemberkatan|akad|utama/i.test(e.title + ' ' + e.badge)) ||
      countdownEvents[countdownEvents.length - 1];
    if (mainCountdown?.datetime) {
      next.weddingDatetime = mainCountdown.datetime;
    }
    if (countdownEvents[0]?.datetime) {
      next.bistonDatetime = countdownEvents[0].datetime;
    }
  }

  return next;
}

