/** 버퍼교환 조건 프리셋 */
export interface Preset {
  id: string;
  name: string;
  totalMembers: number;
  dealerSlots: number;
  bufferSlots: number;
  secondaryBufferSlots: number;
  minDealerDamage: number;
  minPrimaryBuffPower: number;
  minSecondaryBuffPower: number;
  useTotalDamage: boolean;
  minTotalDamage: number;
  truncateOnesDigit: boolean;
}
