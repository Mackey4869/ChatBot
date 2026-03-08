"use client";

import { useState } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { ChevronLeft, ChevronRight, X, Clock, Search, User, Calendar as CalendarIcon } from "lucide-react";

// --- 型定義 ---

type MemberSchedule = {
  id: string;
  name: string;
  status: "free" | "busy" | "partial"; // free: 全日空き, busy: 全日不可, partial: 一部予定あり
  details: string; // 具体的な予定内容
};

type DayData = {
  date: number;
  summary: "good" | "busy" | "moderate"; // カレンダー上の表示用 (good:最適, busy:多忙, moderate:普通)
  members: MemberSchedule[];
};

// --- モックデータ (2026年2月) ---
const MOCK_SCHEDULE_DB: { [day: number]: DayData } = {
  // 2/5: 全体的に忙しい日
  5: {
    date: 5,
    summary: "busy",
    members: [
      { id: "m1", name: "佐藤 教授", status: "busy", details: "9:00-17:00 学会出張" },
      { id: "m2", name: "鈴木 准教授", status: "busy", details: "10:00-15:00 講義" },
      { id: "m3", name: "田中 (M2)", status: "partial", details: "13:00-15:00 実験" },
      { id: "m4", name: "高橋 (M1)", status: "free", details: "終日研究室" },
    ]
  },
  // 2/7: 議論に最適な日 (空きが多い)
  7: {
    date: 7,
    summary: "good",
    members: [
      { id: "m1", name: "佐藤 教授", status: "partial", details: "10:00-11:00 会議のみ" },
      { id: "m2", name: "鈴木 准教授", status: "free", details: "予定なし" },
      { id: "m3", name: "田中 (M2)", status: "free", details: "予定なし" },
      { id: "m4", name: "高橋 (M1)", status: "free", details: "予定なし" },
    ]
  },
  // 2/12: 普通
  12: {
    date: 12,
    summary: "moderate",
    members: [
      { id: "m1", name: "佐藤 教授", status: "busy", details: "終日不在" },
      { id: "m2", name: "鈴木 准教授", status: "free", details: "研究室待機" },
      { id: "m3", name: "田中 (M2)", status: "partial", details: "AM: 就活, PM: 空き" },
    ]
  },
};

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // 日付のスタイル決定
  const getDateStyle = (day: number) => {
    const data = MOCK_SCHEDULE_DB[day];
    if (!data) return "bg-transparent text-gray-700 hover:bg-gray-100";

    switch (data.summary) {
      case "good": // 最適な日 (緑)
        return "bg-[#10b981] text-white shadow-sm hover:opacity-90";
      case "busy": // 忙しい日 (青 - アプリのテーマカラー)
        return "bg-[#3b82f6] text-white shadow-sm hover:opacity-90";
      case "moderate": // 普通 (黄色/オレンジ)
        return "bg-orange-400 text-white shadow-sm hover:opacity-90";
      default:
        return "bg-gray-100 text-gray-400";
    }
  };

  // 選択された日のデータ
  const currentDayData = selectedDate ? MOCK_SCHEDULE_DB[selectedDate] : null;

  // メンバーの絞り込み
  const filteredMembers = currentDayData?.members.filter(m => 
    m.name.includes(searchTerm) || m.details.includes(searchTerm)
  );

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="p-4 space-y-4">
        
        {/* コンセプトメッセージ */}
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
          <CalendarIcon className="text-[#1e3a8a] flex-shrink-0 mt-1" size={20} />
          <div>
            <h2 className="text-sm font-bold text-[#1e3a8a] mb-1">日程調整・予定管理</h2>
            <p className="text-xs text-blue-800 leading-relaxed">
              メンバーの予定を一元管理。事務的な調整を減らし、純粋な議論のための時間を確保しましょう。
            </p>
          </div>
        </div>

        {/* カレンダー */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-bold">2026年 2月</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
          </div>

          <div className="grid grid-cols-7 text-center mb-2 text-gray-500 text-sm">
            {weekDays.map((day) => <div key={day}>{day}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center">
            {days.map((day) => (
              <button
                key={day}
                onClick={() => {
                  setSelectedDate(day);
                  setSearchTerm(""); // モーダルを開くたびに検索リセット
                }}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${getDateStyle(day)}`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* 凡例 */}
          <div className="mt-6 space-y-2 text-xs text-gray-600 border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#10b981]"></span>
              <span>議論に最適 (空きメンバー多数)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-orange-400"></span>
              <span>調整可能 (一部予定あり)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
              <span>多忙 (予定多数)</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 予定詳細モーダル --- */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* ヘッダー */}
            <div className="p-4 border-b bg-gray-50">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Clock size={20} className="text-[#1e3a8a]" />
                  2月{selectedDate}日の予定一覧
                </h3>
                <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-gray-200 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {/* 検索バー (モーダル内) */}
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="メンバー名で絞り込み..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 p-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* コンテンツ (リスト) */}
            <div className="p-4 overflow-y-auto">
              {!currentDayData ? (
                <div className="text-center py-10 text-gray-400">
                  <p>予定データがありません</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMembers && filteredMembers.length > 0 ? (
                    filteredMembers.map((member) => (
                      <div key={member.id} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition-colors">
                        {/* アイコン */}
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 
                          ${member.status === 'free' ? 'bg-green-100 text-green-600' : 
                            member.status === 'busy' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}`}>
                          <User size={20} />
                        </div>
                        
                        {/* 詳細 */}
                        <div className="flex-1">
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-bold text-gray-800">{member.name}</h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                              ${member.status === 'free' ? 'bg-green-50 text-green-600 border-green-200' : 
                                member.status === 'busy' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-orange-50 text-orange-600 border-orange-200'}`}>
                              {member.status === 'free' ? '空き' : member.status === 'busy' ? '多忙' : '一部あり'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            {member.details}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-400 text-sm py-4">
                      該当するメンバーはいません
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* フッターアクション (例: この日で会議を設定する) */}
            <div className="p-4 border-t bg-gray-50">
               <button 
                  onClick={() => alert("議論の時間を設定しました（デモ）")}
                  className="w-full bg-[#1e3a8a] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
               >
                 この日で議論を設定する
               </button>
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}