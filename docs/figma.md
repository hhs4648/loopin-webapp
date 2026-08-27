# Figma → 코드

> 피그마 시안을 코드로 옮길 때의 **단일 기준 문서**.  
> 레거시: [figma-implementation.md](./figma-implementation.md), [figma-handoff-guide.md](./figma-handoff-guide.md) — 충돌 시 **이 문서를 우선**한다.

---

## 1. 공통 원칙

| 항목 | 규칙 |
|------|------|
| 디자인 소스 | 피그마 프레임·컴포넌트를 있는 그대로 구현 |
| 프로젝트 | `loopin-webapp` 유지 — 새 프로젝트 생성 금지 |
| 스타일 | Tailwind CSS 4 |
| 프레임 | 393 × 852 (디자인), 앱 셸 max 540px |
| 임의 변경 | 색·간격·타이포·카피 금지 (기획 협의 후만) |
| 에셋 | Export 원본(SVG/PNG/WebP) 우선 |

Figma 파일: `https://www.figma.com/design/NFmd87QHBjrA3r9zV9s8Q7/Haksup`

---

## 2. 구현 패턴: Export + 오버레이

대부분의 화면은 다음 패턴을 쓴다.

1. Figma에서 프레임(또는 그룹) Export → `public/assets/...`
2. `FigmaAssetFrame`으로 이미지 표시 (`pointer-events-none`)
3. 자식으로 투명 `button` / `input`을 **퍼센트 좌표**로 배치
4. 클릭·입력만 DOM이 처리, 시각은 SVG가 담당

```tsx
<FigmaAssetFrame src="/assets/....svg" alt="...">
  <button
    type="button"
    aria-label="계속하기"
    className="absolute z-[2] cursor-pointer bg-transparent"
    style={figmaRectStyle(rect)}
    onClick={...}
  />
</FigmaAssetFrame>
```

좌표 헬퍼 예:

- `figmaRectStyle` — `castle-learning.ts`, onboarding UI
- `frameRectStyle` / `grassRectStyle` — `assignment-home.ts`

### 주의

- 선택지 **글자를 React로 다시 그리지 말 것** (겹침). SVG 글자만 쓰고 선택 테두리만 오버레이.
- 정답 미리보기 이펙트가 Export에 포함되면 SVG에서 중립 상태로 수정.

---

## 3. Export·파일명

### 추천 전달 방식

1. **Figma Export (1순위)** — 프레임/그룹을 SVG 또는 PNG @2x로보내 `public/assets/`에 저장
2. **링크 + node-id** — Dev/Full seat + MCP 사용 시
3. **전체 화면 PNG** — 시각 QA 기준 이미지로 첨부

### 파일명 정책

| 규칙 | 설명 |
|------|------|
| 목표 | ASCII kebab-case (`main-home-invite-code.svg`) |
| 한글 Export | 저장 후 rename (아래 표) |
| 현황 | 2026-07-25 전체 에셋을 ASCII kebab-case로 rename 완료 — `public/assets`에 한글 파일명 없음. 신규 에셋도 ASCII로 저장하고 아래 표 갱신 |
| 캐시 | 내용이 바뀌면 URL 쿼리 (`?v=2`) 또는 파일명 버전으로 캐시 버스팅 |

### 표준 rename 표 (온보딩·메인)

> **왼쪽 열은 Figma에 있는 원본 이름이다.** 브랜드 변경(2026-08-21)으로 이 표의
> `루핀 …` 항목을 `마스코트 …`로 고쳐 적었다. **Figma 쪽 레이어 이름도 같이 바꿔야**
> 표와 실물이 맞는다 — 아직 안 바꿨다면 Figma에서는 옛 이름으로 찾아야 한다.

| Figma Export (원본) | 코드 파일명 |
|---------------------|-------------|
| `플래시화면.svg` (워드마크만, ~17KB) | `splash-screen.svg` | 스플래시·온보딩 로딩 |
| `플래시화면.svg` (로그인 풀프레임, ~1.2MB) | `login-screen.svg` | 학습 로그인. 원본 `_design-source/로그인화면.svg` |
| `로그인화면.svg` | `login-screen.svg` *(구 시안 — 위 학습 에셋으로 교체됨)* |
| `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` |
| `온보딩_회원가입 2(교사 선택).svg` | `onboarding-teacher-02-school.svg` |
| `온보딩_회원가입 3(교사 선택).svg` | `onboarding-teacher-03-name.svg` |
| `온보딩_회원가입 4(교사선택).svg` | `onboarding-teacher-04-complete.svg` |
| `온보딩_생년월일_선택전.svg` | `onboarding-student-03-birthdate.svg` |
| `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` |
| `온보딩_학습목적선택.svg` (node `5669:851`) | `onboarding-student-06-purpose.svg` (**미사용** — 온보딩 단계 삭제, 2026-08-11) |
| `메인화면.svg` | `main-home-invite-code.svg` |
| `메인화면(초대코드 입력후).svg` | `main-home-invite-entered.svg` |
| `메인화면(과제 부여 받은후).svg` | `main-home-assignment-received.svg` |
| `Container.svg` | `birthdate-dropdown-container.svg` |
| `회색 성.svg` | `castle-gray.svg` |
| *(과제부여 프레임 하단)* | `main-home-bottom-nav.svg` | 학원/학교 메인 하단 탭 (홈·단어장·복습노트·메뉴). **바 전체 탭 → 설정 창** |
| `설정 창.svg` | `settings-window.svg` | 설정 풀스크린 오버레이 (`SettingsWindow`). **401×852** 단일 프레임(하단 베이크 내비는 패널에서 크롭). 이름·연동(카카오/애플/구글)·이용안내/로그아웃 히트는 `settings.ts` 좌표 |
| `복습하기 메인화면.svg` | `review-main.svg` | 복습하기 시안 393×811(내비 위). **코드에서 쓰지 않는다** — 글자가 전부 벡터 path(`<text>` 0개)라 유형명·정답률 숫자를 바꿀 수 없어서, `ReviewMainWindow`는 이 시안의 색·간격을 참고해 직접 그린다. 색·치수 대조용으로만 보관 |
| *(위 시안 내장 PNG 추출)* | `review-cat-reading.png` | 복습 파란 카드 속 책 읽는 고양이 (420px) |
| *(위 시안 내장 PNG 추출)* | `review-cat-cheer.png` | 복습 빈 상태의 만세 고양이 (260px) |
| `복습 화면 추가.svg` | `review-card-banner.svg` | 파란 카드 아래 배너(377×120). `ReviewMainWindow` |
| `재도전 화면.svg` | `castle-retry-screen.svg` | 완료 성 재도전 확인 풀프레임 (`CastleRetryConfirmScreen`). 하늘 색은 무시 · 카드·버튼만 시안 기준 |
| `미션 체크.svg` | `mission-check.svg` |
| `별표.svg` | `mission-star.svg` — 과제 완료 성 마커(원+별). 렌더는 `MissionCheckBadge`가 성 색으로 채움 |
| `Dialog.svg` | `session-dropdown-dialog.svg` |
| `마스코트 환호 캐릭터.svg` | `mascot-cheer.svg` | *(구 환호 — 보관)* |
| `만세 캐릭터.svg` | `mascot-banzai.svg` | 학원/학교 메인 · 현재 위치 성 만세 마스코트 (`CastleCompleteMascot`) |
| `마스코트 캐릭터 시작.svg` | `mascot-character-start.svg` — 시작 지점 대기 포즈(`MapCharacter`) |
| `praise-calendar-source.png` *(내용 SVG)* | `praise-calendar.svg` — 칭찬 캘린더 풀스크린 · 상태 얼굴 PNG 추출(`praise-status-*.png`) |
| `연속학습_캘린더_화면.svg` | `streak-calendar.svg` — 연속 학습 캘린더 풀스크린 (`StreakCalendarScreen`). 원본은 `_design-source/연속학습_캘린더_화면.svg`. **1차는 시안 그대로** (날짜·일수 구워짐 · React 재렌더 금지) |
| `dinosaur.svg` / `trees.svg` *(제공)* | `curriculum-dinosaur.svg` · `curriculum-tree-round.png` / `curriculum-tree-tall.png` — **학원/학교 맵** 장식 (`MainHomeMapDecor`). 파일명에 curriculum이 남아 있으나 커리큘럼 기능은 삭제됨 |
| *(학원 메인 하단 · 복습 활성)* | `main-home-bottom-nav-review.svg` |

> **삭제 (2026-08-11):** 혼자 공부·커리큘럼 전용 에셋
> (`onboarding-curriculum-course`, `main-screen-long`, `curriculum-start*`, `curriculum-bottom-nav*`,
> `curriculum-dropdown`, `curriculum-running-character`, `curriculum-main-long*` 등) 및 관련 한글 Export.

학습·연습 에셋 (현재 저장소 — 2026-07-25 전면 ASCII kebab-case로 rename 완료. 한글 파일명 없음):

| Figma Export (원본) | 코드 파일명 | 용도 |
|---------------------|-------------|------|
| `학습1~4.svg` | `castle-learning-1.svg` … `castle-learning-4.svg` | 2회차 성 학습 |
| `단어A_시작.svg` | `word-a-start.svg` | 단어 A · 짝맞추기 (영문↔한글) |
| `단어A_선택/정답/비활성화/전체정답.svg` | `word-a-select.svg` / `word-a-correct.svg` / `word-a-disabled.svg` / `word-a-all-correct.svg` | 단어 A 상태 (미사용 · 보관) |
| `단어1_오답.svg` | `word-a-wrong.svg` | 단어 A 오답 (미사용 · 보관) |
| (임시) TTS 뜻 짝맞추기 | `word-a-start.svg` 재사용 | **단어 B** · `WordListenMatchScreen` — 전용 Export 전까지 A 프레임 + 오디오 오버레이 |
| `단어B_시작.svg` | `word-b-start.svg` | **현재 코드:** 단어 C(3지선다)가 사용 중 → **목표:** `word-c-*.svg`로 재매핑 |
| `단어C.svg` / `단어C_채우기/정답시/오답시.svg` | `word-c.svg` / `word-c-fill.svg` / `word-c-correct.svg` / `word-c-wrong.svg` | **현재 코드:** 단어 D(예문 빈칸)가 사용 중 → **목표:** `word-d-*.svg`로 재매핑 |
| `본문A/C.svg` | `body-text-a.svg` / `body-text-c.svg` | 본문 A·C (B는 A 에셋 재사용) |
| `본문B.svg` | `body-text-b.svg` | 본문 B (미사용 · 보관) |
| `본문 끝.svg` | `body-text-complete.svg` | 본문 완료 |
| `유형1.svg` / `유형2.svg` / `유형2정답X.svg` | `grammar-type-1.svg` / `grammar-type-2.svg` / `grammar-type-2-x.svg` | 문법 |
| `문법정답클릭.svg` | `grammar-answer-click.svg` | 문법 피드백 (미사용 · 보관) |
| `단어파트 완료화면.svg` | `word-part-complete.svg` | 단어 파트 완료 · `LearningCompleteScreen` (계속하기 / 홈). **2026-08-06 20시 재Export로 교체(`?v=5`)** — 캐릭터가 만세→엄지척으로 바뀌었고 레이아웃·배지 좌표는 이전과 동일. 606×1134, 콘텐츠 x=81.1797부터 523×1134 → `viewBox`만 콘텐츠 프레임으로 바꿔 393×852로 크롭 |
| `문장,문법 완료화면.svg` | `sentence-grammar-complete.svg` | **2026-08-06 점수대별 3종으로 교체됨 — 더 이상 코드에서 참조하지 않는다.** 아래 3줄 참고 |
| `문장,문법 완료화면(80점 이상).svg` | `sentence-grammar-complete-high.svg` | 문장·문법 파트 완료 **80점 이상** — 색종이 배경 + 엄지척. 「정말 잘했어요!」 |
| `문장,문법 완료화면(50점이상 ~80점 미만).svg` | `sentence-grammar-complete-mid.svg` | **50~79점** — 구름 배경 + 시무룩. 「좋아요, 다음엔 더 올려봐요!」 |
| `문장,문법 완료화면(50점 미만).svg` | `sentence-grammar-complete-low.svg` | **50점 미만** — 빗방울 배경 + 우는 표정. 「속상하죠? 다음엔 더 잘할 수 있어요!」 |

> 문장·문법 완료 3종은 원본 523×1134 → `viewBox` 유지, width/height만 393×852로 바꿔 쓴다.
> **배지·점수·격려·정답수·버튼 좌표가 세 장 모두 동일**하므로 `part-complete.ts`의 rect는 공유한다.
> 배경 그라데이션도 셋 다 `#E3F1FF → #F9FDFF`라 텍스트 마스크 위장이 그대로 통한다.
> 격려 문구는 시안에 구워져 있으니 `encouragementForPartScore`를 바꾸면 SVG도 같이 바꿔야 한다.
> 교체 전 파일은 `*.svg.bak-pre-2026-08-06`로 남겨 뒀다 (git 미추적이라 덮어쓰면 복구 불가였음).
| `학습완료화면.svg` / `문법종료시.svg` | `learning-complete.svg`(레거시) / `grammar-complete.svg` | 구 학습완료 · 문법 완료 |
| `점수 완료화면.svg` / `완료 1·2·3.svg` | `assignment-complete-high/mid/low.svg` | 성/과제 **종합** 완료 (`GrammarCompleteScreen`). **80↑ / 50~79 / 50↓** 캐릭터·격려. 상단 「1반 3회차」필은 에셋에서 제거(`?v=3`) |
| `네비게이션바.svg` | `nav-bar.svg` | **하단 내비 5칸 공통**(홈·단어장·복습하기·헬스장·전체 · 394×82). 학원/학교 메인과 혼자 공부 메인이 **같은 파일**을 쓴다. 393을 5등분(78.62)한 슬롯이라 코드의 `(i+0.5)/5` 히트 계산과 0.2px 이내로 맞는다. **활성 칸 시안은 1번(홈)뿐** — 다른 탭에 있어도 홈이 진하게 보인다(칸별 시안 필요) |
| `헬스장.svg` | `gym-main.svg` | 오답 재출제 **대기 있음** |
| `헬스장_빈상태.svg` | `gym-empty.svg` | 오답 재출제 **대기 없음** |
| `헬스장_문제풀기시작.svg` | `gym-start.svg` | 캐릭터 탭 후 **시작하기** |
| `헬스장_완료화면.svg` | `gym-complete.svg` | 헬스장 오답 재출제 완료 · **오답 1개 이상** |
| `헬스장_완료화면_전체정답.svg` | `gym-complete-perfect.svg` | 헬스장 오답 재출제 완료 · **백점** |
| `복습 화면 추가.svg` | `review-empty-card.svg` | 복습하기 「오늘의 맞춤 복습」 카드 **아래 배너**(377×120 · 카드 353×96). 예전 `review-card-banner.svg`는 내용 없는 흰 카드라 빈 상자만 떠 있었다. **원본 3.54MB → 42KB** — 2048×2048 PNG가 69×71 자리에 박혀 있어 보이는 영역만 잘라 3배로 재삽입 |
| `연속 정답.svg` | `combo-streak-badge.svg` | 종합 완료 화면 「연속 정답」 배지(134×179). **원본의 흰 숫자 path를 제거한 것** — 콤보 수는 `ComboStreakBadge`가 뷰박스 안에 그린다 |
| `과제 완료시.svg` | `assignment-complete-v4.svg` 등 | (레거시) 세션 완료 구 에셋 |
| `메인화면.svg` | `main-home-full-map.svg` | (레거시·삭제됨) 이전 학원 맵 슬라이스 — 사용 금지 |
| `학원학교 학생용 메인화면.svg` | `main-home-academy-map.svg` (+ `main-home-map-long.svg`) | **학원/학교 메인**(`/student/home`) 맵 배경 — 단일 LONG, bridge/segment 없음 (2026-07-28) |
| (파생·삭제) | `main-home-full-map*.svg` / `map-bridge` / `map-segment` | 잘못 베이크한 슬라이스 — 제거됨 |
| (제공 PNG) | `map-castle-red-flag.png` | 맵 성 슬롯용 React 오버레이 |
| (제공 SVG) | `flag.svg` | 학원/학교 메인 시작 깃발 React 오버레이 (하늘 크롭 아래 배치) |
| `캐릭터 성도착.svg` | `character-castle-arrive.svg` | 학원/학교 메인 · 현재 위치 마스코트 배치 **참고용**(렌더 안 함). 기존 맵 성 + `mascot-banzai` |
| `현재학습_CTA카드.svg` | `current-learning-cta-card.svg` | 오늘의 미션 카드 좌표 원본 (미사용 · 보관) |
| `웹페이지 과제화면.svg` | `web-assignment-screen.svg` | 과제 화면 (미사용 · 보관) |
| `audio/sentence-*.wav` | (동일) | 영어 예문 오디오 |

### 동기화 과제에서의 재사용

동기화 과제도 **기존 Figma Export UI를 그대로 사용**한다.
`AssignmentRunnerScreen` → `build-session-sections.ts` → 유형별 기존 `*Screen`.

- 선생님 앱에서 받은 문제는 Export SVG의 고정 글자를 그대로 쓰지 않는다.
  중립 배경·프레임은 유지하고, 실제 영어/뜻/선택지를 불투명한 React
  오버레이로 다시 그린다.
- 단어 유형은 **A 짝맞추기 · B TTS 뜻 짝맞추기 · C 3지선다 · D 예문 빈칸**
  ([uiux.md](./uiux.md) §3.6). 구 B/C 라벨은 각각 C/D.
- 단어 A는 `단어A_시작.svg`의 2열 4행 좌표를 유지한다. 단어가 4개를
  넘으면 4쌍씩 다음 페이지로 나눈다. B도 동일 좌표·페이지 규칙(왼쪽만 오디오 타일).
- 단어 C/D, 본문 A/B/C, 문법 유형 1/2도 각각 기존 화면·에셋·상태 로직을
  재사용한다 (범용 카드 UI 금지). B는 신규 Export 후 동일 패턴으로 추가.
- 선택·정답·오답·완료 시트는 해당 유형의 기존 상태 색과 위치를 따른다.
- 녹음 파일이 없는 선생님 단어는 Web Speech 영어 음성으로 대체한다.
- 불완전·오류 원본(잘못된 OX, 선택지 부족, 대괄호 없는 예문 등)은
  추정하지 않고 문항에서 제외한다.

---

## 4. 알려진 프레임 node-id

| 화면 | node-id | 비고 |
|------|---------|------|
| 플래시 | `2917:5988` | [screens/splash.md](./screens/splash.md) |
| 로그인 | `2917:6018` | [screens/login.md](./screens/login.md) |

나머지 화면은 Export 파일명 + `docs/screens/*.md`를 기준으로 한다. node-id가 생기면 해당 화면 명세에 추가한다.

---

## 5. 작업 전 체크리스트

- [ ] 피그마 프레임명·링크·node-id 기록
- [ ] Export 에셋 목록 정리
- [ ] ASCII rename 여부 확인
- [ ] 기존 재사용 컴포넌트 확인 ([components.md](./components.md))
- [ ] 라우트 vs `MainHomeScreen` step 결정 ([architecture.md](./architecture.md))
- [ ] hover / disabled / selected / correct / wrong 상태 확인
- [ ] 정답 미리보기 하이라이트가 Export에 없는지 확인

---

## 6. 시각 QA

1. 393 폭 기준으로 시안과 나란히 비교
2. 텍스트 겹침·잘림 확인 (React 텍스트 중복 금지)
3. 히트 영역이 시각 버튼과 어긋나지 않는지 확인
4. 새로고침 후 에셋 캐시 반영 확인 (필요 시 `?v=`)

---

## 7. 요청 템플릿

```markdown
## 화면: (이름)
- Figma: (URL?node-id=...)
- node-id: ...
- Export: public/assets/...
- 요청: Export 그대로, Tailwind, 투명 오버레이만 추가
```

---

## 8. 화면 명세 템플릿

새 화면은 `docs/screens/`에 추가:

```markdown
# [화면명]

| 항목 | 값 |
|------|-----|
| 경로 / step | |
| 구현 | `src/...` |
| Figma | 링크 / node-id |
| Export | `public/assets/...` |

## 목적
## 진입 조건
## 상태
## 인터랙션
## 접근성
## 주의사항
```
