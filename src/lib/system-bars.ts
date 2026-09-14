import { SystemBars, SystemBarsStyle } from '@capacitor/core'
import { isNativeApp } from './native'

/**
 * OS 상태바(시계·배터리·신호)를 **항상 맨 앞**에 보이게 한다.
 *
 * 앱 콘텐츠는 화면 맨 위까지 채우고(웹뷰를 상태바 높이만큼 줄이지 않음),
 * 네이티브 상태바 아이콘만 그 위에 겹친다.
 *
 * Capacitor 이름 주의:
 * - `SystemBarsStyle.Light` → **어두운** 아이콘 (흰·밝은 배경용)
 * - `SystemBarsStyle.Dark` → **밝은** 아이콘 (파란·어두운 배경용)
 *
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
