import { useEffect, useState } from 'react'
import { useBackNavigation } from '../navigation/BackNavigationProvider'
import { OnboardingChrome } from './OnboardingChrome'
import { ONBOARDING_TITLE_CLASS, onboardingContentTopStyle } from './onboarding-chrome'

type TermsDocSheetProps = {
  label: string
  docUrl: string
  onClose: () => void
}

/** 약관/방침 전문 보기 (읽기 전용) */
export function TermsDocSheet({ label, docUrl, onClose }: TermsDocSheetProps) {
  const [html, setHtml] = useState<string | null>(null)
  const [loadError, setLoadError] = useState(false)

  useBackNavigation(onClose)

  useEffect(() => {
    let cancelled = false
    setHtml(null)
    setLoadError(false)

    void fetch(docUrl)
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status))
        return res.text()
      })
      .then((text) => {
        if (cancelled) return
        const mainMatch = text.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
        setHtml(mainMatch?.[1] ?? text)
      })
      .catch(() => {
        if (!cancelled) setLoadError(true)
      })

    return () => {
      cancelled = true
    }
  }, [docUrl])

  return (
    <div
      className="absolute inset-0 z-[120] flex flex-col bg-white"
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <OnboardingChrome />

      <header
        className="flex shrink-0 items-center border-b border-[#E5E7EB] px-6 pb-3"
        style={onboardingContentTopStyle()}
      >
        <h2 className={`min-w-0 flex-1 ${ONBOARDING_TITLE_CLASS}`} style={{ lineHeight: '1.4' }}>
          {label}
        </h2>
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4 [scrollbar-width:thin]">
        {loadError ? (
          <p className="font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#667085]">
            문서를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.
          </p>
        ) : html == null ? (
          <p className="font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#667085]">
            불러오는 중…
          </p>
        ) : (
          <div
            className="terms-doc-body font-['Pretendard',sans-serif] text-[14px] leading-relaxed text-[#344054] [&_.badge]:mb-2 [&_.badge]:inline-block [&_.badge]:rounded-full [&_.badge]:bg-[#E8F2FE] [&_.badge]:px-2.5 [&_.badge]:py-1 [&_.badge]:text-[12px] [&_.badge]:font-semibold [&_.badge]:text-[#155DFC] [&_.card]:mb-3 [&_.card]:rounded-2xl [&_.card]:border [&_.card]:border-[#E5E7EB] [&_.card]:bg-white [&_.card]:p-4 [&_.footer]:mt-6 [&_.footer]:text-center [&_.footer]:text-[12px] [&_.footer]:text-[#98A2B3] [&_.meta]:mb-4 [&_.meta]:text-[13px] [&_.meta]:text-[#667085] [&_.note]:mt-3 [&_.note]:rounded-xl [&_.note]:bg-[#FFF7ED] [&_.note]:px-3 [&_.note]:py-2.5 [&_.note]:text-[13px] [&_.note]:text-[#9A3412] [&_h1]:mb-2 [&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:leading-snug [&_h1]:text-[#1E242F] [&_h2]:mb-2 [&_h2]:text-[16px] [&_h2]:font-bold [&_h2]:text-[#1E242F] [&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-[14px] [&_h3]:font-bold [&_li]:mt-1.5 [&_ol]:mb-2 [&_ol]:pl-5 [&_p]:mb-2.5 [&_table]:mb-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-[12px] [&_td]:border [&_td]:border-[#E5E7EB] [&_td]:px-2 [&_td]:py-2 [&_th]:border [&_th]:border-[#E5E7EB] [&_th]:bg-[#F2F4F7] [&_th]:px-2 [&_th]:py-2 [&_th]:text-left [&_ul]:mb-2 [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        )}
      </div>

      <div
        className="shrink-0 border-t border-[#E5E7EB] bg-white px-[7.63%] pt-3"
        style={{
          paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom, 0px))',
        }}
      >
        <button
          type="button"
          aria-label="확인하기"
          className="flex min-h-[52px] w-full items-center justify-center rounded-[19px] bg-[#2AA3FF] font-['Pretendard',sans-serif] text-[15px] font-semibold text-white"
          onClick={onClose}
        >
          확인하기
        </button>
      </div>
    </div>
  )
}
