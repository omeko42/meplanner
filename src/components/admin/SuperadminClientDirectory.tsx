'use client';

import React, { useState } from 'react';
import {
  ArrowRightLeft,
  LayoutGrid,
  Plus,
  Search,
  ShieldCheck,
  Table,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { InfoTooltip } from '@/components/InfoTooltip';
import { FilterPopover } from '@/components/ui/FilterPopover';
import type { AdminUser, ClientGroupItem } from '@/types';

export interface SuperadminClientDirectoryProps {
  clientGroups: ClientGroupItem[];
  defaultSystemUsers: AdminUser[];
  panitiaUsers: AdminUser[];
  activeWorkspaceClientId?: string;
  selectedClientGroupFilter: string;
  onSelectClientGroupFilter: (id: string) => void;
  onOpenAddClientModal: () => void;
  onSwitchWorkspaceClient?: (clientId: string) => void;
  onSelectDefaultUserForEdit: (user: AdminUser) => void;
  onOpenAddPanitiaForClient: (cg: ClientGroupItem) => void;
  onOpenSecurityForClient: (clientId: string) => void;
  onDeleteClientGroup: (cg: ClientGroupItem) => void;
  onToast: (message: string) => void;
}

export const SuperadminClientDirectory: React.FC<SuperadminClientDirectoryProps> = ({
  clientGroups,
  defaultSystemUsers,
  panitiaUsers,
  activeWorkspaceClientId,
  selectedClientGroupFilter,
  onSelectClientGroupFilter,
  onOpenAddClientModal,
  onSwitchWorkspaceClient,
  onSelectDefaultUserForEdit,
  onOpenAddPanitiaForClient,
  onOpenSecurityForClient,
  onDeleteClientGroup,
  onToast,
}) => {
  const [clientSearchTerm, setClientSearchTerm] = useState('');
  const [clientTierFilter, setClientTierFilter] = useState<'ALL' | string>('ALL');
  const [clientListViewMode, setClientListViewMode] = useState<'TABLE' | 'GRID'>('TABLE');
  const [expandedClientAccountIds, setExpandedClientAccountIds] = useState<Record<string, boolean>>({});

  const filteredClients = clientGroups.filter((cg) => {
    const matchesGroup =
      selectedClientGroupFilter === 'ALL' || cg.id === selectedClientGroupFilter;
    if (!matchesGroup) return false;
    if (clientTierFilter !== 'ALL' && cg.packageTier !== clientTierFilter) return false;
    if (clientSearchTerm.trim()) {
      const q = clientSearchTerm.trim().toLowerCase();
      const haystack = [
        cg.clientName,
        cg.clientCode,
        cg.coupleLabel,
        cg.eventDate,
        cg.notes,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#FAF3E3] border border-[#D4AF37]/40 text-[#8B6914] flex items-center justify-center shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-sm sm:text-base font-extrabold text-stone-900">
              Daftar Klien ({clientGroups.length})
            </h3>
            <InfoTooltip text="Kelola seluruh ruang kerja klien, tambah klien baru, serta atur 4 akun inti dan akun Panitia/WO." />
          </div>
        </div>
        <button
          type="button"
          onClick={onOpenAddClientModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#C5A059] to-[#B68D40] hover:from-[#B68D40] hover:to-[#9A742B] text-white font-bold text-xs shadow-xs shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Klien Baru</span>
        </button>
      </div>

      <div className="p-3 rounded-2xl bg-[#FAF8F5] border border-[#D4AF37]/35 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => onSelectClientGroupFilter('ALL')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedClientGroupFilter === 'ALL'
                  ? 'bg-stone-900 text-[#FAF3E3] shadow-2xs'
                  : 'bg-white border border-stone-200 text-stone-600 hover:border-[#D4AF37]/50'
              }`}
            >
              Semua ({clientGroups.length})
            </button>
            {clientGroups.map((cg) => {
              const countDefault = defaultSystemUsers.filter(
                (u) => (u.clientId || 'client-utama') === cg.id
              ).length;
              const isSelected = selectedClientGroupFilter === cg.id;
              return (
                <button
                  key={cg.id}
                  type="button"
                  onClick={() => onSelectClientGroupFilter(cg.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-r from-[#C5A059] to-[#B68D40] text-white shadow-2xs'
                      : 'bg-white border border-[#D4AF37]/35 text-[#8B6914] hover:bg-[#FAF3E3]'
                  }`}
                >
                  <span>{(cg.coupleLabel || cg.clientName || '').replace(/â€¢/g, '•')}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                      isSelected ? 'bg-white/25 text-white' : 'bg-[#FAF3E3] text-[#8B6914]'
                    }`}
                  >
                    {countDefault} Akun
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-stone-200 shrink-0 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => setClientListViewMode('TABLE')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                clientListViewMode === 'TABLE'
                  ? 'bg-stone-900 text-[#FAF3E3] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Table className="w-3 h-3" />
              <span>Tabel</span>
            </button>
            <button
              type="button"
              onClick={() => setClientListViewMode('GRID')}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                clientListViewMode === 'GRID'
                  ? 'bg-stone-900 text-[#FAF3E3] shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <LayoutGrid className="w-3 h-3" />
              <span>Kartu</span>
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={clientSearchTerm}
              onChange={(e) => setClientSearchTerm(e.target.value)}
              placeholder="Cari nama klien, kode, atau pasangan..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-medium placeholder:text-stone-400 focus:outline-none focus:border-[#D4AF37]"
            />
            {clientSearchTerm && (
              <button
                type="button"
                onClick={() => setClientSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <FilterPopover
            align="right"
            groups={[
              {
                id: 'tier',
                label: 'Paket Klien',
                value: clientTierFilter,
                onChange: setClientTierFilter,
                options: [
                  { value: 'ALL', label: 'Semua Paket', count: clientGroups.length },
                  {
                    value: 'ROYAL_VIP',
                    label: 'Enterprise / Mitra',
                    count: clientGroups.filter((c) => c.packageTier === 'ROYAL_VIP').length,
                  },
                  {
                    value: 'EXCLUSIVE',
                    label: 'Business',
                    count: clientGroups.filter((c) => c.packageTier === 'EXCLUSIVE').length,
                  },
                  {
                    value: 'STARTER',
                    label: 'Gratis / Premium',
                    count: clientGroups.filter((c) => c.packageTier === 'STARTER').length,
                  },
                ],
              },
            ]}
          />
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="p-8 rounded-2xl bg-white border border-stone-200 text-center space-y-2">
          <Users className="w-8 h-8 text-stone-300 mx-auto" />
          <p className="font-bold text-stone-700 text-xs">
            Tidak ada klien yang cocok dengan filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setClientSearchTerm('');
              setClientTierFilter('ALL');
              onSelectClientGroupFilter('ALL');
            }}
            className="px-3 py-1 rounded-lg bg-[#FAF3E3] text-[#8B6914] text-xs font-bold"
          >
            Reset Filter
          </button>
        </div>
      ) : clientListViewMode === 'TABLE' ? (
        <div className="rounded-2xl border border-stone-200 bg-white overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 bg-[#FAF8F5] text-[10px] font-extrabold text-stone-500 uppercase tracking-wider">
                  <th className="py-2.5 px-3.5">Klien &amp; Kode</th>
                  <th className="py-2.5 px-3">Paket &amp; Tanggal</th>
                  <th className="py-2.5 px-3">Akun &amp; Tim</th>
                  <th className="py-2.5 px-3">Ruang Kerja</th>
                  <th className="py-2.5 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredClients.map((cg) => {
                  const groupDefaultUsers = defaultSystemUsers.filter(
                    (u) => (u.clientId || 'client-utama') === cg.id
                  );
                  const groupPanitiaUsers = panitiaUsers.filter(
                    (u) => (u.clientId || 'client-utama') === cg.id
                  );
                  const isExpanded = Boolean(expandedClientAccountIds[cg.id]);
                  const isCurrentActive = activeWorkspaceClientId === cg.id;

                  return (
                    <React.Fragment key={cg.id}>
                      <tr
                        className={`hover:bg-[#FAF8F5]/80 transition-colors ${
                          isCurrentActive ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-3 px-3.5">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-md bg-stone-900 text-[#D4AF37] font-mono text-[9px] font-extrabold shrink-0">
                              {cg.clientCode}
                            </span>
                            <div className="min-w-0">
                              <p className="font-extrabold text-stone-900 text-xs truncate">
                                {cg.clientName}
                              </p>
                              <p className="text-[10px] text-stone-500 truncate max-w-[12rem]">
                                {cg.notes || 'Paket Komersial MEPlanner'}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="space-y-0.5">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                              {cg.packageTier}
                            </span>
                            <p className="text-[10px] text-stone-500 font-mono">
                              {cg.eventDate || '2026-12-19'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-stone-700">
                              {groupDefaultUsers.length} Inti
                            </span>
                            <span className="text-stone-300">&bull;</span>
                            <span className="text-[11px] font-bold text-[#8B6914]">
                              {groupPanitiaUsers.length} Panitia
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedClientAccountIds((prev) => ({
                                  ...prev,
                                  [cg.id]: !prev[cg.id],
                                }))
                              }
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition-all cursor-pointer ${
                                isExpanded
                                  ? 'bg-[#FAF3E3] text-[#8B6914] border-[#D4AF37]'
                                  : 'bg-white text-stone-600 border-stone-200 hover:border-[#D4AF37]/50'
                              }`}
                            >
                              {isExpanded ? 'Tutup ▲' : 'Lihat Akun ▼'}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          {isCurrentActive ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold shadow-2xs">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                              Sedang Dibuka
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                onSwitchWorkspaceClient?.(cg.id);
                                onToast(
                                  `✓ Beralih ke Ruang Kerja: ${cg.coupleLabel || cg.clientName}`
                                );
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-[#D4AF37] text-[10px] font-extrabold transition-all cursor-pointer"
                            >
                              <span>Buka Workspace</span>
                              <ArrowRightLeft className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onOpenAddPanitiaForClient(cg)}
                              className="px-2 py-1 rounded-lg bg-[#FAF3E3] hover:bg-[#F3E5C8] text-[#8B6914] border border-[#D4AF37]/40 text-[10px] font-bold"
                            >
                              + Panitia
                            </button>
                            <button
                              type="button"
                              onClick={() => onOpenSecurityForClient(cg.id)}
                              className="px-2 py-1 rounded-lg bg-white hover:bg-stone-100 text-stone-700 border border-stone-200 text-[10px] font-bold"
                            >
                              Atur Akun &rarr;
                            </button>
                            {cg.id !== 'client-utama' && cg.id !== 'client-demo' && (
                              <button
                                type="button"
                                onClick={() => onDeleteClientGroup(cg)}
                                className="p-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200"
                                title="Hapus Klien"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#FAF8F5]/90 border-b border-stone-200">
                          <td colSpan={5} className="p-3 sm:p-4">
                            <div className="rounded-xl bg-white p-3 border border-[#D4AF37]/30 space-y-2">
                              <div className="flex items-center justify-between text-[11px] font-bold text-stone-700">
                                <span>Akun Inti Klien ({groupDefaultUsers.length}):</span>
                                <span className="text-[10px] text-stone-500 font-normal">
                                  Klik Edit untuk mengganti nama, username, atau kata sandi.
                                </span>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                {groupDefaultUsers.map((u) => (
                                  <div
                                    key={u.id}
                                    className="p-2 rounded-lg bg-[#FAF8F5] border border-stone-200 flex items-center justify-between gap-1.5"
                                  >
                                    <div className="min-w-0">
                                      <p className="text-[11px] font-bold text-stone-900 truncate">
                                        {u.nama}
                                      </p>
                                      <p className="text-[9px] font-mono text-[#8B6914] truncate">
                                        @{u.username}
                                      </p>
                                    </div>
                                    <button
                                      type="button"
                                      onClick={() => onSelectDefaultUserForEdit(u)}
                                      className="px-1.5 py-0.5 rounded bg-white hover:bg-[#FAF3E3] text-[#8B6914] border border-[#D4AF37]/35 text-[9px] font-bold shrink-0"
                                    >
                                      Edit
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredClients.map((cg) => {
            const groupDefaultUsers = defaultSystemUsers.filter(
              (u) => (u.clientId || 'client-utama') === cg.id
            );
            const groupPanitiaUsers = panitiaUsers.filter(
              (u) => (u.clientId || 'client-utama') === cg.id
            );
            const isExpanded = Boolean(expandedClientAccountIds[cg.id]);
            const isCurrentActive = activeWorkspaceClientId === cg.id;

            return (
              <div
                key={cg.id}
                className={`rounded-2xl border transition-all bg-white overflow-hidden flex flex-col justify-between ${
                  isCurrentActive
                    ? 'border-emerald-500/60 shadow-xs ring-1 ring-emerald-400/30'
                    : 'border-stone-200 hover:border-[#D4AF37]/50'
                }`}
              >
                <div>
                  <div className="px-3.5 py-2.5 bg-[#FAF8F5] border-b border-stone-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="px-1.5 py-0.5 rounded bg-stone-900 text-[#D4AF37] font-mono text-[9px] font-extrabold shrink-0">
                        {cg.clientCode}
                      </span>
                      <h4 className="font-extrabold text-stone-900 text-xs truncate">
                        {cg.clientName}
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-bold shrink-0">
                      {cg.packageTier}
                    </span>
                  </div>

                  <div className="p-3 space-y-2">
                    <p className="text-[11px] text-stone-500 truncate">
                      {cg.notes || 'Paket Komersial MEPlanner'} &bull;{' '}
                      {cg.eventDate || '2026-12-19'}
                    </p>
                    <div className="flex items-center justify-between text-[11px] font-bold text-stone-600 pt-1 border-t border-stone-100">
                      <span>
                        {groupDefaultUsers.length} Akun Inti &bull; {groupPanitiaUsers.length}{' '}
                        Panitia
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedClientAccountIds((prev) => ({
                            ...prev,
                            [cg.id]: !prev[cg.id],
                          }))
                        }
                        className="text-[10px] font-bold text-[#8B6914] hover:underline cursor-pointer"
                      >
                        {isExpanded ? 'Tutup ▲' : 'Lihat Akun ▼'}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        {groupDefaultUsers.map((u) => (
                          <div
                            key={u.id}
                            className="p-1.5 rounded-lg bg-[#FAF8F5] border border-stone-200 flex items-center justify-between gap-1 text-[10px]"
                          >
                            <span className="font-mono text-[#8B6914] truncate">
                              @{u.username}
                            </span>
                            <button
                              type="button"
                              onClick={() => onSelectDefaultUserForEdit(u)}
                              className="px-1 py-0.5 rounded bg-white text-[#8B6914] text-[9px] font-bold border border-stone-200"
                            >
                              Edit
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="px-3.5 py-2 bg-stone-50 border-t border-stone-100 flex items-center justify-between gap-2">
                  {isCurrentActive ? (
                    <span className="text-[10px] font-extrabold text-emerald-700 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Sedang Dibuka
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onSwitchWorkspaceClient?.(cg.id);
                        onToast(`✓ Beralih ke Ruang Kerja: ${cg.coupleLabel || cg.clientName}`);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-stone-900 text-[#D4AF37] text-[10px] font-extrabold hover:bg-stone-800"
                    >
                      Buka Klien
                    </button>
                  )}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => onOpenAddPanitiaForClient(cg)}
                      className="px-2 py-0.5 rounded bg-white text-stone-700 text-[10px] font-bold border border-stone-200"
                    >
                      + Panitia
                    </button>
                    {cg.id !== 'client-utama' && cg.id !== 'client-demo' && (
                      <button
                        type="button"
                        onClick={() => onDeleteClientGroup(cg)}
                        className="p-1 rounded bg-rose-50 text-rose-600 border border-rose-200"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
