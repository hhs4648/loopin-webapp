# Design System

> 시각·레이아웃 토큰. 소스: `src/index.css` + Figma Export 프레임.

---

## 1. 프레임·레이아웃

| 토큰 | 값 | 사용처 |
|------|-----|--------|
| Design frame | **393 × 852** | Figma 화면, `FigmaAssetFrame` |
| App shell max-width | **540px** | `AppFrame` / `.app-frame` 및 화면 프레임 (393×852 비율 유지) |
| Main map asset (현재) | **393 × ≈2863** | `main-home-academy-map.svg` (`학원학교 학생용 메인화면` LONG, 360×2623 스케일) |
| Main map viewport | **393 × 852** | 내부 세로 스크롤 |
| Main map sky crop (현재) | **0px** | LONG 단일 맵 — 상단 크롭 없음 |
| Round selector | viewport 상단 overlay | 스크롤과 무관하게 유지 |
| Praise calendar CTA | 맵 상단 우측, 기존 `이번 할 일` 위치 | 흰색 활성 버튼 → 임시 캘린더 화면 |
| Bottom navigation | **81px** | 뷰포트 하단 고정 |
| Clip / overflow | 카드·프레임 bounds | 오버레이 배경·긴 텍스트·빈칸이 **부모 카드/프레임 밖으로 튀어나오면 안 됨**. SVG path bounds 안에 두고 `overflow: hidden` |

좌표 환산 (현재 고정 맵):

- Figma px → 프레임 %: `(x / 393) * 100%`, `(y / 852) * 100%`
- 전체 맵 오버레이 y → 크롭 반영 `fullMapRectStyle`
- SVG 원본이 732×1585인 학습 화면은 `scaleRect`로 393×852에 맞춤 (`castle-learning.ts`)

### 1.1 목표 — 동적 맵 시각 구조

> **구현 전 명세.** 고정 2944px 모놀리식 SVG를 분해한다.
> UX 규칙은 [uiux.md §4.2](./uiux.md), 화면 계산은 [screens/main-home.md](./screens/main-home.md).

| 레이어 | 역할 | 에셋 방향 |
|--------|------|-----------|
| Header | 회차 필 + 미션 카드 | 기존 오버레이 / 카드 유지 |
| Path segment (tile) | **성이 없는** 잔디·길·장식 반복 단위 | Figma에서 성·체크·자물쇠 제거한 타일 Export |
| Castle slot | 구간마다 좌 또는 우에 성 배치 | 컬러 성 변형(회차/테마) 단독 SVG |
| Marker overlay | 체크 / 현재 위치 / (필요 시) 자물쇠 | `mission-check.svg` 등 단독 오버레이 |
| Nav | 하단 81px 고정 | 기존 프레임 하단 조각 |

**반복 패턴 (제안 토큰)**

| 토큰 | 제안 값 | 설명 |
|------|---------|------|
| `MAP_W` | 393 | 맵 폭 |
| `HEADER_H` | ~200–250 (시안 확정) | 깃발·미션 카드·시작 구간 |
| `SEGMENT_H` | ~140–180 (시안 확정) | 성 1개당 길 구간 높이 |
| `END_PADDING` | ≥ NAV_H(81) + 여유 | 마지막 성이 내비에 가리지 않게 |
| Slot pattern | `L, R, L, R…` | `order` 홀수 → 좌, 짝수 → 우 (또는 시안 기준 반전) |

```
contentHeight =
  HEADER_H
  + SEGMENT_H × assignmentCount
  + END_PADDING
```

성·마커 좌표는 **슬롯 인덱스**에서 파생한다.

```
slotY(i) = HEADER_H + SEGMENT_H × i + castleOffsetY
slotX(i) = pattern[i % 2]   // leftX | rightX
```

고정 `main-home-full-map.svg`의 픽셀 좌표(`FULL_MAP_STAR_*`)는 동적 맵 전환 후
레거시/마이그레이션용으로만 남긴다.

**컴포넌트 상태 (맵 — 목표)**

| 상태 | 시각 |
|------|------|
| active (미완료·부여됨) | 컬러 성, 클릭 가능 |
| completed | 컬러 성 + 체크 뱃지, **클릭 가능(재진입)** |
| (미부여) | 슬롯 자체 미생성 — 회색 더미 성 없음 |

---


## 2. 색상 토큰 (현재 — Tailwind `@theme`)

`src/index.css`:

| 토큰 | HEX | 용도 |
|------|-----|------|
| `--color-loopin-blue` | `#2AA3FF` | Primary / CTA / 스플래시·로그인 배경 |
| `--color-loopin-green` | `#B2F165` | 로고 ∞ 강조 |
| `--color-loopin-white` | `#FFFFFF` | 배경 |
| `--color-loopin-black` / text | `#111111` | 본문 |
| `--color-loopin-text-muted` | `#666666` | 보조 텍스트 |
| `--color-loopin-gray-100` | `#F5F5F5` | 표면 |
| `--color-loopin-gray-300` | `#D9D9D9` | 보더 |
| `--color-loopin-gray-400` | `#C4C4C4` | Disabled |
| `--color-loopin-kakao` | `#FFE812` | 카카오 버튼 |
| `--color-loopin-kakao-border` | `#FDE33E` | 카카오 보더 |

### 학습/퀴즈에서 자주 쓰는 추가 색

| HEX | 용도 |
|-----|------|
| `#3B6FF5` | 선택 테두리 / 진행 바 일부 |
| `#22C55E` | 정답 테두리 |
| `#EF4444` | 오답 테두리 · 문법 X 교정 지문의 틀린 부분(밑줄) |
| `#E6E8F0` | 선택지 중립 보더 |
| `#212633` | 본문·선택지 텍스트 (SVG) |
| `#4F91EB` | 학습 확인 버튼 (SVG) |
| `#FFFFFF → #C5EBFE` | 메인 홈 하늘 그라데이션 (`MAIN_HOME_SKY_GRADIENT`) |
| `#FD3D3D` | 1회차(빨간) 성 · 완료 체크 · **커리큘럼 Day 노드(활성)** |
| `#D1D6DB` | 커리큘럼 Day 노드(잠금) 원 |
| `#8C94A1` | 커리큘럼 Day 노드(잠금) 숫자 |
| `#FFA10A` | 2회차(노란) 성 · 완료 체크 (`main-home-full-map.svg` paint11) |
| `#DE801B` | 노란 성 보조 톤(문서 레거시 — 체크는 `#FFA10A` 사용) |
| `#46AFFF` | (과거) 온보딩 학습목적 선택 카드 테두리 — **화면 삭제**, 토큰만 참고용 |

### 레거시 주의

일부 레거시 클래스(`.screen--blue`, `.primary-button`)는 **`#5CB5E8`** 을 사용한다.  
**신규 UI는 `#2AA3FF` (`loopin-blue`)를 기준**으로 한다. 점진적 통일 필요 (TBD).

---

## 3. 타이포그래피

| 토큰 | 값 |
|------|-----|
| `--font-sans` | `'Pretendard', system-ui, sans-serif` |
| `--font-en` | `'Pretendard', system-ui, sans-serif` (한·영 동일) |

앱 전역 글씨체는 **Pretendard** (`index.html` CDN). `font-sans` / `font-en` 모두 Pretendard를 가리킨다.

### 문제(학습) 화면 공통 스케일 — `exercise-typography.ts`

전 유형(단어 A/B/C · 본문 A/B/C · 문법 1/2)에서 **동일 토큰**을 쓴다. 본문·선택지·안내·코치·짝맞추기 **20px**, 기본 **가운데 정렬**.

| 용도 | 토큰 | 스펙 |
|------|------|------|
| 영어 본문·선택지·타일·입력 | `EXERCISE_PASSAGE_EN` / `OPTION_EN` / `INPUT_EN` | Pretendard **20px** / semibold / `#1E1E1E` |
| 한국어 지문·안내 | `EXERCISE_PASSAGE_KO` / `HINT_KO` / `EMPTY_HINT` | Pretendard **20px** / medium |
| 한국어 보조 설명 | `EXERCISE_PASSAGE_KO_MUTED` | Pretendard **20px** / medium / muted |
| 단어 퀴즈 헤드워드 | `EXERCISE_HEADWORD` | Pretendard **30px** / bold |
| 짝맞추기 타일(한/영) | `MATCH_TILE_*` | **20px** / semibold (한·영 동일) |
| 루핀 코치 말풍선 | `EXERCISE_COACH_LINE` | Pretendard **20px** / semibold / `#3D7EF0` |
| 피드백 제목 | `exerciseFeedbackTitleClass` | **20px** / bold |
| 피드백 해설 | `EXERCISE_FEEDBACK_HINT` | Pretendard **20px** / semibold |
| CTA(제출·계속하기) | `EXERCISE_CTA` | **22px** / bold — 전 유형 동일 (`ExerciseContinueButton`은 제출 슬롯, 팝업 시트 아님) |
| 진행률 | `EXERCISE_PROGRESS` | **12px** / semibold |

화면별로 `text-[NNpx]`·개별 `font-['…']`를 직접 쓰지 말고 위 토큰·`font-sans`/`font-en`을 재사용한다.

### 온보딩 공통 스케일 — `onboarding-typography.ts`

회원유형·약관·이름·학교명·생년월일·학년 화면이 **동일 토큰**을 쓴다.
단계는 **24 / 18 / 16 / 14 네 개뿐**이고 자간은 전 단계 **0**이다.
(값은 `public/assets/onboarding-*.svg`에 구워진 글자를 실측해 맞춘 것 — 온보딩은
이미지 위에 React 요소를 얹는 구조라 어긋나면 비활성→활성 전환 때 글자가 튄다.)

| 용도 | 토큰 | 스펙 |
|------|------|------|
| 화면 제목 | `ONBOARDING_TITLE` | Pretendard **24px** / bold / line-height 32 / `#1E1E1E` |
| 하단 CTA 라벨 | `ONBOARDING_BUTTON_LABEL` | Pretendard **18px** / **bold** |
| 약관·옵션 라벨, 입력값 | `ONBOARDING_BODY` | Pretendard **16px** / **semibold** / 24 |
| 입력 안내, 생년월일 필드 | `ONBOARDING_CAPTION` | Pretendard **14px** / medium / 20 |

온보딩 공통 지오메트리 (전 화면 동일, Figma 393×852 기준):

| 요소 | 값 | 토큰 |
|------|-----|------|
| 하단 CTA 버튼 | x=30 y=741 **w=333 h=60 r=16** | `ONBOARDING_CTA_RECT` / `ONBOARDING_CTA_RADIUS` |
| CTA 활성 / 비활성 | `#2AA3FF` / `#BEC3CD` | `ONBOARDING_CTA_BG(_DISABLED)` |
| 선택 원 | 바깥 지름 **24** (`circle r=10.5` + `stroke 3`), 링 `#D9D9D9` | `ONBOARDING_CHECK_SIZE` |
| 선택 원 오른쪽 라벨 x | **68** | `ONBOARDING_OPTION_LABEL_X` |
| 제목 박스 top / 좌우 여백 | **105** / **20** | `ONBOARDING_TITLE_TOP` / `ONBOARDING_CONTENT_X` |

Figma 에셋이 없는 화면(회원 유형)은 `CircleCheckbox hasBakedRing={false}` /
`NextStepButton hasBakedButton={false}`로 두면 미선택 링·비활성 버튼까지 직접 그린다.

| 용도 | 대략 스펙 |
|------|-----------|
| 로그인 슬로건 | Medium ~20px, white/90 |
| 소셜 버튼 | Bold ~18px |
| 퀴즈 선택지 | SVG path (이미지 내) 또는 `EXERCISE_*` 오버레이 |

문법·연습 전용 타이포 헬퍼:

- `src/components/grammar/grammar-typography.ts` (`exercise-typography` re-export)
- `src/components/exercise/exercise-typography.ts`

## 4. 간격·Radius

| 패턴 | 값 |
|------|-----|
| 소셜/CTA 버튼 높이 | ~52–60px (**온보딩은 60px 고정** — 위 스케일 참고) |
| 버튼 radius | ~10–14px (시안별) / **온보딩 CTA는 16px 고정** |
| 퀴즈 옵션 radius | ~24px |
| 선택 테두리 | 3px |
| Safe area | `env(safe-area-inset-*)` (로그인/온보딩 패딩) |

---

## 5. 컴포넌트 상태

| 상태 | 시각 |
|------|------|
| default | 시안 기본 |
| selected | `#3B6FF5` 보더 (+ 약한 glow 허용) |
| correct | `#22C55E` |
| wrong | `#EF4444` |
| disabled | `#C4C4C4` 배경 또는 비활성 커서 |
| assigned castle (현재) | 컬러 성 + 자물쇠(미완료) / **성 색 별표**(완료, `MissionCheckBadge`). **현재 위치 성**만 `CastleCompleteMascot`(`만세 캐릭터` → `mascot-banzai.svg`) + 「현재 위치」 필. **재도전 중**이면 별표 대신 같은 중심의 코랄 「재도전 중!」 필(`CastleRetryingPill` · `#FF8A65` · **13px Bold** · 92×28, 약한 bounce) — 끝나면 별표 복귀 · 현재 위치는 유지 |
| assigned castle (목표) | 동일 — 완료=별표, 현재 위치 성만 만세 루핀 — **둘 다 클릭 가능** · 재도전 중 필 규칙 동일 |
| unassigned castle (현재) | 맵에 미리 그려진 성 + 자물쇠 |
| unassigned castle (목표) | 렌더하지 않음 (`castle-gray` 더미 불필요) |
| 현재 위치 필 | React 필 **72×28**, `#4F91EB`, 글자 **13px Bold** white (`CURRENT_LOCATION_PILL`). 시작 지점 「현재 위치」는 맵에 구워져 있어 완료 시 `StartPointMask`로만 가림 — **길을 다시 그리거나 맵 에셋을 교체하지 않음**(부자연스러운 이음매 방지). 성 완료 시 성 바닥 아래 React 필만 표시 |
| 재도전 중 필 | React 필 **92×28**, `#FF8A65` + 하단 그림자 `#E56A45`, 글자 **13px Bold** white (`CASTLE_RETRYING_PILL`, 「현재 위치」와 동일 글씨 크기). **별표(자물쇠)와 동일 중심**. 재도전 세션 종료(완료) 시 제거하고 별표 재표시 |
| 재도전 확인 | Figma `재도전 화면`(`castle-retry-screen.svg`) 풀프레임 오버레이 — React 팝업 아님. 카피·버튼 베이크 · 투명 히트만. **하늘 색은 무시** |
| 시작 루핀 | 맵에 구워진 대기 루핀 — **완료 성이 없을 때만** 보임. 완료 성이 생기면 `StartPointMask`로 루핀·필만 가리고 깃발·길은 원본 유지. 성 바닥 중앙에 `mascot-cheer.svg`(React) 표시 |
| praise calendar CTA | 글자 크기 **20px**, 아이콘 20px. rect는 **121×40** (맵 x=255, y=312 / 프레임 x=255, y=246). 배경 SVG의 `이번 할 일` 레이어는 `display="none"` 처리 |
| praise calendar CTA (dimmed) | 초대코드·대기 미리보기: 45% 검정 오버레이 아래에 있는 것처럼 모든 색상을 ×0.55 딤 처리한 비인터랙티브 복제 (`PraiseCalendarButton surface="dimmed"`) |
| 오늘의 미션 카드 (`TodayMissionCard`) | Figma `현재학습_CTA카드` 기준에서 가독성을 위해 확대: 배지 14px SemiBold(Figma 11px+3, 너비는 텍스트에 맞춰 자동), 제목 23px Bold(`#1F242E`, Figma 18px+5), 부제 16px Regular(`#6B7382`, Figma 13px+3), 버튼 23px SemiBold(Figma 13px+10, `leading-none`). 버튼 텍스트가 2~3줄로 줄바꿈될 수 있어 버튼 rect를 108×76(기존 96×60)으로 확대. 글씨체는 전역 Pretendard |

### 5.1 동기화 과제 유형

동기화 과제는 **기존 Export 화면 컴포넌트를 그대로 재사용**한다.
범용 카드 UI로 다시 꾸미지 않는다.

| 유형 | 시각 기준 (화면) |
|------|------------------|
| 단어 유형 A · 짝맞추기 | `WordMatchScreen` + `word-a-*.svg`, 168×98 타일 2열, 최대 4쌍/페이지 (영문 ↔ 한글) |
| 단어 유형 B · TTS 뜻 짝맞추기 | `WordListenMatchScreen` + `word-a-start.svg` 재사용 — A와 동일 레이아웃·상태색, 왼쪽은 스피커+파형 오디오 타일(탭 시 TTS). 전용 Export는 추후 |
| 단어 유형 C · 3지선다 | `WordQuizScreen` + `word-c-*.svg` (구 B / 구 `word-b` 에셋 → C로 재매핑 예정) |
| 단어 유형 D · 예문 빈칸 | `WordSpellScreen` + `word-d-*.svg` — 정답 띄어쓰기 유지, 첫 글자 슬롯 고정(힌트). 본문 카드(`WORD_SPELL_CARD`)는 진행바·트레이 사이 **한 덩어리 클립**. 긴 정답은 카드 안 스크롤. 카드 밖 **튀어나옴 금지**. *(구 C / 구 `word-c`)* |
| 본문 A · 번역 배열 | `BodyTextAScreen` + `body-text-a.svg` — 루핀 코치 안내, 피드백은 **계속하기만** |
| 본문 B · 청크배열 | `BodyTextBScreen` + `body-text-a.svg` 재사용 — 한글 제시라 **스피커 숨김**, 제출 시(오답 포함) 영어 예문 TTS. 루핀 코치 안내, 피드백은 **계속하기만** |
| 본문 C · 영작 | `BodyTextCScreen` + `body-text-c.svg` |
| 문법 유형 1 · 빈칸 선택 | `GrammarType1Screen` + `grammar-type-1.svg` |
| 문법 유형 2 · O/X·교정 | `GrammarType2Screen` + `grammar-type-2.svg` / `grammar-type-2-x.svg` — OX 정답이 X이면 틀린 부분 `#EF4444` + underline, 이어서 3지선다 |

상태 색(`idle → selected → correct/wrong → disabled`)과 완료 시트는 각
화면의 로직을 그대로 쓴다. 단어 A·B 정답 쌍은 초록 피드백 후 비활성화되며
영어 TTS를 재생한다(B는 짝 맞추기 전·후에도 오디오 타일로 재생). 단어 D는 정답 표면형의 **띄어쓰기를 슬롯·문장 밑줄 모두에
반영**하고, **첫 알파벳을 슬롯 0에 미리 채워** 난이도를 낮춘다(고정 힌트, 되돌리기
불가). 긴 문장·빈칸은 카드 안에서만 줄바꿈하며, **카드 하단·모서리 밖으로
배경 마스크가 튀어나오면 안 된다**. 데이터가 불완전한 문항은 생성하지 않는다.

---

## 6. 에셋·이미지

| 규칙 | 설명 |
|------|------|
| 위치 | `public/assets/` |
| 프레임 Export | 가능하면 ASCII kebab-case |
| 구현 방식 | 전체 프레임 SVG + 투명 히트 영역 |
| 금지 | 시안 없이 임의 일러스트 제작 |

자세한 명명·Export: [figma.md](./figma.md)

---

## 7. 반응형

| Breakpoint | 정책 |
|------------|------|
| default | 모바일 프레임 비율 유지, 가운데 정렬 |
| >540px | 좌우 여백, 프레임 폭 고정 |

태블릿/데스크톱 전용 레이아웃 시안은 현재 없음. 모바일 비율을 유지한다.
