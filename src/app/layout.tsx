import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { UpdateNotification } from "@/components/UpdateNotification";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Resonant - Breathing Timer",
  description: "Box breathing timer with gentle chimes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Resonant",
  },
  icons: {
    icon: "/icon-192.png",
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f172a" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-slate-900">
      <head>
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="supported-color-schemes" content="dark" />
      </head>
      <body className={`${inter.variable} font-sans antialiased bg-gradient-to-b from-slate-900 to-slate-800 min-h-[100dvh]`}>
        {children}
        <UpdateNotification />
      </body>
    </html>
  );
}
