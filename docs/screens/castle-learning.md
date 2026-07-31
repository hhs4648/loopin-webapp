# 2회차 성 학습 (학습1~4)

| 항목 | 값 |
|------|-----|
| 진입 | 맵 노란 성(2회차) 클릭 → `learning-1` |
| 구현 | `src/components/castle-learning/CastleLearningScreen.tsx` |
| 설정 | `castle-learning.ts` |
| TTS | `speech-ko.ts` |
| 에셋 | `/assets/castle-learning-1.svg` … `castle-learning-4.svg` (`?v=` 캐시 가능) |

## 플로우

| Step | kind | 내레이션 (TTS) | 진행 |
|------|------|----------------|------|
| 1 | info | `can 뒤에는 동사원형이 와.` | 화면/버튼 탭 → 2 |
| 2 | quiz | `한 번 이거 뒤에 뭐가 나오는지 골라볼래?` | 정답 `swim` — 틀리면 재시도 |
| 3 | info | `좋아, 이제 우리가 오늘 배운 것들을 빈칸채우기해보자!` | → 4 |
| 4 | quiz | `오늘 배운 것들을 정리해볼까?` | 정답 `동사원형`(id `base-form`) — 틀리면 재시도 |

학습4 완료 → `star2LearningCompleted = true` → `assignment` 맵.

## 퀴즈 UX

| 규칙 | 설명 |
|------|------|
| 선택 | 파란 테두리만 (SVG 글자 유지) |
| 채점 | **확인** 버튼 후 |
| 정답 | 초록 → 다음 |
| 오답 | 빨강 → 선택 해제 후 재시도 |
| 미리보기 | Export/SVG에 정답 하이라이트 **금지** |

선택지 (학습2, 코드 id): `swims` / `swim` / `swimming` / `swam` (시각 라벨은 SVG)  
선택지 (학습4): 동사원형 / 동명사 / 과거형 / to부정사

## TTS

- `ko-KR`, Natural/Online 음성 우선 (SunHi, Heami, InJoon)
- rate ~0.98, 문장 포맷 후 재생
- step 변경·이탈 시 `stopKoreanSpeech`

## 세션 결과

학습1~4 퀴즈는 `SessionResults`에 **집계되지 않음** (현재).  
교사 연동 시 Attempt로 포함할지 TBD.

## 주의사항

- SVG 원본 732×1585 → `scaleRect`로 393×852 히트 영역
- 퀴즈 옵션 박스는 SVG rect와 좌표 일치 필요
