import { createConfig, http, type Config } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { polygonAmoy } from "viem/chains";

const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || "4e8a90634703200ea82978273daa8c1d";

const metadata = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "NEXUS AI",
  description: "AI-powered Web3 operating system for founders",
  url: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  icons: ["/nexus-ai-logo.svg"],
};

export const wagmiConfig = createConfig({
  chains: [polygonAmoy],
  connectors: [
    injected({ shimDisconnect: true }),
    walletConnect({
      projectId,
      metadata,
      showQrModal: true,
      qrModalOptions: {
        themeMode: "dark",
      },
    }),
  ],
  transports: {
    [polygonAmoy.id]: http(),
  },
  ssr: true,
}) satisfies Config;
