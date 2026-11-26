'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  Check,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  X,
} from 'lucide-react';

export interface FilterOptionItem {
  value: string;
  label: string;
  count?: number;
  /** Optional nested sub-options (3rd-level cascading popover) */
  children?: FilterOptionItem[];
}

export interface FilterCategoryGroup {
  id: string;
  label: string;
  value: string;
  defaultValue?: string;
  options: FilterOptionItem[];
  onChange: (value: string) => void;
}

interface FilterPopoverProps {
  groups: FilterCategoryGroup[];
  buttonLabel?: string;
  align?: 'left' | 'right';
  showActiveChips?: boolean;
  className?: string;
}

function findOptionLabel(
  options: FilterOptionItem[],
  targetValue: string
): string | null {
  for (const opt of options) {
    if (opt.value === targetValue) return opt.label;
    if (opt.children) {
      const nested = findOptionLabel(opt.children, targetValue);
      if (nested) return nested;
    }
  }
  return null;
}

/**
 * Clean cascading filter popover:
 * Replaces long horizontal filter bars and cluttered multi-select rows with a
 * single "Filter" button -> Category popover -> Nested sub-category popover.
 */
export function FilterPopover({
  groups,
  buttonLabel = 'Filter',
  align = 'left',
  showActiveChips = true,
  className = '',
}: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [activeSubParentValue, setActiveSubParentValue] = useState<string | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setActiveGroupId(null);
      setActiveSubParentValue(null);
      return;
    }
    const handleOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen]);

  const activeFilters = groups
    .map((g) => {
      const def = g.defaultValue ?? 'ALL';
      if (g.value === def) return null;
      const label = findOptionLabel(g.options, g.value) || g.value;
      return {
        groupId: g.id,
        groupLabel: g.label,
        valueLabel: label,
        onClear: () => g.onChange(def),
      };
    })
    .filter(Boolean) as Array<{
    groupId: string;
    groupLabel: string;
    valueLabel: string;
    onClear: () => void;
  }>;

  const activeGroup = groups.find((g) => g.id === activeGroupId) || null;
  const activeSubParent =
    activeGroup?.options.find(
      (o) => o.value === activeSubParentValue && o.children && o.children.length > 0
    ) || null;

  const handleResetAll = () => {
    groups.forEach((g) => g.onChange(g.defaultValue ?? 'ALL'));
    setIsOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex items-center flex-wrap gap-1.5 ${className}`}
    >
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer shrink-0 ${
          activeFilters.length > 0 || isOpen
            ? 'bg-[#FAF3E3] border-[#C5A059] text-[#8B6914]'
            : 'bg-white border-stone-200 text-stone-700 hover:bg-stone-50 hover:border-stone-300'
        }`}
      >
        <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
        <span>{buttonLabel}</span>
        {activeFilters.length > 0 && (
          <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[#8B6914] text-white text-[10px] font-bold">
            {activeFilters.length}
          </span>
        )}
      </button>

      {showActiveChips && activeFilters.length > 0 && (
        <>
          {activeFilters.map((chip) => (
            <span
              key={chip.groupId}
              className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 rounded-full bg-[#FAF3E3] border border-[#D4AF37]/45 text-[#8B6914] text-[11px] font-semibold"
            >
              <span className="text-stone-500 font-medium">
                {chip.groupLabel}:
              </span>
              <span className="truncate max-w-[140px]">{chip.valueLabel}</span>
              <button
                type="button"
                onClick={chip.onClear}
                aria-label={`Hapus filter ${chip.groupLabel}`}
                className="w-4 h-4 rounded-full hover:bg-[#D4AF37]/25 flex items-center justify-center cursor-pointer"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            </span>
          ))}
          {activeFilters.length > 1 && (
            <button
              type="button"
              onClick={handleResetAll}
              className="text-[11px] font-semibold text-stone-500 hover:text-stone-800 px-1.5 py-1 cursor-pointer"
            >
              Reset
            </button>
          )}
        </>
      )}

      {isOpen && (
        <div
          role="menu"
          className={`absolute top-full mt-1.5 z-50 ${
            align === 'right' ? 'right-0' : 'left-0'
          } flex items-start`}
        >
          {/* Level 1: Category List */}
          <div className="w-56 rounded-2xl bg-white border border-stone-200/90 shadow-lg py-1.5 text-xs">
            <div className="px-3 py-1.5 flex items-center justify-between border-b border-stone-100 mb-1">
              <span className="text-[11px] font-bold text-stone-500">
                Pilih Kategori
              </span>
              {activeFilters.length > 0 && (
                <button
                  type="button"
                  onClick={handleResetAll}
                  className="text-[11px] font-semibold text-[#8B6914] hover:underline cursor-pointer"
                >
                  Reset semua
                </button>
              )}
            </div>

            {/* Mobile drill-down view when a category is selected on small screens */}
            {activeGroup && (
              <div className="sm:hidden">
                <button
                  type="button"
                  onClick={() => {
                    if (activeSubParent) {
                      setActiveSubParentValue(null);
                    } else {
                      setActiveGroupId(null);
                    }
                  }}
                  className="w-full px-3 py-2 flex items-center gap-1.5 text-[11px] font-bold text-[#8B6914] border-b border-stone-100 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>
                    {activeSubParent ? activeSubParent.label : activeGroup.label}
                  </span>
                </button>
                <div className="max-h-64 overflow-y-auto py-1">
                  {(activeSubParent ? activeSubParent.children! : activeGroup.options).map(
                    (opt) => {
                      const hasChildren = Boolean(
                        !activeSubParent && opt.children && opt.children.length > 0
                      );
                      const isSelected = activeGroup.value === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => {
                            if (hasChildren) {
                              setActiveSubParentValue(opt.value);
                            } else {
                              activeGroup.onChange(opt.value);
                              setIsOpen(false);
                            }
                          }}
                          className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#FAF3E3] text-[#8B6914] font-bold'
                              : 'text-stone-700 hover:bg-stone-50 font-medium'
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          <span className="flex items-center gap-1 shrink-0">
                            {typeof opt.count === 'number' && (
                              <span className="text-[10px] text-stone-400 font-semibold">
                                {opt.count}
                              </span>
                            )}
                            {hasChildren ? (
                              <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                            ) : isSelected ? (
                              <Check className="w-3.5 h-3.5 text-[#8B6914]" />
                            ) : null}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>
            )}

            {/* Desktop list (always visible) + Mobile root list */}
            <div className={activeGroup ? 'hidden sm:block' : 'block'}>
              {groups.map((group) => {
                const def = group.defaultValue ?? 'ALL';
                const isGroupFiltered = group.value !== def;
                const isFocused = activeGroupId === group.id;
                const currentLabel = isGroupFiltered
                  ? findOptionLabel(group.options, group.value)
                  : null;
                return (
                  <button
                    key={group.id}
                    type="button"
                    onMouseEnter={() => {
                      setActiveGroupId(group.id);
                      setActiveSubParentValue(null);
                    }}
                    onClick={() => {
                      setActiveGroupId(group.id);
                      setActiveSubParentValue(null);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                      isFocused
                        ? 'bg-[#FAF3E3]/80 text-[#8B6914]'
                        : 'text-stone-700 hover:bg-stone-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{group.label}</p>
                      {currentLabel && (
                        <p className="text-[10px] text-[#8B6914] font-semibold truncate">
                          {currentLabel}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {isGroupFiltered && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B68D40]" />
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Level 2: Desktop Cascading Sub-Popover */}
          {activeGroup && (
            <div className="hidden sm:block ml-1.5 w-56 rounded-2xl bg-white border border-stone-200/90 shadow-lg py-1.5 text-xs max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 border-b border-stone-100 mb-1">
                <span className="text-[11px] font-bold text-stone-500">
                  {activeGroup.label}
                </span>
              </div>
              {activeGroup.options.map((opt) => {
                const hasChildren = Boolean(opt.children && opt.children.length > 0);
                const isSelected = activeGroup.value === opt.value;
                const isChildSelected =
                  hasChildren &&
                  Boolean(findOptionLabel(opt.children!, activeGroup.value));
                const isSubOpen = activeSubParentValue === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onMouseEnter={() => {
                      setActiveSubParentValue(hasChildren ? opt.value : null);
                    }}
                    onClick={() => {
                      activeGroup.onChange(opt.value);
                      if (!hasChildren) {
                        setIsOpen(false);
                      }
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                      isSelected || isChildSelected || isSubOpen
                        ? 'bg-[#FAF3E3] text-[#8B6914] font-bold'
                        : 'text-stone-700 hover:bg-stone-50 font-medium'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {typeof opt.count === 'number' && (
                        <span className="text-[10px] text-stone-400 font-semibold">
                          {opt.count}
                        </span>
                      )}
                      {hasChildren ? (
                        <ChevronRight className="w-3.5 h-3.5 text-stone-400" />
                      ) : isSelected ? (
                        <Check className="w-3.5 h-3.5 text-[#8B6914]" />
                      ) : null}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Level 3: Desktop Nested Sub-Sub-Popover (when a category has nested children) */}
          {activeGroup && activeSubParent && activeSubParent.children && (
            <div className="hidden sm:block ml-1.5 w-52 rounded-2xl bg-white border border-stone-200/90 shadow-lg py-1.5 text-xs max-h-80 overflow-y-auto">
              <div className="px-3 py-1.5 border-b border-stone-100 mb-1">
                <span className="text-[11px] font-bold text-stone-500">
                  {activeSubParent.label}
                </span>
              </div>
              {activeSubParent.children.map((child) => {
                const isSelected = activeGroup.value === child.value;
                return (
                  <button
                    key={child.value}
                    type="button"
                    onClick={() => {
                      activeGroup.onChange(child.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 flex items-center justify-between gap-2 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#FAF3E3] text-[#8B6914] font-bold'
                        : 'text-stone-700 hover:bg-stone-50 font-medium'
                    }`}
                  >
                    <span className="truncate">{child.label}</span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      {typeof child.count === 'number' && (
                        <span className="text-[10px] text-stone-400 font-semibold">
                          {child.count}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-[#8B6914]" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
