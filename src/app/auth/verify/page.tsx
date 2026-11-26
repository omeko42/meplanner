'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
import { BrandLoader } from '@/components/ui/BrandLoader';

type VerifyState = 'checking' | 'success' | 'error';

export default function AuthVerifyPage() {
  return (
    <Suspense fallback={<VerifyShell state="checking" message="" />}>
      <AuthVerifyContent />
    </Suspense>
  );
}

function VerifyShell({
  state,
  message,
}: {
  state: VerifyState;
  message: string;
}) {
  if (state === 'checking') {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-[#FAF8F5] px-5">
        <BrandLoader size="lg" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center bg-[#FAF8F5] px-5 py-12">
      <div className="w-full max-w-md rounded-3xl border border-stone-200/70 bg-white p-8 text-center shadow-sm animate-meplan-enter">
        <div className="mb-5 flex justify-center">
          <WeddingRingsIcon className="h-11 w-11" />
        </div>

        <h1 className="text-xl font-extrabold tracking-tight text-stone-900">
          {state === 'success' ? 'Verifikasi berhasil' : 'Verifikasi gagal'}
        </h1>

        <p
          className={`mt-2.5 text-sm leading-relaxed ${
            state === 'error' ? 'text-rose-700' : 'text-stone-600'
          }`}
          role="status"
          aria-live="polite"
        >
          {message}
        </p>

        {state === 'error' && (
          <a
            href="/"
            className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-stone-900 px-6 text-sm font-bold text-white transition-colors hover:bg-stone-800"
          >
            Kembali ke Halaman Utama
          </a>
        )}
      </div>
    </main>
  );
}

function AuthVerifyContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<VerifyState>('checking');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token') || '';
    const email = searchParams.get('email') || '';

    if (!token || !email) {
      setState('error');
      setMessage(
        'Tautan verifikasi tidak lengkap. Silakan minta tautan baru dari halaman pendaftaran.'
      );
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const res = await fetch(
          `/api/auth/verify?token=${encodeURIComponent(
            token
          )}&email=${encodeURIComponent(email)}`,
          { cache: 'no-store', credentials: 'include' }
        );
        const json = await res.json().catch(() => ({}));

        if (cancelled) return;

        if (res.ok && json.success) {
          setState('success');
          setMessage('Email terverifikasi. Workspace Anda sudah aktif.');
          // Give the user a moment to read the confirmation, then bring
          // them into the app with the fresh session cookie.
          setTimeout(() => {
            window.location.href = '/';
          }, 2200);
          return;
        }

        setState('error');
        setMessage(
          json.error ||
            'Tautan verifikasi tidak valid atau sudah kedaluwarsa. Silakan daftar ulang.'
        );
      } catch {
        if (cancelled) return;
        setState('error');
        setMessage(
          'Terjadi kesalahan jaringan saat verifikasi. Silakan coba lagi atau hubungi admin.'
        );
      }
    };

    void verify();
    return () => {
      cancelled = true;
    };
  }, [searchParams]);

  return <VerifyShell state={state} message={message} />;
}
