# @celomx/wallet-embed

Vendor-agnostic **embedded wallet** for React. One public API; only one vendor SDK is mounted at a time.

**npm:** [`@celomx/wallet-embed`](https://www.npmjs.com/package/@celomx/wallet-embed)  
**Source:** [CeloMX/wallet-agnostic-provider-sdk](https://github.com/CeloMX/wallet-agnostic-provider-sdk)

Supports:

- **MiniPay** (Celo miniapp — auto-detected, no picker)
- **Privy**
- **thirdweb** in-app wallets
- **human.tech WaaP** (no API key)

Host apps never import Privy / thirdweb / WaaP hooks. Bridges publish an EIP-1193 session; `useWallet()` stays vendor-agnostic.

## Install

```bash
npm install @celomx/wallet-embed
```

From GitHub (source):

```bash
npm install github:CeloMX/wallet-agnostic-provider-sdk
```

Then install **only the vendor SDKs you enable**:

```bash
npm install react react-dom ethers
npm install @privy-io/react-auth   # if using Privy
npm install thirdweb               # if using thirdweb
npm install @human.tech/waap-sdk   # if using human.tech
```

**Next.js App Router:** add `transpilePackages: ['@celomx/wallet-embed']` in `next.config.js`. Do not import this package from Server Components except as a client child.

Vite / CRA: no extra config.

## 5-minute integration

```tsx
'use client';

import {
  WalletEmbedProvider,
  useWallet,
  ProviderPicker,
  CELO_MAINNET,
  waitForWalletSession,
} from '@celomx/wallet-embed';
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

### `useWallet()`

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

Typical env vars (you pass them into `credentials` / `chain` — the SDK does not read `process.env` itself):

```bash
NEXT_PUBLIC_PRIVY_APP_ID=
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=   # optional, WaaP external wallets
NEXT_PUBLIC_WAAP_USE_STAGING=false
NEXT_PUBLIC_CELO_RPC_URL=https://forno.celo.org
```

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

Package name: **`@celomx/wallet-embed`** (npm org: [celomx](https://www.npmjs.com/settings/celomx/packages)).

```bash
npm login
npm publish --access public
```

If the CLI hangs on browser/passkey auth, create a granular access token with publish permission and:

```bash
npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
npm publish --access public
```

Bump `version` in `package.json` for later releases.

## License

MIT
