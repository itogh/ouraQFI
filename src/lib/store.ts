import { create } from "zustand";
import { DailyStats, NormalizationParams, WeightParams, DecayParams, ScoreEd, ScoreQfiPoint, RankBreakpoints, Rank } from "@/lib/types";
import { computeEd, computeQfiSeries, rankFromQfi } from "@/lib/qfi";

// Debug interval control (module-scoped so it's preserved across store recreations)
let __debugInterval: NodeJS.Timeout | null = null;

function stopDebugInterval() {
  if (__debugInterval) {
    clearInterval(__debugInterval);
    __debugInterval = null;
  }
}

function startDebugInterval(get: any, set: any) {
  stopDebugInterval();
  // every 3 minutes
  __debugInterval = setInterval(() => {
    try {
      const state = get();
      const prevEds: ScoreEd[] = state.eds;
      const lastEd = prevEds.length ? prevEds[prevEds.length - 1].ed : 0;

      // target ed: keep delta within ±8
      const delta = (Math.random() * 16) - 8; // -8..+8
      const targetEd = lastEd + delta;

      // compute required timeMinutes to realize targetEd assuming money/emotion=0
      const { norm, weights } = state;
      const alpha = weights.alpha || 1;
      const sigmaTime = norm.sigmaTime || 1;
      const muTime = norm.muTime || 0;

      // ed = alpha * (time - mu) / sigma  => time = (ed/alpha)*sigma + mu
      let timeMinutes = (targetEd / alpha) * sigmaTime + muTime;
      if (!Number.isFinite(timeMinutes)) timeMinutes = muTime;
      if (timeMinutes < 0) timeMinutes = 0;

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const rec: DailyStats = {
        date: dateStr,
        timeMinutes: Math.round(timeMinutes),
        moneyJpy: 0,
        emotionZ: 0,
        capturedAt: now.toISOString(),
      };

      // add
      state.addDaily(rec);
    } catch (e) {
      // ignore
    }
  }, 3 * 60 * 1000);
}

export type AppState = {
  norm: NormalizationParams;
  weights: WeightParams;
  decay: DecayParams;
  ranks: RankBreakpoints;
  daily: DailyStats[];
  eds: ScoreEd[];
  qfi: ScoreQfiPoint[];
  latestRank?: Rank;
  debugMode: boolean;
  addDaily: (input: DailyStats | DailyStats[]) => void;
  recompute: () => void;
  reset: () => void;
  setParams: (p: Partial<{
    norm: NormalizationParams;
    weights: WeightParams;
    decay: DecayParams;
    ranks: RankBreakpoints;
  }>) => void;
  enableDebug: () => void;
  disableDebug: () => void;
  generateDebugOnce: () => void;
};

const defaultNorm: NormalizationParams = {
  muTime: 60,
  sigmaTime: 20,
  muMoney: 1000,
  sigmaMoney: 400,
};

const defaultWeights: WeightParams = {
  alpha: 1,
  beta: 1,
  gamma: 1,
};

const defaultDecay: DecayParams = {
  halfLifeDays: 14,
};

const defaultRanks: RankBreakpoints = {
  A: 9,
  B: 7,
  C: 5,
  D: 3,
};

export const useAppStore = create<AppState>((set, get) => ({
  norm: defaultNorm,
  weights: defaultWeights,
  decay: defaultDecay,
  ranks: defaultRanks,
  daily: [],
  eds: [],
  qfi: [],
  latestRank: undefined,
  debugMode: false,

  addDaily: (input) => {
    const arr = Array.isArray(input) ? input : [input];
    // Ensure each record has a capturedAt timestamp
    const withTs = arr.map((r) => ({
      ...r,
      capturedAt: (r as any).capturedAt ?? new Date().toISOString(),
    }));
    set((s) => ({ daily: [...s.daily, ...withTs] }));
    get().recompute();
  },

  // Debug generation controls
  enableDebug: () => {
    if (get().debugMode) return;
    set({ debugMode: true });
    // start interval
    startDebugInterval(get, set);
  },

  disableDebug: () => {
    if (!get().debugMode) return;
    set({ debugMode: false });
    stopDebugInterval();
  },

  generateDebugOnce: () => {
    // replicate the same logic as in the interval
    const state = get();
    try {
      const prevEds: ScoreEd[] = state.eds;
      const lastEd = prevEds.length ? prevEds[prevEds.length - 1].ed : 0;

      const delta = (Math.random() * 16) - 8;
      const targetEd = lastEd + delta;

      const { norm, weights } = state;
      const alpha = weights.alpha || 1;
      const sigmaTime = norm.sigmaTime || 1;
      const muTime = norm.muTime || 0;

      let timeMinutes = (targetEd / alpha) * sigmaTime + muTime;
      if (!Number.isFinite(timeMinutes)) timeMinutes = muTime;
      if (timeMinutes < 0) timeMinutes = 0;

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const rec: DailyStats = {
        date: dateStr,
        timeMinutes: Math.round(timeMinutes),
        moneyJpy: 0,
        emotionZ: 0,
        capturedAt: now.toISOString(),
      };

      state.addDaily(rec);
    } catch (e) {
      // ignore
    }
  },

  recompute: () => {
    const { daily, norm, weights, decay, ranks } = get();
    const sorted = [...daily].sort((a, b) => a.date.localeCompare(b.date));
    const eds = computeEd(sorted, { norm, weights });
    const qfi = computeQfiSeries(eds, decay);
    const latest = qfi.at(-1)?.qfi ?? 0;
    const latestRank = rankFromQfi(latest, ranks);
    set({ eds, qfi, latestRank });
  },

  reset: () => set({ daily: [], eds: [], qfi: [], latestRank: undefined }),

  setParams: (p) => {
    set(p);
    get().recompute();
  },
}));
