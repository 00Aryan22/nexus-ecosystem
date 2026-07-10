import { createConfig, http, fallback, type Config } from "wagmi";
import { injected, walletConnect } from "wagmi/connectors";
import { polygonAmoy } from "viem/chains";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || "ci-placeholder-id";

const metadata = {
  name: process.env.NEXT_PUBLIC_APP_NAME ?? "NEXUS AI",
  description: "AI-powered Web3 operating system for founders",
  url:
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000",
  icons: ["/nexus-ai-logo.svg"],
};

const amoyRpcUrl =
  process.env.NEXT_PUBLIC_POLYGON_AMOY_RPC_URL?.trim() ||
  process.env.NEXT_PUBLIC_ALCHEMY_POLYGON_AMOY_RPC_URL?.trim();

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
    [polygonAmoy.id]: amoyRpcUrl
      ? fallback([http(amoyRpcUrl), http()])
      : http(),
  },
  ssr: true,
}) satisfies Config;
