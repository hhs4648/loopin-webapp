# Haksup Web App (`loopin-webapp`)

Haksup B2G **학생용** 모바일 웹앱입니다.  
교사용 웹은 별도 저장소 `loopin-project`이며, 두 앱은 공통 Supabase 백엔드로 동기화합니다
(env 설정 필요 — 미설정 시 동기화 비활성).  
자세한 연동 설계는 [`docs/student-teacher-sync.md`](docs/student-teacher-sync.md)를 참고하세요.

> **현재 상태:** Figma 시안 기반 프론트엔드 프로토타입에 Supabase 연동이 부분적으로
> 붙어 있습니다. 소셜 로그인은 여전히 목업입니다. 초대코드 가입·과제 수신·진도 저장은
> `.env.local`에 `VITE_SUPABASE_*`가 설정된 경우 실제 Supabase(Anonymous Auth +
> Postgres)로 동작하고, 미설정 시에는 초대코드 입력 단계에서 에러만 표시되어 더
> 진행되지 않습니다(과거의 `TEST` 코드 로컬 데모 우회는 더 이상 없음). 자세한 구현
> 상태는 [`docs/student-teacher-sync.md`](docs/student-teacher-sync.md) 참고.

## 기술 스택

| 항목 | 버전 / 내용 |
|------|-------------|
| React | 19 |
| TypeScript | 5.8 |
| Vite | 6 |
| Tailwind CSS | 4 |
| React Router | 7 |

## 실행

```bash
npm install
npm run dev
```

| 스크립트 | 설명 |
|----------|------|
| `npm run dev` | 개발 서버 |
| `npm run build` | `tsc -b` + Vite 프로덕션 빌드 |
| `npm run preview` | 빌드 결과 미리보기 |

## 문서

작업 시작 시 [`docs/INDEX.md`](docs/INDEX.md)를 먼저 읽으세요.

| 문서 | 내용 |
|------|------|
| [docs/INDEX.md](docs/INDEX.md) | 문서 인덱스·구현 상태 |
| [docs/uiux.md](docs/uiux.md) | 사용자 플로우·인터랙션 |
| [docs/design.md](docs/design.md) | 디자인 토큰·프레임 규칙 |
| [docs/figma.md](docs/figma.md) | Figma → 코드 핸드오프 |
| [docs/architecture.md](docs/architecture.md) | 구조·라우팅·상태 머신 |
| [docs/components.md](docs/components.md) | 공통 컴포넌트 카탈로그 |
| [docs/development.md](docs/development.md) | 개발·검증 체크리스트 |
| [docs/student-teacher-sync.md](docs/student-teacher-sync.md) | 학생↔교사 동기화 설계 |

## 화면 플로우 (현재 구현)

```
앱 실행 (/)
  └─ 스플래시 (1.8초)
       ├─ 미로그인 → /login
       ├─ 온보딩 미완료 → /onboarding/...
       └─ 완료 → /student/home 또는 /teacher/home

/login (Apple / 카카오 — 목업)
  └─ 회원 유형 선택 → 학생/교사 온보딩 → 홈

/student/home · /teacher/home
  └─ MainHomeScreen (동일 UI, 역할만 다름)
       ├─ 초대코드 입력 → Supabase 가입(env 필요, 없으면 에러) → 성 맵
       ├─ 1회차 성 → 단어·본문·문법 학습 + 오답 재시도
       └─ 2회차 성 → 학습1~4 (TTS 퀴즈)
```

## 디자인 원칙

- 피그마 시안을 **픽셀 단위**로 구현합니다. 임의 색상·카피·간격 변경 금지.
- 구현 규칙은 [`docs/figma.md`](docs/figma.md)를 따릅니다.

## 관련 저장소

| 저장소 | 역할 |
|--------|------|
| `loopin-webapp` (이 저장소) | 학생용 웹앱 |
| `loopin-project` | 교사용 웹 (별도) |
| 공통 Backend API | Supabase(Postgres + Anonymous Auth)로 **부분 구현** — env 필요, 상세: [`docs/student-teacher-sync.md`](docs/student-teacher-sync.md) |
