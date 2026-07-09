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
    console.debug("[Auth] refresh session start");
    try {
      const me = await authApi.fetchMe();
      console.debug("[Auth] refresh session result", { me });
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
      console.debug("[Auth] signIn start", { walletAddress });
      if (!walletAddress) {
        console.debug("[Auth] signIn aborted: no address");
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
        console.debug("[Auth] signIn fetched nonce", { message });
        const signature = await signMessageAsync({ message });
        console.debug("[Auth] signIn got signature", { signature: signature?.slice(0, 8) });
        const verifiedUser = await authApi.verifySignature({
          wallet: walletAddress,
          signature,
          message,
        });
        console.debug("[Auth] signIn verified user", { wallet: verifiedUser.wallet_address });
        setUser(verifiedUser);
        router.push(getNextPath());
        console.debug("[Auth] signIn redirect", { next: getNextPath() });
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
