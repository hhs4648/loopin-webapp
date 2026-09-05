/**
 * 앱 프레임을 **지금 눈에 보이는 영역**에 맞춘다.
 *
 * 카카오·인스타 인앱 브라우저는 주소창·하단 툴바를 웹뷰 위에 얹는다.
 * `100dvh`는 그 툴바를 포함한 큰 높이를 주는 경우가 많아서, 393×852 프레임이
 * 실제 화면보다 커지고 아래가 잘린다 → 그때는 visualViewport를 쓴다.
 *
 * 다만 **키보드**가 올라오면 visualViewport(또는 Android adjustResize 시 window)도
 * 짧아진다. 그때 프레임까지 줄이면 시안 전체가 찌그러지고 좌우 레터박스가 생긴다.
 * 키보드는 프레임 크기를 유지한 채, 포커스된 입력칸이 가려지지 않게
 * `--keyboard-shift` 로만 올린다.
 *
 * Android: Capacitor `Keyboard.resize`는 **iOS 전용**. 네이티브는
 * `AndroidManifest`의 `windowSoftInputMode=adjustNothing`으로 웹뷰 축소를 막는다.
 */
export function startAppViewportSync(): () => void {
  const root = document.documentElement
  const KEYBOARD_GAP_PX = 12
  /** 이보다 많이 줄면 키보드로 본다 (툴바만으로는 보통 더 작음) */
  const KEYBOARD_MIN_PX = 80

  /** Capacitor Keyboard 플러그인이 알려 준 높이 (native). 없으면 0 */
  let nativeKeyboardPx = 0
  /**
   * 키보드가 없을 때 레이아웃 크기.
   * Android가 웹뷰를 줄여도(구 빌드·adjustResize) 이 값으로 프레임을 고정한다.
   */
  let stableLayoutH = window.innerHeight
  let stableLayoutW = window.innerWidth

  const isTextFieldFocused = () => {
    const el = document.activeElement
    return (
      el instanceof HTMLElement &&
      (el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable)
    )
  }

  const applyFrame = () => {
    const vv = window.visualViewport
    const layoutH = window.innerHeight
    const layoutW = window.innerWidth
    const visualH = vv?.height ?? layoutH
    const visualW = vv?.width ?? layoutW
    const offsetTop = vv?.offsetTop ?? 0

    /** 웹뷰는 그대로인데 IME만 덮는 경우 (adjustNothing / iOS overlays) */
    const overlayInset = Math.max(
      nativeKeyboardPx,
      layoutH - visualH - offsetTop,
      stableLayoutH - visualH - offsetTop,
    )
    /** WebView 자체가 줄어든 경우 — 입력 포커스 있을 때만 키보드로 본다(회전과 구분) */
    const layoutDrop = Math.max(0, stableLayoutH - layoutH)
    const webViewShrunkForIme =
      isTextFieldFocused() && layoutDrop >= KEYBOARD_MIN_PX

    const keyboardOpen =
      overlayInset >= KEYBOARD_MIN_PX || webViewShrunkForIme

    if (!keyboardOpen) {
      stableLayoutH = layoutH
      stableLayoutW = layoutW
    }

    const buried = Math.max(
      overlayInset,
      webViewShrunkForIme ? layoutDrop : 0,
    )

    const frameH = keyboardOpen ? stableLayoutH : Math.round(visualH)
    const frameW = keyboardOpen
      ? stableLayoutW
      : Math.round(Math.min(visualW, layoutW))

    root.style.setProperty('--app-vh', `${frameH}px`)
    root.style.setProperty('--app-vw', `${frameW}px`)
    root.style.setProperty(
      '--app-v-top',
      keyboardOpen ? '0px' : `${Math.round(offsetTop)}px`,
    )
    root.style.setProperty(
      '--app-v-left',
      keyboardOpen ? '0px' : `${Math.round(vv?.offsetLeft ?? 0)}px`,
    )
    root.style.setProperty(
      '--keyboard-inset',
      keyboardOpen ? `${Math.round(buried)}px` : '0px',
    )
    if (!keyboardOpen) {
      root.style.setProperty('--keyboard-shift', '0px')
    }
  }

  const applyKeyboardShift = () => {
    const inset = Number.parseFloat(
      root.style.getPropertyValue('--keyboard-inset') || '0',
    )
    if (!(inset >= KEYBOARD_MIN_PX) || !isTextFieldFocused()) {
      root.style.setProperty('--keyboard-shift', '0px')
      return
    }

    const el = document.activeElement as HTMLElement
    const currentShift = Number.parseFloat(
      root.style.getPropertyValue('--keyboard-shift') || '0',
    )
    const rect = el.getBoundingClientRect()
    // transform 적용 후 좌표이므로, 시프트 전 위치로 되돌린 뒤 필요한 올림을 계산
    const naturalBottom = rect.bottom + currentShift
    const safeBottom = stableLayoutH - inset - KEYBOARD_GAP_PX
    const overflow = naturalBottom - safeBottom
    root.style.setProperty(
      '--keyboard-shift',
      `${Math.max(0, Math.round(overflow))}px`,
    )
  }

  const apply = () => {
    applyFrame()
    applyKeyboardShift()
  }

  apply()
  window.visualViewport?.addEventListener('resize', apply)
  window.visualViewport?.addEventListener('scroll', apply)
  window.addEventListener('resize', apply)
  document.addEventListener('focusin', apply)
  document.addEventListener('focusout', () => {
    window.setTimeout(apply, 0)
  })

  let removeNative: (() => void) | undefined
  void import('@capacitor/keyboard')
    .then(({ Keyboard }) => {
      const show = (info: { keyboardHeight: number }) => {
        nativeKeyboardPx = info.keyboardHeight
        apply()
      }
      const hide = () => {
        nativeKeyboardPx = 0
        apply()
      }
      void Keyboard.addListener('keyboardWillShow', show)
      void Keyboard.addListener('keyboardDidShow', show)
      void Keyboard.addListener('keyboardWillHide', hide)
      void Keyboard.addListener('keyboardDidHide', hide)
      removeNative = () => {
        void Keyboard.removeAllListeners()
      }
    })
    .catch(() => {
      /* 웹·플러그인 미설치 — visualViewport 휴리스틱만 사용 */
    })

  return () => {
    window.visualViewport?.removeEventListener('resize', apply)
    window.visualViewport?.removeEventListener('scroll', apply)
    window.removeEventListener('resize', apply)
    document.removeEventListener('focusin', apply)
    removeNative?.()
  }
}
