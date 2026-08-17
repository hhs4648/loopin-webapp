# 완료 · 오답 재시도

| 항목 | 값 |
|------|-----|
| 단어 파트 완료 | `LearningCompleteScreen` — 에셋 `word-part-complete.svg` (`단어파트 완료화면`) · CTA: 계속하기 / 홈 |
| 문장·문법 파트 완료 | `PartCompleteScreen` — 에셋 `sentence-grammar-complete.svg` (`문장,문법 완료화면`) · CTA: 계속하기 / 홈 |
| 본문 완료(레거시 데모) | `BodyTextCompleteScreen` — `body-text-complete` |
| 종합 완료 | `GrammarCompleteScreen` — `grammar-complete` |
| 재시도 로직 | `MainHomeScreen` + `session-results.ts` |
| 시트 | `RetryWrongCompleteSheet` |

## 파트 완료 화면 (과제 러너)

`AssignmentRunnerScreen`은 섹션을 **단어 / 문장 / 문법** 세 파트로 묶고, 파트가 바뀌는
경계마다 완료 화면을 한 번 끼워 넣는다 (`partGate` 상태).

| 파트 | 섹션 | 완료 화면 |
|------|------|-----------|
| 단어 | `word-match` · `word-listen-match` · `word-quiz` · `word-spell` | `LearningCompleteScreen` |
| 문장 | `body-text-a/b/c` | `PartCompleteScreen part="sentence"` |
| 문법 | `grammar-type-2`(OX) · `grammar-type-1` | `PartCompleteScreen part="grammar"` |

- **계속하기** → 다음 파트의 첫 섹션. **마지막 파트면 과제를 완료 처리**하고
  `onCompleted`로 빠져나가 **종합 완료화면**(`GrammarCompleteScreen` · 점수대별 `assignment-complete-high/mid/low.svg`)이 열린다.
- **홈** → `onExit` (맵/과제 화면). 이미 기록된 답안은 서버에 남아 다시 들어오면 이어서 푼다.
- **배지 문구** = 선생님이 과제 부여할 때 쓴 버튼명 + 「 완료」.
  `resolvePartCompleteBadgeLabel(part, assignment.title)`가 제목에서
  `단어|문장|문법` + (선택) 숫자 + `파트`를 뽑아 쓴다.
  예: 쪼개서 냄 → `단어 1파트 완료` / `문장 1파트 완료`.
  통으로·번호 없이 → `단어 파트 완료`(앱이 `partOrder`로 임의 N을 매기지 않음).
  단어·문장·문법 화면 모두 베이크 「1파트 완료」위에 React 배지를 덮어 쓴다.
- **틀린문제만 연습(`onlyQuestionIds` / `practiceOnly`)에서는 파트 완료 화면을 띄우지 않는다** —
  단어·문장·문법 완료를 전부 skip하고 끝나면 종합 완료만 연다.
  호출측이 `practiceOnly`를 명시해 attempt가 열리지 않게 한다(열리면 맵이 「진행중」으로 떨어짐).
  성 상태 집계도 **완료 이력이 있으면 completed 유지** — 남은 in_progress attempt 때문에
  「진행중」으로 강등하지 않는다(`fetchStudentAssignments`).

`PartCompleteScreen` 표시값 — **해당 파트의 출제 문항 전체**를 집계한다
(`summarizePartCompletion`). 문장은 `body-text-a/b/c`를 합친다(유형 3개면 문항도
유형×문장 수). 이어풀기 때는 서버 오답 id를 불러와 맞춘다.

| 표시 | 계산 |
|------|------|
| 점수 | `round(파트 정답 / 파트 문항 × 100)` |
| 격려 | `encouragementForPartScore(score)` — 80↑ 「정말 잘했어요!」 |
| 요약 | `{파트 문항}문제 중 {파트 정답}개 정답` (`정답 = 문항 − 오답`) |

`LearningCompleteScreen`의 「오늘 배운 단어」는 데모 은행이 아니라 **스냅샷에서 실제 출제된 단어**다
(단어 섹션 문항 id `…:match/:listen/:choice/:spell`에서 원본 `word.id`를 되돌려 매칭).
「공부 시간」은 단어 파트 첫 화면 진입 시각 기준(최소 1분).

## 본문 완료 (레거시 데모 세션)

| 화면 | CTA |
|------|-----|
| 학습 완료 | 계속 → 본문 A |
| 본문 끝 | 계속 → 문법 type 1 |

점수 표시: 본문 완료는 본문 문항 정답 수 기준.

## 문법 완료 (`grammar-complete`)

에셋: Figma `완료 1`·`완료 2`·`완료 3` → `assignment-complete-high/mid/low.svg` (`GrammarCompleteScreen`).  
점수 경계는 파트 완료와 같다 — **80↑ / 50~79 / 50↓**. 캐릭터는 에셋, 격려·점수는 React.  
데모로 구워진 점수는 마스크로 덮음. 「1반 3회차」필은 에셋에서 제거(가림막 없음).  
하단 CTA는 시안 슬롯에 맞춘 React 버튼만 올림 — **틀린문제만** 왼쪽 `{x:30,w:125}` · **재도전** 오른쪽 `{x:165,w:191}` (시안 베이크 문구는 좌우가 반대라 불투명 버튼이 가림).  
구워진 하단 탭바는 필드색 `#A5E2E1`로 y768~ 가림. 홈 아이콘 버튼 없음(상단 `<`로 홈).

| 표시 | 계산 |
|------|------|
| 점수 | `round(correctCount / totalCount × 100)` (`summarizeSessionResults`) |
| 격려 | `encouragementForScore` — 80↑ 「잘했어요!」 · 50~79 「좋아요, 다음엔 더 올려봐요!」 · 50↓ 「아쉬워요!」 |
| 요약 | `{totalCount}문제 중 {correctCount}개 정답` |
| 회차 | `{roundNumber}회차 완료` (데모 1회차) |
| 연속 정답 배지 | `ComboStreakBadge combo={maxCombo}` — 아래 절 |

### 「연속 정답」 배지

흰 결과 카드(**x35 y253 w327**) **오른쪽 위 꼭짓점**에 불꽃 + 최고 콤보 수를 그린다.
루핀은 왼쪽, 콤보는 오른쪽. **2콤보 미만이면 렌더하지 않는다.** 에셋
`combo-streak-badge.svg`는 원본 `연속 정답.svg`에서 흰 숫자 path만 뺀 것이고,
숫자는 매번 달라지므로 React가 SVG 뷰박스 안에 그린다.

디맥(DJMAX)의 결과 화면과 같은 규칙이다 — **풀 때는 파트를 넘어가며 계속 쌓이고 오답 하나에
끊기며, 완료 화면에는 끝에서 유지 중이던 콤보가 아니라 그 한 판의 MAX COMBO를 보여준다.**
예: 10연속 → 오답 → 마지막 3연속으로 끝났으면 배지는 **10**. 학생의 역대 최고 기록이 아니다.

값이 흐르는 길:

```
AssignmentRunnerScreen.answerResultsRef / maxComboRef
  → maxComboFromAnswerResults(...)     // 시퀀스에서 peak 재계산
  → completeAttempt(attemptId, peak)   // attempts.max_combo 저장
  → onCompleted({ maxCombo: peak })
  → MainHomeScreen.completeMaxCombo → GrammarCompleteScreen maxCombo prop
```

읽을 때는 `StudentAssignment.latestMaxCombo`(마지막 완료 회차의 `attempts.max_combo`)를 쓴다.
그래서 **맵에서 완료된 성을 다시 눌러도 그 회차의 배지가 그대로 뜬다.** 러너에서 방금 넘어온
경우엔 `Math.max(러너 peak, 서버 peak)`를 쓴다.

`touchAttemptMaxCombo` / `completeAttempt`는 **기존 `max_combo`보다 클 때만 덮어쓴다.**
풀이 중 peak가 오를 때마다 서버에 남겨, 중간에 나갔다 이어 풀어도 앞 구간의 MAX가 지워지지 않는다.

두 경우엔 배지가 뜨지 않는다:

- **틀린문제만 연습**(`practiceOnly`) — attempt를 열지 않아 점수·콤보 모두 기록하지 않는다.
  파트 완료(단어/문장/문법)는 건너뛰고, 오답을 다 풀면 **종합 완료 화면**만 연다.
- **데모 세션 경로**(`openGrammarComplete`) — 데모 문제 화면들은 `ComboProvider` 밖에서 그려져
  콤보를 세지 않는다. 풀이 중 배지도 안 뜨므로 완료 화면만 띄우면 어긋난다.

콤보 규칙(마일스톤·소리) 자체는 「[학습 세션](learning-session.md)」의 콤보 절 참고.

완료 진입 시 `sessionResults`를 스냅샷해 시안 고정값이 아니라 **이번 풀이 결과**를 보여 준다.  
`totalCount` = 세션 문항 목록 길이 (`getAllSessionStepIds`, 현재 25).

| CTA | 동작 |
|-----|------|
| **재도전** | 결과·오답필터 초기화 → `resolveDemoSessionStartStep()`(문제가 있는 첫 섹션, 현재는 보통 `word-quiz`)부터 **전체 다시**. `sessionEpoch`로 학습 화면 강제 리마운트. 전환 직후 600ms는 뒤로가기 차단(클릭 관통으로 맵에 떨어지는 것 방지). 네비 스택은 맵만 남겨 이후 뒤로가기가 메인으로 감 |
| **틀린문제만** | 완료 진입 시 고정한 `completeResultsRef` 기준. 오답 0개면 **비활성·무동작**. 첫 오답 섹션부터 `retryWrongOnly` + 스냅샷. **단어/문장/문법 파트 완료는 skip**하고, 오답을 다 풀면 **종합 완료**(`GrammarCompleteScreen`)로. 연습 중 답은 `sessionResults`/정답률에 반영하지 않음. 오답 모드에서 문항 prop은 **절대 `undefined`(전체 은행)로 떨어지지 않음** — 불일치 시 `[]` → 섹션 스킵 |
| **홈** / 뒤로(`<`) | 1회차 완료 마킹 → `assignment` 홈 |

`correctCount` / `wrongCount` = `countSessionCorrect` / `countSessionWrong`.  
`totalCount` = `SESSION_TOTAL_STEPS`.

> 빈 `word-match`/`word-listen-match`(문항 0)는 진입 시 자동으로 다음 섹션으로 넘어간다.

## 오답만 풀기

1. `getFirstRetrySection(results)`로 시작 섹션 결정  
2. `buildRetrySectionSnapshot`으로 **진입 시점** 오답 목록 고정  
3. 섹션 완료 시 `getNextRetrySectionAfter`  
4. 더 이상 없으면 종합 완료(`grammar-complete`). 중간에 홈(`onRetryFlowHome`)으로 나가면 맵  
5. 재시도 중 진행 바 숨김 (`hideProgressBar`)

섹션 순서:  
`word-match` → `word-listen-match` → `word-quiz` → `word-spell` → `body-text-a` → `b` → `c` → `grammar-type-1` → `grammar-type-2`

재시도 답안은 기존 `SessionResults` 키를 **덮어쓴다** (불변 로그 아님).


## 완료된 성 탭

맵에서 **완료된 성**을 누르면 구 `재도전 확인` 오버레이 대신 **같은** `GrammarCompleteScreen`을 연다.

| CTA | 동작 |
|-----|------|
| **재도전** | 해당 성 위 「재도전 중!」필만 표시한 뒤 풀이 진입. **현재 위치/진행중 캐릭터는 바꾸지 않음**(재도전 ≠ 완료 취소). 상단 미션 카드 근처 배너는 없음. 서버 과제 → `assignment-runner` / 데모 1성 → 전체 세션 / 데모 2성 → `learning-1` |
| **틀린문제만** | 오답이 있으면 활성. **연습 전용** — 서버 attempt/점수·정답률에 반영하지 않음. 파트 완료는 skip하고 끝나면 **종합 완료**로(맵 「진행중」으로 바꾸지 않음). 데모 1성 → 메모리 스냅샷 기준 섹션 재도전. 서버 과제 → 오답 `question_id`만 `assignment-runner`로 재출제. 2성 학습은 비활성 |
| 뒤로(`<`) | `assignment` 맵으로 |

점수: 서버 과제는 `latestScore`/`firstScore` + `questionTotal`로 추정하되, 오답 ID를 가져오면 그 개수로 맞춤. 데모는 직전 세션 `sessionResults`가 있으면 그대로.

## 목표 (교사 연동)

- 완료·재시도를 Attempt/Answer 이벤트로 기록
- 교사에게 first/latest/best 중 어떤 점수를 보여줄지 합의
- [../student-teacher-sync.md](../student-teacher-sync.md)
