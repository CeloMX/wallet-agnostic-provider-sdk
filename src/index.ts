export type {
  StandaloneWalletProviderType,
  WalletProviderType,
  WalletAccount,
  Eip1193Provider,
  InjectedWalletSession,
  WalletProvider,
  TransactionRequest,
  WalletState,
} from './types';

export type {
  WalletEmbedChain,
  WalletEmbedCredentials,
  WalletEmbedConfigInput,
  ResolvedWalletEmbedConfig,
  PrivyLoginMethod,
} from './config';

export {
  CELO_MAINNET,
  configureWalletEmbed,
  getWalletEmbedConfig,
  resolveWalletEmbedConfig,
  getChainIdHex,
} from './config';

export { getEnvironment, isMiniPayEnvironment, isMobileDevice, isDesktopDevice } from './detection';
export type { Environment } from './detection';

export {
  STANDALONE_PROVIDERS,
  DEFAULT_STANDALONE_PROVIDER,
  isStandaloneWalletProvider,
  getStandaloneProviders,
  getDefaultStandaloneProvider,
  getSelectedStandaloneProvider,
  setSelectedStandaloneProvider,
  getProviderDisplayName,
  subscribeProviderSelection,
} from './selection';

export { getWalletSession, setWalletSession, subscribeWalletSession } from './session';
export { waitForWalletSession } from './waitForSession';
export { ERC20_ABI, encodeTransfer, encodeApprove } from './erc20';
export { recoverBroadcastTxHash, sendWalletTransaction } from './recoverTxHash';
export {
  getWalletProvider,
  getProviderByType,
  MiniPayProvider,
  PrivyProvider,
  ThirdwebWalletProvider,
  WaapProvider,
} from './providers';
export { getWalletEmbedCspSources } from './csp';
export type { WalletEmbedCspSources } from './csp';

export { WalletEmbedProvider } from './react/WalletEmbedProvider';
export { WalletSdkShell, preloadWalletSdk } from './react/WalletSdkShell';
export { useWallet } from './react/useWallet';
export type { UseWalletReturn } from './react/useWallet';
export { ProviderPicker } from './react/ProviderPicker';
export type { ProviderPickerProps } from './react/ProviderPicker';
