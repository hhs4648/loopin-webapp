/**
 * 브랜드 이름이 바뀌기 전(구 `loopin*`) 저장소 키를 새 키(`haksup*`)로 **한 번 옮긴다.**
 *
 * 학생 앱이 브라우저에 남기는 것은 로그인 토큰·활성 반·프로필 캐시·재도전 세션 등이다.
 * 키 이름만 바꾸고 옮기지 않으면 이미 쓰던 학생이 **로그아웃되고 초대코드를 다시**
 * 입력하게 된다(=이전에 고쳤던 그 증상). 그래서 이름을 바꾸는 대신 값을 그대로 넘긴다.
 *
 * 여기 남아 있는 `loopin` 문자열은 브랜드 흔적이 아니라 **옛 키를 찾기 위한 열쇠**다.
 * 사용자 기기에서 구 키가 모두 사라졌다고 판단되면(대략 한두 시즌 뒤) 이 파일과
 * `main.tsx`의 호출 한 줄을 지우면 된다.
 */
const LEGACY_PREFIX = 'loopin'
const CURRENT_PREFIX = 'haksup'

function migrateStore(store: Storage): void {
  // 순회 중에 키를 지우므로 목록을 먼저 뜬다
  const keys: string[] = []
  for (let i = 0; i < store.length; i += 1) {
    const key = store.key(i)
    if (key && key.startsWith(LEGACY_PREFIX)) keys.push(key)
  }

  for (const legacyKey of keys) {
    const nextKey = CURRENT_PREFIX + legacyKey.slice(LEGACY_PREFIX.length)
    try {
      const value = store.getItem(legacyKey)
      if (value == null) continue
      // 새 키에 이미 값이 있으면 그쪽이 최신이다 — 덮어쓰지 않는다
      if (store.getItem(nextKey) == null) store.setItem(nextKey, value)
      store.removeItem(legacyKey)
    } catch {
      /* 저장소가 꽉 찼거나 못 쓰는 환경 — 다음 실행에서 다시 시도한다 */
    }
  }
}

/**
 * **앱이 저장소를 처음 읽기 전에** 부를 것. `main.tsx`의 첫 줄에서 부른다.
 * Supabase 클라이언트가 토큰을 읽는 시점보다 먼저여야 로그인이 유지된다.
 */
export function migrateLegacyBrandStorage(): void {
  if (typeof window === 'undefined') return
  try {
    migrateStore(window.localStorage)
    migrateStore(window.sessionStorage)
  } catch {
    /* 저장소 접근 자체가 막힌 환경(시크릿 모드 등) — 조용히 넘어간다 */
  }
}
