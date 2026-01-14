"use client";

import { DailyStats } from "@/lib/types";
import { Button } from "@/components/ui/button";

interface InputFormProps {
  onSubmit: (data: DailyStats) => void;
  onReset?: () => void;
}

export function InputForm({ onSubmit, onReset }: InputFormProps) {
  // 時間入力を表示しないため、timeMinutes は常に 0 に固定する（デモ用）

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 日付は今日の日付を使用。timeMinutes はデモ用に 0 固定
    const today = new Date().toISOString().split("T")[0];

    onSubmit({
      date: today,
      timeMinutes: 0,
      moneyJpy: 0,
      emotionZ: 0,
    });
  };

  const handleResetClick = () => {
    onReset?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <Button type="submit">追加</Button>
        <Button type="button" variant="outline" onClick={handleResetClick}>
          リセット
        </Button>
      </div>
    </form>
  );
}

