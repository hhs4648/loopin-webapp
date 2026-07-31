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

| Figma Export (원본) | 코드 파일명 |
|---------------------|-------------|
| `로그인화면.svg` | `login-screen.svg` *(문서/코드 참조 — 파일 존재 여부 확인)* |
| `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` |
| `온보딩_회원가입 2(교사 선택).svg` | `onboarding-teacher-02-school.svg` |
| `온보딩_회원가입 3(교사 선택).svg` | `onboarding-teacher-03-name.svg` |
| `온보딩_회원가입 4(교사선택).svg` | `onboarding-teacher-04-complete.svg` |
| `온보딩_생년월일_선택전.svg` | `onboarding-student-03-birthdate.svg` |
| `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` |
| `온보딩_학습목적선택.svg` (node `5669:851`) | `onboarding-student-06-purpose.svg` |
| `메인화면.svg` | `main-home-invite-code.svg` |
| `메인화면(초대코드 입력후).svg` | `main-home-invite-entered.svg` |
| `메인화면(과제 부여 받은후).svg` | `main-home-assignment-received.svg` |
| `Container.svg` | `birthdate-dropdown-container.svg` |
| `회색 성.svg` | `castle-gray.svg` |
| *(과제부여 프레임 하단)* | `main-home-bottom-nav.svg` | 학원/학교 메인 하단 탭 (홈·단어장·복습노트·메뉴). **바 전체 탭 → 설정 창** |
| `설정 창.svg` | `settings-window.svg` | 설정 풀스크린 오버레이 (`SettingsWindow`). 원본 553×1012 · 표시 크롭 393×852(@80,50) |
| `재도전 화면.svg` | `castle-retry-screen.svg` | 완료 성 재도전 확인 풀프레임 (`CastleRetryConfirmScreen`). 하늘 색은 무시 · 카드·버튼만 시안 기준 |
| `미션 체크.svg` | `mission-check.svg` |
| `별표.svg` | `mission-star.svg` — 과제 완료 성 마커(원+별). 렌더는 `MissionCheckBadge`가 성 색으로 채움 |
| `Dialog.svg` | `session-dropdown-dialog.svg` |
| `루핀 환호 캐릭터.svg` | `mascot-cheer.svg` | *(구 환호 — 보관)* |
| `만세 캐릭터.svg` | `mascot-banzai.svg` | 학원/학교 메인 · 현재 위치 성 만세 루핀 (`CastleCompleteMascot`) |
| `루핀 캐릭터 시작.svg` | `loopin-character-start.svg` — 시작 지점 대기 포즈(`MapCharacter`) |
| `praise-calendar-source.png` *(내용 SVG)* | `praise-calendar.svg` — 칭찬 캘린더 풀스크린 · 상태 얼굴 PNG 추출(`praise-status-*.png`) |
| `커리큘럼 코스.svg` | `onboarding-curriculum-course.svg` — 혼자 공부 「내신 코스 만들기」 |
| `메인화면LONG.svg` | `main-screen-long.svg` — 혼자 공부 커리큘럼 메인 **맵 배경**(세로 스크롤). 구 공룡·베이크 Day1–3·러닝·시작 깃발·떠 있는 자물쇠 뱃지는 `opacity=0`, 장식·진도·캐릭터는 React 오버레이 |
| `체크무늬바닥시작점.png` | `checkered-floor-start.png` — 커리큘럼 맵 출발선 오버레이 |
| (LONG 베이크 러닝 분리) | `curriculum-running-character.png` — 진행 중 Day 옆 러닝 캐릭터 |
| `dinosaur.svg` *(제공)* | 동일 — 커리큘럼 맵 장식 공룡 (`CurriculumDinosaurDecor`) |
| `trees.svg` *(제공)* | `curriculum-tree-round.png` / `curriculum-tree-tall.png` — 맵 가장자리 장식 나무 (`CurriculumTreeDecor`) |
| `메인화면LONG.svg` + `커리큘럼 메인화면.svg` 하늘 타이틀 | `curriculum-main-long.svg` — (이전 bake본 · 참고) |
| `커리큘럼 드롭다운.svg` | `curriculum-dropdown.svg` — 코스 칩 드롭다운 시안(선택·삭제·새 코스) |
| `커리큘럼 시작.svg` | `curriculum-start.svg` — 0% 시작 시안 · 하단 내비 조각 원본 |
| *(커리큘럼 시작 하단 바)* | `curriculum-bottom-nav.svg` / `curriculum-bottom-nav-menu.svg` — 홈 활성 · 전체(설정) 활성 |
| `커리큘럼 시작캐릭터.svg` | `curriculum-start-character.svg` — 미시작(0%) 맵 시작점 루핀 |
| `체크무늬바닥시작점.png` | `checkered-floor-start.png` — 커리큘럼 맵 출발선 (위 rename 표 참고) |

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
| `학습완료화면.svg` / `문법종료시.svg` | `learning-complete.svg` / `grammar-complete.svg` | 완료 |
| `과제 완료시.svg` | `assignment-complete-v4.svg` | 세션(과제) 완료 · `GrammarCompleteScreen` (파란=재도전, 흰=틀린문제만). 데모 점수만 React 오버레이 |
| `메인화면.svg` | `main-home-full-map.svg` | (레거시·삭제됨) 이전 학원 맵 슬라이스 — 사용 금지 |
| `학원학교 학생용 메인화면.svg` | `main-home-academy-map.svg` (+ `main-home-map-long.svg`) | **학원/학교 메인**(`/student/home`) 맵 배경 — 단일 LONG, bridge/segment 없음 (2026-07-28) |
| (파생·삭제) | `main-home-full-map*.svg` / `map-bridge` / `map-segment` | 잘못 베이크한 슬라이스 — 제거됨 |
| (제공 PNG) | `map-castle-red-flag.png` | 맵 성 슬롯용 React 오버레이 |
| (제공 SVG) | `flag.svg` | 학원/학교 메인 시작 깃발 React 오버레이 (하늘 크롭 아래 배치) |
| `캐릭터 성도착.svg` | `character-castle-arrive.svg` | 학원/학교 메인 · 현재 위치 루핀 배치 **참고용**(렌더 안 함). 기존 맵 성 + `mascot-banzai` |
| `메인화면LONG.svg` | `main-screen-long.svg` | **혼자 공부 메인**(`/student/curriculum/main`) 맵 배경 — 학원/학교 full-map과 **다른 화면** |
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
