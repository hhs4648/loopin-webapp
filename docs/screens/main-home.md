# 메인 홈 (초대코드 · 과제)

| 항목 | 값 |
|------|-----|
| 경로 | `/student/home`, `/teacher/home` |
| 플로우 | 초대코드 입력 → 입력 후 대기 → 과제 부여 후 |
| 구현 | `src/pages/MainHomeScreen.tsx`, `src/components/main-home/AssignmentReceivedScreen.tsx` |

## Export 에셋

| 단계 | Figma Export (원본) | 코드에서 사용하는 파일명 |
|------|---------------------|-------------------------|
| 1. 초대코드 입력 | `메인화면.svg` | `main-home-invite-code.svg` |
| 2. 초대코드 입력 후 | `메인화면(초대코드 입력후).svg` | `main-home-invite-entered.svg` |
| 3. 과제 부여 후 (고정 프레임) | `메인화면(과제 부여 받은후).svg` | `main-home-assignment-received.svg` |
| 3. 과제 부여 후 (스크롤 맵) | (확장 export) | `main-home-map-scroll.svg` |

## 테스트 동작

- 초대코드 입력: 영문·숫자만, 대문자만 허용
- 테스트 코드 `TEST` 입력 후 **입장하기** → 2단계 화면
- 3초 후 자동으로 3단계 화면으로 전환
- **3단계(과제 부여 후)** 레이아웃:
  - **하늘** (y 0–227): 고정, 스크롤 없음
  - **풀** (y 227–): 스크롤, 아래로 내리면 추가 길·성 표시
  - **네비게이션 바** (y 771–852): 항상 최상단 고정 (`z-50`)
- **성 상태 (테스트)**:
  - 1번 성만 과제 부여 (`assigned: true`), 전부 미완료 (`completed: false`)
  - 2–4번 성: 과제 미부여 → `castle-gray.svg` 오버레이
  - 미완료 과제 성: 맵 SVG의 자물쇠 마커 표시
  - 완료 과제 성: `mission-check.svg` 오버레이

## 추가 에셋

| Figma Export (원본) | 코드 파일명 | 용도 |
|---------------------|------------|------|
| `회색 성.svg` | `castle-gray.svg` | 과제 미부여 성 |
| `미션 체크.svg` | `mission-check.svg` | 과제 완료 뱃지 |
| `Dialog.svg` | `session-dropdown-dialog.svg` | 회차 선택 드롭다운 |

## 파일명 변경 (에이전트 적용)

```powershell
cd public/assets
Rename-Item -LiteralPath "메인화면.svg" -NewName "main-home-invite-code.svg"
Rename-Item -LiteralPath "메인화면(초대코드 입력후).svg" -NewName "main-home-invite-entered.svg"
Rename-Item -LiteralPath "메인화면(과제 부여 받은후).svg" -NewName "main-home-assignment-received.svg"
Rename-Item -LiteralPath "회색 성.svg" -NewName "castle-gray.svg"
Rename-Item -LiteralPath "미션 체크.svg" -NewName "mission-check.svg"
```
