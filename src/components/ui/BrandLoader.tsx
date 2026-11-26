'use client';

import React from 'react';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';

/**
 * Clean minimal MEPlan loading indicator:
 * Static brand logo with 3 smoothly animated dots underneath — no card, no glow, no clutter.
 */
export function BrandLoader({
  size = 'md',
  label,
  logoUrl,
  className = '',
}: {
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  logoUrl?: string;
  className?: string;
}) {
  const iconCls =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
        ? 'w-14 h-14'
        : 'w-11 h-11';
  const dotCls = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label || 'Memuat'}
      className={`flex flex-col items-center justify-center ${
        size === 'sm' ? 'py-4' : size === 'lg' ? 'py-16' : 'py-10'
      } ${className}`}
    >
      {/* Static brand logo — no card, no pulse/spin */}
      <WeddingRingsIcon className={iconCls} logoUrl={logoUrl} />

      {/* Animated 3-dot rhythm underneath */}
      <div className="mt-4 flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`${dotCls} rounded-full animate-bounce ${
              i === 0
                ? 'bg-[#8B5CF6]'
                : i === 1
                  ? 'bg-[#C5A059]'
                  : 'bg-[#3B82F6]'
            }`}
            style={{
              animationDelay: `${i * 140}ms`,
              animationDuration: '820ms',
            }}
          />
        ))}
      </div>

      {label && (
        <p className="mt-2.5 text-xs font-medium text-stone-500">{label}</p>
      )}
    </div>
  );
}
