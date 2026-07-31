# 스플래시

| 항목 | 값 |
|------|-----|
| 경로 | `/` |
| 구현 | `src/pages/SplashScreen.tsx` |
| Figma | https://www.figma.com/design/NFmd87QHBjrA3r9zV9s8Q7/Haksup?node-id=2917-5988 |
| node-id | `2917:5988` |
| Export | `logo-loopin.svg`, `status-*.svg` (문서의 `logo-loopin.png`는 구버전 — SVG 우선) |

## 목적

앱 실행 시 브랜드 노출 후 인증 상태에 따라 분기.

## 진입 조건

- 앱 최초 진입 또는 알 수 없는 경로 리다이렉트

## 상태·인터랙션

| 상태 | 동작 |
|------|------|
| 표시 | 배경 `#2AA3FF`, 로고 중앙, 상태바 |
| 1.8초 후 | `getStoredAuth()` → `getPostAuthPath` 또는 `/login` |

## 레이아웃

| 요소 | 스펙 |
|------|------|
| 프레임 | 393 × 852 |
| 배경 | `#2AA3FF` |
| Status Bar | iOS 스타일 |
| 로고 | 중앙, ∞ 강조 `#B2F165` |

## 접근성

- 장식적 로고; 자동 전환이므로 CTA 없음

## 주의사항

- 임의 딜레이/카피 변경 금지
- 에셋은 Figma Export 사용
