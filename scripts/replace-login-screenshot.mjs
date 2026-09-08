/**
 * 상태바 없는 로그인 PNG로 01-login raw / iPad13 장표 교체.
 */
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const SRC = process.argv[2]
if (!SRC) {
  console.error('usage: node scripts/replace-login-screenshot.mjs <source.png>')
  process.exit(1)
}

const OUT_DIR = join(__dirname, '..', 'tmp-store-screenshots', 'ipad-13')
mkdirSync(OUT_DIR, { recursive: true })

const IPAD_W = 2064
const IPAD_H = 2752
const PHONE_W = 980
const PHONE_H = Math.round((PHONE_W * 852) / 393)
const RADIUS = 64
const BEZEL = 18
const RAW_W = 1179
const RAW_H = 2556

async function roundedPhone(buffer) {
  const resized = await sharp(buffer)
    .resize(PHONE_W, PHONE_H, { fit: 'cover' })
    .png()
    .toBuffer()

  const mask = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${PHONE_W}" height="${PHONE_H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${PHONE_W}" height="${PHONE_H}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/>
</svg>`)

  return sharp(resized)
    .composite([{ input: await sharp(mask).png().toBuffer(), blend: 'dest-in' }])
    .png()
    .toBuffer()
}

const phoneLeft = Math.round((IPAD_W - PHONE_W) / 2)
const phoneTop = Math.round((IPAD_H - PHONE_H) / 2)

const bgSvg = Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${IPAD_W}" height="${IPAD_H}" viewBox="0 0 ${IPAD_W} ${IPAD_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#DBEAFE"/>
      <stop offset="100%" stop-color="#F8FAFC"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="20" stdDeviation="28" flood-color="#0B3A66" flood-opacity="0.18"/>
    </filter>
  </defs>
  <rect width="${IPAD_W}" height="${IPAD_H}" fill="url(#bg)"/>
  <rect x="${phoneLeft - BEZEL}" y="${phoneTop - BEZEL}"
        width="${PHONE_W + BEZEL * 2}" height="${PHONE_H + BEZEL * 2}"
        rx="${RADIUS + 8}" ry="${RADIUS + 8}" fill="#0F172A" filter="url(#shadow)"/>
</svg>`)

await sharp(SRC)
  .resize(RAW_W, RAW_H, { fit: 'cover' })
  .png()
  .toFile(join(OUT_DIR, '01-login-raw.png'))

await sharp(SRC).png().toFile(join(OUT_DIR, '01-login-phone-clean.png'))

const phone = await roundedPhone(SRC)
const bg = await sharp(bgSvg).png().toBuffer()
await sharp(bg)
  .composite([{ input: phone, left: phoneLeft, top: phoneTop }])
  .png()
  .toFile(join(OUT_DIR, '01-login-ipad13.png'))

const rawMeta = await sharp(join(OUT_DIR, '01-login-raw.png')).metadata()
const ipadMeta = await sharp(join(OUT_DIR, '01-login-ipad13.png')).metadata()
console.log('raw', `${rawMeta.width}x${rawMeta.height}`)
console.log('ipad13', `${ipadMeta.width}x${ipadMeta.height}`)
console.log('wrote', OUT_DIR)
