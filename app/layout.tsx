// app/layout.tsx
import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";
import { Toaster } from "react-hot-toast";

// Базовий сайт (для абсолютних OG/Canonical)
const siteUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "") || "https://magtcoin.com";
const ogImage = `${siteUrl}/og.png`;
const ogImageSmall = `${siteUrl}/og-600x315.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "MAGT Presale — Magic Time на TON",
    template: "%s | MAGT Presale",
  },
  description:
    "Прозорий ончейн-пресейл токена Magic Time (MAGT) у мережі TON. Купуй за TON, миттєва доставка jetton.",
  applicationName: "MAGT Presale",
  keywords: ["MAGT", "Magic Time", "TON", "presale", "jetton", "крипта", "ончейн"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  formatDetection: { telephone: false, email: false, address: false },
  themeColor: "#0b1120",
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/favicon.png",
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "uk-UA": siteUrl,
    },
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "MAGT Presale",
    title: "MAGT Presale — Magic Time на TON",
    description:
      "Ціль: 6,500,000 TON. Купуй MAGT швидко, прозоро, ончейн. Мінімальний внесок 0.1 TON.",
    locale: "uk_UA",
    images: [
      { url: ogImage, width: 1200, height: 630, alt: "MAGT Presale" },
      { url: ogImageSmall, width: 600, height: 315, alt: "MAGT Presale" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAGT Presale — Magic Time на TON",
    description:
      "Пресейл MAGT у мережі TON. Миттєва ончейн-доставка jetton. Мінімум 0.1 TON.",
    images: [ogImage, ogImageSmall],
    // site: "@your_handle",
  },
};

// (для мобільних темної теми)
export const viewport: Viewport = {
  themeColor: "#0b1120",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // JSON-LD (структуровані дані)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "MAGT Presale",
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteUrl}/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="uk">
      <head>
        {/* JSON-LD для кращого SEO */}
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <Providers>
          {/* Глобальний контейнер для тостів */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "rgba(17,20,28,0.85)",
                color: "#e7e9ef",
                border: "1px solid rgba(255,255,255,0.12)",
              },
              success: { iconTheme: { primary: "#22c55e", secondary: "#0a0b10" } },
              error: { iconTheme: { primary: "#ef4444", secondary: "#0a0b10" } },
            }}
          />
          {children}
        </Providers>
      </body>
    </html>
  );
}
