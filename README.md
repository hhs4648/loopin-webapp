# Loopin Web App

Loopin B2G 서비스 학생용 웹앱 (온보딩 1단계)

## 디자인

기존 피그마 시안을 그대로 사용합니다. 피그마 → 코드 작업 규칙은 [`docs/figma-implementation.md`](docs/figma-implementation.md) 참고.

## 실행

```bash
npm install
npm run dev
```

## 화면 플로우

```
앱 실행 (/)
  └─ 플래시 화면 (1.8초)
       ├─ 미로그인 → /login
       ├─ 최초 로그인 (온보딩 미완료) → /onboarding/member-type
       └─ 로그인 + 온보딩 완료 → /student/home 또는 /teacher/home

/login (소셜 로그인)
  └─ 최초 로그인 → /onboarding/member-type
  └─ 재방문 → 해당 홈

/onboarding/member-type
  ├─ 학생 선택 → /onboarding/student → (이후 학생 전용 단계)
  └─ 선생님 선택 → /onboarding/teacher → (이후 선생님 전용 단계)
```

## 디자인

기존 피그마 시안을 기준으로 구현합니다. 임의 변경 없이 디자인 그대로 사용합니다.
