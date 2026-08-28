# @celomx/wallet-embed

## 0.2.0

### Minor Changes

- **Keep the host app mounted across wallet-provider switches.** The selected
  vendor SDK now mounts as a *sibling* of the app (`VendorSdkMount`) instead of
  wrapping `children`. Switching providers remounts only the small SDK subtree,
  so the page — and any open provider-picker modal — no longer tears down
  mid-switch. Vendor login modals render through their own portals, so nothing
  in the app needs to live inside the provider wrapper.
- **Add `preloadWalletSdk(provider?)`.** Warms the vendor SDK chunk(s) ahead of
  selection (all providers when called with no argument) so a provider switch
  does not race the readiness timeout. Exported from the package root.
- **Tighten MiniPay detection.** `isMiniPayEnvironment()` and the MiniPay
  provider now key strictly on `window.ethereum.isMiniPay === true`. User-agent
  sniffing, `window.minipay`, and `ethereum.selectedAddress` were dropped
  because they false-positive on desktop web and injected wallets like Rabby.
- **Never poke `window.ethereum` on web.** Auto-connect of the injected provider
  is gated behind `isMiniPayEnvironment()`; on web the hook only restores an
  existing embedded-wallet session.
- **Longer, clearer readiness timeout.** `waitForWalletSession` now waits 45s
  (was 15s) and, on timeout, tells the user to hard-refresh or pick another
  provider.

## 0.1.0

- Initial public release.
