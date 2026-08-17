# Components

> 공통·도메인 컴포넌트 카탈로그. 신규 화면은 여기 있는 것을 **먼저 재사용**한다.

---

## 1. 앱 셸·프레임

| 컴포넌트 | 경로 | 책임 |
|----------|------|------|
| `AppFrame` | `src/components/AppFrame.tsx` | 가운데 정렬 앱 셸 (max 540px) |
| `FigmaAssetFrame` | `src/components/FigmaAssetFrame.tsx` | 393×852 비율로 Export 이미지 + children 오버레이 |
| `IphoneStatusBar` | `src/components/IphoneStatusBar.tsx` | 스플래시용 상태바 |
| `LoopinLogo` | `src/components/LoopinLogo.tsx` | 로고 |
| `LoginMascot` / `MascotCharacter` | `src/components/...` | 로그인 마스코트 |

### `FigmaAssetFrame` props

| Prop | 설명 |
|------|------|
| `src` | `/assets/...` |
| `alt` | 접근성 |
| `bgClassName` | 바깥 배경 (기본 `bg-white`) |
| `children` | absolute 오버레이 |

이미지는 `pointer-events-none` — 클릭은 children만.

---

## 2. 온보딩

| 컴포넌트 | 경로 | 비고 |
|----------|------|------|
| `StudentOnboardingScreen` | `pages/onboarding/` | 5단계 |
| `TeacherOnboardingScreen` | `pages/onboarding/` | 4단계 |
| `MemberTypeScreen` | `pages/MemberTypeScreen.tsx` | Figma 에셋 없음 — 좌표를 `온보딩_학년선택`과 동일하게 직접 잡는다 |
| `BirthdatePicker` | `components/onboarding/` | 생년월일 |
| `onboarding-ui` | `components/onboarding/onboarding-ui.tsx` | `CircleCheckbox` · `NextStepButton` · `TermsStep` · `NEXT_BTN`/`INPUT_FIELD` |
| `onboarding-typography` | `components/onboarding/onboarding-typography.ts` | **온보딩 타이포·버튼 토큰 단일 소스** (`docs/design.md` 참고) |

온보딩 화면에서 `text-[NNpx]` / `rounded-[NNpx]` / `font-['…']`를 직접 쓰지 않는다 —
전부 `onboarding-typography.ts` 토큰을 재사용한다. 시안 이미지에 글자·버튼이 구워져
있어서 값이 어긋나면 상태 전환 때 크기가 튄다.

`CircleCheckbox` / `NextStepButton` 공통 props:

| prop | 기본 | 의미 |
|------|------|------|
| `hasBakedRing` | `true` | 시안에 회색 링이 있으므로 **선택됐을 때만** 파란 원을 덮어 그림 |
| `hasBakedButton` | `true` | 시안에 회색 비활성 버튼이 있으므로 비활성일 땐 투명 히트만 |
| `label` (버튼) | `'다음'` | 버튼 글자 |

---

## 3. 메인 홈·맵

| 컴포넌트 | 경로 | 책임 |
|----------|------|------|
| `MainHomeScreen` | `pages/MainHomeScreen.tsx` | 초대·맵·전체 학습 step 오케스트레이션 |
| `AssignmentReceivedScreen` | `main-home/` | 성 맵, 클릭, 상태 마커 배치 |
| `CastleAssignedFlag` | `main-home/` | **부여·미시작 성 = 깃발**. 구워진 자물쇠를 덮는다 · `next`면 바운스 |
| `MissionCheckBadge` | `main-home/` | 완료 성 = 별표. 깃발과 같은 원형 뱃지 계열(글리프만 다름) |
| `CastleStatusPill` | `main-home/CastleRetryingPill.tsx` | 진행중·재도전 코랄 필 |
| `MainHomeBottomNav` | `main-home/` | 하단 탭바 고정 (`main-home-bottom-nav.svg` + 투명 히트). **바 전체 탭 → 설정 창** |
| `SettingsWindow` | `settings/` | Figma `설정 창` 풀스크린 오버레이 (`settings-window.svg` 401×852). 이름·연동=온보딩/로그인 React 오버레이 · 학년 변경=`SettingsGradeSheet`(중1·2·3) · 나머지 문구는 에셋 |
| `SettingsGradeSheet` | `settings/` | 설정 학년 변경 바텀시트. 선택지 **중1·중2·중3**만 · 저장값 `중학교 n학년` |
| `ReviewMainWindow` | `review/` | 복습하기 오버레이. **이 화면만 Figma 이미지 오버레이를 쓰지 않고 직접 그린다** — 시안 글자가 벡터 path라 유형명·정답률을 코드로 못 바꿈. 데이터 로딩 담당이며 표시는 `ReviewMainContent` |
| `assignment-home.ts` | `main-home/` | 좌표·`TEST_STARS`·스타일 헬퍼 |

---

## 4. 연습 공통 (`exercise/`)

| 모듈 | 책임 |
|------|------|
| `ExerciseProgressBar` | 세션 진행률 |
| `session-questions.ts` | 구간별 문제 수·offset·`SESSION_TOTAL_STEPS` |
| `session-results.ts` | 결과 ID, 정오답 카운트, 오답 재시도 스냅샷 |
| `retry-wrong-ui.ts` | 오답만 풀기 props 타입 |
| `RetryWrongCompleteSheet` | 재시도 완료 시트 |
| `answer-sfx.ts` | 탭/정오답 사운드 |
| `use-enter-to-continue.ts` | Enter로 진행 |
| `exercise-typography.ts` | 연습 타이포 |
| `ChunkOrderRow` / `ChunkBankTile` | 본문 A/B 청크 꾹 드래그·사이 삽입 |
| `chunk-pointer-drag.ts` | 포인터 삽입 인덱스 계산 |

재시도 props 패턴 (`RetryWrongExerciseProps`):

- `hideProgressBar`
- `isFinalRetrySection`
- `onRetryFlowHome`

---

## 5. 학습 유형 화면

| 화면 | 경로 | 데이터 |
|------|------|--------|
| `WordMatchScreen` | `word-match/` | 단어 A · 영문↔한글 짝맞추기 |
| `WordListenMatchScreen` | `word-listen-match/` | 단어 B · TTS 뜻 짝맞추기 (듣기↔한글) |
| `WordQuizScreen` | `word-quiz/` | 단어 C · 3지선다 *(구 B)* |
| `WordSpellScreen` | `word-spell/` | 단어 D · 예문 빈칸 *(구 C)* |
| `BodyTextA/B/CScreen` | `body-text-*` | 본문 문제 |
| `GrammarType1Screen` | `grammar-type-1/` | O/X 등 |
| `GrammarType2Screen` | `grammar-type-2/` | 선택형 |
| `CastleLearningScreen` | `castle-learning/` | 학습1~4, 한국어 TTS |
| `LearningCompleteScreen` | `learning-complete/` | 단어 파트 완료 |
| `PartCompleteScreen` | `part-complete/` | 문장 파트 · 문법 파트 완료 (같은 시안 공유) |
| `BodyTextCompleteScreen` | `body-text-complete/` | 본문 완료 (레거시 데모 세션) |
| `GrammarCompleteScreen` | `grammar-complete/` | 점수·재시도 CTA |

공통 props 관례:

- `sessionOffset` — 전체 진행률 계산용
- `onAnswer(stepId, isCorrect)` — 세션 결과 기록
- `onComplete` — 다음 step
- `questions` / `retryPairIds` — 오답만 풀기 시 주입

---

## 6. 재사용 규칙

1. 새 화면은 `FigmaAssetFrame` + 투명 히트 영역부터 검토
2. 세션에 속하면 `onAnswer` + `session-*` ID 규칙을 따를 것
3. 선택지 텍스트를 React로 중복 렌더하지 말 것
4. 사운드/TTS는 기존 `answer-sfx` / `speech-ko` / `word-quiz` 유틸 사용
5. 전역 Context를 성급히 도입하지 말 것 — API 연동 시점에 데이터 계층 설계 ([student-teacher-sync.md](./student-teacher-sync.md))

---

## 7. 레거시 CSS 패턴

`index.css`에 남아 있는 클래스 (점진적 Tailwind 이관):

| 클래스 | 용도 |
|--------|------|
| `.screen--blue` / `.screen--white` | 배경 |
| `.social-button--apple` / `--kakao` | 로그인 |
| `.radio-option` | 회원 유형 |
| `.primary-button` | CTA (레거시 색 `#5CB5E8` 주의) |
