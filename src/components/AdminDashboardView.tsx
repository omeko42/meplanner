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
  UserPlus,
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
  // SETTINGS, USER MANAGEMENT & BACKUP MODULE STATE (LINKEDIN CARD + MODAL STYLE)
  // ============================================================================
  const [settingsForm, setSettingsForm] = useState<WeddingSettings>(state.settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // LinkedIn-style "Show all ->" expand/collapse toggles for section cards
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [showAllBudget, setShowAllBudget] = useState(false);
  const [showAllGuests, setShowAllGuests] = useState(false);
  const [showAllBanks, setShowAllBanks] = useState(false);
  const [showAllPanitia, setShowAllPanitia] = useState(false);
  const [showAllSectionsToggle, setShowAllSectionsToggle] = useState(false);

  // Active LinkedIn-style popup modal for Settings & Users
  const [activeSettingsModal, setActiveSettingsModal] = useState<
    | null
    | 'background'
    | 'visibility'
    | 'countdown'
    | 'event1'
    | 'event2'
    | 'event3'
    | 'quote'
    | 'couple_groom'
    | 'couple_bride'
    | 'bank_account'
    | 'gift_address'
    | 'default_user'
    | 'panitia_user'
    | 'budget_cap'
  >(null);

  // State for adding/editing a single Bank Account inside modal
  const [editingBankIndex, setEditingBankIndex] = useState<number | null>(null);
  const [bankForm, setBankForm] = useState<{
    id: string;
    bankName: string;
    accountNumber: string;
    accountHolder: string;
    branchOrNote: string;
    type: 'BANK' | 'EWALLET' | 'QRIS';
  }>({
    id: '',
    bankName: 'BANK BCA',
    accountNumber: '',
    accountHolder: state.settings.groomFullName || 'John Doe',
    branchOrNote: 'Transfer Amplop Digital',
    type: 'BANK',
  });

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
    adminUser.isDefaultUser ? adminUser.id : 'usr-default-1'
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

  const openSettingsPopup = (
    modalType: NonNullable<typeof activeSettingsModal>
  ) => {
    setSettingsForm(state.settings);
    setActiveSettingsModal(modalType);
  };

  const handleSelectDefaultUserForEdit = (u: AdminUser) => {
    setSelectedDefaultUserId(u.id);
    setSecUsername(u.username);
    setSecName(u.nama);
    setSecNewPassword('');
    setSecSuperadminConfirm('');
    setActiveSettingsModal('default_user');
  };

  const handleSaveSettingsModal = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    await onUpdateSettings({
      ...settingsForm,
      updatedBy: adminUser.username,
    });
    setActiveSettingsModal(null);
    showToast('Perubahan berhasil disimpan!');
  };

  const handleSaveBankAccountModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankForm.bankName.trim() || !bankForm.accountNumber.trim()) return;
    const currentAccounts = [...(state.settings.bankAccounts || [])];
    if (editingBankIndex !== null && currentAccounts[editingBankIndex]) {
      currentAccounts[editingBankIndex] = {
        ...bankForm,
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        accountHolder: bankForm.accountHolder.trim(),
      };
    } else {
      currentAccounts.push({
        ...bankForm,
        id: `bank_${Date.now().toString(36)}`,
        bankName: bankForm.bankName.trim(),
        accountNumber: bankForm.accountNumber.trim(),
        accountHolder: bankForm.accountHolder.trim(),
      });
    }
    const nextSettings = {
      ...state.settings,
      bankAccounts: currentAccounts,
      updatedBy: adminUser.username,
    };
    setSettingsForm(nextSettings);
    await onUpdateSettings(nextSettings);
    setActiveSettingsModal(null);
    setEditingBankIndex(null);
    showToast('Rekening amplop digital berhasil disimpan!');
  };

  const handleDeleteBankAccount = async (bankId: string) => {
    const nextAccounts = (state.settings.bankAccounts || []).filter(
      (b) => b.id !== bankId
    );
    const nextSettings = {
      ...state.settings,
      bankAccounts: nextAccounts,
      updatedBy: adminUser.username,
    };
    setSettingsForm(nextSettings);
    await onUpdateSettings(nextSettings);
    showToast('Rekening berhasil dihapus.');
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
      setActiveSettingsModal(null);
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
      setActiveSettingsModal(null);
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
            MODUL 2: CHECKLIST KESIAPAN BERTAHAP (LINKEDIN SECTION CARD STYLE)
           ===================================================================== */}
        {activeTab === 'checklist' && (
          <div className="space-y-4">
            {/* Phase Timeline Pills & Filters */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedPhase('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                    selectedPhase === 'ALL'
                      ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
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
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                        selectedPhase === phase
                          ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {phase} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
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
            </div>

            {/* LinkedIn-Style Checklist Section Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Card Header: Title (Count) on left + Plus & Edit Icons on right */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Checklist Kesiapan ({filteredTasks.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Klik tombol + untuk menambah tugas baru atau ikon pensil untuk mengedit rincian tugas
                  </p>
                </div>
                <div className="flex items-center gap-1">
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
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                    title="Tambahkan tugas checklist"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {filteredTasks[0] && (
                    <button
                      type="button"
                      onClick={() => setEditingTask(filteredTasks[0])}
                      className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                      title="Edit tugas checklist"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body: Clean LinkedIn-Style Divider Rows */}
              <div className="divide-y divide-slate-200 px-6">
                {(showAllTasks ? filteredTasks : filteredTasks.slice(0, 8)).map((task) => {
                  const effectiveStatus: TaskStatus = task.done
                    ? 'SELESAI'
                    : task.status || 'BELUM';
                  return (
                    <div
                      key={task.id}
                      className="py-4 flex items-start justify-between gap-4 group"
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <button
                          type="button"
                          onClick={() => handleCycleTaskStatus(task)}
                          className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                            effectiveStatus === 'SELESAI'
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : effectiveStatus === 'PROSES'
                              ? 'bg-amber-500 border-amber-500 text-slate-950'
                              : 'bg-white border-slate-400 hover:border-[#0A66C2]'
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
                          <h4
                            className={`font-bold text-sm sm:text-base ${
                              effectiveStatus === 'SELESAI'
                                ? 'line-through text-slate-400'
                                : 'text-slate-900'
                            }`}
                          >
                            {task.title}
                          </h4>

                          <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                              <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              {task.category} &bull; {task.timelinePhase}
                            </span>
                            <span>&bull; PIC: {task.owner}</span>
                            <span>&bull; Target: {task.due}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                effectiveStatus === 'SELESAI'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : effectiveStatus === 'PROSES'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {effectiveStatus}
                            </span>
                          </div>

                          {task.notes && (
                            <p className="text-xs text-slate-500">{task.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingTask(task)}
                          className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                          title="Edit Tugas"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            await onDeleteTask(task.id);
                            showToast(`Tugas "${task.title}" dihapus.`);
                          }}
                          className="w-9 h-9 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600"
                          title="Hapus Tugas"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* LinkedIn-Style "Show all ->" Footer Button */}
              {filteredTasks.length > 8 && (
                <button
                  type="button"
                  onClick={() => setShowAllTasks(!showAllTasks)}
                  className="w-full py-3.5 border-t border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <span>
                    {showAllTasks
                      ? 'Sembunyikan sebagian tugas'
                      : `Tampilkan semua (${filteredTasks.length}) \u2192`}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            MODUL 3: ANGGARAN, REVISI BUDGET & VENDOR (LINKEDIN SECTION CARD STYLE)
           ===================================================================== */}
        {activeTab === 'budget' && !isPanitia && (
          <div className="space-y-4">
            {/* 4 Symmetrical Financial Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch">
              <div className="h-full bg-white rounded-2xl p-4 border border-slate-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase text-slate-500">
                    Target Pagu Anggaran
                  </p>
                  <button
                    type="button"
                    onClick={() => openSettingsPopup('budget_cap')}
                    className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                    title="Edit / Revisi Target Pagu Anggaran"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
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

            {/* LinkedIn-Style Budget & Vendor Section Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              {/* Header with + and Edit icons on top-right */}
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                    Pos Anggaran &amp; Revisi Vendor ({filteredBudgetItems.length})
                  </h2>
                  <p className="text-xs text-slate-500">
                    Klik + untuk menambah pos pengeluaran baru atau ikon pensil untuk merevisi anggaran
                  </p>
                </div>
                <div className="flex items-center gap-1">
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
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                    title="Tambahkan pos anggaran / vendor"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (filteredBudgetItems[0]) {
                        setEditingBudget(filteredBudgetItems[0]);
                      } else {
                        openSettingsPopup('budget_cap');
                      }
                    }}
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                    title="Edit / Revisi Anggaran"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {filteredBudgetItems.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-slate-700">
                    Belum ada pos anggaran atau vendor yang tercatat.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Klik tombol <strong>+</strong> di sudut kanan atas kartu ini untuk mulai menambahkan pos biaya dan vendor pernikahan Anda.
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
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Tambahkan Pos Anggaran
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-slate-200 px-6">
                    {(showAllBudget ? filteredBudgetItems : filteredBudgetItems.slice(0, 6)).map(
                      (item) => {
                        const effectiveTotal =
                          item.actualCost > 0 ? item.actualCost : item.estimatedCost;
                        const remaining = Math.max(0, effectiveTotal - item.paidAmount);
                        return (
                          <div
                            key={item.id}
                            className="py-4 flex items-start justify-between gap-4"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                                  {item.itemName}
                                </h3>
                                {(item.revisionCount || 0) > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 text-[10px] font-bold">
                                    Revisi ke-{item.revisionCount}
                                  </span>
                                )}
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    item.paymentStatus === 'LUNAS'
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : 'bg-amber-100 text-amber-900'
                                  }`}
                                >
                                  {item.paymentStatus.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                                <Wallet className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                <span>
                                  {item.category} &bull; Vendor: {item.vendorName || '-'}
                                </span>
                                <span>
                                  &bull; Estimasi: {formatRupiah(item.estimatedCost)}
                                </span>
                                <span className="font-bold text-slate-900">
                                  &bull; Realisasi/Revisi: {formatRupiah(effectiveTotal)}
                                </span>
                                <span className="text-emerald-700 font-semibold">
                                  &bull; Dibayar: {formatRupiah(item.paidAmount)}
                                </span>
                                {remaining > 0 && (
                                  <span className="text-rose-600 font-semibold">
                                    &bull; Sisa: {formatRupiah(remaining)}
                                  </span>
                                )}
                              </p>
                              {item.revisionNote && (
                                <p className="text-xs text-indigo-800">
                                  Catatan Revisi: {item.revisionNote}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-slate-500">{item.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingBudget(item)}
                                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                                title="Edit / Revisi Pos Anggaran"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  await onDeleteBudget(item.id);
                                  showToast(`Pos "${item.itemName}" dihapus.`);
                                }}
                                className="w-9 h-9 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600"
                                title="Hapus Pos Anggaran"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>

                  {filteredBudgetItems.length > 6 && (
                    <button
                      type="button"
                      onClick={() => setShowAllBudget(!showAllBudget)}
                      className="w-full py-3.5 border-t border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <span>
                        {showAllBudget
                          ? 'Sembunyikan sebagian pos anggaran'
                          : `Tampilkan semua (${filteredBudgetItems.length}) \u2192`}
                      </span>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            MODUL 4: MANAJEMEN TAMU, BUKU TAMU & GENERATOR UNDANGAN WA (LINKEDIN CARD STYLE)
           ===================================================================== */}
        {activeTab === 'guests' && (
          <div className="space-y-4">
            {/* Sub-tab & Filter Bar */}
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuestSubTab('list')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      guestSubTab === 'list'
                        ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Daftar Tamu ({state.guests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestSubTab('wishes')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      guestSubTab === 'wishes'
                        ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                        : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    Buku Tamu &amp; Doa ({state.wishes.length})
                  </button>
                </div>
              </div>

              {guestSubTab === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
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
              )}
            </div>

            {guestSubTab === 'list' ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                {/* LinkedIn-Style Header with + and Edit icons */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Tamu Undangan ({filteredGuests.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Klik + untuk menambah tamu baru atau ikon pensil pada tiap baris untuk mengedit tamu
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
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
                      className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                      title="Tambahkan tamu undangan"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {filteredGuests[0] && (
                      <button
                        type="button"
                        onClick={() => setEditingGuest(filteredGuests[0])}
                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                        title="Edit tamu undangan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-slate-200 px-6">
                  {(showAllGuests ? filteredGuests : filteredGuests.slice(0, 6)).map((guest) => {
                    const waData = generateWhatsAppMessage(guest, state.settings);
                    const isLinkCopied = copiedGuestLinkId === guest.id;
                    return (
                      <div
                        key={guest.id}
                        className="py-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-bold text-sm sm:text-base text-slate-900">
                              {guest.guestName}
                            </h3>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-900 text-amber-300">
                              {guest.invitationCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                              {guest.priority}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 flex items-center gap-1.5 flex-wrap">
                            <Award className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>
                              {guest.institution || guest.guestType} &bull; {guest.side}
                            </span>
                            <span>
                              &bull; RSVP: <strong>{guest.rsvpStatus}</strong> ({guest.pax} Pax)
                            </span>
                            {guest.address && <span>&bull; {guest.address}</span>}
                          </p>
                          {guest.notes && (
                            <p className="text-xs text-slate-500">{guest.notes}</p>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          <a
                            href={waData.waHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                          >
                            <Send className="w-3 h-3" /> Kirim WA
                          </a>
                          <button
                            type="button"
                            onClick={() => setWaPreviewGuest(guest)}
                            className="px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200"
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
                            className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                          >
                            {isLinkCopied ? (
                              <>
                                <Check className="w-3 h-3 text-emerald-600" /> Disalin
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Link
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onSwitchToPublicPreview(guest)}
                            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                            title="Preview Undangan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGuest(guest)}
                            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                            title="Edit Tamu"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              await onDeleteGuest(guest.id);
                              showToast(`Tamu "${guest.guestName}" dihapus.`);
                            }}
                            className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600"
                            title="Hapus Tamu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {filteredGuests.length > 6 && (
                  <button
                    type="button"
                    onClick={() => setShowAllGuests(!showAllGuests)}
                    className="w-full py-3.5 border-t border-slate-200 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <span>
                      {showAllGuests
                        ? 'Sembunyikan sebagian tamu'
                        : `Tampilkan semua (${filteredGuests.length}) \u2192`}
                    </span>
                  </button>
                )}
              </div>
            ) : (
              /* SUB-TAB BUKU TAMU & MODERASI UCAPAN DOA */
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Buku Tamu &amp; Ucapan Doa ({state.wishes.length})
                    </h2>
                    <p className="text-xs text-slate-500">
                      Daftar ucapan doa yang dikirim langsung oleh tamu melalui halaman undangan
                    </p>
                  </div>
                </div>
                {state.wishes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500">
                    Belum ada ucapan doa yang masuk dari tamu.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200 px-6">
                    {state.wishes.map((w) => (
                      <div key={w.id} className="py-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900">
                                {w.guestName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {w.rsvpStatus} ({w.pax} Pax)
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {w.institution || w.relation}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={async () => {
                                await onTogglePinWish(w.id);
                                showToast('Status sematan ucapan diperbarui.');
                              }}
                              className="px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center gap-1"
                            >
                              <Pin className="w-3 h-3" /> {w.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingWishId(w.id);
                                setReplyText(w.replyFromCouple || '');
                              }}
                              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                              title="Balas Ucapan"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await onDeleteWish(w.id);
                                showToast('Ucapan dihapus.');
                              }}
                              className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-slate-400 hover:text-rose-600"
                              title="Hapus Ucapan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-slate-700">&ldquo;{w.message}&rdquo;</p>
                        {w.replyFromCouple && (
                          <p className="text-xs text-amber-800 pl-3 border-l-2 border-amber-500">
                            <strong>Balasan:</strong> {w.replyFromCouple}
                          </p>
                        )}
                        {replyingWishId === w.id && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="text"
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Tulis balasan terima kasih..."
                              className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-xs"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                await onReplyWish(w.id, replyText);
                                setReplyingWishId(null);
                                showToast('Balasan berhasil disimpan!');
                              }}
                              className="px-4 py-1.5 rounded-full bg-[#0A66C2] text-white font-bold text-xs"
                            >
                              Simpan
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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

            {/* =====================================================================
                LINKEDIN-STYLE SECTION CARDS FOR SETTINGS, INVITATION & ACCOUNTS
               ===================================================================== */}
            <div className="space-y-4">
              {/* CARD 1: BACKGROUND & TRANSPARANSI UNDANGAN */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Background &amp; Transparansi Undangan (3)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Wallpaper halaman, foto sampul, banner prewedding, dan efek kaca transparan
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('background')}
                      title="Pilih Preset / Tambah Background"
                      className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('background')}
                      title="Edit Background & Transparansi"
                      className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="divide-y divide-slate-200">
                  <div className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={state.settings.coverBgUrl}
                        alt="Cover"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900">
                          Background Sampul Pembuka (Cover)
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {state.settings.coverBgUrl || 'Default'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('background')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={state.settings.heroPrewedUrl}
                        alt="Hero"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900">
                          Banner Utama / Siluet Foto Prewedding
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {state.settings.heroPrewedUrl || 'Default'}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('background')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={state.settings.pageBgUrl}
                        alt="Page BG"
                        className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900">
                          Wallpaper Halaman &amp; Lapisan Transparan (Pearl Veil)
                        </p>
                        <p className="text-xs text-slate-500">
                          Transparansi {state.settings.bgOverlayOpacity ?? 88}% • Blur Kaca:{' '}
                          {(state.settings.bgBlurIntensity || 'sm').toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('background')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 2: VISIBILITAS SEKSI UNDANGAN */}
              {(() => {
                const visibilityItems = [
                  { key: 'showQuoteSection' as const, label: 'Kutipan Ayat Suci / Doa Pernikahan' },
                  { key: 'showCoupleSection' as const, label: 'Profil Kedua Mempelai & Orang Tua' },
                  { key: 'showEvent1' as const, label: `Acara 1 (${state.settings.event1Title})` },
                  { key: 'showEvent2' as const, label: `Acara 2 (${state.settings.event2Title})` },
                  { key: 'showEvent3' as const, label: `Acara 3 (${state.settings.event3Title})` },
                  { key: 'showLoveStorySection' as const, label: 'Kisah Kasih (Love Story Timeline)' },
                  { key: 'showGallerySection' as const, label: 'Galeri Foto Prewedding' },
                  { key: 'showRsvpSection' as const, label: 'Form Konfirmasi Kehadiran (RSVP) & Buku Tamu' },
                  { key: 'showGiftSection' as const, label: 'Amplop Digital & Alamat Pengiriman Kado' },
                ];
                const visibleRows = showAllSectionsToggle
                  ? visibilityItems
                  : visibilityItems.slice(0, 4);
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Bagian Undangan yang Ditampilkan ({visibilityItems.filter((i) => state.settings[i.key] !== false).length}/{visibilityItems.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Atur seksi mana saja yang muncul atau disembunyikan pada halaman tamu
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => openSettingsPopup('visibility')}
                        title="Edit Tampilan Seksi Undangan"
                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {visibleRows.map((item) => {
                        const isShown = state.settings[item.key] !== false;
                        return (
                          <div
                            key={item.key}
                            className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-900">{item.label}</p>
                              <p className="text-xs text-slate-500">
                                {isShown
                                  ? 'Tampil secara publik di halaman undangan tamu'
                                  : 'Disembunyikan dari halaman undangan tamu'}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-bold ${
                                isShown
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-500 border border-slate-200'
                              }`}
                            >
                              {isShown ? 'Ditampilkan' : 'Disembunyikan'}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAllSectionsToggle(!showAllSectionsToggle)}
                      className="w-full py-3.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-200 transition-colors flex items-center justify-center gap-1.5"
                    >
                      {showAllSectionsToggle
                        ? 'Sembunyikan sebagian'
                        : `Tampilkan semua ${visibilityItems.length} bagian →`}
                    </button>
                  </div>
                );
              })()}

              {/* CARD 3: RANGKAIAN ACARA & TANGGAL COUNTDOWN */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Rangkaian Acara &amp; Tanggal Countdown (4)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ubah tanggal pemberkatan, resepsi, waktu countdown, gedung, dan link Google Maps secara mandiri
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSettingsPopup('countdown')}
                    title="Edit Tanggal Countdown Utama"
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {/* Countdown Utama */}
                  <div className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="space-y-0.5">
                      <p className="font-bold text-sm text-slate-900">
                        Target Waktu Countdown Utama &amp; Subjudul
                      </p>
                      <p className="text-xs text-slate-600">
                        Hari-H: <span className="font-mono font-semibold">{(state.settings.weddingDatetime || '').slice(0, 16).replace('T', ' ')} WIB</span> • Acara 1: <span className="font-mono font-semibold">{(state.settings.bistonDatetime || '').slice(0, 16).replace('T', ' ')} WIB</span>
                      </p>
                      <p className="text-xs text-slate-500">
                        Subjudul Header: {state.settings.subtitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('countdown')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Acara 1 */}
                  <div className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">
                          {state.settings.event1Title}
                        </p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                          Acara 1
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {state.settings.event1DateLabel} • {state.settings.event1TimeLabel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {state.settings.event1Venue} — {state.settings.event1Address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('event1')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Acara 2 */}
                  <div className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">
                          {state.settings.event2Title}
                        </p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                          Pemberkatan / Akad
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {state.settings.event2DateLabel} • {state.settings.event2TimeLabel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {state.settings.event2Venue} — {state.settings.event2Address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('event2')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Acara 3 */}
                  <div className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-slate-900">
                          {state.settings.event3Title}
                        </p>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                          Resepsi Utama
                        </span>
                      </div>
                      <p className="text-xs text-slate-600">
                        {state.settings.event3DateLabel} • {state.settings.event3TimeLabel}
                      </p>
                      <p className="text-xs text-slate-500">
                        {state.settings.event3Venue} — {state.settings.event3Address}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('event3')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 4: PROFIL KEDUA MEMPELAI */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Profil Kedua Mempelai (2)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Data nama lengkap, panggilan, gelar, orang tua, dan foto profil mempelai
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSettingsPopup('couple_groom')}
                    title="Edit Profil Mempelai"
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  {/* Mempelai Pria */}
                  <div className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={state.settings.groomPhotoUrl}
                        alt={state.settings.groomFullName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900">
                          {state.settings.groomFullName}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({state.settings.groomNickname})
                          </span>
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {state.settings.groomRankAndTitle} • {state.settings.groomOrigin}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {state.settings.groomParents}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('couple_groom')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Mempelai Wanita */}
                  <div className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-slate-50/70">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={state.settings.bridePhotoUrl}
                        alt={state.settings.brideFullName}
                        className="w-12 h-12 rounded-full object-cover border border-slate-200 shrink-0 bg-slate-100"
                      />
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-slate-900">
                          {state.settings.brideFullName}{' '}
                          <span className="text-xs font-normal text-slate-500">
                            ({state.settings.brideNickname})
                          </span>
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {state.settings.brideTitle} • {state.settings.brideOrigin}
                        </p>
                        <p className="text-xs text-slate-500 truncate">
                          {state.settings.brideParents}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('couple_bride')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 5: KUTIPAN AYAT SUCI & KALIMAT UNDANGAN */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Kutipan Ayat &amp; Kalimat Sambutan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Ayat suci pernikahan serta kalimat pembuka dan penutup pada undangan digital
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => openSettingsPopup('quote')}
                    title="Edit Kutipan Ayat & Kalimat"
                    className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>

                <div className="divide-y divide-slate-200">
                  <div className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-900">
                        {state.settings.quoteSource || 'Kutipan Ayat Pernikahan'}
                      </p>
                      <p className="text-xs text-slate-600 italic">
                        &ldquo;{state.settings.quoteVerse}&rdquo;
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('quote')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="px-6 py-4 flex items-start justify-between gap-4 hover:bg-slate-50/70">
                    <div className="space-y-1">
                      <p className="font-bold text-sm text-slate-900">
                        Kalimat Pembuka &amp; Penutup Undangan
                      </p>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {state.settings.invitationOpeningText}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openSettingsPopup('quote')}
                      className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* CARD 6: AMPLOP DIGITAL & REKENING BANK */}
              {(() => {
                const allAccounts = state.settings.bankAccounts || [];
                const visibleAccounts = showAllBanks ? allAccounts : allAccounts.slice(0, 3);
                return (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Amplop Digital &amp; Rekening ({allAccounts.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Nomor rekening bank, e-wallet, dan alamat pengiriman tanda kasih fisik
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBankIndex(null);
                            setBankForm({
                              id: '',
                              bankName: 'BANK BCA',
                              accountNumber: '',
                              accountHolder: state.settings.groomFullName || 'John Doe',
                              branchOrNote: 'Transfer Amplop Digital',
                              type: 'BANK',
                            });
                            setActiveSettingsModal('bank_account');
                          }}
                          title="Tambah Rekening Baru"
                          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openSettingsPopup('gift_address')}
                          title="Edit Alamat Pengiriman Kado"
                          className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {/* Alamat Kado Fisik */}
                      <div className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70">
                        <div>
                          <p className="font-bold text-sm text-slate-900">
                            Penerima Kado Fisik: {state.settings.giftRecipientName || '-'}
                          </p>
                          <p className="text-xs text-slate-500">
                            Alamat: {state.settings.giftShippingAddress || 'Belum diatur'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openSettingsPopup('gift_address')}
                          className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Daftar Rekening */}
                      {visibleAccounts.length === 0 ? (
                        <div className="px-6 py-6 text-center text-xs text-slate-400">
                          Belum ada rekening amplop digital. Klik tombol <strong>+</strong> di kanan atas kartu ini untuk menambahkan rekening.
                        </div>
                      ) : (
                        visibleAccounts.map((acc, idx) => (
                          <div
                            key={acc.id || idx}
                            className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                          >
                            <div>
                              <p className="font-bold text-sm text-slate-900">
                                {acc.bankName} — <span className="font-mono">{acc.accountNumber}</span>
                              </p>
                              <p className="text-xs text-slate-500">
                                a.n. {acc.accountHolder} • {acc.branchOrNote}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingBankIndex(idx);
                                  setBankForm({
                                    id: acc.id,
                                    bankName: acc.bankName,
                                    accountNumber: acc.accountNumber,
                                    accountHolder: acc.accountHolder,
                                    branchOrNote: acc.branchOrNote,
                                    type: acc.type || 'BANK',
                                  });
                                  setActiveSettingsModal('bank_account');
                                }}
                                className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBankAccount(acc.id)}
                                className="w-9 h-9 rounded-full hover:bg-rose-50 flex items-center justify-center text-rose-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {allAccounts.length > 3 && (
                      <button
                        type="button"
                        onClick={() => setShowAllBanks(!showAllBanks)}
                        className="w-full py-3.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-200 transition-colors"
                      >
                        {showAllBanks
                          ? 'Sembunyikan sebagian'
                          : `Tampilkan semua ${allAccounts.length} rekening →`}
                      </button>
                    )}
                  </div>
                );
              })()}

              {/* CARD 7 & 8: MANAJEMEN AKUN UTAMA & AKUN PANITIA (KHUSUS AKUN UTAMA) */}
              {!isPanitia && (
                <>
                  {/* CARD 7: 4 AKUN UTAMA SISTEM */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Akun Utama Sistem ({defaultSystemUsers.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Akun inti mempelai &amp; keluarga (Akses penuh termasuk Budgeting). Perubahan wajib konfirmasi pemilik aplikasi.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const target =
                            defaultSystemUsers.find((u) => u.id === selectedDefaultUserId) ||
                            defaultSystemUsers[0];
                          if (target) handleSelectDefaultUserForEdit(target);
                        }}
                        title="Ubah Username / Password Akun Utama"
                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {defaultSystemUsers.map((u) => (
                        <div
                          key={u.id}
                          className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs">
                              <KeyRound className="w-4 h-4 text-amber-700" />
                            </div>
                            <div>
                              <p className="font-bold text-sm text-slate-900">
                                {u.nama}{' '}
                                <span className="font-mono text-xs text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200 ml-1">
                                  @{u.username}
                                </span>
                              </p>
                              <p className="text-xs text-slate-500">{u.jabatan}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectDefaultUserForEdit(u)}
                            className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600 shrink-0"
                            title="Edit Username & Password"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CARD 8: AKUN PANITIA / WO */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="px-6 pt-5 pb-3 flex items-center justify-between border-b border-slate-100">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">
                          Akun Panitia &amp; WO ({panitiaUsers.length})
                        </h3>
                        <p className="text-xs text-slate-500">
                          Dapat ditambah atau dihapus oleh akun utama. Panitia tidak dapat membuka tab Anggaran &amp; Vendor.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPanitiaEditId(undefined);
                          setPanitiaUsername('');
                          setPanitiaNama('');
                          setPanitiaJabatan('Panitia / WO (Akses Non-Budgeting)');
                          setPanitiaPassword('');
                          setActiveSettingsModal('panitia_user');
                        }}
                        title="Tambah Akun Panitia Baru"
                        className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-700 transition-colors"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="divide-y divide-slate-200">
                      {panitiaUsers.length === 0 ? (
                        <div className="px-6 py-6 text-center text-xs text-slate-400">
                          Belum ada akun Panitia / WO tambahan. Klik tombol <strong>+</strong> di sudut kanan atas untuk membuat akun panitia.
                        </div>
                      ) : (
                        (showAllPanitia ? panitiaUsers : panitiaUsers.slice(0, 4)).map((pu) => (
                          <div
                            key={pu.id}
                            className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-slate-50/70"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700">
                                <UserPlus className="w-4 h-4 text-slate-600" />
                              </div>
                              <div>
                                <p className="font-bold text-sm text-slate-900">
                                  {pu.nama}{' '}
                                  <span className="font-mono text-xs text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md ml-1">
                                    @{pu.username}
                                  </span>
                                </p>
                                <p className="text-xs text-slate-500">
                                  {pu.jabatan} • <span className="text-rose-600 font-semibold">Budgeting Terkunci</span>
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setPanitiaEditId(pu.id);
                                  setPanitiaUsername(pu.username);
                                  setPanitiaNama(pu.nama);
                                  setPanitiaJabatan(pu.jabatan);
                                  setPanitiaPassword('');
                                  setActiveSettingsModal('panitia_user');
                                }}
                                className="w-9 h-9 rounded-full hover:bg-slate-200/70 flex items-center justify-center text-slate-600"
                                title="Edit Akun Panitia"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeletePanitiaAccount(pu.id, pu.username)}
                                className="w-9 h-9 rounded-full hover:bg-rose-50 flex items-center justify-center text-rose-500"
                                title="Hapus Akun Panitia"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {panitiaUsers.length > 4 && (
                      <button
                        type="button"
                        onClick={() => setShowAllPanitia(!showAllPanitia)}
                        className="w-full py-3.5 text-center text-sm font-bold text-slate-700 hover:bg-slate-50 border-t border-slate-200 transition-colors"
                      >
                        {showAllPanitia
                          ? 'Sembunyikan sebagian'
                          : `Tampilkan semua ${panitiaUsers.length} akun panitia →`}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {/* =======================================================================
          MODAL 1 (LINKEDIN STYLE): TAMBAH / EDIT TUGAS CHECKLIST
         ======================================================================= */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
            {/* LinkedIn Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTask.id ? 'Edit Tugas Kesiapan' : 'Tambahkan Tugas Kesiapan'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LinkedIn Modal Body */}
            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <p className="text-xs text-slate-500">* Wajib diisi</p>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Judul Tugas Kesiapan*
                </label>
                <input
                  type="text"
                  value={editingTask.title || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  placeholder="Misal: Pelunasan Katering / Gladi Bersih Pemberkatan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-400 focus:border-slate-900 focus:outline-none text-slate-900"
                />
              </div>

              {/* LinkedIn-style "Disarankan berdasarkan..." pill box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-slate-800">
                    Disarankan berdasarkan jadwal pernikahan Anda
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {[
                    { title: 'Finalisasi Daftar Tamu VIP & Pejabat', category: 'Tamu' as TaskCategory, phase: 'H-1 Bulan' as TimelinePhase },
                    { title: 'Fitting Akhir Busana Pengantin & Seragam Keluarga', category: 'Logistik' as TaskCategory, phase: 'H-2 Minggu' as TimelinePhase },
                    { title: 'Technical Meeting Seluruh Vendor & WO', category: 'Resepsi' as TaskCategory, phase: 'H-2 Minggu' as TimelinePhase },
                    { title: 'Gladi Bersih Pemberkatan Gereja', category: 'Gereja' as TaskCategory, phase: 'H-7' as TimelinePhase },
                    { title: 'Penyerahan Bukti Pelunasan Gedung & Katering', category: 'Keuangan' as TaskCategory, phase: 'H-7' as TimelinePhase },
                  ].map((sug) => (
                    <button
                      key={sug.title}
                      type="button"
                      onClick={() =>
                        setEditingTask({
                          ...editingTask,
                          title: sug.title,
                          category: sug.category,
                          timelinePhase: sug.phase,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs transition-all"
                    >
                      <span>{sug.title}</span>
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Kategori Domain*
                  </label>
                  <select
                    value={editingTask.category || 'Polri'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        category: e.target.value as TaskCategory,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-400 bg-white"
                  >
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Fase Timeline*
                  </label>
                  <select
                    value={editingTask.timelinePhase || 'H-1 Bulan'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        timelinePhase: e.target.value as TimelinePhase,
                      })
                    }
                    className="w-full px-3 py-2.5 rounded-lg border border-slate-400 bg-white"
                  >
                    {TIMELINE_PHASES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Tenggat Waktu</label>
                  <input
                    type="date"
                    value={editingTask.due || '2026-12-01'}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, due: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={editingTask.priority || 'Tinggi'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">PIC / Penanggung Jawab</label>
                  <select
                    value={editingTask.owner || 'Bersama'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        owner: e.target.value as TaskOwner,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400 bg-white"
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
                <label className="block font-medium text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={editingTask.notes || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, notes: e.target.value })
                  }
                  placeholder="Catatan detail berkas atau koordinasi..."
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                />
              </div>
            </div>

            {/* LinkedIn Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
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
                  showToast('Tugas kesiapan berhasil disimpan!');
                }}
                className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2 (LINKEDIN STYLE): TAMBAH / EDIT VENDOR & REVISI ANGGARAN
         ======================================================================= */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingBudget.id
                  ? 'Edit & Revisi Anggaran Vendor'
                  : 'Tambahkan Pos Anggaran / Vendor'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <p className="text-xs text-slate-500">* Wajib diisi</p>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Kebutuhan / Paket Vendor*
                </label>
                <input
                  type="text"
                  value={editingBudget.itemName || ''}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, itemName: e.target.value })
                  }
                  placeholder="Misal: Katering Resepsi Utama 500 Pax"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-400 focus:border-slate-900 focus:outline-none"
                />
              </div>

              {/* Quick Suggestions Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="font-bold text-xs text-slate-800">
                  Disarankan berdasarkan komponen anggaran pernikahan
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { itemName: 'Sewa Gedung & Ballroom Resepsi', category: 'Gedung & Venue' as VendorCategory, est: 35000000 },
                    { itemName: 'Paket Katering & Pondokan Tamu', category: 'Katering & Jamuan' as VendorCategory, est: 65000000 },
                    { itemName: 'Dekorasi Pelaminan & Taman Gereja', category: 'Dekorasi & Florist' as VendorCategory, est: 25000000 },
                    { itemName: 'MUA & Busana Pengantin + Orang Tua', category: 'MUA & Busana' as VendorCategory, est: 18000000 },
                    { itemName: 'Dokumentasi Foto, Video & Cinematic', category: 'Dokumentasi Foto/Video' as VendorCategory, est: 12000000 },
                    { itemName: 'Wedding Organizer (WO) Full Day', category: 'WO & MC / Hiburan' as VendorCategory, est: 10000000 },
                  ].map((sug) => (
                    <button
                      key={sug.itemName}
                      type="button"
                      onClick={() =>
                        setEditingBudget({
                          ...editingBudget,
                          itemName: sug.itemName,
                          category: sug.category,
                          estimatedCost: editingBudget.estimatedCost || sug.est,
                          actualCost: editingBudget.actualCost || sug.est,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs transition-all"
                    >
                      <span>{sug.itemName}</span>
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kategori*</label>
                  <select
                    value={editingBudget.category || 'Katering & Jamuan'}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        category: e.target.value as VendorCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    {VENDOR_CATEGORIES.map((vc) => (
                      <option key={vc} value={vc}>
                        {vc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Nama Vendor</label>
                  <input
                    type="text"
                    value={editingBudget.vendorName || ''}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, vendorName: e.target.value })
                    }
                    placeholder="Misal: PT Katering Nusantara"
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Estimasi Awal (Rp)*</label>
                  <input
                    type="number"
                    value={editingBudget.estimatedCost ?? 0}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        estimatedCost: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Realisasi / Revisi (Rp)*
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
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Sudah Dibayar (Rp)</label>
                  <input
                    type="number"
                    value={editingBudget.paidAmount ?? 0}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        paidAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status Pembayaran</label>
                  <select
                    value={editingBudget.paymentStatus || 'BELUM_DP'}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        paymentStatus: e.target.value as VendorPaymentStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="BELUM_DP">BELUM DP</option>
                    <option value="DP_TERBAYAR">DP TERBAYAR</option>
                    <option value="CICILAN">CICILAN</option>
                    <option value="LUNAS">LUNAS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={editingBudget.dueDate || '2026-12-01'}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kontak Vendor</label>
                  <input
                    type="text"
                    value={editingBudget.vendorContact || ''}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, vendorContact: e.target.value })
                    }
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Catatan Revisi Anggaran (Alasan Perubahan)
                </label>
                <input
                  type="text"
                  value={editingBudget.revisionNote || ''}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, revisionNote: e.target.value })
                  }
                  placeholder="Misal: Penambahan 100 porsi pondokan / diskon vendor"
                  className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
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
                className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 3 (LINKEDIN STYLE): TAMBAH / EDIT TAMU UNDANGAN
         ======================================================================= */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingGuest.id ? 'Edit Data Tamu Undangan' : 'Tambahkan Tamu Undangan'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <p className="text-xs text-slate-500">* Wajib diisi</p>

              <div>
                <label className="block font-medium text-slate-700 mb-1">
                  Nama Lengkap &amp; Gelar / Pangkat*
                </label>
                <input
                  type="text"
                  value={editingGuest.guestName || ''}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, guestName: e.target.value })
                  }
                  placeholder="Contoh: Bpk. Ir. Budi Santoso & Ibu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-400 focus:border-slate-900 focus:outline-none font-semibold"
                />
              </div>

              {/* LinkedIn-style Quick Preset Chips for Guest Category & Priority */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="font-bold text-xs text-slate-800">
                  Disarankan berdasarkan kategori tamu undangan
                </p>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Pejabat / VIP (Cetak Tebal)', guestType: 'Pejabat/VIP' as GuestType, priority: 'P1 - VIP' as GuestPriority, format: 'Cetak Tebal' as InvitationFormat },
                    { label: 'Keluarga Inti & Besar', guestType: 'Keluarga' as GuestType, priority: 'P1 - VIP' as GuestPriority, format: 'Cetak & Digital' as InvitationFormat },
                    { label: 'Rekan Kerja / Satker Polri', guestType: 'Rekan Kerja/Polri' as GuestType, priority: 'P2 - Utama' as GuestPriority, format: 'Digital WA' as InvitationFormat },
                    { label: 'Sahabat & Rekan Angkatan', guestType: 'Teman/Sahabat' as GuestType, priority: 'P2 - Utama' as GuestPriority, format: 'Digital WA' as InvitationFormat },
                    { label: 'Jemaat Gereja / Tetangga', guestType: 'Tetangga/Gereja' as GuestType, priority: 'P3 - Reguler' as GuestPriority, format: 'Cetak Reguler' as InvitationFormat },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() =>
                        setEditingGuest({
                          ...editingGuest,
                          guestType: preset.guestType,
                          priority: preset.priority,
                          invitationFormat: preset.format,
                        })
                      }
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs transition-all"
                    >
                      <span>{preset.label}</span>
                      <Plus className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Jabatan / Instansi / Satker
                  </label>
                  <input
                    type="text"
                    value={editingGuest.institution || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, institution: e.target.value })
                    }
                    placeholder="Misal: Bareskrim Polri / Keluarga Besar"
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    No. WhatsApp / Kontak
                  </label>
                  <input
                    type="text"
                    value={editingGuest.phone || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, phone: e.target.value })
                    }
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kategori*</label>
                  <select
                    value={editingGuest.guestType || 'Pejabat/VIP'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        guestType: e.target.value as GuestType,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="Pejabat/VIP">Pejabat/VIP</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Rekan Kerja/Polri">Rekan Kerja/Polri</option>
                    <option value="Teman/Sahabat">Teman/Sahabat</option>
                    <option value="Tetangga/Gereja">Tetangga/Gereja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={editingGuest.priority || 'P1 - VIP'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        priority: e.target.value as GuestPriority,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="P1 - VIP">P1 - VIP</option>
                    <option value="P2 - Utama">P2 - Utama</option>
                    <option value="P3 - Reguler">P3 - Reguler</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Pihak Pengundang</label>
                  <select
                    value={editingGuest.side || 'Mempelai Pria'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        side: e.target.value as GuestSide,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="Mempelai Pria">Mempelai Pria</option>
                    <option value="Mempelai Wanita">Mempelai Wanita</option>
                    <option value="Bersama">Bersama</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Format Undangan</label>
                  <select
                    value={editingGuest.invitationFormat || 'Cetak Tebal'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        invitationFormat: e.target.value as InvitationFormat,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="Cetak Tebal">Cetak Tebal</option>
                    <option value="Cetak Reguler">Cetak Reguler</option>
                    <option value="Digital WA">Digital WA</option>
                    <option value="Cetak & Digital">Cetak &amp; Digital</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Kuota Pax</label>
                  <input
                    type="number"
                    value={editingGuest.pax ?? 2}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, pax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Status RSVP</label>
                  <select
                    value={editingGuest.rsvpStatus || 'Belum Konfirmasi'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        rsvpStatus: e.target.value as RsvpStatus,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="Belum Konfirmasi">Belum Konfirmasi</option>
                    <option value="Hadir">Hadir</option>
                    <option value="Masih Ragu">Masih Ragu</option>
                    <option value="Tidak Hadir">Tidak Hadir</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Alamat / Ruangan
                  </label>
                  <input
                    type="text"
                    value={editingGuest.address || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, address: e.target.value })
                    }
                    placeholder="Alamat pengiriman undangan cetak"
                    className="w-full px-3 py-2 rounded-lg border border-slate-400"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Status Distribusi
                  </label>
                  <select
                    value={editingGuest.deliveryStatus || 'Belum Disiapkan'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        deliveryStatus: e.target.value as DeliveryStatus,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-slate-400 bg-white"
                  >
                    <option value="Belum Disiapkan">Belum Disiapkan</option>
                    <option value="Siap Kirim">Siap Kirim</option>
                    <option value="Sudah Dikirim">Sudah Dikirim</option>
                    <option value="Sudah Diterima">Sudah Diterima</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
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
                className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 4: GENERATOR TEKS & LINK UNDANGAN WA
         ======================================================================= */}
      {waPreviewGuest && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          {(() => {
            const generated = generateWhatsAppMessage(waPreviewGuest, state.settings);
            return (
              <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
                <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">
                      Bagikan Undangan WhatsApp
                    </h3>
                    <p className="text-xs text-slate-500">{waPreviewGuest.guestName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaPreviewGuest(null)}
                    className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <p className="text-[11px] font-bold text-slate-700">
                      Link Undangan Khusus Tamu Ini:
                    </p>
                    <p className="font-mono text-xs text-[#0A66C2] break-all">
                      {generated.inviteUrl}
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Preview Pesan Pengantar WhatsApp:
                    </label>
                    <textarea
                      readOnly
                      rows={9}
                      value={generated.messageText}
                      className="w-full p-3.5 rounded-xl border border-slate-300 bg-slate-50 font-sans text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generated.messageText);
                      showToast('Seluruh teks undangan WA berhasil disalin!');
                    }}
                    className="px-4 py-2 rounded-full border border-slate-400 hover:bg-slate-100 text-slate-700 font-bold text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Teks
                  </button>
                  <a
                    href={generated.waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Kirim ke WhatsApp
                  </a>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* =======================================================================
          MODAL 5 (LINKEDIN STYLE): POPUP PENGATURAN UNDANGAN, AKUN & PAGU BUDGET
         ======================================================================= */}
      {activeSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden text-xs sm:text-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {activeSettingsModal === 'background' && 'Edit Background & Transparansi'}
                {activeSettingsModal === 'visibility' && 'Atur Bagian Undangan yang Ditampilkan'}
                {activeSettingsModal === 'countdown' && 'Edit Waktu Countdown & Subjudul'}
                {activeSettingsModal === 'event1' && 'Edit Detail Acara 1 (Keluarga / Biston)'}
                {activeSettingsModal === 'event2' && 'Edit Detail Acara 2 (Pemberkatan / Akad)'}
                {activeSettingsModal === 'event3' && 'Edit Detail Acara 3 (Resepsi Pernikahan)'}
                {activeSettingsModal === 'couple_groom' && 'Edit Profil Mempelai Pria'}
                {activeSettingsModal === 'couple_bride' && 'Edit Profil Mempelai Wanita'}
                {activeSettingsModal === 'quote' && 'Edit Kutipan Ayat & Kalimat Undangan'}
                {activeSettingsModal === 'bank_account' &&
                  (editingBankIndex !== null
                    ? 'Edit Rekening Amplop Digital'
                    : 'Tambahkan Rekening Amplop Digital')}
                {activeSettingsModal === 'gift_address' && 'Edit Alamat Pengiriman Kado Fisik'}
                {activeSettingsModal === 'default_user' && 'Ubah Kredensial Akun Utama'}
                {activeSettingsModal === 'panitia_user' &&
                  (panitiaEditId ? 'Edit Akun Panitia / WO' : 'Tambahkan Akun Panitia / WO')}
                {activeSettingsModal === 'budget_cap' && 'Edit Target Pagu Anggaran Utama'}
              </h3>
              <button
                type="button"
                onClick={() => setActiveSettingsModal(null)}
                className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. MODAL: BACKGROUND & TRANSPARANSI */}
            {activeSettingsModal === 'background' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">
                    * Gunakan URL gambar dari mana saja atau klik saran tema di bawah
                  </p>

                  {/* LinkedIn Suggestion Box for Background Presets */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <p className="font-bold text-xs text-slate-800">
                      Disarankan berdasarkan tema undangan cerah &amp; elegan
                    </p>
                    <div className="flex flex-wrap gap-2">
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs transition-all"
                        >
                          <span>{preset.label}</span>
                          <Plus className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      URL Background Sampul Pembuka (Cover)*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.coverBgUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, coverBgUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      URL Banner Utama / Foto Siluet Prewedding*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroPrewedUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroPrewedUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      URL Wallpaper Halaman Undangan*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.pageBgUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, pageBgUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-medium text-slate-700">
                          Kecerahan Transparan (Veil)
                        </label>
                        <span className="font-mono font-bold text-slate-900">
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
                        className="w-full accent-[#0A66C2]"
                      />
                    </div>

                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Efek Blur Kaca (Glassmorphism)
                      </label>
                      <select
                        value={settingsForm.bgBlurIntensity || 'sm'}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            bgBlurIntensity: e.target.value as WeddingSettings['bgBlurIntensity'],
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-400 bg-white"
                      >
                        <option value="none">Tanpa Blur (Foto Tajam)</option>
                        <option value="sm">Blur Halus (Rekomendasi)</option>
                        <option value="md">Blur Sedang</option>
                        <option value="lg">Blur Kuat</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 2. MODAL: VISIBILITAS SEKSI UNDANGAN */}
            {activeSettingsModal === 'visibility' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-3 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">
                    Centang seksi yang ingin ditampilkan pada undangan digital tamu:
                  </p>
                  <div className="divide-y divide-slate-200 border border-slate-200 rounded-xl overflow-hidden">
                    {[
                      { key: 'showQuoteSection' as const, label: 'Kutipan Ayat Suci / Doa Pernikahan' },
                      { key: 'showCoupleSection' as const, label: 'Profil Kedua Mempelai & Orang Tua' },
                      { key: 'showEvent1' as const, label: 'Acara 1 (Biston / Keluarga)' },
                      { key: 'showEvent2' as const, label: 'Acara 2 (Pemberkatan / Akad)' },
                      { key: 'showEvent3' as const, label: 'Acara 3 (Resepsi Pernikahan)' },
                      { key: 'showLoveStorySection' as const, label: 'Kisah Kasih (Love Story)' },
                      { key: 'showGallerySection' as const, label: 'Galeri Foto Prewedding' },
                      { key: 'showRsvpSection' as const, label: 'Form RSVP & Buku Tamu' },
                      { key: 'showGiftSection' as const, label: 'Amplop Digital / Rekening' },
                    ].map((item) => {
                      const checked = settingsForm[item.key] !== false;
                      return (
                        <label
                          key={item.key}
                          className="px-4 py-3 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 cursor-pointer"
                        >
                          <span className="font-semibold text-slate-800">{item.label}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [item.key]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-[#0A66C2] rounded"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 3. MODAL: COUNTDOWN & SUBTITLE */}
            {activeSettingsModal === 'countdown' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Waktu Countdown Utama (Hari-H Pemberkatan / Akad)*
                    </label>
                    <input
                      type="datetime-local"
                      value={(settingsForm.weddingDatetime || '2026-12-19T09:00').slice(0, 16)}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          weddingDatetime: `${e.target.value}:00+07:00`,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Waktu Countdown Acara 1 (Keluarga / Biston)
                    </label>
                    <input
                      type="datetime-local"
                      value={(settingsForm.bistonDatetime || '2026-12-18T18:00').slice(0, 16)}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          bistonDatetime: `${e.target.value}:00+07:00`,
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Subjudul Ringkas (Tampil di Header &amp; Sampul)*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.subtitle || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, subtitle: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-400"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 4. MODAL: ACARA 1, ACARA 2, ACARA 3 */}
            {(activeSettingsModal === 'event1' ||
              activeSettingsModal === 'event2' ||
              activeSettingsModal === 'event3') && (
              <form onSubmit={handleSaveSettingsModal}>
                {(() => {
                  const prefix = activeSettingsModal;
                  const titleKey = `${prefix}Title` as const;
                  const subKey = `${prefix}Subtitle` as const;
                  const dateKey = `${prefix}DateLabel` as const;
                  const timeKey = `${prefix}TimeLabel` as const;
                  const venueKey = `${prefix}Venue` as const;
                  const addrKey = `${prefix}Address` as const;
                  const dressKey = `${prefix}Dresscode` as const;
                  const mapsKey = `${prefix}MapsUrl` as const;
                  const showKey =
                    prefix === 'event1'
                      ? ('showEvent1' as const)
                      : prefix === 'event2'
                        ? ('showEvent2' as const)
                        : ('showEvent3' as const);

                  return (
                    <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">* Wajib diisi</p>
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm[showKey] !== false}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [showKey]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-[#0A66C2] rounded"
                          />
                          Tampilkan Acara Ini di Undangan
                        </label>
                      </div>

                      {/* Quick Suggestions for Event Titles */}
                      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                        <p className="font-bold text-xs text-slate-800">
                          Disarankan untuk nama acara pernikahan
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {[
                            'Pemberkatan Nikah Kudus',
                            'Akad Nikah',
                            'Resepsi Pernikahan',
                            'Malam Midodareni / Biston',
                            'Syukuran Keluarga & Adat',
                          ].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() =>
                                setSettingsForm({ ...settingsForm, [titleKey]: t })
                              }
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs"
                            >
                              <span>{t}</span>
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Judul Acara*
                          </label>
                          <input
                            type="text"
                            value={settingsForm[titleKey] || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [titleKey]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-400 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Subjudul Acara
                          </label>
                          <input
                            type="text"
                            value={settingsForm[subKey] || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [subKey]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-400"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Hari &amp; Tanggal (Teks Tampilan)*
                          </label>
                          <input
                            type="text"
                            value={settingsForm[dateKey] || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [dateKey]: e.target.value,
                              })
                            }
                            placeholder="Sabtu, 19 Desember 2026"
                            className="w-full px-3 py-2 rounded-lg border border-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Waktu / Jam Pelaksanaan*
                          </label>
                          <input
                            type="text"
                            value={settingsForm[timeKey] || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [timeKey]: e.target.value,
                              })
                            }
                            placeholder="09.00 - 11.00 WIB"
                            className="w-full px-3 py-2 rounded-lg border border-slate-400"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Nama Gedung / Gereja / Venue*
                        </label>
                        <input
                          type="text"
                          value={settingsForm[venueKey] || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              [venueKey]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-400"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-slate-700 mb-1">
                          Alamat Lengkap Lokasi*
                        </label>
                        <input
                          type="text"
                          value={settingsForm[addrKey] || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              [addrKey]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-slate-400"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Dresscode Tamu
                          </label>
                          <input
                            type="text"
                            value={settingsForm[dressKey] || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [dressKey]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-400"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-slate-700 mb-1">
                            Link Google Maps
                          </label>
                          <input
                            type="text"
                            value={settingsForm[mapsKey] || ''}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [mapsKey]: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 rounded-lg border border-slate-400"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 5. MODAL: PROFIL MEMPELAI PRIA */}
            {activeSettingsModal === 'couple_groom' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nama Lengkap &amp; Gelar Mempelai Pria*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.groomFullName || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, groomFullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Nama Panggilan*
                      </label>
                      <input
                        type="text"
                        value={settingsForm.groomNickname || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomNickname: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Pangkat / Gelar / Label
                      </label>
                      <input
                        type="text"
                        value={settingsForm.groomRankAndTitle || ''}
                        onChange={(e) =>
                          setSettingsForm({
                            ...settingsForm,
                            groomRankAndTitle: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Instansi / Profesi
                      </label>
                      <input
                        type="text"
                        value={settingsForm.groomUnit || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomUnit: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">Kota Asal</label>
                      <input
                        type="text"
                        value={settingsForm.groomOrigin || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomOrigin: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Keterangan Orang Tua Mempelai Pria*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.groomParents || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, groomParents: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      URL Foto Mempelai Pria
                    </label>
                    <input
                      type="text"
                      value={settingsForm.groomPhotoUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, groomPhotoUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 6. MODAL: PROFIL MEMPELAI WANITA */}
            {activeSettingsModal === 'couple_bride' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nama Lengkap &amp; Gelar Mempelai Wanita*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brideFullName || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brideFullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Nama Panggilan*
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brideNickname || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brideNickname: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Gelar / Label
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brideTitle || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brideTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">Kota Asal</label>
                    <input
                      type="text"
                      value={settingsForm.brideOrigin || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brideOrigin: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Keterangan Orang Tua Mempelai Wanita*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brideParents || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brideParents: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      URL Foto Mempelai Wanita
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bridePhotoUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, bridePhotoUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 7. MODAL: KUTIPAN AYAT SUCI & KALIMAT UNDANGAN */}
            {activeSettingsModal === 'quote' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  {/* Quick Suggestions for Quotes */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <p className="font-bold text-xs text-slate-800">
                      Disarankan berdasarkan kutipan ayat pernikahan populer
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        {
                          source: 'Kolose 3 : 14',
                          verse:
                            'Dan di atas semuanya itu: kenakanlah kasih, sebagai pengikat yang mempersatukan dan menyempurnakan.',
                        },
                        {
                          source: '1 Korintus 13 : 4-7',
                          verse:
                            'Kasih itu sabar; kasih itu murah hati; ia menutupi segala sesuatu, percaya segala sesuatu, mengharapkan segala sesuatu, sabar menanggung segala sesuatu.',
                        },
                        {
                          source: 'Matius 19 : 6',
                          verse:
                            'Demikianlah mereka bukan lagi dua, melainkan satu. Karena itu, apa yang telah dipersatukan Allah, tidak boleh diceraikan manusia.',
                        },
                        {
                          source: 'QS. Ar-Rum : 21',
                          verse:
                            'Dan di antara tanda-tanda kekuasaan-Nya ialah Dia menciptakan untukmu pasangan hidup dari jenismu sendiri, supaya kamu cenderung dan merasa tenteram kepadanya.',
                        },
                      ].map((q) => (
                        <button
                          key={q.source}
                          type="button"
                          onClick={() =>
                            setSettingsForm({
                              ...settingsForm,
                              quoteSource: q.source,
                              quoteVerse: q.verse,
                            })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs transition-all"
                        >
                          <span>{q.source}</span>
                          <Plus className="w-3.5 h-3.5 text-slate-600" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Sumber Ayat / Kutipan*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.quoteSource || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, quoteSource: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Isi Kutipan Ayat Pernikahan*
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.quoteVerse || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, quoteVerse: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kalimat Pembuka Undangan
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.invitationOpeningText || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          invitationOpeningText: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Kalimat Penutup Undangan
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.invitationClosingText || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          invitationClosingText: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 8. MODAL: TAMBAH / EDIT REKENING BANK */}
            {activeSettingsModal === 'bank_account' && (
              <form onSubmit={handleSaveBankAccountModal}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">* Wajib diisi</p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <p className="font-bold text-xs text-slate-800">
                      Disarankan berdasarkan bank &amp; dompet digital
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'BANK BCA', type: 'BANK' as const },
                        { name: 'BANK MANDIRI', type: 'BANK' as const },
                        { name: 'BANK BRI', type: 'BANK' as const },
                        { name: 'BANK BNI', type: 'BANK' as const },
                        { name: 'GOPAY / DANA / OVO', type: 'EWALLET' as const },
                      ].map((b) => (
                        <button
                          key={b.name}
                          type="button"
                          onClick={() =>
                            setBankForm({ ...bankForm, bankName: b.name, type: b.type })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs"
                        >
                          <span>{b.name}</span>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nama Bank / E-Wallet*
                    </label>
                    <input
                      type="text"
                      required
                      value={bankForm.bankName}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, bankName: e.target.value })
                      }
                      placeholder="Contoh: BANK BCA"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nomor Rekening / Nomor Akun*
                    </label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountNumber}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, accountNumber: e.target.value })
                      }
                      placeholder="Contoh: 1234567890"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Atas Nama Pemilik Rekening*
                    </label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountHolder}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, accountHolder: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Keterangan / Cabang
                    </label>
                    <input
                      type="text"
                      value={bankForm.branchOrNote}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, branchOrNote: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 9. MODAL: ALAMAT KADO FISIK */}
            {activeSettingsModal === 'gift_address' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Nama Penerima Kado Fisik*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.giftRecipientName || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          giftRecipientName: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Alamat Lengkap Pengiriman Kado*
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.giftShippingAddress || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          giftShippingAddress: e.target.value,
                        })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 10. MODAL: EDIT PAGU ANGGARAN UTAMA */}
            {activeSettingsModal === 'budget_cap' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4">
                  <p className="text-xs text-slate-500">* Wajib diisi</p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <p className="font-bold text-xs text-slate-800">
                      Disarankan berdasarkan skala resepsi pernikahan
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Rp 100 Juta (Intimate)', val: 100000000 },
                        { label: 'Rp 180 Juta (Standar)', val: 180000000 },
                        { label: 'Rp 250 Juta (Menengah)', val: 250000000 },
                        { label: 'Rp 350 Juta (Ballroom Besar)', val: 350000000 },
                      ].map((opt) => (
                        <button
                          key={opt.label}
                          type="button"
                          onClick={() =>
                            setSettingsForm({ ...settingsForm, totalBudgetCap: opt.val })
                          }
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs"
                        >
                          <span>{opt.label}</span>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Target Pagu Anggaran Utama (Rp)*
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000000}
                      value={settingsForm.totalBudgetCap || 0}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          totalBudgetCap: Number(e.target.value),
                        })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-slate-400 font-mono font-bold text-base"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            )}

            {/* 11. MODAL: UBAH AKUN UTAMA (DENGAN KONFIRMASI SUPERADMIN) */}
            {activeSettingsModal === 'default_user' && (
              <form onSubmit={handleUpdateDefaultUserForm}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">
                    * Perubahan username/password akun utama wajib konfirmasi pemilik aplikasi
                  </p>

                  {/* Pilih Akun Utama */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <p className="font-bold text-xs text-slate-800">
                      Pilih akun utama yang ingin diperbarui:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {defaultSystemUsers.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => handleSelectDefaultUserForEdit(u)}
                          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border font-semibold text-xs transition-all ${
                            selectedDefaultUserId === u.id
                              ? 'bg-[#0A66C2] text-white border-[#0A66C2]'
                              : 'bg-white hover:bg-slate-100 border-slate-400 text-slate-700'
                          }`}
                        >
                          <span>@{u.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Username Baru*
                      </label>
                      <input
                        type="text"
                        required
                        value={secUsername}
                        onChange={(e) => setSecUsername(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Nama Tampilan Akun*
                      </label>
                      <input
                        type="text"
                        required
                        value={secName}
                        onChange={(e) => setSecName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-slate-700 mb-1">
                      Password Baru (Kosongkan jika hanya mengubah nama/username)
                    </label>
                    <input
                      type="password"
                      value={secNewPassword}
                      onChange={(e) => setSecNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-amber-900 mb-1">
                      Identitas Konfirmasi Superadmin (Pemilik Aplikasi)*
                    </label>
                    <input
                      type="password"
                      required
                      value={secSuperadminConfirm}
                      onChange={(e) => setSecSuperadminConfirm(e.target.value)}
                      placeholder="Masukkan identitas superadmin pemilik aplikasi"
                      className="w-full px-3.5 py-2 rounded-lg border border-amber-400 bg-amber-50/40 font-mono"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingSecurity}
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50"
                  >
                    {isUpdatingSecurity ? 'Memverifikasi...' : 'Simpan'}
                  </button>
                </div>
              </form>
            )}

            {/* 12. MODAL: TAMBAH / EDIT AKUN PANITIA (TANPA SUPERADMIN) */}
            {activeSettingsModal === 'panitia_user' && (
              <form onSubmit={handleUpsertPanitiaForm}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-slate-500">
                    * Akun panitia dapat mengelola Checklist, Tamu &amp; Undangan, namun terkunci dari menu Anggaran (Budgeting).
                  </p>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <p className="font-bold text-xs text-slate-800">
                      Disarankan berdasarkan peran kepanitiaan / WO
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { u: 'ketua_panitia', n: 'Ketua Panitia Keluarga', j: 'Koordinator Umum Panitia' },
                        { u: 'tim_wo', n: 'Koordinator Wedding Organizer', j: 'WO & Rundown Acara' },
                        { u: 'seksi_tamu', n: 'Koordinator Penerima Tamu & VIP', j: 'Distribusi Undangan & RSVP' },
                        { u: 'seksi_acara', n: 'Seksi Ibadah & Acara Gereja', j: 'Koordinator Pemberkatan' },
                      ].map((role) => (
                        <button
                          key={role.u}
                          type="button"
                          onClick={() => {
                            if (!panitiaEditId) setPanitiaUsername(role.u);
                            setPanitiaNama(role.n);
                            setPanitiaJabatan(role.j);
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-100 border border-slate-400 text-slate-700 font-semibold text-xs"
                        >
                          <span>{role.n}</span>
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Username Login Panitia*
                      </label>
                      <input
                        type="text"
                        required
                        value={panitiaUsername}
                        onChange={(e) => setPanitiaUsername(e.target.value)}
                        placeholder="Contoh: panitia_wo"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Nama Lengkap / Tim*
                      </label>
                      <input
                        type="text"
                        required
                        value={panitiaNama}
                        onChange={(e) => setPanitiaNama(e.target.value)}
                        placeholder="Contoh: Koordinator WO"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Jabatan Kepanitiaan
                      </label>
                      <input
                        type="text"
                        value={panitiaJabatan}
                        onChange={(e) => setPanitiaJabatan(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-slate-700 mb-1">
                        Password Login Panitia {panitiaEditId ? '(Opsional)' : '*'}
                      </label>
                      <input
                        type="password"
                        required={!panitiaEditId}
                        value={panitiaPassword}
                        onChange={(e) => setPanitiaPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3.5 py-2 rounded-lg border border-slate-400 font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50/50 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPanitia}
                    className="px-6 py-2 rounded-full bg-[#0A66C2] hover:bg-[#004182] text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50"
                  >
                    {isSavingPanitia ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

