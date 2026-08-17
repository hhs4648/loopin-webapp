/**
 * SVG 안에 박힌 PNG를 **표시 크기에 맞춰** 다시 굽는다.
 *
 * Figma가 뽑은 SVG는 래스터를 원본 해상도 그대로 박아 둔다. 화면에서 70pt짜리
 * 자리에 들어가는 그림이 2048px로 들어 있는 식이라 파일이 수 MB가 된다.
 *
 * 배치 구조:
 *   <rect width=W height=H fill="url(#patternN)"/>
 *   <pattern id="patternN" patternContentUnits="objectBoundingBox" width="1" height="1">
 *     <use href="#imageM" transform="scale(s)"/>       (또는 matrix / translate+scale)
 *   </pattern>
 *   <image id="imageM" width=w height=h href="data:image/png;base64,…"/>
 *
 * 이미지 1px이 차지하는 SVG 단위 = sx * W. 따라서 단위당 픽셀 수 = 1/(sx*W).
 *
 * **배치는 건드리지 않는다.** `<image>`에 width·height가 명시돼 있으면 SVG는 래스터를
 * 그 상자에 맞춰 늘리므로, 원본 픽셀 수는 좌표에 아무 영향이 없다. 데이터만 갈아끼운다.
 *
 *   node shrink-svg-rasters.mjs            # 예상만
 *   node shrink-svg-rasters.mjs --apply    # 적용 (원본은 _backup/*.pre-shrink)
 */
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

/**
 * 단위당 목표 픽셀 수.
 * 프레임은 viewBox 393을 최대 540 CSS px로 늘려 그린다(1.374배). 고밀도 화면
 * DPR 2~3을 감안하면 3.0이면 또렷하다.
 */
const TARGET_PPU = 3.0
/** 이보다 작아지면 뭉개진다 — 그 아래로는 안 줄인다 */
const MIN_PX = 48
/** 이만큼도 안 줄어들면 다시 굽지 않는다 (재인코딩 손실만 생긴다) */
const MIN_GAIN = 0.9

const apply = process.argv.includes('--apply')
const targets = process.argv.slice(2).filter((a) => !a.startsWith('--'))

const IMAGE_RE =
  /<image\b[^>]*?id="([^"]+)"[^>]*?width="([\d.]+)"[^>]*?height="([\d.]+)"[^>]*?(?:xlink:)?href="data:image\/(png|jpeg);base64,([A-Za-z0-9+/=]+)"[^>]*>/g

/** transform 문자열에서 누적 scale(x, y)만 뽑는다 (matrix / scale / translate 혼용) */
function scaleOf(transform) {
  let sx = 1
  let sy = 1
  const re = /(matrix|scale)\(([^)]*)\)/g
  let m
  while ((m = re.exec(transform))) {
    const n = m[2].trim().split(/[\s,]+/).map(Number)
    if (m[1] === 'scale') {
      sx *= n[0]
      sy *= n.length > 1 ? n[1] : n[0]
    } else if (n.length >= 4) {
      sx *= n[0]
      sy *= n[3]
    }
  }
  return { sx, sy }
}

function findPlacement(svg, imageId) {
  const pat = new RegExp(
    String.raw`<pattern[^>]*id="([^"]+)"[^>]*>\s*<use[^>]*href="#` +
      imageId +
      String.raw`"[^>]*transform="([^"]+)"`,
  )
  const m = svg.match(pat)
  if (!m) return null
  const patternId = m[1]
  const { sx, sy } = scaleOf(m[2])
  if (!sx || !sy) return null

  const useRe = new RegExp(
    String.raw`<(rect|path|circle|ellipse)\b[^>]*url\(#` +
      patternId +
      String.raw`\)[^>]*>`,
    'g',
  )
  let best = null
  let hit
  while ((hit = useRe.exec(svg))) {
    const tag = hit[0]
    const w = Number((tag.match(/\swidth="([\d.]+)"/) || [])[1])
    const h = Number((tag.match(/\sheight="([\d.]+)"/) || [])[1])
    if (!w || !h) continue
    if (!best || w * h > best.w * best.h) best = { w, h }
  }
  if (!best) return null
  return { patternId, sx, sy, rect: best }
}

/** 팔레트 양자화가 이득이면 그쪽을, 아니면 원색 그대로 */
async function encodeSmallest(buf, width, height) {
  const base = sharp(buf).resize(width, height, {
    fit: 'fill',
    kernel: 'lanczos3',
  })
  const [plain, paletted] = await Promise.all([
    base.clone().png({ compressionLevel: 9, effort: 10 }).toBuffer(),
    base
      .clone()
      .png({
        compressionLevel: 9,
        effort: 10,
        palette: true,
        quality: 92,
        dither: 0.6,
      })
      .toBuffer(),
  ])
  return paletted.length < plain.length ? paletted : plain
}

async function processFile(file) {
  const original = fs.readFileSync(file, 'utf8')
  let svg = original
  const report = []
  let changed = false

  for (const m of original.matchAll(IMAGE_RE)) {
    const [tag, id, wAttr, hAttr, , b64] = m
    const w = Number(wAttr)
    const h = Number(hAttr)
    const buf = Buffer.from(b64, 'base64')
    const kb = Math.round(buf.length / 1024)

    const place = findPlacement(original, id)
    if (!place) {
      report.push({ skip: '배치를 못 찾음', kb })
      continue
    }
    const ppuX = 1 / (place.sx * place.rect.w)
    const ppuY = 1 / (place.sy * place.rect.h)
    const factor = Math.max(TARGET_PPU / ppuX, TARGET_PPU / ppuY)
    if (factor >= MIN_GAIN) {
      report.push({ skip: `이미 적정(단위당 ${ppuX.toFixed(1)}px)`, kb })
      continue
    }

    const nw = Math.max(MIN_PX, Math.round(w * factor))
    const nh = Math.max(MIN_PX, Math.round(h * factor))

    /*
      **이미 줄여 둔 파일은 건드리지 않는다.**
      `<image>`의 width·height는 배치 상자라 줄일 수 없다(줄이면 그림이 작아진다).
      그래서 속성만 보면 매번 「줄일 게 있다」로 나오고, 다시 돌릴 때마다 팔레트
      양자화가 겹쳐 화질만 깎인다. 래스터의 실제 픽셀 수로 판정한다.
    */
    const meta = await sharp(buf).metadata()
    if ((meta.width ?? Infinity) <= nw * 1.1) {
      report.push({ skip: `이미 줄여 둠(${meta.width}px)`, kb })
      continue
    }

    const out = await encodeSmallest(buf, nw, nh)

    report.push({
      from: `${w}x${h}`,
      to: `${nw}x${nh}`,
      ppu: ppuX.toFixed(1),
      kb,
      newKb: Math.round(out.length / 1024),
    })

    if (apply) {
      const newTag = tag.replace(
        /data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+/,
        `data:image/png;base64,${out.toString('base64')}`,
      )
      svg = svg.replace(tag, newTag)
      changed = true
    }
  }

  if (apply && changed) {
    fs.mkdirSync('_backup', { recursive: true })
    const bak = path.join('_backup', `${path.basename(file)}.pre-shrink`)
    if (!fs.existsSync(bak)) fs.copyFileSync(file, bak)
    fs.writeFileSync(file, svg)
  }
  return {
    report,
    before: Buffer.byteLength(original),
    after: Buffer.byteLength(svg),
  }
}

const files = targets.length
  ? targets
  : fs
      .readdirSync('.')
      .filter((f) => f.endsWith('.svg') && fs.statSync(f).size > 150000)

let totalBefore = 0
let totalAfter = 0
for (const f of files) {
  const { report, before, after } = await processFile(f)
  if (!report.length) continue
  totalBefore += before
  totalAfter += after
  console.log(
    `\n${f}  ${(before / 1e6).toFixed(2)} MB` +
      (apply ? ` -> ${(after / 1e6).toFixed(2)} MB` : ''),
  )
  for (const r of report) {
    if (r.skip) console.log(`   건너뜀 ${r.kb}KB — ${r.skip}`)
    else
      console.log(
        `   ${r.from} -> ${r.to}   (단위당 ${r.ppu}px)   ${r.kb}KB -> ${r.newKb}KB`,
      )
  }
}
console.log(
  `\n합계 ${(totalBefore / 1e6).toFixed(1)} MB` +
    (apply
      ? ` -> ${(totalAfter / 1e6).toFixed(1)} MB`
      : ' (예상만 · --apply 필요)'),
)
