"use client";

import { useAppStore } from "@/lib/store";
import { RankBadge } from "@/components/RankBadge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QfiScoreDisplay } from "@/components/QfiScoreDisplay";
import { EdChart } from "@/components/EdChart";
import { QfiChart } from "@/components/QfiChart";
// InputForm removed for demo; debug generation handled via SettingsDialog (5 taps)
import { DataTable } from "@/components/DataTable";
import { SettingsDialog } from "@/components/SettingsDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";


export default function Home() {
  const { eds, qfi, daily, latestRank, addDaily, reset } = useAppStore();
  const [showResetDialog, setShowResetDialog] = useState(false);

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
              <div>
                <h1 className="text-2xl font-bold">Quantified Faith Index</h1>
                <p className="text-sm text-muted-foreground mt-1">日々の活動から熱中度を可視化するダッシュボード</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {latestRank && <RankBadge rank={latestRank} />}
              <div className="flex items-center gap-2">
                <SettingsDialog />
                <ThemeToggle />
              </div>
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
          <Card className="transition-shadow hover:shadow-lg rounded-xl border border-transparent bg-gradient-to-br from-white/50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader>
              <CardTitle>日次スコア（Ed）</CardTitle>
              <CardDescription>時間を基にした日次評価</CardDescription>
            </CardHeader>
            <CardContent>
              <EdChart data={eds} />
            </CardContent>
          </Card>

          <Card className="transition-shadow hover:shadow-lg rounded-xl border border-transparent bg-gradient-to-br from-white/50 to-slate-50 dark:from-gray-900 dark:to-gray-800">
            <CardHeader>
              <CardTitle>累積スコア（QFI）</CardTitle>
              <CardDescription>減衰を考慮した累積熱中度指数</CardDescription>
            </CardHeader>
            <CardContent>
              <QfiChart data={qfi} />
            </CardContent>
          </Card>
        </section>

        {/* 入力フォームは削除されました */}

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
                  現在、記録がありません。画面右上の設定（歯車）を開いてデバッグモードを有効化するか、
                  外部データを取り込んでください。
                </p>
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
