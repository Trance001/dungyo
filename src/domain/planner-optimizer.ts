import type {
  PartyCard,
  PartyCardCharacter,
  RotationRole,
  RotationTemplate,
} from './planner';

/** 배치된 파티 결과 한 판의 슬롯 */
export interface MatchSlot {
  /** 이 슬롯의 역할 */
  role: RotationRole;
  /** 이 열(사람)의 소유자 닉네임 */
  ownerName: string;
  /** 배정된 캐릭터 (업둥/업둥버퍼는 null일 수 있음) */
  character: PartyCardCharacter | null;
}

export interface PlannerAssignment {
  /** matches[matchIdx][columnIdx] */
  matches: MatchSlot[][];
  /** 판별 딜러 합계 */
  dealerSumPerMatch: number[];
  /** 판별 버퍼 스탯 (주버퍼) */
  bufferStatPerMatch: number[];
  /** 딜 합계 표준편차 (낮을수록 균형) */
  dealerStdDev: number;
  /** 버프력 표준편차 */
  bufferStdDev: number;
}

/** 배열의 모든 순열 */
function permutations<T>(arr: T[]): T[][] {
  if (arr.length <= 1) return [arr];
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const rest = [...arr.slice(0, i), ...arr.slice(i + 1)];
    for (const p of permutations(rest)) {
      result.push([arr[i], ...p]);
    }
  }
  return result;
}

function stddev(values: number[]): number {
  if (values.length === 0) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((s, x) => s + (x - avg) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * 파티 카드 리스트를 로테이션 템플릿에 배치한다.
 * 각 사람의 딜러를 dealer-match에 어떤 순서로 배정할지 순열 탐색으로 최적화한다.
 * 목표: 판별 딜러 합계의 분산 최소화 (업둥 / 업둥버퍼는 최적화 대상 아님)
 */
export function buildPlannerAssignment(
  template: RotationTemplate,
  cards: PartyCard[],
): PlannerAssignment | null {
  const { matrix, peopleCount, matchesCount } = template;
  if (cards.length === 0) return null;

  // 부분 등록 시 빈 카드로 패딩
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

  // 사람별 각 역할의 매치 인덱스 목록
  const personRoleMatches: Array<Record<RotationRole, number[]>> = [];
  for (let p = 0; p < peopleCount; p++) {
    const out: Record<RotationRole, number[]> = { buffer: [], dealer: [], secondaryBuffer: [], carry: [] };
    for (let m = 0; m < matchesCount; m++) {
      out[matrix[m][p]].push(m);
    }
    personRoleMatches.push(out);
  }

  // 각 사람의 딜러 순서: [slotIdx → dealer 캐릭터 인덱스]
  // 초기값: 0, 1, 2, ...
  const personDealerOrder: number[][] = paddedCards.map((c) => c.dealers.map((_, i) => i));

  function computeDealerSums(orders: number[][]): number[] {
    const sums = new Array(matchesCount).fill(0);
    for (let p = 0; p < peopleCount; p++) {
      const dealerMatches = personRoleMatches[p].dealer;
      for (let i = 0; i < dealerMatches.length; i++) {
        const dealerIdx = orders[p][i];
        if (dealerIdx !== undefined && paddedCards[p].dealers[dealerIdx]) {
          sums[dealerMatches[i]] += paddedCards[p].dealers[dealerIdx].stat;
        }
      }
    }
    return sums;
  }

  function computeDealerStdDev(orders: number[][]): number {
    return stddev(computeDealerSums(orders));
  }

  // 반복적 최적화: 각 사람별로 순열을 시도하여 variance 개선
  const MAX_ITERATIONS = 50;
  let improved = true;
  let iterations = 0;
  while (improved && iterations < MAX_ITERATIONS) {
    improved = false;
    iterations++;
    for (let p = 0; p < peopleCount; p++) {
      const currentOrder = personDealerOrder[p];
      if (currentOrder.length <= 1) continue;

      let bestOrder = currentOrder;
      let bestScore = computeDealerStdDev(personDealerOrder);

      for (const perm of permutations(currentOrder)) {
        personDealerOrder[p] = perm;
        const score = computeDealerStdDev(personDealerOrder);
        if (score < bestScore - 1e-9) {
          bestScore = score;
          bestOrder = perm;
          improved = true;
        }
      }
      personDealerOrder[p] = bestOrder;
    }
  }

  // 최종 매치 배치 생성
  const matches: MatchSlot[][] = [];
  for (let m = 0; m < matchesCount; m++) {
    const slots: MatchSlot[] = [];
    for (let p = 0; p < peopleCount; p++) {
      const role = matrix[m][p];
      let character: PartyCardCharacter | null = null;

      if (role === 'buffer') {
        character = paddedCards[p].buffers[0] ?? null;
      } else if (role === 'dealer') {
        const dealerMatches = personRoleMatches[p].dealer;
        const idx = dealerMatches.indexOf(m);
        if (idx >= 0) {
          const dealerIdx = personDealerOrder[p][idx];
          character = paddedCards[p].dealers[dealerIdx] ?? null;
        }
      } else if (role === 'secondaryBuffer') {
        const sbMatches = personRoleMatches[p].secondaryBuffer;
        const idx = sbMatches.indexOf(m);
        if (idx >= 0) {
          character = paddedCards[p].secondaryBuffers[idx] ?? null;
        }
      } else if (role === 'carry') {
        const carryMatches = personRoleMatches[p].carry;
        const idx = carryMatches.indexOf(m);
        if (idx >= 0) {
          character = paddedCards[p].carries[idx] ?? null;
        }
      }

      slots.push({ role, ownerName: paddedCards[p].ownerName, character });
    }
    matches.push(slots);
  }

  // 통계 계산
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
