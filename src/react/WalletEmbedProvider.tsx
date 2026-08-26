'use client';

import { useRef, type ReactNode } from 'react';
import {
  configureWalletEmbed,
  type WalletEmbedConfigInput,
} from '../config';
import { WalletSdkShell } from './WalletSdkShell';

export function WalletEmbedProvider({
  config,
  children,
}: {
  config: WalletEmbedConfigInput;
  children: ReactNode;
}) {
  const last = useRef('');
  const key = JSON.stringify(config);
  if (last.current !== key) {
    configureWalletEmbed(config);
    last.current = key;
  }

  return <WalletSdkShell>{children}</WalletSdkShell>;
}
