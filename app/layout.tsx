import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Libre_Baskerville, Public_Sans, Vollkorn } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { AudioProvider } from "@/components/audio-provider";
import { StickyPlayer } from "@/components/sticky-player";
import { InstallPrompt } from "@/components/install-prompt";
import { BottomNav } from "@/components/bottom-nav";
import { NetworkStatus } from "@/components/network-status";
import { SerwistProvider } from "@/components/serwist-provider";
import { ThemeScript } from "@/components/theme-script";
import { SiteFooter } from "@/components/site-footer";
import { auth } from "@/auth";

// Hi Low type, self-hosted by next/font (no requests to Google at runtime)
const publicSans = Public_Sans({
  variable: "--font-public-sans",
  subsets: ["latin"],
});

const vollkorn = Vollkorn({
  variable: "--font-vollkorn",
  subsets: ["latin"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const libreBaskerville = Libre_Baskerville({
  variable: "--font-libre-baskerville",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Podcatch",
  description: "Turn listening into knowledge. Automatically sync podcast transcripts and AI insights directly to your Claude Projects.",
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
      { url: '/apple-icon-167x167.png', sizes: '167x167', type: 'image/png' },
      { url: '/apple-icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/apple-icon-120x120.png', sizes: '120x120', type: 'image/png' },
      { url: '/apple-icon-76x76.png', sizes: '76x76', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8f5f0' },
    { media: '(prefers-color-scheme: dark)', color: '#16181c' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover', // Important for safe-area-inset-*
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // A new account starts on Free and can use the app at once; nobody is held
  // on the pricing page before they've listened to anything.
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ThemeScript />
        {/* iOS PWA Meta Tags */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Podcatch" />
        <link rel="apple-touch-startup-image" href="/apple-icon.png" />
        {/* Android PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        {/* Speculation Rules for Predictive Prefetching */}
        <script
          type="speculationrules"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              prerender: [
                {
                  where: {
                    href_matches: ["/search", "/snips", "/collections"]
                  },
                  eagerness: "moderate"
                }
              ],
              prefetch: [
                {
                  where: {
                    selector_matches: "a[href^='/feeds'], a[href^='/episodes']"
                  },
                  eagerness: "conservative"
                }
              ]
            })
          }}
        />
      </head>
      <body
        className={`${publicSans.variable} ${vollkorn.variable} ${plexMono.variable} ${libreBaskerville.variable} font-sans antialiased min-h-screen flex flex-col`}
      >
        <SerwistProvider>
          <AudioProvider signedIn={!!session?.user}>
            <NetworkStatus />
            <SiteHeader />
            {/* Signed in: room at the bottom for the player and, on phones, the
                bottom bar. Signed out: the footer with Privacy, Terms, Contact. */}
            <main id="main" className={session?.user ? "flex-1 pb-40 md:pb-28" : "flex-1 pb-12"}>
              {children}
            </main>
            {!session?.user && <SiteFooter />}
            <StickyPlayer />
            <BottomNav signedIn={!!session?.user} />
            <InstallPrompt />
          </AudioProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
