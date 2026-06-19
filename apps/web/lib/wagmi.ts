import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { polygonAmoy } from "viem/chains";
import { http } from "wagmi";

export const wagmiConfig = getDefaultConfig({
  appName: process.env.NEXT_PUBLIC_APP_NAME ?? "NEXUS AI",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "",
  chains: [polygonAmoy],
  transports: {
    [polygonAmoy.id]: http(),
  },
  ssr: true,
});
