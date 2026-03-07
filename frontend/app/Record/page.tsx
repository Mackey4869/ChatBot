"use client";

import { useState, useRef, useEffect } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { Mic, Square, Play, History, Sparkles } from "lucide-react";

// 履歴データの型定義
type RecordItem = {
  id: number;
  title: string;
  date: string;
  duration: string;
};

// モックデータ: 録音履歴
const INITIAL_HISTORY: RecordItem[] = [
  { id: 1, title: "研究ゼミ議事録", date: "2026-02-25", duration: "45:30" },
  { id: 2, title: "実験結果の考察", date: "2026-02-20", duration: "23:15" },
];

export default function RecorderPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // タイマーのフォーマット (秒 -> MM:SS)
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // 録音開始・停止処理
  const toggleRecording = () => {
    if (isRecording) {
      // 停止処理
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsRecording(false);
      // ここで実際の録音保存処理などを行います
    } else {
      // 開始処理
      setTimer(0);
      setIsRecording(true);
      intervalRef.current = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
  };

  // コンポーネント破棄時のクリーンアップ
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="p-4 space-y-6 pb-24">
        <h1 className="text-2xl font-bold pt-2">音声録音</h1>

        {/* --- メイン録音エリア --- */}
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center border border-gray-100 min-h-[300px]">
          
          {/* タイマー表示 */}
          <div className="text-5xl font-bold text-[#1e3a8a] mb-12 tracking-wider font-mono">
            {formatTime(timer)}
          </div>

          {/* 録音ボタン */}
          <button
            onClick={toggleRecording}
            className={`
              w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300
              ${isRecording 
                ? "bg-red-500 hover:bg-red-600 ring-4 ring-red-100 animate-pulse" 
                : "bg-[#ea580c] hover:bg-orange-600 ring-4 ring-orange-100"
              }
            `}
          >
            {isRecording ? (
              <Square size={32} className="text-white fill-current" />
            ) : (
              <Mic size={40} className="text-white" />
            )}
          </button>

          <p className="mt-6 text-gray-400 text-sm font-medium">
            {isRecording ? "録音中..." : "タップして録音を開始"}
          </p>
        </div>

        {/* --- 録音履歴 --- */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <History size={20} />
            <h2 className="font-bold">録音履歴</h2>
          </div>

          {INITIAL_HISTORY.map((item) => (
            <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-gray-800">{item.title}</h3>
                <p className="text-xs text-gray-400 mt-1">
                  {item.date} • {item.duration}
                </p>
              </div>
              {/* エラーの原因となっていた箇所: 再生ボタン */}
              <button className="text-orange-500 font-bold text-sm hover:bg-orange-50 px-3 py-1.5 rounded-lg transition-colors">
                再生
              </button>
            </div>
          ))}
        </div>

        {/* --- ヒントボックス (AI連携) --- */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Sparkles className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-xs text-blue-800 leading-relaxed">
            <span className="font-bold block mb-1">ヒント:</span>
            録音した音声は自動的にテキスト化され、ブログ記事として投稿できます。研究室・技術関連の内容はAIが自動でタグ付けを行います。
          </p>
        </div>

      </div>
    </MobileLayout>
  );
}