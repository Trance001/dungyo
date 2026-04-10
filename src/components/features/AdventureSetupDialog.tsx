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
import { useCharacterStore } from '@/stores/character-store';
import { useAdventureSetup } from '@/hooks/useAdventureSetup';

interface AdventureSetupDialogProps {
  open: boolean;
}

export function AdventureSetupDialog({ open }: AdventureSetupDialogProps) {
  const [pastedText, setPastedText] = useState('');
  const { error, setupFromDundam } = useAdventureSetup();
  const adventureName = useCharacterStore((state) => state.adventureName);

  function handleSubmit() {
    if (!pastedText.trim()) return;
    setupFromDundam(pastedText);
  }

  return (
    <Dialog open={open && !adventureName}>
      <DialogContent
        className="sm:max-w-lg"
        onInteractOutside={(e: Event) => e.preventDefault()}
        onPointerDownOutside={(e: Event) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>모험단 설정</DialogTitle>
          <DialogDescription>
            던담 모험단 페이지에서 Ctrl+A → Ctrl+C 후 아래에 붙여넣어주세요.
            캐릭터와 딜/버프 수치가 자동으로 등록됩니다.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="dundam-paste">던담 데이터</Label>
            <textarea
              id="dundam-paste"
              placeholder="던담 모험단 페이지 내용을 붙여넣으세요"
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={8}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!pastedText.trim()}
          >
            던담 데이터로 모험단 설정
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
