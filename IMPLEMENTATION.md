# TRACE (Quantified Faith Index) UI - 実装ドキュメント

## 📋 概要

UI仕様書に完全準拠したTRACE（Quantified Faith Index）フロントエンドの実装が完了しました。

## 🎯 技術スタック

- **Framework**: Next.js 15 (React 19)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4
- **UI Library**: shadcn/ui（カスタムコンポーネント）
- **State Management**: Zustand
- **Charts**: Recharts
- **Icons**: lucide-react
- **ダークモード**: `.dark`クラス切替、LocalStorage永続化

## 🚀 起動手順

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev

# プロダクションビルド
pnpm build

# プロダクションサーバーの起動
pnpm start
```

開発サーバー起動後、http://localhost:3000 でアプリケーションにアクセスできます。

## 📁 ファイル構成

```
src/
├── app/
│   ├── page.tsx              # メインダッシュボード
│   ├── layout.tsx            # ルートレイアウト（ダークモード対応）
│   └── globals.css           # Tailwind & HSLトークン
├── components/
│   ├── ui/                   # shadcn/ui拡張コンポーネント
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── badge.tsx
│   │   ├── table.tsx
│   │   ├── tabs.tsx
│   │   ├── switch.tsx
│   │   ├── dialog.tsx
│   │   └── tooltip.tsx
│   ├── RankBadge.tsx         # ランク表示バッジ（A～E）
│   ├── EdChart.tsx           # 日次スコア棒グラフ
│   ├── QfiChart.tsx          # 累積スコア折れ線グラフ (TRACE)
│   ├── InputForm.tsx         # データ入力フォーム
│   ├── DataTable.tsx         # データ一覧テーブル
│   ├── SettingsDialog.tsx    # パラメータ設定ダイアログ
│   └── ThemeToggle.tsx       # ダークモード切替
└── lib/
    ├── types.ts              # 型定義
    ├── qfi.ts                # TRACE計算ロジック (内部ファイル名は変更していません)
    ├── store.ts              # Zustand ストア
    ├── mockApi.ts            # モックAPI
    ├── config.ts             # 設定
    └── utils.ts              # ユーティリティ関数
```

## 🧩 主要コンポーネント

### 1. RankBadge

**Props**: `rank: Rank`

ランク（A～E）を色分けして表示するバッジコンポーネント。

- **A**: 緑色（`text-green-500`）
- **B**: 青色（`text-blue-500`）
- **C**: 黄色（`text-yellow-500`）
- **D**: オレンジ色（`text-orange-500`）
- **E**: 赤色（`text-red-500`）

### 2. EdChart

**Props**: `data: ScoreEd[]`

日次スコア（Ed）を棒グラフで表示。カスタムツールチップには以下を表示：
- 日付
- Edスコア
- 内訳（zTime）

### 3. QfiChart (TRACE表示用)

**Props**: `data: ScoreQfiPoint[]`

累積スコア（TRACE）を折れ線グラフで表示。カスタムツールチップには以下を表示：
- 日付
- TRACE値
- 前日差分（delta）

### 4. InputForm

**Props**: 
- `onSubmit: (data: DailyStats) => void`
- `onReset?: () => void`
- `defaultValues?: Partial<DailyStats>`

データ入力フォーム。バリデーション機能付き：
- 時間（分）: 0以上

### 5. DataTable

**Props**: `data: DailyStats[]`, `eds: ScoreEd[]`, `qfi: ScoreQfiPoint[]`

データを一覧表示するテーブル。ページネーション機能付き（10件/ページ）。

### 6. SettingsDialog

パラメータ調整用ダイアログ：
- 正規化パラメータ（μ, σ）
- 重みパラメータ（α, β, γ）
- 減衰パラメータ（半減期）
- ランク閾値（A, B, C, D）

変更後は自動的に再計算されます。

### 7. ThemeToggle

ダークモード切替ボタン。LocalStorageで設定を永続化。

## 📊 データフロー

1. **入力**: `InputForm`でデータを入力
2. **保存**: Zustandストアの`addDaily`で保存
3. **計算**: `qfi.ts`の純関数で Ed → TRACE（内部的には qfi を使用）を計算
4. **表示**: チャートとテーブルで可視化
5. **ランク判定**: TRACE値に基づいてランクを自動決定

## 🎨 デザイン仕様

### カラーパレット

HSLトークンベースのshadcn/uiデフォルトカラーを使用。

### ランクカラー

| ランク | 色 | 用途 |
|-------|-----|------|
| A | `text-green-500` | 最高評価 |
| B | `text-blue-500` | 高評価 |
| C | `text-yellow-500` | 中評価 |
| D | `text-orange-500` | 低評価 |
| E | `text-red-500` | 最低評価 |

### レスポンシブデザイン

- **モバイル（< sm）**: 1カラムレイアウト
- **タブレット（sm～lg）**: 2カラムレイアウト
- **デスクトップ（lg～）**: 最大幅1280px、中央揃え

### スペーシング

- セクション間: `space-y-8`
- カード内: `p-6`
- フォーム: `gap-4`

## ♿ アクセシビリティ

- コントラスト比 4.5:1 以上を確保
- フォーカスリング・キーボード操作対応
- アイコンに`aria-label`を付与
- ツールチップで補足説明

## 🧪 サンプルデータ

「サンプルデータを読み込む」ボタンで7日分のテストデータを読み込めます：

```typescript
const sampleData = [
  { date: "2025-10-21", timeMinutes: 60, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-22", timeMinutes: 90, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-23", timeMinutes: 45, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-24", timeMinutes: 120, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-25", timeMinutes: 75, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-26", timeMinutes: 60, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-27", timeMinutes: 100, moneyJpy: 0, emotionZ: 0 },
];
```

## 📝 型定義

### DailyStats

```typescript
type DailyStats = {
  date: string;         // "YYYY-MM-DD"
  timeMinutes: number;  // >= 0
  moneyJpy: number;     // 常に0（計算ロジックに埋め込み）
  emotionZ: number;     // 常に0（計算ロジックに埋め込み）
};
```

### ScoreEd

```typescript
type ScoreEd = {
  date: string;
  ed: number;
  zTime?: number;
};
```

### ScoreQfiPoint

```typescript
type ScoreQfiPoint = {
  date: string;
  qfi: number;
  delta?: number;
};
```

### Rank

```typescript
type Rank = "A" | "B" | "C" | "D" | "E";
```

## ✅ 実装機能

### 必須機能（すべて実装済み）

- ✅ メインダッシュボード
- ✅ ヘッダー（タイトル + ランク表示）
- ✅ Ed棒グラフ
- ✅ TRACE折れ線グラフ
- ✅ 入力フォーム（追加/リセット）
- ✅ ランクカラーリング
- ✅ レスポンシブデザイン
- ✅ ダークモード対応

### 推奨機能（すべて実装済み）

- ✅ データテーブル
- ✅ RankBadge
- ✅ チャートツールチップ拡張
- ✅ サンプルデータ読込
- ✅ ThemeToggle
- ✅ 空データプレースホルダー
- ✅ SettingsDialog（パラメータ調整）

## 🔍 主要な変更点

1. **型定義の修正**: 仕様に完全準拠（`value`→`ed`/`qfi`、`a/b/c/d`→`A/B/C/D`）
2. **配列処理対応**: `computeEd`に配列オーバーロードを追加
3. **Zustandストア**: `addDaily`の配列対応、`setParams`の追加
4. **コンポーネント新規作成**: すべての必須・推奨コンポーネントを実装
5. **Tailwind v4対応**: HSLトークンとカスタムプロパティの設定

## 🐛 トラブルシューティング

### ビルドエラーが発生する場合

```bash
# node_modulesを削除して再インストール
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### ダークモードが動作しない場合

ブラウザのLocalStorageをクリアしてページをリロードしてください。

### チャートが表示されない場合

サンプルデータを読み込むか、手動でデータを入力してください。

## 📄 ライセンス

このプロジェクトのライセンスは、プロジェクトのREADME.mdを参照してください。

---

**実装完了日**: 2025-10-28

**バージョン**: 1.0.0

すべての仕様要件を満たし、型エラー・ESLintエラーなしでビルドに成功しています。

