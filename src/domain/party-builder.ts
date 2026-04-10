import { RAID_TYPE_META } from '@/config/constants';
import { isBufferJob } from './character';
import type {
  BufferCharacter,
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
 * 딜합벞교용 딜러 선별
 * 최소딜 이상인 후보 중 딜 합계가 minTotalDamage 이상이 되는
 * 가장 딜이 낮은 조합을 선택한다 (비싼 캐릭터 아끼기).
 *
 * 알고리즘: 오름차순 정렬된 후보에서 슬라이딩 윈도우로 탐색.
 * 뒤에서부터 count명을 잡고, 합계가 넘으면 앞쪽으로 이동.
 */
function selectDealersByTotalDamage(
  candidates: DealerCharacter[],
  count: number,
  minTotalDamage: number,
): DealerCharacter[] {
  if (candidates.length <= count) {
    return candidates;
  }

  // 후보는 이미 오름차순 정렬됨
  // 가장 딜이 낮은 count명 조합부터 시도
  // 단순 조합 탐색 (후보가 많지 않으므로 충분)
  const result = findMinCombination(candidates, count, minTotalDamage, 0);
  return result ?? candidates.slice(0, count);
}

/** 재귀적으로 합계 조건을 만족하는 가장 딜이 낮은 조합 탐색 */
function findMinCombination(
  candidates: DealerCharacter[],
  count: number,
  minTotal: number,
  startIdx: number,
): DealerCharacter[] | null {
  if (count === 0) {
    return minTotal <= 0 ? [] : null;
  }

  for (let i = startIdx; i <= candidates.length - count; i++) {
    const current = candidates[i];
    const rest = findMinCombination(
      candidates,
      count - 1,
      minTotal - current.damage,
      i + 1,
    );
    if (rest) {
      return [current, ...rest];
    }
  }

  return null;
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

  // 1. 딜러 선별
  const dealerCandidates = filterDealers(
    characters,
    damageMap,
    input.minDealerDamage,
    clearedRecords,
  );
  const selectedDealers = input.useTotalDamage
    ? selectDealersByTotalDamage(dealerCandidates, meta.dealerSlots, input.minTotalDamage)
    : dealerCandidates.slice(0, meta.dealerSlots);

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

  // 4. 부족한 슬롯 계산 (업둥은 머릿수만 채우므로 제외)
  const missingSlots: MissingSlot[] = [];
  if (selectedDealers.length < meta.dealerSlots) {
    missingSlots.push({
      role: 'dealer',
      count: meta.dealerSlots - selectedDealers.length,
      requirement: input.useTotalDamage
        ? `딜 ${input.minDealerDamage.toLocaleString()}억 이상, 딜합 ${input.minTotalDamage.toLocaleString()}억 이상`
        : `딜 ${input.minDealerDamage.toLocaleString()}억 이상`,
    });
  } else if (input.useTotalDamage) {
    const totalDamage = selectedDealers.reduce((sum, d) => sum + d.damage, 0);
    if (totalDamage < input.minTotalDamage) {
      missingSlots.push({
        role: 'dealer',
        count: 0,
        requirement: `딜합 ${input.minTotalDamage.toLocaleString()}억 필요 (현재 ${totalDamage.toLocaleString()}억)`,
      });
    }
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

  return {
    raidType: input.raidType,
    dealers: selectedDealers,
    primaryBuffer,
    secondaryBuffer,
    carryCount: meta.carrySlots,
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

    // 선발된 딜러/버퍼를 남은 목록에서 제거 (업둥은 등록 캐릭터 사용 안 함)
    const usedIds = new Set<string>();
    for (const d of result.dealers) usedIds.add(characterKey(d));
    if (result.primaryBuffer) usedIds.add(characterKey(result.primaryBuffer));
    if (result.secondaryBuffer) usedIds.add(characterKey(result.secondaryBuffer));

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
