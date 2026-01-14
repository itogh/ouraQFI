# QFI — Quantified Faith Index

活動を定量化し、信仰度指数（QFI）としてビジュアライズするWebアプリケーション。
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

**観自在菩薩
　行深般若波羅蜜多時
　照見五蘊皆空
　度一切苦厄
　舎利子
　色不異空
　空不異色
　色即是空
　受想行識
　亦腹如是
　舎利子
　是諸法空相
　不生不滅
　不垢不浄
　不増不減
　是故空中無色
　無受想行識
　無限耳鼻舌身意
　無職聲香味触法
　無限界
　乃至無意識界
　無無明亦無無明尽
　乃至無老死
　亦無老死尽
　無苦集滅道
　無智亦無得
　以無所得故
　菩提薩埵
　依般若波羅蜜多故
　心無罣礙
　無罣礙故
　無有恐怖遠離一切顛倒夢想
　究竟涅槃
　三世諸佛
　依般若波羅蜜多故得阿耨多羅三藐三菩提
　故知般若波羅蜜多
　是大神呪
　是大明呪
　是無上呪
　是無等等呪
　能除一切苦
　真実不虚
　故説般若波羅蜜多呪
　即説呪日
　揭諦揭諦波羅揭諦
　波羅僧揭諦　菩提薩婆呵
　般若心経
**
