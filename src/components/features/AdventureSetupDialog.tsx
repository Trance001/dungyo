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
import { DEFAULT_SERVER_ID, DNF_SERVERS } from '@/config/constants';

interface AdventureSetupDialogProps {
  open: boolean;
}

export function AdventureSetupDialog({ open }: AdventureSetupDialogProps) {
  const [serverId, setServerId] = useState<string>(DEFAULT_SERVER_ID);
  const [characterNames, setCharacterNames] = useState('');
  const { isLoading, progress, error, setupAdventure } = useAdventureSetup();
  const adventureName = useCharacterStore((state) => state.adventureName);

  async function handleSubmit() {
    if (!characterNames.trim()) return;
    await setupAdventure(serverId, characterNames);
  }

  return (
    <Dialog open={open && !adventureName}>
      <DialogContent
        className="sm:max-w-md"
        onInteractOutside={(e: Event) => e.preventDefault()}
        onPointerDownOutside={(e: Event) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>모험단 설정</DialogTitle>
          <DialogDescription>
            서버를 선택하고 등록할 캐릭터명을 쉼표로 구분하여 입력해주세요.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="setup-server">서버</Label>
            <select
              id="setup-server"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            >
              {DNF_SERVERS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="setup-characters">캐릭터명</Label>
            <textarea
              id="setup-characters"
              placeholder="캐릭터명을 띄어쓰기로 구분하여 입력&#10;예: 캐릭터명1 캐릭터명2 캐릭터명3"
              value={characterNames}
              onChange={(e) => setCharacterNames(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            />
            <p className="text-xs text-muted-foreground">
              던담에서 확인한 캐릭터명을 입력하세요 (띄어쓰기 또는 줄바꿈으로 구분)
            </p>
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}

          {progress && (
            <p className="text-sm text-muted-foreground">{progress}</p>
          )}

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isLoading || !characterNames.trim()}
          >
            {isLoading ? '캐릭터 조회 중...' : '모험단 설정'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
