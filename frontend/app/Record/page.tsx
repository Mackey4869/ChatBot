"use client";

import { useState, useRef, useEffect } from "react";
import MobileLayout from "@/components/layout/mobile-layout";
import { Mic, Square, Play, Pause, History, Sparkles } from "lucide-react";

// 履歴データの型定義
type RecordItem = {
  id: number;
  title: string;
  date: string;
  durationString: string; // 表示用 ("00:05"など)
  audioUrl?: string;      // 再生用のURL
};

// モックデータ
const INITIAL_HISTORY: RecordItem[] = [
  { id: 1, title: "研究ゼミ議事録", date: "2026-02-25", durationString: "45:30" },
];

export default function RecorderPage() {
  const [isRecording, setIsRecording] = useState(false);
  const [timer, setTimer] = useState(0);
  const [history, setHistory] = useState<RecordItem[]>(INITIAL_HISTORY);

  // --- 再生用 State ---
  const [playingId, setPlayingId] = useState<number | null>(null); // 現在再生中のID
  const [isPlaying, setIsPlaying] = useState(false); // 再生中かどうか(一時停止対応)
  const [progress, setProgress] = useState(0); // 0〜100%
  const [currentTime, setCurrentTime] = useState(0); // 現在の秒数
  const [duration, setDuration] = useState(0); // 総秒数

  // --- Refs ---
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null); // オーディオ要素の管理

  // タイマーフォーマット (秒 -> MM:SS)
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // --- 録音関連 ---
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const audioUrl = URL.createObjectURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());

        const newItem: RecordItem = {
          id: Date.now(),
          title: `新規録音 ${new Date().toLocaleTimeString()}`,
          date: new Date().toISOString().split("T")[0],
          durationString: formatTime(timer),
          audioUrl: audioUrl,
        };
        setHistory((prev) => [newItem, ...prev]);
      };

      recorder.start();
      setIsRecording(true);
      setTimer(0);
      timerIntervalRef.current = setInterval(() => setTimer(p => p + 1), 1000);

    } catch (err) {
      console.error(err);
      alert("マイクの使用が許可されていません");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  // --- 再生ロジック ---
  const handlePlayPause = (item: RecordItem) => {
    // 1. 別の音声を再生しようとした場合 -> 前のを止めて新しいのを再生
    if (playingId !== item.id) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      if (!item.audioUrl) {
        alert("デモデータのため再生できません");
        return;
      }

      const audio = new Audio(item.audioUrl);
      audioRef.current = audio;
      setPlayingId(item.id);
      setIsPlaying(true);
      setProgress(0);
      setCurrentTime(0);

      // メタデータ読み込み時（総時間の取得）
      audio.onloadedmetadata = () => {
        setDuration(audio.duration);
      };

      // 再生位置更新時
      audio.ontimeupdate = () => {
        if (audio.duration) {
          setCurrentTime(audio.currentTime);
          setProgress((audio.currentTime / audio.duration) * 100);
        }
      };

      // 再生終了時
      audio.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        setPlayingId(null);
      };

      audio.play();
    
    // 2. 同じ音声を操作する場合 -> 一時停止 or 再開
    } else {
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
        } else {
          audioRef.current.play();
          setIsPlaying(true);
        }
      }
    }
  };

  // シークバー操作（位置を変更）
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current) {
      const newTime = (Number(e.target.value) / 100) * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
      setProgress(Number(e.target.value));
      setCurrentTime(newTime);
    }
  };

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return (
    <MobileLayout title="N-Research">
      <div className="p-4 space-y-6 pb-24">
        <h1 className="text-2xl font-bold pt-2">音声録音</h1>

        {/* --- 録音エリア --- */}
        <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col items-center justify-center border border-gray-100 min-h-[300px]">
          <div className="text-5xl font-bold text-[#1e3a8a] mb-12 tracking-wider font-mono">
            {formatTime(timer)}
          </div>
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
              isRecording 
                ? "bg-red-500 hover:bg-red-600 ring-4 ring-red-100 animate-pulse" 
                : "bg-[#ea580c] hover:bg-orange-600 ring-4 ring-orange-100"
            }`}
          >
            {isRecording ? <Square size={32} className="text-white fill-current" /> : <Mic size={40} className="text-white" />}
          </button>
          <p className="mt-6 text-gray-400 text-sm font-medium">
            {isRecording ? "録音中... (タップで停止)" : "タップして録音を開始"}
          </p>
        </div>

        {/* --- 履歴リスト --- */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700 mb-2">
            <History size={20} />
            <h2 className="font-bold">録音履歴</h2>
          </div>

          {history.length === 0 && <p className="text-center text-gray-400 text-sm py-4">履歴はありません</p>}

          {history.map((item) => {
            const isThisPlaying = playingId === item.id;

            return (
              <div key={item.id} className={`bg-white p-4 rounded-xl shadow-sm border transition-all ${isThisPlaying ? "border-blue-400 ring-1 ring-blue-100" : "border-gray-100"}`}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-bold text-gray-800">{item.title}</h3>
                    <p className="text-xs text-gray-400 mt-1">{item.date}</p>
                  </div>
                  <button 
                    onClick={() => handlePlayPause(item)}
                    className={`font-bold text-sm px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                      isThisPlaying ? "bg-orange-100 text-orange-600" : "text-orange-500 hover:bg-orange-50"
                    }`}
                  >
                    {isThisPlaying && isPlaying ? (
                      <><Pause size={16} fill="currentColor" /> 停止</>
                    ) : (
                      <><Play size={16} fill="currentColor" /> 再生</>
                    )}
                  </button>
                </div>

                {/* --- 再生中の場合のみプログレスバーを表示 --- */}
                {isThisPlaying && (
                  <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between text-xs text-gray-500 font-mono mb-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration) || item.durationString}</span>
                    </div>
                    <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                      {/* 背景バー */}
                      <div className="absolute top-0 left-0 h-full bg-gray-200 w-full"></div>
                      {/* 進捗バー */}
                      <div 
                        className="absolute top-0 left-0 h-full bg-orange-500 transition-all duration-100 ease-linear"
                        style={{ width: `${progress}%` }}
                      ></div>
                      {/* 操作用スライダー (透明) */}
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
                
                {/* 再生していない時は単純な時間表示 */}
                {!isThisPlaying && (
                  <p className="text-xs text-gray-400 mt-1">長さ: {item.durationString}</p>
                )}
              </div>
            );
          })}
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
          <Sparkles className="text-blue-500 flex-shrink-0 mt-0.5" size={20} />
          <p className="text-xs text-blue-800 leading-relaxed">
            <span className="font-bold block mb-1">ヒント:</span>
            録音した音声は自動的にテキスト化され、ブログ記事として投稿できます。
          </p>
        </div>
      </div>
    </MobileLayout>
  );
}