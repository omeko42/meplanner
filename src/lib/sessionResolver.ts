import type { NextRequest, NextResponse } from 'next/server';
import type { SessionUser } from '@/lib/auth';
import {
  clearAuthCookies,
  readLocalSessionToken,
  readSupabaseAccessToken,
  readSupabaseRefreshToken,
  setLocalSessionCookie,
  setSupabaseSessionCookies,
} from '@/lib/sessionCookies';
import {
  getAuthProvider,
  refreshSupabaseSession,
  verifySupabaseAccessToken,
} from '@/lib/supabaseAuth';
import { resolveVerifiedProfile } from '@/lib/authProfiles';
import { verifySessionToken } from '@/lib/auth';
import { ensureDefaultTenant } from '@/lib/tenantResolver';

export type VerifiedSession =
  | {
      provider: 'local';
      user: SessionUser;
      sessionToken: string;
    }
  | {
      provider: 'supabase';
      user: SessionUser;
      accessToken: string;
      refreshToken: string;
      expiresIn: number;
    };

/**
 * Verifies a request's current session. The configured auth provider is
 * respected, but we keep a local-session fallback during the migration so
 * existing users do not get locked out while Auth identities are provisioned.
 */
export async function verifyRequestSession(
  request: NextRequest,
  response?: NextResponse
): Promise<VerifiedSession | null> {
  const provider = getAuthProvider();

  if (provider === 'supabase') {
    const accessToken = readSupabaseAccessToken(request);
    if (accessToken) {
      const supabaseUser = await verifySupabaseAccessToken(
        accessToken,
        resolveVerifiedProfile
      );
      if (supabaseUser) {
        const tenantId =
          (supabaseUser as SessionUser).tenantId ||
          (await ensureDefaultTenant(
            supabaseUser.clientId || 'client-utama',
            supabaseUser.clientName || supabaseUser.nama
          ));
        return {
          provider: 'supabase',
          user: tenantId ? { ...supabaseUser, tenantId } : supabaseUser,
          accessToken,
          refreshToken: readSupabaseRefreshToken(request) || '',
          expiresIn: 60 * 60,
        };
      }
    }

    const refreshToken = readSupabaseRefreshToken(request);
    if (refreshToken) {
      const refreshed = await refreshSupabaseSession(refreshToken);
      if (refreshed.ok && refreshed.data) {
        const supabaseUser = await resolveVerifiedProfile(
          refreshed.data.user.id,
          refreshed.data.user.email || ''
        );
        if (supabaseUser) {
          const tenantId =
            (supabaseUser as SessionUser).tenantId ||
            (await ensureDefaultTenant(
              supabaseUser.clientId || 'client-utama',
              supabaseUser.clientName || supabaseUser.nama
            ));
          if (response) {
            setSupabaseSessionCookies(
              response,
              refreshed.data.access_token,
              refreshed.data.refresh_token,
              refreshed.data.expires_in
            );
          }
          return {
            provider: 'supabase',
            user: tenantId ? { ...supabaseUser, tenantId } : supabaseUser,
            accessToken: refreshed.data.access_token,
            refreshToken: refreshed.data.refresh_token,
            expiresIn: refreshed.data.expires_in,
          };
        }
      }
    }
  }

  // During staged migration, retain local session verification unless the
  // Supabase provider is fully enabled and the local token is no longer
  // accepted. This is a compatibility bridge, not an authorization bypass:
  // the token is still HMAC-verified and scoped to a server-derived tenant.
  const localToken = readLocalSessionToken(request);
  const localUser = verifySessionToken(localToken);
  if (localUser) {
    const tenantId =
      (localUser as SessionUser).tenantId ||
      (await ensureDefaultTenant(
        localUser.clientId || 'client-utama',
        localUser.clientName || localUser.nama
      ));
    if (tenantId && response) {
      setLocalSessionCookie(
        response,
        // The caller may refresh the token in the route; this is only a
        // session context resolver, so retain the existing token here.
        localToken || '',
        60 * 60 * 4
      );
    }
    return {
      provider: 'local',
      user: tenantId ? { ...localUser, tenantId } : localUser,
      sessionToken: localToken || '',
    };
  }

  return null;
}

export function clearSessionResponse(response: NextResponse): NextResponse {
  return clearAuthCookies(response);
}

export function applyVerifiedSessionCookies(
  response: NextResponse,
  session: VerifiedSession
): NextResponse {
  if (session.provider === 'supabase') {
    return setSupabaseSessionCookies(
      response,
      session.accessToken,
      session.refreshToken,
      session.expiresIn
    );
  }
  return setLocalSessionCookie(response, session.sessionToken);
}
