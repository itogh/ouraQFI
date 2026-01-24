# UI作成仕様書 - Quantified Faith Index (TRACE)

## 1. プロジェクト概要

### 1.1 目的
貢献度を定量化・可視化するWebアプリケーション。ユーザーが時間データを入力し、日次スコア（Ed）と累積スコア（TRACE）を算出・表示する。

### 1.2 技術スタック
- **フレームワーク**: Next.js 15 (React 19)
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS v4
- **UIコンポーネント**: Shadcn UI
- **状態管理**: Zustand
- **チャート**: Recharts
- **アイコン**: Lucide React

### 1.3 デザインシステム
- **カラーパレット**: Shadcn UIデフォルトテーマ（HSL形式）
- **ダークモード**: 対応必須（`.dark`クラスで切り替え）
- **レスポンシブ**: モバイル・タブレット・デスクトップ対応
- **フォント**: システムフォント（sans-serif）

---

## 2. ページ構成

### 2.1 メインダッシュボード（`/`）

#### 2.1.1 レイアウト構造
```
┌─────────────────────────────────────────────┐
│ [ヘッダー]                                  │
│   タイトル                        現在ランク│
├─────────────────────────────────────────────┤
│ [チャートエリア]                            │
│  ┌─────────────┬─────────────┐             │
│  │ Ed（棒）    │ TRACE（折れ線）│             │
│  └─────────────┴─────────────┘             │
├─────────────────────────────────────────────┤
│ [入力フォーム]                              │
│  時間                                        │
│  [追加ボタン] [リセットボタン]              │
├─────────────────────────────────────────────┤
│ [データテーブル]（オプション）              │
│  日付 | Ed | TRACE                            │
└─────────────────────────────────────────────┘
```

#### 2.1.2 ヘッダーセクション
- **要素**:
  - プロジェクトタイトル: "Quantified Faith Index"
  - 現在のランク表示: A/B/C/D/E（大きく強調）
  - ダークモード切り替えボタン（右上）
- **デザイン**:
  - タイトル: `text-2xl font-bold`
  - ランク: `text-3xl font-semibold` + ランク別カラー
    - A: `text-green-500`
    - B: `text-blue-500`
    - C: `text-yellow-500`
    - D: `text-orange-500`
    - E: `text-red-500`
  - 背景: `bg-card border-b`

#### 2.1.3 チャートエリア
**2つのチャートを横並び（モバイルは縦積み）**

##### Ed（日次スコア）- 棒グラフ
- **データ**: `ScoreEd[]`（日付、スコア値）
- **コンポーネント**: `<Card>` + Recharts `<BarChart>`
- **カラー**: `fill="#6366f1"`（indigo-500）
- **X軸**: 日付（YYYY-MM-DD形式）
- **Y軸**: スコア値（実数）
- **ツールチップ**: 日付 + スコア + 内訳（zTime）
- **高さ**: `h-64`（256px）

##### TRACE（累積スコア）- 折れ線グラフ
-- **データ**: `ScoreQfiPoint[]`（日付、累積スコア）
- **コンポーネント**: `<Card>` + Recharts `<LineChart>`
- **カラー**: `stroke="#10b981"`（green-500）、`strokeWidth={2}`
- **X軸**: 日付
- **Y軸**: 累積スコア
-- **ツールチップ**: 日付 + TRACE値
- **高さ**: `h-64`

#### 2.1.4 入力フォームセクション
- **コンポーネント**: Shadcn `<Card>` + `<Input>` + `<Label>` + `<Button>`
- **フィールド**:
  1. **時間（分）**: `type="number"`, デフォルト60, `min={0}`
- **ボタン**:
  - **追加**: `<Button variant="default">`（青系）
  - **リセット**: `<Button variant="outline">`
- **レイアウト**: 1カラム（シンプルなレイアウト）
- **バリデーション**: 
  - 時間は非負

#### 2.1.5 データテーブル（オプション）
- **表示内容**: 入力した日次データ一覧
-- **カラム**: 日付 | 時間(分) | Ed | TRACE
- **デザイン**: Shadcn `<Table>` コンポーネント
- **ソート**: 日付昇順
- **ページネーション**: 10件/ページ（データが多い場合）

---

## 3. コンポーネント設計

### 3.1 使用するShadcn UIコンポーネント

#### 既存コンポーネント
- `<Button>`: アクション用ボタン
- `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`: セクション区切り
- `<Input>`: フォーム入力
- `<Label>`: 入力項目ラベル

#### 追加推奨コンポーネント
- `<Badge>`: ランク表示用
- `<Table>`: データ一覧表示
-- `<Tabs>`: チャート切り替え（Ed/TRACE/両方）
- `<Switch>`: ダークモード切り替え
- `<Select>`: パラメータ選択（例: 減衰半減期の変更）
- `<Dialog>`: 設定画面・詳細情報表示
- `<Tooltip>`: ヘルプテキスト表示

### 3.2 カスタムコンポーネント

#### `<RankBadge rank={Rank}>`
- **Props**: `rank: "A" | "B" | "C" | "D" | "E"`
- **デザイン**: 
  - `<Badge>` ベース
  - ランク別カラー（上記と同様）
  - サイズ: `text-xl px-4 py-2`
  - アニメーション: ランク変化時にパルスエフェクト

#### `<EdChart data={ScoreEd[]}>`
- **Props**: `data: ScoreEd[]`
- **内部**: Recharts `<BarChart>` をラップ
- **カスタマイズ**: 
  - グリッド線スタイル
  - レスポンシブ対応
  - 空データ時のプレースホルダー

#### `<QfiChart data={ScoreQfiPoint[]}>`
- **Props**: `data: ScoreQfiPoint[]`
- **内部**: Recharts `<LineChart>` をラップ

#### `<InputForm onSubmit={Function}>`
- **Props**: 
  - `onSubmit: (data: DailyStats) => void`
  - `defaultValues?: Partial<DailyStats>`
- **機能**:
  - フォーム状態管理（useState）
  - バリデーション
  - エラー表示

#### `<DataTable data={DailyStats[]}, eds={ScoreEd[]}, qfi={ScoreQfiPoint[]}>`
- **Props**: 全データ配列
- **機能**:
  - ソート
  - ページネーション
  - 行削除ボタン（オプション）

---

## 4. データフロー

### 4.1 状態管理（Zustand Store）
```typescript
type AppState = {
  // パラメータ
  norm: NormalizationParams;
  weights: WeightParams;
  decay: DecayParams;
  ranks: RankBreakpoints;
  
  // データ
  daily: DailyStats[];
  eds: ScoreEd[];
  qfi: ScoreQfiPoint[];
  latestRank?: Rank;
  
  // アクション
  addDaily: (input) => void;
  recompute: () => void;
  reset: () => void;
}
```

### 4.2 フロー図
```
[ユーザー入力] 
    ↓
[addDaily] → daily配列に追加
    ↓
[recompute] → Ed計算 → QFI計算 → ランク判定
    ↓
[UIに反映] → チャート更新 + ランク表示
```

---

## 5. UI要件詳細

### 5.1 カラーパレット（Shadcn UIデフォルト）
```css
/* ライトモード */
--background: 0 0% 100%;
--foreground: 222.2 84% 4.9%;
--primary: 222.2 47.4% 11.2%;
--secondary: 210 40% 96%;
--accent: 210 40% 96%;
--destructive: 0 84.2% 60.2%;
--border: 214.3 31.8% 91.4%;
--ring: 222.2 84% 4.9%;

/* ダークモード */
--background: 222.2 84% 4.9%;
--foreground: 210 40% 98%;
--primary: 210 40% 98%;
/* ... 以下略 */
```

### 5.2 スペーシング
- **セクション間**: `space-y-8`（32px）
- **カード内**: `p-6`（24px）
- **フォーム項目**: `gap-4`（16px）

### 5.3 アニメーション
- **ランク変化**: `transition-all duration-300` + `scale-110`
- **チャート**: Rechartsのデフォルトアニメーション有効
- **ボタンホバー**: Shadcn UIデフォルト（`hover:bg-primary/90`）

### 5.4 レスポンシブブレークポイント
- **モバイル**: `< 640px` - 1カラムレイアウト
- **タブレット**: `640px - 1024px` - 2カラムレイアウト
- **デスクトップ**: `> 1024px` - 最大幅1280px、センタリング

---

## 6. インタラクション仕様

### 6.1 入力フォーム
1. **入力完了** → "追加"ボタンクリック
2. バリデーションチェック
3. `addDaily`実行 → 自動再計算
4. チャート・ランクが即座に更新
5. フォームは前回値を保持（連続入力しやすく）

### 6.2 リセット
1. "リセット"ボタンクリック
2. 確認ダイアログ表示（`<Dialog>`）: "全データを削除しますか？"
3. OK → `reset()`実行 → 全データクリア

### 6.3 チャートツールチップ
- **マウスオーバー**: 日付 + スコア値表示
- **Ed**: 内訳（zTime）も表示
- **QFI**: 前日からの変化量も表示（オプション）

### 6.4 ダークモード切り替え
- **ボタン**: ヘッダー右上に月/太陽アイコン
- **動作**: `document.documentElement.classList.toggle('dark')`
- **永続化**: LocalStorageに保存

---

## 7. 追加機能（オプション）

### 7.1 設定画面
- **開き方**: ヘッダーの歯車アイコンクリック → `<Dialog>`
- **設定項目**:
  - 正規化パラメータ（μ_t, σ_t, μ_m, σ_m）
  - 重みパラメータ（α, β, γ）
  - 減衰半減期（日数）
  - ランク閾値（A, B, C, D）
- **保存**: LocalStorage or API送信

### 7.2 データエクスポート
- **CSV出力**: `daily`, `eds`, `qfi`をCSV形式でダウンロード
- **ボタン位置**: データテーブル上部

### 7.3 署名・記録機能（将来実装）
- **"記録する"ボタン**: 最新のEdを署名してAPIに送信
- **モーダル**: 送信完了 → レコードID表示
- **実装**: `recordEdScore()`を呼び出し

### 7.4 NFTミント（将来実装）
- **条件**: QFIが閾値（例: 10.0）を超えた場合
- **UI**: "NFTをミント"ボタン表示
- **実装**: `mintTokenForQfi()`呼び出し → トランザクションID表示

---

## 8. テスト用ダミーデータ

### 8.1 初期表示用サンプルデータ
```typescript
const sampleData: DailyStats[] = [
  { date: "2025-10-21", timeMinutes: 60, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-22", timeMinutes: 90, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-23", timeMinutes: 45, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-24", timeMinutes: 120, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-25", timeMinutes: 75, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-26", timeMinutes: 60, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-27", timeMinutes: 100, moneyJpy: 0, emotionZ: 0 },
];
```

### 8.2 サンプルデータ読み込みボタン
- **位置**: 入力フォーム下
- **ラベル**: "サンプルデータを読み込む"
- **動作**: 上記データを一括で`addDaily`

---

## 9. ファイル構成

### 9.1 ディレクトリ構造
```
src/
├── app/
│   ├── page.tsx              # メインダッシュボード
│   ├── layout.tsx            # レイアウト・メタ情報
│   └── globals.css           # グローバルスタイル
├── components/
│   ├── ui/                   # Shadcn UIコンポーネント
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
│   ├── RankBadge.tsx
│   ├── EdChart.tsx
│   ├── QfiChart.tsx
│   ├── InputForm.tsx
│   ├── DataTable.tsx
│   ├── SettingsDialog.tsx
│   └── ThemeToggle.tsx
├── lib/
│   ├── types.ts              # 型定義
│   ├── qfi.ts                # 純関数（計算ロジック）
│   ├── store.ts              # Zustand ストア
│   ├── mockApi.ts            # モックAPI
│   ├── config.ts             # アプリ設定
│   └── utils.ts              # ユーティリティ（cn など）
└── ...
```

### 9.2 新規作成が必要なファイル
- `src/components/RankBadge.tsx`
- `src/components/EdChart.tsx`
- `src/components/QfiChart.tsx`
- `src/components/InputForm.tsx`
- `src/components/DataTable.tsx`
- `src/components/SettingsDialog.tsx`
- `src/components/ThemeToggle.tsx`
- `src/components/ui/badge.tsx`
- `src/components/ui/table.tsx`
- `src/components/ui/tabs.tsx`
- `src/components/ui/switch.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/tooltip.tsx`

---

## 10. 成果物チェックリスト

### 10.1 必須実装
- [ ] メインダッシュボードレイアウト
- [ ] ヘッダー（タイトル + ランク表示）
- [ ] Edチャート（棒グラフ）
- [ ] QFIチャート（折れ線グラフ）
- [ ] 入力フォーム（時間）
- [ ] 追加・リセットボタン
- [ ] ランク表示（A〜E + カラー）
- [ ] レスポンシブ対応（モバイル・タブレット・デスクトップ）
- [ ] ダークモード対応

### 10.2 推奨実装
- [ ] データテーブル
- [ ] ランクバッジコンポーネント
- [ ] チャートツールチップ拡張
- [ ] サンプルデータ読み込み機能
- [ ] ダークモード切り替えボタン
- [ ] 空データ時のプレースホルダー

### 10.3 オプション実装
- [ ] 設定ダイアログ（パラメータ調整）
- [ ] CSVエクスポート
- [ ] データ永続化（LocalStorage）
- [ ] 署名・記録ボタン（モックAPI連携）
- [ ] アニメーション強化
- [ ] エラーハンドリング・バリデーション強化

---

## 11. デザインガイドライン

### 11.1 原則
1. **シンプル・クリーン**: 情報密度を保ちつつ、視覚的なノイズを最小化
2. **データ中心**: チャートを目立たせ、スコアの変化を直感的に把握
3. **一貫性**: Shadcn UIのデザイントークンに従う
4. **アクセシビリティ**: コントラスト比4.5:1以上、キーボード操作対応

### 11.2 カラー使用方針
- **背景**: `bg-background`（ライト: 白、ダーク: 濃紺）
- **テキスト**: `text-foreground`
- **強調**: `text-primary` or `bg-primary`
- **成功**: `text-green-500` (ランクA)
- **警告**: `text-yellow-500` (ランクC)
- **エラー**: `text-destructive` (ランクE)

### 11.3 タイポグラフィ
- **H1**: `text-3xl font-bold`
- **H2**: `text-2xl font-semibold`
- **H3**: `text-xl font-semibold`
- **本文**: `text-base`
- **キャプション**: `text-sm text-muted-foreground`

### 11.4 シャドウ・ボーダー
- **カード**: `border shadow-sm`
- **ホバー**: `hover:shadow-md transition-shadow`
- **ボーダー**: `border-border`（デフォルト）

---

## 12. パフォーマンス要件

- **初回ロード**: < 2秒
- **チャート描画**: < 100ms
- **フォーム送信 → 画面更新**: < 50ms
- **データ量**: 最大365日分（1年分）までスムーズに動作

---

## 13. ブラウザ対応

- **Chrome/Edge**: 最新版 + 2バージョン前まで
- **Firefox**: 最新版 + 2バージョン前まで
- **Safari**: 最新版 + 2バージョン前まで
- **モバイル**: iOS Safari 15+, Chrome Android 100+

---

## 14. 補足事項

### 14.1 既存コードとの統合
- `src/lib/store.ts`の`useAppStore`フックを使用
- `src/lib/qfi.ts`の純関数（`computeEd`, `computeQfiSeries`, `rankFromQfi`）はそのまま利用
- 新規UIコンポーネントは`src/components/`以下に配置

### 14.2 コーディング規約
- **TypeScript**: 厳格モード、型定義必須
- **命名**: PascalCase（コンポーネント）、camelCase（関数・変数）
- **import順**: React → 外部ライブラリ → 内部モジュール（`@/lib/*`, `@/components/*`）
- **ESLint**: `npm run lint`でエラーゼロ

### 14.3 コメント
- 複雑なロジックには日本語コメント
- コンポーネントにはJSDocで`@param`, `@returns`を記載

---

## 15. 参考資料

- **Shadcn UI**: https://ui.shadcn.com/
- **Recharts**: https://recharts.org/
- **Tailwind CSS**: https://tailwindcss.com/
- **Zustand**: https://github.com/pmndrs/zustand
- **Next.js**: https://nextjs.org/docs

---

## 16. 納品物

### 16.1 ソースコード
- 上記ファイル構成に従った完全なコンポーネント群
- `src/app/page.tsx`の完全なリファクタリング版
- 新規Shadcn UIコンポーネントの追加実装

### 16.2 ドキュメント
- 実装した機能の一覧
- 変更点・追加機能の説明
- 動作確認手順（`npm run dev`で起動、各機能の操作方法）

### 16.3 スクリーンショット
- デスクトップ（ライトモード）
- デスクトップ（ダークモード）
- モバイル表示
- 各インタラクション状態（フォーム入力中、チャート表示、設定ダイアログ開いた状態など）

---

## 17. 質問・確認事項

外注先様が実装中に疑問点がある場合は、以下の項目について確認してください：

1. **デザインの詳細**: 特定の要素のサイズ・色・配置について
2. **機能の優先順位**: 必須 vs オプション機能の実装判断
3. **パラメータのデフォルト値**: 設定画面で変更可能な値の範囲
4. **エラーメッセージ**: バリデーション失敗時の表示内容
5. **API連携**: モックAPIの実装範囲（現時点では送信後の挙動は無視してOK）

---

以上が、QFIアプリケーションのUI作成仕様書です。この仕様に基づき、モダンで使いやすいUIの実装をお願いいたします。
