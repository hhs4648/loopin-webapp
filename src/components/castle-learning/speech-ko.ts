import { speakLoopinKorean, stopLoopinTts } from '../../lib/tts/loopin-tts'

export function stopKoreanSpeech() {
  stopLoopinTts()
}

export function speakKoreanText(text: string, _options?: { force?: boolean }) {
  speakLoopinKorean(text, _options)
}
