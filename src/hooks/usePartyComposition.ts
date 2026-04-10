import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { buildPartyComposition } from '@/domain/party-builder';

import type { BufferExchangeInput, PartyComposition } from '@/domain/party';

interface UsePartyCompositionReturn {
  partyResult: PartyComposition | null;
  buildParty: (input: BufferExchangeInput) => void;
  clearResult: () => void;
}

export function usePartyComposition(): UsePartyCompositionReturn {
  const [partyResult, setPartyResult] = useState<PartyComposition | null>(null);

  const characters = useCharacterStore((state) => state.characters);
  const damageMap = useCharacterStore((state) => state.damageMap);
  const buffPowerMap = useCharacterStore((state) => state.buffPowerMap);
  const weeklyClearRecords = useCharacterStore(
    (state) => state.weeklyClearRecords,
  );

  function buildParty(input: BufferExchangeInput): void {
    const result = buildPartyComposition(
      input,
      characters,
      damageMap,
      buffPowerMap,
      weeklyClearRecords,
    );
    setPartyResult(result);
  }

  function clearResult(): void {
    setPartyResult(null);
  }

  return {
    partyResult,
    buildParty,
    clearResult,
  };
}
