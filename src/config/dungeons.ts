/** 상급던전 식별자 */
export type DungeonId = 'apostate_castle' | 'turtle_archive' | 'liberated_nightmare' | 'death_goddess';

/**
 * 던전 컷 (풀/직 모드)
 * 딜러는 damage(억) 단위, 버퍼는 buffPower(만, 소숫점 1자리) 단위.
 * 풀 = 모든 보스 클리어, 직 = 보스만 클리어.
 * 풀=직인 던전(예: 해방된 흉몽)은 동일 값을 둔다.
 */
export interface DungeonCut {
  full: number;
  direct: number;
}

/** 상급던전 정의 */
export interface DungeonDef {
  id: DungeonId;
  name: string;
  minFame: number;
  dealerCut: DungeonCut;
  bufferCut: DungeonCut;
}

/** 기본 던전 컷 (시간이 지나며 변동될 수 있어 사용자가 수정 가능) */
export const DEFAULT_DUNGEONS: Record<DungeonId, DungeonDef> = {
  apostate_castle: {
    id: 'apostate_castle',
    name: '배교자의 성',
    minFame: 101853,
    dealerCut: { full: 3000, direct: 5000 },
    bufferCut: { full: 9.5, direct: 10 },
  },
  turtle_archive: {
    id: 'turtle_archive',
    name: '별거북 대서고',
    minFame: 91582,
    dealerCut: { full: 2000, direct: 3000 },
    bufferCut: { full: 9, direct: 10 },
  },
  liberated_nightmare: {
    id: 'liberated_nightmare',
    name: '해방된 흉몽',
    minFame: 71179,
    dealerCut: { full: 400, direct: 400 },
    bufferCut: { full: 4.5, direct: 4.5 },
  },
  death_goddess: {
    id: 'death_goddess',
    name: '죽음의 여신전',
    minFame: 55950,
    dealerCut: { full: 100, direct: 100 },
    bufferCut: { full: 3.5, direct: 3.5 },
  },
};

/** 표시 순서 (높은 명성 → 낮은 명성) */
export const DUNGEON_ORDER: DungeonId[] = [
  'apostate_castle',
  'turtle_archive',
  'liberated_nightmare',
  'death_goddess',
];

/** 토벌권: 한 장으로 클리어 가능한 던전 묶음 */
export interface TicketDef {
  id: string;
  label: string;
  dungeonIds: DungeonId[];
}

export const SUBJUGATION_TICKETS: TicketDef[] = [
  {
    id: 'apostate_turtle',
    label: '배교자의 성 + 별거북 대서고 토벌권',
    dungeonIds: ['apostate_castle', 'turtle_archive'],
  },
  {
    id: 'turtle_nightmare',
    label: '별거북 대서고 + 해방된 흉몽 토벌권',
    dungeonIds: ['turtle_archive', 'liberated_nightmare'],
  },
  {
    id: 'nightmare_goddess',
    label: '해방된 흉몽 + 죽음의 여신전 토벌권',
    dungeonIds: ['liberated_nightmare', 'death_goddess'],
  },
];
