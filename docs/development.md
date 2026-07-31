# Development

> 학생용 웹앱 개발·검증 워크플로.

---

## 1. 환경

```bash
npm install
npm run dev      # http://localhost:5173 (Vite 기본)
npm run build    # tsc -b && vite build
npm run preview
```

요구: Node.js (LTS 권장), npm.

테스트/린트 스크립트는 아직 없다. PR 전 `npm run build`로 타입·빌드 검증.

---

## 2. 작업 시작 순서

1. [INDEX.md](./INDEX.md)에서 관련 문서·화면 명세 확인
2. [uiux.md](./uiux.md) 플로우 확인
3. [figma.md](./figma.md) 에셋·오버레이 규칙
4. [architecture.md](./architecture.md)에서 라우트 vs `MainHomeScreen` step 결정
5. [components.md](./components.md) 재사용 목록
6. 구현 후 **화면 md + INDEX 상태** 갱신

교사/과제 API가 필요하면 [student-teacher-sync.md](./student-teacher-sync.md)의 **제안** 섹션만 참고하고, 확정 전까지 엔드포인트를 코드에 하드코딩하지 않는다.

---

## 3. 새 화면 추가

### 라우트 페이지인 경우

1. `src/pages/...` 컴포넌트 작성
2. `App.tsx`에 `Route` 추가
3. `docs/screens/[name].md` 작성
4. INDEX 상태 표 갱신

### 학습 step인 경우 (`MainHomeScreen`)

1. feature 폴더 (`components/...`) + 데이터 ts
2. `MainStep` 유니온·렌더 분기 추가
3. 필요 시 `session-questions` / `session-results` ID·카운트 갱신
4. `docs/screens/learning-session.md` 또는 `castle-learning.md` 갱신

### 새 Figma 에셋

1. Export → `public/assets/`
2. 가능하면 ASCII rename
3. 코드 `src` 연결
4. 캐시 이슈 시 `?v=` 쿼리
5. [figma.md](./figma.md) rename 표 / 화면 명세 갱신

---

## 4. 수동 검증 매트릭스

| 시나리오 | 확인 |
|----------|------|
| 스플래시 → 로그인 | 1.8초 후 이동 |
| Apple/카카오 | 목업 로그인, 회원 유형 |
| 학생 온보딩 | 5단계 완료 → `/student/home` |
| 초대코드 (env 없음) | 입력 즉시 에러 문구, 진행 불가 (`TEST` 우회 없음) |
| 초대코드 (env 있음) | 교사 발급 코드 입력 → `enroll_with_invite_code` RPC 성공 시 맵으로 직행 |
| 잘못된 코드 (env 있음) | 입장 안 됨, 에러 문구 표시 |
| 1회차 성 | 단어→본문→문법→완료 |
| 오답만 풀기 | 오답 섹션만, 홈 복귀 |
| 전체 다시 | 처음부터 |
| 2회차 성 | 학습1~4, TTS, 퀴즈 미리보기 없음 |
| 새로고침 | 학습 진도 초기화(현재 한계) |
| `npm run build` | 성공 |

---

## 5. PR 전 체크리스트

- [ ] Figma 대비 시각 확인 (393폭)
- [ ] 선택지 텍스트 중복 렌더 없음
- [ ] 정답 미리보기 하이라이트 없음
- [ ] `aria-label` 있는 투명 버튼
- [ ] TTS/오디오 화면 이탈 시 stop
- [ ] `npm run build` 통과
- [ ] 관련 `docs/` 갱신 (INDEX·화면·figma rename)
- [ ] 목업/TBD를 확정 API처럼 문서에 쓰지 않음

---

## 6. 컨벤션

| 항목 | 규칙 |
|------|------|
| 언어 | UI 카피 한국어 (시안), 코드 식별자 영어 |
| 스타일 | Tailwind 유틸 우선, 레거시 클래스 최소화 |
| 상태 | 로컬 state; 전역 스토어 도입은 API 연동과 함께 |
| Import | feature 상대 경로 / `@` 별칭 없음 (현재) |

---

## 7. 알려진 이슈 (문서)

- 로그인 시마다 auth 초기화 → “재방문 사용자” 플로우 불완전
- 교사 온보딩 필드 라벨/state 바인딩 혼동 가능성 (`TeacherOnboardingScreen`) — 코드 확인 필요
- 일부 에셋 경로가 문서/코드에만 있고 파일 없을 수 있음
- 레거시 파랑 `#5CB5E8` vs 토큰 `#2AA3FF`
