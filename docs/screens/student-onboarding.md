# 학생 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/student` |
| 플로우 | 약관 동의 → 이름 → 생년월일 → 학년 → 완료 |
| 구현 | `src/pages/onboarding/StudentOnboardingScreen.tsx` |

## Export 에셋

| 단계 | Figma Export (원본) | 코드에서 사용하는 파일명 |
|------|---------------------|-------------------------|
| 1. 약관 동의 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` (선생님과 공유) |
| 2. 이름 | `온보딩_회원가입 2(교사 선택).svg` | `onboarding-teacher-02-school.svg` (선생님과 공유) |
| 3. 생년월일 | `온보딩_생년월일_선택전.svg` | `onboarding-student-03-birthdate.svg` |
| 4. 학년 | `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` |
| 5. 완료 | `온보딩_마지막_학생.svg` | `onboarding-student-05-complete.svg` |

## 공통 UI 에셋

| Figma Export (원본) | 변경 후 파일명 | 용도 |
|---------------------|----------------|------|
| `Container.svg` | `birthdate-dropdown-container.svg` | 생년월일 드롭다운 패널 배경 |

## 파일명 변경 (에이전트 적용)

```powershell
cd public/assets
Rename-Item -LiteralPath "온보딩_생년월일_선택전.svg" -NewName "onboarding-student-03-birthdate.svg"
Rename-Item -LiteralPath "온보딩_학년선택_선택전.svg" -NewName "onboarding-student-04-grade.svg"
Rename-Item -LiteralPath "온보딩_마지막_학생.svg" -NewName "onboarding-student-05-complete.svg"
Rename-Item -LiteralPath "Container.svg" -NewName "birthdate-dropdown-container.svg"
```
