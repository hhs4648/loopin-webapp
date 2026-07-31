const fs = require('fs')
const s = fs.readFileSync('public/assets/main-screen-long.svg', 'utf8')

// Inspect lock badge groups (filters around week2)
for (const id of [
  'filter12_d_5846_4978',
  'filter13_d_5846_4978',
  'filter14_d_5846_4978',
  'filter9_d_5846_4978',
  'filter10_d_5846_4978',
  'filter11_d_5846_4978',
  'filter19_d_5846_4978',
  'filter20_d_5846_4978',
]) {
  const needle = `filter="url(#${id})"`
  const idx = s.indexOf(needle)
  if (idx < 0) {
    console.log(id, 'missing')
    continue
  }
  const chunk = s.slice(idx, idx + 700)
  const op = chunk.match(/opacity="([^"]+)"/)
  const rects = [...chunk.matchAll(/<(?:rect|circle|path)[^>]{0,120}/g)].slice(0, 6)
  console.log('\n' + id, 'op', op && op[1])
  rects.forEach((r) => console.log(' ', r[0].slice(0, 110)))
}
