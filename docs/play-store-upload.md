# Play 스토어 업로드 안내 (학생앱)

패키지명: `com.haksup.haksup_app`  
이번 AAB: `versionCode 9` / `versionName 1.1.0`

## 로컬에서 만든 산출물

| 파일 | 위치 |
|------|------|
| **올릴 AAB** | `android/app/build/outputs/bundle/release/app-release.aab` |
| 업로드 키 (.jks) | `C:\Users\user\.cursor\haksup-play-upload.jks` |
| 인증서 (.pem) | `C:\Users\user\.cursor\haksup-play-upload.pem` |
| 비밀번호 메모 | `C:\Users\user\.cursor\haksup-play-upload.pass.txt` |

> `.jks` / `.pass.txt` / `android/keystore.properties` 는 **커밋하지 마세요.**

## 서명 키 주의

기존 Play 앱에 이미 다른 업로드 키가 등록돼 있으면, **새 키로 서명한 AAB는 거절**됩니다.

1. Play Console → **설정** → **앱 무결성**
2. 예전 키를 쓸 수 없으면 **업로드 키 재설정**
3. `haksup-play-upload.pem` 제출 → 승인 대기
4. 승인 후 아래 AAB 업로드

예전 키 파일이 `C:\Users\user\.cursor\haksup-upload`(확장자 없음) 이고 비밀번호를 알면,  
`android/keystore.properties`의 `storeFile`만 그 경로로 바꾼 뒤 `bundleRelease`를 다시 하면 됩니다.

## Play Console에서 할 일

1. [Play Console](https://play.google.com/console) → 앱 선택
2. **스토어 등록정보**
   - 앱 이름: `학습` (옛 `Loopin`이면 변경)
   - 아이콘 512: `assets/play-store-icon-512.png`
   - 개인정보처리방침: `https://loopin-webapp.vercel.app/legal/privacy.html` (배포 URL 확인)
3. **앱 콘텐츠** (데이터 안전·연령 등) 미완이면 출시 불가 → 채우기
4. **테스트 → 내부 테스트 → 새 버전 만들기**
5. `app-release.aab` 업로드 → 출시 노트 → **검토 → 출시**

## 심사/테스트 Notes (복붙)

```text
[Demo access]
1. On the login screen, tap 「심사용 데모 로그인」.
2. Enter password: 1234
3. Wait about 10–20 seconds while the demo account is prepared (please do not force-quit).
4. The app signs in as a demo student and auto-joins the demo class (invite code AB6NKL — no need to enter it manually).
5. You will see the assignment map and can open learning tasks.

[Account deletion]
Settings → 회원탈퇴. After deletion, a confirmation screen appears (not a login-error screen).

[Purpose]
Haksup is a Korean middle-school English exam-prep app for students. Teachers assign practice; students complete tasks and progress syncs to the teacher.

[No public UGC]
There is no public student-to-student UGC. Content is teacher-assigned curriculum. Peer report/block is not applicable.

[Content rights]
Learning items are authored/assigned by teachers for enrolled classes (B2B/B2G education).

[Third-party services]
Supabase (auth/DB), Apple Sign In / Kakao / Google (login), Azure Neural TTS via Supabase Edge Function.

[Business model]
No in-app purchases. Free app. Students join a class with an invite code.
```

## 다시 AAB 만드는 명령

JDK **21** 필요 (Android Studio JBR 25는 Gradle과 안 맞음).

```powershell
cd C:\Users\user\.cursor\projects\loopin-webapp
$env:JAVA_HOME = "C:\Program Files\Microsoft\jdk-21.0.12.101-hotspot"
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path
$env:VITE_APP_REVIEW_DEMO="true"
$env:VITE_DEMO_INVITE_CODE="AB6NKL"
$env:VITE_DEMO_LOGIN_PASSWORD="1234"
npm run build
npx cap sync android
cd android
.\gradlew.bat bundleRelease
```

산출물: `android/app/build/outputs/bundle/release/app-release.aab`  
(복사본: `android/app/release/app-release.aab`)
