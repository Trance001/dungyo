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
  /** 파티 수 (기본 3: 레드/옐로/그린) */
  partyCount: number;
  /** 파티당 딜러 수 (기본 3) */
  dealersPerParty: number;
  /** 파티당 버퍼 수 (기본 1) */
  buffersPerParty: number;
}

/** 배정된 슬롯 */
export interface RaidRecruitSlot {
  ownerName: string;
  role: 'dealer' | 'buffer';
}

/** 배정 결과 */
export interface RaidRecruitAssignment {
  /** matches[기수][파티][슬롯] = slot 또는 null(구인) */
  matches: (RaidRecruitSlot | null)[][][];
  /** 총 구인 수 */
  vacancies: number;
  /** 파티 그룹명 */
  partyNames: string[];
}

const PARTY_NAMES = ['레드', '옐로', '그린', '블루', '퍼플'];

/**
 * 일반 레이드 모집 배정 알고리즘
 *
 * 각 기수는 partyCount개의 파티로 구성되며, 각 파티는 딜러+버퍼로 채운다.
 * 1. 카드를 (dealerCount + bufferCount) 내림차순 정렬
 * 2. 각 카드에 대해 버퍼 우선으로 파티의 버퍼 슬롯에 분배
 * 3. 딜러를 파티의 딜러 슬롯에 분배
 * 4. 같은 기수에 같은 모험단 중복 불가
 * 5. 남은 빈 칸은 null (구인)
 */
export function buildRaidRecruitAssignment(
  cards: RaidRecruitCard[],
  input: RaidRecruitInput,
): RaidRecruitAssignment {
  const { matchCount, partyCount, dealersPerParty, buffersPerParty } = input;
  const slotsPerParty = dealersPerParty + buffersPerParty;

  // 기수별 파티별 슬롯 초기화
  const matches: (RaidRecruitSlot | null)[][][] = Array.from(
    { length: matchCount },
    () => Array.from(
      { length: partyCount },
      () => Array.from<RaidRecruitSlot | null>({ length: slotsPerParty }).fill(null),
    ),
  );

  // 기수별 등록된 모험단명 추적
  const matchOwners: Set<string>[] = Array.from(
    { length: matchCount },
    () => new Set<string>(),
  );

  // 기수별 파티별 역할 채움 수 추적
  const bufferFilled: number[][] = Array.from(
    { length: matchCount },
    () => new Array(partyCount).fill(0),
  );
  const dealerFilled: number[][] = Array.from(
    { length: matchCount },
    () => new Array(partyCount).fill(0),
  );

  const sorted = [...cards].sort(
    (a, b) => (b.dealerCount + b.bufferCount) - (a.dealerCount + a.bufferCount),
  );

  function assignBuffer(ownerName: string): void {
    for (let m = 0; m < matchCount; m++) {
      if (matchOwners[m].has(ownerName)) continue;
      for (let p = 0; p < partyCount; p++) {
        if (bufferFilled[m][p] >= buffersPerParty) continue;
        const slotIdx = bufferFilled[m][p];
        matches[m][p][slotIdx] = { ownerName, role: 'buffer' };
        bufferFilled[m][p]++;
        matchOwners[m].add(ownerName);
        return;
      }
    }
  }

  function assignDealer(ownerName: string): void {
    for (let m = 0; m < matchCount; m++) {
      if (matchOwners[m].has(ownerName)) continue;
      for (let p = 0; p < partyCount; p++) {
        if (dealerFilled[m][p] >= dealersPerParty) continue;
        const slotIdx = buffersPerParty + dealerFilled[m][p];
        matches[m][p][slotIdx] = { ownerName, role: 'dealer' };
        dealerFilled[m][p]++;
        matchOwners[m].add(ownerName);
        return;
      }
    }
  }

  for (const card of sorted) {
    for (let i = 0; i < card.bufferCount; i++) {
      assignBuffer(card.ownerName);
    }
    for (let i = 0; i < card.dealerCount; i++) {
      assignDealer(card.ownerName);
    }
  }

  // 구인 수 계산
  let vacancies = 0;
  for (let m = 0; m < matchCount; m++) {
    for (let p = 0; p < partyCount; p++) {
      for (let s = 0; s < slotsPerParty; s++) {
        if (matches[m][p][s] === null) vacancies++;
      }
    }
  }

  return {
    matches,
    vacancies,
    partyNames: PARTY_NAMES.slice(0, partyCount),
  };
}
