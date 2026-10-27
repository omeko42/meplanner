import { NextRequest, NextResponse } from 'next/server';
import { resolveInvitationOgPayload } from '@/lib/ogInvitationMetadata';

const LINK_PREVIEW_BOT_REGEX =
  /whatsapp|facebookexternalhit|facebot|telegrambot|twitterbot|discordbot|linkedinbot|slackbot|skypeuripreview|line-poker|linespider|\bline\/|viber|kakaotalk|pinterest|iframely|embedly|opengraph|metainspector|vkshare|snapchat|redditbot|applebot|quora link preview/i;

function escapeHtmlAttr(value: string): string {
  return (value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/media') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const ua = req.headers.get('user-agent') || '';
  const forceOgPreview = searchParams.get('og_preview') === '1';

  if (!forceOgPreview && !LINK_PREVIEW_BOT_REGEX.test(ua)) {
    return NextResponse.next();
  }

  const pathSegment = pathname.replace(/^\/+|\/+$/g, '').split('/')[0] || '';
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

  return new NextResponse(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control':
        'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      'X-Robots-Tag': 'all',
    },
  });
}

export const config = {
  matcher: ['/', '/((?!api|_next/static|_next/image|media|favicon.ico|.*\\..*).*)'],
};
