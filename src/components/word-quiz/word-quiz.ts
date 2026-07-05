export const FRAME_W = 393
export const FRAME_H = 852

export const WORD_QUIZ_ASSETS = {
  base: '/assets/단어B_시작.svg',
} as const

export const FEEDBACK_MS = 500

export type WordQuizId = 'various' | 'wave' | 'run-errands' | 'latest'

export type WordQuizQuestion = {
  id: WordQuizId
  word: string
  correctAnswer: string
  options: [string, string, string]
}

export const WORD_QUIZ_QUESTIONS: WordQuizQuestion[] = [
  {
    id: 'various',
    word: 'various',
    correctAnswer: '다양한',
    options: ['다양한', '최신의', '심부름하다'],
  },
  {
    id: 'wave',
    word: 'wave',
    correctAnswer: '손을 흔들다',
    options: ['손을 흔들다', '다양한', '최신의'],
  },
  {
    id: 'run-errands',
    word: 'run errands',
    correctAnswer: '심부름하다',
    options: ['심부름하다', '손을 흔들다', '다양한'],
  },
  {
    id: 'latest',
    word: 'latest',
    correctAnswer: '최신의',
    options: ['최신의', '다양한', '심부름하다'],
  },
]

/** Figma — 스피커 버튼 */
export const WORD_QUIZ_SPEAKER_HIT = { x: 87, y: 232, w: 46.5, h: 45.875 }

/** Figma — 영어 단어 표시 영역 */
export const WORD_QUIZ_PROMPT_WORD = { x: 130, y: 238, w: 140, h: 36 }

/** Figma — 진행률 바 (1/4 기준 x=31.6172 w=326) */
export const WORD_QUIZ_PROGRESS_BAR = { x: 31.6172, y: 142, w: 326, h: 18 }

/** Figma — 진행률 텍스트 (1/4) */
export const WORD_QUIZ_PROGRESS_LABEL = { x: 168, y: 146, w: 60, h: 18 }

export const WORD_QUIZ_OPTIONS = [
  { x: 20, y: 325, w: 354, h: 76 },
  { x: 20, y: 417, w: 354, h: 76 },
  { x: 20, y: 509, w: 354, h: 76 },
] as const

export function shuffleOptions<T>(items: readonly T[]): T[] {
  const next = [...items]
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[next[i], next[j]] = [next[j], next[i]]
  }
  return next
}

export function figmaRectStyle(rect: { x: number; y: number; w: number; h: number }) {
  return {
    left: `${(rect.x / FRAME_W) * 100}%`,
    top: `${(rect.y / FRAME_H) * 100}%`,
    width: `${(rect.w / FRAME_W) * 100}%`,
    height: `${(rect.h / FRAME_H) * 100}%`,
  }
}

const PHRASE_GAP_MS = 100

export const WORD_PRONUNCIATION_AUDIO: Record<string, string | readonly string[]> = {
  various: '/assets/audio/various.wav',
  wave: '/assets/audio/wave.wav',
  'run errands': '/assets/audio/run-errands.wav',
  latest: '/assets/audio/latest.wav',
}

const audioCache = new Map<string, HTMLAudioElement>()

let activePlayToken = 0
let lastSpeakWord = ''
let lastSpeakAt = 0
const activeAudios: HTMLAudioElement[] = []

function getAudioSources(word: string): string[] {
  const source = WORD_PRONUNCIATION_AUDIO[word]
  if (!source) return []
  return Array.isArray(source) ? [...source] : [source]
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

function waitForAudioReady(audio: HTMLAudioElement): Promise<void> {
  if (audio.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) {
    return Promise.resolve()
  }

  return new Promise((resolve, reject) => {
    const onReady = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('audio load failed'))
    }
    const cleanup = () => {
      audio.removeEventListener('canplaythrough', onReady)
      audio.removeEventListener('loadeddata', onReady)
      audio.removeEventListener('error', onError)
    }

    audio.addEventListener('canplaythrough', onReady)
    audio.addEventListener('loadeddata', onReady)
    audio.addEventListener('error', onError)
    audio.load()
  })
}

function delay(ms: number, token: number): Promise<void> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (token === activePlayToken) resolve()
    }, ms)
  })
}

function pickEnglishVoice(synth: SpeechSynthesis): SpeechSynthesisVoice | undefined {
  const voices = synth.getVoices()
  const preferredNames = ['Microsoft Zira', 'Microsoft Aria', 'Google US English', 'Samantha']

  for (const name of preferredNames) {
    const voice = voices.find((item) => item.name.includes(name))
    if (voice) return voice
  }

  return (
    voices.find((voice) => voice.lang === 'en-US') ??
    voices.find((voice) => voice.lang.startsWith('en'))
  )
}

function speakWithSynth(word: string) {
  if (!('speechSynthesis' in window)) return

  const synth = window.speechSynthesis
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.95

  const voice = pickEnglishVoice(synth)
  if (voice) utterance.voice = voice

  let resumeTimer: number | null = null

  const clearResumeTimer = () => {
    if (resumeTimer !== null) {
      window.clearInterval(resumeTimer)
      resumeTimer = null
    }
  }

  utterance.onstart = () => {
    synth.resume()
    clearResumeTimer()
    resumeTimer = window.setInterval(() => {
      if (!synth.speaking) {
        clearResumeTimer()
        return
      }
      synth.pause()
      synth.resume()
    }, 120)
  }

  utterance.onend = clearResumeTimer
  utterance.onerror = clearResumeTimer

  if (synth.speaking || synth.pending) {
    synth.cancel()
    window.setTimeout(() => synth.speak(utterance), 120)
    return
  }

  synth.speak(utterance)
}

async function playAudioUrl(url: string, token: number): Promise<boolean> {
  if (token !== activePlayToken) return false

  const audio = getCachedAudio(url)
  audio.currentTime = 0

  const tryPlay = async (): Promise<boolean> => {
    if (token !== activePlayToken) return false

    try {
      await audio.play()
      return true
    } catch {
      return false
    }
  }

  if (await tryPlay()) {
    return new Promise((resolve) => {
      activeAudios.push(audio)

      const finish = (success: boolean) => {
        audio.onended = null
        audio.onerror = null
        resolve(success)
      }

      audio.onended = () => finish(true)
      audio.onerror = () => finish(false)
    })
  }

  try {
    await waitForAudioReady(audio)
  } catch {
    return false
  }

  if (token !== activePlayToken) return false
  if (!(await tryPlay())) return false

  return new Promise((resolve) => {
    activeAudios.push(audio)

    const finish = (success: boolean) => {
      audio.onended = null
      audio.onerror = null
      resolve(success)
    }

    audio.onended = () => finish(true)
    audio.onerror = () => finish(false)
  })
}

async function playWordAudio(word: string, token: number): Promise<boolean> {
  const sources = getAudioSources(word)
  if (sources.length === 0) return false

  for (let index = 0; index < sources.length; index += 1) {
    if (token !== activePlayToken) return false

    const played = await playAudioUrl(sources[index], token)
    if (!played) return false

    if (index < sources.length - 1) {
      await delay(PHRASE_GAP_MS, token)
      if (token !== activePlayToken) return false
    }
  }

  return true
}

export function stopEnglishWordAudio() {
  activePlayToken += 1
  lastSpeakWord = ''
  lastSpeakAt = 0

  for (const audio of activeAudios.splice(0)) {
    audio.pause()
    audio.currentTime = 0
    audio.onended = null
    audio.onerror = null
  }

  window.speechSynthesis?.cancel()
}

export function preloadEnglishWordAudio(): Promise<void> {
  const urls = new Set<string>()

  for (const source of Object.values(WORD_PRONUNCIATION_AUDIO)) {
    const items = Array.isArray(source) ? source : [source]
    for (const url of items) urls.add(url)
  }

  const loads = [...urls].map(async (url) => {
    const audio = getCachedAudio(url)
    try {
      await waitForAudioReady(audio)
    } catch {
      // Preload failure is non-fatal; playback will retry or fall back.
    }
  })

  return Promise.all(loads).then(() => undefined)
}

export function speakEnglishWord(word: string, options?: { force?: boolean }) {
  const now = Date.now()
  if (!options?.force && word === lastSpeakWord && now - lastSpeakAt < 200) return

  lastSpeakWord = word
  lastSpeakAt = now

  const token = ++activePlayToken
  for (const audio of activeAudios.splice(0)) {
    audio.pause()
    audio.currentTime = 0
    audio.onended = null
    audio.onerror = null
  }
  window.speechSynthesis?.cancel()

  void (async () => {
    const played = await playWordAudio(word, token)
    if (token !== activePlayToken) return
    if (!played) speakWithSynth(word)
  })()
}
