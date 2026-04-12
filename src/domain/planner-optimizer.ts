import type {
  PartyCard,
  PartyCardCharacter,
  RotationRole,
  RotationTemplate,
} from './planner';

export interface MatchSlot {
  role: RotationRole;
  ownerName: string;
  character: PartyCardCharacter | null;
}

export interface PlannerAssignment {
  matches: MatchSlot[][];
  dealerSumPerMatch: number[];
  bufferStatPerMatch: number[];
  dealerStdDev: number;
  bufferStdDev: number;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(values.reduce((s, x) => s + (x - avg) ** 2, 0) / values.length);
}

/**
 * 파티 로테이션 배치
 *
 * 카드 등록 순서대로 컬럼 배치.
 * 각 모험단의 딜러를 매치에 배정할 때:
 * - 홀수 기수(1,3,5...): 딜 오름차순 (낮은 딜부터)
 * - 짝수 기수(2,4,6...): 딜 내림차순 (높은 딜부터)
 * 이렇게 하면 인접 기수 간 딜 합계가 자연스럽게 균형을 이룬다.
 */
export function buildPlannerAssignment(
  template: RotationTemplate,
  cards: PartyCard[],
): PlannerAssignment | null {
  const { matrix, peopleCount, matchesCount } = template;
  if (cards.length === 0) return null;

  // 빈 카드 패딩
  const paddedCards: PartyCard[] = [...cards];
  while (paddedCards.length < peopleCount) {
    paddedCards.push({
      id: `_empty_${paddedCards.length}`,
      ownerName: `(미등록 ${paddedCards.length + 1})`,
      buffers: [],
      dealers: [],
      secondaryBuffers: [],
      carries: [],
    });
  }

  // 컬럼별 역할-매치 인덱스
  const colRoleMatches: Array<Record<RotationRole, number[]>> = [];
  for (let col = 0; col < peopleCount; col++) {
    const out: Record<RotationRole, number[]> = { buffer: [], dealer: [], secondaryBuffer: [], carry: [] };
    for (let m = 0; m < matchesCount; m++) {
      out[matrix[m][col]].push(m);
    }
    colRoleMatches.push(out);
  }

  // 각 모험단의 딜러 배정: 홀수 기수 오름차순, 짝수 기수 내림차순
  const dealerOrder: number[][] = paddedCards.map((card, col) => {
    const dealers = card.dealers;
    if (dealers.length <= 1) return dealers.map((_, i) => i);

    const dealerMatches = colRoleMatches[col].dealer;

    // 딜 기준 정렬된 인덱스 (오름차순)
    const sortedAsc = dealers
      .map((d, i) => ({ idx: i, stat: d.stat }))
      .sort((a, b) => a.stat - b.stat)
      .map((d) => d.idx);

    // 딜 기준 정렬된 인덱스 (내림차순)
    const sortedDesc = [...sortedAsc].reverse();

    // 각 딜러 슬롯에 대해 해당 매치가 홀수/짝수인지에 따라 배정
    const order = new Array<number>(dealerMatches.length);
    let ascIdx = 0;
    let descIdx = 0;

    for (let i = 0; i < dealerMatches.length; i++) {
      const matchNum = dealerMatches[i] + 1; // 1-based 기수
      if (matchNum % 2 === 1) {
        // 홀수 기수: 오름차순에서 순서대로
        order[i] = sortedAsc[ascIdx % sortedAsc.length];
        ascIdx++;
      } else {
        // 짝수 기수: 내림차순에서 순서대로
        order[i] = sortedDesc[descIdx % sortedDesc.length];
        descIdx++;
      }
    }

    return order;
  });

  // 매치 배치 생성
  const matches: MatchSlot[][] = [];
  for (let m = 0; m < matchesCount; m++) {
    const slots: MatchSlot[] = [];
    for (let col = 0; col < peopleCount; col++) {
      const role = matrix[m][col];
      let character: PartyCardCharacter | null = null;

      if (role === 'buffer') {
        character = paddedCards[col].buffers[0] ?? null;
      } else if (role === 'dealer') {
        const dealerMatches = colRoleMatches[col].dealer;
        const idx = dealerMatches.indexOf(m);
        if (idx >= 0) {
          const dealerIdx = dealerOrder[col][idx];
          character = paddedCards[col].dealers[dealerIdx] ?? null;
        }
      } else if (role === 'secondaryBuffer') {
        const sbMatches = colRoleMatches[col].secondaryBuffer;
        const idx = sbMatches.indexOf(m);
        if (idx >= 0) {
          character = paddedCards[col].secondaryBuffers[idx] ?? null;
        }
      } else {
        character = null;
      }

      slots.push({ role, ownerName: paddedCards[col].ownerName, character });
    }
    matches.push(slots);
  }

  // 통계
  const dealerSumPerMatch: number[] = [];
  const bufferStatPerMatch: number[] = [];
  for (const match of matches) {
    let dSum = 0;
    let bSum = 0;
    for (const slot of match) {
      if (slot.character === null) continue;
      if (slot.role === 'dealer') dSum += slot.character.stat;
      if (slot.role === 'buffer') bSum += slot.character.stat;
    }
    dealerSumPerMatch.push(dSum);
    bufferStatPerMatch.push(bSum);
  }

  return {
    matches,
    dealerSumPerMatch,
    bufferStatPerMatch,
    dealerStdDev: stddev(dealerSumPerMatch),
    bufferStdDev: stddev(bufferStatPerMatch),
  };
}
