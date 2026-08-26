'use client';

/**
 * Mounts Privy only when selected for standalone mode.
 */

import type { ReactNode } from 'react';
import { PrivyProvider } from '@privy-io/react-auth';
import { getWalletEmbedConfig } from '../config';
import { PrivyWalletBridge } from './PrivyWalletBridge';

export function PrivyProviderWrapper({ children }: { children: ReactNode }) {
  const { credentials } = getWalletEmbedConfig();
  const appId = credentials.privy?.appId || '';
  const loginMethods = credentials.privy?.loginMethods || ['email', 'sms', 'passkey'];

  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: loginMethods as Array<
          'email' | 'sms' | 'passkey' | 'wallet' | 'google' | 'apple' | 'twitter' | 'discord' | 'github'
        >,
        appearance: {
          theme: 'light',
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets',
          },
        },
      }}
    >
      <PrivyWalletBridge>{children}</PrivyWalletBridge>
    </PrivyProvider>
  );
}
