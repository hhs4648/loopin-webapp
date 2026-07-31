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
| `learning-complete` | `LearningCompleteScreen` | `learning-complete.svg` |
| `body-text-a/b/c` | `BodyText*Screen` | `body-text-a/b/c.svg` (B는 A 에셋 재사용) |
| `body-text-complete` | `BodyTextCompleteScreen` | `body-text-complete.svg` |
| `grammar-type-1` | `GrammarType1Screen` | `grammar-type-1.svg` |
| `grammar-type-2` | `GrammarType2Screen` | `grammar-type-2.svg` / `grammar-type-2-x.svg` |
| `grammar-complete` | `GrammarCompleteScreen` | `grammar-complete.svg` — [completion-retry.md](./completion-retry.md) |

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
| 진행 바 | `ExerciseProgressBar` + `sessionOffset` |
| 정오답 | SFX + 테두리 색 |
| 오답 재시도 모드 | `retryWrongOnly` — 진행 바 숨김, 스냅샷 문항만 |
| 오디오 | A·C 정답/진입 TTS, B는 오디오 타일 탭 시 재생; step 이탈 시 stop |

## 목표

- 전용 단어 B Export(`word-b-*.svg`) · 퀴즈/빈칸 에셋 C/D 재매핑
- Attempt/Answer API로 영속화
- questionId를 콘텐츠 스키마와 정렬
- [../student-teacher-sync.md](../student-teacher-sync.md)
