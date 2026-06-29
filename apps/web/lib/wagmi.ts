import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonAmoy } from "viem/chains";
import { http } from "wagmi";

const walletConnectProjectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID?.trim() || "YOUR_PROJECT_ID";

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "NEXUS AI",
  projectId: walletConnectProjectId,
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
  ssr: true,
});
