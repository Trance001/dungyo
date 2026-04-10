import { describe, it, expect } from 'vitest';
import { filterDealers, filterBuffers, characterKey, buildPartyComposition, buildMultipleParties } from '../party-builder';
import { getCurrentWeekKey } from '../weekly-clear';
import { RAID_TYPES } from '@/config/constants';

import type { Character } from '../character';
import type { WeeklyClearRecord } from '../weekly-clear';

function makeCharacter(overrides: Partial<Character> = {}): Character {
  return {
    serverId: 'cain',
    characterId: 'char1',
    characterName: '테스트',
    level: 110,
    jobId: 'j1',
    jobGrowId: 'jg1',
    jobName: '귀검사(남)',
    jobGrowName: '소드마스터',
    adventureName: '모험단',
    fame: 10000,
    ...overrides,
  };
}

describe('characterKey', () => {
  it('서버ID:캐릭터ID 형태의 키를 생성한다', () => {
    expect(characterKey({ serverId: 'cain', characterId: 'abc' })).toBe('cain:abc');
  });
});

describe('filterDealers', () => {
  it('딜러 직업만 최소 딜 이상으로 필터링한다', () => {
    const chars = [
      makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' }),
      makeCharacter({ characterId: 'd2', jobGrowName: '런처(남)' }),
      makeCharacter({ characterId: 'b1', jobGrowName: '眞 크루세이더' }),
    ];
    const damageMap = new Map([
      ['cain:d1', 500],
      ['cain:d2', 300],
      ['cain:b1', 400],
    ]);

    const result = filterDealers(chars, damageMap, 200, []);
    expect(result).toHaveLength(2);
    expect(result[0].characterId).toBe('d2');
    expect(result[1].characterId).toBe('d1');
  });

  it('버퍼 직업은 딜 수치가 있어도 제외한다', () => {
    const chars = [makeCharacter({ characterId: 'b1', jobGrowName: '眞 인챈트리스' })];
    const damageMap = new Map([['cain:b1', 999]]);

    const result = filterDealers(chars, damageMap, 0, []);
    expect(result).toHaveLength(0);
  });

  it('최소 딜 미만은 제외한다', () => {
    const chars = [makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' })];
    const damageMap = new Map([['cain:d1', 100]]);

    const result = filterDealers(chars, damageMap, 200, []);
    expect(result).toHaveLength(0);
  });

  it('클리어 완료 캐릭터는 제외한다', () => {
    const chars = [makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' })];
    const damageMap = new Map([['cain:d1', 500]]);
    const clears: WeeklyClearRecord[] = [{
      characterId: 'd1',
      serverId: 'cain',
      characterName: '테스트',
      clearedAt: new Date().toISOString(),
      weekKey: getCurrentWeekKey(),
    }];

    const result = filterDealers(chars, damageMap, 0, clears);
    expect(result).toHaveLength(0);
  });
});

describe('filterBuffers', () => {
  it('버퍼 직업만 최소 버프력 이상으로 필터링한다', () => {
    const chars = [
      makeCharacter({ characterId: 'b1', jobGrowName: '眞 크루세이더' }),
      makeCharacter({ characterId: 'b2', jobGrowName: '眞 뮤즈' }),
      makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' }),
    ];
    const buffMap = new Map([
      ['cain:b1', 50000],
      ['cain:b2', 40000],
      ['cain:d1', 60000],
    ]);

    const result = filterBuffers(chars, buffMap, 30000, []);
    expect(result).toHaveLength(2);
    expect(result[0].characterId).toBe('b2');
    expect(result[1].characterId).toBe('b1');
  });

  it('딜러 직업은 버프력이 있어도 제외한다', () => {
    const chars = [makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' })];
    const buffMap = new Map([['cain:d1', 99999]]);

    const result = filterBuffers(chars, buffMap, 0, []);
    expect(result).toHaveLength(0);
  });
});

describe('buildPartyComposition', () => {
  it('4인 일반 버퍼교환: 딜러 3 + 버퍼 1', () => {
    const chars = [
      makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' }),
      makeCharacter({ characterId: 'd2', jobGrowName: '런처(남)' }),
      makeCharacter({ characterId: 'd3', jobGrowName: '배틀메이지' }),
      makeCharacter({ characterId: 'b1', jobGrowName: '眞 크루세이더' }),
    ];
    const damageMap = new Map([
      ['cain:d1', 500], ['cain:d2', 400], ['cain:d3', 300],
    ]);
    const buffMap = new Map([['cain:b1', 50000]]);

    const result = buildPartyComposition(
      { raidType: RAID_TYPES.PARTY_4_NORMAL, minDealerDamage: 0, minPrimaryBuffPower: 0, minSecondaryBuffPower: 0 },
      chars, damageMap, buffMap, [],
    );

    expect(result.dealers).toHaveLength(3);
    expect(result.primaryBuffer).not.toBeNull();
    expect(result.carryCount).toBe(0);
    expect(result.isComplete).toBe(true);
  });

  it('4인 1업둥: 딜러 2 + 버퍼 1 + 업둥 1', () => {
    const chars = [
      makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' }),
      makeCharacter({ characterId: 'd2', jobGrowName: '런처(남)' }),
      makeCharacter({ characterId: 'b1', jobGrowName: '眞 인챈트리스' }),
      makeCharacter({ characterId: 'c1', jobGrowName: '엘레멘탈마스터' }),
    ];
    const damageMap = new Map([['cain:d1', 500], ['cain:d2', 400]]);
    const buffMap = new Map([['cain:b1', 50000]]);

    const result = buildPartyComposition(
      { raidType: RAID_TYPES.PARTY_4_1CARRY, minDealerDamage: 0, minPrimaryBuffPower: 0, minSecondaryBuffPower: 0 },
      chars, damageMap, buffMap, [],
    );

    expect(result.dealers).toHaveLength(2);
    expect(result.primaryBuffer).not.toBeNull();
    expect(result.carryCount).toBe(1);
    expect(result.isComplete).toBe(true);
  });

  it('부족한 슬롯이 있으면 isComplete=false', () => {
    const chars = [
      makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' }),
    ];
    const damageMap = new Map([['cain:d1', 500]]);

    const result = buildPartyComposition(
      { raidType: RAID_TYPES.PARTY_4_NORMAL, minDealerDamage: 0, minPrimaryBuffPower: 0, minSecondaryBuffPower: 0 },
      chars, damageMap, new Map(), [],
    );

    expect(result.isComplete).toBe(false);
    expect(result.missingSlots.length).toBeGreaterThan(0);
  });
});

describe('buildMultipleParties', () => {
  it('캐릭터가 충분하면 복수 파티를 구성한다', () => {
    const chars = [
      makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' }),
      makeCharacter({ characterId: 'd2', jobGrowName: '런처(남)' }),
      makeCharacter({ characterId: 'd3', jobGrowName: '배틀메이지' }),
      makeCharacter({ characterId: 'd4', jobGrowName: '엘레멘탈마스터' }),
      makeCharacter({ characterId: 'd5', jobGrowName: '스트라이커' }),
      makeCharacter({ characterId: 'd6', jobGrowName: '넨마스터' }),
      makeCharacter({ characterId: 'b1', jobGrowName: '眞 크루세이더' }),
      makeCharacter({ characterId: 'b2', jobGrowName: '眞 인챈트리스' }),
    ];
    const damageMap = new Map([
      ['cain:d1', 500], ['cain:d2', 400], ['cain:d3', 300],
      ['cain:d4', 250], ['cain:d5', 200], ['cain:d6', 150],
    ]);
    const buffMap = new Map([['cain:b1', 50000], ['cain:b2', 40000]]);

    const results = buildMultipleParties(
      { raidType: RAID_TYPES.PARTY_4_NORMAL, minDealerDamage: 0, minPrimaryBuffPower: 0, minSecondaryBuffPower: 0 },
      chars, damageMap, buffMap, [],
    );

    expect(results).toHaveLength(2);
    expect(results[0].isComplete).toBe(true);
    expect(results[1].isComplete).toBe(true);

    // 캐릭터 중복 없음 확인
    const allUsedIds = new Set<string>();
    for (const party of results) {
      for (const d of party.dealers) {
        expect(allUsedIds.has(characterKey(d))).toBe(false);
        allUsedIds.add(characterKey(d));
      }
      if (party.primaryBuffer) {
        expect(allUsedIds.has(characterKey(party.primaryBuffer))).toBe(false);
        allUsedIds.add(characterKey(party.primaryBuffer));
      }
    }
  });

  it('버퍼가 1명이면 1파티만 구성하고 불완전 파티를 표시한다', () => {
    const chars = [
      makeCharacter({ characterId: 'd1', jobGrowName: '소드마스터' }),
      makeCharacter({ characterId: 'd2', jobGrowName: '런처(남)' }),
      makeCharacter({ characterId: 'd3', jobGrowName: '배틀메이지' }),
      makeCharacter({ characterId: 'd4', jobGrowName: '엘레멘탈마스터' }),
      makeCharacter({ characterId: 'd5', jobGrowName: '스트라이커' }),
      makeCharacter({ characterId: 'd6', jobGrowName: '넨마스터' }),
      makeCharacter({ characterId: 'b1', jobGrowName: '眞 크루세이더' }),
    ];
    const damageMap = new Map([
      ['cain:d1', 500], ['cain:d2', 400], ['cain:d3', 300],
      ['cain:d4', 250], ['cain:d5', 200], ['cain:d6', 150],
    ]);
    const buffMap = new Map([['cain:b1', 50000]]);

    const results = buildMultipleParties(
      { raidType: RAID_TYPES.PARTY_4_NORMAL, minDealerDamage: 0, minPrimaryBuffPower: 0, minSecondaryBuffPower: 0 },
      chars, damageMap, buffMap, [],
    );

    expect(results).toHaveLength(2);
    expect(results[0].isComplete).toBe(true);
    expect(results[1].isComplete).toBe(false);
  });

  it('딜러도 버퍼도 없으면 빈 배열을 반환한다', () => {
    const results = buildMultipleParties(
      { raidType: RAID_TYPES.PARTY_4_NORMAL, minDealerDamage: 0, minPrimaryBuffPower: 0, minSecondaryBuffPower: 0 },
      [], new Map(), new Map(), [],
    );

    expect(results).toHaveLength(0);
  });
});

