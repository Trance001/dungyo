/**
 * 직업 카테고리 및 코드 매핑
 * 코드는 영구적으로 유지해야 하므로 기존 매핑을 변경하지 않고 신규 직업만 끝에 추가한다
 */

export interface JobEntry {
  name: string;
  code: number;
  isBuffer: boolean;
}

export interface JobCategory {
  category: string;
  jobs: JobEntry[];
}

/**
 * 전체 직업 카테고리 목록
 * B = 버퍼 직업
 */
export const JOB_CATEGORIES: JobCategory[] = [
  {
    category: '귀검사(남)',
    jobs: [
      { name: '웨펀마스터', code: 0, isBuffer: false },
      { name: '소울브링어', code: 52, isBuffer: false },
      { name: '버서커', code: 3, isBuffer: false },
      { name: '아수라', code: 2, isBuffer: false },
      { name: '검귀', code: 56, isBuffer: false },
    ],
  },
  {
    category: '귀검사(여)',
    jobs: [
      { name: '소드마스터', code: 1, isBuffer: false },
      { name: '다크템플러', code: 4, isBuffer: false },
      { name: '데몬슬레이어', code: 5, isBuffer: false },
      { name: '베가본드', code: 6, isBuffer: false },
      { name: '블레이드', code: 53, isBuffer: false },
    ],
  },
  {
    category: '격투가(남)',
    jobs: [
      { name: '넨마스터', code: 7, isBuffer: false },
      { name: '스트라이커', code: 8, isBuffer: false },
      { name: '스트리트파이터', code: 9, isBuffer: false },
      { name: '그래플러', code: 57, isBuffer: false },
    ],
  },
  {
    category: '격투가(여)',
    jobs: [
      { name: '넨마스터', code: 7, isBuffer: false },
      { name: '스트라이커', code: 8, isBuffer: false },
      { name: '스트리트파이터', code: 9, isBuffer: false },
      { name: '그래플러', code: 57, isBuffer: false },
    ],
  },
  {
    category: '거너(남)',
    jobs: [
      { name: '레인저', code: 10, isBuffer: false },
      { name: '런처', code: 11, isBuffer: false },
      { name: '메카닉', code: 12, isBuffer: false },
      { name: '스핏파이어', code: 13, isBuffer: false },
      { name: '어썰트', code: 58, isBuffer: false },
    ],
  },
  {
    category: '거너(여)',
    jobs: [
      { name: '레인저', code: 10, isBuffer: false },
      { name: '런처', code: 11, isBuffer: false },
      { name: '메카닉', code: 12, isBuffer: false },
      { name: '스핏파이어', code: 13, isBuffer: false },
      { name: '패러메딕', code: 50, isBuffer: true },
    ],
  },
  {
    category: '마법사(남)',
    jobs: [
      { name: '엘레멘탈 바머', code: 14, isBuffer: false },
      { name: '빙결사', code: 59, isBuffer: false },
      { name: '블러드 메이지', code: 17, isBuffer: false },
      { name: '스위프트 마스터', code: 16, isBuffer: false },
      { name: '디멘션 워커', code: 18, isBuffer: false },
    ],
  },
  {
    category: '마법사(여)',
    jobs: [
      { name: '엘레멘탈마스터', code: 19, isBuffer: false },
      { name: '소환사', code: 21, isBuffer: false },
      { name: '배틀메이지', code: 20, isBuffer: false },
      { name: '마도학자', code: 22, isBuffer: false },
      { name: '인챈트리스', code: 23, isBuffer: true },
    ],
  },
  {
    category: '프리스트(남)',
    jobs: [
      { name: '크루세이더', code: 24, isBuffer: true },
      { name: '인파이터', code: 25, isBuffer: false },
      { name: '퇴마사', code: 26, isBuffer: false },
      { name: '어벤저', code: 27, isBuffer: false },
    ],
  },
  {
    category: '프리스트(여)',
    jobs: [
      { name: '크루세이더', code: 24, isBuffer: true },
      { name: '이단심판관', code: 28, isBuffer: false },
      { name: '무녀', code: 60, isBuffer: false },
      { name: '미스트리스', code: 61, isBuffer: false },
    ],
  },
  {
    category: '도적',
    jobs: [
      { name: '로그', code: 30, isBuffer: false },
      { name: '사령술사', code: 55, isBuffer: false },
      { name: '쿠노이치', code: 31, isBuffer: false },
      { name: '섀도우댄서', code: 32, isBuffer: false },
    ],
  },
  {
    category: '나이트',
    jobs: [
      { name: '엘븐나이트', code: 34, isBuffer: false },
      { name: '카오스', code: 35, isBuffer: false },
      { name: '팔라딘', code: 36, isBuffer: false },
      { name: '드래곤나이트', code: 37, isBuffer: false },
    ],
  },
  {
    category: '마창사',
    jobs: [
      { name: '뱅가드', code: 38, isBuffer: false },
      { name: '듀얼리스트', code: 39, isBuffer: false },
      { name: '드래고니안 랜서', code: 41, isBuffer: false },
      { name: '다크 랜서', code: 40, isBuffer: false },
    ],
  },
  {
    category: '총검사',
    jobs: [
      { name: '히트맨', code: 42, isBuffer: false },
      { name: '요원', code: 43, isBuffer: false },
      { name: '트러블 슈터', code: 45, isBuffer: false },
      { name: '스페셜리스트', code: 44, isBuffer: false },
    ],
  },
  {
    category: '아처',
    jobs: [
      { name: '뮤즈', code: 29, isBuffer: true },
      { name: '트래블러', code: 48, isBuffer: false },
      { name: '헌터', code: 49, isBuffer: false },
      { name: '비질란테', code: 51, isBuffer: false },
      { name: '키메라', code: 54, isBuffer: false },
    ],
  },
  {
    category: '외전',
    jobs: [
      { name: '다크나이트', code: 46, isBuffer: false },
      { name: '크리에이터', code: 47, isBuffer: false },
    ],
  },
];

// --- 코드 ↔ 이름 매핑 (코덱용) ---

const nameToCode = new Map<string, number>();
const codeToName = new Map<number, string>();

for (const cat of JOB_CATEGORIES) {
  for (const job of cat.jobs) {
    nameToCode.set(job.name, job.code);
    if (!codeToName.has(job.code)) {
      codeToName.set(job.code, job.name);
    }
  }
}

// 이전 이름 호환 (코덱 디코딩용)
const LEGACY_ALIASES: Record<string, number> = {
  '글래시어': 59,     // → 빙결사
  '배가본드': 6,      // → 베가본드
  '시랑': 33,         // 이전 코드 유지
};
for (const [alias, code] of Object.entries(LEGACY_ALIASES)) {
  if (!nameToCode.has(alias)) nameToCode.set(alias, code);
}

/** 직업명 → 숫자 코드. 매핑 없으면 null */
export function jobNameToCode(name: string): number | null {
  const clean = name.replace(/^眞\s*/, '');
  return nameToCode.get(clean) ?? null;
}

/** 숫자 코드 → 직업명 (眞 접두어 포함). 매핑 없으면 null */
export function jobCodeToName(code: number): string | null {
  const name = codeToName.get(code);
  return name ? `眞 ${name}` : null;
}

/** 딜러 직업 카테고리 (버퍼 제외) */
export const DEALER_JOB_CATEGORIES: JobCategory[] = JOB_CATEGORIES
  .map((cat) => ({
    category: cat.category,
    jobs: cat.jobs.filter((j) => !j.isBuffer),
  }))
  .filter((cat) => cat.jobs.length > 0);

/** 버퍼 직업 카테고리 */
export const BUFFER_JOB_CATEGORIES: JobCategory[] = JOB_CATEGORIES
  .map((cat) => ({
    category: cat.category,
    jobs: cat.jobs.filter((j) => j.isBuffer),
  }))
  .filter((cat) => cat.jobs.length > 0);
