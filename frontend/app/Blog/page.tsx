"use client";

import { useState } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { Calendar, Tag, Plus, Edit, X, Save, Trash2 } from "lucide-react";

// --- 型定義 ---
type Post = {
  id: number;
  title: string;
  date: string;
  desc: string;
  tags: string[];
  category: "LAB" | "TECH" | "PERSONAL";
};

// --- 初期データ ---
const INITIAL_POSTS: Post[] = [
  {
    id: 1,
    title: "研究室の新メンバー紹介",
    date: "2026-02-25",
    desc: "今年度から研究室に加わった新メンバーを紹介します。",
    tags: ["研究室", "メンバー"],
    category: "LAB",
  },
  {
    id: 2,
    title: "機械学習モデルの最適化手法",
    date: "2026-02-20",
    desc: "深層学習モデルの学習効率を向上させる手法について解説します。",
    tags: ["機械学習", "最適化"],
    category: "TECH",
  },
  {
    id: 3,
    title: "学会参加報告",
    date: "2026-02-15",
    desc: "先日参加した国際学会での発表内容と所感をまとめました。",
    tags: ["学会", "発表"],
    category: "PERSONAL",
  },
];

export default function BlogPage() {
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [activeTab, setActiveTab] = useState("ALL");

  // モーダル関連のState
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<{
    title: string;
    date: string;
    desc: string;
    tags: string;
    category: "LAB" | "TECH" | "PERSONAL";
  }>({
    title: "",
    date: new Date().toISOString().split("T")[0],
    desc: "",
    tags: "",
    category: "LAB",
  });

  // タブ定義
  const tabs = [
    { id: "ALL", label: "すべて" },
    { id: "LAB", label: "研究室" },
    { id: "TECH", label: "技術" },
    { id: "PERSONAL", label: "個人" },
  ];

  // バッジ色判定
  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "LAB": return "bg-[#3b82f6] text-white";
      case "TECH": return "bg-[#10b981] text-white";
      case "PERSONAL": return "bg-orange-500 text-white";
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

  // 新規作成
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      date: new Date().toISOString().split("T")[0],
      desc: "",
      tags: "",
      category: "LAB",
    });
    setIsModalOpen(true);
  };

  // 編集
  const handleOpenEdit = (post: Post) => {
    setEditingId(post.id);
    setFormData({
      title: post.title,
      date: post.date,
      desc: post.desc,
      tags: post.tags.join(", "),
      category: post.category,
    });
    setIsModalOpen(true);
  };

  // 保存
  const handleSave = () => {
    if (!formData.title || !formData.desc) {
      alert("タイトルと内容は必須です");
      return;
    }

    const newPostData = {
      title: formData.title,
      date: formData.date,
      desc: formData.desc,
      tags: formData.tags.split(",").map(t => t.trim()).filter(t => t !== ""),
      category: formData.category,
    };

    if (editingId) {
      setPosts(posts.map(p => (p.id === editingId ? { ...newPostData, id: editingId } : p)));
    } else {
      const newId = Math.max(...posts.map(p => p.id), 0) + 1;
      setPosts([{ ...newPostData, id: newId }, ...posts]);
    }

    setIsModalOpen(false);
  };

  // 削除
  const handleDelete = () => {
    if (editingId && confirm("本当に削除しますか？")) {
      setPosts(posts.filter(p => p.id !== editingId));
      setIsModalOpen(false);
    }
  };

  const filteredPosts = activeTab === "ALL"
    ? posts
    : posts.filter(p => p.category === activeTab);

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="p-4 space-y-6 pb-24"> {/* pb-24で最後の記事がボタンに隠れないように余白確保 */}
        <h1 className="text-2xl font-bold pt-2">ブログ記事</h1>

        {/* タブ */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => {
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
          {filteredPosts.length === 0 ? (
            <p className="text-center text-gray-400 py-10">記事がありません</p>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getCategoryBadge(post.category)}`}>
                  {getCategoryLabel(post.category)}
                </span>
                <button 
                  onClick={() => handleOpenEdit(post)}
                  className="absolute top-4 right-20 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Edit size={16} />
                </button>
                <h2 className="text-lg font-bold pr-24 mb-2 line-clamp-2">{post.title}</h2>
                <div className="flex items-center text-gray-400 text-sm mb-3">
                  <Calendar size={14} className="mr-1" />
                  {post.date}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                  {post.desc}
                </p>
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center bg-gray-100 text-gray-500 px-2 py-1 rounded text-xs">
                      <Tag size={12} className="mr-1" />
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ★ 修正ポイント: 固定フローティングボタン (FAB)
        fixed配置にしつつ、max-w-md と left-0 right-0 mx-auto を指定することで、
        PC画面でもスマホ枠（MobileLayout）と同じ幅・位置に基準を作っています。
      */}
      <div className="fixed bottom-24 left-0 right-0 mx-auto w-full max-w-md px-4 pointer-events-none z-30 flex justify-end">
        <button
          onClick={handleOpenCreate}
          className="pointer-events-auto bg-[#1e3a8a] text-white p-4 rounded-full shadow-lg hover:bg-blue-900 transition-transform active:scale-95 flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* モーダル (変更なし) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">
                {editingId ? "記事を編集" : "新規記事作成"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full">
                <X size={20} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">タイトル</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="記事のタイトル"
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value as any})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="LAB">研究室</option>
                    <option value="TECH">技術</option>
                    <option value="PERSONAL">個人</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">日付</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">内容</label>
                <textarea
                  rows={5}
                  value={formData.desc}
                  onChange={(e) => setFormData({...formData, desc: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="ブログの本文..."
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">タグ (カンマ区切り)</label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({...formData, tags: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="例: 研究, AI, 報告"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              {editingId && (
                <button
                  onClick={handleDelete}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                onClick={handleSave}
                className="flex-1 bg-[#1e3a8a] text-white font-bold py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-md"
              >
                <Save size={20} />
                保存する
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}