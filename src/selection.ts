/**
 * Standalone wallet provider selection (persisted).
 * MiniPay is never stored here — it auto-wins when detected.
 */

import { getWalletEmbedConfig } from './config';
import type { StandaloneWalletProviderType } from './types';

export const STANDALONE_PROVIDERS: StandaloneWalletProviderType[] = [
  'privy',
  'thirdweb',
  'waap',
];

/** Fallback before WalletEmbedProvider configures the SDK. */
export const DEFAULT_STANDALONE_PROVIDER: StandaloneWalletProviderType = 'privy';

export function isStandaloneWalletProvider(
  value: unknown
): value is StandaloneWalletProviderType {
  return value === 'privy' || value === 'thirdweb' || value === 'waap';
}

export function getStandaloneProviders(): StandaloneWalletProviderType[] {
  const enabled = getWalletEmbedConfig().enabledProviders;
  return STANDALONE_PROVIDERS.filter((provider) => enabled.includes(provider));
}

export function getDefaultStandaloneProvider(): StandaloneWalletProviderType {
  const { defaultProvider, enabledProviders } = getWalletEmbedConfig();
  if (enabledProviders.includes(defaultProvider)) return defaultProvider;
  return enabledProviders[0] || DEFAULT_STANDALONE_PROVIDER;
}

export function getSelectedStandaloneProvider(): StandaloneWalletProviderType {
  const fallback = getDefaultStandaloneProvider();
  if (typeof window === 'undefined') return fallback;

  try {
    const raw = localStorage.getItem(getWalletEmbedConfig().storageKey);
    if (isStandaloneWalletProvider(raw)) {
      const enabled = getWalletEmbedConfig().enabledProviders;
      if (enabled.includes(raw)) return raw;
    }
  } catch {
    // ignore storage errors
  }

  return fallback;
}

export function setSelectedStandaloneProvider(
  provider: StandaloneWalletProviderType
): void {
  if (typeof window === 'undefined') return;
  const { storageKey, eventName } = getWalletEmbedConfig();

  try {
    localStorage.setItem(storageKey, provider);
  } catch {
    // ignore storage errors
  }

  window.dispatchEvent(new CustomEvent(eventName, { detail: provider }));
}

export function getProviderDisplayName(
  provider: StandaloneWalletProviderType | 'minipay'
): string {
  switch (provider) {
    case 'privy':
      return 'Privy';
    case 'thirdweb':
      return 'thirdweb';
    case 'waap':
      return 'human.tech';
    case 'minipay':
      return 'MiniPay';
    default:
      return provider;
  }
}

export function subscribeProviderSelection(
  listener: (provider: StandaloneWalletProviderType) => void
): () => void {
  if (typeof window === 'undefined') return () => {};

  const onChange = (event: Event) => {
    const detail = (event as CustomEvent<StandaloneWalletProviderType>).detail;
    if (isStandaloneWalletProvider(detail)) {
      listener(detail);
    } else {
      listener(getSelectedStandaloneProvider());
    }
  };

  const eventName = getWalletEmbedConfig().eventName;
  window.addEventListener(eventName, onChange);
  return () => window.removeEventListener(eventName, onChange);
}
