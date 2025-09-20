// app/providers.tsx
"use client";

import { TonConnectUIProvider, THEME } from "@tonconnect/ui-react";

const ALLOWED_IDS = ["tonkeeper", "mytonwallet", "tonhub"] as const;

// Невеликий «білий» список (тільки 3 гаманці). Решта просто не потраплять у модалку й
// SDK не буде тягнути їхні логотипи/бріджі.
const walletsListSource =
  "https://raw.githubusercontent.com/ton-connect/wallets-list/master/wallets.json?only=tonkeeper,mytonwallet,tonhub";

export default function Providers({ children }: { children: React.ReactNode }) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider
      manifestUrl={manifestUrl}
      // @ts-expect-error: проп є у рантаймі, типи 2.3.x його ще можуть не знати
      walletsListConfiguration={{
        includeWallets: ALLOWED_IDS,
        excludeWallets: ["blitzwallet"],
      }}
      // @ts-expect-error: те саме — у рантаймі працює
      walletsListSource={walletsListSource}
      uiPreferences={{ theme: THEME.DARK }}
    >
      {children}
    </TonConnectUIProvider>
  );
}
