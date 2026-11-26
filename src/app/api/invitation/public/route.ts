import { NextRequest, NextResponse } from 'next/server';
import { serverStore } from '@/lib/serverStore';
import { apiError, rateLimitByIp } from '@/lib/apiGuard';
import {
  computeGuestInvitationHash,
  resolveGuestByHashTokenAcrossWorkspaces,
} from '@/lib/guestTokenHash';
import type { GuestWish, WeddingGuest, WeddingSettings } from '@/types';

export const dynamic = 'force-dynamic';

/**
 * Strips all private/admin/commercial/cross-tenant fields from WeddingSettings
 * before returning them to an unauthenticated guest invitation viewer.
 */
function sanitizePublicSettings(settings: WeddingSettings): WeddingSettings {
  const safe = { ...settings };
  delete safe.clientWorkspaces;
  delete safe.clientGroups;
  delete safe.commercialPayments;
  delete safe.commercialPaymentChannels;
  delete safe.commercialGatewayConfig;
  delete safe.commercialBankTransferInfo;
  delete safe.commercialQrisImageUrl;
  delete safe.commercialCreditCardUrl;
  delete safe.commercialPaypalUrl;
  delete safe.commercialCryptoWalletAddress;
  delete safe.deletedIdsRegistry;
  delete safe.waTemplateVip;
  delete safe.waTemplateRegular;
  delete safe.ownerGoogleEmail;
  safe.googleSheetId = '';
  return safe;
}

/**
 * Strips sensitive guest PII (phone number, private notes) before returning a
 * single matched guest record to the public invitation cover.
 */
function sanitizePublicGuest(guest: WeddingGuest): WeddingGuest {
  return {
    ...guest,
    phone: '',
    notes: '',
  };
}

/**
 * GET /api/invitation/public?hash=<token-or-code>
 *
 * Public, rate-limited endpoint that resolves a single guest's personalized
 * digital invitation using server-side Supabase credentials. Never returns
 * admin accounts, budgets, tasks, or other guests' PII.
 */
export async function GET(req: NextRequest) {
  try {
    const limit = rateLimitByIp(req, 'invitation:public', {
      limit: 60,
      windowMs: 60 * 1000,
    });
    if (!limit.allowed) {
      return apiError(
        'Terlalu banyak permintaan undangan. Coba lagi sebentar lagi.',
        429,
        { code: 'RATE_LIMITED' }
      );
    }

    const rawHash = (
      req.nextUrl.searchParams.get('hash') ||
      req.nextUrl.searchParams.get('code') ||
      ''
    ).trim();

    if (!rawHash || rawHash.length > 128) {
      return apiError('Kode atau tautan undangan tidak valid.', 400, {
        code: 'INVALID_HASH',
      });
    }

    await serverStore.reconcileWithSupabase();
    const state = serverStore.getFullState(true);

    const workspaces: Array<{
      clientId: string;
      clientLabel: string;
      settings: WeddingSettings;
      guests: WeddingGuest[];
      wishes: GuestWish[];
    }> = [
      {
        clientId: 'client-utama',
        clientLabel:
          state.settings.siteTitle ||
          `${state.settings.groomNickname} & ${state.settings.brideNickname}`,
        settings: state.settings,
        guests: state.guests || [],
        wishes: state.wishes || [],
      },
    ];

    if (state.settings.clientWorkspaces) {
      for (const [cid, ws] of Object.entries(state.settings.clientWorkspaces)) {
        if (!ws || cid === 'client-utama') continue;
        workspaces.push({
          clientId: cid,
          clientLabel: ws.settings?.siteTitle || cid,
          settings: { ...state.settings, ...(ws.settings || {}) },
          guests: ws.guests || [],
          wishes: ws.wishes || [],
        });
      }
    }

    let matchedWorkspace: (typeof workspaces)[number] | null = null;
    let matchedGuest: WeddingGuest | null = null;
    let matchedHashToken = rawHash;

    // 1. Exact token or invitationCode lookup first
    const rawUpper = rawHash.toUpperCase();
    for (const ws of workspaces) {
      for (const g of ws.guests) {
        const explicitToken = g.invitationToken?.trim();
        const invCode = g.invitationCode?.trim();
        if (
          (explicitToken && explicitToken === rawHash) ||
          (invCode && invCode.toUpperCase() === rawUpper)
        ) {
          matchedWorkspace = ws;
          matchedGuest = g;
          matchedHashToken =
            explicitToken || computeGuestInvitationHash(ws.clientId, g);
          break;
        }
      }
      if (matchedGuest) break;
    }

    // 2. Deterministic hash token lookup across workspaces
    if (!matchedGuest) {
      const hashHit = resolveGuestByHashTokenAcrossWorkspaces(
        rawHash,
        workspaces.map((w) => ({
          clientId: w.clientId,
          clientLabel: w.clientLabel,
          guests: w.guests,
        }))
      );
      if (hashHit) {
        matchedWorkspace =
          workspaces.find((w) => w.clientId === hashHit.clientId) || null;
        matchedGuest = hashHit.guest;
        matchedHashToken = hashHit.hashToken;
      }
    }

    if (!matchedWorkspace || !matchedGuest) {
      return apiError('Undangan tidak ditemukan.', 404, {
        code: 'INVITATION_NOT_FOUND',
      });
    }

    const publicWishes = (matchedWorkspace.wishes || [])
      .filter((w) => w.moderationStatus !== 'HIDDEN')
      .map((w) => ({ ...w, phone: '' }));

    return NextResponse.json(
      {
        success: true,
        clientId: matchedWorkspace.clientId,
        hashToken: matchedHashToken,
        guest: sanitizePublicGuest(matchedGuest),
        settings: sanitizePublicSettings(matchedWorkspace.settings),
        wishes: publicWishes,
      },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  } catch (error) {
    return apiError(
      error instanceof Error
        ? error.message
        : 'Gagal memuat data undangan publik.',
      500
    );
  }
}
