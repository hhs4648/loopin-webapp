# 선생님 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/teacher` |
| 구현 | `src/pages/onboarding/TeacherOnboardingScreen.tsx` |
| 플로우 | 약관 → 학교명 → 완료 → `/student/home`(초대코드) |

> **2026-09-11:** 온보딩에서 **이름 입력을 받지 않는다**(Guideline 4).
> 소셜 이름 → 없으면 `선생님`. 설정에서 변경 가능.
> 완료 후 교사 웹 핸드오프 없이 학생 홈(초대·과제 풀이)으로 간다.

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 1. 약관 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` |
| 2. 학교명 | `온보딩_회원가입 3(교사 선택).svg` | `onboarding-teacher-03-name.svg` *(파일명과 내용이 반대 — 학교명 화면)* |
| 3. 완료 | `온보딩_회원가입 4(교사선택).svg` | `onboarding-teacher-04-complete.svg` |

> 예전 「이름」용 `onboarding-teacher-02-school.svg`는 온보딩 플로우에서 쓰지 않는다.

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

- `upsertStudentProfile` (초대코드 RPC는 `role=student`만 허용) + `completeOnboarding`
- → `/student/home` (초대코드부터). `/teacher/home`은 같은 화면으로 리다이렉트.
- 회원탈퇴는 맵·초대 화면 **전체** 탭 → 설정 → 회원탈퇴

## 주의사항

- 글자·버튼 크기는 전부 `onboarding-typography.ts` 토큰 ([../design.md](../design.md) 온보딩 스케일).
- 완료 화면의 **"학생 초대하기" / "홈으로" 두 버튼은 하단 CTA와 같은 크기**
  (x=30 w=333 **h=60** r=16, y=665 / y=741).
- **목표:** 교사 본 기능(출제·반 관리)은 `loopin-project` ([../student-teacher-sync.md](../student-teacher-sync.md))
