"use client";

import { useState, useEffect, useRef } from "react";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pause, RotateCcw } from "lucide-react";

export function AutoDataGenerator() {
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);
  const { addDaily } = useAppStore();

  // ランダムなデータを生成
  const generateRandomData = () => {
    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];
    
    // ランダムな時間（30〜180分）
    const timeMinutes = Math.floor(Math.random() * 150) + 30;
    
    return {
      date: dateStr,
      timeMinutes,
      moneyJpy: 0,
      emotionZ: 0,
    };
  };

  // 30秒ごとにデータを追加
  const startAutoGeneration = () => {
    if (isRunning) return;

    setIsRunning(true);

    // 最初のデータをすぐに追加
    const data = generateRandomData();
    addDaily(data);

    // 30秒ごとにデータを追加
    intervalRef.current = setInterval(() => {
      const data = generateRandomData();
      addDaily(data);
    }, 30000); // 30秒 = 30,000ミリ秒

    // カウントダウン用のタイマー（1秒ごと）
    countdownRef.current = setInterval(() => {
      // カウントダウンは表示しないので空のまま
    }, 1000);
  };

  const stopAutoGeneration = () => {
    setIsRunning(false);

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

