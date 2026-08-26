/**
 * thirdweb adapter — consumes InjectedWalletSession from ThirdwebWalletBridge.
 */

import { getWalletEmbedConfig } from '../config';
import { getWalletSession, subscribeWalletSession } from '../session';
import type {
  WalletProvider,
  WalletAccount,
  TransactionRequest,
  InjectedWalletSession,
} from '../types';

export class ThirdwebWalletProvider implements WalletProvider {
  private session: InjectedWalletSession | null = null;
  private account: WalletAccount | null = null;

  constructor() {
    this.session = getWalletSession();
    subscribeWalletSession((session) => {
      if (session?.providerType === 'thirdweb' || session === null) {
        this.session = session?.providerType === 'thirdweb' ? session : null;
      }
    });
  }

  getType(): 'thirdweb' {
    return 'thirdweb';
  }

  isAvailable(): boolean {
    return true;
  }

  initialize(session: InjectedWalletSession): void {
    if (session.providerType !== 'thirdweb') return;
    this.session = session;
  }

  private requireSession(): InjectedWalletSession {
    const session = this.session || getWalletSession();
    if (!session || session.providerType !== 'thirdweb') {
      throw new Error('thirdweb not initialized. Wait for ThirdwebWalletBridge.');
    }
    this.session = session;
    return session;
  }

  async connect(): Promise<WalletAccount> {
    const session = this.requireSession();

    if (!session.ready) {
      throw new Error('thirdweb is not ready');
    }

    if (!session.authenticated) {
      await session.login();
    }

    const updated = this.session || getWalletSession();
    const address = updated?.address;
    if (!address) {
      throw new Error('No wallet address found');
    }

    this.account = {
      address,
      isConnected: true,
      chainId: updated?.chainId || getWalletEmbedConfig().chain.id,
    };

    return this.account;
  }

  async disconnect(): Promise<void> {
    const session = this.session || getWalletSession();
    if (session?.providerType === 'thirdweb') {
      await session.logout();
    }
    this.account = null;
  }

  async getAccount(): Promise<WalletAccount | null> {
    const session = this.session || getWalletSession();
    if (!session || session.providerType !== 'thirdweb' || !session.authenticated) {
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
      throw new Error('No EIP-1193 provider available from thirdweb');
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
      throw new Error('No sign method available from thirdweb');
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
      if (session?.providerType !== 'thirdweb') {
        callback(null);
        return;
      }
      callback(await this.getAccount());
    });
  }
}
