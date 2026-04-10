import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { getCharactersByNames } from '@/services/neople-api';
import { parseDundamText } from '@/domain/dundam-parser';
import { isBufferJob, toCharacterEntity } from '@/domain/character';

import type { DnfServerId } from '@/config/constants';
import type { DundamCharacterData } from '@/domain/dundam-parser';

interface UseAdventureSetupReturn {
  isLoading: boolean;
  progress: string | null;
  error: string | null;
  setupFromDundam: (text: string) => Promise<void>;
}

export function useAdventureSetup(): UseAdventureSetupReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const setAdventure = useCharacterStore((state) => state.setAdventure);
  const setCharacters = useCharacterStore((state) => state.setCharacters);
  const setDamage = useCharacterStore((state) => state.setDamage);
  const setBuffPower = useCharacterStore((state) => state.setBuffPower);

  async function setupFromDundam(text: string): Promise<void> {
    setError(null);

    const parsed = parseDundamText(text);

    if (!parsed.adventureName || !parsed.serverId) {
      setError('던담 데이터를 인식할 수 없습니다. 던담 모험단 페이지에서 Ctrl+A로 전체 선택 후 붙여넣어주세요.');
      return;
    }

    if (parsed.characters.length === 0) {
      setError('캐릭터 정보를 찾을 수 없습니다.');
      return;
    }

    // 네오플 API로 실제 characterId 조회
    setIsLoading(true);
    setProgress(`0/${parsed.characters.length} 캐릭터 조회 중...`);

    const names = parsed.characters.map((c) => c.characterName);
    const apiResult = await getCharactersByNames(
      parsed.serverId,
      names,
      (completed, total) => setProgress(`${completed}/${total} 캐릭터 조회 중...`),
    );

    if (apiResult.ok === false) {
      setError(apiResult.error);
      setIsLoading(false);
      setProgress(null);
      return;
    }

    // API 결과와 던담 파싱 결과를 매칭하여 캐릭터 등록
    const serverId = parsed.serverId as DnfServerId;
    const apiData = apiResult.data;
    const characters = apiData.map((info) => toCharacterEntity(info, serverId));

    setAdventure(parsed.serverId, parsed.adventureName);
    setCharacters(characters);

    // 던담 데이터에서 딜/버프 수치 자동 입력 (characterName으로 매칭)
    const dundamMap = new Map<string, DundamCharacterData>();
    for (const c of parsed.characters) {
      dundamMap.set(c.characterName, c);
    }

    for (const character of characters) {
      const dundam = dundamMap.get(character.characterName);
      if (!dundam) continue;

      if (isBufferJob(character.jobGrowName) && dundam.buffPower !== null) {
        setBuffPower(character.serverId, character.characterId, Math.round(dundam.buffPower / 10000));
      } else if (dundam.damage !== null) {
        setDamage(character.serverId, character.characterId, dundam.damage);
      }
    }

    setIsLoading(false);
    setProgress(null);
  }

  return { isLoading, progress, error, setupFromDundam };
}
