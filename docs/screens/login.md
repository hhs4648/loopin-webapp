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

## 현재 구현 (실제 OAuth · 2026-08-11 도입)

목업이 아니다. `src/lib/sync/social-auth.ts`가 Supabase OAuth(PKCE)를 실제로 태운다.

| 동작 | 설명 |
|------|------|
| Apple / 카카오 / 구글 탭 | `startSocialLogin(provider)` — 켜져 있는 provider인지 확인 후 OAuth 시작 |
| 익명 기록이 있으면 | `linkIdentity`로 **그 계정에 붙인다** (uid 유지 → 풀이 기록 보존) |
| 돌아오는 자리 | `/auth/callback` (`AuthCallbackScreen`) → 프로필 조회 → `getPostAuthPath` |

### 웹과 앱이 다르다 (2026-09-04)

| | 돌아올 주소 | 로그인 창 |
|---|---|---|
| 웹 | `${window.location.origin}/auth/callback` | 같은 탭이 provider로 이동 |
| 앱(iOS·Android) | `haksup://auth/callback` | 시스템 브라우저(SFSafariViewController / Custom Tabs) |

앱에서 `window.location.origin`을 쓰면 `capacitor://localhost`가 되는데, Supabase
허용 목록에 없는 주소라 **Site URL(`https://loopin-webapp.vercel.app`)로 보내 버린다** —
앱에서 로그인을 눌렀는데 웹앱이 열리던 원인. 자세한 건 `HANDOFF.md` §15.

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
