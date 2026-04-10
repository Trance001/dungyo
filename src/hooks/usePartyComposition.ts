import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { buildMultipleParties } from '@/domain/party-builder';

import type { BufferExchangeInput, PartyComposition } from '@/domain/party';

interface UsePartyCompositionReturn {
  partyResults: PartyComposition[];
  buildParty: (input: BufferExchangeInput) => void;
  clearResults: () => void;
}

export function usePartyComposition(): UsePartyCompositionReturn {
  const [partyResults, setPartyResults] = useState<PartyComposition[]>([]);

  const characters = useCharacterStore((state) => state.characters);
  const damageMap = useCharacterStore((state) => state.damageMap);
  const buffPowerMap = useCharacterStore((state) => state.buffPowerMap);
  const weeklyClearRecords = useCharacterStore(
    (state) => state.weeklyClearRecords,
  );

  function buildParty(input: BufferExchangeInput): void {
    const results = buildMultipleParties(
      input,
      characters,
      damageMap,
      buffPowerMap,
      weeklyClearRecords,
    );
    setPartyResults(results);
  }

  function clearResults(): void {
    setPartyResults([]);
  }

  return {
    partyResults,
    buildParty,
    clearResults,
  };
}
