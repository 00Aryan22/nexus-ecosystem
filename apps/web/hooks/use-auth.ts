"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { useRouter } from "next/navigation";

import * as authApi from "@/lib/api/auth";
import type { UserPublic } from "@/lib/api/auth";

export function useAuth() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const router = useRouter();
  const [user, setUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingIn, setSigningIn] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.fetchMe();
      setUser(me);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const signIn = useCallback(async () => {
    if (!address) return;
    setSigningIn(true);
    try {
      const { message } = await authApi.fetchNonce(address);
      const signature = await signMessageAsync({ message });
      const verifiedUser = await authApi.verifySignature({
        wallet: address,
        signature,
        message,
      });
      setUser(verifiedUser);
      router.push("/dashboard");
    } finally {
      setSigningIn(false);
    }
  }, [address, signMessageAsync, router]);

  const signOut = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.push("/");
  }, [router]);

  return {
    user,
    setUser,
    loading,
    signingIn,
    isConnected,
    address,
    signIn,
    signOut,
    refresh,
    isAuthenticated: Boolean(user),
  };
}
