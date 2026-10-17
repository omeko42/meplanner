export type TaskCategory =
  | 'Polri'
  | 'Gereja'
  | 'Kependudukan'
  | 'Kesehatan & Dokumen'
  | 'Acara'
  | 'Setelah Menikah'
  | 'Seserahan & Adat'
  | 'Vendor & Logistik';

export type TimelinePhase =
  | 'H-6 Bulan'
  | 'H-3 Bulan'
  | 'H-1 Bulan'
  | 'H-7'
  | 'Hari-H'
  | 'Setelah Menikah';

export type TaskStatus = 'BELUM' | 'PROSES' | 'SELESAI';

export type TaskPriority = 'Tinggi' | 'Sedang' | 'Rendah';

export type TaskOwner = 'Saya' | 'Calon' | 'Bersama' | 'Keluarga' | 'WO / Panitia';

export interface WeddingTask {
  id: string;
  category: TaskCategory;
  timelinePhase: TimelinePhase;
  title: string;
  due: string; // YYYY-MM-DD
  priority: TaskPriority;
  owner: TaskOwner;
  status: TaskStatus;
  notes: string;
  done: boolean;
  doneAt: string;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export type GuestType =
  | 'Pejabat/VIP'
  | 'Keluarga'
  | 'Rekan Kerja/Polri'
  | 'Teman/Sahabat'
  | 'Tetangga/Gereja';

export type GuestSide = 'Mempelai Pria' | 'Mempelai Wanita' | 'Bersama';

export type InvitationFormat =
  | 'Cetak Tebal'
  | 'Cetak Reguler'
  | 'Digital WA'
  | 'Cetak & Digital';

export type GuestPriority = 'P1 - VIP' | 'P2 - Utama' | 'P3 - Reguler';

export type DeliveryStatus =
  | 'Belum Disiapkan'
  | 'Siap Kirim'
  | 'Sudah Dikirim'
  | 'Sudah Diterima';

export type RsvpStatus =
  | 'Belum Konfirmasi'
  | 'Hadir'
  | 'Tidak Hadir'
  | 'Masih Ragu';

export type AttendanceStatus =
  | 'Belum Dicek'
  | 'Hadir di Lokasi'
  | 'Berhalangan';

export interface WeddingGuest {
  id: string;
  invitationCode: string; // e.g., INV-0001
  guestName: string;
  guestType: GuestType;
  side: GuestSide;
  institution: string;
  invitationFormat: InvitationFormat;
  priority: GuestPriority;
  cardQty: number;
  pax: number;
  confirmedPax?: number;
  phone: string;
  address: string;
  deliveryStatus: DeliveryStatus;
  rsvpStatus: RsvpStatus;
  attendanceStatus: AttendanceStatus;
  notes: string;
  wishes?: string;
  sessionChoice?: 'Biston & Pemberkatan' | 'Pemberkatan & Resepsi' | 'Resepsi Saja' | 'Semua Sesi';
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export interface GuestWish {
  id: string;
  guestId?: string;
  invitationCode?: string;
  guestName: string;
  institution?: string;
  relation: string;
  rsvpStatus: RsvpStatus;
  pax: number;
  message: string;
  createdAt: string;
  isPinned?: boolean;
  replyFromCouple?: string;
}

export type VendorCategory =
  | 'Gedung & Venue'
  | 'Katering & Jamuan'
  | 'Dekorasi & Lighting'
  | 'MUA & Busana'
  | 'Dokumentasi Foto & Video'
  | 'Cincin & Seserahan'
  | 'Hiburan & Musik'
  | 'Undangan & Souvenir'
  | 'Akomodasi & Transportasi'
  | 'Administrasi & Lainnya';

export type VendorPaymentStatus = 'BELUM_DP' | 'DP_TERBAYAR' | 'CICILAN' | 'LUNAS';

export interface BudgetVendorItem {
  id: string;
  category: VendorCategory;
  itemName: string;
  vendorName: string;
  vendorContact: string;
  pic: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
  paymentStatus: VendorPaymentStatus;
  dueDate: string; // YYYY-MM-DD
  notes: string;
  updatedAt: string;
}

export interface DigitalGiftAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  accountHolder: string;
  branchOrNote: string;
  type: 'BANK' | 'EWALLET' | 'QRIS';
}

export interface LoveStoryItem {
  id: string;
  dateLabel: string;
  title: string;
  location: string;
  description: string;
}

export interface GalleryPhotoItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  category: 'Prewedding' | 'Momen Bersama' | 'Persiapan & Sidang' | 'Venue Semarang';
}

export interface WeddingSettings {
  // Core Google Sheets Settings
  siteTitle: string;
  subtitle: string;
  weddingDatetime: string;
  bistonDatetime: string;
  timezone: string;
  autoRefreshSeconds: number;
  googleSheetId: string;
  googleSiteUrl: string;

  // Couple Profiles
  groomFullName: string;
  groomNickname: string;
  groomRankAndTitle: string;
  groomUnit: string;
  groomParents: string;
  groomOrigin: string;
  groomInstagram: string;
  groomPhotoUrl: string;

  brideFullName: string;
  brideNickname: string;
  brideTitle: string;
  brideParents: string;
  brideOrigin: string;
  brideInstagram: string;
  bridePhotoUrl: string;

  // Event 1: Biston / Acara Keluarga (18 Des 2026)
  event1Title: string;
  event1Subtitle: string;
  event1DateLabel: string;
  event1TimeLabel: string;
  event1Venue: string;
  event1Address: string;
  event1MapsUrl: string;
  event1Dresscode: string;

  // Event 2: Pemberkatan / Akad Pernikahan (19 Des 2026 Pagi)
  event2Title: string;
  event2Subtitle: string;
  event2DateLabel: string;
  event2TimeLabel: string;
  event2Venue: string;
  event2Address: string;
  event2MapsUrl: string;
  event2Dresscode: string;

  // Event 3: Resepsi Pernikahan (19 Des 2026 Siang/Malam)
  event3Title: string;
  event3Subtitle: string;
  event3DateLabel: string;
  event3TimeLabel: string;
  event3Venue: string;
  event3Address: string;
  event3MapsUrl: string;
  event3Dresscode: string;

  // Texts & Quotes
  quoteVerse: string;
  quoteSource: string;
  invitationOpeningText: string;
  invitationClosingText: string;

  // Digital Envelope / Gift
  giftRecipientName: string;
  giftShippingAddress: string;
  bankAccounts: DigitalGiftAccount[];

  // Love Story & Gallery
  loveStory: LoveStoryItem[];
  galleryPhotos: GalleryPhotoItem[];

  // Music
  musicTitle: string;
  musicArtist: string;

  updatedAt: string;
  updatedBy: string;
}

export type AdminRole =
  | 'MEMPELAI_PRIA'
  | 'MEMPELAI_WANITA'
  | 'KELUARGA_INTI'
  | 'KOORDINATOR_WO';

export interface AdminUser {
  id: string;
  username: string;
  nama: string;
  role: AdminRole;
  jabatan: string;
  email: string;
  password: string;
}

export interface WeddingDatabaseSchema {
  settings: WeddingSettings;
  tasks: WeddingTask[];
  guests: WeddingGuest[];
  wishes: GuestWish[];
  budgetItems: BudgetVendorItem[];
  adminUsers: AdminUser[];
  lastSyncedAt: string;
}
