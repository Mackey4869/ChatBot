"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { createClient } from "../../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // ログイン処理（モック）
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setErrorMsg(error.message || "ログインに失敗しました");
        return;
      }

      // サインイン成功（モックの遷移先はホーム）
      router.push("/");
    } catch (err: any) {
      setErrorMsg(err?.message || String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 max-w-md mx-auto font-sans text-gray-800">
      
      {/* ヘッダー / ロゴエリア */}
      <div className="w-full text-center mb-10">
        <div className="w-20 h-20 bg-[#1e3a8a] rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-10 h-10 text-white"
          >
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-[#1e3a8a]">研究室スケジュール管理</h1>
        <p className="text-gray-500 text-sm mt-2">IDとパスワードを入力してログイン</p>
      </div>

      {/* ログインフォーム */}
      <form onSubmit={handleLogin} className="w-full space-y-5 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        
        {/* メールアドレス入力 */}
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 ml-1">メールアドレス / ID</label>
          <div className="relative">
            <Mail className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type="text" // 実際は email 推奨
              required
              placeholder="student@lab.univ.ac.jp"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50"
            />
          </div>
        </div>

        {/* パスワード入力 */}
        <div className="space-y-2">
          <div className="flex justify-between items-center ml-1">
            <label className="text-sm font-bold text-gray-700">パスワード</label>
            <Link href="#" className="text-xs text-[#1e3a8a] hover:underline">
              パスワードを忘れた方
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 p-3 rounded-xl border border-gray-200 focus:outline-none focus:border-[#1e3a8a] focus:ring-2 focus:ring-blue-100 transition-all bg-gray-50"
            />
            {/* パスワード表示切替 */}
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
        </div>

        {/* ログインボタン */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#1e3a8a] text-white font-bold py-3.5 rounded-xl hover:bg-blue-900 transition-all flex items-center justify-center gap-2 shadow-md active:scale-[0.98]"
        >
          {isLoading ? (
            <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <>
              ログイン
              <ArrowRight size={20} />
            </>
          )}
        </button>
        {errorMsg ? (
          <p className="text-sm text-red-600 mt-2">{errorMsg}</p>
        ) : null}
      </form>

      {/* 新規登録リンク */}
      <div className="mt-8 text-center text-sm text-gray-500">
        アカウントをお持ちでないですか？<br />
        <Link href="#" className="text-[#1e3a8a] font-bold hover:underline mt-1 inline-block">
          管理者へ申請を行う
        </Link>
      </div>

    </div>
  );
}