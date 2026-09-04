# 인수인계 — 밟으면 다치는 곳 (2026-08-12)

출시 준비를 하며 학생 앱과 교사 웹, Supabase 스키마를 한 번씩 훑었습니다.
**규칙은 `AGENTS.md`가 단일 소스입니다.** 이 문서는 규칙이 아니라, 코드만 봐서는 알기
어려운 **함정과 배경**입니다. 여기 적힌 것 대부분은 제가 실제로 한 번 밟고 고친 것들입니다.

---

## 0. 제일 먼저 — 앱이 DB 트리거에 의존합니다

**마이그레이션 012를 올리지 않으면 점수와 진행률이 0에서 멈춥니다.**

`attempts`의 `score` · `correct_count` · `answered_count` · `progress_percent`는
이제 **서버 트리거가 계산**합니다. 그래서 앱에서 그 값을 올리는 코드를 걷어냈습니다.
트리거가 없으면 답안은 저장되는데 집계가 갱신되지 않습니다.

새 환경(다른 Supabase 프로젝트)에 붙일 때는 `001`~`013`을 **전부** 올려야 합니다.
교사 리포에 `scripts/build-migration-bundle.mjs`가 있어, 한 덩어리로 붙여넣을 수 있습니다.
빠지면 조용히 고장 나는 것들:

| 빠지면 | 증상 |
|---|---|
| 008 | 교사 웹에서 학생을 지워도 되살아남 |
| 009 | 과제 예약 공개가 안 걸리고 즉시 공개됨 |
| 010 | 같은 문항 재응답이 RLS에 막혀 **조용히 유실** |
| 011 | 오류 신고 버튼이 실패 |
| 012 | **점수·진행률이 0에서 멈춤** |
| 013 | 새 테이블에 RLS가 자동으로 안 켜짐 |

---

## 1. 채점·집계 — 두 벌 만들지 마세요

### `client_answer_id`에 시각을 붙이지 말 것

```ts
clientAnswerId: `${attempt.id}:${questionId}`   // 문항당 한 줄
```

예전에는 뒤에 `Date.now()`가 붙어 있었습니다. `answers`는 이 값으로 upsert하는데
시각이 섞이면 덮어쓰기가 영영 안 걸려서 **한 문항에 행이 계속 쌓입니다.** 그 결과:

- 한 번 틀린 문항이 나중에 맞혀도 영원히 오답 → 「틀린문제만」이 사실상 전체를 다시 냄
- 푼 문항 수·점수가 부풀어 50문항 과제가 `48/50` 같은 값을 냄

### 점수를 앱에서 계산하지 말 것

트리거가 답안 표를 세어 덮어씁니다. 앱에서 다시 세면 두 벌이 생기고, 언젠가 어긋납니다.
(위의 `48/50`이 정확히 그렇게 나온 값입니다.)

### 남은 구멍 — `is_correct`는 아직 앱이 정합니다

점수를 한 번에 100으로 쓰는 건 막혔지만, **문항마다 정답이라고 우기는 것**은 못 막습니다.
닫으려면 서버가 스냅샷을 해석해 채점해야 하는데, 유형별 정답 형식이 달라
(`:match` `:choice` `:spell` `:ox` `:ox:fix` …) 학생 앱 문항 생성 로직을 통째로
복제하는 셈입니다. 성적에 정식 반영할 때 제대로 설계해야 합니다.

---

## 2. 비슷해 보이지만 다른 개념 — 한 변수로 묶지 마세요

여기서 두 번 크게 당했습니다.

### 「연습 모드」 ≠ 「복습 합성본」

```ts
practiceOnly       // attempt를 안 열고 점수에 반영하지 않음 (틀린문제만·복습 둘 다)
isReviewSynthetic  // 스냅샷에 이미 해당 분류만 담겨 있음 (복습 탭 전용)
```

예전엔 하나였습니다. 그래서 **「틀린문제만」이 `onlyQuestionIds` 필터를 통째로 건너뛰고
전체 문항을 다시 냈습니다.** 필터를 건너뛰는 건 `isReviewSynthetic`일 때만입니다.

### 「재도전 중 표시」 ≠ 「새 attempt 시작」

```ts
retryingAssignmentId    // 맵의 「재도전 중!」 표시용 — 완료까지 유지
forceNewAssignmentId    // 일회성 — 러너를 벗어나면 해제
wrongOnlyAssignmentId   // 「틀린문제 푸는중!」 — 성을 누르면 연습을 이어서 연다
```

예전엔 `retryingAssignmentId` 하나가 셋을 겸했습니다. 그래서 재도전이나 틀린문제만을
**한 번 누르면 그 과제는 세션 내내 들어갈 때마다 새 attempt가 열렸고**, 새 attempt에는
답안이 없으니 이어풀기 필터가 아무것도 못 걸러서 매번 단어 파트부터 다시 나왔습니다.

---

## 3. 성(castle)은 지형입니다

**과제가 없어도 성은 그려집니다.** 과제가 부여되면 클릭이 가능해질 뿐입니다.
`castleAssignments` 같은 필터로 그려지는 성 수를 줄이면 맵이 텅 빕니다.
`CASTLE_LOOKAHEAD` · `MIN_DRAWN_CASTLES`는 그래서 있습니다.

오답 재출제는 **성에 부여하지 않습니다.** 헬스장에서 풉니다(2026-08-11부터).
밀린 게 여러 개면 **오래된 것부터**입니다.

---

## 4. 에셋 — `public/assets`에 넣는 건 전부 배포됩니다

정리 전 84 MB였고, 그중 39 MB가 코드가 쓰지도 않는 Figma 원본·`.bak`·`-source`였습니다.
지금은 23 MB입니다.

- **원본·백업은 `_design-source/`로.** `public/` 안에 두면 학생 기기로 다 내려갑니다.
- 큰 SVG에 박힌 PNG는 `scripts/shrink-svg-rasters.mjs`로 줄입니다. 표시 크기를 역산해
  필요한 해상도만 남깁니다. 멱등성 가드가 있어 두 번 돌려도 화질이 안 깎입니다.
- **`<image>`의 `width`/`height`는 배치 상자입니다.** 래스터를 줄여도 이 값은 건드리지
  마세요 — 줄이면 그림이 실제로 작아집니다. 데이터만 갈아끼우면 됩니다.
- 에셋을 고치면 코드의 **`?v=`를 올리세요.** 안 그러면 기존 사용자는 캐시된 옛 그림을 봅니다.

### 함정: 주석에 파일명을 적으면 미사용 탐지가 망가집니다

`// Figma 칭찬캘린더.svg → praise-calendar.svg` 같은 주석 때문에 한글 원본 15개(19 MB)가
「사용 중」으로 잡혀 있었습니다. 미사용 검사는 **주석을 걷어내고** 하세요.

### 가짜 OS 요소 금지

시계·와이파이·배터리·홈 인디케이터를 전 화면에서 지웠습니다. 실기기에서는 OS가 그려서
두 겹이 되고, 안드로이드에는 있지도 않은 막대가 붙습니다.
**새 시안을 받으면 이것부터 확인하세요.**

---

## 5. 화면 크기 — `min-h-dvh` 쓰지 마세요

프레임은 **폭과 높이 중 작은 쪽**에 맞춥니다(`.app-frame`). 높이는 `100dvh`가 아니라
**눈에 보이는 영역**(`visualViewport` → `--app-vh`)입니다. 카카오 인앱처럼 주소창·툴바가
얹히면 dvh가 실제보다 커서 아래가 잘립니다.

```css
width: min(100%, 540px, calc(var(--app-vh) * 393 / 852));
aspect-ratio: 393 / 852;
```

예전에는 폭에만 맞춰서 **아이폰 SE(375×667)에서 하단 내비가 통째로 화면 밖으로**
나갔습니다. 프레임 안 화면은 `min-h-dvh`가 아니라 **`min-h-full`**(프레임 기준)을 씁니다.
`dvh`를 쓰면 프레임보다 커져서 다시 삐져나옵니다.

### `vw`로 크기를 정하지 마세요 — 프레임 폭이 아닙니다

프레임이 화면보다 좁아질 수 있으므로, `vw` 기준으로 정한 글씨는 **프레임이 줄어도 안
줄어듭니다.** `CastlePartMenu`의 `fs()`가 이걸로 노트북(1512×860)에서 36% 커졌습니다.
프레임과 **같은 세 항목**을 쓰세요.

```ts
min(Xvw, MAXpx, calc(var(--app-vh) * pxAt393 / 852))
```

세 번째 항이 「높이로 정해지는 프레임 폭」에 대응합니다.

---

## 6. 검증하는 법 — 브라우저를 실제로 띄울 수 있습니다

Chrome 확장은 이 환경에서 안 붙습니다. 대신 이렇게 했습니다.

```bash
mkdir /tmp/verify && cd /tmp/verify && npm init -y && npm i playwright-core
# executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe'
```

프로젝트를 건드리지 않고 임시 폴더에만 설치하면 됩니다.

**점검할 때 Supabase는 반드시 차단하세요.**

```js
await ctx.route('**://*.supabase.co/**', r => r.abort())
```

안 그러면 점검하다가 익명 계정이 생기고 실 데이터를 읽습니다.

**코드 분할은 `npm run dev`로는 안 드러납니다.** `npm run build && npm run preview`로
확인하세요. 개발 서버는 분할을 타지 않습니다.

에러 경계 확인용으로 개발 모드에만 `/__boom` 경로가 있습니다(배포본에서는 빠집니다).

---

## 7. 아직 안 된 것 · 알려진 한계

| 항목 | 상태 |
|---|---|
| **소셜 로그인** | 코드는 완료. **Supabase 대시보드에 카카오·Apple 키 등록 + Manual Linking 필요.** 키가 없으면 「준비되지 않았어요」가 뜹니다 |
| **문제 풀이 흐름 실행 검증** | 미완. Supabase를 차단하고 검증해서 **풀이 전체를 한 번도 실제로 못 돌려봤습니다** |
| 교사 웹 lint | 오류 32건(전부 `setState-in-effect`). 일부는 Next.js localStorage 하이드레이션이라 **규칙이 틀린 경우**입니다 — 억지로 고치면 나빠집니다 |
| 단어장 탭 | 화면 없음. 누르면 「준비 중」 안내만 |
| 성 맵 에셋 | 6.25 MB + 1.46 MB. 이미 1:1 해상도라 더 줄이려면 타일 분할이나 WebP 전환이 필요 |
| `max_combo` | 앱이 정합니다. 연습 모드 답안은 서버에 안 남아서 서버 계산으로 바꾸면 정당한 콤보가 깎입니다 |

---

## 8. 두 리포는 조용히 어긋납니다

`AGENTS.md`의 대응표를 꼭 보세요. 특히 **문항 id 접미사**(`:match` `:ox` `:ox:fix` …)는
학생 앱이 만들고 교사 웹이 파싱합니다. 한쪽만 고치면 과거 문제집이 조용히 깨집니다.

그리고 **같은 워킹트리를 여러 세션이 씁니다.** 파일을 고치기 전에 이미 수정돼 있는지
확인하세요. 이번에도 `AssignmentRunnerScreen.tsx`와 `body-text-*`를 다른 세션이 동시에
만지고 있어서 빌드가 몇 번 깨졌습니다.

---

## 9. 사용자가 명시적으로 정한 것들

나중에 「왜 이렇게 했지?」 싶을 때를 위해 남깁니다.

- **콤보**: 풀이 중 콤보는 파트를 넘어 누적되고 틀리면 끊김. 종합 완료에는 **그 회차의
  최고 콤보(MAX COMBO)**를 보여줌 (DJMAX 방식)
- **과제 공개**: 수업일의 **수업 종료 시각**부터. 시간표가 비어 있으면 그날 자정(KST)
- **오답 재출제**: 성이 아니라 **헬스장**. 즉시 공개(수업 종료까지 안 미룸)
- **선생님**: 앱에는 화면 없음. 온보딩 뒤 **선생님 웹 링크**로 안내
  (`VITE_TEACHER_WEB_URL`). 교사 웹은 1557×973 데스크톱 레이아웃이라 폰에서 못 씁니다
- **혼자 공부·커리큘럼**: 제품에서 제외·코드 제거됨(2026-08-11)

---

## 10. 시간대

날짜 비교는 **한국시간 고정**입니다. Postgres의 `current_date`는 UTC라 한국 자정보다
9시간 늦습니다. 연속 학습(`kstDayNumber`)도, 과제 공개 시각도 KST 기준으로 계산해
절대 시각으로 저장합니다.

---

## 11. 초대코드 화면이 다시 뜨는 이유 (2026-08-21 수정)

「초대코드를 계속 다시 입력해야 한다」는 증상은 원인이 **세 갈래**였습니다. 셋 다
겉보기 증상이 같아서, 하나만 고치면 남은 둘로 계속 재현됩니다.

### (1) `forceInviteStep`이 새로고침해도 살아난다 — 확정 재현 경로

학생 온보딩 마지막에 `navigate('/student/home', { state: { forceInviteStep: true } })`
로 넘어옵니다. `MainHomeScreen`은 이 값이 참이면 **반 등록 조회를 통째로 건너뛰고**
초대코드 화면부터 띄웁니다(의도된 동작).

그런데 React Router의 `state`는 `window.history.state.usr`에 저장돼서 **새로고침해도
그대로 복원됩니다.** 그래서 그 히스토리 항목에 머무는 동안에는 F5를 누를 때마다
초대코드 화면이 다시 떴습니다. 코드를 넣으면 `ALREADY_ENROLLED`가 성공 처리되어
들어가지므로 「되긴 되는데 매번 물어보는」 모습이 됩니다.

→ 마운트 직후 `history.replaceState`로 `usr`을 지워 **한 번만** 쓰도록 했습니다.

### (2) 세션 복원 실패 → 새 익명 사용자 → 등록이 통째로 남의 것이 됨

`ensureStudentSession()`은 `getSession()`이 비면 곧바로 `signInAnonymously()`를
불렀습니다. 토큰이 죽었을 때만이 아니라 **오프라인·갱신 요청 실패 같은 일시적 실패**
에서도 그랬습니다. uid가 바뀌면 `enrollments`가 딸려오지 않으니 초대코드 화면이 뜨고,
코드를 넣으면 **새 계정으로 다시 가입**됩니다 — 그래서 반복됩니다(그리고 학생 계정이
계속 늘어납니다).

→ localStorage에 토큰이 **남아 있으면** 새로 만들지 않고 `null`을 돌려줍니다.
토큰이 진짜로 죽은 경우 auth-js가 저장소를 스스로 비우므로(`_removeSession`),
그때는 예전처럼 새 익명 세션이 만들어져 복구됩니다.

### (3) 조회 실패와 「가입한 반 없음」을 구분하지 않았다

`fetchMyEnrollments()`가 에러도 빈 배열로 돌려줘서, 네트워크가 한 번 흔들리면
`resolveActiveClassId()`가 `null` → 화면은 「가입한 반이 없다」로 읽고 초대코드부터
받았습니다.

→ `fetchMyEnrollmentsResult()`가 `{ ok, enrollments }`를 돌려줍니다.
조회가 실패하면 마지막으로 알던 반(`haksup_active_class_id`)을 그대로 쓰고,
**정말로 0건일 때만** 캐시를 지우고 초대코드 화면으로 보냅니다.

> 참고: 익명으로 초대코드를 먼저 넣은 뒤 소셜 로그인을 하면, 대시보드에 **Manual
> Linking이 꺼져 있을 때** uid가 바뀌어 초대코드를 한 번 더 넣게 됩니다. 이건 위
> 세 가지와 별개이고, 대시보드 설정으로 풀어야 합니다(§7).

---

## 12. 브랜드 변경 — 루핀 → 학습(Haksup) (2026-08-21)

제품 이름이 바뀌어 두 리포에서 `loopin` · `루핀` 흔적을 걷어냈습니다. 규칙은
간단하지만 **그냥 문자열을 바꾸면 안 되는 자리가 세 군데** 있습니다.

### 저장소 키는 이름만 바꾸면 데이터가 사라진다

`loopin_auth` · `loopin-student-supabase-auth` · `loopin_active_class_id` 등은
전부 `haksup*`로 바뀌었습니다. 키 이름만 바꾸면 **이미 쓰던 학생이 로그아웃되고
초대코드를 다시 넣게 됩니다**(§11 그 증상). 그래서 `src/lib/legacy-brand-storage.ts`가
구 키를 새 키로 한 번 옮깁니다.

- `main.tsx`의 **첫 줄**에서 부릅니다. Supabase가 토큰을 읽기 전이어야 합니다.
- 교사 웹도 같은 일을 하지만 **인라인 `<script>`**입니다(`layout.tsx`). 리액트
  effect는 자식이 먼저 돌아서 늦습니다.
- 이 두 파일에 남은 `loopin` 문자열은 흔적이 아니라 **옛 키를 찾는 열쇠**입니다.
  기기에서 구 키가 다 사라졌다고 판단되면 그때 지우세요.

### TTS Edge Function은 코드와 배포가 따로 나간다

`loopin-tts` → **`haksup-tts`**로 폴더·설정·호출을 모두 바꿨습니다.
**`supabase functions deploy haksup-tts`를 하지 않으면 새 이름이 없습니다.**
그동안 음성이 죽지 않도록 `haksup-tts`가 실패하면 `loopin-tts`로 한 번 더
시도합니다(`src/lib/tts/haksup-tts.ts`). **재배포가 끝나면 폴백을 지우세요.**

### 마스코트는 브랜드가 아니다

문서·주석의 `루핀`은 **제품**을 가리키기도 하고 **캐릭터**를 가리키기도 했습니다
(「만세 루핀」, 「루핀 미니 코치」). 캐릭터는 코드가 이미 쓰던 `마스코트`/`mascot-*`
로 통일했고, 자산도 `mascot-wave.png` · `mascot-blush.png` · `mascot-sad.png` ·
`mascot-character-start.svg`로 옮겼습니다. 브랜드 로고만 `logo-haksup.png`입니다.

### 아직 남은 것 (코드 밖)

| 무엇 | 상태 |
|---|---|
| ~~**로고 그림**~~ | **2026-09-04 해결.** `HaksupLogo`가 앱 아이콘과 같은 정사각 마크(`public/assets/logo-mark.png`, `assets/icon.png`를 192px로 줄인 것)를 씁니다. 옛 Loopin 워드마크 `logo-haksup.png`는 `_design-source/logo-haksup-old-wordmark.png`로 옮겼습니다(안 쓰는 파일을 학생 기기로 내려보내지 않으려고). `login-logo.svg`·`_design-source/logo-haksup.svg`는 **아직 옛 워드마크**이지만 화면에 쓰이지 않습니다 |
| Figma 레이어 이름 | `docs/figma.md` 표 왼쪽 열 참고 |
| 폴더·리포 이름 | `loopin-webapp` · `loopin-project` · `loopin-web`는 그대로입니다(사용자 결정). 문서의 경로 표기도 그대로 둔 이유입니다 |
| `supabase/config.toml`의 `project_id` | 로컬 CLI 라벨이라 폴더명을 따릅니다 |
| Vercel 프로젝트명 · GitHub 리포명 · 도메인 | 콘솔에서 직접 |
| 법무 문서 | `public/legal/*.html`의 서비스명을 「학습(Haksup)」으로 고쳤습니다. **문구 자체는 법무 확인이 필요합니다** |

---

## 13. 배포 용량과 Supabase egress (2026-08-22)

30명 동시 사용을 앞두고 한 번 훑었습니다. **Vercel은 여유롭고, 조이는 건 Supabase egress**입니다(무료 5GB/월).

### 안 쓰는 맵 이미지 3종을 `_design-source/`로 옮겼습니다

`main-home-academy-map.svg`(5.96MB) · `main-home-map-long.svg`(1.39MB) ·
`main-home-map-scroll.svg`(0.11MB). 2026-08-08에 벡터 맵으로 대체돼 **렌더에 안 쓰는데**
`public/assets`에 남아 배포본에만 7.5MB를 얹고 있었습니다. `MAIN_HOME_ASSETS`의
`map`/`mapLong`/`mapScroll` 상수도 지웠습니다 — 상수가 남아 있으면 누가 되살립니다.

> `public/assets`는 **참조 여부와 무관하게 통째로 배포**됩니다. 안 쓰는 파일은
> 학생이 받지는 않지만 배포본에는 실립니다. 대조용 원본은 `_design-source/`로.

### 큰 SVG 안의 PNG를 무손실 WebP로 바꿨습니다 (18개 · 4.4MB 절약)

Figma에서 뽑은 프레임 SVG는 **내용의 88~100%가 base64로 박힌 PNG**였습니다.
그걸 **무손실 WebP**로 다시 인코딩했습니다 — 픽셀은 그대로고 40%가 줄었습니다.
가장 큰 것: `praise-calendar.svg` 0.92→0.37MB, `login-screen.svg` 1.11→0.63MB.

**이미지를 SVG 밖으로 빼지 않은 이유**: 이 SVG들은 `FigmaAssetFrame`이 `<img src>`로
그립니다. `<img>`로 불린 SVG는 보안상 **외부 파일을 참조할 수 없어서**, 이미지를
별도 파일로 빼면 그림이 통째로 안 나옵니다. 그래서 담는 형식만 바꿨습니다.

변환 전 원본은 `_design-source/_pre-webp/`에 있습니다. 자산 내용이 바뀌었으므로
`?v=`를 전부 올렸습니다(안 올리면 학생 브라우저가 옛 파일을 계속 씁니다).

### 과제 목록 재조회에 간격을 뒀습니다

`fetchStudentAssignments`는 `select('*')`라 **`content_snapshot`을 통째로** 가져옵니다
(과제 1건당 10KB 안팎). 그런데 예전에는 **포커스가 돌아올 때마다·탭이 보일 때마다**
전부 다시 받았습니다. 학생이 앱을 들락거리기만 해도 계속 나갑니다 —
30명 × 하루 20회 × 5건이면 **하루 29MB**, 한 달이면 무료 한도를 넘깁니다.

focus/visibility/pageshow는 **60초 간격**으로 묶고, **Realtime은 그대로 즉시** 반영합니다.
Realtime은 「실제로 바뀌었다」는 신호라 드물게 오고, 교사가 방금 낸 과제가 늦게 뜨는
게 더 큰 문제입니다.

**남은 개선**: 목록 조회에서 `content_snapshot`을 빼고, 학생이 그 과제를 실제로 시작할
때만 받는 것. 지금은 못 합니다 — 맵이 성마다 문항 수를 보여주는데 그 값을
`countSnapshotQuestions(snapshot)`으로 **앱에서 스냅샷을 세어** 만들기 때문입니다.
`class_assignments`에 문항 수 컬럼을 두거나(교사가 부여할 때 계산해 저장),
`updated_at`을 추가해 안 바뀐 스냅샷은 재사용하는 식이라야 합니다.

---

## 14. TTS — 고정 콘텐츠는 미리 뽑아 둡니다 (2026-08-22)

### 먼저: Azure 요금은 나가지 않습니다

`supabase/functions/haksup-tts/index.ts`가 쓰는 건 **`edge-tts-universal`** 입니다.
목소리 이름이 `en-US-AriaNeural`이라 Azure처럼 보이지만 **구독도 API 키도 없습니다**
(함수에 `Deno.env` 호출이 하나도 없습니다). 누를 때마다 청구되는 돈은 없습니다.

대신 걸리는 건 **Supabase 무료 티어**입니다 — 호출 50만/월, **egress 5GB/월**.
실측: 단어 10KB · 영어 문장 17KB · 한국어 문장 31KB, 평균 20KB. 즉 **약 25만 번**이
egress 한도입니다(먼저 막히는 쪽은 호출 수가 아니라 egress).

30명 규모에서는 월 360MB 정도라 **한도는 여유롭습니다.** 그런데도 미리 뽑는 이유는:
- **첫 재생 2초**(콜드 스타트 실측 2,027ms → 이후 758ms). 파일이면 즉시 납니다.
- `edge-tts-universal`은 Edge 브라우저용 **비공식 엔드포인트**입니다. 막히면 수업 중에
  음성이 통째로 멈춥니다. 파일로 갖고 있으면 고정 콘텐츠는 안 멈춥니다. **이게 제일 큽니다.**

### 파일 이름이 텍스트의 해시입니다 — 규칙이 아니라 구조

```
public/assets/audio/en-<sha1(lang:정규화텍스트)의 앞 16자>.mp3
src/lib/tts/audio-manifest.json   「정규화 텍스트 → 파일명」 표
```

엑셀에서 단어나 문장을 고치면 **해시가 달라져 옛 음성을 가리킬 수가 없습니다.**
매니페스트에 없으면 앱이 조용히 Edge Function으로 폴백합니다 — **틀린 소리가 나는
경우는 구조적으로 없습니다.** 「고치면 음성도 다시 뽑기」를 사람이 지킬 필요가 없습니다.

```bash
npm run tts:build    # 빠진 음성 생성 (배포된 haksup-tts를 호출해서 만든다)
npm run tts:check    # 빠진 게 있으면 종료 코드 1 — 빌드 게이트로 쓸 수 있다
```

음성은 **배포된 Edge Function을 그대로 호출해** 만듭니다. 앱이 실시간으로 만드는 것과
같은 엔진·목소리·속도라 소리가 달라지지 않습니다. 문제은행 경로는 기본값이
`../loopin-project/loopin-web/src/data/problem-bank.json` — 두 리포가 나란히 있다고 봅니다.

### 지금 상태

현재 문제은행 기준 **23개 · 0.29MB**입니다(중1·중2·중3이 같은 지문을 써서 중복이
제거됩니다). 앱은 `getAudioUrl` 한 곳에서 갈라지므로 프리로드 경로까지 자동 적용됩니다.

**커버되지 않는 것**: 교사가 직접 만든 과제와 복습 합성본. 내용이 매번 달라 미리 뽑을
수 없어 예전처럼 함수를 탑니다. 그쪽까지 줄이려면 Supabase Storage에 캐시하는 방법이
있는데, **호출 수만 줄고 egress는 그대로**라(학생마다 받는 건 같음) 지금은 안 했습니다.

### 브라우저 캐시는 아직 안 걸려 있습니다

함수 응답이 `Cache-Control: no-store`라 새로고침하면 다시 받습니다. 헤더만 고쳐서는
효과가 없습니다 — **클라이언트가 POST로 부르는데 브라우저는 POST 응답을 캐시하지
않습니다.** 효과를 보려면 GET + 쿼리스트링으로 바꾸고 함수를 재배포해야 하고, 그러면
읽을 텍스트가 URL에 드러나고 캐시 무효화(`cacheVersion`)를 사람이 챙겨야 합니다.
얻는 건 「같은 학생의 반복 재생」뿐이라(세션 내 메모리 캐시가 이미 있습니다) 지금은
비용 대비 이득이 안 맞아 보류했습니다.

---

## 15. 앱에서 로그인을 누르면 웹앱이 열리던 문제 (2026-09-04)

스토어에 올린 앱에서 소셜 로그인을 누르면 **`loopin-webapp.vercel.app`으로 넘어가**
앱으로 돌아오지 못했습니다. 학생 눈에는 "앱인데 갑자기 웹사이트"입니다.

### 원인 — 돌아올 주소가 앱 주소가 아니었습니다

`socialRedirectUrl()`이 `${window.location.origin}/auth/callback`을 썼습니다. 브라우저에서는
맞지만 앱 WebView의 주소는 `capacitor://localhost`(iOS)·`http://localhost`(Android)입니다.
이 주소는 Supabase `Redirect URLs`에 없으므로 **조용히 Site URL로 대체**됩니다.

직접 확인한 방법 (대시보드 없이):

```bash
curl -sI "https://mqnzowyqlxhsllqeeyuo.supabase.co/auth/v1/callback?error=access_denied&state=bogus"
# → Location: https://loopin-webapp.vercel.app?error=...  ← 이게 Site URL, 즉 폴백 도착지
```

덧붙여, 설령 주소가 맞았어도 앱에서는 **WebView가 통째로 provider 페이지로 바뀌어**
돌아올 길이 없었습니다. 구글은 임베디드 WebView 로그인을 `disallowed_useragent`로 막습니다.

### 고친 방법 — 시스템 브라우저 + 커스텀 스킴 딥링크

1. `skipBrowserRedirect: true`로 **주소만 받아** 시스템 브라우저로 엽니다
   (`@capacitor/browser` → iOS SFSafariViewController, Android Chrome Custom Tabs).
2. 로그인이 끝나면 Supabase가 `haksup://auth/callback?code=…`로 보내고 **앱이 다시 열립니다**.
3. `NativeAuthDeepLink`(`@capacitor/app`의 `appUrlOpen`)가 그 코드를
   `exchangeCodeForSession`으로 세션에 바꾼 뒤 **웹과 같은 `/auth/callback` 화면**으로 보냅니다.

PKCE의 code verifier는 로그인을 시작한 WebView의 localStorage에 있습니다. 그래서 코드 교환은
브라우저가 아니라 **앱으로 돌아와서** 해야 합니다 — 딥링크로 받는 구조인 이유입니다.

### 스킴을 바꾸려면 네 곳을 같이 고칩니다

| 곳 | 값 |
|---|---|
| `src/lib/native.ts` | `NATIVE_AUTH_SCHEME = 'haksup'` |
| `android/app/src/main/res/values/strings.xml` | `auth_url_scheme` + Manifest의 intent-filter |
| `codemagic.yaml` | `Register login deep link scheme` 단계가 Info.plist에 심음 |
| Supabase 대시보드 | Authentication → URL Configuration → Redirect URLs |

**iOS의 `ios/`는 빌드마다 새로 만들어집니다**(`npx cap add ios`). 그래서 Info.plist 수정은
파일이 아니라 `codemagic.yaml`의 단계로 넣었습니다 — Xcode에서 손으로 넣으면 다음 빌드에 사라집니다.

### 대시보드 설정이 없으면 코드만으로는 안 고쳐집니다

Supabase **Redirect URLs에 `haksup://auth/callback`을 넣어야** 합니다. 안 넣으면 예전과
똑같이 Site URL로 폴백해 웹앱이 열립니다. 이 한 줄이 iOS·Android 공용입니다
(번들 ID가 `com.haksup.haksupApp` / `com.haksup.haksup_app`로 달라서 스킴을 따로 뒀습니다).

---

## 16. 설정 — 이름 변경과 회원탈퇴 (2026-09-04)

계정 카드의 세 행 중 **학년 변경만** 눌렸습니다. 닉네임·연동 계정에는 시안에 `>` 쉐브론이
그려져 있는데 히트영역이 없어서, 눌러도 아무 일이 없었습니다. 둘 다 채웠습니다.

| 행 | 누르면 | 저장 경로 |
|---|---|---|
| 닉네임 | `SettingsNameSheet` — 이름 변경 | `upsertStudentProfile` → **성공하면** 로컬 `haksup_auth`도 같이 갱신 |
| 연동 계정 | `SettingsAccountSheet` — 연동 확인 + **회원탈퇴** | `delete_own_account()` RPC |

**이름은 서버가 먼저입니다.** `resolveDisplayName`은 로컬 auth를 먼저 보기 때문에 로컬만
고치면 앱에는 새 이름, 선생님 명단에는 옛 이름이 남습니다. 저장이 실패하면 시트를 닫지
않습니다 — 닫으면 바뀐 줄 알고 넘어갑니다.

### 회원탈퇴 — 지우는 주체는 DB입니다

앱은 anon 키뿐이라 `auth.users`를 못 지웁니다. 서비스 롤 키를 앱에 넣는 건 논외라
(그 키 하나면 남의 기록까지 지워집니다) **자기 자신만 지우는 `security definer` 함수**를
뒀습니다 — 교사 리포의 `supabase/migrations/014_delete_own_account.sql`.

```
auth.users 1행 삭제
  → profiles → enrollments · attempts → answers   (001의 on delete cascade)
```

`error_reports`만 `on delete set null`이라(011) 계정을 지워도 행이 남습니다. 「완전히
지운다」가 목적이므로 함수가 **명시적으로 먼저** 지웁니다.

**014를 올려야 동작합니다.** 안 올라가 있으면 PostgREST가 `PGRST202`를 주고, 앱은
「탈퇴 기능이 아직 서버에 준비되지 않았어요」를 보여 줍니다(2026-09-04 실제 응답 확인).

주의한 것 두 가지:

- **서버 → 로컬 순서.** 로컬을 먼저 비우면 서버 삭제가 실패했을 때 계정은 살아 있는데
  기기에서는 로그아웃돼, 학생이 되돌릴 방법이 없습니다.
- **0행 삭제를 성공으로 보지 않습니다.** 함수가 `row_count`를 보고 0이면 예외를 던집니다.
  (§3의 교훈과 같은 함정입니다 — PostgREST는 0행 삭제에 에러를 주지 않습니다.)

- **탈퇴 뒤에는 라우터로 넘기지 않고 앱을 다시 띄웁니다**(`window.location.replace('/')`).
  설정 화면 뒤에서 과제 목록이 주기적으로 다시 조회되는데, 그 경로는 세션이 없으면
  `signInAnonymously()`로 익명 사용자를 새로 만듭니다. 탈퇴 직후에 그게 돌면 빈 계정이
  하나 생기고 토큰이 다시 저장됩니다. 새로고침이 그 타이머들을 끊습니다.

로컬은 `clearAllLocalData()`가 `haksup`/`loopin` 접두사 키를 통째로 지웁니다. 키를 하나씩
나열하면 새 기능이 키를 늘릴 때마다 빠집니다. 안 지우면 탈퇴한 사람의 이름·반·복습 진행이
다음에 앱을 연 사람에게 그대로 보입니다.

> 참고: 앱스토어 심사 지침 5.1.1(v)는 계정을 만들 수 있는 앱에 **앱 안에서의 계정 삭제**를
> 요구합니다. 이 화면이 그 요건을 채웁니다.

---

## 17. 선생님 안내 화면 — 「학생으로 임시 참여」 (2026-09-04)

화면 맨 아래 버튼이 `/onboarding/member-type`으로 되돌려 보내기만 했습니다. 거기서 학생을
고르면 **선생님 계정 그대로 학생 온보딩을 태워서**, `upsertStudentProfile`이 같은 uid의
`profiles.role`을 `student`로 덮어씁니다. 두 앱이 프로필 한 행을 공유하므로 **그 순간
선생님 웹에서 반이 사라집니다.** 그래서 별개 신원으로 들어가게 고쳤습니다.

```
[임시 참여하기] → signOutSocial() → 로컬 전체 비움 → 임시 학생 auth 저장
               → /onboarding/student → (익명 세션 생성) → 초대코드 → 학생 화면
```

- **왜 로그아웃까지 하나.** `enroll_with_invite_code`가 `profiles.role = 'student'`만
  받습니다(001). 선생님 uid로는 `NOT_STUDENT`가 나고, 역할을 바꾸면 위의 사고가 납니다.
  다른 uid가 필요하고, 그게 새 익명 세션입니다.
- **선생님 계정은 서버에 그대로 있습니다.** 다시 소셜 로그인하면 스플래시가
  `profiles.role=teacher`를 읽어 이 화면으로 돌려보냅니다(`mergeServerProfile`).
- **임시 학생은 익명 세션**이라 `provider`가 없습니다. `AuthUser.temporary`로 표시하고,
  설정에서는 연동 계정 자리에 「임시 참여」를 보여 줍니다 — 로그인한 적 없는 provider
  이름을 띄우지 않으려고요.

### 선생님 웹 주소는 코드에 기본값을 둡니다

`VITE_TEACHER_WEB_URL`만 보던 것을 `DEFAULT_TEACHER_WEB_URL` 상수 + 환경변수 우선으로
바꿨습니다. 이 값은 **빌드 시점**에 있어야 하는데 앱은 Codemagic이 빌드합니다 — 거기
환경변수가 비어 있으면 배포본에 「아직 연결되지 않았어요」가 그대로 나갑니다. 공개 주소라
숨길 이유도 없습니다.

현재 값은 **`https://loopin-web-zeta.vercel.app`** 입니다(2026-09-04에 열어 `학습 로그인`
페이지가 뜨는 것을 확인했습니다). 주소가 바뀌면 `src/pages/TeacherHandoffScreen.tsx`의
`DEFAULT_TEACHER_WEB_URL`을 고치면 됩니다.

> **`loopin-web.vercel.app`은 우리 것이 아닙니다.** 이름이 비슷해 헷갈리기 쉬운데,
> 열어 보면 스페인어 자동화 서비스 사이트입니다(2026-09-04 확인). 여기로 바꾸지 마세요.

---

## 18. 아이콘·앱 이름 — 코드에 있는 것과 콘솔에만 있는 것 (2026-09-04)

Play 스토어 화면에 아직 **`Loopin`** 과 옛 `Loop` 아이콘이 보입니다. 셋이 서로 다른 곳에
있어서, 코드만 고쳐서는 안 바뀌는 것이 섞여 있습니다.

| 무엇 | 어디 | 지금 |
|---|---|---|
| 스토어 제목 (`Loopin`) | **Play 콘솔** 기본 스토어 등록정보 → 앱 이름 | 콘솔에서만 바꿀 수 있음 |
| 스토어 아이콘 (`Loop` 그림) | **Play 콘솔** 앱 아이콘 512×512 | 콘솔에서 업로드 (`assets/play-store-icon-512.png` 준비해 둠) |
| 홈 화면 이름 | `android/.../values/strings.xml` `app_name` | 이미 `학습` |
| 홈 화면 아이콘 | `android/.../mipmap-*/ic_launcher*.png` | **2026-09-04에 마스코트로 교체** |

### 안드로이드 런처 아이콘이 Capacitor 기본값이었습니다

`ic_launcher.png`가 **파란 X(Capacitor 기본 아이콘)** 였습니다. iOS는 Codemagic이 빌드마다
`npx @capacitor/assets generate --ios`를 돌려서 `assets/icon.png`가 반영되는데, 안드로이드는
로컬에서 빌드하고 그 명령을 돌린 적이 없어서 템플릿 그대로 남아 있었습니다.

```bash
npm run cap:icons   # = npx @capacitor/assets generate --android --assetPath assets
```

`assets/icon.png`(1024×1024)를 고친 뒤에는 **이걸 돌려야** 홈 화면 아이콘과 네이티브
런치 화면(`@drawable/splash`, 런치 테마가 참조)이 같이 바뀝니다.

> 스토어 이름은 「학습」을 권합니다 — 약관·개인정보 처리방침·앱 안 표기가 전부 「학습」이고,
> 한국 사용자는 한글로 검색합니다. 아래 작은 글씨 `Haksup`은 **개발자 계정 이름**이라 앱
> 이름과 별개로 콘솔 계정 설정에서 바꿉니다.
