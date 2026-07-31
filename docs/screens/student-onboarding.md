# 학생 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/student` |
| 구현 | `src/pages/onboarding/StudentOnboardingScreen.tsx` |
| 플로우 | 약관 → 이름 → 생년월일 → 학년 → 학습목적 선택 |

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 1. 약관 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` (교사와 공유) |
| 2. 이름 | (공유 에셋) | `onboarding-teacher-02-school.svg` 레이아웃 재사용 가능 |
| 3. 생년월일 | `온보딩_생년월일_선택전.svg` | `onboarding-student-03-birthdate.svg` |
| 4. 학년 | `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` |
| 5. 학습목적 선택 | `온보딩_학습목적선택` (node `5669:851`) | `onboarding-student-06-purpose.svg` |

공통: `birthdate-dropdown-container.svg`

> **변경:** 마지막 단계는 "영어공부, 이제 혼자가 아니에요!" 웰컴 화면(`onboarding-student-05-complete.svg`,
> 파일 미존재로 깨져 있었음)에서 학습목적 선택 화면으로 교체됐다. 관련 Figma 프레임:
> `온보딩_학습목적선택_선택됨(초대받음)` (`5670:888`), `온보딩_학습목적선택_선택됨(혼자공부)` (`5670:924`).

## 진입 조건

- `memberType === 'student'` && `!onboardingCompleted`

## 상태·인터랙션

| 단계 | 동작 |
|------|------|
| 약관 | 체크/라벨로 동의 · `>` 로 전문 보기. `[필수]` 개인정보·이용약관, `[선택]` 마케팅. 필수 2개 동의 후 다음. |
| 이름 | 텍스트 입력 |
| 생년월일 | `BirthdatePicker` |
| 학년 | 학년 카테고리 선택 |
| 학습목적 선택 | "선생님 초대를 받았어요" / "혼자 공부할래요" 카드 중 하나 탭 → 파란 테두리(`#46AFFF`) 표시 → 약 300ms 후 `completeOnboarding`. 별도 "다음" 버튼 없음, 중복 탭 방지(첫 선택만 반영). **분기:** 초대 → `/student/home`(학원/학교 메인) · 혼자 공부 → `/student/curriculum`(이후 코스 생성 → `/student/curriculum/main`) |

> **현재:** 이름·생년월일·학년은 온보딩 완료 시 `AuthUser.displayName` + 프로필 캐시(`upsertStudentProfile`)에 저장된다. 설정 창 헤더·닉네임 행에 이름이 반영된다.  
> 학습목적에 따라 **이동 경로가 갈린다** (위 표). 화면 구분은 [INDEX.md 학생 메인 2종](../INDEX.md).

## 접근성

- 입력 필드 라벨, 다음 버튼 활성/비활성
- 학습목적 카드: `aria-label`(카드 문구) + `aria-pressed`, 선택 후 `disabled`로 중복 탭 방지

## 주의사항

- 피그마 Export + 오버레이 (텍스트·아이콘은 SVG, 선택 테두리만 React 오버레이)
- 프로필 영속화는 API 연동 후 ([../student-teacher-sync.md](../student-teacher-sync.md))
