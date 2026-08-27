import { getSupabaseEnv } from '../sync/supabase-client'
import audioManifest from './audio-manifest.json'
import { PRELOAD_ENGLISH } from './preload-texts'

export type HaksupTtsLang = 'en' | 'ko'

const EN_VOICE = 'en-US-AriaNeural'
const KO_VOICE = 'ko-KR-SunHiNeural'

/** 캐시 무효화 — rate/음성 변경 시 올림 */
const TTS_CACHE_VERSION = 'v3'

const blobUrlCache = new Map<string, string>()
const audioCache = new Map<string, HTMLAudioElement>()

let activeToken = 0
let lastSpeakKey = ''
let lastSpeakAt = 0
const activeAudios: HTMLAudioElement[] = []

function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

function cacheKey(text: string, lang: HaksupTtsLang): string {
  return `${TTS_CACHE_VERSION}:${lang}:${normalizeText(text)}`
}

/**
 * **미리 만들어 둔 음성이 있으면 그걸 쓴다.** 없으면 null → 예전처럼 함수를 부른다.
 *
 * 문제은행처럼 내용이 고정된 것은 `scripts/build-tts-audio.mjs`가 배포 전에 뽑아
 * `public/assets/audio/`에 넣어 둔다. 그 파일은 Vercel CDN에서 즉시 오므로
 * 첫 재생 지연(콜드 스타트 2초)이 사라지고, Supabase 호출·egress도 안 쓴다.
 *
 * 파일 이름이 **텍스트의 해시**라, 엑셀에서 문장을 고치면 매니페스트에서 안 잡히고
 * 자동으로 함수 경로를 탄다 — 옛 음성이 잘못 나올 수가 없다.
 *
 * 교사가 직접 만든 과제·복습 합성본은 내용이 매번 달라 여기 없다(함수로 간다).
 */
const staticAudio = audioManifest as Record<string, string>

function staticAudioUrl(text: string, lang: HaksupTtsLang): string | null {
  const file = staticAudio[`${lang}:${normalizeText(text)}`]
  return file ? `/assets/audio/${file}` : null
}

/**
 * Edge Function 이름. 브랜드 변경으로 `haksup-tts`가 되었고, **재배포도 끝났다**
 * (2026-08-27 실측: 두 이름 모두 200 + audio/mpeg를 돌려준다).
 *
 * 그전까지는 구 이름을 **먼저** 쳤는데, 새 이름이 이미 살아 있는데도 매번
 * `loopin-tts`로 재생하면서 콘솔에 「haksup-tts 미배포」라는 사실과 다른 경고를
 * 남겼다. 이제 새 이름을 먼저 치고, 구 이름은 순수 폴백으로만 둔다.
 *
 * 구 함수를 Supabase에서 내리고 나면 `LEGACY_TTS_FUNCTION`과 폴백 분기를 지울 것.
 */
const TTS_FUNCTION = 'haksup-tts'
const LEGACY_TTS_FUNCTION = 'loopin-tts'

/** 새 이름이 먼저 — 구 이름은 새 이름이 죽었을 때만 */
const TTS_FUNCTION_CANDIDATES = [TTS_FUNCTION, LEGACY_TTS_FUNCTION] as const

/** 새 이름이 없다고 확인된 뒤에는 매번 헛걸음하지 않는다 */
let ttsFunctionName: string | null = null

async function requestTts(
  env: { url: string; anonKey: string },
  name: string,
  text: string,
  lang: HaksupTtsLang,
): Promise<Response> {
  return fetch(`${env.url}/functions/v1/${name}`, {
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
}

async function fetchCloudTtsBlob(text: string, lang: HaksupTtsLang): Promise<Blob> {
  const env = getSupabaseEnv()
  if (!env) {
    throw new Error('Haksup TTS cloud unavailable')
  }

  const names = ttsFunctionName
    ? [
        ttsFunctionName,
        ...TTS_FUNCTION_CANDIDATES.filter((name) => name !== ttsFunctionName),
      ]
    : [...TTS_FUNCTION_CANDIDATES]

  let lastStatus = 0
  // 폴백 경고에 쓸 값 — **정식 이름이 왜 안 됐는지**를 적어야 쓸모가 있다
  let primaryFailure: string | null = null
  for (const name of names) {
    try {
      const res = await requestTts(env, name, text, lang)
      lastStatus = res.status
      if (!res.ok) {
        if (name === TTS_FUNCTION) primaryFailure = String(res.status)
        continue
      }
      if (name !== TTS_FUNCTION && ttsFunctionName !== name) {
        console.warn(
          `[haksup-tts] ${TTS_FUNCTION} 실패(${primaryFailure ?? 'network'}) — ${name}로 재생합니다`,
        )
      }
      ttsFunctionName = name
      return res.blob()
    } catch {
      if (name === TTS_FUNCTION) primaryFailure = 'network'
      // 다음 이름 시도
    }
  }

  throw new Error(`Haksup TTS failed (${lastStatus || 'network'})`)
}

function speakBrowserFallback(text: string, lang: HaksupTtsLang) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US'
  window.speechSynthesis.speak(utterance)
}

/** 클릭 제스처 안에서 오디오를 한 번 열어 두면, 이후 비동기 play가 막히지 않는다 */
let audioUnlocked = false
function unlockAudioPlayback() {
  if (audioUnlocked || typeof window === 'undefined') return
  audioUnlocked = true
  const silent = new Audio()
  silent.muted = true
  void silent
    .play()
    .then(() => {
      silent.pause()
    })
    .catch(() => {
      audioUnlocked = false
    })
}

async function getAudioUrl(text: string, lang: HaksupTtsLang): Promise<string> {
  const key = cacheKey(text, lang)
  const cached = blobUrlCache.get(key)
  if (cached) return cached

  // 미리 만들어 둔 파일이 있으면 네트워크 왕복 없이 그 경로를 쓴다
  const prebuilt = staticAudioUrl(text, lang)
  if (prebuilt) {
    blobUrlCache.set(key, prebuilt)
    return prebuilt
  }

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
function playAudioUrl(
  url: string,
  token: number,
  fallback?: { text: string; lang: HaksupTtsLang },
): void {
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
    if (fallback && token === activeToken) {
      speakBrowserFallback(fallback.text, fallback.lang)
    }
  })
}

export function stopHaksupTts() {
  activeToken += 1
  lastSpeakKey = ''
  lastSpeakAt = 0
  if (typeof window !== 'undefined') {
    window.speechSynthesis?.cancel()
  }

  for (const audio of activeAudios.splice(0)) {
    audio.pause()
    audio.currentTime = 0
    audio.onended = null
    audio.onerror = null
  }
}

/** Haksup TTS(Aria/SunHi) 미리 준비 — 데모 단어도 동일 */
export async function preloadHaksupTts(): Promise<void> {
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
export async function preloadHaksupEnglishTexts(
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
        // non-blocking
      }
    }),
  )
}

export function speakHaksupTts(
  text: string,
  lang: HaksupTtsLang,
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
  unlockAudioPlayback()
  if (typeof window !== 'undefined') {
    window.speechSynthesis?.cancel()
  }

  for (const audio of activeAudios.splice(0)) {
    audio.pause()
    audio.currentTime = 0
    audio.onended = null
    audio.onerror = null
  }

  const fallback = { text: trimmed, lang }
  const cachedUrl = blobUrlCache.get(key)
  if (cachedUrl) {
    playAudioUrl(cachedUrl, token, fallback)
    return
  }

  void (async () => {
    try {
      const url = await getAudioUrl(trimmed, lang)
      if (token !== activeToken) return
      // 워밍도 해 두면 같은 단어 재클릭이 즉시 반응
      void warmAudio(getCachedAudio(url))
      playAudioUrl(url, token, fallback)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('[haksup-tts]', lang, trimmed, error)
      }
      if (token !== activeToken) return
      speakBrowserFallback(trimmed, lang)
    }
  })()
}

export function speakHaksupEnglish(text: string, options?: { force?: boolean }) {
  speakHaksupTts(text, 'en', options)
}

export function speakHaksupKorean(text: string, options?: { force?: boolean }) {
  speakHaksupTts(text, 'ko', options)
}
