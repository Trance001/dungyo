import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCharacterStore } from '@/stores/character-store';
import { encodeAdventure, decodeAdventure } from '@/lib/adventure-codec';

interface AdventureBackupDialogProps {
  open: boolean;
  mode: 'export' | 'import';
  onClose: () => void;
}

export function AdventureBackupDialog({ open, mode, onClose }: AdventureBackupDialogProps) {
  const exportSnapshot = useCharacterStore((state) => state.exportSnapshot);
  const importSnapshot = useCharacterStore((state) => state.importSnapshot);
  const characters = useCharacterStore((state) => state.characters);
  const adventureName = useCharacterStore((state) => state.adventureName);

  const [importCode, setImportCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportedCode = mode === 'export' ? encodeAdventure(exportSnapshot()) : '';
  const decoded = mode === 'import' && importCode.trim() ? decodeAdventure(importCode) : null;

  function handleClose() {
    setImportCode('');
    setCopied(false);
    setError(null);
    onClose();
  }

  async function handleCopyExport() {
    try {
      await navigator.clipboard.writeText(exportedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 무시
    }
  }

  function handleImport() {
    const snapshot = decodeAdventure(importCode);
    if (!snapshot) {
      setError('유효하지 않은 모험단 데이터 코드입니다.');
      return;
    }
    if (characters.length > 0) {
      const ok = window.confirm('현재 등록된 캐릭터 데이터가 모두 대체됩니다. 진행하시겠습니까?');
      if (!ok) return;
    }
    importSnapshot(snapshot);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === 'export' ? '모험단 데이터 내보내기' : '모험단 데이터 가져오기'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export'
              ? '현재 캐릭터 목록, 스탯, 역할, 주간 클리어 기록을 코드로 내보냅니다. 다른 기기에서 복원하거나 백업용으로 사용하세요.'
              : '백업한 모험단 데이터 코드를 붙여넣어 복원하세요. 기존 데이터는 대체됩니다.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'export' ? (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground mb-1">현재 모험단</p>
              <p className="text-sm font-medium">{adventureName ?? '(없음)'}</p>
              <p className="text-xs text-muted-foreground mt-1">캐릭터 {characters.length}명</p>
            </div>
            <textarea
              readOnly
              value={exportedCode}
              rows={6}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none break-all"
            />
            <Button className="w-full" onClick={handleCopyExport}>
              {copied ? '복사됨' : '코드 복사'}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <textarea
              placeholder="백업한 코드를 붙여넣으세요"
              value={importCode}
              onChange={(e) => {
                setImportCode(e.target.value);
                setError(null);
              }}
              rows={6}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none break-all"
            />
            {decoded && (
              <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
                <p className="text-xs text-muted-foreground">미리보기</p>
                <p className="text-sm font-medium">{decoded.adventureName ?? '(없음)'}</p>
                <p className="text-xs text-muted-foreground">
                  캐릭터 {decoded.characters.length}명 · 클리어 기록 {decoded.weeklyClearRecords.length}건
                </p>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button className="w-full" onClick={handleImport} disabled={!decoded}>
              복원하기
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
