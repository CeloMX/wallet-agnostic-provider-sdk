import type { StandaloneWalletProviderType } from './types';

export const CELO_MAINNET = {
  id: 42220,
  name: 'Celo',
  rpcUrl: 'https://forno.celo.org',
  nativeCurrency: { name: 'CELO', symbol: 'CELO', decimals: 18 as const },
  blockExplorerUrl: 'https://celoscan.io',
};

export type WalletEmbedChain = {
  id: number;
  name: string;
  rpcUrl: string;
  nativeCurrency: { name: string; symbol: string; decimals: number };
  blockExplorerUrl?: string;
};

export type PrivyLoginMethod =
  | 'email'
  | 'sms'
  | 'passkey'
  | 'wallet'
  | 'google'
  | 'apple'
  | 'twitter'
  | 'discord'
  | 'github';

export type WalletEmbedCredentials = {
  privy?: {
    appId: string;
    loginMethods?: PrivyLoginMethod[];
  };
  thirdweb?: {
    clientId: string;
  };
  waap?: {
    walletConnectProjectId?: string;
    useStaging?: boolean;
  };
};

export type WalletEmbedConfigInput = {
  /** Shown in vendor login UIs (WaaP project name, etc.). */
  appName: string;
  /** Overrides the WaaP / login modal title. Defaults to `Log in to {appName}`. */
  loginTitle?: string;
  /**
   * Prefix for localStorage + window events.
   * NeonPay uses `neonpay` so existing sessions keep working.
   */
  namespace?: string;
  storageKey?: string;
  eventName?: string;
  defaultProvider?: StandaloneWalletProviderType;
  /** Which vendor SDKs to offer. Only mount / install the ones you list. */
  enabledProviders?: StandaloneWalletProviderType[];
  /** Auto-connect MiniPay when `window.ethereum.isMiniPay` is set. Default true. */
  detectMiniPay?: boolean;
  /** Target chain. Defaults to Celo mainnet. */
  chain?: Partial<WalletEmbedChain>;
  credentials?: WalletEmbedCredentials;
};

export type ResolvedWalletEmbedConfig = {
  appName: string;
  loginTitle: string;
  namespace: string;
  storageKey: string;
  eventName: string;
  defaultProvider: StandaloneWalletProviderType;
  enabledProviders: StandaloneWalletProviderType[];
  detectMiniPay: boolean;
  chain: WalletEmbedChain;
  credentials: WalletEmbedCredentials;
};

const ALL_STANDALONE: StandaloneWalletProviderType[] = ['privy', 'thirdweb', 'waap'];

function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'wallet-embed'
  );
}

function resolveChain(input?: Partial<WalletEmbedChain>): WalletEmbedChain {
  return {
    id: input?.id ?? CELO_MAINNET.id,
    name: input?.name ?? CELO_MAINNET.name,
    rpcUrl: input?.rpcUrl ?? CELO_MAINNET.rpcUrl,
    nativeCurrency: input?.nativeCurrency ?? CELO_MAINNET.nativeCurrency,
    blockExplorerUrl: input?.blockExplorerUrl ?? CELO_MAINNET.blockExplorerUrl,
  };
}

export function resolveWalletEmbedConfig(
  input: WalletEmbedConfigInput
): ResolvedWalletEmbedConfig {
  const namespace = input.namespace || slugify(input.appName);
  const enabledProviders =
    input.enabledProviders?.length ? input.enabledProviders : ALL_STANDALONE;
  const defaultProvider =
    input.defaultProvider && enabledProviders.includes(input.defaultProvider)
      ? input.defaultProvider
      : enabledProviders[0] || 'privy';

  return {
    appName: input.appName,
    loginTitle: input.loginTitle || `Log in to ${input.appName}`,
    namespace,
    storageKey: input.storageKey || `${namespace}.walletProvider`,
    eventName: input.eventName || `${namespace}:wallet-provider-changed`,
    defaultProvider,
    enabledProviders,
    detectMiniPay: input.detectMiniPay !== false,
    chain: resolveChain(input.chain),
    credentials: input.credentials || {},
  };
}

let current: ResolvedWalletEmbedConfig = resolveWalletEmbedConfig({
  appName: 'App',
  namespace: 'wallet-embed',
});

export function configureWalletEmbed(
  input: WalletEmbedConfigInput
): ResolvedWalletEmbedConfig {
  current = resolveWalletEmbedConfig(input);
  return current;
}

export function getWalletEmbedConfig(): ResolvedWalletEmbedConfig {
  return current;
}

export function getChainIdHex(): string {
  return `0x${current.chain.id.toString(16)}`;
}
