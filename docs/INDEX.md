# Haksup Web — 문서 인덱스

> 학습 **학생용** 웹앱(`loopin-webapp`)을 구축·수정할 때 사용하는 마스터 문서입니다.  
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

**Haksup B2G** 학생용 모바일 웹앱. 피그마 시안을 React + Tailwind로 픽셀 단위 구현.  
교사용은 `loopin-project`/`loopin-web`이며, **Supabase**로 과제·진도를 동기화한다.

| 구분 | 내용 |
|------|------|
| **현재 구현** | Supabase Anonymous Auth · 초대코드 즉시 가입 · snapshot 과제 실행 · 진도 동기화 (`docs/student-teacher-sync.md`) |
| **환경** | `.env.local`에 `VITE_SUPABASE_*` 필요 · 없으면 초대코드 입력 단계에서 에러만 표시되고 더 진행되지 않음(구 `TEST` 코드 로컬 우회 없음) |
| **데모 유지** | 기존 고정 학습 세션(단어/문법 등) 컴포넌트·데이터는 코드에 남아 있으나, env 없이는 초대코드 화면을 통과할 수 없어 현재 이 경로로는 도달하지 않음 |

---

## ⚠️ 학생 메인 — `/student/home`

앱의 **학생 메인**은 학원/학교(선생님 초대) 성 맵 하나다.  
**`/student/main` 라우트는 없다.** 구어 “메인” / “학원 메인” / “학교 메인” / “student/main” → 모두 **`/student/home`** (`MainHomeScreen`).

| 사용자가 말하는 것 | 실제 라우트 | 구현 | 명세 |
|--------------------|-------------|------|------|
| **학원/학교 학생 메인** · 선생님 초대 · 과제 성 맵 | **`/student/home`** | `MainHomeScreen` → `AssignmentReceivedScreen` · `src/components/main-home/` | [screens/main-home.md](./screens/main-home.md) |

```
학생 온보딩 완료 → /student/home (초대코드)
```

> **삭제 (2026-08-11):** 혼자 공부·커리큘럼 (`/student/curriculum`, `/student/curriculum/main`)은 제품에서 제외했다.

---

## 빠른 시작 (에이전트용)

0. 작업 대상이 학원/학교 메인(`/student/home`)인지 확인
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
| 연속 학습 캘린더 | ✅ 시안 표시 (맵 배지 탭 · 실데이터 오버레이는 후속) | [screens/main-home.md](./screens/main-home.md) |
| 1회차 학습 세션 | ✅ 구현 (단어 A·B·C·D) | [screens/learning-session.md](./screens/learning-session.md) · [uiux.md](./uiux.md) §3.6 |
| 완료·오답 재시도 | ✅ 구현 | [screens/completion-retry.md](./screens/completion-retry.md) |
| 2회차 성 학습(학습1~4) | ✅ 구현 | [screens/castle-learning.md](./screens/castle-learning.md) |
| ~~혼자 공부·커리큘럼~~ | ❌ **삭제** (2026-08-11) | — |
| **복습하기** (하단 탭 `복습노트`) | 🟡 분류별 정답률·목록 + 「지금 시작하기」연습 풀이. 만점 시 분류 감추기·오답 시 오답률/카드 재배치(localStorage). 복습 답안 서버 저장은 미구현 | [screens/review.md](./screens/review.md) |
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
