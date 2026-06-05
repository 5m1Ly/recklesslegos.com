import { GoogleAnalytics } from "@next/third-parties/google";
import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Spectral } from "next/font/google";
import "./globals.css";

// Google Analytics 4 measurement ID (e.g. "G-XXXXXXXXXX"). When unset — local
// dev, previews — the GA script is omitted entirely.
const gaId = process.env.NEXT_PUBLIC_GA_ID;

const spectral = Spectral({
  variable: "--font-spectral",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "RecklessBricks",
  description:
    "A centralized archive of the publicly available videos, documents, social-media posts, police footage, and developments surrounding the Cedar Hollow / Cogwheel Collectibles incident.",
  icons: {
    icon: [
      { url: "/favicon.png", type: "image/png" },
      { url: "/icon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-64.png", sizes: "64x64", type: "image/png" },
    ],
    apple: [{ url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    shortcut: ["/favicon.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${spectral.variable} ${ibmPlexSans.variable} ${ibmPlexMono.variable}`}
      style={
        {
          "--serif": "var(--font-spectral), Georgia, serif",
          "--sans": "var(--font-ibm-plex-sans), system-ui, sans-serif",
          "--mono": "var(--font-ibm-plex-mono), ui-monospace, monospace",
        } as React.CSSProperties
      }
    >
      <body>{children}</body>
      {gaId ? <GoogleAnalytics gaId={gaId} /> : null}
    </html>
  );
}
