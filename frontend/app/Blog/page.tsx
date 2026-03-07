"use client";

import { useState } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { Calendar, Tag, Plus, Edit, X, Save, Trash2, Loader2 } from "lucide-react";

// --- 型定義 ---

type BlogCategory = {
  id: number;
  name: string;
};

type Blog = {
  id: number;
  author_id: string;
  category_id: number;
  title: string;
  content: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  tags: string[];
};

// --- 初期データ ---

const CATEGORIES: BlogCategory[] = [
  { id: 1, name: "研究室" },
  { id: 2, name: "技術" },
  { id: 3, name: "個人" },
];

const INITIAL_BLOGS: Blog[] = [
  {
    id: 1,
    author_id: "417a2823-f2bf-484b-8361-0131d8b019b0",
    category_id: 1,
    title: "研究室の新メンバー紹介",
    content: "今年度から研究室に加わった新メンバーを紹介します。",
    is_published: true,
    created_at: "2026-02-25",
    updated_at: "2026-02-25",
    tags: ["研究室", "メンバー"],
  },
  {
    id: 2,
    author_id: "user_01",
    category_id: 2,
    title: "機械学習モデルの最適化手法",
    content: "深層学習モデルの学習効率を向上させる手法について解説します。",
    is_published: true,
    created_at: "2026-02-20",
    updated_at: "2026-02-20",
    tags: ["機械学習", "最適化"],
  },
  {
    id: 3,
    author_id: "user_01",
    category_id: 3,
    title: "学会参加報告",
    content: "先日参加した国際学会での発表内容と所感をまとめました。",
    is_published: true,
    created_at: "2026-02-15",
    updated_at: "2026-02-15",
    tags: ["学会", "発表"],
  },
];

export default function BlogPage() {
  const [blogs, setBlogs] = useState<Blog[]>(INITIAL_BLOGS);
  const [activeTab, setActiveTab] = useState<number | "ALL">("ALL");

  // モーダル関連のState
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // ★ ローディング状態追加
  
  // フォームデータ
  const [formData, setFormData] = useState<{
    title: string;
    created_at: string;
    content: string;
    tags: string;
    category_id: number;
  }>({
    title: "",
    created_at: new Date().toISOString().split("T")[0],
    content: "",
    tags: "",
    category_id: 1,
  });

  // --- ヘルパー関数 ---
  const getCategory = (id: number) => CATEGORIES.find((c) => c.id === id);

  const getCategoryBadgeStyle = (id: number) => {
    switch (id) {
      case 1: return "bg-[#3b82f6] text-white";
      case 2: return "bg-[#10b981] text-white";
      case 3: return "bg-orange-500 text-white";
      default: return "bg-gray-500 text-white";
    }
  };

  const getTabStyle = (tabId: number | "ALL") => {
    const isActive = activeTab === tabId;
    if (!isActive) return "bg-white text-gray-600";
    if (tabId === "ALL") return "bg-orange-500 text-white";
    if (tabId === 1) return "bg-[#3b82f6] text-white";
    if (tabId === 2) return "bg-[#10b981] text-white";
    if (tabId === 3) return "bg-orange-500 text-white";
    return "bg-gray-500 text-white";
  };

  // --- ハンドラ ---

  const handleOpenCreate = () => {
    setEditingId(null);
    setFormData({
      title: "",
      created_at: new Date().toISOString().split("T")[0],
      content: "",
      tags: "",
      category_id: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (blog: Blog) => {
    setEditingId(blog.id);
    setFormData({
      title: blog.title,
      created_at: blog.created_at,
      content: blog.content,
      tags: blog.tags.join(", "),
      category_id: blog.category_id,
    });
    setIsModalOpen(true);
  };

  // ★ APIを使用した保存処理 ★
  const handleSave = async () => {
    // バリデーション
    if (!formData.title || !formData.content) {
      alert("タイトルと内容は必須です");
      return;
    }

    setIsSubmitting(true); // 送信開始

    try {
      // 共通のデータオブジェクト作成
      const postData = {
        title: formData.title,
        content: formData.content,
        category_id: Number(formData.category_id),
        author_id: "417a2823-f2bf-484b-8361-0131d8b019b0", // ※認証機能実装後は動的に取得する必要があります
        tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t !== ""),
        created_at: formData.created_at, // API側では自動設定されることが多いですが、ここでは渡しています
      };

      if (editingId) {
        // --- 編集モード (今回はAPIが新規作成用のみのため、ローカル更新のみ行います) ---
        // TODO: 更新用のAPIエンドポイント (PUT /api/blogs/[id]) があればここでfetchする
        
        const updatedBlog: Blog = {
          ...blogs.find(b => b.id === editingId)!,
          ...postData,
          updated_at: new Date().toISOString().split("T")[0],
          is_published: true, // 型合わせ
        };
        
        setBlogs(blogs.map((b) => (b.id === editingId ? updatedBlog : b)));
        alert("編集内容はローカルに保存されました（DB更新APIは未実装）");

      } else {
        // --- 新規作成モード (APIコール) ---
        
        const response = await fetch('/api/ingest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(postData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "保存に失敗しました");
        }

        const result = await response.json();
        
        // 成功したらローカルのリストも更新（楽観的UI更新）
        // ※実際はサーバーから返ってきたIDやデータを使うのがベター
        const newBlog: Blog = {
          id: result.blogId || Math.max(...blogs.map((b) => b.id), 0) + 1,
          ...postData,
          is_published: true,
          updated_at: postData.created_at,
        };

        setBlogs([newBlog, ...blogs]);
      }

      // 成功時のみモーダルを閉じる
      setIsModalOpen(false);

    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsSubmitting(false); // 送信終了
    }
  };

  const handleDelete = () => {
    if (editingId && confirm("本当に削除しますか？")) {
      // TODO: 削除APIがあればここで呼ぶ
      setBlogs(blogs.filter((b) => b.id !== editingId));
      setIsModalOpen(false);
    }
  };

  const filteredBlogs = activeTab === "ALL"
    ? blogs
    : blogs.filter((b) => b.category_id === activeTab);

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="p-4 space-y-6 pb-24">
        <h1 className="text-2xl font-bold pt-2">ブログ記事</h1>

        {/* タブ切り替え */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setActiveTab("ALL")}
            className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap transition-colors ${getTabStyle("ALL")}`}
          >
            すべて
          </button>
          
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`px-4 py-2 rounded-xl text-sm font-bold shadow-sm whitespace-nowrap transition-colors ${getTabStyle(cat.id)}`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* 記事リスト */}
        <div className="space-y-4">
          {filteredBlogs.length === 0 ? (
            <p className="text-center text-gray-400 py-10">記事がありません</p>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getCategoryBadgeStyle(blog.category_id)}`}>
                  {getCategory(blog.category_id)?.name}
                </span>

                <button 
                  onClick={() => handleOpenEdit(blog)}
                  className="absolute top-4 right-20 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                >
                  <Edit size={16} />
                </button>

                <h2 className="text-lg font-bold pr-24 mb-2 line-clamp-2">{blog.title}</h2>
                <div className="flex items-center text-gray-400 text-sm mb-3">
                  <Calendar size={14} className="mr-1" />
                  {blog.created_at}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                  {blog.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  {blog.tags.map((tag, idx) => (
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

      {/* 固定フローティングボタン (FAB) */}
      <div className="fixed bottom-24 left-0 right-0 mx-auto w-full max-w-md px-4 pointer-events-none z-30 flex justify-end">
        <button
          onClick={handleOpenCreate}
          className="pointer-events-auto bg-[#1e3a8a] text-white p-4 rounded-full shadow-lg hover:bg-blue-900 transition-transform active:scale-95 flex items-center justify-center"
        >
          <Plus size={28} />
        </button>
      </div>

      {/* モーダル */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg">
                {editingId ? "記事を編集" : "新規記事作成"}
              </h3>
              <button 
                onClick={() => !isSubmitting && setIsModalOpen(false)} 
                className="p-2 hover:bg-gray-200 rounded-full"
                disabled={isSubmitting}
              >
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
                  disabled={isSubmitting}
                />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">カテゴリ</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: Number(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                    disabled={isSubmitting}
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-bold text-gray-700 mb-1">日付</label>
                  <input
                    type="date"
                    value={formData.created_at}
                    onChange={(e) => setFormData({...formData, created_at: e.target.value})}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1">内容</label>
                <textarea
                  rows={5}
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="ブログの本文..."
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex gap-3">
              {editingId && (
                <button
                  onClick={handleDelete}
                  className="p-3 text-red-500 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                  disabled={isSubmitting}
                >
                  <Trash2 size={20} />
                </button>
              )}
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className={`flex-1 bg-[#1e3a8a] text-white font-bold py-3 rounded-xl hover:opacity-90 flex items-center justify-center gap-2 shadow-md ${isSubmitting ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    保存中...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    保存する
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}