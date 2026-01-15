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
import { Settings } from "lucide-react";
import { Play, Pause } from "lucide-react";
import type { AppState } from "@/lib/store";

export function SettingsDialog() {
  const { norm, weights, decay, ranks, setParams } = useAppStore();
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

  // 自動更新用
  const autoRef = useRef<NodeJS.Timeout | null>(null);
  const [autoRunning, setAutoRunning] = useState(false);

  const stopAuto = () => {
    setAutoRunning(false);
    if (autoRef.current) {
      clearInterval(autoRef.current);
      autoRef.current = null;
    }
  };

  const startAuto = () => {
    if (autoRunning) return;
    setAutoRunning(true);

    // 初期値: QFI を -100 にする -> ed を -ranks.A にする
    const maxScore = ranks.A;
    const targetEdInit = -maxScore;
    const alpha = weights.alpha || 1;
    const sigmaTime = norm.sigmaTime || 1;
    const muTime = norm.muTime || 0;
    let timeMinutes = (targetEdInit / alpha) * sigmaTime + muTime;
    if (!Number.isFinite(timeMinutes)) timeMinutes = muTime;
    if (timeMinutes < 0) timeMinutes = 0;

    const now = new Date();
    const dateStr = now.toISOString().split("T")[0];

    addDaily({ date: dateStr, timeMinutes: Math.round(timeMinutes), moneyJpy: 0, emotionZ: 0, capturedAt: now.toISOString() });

    // 2分毎に前回 ed の ±5 の範囲で追加
    autoRef.current = setInterval(() => {
      const hasGetState = typeof (useAppStore as unknown as { getState?: unknown }).getState === "function";
      const state: AppState | null = hasGetState
        ? (useAppStore as unknown as { getState: () => AppState }).getState()
        : null;
      const prevEds = state?.eds ?? [];
      const lastEd = prevEds.length ? prevEds[prevEds.length - 1].ed : targetEdInit;
      const delta = (Math.random() * 10) - 5; // -5..+5
      const targetEd = lastEd + delta;

      let tm = (targetEd / alpha) * sigmaTime + muTime;
      if (!Number.isFinite(tm)) tm = muTime;
      if (tm < 0) tm = 0;

      const now2 = new Date();
      const dateStr2 = now2.toISOString().split("T")[0];
      addDaily({ date: dateStr2, timeMinutes: Math.round(tm), moneyJpy: 0, emotionZ: 0, capturedAt: now2.toISOString() });
    }, 2 * 60 * 1000);
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
          <div className="flex items-center justify-between">
            <DialogTitle>パラメータ設定</DialogTitle>
            <div>
              <Button
                variant="ghost"
                size="icon"
                aria-label={autoRunning ? "停止" : "開始"}
                onClick={() => {
                  if (autoRunning) stopAuto();
                  else startAuto();
                }}
              >
                {autoRunning ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <DialogDescription>
            QFIの計算パラメータを調整できます。変更後は自動的に再計算されます。
          </DialogDescription>
          {debugMode && (
            <p className="text-sm text-destructive">デバッグモードが有効です</p>
          )}
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

