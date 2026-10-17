'use client';

import React, { useState, useMemo, useRef } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Wallet,
  Users,
  Settings,
  Eye,
  LogOut,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  RefreshCw,
  Download,
  Upload,
  Send,
  Copy,
  Check,
  Edit3,
  Trash2,
  ExternalLink,
  Award,
  Shield,
  Sparkles,
  MessageSquareHeart,
  Pin,
  Reply,
  FileSpreadsheet,
  FileJson,
  RotateCcw,
  X,
  Save,
  KeyRound,
} from 'lucide-react';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';
import {
  WeddingDatabaseSchema,
  WeddingTask,
  WeddingGuest,
  BudgetVendorItem,
  GuestWish,
  WeddingSettings,
  AdminUser,
  TaskCategory,
  TimelinePhase,
  TaskStatus,
  TaskPriority,
  TaskOwner,
  GuestType,
  GuestSide,
  InvitationFormat,
  GuestPriority,
  DeliveryStatus,
  RsvpStatus,
  AttendanceStatus,
  VendorCategory,
  VendorPaymentStatus,
} from '@/types';
import {
  formatRupiah,
  generateWhatsAppMessage,
  exportTasksToCsv,
  exportGuestsToCsv,
  exportBudgetToCsv,
  triggerFileDownload,
} from '@/lib/clientSync';

export type AdminModuleTab =
  | 'readiness'
  | 'checklist'
  | 'budget'
  | 'guests'
  | 'settings';

interface AdminDashboardViewProps {
  state: WeddingDatabaseSchema;
  adminUser: AdminUser;
  onSwitchToPublicPreview: (previewGuest?: WeddingGuest) => void;
  onLogoutAdmin: () => void;
  onUpsertTask: (task: Partial<WeddingTask> & { title: string }) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onUpsertGuest: (guest: Partial<WeddingGuest> & { guestName: string }) => Promise<void>;
  onDeleteGuest: (id: string) => Promise<void>;
  onTogglePinWish: (id: string) => Promise<void>;
  onReplyWish: (id: string, replyFromCouple: string) => Promise<void>;
  onDeleteWish: (id: string) => Promise<void>;
  onUpsertBudget: (item: Partial<BudgetVendorItem> & { itemName: string }) => Promise<void>;
  onDeleteBudget: (id: string) => Promise<void>;
  onUpdateSettings: (partial: Partial<WeddingSettings>) => Promise<void>;
  onSyncGoogleSheets: () => Promise<string>;
  onImportBackup: (payload: Partial<WeddingDatabaseSchema>) => Promise<void>;
  onResetDefault: () => Promise<void>;
  onSyncStateAndUser?: (
    nextState?: WeddingDatabaseSchema,
    nextUser?: AdminUser
  ) => void;
}

const TIMELINE_PHASES: TimelinePhase[] = [
  'H-6 Bulan',
  'H-3 Bulan',
  'H-1 Bulan',
  'H-7',
  'Hari-H',
  'Setelah Menikah',
];

const TASK_CATEGORIES: TaskCategory[] = [
  'Polri',
  'Gereja',
  'Kependudukan',
  'Kesehatan & Dokumen',
  'Acara',
  'Vendor & Logistik',
  'Seserahan & Adat',
  'Setelah Menikah',
];

const VENDOR_CATEGORIES: VendorCategory[] = [
  'Gedung & Venue',
  'Katering & Jamuan',
  'Dekorasi & Lighting',
  'MUA & Busana',
  'Dokumentasi Foto & Video',
  'Cincin & Seserahan',
  'Undangan & Souvenir',
  'Akomodasi & Transportasi',
  'Hiburan & Musik',
  'Administrasi & Lainnya',
];

const BACKGROUND_PRESETS = [
  {
    label: 'Siluet Prewedding Senja (Default)',
    url: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=2000&q=85',
  },
  {
    label: 'White Pearl & Floral Arch',
    url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=2000&q=85',
  },
  {
    label: 'Romantis Outdoor Garden',
    url: 'https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&w=2000&q=85',
  },
  {
    label: 'Minimalist Ivory Ballroom',
    url: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=2000&q=85',
  },
];

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  state,
  adminUser,
  onSwitchToPublicPreview,
  onLogoutAdmin,
  onUpsertTask,
  onDeleteTask,
  onUpsertGuest,
  onDeleteGuest,
  onTogglePinWish,
  onReplyWish,
  onDeleteWish,
  onUpsertBudget,
  onDeleteBudget,
  onUpdateSettings,
  onSyncGoogleSheets,
  onImportBackup,
  onResetDefault,
  onSyncStateAndUser,
}) => {
  const isPanitia = adminUser.role === 'PANITIA';
  const [activeTab, setActiveTab] = useState<AdminModuleTab>('readiness');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [isSyncingSheets, setIsSyncingSheets] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // ============================================================================
  // COMPUTED METRICS FOR READINESS TRACKER
  // ============================================================================
  const metrics = useMemo(() => {
    const totalTasks = state.tasks.length;
    const completedTasks = state.tasks.filter((t) => t.done || t.status === 'SELESAI').length;
    const inProgressTasks = state.tasks.filter(
      (t) => !t.done && t.status === 'PROSES'
    ).length;
    const pendingTasks = totalTasks - completedTasks - inProgressTasks;
    const readinessPercent =
      totalTasks > 0
        ? Math.round(((completedTasks + inProgressTasks * 0.5) / totalTasks) * 100)
        : 0;

    // Days until Biston & Wedding
    const now = Date.now();
    const bistonMs = new Date(
      state.settings.bistonDatetime || '2026-12-18T18:00:00+07:00'
    ).getTime();
    const weddingMs = new Date(
      state.settings.weddingDatetime || '2026-12-19T09:00:00+07:00'
    ).getTime();
    const daysToBiston = Math.max(0, Math.ceil((bistonMs - now) / (1000 * 60 * 60 * 24)));
    const daysToWedding = Math.max(0, Math.ceil((weddingMs - now) / (1000 * 60 * 60 * 24)));

    // Budget metrics
    const totalEstimated = state.budgetItems.reduce(
      (sum, b) => sum + (Number(b.estimatedCost) || 0),
      0
    );
    const totalActual = state.budgetItems.reduce(
      (sum, b) => sum + (Number(b.actualCost) || Number(b.estimatedCost) || 0),
      0
    );
    const totalPaid = state.budgetItems.reduce(
      (sum, b) => sum + (Number(b.paidAmount) || 0),
      0
    );
    const totalRemaining = Math.max(0, totalActual - totalPaid);
    const lunasCount = state.budgetItems.filter((b) => b.paymentStatus === 'LUNAS').length;

    // Guest & RSVP metrics
    const totalGuests = state.guests.length;
    const totalPaxQuota = state.guests.reduce((sum, g) => sum + (Number(g.pax) || 0), 0);
    const vipGuestsCount = state.guests.filter(
      (g) => g.priority === 'P1 - VIP' || g.guestType === 'Pejabat/VIP'
    ).length;
    const hadirGuests = state.guests.filter((g) => g.rsvpStatus === 'Hadir');
    const hadirPax = hadirGuests.reduce(
      (sum, g) => sum + (Number(g.confirmedPax ?? g.pax) || 0),
      0
    );
    const belumKonfirmasiCount = state.guests.filter(
      (g) => g.rsvpStatus === 'Belum Konfirmasi'
    ).length;
    const tidakHadirCount = state.guests.filter(
      (g) => g.rsvpStatus === 'Tidak Hadir'
    ).length;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      pendingTasks,
      readinessPercent,
      daysToBiston,
      daysToWedding,
      totalEstimated,
      totalActual,
      totalPaid,
      totalRemaining,
      lunasCount,
      totalGuests,
      totalPaxQuota,
      vipGuestsCount,
      hadirGuestsCount: hadirGuests.length,
      hadirPax,
      belumKonfirmasiCount,
      tidakHadirCount,
    };
  }, [state.tasks, state.budgetItems, state.guests, state.settings]);

  // ============================================================================
  // CHECKLIST MODULE STATE
  // ============================================================================
  const [taskSearch, setTaskSearch] = useState('');
  const [selectedPhase, setSelectedPhase] = useState<TimelinePhase | 'ALL'>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | 'ALL'>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<TaskStatus | 'ALL'>('ALL');
  const [selectedOwner, setSelectedOwner] = useState<TaskOwner | 'ALL'>('ALL');
  const [editingTask, setEditingTask] = useState<Partial<WeddingTask> | null>(null);

  const filteredTasks = useMemo(() => {
    return state.tasks.filter((t) => {
      if (selectedPhase !== 'ALL' && t.timelinePhase !== selectedPhase) return false;
      if (selectedCategory !== 'ALL' && t.category !== selectedCategory) return false;
      const effectiveStatus: TaskStatus = t.done ? 'SELESAI' : t.status || 'BELUM';
      if (selectedStatus !== 'ALL' && effectiveStatus !== selectedStatus) return false;
      if (selectedOwner !== 'ALL' && t.owner !== selectedOwner) return false;
      if (taskSearch.trim()) {
        const q = taskSearch.toLowerCase();
        const match =
          t.title.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.notes || '').toLowerCase().includes(q) ||
          t.id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [
    state.tasks,
    selectedPhase,
    selectedCategory,
    selectedStatus,
    selectedOwner,
    taskSearch,
  ]);

  const handleCycleTaskStatus = async (task: WeddingTask) => {
    const currentStatus: TaskStatus = task.done ? 'SELESAI' : task.status || 'BELUM';
    const nextStatus: TaskStatus =
      currentStatus === 'BELUM'
        ? 'PROSES'
        : currentStatus === 'PROSES'
        ? 'SELESAI'
        : 'BELUM';
    await onUpsertTask({
      ...task,
      status: nextStatus,
      done: nextStatus === 'SELESAI',
      updatedBy: adminUser.username,
    });
    showToast(`Status "${task.title}" diubah menjadi ${nextStatus}`);
  };

  // ============================================================================
  // BUDGET MODULE STATE
  // ============================================================================
  const [budgetCategoryFilter, setBudgetCategoryFilter] = useState<VendorCategory | 'ALL'>(
    'ALL'
  );
  const [editingBudget, setEditingBudget] = useState<Partial<BudgetVendorItem> | null>(null);
  const [budgetCapInput, setBudgetCapInput] = useState<number>(
    state.settings.totalBudgetCap || 0
  );

  const filteredBudgetItems = useMemo(() => {
    if (budgetCategoryFilter === 'ALL') return state.budgetItems;
    return state.budgetItems.filter((b) => b.category === budgetCategoryFilter);
  }, [state.budgetItems, budgetCategoryFilter]);

  // ============================================================================
  // GUESTS & WA GENERATOR MODULE STATE
  // ============================================================================
  const [guestSubTab, setGuestSubTab] = useState<'list' | 'wishes'>('list');
  const [guestSearch, setGuestSearch] = useState('');
  const [guestTypeFilter, setGuestTypeFilter] = useState<GuestType | 'ALL'>('ALL');
  const [guestPriorityFilter, setGuestPriorityFilter] = useState<GuestPriority | 'ALL'>('ALL');
  const [guestRsvpFilter, setGuestRsvpFilter] = useState<RsvpStatus | 'ALL'>('ALL');
  const [editingGuest, setEditingGuest] = useState<Partial<WeddingGuest> | null>(null);
  const [waPreviewGuest, setWaPreviewGuest] = useState<WeddingGuest | null>(null);
  const [copiedGuestLinkId, setCopiedGuestLinkId] = useState<string | null>(null);
  const [replyingWishId, setReplyingWishId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  const filteredGuests = useMemo(() => {
    return state.guests.filter((g) => {
      if (guestTypeFilter !== 'ALL' && g.guestType !== guestTypeFilter) return false;
      if (guestPriorityFilter !== 'ALL' && g.priority !== guestPriorityFilter) return false;
      if (guestRsvpFilter !== 'ALL' && g.rsvpStatus !== guestRsvpFilter) return false;
      if (guestSearch.trim()) {
        const q = guestSearch.toLowerCase();
        const match =
          g.guestName.toLowerCase().includes(q) ||
          (g.institution || '').toLowerCase().includes(q) ||
          (g.invitationCode || '').toLowerCase().includes(q) ||
          (g.notes || '').toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [state.guests, guestTypeFilter, guestPriorityFilter, guestRsvpFilter, guestSearch]);

  // ============================================================================
  // SETTINGS, USER MANAGEMENT & BACKUP MODULE STATE
  // ============================================================================
  const [settingsForm, setSettingsForm] = useState<WeddingSettings>(state.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default Users & Panitia Users from state.adminUsers
  const defaultSystemUsers = useMemo(
    () => (state.adminUsers || []).filter((u) => u.isDefaultUser),
    [state.adminUsers]
  );
  const panitiaUsers = useMemo(
    () => (state.adminUsers || []).filter((u) => !u.isDefaultUser || u.role === 'PANITIA'),
    [state.adminUsers]
  );

  // State for editing a Default User (Requires Superadmin Confirmation)
  const [selectedDefaultUserId, setSelectedDefaultUserId] = useState<string>(
    adminUser.isDefaultUser ? adminUser.id : 'usr-mempelai-pria'
  );
  const [secUsername, setSecUsername] = useState(adminUser.username || '');
  const [secName, setSecName] = useState(adminUser.nama || '');
  const [secNewPassword, setSecNewPassword] = useState('');
  const [secSuperadminConfirm, setSecSuperadminConfirm] = useState('');
  const [isUpdatingSecurity, setIsUpdatingSecurity] = useState(false);

  // State for adding/editing a Panitia User (No Superadmin confirmation needed)
  const [panitiaEditId, setPanitiaEditId] = useState<string | undefined>(undefined);
  const [panitiaUsername, setPanitiaUsername] = useState('');
  const [panitiaNama, setPanitiaNama] = useState('');
  const [panitiaJabatan, setPanitiaJabatan] = useState('Panitia / WO (Akses Non-Budgeting)');
  const [panitiaPassword, setPanitiaPassword] = useState('');
  const [isSavingPanitia, setIsSavingPanitia] = useState(false);

  const handleSelectDefaultUserForEdit = (u: AdminUser) => {
    setSelectedDefaultUserId(u.id);
    setSecUsername(u.username);
    setSecName(u.nama);
    setSecNewPassword('');
  };

  const handleSaveSettingsForm = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateSettings({
      ...settingsForm,
      updatedBy: adminUser.username,
    });
    showToast('Pengaturan tampilan & konten undangan berhasil disimpan!');
  };

  const handleUpdateDefaultUserForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingSecurity(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPDATE_DEFAULT_USER',
          targetUserId: selectedDefaultUserId,
          newUsername: secUsername,
          newName: secName,
          newPassword: secNewPassword,
          superadminConfirmation: secSuperadminConfirm,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || 'Gagal memperbarui akun utama.');
        return;
      }
      setSecNewPassword('');
      setSecSuperadminConfirm('');
      if (onSyncStateAndUser) {
        onSyncStateAndUser(json.data, json.user);
      }
      showToast(json.message || 'Akun utama berhasil diperbarui!');
    } catch {
      showToast('Terjadi kesalahan saat menghubungi server otentikasi.');
    } finally {
      setIsUpdatingSecurity(false);
    }
  };

  const handleUpsertPanitiaForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingPanitia(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UPSERT_PANITIA',
          id: panitiaEditId,
          username: panitiaUsername,
          nama: panitiaNama,
          jabatan: panitiaJabatan,
          password: panitiaPassword,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || 'Gagal menyimpan akun Panitia.');
        return;
      }
      setPanitiaEditId(undefined);
      setPanitiaUsername('');
      setPanitiaNama('');
      setPanitiaJabatan('Panitia / WO (Akses Non-Budgeting)');
      setPanitiaPassword('');
      if (onSyncStateAndUser && json.data) {
        onSyncStateAndUser(json.data);
      }
      showToast(json.message || 'Akun Panitia berhasil disimpan!');
    } catch {
      showToast('Gagal menghubungi server.');
    } finally {
      setIsSavingPanitia(false);
    }
  };

  const handleDeletePanitiaAccount = async (id: string, username: string) => {
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'DELETE_PANITIA',
          id,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        showToast(json.error || 'Gagal menghapus akun Panitia.');
        return;
      }
      if (onSyncStateAndUser && json.data) {
        onSyncStateAndUser(json.data);
      }
      showToast(`Akun Panitia "${username}" berhasil dihapus.`);
    } catch {
      showToast('Gagal menghubungi server.');
    }
  };

  const handleTriggerSyncSheets = async () => {
    setIsSyncingSheets(true);
    try {
      const msg = await onSyncGoogleSheets();
      showToast(msg);
    } finally {
      setIsSyncingSheets(false);
    }
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const parsed = JSON.parse(String(ev.target?.result || '{}'));
        const payload = parsed.data || parsed;
        await onImportBackup(payload);
        showToast('Backup JSON berhasil di-import dan dipulihkan!');
      } catch {
        showToast('Format file JSON tidak valid.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 pb-24">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-20 sm:bottom-6 right-4 z-50 bg-white text-stone-900 border-2 border-[#D4AF37] px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold max-w-md animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP STICKY HEADER BAR (BRIGHT PEARL & CHAMPAGNE GLASSMORPHISM) */}
      <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-xl text-stone-900 border-b border-[#D4AF37]/30 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Brand Title with Neutral Wedding Rings Icon */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#EAD3A8] border border-[#D4AF37]/50 text-[#8B6914] flex items-center justify-center shadow-xs shrink-0">
                <WeddingRingsIcon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="font-serif font-bold text-sm sm:text-base text-stone-900 truncate">
                    {state.settings.siteTitle}
                  </h1>
                  <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold">
                    <Sparkles className="w-3 h-3" /> All-in-One Planner
                  </span>
                </div>
                <p className="text-[11px] text-[#9A742B] font-medium truncate">
                  {state.settings.groomNickname} &amp; {state.settings.brideNickname} &bull;{' '}
                  {state.settings.subtitle}
                </p>
              </div>
            </div>

            {/* Right Actions: Local DB Status, Preview Invitation, Admin Info & Logout */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-[11px] font-bold text-emerald-700"
                title="Database berjalan 100% di Lokal (database/wedding_db.json)"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="hidden lg:inline">DB Lokal Aktif (wedding_db.json)</span>
                <span className="lg:hidden">DB Lokal</span>
              </div>

              <button
                type="button"
                onClick={() => onSwitchToPublicPreview()}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs shadow-xs transition-all"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Lihat Undangan</span>
              </button>

              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-stone-200">
                <div className="text-right leading-tight">
                  <p className="text-xs font-bold text-stone-800 truncate max-w-[160px]">
                    {adminUser.nama}
                  </p>
                  <p className="text-[10px] text-[#9A742B] font-semibold truncate max-w-[160px]">
                    {isPanitia ? 'Panitia (Non-Budgeting)' : adminUser.jabatan}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onLogoutAdmin}
                className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-600 transition-colors"
                title="Keluar dari Sesi Admin"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* MODULE NAVIGATION TABS (Desktop & Mobile Horizontal Scroll) */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-2 no-scrollbar border-t border-stone-200/70">
            {[
              {
                id: 'readiness' as AdminModuleTab,
                label: 'Readiness Tracker',
                icon: LayoutDashboard,
                badge: `${metrics.readinessPercent}%`,
              },
              {
                id: 'checklist' as AdminModuleTab,
                label: 'Checklist Bertahap',
                icon: CheckSquare,
                badge: `${metrics.completedTasks}/${metrics.totalTasks}`,
              },
              ...(!isPanitia
                ? [
                    {
                      id: 'budget' as AdminModuleTab,
                      label: 'Anggaran & Revisi',
                      icon: Wallet,
                      badge: `${state.budgetItems.length} Item`,
                    },
                  ]
                : []),
              {
                id: 'guests' as AdminModuleTab,
                label: 'Tamu & Generator WA',
                icon: Users,
                badge: `${metrics.totalGuests} Tamu`,
              },
              {
                id: 'settings' as AdminModuleTab,
                label: isPanitia
                  ? 'Pengaturan Undangan'
                  : 'Pengaturan Undangan & Akun',
                icon: Settings,
              },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    active
                      ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white shadow-xs'
                      : 'text-stone-600 hover:bg-[#FAF3E3] hover:text-[#8B6914]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded-md text-[10px] font-extrabold ${
                        active
                          ? 'bg-white/25 text-white'
                          : 'bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/30'
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT CONTAINER */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* =====================================================================
            MODUL 1: READINESS TRACKER (EXECUTIVE DASHBOARD)
           ===================================================================== */}
        {activeTab === 'readiness' && (
          <div className="space-y-6">
            {/* Top Hero KPI Cards (Symmetrical Height & Width) */}
            <div
              className={`grid grid-cols-1 sm:grid-cols-2 ${
                isPanitia ? 'lg:grid-cols-3' : 'lg:grid-cols-4'
              } gap-4 items-stretch`}
            >
              {/* Card 1: Overall Readiness % */}
              <div className="h-full bg-gradient-to-br from-[#0A192F] to-[#112240] text-white rounded-3xl p-5 shadow-md border border-amber-400/30 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                    Kesiapan Pernikahan
                  </span>
                  <CheckSquare className="w-5 h-5 text-amber-400" />
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-white">
                      {metrics.readinessPercent}%
                    </span>
                    <span className="text-xs text-emerald-300 font-semibold">
                      ({metrics.completedTasks}/{metrics.totalTasks} Selesai)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/15 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.readinessPercent}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-300 pt-2 border-t border-white/10">
                  {metrics.inProgressTasks} sedang diproses &bull; {metrics.pendingTasks} belum dimulai
                </p>
              </div>

              {/* Card 2: Countdown Hari-H */}
              <div className="h-full bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Countdown Hari-H
                  </span>
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div className="my-3 grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-2xl bg-amber-50 border border-amber-200">
                    <p className="text-[10px] font-bold uppercase text-amber-800 truncate">
                      {state.settings.event1Title || 'Acara 1'}
                    </p>
                    <p className="text-2xl font-extrabold text-slate-900">
                      H-{metrics.daysToBiston}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-slate-900 text-white">
                    <p className="text-[10px] font-bold uppercase text-amber-300 truncate">
                      {state.settings.event2Title || 'Pemberkatan'}
                    </p>
                    <p className="text-2xl font-extrabold text-amber-300">
                      H-{metrics.daysToWedding}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 font-medium pt-2 border-t border-slate-100 truncate">
                  {state.settings.event2DateLabel} &bull; {state.settings.groomOrigin}
                </p>
              </div>

              {/* Card 3: Ringkasan Budget & Revisi (Hidden for Panitia) */}
              {!isPanitia && (
                <div className="h-full bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Anggaran &amp; Realisasi
                    </span>
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="my-3">
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-900">
                      {formatRupiah(metrics.totalActual)}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Pagu Target:{' '}
                      <span className="font-bold text-slate-800">
                        {formatRupiah(
                          state.settings.totalBudgetCap || metrics.totalEstimated
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                    <span className="text-emerald-700 font-bold">
                      Dibayar: {formatRupiah(metrics.totalPaid)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-900 font-bold">
                      {state.budgetItems.length} Pos Biaya
                    </span>
                  </div>
                </div>
              )}

              {/* Card 4: Statistik RSVP & Tamu VIP */}
              <div className="h-full bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Statistik Tamu &amp; RSVP
                  </span>
                  <Users className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                      {metrics.totalGuests} Undangan
                    </span>
                    <span className="text-xs font-bold text-indigo-700">
                      ({metrics.totalPaxQuota} Kuota Pax)
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Konfirmasi Hadir:{' '}
                    <span className="font-bold text-emerald-700">
                      {metrics.hadirGuestsCount} Tamu ({metrics.hadirPax} Pax)
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100">
                  <span className="inline-flex items-center gap-1 font-bold text-amber-800">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    {metrics.vipGuestsCount} Pejabat / VIP
                  </span>
                  <span className="text-slate-500">
                    {metrics.belumKonfirmasiCount} Belum Konfirmasi
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown Progress by Timeline & Domain Category (Symmetrical Equal-Height 2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left: Progress per Kategori */}
              <div className="h-full lg:h-[460px] bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      Kesiapan per Domain (DB Wedding)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Progres administrasi Polri, Gereja, Kependudukan, Kesehatan &amp; Acara
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('checklist')}
                    className="text-xs font-bold text-[#0A192F] hover:underline shrink-0"
                  >
                    Buka Checklist &rarr;
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3.5 py-4 pr-1">
                  {TASK_CATEGORIES.map((cat) => {
                    const catTasks = state.tasks.filter((t) => t.category === cat);
                    if (catTasks.length === 0) return null;
                    const doneCount = catTasks.filter(
                      (t) => t.done || t.status === 'SELESAI'
                    ).length;
                    const pct = Math.round((doneCount / catTasks.length) * 100);
                    return (
                      <div key={cat} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">{cat}</span>
                          <span className="font-mono font-bold text-slate-600">
                            {doneCount}/{catTasks.length} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct === 100
                                ? 'bg-emerald-500'
                                : pct >= 60
                                ? 'bg-amber-500'
                                : 'bg-indigo-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                  <span>Total Tugas Terdata: {metrics.totalTasks} Tugas</span>
                  <span className="font-bold text-emerald-700">
                    {metrics.completedTasks} Selesai
                  </span>
                </div>
              </div>

              {/* Right: Urgent / Pending Priority Tasks */}
              <div className="h-full lg:h-[460px] bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
                  <div>
                    <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      Fokus Penyelesaian Berikutnya
                    </h3>
                    <p className="text-xs text-slate-500">
                      Daftar tugas yang masih berstatus Proses / Belum Selesai
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900 text-[11px] font-bold">
                    {metrics.pendingTasks + metrics.inProgressTasks} Aktif
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2.5 py-4 pr-1">
                  {state.tasks
                    .filter((t) => !t.done && t.status !== 'SELESAI')
                    .sort((a, b) => a.due.localeCompare(b.due))
                    .map((task) => (
                      <div
                        key={task.id}
                        className="p-3.5 rounded-2xl border border-slate-200 hover:border-amber-400 bg-slate-50/70 flex items-start justify-between gap-3 transition-all"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#0A192F] text-amber-300 text-[10px] font-bold">
                              {task.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-semibold">
                              {task.timelinePhase}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                task.priority === 'Tinggi'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-amber-100 text-amber-800'
                              }`}
                            >
                              Prioritas {task.priority}
                            </span>
                          </div>
                          <p className="font-bold text-xs sm:text-sm text-slate-900">
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-xs text-slate-500">{task.notes}</p>
                          )}
                          <p className="text-[11px] text-slate-500">
                            Target: <span className="font-semibold">{task.due}</span> &bull; PIC:{' '}
                            <span className="font-semibold">{task.owner}</span>
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCycleTaskStatus(task)}
                          className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors"
                        >
                          Selesaikan
                        </button>
                      </div>
                    ))}
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                  <span>Klik &ldquo;Selesaikan&rdquo; untuk memperbarui progres secara instan</span>
                  <span className="font-bold text-amber-700">
                    {metrics.inProgressTasks} Sedang Proses
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODUL 2: CHECKLIST KESIAPAN BERTAHAP (TIMELINE H-6 BULAN s/d HARI-H)
           ===================================================================== */}
        {activeTab === 'checklist' && (
          <div className="space-y-5">
            {/* Header & Add Button */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                  Checklist Kesiapan Pernikahan Bertahap
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Terintegrasi dengan {state.tasks.length} item tugas dari Google Sheets DB Wedding (Polri, Gereja, Kependudukan, Kesehatan, Vendor &amp; Acara)
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  setEditingTask({
                    title: '',
                    category: 'Acara',
                    timelinePhase: 'H-1 Bulan',
                    due: '2026-11-20',
                    priority: 'Tinggi',
                    owner: 'Bersama',
                    status: 'BELUM',
                    notes: '',
                    done: false,
                  })
                }
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0"
              >
                <Plus className="w-4 h-4" />
                Tambah Tugas Checklist
              </button>
            </div>

            {/* Phase Timeline Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setSelectedPhase('ALL')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                  selectedPhase === 'ALL'
                    ? 'bg-[#0A192F] text-amber-300 border-[#0A192F]'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Semua Fase ({state.tasks.length})
              </button>
              {TIMELINE_PHASES.map((phase) => {
                const count = state.tasks.filter((t) => t.timelinePhase === phase).length;
                return (
                  <button
                    key={phase}
                    type="button"
                    onClick={() => setSelectedPhase(phase)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap border transition-all ${
                      selectedPhase === phase
                        ? 'bg-[#0A192F] text-amber-300 border-[#0A192F]'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {phase} ({count})
                  </button>
                );
              })}
            </div>

            {/* Filters Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  placeholder="Cari tugas, dokumen, SKCK, izin kawin..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value as TaskCategory | 'ALL')}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
              >
                <option value="ALL">Semua Kategori Domain</option>
                {TASK_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    Kategori: {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as TaskStatus | 'ALL')}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
              >
                <option value="ALL">Semua Status (Belum / Proses / Selesai)</option>
                <option value="BELUM">Status: Belum Dimulai</option>
                <option value="PROSES">Status: Sedang Proses</option>
                <option value="SELESAI">Status: Selesai</option>
              </select>

              <select
                value={selectedOwner}
                onChange={(e) => setSelectedOwner(e.target.value as TaskOwner | 'ALL')}
                className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
              >
                <option value="ALL">Semua PIC (Saya / Calon / Bersama / WO)</option>
                <option value="Saya">PIC: Saya (Mempelai Pria)</option>
                <option value="Calon">PIC: Calon (Mempelai Wanita)</option>
                <option value="Bersama">PIC: Bersama</option>
                <option value="Keluarga">PIC: Keluarga</option>
                <option value="WO / Panitia">PIC: WO / Panitia</option>
              </select>
            </div>

            {/* Checklist Items List */}
            <div className="space-y-2.5">
              {filteredTasks.map((task) => {
                const effectiveStatus: TaskStatus = task.done
                  ? 'SELESAI'
                  : task.status || 'BELUM';
                return (
                  <div
                    key={task.id}
                    className={`rounded-2xl p-4 border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      effectiveStatus === 'SELESAI'
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : effectiveStatus === 'PROSES'
                        ? 'bg-amber-50/50 border-amber-300'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleCycleTaskStatus(task)}
                        className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center border shrink-0 transition-all ${
                          effectiveStatus === 'SELESAI'
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : effectiveStatus === 'PROSES'
                            ? 'bg-amber-500 border-amber-500 text-slate-950'
                            : 'bg-white border-slate-300 hover:border-[#0A192F]'
                        }`}
                        title="Klik untuk ubah status (Belum -> Proses -> Selesai)"
                      >
                        {effectiveStatus === 'SELESAI' ? (
                          <Check className="w-4 h-4 stroke-[3]" />
                        ) : effectiveStatus === 'PROSES' ? (
                          <Clock className="w-3.5 h-3.5" />
                        ) : null}
                      </button>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">
                            {task.id}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-[#0A192F] text-amber-300 text-[10px] font-bold">
                            {task.category}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-semibold">
                            {task.timelinePhase}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              task.priority === 'Tinggi'
                                ? 'bg-rose-100 text-rose-800'
                                : task.priority === 'Sedang'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Prioritas {task.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10px] font-bold">
                            PIC: {task.owner}
                          </span>
                        </div>

                        <h4
                          className={`font-bold text-sm ${
                            effectiveStatus === 'SELESAI'
                              ? 'line-through text-slate-500'
                              : 'text-slate-900'
                          }`}
                        >
                          {task.title}
                        </h4>

                        {task.notes && (
                          <p className="text-xs text-slate-600 leading-relaxed">
                            Catatan: {task.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                          <span>Tenggat: {task.due}</span>
                          {task.doneAt && <span>&bull; Selesai: {task.doneAt}</span>}
                          {task.updatedBy && <span>&bull; Oleh: {task.updatedBy}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        onClick={() => handleCycleTaskStatus(task)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          effectiveStatus === 'SELESAI'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : effectiveStatus === 'PROSES'
                            ? 'bg-amber-500 text-slate-950 border-amber-500'
                            : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {effectiveStatus}
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingTask(task)}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                        title="Edit Tugas"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={async () => {
                          await onDeleteTask(task.id);
                          showToast(`Tugas "${task.title}" dihapus.`);
                        }}
                        className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =====================================================================
            MODUL 3: ANGGARAN, REVISI BUDGET & VENDOR (KHUSUS USER DEFAULT / NON-PANITIA)
           ===================================================================== */}
        {activeTab === 'budget' && !isPanitia && (
          <div className="space-y-5">
            {/* Top Summary Banner & Editable Pagu Anggaran */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                    Akses Terbatas • Khusus Mempelai &amp; Keluarga Utama
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900 mt-1.5">
                    Manajemen Anggaran, Revisi &amp; Vendor Pernikahan
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Seluruh pos anggaran dapat ditambah, diubah, atau direvisi kapan saja sesuai kesepakatan keluarga
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingBudget({
                      category: 'Gedung & Venue',
                      itemName: '',
                      vendorName: '',
                      vendorContact: '',
                      pic: 'Bersama',
                      estimatedCost: 0,
                      actualCost: 0,
                      paidAmount: 0,
                      paymentStatus: 'BELUM_DP',
                      dueDate: '2026-12-01',
                      notes: '',
                      revisionNote: '',
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-bold text-xs sm:text-sm shadow-sm transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Pos Anggaran / Vendor
                </button>
              </div>

              {/* Editable Pagu / Target Anggaran Keseluruhan */}
              <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm text-stone-900">
                    Target Pagu Anggaran Keseluruhan (Editable / Revisi Pagu)
                  </h4>
                  <p className="text-xs text-stone-500">
                    Tentukan atau revisi batas maksimal anggaran pernikahan Anda (dalam Rupiah)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="text-xs font-bold text-stone-500 absolute left-3 top-1/2 -translate-y-1/2">
                      Rp
                    </span>
                    <input
                      type="number"
                      min={0}
                      step={500000}
                      value={budgetCapInput}
                      onChange={(e) => setBudgetCapInput(Number(e.target.value) || 0)}
                      placeholder="Contoh: 150000000"
                      className="pl-9 pr-3.5 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm font-bold text-stone-900 w-48 sm:w-56"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      await onUpdateSettings({
                        totalBudgetCap: Number(budgetCapInput) || 0,
                        updatedBy: adminUser.username,
                      });
                      setSettingsForm((prev) => ({
                        ...prev,
                        totalBudgetCap: Number(budgetCapInput) || 0,
                      }));
                      showToast(
                        `Pagu Anggaran diperbarui menjadi ${formatRupiah(
                          Number(budgetCapInput) || 0
                        )}`
                      );
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white font-bold text-xs shadow-xs shrink-0"
                  >
                    Simpan Pagu
                  </button>
                </div>
              </div>
            </div>

            {/* 4 Symmetrical Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <div className="h-full bg-white rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                <p className="text-[11px] font-bold uppercase text-slate-500">
                  Target Pagu / Estimasi Awal
                </p>
                <p className="text-lg sm:text-2xl font-extrabold text-slate-900 mt-1">
                  {formatRupiah(
                    state.settings.totalBudgetCap > 0
                      ? state.settings.totalBudgetCap
                      : metrics.totalEstimated
                  )}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Total Estimasi Item: {formatRupiah(metrics.totalEstimated)}
                </p>
              </div>
              <div className="h-full bg-white rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                <p className="text-[11px] font-bold uppercase text-slate-500">
                  Total Realisasi / Revisi
                </p>
                <p className="text-lg sm:text-2xl font-extrabold text-indigo-900 mt-1">
                  {formatRupiah(metrics.totalActual)}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Dari {state.budgetItems.length} pos anggaran aktif
                </p>
              </div>
              <div className="h-full bg-emerald-50 rounded-2xl p-4 border border-emerald-200 flex flex-col justify-between">
                <p className="text-[11px] font-bold uppercase text-emerald-800">
                  Sudah Dibayar (DP / Lunas)
                </p>
                <p className="text-lg sm:text-2xl font-extrabold text-emerald-700 mt-1">
                  {formatRupiah(metrics.totalPaid)}
                </p>
                <p className="text-[11px] text-emerald-700/80 mt-1">
                  {metrics.lunasCount} pos berstatus Lunas
                </p>
              </div>
              <div className="h-full bg-rose-50 rounded-2xl p-4 border border-rose-200 flex flex-col justify-between">
                <p className="text-[11px] font-bold uppercase text-rose-800">
                  Sisa Harus Dilunasi
                </p>
                <p className="text-lg sm:text-2xl font-extrabold text-rose-700 mt-1">
                  {formatRupiah(metrics.totalRemaining)}
                </p>
                <p className="text-[11px] text-rose-700/80 mt-1">
                  Selisih Realisasi dikurangi DP
                </p>
              </div>
            </div>

            {/* Category Filter Pills */}
            {state.budgetItems.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setBudgetCategoryFilter('ALL')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${
                    budgetCategoryFilter === 'ALL'
                      ? 'bg-[#0A192F] text-amber-300 border-[#0A192F]'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  Semua Pos ({state.budgetItems.length})
                </button>
                {VENDOR_CATEGORIES.map((vc) => {
                  const count = state.budgetItems.filter((b) => b.category === vc).length;
                  if (count === 0) return null;
                  return (
                    <button
                      key={vc}
                      type="button"
                      onClick={() => setBudgetCategoryFilter(vc)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border ${
                        budgetCategoryFilter === vc
                          ? 'bg-[#0A192F] text-amber-300 border-[#0A192F]'
                          : 'bg-white text-slate-700 border-slate-200'
                      }`}
                    >
                      {vc} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Vendor List Cards or Clean Empty State */}
            {filteredBudgetItems.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-dashed border-slate-300 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center mx-auto">
                  <Wallet className="w-6 h-6" />
                </div>
                <h3 className="font-serif text-lg font-bold text-slate-900">
                  Belum Ada Pos Anggaran / Vendor
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  Seluruh data dummy telah dibersihkan. Silakan klik tombol di bawah untuk mulai mencatat estimasi anggaran, realisasi, dan revisi biaya pernikahan Anda.
                </p>
                <button
                  type="button"
                  onClick={() =>
                    setEditingBudget({
                      category: 'Gedung & Venue',
                      itemName: '',
                      vendorName: '',
                      vendorContact: '',
                      pic: 'Bersama',
                      estimatedCost: 0,
                      actualCost: 0,
                      paidAmount: 0,
                      paymentStatus: 'BELUM_DP',
                      dueDate: '2026-12-01',
                      notes: '',
                      revisionNote: '',
                    })
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A192F] text-amber-300 font-bold text-xs shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Pos Anggaran Pertama
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
                {filteredBudgetItems.map((item) => {
                  const effectiveTotal =
                    item.actualCost > 0 ? item.actualCost : item.estimatedCost;
                  const remaining = Math.max(0, effectiveTotal - item.paidAmount);
                  const paidPct =
                    effectiveTotal > 0
                      ? Math.min(100, Math.round((item.paidAmount / effectiveTotal) * 100))
                      : 0;

                  return (
                    <div
                      key={item.id}
                      className="h-full bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-lg bg-[#0A192F] text-amber-300 text-[10px] font-bold">
                              {item.category}
                            </span>
                            {(item.revisionCount || 0) > 0 && (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                                Revisi ke-{item.revisionCount}
                              </span>
                            )}
                          </div>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                              item.paymentStatus === 'LUNAS'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : item.paymentStatus === 'DP_TERBAYAR' ||
                                  item.paymentStatus === 'CICILAN'
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-rose-100 text-rose-800 border border-rose-300'
                            }`}
                          >
                            {item.paymentStatus.replace('_', ' ')} ({paidPct}%)
                          </span>
                        </div>

                        <h3 className="font-bold text-base text-slate-900">{item.itemName}</h3>
                        <p className="text-xs font-semibold text-slate-700">
                          Vendor: {item.vendorName || '-'} &bull; Kontak:{' '}
                          {item.vendorContact || '-'}
                        </p>
                        {item.notes && (
                          <p className="text-xs text-slate-500 leading-relaxed">
                            {item.notes}
                          </p>
                        )}
                        {item.revisionNote && (
                          <p className="text-xs text-indigo-800 bg-indigo-50/70 px-3 py-1.5 rounded-xl border border-indigo-100">
                            <strong>Catatan Revisi:</strong> {item.revisionNote}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2 pt-3 border-t border-slate-100 text-xs mt-auto">
                        <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl">
                          <div>
                            <p className="text-[10px] text-slate-500">Estimasi Awal</p>
                            <p className="font-bold text-slate-700">
                              {formatRupiah(item.estimatedCost)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">Realisasi / Revisi</p>
                            <p className="font-bold text-indigo-900">
                              {formatRupiah(effectiveTotal)}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500">Sisa Pelunasan</p>
                            <p className="font-bold text-rose-600">
                              {formatRupiah(remaining)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-slate-500">
                            Dibayar:{' '}
                            <strong className="text-emerald-700">
                              {formatRupiah(item.paidAmount)}
                            </strong>{' '}
                            &bull; PIC: <strong>{item.pic}</strong>
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingBudget(item)}
                              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" /> Edit / Revisi
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteBudget(item.id);
                                showToast(`Pos "${item.itemName}" dihapus.`);
                              }}
                              className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            MODUL 4: MANAJEMEN TAMU, BUKU TAMU & GENERATOR UNDANGAN WA 1-KLIK
           ===================================================================== */}
        {activeTab === 'guests' && (
          <div className="space-y-5">
            {/* Top Banner & Sub-tab Switcher */}
            <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="font-serif text-xl sm:text-2xl font-bold text-slate-900">
                  Manajemen Tamu &amp; Generator Undangan WhatsApp
                </h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Daftar tamu VIP/Pejabat Polri, Keluarga &amp; Rekan lengkap dengan 1-Klik Kirim WA bernama otomatis
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="bg-slate-100 p-1 rounded-xl flex items-center">
                  <button
                    type="button"
                    onClick={() => setGuestSubTab('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      guestSubTab === 'list'
                        ? 'bg-[#0A192F] text-amber-300 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Daftar Tamu ({state.guests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestSubTab('wishes')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      guestSubTab === 'wishes'
                        ? 'bg-[#0A192F] text-amber-300 shadow-2xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Buku Tamu &amp; Doa ({state.wishes.length})
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setEditingGuest({
                      guestName: '',
                      guestType: 'Pejabat/VIP',
                      side: 'Mempelai Pria',
                      institution: '',
                      invitationFormat: 'Cetak Tebal',
                      priority: 'P1 - VIP',
                      cardQty: 1,
                      pax: 2,
                      phone: '',
                      address: '',
                      deliveryStatus: 'Belum Disiapkan',
                      rsvpStatus: 'Belum Konfirmasi',
                      attendanceStatus: 'Belum Dicek',
                      notes: '',
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Tambah Tamu
                </button>
              </div>
            </div>

            {guestSubTab === 'list' ? (
              <>
                {/* Guest Filters */}
                <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Cari nama tamu, pangkat, satker, kode INV..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                    />
                  </div>

                  <select
                    value={guestTypeFilter}
                    onChange={(e) => setGuestTypeFilter(e.target.value as GuestType | 'ALL')}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="ALL">Semua Kategori Tamu</option>
                    <option value="Pejabat/VIP">Pejabat / VIP</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Rekan Kerja/Polri">Rekan Kerja / Polri</option>
                    <option value="Teman/Sahabat">Teman / Sahabat</option>
                    <option value="Tetangga/Gereja">Tetangga / Gereja</option>
                  </select>

                  <select
                    value={guestPriorityFilter}
                    onChange={(e) =>
                      setGuestPriorityFilter(e.target.value as GuestPriority | 'ALL')
                    }
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="ALL">Semua Prioritas (P1 / P2 / P3)</option>
                    <option value="P1 - VIP">P1 - VIP Utama</option>
                    <option value="P2 - Utama">P2 - Utama</option>
                    <option value="P3 - Reguler">P3 - Reguler</option>
                  </select>

                  <select
                    value={guestRsvpFilter}
                    onChange={(e) => setGuestRsvpFilter(e.target.value as RsvpStatus | 'ALL')}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-semibold"
                  >
                    <option value="ALL">Semua Status RSVP</option>
                    <option value="Hadir">RSVP: Hadir</option>
                    <option value="Belum Konfirmasi">RSVP: Belum Konfirmasi</option>
                    <option value="Masih Ragu">RSVP: Masih Ragu</option>
                    <option value="Tidak Hadir">RSVP: Tidak Hadir</option>
                  </select>
                </div>

                {/* Guests List */}
                <div className="space-y-3">
                  {filteredGuests.map((guest) => {
                    const waData = generateWhatsAppMessage(guest, state.settings);
                    const isLinkCopied = copiedGuestLinkId === guest.id;

                    return (
                      <div
                        key={guest.id}
                        className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                              {guest.invitationCode}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                                guest.priority === 'P1 - VIP'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {guest.priority}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-900 text-[10px] font-bold">
                              {guest.guestType} &bull; {guest.side}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                guest.rsvpStatus === 'Hadir'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : guest.rsvpStatus === 'Tidak Hadir'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              RSVP: {guest.rsvpStatus} ({guest.pax} Pax)
                            </span>
                          </div>

                          <h3 className="font-bold text-sm sm:text-base text-slate-900">
                            {guest.guestName}
                          </h3>

                          {guest.institution && (
                            <p className="text-xs font-semibold text-amber-800">
                              {guest.institution}
                            </p>
                          )}

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span>Format: {guest.invitationFormat}</span>
                            {guest.address && <span>&bull; Lokasi: {guest.address}</span>}
                            {guest.phone && <span>&bull; Kontak/WA: {guest.phone}</span>}
                            <span>&bull; Distribusi: {guest.deliveryStatus}</span>
                          </div>

                          {guest.notes && (
                            <p className="text-xs text-slate-500 italic">
                              Catatan: {guest.notes}
                            </p>
                          )}
                        </div>

                        {/* Action Buttons: 1-Click WA, Copy Link, Preview as Guest, Edit, Delete */}
                        <div className="flex items-center gap-2 flex-wrap shrink-0">
                          <a
                            href={waData.waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              if (guest.deliveryStatus === 'Belum Disiapkan') {
                                onUpsertGuest({
                                  ...guest,
                                  deliveryStatus: 'Sudah Dikirim',
                                });
                              }
                            }}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Kirim WA
                          </a>

                          <button
                            type="button"
                            onClick={() => setWaPreviewGuest(guest)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs border border-amber-300 transition-all"
                          >
                            Teks WA
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(waData.inviteUrl);
                              setCopiedGuestLinkId(guest.id);
                              setTimeout(() => setCopiedGuestLinkId(null), 2000);
                              showToast(`Link undangan ${guest.guestName} berhasil disalin!`);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                          >
                            {isLinkCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" /> Disalin
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Salin Link
                              </>
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => onSwitchToPublicPreview(guest)}
                            className="p-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700"
                            title="Buka Preview Undangan atas nama tamu ini"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => setEditingGuest(guest)}
                            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Edit Data Tamu"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteGuest(guest.id);
                              showToast(`Tamu "${guest.guestName}" dihapus.`);
                            }}
                            className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                            title="Hapus Tamu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              /* SUB-TAB BUKU TAMU & MODERASI UCAPAN DOA */
              <div className="space-y-3">
                {state.wishes.map((w) => (
                  <div
                    key={w.id}
                    className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-base text-slate-900">{w.guestName}</h4>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            {w.rsvpStatus} ({w.pax} Pax)
                          </span>
                          {w.isPinned && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                              Disematkan
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500">{w.institution || w.relation}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={async () => {
                            await onTogglePinWish(w.id);
                            showToast('Status sematan ucapan diperbarui.');
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                            w.isPinned
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }`}
                        >
                          <Pin className="w-3.5 h-3.5" />
                          {w.isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setReplyingWishId(w.id);
                            setReplyText(w.replyFromCouple || '');
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1"
                        >
                          <Reply className="w-3.5 h-3.5" /> Balas
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteWish(w.id);
                            showToast('Ucapan dihapus.');
                          }}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <p className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                      &ldquo;{w.message}&rdquo;
                    </p>

                    {w.replyFromCouple && (
                      <div className="pl-3 border-l-2 border-amber-500 text-xs text-slate-600">
                        <strong className="text-slate-900">Balasan Mempelai:</strong>{' '}
                        {w.replyFromCouple}
                      </div>
                    )}

                    {replyingWishId === w.id && (
                      <div className="flex items-center gap-2 pt-2">
                        <input
                          type="text"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Tulis balasan terima kasih dari mempelai..."
                          className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            await onReplyWish(w.id, replyText);
                            setReplyingWishId(null);
                            showToast('Balasan berhasil disimpan!');
                          }}
                          className="px-4 py-2 rounded-xl bg-[#0A192F] text-amber-300 font-bold text-xs"
                        >
                          Simpan Balasan
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =====================================================================
            MODUL 5: PENGATURAN KONTEN UNDANGAN & SINKRONISASI / BACKUP DATABASE
           ===================================================================== */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            {/* Database Lokal & Backup / Export Panel */}
            <div className="bg-gradient-to-br from-[#0A192F] to-[#112240] text-white rounded-3xl p-6 shadow-md border border-amber-400/30 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-400 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    Database Lokal Mandiri Aktif (Sudah Di-Backup dari Spreadsheet)
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-white mt-0.5">
                    Database Lokal &amp; Backup Data (JSON / SQL / CSV Excel)
                  </h2>
                  <p className="text-xs text-slate-300 mt-1">
                    Lokasi DB Lokal:{' '}
                    <code className="text-amber-300 font-mono">
                      database/wedding_db.json
                    </code>{' '}
                    &bull; Backup Folder:{' '}
                    <code className="text-emerald-300 font-mono">
                      data_aplikasi/backups/
                    </code>
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleTriggerSyncSheets}
                    disabled={isSyncingSheets}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-amber-200 font-bold text-xs transition-all disabled:opacity-50"
                    title="Opsional: Impor ulang dari arsip Google Sheets lama jika diperlukan"
                  >
                    <RefreshCw
                      className={`w-3.5 h-3.5 ${isSyncingSheets ? 'animate-spin' : ''}`}
                    />
                    {isSyncingSheets
                      ? 'Mengimpor...'
                      : 'Impor Ulang dari Arsip Spreadsheet Lama (Opsional)'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    triggerFileDownload(
                      `wedding_backup_${new Date().toISOString().slice(0, 10)}.json`,
                      JSON.stringify(state, null, 2),
                      'application/json'
                    );
                    showToast('Backup JSON lengkap berhasil diunduh!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <FileJson className="w-4 h-4 text-amber-300" />
                  Export Full JSON
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerFileDownload(
                      'DB_Wedding_Tasks.csv',
                      exportTasksToCsv(state.tasks),
                      'text/csv;charset=utf-8;'
                    );
                    showToast('Sheet Tasks.csv berhasil diunduh!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  Export Tasks (CSV)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerFileDownload(
                      'DB_Wedding_Guests.csv',
                      exportGuestsToCsv(state.guests),
                      'text/csv;charset=utf-8;'
                    );
                    showToast('Sheet Guests.csv berhasil diunduh!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-300" />
                  Export Guests (CSV)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    triggerFileDownload(
                      'DB_Wedding_Budget.csv',
                      exportBudgetToCsv(state.budgetItems),
                      'text/csv;charset=utf-8;'
                    );
                    showToast('Sheet Budget.csv berhasil diunduh!');
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4 text-sky-300" />
                  Export Budget (CSV)
                </button>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 border border-emerald-400/40 text-xs font-bold flex items-center justify-center gap-2 text-emerald-200"
                >
                  <Upload className="w-4 h-4" />
                  Import Backup JSON
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportJsonFile}
                  className="hidden"
                />
              </div>
            </div>

            {/* Pengaturan Tampilan, Custom Background & Konten Undangan Form */}
            <form
              onSubmit={handleSaveSettingsForm}
              className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-6 text-xs sm:text-sm"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="font-serif text-xl font-bold text-slate-900">
                    Pengaturan Undangan Digital, Custom Background &amp; Jadwal Acara
                  </h3>
                  <p className="text-xs text-slate-500">
                    Atur background custom, transparansi, bagian apa saja yang ditampilkan, tanggal acara, ayat, profil mempelai, hingga rekening amplop digital
                  </p>
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-extrabold text-xs sm:text-sm shadow-sm shrink-0"
                >
                  <Save className="w-4 h-4" />
                  Simpan Pengaturan Undangan
                </button>
              </div>

              {/* 1. PENGATURAN CUSTOM BACKGROUND, WALLPAPER & TRANSPARANSI */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-[#8B6914]">
                      1. Pengaturan Custom Background &amp; Efek Transparansi Undangan
                    </h4>
                    <p className="text-xs text-stone-500">
                      Gunakan URL gambar dari mana saja (Unsplash, Google Drive direct link, Imgur, dll) atau pilih preset di bawah
                    </p>
                  </div>
                </div>

                {/* Quick Preset Selector */}
                <div>
                  <label className="block font-semibold text-stone-700 mb-1.5 text-xs">
                    Pilih Cepat Preset Background Tema Cerah / Siluet Prewedding:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 items-stretch">
                    {BACKGROUND_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() =>
                          setSettingsForm({
                            ...settingsForm,
                            coverBgUrl: preset.url,
                            heroPrewedUrl: preset.url,
                            pageBgUrl: preset.url,
                          })
                        }
                        className="p-2.5 rounded-xl bg-white hover:bg-[#FAF3E3] border border-stone-200 hover:border-[#D4AF37] text-left transition-all flex items-center gap-2.5"
                      >
                        <img
                          src={preset.url}
                          alt={preset.label}
                          className="w-10 h-10 rounded-lg object-cover shrink-0 border border-stone-200"
                        />
                        <span className="text-[11px] font-bold text-stone-800 leading-tight">
                          {preset.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 3 Custom Background URL Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                  <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-col justify-between">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        URL Background Cover Pembuka
                      </label>
                      <p className="text-[11px] text-stone-400 mb-2">
                        Tampil di layar pertama saat tamu membuka link undangan
                      </p>
                    </div>
                    <input
                      type="text"
                      value={settingsForm.coverBgUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, coverBgUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#FAF8F5] text-xs"
                    />
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-col justify-between">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        URL Banner Utama / Foto Prewedding
                      </label>
                      <p className="text-[11px] text-stone-400 mb-2">
                        Tampil pada kartu utama di atas Countdown Hari-H
                      </p>
                    </div>
                    <input
                      type="text"
                      value={settingsForm.heroPrewedUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroPrewedUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#FAF8F5] text-xs"
                    />
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-stone-200 flex flex-col justify-between">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        URL Background Wallpaper Halaman
                      </label>
                      <p className="text-[11px] text-stone-400 mb-2">
                        Background tetap (fixed) di belakang seluruh kartu undangan
                      </p>
                    </div>
                    <input
                      type="text"
                      value={settingsForm.pageBgUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, pageBgUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#FAF8F5] text-xs"
                    />
                  </div>
                </div>

                {/* Overlay Opacity & Blur Controls */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="font-bold text-stone-800">
                        Tingkat Kecerahan Lapisan Transparan (Pearl Veil)
                      </label>
                      <span className="font-mono font-bold text-[#9A742B]">
                        {settingsForm.bgOverlayOpacity ?? 88}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min={45}
                      max={95}
                      value={settingsForm.bgOverlayOpacity ?? 88}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          bgOverlayOpacity: Number(e.target.value),
                        })
                      }
                      className="w-full accent-[#B68D40]"
                    />
                    <div className="flex justify-between text-[10px] text-stone-400 mt-1">
                      <span>45% (Foto Lebih Jelas)</span>
                      <span>88% (Putih Lembut Ideal)</span>
                      <span>95% (Putih Bersih)</span>
                    </div>
                  </div>

                  <div className="bg-white p-3.5 rounded-xl border border-stone-200">
                    <label className="block font-bold text-stone-800 mb-1.5">
                      Efek Blur Kaca (Glassmorphism Background)
                    </label>
                    <select
                      value={settingsForm.bgBlurIntensity || 'sm'}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          bgBlurIntensity: e.target.value as WeddingSettings['bgBlurIntensity'],
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-[#FAF8F5]"
                    >
                      <option value="none">Tanpa Blur (Foto Tajam)</option>
                      <option value="sm">Blur Halus (Rekomendasi)</option>
                      <option value="md">Blur Sedang (Soft Frosted)</option>
                      <option value="lg">Blur Kuat (Deep Glass)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. SAKLAR TAMPILAN SEKSI UNDANGAN (VISIBILITY TOGGLES) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div>
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                    2. Pengaturan Tampilan Seksi Undangan (Pilih Bagian yang Ditampilkan)
                  </h4>
                  <p className="text-xs text-slate-500">
                    Centang atau nonaktifkan bagian undangan yang ingin ditampilkan kepada tamu
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
                  {[
                    {
                      key: 'showQuoteSection' as const,
                      label: 'Kutipan Ayat Suci / Doa',
                    },
                    {
                      key: 'showCoupleSection' as const,
                      label: 'Profil Kedua Mempelai',
                    },
                    {
                      key: 'showEvent1' as const,
                      label: 'Acara 1 (Biston / Keluarga)',
                    },
                    {
                      key: 'showEvent2' as const,
                      label: 'Acara 2 (Pemberkatan / Akad)',
                    },
                    {
                      key: 'showEvent3' as const,
                      label: 'Acara 3 (Resepsi Pernikahan)',
                    },
                    {
                      key: 'showLoveStorySection' as const,
                      label: 'Kisah Kasih (Love Story)',
                    },
                    {
                      key: 'showGallerySection' as const,
                      label: 'Galeri Foto Prewedding',
                    },
                    {
                      key: 'showRsvpSection' as const,
                      label: 'Form RSVP & Buku Tamu',
                    },
                    {
                      key: 'showGiftSection' as const,
                      label: 'Amplop Digital / Rekening',
                    },
                  ].map((item) => {
                    const checked = settingsForm[item.key] !== false;
                    return (
                      <label
                        key={item.key}
                        className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                          checked
                            ? 'bg-white border-[#D4AF37] shadow-2xs'
                            : 'bg-slate-100/70 border-slate-200 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              [item.key]: e.target.checked,
                            })
                          }
                          className="w-4 h-4 accent-[#B68D40] rounded"
                        />
                        <span className="font-bold text-xs text-stone-800">
                          {item.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* 3. TANGGAL COUNTDOWN MANDIRI & JADWAL 3 ACARA (BISTON, PEMBERKATAN, RESEPSI) */}
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-3">
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-amber-900">
                    3. Pengaturan Tanggal Countdown Utama &amp; Rangkaian Acara Mandiri
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Waktu Countdown Utama (Pemberkatan / Hari-H)
                      </label>
                      <input
                        type="datetime-local"
                        value={(settingsForm.weddingDatetime || '2026-12-19T09:00').slice(
                          0,
                          16
                        )}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            weddingDatetime: `${e.target.value}:00+07:00`,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Waktu Countdown Acara 1 (Biston / Keluarga)
                      </label>
                      <input
                        type="datetime-local"
                        value={(settingsForm.bistonDatetime || '2026-12-18T18:00').slice(
                          0,
                          16
                        )}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            bistonDatetime: `${e.target.value}:00+07:00`,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Subjudul Ringkas (Tampil di Header &amp; Footer)
                      </label>
                      <input
                        type="text"
                        value={settingsForm.subtitle}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, subtitle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* 3 Symmetrical Event Editors */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
                  {/* Acara 1 */}
                  <div className="h-full p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase text-amber-800">
                          Acara 1 (Biston / Keluarga)
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500">
                          {settingsForm.showEvent1 !== false ? 'Ditampilkan' : 'Disembunyikan'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={settingsForm.event1Title}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, event1Title: e.target.value })
                        }
                        placeholder="Judul Acara 1"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                      />
                      <input
                        type="text"
                        value={settingsForm.event1Subtitle}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event1Subtitle: e.target.value,
                          })
                        }
                        placeholder="Subjudul Acara 1"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event1DateLabel}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event1DateLabel: e.target.value,
                          })
                        }
                        placeholder="Hari & Tanggal (misal: Jumat, 18 Desember 2026)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event1TimeLabel}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event1TimeLabel: e.target.value,
                          })
                        }
                        placeholder="Jam Pelaksanaan"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event1Venue}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, event1Venue: e.target.value })
                        }
                        placeholder="Nama Tempat / Venue"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event1Address}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event1Address: e.target.value,
                          })
                        }
                        placeholder="Alamat Lengkap"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event1Dresscode}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event1Dresscode: e.target.value,
                          })
                        }
                        placeholder="Dresscode"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={settingsForm.event1MapsUrl}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, event1MapsUrl: e.target.value })
                      }
                      placeholder="Link Google Maps"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white mt-2"
                    />
                  </div>

                  {/* Acara 2 */}
                  <div className="h-full p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase text-amber-800">
                          Acara 2 (Pemberkatan / Akad)
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500">
                          {settingsForm.showEvent2 !== false ? 'Ditampilkan' : 'Disembunyikan'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={settingsForm.event2Title}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, event2Title: e.target.value })
                        }
                        placeholder="Judul Acara 2"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                      />
                      <input
                        type="text"
                        value={settingsForm.event2Subtitle}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event2Subtitle: e.target.value,
                          })
                        }
                        placeholder="Subjudul Acara 2"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event2DateLabel}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event2DateLabel: e.target.value,
                          })
                        }
                        placeholder="Hari & Tanggal (misal: Sabtu, 19 Desember 2026)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event2TimeLabel}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event2TimeLabel: e.target.value,
                          })
                        }
                        placeholder="Jam Pelaksanaan"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event2Venue}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, event2Venue: e.target.value })
                        }
                        placeholder="Nama Gereja / Tempat"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event2Address}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event2Address: e.target.value,
                          })
                        }
                        placeholder="Alamat Lengkap"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event2Dresscode}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event2Dresscode: e.target.value,
                          })
                        }
                        placeholder="Dresscode"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={settingsForm.event2MapsUrl}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, event2MapsUrl: e.target.value })
                      }
                      placeholder="Link Google Maps"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white mt-2"
                    />
                  </div>

                  {/* Acara 3 */}
                  <div className="h-full p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase text-amber-800">
                          Acara 3 (Resepsi Pernikahan)
                        </h4>
                        <span className="text-[10px] font-bold text-slate-500">
                          {settingsForm.showEvent3 !== false ? 'Ditampilkan' : 'Disembunyikan'}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={settingsForm.event3Title}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, event3Title: e.target.value })
                        }
                        placeholder="Judul Acara 3"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-bold"
                      />
                      <input
                        type="text"
                        value={settingsForm.event3Subtitle}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event3Subtitle: e.target.value,
                          })
                        }
                        placeholder="Subjudul Acara 3"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event3DateLabel}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event3DateLabel: e.target.value,
                          })
                        }
                        placeholder="Hari & Tanggal (misal: Sabtu, 19 Desember 2026)"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event3TimeLabel}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event3TimeLabel: e.target.value,
                          })
                        }
                        placeholder="Jam Pelaksanaan"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event3Venue}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, event3Venue: e.target.value })
                        }
                        placeholder="Nama Gedung / Ballroom"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event3Address}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event3Address: e.target.value,
                          })
                        }
                        placeholder="Alamat Lengkap"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                      <input
                        type="text"
                        value={settingsForm.event3Dresscode}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            event3Dresscode: e.target.value,
                          })
                        }
                        placeholder="Dresscode"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <input
                      type="text"
                      value={settingsForm.event3MapsUrl}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, event3MapsUrl: e.target.value })
                      }
                      placeholder="Link Google Maps"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* 4. AYAT SUCI / KUTIPAN & TEKS PEMBUKA/PENUTUP UNDANGAN */}
              <div className="p-5 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35 space-y-3">
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-[#8B6914]">
                  4. Kutipan Ayat Suci &amp; Kalimat Pembuka / Penutup Undangan (Editable)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">
                      Isi Kutipan / Ayat Pernikahan
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.quoteVerse}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, quoteVerse: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Sumber Ayat / Kutipan
                    </label>
                    <input
                      type="text"
                      value={settingsForm.quoteSource}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, quoteSource: e.target.value })
                      }
                      placeholder="Contoh: Kolose 3 : 14"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kalimat Pembuka Undangan
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.invitationOpeningText}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          invitationOpeningText: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Kalimat Penutup Undangan
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.invitationClosingText}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          invitationClosingText: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 5. PROFIL MEMPELAI PRIA & WANITA (2 KARTU SIMETRIS) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                <div className="h-full space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                      5A. Profil Mempelai Pria
                    </h4>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nama Lengkap &amp; Gelar
                      </label>
                      <input
                        type="text"
                        value={settingsForm.groomFullName}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomFullName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nama Panggilan
                        </label>
                        <input
                          type="text"
                          value={settingsForm.groomNickname}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              groomNickname: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Pangkat / Gelar / Label
                        </label>
                        <input
                          type="text"
                          value={settingsForm.groomRankAndTitle}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              groomRankAndTitle: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Instansi / Profesi (Opsional)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.groomUnit}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, groomUnit: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Kota Asal
                        </label>
                        <input
                          type="text"
                          value={settingsForm.groomOrigin}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, groomOrigin: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Keterangan Orang Tua Mempelai Pria
                      </label>
                      <input
                        type="text"
                        value={settingsForm.groomParents}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomParents: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      URL Foto Mempelai Pria
                    </label>
                    <input
                      type="text"
                      value={settingsForm.groomPhotoUrl}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, groomPhotoUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                <div className="h-full space-y-3 bg-slate-50 p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-xs">
                      5B. Profil Mempelai Wanita
                    </h4>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Nama Lengkap &amp; Gelar
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brideFullName}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brideFullName: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Nama Panggilan
                        </label>
                        <input
                          type="text"
                          value={settingsForm.brideNickname}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              brideNickname: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-slate-700 mb-1">
                          Gelar / Label
                        </label>
                        <input
                          type="text"
                          value={settingsForm.brideTitle}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, brideTitle: e.target.value })
                          }
                          className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Kota Asal
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brideOrigin}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brideOrigin: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">
                        Keterangan Orang Tua Mempelai Wanita
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brideParents}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brideParents: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      URL Foto Mempelai Wanita
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bridePhotoUrl}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, bridePhotoUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* 6. AMPLOP DIGITAL / REKENING BANK (TAMBAH & HAPUS MANDIRI) */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-slate-900">
                      6. Pengaturan Amplop Digital / Rekening Bank &amp; Alamat Kado
                    </h4>
                    <p className="text-xs text-slate-500">
                      Tambahkan atau hapus nomor rekening bank / e-wallet yang tampil di undangan
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setSettingsForm({
                        ...settingsForm,
                        bankAccounts: [
                          ...(settingsForm.bankAccounts || []),
                          {
                            id: `bank_${Date.now().toString(36)}`,
                            bankName: 'BANK BCA',
                            accountNumber: '',
                            accountHolder: settingsForm.groomFullName,
                            branchOrNote: 'Transfer Amplop Digital',
                            type: 'BANK',
                          },
                        ],
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A192F] text-amber-300 font-bold text-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Tambah Rekening
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Nama Penerima Kado / QRIS
                    </label>
                    <input
                      type="text"
                      value={settingsForm.giftRecipientName}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          giftRecipientName: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Alamat Pengiriman Kado Fisik
                    </label>
                    <input
                      type="text"
                      value={settingsForm.giftShippingAddress}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          giftShippingAddress: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                {(settingsForm.bankAccounts || []).length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    Belum ada nomor rekening yang ditambahkan. Klik &ldquo;Tambah Rekening&rdquo; di kanan atas jika ingin menampilkan rekening di undangan.
                  </p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-stretch">
                    {settingsForm.bankAccounts.map((acc, idx) => (
                      <div
                        key={acc.id}
                        className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-amber-800">
                            Rekening #{idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setSettingsForm({
                                ...settingsForm,
                                bankAccounts: settingsForm.bankAccounts.filter(
                                  (b) => b.id !== acc.id
                                ),
                              })
                            }
                            className="text-rose-600 hover:underline text-[11px] font-bold flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" /> Hapus
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={acc.bankName}
                            onChange={(e) => {
                              const next = [...settingsForm.bankAccounts];
                              next[idx] = { ...acc, bankName: e.target.value };
                              setSettingsForm({ ...settingsForm, bankAccounts: next });
                            }}
                            placeholder="Nama Bank (BCA/Mandiri/BRI)"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <input
                            type="text"
                            value={acc.accountNumber}
                            onChange={(e) => {
                              const next = [...settingsForm.bankAccounts];
                              next[idx] = { ...acc, accountNumber: e.target.value };
                              setSettingsForm({ ...settingsForm, bankAccounts: next });
                            }}
                            placeholder="Nomor Rekening"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={acc.accountHolder}
                            onChange={(e) => {
                              const next = [...settingsForm.bankAccounts];
                              next[idx] = { ...acc, accountHolder: e.target.value };
                              setSettingsForm({ ...settingsForm, bankAccounts: next });
                            }}
                            placeholder="Atas Nama (a.n.)"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                          <input
                            type="text"
                            value={acc.branchOrNote}
                            onChange={(e) => {
                              const next = [...settingsForm.bankAccounts];
                              next[idx] = { ...acc, branchOrNote: e.target.value };
                              setSettingsForm({ ...settingsForm, bankAccounts: next });
                            }}
                            placeholder="Catatan / Cabang"
                            className="px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Save & Reset Bar */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between flex-wrap gap-3">
                {!isPanitia ? (
                  <button
                    type="button"
                    onClick={async () => {
                      await onResetDefault();
                      showToast('Data dikembalikan ke seed awal Database Lokal.');
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset ke Data Awal (Seed Default)
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-extrabold text-xs sm:text-sm shadow-md"
                >
                  <Save className="w-4 h-4" />
                  Simpan Seluruh Pengaturan Undangan
                </button>
              </div>
            </form>

            {/* MANAJEMEN 4 AKUN DEFAULT (KONFIRMASI SUPERADMIN) & AKUN PANITIA (KHUSUS USER DEFAULT) */}
            {!isPanitia && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
                {/* KIRI: 4 Akun Utama Default (Wajib Konfirmasi Superadmin) */}
                <form
                  onSubmit={handleUpdateDefaultUserForm}
                  className="h-full bg-white rounded-3xl p-6 shadow-sm border border-[#D4AF37]/40 flex flex-col justify-between space-y-5 text-xs sm:text-sm"
                >
                  <div className="space-y-4">
                    <div className="flex items-start gap-3 border-b border-stone-200 pb-4">
                      <div className="w-10 h-10 rounded-2xl bg-[#FAF3E3] border border-[#D4AF37]/40 flex items-center justify-center text-[#8B6914] shrink-0">
                        <Shield className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-serif text-lg font-bold text-stone-900">
                          Ubah Username &amp; Password Akun Utama
                        </h3>
                        <p className="text-xs text-stone-500">
                          Perubahan username atau password pada ke-4 akun utama sistem wajib menyertakan konfirmasi Superadmin (Pemilik Aplikasi)
                        </p>
                      </div>
                    </div>

                    {/* Pilihan 4 Akun Default */}
                    <div>
                      <label className="block font-bold text-stone-700 mb-1.5">
                        Pilih Akun Utama yang Akan Diubah:
                      </label>
                      <div className="grid grid-cols-2 gap-2.5 items-stretch">
                        {defaultSystemUsers.map((u) => {
                          const isSelected = selectedDefaultUserId === u.id;
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => handleSelectDefaultUserForEdit(u)}
                              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#FAF3E3] border-[#D4AF37] shadow-2xs'
                                  : 'bg-[#FAF8F5] border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9A742B]">
                                {u.role.replace('_', ' ')}
                              </span>
                              <span className="font-mono font-bold text-xs text-stone-900 mt-0.5 truncate">
                                {u.username}
                              </span>
                              <span className="text-[11px] text-stone-500 truncate">
                                {u.nama}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          Username Baru
                        </label>
                        <input
                          type="text"
                          required
                          value={secUsername}
                          onChange={(e) => setSecUsername(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5] font-mono"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-stone-700 mb-1">
                          Nama Tampilan
                        </label>
                        <input
                          type="text"
                          required
                          value={secName}
                          onChange={(e) => setSecName(e.target.value)}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-stone-700 mb-1">
                        Password Baru (Kosongkan jika hanya mengganti username/nama)
                      </label>
                      <input
                        type="password"
                        value={secNewPassword}
                        onChange={(e) => setSecNewPassword(e.target.value)}
                        placeholder="Masukkan password baru (minimal 6 karakter)"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 bg-[#FAF8F5]"
                      />
                    </div>

                    <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                      <label className="block font-bold text-amber-950 mb-1">
                        Konfirmasi Superadmin (Pemilik Aplikasi di Luar Sistem) *
                      </label>
                      <input
                        type="password"
                        required
                        value={secSuperadminConfirm}
                        onChange={(e) => setSecSuperadminConfirm(e.target.value)}
                        placeholder="Masukkan identitas Superadmin untuk otorisasi..."
                        className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white"
                      />
                      <p className="text-[11px] text-amber-800 mt-1">
                        Identitas Superadmin diverifikasi dengan hash satu arah di server dan tidak pernah ditampilkan di layar.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 mt-auto">
                    <button
                      type="submit"
                      disabled={isUpdatingSecurity}
                      className="w-full py-3 px-5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>
                        {isUpdatingSecurity
                          ? 'Memverifikasi Superadmin...'
                          : 'Konfirmasi & Simpan Perubahan Akun Utama'}
                      </span>
                    </button>
                  </div>
                </form>

                {/* KANAN: Manajemen Akun Panitia / WO (Tambah & Kurangi Panitia, Non-Budgeting) */}
                <div className="h-full bg-white rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between space-y-5 text-xs sm:text-sm">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-4">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                          Akses Terbatas • Non-Budgeting
                        </span>
                        <h3 className="font-serif text-lg font-bold text-slate-900 mt-1">
                          Manajemen Akun Panitia / WO ({panitiaUsers.length} Akun)
                        </h3>
                        <p className="text-xs text-slate-500">
                          Akun utama dapat menambah atau mengurangi akun Panitia. Panitia otomatis diblokir dari menu Anggaran/Budgeting.
                        </p>
                      </div>
                    </div>

                    {/* Form Tambah / Edit Panitia */}
                    <form
                      onSubmit={handleUpsertPanitiaForm}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-xs uppercase text-slate-800">
                          {panitiaEditId ? 'Edit Akun Panitia' : 'Tambah Akun Panitia Baru'}
                        </h4>
                        {panitiaEditId && (
                          <button
                            type="button"
                            onClick={() => {
                              setPanitiaEditId(undefined);
                              setPanitiaUsername('');
                              setPanitiaNama('');
                              setPanitiaPassword('');
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            Batal Edit
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Username Panitia *
                          </label>
                          <input
                            type="text"
                            required
                            value={panitiaUsername}
                            onChange={(e) => setPanitiaUsername(e.target.value)}
                            placeholder="Contoh: panitia_acara"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Nama / Seksi Panitia *
                          </label>
                          <input
                            type="text"
                            required
                            value={panitiaNama}
                            onChange={(e) => setPanitiaNama(e.target.value)}
                            placeholder="Contoh: Koordinator Lapangan"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            Jabatan / Tugas
                          </label>
                          <input
                            type="text"
                            value={panitiaJabatan}
                            onChange={(e) => setPanitiaJabatan(e.target.value)}
                            placeholder="Panitia / WO"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block font-semibold text-slate-700 mb-1">
                            {panitiaEditId
                              ? 'Password Baru (Opsional)'
                              : 'Password Panitia *'}
                          </label>
                          <input
                            type="password"
                            required={!panitiaEditId}
                            value={panitiaPassword}
                            onChange={(e) => setPanitiaPassword(e.target.value)}
                            placeholder="Minimal 6 karakter"
                            className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSavingPanitia}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#0A192F] hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center justify-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        <span>
                          {isSavingPanitia
                            ? 'Menyimpan...'
                            : panitiaEditId
                            ? 'Simpan Perubahan Akun Panitia'
                            : 'Tambah Akun Panitia'}
                        </span>
                      </button>
                    </form>

                    {/* Daftar Akun Panitia */}
                    <div className="space-y-2 max-h-[210px] overflow-y-auto pr-1">
                      {panitiaUsers.length === 0 ? (
                        <div className="p-4 rounded-2xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          Belum ada akun Panitia tambahan. Gunakan formulir di atas untuk menambahkan akun Panitia.
                        </div>
                      ) : (
                        panitiaUsers.map((p) => (
                          <div
                            key={p.id}
                            className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2"
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono font-bold text-xs text-slate-900">
                                  {p.username}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 text-[10px] font-bold">
                                  PANITIA (Non-Budget)
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 truncate">
                                {p.nama} &bull; {p.jabatan}
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setPanitiaEditId(p.id);
                                  setPanitiaUsername(p.username);
                                  setPanitiaNama(p.nama);
                                  setPanitiaJabatan(p.jabatan);
                                  setPanitiaPassword('');
                                }}
                                className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePanitiaAccount(p.id, p.username)
                                }
                                className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                                title="Hapus Akun Panitia"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between mt-auto">
                    <span>Hak Akses Panitia: Checklist, Tamu &amp; Pengaturan Undangan</span>
                    <span className="font-bold text-rose-600">Budgeting Terkunci</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =======================================================================
          MODAL 1: TAMBAH / EDIT TUGAS CHECKLIST
         ======================================================================= */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs sm:text-sm">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {editingTask.id ? 'Edit Tugas Checklist' : 'Tambah Tugas Checklist Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Judul Tugas</label>
                <input
                  type="text"
                  value={editingTask.title || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  placeholder="Contoh: Finalisasi berkas Surat Izin Kawin..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori Domain</label>
                  <select
                    value={editingTask.category || 'Polri'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        category: e.target.value as TaskCategory,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fase Timeline</label>
                  <select
                    value={editingTask.timelinePhase || 'H-1 Bulan'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        timelinePhase: e.target.value as TimelinePhase,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    {TIMELINE_PHASES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tenggat (Due)</label>
                  <input
                    type="date"
                    value={editingTask.due || '2026-12-01'}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, due: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={editingTask.priority || 'Tinggi'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">PIC / Owner</label>
                  <select
                    value={editingTask.owner || 'Bersama'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        owner: e.target.value as TaskOwner,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Saya">Saya</option>
                    <option value="Calon">Calon</option>
                    <option value="Bersama">Bersama</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="WO / Panitia">WO / Panitia</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <textarea
                  rows={3}
                  value={editingTask.notes || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, notes: e.target.value })
                  }
                  placeholder="Catatan detail berkas atau koordinasi..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingTask.title?.trim()) return;
                  await onUpsertTask({
                    ...editingTask,
                    title: editingTask.title.trim(),
                    updatedBy: adminUser.username,
                  });
                  setEditingTask(null);
                  showToast('Tugas checklist berhasil disimpan!');
                }}
                className="px-5 py-2 rounded-xl bg-[#0A192F] text-amber-300 font-bold"
              >
                Simpan Tugas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2: TAMBAH / EDIT VENDOR & BUDGET
         ======================================================================= */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs sm:text-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {editingBudget.id
                  ? 'Edit & Revisi Anggaran / Vendor'
                  : 'Tambah Pos Anggaran & Vendor Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Kebutuhan / Paket
                </label>
                <input
                  type="text"
                  value={editingBudget.itemName || ''}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, itemName: e.target.value })
                  }
                  placeholder="Contoh: Katering Resepsi / Gedung / Dekorasi"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingBudget.category || 'Katering & Jamuan'}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        category: e.target.value as VendorCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    {VENDOR_CATEGORIES.map((vc) => (
                      <option key={vc} value={vc}>
                        {vc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Vendor</label>
                  <input
                    type="text"
                    value={editingBudget.vendorName || ''}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, vendorName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estimasi Awal (Rp)</label>
                  <input
                    type="number"
                    value={editingBudget.estimatedCost ?? 0}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        estimatedCost: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Realisasi / Revisi (Rp)
                  </label>
                  <input
                    type="number"
                    value={editingBudget.actualCost ?? 0}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        actualCost: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Sudah Bayar (Rp)</label>
                  <input
                    type="number"
                    value={editingBudget.paidAmount ?? 0}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        paidAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status Bayar</label>
                  <select
                    value={editingBudget.paymentStatus || 'BELUM_DP'}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        paymentStatus: e.target.value as VendorPaymentStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="BELUM_DP">BELUM DP</option>
                    <option value="DP_TERBAYAR">DP TERBAYAR</option>
                    <option value="CICILAN">CICILAN</option>
                    <option value="LUNAS">LUNAS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={editingBudget.dueDate || '2026-12-01'}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kontak Vendor</label>
                  <input
                    type="text"
                    value={editingBudget.vendorContact || ''}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, vendorContact: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-amber-800 mb-1">
                  Catatan Revisi Anggaran (Alasan Perubahan / Penyesuaian)
                </label>
                <input
                  type="text"
                  value={editingBudget.revisionNote || ''}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, revisionNote: e.target.value })
                  }
                  placeholder="Contoh: Penambahan porsi katering 50 pax / diskon paket gedung"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/40"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan Kontrak</label>
                <textarea
                  rows={2}
                  value={editingBudget.notes || ''}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingBudget.itemName?.trim()) return;
                  await onUpsertBudget({
                    ...editingBudget,
                    itemName: editingBudget.itemName.trim(),
                  });
                  setEditingBudget(null);
                  showToast('Data anggaran & revisi vendor berhasil disimpan!');
                }}
                className="px-5 py-2 rounded-xl bg-[#0A192F] text-amber-300 font-bold"
              >
                Simpan Anggaran
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 3: TAMBAH / EDIT TAMU UNDANGAN
         ======================================================================= */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs sm:text-sm max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg font-bold text-slate-900">
                {editingGuest.id ? 'Edit Data Tamu Undangan' : 'Tambah Tamu Undangan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Lengkap &amp; Pangkat / Gelar
                </label>
                <input
                  type="text"
                  value={editingGuest.guestName || ''}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, guestName: e.target.value })
                  }
                  placeholder="Contoh: KOMJEN POL ASEP SAFRUDIN, S.I.K., M.H."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Jabatan / Instansi / Satker
                  </label>
                  <input
                    type="text"
                    value={editingGuest.institution || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, institution: e.target.value })
                    }
                    placeholder="KABARESKRIM POLRI"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    No. WhatsApp / Kontak Spri
                  </label>
                  <input
                    type="text"
                    value={editingGuest.phone || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, phone: e.target.value })
                    }
                    placeholder="0812xxxx / Hub Spri"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingGuest.guestType || 'Pejabat/VIP'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        guestType: e.target.value as GuestType,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Pejabat/VIP">Pejabat/VIP</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Rekan Kerja/Polri">Rekan Kerja/Polri</option>
                    <option value="Teman/Sahabat">Teman/Sahabat</option>
                    <option value="Tetangga/Gereja">Tetangga/Gereja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={editingGuest.priority || 'P1 - VIP'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        priority: e.target.value as GuestPriority,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="P1 - VIP">P1 - VIP</option>
                    <option value="P2 - Utama">P2 - Utama</option>
                    <option value="P3 - Reguler">P3 - Reguler</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pihak</label>
                  <select
                    value={editingGuest.side || 'Mempelai Pria'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        side: e.target.value as GuestSide,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Mempelai Pria">Mempelai Pria</option>
                    <option value="Mempelai Wanita">Mempelai Wanita</option>
                    <option value="Bersama">Bersama</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Format Undangan</label>
                  <select
                    value={editingGuest.invitationFormat || 'Cetak Tebal'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        invitationFormat: e.target.value as InvitationFormat,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Cetak Tebal">Cetak Tebal</option>
                    <option value="Cetak Reguler">Cetak Reguler</option>
                    <option value="Digital WA">Digital WA</option>
                    <option value="Cetak & Digital">Cetak &amp; Digital</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kuota Pax</label>
                  <input
                    type="number"
                    value={editingGuest.pax ?? 2}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, pax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Status RSVP</label>
                  <select
                    value={editingGuest.rsvpStatus || 'Belum Konfirmasi'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        rsvpStatus: e.target.value as RsvpStatus,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Belum Konfirmasi">Belum Konfirmasi</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Masih Ragu">Masih Ragu</option>
                    <option value="Tidak Hadir">Tidak Hadir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Alamat / Lantai Ruangan
                  </label>
                  <input
                    type="text"
                    value={editingGuest.address || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, address: e.target.value })
                    }
                    placeholder="Lt. 17 Gedung Bareskrim"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Status Pengiriman
                  </label>
                  <select
                    value={editingGuest.deliveryStatus || 'Belum Disiapkan'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        deliveryStatus: e.target.value as DeliveryStatus,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-slate-50"
                  >
                    <option value="Belum Disiapkan">Belum Disiapkan</option>
                    <option value="Siap Kirim">Siap Kirim</option>
                    <option value="Sudah Dikirim">Sudah Dikirim</option>
                    <option value="Sudah Diterima">Sudah Diterima</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editingGuest.notes || ''}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, notes: e.target.value })
                  }
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  if (!editingGuest.guestName?.trim()) return;
                  await onUpsertGuest({
                    ...editingGuest,
                    guestName: editingGuest.guestName.trim(),
                    updatedBy: adminUser.username,
                  });
                  setEditingGuest(null);
                  showToast('Data tamu berhasil disimpan!');
                }}
                className="px-5 py-2 rounded-xl bg-[#0A192F] text-amber-300 font-bold"
              >
                Simpan Tamu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 4: GENERATOR TEKS & LINK UNDANGAN WA
         ======================================================================= */}
      {waPreviewGuest && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          {(() => {
            const generated = generateWhatsAppMessage(waPreviewGuest, state.settings);
            return (
              <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-amber-300 space-y-4 text-xs sm:text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">
                      Generator Undangan WhatsApp Otomatis
                    </span>
                    <h3 className="font-serif text-lg font-bold text-slate-900">
                      {waPreviewGuest.guestName}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaPreviewGuest(null)}
                    className="p-1.5 rounded-lg hover:bg-slate-100"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-1">
                  <p className="text-[11px] font-bold text-amber-900">
                    Link Undangan Khusus Tamu Ini:
                  </p>
                  <p className="font-mono text-xs text-slate-800 break-all">
                    {generated.inviteUrl}
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Preview Pesan Pengantar WhatsApp:
                  </label>
                  <textarea
                    readOnly
                    rows={10}
                    value={generated.messageText}
                    className="w-full p-3.5 rounded-2xl border border-slate-300 bg-slate-50 font-sans text-xs leading-relaxed"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generated.messageText);
                      showToast('Seluruh teks undangan WA berhasil disalin!');
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Teks WA
                  </button>
                  <a
                    href={generated.waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim Langsung ke WhatsApp
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
