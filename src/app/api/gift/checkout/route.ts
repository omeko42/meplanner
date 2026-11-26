import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { apiError, rateLimitByIp, rejectDisallowedOrigin } from '@/lib/apiGuard';
import { SITE_URL } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * POST /api/gift/checkout
 *
 * Creates a real hosted checkout session for "Amplop Digital & Tanda Kasih"
 * via Midtrans Snap API or Xendit Invoice API using server-held credentials.
 *
 * Required Vercel env vars (server-only, never NEXT_PUBLIC_*):
 *  - Midtrans: MIDTRANS_SERVER_KEY (+ optional MIDTRANS_IS_PRODUCTION=true)
 *  - Xendit:   XENDIT_SECRET_KEY
 */
export async function POST(req: NextRequest) {
  try {
    const originGuard = rejectDisallowedOrigin(req);
    if (originGuard) return originGuard;

    const limit = rateLimitByIp(req, 'gift:checkout', {
      limit: 15,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.allowed) {
      return apiError(
        `Terlalu banyak permintaan pembayaran. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        429,
        {
          code: 'RATE_LIMITED',
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      );
    }

    const body = (await req.json().catch(() => null)) as {
      provider?: string;
      amount?: number;
      guestName?: string;
      message?: string;
      coupleLabel?: string;
      returnUrl?: string;
    } | null;

    const provider = String(body?.provider || 'MIDTRANS').trim().toUpperCase();
    const amount = Math.round(Number(body?.amount) || 0);
    const guestName = String(body?.guestName || 'Tamu Undangan')
      .trim()
      .slice(0, 80);
    const coupleLabel = String(body?.coupleLabel || 'Mempelai')
      .trim()
      .slice(0, 80);
    const note = String(body?.message || '').trim().slice(0, 200);

    if (!Number.isFinite(amount) || amount < 10_000 || amount > 100_000_000) {
      return apiError(
        'Nominal tanda kasih minimal Rp 10.000 dan maksimal Rp 100.000.000.',
        400,
        { code: 'INVALID_AMOUNT' }
      );
    }

    const orderId = `GIFT-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomBytes(3)
      .toString('hex')
      .toUpperCase()}`;

    const safeReturnUrl =
      body?.returnUrl && body.returnUrl.startsWith(SITE_URL)
        ? body.returnUrl
        : SITE_URL;

    if (provider === 'MIDTRANS') {
      const serverKey = process.env.MIDTRANS_SERVER_KEY?.trim();
      if (!serverKey) {
        return apiError(
          'Midtrans API belum aktif di server. Tambahkan MIDTRANS_SERVER_KEY di Vercel atau gunakan mode Tautan Pembayaran (Payment Link).',
          503,
          { code: 'GATEWAY_NOT_CONFIGURED' }
        );
      }
      const isProd = process.env.MIDTRANS_IS_PRODUCTION === 'true';
      const endpoint = isProd
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';
      const authHeader = `Basic ${Buffer.from(`${serverKey}:`).toString('base64')}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          transaction_details: {
            order_id: orderId,
            gross_amount: amount,
          },
          item_details: [
            {
              id: 'AMPLOP_DIGITAL',
              price: amount,
              quantity: 1,
              name: `Tanda Kasih untuk ${coupleLabel}`.slice(0, 50),
            },
          ],
          customer_details: {
            first_name: guestName,
            notes: note || undefined,
          },
          callbacks: {
            finish: safeReturnUrl,
          },
        }),
        cache: 'no-store',
      });

      const data = (await res.json().catch(() => null)) as {
        redirect_url?: string;
        token?: string;
        error_messages?: string[];
      } | null;

      if (!res.ok || !data?.redirect_url) {
        return apiError(
          data?.error_messages?.join(', ') ||
            'Gagal membuat tautan pembayaran Midtrans.',
          502,
          { code: 'MIDTRANS_ERROR' }
        );
      }

      return NextResponse.json({
        success: true,
        provider: 'MIDTRANS',
        orderId,
        redirectUrl: data.redirect_url,
        token: data.token,
      });
    }

    if (provider === 'XENDIT') {
      const secretKey = process.env.XENDIT_SECRET_KEY?.trim();
      if (!secretKey) {
        return apiError(
          'Xendit API belum aktif di server. Tambahkan XENDIT_SECRET_KEY di Vercel atau gunakan mode Tautan Pembayaran (Payment Link).',
          503,
          { code: 'GATEWAY_NOT_CONFIGURED' }
        );
      }
      const authHeader = `Basic ${Buffer.from(`${secretKey}:`).toString('base64')}`;
      const res = await fetch('https://api.xendit.co/v2/invoices', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify({
          external_id: orderId,
          amount,
          currency: 'IDR',
          description: `Tanda Kasih dari ${guestName} untuk ${coupleLabel}${
            note ? ` — ${note}` : ''
          }`.slice(0, 250),
          success_redirect_url: safeReturnUrl,
          failure_redirect_url: safeReturnUrl,
        }),
        cache: 'no-store',
      });

      const data = (await res.json().catch(() => null)) as {
        invoice_url?: string;
        message?: string;
      } | null;

      if (!res.ok || !data?.invoice_url) {
        return apiError(
          data?.message || 'Gagal membuat tautan pembayaran Xendit.',
          502,
          { code: 'XENDIT_ERROR' }
        );
      }

      return NextResponse.json({
        success: true,
        provider: 'XENDIT',
        orderId,
        redirectUrl: data.invoice_url,
      });
    }

    return apiError(
      'Provider API checkout langsung hanya mendukung Midtrans atau Xendit. Untuk Konvert.id / Levelwise / Mayar / Saweria gunakan mode Tautan Pembayaran.',
      400,
      { code: 'UNSUPPORTED_API_PROVIDER' }
    );
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : 'Gagal memproses pembayaran.',
      500
    );
  }
}
