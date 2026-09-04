import { Capacitor } from '@capacitor/core'

/**
 * **앱(iOS/Android) 안인지, 브라우저인지.**
 *
 * 이 구분이 필요한 이유는 로그인 때문이다. 앱 안에서 WebView의 주소는
 * `capacitor://localhost`(iOS)·`http://localhost`(Android)라, 이걸 그대로
 * OAuth 돌아올 주소로 넘기면 Supabase가 허용 목록에 없다며 **Site URL로 보내 버린다**
 * — 그게 `https://loopin-webapp.vercel.app`이라, 학생은 앱에서 로그인을 눌렀는데
 * 웹앱에 도착한다. (2026-09-04 Supabase에 직접 물어 확인:
 * `/auth/v1/callback`에 잘못된 state를 주면 저 주소로 되돌린다.)
 */
export function isNativeApp(): boolean {
  try {
    return Capacitor.isNativePlatform()
  } catch {
    return false
  }
}

/**
 * 앱으로 돌아오는 딥링크 주소.
 *
 * iOS·Android의 번들 ID가 서로 다르므로(`com.haksup.haksupApp` /
 * `com.haksup.haksup_app`) **양쪽이 같이 쓰는 스킴 하나**를 둔다 — Supabase
 * `Redirect URLs`에도 이 한 줄만 넣으면 된다.
 *
 * 이 값을 바꾸면 **세 곳을 같이** 고쳐야 한다:
 * `android/app/src/main/AndroidManifest.xml`의 intent-filter,
 * `codemagic.yaml`의 Info.plist 주입 단계, Supabase 대시보드 Redirect URLs.
 */
export const NATIVE_AUTH_SCHEME = 'haksup'
export const NATIVE_AUTH_REDIRECT_URL = `${NATIVE_AUTH_SCHEME}://auth/callback`

/** 이 딥링크가 로그인 콜백인지 */
export function isAuthDeepLink(url: string): boolean {
  return url.startsWith(`${NATIVE_AUTH_SCHEME}://auth/callback`)
}

/**
 * 딥링크의 쿼리를 읽는다.
 *
 * `new URL()`에 기대지 않는다 — 커스텀 스킴은 브라우저마다 `pathname`·`search`를
 * 나누는 방식이 달라서, `?` 뒤를 직접 자르는 쪽이 확실하다.
 * Supabase는 `#` 뒤(implicit flow)가 아니라 `?code=`(PKCE)로 돌려준다.
 */
export function readDeepLinkParams(url: string): URLSearchParams {
  const queryStart = url.indexOf('?')
  if (queryStart < 0) return new URLSearchParams()
  return new URLSearchParams(url.slice(queryStart + 1).split('#')[0])
}
