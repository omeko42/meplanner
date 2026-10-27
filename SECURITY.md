# 🛡️ Security Policy & Commercial Source Code Protection Guide

> **MEPlanner — My Event Planner (Commercial SaaS Security Standard)**  
> Owner & Lead Developer: **Eko Agung Krisdianto ([@omeko42](https://github.com/omeko42))**

---

## 1. Perlindungan Kredensial & Data Privasi

Seluruh kunci rahasia, data pribadi tamu, dan konfigurasi infrastruktur dilindungi dengan standar keamanan berikut:
- **Git Ignore Hardening (`.gitignore`)**:
  - File `.env`, `.env.*`, `.env.local`, `.vercel`, sertifikat (`*.pem`, `*.key`), kredensial (`*secret*`, `*credentials*`), serta folder cadangan database lokal (`database/`, `data_aplikasi/`, `.data/`, `*.sql`, `*.bak`) diblokir secara otomatis agar tidak pernah ter-commit ke repositori GitHub.
  - Hanya file template `.env.example` (yang berisi nilai *placeholder* aman) yang disertakan di dalam repositori.
- **Penyimpanan Kunci Produksi**:
  - Kunci lingkungan produksi (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `AUTH_SECRET`) dikonfigurasi secara terenkripsi melalui **Vercel Project Settings $\rightarrow$ Environment Variables** atau pada file `.env.local` di mesin pengembangan lokal.

---

## 2. Keamanan Otentikasi & Isolasi Multi-Workspace

1. **Kriptografi Password Satu Arah (`scrypt` + Timing-Safe Verification)**:
   - Seluruh kredensial akun pemilik sistem, penyelenggara acara, keluarga inti, dan panitia operasional di-hash menggunakan algoritma kriptografi `scrypt` dengan *salt* unik serta diverifikasi menggunakan perbandingan waktu konstan (`crypto.timingSafeEqual`).
   - Dilengkapi proteksi *Rate-Limiting* terhadap percobaan login berulang (*Brute-Force Protection*) dan sesi cookie `HttpOnly`.
2. **Isolasi Multi-Workspace per Klien**:
   - Setiap klien komersial memiliki ruang kerja (*workspace*) terisolasi sehingga akun satu klien tidak dapat mengakses data anggaran, daftar tamu, maupun pengaturan milik klien lainnya.
3. **Role-Based Access Control (RBAC)**:
   - Memisahkan hak akses antara **Akun Inti Penyelenggara** (akses penuh termasuk modul Moneter & Kontrak Vendor) dan **Akun Panitia / EO / WO** (fokus operasional, *checklist*, dan *check-in* tamu tanpa mengekspos rincian finansial).

---

## 📞 Pelaporan Celah Keamanan (Reporting a Vulnerability)

Jika Anda menemukan potensi celah keamanan pada layanan **MEPlanner — My Event Planner**, mohon untuk **tidak** mempublikasikannya secara terbuka. Segera hubungi pengembang utama secara langsung melalui:
- **Email Resmi Bisnis**: [e98.bisnis@gmail.com](mailto:e98.bisnis@gmail.com)
- **GitHub Resmi**: [@omeko42](https://github.com/omeko42)
- **LinkedIn Resmi**: [Eko Agung Krisdianto (@omeko42)](https://www.linkedin.com/in/omeko42)
