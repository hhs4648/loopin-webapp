import { useEffect, useState } from 'react'
import {
  onboardingContentXStyle,
  onboardingTitleTopStyle,
} from './onboarding-chrome'
import {
  ONBOARDING_BODY_CLASS,
  ONBOARDING_BUTTON_LABEL_CLASS,
  ONBOARDING_CAPTION_CLASS,
  ONBOARDING_CTA_BG,
  ONBOARDING_CTA_BG_DISABLED,
  ONBOARDING_CTA_RADIUS_CLASS,
  ONBOARDING_TEXT,
  ONBOARDING_TEXT_MUTED,
  ONBOARDING_TITLE_CLASS,
} from './onboarding-typography'
import {
  CircleCheckbox,
  INPUT_FIELD,
  INPUT_HINT,
  NextStepButton,
  figmaAbsRect,
} from './onboarding-ui'
import {
  formatKrMobileInput,
  normalizeKrMobile,
  sendParentalConsentOtp,
  verifyParentalConsentOtp,
} from '../../lib/sync/parental-consent'

export type ParentConsentResult = {
  consentToken: string
  phoneLast4: string
}

const PHONE_Y = 230.5
const CODE_Y = 330.5
const SEND_BTN = { x: 250, y: 230.5, w: 120, h: 60 }
const CONSENT_CY = 470
const ERROR_TOP = 540

/**
 * 만 14세 미만 — 보호자 휴대폰 SMS OTP + 동의 체크.
 * Figma 에셋 없음 → MemberType과 같이 PhoneShell 위에 직접 배치.
 */
export function ParentConsentStep({
  onVerified,
}: {
  onVerified: (result: ParentConsentResult) => void
}) {
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [challengeToken, setChallengeToken] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(false)
  const [verified, setVerified] = useState<ParentConsentResult | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cooldown, setCooldown] = useState(0)
  const [devHint, setDevHint] = useState<string | null>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const id = window.setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => window.clearTimeout(id)
  }, [cooldown])

  const phoneOk = normalizeKrMobile(phone) != null
  const canSend = phoneOk && !busy && cooldown === 0
  const canVerify =
    Boolean(challengeToken) && code.replace(/\D/g, '').length === 6 && !busy
  const canNext = verified !== null && agreed

  const handleSend = async () => {
    if (!canSend) return
    setBusy(true)
    setError(null)
    setDevHint(null)
    setVerified(null)
    const result = await sendParentalConsentOtp(phone)
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    setChallengeToken(result.challengeToken)
    setCooldown(60)
    if (result.devCode) {
      setDevHint(`개발용 인증번호: ${result.devCode}`)
    }
  }

  const handleVerify = async () => {
    if (!canVerify || !challengeToken) return
    setBusy(true)
    setError(null)
    const result = await verifyParentalConsentOtp({
      phoneRaw: phone,
      code,
      challengeToken,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      if (result.challengeToken) setChallengeToken(result.challengeToken)
      return
    }
    setVerified({
      consentToken: result.consentToken,
      phoneLast4: result.phoneLast4,
    })
  }

  return (
    <>
      <header
        className="absolute inset-x-0 top-0 z-[2]"
        style={{ ...onboardingTitleTopStyle(), ...onboardingContentXStyle() }}
      >
        <h1 className={ONBOARDING_TITLE_CLASS}>보호자 동의가 필요해요</h1>
        <p className={`mt-2 ${ONBOARDING_CAPTION_CLASS} ${ONBOARDING_TEXT_MUTED}`}>
          보호자 휴대폰으로 인증번호를 받아 주세요
        </p>
      </header>

      <input
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        aria-label="보호자 휴대폰 번호"
        placeholder="010-0000-0000"
        value={phone}
        disabled={verified !== null}
        onChange={(e) => setPhone(formatKrMobileInput(e.target.value))}
        className={`${INPUT_FIELD} z-[3]`}
        style={{ top: `${(PHONE_Y / 852) * 100}%`, width: '58%' }}
      />
      <button
        type="button"
        aria-label="인증번호 받기"
        disabled={!canSend}
        onClick={() => void handleSend()}
        className={`absolute z-[4] ${ONBOARDING_CTA_RADIUS_CLASS} ${ONBOARDING_BUTTON_LABEL_CLASS} ${
          canSend
            ? `cursor-pointer ${ONBOARDING_CTA_BG} text-white`
            : `cursor-not-allowed ${ONBOARDING_CTA_BG_DISABLED} text-white`
        }`}
        style={figmaAbsRect(SEND_BTN)}
      >
        {cooldown > 0 ? `${cooldown}초` : '인증요청'}
      </button>
      <p className={`${INPUT_HINT} z-[2]`} style={{ top: `${(295 / 852) * 100}%` }}>
        숫자만 입력해도 괜찮아요
      </p>

      <input
        type="tel"
        inputMode="numeric"
        autoComplete="one-time-code"
        aria-label="인증번호 6자리"
        placeholder="인증번호 6자리"
        value={code}
        disabled={verified !== null || !challengeToken}
        onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
        className={`${INPUT_FIELD} z-[3]`}
        style={{ top: `${(CODE_Y / 852) * 100}%` }}
      />
      <button
        type="button"
        aria-label="인증번호 확인"
        disabled={!canVerify || verified !== null}
        onClick={() => void handleVerify()}
        className={`absolute z-[4] left-[7.63%] h-[5.5%] w-[84.73%] ${ONBOARDING_CTA_RADIUS_CLASS} ${ONBOARDING_BUTTON_LABEL_CLASS} ${
          canVerify && verified === null
            ? `cursor-pointer ${ONBOARDING_CTA_BG} text-white`
            : `cursor-not-allowed ${ONBOARDING_CTA_BG_DISABLED} text-white`
        }`}
        style={{ top: `${(405 / 852) * 100}%` }}
      >
        {verified ? '인증 완료' : '인증 확인'}
      </button>

      <CircleCheckbox
        checked={agreed}
        cx={32}
        cy={CONSENT_CY}
        label="보호자 동의"
        hasBakedRing={false}
        onToggle={() => setAgreed((v) => !v)}
      />
      <button
        type="button"
        aria-pressed={agreed}
        className={`absolute z-[2] flex items-start bg-transparent p-0 text-left ${ONBOARDING_BODY_CLASS} ${ONBOARDING_TEXT}`}
        style={figmaAbsRect({ x: 68, y: CONSENT_CY - 20, w: 300, h: 56 })}
        onClick={() => setAgreed((v) => !v)}
      >
        보호자로서 자녀의 서비스 이용 및 개인정보 수집·이용에 동의합니다
      </button>

      {devHint ? (
        <p
          className={`absolute z-[3] left-[5.73%] w-[88%] ${ONBOARDING_CAPTION_CLASS} text-[#2AA3FF]`}
          style={{ top: `${(ERROR_TOP / 852) * 100}%` }}
        >
          {devHint}
        </p>
      ) : null}
      {error ? (
        <p
          role="alert"
          className={`absolute z-[3] left-[5.73%] w-[88%] ${ONBOARDING_CAPTION_CLASS} text-[#E5484D]`}
          style={{ top: `${((devHint ? ERROR_TOP + 28 : ERROR_TOP) / 852) * 100}%` }}
        >
          {error}
        </p>
      ) : null}
      {verified ? (
        <p
          className={`absolute z-[3] left-[5.73%] w-[88%] ${ONBOARDING_CAPTION_CLASS} text-[#2AA3FF]`}
          style={{ top: `${((error || devHint ? ERROR_TOP + 56 : ERROR_TOP) / 852) * 100}%` }}
        >
          인증 완료 (끝자리 {verified.phoneLast4})
        </p>
      ) : null}

      <NextStepButton
        enabled={canNext}
        onClick={() => {
          if (verified && agreed) onVerified(verified)
        }}
        hasBakedButton={false}
        label="다음"
      />
    </>
  )
}
