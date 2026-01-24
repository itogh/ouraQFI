export type InputSample = {
  timestampIso: string; // ISO8601
  minutesEngaged: number; // t: 推し関連活動時間(分)
  moneySpentJpy: number; // m: 金額(JPY)
  emotionZScore: number; // e: センサ側Zスコア済
};

export type DailyStats = {
  date: string; // YYYY-MM-DD
  timeMinutes: number;
  moneyJpy: number;
  emotionZ: number;
  capturedAt?: string; // ISO timestamp when this record was captured
  // ephemeral: true means this record is a transient measurement and should not trigger ED/QFI recompute
  ephemeral?: boolean;
};

export type NormalizationParams = {
  muTime: number; // μ_t
  sigmaTime: number; // σ_t (>0)
  muMoney: number; // μ_m
  sigmaMoney: number; // σ_m (>0)
};

export type WeightParams = {
  alpha: number; // α
  beta: number; // β
  gamma: number; // γ
};

export type DecayParams = {
  halfLifeDays: number; // 例: 7
};

export type ScoreEd = {
  date: string;
  ed: number;
  capturedAt?: string;
  zTime?: number;
  zMoney?: number;
  zEmotion?: number;
};

export type ScoreQfiPoint = {
  date: string;
  qfi: number;
  delta?: number;
};

export type Rank = "A" | "B" | "C" | "D" | "E";

export type RankBreakpoints = {
  // 上位から順: A > B > C > D > E
  A: number; // 分位またはスコア閾値
  B: number;
  C: number;
  D: number;
};

export type DevotionSignature = {
  edDate: string;
  edValue: number;
  signatureHex: string;
  signerAddress?: string;
};

export type ApiConfig = {
  baseUrl: string; // 可変ドメイン
};

export type EdRecordPayload = {
  ed: ScoreEd;
  signature: DevotionSignature;
};



