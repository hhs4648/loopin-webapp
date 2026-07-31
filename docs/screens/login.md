# 로그인

| 항목 | 값 |
|------|-----|
| 경로 | `/login` |
| 구현 | `src/pages/LoginScreen.tsx` |
| Figma | https://www.figma.com/design/NFmd87QHBjrA3r9zV9s8Q7/Haksup?node-id=2917-6018 |
| node-id | `2917:6018` |
| Export | 프레임/로고/마스코트/아이콘 (`login-logo.svg`, `login-mascot-*.png`, `apple-icon.png`, `kakao-icon.png` 등) |

## 목적

소셜 로그인(Apple / 카카오)으로 서비스 진입. `SocialProvider`에 **google** 타입·설정 뱃지 스타일은 준비됨(로그인 버튼 UI는 추후).

## 진입 조건

- 미로그인 사용자
- 스플래시에서 auth 없음

## 현재 구현 (목업)

| 동작 | 설명 |
|------|------|
| Apple / 카카오 탭 | `createMockUser` 후 **기존 `loopin_auth` 클리어·재저장** |
| 성공 후 | `/onboarding/member-type` (또는 `getPostAuthPath`) |
| 실제 OAuth | **없음** — 서버 토큰 없음 |

> “재방문 로그인 유지”는 현재 불완전하다. 로그인 화면 진입 시 세션이 초기화될 수 있다.

## 레이아웃 / 스펙

| 요소 | 스펙 (Figma Inspect) |
|------|----------------------|
| 프레임 | 393 × 852 |
| 배경 | `#2AA3FF` |
| Apple 버튼 | `#000`, 투명 히트 영역 |
| 카카오 버튼 | `#FFE812` / border `#FDE33E` |

## 접근성

- 소셜 버튼 `aria-label` (Apple로 계속 / 카카오로 계속)

## 주의사항

- Export 에셋 그대로, Tailwind, 투명 오버레이
- 목표 연동: [../student-teacher-sync.md](../student-teacher-sync.md)
