import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { AudioProvider } from "@/components/audio-provider";
import { StickyPlayer } from "@/components/sticky-player";
import { getUserSubscriptionPlan } from "@/lib/subscription";
import { OnboardingGuard } from "@/components/onboarding-guard";
import { auth } from "@/auth";

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
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AudioProvider>
          <OnboardingGuard shouldOnboard={needsOnboarding} />
          <SiteHeader />
          <div className="flex-1 mb-20 pt-12"> {/* Add margin for sticky player and padded top for header spacing */}
            {children}
          </div>
          <StickyPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
