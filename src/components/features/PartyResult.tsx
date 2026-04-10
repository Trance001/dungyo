import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RAID_TYPE_META } from '@/config/constants';
import type { MissingSlot, PartyComposition } from '@/domain/party';
import type { RoledCharacter } from '@/domain/character';
import { getCharacterImageUrl, hasValidCharacterId } from '@/domain/character';
import { isAlreadyCleared } from '@/domain/weekly-clear';
import { useCharacterStore } from '@/stores/character-store';

interface PartyResultProps {
  composition: PartyComposition;
  partyIndex?: number;
}

export function PartyResult({ composition, partyIndex }: PartyResultProps) {
  const meta = RAID_TYPE_META[composition.raidType];
  const markCleared = useCharacterStore((state) => state.markCleared);
  const unmarkCleared = useCharacterStore((state) => state.unmarkCleared);
  const weeklyClearRecords = useCharacterStore((state) => state.weeklyClearRecords);

  const title = partyIndex !== undefined
    ? `파티 ${partyIndex + 1} - ${meta.label}`
    : `${meta.label} 구성 결과`;

  return (
    <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{meta.description}</CardDescription>
            </div>
            <Badge variant={composition.isComplete ? 'default' : 'destructive'}>
              {composition.isComplete ? '구성 완료' : '인원 부족'}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* 딜러 */}
      {composition.dealers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              딜러 ({composition.dealers.length}/{meta.dealerSlots})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {composition.dealers.map((dealer) => {
                const cleared = isAlreadyCleared(weeklyClearRecords, dealer.characterId, dealer.serverId);
                return (
                  <CharacterSlotCard
                    key={`${dealer.serverId}:${dealer.characterId}`}
                    character={dealer}
                    stat={`딜: ${dealer.damage.toLocaleString()}억`}
                    roleColor="text-red-500"
                    cleared={cleared}
                    onToggleCleared={() => cleared
                      ? unmarkCleared(dealer.serverId, dealer.characterId)
                      : markCleared(dealer)
                    }
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 주 버퍼 */}
      {composition.primaryBuffer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">주 버퍼</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const cleared = isAlreadyCleared(weeklyClearRecords, composition.primaryBuffer!.characterId, composition.primaryBuffer!.serverId);
              return (
                <CharacterSlotCard
                  character={composition.primaryBuffer!}
                  stat={`버프력: ${composition.primaryBuffer!.buffPower.toLocaleString()}만`}
                  roleColor="text-blue-500"
                  cleared={cleared}
                  onToggleCleared={() => cleared
                    ? unmarkCleared(composition.primaryBuffer!.serverId, composition.primaryBuffer!.characterId)
                    : markCleared(composition.primaryBuffer!)
                  }
                />
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 부 버퍼 */}
      {composition.secondaryBuffer && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">부 버퍼</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const cleared = isAlreadyCleared(weeklyClearRecords, composition.secondaryBuffer!.characterId, composition.secondaryBuffer!.serverId);
              return (
                <CharacterSlotCard
                  character={composition.secondaryBuffer!}
                  stat={`버프력: ${composition.secondaryBuffer!.buffPower.toLocaleString()}만`}
                  roleColor="text-cyan-500"
                  cleared={cleared}
                  onToggleCleared={() => cleared
                    ? unmarkCleared(composition.secondaryBuffer!.serverId, composition.secondaryBuffer!.characterId)
                    : markCleared(composition.secondaryBuffer!)
                  }
                />
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* 업둥 */}
      {composition.carryCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              업둥 캐릭 {composition.carryCount}명
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              모험단 내 아무 캐릭터로 머릿수를 채웁니다
            </p>
          </CardContent>
        </Card>
      )}

      {/* 부족한 슬롯 경고 */}
      {composition.missingSlots.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-base text-destructive">
              부족한 인원
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm">
              {composition.missingSlots.map((slot) => (
                <li key={slot.role} className="text-muted-foreground">
                  {slotRoleLabel(slot.role)} {slot.count}명 부족 (조건:{' '}
                  {slot.requirement})
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface CharacterSlotCardProps {
  character: RoledCharacter;
  stat: string;
  roleColor: string;
  cleared: boolean;
  onToggleCleared: () => void;
}

function CharacterSlotCard({
  character,
  stat,
  roleColor,
  cleared,
  onToggleCleared,
}: CharacterSlotCardProps) {
  const hasKey = hasValidCharacterId(character);

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${cleared ? 'border-muted bg-muted/50 opacity-60' : 'border-border bg-card'}`}>
      {hasKey ? (
        <img
          src={getCharacterImageUrl(character.serverId, character.characterId)}
          alt={character.characterName}
          className="w-12 h-12 rounded"
          loading="lazy"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-sm text-muted-foreground">
          {character.characterName.charAt(0)}
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${cleared ? 'line-through' : ''}`}>
          {character.characterName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {character.jobGrowName}
        </p>
        <p className={`text-xs font-medium ${roleColor}`}>{stat}</p>
      </div>
      <Button
        variant={cleared ? 'secondary' : 'outline'}
        size="sm"
        onClick={onToggleCleared}
        className="shrink-0"
      >
        {cleared ? '완료' : '클리어'}
      </Button>
    </div>
  );
}

function slotRoleLabel(role: MissingSlot['role']): string {
  switch (role) {
    case 'dealer':
      return '딜러';
    case 'buffer':
      return '주 버퍼';
    case 'secondaryBuffer':
      return '부 버퍼';
  }
}
