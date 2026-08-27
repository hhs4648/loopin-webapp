/**
 * 앱 프레임을 **지금 눈에 보이는 영역**에 맞춘다.
 *
 * 카카오·인스타 인앱 브라우저는 주소창·하단 툴바를 웹뷰 위에 얹는다.
 * `100dvh`는 그 툴바를 포함한 큰 높이를 주는 경우가 많아서, 393×852 프레임이
 * 실제 화면보다 커지고 아래(제출·내비·타일)가 잘리거나 겹친다.
 *
 * `visualViewport` 높이를 CSS 변수로 넘기면 `.app-frame`이 짧은 쪽에 맞춰
 * 조금 좁아지고, 잘리는 대신 좌우 여백이 생긴다.
 */
export function startAppViewportSync(): () => void {
  const root = document.documentElement

  const apply = () => {
    const vv = window.visualViewport
    const height = vv?.height ?? window.innerHeight
    const width = vv?.width ?? window.innerWidth
    root.style.setProperty('--app-vh', `${Math.round(height)}px`)
    root.style.setProperty('--app-vw', `${Math.round(width)}px`)
    root.style.setProperty('--app-v-top', `${Math.round(vv?.offsetTop ?? 0)}px`)
    root.style.setProperty('--app-v-left', `${Math.round(vv?.offsetLeft ?? 0)}px`)
  }

  apply()
  window.visualViewport?.addEventListener('resize', apply)
  window.visualViewport?.addEventListener('scroll', apply)
  window.addEventListener('resize', apply)

  return () => {
    window.visualViewport?.removeEventListener('resize', apply)
    window.visualViewport?.removeEventListener('scroll', apply)
    window.removeEventListener('resize', apply)
  }
}
