"use client";

import { useState, useEffect, useCallback } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { Calendar, Tag, Plus, Edit, X, Save, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

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

// --- カテゴリ定義 ---
const CATEGORIES: BlogCategory[] = [
  { id: 1, name: "研究室" },
  { id: 2, name: "技術" },
  { id: 3, name: "個人" },
];

export default function BlogPage() {
  const { user, session } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [activeTab, setActiveTab] = useState<number | "ALL">("ALL");
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // モーダル関連のState
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // --- データ取得 ---
  const fetchBlogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/blogs");
      if (!response.ok) throw new Error("Failed to fetch blogs");
      const result = await response.json();
      setBlogs(result.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchAdminStatus = useCallback(async () => {
    if (!session?.access_token) {
      setIsAdmin(false);
      return;
    }
    try {
      const response = await fetch("/api/admin", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      if (response.ok) {
        const result = await response.json();
        setIsAdmin(result.role === "admin");
      }
    } catch (error) {
      console.error("Fetch admin status error:", error);
    }
  }, [session]);

  useEffect(() => {
    fetchBlogs();
    fetchAdminStatus();
  }, [fetchBlogs, fetchAdminStatus]);

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
    if (!user) {
      alert("ブログを投稿するにはログインが必要です");
      return;
    }
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
      created_at: blog.created_at.split('T')[0],
      content: blog.content,
      tags: blog.tags ? blog.tags.join(", ") : "",
      category_id: blog.category_id,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!user) {
      alert("ログインセッションが切れました");
      return;
    }

    if (!formData.title || !formData.content) {
      alert("タイトルと内容は必須です");
      return;
    }

    setIsSubmitting(true);

    try {
      const postData = {
        title: formData.title,
        content: formData.content,
        category_id: Number(formData.category_id),
        author_id: user.id,
        tags: formData.tags.split(",").map((t) => t.trim()).filter((t) => t !== ""),
      };

      const endpoint = "/api/ingest";
      const method = editingId ? "PUT" : "POST";
      const body = editingId ? { id: editingId, ...postData } : postData;

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "保存に失敗しました");
      }

      await fetchBlogs(); // リストを再取得
      setIsModalOpen(false);
      alert(editingId ? "更新しました" : "作成しました");

    } catch (error: any) {
      console.error("Save Error:", error);
      alert(`エラーが発生しました: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || !session?.access_token) return;

    if (confirm("本当に削除しますか？")) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`/api/blogs?id=${editingId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "削除に失敗しました");
        }

        await fetchBlogs(); // リストを再取得
        setIsModalOpen(false);
        alert("削除しました");
      } catch (error: any) {
        console.error("Delete Error:", error);
        alert(`エラーが発生しました: ${error.message}`);
      } finally {
        setIsSubmitting(false);
      }
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
          {isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin text-blue-600" size={32} />
            </div>
          ) : filteredBlogs.length === 0 ? (
            <p className="text-center text-gray-400 py-10">記事がありません</p>
          ) : (
            filteredBlogs.map((blog) => (
              <div key={blog.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative group">
                <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold ${getCategoryBadgeStyle(blog.category_id)}`}>
                  {getCategory(blog.category_id)?.name}
                </span>

                {user && (user.id === blog.author_id || isAdmin) && (
                  <button 
                    onClick={() => handleOpenEdit(blog)}
                    className="absolute top-4 right-20 p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                )}

                <h2 className="text-lg font-bold pr-24 mb-2 line-clamp-2">{blog.title}</h2>
                <div className="flex items-center text-gray-400 text-sm mb-3">
                  <Calendar size={14} className="mr-1" />
                  {new Date(blog.created_at).toLocaleDateString()}
                </div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                  {blog.content}
                </p>
                <div className="flex flex-wrap gap-2">
                  {blog.tags && blog.tags.map((tag, idx) => (
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
              {editingId && isAdmin && (
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