// app/providers.tsx
"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Для TonConnect бажано абсолютне посилання на маніфест
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
    </TonConnectUIProvider>
  );
}
