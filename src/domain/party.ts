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
  dealers: DealerCharacter[];
  primaryBuffers: BufferCharacter[];
  secondaryBuffers: BufferCharacter[];
  /** 업둥 슬롯 수 (머릿수만 채움) */
  carryCount: number;
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
}
