import { useState } from 'react';

import { useCharacterStore } from '@/stores/character-store';
import { getCharactersByNames } from '@/services/neople-api';
import { parseDundamText } from '@/domain/dundam-parser';
import { isBufferJob } from '@/domain/character';
import { MAX_CHARACTERS } from '@/config/constants';

import type { Character } from '@/domain/character';
import type { DnfServerId } from '@/config/constants';
import type { DundamCharacterData } from '@/domain/dundam-parser';
import type { NeopleCharacterInfoResponse } from '@/domain/api-types';

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

    const serverId = parsed.serverId as DnfServerId;

    // 네오플 API로 실제 characterId 조회 시도
    setIsLoading(true);
    setProgress(`0/${parsed.characters.length} 캐릭터 조회 중...`);

    const names = parsed.characters.map((c) => c.characterName);
    const apiResult = await getCharactersByNames(
      parsed.serverId,
      names,
      (completed, total) => setProgress(`${completed}/${total} 캐릭터 조회 중...`),
    );

    // API 결과를 이름 기준으로 매핑
    const apiMap = new Map<string, NeopleCharacterInfoResponse>();
    if (apiResult.ok) {
      for (const info of apiResult.data) {
        apiMap.set(info.characterName, info);
      }
    }

    // 던담 파싱 데이터를 기반으로 캐릭터 등록 (API 결과가 있으면 보강)
    const characters: Character[] = parsed.characters.map((c) => {
      const apiInfo = apiMap.get(c.characterName);
      return {
        serverId,
        characterId: apiInfo?.characterId ?? `_local_${c.characterName}`,
        characterName: c.characterName,
        level: apiInfo?.level ?? 0,
        jobId: apiInfo?.jobId ?? '',
        jobGrowId: apiInfo?.jobGrowId ?? '',
        jobName: apiInfo?.jobName ?? '',
        jobGrowName: c.jobGrowName,
        adventureName: c.adventureName,
        fame: 0,
      };
    });

    const totalParsed = characters.length;
    const registeredCharacters = characters.slice(0, MAX_CHARACTERS);

    setAdventure(parsed.serverId, parsed.adventureName);
    setCharacters(registeredCharacters);

    // 딜/버프 수치 자동 입력
    const dundamMap = new Map<string, DundamCharacterData>();
    for (const c of parsed.characters) {
      dundamMap.set(c.characterName, c);
    }

    for (const character of registeredCharacters) {
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

    const warnings: string[] = [];
    if (totalParsed > MAX_CHARACTERS) {
      warnings.push(`캐릭터가 ${totalParsed}개 감지되어 상위 ${MAX_CHARACTERS}개만 등록되었습니다.`);
    }
    if (!apiResult.ok) {
      warnings.push('API 호출 한도 초과로 캐릭터 이미지/던담 링크를 불러오지 못했습니다. 수치 입력 및 파티 구성은 정상 이용 가능합니다.');
    }
    if (warnings.length > 0) {
      setError(warnings.join(' '));
    }
  }

  return { isLoading, progress, error, setupFromDundam };
}
