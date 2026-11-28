'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CalendarHeart,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import TurnstileWidget from '@/components/TurnstileWidget';
import {
  ReactGoogleLoginButton,
  type GoogleSelectableAccount,
} from '@/components/ReactGoogleLoginButton';
import {
  GooglePostAuthFlow,
  type GooglePostAuthSession,
} from '@/components/GooglePostAuthFlow';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
import { TURNSTILE_PUBLIC_SITE_KEY } from '@/lib/turnstileClient';

type AuthMode = 'LOGIN' | 'REGISTER';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>('LOGIN');

  // Login fields
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields
  const [regEmail, setRegEmail] = useState('');
  const [regName, setRegName] = useState('');
  const [regEventType, setRegEventType] = useState('WEDDING');

  // Shared state
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [googlePostAuth, setGooglePostAuth] =
    useState<GooglePostAuthSession | null>(null);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);
    setGooglePostAuth(null);
    setTurnstileToken('');
    setTurnstileResetKey((k) => k + 1);
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);
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
          identifier: username.trim(),
          username: username.trim(),
          password,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMsg(
          data?.error || 'Kredensial tidak valid. Periksa kembali username dan kata sandi.'
        );
        setErrorCode(data?.code || null);
        setTurnstileToken('');
        setTurnstileResetKey((k) => k + 1);
        return;
      }

      setSuccessMsg('Login berhasil! Membuka Planner Studio...');
      router.replace('/?mode=admin');
      router.refresh();
    } catch {
      setErrorMsg('Gagal menghubungi server autentikasi. Periksa koneksi internet Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setErrorCode(null);
    setSuccessMsg(null);

    if (!regEmail.trim() || !regName.trim()) {
      setErrorMsg('Nama acara/pasangan dan alamat email wajib diisi.');
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
          action: 'REGISTER_WORKSPACE',
          email: regEmail.trim(),
          displayName: regName.trim(),
          eventType: regEventType,
          packageId: 'GRATIS',
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data?.success) {
        setErrorMsg(data?.error || 'Pendaftaran gagal diproses.');
        setErrorCode(data?.code || null);
        setTurnstileToken('');
        setTurnstileResetKey((k) => k + 1);
        return;
      }

      setSuccessMsg(
        data.message ||
          'Link verifikasi telah dikirim ke email Anda. Buka tautan tersebut untuk mengaktifkan workspace!'
      );
    } catch {
      setErrorMsg('Gagal menghubungi server pendaftaran. Coba beberapa saat lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FAF8F5] text-stone-800 flex flex-col justify-between px-4 py-8">
      <div className="flex-1 flex flex-col justify-center max-w-md w-full mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-[#8B6914] transition-colors mb-5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Beranda MEPlan</span>
        </Link>

        <div className="bg-white rounded-3xl border border-[#D4AF37]/40 shadow-[0_20px_50px_rgba(140,115,75,0.12)] overflow-hidden animate-meplan-enter">
          <div className="px-6 pt-6 pb-5 bg-gradient-to-br from-[#FAF3E3] via-[#FFFDF9] to-[#F7ECDA] border-b border-[#D4AF37]/30">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/85 border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold tracking-wide">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>MEPlan</span>
              </div>
              <div className="w-9 h-9 rounded-xl bg-white p-1.5 shadow-2xs border border-[#D4AF37]/30">
                <WeddingRingsIcon className="w-full h-full" />
              </div>
            </div>
            <h1 className="text-xl font-extrabold text-stone-900 tracking-tight">
              {mode === 'LOGIN'
                ? 'Masuk ke Ruang Kerja Anda'
                : 'Buat Ruang Kerja Acara Gratis'}
            </h1>
            <p className="text-xs text-stone-600 mt-1 leading-relaxed">
              {mode === 'LOGIN'
                ? 'Kelola tamu VIP, buku kas RAB, checklist persiapan, dan undangan digital dalam satu panel terenkripsi.'
                : 'Daftar dalam hitungan detik untuk merancang undangan digital & kelola persiapan acara Anda secara mandiri.'}
            </p>

            {/* Animated Mode Switcher */}
            <div className="mt-4 grid grid-cols-2 gap-1 p-1 rounded-2xl bg-stone-900/5 border border-[#D4AF37]/25">
              <button
                type="button"
                onClick={() => switchMode('LOGIN')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'LOGIN'
                    ? 'bg-white text-stone-900 shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => switchMode('REGISTER')}
                className={`py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                  mode === 'REGISTER'
                    ? 'bg-white text-[#8B6914] shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                Daftar Gratis
              </button>
            </div>
          </div>

          <div className="p-6 space-y-5">
            {googlePostAuth ? (
              <GooglePostAuthFlow
                session={googlePostAuth}
                lang="ID"
                onAuthenticated={(_user, msg) => {
                  setGooglePostAuth(null);
                  setSuccessMsg(msg || 'Berhasil masuk! Membuka ruang kerja...');
                  router.replace('/?mode=admin');
                  router.refresh();
                }}
                onCancel={() => {
                  setGooglePostAuth(null);
                  setErrorMsg(null);
                }}
              />
            ) : (
            <>
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold space-y-2">
                <p>{errorMsg}</p>
                {errorCode === 'ACCOUNT_NOT_REGISTERED' && mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => switchMode('REGISTER')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-700 text-white text-[11px] font-bold hover:bg-rose-800 cursor-pointer"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Daftar Akun Gratis Sekarang &rarr;</span>
                  </button>
                )}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'LOGIN' ? (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                    placeholder="Masukkan username atau email Anda"
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
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#A67C32] hover:from-[#B68D40] hover:to-[#8B6914] text-white font-extrabold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <Lock className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memverifikasi Sesi...' : 'Masuk ke Planner Studio'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-[#8B6914]" />
                    <span>Nama Pasangan / Nama Acara</span>
                  </label>
                  <input
                    type="text"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="Contoh: Dimas & Rara"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#8B6914]" />
                    <span>Alamat Email Aktif</span>
                  </label>
                  <input
                    type="email"
                    autoComplete="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    placeholder="nama@gmail.com"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm focus:outline-none focus:border-[#C5A059] focus:bg-white transition-colors"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
                    <CalendarHeart className="w-3.5 h-3.5 text-[#8B6914]" />
                    <span>Kategori Acara</span>
                  </label>
                  <select
                    value={regEventType}
                    onChange={(e) => setRegEventType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] text-sm font-semibold focus:outline-none focus:border-[#C5A059] focus:bg-white"
                  >
                    <option value="WEDDING">Pernikahan / Wedding</option>
                    <option value="BIRTHDAY">Ulang Tahun / Sweet Seventeen</option>
                    <option value="GRADUATION">Wisuda & Syukuran</option>
                    <option value="CORPORATE">Rapat & Corporate Summit</option>
                    <option value="GALA">Gala Dinner & Penghargaan</option>
                  </select>
                </div>

                {TURNSTILE_PUBLIC_SITE_KEY && (
                  <div className="pt-1">
                    <TurnstileWidget
                      siteKey={TURNSTILE_PUBLIC_SITE_KEY}
                      action="register"
                      onToken={setTurnstileToken}
                      resetKey={turnstileResetKey}
                      theme="light"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#A67C32] hover:from-[#B68D40] hover:to-[#8B6914] text-white font-extrabold text-sm shadow-sm transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>
                    {isSubmitting ? 'Mengirim Verifikasi...' : 'Daftar & Kirim Link Verifikasi'}
                  </span>
                </button>
              </form>
            )}

            <div className="relative flex items-center justify-center">
              <div className="border-t border-stone-200 w-full" />
              <span className="bg-white px-3 text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
                {mode === 'LOGIN' ? 'Atau masuk instan dengan' : 'Atau daftar instan dengan'}
              </span>
              <div className="border-t border-stone-200 w-full" />
            </div>

            <ReactGoogleLoginButton
              buttonText={
                mode === 'LOGIN'
                  ? 'Lanjutkan dengan Akun Google'
                  : 'Daftar Instan dengan Akun Google'
              }
              onSuccess={async (googleRes) => {
                setErrorMsg(null);
                setErrorCode(null);
                if (!googleRes?.accessToken) {
                  setErrorMsg('Token Google tidak diterima.');
                  return;
                }
                if (googleRes.verifiedAdminUser) {
                  setSuccessMsg('Autentikasi Google terverifikasi! Mengarahkan...');
                  router.replace('/?mode=admin');
                  router.refresh();
                  return;
                }
                if (
                  (googleRes.serverErrorCode === 'ENTRY_HUB_REQUIRED' ||
                    googleRes.serverErrorCode === 'ROLE_SELECTION_REQUIRED' ||
                    googleRes.serverErrorCode === 'ACCOUNT_NOT_REGISTERED') &&
                  googleRes.accessToken
                ) {
                  setGooglePostAuth({
                    mode: 'ENTRY_HUB',
                    accessToken: googleRes.accessToken,
                    email: googleRes.profileObj?.email || '',
                    name: googleRes.profileObj?.name || '',
                    picture: googleRes.profileObj?.imageUrl || '',
                    accounts: googleRes.roleSelectionAccounts || [],
                    invitations: googleRes.invitationOptions || [],
                  });
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
                      promptChoice: true,
                      allowAutoRegister: false,
                    }),
                  });
                  const data = await res.json().catch(() => ({}));
                  if (res.ok && data?.success) {
                    setSuccessMsg('Autentikasi Google terverifikasi! Mengarahkan...');
                    router.replace('/?mode=admin');
                    router.refresh();
                    return;
                  }
                  if (
                    data?.code === 'ENTRY_HUB_REQUIRED' ||
                    data?.code === 'ROLE_SELECTION_REQUIRED' ||
                    data?.code === 'ACCOUNT_NOT_REGISTERED'
                  ) {
                    setGooglePostAuth({
                      mode: 'ENTRY_HUB',
                      accessToken: googleRes.accessToken,
                      email: data?.googleProfile?.email || googleRes.profileObj?.email || '',
                      name: data?.googleProfile?.name || googleRes.profileObj?.name || '',
                      picture:
                        data?.googleProfile?.picture || googleRes.profileObj?.imageUrl || '',
                      accounts: Array.isArray(data?.accounts)
                        ? (data.accounts as GoogleSelectableAccount[])
                        : [],
                      invitations: Array.isArray(data?.invitations)
                        ? data.invitations
                        : [],
                    });
                    return;
                  }
                  setErrorMsg(data?.error || 'Gagal masuk menggunakan Google OAuth.');
                  setErrorCode(data?.code || null);
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
              <span>Sesi Anda aman dan terenkripsi</span>
            </div>
            </>
            )}
          </div>
        </div>
      </div>

      <footer className="max-w-md w-full mx-auto mt-8 pt-4 border-t border-stone-200/80 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-stone-500">
        <span>&copy; 2026 MEPlanner</span>
        <span>&middot;</span>
        <Link href="/privacy" className="hover:text-stone-900 transition-colors">
          Kebijakan Privasi
        </Link>
        <span>&middot;</span>
        <Link href="/terms" className="hover:text-stone-900 transition-colors">
          Syarat &amp; Ketentuan
        </Link>
        <span>&middot;</span>
        <Link href="/" className="hover:text-stone-900 transition-colors">
          Katalog Tema
        </Link>
      </footer>
    </main>
  );
}
