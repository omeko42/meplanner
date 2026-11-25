# Setup Production: Supabase, Cloudflare, Resend & Vercel untuk MEPlanner

Panduan ini merangkum seluruh konfigurasi dashboard yang diperlukan agar fitur keamanan penuh, custom domain, email transaksional, dan multi-tenant RLS aktif 100% di production tanpa memutus undangan tamu yang sedang berjalan.

| # | Komponen | Dashboard | Status |
|---|----------|-----------|--------|
| 1 | Migrasi Tabel & RLS Aman | Supabase -> SQL Editor | [ ] |
| 2 | Environment Variables & Service Role | Vercel -> Settings -> Env Vars | [ ] |
| 3 | Lockdown Final Tabel Legacy (`002`) | Supabase -> SQL Editor | [ ] |
| 4 | Custom Domain & Cloudflare DNS | Cloudflare + Vercel Domains | [ ] |
| 5 | Cloudflare Turnstile (Anti-Bot) | Cloudflare + Vercel Env | [ ] |
| 6 | Resend Custom SMTP (Verifikasi & Reset Sandi) | Resend + Cloudflare DNS + Vercel | [ ] |

---

## 1. Jalankan Migrasi SQL Aman (Tanpa Ganggu Undangan Live)

Buka **Supabase Dashboard -> SQL Editor -> New query**, lalu copy-paste dan jalankan **SATU FILE INI**:

```sql
database/migrations/000_bootstrap_security_tables_safe.sql
```

Kenapa file ini aman dijalankan sekarang?
- Membuat seluruh tabel baru secara berurutan (`app_user_credentials`, `app_email_tokens`, `app_payment_orders`, `tenants`, `tenant_memberships`, `tenant_guests`, `tenant_wishes`, `tenant_tasks`, `tenant_budget_items`, `tenant_settings`, `audit_logs`, `app_user_profiles`) sehingga **tidak akan kena error `relation "public.tenants" does not exist`**.
- Menyalakan RLS ketat pada semua tabel baru (termasuk memblokir akses `Panitia` pada `tenant_budget_items`).
- **Tidak memutus akses tabel legacy `wedding_state`** sebelum `SUPABASE_SERVICE_ROLE_KEY` terpasang di Vercel.

Query verifikasi di akhir script harus mengembalikan **12 baris nama tabel**.

---

## 2. Pasang Environment Variables di Vercel (dan `.env.local`)

Masuk ke **Vercel -> Project `meplanner` -> Settings -> Environment Variables**, lalu pastikan variabel berikut terisi untuk Production, Preview, dan Development:

| Variabel | Wajib? | Keterangan |
| :--- | :---: | :--- |
| `NEXT_PUBLIC_SITE_URL` | Ya | `https://meplanner.vercel.app` atau custom domain kamu (mis. `https://meplanner.biz.id`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Ya | URL project Supabase (`https://wkjnwkgpolpmzdfrfjso.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Ya | Publishable anon key Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | **Wajib** | Service role key dari **Supabase -> Project Settings -> API Keys**. Server-only! |
| `AUTH_SECRET` | **Wajib** | String acak minimal 32 karakter (`openssl rand -base64 48`) |
| `SUPERADMIN_EMAILS` | **Wajib** | Email owner (pisahkan koma jika lebih dari satu) |
| `SUPERADMIN_PASSWORD_HASH` | Disarankan | Hasil dari `npm run hash-password` (`scrypt$salt$hash`) |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Disarankan | Site Key Cloudflare Turnstile |
| `TURNSTILE_SECRET_KEY` | Disarankan | Secret Key Cloudflare Turnstile (wajib sepasang dengan Site Key) |
| `RESEND_API_KEY` | Disarankan | API key Resend (`re_...`) untuk email verifikasi & reset password |
| `EMAIL_FROM` | Disarankan | Contoh: `MEPlanner <noreply@meplanner.biz.id>` |
| `EMAIL_REPLY_TO` | Opsional | Contoh: `support@meplanner.biz.id` |

> **Generate hash password lokal:**
> ```bash
> npm run hash-password "KataSandiKuatAnda123!"
> ```

Setelah mengisi Environment Variables di Vercel, lakukan **Redeploy** agar seluruh server route memakai `SUPABASE_SERVICE_ROLE_KEY`.

---

## 3. Lockdown Final Tabel Legacy (Setelah Langkah 2 Live)

Setelah yakin deploy Vercel dengan `SUPABASE_SERVICE_ROLE_KEY` berjalan lancar (coba buka salah satu link undangan tamu dan login admin), jalankan file ini di **Supabase SQL Editor**:

```sql
database/migrations/002_credential_vault_and_rls.sql
```

Script ini sudah dilengkapi guard `to_regclass(...)` sehingga aman terhadap tabel opsional, dan akan mencabut seluruh akses `anon` ke tabel lama agar **100% akses database hanya melalui server Next.js terautentikasi**.

---

## 4. Custom Domain Cloudflare + Vercel

1. Beli/siapkan domain (contoh: `meplanner.biz.id` atau `meplanner.id`) dan arahkan nameserver ke **Cloudflare**.
2. Di **Vercel -> Settings -> Domains**, tambahkan domain utama (mis. `meplanner.biz.id`).
3. Di **Cloudflare -> DNS -> Records**, tambahkan record sesuai instruksi Vercel (biasanya `A @ -> 76.76.21.21` atau `CNAME` dengan mode **DNS Only** terlebih dahulu saat verifikasi SSL Vercel).
4. Update `NEXT_PUBLIC_SITE_URL` dan `ALLOWED_ORIGINS` di Vercel menjadi `https://domain-kamu.com`.
5. Tambahkan domain baru ke **Google Cloud Console -> OAuth 2.0 Authorized JavaScript Origins & Redirect URIs** agar tombol Login Google berfungsi di domain baru.

---

## 5. Cloudflare Turnstile (Captcha Login & Reset Sandi)

1. Buka **Cloudflare Dashboard -> Turnstile -> Add Widget**.
2. Pilih mode **Managed**.
3. Masukkan hostname: `meplanner.vercel.app`, custom domain kamu, dan `localhost`.
4. Pasang **Site Key** ke `NEXT_PUBLIC_TURNSTILE_SITE_KEY` dan **Secret Key** ke `TURNSTILE_SECRET_KEY` di Vercel, lalu Redeploy.

---

## 6. Resend Custom SMTP + Cloudflare Email Routing

1. Buat akun di [Resend](https://resend.com) -> **Domains -> Add Domain** (masukkan domain custom kamu).
2. Tambahkan record **DKIM / SPF / MX** yang diberikan Resend ke **Cloudflare DNS**.
3. Setelah status **Verified**, buat API Key -> simpan di `RESEND_API_KEY` dan set `EMAIL_FROM="MEPlanner <noreply@domain-kamu.com>"`.
4. (Opsional) Aktifkan **Cloudflare Email Routing** agar email masuk ke `support@domain-kamu.com` otomatis diteruskan ke Gmail bisnis kamu.
