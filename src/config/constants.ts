/** 네오플 API 서버 ID 매핑 */
export const DNF_SERVERS = [
  { id: 'cain', name: '카인' },
  { id: 'diregie', name: '디레지에' },
  { id: 'siroco', name: '시로코' },
  { id: 'prey', name: '프레이' },
  { id: 'casillas', name: '카시야스' },
  { id: 'hilder', name: '힐더' },
  { id: 'anton', name: '안톤' },
  { id: 'bakal', name: '바칼' },
] as const;

export type DnfServerId = (typeof DNF_SERVERS)[number]['id'];

/** API 기본 설정 */
export const API_CONFIG = {
  /** Cloudflare Workers 프록시 URL (배포 시 실제 URL로 교체) */
  PROXY_BASE_URL: import.meta.env.VITE_API_PROXY_URL ?? 'http://localhost:8787',
  /** 네오플 API 직접 호출용 (개발 전용) */
  NEOPLE_BASE_URL: 'https://api.neople.co.kr',
  /** 캐릭터 이미지 URL */
  CHARACTER_IMAGE_URL: 'https://img-api.neople.co.kr/df/servers',
  /** 던담 스펙 검색 URL */
  DUNDAM_SEARCH_URL: 'https://dundam.xyz/search',
  /** 던담 캐릭터 상세 URL */
  DUNDAM_CHARACTER_URL: 'https://dundam.xyz/character',
} as const;

/** 레이드/파티 유형 */
export const RAID_TYPES = {
  /** 4인 던전 - 일반 버퍼교환 */
  PARTY_4_NORMAL: 'party_4_normal',
  /** 4인 던전 - 1업둥 */
  PARTY_4_1CARRY: 'party_4_1carry',
  /** 4인 던전 - 2업둥 */
  PARTY_4_2CARRY: 'party_4_2carry',
  /** 나벨 레이드 12인 - 8업둥 */
  RAID_NABEL_8CARRY: 'raid_nabel_8carry',
  /** 디레지에 레이드 12인 - 10업둥 */
  RAID_DIREGIE_10CARRY: 'raid_diregie_10carry',
} as const;

export type RaidType = (typeof RAID_TYPES)[keyof typeof RAID_TYPES];

/** 레이드 유형별 메타데이터 */
export const RAID_TYPE_META: Record<
  RaidType,
  {
    label: string;
    totalSlots: number;
    dealerSlots: number;
    primaryBufferSlots: number;
    secondaryBufferSlots: number;
    carrySlots: number;
    description: string;
  }
> = {
  [RAID_TYPES.PARTY_4_NORMAL]: {
    label: '4인 일반 버퍼교환',
    totalSlots: 4,
    dealerSlots: 3,
    primaryBufferSlots: 1,
    secondaryBufferSlots: 0,
    carrySlots: 0,
    description: '딜러 3 + 버퍼 1',
  },
  [RAID_TYPES.PARTY_4_1CARRY]: {
    label: '4인 1업둥',
    totalSlots: 4,
    dealerSlots: 2,
    primaryBufferSlots: 1,
    secondaryBufferSlots: 0,
    carrySlots: 1,
    description: '딜러 2 + 버퍼 1 + 업둥 1',
  },
  [RAID_TYPES.PARTY_4_2CARRY]: {
    label: '4인 2업둥',
    totalSlots: 4,
    dealerSlots: 1,
    primaryBufferSlots: 1,
    secondaryBufferSlots: 0,
    carrySlots: 2,
    description: '딜러 1 + 버퍼 1 + 업둥 2',
  },
  [RAID_TYPES.RAID_NABEL_8CARRY]: {
    label: '나벨 8업둥',
    totalSlots: 12,
    dealerSlots: 3,
    primaryBufferSlots: 1,
    secondaryBufferSlots: 1,
    carrySlots: 7,
    description: '딜러 3 + 주버퍼 1 + 부버퍼 1 + 업둥 7',
  },
  [RAID_TYPES.RAID_DIREGIE_10CARRY]: {
    label: '디레지에 10업둥',
    totalSlots: 12,
    dealerSlots: 1,
    primaryBufferSlots: 1,
    secondaryBufferSlots: 0,
    carrySlots: 10,
    description: '딜러 1 + 버퍼 1 + 업둥 10',
  },
};

/** 주간 초기화 기준 (매주 목요일 06:00 KST) */
export const WEEKLY_RESET = {
  DAY_OF_WEEK: 4, // Thursday
  HOUR_KST: 6,
} as const;

/** 검색 모드 */
export const SEARCH_MODES = {
  CHARACTER_NAME: 'character_name',
  ADVENTURE_NAME: 'adventure_name',
} as const;

export type SearchMode = (typeof SEARCH_MODES)[keyof typeof SEARCH_MODES];

/** 캐릭터 검색 관련 설정 */
export const SEARCH_CONFIG = {
  /** 캐릭터명 검색 시 상세 조회할 최대 결과 수 */
  MAX_DETAIL_FETCH: 10,
  /** 모험단 검색 시 캐릭터 검색 limit */
  ADVENTURE_SEARCH_LIMIT: 200,
  /** API 병렬 요청 동시 실행 제한 */
  CONCURRENT_REQUEST_LIMIT: 5,
} as const;

/** 기본 서버 ID */
export const DEFAULT_SERVER_ID: DnfServerId = 'cain';

/** 버퍼 직업군 (jobGrowName 기준) */
export const BUFFER_JOB_GROW_NAMES = [
  '眞 크루세이더',
  '眞 인챈트리스',
  '眞 뮤즈',
  '眞 패러메딕',
] as const;

/** localStorage 키 접두사 */
export const STORAGE_KEYS = {
  WEEKLY_CLEARS: 'dnf_gyo_weekly_clears',
  API_SETTINGS: 'dnf_gyo_api_settings',
  ADVENTURE_CACHE: 'dnf_gyo_adventure_cache',
} as const;
