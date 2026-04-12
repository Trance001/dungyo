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
  return Math.sqrt(values.reduce((s, x) => s + (x - avg) ** 2, 0) / values.length);
}

function shuffleArray<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 컬럼별 각 역할의 매치 인덱스 목록 */
function buildColRoleMatches(
  matrix: RotationRole[][],
  peopleCount: number,
  matchesCount: number,
): Array<Record<RotationRole, number[]>> {
  const result: Array<Record<RotationRole, number[]>> = [];
  for (let col = 0; col < peopleCount; col++) {
    const out: Record<RotationRole, number[]> = { buffer: [], dealer: [], secondaryBuffer: [], carry: [] };
    for (let m = 0; m < matchesCount; m++) {
      out[matrix[m][col]].push(m);
    }
    result.push(out);
  }
  return result;
}

/** 딜러 순열 최적화: 각 사람의 딜러를 매치에 배치하여 딜합 편차 최소화 */
function optimizeDealerPermutations(
  matrix: RotationRole[][],
  orderedCards: PartyCard[],
  peopleCount: number,
  matchesCount: number,
): { dealerOrder: number[][]; dealerSums: number[] } {
  const colRoleMatches = buildColRoleMatches(matrix, peopleCount, matchesCount);
  const dealerOrder: number[][] = orderedCards.map((c) => c.dealers.map((_, i) => i));

  function computeSums(orders: number[][]): number[] {
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
      let bestScore = stddev(computeSums(dealerOrder));

      for (const perm of permutations(current)) {
        dealerOrder[col] = perm;
        const score = stddev(computeSums(dealerOrder));
        if (score < bestScore - 1e-9) {
          bestScore = score;
          bestOrder = perm;
          improved = true;
        }
      }
      dealerOrder[col] = bestOrder;
    }
  }

  return { dealerOrder, dealerSums: computeSums(dealerOrder) };
}

/** 버프력 역매칭 점수: 딜합이 높은 매치에 낮은 버프력이면 좋음 (음의 상관관계) */
function bufferInverseScore(
  matrix: RotationRole[][],
  orderedCards: PartyCard[],
  dealerSums: number[],
  peopleCount: number,
  matchesCount: number,
): number {
  // 각 컬럼의 버퍼 매치를 찾고 해당 매치의 딜합과 버프력을 수집
  const pairs: Array<{ dealerSum: number; buffPower: number }> = [];
  for (let col = 0; col < peopleCount; col++) {
    for (let m = 0; m < matchesCount; m++) {
      if (matrix[m][col] === 'buffer') {
        const buff = orderedCards[col].buffers[0]?.stat ?? 0;
        if (buff > 0) {
          pairs.push({ dealerSum: dealerSums[m], buffPower: buff });
        }
        break;
      }
    }
  }

  if (pairs.length === 0) return 0;

  // Spearman 순위 상관계수 근사: 딜합 순위와 버프력 순위의 상관
  // 이상적으로는 -1 (완전 역매칭). 점수가 낮을수록 좋음
  const sortedByDealer = [...pairs].sort((a, b) => a.dealerSum - b.dealerSum);
  const sortedByBuff = [...pairs].sort((a, b) => a.buffPower - b.buffPower);

  let rankDiffSum = 0;
  for (const pair of pairs) {
    const dealerRank = sortedByDealer.indexOf(pair);
    const buffRank = sortedByBuff.indexOf(pair);
    rankDiffSum += (dealerRank - buffRank) ** 2;
  }

  // rankDiffSum이 클수록 역매칭(음의 상관)이 좋음
  // combinedScore를 최소화하므로 부호 반전: 역매칭이 좋을수록 낮은 값
  return -rankDiffSum;
}

/**
 * 통합 점수: 딜 편차(1순위) + 버프 역매칭(2순위)
 * 딜 편차를 정규화하여 가중치 적용
 */
function combinedScore(dealerStdDev: number, bufferInverse: number): number {
  return dealerStdDev * 1000 + bufferInverse;
}

/**
 * 파티 로테이션 최적 배치
 *
 * 알고리즘:
 * - 4인(24 순열): 전수 탐색
 * - 12인(12! 순열): 랜덤 리스타트 300회 + 인접 스왑 탐색
 * 각 컬럼 순서에 대해 딜러 순열 최적화 후 통합 점수(딜 편차 + 버프 역매칭) 계산
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

  let bestCards: PartyCard[] = paddedCards;
  let bestDealerOrder: number[][] = paddedCards.map((c) => c.dealers.map((_, i) => i));
  let bestScore = Infinity;

  function evaluateOrder(orderedCards: PartyCard[]): {
    dealerOrder: number[][];
    dealerSums: number[];
    score: number;
  } {
    const { dealerOrder, dealerSums } = optimizeDealerPermutations(matrix, orderedCards, peopleCount, matchesCount);
    const dStdDev = stddev(dealerSums);
    const bInverse = bufferInverseScore(matrix, orderedCards, dealerSums, peopleCount, matchesCount);
    return { dealerOrder, dealerSums, score: combinedScore(dStdDev, bInverse) };
  }

  if (peopleCount <= 4) {
    // 4인: 전수 탐색 (최대 24 순열)
    const indices = Array.from({ length: peopleCount }, (_, i) => i);
    for (const perm of permutations(indices)) {
      const reordered = perm.map((i) => paddedCards[i]);
      const result = evaluateOrder(reordered);
      if (result.score < bestScore) {
        bestScore = result.score;
        bestCards = reordered;
        bestDealerOrder = result.dealerOrder;
      }
    }
  } else {
    // 12인: 랜덤 리스타트 + 인접 스왑 개선
    const RANDOM_STARTS = 300;

    for (let start = 0; start < RANDOM_STARTS; start++) {
      let currentCards = start === 0 ? [...paddedCards] : shuffleArray(paddedCards);
      let currentResult = evaluateOrder(currentCards);

      // 인접 스왑으로 국소 개선
      let swapImproved = true;
      while (swapImproved) {
        swapImproved = false;
        for (let i = 0; i < peopleCount; i++) {
          for (let j = i + 1; j < peopleCount; j++) {
            const swapped = [...currentCards];
            [swapped[i], swapped[j]] = [swapped[j], swapped[i]];
            const swapResult = evaluateOrder(swapped);
            if (swapResult.score < currentResult.score - 1e-9) {
              currentCards = swapped;
              currentResult = swapResult;
              swapImproved = true;
            }
          }
        }
      }

      if (currentResult.score < bestScore) {
        bestScore = currentResult.score;
        bestCards = currentCards;
        bestDealerOrder = currentResult.dealerOrder;
      }
    }
  }

  // 최종 매치 배치 생성
  const colRoleMatches = buildColRoleMatches(matrix, peopleCount, matchesCount);
  const matches: MatchSlot[][] = [];
  for (let m = 0; m < matchesCount; m++) {
    const slots: MatchSlot[] = [];
    for (let col = 0; col < peopleCount; col++) {
      const role = matrix[m][col];
      let character: PartyCardCharacter | null = null;

      if (role === 'buffer') {
        character = bestCards[col].buffers[0] ?? null;
      } else if (role === 'dealer') {
        const dealerMatches = colRoleMatches[col].dealer;
        const idx = dealerMatches.indexOf(m);
        if (idx >= 0) {
          const dealerIdx = bestDealerOrder[col][idx];
          character = bestCards[col].dealers[dealerIdx] ?? null;
        }
      } else if (role === 'secondaryBuffer') {
        const sbMatches = colRoleMatches[col].secondaryBuffer;
        const idx = sbMatches.indexOf(m);
        if (idx >= 0) {
          character = bestCards[col].secondaryBuffers[idx] ?? null;
        }
      } else {
        character = null;
      }

      slots.push({ role, ownerName: bestCards[col].ownerName, character });
    }
    matches.push(slots);
  }

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
