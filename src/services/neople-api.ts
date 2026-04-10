import { API_CONFIG, SEARCH_CONFIG } from '@/config/constants';
import type {
  NeopleCharacterInfoResponse,
  NeopleCharacterSearchResponse,
  NeopleCharacterStatusResponse,
} from '@/domain/api-types';

/** API 호출 결과 */
export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

async function fetchApi<T>(path: string): Promise<ApiResult<T>> {
  try {
    const url = `${API_CONFIG.PROXY_BASE_URL}${path}`;
    const response = await fetch(url);

    if (!response.ok) {
      const status = response.status;
      if (status === 404) return { ok: false, error: '데이터를 찾을 수 없습니다.' };
      if (status === 429) return { ok: false, error: 'API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.' };
      return { ok: false, error: `API 오류가 발생했습니다. (${status})` };
    }

    const data = (await response.json()) as T;
    return { ok: true, data };
  } catch {
    return { ok: false, error: '네트워크 연결을 확인해주세요.' };
  }
}

/** 캐릭터명으로 검색 */
export async function searchCharactersByName(
  serverId: string,
  characterName: string,
  limit: number = 50,
): Promise<ApiResult<NeopleCharacterSearchResponse>> {
  const encodedName = encodeURIComponent(characterName);
  return fetchApi<NeopleCharacterSearchResponse>(
    `/df/servers/${serverId}/characters?characterName=${encodedName}&limit=${limit}&wordType=match`,
  );
}

/** 캐릭터 기본 정보 조회 */
export async function getCharacterInfo(
  serverId: string,
  characterId: string,
): Promise<ApiResult<NeopleCharacterInfoResponse>> {
  return fetchApi<NeopleCharacterInfoResponse>(
    `/df/servers/${serverId}/characters/${characterId}`,
  );
}

/** 캐릭터 능력치 조회 */
export async function getCharacterStatus(
  serverId: string,
  characterId: string,
): Promise<ApiResult<NeopleCharacterStatusResponse>> {
  return fetchApi<NeopleCharacterStatusResponse>(
    `/df/servers/${serverId}/characters/${characterId}/status`,
  );
}

/**
 * 캐릭터명 목록으로 일괄 조회
 * 각 캐릭터명을 검색 → 상세 조회하여 Character 정보를 수집한다.
 * onProgress 콜백으로 진행 상태를 전달한다.
 */
export async function getCharactersByNames(
  serverId: string,
  names: string[],
  onProgress?: (completed: number, total: number) => void,
): Promise<ApiResult<NeopleCharacterInfoResponse[]>> {
  const results: NeopleCharacterInfoResponse[] = [];
  const errors: string[] = [];

  for (let i = 0; i < names.length; i += SEARCH_CONFIG.CONCURRENT_REQUEST_LIMIT) {
    const batch = names.slice(i, i + SEARCH_CONFIG.CONCURRENT_REQUEST_LIMIT);
    const batchResults = await Promise.all(
      batch.map(async (name): Promise<{ data: NeopleCharacterInfoResponse } | { error: string }> => {
        const searchResult = await searchCharactersByName(serverId, name, 1);
        if (!searchResult.ok) {
          return { error: searchResult.error };
        }
        if (searchResult.data.rows.length === 0) {
          return { error: `'${name}' 캐릭터를 찾을 수 없습니다.` };
        }

        const row = searchResult.data.rows[0];
        const infoResult = await getCharacterInfo(row.serverId ?? serverId, row.characterId);
        if (!infoResult.ok) {
          return { error: infoResult.error };
        }

        return { data: infoResult.data };
      }),
    );

    for (const result of batchResults) {
      if ('data' in result) {
        results.push(result.data);
      } else {
        errors.push(result.error);
      }
    }

    onProgress?.(Math.min(i + batch.length, names.length), names.length);
  }

  if (results.length === 0 && errors.length > 0) {
    return { ok: false, error: errors[0] };
  }

  return { ok: true, data: results };
}

/**
 * 모험단 내 캐릭터 조회
 * 대표 캐릭터명을 입력받아 해당 캐릭터의 모험단명을 확인한 뒤,
 * 같은 서버에서 더 많은 캐릭터를 검색하여 동일 모험단 캐릭터를 병렬로 수집한다.
 *
 * NOTE: 네오플 API에는 모험단 전체 캐릭터 조회 API가 없으므로,
 *       캐릭터명 검색 → 상세 조회 → 모험단명 매칭 방식을 사용한다.
 *       검색 결과에 포함되지 않는 캐릭터는 수집할 수 없는 한계가 있다.
 */
export async function getAdventureCharacters(
  serverId: string,
  characterName: string,
): Promise<ApiResult<NeopleCharacterInfoResponse[]>> {
  // 1단계: 대표 캐릭터 검색 (정확히 1건)
  const searchResult = await searchCharactersByName(serverId, characterName, 1);
  if (!searchResult.ok) return searchResult;
  if (searchResult.data.rows.length === 0) {
    return { ok: false, error: `'${characterName}' 캐릭터를 찾을 수 없습니다.` };
  }

  // 2단계: 캐릭터 상세로 모험단명 확인
  const firstChar = searchResult.data.rows[0];
  const infoResult = await getCharacterInfo(serverId, firstChar.characterId);
  if (!infoResult.ok) return infoResult;

  const adventureName = infoResult.data.adventureName;
  if (!adventureName) {
    return { ok: false, error: '모험단명을 확인할 수 없습니다.' };
  }

  // 3단계: 더 많은 캐릭터를 검색하여 같은 모험단 필터링
  // 캐릭터명에서 부분 문자열로 넓게 검색 시도
  const wideResult = await searchCharactersByName(
    serverId,
    characterName,
    SEARCH_CONFIG.ADVENTURE_SEARCH_LIMIT,
  );

  if (!wideResult.ok) {
    // 넓은 검색 실패 시 첫 캐릭터만 반환
    return { ok: true, data: [infoResult.data] };
  }

  // 4단계: 검색된 캐릭터들의 상세 정보를 배치 조회하여 모험단명 매칭
  const rows = wideResult.data.rows;
  const detailResults: ApiResult<NeopleCharacterInfoResponse>[] = [];
  for (let i = 0; i < rows.length; i += SEARCH_CONFIG.CONCURRENT_REQUEST_LIMIT) {
    const batch = rows.slice(i, i + SEARCH_CONFIG.CONCURRENT_REQUEST_LIMIT);
    const batchResults = await Promise.all(
      batch.map((row) =>
        getCharacterInfo(row.serverId ?? serverId, row.characterId),
      ),
    );
    detailResults.push(...batchResults);
  }

  const matchedCharacters: NeopleCharacterInfoResponse[] = [];
  for (const detail of detailResults) {
    if (detail.ok && detail.data.adventureName === adventureName) {
      matchedCharacters.push(detail.data);
    }
  }

  // 첫 캐릭터가 포함되지 않았으면 추가
  const hasFirst = matchedCharacters.some(
    (c) => c.characterId === infoResult.data.characterId,
  );
  if (!hasFirst) {
    matchedCharacters.unshift(infoResult.data);
  }

  return { ok: true, data: matchedCharacters };
}
