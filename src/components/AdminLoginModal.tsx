'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  X,
  KeyRound,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { AdminUser } from '@/types';

interface AdminLoginModalProps {
  isOpen: boolean;
  adminUsers: AdminUser[];
  onClose: () => void;
  onLoginSuccess: (user: AdminUser) => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  adminUsers,
  onClose,
  onLoginSuccess,
}) => {
  const [identifier, setIdentifier] = useState('agungkrisdianto98@gmail.com');
  const [password, setPassword] = useState('Nikah2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim().toLowerCase();
    const cleanPw = password.trim();

    const matched = adminUsers.find(
      (u) =>
        (u.username.toLowerCase() === cleanId ||
          u.email.toLowerCase() === cleanId ||
          u.nama.toLowerCase().includes(cleanId)) &&
        u.password === cleanPw
    );

    if (!matched) {
      setErrorMsg(
        'Username/Email atau Password tidak sesuai. Gunakan akun preset di bawah atau password default: Nikah2026!'
      );
      return;
    }

    setErrorMsg('');
    onLoginSuccess(matched);
  };

  const handleQuickLogin = (user: AdminUser) => {
    setErrorMsg('');
    onLoginSuccess(user);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-amber-300/70">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A192F] via-[#112240] to-[#0A192F] text-white p-6 relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-400/50 flex items-center justify-center text-amber-300 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Portal Khusus Pengantin &amp; Keluarga
              </span>
              <h3 className="font-serif text-xl font-bold text-white">
                Login Wedding Planner
              </h3>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs sm:text-sm">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Email / Username Admin
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="agungkrisdianto98@gmail.com / admin"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A192F] focus:outline-none bg-slate-50 font-medium text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Kata Sandi Admin</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan kata sandi..."
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:border-[#0A192F] focus:outline-none bg-slate-50 font-medium text-slate-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all"
          >
            <KeyRound className="w-4 h-4" />
            Masuk ke Dashboard Manajemen Pernikahan
          </button>

          {/* 1-Click Quick Access for Bride/Groom & Family */}
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Akses Cepat (1-Klik Login Pengantin &amp; Panitia):
            </p>
            <div className="grid grid-cols-1 gap-2">
              {adminUsers.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickLogin(u)}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/60 flex items-center justify-between gap-2 transition-all"
                >
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-slate-900 truncate">{u.nama}</p>
                    <p className="text-[11px] text-slate-500 truncate">{u.jabatan}</p>
                  </div>
                  <span className="px-2.5 py-1 rounded-lg bg-[#0A192F] text-amber-300 text-[10px] font-bold shrink-0">
                    Masuk
                  </span>
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
