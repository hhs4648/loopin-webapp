const fs = require('fs')
const s = fs.readFileSync('public/assets/assignment-complete-v7.svg', 'utf8')

// Collect green-ish hex near bottom (common fills)
const fills = [...s.matchAll(/#[0-9A-Fa-f]{6}/g)].map((m) => m[0].toUpperCase())
const uniq = [...new Set(fills)]
const mint = uniq.filter((c) => {
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  return g > 160 && g > r && g > b - 10 && b > 140
})
console.log('mint/teal candidates', mint)

// Look for rects/paths with large fills in bottom band comments
for (const c of ['#7EE0C0', '#8FDFBE', '#A6EBBF', '#72E1A8', '#6FCFA5', '#74EDB3', '#B8EFC8', '#9AE8C8', '#85E0C0', '#7AD9B8']) {
  console.log(c, (s.match(new RegExp(c, 'gi')) || []).length)
}

// Search stop-color greens
const stops = [...s.matchAll(/stop-color="(#[0-9A-Fa-f]{3,8})"/gi)].map((m) => m[1].toUpperCase())
console.log('unique stops sample', [...new Set(stops)].filter((c) => {
  if (!c.startsWith('#')) return false
  const r = parseInt(c.slice(1, 3), 16)
  const g = parseInt(c.slice(3, 5), 16)
  const b = parseInt(c.slice(5, 7), 16)
  return g > 150 && g >= r
}).slice(0, 40))
