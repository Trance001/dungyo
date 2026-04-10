import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { getCharactersByNames } from '@/services/neople-api';
import { toCharacterEntity } from '@/domain/character';

import type { Character } from '@/domain/character';
import type { DnfServerId } from '@/config/constants';

interface UseCharacterSearchReturn {
  searchInput: string;
  setSearchInput: (input: string) => void;
  isSearching: boolean;
  progress: string | null;
  searchError: string | null;
  handleSearch: () => Promise<void>;
}

export function useCharacterSearch(): UseCharacterSearchReturn {
  const [searchInput, setSearchInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);

  const serverId = useCharacterStore((state) => state.serverId);
  const addCharacter = useCharacterStore((state) => state.addCharacter);

  async function handleSearch(): Promise<void> {
    const names = searchInput
      .split(/\s+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (names.length === 0 || !serverId) return;

    setIsSearching(true);
    setSearchError(null);
    setProgress(`0/${names.length} 캐릭터 조회 중...`);

    const result = await getCharactersByNames(
      serverId,
      names,
      (completed, total) => setProgress(`${completed}/${total} 캐릭터 조회 중...`),
    );

    if (!result.ok) {
      setSearchError(result.error);
      setIsSearching(false);
      setProgress(null);
      return;
    }

    const characters: Character[] = result.data.map((info) =>
      toCharacterEntity(info, serverId as DnfServerId),
    );

    for (const c of characters) {
      addCharacter(c);
    }

    setSearchInput('');
    setIsSearching(false);
    setProgress(null);
  }

  return {
    searchInput,
    setSearchInput,
    isSearching,
    progress,
    searchError,
    handleSearch,
  };
}
