import { describe, it, expect } from 'vitest';
import { buildRaidRecruitAssignment } from '../raid-recruit';

import type { RaidRecruitCard } from '../raid-recruit';

function makeCard(ownerName: string, dealerCount: number, bufferCount: number): RaidRecruitCard {
  return { id: ownerName, ownerName, dealerCount, bufferCount };
}

describe('buildRaidRecruitAssignment', () => {
  it('버퍼를 우선으로 채운다', () => {
    const cards = [makeCard('A', 1, 1)];
    const result = buildRaidRecruitAssignment(cards, { matchCount: 2, slotsPerMatch: 12 });

    const roles = result.matches.map((m) =>
      m.filter((s) => s !== null).map((s) => s!.role),
    );
    // 1기에 버퍼, 2기에 딜러
    expect(roles[0]).toContain('buffer');
    expect(roles[1]).toContain('dealer');
  });

  it('a+b가 큰 순으로 먼저 배치한다', () => {
    const cards = [
      makeCard('Small', 1, 0),
      makeCard('Big', 2, 1),
    ];
    const result = buildRaidRecruitAssignment(cards, { matchCount: 3, slotsPerMatch: 12 });

    // Big(3)이 먼저 배치되므로 1기에 Big 버퍼가 있어야 함
    const firstMatch = result.matches[0].filter((s) => s !== null);
    expect(firstMatch[0]?.ownerName).toBe('Big');
  });

  it('같은 기수에 같은 모험단 중복 불가', () => {
    const cards = [makeCard('A', 2, 1)];
    const result = buildRaidRecruitAssignment(cards, { matchCount: 3, slotsPerMatch: 12 });

    for (const match of result.matches) {
      const owners = match.filter((s) => s !== null).map((s) => s!.ownerName);
      const unique = new Set(owners);
      expect(owners.length).toBe(unique.size);
    }
  });

  it('빈 슬롯은 null로 표시하고 구인 수를 계산한다', () => {
    const cards = [makeCard('A', 1, 1)];
    const result = buildRaidRecruitAssignment(cards, { matchCount: 2, slotsPerMatch: 4 });

    // 2기수 × 4슬롯 = 8, 캐릭터 2개 = 구인 6
    expect(result.vacancies).toBe(6);
  });

  it('12인 3기수 편성', () => {
    const cards = [
      makeCard('A', 2, 1),
      makeCard('B', 2, 1),
      makeCard('C', 1, 1),
      makeCard('D', 1, 1),
    ];
    const result = buildRaidRecruitAssignment(cards, { matchCount: 3, slotsPerMatch: 12 });

    // 총 캐릭터: A=3, B=3, C=2, D=2 = 10
    // 3기수 × 12슬롯 = 36, 구인 = 26
    expect(result.vacancies).toBe(26);

    // 중복 검증
    for (const match of result.matches) {
      const owners = match.filter((s) => s !== null).map((s) => s!.ownerName);
      expect(owners.length).toBe(new Set(owners).size);
    }
  });

  it('카드가 없으면 모든 슬롯이 구인', () => {
    const result = buildRaidRecruitAssignment([], { matchCount: 2, slotsPerMatch: 4 });
    expect(result.vacancies).toBe(8);
    expect(result.matches[0].every((s) => s === null)).toBe(true);
  });
});
