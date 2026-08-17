import { getSupabaseEnv } from '../sync/supabase-client'

export type LoopinTtsLang = 'en' | 'ko'

const EN_VOICE = 'en-US-AriaNeural'
const KO_VOICE = 'ko-KR-SunHiNeural'

/** 캐시 무효화 — rate/음성 변경 시 올림 */
const TTS_CACHE_VERSION = 'v3'

/** 데모 단어도 클라우드 TTS 미리 받아 두기 */
const PRELOAD_ENGLISH = [
  'various',
  'wave',
  'run errands',
  'latest',
  'We tried various foods at the festival.',
  'I wave to my friend every morning.',
  'I run errands for my mom on weekends.',
  'I bought the latest version of the game.',
]

const blobUrlCache = new Map<string, string>()
const audioCache = new Map<string, HTMLAudioElement>()

let activeToken = 0
let lastSpeakKey = ''
let lastSpeakAt = 0
const activeAudios: HTMLAudioElement[] = []

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function cacheKey(text: string, lang: LoopinTtsLang): string {
  return `${TTS_CACHE_VERSION}:${lang}:${normalizeText(text)}`
}

async function fetchCloudTtsBlob(text: string, lang: LoopinTtsLang): Promise<Blob> {
  const env = getSupabaseEnv()
  if (!env) {
    throw new Error('Loopin TTS cloud unavailable')
  }

  const res = await fetch(`${env.url}/functions/v1/loopin-tts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${env.anonKey}`,
      apikey: env.anonKey,
    },
    body: JSON.stringify({
      text: text.trim(),
      lang,
      voice: lang === 'ko' ? KO_VOICE : EN_VOICE,
      cacheVersion: TTS_CACHE_VERSION,
    }),
  })

  if (!res.ok) {
    throw new Error(`Loopin TTS failed (${res.status})`)
  }

  return res.blob()
}

async function getAudioUrl(text: string, lang: LoopinTtsLang): Promise<string> {
  const key = cacheKey(text, lang)
  const cached = blobUrlCache.get(key)
  if (cached) return cached

  const blob = await fetchCloudTtsBlob(text, lang)
  const url = URL.createObjectURL(blob)
  blobUrlCache.set(key, url)
  return url
}

function getCachedAudio(url: string): HTMLAudioElement {
  let audio = audioCache.get(url)
  if (!audio) {
    audio = new Audio(url)
    audio.preload = 'auto'
    audioCache.set(url, audio)
  }
  return audio
}

/** 재생 버퍼가 찰 때까지 대기 — 클릭 시 cold-start 지연 제거 */
function warmAudio(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    const done = () => {
      audio.removeEventListener('canplaythrough', done)
      audio.removeEventListener('error', done)
      resolve()
    }
    audio.addEventListener('canplaythrough', done, { once: true })
    audio.addEventListener('error', done, { once: true })
    audio.load()
  })
}

/**
 * 캐시된 blob은 새 Audio로 즉시 play — 이전 재생 상태/await에 묶이지 않음.
 */
function playAudioUrl(url: string, token: number): void {
  if (token !== activeToken) return

  const audio = new Audio(url)
  audio.preload = 'auto'
  activeAudios.push(audio)

  const cleanup = () => {
    audio.onended = null
    audio.onerror = null
    const idx = activeAudios.indexOf(audio)
    if (idx >= 0) activeAudios.splice(idx, 1)
  }
  audio.onended = cleanup
  audio.onerror = cleanup

  void audio.play().catch(() => {
    cleanup()
  })
}

export function stopLoopinTts() {
  activeToken += 1
  lastSpeakKey = ''
  lastSpeakAt = 0

  for (const audio of activeAudios.splice(0)) {
    audio.pause()
    audio.currentTime = 0
    audio.onended = null
    audio.onerror = null
  }
}

/** Loopin TTS(Aria/SunHi) 미리 준비 — 데모 단어도 동일 */
export async function preloadLoopinTts(): Promise<void> {
  if (!getSupabaseEnv()) return

  await Promise.all(
    PRELOAD_ENGLISH.map(async (text) => {
      try {
        await getAudioUrl(text, 'en')
      } catch {
        // non-fatal
      }
    }),
  )
}

/** 임의 영어 문구 TTS 미리 받아 두기 — 클릭 즉시 재생용 */
export async function preloadLoopinEnglishTexts(
  texts: readonly string[],
): Promise<void> {
  if (!getSupabaseEnv()) return

  const unique = [
    ...new Set(texts.map((text) => text.trim()).filter(Boolean)),
  ]
  await Promise.all(
    unique.map(async (text) => {
      try {
        const url = await getAudioUrl(text, 'en')
        const audio = getCachedAudio(url)
        await warmAudio(audio)
      } catch {
        // non-fatal
      }
    }),
  )
}

export function speakLoopinTts(
  text: string,
  lang: LoopinTtsLang,
  options?: { force?: boolean },
) {
  const trimmed = text.trim()
  if (!trimmed) return

  const key = cacheKey(trimmed, lang)
  const now = Date.now()
  if (!options?.force && key === lastSpeakKey && now - lastSpeakAt < 200) return

  lastSpeakKey = key
  lastSpeakAt = now
  activeToken += 1
  const token = activeToken

  for (const audio of activeAudios.splice(0)) {
    audio.pause()
    audio.currentTime = 0
    audio.onended = null
    audio.onerror = null
  }

  const cachedUrl = blobUrlCache.get(key)
  if (cachedUrl) {
    playAudioUrl(cachedUrl, token)
    return
  }

  void (async () => {
    try {
      const url = await getAudioUrl(trimmed, lang)
      if (token !== activeToken) return
      // 워밍도 해 두면 같은 단어 재클릭이 즉시 반응
      void warmAudio(getCachedAudio(url))
      playAudioUrl(url, token)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[loopin-tts]', lang, trimmed, error)
      }
    }
  })()
}

export function speakLoopinEnglish(text: string, options?: { force?: boolean }) {
  speakLoopinTts(text, 'en', options)
}

export function speakLoopinKorean(text: string, options?: { force?: boolean }) {
  speakLoopinTts(text, 'ko', options)
}
