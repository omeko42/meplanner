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
  | 'Cetak Biasa'
  | 'Online'
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
  revisionNote?: string;
  revisionCount?: number;
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

export interface PhotoAdjustment {
  zoom: number; // 0.4 to 4.0 (default 1)
  x: number; // -150 to 150 (negative = left, positive = right)
  y: number; // -150 to 150 (negative = up, positive = down)
  rotation?: number; // 0, 90, 180, 270
  flipX?: boolean;
  fitMode?: 'cover' | 'contain';
  aspectRatio?: 'auto' | '1:1' | '16:9' | '4:3' | '3:4' | '9:16' | 'free';
  cropBox?: {
    x: number; // 0 to 100 (% from left of stage)
    y: number; // 0 to 100 (% from top of stage)
    w: number; // 10 to 100 (% width of stage)
    h: number; // 10 to 100 (% height of stage)
  };
  baked?: boolean;
}

export interface GalleryPhotoItem {
  id: string;
  title: string;
  caption: string;
  imageUrl: string;
  originalImageUrl?: string;
  category: string;
  adjustment?: PhotoAdjustment;
}

export interface WeddingScheduleEvent {
  id: string;
  title: string;
  badge: string;
  subtitle: string;
  datetime: string; // ISO string e.g. '2026-12-19T09:00:00+07:00' for Countdown
  dateLabel: string; // e.g. 'Sabtu, 19 Desember 2026'
  timeLabel: string; // e.g. '09.00 WIB - Selesai'
  venue: string;
  address: string;
  mapsUrl: string;
  dresscode: string;
  enableCountdown: boolean; // Switch ON/OFF for Countdown
  showOnInvitation?: boolean; // Switch ON/OFF for visibility on invitation
}

export interface WeddingSettings {
  // Core Settings
  siteTitle: string;
  subtitle: string;
  weddingDatetime: string;
  bistonDatetime: string;
  timezone: string;
  autoRefreshSeconds: number;
  googleSheetId: string;
  googleSiteUrl: string;

  // Dynamic Schedule Events (Add/Edit/Delete like Panitia + Countdown Switch ON/OFF)
  scheduleEvents?: WeddingScheduleEvent[];

  // Budget Target / Cap (Editable / Revisable)
  totalBudgetCap: number;

  // Section Visibility Toggles on Public Invitation
  showCoupleSection: boolean;
  showQuoteSection: boolean;
  showEvent1: boolean;
  showEvent2: boolean;
  showEvent3: boolean;
  showLoveStorySection: boolean;
  showGallerySection: boolean;
  showRsvpSection: boolean;
  showGiftSection: boolean;

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

  // Event 1: Biston / Acara Keluarga
  event1Title: string;
  event1Subtitle: string;
  event1DateLabel: string;
  event1TimeLabel: string;
  event1Venue: string;
  event1Address: string;
  event1MapsUrl: string;
  event1Dresscode: string;

  // Event 2: Pemberkatan / Akad Pernikahan
  event2Title: string;
  event2Subtitle: string;
  event2DateLabel: string;
  event2TimeLabel: string;
  event2Venue: string;
  event2Address: string;
  event2MapsUrl: string;
  event2Dresscode: string;

  // Event 3: Resepsi Pernikahan
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

  // Global Default WhatsApp Invitation Templates (VIP/Pejabat & Regular/Umum)
  waTemplateVip?: string;
  waTemplateRegular?: string;

  // Digital Envelope / Gift
  giftRecipientName: string;
  giftShippingAddress: string;
  qrisImageUrl?: string;
  showQrisButton?: boolean;
  bankAccounts: DigitalGiftAccount[];

  // Love Story & Gallery
  loveStory: LoveStoryItem[];
  galleryPhotos: GalleryPhotoItem[];
  gallerySectionSubtitle?: string;
  gallerySectionTitle?: string;

  // Custom Background & Theme Settings
  coverBgUrl?: string;
  heroPrewedUrl?: string;
  pageBgUrl?: string;
  bgOverlayOpacity?: number; // 40 to 95 (percentage of bright pearl overlay)
  bgBlurIntensity?: 'none' | 'sm' | 'md' | 'lg';
  themePreset?: 'pearl-champagne' | 'ivory-rose' | 'sage-garden' | 'royal-navy';

  // Photo Zoom & Pan Adjustments for Couple, Backgrounds, etc.
  photoAdjustments?: {
    groomPhotoUrl?: PhotoAdjustment;
    bridePhotoUrl?: PhotoAdjustment;
    coverBgUrl?: PhotoAdjustment;
    heroPrewedUrl?: PhotoAdjustment;
    pageBgUrl?: PhotoAdjustment;
  };

  // Uncropped Original Photos for Non-Destructive Re-Cropping
  originalPhotos?: {
    groomPhotoUrl?: string;
    bridePhotoUrl?: string;
    coverBgUrl?: string;
    heroPrewedUrl?: string;
    pageBgUrl?: string;
  };

  // Music & Playlist
  musicTitle: string;
  musicArtist: string;
  musicPlaylist?: MusicTrackItem[];
  activeMusicTrackId?: string;
  musicVolume?: number; // 0 to 100 (default 75)
  musicAutoplay?: boolean; // default true

  updatedAt: string;
  updatedBy: string;
}

export interface MusicTrackItem {
  id: string;
  title: string;
  artist: string;
  url: string; // 'synth:canon-in-d' | 'synth:thousand-years' | 'synth:beautiful-in-white' | data:audio/... | https://...
  isDefault?: boolean;
}

export type AdminRole =
  | 'SUPERADMIN'
  | 'MEMPELAI_PRIA'
  | 'MEMPELAI_WANITA'
  | 'KELUARGA_PRIA'
  | 'KELUARGA_WANITA'
  | 'PANITIA';

export interface AdminUser {
  id: string;
  username: string;
  nama: string;
  role: AdminRole;
  jabatan: string;
  email: string;
  isDefaultUser?: boolean;
  password?: string;
  passwordHash?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  module:
    | 'MEMPELAI'
    | 'CHECKLIST'
    | 'TAMU'
    | 'DOA_RSVP'
    | 'MONETER'
    | 'KEAMANAN'
    | 'DATABASE'
    | 'MUSIK_PLAYLIST'
    | 'JADWAL_ACARA'
    | 'VISIBILITAS'
    | 'KISAH_KASIH'
    | 'FOTO_TEMA'
    | 'GALERI_FOTO'
    | 'AMPLOP_DIGITAL'
    | 'KEAMANAN_AKUN'
    | 'AKUN_PANITIA'
    | 'GOOGLE_SHEETS'
    | 'BACKUP_JSON'
    | 'KONFIRMASI_AKSI'
    | string;
  action: 'TAMBAH' | 'EDIT' | 'HAPUS' | 'SIMPAN' | 'SYNC' | 'RESET' | 'ERROR';
  status: 'SUCCESS' | 'ERROR' | 'WARNING';
  summary: string;
  detail?: string;
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

