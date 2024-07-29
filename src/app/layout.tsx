import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Red_Hat_Display } from "next/font/google";
import "./globals.css";

const inter = Red_Hat_Display({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PhantomSign",
  description: "F*ck spam, get codes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
      <Analytics />
      <SpeedInsights />
        {children}
      </body>
    </html>
  );
}
