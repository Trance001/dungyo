import { describe, it, expect } from 'vitest';
import { getCurrentWeekKey, isAlreadyCleared } from '../weekly-clear';

import type { WeeklyClearRecord } from '../weekly-clear';

describe('getCurrentWeekKey', () => {
  it('YYYY-Wxx 형식의 문자열을 반환한다', () => {
    const key = getCurrentWeekKey();
    expect(key).toMatch(/^\d{4}-W\d{2}$/);
  });

  it('동일 시점에 호출하면 같은 값을 반환한다', () => {
    const key1 = getCurrentWeekKey();
    const key2 = getCurrentWeekKey();
    expect(key1).toBe(key2);
  });
});

describe('isAlreadyCleared', () => {
  const currentWeek = getCurrentWeekKey();

  it('현재 주차에 클리어 기록이 있으면 true를 반환한다', () => {
    const records: WeeklyClearRecord[] = [{
      characterId: 'char1',
      serverId: 'cain',
      characterName: '테스트',
      clearedAt: new Date().toISOString(),
      weekKey: currentWeek,
    }];

    expect(isAlreadyCleared(records, 'char1', 'cain')).toBe(true);
  });

  it('다른 주차의 클리어 기록은 무시한다', () => {
    const records: WeeklyClearRecord[] = [{
      characterId: 'char1',
      serverId: 'cain',
      characterName: '테스트',
      clearedAt: new Date().toISOString(),
      weekKey: '2020-W01',
    }];

    expect(isAlreadyCleared(records, 'char1', 'cain')).toBe(false);
  });

  it('다른 캐릭터의 클리어 기록은 무시한다', () => {
    const records: WeeklyClearRecord[] = [{
      characterId: 'char2',
      serverId: 'cain',
      characterName: '다른캐릭',
      clearedAt: new Date().toISOString(),
      weekKey: currentWeek,
    }];

    expect(isAlreadyCleared(records, 'char1', 'cain')).toBe(false);
  });

  it('다른 서버의 클리어 기록은 무시한다', () => {
    const records: WeeklyClearRecord[] = [{
      characterId: 'char1',
      serverId: 'diregie',
      characterName: '테스트',
      clearedAt: new Date().toISOString(),
      weekKey: currentWeek,
    }];

    expect(isAlreadyCleared(records, 'char1', 'cain')).toBe(false);
  });

  it('빈 기록은 false를 반환한다', () => {
    expect(isAlreadyCleared([], 'char1', 'cain')).toBe(false);
  });
});
