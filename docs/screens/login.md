# 로그인 화면

## 피그마 참조

| 항목 | 내용 |
|------|------|
| 프레임명 | 로그인화면 |
| Figma 링크 | https://www.figma.com/design/NFmd87QHBjrA3r9zV9s8Q7/Haksup?node-id=2917-6018 |
| node-id | `2917:6018` |
| Export 에셋 | `public/assets/login-screen.svg` (프레임 전체 Export, 원본: `로그인화면.svg`) |

## 목적

소셜 로그인(Apple / 카카오)으로 서비스에 진입한다.

## 구현 방식

- 피그마에서 선택한 프레임을 그대로 구현한다.
- 기존 프로젝트 구조를 유지한다.
- 새로운 프로젝트를 만들지 않는다.
- 파일 위치: `src/pages/LoginScreen.tsx`
- 라우트: `/login`
- 재사용 컴포넌트: `AppFrame` (라우팅 래퍼)
- 구현 방식: Figma Export SVG 전체 표시 + 소셜 버튼 투명 클릭 영역 오버레이

## 레이아웃 / 스펙

| 요소 | 스펙 (Figma Inspect) |
|------|----------------------|
| 프레임 | 393 × 852 |
| 배경 | `#2AA3FF` |
| 로고 | 176 × 67.427px, left 40px / top 142px |
| 슬로건 | Pretendard Medium 20px, `white/90`, line-height 26px |
| 마스코트 | 202 × 200px, `rounded-[100px]`, 중앙 |
| Apple 버튼 | 353 × 60px, `#000`, radius 13.92px |
| 카카오 버튼 | 353 × 60px, `#FFE812`, border `#FDE33E` |
| 버튼 텍스트 | SUIT Bold 18px |

## 주의사항

- 반응형으로 제작
- Tailwind 사용
- 기존 컴포넌트 최대한 재사용
- 에셋은 Figma Export 원본 사용
