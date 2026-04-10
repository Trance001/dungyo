import type { RaidType } from '@/config/constants';
import type {
  BufferCharacter,
  CarryCharacter,
  DealerCharacter,
} from './character';

/** 파티 구성 결과 */
export interface PartyComposition {
  raidType: RaidType;
  dealers: DealerCharacter[];
  primaryBuffer: BufferCharacter | null;
  secondaryBuffer: BufferCharacter | null;
  carries: CarryCharacter[];
  /** 구성 완성 여부 */
  isComplete: boolean;
  /** 부족한 슬롯 정보 */
  missingSlots: MissingSlot[];
}

export interface MissingSlot {
  role: 'dealer' | 'buffer' | 'secondaryBuffer' | 'carry';
  count: number;
  requirement: string;
}

/** 버퍼교환 입력 조건 */
export interface BufferExchangeInput {
  raidType: RaidType;
  minDealerDamage: number;
  minPrimaryBuffPower: number;
  minSecondaryBuffPower: number;
}
