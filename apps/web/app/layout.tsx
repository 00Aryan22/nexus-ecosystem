import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Geist, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEXUS AI",
  description:
    "AI-powered Web3 operating system for founders — reputation, NFT credentials, and agentic startup building.",
  icons: {
    icon: "/nexus-ai-logo.svg",
    apple: "/nexus-ai-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geist.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
