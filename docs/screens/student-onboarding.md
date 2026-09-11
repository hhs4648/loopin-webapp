# 학생 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/student` |
| 구현 | `src/pages/onboarding/StudentOnboardingScreen.tsx` |
| 플로우 | 약관 → 생년월일 → 학년 → 완료(`/student/home` 초대코드) |

> **2026-09-11:** 온보딩에서 **이름 입력을 받지 않는다**(Guideline 4 / Sign in with Apple).
> 소셜이 준 이름을 쓰고, 없으면 `학생`. 설정에서 변경 가능.

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 1. 약관 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` (교사와 공유) |
| 2. 생년월일 | `온보딩_생년월일_선택전.svg` | `onboarding-student-03-birthdate.svg` |
| 3. 학년 | `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` |

공통: `birthdate-dropdown-container.svg`

> **변경 (2026-08-11):** 학습목적 선택(`온보딩_학습목적선택` / `onboarding-student-06-purpose.svg`)
> 단계를 **삭제**했다. 학년 다음으로 온보딩을 끝내고 `/student/home`(초대코드)로 보낸다.
> 혼자 공부 분기는 이 화면에서 더 이상 고르지 않는다.
## 진입 조건

- `memberType === 'student'` && `!onboardingCompleted`

## 상태·인터랙션

| 단계 | 동작 |
|------|------|
| 약관 | 체크/라벨로 동의 · `>` 로 전문 보기. `[필수]` 개인정보·이용약관, `[선택]` 마케팅. 필수 2개 동의 후 다음. |
| 생년월일 | `BirthdatePicker` |
| 학년 | 학년 카테고리 선택 → **다음**으로 온보딩 완료 → `/student/home`(초대코드부터) |

> **현재:** 표시 이름은 소셜 `user_metadata`(없으면 `학생`) + 생년월일·학년을 온보딩 완료 시
> `AuthUser.displayName` + `upsertStudentProfile`에 저장한다. 설정에서 이름·학년을 바꿀 수 있다.
> 연동 뱃지/행은 로그인 provider(`kakao`/`apple`/`google`). 학년 시트는 **중1·중2·중3**.
> 학습목적 선택 화면은 제거됨 — 완료 후 항상 학원/학교 메인. 화면 구분은 [INDEX.md 학생 메인 2종](../INDEX.md).

## 접근성

- 입력 필드 라벨, 다음 버튼 활성/비활성

## 주의사항

- 피그마 Export + 오버레이 (텍스트·아이콘은 SVG, 선택 테두리만 React 오버레이)
- 글자·버튼 크기는 전부 `onboarding-typography.ts` 토큰 ([../design.md](../design.md) 온보딩 스케일).
  화면 파일에서 `text-[NNpx]`·`rounded-[NNpx]`를 직접 쓰면 시안에 구워진 글자와 어긋난다.
- 프로필 영속화는 API 연동 후 ([../student-teacher-sync.md](../student-teacher-sync.md))

### 시안과 코드 (학년)

| 위치 | 시안(SVG) | 코드 |
|------|-----------|------|
| 학년 선택 (step 3) | 제목 "중학교 학년…", 보기 **1·2·3학년** | `GRADE_ROWS` = 1/2/3 → 저장 `중학교 n학년` · 설정 행 표시 **중1·중2·중3** |
| 생년월일 년도 필드 | **연도** | placeholder `년도` (미해결) |

> **2026-09-05:** 예전 `초등`/`중등`/`고등`(및 데모 `'middle'`) 저장은 설정에 영문·가짜 중3이 떠
> 어긋났다. 온보딩·심사용 데모는 이제 `중학교 n학년`만 쓴다. 옛 프로필은 설정에서
> `초등`/`중등`/`고등`으로만 표시하고, 중1–3 시트에는 선택 없음 → 사용자가 다시 고르면 된다.
