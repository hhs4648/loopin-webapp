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
 *
 * 기본 경로는 교사 리포다 — 두 리포가 나란히 있다고 본다.
 */
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APP = path.join(__dirname, '..')
const OUT_DIR = path.join(APP, 'public/assets/audio')
const MANIFEST = path.join(APP, 'src/lib/tts/audio-manifest.json')

const args = process.argv.slice(2)
const CHECK_ONLY = args.includes('--check')
const bankPath =
  args.find((a) => !a.startsWith('--')) ??
  path.join(APP, '../loopin-project/loopin-web/src/data/problem-bank.json')

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
const targets = new Map() // norm -> { text, lang, file }
const add = (raw, lang) => {
  const text = stripBrackets(String(raw ?? ''))
  if (!text) return
  const { norm, file } = keyOf(text, lang)
  if (!targets.has(norm)) targets.set(norm, { text, lang, file })
}

for (const w of bank.words ?? []) add(w.english, 'en')
for (const s of bank.sentences ?? []) add(s.english, 'en')

console.log(`문제은행: ${path.relative(APP, bankPath).replace(/\\/g, '/')}`)
console.log(`읽을 대상 ${targets.size}개 (단어 ${bank.words?.length ?? 0} · 문장 ${bank.sentences?.length ?? 0} 기준, 중복 제거)`)

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
function env(key) {
  const file = path.join(APP, '.env.local')
  if (!fs.existsSync(file)) return null
  const line = fs.readFileSync(file, 'utf8').split(/\r?\n/).find((l) => l.startsWith(key + '='))
  return line ? line.slice(key.length + 1).trim().replace(/^["']|["']$/g, '') : null
}

const url = env('VITE_SUPABASE_URL')
const anon = env('VITE_SUPABASE_ANON_KEY')
if (!url || !anon) {
  console.error('.env.local에 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY가 필요합니다.')
  process.exit(1)
}

const TTS_CACHE_VERSION = 'v3' // haksup-tts.ts와 같아야 한다
let ok = 0
let failed = 0

for (const [i, t] of missing.entries()) {
  process.stdout.write(`  [${i + 1}/${missing.length}] ${t.text.slice(0, 40)}… `)
  try {
    const res = await fetch(`${url}/functions/v1/haksup-tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${anon}`,
        apikey: anon,
      },
      body: JSON.stringify({ text: t.text, lang: t.lang, cacheVersion: TTS_CACHE_VERSION }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 500) throw new Error(`너무 작음 (${buf.length}B)`)
    fs.writeFileSync(path.join(OUT_DIR, t.file), buf)
    ok += 1
    console.log(`${(buf.length / 1024).toFixed(0)}KB`)
  } catch (e) {
    failed += 1
    console.log(`실패 — ${e.message}`)
  }
}

// ── 매니페스트 ──────────────────────────────────────────────────────────────
// 앱이 해시를 계산하지 않아도 되도록 「정규화한 텍스트 → 파일명」 표를 남긴다.
// (브라우저 해시는 비동기라 재생 직전에 쓰기 불편하다)
const have = new Set(fs.readdirSync(OUT_DIR))
const manifest = {}
for (const [norm, t] of targets) {
  if (have.has(t.file)) manifest[`${t.lang}:${norm}`] = t.file
}
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n')

const bytes = [...have].reduce((n, f) => n + fs.statSync(path.join(OUT_DIR, f)).size, 0)
console.log(`\n생성 ${ok} · 실패 ${failed}`)
console.log(`매니페스트 ${Object.keys(manifest).length}개 · 오디오 총 ${(bytes / 1048576).toFixed(2)}MB`)
if (failed) console.log('실패한 것은 앱에서 예전처럼 Edge Function으로 재생됩니다.')
