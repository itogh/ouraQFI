# QFI — Quantified Faith Index

活動を定量化し、信仰度指数（QFI）としてビジュアライズするWebアプリケーション。

## 🌟 特徴

- **📊 リアルタイム可視化**: 日次スコア（Ed）と累積スコア（QFI）をインタラクティブなチャートで表示
- **🎨 モダンUI**: Next.js 15 + shadcn/ui による洗練されたインターフェース
- **🌓 ダークモード**: 目に優しいダークテーマ対応（LocalStorage永続化）
- **📱 レスポンシブ**: モバイル、タブレット、デスクトップに完全対応
- **⚙️ カスタマイズ可能**: 正規化・重み・減衰・ランク閾値を自由に調整
- **♿ アクセシブル**: WCAG準拠のアクセシビリティ設計

## 🚀 クイックスタート

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 📖 使い方

### 1. データ入力

入力フォームから以下の情報を記録します：

- **時間（分）**: 活動に費やした時間

### 2. サンプルデータで試す

初めての方は「サンプルデータを読み込む」ボタンをクリックして、7日分のテストデータで動作を確認できます。

### 3. チャートで確認

- **日次スコア（Ed）**: 棒グラフで日々の活動量を表示
- **累積スコア（QFI）**: 折れ線グラフで減衰を考慮した累積値を表示

### 4. ランク確認

ヘッダー右上に現在のランク（A～E）が表示されます：

| ランク | 説明 |
|--------|------|
| 🟢 A | 非常に高い信仰度 |
| 🔵 B | 高い信仰度 |
| 🟡 C | 中程度の信仰度 |
| 🟠 D | 低い信仰度 |
| 🔴 E | 非常に低い信仰度 |

### 5. パラメータ調整

⚙️ 設定ボタンから計算パラメータを調整できます：

- **正規化パラメータ**: 時間の平均・標準偏差
- **重みパラメータ**: 時間の重要度（α）
- **減衰パラメータ**: QFIの半減期（日数）
- **ランク閾値**: A～Dランクの境界値

## 🏗️ 技術スタック

- **Framework**: [Next.js 15](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📁 プロジェクト構造

```
src/
├── app/
│   ├── page.tsx              # メインダッシュボード
│   ├── layout.tsx            # ルートレイアウト
│   └── globals.css           # グローバルスタイル
├── components/
│   ├── ui/                   # shadcn/ui基本コンポーネント
│   ├── RankBadge.tsx         # ランク表示
│   ├── EdChart.tsx           # Ed棒グラフ
│   ├── QfiChart.tsx          # QFI折れ線グラフ
│   ├── InputForm.tsx         # データ入力フォーム
│   ├── DataTable.tsx         # データ一覧テーブル
│   ├── SettingsDialog.tsx    # 設定ダイアログ
│   └── ThemeToggle.tsx       # ダークモード切替
└── lib/
    ├── types.ts              # 型定義
    ├── qfi.ts                # QFI計算ロジック
    ├── store.ts              # Zustand ストア
    ├── mockApi.ts            # モックAPI
    ├── config.ts             # 設定
    └── utils.ts              # ユーティリティ
```

## 🧮 QFI計算ロジック

### 1. 正規化

時間をZ-スコア化：

```
z_time = (time - μ_time) / σ_time
```

### 2. 日次スコア（Ed）

時間を重み付け：

```
Ed = α × z_time
```

### 3. 累積スコア（QFI）

指数減衰を適用した累積：

```
QFI[t] = Ed[t] + QFI[t-1] × exp(-λ)
λ = ln(2) / halfLifeDays
```

### 4. ランク判定

QFI値に基づいて5段階評価：

```
QFI >= threshold_A → A
QFI >= threshold_B → B
QFI >= threshold_C → C
QFI >= threshold_D → D
その他 → E
```

## 🛠️ 開発

### ビルド

```bash
pnpm build
```

### プロダクション起動

```bash
pnpm start
```

### リント

```bash
pnpm lint
```

## 📚 ドキュメント

詳細な実装ドキュメントは [IMPLEMENTATION.md](./IMPLEMENTATION.md) を参照してください。

UI仕様書は [UI_SPECIFICATION.md](./UI_SPECIFICATION.md) を参照してください。

## 🤝 コントリビューション

プルリクエストを歓迎します！大きな変更を加える場合は、まずissueを開いて変更内容を議論してください。

## 📄 ライセンス

このプロジェクトはMITライセンスの下で公開されています。

## 🙏 謝辞

このプロジェクトは以下のオープンソースプロジェクトを使用しています：

- [Next.js](https://nextjs.org/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [Zustand](https://zustand-demo.pmnd.rs/)
- [Recharts](https://recharts.org/)
- [Lucide](https://lucide.dev/)

---

**Made with ❤️ for all oshikatsu enthusiasts**
南無阿弥陀仏
