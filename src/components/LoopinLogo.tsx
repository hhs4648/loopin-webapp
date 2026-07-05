interface LoopinLogoProps {
  variant?: 'splash' | 'login'
}

const LOGO_CLASS = 'h-[67.427px] w-[176px]'

export function LoopinLogo({ variant = 'login' }: LoopinLogoProps) {
  const src =
    variant === 'login' ? '/assets/login-logo.svg' : '/assets/logo-loopin.png'

  return (
    <img
      src={src}
      alt="Loopin"
      className={`block select-none ${LOGO_CLASS}`}
      draggable={false}
    />
  )
}
