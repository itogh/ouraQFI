import { DailyStats, NormalizationParams, WeightParams, DecayParams, ScoreEd, ScoreQfiPoint, Rank, RankBreakpoints } from "@/lib/types";

// Pure functions: 再利用可能・副作用なし

export function computeZTime(timeMinutes: number, params: NormalizationParams): number {
  const { muTime, sigmaTime } = params;
  if (sigmaTime <= 0) return 0;
  return (timeMinutes - muTime) / sigmaTime;
}

export function computeZMoney(moneyJpy: number, params: NormalizationParams): number {
  const { muMoney, sigmaMoney } = params;
  if (sigmaMoney <= 0) return 0;
  return (moneyJpy - muMoney) / sigmaMoney;
}

// 単一データ用
export function computeEd(
  stats: DailyStats,
  options: { norm: NormalizationParams; weights: WeightParams }
): ScoreEd;

// 複数データ用（配列）
export function computeEd(
  stats: DailyStats[],
  options: { norm: NormalizationParams; weights: WeightParams }
): ScoreEd[];

// 実装
export function computeEd(
  stats: DailyStats | DailyStats[],
  options: { norm: NormalizationParams; weights: WeightParams }
): ScoreEd | ScoreEd[] {
  const { norm, weights } = options;
  
  const processOne = (s: DailyStats): ScoreEd => {
    const zTime = computeZTime(s.timeMinutes, norm);
    const zMoney = computeZMoney(s.moneyJpy, norm);
    const zEmotion = s.emotionZ; // センサー側Z済

    const ed = weights.alpha * zTime + weights.beta * zMoney + weights.gamma * zEmotion;
    return {
      date: s.date,
      ed,
      zTime,
      zMoney,
      zEmotion,
    };
  };

  if (Array.isArray(stats)) {
    return stats.map(processOne);
  } else {
    return processOne(stats);
  }
}

export function computeLambdaFromHalfLifeDays(halfLifeDays: number): number {
  if (halfLifeDays <= 0) return Math.log(2) / 7; // デフォルト
  return Math.log(2) / halfLifeDays;
}

export function computeQfiSeries(eds: ScoreEd[], decay: DecayParams): ScoreQfiPoint[] {
  const lambda = computeLambdaFromHalfLifeDays(decay.halfLifeDays);
  // 時系列が日付昇順に並んでいることを仮定
  const qfi: ScoreQfiPoint[] = [];
  let prevQfi = 0;
  for (let i = 0; i < eds.length; i++) {
    const ed = eds[i];
    // 連続日と仮定して 1日あたり e^{-λ} 減衰
    const decayFactor = i === 0 ? 0 : Math.exp(-lambda);
    const current = ed.ed + prevQfi * decayFactor;
    const delta = i === 0 ? 0 : current - prevQfi;
    // 防御: 異常に大きな値が現れた場合はクリップする
    const CLAMP_QFI = 1000;
    const clipped = Math.max(-CLAMP_QFI, Math.min(CLAMP_QFI, current));
    qfi.push({ date: ed.date, qfi: clipped, delta: i === 0 ? 0 : clipped - prevQfi });
    prevQfi = clipped;
  }
  return qfi;
}

export function rankFromQfi(latestQfi: number, bp: RankBreakpoints): Rank {
  // 降順閾値: A>=A, B>=B, C>=C, D>=D, else E
  if (latestQfi >= bp.A) return "A";
  if (latestQfi >= bp.B) return "B";
  if (latestQfi >= bp.C) return "C";
  if (latestQfi >= bp.D) return "D";
  return "E";
}
