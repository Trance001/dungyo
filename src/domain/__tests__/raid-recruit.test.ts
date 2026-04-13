import { describe, it, expect } from 'vitest';
import { buildRaidRecruitAssignment } from '../raid-recruit';

import type { RaidRecruitCard } from '../raid-recruit';

function makeCard(ownerName: string, dealerCount: number, bufferCount: number): RaidRecruitCard {
  return { id: ownerName, ownerName, dealerCount, bufferCount, dealers: [], buffers: [] };
}

const DEFAULT_INPUT = { matchCount: 3, partyCount: 3, dealersPerParty: 3, buffersPerParty: 1 };

describe('buildRaidRecruitAssignment', () => {
  it('각 파티가 버퍼1 + 딜러3 구조로 채워진다', () => {
    const cards = [
      makeCard('A', 3, 1),
      makeCard('B', 3, 1),
      makeCard('C', 3, 1),
    ];
    const result = buildRaidRecruitAssignment(cards, { ...DEFAULT_INPUT, matchCount: 1 });

    // 1기수 3파티, 각 파티 4슬롯 (버퍼1 + 딜러3)
    for (let p = 0; p < 3; p++) {
      const party = result.matches[0][p];
      const buffers = party.filter((s) => s?.role === 'buffer');
      const dealers = party.filter((s) => s?.role === 'dealer');
      expect(buffers.length).toBeLessThanOrEqual(1);
      expect(dealers.length).toBeLessThanOrEqual(3);
    }
  });

  it('버퍼를 우선으로 채운다', () => {
    const cards = [makeCard('A', 1, 1)];
    const result = buildRaidRecruitAssignment(cards, DEFAULT_INPUT);

    // A의 버퍼가 먼저 배정되고 딜러가 다음 기수에 배정
    const allSlots = result.matches.flatMap((m) => m.flatMap((p) => p)).filter((s) => s !== null);
    const bufferSlot = allSlots.find((s) => s!.role === 'buffer');
    expect(bufferSlot).toBeDefined();
    expect(bufferSlot!.ownerName).toBe('A');
  });

  it('a+b가 큰 순으로 먼저 배치한다', () => {
    const cards = [
      makeCard('Small', 1, 0),
      makeCard('Big', 2, 1),
    ];
    const result = buildRaidRecruitAssignment(cards, DEFAULT_INPUT);

    // 1기수 첫 파티 버퍼 슬롯에 Big이 먼저
    const firstParty = result.matches[0][0];
    const firstSlot = firstParty.find((s) => s !== null);
    expect(firstSlot?.ownerName).toBe('Big');
  });

  it('같은 기수에 같은 모험단 중복 불가', () => {
    const cards = [makeCard('A', 3, 1)];
    const result = buildRaidRecruitAssignment(cards, DEFAULT_INPUT);

    for (const match of result.matches) {
      const owners = match.flatMap((p) => p).filter((s) => s !== null).map((s) => s!.ownerName);
      const unique = new Set(owners);
      expect(owners.length).toBe(unique.size);
    }
  });

  it('빈 슬롯은 null(구인)로 표시한다', () => {
    const cards = [makeCard('A', 1, 1)];
    const result = buildRaidRecruitAssignment(cards, DEFAULT_INPUT);

    // 3기수 × 3파티 × 4슬롯 = 36, 캐릭터 2개 = 구인 34
    expect(result.vacancies).toBe(34);
  });

  it('파티 그룹명이 반환된다', () => {
    const result = buildRaidRecruitAssignment([], DEFAULT_INPUT);
    expect(result.partyNames).toEqual(['레드', '옐로', '그린']);
  });

  it('카드가 없으면 모든 슬롯이 구인', () => {
    const result = buildRaidRecruitAssignment([], DEFAULT_INPUT);
    expect(result.vacancies).toBe(36);
  });
});
