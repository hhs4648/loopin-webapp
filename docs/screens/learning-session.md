# 1회차 학습 세션 (단어 · 본문 · 문법)

| 항목 | 값 |
|------|-----|
| 진입 | 맵 1회차 성 클릭 → `MainHomeScreen` step `word-match` |
| 오케스트레이션 | `src/pages/MainHomeScreen.tsx` |
| 결과 모델 | `src/components/exercise/session-results.ts` |
| 진행률 | `session-questions.ts` → `SESSION_TOTAL_STEPS` (현재 29) |

URL 라우트 없음 — 전부 내부 step.

## 단어 유형 (A~D)

| 라벨 | 이름 | Step (목표) | 화면 |
|------|------|-------------|------|
| A | 짝맞추기 | `word-match` | `WordMatchScreen` |
| B | TTS 뜻 짝맞추기 | `word-listen-match` | `WordListenMatchScreen` |
| C | 3지선다 | `word-quiz` | `WordQuizScreen` *(구 B)* |
| D | 예문 빈칸 | `word-spell` | `WordSpellScreen` *(구 C)* |

자세한 규칙·교사 라벨 매핑: [../uiux.md](../uiux.md) §3.6, [../design.md](../design.md) §5.1.

## 순서

**현재 구현** (단어 4유형):

```
word-match(A) → word-listen-match(B) → word-quiz(C) → word-spell(D) → learning-complete
  → body-text-a → body-text-b → body-text-c → body-text-complete
  → grammar-type-1 → grammar-type-2 → grammar-complete
```

## 구간별 구현

| Step | 화면 | 유형 / 에셋 |
|------|------|-------------|
| `word-match` | `WordMatchScreen` | A · `word-a-*.svg` |
| `word-listen-match` | `WordListenMatchScreen` | B · `word-a-start.svg` 재사용 (전용 Export 전) |
| `word-quiz` | `WordQuizScreen` | C · `word-c-*.svg` (현재 코드는 구 `word-b` 에셋) |
| `word-spell` | `WordSpellScreen` | D · `word-d-*.svg` (현재 코드는 구 `word-c` 에셋) |
| `learning-complete` | `LearningCompleteScreen` | `word-part-complete.svg` — 학습 단어·공부 시간(분) 실데이터 · 오늘 배운 단어 카드(클릭=선택 이펙트+TTS, 많으면 칸만 스크롤) · 계속하기→본문 A · 홈→맵 |
| `body-text-a/b/c` | `BodyText*Screen` | `body-text-a/b/c.svg` (B는 A 에셋 재사용) |
| `body-text-complete` | `BodyTextCompleteScreen` | `body-text-complete.svg` |
| `grammar-type-1` | `GrammarType1Screen` | `grammar-type-1.svg` |
| `grammar-type-2` | `GrammarType2Screen` | `grammar-type-2.svg` / `grammar-type-2-x.svg` |
| `grammar-complete` | `GrammarCompleteScreen` | `grammar-complete.svg` — [completion-retry.md](./completion-retry.md) |

> 위 표는 **레거시 데모 세션**(`MainHomeScreen`의 `step`) 기준이다. 실제 과제 풀이는
> `AssignmentRunnerScreen`이 돌리며, 단어/문장/문법 **파트 경계마다** 완료 화면을 끼운다
> (`LearningCompleteScreen` · `PartCompleteScreen`). 마지막 파트에서 계속하기를 누르면
> 과제가 완료 처리되고 종합 완료화면(`GrammarCompleteScreen`)으로 간다 —
> [completion-retry.md](./completion-retry.md) 「파트 완료 화면」참고.

## 세션 결과 ID (현재)

| 유형 | ID 예 |
|------|--------|
| A 짝맞추기 | `word-match:wave` |
| B TTS 짝맞추기 | `word-listen-match:{id}` |
| C 3지선다 | `word-quiz:{questionId}` |
| D 예문 빈칸 | `word-spell:{questionId}` |
| 본문 | `body-text-a:{id}` 등 |
| 문법 | question 객체의 `id` |

`onAnswer(stepId, isCorrect)`로 `SessionResults` 갱신. **새로고침 시 소실.**

## 공통 UX

| 항목 | 동작 |
|------|------|
| 진행 바 | 헤더에서 뒤로가기와 콤보 **같은 줄** 게이지. 시안과 같이 `#F0F5FA` 바깥 링 + 안쪽 트랙(`#E3E7EA`) + 채움(`#3C86FF`). 에셋에 구운 긴 막대는 가림 |
| 유형 제목 | 에셋에 구워진 「짝맞추기」 등은 `BakedExerciseTitleMask`로 **제목 줄만** 가림. 단어 A~D 문제 박스는 시안 자리 유지. 단어 D는 카드 아래 **글자 칸**을 시안처럼 표시 |
| 본문 레이아웃 | 헤더 바로 아래 제시문 · 문장 완성 박스. 지정된 박스 안 문구는 **위아래 가운데**. 긴 문구는 글씨를 줄이거나 박스를 키워 잘리지 않음. 본문 A·B 청크는 작은 버튼으로 문장 박스 바로 아래. 제출·코치는 아래 고정 |
| 정오답 | SFX + 테두리 색 |
| 오답 재시도 모드 | `retryWrongOnly` — 진행 바 숨김, 스냅샷 문항만 |
| 오디오 | A·C 정답/진입 TTS, B는 오디오 타일 탭 시 재생; step 이탈 시 stop |
| 콤보 | 연속 정답 배지 + 마일스톤 이펙트 — 아래 「콤보」 절 |

## 콤보

`components/exercise/combo.ts` · `ComboContext.tsx` · `ComboOverlay.tsx` · `answer-sfx.ts`

연속 정답 수. **콤보 값은 러너(`AssignmentRunnerScreen`)가 들고 있어서 파트(섹션)를 넘어가도
이어진다.** 오답이 하나라도 나오면 0으로 끊긴다.

| 무엇 | 언제 |
|------|------|
| 배지 (우상단 알약 `🔥 7콤보`) | **3콤보부터** 계속 표시 (`COMBO_BADGE_MIN`) |
| 이펙트 (가운데 버스트 + 소리) | 마일스톤에서만 — **3 · 5 · 10 · 20 … 90 · 100 · 120 · 140 …** |
| 종합 완료 화면 배지 | 세션 **MAX COMBO**(끝 콤보 아님) — 2 이상일 때만. [완료 · 오답 재시도](completion-retry.md#연속-정답-배지) |
| **단어 A/B 짝맞추기** | 짝마다 올리지 않음. 보드를 **전부 첫 시도에 맞추면** 끝날 때 **1콤보**. 오답이 있으면 그 짝 확정 시 콤보 끊김 |

마일스톤 간격이 10 → 20으로 벌어지는 건 100콤보부터다(`isComboMilestone`). 매 정답마다 이펙트를
터뜨리면 시끄럽기만 하고 콤보가 특별하게 느껴지지 않는다. 후반에도 마찬가지라 간격을 벌린다.

### 문제 화면 10개를 건드리지 않는 구조

콤보 값은 러너에 있고 배지는 각 화면 위에 떠야 한다. 화면마다 prop을 뚫는 대신 **컨텍스트**로
내려서 공통 컨테이너 `FigmaAssetFrame`이 `ComboOverlay`를 그린다. Provider가 없으면(설정 창처럼
러너 밖에서 이 컨테이너를 쓰는 화면) 아무것도 렌더되지 않는다.

오버레이는 **전부 `pointer-events-none`** 이어야 한다 — 문제 화면의 투명 히트영역 위에 뜨기
때문에 하나라도 클릭을 먹으면 답을 못 고르게 된다.

### 소리

`playComboSfx(combo)` — 오디오 파일이 아니라 기존 `answer-sfx.ts`의 Web Audio 합성이다(에셋 0개).
정답음은 각 문제 화면이 내고 있어 러너에서 끌 수 없으므로, **0.14초 뒤에 시작**해 「정답 → 보너스」로
들리게 겹친다. 마일스톤이 오를수록 반음씩 올라가되 **1옥타브에서 멈춘다** — 계속 올리면 찢어진다.

> **음소거 설정이 아직 없다.** 설정 창에 소리 항목이 하나도 없어서 정답음·콤보음을 끌 방법이
> 없다. 교실에서 쓰는 앱이라 필요한 기능이다 — 아직 안 만들었을 뿐 의도된 생략이 아니다.

## 목표

- 전용 단어 B Export(`word-b-*.svg`) · 퀴즈/빈칸 에셋 C/D 재매핑
- Attempt/Answer API로 영속화
- questionId를 콘텐츠 스키마와 정렬
- [../student-teacher-sync.md](../student-teacher-sync.md)
