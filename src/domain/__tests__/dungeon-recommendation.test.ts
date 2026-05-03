import { describe, it, expect } from 'vitest';

import {
  classifyCharacterForDungeon,
  recommendTicketCandidates,
} from '../dungeon-recommendation';
import { DEFAULT_DUNGEONS, SUBJUGATION_TICKETS } from '@/config/dungeons';

import type { Character } from '../character';

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
    fame: 100000,
    ...overrides,
  };
}

const apostate = DEFAULT_DUNGEONS.apostate_castle; // fame 101853, dealerCut full3000 direct5000
const nightmare = DEFAULT_DUNGEONS.liberated_nightmare; // fame 71179, full=direct

const apostateTurtleTicket = SUBJUGATION_TICKETS.find((t) => t.id === 'apostate_turtle')!;
const turtleNightmareTicket = SUBJUGATION_TICKETS.find((t) => t.id === 'turtle_nightmare')!;

describe('classifyCharacterForDungeon', () => {
  it('명성 미달이면 cant_enter', () => {
    const c = makeCharacter({ fame: 50000 });
    expect(classifyCharacterForDungeon(c, 'dealer', 10000, apostate)).toBe('cant_enter');
  });

  it('수치 미입력이면 no_stat', () => {
    const c = makeCharacter({ fame: 200000 });
    expect(classifyCharacterForDungeon(c, 'dealer', undefined, apostate)).toBe('no_stat');
    expect(classifyCharacterForDungeon(c, 'dealer', 0, apostate)).toBe('no_stat');
  });

  it('풀컷 미달이면 subjugation', () => {
    const c = makeCharacter({ fame: 200000 });
    expect(classifyCharacterForDungeon(c, 'dealer', 2999, apostate)).toBe('subjugation');
  });

  it('풀컷 충족·직컷 미달이면 full_only', () => {
    const c = makeCharacter({ fame: 200000 });
    expect(classifyCharacterForDungeon(c, 'dealer', 3000, apostate)).toBe('full_only');
    expect(classifyCharacterForDungeon(c, 'dealer', 4999, apostate)).toBe('full_only');
  });

  it('직컷 이상이면 full_and_direct', () => {
    const c = makeCharacter({ fame: 200000 });
    expect(classifyCharacterForDungeon(c, 'dealer', 5000, apostate)).toBe('full_and_direct');
  });

  it('버퍼 컷 비교 (소수점)', () => {
    const c = makeCharacter({ fame: 200000, jobGrowName: '眞 크루세이더' });
    expect(classifyCharacterForDungeon(c, 'buffer', 9.4, apostate)).toBe('subjugation');
    expect(classifyCharacterForDungeon(c, 'buffer', 9.5, apostate)).toBe('full_only');
    expect(classifyCharacterForDungeon(c, 'buffer', 10, apostate)).toBe('full_and_direct');
  });

  it('풀=직 던전 경계값', () => {
    const c = makeCharacter({ fame: 200000 });
    expect(classifyCharacterForDungeon(c, 'dealer', 399, nightmare)).toBe('subjugation');
    expect(classifyCharacterForDungeon(c, 'dealer', 400, nightmare)).toBe('full_and_direct');
  });
});

describe('recommendTicketCandidates', () => {
  it('묶인 던전 중 하나라도 명성 미달이면 제외', () => {
    // 별거북 fame 91582, 배교자 fame 101853
    const chars: Character[] = [
      // 별거북 입장 가능, 배교자 입장 불가 → apostate_turtle 토벌권에서 제외
      makeCharacter({ characterId: 'mid_fame', fame: 95000 }),
    ];
    const damageMap = new Map([['cain:mid_fame', 1500]]);
    const result = recommendTicketCandidates(chars, damageMap, new Map(), new Map(), DEFAULT_DUNGEONS, apostateTurtleTicket);
    expect(result).toHaveLength(0);
  });

  it('모든 던전 입장 가능 + 최소 한 던전 cut 미달이면 추천', () => {
    // 두 던전 모두 입장 가능, 별거북 cut 미달, 배교자 cut 미달
    const chars: Character[] = [
      makeCharacter({ characterId: 'low_dmg', fame: 200000 }),
    ];
    const damageMap = new Map([['cain:low_dmg', 1500]]);
    const result = recommendTicketCandidates(chars, damageMap, new Map(), new Map(), DEFAULT_DUNGEONS, apostateTurtleTicket);
    expect(result).toHaveLength(1);
    expect(result[0].subjugationCount).toBe(2);
  });

  it('모든 던전 cut 통과면 토벌권 불필요로 제외', () => {
    const chars: Character[] = [
      makeCharacter({ characterId: 'top', fame: 200000 }),
    ];
    const damageMap = new Map([['cain:top', 9000]]);
    const result = recommendTicketCandidates(chars, damageMap, new Map(), new Map(), DEFAULT_DUNGEONS, apostateTurtleTicket);
    expect(result).toHaveLength(0);
  });

  it('한 던전만 cut 미달이어도 추천에 포함 (입장은 모두 가능)', () => {
    // 배교 cut 미달, 별거 cut 통과
    const chars: Character[] = [
      makeCharacter({ characterId: 'between', fame: 200000 }),
    ];
    const damageMap = new Map([['cain:between', 2500]]); // 배교 풀3000 미달, 별거 풀2000 통과
    const result = recommendTicketCandidates(chars, damageMap, new Map(), new Map(), DEFAULT_DUNGEONS, apostateTurtleTicket);
    expect(result).toHaveLength(1);
    expect(result[0].subjugationCount).toBe(1);
  });

  it('subjugation 던전 수 많은 순으로 정렬', () => {
    const chars: Character[] = [
      makeCharacter({ characterId: 'one_sub', fame: 200000 }),
      makeCharacter({ characterId: 'two_sub', fame: 200000 }),
    ];
    const damageMap = new Map([
      ['cain:one_sub', 2500], // 배교만 미달
      ['cain:two_sub', 1500], // 둘 다 미달
    ]);
    const result = recommendTicketCandidates(chars, damageMap, new Map(), new Map(), DEFAULT_DUNGEONS, apostateTurtleTicket);
    expect(result.map((r) => r.character.characterId)).toEqual(['two_sub', 'one_sub']);
  });

  it('같은 subjugation 수면 stat 낮은 순(절실한 순)으로 정렬', () => {
    const chars: Character[] = [
      makeCharacter({ characterId: 'mid', fame: 200000 }),
      makeCharacter({ characterId: 'low', fame: 200000 }),
    ];
    const damageMap = new Map([['cain:mid', 1900], ['cain:low', 500]]);
    const result = recommendTicketCandidates(chars, damageMap, new Map(), new Map(), DEFAULT_DUNGEONS, apostateTurtleTicket);
    // 둘 다 배교/별거 모두 cut 미달 → subjugationCount 동률, stat 낮은 'low' 먼저
    expect(result.map((r) => r.character.characterId)).toEqual(['low', 'mid']);
  });

  it('명성 71179 미만이면 별거+흉몽 토벌권에서도 제외', () => {
    const chars: Character[] = [
      makeCharacter({ characterId: 'too_low', fame: 50000 }),
    ];
    const damageMap = new Map([['cain:too_low', 100]]);
    const result = recommendTicketCandidates(chars, damageMap, new Map(), new Map(), DEFAULT_DUNGEONS, turtleNightmareTicket);
    expect(result).toHaveLength(0);
  });
});
