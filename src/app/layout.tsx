import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

/**
 * next/font downloads the font at build time and serves it from your own
 * domain. No request to Google at runtime, no layout shift while it loads,
 * and nothing for a cookie banner to worry about.
 *
 * If the designer confirms a different family, this is the only line to
 * change — everything else reads --font-jakarta through the theme.
 */
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://locksec.app",
  ),
  title: {
    default: "LockSec — Estate access control",
    // Every page sets its own title; this frames it.
    template: "%s · LockSec",
  },
  description:
    "Residents create access codes for their visitors. Security checks them at the gate. Estate admins see every entry and every payment in one place.",
  applicationName: "LockSec",
  openGraph: {
    type: "website",
    siteName: "LockSec",
    title: "LockSec — Estate access control",
    description:
      "Create visitor access codes, verify them at the gate, and manage estate dues.",
  },
  twitter: { card: "summary_large_image" },
  robots: {
    // The marketing page should be indexed. Everything behind a login should
    // not be — see the per-route metadata in the app sections.
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0d17",
  // The security app is used one-handed at a gate; letting it zoom is an
  // accessibility requirement, so we do not lock user-scalable.
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={jakarta.variable}>
      <body className="font-sans antialiased">
        {/* Lets a keyboard or screen-reader user jump past navigation
            straight to the page content. Invisible until focused. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-field focus:bg-brand focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
