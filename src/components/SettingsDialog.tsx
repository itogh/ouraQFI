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

  // compute initial target TRACE: -50 display => latestQfi = -(ranks.A * 0.5)
    const targetQfi = -( (ranks.A ?? 9) * 0.5 );

  // first item: prevQfi = 0, decayFactor = 0 => ed = targetQfi
    const edValue = targetQfi;

    const alpha = weights.alpha || 1;
    const sigmaTime = norm.sigmaTime || 1;
    const muTime = norm.muTime || 0;

    let timeMinutes = (edValue / alpha) * sigmaTime + muTime;
    if (!Number.isFinite(timeMinutes)) timeMinutes = muTime;
    if (timeMinutes < 0) timeMinutes = 0;

    // add initial record immediately
    addDaily({
      date: new Date().toISOString().split("T")[0],
      timeMinutes: Math.round(timeMinutes),
      moneyJpy: 0,
      emotionZ: 0,
      capturedAt: new Date().toISOString(),
    });

    // schedule recurring updates every 2 minutes
    autoRef.current = setInterval(() => {
      try {
        const hasGetState = typeof (useAppStore as unknown as { getState?: unknown }).getState === "function";
        const state: AppState | null = hasGetState
          ? (useAppStore as unknown as { getState: () => AppState }).getState()
          : null;
        const prevQfi = state?.qfi?.at(-1)?.qfi ?? 0;

  // compute decay factor used in TRACE series (same as computeQfiSeries)
        const halfLife = decay.halfLifeDays || 14;
        const lambda = Math.log(2) / halfLife;
        const decayFactor = Math.exp(-lambda);

  // pick a delta within ±2.5 (reduced to avoid extreme jumps)
  const delta = (Math.random() * 5) - 2.5;
        const target = prevQfi + delta;

        // ed required to reach target: ed = target - prevQfi * decayFactor
        const edReq = target - prevQfi * decayFactor;

  // convert edReq to timeMinutes assuming money/emotion = 0
  // but first clamp edReq to avoid producing very small/negative timeMinutes
  // define an acceptable time window around muTime (mu ± 2σ)
  const maxTimeAllowed = muTime + (sigmaTime * 2);
  const minTimeAllowed = Math.max(0, muTime - (sigmaTime * 2));
  const maxEdAllowed = (maxTimeAllowed - muTime) * alpha;
  const minEdAllowed = (minTimeAllowed - muTime) * alpha;
  const clampedEdReq = Math.max(minEdAllowed, Math.min(maxEdAllowed, edReq));

  const timeMin = (clampedEdReq / alpha) * sigmaTime + muTime;
  let tm = timeMin;
  if (!Number.isFinite(tm)) tm = muTime;
  // keep at least 1 minute to avoid zeroing-out and losing variation
  if (tm < 1) tm = 1;

        addDaily({
          date: new Date().toISOString().split("T")[0],
          timeMinutes: Math.round(tm),
          moneyJpy: 0,
          emotionZ: 0,
          capturedAt: new Date().toISOString(),
        });
      } catch (e) {
        // ignore
      }
    }, 2 * 60 * 1000);
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
            <span className="text-sm text-muted-foreground">2分ごとに TRACE を自動更新（初期値 -50）</span>
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

