import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { AudioProvider } from "@/components/audio-provider";
import { StickyPlayer } from "@/components/sticky-player";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <AudioProvider>
          <SiteHeader />
          <div className="flex-1 mb-20"> {/* Add margin for sticky player */}
            {children}
          </div>
          <StickyPlayer />
        </AudioProvider>
      </body>
    </html>
  );
}
