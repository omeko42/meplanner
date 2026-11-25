import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Syarat & Ketentuan — MEPlanner',
  description:
    'Syarat dan ketentuan penggunaan platform manajemen acara dan undangan digital MEPlanner.',
};

export default function TermsOfServicePage() {
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
            href="/privacy"
            className="text-xs font-bold text-[#8B6914] hover:underline"
          >
            Kebijakan Privasi &rarr;
          </Link>
        </div>

        <article className="bg-white rounded-3xl border border-[#D4AF37]/35 shadow-sm overflow-hidden">
          <header className="px-6 sm:px-8 py-7 bg-gradient-to-br from-[#FAF3E3] via-[#FFFDF9] to-[#F7ECDA] border-b border-[#D4AF37]/25">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider mb-3">
              <FileText className="w-3.5 h-3.5" />
              <span>Ketentuan Layanan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              Syarat &amp; Ketentuan Layanan (Terms of Service)
            </h1>
            <p className="text-xs text-stone-500 mt-1.5">
              Terakhir diperbarui: 25 November 2026 &bull; MEPlanner (My Event Planner)
            </p>
          </header>

          <div className="px-6 sm:px-8 py-7 space-y-6 text-sm leading-relaxed text-stone-700">
            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">1. Penerimaan Ketentuan</h2>
              <p>
                Dengan mengakses situs, membuat ruang kerja acara, atau menggunakan fitur undangan
                digital MEPlanner, Anda menyetujui Syarat &amp; Ketentuan ini beserta{' '}
                <Link href="/privacy" className="font-bold text-[#8B6914] hover:underline">
                  Kebijakan Privasi
                </Link>{' '}
                kami.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">2. Akun, Peran &amp; Keamanan</h2>
              <ul className="list-disc pl-5 space-y-1.5">
                <li>
                  Pemilik akun bertanggung jawab menjaga kerahasiaan kata sandi dan akun Google yang
                  terhubung dengan ruang kerja MEPlanner.
                </li>
                <li>
                  Pengguna dilarang mencoba mengakses ruang kerja klien lain, memanipulasi token
                  sesi, atau melakukan pengujian beban/eksploitasi tanpa izin tertulis.
                </li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">3. Paket Layanan &amp; Pembayaran</h2>
              <p>
                Nominal, mata uang, dan aktivasi paket berlangganan MEPlanner diverifikasi secara
                otoritatif di sisi server. Setelah paket diaktifkan dan tautan undangan publik
                digunakan untuk acara, biaya paket bersifat final kecuali terjadi kegagalan sistem
                yang terverifikasi dari pihak MEPlanner.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">4. Konten Pengguna &amp; Moderasi</h2>
              <p>
                Seluruh foto, musik, teks acara, dan daftar tamu yang diunggah sepenuhnya menjadi
                tanggung jawab pemilik acara. Pengguna wajib memastikan konten yang diunggah tidak
                melanggar hak cipta pihak lain maupun hukum yang berlaku di Indonesia.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">5. Ketersediaan Layanan</h2>
              <p>
                Kami berupaya menjaga ketersediaan sistem semaksimal mungkin terutama pada hari
                pelaksanaan acara. Pemeliharaan sistem terencana akan dilakukan tanpa memutus
                tautan undangan publik tamu yang sedang aktif.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-base font-extrabold text-stone-900">6. Kontak Resmi</h2>
              <p>
                Pertanyaan mengenai ketentuan layanan, kerja sama komersial, atau dukungan teknis
                dapat dikirim ke{' '}
                <a
                  href="mailto:e98.bisnis@gmail.com"
                  className="font-bold text-[#8B6914] hover:underline"
                >
                  e98.bisnis@gmail.com
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
