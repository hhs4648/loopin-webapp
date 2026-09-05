/**
 * login-screen.svg 상단 Figma 상태바(18:00 등)를 배경색으로 덮어 제거한다.
 * 결과는 public/assets/login-screen.svg 를 PNG로 바꾸지 않고,
 * 상단만 패치한 SVG(또는 PNG)로 교체한다.
 */
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const asset = join(root, 'public', 'assets', 'login-screen.svg')
const backupDir = join(root, '_design-source')
mkdirSync(backupDir, { recursive: true })

const W = 393
const H = 852
/** Figma에 박힌 상태바 높이(대략). 로고는 더 아래 */
const STATUS_H = 44

const svgBuf = readFileSync(asset)
const rendered = await sharp(svgBuf, { density: 3 })
  .resize(W * 3, H * 3)
  .png()
  .toBuffer()

const hiW = W * 3
const hiH = H * 3
const statusHi = STATUS_H * 3

// 상태바 바로 아래 픽셀로 배경색 샘플
const sampleY = statusHi + 6
const { data } = await sharp(rendered)
  .extract({ left: Math.floor(hiW / 2), top: sampleY, width: 1, height: 1 })
  .raw()
  .toBuffer({ resolveWithObject: true })
const [r, g, b] = data
const fill = { r, g, b, alpha: 255 }
console.log('fill', fill)

const cover = await sharp({
  create: {
    width: hiW,
    height: statusHi,
    channels: 4,
    background: fill,
  },
}).png().toBuffer()

const cleaned = await sharp(rendered)
  .composite([{ input: cover, left: 0, top: 0 }])
  .png()
  .toBuffer()

// 백업
copyFileSync(asset, join(backupDir, 'login-screen-with-statusbar.svg'))

// 앱은 여전히 .svg 경로를 쓰므로, 정리본을 SVG 래퍼 + embedded PNG로 저장
// (원본 1.16MB SVG와 동일하게 img src로 씀)
const png64 = cleaned.toString('base64')
const wrapped = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" fill="none">
  <image width="${W}" height="${H}" xlink:href="data:image/png;base64,${png64}"/>
</svg>
`
writeFileSync(asset, wrapped)

// 검수용 썸네일
const outTmp = join(root, 'tmp-store-screenshots')
mkdirSync(outTmp, { recursive: true })
await sharp(cleaned).resize(W, H).png().toFile(join(outTmp, 'login-asset-no-statusbar.png'))
await sharp(cleaned)
  .resize(W, H)
  .extract({ left: 0, top: 0, width: W, height: 60 })
  .png()
  .toFile(join(outTmp, 'login-asset-top60-after.png'))

console.log('updated', asset)
console.log('backup', join(backupDir, 'login-screen-with-statusbar.svg'))
