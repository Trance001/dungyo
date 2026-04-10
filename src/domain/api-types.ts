/** 네오플 API 응답 DTO (API 원본 형태 그대로) */

/** 캐릭터 검색 응답 */
export interface NeopleCharacterSearchResponse {
  rows: NeopleCharacterRow[];
}

export interface NeopleCharacterRow {
  serverId: string;
  characterId: string;
  characterName: string;
  level: number;
  jobId: string;
  jobGrowId: string;
  jobName: string;
  jobGrowName: string;
  fame?: number;
}

/** 캐릭터 기본 정보 응답 */
export interface NeopleCharacterInfoResponse {
  characterId: string;
  characterName: string;
  level: number;
  jobId: string;
  jobGrowId: string;
  jobName: string;
  jobGrowName: string;
  adventureName: string;
  guildId?: string;
  guildName?: string;
}

/** 캐릭터 능력치 응답 */
export interface NeopleCharacterStatusResponse {
  characterId: string;
  characterName: string;
  level: number;
  jobId: string;
  jobGrowId: string;
  adventureName: string;
  status: NeopleStatusEntry[];
}

export interface NeopleStatusEntry {
  name: string;
  value: number;
}

/** 명성 기반 검색 응답 */
export interface NeopleFameSearchResponse {
  rows: NeopleCharacterRow[];
}
