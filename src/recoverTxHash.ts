/**
 * MiniPay (and some viem wallets) broadcast the tx, then throw if the
 * receipt is not indexed yet. The hash is still in the error.
 */
const TX_HASH_RE = /0x[a-fA-F0-9]{64}/;

function collectErrorText(error: unknown, depth = 0): string {
  if (depth > 5 || error == null) return '';
  if (typeof error === 'string') return error;
  if (typeof error === 'number' || typeof error === 'boolean') return String(error);
  if (error instanceof Error) {
    const extra = error as Error & {
      shortMessage?: string;
      details?: string;
      cause?: unknown;
      walk?: () => unknown;
    };
    const parts = [error.message, extra.shortMessage, extra.details, String(error)];
    if (extra.cause) parts.push(collectErrorText(extra.cause, depth + 1));
    try {
      if (typeof extra.walk === 'function') {
        parts.push(collectErrorText(extra.walk(), depth + 1));
      }
    } catch {
      // ignore
    }
    return parts.filter(Boolean).join(' ');
  }
  if (typeof error === 'object') {
    const o = error as Record<string, unknown>;
    return [
      o.message,
      o.shortMessage,
      o.details,
      o.hash,
      o.transactionHash,
      o.txHash,
      o.cause ? collectErrorText(o.cause, depth + 1) : '',
    ]
      .map((value) => (typeof value === 'string' ? value : ''))
      .filter(Boolean)
      .join(' ');
  }
  return String(error);
}

function hashFromFields(error: unknown, depth = 0): string | null {
  if (depth > 4 || !error || typeof error !== 'object') return null;
  const o = error as Record<string, unknown>;
  for (const key of ['hash', 'transactionHash', 'txHash']) {
    const value = o[key];
    if (typeof value === 'string' && TX_HASH_RE.test(value)) return value.match(TX_HASH_RE)![0];
  }
  if (o.cause) return hashFromFields(o.cause, depth + 1);
  return null;
}

export function recoverBroadcastTxHash(error: unknown): string | null {
  const fromFields = hashFromFields(error);
  if (fromFields) return fromFields;

  const text = collectErrorText(error);
  const match = text.match(TX_HASH_RE);
  if (!match) return null;
  if (
    /receipt with hash/i.test(text) ||
    /could not be found/i.test(text) ||
    /not be processed on a block yet/i.test(text) ||
    /transaction hash/i.test(text)
  ) {
    return match[0];
  }
  return null;
}

export async function sendWalletTransaction(send: () => Promise<string>): Promise<string> {
  try {
    return await send();
  } catch (error) {
    const hash = recoverBroadcastTxHash(error);
    if (hash) return hash;
    throw error;
  }
}
