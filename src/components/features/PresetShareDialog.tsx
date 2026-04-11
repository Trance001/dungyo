import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { encodePreset } from '@/lib/preset-codec';

import type { Preset } from '@/domain/preset';

interface PresetShareDialogProps {
  preset: Preset | null;
  onClose: () => void;
}

export function PresetShareDialog({ preset, onClose }: PresetShareDialogProps) {
  const [copied, setCopied] = useState(false);

  if (!preset) return null;

  const code = encodePreset({
    name: preset.name,
    totalMembers: preset.totalMembers,
    dealerSlots: preset.dealerSlots,
    bufferSlots: preset.bufferSlots,
    secondaryBufferSlots: preset.secondaryBufferSlots,
    minDealerDamage: preset.minDealerDamage,
    minPrimaryBuffPower: preset.minPrimaryBuffPower,
    minSecondaryBuffPower: preset.minSecondaryBuffPower,
    useTotalDamage: preset.useTotalDamage,
    minTotalDamage: preset.minTotalDamage,
    truncateOnesDigit: preset.truncateOnesDigit,
  });

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 무시: 권한 없음 등
    }
  }

  return (
    <Dialog open={preset !== null} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>프리셋 공유</DialogTitle>
          <DialogDescription>
            아래 코드를 복사하여 다른 사용자에게 전달하세요. 받은 사람은 &quot;코드로 가져오기&quot;를 통해 프리셋을 추가할 수 있습니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground mb-1">프리셋 이름</p>
            <p className="text-sm font-medium">{preset.name}</p>
          </div>
          <div>
            <textarea
              readOnly
              value={code}
              rows={4}
              onFocus={(e) => e.target.select()}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs font-mono shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none break-all"
            />
          </div>
          <Button className="w-full" onClick={handleCopy}>
            {copied ? '복사됨' : '코드 복사'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
