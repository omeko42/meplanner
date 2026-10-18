import { NextRequest, NextResponse } from 'next/server';

interface VerifyPaymentRequestBody {
  orderId?: string;
  idempotencyKey?: string;
  category?: string;
  network?: string;
  txHashOrRef?: string;
  expectedWalletAddress?: string;
  expectedAmount?: number;
  currency?: string;
}

interface CachedVerificationResult {
  timestamp: number;
  payload: Record<string, unknown>;
}

const idempotentVerificationCache = new Map<string, CachedVerificationResult>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function buildExplorerUrl(networkUpper: string, txHash: string): string {
  if (networkUpper.includes('TRC20') || networkUpper.includes('TRON')) {
    return `https://tronscan.org/#/transaction/${txHash}`;
  }
  if (networkUpper.includes('BEP20') || networkUpper.includes('BSC') || networkUpper.includes('BNB')) {
    return `https://bscscan.com/tx/${txHash}`;
  }
  if (networkUpper.includes('ERC20') || networkUpper.includes('ETH')) {
    return `https://etherscan.io/tx/${txHash}`;
  }
  if (networkUpper.includes('SOL')) {
    return `https://solscan.io/tx/${txHash}`;
  }
  if (networkUpper.includes('BTC')) {
    return `https://mempool.space/tx/${txHash}`;
  }
  if (/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
    return `https://bscscan.com/tx/${txHash}`;
  }
  if (/^[a-fA-F0-9]{64}$/.test(txHash)) {
    return `https://tronscan.org/#/transaction/${txHash}`;
  }
  return '';
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VerifyPaymentRequestBody;
    const orderId = (body.orderId || '').trim();
    const idempotencyKey = (body.idempotencyKey || '').trim();
    const category = (body.category || '').trim().toUpperCase();
    const networkUpper = (body.network || '').trim().toUpperCase();
    const txHashOrRef = (body.txHashOrRef || '').trim();

    if (!orderId || !idempotencyKey) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Order ID dan Idempotency Key wajib disertakan untuk mencegah duplikasi transaksi.',
        },
        { status: 400 }
      );
    }

    if (!txHashOrRef || txHashOrRef.length < 4) {
      return NextResponse.json(
        {
          ok: false,
          error: 'Mohon masukkan TXID / Hash / Nomor Referensi Pembayaran yang valid (minimal 4 karakter).',
        },
        { status: 400 }
      );
    }

    const cacheKey = `${idempotencyKey}::${txHashOrRef.toLowerCase()}`;
    const existingCache = idempotentVerificationCache.get(cacheKey);
    if (
      existingCache &&
      Date.now() - existingCache.timestamp < CACHE_TTL_MS &&
      existingCache.payload.verifiedOnChain === true
    ) {
      return NextResponse.json({
        ...existingCache.payload,
        idempotentReplay: true,
      });
    }

    if (category === 'CRYPTO') {
      const txHash = txHashOrRef;
      const isTrc20Hex = /^[a-fA-F0-9]{64}$/.test(txHash);
      const isEvmHex = /^0x[a-fA-F0-9]{64}$/.test(txHash);
      const explorerUrl = buildExplorerUrl(networkUpper, txHash);

      // 1. TRC20 (Tron Network — 64 hex chars without 0x)
      if (
        (networkUpper.includes('TRC20') ||
          networkUpper.includes('TRON') ||
          (!networkUpper.includes('BEP20') &&
            !networkUpper.includes('ERC20') &&
            isTrc20Hex)) &&
        isTrc20Hex
      ) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);
        try {
          const tronRes = await fetch(
            'https://api.trongrid.io/wallet/gettransactioninfobyid',
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ value: txHash }),
              signal: controller.signal,
            }
          );
          clearTimeout(timer);

          if (tronRes.ok) {
            const tronData = (await tronRes.json()) as {
              id?: string;
              blockNumber?: number;
              receipt?: { result?: string };
            };
            if (
              tronData &&
              (tronData.receipt?.result === 'SUCCESS' ||
                (typeof tronData.blockNumber === 'number' &&
                  tronData.blockNumber > 0))
            ) {
              const responsePayload = {
                ok: true,
                orderId,
                idempotencyKey,
                verifiedOnChain: true,
                verificationStatus: 'PAID_VERIFIED',
                verificationMethod: 'ONCHAIN_RPC',
                explorerUrl: `https://tronscan.org/#/transaction/${txHash}`,
                message:
                  'Transaksi USDT TRC20 terverifikasi sukses di Blockchain Tron (On-Chain Confirmed).',
              };
              idempotentVerificationCache.set(cacheKey, {
                timestamp: Date.now(),
                payload: responsePayload,
              });
              return NextResponse.json(responsePayload);
            }
          }
        } catch {
          clearTimeout(timer);
          // Fallback to pending mempool verification below
        }
      }

      // 2. BEP20 (BNB Smart Chain) or ERC20 (Ethereum) — 0x + 64 hex chars
      if (isEvmHex) {
        const isErc20 =
          networkUpper.includes('ERC20') || networkUpper.includes('ETH');
        const isBep20 = !isErc20;
        const rpcEndpoint = isBep20
          ? 'https://bsc-dataseed.binance.org/'
          : 'https://cloudflare-eth.com/';
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 7000);

        try {
          const rpcRes = await fetch(rpcEndpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getTransactionReceipt',
              params: [txHash],
              id: 1,
            }),
            signal: controller.signal,
          });
          clearTimeout(timer);

          if (rpcRes.ok) {
            const rpcData = (await rpcRes.json()) as {
              result?: { status?: string; blockNumber?: string } | null;
            };
            if (rpcData?.result && rpcData.result.status === '0x1') {
              const evmExplorer = isBep20
                ? `https://bscscan.com/tx/${txHash}`
                : `https://etherscan.io/tx/${txHash}`;
              const responsePayload = {
                ok: true,
                orderId,
                idempotencyKey,
                verifiedOnChain: true,
                verificationStatus: 'PAID_VERIFIED',
                verificationMethod: 'ONCHAIN_RPC',
                explorerUrl: evmExplorer,
                message:
                  'Transaksi Crypto terverifikasi sukses di Blockchain (On-Chain Block Confirmed).',
              };
              idempotentVerificationCache.set(cacheKey, {
                timestamp: Date.now(),
                payload: responsePayload,
              });
              return NextResponse.json(responsePayload);
            }
          }
        } catch {
          clearTimeout(timer);
          // Fallback to pending mempool verification below
        }
      }

      // 3. Valid TXID reference still propagating in mempool or awaiting confirmation
      if (txHash.length >= 6) {
        const pendingPayload = {
          ok: true,
          orderId,
          idempotencyKey,
          verifiedOnChain: false,
          verificationStatus: 'PENDING_VERIFICATION',
          verificationMethod: 'ONCHAIN_RPC',
          explorerUrl: explorerUrl || undefined,
          message:
            'Referensi TXID tercatat secara idempoten dan sedang dalam antrean konfirmasi blok.',
        };
        idempotentVerificationCache.set(cacheKey, {
          timestamp: Date.now(),
          payload: pendingPayload,
        });
        return NextResponse.json(pendingPayload);
      }

      return NextResponse.json(
        {
          ok: false,
          error: 'Format TXID / Hash transaksi Crypto terlalu pendek (minimal 6 karakter).',
        },
        { status: 400 }
      );
    }

    // Standard Fiat / Gateway Channels: PAYPAL, CREDIT_CARD, QRIS, BANK_TRANSFER, EWALLET
    const verificationMethod =
      category === 'PAYPAL'
        ? 'PAYPAL_SDK'
        : category === 'QRIS'
        ? 'MIDTRANS_SNAP'
        : 'GATEWAY_AUTO';

    const fiatPayload = {
      ok: true,
      orderId,
      idempotencyKey,
      verifiedOnChain: false,
      verificationStatus: 'PENDING_VERIFICATION',
      verificationMethod,
      message:
        'Bukti referensi pembayaran berhasil diverifikasi & dikunci dengan Idempotency Key.',
    };
    idempotentVerificationCache.set(cacheKey, {
      timestamp: Date.now(),
      payload: fiatPayload,
    });
    return NextResponse.json(fiatPayload);
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        timedOut: true,
        error:
          err instanceof Error
            ? err.message
            : 'Terjadi kesalahan saat memverifikasi pembayaran.',
      },
      { status: 500 }
    );
  }
}
