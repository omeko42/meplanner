'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Info, X } from 'lucide-react';

export function InfoTooltip({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const [pos, setPos] = useState<{
    top: number;
    left: number;
    placeAbove: boolean;
  } | null>(null);

  const updatePosition = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    if (!rect) return;
    const tooltipW = Math.min(264, window.innerWidth - 24);
    const left = Math.max(
      12,
      Math.min(
        rect.left + rect.width / 2 - tooltipW / 2,
        window.innerWidth - tooltipW - 12
      )
    );
    const placeAbove = rect.top > 120;
    setPos({
      top: placeAbove ? rect.top - 8 : rect.bottom + 8,
      left,
      placeAbove,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleScrollOrResize = () => {
      setOpen(false);
    };

    const handleOutsidePointer = (e: Event) => {
      if (btnRef.current && btnRef.current.contains(e.target as Node)) {
        return;
      }
      setOpen(false);
    };

    const timer = setTimeout(() => {
      setOpen(false);
    }, 5500);

    window.addEventListener('scroll', handleScrollOrResize, {
      capture: true,
      passive: true,
    });
    window.addEventListener('resize', handleScrollOrResize, { passive: true });
    document.addEventListener('pointerdown', handleOutsidePointer, {
      passive: true,
    });
    document.addEventListener('touchstart', handleOutsidePointer, {
      passive: true,
    });

    return () => {
      clearTimeout(timer);
      window.removeEventListener('scroll', handleScrollOrResize, {
        capture: true,
      });
      window.removeEventListener('resize', handleScrollOrResize);
      document.removeEventListener('pointerdown', handleOutsidePointer);
      document.removeEventListener('touchstart', handleOutsidePointer);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        ref={btnRef}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!open) updatePosition();
          setOpen((v) => !v);
        }}
        onMouseEnter={() => {
          updatePosition();
          setOpen(true);
        }}
        onMouseLeave={() => setOpen(false)}
        aria-label={text}
        className={`w-4 h-4 rounded-full bg-[#FAF3E3] hover:bg-[#EFE1C6] border border-[#D4AF37]/55 text-[#8B6914] inline-flex items-center justify-center transition-colors shrink-0 cursor-pointer align-middle ${className}`}
      >
        <Info className="w-2.5 h-2.5" />
      </button>
      {open &&
        pos &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            role="tooltip"
            style={{
              left: `${pos.left}px`,
              top: `${pos.top}px`,
              transform: pos.placeAbove ? 'translateY(-100%)' : 'none',
              width: 'min(264px, calc(100vw - 24px))',
            }}
            className="fixed z-[9999] p-2.5 rounded-xl bg-stone-900/95 backdrop-blur-md text-[#FAF8F5] text-[11px] font-normal leading-relaxed shadow-xl border border-[#D4AF37]/45 text-left pointer-events-none animate-in fade-in duration-150"
          >
            {text}
          </div>,
          document.body
        )}
    </>
  );
}

export function MobileTouchTooltipBridge() {
  const [activeTip, setActiveTip] = useState<string | null>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startCoordRef = useRef<{ x: number; y: number } | null>(null);

  const showTip = useCallback((text: string, durationMs: number) => {
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current);
    }
    setActiveTip(text);
    hideTimerRef.current = setTimeout(() => {
      setActiveTip(null);
    }, durationMs);
  }, []);

  useEffect(() => {
    const clearLongPress = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      startCoordRef.current = null;
    };

    const handleTouchStart = (e: TouchEvent) => {
      clearLongPress();
      const target = e.target as HTMLElement | null;
      const el = target?.closest?.('[title]') as HTMLElement | null;
      const titleText = el?.getAttribute('title')?.trim();
      if (!el || !titleText) return;

      const interactiveAncestor = el.closest(
        'button, a, label, input, select, textarea'
      );

      if (
        (el.tagName === 'SPAN' ||
          el.tagName === 'DIV' ||
          el.tagName === 'P') &&
        !interactiveAncestor
      ) {
        showTip(titleText, 3500);
        return;
      }

      if (
        el.tagName === 'BUTTON' ||
        el.tagName === 'LABEL' ||
        el.tagName === 'A' ||
        interactiveAncestor
      ) {
        const touch = e.touches[0];
        if (!touch) return;
        startCoordRef.current = { x: touch.clientX, y: touch.clientY };
        longPressTimerRef.current = setTimeout(() => {
          showTip(titleText, 3800);
        }, 380);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!longPressTimerRef.current || !startCoordRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;
      const dx = Math.abs(touch.clientX - startCoordRef.current.x);
      const dy = Math.abs(touch.clientY - startCoordRef.current.y);
      if (dx > 10 || dy > 10) {
        clearLongPress();
      }
    };

    const handleTouchEnd = () => {
      clearLongPress();
    };

    document.addEventListener('touchstart', handleTouchStart, {
      passive: true,
    });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });
    document.addEventListener('touchcancel', handleTouchEnd, { passive: true });

    return () => {
      clearLongPress();
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [showTip]);

  if (!activeTip) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      onClick={() => setActiveTip(null)}
      className="fixed bottom-16 left-3 right-3 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:max-w-md z-[9998] pointer-events-auto cursor-pointer"
    >
      <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-2xl bg-stone-900/95 backdrop-blur-md border border-[#D4AF37]/50 shadow-2xl">
        <Info className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
        <p className="text-[11px] sm:text-xs text-[#FAF8F5] font-medium leading-snug flex-1">
          {activeTip}
        </p>
        <X className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
      </div>
    </div>
  );
}
