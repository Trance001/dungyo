import { API_CONFIG, BUFFER_JOB_GROW_NAMES } from '@/config/constants';

import type { DnfServerId } from '@/config/constants';

/** 캐릭터 역할 */
export type CharacterRole = 'dealer' | 'buffer' | 'carry';

/** 캐릭터 엔티티 (앱 내부 사용) */
export interface Character {
  serverId: DnfServerId;
  characterId: string;
  characterName: string;
  level: number;
  jobId: string;
  jobGrowId: string;
  jobName: string;
  jobGrowName: string;
  adventureName: string;
  fame: number;
}

/** 딜러 캐릭터 (딜 수치 포함) */
export interface DealerCharacter extends Character {
  role: 'dealer';
  damage: number;
}

/** 버퍼 캐릭터 (버프력 포함) */
export interface BufferCharacter extends Character {
  role: 'buffer';
  buffPower: number;
}

/** 업둥 캐릭터 (쩔 받을 캐릭터) */
export interface CarryCharacter extends Character {
  role: 'carry';
}

/** 역할이 할당된 캐릭터 유니온 */
export type RoledCharacter = DealerCharacter | BufferCharacter | CarryCharacter;

/** 버퍼 직업군 여부 판별 (이름 기반) */
export function isBufferJob(jobGrowName: string): boolean {
  return (BUFFER_JOB_GROW_NAMES as ReadonlyArray<string>).includes(jobGrowName);
}

/**
 * 캐릭터의 실제 역할 판별
 * 오버라이드가 있으면 우선 적용, 없으면 이름 기반 분류로 폴백
 */
export function getEffectiveRole(
  character: { jobGrowName: string; serverId: string; characterId: string },
  roleOverrideMap: Map<string, 'dealer' | 'buffer'>,
): 'dealer' | 'buffer' {
  const key = `${character.serverId}:${character.characterId}`;
  const override = roleOverrideMap.get(key);
  if (override) return override;
  return isBufferJob(character.jobGrowName) ? 'buffer' : 'dealer';
}

/** NeopleCharacterInfoResponse → Character 엔티티 변환 */
export function toCharacterEntity(
  info: { characterId: string; characterName: string; level: number; jobId: string; jobGrowId: string; jobName: string; jobGrowName: string; adventureName: string },
  serverId: DnfServerId,
  fame: number = 0,
): Character {
  return {
    serverId,
    characterId: info.characterId,
    characterName: info.characterName,
    level: info.level,
    jobId: info.jobId,
    jobGrowId: info.jobGrowId,
    jobName: info.jobName,
    jobGrowName: info.jobGrowName,
    adventureName: info.adventureName,
    fame,
  };
}

/** characterId가 API에서 조회된 유효한 값인지 확인 */
export function hasValidCharacterId(character: { characterId: string }): boolean {
  return character.characterId.length > 0;
}

/** 던담 모험단 검색 URL 생성 */
export function getDundamAdventureUrl(adventureName: string): string {
  return `${API_CONFIG.DUNDAM_SEARCH_URL}?server=adven&name=${encodeURIComponent(adventureName)}`;
}

/** 던담 캐릭터 상세 URL 생성 */
export function getDundamCharacterUrl(serverId: string, characterId: string): string {
  return `${API_CONFIG.DUNDAM_CHARACTER_URL}?server=${serverId}&key=${characterId}`;
}

/** 캐릭터 이미지 URL 생성 */
export function getCharacterImageUrl(
  serverId: string,
  characterId: string,
  zoom: 1 | 2 | 3 = 1,
): string {
  return `${API_CONFIG.CHARACTER_IMAGE_URL}/${serverId}/characters/${characterId}?zoom=${zoom}`;
}
