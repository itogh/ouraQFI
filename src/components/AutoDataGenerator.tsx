"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import type { AppState } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";

export function AutoDataGenerator() {
  const [isRunning, setIsRunning] = useState(false);
  const [nextUpdate, setNextUpdate] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { addDaily } = useAppStore();

  // 前回の Ed を使って、3分ごとに前回値に対して ±5 の範囲で更新するデータを生成
  const generateBasedOnPrev = () => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    // 前回の記録を参照して、そこからほどよく揺らぐ時間（分）を生成する。
    // 初回は実運用に近い 30〜180 分の一様分布でサンプリング。
    const hasGetState = typeof (useAppStore as unknown as { getState?: unknown }).getState === "function";
    const state: AppState | null = hasGetState
      ? (useAppStore as unknown as { getState: () => AppState }).getState()
      : null;

    // 前回の timeMinutes を取得できればそれを中心にノイズを付与する
    const prevDaily = state?.daily ?? [];
    const lastTime = prevDaily.length ? prevDaily[prevDaily.length - 1].timeMinutes : null;

    let timeMinutes: number;
    if (lastTime === null) {
      // 初回は 30..180 分 (実運用を想定したレンジ)
      timeMinutes = Math.round(30 + Math.random() * 150);
    } else {
      // 前回からの変化を正規分布っぽく（中心0、標準偏差 20 分）で生成し、極端なジャンプを抑える
      const rand = () => {
        // 箱ひげ法による簡易正規近似: sum of 6 uniforms -> approx normal
        let sum = 0;
        for (let i = 0; i < 6; i++) sum += (Math.random() - 0.5);
        return sum; // mean 0, approx std ~1
      };
      const sd = 20; // 1シグマ = 20分
      const delta = Math.round(rand() * sd);
      timeMinutes = Math.max(1, lastTime + delta);
      // clamp to a realistic window
      timeMinutes = Math.min(24 * 60, timeMinutes);
    }

    // 追加の雑音: 金銭・感情スコアも少しランダムにする（実運用っぽく）
    const moneyJpy = Math.round(Math.random() * 1000); // 0..1000 JPY
    // emotionZ はセンサZスコアで、通常は -3..+3 程度。小さな変動を追加。
    const emotionZ = Math.max(-3, Math.min(3, (Math.random() * 2 - 1) * 1.5));

    return {
      date: dateStr,
      timeMinutes: Math.round(timeMinutes),
      moneyJpy,
      emotionZ,
    };
  };

  // 1日ごとにデータを追加（ユーザー操作で動かす自動生成）
  const startAutoGeneration = () => {
    if (isRunning) return;

    setIsRunning(true);
  setNextUpdate(24 * 60 * 60); // 1日（秒）

    // 最初のデータをすぐに追加
    const data = generateBasedOnPrev();
    addDaily(data);

    // 1日ごとにデータを追加
    intervalRef.current = setInterval(() => {
      const d = generateBasedOnPrev();
      addDaily(d);
      setNextUpdate(24 * 60 * 60); // リセット（日秒）
    }, 3 * 60 * 1000);

    // カウントダウン用のタイマー（1秒ごと）
    countdownRef.current = setInterval(() => {
      setNextUpdate((prev) => (prev !== null && prev > 0 ? prev - 1 : 24 * 60 * 60));
    }, 1000);
  };

  const stopAutoGeneration = () => {
    setIsRunning(false);
    setNextUpdate(null);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  };

  const resetAndStart = () => {
    stopAutoGeneration();
    startAutoGeneration();
  };

  // クリーンアップ
  useEffect(() => {
    return () => {
      stopAutoGeneration();
    };
  }, []);

  // 秒を分:秒形式に変換
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardHeader>
        <CardTitle>展示用データ生成</CardTitle>
          <CardDescription>
            1日ごとにデータを自動生成（デモ用）
          </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button onClick={startAutoGeneration} className="gap-2">
              <Play className="h-4 w-4" />
              開始
            </Button>
          ) : (
            <Button onClick={stopAutoGeneration} variant="destructive" className="gap-2">
              <Pause className="h-4 w-4" />
              停止
            </Button>
          )}
          
          {isRunning && (
            <Button onClick={resetAndStart} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              リセット
            </Button>
          )}
        </div>

        {!isRunning && (
          <p className="text-sm text-muted-foreground">
            開始ボタンを押すと、30秒ごとに30〜180分のランダムな活動時間データが生成されます。
          </p>
        )}
      </CardContent>
    </Card>
  );
}

