'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Clock,
  Search,
  X,
} from 'lucide-react';
import type { ClientGroupItem } from '@/types';

const RECENT_WS_STORAGE_KEY = 'meplan_recent_workspaces_v1';
const INITIAL_VISIBLE_LIMIT = 25;

function loadRecentWorkspaceIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECENT_WS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

function recordRecentWorkspaceId(id: string): string[] {
  const prev = loadRecentWorkspaceIds().filter((x) => x !== id);
  const next = [id, ...prev].slice(0, 5);
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(RECENT_WS_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore quota errors
    }
  }
  return next;
}

function formatTierLabel(tier?: string): string {
  const t = String(tier || '').toUpperCase();
  if (t === 'ROYAL_VIP') return 'Enterprise';
  if (t === 'EXCLUSIVE') return 'Business';
  if (t === 'STARTER') return 'Starter';
  return t || 'Aktif';
}

export interface WorkspaceSwitcherPopoverProps {
  clients: ClientGroupItem[];
  activeClientId: string;
  onSelectClient: (clientId: string) => void;
  /** Optional button at bottom of popover to open the full Superadmin Client Directory */
  onOpenDirectory?: () => void;
  /** 'sidebar' for the Settings sidebar card; 'field' for form pickers inside modals */
  variant?: 'sidebar' | 'field';
  /** Enable Ctrl+K / Cmd+K global quick switcher (enable only on sidebar instance) */
  enableShortcut?: boolean;
  label?: string;
}

/**
 * Scalable workspace command-switcher built for 1,000–10,000+ clients:
 * - Instant search by couple name, client name, code, notes, or event date
 * - Tier filter tabs inside popover
 * - Pinned "Terakhir Dibuka" recent clients
 * - Windowed rendering (max 25 DOM items at a time + "Muat lagi") so 10,000 clients stay 60fps
 * - Keyboard navigation (↑ / ↓ / Enter / Esc, plus Ctrl+K shortcut)
 */
export function WorkspaceSwitcherPopover({
  clients,
  activeClientId,
  onSelectClient,
  onOpenDirectory,
  variant = 'sidebar',
  enableShortcut = false,
  label = 'Ruang Kerja Klien',
}: WorkspaceSwitcherPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<'ALL' | 'ROYAL_VIP' | 'EXCLUSIVE' | 'STARTER'>('ALL');
  const [visibleLimit, setVisibleLimit] = useState(INITIAL_VISIBLE_LIMIT);
  const [highlightedIdx, setHighlightedIdx] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([]);

  const rootRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setRecentIds(loadRecentWorkspaceIds());
  }, []);

  useEffect(() => {
    if (!enableShortcut) return;
    const onGlobalKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        const tag = (document.activeElement?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
        e.preventDefault();
        setIsOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onGlobalKey);
    return () => window.removeEventListener('keydown', onGlobalKey);
  }, [enableShortcut]);

  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setTierFilter('ALL');
      setVisibleLimit(INITIAL_VISIBLE_LIMIT);
      setHighlightedIdx(0);
      return;
    }
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 20);
    const onOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', onOutside);
    document.addEventListener('keydown', onEsc);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('mousedown', onOutside);
      document.removeEventListener('keydown', onEsc);
    };
  }, [isOpen]);

  const activeClient = useMemo(
    () =>
      clients.find((c) => c.id === activeClientId) ||
      clients[0] ||
      null,
    [clients, activeClientId]
  );

  const filteredClients = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((cg) => {
      if (tierFilter !== 'ALL' && cg.packageTier !== tierFilter) return false;
      if (!q) return true;
      return (
        (cg.coupleLabel || '').toLowerCase().includes(q) ||
        (cg.clientName || '').toLowerCase().includes(q) ||
        (cg.clientCode || '').toLowerCase().includes(q) ||
        (cg.notes || '').toLowerCase().includes(q) ||
        (cg.eventDate || '').toLowerCase().includes(q) ||
        cg.id.toLowerCase().includes(q)
      );
    });
  }, [clients, query, tierFilter]);

  const recentClients = useMemo(() => {
    if (query.trim() || tierFilter !== 'ALL' || clients.length <= 6) return [];
    const byId = new Map(clients.map((c) => [c.id, c]));
    return recentIds
      .map((id) => byId.get(id))
      .filter((c): c is ClientGroupItem => Boolean(c));
  }, [clients, recentIds, query, tierFilter]);

  const windowedClients = useMemo(
    () => filteredClients.slice(0, visibleLimit),
    [filteredClients, visibleLimit]
  );

  const handleChoose = (clientId: string) => {
    setRecentIds(recordRecentWorkspaceId(clientId));
    onSelectClient(clientId);
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIdx((idx) =>
        Math.min(idx + 1, Math.max(0, windowedClients.length - 1))
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIdx((idx) => Math.max(0, idx - 1));
    } else if (e.key === 'Enter' && windowedClients[highlightedIdx]) {
      e.preventDefault();
      handleChoose(windowedClients[highlightedIdx].id);
    }
  };

  const activeTitle =
    activeClient?.coupleLabel || activeClient?.clientName || 'Pilih Klien';
  const activeInitial = activeTitle.trim().charAt(0).toUpperCase() || 'K';

  return (
    <div ref={rootRef} className="relative w-full">
      {variant === 'sidebar' ? (
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className={`w-full rounded-2xl border p-3 text-left transition-all cursor-pointer ${
            isOpen
              ? 'bg-white border-[#C5A059] shadow-sm'
              : 'bg-white border-stone-200 hover:border-[#D4AF37]/70 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500 truncate">
              {label}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#FAF3E3] text-[#8B6914] text-[10px] font-bold whitespace-nowrap shrink-0">
              {clients.length.toLocaleString('id-ID')} Klien
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#C5A059] to-[#8B6914] text-white flex items-center justify-center font-bold text-xs shrink-0">
                {activeInitial}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-stone-900 truncate">
                  {activeTitle}
                </p>
                <p className="text-[10px] text-stone-500 truncate">
                  {activeClient?.clientCode || 'UTAMA'} &bull;{' '}
                  {formatTierLabel(activeClient?.packageTier)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {enableShortcut && (
                <kbd className="hidden xl:inline-block px-1.5 py-0.5 rounded bg-stone-100 border border-stone-200 text-[9px] font-mono text-stone-500">
                  Ctrl K
                </kbd>
              )}
              <ChevronDown
                className={`w-4 h-4 text-stone-400 transition-transform ${
                  isOpen ? 'rotate-180 text-[#8B6914]' : ''
                }`}
              />
            </div>
          </div>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          className="w-full px-3.5 py-2 rounded-lg border border-stone-300 bg-white hover:border-[#C5A059] text-left flex items-center justify-between gap-2 transition-colors cursor-pointer"
        >
          <span className="text-xs font-semibold text-stone-800 truncate">
            {activeClient
              ? `[${activeClient.clientCode}] ${activeClient.coupleLabel || activeClient.clientName}`
              : 'Pilih Klien...'}
          </span>
          <ChevronDown
            className={`w-4 h-4 text-stone-400 shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {isOpen && (
        <div
          role="listbox"
          className="absolute left-0 right-0 sm:right-auto sm:w-80 top-full mt-1.5 z-50 rounded-2xl bg-white border border-stone-200 shadow-xl overflow-hidden text-xs"
        >
          {/* Search Input */}
          <div className="p-2.5 border-b border-stone-100 space-y-2 bg-[#FAF8F5]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleLimit(INITIAL_VISIBLE_LIMIT);
                  setHighlightedIdx(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={`Cari dari ${clients.length.toLocaleString('id-ID')} klien (nama, kode, tanggal)...`}
                className="w-full pl-8 pr-7 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:border-[#C5A059]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 cursor-pointer"
                  aria-label="Hapus pencarian"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Compact Tier Filter Strip */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {(
                [
                  { id: 'ALL', label: 'Semua' },
                  { id: 'ROYAL_VIP', label: 'Enterprise' },
                  { id: 'EXCLUSIVE', label: 'Business' },
                  { id: 'STARTER', label: 'Starter' },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => {
                    setTierFilter(t.id);
                    setVisibleLimit(INITIAL_VISIBLE_LIMIT);
                    setHighlightedIdx(0);
                  }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                    tierFilter === t.id
                      ? 'bg-stone-900 text-white'
                      : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Windowed List */}
          <div className="max-h-72 overflow-y-auto py-1">
            {recentClients.length > 0 && (
              <div className="pb-1 mb-1 border-b border-stone-100">
                <p className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Terakhir Dibuka</span>
                </p>
                {recentClients.map((cg) => {
                  const isActive = cg.id === activeClientId;
                  return (
                    <button
                      key={`recent-${cg.id}`}
                      type="button"
                      onClick={() => handleChoose(cg.id)}
                      className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#FAF3E3] text-[#8B6914]'
                          : 'hover:bg-stone-50 text-stone-800'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {cg.coupleLabel || cg.clientName}
                        </p>
                        <p className="text-[10px] text-stone-500 truncate">
                          {cg.clientCode} &bull; {formatTierLabel(cg.packageTier)}
                        </p>
                      </div>
                      {isActive && <Check className="w-3.5 h-3.5 text-[#8B6914] shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {windowedClients.length === 0 ? (
              <div className="px-4 py-6 text-center space-y-1">
                <Building2 className="w-6 h-6 text-stone-300 mx-auto" />
                <p className="font-semibold text-stone-600">
                  Klien tidak ditemukan
                </p>
                <p className="text-[11px] text-stone-400">
                  Coba kata kunci nama pasangan atau kode klien lain.
                </p>
              </div>
            ) : (
              <>
                {recentClients.length > 0 && (
                  <p className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                    Semua Klien ({filteredClients.length.toLocaleString('id-ID')})
                  </p>
                )}
                {windowedClients.map((cg, idx) => {
                  const isActive = cg.id === activeClientId;
                  const isHighlighted = idx === highlightedIdx;
                  return (
                    <button
                      key={cg.id}
                      type="button"
                      onMouseEnter={() => setHighlightedIdx(idx)}
                      onClick={() => handleChoose(cg.id)}
                      className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-[#FAF3E3] text-[#8B6914]'
                          : isHighlighted
                            ? 'bg-stone-50 text-stone-900'
                            : 'text-stone-700 hover:bg-stone-50'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold truncate">
                            {cg.coupleLabel || cg.clientName}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 font-mono text-[9px] font-semibold shrink-0">
                            {cg.clientCode}
                          </span>
                        </div>
                        <p className="text-[10px] text-stone-500 truncate mt-0.5">
                          {formatTierLabel(cg.packageTier)}
                          {cg.eventDate ? ` • ${cg.eventDate}` : ''}
                        </p>
                      </div>
                      {isActive && (
                        <Check className="w-4 h-4 text-[#8B6914] shrink-0" />
                      )}
                    </button>
                  );
                })}

                {filteredClients.length > windowedClients.length && (
                  <div className="px-3 py-2 border-t border-stone-100 bg-[#FAF8F5] flex items-center justify-between gap-2 text-[11px]">
                    <span className="text-stone-500">
                      Menampilkan {windowedClients.length} dari{' '}
                      {filteredClients.length.toLocaleString('id-ID')}
                    </span>
                    <button
                      type="button"
                      onClick={() => setVisibleLimit((n) => n + 30)}
                      className="font-bold text-[#8B6914] hover:underline cursor-pointer"
                    >
                      Muat lagi
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

          {onOpenDirectory && (
            <div className="p-2 border-t border-stone-100 bg-[#FAF8F5]">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenDirectory();
                }}
                className="w-full px-3 py-2 rounded-xl bg-white hover:bg-[#FAF3E3] border border-stone-200 text-stone-800 hover:text-[#8B6914] font-semibold text-[11px] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>Kelola Semua Klien di Panel Superadmin</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
