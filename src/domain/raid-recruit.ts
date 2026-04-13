/** 레이드 모집 캐릭터 상세 */
export interface RaidRecruitCharacter {
  name: string;
  /** 딜러: 억, 버퍼: 만 */
  stat: number;
}

/** 일반 레이드 모집 카드 */
export interface RaidRecruitCard {
  id: string;
  ownerName: string;
  dealerCount: number;
  bufferCount: number;
  /** 딜러 캐릭터 상세 (선택, dealerCount만큼) */
  dealers: RaidRecruitCharacter[];
  /** 버퍼 캐릭터 상세 (선택, bufferCount만큼) */
  buffers: RaidRecruitCharacter[];
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
  character?: RaidRecruitCharacter;
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
 * 5. 카드에 캐릭터 상세가 있으면 순서대로 할당
 * 6. 남은 빈 칸은 null (구인)
 */
export function buildRaidRecruitAssignment(
  cards: RaidRecruitCard[],
  input: RaidRecruitInput,
): RaidRecruitAssignment {
  const { matchCount, partyCount, dealersPerParty, buffersPerParty } = input;
  const slotsPerParty = dealersPerParty + buffersPerParty;

  const matches: (RaidRecruitSlot | null)[][][] = Array.from(
    { length: matchCount },
    () => Array.from(
      { length: partyCount },
      () => Array.from<RaidRecruitSlot | null>({ length: slotsPerParty }).fill(null),
    ),
  );

  const matchOwners: Set<string>[] = Array.from(
    { length: matchCount },
    () => new Set<string>(),
  );

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

  // 카드별 버퍼/딜러 배정 카운터 (캐릭터 상세 순서 매칭용)
  const cardBufferIdx = new Map<string, number>();
  const cardDealerIdx = new Map<string, number>();

  function assignBuffer(card: RaidRecruitCard): void {
    for (let m = 0; m < matchCount; m++) {
      if (matchOwners[m].has(card.ownerName)) continue;
      for (let p = 0; p < partyCount; p++) {
        if (bufferFilled[m][p] >= buffersPerParty) continue;
        const idx = cardBufferIdx.get(card.id) ?? 0;
        const character = card.buffers?.[idx];
        const slotIdx = bufferFilled[m][p];
        matches[m][p][slotIdx] = {
          ownerName: card.ownerName,
          role: 'buffer',
          character: character ?? undefined,
        };
        bufferFilled[m][p]++;
        matchOwners[m].add(card.ownerName);
        cardBufferIdx.set(card.id, idx + 1);
        return;
      }
    }
  }

  function assignDealer(card: RaidRecruitCard): void {
    for (let m = 0; m < matchCount; m++) {
      if (matchOwners[m].has(card.ownerName)) continue;
      for (let p = 0; p < partyCount; p++) {
        if (dealerFilled[m][p] >= dealersPerParty) continue;
        const idx = cardDealerIdx.get(card.id) ?? 0;
        const character = card.dealers?.[idx];
        const slotIdx = buffersPerParty + dealerFilled[m][p];
        matches[m][p][slotIdx] = {
          ownerName: card.ownerName,
          role: 'dealer',
          character: character ?? undefined,
        };
        dealerFilled[m][p]++;
        matchOwners[m].add(card.ownerName);
        cardDealerIdx.set(card.id, idx + 1);
        return;
      }
    }
  }

  for (const card of sorted) {
    for (let i = 0; i < card.bufferCount; i++) {
      assignBuffer(card);
    }
    for (let i = 0; i < card.dealerCount; i++) {
      assignDealer(card);
    }
  }

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
