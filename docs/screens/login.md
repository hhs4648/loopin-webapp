# 로그인

| 항목 | 값 |
|------|-----|
| 경로 | `/login` |
| 구현 | `src/pages/LoginScreen.tsx` |
| Figma | https://www.figma.com/design/NFmd87QHBjrA3r9zV9s8Q7/Haksup?node-id=2917-6018 |
| node-id | `2917:6018` |
| Export | 학습 로그인 풀프레임. Figma 파일명 `플래시화면.svg` → `login-screen.svg` (`?v=3`). 원본 `_design-source/로그인화면.svg`. 스플래시용 작은 `플래시화면`은 `splash-screen.svg`로 따로 둠 |

## 목적

소셜 로그인(Apple / 카카오 / 구글)으로 서비스 진입.

## 진입 조건

- 미로그인 사용자
- 스플래시에서 auth 없음

## 현재 구현 (목업)

| 동작 | 설명 |
|------|------|
| Apple / 카카오 탭 | `createMockUser` 후 **기존 `haksup_auth` 클리어·재저장** |
| 성공 후 | `/onboarding/member-type` (또는 `getPostAuthPath`) |
| 실제 OAuth | **없음** — 서버 토큰 없음 |

> “재방문 로그인 유지”는 현재 불완전하다. 로그인 화면 진입 시 세션이 초기화될 수 있다.

## 레이아웃 / 스펙

| 요소 | 스펙 (Figma Inspect) |
|------|----------------------|
| 프레임 | 393 × 852 |
| 배경 | 흰→하늘 그라데이션 (에셋) |
| Apple 버튼 | 검정, `{x:20.58, y:605.58, w:351.84, h:58.84}` 투명 히트 |
| 카카오 버튼 | `#FFE812`, `{x:20.58, y:681.58, w:351.84, h:58.84}` |
| 구글 버튼 | 흰 슬롯, `{x:20, y:757, w:353, h:58}` |

## 접근성

- 소셜 버튼 `aria-label` (Apple로 시작하기 / 카카오로 시작하기 / 구글로 시작하기)

## 주의사항

- Export 에셋 그대로, Tailwind, 투명 오버레이
- 목표 연동: [../student-teacher-sync.md](../student-teacher-sync.md)
