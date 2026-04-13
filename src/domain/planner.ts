/** 로테이션 슬롯 역할 */
export type RotationRole = 'buffer' | 'dealer' | 'secondaryBuffer' | 'carry';

/** 로테이션 템플릿 ID */
export type RotationTemplateId = 'party4_normal' | 'party4_1carry' | 'party4_2carry' | 'raid12_8carry' | 'raid12_2sb' | 'raid12_rotation' | 'dynamic';

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
  /** 파티 그룹명 (예: ['레드', '옐로', '그린']) - 12인 레이드에서 4인씩 그룹 구분 */
  partyGroups?: string[];
}

/** 파티 카드 - 한 사람이 가져오는 캐릭터 목록 */
export interface PartyCardCharacter {
  jobGrowName: string;
  /** 딜러는 damage, 버퍼는 buffPower */
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
  label: '12인 레이드 (3딜 1벞 1벞둥 7업)',
  description: '12명이 각자 주버퍼 1 + 딜러 3 + 업둥버퍼 1 + 업둥 7을 가져와 12판 진행',
  peopleCount: 12,
  matchesCount: 12,
  partyGroups: ['레드', '옐로', '그린'],
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

/** 12인 2업둥버퍼 레이드: 주버퍼 1 + 딜러 3 + 업둥버퍼 2 + 업둥 6 */
const raid12_2sb: RotationTemplate = {
  id: 'raid12_2sb',
  label: '12인 레이드 (3딜 1벞 2벞둥 6업)',
  description: '12명이 각자 주버퍼 1 + 딜러 3 + 업둥버퍼 2 + 업둥 6을 가져와 12판 진행',
  peopleCount: 12,
  matchesCount: 12,
  partyGroups: ['레드', '옐로', '그린'],
  slotsPerPerson: { buffer: 1, dealer: 3, secondaryBuffer: 2, carry: 6 },
  matrix: [
    ['buffer', 'dealer', 'dealer', 'dealer', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry'],
    ['dealer', 'buffer', 'dealer', 'dealer', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry'],
    ['dealer', 'dealer', 'buffer', 'dealer', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry'],
    ['dealer', 'dealer', 'dealer', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer'],
    ['secondaryBuffer', 'carry', 'carry', 'carry', 'buffer', 'dealer', 'dealer', 'dealer', 'secondaryBuffer', 'carry', 'carry', 'carry'],
    ['carry', 'secondaryBuffer', 'carry', 'carry', 'dealer', 'buffer', 'dealer', 'dealer', 'carry', 'secondaryBuffer', 'carry', 'carry'],
    ['carry', 'carry', 'secondaryBuffer', 'carry', 'dealer', 'dealer', 'buffer', 'dealer', 'carry', 'carry', 'secondaryBuffer', 'carry'],
    ['carry', 'carry', 'carry', 'secondaryBuffer', 'dealer', 'dealer', 'dealer', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer'],
    ['secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'buffer', 'dealer', 'dealer', 'dealer'],
    ['carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'dealer', 'buffer', 'dealer', 'dealer'],
    ['carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'dealer', 'dealer', 'buffer', 'dealer'],
    ['carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'dealer', 'dealer', 'dealer', 'buffer'],
  ],
};

/** 12인 벞교 로테이션: 1딜 1벞 2벞둥 8업 */
const raid12_rotation: RotationTemplate = {
  id: 'raid12_rotation',
  label: '12인 벞교 (1딜 1벞 2벞둥 8업)',
  description: '12명이 각자 딜러 1 + 버퍼 1 + 업둥버퍼 2 + 업둥 8을 가져와 12판 진행',
  peopleCount: 12,
  matchesCount: 12,
  partyGroups: ['레드', '옐로', '그린'],
  slotsPerPerson: { buffer: 1, dealer: 1, secondaryBuffer: 2, carry: 8 },
  matrix: [
    // 1~4기: 레드=캐리, 옐로=업둥, 그린=업둥
    ['buffer', 'carry', 'carry', 'dealer', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry'],
    ['carry', 'buffer', 'dealer', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry'],
    ['carry', 'dealer', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry'],
    ['dealer', 'carry', 'carry', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer'],
    // 5~8기: 옐로=캐리, 레드=업둥, 그린=업둥
    ['secondaryBuffer', 'carry', 'carry', 'carry', 'buffer', 'carry', 'carry', 'dealer', 'secondaryBuffer', 'carry', 'carry', 'carry'],
    ['carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'buffer', 'dealer', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry'],
    ['carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'dealer', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry'],
    ['carry', 'carry', 'carry', 'secondaryBuffer', 'dealer', 'carry', 'carry', 'buffer', 'carry', 'carry', 'carry', 'secondaryBuffer'],
    // 9~12기: 그린=캐리, 레드=업둥, 옐로=업둥
    ['secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'buffer', 'carry', 'carry', 'dealer'],
    ['carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'buffer', 'dealer', 'carry'],
    ['carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'dealer', 'buffer', 'carry'],
    ['carry', 'carry', 'carry', 'secondaryBuffer', 'carry', 'carry', 'carry', 'secondaryBuffer', 'dealer', 'carry', 'carry', 'buffer'],
  ],
};

export const ROTATION_TEMPLATES: Partial<Record<RotationTemplateId, RotationTemplate>> = {
  party4_normal: party4Normal,
  party4_1carry: party4_1carry,
  party4_2carry: party4_2carry,
  raid12_8carry,
  raid12_2sb,
  raid12_rotation,
};

/**
 * 버퍼 1개 파티에 대해 동적으로 로테이션 템플릿을 생성한다.
 * 버퍼가 대각선으로 회전하고, 나머지 역할은 offset 기반 배정.
 */
export function generateRotationTemplate(
  peopleCount: number,
  dealerSlots: number,
  secondaryBufferSlots: number,
): RotationTemplate {
  const carrySlots = Math.max(0, peopleCount - 1 - dealerSlots - secondaryBufferSlots);
  const matrix: RotationRole[][] = [];

  for (let m = 0; m < peopleCount; m++) {
    const row: RotationRole[] = [];
    for (let p = 0; p < peopleCount; p++) {
      if (p === m) {
        row.push('buffer');
      } else {
        const offset = (p - m + peopleCount) % peopleCount; // 1 ~ N-1
        if (offset <= dealerSlots) {
          row.push('dealer');
        } else if (offset <= dealerSlots + secondaryBufferSlots) {
          row.push('secondaryBuffer');
        } else {
          row.push('carry');
        }
      }
    }
    matrix.push(row);
  }

  const parts: string[] = [];
  parts.push(`딜러 ${dealerSlots}`);
  parts.push(`버퍼 1`);
  if (secondaryBufferSlots > 0) parts.push(`업둥버퍼 ${secondaryBufferSlots}`);
  if (carrySlots > 0) parts.push(`업둥 ${carrySlots}`);

  return {
    id: 'dynamic',
    label: `${peopleCount}인 벞교 (${parts.join(' + ')})`,
    description: `${peopleCount}명이 각자 버퍼 1명 + 딜러 ${dealerSlots}명${secondaryBufferSlots > 0 ? ` + 업둥버퍼 ${secondaryBufferSlots}명` : ''}${carrySlots > 0 ? ` + 업둥 ${carrySlots}명` : ''}을 가져와 ${peopleCount}판 진행`,
    peopleCount,
    matchesCount: peopleCount,
    slotsPerPerson: { buffer: 1, dealer: dealerSlots, secondaryBuffer: secondaryBufferSlots, carry: carrySlots },
    matrix,
  };
}

/**
 * 프리셋에 맞는 로테이션 템플릿을 반환한다.
 * 1. 정적 템플릿에서 매칭 시도
 * 2. 버퍼 1개인 경우 동적 생성
 * 3. 둘 다 안 되면 null
 */
export function presetToTemplate(preset: {
  dealerSlots: number;
  bufferSlots: number;
  secondaryBufferSlots: number;
  totalMembers: number;
}): RotationTemplate | null {
  // 정적 템플릿 매칭
  for (const template of Object.values(ROTATION_TEMPLATES)) {
    const s = template.slotsPerPerson;
    if (
      template.peopleCount === preset.totalMembers &&
      s.buffer === preset.bufferSlots &&
      s.dealer === preset.dealerSlots &&
      s.secondaryBuffer === preset.secondaryBufferSlots
    ) {
      return template;
    }
  }

  // 버퍼 1개인 경우 동적 생성
  if (preset.bufferSlots === 1 && preset.totalMembers >= 2) {
    return generateRotationTemplate(
      preset.totalMembers,
      preset.dealerSlots,
      preset.secondaryBufferSlots,
    );
  }

  return null;
}

/** 한 사람이 각 역할에 정확한 수의 캐릭터를 가지고 있는지 검증 (업둥은 무시) */
export function isCardValid(card: PartyCard, template: RotationTemplate): boolean {
  return (
    card.buffers.length === template.slotsPerPerson.buffer &&
    card.dealers.length === template.slotsPerPerson.dealer &&
    card.secondaryBuffers.length === template.slotsPerPerson.secondaryBuffer
  );
}

/** 파티 카드와 템플릿의 불일치 사유를 반환한다. 정상이면 null */
export function validateCardForTemplate(
  card: Omit<PartyCard, 'id'>,
  template: RotationTemplate,
): string | null {
  const mismatches: string[] = [];
  if (card.buffers.length !== template.slotsPerPerson.buffer) {
    mismatches.push(`버퍼 ${card.buffers.length}명 (필요 ${template.slotsPerPerson.buffer}명)`);
  }
  if (card.dealers.length !== template.slotsPerPerson.dealer) {
    mismatches.push(`딜러 ${card.dealers.length}명 (필요 ${template.slotsPerPerson.dealer}명)`);
  }
  if (card.secondaryBuffers.length !== template.slotsPerPerson.secondaryBuffer) {
    mismatches.push(`업둥버퍼 ${card.secondaryBuffers.length}명 (필요 ${template.slotsPerPerson.secondaryBuffer}명)`);
  }
  // 업둥은 검증하지 않음 (don't care)
  if (mismatches.length === 0) return null;
  return `템플릿 "${template.label}"과 맞지 않습니다: ${mismatches.join(', ')}`;
}

/** PartyComposition을 PartyCard로 변환 */
export function compositionToPartyCard(
  composition: import('./party').PartyComposition,
  ownerName: string,
): Omit<PartyCard, 'id'> {
  return {
    ownerName,
    buffers: composition.primaryBuffers.map((b) => ({
      jobGrowName: b.jobGrowName,
      stat: b.buffPower,
    })),
    dealers: composition.dealers.map((d) => ({
      jobGrowName: d.jobGrowName,
      stat: d.damage,
    })),
    secondaryBuffers: composition.secondaryBuffers.map((b) => ({
      jobGrowName: b.jobGrowName,
      stat: b.buffPower,
    })),
    carries: [],
  };
}
