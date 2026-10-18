# 💍 My Wedding Manager — Enterprise Wedding Planner & Digital Invitation Suite

> **My Wedding Manager by omeko11 © 2026**  
> Sistem Informasi Terpadu **Manajemen Kesiapan Pernikahan (Wedding Readiness Tracker)**, **Undangan Digital Interaktif Real-Time**, dan **Manajemen Multi-Client Komersial (SaaS)** dengan arsitektur terpisah antara **Frontend (Vercel Edge)**, **Backend Service Layer (Next.js API Routes)**, serta **Cloud Database & Object Storage CDN (Supabase PostgreSQL 8 Tabel Relasional + Supabase Storage)**.

---

## 🏗️ Arsitektur Sistem (Layered Cloud Architecture)

Aplikasi ini dirancang secara modular dengan pemisahan jelas antara **Presentation Layer (FE)**, **Application/API Layer (BE)**, dan **Persistence & CDN Layer (DB + Storage)**:

| Layer | Teknologi & Infrastruktur | Fungsi Utama |
| :--- | :--- | :--- |
| **1. Frontend (FE)** | **Next.js 14 App Router**, React 18, TypeScript, Tailwind CSS, Lucide Icons *(Deployed on Vercel)* | Antarmuka Undangan Publik (`PublicInvitationView.tsx`), Dashboard Admin & Superadmin (`AdminDashboardView.tsx`), Interactive Photo Cropper, serta Audio Engine (`weddingMusicPlayer`). |
| **2. Backend (BE)** | **Next.js Serverless API Routes** (`/api/auth`, `/api/wedding`, `/api/sync-sheets`) + Service Layer (`supabaseCloud.ts`, `serverStore.ts`, `clientSync.ts`) | Otentikasi kriptografi `scrypt`, RBAC Multi-Client, sinkronisasi real-time lintas perangkat, serta **Zero-Trace Garbage Collector** untuk menjaga kuota penyimpanan tetap hemat. |
| **3. Database (DB)** | **Supabase PostgreSQL** *(8 Tabel Relasional Terpisah)* + **IndexedDB Local Cache** | Menyimpan state utama & relasional (`wedding_state`, `wedding_settings`, `wedding_media`, `wedding_tasks`, `wedding_guests`, `wedding_wishes`, `wedding_budgets`, `wedding_users`). |
| **4. Media CDN** | **Supabase Storage Bucket** (`wedding-media/photos` & `wedding-media/music`) | Menyimpan foto **Ultra-HD (hingga 10 MB per foto)** dan file musik **MP3/WAV/AAC** sebagai URL CDN publik sehingga tabel database tetap ringan dan bebas timeout. |

---

## ✨ Fitur Utama

### 1. Landing Page Komersial (`/`) & Undangan Digital Per Klien (`/?client=<kode>&to=Nama+Tamu&code=INV-0001`)
- **Landing Page Komersial Resmi (`CommercialLandingView.tsx`)**:
  - Ketika domain utama (`/`) diakses tanpa parameter undangan tamu, sistem menampilkan **Halaman Depan Komersial My Wedding Manager (`MWM`) by omeko11** yang memuat:
    - **Katalog & Live Showcase Undangan Klien Aktif** (termasuk *Featured Showcase* `Agung & Selo` maupun klien-klien lainnya).
    - **Pencarian Cepat Tamu Undangan VIP** (pilih pasangan mempelai & masukkan kode `INV-0001` atau nama tamu).
    - **Informasi 6 Modul Terintegrasi & Pilihan Paket Komersial (`STARTER`, `EXCLUSIVE`, `ROYAL VIP`)**.
- **Gerbang Sampul (Cover Gate) Personalisasi Otomatis**:
  - Ketika diakses melalui tautan undangan (`/?client=agung_selo`, `/?client=<kode_klien>`, atau langsung `/?to=Nama+Tamu&code=INV-0001`), sistem langsung membuka undangan pasangan terkait tanpa melewati landing page.
  - Menampilkan badge **Tamu Kehormatan / VIP** secara otomatis untuk tamu prioritas `P1 - VIP`.
- **Sinkronisasi Penuh dengan Database Pengaturan (100% Editable)**:
  - Seluruh teks pembuka, nama & gelar kedua mempelai, profil orang tua, kutipan ayat suci, rangkaian acara (*Acara Biston, Pemberkatan, Resepsi, maupun Acara Kustom*), **Kisah Cinta (Love Story)**, **Galeri Foto Lightbox**, **Amplop Digital & QRIS**, hingga **Kalimat Penutup (Closing Card)** tersinkron langsung dari database masing-masing klien.
- **Pemutar Musik Latar Pintar (Smart Audio Engine)**:
  - Mendukung *playlist* kustom dari Supabase Storage CDN, lengkap dengan deteksi otomatis file musik duplikat/salah unggah dan pemutaran lintas sesi.
- **RSVP & Buku Tamu Doa Restu Real-Time**:
  - Konfirmasi kehadiran (*Hadir / Masih Ragu / Tidak Hadir*), kuota jumlah hadir (*Pax*), serta pengiriman ucapan doa dan balasan resmi mempelai secara langsung ke Supabase.

---

### 2. Dashboard Admin, Mempelai & Panitia (`/?mode=admin`)
- **Tracker Kesiapan (Executive Dashboard)**:
  - Persentase kesiapan pernikahan, hitung mundur menuju Hari-H, progres per domain (*Polri, Gereja, Kependudukan, Kesehatan & Dokumen, Vendor, Acara, Setelah Menikah*), ringkasan anggaran, dan statistik kehadiran tamu.
- **Checklist Kesiapan Bertahap**:
  - Manajemen tugas berdasarkan Fase Timeline (*H-6 Bulan s/d Setelah Menikah*), Kategori Domain, Status, dan Penanggung Jawab (PIC).
- **Manajemen Moneter, Vendor & Amplop Digital (Khusus Akun Utama)**:
  - Pencatatan estimasi vs realisasi kontrak vendor, status pembayaran (*DP, Cicilan, Lunas*), pengelolaan rekening bank amplop digital, serta unggah gambar **QRIS Wedding Gift**.
- **Manajemen Tamu & Generator WhatsApp 1-Klik**:
  - Dukungan penuh kode undangan (`INV-0001`), prioritas VIP, filter grup keluarga, serta pengiriman pesan WhatsApp otomatis dengan link undangan personal per klien (`/?client=<kode>&to=...&code=...`).
- **Studio Foto Ultra-HD (Maks 10 MB) & Zero-Trace Delete**:
  - Unggah foto profil mempelai, sampul, kisah cinta, galeri, dan QRIS hingga **10 MB per foto** dengan fitur *Interactive Crop & Zoom*.
  - Setiap penghapusan atau pergantian foto/musik langsung menghapus file fisik lama di Supabase Storage (**Zero-Trace Hard Delete**) agar kuota **500 MB Supabase** tetap awet dan bebas sampah.

---

### 3. Modul Khusus Superadmin & Multi-Workspace Commercial System (SaaS)
Dirancang agar **1 Dashboard** dapat dikomersialkan untuk mengelola banyak klien sekaligus oleh Superadmin dengan **Isolasi Data Penuh (Multi-Workspace)**:
- **Isolasi Workspace per Klien (`ClientWorkspaceData`) & Grouping User Default (`ClientGroupItem`)**:
  - Setiap klien komersial memiliki grup tersendiri dengan **4 Akun User Default otomatis** (`<kode>_pria`, `<kode>_wanita`, `<kode>_kel_pria`, `<kode>_kel_wanita`) serta akun **Panitia / WO** masing-masing.
  - Saat akun klien (misal `@rian_dina_pria`) login, ia hanya melihat dan mengelola **Data Mempelai, Foto, Musik, Checklist, Moneter, Tamu, dan Doa Restu miliknya sendiri** (terpisah penuh dari data klien lain).
  - **Superadmin** memiliki **Global Workspace Switcher** di bagian atas dashboard untuk berpindah antar-workspace klien dengan 1 klik.
- **Monitor Kapasitas DB & Supabase Storage (Kuota 500 MB)**:
  - Pemantauan *real-time* pemakaian MB pada folder `wedding-media/photos`, `wedding-media/music`, dan estimasi ukuran 8 tabel PostgreSQL.
  - Dilengkapi tombol **1-Klik Zero-Trace Garbage Collector** untuk memindai dan membersihkan *orphaned files* di Supabase Storage.
- **Moderasi View Undangan Publik Real-Time**:
  - Kendali instan mode tayangan undangan publik:
    - `🟢 LIVE Publik`: Terbuka normal untuk seluruh tamu undangan.
    - `🔐 Khusus Kode VIP`: Mewajibkan verifikasi Kode Undangan (`INV-xxxx`) untuk membuka sampul undangan.
    - `🛠️ Mode Maintenance`: Menampilkan layar pemeliharaan khusus dan mengunci undangan sementara.
  - Saklar cepat untuk mengunci pengiriman RSVP baru serta mengatur visibilitas tiap seksi undangan.

---

## 🔐 Keamanan Otentikasi & Role-Based Access Control (RBAC)
- Seluruh password akun dienkripsi menggunakan **One-Way Cryptographic Hash (`scrypt`)** dan diverifikasi di sisi server (`/api/auth`).
- Pemisahan hak akses tegas antara:
  - **Superadmin**: Kendali penuh atas modul Superadmin, kapasitas DB, moderasi undangan, serta pembuatan/penghapusan Grup Client komersial.
  - **User Default (4 Akun Inti per Klien)**: Akses penuh ke kesiapan pernikahan, moneter/anggaran, daftar tamu, dan pengaturan undangan.
  - **Akun Panitia / WO**: Akses operasional checklist dan tamu, **tanpa** akses ke modul Moneter/Budgeting maupun Superadmin.

---

## 🚀 Menjalankan Secara Lokal

```bash
# 1. Instal dependensi
npm install

# 2. Jalankan server pengembangan (http://localhost:3000)
npm run dev

# 3. Verifikasi TypeScript (Zero Error Check)
npx tsc --noEmit
```

---

## 👨‍💻 Credit & Contact Us

**My Wedding Manager by [omeko11](https://github.com/omeko11/my_wedding_manager) © 2026**  
All-in-One Enterprise Wedding Readiness Tracker & Digital Invitation Platform.

- **Developer / Architect**: **Eko Agung Krisdianto ([`omeko11`](https://github.com/omeko11/my_wedding_manager))**
- **Kontak WA & Commercial Inquiry**: [089638616516 (WhatsApp)](https://wa.me/6289638616516)
- **Official LinkedIn Profile**: [www.linkedin.com/in/eko-agung-krisdianto-408955130](https://www.linkedin.com/in/eko-agung-krisdianto-408955130)

