# 💍 My Wedding Manager — All-in-One Wedding Planner & Digital Invitation

Sistem Informasi Terpadu **Manajemen Kesiapan Pernikahan (Wedding Readiness Tracker)** dan **Undangan Digital Online Interaktif** yang dibangun dengan standar arsitektur **Next.js 14 App Router, TypeScript Ketat, Tailwind CSS, dan Lucide Icons**, siap ter-deploy ke **Vercel** serta terintegrasi dengan **Google Sheets Database (`DB Wedding`)**.

---

## ✨ Fitur Utama

### 1. Pemisahan Hak Akses (Role-Based Access & Public View)
- **Tampilan Tamu / Publik (`/` atau `/?to=Nama+Tamu` atau `/?code=INV-0001`)**:
  - **Cover Pembuka Fullscreen**: Menampilkan nama tamu otomatis dari parameter URL (`Kepada Yth. Bapak/Ibu/Saudara/i [Nama Tamu]`), deteksi lencana **Tamu Kehormatan / VIP**, serta tombol **"Buka Undangan"** dengan musik latar instrumental romantis opsional.
  - **Profil Kedua Mempelai & Countdown Hari-H**: Hitung mundur menuju **Biston (18 Desember 2026)** & **Pemberkatan / Resepsi (19 Desember 2026)** di Kota Semarang.
  - **Detail Rangkaian Acara & Google Maps**: Informasi waktu, gedung/gereja, panduan busana (*dresscode*), dan tombol integrasi petunjuk arah Google Maps.
  - **Kisah Cinta (Love Story) & Galeri Foto Lightbox**.
  - **Form Konfirmasi Kehadiran (RSVP) & Buku Tamu Real-Time**: Konfirmasi kehadiran (*Hadir / Masih Ragu / Tidak Hadir*), kuota jumlah orang (*Pax*), dan ucapan doa yang langsung tersimpan ke dashboard Admin secara *real-time*.
  - **Amplop Digital / Wedding Gift**: Daftar rekening bank (BRI, BCA, Mandiri) dengan tombol **1-Klik Salin Nomor Rekening** serta tampilan **QRIS Wedding Gift**.

- **Tampilan Admin / Pengantin & Keluarga (`/?mode=admin` atau `/admin`)**:
  - **Readiness Tracker (Executive Dashboard)**: Persentase kesiapan pernikahan secara keseluruhan, countdown ganda (*Biston 18 Des & Pemberkatan 19 Des 2026*), progres per domain (*Polri, Gereja, Kependudukan, Kesehatan & Dokumen, Vendor, Acara, Setelah Menikah*), ringkasan budget, dan statistik RSVP tamu.
  - **Checklist Kesiapan Bertahap**: Filter berdasarkan Fase Timeline (*H-6 Bulan, H-3 Bulan, H-1 Bulan, H-7, Hari-H, Setelah Menikah*), Kategori Domain, Status (*Belum / Proses / Selesai*), dan PIC (*Saya / Calon / Bersama / Keluarga / WO*).
  - **Budget & Vendor Tracker**: Pencatatan estimasi biaya vs realisasi kontrak, pembayaran DP/Cicilan/Lunas, serta sisa tagihan vendor di Semarang.
  - **Manajemen Tamu & Generator Undangan WA 1-Klik**: Mendukung skema 19 kolom `DB Wedding` (termasuk kode undangan `INV-0001`, prioritas `P1 - VIP`, format `Cetak Tebal / Digital WA`) dan otomatis men-generate link undangan bernama beserta template pesan WhatsApp khusus untuk **Pejabat Tinggi / VIP Polri** maupun **Keluarga & Sahabat**.
  - **Pengaturan Konten Undangan & Sinkronisasi Cloud**: Edit nama mempelai, jadwal, lokasi, dan rekening langsung dari dashboard + tombol **1-Klik Sinkronisasi Google Sheets (`1aajOKFxFktd56tkE--34gDWcoCWDDF_rOK8Q8_JpnlU`)** serta **Export/Import Backup JSON & CSV Excel**.

---

## 🔐 Keamanan Otentikasi & Role-Based Access Control (RBAC)
- Seluruh kredensial akun dan password dienkripsi menggunakan **One-Way Cryptographic Hash (`scrypt`)** dan diverifikasi di sisi server (`/api/auth` & `/api/wedding`).
- Tidak ada informasi akun maupun password sensitif yang ditampilkan pada antarmuka publik/login maupun disimpan secara *plaintext* di repositori.
- Mendukung pemisahan hak akses antara **User Default (Mempelai & Keluarga Inti)** serta **Akun Panitia / WO** (di mana akun Panitia dibatasi secara ketat dari mengakses modul *Budgeting & Revisi Anggaran*).

---

## 🚀 Menjalankan Secara Lokal

```bash
npm install
npm run dev
```

Verifikasi TypeScript (Zero Error Check):
```bash
npx tsc --noEmit
```
