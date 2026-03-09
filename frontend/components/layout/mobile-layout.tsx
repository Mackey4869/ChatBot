"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Mic, MessageCircle, LogOut } from "lucide-react";
import { createClient } from "../../lib/supabase";

export default function MobileLayout({
  children,
  title = "N-Research",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const supabaseRef = useRef<any | null>(null);

  useEffect(() => {
    if (!supabaseRef.current) {
      try {
        supabaseRef.current = createClient();
      } catch (err) {
        if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_DEBUG === "true") {
          console.warn("Supabase client init failed:", err);
        }
      }
    }
  }, []);

  // ナビゲーション設定 (Homeは削除)
  const navItems = [
    { href: "/Blog", label: "ブログ", icon: BookOpen },
    { href: "/Record", label: "録音", icon: Mic },
    { href: "/Chat", label: "チャット", icon: MessageCircle },
  ];

  const confirmLogout = async () => {
    try {
      setIsSigningOut(true);
      const client = supabaseRef.current || createClient();
      await client.auth.signOut();
      router.replace("/Login");
    } catch (err) {
      if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_SUPABASE_DEBUG === "true") {
        console.warn("signOut error", err);
      }
    } finally {
      setIsSigningOut(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200 relative">
      {/* ヘッダー: タイトル中央、右側にログアウトボタン */}
      <header className="bg-[#1e3a8a] text-white p-4 sticky top-0 z-50 shadow-md relative">
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          <button
            onClick={() => setShowConfirm(true)}
            aria-label="ログアウト"
            className="flex items-center justify-center bg-white/10 hover:bg-white/20 p-2 rounded-md"
          >
            <LogOut size={18} />
          </button>
        </div>

        <div className="text-center font-bold text-lg">
          <Link href="/" className="inline-block w-full">
            {title}
          </Link>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="flex-1 overflow-y-auto pb-24 scrollbar-hide">
        {children}
      </main>

      {/* フッター (ボトムナビゲーション) */}
      <nav className="bg-white border-t border-gray-200 fixed bottom-0 w-full max-w-md z-50 h-20 pb-2">
        <div className="flex justify-around items-center h-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            // パスが一致するか判定 (前方一致)
            const isActive = pathname.startsWith(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${
                  isActive ? "text-[#fb923c]" : "text-gray-500"
                }`}
              >
                <div
                  className={`p-1 rounded-full ${
                    isActive && item.label === "録音" ? "bg-orange-100" : ""
                  }`}
                >
                  <Icon
                    size={24}
                    className={isActive && item.label === "録音" ? "text-orange-500" : ""}
                  />
                </div>
                <span className={`text-xs font-medium ${isActive && item.label === "録音" ? "text-orange-500" : ""}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* 確認モーダル（ログアウト） */}
      {showConfirm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-11/12 max-w-sm">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">ログアウトしますか？</h3>
            <p className="text-sm text-gray-600 mb-5">ログアウトすると再度ログインが必要になります。</p>
            <div className="flex justify-center items-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700"
                disabled={isSigningOut}
              >
                キャンセル
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 rounded-lg bg-[#1e3a8a] text-white flex items-center gap-2"
                disabled={isSigningOut}
              >
                {isSigningOut ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "ログアウト"
                )}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}