// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  // У 2.3.x типи очікують інший формат; у рантаймі SDK приймає рядкові ID.
  // Даємо будь-який тип, щоб TS не лаявся.
  const walletsListConfiguration: any = {
    includeWallets: ["tonkeeper", "mytonwallet", "tonhub"],
  };

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      walletsListConfiguration={walletsListConfiguration}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
