import { speakHaksupKorean, stopHaksupTts } from '../../lib/tts/haksup-tts'

export function stopKoreanSpeech() {
  stopHaksupTts()
}

export function speakKoreanText(text: string, _options?: { force?: boolean }) {
  speakHaksupKorean(text, _options)
}
