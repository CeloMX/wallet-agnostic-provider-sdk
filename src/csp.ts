/**
 * Extra CSP origins needed by Privy, thirdweb, and human.tech WaaP.
 * Merge these into your app CSP (Next.js `headers()`, nginx, Cloudflare).
 */

export type WalletEmbedCspSources = {
  scriptSrc: string[];
  styleSrc: string[];
  childSrc: string[];
  frameSrc: string[];
  connectSrc: string[];
};

const PRIVY = {
  scriptSrc: ['https://challenges.cloudflare.com'],
  childSrc: ['https://auth.privy.io', 'https://verify.walletconnect.com', 'https://verify.walletconnect.org'],
  frameSrc: [
    'https://auth.privy.io',
    'https://verify.walletconnect.com',
    'https://verify.walletconnect.org',
    'https://challenges.cloudflare.com',
  ],
  connectSrc: [
    'https://auth.privy.io',
    'wss://relay.walletconnect.com',
    'wss://relay.walletconnect.org',
    'wss://www.walletlink.org',
    'https://*.rpc.privy.systems',
    'https://explorer-api.walletconnect.com',
  ],
};

const THIRDWEB = {
  childSrc: ['https://*.thirdweb.com', 'https://thirdweb.com'],
  frameSrc: ['https://*.thirdweb.com', 'https://thirdweb.com'],
  connectSrc: [
    'https://*.thirdweb.com',
    'https://thirdweb.com',
    'https://api.thirdweb.com',
    'https://embedded-wallet.thirdweb.com',
    'https://bundler.thirdweb.com',
    'https://pay.thirdweb.com',
    'wss://*.thirdweb.com',
  ],
};

const WAAP = {
  childSrc: [
    'https://*.human.tech',
    'https://human.tech',
    'https://silksecure.net',
    'https://*.silksecure.net',
    'https://waap.xyz',
    'https://*.waap.xyz',
    'https://auth.waap.xyz',
    'https://staging.waap.xyz',
    'https://*.silk.sc',
    'https://*.silkwallet.net',
    'https://*.silk-protector.com',
    'https://*.silk-protector-microservice-pe.com',
    'https://*.silk-protector-microservice-km.com',
    'https://*.evervault.com',
    'https://*.fly.dev',
  ],
  frameSrc: [
    'https://*.human.tech',
    'https://human.tech',
    'https://accounts.google.com',
    'https://twitter.com',
    'https://x.com',
    'https://discord.com',
    'https://*.google.com',
    'https://appleid.apple.com',
    'https://silksecure.net',
    'https://*.silksecure.net',
    'https://waap.xyz',
    'https://*.waap.xyz',
    'https://auth.waap.xyz',
    'https://staging.waap.xyz',
    'https://*.silk.sc',
    'https://*.silkwallet.net',
    'https://*.evervault.com',
    'https://*.fly.dev',
    'https://staging.human-wallet.com',
  ],
  connectSrc: [
    'https://*.human.tech',
    'https://human.tech',
    'wss://*.human.tech',
    'https://silksecure.net',
    'https://*.silksecure.net',
    'https://waap.xyz',
    'https://*.waap.xyz',
    'https://auth.waap.xyz',
    'https://staging.waap.xyz',
    'https://staging.human-wallet.com',
    'https://*.silk.sc',
    'https://dashboard.silk.sc',
    'https://server.silkwallet.net',
    'https://*.silkwallet.net',
    'https://*.silk-protector.com',
    'https://main.silk-protector.com',
    'https://*.silk-protector-microservice-pe.com',
    'https://*.silk-protector-microservice-km.com',
    'https://lbr.silk-protector-microservice-pe.com',
    'https://lbr.silk-protector-microservice-km.com',
    'https://*.evervault.com',
    'https://*.fly.dev',
    'https://prod-waap-ws-relay.fly.dev',
    'https://staging-waap-ws-relay.fly.dev',
    'wss://prod-waap-ws-relay.fly.dev',
    'wss://staging-waap-ws-relay.fly.dev',
    'wss://*.fly.dev',
    'https://imagedelivery.net',
  ],
};

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

/**
 * CSP extras for the vendors you enable. Always include `blob:` on child-src
 * and worker-src for WalletConnect / iframes.
 */
export function getWalletEmbedCspSources(options?: {
  privy?: boolean;
  thirdweb?: boolean;
  waap?: boolean;
}): WalletEmbedCspSources {
  const privy = options?.privy !== false;
  const thirdweb = options?.thirdweb !== false;
  const waap = options?.waap !== false;

  return {
    scriptSrc: unique([...(privy ? PRIVY.scriptSrc : [])]),
    styleSrc: ['https://fonts.googleapis.com'],
    childSrc: unique([
      'blob:',
      ...(privy ? PRIVY.childSrc : []),
      ...(thirdweb ? THIRDWEB.childSrc : []),
      ...(waap ? WAAP.childSrc : []),
    ]),
    frameSrc: unique([
      ...(privy ? PRIVY.frameSrc : []),
      ...(thirdweb ? THIRDWEB.frameSrc : []),
      ...(waap ? WAAP.frameSrc : []),
    ]),
    connectSrc: unique([
      ...(privy ? PRIVY.connectSrc : []),
      ...(thirdweb ? THIRDWEB.connectSrc : []),
      ...(waap ? WAAP.connectSrc : []),
    ]),
  };
}
