# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

The teacher-facing counterpart is a separate repo, `loopin-project` (`loopin-web/`), with its own CLAUDE.md.

**Before implementing anything, read `docs/INDEX.md` first** — especially the **「학생 메인 화면 2종」** section. Then check the relevant `docs/screens/*.md`, `docs/uiux.md` (flows), `docs/figma.md` (asset/overlay rules), and `docs/architecture.md` (route vs. `MainHomeScreen` step decision).

## Architecture

**Two student “main” screens — never mix them up:**
| Spoken name | Real route | Code |
|-------------|------------|------|
| 학원/학교 학생 메인 (구어 “student/main”) | **`/student/home`** | `MainHomeScreen` / `main-home/` |
| 혼자 공부 학생 메인 | **`/student/curriculum/main`** | `CurriculumMainScreen` / `curriculum-main/` |

There is **no** `/student/main` route. If the user says “메인” / “학원 메인” / “학교 메인”, use `/student/home`. If they say “혼자 공부 메인” / “커리큘럼 메인”, use `/student/curriculum/main`.

**Two navigation layers, don't confuse them:**
- Real routes (`src/App.tsx`, React Router 7, `BrowserRouter`): `/` (splash) → `/login` → `/onboarding/member-type` → `/onboarding/student` or `/onboarding/teacher` → **invite** `/student/home` **or** self-study `/student/curriculum` → `/student/curriculum/main`. `/teacher/home` and `/student/home` render the **same** `HomeScreen`/`MainHomeScreen` (`memberType` prop only).
- Everything **inside** the academy/school home (invite → castle map → word-match/…/praise-calendar) is **not URL-routed** — `step` state in `MainHomeScreen.tsx`. Self-study course/main **are** URL routes.

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
- `TeacherOnboardingScreen`'s `schoolName`/`teacherName` field-label-to-state binding may be swapped — verify in code before trusting.
- Some asset paths referenced in docs/code may not have a corresponding file yet.
- Learning progress resets on refresh (`SessionResults` is in-memory only) for the old demo session path.
