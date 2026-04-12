import { useState } from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { MissingSlot, PartyComposition, SlotConfig } from '@/domain/party';
import type { RoledCharacter } from '@/domain/character';
import { getCharacterImageUrl, hasValidCharacterId } from '@/domain/character';
import { isAlreadyCleared } from '@/domain/weekly-clear';
import { useCharacterStore } from '@/stores/character-store';

interface PartyResultProps {
  composition: PartyComposition;
  partyIndex?: number;
  onOpenAddCarry?: () => void;
  onRemoveCarry?: (serverId: string, characterId: string) => void;
  onAddToPlanner?: () => void;
  onCopyPlannerCode?: () => void;
}

function buildCompositionDescription(config: SlotConfig): string {
  const parts: string[] = [];
  if (config.dealerSlots > 0) parts.push(`딜러 ${config.dealerSlots}`);
  if (config.bufferSlots > 0) parts.push(`버퍼 ${config.bufferSlots}`);
  if (config.secondaryBufferSlots > 0) parts.push(`업둥버퍼 ${config.secondaryBufferSlots}`);
  if (config.carrySlots > 0) parts.push(`업둥 ${config.carrySlots}`);
  return parts.join(' + ');
}

export function PartyResult({ composition, partyIndex, onOpenAddCarry, onRemoveCarry, onAddToPlanner, onCopyPlannerCode }: PartyResultProps) {
  const description = buildCompositionDescription(composition.slotConfig);
  const markCleared = useCharacterStore((state) => state.markCleared);
  const unmarkCleared = useCharacterStore((state) => state.unmarkCleared);
  const weeklyClearRecords = useCharacterStore((state) => state.weeklyClearRecords);
  const [copied, setCopied] = useState(false);

  const title = partyIndex !== undefined
    ? `파티 ${partyIndex + 1}`
    : '구성 결과';

  async function handleCopy() {
    const text = buildCopyText(composition);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 무시: 권한 없음 등
    }
  }

  return (
    <div className={`space-y-4 rounded-lg border p-4 ${composition.isComplete ? 'border-border bg-muted/30' : 'border-red-400/50 bg-red-950/20'}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {composition.isComplete && (
                <>
                  <Button variant="outline" size="sm" onClick={handleCopy}>
                    {copied ? '복사됨' : '복사'}
                  </Button>
                  {onAddToPlanner && (
                    <Button variant="outline" size="sm" onClick={onAddToPlanner}>
                      플래너
                    </Button>
                  )}
                  {onCopyPlannerCode && (
                    <Button variant="outline" size="sm" onClick={onCopyPlannerCode}>
                      카드코드
                    </Button>
                  )}
                </>
              )}
              <Badge variant={composition.isComplete ? 'default' : 'destructive'}>
                {composition.isComplete ? '구성 완료' : '인원 부족'}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 딜러 */}
      {composition.dealers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              딜러 ({composition.dealers.length}/{composition.slotConfig.dealerSlots})
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
                    stat={formatDealerStat(dealer.damage, composition.truncateOnesDigit)}
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

      {/* 버퍼 */}
      {composition.primaryBuffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              버퍼 ({composition.primaryBuffers.length}/{composition.slotConfig.bufferSlots})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {composition.primaryBuffers.map((buffer) => {
                const cleared = isAlreadyCleared(weeklyClearRecords, buffer.characterId, buffer.serverId);
                return (
                  <CharacterSlotCard
                    key={`${buffer.serverId}:${buffer.characterId}`}
                    character={buffer}
                    stat={`버프력: ${buffer.buffPower.toLocaleString()}만`}
                    roleColor="text-blue-500"
                    cleared={cleared}
                    onToggleCleared={() => cleared
                      ? unmarkCleared(buffer.serverId, buffer.characterId)
                      : markCleared(buffer)
                    }
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 업둥버퍼 */}
      {composition.secondaryBuffers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              업둥버퍼 ({composition.secondaryBuffers.length}/{composition.slotConfig.secondaryBufferSlots})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {composition.secondaryBuffers.map((buffer) => {
                const cleared = isAlreadyCleared(weeklyClearRecords, buffer.characterId, buffer.serverId);
                return (
                  <CharacterSlotCard
                    key={`${buffer.serverId}:${buffer.characterId}`}
                    character={buffer}
                    stat={`버프력: ${buffer.buffPower.toLocaleString()}만`}
                    roleColor="text-cyan-500"
                    cleared={cleared}
                    onToggleCleared={() => cleared
                      ? unmarkCleared(buffer.serverId, buffer.characterId)
                      : markCleared(buffer)
                    }
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 업둥 */}
      {composition.carryCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                업둥 ({composition.carryDealers.length + composition.carryBuffers.length}/{composition.carryCount})
              </CardTitle>
              {onOpenAddCarry && (composition.carryDealers.length + composition.carryBuffers.length) < composition.carryCount && (
                <Button variant="outline" size="sm" onClick={onOpenAddCarry}>
                  추가하기
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {composition.carryDealers.length === 0 && composition.carryBuffers.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                탈락된 캐릭터 중에서 &quot;추가하기&quot;로 업둥을 배정하세요
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {composition.carryDealers.map((dealer) => {
                  const cleared = isAlreadyCleared(weeklyClearRecords, dealer.characterId, dealer.serverId);
                  return (
                    <CharacterSlotCard
                      key={`carry-d-${dealer.serverId}:${dealer.characterId}`}
                      character={dealer}
                      stat={`딜: ${dealer.damage.toLocaleString()}억`}
                      roleColor="text-orange-400"
                      cleared={cleared}
                      onToggleCleared={() => cleared
                        ? unmarkCleared(dealer.serverId, dealer.characterId)
                        : markCleared(dealer)
                      }
                      onRemove={onRemoveCarry ? () => onRemoveCarry(dealer.serverId, dealer.characterId) : undefined}
                    />
                  );
                })}
                {composition.carryBuffers.map((buffer) => {
                  const cleared = isAlreadyCleared(weeklyClearRecords, buffer.characterId, buffer.serverId);
                  return (
                    <CharacterSlotCard
                      key={`carry-b-${buffer.serverId}:${buffer.characterId}`}
                      character={buffer}
                      stat={`버프력: ${buffer.buffPower.toLocaleString()}만`}
                      roleColor="text-sky-400"
                      cleared={cleared}
                      onToggleCleared={() => cleared
                        ? unmarkCleared(buffer.serverId, buffer.characterId)
                        : markCleared(buffer)
                      }
                      onRemove={onRemoveCarry ? () => onRemoveCarry(buffer.serverId, buffer.characterId) : undefined}
                    />
                  );
                })}
              </div>
            )}
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
  onRemove?: () => void;
}

function CharacterSlotCard({
  character,
  stat,
  roleColor,
  cleared,
  onToggleCleared,
  onRemove,
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
      <div className="flex flex-col gap-1 shrink-0">
        <Button
          variant={cleared ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleCleared}
        >
          {cleared ? '완료' : '클리어'}
        </Button>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive text-xs h-7"
          >
            빼기
          </Button>
        )}
      </div>
    </div>
  );
}

function cleanJobName(jobGrowName: string): string {
  return jobGrowName.replace(/^眞\s*/, '');
}

function truncateOnes(value: number): number {
  return Math.floor(value / 10) * 10;
}

function buildCopyText(composition: PartyComposition): string {
  const parts: string[] = [];

  for (const dealer of composition.dealers) {
    parts.push(`${cleanJobName(dealer.jobGrowName)}(${truncateOnes(dealer.damage).toLocaleString()})`);
  }
  for (const buffer of composition.primaryBuffers) {
    parts.push(`${cleanJobName(buffer.jobGrowName)}(${truncateOnes(buffer.buffPower).toLocaleString()})`);
  }
  for (const buffer of composition.secondaryBuffers) {
    parts.push(`업벞 ${cleanJobName(buffer.jobGrowName)} (${truncateOnes(buffer.buffPower).toLocaleString()})`);
  }

  let text = parts.join(' / ');

  if (composition.useTotalDamage && composition.dealers.length > 0) {
    const total = composition.dealers.reduce((sum, d) => sum + truncateOnes(d.damage), 0);
    text += ` / 딜합 ${total.toLocaleString()}`;
  }

  return text;
}

function formatDealerStat(damage: number, truncate: boolean): string {
  if (!truncate) return `딜: ${damage.toLocaleString()}억`;
  const truncated = Math.floor(damage / 10) * 10;
  const remainder = damage - truncated;
  return `딜: ${truncated.toLocaleString()}억 (+${remainder})`;
}

function slotRoleLabel(role: MissingSlot['role']): string {
  switch (role) {
    case 'dealer':
      return '딜러';
    case 'buffer':
      return '버퍼';
    case 'secondaryBuffer':
      return '업둥버퍼';
  }
}
