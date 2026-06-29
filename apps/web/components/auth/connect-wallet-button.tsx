"use client";

import Link from "next/link";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect } from "react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

type Props = {
  redirectOnSuccess?: boolean;
};

export function ConnectWalletButton({ redirectOnSuccess = true }: Props) {
  const { isConnected, isAuthenticated, signingIn, signIn } = useAuth();

  useEffect(() => {
    if (redirectOnSuccess && isConnected && !isAuthenticated && !signingIn) {
      void signIn();
    }
  }, [isConnected, isAuthenticated, signingIn, signIn, redirectOnSuccess]);

  if (isAuthenticated) {
    return (
      <Button size="lg" className="neon-glow" asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    );
  }

  return (
    <ConnectButton.Custom>
      {({ account, chain, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <Button
            size="lg"
            className="neon-glow"
            disabled={!ready || signingIn}
            onClick={connected ? () => void signIn() : openConnectModal}
          >
            {signingIn
              ? "Signing in…"
              : connected
                ? "Sign In with Wallet"
                : "Connect Wallet"}
          </Button>
        );
      }}
    </ConnectButton.Custom>
  );
}
