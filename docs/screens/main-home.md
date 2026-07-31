# 학원/학교 학생 메인 (초대코드 · 성 맵)

> **이 화면 = 학원·학교(선생님 초대) 학생 메인.**  
> 혼자 공부 메인(`/student/curriculum/main`)과 **다른 화면**이다. 헷갈리면 [INDEX.md 학생 메인 2종](../INDEX.md) 참고.  
> 구어 「student/main」≠ 코드 경로. **실제 라우트는 `/student/home`.** (`/student/main` 없음)

| 항목 | 값 |
|------|-----|
| 경로 | **`/student/home`**, `/teacher/home` |
| 진입 | 온보딩 「선생님 초대를 받았어요」 → 초대코드 → 성 맵 |
| 구현 | `src/pages/MainHomeScreen.tsx`, `src/components/main-home/AssignmentReceivedScreen.tsx` |
| 데이터 | `assignment-home.ts` (`TEST_STARS` 등) |
| **아님** | `/student/curriculum/main` (`CurriculumMainScreen` · Day 노드 · LONG 스크롤) |

> 두 경로(`/student/home`, `/teacher/home`) 모두 동일 `MainHomeScreen`을 렌더한다. 교사 전용 UI는 **목표상** `loopin-project`.

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 초대코드 입력 | 메인 맵 배경 + 초대 UI 오버레이 | `main-home-academy-map.svg` + `main-home-invite-ui.svg` |
| 입력 후 대기 | `메인화면(초대코드 입력후).svg` | `main-home-invite-entered.svg` |
| 과제 부여 후 | `메인화면(과제 부여 받은후).svg` | `main-home-assignment-received.svg` |
| 하단 탭바 | *(위 프레임 y770..852)* | `main-home-bottom-nav.svg` |
| 스크롤 맵 | `학원학교 학생용 메인화면.svg` | `main-home-academy-map.svg` (단일 LONG, bridge/segment 없음) |
| 맵 LONG 원본 | `학원학교 학생용 메인화면.svg` | `main-home-map-long.svg` · `학원학교 학생용 메인화면.svg` |
| 미부여 성 | `회색 성.svg` | `castle-gray.svg` |
| 맵 성 (슬롯) | *(제공 PNG)* | `map-castle-red-flag.png` — **현재 미사용**(배경 LONG에 성 포함). React 성 오버레이 취소 |
| 완료 뱃지 | `미션 체크.svg` | `mission-check.svg` |
| 반·과제 드롭다운 | `Dialog.svg` | React `SessionRoundDropdown` (필+패널) |
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
| 전체 지도 | `학원학교 학생용 메인화면.svg` → `main-home-academy-map.svg` (360×2623 → 프레임 393×≈2863). **성은 배경에 포함.** React 성/체크 오버레이 없음(투명 히트만). 반·과제 필·미션 카드·칭찬 캘린더·하단 내비는 오버레이 |
| 반복 구간 (4성~) | **제거됨.** bridge/segment 타일 없음 — LONG 단일 배경 + `MAP_CASTLE_SLOTS` 슬롯 |
| 고정 헤더 | 하늘색(`#E2F7FF`) 배경을 `MISSION_HEADER_FIXED_H`(`today-mission.ts`, 반·과제 필+오늘의 미션 카드 하단 + 20px 여백) 높이만큼 스크롤 컨테이너 **위에** 얹어 고정 — 맵을 스크롤해도 헤더 영역은 전혀 움직이지 않고, 초록 성 맵(풀 영역)만 그 아래로 스크롤된다 |
| 반·과제 선택 | 상단 흰 알약 드롭다운 — `A반 3회차` 형태. 라벨 = `classes.name` + `assignments.title`(선생님 웹 지정값). `SessionRoundDropdown` |
| 오늘의 미션 카드 | SVG에 flatten된 자리 위에 `TodayMissionCard`(React)로 덮어 렌더 (고정 헤더 안) — 아래 "오늘의 미션 카드" 절 참고 |
| 칭찬 캘린더 | **뷰포트 고정** (`PraiseCalendarButton` + `PRAISE_CALENDAR_FIXED_RECT`). 맵 드래그/스크롤에 움직이지 않음 |
| 시작 위치 캐릭터 | LONG 원본에 포함된 경우 에셋 그대로. React `MapCharacter` 오버레이는 미사용 |
| 성 위 환호 루핀 | **제거함.** `CastleCompleteMascot` 미렌더 |
| 하단 네비게이션 | **뷰포트 고정** `MainHomeBottomNav` + `main-home-bottom-nav.svg`. **홈·전체** → `/student/home` 맵 · **단어장·복습** → 설정 창 |
| 스크롤바 | 숨김, 터치·휠 스크롤 지원 |

### 맵 캐릭터 규칙 (에이전트용 · 다시 확인)

| 위치 | 무엇 | 현재 |
|------|------|------|
| **위** — 시작 깃발 옆 | 파란 루핀(대기) + 「현재 위치」 필 | LONG 원본에 포함된 경우 에셋 그대로 |
| **아래** — 성/브릿지 위 환호·잔상 | 환호 루핀 · 성 「현재 위치」 React 필 · 브릿지 구운 루핀 | **삭제** — React 오버레이 없음 · 브릿지 에셋도 클린 |

## 성 상태 (현재 `TEST_STARS`, `assignments` prop이 `undefined`일 때만 렌더 — 위 초대코드 게이트 때문에 현재는 도달 불가한 데모 경로)

| 성 | assigned | 완료 표시 | 클릭 |
|----|----------|-----------|------|
| 1 | true | 완료 시 성 색 별표(`MissionCheckBadge`) | → 단어 세션 (`word-match`) |
| 2 (노란 성) | true | 완료 시 성 색 별표 | → `learning-1` |
| 3·4 등 | false | 맵에 자물쇠 (별표 없음) | 불가 |

전체 지도 좌표:
`FULL_MAP_STAR_1_CASTLE`, `FULL_MAP_STAR_2_CASTLE`,
`FULL_MAP_STAR_1_MARKER`, `FULL_MAP_STAR_2_MARKER`.

## 반·과제 드롭다운

`SessionRoundDropdown` — 고정 헤더 상단 중앙의 흰 알약 + 파란 쉐브론.  
필 타이포 **17px bold**, `max-w-[92%]`, 패딩 `px-5 py-3.5` (긴 `반 · 교재 · 단원` 라벨용).

| 항목 | 동작 |
|------|------|
| 라벨 | `formatClassAssignmentPill(className, title)` → 예: `A반 3회차`, `중2-1반 중간고사대비` |
| 반 이름 | `fetchMyEnrollments()` → `Enrollment.className` (`classes.name`, 선생님 웹에서 지정) |
| 과제 목록 | `fetchStudentAssignments(classId)` — `title`·`lessonDate`·`order`·`status` |
| 기본 선택 | 미완료(`completed` 아님) 중 `order` 최우선, 없으면 첫 과제 |
| 선택 시 | 필 라벨만 갱신 (맵 스크롤 연동 없음) |
| 폴백 | 서버 과제 없을 때 `SESSION_ROUNDS` 데모 라벨 (`1회차`…) |
| 초대 미리보기 | `ClassRoundPillLabel surface="dimmed"` — 비활성 딤 필 |

## 오늘의 미션 카드

`src/components/main-home/TodayMissionCard.tsx` + `today-mission.ts`. 맵 배경(`main-home-academy-map.svg`)에
flatten되어 있던 "1회차 · 오늘의 미션" 자리를 흰 카드로 완전히 덮고 그 위에 실제 데이터를
그린다 — 상단 반·과제 필과 같은 "배경으로 덮고 텍스트만 얹는" 패턴.

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
가장 빠른 것. 없으면(배정 없음 / 전부 완료) 카드에 안내 문구를 표시(카드 자체는 계속 보임) —
왼쪽에 원형 아이콘(배정 없음: 파랑 `#4F91EB` 캘린더, 전부 완료: 초록 `#22C55E` 체크) + 오른쪽
제목·부제 2줄, 카드의 기존 파랑 톤과 어울리게 아이콘 배경도 옅은 파랑/초록(`#EAF2FF`/`#E9F9EE`).

**표시 항목**:

| 항목 | 값 |
|------|-----|
| 배지 | `progressPercent === 0` → "오늘의 미션" / 그 외 → "현재 학습 중" |
| 제목 | `assignment.title` (선생님이 배정한 문제 세트 이름) |
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
**부여 성 + 2개**(`MAP_SCROLL_LOOKAHEAD_CASTLES`)까지 보이도록 허용한다.
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
| N (≥2) | 헤더 + 구간 N + 성 N (L/R 교대) | 마지막(N) 성까지만 |

### 클릭·완료 동작 (목표)

| 상태 | 클릭 |
|------|------|
| `active` | 해당 과제 학습 플로우 시작 |
| `completed` | `GrammarCompleteScreen`(점수·재도전/틀린문제만). **재도전** 시 동일 학습 재진입. 재도전 중엔 별표 대신 「재도전 중!」, **현재 위치 캐릭터는 이전 성**(없으면 시작 깃발)으로 후퇴 · 다시 풀이를 마치면 별표·현재 위치 복귀 |
| 배열에 없음 | 슬롯 없음 → 클릭 대상 없음 |

완료 후 맵 복귀 시 해당 성만 `completed`로 갱신하고, 맵 길이는 과제 배열이
바뀌지 않는 한 유지한다.

### 목표 (연동 후)

- 초대코드 검증·과제 목록·완료 상태는 이미 Supabase API로 동작한다(env 필요,
  `enroll_with_invite_code` RPC + `fetchStudentAssignments`) — 남은 목표는 **동적 성 맵
  렌더링**(위 §"목표 — 동적 성 맵 렌더링 명세")뿐이다.
- 맵 픽셀 좌표는 **클라이언트 전용**; 서버는 정렬된 과제 + `status`만 전달
- 상세: [../student-teacher-sync.md](../student-teacher-sync.md)
