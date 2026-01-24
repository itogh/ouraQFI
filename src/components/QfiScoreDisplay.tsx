"use client";

import { useAppStore } from "@/lib/store";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useEffect, useState } from "react";

export function QfiScoreDisplay() {
  const { qfi, ranks } = useAppStore();
  const [prevScore, setPrevScore] = useState<number | null>(null);
  
  // 最新のTRACE値を取得
  const latestQfi = qfi.at(-1)?.qfi ?? 0;
  const previousQfi = qfi.length >= 2 ? qfi[qfi.length - 2].qfi : null;
  
  // TRACEを-100〜100にスケーリング
  // 0を中心に、Aランク閾値を100、-Aランク閾値を-100とする
  // 防御: ranks.A が 0 や異常値だと除算で -Infinity/Infinity になり得るため
  // 妥当なフォールバックを使う。
  const rawMax = ranks?.A ?? 9;
  const maxScore = rawMax > 0 ? rawMax : 9;
  if (rawMax <= 0) {
    // レンダリング中の副作用は最小限に留めつつ、開発時に原因が追えるようログ出力
    // 実際の運用では不要であれば削除してください。
    // eslint-disable-next-line no-console
    console.warn("QfiScoreDisplay: invalid ranks.A detected, falling back to", maxScore);
  }

  // 0を中心に正負両方向にスケーリング
  const rawNormalized = Number.isFinite(latestQfi) ? (latestQfi / maxScore) * 100 : 0;
  const isOverflow = Math.abs(rawNormalized) > 100;

  // 表示値：±100にマッピングするが、±100に近づくほど反比例的に上がりづらくする
  // 具体的には f(x) = sign(x) * 100 * (|x| / (|x| + k)) を使う。
  // k は「曲率」係数で、小さいほど早く飽和し、大きいほど線形領域が広がる。
  const compressInverse = (val: number, k = 50) => {
    const sign = val >= 0 ? 1 : -1;
    const abs = Math.abs(val);
    // 小さな値はほぼ線形（abs/(abs+k) ≈ abs/k）、大きな値は 100 に漸近
    const scaled = (abs / (abs + k)) * 100;
    return sign * scaled;
  };

  // 圧縮済みスコア（-100..100 に漸近）を UI に使用する
  const compressedNormalized = Number.isFinite(rawNormalized) ? compressInverse(rawNormalized, 50) : 0;
  const displayScore = Math.round(Math.max(-100, Math.min(100, compressedNormalized)));
  
  // 前回のスコアも計算
  const prevNormalizedScore = previousQfi !== null 
    ? Math.min(100, Math.max(-100, (previousQfi / maxScore) * 100))
    : null;
  const prevDisplayScore = prevNormalizedScore !== null ? Math.round(prevNormalizedScore) : null;
  
  // 変化量を計算（表示は ±5 にクランプ）
  const rawScoreDelta = prevDisplayScore !== null ? displayScore - prevDisplayScore : null;
  const scoreDelta = rawScoreDelta !== null ? Math.max(-5, Math.min(5, rawScoreDelta)) : null;
  
  // スコアが更新されたらアニメーション用の前回値を更新
  useEffect(() => {
    if (displayScore !== prevScore) {
      setPrevScore(displayScore);
    }
  }, [displayScore, prevScore]);
  
  // スコアに応じた色を決定（-100〜100対応）
  const getScoreColor = (score: number): string => {
    if (score >= 90) return "text-green-500";
    if (score >= 70) return "text-blue-500";
    if (score >= 50) return "text-yellow-500";
    if (score >= 30) return "text-yellow-600";
    if (score >= 0) return "text-orange-500";
    if (score >= -30) return "text-red-400";
    if (score >= -60) return "text-red-500";
    return "text-red-600";
  };
  
  // スコアに応じた背景グラデーション（-100〜100対応）
  const getGradientColor = (score: number): string => {
    if (score >= 90) return "from-green-500/10 to-green-500/5";
    if (score >= 70) return "from-blue-500/10 to-blue-500/5";
    if (score >= 50) return "from-yellow-500/10 to-yellow-500/5";
    if (score >= 30) return "from-yellow-600/10 to-yellow-600/5";
    if (score >= 0) return "from-orange-500/10 to-orange-500/5";
    if (score >= -30) return "from-red-400/10 to-red-400/5";
    if (score >= -60) return "from-red-500/10 to-red-500/5";
    return "from-red-600/10 to-red-600/5";
  };

  return (
    <Card className={cn(
      "transition-all duration-500 hover:shadow-lg",
      "bg-linear-to-br",
      getGradientColor(displayScore)
    )}>
      <div className="p-6 text-center space-y-2">
        <div className="text-sm font-medium text-muted-foreground">
          現在のTRACEスコア
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <div className={cn(
            "text-6xl font-bold tabular-nums transition-all duration-500",
            getScoreColor(displayScore)
          )}>
            {displayScore}
            {isOverflow && (
              <span className="ml-2 text-sm align-baseline text-muted-foreground">{rawNormalized > 0 ? "+" : ""} (raw: {latestQfi.toFixed(2)})</span>
            )}
          </div>
          
          {/* 変化量の表示 */}
          {scoreDelta !== null && scoreDelta !== 0 && (
            <div className={cn(
              "flex items-center gap-1 text-lg font-semibold",
              scoreDelta > 0 ? "text-green-500" : "text-red-500"
            )}>
              {scoreDelta > 0 ? (
                <TrendingUp className="h-5 w-5" />
              ) : (
                <TrendingDown className="h-5 w-5" />
              )}
              <span>{Math.abs(scoreDelta)}</span>
            </div>
          )}
          
          {scoreDelta === 0 && prevDisplayScore !== null && (
            <div className="flex items-center gap-1 text-lg font-semibold text-muted-foreground">
              <Minus className="h-5 w-5" />
            </div>
          )}
        </div>
        
        <div className="text-sm text-muted-foreground">
          / 100 {displayScore < 0 && <span className="text-red-500"></span>}
        </div>
        
        {/* プログレスバー（-100〜100対応） */}
        <div className="relative w-full mt-4">
          {/* 中央のゼロライン */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border z-10" />
          
          <div className="w-full bg-muted rounded-full h-3 overflow-hidden relative">
            {displayScore >= 0 ? (
              // 正の値：中央から右へ
              <div
                className="absolute left-1/2 h-3"
                style={{ width: `${displayScore / 2}%` }}
              >
                <div
                  className={cn(
                    "h-3 transition-all duration-1000 ease-out",
                    displayScore >= 90 ? "bg-green-500" :
                    displayScore >= 70 ? "bg-blue-500" :
                    displayScore >= 50 ? "bg-yellow-500" :
                    displayScore >= 30 ? "bg-yellow-600" :
                    "bg-orange-500"
                  )}
                  style={{ width: "100%" }}
                />
              </div>
            ) : (
              // 負の値：中央から左へ
              <div
                className="absolute right-1/2 h-3"
                style={{ width: `${Math.abs(displayScore) / 2}%` }}
              >
                <div
                  className={cn(
                    "h-3 transition-all duration-1000 ease-out ml-auto",
                    displayScore >= -30 ? "bg-red-400" :
                    displayScore >= -60 ? "bg-red-500" :
                    "bg-red-600"
                  )}
                  style={{ width: "100%" }}
                />
              </div>
            )}
          </div>
          
          {/* スケールラベル */}
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>-100</span>
            <span>0</span>
            <span>+100</span>
          </div>
        </div>
        
        {/* 実際のTRACE値（小さく表示） */}
        <div className="text-xs text-muted-foreground pt-2">
          生値 (TRACE): {latestQfi.toFixed(2)}
          {previousQfi !== null && (
            <span className={cn(
              "ml-2",
              latestQfi > previousQfi ? "text-green-500" : 
              latestQfi < previousQfi ? "text-red-500" : 
              "text-muted-foreground"
            )}>
              ({latestQfi > previousQfi ? "+" : ""}{(latestQfi - previousQfi).toFixed(2)})
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}

