/**
 * 앱 프레임을 **지금 눈에 보이는 영역**에 맞춘다.
 *
 * 카카오·인스타 인앱 브라우저는 주소창·하단 툴바를 웹뷰 위에 얹는다.
 * `100dvh`는 그 툴바를 포함한 큰 높이를 주는 경우가 많아서, 393×852 프레임이
 * 실제 화면보다 커지고 아래가 잘린다 → 그때는 visualViewport를 쓴다.
 *
 * 키보드는 프레임 **크기**를 유지한 채 `--keyboard-shift` 로만 올린다.
 * 시프트는 키보드 높이를 넘지 않게 캡해서, 초대코드처럼 통째로 튀었다 내려오는
 * 현상을 막는다. 입력과 함께 보여야 하는 CTA는 `data-keyboard-end` 로 표시한다.
 *
 * Android: Capacitor `Keyboard.resize`는 iOS 전용.
 * `AndroidManifest` `windowSoftInputMode=adjustNothing` 으로 웹뷰 축소를 막는다.
 */
export function startAppViewportSync(): () => void {
  const root = document.documentElement
  const KEYBOARD_GAP_PX = 16
  /** 열림 판정 (이보다 크면 키보드) */
  const KEYBOARD_OPEN_PX = 80
  /** 닫힘 판정 — 열림보다 낮춰 깜빡임(올렸다 내림)을 줄인다 */
  const KEYBOARD_CLOSE_PX = 40

  let nativeKeyboardPx = 0
  let keyboardOpen = false
  let stableLayoutH = window.innerHeight
  let stableLayoutW = window.innerWidth
  let raf = 0

  const isTextFieldFocused = () => {
    const el = document.activeElement
    return (
      el instanceof HTMLElement &&
      (el.tagName === 'INPUT' ||
        el.tagName === 'TEXTAREA' ||
        el.isContentEditable)
    )
  }

  /** 브라우저가 포커스로 스크롤한 값을 되돌린다 (시프트와 겹치면 이중으로 뛴다) */
  const resetBrowserScroll = () => {
    if (window.scrollY !== 0 || window.scrollX !== 0) {
      window.scrollTo(0, 0)
    }
  }

  const measureInset = () => {
    const vv = window.visualViewport
    const layoutH = window.innerHeight
    const layoutW = window.innerWidth
    const visualH = vv?.height ?? layoutH
    const visualW = vv?.width ?? layoutW
    const offsetTop = vv?.offsetTop ?? 0
    const overlay = Math.max(
      nativeKeyboardPx,
      layoutH - visualH - offsetTop,
      stableLayoutH - visualH - offsetTop,
    )
    const layoutDrop = Math.max(0, stableLayoutH - layoutH)
    const shrunkWithFocus =
      isTextFieldFocused() && layoutDrop >= KEYBOARD_OPEN_PX
    return {
      layoutH,
      layoutW,
      visualH,
      visualW,
      offsetTop,
      offsetLeft: vv?.offsetLeft ?? 0,
      overlay,
      layoutDrop,
      shrunkWithFocus,
      inset: Math.max(overlay, shrunkWithFocus ? layoutDrop : 0),
    }
  }

  const applyFrame = (m: ReturnType<typeof measureInset>) => {
    if (keyboardOpen) {
      if (m.inset < KEYBOARD_CLOSE_PX && !isTextFieldFocused()) {
        keyboardOpen = false
      }
    } else if (m.inset >= KEYBOARD_OPEN_PX || m.shrunkWithFocus) {
      keyboardOpen = true
    }

    if (!keyboardOpen) {
      stableLayoutH = m.layoutH
      stableLayoutW = m.layoutW
    }

    const frameH = keyboardOpen ? stableLayoutH : Math.round(m.visualH)
    const frameW = keyboardOpen
      ? stableLayoutW
      : Math.round(Math.min(m.visualW, m.layoutW))

    root.style.setProperty('--app-vh', `${frameH}px`)
    root.style.setProperty('--app-vw', `${frameW}px`)
    root.style.setProperty(
      '--app-v-top',
      keyboardOpen ? '0px' : `${Math.round(m.offsetTop)}px`,
    )
    root.style.setProperty(
      '--app-v-left',
      keyboardOpen ? '0px' : `${Math.round(m.offsetLeft)}px`,
    )
    root.style.setProperty(
      '--keyboard-inset',
      keyboardOpen ? `${Math.round(m.inset)}px` : '0px',
    )
    if (!keyboardOpen) {
      root.style.setProperty('--keyboard-shift', '0px')
    }
  }

  const applyKeyboardShift = (inset: number) => {
    if (!keyboardOpen || inset < KEYBOARD_CLOSE_PX || !isTextFieldFocused()) {
      root.style.setProperty('--keyboard-shift', '0px')
      return
    }

    resetBrowserScroll()

    const el = document.activeElement as HTMLElement
    const currentShift = Number.parseFloat(
      root.style.getPropertyValue('--keyboard-shift') || '0',
    )

    // 입력 + `data-keyboard-end`(입장하기 등) 둘 다 키보드 위에 오게
    let naturalBottom = el.getBoundingClientRect().bottom + currentShift
    document.querySelectorAll<HTMLElement>('[data-keyboard-end]').forEach((node) => {
      naturalBottom = Math.max(
        naturalBottom,
        node.getBoundingClientRect().bottom + currentShift,
      )
    })

    const vv = window.visualViewport
    const visibleBottom =
      (vv?.offsetTop ?? 0) + (vv?.height ?? window.innerHeight)
    const safeBottom = Math.min(
      stableLayoutH - inset - KEYBOARD_GAP_PX,
      visibleBottom - KEYBOARD_GAP_PX,
    )

    const needed = Math.max(0, Math.round(naturalBottom - safeBottom))
    // 키보드 높이보다 더 올리면 하단 내비가 화면 맨 위로 튀는 현상이 난다
    const shift = Math.min(needed, Math.round(inset))

    root.style.setProperty('--keyboard-shift', `${shift}px`)
  }

  const applyNow = () => {
    const m = measureInset()
    applyFrame(m)
    applyKeyboardShift(keyboardOpen ? m.inset : 0)
  }

  const apply = () => {
    if (raf) cancelAnimationFrame(raf)
    raf = requestAnimationFrame(() => {
      raf = 0
      applyNow()
    })
  }

  applyNow()
  window.visualViewport?.addEventListener('resize', apply)
  window.visualViewport?.addEventListener('scroll', apply)
  window.addEventListener('resize', apply)
  document.addEventListener('focusin', apply)
  document.addEventListener('focusout', () => {
    window.setTimeout(apply, 50)
  })

  let removeNative: (() => void) | undefined
  void import('@capacitor/keyboard')
    .then(({ Keyboard }) => {
      const show = (info: { keyboardHeight: number }) => {
        nativeKeyboardPx = info.keyboardHeight
        keyboardOpen = true
        resetBrowserScroll()
        apply()
      }
      const hide = () => {
        nativeKeyboardPx = 0
        keyboardOpen = false
        root.style.setProperty('--keyboard-shift', '0px')
        root.style.setProperty('--keyboard-inset', '0px')
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
      /* 웹·플러그인 미설치 */
    })

  return () => {
    if (raf) cancelAnimationFrame(raf)
    window.visualViewport?.removeEventListener('resize', apply)
    window.visualViewport?.removeEventListener('scroll', apply)
    window.removeEventListener('resize', apply)
    document.removeEventListener('focusin', apply)
    removeNative?.()
  }
}
