"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
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

    // 前回の ed を取得
    const state = (useAppStore as any).getState ? (useAppStore as any).getState() : null;
    const prevEds = state?.eds ?? [];
    const lastEd = prevEds.length ? prevEds[prevEds.length - 1].ed : 0;

    // delta を -5..+5 にする
    const delta = (Math.random() * 10) - 5;
    const targetEd = lastEd + delta;

    // store と同じ正規化パラメータを使って timeMinutes を逆算
    const { norm = { muTime: 60, sigmaTime: 20 }, weights = { alpha: 1 } } = state ?? {};
    const alpha = weights.alpha || 1;
    const sigmaTime = norm.sigmaTime || 1;
    const muTime = norm.muTime || 0;

    let timeMinutes = (targetEd / alpha) * sigmaTime + muTime;
    if (!Number.isFinite(timeMinutes)) timeMinutes = muTime;
    if (timeMinutes < 0) timeMinutes = 0;

    return {
      date: dateStr,
      timeMinutes: Math.round(timeMinutes),
      moneyJpy: 0,
      emotionZ: 0,
    };
  };

  // 3分ごとにデータを追加（デバッグ用 interval とは別に、ユーザー操作で動かす自動生成）
  const startAutoGeneration = () => {
    if (isRunning) return;

    setIsRunning(true);
    setNextUpdate(180); // 180秒 = 3分

    // 最初のデータをすぐに追加
    const data = generateBasedOnPrev();
    addDaily(data);

    // 3分ごとにデータを追加
    intervalRef.current = setInterval(() => {
      const d = generateBasedOnPrev();
      addDaily(d);
      setNextUpdate(180); // リセット
    }, 3 * 60 * 1000);

    // カウントダウン用のタイマー（1秒ごと）
    countdownRef.current = setInterval(() => {
      setNextUpdate((prev) => (prev !== null && prev > 0 ? prev - 1 : 180));
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
            30秒毎にデータを自動生成（デモ用）
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

