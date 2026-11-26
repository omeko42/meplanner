'use client';

import React from 'react';
import {
  Layers,
  Lock,
  LogOut,
  RefreshCw,
  ShieldCheck,
  UserCheck,
  X,
} from 'lucide-react';
import type { AdminUser } from '@/types';

export interface SessionRbacModalProps {
  isOpen: boolean;
  onClose: () => void;
  adminUser: AdminUser;
  isSuperadmin: boolean;
  isPanitia: boolean;
  onRefreshSession: () => void;
  onLogout: () => void;
}

export const SessionRbacModal: React.FC<SessionRbacModalProps> = ({
  isOpen,
  onClose,
  adminUser,
  isSuperadmin,
  isPanitia,
  onRefreshSession,
  onLogout,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[75] bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-[#D4AF37]/50 overflow-hidden text-xs sm:text-sm my-auto">
        <div className="px-5 py-4 border-b border-[#D4AF37]/25 bg-gradient-to-r from-[#FAF3E3] via-[#FFFDF9] to-[#FAF3E3] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8B6914] text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-stone-900 flex items-center gap-2">
                <span>Status Akun &amp; Hak Akses</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                  Aktif
                </span>
              </h3>
              <p className="text-[11px] text-stone-500">
                Ringkasan profil pengelola dan batasan akses ruang kerja Anda
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-stone-100 flex items-center justify-center text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#8B6914] uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Identitas Akun &amp; Peran Sesi
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-stone-900 text-[#D4AF37] text-[10px] font-mono font-bold">
                {adminUser.role}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-[10px] text-stone-500">Nama Lengkap</p>
                <p className="font-bold text-stone-900">{adminUser.nama}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-500">Username Login</p>
                <p className="font-mono font-bold text-[#8B6914]">@{adminUser.username}</p>
              </div>
              <div>
                <p className="text-[10px] text-stone-500">Email Terverifikasi</p>
                <p className="font-medium text-stone-800">
                  {adminUser.email || '(Login Sandi Bawaan)'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-stone-500">Ruang Kerja Aktif</p>
                <p className="font-bold text-emerald-700 truncate">
                  {isSuperadmin
                    ? 'Semua Klien (Multi-Tenant Master)'
                    : adminUser.clientName || adminUser.clientId || 'Klien Utama'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-2.5 shadow-2xs">
            <span className="text-[11px] font-extrabold text-stone-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#8B6914]" />
              Hak Akses Fitur
            </span>
            <div className="divide-y divide-stone-100 text-[11px]">
              <div className="py-2 flex items-center justify-between">
                <span className="text-stone-700">
                  Beralih Ruang Kerja Klien
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    isSuperadmin
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {isSuperadmin ? 'Diizinkan' : 'Khusus Pemilik'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-stone-700">
                  Pengelolaan Anggaran &amp; Vendor
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    !isPanitia
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-600'
                  }`}
                >
                  {!isPanitia ? 'Diizinkan' : 'Tidak Tersedia untuk Panitia'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-stone-700">
                  Daftar Tamu, Kuota Pax &amp; RSVP
                </span>
                <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                  Diizinkan
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-stone-700">Checklist Persiapan Acara</span>
                <span className="font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
                  Diizinkan
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-stone-700">
                  Desain Tema, Musik &amp; Konten Undangan
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    !isPanitia
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {!isPanitia ? 'Diizinkan' : 'Hanya Lihat'}
                </span>
              </div>
              <div className="py-2 flex items-center justify-between">
                <span className="text-stone-700">
                  Pengaturan Pembayaran &amp; Lisensi
                </span>
                <span
                  className={`font-bold px-2 py-0.5 rounded-md ${
                    isSuperadmin
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {isSuperadmin ? 'Diizinkan' : 'Dibatasi'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-stone-200 flex items-start gap-2.5 text-xs text-stone-600">
            <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Sesi login Anda dilindungi secara terenkripsi dan otomatis diperpanjang selama aktif.
              Setiap akun hanya dapat mengakses data acara pada ruang kerjanya masing-masing.
            </p>
          </div>
        </div>

        <div className="px-5 py-3.5 border-t border-stone-200/80 bg-stone-50 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onRefreshSession}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#8B6914]" />
            <span>Perpanjang Sesi Sekarang</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs transition-colors cursor-pointer"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onLogout();
              }}
              className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
