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

function startDebugInterval(get: () => AppState, set: (patch: Partial<AppState>) => void) {
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

      // より実運用らしいランダム性を与える: 前回の timeMinutes を中心にノイズを付与
      const prevDaily = state.daily ?? [];
      const lastTime = prevDaily.length ? prevDaily[prevDaily.length - 1].timeMinutes : null;

      let timeMinutes: number;
      if (lastTime === null) {
        timeMinutes = Math.round(30 + Math.random() * 150); // 30..180
      } else {
        const rand = () => {
          let sum = 0;
          for (let i = 0; i < 6; i++) sum += (Math.random() - 0.5);
          return sum;
        };
        const sd = 20;
        const deltaTime = Math.round(rand() * sd);
        timeMinutes = Math.max(1, lastTime + deltaTime);
        timeMinutes = Math.min(24 * 60, timeMinutes);
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const rec: DailyStats = {
        date: dateStr,
        timeMinutes: Math.round(timeMinutes),
        moneyJpy: Math.round(Math.random() * 1000),
        emotionZ: Math.max(-3, Math.min(3, (Math.random() * 2 - 1) * 1.5)),
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
  // when true, the first record for a given date is kept and subsequent same-day writes are ignored
  lockDailyOncePerDay: boolean;
  addDaily: (input: DailyStats | DailyStats[]) => void;
  recompute: () => void;
  reset: () => void;
  setParams: (p: Partial<{
    norm: NormalizationParams;
    weights: WeightParams;
    decay: DecayParams;
    ranks: RankBreakpoints;
  }>) => void;
  setLockDailyOncePerDay: (v: boolean) => void;
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

// Sanitize/normalize parameters loaded from persistence or user input.
// This prevents degenerate values (zero/very-small sigma, zero A-rank, etc.)
function sanitizeParams(input?: Partial<{
  norm: NormalizationParams;
  weights: WeightParams;
  decay: DecayParams;
  ranks: RankBreakpoints;
}>) {
  // merge with defaults
  const norm: NormalizationParams = {
    muTime: input?.norm?.muTime ?? defaultNorm.muTime,
    sigmaTime: input?.norm?.sigmaTime ?? defaultNorm.sigmaTime,
    muMoney: input?.norm?.muMoney ?? defaultNorm.muMoney,
    sigmaMoney: input?.norm?.sigmaMoney ?? defaultNorm.sigmaMoney,
  };
  // enforce reasonable minima to avoid huge z-scores / divide-by-small
  norm.sigmaTime = Math.max(1, Number(norm.sigmaTime) || 1);
  norm.sigmaMoney = Math.max(1, Number(norm.sigmaMoney) || 1);

  const weights: WeightParams = {
    alpha: input?.weights?.alpha ?? defaultWeights.alpha,
    beta: input?.weights?.beta ?? defaultWeights.beta,
    gamma: input?.weights?.gamma ?? defaultWeights.gamma,
  };
  weights.alpha = Math.max(0.01, Number(weights.alpha) || 0.01);
  weights.beta = Math.max(0.0, Number(weights.beta) || 0.0);
  weights.gamma = Math.max(0.0, Number(weights.gamma) || 0.0);

  const decay: DecayParams = {
    halfLifeDays: input?.decay?.halfLifeDays ?? defaultDecay.halfLifeDays,
  };
  decay.halfLifeDays = Math.max(1, Number(decay.halfLifeDays) || 1);

  const ranks: RankBreakpoints = {
    A: input?.ranks?.A ?? defaultRanks.A,
    B: input?.ranks?.B ?? defaultRanks.B,
    C: input?.ranks?.C ?? defaultRanks.C,
    D: input?.ranks?.D ?? defaultRanks.D,
  };
  // Aは最低1以上にする（0だと表示で -Infinity になり得る）
  ranks.A = Math.max(1, Number(ranks.A) || 1);
  // 他は A より小さくすることもあるが負やNaNは避ける
  ranks.B = Math.max(0, Number(ranks.B) || 0);
  ranks.C = Math.max(0, Number(ranks.C) || 0);
  ranks.D = Math.max(0, Number(ranks.D) || 0);

  return { norm, weights, decay, ranks };
}

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
  lockDailyOncePerDay: false,

  addDaily: (input) => {
    const arr = Array.isArray(input) ? input : [input];
    // Ensure each record has a capturedAt timestamp
    const withTs = arr.map((r) => ({
      ...r,
      capturedAt: (r as DailyStats).capturedAt ?? new Date().toISOString(),
    }));
    // Merge records by date. If lockDailyOncePerDay is true, do not overwrite existing same-day records.
    set((s) => {
      const existing = [...s.daily];
      for (const rec of withTs) {
        const idx = existing.findIndex((d) => d.date === rec.date);
        if (idx >= 0) {
          if (s.lockDailyOncePerDay) {
            // skip overwrite
            continue;
          } else {
            existing[idx] = { ...existing[idx], ...rec };
          }
        } else {
          existing.push(rec);
        }
      }
      return { daily: existing };
    });
    get().recompute();
    // If debug mode is on, output recent state to help diagnose ED/QFI behavior
    const state = get();
    if (state.debugMode) {
      try {
        // show last 10 entries for daily, eds, qfi
        // eslint-disable-next-line no-console
        console.debug("[ouraQFI debug] recent daily:", state.daily.slice(-10));
        // eslint-disable-next-line no-console
        console.debug("[ouraQFI debug] recent eds:", state.eds.slice(-10));
        // eslint-disable-next-line no-console
        console.debug("[ouraQFI debug] recent qfi:", state.qfi.slice(-10));
        // eslint-disable-next-line no-console
        console.debug("[ouraQFI debug] params:", { ranks: state.ranks, norm: state.norm, weights: state.weights, decay: state.decay });
      } catch (e) {
        // ignore
      }
    }
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
      // use same realistic generator as the debug interval: randomize timeMinutes around previous value
      const prevDaily = state.daily ?? [];
      const lastTime = prevDaily.length ? prevDaily[prevDaily.length - 1].timeMinutes : null;

      let timeMinutes: number;
      if (lastTime === null) {
        timeMinutes = Math.round(30 + Math.random() * 150);
      } else {
        const rand = () => {
          let sum = 0;
          for (let i = 0; i < 6; i++) sum += (Math.random() - 0.5);
          return sum;
        };
        const sd = 20;
        const deltaTime = Math.round(rand() * sd);
        timeMinutes = Math.max(1, lastTime + deltaTime);
        timeMinutes = Math.min(24 * 60, timeMinutes);
      }

      const now = new Date();
      const dateStr = now.toISOString().split("T")[0];

      const rec: DailyStats = {
        date: dateStr,
        timeMinutes: Math.round(timeMinutes),
        moneyJpy: Math.round(Math.random() * 1000),
        emotionZ: Math.max(-3, Math.min(3, (Math.random() * 2 - 1) * 1.5)),
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
    // sanitize incoming partial params and apply
    const sanitized = sanitizeParams(p);
    set(sanitized);
    get().recompute();
  },
  setLockDailyOncePerDay: (v: boolean) => set({ lockDailyOncePerDay: v }),
}));

// Persist to localStorage in the browser so data survives reloads.
if (typeof window !== "undefined") {
  const STORAGE_KEY = "ouraQFI:store";
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      let parsed: unknown = null;
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch (e) {
        // corrupted store — ignore and overwrite on next change
        parsed = null;
      }
      if (parsed && typeof parsed === "object") {
        // Only restore known keys
        type Persisted = {
          daily?: DailyStats[];
          norm?: NormalizationParams;
          weights?: WeightParams;
          decay?: DecayParams;
          ranks?: RankBreakpoints;
        };
        const obj = parsed as Persisted;
        const { daily, norm, weights, decay, ranks } = obj;
        // sanitize persisted params before applying
        const sanitized = sanitizeParams({ norm, weights, decay, ranks });
        useAppStore.setState({
          norm: sanitized.norm,
          weights: sanitized.weights,
          decay: sanitized.decay,
          ranks: sanitized.ranks,
          ...(daily ? { daily } : {}),
        });
        // Recompute derived values after hydration
        useAppStore.getState().recompute();
      }
    }
  } catch (e) {
    // ignore
  }

  // Subscribe and save on changes (debounce not necessary for small state)
  useAppStore.subscribe((s) => {
    try {
      const toSave = {
        daily: s.daily,
        norm: s.norm,
        weights: s.weights,
        decay: s.decay,
        ranks: s.ranks,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      // ignore
    }
  });
}
