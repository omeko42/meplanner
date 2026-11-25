'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react';
import TurnstileWidget from '@/components/TurnstileWidget';
import { ReactGoogleLoginButton } from '@/components/ReactGoogleLoginButton';
import { TURNSTILE_PUBLIC_SITE_KEY } from '@/lib/turnstileClient';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!username.trim() || !password) {
      setErrorMsg('Username/email dan kata sandi wajib diisi.');
      return;
    }

    if (TURNSTILE_PUBLIC_SITE_KEY && !turnstileToken) {
      setErrorMsg('Selesaikan verifikasi keamanan Cloudflare Turnstile terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          action: 'LOGIN',
          username: username.trim(),
          password,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || 'Kredensial tidak valid. Periksa kembali username dan kata sandi.');
        setTurnstileToken('');
        setTurnstileResetKey((k) => k + 1);
        return;
      }

      setSuccessMsg('Login berhasil! Mengarahkan ke Planner Studio...');
      router.replace('/?mode=admin');
      router.refresh();
    } catch {
      setErrorMsg('Gagal menghubungi server autentikasi. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-between px-4 py-8">
      <div className="max-w-md w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#8B6914] transition-colors mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda MEPlanner</span>
        </Link>

        <div className="bg-white rounded-3xl border border-[#D4AF37]/40 shadow-[0_20px_50px_rgba(140,115,75,0.12)] overflow-hidden">
          <div className="px-6 py-6 bg-gradient-to-br from-[#FAF3E3] via-[#FFFDF9] to-[#F7ECDA] border-b border-[#D4AF37]/30">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-extrabold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>MEPlanner Secure Portal</span>
            </div>
            <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
              Masuk ke Ruang Kerja Anda
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              Kelola tamu VIP, buku kas RAB, checklist persiapan, dan undangan digital dalam satu panel terenkripsi.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8B6914]" />
                  <span>Username atau Email</span>
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Contoh: superadmin atau email@domain.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-[#8B6914]" />
                    <span>Kata Sandi</span>
                  </label>
                  <Link
                    href="/reset-password"
                    className="text-[11px] font-bold text-[#8B6914] hover:underline"
                  >
                    Lupa kata sandi?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi"
                    className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition-colors"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                    aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {TURNSTILE_PUBLIC_SITE_KEY && (
                <div className="pt-1">
                  <TurnstileWidget
                    siteKey={TURNSTILE_PUBLIC_SITE_KEY}
                    action="login"
                    onToken={setTurnstileToken}
                    resetKey={turnstileResetKey}
                    theme="light"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#A67C32] hover:from-[#B68D40] hover:to-[#8B6914] text-white font-extrabold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{isSubmitting ? 'Memverifikasi Sesi...' : 'Masuk ke Planner Studio'}</span>
              </button>
            </form>

            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
                Atau masuk instan dengan
              </span>
              <div className="border-t border-stone-200 w-full" />
            </div>

            <ReactGoogleLoginButton
              buttonText="Lanjutkan dengan Akun Google"
              className="w-full"
              onSuccess={async (googleRes) => {
                setErrorMsg(null);
                if (!googleRes?.accessToken) {
                  setErrorMsg('Token Google tidak diterima.');
                  return;
                }
                setIsSubmitting(true);
                try {
                  const res = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                      action: 'GOOGLE_OAUTH_LOGIN',
                      accessToken: googleRes.accessToken,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (!res.ok || !data?.success) {
                    setErrorMsg(data?.error || 'Gagal masuk menggunakan Google OAuth.');
                    return;
                  }
                  setSuccessMsg('Autentikasi Google terverifikasi! Mengarahkan...');
                  router.replace('/?mode=admin');
                  router.refresh();
                } catch {
                  setErrorMsg('Gagal memverifikasi sesi Google ke server.');
                } finally {
                  setIsSubmitting(false);
                }
              }}
              onFailure={(err) => {
                setErrorMsg(err?.details || err?.error || 'Login Google dibatalkan.');
              }}
            />

            <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-stone-500">
              <Sparkles className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>Dilindungi JWT HttpOnly Cookie &bull; Sliding Session 4 Jam</span>
            </div>
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
        <span>&bull;</span>
        <Link href="/" className="hover:text-[#8B6914] hover:underline">
          Katalog Tema
        </Link>
      </footer>
    </main>
  );
}
