# 플래시 화면

## 피그마 참조

| 항목 | 내용 |
|------|------|
| 프레임명 | 플래시화면 |
| Figma 링크 | https://www.figma.com/design/NFmd87QHBjrA3r9zV9s8Q7/Haksup?node-id=2917-5988 |
| node-id | `2917:5988` |
| Export 에셋 | `public/assets/logo-loopin.png`, `status-*.svg` |

## 목적

앱 실행 시 Loopin 브랜드를 노출하고, 이후 로그인·온보딩 화면으로 전환한다.

## 구현 방식

- 피그마에서 선택한 프레임을 그대로 구현한다.
- 기존 프로젝트 구조를 유지한다.
- 새로운 프로젝트를 만들지 않는다.
- 파일 위치: `src/pages/SplashScreen.tsx`
- 라우트: `/`
- 재사용 컴포넌트: `LoopinLogo`, `IphoneStatusBar`, `AppFrame`

## 레이아웃 / 스펙

| 요소 | 스펙 (Figma Inspect) |
|------|----------------------|
| 프레임 | 393 × 852 |
| 배경 | `#2AA3FF` |
| Status Bar | iOS 스타일, 높이 53px, `pt-[21px]`, 시간 `18:00` |
| 로고 | `176 × 67.427px`, 화면 정중앙 |
| 로고 색 | 흰색 + `#B2F165` (∞ 좌측 루프) |
| 전환 | 1.8초 후 인증 상태에 따라 라우팅 |

## 주의사항

- 반응형으로 제작
- Tailwind 사용
- 기존 컴포넌트 최대한 재사용
- 로고는 Figma Export PNG (`4501:2481`) 사용
