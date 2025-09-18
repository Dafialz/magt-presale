// app/providers.tsx
"use client";

import { TonConnectUIProvider } from "@tonconnect/ui-react";
import { Toaster } from "react-hot-toast";

export default function Providers({ children }: { children: React.ReactNode }) {
  // Для TonConnect бажано абсолютне посилання на маніфест
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const base = (process.env.NEXT_PUBLIC_SITE_URL || origin).replace(/\/$/, "");
  const manifestUrl = `${base}/tonconnect-manifest.json`;

  return (
    <TonConnectUIProvider manifestUrl={manifestUrl}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "rgba(17,20,28,0.85)",
            color: "#e7e9ef",
            borderRadius: "12px",
            border: "1px solid rgba(255,255,255,0.12)",
          },
          success: { iconTheme: { primary: "#22c55e", secondary: "#fff" } },
          error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
        }}
      />
    </TonConnectUIProvider>
  );
}
