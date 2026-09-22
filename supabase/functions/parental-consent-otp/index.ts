/**
 * 만 14세 미만 학부모 SMS OTP (Solapi).
 *
 * - `send`  : 보호자 휴대폰으로 6자리 코드 발송 → 서명된 challenge 토큰 반환
 * - `verify`: 코드 검증 → 서명된 consent 토큰 반환
 *
 * OTP는 DB에 두지 않는다. challenge에 해시·만료·시도횟수를 HMAC으로 묶어
 * 클라이언트가 들고 다니고, 서버 시크릿으로만 검증한다.
 *
 * Secrets (Supabase Edge Function):
 *   SOLAPI_API_KEY, SOLAPI_API_SECRET, SOLAPI_SENDER
 *   PARENTAL_CONSENT_HMAC_SECRET  (없으면 SERVICE_ROLE_KEY 앞부분을 씀)
 *   PARENTAL_CONSENT_DEV_MODE=true 이면 Solapi 없이 고정 코드(123456) 허용
 */
import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const OTP_TTL_MS = 5 * 60 * 1000
const CONSENT_TTL_MS = 30 * 60 * 1000
const MAX_ATTEMPTS = 5
const DEV_OTP = '123456'

type ChallengePayload = {
  v: 1
  sid: string
  phone: string
  hash: string
  exp: number
  att: number
}

type ConsentPayload = {
  v: 1
  sid: string
  phoneLast4: string
  exp: number
}

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function normalizeKrMobile(raw: string): string | null {
  const digits = raw.replace(/\D/g, '')
  if (/^010\d{8}$/.test(digits)) return digits
  if (/^10\d{8}$/.test(digits)) return `0${digits}`
  return null
}

function hmacSecret(): string {
  return (
    Deno.env.get('PARENTAL_CONSENT_HMAC_SECRET')?.trim() ||
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() ||
    'haksup-parental-dev-secret'
  )
}

function isDevMode(): boolean {
  return Deno.env.get('PARENTAL_CONSENT_DEV_MODE')?.trim() === 'true'
}

async function sha256Hex(value: string): Promise<string> {
  const data = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(hmacSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  )
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function b64urlEncode(text: string): string {
  const bytes = new TextEncoder().encode(text)
  let bin = ''
  for (const b of bytes) bin += String.fromCharCode(b)
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function b64urlDecode(text: string): string {
  const pad = '='.repeat((4 - (text.length % 4)) % 4)
  const b64 = (text + pad).replace(/-/g, '+').replace(/_/g, '/')
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new TextDecoder().decode(bytes)
}

async function signPayload(payload: object): Promise<string> {
  const body = b64urlEncode(JSON.stringify(payload))
  const sig = await hmacHex(body)
  return `${body}.${sig}`
}

async function unsignPayload<T>(token: string): Promise<T | null> {
  const parts = token.split('.')
  if (parts.length !== 2) return null
  const [body, sig] = parts
  const expected = await hmacHex(body)
  if (sig !== expected) return null
  try {
    return JSON.parse(b64urlDecode(body)) as T
  } catch {
    return null
  }
}

function randomOtp(): string {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000
  return String(n).padStart(6, '0')
}

function cleanSecret(value: string | undefined): string {
  // PowerShell에서 KEY="값" 으로 넣으면 따옴표까지 저장되는 경우가 있다.
  return (value ?? '').trim().replace(/^["']+|["']+$/g, '')
}

async function createSolapiHmacAuth(apiKey: string, apiSecret: string) {
  // Solapi Authorization: HMAC-SHA256 apiKey=..., date=..., salt=..., signature=...
  // date 는 밀리초 없는 ISO8601(Z). signature = HMAC-SHA256(secret, date+salt) hex
  const date = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')
  const saltBytes = new Uint8Array(16)
  crypto.getRandomValues(saltBytes)
  const salt = Array.from(saltBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(apiSecret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(date + salt),
  )
  const signature = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `HMAC-SHA256 apiKey=${apiKey}, date=${date}, salt=${salt}, signature=${signature}`
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

function mapSolapiFail(detail: string, httpStatus?: number): string {
  const snippet = detail.replace(/\s+/g, ' ').slice(0, 160)
  const lower = detail.toLowerCase()
  if (/balance|잔액|point|credit/i.test(detail)) {
    return '문자 잔액(포인트)이 부족해요. 솔라피 콘솔에서 충전해 주세요.'
  }
  if (/sender|발신|from|등록/i.test(detail) || /3085|3018/.test(detail)) {
    return '발신번호가 아직 승인되지 않았거나 등록과 달라요. 솔라피 발신번호를 확인해 주세요.'
  }
  const status = httpStatus ? `HTTP ${httpStatus}` : '응답'
  if (/signature|apikey|auth|invalid|forbidden/i.test(lower) || httpStatus === 403) {
    return `문자 API 인증 실패 (${status}: ${snippet || '내용 없음'})`
  }
  return `문자 발송 실패 (${status}: ${snippet || '내용 없음'})`
}

async function sendSms(to: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = cleanSecret(Deno.env.get('SOLAPI_API_KEY'))
  const apiSecret = cleanSecret(Deno.env.get('SOLAPI_API_SECRET'))
  const from = digitsOnly(cleanSecret(Deno.env.get('SOLAPI_SENDER')))

  if (!apiKey || !apiSecret || !from) {
    if (isDevMode()) {
      console.warn('[parental-consent-otp] DEV MODE — SMS skipped:', text)
      return { ok: true }
    }
    return {
      ok: false,
      error: `SMS 설정이 없어요. (key:${apiKey ? `O(${apiKey.slice(0, 4)})` : 'X'} secret:${apiSecret ? `O(len${apiSecret.length})` : 'X'} sender:${from || 'X'})`,
    }
  }

  const payload = {
    messages: [
      {
        to: digitsOnly(to),
        from,
        text,
        type: 'SMS',
      },
    ],
  }

  const authHeader = await createSolapiHmacAuth(apiKey, apiSecret)
  const res = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
    method: 'POST',
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const detail = await res.text().catch(() => '')

  if (!res.ok) {
    console.error(
      '[parental-consent-otp] Solapi HTTP error',
      res.status,
      detail,
      'keyPrefix=',
      apiKey.slice(0, 4),
      'secretLen=',
      apiSecret.length,
      'from=',
      from,
    )
    return { ok: false, error: mapSolapiFail(detail || String(res.status), res.status) }
  }

  try {
    const body = JSON.parse(detail) as {
      statusCode?: string
      statusMessage?: string
      errorCode?: string
      errorMessage?: string
      failedMessageList?: Array<{ statusCode?: string; statusMessage?: string }>
      messageList?: Array<{ statusCode?: string; statusMessage?: string }>
    }

    const failed = body.failedMessageList?.[0]
    if (failed) {
      console.error('[parental-consent-otp] Solapi failed message', failed)
      return {
        ok: false,
        error: mapSolapiFail(
          `${failed.statusCode ?? ''} ${failed.statusMessage ?? ''}`,
        ),
      }
    }

    const first = body.messageList?.[0]
    if (first?.statusCode && !/^20/.test(first.statusCode)) {
      console.error('[parental-consent-otp] Solapi message status', first)
      return {
        ok: false,
        error: mapSolapiFail(
          `${first.statusCode} ${first.statusMessage ?? ''}`,
        ),
      }
    }

    if (body.statusCode && !/^20/.test(body.statusCode)) {
      console.error('[parental-consent-otp] Solapi status', body)
      return {
        ok: false,
        error: mapSolapiFail(
          `${body.statusCode} ${body.statusMessage ?? body.errorMessage ?? ''}`,
        ),
      }
    }
  } catch {
    /* 본문 파싱 실패해도 HTTP 200이면 일단 성공으로 */
  }

  return { ok: true }
}

async function resolveStudentId(req: Request): Promise<string | null> {
  const auth = req.headers.get('Authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null

  const url = Deno.env.get('SUPABASE_URL')?.trim()
  const anon = Deno.env.get('SUPABASE_ANON_KEY')?.trim()
  if (!url || !anon) return null

  const res = await fetch(`${url}/auth/v1/user`, {
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: anon,
    },
  })
  if (!res.ok) return null
  const user = (await res.json()) as { id?: string }
  return user.id ?? null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json(405, { error: 'Method not allowed' })
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return json(400, { error: '잘못된 요청이에요.' })
  }

  const action = String(body.action ?? '')
  const studentId = await resolveStudentId(req)
  if (!studentId) {
    return json(401, { error: '로그인이 필요해요.' })
  }

  if (action === 'send') {
    const phone = normalizeKrMobile(String(body.phone ?? ''))
    if (!phone) {
      return json(400, { error: '휴대폰 번호 형식이 올바르지 않아요. (예: 01012345678)' })
    }

    const code = isDevMode() && !Deno.env.get('SOLAPI_API_KEY')?.trim()
      ? DEV_OTP
      : randomOtp()
    const hash = await sha256Hex(`${studentId}:${phone}:${code}`)
    const challenge: ChallengePayload = {
      v: 1,
      sid: studentId,
      phone,
      hash,
      exp: Date.now() + OTP_TTL_MS,
      att: MAX_ATTEMPTS,
    }
    const challengeToken = await signPayload(challenge)

    const sms = await sendSms(
      phone,
      `[학습] 인증번호 ${code} (5분 내 입력)`,
    )
    if (!sms.ok) {
      return json(502, { error: sms.error ?? '문자 발송 실패' })
    }

    return json(200, {
      ok: true,
      challengeToken,
      expiresInSec: Math.floor(OTP_TTL_MS / 1000),
      ...(isDevMode() && !Deno.env.get('SOLAPI_API_KEY')?.trim()
        ? { devCode: DEV_OTP }
        : {}),
    })
  }

  if (action === 'verify') {
    const phone = normalizeKrMobile(String(body.phone ?? ''))
    const code = String(body.code ?? '').replace(/\D/g, '')
    const challengeToken = String(body.challengeToken ?? '')
    if (!phone || code.length !== 6 || !challengeToken) {
      return json(400, { error: '인증번호 6자리를 입력해 주세요.' })
    }

    const challenge = await unsignPayload<ChallengePayload>(challengeToken)
    if (!challenge || challenge.v !== 1) {
      return json(400, { error: '인증이 만료됐어요. 다시 받아 주세요.' })
    }
    if (challenge.sid !== studentId || challenge.phone !== phone) {
      return json(400, { error: '인증 정보가 일치하지 않아요.' })
    }
    if (Date.now() > challenge.exp) {
      return json(400, { error: '인증번호가 만료됐어요. 다시 받아 주세요.' })
    }
    if (challenge.att <= 0) {
      return json(400, { error: '시도 횟수를 초과했어요. 다시 받아 주세요.' })
    }

    const hash = await sha256Hex(`${studentId}:${phone}:${code}`)
    if (hash !== challenge.hash) {
      const next: ChallengePayload = { ...challenge, att: challenge.att - 1 }
      const nextToken = await signPayload(next)
      return json(400, {
        error:
          next.att > 0
            ? `인증번호가 올바르지 않아요. (${next.att}회 남음)`
            : '시도 횟수를 초과했어요. 다시 받아 주세요.',
        challengeToken: next.att > 0 ? nextToken : undefined,
      })
    }

    const consent: ConsentPayload = {
      v: 1,
      sid: studentId,
      phoneLast4: phone.slice(-4),
      exp: Date.now() + CONSENT_TTL_MS,
    }
    const consentToken = await signPayload(consent)
    return json(200, {
      ok: true,
      consentToken,
      phoneLast4: consent.phoneLast4,
    })
  }

  return json(400, { error: '알 수 없는 요청이에요.' })
})
