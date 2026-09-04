import { NATIVE_AUTH_REDIRECT_URL, isNativeApp } from '../native'
import { closeAuthBrowser, openAuthBrowser } from './native-auth'
import { getSupabase, getSupabaseEnv, isSyncEnabled } from './supabase-client'
import type { SocialProvider } from '../auth'

/**
 * 소셜 로그인 — **진짜 OAuth**.
 *
 * 예전에는 버튼을 누르면 `${provider}_${Date.now()}`로 가짜 사용자를 만들어 로컬에
 * 저장하는 게 전부였다. 서버 쪽 신원은 별개로 `signInAnonymously()`라, **그 기기의
 * 토큰이 곧 계정**이었다. 앱을 지우거나 기기를 바꾸면 그 학생의 풀이 기록·반 등록이
 * 통째로 사라지고 되찾을 방법이 없었다.
 *
 * 핵심은 **잇는다**는 것이다. 이미 익명으로 쌓인 기록이 있으면 새 계정을 만들지 않고
 * `linkIdentity`로 그 익명 사용자에 소셜 신원을 **붙인다.** uid가 그대로라
 * `attempts`·`answers`·`enrollments`가 전부 따라온다. 로그인 전에 이미 초대코드를
 * 넣고 과제를 푼 학생이 있어도 잃는 게 없다.
 */

/**
 * 로그인을 마치고 돌아올 자리.
 *
 * **앱과 웹이 다르다.** 앱 WebView의 주소는 `capacitor://localhost`(iOS)·
 * `http://localhost`(Android)인데, 이건 Supabase `Redirect URLs`에 없는 주소라
 * 그대로 넘기면 **Site URL(`https://loopin-webapp.vercel.app`)로 보내 버린다** —
 * 앱에서 로그인을 눌렀는데 웹앱이 열리던 원인이 이것이다 (2026-09-04 확인).
 * 앱에서는 우리 스킴으로 돌아온다.
 */
export function socialRedirectUrl(): string {
  return isNativeApp()
    ? NATIVE_AUTH_REDIRECT_URL
    : `${window.location.origin}/auth/callback`
}

/*
  **카카오 이메일 동의항목 — 여기서 고치려 하지 말 것.**

  Supabase는 카카오에 `account_email profile_image profile_nickname`을 항상 요청한다.
  `account_email`은 비즈 앱에서만 쓸 수 있어서, 그냥 두면 카카오가
  `KOE205 잘못된 요청`으로 로그인 화면조차 안 띄운다.

  `signInWithOAuth({ options: { scopes } })`로 좁혀 보려 했지만 **소용없다** —
  Supabase는 넘긴 scope를 기본값에 **덧붙이기만 한다.** 실제로 시도했더니
  `scope=account_email profile_image profile_nickname profile_nickname`이 됐다
  (2026-08-27 실측). 즉 클라이언트에서는 뺄 방법이 없다.

  해결은 카카오 쪽에서 한다: 카카오 개발자 콘솔 `비즈니스 인증`에서
  **개인 개발자 자격으로 비즈 앱 전환**(사업자등록번호 없이 본인인증으로 가능)한 뒤,
  `동의항목`에서 카카오계정(이메일)을 켠다.
  참고: https://github.com/supabase/supabase/issues/36878
*/

export type SocialLoginResult =
  /** `native`면 시스템 브라우저가 떠 있는 상태다 — 화면은 그게 닫힐 때까지 기다린다 */
  | { ok: true; native: boolean }
  | { ok: false; message: string }

/**
 * **대시보드에 켜져 있는 provider만 시도한다.**
 *
 * `signInWithOAuth()`는 provider가 꺼져 있어도 **에러를 돌려주지 않는다** — 그냥
 * 브라우저를 Supabase authorize URL로 보내 버리고, 학생은 거기서
 * `{"code":400,...,"msg":"Unsupported provider: provider is not enabled"}` 라는
 * 날것의 JSON을 마주한다. 돌아올 버튼도 없다.
 * (2026-08-27 프로덕션에서 구글 버튼을 눌러 실제로 확인했다.)
 *
 * 그래서 나가기 전에 공개 설정 엔드포인트로 한 번 확인한다. 확인 자체가 실패하면
 * `null`을 주고 **그냥 진행한다** — 점검 실패로 로그인을 막는 게 더 나쁘다.
 */
let enabledProviders: Set<string> | null = null

async function isProviderEnabled(
  provider: SocialProvider,
): Promise<boolean | null> {
  if (enabledProviders) return enabledProviders.has(provider)
  const env = getSupabaseEnv()
  if (!env) return null
  try {
    const res = await fetch(`${env.url}/auth/v1/settings`, {
      headers: { apikey: env.anonKey },
    })
    if (!res.ok) return null
    const json = (await res.json()) as { external?: Record<string, boolean> }
    if (!json.external) return null
    enabledProviders = new Set(
      Object.entries(json.external)
        .filter(([, on]) => on === true)
        .map(([name]) => name),
    )
    return enabledProviders.has(provider)
  } catch {
    return null
  }
}

/** Supabase 대시보드에 provider가 안 켜져 있을 때 나오는 응답들 */
function isProviderNotConfigured(message: string): boolean {
  const m = message.toLowerCase()
  return (
    m.includes('provider is not enabled') ||
    m.includes('unsupported provider') ||
    m.includes('validation_failed')
  )
}

/**
 * OAuth 시작.
 *
 * **웹**이면 이 함수는 돌아오지 않는다 — WebView가 provider로 이동하고,
 * 돌아올 때 `/auth/callback`이 받는다.
 * **앱**이면 주소만 받아 시스템 브라우저를 띄우고 바로 돌아온다. 로그인이 끝나면
 * `haksup://auth/callback` 딥링크로 앱이 다시 열리고 `NativeAuthDeepLink`가 받는다.
 */
export async function startSocialLogin(
  provider: SocialProvider,
): Promise<SocialLoginResult> {
  if (!isSyncEnabled()) {
    return { ok: false, message: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.' }
  }
  const supabase = getSupabase()
  if (!supabase) {
    return { ok: false, message: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.' }
  }

  // 꺼져 있는 게 확실할 때만 막는다 (확인 실패는 통과)
  if ((await isProviderEnabled(provider)) === false) {
    return { ok: false, message: notConfiguredMessage(provider) }
  }

  const { data: sessionData } = await supabase.auth.getSession()
  const current = sessionData.session?.user
  const native = isNativeApp()
  /*
    앱에서는 **Supabase가 WebView를 옮기지 못하게 막는다.** 그대로 두면 앱 껍데기가
    provider 페이지로 바뀌어 돌아올 길이 없어지고, 구글은 임베디드 WebView라며
    `disallowed_useragent`로 아예 거절한다. 주소만 받아 시스템 브라우저로 연다.
  */
  const options = { redirectTo: socialRedirectUrl(), skipBrowserRedirect: native }

  /*
    익명으로 이미 뭔가 하고 있었다면 **그 계정에 붙인다.**
    새로 로그인해 버리면 uid가 바뀌어서 지금까지 푼 기록이 전부 남의 것이 된다.
    (대시보드에서 Manual Linking을 켜야 동작한다 — 꺼져 있으면 아래 폴백을 탄다.)
  */
  if (current?.is_anonymous) {
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options,
    })
    if (!error) return handOffToBrowser(native, data?.url)

    if (isProviderNotConfigured(error.message)) {
      return { ok: false, message: notConfiguredMessage(provider) }
    }
    // Manual Linking이 꺼져 있으면 그냥 로그인으로 간다.
    // 익명 기록은 못 잇지만, 로그인 자체를 막는 것보다는 낫다.
    console.warn('[auth] link identity failed, falling back', error.message)
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options,
  })
  if (error) {
    if (isProviderNotConfigured(error.message)) {
      return { ok: false, message: notConfiguredMessage(provider) }
    }
    console.warn('[auth] oauth start failed', error.message)
    return { ok: false, message: '로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
  return handOffToBrowser(native, data?.url)
}

/** 앱이면 시스템 브라우저로 넘기고, 웹이면 이미 이동 중이라 할 일이 없다 */
async function handOffToBrowser(
  native: boolean,
  url: string | null | undefined,
): Promise<SocialLoginResult> {
  if (!native) return { ok: true, native: false }
  if (!url) {
    return { ok: false, message: '로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
  try {
    await openAuthBrowser(url)
  } catch (error) {
    console.warn('[auth] failed to open auth browser', error)
    await closeAuthBrowser()
    return { ok: false, message: '로그인 창을 열지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
  return { ok: true, native: true }
}

const PROVIDER_LABEL: Record<SocialProvider, string> = {
  kakao: '카카오',
  apple: 'Apple',
  google: '구글',
}

function notConfiguredMessage(provider: SocialProvider): string {
  return `${PROVIDER_LABEL[provider]} 로그인이 아직 준비되지 않았어요.`
}

export type SignedInUser = {
  id: string
  /** 소셜 신원이 붙어 있으면 그 provider — 아직 익명이면 null */
  provider: SocialProvider | null
  /** 아직 소셜 계정이 안 붙은 임시 신원 */
  isAnonymous: boolean
}

/** 지금 로그인된 사람. 세션이 없으면 null (익명 세션을 새로 만들지 않는다) */
export async function getSignedInUser(): Promise<SignedInUser | null> {
  if (!isSyncEnabled()) return null
  const supabase = getSupabase()
  if (!supabase) return null

  const { data } = await supabase.auth.getSession()
  const user = data.session?.user
  if (!user) return null

  const identity = user.identities?.find(
    (item) => item.provider !== 'anonymous',
  )
  const provider = (identity?.provider ?? null) as SocialProvider | null
  return {
    id: user.id,
    provider: provider && provider in PROVIDER_LABEL ? provider : null,
    isAnonymous: user.is_anonymous === true,
  }
}

/**
 * 내 프로필 한 줄. **기기를 바꿔도 온보딩을 건너뛰게 하는 근거**다.
 * 행이 없으면 아직 온보딩 전 — null.
 */
export async function fetchOwnProfile(
  userId: string,
): Promise<{ role: string | null; displayName: string | null } | null> {
  const supabase = getSupabase()
  if (!supabase) return null
  const { data, error } = await supabase
    .from('profiles')
    .select('role, display_name')
    .eq('id', userId)
    .maybeSingle()
  if (error || !data) return null
  return {
    role: (data.role as string | null) ?? null,
    displayName: (data.display_name as string | null) ?? null,
  }
}

export async function signOutSocial(): Promise<void> {
  const supabase = getSupabase()
  if (!supabase) return
  await supabase.auth.signOut()
}
