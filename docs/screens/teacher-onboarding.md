# 선생님 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/teacher` |
| 구현 | `src/pages/onboarding/TeacherOnboardingScreen.tsx` |
| 플로우 | 약관 → 학교명 → 이름 → 완료 |

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 1. 약관 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` |
| 2. 학교명 | `온보딩_회원가입 2(교사 선택).svg` | `onboarding-teacher-02-school.svg` |
| 3. 이름 | `온보딩_회원가입 3(교사 선택).svg` | `onboarding-teacher-03-name.svg` |
| 4. 완료 | `온보딩_회원가입 4(교사선택).svg` | `onboarding-teacher-04-complete.svg` *(파일 존재 확인)* |

## 1단계 — 약관

- 체크/라벨로 동의 · **`>`** 로 전문 보기
- **모두 동의**로 전체 토글 가능
- `[필수]` 2개만 체크되어도 다음 활성
- `[선택]` 마케팅

| 항목 | 필수 |
|------|------|
| 개인정보 처리방침 | O |
| 서비스 이용약관 | O |
| 마케팅 수신 안내 | X |

## 진입 조건

- `memberType === 'teacher'` && `!onboardingCompleted`

## 완료 후

- `completeOnboarding` → `/teacher/home`
- 홈 UI는 현재 학생과 **동일** (`MainHomeScreen`)

## 주의사항

- 글자·버튼 크기는 전부 `onboarding-typography.ts` 토큰 ([../design.md](../design.md) 온보딩 스케일).
- 완료 화면(step 4)의 **"학생 초대하기" / "홈으로" 두 버튼은 하단 CTA와 같은 크기**
  (x=30 w=333 **h=60** r=16, y=665 / y=741). 예전엔 위 버튼 히트 영역만 h=44라
  시안 버튼보다 16px 작았다.
- **코드 점검:** `schoolName` / `teacherName` 상태와 입력 라벨 바인딩이 뒤바뀔 수 있음 — 수정 시 이 문서도 갱신
- **목표:** 교사 본 기능은 `loopin-project` ([../student-teacher-sync.md](../student-teacher-sync.md))
- 입력 프로필은 현재 미저장
