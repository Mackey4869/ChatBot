"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Mic, MessageCircle } from "lucide-react"; // Homeアイコンのインポートは不要になったので削除してもOK

export default function MobileLayout({
  children,
  title = "研究室スケジュール管理",
}: {
  children: React.ReactNode;
  title?: string;
}) {
  const pathname = usePathname();

  // ナビゲーション設定 (Homeは削除)
  const navItems = [
    { href: "/Blog", label: "ブログ", icon: BookOpen },
    { href: "/Record", label: "録音", icon: Mic },
    { href: "/Chat", label: "チャット", icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-800 max-w-md mx-auto shadow-2xl overflow-hidden border-x border-gray-200 relative">
      {/* ヘッダー: タイトルをクリックするとホームへ */}
      <header className="bg-[#1e3a8a] text-white p-4 text-center font-bold text-lg sticky top-0 z-50 shadow-md cursor-pointer hover:opacity-90 transition-opacity">
        <Link href="/" className="block w-full h-full">
          {title}
        </Link>
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
    </div>
  );
}