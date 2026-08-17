import { useEffect } from 'react'
import { FRAME_H, NAV_H } from './assignment-home'

/**
 * 하단 내비 바로 위에 잠깐 뜨는 안내.
 *
 * 아직 화면이 없는 탭(`단어장`)을 눌렀을 때 쓴다. 예전에는 **아무 일도 일어나지
 * 않아서** 학생 입장에서는 눌리지 않는 고장난 버튼으로 보였다.
 *
 * 시스템 알럿을 쓰지 않는다 — 앱 안에서 이질적이고, 웹뷰로 감싸면 도메인 이름까지
 * 같이 뜬다. 화면을 막지 않고 스스로 사라지는 편이 이 정도 안내에 맞다.
 */
export function NavNoticeToast({
  message,
  onHide,
  durationMs = 2400,
}: {
  message: string | null
  onHide: () => void
  durationMs?: number
}) {
  useEffect(() => {
    if (!message) return
    const timer = window.setTimeout(onHide, durationMs)
    return () => window.clearTimeout(timer)
  }, [message, durationMs, onHide])

  if (!message) return null

  // 내비 위로 살짝 띄운다 — 겹치면 눌러야 할 탭을 가린다
  const bottomPct = ((NAV_H + 14) / FRAME_H) * 100

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none absolute inset-x-5 z-[70] flex justify-center"
      style={{ bottom: `${bottomPct}%` }}
    >
      <p className="max-w-full rounded-xl bg-[#1E242F]/92 px-4 py-3 text-center font-sans text-[14px] font-semibold leading-snug text-white shadow-[0_6px_18px_rgba(0,0,0,0.22)]">
        {message}
      </p>
    </div>
  )
}

/** 아직 준비 중인 탭 안내 문구 */
export const VOCAB_COMING_SOON = '단어장은 준비 중이에요. 조금만 기다려 주세요!'
