import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

import { Inter } from "next/font/google";
import localFont from "next/font/local";

import { Providers } from "~/providers";
import "~/styles/globals.css";

// Force dynamic rendering to avoid static generation issues with client-side hooks
export const dynamic = "force-dynamic";

/**
 * Inter Font - Primary UI font for Latin characters
 */
const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

/**
 * Pretendard Font - Korean text font
 * Loaded as local font for better performance
 */
const pretendard = localFont({
  src: [
    {
      path: "../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2",
      weight: "45 920",
      style: "normal",
    },
  ],
  variable: "--font-pretendard",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Lecture MoA",
    template: "%s | Lecture MoA",
  },
  description: "AI-powered learning platform for interactive course management",
  keywords: ["education", "learning", "AI", "courses", "lecture"],
  authors: [{ name: "Lecture MoA Team" }],
  creator: "Lecture MoA",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: "Lecture MoA",
    description: "AI-powered learning platform for interactive course management",
    siteName: "Lecture MoA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Lecture MoA",
    description: "AI-powered learning platform for interactive course management",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
};

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="ko"
      className={`${inter.variable} ${pretendard.variable}`}
      suppressHydrationWarning
    >
      <body className="font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
