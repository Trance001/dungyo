import type {
  PartyCard,
  PartyCardCharacter,
  RotationRole,
  RotationTemplate,
} from './planner';

/** 배치된 파티 결과 한 판의 슬롯 */
export interface MatchSlot {
  role: RotationRole;
  ownerName: string;
  character: PartyCardCharacter | null;
}

export interface PlannerAssignment {
  /** matches[matchIdx][columnIdx] */
  matches: MatchSlot[][];
  dealerSumPerMatch: number[];
  bufferStatPerMatch: number[];
  dealerStdDev: number;
  bufferStdDev: number;
}

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

/** 각 컬럼의 버퍼 매치 인덱스를 찾는다 */
function findBufferMatchPerColumn(matrix: RotationRole[][], peopleCount: number, matchesCount: number): number[] {
  const result = new Array<number>(peopleCount).fill(-1);
  for (let col = 0; col < peopleCount; col++) {
    for (let m = 0; m < matchesCount; m++) {
      if (matrix[m][col] === 'buffer') {
        result[col] = m;
        break;
      }
    }
  }
  return result;
}

/**
 * 딜러 순열 최적화 (기존 로직)
 * orderedCards[col]의 딜러를 해당 컬럼의 dealer-match에 어떤 순서로 배치할지 결정
 */
function optimizeDealerPermutations(
  matrix: RotationRole[][],
  orderedCards: PartyCard[],
  peopleCount: number,
  matchesCount: number,
): number[][] {
  // 컬럼별 역할별 매치 인덱스
  const colRoleMatches: Array<Record<RotationRole, number[]>> = [];
  for (let col = 0; col < peopleCount; col++) {
    const out: Record<RotationRole, number[]> = { buffer: [], dealer: [], secondaryBuffer: [], carry: [] };
    for (let m = 0; m < matchesCount; m++) {
      out[matrix[m][col]].push(m);
    }
    colRoleMatches.push(out);
  }

  const dealerOrder: number[][] = orderedCards.map((c) => c.dealers.map((_, i) => i));

  function computeDealerSums(orders: number[][]): number[] {
    const sums = new Array(matchesCount).fill(0);
    for (let col = 0; col < peopleCount; col++) {
      const dealerMatches = colRoleMatches[col].dealer;
      for (let i = 0; i < dealerMatches.length; i++) {
        const idx = orders[col][i];
        if (idx !== undefined && orderedCards[col].dealers[idx]) {
          sums[dealerMatches[i]] += orderedCards[col].dealers[idx].stat;
        }
      }
    }
    return sums;
  }

  let improved = true;
  let iterations = 0;
  while (improved && iterations < 50) {
    improved = false;
    iterations++;
    for (let col = 0; col < peopleCount; col++) {
      const current = dealerOrder[col];
      if (current.length <= 1) continue;

      let bestOrder = current;
      let bestScore = stddev(computeDealerSums(dealerOrder));

      for (const perm of permutations(current)) {
        dealerOrder[col] = perm;
        const score = stddev(computeDealerSums(dealerOrder));
        if (score < bestScore - 1e-9) {
          bestScore = score;
          bestOrder = perm;
          improved = true;
        }
      }
      dealerOrder[col] = bestOrder;
    }
  }

  return dealerOrder;
}

/**
 * 컬럼 배치 최적화: 딜합이 높은 매치에 버프력이 낮은 사람을 배치
 *
 * 순서:
 * 1. 현재 컬럼 순서로 딜러 최적화 → 매치별 딜합 계산
 * 2. 매치별 딜합과 사람별 버프력을 역매칭하여 컬럼 재배치
 * 3. 새 배치로 딜러 재최적화
 * 4. 수렴까지 반복
 */
function optimizeColumnOrder(
  matrix: RotationRole[][],
  cards: PartyCard[],
  peopleCount: number,
  matchesCount: number,
): PartyCard[] {
  const bufferMatchPerCol = findBufferMatchPerColumn(matrix, peopleCount, matchesCount);
  let currentOrder = [...cards];

  for (let round = 0; round < 10; round++) {
    // 딜러 최적화
    const dealerOrder = optimizeDealerPermutations(matrix, currentOrder, peopleCount, matchesCount);

    // 매치별 딜합 계산
    const colRoleMatches: Array<Record<RotationRole, number[]>> = [];
    for (let col = 0; col < peopleCount; col++) {
      const out: Record<RotationRole, number[]> = { buffer: [], dealer: [], secondaryBuffer: [], carry: [] };
      for (let m = 0; m < matchesCount; m++) {
        out[matrix[m][col]].push(m);
      }
      colRoleMatches.push(out);
    }

    const dealerSums = new Array(matchesCount).fill(0);
    for (let col = 0; col < peopleCount; col++) {
      const dealerMatches = colRoleMatches[col].dealer;
      for (let i = 0; i < dealerMatches.length; i++) {
        const idx = dealerOrder[col][i];
        if (idx !== undefined && currentOrder[col].dealers[idx]) {
          dealerSums[dealerMatches[i]] += currentOrder[col].dealers[idx].stat;
        }
      }
    }

    // 각 컬럼의 버퍼 매치의 딜합을 기준으로 정렬 (오름차순)
    const colIndices = Array.from({ length: peopleCount }, (_, i) => i);
    colIndices.sort((a, b) => {
      const matchA = bufferMatchPerCol[a];
      const matchB = bufferMatchPerCol[b];
      const sumA = matchA >= 0 ? dealerSums[matchA] : 0;
      const sumB = matchB >= 0 ? dealerSums[matchB] : 0;
      return sumA - sumB;
    });

    // 사람별 버프력 기준으로 정렬 (내림차순: 높은 버프 → 낮은 딜합 매치)
    const personIndices = Array.from({ length: peopleCount }, (_, i) => i);
    personIndices.sort((a, b) => {
      const buffA = currentOrder[a].buffers[0]?.stat ?? 0;
      const buffB = currentOrder[b].buffers[0]?.stat ?? 0;
      return buffB - buffA;
    });

    // 재배치: 높은 버프 사람 → 낮은 딜합의 버퍼 매치를 가진 컬럼
    const newOrder = new Array<PartyCard>(peopleCount);
    for (let i = 0; i < peopleCount; i++) {
      newOrder[colIndices[i]] = currentOrder[personIndices[i]];
    }

    // 수렴 체크
    const same = newOrder.every((c, idx) => c.id === currentOrder[idx].id);
    if (same) break;
    currentOrder = newOrder;
  }

  return currentOrder;
}

/**
 * 파티 로테이션 최적 배치
 * 1단계: 컬럼 배치 최적화 (버프력 역매칭)
 * 2단계: 딜러 순열 최적화 (딜합 편차 최소화)
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

  // 1단계: 컬럼 배치 최적화
  const orderedCards = optimizeColumnOrder(matrix, paddedCards, peopleCount, matchesCount);

  // 2단계: 최종 딜러 순열 최적화
  const dealerOrder = optimizeDealerPermutations(matrix, orderedCards, peopleCount, matchesCount);

  // 컬럼별 역할-매치 인덱스
  const colRoleMatches: Array<Record<RotationRole, number[]>> = [];
  for (let col = 0; col < peopleCount; col++) {
    const out: Record<RotationRole, number[]> = { buffer: [], dealer: [], secondaryBuffer: [], carry: [] };
    for (let m = 0; m < matchesCount; m++) {
      out[matrix[m][col]].push(m);
    }
    colRoleMatches.push(out);
  }

  // 최종 매치 배치 생성
  const matches: MatchSlot[][] = [];
  for (let m = 0; m < matchesCount; m++) {
    const slots: MatchSlot[] = [];
    for (let col = 0; col < peopleCount; col++) {
      const role = matrix[m][col];
      let character: PartyCardCharacter | null = null;

      if (role === 'buffer') {
        character = orderedCards[col].buffers[0] ?? null;
      } else if (role === 'dealer') {
        const dealerMatches = colRoleMatches[col].dealer;
        const idx = dealerMatches.indexOf(m);
        if (idx >= 0) {
          const dealerIdx = dealerOrder[col][idx];
          character = orderedCards[col].dealers[dealerIdx] ?? null;
        }
      } else if (role === 'secondaryBuffer') {
        const sbMatches = colRoleMatches[col].secondaryBuffer;
        const idx = sbMatches.indexOf(m);
        if (idx >= 0) {
          character = orderedCards[col].secondaryBuffers[idx] ?? null;
        }
      } else if (role === 'carry') {
        character = null; // 업둥은 don't care
      }

      slots.push({ role, ownerName: orderedCards[col].ownerName, character });
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
