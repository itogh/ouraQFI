"use client";

import { useState } from "react";
import { DailyStats } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface InputFormProps {
  onSubmit: (data: DailyStats) => void;
  onReset?: () => void;
  defaultValues?: Partial<DailyStats>;
}

export function InputForm({ onSubmit, onReset, defaultValues }: InputFormProps) {
  // 時間入力を表示しないため、timeMinutes は常に 0 に固定する（デモ用）
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newErrors: Record<string, string> = {};
    // 今回は時間入力を受け付けないためバリデーション不要
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});
    
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
    setErrors({});
    setErrors({});
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

