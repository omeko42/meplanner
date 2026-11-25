'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, CheckCircle2, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import TurnstileWidget from '@/components/TurnstileWidget';
import { TURNSTILE_PUBLIC_SITE_KEY } from '@/lib/turnstileClient';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const tokenFromUrl = (searchParams.get('token') || '').trim();
  const isConfirmMode = Boolean(tokenFromUrl);

  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [resetKey, setResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim()) {
      setErrorMsg('Masukkan alamat email akun Anda.');
      return;
    }

    if (TURNSTILE_PUBLIC_SITE_KEY && !turnstileToken) {
      setErrorMsg('Selesaikan verifikasi Cloudflare Turnstile terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST',
          email: email.trim(),
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || 'Gagal mengirim permintaan reset kata sandi.');
        setTurnstileToken('');
        setResetKey((k) => k + 1);
        return;
      }
      setSuccessMsg(
        data.message ||
          'Jika email terdaftar, tautan reset kata sandi telah dikirim ke kotak masuk Anda.'
      );
    } catch {
      setErrorMsg('Gagal menghubungi server. Coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('Kata sandi baru minimal 8 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CONFIRM',
          token: tokenFromUrl,
          newPassword,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || 'Token tidak valid atau telah kedaluwarsa.');
        return;
      }
      setSuccessMsg(
        data.message || 'Kata sandi berhasil diperbarui. Silakan masuk kembali.'
      );
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setErrorMsg('Gagal memperbarui kata sandi. Periksa koneksi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-between px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#8B6914] transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Halaman Login</span>
        </Link>

        <div className="bg-white rounded-3xl border border-[#D4AF37]/40 shadow-[0_20px_50px_rgba(140,115,75,0.12)] overflow-hidden">
          <div className="px-6 py-6 bg-gradient-to-br from-[#FAF3E3] via-[#FFFDF9] to-[#F7ECDA] border-b border-[#D4AF37]/30">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Pemulihan Akun MEPlanner</span>
            </div>
            <h1 className="text-xl font-extrabold text-stone-900">
              {isConfirmMode ? 'Buat Kata Sandi Baru' : 'Atur Ulang Kata Sandi'}
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {isConfirmMode
                ? 'Masukkan kata sandi baru minimal 8 karakter untuk mengamankan akun Anda.'
                : 'Masukkan email yang terdaftar. Kami akan mengirimkan tautan pemulihan sekali pakai yang berlaku 30 menit.'}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold space-y-2">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>{successMsg}</span>
                </div>
                <Link
                  href="/login"
                  className="inline-block px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-[11px] font-bold hover:bg-emerald-800"
                >
                  Lanjut ke Halaman Login &rarr;
                </Link>
              </div>
            )}

            {!isConfirmMode ? (
              <form onSubmit={handleRequestReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8B6914]" />
                    <span>Alamat Email Terdaftar</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@domain.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white"
                    required
                  />
                </div>

                {TURNSTILE_PUBLIC_SITE_KEY && (
                  <TurnstileWidget
                    siteKey={TURNSTILE_PUBLIC_SITE_KEY}
                    action="reset-password"
                    onToken={setTurnstileToken}
                    resetKey={resetKey}
                    theme="light"
                  />
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#A67C32] hover:from-[#B68D40] hover:to-[#8B6914] text-white font-extrabold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Mengirim Tautan...' : 'Kirim Tautan Reset Sandi'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#8B6914]" />
                    <span>Kata Sandi Baru (min. 8 karakter)</span>
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#8B6914]" />
                    <span>Konfirmasi Kata Sandi Baru</span>
                  </label>
                  <input
                    type="password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi kata sandi baru"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#A67C32] hover:from-[#B68D40] hover:to-[#8B6914] text-white font-extrabold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Kata Sandi Baru'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      <footer className="max-w-md w-full mx-auto mt-8 text-center text-[11px] text-stone-500 space-x-3">
        <Link href="/privacy" className="hover:text-[#8B6914] hover:underline">
          Kebijakan Privasi
        </Link>
        <span>&bull;</span>
        <Link href="/terms" className="hover:text-[#8B6914] hover:underline">
          Syarat &amp; Ketentuan
        </Link>
      </footer>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-xs text-stone-500">
          Memuat halaman pemulihan akun...
        </main>
      }
    >
      <ResetPasswordContent />
    </Suspense>
  );
}
