"use client";

import { ScoreEd } from "@/lib/types";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface EdChartProps {
  data: ScoreEd[];
}

export function EdChart({ data }: EdChartProps) {
  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScoreEd }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ScoreEd;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{item.date}</p>
          <p className="text-sm text-foreground">
            Ed: <span className="font-medium">{item.ed.toFixed(2)}</span>
          </p>
          {item.zTime !== undefined && (
            <p className="text-xs text-muted-foreground">
              zTime: {item.zTime.toFixed(2)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  if (data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-muted-foreground">
        データがありません
      </div>
    );
  }

  return (
    <div className="h-64">
      <div className="mb-2 text-sm text-muted-foreground">
        日時スコア: 日付ごとの Ed 値を示します。活動時間を正規化して算出されたスコアです。
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={`hsl(var(--border) / 0.6)`} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <YAxis
            tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          <Bar dataKey="ed" fill="#ef4444" name="Ed スコア" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

