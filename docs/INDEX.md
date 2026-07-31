# Loopin Web — 문서 인덱스

> 루핀 **학생용** 웹앱(`loopin-webapp`)을 구축·수정할 때 사용하는 마스터 문서입니다.  
> 에이전트/개발자는 **이 파일을 먼저 읽고** 필요한 하위 문서를 참조하세요.

---

## 문서 구조

| 문서 | 용도 | 언제 읽나 |
|------|------|-----------|
| [design.md](./design.md) | 디자인 시스템 — 색상, 타이포, 프레임, 상태 | UI 구현 전 |
| [figma.md](./figma.md) | 피그마 파일, Export, 오버레이, 에셋 규칙 | 디자인 → 코드 변환 시 |
| [uiux.md](./uiux.md) | 사용자 플로우, 인터랙션, 상태, 접근성 | 화면·기능 설계·구현 시 |
| [architecture.md](./architecture.md) | 스택, 폴더, 라우팅, 상태 머신, 목업 한계 | 셋업·리팩터링 시 |
| [components.md](./components.md) | 공통 컴포넌트 카탈로그 | 새 화면 구현 시 |
| [development.md](./development.md) | 워크플로·체크리스트 | 작업 시작·PR 전 |
| [student-teacher-sync.md](./student-teacher-sync.md) | 학생앱 ↔ 교사앱(`loopin-project`) 동기화 설계 | API/연동 설계 시 |
| [screens/](./screens/) | 화면별 상세 명세 | 특정 화면 구현 시 |

### 레거시 문서 (참고용 — 내용은 `figma.md`로 통합)

| 문서 | 비고 |
|------|------|
| [figma-implementation.md](./figma-implementation.md) | 초기 구현 가이드 — 신규 작업은 `figma.md` 우선 |
| [figma-handoff-guide.md](./figma-handoff-guide.md) | Export 가이드 — 신규 작업은 `figma.md` 우선 |

---

## 프로젝트 한 줄 요약

**Loopin B2G** 학생용 모바일 웹앱. 피그마 시안을 React + Tailwind로 픽셀 단위 구현.  
교사용은 `loopin-project`/`loopin-web`이며, **Supabase**로 과제·진도를 동기화한다.

| 구분 | 내용 |
|------|------|
| **현재 구현** | Supabase Anonymous Auth · 초대코드 즉시 가입 · snapshot 과제 실행 · 진도 동기화 (`docs/student-teacher-sync.md`) |
| **환경** | `.env.local`에 `VITE_SUPABASE_*` 필요 · 없으면 초대코드 입력 단계에서 에러만 표시되고 더 진행되지 않음(구 `TEST` 코드 로컬 우회 없음) |
| **데모 유지** | 기존 고정 학습 세션(단어/문법 등) 컴포넌트·데이터는 코드에 남아 있으나, env 없이는 초대코드 화면을 통과할 수 없어 현재 이 경로로는 도달하지 않음 |

---

## ⚠️ 학생 메인 화면 2종 — 절대 헷갈리지 말 것

앱에 **학생 메인 맵이 두 개** 있다. 말하는 사람이 「메인」「학원 메인」「학교 메인」「혼자 공부 메인」이라고 하면 **아래 표를 먼저 보고** 작업한다.  
**`/student/main` 라우트는 없다.** (구어로 “student/main”이라고 해도 코드 경로는 `/student/home`이다.)

| 사용자가 말하는 것 | 실제 라우트 | 구현 | 명세 | 무엇 |
|--------------------|-------------|------|------|------|
| **학원/학교 학생 메인** · 선생님 초대 · 과제 성 맵 | **`/student/home`** | `MainHomeScreen` → `AssignmentReceivedScreen` · `src/components/main-home/` | [screens/main-home.md](./screens/main-home.md) | 초대코드 → 성(캐슬) 맵 · 과제 실행 |
| **혼자 공부 학생 메인** · 커리큘럼 맵 · Day 1·2·3 | **`/student/curriculum/main`** | `CurriculumMainScreen` · `src/components/curriculum-main/` | [screens/curriculum-course.md](./screens/curriculum-course.md) | 내신 코스 생성 후 LONG 맵 · Day 노드 |

```
온보딩 「선생님 초대를 받았어요」 → /student/home
온보딩 「혼자 공부할래요」     → /student/curriculum → (코스 생성) → /student/curriculum/main
```

- 「메인화면 길/캐릭터/성」→ **먼저 어느 메인인지 확인**. 학원·학교면 `main-home`, 혼자 공부면 `curriculum-main`.
- 에셋도 다름: 학원·학교 = `main-home-academy-map.svg` (LONG 단일) · 혼자 공부 = `main-screen-long.svg`.

---

## 빠른 시작 (에이전트용)

0. **위 「학생 메인 화면 2종」표를 확인** — 학원/학교(`/student/home`) vs 혼자 공부(`/student/curriculum/main`)
1. 작업 대상 화면을 `uiux.md`에서 플로우 확인
2. `figma.md`에서 프레임·에셋·오버레이 규칙 확인
3. `design.md`에서 색상·타이포·프레임 토큰 확인
4. `architecture.md`에서 파일 위치·상태 머신 확인
5. `components.md`에서 재사용 컴포넌트 확인
6. `docs/screens/[화면명].md` 명세에 맞춰 구현
7. 교사 연동이 필요하면 `student-teacher-sync.md` 확인
8. `development.md` 체크리스트로 마무리

---

## 문서 작성 규칙

- **한 화면 = 한 파일**: `docs/screens/` 아래에 추가
- **피그마 링크**: 가능하면 프레임명·node-id·Export 파일명 기록
- **임의 변경 금지**: 디자인·카피 변경은 기획 협의 후 문서 갱신
- **에셋 파일명**: 한글 Export → ASCII rename (`figma.md` 참고). 학습 에셋 일부는 아직 한글 파일명 유지
- **문서 ↔ 코드 동기화**: 구현 후 관련 md 함께 업데이트
- **현재 / 목표 / TBD 구분**: 목업을 실제 연동처럼 적지 말 것

---

## 현재 구현 상태

| 영역 | 상태 | 명세 |
|------|------|------|
| 스플래시 | ✅ 구현 | [screens/splash.md](./screens/splash.md) |
| 로그인 | ✅ 구현 (목업) | [screens/login.md](./screens/login.md) |
| 회원 유형 선택 | ✅ 구현 | [screens/member-type.md](./screens/member-type.md) |
| 학생 온보딩 | ✅ 구현 | [screens/student-onboarding.md](./screens/student-onboarding.md) |
| 교사 온보딩 | ✅ 구현 (이 앱 내 UI) | [screens/teacher-onboarding.md](./screens/teacher-onboarding.md) |
| **학원/학교 메인** (`/student/home` · 초대·성 맵) | ✅ 구현 | [screens/main-home.md](./screens/main-home.md) |
| 칭찬 캘린더 | ✅ 구현 (lessonDate·점수 연동 · 70점 기준) | [screens/main-home.md](./screens/main-home.md) |
| 1회차 학습 세션 | ✅ 구현 (단어 A·B·C·D) | [screens/learning-session.md](./screens/learning-session.md) · [uiux.md](./uiux.md) §3.6 |
| 완료·오답 재시도 | ✅ 구현 | [screens/completion-retry.md](./screens/completion-retry.md) |
| 2회차 성 학습(학습1~4) | ✅ 구현 | [screens/castle-learning.md](./screens/castle-learning.md) |
| **혼자 공부** 코스 만들기 (`/student/curriculum`) · **혼자 공부 메인** (`/student/curriculum/main`) | ✅ 구현 (목업) | [screens/curriculum-course.md](./screens/curriculum-course.md) |
| 백엔드 / `loopin-project` 연동 | ✅ 구현 (env 필요 · 미설정 시 비활성) | [student-teacher-sync.md](./student-teacher-sync.md) |

> 참고: `/teacher/home`은 현재 학생 홈과 **동일 UI**를 렌더합니다. 교사용 본 기능은 `loopin-project`로 이전·연동하는 것이 목표입니다.

---

## 관련 링크

| 항목 | URL / 경로 |
|------|------------|
| Figma 파일 | `https://www.figma.com/design/NFmd87QHBjrA3r9zV9s8Q7/Haksup` |
| 로컬 실행 | `npm install && npm run dev` |
| 에셋 폴더 | `public/assets/` |
| 소스 루트 | `src/` |
| GitHub | `https://github.com/hhs4648/loopin-webapp.git` |
