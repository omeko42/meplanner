import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Lock, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Kebijakan Privasi — MEPlanner',
  description:
    'Kebijakan privasi, perlindungan data pribadi tamu, enkripsi sesi, dan kepatuhan UU PDP di platform MEPlanner.',
};

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF8F5] text-stone-800 px-4 py-10">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#8B6914] transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke MEPlanner</span>
          </Link>
          <Link
            href="/terms"
            className="text-xs font-bold text-[#8B6914] hover:underline"
          >
            Syarat &amp; Ketentuan &rarr;
          </Link>
        </div>

        <article className="bg-white rounded-3xl border border-[#D4AF37]/35 shadow-sm overflow-hidden">
          <header className="px-6 sm:px-8 py-7 bg-gradient-to-br from-[#FAF3E3] via-[#FFFDF9] to-[#F7ECDA] border-b border-[#D4AF37]/25">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Perlindungan Data &amp; Privasi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Kebijakan Privasi (Privacy Policy)
            </h1>
            <p className="text-xs text-stone-500 mt-1.5">
              Terakhir diperbarui: 25 November 2026 &bull; Berlaku untuk seluruh layanan MEPlanner (My Event Planner)
            </p>
          </header>

          <div className="px-6 sm:px-8 py-7 space-y-6 text-sm leading-relaxed text-stone-700">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">1. Komitmen Privasi</h2>
              <p>
                MEPlanner berkomitmen melindungi privasi pemilik acara (klien), panitia/WO, dan
                tamu undangan sesuai dengan prinsip perlindungan data pribadi yang berlaku termasuk
                Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27 Tahun 2022).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">2. Data yang Kami Kumpulkan</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  <strong>Data Akun Klien &amp; Panitia:</strong> Nama, alamat email, username,
                  peran RBAC, dan kata sandi dalam bentuk hash kriptografis satu arah (<em>scrypt</em>).
                  Kami tidak pernah menyimpan kata sandi dalam teks biasa.
                </li>
                <li>
                  <strong>Data Acara &amp; Anggaran:</strong> Jadwal acara, foto/media galeri,
                  daftar tugas persiapan, dan catatan anggaran RAB yang hanya dapat diakses oleh
                  pemilik ruang kerja terotorisasi.
                </li>
                <li>
                  <strong>Data Tamu Undangan &amp; RSVP:</strong> Nama tamu, instansi/relasi,
                  nomor WhatsApp untuk pengiriman undangan, status kehadiran (RSVP), jumlah pax,
                  dan ucapan doa.
                </li>
                <li>
                  <strong>Data Teknis &amp; Keamanan:</strong> Alamat IP terbatas untuk proteksi
                  rate-limit, verifikasi anti-bot Cloudflare Turnstile, dan log audit keamanan.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">3. Penggunaan &amp; Isolasi Data (Multi-Tenant)</h2>
              <p>
                Data setiap klien diisolasi berdasarkan ruang kerja (<em>tenant isolation</em>) dan
                hak akses berbasis peran (RBAC). Akun Panitia/WO secara sistem tidak memiliki izin
                untuk melihat data keuangan/RAB. Data tamu Anda <strong>tidak pernah dijual, disewakan,
                atau dibagikan</strong> kepada pihak ketiga untuk kepentingan iklan.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">4. Keamanan Penyimpanan &amp; Sesi</h2>
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/30 flex items-start gap-3 text-xs">
                <Lock className="w-4 h-4 text-[#8B6914] shrink-0 mt-0.5" />
                <p>
                  Sesi login menggunakan <strong>JSON Web Token (JWT) bertanda tangan HMAC-SHA256</strong>{' '}
                  yang disimpan dalam cookie <code>HttpOnly</code>, <code>SameSite=Lax</code>, dan{' '}
                  <code>Secure</code> (HTTPS) dengan masa aktif sliding 4 jam. Database dilindungi
                  Row-Level Security (RLS) di Supabase PostgreSQL.
                </p>
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">5. Layanan Pihak Ketiga Terpercaya</h2>
              <p>
                Untuk operasional infrastruktur, MEPlanner bekerja sama dengan penyedia layanan
                terenkripsi: <strong>Vercel</strong> (hosting &amp; edge delivery),{' '}
                <strong>Supabase</strong> (database &amp; penyimpanan media),{' '}
                <strong>Cloudflare</strong> (DNS &amp; Turnstile anti-bot),{' '}
                <strong>Google OAuth</strong> (login akun Google), dan <strong>Resend</strong>{' '}
                (email verifikasi &amp; pemulihan akun).
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">6. Hak Pemilik Data &amp; Kontak</h2>
              <p>
                Anda berhak mengekspor, memperbarui, atau meminta penghapusan permanen data acara
                dan daftar tamu Anda kapan saja melalui dasbor Planner atau dengan menghubungi tim
                dukungan resmi kami di{' '}
                <a
                  href="mailto:support@meplan.biz.id"
                  className="font-bold text-[#8B6914] hover:underline"
                >
                  support@meplan.biz.id
                </a>
                .
              </p>
            </section>
          </div>
        </article>
      </div>
    </main>
  );
}
