# App Store 재심사 대응 (2026-09)

리젝 사유 두 가지 — **Guideline 2.2**(미완성/테스트 앱으로 보임), **Guideline 5.1.1(v)**(앱 안에서 회원탈퇴를 찾지 못함).

---

## 1. 이번 빌드에서 고친 것

| 무엇 | 왜 (2.2 관점) | 어디 |
|---|---|---|
| **단어장 탭 제거** | 하단 내비 5칸 중 1칸이 눌러도 「단어장은 준비 중이에요」 토스트만 떴다. 앱이 스스로 미완성이라고 말하는 꼴 | 내비 시안 4칸 재작성 · `MAIN_HOME_NAV_TABS` |
| **초대코드 화면 헬스장 탭 연결** | 분기가 없어 눌러도 **아무 일도 일어나지 않았다**. 반응 없는 버튼은 고장으로 읽힌다 | `MainHomeScreen.handleInviteNavSelect` |
| **학습완료 화면 문구 교체** | 시안에 구워진 「단어장에서도 복습할 수 있어요」가 없는 기능을 가리키고 있었다 | `LearningCompleteScreen` |
| **회원탈퇴를 설정 최상위에 노출** | 5.1.1(v) 직접 대응 — 아래 참조 | `SettingsWindow` · `SettingsDeleteSheet` |

## 2. 5.1.1(v) — 심사자가 못 찾은 이유

기능은 **있었다.** 다만 설정 화면이 Figma에서 구워낸 이미지 위에 투명 버튼을 얹은 구조라,
화면에 보이는 글자는 「연동 계정」뿐이었고 **「회원탈퇴」라는 단어가 어디에도 표시되지 않았다.**
그 행을 눌러야 시트 안에서 나왔다. 심사자가 설정을 다 뒤져도 찾을 방법이 없었다.

지금은 **설정 하단에 빨간 「회원탈퇴」 글자가 그대로 보이고**, 눌러서 두 단계 확인 후
탈퇴 완료 화면까지 간다.

경로: `설정(전체 탭) → 맨 아래 「회원탈퇴」 → 「회원탈퇴」 → 「탈퇴하기」 → 「탈퇴가 완료되었어요」`

**데모 계정도 탈퇴된다** — `delete_own_account()`가 `authenticated` 롤에 열려 있고
Supabase 익명 세션도 그 롤이다(`supabase/migrations/014_delete_own_account.sql` 주석 참조).

## 3. 아직 남은 2.2 위험 — 확인·조치 필요

### (a) 데모 반 콘텐츠가 얇다 ← 가장 유력

2026-09-09 기준 데모 반(`AB6NKL` / 「중3 영어」) 실측:

- 과제 **4개**, 전부 같은 단원(YBM 송 5단원 1~4파트)
- **단어 61개뿐 · 문법 0개 · 본문 0개**
- 신규 계정이라 **복습하기 비어 있음**(틀린 기록이 없으니 당연)
- 신규 계정이라 **헬스장 비어 있음**(교사가 오답 재출제를 안 했으니 당연)

즉 심사자가 본 것은 **단어 문제 4세트가 전부**고, 나머지 탭은 전부 빈 화면이었을 가능성이 높다.
앱은 문법·본문·복습·헬스장을 다 갖고 있는데 **데모 반에 그게 하나도 없다.**

**조치:** 재제출 전에 데모 반을 채울 것 —
1. 문법 문제와 본문(교사가 직접 입력)을 포함한 과제 추가
2. **심사용 데모 로그인**을 한 번 한다. 첫 숙제가 **약 70% 정답**으로 자동 기록된다 → 복습하기에 오답 분석이 생긴다
3. 교사 웹에서 그 학생(이름 `심사`)에게 「오답만 다시 출제」를 한 번 눌러 두기 → 헬스장에 내용이 생긴다
4. 마감일이 지난 과제만 남지 않게 날짜를 갱신 (현재 전부 `2026-09-07` 마감, 표시만 되고 잠기지는 않지만 인상이 나쁘다)

데모 로그인은 기기마다 **새 익명 계정**을 만든다. 그래서 풀이 기록을 미리 한 계정에만 넣어 두면 심사자가 다시 로그인했을 때 빈 화면이 된다. 지금은 로그인 직후 첫 숙제를 자동으로 70% 풀어 두므로, 누가 들어가도 복습 탭이 비지 않는다.

### (b) 구글 로그인 게시 상태 미확인

구글 OAuth 「대상」이 **`테스트` 상태면 구글 로그인이 전부 차단된다.** 심사자가 그걸 눌렀다면
로그인 실패를 겪었을 것이고, 그것만으로 2.2가 난다. **Google Cloud Console에서 `프로덕션`인지 확인할 것.**

또한 구글 동의화면에 앱 이름 대신 `mqnzowyqlxhsllqeeyuo.supabase.co`가 뜬다.
심사자에게는 미완성 신호로 읽힐 수 있다(자체 도메인이 있어야 고쳐진다).

### (c) Apple Developer Program 멤버십 만료 2026-10-01

**3주 남았다.** 심사 중에 만료되면 제출이 통째로 죽는다. 재제출 전에 갱신할 것.
애플 client secret은 2027-02-24까지라 이번 심사에는 문제없다.

---

## 4. App Review Notes (App Store Connect에 붙여넣기)

```
DEMO ACCOUNT

The app is used by middle-school students who join a class created by their
teacher, so a class invite code is normally required. To let you skip that
setup, we provide direct demo access:

  1. Launch the app.
  2. On the sign-in screen, tap the button at the top: "심사용 데모 로그인"
     (= "Demo login").
  3. Enter password: 1234
  4. Wait about 10–20 seconds while the demo account is prepared
     (please do not force-quit during this step).

This signs you straight into a student account that is already enrolled in a
demo class with assignments, so no social sign-in and no invite code are
needed. The first class assignment is already completed at about 70%
correct, so Review (오답 분석) shows mixed results. The teacher can then
send those missed items to Gym (헬스장) as a retry set.

If you prefer to test the real sign-up flow instead, use "Apple로 시작하기"
(Sign in with Apple) and then enter this class invite code when prompted:

  AB6NKL


ACCOUNT DELETION  (Guideline 5.1.1(v))

Account deletion can be started inside the app:

  1. Tap "전체" (the rightmost tab in the bottom navigation) to open Settings.
  2. Scroll to the bottom of Settings.
  3. Tap "회원탈퇴" (= "Delete account"), shown in red below the Log out card.
  4. Tap "회원탈퇴" in the sheet that opens, then "탈퇴하기" to confirm.
  5. The app shows "탈퇴가 완료되었어요" (= "Your account has been deleted").

This permanently deletes the account and all of the student's learning
records. A screen recording of this exact flow is attached.

In the previous build the deletion entry point was nested inside the
"연동 계정" (Linked account) row, which is why it was not discoverable. It is
now a clearly labelled top-level row in Settings.
```

## 5. 심사 답변 초안 (Resolution Center)

```
Hello,

Thank you for the review. We have addressed both items.

GUIDELINE 5.1.1(v) — ACCOUNT DELETION

The feature existed in the previous build, but it was not discoverable: the
Settings screen is rendered from a design asset, and the deletion entry point
was nested inside the "Linked account" row, so the words "Delete account"
never appeared on screen.

In this build, "회원탈퇴" (Delete account) is a clearly labelled row at the
bottom of Settings. The full path is:

  Settings ("전체" tab) -> "회원탈퇴" -> "회원탈퇴" -> "탈퇴하기"
  -> "탈퇴가 완료되었어요" (deletion complete)

We have attached a screen recording of the complete flow, recorded on a
physical iPhone, starting from app launch and ending on the deletion
confirmation screen. The step-by-step path is also written in App Review
Information > Notes.

GUIDELINE 2.2 — PRE-RELEASE / LIMITED FEATURES

We reviewed the app for anything that could read as unfinished and fixed the
following in this build:

  - Removed a "Word list" tab from the bottom navigation. It was visible and
    tappable but only showed a "coming soon" message.
  - Fixed a navigation tab that did nothing when tapped on the class-join
    screen.
  - Replaced an on-screen line that referred to the removed "Word list"
    feature.
  - We also enriched the demo class so vocabulary, grammar, and reading
    assignments are present. Demo login now auto-completes the first
    homework at about 70% correct, so Review already shows wrong-answer
    analysis. The teacher then sends those missed items to Gym as a retry
    set. In the previous build the demo class only contained vocabulary
    sets, and Review/Gym were empty because the account had no history.

If any other specific screen or feature led to the 2.2 determination, we would
be grateful if you could tell us which one, so we can address it precisely
rather than guess.

Thank you for your time.
```

**주의:** 위 답변의 「we also enriched the demo class」 문장은 **3-(a)를 실제로 해 둔 뒤에만** 보낼 것.
안 하고 보내면 사실과 다르다.

## 6. 영상 촬영 순서 (실물 아이폰 화면 녹화)

Apple이 요구한 그대로, **끊지 말고 한 번에** 찍는다.

1. 홈 화면에서 **앱을 새로 실행** (이미 로그인돼 있으면 먼저 로그아웃하거나 재설치)
2. 로그인 화면에서 **「심사용 데모 로그인」** 탭 → 비밀번호 **1234** 입력 → 확인
   (데모 계정 준비에 **10~20초** 걸릴 수 있음 — 끊지 말고 기다린다)
3. 과제 맵(성 화면)이 뜨는 것까지 보여 준다 — *"앱이 정상 동작한다"*를 같이 증명하는 구간이다
4. 하단 내비 맨 오른쪽 **「전체」** 탭 → 설정 진입
5. 설정을 **맨 아래까지 스크롤** → 빨간 **「회원탈퇴」** 글자가 보이는 상태에서 1~2초 멈춘다
6. **「회원탈퇴」** 탭 → 시트가 열림
7. **「회원탈퇴」** 탭 → 「정말 탈퇴할까요?」 + 지워지는 항목 목록이 보이는 상태에서 1~2초 멈춘다
8. **「탈퇴하기」** 탭
9. **「탈퇴가 완료되었어요」** 화면에서 3초 이상 멈추고 종료

**촬영 전 확인:** 데모 계정으로 탈퇴하면 그 계정은 실제로 사라진다.
다음 심사자가 「심사용 데모 로그인」을 누르면 새 익명 계정이 만들어지고
`AB6NKL`로 자동 재가입되므로 **다시 쓸 수 있다** — 촬영 후 한 번 눌러서 확인해 둘 것.

## 7. 제출 전 체크리스트

- [ ] 데모 반에 문법·본문 과제 추가
- [ ] 심사용 데모 로그인 1회 → 첫 숙제 70% 자동 기록 확인 → 교사 웹에서 오답 재출제 (3-a)
- [ ] 구글 OAuth 게시 상태 `프로덕션` 확인 (3-b)
- [ ] Apple Developer Program 멤버십 갱신 (3-c, 만료 2026-10-01)
- [ ] 실물 기기에서 회원탈퇴 흐름 1회 실행 + 데모 로그인 재진입 확인
- [ ] 실물 기기에서 소리 재생 확인 (TTS를 버킷으로 옮긴 뒤 미검증)
- [ ] 하단 내비가 4칸으로 나오는지 확인
- [ ] 영상 촬영 → App Review Information > Notes 에 첨부
- [ ] Review Notes 텍스트(4장) 붙여넣기
