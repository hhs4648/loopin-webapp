import 'jsr:@supabase/functions-js/edge-runtime.d.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
}

const DEFAULT_VOICES = {
  en: 'en-US-AriaNeural',
  ko: 'ko-KR-SunHiNeural',
} as const

/**
 * 만들어 둔 음성을 모아 두는 공개 버킷.
 *
 * **문장 하나당 평생 한 번만 생성한다.** 파일 이름이 텍스트의 해시라, 어느 선생님이
 * 입력했든 같은 문장이면 같은 이름이 나온다. 그래서 두 번째부터는 이 함수까지 오지
 * 않고 클라이언트가 CDN에서 바로 받아 간다.
 *
 * **원문 텍스트는 저장하지 않는다.** 키가 해시라 버킷에는 음성 바이트만 남고,
 * 저장된 문장을 검색하거나 되읽을 수 없다 — 콘텐츠 제공이 아니라 캐시다.
 */
const BUCKET = 'tts-audio'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

/** 앱·빌드 스크립트의 `normalizeText`와 **같아야 한다** — 다르면 캐시를 못 찾는다 */
function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** `build-tts-audio.mjs`의 `keyOf`와 **같은 규칙** (sha1 앞 16자) */
async function cacheFileName(text: string, lang: string): Promise<string> {
  const data = new TextEncoder().encode(`${lang}:${normalizeText(text)}`)
  const digest = await crypto.subtle.digest('SHA-1', data)
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `${lang}-${hex.slice(0, 16)}.mp3`
}

function publicUrl(name: string): string {
  return `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${name}`
}

/** 버킷이 없으면 만든다. 이미 있으면 조용히 넘어간다. */
async function ensureBucket(): Promise<void> {
  if (!SERVICE_KEY) return
  try {
    await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${SERVICE_KEY}`,
        apikey: SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: BUCKET,
        name: BUCKET,
        public: true,
        // 음성 하나가 보통 10~20KB다. 1MB면 아주 긴 문장도 넉넉하다.
        file_size_limit: 1_048_576,
        allowed_mime_types: ['audio/mpeg'],
      }),
    })
  } catch {
    /* 이미 있거나 권한이 없으면 그냥 생성 없이 진행 */
  }
}

/** 저장해 둔 음성이 있으면 가져온다 */
async function readCached(name: string): Promise<Uint8Array | null> {
  try {
    const res = await fetch(publicUrl(name))
    if (!res.ok) return null
    return new Uint8Array(await res.arrayBuffer())
  } catch {
    return null
  }
}

/**
 * 만든 음성을 저장한다 (best-effort).
 *
 * 실패해도 재생은 이미 성공한 뒤라 사용자에게는 아무 일도 없다 — 다음 사람이
 * 한 번 더 만들 뿐이다. 그래서 여기서 실패를 던지지 않는다.
 */
async function writeCached(name: string, audio: Uint8Array): Promise<void> {
  if (!SERVICE_KEY) return
  try {
    const res = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${name}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
          'Content-Type': 'audio/mpeg',
          // 동시에 두 학생이 같은 문장을 열면 둘 다 올린다 — 덮어써도 내용이 같다.
          'x-upsert': 'true',
          'cache-control': 'public, max-age=31536000, immutable',
        },
        body: audio,
      },
    )
    if (!res.ok) {
      /*
        버킷이 없을 때 Storage가 404를 줄 때도 400을 줄 때도 있다
        (2026-08-27 실측: 공개 객체 조회는 400이었다). 상태 코드로 가르지 말고
        실패하면 일단 만들어 보고 한 번 더 시도한다 — 이미 있으면 무해하다.
      */
      await ensureBucket()
      await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${name}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${SERVICE_KEY}`,
          apikey: SERVICE_KEY,
          'Content-Type': 'audio/mpeg',
          'x-upsert': 'true',
        },
        body: audio,
      })
    }
  } catch {
    /* 저장 실패는 치명적이지 않다 */
  }
}

/*
  **음성은 Azure Speech 공식 REST로 만든다.**

  전에는 `edge-tts`(Edge 브라우저용 **비공식** 통로)를 썼다. 목소리는 같은 Azure Neural
  음성(`en-US-AriaNeural`)인데 통로가 비공식이라, 2026-09-09에 Supabase 환경에서 그
  연결이 통째로 막혀 합성이 멈췄다 — 같은 코드가 로컬 Node에서는 0.3초에 성공했다.
  그래서 목소리·속도·형식은 그대로 두고 **엔드포인트만 공식으로** 바꿨다. 이미 만들어
  둔 mp3 7,994개와 같은 설정이라 소리가 달라지지 않는다.

  대량 생성은 여전히 `scripts/build-tts-audio.mjs --local`(edge-tts, 키 없이 무료)로
  한다. 무료 등급(F0)은 월 50만 자라 실시간 폴백에만 쓰는 편이 낫다.
*/
const AZURE_KEY = Deno.env.get('AZURE_SPEECH_KEY') ?? ''
const AZURE_REGION = Deno.env.get('AZURE_SPEECH_REGION') ?? ''

/** 미리 만들어 둔 파일과 **같은 형식이어야 한다** — 24kHz 48kbps 모노 mp3 */
const AZURE_OUTPUT_FORMAT = 'audio-24khz-48kbitrate-mono-mp3'

/** 합성이 매달려도 요청은 반드시 끝나게 — 2026-09-09에 40초 넘게 무응답이었다 */
const SYNTH_TIMEOUT_MS = 15_000

/** 교사가 입력한 문장에 `&`나 `<`가 들어오면 SSML이 통째로 깨진다 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

async function synthesize(text: string, voice: string): Promise<Uint8Array> {
  if (!AZURE_KEY || !AZURE_REGION) {
    throw new Error('AZURE_SPEECH_KEY / AZURE_SPEECH_REGION 시크릿이 없습니다')
  }

  /* `en-US-AriaNeural` → `en-US`. 목소리 이름이 곧 언어라 따로 받지 않는다. */
  const locale = voice.split('-').slice(0, 2).join('-')
  // 선생님처럼 또박또박하되, 살짝 빠르게 (edge-tts 때의 rate/pitch와 같은 값)
  const ssml =
    `<speak version="1.0" xml:lang="${locale}">` +
    `<voice xml:lang="${locale}" name="${voice}">` +
    `<prosody rate="+10%" pitch="+0Hz">${escapeXml(text)}</prosody>` +
    `</voice></speak>`

  const res = await fetch(
    `https://${AZURE_REGION}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': AZURE_KEY,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': AZURE_OUTPUT_FORMAT,
        'User-Agent': 'haksup-tts',
      },
      body: ssml,
      signal: AbortSignal.timeout(SYNTH_TIMEOUT_MS),
    },
  )
  if (!res.ok) {
    /* 401=키, 403=지역·권한, 429=무료 한도 — 밖에서 구분되게 본문까지 남긴다 */
    const detail = (await res.text().catch(() => '')).slice(0, 200)
    throw new Error(`Azure TTS ${res.status}: ${detail}`)
  }
  return new Uint8Array(await res.arrayBuffer())
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const text = String(body.text ?? '').trim()
    const lang = body.lang === 'ko' ? 'ko' : 'en'
    const voice =
      typeof body.voice === 'string' && body.voice.trim()
        ? body.voice.trim()
        : DEFAULT_VOICES[lang]

    if (!text) {
      return new Response(JSON.stringify({ error: 'text required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const name = await cacheFileName(text, lang)

    /*
      클라이언트가 CDN을 먼저 찔러보고 없을 때만 여기로 오지만, 그 사이 다른
      학생이 이미 만들어 뒀을 수 있다. 한 번 더 확인하면 그만큼 덜 만든다.
    */
    const cached = await readCached(name)
    if (cached) {
      return new Response(cached, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Haksup-Cache': 'hit',
        },
      })
    }

    const audio = await synthesize(text, voice)
    // 저장을 기다리지 않는다 — 재생이 먼저다.
    void writeCached(name, audio)

    return new Response(audio, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Haksup-Cache': 'miss',
      },
    })
  } catch (error) {
    /*
      **삼키지 않는다.** 예전에는 Error가 아닌 값이 던져지면 `TTS error` 한 줄만 나가서
      2026-09-09 장애 때 원인을 함수 밖에서 알 방법이 없었다. 로그에 원본을 남기고
      응답에도 실제 문구를 담는다(교사·학생에게 보이는 화면 문구는 앱이 따로 만든다).
    */
    console.error('[haksup-tts]', error)
    const message = describeError(error)
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
