import { NextRequest, NextResponse } from 'next/server';
import { apiError, rateLimitByIp, rejectDisallowedOrigin } from '@/lib/apiGuard';
import { PACKAGE_CATALOG } from '@/lib/packageCatalog';
import { verifyTurnstileToken } from '@/lib/turnstile';
import { resolveClientIp } from '@/lib/env';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payment/catalog
 *
 * Public read of the server-authoritative package catalogue. The landing page
 * uses it so the displayed prices always match what the server will charge.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: true,
      packages: PACKAGE_CATALOG,
    },
    { headers: { 'Cache-Control': 'no-store, max-age=0' } }
  );
}

/**
 * POST /api/payment/orders
 *
 * Creates a payment order server-side.
 *
 * The client sends only the package it wants and its contact details; the
 * amount, currency and tier are resolved from the server catalogue. A client
 * that asks for a different amount is rejected outright.
 */
export async function POST(req: NextRequest) {
  try {
    const originGuard = rejectDisallowedOrigin(req);
    if (originGuard) return originGuard;

    const limit = rateLimitByIp(req, 'payment:orders', {
      limit: 12,
      windowMs: 10 * 60 * 1000,
    });
    if (!limit.allowed) {
      return apiError(
        `Terlalu banyak permintaan checkout. Coba lagi dalam ${limit.retryAfterSeconds} detik.`,
        429,
        {
          code: 'RATE_LIMITED',
          headers: { 'Retry-After': String(limit.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json().catch(() => null);

    // Anti-bot guard for public checkout order creation when Turnstile is active
    const captcha = await verifyTurnstileToken(body?.turnstileToken, {
      expectedAction: 'checkout',
      remoteIp: resolveClientIp(req.headers),
    });
    if (!captcha.success) {
      return apiError(
        captcha.skipped
          ? 'Verifikasi keamanan sedang tidak tersedia. Coba lagi nanti.'
          : 'Verifikasi keamanan Cloudflare Turnstile gagal. Silakan coba lagi.',
        403,
        { code: 'CAPTCHA_FAILED' }
      );
    }
    const packageId = String(body?.packageId || '').trim().toUpperCase();
    const buyerEmail = String(body?.buyerEmail || '').trim().toLowerCase();
    const buyerCoupleName = String(body?.buyerCoupleName || '').trim();
    const channelCategory = String(body?.channelCategory || '').trim().toUpperCase();
    const currency = String(body?.currency || 'IDR').trim().toUpperCase();

    const pkg = PACKAGE_CATALOG.find((p) => p.id === packageId);
    if (!pkg) {
      return apiError('Paket tidak dikenal.', 400, { code: 'UNKNOWN_PACKAGE' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyerEmail)) {
      return apiError('Email pembeli tidak valid.', 400, {
        code: 'INVALID_EMAIL',
      });
    }

    // The client may send an amount; if it disagrees with the catalogue the
    // request is rejected rather than silently corrected.
    if (body?.amount !== undefined && body?.amount !== null) {
      const requested = Number(body.amount);
      if (Number.isFinite(requested) && requested !== pkg.amount) {
        return apiError(
          'Nominal tidak sesuai dengan katalog paket.',
          400,
          { code: 'AMOUNT_MISMATCH' }
        );
      }
    }

    const orderId = `ORD-${Date.now().toString(36).toUpperCase()}-${crypto
      .randomUUID()
      .slice(0, 8)
      .toUpperCase()}`;
    const idempotencyKey = crypto.randomUUID();

    return NextResponse.json({
      success: true,
      order: {
        orderId,
        idempotencyKey,
        packageId: pkg.id,
        packageTier: pkg.tier,
        amount: pkg.amount,
        cryptoAmount: pkg.cryptoAmount,
        currency: pkg.currency === 'USD' ? 'USD' : currency === 'USD' ? 'USD' : 'IDR',
        channelCategory,
        buyerEmail,
        buyerCoupleName,
        status: 'PENDING_VERIFICATION',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    });
  } catch (err) {
    return apiError(
      err instanceof Error ? err.message : 'Gagal membuat pesanan.',
      500
    );
  }
}
