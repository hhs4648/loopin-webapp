export type MemberType = 'student' | 'teacher'
/** 소셜 로그인 — Apple / 카카오 / 구글 */
export type SocialProvider = 'apple' | 'kakao' | 'google'

export interface AuthUser {
  id: string
  provider: SocialProvider
  /** 온보딩에서 입력한 이름(닉네임) */
  displayName?: string
  /** 선생님 온보딩에서 입력한 학교명 */
  schoolName?: string
  memberType?: MemberType
  onboardingCompleted: boolean
}

const AUTH_KEY = 'haksup_auth'

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

/**
 * 로그인된 Supabase 사용자를 로컬 표현으로.
 *
 * `id`는 **Supabase uid**다. 예전에는 `${provider}_${Date.now()}`였는데, 그건
 * 계정이 아니라 타임스탬프라 로그인할 때마다 다른 사람이 됐다. uid로 바뀌면서
 * 같은 계정으로 다시 들어오면 같은 사람으로 이어진다.
 */
/**
 * **개발용 임시 로그인.**
 *
 * 소셜 로그인 provider가 대시보드에 등록되기 전까지는 앱에 들어갈 방법이 없어서,
 * 과제 풀이 흐름을 확인할 수가 없다. 그 동안만 쓰는 입구다.
 *
 * 서버 신원은 여전히 익명 세션(`ensureStudentSession`)이다 — 이 값은 **화면 이동과
 * 온보딩 상태를 위한 로컬 기록**일 뿐이고, 과제·답안 조회에는 쓰이지 않는다.
 * 그래서 초대코드를 넣으면 실제 반의 실제 과제가 그대로 내려온다.
 *
 * 노출 조건은 `isDevLoginAllowed()` 참고 — 배포본에는 나오지 않는다.
 */
export function createDevUser(): AuthUser {
  return { id: 'dev-local', provider: 'kakao', onboardingCompleted: false }
}

/**
 * 임시 로그인을 띄울지.
 *
 * 개발 서버(`npm run dev`)에서는 항상, 그 외에는 `VITE_ALLOW_DEV_LOGIN=true`일 때만.
 * 배포 설정에 그 값을 넣지 않으면 버튼 자체가 빌드에서 빠진다.
 * (`npm run preview`로 코드 분할까지 확인하려면 `.env.local`에 넣어 두면 된다.)
 */
export function isDevLoginAllowed(): boolean {
  return (
    import.meta.env.DEV || import.meta.env.VITE_ALLOW_DEV_LOGIN === 'true'
  )
}

export function createUserFromSession(
  id: string,
  provider: SocialProvider,
): AuthUser {
  return { id, provider, onboardingCompleted: false }
}

/**
 * 서버 프로필을 로컬 표현에 합친다 — **기기를 바꿔도 온보딩을 다시 안 하도록.**
 *
 * 이름·학년은 `profiles`에 uid로 저장돼 있다. 로그인만 되살리고 이걸 안 읽으면
 * 새 기기에서 이름부터 다시 입력하게 된다.
 */
export function mergeServerProfile(
  base: AuthUser,
  profile: { role?: string | null; displayName?: string | null } | null,
): AuthUser {
  if (!profile) return base
  const memberType: MemberType | undefined =
    profile.role === 'teacher'
      ? 'teacher'
      : profile.role === 'student'
        ? 'student'
        : base.memberType
  const displayName = profile.displayName ?? base.displayName
  const next: AuthUser = {
    ...base,
    ...(memberType ? { memberType } : {}),
    ...(displayName ? { displayName } : {}),
    // 프로필 행이 있다는 건 온보딩을 마쳤다는 뜻이다
    onboardingCompleted: Boolean(memberType && displayName),
  }
  saveAuth(next)
  return next
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
  extras?: { displayName?: string; schoolName?: string },
): AuthUser {
  const name = extras?.displayName?.trim()
  const school = extras?.schoolName?.trim()
  const next: AuthUser = {
    ...user,
    ...(name ? { displayName: name } : {}),
    ...(school ? { schoolName: school } : {}),
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
  if (provider === 'apple') return '애플'
  return '구글'
}
