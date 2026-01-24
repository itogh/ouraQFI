"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import type { AppState } from "@/lib/store";
import type { DailyStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";

export function AutoDataGenerator() {
  const [isRunning, setIsRunning] = useState(false);
  const [nextUpdate, setNextUpdate] = useState<number | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { addDaily } = useAppStore();
  const generateDebugOnce = useAppStore((s) => s.generateDebugOnce);

  // 20日分の仮データを一括生成する（連続する ED の差分を ±3 に抑える）
  const generate20Days = () => {
    const DAYS = 20;
    const hasGetState = typeof (useAppStore as unknown as { getState?: unknown }).getState === "function";
    const state: AppState | null = hasGetState
      ? (useAppStore as unknown as { getState: () => AppState }).getState()
      : null;

  const norm = state?.norm ?? { muTime: 60, sigmaTime: 20, muMoney: 1000, sigmaMoney: 400 };
  const weights = state?.weights ?? { alpha: 1, beta: 1, gamma: 1 };
    const alpha = weights.alpha || 1;
    const sigmaTime = norm.sigmaTime || 1;
    const muTime = norm.muTime || 0;

    // 初期 ED を -5..5 の範囲でランダムに採る
    const eds: number[] = [];
    eds[0] = -5 + Math.random() * 10;
    for (let i = 1; i < DAYS; i++) {
      // 前日との差分を -3..+3 に抑える
      const delta = (Math.random() * 6) - 3; // -3..+3
      eds[i] = eds[i - 1] + delta;
    }

    // 日付は古い順（DAYS-1 日前 から 今日 まで）
  const recs: DailyStats[] = [];
    const base = new Date();
    base.setHours(0, 0, 0, 0);
    base.setDate(base.getDate() - (DAYS - 1));
    for (let i = 0; i < DAYS; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];

      // ED を満たすように、まず money/emotion を決め、それらを使って timeMinutes を逆算する
      const ed = eds[i];
      // pick money and emotion first
      const moneyJpy = Math.round(Math.random() * 1000);
      const emotionZ = Math.max(-3, Math.min(3, (Math.random() * 2 - 1) * 1.5));

      const muMoney = norm.muMoney ?? 0;
      const sigmaMoney = norm.sigmaMoney || 1;
      const beta = weights.beta ?? 0;
      const gamma = weights.gamma ?? 0;

      const zMoney = sigmaMoney > 0 ? (moneyJpy - muMoney) / sigmaMoney : 0;
      const zEmotion = emotionZ; // already sensor z-score style

      // timeMinutes を解く: ed = alpha*zTime + beta*zMoney + gamma*zEmotion
      // zTime = (timeMinutes - muTime) / sigmaTime
      let timeMinutes = ((ed - (beta * zMoney) - (gamma * zEmotion)) / alpha) * sigmaTime + muTime;
      if (!Number.isFinite(timeMinutes)) timeMinutes = muTime;
      if (timeMinutes < 1) timeMinutes = 1;
      timeMinutes = Math.min(24 * 60, timeMinutes);

      recs.push({
        date: dateStr,
        timeMinutes: Math.round(timeMinutes),
        moneyJpy,
        emotionZ,
        capturedAt: new Date(d).toISOString(),
      });
    }

    addDaily(recs);
  };

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
    }, 24 * 60 * 60 * 1000);

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
          <Button onClick={generate20Days} variant="outline" className="gap-2">
            20日分生成
          </Button>
          <Button onClick={() => generateDebugOnce()} variant="secondary" className="gap-2">
            1件生成
          </Button>
          
          {isRunning && (
            <Button onClick={resetAndStart} variant="outline" className="gap-2">
              <RotateCcw className="h-4 w-4" />
              リセット
            </Button>
          )}
        </div>

        {!isRunning && (
          <p className="text-sm text-muted-foreground">
              開始ボタンを押すと、1日ごとに30〜180分のランダムな活動時間データが生成されます。
            </p>
        )}
      </CardContent>
    </Card>
  );
}

