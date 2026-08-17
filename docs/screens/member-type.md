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

**Figma export 에셋이 없는 유일한 온보딩 화면**이라 좌표를 직접 잡는다.
값은 `온보딩_학년선택`(`onboarding-student-04-grade.svg`)과 **동일**하게 맞춘다 —
다른 온보딩 화면과 제목·옵션·버튼이 같은 자리에 오도록.

| 요소 | 값 (393×852) |
|------|--------------|
| 제목 | 박스 top **105**, 좌측 **20**, `ONBOARDING_TITLE` (24 Bold/32) |
| 선택 원 | cx **32**, cy **244** / **318** (간격 74), 지름 **24** |
| 옵션 라벨 | x **68**, `ONBOARDING_BODY` (16 SemiBold) |
| 다음 버튼 | x=30 y=741 w=333 h=60 r=16, `NextStepButton hasBakedButton={false}` |

크기·색은 전부 `onboarding-typography.ts` 토큰이다. 직접 px를 쓰지 않는다.

## 접근성

- `role="radiogroup"` + 옵션 `role="radio"` / `aria-checked`
- 선택 원은 `CircleCheckbox`(`aria-pressed`) — 다른 온보딩 화면과 동일 컴포넌트

## 주의사항

- **목표:** 교사 역할은 `loopin-project`로 유도할 수 있음 (TBD)
- 현재는 이 앱에서 교사 온보딩·홈 UI까지 진행 가능하나 홈은 학생과 동일
