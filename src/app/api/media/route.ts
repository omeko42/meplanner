import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminRequest } from '@/lib/auth';
import { apiError, rejectDisallowedOrigin } from '@/lib/apiGuard';
import { SUPABASE_SERVICE_ROLE_KEY, SUPABASE_URL } from '@/lib/env';
import { SUPABASE_ANON_KEY } from '@/lib/supabaseCloud';

export const dynamic = 'force-dynamic';

const BUCKET = 'wedding-media';

const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15 MB
const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB
const MAX_VIDEO_BYTES = 25 * 1024 * 1024; // 25 MB

const ALLOWED_ROOTS = new Set(['photos', 'music', 'videos']);

function storageKey(): string {
  return SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;
}

function storageHeaders(extra?: Record<string, string>): Record<string, string> {
  const key = storageKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    ...(extra || {}),
  };
}

/**
 * Validates the requested object path.
 *
 * The path travels from the browser, so it must never be able to escape the
 * bucket or target an arbitrary key. Only `photos/`, `music/` and `videos/`
 * prefixes with a flat file name are allowed.
 */
function normalizeObjectPath(raw: string): string | null {
  if (!raw) return null;
  const decoded = decodeURIComponent(raw).replace(/^\/+/, '');
  if (decoded.includes('..')) return null;
  const segments = decoded.split('/').filter(Boolean);
  if (segments.length !== 2) return null;
  const [root, name] = segments as [string, string];
  if (!ALLOWED_ROOTS.has(root)) return null;
  if (!/^[A-Za-z0-9._-]{1,180}$/.test(name)) return null;
  return `${root}/${name}`;
}

/**
 * GET — lists the objects in the media bucket.
 * Used by the dashboard's storage-capacity view.
 */
export async function GET(req: NextRequest) {
  try {
    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const prefix = req.nextUrl.searchParams.get('prefix') || '';
    const safePrefix = ALLOWED_ROOTS.has(prefix) ? `${prefix}/` : '';

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: storageHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({
        prefix: safePrefix,
        limit: 1000,
      }),
      cache: 'no-store',
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: errText.slice(0, 300) },
        { status: res.status }
      );
    }

    const objects = await res.json();
    return NextResponse.json(
      { success: true, objects: Array.isArray(objects) ? objects : [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal/storage proxy gagal.',
      },
      { status: 500 }
    );
  }
}

/**
 * POST — uploads one media object to the bucket.
 *
 * The browser previously uploaded straight to Supabase Storage with the anon
 * key, which required an open storage policy. Routing the upload through the
 * server lets the storage policies be locked down to public-read only.
 */
export async function POST(req: NextRequest) {
  try {
    const originGuard = rejectDisallowedOrigin(req);
    if (originGuard) return originGuard;

    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const contentType = req.headers.get('content-type') || 'application/octet-stream';
    const rawPath = req.nextUrl.searchParams.get('path') || '';
    const objectPath = normalizeObjectPath(rawPath);
    if (!objectPath) {
      return apiError('Path objek tidak valid.', 400, { code: 'INVALID_PATH' });
    }

    const body = await req.arrayBuffer();
    const size = body.byteLength;

    const limit =
      objectPath.startsWith('music/')
        ? MAX_AUDIO_BYTES
        : objectPath.startsWith('videos/')
          ? MAX_VIDEO_BYTES
          : MAX_IMAGE_BYTES;

    if (size === 0) {
      return apiError('File kosong.', 400, { code: 'EMPTY_FILE' });
    }
    if (size > limit) {
      return apiError(
        `Ukuran file melebihi batas ${Math.round(limit / (1024 * 1024))} MB.`,
        413,
        { code: 'FILE_TOO_LARGE' }
      );
    }

    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: 'POST',
        headers: storageHeaders({
          'Content-Type': contentType,
          'cache-control': 'max-age=31536000, immutable',
          'x-upsert': 'true',
        }),
        body,
        cache: 'no-store',
      }
    );

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: errText.slice(0, 300) },
        { status: res.status }
      );
    }

    return NextResponse.json({
      success: true,
      path: objectPath,
      url: `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${objectPath}`,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal mengunggah media.',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE — removes one media object.
 */
export async function DELETE(req: NextRequest) {
  try {
    const originGuard = rejectDisallowedOrigin(req);
    if (originGuard) return originGuard;

    const adminSession = verifyAdminRequest(req);
    if (!adminSession) {
      return apiError(
        'Akses ditolak (401 Unauthorized). Silakan login terlebih dahulu.',
        401,
        { code: 'UNAUTHENTICATED' }
      );
    }

    const rawPath = req.nextUrl.searchParams.get('path') || '';
    const objectPath = normalizeObjectPath(rawPath);
    if (!objectPath) {
      return apiError('Path objek tidak valid.', 400, { code: 'INVALID_PATH' });
    }

    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectPath}`,
      {
        method: 'DELETE',
        headers: storageHeaders(),
        cache: 'no-store',
      }
    );

    if (!res.ok && res.status !== 404) {
      const errText = await res.text().catch(() => '');
      return NextResponse.json(
        { success: false, error: errText.slice(0, 300) },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Gagal menghapus media.',
      },
      { status: 500 }
    );
  }
}
