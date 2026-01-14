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

export function SettingsDialog() {
  const { norm, weights, decay, ranks, setParams } = useAppStore();
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

