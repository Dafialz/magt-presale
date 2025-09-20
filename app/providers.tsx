// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

// Дозволяємо тільки ці гаманці
const ALLOWED_IDS: string[] = ["tonkeeper", "mytonwallet", "tonhub"];

// “Білий” список джерела — SDK не тягнутиме інші гаманці/бріджі
const WALLETS_LIST_SOURCE =
  "https://raw.githubusercontent.com/ton-connect/wallets-list/master/wallets.json?only=tonkeeper,mytonwallet,tonhub";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  // Обходимо різницю в типах 2.3.x: прокидаємо пропи через об’єкт any
  const compatProps: any = {
    walletsListConfiguration: {
      includeWallets: ALLOWED_IDS,
      excludeWallets: ["blitzwallet"],
    },
    walletsListSource: WALLETS_LIST_SOURCE,
  };

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      {...compatProps}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
