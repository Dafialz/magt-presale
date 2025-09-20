// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

// Можна прибрати includeWallets взагалі, щоб працювали всі підтримувані гаманці.
// BlitzWallet залишаємо у виключеннях — у нього зламаний SSL та бридж.
const EXCLUDED = ["blitzwallet"] as const;

// (опціонально) Якщо хочеш лише 3 перевірені — додай includeWallets назад
// const ALLOWED = ["tonkeeper", "mytonwallet", "tonhub"] as const;

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // Ці пропи є у рантаймі SDK 2.3.x, але можуть бути відсутні в d.ts — приглушаємо TS.
      // @ts-expect-error runtime-compatible in 2.3.x
      walletsListConfiguration={{
        // includeWallets: ALLOWED, // ← розкоментуй, якщо хочеш показувати лише 3 гаманці
        excludeWallets: EXCLUDED,
      }}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
