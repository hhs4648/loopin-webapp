# 회원 유형 선택

| 항목 | 값 |
|------|-----|
| 경로 | `/onboarding/member-type` |
| 구현 | `src/pages/MemberTypeScreen.tsx` |
| Figma | (프레임 링크 TBD) |

## 목적

학생 / 교사 역할 선택 후 각 온보딩으로 분기.

## 진입 조건

- 로그인됨 + `memberType` 미설정

## 상태·인터랙션

| 상태 | 동작 |
|------|------|
| 미선택 | 다음 비활성 |
| 학생 선택 | `completeMemberType(..., 'student')` → `/onboarding/student` |
| 교사 선택 | `completeMemberType(..., 'teacher')` → `/onboarding/teacher` |

## 레이아웃

- 상단 `IphoneStatusBar` (시간·셀룰러·와이파이·배터리)
- 그 아래 뒤로가기 → 제목 → 옵션 → 다음

## 접근성

- 라디오형 옵션, 선택 상태 시각 표시 (`.radio-option`)

## 주의사항

- **목표:** 교사 역할은 `loopin-project`로 유도할 수 있음 (TBD)
- 현재는 이 앱에서 교사 온보딩·홈 UI까지 진행 가능하나 홈은 학생과 동일
