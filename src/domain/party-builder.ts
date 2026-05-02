import { getEffectiveRole } from './character';
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
  roleOverrideMap: Map<string, 'dealer' | 'buffer'>,
): DealerCharacter[] {
  return characters
    .filter((c) => {
      if (getEffectiveRole(c, roleOverrideMap) !== 'dealer') return false;
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
  roleOverrideMap: Map<string, 'dealer' | 'buffer'>,
): BufferCharacter[] {
  return characters
    .filter((c) => {
      if (getEffectiveRole(c, roleOverrideMap) !== 'buffer') return false;
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
  truncateOnesDigit: boolean,
): DealerCharacter[] {
  if (candidates.length <= count) {
    return candidates;
  }

  // 1의 자리 버림 적용 시 damage를 10 단위로 내림하여 계산
  const effectiveCandidates = truncateOnesDigit
    ? candidates.map((c) => ({ ...c, damage: Math.floor(c.damage / 10) * 10 }))
    : candidates;

  // 후보는 이미 오름차순 정렬됨
  // 가장 딜이 낮은 count명 조합부터 시도
  // 단순 조합 탐색 (후보가 많지 않으므로 충분)
  const result = findMinCombination(effectiveCandidates, count, minTotalDamage, 0);
  if (!result) return candidates.slice(0, count);

  // 원본 damage를 가진 캐릭터로 복원
  const selectedIds = new Set(result.map((d) => characterKey(d)));
  return candidates.filter((c) => selectedIds.has(characterKey(c)));
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
  roleOverrideMap: Map<string, 'dealer' | 'buffer'>,
): PartyComposition {
  // 명성 필터 적용
  const minFame = input.minFame ?? 0;
  const fameFiltered = minFame > 0
    ? characters.filter((c) => c.fame >= minFame)
    : characters;

  // 1. 딜러 선별
  const dealerCandidates = filterDealers(
    fameFiltered,
    damageMap,
    input.minDealerDamage,
    clearedRecords,
    roleOverrideMap,
  );
  const selectedDealers = input.useTotalDamage
    ? selectDealersByTotalDamage(dealerCandidates, input.dealerSlots, input.minTotalDamage, input.truncateOnesDigit)
    : dealerCandidates.slice(0, input.dealerSlots);

  // 2. 버퍼 선별 (버프력 높은 순)
  const usedIds = new Set(selectedDealers.map((d) => characterKey(d)));
  const primaryBufferCandidates = filterBuffers(
    fameFiltered.filter((c) => !usedIds.has(characterKey(c))),
    buffPowerMap,
    input.minPrimaryBuffPower,
    clearedRecords,
    roleOverrideMap,
  );
  const primaryBuffers = primaryBufferCandidates.slice(0, input.bufferSlots);
  for (const b of primaryBuffers) usedIds.add(characterKey(b));

  // 3. 업둥버퍼 선별
  let secondaryBuffers: BufferCharacter[] = [];
  if (input.secondaryBufferSlots > 0) {
    const secondaryCandidates = filterBuffers(
      fameFiltered.filter((c) => !usedIds.has(characterKey(c))),
      buffPowerMap,
      input.minSecondaryBuffPower,
      clearedRecords,
      roleOverrideMap,
    );
    secondaryBuffers = secondaryCandidates.slice(0, input.secondaryBufferSlots);
    for (const b of secondaryBuffers) usedIds.add(characterKey(b));
  }

  // 4. 부족한 슬롯 계산 (업둥은 UI에서 수동 추가)
  const missingSlots: MissingSlot[] = [];
  if (selectedDealers.length < input.dealerSlots) {
    missingSlots.push({
      role: 'dealer',
      count: input.dealerSlots - selectedDealers.length,
      requirement: input.useTotalDamage
        ? `딜 ${input.minDealerDamage.toLocaleString()}억 이상, 딜합 ${input.minTotalDamage.toLocaleString()}억 이상`
        : `딜 ${input.minDealerDamage.toLocaleString()}억 이상`,
    });
  } else if (input.useTotalDamage) {
    const totalDamage = selectedDealers.reduce((sum, d) => {
      const dmg = input.truncateOnesDigit ? Math.floor(d.damage / 10) * 10 : d.damage;
      return sum + dmg;
    }, 0);
    if (totalDamage < input.minTotalDamage) {
      missingSlots.push({
        role: 'dealer',
        count: 0,
        requirement: `딜합 ${input.minTotalDamage.toLocaleString()}억 필요 (현재 ${totalDamage.toLocaleString()}억)`,
      });
    }
  }
  if (input.bufferSlots > 0 && primaryBuffers.length < input.bufferSlots) {
    missingSlots.push({
      role: 'buffer',
      count: input.bufferSlots - primaryBuffers.length,
      requirement: `버프력 ${input.minPrimaryBuffPower.toFixed(1)}만 이상`,
    });
  }
  if (input.secondaryBufferSlots > 0 && secondaryBuffers.length < input.secondaryBufferSlots) {
    missingSlots.push({
      role: 'secondaryBuffer',
      count: input.secondaryBufferSlots - secondaryBuffers.length,
      requirement: `버프력 ${input.minSecondaryBuffPower.toFixed(1)}만 이상`,
    });
  }
  const slotConfig = {
    dealerSlots: input.dealerSlots,
    bufferSlots: input.bufferSlots,
    secondaryBufferSlots: input.secondaryBufferSlots,
    carrySlots: input.carrySlots,
  };

  return {
    slotConfig,
    useTotalDamage: input.useTotalDamage,
    truncateOnesDigit: input.useTotalDamage && input.truncateOnesDigit,
    dealers: selectedDealers,
    primaryBuffers,
    secondaryBuffers,
    carryCount: input.carrySlots,
    carryDealers: [],
    carryBuffers: [],
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
  roleOverrideMap: Map<string, 'dealer' | 'buffer'>,
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
      roleOverrideMap,
    );

    // 딜러도 버퍼도 없으면 더 이상 파티 구성 불가
    if (result.dealers.length === 0 && result.primaryBuffers.length === 0) break;

    parties.push(result);

    // 완전한 파티가 아니면 마지막 불완전 파티로 종료
    if (!result.isComplete) break;

    // 선발된 딜러/버퍼 및 업둥 배정 캐릭터를 남은 목록에서 제거
    const usedIds = new Set<string>();
    for (const d of result.dealers) usedIds.add(characterKey(d));
    for (const b of result.primaryBuffers) usedIds.add(characterKey(b));
    for (const b of result.secondaryBuffers) usedIds.add(characterKey(b));
    for (const d of result.carryDealers) usedIds.add(characterKey(d));
    for (const b of result.carryBuffers) usedIds.add(characterKey(b));

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
