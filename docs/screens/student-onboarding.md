# 학생 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/student` |
| 구현 | `src/pages/onboarding/StudentOnboardingScreen.tsx` |
| 플로우 | 약관 → 이름 → 생년월일 → 학년 → 완료(`/student/home` 초대코드) |

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 1. 약관 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` (교사와 공유) |
| 2. 이름 | (공유 에셋) | `onboarding-teacher-02-school.svg` 레이아웃 재사용 가능 |
| 3. 생년월일 | `온보딩_생년월일_선택전.svg` | `onboarding-student-03-birthdate.svg` |
| 4. 학년 | `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` |

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
| 이름 | 텍스트 입력 |
| 생년월일 | `BirthdatePicker` |
| 학년 | 학년 카테고리 선택 → **다음**으로 온보딩 완료 → `/student/home`(초대코드부터) |

> **현재:** 이름·생년월일·학년은 온보딩 완료 시 `AuthUser.displayName` + 프로필 캐시(`upsertStudentProfile`)에 저장된다. 설정 창 프로필·닉네임 행에 온보딩 이름이 반영되고, 연동 뱃지/행은 로그인 provider(`kakao`/`apple`/`google` → 카카오·애플·구글)를 쓴다. 설정의 **학년 변경**은 중1·중2·중3만 (`SettingsGradeSheet`, 저장값 `중학교 n학년`).  
> 학습목적 선택 화면은 제거됨 — 완료 후 항상 학원/학교 메인. 화면 구분은 [INDEX.md 학생 메인 2종](../INDEX.md).

## 접근성

- 입력 필드 라벨, 다음 버튼 활성/비활성

## 주의사항

- 피그마 Export + 오버레이 (텍스트·아이콘은 SVG, 선택 테두리만 React 오버레이)
- 글자·버튼 크기는 전부 `onboarding-typography.ts` 토큰 ([../design.md](../design.md) 온보딩 스케일).
  화면 파일에서 `text-[NNpx]`·`rounded-[NNpx]`를 직접 쓰면 시안에 구워진 글자와 어긋난다.
- 프로필 영속화는 API 연동 후 ([../student-teacher-sync.md](../student-teacher-sync.md))

### 시안과 코드의 문구 불일치 (미해결)

| 위치 | 시안(SVG)에 그려진 문구 | 코드가 쓰는 값 |
|------|------------------------|----------------|
| 학년 선택 (step 4) | 제목 "중학교 학년 정보를 알려주세요", 보기 **1학년 / 2학년 / 3학년** | `GRADE_ROWS` = **초등학생 / 중학생 / 고등학생** → 저장값 `초등`/`중등`/`고등` |
| 생년월일 년도 필드 | **연도** | placeholder `년도` |

학년 보기는 **화면에는 시안 글자(1·2·3학년)가 보이는데 저장되는 값은 학교급**이라
사실상 다른 항목을 고르는 셈이다. 어느 쪽이 맞는지 디자인 확정 후 한쪽으로 맞춰야 한다
(저장값을 바꾸면 `upsertStudentProfile`의 `grade`와 교사 웹 쪽 표시가 함께 영향받는다).
