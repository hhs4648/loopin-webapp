# 선생님 온보딩 (회원가입)

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/teacher` |
| 플로우 | 약관 동의 → 학교명 → 이름 → 완료 |
| 구현 | `src/pages/onboarding/TeacherOnboardingScreen.tsx` |

## Export 에셋

| 단계 | Figma Export (원본) | 코드에서 사용하는 파일명 |
|------|---------------------|-------------------------|
| 1. 약관 동의 | `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` |
| 2. 학교명 | `온보딩_회원가입 2(교사 선택).svg` | `onboarding-teacher-02-school.svg` |
| 3. 이름 | `온보딩_회원가입 3(교사 선택).svg` | `onboarding-teacher-03-name.svg` |
| 4. 완료 | `온보딩_회원가입 4(교사선택).svg` | `onboarding-teacher-04-complete.svg` |

## 1단계 — 약관 동의 동작

- 위 **동그라미 3개**를 탭하면 `#2AA3FF`로 체크됩니다.
- **모두 동의합니다**를 탭하면 위 3개가 모두 체크됩니다. (다시 탭하면 모두 해제)
- **`[필수]` 2개**만 체크되어도 하단 **다음** 버튼이 `#2AA3FF`로 활성화됩니다.
- `[선택]` 마케팅 수신 동의는 체크하지 않아도 다음으로 넘어갈 수 있습니다.

| 항목 | 필수 |
|------|------|
| 서비스 이용약관 | O |
| 개인정보 처리방침 | O |
| 마케팅 정보 수신 | X |
| 모두 동의합니다 | — (위 3개 일괄 선택) |

## 파일명 변경 (에이전트 적용)

Figma에서 한글 파일명으로 Export한 뒤, 아래처럼 ASCII 파일명으로 변경해 코드에서 참조합니다.

```powershell
cd public/assets
Rename-Item -LiteralPath "온보딩_회원가입 1(교사 선택).svg" -NewName "onboarding-teacher-01-terms.svg"
Rename-Item -LiteralPath "온보딩_회원가입 2(교사 선택).svg" -NewName "onboarding-teacher-02-school.svg"
Rename-Item -LiteralPath "온보딩_회원가입 3(교사 선택).svg" -NewName "onboarding-teacher-03-name.svg"
Rename-Item -LiteralPath "온보딩_회원가입 4(교사선택).svg" -NewName "onboarding-teacher-04-complete.svg"
```
