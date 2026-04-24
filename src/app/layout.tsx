import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import Providers from "@/components/layout/Providers";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: "StallMate - Book Stalls at Events Near You",
    template: "%s | StallMate",
  },
  description:
    "India's premier platform for discovering and booking stalls at community events, corporate expos, and wedding exhibitions in Hyderabad and beyond.",
  keywords: [
    "stall booking",
    "event stalls",
    "gated community events",
    "corporate exhibition",
    "wedding stall",
    "Hyderabad events",
    "vendor marketplace",
  ],
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} font-sans antialiased bg-white`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
