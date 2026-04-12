/**
 * 직업명 ↔ 숫자 코드 매핑
 * 파티 카드 코드 압축에 사용한다
 * 코드는 영구적으로 유지해야 하므로 기존 매핑을 변경하지 않고 신규 직업만 끝에 추가한다
 */
const JOB_LIST = [
  '웨펀마스터', '소드마스터', '아수라', '버서커',           // 0-3
  '다크템플러', '데몬슬레이어', '배가본드',                 // 4-6
  '넨마스터', '스트라이커', '스트리트파이터',               // 7-9
  '레인저', '런처', '메카닉', '스핏파이어',                 // 10-13
  '엘레멘탈바머', '글래시어', '스위프트 마스터',            // 14-16
  '블러드 메이지', '디멘션 워커',                           // 17-18
  '엘레멘탈마스터', '배틀메이지', '소환사', '마도학자',     // 19-22
  '인챈트리스',                                             // 23
  '크루세이더', '인파이터', '퇴마사', '어벤저',             // 24-27
  '이단심판관', '뮤즈',                                     // 28-29
  '로그', '쿠노이치', '섀도우댄서', '시랑',                 // 30-33
  '엘븐나이트', '카오스', '팔라딘', '드래곤나이트',         // 34-37
  '뱅가드', '듀얼리스트', '다크 랜서', '드래고니안 랜서',   // 38-41
  '히트맨', '요원', '스페셜리스트', '트러블 슈터',         // 42-45
  '다크나이트', '크리에이터',                               // 46-47
  '트래블러', '헌터',                                       // 48-49
  '패러메딕',                                               // 50
  '비질란테',                                               // 51
  '소울브링어', '블레이드',                                 // 52-53
  '키메라',                                                 // 54
  '사령술사',                                               // 55
  '검귀',                                                   // 56
] as const;

const nameToCode = new Map<string, number>();
const codeToName = new Map<number, string>();

for (let i = 0; i < JOB_LIST.length; i++) {
  nameToCode.set(JOB_LIST[i], i);
  codeToName.set(i, JOB_LIST[i]);
}

/** 직업명 → 숫자 코드. 매핑 없으면 null */
export function jobNameToCode(name: string): number | null {
  // '眞 ' 접두어 제거 후 매핑
  const clean = name.replace(/^眞\s*/, '');
  return nameToCode.get(clean) ?? null;
}

/** 숫자 코드 → 직업명 (眞 접두어 포함). 매핑 없으면 null */
export function jobCodeToName(code: number): string | null {
  const name = codeToName.get(code);
  return name ? `眞 ${name}` : null;
}
