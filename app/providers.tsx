// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

// Локальний список (public/wallets-allow.json)
const WALLETS_LIST_SOURCE = "/wallets-allow.json";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // Використовуємо локальний список дозволених гаманців
      // (Tonkeeper, MyTonWallet, Tonhub)
      // @ts-expect-error: типи SDK 2.3.x не включають walletsListSource, але в рантаймі працює
      walletsListSource={WALLETS_LIST_SOURCE}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
