'use client';

import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartHandshake,
  KeyRound,
  Link2,
  Loader2,
  Lock,
  MailOpen,
  ShieldCheck,
  Sparkles,
  User,
  UserPlus,
} from 'lucide-react';
import type { AdminUser, EventCategoryType } from '@/types';
import type {
  GoogleInvitationOption,
  GoogleSelectableAccount,
} from '@/components/ReactGoogleLoginButton';

export interface GooglePostAuthSession {
  mode: 'ENTRY_HUB' | 'ROLE_PICKER' | 'UNREGISTERED_CHOICE';
  accessToken: string;
  email: string;
  name: string;
  picture?: string;
  accounts?: GoogleSelectableAccount[];
  invitations?: GoogleInvitationOption[];
}

interface GooglePostAuthFlowProps {
  session: GooglePostAuthSession;
  lang?: 'ID' | 'EN';
  onAuthenticated: (user: AdminUser, message?: string) => void;
  onOpenInvitation?: (target: { clientId?: string; accessCode?: string }) => void;
  onCancel: () => void;
}

type HubTab = 'WORKSPACE' | 'INVITATION' | 'LINK' | 'CREATE';

export const GooglePostAuthFlow: React.FC<GooglePostAuthFlowProps> = ({
  session,
  lang = 'ID',
  onAuthenticated,
  onOpenInvitation,
  onCancel,
}) => {
  const isEn = lang === 'EN';
  const linkedAccounts = session.accounts || [];
  const linkedInvitations = session.invitations || [];
  const hasLinkedAccounts = linkedAccounts.length > 0;

  const [activeTab, setActiveTab] = useState<HubTab>(
    hasLinkedAccounts ? 'WORKSPACE' : 'LINK'
  );
  const [selectedSuperClientId, setSelectedSuperClientId] = useState<string>(
    linkedInvitations[0]?.clientId || 'client-utama'
  );

  // Invitation check-only state
  const [inviteCodeInput, setInviteCodeInput] = useState('');

  // Link existing account state
  const [linkIdentifier, setLinkIdentifier] = useState('');
  const [linkPassword, setLinkPassword] = useState('');
  const [showLinkPw, setShowLinkPw] = useState(false);

  // Create new workspace state
  const [accountMode, setAccountMode] = useState<'CLIENT' | 'PLANNER'>('CLIENT');
  const [newWorkspaceTitle, setNewWorkspaceTitle] = useState(session.name || '');
  const [newEventType, setNewEventType] = useState<EventCategoryType>('WEDDING');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSelectLinkedAccount = async (
    accountId: string,
    overrideClientId?: string
  ) => {
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
          ...(overrideClientId ? { selectedClientId: overrideClientId } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json?.success || !json?.user) {
        setErrorMsg(
          json?.error ||
            (isEn
              ? 'Could not open the selected workspace. Please try again.'
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

  const handleOpenInvitationTarget = (target: {
    clientId?: string;
    accessCode?: string;
  }) => {
    if (onOpenInvitation) {
      onOpenInvitation(target);
      return;
    }
    if (typeof window !== 'undefined') {
      if (target.accessCode) {
        window.location.href = `/${encodeURIComponent(target.accessCode)}`;
      } else if (target.clientId) {
        window.location.href = `/?client=${encodeURIComponent(target.clientId)}`;
      }
    }
  };

  const handleCheckInvitationCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const raw = inviteCodeInput.trim();
    if (!raw) {
      setErrorMsg(
        isEn
          ? 'Enter an invitation code or paste the invitation link.'
          : 'Masukkan kode undangan atau tempel tautan undangan.'
      );
      return;
    }
    // Extract token if full URL was pasted
    let extracted = raw;
    try {
      if (/^https?:\/\//i.test(raw)) {
        const u = new URL(raw);
        const qCode = u.searchParams.get('code') || u.searchParams.get('k');
        if (qCode) {
          extracted = qCode.trim();
        } else {
          const seg = u.pathname.replace(/^\/+|\/+$/g, '');
          if (seg) extracted = seg;
        }
      }
    } catch {
      // Keep raw input
    }
    handleOpenInvitationTarget({ accessCode: extracted });
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
          ? 'Please enter your couple, event, or studio name.'
          : 'Masukkan nama pasangan, acara, atau studio EO/WO Anda.'
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

  const tabs: Array<{ id: HubTab; label: string; show: boolean }> = [
    {
      id: 'WORKSPACE',
      label: isEn ? 'My Access' : 'Akses Saya',
      show: hasLinkedAccounts,
    },
    {
      id: 'INVITATION',
      label: isEn ? 'View Invite' : 'Cek Undangan',
      show: true,
    },
    {
      id: 'LINK',
      label: isEn ? 'Join Event' : 'Gabung Tim',
      show: true,
    },
    {
      id: 'CREATE',
      label: isEn ? 'New Event' : 'Buat Baru',
      show: true,
    },
  ];
  const visibleTabs = tabs.filter((t) => t.show);

  return (
    <div className="space-y-4">
      {/* Verified Google Identity Pill */}
      <div className="flex items-center justify-between gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/75 px-3.5 py-2.5">
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
          <span>{isEn ? 'Change' : 'Ganti'}</span>
        </button>
      </div>

      {/* Header prompt */}
      <div>
        <h3 className="text-sm font-extrabold text-stone-900">
          {isEn ? 'Choose how you want to continue' : 'Ingin masuk sebagai apa?'}
        </h3>
        <p className="text-[11px] text-stone-500 mt-0.5 leading-relaxed">
          {isEn
            ? 'Open your event workspace, view a digital invitation, join an event as client/EO/committee, or create a new event.'
            : 'Pilih membuka ruang kerja acara, sekadar mengecek undangan, bergabung sebagai klien/EO/panitia, atau membuat acara baru.'}
        </p>
      </div>

      {/* Navigation Tabs */}
      <div
        className={`grid gap-1 p-1 rounded-2xl bg-stone-100 border border-stone-200/80 ${
          visibleTabs.length === 4 ? 'grid-cols-4' : 'grid-cols-3'
        }`}
      >
        {visibleTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setActiveTab(t.id);
              setErrorMsg('');
            }}
            className={`py-2 px-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer truncate ${
              activeTab === t.id
                ? 'bg-white text-stone-950 shadow-2xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-800 leading-relaxed"
        >
          {errorMsg}
        </div>
      )}

      {/* TAB 1: LINKED ROLES & WORKSPACES */}
      {activeTab === 'WORKSPACE' && hasLinkedAccounts && (
        <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-0.5">
          {linkedAccounts.map((acc) => {
            const isSuper = acc.accountKind === 'SUPERADMIN';
            const kindBadge = isSuper
              ? {
                  label: 'Superadmin',
                  cls: 'bg-amber-100 text-amber-900 border-amber-300',
                  Icon: ShieldCheck,
                }
              : acc.accountKind === 'PLANNER'
                ? {
                    label: isEn ? 'EO / Committee' : 'EO / Panitia',
                    cls: 'bg-sky-100 text-sky-900 border-sky-200',
                    Icon: Briefcase,
                  }
                : {
                    label: isEn ? 'Client / Host' : 'Klien / Mempelai',
                    cls: 'bg-emerald-100 text-emerald-900 border-emerald-200',
                    Icon: HeartHandshake,
                  };
            const BadgeIcon = kindBadge.Icon;

            return (
              <div
                key={acc.id}
                className="rounded-2xl border border-stone-200/90 bg-white p-3.5 space-y-2.5 hover:border-[#C5A059] transition-colors"
              >
                <div className="flex items-start justify-between gap-2.5">
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
                    <p className="text-xs sm:text-[13px] font-bold text-stone-900 leading-snug">
                      {acc.humanLabel || `${acc.clientName} — ${acc.jabatan || acc.nama}`}
                    </p>
                    <p className="text-[11px] text-stone-500 truncate">
                      {acc.nama}
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() =>
                      void handleSelectLinkedAccount(
                        acc.id,
                        isSuper ? selectedSuperClientId : undefined
                      )
                    }
                    className="shrink-0 px-3 py-2 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-[11px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>{isEn ? 'Enter' : 'Masuk'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </>
                    )}
                  </button>
                </div>

                {/* For Superadmin: let them choose which client workspace to enter */}
                {isSuper && linkedInvitations.length > 0 && (
                  <div className="pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-semibold text-stone-400 mr-1">
                      {isEn ? 'Target event:' : 'Buka acara:'}
                    </span>
                    {linkedInvitations.map((inv) => (
                      <button
                        key={inv.clientId}
                        type="button"
                        onClick={() => setSelectedSuperClientId(inv.clientId)}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-colors cursor-pointer ${
                          selectedSuperClientId === inv.clientId
                            ? 'bg-[#FAF3E3] border-[#C5A059] text-[#8B6914]'
                            : 'bg-stone-50 border-stone-200 text-stone-600 hover:border-stone-300'
                        }`}
                      >
                        {inv.eventLabel}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: CHECK / VIEW INVITATION ONLY */}
      {activeTab === 'INVITATION' && (
        <div className="space-y-3">
          {linkedInvitations.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-stone-700">
                {isEn
                  ? 'Invitations linked to your account:'
                  : 'Undangan yang terhubung dengan akun Anda:'}
              </p>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto">
                {linkedInvitations.map((inv) => (
                  <button
                    key={inv.clientId}
                    type="button"
                    onClick={() =>
                      handleOpenInvitationTarget({ clientId: inv.clientId })
                    }
                    className="w-full text-left px-3.5 py-2.5 rounded-xl border border-stone-200 hover:border-[#C5A059] bg-white hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#FAF3E3] text-[#8B6914] flex items-center justify-center shrink-0">
                        <MailOpen className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-stone-900 truncate">
                          {inv.eventLabel}
                        </p>
                        <p className="text-[10px] text-stone-500 truncate">
                          {inv.subtitle || 'Lihat Undangan Digital'}
                        </p>
                      </div>
                    </div>
                    <span className="text-[11px] font-bold text-[#8B6914] shrink-0">
                      {isEn ? 'Open →' : 'Buka →'}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleCheckInvitationCodeSubmit}
            className="space-y-2.5 pt-1 border-t border-stone-100"
          >
            <label className="block text-xs font-bold text-stone-800">
              {isEn
                ? 'Open by Guest Code or Invitation Link'
                : 'Buka dengan Kode atau Tautan Undangan Tamu'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                placeholder={
                  isEn
                    ? 'Paste code or https://meplan.biz.id/...'
                    : 'Masukkan kode atau link undangan...'
                }
                className="flex-1 min-w-0 h-10 px-3 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-stone-900 outline-none focus:border-[#C5A059]"
              />
              <button
                type="submit"
                className="px-4 h-10 rounded-xl bg-stone-950 hover:bg-stone-800 text-white text-xs font-bold shrink-0 cursor-pointer transition-colors"
              >
                {isEn ? 'View' : 'Buka'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: JOIN / LINK EXISTING CLIENT, FAMILY, EO, OR COMMITTEE ACCOUNT */}
      {activeTab === 'LINK' && (
        <form onSubmit={handleLinkExistingAccount} className="space-y-3">
          <div className="rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 px-3 py-2 text-[11px] text-stone-600 leading-relaxed">
            {isEn
              ? 'Joining an event as Client, Family, EO, or Committee? Enter your given username & password once to permanently link this Google account.'
              : 'Masuk sebagai Mempelai, Keluarga, EO, atau Panitia pada acara yang sudah ada? Masukkan username & sandi 1× untuk menautkan akun Google ini.'}
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
                placeholder="Contoh: selocantik1998 atau tim_wo"
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
            className="w-full h-11 rounded-xl bg-stone-950 hover:bg-stone-800 disabled:opacity-60 text-white font-bold text-xs sm:text-sm inline-flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Link2 className="w-4 h-4" />
            )}
            <span>
              {isSubmitting
                ? isEn
                  ? 'Linking Google Account...'
                  : 'Menautkan Akun Google...'
                : isEn
                  ? 'Link Google & Enter Event'
                  : 'Tautkan Google & Masuk Acara'}
            </span>
          </button>
        </form>
      )}

      {/* TAB 4: CREATE NEW EVENT / EO STUDIO WORKSPACE */}
      {activeTab === 'CREATE' && (
        <form onSubmit={handleCreateNewWorkspace} className="space-y-3">
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
                  ? 'Create your own wedding or private event'
                  : 'Buat undangan & kelola acara pribadi'}
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
                {isEn ? 'EO / Event Planner' : 'EO / Wedding Organizer'}
              </p>
              <p className="text-[10px] text-stone-500 mt-0.5 leading-snug">
                {isEn
                  ? 'Coordinate client events, vendors & guests'
                  : 'Kelola acara klien, tim panitia & tamu'}
              </p>
            </button>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              {accountMode === 'PLANNER'
                ? isEn
                  ? 'EO / Planner Studio Name'
                  : 'Nama Studio EO / WO'
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
                    ? 'Start as EO / Planner (Free)'
                    : 'Mulai sebagai EO / WO (Gratis)'
                  : isEn
                    ? 'Create Free Event Workspace'
                    : 'Buat Ruang Acara Gratis'}
            </span>
          </button>
        </form>
      )}
    </div>
  );
};
