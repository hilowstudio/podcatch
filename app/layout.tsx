import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { AudioProvider } from "@/components/audio-provider";
import { StickyPlayer } from "@/components/sticky-player";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { InstallPrompt } from "@/components/install-prompt";
import { BottomNav } from "@/components/bottom-nav";
import { NetworkStatus } from "@/components/network-status";
import { auth } from "@/auth";
import { SerwistProvider } from "@/components/serwist-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
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
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
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
  const session = await auth();
  const subscriptionPlan = await getUserSubscriptionPlan();

  // If user is logged in BUT has no stripePriceId (and getUserSubscriptionPlan returns falsy for it), they need onboarding.
  // Note: getUserSubscriptionPlan returns a default object if no user, so we must check session.user too.
  const needsOnboarding = !!session?.user && !subscriptionPlan.stripePriceId;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
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
                    href_matches: ["/search", "/chat", "/collections", "/profile", "/pricing"]
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <SerwistProvider>
          <AudioProvider>
            <NetworkStatus />
            <OnboardingGuard shouldOnboard={needsOnboarding} />
            <SiteHeader />
            <div className="flex-1 mb-20 pt-12"> {/* Add margin for sticky player and padded top for header spacing */}
              {children}
            </div>
            <StickyPlayer />
            <BottomNav />
            <InstallPrompt />
          </AudioProvider>
        </SerwistProvider>
      </body>
    </html>
  );
}
