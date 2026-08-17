# 루핀 학생 앱 — 에이전트 공용 규칙

> **이 파일이 단일 소스입니다.** Cursor와 Claude Code가 **둘 다** 이 파일을 읽습니다.
> - Cursor: `AGENTS.md`를 네이티브로 읽음 + `.cursor/rules/shared-agents.mdc`가 한 번 더 지시
> - Claude Code: `CLAUDE.md`가 `@AGENTS.md`로 임포트
>
> 규칙을 바꿀 땐 **이 파일만** 고치세요. `CLAUDE.md`에 내용을 되돌려 넣지 마세요 —
> 두 도구가 서로 다른 규칙을 보게 되는 원인이 됩니다.

## 먼저 읽을 것

**`HANDOFF.md`** (이 리포 루트) — 출시 준비(2026-08-12)를 하며 밟았던 함정을 모아
뒀습니다. 규칙이 아니라 **배경**입니다. 아래를 건드리기 전에는 반드시 보세요.

- **채점·점수 집계** — 앱이 DB 트리거에 의존합니다(마이그레이션 012). 앱에서 점수를
  다시 계산하지 마세요.
- **비슷해 보이는 개념 구분** — 「연습 모드」와 「복습 합성본」, 「재도전 표시」와
  「새 attempt 시작」. 묶으면 틀린문제만이 전체를 다시 내거나 매번 처음부터 풀립니다.
- **`public/assets`에 파일 추가** — 넣는 건 전부 학생 기기로 배포됩니다. 원본·백업은
  `_design-source/`로.
- **화면 높이** — `min-h-dvh` 금지, `min-h-full`을 쓰세요. 짧은 화면에서 프레임 밖으로
  나갑니다.
- **검증 방법** — Chrome 확장 없이 실제 브라우저로 확인하는 법이 적혀 있습니다.
  점검 시 Supabase는 반드시 차단하세요.

## 언어

결과값과 설명은 무조건 한글로 작성한다. 코드/식별자/커밋 메시지의 영어 규칙은 그대로 따르되, 사용자에게 보여주는 설명·요약·주석은 한국어로 작성한다.

## Commands

```bash
npm install
npm run dev       # Vite dev server, http://localhost:5173
npm run build     # tsc -b && vite build — this is the only pre-PR gate
npm run preview   # preview the production build
```

No lint script and no test suite exist. `npm run build` (type-check + build) is the only automated check — always run it before considering a change done.

## Product context

This is the **student-facing** half of Loopin, a Korean B2G middle-school English 내신(exam) prep product. Supabase sync (Anonymous Auth, invite-code enrollment via `enroll_with_invite_code` RPC, attempt/answer recording, content snapshots) is genuinely implemented in `src/lib/sync/` — the docs have been corrected (2026-07-21) to stop saying "no backend"; verify against actual code (`src/lib/sync/`) if a doc ever drifts again rather than trusting it blindly. Never write documentation that presents mock/TBD behavior as confirmed live backend behavior, or vice versa (this is an explicit, repeated rule in the docs).

The teacher-facing counterpart is a separate repo, `loopin-project` (`loopin-web/`), with its own `AGENTS.md`.

**Before implementing anything, read `docs/INDEX.md` first**. Then check the relevant `docs/screens/*.md`, `docs/uiux.md` (flows), `docs/figma.md` (asset/overlay rules), and `docs/architecture.md` (route vs. `MainHomeScreen` step decision).

## Architecture

**학생 메인(학원/학교):**
| Spoken name | Real route | Code |
|-------------|------------|------|
| 학원/학교 학생 메인 (구어 “student/main” · “메인”) | **`/student/home`** | `MainHomeScreen` / `main-home/` |

There is **no** `/student/main` route. If the user says “메인” / “학원 메인” / “학교 메인”, use `/student/home`.

> **삭제 (2026-08-11):** 혼자 공부·커리큘럼 (`/student/curriculum`, `/student/curriculum/main`, `CurriculumMainScreen`, `curriculum-main/`)은 제품에서 제외·코드 제거됨.

**Two navigation layers, don't confuse them:**
- Real routes (`src/App.tsx`, React Router 7, `BrowserRouter`): `/` (splash) → `/login` → `/onboarding/member-type` → `/onboarding/student` or `/onboarding/teacher` → **`/student/home`** (초대·성 맵). `/teacher/home` and `/student/home` render the **same** `HomeScreen`/`MainHomeScreen` (`memberType` prop only).
- Everything **inside** the academy/school home (invite → castle map → word-match/…/praise-calendar) is **not URL-routed** — `step` state in `MainHomeScreen.tsx`.

**Per-screen module convention.** Each learning screen lives in its own kebab-case folder under `src/components/`, pairing a PascalCase component with a same-named lowercase `.ts` helper/constants file, e.g. `word-match/WordMatchScreen.tsx` + `word-match/word-match.ts`, `castle-learning/CastleLearningScreen.tsx` + `castle-learning/castle-learning.ts` (+ `speech-ko.ts` for TTS script). Follow this pairing when adding a new screen rather than inlining constants/helpers into the component file.

**Figma asset pattern (differs from the teacher repo's inline-SVG approach): image overlay, not inline SVG.** `src/components/FigmaAssetFrame.tsx` renders the exported Figma frame as an `<img>` (393×852 aspect, `pointer-events-none`, capped at 540px wide, centered — no tablet/desktop layout exists) and screen components lay real interactive elements (buttons, tiles, inputs) as absolutely-positioned children on top, using per-screen pixel-rect helpers (e.g. `figmaRectStyle` in `word-match.ts`). Never re-render Figma text/choice labels in React over the image — that causes visual duplication; only add borders/state overlays (see `TileVisualState` pattern in `WordMatchScreen.tsx`). No `@` path alias exists here (unlike `loopin-project`) — use relative imports.

**Sync (`src/lib/sync/`):** `supabase-client.ts` exposes `isSyncEnabled()`/`getSupabase()`, gated on `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (`.env.local`). `student-api.ts` handles anonymous auth (`ensureStudentSession`), enrollment, and attempt/progress mapping. `features/assignments/build-session-sections.ts` converts teacher-authored question data into the same screen components used for the baked demo content (`WordMatchScreen` etc. take `pairs`/props instead of using `DEFAULT_*` demo data) — preserves exact Figma visual fidelity for real content too. **Defensive rule from the docs, apply it everywhere sync touches teacher data:** malformed data (missing brackets in fill-blank answers, `choices: "-"`, invalid O/X, <3 choices) must be excluded from generation, never guessed/defaulted — "showing a wrong problem is worse than not generating one."

**There is no demo bypass anymore.** `MainHomeScreen.tsx`'s `tryEnter()` checks `isSyncEnabled()` first and blocks entry with an error ("서버 연결이 없어요...") if Supabase env vars are absent — the old hardcoded `"TEST"` invite code and the `'waiting'` step are dead/unreachable code as of the current codebase (docs previously described `"TEST"` as live; that was stale and has been corrected 2026-07-21 — re-verify against `tryEnter()` before trusting any doc's demo-path description again). A real invite code, issued by a teacher via `loopin-project`, is required to enter.

**TTS:** `src/lib/tts/loopin-tts.ts` calls a Supabase Edge Function (`loopin-tts`, Azure Neural voices) — not the browser's default `speechSynthesis`, which is only the fallback. Requires `supabase functions deploy loopin-tts` in the target project; see `.env.example`. Any screen using audio must stop playback on navigation away (existing PR checklist item — see below).

## Design constraints (from docs/uiux.md, docs/design.md, docs/figma.md)

- Pixel-accurate to Figma: no arbitrary color/copy/spacing changes without design sign-off.
- Never render duplicate text over the Figma image; no "preview" highlighting of correct answers before a question is answered.
- All interactive overlays need `aria-label` (they're visually transparent over the image).
- Tailwind utilities preferred over legacy CSS classes. Watch for two coexisting blue tokens — legacy `#5CB5E8` vs current `--color-loopin-blue` `#2AA3FF`; using the wrong one is a known recurring regression.

## Adding a new screen — checklist (from docs/development.md)

- Route page: add the component under `src/pages/`, register the `Route` in `App.tsx`, write `docs/screens/[name].md`, update the `docs/INDEX.md` status table.
- Learning step: add the feature folder under `src/components/`, extend the `MainStep` union + render branch in `MainHomeScreen.tsx`, update `session-questions`/`session-results` IDs/counts if applicable, update `docs/screens/learning-session.md` or `castle-learning.md`.
- New Figma asset: export to `public/assets/`, rename to ASCII/kebab-case where feasible, wire into code, bump a `?v=` query param if cache-busting is needed, update the rename table in `docs/figma.md`.

## PR checklist (from docs/development.md — apply before calling anything done)

- Visual check against Figma at 393px width.
- No duplicate-rendered choice/label text.
- No answer-preview highlighting.
- Transparent overlay buttons have `aria-label`.
- TTS/audio stops on screen exit.
- `npm run build` passes.
- Relevant `docs/` updated (INDEX, screen doc, figma rename table).
- Docs never describe mock/TBD behavior as confirmed/live.

## Known issues (documented, don't silently "fix" without updating docs)

- Login wipes previous stored auth on every attempt — returning-user flow is known-broken by design.
- ~~`TeacherOnboardingScreen`의 `schoolName`/`teacherName` 바인딩이 뒤바뀐 것 같다~~ → **2026-08-02 확인·수정 완료.** 실제로 뒤바뀌어 있었고, 입력값이 저장조차 되지 않았다. 관련해서 알아둘 것: 온보딩 SVG **파일명이 내용과 반대**다 — `onboarding-teacher-02-school.svg`가 "이름을 적어주세요" 화면, `onboarding-teacher-03-name.svg`가 "학교명을 적어주세요" 화면. 파일명만 보고 판단하지 말 것.
- 이름 입력 제한(2~5자·특수문자 불가)은 이름 화면 SVG에 **그림으로 박혀 있다.** 상수·필터는 `components/onboarding/onboarding-ui.tsx`의 `NAME_MIN_LENGTH` / `NAME_MAX_LENGTH` / `sanitizeNameInput`에 모여 있고 학생·선생님 온보딩이 공유한다. 숫자를 바꾸려면 SVG 문구도 같이 바꿔야 한다.
- Some asset paths referenced in docs/code may not have a corresponding file yet.
- Learning progress resets on refresh (`SessionResults` is in-memory only) for the old demo session path.

## 교사 웹(`loopin-project/loopin-web`)과 맞물리는 부분

두 리포는 별개 git 프로젝트라 한쪽만 고치면 조용히 어긋난다. 아래를 바꾸면 **반드시 반대쪽도 같이 확인**한다.

| 무엇 | 이쪽(학생앱) | 반대쪽(교사 웹) |
|------|-------------|----------------|
| 문항 id 접미사 | `build-session-sections.ts`가 만든다 (`:match` `:ox` `:ox:fix` 등) | `parseAnswerQuestionId` (`src/lib/sync/teacher-sync.ts`)가 파싱 |
| 유형 라벨 | `snapshot.problemTypes.*` 문자열 비교 | `TYPE_SUFFIX_LABEL` / `TYPE_LABEL`, `GRAMMAR_TYPE_OPTIONS` |
| 선택지 개수 | `buildOxXCorrection`이 3개 미만이면 문항을 만들지 않음 | `validate-problem-item.ts` (교정 문제 3개 필수) |
| 스냅샷 형태 | `src/lib/sync/types.ts`의 `ContentSnapshot` | `src/lib/sync/content-snapshot.ts` |
| 문법 개념 | 복습 분류가 `grammar[].major`로 갈린다 (`features/review/review-types.ts`) | `content-snapshot.ts`가 문제은행 `major`/`minor`를 실어 보냄 |
| 단원 | 복습 분류(단어·문장)가 스냅샷의 `grade`+`textbook`+`unit`으로 갈린다. 셋 중 하나라도 비면 다른 단원과 뭉친다 | `content-snapshot.ts`가 `getUnitContent({grade, textbook, unit})`로 채움. 파트 묶는 키도 학년·교과서·단원 3개 (`problem-sets.ts`) |

교사가 만든 문제집은 유형을 **라벨 문자열**로 저장한다. 교사 쪽 출제 목록에서 유형이 빠져도
과거 문제집에는 그 라벨이 남아 있으므로, 여기 빌더를 지우면 과거 문제집이 조용히 깨진다.
(예: `선택형 문제`는 2026-08-02 교사 출제 목록에서 빠졌지만 `buildGrammarType1Sections`는 유지한다.)

## 다른 에이전트와 같은 워킹트리를 쓴다

- 파일을 고치기 전에 이미 수정돼 있는지 확인한다 (`git status`).
- 커밋되지 않은 남의 변경을 되돌리거나 덮어쓰지 않는다.
- 큰 리팩터링 전에는 사용자에게 먼저 알린다.
