// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";
import React from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста: з ENV або з поточного origin
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  // Вайтліст стабільних гаманців (обхід типів 2.3.x — у рантаймі працює коректно)
  const walletsListConfiguration: any = {
    includeWallets: ["tonkeeper", "mytonwallet", "tonhub"],
  };

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // у d.ts для 2.3.x це проп може бути відсутній, але SDK його підтримує
      walletsListConfiguration={walletsListConfiguration}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
