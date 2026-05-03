import { getEffectiveRole } from './character';
import { characterKey } from './party-builder';

import type { Character } from './character';
import type { DungeonDef, DungeonId, TicketDef } from '@/config/dungeons';

/** 캐릭터의 던전 클리어 가능 상태 */
export type DungeonStatus =
  | 'cant_enter'       // 명성 미달
  | 'no_stat'          // 딜/버프력 미입력
  | 'subjugation'      // 명성 충족, 풀컷 미달 → 토벌권 추천
  | 'full_only'        // 풀 가능, 직 불가
  | 'full_and_direct'; // 풀+직 모두 가능

export interface TicketCandidate {
  character: Character;
  role: 'dealer' | 'buffer';
  /** 비교 대상 수치 (딜러: damage, 버퍼: buffPower). 미입력이면 undefined */
  stat: number | undefined;
  /** 토벌권에 묶인 던전별 상태 */
  dungeonStatuses: Array<{ dungeonId: DungeonId; status: DungeonStatus }>;
  /** 토벌권으로 해결되는 subjugation 던전 수 */
  subjugationCount: number;
}

/**
 * 한 캐릭터의 한 던전 클리어 가능 여부를 분류한다.
 * 명성 → 수치 입력 → 컷 비교 순서로 평가.
 */
export function classifyCharacterForDungeon(
  character: Character,
  role: 'dealer' | 'buffer',
  stat: number | undefined,
  dungeon: DungeonDef,
): DungeonStatus {
  if (character.fame < dungeon.minFame) return 'cant_enter';
  if (stat === undefined || stat <= 0) return 'no_stat';

  const cut = role === 'dealer' ? dungeon.dealerCut : dungeon.bufferCut;
  if (stat < cut.full) return 'subjugation';
  if (stat < cut.direct) return 'full_only';
  return 'full_and_direct';
}

/**
 * 토벌권 추천 후보를 반환한다.
 * 조건:
 * 1. 묶인 모든 던전의 입장 명성 충족 (cant_enter 없음)
 * 2. 묶인 던전 중 적어도 하나는 cut 미달 (subjugation)
 *
 * 캐릭터가 묶인 던전 중 하나라도 명성 미달이면 토벌권을 온전히 사용할 수 없으므로 제외.
 */
export function recommendTicketCandidates(
  characters: Character[],
  damageMap: Map<string, number>,
  buffPowerMap: Map<string, number>,
  roleOverrideMap: Map<string, 'dealer' | 'buffer'>,
  dungeons: Record<DungeonId, DungeonDef>,
  ticket: TicketDef,
): TicketCandidate[] {
  const candidates: TicketCandidate[] = [];

  for (const character of characters) {
    const role = getEffectiveRole(character, roleOverrideMap);
    const stat = role === 'dealer'
      ? damageMap.get(characterKey(character))
      : buffPowerMap.get(characterKey(character));

    const dungeonStatuses = ticket.dungeonIds.map((id) => ({
      dungeonId: id,
      status: classifyCharacterForDungeon(character, role, stat, dungeons[id]),
    }));

    // 명성 미달 던전이 하나라도 있으면 제외
    if (dungeonStatuses.some((d) => d.status === 'cant_enter')) continue;

    // cut 미달(subjugation) 던전이 하나도 없으면 토벌권 불필요 → 제외
    const subjugationCount = dungeonStatuses.filter((d) => d.status === 'subjugation').length;
    if (subjugationCount === 0) continue;

    candidates.push({ character, role, stat, dungeonStatuses, subjugationCount });
  }

  // 정렬: subjugation 던전 수 많은 순(=토벌권 효율 높은 순) → stat 낮은 순(절실한 순)
  candidates.sort((a, b) => {
    if (a.subjugationCount !== b.subjugationCount) return b.subjugationCount - a.subjugationCount;
    const sa = a.stat ?? Infinity;
    const sb = b.stat ?? Infinity;
    return sa - sb;
  });

  return candidates;
}
