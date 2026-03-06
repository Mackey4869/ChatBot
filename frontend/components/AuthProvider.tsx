"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  signingOut: boolean;
  signOut: () => Promise<void>;
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

  const supabase = createClient();

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const s = await supabase.auth.getSession();
        if (!mounted) return;
        const sess = s?.data?.session || null;
        setSession(sess);
        setUser(sess?.user || null);
      } catch (err) {
        // ログは開発時のみ出す
        if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
          console.warn("getSession error", err);
        }
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, sess) => {
      const current = sess?.session || null;
      setSession(current);
      setUser(current?.user || null);

      // ログ出力は明示的なデバッグフラグが有効な場合のみ行う
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
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [supabase]);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <AuthContext.Provider value={{ session, user, signingOut, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
