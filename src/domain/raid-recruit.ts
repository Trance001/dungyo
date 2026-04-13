/** 일반 레이드 모집 카드 */
export interface RaidRecruitCard {
  id: string;
  ownerName: string;
  dealerCount: number;
  bufferCount: number;
}

/** 레이드 모집 입력 조건 */
export interface RaidRecruitInput {
  /** 기수 수 */
  matchCount: number;
  /** 기수당 인원 */
  slotsPerMatch: number;
}

/** 배정된 슬롯 */
export interface RaidRecruitSlot {
  ownerName: string;
  role: 'dealer' | 'buffer';
}

/** 배정 결과 */
export interface RaidRecruitAssignment {
  /** matches[기수][슬롯] = slot 또는 null(구인) */
  matches: (RaidRecruitSlot | null)[][];
  /** 총 구인 수 */
  vacancies: number;
}

/**
 * 일반 레이드 모집 배정 알고리즘
 *
 * 1. 카드를 (dealerCount + bufferCount) 내림차순 정렬
 * 2. 각 카드에 대해 버퍼 우선으로 기수에 분배 (앞 기수 우선, 같은 기수 중복 불가)
 * 3. 딜러를 기수에 분배 (앞 기수 우선, 같은 기수 중복 불가)
 * 4. 남은 빈 칸은 null (구인)
 */
export function buildRaidRecruitAssignment(
  cards: RaidRecruitCard[],
  input: RaidRecruitInput,
): RaidRecruitAssignment {
  const { matchCount, slotsPerMatch } = input;

  // 기수별 슬롯 초기화
  const matches: (RaidRecruitSlot | null)[][] = Array.from(
    { length: matchCount },
    () => Array.from<RaidRecruitSlot | null>({ length: slotsPerMatch }).fill(null),
  );

  // 기수별 등록된 모험단명 추적 (중복 방지)
  const matchOwners: Set<string>[] = Array.from(
    { length: matchCount },
    () => new Set<string>(),
  );

  // 기수별 현재 채워진 슬롯 수 추적
  const matchFilled: number[] = new Array(matchCount).fill(0);

  // 카드를 총 캐릭터 수 내림차순 정렬
  const sorted = [...cards].sort(
    (a, b) => (b.dealerCount + b.bufferCount) - (a.dealerCount + a.bufferCount),
  );

  // 한 슬롯을 기수에 배정하는 헬퍼
  function assignToMatch(ownerName: string, role: 'dealer' | 'buffer'): void {
    for (let m = 0; m < matchCount; m++) {
      if (matchOwners[m].has(ownerName)) continue;
      if (matchFilled[m] >= slotsPerMatch) continue;

      const slotIdx = matchFilled[m];
      matches[m][slotIdx] = { ownerName, role };
      matchFilled[m]++;
      matchOwners[m].add(ownerName);
      return;
    }
  }

  // 각 카드에 대해 버퍼 우선 → 딜러 순으로 배정
  for (const card of sorted) {
    for (let i = 0; i < card.bufferCount; i++) {
      assignToMatch(card.ownerName, 'buffer');
    }
    for (let i = 0; i < card.dealerCount; i++) {
      assignToMatch(card.ownerName, 'dealer');
    }
  }

  // 구인 수 계산
  let vacancies = 0;
  for (let m = 0; m < matchCount; m++) {
    vacancies += slotsPerMatch - matchFilled[m];
  }

  return { matches, vacancies };
}
