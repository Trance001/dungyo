import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { decodePreset } from '@/lib/preset-codec';

import type { Preset } from '@/domain/preset';

interface PresetImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (preset: Omit<Preset, 'id'>) => void;
  initialCode?: string;
}

export function PresetImportDialog({ open, onClose, onImport, initialCode }: PresetImportDialogProps) {
  const [code, setCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // 다이얼로그가 열릴 때 외부에서 전달받은 코드가 있으면 자동 입력
  useEffect(() => {
    if (open && initialCode) {
      setCode(initialCode);
      setError(null);
    }
  }, [open, initialCode]);

  const decoded = code.trim() ? decodePreset(code) : null;
  const isValid = decoded !== null;

  function handleClose() {
    setCode('');
    setCustomName('');
    setError(null);
    onClose();
  }

  function handleImport() {
    const preset = decodePreset(code);
    if (!preset) {
      setError('유효하지 않은 프리셋 코드입니다.');
      return;
    }
    onImport({ ...preset, name: customName.trim() || preset.name });
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>프리셋 코드로 가져오기</DialogTitle>
          <DialogDescription>
            다른 사용자가 공유한 프리셋 코드를 붙여넣어 가져오세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="preset-code">프리셋 코드</Label>
            <textarea
              id="preset-code"
              placeholder="공유받은 코드를 붙여넣으세요"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              rows={4}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none break-all"
            />
          </div>

          {decoded && (
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
              <p className="text-xs text-muted-foreground">미리보기</p>
              <p className="text-sm font-medium">{decoded.name}</p>
              <div className="flex flex-wrap gap-1">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">인원 {decoded.totalMembers}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">딜러 {decoded.dealerSlots}</span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs">버퍼 {decoded.bufferSlots}</span>
                {decoded.secondaryBufferSlots > 0 && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">업둥버퍼 {decoded.secondaryBufferSlots}</span>
                )}
                {decoded.useTotalDamage && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs">딜합</span>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="preset-name">프리셋 이름 (선택)</Label>
            <Input
              id="preset-name"
              placeholder={decoded?.name ?? '비워두면 원본 이름 사용'}
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleImport}
            disabled={!isValid}
          >
            프리셋 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
