import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { parseDundamText } from '@/domain/dundam-parser';
import { isBufferJob } from '@/domain/character';

import type { Character } from '@/domain/character';
import type { DnfServerId } from '@/config/constants';

interface UseAdventureSetupReturn {
  error: string | null;
  setupFromDundam: (text: string) => void;
}

export function useAdventureSetup(): UseAdventureSetupReturn {
  const [error, setError] = useState<string | null>(null);

  const setAdventure = useCharacterStore((state) => state.setAdventure);
  const setCharacters = useCharacterStore((state) => state.setCharacters);
  const setDamage = useCharacterStore((state) => state.setDamage);
  const setBuffPower = useCharacterStore((state) => state.setBuffPower);

  function setupFromDundam(text: string): void {
    setError(null);

    const result = parseDundamText(text);

    if (!result.adventureName || !result.serverId) {
      setError('던담 데이터를 인식할 수 없습니다. 던담 모험단 페이지에서 Ctrl+A로 전체 선택 후 붙여넣어주세요.');
      return;
    }

    if (result.characters.length === 0) {
      setError('캐릭터 정보를 찾을 수 없습니다.');
      return;
    }

    const characters: Character[] = result.characters.map((c) => ({
      serverId: c.serverId as DnfServerId,
      characterId: c.characterName,
      characterName: c.characterName,
      level: 0,
      jobId: '',
      jobGrowId: '',
      jobName: '',
      jobGrowName: c.jobGrowName,
      adventureName: c.adventureName,
      fame: 0,
    }));

    setAdventure(result.serverId, result.adventureName);
    setCharacters(characters);

    // 딜/버프 수치 자동 입력
    for (const c of result.characters) {
      if (isBufferJob(c.jobGrowName) && c.buffPower !== null) {
        setBuffPower(c.serverId, c.characterName, Math.round(c.buffPower / 10000));
      } else if (c.damage !== null) {
        setDamage(c.serverId, c.characterName, c.damage);
      }
    }
  }

  return { error, setupFromDundam };
}
