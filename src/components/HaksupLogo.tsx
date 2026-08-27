interface HaksupLogoProps {
  variant?: 'splash' | 'login'
}

const LOGO_CLASS = 'h-[67.427px] w-[176px]'

export function HaksupLogo({ variant = 'login' }: HaksupLogoProps) {
  const src =
    variant === 'login' ? '/assets/login-logo.svg' : '/assets/logo-haksup.png'

  return (
    <img
      src={src}
      alt="학습"
      className={`block select-none ${LOGO_CLASS}`}
      draggable={false}
    />
  )
}
