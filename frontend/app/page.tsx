import MobileLayout from "@/components/layout/mobile-layout";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function HomePage() {
  // カレンダーのモックデータ (2026年2月)
  const days = Array.from({ length: 28 }, (_, i) => i + 1);
  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  // 状態のモック (full: 予約いっぱい, open: 予約空き)
  const status: { [key: number]: "full" | "open" | null } = {
    5: "full", 12: "full", 19: "full", 26: "full", // 水曜はいっぱい
    7: "open", 14: "open", 21: "open", 28: "open", // 金曜は空き
  };

  return (
    <MobileLayout title="研究室スケジュール管理">
      <div className="p-4 space-y-4">
        {/* 検索バー */}
        <input
          type="text"
          placeholder="メンバー名で検索..."
          className="w-full p-3 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {/* カレンダーカード */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-4">
            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronLeft size={20} /></button>
            <h2 className="text-lg font-bold">2026年 2月</h2>
            <button className="p-2 hover:bg-gray-100 rounded-full"><ChevronRight size={20} /></button>
          </div>

          {/* 曜日ヘッダー */}
          <div className="grid grid-cols-7 text-center mb-2 text-gray-500 text-sm">
            {weekDays.map((day) => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* 日付グリッド */}
          <div className="grid grid-cols-7 gap-2 text-center">
            {days.map((day) => {
              const st = status[day];
              let bgClass = "bg-transparent";
              let textClass = "text-gray-700";

              if (st === "full") {
                bgClass = "bg-[#3b82f6]"; // Blue
                textClass = "text-white";
              } else if (st === "open") {
                bgClass = "bg-[#10b981]"; // Green
                textClass = "text-white";
              }

              return (
                <div
                  key={day}
                  className={`aspect-square flex items-center justify-center rounded-lg text-sm font-medium ${bgClass} ${textClass}`}
                >
                  {day}
                </div>
              );
            })}
          </div>

          {/* 凡例 */}
          <div className="mt-6 space-y-2 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#3b82f6]"></span>
              <span>研究ゼミあり（予約いっぱい）</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 rounded bg-[#10b981]"></span>
              <span>研究ゼミあり（予約空き）</span>
            </div>
          </div>
        </div>

        {/* 今月の予約状況サマリ */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <h3 className="font-bold mb-3">今月の予約状況</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span>研究ゼミ（予約いっぱい）</span>
              <span className="text-[#3b82f6] font-bold">4回</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>研究ゼミ（予約空き）</span>
              <span className="text-[#10b981] font-bold">4回</span>
            </div>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}