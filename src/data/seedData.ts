import {
  WeddingSettings,
  WeddingTask,
  WeddingGuest,
  GuestWish,
  BudgetVendorItem,
  AdminUser,
  TimelinePhase,
  CommercialPaymentChannel,
} from '@/types';

export const DEFAULT_COMMERCIAL_PAYMENT_CHANNELS: CommercialPaymentChannel[] = [
  {
    id: 'ch-qris-id',
    category: 'QRIS',
    marketScope: 'ID',
    providerName: 'QRIS Nasional (All Bank & E-Wallet Indonesia)',
    accountOrWalletAddress: 'NMID: My Wedding Manager Indonesia',
    accountHolder: 'My Wedding Manager (Eko Agung K.)',
    networkOrBranch: 'M-Banking, GoPay, OVO, DANA, ShopeePay, LinkAja',
    qrCodeImageUrl: '',
    minAmountNote: 'Mulai Rp 50.000',
    instructions:
      'Scan QRIS resmi atau transfer sesuai nominal paket yang dipilih, lalu masukkan nomor referensi transaksi pada langkah verifikasi.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-bca-id',
    category: 'BANK_TRANSFER',
    marketScope: 'ID',
    providerName: 'Transfer Bank Nasional (BCA / Mandiri / BRI / BNI)',
    accountOrWalletAddress: 'BCA / Mandiri / BRI / BNI (Hubungi Admin / Sesuai Invoice)',
    accountHolder: 'Eko Agung Krisdianto',
    networkOrBranch: 'Transfer Bank IDR (Real-Time / BI-FAST)',
    minAmountNote: 'Mulai Rp 50.000',
    instructions:
      'Transfer tepat sesuai nominal paket (Rp 50.000 / Rp 299.000 / Rp 599.000) dan cantumkan Nama Pasangan di berita transfer.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-card-global',
    category: 'CREDIT_CARD',
    marketScope: 'BOTH',
    providerName: 'Visa / Mastercard / JCB / Apple Pay',
    accountOrWalletAddress: 'Official Card Checkout Gateway (PayPal NCP)',
    accountHolder: 'My Wedding Manager (@omeko11)',
    networkOrBranch: 'Visa, Mastercard, Amex, JCB & Debit Online',
    checkoutUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
    qrCodeImageUrl: '/paypal-qr-mwm.png',
    minAmountNote: 'Mulai Rp 50.000 / $10 USD',
    instructions:
      'Klik tombol Checkout Kartu Kredit/Debit untuk menyelesaikan pembayaran aman via gateway Visa/Mastercard resmi.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-paypal-global',
    category: 'PAYPAL',
    marketScope: 'BOTH',
    providerName: 'PayPal International (Official Merchant)',
    accountOrWalletAddress: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
    accountHolder: 'My Wedding Manager (Eko Agung Krisdianto)',
    networkOrBranch: 'PayPal Balance / International Cards (USD)',
    checkoutUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
    qrCodeImageUrl: '/paypal-qr-mwm.png',
    minAmountNote: 'Min. $10 USD',
    instructions:
      'Scan QR Code PayPal resmi di bawah atau klik tombol PayPal Checkout, lalu catat Transaction ID PayPal Anda.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-usdt-trc20',
    category: 'CRYPTO',
    marketScope: 'BOTH',
    providerName: 'USDT (Tether) — Jaringan TRC20 (Tron)',
    accountOrWalletAddress: 'Atur Alamat Wallet USDT TRC20 di Menu Superadmin',
    accountHolder: 'MWM Crypto Treasury (TRC20)',
    networkOrBranch: 'TRC20 (Tron Network)',
    minAmountNote: 'Min. Transfer 10 USDT',
    instructions:
      'Kirim USDT HANYA melalui jaringan TRC20 (Tron). Setelah transaksi berstatus Confirmed, masukkan TXID / Hash transaksi di bawah.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-usdt-bep20',
    category: 'CRYPTO',
    marketScope: 'BOTH',
    providerName: 'USDT (Tether) — Jaringan BEP20 (BNB Smart Chain)',
    accountOrWalletAddress: 'Atur Alamat Wallet USDT BEP20 di Menu Superadmin',
    accountHolder: 'MWM Crypto Treasury (BEP20)',
    networkOrBranch: 'BEP20 (BNB Smart Chain / BSC)',
    minAmountNote: 'Min. Transfer 10 USDT',
    instructions:
      'Kirim USDT HANYA melalui jaringan BEP20 (BNB Smart Chain). Setelah transaksi berstatus Confirmed, masukkan TXID / Hash transaksi di bawah.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
];

export function inferTimelinePhase(due: string, category: string): TimelinePhase {
  if (category === 'Setelah Menikah' || due >= '2026-12-20') {
    return 'Setelah Menikah';
  }
  if (due === '2026-12-18' || due === '2026-12-19') {
    return 'Hari-H';
  }
  if (due >= '2026-12-01' && due <= '2026-12-17') {
    return 'H-7';
  }
  if (due >= '2026-11-01' && due <= '2026-11-30') {
    return 'H-1 Bulan';
  }
  if (due >= '2026-09-01' && due <= '2026-10-31') {
    return 'H-3 Bulan';
  }
  return 'H-6 Bulan';
}

export const INITIAL_SETTINGS: WeddingSettings = {
  siteTitle: 'My Wedding Manager',
  subtitle:
    'Biston: 17 Desember 2026 • Pemberkatan Nikah: 19 Desember 2026 • Resepsi: 19 Desember 2026 • Semarang',
  weddingDatetime: '2026-12-19T07:00:00+07:00',
  bistonDatetime: '2026-12-17T18:00:00+07:00',
  timezone: 'Asia/Jakarta',
  autoRefreshSeconds: 120,
  googleSheetId: '',
  googleSiteUrl: '',

  totalBudgetCap: 0,

  showCoupleSection: true,
  showQuoteSection: true,
  showEvent1: true,
  showEvent2: true,
  showEvent3: true,
  showLoveStorySection: false,
  showGallerySection: true,
  showRsvpSection: true,
  showGiftSection: true,

  groomFullName: 'Briptu Eko Agung Krisdianto, S.Kom.',
  groomNickname: 'Eko',
  groomRankAndTitle: 'Mempelai Pria',
  groomUnit: '',
  groomParents: 'Putra dari Bapak ... & Ibu ...',
  groomOrigin: 'Semarang',
  groomInstagram: '',
  groomPhotoUrl:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',

  brideFullName: 'Sero Nelci Agustina',
  brideNickname: 'Selo',
  brideTitle: 'Mempelai Wanita',
  brideParents: 'Putri dari Bapak ... & Ibu ...',
  brideOrigin: 'Jakarta',
  brideInstagram: '',
  bridePhotoUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',

  coverBgUrl:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85',
  heroPrewedUrl:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85',
  pageBgUrl:
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=80',
  bgOverlayOpacity: 45,
  bgBlurIntensity: 'sm',
  themePreset: 'pearl-champagne',

  event1Title: 'Biston',
  event1Subtitle: 'Ungkapan Syukur & Doa Persiapan Pernikahan',
  event1DateLabel: 'Kamis, 17 Desember 2026',
  event1TimeLabel: '18.00 WIB s.d. Selesai',
  event1Venue: 'GKJ Immanuel Ungaran',
  event1Address: 'Kota Semarang, Jawa Tengah',
  event1MapsUrl: 'https://share.google/7libnvhwrwxszjAIE',
  event1Dresscode: 'Busana Formal / Batik Rapi',

  event2Title: 'Pemberkatan Nikah',
  event2Subtitle: 'Peneguhan & Pemberkatan Janji Suci Pernikahan',
  event2DateLabel: 'Sabtu, 19 Desember 2026',
  event2TimeLabel: '07.00 WIB s.d. Selesai',
  event2Venue: 'GKJ Immanuel Ungaran',
  event2Address: 'Kota Semarang, Jawa Tengah',
  event2MapsUrl: 'https://share.google/7libnvhwrwxszjAIE',
  event2Dresscode: 'Busana Formal Nuansa Putih / Champagne',

  event3Title: 'Resepsi',
  event3Subtitle: 'Ramah Tamah & Jamuan Kehormatan',
  event3DateLabel: 'Sabtu, 19 Desember 2026',
  event3TimeLabel: '13.00 WIB s.d. Selesai',
  event3Venue: 'Aula Kantor Kecamatan Gunungpati',
  event3Address: 'Kota Semarang, Jawa Tengah',
  event3MapsUrl: 'https://maps.app.goo.gl/bHh6nrUFFExcsh9w6',
  event3Dresscode: 'Jas Formal / Batik / Gaun',

  scheduleEvents: [
    {
      id: 'ev-default-1',
      badge: 'Keluarga, Warga Gereja',
      title: 'Biston',
      venue: 'GKJ Immanuel Ungaran',
      address: 'Kota Semarang, Jawa Tengah',
      mapsUrl: 'https://share.google/7libnvhwrwxszjAIE',
      datetime: '2026-12-17T18:00:00+07:00',
      subtitle: 'Ungkapan Syukur & Doa Persiapan Pernikahan',
      dateLabel: 'Kamis, 17 Desember 2026',
      dresscode: 'Busana Formal / Batik Rapi',
      timeLabel: '18.00 WIB s.d. Selesai',
      enableCountdown: true,
      showOnInvitation: true,
    },
    {
      id: 'ev-default-2',
      badge: 'Pemerkatan Pernikahan',
      title: 'Pemberkatan Nikah',
      venue: 'GKJ Immanuel Ungaran',
      address: 'Kota Semarang, Jawa Tengah',
      mapsUrl: 'https://share.google/7libnvhwrwxszjAIE',
      datetime: '2026-12-19T07:00:00+07:00',
      subtitle: 'Peneguhan & Pemberkatan Janji Suci Pernikahan',
      dateLabel: 'Sabtu, 19 Desember 2026',
      dresscode: 'Busana Formal Nuansa Putih / Champagne',
      timeLabel: '07.00 WIB s.d. Selesai',
      enableCountdown: true,
      showOnInvitation: true,
    },
    {
      id: 'ev-default-3',
      badge: 'Resepsi Pernikahan',
      title: 'Resepsi',
      venue: 'Aula Kantor Kecamatan Gunungpati',
      address: 'Kota Semarang, Jawa Tengah',
      mapsUrl: 'https://maps.app.goo.gl/bHh6nrUFFExcsh9w6',
      datetime: '2026-12-19T13:00:00+07:00',
      subtitle: 'Ramah Tamah & Jamuan Kehormatan',
      dateLabel: 'Sabtu, 19 Desember 2026',
      dresscode: 'Jas Formal / Batik / Gaun',
      timeLabel: '13.00 WIB s.d. Selesai',
      enableCountdown: true,
      showOnInvitation: true,
    },
  ],

  quoteVerse:
    'Dan di atas semuanya itu: kenakanlah kasih, sebagai pengikat yang mempersatukan dan menyempurnakan.',
  quoteSource: 'Kolose 3 : 14',
  invitationOpeningText:
    'Dengan penuh rasa syukur ke hadirat Tuhan Yang Maha Pengasih, kami mengundang Bapak/Ibu/Saudara/i untuk hadir memberikan doa restu pada rangkaian acara pernikahan kami.',
  invitationClosingText:
    'Merupakan suatu kehormatan dan kebahagiaan bagi kami serta keluarga besar apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua mempelai.',

  giftSectionTitle: 'Amplop Digital & Tanda Kasih',
  giftSectionSubtitle:
    'Doa restu Anda merupakan karunia terindah bagi kami. Namun apabila Bapak/Ibu/Saudara/i berkenan memberikan tanda kasih secara digital, kripto, atau pengiriman kado, dapat melalui saluran resmi berikut:',
  showPhysicalGiftAddress: true,
  giftShippingNote:
    'Konfirmasi pengiriman bingkisan dapat melalui keluarga atau panitia acara.',
  giftRecipientName: 'Briptu Eko Agung Krisdianto, S.Kom. & Sero Nelci Agustina',
  giftShippingAddress: 'Kota Semarang, Jawa Tengah',
  qrisImageUrl: '',
  showQrisButton: true,
  bankAccounts: [],

  loveStory: [],
  galleryPhotos: [],

  musicTitle: 'Paint My Love',
  musicArtist: 'Michael Learns To Rock',
  activeMusicTrackId: 'track-mltr-paint-my-love',
  musicVolume: 100,

  clientGroups: [
    {
      id: 'client-utama',
      clientCode: 'UTAMA',
      clientName: 'Client Utama • Eko & Selo',
      coupleLabel: 'Eko & Selo',
      packageTier: 'ROYAL_VIP',
      status: 'ACTIVE',
      eventDate: '2026-12-19',
      notes: 'Grup Klien Utama (Mempelai & Keluarga Inti)',
      createdAt: '2026-10-18T16:05:00+07:00',
    },
  ],
  activeClientId: 'client-utama',
  invitationModerationMode: 'LIVE',
  invitationMaintenanceMessage:
    'Mohon maaf, halaman undangan digital sedang dalam penyesuaian data oleh mempelai & tim pengelola. Silakan kunjungi kembali beberapa saat lagi.',
  disableRsvpSubmission: false,
  storageQuotaLimitMb: 500,
  showFooterCredit: true,
  developerCreditUrl: 'https://github.com/omeko11',
  contactWhatsappNumber: '089638616516',
  contactBusinessEmail: 'e98.bisnis@gmail.com',
  defaultLanguage: 'ID',
  commercialBankTransferInfo: 'BCA / Mandiri / BRI / BNI (Konfirmasi via WA / Email)',
  commercialQrisImageUrl: '/paypal-qr-mwm.png',
  commercialCreditCardUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
  commercialPaypalUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
  commercialCryptoWalletAddress: '',
  commercialCryptoNetwork: 'USDT (TRC20 / BEP20 / ERC20 • Min. 10 USDT)',
  commercialPaymentChannels: DEFAULT_COMMERCIAL_PAYMENT_CHANNELS,
  commercialPayments: [],
  autoHideFlaggedWishes: true,
  moderationBlockedKeywords: '',

  updatedAt: '2026-10-18T16:05:00+07:00',
  updatedBy: 'superadmin',
};

// Seluruh data awal (Checklist, Tamu, Buku Tamu/Doa, Moneter) dikosongkan agar murni diisi mandiri oleh pengguna
export const INITIAL_TASKS: WeddingTask[] = [];

export const INITIAL_GUESTS: WeddingGuest[] = [];

export const INITIAL_WISHES: GuestWish[] = [];

export const INITIAL_BUDGET_ITEMS: BudgetVendorItem[] = [];

// 4 User Default Sistem (Password disimpan dalam bentuk hash scrypt, tidak ada plaintext di kode/git)
export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-default-1',
    username: 'mempelai_pria',
    nama: 'Mempelai Pria',
    role: 'MEMPELAI_PRIA',
    jabatan: 'User Default • Mempelai Pria',
    email: 'mempelai_pria@wedding.local',
    isDefaultUser: true,
    clientId: 'client-utama',
    clientName: 'Client Utama • Eko & Selo',
    passwordHash:
      'scrypt$wedplan_2026_slt$218c070ec61d36ec110c06778fb79a6d4150a790506d0f2a1724fb8b142839c8e1c9f5e57ed4395bfc6bbc327ac324f28298d051626c878e830c303cd3860392',
  },
  {
    id: 'usr-default-2',
    username: 'mempelai_wanita',
    nama: 'Mempelai Wanita',
    role: 'MEMPELAI_WANITA',
    jabatan: 'User Default • Mempelai Wanita',
    email: 'mempelai_wanita@wedding.local',
    isDefaultUser: true,
    clientId: 'client-utama',
    clientName: 'Client Utama • Eko & Selo',
    passwordHash:
      'scrypt$wedplan_2026_slt$8a317d2515d28a2a3fd8fc07d6c960b96d557ddb6b7be519fc282d05761f7994fb8579318fa64d240155ede56619468e6684a2147892373398273cf7765b8d50',
  },
  {
    id: 'usr-default-3',
    username: 'kel_pria',
    nama: 'Keluarga Mempelai Pria',
    role: 'KELUARGA_PRIA',
    jabatan: 'User Default • Keluarga Pria',
    email: 'kel_pria@wedding.local',
    isDefaultUser: true,
    clientId: 'client-utama',
    clientName: 'Client Utama • Eko & Selo',
    passwordHash:
      'scrypt$wedplan_2026_slt$779a9c88fd83423f53b6524a62d5638c595d9db23fea0488ff0caa494a65bef085b53c9d6a65e442dc4cab4144bb4cc2c56ef233748c704c41f77c0c8f39360a',
  },
  {
    id: 'usr-default-4',
    username: 'kel_wanita',
    nama: 'Keluarga Mempelai Wanita',
    role: 'KELUARGA_WANITA',
    jabatan: 'User Default • Keluarga Wanita',
    email: 'kel_wanita@wedding.local',
    isDefaultUser: true,
    clientId: 'client-utama',
    clientName: 'Client Utama • Eko & Selo',
    passwordHash:
      'scrypt$wedplan_2026_slt$dea17346944d14569df48b071716c213ad601ad9881eb94a4d26328f0b4aef4bb4a1ff149036887c2eea95e8947794d5dbe458006c927a9f676c8056ea98e6ca',
  },
];
