import { comboMilestoneIndex } from './combo'

let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null

  if (!audioContext) {
    audioContext = new AudioContext()
  }

  if (audioContext.state === 'suspended') {
    void audioContext.resume()
  }

  return audioContext
}

type ChimeNote = {
  freq: number
  at: number
  length: number
  volume: number
}

/** 맑고 가벼운 유리 종 소리 */
function playClearChime(
  ctx: AudioContext,
  { freq, at, length, volume }: ChimeNote,
) {
  const start = ctx.currentTime + at

  const voices = [
    { ratio: 1, detune: 0, gain: 1, type: 'sine' as OscillatorType },
    { ratio: 2, detune: 3, gain: 0.12, type: 'sine' as OscillatorType },
    { ratio: 1.002, detune: -4, gain: 0.08, type: 'sine' as OscillatorType },
  ]

  voices.forEach(({ ratio, detune, gain, type }) => {
    const osc = ctx.createOscillator()
    const envelope = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = type
    osc.frequency.setValueAtTime(freq * ratio, start)
    osc.detune.setValueAtTime(detune, start)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(5200, start)
    filter.Q.value = 0.35

    envelope.gain.setValueAtTime(0.0001, start)
    envelope.gain.linearRampToValueAtTime(volume * gain, start + 0.01)
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + length)

    osc.connect(filter)
    filter.connect(envelope)

    const master = ctx.createGain()
    master.gain.value = 0.82
    envelope.connect(master)
    master.connect(ctx.destination)

    osc.start(start)
    osc.stop(start + length + 0.04)
  })
}

/** 정답 — 맑게 올라가는 3음 */
export function playCorrectAnswerSfx() {
  const ctx = getAudioContext()
  if (!ctx) return

  const notes: ChimeNote[] = [
    { freq: 1174.66, at: 0, length: 0.42, volume: 0.19 },
    { freq: 1396.91, at: 0.09, length: 0.45, volume: 0.2 },
    { freq: 1760, at: 0.18, length: 0.5, volume: 0.21 },
  ]

  notes.forEach((note) => playClearChime(ctx, note))
}

/** 오답 — 같은 질감, 짧게 내려가는 2음 */
export function playWrongAnswerSfx() {
  const ctx = getAudioContext()
  if (!ctx) return

  const notes: ChimeNote[] = [
    { freq: 987.77, at: 0, length: 0.32, volume: 0.17 },
    { freq: 783.99, at: 0.1, length: 0.36, volume: 0.18 },
  ]

  notes.forEach((note) => playClearChime(ctx, note))
}

export function playAnswerSfx(isCorrect: boolean) {
  if (isCorrect) {
    playCorrectAnswerSfx()
    return
  }

  playWrongAnswerSfx()
}

/**
 * 콤보 마일스톤 — 정답음 **위에 얹히는** 짧은 상승 아르페지오.
 *
 * 정답음은 각 문제 화면이 내고 있어서 러너에서 끌 수 없다. 그래서 억지로 겹치지 않게
 * 0.14초 뒤에 시작해 「정답 → 보너스」로 들리게 한다.
 *
 * 마일스톤이 오를수록 반음씩 올라가되 **1옥타브(12반음)에서 멈춘다** — 계속 올리면
 * 후반에 소리가 찢어지고 귀에 거슬린다.
 */
export function playComboSfx(combo: number) {
  const ctx = getAudioContext()
  if (!ctx) return

  const semitones = Math.min(comboMilestoneIndex(combo), 12)
  const ratio = Math.pow(2, semitones / 12)
  const offset = 0.14

  const notes: ChimeNote[] = [
    { freq: 1046.5 * ratio, at: offset, length: 0.3, volume: 0.15 },
    { freq: 1318.51 * ratio, at: offset + 0.07, length: 0.32, volume: 0.16 },
    { freq: 1567.98 * ratio, at: offset + 0.14, length: 0.36, volume: 0.17 },
    { freq: 2093 * ratio, at: offset + 0.21, length: 0.46, volume: 0.18 },
  ]

  notes.forEach((note) => playClearChime(ctx, note))
}

/** 버튼·타일 탭 — 짧고 맑은 클릭감 */
export function playTapSfx() {
  const ctx = getAudioContext()
  if (!ctx) return

  const start = ctx.currentTime
  const osc = ctx.createOscillator()
  const envelope = ctx.createGain()
  const filter = ctx.createBiquadFilter()

  osc.type = 'sine'
  osc.frequency.setValueAtTime(2100, start)
  osc.frequency.exponentialRampToValueAtTime(1200, start + 0.018)

  filter.type = 'highpass'
  filter.frequency.setValueAtTime(900, start)
  filter.Q.value = 0.5

  envelope.gain.setValueAtTime(0.0001, start)
  envelope.gain.exponentialRampToValueAtTime(0.07, start + 0.0015)
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.038)

  osc.connect(filter)
  filter.connect(envelope)

  const master = ctx.createGain()
  master.gain.value = 0.75
  envelope.connect(master)
  master.connect(ctx.destination)

  osc.start(start)
  osc.stop(start + 0.05)
}
