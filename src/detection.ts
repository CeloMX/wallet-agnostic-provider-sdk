/**
 * Environment detection: MiniPay miniapp vs standalone web.
 */

import { getWalletEmbedConfig } from './config';

export type Environment = 'minipay' | 'standalone';

export function isMiniPayEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getWalletEmbedConfig().detectMiniPay) return false;

  const ethereum = (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum;
  if (ethereum?.isMiniPay === true) return true;

  if ((window as Window & { minipay?: unknown }).minipay) return true;

  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes('minipay') || userAgent.includes('opera mini')) {
    return true;
  }

  return false;
}

export function getEnvironment(): Environment {
  return isMiniPayEnvironment() ? 'minipay' : 'standalone';
}

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

export function isDesktopDevice(): boolean {
  return !isMobileDevice();
}
