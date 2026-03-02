"use client";

import MobileLayout from "@/components/layout/mobile-layout";
import { Send, Bot } from "lucide-react";

export default function ChatPage() {
  // モックデータ: チャット履歴
  const messages = [
    {
      id: 1,
      sender: "bot",
      text: "こんにちは！研究室のブログ記事や録音内容から情報を検索できます。何かお探しですか？",
      time: "22:07",
    },
    // 必要に応じてユーザーのメッセージなどをここに追加
    // { id: 2, sender: "user", text: "次回のゼミはいつ？", time: "22:08" }
  ];

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="flex flex-col h-[calc(100vh-140px)]"> {/* FooterとHeaderの高さを引く */}
        
        <div className="p-4">
          <h1 className="text-xl font-bold mb-4">AIチャット</h1>
        </div>

        {/* メッセージエリア */}
        <div className="flex-1 px-4 overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${
                msg.sender === "user" ? "flex-row-reverse" : ""
              }`}
            >
              {/* アイコン */}
              {msg.sender === "bot" && (
                <div className="w-8 h-8 rounded-full bg-[#3b82f6] flex items-center justify-center text-white flex-shrink-0">
                  <Bot size={18} />
                </div>
              )}

              {/* 吹き出し */}
              <div className="flex flex-col max-w-[80%]">
                <div
                  className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-orange-200 text-gray-800 rounded-tr-none"
                      : "bg-white text-gray-800 rounded-tl-none border border-gray-100"
                  }`}
                >
                  {msg.text}
                </div>
                <span className="text-xs text-gray-400 mt-1 ml-1">
                  {msg.time}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* 入力エリア (固定) */}
        <div className="p-4 bg-gray-50">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="メッセージを入力..."
              className="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:border-orange-400 shadow-sm"
            />
            <button className="bg-[#fb923c] text-white p-3 rounded-xl hover:bg-orange-600 shadow-sm transition-colors">
              <Send size={20} />
            </button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}