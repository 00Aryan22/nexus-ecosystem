"use client";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { user, loading, signOut, address } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading session…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <p className="font-mono text-xs uppercase tracking-widest text-neon-blue">
        Main Dashboard
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-geist)] text-3xl font-bold">
        Welcome to NEXUS AI
      </h1>
      <div className="glass-card mt-8 p-6">
        <p className="text-sm text-muted-foreground">Authenticated wallet</p>
        <p className="mt-2 font-mono text-sm">{user?.wallet_address ?? address}</p>
        <p className="mt-4 text-sm text-muted-foreground">Role</p>
        <p className="font-mono text-sm capitalize">{user?.role ?? "founder"}</p>
        <Button variant="outline" className="mt-6" onClick={() => void signOut()}>
          Sign Out
        </Button>
      </div>
    </div>
  );
}
