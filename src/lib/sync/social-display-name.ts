/**
 * OAuth `user_metadata`에서 표시 이름을 꺼낸다.
 *
 * 온보딩에서는 이름을 **다시 받지 않는다**(Guideline 4 — Sign in with Apple).
 * 소셜이 준 값을 쓰고, 없거나 쓸 수 없으면 `학생`/`선생님` 기본값.
 * 설정에서 나중에 바꿀 수 있다.
 *
 * 길이·문자 규칙은 설정·옛 온보딩 SVG와 동일(최대 5자, 특수문자 제외).
 */

const NAME_MAX_LENGTH = 5

type Meta = Record<string, unknown>

function sanitizeName(value: string): string {
  return value
    .replace(/[^0-9a-zA-Z가-힣ㄱ-ㅎㅏ-ㅣ\s]/g, '')
    .slice(0, NAME_MAX_LENGTH)
    .trim()
}

/**
 * - Apple: 첫 로그인에만 `full_name` / `name`이 올 수 있음
 * - Google: 보통 `full_name` / `name`
 * - Kakao: 닉네임(`name` / `nickname` 등)
 */
export function extractSocialDisplayName(
  user: { user_metadata?: Meta | null } | null | undefined,
): string | null {
  const meta = user?.user_metadata
  if (!meta) return null

  const joinedGivenFamily = [meta.given_name, meta.family_name]
    .filter((part) => typeof part === 'string' && part.trim())
    .join(' ')

  const rawCandidates: unknown[] = [
    meta.full_name,
    meta.name,
    meta.given_name,
    meta.nickname,
    meta.preferred_username,
    joinedGivenFamily,
  ]

  for (const raw of rawCandidates) {
    if (typeof raw !== 'string') continue
    const cleaned = sanitizeName(raw.trim())
    if (cleaned.length > 0) return cleaned
  }

  return null
}

/** 저장된/소셜 이름이 표시용으로 쓸 만하면 true */
export function hasUsableDisplayName(name: string | null | undefined): boolean {
  return sanitizeName((name ?? '').trim()).length > 0
}

/**
 * 온보딩 완료 시 쓸 표시 이름.
 * 소셜·로컬에 있으면 그걸, 없으면 `fallback`(`학생` / `선생님`).
 */
export function resolveOnboardingDisplayName(
  storedName: string | null | undefined,
  fallback: string,
): string {
  const cleaned = sanitizeName((storedName ?? '').trim())
  return cleaned.length > 0 ? cleaned : fallback
}
