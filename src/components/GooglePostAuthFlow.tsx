'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartHandshake,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import type { AdminUser, EventCategoryType } from '@/types';
import type { GoogleSelectableAccount } from '@/components/ReactGoogleLoginButton';

export interface GooglePostAuthSession {
  mode: 'ROLE_PICKER' | 'UNREGISTERED_CHOICE';
  accessToken: string;
  email: string;
  name: string;
  picture?: string;
  accounts?: GoogleSelectableAccount[];
}

interface GooglePostAuthFlowProps {
  session: GooglePostAuthSession;
  lang?: 'ID' | 'EN';
  onAuthenticated: (user: AdminUser, message?: string) => void;
  onCancel: () => void;
}

export const GooglePostAuthFlow: React.FC<GooglePostAuthFlowProps> = ({
  session,
  lang = 'ID',
  onAuthenticated,
  onCancel,
}) => {
  const isEn = lang === 'EN';
  const [choiceTab, setChoiceTab] = useState<'LINK' | 'CREATE'>('LINK');
  const [linkIdentifier, setLinkIdentifier] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPw, setShowLinkPw] = useState(false);

  const [accountMode, setAccountMode] = useState<'CLIENT' | 'PLANNER'>('CLIENT');
  const [newWorkspaceTitle, setNewWorkspaceTitle] = useState(session.name || '');
  const [newEventType, setNewEventType] = useState<EventCategoryType>('WEDDING');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectLinkedAccount = async (accountId: string) => {
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GOOGLE_OAUTH_LOGIN',
          accessToken: session.accessToken,
          selectedAccountId: accountId,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success || !json?.user) {
        setErrorMsg(
          json?.error ||
            (isEn
              ? 'Could not switch to the selected workspace. Please try again.'
              : 'Gagal membuka ruang kerja pilihan. Silakan coba lagi.')
        );
        return;
      }
      onAuthenticated(
        json.user as AdminUser,
        isEn
          ? `Signed in as ${json.user.nama}.`
          : `Berhasil masuk sebagai ${json.user.nama}.`
      );
    } catch {
      setErrorMsg(
        isEn
          ? 'Network error while verifying your Google session.'
          : 'Gagal menghubungi server autentikasi. Periksa koneksi internet Anda.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLinkExistingAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!linkIdentifier.trim() || !linkPassword) {
      setErrorMsg(
        isEn
          ? 'Please enter the username and password of your existing account.'
          : 'Masukkan username dan kata sandi akun yang sudah terdaftar.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'LINK_GOOGLE_ACCOUNT',
          accessToken: session.accessToken,
          identifier: linkIdentifier.trim(),
          password: linkPassword,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success || !json?.user) {
        setErrorMsg(
          json?.error ||
            (isEn
              ? 'Username or password does not match any registered account.'
              : 'Username atau kata sandi belum cocok dengan akun terdaftar.')
        );
        return;
      }
      onAuthenticated(
        json.user as AdminUser,
        json.message ||
          (isEn
            ? `Google account ${session.email} linked successfully!`
            : `Akun Google ${session.email} berhasil ditautkan!`)
      );
    } catch {
      setErrorMsg(
        isEn
          ? 'Unable to reach authentication server.'
          : 'Gagal menghubungi server. Coba beberapa saat lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNewWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const title = newWorkspaceTitle.trim();
    if (!title) {
      setErrorMsg(
        isEn
          ? 'Please enter your couple or event / studio name.'
          : 'Masukkan nama pasangan, acara, atau nama studio WO Anda.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GOOGLE_OAUTH_LOGIN',
          accessToken: session.accessToken,
          allowAutoRegister: true,
          displayName: title,
          eventType: newEventType,
          accountMode,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success || !json?.user) {
        setErrorMsg(
          json?.error ||
            (isEn
              ? 'Could not create workspace with Google.'
              : 'Gagal membuat ruang kerja baru dengan Google.')
        );
        return;
      }
      onAuthenticated(
        json.user as AdminUser,
        isEn
          ? `Workspace "${title}" is ready!`
          : `Ruang kerja "${title}" siap digunakan!`
      );
    } catch {
      setErrorMsg(
        isEn
          ? 'Unable to reach server. Please try again.'
          : 'Gagal menghubungi server. Silakan coba lagi.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Verified Google Identity Pill */}
      <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/70 px-3.5 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          {session.picture ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={session.picture}
              alt={session.name}
              className="w-8 h-8 rounded-full border border-emerald-300 shrink-0 object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white text-xs font-extrabold flex items-center justify-center shrink-0">
              {(session.name || session.email).charAt(0).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-xs font-bold text-stone-900 truncate">
              {session.name || session.email}
            </p>
            <p className="text-[11px] text-emerald-800 truncate flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{session.email}</span>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="text-[11px] font-bold text-stone-500 hover:text-stone-900 inline-flex items-center gap-1 shrink-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{isEn ? 'Back' : 'Ganti'}</span>
        </button>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800 leading-relaxed"
        >
          {errorMsg}
        </div>
      )}

      {session.mode === 'ROLE_PICKER' && (session.accounts?.length || 0) > 0 ? (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">
              {isEn
                ? 'Choose Role & Workspace'
                : 'Pilih Peran & Ruang Kerja'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              {isEn
                ? 'Your Google account has access to multiple workspaces. Choose how you want to sign in:'
                : 'Email Google ini terhubung ke beberapa ruang kerja. Pilih ingin masuk sebagai apa:'}
            </p>
          </div>

          <div className="space-y-2">
            {(session.accounts || []).map((acc) => {
              const kindBadge =
                acc.accountKind === 'SUPERADMIN'
                  ? {
                      label: 'Superadmin',
                      cls: 'bg-amber-100 text-amber-900 border-amber-300',
                      Icon: ShieldCheck,
                    }
                  : acc.accountKind === 'PLANNER'
                    ? {
                        label: isEn ? 'Event Planner / Committee' : 'Planner / Panitia',
                        cls: 'bg-sky-100 text-sky-900 border-sky-200',
                        Icon: Briefcase,
                      }
                    : {
                        label: isEn ? 'Client / Event Host' : 'Klien / Mempelai',
                        cls: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                        Icon: HeartHandshake,
                      };
              const BadgeIcon = kindBadge.Icon;
              return (
                <button
                  key={acc.id}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => void handleSelectLinkedAccount(acc.id)}
                  className="w-full text-left p-3.5 rounded-2xl border border-stone-200 hover:border-[#C5A059] bg-white hover:bg-[#FAF8F5] transition-all flex items-start justify-between gap-3 cursor-pointer disabled:opacity-60"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${kindBadge.cls}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{kindBadge.label}</span>
                      </span>
                      <span className="text-[11px] font-mono text-stone-400">
                        @{acc.username}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-stone-900 truncate">
                      {acc.clientName}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {acc.nama}
                      {acc.jabatan ? ` • ${acc.jabatan}` : ''}
                    </p>
                  </div>
                  <div className="shrink-0 mt-1 text-[#8B6914] text-xs font-bold">
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <span>{isEn ? 'Open →' : 'Masuk →'}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="space-y-3.5">
          <div>
            <h3 className="text-sm font-extrabold text-stone-900">
              {isEn
                ? 'How would you like to continue?'
                : 'Ingin masuk sebagai apa dengan Google ini?'}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
              {isEn
                ? 'Link this Google email to an existing client/planner account, or create a brand-new workspace.'
                : 'Tautkan Gmail ini ke akun klien/panitia yang sudah ada, atau buat ruang kerja acara baru.'}
            </p>
          </div>

          {/* Choice Switcher */}
          <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-stone-100 border border-stone-200/80">
            <button
              type="button"
              onClick={() => {
                setChoiceTab('LINK');
                setErrorMsg('');
              }}
              className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                choiceTab === 'LINK'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Link2 className="w-3.5 h-3.5 text-[#8B6914]" />
              <span>{isEn ? 'Link Existing' : 'Tautkan Akun Klien'}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setChoiceTab('CREATE');
                setErrorMsg('');
              }}
              className={`py-2 px-2.5 rounded-xl text-[11px] font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                choiceTab === 'CREATE'
                  ? 'bg-white text-[#8B6914] shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 text-[#8B6914]" />
              <span>{isEn ? 'New Workspace' : 'Buat Ruang Baru'}</span>
            </button>
          </div>

          {choiceTab === 'LINK' ? (
            <form onSubmit={handleLinkExistingAccount} className="space-y-3">
              <div className="rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 px-3 py-2 text-[11px] text-stone-600 leading-relaxed">
                {isEn
                  ? 'Already have a client, family, or committee username? Enter it once below to permanently link this Google account.'
                  : 'Sudah punya username & kata sandi dari mempelai / penyelenggara? Masukkan 1× saja agar ke depan tinggal 1 klik Google.'}
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isEn ? 'Registered Username' : 'Username Akun Terdaftar'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={linkIdentifier}
                    onChange={(e) => setLinkIdentifier(e.target.value)}
                    placeholder={
                      isEn ? 'e.g. bride_account' : 'Contoh: username akun klien/panitia'
                    }
                    className="w-full h-10 pl-9 pr-3.5 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 outline-none focus:border-[#C5A059]"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isEn ? 'Account Password' : 'Kata Sandi Akun'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showLinkPw ? 'text' : 'password'}
                    value={linkPassword}
                    onChange={(e) => setLinkPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full h-10 pl-9 pr-10 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 outline-none focus:border-[#C5A059]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowLinkPw((p) => !p)}
                    className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-700 flex items-center justify-center absolute right-1 top-1/2 -translate-y-1/2 cursor-pointer"
                  >
                    {showLinkPw ? (
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
                className="w-full h-11 rounded-xl bg-stone-900 hover:bg-stone-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <KeyRound className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? isEn
                      ? 'Linking Google Account...'
                      : 'Menautkan Akun Google...'
                    : isEn
                      ? 'Link Google & Sign In'
                      : 'Tautkan Google & Masuk'}
                </span>
              </button>
            </form>
          ) : (
            <form onSubmit={handleCreateNewWorkspace} className="space-y-3">
              {/* Role Selection: Client vs Planner */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAccountMode('CLIENT')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    accountMode === 'CLIENT'
                      ? 'border-[#C5A059] bg-[#FAF3E3]/70 ring-1 ring-[#C5A059]/40'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4 text-[#8B6914] mb-1" />
                  <p className="text-xs font-extrabold text-stone-900">
                    {isEn ? 'Event Client' : 'Klien / Mempelai'}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                    {isEn
                      ? 'Manage your own wedding or personal event'
                      : 'Kelola acara pernikahan atau acara pribadi sendiri'}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setAccountMode('PLANNER')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                    accountMode === 'PLANNER'
                      ? 'border-[#C5A059] bg-[#FAF3E3]/70 ring-1 ring-[#C5A059]/40'
                      : 'border-stone-200 bg-white hover:border-stone-300'
                  }`}
                >
                  <Briefcase className="w-4 h-4 text-[#8B6914] mb-1" />
                  <p className="text-xs font-extrabold text-stone-900">
                    {isEn ? 'Event Planner / WO' : 'Event Planner / WO'}
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                    {isEn
                      ? 'Run studio workspace & coordinate clients'
                      : 'Kelola studio WO, vendor, dan tamu klien'}
                  </p>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {accountMode === 'PLANNER'
                    ? isEn
                      ? 'Planner / WO Studio Name'
                      : 'Nama Studio WO / Planner'
                    : isEn
                      ? 'Couple or Event Name'
                      : 'Nama Pasangan / Judul Acara'}
                </label>
                <input
                  type="text"
                  value={newWorkspaceTitle}
                  onChange={(e) => setNewWorkspaceTitle(e.target.value)}
                  placeholder={
                    accountMode === 'PLANNER'
                      ? 'Contoh: Harmoni Wedding Organizer'
                      : 'Contoh: Andi & Rina'
                  }
                  className="w-full h-10 px-3.5 rounded-xl border border-stone-300 bg-white text-sm text-stone-900 outline-none focus:border-[#C5A059]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1">
                  {isEn ? 'Event Category' : 'Kategori Acara'}
                </label>
                <select
                  value={newEventType}
                  onChange={(e) =>
                    setNewEventType(e.target.value as EventCategoryType)
                  }
                  className="w-full h-10 px-3 rounded-xl border border-stone-300 bg-white text-sm font-medium text-stone-800 outline-none focus:border-[#C5A059]"
                >
                  <option value="WEDDING">Pernikahan / Wedding</option>
                  <option value="BIRTHDAY">Ulang Tahun / Sweet Seventeen</option>
                  <option value="GRADUATION">Wisuda &amp; Syukuran</option>
                  <option value="MEETING">Rapat &amp; Corporate Summit</option>
                  <option value="GALA_DINNER">Gala Dinner &amp; Penghargaan</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#A67C32] hover:from-[#B68D40] hover:to-[#8B6914] disabled:opacity-60 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                {isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {isSubmitting
                    ? isEn
                      ? 'Creating Workspace...'
                      : 'Menyiapkan Ruang Kerja...'
                    : accountMode === 'PLANNER'
                      ? isEn
                        ? 'Start as Event Planner (Free)'
                        : 'Mulai sebagai Event Planner (Gratis)'
                      : isEn
                        ? 'Create Free Event Workspace'
                        : 'Buat Ruang Acara Gratis'}
                </span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
