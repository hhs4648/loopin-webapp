/**
 * App Store용 iPad 13형(2064×2752) 마케팅 장표 스크린샷.
 * 폰 UI를 기기 프레임 + 문구 + 그라데이션 배경에 올린다.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium, devices } from 'playwright'
import sharp from 'sharp'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT_DIR = join(__dirname, '..', 'tmp-store-screenshots', 'ipad-13')
const BASE_URL = process.env.SCREENSHOT_BASE_URL ?? 'https://loopin-webapp.vercel.app'
const DEMO_PASSWORD = process.env.VITE_DEMO_LOGIN_PASSWORD ?? '1234'

const IPAD_W = 2064
const IPAD_H = 2752

/** 장표 안 폰 프레임 크기 (비율 393:852 유지) */
const PHONE_W = 980
const PHONE_H = Math.round((PHONE_W * 852) / 393)
const RADIUS = 64
const BEZEL = 18

mkdirSync(OUT_DIR, { recursive: true })

function marketingSvg({ bgTop, bgBottom }) {
  const phoneLeft = Math.round((IPAD_W - PHONE_W) / 2)
  const phoneTop = Math.round((IPAD_H - PHONE_H) / 2)

  return Buffer.from(`<?xml version="1.0" encoding="UTF-8"?>
<svg width="${IPAD_W}" height="${IPAD_H}" viewBox="0 0 ${IPAD_W} ${IPAD_H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${bgTop}"/>
      <stop offset="100%" stop-color="${bgBottom}"/>
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
}

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

async function toMarketingShot(buffer, outPath, copy) {
  const phone = await roundedPhone(buffer)
  const bg = await sharp(marketingSvg(copy)).png().toBuffer()
  const phoneLeft = Math.round((IPAD_W - PHONE_W) / 2)
  const phoneTop = Math.round((IPAD_H - PHONE_H) / 2)

  await sharp(bg)
    .composite([
      {
        input: phone,
        left: phoneLeft,
        top: phoneTop,
      },
    ])
    .png()
    .toFile(outPath)

  console.log('wrote', outPath)
}

async function capturePhone(page, name, copy) {
  const raw = await page.screenshot({ type: 'png', fullPage: false })
  writeFileSync(join(OUT_DIR, `${name}-raw.png`), raw)
  await toMarketingShot(raw, join(OUT_DIR, `${name}-ipad13.png`), copy)
}

async function main() {
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro'],
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 3,
    locale: 'ko-KR',
  })
  const page = await context.newPage()

  // 스플래시
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await capturePhone(page, '00-splash', {
    bgTop: '#BFDBFE',
    bgBottom: '#EFF6FF',
  })

  // 로그인
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.addStyleTag({
    content:
      'button[aria-label="심사용 데모 로그인"]{display:none!important;}',
  })
  await capturePhone(page, '01-login', {
    bgTop: '#DBEAFE',
    bgBottom: '#F8FAFC',
  })

  // 데모 로그인 → 맵
  await page.addStyleTag({
    content:
      'button[aria-label="심사용 데모 로그인"]{display:block!important;}',
  })
  const demoBtn = page.getByRole('button', { name: '심사용 데모 로그인' })
  if (await demoBtn.count()) {
    await demoBtn.click()
    await page.waitForTimeout(400)
    const pw = page.locator('#demo-login-password')
    if (await pw.count()) {
      await pw.fill(DEMO_PASSWORD)
      await page.getByRole('button', { name: '확인' }).click()
    }
    await page.waitForTimeout(2800)
  }

  console.log('after demo login:', page.url())
  await capturePhone(page, '02-castle-map', {
    bgTop: '#BBF7D0',
    bgBottom: '#F0FDF4',
  })

  // 시작하기 눌러 학습 화면 시도
  const start = page.getByRole('button', { name: /시작하기/ }).first()
  if (await start.count()) {
    await start.click().catch(() => {})
    await page.waitForTimeout(2000)
    await capturePhone(page, '03-learning', {
      bgTop: '#A5F3FC',
      bgBottom: '#ECFEFF',
    })
  }

  await browser.close()
  console.log('done →', OUT_DIR)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
