'use client';

import React, { useEffect, useState } from 'react';
import type { GoogleLoginResponse } from '@/components/ReactGoogleLoginButton';

function formatDisplayNameFromEmail(email: string): {
  fullName: string;
  givenName: string;
  familyName: string;
} {
  const local = (email.split('@')[0] || 'User')
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, ' ')
    .trim();
  const parts = local
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  if (parts.length === 0) {
    return { fullName: 'Google User', givenName: 'Google', familyName: 'User' };
  }
  const givenName = parts[0];
  const familyName = parts.slice(1).join(' ');
  const fullName = parts.join(' ');
  return { fullName, givenName, familyName };
}

export default function GoogleOAuthPopupPage() {
  const [lang, setLang] = useState<'ID' | 'EN'>('ID');
  const [step, setStep] = useState<'EMAIL' | 'PASSWORD'>('EMAIL');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qLang = params.get('lang');
    if (qLang === 'EN') setLang('EN');
  }, []);

  const normalizedEmail = (() => {
    const clean = emailInput.trim().toLowerCase();
    if (!clean) return '';
    return clean.includes('@') ? clean : `${clean}@gmail.com`;
  })();

  const handleEmailStepSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!normalizedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setErrorMsg(
        lang === 'ID'
          ? 'Masukkan alamat email atau nomor telepon yang valid.'
          : 'Enter a valid email or phone number.'
      );
      return;
    }
    setStep('PASSWORD');
  };

  const handlePasswordStepSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!passwordInput) {
      setErrorMsg(
        lang === 'ID' ? 'Masukkan sandi.' : 'Enter a password.'
      );
      return;
    }

    const lower = normalizedEmail.toLowerCase();
    const isProtectedSuperadmin =
      lower === 'agungkrisdianto98@gmail.com' ||
      lower === 'e98.bisnis@gmail.com' ||
      lower === 'omeko42@gmail.com' ||
      lower.startsWith('agungkrisdianto98@') ||
      lower.startsWith('omeko42@');

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          identifier: normalizedEmail,
          password: passwordInput,
        }),
      });
      const json = await res.json();

      if (isProtectedSuperadmin && (!res.ok || !json.success || !json.user)) {
        setErrorMsg(
          lang === 'ID'
            ? 'Sandi salah. Coba lagi atau klik Lupa sandi untuk meresetnya.'
            : 'Wrong password. Try again or click Forgot password to reset it.'
        );
        setIsSubmitting(false);
        return;
      }

      if (!isProtectedSuperadmin && passwordInput.length < 4) {
        setErrorMsg(
          lang === 'ID'
            ? 'Sandi salah. Coba lagi.'
            : 'Wrong password. Try again.'
        );
        setIsSubmitting(false);
        return;
      }

      const verifiedUser =
        res.ok && json.success && json.user ? json.user : undefined;
      const { fullName, givenName, familyName } =
        formatDisplayNameFromEmail(normalizedEmail);
      const now = Date.now();
      const googleId = `google_${normalizedEmail.replace(/[^a-z0-9]/g, '')}`;
      const fakeJwt = `eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.${btoa(
        JSON.stringify({
          sub: googleId,
          email: normalizedEmail,
          name: verifiedUser?.nama || fullName,
          iat: Math.floor(now / 1000),
        })
      )}.sig`;

      const payload: GoogleLoginResponse = {
        googleId,
        tokenId: fakeJwt,
        accessToken: `ya29.${btoa(`${normalizedEmail}:${now}`)}`,
        profileObj: {
          googleId,
          imageUrl: '',
          email: normalizedEmail,
          name: verifiedUser?.nama || fullName,
          givenName,
          familyName,
        },
        tokenObj: {
          access_token: `ya29.${btoa(`${normalizedEmail}:${now}`)}`,
          id_token: fakeJwt,
          login_hint: normalizedEmail,
          scope: 'openid email profile',
          expires_in: 3599,
          first_issued_at: now,
          expires_at: now + 3599 * 1000,
        },
        verifiedAdminUser: verifiedUser,
      };

      if (typeof window !== 'undefined' && window.opener) {
        window.opener.postMessage(
          { type: 'REACT_GOOGLE_LOGIN_SUCCESS', payload },
          window.location.origin
        );
        window.close();
        return;
      }
    } catch {
      setErrorMsg(
        lang === 'ID'
          ? 'Terjadi kesalahan jaringan. Periksa koneksi Anda.'
          : 'Network error occurred. Please check your connection.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#202124] flex flex-col justify-between font-sans select-none">
      {/* Top OAuth Header Bar */}
      <div className="px-4 py-2.5 border-b border-[#dadce0] flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
          <path
            fill="#4285F4"
            d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
          />
          <path
            fill="#34A853"
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
          />
          <path
            fill="#FBBC05"
            d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
          />
          <path
            fill="#EA4335"
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
          />
        </svg>
        <span className="text-xs font-medium text-[#5f6368]">
          {lang === 'ID' ? 'Login dengan Google' : 'Sign in with Google'}
        </span>
      </div>

      {/* Center OAuth Card */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-10 py-6 max-w-[440px] w-full mx-auto">
        {/* Google Wordmark */}
        <div className="flex justify-center mb-4">
          <svg
            viewBox="0 0 75 24"
            width="75"
            height="24"
            aria-hidden="true"
          >
            <path
              fill="#4285F4"
              d="M9.24 8.19v2.46h5.88c-.18 1.38-.64 2.39-1.34 3.1-.86.86-2.2 1.8-4.54 1.8-3.62 0-6.45-2.92-6.45-6.54s2.83-6.54 6.45-6.54c1.95 0 3.38.77 4.43 1.76L15.4 2.5C13.94 1.08 11.98 0 9.24 0 4.28 0 .11 4.04.11 9s4.17 9 9.13 9c2.68 0 4.7-.88 6.28-2.52 1.62-1.62 2.13-3.91 2.13-5.75 0-.57-.04-1.1-.13-1.54H9.24z"
            />
            <path
              fill="#EA4335"
              d="M25 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"
            />
            <path
              fill="#FBBC05"
              d="M53.58 7.49h-.09c-.57-.68-1.67-1.3-3.06-1.3C47.53 6.19 45 8.72 45 12c0 3.26 2.53 5.81 5.43 5.81 1.39 0 2.49-.62 3.06-1.32h.09v.81c0 2.22-1.19 3.41-3.1 3.41-1.56 0-2.53-1.12-2.93-2.07l-2.22.92c.64 1.54 2.33 3.43 5.15 3.43 2.99 0 5.52-1.76 5.52-6.05V6.49h-2.42v1zm-2.93 8.03c-1.76 0-3.1-1.5-3.1-3.52 0-2.05 1.34-3.52 3.1-3.52 1.74 0 3.1 1.5 3.1 3.54.01 2.03-1.36 3.5-3.1 3.5z"
            />
            <path
              fill="#4285F4"
              d="M38 6.19c-3.21 0-5.83 2.44-5.83 5.81 0 3.34 2.62 5.81 5.83 5.81s5.83-2.46 5.83-5.81c0-3.37-2.62-5.81-5.83-5.81zm0 9.33c-1.76 0-3.28-1.45-3.28-3.52 0-2.09 1.52-3.52 3.28-3.52s3.28 1.43 3.28 3.52c0 2.07-1.52 3.52-3.28 3.52z"
            />
            <path fill="#34A853" d="M58 .24h2.51v17.57H58z" />
            <path
              fill="#EA4335"
              d="M68.26 15.52c-1.3 0-2.22-.59-2.82-1.76l7.77-3.21-.26-.66c-.48-1.3-1.96-3.7-4.97-3.7-2.99 0-5.48 2.35-5.48 5.81 0 3.26 2.46 5.81 5.76 5.81 2.66 0 4.2-1.63 4.84-2.57l-1.98-1.32c-.66.96-1.56 1.6-2.86 1.6zm-.18-7.15c1.03 0 1.91.53 2.2 1.28l-5.25 2.17c0-2.44 1.73-3.45 3.05-3.45z"
            />
          </svg>
        </div>

        {step === 'EMAIL' ? (
          <form onSubmit={handleEmailStepSubmit} className="space-y-6">
            <div className="text-center space-y-1.5">
              <h1 className="text-2xl font-normal text-[#202124]">
                {lang === 'ID' ? 'Login' : 'Sign in'}
              </h1>
              <p className="text-sm text-[#202124]">
                {lang === 'ID'
                  ? 'Lanjutkan ke '
                  : 'Continue to '}
                <span className="font-semibold text-[#1a73e8]">MEPlanner</span>
              </p>
            </div>

            <div className="space-y-2 pt-2">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  value={emailInput}
                  onChange={(e) => {
                    setEmailInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={
                    lang === 'ID' ? 'Email atau ponsel' : 'Email or phone'
                  }
                  className={`w-full h-14 px-4 rounded-md border text-base text-[#202124] placeholder:text-[#5f6368] outline-none transition-all ${
                    errorMsg
                      ? 'border-[#d93025] focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025]'
                      : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]'
                  }`}
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-[#d93025] pt-1">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current shrink-0 mt-0.5"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <p className="text-xs text-[#5f6368] leading-relaxed pt-3">
                {lang === 'ID'
                  ? 'Untuk melanjutkan, Google akan membagikan nama, alamat email, dan foto profil Anda ke MEPlanner.'
                  : 'To continue, Google will share your name, email address, and profile picture with MEPlanner.'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') window.close();
                }}
                className="text-sm font-medium text-[#1a73e8] hover:bg-[#f6fafe] px-3 py-2 rounded-md transition-colors cursor-pointer"
              >
                {lang === 'ID' ? 'Batal' : 'Cancel'}
              </button>

              <button
                type="submit"
                className="px-6 py-2.5 rounded-md bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium shadow-2xs transition-all cursor-pointer"
              >
                {lang === 'ID' ? 'Berikutnya' : 'Next'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handlePasswordStepSubmit} className="space-y-6">
            <div className="text-center space-y-2.5">
              <h1 className="text-2xl font-normal text-[#202124]">
                {lang === 'ID' ? 'Selamat datang' : 'Welcome'}
              </h1>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg('');
                    setPasswordInput('');
                    setStep('EMAIL');
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#dadce0] hover:bg-[#f8f9fa] text-xs font-medium text-[#3c4043] transition-colors cursor-pointer"
                >
                  <span className="w-5 h-5 rounded-full bg-[#1a73e8] text-white text-[10px] font-bold flex items-center justify-center">
                    {normalizedEmail.charAt(0).toUpperCase()}
                  </span>
                  <span className="truncate max-w-[220px]">
                    {normalizedEmail}
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-[#5f6368]"
                    fill="currentColor"
                  >
                    <path d="M7 10l5 5 5-5z" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder={
                    lang === 'ID'
                      ? 'Masukkan sandi Anda'
                      : 'Enter your password'
                  }
                  className={`w-full h-14 px-4 rounded-md border text-base text-[#202124] placeholder:text-[#5f6368] outline-none transition-all ${
                    errorMsg
                      ? 'border-[#d93025] focus:border-[#d93025] focus:ring-1 focus:ring-[#d93025]'
                      : 'border-[#dadce0] focus:border-[#1a73e8] focus:ring-1 focus:ring-[#1a73e8]'
                  }`}
                />
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 text-xs text-[#d93025]">
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 fill-current shrink-0 mt-0.5"
                  >
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                  <span>{errorMsg}</span>
                </div>
              )}

              <label className="inline-flex items-center gap-2.5 text-sm text-[#202124] cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="w-4 h-4 rounded border-[#5f6368] text-[#1a73e8] focus:ring-[#1a73e8]"
                />
                <span>
                  {lang === 'ID' ? 'Tampilkan sandi' : 'Show password'}
                </span>
              </label>
            </div>

            <div className="flex items-center justify-between pt-6">
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setPasswordInput('');
                  setStep('EMAIL');
                }}
                className="text-sm font-medium text-[#1a73e8] hover:bg-[#f6fafe] px-3 py-2 rounded-md transition-colors cursor-pointer"
              >
                {lang === 'ID' ? 'Ganti akun' : 'Switch account'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-md bg-[#1a73e8] hover:bg-[#1557b0] text-white text-sm font-medium shadow-2xs transition-all cursor-pointer disabled:opacity-60"
              >
                {isSubmitting
                  ? lang === 'ID'
                    ? 'Memverifikasi...'
                    : 'Verifying...'
                  : lang === 'ID'
                    ? 'Berikutnya'
                    : 'Next'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Bottom Language & Privacy Footer */}
      <div className="px-6 py-3 border-t border-[#f1f3f4] flex items-center justify-between text-xs text-[#5f6368]">
        <button
          type="button"
          onClick={() => setLang((prev) => (prev === 'ID' ? 'EN' : 'ID'))}
          className="hover:text-[#202124] cursor-pointer"
        >
          {lang === 'ID' ? 'Bahasa Indonesia ▾' : 'English (United States) ▾'}
        </button>
        <div className="flex items-center gap-4">
          <span>{lang === 'ID' ? 'Bantuan' : 'Help'}</span>
          <span>{lang === 'ID' ? 'Privasi' : 'Privacy'}</span>
          <span>{lang === 'ID' ? 'Persyaratan' : 'Terms'}</span>
        </div>
      </div>
    </div>
  );
}
