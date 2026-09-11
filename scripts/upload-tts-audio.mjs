/**
 * 미리 만들어 둔 음성을 **Supabase Storage 공개 버킷에 올린다.**
 *
 * 왜 필요한가: 예전에는 mp3를 `public/assets/audio/`에 두고 저장소와 앱 번들로 날랐다.
 * 그 방식이 두 번 터졌다 —
 *   1) 2026-09-09, 7,624개를 만들었는데 GitHub 푸시가 막혀 절반만 올라갔고,
 *      매니페스트만 먼저 배포돼 404 → 단어 2,034개가 브라우저 내장 음성으로 나갔다.
 *   2) 그 잔해(미커밋 5,374개)가 로컬 릴리스 빌드에 쓸려 들어가 AAB가 110MB가 됐다.
 * 오디오는 코드가 아니라 데이터다. 저장소가 아니라 오브젝트 스토리지에 있어야 한다.
 *
 * 파일명 규칙은 앱·Edge Function·생성 스크립트가 **셋 다 같다** (`{lang}-{sha1앞16}.mp3`).
 * 그래서 여기서는 이름을 그대로 두고 버킷 루트에 올리기만 하면 된다.
 *
 * 사용법:
 *   npm run tts:upload            # 없는 것만 올린다 (이어하기 가능)
 *   npm run tts:upload -- --dry   # 뭘 올릴지만 보고 끝
 *
 * 키: `SUPABASE_SERVICE_ROLE_KEY`가 있으면 그걸 쓰고, 없으면 로그인된 Supabase CLI에서
 * 받아온다. **어느 쪽이든 화면에 찍지 않는다.**
 */
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const APP = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const SRC_DIR = path.join(APP, 'tts-audio')
const BUCKET = 'tts-audio'
const DRY = process.argv.includes('--dry')

/** 1년 캐시 — 파일명이 내용 해시라 절대 바뀌지 않는다 */
const CACHE_CONTROL = 'public, max-age=31536000, immutable'
const CONTENT_TYPE = 'audio/mpeg'
/** 동시 업로드 수. 올리면 빨라지지만 429가 난다 */
const CONCURRENCY = 12

function readEnvLocal() {
  const out = {}
  const f = path.join(APP, '.env.local')
  if (!fs.existsSync(f)) return out
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) out[m[1]] = m[2].trim()
  }
  return out
}

const env = readEnvLocal()
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL
if (!SUPABASE_URL) {
  console.error('VITE_SUPABASE_URL을 찾지 못했습니다 (.env.local 확인).')
  process.exit(1)
}
const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0]

function serviceKey() {
  const fromEnv =
    process.env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY
  if (fromEnv) return fromEnv
  // 로그인된 CLI에서 받아온다 (값은 출력하지 않는다)
  const raw = execSync(
    `npx supabase projects api-keys --project-ref ${PROJECT_REF} --output json`,
    { cwd: APP, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 1 << 24 },
  )
  const rows = JSON.parse(raw)
  const row = (Array.isArray(rows) ? rows : []).find((r) => r.name === 'service_role')
  if (!row?.api_key) throw new Error('service_role 키를 받지 못했습니다. `npx supabase login` 후 다시 시도하세요.')
  return row.api_key
}

const KEY = serviceKey()
const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` }

/** 버킷에 이미 있는 파일 이름 전부 (페이지네이션) */
async function listExisting() {
  const names = new Set()
  const LIMIT = 1000
  for (let offset = 0; ; offset += LIMIT) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/list/${BUCKET}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ prefix: '', limit: LIMIT, offset, sortBy: { column: 'name', order: 'asc' } }),
    })
    if (!res.ok) throw new Error(`목록 조회 실패 ${res.status}: ${(await res.text()).slice(0, 200)}`)
    const rows = await res.json()
    for (const r of rows) if (r?.name) names.add(r.name)
    if (rows.length < LIMIT) break
  }
  return names
}

async function upload(file) {
  const body = fs.readFileSync(path.join(SRC_DIR, file))
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${BUCKET}/${file}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': CONTENT_TYPE,
      'Cache-Control': CACHE_CONTROL,
      'x-upsert': 'true',
    },
    body,
  })
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 160)}`)
}

if (!fs.existsSync(SRC_DIR)) {
  console.error(`음성 폴더가 없습니다: ${SRC_DIR}`)
  process.exit(1)
}
const local = fs.readdirSync(SRC_DIR).filter((f) => f.endsWith('.mp3'))
const bytes = local.reduce((n, f) => n + fs.statSync(path.join(SRC_DIR, f)).size, 0)
console.log(`로컬 ${local.length}개 · ${(bytes / 1e6).toFixed(1)} MB`)
console.log(`버킷 ${PROJECT_REF} / ${BUCKET} 조회 중…`)

const existing = await listExisting()
const todo = local.filter((f) => !existing.has(f))
const todoBytes = todo.reduce((n, f) => n + fs.statSync(path.join(SRC_DIR, f)).size, 0)
console.log(`이미 있음 ${local.length - todo.length}개 · 올릴 것 ${todo.length}개 (${(todoBytes / 1e6).toFixed(1)} MB)\n`)

if (DRY || todo.length === 0) {
  console.log(DRY ? '(--dry 이므로 여기서 끝냅니다)' : '올릴 것이 없습니다.')
  process.exit(0)
}

let done = 0
const failures = []
const started = Date.now()
let cursor = 0
async function worker() {
  while (cursor < todo.length) {
    const file = todo[cursor++]
    try {
      await upload(file)
    } catch (e) {
      failures.push(`${file}: ${e.message}`)
    }
    done++
    if (done % 250 === 0 || done === todo.length) {
      const s = (Date.now() - started) / 1000
      console.log(`  ${done}/${todo.length} · ${(done / s).toFixed(0)}개/초 · 실패 ${failures.length}`)
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker))

console.log(`\n올림 ${done - failures.length}개 · 실패 ${failures.length}개 · ${((Date.now() - started) / 1000).toFixed(0)}초`)
if (failures.length) {
  console.log('\n실패 (앞 10개):')
  failures.slice(0, 10).forEach((l) => console.log('  ' + l))
  console.log('\n다시 실행하면 실패분만 재시도합니다.')
  process.exit(1)
}
