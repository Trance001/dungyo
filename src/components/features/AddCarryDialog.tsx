import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  getCharacterImageUrl,
  getEffectiveRole,
  hasValidCharacterId,
} from '@/domain/character';
import { characterKey } from '@/domain/party-builder';
import { useCharacterStore } from '@/stores/character-store';

import type { Character } from '@/domain/character';

interface AddCarryDialogProps {
  open: boolean;
  onClose: () => void;
  availableCharacters: Character[];
  onAdd: (character: Character) => void;
  remainingSlots: number;
}

export function AddCarryDialog({
  open,
  onClose,
  availableCharacters,
  onAdd,
  remainingSlots,
}: AddCarryDialogProps) {
  const damageMap = useCharacterStore((state) => state.damageMap);
  const buffPowerMap = useCharacterStore((state) => state.buffPowerMap);
  const roleOverrideMap = useCharacterStore((state) => state.roleOverrideMap);

  function handleAdd(character: Character) {
    onAdd(character);
    if (remainingSlots <= 1) {
      onClose();
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>업둥 캐릭터 추가</DialogTitle>
          <DialogDescription>
            파티 구성에서 탈락한 캐릭터 중에서 업둥으로 추가할 캐릭터를 선택하세요. (남은 슬롯: {remainingSlots}명)
          </DialogDescription>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {availableCharacters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              추가 가능한 탈락 캐릭터가 없습니다
            </p>
          ) : (
            availableCharacters.map((c) => {
              const isBuffer = getEffectiveRole(c, roleOverrideMap) === 'buffer';
              const statValue = isBuffer
                ? buffPowerMap.get(characterKey(c))
                : damageMap.get(characterKey(c));
              const statLabel = isBuffer
                ? `버프력: ${statValue?.toLocaleString() ?? '-'}만`
                : `딜: ${statValue?.toLocaleString() ?? '-'}억`;
              const hasKey = hasValidCharacterId(c);

              return (
                <div
                  key={characterKey(c)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card"
                >
                  {hasKey ? (
                    <img
                      src={getCharacterImageUrl(c.serverId, c.characterId)}
                      alt={c.characterName}
                      className="w-10 h-10 rounded"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
                      {c.characterName.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.characterName}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.jobGrowName}
                    </p>
                    <p className={`text-xs font-medium ${isBuffer ? 'text-sky-400' : 'text-orange-400'}`}>
                      {statLabel}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdd(c)}
                    className="shrink-0"
                  >
                    추가
                  </Button>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
