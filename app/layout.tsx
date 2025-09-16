// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "MAGT Presale",
  description: "Claim & presale for Magic Time (MAGT) on TON",
  icons: { icon: "/favicon.png" },
  openGraph: {
    title: "MAGT Presale",
    description: "Claim & presale for Magic Time (MAGT) on TON",
    images: ["/logo.png"]
  },
  twitter: {
    card: "summary",
    title: "MAGT Presale",
    description: "Claim & presale for Magic Time (MAGT) on TON",
    images: ["/logo.png"]
  },
  themeColor: "#0b1120"
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
