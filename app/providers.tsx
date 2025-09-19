// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  // Лише стабільні гаманці
  const allowedWallets = ["tonkeeper", "mytonwallet", "tonhub"] as const;

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // @ts-expect-error: у версіях 2.3.x цей проп може бути відсутній у d.ts, але підтримується рантаймом SDK
      walletsListConfiguration={{ includeWallets: allowedWallets }}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
