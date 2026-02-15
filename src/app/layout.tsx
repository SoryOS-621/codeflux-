/**
 * @file layout.tsx  (Root layout)
 * @description The top-level layout that wraps every page in the app.
 *
 * Responsibilities:
 * - Loads Google Fonts (Geist Sans + Geist Mono)
 * - Wraps the app in the tRPC + TanStack Query provider
 * - Provides light/dark/system theming via next-themes
 * - Shows toast notifications via Sonner
 * - Sets global metadata (page title, description)
 *
 * This is a Server Component — do NOT add "use client" here.
 */

import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CodeFlux — AI Code Generator",
  description: "Describe what you want to build and let AI generate it for you.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <TRPCReactProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider>
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </body>
      </html>
    </TRPCReactProvider>
  );
}
