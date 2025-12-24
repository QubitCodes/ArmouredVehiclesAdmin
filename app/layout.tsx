import type { Metadata } from "next";
import { Orbitron } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/components/providers";

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ArmoredMart Admin",
  description: "Admin panel for managing ArmoredMart products, orders, and admins.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`min-h-screen bg-background antialiased ${orbitron.className}`}>
        <ReactQueryProvider>{children}</ReactQueryProvider>
      </body>
    </html>
  );
}

