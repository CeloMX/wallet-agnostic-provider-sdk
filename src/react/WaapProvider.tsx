'use client';

/**
 * human.tech WaaP — no API key required.
 * Pattern: initWaaP → window.waap (EIP-1193).
 *
 * @see https://docs.wallet.human.tech/quick-start
 */

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { getChainIdHex, getWalletEmbedConfig } from '../config';
import { setWalletSession } from '../session';
import type { Eip1193Provider } from '../types';

type WaapProviderApi = Eip1193Provider & {
  login?: () => Promise<string | null>;
  logout?: () => Promise<void>;
  isConnected?: () => boolean;
  getLoginMethod?: () => string | null;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getWaap(): WaapProviderApi | undefined {
  if (typeof window === 'undefined') return undefined;
  return (window as Window & { waap?: WaapProviderApi }).waap;
}

async function ensureConfiguredChain(waap: WaapProviderApi): Promise<void> {
  const { chain } = getWalletEmbedConfig();
  const chainIdHex = getChainIdHex();
  try {
    const current = await waap.request({ method: 'eth_chainId' });
    if (String(current).toLowerCase() === chainIdHex.toLowerCase()) return;
    try {
      await waap.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: chainIdHex }],
      });
    } catch {
      await waap.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: chainIdHex,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency,
            rpcUrls: [chain.rpcUrl],
            blockExplorerUrls: chain.blockExplorerUrl ? [chain.blockExplorerUrl] : undefined,
          },
        ],
      });
    }
  } catch (error) {
    console.warn('[WAAP] Could not ensure configured network', error);
  }
}

function WaapWalletBridge({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const initOnce = useRef(false);

  useEffect(() => {
    if (initOnce.current) return;
    initOnce.current = true;

    const initialize = async () => {
      const config = getWalletEmbedConfig();
      try {
        const waapSdk = await import('@human.tech/waap-sdk');
        const walletConnectProjectId = config.credentials.waap?.walletConnectProjectId;

        const authenticationMethods: Array<
          'email' | 'phone' | 'social' | 'biometrics' | 'wallet'
        > = walletConnectProjectId
          ? ['email', 'phone', 'social', 'biometrics', 'wallet']
          : ['email', 'phone', 'social', 'biometrics'];

        waapSdk.initWaaP({
          useStaging: Boolean(config.credentials.waap?.useStaging),
          walletConnectProjectId,
          config: {
            authenticationMethods,
            allowedSocials: ['google', 'twitter', 'discord'],
            styles: {
              darkMode: false,
            },
            showSecured: true,
          },
          project: {
            name: config.appName,
            entryTitle: config.loginTitle,
          },
        });

        let provider = getWaap();
        for (let i = 0; i < 20 && !provider; i++) {
          await new Promise((r) => setTimeout(r, 100));
          provider = getWaap();
        }

        if (!provider) {
          console.warn('[WAAP] initWaaP ran but window.waap is missing');
          setReady(false);
          setWalletSession({
            providerType: 'waap',
            ready: false,
            authenticated: false,
            address: null,
            chainId: config.chain.id,
            login: async () => {
              throw new Error('WaaP SDK did not initialize (window.waap missing)');
            },
            logout: async () => {},
            eip1193: null,
          });
          return;
        }

        setReady(true);
      } catch (error) {
        console.error('[WAAP] Failed to init', error);
        setReady(false);
      }
    };

    void initialize();
  }, []);

  const login = useCallback(async () => {
    const waap = getWaap();
    if (!waap?.login) {
      throw new Error('WaaP login unavailable — SDK not initialized');
    }

    const loginType = await waap.login();
    if (loginType === null) {
      throw new Error('Login cancelled');
    }

    await ensureConfiguredChain(waap);

    const accounts = (await waap.request({
      method: 'eth_requestAccounts',
    })) as string[];

    if (!accounts?.length) {
      throw new Error('No accounts returned from human.tech');
    }
  }, []);

  const logout = useCallback(async () => {
    const waap = getWaap();
    if (waap?.logout) {
      await waap.logout();
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    const waap = getWaap();
    if (!waap) return;

    let cancelled = false;

    const publish = async () => {
      const eip1193 = getWaap() || null;
      let address: string | null = null;
      try {
        if (eip1193?.request) {
          const accounts = (await eip1193.request({
            method: 'eth_accounts',
          })) as string[];
          address = accounts?.[0] || null;
        }
      } catch {
        address = null;
      }

      if (cancelled) return;

      setWalletSession({
        providerType: 'waap',
        ready: Boolean(getWaap()),
        authenticated: Boolean(address),
        address,
        chainId: getWalletEmbedConfig().chain.id,
        login,
        logout,
        eip1193,
      });
    };

    void publish();

    const onAccounts = () => {
      void publish();
    };
    waap.on?.('accountsChanged', onAccounts);
    waap.on?.('connect', onAccounts);
    waap.on?.('disconnect', onAccounts);

    const id = window.setInterval(() => {
      void publish();
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(id);
      getWaap()?.removeListener?.('accountsChanged', onAccounts);
      getWaap()?.removeListener?.('connect', onAccounts);
      getWaap()?.removeListener?.('disconnect', onAccounts);
    };
  }, [ready, login, logout]);

  useEffect(() => {
    return () => setWalletSession(null);
  }, []);

  return <>{children}</>;
}

export function WaapProviderWrapper({ children }: { children: ReactNode }) {
  return <WaapWalletBridge>{children}</WaapWalletBridge>;
}
