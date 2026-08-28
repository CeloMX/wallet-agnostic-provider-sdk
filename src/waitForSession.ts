/**
 * Wait until the selected vendor bridge has published a ready session.
 */

import { getWalletSession, subscribeWalletSession } from './session';
import type { StandaloneWalletProviderType } from './types';

export function waitForWalletSession(
  providerType: StandaloneWalletProviderType,
  timeoutMs = 45000
): Promise<void> {
  const current = getWalletSession();
  if (current?.providerType === providerType && current.ready) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      unsubscribe();
      reject(
        new Error(
          `${providerType} wallet SDK did not become ready in time. Hard-refresh and try again, or pick another provider.`
        )
      );
    }, timeoutMs);

    const unsubscribe = subscribeWalletSession((session) => {
      if (session?.providerType === providerType && session.ready) {
        clearTimeout(timer);
        unsubscribe();
        resolve();
      }
    });
  });
}
