# Figma → 코드 정확도를 위한 전달 가이드

> 링크만 주면 **대략 비슷하게** 만들 수 있지만, **픽셀 단위로 일치**시키려면 아래 중 하나 이상이 필요합니다.

---

## 왜 링크만으로는 부족한가?

| 문제 | 설명 |
|------|------|
| MCP View 권한 | Figma MCP **월 6회** 제한, 에셋 Export 불가 |
| 임시 URL | MCP 에셋 URL은 **7일 후 만료** |
| 잘못된 레이어 | 자동 추출 시 **다른 레이어**가 내려올 수 있음 (예: 마스코트 대신 홍보 이미지) |
| 파일 형식 | SVG를 `.png`로 저장하면 **로고 깨짐** |

---

## 정확도별 전달 방법 (추천 순)

### ⭐ 1순위: Figma에서 에셋 직접 Export (가장 정확)

Figma에서 해당 프레임/그룹을 선택 → 우측 **Export** → PNG @2x 또는 SVG

프로젝트에 넣을 경로:

```
public/assets/
├── login-logo.svg          # 로고 그룹
├── login-mascot.png        # 마스코트 원형 일러스트 전체 (그룹 단위)
├── apple-icon.svg
└── kakao-icon.svg
```

채팅에 이렇게 요청:

> "로그인 화면 Figma 에셋 Export 했어. `public/assets/`에 넣었으니 그대로 적용해줘"

**Export 할 레이어 (로그인 화면 예시)**

| Figma 레이어 | Export 파일명 |
|-------------|---------------|
| Group 2085664235 (로고) | `login-logo.svg` |
| 마스코트 원형 그룹 (2917:6061) | `login-mascot.png` |
| apple.logo | `apple-icon.svg` |
| Vector (카카오) | `kakao-icon.svg` |

### 에셋 파일명 정리 (한글 Export → ASCII)

Figma에서 한글 파일명으로 Export해도 되지만, 코드·URL 문제를 줄이기 위해 `public/assets/`에 넣은 뒤 ASCII 이름으로 변경합니다.

**에이전트 작업 규칙:** 새 Figma Export를 코드에 연결할 때, 아래 표에 따라 **한글 파일명을 ASCII로 변경**하고, **코드 참조·`docs/screens/*.md`·이 표를 함께 갱신**합니다. 사용자가 별도로 말하지 않아도 적용합니다.

| Figma Export (원본) | 변경 후 파일명 | 화면 |
|---------------------|----------------|------|
| `로그인화면.svg` | `login-screen.svg` | 로그인 |
| `온보딩_회원가입 1(교사 선택).svg` | `onboarding-teacher-01-terms.svg` | 선생님 온보딩 1 |
| `온보딩_회원가입 2(교사 선택).svg` | `onboarding-teacher-02-school.svg` | 선생님 온보딩 2 |
| `온보딩_회원가입 3(교사 선택).svg` | `onboarding-teacher-03-name.svg` | 선생님 온보딩 3 |
| `온보딩_회원가입 4(교사선택).svg` | `onboarding-teacher-04-complete.svg` | 선생님 온보딩 4 |
| `온보딩_생년월일_선택전.svg` | `onboarding-student-03-birthdate.svg` | 학생 온보딩 3 |
| `온보딩_학년선택_선택전.svg` | `onboarding-student-04-grade.svg` | 학생 온보딩 4 |
| `온보딩_마지막_학생.svg` | `onboarding-student-05-complete.svg` | 학생 온보딩 5 |
| `메인화면.svg` | `main-home-invite-code.svg` | 메인 — 초대코드 입력 |
| `메인화면(초대코드 입력후).svg` | `main-home-invite-entered.svg` | 메인 — 초대코드 입력 후 |
| `메인화면(과제 부여 받은후).svg` | `main-home-assignment-received.svg` | 메인 — 과제 부여 후 |
| `Container.svg` | `birthdate-dropdown-container.svg` | 생년월일 드롭다운 배경 |
| `회색 성.svg` | `castle-gray.svg` | 메인 — 미부여 성 |
| `체크표시.svg` / `미션 체크.svg` | `mission-check.svg` | 메인 — 과제 완료 뱃지 |
| `Dialog.svg` | `session-dropdown-dialog.svg` | 메인 — 회차 선택 드롭다운 |
| `main-home-assignment-received.svg` | `main-home-map-scroll.svg` | 메인 맵 스크롤용 (viewBox 확장) |

```powershell
cd public/assets
Rename-Item -LiteralPath "로그인화면.svg" -NewName "login-screen.svg"
Rename-Item -LiteralPath "온보딩_회원가입 1(교사 선택).svg" -NewName "onboarding-teacher-01-terms.svg"
Rename-Item -LiteralPath "온보딩_회원가입 2(교사 선택).svg" -NewName "onboarding-teacher-02-school.svg"
Rename-Item -LiteralPath "온보딩_회원가입 3(교사 선택).svg" -NewName "onboarding-teacher-03-name.svg"
Rename-Item -LiteralPath "온보딩_회원가입 4(교사선택).svg" -NewName "onboarding-teacher-04-complete.svg"
Rename-Item -LiteralPath "온보딩_생년월일_선택전.svg" -NewName "onboarding-student-03-birthdate.svg"
Rename-Item -LiteralPath "온보딩_학년선택_선택전.svg" -NewName "onboarding-student-04-grade.svg"
Rename-Item -LiteralPath "온보딩_마지막_학생.svg" -NewName "onboarding-student-05-complete.svg"
Rename-Item -LiteralPath "메인화면.svg" -NewName "main-home-invite-code.svg"
Rename-Item -LiteralPath "메인화면(초대코드 입력후).svg" -NewName "main-home-invite-entered.svg"
Rename-Item -LiteralPath "메인화면(과제 부여 받은후).svg" -NewName "main-home-assignment-received.svg"
Rename-Item -LiteralPath "Container.svg" -NewName "birthdate-dropdown-container.svg"
Rename-Item -LiteralPath "회색 성.svg" -NewName "castle-gray.svg"
Rename-Item -LiteralPath "미션 체크.svg" -NewName "mission-check.svg"
Rename-Item -LiteralPath "Dialog.svg" -NewName "session-dropdown-dialog.svg"
```

상세: `docs/screens/login.md`, `docs/screens/teacher-onboarding.md`, `docs/screens/student-onboarding.md`, `docs/screens/main-home.md`

---

### ⭐ 2순위: Figma Dev / Full seat + MCP

| Seat | MCP 읽기 | 정확도 |
|------|----------|--------|
| View | 월 6회, 제한적 | △ |
| Dev / Full | 일 200회+ | ◎ |

Dev/Full seat이면 **링크 + node-id만**으로도 에셋 자동 다운로드 가능.

---

### 3순위: 프레임 PNG Export + 링크

전체 화면을 PNG @2x로 Export해서 첨부 + Figma 링크

> "이 PNG가 정답이야. 링크랑 같이 보고 구현해줘"

비교 기준 이미지로 쓰면 차이를 줄일 수 있습니다.

---

### 4순위: 링크만 (현재 방식)

```
https://www.figma.com/design/...?node-id=2917-6018
```

가능하지만 View seat + 자동 에셋 추출 오류로 **차이가 날 수 있음**.

---

## 요청 템플릿 (복사해서 사용)

```markdown
## 화면: 로그인
- Figma: [링크]
- node-id: 2917:6018
- Export 완료: public/assets/login-*.png (또는 svg)
- 기준 스크린샷: (첨부)
- 요청: Export 에셋 그대로 사용, Tailwind, 반응형
```

---

## 체크리스트 (전달 전)

- [ ] 화면별 **그룹 단위** Export (전체 프레임 말고 로고·마스코트·버튼 아이콘 분리)
- [ ] 파일 확장자 올바름 (SVG → `.svg`, PNG → `.png`)
- [ ] `public/assets/`에 저장
- [ ] Figma 링크에 **node-id** 포함
- [ ] (선택) 완성 화면 스크린샷 첨부
