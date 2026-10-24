'use client';

import React, { useState } from 'react';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  KeyRound,
  AlertCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { AdminUser } from '@/types';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LOGIN',
          identifier: identifier.trim(),
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.user) {
        setErrorMsg(
          json.error || 'Username atau Kata Sandi tidak valid. Akses ditolak.'
        );
        return;
      }

      setIdentifier('');
      setPassword('');
      onLoginSuccess(json.user as AdminUser);
    } catch {
      setErrorMsg('Gagal menghubungi server otentikasi. Periksa koneksi Anda.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/45 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white/95 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[92dvh] overflow-y-auto shadow-[0_25px_70px_rgba(140,115,75,0.25)] border-t sm:border border-[#D4AF37]/40 text-stone-800 pb-safe">
        {/* Bright Pearl & Champagne Header */}
        <div className="bg-gradient-to-br from-[#FFFDF9] via-[#FAF6EE] to-[#F3E9D8] p-5 sm:p-6 relative border-b border-[#D4AF37]/25">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-stone-500 hover:text-stone-800 border border-stone-200/80 transition-colors"
            aria-label="Tutup"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3.5 pr-8">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-[#131629] to-[#090A14] border border-[#8B5CF6]/45 flex items-center justify-center shadow-sm shrink-0">
              <WeddingRingsIcon className="w-7 h-7 sm:w-8 sm:h-8" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#9A7B38] flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Portal Login Resmi
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                MEPlan — My Event Planner
              </h3>
              <p className="text-[10px] font-semibold text-[#8B6914]">
                by omeko11
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-stone-700 mb-1.5">
              Username Akun
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                autoComplete="username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Masukkan username akun..."
                className="w-full pl-10 pr-3.5 py-3 rounded-2xl border border-stone-200 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 focus:outline-none bg-[#FAF8F5] font-medium text-base sm:text-sm text-stone-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1.5">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-10 py-3 rounded-2xl border border-stone-200 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/20 focus:outline-none bg-[#FAF8F5] font-medium text-base sm:text-sm text-stone-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-1"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Memverifikasi Sesi...
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4" />
                Masuk ke Dashboard
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
