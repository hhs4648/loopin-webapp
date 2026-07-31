import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let client: SupabaseClient | null = null

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
        detectSessionInUrl: false,
        storageKey: 'loopin-student-supabase-auth',
      },
    })
  }
  return client
}
