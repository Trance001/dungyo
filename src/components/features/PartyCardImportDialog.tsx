import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { decodePartyCard } from '@/lib/party-card-codec';
import { ROTATION_TEMPLATES, validateCardForTemplate } from '@/domain/planner';

import type { PartyCard, RotationTemplateId } from '@/domain/planner';

interface PartyCardImportDialogProps {
  open: boolean;
  currentTemplateId: RotationTemplateId;
  onClose: () => void;
  onImport: (card: Omit<PartyCard, 'id'>) => void;
}

export function PartyCardImportDialog({ open, currentTemplateId, onClose, onImport }: PartyCardImportDialogProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const decoded = code.trim() ? decodePartyCard(code) : null;
  const currentTemplate = ROTATION_TEMPLATES[currentTemplateId];
  const validationError = decoded ? validateCardForTemplate(decoded.card, currentTemplate) : null;

  function handleClose() {
    setCode('');
    setError(null);
    onClose();
  }

  function handleImport() {
    const result = decodePartyCard(code);
    if (!result) {
      setError('유효하지 않은 파티 카드 코드입니다.');
      return;
    }
    const err = validateCardForTemplate(result.card, currentTemplate);
    if (err) {
      setError(err);
      return;
    }
    onImport(result.card);
    handleClose();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>파티 카드 가져오기</DialogTitle>
          <DialogDescription>
            다른 유저로부터 받은 파티 카드 코드를 붙여넣어 리스트에 추가하세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="card-code">파티 카드 코드</Label>
            <textarea
              id="card-code"
              placeholder="공유받은 코드를 붙여넣으세요"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                setError(null);
              }}
              rows={5}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none break-all"
            />
          </div>

          {decoded && !validationError && (
            <div className="rounded-md border border-border bg-muted/30 p-3 space-y-1">
              <p className="text-xs text-muted-foreground">미리보기</p>
              <p className="text-sm font-medium">{decoded.card.ownerName}</p>
              <p className="text-xs text-muted-foreground">
                버퍼 {decoded.card.buffers.length} · 딜러 {decoded.card.dealers.length} · 업둥버퍼 {decoded.card.secondaryBuffers.length}
              </p>
            </div>
          )}

          {decoded && validationError && (
            <p className="text-sm text-destructive">{validationError}</p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button className="w-full" onClick={handleImport} disabled={!decoded || !!validationError}>
            리스트에 추가
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
