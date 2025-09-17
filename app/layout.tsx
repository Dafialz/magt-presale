// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "Magic Time (MAGT) — Presale",
  description: "Claim & presale для Magic Time (MAGT) у мережі TON",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "Magic Time (MAGT) — Presale",
    description: "Claim & presale для Magic Time (MAGT) у мережі TON",
    images: ["/logo.png"],
  },
  twitter: {
    card: "summary",
    title: "Magic Time (MAGT) — Presale",
    description: "Claim & presale для Magic Time (MAGT) у мережі TON",
    images: ["/logo.png"],
  },
  themeColor: "#0a0b10",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        {/* TonConnect manifest for wallets */}
        <meta name="tonconnect-manifest" content="/tonconnect-manifest.json" />
      </head>
      <body>
        <Providers>
          {children}
          {/* Портал для модалок/тостів (за потреби) */}
          <div id="portal-root" />
        </Providers>
      </body>
    </html>
  );
}
