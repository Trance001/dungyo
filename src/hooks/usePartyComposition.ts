import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { buildMultipleParties, characterKey } from '@/domain/party-builder';
import { isBufferJob } from '@/domain/character';

import type { Character } from '@/domain/character';
import type { BufferExchangeInput, PartyComposition } from '@/domain/party';

interface UsePartyCompositionReturn {
  partyResults: PartyComposition[];
  buildParty: (input: BufferExchangeInput) => void;
  clearResults: () => void;
  addCarry: (partyIndex: number, character: Character) => void;
  removeCarry: (partyIndex: number, serverId: string, characterId: string) => void;
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

  function addCarry(partyIndex: number, character: Character): void {
    setPartyResults((prev) => prev.map((party, idx) => {
      if (idx !== partyIndex) return party;
      const filled = party.carryDealers.length + party.carryBuffers.length;
      if (filled >= party.carryCount) return party;

      if (isBufferJob(character.jobGrowName)) {
        const buffPower = buffPowerMap.get(characterKey(character)) ?? 0;
        return {
          ...party,
          carryBuffers: [
            ...party.carryBuffers,
            { ...character, role: 'buffer' as const, buffPower },
          ],
        };
      } else {
        const damage = damageMap.get(characterKey(character)) ?? 0;
        return {
          ...party,
          carryDealers: [
            ...party.carryDealers,
            { ...character, role: 'dealer' as const, damage },
          ],
        };
      }
    }));
  }

  function removeCarry(partyIndex: number, serverId: string, characterId: string): void {
    setPartyResults((prev) => prev.map((party, idx) => {
      if (idx !== partyIndex) return party;
      const match = (c: { serverId: string; characterId: string }) =>
        c.serverId === serverId && c.characterId === characterId;
      return {
        ...party,
        carryDealers: party.carryDealers.filter((d) => !match(d)),
        carryBuffers: party.carryBuffers.filter((b) => !match(b)),
      };
    }));
  }

  return {
    partyResults,
    buildParty,
    clearResults,
    addCarry,
    removeCarry,
  };
}
