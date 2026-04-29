import type {
  BufferCharacter,
  DealerCharacter,
} from './character';

/** 파티 슬롯 구성 */
export interface SlotConfig {
  dealerSlots: number;
  bufferSlots: number;
  secondaryBufferSlots: number;
  carrySlots: number;
}

/** 파티 구성 결과 */
export interface PartyComposition {
  slotConfig: SlotConfig;
  /** 딜합벞교 옵션 사용 여부 */
  useTotalDamage: boolean;
  /** 딜합 계산 시 1의 자리 버림 적용 여부 */
  truncateOnesDigit: boolean;
  dealers: DealerCharacter[];
  primaryBuffers: BufferCharacter[];
  secondaryBuffers: BufferCharacter[];
  /** 업둥 슬롯 수 (머릿수만 채움) */
  carryCount: number;
  /** 업둥으로 배정된 딜러 (수동 추가) */
  carryDealers: DealerCharacter[];
  /** 업둥으로 배정된 버퍼 (수동 추가) */
  carryBuffers: BufferCharacter[];
  /** 구성 완성 여부 */
  isComplete: boolean;
  /** 부족한 슬롯 정보 */
  missingSlots: MissingSlot[];
}

export interface MissingSlot {
  role: 'dealer' | 'buffer' | 'secondaryBuffer';
  count: number;
  requirement: string;
}

/** 버퍼교환 입력 조건 */
export interface BufferExchangeInput extends SlotConfig {
  minDealerDamage: number;
  minPrimaryBuffPower: number;
  minSecondaryBuffPower: number;
  /** 딜합벞교 사용 여부 */
  useTotalDamage: boolean;
  /** 딜합 기준 (억 단위) */
  minTotalDamage: number;
  /** 딜합 계산 시 1의 자리 버림 */
  truncateOnesDigit: boolean;
  /** 최소 입장 명성 (0 또는 미입력 시 제한 없음) */
  minFame?: number;
}
