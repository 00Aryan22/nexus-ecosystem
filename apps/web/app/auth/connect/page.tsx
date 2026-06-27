"use client";

import { ConnectWalletButton } from "@/components/auth/connect-wallet-button";
import { motion } from "framer-motion";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthConnectPage() {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-surface-obsidian">
      {/* Background gradients */}
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at 50% 0%, rgba(59,130,246,0.15), transparent 50%), radial-gradient(circle at 50% 100%, rgba(168,85,247,0.1), transparent 50%)",
        }}
      />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="glass-card relative z-10 mx-5 w-full max-w-md p-8 text-center shadow-2xl"
      >
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-surface-slate border border-border-muted shadow-inner">
          <ShieldCheck className="h-8 w-8 text-neon-blue" />
        </div>
        
        <p className="font-mono text-[10px] uppercase tracking-widest text-neon-blue font-semibold mb-2">
          Secure Authentication
        </p>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-foreground">
          Connect your wallet
        </h1>
        <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
          Sign in with MetaMask or WalletConnect. Your session is cryptographically secured via SIWE (Sign-In with Ethereum).
        </p>
        
        <div className="mt-8 space-y-4">
          <ConnectWalletButton />
          
          <div className="pt-4 mt-4 border-t border-border-muted/50">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground" asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
