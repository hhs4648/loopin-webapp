/**
 * 문제은행의 **고정 콘텐츠 음성을 미리 만들어** `public/assets/audio/`에 넣는다.
 *
 * 왜: 지금은 학생이 스피커를 누를 때마다 Supabase Edge Function을 거친다.
 *   - 첫 재생에 2초 가까이 걸린다(콜드 스타트). 미리 받아 두면 즉시 난다.
 *   - `edge-tts-universal`은 Edge 브라우저용 **비공식** 엔드포인트다. 막히면 수업
 *     중에 음성이 통째로 멈춘다. 파일로 갖고 있으면 고정 콘텐츠는 안 멈춘다.
 *   - Supabase 무료 티어(호출 50만·egress 5GB)를 안 쓴다.
 *
 * **파일 이름은 텍스트의 해시다.** 이게 핵심이다 — 엑셀에서 단어나 문장을 고치면
 * 해시가 바뀌어 **옛 음성을 가리킬 수가 없다.** 「고치면 음성도 다시 뽑기」를 사람이
 * 지키는 규칙이 아니라 구조로 만든 것이다. 안 뽑았으면 매니페스트에 없으니 앱이
 * 조용히 Edge Function으로 폴백한다 — 틀린 소리가 나는 일은 없다.
 *
 * 음성은 **배포된 Edge Function을 그대로 호출해서** 만든다. 앱이 실시간으로 만드는
 * 것과 같은 엔진·같은 목소리·같은 속도라 소리가 달라지지 않는다.
 *
 *   node scripts/build-tts-audio.mjs [problem-bank.json 경로]
 *   node scripts/build-tts-audio.mjs --check     # 빠진 것만 확인하고 끝 (생성 안 함)
 *   node scripts/build-tts-audio.mjs --extra=<json>   # 문제은행 밖 문장도 같이 뽑기
 *
 * **`--extra`는 교과서 본문처럼 「음성만 갖고 있고 싶은」 문장을 받는다.** 저작권 때문에
 * 본문 원문은 problem-bank.json에 안 싣고 교사가 직접 입력하게 하는데, 교사가 치는 문장은
 * 결국 원문 그대로라 미리 뽑아 두면 Edge Function을 한 번도 안 친다. 파일 이름이 텍스트
 * 해시라 **원문을 어디에도 저장하지 않고** 맞출 수 있다 — 목록은 엑셀에만 있고, 이 스크립트는
 * 임시 파일로 받아서 mp3만 남긴다. 그래서 이 문장들은 `audio-manifest.json`(키가 평문)에
 * 넣지 않고 `audio-hashes.json`(파일명만)으로 뺀다.
 *
 * 기본 경로는 교사 리포다 — 두 리포가 나란히 있다고 본다.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath, pathToFileURL } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.join(__dirname, '..')
const OUT_DIR = path.join(APP, 'public/assets/audio')
const MANIFEST = path.join(APP, 'src/lib/tts/audio-manifest.json')
/* 평문을 남기면 안 되는 것들 — 파일명(=해시)만 적는다. 앱이 해시를 계산해 대조한다. */
const HASHES = path.join(APP, 'src/lib/tts/audio-hashes.json')

const args = process.argv.slice(2)
const CHECK_ONLY = args.includes('--check')
const EXTRA_PATH = args.find((a) => a.startsWith('--extra='))?.slice('--extra='.length)

/*
  교사 리포 위치는 사람마다 다르다. 형제 폴더로 둔 사람도 있고
  (`.cursor/projects/`) 한 단계 위에 둔 사람도 있다 (`.cursor/`).
  하나만 박아 두면 **조용히 건너뛰고** 음성이 낡은 채로 남는다 —
  실제로 그렇게 지나간 적이 있어서 후보를 훑는다.
  경로를 인자로 주거나 `HAKSUP_PROBLEM_BANK`로 못박아도 된다.
*/
const BANK_REL = 'loopin-web/src/data/problem-bank.json'
const BANK_CANDIDATES = [
  path.join(APP, '../loopin-project', BANK_REL),
  path.join(APP, '../../loopin-project', BANK_REL),
]
const bankPath =
  args.find((a) => !a.startsWith('--')) ??
  process.env.HAKSUP_PROBLEM_BANK ??
  BANK_CANDIDATES.find((p) => fs.existsSync(p)) ??
  BANK_CANDIDATES[0]

/** 앱의 `normalizeText`와 **같아야 한다** — 다르면 매니페스트를 못 찾는다 */
function normalizeText(text) {
  return text.trim().replace(/\s+/g, ' ').toLowerCase()
}

/** 앱이 말하기 전에 대괄호를 벗긴다(`stripBrackets`) — 같은 형태로 맞춘다 */
function stripBrackets(text) {
  return text
    .replace(/\[([^\]]+)\]/g, '$1')
    .replace(/\s*\/\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function keyOf(text, lang) {
  const norm = normalizeText(text)
  const hash = crypto.createHash('sha1').update(`${lang}:${norm}`).digest('hex')
  return { norm, file: `${lang}-${hash.slice(0, 16)}.mp3` }
}

if (!fs.existsSync(bankPath)) {
  /*
    문제은행은 **교사 리포**에 있다. Vercel 빌드 머신처럼 그 리포가 없는 곳에서는
    할 수 있는 게 없다 — 그렇다고 빌드를 막으면 배포가 통째로 실패한다.
    이미 만들어 둔 음성은 `public/assets/audio/`에 커밋돼 있으니 그대로 나가면 된다.
  */
  console.warn(`문제은행이 없어 건너뜁니다: ${bankPath}`)
  console.warn('(교사 리포가 없는 환경 — 이미 만들어 둔 음성은 그대로 쓰입니다)')
  process.exit(0)
}

const bank = JSON.parse(fs.readFileSync(bankPath, 'utf8'))

/*
  앱이 실제로 소리 내는 것만 모은다.
  - 단어 화면(짝맞추기·음성 짝맞추기·3지선다·완료): `word.english`
  - 본문 화면(번역 배열·청크 배열): `sentence.english` (대괄호를 벗긴 형태)
  한국어 내레이션은 문제은행이 아니라 코드에 박힌 고정 문구라 여기 없다.
*/
const targets = new Map() // norm -> { text, lang, file, extra }
const add = (raw, lang, extra = false) => {
  const text = stripBrackets(String(raw ?? ''))
  if (!text) return
  const { norm, file } = keyOf(text, lang)
  // 먼저 들어온 쪽이 이긴다 — 문제은행에도 있는 문장이면 `extra`가 아니라
  // 평문 매니페스트에 남아야 한다(보안 컨텍스트가 아닌 브라우저에서도 잡히도록).
  if (!targets.has(norm)) targets.set(norm, { text, lang, file, extra })
}

for (const w of bank.words ?? []) add(w.english, 'en')
for (const s of bank.sentences ?? []) add(s.english, 'en')

/*
  앱이 시작할 때 미리 받는 문구도 정적으로 뽑아 둔다. 이게 빠져 있으면
  **앱을 열 때마다** 그만큼 Edge Function을 친다 (2026-08-27 실측 8건/1회).
  목록은 앱과 같은 파일을 읽는다 — 두 군데 적어 두면 반드시 어긋난다.
*/
const { PRELOAD_ENGLISH } = await import(
  pathToFileURL(path.join(APP, 'src/lib/tts/preload-texts.ts')).href
)
for (const text of PRELOAD_ENGLISH) add(text, 'en')

/*
  `--extra`로 받은 문장 — 교과서 본문처럼 **텍스트는 안 남기고 음성만** 갖고 싶은 것들.
  임시 파일로 받는다: 이 리포에도 교사 리포에도 원문을 적어 두지 않기 위해서다.
  (원본 목록은 엑셀에만 있고, 교사 리포의 import-problem-bank.mjs가 넘겨준다)
*/
let extraCount = 0
if (EXTRA_PATH) {
  if (!fs.existsSync(EXTRA_PATH)) {
    console.warn(`--extra 파일이 없습니다: ${EXTRA_PATH}`)
  } else {
    const raw = JSON.parse(fs.readFileSync(EXTRA_PATH, 'utf8'))
    const list = Array.isArray(raw) ? raw : (raw.en ?? [])
    for (const text of list) add(text, 'en', true)
    extraCount = list.length
  }
}

console.log(`문제은행: ${path.relative(APP, bankPath).replace(/\\/g, '/')}`)
console.log(
  `읽을 대상 ${targets.size}개 (단어 ${bank.words?.length ?? 0} · 문장 ${bank.sentences?.length ?? 0}` +
    (extraCount ? ` · 본문(음성만) ${extraCount}` : '') +
    ' 기준, 중복 제거)',
)

if (!fs.existsSync(OUT_DIR)) fs.mkdirSync(OUT_DIR, { recursive: true })

const existing = new Set(fs.readdirSync(OUT_DIR))
const missing = [...targets.values()].filter((t) => !existing.has(t.file))

console.log(`이미 있음 ${targets.size - missing.length}개 · 새로 필요 ${missing.length}개`)

if (CHECK_ONLY) {
  if (missing.length) {
    console.error(`\n음성이 없는 항목 ${missing.length}개:`)
    missing.slice(0, 10).forEach((t) => console.error(`  ${t.lang}  ${t.text.slice(0, 60)}`))
    console.error('\nnode scripts/build-tts-audio.mjs 를 실행하세요.')
    process.exit(1)
  }
  console.log('\n전부 준비돼 있습니다.')
  process.exit(0)
}

// ── 생성 ────────────────────────────────────────────────────────────────────
/*
  음성을 만드는 길이 둘이다.

  1. **Edge Function 호출**(기본) — 앱이 실시간으로 만드는 것과 같은 경로라 소리가
     절대 달라지지 않는다.
  2. **`--local`** — 이 스크립트가 `edge-tts-universal`을 직접 불러 만든다. 목소리·속도·
     높이를 함수와 **같은 값**으로 박아 두었으므로 결과는 같다.

  2번이 필요한 이유: 2026-09-09, 배포된 함수가 합성 단계에서 응답 없이 멈췄다
  (로그: `booted` → `Not implemented: ClientRequest.options.createConnection` → `shutdown`).
  같은 버전 라이브러리가 **로컬 Node에서는 0.4초에 성공**하므로 Supabase Deno 런타임
  쪽 문제다. 함수가 고쳐질 때까지 미리 만들기가 통째로 막히면 안 되니 길을 하나 더 둔다.

  `--jobs=N`으로 동시에 만드는 개수를 정한다(기본: 로컬 6, 함수 1). 함수 쪽은 남의
  서버라 기본을 1로 둔다.
*/
function env(key) {
  const file = path.join(APP, '.env.local')
  if (!fs.existsSync(file)) return null
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith(key + '='))
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : null
}

const LOCAL = args.includes('--local')
const JOBS = Math.max(
  1,
  Number(args.find((a) => a.startsWith('--jobs='))?.slice('--jobs='.length)) ||
    (LOCAL ? 6 : 1),
)
/** 함수가 멈춰도 배치 전체가 매달리지 않게 — 2026-09-09에 실제로 무한 대기했다 */
const REMOTE_TIMEOUT_MS = 20_000

/** 함수(`supabase/functions/haksup-tts`)와 **같은 값이어야 한다** */
const VOICES = { en: 'en-US-AriaNeural', ko: 'ko-KR-SunHiNeural' }
const RATE = '+10%'
const PITCH = '+0Hz'

const TTS_CACHE_VERSION = 'v3' // haksup-tts.ts와 같아야 한다

let makeAudio
if (LOCAL) {
  let Communicate
  try {
    ({ Communicate } = await import('edge-tts-universal'))
  } catch {
    console.error('--local 을 쓰려면 edge-tts-universal이 필요합니다: npm i -D edge-tts-universal')
    process.exit(1)
  }
  makeAudio = async (t) => {
    const communicate = new Communicate(t.text, {
      voice: VOICES[t.lang],
      rate: RATE,
      pitch: PITCH,
    })
    const chunks = []
    for await (const message of communicate.stream()) {
      if (message.type === 'audio' && message.data) chunks.push(Buffer.from(message.data))
    }
    return Buffer.concat(chunks)
  }
} else {
  const url = env('VITE_SUPABASE_URL')
  const anon = env('VITE_SUPABASE_ANON_KEY')
  if (!url || !anon) {
    console.error('.env.local에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 필요합니다.')
    process.exit(1)
  }
  makeAudio = async (t) => {
    const res = await fetch(`${url}/functions/v1/haksup-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anon}`,
        apikey: anon,
      },
      body: JSON.stringify({ text: t.text, lang: t.lang, cacheVersion: TTS_CACHE_VERSION }),
      signal: AbortSignal.timeout(REMOTE_TIMEOUT_MS),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return Buffer.from(await res.arrayBuffer())
  }
}

let ok = 0
let failed = 0
let done = 0
const failures = []

console.log(`만드는 방법: ${LOCAL ? '로컬 edge-tts' : 'Edge Function'} · 동시 ${JOBS}개`)

async function worker(queue) {
  for (;;) {
    const t = queue.pop()
    if (!t) return
    try {
      const buf = await makeAudio(t)
      if (buf.length < 500) throw new Error(`너무 작음 (${buf.length}B)`)
      fs.writeFileSync(path.join(OUT_DIR, t.file), buf)
      ok += 1
    } catch (e) {
      failed += 1
      failures.push(`${t.lang}  ${t.text.slice(0, 50)} — ${e.message}`)
    }
    done += 1
    /* 한 줄씩 찍으면 7,000줄이 된다 — 25개마다 한 번만 */
    if (done % 25 === 0 || done === missing.length) {
      console.log(`  [${done}/${missing.length}] 성공 ${ok} · 실패 ${failed}`)
    }
  }
}

const queue = [...missing].reverse()
await Promise.all(Array.from({ length: Math.min(JOBS, queue.length) }, () => worker(queue)))

if (failures.length) {
  console.log(`
실패 ${failures.length}개 (앞 10개):`)
  failures.slice(0, 10).forEach((line) => console.log(`  ${line}`))
}

// ── 매니페스트 ──────────────────────────────────────────────────────────────
// 앱이 해시를 계산하지 않아도 되도록 「정규화한 텍스트 → 파일명」 표를 남긴다.
// (브라우저 해시는 비동기라 재생 직전에 쓰기 불편하다)
const have = new Set(fs.readdirSync(OUT_DIR).filter((f) => f.endsWith('.mp3')))
const manifest = {}
for (const [norm, t] of targets) {
  // `extra`는 평문을 남기면 안 된다 — 아래 해시 목록으로만 나간다
  if (t.extra) continue
  if (have.has(t.file)) manifest[`${t.lang}:${norm}`] = t.file
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

/*
  **해시 목록은 디스크에서 그대로 뽑는다.** 「이번에 뭘 넘겨받았는지」로 만들면
  --extra 없이 한 번만 돌려도 목록이 통째로 비어 버린다 — 교사 리포나 엑셀이 없는
  자리에서 `npm run tts:build`를 돌리는 일이 실제로 있다. 「파일이 있으면 목록에 있다」로
  두면 잃어버릴 상태가 없다.

  지운 콘텐츠의 옛 음성이 목록에 남을 수는 있는데, **정확히 그 텍스트를 다시 쳐야만**
  잡히므로 틀린 소리가 날 일은 없다 (파일명이 텍스트 해시라서).
*/
fs.writeFileSync(HASHES, JSON.stringify([...have].sort(), null, 2) + '\n')

const bytes = [...have].reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0)
console.log(`\n생성 ${ok} · 실패 ${failed}`)
console.log(
  `매니페스트 ${Object.keys(manifest).length}개 · 해시 목록 ${have.size}개 · 오디오 총 ${(bytes / 1048576).toFixed(2)}MB`,
)
if (failed) console.log('실패한 것은 앱에서 예전처럼 Edge Function으로 재생됩니다.')
