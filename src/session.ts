/**
 * Module-level wallet session bus.
 * Vendor React bridges publish sessions; class adapters subscribe/read.
 */

import type { InjectedWalletSession } from './types';

type SessionListener = (session: InjectedWalletSession | null) => void;

let currentSession: InjectedWalletSession | null = null;
const listeners = new Set<SessionListener>();

export function getWalletSession(): InjectedWalletSession | null {
  return currentSession;
}

export function setWalletSession(session: InjectedWalletSession | null): void {
  currentSession = session;
  listeners.forEach((listener) => listener(currentSession));
}

export function subscribeWalletSession(listener: SessionListener): () => void {
  listeners.add(listener);
  listener(currentSession);
  return () => {
    listeners.delete(listener);
  };
}
