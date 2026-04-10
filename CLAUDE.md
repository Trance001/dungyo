# DNF GYO (던전앤파이터 버퍼교환 도우미)

## 프로젝트 개요
던전앤파이터 버퍼교환 시스템을 위한 최적 파티 구성 도우미 웹 애플리케이션.
네오플 오픈 API를 통해 모험단 내 캐릭터를 검색하고, 레이드/파티 유형에 따라 최적의 딜러·버퍼·업둥 조합을 추천한다.

## 기술 스택
- **Framework**: React 19 + Vite + TypeScript
- **UI**: Tailwind CSS v4 + shadcn/ui
- **상태관리**: Zustand
- **라우팅**: React Router v7
- **스토리지**: localStorage (추후 Firebase 마이그레이션 대비 추상화)
- **API 프록시**: Cloudflare Workers
- **배포**: GitHub Pages (정적 빌드)

## 디렉토리 구조
```
src/
├── domain/          # 비즈니스 모델 (Entity, DTO, Enum)
├── services/        # 외부 API 호출, 스토리지 추상화
├── stores/          # Zustand 스토어
├── hooks/           # 커스텀 React 훅
├── components/
│   ├── ui/          # shadcn/ui 컴포넌트 (자동 생성, 수정 금지)
│   ├── common/      # 공통 재사용 컴포넌트
│   └── features/    # 도메인별 컴포넌트
├── pages/           # 라우트 페이지 컴포넌트
├── lib/             # 유틸리티 함수
└── config/          # 상수, 환경 설정
```

---

## React + TypeScript 코딩 규칙 (반드시 준수)

### 1. 컴포넌트는 반드시 함수 선언문으로 작성
```tsx
// O
export function CharacterCard({ character }: CharacterCardProps) { ... }

// X arrow function export
export const CharacterCard = ({ character }: CharacterCardProps) => { ... }
```

### 2. Props는 반드시 interface로 명시적 선언
```tsx
interface CharacterCardProps {
  character: Character;
  onSelect?: (id: string) => void;
}
```

### 3. 비즈니스 로직은 컴포넌트에서 분리
- 도메인 로직 → `domain/` 또는 `services/`
- 상태 로직 → `stores/` (Zustand)
- 컴포넌트는 표현(렌더링)에만 집중

### 4. 커스텀 훅으로 side effect 캡슐화
- API 호출, 구독, 타이머 등은 반드시 커스텀 훅으로 감싸기
- 훅 이름은 `use` 접두사 필수 (예: `useCharacterSearch`)

### 5. shadcn/ui 컴포넌트는 직접 수정하지 않기
- `src/components/ui/` 내 파일은 shadcn CLI로 생성된 원본 유지
- 커스텀이 필요하면 `components/common/`에 래퍼 컴포넌트 생성

### 6. 상태 관리 계층 구분
- **서버 상태**: API 응답 캐시 → Zustand + 커스텀 훅
- **UI 상태**: 로컬 컴포넌트 상태 → `useState`
- **전역 상태**: 앱 전체 공유 → Zustand 스토어
- **영속 상태**: 클리어 기록 등 → Storage 추상화 레이어

### 7. 타입 안전성 최우선
- `any` 사용 금지 (불가피한 경우 `unknown` + 타입 가드)
- API 응답은 반드시 DTO 타입으로 정의 후 Entity로 변환
- Enum 대신 `as const` union type 사용 권장

### 8. import 순서 규칙
```tsx
// 1. React / 외부 라이브러리
// 2. @/ alias (내부 모듈)
// 3. 상대 경로
// 4. 타입 import (type 키워드)
```

### 9. 에러 처리 패턴
- API 호출은 `Result<T, E>` 패턴 또는 명시적 try-catch
- 사용자에게 보여주는 에러 메시지는 한국어로
- console.error는 개발 환경에서만

### 10. 테스트 작성 원칙
- 도메인 로직(`domain/`)은 반드시 단위 테스트 작성
- 순수 함수 우선 설계로 테스트 용이성 확보
- 컴포넌트 테스트보다 비즈니스 로직 테스트 우선

---

## 코더-리뷰어 워크플로우 (반드시 준수)

코드를 변경할 때 다음 프로세스를 반드시 따른다:

### 코더 역할 (코드 작성 시)
1. 코드를 작성/수정한다
2. `npm run build`가 PostToolUse hook으로 자동 실행된다
3. 빌드 실패 시 → 오류를 수정하고 다시 빌드가 통과할 때까지 반복한다
4. 빌드 성공 후 → 아래 "자체 리뷰 체크리스트"를 수행한다

### 자체 리뷰 체크리스트 (빌드 성공 후 반드시 수행)
변경한 코드에 대해 아래 항목을 하나씩 점검하고, 위반 사항이 있으면 즉시 수정한다:

- [ ] 위 코딩 규칙(1~10번)을 모두 준수하는가?
- [ ] "절대 피해야 할 작업방식"에 해당하는 코드가 없는가?
- [ ] 새로 추가된 domain/ 함수에 단위 테스트가 필요한가? 필요하면 작성한다
- [ ] `any` 타입이 사용되지 않았는가?
- [ ] import 순서가 올바른가? (외부 → @/ → 상대 → type)
- [ ] 비즈니스 로직이 컴포넌트에 직접 작성되지 않았는가?

### 위반 발견 시 플로우
위반 발견 → 코드 수정 → 빌드 재실행(자동) → 재점검 → 모두 통과 시 응답 완료

---

## 절대 피해야 할 작업방식

1. **컴포넌트 안에서 직접 fetch/API 호출 금지** → 반드시 서비스 레이어 경유
2. **인라인 스타일 사용 금지** → Tailwind 클래스 사용
3. **하드코딩된 문자열/숫자 금지** → `config/constants.ts`에 정의
4. **useEffect 안에서 상태 업데이트 체인 금지** → Zustand 액션으로 대체
5. **index.ts 배럴 파일 남용 금지** → 순환 참조 위험, 필요한 곳만 사용
