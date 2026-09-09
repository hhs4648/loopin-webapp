import { playTapSfx } from '../exercise/answer-sfx'
import { useBackNavigation } from '../navigation/BackNavigationProvider'

type SettingsAccountSheetProps = {
  /** 카카오 / 애플 / 구글 (임시 참여면 「임시 참여」) */
  providerLabel: string
  /** 선생님이 학생 화면을 보려고 임시로 들어온 상태 — 소셜 계정이 아니다 */
  temporary?: boolean
  onClose: () => void
}

/**
 * 설정 「연동 계정」 시트 — 연동 상태만 확인.
 * 회원탈퇴는 설정 하단 별도 입구(`SettingsDeleteSheet`)로 둔다.
 */
export function SettingsAccountSheet({
  providerLabel,
  temporary = false,
  onClose,
}: SettingsAccountSheetProps) {
  useBackNavigation(onClose)

  return (
    <div
      className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="연동 계정"
    >
      <button
        type="button"
        aria-label="닫기"
        className="min-h-0 flex-1 bg-transparent"
        onClick={() => {
          playTapSfx()
          onClose()
        }}
      />
      <div className="shrink-0 rounded-t-[28px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-3 shadow-[0_-12px_32px_rgba(15,23,42,0.12)]">
        <div
          className="mx-auto mb-4 h-1.5 w-11 rounded-full bg-gradient-to-r from-[#2AA3FF]/30 via-[#B2F165]/80 to-[#2AA3FF]/30"
          aria-hidden
        />

        <h2 className="mb-3 font-sans text-[20px] font-extrabold tracking-[-0.03em] text-[#0B1220]">
          연동 계정
        </h2>
        <div className="mb-3 flex h-[54px] items-center justify-between rounded-[16px] bg-[#F3F6FA] px-4 font-sans text-[16px]">
          <span className="font-bold text-[#0B1220]">현재 로그인</span>
          <span className="font-extrabold text-[#2AA3FF]">{providerLabel}</span>
        </div>
        {temporary ? (
          <p className="mb-3 font-sans text-[13px] font-medium leading-relaxed text-[#64748B]">
            지금은 <b className="font-bold text-[#0B1220]">임시 학생</b>으로 참여 중이에요.
            로그아웃하면 이 기록은 다시 볼 수 없고, 선생님으로 돌아가려면 원래 계정으로
            로그인하면 돼요.
          </p>
        ) : (
          <p className="mb-3 font-sans text-[13px] font-medium leading-relaxed text-[#64748B]">
            처음 가입한 방법({providerLabel})으로 계속 로그인해 주세요. 다른 방법으로
            로그인하면 <b className="font-bold text-[#0B1220]">다른 계정</b>이 되어 학습
            기록이 보이지 않아요.
          </p>
        )}

        <button
          type="button"
          className="mb-2 h-[54px] w-full rounded-[16px] bg-[#F3F6FA] font-sans text-[16px] font-bold text-[#475569]"
          onClick={() => {
            playTapSfx()
            onClose()
          }}
        >
          닫기
        </button>
      </div>
    </div>
  )
}
