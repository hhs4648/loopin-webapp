import {
  NATIVE_AUTH_REDIRECT_URL,
  isAuthDeepLink,
  isNativeApp,
  readDeepLinkParams,
} from '../native'
import { getSupabase } from './supabase-client'

/**
 * **앱 안에서의 소셜 로그인.**
 *
 * 웹과 달리 앱에서는 WebView를 provider로 보내면 안 된다. 구글은 임베디드
 * WebView에서 오는 로그인을 `disallowed_useragent`로 막고, 성공한다 해도 돌아올
 * 주소(`capacitor://localhost`)가 Supabase 허용 목록에 없어 **웹앱으로 튕긴다.**
 *
 * 그래서 앱에서는 이렇게 간다:
 * 1. `skipBrowserRedirect`로 **주소만 받아** 시스템 브라우저(iOS SFSafariViewController,
 *    Android Chrome Custom Tabs)로 연다.
 * 2. provider → Supabase를 거쳐 `haksup://auth/callback?code=…`로 **앱이 다시 열린다.**
 * 3. 그 `code`를 여기서 세션으로 바꾼다(`exchangeCodeForSession`).
 *
 * PKCE의 code verifier는 WebView의 localStorage에 있다. 로그인을 시작한 곳과
 * 코드를 교환하는 곳이 **같은 WebView**여야 하는 이유다 — 그래서 브라우저 쪽이 아니라
 * 딥링크로 돌아와 앱에서 교환한다.
 */

/**
 * 시스템 브라우저로 OAuth 주소를 연다.
 *
 * `presentationStyle`은 일부러 안 준다 — 기본값(전체 화면)이라 아이패드에서도
 * 로그인 페이지가 팝오버에 눌려 찌그러지지 않고, 취소는 상단 `완료`로 한다.
 */
export async function openAuthBrowser(url: string): Promise<void> {
  const { Browser } = await import('@capacitor/browser')
  await Browser.open({ url })
}

/** 로그인이 끝났거나 실패했을 때 브라우저 시트를 닫는다 */
export async function closeAuthBrowser(): Promise<void> {
  try {
    const { Browser } = await import('@capacitor/browser')
    await Browser.close()
  } catch {
    // 이미 닫혀 있으면 신경 쓸 것 없다
  }
}

/**
 * 브라우저 시트가 닫히면 한 번 알려 준다 — **취소했을 때 버튼을 되살리려고** 쓴다.
 * 이게 없으면 학생이 로그인 창을 닫았을 때 버튼이 눌린 채로 굳는다.
 */
export async function onceAuthBrowserClosed(
  callback: () => void,
): Promise<void> {
  if (!isNativeApp()) return
  const { Browser } = await import('@capacitor/browser')
  const handle = await Browser.addListener('browserFinished', () => {
    void handle.remove()
    callback()
  })
}

export type DeepLinkAuthResult =
  | { ok: true }
  | { ok: false; message: string }

/**
 * 딥링크로 돌아온 로그인을 마무리한다.
 *
 * 성공하면 세션이 생기고, 나머지(프로필 조회·온보딩 여부)는 `/auth/callback`
 * 화면이 이어서 처리한다 — 웹과 같은 길을 쓰려고 일부러 나눠 뒀다.
 */
export async function completeDeepLinkAuth(
  url: string,
): Promise<DeepLinkAuthResult> {
  const params = readDeepLinkParams(url)

  // provider나 Supabase가 거절한 경우 — 학생이 취소한 것도 여기로 온다
  const errorDescription =
    params.get('error_description') ?? params.get('error')
  if (errorDescription) {
    return { ok: false, message: errorDescription }
  }

  const code = params.get('code')
  if (!code) {
    return { ok: false, message: '로그인 코드가 오지 않았어요' }
  }

  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: '서버 연결이 없어요' }
  }

  /*
    `sb_flow_id`가 함께 오면 그 흐름의 verifier를 콕 집어 쓴다. 없으면 마지막 것을
    쓰는데, 로그인을 두 번 눌러 두 흐름이 겹치면 엉뚱한 verifier로 **일회용 코드를
    태워 버린다.** 붙어 오지 않는 설정이면 이 값은 그냥 없다.
  */
  const flowId = params.get('sb_flow_id')
  const { error } = await supabase.auth.exchangeCodeForSession(
    code,
    flowId ? { flowId } : undefined,
  )
  if (error) {
    return { ok: false, message: error.message }
  }
  return { ok: true }
}

/**
 * 앱이 켜지자마자 도착한 딥링크.
 *
 * 로그인 도중 앱이 메모리에서 내려가면 `appUrlOpen`이 **리스너를 붙이기 전에**
 * 지나가 버린다. 그 경우 시작 주소로 남아 있으니 한 번 확인한다.
 */
export async function takeAuthLaunchUrl(): Promise<string | null> {
  if (!isNativeApp()) return null
  try {
    const { App } = await import('@capacitor/app')
    const launch = await App.getLaunchUrl()
    const url = launch?.url
    return url && isAuthDeepLink(url) ? url : null
  } catch {
    return null
  }
}

/** 앱이 떠 있는 동안 도착하는 딥링크를 받는다. 정리 함수를 돌려준다. */
export async function listenAuthDeepLink(
  handler: (url: string) => void,
): Promise<() => void> {
  const { App } = await import('@capacitor/app')
  const handle = await App.addListener('appUrlOpen', ({ url }) => {
    if (isAuthDeepLink(url)) handler(url)
  })
  return () => void handle.remove()
}

export { NATIVE_AUTH_REDIRECT_URL }
