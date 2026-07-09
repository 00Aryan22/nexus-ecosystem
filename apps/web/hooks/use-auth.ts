"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  const hasInitializedSessionRef = useRef(false);
  const signInAttemptRef = useRef<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const me = await authApi.fetchMe();
      setUser(me);
    } catch (error) {
      console.error("[Auth] refresh session failed", error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasInitializedSessionRef.current) return;
    hasInitializedSessionRef.current = true;
    void refresh();
  }, [refresh]);

  const getNextPath = () => {
    if (typeof window === "undefined") return "/dashboard";
    const params = new URLSearchParams(window.location.search);
    return params.get("next") || "/dashboard";
  };

  const signIn = useCallback(
    async (signInAddress?: string) => {
      const walletAddress = signInAddress || address;
      if (!walletAddress) {
        return null;
      }
      const normalizedAddress = walletAddress.toLowerCase();
      if (user?.wallet_address?.toLowerCase() === normalizedAddress) {
        return user;
      }
      if (signInAttemptRef.current === normalizedAddress) {
        return null;
      }
      signInAttemptRef.current = normalizedAddress;
      setSigningIn(true);
      try {
        const { message } = await authApi.fetchNonce(walletAddress);
        const signature = await signMessageAsync({ message });
        const verifiedUser = await authApi.verifySignature({
          wallet: walletAddress,
          signature,
          message,
        });
        setUser(verifiedUser);
        router.push(getNextPath());
        return verifiedUser;
      } catch (error) {
        console.error("[Auth] signIn failed", error);
        throw error;
      } finally {
        signInAttemptRef.current = null;
        setSigningIn(false);
      }
    },
    [address, signMessageAsync, router, user]
  );

  const signOut = useCallback(async () => {
    await authApi.logout();
    setUser(null);
    router.refresh();
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
