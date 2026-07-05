export type MemberType = 'student' | 'teacher'
export type SocialProvider = 'apple' | 'kakao'

export interface AuthUser {
  id: string
  provider: SocialProvider
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

export function completeOnboarding(user: AuthUser): AuthUser {
  const next: AuthUser = {
    ...user,
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
