"use client";

import { useAppStore } from "@/lib/store";
import { RankBadge } from "@/components/RankBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QfiScoreDisplay } from "@/components/QfiScoreDisplay";
import { EdChart } from "@/components/EdChart";
import { QfiChart } from "@/components/QfiChart";
import { InputForm } from "@/components/InputForm";
import { DataTable } from "@/components/DataTable";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DailyStats } from "@/lib/types";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const sampleData: DailyStats[] = [
  { date: "2025-10-21", timeMinutes: 60, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-22", timeMinutes: 90, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-23", timeMinutes: 45, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-24", timeMinutes: 120, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-25", timeMinutes: 75, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-26", timeMinutes: 60, moneyJpy: 0, emotionZ: 0 },
  { date: "2025-10-27", timeMinutes: 100, moneyJpy: 0, emotionZ: 0 },
];

export default function Home() {
  const { eds, qfi, daily, latestRank, addDaily, reset } = useAppStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

  const handleLoadSample = () => {
    addDaily(sampleData);
  };

  const handleReset = () => {
    reset();
    setShowResetDialog(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ヘッダー */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold">Quantified Faith Index</h1>
            </div>
            <div className="flex items-center gap-2">
              {latestRank && <RankBadge rank={latestRank} />}
              <SettingsDialog />
              <ThemeToggle />
            </div>
          </div>
          
          {/* QFIスコア表示 */}
          {daily.length > 0 && (
            <div className="max-w-xs mx-auto md:mx-0 md:max-w-sm">
              <QfiScoreDisplay />
            </div>
          )}
        </header>

        {/* チャート */}
        <section className="grid gap-6 md:grid-cols-2">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>日次スコア（Ed）</CardTitle>
              <CardDescription>時間を基にした日次評価</CardDescription>
            </CardHeader>
            <CardContent>
              <EdChart data={eds} />
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>累積スコア（QFI）</CardTitle>
              <CardDescription>減衰を考慮した累積熱中度指数</CardDescription>
            </CardHeader>
            <CardContent>
              <QfiChart data={qfi} />
            </CardContent>
          </Card>
        </section>

        {/* 入力フォーム */}
        <section className="grid gap-6">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>データ入力</CardTitle>
              <CardDescription>
                活動の時間を記録してください
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <InputForm
                onSubmit={addDaily}
                onReset={() => setShowResetDialog(true)}
              />
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="secondary" onClick={handleLoadSample}>
                  サンプルデータを読み込む
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* AutoDataGenerator（展示用データ生成）は削除されました */}
        </section>

        {/* データテーブル */}
        {daily.length > 0 && (
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>データ一覧</CardTitle>
              <CardDescription>記録された全データ</CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable data={daily} eds={eds} qfi={qfi} />
            </CardContent>
          </Card>
        )}

        {/* 空データ時のプレースホルダー */}
        {daily.length === 0 && (
          <Card className="transition-shadow hover:shadow-md">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  データがありません。上のフォームからデータを追加するか、サンプルデータを読み込んでください。
                </p>
                <Button variant="outline" onClick={handleLoadSample}>
                  サンプルデータを読み込む
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* リセット確認ダイアログ */}
      <Dialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>データをリセット</DialogTitle>
            <DialogDescription>
              全データを削除しますか？この操作は取り消せません。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              キャンセル
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              削除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
