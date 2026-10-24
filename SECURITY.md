# 🛡️ Security Policy & Commercial Source Code Protection Guide

> **MEPlan — My Event Planner (Commercial SaaS Security Standard)**  
> Owner & Maintainer: **Eko Agung Krisdianto ([@omeko11](https://github.com/omeko11))**

---

## 1. Strategi Perlindungan Source Code Komersial di GitHub (Private Repository Strategy)

Agar kode program (**Source Code**) aplikasi komersial **MEPlan — My Event Planner** tidak dapat dilihat, disalin, atau di-clone oleh publik maupun kompetitor di GitHub, namun website produksi di **Vercel** tetap berjalan otomatis setiap kali ada pembaruan (*auto-deploy*), ikuti arsitektur repositori berikut:

### A. Setel Repositori Utama Aplikasi (`meplan`) Menjadi **PRIVATE**
1. Buka halaman repositori GitHub Anda: `https://github.com/omeko11/meplan/settings`
2. Gulir ke bagian paling bawah (**Danger Zone**).
3. Klik **Change repository visibility** $\rightarrow$ pilih **Change to private**.
4. **Dampak Positif pada Vercel**:
   - **Vercel (baik paket Hobby Gratis maupun Pro) mendukung penuh *Private GitHub Repository* tanpa biaya tambahan.**
   - Setiap kali Anda melakukan `git push` ke repositori Private tersebut, Vercel tetap otomatis melakukan *build* dan *deploy* ke domain publik Anda (`https://meplan.vercel.app`).
   - Pengunjung umum yang membuka link GitHub repositori tersebut akan mendapatkan halaman `404 Not Found` sehingga seluruh kode `src/`, komponen, dan logika bisnis Anda **100% aman dan tersembunyi dari publik**.

### B. Gunakan GitHub Profile (`@omeko11`) atau Repositori Rilis Terpisah untuk Tampilan Publik
Jika Anda ingin halaman profil GitHub Anda (`https://github.com/omeko11`) tetap menampilkan etalase produk komersial secara profesional kepada publik:
1. **GitHub Profile README**: Buat repositori publik khusus bernama `omeko11` (sama persis dengan username GitHub Anda) yang **hanya berisi 1 file `README.md`** berisi profil profesional dan katalog produk **MEPlan — My Event Planner**.
2. **Public Release / Showcase Repo (Opsional)**: Jika ingin menyediakan halaman dokumentasi publik, buat repositori publik yang **hanya** berisi file `README.md` (brosur produk, paket harga `STARTER` / `EXCLUSIVE` / `ROYAL VIP`, serta kontak WhatsApp) tanpa menyertakan folder `src/` atau kode aplikasi.

---

## 2. Perlindungan Kredensial & Environment Variables (`.env`)

Seluruh kunci rahasia dan konfigurasi infrastruktur dilindungi dengan aturan ketat berikut:
- **Git Ignore Hardening (`.gitignore`)**:
  - File `.env`, `.env.*`, `.env.local`, `.vercel`, sertifikat (`*.pem`, `*.key`), kredensial (`*secret*`, `*credentials*`), serta file cadangan database (`wedding_backup_*.json`, `*.bak`) diblokir secara otomatis agar tidak pernah ter-commit ke Git.
  - Hanya file template `.env.example` (yang berisi nilai contoh/placeholder aman) yang diizinkan masuk ke repositori.
- **Penyimpanan Kunci Produksi**:
  - Kunci asli (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET`) **wajib** disimpan langsung di dalam menu **Vercel Dashboard $\rightarrow$ Project Settings $\rightarrow$ Environment Variables** atau pada file `.env.local` di komputer pengembangan lokal.

---

## 3. Keamanan Otentikasi & Isolasi Data Klien

1. **Kriptografi Password Satu Arah (`scrypt`)**:
   - Seluruh password akun Superadmin, Penyelenggara/Mempelai, Keluarga, dan Panitia/EO tidak pernah disimpan dalam bentuk teks biasa (*plaintext*), melainkan di-hash menggunakan algoritma kriptografi `scrypt` dengan *unique salt* dan diverifikasi di sisi server (`Constant-Time Verification`).
2. **Isolasi Multi-Workspace per Klien**:
   - Setiap klien komersial memiliki ruang kerja (*workspace*) yang terisolasi sehingga akun satu klien tidak dapat mengakses data anggaran, tamu, maupun pengaturan milik klien lainnya.

---

## 📞 Pelaporan Celah Keamanan (Reporting a Vulnerability)

Jika Anda menemukan potensi celah keamanan pada layanan **MEPlan — My Event Planner**, mohon untuk **tidak** mempublikasikannya secara terbuka. Segera hubungi pengembang utama secara langsung melalui:
- **GitHub Resmi**: [@omeko11](https://github.com/omeko11)
- **LinkedIn Resmi**: [Eko Agung Krisdianto](https://www.linkedin.com/in/eko-agung-krisdianto-408955130)
- **Kanal Dukungan Klien Terverifikasi**: Tersedia otomatis pada halaman konfirmasi pasca-pembayaran (*Post-Payment Confirmation Screen*).
