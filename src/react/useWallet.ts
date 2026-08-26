'use client';

/**
 * Unified wallet hook.
 * Vendor-agnostic — does not import Privy / thirdweb / WaaP hooks.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { JsonRpcProvider, Contract } from 'ethers';
import { getWalletEmbedConfig } from '../config';
import { getEnvironment } from '../detection';
import { ERC20_ABI, encodeTransfer } from '../erc20';
import { getWalletProvider } from '../providers';
import { sendWalletTransaction } from '../recoverTxHash';
import {
  getSelectedStandaloneProvider,
  setSelectedStandaloneProvider,
  subscribeProviderSelection,
} from '../selection';
import { subscribeWalletSession } from '../session';
import type {
  WalletProvider,
  WalletState,
  TransactionRequest,
  StandaloneWalletProviderType,
  WalletProviderType,
} from '../types';

export function useWallet() {
  const [standaloneChoice, setStandaloneChoice] = useState<StandaloneWalletProviderType>(
    () => (typeof window !== 'undefined' ? getSelectedStandaloneProvider() : 'privy')
  );
  const [state, setState] = useState<WalletState>({
    provider: 'none',
    account: null,
    isConnecting: false,
    error: null,
  });
  const providerRef = useRef<WalletProvider | null>(null);

  const provider = useMemo(() => {
    void standaloneChoice;
    const p = getWalletProvider();
    providerRef.current = p;
    return p;
  }, [standaloneChoice]);

  useEffect(() => {
    return subscribeProviderSelection((next) => {
      setStandaloneChoice(next);
    });
  }, []);

  useEffect(() => {
    if (!provider) {
      setState((prev) => ({ ...prev, provider: 'none' }));
      return;
    }
    setState((prev) => ({ ...prev, provider: provider.getType() }));
  }, [provider]);

  const checkConnection = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return;

    try {
      const account = await p.getAccount();
      setState((prev) => ({
        ...prev,
        account,
        isConnecting: false,
        error: null,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    return subscribeWalletSession(() => {
      void checkConnection();
    });
  }, [checkConnection, provider]);

  const connect = useCallback(async () => {
    const p = providerRef.current;
    if (!p) {
      setState((prev) => ({
        ...prev,
        error: 'No wallet provider available',
      }));
      return;
    }

    setState((prev) => ({ ...prev, isConnecting: true, error: null }));

    try {
      const account = await p.connect();
      setState((prev) => ({
        ...prev,
        account,
        isConnecting: false,
        error: null,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: message,
      }));
      throw error;
    }
  }, []);

  const disconnect = useCallback(async () => {
    const p = providerRef.current;
    if (!p) return;

    try {
      await p.disconnect();
      setState((prev) => ({
        ...prev,
        account: null,
        isConnecting: false,
        error: null,
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({
        ...prev,
        error: message,
      }));
    }
  }, []);

  useEffect(() => {
    if (!provider) return;

    const env = getEnvironment();

    if (env === 'minipay' && provider.getType() === 'minipay') {
      void connect();
    } else {
      void checkConnection();
    }

    if (provider.onAccountChange) {
      const cleanup = provider.onAccountChange((account) => {
        setState((prev) => ({
          ...prev,
          account,
          isConnecting: false,
        }));
      });
      return cleanup;
    }
  }, [provider, connect, checkConnection]);

  const setProvider = useCallback(
    async (next: StandaloneWalletProviderType) => {
      if (getEnvironment() === 'minipay') {
        return;
      }

      if (state.account) {
        try {
          await disconnect();
        } catch {
          // continue switching even if disconnect fails
        }
      }

      setSelectedStandaloneProvider(next);
      setStandaloneChoice(next);
      setState((prev) => ({
        ...prev,
        provider: next,
        account: null,
        error: null,
      }));
    },
    [disconnect, state.account]
  );

  const signTransaction = useCallback(
    async (transaction: TransactionRequest): Promise<string> => {
      const p = providerRef.current;
      if (!p) throw new Error('No wallet provider available');
      const account = state.account;
      if (!account) throw new Error('Wallet not connected');
      return await sendWalletTransaction(() =>
        p.signTransaction({
          ...transaction,
          from: transaction.from || account.address,
        })
      );
    },
    [state.account]
  );

  const signMessage = useCallback(
    async (message: string): Promise<string> => {
      const p = providerRef.current;
      if (!p) throw new Error('No wallet provider available');
      if (!state.account) throw new Error('Wallet not connected');
      return await p.signMessage(message);
    },
    [state.account]
  );

  const getAddress = useCallback(async (): Promise<string | null> => {
    const p = providerRef.current;
    if (!p) return null;
    return await p.getAddress();
  }, []);

  const getRpc = useCallback(() => {
    return getWalletEmbedConfig().chain.rpcUrl;
  }, []);

  const getTokenBalance = useCallback(
    async (tokenAddress: string, address?: string) => {
      const addr = address || state.account?.address;
      if (!addr) throw new Error('address_required');
      const providerRpc = new JsonRpcProvider(getRpc());
      const erc = new Contract(tokenAddress, ERC20_ABI, providerRpc);
      const [bal, dec, sym] = await Promise.all([
        erc.balanceOf(addr),
        erc.decimals(),
        erc.symbol(),
      ]);
      return { balance: BigInt(bal.toString()), decimals: Number(dec), symbol: String(sym) };
    },
    [state.account?.address, getRpc]
  );

  const sendToken = useCallback(
    async (
      tokenAddress: string,
      to: string,
      amountAtomic: bigint,
      gasLimit?: string,
      gasPrice?: string
    ) => {
      const p = providerRef.current;
      if (!p) throw new Error('No wallet provider available');
      if (!state.account) throw new Error('Wallet not connected');
      const data = encodeTransfer(to, amountAtomic);
      const tx: TransactionRequest = {
        from: state.account.address,
        to: tokenAddress,
        data,
        value: '0x0',
        gasLimit,
        gasPrice,
      };
      return await sendWalletTransaction(() => p.signTransaction(tx));
    },
    [state.account]
  );

  const activeType: WalletProviderType =
    getEnvironment() === 'minipay' && provider?.getType() === 'minipay'
      ? 'minipay'
      : standaloneChoice;

  return {
    ...state,
    provider: activeType,
    selectedProvider: standaloneChoice,
    isConnected: !!state.account,
    address: state.account?.address || null,
    environment: getEnvironment(),
    isMiniPay: getEnvironment() === 'minipay',
    connect,
    disconnect,
    setProvider,
    signTransaction,
    signMessage,
    getAddress,
    checkConnection,
    getTokenBalance,
    sendToken,
    providerInstance: provider,
  };
}

export type UseWalletReturn = ReturnType<typeof useWallet>;
