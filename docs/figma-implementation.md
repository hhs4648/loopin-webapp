# Loopin 피그마 → 코드 구현 가이드

> 피그마 시안을 코드로 옮길 때 따르는 **공통 규칙**과 **화면별 구현 명세** 템플릿입니다.  
> 서비스 기획은 [`loopin-b2g-service-planning.md`](../../loopin-b2g-service-planning.md) 참고.

---

## 목차

1. [공통 원칙](#1-공통-원칙)
2. [작업 전 체크리스트](#2-작업-전-체크리스트)
3. [화면 명세 템플릿](#3-화면-명세-템플릿)
4. [구현 예시: 랜딩페이지 Hero](#4-구현-예시-랜딩페이지-hero)
5. [기존 컴포넌트 재사용 목록](#5-기존-컴포넌트-재사용-목록)
6. [에셋 관리](#6-에셋-관리)

---

## 1. 공통 원칙

| 항목 | 규칙 |
|------|------|
| 디자인 소스 | 피그마 프레임·컴포넌트를 **있는 그대로** 구현 |
| 프로젝트 | **`loopin-webapp` 기존 프로젝트 유지** — 새 프로젝트 생성 금지 |
| 구조 | 기존 `src/` 디렉터리 구조·라우팅 패턴 유지 |
| 스타일 | **Tailwind CSS** 사용 |
| 반응형 | 모바일 우선, 태블릿·데스크톱 breakpoint 대응 |
| 컴포넌트 | 기존 컴포넌트 **최대한 재사용**, 불가피할 때만 신규 생성 |
| 임의 변경 | 색상·간격·타이포·카피 **임의 수정 금지** (기획 충돌 시에만 협의) |
| 에셋 | 피그마 Export 원본(SVG/PNG/WebP) 우선 사용 |

### Tailwind breakpoint 기준 (권장)

| 토큰 | min-width | 대상 |
|------|-----------|------|
| (default) | — | 모바일 |
| `sm` | 640px | 큰 모바일 |
| `md` | 768px | 태블릿 |
| `lg` | 1024px | 데스크톱 |
| `xl` | 1280px | 와이드 데스크톱 |

### 디자인 토큰 (피그마 ↔ Tailwind)

기획 문서 [`loopin-b2g-service-planning.md` §2.1](../../loopin-b2g-service-planning.md) 과 동기화.

| 토큰 | HEX | Tailwind 예시 |
|------|-----|---------------|
| Loopin Blue | `#5CB5E8` | `bg-[#5CB5E8]` 또는 `theme` 확장 |
| Loopin Green | `#B8E847` | 로고 ∞ 색상 |
| Kakao Yellow | `#FEE500` | 소셜 버튼 |
| Gray 400 (비활성) | `#C4C4C4` | disabled 버튼 |
| 본문 텍스트 | `#111111` | `text-[#111111]` |
| 폰트 | Noto Sans KR | `font-sans` (tailwind config) |

---

## 2. 작업 전 체크리스트

구현 시작 전 아래를 확인합니다.

- [ ] 피그마 프레임 이름·링크 기록
- [ ] 대상 breakpoint 프레임 확인 (Mobile / Tablet / Desktop)
- [ ] Export 에셋 목록 정리 (아이콘, 일러스트, 로고)
- [ ] 기존 재사용 가능 컴포넌트 확인 ([§5](#5-기존-컴포넌트-재사용-목록))
- [ ] 라우트 경로·파일 위치 결정
- [ ] 인터랙션·상태(hover, disabled, empty) 피그마 프로토타입 확인

---

## 3. 화면 명세 템플릿

새 화면·섹션 구현 시 아래 형식으로 **이 문서 하단 또는 `docs/screens/`** 에 명세를 추가합니다.

```markdown
# [화면명 / 섹션명]

## 피그마 참조
- 프레임명:
- Figma 링크:
- Export 에셋:

## 목적
(이 화면/섹션이 사용자에게 전달하는 가치)

## 구현 방식
- 피그마에서 선택한 프레임을 그대로 구현한다.
- 기존 프로젝트 구조를 유지한다.
- 새로운 프로젝트를 만들지 않는다.
- 파일 위치: `src/...`
- 라우트: `/...`
- 재사용 컴포넌트: `...`

## 레이아웃 / 스펙
| 요소 | 스펙 |
|------|------|
| ... | ... |

## 상태
| 상태 | 동작 / UI |
|------|-----------|
| default | |
| hover | |
| disabled | |

## 주의사항
- 반응형으로 제작
- Tailwind 사용
- 기존 컴포넌트 최대한 재사용
- (화면별 추가 주의사항)
```

---

## 4. 구현 예시: 랜딩페이지 Hero

# 랜딩페이지 — Hero

## 피그마 참조

| 항목 | 내용 |
|------|------|
| 프레임명 | *(피그마 프레임명 입력)* |
| Figma 링크 | *(URL 입력)* |
| Export 에셋 | `logo-loopin.svg`, Hero 일러스트 *(필요 시 추가)* |

## 목적

첫 화면에서 Loopin의 핵심 가치를 전달한다.

## 구현 방식

- 피그마에서 선택한 프레임을 그대로 구현한다.
- 기존 프로젝트 구조를 유지한다.
- 새로운 프로젝트를 만들지 않는다.
- 파일 위치: `src/pages/landing/LandingPage.tsx`, `src/components/landing/HeroSection.tsx`
- 라우트: `/landing` *(또는 서비스 진입 정책에 맞는 경로)*
- 재사용 컴포넌트: `LoopinLogo`, `AppFrame` *(필요 시 `primary-button` 패턴)*

## 레이아웃 / 스펙

| 요소 | 스펙 |
|------|------|
| 배경 | 피그마 프레임 배경색 그대로 |
| 로고 | `LoopinLogo` — `public/assets/logo-loopin.svg` |
| 헤드라인 | 피그마 카피 그대로 |
| 서브카피 | 피그마 카피 그대로 |
| CTA 버튼 | 피그마 색상·radius·높이 그대로 |
| 일러스트 | 피그마 Export 에셋 사용 |

## 반응형

| breakpoint | 레이아웃 |
|------------|----------|
| Mobile | 세로 스택 (텍스트 상단 → 일러스트 하단) |
| md 이상 | 피그마 Desktop 프레임 기준 2컬럼 *(또는 시안대로)* |
| max-width | 콘텐츠 영역 `max-w-*` 피그마 기준 |

## 상태

| 상태 | UI |
|------|-----|
| default | 피그마 기본 |
| CTA hover | 피그마 hover 스타일 *(없으면 opacity만 적용)* |

## 주의사항

- 반응형으로 제작
- Tailwind 사용
- 기존 컴포넌트 최대한 재사용
- 로고·일러스트는 **임의 SVG 제작 금지** — 피그마 Export 파일 사용
- Hero 카피·간격·폰트 크기 피그마 Inspect 값 그대로 적용

---

## 5. 기존 컴포넌트 재사용 목록

| 컴포넌트 | 경로 | 용도 |
|----------|------|------|
| `AppFrame` | `src/components/AppFrame.tsx` | 모바일 앱 프레임 래퍼 |
| `LoopinLogo` | `src/components/LoopinLogo.tsx` | Loopin 로고 |
| `MascotCharacter` | `src/components/MascotCharacter.tsx` | 로그인 마스코트 |
| `SplashScreen` | `src/pages/SplashScreen.tsx` | 플래시 화면 |
| `LoginScreen` | `src/pages/LoginScreen.tsx` | 소셜 로그인 |
| `MemberTypeScreen` | `src/pages/MemberTypeScreen.tsx` | 회원 유형 선택 |

### CSS / UI 패턴 (Tailwind 전환 시 참고)

| 패턴 | 기존 클래스 | 설명 |
|------|-------------|------|
| Primary 버튼 | `.primary-button` | CTA, 다음 버튼 |
| 소셜 버튼 | `.social-button--apple`, `--kakao` | 로그인 |
| 라디오 옵션 | `.radio-option` | 회원 유형 선택 |
| 화면 배경 (블루) | `.screen--blue` | `#5CB5E8` |
| 화면 배경 (화이트) | `.screen--white` | 흰 배경 |

> Tailwind 도입 후에는 위 패턴을 `@layer components` 또는 공통 컴포넌트(`Button`, `RadioOption`)로 이전합니다.

---

## 6. 에셋 관리

```
public/assets/
├── logo-loopin.svg      # Loopin 로고 (피그마 Export)
├── mascot-login.svg     # 로그인 마스코트 (피그마 Export)
└── landing/             # 랜딩 전용 에셋 (추가 시)
```

| 규칙 | 설명 |
|------|------|
| 파일명 | kebab-case, 용도 명시 |
| 포맷 | 아이콘·로고 → SVG / 사진·복잡 일러스트 → PNG·WebP |
| 교체 | 피그마 업데이트 시 동일 경로 파일 **교체** (import 경로 유지) |
| 금지 | 시안 없이 임의 일러스트·아이콘 제작 |

---

## 화면 명세 추가 목록

구현 시 아래에 링크를 추가합니다.

| 화면 | 명세 | 상태 |
|------|------|------|
| 플래시 | [docs/screens/splash.md](screens/splash.md) | ✅ Tailwind 구현 |
| 로그인 | [docs/screens/login.md](screens/login.md) | ✅ Tailwind 구현 |
| 회원 유형 선택 | [기획 문서 §2.2-③](../../loopin-b2g-service-planning.md) | ✅ 구현됨 |
| 랜딩 Hero | [§4](#4-구현-예시-랜딩페이지-hero) | 📋 명세만 |

---

*문서 버전: v1.0 — Loopin `loopin-webapp` 피그마 구현 가이드*
