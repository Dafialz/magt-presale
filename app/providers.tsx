// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста: спершу з ENV, інакше з поточного origin
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // @ts-ignore — сумісність версій: у вашій d.ts ще може не бути цього пропа,
      // але він підтримується у рантаймі SDK; приховуємо проблемний BlitzWallet
      walletsListConfiguration={{ excludeWallets: ["blitzwallet"] }}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
