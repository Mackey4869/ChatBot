"use client";

import { useState, useRef, useEffect } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { Send, Bot, User, Loader2 } from "lucide-react";

// メッセージの型定義
type Message = {
  id: number;
  sender: "bot" | "user";
  text: string;
  time: string;
};

export default function ChatPage() {
  // チャット履歴の状態管理
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      sender: "bot",
      text: "こんにちは！研究室のブログ記事や録音内容から情報を検索できます。何かお探しですか？",
      time: formatTime(new Date()),
    },
  ]);

  // 入力欄の状態管理
  const [inputValue, setInputValue] = useState("");
  // 通信中フラグ
  const [isLoading, setIsLoading] = useState(false);
  
  // 自動スクロール用のref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // メッセージが追加されたら一番下へスクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // 現在時刻をフォーマットする関数 (例: 22:07)
  function formatTime(date: Date) {
    return date.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" });
  }

  // メッセージ送信処理
  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    // 1. ユーザーのメッセージを画面に即時反映
    const userMessage: Message = {
      id: Date.now(),
      sender: "user",
      text: inputValue,
      time: formatTime(new Date()),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue(""); // 入力欄をクリア
    setIsLoading(true); // ローディング開始

    try {
      // 2. バックエンドAPIへ送信
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "エラーが発生しました");
      }

      // 3. Botの返答を画面に反映
      const botMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: data.answer, // バックエンドからの返答
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      console.error("Chat Error:", error);
      // エラーメッセージを表示
      const errorMessage: Message = {
        id: Date.now() + 1,
        sender: "bot",
        text: "申し訳ありません。エラーが発生しました。",
        time: formatTime(new Date()),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false); // ローディング終了
    }
  };

  // Enterキーでの送信ハンドラ
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      handleSendMessage();
    }
  };

  return (
    <MobileLayout title="N-Research">
      <div className="flex flex-col h-[calc(100vh-140px)]">
        
        <div className="p-4 bg-white shadow-sm z-10">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Bot className="text-blue-600" />
            AIチャット
          </h1>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 px-4 py-4 overflow-y-auto space-y-4 bg-gray-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* アイコン */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-white flex-shrink-0 shadow-sm ${
                  msg.sender === "bot" ? "bg-[#3b82f6]" : "bg-gray-400"
                }`}
              >
                {msg.sender === "bot" ? <Bot size={18} /> : <User size={18} />}
              </div>

              {/* 吹き出し */}
              <div className={`flex flex-col max-w-[80%] ${msg.sender === "user" ? "items-end" : "items-start"}`}>
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm whitespace-pre-wrap ${
                    msg.sender === "user"
                      ? "bg-orange-500 text-white rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1 mx-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}

          {/* ローディング表示 */}
          {isLoading && (
            <div className="flex items-start gap-3">
               <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white flex-shrink-0">
                  <Bot size={18} />
               </div>
               <div className="bg-white p-3 rounded-2xl rounded-tl-none border border-gray-100 shadow-sm flex items-center gap-2">
                 <Loader2 size={16} className="animate-spin text-gray-400" />
                 <span className="text-xs text-gray-500">考え中...</span>
               </div>
            </div>
          )}
          
          {/* 自動スクロール用ダミー要素 */}
          <div ref={messagesEndRef} />
        </div>

        {/* 入力エリア (固定) */}
        <div className="p-4 bg-white border-t border-gray-100">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="メッセージを入力..."
              className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 transition-all bg-gray-50"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />
            <button 
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              className={`text-white p-3 rounded-xl shadow-sm transition-all ${
                isLoading || !inputValue.trim() 
                  ? "bg-gray-300 cursor-not-allowed" 
                  : "bg-[#fb923c] hover:bg-orange-600 active:scale-95"
              }`}
            >
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}