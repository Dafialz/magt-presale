// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

const EXCLUDED = ["blitzwallet"] as const;

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  // Обходимо «дірку» в d.ts 2.3.x без any і без ts-ignore:
  // формуємо значення як unknown і приводимо до потрібного типу при передачі.
  const walletsListConfiguration = { excludeWallets: EXCLUDED } as unknown;

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // d.ts у 2.3.x може не мати цього поля, але рантайм SDK його підтримує
      walletsListConfiguration={walletsListConfiguration as never}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
