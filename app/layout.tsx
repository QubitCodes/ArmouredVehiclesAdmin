import { Orbitron, Inter } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";

import { Toaster } from "@/components/ui/sonner";
import { ReactQueryProvider } from "@/components/providers";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
  variable: "--font-orbitron",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "ArmoredMart Admin",
  description: "Admin panel for managing ArmoredMart products, orders, and admins.",
  icons: {
    icon: "/images/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${orbitron.variable}`}>
      <body className="min-h-screen bg-background antialiased font-sans" suppressHydrationWarning>
        <ReactQueryProvider>{children}</ReactQueryProvider>
        <Toaster position="top-right" />
      </body>
    </html>
  );
}

