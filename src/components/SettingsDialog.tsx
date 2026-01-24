"use client";

import { useState, useRef, useEffect } from "react";
import { useAppStore } from "@/lib/store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Play, Pause } from "lucide-react";
import type { AppState } from "@/lib/store";

export function SettingsDialog() {
  const { norm, weights, decay, ranks, setParams } = useAppStore();
  const lockDailyOncePerDay = useAppStore((s) => s.lockDailyOncePerDay);
  const setLockDailyOncePerDay = useAppStore((s) => s.setLockDailyOncePerDay);
  const generateSampleDays = useAppStore((s) => s.generateSampleDays);
  const reset = useAppStore((s) => s.reset);
  const addDaily = useAppStore((s) => s.addDaily);
  const [isOpen, setIsOpen] = useState(false);
  const debugMode = useAppStore((s) => s.debugMode);
  const enableDebug = useAppStore((s) => s.enableDebug);

  // API input for special commands (e.g. typing 'debug' and saving will enable debug mode)
  const [apiInput, setApiInput] = useState("");
  const apiInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const handler = () => {
      setIsOpen(true);
      // focus input after open
      setTimeout(() => apiInputRef.current?.focus(), 100);
    };
    // listen for custom event dispatched by Oura button
    const onOpen = (e: Event) => handler();
    window.addEventListener("open-settings-api", onOpen as EventListener);
    return () => window.removeEventListener("open-settings-api", onOpen as EventListener);
  }, []);

  // Auto-generator for demo: 2分毎にデータを追加。初期スコアは -50 (表示)
  const [autoRunning, setAutoRunning] = useState(false);
  const autoRef = useRef<NodeJS.Timeout | null>(null);

  const startAuto = () => {
    if (autoRunning) return;
    setAutoRunning(true);

    // reset store to start fresh series
    reset();

  // 初期値: 固定 -50 ではなく、実運用に近いランダム初期値を与える
    // 初回は 30..180 分の範囲からサンプリングして自然な初期 ED をつくる
    const initialTime = Math.round(30 + Math.random() * 150);
    addDaily({
      date: new Date().toISOString().split("T")[0],
      timeMinutes: Math.round(initialTime),
      moneyJpy: Math.round(Math.random() * 1000),
      emotionZ: Math.max(-3, Math.min(3, (Math.random() * 2 - 1) * 1.5)),
      capturedAt: new Date().toISOString(),
    });

  // schedule recurring updates every 1 day
  autoRef.current = setInterval(() => {
      try {
        const hasGetState = typeof (useAppStore as unknown as { getState?: unknown }).getState === "function";
        const state: AppState | null = hasGetState
          ? (useAppStore as unknown as { getState: () => AppState }).getState()
          : null;

        const prevDaily = state?.daily ?? [];
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

        addDaily({
          date: new Date().toISOString().split("T")[0],
          timeMinutes: Math.round(timeMinutes),
          moneyJpy: Math.round(Math.random() * 1000),
          emotionZ: Math.max(-3, Math.min(3, (Math.random() * 2 - 1) * 1.5)),
          capturedAt: new Date().toISOString(),
        });
      } catch (e) {
        // ignore
      }
    }, 24 * 60 * 60 * 1000);
  };

  const stopAuto = () => {
    setAutoRunning(false);
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  };

  // パラメータの詳細編集 UI は削除済みです。
  // 保存時には現在のストア値をそのまま `setParams` に渡します。

  const handleSave = () => {
    // If apiInput contains the special 'debug' command, enable debug mode
    if (apiInput.trim().toLowerCase() === "debug") {
      enableDebug();
    }
    // パラメータ編集 UI を削除したため、現在のストアの値をそのまま再設定します。
    setParams({ norm, weights, decay, ranks });
    setIsOpen(false);
  };

  const handleCancel = () => {
    // 編集 UI を削除したため、単にダイアログを閉じます。
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label="設定">
          <Settings className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>パラメータ設定</DialogTitle>
            <DialogDescription>
            TRACEの計算パラメータを調整できます。変更後は自動的に再計算されます。
          </DialogDescription>
          {debugMode && (
            <p className="text-sm text-destructive">デバッグモードが有効です</p>
          )}
          <div className="pt-2 flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={autoRunning ? "自動更新停止" : "自動更新開始"}
              onClick={() => (autoRunning ? stopAuto() : startAuto())}
            >
              {autoRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <span className="text-sm text-muted-foreground">1日ごとに TRACE を自動更新（初期値はランダム）</span>
          </div>
          <div className="pt-2 flex items-center gap-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={lockDailyOncePerDay}
                onChange={(e) => setLockDailyOncePerDay(e.target.checked)}
              />
              <span className="text-sm">同日の上書きを禁止（1日1件を固定）</span>
            </label>
            <Button onClick={() => generateSampleDays(20)} variant="outline" size="sm">過去20日分生成</Button>
          </div>
            <div className="pt-2">
            <h4 className="font-medium text-sm">API 入力</h4>
            <div className="space-y-2 mt-2">
              <Label htmlFor="apiInput">API 入力</Label>
              <Input
                id="apiInput"
                ref={apiInputRef}
                value={apiInput}
                onChange={(e) => setApiInput(e.target.value)}
                placeholder=""
              />
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* パラメータ編集 UI は削除されています。必要な場合はストア側で調整してください。 */}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

