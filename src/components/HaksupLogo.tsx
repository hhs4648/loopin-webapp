interface HaksupLogoProps {
  /**
   * `mark` — 앱 아이콘과 같은 정사각 로고 (기본).
   * `login` — 옛 가로 워드마크. 지금 쓰는 화면은 없다.
   */
  variant?: 'mark' | 'login'
}

/**
 * 브랜드 로고.
 *
 * **가로 워드마크에서 정사각 마크로 바뀌었다 (2026-09-04).** 예전 `logo-haksup.png`은
 * 파일명만 바꾼 옛 `Loopin` 워드마크라, 스토어 이름은 「학습」인데 화면에는 옛 브랜드가
 * 그대로 보였다. 지금은 앱 아이콘과 같은 그림(`assets/icon.png`)을 쓴다.
 *
 * `public/assets`에 들어가는 건 전부 학생 기기로 내려가므로 1024px 원본이 아니라
 * 192px로 줄여서 넣었다(16KB). 화면 표시는 64px이라 3배수까지 선명하다.
 */
export function HaksupLogo({ variant = 'mark' }: HaksupLogoProps) {
  if (variant === 'login') {
    return (
      <img
        src="/assets/login-logo.svg"
        alt="학습"
        className="block h-[67.427px] w-[176px] select-none"
        draggable={false}
      />
    )
  }

  return (
    <img
      src="/assets/logo-mark.png"
      alt="학습"
      className="block h-16 w-16 select-none rounded-[16px]"
      draggable={false}
    />
  )
}
