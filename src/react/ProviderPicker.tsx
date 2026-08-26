'use client';

import { useState } from 'react';
import {
  getProviderDisplayName,
  getStandaloneProviders,
} from '../selection';
import type { StandaloneWalletProviderType } from '../types';

const DESCRIPTIONS: Record<StandaloneWalletProviderType, { en: string; es: string }> = {
  privy: {
    en: 'Email or SMS login with an embedded wallet',
    es: 'Inicio con email o SMS y billetera integrada',
  },
  thirdweb: {
    en: 'In-app wallet via thirdweb (email, phone, social)',
    es: 'Billetera in-app con thirdweb (email, teléfono, social)',
  },
  waap: {
    en: 'human.tech Wallet as a Protocol (EIP-1193)',
    es: 'human.tech Wallet as a Protocol (EIP-1193)',
  },
};

export interface ProviderPickerProps {
  isOpen: boolean;
  onClose: () => void;
  selected: StandaloneWalletProviderType;
  language?: 'en' | 'es';
  connecting?: boolean;
  onSelect: (provider: StandaloneWalletProviderType) => void | Promise<void>;
}

/**
 * Unstyled (inline CSS) provider picker so host apps don't need Tailwind.
 * NeonPay keeps its own themed modal; other apps can use this or roll their own.
 */
export function ProviderPicker({
  isOpen,
  onClose,
  selected,
  language = 'en',
  connecting = false,
  onSelect,
}: ProviderPickerProps) {
  const [pending, setPending] = useState<StandaloneWalletProviderType | null>(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const title = language === 'es' ? 'Elige proveedor de billetera' : 'Choose wallet provider';
  const subtitle =
    language === 'es'
      ? 'Puedes cambiarlo después. Cada proveedor crea una billetera distinta.'
      : 'You can change this later. Each provider creates a different wallet.';

  const handleSelect = async (provider: StandaloneWalletProviderType) => {
    setError('');
    setPending(provider);
    try {
      await onSelect(provider);
      onClose();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : '';
      setError(message || (language === 'es' ? 'Error al conectar' : 'Failed to connect'));
    } finally {
      setPending(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="wallet-embed-picker-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.45)',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: '#fff',
          color: '#111',
          borderRadius: 16,
          padding: 20,
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="wallet-embed-picker-title" style={{ margin: '0 0 8px', fontSize: 18 }}>
          {title}
        </h2>
        <p style={{ margin: '0 0 16px', fontSize: 14, opacity: 0.7 }}>{subtitle}</p>
        {error ? (
          <div style={{ marginBottom: 12, fontSize: 14, color: '#b42318' }}>{error}</div>
        ) : null}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {getStandaloneProviders().map((provider) => {
            const active = selected === provider;
            const loading = connecting || pending === provider;
            return (
              <button
                key={provider}
                type="button"
                disabled={loading}
                onClick={() => handleSelect(provider)}
                style={{
                  textAlign: 'left',
                  borderRadius: 12,
                  border: active ? '2px solid #111' : '2px solid #e5e5e5',
                  background: active ? '#f5f5f5' : '#fff',
                  padding: 14,
                  cursor: loading ? 'wait' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                <div style={{ fontWeight: 600 }}>{getProviderDisplayName(provider)}</div>
                <div style={{ fontSize: 13, opacity: 0.7, marginTop: 4 }}>
                  {DESCRIPTIONS[provider][language]}
                </div>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={onClose}
          disabled={!!pending}
          style={{
            marginTop: 16,
            width: '100%',
            padding: '10px 12px',
            borderRadius: 10,
            border: '1px solid #ddd',
            background: '#fafafa',
            cursor: 'pointer',
          }}
        >
          {language === 'es' ? 'Cancelar' : 'Cancel'}
        </button>
      </div>
    </div>
  );
}
