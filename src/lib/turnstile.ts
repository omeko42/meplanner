import {
  TURNSTILE_SECRET_KEY,
  TURNSTILE_SITE_KEY,
  isTurnstileConfigured,
  isTurnstileEnforced,
} from '@/lib/env';

export interface TurnstileVerifyResult {
  success: boolean;
  /** Populated when verification fails so the caller can log the reason. */
  reason?: string;
  /** True when no Turnstile verification was possible (dev / not configured). */
  skipped?: boolean;
}

interface SiteverifyResponse {
  success?: boolean;
  'error-codes'?: string[];
  hostname?: string;
  action?: string;
  cdata?: string;
}

const SITEVERIFY_ENDPOINT = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

/**
 * Verifies a Cloudflare Turnstile token server-side.
 *
 * The token is single-use and expires quickly, so verification must happen
 * on the server right before the privileged action is performed. A token
 * supplied by the browser is never trusted on its own — only the response
 * from Cloudflare counts.
 *
 * In production, if Turnstile is not configured the check fails closed:
 * an unconfigured deployment must never accept unprotected writes.
 */
export async function verifyTurnstileToken(
  token: string | undefined | null,
  options?: { expectedAction?: string; remoteIp?: string }
): Promise<TurnstileVerifyResult> {
  const cleanToken = (token || '').trim();

  if (!isTurnstileConfigured || !TURNSTILE_SECRET_KEY) {
    if (isTurnstileEnforced) {
      return {
        success: false,
        reason: 'Turnstile belum dikonfigurasi di server ini.',
      };
    }
    return { success: true, skipped: true };
  }

  if (!cleanToken) {
    return { success: false, reason: 'Token Turnstile tidak ditemukan.' };
  }

  const form = new URLSearchParams();
  form.set('secret', TURNSTILE_SECRET_KEY);
  form.set('response', cleanToken);
  if (options?.remoteIp) form.set('remoteip', options.remoteIp);
  if (options?.expectedAction) form.set('action', options.expectedAction);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const res = await fetch(SITEVERIFY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
      signal: controller.signal,
      cache: 'no-store',
    });
    clearTimeout(timer);

    if (!res.ok) {
      return { success: false, reason: `Siteverify HTTP ${res.status}` };
    }

    const data = (await res.json()) as SiteverifyResponse;

    if (!data.success) {
      const codes = data['error-codes']?.join(', ') || 'unknown';
      return { success: false, reason: codes };
    }

    // When an action is declared on the widget, the verified token must
    // carry the same action, otherwise a token minted for a low-value form
    // could be replayed against a high-value one.
    if (
      options?.expectedAction &&
      data.action &&
      data.action !== options.expectedAction
    ) {
      return {
        success: false,
        reason: `Action mismatch: ${data.action} != ${options.expectedAction}`,
      };
    }

    return { success: true };
  } catch (error) {
    // A network failure to Cloudflare must not silently allow the action.
    return {
      success: false,
      reason:
        error instanceof Error
          ? `Verifikasi Turnstile gagal: ${error.message}`
          : 'Verifikasi Turnstile gagal.',
    };
  }
}

/** Public site key for rendering the widget. Empty string disables rendering. */
export const turnstileSiteKey = TURNSTILE_SITE_KEY || '';
