-- ==============================================================================
-- MY WEDDING MANAGER - LOCAL DATABASE SCHEMA & SPREADSHEET BACKUP SEED (SQL)
-- Backed up from Google Spreadsheet ID: 1aajOKFxFktd56tkE--34gDWcoCWDDF_rOK8Q8_JpnlU
-- Event: Biston (18 Desember 2026) & Pemberkatan (19 Desember 2026) - Semarang
-- ==============================================================================

-- 1. TABLE: wedding_settings (Backed up from Sheet: Settings gid=487908567)
CREATE TABLE IF NOT EXISTS wedding_settings (
  id VARCHAR(50) PRIMARY KEY DEFAULT 'main_settings',
  site_title VARCHAR(255) NOT NULL,
  subtitle TEXT NOT NULL,
  wedding_date VARCHAR(60) NOT NULL,
  biston_date VARCHAR(60) NOT NULL,
  updated_at VARCHAR(60) NOT NULL,
  updated_by VARCHAR(150) NOT NULL,
  groom_full_name VARCHAR(255) NOT NULL,
  groom_short_name VARCHAR(100) NOT NULL,
  groom_rank_title VARCHAR(255),
  bride_full_name VARCHAR(255) NOT NULL,
  bride_short_name VARCHAR(100) NOT NULL,
  bride_title VARCHAR(255),
  biston_venue VARCHAR(255),
  pemberkatan_venue VARCHAR(255),
  resepsi_venue VARCHAR(255),
  google_sheet_id VARCHAR(150)
);

DELETE FROM wedding_settings WHERE id = 'main_settings';
INSERT INTO wedding_settings (
  id, site_title, subtitle, wedding_date, biston_date, updated_at, updated_by,
  groom_full_name, groom_short_name, groom_rank_title,
  bride_full_name, bride_short_name, bride_title,
  biston_venue, pemberkatan_venue, resepsi_venue, google_sheet_id
) VALUES (
  'main_settings',
  'Wedding Readiness Tracker',
  'Biston: 18 Desember 2026 • Pemberkatan: 19 Desember 2026 • Semarang',
  '2026-12-19T00:00:00+07:00',
  '2026-12-18T00:00:00+07:00',
  '2026-10-17T23:00:00+07:00',
  'mempelai_pria',
  'John Doe',
  'John',
  'Mempelai Pria',
  'Jane Doe',
  'Jane',
  'Mempelai Wanita',
  'Kediaman Keluarga / Hall Pertemuan Semarang',
  'Gereja Kristen / Katedral Semarang',
  'Grand Ballroom Hotel Padma Semarang',
  '1aajOKFxFktd56tkE--34gDWcoCWDDF_rOK8Q8_JpnlU'
);

-- 2. TABLE: wedding_tasks (Backed up from Sheet: Tasks gid=786665557 - 42 Tasks)
CREATE TABLE IF NOT EXISTS wedding_tasks (
  id VARCHAR(64) PRIMARY KEY,
  category VARCHAR(100) NOT NULL,
  timeline_phase VARCHAR(30) NOT NULL,
  title TEXT NOT NULL,
  due VARCHAR(30) NOT NULL,
  priority VARCHAR(30) NOT NULL,
  owner VARCHAR(50) NOT NULL,
  status VARCHAR(30) NOT NULL,
  notes TEXT,
  done BOOLEAN DEFAULT FALSE,
  done_at VARCHAR(30),
  created_at VARCHAR(30),
  updated_at VARCHAR(30),
  updated_by VARCHAR(150)
);

DELETE FROM wedding_tasks;
INSERT INTO wedding_tasks (id, category, timeline_phase, title, due, priority, owner, status, notes, done, done_at, created_at, updated_at, updated_by) VALUES
('g1', 'Gereja', 'H-6_BULAN', 'Surat pengantar RT/RW (untuk administrasi gereja bila diminta paroki)', '2026-06-15', 'Sedang', 'Bersama', 'BELUM', 'Opsional tergantung kebijakan sekretariat paroki.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('g2', 'Gereja', 'H-6_BULAN', 'Surat Baptis terbaru (masa berlaku maks. 6 bulan sebelum pemberkatan)', '2026-07-01', 'Tinggi', 'Bersama', 'BELUM', 'Wajib terbaru dari paroki asal masing-masing.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('g3', 'Gereja', 'H-6_BULAN', 'Sertifikat KPP / Kursus Persiapan Perkawinan Katolik', '2026-07-20', 'Tinggi', 'Bersama', 'BELUM', 'Daftar lebih awal karena kuota paroki terbatas.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('g4', 'Gereja', 'H-6_BULAN', 'Surat pengantar dari Ketua Lingkungan (masing-masing / domisili)', '2026-08-01', 'Tinggi', 'Bersama', 'BELUM', 'Koordinasi pengurus lingkungan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('g5', 'Gereja', 'H-3_BULAN', 'Fotokopi KTP, KK, dan Akta Kelahiran (masing-masing mempelai)', '2026-08-10', 'Tinggi', 'Bersama', 'BELUM', 'Siapkan map berkas gereja + cadangan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('g6', 'Gereja', 'H-3_BULAN', 'Pas foto berdampingan ukuran 4x6 (6 lembar, pakaian rapi/formal)', '2026-08-15', 'Sedang', 'Bersama', 'BELUM', 'Cek ketentuan warna background di sekretariat paroki Semarang.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('g7', 'Gereja', 'H-3_BULAN', 'Pendaftaran Kanonik & Penyelidikan Kanonik bersama Romo Paroki', '2026-09-01', 'Tinggi', 'Bersama', 'BELUM', 'Minimal 3 bulan sebelum 19 Desember 2026.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('g8', 'Gereja', 'H-3_BULAN', 'Pengumuman ke-1 s/d ke-3 di Gereja & konfirmasi petugas liturgi/koor', '2026-11-15', 'Sedang', 'Wanita', 'BELUM', 'Pastikan buku misa dan jadwal gladi bersih pemberkatan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p1', 'Polri (Izin Kawin)', 'H-6_BULAN', 'Surat permohonan izin kawin kepada pimpinan satuan (Bag SDM)', '2026-08-01', 'Tinggi', 'Pria', 'BELUM', 'Ajukan jauh hari sebelum pelaksanaan di Semarang.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p2', 'Polri (Izin Kawin)', 'H-6_BULAN', 'Surat keterangan N1, N2, N4 dari kelurahan', '2026-08-15', 'Tinggi', 'Bersama', 'BELUM', 'Sinkron dengan berkas pencatatan sipil.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p3', 'Polri (Izin Kawin)', 'H-6_BULAN', 'SKCK calon pasangan dari kepolisian setempat', '2026-08-15', 'Tinggi', 'Wanita', 'PROSES', 'Cek masa berlaku SKCK.', FALSE, '', '17/03/2026', '19/03/2026', 'mempelai_pria'),
('p4', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Surat keterangan belum pernah menikah (calon pasangan)', '2026-08-20', 'Tinggi', 'Wanita', 'BELUM', 'Dari kelurahan/desa sesuai KTP.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p5', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Surat persetujuan orang tua/wali kedua belah pihak', '2026-08-20', 'Tinggi', 'Bersama', 'BELUM', 'Bermeterai cukup.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p6', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Surat keterangan kesehatan & bebas narkoba (RS Polri / Klinik Satkes)', '2026-09-01', 'Tinggi', 'Bersama', 'BELUM', 'Untuk anggota dan calon pasangan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p7', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Fotokopi KTA, SK pangkat terakhir, dan SK jabatan (anggota Polri)', '2026-08-10', 'Sedang', 'Pria', 'BELUM', 'Legalisir bila diperlukan Bag SDM.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p8', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Fotokopi KTP, KK, dan Akta Kelahiran kedua calon', '2026-08-10', 'Tinggi', 'Bersama', 'BELUM', 'Rangkap sesuai ketentuan satuan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p9', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Pas foto berdampingan 4x6 (PDH untuk anggota, pakaian ketentuan Bhayangkari untuk pasangan)', '2026-08-25', 'Tinggi', 'Bersama', 'BELUM', 'Sesuaikan latar belakang merah/biru sesuai petunjuk SDM.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p10', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Surat rekomendasi dari komandan/atasan langsung', '2026-09-05', 'Tinggi', 'Pria', 'BELUM', 'Paraf berjenjang sebelum ke SDM.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p11', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Mengikuti sidang BP4R / bimbingan perkawinan di satuan', '2026-09-20', 'Tinggi', 'Bersama', 'BELUM', 'Hadir bersama pasangan & orang tua/wali bila diwajibkan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p12', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Rekomendasi dari Bhayangkari', '2026-09-25', 'Tinggi', 'Wanita', 'BELUM', 'Koordinasi pengurus Bhayangkari satuan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('p13', 'Polri (Izin Kawin)', 'H-3_BULAN', 'Surat Keterangan Catatan Personel (SKHP) dari Propam', '2026-09-10', 'Tinggi', 'Pria', 'BELUM', 'Pastikan masa berlaku SKHP mencakup jadwal sidang BP4R.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('d1', 'Kependudukan', 'H-3_BULAN', 'Surat pengantar RT/RW sesuai domisili KTP', '2026-09-15', 'Sedang', 'Bersama', 'BELUM', 'Dasar pengurusan kelurahan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('d2', 'Kependudukan', 'H-3_BULAN', 'Formulir N1, N2, N4 dari kelurahan/desa', '2026-09-20', 'Tinggi', 'Bersama', 'BELUM', 'Untuk pencatatan sipil.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('d3', 'Kependudukan', 'H-3_BULAN', 'Surat rekomendasi nikah / numpang nikah (bila luar domisili menuju Semarang)', '2026-10-01', 'Tinggi', 'Bersama', 'BELUM', 'Wajib dicek jika KTP di luar Kota Semarang.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('d4', 'Kependudukan', 'H-3_BULAN', 'Fotokopi KTP & KK kedua mempelai + orang tua + 2 orang saksi', '2026-10-05', 'Tinggi', 'Bersama', 'BELUM', 'Data saksi harus sudah fix.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('d5', 'Kependudukan', 'H-3_BULAN', 'Pendaftaran berkas ke Disdukcapil (maks. H-10 hari kerja sebelum pemberkatan)', '2026-11-25', 'Tinggi', 'Bersama', 'BELUM', 'Lampirkan surat pengantar gereja & surat izin kawin kedinasan.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('k1', 'Keluarga & Saksi', 'H-3_BULAN', 'Penetapan 2 saksi pemberkatan gereja & 2 saksi pencatatan sipil', '2026-10-01', 'Tinggi', 'Bersama', 'BELUM', 'Kumpulkan fotokopi KTP saksi.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('k2', 'Keluarga & Saksi', 'H-3_BULAN', 'Koordinasi susunan keluarga inti untuk acara Biston (18 Des 2026)', '2026-10-20', 'Tinggi', 'Keluarga', 'BELUM', 'Susun juru bicara keluarga & urutan prosesi.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('k3', 'Keluarga & Saksi', 'H-3_BULAN', 'Daftar tamu VIP / pimpinan kesatuan & distribusi undangan', '2026-11-10', 'Tinggi', 'Bersama', 'BELUM', 'Pisahkan daftar tamu Biston dan Pemberkatan/Resepsi.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('k4', 'Keluarga & Saksi', 'H-3_BULAN', 'Booking akomodasi keluarga luar kota di Semarang', '2026-11-01', 'Sedang', 'Keluarga', 'BELUM', 'Check-in minimal 17 Desember 2026.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('a1', 'Acara', 'H-3_BULAN', 'Finalisasi venue, katering & rundown acara Biston (18 Desember 2026 - Semarang)', '2026-11-01', 'Tinggi', 'Vendor/WO', 'BELUM', 'Pastikan kapasitas ruangan dan parkir memadai.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('a2', 'Acara', 'H-3_BULAN', 'Finalisasi Gereja, dekorasi altar, dokumentasi foto/video (19 Desember 2026)', '2026-11-05', 'Tinggi', 'Vendor/WO', 'BELUM', 'Koordinasi aturan fotografer di dalam gereja.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('a3', 'Acara', 'H-1_BULAN', 'Fitting akhir busana Biston & busana Pemberkatan + cincin kawin', '2026-11-25', 'Tinggi', 'Bersama', 'BELUM', 'Cincin kawin disimpan oleh PIC yang ditunjuk.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('a4', 'Acara', 'H-1_BULAN', 'Technical Meeting (TM) bersama WO, keluarga & seluruh vendor di Semarang', '2026-12-05', 'Tinggi', 'Vendor/WO', 'BELUM', 'Kunci rundown menit-per-menit tanggal 18 & 19 Desember.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('a5', 'Acara', 'H-7_HARI', 'Gladi bersih pemberkatan di Gereja Semarang', '2026-12-17', 'Tinggi', 'Bersama', 'BELUM', 'Hadir bersama saksi, orang tua, dan petugas liturgi.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('a6', 'Acara', 'H-7_HARI', 'Siapkan 1 koper/map khusus seluruh dokumen asli untuk dibawa ke lokasi', '2026-12-16', 'Tinggi', 'Bersama', 'BELUM', 'Berisi berkas Gereja, Dukcapil, KTP asli, dan cincin.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('s1', 'Setelah Menikah', 'PASCA_NIKAH', 'Ambil Surat Perkawinan Gereja & Akta Perkawinan Disdukcapil', '2026-12-28', 'Tinggi', 'Bersama', 'BELUM', 'Cek ejaan nama dan tanggal sebelum meninggalkan loket.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('s2', 'Setelah Menikah', 'PASCA_NIKAH', 'Pembaruan KK & KTP status Kawin', '2027-01-08', 'Sedang', 'Bersama', 'BELUM', 'Pengajuan ke Disdukcapil.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('s3', 'Setelah Menikah', 'PASCA_NIKAH', 'Pelaporan ke Bag SDM Polri (update SIPP, KPI/Karis, BPJS & tunjangan keluarga)', '2027-01-15', 'Tinggi', 'Pria', 'BELUM', 'Lampirkan Akta Perkawinan & KK baru.', FALSE, '', '17/03/2026', '17/03/2026', 'mempelai_pria'),
('task_0eb339f0-e1d2-4947-a7b8-d173230ce36f', 'Kesehatan & Dokumen', 'H-6_BULAN', 'SKCK Ibu calon', '2026-07-24', 'Sedang', 'Calon', 'SELESAI', 'Lampiran kelengkapan berkas keluarga calon.', TRUE, '08/08/2026', '23/07/2026', '08/08/2026', 'mempelai_pria'),
('task_33a4016a-5838-488d-bdd8-c96744177a42', 'Kesehatan & Dokumen', 'H-6_BULAN', 'SKCK Bapak saya', '2026-07-24', 'Sedang', 'Saya', 'SELESAI', 'Lampiran kelengkapan berkas orang tua.', TRUE, '23/07/2026', '23/07/2026', '23/07/2026', 'mempelai_pria'),
('task_7c9ab5d1-ea7b-4e94-90ca-3886beee3bf2', 'Kesehatan & Dokumen', 'H-6_BULAN', 'SKCK Ibu saya', '2026-07-24', 'Sedang', 'Saya', 'SELESAI', 'Lampiran kelengkapan berkas orang tua.', TRUE, '23/07/2026', '23/07/2026', '23/07/2026', 'mempelai_pria');

-- 3. TABLE: wedding_guests (Backed up from Sheet: Guests gid=1134858514 - 3 Real Guests)
CREATE TABLE IF NOT EXISTS wedding_guests (
  id VARCHAR(64) PRIMARY KEY,
  invitation_code VARCHAR(30) UNIQUE NOT NULL,
  guest_name VARCHAR(255) NOT NULL,
  guest_type VARCHAR(50) NOT NULL,
  side VARCHAR(50) NOT NULL,
  institution VARCHAR(255),
  invitation_format VARCHAR(50),
  priority VARCHAR(50),
  card_qty INT DEFAULT 1,
  pax INT DEFAULT 2,
  confirmed_pax INT DEFAULT 2,
  phone VARCHAR(50),
  address TEXT,
  delivery_status VARCHAR(50),
  rsvp_status VARCHAR(50),
  attendance_status VARCHAR(50),
  notes TEXT,
  created_at VARCHAR(30),
  updated_at VARCHAR(30),
  updated_by VARCHAR(150)
);

DELETE FROM wedding_guests;
INSERT INTO wedding_guests (
  id, invitation_code, guest_name, guest_type, side, institution, invitation_format,
  priority, card_qty, pax, confirmed_pax, phone, address, delivery_status, rsvp_status,
  attendance_status, notes, created_at, updated_at, updated_by
) VALUES
('guest_mn40s79z_b5u8', 'INV-0001', 'KOMJEN POL ASEP SAFRUDIN, S.I.K., M.H.', 'Pejabat/VIP', 'Mempelai Pria', 'KABARESKRIM POLRI', 'Cetak Tebal', 'P1 - VIP', 1, 2, 0, '', '', 'Belum Disiapkan', 'Belum Konfirmasi', 'Belum Dicek', '', '24/03/2026', '24/03/2026', 'mempelai_pria'),
('guest_mn40tl9u_u3j1', 'INV-0002', 'BRIGJEN POL SETIADI SULAKSONO, S.I.K., M.H.', 'Pejabat/VIP', 'Mempelai Pria', 'KAROBINOPSNAL BARESKRIM POLRI', 'Cetak Tebal', 'P1 - VIP', 1, 2, 0, '', '', 'Belum Disiapkan', 'Belum Konfirmasi', 'Belum Dicek', '', '24/03/2026', '24/03/2026', 'mempelai_pria'),
('guest_mn40x436_912z', 'INV-0003', 'BRIGJEN POL SUMARYONO, S.H., S.I.K., M.H.', 'Pejabat/VIP', 'Mempelai Pria', 'KAPUSIDENT BARESKRIM POLRI', 'Cetak Tebal', 'P1 - VIP', 1, 2, 0, '', '', 'Belum Disiapkan', 'Belum Konfirmasi', 'Belum Dicek', '', '24/03/2026', '24/03/2026', 'mempelai_pria');

