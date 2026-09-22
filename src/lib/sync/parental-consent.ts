import { getSupabase, getSupabaseEnv, isSyncEnabled } from './supabase-client'
import { ensureStudentSession } from './student-api'

const FUNCTION_NAME = 'parental-consent-otp'

export type ParentalConsentSendResult =
  | {
      ok: true
      challengeToken: string
      expiresInSec: number
      /** DEV MODE일 때만 — 실서비스 응답에는 없음 */
      devCode?: string
    }
  | { ok: false; error: string }

export type ParentalConsentVerifyResult =
  | {
      ok: true
      consentToken: string
      phoneLast4: string
    }
  | { ok: false; error: string; challengeToken?: string }

/** 숫자만 남기고 010XXXXXXXX 형태로 맞춘다. 실패 시 null. */
export function normalizeKrMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (/^010\d{8}$/.test(digits)) return digits
  if (/^10\d{8}$/.test(digits)) return `0${digits}`
  return null
}

/** 입력 중 표시용 — 010-1234-5678 */
export function formatKrMobileInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`
}

async function accessToken(): Promise<string | null> {
  await ensureStudentSession()
  const supabase = getSupabase()
  if (!supabase) return null
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

async function invokeParentalConsent(
  body: Record<string, unknown>,
): Promise<{ status: number; json: Record<string, unknown> }> {
  const env = getSupabaseEnv()
  const token = await accessToken()
  if (!env || !token) {
    return {
      status: 503,
      json: { error: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.' },
    }
  }

  const res = await fetch(`${env.url}/functions/v1/${FUNCTION_NAME}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      apikey: env.anonKey,
    },
    body: JSON.stringify(body),
  })

  let json: Record<string, unknown> = {}
  try {
    json = (await res.json()) as Record<string, unknown>
  } catch {
    json = { error: '응답을 읽지 못했어요.' }
  }
  return { status: res.status, json }
}

export async function sendParentalConsentOtp(
  phoneRaw: string,
): Promise<ParentalConsentSendResult> {
  if (!isSyncEnabled()) {
    return { ok: false, error: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.' }
  }
  const phone = normalizeKrMobile(phoneRaw)
  if (!phone) {
    return {
      ok: false,
      error: '휴대폰 번호 형식이 올바르지 않아요. (예: 010-1234-5678)',
    }
  }

  const { status, json } = await invokeParentalConsent({
    action: 'send',
    phone,
  })

  if (status >= 200 && status < 300 && json.ok === true && json.challengeToken) {
    return {
      ok: true,
      challengeToken: String(json.challengeToken),
      expiresInSec: Number(json.expiresInSec ?? 300),
      ...(typeof json.devCode === 'string' ? { devCode: json.devCode } : {}),
    }
  }

  return {
    ok: false,
    error: String(json.error ?? '문자 발송에 실패했어요.'),
  }
}

export async function verifyParentalConsentOtp(input: {
  phoneRaw: string
  code: string
  challengeToken: string
}): Promise<ParentalConsentVerifyResult> {
  if (!isSyncEnabled()) {
    return { ok: false, error: '서버 연결이 없어요. 잠시 후 다시 시도해 주세요.' }
  }
  const phone = normalizeKrMobile(input.phoneRaw)
  const code = input.code.replace(/\D/g, '')
  if (!phone || code.length !== 6) {
    return { ok: false, error: '인증번호 6자리를 입력해 주세요.' }
  }

  const { status, json } = await invokeParentalConsent({
    action: 'verify',
    phone,
    code,
    challengeToken: input.challengeToken,
  })

  if (
    status >= 200 &&
    status < 300 &&
    json.ok === true &&
    json.consentToken &&
    json.phoneLast4
  ) {
    return {
      ok: true,
      consentToken: String(json.consentToken),
      phoneLast4: String(json.phoneLast4),
    }
  }

  return {
    ok: false,
    error: String(json.error ?? '인증에 실패했어요.'),
    ...(typeof json.challengeToken === 'string'
      ? { challengeToken: json.challengeToken }
      : {}),
  }
}
