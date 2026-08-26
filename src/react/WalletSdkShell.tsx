'use client';

/**
 * Mounts exactly one wallet SDK for standalone mode based on persisted selection.
 * MiniPay environments skip all embedded SDK wrappers.
 *
 * Dynamic SDK chunks can fail after a stale/restarted bundler (ChunkLoadError).
 * We catch that and fall back to the configured default provider.
 */

import React, {
  Component,
  lazy,
  Suspense,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { getWalletEmbedConfig } from '../config';
import { getEnvironment } from '../detection';
import {
  getDefaultStandaloneProvider,
  getSelectedStandaloneProvider,
  setSelectedStandaloneProvider,
  subscribeProviderSelection,
} from '../selection';
import type { StandaloneWalletProviderType } from '../types';

function PassThrough({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function isChunkLoadError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const err = error as { name?: string; message?: string };
  return (
    err.name === 'ChunkLoadError' ||
    /Loading chunk [\w-]+ failed/i.test(err.message || '') ||
    /Failed to fetch dynamically imported module/i.test(err.message || '')
  );
}

function loadWalletSdk(
  label: string,
  importer: () => Promise<{ default: ComponentType<{ children: ReactNode }> }>
) {
  return lazy(() =>
    importer().catch((error: unknown) => {
      console.error(`[WalletSdkShell] Failed to load ${label} SDK chunk`, error);
      return { default: PassThrough };
    })
  );
}

const PrivyProviderWrapper = loadWalletSdk('Privy', () =>
  import('./PrivyProvider').then((m) => ({ default: m.PrivyProviderWrapper }))
);

const ThirdwebProviderWrapper = loadWalletSdk('thirdweb', () =>
  import('./ThirdwebProvider').then((m) => ({
    default: m.ThirdwebProviderWrapper,
  }))
);

const WaapProviderWrapper = loadWalletSdk('WaaP', () =>
  import('./WaapProvider').then((m) => ({ default: m.WaapProviderWrapper }))
);

type BoundaryProps = {
  provider: StandaloneWalletProviderType;
  onChunkError: (provider: StandaloneWalletProviderType) => void;
  children: ReactNode;
};

type BoundaryState = { failed: boolean };

class WalletSdkErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false };

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (isChunkLoadError(error)) {
      this.props.onChunkError(this.props.provider);
    } else {
      console.error('[WalletSdkShell] Wallet SDK render error', error);
    }
  }

  componentDidUpdate(prevProps: BoundaryProps) {
    if (prevProps.provider !== this.props.provider && this.state.failed) {
      this.setState({ failed: false });
    }
  }

  render() {
    if (this.state.failed) {
      const fallback = getDefaultStandaloneProvider();
      if (fallback === 'thirdweb') {
        return <ThirdwebProviderWrapper>{this.props.children}</ThirdwebProviderWrapper>;
      }
      if (fallback === 'waap') {
        return <WaapProviderWrapper>{this.props.children}</WaapProviderWrapper>;
      }
      return <PrivyProviderWrapper>{this.props.children}</PrivyProviderWrapper>;
    }
    return this.props.children;
  }
}

function SdkForProvider({
  provider,
  children,
}: {
  provider: StandaloneWalletProviderType;
  children: ReactNode;
}) {
  const enabled = getWalletEmbedConfig().enabledProviders;
  const selected = enabled.includes(provider) ? provider : getDefaultStandaloneProvider();

  let sdk: ReactNode;
  if (selected === 'thirdweb') {
    sdk = <ThirdwebProviderWrapper>{children}</ThirdwebProviderWrapper>;
  } else if (selected === 'waap') {
    sdk = <WaapProviderWrapper>{children}</WaapProviderWrapper>;
  } else {
    sdk = <PrivyProviderWrapper>{children}</PrivyProviderWrapper>;
  }

  return <Suspense fallback={<>{children}</>}>{sdk}</Suspense>;
}

export function WalletSdkShell({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  const [selected, setSelected] = useState<StandaloneWalletProviderType>(
    getDefaultStandaloneProvider()
  );
  const [isMiniPay, setIsMiniPay] = useState(false);

  useEffect(() => {
    setMounted(true);
    setIsMiniPay(getEnvironment() === 'minipay');
    setSelected(getSelectedStandaloneProvider());

    return subscribeProviderSelection((provider) => {
      setSelected(provider);
    });
  }, []);

  const handleChunkError = (provider: StandaloneWalletProviderType) => {
    const fallback = getDefaultStandaloneProvider();
    console.warn(
      `[WalletSdkShell] ${provider} chunk failed; falling back to ${fallback}. Hard-refresh if this persists.`
    );
    if (provider !== fallback) {
      setSelectedStandaloneProvider(fallback);
      setSelected(fallback);
    }
  };

  if (!mounted) {
    return <>{children}</>;
  }

  if (isMiniPay) {
    return <>{children}</>;
  }

  return (
    <WalletSdkErrorBoundary provider={selected} onChunkError={handleChunkError}>
      <SdkForProvider provider={selected}>{children}</SdkForProvider>
    </WalletSdkErrorBoundary>
  );
}
