import { getSupabase, isSyncEnabled } from './supabase-client'
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

/** 로그인을 마치고 돌아올 자리 */
export function socialRedirectUrl(): string {
  return `${window.location.origin}/auth/callback`
}

export type SocialLoginResult =
  | { ok: true }
  | { ok: false; message: string }

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
 * OAuth 시작. 성공하면 **이 함수는 돌아오지 않는다** — 브라우저가 provider로 이동한다.
 * 돌아올 때는 `/auth/callback`이 받는다.
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

  const { data: sessionData } = await supabase.auth.getSession()
  const current = sessionData.session?.user
  const redirectTo = socialRedirectUrl()

  /*
    익명으로 이미 뭔가 하고 있었다면 **그 계정에 붙인다.**
    새로 로그인해 버리면 uid가 바뀌어서 지금까지 푼 기록이 전부 남의 것이 된다.
    (대시보드에서 Manual Linking을 켜야 동작한다 — 꺼져 있으면 아래 폴백을 탄다.)
  */
  if (current?.is_anonymous) {
    const { error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo },
    })
    if (!error) return { ok: true }

    if (isProviderNotConfigured(error.message)) {
      return { ok: false, message: notConfiguredMessage(provider) }
    }
    // Manual Linking이 꺼져 있으면 그냥 로그인으로 간다.
    // 익명 기록은 못 잇지만, 로그인 자체를 막는 것보다는 낫다.
    console.warn('[auth] link identity failed, falling back', error.message)
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo },
  })
  if (error) {
    if (isProviderNotConfigured(error.message)) {
      return { ok: false, message: notConfiguredMessage(provider) }
    }
    console.warn('[auth] oauth start failed', error.message)
    return { ok: false, message: '로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.' }
  }
  return { ok: true }
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
