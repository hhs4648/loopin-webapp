import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

/**
 * 인증 토큰이 저장되는 localStorage 키. `createClient`의 `storageKey`와 **같아야** 한다.
 * 세션 복원이 실패했을 때 「원래 로그인한 적이 없다」와 「토큰은 있는데 지금 못 살렸다」를
 * 가르는 데 쓴다 — 후자에서 새 익명 사용자를 만들면 그 학생의 반 등록이 통째로 날아간다.
 */
export const AUTH_STORAGE_KEY = 'haksup-student-supabase-auth'

/** 이 기기에 이미 로그인 흔적(토큰)이 남아 있는지 */
export function hasStoredAuthToken(): boolean {
  try {
    return localStorage.getItem(AUTH_STORAGE_KEY) != null
  } catch {
    return false
  }
}

export function getSupabaseEnv(): {
  url: string
  anonKey: string
} | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim()
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()
  if (!url || !anonKey) return null
  return { url, anonKey }
}

export function isSyncEnabled(): boolean {
  return getSupabaseEnv() != null
}

export function getSupabase(): SupabaseClient | null {
  const env = getSupabaseEnv()
  if (!env) return null
  if (!client) {
    client = createClient(env.url, env.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        /*
          OAuth로 돌아올 때 URL에 붙어 오는 `?code=`를 세션으로 바꿔야 한다.
          예전엔 익명 로그인만 써서 필요가 없었다(2026-08-11 소셜 로그인 도입).
        */
        detectSessionInUrl: true,
        flowType: 'pkce',
        storageKey: AUTH_STORAGE_KEY,
      },
    })
  }
  return client
}
