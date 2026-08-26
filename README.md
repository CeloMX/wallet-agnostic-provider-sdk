# @neonpay/wallet-embed

Vendor-agnostic **embedded wallet** for React apps. One public API; only one vendor SDK is mounted at a time.

Supports:

- **MiniPay** (Celo miniapp — auto-detected, no picker)
- **Privy**
- **thirdweb** in-app wallets
- **human.tech WaaP** (no API key)

Host apps never import Privy / thirdweb / WaaP hooks. Bridges publish an EIP-1193 session; `useWallet()` stays vendor-agnostic.

## Install

From npm (after you publish):

```bash
npm install @neonpay/wallet-embed
```

From this GitHub repo (source, until npm is live):

```bash
npm install github:CeloMX/wallet-agnostic-provider-sdk
```

Then install **only the vendor SDKs you enable**:

```bash
npm install react react-dom ethers
# pick any subset:
npm install @privy-io/react-auth
npm install thirdweb
npm install @human.tech/waap-sdk
```

Next.js App Router: add `transpilePackages: ['@neonpay/wallet-embed']` in `next.config.js`.

Vite / CRA: no extra config. Do not import this package from Server Components except as a client child.

## 5-minute integration

```tsx
'use client';

import {
  WalletEmbedProvider,
  useWallet,
  ProviderPicker,
  CELO_MAINNET,
  waitForWalletSession,
} from '@neonpay/wallet-embed';
import { useState } from 'react';

export function WalletRoot({ children }: { children: React.ReactNode }) {
  return (
    <WalletEmbedProvider
      config={{
        appName: 'My App',
        namespace: 'myapp', // localStorage: myapp.walletProvider
        defaultProvider: 'privy',
        enabledProviders: ['privy', 'thirdweb', 'waap'],
        chain: {
          ...CELO_MAINNET,
          rpcUrl: process.env.NEXT_PUBLIC_CELO_RPC_URL || CELO_MAINNET.rpcUrl,
        },
        credentials: {
          privy: { appId: process.env.NEXT_PUBLIC_PRIVY_APP_ID || '' },
          thirdweb: { clientId: process.env.NEXT_PUBLIC_THIRDWEB_CLIENT_ID || '' },
          waap: {
            walletConnectProjectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID,
          },
        },
      }}
    >
      {children}
    </WalletEmbedProvider>
  );
}

export function ConnectButton() {
  const wallet = useWallet();
  const [open, setOpen] = useState(false);

  if (wallet.isMiniPay) {
    return (
      <button onClick={() => wallet.connect()} disabled={wallet.isConnecting}>
        {wallet.isConnected ? wallet.address : 'Connect MiniPay'}
      </button>
    );
  }

  return (
    <>
      <button
        onClick={async () => {
          if (wallet.isConnected) {
            await wallet.disconnect();
            return;
          }
          setOpen(true);
        }}
      >
        {wallet.isConnected ? 'Disconnect' : 'Connect'}
      </button>
      <ProviderPicker
        isOpen={open}
        onClose={() => setOpen(false)}
        selected={wallet.selectedProvider}
        onSelect={async (provider) => {
          await wallet.setProvider(provider);
          await waitForWalletSession(provider);
          await wallet.connect();
        }}
      />
    </>
  );
}
```

Wrap the tree **above** any component that calls `useWallet()`.

### What you get from `useWallet()`

```ts
wallet.connect()
wallet.disconnect()
wallet.setProvider('thirdweb') // remounts that SDK only
wallet.signTransaction({ to, data, value })
wallet.signMessage(msg)
wallet.sendToken(token, to, amountAtomic)
wallet.getTokenBalance(token)
wallet.address / isConnected / isMiniPay / selectedProvider
```

Bring your own picker: `getStandaloneProviders()` + `waitForWalletSession(provider)` after `setProvider`.

## Config

| Field | Purpose |
| --- | --- |
| `appName` | Shown in vendor login UIs |
| `namespace` | Prefix for `localStorage` + `CustomEvent` (`{ns}.walletProvider`) |
| `enabledProviders` | Which SDKs to offer. Only install those peer deps |
| `defaultProvider` | Fallback + first-run choice |
| `detectMiniPay` | Auto-connect MiniPay when detected (default `true`) |
| `chain` | Target chain (defaults to Celo mainnet) |
| `credentials` | Vendor keys. WaaP email/phone/social works with **zero** keys |

Same email ≠ same address across vendors (different key systems).

## CSP

Embedded wallets open vendor iframes. Merge `getWalletEmbedCspSources()` into your CSP (`frame-src`, `connect-src`, `child-src`).

## Architecture

```
WalletEmbedProvider          ← config + mount exactly one vendor SDK
  └─ WalletSdkShell          ← lazy Privy | thirdweb | WaaP (never nested)
       └─ *WalletBridge      ← publishes InjectedWalletSession
            └─ useWallet()   ← class adapters, no vendor hook imports
```

MiniPay skips the shell and talks to `window.ethereum`.

## Publish to npm

From this repo root, after `npm login` (create the `@neonpay` org on npm if needed):

```bash
npm publish --access public
```

Bump `version` in `package.json` for later releases.
