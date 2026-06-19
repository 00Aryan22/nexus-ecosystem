import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";

export default function AuthConnectPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-blue">
        Authentication
      </p>
      <h1 className="mt-4 font-[family-name:var(--font-geist)] text-3xl font-semibold">
        Connect your wallet
      </h1>
      <p className="mt-3 max-w-md text-center text-muted-foreground">
        Sign in with MetaMask or WalletConnect on Polygon Amoy. Your session is
        stored in a secure httpOnly cookie — never in localStorage.
      </p>
      <div className="mt-8">
        <ConnectWalletButton />
      </div>
    </div>
  );
}
