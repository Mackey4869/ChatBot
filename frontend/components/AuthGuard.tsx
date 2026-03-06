"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { session, initialized } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Allow access to the login page and public assets
  const allowlist = ["/Login", "/_next", "/favicon.ico"];
  const isAllowed = allowlist.some((p) => pathname === p || pathname.startsWith(p));

  React.useEffect(() => {
    if (!initialized) return; // still checking session
    if (isAllowed) return; // allow login page

    if (!session) {
      router.replace("/Login");
    }
  }, [initialized, session, pathname, router]);

  // while checking session, render nothing to avoid flicker
  if (!initialized) return null;

  if (!session && !isAllowed) return null;

  return <>{children}</>;
}
