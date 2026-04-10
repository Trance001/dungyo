import { MAX_CHARACTERS } from '@/config/constants';
import { isBufferJob } from './character';

/** 던담 파싱 결과 */
export interface DundamCharacterData {
  characterName: string;
  jobGrowName: string;
  serverId: string;
  adventureName: string;
  /** 딜러: 억 단위 딜 수치 */
  damage: number | null;
  /** 버퍼: 버프점수 원본 값 */
  buffPower: number | null;
}

/** 던담 파싱 결과 */
export interface DundamParseResult {
  adventureName: string | null;
  serverId: string | null;
  characters: DundamCharacterData[];
}

/** 서버명 → serverId 매핑 */
const SERVER_NAME_MAP: Record<string, string> = {
  '카인': 'cain',
  '디레지에': 'diregie',
  '시로코': 'siroco',
  '프레이': 'prey',
  '카시야스': 'casillas',
  '힐더': 'hilder',
  '안톤': 'anton',
  '바칼': 'bakal',
};

/**
 * 던담 모험단 페이지의 복사 텍스트를 파싱한다.
 * Ctrl+A로 복사한 던담 페이지 텍스트에서 캐릭터 정보를 추출한다.
 */
export function parseDundamText(text: string): DundamParseResult {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  // 모험단명 추출: "모험단\n모험단명\n검색 결과" 패턴
  let adventureName: string | null = null;
  const adventureIdx = lines.findIndex((l) => l === '모험단');
  if (adventureIdx !== -1 && adventureIdx + 1 < lines.length) {
    const candidate = lines[adventureIdx + 1];
    if (candidate !== '검색 결과 입니다.') {
      adventureName = candidate;
    }
  }

  if (!adventureName) {
    return { adventureName: null, serverId: null, characters: [] };
  }

  // 서버명과 직업명 패턴으로 캐릭터 블록을 추출
  const characters: DundamCharacterData[] = [];
  let serverId: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    if (characters.length >= MAX_CHARACTERS) break;

    const line = lines[i];

    // 서버명 감지
    if (SERVER_NAME_MAP[line]) {
      const detectedServerId = SERVER_NAME_MAP[line];

      // 다음 줄이 '眞 XXX' 직업명인지 확인
      if (i + 1 < lines.length && lines[i + 1].startsWith('眞 ')) {
        serverId = detectedServerId;
        const jobGrowName = lines[i + 1];

        // 캐릭터명 찾기: 모험단명으로 끝나는 줄
        let characterName: string | null = null;
        let damage: number | null = null;
        let buffPower: number | null = null;

        // 이후 줄에서 캐릭터명과 스탯 검색
        for (let j = i + 2; j < Math.min(i + 20, lines.length); j++) {
          const searchLine = lines[j];

          // 캐릭터명 + 모험단명
          if (searchLine.endsWith(adventureName) && searchLine.length > adventureName.length) {
            characterName = searchLine.slice(0, -adventureName.length);
          }

          // 딜러 딜 수치: "랭킹X 조 XXXX 억" 또는 "랭킹XXXX 억 XXXX 만"
          const damageJoMatch = searchLine.match(/랭킹\s*([\d,]+)\s*조\s*([\d,]+)\s*억/);
          if (damageJoMatch) {
            const jo = parseInt(damageJoMatch[1].replace(/,/g, ''), 10);
            const eok = parseInt(damageJoMatch[2].replace(/,/g, ''), 10);
            damage = jo * 10000 + eok;
            break;
          }

          const damageMatch = searchLine.match(/랭킹\s*([\d,]+)\s*억\s*([\d,]+)\s*만/);
          if (damageMatch) {
            damage = parseInt(damageMatch[1].replace(/,/g, ''), 10);
            break;
          }

          // 버퍼 점수: "버프점수X,XXX,XXX"
          const buffMatch = searchLine.match(/버프점수\s*([\d,]+)/);
          if (buffMatch) {
            buffPower = parseInt(buffMatch[1].replace(/,/g, ''), 10);
            break;
          }

          // 4인 버프점수: "4인X,XXX,XXX" (인챈트리스 등)
          const buff4Match = searchLine.match(/4인\s*([\d,]+)/);
          if (buff4Match && isBufferJob(jobGrowName)) {
            buffPower = parseInt(buff4Match[1].replace(/,/g, ''), 10);
            break;
          }

          // 다음 서버명이 나오면 현재 블록 종료
          if (SERVER_NAME_MAP[searchLine]) break;
        }

        if (characterName) {
          characters.push({
            characterName,
            jobGrowName,
            serverId: detectedServerId,
            adventureName,
            damage,
            buffPower,
          });
        }

        i++; // 직업명 줄 건너뛰기
      }
    }
  }

  return { adventureName, serverId, characters };
}
