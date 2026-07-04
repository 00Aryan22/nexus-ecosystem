"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAccount, useConnect, useDisconnect, useSwitchChain } from "wagmi";
import { Loader2, Wallet, ShieldCheck, Smartphone, PlugZap } from "lucide-react";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

type Props = {
  redirectOnSuccess?: boolean;
};

const expectedChainId = Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 80002);

export function ConnectWalletButton({ redirectOnSuccess = true }: Props) {
  const { isConnected, isAuthenticated, signingIn, signIn } = useAuth();
  const { connectAsync, connectors, error, isPending } = useConnect();
  const { address, chainId } = useAccount();
  const { disconnect } = useDisconnect();
  const { switchChainAsync, isPending: isSwitchingChain } = useSwitchChain();
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    if (redirectOnSuccess && isConnected && !isAuthenticated && !signingIn) {
      void signIn();
    }
  }, [isConnected, isAuthenticated, signingIn, signIn, redirectOnSuccess]);

  useEffect(() => {
    if (!isConnected || !address) return;

    if (chainId !== expectedChainId) {
      void switchChainAsync({ chainId: expectedChainId })
        .catch(() => {
          setStatusMessage("Switch to Polygon Amoy to continue.");
        });
    }
  }, [address, chainId, isConnected, switchChainAsync]);

  if (isAuthenticated) {
    return (
      <Button size="lg" className="neon-glow" asChild>
        <Link href="/dashboard">Go to Dashboard</Link>
      </Button>
    );
  }

  const connected = Boolean(address && isConnected);
  const injectedConnector = connectors.find((connector) => connector.id === "injected");
  const walletConnectConnector = connectors.find((connector) => connector.id === "walletConnect");
  const hasInjectedProvider =
    typeof window !== "undefined" && Boolean((window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum);
  const isMetaMaskAvailable = hasInjectedProvider && Boolean((window as Window & { ethereum?: { isMetaMask?: boolean } }).ethereum?.isMetaMask);

  const handleConnect = async (connectorId: string) => {
    const connector = connectorId === "walletConnect" ? walletConnectConnector : injectedConnector;
    if (!connector) {
      setStatusMessage("This wallet option is not available in this browser.");
      return;
    }

    if (connectorId === "injected" && !isMetaMaskAvailable) {
      setStatusMessage("MetaMask is not installed or not available in this browser. Install MetaMask or choose WalletConnect instead.");
      return;
    }

    try {
      setStatusMessage(null);
      await connectAsync({ connector });
      setModalOpen(false);
    } catch (connectError) {
      const message = connectError instanceof Error ? connectError.message : "Unable to connect wallet";
      setStatusMessage(message.includes("Provider not found") ? "No compatible wallet provider was detected. Install MetaMask or try the WalletConnect QR flow." : message);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        className="neon-glow"
        disabled={signingIn || isPending || isSwitchingChain}
        onClick={() => setModalOpen(true)}
      >
        {signingIn ? "Signing in…" : isPending ? "Connecting…" : connected ? "Sign In with Wallet" : "Connect Wallet"}
      </Button>

      {connected && (
        <Button variant="outline" size="sm" onClick={() => disconnect()}>
          Disconnect
        </Button>
      )}

      {statusMessage && (
        <div className="rounded-lg border border-border-muted bg-surface-slate/70 p-3 text-sm text-muted-foreground">
          {statusMessage}
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          {error.message}
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-surface-slate p-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-neon-blue">Wallet</p>
                <h3 className="mt-1 text-lg font-semibold text-foreground">Connect your wallet</h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-md border border-border-muted px-3 py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>

            <p className="mt-3 text-sm text-muted-foreground">
              Choose MetaMask for extension support or WalletConnect for QR and mobile MetaMask flows.
            </p>

            <div className="mt-5 space-y-3">
              <button
                type="button"
                onClick={() => void handleConnect("injected")}
                disabled={!isMetaMaskAvailable}
                className="flex w-full items-center justify-between rounded-xl border border-border-muted bg-black/20 px-4 py-3 text-left transition hover:border-neon-blue/60 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="flex items-center gap-3">
                  <Wallet className="h-5 w-5 text-neon-blue" />
                  <span>
                    <span className="block font-medium text-foreground">MetaMask extension</span>
                    <span className="block text-sm text-muted-foreground">{isMetaMaskAvailable ? "Best for desktop browser wallets" : "Install MetaMask to use this option"}</span>
                  </span>
                </span>
                <PlugZap className="h-4 w-4 text-muted-foreground" />
              </button>

              <button
                type="button"
                onClick={() => void handleConnect("walletConnect")}
                className="flex w-full items-center justify-between rounded-xl border border-border-muted bg-black/20 px-4 py-3 text-left transition hover:border-neon-blue/60 hover:bg-white/5"
              >
                <span className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-neon-purple" />
                  <span>
                    <span className="block font-medium text-foreground">WalletConnect QR</span>
                    <span className="block text-sm text-muted-foreground">Scan with MetaMask Mobile or other wallets</span>
                  </span>
                </span>
                <ShieldCheck className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-border-muted/60 bg-surface-obsidian/70 p-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                {isPending || isSwitchingChain ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                <span>{isPending ? "Waiting for wallet approval…" : isSwitchingChain ? "Switching to Polygon Amoy…" : "The app will automatically request a SIWE sign-in after connection."}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
