const fs = require('fs')
const s = fs.readFileSync('public/assets/main-screen-long.svg', 'utf8')

// Collect paths in region that could be week2 label (y 580-640, x 150-300)
function collect(y0, y1, x0, x1) {
  const re = /<path\b([^>]*)\/?>/g
  let m
  const hits = []
  while ((m = re.exec(s))) {
    const full = m[0]
    let dAttr = full.match(/\bd="([^"]*)"/)
    if (!dAttr) continue
    const mt = dAttr[1].match(/^[Mm]\s*([\d.+-]+)[, ]+([\d.+-]+)/)
    if (!mt) continue
    const x = parseFloat(mt[1])
    const y = parseFloat(mt[2])
    if (y < y0 || y > y1 || x < x0 || x > x1) continue
    const fill = (full.match(/\bfill="([^"]*)"/) || [])[1] || '?'
    const op = (full.match(/\bopacity="([^"]*)"/) || [])[1]
    hits.push({ x, y, fill, op, i: m.index, len: full.length })
  }
  return hits
}

for (const [name, y0, y1] of [
  ['w2', 580, 645],
  ['w3', 790, 860],
  ['w4', 990, 1060],
  ['w5', 1200, 1270],
]) {
  const hits = collect(y0, y1, 140, 320)
  const fills = {}
  for (const h of hits) fills[h.fill + '|op=' + h.op] = (fills[h.fill + '|op=' + h.op] || 0) + 1
  console.log('\n' + name, hits.length, fills)
  // show unique fills
}

// Look specifically for fill white OR very light with many paths forming text
const w2 = collect(580, 645, 140, 320)
console.log('\nw2 detail fills', [...new Set(w2.map((h) => h.fill))])
console.log('w2 sample', w2.filter((h) => h.fill !== '#8C94A1').slice(0, 15))

// Search opacity groups that are NOT 0 containing paths at y~600
const gre = /<g([^>]*)>/g
let gm
while ((gm = gre.exec(s))) {
  const attrs = gm[1]
  if (/opacity="0"/.test(attrs)) continue
  const start = gm.index
  // peek
  const chunk = s.slice(start, start + 8000)
  if (!/616\.371|832\.313|주차|fill="#FFF"|fill="white"|fill="#FFFFFF"/i.test(chunk)) continue
  if (chunk.includes('616.371') || chunk.includes('832.313')) {
    const pathCount = (chunk.match(/<path /g) || []).length
    console.log('g hit', attrs.slice(0, 100), 'paths~', pathCount, 'at', start)
  }
}
