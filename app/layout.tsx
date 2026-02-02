import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Voice Assistant - Second Brain",
  description: "AI-powered voice recording and transcription assistant",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/site.webmanifest",
  openGraph: {
    type: "website",
    title: "Voice Assistant - Second Brain",
    description: "AI-powered voice recording and transcription assistant",
    siteName: "Voice Assistant",
    images: [
      {
        url: "/icon-512.png",
        width: 512,
        height: 512,
        alt: "Voice Assistant Logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Voice Assistant - Second Brain",
    description: "AI-powered voice recording and transcription assistant",
    images: ["/icon-512.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider defaultTheme="system" storageKey="voice-assistant-theme">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
