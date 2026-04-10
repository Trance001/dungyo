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
import { getCharacterImageUrl } from '@/domain/character';
import { useCharacterStore } from '@/stores/character-store';

interface PartyResultProps {
  composition: PartyComposition;
}

export function PartyResult({ composition }: PartyResultProps) {
  const meta = RAID_TYPE_META[composition.raidType];
  const { markCleared } = useCharacterStore();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{meta.label} 구성 결과</CardTitle>
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
              {composition.dealers.map((dealer) => (
                <CharacterSlotCard
                  key={`${dealer.serverId}:${dealer.characterId}`}
                  character={dealer}
                  stat={`딜: ${dealer.damage.toLocaleString()}억`}
                  roleColor="text-red-500"
                  onMarkCleared={() => markCleared(dealer)}
                />
              ))}
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
            <CharacterSlotCard
              character={composition.primaryBuffer}
              stat={`버프력: ${composition.primaryBuffer.buffPower.toLocaleString()}만`}
              roleColor="text-blue-500"
              onMarkCleared={() => markCleared(composition.primaryBuffer!)}
            />
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
            <CharacterSlotCard
              character={composition.secondaryBuffer}
              stat={`버프력: ${composition.secondaryBuffer.buffPower.toLocaleString()}만`}
              roleColor="text-cyan-500"
              onMarkCleared={() => markCleared(composition.secondaryBuffer!)}
            />
          </CardContent>
        </Card>
      )}

      {/* 업둥 */}
      {composition.carries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              업둥 ({composition.carries.length}/{meta.carrySlots})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {composition.carries.map((carry) => (
                <CharacterSlotCard
                  key={`${carry.serverId}:${carry.characterId}`}
                  character={carry}
                  stat="쩔 받을 캐릭터"
                  roleColor="text-green-500"
                  onMarkCleared={() => markCleared(carry)}
                />
              ))}
            </div>
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
  onMarkCleared: () => void;
}

function CharacterSlotCard({
  character,
  stat,
  roleColor,
  onMarkCleared,
}: CharacterSlotCardProps) {
  const imageUrl = getCharacterImageUrl(
    character.serverId,
    character.characterId,
    1,
  );

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card">
      <img
        src={imageUrl}
        alt={character.characterName}
        className="w-12 h-12 rounded"
        loading="lazy"
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">
          {character.characterName}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {character.jobGrowName} Lv.{character.level}
        </p>
        <p className={`text-xs font-medium ${roleColor}`}>{stat}</p>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onMarkCleared}
        className="shrink-0"
      >
        클리어
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
    case 'carry':
      return '업둥';
    default:
      return role;
  }
}
