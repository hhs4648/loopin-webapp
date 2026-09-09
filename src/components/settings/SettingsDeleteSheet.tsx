import { useState } from 'react'
import { playTapSfx } from '../exercise/answer-sfx'
import { useBackNavigation } from '../navigation/BackNavigationProvider'

type SettingsDeleteSheetProps = {
  onDeleteAccount: () => Promise<{ ok: boolean; message?: string }>
  onClose: () => void
}

/**
 * 설정 하단 「회원탈퇴」— 한 번 더 확인한 뒤에만 실행.
 */
export function SettingsDeleteSheet({
  onDeleteAccount,
  onClose,
}: SettingsDeleteSheetProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useBackNavigation(() => {
    if (deleting) return
    if (confirming) {
      setConfirming(false)
      return
    }
    onClose()
  })

  async function handleDelete() {
    if (deleting) return
    playTapSfx()
    setError(null)
    setDeleting(true)

    const result = await onDeleteAccount()
    if (!result.ok) {
      setError(result.message ?? '탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.')
      setDeleting(false)
    }
  }

  return (
    <div
      className="absolute inset-0 z-[120] flex flex-col justify-end bg-black/40"
      role="dialog"
      aria-modal="true"
      aria-label="회원탈퇴"
    >
      <button
        type="button"
        aria-label="닫기"
        className="min-h-0 flex-1 bg-transparent"
        disabled={deleting}
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

        {confirming ? (
          <>
            <h2 className="mb-2 font-sans text-[20px] font-extrabold tracking-[-0.03em] text-[#0B1220]">
              정말 탈퇴할까요?
            </h2>
            <p className="mb-3 font-sans text-[14px] font-medium leading-relaxed text-[#475569]">
              아래가{' '}
              <b className="font-extrabold text-[#0B1220]">모두 지워지고 되돌릴 수 없어요.</b>
            </p>
            <ul className="mb-3 flex flex-col gap-1 rounded-[16px] bg-[#F3F6FA] px-4 py-3 font-sans text-[14px] font-semibold text-[#475569]">
              <li>· 이름·학년 등 내 정보</li>
              <li>· 가입한 반과 받은 과제</li>
              <li>· 지금까지 푼 기록과 점수·칭찬 기록</li>
            </ul>
            <p className="mb-3 font-sans text-[13px] font-medium leading-relaxed text-[#64748B]">
              선생님 화면에서도 내 기록이 사라져요. 같은 계정으로 다시 가입해도
              예전 기록은 되살릴 수 없어요.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-2 font-sans text-[20px] font-extrabold tracking-[-0.03em] text-[#0B1220]">
              회원탈퇴
            </h2>
            <p className="mb-3 font-sans text-[14px] font-medium leading-relaxed text-[#475569]">
              탈퇴하면 계정과 학습 기록이 모두 삭제돼요. 계속할까요?
            </p>
          </>
        )}

        {error ? (
          <p role="alert" className="mb-3 font-sans text-[13px] font-bold text-[#FF5A5A]">
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 pb-2">
          <button
            type="button"
            disabled={deleting}
            className="h-[54px] flex-1 rounded-[16px] bg-[#F3F6FA] font-sans text-[16px] font-bold text-[#475569] disabled:opacity-40"
            onClick={() => {
              playTapSfx()
              if (confirming) {
                setConfirming(false)
                setError(null)
                return
              }
              onClose()
            }}
          >
            {confirming ? '아니요' : '닫기'}
          </button>
          <button
            type="button"
            disabled={deleting}
            aria-label={confirming ? '회원탈퇴 확정' : '회원탈퇴 계속'}
            className={`h-[54px] flex-1 rounded-[16px] font-sans text-[16px] font-extrabold disabled:opacity-40 ${
              confirming
                ? 'bg-[#FF5A5A] text-white shadow-[0_6px_16px_rgba(255,90,90,0.35)]'
                : 'border border-[#FFD5D5] bg-white text-[#FF5A5A]'
            }`}
            onClick={() => {
              if (!confirming) {
                playTapSfx()
                setConfirming(true)
                return
              }
              void handleDelete()
            }}
          >
            {deleting ? '탈퇴 중…' : confirming ? '탈퇴하기' : '회원탈퇴'}
          </button>
        </div>
      </div>
    </div>
  )
}
