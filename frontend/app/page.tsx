"use client";

import { useState } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { ChevronLeft, ChevronRight, X, Clock, CheckCircle, User } from "lucide-react";

// --- 型定義 ---

// 予約時の選択肢
type ReservationStatus = "◎" | "○" | "△" | "×";

// 1つのゼミ枠（1対1なので定員は常に1）
type SeminarSlot = {
  id: string;
  time: string;      // 時間帯
  title: string;     // ゼミ名
  capacity: number;  // 定員 (基本1)
  booked: number;    // 現在の予約数 (0か1)
  tutor?: string;    // 担当者名（1on1なので相手を表示すると親切）
};

// 1日のデータ
type DayData = {
  slots: SeminarSlot[];
};

// --- モックデータ生成 (2026年2月) ---
const MOCK_DB: { [day: number]: DayData } = {
  // 2/5: 14:00は空き, 15:00は埋まっている
  5: {
    slots: [
      { id: "s1", time: "14:00-15:00", title: "個別進捗報告", capacity: 1, booked: 0, tutor: "佐藤教授" },
      { id: "s2", time: "15:00-16:00", title: "個別進捗報告", capacity: 1, booked: 1, tutor: "佐藤教授" },
    ]
  },
  // 2/12: すべて埋まっている (満席)
  12: {
    slots: [
      { id: "s3", time: "10:00-11:00", title: "論文指導", capacity: 1, booked: 1, tutor: "田中准教授" },
      { id: "s4", time: "11:00-12:00", title: "論文指導", capacity: 1, booked: 1, tutor: "田中准教授" },
    ]
  },
  // 2/19: すべて埋まっている (満席)
  19: {
    slots: [
      { id: "s5", time: "13:00-14:00", title: "メンタリング", capacity: 1, booked: 1 },
    ]
  },
  // 2/7: すべて空いている
  7: {
    slots: [
      { id: "s6", time: "14:00-15:00", title: "研究相談", capacity: 1, booked: 0 },
      { id: "s7", time: "15:00-16:00", title: "研究相談", capacity: 1, booked: 0 },
    ]
  },
};

export default function HomePage() {
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [userSelection, setUserSelection] = useState<{ [slotId: string]: ReservationStatus }>({});

  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // --- 色判定ロジック (1対1対応版) ---
  const getDateStatusColor = (day: number) => {
    const data = MOCK_DB[day];
    
    // データがない日はグレー
    if (!data || data.slots.length === 0) return "bg-transparent text-gray-700 hover:bg-gray-100";

    // その日の全スロットを確認
    // すべてのスロットが満席(booked >= capacity)なら「赤」
    // ひとつでも空きがあれば「青」
    
    const isAllFull = data.slots.every(slot => slot.booked >= slot.capacity);

    if (isAllFull) {
      return "bg-red-500 text-white shadow-sm hover:opacity-90"; // 満席
    } else {
      return "bg-blue-500 text-white shadow-sm hover:opacity-90"; // 空きあり
    }
  };

  // 予約選択のハンドラ
  const handleSelection = (slotId: string, status: ReservationStatus) => {
    setUserSelection(prev => ({
      ...prev,
      [slotId]: status
    }));
  };

  const currentDayData = selectedDate ? MOCK_DB[selectedDate] : null;

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="p-4 space-y-4">
        
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
                onClick={() => setSelectedDate(day)}
                className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium transition-all ${getDateStatusColor(day)}`}
              >
                {day}
              </button>
            ))}
          </div>

          {/* 凡例 */}
          <div className="mt-6 space-y-2 text-xs text-gray-600 border-t pt-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <span>予約可能 (空きあり)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span>満席 (予約不可)</span>
            </div>
          </div>
        </div>
      </div>

      {/* --- 予約モーダル --- */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-end sm:items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* ヘッダー */}
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Clock size={20} className="text-blue-600" />
                2月{selectedDate}日の予約枠
              </h3>
              <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-gray-200 rounded-full">
                <X size={20} />
              </button>
            </div>

            {/* コンテンツ */}
            <div className="p-4 overflow-y-auto">
              {!currentDayData || currentDayData.slots.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <p>この日のゼミ予約枠はありません</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {currentDayData.slots.map((slot) => {
                    const isFull = slot.booked >= slot.capacity;
                    
                    return (
                      <div key={slot.id} className={`border rounded-xl p-4 shadow-sm ${isFull ? "bg-gray-50 border-gray-200" : "bg-white border-blue-100"}`}>
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded">{slot.time}</span>
                                {slot.tutor && <span className="text-xs text-gray-500 flex items-center"><User size={12} className="mr-1"/>{slot.tutor}</span>}
                            </div>
                            <h4 className="font-bold text-lg text-gray-800">{slot.title}</h4>
                          </div>
                          
                          {/* 1対1用のステータス表示 */}
                          <div className="text-right">
                            {isFull ? (
                                <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-xs font-bold border border-red-200">
                                    満席
                                </span>
                            ) : (
                                <span className="px-3 py-1 bg-green-100 text-green-600 rounded-full text-xs font-bold border border-green-200">
                                    空き
                                </span>
                            )}
                          </div>
                        </div>

                        {/* 予約入力記号選択 */}
                        <div className="mt-4">
                          <p className="text-xs text-gray-500 mb-2">
                            {isFull ? "キャンセル待ちはできません" : "希望度を選択して予約:"}
                          </p>
                          <div className="grid grid-cols-4 gap-2">
                            {(["◎", "○", "△", "×"] as ReservationStatus[]).map((mark) => (
                              <button
                                key={mark}
                                disabled={isFull} // 満席ならボタンを押せない
                                onClick={() => handleSelection(slot.id, mark)}
                                className={`
                                  py-2 rounded-lg font-bold text-lg border transition-all
                                  ${userSelection[slot.id] === mark 
                                    ? "bg-blue-600 text-white border-blue-600 ring-2 ring-offset-1 ring-blue-600" 
                                    : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"}
                                  ${isFull ? "opacity-20 cursor-not-allowed bg-gray-100" : ""}
                                `}
                              >
                                {mark}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* フッターアクション */}
            {currentDayData && currentDayData.slots.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <button 
                  className="w-full bg-[#1e3a8a] text-white font-bold py-3 rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                  onClick={() => {
                    alert(`予約を送信しました！\n${JSON.stringify(userSelection, null, 2)}`);
                    setSelectedDate(null);
                  }}
                >
                  <CheckCircle size={20} />
                  予約を確定する
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </MobileLayout>
  );
}