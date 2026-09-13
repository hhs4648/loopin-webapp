# App Store 재심사 회신 · Notes (2026-09-11 거절 대응) — 최종

거절: **Guideline 4 (SIWA)**, **5.1.1(v) 교사 탈퇴**, **2.1(b) 비즈니스 모델**.

- Resolution Center → 「1) 회신」  
- App Review Information → Notes → 「2) Notes」+ 실기기 탈퇴 영상  
- 서명 `[이름]`만 본인으로  
- 선생님 웹 **구체 URL은 넣지 않음** (물어보면 그때)

---

## 1) Resolution Center 회신 (붙여넣기)

약 **3850자** (4000자 제한용 압축본). [이름]을 본인 이름으로 바꾸세요.

\Hello,

Thank you for the clear feedback on version 1.1. We updated the app and answer each item below.

GUIDELINE 4 — SIGN IN WITH APPLE

Thank you for flagging name/email re-entry after Sign in with Apple. Based on your feedback:
- We use Apple's display name automatically.
- We removed the onboarding name step for Student and Teacher.
- We never ask for email after Sign in with Apple.
- If no usable name is provided, we use a default label ("학생" / "선생님"); users can edit it later in Settings.

Other fields Apple does not provide remain (Student: birth date/grade; Teacher: school name). These are not name/email re-collection. Teacher school name is for our separate teacher web (class/assignment tools) on a different domain; the same account is shared with this iOS app. Reviewers do not need to open that website—all review flows work inside the app.

GUIDELINE 5.1.1(v) — TEACHER ACCOUNT DELETION

Thank you for requiring in-app teacher deletion and a physical-device recording. Based on your feedback, teacher deletion is now the same permanent in-app path as students (not temporary disable; no website/phone/email required).

Teachers can also use this iOS app to try the student learning experience. After choosing Teacher and finishing onboarding, they enter the same home as students (invite/class map/Settings). Class management stays on the separate teacher web (different domain; shared account). Deletion uses Settings → "회원탈퇴".

Path (Student = Teacher):
1) Sign in (or Sign in with Apple → Teacher/Student → finish onboarding). Or use Demo login below.
2) Tap "전체" (rightmost bottom tab) → Settings.
3) Scroll down → tap "회원탈퇴" (Delete account, in red).
4) Confirm "회원탈퇴" → "탈퇴하기".
5) "탈퇴가 완료되었어요" (account deleted).

A physical iPhone screen recording of this flow is attached in App Review Information > Notes.

GUIDELINE 2.1(b) — BUSINESS MODEL

Thank you for the business-model questions. Answers for this binary:

1) Users of paid subscriptions/features/services in the app?
None—there are no paid subscriptions, features, or services in this iOS binary. End users are middle-school students doing teacher-assigned practice, and teachers who may sign in to try the same learning experience.

2) Where can users purchase those?
Nowhere in the app. This version does not sell subscriptions or digital features via the App Store or any in-app storefront. This binary does not unlock paid content.

3) Previously purchased subscriptions/features accessible in the app?
None. No App Store subscription/IAP restore. Class access is free enrollment via teacher invite code (or Demo login).

4) Paid content/subscriptions/features unlocked without IAP?
None. Nothing paid is unlocked in this binary.

5) Fee to create a teacher account?
No. Free in the app. The same account can be used on our separate teacher web (different domain) with no fee in this app.

6) Where do invite codes come from? Must users pay?
Teachers create a class on our separate teacher web (different domain; shared account) and share the code. Invite codes are free; students do not pay for them in the app.

DEMO ACCESS
- Tap "심사용 데모 로그인" (Demo login) → password 1234 → wait 10–20 seconds (do not force-quit). Auto-enrolls in the demo class.
- Optional real flow: Sign in with Apple → onboarding → invite code AB6NKL.

AB6NKL is a real invite code for a class we operate on our connected teacher web (different domain; shared accounts) for App Review/demo. It is free and does not unlock paid content.

SUMMARY
- G4: no name/email re-entry after Sign in with Apple.
- G5.1.1(v): teacher = student permanent in-app deletion; recording attached.
- G2.1(b): no IAP/paid unlocks in this binary; invite codes free; AB6NKL from our connected teacher-web class.

We are grateful for your guidance and hope this resolves the issues.

Thank you,
[이름]
Haksup / 학습
`

---

## 2) App Review Information → Notes (붙여넣기)

```
Thank you for reviewing Haksup. Notes for this submission:

DEMO ACCOUNT (recommended)

1. Launch the app.
2. On the sign-in screen, tap “심사용 데모 로그인” (Demo login) at the top.
3. Enter password: 1234
4. Wait about 10–20 seconds while the demo account is prepared.
   Please do not force-quit during this step.

This signs you into a student account already enrolled in the demo class.
No social sign-in and no manual invite code are needed.
You should see the assignment map and can open learning tasks.

OPTIONAL REAL FLOW + INVITE CODE AB6NKL

  • Tap “Apple로 시작하기” (Sign in with Apple)
  • Choose Student or Teacher and finish onboarding
  • When asked for a class invite code, enter: AB6NKL

About AB6NKL:
AB6NKL is a real invite code for a class that we operate on our connected
teacher web (separate domain from this iOS app; same shared account system).
It is one of the invite codes belonging to a class we manage there for
App Review / demo. Joining with AB6NKL is free and does not unlock paid
content.

Username/password fields in App Store Connect: use the in-app Demo login
button + password 1234 (there is no separate username/password login form).

CHANGES AFTER YOUR FEEDBACK — SIGN IN WITH APPLE (Guideline 4)

After Sign in with Apple, the app does not ask again for name or email.
Onboarding has no name step for Student or Teacher.
Apple’s display name is used when available; otherwise a default label is used
(“학생” / “선생님”). Display name can be edited later in Settings.

Teacher onboarding may still ask for school name (not name/email). That field
is for school affiliation used with our separate teacher web tools (different
domain; same shared account). Reviewers do not need to open any website.

TEACHERS IN THIS APP

Teachers can use this iOS app to try / preview the student learning experience.
Class / assignment management is primarily on the separate teacher web
(different domain). The same account is shared between the web and this app.

CHANGES AFTER YOUR FEEDBACK — ACCOUNT DELETION (Guideline 5.1.1(v))

Teacher and Student accounts now use the SAME in-app deletion path
(permanent deletion, not temporary disable; no website / phone / email required):

  1. Bottom navigation → “전체” (rightmost tab) → Settings
  2. Scroll to the bottom → tap “회원탈퇴” (red, “Delete account”)
  3. Tap “회원탈퇴”, then “탈퇴하기”
  4. Confirmation screen: “탈퇴가 완료되었어요”

A screen recording on a physical iPhone is attached, showing sign-in /
navigation to deletion / complete confirmation.
Preferred recording path: Sign in with Apple → choose Teacher → finish
onboarding → “전체” → “회원탈퇴” → confirmation.

BUSINESS MODEL (Guideline 2.1) — THIS VERSION

• No In-App Purchase in this binary.
• Free app access via teacher invite code (or Demo login).
• Invite codes are free; students do not pay for them in the app.
• AB6NKL = invite code from a class we run on the connected teacher web
  for review/demo (different domain; shared account).
• Any school / academy commercial arrangements (if any) are offline B2B/B2G
  contracts outside the App Store and are not unlocked through this app.
• Not limited to a single company’s employees.

PURPOSE / CONTENT

Haksup is a Korean middle-school English exam-prep learning app.
Teachers assign practice (mainly via teacher web); students complete tasks in
this app; teachers may also try the app experience themselves.
No public student-to-student UGC feed/chat. Peer report/block is N/A.

Thank you again for the feedback.
```

---

## 3) 한글 해석 (검토용)

### 톤
- 피드백에 **감사** → 지적하신 대로 **이렇게 바꿨다** → 상세 답변 → 다시 감사.

### Guideline 4
감사 + 이름/이메일 재입력이 문제였음을 인정 + 이름 단계 제거·이메일 안 받음·기본 표시명.  
생년월일·학년·학교명은 Apple이 안 주는 정보(이름 재입력 아님).  
학교명 = 다른 도메인 선생님 웹 + 계정 공유. 웹 열 필요 없음.

### Guideline 5.1.1
감사 + 교사도 영구 탈퇴·실기기 영상 요청을 반영.  
선생님도 앱으로 학생 경험 시험 가능. 출제·반은 다른 도메인 웹(계정 공유).  
탈퇴는 학생과 동일: 전체 → 회원탈퇴 → 확인 → 완료. 영상 첨부.

### Guideline 2.1
감사 + Q1~6 상세 답변 (IAP 없음, 구매처 없음, 복원 없음, IAP 없는 유료 잠금 없음, 선생님 가입 무료, 초대코드 무료).

### 데모 / AB6NKL
- 데모: 「심사용 데모 로그인」+ `1234`  
- `AB6NKL` = **연결된 선생님용 웹에서 우리가 운영 중인 반의 초대코드 중 하나** (심사용/데모). 무료, 유료 잠금 아님.

### Notes
같은 내용을 조작 안내 중심으로 짧게. 변경 사항·AB6NKL·탈퇴 경로·영상.

### 탈퇴 영상 권장 순서
Apple → 선생님 → 온보딩 → 전체 → 회원탈퇴 → 완료 (한 테이크, 실물 iPhone).
```
