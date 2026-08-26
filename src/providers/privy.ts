/**
 * Privy adapter — consumes InjectedWalletSession from PrivyWalletBridge.
 * No React / @privy-io imports here.
 */

import { getWalletEmbedConfig } from '../config';
import { getWalletSession, subscribeWalletSession } from '../session';
import type {
  WalletProvider,
  WalletAccount,
  TransactionRequest,
  InjectedWalletSession,
} from '../types';

export class PrivyProvider implements WalletProvider {
  private session: InjectedWalletSession | null = null;
  private account: WalletAccount | null = null;
  private unsubscribe: (() => void) | null = null;

  constructor() {
    this.session = getWalletSession();
    this.unsubscribe = subscribeWalletSession((session) => {
      if (session?.providerType === 'privy' || session === null) {
        this.session = session?.providerType === 'privy' ? session : null;
      }
    });
  }

  getType(): 'privy' {
    return 'privy';
  }

  isAvailable(): boolean {
    return true;
  }

  initialize(session: InjectedWalletSession): void {
    if (session.providerType !== 'privy') return;
    this.session = session;
  }

  private requireSession(): InjectedWalletSession {
    const session = this.session || getWalletSession();
    if (!session || session.providerType !== 'privy') {
      throw new Error('Privy not initialized. Wait for PrivyWalletBridge.');
    }
    this.session = session;
    return session;
  }

  async connect(): Promise<WalletAccount> {
    const session = this.requireSession();

    if (!session.ready) {
      throw new Error('Privy is not ready');
    }

    if (!session.authenticated) {
      await session.login();
    }

    const address = session.address;
    if (!address) {
      throw new Error('No wallet address found');
    }

    this.account = {
      address,
      isConnected: true,
      chainId: session.chainId || getWalletEmbedConfig().chain.id,
    };

    return this.account;
  }

  async disconnect(): Promise<void> {
    const session = this.session || getWalletSession();
    if (session?.providerType === 'privy') {
      await session.logout();
    }
    this.account = null;
  }

  async getAccount(): Promise<WalletAccount | null> {
    const session = this.session || getWalletSession();
    if (!session || session.providerType !== 'privy' || !session.authenticated) {
      this.account = null;
      return null;
    }

    if (!session.address) {
      this.account = null;
      return null;
    }

    this.account = {
      address: session.address,
      isConnected: true,
      chainId: session.chainId || getWalletEmbedConfig().chain.id,
    };

    return this.account;
  }

  async getAddress(): Promise<string | null> {
    const account = await this.getAccount();
    return account?.address || null;
  }

  async signTransaction(transaction: TransactionRequest): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    const session = this.requireSession();
    const provider = session.eip1193;
    if (!provider?.request) {
      throw new Error('No EIP-1193 provider available from Privy');
    }

    const txHash = await provider.request({
      method: 'eth_sendTransaction',
      params: [
        {
          from: this.account.address,
          to: transaction.to,
          value: transaction.value || '0x0',
          data: transaction.data || '0x',
          gas: transaction.gasLimit,
          gasPrice: transaction.gasPrice,
          chainId: `0x${getWalletEmbedConfig().chain.id.toString(16)}`,
        },
      ],
    });

    return String(txHash);
  }

  async signMessage(message: string): Promise<string> {
    if (!this.account) {
      throw new Error('Wallet not connected');
    }

    const session = this.requireSession();

    if (session.signMessage) {
      return session.signMessage(message);
    }

    const provider = session.eip1193;
    if (!provider?.request) {
      throw new Error('No sign method available from Privy');
    }

    const signature = await provider.request({
      method: 'personal_sign',
      params: [message, this.account.address],
    });

    return String(signature);
  }

  async getChainId(): Promise<number> {
    return this.session?.chainId || getWalletEmbedConfig().chain.id;
  }

  onAccountChange(callback: (account: WalletAccount | null) => void): () => void {
    return subscribeWalletSession(async (session) => {
      if (session?.providerType !== 'privy') {
        callback(null);
        return;
      }
      const account = await this.getAccount();
      callback(account);
    });
  }
}
