import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { encodePartyCard } from '@/lib/party-card-codec';

import type { PartyCard, RotationTemplateId } from '@/domain/planner';

interface PartyCardShareDialogProps {
  card: PartyCard | null;
  templateId: RotationTemplateId;
  onClose: () => void;
}

export function PartyCardShareDialog({ card, templateId, onClose }: PartyCardShareDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!card) return null;

  const code = encodePartyCard(
    {
      ownerName: card.ownerName,
      buffers: card.buffers,
      dealers: card.dealers,
      secondaryBuffers: card.secondaryBuffers,
      carries: card.carries,
    },
    templateId,
  );

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 무시
    }
  }

  return (
    <Dialog open={card !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>파티 카드 공유</DialogTitle>
          <DialogDescription>
            이 코드를 파티장에게 전달하면 파티장이 리스트에 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">소유자</p>
            <p className="text-sm font-medium">{card.ownerName}</p>
          </div>
          <textarea
            readOnly
            value={code}
            rows={5}
            onFocus={(e) => e.target.select()}
            className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none break-all"
          />
          <Button className="w-full" onClick={handleCopy}>
            {copied ? '복사됨' : '코드 복사'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
