import { describe, it, expect } from 'vitest';
import { isBufferJob, toCharacterEntity, getCharacterImageUrl } from '../character';
import { API_CONFIG } from '@/config/constants';

describe('isBufferJob', () => {
  it('버퍼 직업군을 올바르게 판별한다', () => {
    expect(isBufferJob('眞 크루세이더')).toBe(true);
    expect(isBufferJob('眞 인챈트리스')).toBe(true);
    expect(isBufferJob('眞 뮤즈')).toBe(true);
    expect(isBufferJob('眞 패러메딕')).toBe(true);
  });

  it('딜러 직업군은 false를 반환한다', () => {
    expect(isBufferJob('소드마스터')).toBe(false);
    expect(isBufferJob('런처(남)')).toBe(false);
    expect(isBufferJob('엘레멘탈마스터')).toBe(false);
    expect(isBufferJob('')).toBe(false);
  });

  it('眞 접두사 없는 버퍼 이름은 false를 반환한다', () => {
    expect(isBufferJob('크루세이더')).toBe(false);
    expect(isBufferJob('인챈트리스')).toBe(false);
    expect(isBufferJob('뮤즈')).toBe(false);
  });
});

describe('toCharacterEntity', () => {
  const mockInfo = {
    characterId: 'char123',
    characterName: '테스트캐릭터',
    level: 110,
    jobId: 'job1',
    jobGrowId: 'jobGrow1',
    jobName: '프리스트(남)',
    jobGrowName: '眞 크루세이더',
    adventureName: '테스트모험단',
  };

  it('DTO를 Character 엔티티로 변환한다', () => {
    const entity = toCharacterEntity(mockInfo, 'cain', 12345);

    expect(entity.serverId).toBe('cain');
    expect(entity.characterId).toBe('char123');
    expect(entity.characterName).toBe('테스트캐릭터');
    expect(entity.level).toBe(110);
    expect(entity.jobGrowName).toBe('眞 크루세이더');
    expect(entity.adventureName).toBe('테스트모험단');
    expect(entity.fame).toBe(12345);
  });

  it('fame 기본값은 0이다', () => {
    const entity = toCharacterEntity(mockInfo, 'cain');
    expect(entity.fame).toBe(0);
  });
});

describe('getCharacterImageUrl', () => {
  it('올바른 이미지 URL을 생성한다', () => {
    const url = getCharacterImageUrl('cain', 'char123');
    expect(url).toBe(`${API_CONFIG.CHARACTER_IMAGE_URL}/cain/characters/char123?zoom=1`);
  });

  it('zoom 파라미터를 반영한다', () => {
    const url = getCharacterImageUrl('cain', 'char123', 3);
    expect(url).toContain('zoom=3');
  });
});
