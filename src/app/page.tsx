'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicInvitationView } from '@/components/PublicInvitationView';
import { AdminDashboardView } from '@/components/AdminDashboardView';
import { AdminLoginModal } from '@/components/AdminLoginModal';
import {
  WeddingDatabaseSchema,
  WeddingTask,
  WeddingGuest,
  BudgetVendorItem,
  WeddingSettings,
  AdminUser,
  RsvpStatus,
} from '@/types';
import {
  getInitialClientState,
  saveClientState,
  saveStoredAdminUser,
} from '@/lib/clientSync';

function WeddingAppContent() {
  const searchParams = useSearchParams();
  const urlGuestTo = searchParams.get('to') || '';
  const urlGuestCode = searchParams.get('code') || '';
  const urlMode = searchParams.get('mode') || '';

  const [state, setState] = useState<WeddingDatabaseSchema>(() =>
    getInitialClientState()
  );
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [viewMode, setViewMode] = useState<'PUBLIC' | 'ADMIN'>('PUBLIC');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [previewOverrideGuest, setPreviewOverrideGuest] = useState<WeddingGuest | null>(
    null
  );

  // Verify server-side HttpOnly Admin Session & load database state on mount
  useEffect(() => {
    fetch('/api/auth', { cache: 'no-store' })
      .then(async (res) => {
        if (!res.ok) {
          setAdminUser(null);
          saveStoredAdminUser(null);
          if (urlMode === 'admin') {
            setIsLoginModalOpen(true);
          }
          return;
        }
        const authData = await res.json();
        if (authData.authenticated && authData.user) {
          setAdminUser(authData.user);
          saveStoredAdminUser(authData.user);
          if (urlMode === 'admin') {
            setViewMode('ADMIN');
          }
        } else if (urlMode === 'admin') {
          setIsLoginModalOpen(true);
        }
      })
      .catch(() => {
        if (urlMode === 'admin') {
          setIsLoginModalOpen(true);
        }
      });

    fetch('/api/wedding', { cache: 'no-store' })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setState(resData.data);
          saveClientState(resData.data);
        }
      })
      .catch(() => {
        // Fallback to localStorage state already loaded
      });
  }, [urlMode]);

  const mutateServer = useCallback(
    async (action: string, payload: unknown): Promise<WeddingDatabaseSchema | null> => {
      try {
        const res = await fetch('/api/wedding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
        });

        if (res.status === 401 && action !== 'SUBMIT_RSVP') {
          setAdminUser(null);
          saveStoredAdminUser(null);
          setViewMode('PUBLIC');
          setIsLoginModalOpen(true);
          return null;
        }

        const json = await res.json();
        if (json.success && json.data) {
          setState(json.data);
          saveClientState(json.data);
          return json.data;
        }
      } catch {
        // Offline fallback handled below
      }
      return null;
    },
    []
  );

  const handleOpenAdminPortal = () => {
    if (adminUser) {
      setViewMode('ADMIN');
    } else {
      setIsLoginModalOpen(true);
    }
  };

  const handleLoginSuccess = (user: AdminUser) => {
    setAdminUser(user);
    saveStoredAdminUser(user);
    setIsLoginModalOpen(false);
    setViewMode('ADMIN');
    fetch('/api/wedding', { cache: 'no-store' })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success && resData.data) {
          setState(resData.data);
          saveClientState(resData.data);
        }
      })
      .catch(() => {});
  };

  const handleSyncStateAndUser = (
    nextState?: WeddingDatabaseSchema,
    nextUser?: AdminUser
  ) => {
    if (nextState) {
      setState(nextState);
      saveClientState(nextState);
    }
    if (nextUser) {
      setAdminUser(nextUser);
      saveStoredAdminUser(nextUser);
    }
  };

  const handleLogoutAdmin = async () => {
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'LOGOUT' }),
      });
    } catch {
      // Proceed with local cleanup
    }
    setAdminUser(null);
    saveStoredAdminUser(null);
    setViewMode('PUBLIC');
  };

  const handleSwitchToPublicPreview = (guest?: WeddingGuest) => {
    if (guest) {
      setPreviewOverrideGuest(guest);
    }
    setViewMode('PUBLIC');
  };

  // CRUD Handlers
  const handleUpsertTask = async (task: Partial<WeddingTask> & { title: string }) => {
    await mutateServer('UPSERT_TASK', task);
  };

  const handleDeleteTask = async (id: string) => {
    await mutateServer('DELETE_TASK', { id });
  };

  const handleUpsertGuest = async (
    guest: Partial<WeddingGuest> & { guestName: string }
  ) => {
    await mutateServer('UPSERT_GUEST', guest);
  };

  const handleDeleteGuest = async (id: string) => {
    await mutateServer('DELETE_GUEST', { id });
  };

  const handleSubmitPublicRsvp = async (payload: {
    guestName: string;
    invitationCode?: string;
    institution?: string;
    relation?: string;
    phone?: string;
    rsvpStatus: RsvpStatus;
    pax: number;
    sessionChoice?: WeddingGuest['sessionChoice'];
    message?: string;
  }) => {
    await mutateServer('SUBMIT_RSVP', payload);
  };

  const handleTogglePinWish = async (id: string) => {
    await mutateServer('TOGGLE_PIN_WISH', { id });
  };

  const handleReplyWish = async (id: string, replyFromCouple: string) => {
    await mutateServer('REPLY_WISH', { id, replyFromCouple });
  };

  const handleDeleteWish = async (id: string) => {
    await mutateServer('DELETE_WISH', { id });
  };

  const handleUpsertBudget = async (
    item: Partial<BudgetVendorItem> & { itemName: string }
  ) => {
    await mutateServer('UPSERT_BUDGET', item);
  };

  const handleDeleteBudget = async (id: string) => {
    await mutateServer('DELETE_BUDGET', { id });
  };

  const handleUpdateSettings = async (partial: Partial<WeddingSettings>) => {
    await mutateServer('UPDATE_SETTINGS', partial);
  };

  const handleSyncGoogleSheets = async (): Promise<string> => {
    try {
      const res = await fetch('/api/sync-sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sheetId: state.settings.googleSheetId }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setState(json.data);
        saveClientState(json.data);
        return json.message || 'Sinkronisasi berhasil!';
      }
      return json.error || 'Gagal melakukan sinkronisasi.';
    } catch {
      return 'Menggunakan database lokal aktif.';
    }
  };

  const handleImportBackup = async (payload: Partial<WeddingDatabaseSchema>) => {
    await mutateServer('IMPORT_BACKUP', payload);
  };

  const handleResetDefault = async () => {
    await mutateServer('RESET_DEFAULT', {});
  };

  const effectiveGuestName = previewOverrideGuest?.guestName || urlGuestTo;
  const effectiveGuestCode = previewOverrideGuest?.invitationCode || urlGuestCode;

  return (
    <>
      {viewMode === 'ADMIN' && adminUser ? (
        <AdminDashboardView
          state={state}
          adminUser={adminUser}
          onSwitchToPublicPreview={handleSwitchToPublicPreview}
          onLogoutAdmin={handleLogoutAdmin}
          onUpsertTask={handleUpsertTask}
          onDeleteTask={handleDeleteTask}
          onUpsertGuest={handleUpsertGuest}
          onDeleteGuest={handleDeleteGuest}
          onTogglePinWish={handleTogglePinWish}
          onReplyWish={handleReplyWish}
          onDeleteWish={handleDeleteWish}
          onUpsertBudget={handleUpsertBudget}
          onDeleteBudget={handleDeleteBudget}
          onUpdateSettings={handleUpdateSettings}
          onSyncGoogleSheets={handleSyncGoogleSheets}
          onImportBackup={handleImportBackup}
          onResetDefault={handleResetDefault}
          onSyncStateAndUser={handleSyncStateAndUser}
        />
      ) : (
        <PublicInvitationView
          settings={state.settings}
          guests={state.guests}
          wishes={state.wishes}
          guestParamName={effectiveGuestName}
          guestParamCode={effectiveGuestCode}
          isAdminLoggedIn={Boolean(adminUser)}
          onOpenAdminPortal={handleOpenAdminPortal}
          onSubmitRsvp={handleSubmitPublicRsvp}
        />
      )}

      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8F5] text-[#8B6914] flex items-center justify-center text-sm font-bold">
          Memuat Undangan &amp; Wedding Readiness System...
        </div>
      }
    >
      <WeddingAppContent />
    </Suspense>
  );
}
