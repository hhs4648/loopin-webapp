export type MemberType = 'student' | 'teacher'
/** 소셜 로그인 — 구글은 UI·타입 준비, 로그인 버튼은 추후 연결 */
export type SocialProvider = 'apple' | 'kakao' | 'google'

export interface AuthUser {
  id: string
  provider: SocialProvider
  /** 온보딩에서 입력한 이름(닉네임) */
  displayName?: string
  memberType?: MemberType
  onboardingCompleted: boolean
}

const AUTH_KEY = 'loopin_auth'

export function getStoredAuth(): AuthUser | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

export function saveAuth(user: AuthUser): void {
  localStorage.setItem(AUTH_KEY, JSON.stringify(user))
}

export function clearAuth(): void {
  localStorage.removeItem(AUTH_KEY)
}

export function createMockUser(provider: SocialProvider): AuthUser {
  return {
    id: `${provider}_${Date.now()}`,
    provider,
    onboardingCompleted: false,
  }
}

export function completeMemberType(
  user: AuthUser,
  memberType: MemberType,
): AuthUser {
  const next: AuthUser = {
    ...user,
    memberType,
  }
  saveAuth(next)
  return next
}

export function resetMemberType(user: AuthUser): AuthUser {
  const { memberType: _memberType, ...rest } = user
  const next: AuthUser = {
    ...rest,
    onboardingCompleted: false,
  }
  saveAuth(next)
  return next
}

export function completeOnboarding(
  user: AuthUser,
  extras?: { displayName?: string },
): AuthUser {
  const name = extras?.displayName?.trim()
  const next: AuthUser = {
    ...user,
    ...(name ? { displayName: name } : {}),
    onboardingCompleted: true,
  }
  saveAuth(next)
  return next
}

export function getPostAuthPath(user: AuthUser): string {
  if (!user.memberType) {
    return '/onboarding/member-type'
  }

  if (!user.onboardingCompleted) {
    return user.memberType === 'student'
      ? '/onboarding/student'
      : '/onboarding/teacher'
  }

  return user.memberType === 'student' ? '/student/home' : '/teacher/home'
}

/** 설정·프로필에 쓸 표시 이름 */
export function resolveDisplayName(
  user: AuthUser | null,
  profileName?: string | null,
): string {
  const fromAuth = user?.displayName?.trim()
  if (fromAuth) return fromAuth
  const fromProfile = profileName?.trim()
  if (fromProfile) return fromProfile
  return '학생'
}

export function socialProviderLabel(provider: SocialProvider): string {
  if (provider === 'kakao') return '카카오'
  if (provider === 'apple') return 'Apple'
  return 'Google'
}
