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
    accountOrWalletAddress: 'NMID: My Event Planner Indonesia',
    accountHolder: 'My Event Planner (Eko Agung K.)',
    networkOrBranch: 'M-Banking, GoPay, OVO, DANA, ShopeePay, LinkAja',
    qrCodeImageUrl: '',
    minAmountNote: 'Mulai Rp 51.750',
    instructions:
      'Scan QRIS resmi atau transfer sesuai nominal paket yang dipilih, lalu masukkan nomor referensi transaksi atau kirim konfirmasi ke Email Resmi Gmail: e98.bisnis@gmail.com.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-bca-id',
    category: 'BANK_TRANSFER',
    marketScope: 'ID',
    providerName: 'Transfer Bank Nasional (BCA / Mandiri / BRI / BNI)',
    accountOrWalletAddress:
      'BCA / Mandiri / BRI / BNI (Konfirmasi via Email Resmi: e98.bisnis@gmail.com)',
    accountHolder: 'Eko Agung Krisdianto',
    networkOrBranch: 'Transfer Bank IDR (Real-Time / BI-FAST)',
    minAmountNote: 'Mulai Rp 51.750',
    instructions:
      'Transfer tepat sesuai nominal paket resmi MEPlanner, cantumkan Nama Acara di berita transfer, dan konfirmasi via Email Resmi Gmail: e98.bisnis@gmail.com.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-card-global',
    category: 'CREDIT_CARD',
    marketScope: 'BOTH',
    providerName: 'Visa / Mastercard / JCB / Apple Pay',
    accountOrWalletAddress: 'Official Card Checkout Gateway (PayPal NCP)',
    accountHolder: 'My Event Planner (@omeko42)',
    networkOrBranch: 'Visa, Mastercard, Amex, JCB & Debit Online',
    checkoutUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
    qrCodeImageUrl: '/paypal-qr-mwm.png',
    minAmountNote: 'Mulai Rp 51.750 / $4 USD',
    instructions:
      'Klik tombol Checkout Kartu Kredit/Debit untuk menyelesaikan pembayaran aman via gateway Visa/Mastercard resmi, lalu konfirmasi bukti ke Email Resmi Gmail: e98.bisnis@gmail.com.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-paypal-global',
    category: 'PAYPAL',
    marketScope: 'BOTH',
    providerName: 'PayPal International (Official Merchant)',
    accountOrWalletAddress: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
    accountHolder: 'My Event Planner (Eko Agung Krisdianto)',
    networkOrBranch: 'PayPal Balance / International Cards (USD)',
    checkoutUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
    qrCodeImageUrl: '/paypal-qr-mwm.png',
    minAmountNote: 'Mulai $4 USD',
    instructions:
      'Scan QR Code PayPal resmi di bawah atau klik tombol PayPal Checkout, lalu catat Transaction ID PayPal Anda atau konfirmasi ke Email Resmi Gmail: e98.bisnis@gmail.com.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-usdt-trc20',
    category: 'CRYPTO',
    marketScope: 'BOTH',
    providerName: 'USDT (Tether) — Jaringan TRC20 (Tron)',
    accountOrWalletAddress: 'Atur Alamat Wallet USDT TRC20 di Menu Superadmin',
    accountHolder: 'MEP Crypto Treasury (TRC20)',
    networkOrBranch: 'TRC20 (Tron Network)',
    minAmountNote: 'Min. Transfer 4 USDT',
    instructions:
      'Kirim USDT HANYA melalui jaringan TRC20 (Tron). Setelah transaksi berstatus Confirmed, masukkan TXID / Hash transaksi di bawah atau konfirmasi ke Email Resmi Gmail: e98.bisnis@gmail.com.',
    isActive: true,
    updatedAt: '2026-10-18T16:05:00+07:00',
  },
  {
    id: 'ch-usdt-bep20',
    category: 'CRYPTO',
    marketScope: 'BOTH',
    providerName: 'USDT (Tether) — Jaringan BEP20 (BNB Smart Chain)',
    accountOrWalletAddress: 'Atur Alamat Wallet USDT BEP20 di Menu Superadmin',
    accountHolder: 'MEP Crypto Treasury (BEP20)',
    networkOrBranch: 'BEP20 (BNB Smart Chain / BSC)',
    minAmountNote: 'Min. Transfer 4 USDT',
    instructions:
      'Kirim USDT HANYA melalui jaringan BEP20 (BNB Smart Chain). Setelah transaksi berstatus Confirmed, masukkan TXID / Hash transaksi di bawah atau konfirmasi ke Email Resmi Gmail: e98.bisnis@gmail.com.',
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
  siteTitle: 'My Event Planner',
  subtitle:
    'Pemberkatan & Akad: 24 Oktober 2026 • Resepsi Malam: 24 Oktober 2026 • Jakarta',
  weddingDatetime: '2026-10-24T09:00:00+07:00',
  bistonDatetime: '2026-10-23T19:00:00+07:00',
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
  showLoveStorySection: true,
  showGallerySection: true,
  showRsvpSection: true,
  showGiftSection: true,

  groomFullName: 'dr. Rayhan Dirgantara, Sp.JP.',
  groomNickname: 'Rayhan',
  groomRankAndTitle: 'Mempelai Pria',
  groomUnit: '',
  groomParents:
    'Putra pertama dari Bapak Prof. Dr. H. Hendra Dirgantara & Ibu Hj. Sofia Kartika',
  groomOrigin: 'Jakarta',
  groomInstagram: '',
  groomPhotoUrl:
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=85',

  brideFullName: 'Clarissa Aurelia Wijaya, B.Bus., M.Sc.',
  brideNickname: 'Clarissa',
  brideTitle: 'Mempelai Wanita',
  brideParents:
    'Putri pertama dari Bapak Ir. Surya Wijaya, M.B.A. & Ibu Diana Prameswari',
  brideOrigin: 'Surabaya',
  brideInstagram: '',
  bridePhotoUrl:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=85',

  coverBgUrl:
    'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85',
  heroPrewedUrl:
    'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85',
  pageBgUrl:
    'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=1400&q=85',
  bgOverlayOpacity: 45,
  bgBlurIntensity: 'sm',
  themePreset: 'pearl-champagne',

  event1Title: 'Malam Midodareni & Doa Keluarga',
  event1Subtitle: 'Ungkapan Syukur & Doa Persiapan Pernikahan',
  event1DateLabel: 'Jumat, 23 Oktober 2026',
  event1TimeLabel: '19.00 WIB - Selesai',
  event1Venue: 'Kediaman Keluarga Wijaya',
  event1Address: 'Kebayoran Baru, Jakarta Selatan',
  event1MapsUrl: 'https://maps.google.com',
  event1Dresscode: 'Busana Formal / Batik Rapi',

  event2Title: 'Akad & Pemberkatan Pernikahan',
  event2Subtitle: 'Peneguhan & Pemberkatan Janji Suci Pernikahan',
  event2DateLabel: 'Sabtu, 24 Oktober 2026',
  event2TimeLabel: '09.00 WIB - 11.00 WIB',
  event2Venue: 'Glasshouse Ritz-Carlton Pacific Place',
  event2Address: 'SCBD, Jakarta Selatan',
  event2MapsUrl: 'https://maps.google.com',
  event2Dresscode: 'Formal Nuansa Putih / Champagne',

  event3Title: 'Grand Royal Reception',
  event3Subtitle: 'Ramah Tamah & Jamuan Kehormatan',
  event3DateLabel: 'Sabtu, 24 Oktober 2026',
  event3TimeLabel: '18.30 WIB - 21.30 WIB',
  event3Venue: 'Grand Ballroom Hotel Mulia Senayan',
  event3Address: 'Senayan, Jakarta Pusat',
  event3MapsUrl: 'https://maps.google.com',
  event3Dresscode: 'Black Tie / Evening Gown / Batik Tulis',

  scheduleEvents: [
    {
      id: 'ev-demo-1',
      badge: 'Keluarga Inti',
      title: 'Malam Midodareni & Doa Keluarga',
      venue: 'Kediaman Keluarga Wijaya',
      address: 'Kebayoran Baru, Jakarta Selatan',
      mapsUrl: 'https://maps.google.com',
      datetime: '2026-10-23T19:00:00+07:00',
      subtitle: 'Ungkapan Syukur & Doa Persiapan Pernikahan',
      dateLabel: 'Jumat, 23 Oktober 2026',
      dresscode: 'Busana Formal / Batik Rapi',
      timeLabel: '19.00 WIB - Selesai',
      enableCountdown: true,
      showOnInvitation: true,
    },
    {
      id: 'ev-demo-2',
      badge: 'Keluarga & Kerabat',
      title: 'Akad & Pemberkatan Pernikahan',
      venue: 'Glasshouse Ritz-Carlton Pacific Place',
      address: 'SCBD, Jakarta Selatan',
      mapsUrl: 'https://maps.google.com',
      datetime: '2026-10-24T09:00:00+07:00',
      subtitle: 'Peneguhan & Pemberkatan Janji Suci Pernikahan',
      dateLabel: 'Sabtu, 24 Oktober 2026',
      dresscode: 'Formal Nuansa Putih / Champagne',
      timeLabel: '09.00 WIB - 11.00 WIB',
      enableCountdown: true,
      showOnInvitation: true,
    },
    {
      id: 'ev-demo-3',
      badge: 'Tamu Undangan VIP',
      title: 'Grand Royal Reception',
      venue: 'Grand Ballroom Hotel Mulia Senayan',
      address: 'Senayan, Jakarta Pusat',
      mapsUrl: 'https://maps.google.com',
      datetime: '2026-10-24T18:30:00+07:00',
      subtitle: 'Ramah Tamah & Jamuan Kehormatan',
      dateLabel: 'Sabtu, 24 Oktober 2026',
      dresscode: 'Black Tie / Evening Gown / Batik Tulis',
      timeLabel: '18.30 WIB - 21.30 WIB',
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
    'Doa restu Anda merupakan karunia terindah bagi kami. Namun apabila Bapak/Ibu/Saudara/i berkenan memberikan tanda kasih secara digital atau pengiriman kado, dapat melalui saluran resmi berikut:',
  showPhysicalGiftAddress: true,
  giftShippingNote:
    'Konfirmasi pengiriman bingkisan dapat melalui keluarga atau panitia acara.',
  giftRecipientName: 'Rayhan Dirgantara & Clarissa Aurelia',
  giftShippingAddress: 'Kebayoran Baru, Jakarta Selatan',
  qrisImageUrl: '',
  showQrisButton: true,
  bankAccounts: [],

  loveStory: [
    {
      id: 'story_demo_1',
      dateLabel: '2021',
      title: 'Pertemuan Pertama',
      location: 'Jakarta',
      description: 'Awal mula perkenalan yang membawa kami saling mengenal lebih dekat.',
    },
    {
      id: 'story_demo_2',
      dateLabel: '2024',
      title: 'Komitmen Bersama',
      location: 'Jakarta',
      description:
        'Menjalani suka duka bersama dan memantapkan hati untuk melangkah ke jenjang serius.',
    },
    {
      id: 'story_demo_3',
      dateLabel: 'Oktober 2026',
      title: 'Ikatan Suci Pernikahan',
      location: 'Jakarta',
      description: 'Dengan restu Tuhan dan kedua orang tua, kami mengikat janji suci pernikahan.',
    },
  ],
  galleryPhotos: [
    {
      id: 'gal-demo-1',
      title: 'Golden Sunset Silhouette',
      caption: 'The Beginning',
      imageUrl:
        'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=85',
      category: 'Prewedding',
    },
    {
      id: 'gal-demo-2',
      title: 'Sacred Promises',
      caption: 'Momen Bersama',
      imageUrl:
        'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=85',
      category: 'Momen Bersama',
    },
  ],

  musicTitle: 'NCS — Eternal Promise (Canon Acoustic)',
  musicArtist: 'NoCopyrightSounds • Royalty-Free Instrumental',
  musicSourceType: 'NCS_BUILTIN',
  activeMusicTrackId: 'track-default-1',
  musicPlaylist: [
    {
      id: 'track-default-1',
      title: 'NCS — Eternal Promise (Canon Acoustic)',
      artist: 'NoCopyrightSounds • Royalty-Free Instrumental',
      url: 'synth:canon-in-d',
      isDefault: true,
    },
    {
      id: 'track-default-2',
      title: 'NCS — Golden Hour Harmony',
      artist: 'NoCopyrightSounds • Free Royalty Arpeggio',
      url: 'synth:thousand-years',
      isDefault: true,
    },
    {
      id: 'track-default-3',
      title: 'NCS — Symphony of Grace',
      artist: 'NoCopyrightSounds • Free Royalty Piano',
      url: 'synth:beautiful-in-white',
      isDefault: true,
    },
  ],
  musicVolume: 100,

  clientGroups: [
    {
      id: 'client-demo',
      clientCode: 'DEMO',
      clientName: 'Klien Demo • Rayhan & Clarissa',
      coupleLabel: 'Rayhan & Clarissa',
      packageTier: 'ROYAL_VIP',
      status: 'ACTIVE',
      eventDate: '2026-10-24',
      notes: 'Ruang Kerja Demo Bawaan Superadmin',
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
  developerCreditUrl: 'https://github.com/omeko42',
  contactWhatsappNumber: '',
  contactBusinessEmail: 'e98.bisnis@gmail.com',
  defaultLanguage: 'ID',
  commercialBankTransferInfo:
    'BCA / Mandiri / BRI / BNI (Konfirmasi via Email Resmi Gmail: e98.bisnis@gmail.com)',
  commercialQrisImageUrl: '/paypal-qr-mwm.png',
  commercialCreditCardUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
  commercialPaypalUrl: 'https://www.paypal.com/ncp/payment/GJNLQTV45Y9NY',
  commercialCryptoWalletAddress: '',
  commercialCryptoNetwork: 'USDT (TRC20 / BEP20 / ERC20 • Min. 4 USDT)',
  commercialPaymentChannels: DEFAULT_COMMERCIAL_PAYMENT_CHANNELS,
  commercialPayments: [],
  autoHideFlaggedWishes: true,
  moderationBlockedKeywords: '',

  updatedAt: '2026-10-18T16:05:00+07:00',
  updatedBy: 'superadmin',
};

export const INITIAL_TASKS: WeddingTask[] = [];

// Seluruh data tamu live disimpan 100% di Supabase Cloud (tidak ada data tamu live di repositori Git)
export const INITIAL_GUESTS: WeddingGuest[] = [];

export const INITIAL_WISHES: GuestWish[] = [];

export const INITIAL_BUDGET_ITEMS: BudgetVendorItem[] = [];

// 4 User Default Template (Akun live disimpan 100% di Supabase Cloud)
export const INITIAL_ADMIN_USERS: AdminUser[] = [
  {
    id: 'usr-default-1',
    username: 'demo_pria',
    nama: 'Rayhan (Demo Mempelai Pria)',
    role: 'MEMPELAI_PRIA',
    jabatan: 'User Default • Mempelai Pria',
    email: 'demo_pria@meplanner.local',
    isDefaultUser: true,
    clientId: 'client-demo',
    clientName: 'Klien Demo • Rayhan & Clarissa',
    passwordHash:
      'scrypt$wedplan_2026_slt$218c070ec61d36ec110c06778fb79a6d4150a790506d0f2a1724fb8b142839c8e1c9f5e57ed4395bfc6bbc327ac324f28298d051626c878e830c303cd3860392',
  },
  {
    id: 'usr-default-2',
    username: 'demo_wanita',
    nama: 'Clarissa (Demo Mempelai Wanita)',
    role: 'MEMPELAI_WANITA',
    jabatan: 'User Default • Mempelai Wanita',
    email: 'demo_wanita@meplanner.local',
    isDefaultUser: true,
    clientId: 'client-demo',
    clientName: 'Klien Demo • Rayhan & Clarissa',
    passwordHash:
      'scrypt$wedplan_2026_slt$218c070ec61d36ec110c06778fb79a6d4150a790506d0f2a1724fb8b142839c8e1c9f5e57ed4395bfc6bbc327ac324f28298d051626c878e830c303cd3860392',
  },
  {
    id: 'usr-default-3',
    username: 'demo_kel_pria',
    nama: 'Keluarga Rayhan (Demo Kel. Pria)',
    role: 'KELUARGA_PRIA',
    jabatan: 'User Default • Keluarga Pria',
    email: 'demo_kel_pria@meplanner.local',
    isDefaultUser: true,
    clientId: 'client-demo',
    clientName: 'Klien Demo • Rayhan & Clarissa',
    passwordHash:
      'scrypt$wedplan_2026_slt$218c070ec61d36ec110c06778fb79a6d4150a790506d0f2a1724fb8b142839c8e1c9f5e57ed4395bfc6bbc327ac324f28298d051626c878e830c303cd3860392',
  },
  {
    id: 'usr-default-4',
    username: 'demo_kel_wanita',
    nama: 'Keluarga Clarissa (Demo Kel. Wanita)',
    role: 'KELUARGA_WANITA',
    jabatan: 'User Default • Keluarga Wanita',
    email: 'demo_kel_wanita@meplanner.local',
    isDefaultUser: true,
    clientId: 'client-demo',
    clientName: 'Klien Demo • Rayhan & Clarissa',
    passwordHash:
      'scrypt$wedplan_2026_slt$218c070ec61d36ec110c06778fb79a6d4150a790506d0f2a1724fb8b142839c8e1c9f5e57ed4395bfc6bbc327ac324f28298d051626c878e830c303cd3860392',
  },
];
