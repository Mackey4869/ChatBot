"use client";

import { useState } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { Calendar, Tag } from "lucide-react";

// モックデータ: ブログ記事
const POSTS = [
  {
    id: 1,
    title: "研究室の新メンバー紹介",
    date: "2026-02-25",
    desc: "今年度から研究室に加わった新メンバーを紹介します。",
    tags: ["研究室", "メンバー"],
    category: "LAB", // 研究室
  },
  {
    id: 2,
    title: "機械学習モデルの最適化手法",
    date: "2026-02-20",
    desc: "深層学習モデルの学習効率を向上させる手法について解説します。",
    tags: ["機械学習", "最適化"],
    category: "TECH", // 技術
  },
  {
    id: 3,
    title: "学会参加報告",
    date: "2026-02-15",
    desc: "先日参加した国際学会での発表内容と所感をまとめました。",
    tags: ["学会", "発表"],
    category: "PERSONAL", // 個人
  },
];

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState("ALL");

  // タブの定義
  const tabs = [
    { id: "ALL", label: "すべて", color: "bg-orange-500 text-white" },
    { id: "LAB", label: "研究室", color: "bg-white text-gray-600 hover:bg-gray-100" },
    { id: "TECH", label: "技術", color: "bg-white text-gray-600 hover:bg-gray-100" },
    { id: "PERSONAL", label: "個人", color: "bg-white text-gray-600 hover:bg-gray-100" },
  ];

  // カテゴリごとのバッジスタイル取得
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "LAB": return "bg-[#3b82f6] text-white"; // Blue
      case "TECH": return "bg-[#10b981] text-white"; // Green
      case "PERSONAL": return "bg-orange-500 text-white"; // Orange
      default: return "bg-gray-500 text-white";
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case "LAB": return "研究室";
      case "TECH": return "技術";
      case "PERSONAL": return "個人";
      default: return "";
    }
  };

  // フィルタリング処理
  const filteredPosts = activeTab === "ALL" 
    ? POSTS 
    : POSTS.filter(p => p.category === activeTab);

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="p-4 space-y-6">
        <h1 className="text-2xl font-bold pt-2">ブログ記事</h1>

        {/* タブ切り替え */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
             // 選択されているタブかどうかでスタイルを変更
             const isActive = activeTab === tab.id;
             let styleClass = "bg-white text-gray-600";
             
             if (isActive) {
                if (tab.id === "ALL" || tab.id === "PERSONAL") styleClass = "bg-orange-500 text-white";
                else if (tab.id === "LAB") styleClass = "bg-[#3b82f6] text-white";
                else if (tab.id === "TECH") styleClass = "bg-[#10b981] text-white";
             }

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap transition-colors ${styleClass}`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* 記事リスト */}
        <div className="space-y-4">
          {filteredPosts.map((post) => (
            <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
              {/* カテゴリバッジ (右上) */}
              <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getCategoryBadge(post.category)}`}>
                {getCategoryLabel(post.category)}
              </span>

              <h2 className="text-lg font-bold pr-16 mb-2">{post.title}</h2>
              
              <div className="flex items-center text-gray-400 text-sm mb-3">
                <Calendar size={14} className="mr-1" />
                {post.date}
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-4">
                {post.desc}
              </p>

              {/* タグ */}
              <div className="flex gap-2">
                {post.tags.map(tag => (
                  <span key={tag} className="flex items-center bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </MobileLayout>
  );
}