# 완료 · 오답 재시도

| 항목 | 값 |
|------|-----|
| 단어 구간 완료 | `LearningCompleteScreen` — step `learning-complete` |
| 본문 완료 | `BodyTextCompleteScreen` — `body-text-complete` |
| 문법(세션) 완료 | `GrammarCompleteScreen` — `grammar-complete` |
| 재시도 로직 | `MainHomeScreen` + `session-results.ts` |
| 시트 | `RetryWrongCompleteSheet` |

## 단어 / 본문 완료

| 화면 | CTA |
|------|-----|
| 학습 완료 | 계속 → 본문 A |
| 본문 끝 | 계속 → 문법 type 1 |

점수 표시: 본문 완료는 본문 문항 정답 수 기준.

## 문법 완료 (`grammar-complete`)

에셋: Figma `과제 완료시.svg` → `assignment-complete.svg` (`FigmaAssetFrame`).  
데모로 구워진 점수·버튼·「1반 3회차」필은 마스크/React로 덮음. 상단 드롭다운은 메인과 동일 SessionRoundDropdown(실데이터).  
시안 CTA: 왼쪽 흰「틀린문제만」·오른쪽 파란「재도전」(첫 완료=완료 성 탭 동일 화면).nment-complete-ctas.png)을 그대로 박음. **왼쪽 파란=틀린문제만**, **오른쪽 연한=재도전**. React는 투명 히트만.

| 표시 | 계산 |
|------|------|
| 점수 | `round(correctCount / totalCount × 100)` (`summarizeSessionResults`) |
| 요약 | `{totalCount}문제 중 {correctCount}개 정답` |
| 회차 | `{roundNumber}회차 완료` (데모 1회차) |

완료 진입 시 `sessionResults`를 스냅샷해 시안 고정값이 아니라 **이번 풀이 결과**를 보여 준다.  
`totalCount` = 세션 문항 목록 길이 (`getAllSessionStepIds`, 현재 25).

| CTA | 동작 |
|-----|------|
| **재도전** | 결과·오답필터 초기화 → `resolveDemoSessionStartStep()`(문제가 있는 첫 섹션, 현재는 보통 `word-quiz`)부터 **전체 다시**. `sessionEpoch`로 학습 화면 강제 리마운트. 전환 직후 600ms는 뒤로가기 차단(클릭 관통으로 맵에 떨어지는 것 방지). 네비 스택은 맵만 남겨 이후 뒤로가기가 메인으로 감 |
| **틀린문제만** | 완료 진입 시 고정한 `completeResultsRef` 기준. 오답 0개면 **비활성·무동작**. 첫 오답 섹션부터 `retryWrongOnly` + 스냅샷. 오답 모드에서 문항 prop은 **절대 `undefined`(전체 은행)로 떨어지지 않음** — 불일치 시 `[]` → 섹션 스킵 |
| 뒤로(`<`) | 1회차 완료 마킹 → `assignment` 홈 |

`correctCount` / `wrongCount` = `countSessionCorrect` / `countSessionWrong`.  
`totalCount` = `SESSION_TOTAL_STEPS`.

> 빈 `word-match`/`word-listen-match`(문항 0)는 진입 시 자동으로 다음 섹션으로 넘어간다.

## 오답만 풀기

1. `getFirstRetrySection(results)`로 시작 섹션 결정  
2. `buildRetrySectionSnapshot`으로 **진입 시점** 오답 목록 고정  
3. 섹션 완료 시 `getNextRetrySectionAfter`  
4. 더 이상 없으면 `grammar-complete` 또는 최종 섹션에서 홈 (`onRetryFlowHome`)  
5. 재시도 중 진행 바 숨김 (`hideProgressBar`)

섹션 순서:  
`word-match` → `word-listen-match` → `word-quiz` → `word-spell` → `body-text-a` → `b` → `c` → `grammar-type-1` → `grammar-type-2`

재시도 답안은 기존 `SessionResults` 키를 **덮어쓴다** (불변 로그 아님).


## 완료된 성 탭

맵에서 **완료된 성**을 누르면 구 `재도전 확인` 오버레이 대신 **같은** `GrammarCompleteScreen`을 연다.

| CTA | 동작 |
|-----|------|
| **재도전** | 맵에 「재도전 중!」상단 배너·성 위 필을 먼저 보여 준 뒤 풀이 진입. 캐릭터는 이전 성(없으면 시작점)으로 후퇴. 다시 완료할 때까지 유지. 서버 과제 → `assignment-runner` / 데모 1성 → 전체 세션 / 데모 2성 → `learning-1` |
| **틀린문제만** | 오답이 있으면 활성. 데모 1성 → 메모리 스냅샷 기준 섹션 재도전. 서버 과제 → 최근 attempt의 오답 `question_id`만 `assignment-runner`로 재출제. 2성 학습은 비활성 |
| 뒤로(`<`) | `assignment` 맵으로 |

점수: 서버 과제는 `latestScore`/`firstScore` + `questionTotal`로 추정하되, 오답 ID를 가져오면 그 개수로 맞춤. 데모는 직전 세션 `sessionResults`가 있으면 그대로.

## 목표 (교사 연동)

- 완료·재시도를 Attempt/Answer 이벤트로 기록
- 교사에게 first/latest/best 중 어떤 점수를 보여줄지 합의
- [../student-teacher-sync.md](../student-teacher-sync.md)
