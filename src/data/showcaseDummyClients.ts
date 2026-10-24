import {
  WeddingDatabaseSchema,
  WeddingSettings,
  WeddingTask,
  WeddingGuest,
  GuestWish,
  BudgetVendorItem,
  EventCategoryType,
  InvitationThemePresetId,
} from '@/types';
import { INITIAL_SETTINGS, INITIAL_ADMIN_USERS } from '@/data/seedData';
import { computeGuestInvitationHash } from '@/lib/guestTokenHash';

export type ShowcasePackageTier = 'STARTER' | 'EXCLUSIVE' | 'ROYAL VIP';

export interface ShowcaseDummyClientMeta {
  id: string;
  slug: string;
  eventType: EventCategoryType;
  themePreset: InvitationThemePresetId;
  themeLabel: string;
  badgeId: string;
  badgeEn: string;
  labelId: string;
  labelEn: string;
  coupleLabel: string;
  venueSummary: string;
  dateSummary: string;
  sampleGuestName: string;
  sampleHashToken: string;
}

export const SHOWCASE_DUMMY_CLIENT_METAS: ShowcaseDummyClientMeta[] = [
  {
    id: 'client-demo-wedding',
    slug: 'demo_wedding',
    eventType: 'WEDDING',
    themePreset: 'champagne_gold',
    themeLabel: 'Champagne Gold',
    badgeId: 'Undangan Pernikahan',
    badgeEn: 'The Wedding Celebration',
    labelId: '💍 Wedding (Rayhan & Clarissa)',
    labelEn: '💍 Wedding (Rayhan & Clarissa)',
    coupleLabel: 'Rayhan & Clarissa',
    venueSummary: 'Grand Ballroom Hotel Mulia Senayan, Jakarta',
    dateSummary: 'Sabtu, 24 Oktober 2026',
    sampleGuestName: 'Fiorencia & Partner',
    sampleHashToken: 'JHi4b3XgT2RQIDhZ9coLw',
  },
  {
    id: 'client-demo-birthday',
    slug: 'demo_birthday',
    eventType: 'BIRTHDAY',
    themePreset: 'blush_rose',
    themeLabel: 'Blush Rose',
    badgeId: 'Sweet 17th Birthday',
    badgeEn: 'Sweet 17th Soirée',
    labelId: '🎂 Birthday (Aurelia 17th)',
    labelEn: '🎂 Birthday (Aurelia 17th)',
    coupleLabel: 'Aurelia Valerie (17th)',
    venueSummary: 'The Glasshouse Ritz-Carlton Pacific Place',
    dateSummary: 'Minggu, 15 November 2026',
    sampleGuestName: 'Keluarga Besar Wijaya',
    sampleHashToken: 'B7k9Lm2pQx8vWz4nRt6Yu',
  },
  {
    id: 'client-demo-graduation',
    slug: 'demo_graduation',
    eventType: 'GRADUATION',
    themePreset: 'royal_navy',
    themeLabel: 'Royal Navy',
    badgeId: 'Syukuran Wisuda & Doktor',
    badgeEn: 'Doctoral Graduation',
    labelId: '🎓 Graduation (Dr. Bagaskara)',
    labelEn: '🎓 Graduation (Dr. Bagaskara)',
    coupleLabel: 'Dr. Bagaskara Putra, M.Sc.',
    venueSummary: 'Aula Barat ITB & Plataran Bandung',
    dateSummary: 'Sabtu, 28 November 2026',
    sampleGuestName: 'Prof. Dr. Hendra Gunawan',
    sampleHashToken: 'G4m8Np3sVy7xZa2cDf9Hj',
  },
  {
    id: 'client-demo-meeting',
    slug: 'demo_meeting',
    eventType: 'MEETING',
    themePreset: 'sage_botanical',
    themeLabel: 'Sage Botanical',
    badgeId: 'Rapat Kerja & Executive Forum',
    badgeEn: 'Executive Corporate Summit',
    labelId: '🏛️ Rapat / Corporate (Nusantara)',
    labelEn: '🏛️ Corporate (Nusantara Global)',
    coupleLabel: 'Rakornas Nusantara Global 2026',
    venueSummary: 'Raffles Hotel Grand Ballroom, Jakarta',
    dateSummary: 'Kamis, 3 Desember 2026',
    sampleGuestName: 'Direksi PT Mitra Energi',
    sampleHashToken: 'M9p2Qr6tWx3zBc8fHk5Ln',
  },
  {
    id: 'client-demo-gala',
    slug: 'demo_gala',
    eventType: 'GALA_DINNER',
    themePreset: 'terracotta_rust',
    themeLabel: 'Terracotta Rust',
    badgeId: '25th Anniversary Gala Dinner',
    badgeEn: '25th Anniversary Gala Dinner',
    labelId: '🥂 Gala Dinner (Wijaya Kusuma)',
    labelEn: '🥂 Gala Dinner (Wijaya Kusuma)',
    coupleLabel: 'Wijaya Kusuma 25th Gala',
    venueSummary: 'St. Regis Astor Ballroom, Jakarta',
    dateSummary: 'Jumat, 11 Desember 2026',
    sampleGuestName: 'Bapak/Ibu Komisaris Utama',
    sampleHashToken: 'V5x8Zb2dFg7jKm4pRs9Tw',
  },
];

export function isShowcaseDummyClientId(
  clientId?: string | null
): boolean {
  if (!clientId) return false;
  const clean = clientId.trim().toLowerCase();
  return SHOWCASE_DUMMY_CLIENT_METAS.some(
    (m) => m.id === clean || m.slug === clean || `client-${m.slug}` === clean
  );
}

export function resolveShowcaseDummyClientId(
  rawParam?: string | null
): string | null {
  if (!rawParam) return null;
  const clean = rawParam.trim().toLowerCase().replace(/-/g, '_');
  const found = SHOWCASE_DUMMY_CLIENT_METAS.find(
    (m) =>
      m.id.replace(/-/g, '_') === clean ||
      m.slug === clean ||
      `client_${m.slug}` === clean
  );
  return found ? found.id : null;
}

function buildDummyGuestsForClient(
  meta: ShowcaseDummyClientMeta
): WeddingGuest[] {
  const rawList: Array<{
    name: string;
    inst: string;
    type: WeddingGuest['guestType'];
    prio: WeddingGuest['priority'];
    pax: number;
    rsvp: WeddingGuest['rsvpStatus'];
    token?: string;
  }> = [
    {
      name: meta.sampleGuestName,
      inst: 'Tamu Kehormatan VVIP',
      type: 'Pejabat/VIP',
      prio: 'P1 - VIP',
      pax: 2,
      rsvp: 'Hadir',
      token: meta.sampleHashToken,
    },
    {
      name: 'Irjen Pol. (Purn.) Drs. Hendrawan Dirgantara & Ibu',
      inst: 'Keluarga Kehormatan Jakarta',
      type: 'Pejabat/VIP',
      prio: 'P1 - VIP',
      pax: 4,
      rsvp: 'Hadir',
    },
    {
      name: 'Prof. dr. Haryanto Kusuma, Sp.JP(K) & Keluarga',
      inst: 'RSUPN Dr. Cipto Mangunkusumo',
      type: 'Keluarga',
      prio: 'P1 - VIP',
      pax: 3,
      rsvp: 'Hadir',
    },
    {
      name: 'Kombes Pol. Aditya Pratama, S.I.K., M.Si.',
      inst: 'Polda Metro Jaya',
      type: 'Rekan Kerja/Polri',
      prio: 'P1 - VIP',
      pax: 2,
      rsvp: 'Hadir',
    },
    {
      name: 'dr. Nadia Maharani, Sp.A & Partner',
      inst: 'Sahabat Alumni FK UI',
      type: 'Teman/Sahabat',
      prio: 'P2 - Utama',
      pax: 2,
      rsvp: 'Hadir',
    },
    {
      name: 'Bapak Alexander Tanuwijaya & Ibu',
      inst: 'Board of Directors Nusantara Group',
      type: 'Pejabat/VIP',
      prio: 'P1 - VIP',
      pax: 2,
      rsvp: 'Belum Konfirmasi',
    },
    {
      name: 'Keluarga Besar Bapak Surya Atmaja',
      inst: 'Kerabat Bandung',
      type: 'Keluarga',
      prio: 'P2 - Utama',
      pax: 4,
      rsvp: 'Hadir',
    },
    {
      name: 'Clarissa Devina & Rekan',
      inst: 'Divisi Korporat & Legal',
      type: 'Teman/Sahabat',
      prio: 'P3 - Reguler',
      pax: 2,
      rsvp: 'Belum Konfirmasi',
    },
  ];

  return rawList.map((item, idx) => {
    const id = `gst_${meta.slug}_${idx + 1}`;
    const code = `INV-${String(idx + 1).padStart(4, '0')}`;
    const token =
      item.token ||
      computeGuestInvitationHash(meta.id, {
        id,
        invitationCode: code,
        guestName: item.name,
      });
    return {
      id,
      invitationCode: code,
      invitationToken: token,
      guestName: item.name,
      guestType: item.type,
      side: idx % 2 === 0 ? 'Mempelai Pria' : 'Mempelai Wanita',
      institution: item.inst,
      invitationFormat: idx < 4 ? 'Cetak Tebal' : 'Online',
      priority: item.prio,
      cardQty: idx < 4 ? 1 : 0,
      pax: item.pax,
      confirmedPax: item.rsvp === 'Hadir' ? item.pax : 0,
      phone: `0812889900${idx + 10}`,
      address: 'Jakarta Selatan',
      deliveryStatus: 'Sudah Dikirim',
      rsvpStatus: item.rsvp,
      attendanceStatus: 'Belum Dicek',
      notes: `Kode Hash Unik: ${token}`,
      sessionChoice: 'Semua Sesi',
      createdAt: '2026-10-18',
      updatedAt: '2026-10-24',
      updatedBy: 'demo_manager',
    };
  });
}

function buildDummyTasksForClient(slug: string): WeddingTask[] {
  const items: Array<{
    cat: WeddingTask['category'];
    phase: WeddingTask['timelinePhase'];
    title: string;
    owner: WeddingTask['owner'];
    done: boolean;
  }> = [
    {
      cat: 'Acara',
      phase: 'H-6 Bulan',
      title: 'Penetapan Tanggal Utama & Booking Grand Ballroom',
      owner: 'Bersama',
      done: true,
    },
    {
      cat: 'Vendor & Logistik',
      phase: 'H-6 Bulan',
      title: 'Kontrak Vendor Dekorasi, Dokumentasi 4K & Katering VIP',
      owner: 'WO / Panitia',
      done: true,
    },
    {
      cat: 'Kependudukan',
      phase: 'H-3 Bulan',
      title: 'Penyelesaian Berkas Administrasi & Perizinan Acara',
      owner: 'Saya',
      done: true,
    },
    {
      cat: 'Acara',
      phase: 'H-3 Bulan',
      title: 'Sesi Pemotretan Potret Utama & Penyusunan Galeri HD',
      owner: 'Bersama',
      done: true,
    },
    {
      cat: 'Vendor & Logistik',
      phase: 'H-1 Bulan',
      title: 'Finalisasi Daftar Tamu VVIP & Generate Kode Hash Undangan',
      owner: 'Keluarga',
      done: true,
    },
    {
      cat: 'Acara',
      phase: 'H-1 Bulan',
      title: 'Technical Meeting Seluruh Vendor & Gladi Bersih Rundown',
      owner: 'WO / Panitia',
      done: true,
    },
    {
      cat: 'Vendor & Logistik',
      phase: 'H-7',
      title: 'Distribusi Link Undangan Digital Hash Token via WhatsApp',
      owner: 'Saya',
      done: true,
    },
    {
      cat: 'Acara',
      phase: 'Hari-H',
      title: 'Koordinasi Registrasi QR / Hash Gate & Penyambutan VVIP',
      owner: 'WO / Panitia',
      done: false,
    },
  ];

  return items.map((t, i) => ({
    id: `tsk_${slug}_${i + 1}`,
    category: t.cat,
    timelinePhase: t.phase,
    title: t.title,
    due: '2026-10-24',
    priority: i < 4 ? 'Tinggi' : 'Sedang',
    owner: t.owner,
    status: t.done ? 'SELESAI' : 'PROSES',
    notes: 'Data simulasi workspace MEPlan',
    done: t.done,
    doneAt: t.done ? '2026-10-20' : '',
    createdAt: '2026-10-18',
    updatedAt: '2026-10-24',
    updatedBy: 'demo_manager',
  }));
}

function buildDummyBudgetForClient(slug: string): BudgetVendorItem[] {
  return [
    {
      id: `bdg_${slug}_1`,
      category: 'Gedung & Venue',
      itemName: 'Sewa Grand Ballroom & VIP Lounge',
      vendorName: 'Hotel Mulia / Ritz-Carlton Venue',
      vendorContact: '021-5747777',
      pic: 'Koordinator WO',
      estimatedCost: 65000000,
      actualCost: 60000000,
      paidAmount: 60000000,
      paymentStatus: 'LUNAS',
      dueDate: '2026-10-01',
      notes: 'Lunas 100% (Hemat Rp 5 Jt)',
      updatedAt: '2026-10-24',
    },
    {
      id: `bdg_${slug}_2`,
      category: 'Katering & Jamuan',
      itemName: 'Fine Dining & Buffet VIP 400 Pax',
      vendorName: 'Royal Culinary Catering',
      vendorContact: '08119002233',
      pic: 'Keluarga',
      estimatedCost: 55000000,
      actualCost: 52000000,
      paidAmount: 40000000,
      paymentStatus: 'DP_TERBAYAR',
      dueDate: '2026-10-15',
      notes: 'DP 77% Terbayar',
      updatedAt: '2026-10-24',
    },
    {
      id: `bdg_${slug}_3`,
      category: 'Dekorasi & Lighting',
      itemName: 'Dekorasi Floral Editorial & Ambience Lighting',
      vendorName: 'Lumina Atelier Decor',
      vendorContact: '081233445566',
      pic: 'Koordinator WO',
      estimatedCost: 25000000,
      actualCost: 22500000,
      paidAmount: 22500000,
      paymentStatus: 'LUNAS',
      dueDate: '2026-10-10',
      notes: 'Lunas',
      updatedAt: '2026-10-24',
    },
    {
      id: `bdg_${slug}_4`,
      category: 'Dokumentasi Foto & Video',
      itemName: 'Tim Sinematografi 4K & Fotografi Editorial',
      vendorName: 'Velvet Frame Pictures',
      vendorContact: '081388776655',
      pic: 'Host Utama',
      estimatedCost: 15000000,
      actualCost: 14000000,
      paidAmount: 10000000,
      paymentStatus: 'DP_TERBAYAR',
      dueDate: '2026-10-18',
      notes: 'Sisa pelunasan H-7',
      updatedAt: '2026-10-24',
    },
  ];
}

function buildDummyWishesForClient(
  meta: ShowcaseDummyClientMeta
): GuestWish[] {
  return [
    {
      id: `wsh_${meta.slug}_1`,
      invitationCode: meta.sampleHashToken,
      guestName: meta.sampleGuestName,
      institution: 'Tamu Kehormatan VVIP',
      relation: 'Pejabat/VIP',
      rsvpStatus: 'Hadir',
      sessionChoice: 'Semua Sesi',
      pax: 2,
      message: `Selamat & sukses untuk acara ${meta.coupleLabel}! Semoga seluruh rangkaian berjalan lancar, penuh sukacita, dan membawa keberkahan yang melimpah.`,
      createdAt: '2026-10-24T10:15:00.000Z',
      isPinned: true,
      replyFromCouple: `Terima kasih banyak ${meta.sampleGuestName} atas doa dan konfirmasi kehadirannya! Kami sangat menantikan kehadiran Anda.`,
      moderationStatus: 'APPROVED',
    },
    {
      id: `wsh_${meta.slug}_2`,
      invitationCode: 'INV-0002',
      guestName: 'Irjen Pol. (Purn.) Drs. Hendrawan Dirgantara & Ibu',
      institution: 'Keluarga Kehormatan Jakarta',
      relation: 'Keluarga',
      rsvpStatus: 'Hadir',
      sessionChoice: 'Semua Sesi',
      pax: 4,
      message:
        'Doa terbaik dari kami sekeluarga. Semoga menjadi momen bersejarah yang penuh kebahagiaan dan diberkati senantiasa.',
      createdAt: '2026-10-24T09:30:00.000Z',
      isPinned: false,
      replyFromCouple:
        'Terima kasih sebesar-besarnya atas doa restu Bapak & Ibu sekeluarga.',
      moderationStatus: 'APPROVED',
    },
    {
      id: `wsh_${meta.slug}_3`,
      invitationCode: 'INV-0005',
      guestName: 'dr. Nadia Maharani, Sp.A & Partner',
      institution: 'Sahabat Alumni',
      relation: 'Teman/Sahabat',
      rsvpStatus: 'Hadir',
      sessionChoice: 'Semua Sesi',
      pax: 2,
      message:
        'Undangan digitalnya sangat elegan dan praktis! Kami pasti hadir tepat waktu.',
      createdAt: '2026-10-24T08:45:00.000Z',
      isPinned: false,
      moderationStatus: 'APPROVED',
    },
  ];
}

export function getShowcaseDummyClientState(
  clientIdOrSlug: string,
  tier: ShowcasePackageTier = 'ROYAL VIP'
): WeddingDatabaseSchema {
  const resolvedId =
    resolveShowcaseDummyClientId(clientIdOrSlug) || 'client-demo-wedding';
  const meta =
    SHOWCASE_DUMMY_CLIENT_METAS.find((m) => m.id === resolvedId) ||
    SHOWCASE_DUMMY_CLIENT_METAS[0];

  const isWedding = meta.eventType === 'WEDDING';

  const imgCover1 =
    meta.eventType === 'WEDDING'
      ? 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85'
      : meta.eventType === 'BIRTHDAY'
        ? 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1400&q=85'
        : meta.eventType === 'GRADUATION'
          ? 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1400&q=85'
          : meta.eventType === 'MEETING'
            ? 'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1400&q=85'
            : 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1400&q=85';

  const imgHero1 =
    meta.eventType === 'WEDDING'
      ? 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1600&q=85'
      : meta.eventType === 'BIRTHDAY'
        ? 'https://images.unsplash.com/photo-1464349153735-7db50ed83c84?auto=format&fit=crop&w=1600&q=85'
        : meta.eventType === 'GRADUATION'
          ? 'https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=1600&q=85'
          : meta.eventType === 'MEETING'
            ? 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=1600&q=85'
            : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1600&q=85';

  const imgPage1 =
    'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=1600&q=85';
  const imgAlt2 =
    'https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&w=1400&q=85';
  const imgAlt3 =
    'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?auto=format&fit=crop&w=1400&q=85';

  const slideLimit = tier === 'STARTER' ? 1 : tier === 'EXCLUSIVE' ? 2 : 3;

  const fullCoverSlides = [
    { id: 'cs_1', imageUrl: imgCover1, title: 'Cover Utama' },
    { id: 'cs_2', imageUrl: imgAlt2, title: 'Cover Slide 2' },
    { id: 'cs_3', imageUrl: imgAlt3, title: 'Cover Slide 3' },
  ].slice(0, slideLimit);

  const fullHeroSlides = [
    { id: 'hs_1', imageUrl: imgHero1, title: 'Hero Utama' },
    { id: 'hs_2', imageUrl: imgCover1, title: 'Hero Slide 2' },
    { id: 'hs_3', imageUrl: imgAlt2, title: 'Hero Slide 3' },
  ].slice(0, slideLimit);

  const fullPageSlides = [
    { id: 'ps_1', imageUrl: imgPage1, title: 'Wallpaper Utama' },
    { id: 'ps_2', imageUrl: imgAlt3, title: 'Wallpaper Slide 2' },
    { id: 'ps_3', imageUrl: imgCover1, title: 'Wallpaper Slide 3' },
  ].slice(0, slideLimit);

  const allBankAccounts: NonNullable<WeddingSettings['bankAccounts']> = [
    {
      id: 'ba_demo_1',
      type: 'BANK',
      bankName: 'Bank Central Asia (BCA)',
      accountNumber: '8720991827',
      accountHolder: meta.coupleLabel,
      branchOrNote: 'KCP Senayan Jakarta',
    },
    {
      id: 'ba_demo_2',
      type: 'EWALLET',
      bankName: 'QRIS / GoPay / OVO Nasional',
      accountNumber: '0812-8899-0010',
      accountHolder: meta.coupleLabel,
      branchOrNote: 'E-Wallet & QRIS Nasional',
    },
    {
      id: 'ba_demo_3',
      type: 'PAYPAL',
      bankName: 'PayPal International (USD / EUR / SGD)',
      accountNumber: 'https://paypal.me/meplandemo',
      accountHolder: `${meta.coupleLabel} Official`,
      branchOrNote: 'International Gift Transfer',
    },
    {
      id: 'ba_demo_4',
      type: 'CRYPTO',
      bankName: 'Tether USDT (TRC20 / ERC20 / BEP20)',
      accountNumber: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
      accountHolder: `${meta.coupleLabel} Web3 Vault`,
      branchOrNote: 'Jaringan TRON (TRC20)',
      cryptoNetwork: 'TRON (TRC20)',
    },
  ];

  const filteredBankAccounts =
    tier === 'STARTER'
      ? allBankAccounts.slice(0, 2)
      : tier === 'EXCLUSIVE'
        ? allBankAccounts.slice(0, 2)
        : allBankAccounts;

  const settings: WeddingSettings = {
    ...INITIAL_SETTINGS,
    siteTitle: `MEPlan • ${meta.coupleLabel}`,
    activeClientId: meta.id,
    eventType: meta.eventType,
    themePreset: meta.themePreset,
    showFloralOrnaments: meta.eventType !== 'MEETING',
    showFloatingPetals: meta.eventType !== 'MEETING',
    showSaveToCalendarButton: true,
    showSecondProfile: isWedding,
    profileFrameStyle:
      meta.eventType === 'WEDDING'
        ? 'ARCH_DOME'
        : meta.eventType === 'BIRTHDAY'
          ? 'CIRCLE'
          : 'EDITORIAL_RECT',
    coverBadgeText: meta.badgeId,
    groomFullName: isWedding
      ? 'AKP Rayhan Dirgantara, S.Tr.K., S.I.K.'
      : meta.coupleLabel,
    groomNickname: isWedding ? 'Rayhan' : meta.coupleLabel.split(' ')[0],
    groomRankAndTitle: isWedding ? 'Mempelai Pria' : meta.badgeId,
    groomUnit: isWedding ? 'Bareskrim Polri' : meta.venueSummary,
    groomOrigin: 'Jakarta',
    groomParents: isWedding
      ? 'Putra Pertama dari Bapak Irjen Pol. (Purn.) Drs. Hendrawan Dirgantara & Ibu Hj. Ratna Kusuma'
      : 'Keluarga Besar & Penyelenggara Utama',
    groomPhotoUrl:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=85',
    brideFullName: isWedding ? 'dr. Clarissa Aurelia Putri, Sp.DV' : '-',
    brideNickname: isWedding ? 'Clarissa' : '',
    brideTitle: 'Mempelai Wanita',
    brideOrigin: 'Bandung',
    brideParents: isWedding
      ? 'Putri Kedua dari Bapak Prof. dr. Haryanto Kusuma, Sp.JP(K) & Ibu drg. Sylvia Anggraini'
      : '-',
    bridePhotoUrl:
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=85',
    coverBgUrl: imgCover1,
    heroPrewedUrl: imgHero1,
    pageBgUrl: imgPage1,
    coverSlides: fullCoverSlides,
    heroSlides: fullHeroSlides,
    pageSlides: fullPageSlides,
    event1Title: isWedding ? 'Akad / Pemberkatan Suci' : 'Sesi Pembuka & Sambutan',
    event1DateLabel: meta.dateSummary,
    event1TimeLabel: '09.00 - 11.00 WIB',
    event1Venue: meta.venueSummary,
    event1Address: 'Jl. Asia Afrika, Senayan, Jakarta Pusat',
    event2Title: isWedding ? 'Resepsi Malam Kehormatan' : 'Puncak Acara & Gala Jamuan',
    event2DateLabel: meta.dateSummary,
    event2TimeLabel: '18.30 - 21.30 WIB',
    event2Venue: meta.venueSummary,
    event2Address: 'Jl. Asia Afrika, Senayan, Jakarta Pusat',
    scheduleEvents: [
      {
        id: `ev_${meta.slug}_1`,
        badge: 'SESI 1 • UTAMA',
        title: isWedding ? 'Pemberkatan / Akad Nikah' : 'Registrasi VVIP & Sesi Utama',
        subtitle: 'Prosesi Khidmat & Doa Bersama',
        dateLabel: meta.dateSummary,
        timeLabel: '09.00 - 11.00 WIB',
        datetime: '2026-10-24T09:00:00+07:00',
        venue: meta.venueSummary,
        address: 'Jl. Asia Afrika, Senayan, Jakarta Pusat',
        mapsUrl: 'https://maps.google.com',
        dresscode: 'Formal / Batik Eksekutif',
        enableCountdown: true,
        showOnInvitation: true,
      },
      {
        id: `ev_${meta.slug}_2`,
        badge: 'SESI 2 • RESEPSI / GALA',
        title: isWedding ? 'Resepsi & Jamuan Kehormatan' : 'Malam Puncak & Ramah Tamah',
        subtitle: 'Perjamuan Eksklusif Tamu Kehormatan',
        dateLabel: meta.dateSummary,
        timeLabel: '18.30 - 21.30 WIB',
        datetime: '2026-10-24T18:30:00+07:00',
        venue: meta.venueSummary,
        address: 'Jl. Asia Afrika, Senayan, Jakarta Pusat',
        mapsUrl: 'https://maps.google.com',
        dresscode: 'Black Tie / Gaun Malam / Jas Formal',
        enableCountdown: true,
        showOnInvitation: true,
      },
    ],
    showLoveStorySection: tier !== 'STARTER',
    showGallerySection: tier !== 'STARTER',
    musicAutoplay: tier !== 'STARTER',
    showPhysicalGiftAddress: tier !== 'STARTER',
    bankAccounts: filteredBankAccounts,
    giftRecipientName: meta.coupleLabel,
    giftShippingNote: 'Kontak Penerima: 0812-8899-0010',
    giftShippingAddress:
      'Residence One Senayan Tower A Lt. 18, Kebayoran Baru, Jakarta Selatan 12190',
    loveStory: [
      {
        id: 'ls_1',
        dateLabel: '2022',
        title: isWedding ? 'Pertemuan Pertama' : 'Awal Perjalanan & Visi',
        location: 'Jakarta',
        description:
          'Sebuah awal yang penuh makna dan menjadi fondasi kuat menuju pencapaian hari bahagia ini.',
      },
      {
        id: 'ls_2',
        dateLabel: '2024',
        title: isWedding ? 'Komitmen Bersama' : 'Dedikasi & Pencapaian Utama',
        location: 'Bandung',
        description:
          'Melalui kerja keras, doa, dan dukungan penuh keluarga besar hingga tiba di titik bersejarah.',
      },
      {
        id: 'ls_3',
        dateLabel: 'Oktober 2026',
        title: isWedding ? 'Ikatan Janji Suci' : 'Perayaan Puncak Kehormatan',
        location: 'Jakarta',
        description:
          'Merayakan momen istimewa bersama seluruh keluarga, sahabat, dan tamu kehormatan.',
      },
    ],
    galleryPhotos: [
      {
        id: 'gp_1',
        title: 'Editorial Portrait I',
        caption: 'Potret utama dalam balutan cahaya keemasan.',
        imageUrl: imgCover1,
        category: 'Highlight',
      },
      {
        id: 'gp_2',
        title: 'Editorial Portrait II',
        caption: 'Momen kebersamaan yang abadi.',
        imageUrl: imgHero1,
        category: 'Highlight',
      },
      {
        id: 'gp_3',
        title: 'Editorial Portrait III',
        caption: 'Keanggunan dalam setiap langkah.',
        imageUrl: imgAlt2,
        category: 'Exclusive',
      },
      {
        id: 'gp_4',
        title: 'Editorial Portrait IV',
        caption: 'Simfoni kebahagiaan dan doa restu.',
        imageUrl: imgAlt3,
        category: 'Exclusive',
      },
    ],
    updatedAt: '2026-10-24T12:00:00.000Z',
    updatedBy: 'demo_showcase',
  };

  const allGuests = buildDummyGuestsForClient(meta);
  const allTasks = buildDummyTasksForClient(meta.slug);
  const allBudget = buildDummyBudgetForClient(meta.slug);
  const allWishes = buildDummyWishesForClient(meta);

  return {
    settings,
    tasks: allTasks,
    guests: tier === 'STARTER' ? allGuests.slice(0, 4) : allGuests,
    wishes: allWishes,
    budgetItems: tier === 'STARTER' ? [] : allBudget,
    adminUsers: INITIAL_ADMIN_USERS,
    lastSyncedAt: '2026-10-24T12:00:00.000Z',
  };
}
