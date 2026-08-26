/**
 * Unified wallet types for MiniPay, Privy, thirdweb, and human.tech WaaP.
 */

export type StandaloneWalletProviderType = 'privy' | 'thirdweb' | 'waap';

export type WalletProviderType = 'minipay' | StandaloneWalletProviderType | 'none';

export interface WalletAccount {
  address: string;
  isConnected: boolean;
  chainId?: number;
}

export interface Eip1193Provider {
  request(args: { method: string; params?: unknown[] | Record<string, unknown> }): Promise<unknown>;
  on?(event: string, handler: (...args: unknown[]) => void): void;
  removeListener?(event: string, handler: (...args: unknown[]) => void): void;
}

/**
 * Session injected by vendor React bridges into class adapters.
 * Keeps useWallet free of vendor hook imports.
 */
export interface InjectedWalletSession {
  providerType: StandaloneWalletProviderType;
  ready: boolean;
  authenticated: boolean;
  address: string | null;
  chainId?: number;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  eip1193: Eip1193Provider | null;
  signMessage?: (message: string) => Promise<string>;
}

export interface WalletProvider {
  getType(): WalletProviderType;
  isAvailable(): boolean;
  connect(): Promise<WalletAccount>;
  disconnect(): Promise<void>;
  getAccount(): Promise<WalletAccount | null>;
  getAddress(): Promise<string | null>;
  signTransaction(transaction: TransactionRequest): Promise<string>;
  signMessage(message: string): Promise<string>;
  getChainId(): Promise<number>;
  switchChain?(chainId: number): Promise<void>;
  onAccountChange?(callback: (account: WalletAccount | null) => void): () => void;
  initialize?(session: InjectedWalletSession): void;
}

export interface TransactionRequest {
  from?: string;
  to: string;
  value?: string;
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
}

export interface WalletState {
  provider: WalletProviderType;
  account: WalletAccount | null;
  isConnecting: boolean;
  error: string | null;
}
