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
  ChevronRight,
  Lock,
  Heart,
  Image as ImageIcon,
  BookOpen,
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
  LoveStoryItem,
  GalleryPhotoItem,
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

  // Wira Satya 96 Style Settings Sidebar & Sub-Tab State
  const [settingsMenuTab, setSettingsMenuTab] = useState<
    'visibilitas' | 'background' | 'jadwal' | 'keamanan' | 'database'
  >('visibilitas');
  const [keamananSubTab, setKeamananSubTab] = useState<'utama' | 'panitia'>('utama');
  const [visibilitasSubTab, setVisibilitasSubTab] = useState<'semua' | 'media'>('semua');

  // Expanded section key inside Visibilitas & Konten so user can toggle Switch + edit what is displayed right there
  const [expandedSectionKey, setExpandedSectionKey] = useState<string | null>(
    'showQuoteSection'
  );

  // Form state for adding Love Story & Gallery Photo items inside the inline editor
  const [newStoryForm, setNewStoryForm] = useState<Omit<LoveStoryItem, 'id'>>({
    dateLabel: '2026',
    title: '',
    location: 'Semarang',
    description: '',
  });
  const [newPhotoForm, setNewPhotoForm] = useState<Omit<GalleryPhotoItem, 'id'>>({
    title: '',
    caption: '',
    imageUrl: '',
    category: 'Prewedding',
  });

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

  // Immediate 1-click switch toggle for any invitation section visibility
  const handleToggleSectionSwitch = async (
    key:
      | 'showQuoteSection'
      | 'showCoupleSection'
      | 'showEvent1'
      | 'showEvent2'
      | 'showEvent3'
      | 'showLoveStorySection'
      | 'showGallerySection'
      | 'showRsvpSection'
      | 'showGiftSection',
    label: string
  ) => {
    const currentVal = state.settings[key] !== false;
    const nextVal = !currentVal;
    const nextSettings: WeddingSettings = {
      ...state.settings,
      ...settingsForm,
      [key]: nextVal,
      updatedBy: adminUser.username,
    };
    setSettingsForm(nextSettings);
    await onUpdateSettings(nextSettings);
    if (nextVal) {
      setExpandedSectionKey(key);
    }
    showToast(
      `Seksi "${label}" ${nextVal ? 'diaktifkan (ditampilkan)' : 'dinonaktifkan (disembunyikan)'}.`
    );
  };

  const handleAddLoveStoryItem = async () => {
    if (!newStoryForm.title.trim() || !newStoryForm.description.trim()) return;
    const nextStory: LoveStoryItem[] = [
      ...(state.settings.loveStory || []),
      {
        id: `story_${Date.now().toString(36)}`,
        dateLabel: newStoryForm.dateLabel.trim() || '2026',
        title: newStoryForm.title.trim(),
        location: newStoryForm.location.trim() || 'Semarang',
        description: newStoryForm.description.trim(),
      },
    ];
    const nextSettings: WeddingSettings = {
      ...state.settings,
      ...settingsForm,
      loveStory: nextStory,
      showLoveStorySection: true,
      updatedBy: adminUser.username,
    };
    setSettingsForm(nextSettings);
    await onUpdateSettings(nextSettings);
    setNewStoryForm({
      dateLabel: '2026',
      title: '',
      location: 'Semarang',
      description: '',
    });
    showToast('Momen Kisah Kasih berhasil ditambahkan & ditampilkan!');
  };

  const handleDeleteLoveStoryItem = async (storyId: string) => {
    const nextStory = (state.settings.loveStory || []).filter((s) => s.id !== storyId);
    const nextSettings: WeddingSettings = {
      ...state.settings,
      ...settingsForm,
      loveStory: nextStory,
      updatedBy: adminUser.username,
    };
    setSettingsForm(nextSettings);
    await onUpdateSettings(nextSettings);
    showToast('Momen Kisah Kasih dihapus.');
  };

  const handleAddGalleryPhotoItem = async () => {
    if (!newPhotoForm.imageUrl.trim()) return;
    const nextPhotos: GalleryPhotoItem[] = [
      ...(state.settings.galleryPhotos || []),
      {
        id: `photo_${Date.now().toString(36)}`,
        title: newPhotoForm.title.trim() || 'Momen Bahagia',
        caption: newPhotoForm.caption.trim() || 'Prewedding',
        imageUrl: newPhotoForm.imageUrl.trim(),
        category: newPhotoForm.category,
      },
    ];
    const nextSettings: WeddingSettings = {
      ...state.settings,
      ...settingsForm,
      galleryPhotos: nextPhotos,
      showGallerySection: true,
      updatedBy: adminUser.username,
    };
    setSettingsForm(nextSettings);
    await onUpdateSettings(nextSettings);
    setNewPhotoForm({
      title: '',
      caption: '',
      imageUrl: '',
      category: 'Prewedding',
    });
    showToast('Foto Galeri berhasil ditambahkan & ditampilkan!');
  };

  const handleDeleteGalleryPhotoItem = async (photoId: string) => {
    const nextPhotos = (state.settings.galleryPhotos || []).filter((p) => p.id !== photoId);
    const nextSettings: WeddingSettings = {
      ...state.settings,
      ...settingsForm,
      galleryPhotos: nextPhotos,
      updatedBy: adminUser.username,
    };
    setSettingsForm(nextSettings);
    await onUpdateSettings(nextSettings);
    showToast('Foto Galeri dihapus.');
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
              <div className="h-full bg-gradient-to-br from-[#FFFDF9] via-[#FAF3E3] to-[#F3E3C3] text-stone-900 rounded-3xl p-5 shadow-sm border border-[#D4AF37]/50 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#8B6914]">
                    Kesiapan Pernikahan
                  </span>
                  <CheckSquare className="w-5 h-5 text-[#B68D40]" />
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-extrabold text-stone-900">
                      {metrics.readinessPercent}%
                    </span>
                    <span className="text-xs text-emerald-700 font-bold">
                      ({metrics.completedTasks}/{metrics.totalTasks} Selesai)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-white/80 border border-[#D4AF37]/30 rounded-full overflow-hidden mt-2">
                    <div
                      className="h-full bg-gradient-to-r from-[#C5A059] via-[#D4AF37] to-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${metrics.readinessPercent}%` }}
                    />
                  </div>
                </div>
                <p className="text-[11px] text-[#8B6914] font-medium pt-2 border-t border-[#D4AF37]/25">
                  {metrics.inProgressTasks} sedang diproses &bull; {metrics.pendingTasks} belum dimulai
                </p>
              </div>

              {/* Card 2: Countdown Hari-H */}
              <div className="h-full bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Countdown Hari-H
                  </span>
                  <Calendar className="w-5 h-5 text-[#B68D40]" />
                </div>
                <div className="my-3 grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-2xl bg-[#FAF8F5] border border-stone-200">
                    <p className="text-[10px] font-bold uppercase text-stone-600 truncate">
                      {state.settings.event1Title || 'Acara 1'}
                    </p>
                    <p className="text-2xl font-extrabold text-stone-900">
                      H-{metrics.daysToBiston}
                    </p>
                  </div>
                  <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#FAF3E3] to-[#EFE1C6] border border-[#D4AF37]/50 text-[#8B6914]">
                    <p className="text-[10px] font-bold uppercase text-[#8B6914] truncate">
                      {state.settings.event2Title || 'Pemberkatan'}
                    </p>
                    <p className="text-2xl font-extrabold text-[#8B6914]">
                      H-{metrics.daysToWedding}
                    </p>
                  </div>
                </div>
                <p className="text-[11px] text-stone-500 font-medium pt-2 border-t border-stone-100 truncate">
                  {state.settings.event2DateLabel} &bull; {state.settings.groomOrigin}
                </p>
              </div>

              {/* Card 3: Ringkasan Budget & Revisi (Hidden for Panitia) */}
              {!isPanitia && (
                <div className="h-full bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                      Anggaran &amp; Realisasi
                    </span>
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="my-3">
                    <p className="text-xl sm:text-2xl font-extrabold text-stone-900">
                      {formatRupiah(metrics.totalActual)}
                    </p>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Pagu Target:{' '}
                      <span className="font-bold text-stone-800">
                        {formatRupiah(
                          state.settings.totalBudgetCap || metrics.totalEstimated
                        )}
                      </span>
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-100">
                    <span className="text-emerald-700 font-bold">
                      Dibayar: {formatRupiah(metrics.totalPaid)}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-bold">
                      {state.budgetItems.length} Pos Biaya
                    </span>
                  </div>
                </div>
              )}

              {/* Card 4: Statistik RSVP & Tamu VIP */}
              <div className="h-full bg-white rounded-3xl p-5 shadow-sm border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Statistik Tamu &amp; RSVP
                  </span>
                  <Users className="w-5 h-5 text-[#B68D40]" />
                </div>
                <div className="my-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl sm:text-3xl font-extrabold text-stone-900">
                      {metrics.totalGuests} Undangan
                    </span>
                    <span className="text-xs font-bold text-[#8B6914]">
                      ({metrics.totalPaxQuota} Kuota Pax)
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 mt-1">
                    Konfirmasi Hadir:{' '}
                    <span className="font-bold text-emerald-700">
                      {metrics.hadirGuestsCount} Tamu ({metrics.hadirPax} Pax)
                    </span>
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-2 border-t border-stone-100">
                  <span className="inline-flex items-center gap-1 font-bold text-[#8B6914]">
                    <Award className="w-3.5 h-3.5 text-[#B68D40]" />
                    {metrics.vipGuestsCount} Pejabat / VIP
                  </span>
                  <span className="text-stone-500">
                    {metrics.belumKonfirmasiCount} Belum Konfirmasi
                  </span>
                </div>
              </div>
            </div>

            {/* Breakdown Progress by Timeline & Domain Category (Symmetrical Equal-Height 2-Column Grid) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
              {/* Left: Progress per Kategori */}
              <div className="h-full lg:h-[460px] bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
                  <div>
                    <h3 className="font-bold text-base text-stone-900">
                      Kesiapan per Domain (DB Wedding)
                    </h3>
                    <p className="text-xs text-stone-500">
                      Progres administrasi Polri, Gereja, Kependudukan, Kesehatan &amp; Acara
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('checklist')}
                    className="text-xs font-bold text-[#8B6914] hover:text-[#B68D40] hover:underline shrink-0"
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
                          <span className="font-bold text-stone-800">{cat}</span>
                          <span className="font-mono font-bold text-stone-600">
                            {doneCount}/{catTasks.length} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct === 100
                                ? 'bg-emerald-500'
                                : pct >= 60
                                ? 'bg-[#D4AF37]'
                                : 'bg-[#B68D40]'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
                  <span>Total Tugas Terdata: {metrics.totalTasks} Tugas</span>
                  <span className="font-bold text-emerald-700">
                    {metrics.completedTasks} Selesai
                  </span>
                </div>
              </div>

              {/* Right: Urgent / Pending Priority Tasks */}
              <div className="h-full lg:h-[460px] bg-white rounded-3xl p-6 shadow-sm border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 shrink-0">
                  <div>
                    <h3 className="font-bold text-base text-stone-900 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-[#B68D40]" />
                      Fokus Penyelesaian Berikutnya
                    </h3>
                    <p className="text-xs text-stone-500">
                      Daftar tugas yang masih berstatus Proses / Belum Selesai
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[11px] font-bold">
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
                        className="p-3.5 rounded-2xl border border-stone-200 hover:border-[#D4AF37] bg-[#FAF8F5] flex items-start justify-between gap-3 transition-all"
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2 py-0.5 rounded-md bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] text-[10px] font-bold">
                              {task.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-stone-200/80 text-stone-700 text-[10px] font-semibold">
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
                          <p className="font-bold text-xs sm:text-sm text-stone-900">
                            {task.title}
                          </p>
                          {task.notes && (
                            <p className="text-xs text-stone-500">{task.notes}</p>
                          )}
                          <p className="text-[11px] text-stone-500">
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

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500 shrink-0">
                  <span>Klik &ldquo;Selesaikan&rdquo; untuk memperbarui progres secara instan</span>
                  <span className="font-bold text-[#8B6914]">
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
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedPhase('ALL')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap border transition-all ${
                    selectedPhase === 'ALL'
                      ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40] shadow-2xs'
                      : 'bg-white text-stone-700 border-stone-300 hover:bg-[#FAF3E3] hover:text-[#8B6914]'
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
                          ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40] shadow-2xs'
                          : 'bg-white text-stone-700 border-stone-300 hover:bg-[#FAF3E3] hover:text-[#8B6914]'
                      }`}
                    >
                      {phase} ({count})
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                <div className="relative">
                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={taskSearch}
                    onChange={(e) => setTaskSearch(e.target.value)}
                    placeholder="Cari tugas, dokumen, SKCK, izin kawin..."
                    className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5]"
                  />
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as TaskCategory | 'ALL')}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5] font-semibold"
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
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5] font-semibold"
                >
                  <option value="ALL">Semua Status (Belum / Proses / Selesai)</option>
                  <option value="BELUM">Status: Belum Dimulai</option>
                  <option value="PROSES">Status: Sedang Proses</option>
                  <option value="SELESAI">Status: Selesai</option>
                </select>

                <select
                  value={selectedOwner}
                  onChange={(e) => setSelectedOwner(e.target.value as TaskOwner | 'ALL')}
                  className="px-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5] font-semibold"
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
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              {/* Card Header: Title (Count) on left + Plus & Edit Icons on right */}
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                    Checklist Kesiapan ({filteredTasks.length})
                  </h2>
                  <p className="text-xs text-stone-500">
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
                    className="w-10 h-10 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-700 hover:text-[#8B6914] transition-colors"
                    title="Tambahkan tugas checklist"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                  {filteredTasks[0] && (
                    <button
                      type="button"
                      onClick={() => setEditingTask(filteredTasks[0])}
                      className="w-10 h-10 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-700 hover:text-[#8B6914] transition-colors"
                      title="Edit tugas checklist"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>

              {/* Card Body: Clean LinkedIn-Style Divider Rows */}
              <div className="divide-y divide-stone-200 px-6">
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
                              ? 'bg-amber-500 border-amber-500 text-stone-950'
                              : 'bg-white border-stone-400 hover:border-[#B68D40]'
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
                                ? 'line-through text-stone-400'
                                : 'text-stone-900'
                            }`}
                          >
                            {task.title}
                          </h4>

                          <div className="flex items-center gap-2 text-xs text-stone-600 flex-wrap">
                            <span className="inline-flex items-center gap-1 font-semibold text-stone-800">
                              <Award className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                              {task.category} &bull; {task.timelinePhase}
                            </span>
                            <span>&bull; PIC: {task.owner}</span>
                            <span>&bull; Target: {task.due}</span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                effectiveStatus === 'SELESAI'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : effectiveStatus === 'PROSES'
                                  ? 'bg-[#FAF3E3] text-[#8B6914]'
                                  : 'bg-stone-100 text-stone-700'
                              }`}
                            >
                              {effectiveStatus}
                            </span>
                          </div>

                          {task.notes && (
                            <p className="text-xs text-stone-500">{task.notes}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => setEditingTask(task)}
                          className="w-9 h-9 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600 hover:text-[#8B6914]"
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
                          className="w-9 h-9 rounded-full hover:bg-rose-50 flex items-center justify-center text-stone-400 hover:text-rose-600"
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
                  className="w-full py-3.5 border-t border-stone-200 hover:bg-[#FAF8F5] text-sm font-bold text-[#8B6914] flex items-center justify-center gap-1.5 transition-colors"
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
              <div className="h-full bg-white rounded-2xl p-4 border border-stone-200 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] font-bold uppercase text-stone-500">
                    Target Pagu Anggaran
                  </p>
                  <button
                    type="button"
                    onClick={() => openSettingsPopup('budget_cap')}
                    className="w-7 h-7 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600 hover:text-[#8B6914]"
                    title="Edit / Revisi Target Pagu Anggaran"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-lg sm:text-2xl font-extrabold text-stone-900 mt-1">
                  {formatRupiah(
                    state.settings.totalBudgetCap > 0
                      ? state.settings.totalBudgetCap
                      : metrics.totalEstimated
                  )}
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  Total Estimasi Item: {formatRupiah(metrics.totalEstimated)}
                </p>
              </div>
              <div className="h-full bg-[#FAF8F5] rounded-2xl p-4 border border-[#D4AF37]/40 flex flex-col justify-between">
                <p className="text-[11px] font-bold uppercase text-[#8B6914]">
                  Total Realisasi / Revisi
                </p>
                <p className="text-lg sm:text-2xl font-extrabold text-[#8B6914] mt-1">
                  {formatRupiah(metrics.totalActual)}
                </p>
                <p className="text-[11px] text-stone-500 mt-1">
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
            <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
              {/* Header with + and Edit icons on top-right */}
              <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                    Pos Anggaran &amp; Revisi Vendor ({filteredBudgetItems.length})
                  </h2>
                  <p className="text-xs text-stone-500">
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
                    className="w-10 h-10 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-700 hover:text-[#8B6914] transition-colors"
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
                    className="w-10 h-10 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-700 hover:text-[#8B6914] transition-colors"
                    title="Edit / Revisi Anggaran"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {filteredBudgetItems.length === 0 ? (
                <div className="p-8 text-center space-y-3">
                  <p className="text-sm font-semibold text-stone-700">
                    Belum ada pos anggaran atau vendor yang tercatat.
                  </p>
                  <p className="text-xs text-stone-500 max-w-md mx-auto">
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
                    className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    Tambahkan Pos Anggaran
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y divide-stone-200 px-6">
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
                                <h3 className="font-bold text-sm sm:text-base text-stone-900">
                                  {item.itemName}
                                </h3>
                                {(item.revisionCount || 0) > 0 && (
                                  <span className="px-2 py-0.5 rounded-full bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40 text-[10px] font-bold">
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
                              <p className="text-xs text-stone-600 flex items-center gap-1.5 flex-wrap">
                                <Wallet className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                                <span>
                                  {item.category} &bull; Vendor: {item.vendorName || '-'}
                                </span>
                                <span>
                                  &bull; Estimasi: {formatRupiah(item.estimatedCost)}
                                </span>
                                <span className="font-bold text-stone-900">
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
                                <p className="text-xs text-[#8B6914] font-medium">
                                  Catatan Revisi: {item.revisionNote}
                                </p>
                              )}
                              {item.notes && (
                                <p className="text-xs text-stone-500">{item.notes}</p>
                              )}
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => setEditingBudget(item)}
                                className="w-9 h-9 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600 hover:text-[#8B6914]"
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
                                className="w-9 h-9 rounded-full hover:bg-rose-50 flex items-center justify-center text-stone-400 hover:text-rose-600"
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
                      className="w-full py-3.5 border-t border-stone-200 hover:bg-[#FAF8F5] text-sm font-bold text-[#8B6914] flex items-center justify-center gap-1.5 transition-colors"
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
            <div className="bg-white rounded-2xl p-4 shadow-xs border border-stone-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setGuestSubTab('list')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      guestSubTab === 'list'
                        ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40] shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-[#FAF3E3] hover:text-[#8B6914]'
                    }`}
                  >
                    Daftar Tamu ({state.guests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setGuestSubTab('wishes')}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all ${
                      guestSubTab === 'wishes'
                        ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40] shadow-2xs'
                        : 'bg-white text-stone-700 border-stone-300 hover:bg-[#FAF3E3] hover:text-[#8B6914]'
                    }`}
                  >
                    Buku Tamu &amp; Doa ({state.wishes.length})
                  </button>
                </div>
              </div>

              {guestSubTab === 'list' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div className="relative">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={guestSearch}
                      onChange={(e) => setGuestSearch(e.target.value)}
                      placeholder="Cari nama tamu, pangkat, satker, kode INV..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5]"
                    />
                  </div>

                  <select
                    value={guestTypeFilter}
                    onChange={(e) => setGuestTypeFilter(e.target.value as GuestType | 'ALL')}
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5] font-semibold"
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
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5] font-semibold"
                  >
                    <option value="ALL">Semua Prioritas (P1 / P2 / P3)</option>
                    <option value="P1 - VIP">P1 - VIP Utama</option>
                    <option value="P2 - Utama">P2 - Utama</option>
                    <option value="P3 - Reguler">P3 - Reguler</option>
                  </select>

                  <select
                    value={guestRsvpFilter}
                    onChange={(e) => setGuestRsvpFilter(e.target.value as RsvpStatus | 'ALL')}
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-[#FAF8F5] font-semibold"
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
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                {/* LinkedIn-Style Header with + and Edit icons */}
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                      Tamu Undangan ({filteredGuests.length})
                    </h2>
                    <p className="text-xs text-stone-500">
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
                      className="w-10 h-10 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-700 hover:text-[#8B6914] transition-colors"
                      title="Tambahkan tamu undangan"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                    {filteredGuests[0] && (
                      <button
                        type="button"
                        onClick={() => setEditingGuest(filteredGuests[0])}
                        className="w-10 h-10 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-700 hover:text-[#8B6914] transition-colors"
                        title="Edit tamu undangan"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-stone-200 px-6">
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
                            <h3 className="font-bold text-sm sm:text-base text-stone-900">
                              {guest.guestName}
                            </h3>
                            <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914]">
                              {guest.invitationCode}
                            </span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
                              {guest.priority}
                            </span>
                          </div>
                          <p className="text-xs text-stone-600 flex items-center gap-1.5 flex-wrap">
                            <Award className="w-3.5 h-3.5 text-[#B68D40] shrink-0" />
                            <span>
                              {guest.institution || guest.guestType} &bull; {guest.side}
                            </span>
                            <span>
                              &bull; RSVP: <strong>{guest.rsvpStatus}</strong> ({guest.pax} Pax)
                            </span>
                            {guest.address && <span>&bull; {guest.address}</span>}
                          </p>
                          {guest.notes && (
                            <p className="text-xs text-stone-500">{guest.notes}</p>
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
                            className="px-3 py-1.5 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs border border-[#D4AF37]/40"
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
                            className="px-3 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs flex items-center gap-1"
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
                            className="w-8 h-8 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600 hover:text-[#8B6914]"
                            title="Preview Undangan"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingGuest(guest)}
                            className="w-8 h-8 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600 hover:text-[#8B6914]"
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
                            className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-stone-400 hover:text-rose-600"
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
                    className="w-full py-3.5 border-t border-stone-200 hover:bg-[#FAF8F5] text-sm font-bold text-[#8B6914] flex items-center justify-center gap-1.5 transition-colors"
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
              <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
                <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-stone-900">
                      Buku Tamu &amp; Ucapan Doa ({state.wishes.length})
                    </h2>
                    <p className="text-xs text-stone-500">
                      Daftar ucapan doa yang dikirim langsung oleh tamu melalui halaman undangan
                    </p>
                  </div>
                </div>
                {state.wishes.length === 0 ? (
                  <div className="p-8 text-center text-xs text-stone-500">
                    Belum ada ucapan doa yang masuk dari tamu.
                  </div>
                ) : (
                  <div className="divide-y divide-stone-200 px-6">
                    {state.wishes.map((w) => (
                      <div key={w.id} className="py-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-stone-900">
                                {w.guestName}
                              </h4>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                {w.rsvpStatus} ({w.pax} Pax)
                              </span>
                            </div>
                            <p className="text-xs text-stone-500">
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
                              className="px-2.5 py-1 rounded-full bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] text-xs font-bold flex items-center gap-1 border border-[#D4AF37]/30"
                            >
                              <Pin className="w-3 h-3" /> {w.isPinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setReplyingWishId(w.id);
                                setReplyText(w.replyFromCouple || '');
                              }}
                              className="w-8 h-8 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600 hover:text-[#8B6914]"
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
                              className="w-8 h-8 rounded-full hover:bg-rose-50 flex items-center justify-center text-stone-400 hover:text-rose-600"
                              title="Hapus Ucapan"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-stone-700">&ldquo;{w.message}&rdquo;</p>
                        {w.replyFromCouple && (
                          <p className="text-xs text-[#8B6914] pl-3 border-l-2 border-[#D4AF37]">
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
                              className="flex-1 px-3 py-1.5 rounded-xl border border-stone-300 text-xs"
                            />
                            <button
                              type="button"
                              onClick={async () => {
                                await onReplyWish(w.id, replyText);
                                setReplyingWishId(null);
                                showToast('Balasan berhasil disimpan!');
                              }}
                              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white font-bold text-xs"
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
          <div className="max-w-5xl mx-auto space-y-5">
            {/* WIRA SATYA 96 STYLE TOP HEADER BANNER (CHAMPAGNE GOLD & PEARL IVORY THEME) */}
            <div className="bg-white rounded-2xl border border-[#D4AF37]/35 px-6 py-4 shadow-2xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FAF3E3] to-[#F3E3C3] border-2 border-[#D4AF37] flex items-center justify-center text-[#8B6914] shrink-0 shadow-2xs">
                  <WeddingRingsIcon className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-base sm:text-lg font-extrabold text-stone-900 leading-tight">
                    Pengaturan
                  </h2>
                  <p className="text-xs text-[#9A742B] font-medium truncate mt-0.5">
                    {adminUser.nama} &bull; @{adminUser.username} &bull;{' '}
                    {state.settings.groomNickname} &amp; {state.settings.brideNickname}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSwitchToPublicPreview()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FAF3E3] hover:bg-[#F3E5C8] border border-[#D4AF37]/45 text-[#8B6914] font-bold text-xs transition-colors"
                  title="Buka tampilan undangan publik"
                >
                  <Eye className="w-3.5 h-3.5 text-[#B68D40]" />
                  <span className="hidden sm:inline">Pratinjau Undangan</span>
                </button>
              </div>
            </div>

            {/* WIRA SATYA 96 STYLE 2-COLUMN LAYOUT (LEFT SIDEBAR + RIGHT PANEL) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* LEFT SIDEBAR MENU */}
              <div className="lg:col-span-4 bg-white rounded-2xl border border-[#D4AF37]/30 shadow-2xs overflow-hidden divide-y divide-stone-100">
                {[
                  {
                    id: 'visibilitas' as const,
                    label: 'Visibilitas & Isi Undangan',
                    icon: Eye,
                    show: true,
                  },
                  {
                    id: 'background' as const,
                    label: 'Tema & Background',
                    icon: Sparkles,
                    show: true,
                  },
                  {
                    id: 'jadwal' as const,
                    label: 'Jadwal & Countdown',
                    icon: Calendar,
                    show: true,
                  },
                  {
                    id: 'keamanan' as const,
                    label: 'Keamanan & Akun',
                    icon: Lock,
                    show: !isPanitia,
                  },
                  {
                    id: 'database' as const,
                    label: 'Database & Backup',
                    icon: FileSpreadsheet,
                    show: true,
                  },
                ]
                  .filter((m) => m.show)
                  .map((menu) => {
                    const IconComp = menu.icon;
                    const isActive = settingsMenuTab === menu.id;
                    return (
                      <button
                        key={menu.id}
                        type="button"
                        onClick={() => setSettingsMenuTab(menu.id)}
                        className={`w-full px-5 py-3.5 flex items-center justify-between text-left transition-all ${
                          isActive
                            ? 'bg-[#FAF3E3] text-[#8B6914] font-bold border-l-4 border-[#B68D40]'
                            : 'bg-white hover:bg-[#FAF8F5] text-stone-700 font-medium'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <IconComp
                            className={`w-4 h-4 ${
                              isActive ? 'text-[#B68D40]' : 'text-stone-400'
                            }`}
                          />
                          <span className="text-xs sm:text-sm">{menu.label}</span>
                        </div>
                        <ChevronRight
                          className={`w-4 h-4 ${
                            isActive ? 'text-[#B68D40]' : 'text-stone-400'
                          }`}
                        />
                      </button>
                    );
                  })}
              </div>

              {/* RIGHT CONTENT PANEL */}
              <div className="lg:col-span-8 bg-white rounded-2xl border border-[#D4AF37]/30 p-6 shadow-2xs space-y-5">
                {/* ===============================================================
                    MENU 1: VISIBILITAS & ISI KONTEN UNDANGAN (SWITCH + EDITOR TERPADU)
                   =============================================================== */}
                {settingsMenuTab === 'visibilitas' && (
                  <div className="space-y-5">
                    {/* Panel Title */}
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-[#B68D40]" />
                      <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                        Pengaturan Visibilitas &amp; Konten Seksi Undangan
                      </h3>
                    </div>

                    {/* Segmented Champagne Gold Pill Sub-Tabs */}
                    <div className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/25 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setVisibilitasSubTab('semua')}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          visibilitasSubTab === 'semua'
                            ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white shadow-xs'
                            : 'text-stone-600 hover:text-[#8B6914]'
                        }`}
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Saklar &amp; Isi Konten (9 Seksi)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setVisibilitasSubTab('media');
                          setExpandedSectionKey('showLoveStorySection');
                        }}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          visibilitasSubTab === 'media'
                            ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white shadow-xs'
                            : 'text-stone-600 hover:text-[#8B6914]'
                        }`}
                      >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Kisah Kasih &amp; Galeri Foto</span>
                      </button>
                    </div>

                    {/* Status Summary Row */}
                    {(() => {
                      const allSections = [
                        {
                          key: 'showQuoteSection' as const,
                          title: 'Kutipan Ayat Suci & Kalimat Sambutan',
                          preview: `"${state.settings.quoteVerse}" — (${state.settings.quoteSource})`,
                          icon: BookOpen,
                          group: 'semua',
                        },
                        {
                          key: 'showCoupleSection' as const,
                          title: 'Profil Kedua Mempelai & Orang Tua',
                          preview: `${state.settings.groomFullName} & ${state.settings.brideFullName}`,
                          icon: Users,
                          group: 'semua',
                        },
                        {
                          key: 'showEvent1' as const,
                          title: `Acara 1: ${state.settings.event1Title}`,
                          preview: `${state.settings.event1DateLabel} • ${state.settings.event1TimeLabel} • ${state.settings.event1Venue}`,
                          icon: Calendar,
                          group: 'semua',
                        },
                        {
                          key: 'showEvent2' as const,
                          title: `Acara 2: ${state.settings.event2Title}`,
                          preview: `${state.settings.event2DateLabel} • ${state.settings.event2TimeLabel} • ${state.settings.event2Venue}`,
                          icon: Calendar,
                          group: 'semua',
                        },
                        {
                          key: 'showEvent3' as const,
                          title: `Acara 3: ${state.settings.event3Title}`,
                          preview: `${state.settings.event3DateLabel} • ${state.settings.event3TimeLabel} • ${state.settings.event3Venue}`,
                          icon: Calendar,
                          group: 'semua',
                        },
                        {
                          key: 'showLoveStorySection' as const,
                          title: 'Kisah Kasih (Love Story Timeline)',
                          preview: `${(state.settings.loveStory || []).length} Momen Perjalanan Cinta ditampilkan di undangan`,
                          icon: Heart,
                          group: 'media',
                        },
                        {
                          key: 'showGallerySection' as const,
                          title: 'Galeri Foto Prewedding',
                          preview: `${(state.settings.galleryPhotos || []).length} Foto Prewedding ditampilkan di galeri undangan`,
                          icon: ImageIcon,
                          group: 'media',
                        },
                        {
                          key: 'showRsvpSection' as const,
                          title: 'Form Konfirmasi Kehadiran (RSVP) & Buku Tamu',
                          preview: `Form RSVP interaktif & ${state.wishes.length} ucapan doa buku tamu`,
                          icon: MessageSquareHeart,
                          group: 'semua',
                        },
                        {
                          key: 'showGiftSection' as const,
                          title: 'Amplop Digital & Pengiriman Kado',
                          preview: `${(state.settings.bankAccounts || []).length} Rekening Bank/E-Wallet • Penerima Kado: ${state.settings.giftRecipientName}`,
                          icon: Wallet,
                          group: 'semua',
                        },
                      ];

                      const activeCount = allSections.filter(
                        (s) => state.settings[s.key] !== false
                      ).length;

                      const displayedSections =
                        visibilitasSubTab === 'media'
                          ? allSections.filter((s) => s.group === 'media')
                          : allSections;

                      return (
                        <>
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                            <span className="text-xs text-stone-500">
                              Aktifkan switch dan klik <strong>Atur Isi</strong> untuk mengubah apa yang ditampilkan di setiap seksi
                            </span>
                            <span className="px-3 py-1 rounded-full bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40 font-bold text-[11px] shrink-0">
                              &bull; Aktif ({activeCount}/9 Seksi)
                            </span>
                          </div>

                          {/* Rows List (Wira Satya 96 Row + Switch + Inline Content Editor) */}
                          <div className="divide-y divide-stone-100">
                            {displayedSections.map((sec) => {
                              const SecIcon = sec.icon;
                              const isShown = state.settings[sec.key] !== false;
                              const isExpanded = expandedSectionKey === sec.key;

                              return (
                                <div key={sec.key} className="py-4 first:pt-1 last:pb-1">
                                  {/* Row Header */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-start gap-3 min-w-0">
                                      <div
                                        className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                                          isShown
                                            ? 'bg-[#FAF3E3] border-[#D4AF37]/45 text-[#8B6914]'
                                            : 'bg-stone-50 border-stone-200 text-stone-400'
                                        }`}
                                      >
                                        <SecIcon className="w-4 h-4" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="font-bold text-xs sm:text-sm text-stone-900">
                                          {sec.title}
                                        </p>
                                        <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                                          {sec.preview}
                                        </p>
                                      </div>
                                    </div>

                                    {/* Right Controls: Status Badge + Switch + Atur Isi Button */}
                                    <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                                      <span
                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                          isShown
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                            : 'bg-rose-50 text-rose-600 border-rose-200'
                                        }`}
                                      >
                                        {isShown ? 'Aktif' : 'Nonaktif'}
                                      </span>

                                      {/* Real Toggle Switch */}
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={isShown}
                                        onClick={() =>
                                          handleToggleSectionSwitch(sec.key, sec.title)
                                        }
                                        title={
                                          isShown
                                            ? 'Klik untuk menyembunyikan dari undangan'
                                            : 'Klik untuk menampilkan di undangan'
                                        }
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                          isShown ? 'bg-emerald-600' : 'bg-stone-300'
                                        }`}
                                      >
                                        <span
                                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                            isShown ? 'translate-x-5' : 'translate-x-0'
                                          }`}
                                        />
                                      </button>

                                      {/* Expand Inline Content Editor Button */}
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSettingsForm(state.settings);
                                          setExpandedSectionKey(
                                            isExpanded ? null : sec.key
                                          );
                                        }}
                                        className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                                          isExpanded
                                            ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40]'
                                            : 'bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border-[#D4AF37]/45'
                                        }`}
                                      >
                                        {isExpanded ? 'Tutup Isi' : 'Atur Isi'}
                                      </button>
                                    </div>
                                  </div>

                                  {/* =========================================================
                                      INLINE CONTENT EDITOR ("APA YANG DITAMPILKAN DIMUAT DI SINI")
                                     ========================================================= */}
                                  {isExpanded && (
                                    <div className="mt-3.5 p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-3.5 text-xs">
                                      {/* 1. EDITOR KUTIPAN AYAT SUCI & KALIMAT */}
                                      {sec.key === 'showQuoteSection' && (
                                        <form
                                          onSubmit={handleSaveSettingsModal}
                                          className="space-y-3"
                                        >
                                          <div className="flex items-center justify-between">
                                            <span className="font-bold text-[#8B6914] uppercase tracking-wider text-[11px]">
                                              Pengaturan Isi Kutipan Ayat &amp; Sambutan yang Ditampilkan
                                            </span>
                                          </div>

                                          {/* Quick Verse Pills */}
                                          <div className="space-y-1.5">
                                            <span className="text-[11px] text-stone-500 font-medium">
                                              Pilih Cepat Contoh Kutipan Ayat:
                                            </span>
                                            <div className="flex flex-wrap gap-1.5">
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
                                                  className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-[11px]"
                                                >
                                                  <span>{q.source}</span>
                                                  <Plus className="w-3 h-3" />
                                                </button>
                                              ))}
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div>
                                              <label className="block font-bold text-stone-700 mb-1">
                                                Sumber Ayat / Kutipan
                                              </label>
                                              <input
                                                type="text"
                                                value={settingsForm.quoteSource || ''}
                                                onChange={(e) =>
                                                  setSettingsForm({
                                                    ...settingsForm,
                                                    quoteSource: e.target.value,
                                                  })
                                                }
                                                placeholder="Contoh: Kolose 3 : 14"
                                                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white font-semibold"
                                              />
                                            </div>
                                            <div className="sm:col-span-2">
                                              <label className="block font-bold text-stone-700 mb-1">
                                                Isi Kutipan Ayat yang Ditampilkan di Undangan
                                              </label>
                                              <textarea
                                                rows={2}
                                                value={settingsForm.quoteVerse || ''}
                                                onChange={(e) =>
                                                  setSettingsForm({
                                                    ...settingsForm,
                                                    quoteVerse: e.target.value,
                                                  })
                                                }
                                                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                                              />
                                            </div>
                                          </div>

                                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                              <label className="block font-bold text-stone-700 mb-1">
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
                                                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                                              />
                                            </div>
                                            <div>
                                              <label className="block font-bold text-stone-700 mb-1">
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
                                                className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex justify-end pt-1">
                                            <button
                                              type="submit"
                                              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs"
                                            >
                                              Simpan Kutipan &amp; Kalimat
                                            </button>
                                          </div>
                                        </form>
                                      )}

                                      {/* 2. EDITOR PROFIL KEDUA MEMPELAI */}
                                      {sec.key === 'showCoupleSection' && (
                                        <form
                                          onSubmit={handleSaveSettingsModal}
                                          className="space-y-3"
                                        >
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* Pria */}
                                            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2.5">
                                              <p className="font-bold text-[#8B6914] uppercase text-[11px]">
                                                Profil Mempelai Pria
                                              </p>
                                              <div>
                                                <label className="block text-stone-600 mb-0.5">
                                                  Nama Lengkap &amp; Gelar
                                                </label>
                                                <input
                                                  type="text"
                                                  value={settingsForm.groomFullName || ''}
                                                  onChange={(e) =>
                                                    setSettingsForm({
                                                      ...settingsForm,
                                                      groomFullName: e.target.value,
                                                    })
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 font-semibold"
                                                />
                                              </div>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <label className="block text-stone-600 mb-0.5">
                                                    Panggilan
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={settingsForm.groomNickname || ''}
                                                    onChange={(e) =>
                                                      setSettingsForm({
                                                        ...settingsForm,
                                                        groomNickname: e.target.value,
                                                      })
                                                    }
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-stone-600 mb-0.5">
                                                    Pangkat / Label
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
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-stone-600 mb-0.5">
                                                  Orang Tua Mempelai Pria
                                                </label>
                                                <input
                                                  type="text"
                                                  value={settingsForm.groomParents || ''}
                                                  onChange={(e) =>
                                                    setSettingsForm({
                                                      ...settingsForm,
                                                      groomParents: e.target.value,
                                                    })
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-stone-600 mb-0.5">
                                                  URL Foto Mempelai Pria
                                                </label>
                                                <input
                                                  type="text"
                                                  value={settingsForm.groomPhotoUrl || ''}
                                                  onChange={(e) =>
                                                    setSettingsForm({
                                                      ...settingsForm,
                                                      groomPhotoUrl: e.target.value,
                                                    })
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                                />
                                              </div>
                                            </div>

                                            {/* Wanita */}
                                            <div className="p-3.5 rounded-xl bg-white border border-stone-200 space-y-2.5">
                                              <p className="font-bold text-[#8B6914] uppercase text-[11px]">
                                                Profil Mempelai Wanita
                                              </p>
                                              <div>
                                                <label className="block text-stone-600 mb-0.5">
                                                  Nama Lengkap &amp; Gelar
                                                </label>
                                                <input
                                                  type="text"
                                                  value={settingsForm.brideFullName || ''}
                                                  onChange={(e) =>
                                                    setSettingsForm({
                                                      ...settingsForm,
                                                      brideFullName: e.target.value,
                                                    })
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300 font-semibold"
                                                />
                                              </div>
                                              <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                  <label className="block text-stone-600 mb-0.5">
                                                    Panggilan
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={settingsForm.brideNickname || ''}
                                                    onChange={(e) =>
                                                      setSettingsForm({
                                                        ...settingsForm,
                                                        brideNickname: e.target.value,
                                                      })
                                                    }
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                                                  />
                                                </div>
                                                <div>
                                                  <label className="block text-stone-600 mb-0.5">
                                                    Gelar / Label
                                                  </label>
                                                  <input
                                                    type="text"
                                                    value={settingsForm.brideTitle || ''}
                                                    onChange={(e) =>
                                                      setSettingsForm({
                                                        ...settingsForm,
                                                        brideTitle: e.target.value,
                                                      })
                                                    }
                                                    className="w-full px-2.5 py-1.5 rounded-lg border border-stone-300"
                                                  />
                                                </div>
                                              </div>
                                              <div>
                                                <label className="block text-stone-600 mb-0.5">
                                                  Orang Tua Mempelai Wanita
                                                </label>
                                                <input
                                                  type="text"
                                                  value={settingsForm.brideParents || ''}
                                                  onChange={(e) =>
                                                    setSettingsForm({
                                                      ...settingsForm,
                                                      brideParents: e.target.value,
                                                    })
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                                />
                                              </div>
                                              <div>
                                                <label className="block text-stone-600 mb-0.5">
                                                  URL Foto Mempelai Wanita
                                                </label>
                                                <input
                                                  type="text"
                                                  value={settingsForm.bridePhotoUrl || ''}
                                                  onChange={(e) =>
                                                    setSettingsForm({
                                                      ...settingsForm,
                                                      bridePhotoUrl: e.target.value,
                                                    })
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                                />
                                              </div>
                                            </div>
                                          </div>

                                          <div className="flex justify-end">
                                            <button
                                              type="submit"
                                              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs"
                                            >
                                              Simpan Profil Mempelai
                                            </button>
                                          </div>
                                        </form>
                                      )}

                                      {/* 3, 4, 5. EDITOR ACARA 1, ACARA 2, ACARA 3 */}
                                      {(sec.key === 'showEvent1' ||
                                        sec.key === 'showEvent2' ||
                                        sec.key === 'showEvent3') && (
                                        <form
                                          onSubmit={handleSaveSettingsModal}
                                          className="space-y-3"
                                        >
                                          {(() => {
                                            const prefix =
                                              sec.key === 'showEvent1'
                                                ? 'event1'
                                                : sec.key === 'showEvent2'
                                                  ? 'event2'
                                                  : 'event3';
                                            const titleKey = `${prefix}Title` as const;
                                            const subKey = `${prefix}Subtitle` as const;
                                            const dateKey = `${prefix}DateLabel` as const;
                                            const timeKey = `${prefix}TimeLabel` as const;
                                            const venueKey = `${prefix}Venue` as const;
                                            const addrKey = `${prefix}Address` as const;
                                            const dressKey = `${prefix}Dresscode` as const;
                                            const mapsKey = `${prefix}MapsUrl` as const;

                                            return (
                                              <>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
                                                      Nama / Judul Acara
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white font-semibold"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                                                    />
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
                                                      Hari &amp; Tanggal (Teks)
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
                                                      Jam Pelaksanaan
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                                                    />
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
                                                      Nama Tempat / Gedung / Gereja
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
                                                      Alamat Lengkap
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                                                    />
                                                  </div>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
                                                      Dresscode
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                                                    />
                                                  </div>
                                                  <div>
                                                    <label className="block font-bold text-stone-700 mb-0.5">
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
                                                      className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white"
                                                    />
                                                  </div>
                                                </div>
                                              </>
                                            );
                                          })()}

                                          <div className="flex justify-end">
                                            <button
                                              type="submit"
                                              className="px-5 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs"
                                            >
                                              Simpan Detail Acara
                                            </button>
                                          </div>
                                        </form>
                                      )}

                                      {/* 6. EDITOR KISAH KASIH (LOVE STORY TIMELINE) */}
                                      {sec.key === 'showLoveStorySection' && (
                                        <div className="space-y-3">
                                          <p className="font-bold text-[#8B6914] uppercase tracking-wider text-[11px]">
                                            Daftar Momen Kisah Kasih yang Ditampilkan ({(state.settings.loveStory || []).length})
                                          </p>

                                          {/* Existing Love Story List */}
                                          {(state.settings.loveStory || []).length === 0 ? (
                                            <p className="text-xs text-stone-500 italic bg-white p-3 rounded-lg border border-stone-200">
                                              Belum ada cerita perjalanan cinta. Tambahkan momen di bawah agar tampil pada seksi Kisah Kasih di undangan.
                                            </p>
                                          ) : (
                                            <div className="space-y-2">
                                              {(state.settings.loveStory || []).map((st) => (
                                                <div
                                                  key={st.id}
                                                  className="p-3 rounded-lg bg-white border border-stone-200 flex items-start justify-between gap-3"
                                                >
                                                  <div>
                                                    <p className="font-bold text-stone-900">
                                                      {st.dateLabel} — {st.title}{' '}
                                                      <span className="text-stone-400 font-normal">
                                                        ({st.location})
                                                      </span>
                                                    </p>
                                                    <p className="text-stone-600 mt-0.5">
                                                      {st.description}
                                                    </p>
                                                  </div>
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      handleDeleteLoveStoryItem(st.id)
                                                    }
                                                    className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 shrink-0"
                                                  >
                                                    <Trash2 className="w-4 h-4" />
                                                  </button>
                                                </div>
                                              ))}
                                            </div>
                                          )}

                                          {/* Quick Suggestion Pills for Love Story */}
                                          <div className="flex flex-wrap gap-1.5">
                                            {[
                                              {
                                                dateLabel: '2022',
                                                title: 'Pertemuan Pertama',
                                                location: 'Semarang',
                                                description:
                                                  'Awal mula perkenalan yang membawa kami saling mengenal lebih dekat.',
                                              },
                                              {
                                                dateLabel: '2024',
                                                title: 'Komitmen Bersama',
                                                location: 'Jakarta',
                                                description:
                                                  'Menjalani suka duka bersama dan memantapkan hati untuk melangkah ke jenjang serius.',
                                              },
                                              {
                                                dateLabel: 'Desember 2026',
                                                title: 'Ikatan Suci Pernikahan',
                                                location: 'Semarang',
                                                description:
                                                  'Dengan restu Tuhan dan kedua orang tua, kami mengikat janji suci pernikahan.',
                                              },
                                            ].map((sug) => (
                                              <button
                                                key={sug.title}
                                                type="button"
                                                onClick={() => setNewStoryForm(sug)}
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-[11px]"
                                              >
                                                <span>{sug.title}</span>
                                                <Plus className="w-3 h-3" />
                                              </button>
                                            ))}
                                          </div>

                                          {/* Add New Love Story Form */}
                                          <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-2.5">
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                              <input
                                                type="text"
                                                value={newStoryForm.dateLabel}
                                                onChange={(e) =>
                                                  setNewStoryForm({
                                                    ...newStoryForm,
                                                    dateLabel: e.target.value,
                                                  })
                                                }
                                                placeholder="Tahun / Tanggal (misal: 2023)"
                                                className="px-3 py-1.5 rounded-lg border border-stone-300"
                                              />
                                              <input
                                                type="text"
                                                value={newStoryForm.title}
                                                onChange={(e) =>
                                                  setNewStoryForm({
                                                    ...newStoryForm,
                                                    title: e.target.value,
                                                  })
                                                }
                                                placeholder="Judul Momen (misal: Pertemuan Pertama)"
                                                className="px-3 py-1.5 rounded-lg border border-stone-300 font-semibold"
                                              />
                                              <input
                                                type="text"
                                                value={newStoryForm.location}
                                                onChange={(e) =>
                                                  setNewStoryForm({
                                                    ...newStoryForm,
                                                    location: e.target.value,
                                                  })
                                                }
                                                placeholder="Kota / Lokasi"
                                                className="px-3 py-1.5 rounded-lg border border-stone-300"
                                              />
                                            </div>
                                            <textarea
                                              rows={2}
                                              value={newStoryForm.description}
                                              onChange={(e) =>
                                                setNewStoryForm({
                                                  ...newStoryForm,
                                                  description: e.target.value,
                                                })
                                              }
                                              placeholder="Ceritakan secara singkat momen indah tersebut..."
                                              className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                            />
                                            <div className="flex justify-end">
                                              <button
                                                type="button"
                                                onClick={handleAddLoveStoryItem}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                                Tambahkan ke Kisah Kasih
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* 7. EDITOR GALERI FOTO PREWEDDING */}
                                      {sec.key === 'showGallerySection' && (
                                        <div className="space-y-3">
                                          <p className="font-bold text-[#8B6914] uppercase tracking-wider text-[11px]">
                                            Daftar Foto Galeri yang Ditampilkan ({(state.settings.galleryPhotos || []).length})
                                          </p>

                                          {(state.settings.galleryPhotos || []).length === 0 ? (
                                            <p className="text-xs text-stone-500 italic bg-white p-3 rounded-lg border border-stone-200">
                                              Belum ada foto di galeri prewedding. Tambahkan URL foto di bawah untuk menampilkan galeri pada undangan.
                                            </p>
                                          ) : (
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                              {(state.settings.galleryPhotos || []).map(
                                                (ph) => (
                                                  <div
                                                    key={ph.id}
                                                    className="p-2.5 rounded-lg bg-white border border-stone-200 flex items-center justify-between gap-2.5"
                                                  >
                                                    <div className="flex items-center gap-2.5 min-w-0">
                                                      <img
                                                        src={ph.imageUrl}
                                                        alt={ph.title}
                                                        className="w-11 h-11 rounded-lg object-cover border border-stone-200 shrink-0"
                                                      />
                                                      <div className="min-w-0">
                                                        <p className="font-bold text-stone-900 truncate">
                                                          {ph.title}
                                                        </p>
                                                        <p className="text-[11px] text-stone-500 truncate">
                                                          {ph.caption}
                                                        </p>
                                                      </div>
                                                    </div>
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        handleDeleteGalleryPhotoItem(ph.id)
                                                      }
                                                      className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500 shrink-0"
                                                    >
                                                      <Trash2 className="w-4 h-4" />
                                                    </button>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}

                                          {/* Quick Preset Photo Suggestions */}
                                          <div className="flex flex-wrap gap-1.5">
                                            {BACKGROUND_PRESETS.map((preset) => (
                                              <button
                                                key={preset.label}
                                                type="button"
                                                onClick={() =>
                                                  setNewPhotoForm({
                                                    title: preset.label,
                                                    caption: 'Momen Prewedding',
                                                    imageUrl: preset.url,
                                                    category: 'Prewedding',
                                                  })
                                                }
                                                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-[11px]"
                                              >
                                                <span>{preset.label}</span>
                                                <Plus className="w-3 h-3" />
                                              </button>
                                            ))}
                                          </div>

                                          {/* Add Photo Form */}
                                          <div className="p-3 rounded-xl bg-white border border-stone-200 space-y-2.5">
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                              <input
                                                type="text"
                                                value={newPhotoForm.title}
                                                onChange={(e) =>
                                                  setNewPhotoForm({
                                                    ...newPhotoForm,
                                                    title: e.target.value,
                                                  })
                                                }
                                                placeholder="Judul Foto"
                                                className="px-3 py-1.5 rounded-lg border border-stone-300 font-semibold"
                                              />
                                              <input
                                                type="text"
                                                value={newPhotoForm.caption}
                                                onChange={(e) =>
                                                  setNewPhotoForm({
                                                    ...newPhotoForm,
                                                    caption: e.target.value,
                                                  })
                                                }
                                                placeholder="Caption Singkat"
                                                className="px-3 py-1.5 rounded-lg border border-stone-300"
                                              />
                                            </div>
                                            <input
                                              type="text"
                                              value={newPhotoForm.imageUrl}
                                              onChange={(e) =>
                                                setNewPhotoForm({
                                                  ...newPhotoForm,
                                                  imageUrl: e.target.value,
                                                })
                                              }
                                              placeholder="URL Gambar Foto (https://...)"
                                              className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                            />
                                            <div className="flex justify-end">
                                              <button
                                                type="button"
                                                onClick={handleAddGalleryPhotoItem}
                                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs"
                                              >
                                                <Plus className="w-3.5 h-3.5" />
                                                Tambahkan Foto ke Galeri
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      )}

                                      {/* 8. EDITOR FORM RSVP & BUKU TAMU */}
                                      {sec.key === 'showRsvpSection' && (
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-stone-200">
                                          <div>
                                            <p className="font-bold text-stone-900">
                                              Status Form RSVP &amp; Buku Tamu Digital
                                            </p>
                                            <p className="text-stone-500 mt-0.5">
                                              Saat ini tercatat <strong>{state.guests.length} tamu undangan</strong> dan <strong>{state.wishes.length} ucapan doa</strong> yang tampil di buku tamu.
                                            </p>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => setActiveTab('guests')}
                                            className="px-4 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shrink-0"
                                          >
                                            Kelola Tamu &amp; Ucapan ({state.wishes.length})
                                          </button>
                                        </div>
                                      )}

                                      {/* 9. EDITOR AMPLOP DIGITAL & REKENING */}
                                      {sec.key === 'showGiftSection' && (
                                        <div className="space-y-3">
                                          <div className="flex items-center justify-between">
                                            <p className="font-bold text-[#8B6914] uppercase tracking-wider text-[11px]">
                                              Daftar Rekening &amp; Alamat Kado ({(state.settings.bankAccounts || []).length} Rekening)
                                            </p>
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setEditingBankIndex(null);
                                                setBankForm({
                                                  id: '',
                                                  bankName: 'BANK BCA',
                                                  accountNumber: '',
                                                  accountHolder:
                                                    state.settings.groomFullName || 'John Doe',
                                                  branchOrNote: 'Transfer Amplop Digital',
                                                  type: 'BANK',
                                                });
                                                setActiveSettingsModal('bank_account');
                                              }}
                                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs"
                                            >
                                              <Plus className="w-3.5 h-3.5" />
                                              Tambah Rekening
                                            </button>
                                          </div>

                                          {(state.settings.bankAccounts || []).length === 0 ? (
                                            <p className="text-xs text-stone-500 italic bg-white p-3 rounded-lg border border-stone-200">
                                              Belum ada rekening bank/e-wallet. Klik &ldquo;Tambah Rekening&rdquo; untuk menampilkan amplop digital di undangan.
                                            </p>
                                          ) : (
                                            <div className="space-y-2">
                                              {(state.settings.bankAccounts || []).map(
                                                (acc, idx) => (
                                                  <div
                                                    key={acc.id || idx}
                                                    className="p-3 rounded-lg bg-white border border-stone-200 flex items-center justify-between gap-2"
                                                  >
                                                    <div>
                                                      <p className="font-bold text-stone-900">
                                                        {acc.bankName} —{' '}
                                                        <span className="font-mono">
                                                          {acc.accountNumber}
                                                        </span>
                                                      </p>
                                                      <p className="text-stone-500">
                                                        a.n. {acc.accountHolder} &bull;{' '}
                                                        {acc.branchOrNote}
                                                      </p>
                                                    </div>
                                                    <div className="flex items-center gap-1">
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
                                                        className="p-1.5 rounded-lg hover:bg-[#FAF3E3] text-stone-600 hover:text-[#8B6914]"
                                                      >
                                                        <Edit3 className="w-4 h-4" />
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() =>
                                                          handleDeleteBankAccount(acc.id)
                                                        }
                                                        className="p-1.5 rounded-lg hover:bg-rose-50 text-rose-500"
                                                      >
                                                        <Trash2 className="w-4 h-4" />
                                                      </button>
                                                    </div>
                                                  </div>
                                                )
                                              )}
                                            </div>
                                          )}

                                          <form
                                            onSubmit={handleSaveSettingsModal}
                                            className="p-3 rounded-xl bg-white border border-stone-200 space-y-2.5"
                                          >
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                              <div>
                                                <label className="block font-bold text-stone-700 mb-0.5">
                                                  Nama Penerima Kado Fisik
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
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                                />
                                              </div>
                                              <div>
                                                <label className="block font-bold text-stone-700 mb-0.5">
                                                  Alamat Pengiriman Kado Fisik
                                                </label>
                                                <input
                                                  type="text"
                                                  value={settingsForm.giftShippingAddress || ''}
                                                  onChange={(e) =>
                                                    setSettingsForm({
                                                      ...settingsForm,
                                                      giftShippingAddress: e.target.value,
                                                    })
                                                  }
                                                  className="w-full px-3 py-1.5 rounded-lg border border-stone-300"
                                                />
                                              </div>
                                            </div>
                                            <div className="flex justify-end">
                                              <button
                                                type="submit"
                                                className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs"
                                              >
                                                Simpan Alamat Kado
                                              </button>
                                            </div>
                                          </form>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* ===============================================================
                    MENU 2: TEMA & BACKGROUND UNDANGAN
                   =============================================================== */}
                {settingsMenuTab === 'background' && (
                  <form onSubmit={handleSaveSettingsModal} className="space-y-5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Sparkles className="w-4 h-4 text-[#B68D40]" />
                        <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                          Pengaturan Tema Cerah, Siluet Foto &amp; Efek Transparansi
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40 font-bold text-[11px]">
                        &bull; Pearl Veil {settingsForm.bgOverlayOpacity ?? 88}%
                      </span>
                    </div>

                    {/* Quick Preset Selector */}
                    <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                      <p className="font-bold text-xs text-stone-800">
                        Pilih Cepat Preset Background Tema Cerah / Siluet Prewedding:
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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
                            className="p-2.5 rounded-xl bg-white hover:bg-[#FAF3E3]/60 border border-[#D4AF37]/30 hover:border-[#B68D40] text-left transition-all flex items-center gap-3"
                          >
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-11 h-11 rounded-lg object-cover border border-[#D4AF37]/30 shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-bold text-xs text-stone-900 truncate">
                                {preset.label}
                              </p>
                              <p className="text-[11px] text-[#8B6914] font-semibold">
                                Gunakan Tema Ini +
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 3 URL Inputs */}
                    <div className="space-y-3">
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">
                          URL Background Sampul Pembuka (Cover)
                        </label>
                        <input
                          type="text"
                          value={settingsForm.coverBgUrl || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, coverBgUrl: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">
                          URL Banner Utama / Siluet Foto Prewedding
                        </label>
                        <input
                          type="text"
                          value={settingsForm.heroPrewedUrl || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, heroPrewedUrl: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-stone-700 mb-1">
                          URL Wallpaper Latar Halaman Undangan
                        </label>
                        <input
                          type="text"
                          value={settingsForm.pageBgUrl || ''}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, pageBgUrl: e.target.value })
                          }
                          className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                        />
                      </div>
                    </div>

                    {/* Opacity & Blur */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30">
                        <div className="flex items-center justify-between mb-1">
                          <label className="font-bold text-stone-800 text-xs">
                            Tingkat Transparansi Putih (Pearl Veil)
                          </label>
                          <span className="font-mono font-bold text-[#8B6914] text-xs">
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
                      </div>

                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30">
                        <label className="block font-bold text-stone-800 text-xs mb-1">
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
                          className="w-full px-3 py-1.5 rounded-lg border border-stone-300 bg-white text-xs"
                        >
                          <option value="none">Tanpa Blur (Foto Tajam)</option>
                          <option value="sm">Blur Halus (Rekomendasi)</option>
                          <option value="md">Blur Sedang (Soft Frosted)</option>
                          <option value="lg">Blur Kuat (Deep Glass)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-stone-100">
                      <button
                        type="submit"
                        className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs"
                      >
                        Simpan Tema &amp; Background
                      </button>
                    </div>
                  </form>
                )}

                {/* ===============================================================
                    MENU 3: JADWAL ACARA & WAKTU COUNTDOWN
                   =============================================================== */}
                {settingsMenuTab === 'jadwal' && (
                  <div className="space-y-5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-[#B68D40]" />
                        <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                          Pengaturan Waktu Countdown &amp; Rangkaian Acara Mandiri
                        </h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => openSettingsPopup('countdown')}
                        className="px-3.5 py-1.5 rounded-lg bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border border-[#D4AF37]/40 font-bold text-xs"
                      >
                        Ubah Countdown
                      </button>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {/* Row Countdown Utama */}
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">
                              Target Waktu Countdown Hari-H &amp; Biston
                            </p>
                            <p className="text-xs text-stone-500">
                              Pemberkatan: <span className="font-mono font-semibold">{(state.settings.weddingDatetime || '').slice(0, 16).replace('T', ' ')}</span> &bull; Acara 1: <span className="font-mono font-semibold">{(state.settings.bistonDatetime || '').slice(0, 16).replace('T', ' ')}</span>
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => openSettingsPopup('countdown')}
                          className="px-3.5 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs shrink-0"
                        >
                          Edit Waktu
                        </button>
                      </div>

                      {/* Row Acara 1, 2, 3 */}
                      {[
                        {
                          modal: 'event1' as const,
                          showKey: 'showEvent1' as const,
                          title: state.settings.event1Title,
                          date: state.settings.event1DateLabel,
                          time: state.settings.event1TimeLabel,
                          venue: state.settings.event1Venue,
                          badge: 'Acara 1',
                        },
                        {
                          modal: 'event2' as const,
                          showKey: 'showEvent2' as const,
                          title: state.settings.event2Title,
                          date: state.settings.event2DateLabel,
                          time: state.settings.event2TimeLabel,
                          venue: state.settings.event2Venue,
                          badge: 'Pemberkatan / Akad',
                        },
                        {
                          modal: 'event3' as const,
                          showKey: 'showEvent3' as const,
                          title: state.settings.event3Title,
                          date: state.settings.event3DateLabel,
                          time: state.settings.event3TimeLabel,
                          venue: state.settings.event3Venue,
                          badge: 'Resepsi Utama',
                        },
                      ].map((ev) => {
                        const isShown = state.settings[ev.showKey] !== false;
                        return (
                          <div
                            key={ev.modal}
                            className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-start gap-3">
                              <div className="w-9 h-9 rounded-full bg-[#FAF8F5] border border-[#D4AF37]/30 text-[#8B6914] flex items-center justify-center shrink-0">
                                <Calendar className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-bold text-stone-900">{ev.title}</p>
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/30 font-bold">
                                    {ev.badge}
                                  </span>
                                </div>
                                <p className="text-xs text-stone-500">
                                  {ev.date} &bull; {ev.time} &bull; {ev.venue}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2.5 self-end sm:self-center shrink-0">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                                  isShown
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-600 border-rose-200'
                                }`}
                              >
                                {isShown ? 'Aktif' : 'Nonaktif'}
                              </span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={isShown}
                                onClick={() =>
                                  handleToggleSectionSwitch(ev.showKey, ev.title)
                                }
                                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                                  isShown ? 'bg-[#B68D40]' : 'bg-stone-300'
                                }`}
                              >
                                <span
                                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                                    isShown ? 'translate-x-5' : 'translate-x-0'
                                  }`}
                                />
                              </button>
                              <button
                                type="button"
                                onClick={() => openSettingsPopup(ev.modal)}
                                className="px-3.5 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs"
                              >
                                Edit Jadwal
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* ===============================================================
                    MENU 4: KEAMANAN & AKUN (EXACT WIRA SATYA 96 SCREENSHOT 2 LAYOUT)
                   =============================================================== */}
                {settingsMenuTab === 'keamanan' && !isPanitia && (
                  <div className="space-y-5 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5">
                      <Shield className="w-4 h-4 text-[#B68D40]" />
                      <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                        Pengaturan Profil &amp; Keamanan Akun Sistem
                      </h3>
                    </div>

                    {/* Champagne Gold Pill Sub-Tabs */}
                    <div className="p-1.5 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/25 grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setKeamananSubTab('utama')}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          keamananSubTab === 'utama'
                            ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white shadow-xs'
                            : 'text-stone-600 hover:text-[#8B6914]'
                        }`}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Akun Utama &amp; Otentikasi (4 Inti)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setKeamananSubTab('panitia')}
                        className={`py-2.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                          keamananSubTab === 'panitia'
                            ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white shadow-xs'
                            : 'text-stone-600 hover:text-[#8B6914]'
                        }`}
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Akun Panitia &amp; WO ({panitiaUsers.length})</span>
                      </button>
                    </div>

                    {/* SUB-TAB 1: 4 AKUN UTAMA */}
                    {keamananSubTab === 'utama' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                          <span className="text-xs text-stone-500">
                            Status proteksi otorisasi perubahan kredensial akun utama
                          </span>
                          <span className="px-3 py-1 rounded-full bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/40 font-bold text-[11px]">
                            &bull; Terproteksi Superadmin
                          </span>
                        </div>

                        <div className="divide-y divide-stone-100">
                          {defaultSystemUsers.map((u) => (
                            <div
                              key={u.id}
                              className="py-3.5 flex items-center justify-between gap-4"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                                  <KeyRound className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-stone-900">
                                    {u.nama}{' '}
                                    <span className="font-mono text-xs text-stone-500 font-normal">
                                      (@{u.username})
                                    </span>
                                  </p>
                                  <p className="text-[11px] text-stone-500 truncate">
                                    {u.jabatan} &bull; Hak Akses Penuh (Termasuk Budgeting)
                                  </p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2.5 shrink-0">
                                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                  Aktif
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSelectDefaultUserForEdit(u)}
                                  className="px-3.5 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs"
                                >
                                  Ubah Password
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* SUB-TAB 2: AKUN PANITIA / WO */}
                    {keamananSubTab === 'panitia' && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between gap-2 pb-2 border-b border-stone-100">
                          <span className="text-xs text-stone-500">
                            Akun panitia otomatis terkunci dari tab Anggaran &amp; Revisi Vendor
                          </span>
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
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Tambah Panitia
                          </button>
                        </div>

                        {panitiaUsers.length === 0 ? (
                          <div className="p-6 rounded-xl bg-[#FAF8F5] border border-dashed border-[#D4AF37]/40 text-center text-xs text-stone-500">
                            Belum ada akun Panitia / WO tambahan. Klik <strong>+ Tambah Panitia</strong> di kanan atas untuk membuat akun panitia.
                          </div>
                        ) : (
                          <div className="divide-y divide-stone-100">
                            {panitiaUsers.map((pu) => (
                              <div
                                key={pu.id}
                                className="py-3.5 flex items-center justify-between gap-4"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-9 h-9 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/30 text-[#8B6914] flex items-center justify-center shrink-0">
                                    <UserPlus className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-stone-900">
                                      {pu.nama}{' '}
                                      <span className="font-mono text-xs text-stone-500 font-normal">
                                        (@{pu.username})
                                      </span>
                                    </p>
                                    <p className="text-[11px] text-stone-500">
                                      {pu.jabatan} &bull;{' '}
                                      <span className="text-rose-600 font-semibold">
                                        Non-Budgeting
                                      </span>
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                    Aktif
                                  </span>
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
                                    className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs"
                                  >
                                    Edit
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeletePanitiaAccount(pu.id, pu.username)
                                    }
                                    className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ===============================================================
                    MENU 5: DATABASE LOKAL, BACKUP & EXPORT
                   =============================================================== */}
                {settingsMenuTab === 'database' && (
                  <div className="space-y-5 text-xs sm:text-sm">
                    <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                      <div className="flex items-center gap-2.5">
                        <FileSpreadsheet className="w-4 h-4 text-[#B68D40]" />
                        <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
                          Database Lokal, Sinkronisasi &amp; Backup Data
                        </h3>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                        &bull; DB Lokal Aktif
                      </span>
                    </div>

                    <div className="divide-y divide-stone-100">
                      {/* Backup JSON */}
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] flex items-center justify-center shrink-0">
                            <FileJson className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">
                              Backup &amp; Restore Database Lengkap (.JSON)
                            </p>
                            <p className="text-xs text-stone-500">
                              Unduh seluruh data aplikasi atau pulihkan dari file JSON
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
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
                            className="px-3.5 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs"
                          >
                            Export JSON
                          </button>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs"
                          >
                            Import JSON
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

                      {/* Export CSV */}
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0">
                            <FileSpreadsheet className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">
                              Ekspor Tabel ke Spreadsheet (.CSV Excel)
                            </p>
                            <p className="text-xs text-stone-500">
                              Unduh data Checklist, Daftar Tamu, atau Anggaran dalam format CSV
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          <button
                            type="button"
                            onClick={() => {
                              triggerFileDownload(
                                'DB_Wedding_Tasks.csv',
                                exportTasksToCsv(state.tasks),
                                'text/csv;charset=utf-8;'
                              );
                              showToast('Tasks.csv berhasil diunduh!');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-[#8B6914] font-bold text-xs"
                          >
                            CSV Checklist
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              triggerFileDownload(
                                'DB_Wedding_Guests.csv',
                                exportGuestsToCsv(state.guests),
                                'text/csv;charset=utf-8;'
                              );
                              showToast('Guests.csv berhasil diunduh!');
                            }}
                            className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-[#8B6914] font-bold text-xs"
                          >
                            CSV Tamu
                          </button>
                          {!isPanitia && (
                            <button
                              type="button"
                              onClick={() => {
                                triggerFileDownload(
                                  'DB_Wedding_Budget.csv',
                                  exportBudgetToCsv(state.budgetItems),
                                  'text/csv;charset=utf-8;'
                                );
                                showToast('Budget.csv berhasil diunduh!');
                              }}
                              className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF8F5] hover:bg-[#FAF3E3] text-[#8B6914] font-bold text-xs"
                            >
                              CSV Anggaran
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Sinkronisasi Arsip Spreadsheet */}
                      <div className="py-3.5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] flex items-center justify-center shrink-0">
                            <RefreshCw
                              className={`w-4 h-4 ${isSyncingSheets ? 'animate-spin' : ''}`}
                            />
                          </div>
                          <div>
                            <p className="font-bold text-stone-900">
                              Sinkronisasi Arsip Google Sheets ke DB Lokal
                            </p>
                            <p className="text-xs text-stone-500">
                              Tarik ulang pembaruan dari arsip spreadsheet ke database lokal
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleTriggerSyncSheets}
                          disabled={isSyncingSheets}
                          className="px-3.5 py-1.5 rounded-lg border border-[#D4AF37]/40 bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs shrink-0 disabled:opacity-50"
                        >
                          {isSyncingSheets ? 'Menyinkronkan...' : 'Tarik Data'}
                        </button>
                      </div>

                      {/* Reset Seed Default */}
                      {!isPanitia && (
                        <div className="py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                              <RotateCcw className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="font-bold text-stone-900">
                                Reset ke Data Awal (Seed Default)
                              </p>
                              <p className="text-xs text-stone-500">
                                Kembalikan pengaturan ke kondisi awal sistem
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={async () => {
                              await onResetDefault();
                              showToast('Data dikembalikan ke seed awal Database Lokal.');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shrink-0"
                          >
                            Reset Default
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* =======================================================================
          MODAL 1: TAMBAH / EDIT TUGAS CHECKLIST
         ======================================================================= */}
      {editingTask && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#D4AF37]/40 overflow-hidden text-xs sm:text-sm">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">
                {editingTask.id ? 'Edit Tugas Kesiapan' : 'Tambahkan Tugas Kesiapan'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingTask(null)}
                className="w-9 h-9 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <p className="text-xs text-stone-500">* Wajib diisi</p>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Judul Tugas Kesiapan*
                </label>
                <input
                  type="text"
                  value={editingTask.title || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, title: e.target.value })
                  }
                  placeholder="Misal: Pelunasan Katering / Gladi Bersih Pemberkatan"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-[#B68D40] focus:outline-none text-stone-900"
                />
              </div>

              {/* Suggestion Pill Box */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-xs text-stone-800">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs transition-all"
                    >
                      <span>{sug.title}</span>
                      <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
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
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 bg-white"
                  >
                    {TASK_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-stone-700 mb-1">
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
                    className="w-full px-3 py-2.5 rounded-lg border border-stone-300 bg-white"
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
                  <label className="block font-medium text-stone-700 mb-1">Tenggat Waktu</label>
                  <input
                    type="date"
                    value={editingTask.due || '2026-12-01'}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, due: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Prioritas</label>
                  <select
                    value={editingTask.priority || 'Tinggi'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        priority: e.target.value as TaskPriority,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">PIC / Penanggung Jawab</label>
                  <select
                    value={editingTask.owner || 'Bersama'}
                    onChange={(e) =>
                      setEditingTask({
                        ...editingTask,
                        owner: e.target.value as TaskOwner,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
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
                <label className="block font-medium text-stone-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  value={editingTask.notes || ''}
                  onChange={(e) =>
                    setEditingTask({ ...editingTask, notes: e.target.value })
                  }
                  placeholder="Catatan detail berkas atau koordinasi..."
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-end gap-2">
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
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 2: TAMBAH / EDIT VENDOR & REVISI ANGGARAN
         ======================================================================= */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#D4AF37]/40 overflow-hidden text-xs sm:text-sm">
            <div className="px-6 py-4 border-b border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">
                {editingBudget.id
                  ? 'Edit & Revisi Anggaran Vendor'
                  : 'Tambahkan Pos Anggaran / Vendor'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingBudget(null)}
                className="w-9 h-9 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <p className="text-xs text-stone-500">* Wajib diisi</p>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Nama Kebutuhan / Paket Vendor*
                </label>
                <input
                  type="text"
                  value={editingBudget.itemName || ''}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, itemName: e.target.value })
                  }
                  placeholder="Misal: Katering Resepsi Utama 500 Pax"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-[#B68D40] focus:outline-none"
                />
              </div>

              {/* Quick Suggestions Box */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                <p className="font-bold text-xs text-stone-800">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs transition-all"
                    >
                      <span>{sug.itemName}</span>
                      <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Kategori*</label>
                  <select
                    value={editingBudget.category || 'Katering & Jamuan'}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        category: e.target.value as VendorCategory,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    {VENDOR_CATEGORIES.map((vc) => (
                      <option key={vc} value={vc}>
                        {vc}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Nama Vendor</label>
                  <input
                    type="text"
                    value={editingBudget.vendorName || ''}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, vendorName: e.target.value })
                    }
                    placeholder="Misal: PT Katering Nusantara"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Estimasi Awal (Rp)*</label>
                  <input
                    type="number"
                    value={editingBudget.estimatedCost ?? 0}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        estimatedCost: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
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
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Sudah Dibayar (Rp)</label>
                  <input
                    type="number"
                    value={editingBudget.paidAmount ?? 0}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        paidAmount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Status Pembayaran</label>
                  <select
                    value={editingBudget.paymentStatus || 'BELUM_DP'}
                    onChange={(e) =>
                      setEditingBudget({
                        ...editingBudget,
                        paymentStatus: e.target.value as VendorPaymentStatus,
                      })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="BELUM_DP">BELUM DP</option>
                    <option value="DP_TERBAYAR">DP TERBAYAR</option>
                    <option value="CICILAN">CICILAN</option>
                    <option value="LUNAS">LUNAS</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={editingBudget.dueDate || '2026-12-01'}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, dueDate: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Kontak Vendor</label>
                  <input
                    type="text"
                    value={editingBudget.vendorContact || ''}
                    onChange={(e) =>
                      setEditingBudget({ ...editingBudget, vendorContact: e.target.value })
                    }
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Catatan Revisi Anggaran (Alasan Perubahan)
                </label>
                <input
                  type="text"
                  value={editingBudget.revisionNote || ''}
                  onChange={(e) =>
                    setEditingBudget({ ...editingBudget, revisionNote: e.target.value })
                  }
                  placeholder="Misal: Penambahan 100 porsi pondokan / diskon vendor"
                  className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                />
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-end gap-2">
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
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================================
          MODAL 3: TAMBAH / EDIT TAMU UNDANGAN
         ======================================================================= */}
      {editingGuest && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#D4AF37]/40 overflow-hidden text-xs sm:text-sm">
            <div className="px-6 py-4 border-b border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">
                {editingGuest.id ? 'Edit Data Tamu Undangan' : 'Tambahkan Tamu Undangan'}
              </h3>
              <button
                type="button"
                onClick={() => setEditingGuest(null)}
                className="w-9 h-9 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
              <p className="text-xs text-stone-500">* Wajib diisi</p>

              <div>
                <label className="block font-medium text-stone-700 mb-1">
                  Nama Lengkap &amp; Gelar / Pangkat*
                </label>
                <input
                  type="text"
                  value={editingGuest.guestName || ''}
                  onChange={(e) =>
                    setEditingGuest({ ...editingGuest, guestName: e.target.value })
                  }
                  placeholder="Contoh: Bpk. Ir. Budi Santoso & Ibu"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 focus:border-[#B68D40] focus:outline-none font-semibold"
                />
              </div>

              {/* Quick Preset Chips for Guest Category & Priority */}
              <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                <p className="font-bold text-xs text-stone-800">
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
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs transition-all"
                    >
                      <span>{preset.label}</span>
                      <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    Jabatan / Instansi / Satker
                  </label>
                  <input
                    type="text"
                    value={editingGuest.institution || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, institution: e.target.value })
                    }
                    placeholder="Misal: Bareskrim Polri / Keluarga Besar"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
                    No. WhatsApp / Kontak
                  </label>
                  <input
                    type="text"
                    value={editingGuest.phone || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, phone: e.target.value })
                    }
                    placeholder="0812xxxx"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Kategori*</label>
                  <select
                    value={editingGuest.guestType || 'Pejabat/VIP'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        guestType: e.target.value as GuestType,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Pejabat/VIP">Pejabat/VIP</option>
                    <option value="Keluarga">Keluarga</option>
                    <option value="Rekan Kerja/Polri">Rekan Kerja/Polri</option>
                    <option value="Teman/Sahabat">Teman/Sahabat</option>
                    <option value="Tetangga/Gereja">Tetangga/Gereja</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Prioritas</label>
                  <select
                    value={editingGuest.priority || 'P1 - VIP'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        priority: e.target.value as GuestPriority,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="P1 - VIP">P1 - VIP</option>
                    <option value="P2 - Utama">P2 - Utama</option>
                    <option value="P3 - Reguler">P3 - Reguler</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Pihak Pengundang</label>
                  <select
                    value={editingGuest.side || 'Mempelai Pria'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        side: e.target.value as GuestSide,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Mempelai Pria">Mempelai Pria</option>
                    <option value="Mempelai Wanita">Mempelai Wanita</option>
                    <option value="Bersama">Bersama</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Format Undangan</label>
                  <select
                    value={editingGuest.invitationFormat || 'Cetak Tebal'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        invitationFormat: e.target.value as InvitationFormat,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Cetak Tebal">Cetak Tebal</option>
                    <option value="Cetak Reguler">Cetak Reguler</option>
                    <option value="Digital WA">Digital WA</option>
                    <option value="Cetak & Digital">Cetak &amp; Digital</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Kuota Pax</label>
                  <input
                    type="number"
                    value={editingGuest.pax ?? 2}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, pax: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">Status RSVP</label>
                  <select
                    value={editingGuest.rsvpStatus || 'Belum Konfirmasi'}
                    onChange={(e) =>
                      setEditingGuest({
                        ...editingGuest,
                        rsvpStatus: e.target.value as RsvpStatus,
                      })
                    }
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
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
                  <label className="block font-medium text-stone-700 mb-1">
                    Alamat / Ruangan
                  </label>
                  <input
                    type="text"
                    value={editingGuest.address || ''}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, address: e.target.value })
                    }
                    placeholder="Alamat pengiriman undangan cetak"
                    className="w-full px-3 py-2 rounded-lg border border-stone-300"
                  />
                </div>
                <div>
                  <label className="block font-medium text-stone-700 mb-1">
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
                    className="w-full px-2.5 py-2 rounded-lg border border-stone-300 bg-white"
                  >
                    <option value="Belum Disiapkan">Belum Disiapkan</option>
                    <option value="Siap Kirim">Siap Kirim</option>
                    <option value="Sudah Dikirim">Sudah Dikirim</option>
                    <option value="Sudah Diterima">Sudah Diterima</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-end gap-2">
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
                className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          {(() => {
            const generated = generateWhatsAppMessage(waPreviewGuest, state.settings);
            return (
              <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#D4AF37]/40 overflow-hidden text-xs sm:text-sm">
                <div className="px-6 py-4 border-b border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-stone-900">
                      Bagikan Undangan WhatsApp
                    </h3>
                    <p className="text-xs text-stone-500">{waPreviewGuest.guestName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setWaPreviewGuest(null)}
                    className="w-9 h-9 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-1">
                    <p className="text-[11px] font-bold text-stone-700">
                      Link Undangan Khusus Tamu Ini:
                    </p>
                    <p className="font-mono text-xs text-[#8B6914] font-semibold break-all">
                      {generated.inviteUrl}
                    </p>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Preview Pesan Pengantar WhatsApp:
                    </label>
                    <textarea
                      readOnly
                      rows={9}
                      value={generated.messageText}
                      className="w-full p-3.5 rounded-xl border border-stone-300 bg-[#FAF8F5] font-sans text-xs leading-relaxed"
                    />
                  </div>
                </div>

                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generated.messageText);
                      showToast('Seluruh teks undangan WA berhasil disalin!');
                    }}
                    className="px-4 py-2 rounded-full border border-[#D4AF37]/45 bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] font-bold text-xs flex items-center gap-1.5"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Salin Teks
                  </button>
                  <a
                    href={generated.waHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs"
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
          MODAL 5: POPUP PENGATURAN UNDANGAN, AKUN & PAGU BUDGET
         ======================================================================= */}
      {activeSettingsModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#D4AF37]/40 overflow-hidden text-xs sm:text-sm">
            {/* Header */}
            <div className="px-6 py-4 border-b border-[#D4AF37]/25 bg-[#FAF8F5] flex items-center justify-between">
              <h3 className="text-lg font-bold text-stone-900">
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
                className="w-9 h-9 rounded-full hover:bg-[#FAF3E3] flex items-center justify-center text-stone-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 1. MODAL: BACKGROUND & TRANSPARANSI */}
            {activeSettingsModal === 'background' && (
              <form onSubmit={handleSaveSettingsModal}>
                <div className="p-6 space-y-4 max-h-[78vh] overflow-y-auto">
                  <p className="text-xs text-stone-500">
                    * Gunakan URL gambar dari mana saja atau klik saran tema di bawah
                  </p>

                  {/* Suggestion Box for Background Presets */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                    <p className="font-bold text-xs text-stone-800">
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs transition-all"
                        >
                          <span>{preset.label}</span>
                          <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      URL Background Sampul Pembuka (Cover)*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.coverBgUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, coverBgUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      URL Banner Utama / Foto Siluet Prewedding*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.heroPrewedUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, heroPrewedUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      URL Wallpaper Halaman Undangan*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.pageBgUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, pageBgUrl: e.target.value })
                      }
                      placeholder="https://images.unsplash.com/..."
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="font-medium text-stone-700">
                          Kecerahan Transparan (Veil)
                        </label>
                        <span className="font-mono font-bold text-[#8B6914]">
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
                    </div>

                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
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
                        className="w-full px-3 py-2 rounded-lg border border-stone-300 bg-white"
                      >
                        <option value="none">Tanpa Blur (Foto Tajam)</option>
                        <option value="sm">Blur Halus (Rekomendasi)</option>
                        <option value="md">Blur Sedang</option>
                        <option value="lg">Blur Kuat</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">
                    Centang seksi yang ingin ditampilkan pada undangan digital tamu:
                  </p>
                  <div className="divide-y divide-stone-200 border border-[#D4AF37]/30 rounded-xl overflow-hidden">
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
                          className="px-4 py-3 flex items-center justify-between gap-3 bg-white hover:bg-[#FAF8F5] cursor-pointer"
                        >
                          <span className="font-semibold text-stone-800">{item.label}</span>
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
                        </label>
                      );
                    })}
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Subjudul Ringkas (Tampil di Header &amp; Sampul)*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.subtitle || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, subtitle: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                        <p className="text-xs text-stone-500">* Wajib diisi</p>
                        <label className="inline-flex items-center gap-2 text-xs font-bold text-stone-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={settingsForm[showKey] !== false}
                            onChange={(e) =>
                              setSettingsForm({
                                ...settingsForm,
                                [showKey]: e.target.checked,
                              })
                            }
                            className="w-4 h-4 accent-[#B68D40] rounded"
                          />
                          Tampilkan Acara Ini di Undangan
                        </label>
                      </div>

                      {/* Quick Suggestions for Event Titles */}
                      <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2">
                        <p className="font-bold text-xs text-stone-800">
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
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs"
                            >
                              <span>{t}</span>
                              <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-stone-700 mb-1">
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
                            className="w-full px-3 py-2 rounded-lg border border-stone-300 font-semibold"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-stone-700 mb-1">
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
                            className="w-full px-3 py-2 rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-stone-700 mb-1">
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
                            className="w-full px-3 py-2 rounded-lg border border-stone-300"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-stone-700 mb-1">
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
                            className="w-full px-3 py-2 rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium text-stone-700 mb-1">
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
                          className="w-full px-3 py-2 rounded-lg border border-stone-300"
                        />
                      </div>

                      <div>
                        <label className="block font-medium text-stone-700 mb-1">
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
                          className="w-full px-3 py-2 rounded-lg border border-stone-300"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block font-medium text-stone-700 mb-1">
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
                            className="w-full px-3 py-2 rounded-lg border border-stone-300"
                          />
                        </div>
                        <div>
                          <label className="block font-medium text-stone-700 mb-1">
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
                            className="w-full px-3 py-2 rounded-lg border border-stone-300"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })()}
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Nama Lengkap &amp; Gelar Mempelai Pria*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.groomFullName || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, groomFullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Nama Panggilan*
                      </label>
                      <input
                        type="text"
                        value={settingsForm.groomNickname || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomNickname: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
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
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Instansi / Profesi
                      </label>
                      <input
                        type="text"
                        value={settingsForm.groomUnit || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomUnit: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">Kota Asal</label>
                      <input
                        type="text"
                        value={settingsForm.groomOrigin || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, groomOrigin: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Keterangan Orang Tua Mempelai Pria*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.groomParents || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, groomParents: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      URL Foto Mempelai Pria
                    </label>
                    <input
                      type="text"
                      value={settingsForm.groomPhotoUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, groomPhotoUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Nama Lengkap &amp; Gelar Mempelai Wanita*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brideFullName || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brideFullName: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-semibold"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Nama Panggilan*
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brideNickname || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brideNickname: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Gelar / Label
                      </label>
                      <input
                        type="text"
                        value={settingsForm.brideTitle || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, brideTitle: e.target.value })
                        }
                        className="w-full px-3 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">Kota Asal</label>
                    <input
                      type="text"
                      value={settingsForm.brideOrigin || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brideOrigin: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Keterangan Orang Tua Mempelai Wanita*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.brideParents || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, brideParents: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      URL Foto Mempelai Wanita
                    </label>
                    <input
                      type="text"
                      value={settingsForm.bridePhotoUrl || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, bridePhotoUrl: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                    <p className="font-bold text-xs text-stone-800">
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs transition-all"
                        >
                          <span>{q.source}</span>
                          <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Sumber Ayat / Kutipan*
                    </label>
                    <input
                      type="text"
                      value={settingsForm.quoteSource || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, quoteSource: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Isi Kutipan Ayat Pernikahan*
                    </label>
                    <textarea
                      rows={3}
                      value={settingsForm.quoteVerse || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, quoteVerse: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">* Wajib diisi</p>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                    <p className="font-bold text-xs text-stone-800">
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs"
                        >
                          <span>{b.name}</span>
                          <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Atas Nama Pemilik Rekening*
                    </label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountHolder}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, accountHolder: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Keterangan / Cabang
                    </label>
                    <input
                      type="text"
                      value={bankForm.branchOrNote}
                      onChange={(e) =>
                        setBankForm({ ...bankForm, branchOrNote: e.target.value })
                      }
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">* Wajib diisi</p>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">* Wajib diisi</p>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                    <p className="font-bold text-xs text-stone-800">
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs"
                        >
                          <span>{opt.label}</span>
                          <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
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
                      className="w-full px-3.5 py-2.5 rounded-lg border border-stone-300 font-mono font-bold text-base"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all"
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
                  <p className="text-xs text-stone-500">
                    * Perubahan username/password akun utama wajib konfirmasi pemilik aplikasi
                  </p>

                  {/* Pilih Akun Utama */}
                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2">
                    <p className="font-bold text-xs text-stone-800">
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
                              ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white border-[#B68D40]'
                              : 'bg-white hover:bg-[#FAF3E3] border-[#D4AF37]/40 text-[#8B6914]'
                          }`}
                        >
                          <span>@{u.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Username Baru*
                      </label>
                      <input
                        type="text"
                        required
                        value={secUsername}
                        onChange={(e) => setSecUsername(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Nama Tampilan Akun*
                      </label>
                      <input
                        type="text"
                        required
                        value={secName}
                        onChange={(e) => setSecName(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-stone-700 mb-1">
                      Password Baru (Kosongkan jika hanya mengubah nama/username)
                    </label>
                    <input
                      type="password"
                      value={secNewPassword}
                      onChange={(e) => setSecNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-[#8B6914] mb-1">
                      Identitas Konfirmasi Superadmin (Pemilik Aplikasi)*
                    </label>
                    <input
                      type="password"
                      required
                      value={secSuperadminConfirm}
                      onChange={(e) => setSecSuperadminConfirm(e.target.value)}
                      placeholder="Masukkan identitas superadmin pemilik aplikasi"
                      className="w-full px-3.5 py-2 rounded-lg border border-[#D4AF37] bg-[#FAF3E3]/50 font-mono"
                    />
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingSecurity}
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50"
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
                  <p className="text-xs text-stone-500">
                    * Akun panitia dapat mengelola Checklist, Tamu &amp; Undangan, namun terkunci dari menu Anggaran (Budgeting).
                  </p>

                  <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#D4AF37]/30 space-y-2.5">
                    <p className="font-bold text-xs text-stone-800">
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
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] font-semibold text-xs"
                        >
                          <span>{role.n}</span>
                          <Plus className="w-3.5 h-3.5 text-[#8B6914]" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Username Login Panitia*
                      </label>
                      <input
                        type="text"
                        required
                        value={panitiaUsername}
                        onChange={(e) => setPanitiaUsername(e.target.value)}
                        placeholder="Contoh: panitia_wo"
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Nama Lengkap / Tim*
                      </label>
                      <input
                        type="text"
                        required
                        value={panitiaNama}
                        onChange={(e) => setPanitiaNama(e.target.value)}
                        placeholder="Contoh: Koordinator WO"
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Jabatan Kepanitiaan
                      </label>
                      <input
                        type="text"
                        value={panitiaJabatan}
                        onChange={(e) => setPanitiaJabatan(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300"
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-stone-700 mb-1">
                        Password Login Panitia {panitiaEditId ? '(Opsional)' : '*'}
                      </label>
                      <input
                        type="password"
                        required={!panitiaEditId}
                        value={panitiaPassword}
                        onChange={(e) => setPanitiaPassword(e.target.value)}
                        placeholder="Minimal 6 karakter"
                        className="w-full px-3.5 py-2 rounded-lg border border-stone-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
                <div className="px-6 py-3.5 border-t border-[#D4AF37]/25 bg-[#FAF8F5] flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingPanitia}
                    className="px-6 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-sm shadow-xs transition-all disabled:opacity-50"
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

