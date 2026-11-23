import { RESEND_API_KEY, EMAIL_FROM, EMAIL_REPLY_TO } from '@/lib/env';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

export interface SendEmailResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

/**
 * Sends a transactional email through Resend.
 *
 * The API key lives only in the server environment. When Resend is not
 * configured the caller gets `ok: false` instead of a thrown error, so a
 * missing key never turns into a 500 that leaks internals.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    return {
      ok: false,
      error:
        'Resend belum dikonfigurasi (RESEND_API_KEY kosong). Email tidak terkirim.',
    };
  }

  const recipients = (Array.isArray(options.to) ? options.to : [options.to])
    .map((v) => v.trim())
    .filter((v) => v && isValidEmail(v));

  if (recipients.length === 0) {
    return { ok: false, error: 'Alamat email penerima tidak valid.' };
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: recipients,
        subject: options.subject,
        html: options.html,
        text: options.text,
        reply_to: options.replyTo || EMAIL_REPLY_TO || undefined,
      }),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      return {
        ok: false,
        error: `Resend HTTP ${res.status}: ${detail.slice(0, 300)}`,
      };
    }

    const data = (await res.json().catch(() => null)) as { id?: string } | null;
    return { ok: true, id: data?.id };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? `Gagal mengirim email: ${error.message}`
          : 'Gagal mengirim email.',
    };
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Verification email sent after sign-up. The link points at the app's
 * `/auth/verify` route which exchanges the token server-side.
 */
export function buildVerificationEmail(params: {
  email: string;
  verifyUrl: string;
  appName?: string;
}): { subject: string; html: string; text: string } {
  const appName = params.appName || 'MEPlanner — My Event Planner';
  const safeUrl = escapeHtml(params.verifyUrl);

  const html = `<!DOCTYPE html>
<html lang="id">
<body style="margin:0;padding:0;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.05);border-radius:18px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#FFFDF9,#F3E9D8);padding:26px 28px;border-bottom:1px solid rgba(197,160,89,0.25);">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9A7B38;">${escapeHtml(appName)}</div>
        <h1 style="margin:8px 0 0;font-size:20px;line-height:1.35;color:#1C1610;">Verifikasi alamat email Anda</h1>
      </div>
      <div style="padding:26px 28px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#3f3a33;">
          Halo <strong>${escapeHtml(params.email)}</strong>, konfirmasi email ini untuk mengaktifkan akun dan workspace Anda.
        </p>
        <p style="margin:0 0 24px;">
          <a href="${safeUrl}" style="display:inline-block;background:#1C1610;color:#FAF6EE;text-decoration:none;padding:13px 22px;border-radius:12px;font-size:14px;font-weight:700;">Verifikasi Email Sekarang</a>
        </p>
        <p style="margin:0 0 10px;font-size:12px;line-height:1.6;color:#8b8378;">Jika tombol tidak bekerja, salin tautan ini ke browser Anda:</p>
        <p style="margin:0 0 20px;font-size:12px;line-height:1.6;word-break:break-all;color:#9A7B38;">${safeUrl}</p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#8b8378;">Tautan ini berlaku singkat. Abaikan email ini bila Anda tidak mendaftar.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Verifikasi alamat email Anda di ${appName}.\n\nBuka tautan berikut untuk mengaktifkan akun:\n${params.verifyUrl}\n\nTautan ini berlaku singkat.`;
  return { subject: `${appName} — Verifikasi Email Anda`, html, text };
}

/** Password reset email. */
export function buildPasswordResetEmail(params: {
  email: string;
  resetUrl: string;
  appName?: string;
}): { subject: string; html: string; text: string } {
  const appName = params.appName || 'MEPlanner — My Event Planner';
  const safeUrl = escapeHtml(params.resetUrl);

  const html = `<!DOCTYPE html>
<html lang="id">
<body style="margin:0;padding:0;background:#FAF6EE;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:520px;margin:0 auto;padding:32px 20px;">
    <div style="background:#ffffff;border:1px solid rgba(0,0,0,0.05);border-radius:18px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#FFFDF9,#F3E9D8);padding:26px 28px;border-bottom:1px solid rgba(197,160,89,0.25);">
        <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:#9A7B38;">${escapeHtml(appName)}</div>
        <h1 style="margin:8px 0 0;font-size:20px;line-height:1.35;color:#1C1610;">Atur ulang kata sandi</h1>
      </div>
      <div style="padding:26px 28px;">
        <p style="margin:0 0 16px;font-size:14px;line-height:1.7;color:#3f3a33;">
          Kami menerima permintaan untuk mengatur ulang kata sandi akun <strong>${escapeHtml(params.email)}</strong>.
        </p>
        <p style="margin:0 0 24px;">
          <a href="${safeUrl}" style="display:inline-block;background:#1C1610;color:#FAF6EE;text-decoration:none;padding:13px 22px;border-radius:12px;font-size:14px;font-weight:700;">Buat Kata Sandi Baru</a>
        </p>
        <p style="margin:0;font-size:12px;line-height:1.6;color:#8b8378;">Bila Anda tidak meminta ini, abaikan email tersebut — kata sandi Anda tidak berubah.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

  const text = `Atur ulang kata sandi akun ${params.email} di ${appName}.\n\n${params.resetUrl}\n\nBila Anda tidak meminta ini, abaikan email ini.`;
  return { subject: `${appName} — Atur Ulang Kata Sandi`, html, text };
}
