'use client';

/**
 * thirdweb client + provider wrapper with session bridge.
 */

import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import {
  ThirdwebProvider,
  useActiveAccount,
  useActiveWallet,
  useActiveWalletChain,
  useConnectModal,
  useDisconnect,
} from 'thirdweb/react';
import { createThirdwebClient } from 'thirdweb';
import { defineChain } from 'thirdweb/chains';
import { inAppWallet, EIP1193 } from 'thirdweb/wallets';
import { getWalletEmbedConfig } from '../config';
import { setWalletSession } from '../session';
import type { Eip1193Provider } from '../types';

function useEmbedChain() {
  return useMemo(() => {
    const { chain } = getWalletEmbedConfig();
    return defineChain({
      id: chain.id,
      name: chain.name,
      nativeCurrency: chain.nativeCurrency,
      rpc: chain.rpcUrl,
    });
  }, []);
}

function ThirdwebWalletBridge({ children }: { children: ReactNode }) {
  const { credentials, chain: chainConfig } = getWalletEmbedConfig();
  const clientId = credentials.thirdweb?.clientId || '';
  const client = useMemo(
    () =>
      createThirdwebClient({
        clientId: clientId || 'placeholder',
      }),
    [clientId]
  );
  const embedChain = useEmbedChain();
  const account = useActiveAccount();
  const wallet = useActiveWallet();
  const chain = useActiveWalletChain();
  const { connect, isConnecting } = useConnectModal();
  const { disconnect } = useDisconnect();

  const eip1193 = useMemo<Eip1193Provider | null>(() => {
    if (!wallet) return null;
    try {
      return EIP1193.toProvider({
        wallet,
        client,
        chain: chain || embedChain,
      }) as Eip1193Provider;
    } catch {
      return null;
    }
  }, [wallet, chain, client, embedChain]);

  const login = useCallback(async () => {
    await connect({
      client,
      chain: embedChain,
      wallets: [
        inAppWallet({
          auth: {
            options: ['email', 'phone', 'google', 'apple', 'passkey'],
          },
        }),
      ],
    });
  }, [connect, client, embedChain]);

  const logout = useCallback(async () => {
    if (wallet) {
      await disconnect(wallet);
    }
  }, [disconnect, wallet]);

  useEffect(() => {
    setWalletSession({
      providerType: 'thirdweb',
      ready: Boolean(clientId) || true,
      authenticated: Boolean(account?.address),
      address: account?.address || null,
      chainId: chain?.id || chainConfig.id,
      login,
      logout,
      eip1193,
      signMessage: account
        ? async (message: string) => {
            const sig = await account.signMessage({ message });
            return typeof sig === 'string' ? sig : String(sig);
          }
        : undefined,
    });
  }, [account, chain, chainConfig.id, clientId, eip1193, login, logout, isConnecting]);

  useEffect(() => {
    return () => setWalletSession(null);
  }, []);

  return <>{children}</>;
}

export function ThirdwebProviderWrapper({ children }: { children: ReactNode }) {
  return (
    <ThirdwebProvider>
      <ThirdwebWalletBridge>{children}</ThirdwebWalletBridge>
    </ThirdwebProvider>
  );
}
