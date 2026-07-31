# 혼자 공부 · 내신 코스 / 커리큘럼 메인

> **이 화면 = 혼자 공부 학생 플로우.**  
> 학원/학교 메인(`/student/home`)과 **다른 화면**이다. 헷갈리면 [INDEX.md 학생 메인 2종](../INDEX.md) 참고.

## 현재 구현

| 화면 | 라우트 | 에셋 | 상태 |
|------|--------|------|------|
| 내신 코스 만들기 | `/student/curriculum` | `onboarding-curriculum-course.svg` | ✅ 학년·교재 드롭다운 · **단원 1~8 버튼(최대 2개)** |
| **혼자 공부 메인 맵** | **`/student/curriculum/main`** | `main-screen-long.svg` (`메인화면LONG`) | ✅ 하늘·내비 고정 · LONG 배경 세로 스크롤 |

> 「혼자 공부 메인」= **`/student/curriculum/main`** (`CurriculumMainScreen`).  
> 「학원/학교 메인」= **`/student/home`** — 여기 문서가 아님 ([main-home.md](./main-home.md)).

### 플로우

1. 온보딩 목적 = `self-study` → `/student/curriculum`
2. 학년 / 교재 선택 · **단원 1~8 중 최대 2개** 선택 (`1단원`…`8단원` 버튼)
3. 「특별 내신 코스 생성하기」 → `/student/curriculum/main` (칩 라벨 예: `중2 · NE능률(김) · 1,3단원`)
4. 맵 배경 = `메인화면LONG` — **하늘(타이틀·코스 카드)은 React 고정**, LONG이 길면 **세로 드래그/스크롤**
5. 하단 내비: **홈·전체** → `/student/curriculum/main` · **단어장·복습** → 설정 창 (`design.md` 81px)

### 맵 배경 · 캐릭터 (명세)

| 항목 | 내용 | 상태 |
|------|------|------|
| 배경 | `메인화면LONG` / `main-screen-long.svg` — 경로·장식 배경만. 구 공룡(네시형)은 `opacity=0` | ✅ |
| 장식 공룡 | `dinosaur.svg` → `CurriculumDinosaurDecor` (좌·우 연못 자리, 우측은 `scaleX(-1)`) | ✅ |
| 장식 나무 | `trees.svg` → round/tall 크롭 PNG → `CurriculumTreeDecor` (가장자리 구 캡슐 나무 8자리 교체. 버섯은 유지) | ✅ |
| 스크롤 | 하늘 아래 · 내비 위 영역에서 세로 드래그 가능 | ✅ |
| 시작(0%) | `커리큘럼시작캐릭터` + Day **1·2·3** 빨간 활성(React). LONG 베이크 1~3·파란 글로우·러닝 스프라이트·시작 깃발은 `opacity=0` | ✅ |
| 출발선 | `checkered-floor-start.png` — 노란 길 시작(y≈498) 체크무늬 오버레이 | ✅ |
| Day 순차 해금 | 이전 주 3 Day 완료 → 다음 주 해금(…→10·11·12→13·14·15). **짝수 주는 우→좌**라 화면 왼쪽부터 `6·5·4` / `12·11·10` | ✅ |
| Day 탭 | 해금·미완료 Day 탭 → 완료 처리(학습 세션 연동 전 로컬 스텁, `sessionStorage`) | ✅ |
| 달리는 캐릭터 | 다음 해금·미완료 Day **원 위**에 `curriculum-running-character.png`(z > Day 버튼). 짝수 주는 `scaleX(-1)`. 주차 라벨은 캐릭터와 안 겹치게 위·행 중심에 배치 | ✅ |

> Day 해금·완료는 `CurriculumDayNodes` + `loadCompletedDays`. 실제 학습 세션 연동 시 `onCompleteDay`만 세션 완료 콜백으로 바꾸면 된다.

### TBD

- 코스 카드에 선택값(학년·교재·단원) 동적 반영 → ✅ 하늘 칩에 `중2 · NE능률(김) · 1,3단원` 형식 표시
- 단원 1~8 개별 버튼 · **최대 2개** 다중 선택 → ✅
- 칩 클릭 → `커리큘럼 드롭다운` 시안 패널(선택 행·삭제·새 코스 추가) → ✅
- 진도 0% 미션 카드(**학원/학교 메인** `/student/home`과 동일 UI 패턴) → ✅
- 성·일차 클릭 → 학습 세션 연동
- 내비 탭별 화면 (단어장·복습·전체)
- Supabase에 혼자 공부 코스 저장
