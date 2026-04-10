import { describe, it, expect } from 'vitest';
import { parseDundamText } from '../dundam-parser';

const SAMPLE_TEXT = `캐릭터 검색버프 랭킹딜러 랭킹


전체
캐릭터명

모험단
테스트모험단
검색 결과 입니다.

프레이
眞 레인저


260

32

149.2
제로디스턴스테스트모험단
110682
랭킹5474 억 9714 만

프레이
眞 크루세이더


260

33

126.0
버퍼캐릭터테스트모험단
95030
버프점수8,208,756

프레이
眞 인챈트리스


260

0

106.3
숙명의크리스테스트모험단
79359
2인5,282,841
3인4,866,078
4인4,727,157

프레이
眞 넨마스터


260

33

115.9
테스트넨마테스트모험단
108425
랭킹4084 억 1822 만

개인정보 처리방침Copyright© DUNDAM All rights reserved.`;

describe('parseDundamText', () => {
  it('모험단명을 올바르게 추출한다', () => {
    const result = parseDundamText(SAMPLE_TEXT);
    expect(result.adventureName).toBe('테스트모험단');
  });

  it('서버ID를 올바르게 매핑한다', () => {
    const result = parseDundamText(SAMPLE_TEXT);
    expect(result.serverId).toBe('prey');
  });

  it('모든 캐릭터를 파싱한다', () => {
    const result = parseDundamText(SAMPLE_TEXT);
    expect(result.characters).toHaveLength(4);
  });

  it('딜러의 캐릭터명과 딜 수치를 파싱한다', () => {
    const result = parseDundamText(SAMPLE_TEXT);
    const ranger = result.characters.find((c) => c.characterName === '제로디스턴스');
    expect(ranger).toBeDefined();
    expect(ranger!.jobGrowName).toBe('眞 레인저');
    expect(ranger!.damage).toBe(5474);
    expect(ranger!.buffPower).toBeNull();
  });

  it('버퍼의 버프점수를 파싱한다', () => {
    const result = parseDundamText(SAMPLE_TEXT);
    const crusader = result.characters.find((c) => c.characterName === '버퍼캐릭터');
    expect(crusader).toBeDefined();
    expect(crusader!.jobGrowName).toBe('眞 크루세이더');
    expect(crusader!.buffPower).toBe(8208756);
    expect(crusader!.damage).toBeNull();
  });

  it('4인 버프점수를 파싱한다', () => {
    const result = parseDundamText(SAMPLE_TEXT);
    const enchantress = result.characters.find((c) => c.characterName === '숙명의크리스');
    expect(enchantress).toBeDefined();
    expect(enchantress!.buffPower).toBe(4727157);
  });

  it('조 단위 딜 수치를 파싱한다', () => {
    const textWithJo = SAMPLE_TEXT.replace(
      '랭킹5474 억 9714 만',
      '랭킹3 조 5024 억',
    );
    const result = parseDundamText(textWithJo);
    const ranger = result.characters.find((c) => c.characterName === '제로디스턴스');
    expect(ranger).toBeDefined();
    expect(ranger!.damage).toBe(35024); // 3 * 10000 + 5024
  });

  it('빈 텍스트에서는 빈 결과를 반환한다', () => {
    const result = parseDundamText('');
    expect(result.adventureName).toBeNull();
    expect(result.characters).toHaveLength(0);
  });

  it('모험단명이 없는 텍스트에서는 빈 결과를 반환한다', () => {
    const result = parseDundamText('아무 관련 없는 텍스트');
    expect(result.adventureName).toBeNull();
    expect(result.characters).toHaveLength(0);
  });
});
