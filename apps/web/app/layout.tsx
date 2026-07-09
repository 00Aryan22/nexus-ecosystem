import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { ToastContainer } from "@/components/ui/toast";
import "./globals.css";

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
      <head>
        {/* Fonts loaded via CSS @import in globals.css — avoids build-time network fetches */}
      </head>
      <body className="min-h-screen font-sans">
        <Providers>
          {children}
          <ToastContainer />
        </Providers>
      </body>
    </html>
  );
}
