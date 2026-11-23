'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const TURNSTILE_SCRIPT_SRC =
  'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let scriptPromise: Promise<void> | null = null;

/** Shape of the Turnstile browser API that this widget relies on. */
interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id?: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

/**
 * Loads the Turnstile script once per page.
 *
 * The script is injected explicitly (rather than relying on a <script> tag in
 * the layout) so the widget only loads on pages that actually need it, which
 * keeps the initial page weight down.
 */
function loadTurnstileScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.turnstile) return Promise.resolve();

  if (!scriptPromise) {
    scriptPromise = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>(
        `script[src^="https://challenges.cloudflare.com/turnstile/"]`
      );
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () =>
          reject(new Error('Gagal memuat Turnstile.'))
        );
        return;
      }

      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () =>
        reject(new Error('Gagal memuat Turnstile. Periksa koneksi internet.'));
      document.head.appendChild(script);
    });
  }

  return scriptPromise;
}

export interface TurnstileWidgetProps {
  /** Site key from NEXT_PUBLIC_TURNSTILE_SITE_KEY. */
  siteKey: string;
  /**
   * Action name. The server verifies that the token carries the same action,
   * so a token minted for one form cannot be replayed against another.
   */
  action: string;
  /** Receives the token to send to the server. Empty string means unsolved. */
  onToken: (token: string) => void;
  /** Called when the widget fails to load or verify. */
  onError?: (message: string) => void;
  /** Visual language for the widget. */
  theme?: 'light' | 'dark' | 'auto';
  /** Re-render key — bump it to force a fresh challenge. */
  resetKey?: number | string;
  className?: string;
}

/**
 * Cloudflare Turnstile widget.
 *
 * The token produced here is single-use and expires within minutes, so the
 * server must verify it right before the privileged action is performed.
 * Never treat the presence of a token as proof on its own.
 */
export default function TurnstileWidget({
  siteKey,
  action,
  onToken,
  onError,
  theme = 'light',
  resetKey,
  className,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  const onErrorRef = useRef(onError);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState<string | null>(null);

  // Keep the latest callbacks without re-rendering the widget: re-rendering
  // would reset the challenge and annoy the user.
  useEffect(() => {
    onTokenRef.current = onToken;
    onErrorRef.current = onError;
  }, [onToken, onError]);

  const render = useCallback(() => {
    const container = containerRef.current;
    const turnstile = window.turnstile;
    if (!container || !turnstile) return;

    if (widgetIdRef.current) {
      try {
        turnstile.remove(widgetIdRef.current);
      } catch {
        // The widget may already be gone; removing it again is harmless.
      }
      widgetIdRef.current = null;
    }

    container.innerHTML = '';

    widgetIdRef.current = turnstile.render(container, {
      sitekey: siteKey,
      action,
      theme,
      // The token is sent to the server on submit; auto-refresh keeps it
      // valid for long-lived forms.
      'refresh-expired': 'auto',
      'refresh-timeout': 'auto',
      callback: (token: string) => {
        onTokenRef.current(token);
      },
      'expired-callback': () => {
        onTokenRef.current('');
      },
      'error-callback': () => {
        onTokenRef.current('');
        const message = 'Verifikasi keamanan gagal dimuat. Silakan muat ulang halaman.';
        setFailed(message);
        onErrorRef.current?.(message);
      },
    });
  }, [siteKey, action, theme]);

  useEffect(() => {
    if (!siteKey) {
      setFailed(
        'Verifikasi keamanan belum dikonfigurasi. Hubungi administrator.'
      );
      onErrorRef.current?.('Turnstile site key belum dikonfigurasi.');
      return;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then(() => {
        if (cancelled) return;
        setReady(true);
        // The script may have been loaded already but the widget API is
        // available synchronously — render on the next tick so the container
        // is mounted.
        setTimeout(() => {
          if (!cancelled) render();
        }, 0);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        const message =
          error instanceof Error
            ? error.message
            : 'Verifikasi keamanan gagal dimuat.';
        setFailed(message);
        onErrorRef.current?.(message);
      });

    return () => {
      cancelled = true;
    };
  }, [siteKey, render]);

  // Re-render the challenge when the caller asks for a reset.
  useEffect(() => {
    if (!ready || resetKey === undefined) return;
    render();
  }, [resetKey, ready, render]);

  if (failed && !ready) {
    return (
      <div
        className={className}
        role="alert"
        style={{
          padding: '10px 12px',
          borderRadius: '8px',
          border: '1px solid #f1c7c7',
          background: '#fff5f5',
          color: '#9b1c1c',
          fontSize: '13px',
          lineHeight: 1.5,
        }}
      >
        {failed}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={className}
      data-testid="turnstile-widget"
      style={{ minHeight: ready ? 65 : 0 }}
    />
  );
}
