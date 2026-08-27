# Architecture

> 학생용 `loopin-webapp` 기술 구조. **`.env.local`에 Supabase 환경변수가 없으면 백엔드 없음** —
> 있으면 Anonymous Auth·초대코드 가입·진도 동기화가 동작한다 (`src/lib/sync/`,
> [student-teacher-sync.md](./student-teacher-sync.md)). 목업/TBD와 실제 동작 구분은
> §8, §5.4 참고.

---

## 1. 스택

| 계층 | 기술 |
|------|------|
| UI | React 19 + TypeScript 5.8 |
| 빌드 | Vite 6 |
| 스타일 | Tailwind CSS 4 (`@theme` in `src/index.css`) |
| 라우팅 | React Router 7 (`BrowserRouter`) |
| 상태 | 컴포넌트 `useState` / `useRef` (전역 스토어 없음) |
| 인증 저장 | `localStorage` 키 `haksup_auth` |

스크립트: `dev` / `build` (`tsc -b && vite build`) / `preview`  
테스트·린트·CI: **없음** (TBD)

---

## 2. 디렉터리

```
src/
  App.tsx                 # 라우트
  main.tsx
  index.css               # 토큰 + 레거시 클래스
  lib/auth.ts             # 목업 인증
  pages/                  # 라우트 페이지
    MainHomeScreen.tsx    # 학원/학교 메인 (/student/home)
  components/
    AppFrame.tsx
    FigmaAssetFrame.tsx
    main-home/            # 학원/학교 · 초대·성 맵
    word-match|quiz|spell/
    body-text-a|b|c/
    grammar-type-1|2/
    castle-learning/      # 학습1~4 + TTS
    exercise/             # 진행률·결과·재시도·SFX
    onboarding/
    learning-complete/
    ...
public/assets/            # Figma Export + audio/
docs/                     # 이 문서 세트
```

---

## 3. 라우팅

`src/App.tsx`:

| 경로 | 컴포넌트 | 비고 |
|------|----------|------|
| `/` | `SplashScreen` | |
| `/login` | `LoginScreen` | |
| `/onboarding/member-type` | `MemberTypeScreen` | |
| `/onboarding/student` | `StudentOnboardingScreen` | |
| `/onboarding/teacher` | `TeacherOnboardingScreen` | |
| **`/student/home`** | `HomeScreen` → `MainHomeScreen` | **학원/학교 메인** (초대·성 맵). 구어 “student/main”도 여기 |
| `/teacher/home` | `HomeScreen` → `MainHomeScreen` | 학생 홈과 동일 UI |
| `*` | `/`로 리다이렉트 | |

> **`/student/main` 라우트는 없다.** 학원·학교 메인 = `/student/home`.  
> 혼자 공부·커리큘럼 라우트는 **삭제**(2026-08-11).

가드는 라우트 wrapper가 아니라 각 페이지 `useEffect`에서 `getStoredAuth()` 후 `navigate`한다.

**학원/학교 학습 화면은 URL이 아니다.** `MainHomeScreen`의 `step` 상태가 화면을 전환한다.

---

## 4. 인증 (현재 구현)

`src/lib/auth.ts`:

```ts
type AuthUser = {
  id: string
  provider: 'apple' | 'kakao'
  memberType?: 'student' | 'teacher'
  onboardingCompleted: boolean
}
```

| 동작 | 설명 |
|------|------|
| 로그인 | 목업 사용자 생성·저장. **매 로그인 시 기존 auth 클리어** |
| 온보딩 완료 | `onboardingCompleted: true`만 반영 (프로필 필드 미저장) |
| 서버 | 없음 — 토큰·만료·검증 없음 |

---

## 5. MainHomeScreen 상태 머신

파일: `src/pages/MainHomeScreen.tsx`

### 5.1 Step 목록

`invite` → (`waiting` — step은 존재하나 현재 진입 경로 없음, §5.4) → `assignment` →  
`assignment-runner`(동기화 과제 실행, env 필요, [student-teacher-sync.md](./student-teacher-sync.md)) 또는  
`word-match` → `word-quiz` → `word-spell` → `learning-complete` →  
`body-text-a` → `body-text-b` → `body-text-c` → `body-text-complete` →  
`grammar-type-1` → `grammar-type-2` → `grammar-complete`  
및 분기: `learning-1` … `learning-4`, `praise-calendar`(맵 상단 CTA), `streak-calendar`(맵 연속 학습 배지)

### 5.2 세션 결과

- 타입: `SessionResults = Record<string, boolean>`
- ID 규칙: `word-match:wave`, `word-quiz:...`, `body-text-a:...`, 문법 id 등 (`session-results.ts`)
- 총 추적 step 수: `SESSION_TOTAL_STEPS` (현재 29)
- **리로드 시 소실** (메모리 only)
- 성 학습(학습1~4) 퀴즈 결과는 `SessionResults`에 **포함되지 않음**

### 5.3 재시도

- 전체 재시도: 결과 초기화 → `word-match`
- 오답만: `RetrySectionSnapshot`으로 진입 시점 오답 목록 고정 → 섹션 순서 진행

### 5.4 맵 목업 데이터

`assignment-home.ts`의 `TEST_STARS`:

- star 1·2 `assigned: true`
- 완료 플래그는 `MainHomeScreen`의 `round1MissionCompleted` / `star2LearningCompleted`

초대코드: `TEST` 하드코드 우회는 더 이상 없다. `tryEnter()`는 `isSyncEnabled()`가
`false`면 즉시 에러(“서버 연결이 없어요. .env.local을 확인해 주세요”)를 띄우고 진행하지
않으며, `true`일 때만 `enrollWithInviteCode()` → 실제 `enroll_with_invite_code` RPC를
호출한다 (→ [student-teacher-sync.md](./student-teacher-sync.md)). `TEST_STARS` 기반
데모 지도는 `AssignmentReceivedScreen`에 남아 있지만(`assignments` prop이 `undefined`일
때만 렌더), 초대코드 단계가 Supabase 없이는 통과되지 않으므로 현재 이 경로로는 도달하지
않는다. `waiting` step·`WAITING_MS` 3초 타이머 코드는 없다.

---

## 6. 콘텐츠 데이터

문제·정답은 각 feature의 `*.ts` 상수로 번들된다.

| 영역 | 예 |
|------|-----|
| 단어 퀴즈 | `word-quiz/word-quiz.ts` |
| 철자 | `word-spell/word-spell.ts` |
| 본문 | `body-text-a|b|c/*.ts` |
| 문법 | `grammar-type-1|2/*.ts` |
| 성 학습 | `castle-learning/castle-learning.ts` |

서버 CMS/버전 관리 없음. 동기화 시 안정적 content ID가 필요하다 → [student-teacher-sync.md](./student-teacher-sync.md).

---

## 7. 오디오

| 종류 | 구현 |
|------|------|
| 영어 | `word-quiz.ts` — WAV 캐시/`Audio`, fallback `speechSynthesis` |
| 한국어 | `castle-learning/speech-ko.ts` — `speechSynthesis`, Natural 음성 우선 |

일부 문서/코드가 참조하는 단어 WAV가 저장소에 없을 수 있음 → fallback TTS 사용.

---

## 8. 한계 (문서화용)

| 항목 | 상태 |
|------|------|
| Backend / API client | `.env.local`에 `VITE_SUPABASE_*` 설정 시 있음 (`src/lib/sync/`) — 미설정 시 없음 |
| 진도·과제 영속화 | Supabase 연결 시 `attempts`/`answers` 테이블로 있음 — 미설정 시 없음(인메모리) |
| 실제 OAuth | 없음 (로그인은 여전히 목업; Supabase는 Anonymous Auth만 사용, 소셜 로그인과 무관) |
| `loopin-project` 연동 | Supabase 공통 스키마로 있음 (env 필요) — 상세: [student-teacher-sync.md](./student-teacher-sync.md) |
| 단위/E2E 테스트 | 없음 |
| 환경 변수 (`.env`) | `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (`.env.local`) — 없으면 동기화 기능 전체 비활성 |

목표 아키텍처는 공통 API를 단일 진실 공급원으로 두는 것이다. 위 동기화 관련 항목은
Supabase 환경변수가 설정된 경우에만 동작하며, 미설정 시 앱은 목업 동작으로 돌아간다
(단, 초대코드 입력은 목업으로도 통과되지 않는다 — §5.4).
