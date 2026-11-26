<div align="center">

# MEPlanner — My Event Planner

**Multi-Tenant Event Planning Workspace, Guest & RSVP Manager, Budget RAB, and Luxury Digital Invitation Suite**

[![Live App](https://img.shields.io/badge/Live-meplan.biz.id-C5A059?style=for-the-badge&logo=vercel&logoColor=white)](https://meplan.biz.id)
[![Next.js](https://img.shields.io/badge/Next.js-14%20App%20Router-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%20%26%20RLS-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-Turnstile%20%26%20DNS-F38020?style=for-the-badge&logo=cloudflare&logoColor=white)](https://www.cloudflare.com/)

[Buka Aplikasi (`meplan.biz.id`)](https://meplan.biz.id) · [Portal Login](https://meplan.biz.id/login) · [Kebijakan Privasi](https://meplan.biz.id/privacy) · [Syarat & Ketentuan](https://meplan.biz.id/terms) · [Panduan Setup Production](docs/SETUP_PRODUCTION_CLOUDFLARE_RESEND.md)

</div>

---

## Fitur Utama

| Modul | Deskripsi |
| --- | --- |
| **Multi-Tenant Workspace & RBAC** | Isolasi data per klien dengan kontrol akses berbasis peran: **Superadmin**, **Mempelai / Owner**, dan **Panitia / WO (Non-Budgeting)**. |
| **Digital Invitation Suite (25+ Tema)** | Undangan digital responsif dengan 5 arsitektur layout (*Editorial Classic*, *Polaroid Magazine*, *Botanical Airy*, *Nusantara Heritage*, *Modern Bento*), musik latar, galeri slideshow, dan link personal per tamu (`/{hash}` & `/wa/{hash}`). |
| **Buku Tamu, Kuota Pax & QR Check-In** | Kelola ratusan tamu VIP & reguler, konfirmasi RSVP real-time, pelacakan status kirim WhatsApp, buku ucapan dengan moderasi, dan ekspor laporan **PDF / Excel (`.xlsx`)**. |
| **Manajemen Anggaran (RAB) & Analitik** | Pelacakan pos anggaran, status pembayaran (Belum DP / DP / Lunas), grafik distribusi biaya & progres kategori (*Recharts*), serta ekspor laporan RAB resmi ke **PDF & Excel**. |
| **Checklist Kesiapan Panitia** | Pembagian tugas berdasarkan fase timeline (`H-6 Bulan` hingga `Hari-H`) dan domain (`Gereja`, `Vendor & Logistik`, `Acara`, `Kependudukan`, `Seserahan & Adat`). |
| **Keamanan Production-Grade** | Autentikasi scrypt + JWT HttpOnly Cookie (Sliding Window 4 Jam), Google OAuth, Cloudflare Turnstile anti-bot, Reset Sandi via Resend Email, CSP Headers, dan PostgreSQL Row-Level Security (RLS). |

---

## Tech Stack

- **Framework:** Next.js (App Router) + React + TypeScript
- **Styling & Charts:** Tailwind CSS + Lucide Icons + Recharts + Sonner Notifications
- **Export Engine:** jsPDF + jsPDF-AutoTable (PDF) & SheetJS `xlsx` (Excel)
- **Database & Storage:** Supabase PostgreSQL + Row-Level Security (RLS) + Supabase Storage
- **Email & Anti-Bot:** Resend Transactional Email + Cloudflare Turnstile
- **Deployment:** Vercel

---

## Rute Utama Aplikasi

| Route | Fungsi |
| :--- | :--- |
| `/` | Katalog Komersial MEPlanner & Planner Studio (saat login) |
| `/[hash]` & `/wa/[hash]` | Undangan digital personal tamu & redirect WhatsApp cepat dengan OG preview |
| `/login` | Halaman login mandiri (Username/Email, Google OAuth, Cloudflare Turnstile) |
| `/reset-password` | Halaman permintaan & konfirmasi atur ulang kata sandi via email |
| `/auth/verify` | Verifikasi email pendaftaran akun baru |
| `/privacy` | Kebijakan Privasi (UU PDP) |
| `/terms` | Syarat & Ketentuan Layanan |
| `/manifest.webmanifest` | PWA Web App Manifest |

---

## Setup Lokal & Perintah Cepat

1. **Salin Environment Variables:**
   ```bash
   cp .env.example .env.local
   ```
   Lengkapi variabel wajib di `.env.local` (lihat panduan lengkap di [`docs/SETUP_PRODUCTION_CLOUDFLARE_RESEND.md`](docs/SETUP_PRODUCTION_CLOUDFLARE_RESEND.md)).

2. **Jalankan Migrasi Database di Supabase SQL Editor:**
   ```sql
   database/migrations/000_bootstrap_security_tables_safe.sql
   ```

3. **Jalankan & Verifikasi Aplikasi:**
   ```bash
   npm install
   npm run dev            # server pengembangan (http://localhost:3000)
   npm run typecheck      # cek TypeScript (tsc --noEmit)
   npm run lint:security  # audit ESLint rute API & keamanan
   npm run hash-password  # generate scrypt hash untuk SUPERADMIN_PASSWORD_HASH
   npm run build          # build production
   ```

---

## Keamanan & Pelaporan

Detail arsitektur keamanan, model ancaman, dan rotasi kunci tersedia di [`SECURITY.md`](SECURITY.md).
