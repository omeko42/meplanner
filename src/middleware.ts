import { NextRequest, NextResponse } from 'next/server';
import { isAllowedOrigin } from '@/lib/env';
import {
  resolveInvitationOgPayload,
  resolveWhatsAppRedirectUrlByHash,
} from '@/lib/ogInvitationMetadata';

const LINK_PREVIEW_BOT_REGEX =
  /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|discordbot|linkedinbot|slackbot|skypeuripreview|line-poker|linespider|\bline\/|viber|kakaotalk|pinterest|iframely|embedly|opengraph|metainspector|vkshare|snapchat|redditbot|applebot|quora link preview/i;

/**
 * Baseline security headers applied to page responses. API responses receive
 * the same headers from next.config.mjs.
 */
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'off',
  'X-Permitted-Cross-Domain-Policies': 'none',
  'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com https://accounts.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://accounts.google.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https:",
    "media-src 'self' blob: https:",
    "connect-src 'self' https://*.supabase.co https://challenges.cloudflare.com https://api.resend.com https://accounts.google.com https://www.googleapis.com https://oauth2.googleapis.com",
    "frame-src 'self' https://challenges.cloudflare.com https://accounts.google.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join('; '),
};

const RESERVED_APP_ROUTES = new Set([
  'login',
  'reset-password',
  'privacy',
  'terms',
  'admin',
  'auth',
  'google-oauth-popup',
  'manifest.webmanifest',
]);

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function withSecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}

function escapeHtmlAttr(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Reject cross-origin state-changing API requests. API routes still perform
  // their own session and role checks; this is a CSRF defense-in-depth layer.
  if (pathname.startsWith('/api') && MUTATING_METHODS.has(req.method)) {
    const origin = req.headers.get('origin');
    if (origin && !isAllowedOrigin(origin)) {
      return withSecurityHeaders(
        NextResponse.json(
          { success: false, error: 'Origin tidak diizinkan.', code: 'BAD_ORIGIN' },
          { status: 403 }
        )
      );
    }
  }

  // API routes and static/media assets are handled by their own route logic.
  // Security headers for all API responses are set in next.config.mjs.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/media') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const ua = req.headers.get('user-agent') || '';
  const isBot = LINK_PREVIEW_BOT_REGEX.test(ua);
  const forceOgPreview = searchParams.get('og_preview') === '1';

  const segments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(Boolean);
  if (segments[0] && RESERVED_APP_ROUTES.has(segments[0].toLowerCase())) {
    return withSecurityHeaders(NextResponse.next());
  }
  const isShortWaRoute =
    (segments[0]?.toLowerCase() === 'wa' && Boolean(segments[1])) ||
    searchParams.get('wa') === '1';
  const waHashSegment =
    segments[0]?.toLowerCase() === 'wa'
      ? decodeURIComponent(segments[1] || '')
      : segments[0]
        ? decodeURIComponent(segments[0])
        : searchParams.get('u') || searchParams.get('code') || '';

  if (isShortWaRoute && !isBot && !forceOgPreview && waHashSegment) {
    const waRedirectUrl = await resolveWhatsAppRedirectUrlByHash(waHashSegment);
    if (waRedirectUrl) {
      return withSecurityHeaders(NextResponse.redirect(waRedirectUrl, 302));
    }
  }

  if (!forceOgPreview && !isBot) {
    return withSecurityHeaders(NextResponse.next());
  }

  const pathSegment =
    segments[0]?.toLowerCase() === 'wa' ? segments[1] || '' : segments[0] || '';
  const hashOrCode =
    (pathSegment ? decodeURIComponent(pathSegment) : '') ||
    searchParams.get('u') ||
    searchParams.get('code') ||
    searchParams.get('token') ||
    '';
  const explicitGuestTo = searchParams.get('to') || '';

  const og = await resolveInvitationOgPayload(hashOrCode, explicitGuestTo);

  const safeTitle = escapeHtmlAttr(og.title);
  const safeDesc = escapeHtmlAttr(og.description);
  const safeSiteName = escapeHtmlAttr(og.siteName);
  const safeUrl = escapeHtmlAttr(og.canonicalUrl);
  const safeImage = escapeHtmlAttr(og.imageUrl);
  const safeAlt = escapeHtmlAttr(og.imageAlt);
  const isSquareLogo = og.imageUrl.includes('og-meplanner-logo-m');
  const imgW = isSquareLogo ? '800' : '1200';
  const imgH = isSquareLogo ? '800' : '630';
  const twitterCard = isSquareLogo ? 'summary' : 'summary_large_image';

  const html = `<!DOCTYPE html>
<html lang="id" prefix="og: https://ogp.me/ns#">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${safeTitle}</title>
<meta name="description" content="${safeDesc}" />
<meta property="og:type" content="website" />
<meta property="og:locale" content="id_ID" />
<meta property="og:site_name" content="${safeSiteName}" />
<meta property="og:url" content="${safeUrl}" />
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:image:secure_url" content="${safeImage}" />
<meta property="og:image:type" content="image/jpeg" />
<meta property="og:image:width" content="${imgW}" />
<meta property="og:image:height" content="${imgH}" />
<meta property="og:image:alt" content="${safeAlt}" />
<meta name="twitter:card" content="${twitterCard}" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
<link itemprop="thumbnailUrl" href="${safeImage}" />
<link rel="canonical" href="${safeUrl}" />
</head>
<body>
<span itemprop="image" itemscope itemtype="https://schema.org/ImageObject">
<link itemprop="url" href="${safeImage}" />
<meta itemprop="type" content="image/jpeg" />
<meta itemprop="width" content="${imgW}" />
<meta itemprop="height" content="${imgH}" />
</span>
<h1>${safeTitle}</h1>
<p>${safeDesc}</p>
<img src="${safeImage}" alt="${safeAlt}" width="${imgW}" height="${imgH}" />
</body>
</html>`;

  return withSecurityHeaders(
    new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control':
          'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Robots-Tag': 'all',
      },
    })
  );
}

export const config = {
  matcher: ['/', '/((?!api|_next/static|_next/image|media|favicon.ico|.*\\..*).*)', '/api/:path*'],
};
