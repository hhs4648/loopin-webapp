/**
 * 앱이 켜지자마자 미리 받아 두는 영어 문구.
 *
 * **여기에 import를 걸지 말 것.** `scripts/build-tts-audio.mjs`가 이 파일을
 * 그대로 읽어(Node 타입 스트리핑) 정적 음성 대상에 넣는다 — 의존성이 하나라도
 * 붙으면 빌드 스크립트가 깨진다. `lib/ai/phrase-chunks.ts`와 같은 이유다.
 *
 * 이 목록이 정적 음성으로 안 뽑히면 **앱을 열 때마다** Edge Function을 그만큼
 * 호출한다(2026-08-27 실측: 앱 시작 1회당 8건). 문구를 고쳤으면
 * `npm run tts:build`를 같이 돌릴 것.
 */
export const PRELOAD_ENGLISH = [
  'various',
  'wave',
  'run errands',
  'latest',
  'We tried various foods at the festival.',
  'I wave to my friend every morning.',
  'I run errands for my mom on weekends.',
  'I bought the latest version of the game.',
]
