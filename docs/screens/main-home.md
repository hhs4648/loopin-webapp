# 학원/학교 학생 메인 (초대코드 · 성 맵)

> **이 화면 = 학원·학교(선생님 초대) 학생 메인.**  
> 구어 「student/main」≠ 코드 경로. **실제 라우트는 `/student/home`.** (`/student/main` 없음)  
> 혼자 공부·커리큘럼 메인은 **삭제**(2026-08-11).

| 항목 | 값 |
|------|-----|
| 경로 | **`/student/home`**, `/teacher/home` |
| 진입 | 온보딩 완료 → 초대코드 → 성 맵 |
| 구현 | `src/pages/MainHomeScreen.tsx`, `src/components/main-home/AssignmentReceivedScreen.tsx` |
| 데이터 | `assignment-home.ts` (`TEST_STARS` 등) |

> 두 경로(`/student/home`, `/teacher/home`) 모두 동일 `MainHomeScreen`을 렌더한다. 교사 전용 UI는 **목표상** `loopin-project`.

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 초대코드 입력 | 메인 맵 배경 + 초대 UI 오버레이 + 하단 내비 | `main-home-academy-map.svg` + `main-home-invite-ui.svg` + `MainHomeBottomNav` |
| 입력 후 대기 | `메인화면(초대코드 입력후).svg` | `main-home-invite-entered.svg` |
| 과제 부여 후 | `메인화면(과제 부여 받은후).svg` | `main-home-assignment-received.svg` |
| 하단 탭바 | *(위 프레임 y770..852)* | `main-home-bottom-nav.svg` |
| 스크롤 맵 | `학원학교 학생용 메인화면.svg` | `main-home-academy-map.svg` (단일 LONG, bridge/segment 없음) |
| 맵 LONG 원본 | `학원학교 학생용 메인화면.svg` | `main-home-map-long.svg` · `학원학교 학생용 메인화면.svg` |
| 미부여 성 | `회색 성.svg` | `castle-gray.svg` |
| 맵 성 (슬롯) | *(제공 PNG)* | `map-castle-red-flag.png` — **현재 미사용**(배경 LONG에 성 포함). React 성 오버레이 취소 |
| 완료 뱃지 | `미션 체크.svg` | `mission-check.svg` |
| 루핀 캐릭터 (대기) | *(제공 PNG)* | `mascot-wave.png` |
| 루핀 캐릭터 (만세) | `만세 캐릭터.svg` | `mascot-banzai.svg` — 현재 위치 성 (`CastleCompleteMascot`) |
| 칭찬 캘린더 | `칭찬캘린더.png` *(SVG)* | `praise-calendar.svg` |
| 완료 성 탭 | (동일) GrammarCompleteScreen | 완료된 성 클릭 → 점수·재도전/틀린문제만 (completion-retry.md) |

## Step 플로우 (MainHomeScreen)

1. `invite` — 초대코드
2. (`waiting` — step은 존재하나 현재 진입 경로 없음)
3. `assignment` — 맵 (env 있으면 서버 과제 목록, 없으면 도달 불가)
4. `praise-calendar` — 칭찬 캘린더 (맵 버튼 → `PraiseCalendarScreen`)
   - 기본 월: **오늘** 기준
   - 월 범위: 학생 **앱 시작 달**(최초 반 가입일) ~ 오늘 — 그 이전 달은 안 보여 줌
   - 날짜 키: 과제 `lessonDate`
   - 이모티콘: 완료·점수 ≥70 통과 / 완료·&lt;70 아쉬움 / **마감 후** 미제출 → 미제출 / **마감 전** 미풀이 → 이모티콘 없음
   - 같은 날 복수 과제: 하나라도(마감 후) 미제출이면 미제출, 모두 완료면 평균 점수. 마감 전 미풀이는 집계에서 제외
5. 이후 학습 step → [learning-session.md](./learning-session.md), [castle-learning.md](./castle-learning.md)

## 초대코드 (현재 구현)

| 규칙 | 값 |
|------|-----|
| 허용 문자 | 영문·숫자, 대문자 |
| 유효 코드 | env(`VITE_SUPABASE_*`) 있을 때만 입력 가능 — 교사가 `loopin-project`에서 발급한 코드를 `enroll_with_invite_code` RPC로 검증 (`TEST` 하드코드 없음) |
| env 없을 때 | 입력 즉시 "서버 연결이 없어요. .env.local을 확인해 주세요" 에러, 맵으로 진행 불가 |
| 대기 | 3000ms 고정 대기 화면 없음 — RPC 성공 시 바로 맵으로 전환 |
| 실패 UX (env 있음) | 입장 안 됨, RPC 에러 메시지 표시 |
| 활성 반 선택 | `resolveActiveClassId()` — 저장된 값에 우선순위를 주지 않고 매번 `enrollments`를 다시 조회해 **가장 최근 가입한 반**을 활성 반으로 삼는다(`src/lib/sync/student-api.ts`) |
| 다른 반 추가 가입 | **현재 UI 경로 없음** — 한 번 가입하면(`step`이 `invite`를 벗어나면) 다시 초대코드 입력 화면으로 돌아갈 방법이 없다. 이전에 「+ 다른 반」 버튼으로 추가했었으나 다시 제거됨(2026-07-22) |

## 맵 레이아웃 (현재)

| 영역 | 동작 |
|------|------|
| 뷰포트 | 393×852, `overflow-y-auto` |
| 전체 지도 | `학원학교 학생용 메인화면.svg` → `main-home-academy-map.svg` (360×2623 → 프레임 393×≈2863). **성은 배경에 포함.** React 성/체크 오버레이 없음(투명 히트만). 미션 카드·칭찬 캘린더·하단 내비는 오버레이 |
| 반복 구간 (4성~) | **제거됨.** bridge/segment 타일 없음 — LONG 단일 배경 + `MAP_CASTLE_SLOTS` 슬롯 |
| 고정 하늘 | **그라데이션** `#FFFFFF → #C5EBFE`(`MAIN_HOME_SKY_GRADIENT`). 위 흰색 · 아래 하늘톤. 상단 `MAP_SKY_CROP`을 잘라내고 React 고정 하늘로 덮음. **단색으로 되돌리지 말 것** |
| 맵 배경 | **벡터**(2026-08-08 전환). `MainHomeMapCanvas`(풀밭 그라데이션 + 길 타일 반복) + `MainHomeMapDecor`(나무·공룡) + 성/자물쇠 오버레이. 아래 「벡터 맵」 절 참고 |
| 고정 헤더 | 하늘 그라데이션(`MAIN_HOME_SKY_GRADIENT`) 배경을 `MISSION_HEADER_FIXED_H`(`today-mission.ts`, 오늘의 미션 카드 하단 + 여백) 높이만큼 스크롤 컨테이너 **위에** 얹어 고정 — 맵을 스크롤해도 헤더 영역은 전혀 움직이지 않고, 초록 성 맵(풀 영역)만 그 아래로 스크롤된다 |
| 반·과제 선택 | **제거됨.** 상단 `SessionRoundDropdown` / `ClassRoundPillLabel` 코드 삭제 (2026-08). SVG에 구워진 알약이 보일 수 있으나 React 인터랙션 없음 |
| 오늘의 미션 카드 | SVG에 flatten된 자리 위에 `TodayMissionCard`(React)로 덮어 렌더 (고정 헤더 안) — 아래 "오늘의 미션 카드" 절 참고 |
| 「N일 연속 학습 중」 알약 | 고정 헤더 안, 미션 카드 위 밴드(x20 y24)에 absolute. `StudyStreakPill` + `useStudyStreak` — [screens/review.md](./review.md)의 「스트릭」 절. **SVG에 구워진 반·과제 알약과 겹치지 않는지 393px에서 확인 필요** |
| 칭찬 캘린더 | **뷰포트 고정** (`PraiseCalendarButton` + `PRAISE_CALENDAR_FIXED_RECT`). 맵 드래그/스크롤에 움직이지 않음 |
| 시작 위치 캐릭터 | LONG 원본에 포함된 경우 에셋 그대로. React `MapCharacter` 오버레이는 미사용 |
| 성 위 환호 루핀 | **제거함.** `CastleCompleteMascot` 미렌더 |
| 하단 네비게이션 | **뷰포트 고정** `MainHomeBottomNav` + `main-home-bottom-nav.svg`. **홈** → `/student/home` 맵 · **복습노트** → 복습하기 오버레이([screens/review.md](./review.md)) · **단어장·메뉴** → 설정 창 |
| 스크롤바 | 숨김, 터치·휠 스크롤 지원 |

### 맵 캐릭터 규칙 (에이전트용 · 다시 확인)

| 위치 | 무엇 | 현재 |
|------|------|------|
| **위** — 시작 깃발 옆 | 파란 루핀(대기) + 「현재 위치」 필 | LONG 원본에 포함된 경우 에셋 그대로 |
| **아래** — 성/브릿지 위 환호·잔상 | 환호 루핀 · 성 「현재 위치」 React 필 · 브릿지 구운 루핀 | **삭제** — React 오버레이 없음 · 브릿지 에셋도 클린 |

#### 시작 루핀은 에셋 여백을 빼고 배치한다 (2026-08-09)

`loopin-character-start.svg`는 **586×586 정사각 안에 캐릭터가 여백을 두고** 들어 있다
(가로 53% · 세로 63%만 차지). 같은 맵에 쓰는 `mascot-banzai.svg`는 내용이 박스를 꽉 채우므로
**두 에셋을 같은 방식으로 다루면 안 된다.**

`<img>`가 `object-contain`이라 박스를 캐릭터 크기로 잡으면 어긋난다. 실제로 그랬다 —
박스를 84×116으로 줬는데 정사각 이미지가 84×84로 축소돼 들어가고, 그 안에서 캐릭터는
45×53만 차지했다. 결과: **발끝이 의도한 지면보다 18px 뜨고 「현재 위치」 필과 16px 벌어짐**
(「과제 미부여 시 캐릭터 첫 위치가 이상하다」의 원인).

이제 `START_MASCOT_VISIBLE`(**보이는 캐릭터** 기준 — 가로중심 **102** · 발끝 **370** · 높이 53)에서
`startMascotBox()`가 여백 비율을 역산해 `<img>` 박스를 만든다. 깃발 바로 오른쪽에 붙인다.
필은 성 도착 루핀과 같은 `CURRENT_LOCATION_PILL` · `PILL_GAP_BELOW_FEET`를 쓴다.
위치를 옮길 땐 **박스가 아니라 `START_MASCOT_VISIBLE`을 고칠 것.** 에셋을 다시 export하면
`START_MASCOT_ART` 비율도 다시 재야 한다.

## 성 상태 (현재 `TEST_STARS`, `assignments` prop이 `undefined`일 때만 렌더 — 위 초대코드 게이트 때문에 현재는 도달 불가한 데모 경로)

| 성 | assigned | 완료 표시 | 클릭 |
|----|----------|-----------|------|
| 1 | true | 완료 시 성 색 별표(`MissionCheckBadge`) | → 단어 세션 (`word-match`) |
| 2 (노란 성) | true | 완료 시 성 색 별표 | → `learning-1` |
| 3·4 등 | false | 맵에 자물쇠 (별표 없음) | 불가 |

전체 지도 좌표:
`FULL_MAP_STAR_1_CASTLE`, `FULL_MAP_STAR_2_CASTLE`,
`FULL_MAP_STAR_1_MARKER`, `FULL_MAP_STAR_2_MARKER`.

## 성 탭 → 파트별 입장 카드 (2026-08-10)

`components/main-home/CastlePartMenu.tsx` + `features/assignments/assignment-parts.ts`

성을 누르면 **바로 들어가지 않고** 성 위에 작은 카드가 뜬다. 그 과제에 실제로 들어 있는
파트(단어·문장·문법)마다 한 줄씩, 오른쪽에 **입장하기** 알약.

카드 **190 × 80~212**(줄 수에 따라). 상단에 마감 문구, 그 아래 파트 줄.

| 자리 | 내용 |
|---|---|
| 상단 | `8월 12일까지 할 수 있어요` — **교사 웹에서 지정한 마감일**(`deadlineDate`). 「다음 수업 전까지」로 낸 과제는 `다음 수업 전까지예요` |
| 각 줄 왼쪽 | 1행 **선생님이 붙인 파트명**(`단어 1파트` · `resolvePartLabel`) / 2행 `12문항` |
| 각 줄 오른쪽 | 아래 표 |

| 줄 상태 | 표시 | 동작 |
|---|---|---|
| 아직 안 푼 파트 | `입장하기` (파랑 `#4F91EB`) | 그 파트의 첫 섹션부터 러너 진입 |
| 다 푼 파트 | `완료` (회색·비활성) | 눌리지 않음 |
| **모든 파트 완료** | 맨 아래 `점수 보기` 줄 추가 | `GrammarCompleteScreen` |

**파트 번호는 앱이 매기지 않는다.** 교사가 「단어 1파트」로 냈으면 그 이름을 제목에서 뽑아
쓰고(`resolvePartLabel`), 통으로 냈으면 `단어 파트`. 앱이 임의로 번호를 붙이면 선생님이 부른
이름과 달라진다 — 파트 완료 화면 배지(`resolvePartCompleteBadgeLabel`)와 같은 규칙이다.

**마감 날짜는 마이그레이션 007부터 내려온다.** 그전에는 서버에 `deadline_date` 컬럼이 없어서
학생 앱이 수업일(`lesson_date`)밖에 몰랐다. 007 이전에 만들어진 과제는 값이 없어 수업일로
대체하므로, 마감을 뒤로 미뤄 낸 과제는 **실제보다 이르게 보인다**. 시간(HH:MM)은 한 줄에
안 들어가서 넣지 않았다.

**닫기 버튼은 없다** — 시안에도 없고, 카드 밖을 누르면 닫힌다. 버튼을 두면 그만큼 상단
마감 문구가 좁아져 「8월 12일까지 할 수 있어요」가 말줄임된다.

**재도전 이어풀기 중일 때만** 예전처럼 카드 없이 곧장 들어간다 — 고를 게 없기 때문.
오늘의 미션 카드 「시작하기」도 카드를 띄우지 않는다(고정 헤더라 붙일 성이 없다).

### 시안을 이미지로 깔지 않는 이유

`파트 입장.svg`(156×156)는 글자가 전부 벡터 path로 아웃라인화돼 있어(`<text>` 0개)
파트명·문항수를 코드로 바꿔 넣을 수 없다. 이미지 위에 글씨를 덧그리면 `uiux.md`의
「이미지 위 텍스트 중복 렌더 금지」에 걸린다. **좌표만 옮겨 React로 그린다** —
덕분에 파트가 1~2개인 과제에서 카드 높이가 줄어든다(시안은 3줄 고정).

실측값(카드 좌상단 13.2/8.8 기준): 카드 129×129 radius 11 · 알약 42.9×18.7 radius 9.35
`#4F91EB` x 72 · 줄 y 36.3 / 67.1 / 97.9(간격 30.8).

### 주의

- **카드는 프레임 레벨에 그린다** — 맵 컨테이너 안이 아니다(2026-08-10).
  맵은 `overflow-hidden`이고 위쪽이 `MAP_SKY_CROP`(290)에서 잘려서, 안에 두면 1성 카드가
  29px 잘렸다. 아래로 뒤집거나 크롭에 붙여 봤지만 **성마다 위치가 달라지거나 성을 덮어서**
  결국 프레임으로 뺐다. 이제 **하늘 위로 자유롭게 넘어간다**(1성 기준 28.9px).
  위치 규칙은 성 공통 — 몸통 꼭대기(`castleBodyRect`) 위 8px, 가로 중앙(좌우 8px 물림).
- **그래서 스크롤을 직접 빼야 한다.** 맵 밖이라 맵과 같이 움직이지 않는다:
  `프레임 y = SKY_FIXED_H + (맵 y − MAP_SKY_CROP) − 스크롤`.
  스크롤은 CSS px라 **프레임 단위로 환산**해서 쓴다(렌더 폭이 393~540로 달라진다).
- **z 순서**: 닫기용 투명 막 `z-45` < 카드 `z-46`. 막이 카드보다 위면 버튼이 안 눌린다.
- **파트 완료 판정은 카드를 열 때만 조회한다**(`fetchAnsweredQuestionIds`). 성마다 미리
  불러오면 맵 진입이 그만큼 느려진다. 조회 실패 시 빈 집합 → 전부 「입장하기」(막지 않는 쪽으로 실패).
- **문항 0개인 파트는 줄을 만들지 않는다.** 눌러도 러너가 곧장 다음으로 넘어가
  「눌렀는데 아무 일도 안 일어난다」가 된다.
- **러너의 시작 인덱스는 이어풀기 필터를 거친 뒤의 배열에서 찾는다**(`startPart`).
  원본 배열 기준으로 잡으면 이미 푼 섹션이 빠진 만큼 엉뚱한 파트로 들어간다.
- 파트 구분(`partOfSection`)은 러너와 **같은 함수**를 쓴다(`assignment-parts.ts`로 옮김).
  갈리면 카드가 여는 파트와 러너가 푸는 파트가 어긋난다.

## 벡터 맵 (2026-08-08 전환)

**구 맵은 6.2MB SVG 껍데기 안에 가로 360px PNG가 통째로 박혀 있었다.** 최대 540px 폭 · DPR 2~3에서
3~4배로 확대돼 흐릿하고 채도가 죽어 보였다 — 「풀색이 죽었다 / 땅 질감이 다르다」의 원인.
색 값이 틀린 게 아니라 **그려지는 단계에서 뭉개진** 것이었다.

지금은 배경에 아무것도 굽지 않고 전부 따로 그린다.

| 요소 | 방식 | 에셋 |
|------|------|------|
| 풀밭 | CSS 그라데이션 `#74EDB2 → #ADE0E9` (1135px 이후 균일) | 없음 |
| 길 시작 | 둥근 캡으로 시작하는 첫 주기, 1회 | `map-path-start.svg` |
| 길 | 벡터 타일 1주기를 `repeat-y` | `map-path-tile.svg` (1.1KB) |
| 성 | 슬롯마다 **인라인 SVG**(색을 입혀야 해서) | `MapCastleSprite` (원본 `map-castle.svg`) |
| 자물쇠 | 아직 안 준 성에만 | `map-lock-badge.svg` (0.9KB) |
| 나무·공룡 | 주기마다 반복 배치 (`MainHomeMapDecor`) | 커리큘럼 맵과 공유 |

### 성 — 색·크기·미리 그리기

- **성마다 색이 다르다.** `getCastleAccentColor(index)`(8색 순환)를 `MapCastleSprite`에 넘긴다.
  `<img>`가 아니라 인라인 SVG인 이유가 이것 — 파일로 두면 105개가 전부 같은 빨강이 된다.
  강조색 하나에서 밝기만 바꿔 팔레트를 만들고, 창문·깃대는 원본 그대로 고정한다.
- **비율은 에셋 원본(74×82)을 따른다.** 예전 `61/77`(≈0.79)은 구 맵에 구워진 성을 실측한 값인데,
  벡터 성을 그 비율로 그리면 세로가 71%로 눌려 납작해진다. **`CASTLE_SIZE_SCALE = 1`이 원래
  크기다** — 비율을 바로잡은 것만으로 제 크기가 되므로 여기서 더 키우면 성이 길을 덮는다.
- **`castle.h`는 이제 깃대까지 포함한 전체 높이다** (예전에는 몸통 높이였다). 성 대비 크기·위치를
  잡는 계산은 반드시 `castleBodyRect`를 거쳐야 한다 — 안 그러면 깃대만큼 커지거나 위로 뜬다.
  실제로 그래서 도착 캐릭터가 성만큼 커졌고(`castleMascotClipRect`), 상태 마커가 떠 있었다
  (`castleCompleteMarkerCenter`). 둘 다 몸통 기준으로 고쳤다.
- **부여된 성 + 바로 다음 1개**만 그린다 (`MAP_SCROLL_LOOKAHEAD_CASTLES = 1`).
  다음 길은 자물쇠 성으로만 살짝 보이고, **클릭(`CastleHit`)은 부여된 성에만** 붙인다.

### 길 타일 파라미터 (`MAP_PATH_*`)

Figma export(`map-path.svg`)는 시작 (41, 29.07) → 끝 (28, 396.87)로 **정확히 1주기**인 곡선이다.
`map-path-tile.svg`는 그걸 렌더용으로 가공한 것이고 원본과 두 가지가 다르다 — 둘 다 반복 때문이다.

1. **끝점 x를 28 → 41로 당겨 시작점과 맞췄다.** 안 그러면 이음새마다 13px 턱이 생긴다.
2. **곡선을 앞뒤 주기까지 3벌 그린다.** 글로우(가우시안 블러)가 타일 경계에서 잘리지 않게 —
   1벌만 그리면 이음새에 어두운 띠가 보인다.

`map-path-start.svg`는 **앞 주기 복사본만 뺀** 같은 파일이다. 그래야 곡선이 둥근 캡으로
시작한다. 반복 타일만 깔면 화면 맨 위에서 길이 잘린 채 흘러나와 어색하다.
시작 위치 `MAP_PATH_START_Y`는 하늘 크롭 바로 아래에서 처음 오는 주기 시작점이다
(시작 깃발 자리와 맞물린다). **상단 `MAP_PATH_START_PAD`(40px)** 만큼 viewBox·배치를
위로 열어 둥근 캡·흰 글로우가 잘리지 않게 한다 — 안 그러면 출발선이 얇고 白い 사각
이음새로 보인다.

> **길 앞에 리드인(직선)을 덧붙이지 말 것.** 깃발까지 길을 늘이려고 한 번 시도했다가 되돌렸다
> (2026-08-08). 곡선의 시작부가 이미 거의 수평이라 앞에 직선을 이으면 캐릭터 밑에 납작한
> 가로 막대가 생기고 그 끝이 꺾여 「ㄱ자」로 보인다. 깃발 밑동(x≈86, y≈371)이 곡선
> 시작점(80, 363.6)과 이미 맞닿아 있어 덧붙일 필요가 없다.

**주기를 `MAP_CASTLE_PERIOD_LONG × MAP_SCALE ÷ 7`로 못박은 이유**: 성 한 묶음(21개)이
`MAP_CASTLE_PERIOD_LONG`마다 반복되고 `CASTLE_PATTERN`이 3개 주기(가운데·오른쪽·왼쪽)다.
길 1주기에 성이 **정확히 3개** 들어가야 두 패턴이 영원히 안 어긋난다 → 묶음당 길 7주기.

세로 배율·위상·가로 이동(`MAP_PATH_SCALE_Y` / `MAP_PATH_PHASE` / `MAP_PATH_OFFSET_X`)은
**구 맵 위에 겹쳐 렌더해 맞춘 실측값**이다. 임의로 바꾸면 성이 길에서 벗어난다.
`MAP_CASTLE_SLOTS` 좌표는 하나도 바뀌지 않았다 — 배치는 구 맵과 동일하다.

### 하지 말 것

- `MAIN_HOME_ASSETS.map`(구 6.2MB)을 렌더에 되살리지 말 것 — 화질 회귀다. 파일은 대조용으로만 남겼다.
- 맵에 `filter: saturate(...)` 류의 색감 보정을 걸지 말 것. 구 맵의 눌린 채도를 되살리려고 잠깐
  넣었던 것이고(`MAP_COLOR_BOOST`, 제거됨), 벡터 맵에 걸면 형광색이 된다.
- `MainHomeMapCanvas`의 배치(`-MAP_SKY_CROP` / `MAP_CONTENT_H`)를 바꾸지 말 것 —
  성·자물쇠·마커가 쓰는 `fullMapRectStyle`이 이 기준이라 맵 위 요소가 전부 어긋난다.

## 오늘의 미션 카드

`src/components/main-home/TodayMissionCard.tsx` + `today-mission.ts`. 맵 배경(`main-home-academy-map.svg`)에
flatten되어 있던 "1회차 · 오늘의 미션" 자리를 흰 카드로 완전히 덮고 그 위에 실제 데이터를
그린다.

**Export 에셋**: `current-learning-cta-card.svg`(원본 `현재학습_CTA카드.svg`, 392×156, 카드 자체는 x=20 y=20 w=352 h=116) — 카드 안
텍스트·진행률이 전부 실데이터라 이미지 자체는 렌더하지 않고, 좌표만 그대로 가져와 React로
그린다(`today-mission.ts`의 `MISSION_CARD_RECT`/`MISSION_BADGE_RECT`/`MISSION_TITLE_RECT`/
`MISSION_SUBTITLE_RECT`/`MISSION_PROGRESS_TRACK_RECT`/`MISSION_BUTTON_RECT`).

> **좌표 중첩 주의**: 카드 자체(`MISSION_CARD_RECT`)는 프레임(393×852) 기준
> `figmaRectStyle`로 배치하지만, 카드 *안의* 배지·제목·부제·진행바·버튼은 카드가 이미
> absolute 컨테이너이므로 프레임이 아니라 **카드 박스(352×116) 기준** `cardRectStyle`을
> 써야 한다. 여기에 `figmaRectStyle`을 그대로 중첩하면 퍼센트가 두 번 적용돼 요소가 카드
> 왼쪽 위로 뭉치는 버그가 난다 — 실제로 겪었던 버그이니 재현하지 말 것.

**과제 선택**: `pickPrimaryAssignment(assignments)` — `status !== 'completed'` 중 `order`가
가장 빠른 것. 없으면 카드 자체는 계속 보이되 **두 가지 빈 상태**로 갈린다. 둘을 섞지 말 것 —
「낼 과제가 아직 없다」와 「오늘 걸 다 풀었다」는 학생에게 완전히 다른 뜻이다.

| | 조건 | 카드 톤 | 내용 |
|---|------|--------|------|
| 배정 없음 | `assignments.length === 0` | 옅은 회청 그라데이션 + `#E6ECF4` 테두리 + **약한 그림자** | 44×44 라운드 스퀘어(`#EAF2FF`) 캘린더 아이콘 + 제목/부제 |
| 전부 완료 | 과제는 있고 전부 `completed` | 파랑 그라데이션 + `#D6EBFF` 테두리 + 기본 그림자 | 「오늘 완료」배지 + 제목·부제 + 100% 진행바 |

빈 상태(배정 없음)만 그림자를 한 단계 낮춘다 — 내용도 없는 카드가 화면에서 제일 강조돼
떠 있으면 미완성처럼 보인다.

**글자 크기 상한이 있다.** 카드 폭은 프레임 비례인데 글자는 고정 px라, 360px 폰에서
아이콘(44) + 간격(14) + 좌우 여백(40)을 빼면 글자에 **224px**밖에 안 남는다.
제목 19px면 ≈219px로 한 줄에 들어가고 **20px부터는 넘쳐서 두 줄**이 된다. 더 키우려면
아이콘을 줄이거나 빼야 한다. `truncate`는 쓰지 않는다 — 넘칠 땐 잘라내는 것보다 줄바꿈이
낫고, 카드 높이 116에는 두 줄이 되어도 여유가 있다.
(다른 두 상태의 제목 23px는 `MISSION_TITLE_RECT`(w 220)에 `truncate`로 들어가 있어
긴 제목은 실제로 잘린다 — 빈 상태와 다른 처리다.)

**표시 항목**:

| 항목 | 값 |
|------|-----|
| 배지 | `progressPercent === 0` → "오늘의 미션" / 그 외 → "현재 학습 중" |
| 제목 | `assignment.title` — 학년·반 제외한 표시명 (`displayAssignmentTitle`, 예: `문장 과제 · 2026. 8. 1.`) |
| 부제 | `약 n분 소요`만 (`getRemainingMinutes`, 문제당 10초). 「n문제 남음」 미표시 |
| 진행률 | 트랙 + 채움 바 + 우측 `n%` 라벨 |
| 진행률 바 | 트랙 `#D9E3F7` · 채움 `#4F91EB`, 폭 = `assignment.progressPercent` |
| 버튼 | `progressPercent === 0` → "시작하기 →" / 그 외 → "이어서 학습하기 →", `#4F91EB` 배경 |

**버튼 동작**: 기존 `onOpenAssignment` prop을 그대로 재사용 — `setActiveAssignment` +
`goToStep('assignment-runner')`로 `AssignmentRunnerScreen` 진입. "이어서 학습하기"도 별도
재개 인덱스가 필요 없다 — `AssignmentRunnerScreen`이 `startOrResumeAttempt` +
`fetchAnsweredQuestionIds`로 이미 답한 문제를 걸러내고 자동으로 이어서 보여준다.

`StudentAssignment.answeredCount`(신규 필드, `types.ts`/`fetchStudentAssignments`)는 최신
`attempts` 로우의 `answeredCount`를 그대로 threading한 값.

---

## 목표 — 동적 성 맵 렌더링 명세

> **구현 전.** UX: [../uiux.md](../uiux.md) §4.2 · 디자인: [../design.md](../design.md) §1.1 · 연동: [../student-teacher-sync.md](../student-teacher-sync.md)

### 입력 데이터

정렬된 과제 배열만 사용한다. `assignedCastleCount`를 따로 저장하지 않는다.

```ts
type CastleStatus = 'active' | 'completed'

interface MapAssignment {
  assignmentId: string
  order: number          // 1-based map order
  title: string
  status: CastleStatus   // active = 미완료, completed = 완료
  progressPercent: number
}
```

- `assignmentCount = assignments.length`
- `status === 'completed'` → 체크 오버레이
- **부여된 모든 성(완료 포함)은 클릭 가능** → 해당 학습 step으로 진입/재진입

### 높이·스크롤 계산

```
contentHeight =
  HEADER_H
  + SEGMENT_H × assignmentCount
  + END_PADDING

maxScrollTop =
  max(0, contentHeight - VIEWPORT_H)

// 또는 마지막 성 하단 기준 (내비에 가리지 않게)
maxScrollTop =
  max(0, lastCastleBottomY + END_PADDING - VIEWPORT_H)
```

| 상수 | 의미 |
|------|------|
| `VIEWPORT_H` | 852 |
| `NAV_H` | 81 — `END_PADDING`에 포함 |
| `SEGMENT_H` | 성 1개당 길 구간 (디자인 토큰) |
| `HEADER_H` | 시작 깃발·미션 카드 구간 |

스크롤 컨테이너는 `overflow-y: auto` + **풀맵 배경 유지**.
드래그 상한은 `resolveMapMaxScrollTop(assignedCount)`로 클램프하되
**부여된 성 + 1**(`MAP_SCROLL_LOOKAHEAD_CASTLES = 1`)까지 스크롤한다.
진입 시 「현재 위치」는 스크롤 뷰포트 **세로 중앙**에 맞춘다.

### 슬롯 생성

```
for i in 0 .. assignmentCount-1:
  side = (i % 2 === 0) ? 'left' : 'right'   // 시안 확정 시 반전 가능
  y = HEADER_H + SEGMENT_H * i
  render pathSegment(i)
  render castle(assignments[i], side, y)
  if assignments[i].status === 'completed':
    render checkMarker(side, y)
```

### 과제 개수별 화면

| `assignmentCount` | 화면 | 스크롤 |
|-------------------|------|--------|
| 0 | 헤더·시작 깃발만 (성 없음), 빈 상태 카피 TBD | 스크롤 거의/전혀 없음 |
| 1 | 헤더 + 구간 1 + 성 1 | 성이 내비 위에 보이도록 상한 제한 |
| N (≥2) | 헤더 + 구간 N + 성 N (L/R 교대) + 다음 자물쇠 1 | 마지막(N) + 룩어헤드 1까지 |

### 성 상태 마커 (자물쇠 자리 = `castleCompleteMarkerCenter`)

**자물쇠를 포함한 모든 성 상태 마커는 `castleCompleteMarkerCenter` 하나만 쓴다.**
성 슬롯 몸통 꼭대기 기준 **통일 오프셋**(`MARKER_OFFSET_FROM_CASTLE_TOP = -43`)이라
성이 몇 번째든 성 대비 같은 자리에 뜬다.

`bakedLockMarkerCenter`는 **맵이 래스터였던 시절 구운 자물쇠 실측 좌표**다. 성마다 어긋나 있다 —
1성은 통일 좌표보다 18px 위, 나머지는 성 패턴 3주기를 따라 1~4px씩 흔들린다.
**마커 자리로 쓰면 안 된다.** 배경이 벡터가 된 뒤로는 구운 자물쇠 자체가 없어서 덮개 용도도 없다.

| 상태 | 마커 | 컴포넌트 |
|------|------|----------|
| **과제 미부여** | 흰 원 + **자물쇠** — 「아직 안 준 성」의 뜻으로만 쓴다 | `CastleLockBadge` (`map-lock-badge.svg`) |
| **부여·미시작** | 성 액센트 색 원 + **흰 깃발** | `CastleAssignedFlag` |
| └ 그중 **다음에 풀 성** 1개 | 같은 깃발 + 아우라 진하게 + 바운스 | `CastleAssignedFlag next` |
| 진행중 | 코랄 필 「진행중」 | `CastleStatusPill` (coral) |
| 재도전 중 | 코랄 필 「재도전 중!」 | `CastleStatusPill` (coral) |
| 완료 | 성 액센트 색 원 + **흰 별표** | `MissionCheckBadge` |

- **2026-08-05 변경.** 그 전에는 부여된 성도 자물쇠 그대로여서 **미부여 성과 구분되지 않았다.**
  그래서 「과제 2개인데 노란 성이 잠김」 오해를 막으려고 `MAP_SCROLL_LOOKAHEAD_CASTLES = 0`으로
  미부여 성을 아예 안 보이게 막아 뒀다. 깃발/자물쇠로 구분된 뒤 **2026-08-09**에
  `MAP_SCROLL_LOOKAHEAD_CASTLES = 1`로 다음 성만 살짝 보이게 풀었다.
- **2026-08-06.** 상태 마커를 성 슬롯 기준 통일 좌표로 맞춤(1성 베이크가 유난히 위쪽이던 편차 제거).
- **2026-08-09.** 그때 **자물쇠만 빠뜨려서** 계속 베이크 좌표를 쓰고 있었다 — 「자물쇠 위치가 성마다
  다르다」의 원인. 자물쇠도 같은 좌표로 옮김. 크기는 별표/깃발보다 작은 채로 둔다(35 vs 58):
  별표·깃발 에셋은 67 뷰박스에 아우라가 포함돼 실제 원이 ≈35라, 아우라 없는 자물쇠는 그 원에 맞춘 값이다.
- 깃발·별표는 **같은 원형 뱃지 계열**이고 글리프만 다르다 — 색만으로 구분하지 않기 위해서다.
  뷰박스(67×67)와 크기가 같아 둘 다 `fullMapMarkerStyle` 자리에 그대로 들어간다.
- 「다음에 풀 성」 = 완료도 진행중도 아닌 **첫 성**. 부여된 성이 여러 개여도 바운스는 하나뿐이라
  맵이 시끄러워지지 않는다.

### 클릭·완료 동작 (목표)

| 상태 | 클릭 |
|------|------|
| `active` | 해당 과제 학습 플로우 시작 |
| `completed` | `GrammarCompleteScreen`(점수·재도전/틀린문제만). **재도전**은 완료 취소가 아니라 다시 풀기 — 맵 「현재 위치/진행중」캐릭터와 무관. 재도전 중엔 해당 성 별표 대신 「재도전 중!」만 표시 |
| `in_progress` | 캐릭터는 이 성에 둠. **상단** 자물쇠 자리 「진행중」(`CastleRetryingPill`, 재도전과 동일 자리) · **하단** 캐릭터 발밑 「현재 위치」(파랑) |
| `active`(미시작) | 캐릭터는 **직전 완료 성**(없으면 시작 깃발). 미시작 성으로는 이동하지 않음 |

완료 후 맵 복귀 시 해당 성만 `completed`로 갱신하고, 맵 길이는 과제 배열이
바뀌지 않는 한 유지한다.

### 목표 (연동 후)

- 초대코드 검증·과제 목록·완료 상태는 이미 Supabase API로 동작한다(env 필요,
  `enroll_with_invite_code` RPC + `fetchStudentAssignments`) — 남은 목표는 **동적 성 맵
  렌더링**(위 §"목표 — 동적 성 맵 렌더링 명세")뿐이다.
- 맵 픽셀 좌표는 **클라이언트 전용**; 서버는 정렬된 과제 + `status`만 전달
- 상세: [../student-teacher-sync.md](../student-teacher-sync.md)

## 헬스장 · 오답 다시 풀기 (2026-08-11)

`components/gym/` — `GymScreen.tsx` · `GymNewBadge.tsx` · `gym.ts`
`features/assignments/wrong-reissue.ts`

**「오답만 다시 출제」로 온 과제는 성 맵에 올리지 않는다.** 예전에는 개인 과제가 그대로 성이
하나 더 생겨서, 같은 제목의 성이 나란히 서고 학생은 그게 뭔지 알 수 없었다(교사도 지울 방법이
없어 2026-08-09에 DB에서 직접 지웠다). 이제 **헬스장에서 푼다.**

| 무엇 | 어디 |
|------|------|
| 판별 | `target_student_id`가 있으면 오답 과제 (`isWrongReissue`) |
| 성 맵 | `castleAssignments()` — 개인 과제 제외(다시 적용 · 성은 `MIN_DRAWN_CASTLES`로 항상 그려져 맵이 비지 않음) |
| 오늘의 미션 | `pickPrimaryAssignment` — 오답 재출제 제외 |
| 헬스장 대기열 | `pendingWrongReissues()` — **미완료만, `assignedAt` 오래된 순** |
| 진입 | 하단 내비 「헬스장」 → 운동하는 캐릭터(283.6² @ 39,257) 탭 · 「오답 다시 풀기 · 탭」칩 |
| 알림 | 내비 「헬스장」 칸 **위**에 빨간 `New`(`GymNewBadge`) · 2개 이상이면 `New 2` |

- **여러 개 쌓이면 먼저 낸 것부터** 푼다(사용자 지정). 캐릭터를 누르면 대기열의 첫 번째가 열린다.
- **대기열이 비면 캐릭터에 히트영역을 두지 않는다** — 안내 문구만 보여 준다.
- 시안 `gym-main.svg`에는 **하단 내비가 구워져 있다**(y770, 5칸). React 내비를 위에 겹치지 않고
  투명 히트영역만 얹는다 — 겹치면 내비가 두 겹이 되고 구워진 「헬스장」 활성 표시도 가려진다.
- 혼자 공부 메인에도 탭은 있지만 반 과제가 없어 보통 비어 있다.

> 원본 `헬스장.svg`는 1254² PNG가 283.6² 자리에 박혀 729KB였다 → 표시 크기 3배(852²)로 줄여
> `gym-main.svg` 533KB. `New` 알림은 시안에 굽지 않는다 — 상태에 따라 붙었다 떨어지는 것이다.
