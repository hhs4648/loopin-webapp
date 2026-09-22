# 학생 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/student` |
| 구현 | `src/pages/onboarding/StudentOnboardingScreen.tsx` |
| 플로우 | 약관 → 나이 확인 → (만 14세 미만이면) 보호자 SMS 동의 → 학년 → 완료 |

> **2026-09-11:** 온보딩에서 **이름 입력을 받지 않는다**(Guideline 4 / Sign in with Apple).
> 소셜이 준 이름을 쓰고, 없으면 `학생`. 설정에서 변경 가능.
>
> **2026-09-18:** 온보딩에서 **생년월일 단계를 삭제**했다(Guideline 5.1.1(v)).
>
> **2026-09-22:** 만 14세 미만만 학부모 휴대폰 SMS OTP 동의를 받는다(개인정보 보호법).
> 전원에게 생년월일을 받지 않는다 — 「만 14세 이상/미만」 선택만.

## Export 에셋

| 단계 | Figma Export (원본) | 코드 파일명 |
|------|---------------------|-------------|
| 1. 약관 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` (교사와 공유) |
| 2. 나이·보호자 | (에셋 없음) | `AgeGateStep` / `ParentConsentStep` + `OnboardingPhoneShell` |
| 3. 학년 | `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` |

## 진입 조건

- `memberType === 'student'` && `!onboardingCompleted`

## 상태·인터랙션

| 단계 | 동작 |
|------|------|
| 약관 | 체크/라벨로 동의 · `>` 로 전문 보기. 필수 2개 동의 후 다음. |
| 나이 | 「만 14세 이상」→ 학년. 「만 14세 미만」→ 보호자 동의. |
| 보호자 | 휴대폰 번호 → Solapi SMS OTP → 동의 체크 → 학년. |
| 학년 | 학년 선택 → 온보딩 완료 → `/student/home`(초대코드) |

## SMS (Solapi)

- Edge Function: `supabase/functions/parental-consent-otp`
- 배포·시크릿: `.env.example` 주석 / `docs/parental-consent-solapi.md`
- SQL: `supabase/migrations/20260922_parental_consent_profile.sql`

## 주의사항

- 피그마 Export + 오버레이. 나이·보호자 단계는 에셋 없이 PhoneShell.
- 글자·버튼 크기: `onboarding-typography.ts` 토큰만 사용.
