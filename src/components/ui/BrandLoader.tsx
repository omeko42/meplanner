'use client';

import React from 'react';
import { WeddingRingsIcon } from '@/components/WeddingRingsIcon';

/**
 * Signature MEPlan loading animation (inspired by StashinMe):
 * Gently pulsing logo with soft aura ring + 3 rhythmic bouncing dots (• • •).
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
      <div className="relative flex items-center justify-center">
        <span
          aria-hidden="true"
          className="absolute -inset-3 rounded-2xl bg-[#C5A059]/20 animate-ping"
          style={{ animationDuration: '1400ms' }}
        />
        <span
          aria-hidden="true"
          className="absolute -inset-1.5 rounded-2xl bg-gradient-to-tr from-[#A855F7]/15 via-[#C5A059]/20 to-[#00F0FF]/15 blur-sm"
        />
        <div className="relative rounded-2xl bg-white/95 p-2.5 shadow-[0_10px_30px_rgba(140,115,75,0.16)] border border-[#D4AF37]/30 animate-pulse">
          <WeddingRingsIcon className={iconCls} logoUrl={logoUrl} />
        </div>
      </div>

      {/* 3 rhythmic bouncing dots underneath logo */}
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
              animationDelay: `${i * 150}ms`,
              animationDuration: '850ms',
            }}
          />
        ))}
      </div>

      {label && (
        <p className="mt-2.5 text-[11px] font-semibold tracking-wide text-stone-500">
          {label}
        </p>
      )}
    </div>
  );
}
