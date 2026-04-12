/** 로테이션 슬롯 역할 */
export type RotationRole = 'buffer' | 'dealer' | 'secondaryBuffer' | 'carry';

/** 로테이션 템플릿 ID */
export type RotationTemplateId = 'party4_normal' | 'party4_1carry' | 'party4_2carry' | 'raid12_8carry';

/** 로테이션 템플릿 정의 */
export interface RotationTemplate {
  id: RotationTemplateId;
  label: string;
  description: string;
  /** 한 판에 필요한 사람 수 = 한 판의 슬롯 수 */
  peopleCount: number;
  /** 총 판 수 */
  matchesCount: number;
  /** 역할별 한 사람당 필요 캐릭터 수 */
  slotsPerPerson: {
    buffer: number;
    dealer: number;
    secondaryBuffer: number;
    carry: number;
  };
  /**
   * 로테이션 매트릭스
   * matrix[matchIndex][personIndex] = 해당 판에서 그 사람이 맡을 역할
   * (행 = 판, 열 = 사람 = 고정 위치)
   */
  matrix: RotationRole[][];
}

/** 파티 카드 - 한 사람이 가져오는 캐릭터 목록 */
export interface PartyCardCharacter {
  characterName: string;
  jobGrowName: string;
  /** 딜러는 damage, 버퍼는 buffPower. 업둥은 0 가능 */
  stat: number;
}

export interface PartyCard {
  id: string;
  /** 소유자 닉네임 (어떤 유저의 카드인지) */
  ownerName: string;
  buffers: PartyCardCharacter[];
  dealers: PartyCardCharacter[];
  secondaryBuffers: PartyCardCharacter[];
  carries: PartyCardCharacter[];
}

/** 4인 일반 버퍼교환: 벞 딜 딜 딜 로테이션 */
const party4Normal: RotationTemplate = {
  id: 'party4_normal',
  label: '4인 일반 버퍼교환',
  description: '4명이 각자 버퍼 1명 + 딜러 3명을 가져와 4판 진행',
  peopleCount: 4,
  matchesCount: 4,
  slotsPerPerson: { buffer: 1, dealer: 3, secondaryBuffer: 0, carry: 0 },
  matrix: [
    ['buffer', 'dealer', 'dealer', 'dealer'],
    ['dealer', 'buffer', 'dealer', 'dealer'],
    ['dealer', 'dealer', 'buffer', 'dealer'],
    ['dealer', 'dealer', 'dealer', 'buffer'],
  ],
};

/** 4인 1업둥: 벞 딜 딜 업 로테이션 */
const party4_1carry: RotationTemplate = {
  id: 'party4_1carry',
  label: '4인 1업둥',
  description: '4명이 각자 버퍼 1명 + 딜러 2명 + 업둥 1명을 가져와 4판 진행',
  peopleCount: 4,
  matchesCount: 4,
  slotsPerPerson: { buffer: 1, dealer: 2, secondaryBuffer: 0, carry: 1 },
  matrix: [
    ['buffer', 'dealer', 'dealer', 'carry'],
    ['dealer', 'buffer', 'carry', 'dealer'],
    ['dealer', 'carry', 'buffer', 'dealer'],
    ['carry', 'dealer', 'dealer', 'buffer'],
  ],
};

/** 4인 2업둥: 벞 업 업 딜 로테이션 */
const party4_2carry: RotationTemplate = {
  id: 'party4_2carry',
  label: '4인 2업둥',
  description: '4명이 각자 버퍼 1명 + 딜러 1명 + 업둥 2명을 가져와 4판 진행',
  peopleCount: 4,
  matchesCount: 4,
  slotsPerPerson: { buffer: 1, dealer: 1, secondaryBuffer: 0, carry: 2 },
  matrix: [
    ['buffer', 'carry', 'carry', 'dealer'],
    ['carry', 'buffer', 'dealer', 'carry'],
    ['carry', 'dealer', 'buffer', 'carry'],
    ['dealer', 'carry', 'carry', 'buffer'],
  ],
};

/** 12인 8업둥 레이드: 주버퍼 1 + 딜러 3 + 업둥버퍼 1 + 업둥 7 */
const raid12_8carry: RotationTemplate = {
  id: 'raid12_8carry',
  label: '12인 레이드 (3딜 1벞 1벞둥 8업)',
  description: '12명이 각자 주버퍼 1 + 딜러 3 + 업둥버퍼 1 + 업둥 7을 가져와 12판 진행',
  peopleCount: 12,
  matchesCount: 12,
  slotsPerPerson: { buffer: 1, dealer: 3, secondaryBuffer: 1, carry: 7 },
  matrix: [
    // 사용자가 제공한 패턴 그대로 (12x12)
    ['buffer', 'dealer', 'dealer', 'dealer', 'secondaryBuffer', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry'],
    ['dealer', 'buffer', 'dealer', 'dealer', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry'],
    ['dealer', 'dealer', 'buffer', 'dealer', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'carry', 'carry'],
    ['dealer', 'dealer', 'dealer', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'carry'],
    ['carry', 'carry', 'carry', 'carry', 'buffer', 'dealer', 'dealer', 'dealer', 'secondaryBuffer', 'carry', 'carry', 'carry'],
    ['carry', 'carry', 'carry', 'carry', 'dealer', 'buffer', 'dealer', 'dealer', 'carry', 'secondaryBuffer', 'carry', 'carry'],
    ['carry', 'carry', 'carry', 'carry', 'dealer', 'dealer', 'buffer', 'dealer', 'carry', 'carry', 'secondaryBuffer', 'carry'],
    ['carry', 'carry', 'carry', 'carry', 'dealer', 'dealer', 'dealer', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer'],
    ['secondaryBuffer', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'buffer', 'dealer', 'dealer', 'dealer'],
    ['carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'carry', 'carry', 'carry', 'dealer', 'buffer', 'dealer', 'dealer'],
    ['carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'carry', 'carry', 'dealer', 'dealer', 'buffer', 'dealer'],
    ['carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'carry', 'dealer', 'dealer', 'dealer', 'buffer'],
  ],
};

export const ROTATION_TEMPLATES: Record<RotationTemplateId, RotationTemplate> = {
  party4_normal: party4Normal,
  party4_1carry: party4_1carry,
  party4_2carry: party4_2carry,
  raid12_8carry,
};

/** 한 사람이 각 역할에 정확한 수의 캐릭터를 가지고 있는지 검증 */
export function isCardValid(card: PartyCard, template: RotationTemplate): boolean {
  return (
    card.buffers.length === template.slotsPerPerson.buffer &&
    card.dealers.length === template.slotsPerPerson.dealer &&
    card.secondaryBuffers.length === template.slotsPerPerson.secondaryBuffer &&
    card.carries.length === template.slotsPerPerson.carry
  );
}
