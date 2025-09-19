// app/providers.tsx
"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Абсолютний URL маніфеста: спершу з ENV, інакше з поточного origin
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://magtcoin.com";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  return <TonConnectUIProvider manifestUrl={manifestUrl}>{children}</TonConnectUIProvider>;
}
