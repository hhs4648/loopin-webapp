import { useEffect } from 'react'

/** 피드백 시트·완료 화면에서 Enter 키로 계속하기를 실행합니다. */
export function useEnterToContinue(onContinue?: () => void) {
  useEffect(() => {
    if (!onContinue) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Enter') return
      event.preventDefault()
      onContinue()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onContinue])
}
