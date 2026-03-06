"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "../lib/supabase";
import type { Session, User, SupabaseClient } from "@supabase/supabase-js";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  signingOut: boolean;
  signOut: () => Promise<void>;
  initialized: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function useAuth() {
  const v = useContext(AuthContext);
  if (!v) throw new Error("useAuth must be used within AuthProvider");
  return v;
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [signingOut, setSigningOut] = useState(false);
  const [initialized, setInitialized] = useState(false);

  const supabaseRef = useRef<SupabaseClient | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!supabaseRef.current) {
      try {
        supabaseRef.current = createClient();
      } catch (err) {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_DEBUG === "true") {
          console.warn("Supabase client init failed:", err);
        }
      }
    }

    (async () => {
      try {
        const s = await supabaseRef.current?.auth.getSession();
        if (!mounted) return;
        const sess = s?.data?.session || null;
        setSession(sess);
        setUser(sess?.user || null);
      } catch (err) {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_DEBUG === "true") {
          console.warn("getSession error", err);
        }
      } finally {
        if (mounted) setInitialized(true);
      }
    })();

    const { data: sub } = supabaseRef.current?.auth.onAuthStateChange((event, sess) => {
      const current = (sess as any) || null;
      setSession(current);
      setUser((current as any)?.user || null);

      if (!initialized && event === "INITIAL_SESSION") {
        setInitialized(true);
      }

      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_DEBUG === "true") {
        if (event === "SIGNED_IN") {
          console.info("loginしました");
        } else if (event === "SIGNED_OUT") {
          console.info("logoutしました");
        } else if (event === "INITIAL_SESSION") {
          console.info("login中(ページリロード時に)");
        } else if (event === "TOKEN_REFRESHED") {
          console.debug("token refreshed");
        } else {
          console.debug("auth event:", event);
        }
      }
    }) || { subscription: undefined };

    return () => {
      mounted = false;
      sub.subscription?.unsubscribe?.();
    };
  }, []);

  const signOut = async () => {
    setSigningOut(true);
    try {
      const client = supabaseRef.current || createClient();
      await client.auth.signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signingOut, signOut, initialized }}>
      {children}
    </AuthContext.Provider>
  );
}
