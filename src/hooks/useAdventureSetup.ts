import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { getCharactersByNames } from '@/services/neople-api';
import { toCharacterEntity } from '@/domain/character';

import type { DnfServerId } from '@/config/constants';

interface UseAdventureSetupReturn {
  isLoading: boolean;
  progress: string | null;
  error: string | null;
  setupAdventure: (serverId: string, characterNamesInput: string) => Promise<void>;
}

export function useAdventureSetup(): UseAdventureSetupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setAdventure = useCharacterStore((state) => state.setAdventure);
  const setCharacters = useCharacterStore((state) => state.setCharacters);

  async function setupAdventure(serverId: string, characterNamesInput: string): Promise<void> {
    const names = characterNamesInput
      .split(/\s+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0) return;

    setIsLoading(true);
    setError(null);
    setProgress(`0/${names.length} 캐릭터 조회 중...`);

    const result = await getCharactersByNames(
      serverId,
      names,
      (completed, total) => setProgress(`${completed}/${total} 캐릭터 조회 중...`),
    );

    if (!result.ok) {
      setError(result.error);
      setIsLoading(false);
      setProgress(null);
      return;
    }

    if (result.data.length === 0) {
      setError('캐릭터를 찾을 수 없습니다. 캐릭터명을 확인해주세요.');
      setIsLoading(false);
      setProgress(null);
      return;
    }

    const adventureName = result.data[0].adventureName;
    if (!adventureName) {
      setError('모험단명을 확인할 수 없습니다.');
      setIsLoading(false);
      setProgress(null);
      return;
    }

    const characters = result.data.map((info) =>
      toCharacterEntity(info, serverId as DnfServerId),
    );

    setAdventure(serverId, adventureName);
    setCharacters(characters);
    setIsLoading(false);
    setProgress(null);
  }

  return { isLoading, progress, error, setupAdventure };
}
