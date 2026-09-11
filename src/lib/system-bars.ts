import { SystemBars, SystemBarsStyle } from '@capacitor/core'
import { isNativeApp } from './native'

/**
 * OS 상태바(시계·배터리·신호)를 **항상 보이게** 맞춘다.
 *
 * Capacitor 이름 주의:
 * - `SystemBarsStyle.Light` → **어두운** 아이콘 (흰·밝은 배경용)
 * - `SystemBarsStyle.Dark` → **밝은** 아이콘 (파란·어두운 배경용)
 *
 * 예전 설정이 `DARK` + iOS `black-translucent`라 아이콘이 흰색이었다.
 * 메인(파란 맵)에서는 보였지만, 로그인·온보딩·설정·문제 등 흰 화면에서는
 * 아이콘이 배경에 녹아 안 보였다. 기본은 Light(어두운 아이콘)로 통일한다.
 * 가짜 시계 SVG는 그리지 않는다 — 폰 OS 상태바만 쓴다.
 */
export async function ensureNativeSystemBarsVisible(): Promise<void> {
  if (!isNativeApp()) return
  try {
    await SystemBars.show()
    await SystemBars.setStyle({ style: SystemBarsStyle.Light })
  } catch (error) {
    // iOS 일부 버전에서 SystemBars 미구현일 수 있음 — 상태바 자체는 OS가 그림
    console.warn('[system-bars] sync failed', error)
  }
}
