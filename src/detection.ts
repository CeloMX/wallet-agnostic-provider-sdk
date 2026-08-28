/**
 * Environment detection: MiniPay miniapp vs standalone web.
 */

import { getWalletEmbedConfig } from './config';

export type Environment = 'minipay' | 'standalone';

export function isMiniPayEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  if (!getWalletEmbedConfig().detectMiniPay) return false;

  // MiniPay docs: injected provider is window.ethereum with isMiniPay set.
  // Do not use UA, window.minipay, or selectedAddress — those false-positive on web + Rabby.
  const ethereum = (window as Window & { ethereum?: { isMiniPay?: boolean } }).ethereum;
  return ethereum?.isMiniPay === true;
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
