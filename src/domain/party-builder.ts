import { RAID_TYPE_META } from '@/config/constants';
import { isBufferJob } from './character';
import type {
  BufferCharacter,
  CarryCharacter,
  Character,
  DealerCharacter,
} from './character';
import type {
  BufferExchangeInput,
  MissingSlot,
  PartyComposition,
} from './party';
import type { WeeklyClearRecord } from './weekly-clear';
import { isAlreadyCleared } from './weekly-clear';

/**
 * 캐릭터를 딜(데미지) 수치 기준으로 딜러 후보로 분류
 * damage 값은 외부에서 사용자가 수동 입력하거나 API 스탯 기반으로 계산
 */
export function filterDealers(
  characters: Character[],
  damageMap: Map<string, number>,
  minDamage: number,
  clearedRecords: WeeklyClearRecord[],
): DealerCharacter[] {
  return characters
    .filter((c) => {
      if (isBufferJob(c.jobGrowName)) return false;
      const damage = damageMap.get(characterKey(c));
      return (
        damage !== undefined &&
        damage >= minDamage &&
        !isAlreadyCleared(clearedRecords, c.characterId, c.serverId)
      );
    })
    .map((c) => ({
      ...c,
      role: 'dealer' as const,
      damage: damageMap.get(characterKey(c))!,
    }))
    .sort((a, b) => a.damage - b.damage);
}

/**
 * 캐릭터를 버프력 기준으로 버퍼 후보로 분류
 */
export function filterBuffers(
  characters: Character[],
  buffPowerMap: Map<string, number>,
  minBuffPower: number,
  clearedRecords: WeeklyClearRecord[],
): BufferCharacter[] {
  return characters
    .filter((c) => {
      if (!isBufferJob(c.jobGrowName)) return false;
      const buffPower = buffPowerMap.get(characterKey(c));
      return (
        buffPower !== undefined &&
        buffPower >= minBuffPower &&
        !isAlreadyCleared(clearedRecords, c.characterId, c.serverId)
      );
    })
    .map((c) => ({
      ...c,
      role: 'buffer' as const,
      buffPower: buffPowerMap.get(characterKey(c))!,
    }))
    .sort((a, b) => a.buffPower - b.buffPower);
}

/**
 * 딜러/버퍼로 선발되지 않은 나머지 캐릭터를 업둥(carry) 후보로
 */
export function filterCarries(
  characters: Character[],
  excludeIds: Set<string>,
  clearedRecords: WeeklyClearRecord[],
): CarryCharacter[] {
  return characters
    .filter(
      (c) =>
        !excludeIds.has(characterKey(c)) &&
        !isAlreadyCleared(clearedRecords, c.characterId, c.serverId),
    )
    .map((c) => ({
      ...c,
      role: 'carry' as const,
    }));
}

/**
 * 버퍼교환 최적 파티 구성 빌더
 */
export function buildPartyComposition(
  input: BufferExchangeInput,
  characters: Character[],
  damageMap: Map<string, number>,
  buffPowerMap: Map<string, number>,
  clearedRecords: WeeklyClearRecord[],
): PartyComposition {
  const meta = RAID_TYPE_META[input.raidType];

  // 1. 딜러 선별 (딜 높은 순)
  const dealerCandidates = filterDealers(
    characters,
    damageMap,
    input.minDealerDamage,
    clearedRecords,
  );
  const selectedDealers = dealerCandidates.slice(0, meta.dealerSlots);

  // 2. 주 버퍼 선별 (버프력 높은 순)
  const usedIds = new Set(selectedDealers.map((d) => characterKey(d)));
  const primaryBufferCandidates = filterBuffers(
    characters.filter((c) => !usedIds.has(characterKey(c))),
    buffPowerMap,
    input.minPrimaryBuffPower,
    clearedRecords,
  );
  const primaryBuffer = primaryBufferCandidates[0] ?? null;
  if (primaryBuffer) usedIds.add(characterKey(primaryBuffer));

  // 3. 부 버퍼 선별 (나벨 등)
  let secondaryBuffer: BufferCharacter | null = null;
  if (meta.secondaryBufferSlots > 0) {
    const secondaryCandidates = filterBuffers(
      characters.filter((c) => !usedIds.has(characterKey(c))),
      buffPowerMap,
      input.minSecondaryBuffPower,
      clearedRecords,
    );
    secondaryBuffer = secondaryCandidates[0] ?? null;
    if (secondaryBuffer) usedIds.add(characterKey(secondaryBuffer));
  }

  // 4. 업둥 캐릭터 선별
  const carryCandidates = filterCarries(characters, usedIds, clearedRecords);
  const selectedCarries = carryCandidates.slice(0, meta.carrySlots);

  // 5. 부족한 슬롯 계산
  const missingSlots: MissingSlot[] = [];
  if (selectedDealers.length < meta.dealerSlots) {
    missingSlots.push({
      role: 'dealer',
      count: meta.dealerSlots - selectedDealers.length,
      requirement: `딜 ${input.minDealerDamage.toLocaleString()}억 이상`,
    });
  }
  if (meta.primaryBufferSlots > 0 && !primaryBuffer) {
    missingSlots.push({
      role: 'buffer',
      count: 1,
      requirement: `버프력 ${input.minPrimaryBuffPower.toLocaleString()}만 이상`,
    });
  }
  if (meta.secondaryBufferSlots > 0 && !secondaryBuffer) {
    missingSlots.push({
      role: 'secondaryBuffer',
      count: 1,
      requirement: `버프력 ${input.minSecondaryBuffPower.toLocaleString()}만 이상`,
    });
  }
  if (selectedCarries.length < meta.carrySlots) {
    missingSlots.push({
      role: 'carry',
      count: meta.carrySlots - selectedCarries.length,
      requirement: '아무 캐릭터',
    });
  }

  return {
    raidType: input.raidType,
    dealers: selectedDealers,
    primaryBuffer,
    secondaryBuffer,
    carries: selectedCarries,
    isComplete: missingSlots.length === 0,
    missingSlots,
  };
}

/**
 * 복수 파티 구성 빌더
 * 캐릭터 중복 없이 가능한 모든 파티를 순차적으로 구성한다.
 * 마지막 불완전 파티도 포함하여 반환한다.
 */
export function buildMultipleParties(
  input: BufferExchangeInput,
  characters: Character[],
  damageMap: Map<string, number>,
  buffPowerMap: Map<string, number>,
  clearedRecords: WeeklyClearRecord[],
): PartyComposition[] {
  const parties: PartyComposition[] = [];
  let remainingCharacters = [...characters];

  while (remainingCharacters.length > 0) {
    const result = buildPartyComposition(
      input,
      remainingCharacters,
      damageMap,
      buffPowerMap,
      clearedRecords,
    );

    // 딜러도 버퍼도 없으면 더 이상 파티 구성 불가
    if (result.dealers.length === 0 && !result.primaryBuffer) break;

    parties.push(result);

    // 완전한 파티가 아니면 마지막 불완전 파티로 종료
    if (!result.isComplete) break;

    // 선발된 캐릭터를 남은 목록에서 제거
    const usedIds = new Set<string>();
    for (const d of result.dealers) usedIds.add(characterKey(d));
    if (result.primaryBuffer) usedIds.add(characterKey(result.primaryBuffer));
    if (result.secondaryBuffer) usedIds.add(characterKey(result.secondaryBuffer));
    for (const c of result.carries) usedIds.add(characterKey(c));

    remainingCharacters = remainingCharacters.filter(
      (c) => !usedIds.has(characterKey(c)),
    );
  }

  return parties;
}

/** 캐릭터 고유 키 (서버+ID 조합) */
export function characterKey(c: { serverId: string; characterId: string }): string {
  return `${c.serverId}:${c.characterId}`;
}
