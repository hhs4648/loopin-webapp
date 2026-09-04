import { useState } from 'react'
import { playTapSfx } from '../exercise/answer-sfx'
import { useBackNavigation } from '../navigation/BackNavigationProvider'

type SettingsAccountSheetProps = {
  /** 카카오 / 애플 / 구글 (임시 참여면 「임시 참여」) */
  providerLabel: string
  /** 선생님이 학생 화면을 보려고 임시로 들어온 상태 — 소셜 계정이 아니다 */
  temporary?: boolean
  /** 실제 삭제 — 성공하면 부모가 로그인 화면으로 보낸다 */
  onDeleteAccount: () => Promise<{ ok: boolean; message?: string }>
  onClose: () => void
}

/**
 * 설정 「연동 계정」 시트 — 연동 상태 확인과 **회원탈퇴**.
 *
 * 탈퇴는 **두 번 눌러야** 실행된다. 되돌릴 수 없는 일이라 리스트에서 한 번에
 * 닿게 두지 않았다. 무엇이 사라지는지 확인 단계에서 그대로 적는다 — "정말요?"만
 * 묻는 창은 읽지 않고 누르게 된다.
 */
export function SettingsAccountSheet({
  providerLabel,
  temporary = false,
  onDeleteAccount,
  onClose,
}: SettingsAccountSheetProps) {
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
    // 성공하면 부모가 화면을 통째로 바꾼다 — 여기서 상태를 되돌릴 필요가 없다
  }

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
        disabled={deleting}
        onClick={() => {
          playTapSfx()
          onClose()
        }}
      />
      <div className="shrink-0 rounded-t-[24px] bg-white px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] pt-4 shadow-[0_-10px_24px_rgba(0,0,0,0.08)]">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[#E5E7EB]" aria-hidden />

        {confirming ? (
          <>
            <h2 className="mb-2 font-['Pretendard',sans-serif] text-[18px] font-bold text-[#111111]">
              정말 탈퇴할까요?
            </h2>
            <p className="mb-3 font-['Pretendard',sans-serif] text-[14px] font-medium leading-relaxed text-[#5A6472]">
              아래가 <b className="font-bold text-[#111111]">모두 지워지고 되돌릴 수 없어요.</b>
            </p>
            <ul className="mb-3 flex flex-col gap-1 rounded-[14px] bg-[#F7F8FA] px-4 py-3 font-['Pretendard',sans-serif] text-[14px] font-medium text-[#5A6472]">
              <li>· 이름·학년 등 내 정보</li>
              <li>· 가입한 반과 받은 과제</li>
              <li>· 지금까지 푼 기록과 점수·칭찬 기록</li>
            </ul>
            <p className="mb-3 font-['Pretendard',sans-serif] text-[13px] font-medium leading-relaxed text-[#8C94A1]">
              선생님 화면에서도 내 기록이 사라져요. 같은 계정으로 다시 가입해도
              예전 기록은 되살릴 수 없어요.
            </p>
          </>
        ) : (
          <>
            <h2 className="mb-3 font-['Pretendard',sans-serif] text-[18px] font-bold text-[#111111]">
              연동 계정
            </h2>
            <div className="mb-3 flex h-[52px] items-center justify-between rounded-[14px] bg-[#F7F8FA] px-4 font-['Pretendard',sans-serif] text-[16px]">
              <span className="font-semibold text-[#111111]">현재 로그인</span>
              <span className="font-semibold text-[#2AA3FF]">{providerLabel}</span>
            </div>
            {temporary ? (
              <p className="mb-3 font-['Pretendard',sans-serif] text-[13px] font-medium leading-relaxed text-[#8C94A1]">
                지금은 <b className="font-bold">임시 학생</b>으로 참여 중이에요. 로그아웃하면
                이 기록은 다시 볼 수 없고, 선생님으로 돌아가려면 원래 계정으로 로그인하면 돼요.
              </p>
            ) : (
              <p className="mb-3 font-['Pretendard',sans-serif] text-[13px] font-medium leading-relaxed text-[#8C94A1]">
                처음 가입한 방법({providerLabel})으로 계속 로그인해 주세요. 다른 방법으로
                로그인하면 <b className="font-bold">다른 계정</b>이 되어 학습 기록이 보이지 않아요.
              </p>
            )}
          </>
        )}

        {error ? (
          <p
            role="alert"
            className="mb-3 font-['Pretendard',sans-serif] text-[13px] font-semibold text-[#FF5A5A]"
          >
            {error}
          </p>
        ) : null}

        <div className="flex gap-2 pb-2">
          <button
            type="button"
            disabled={deleting}
            className="h-[52px] flex-1 rounded-[14px] bg-[#F7F8FA] font-['Pretendard',sans-serif] text-[16px] font-bold text-[#667085] disabled:opacity-40"
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
            aria-label={confirming ? '회원탈퇴 확정' : '회원탈퇴'}
            className={`h-[52px] flex-1 rounded-[14px] font-['Pretendard',sans-serif] text-[16px] font-bold disabled:opacity-40 ${
              confirming
                ? 'bg-[#FF5A5A] text-white'
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
