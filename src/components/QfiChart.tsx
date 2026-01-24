"use client";

import { ScoreQfiPoint } from "@/lib/types";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from "recharts";

interface QfiChartProps {
  data: ScoreQfiPoint[];
}

export function QfiChart({ data }: QfiChartProps) {
  // カスタムツールチップ
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: ScoreQfiPoint }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload as ScoreQfiPoint;
      return (
        <div className="bg-background border rounded-lg shadow-lg p-3">
          <p className="font-semibold text-sm mb-1">{item.date}</p>
          <p className="text-sm text-foreground">
            TRACE: <span className="font-medium">{item.qfi.toFixed(2)}</span>
          </p>
          {item.delta !== undefined && item.delta !== 0 && (
            <p className="text-xs text-muted-foreground">
              変化: {item.delta > 0 ? "+" : ""}{item.delta.toFixed(2)}
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
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
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
          <Line
            type="monotone"
            dataKey="qfi"
            stroke={`hsl(var(--primary))`}
            strokeWidth={2}
            dot={false}
            name="TRACE"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

