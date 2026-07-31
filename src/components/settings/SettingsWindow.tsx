import { useState } from 'react'
import {
  getStoredAuth,
  resolveDisplayName,
  socialProviderLabel,
  type SocialProvider,
} from '../../lib/auth'
import { getCachedStudentProfile } from '../../lib/sync/student-api'
import { playTapSfx } from '../exercise/answer-sfx'
import { CurriculumBottomNav } from '../curriculum-main/CurriculumBottomNav'
import type { CurriculumNavTabId } from '../curriculum-main/curriculum-main'
import { FRAME_H, NAV_H } from '../main-home/assignment-home'
import { figmaNavRectStyle } from '../navigation/figma-navigation'
import {
  SETTINGS_CLOSE_HIT,
  SETTINGS_CONTACT_EMAIL,
  SETTINGS_DISPLAY_NAME_MAX,
  SETTINGS_DOC_URLS,
  SETTINGS_LINKED_VALUE,
  SETTINGS_LIST_ROWS,
  SETTINGS_NICKNAME_VALUE,
  SETTINGS_PROFILE_BADGE,
  SETTINGS_PROFILE_COVER,
  SETTINGS_PROFILE_NAME,
  SETTINGS_PROFILE_STRIP,
  SETTINGS_WINDOW_ASSET,
  settingsCanvasToCropRect,
  settingsContentRectStyle,
  settingsWindowImageStyle,
  type SettingsListRow,
} from './settings'
import { TermsDocSheet } from '../onboarding/TermsDocSheet'

type SettingsWindowProps = {
  onClose: () => void
  /**
   * 하단 내비 탭 — 학원/학교·커리큘럼 공통.
   * 설정 UI 기준은 개인 커리큘럼(`CurriculumBottomNav`).
   */
  onSelectNav: (id: CurriculumNavTabId) => void
}

function providerBadgeClass(provider: SocialProvider): string {
  if (provider === 'kakao') {
    return 'bg-[#FEE500] text-[#191919]'
  }
  if (provider === 'apple') {
    return 'bg-black text-white'
  }
  // google — 추후 로그인 연동
  return 'border border-[#E0E0E0] bg-white text-[#1F1F1F]'
}

/**
 * Figma `설정 창` 오버레이.
 * 본문=설정 에셋 · 이름/연동=온보딩·로그인 값 · 하단=`CurriculumBottomNav`.
 */
export function SettingsWindow({ onClose, onSelectNav }: SettingsWindowProps) {
  const bodyBottomPct = (NAV_H / FRAME_H) * 100

  const [openDoc, setOpenDoc] = useState<
    'privacy' | 'terms' | 'marketing' | null
  >(null)

  const user = getStoredAuth()
  const profile = getCachedStudentProfile()
  const displayName = resolveDisplayName(user, profile?.displayName).slice(
    0,
    SETTINGS_DISPLAY_NAME_MAX,
  )
  const provider: SocialProvider = user?.provider ?? 'kakao'
  const providerLabel = socialProviderLabel(provider)

  const stripStyle = settingsContentRectStyle(
    settingsCanvasToCropRect(SETTINGS_PROFILE_STRIP),
  )
  const nameStyle = settingsContentRectStyle(
    settingsCanvasToCropRect(SETTINGS_PROFILE_NAME),
  )
  const badgeStyle = settingsContentRectStyle(
    settingsCanvasToCropRect(SETTINGS_PROFILE_BADGE),
  )
  const nickStyle = settingsContentRectStyle(
    settingsCanvasToCropRect(SETTINGS_NICKNAME_VALUE),
  )
  const linkedStyle = settingsContentRectStyle(
    settingsCanvasToCropRect(SETTINGS_LINKED_VALUE),
  )

  function handleActivateSettingsRow(row: SettingsListRow) {
    playTapSfx()

    if (row.action === 'mailto') {
      window.location.href = `mailto:${SETTINGS_CONTACT_EMAIL}`
      return
    }

    // 팝업 차단/모바일 환경에서도 “바로 화면에 나오게” 하기 위해
    // 정적 HTML은 앱 내부 시트로 렌더링한다.
    if (row.action === 'privacy' || row.action === 'terms' || row.action === 'marketing') {
      setOpenDoc(row.action)
    }
  }

  return (
    <div
      className="absolute inset-0 z-50 overflow-hidden bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="설정"
    >
      <div
        className="absolute inset-x-0 top-0 overflow-hidden bg-white"
        style={{ bottom: `${bodyBottomPct}%` }}
      >
        <div className="absolute inset-0 bg-white" aria-hidden />
        <img
          src={SETTINGS_WINDOW_ASSET}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none select-none"
          style={settingsWindowImageStyle()}
        />

        {/* 베이크 잔상 덮개 → 이름(우측 정렬) · 연동 뱃지(시안 고정) */}
        <div
          className="pointer-events-none absolute z-[11]"
          style={{ ...stripStyle, background: SETTINGS_PROFILE_COVER }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end overflow-hidden"
          style={nameStyle}
        >
          <span
            className="truncate text-[15px] font-bold leading-none tracking-[-0.02em] text-[#111111]"
            style={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'geometricPrecision',
            }}
          >
            {displayName}
          </span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-center"
          style={badgeStyle}
        >
          <span
            className={`inline-flex h-[20px] min-w-[56px] items-center justify-center rounded-full px-2.5 text-[10px] font-semibold leading-none ${providerBadgeClass(provider)}`}
            style={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            {providerLabel}
          </span>
        </div>

        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={nickStyle}
        >
          <span
            className="truncate text-[13px] leading-none text-[#8C94A1]"
            style={{ WebkitFontSmoothing: 'antialiased' }}
          >
            {displayName}
          </span>
        </div>

        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={linkedStyle}
        >
          <span
            className="truncate text-[13px] leading-none text-[#8C94A1]"
            style={{ WebkitFontSmoothing: 'antialiased' }}
          >
            {providerLabel}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10">
          {SETTINGS_LIST_ROWS.map((row) => (
            <button
              key={row.id}
              type="button"
              aria-label={row.ariaLabel}
              className="pointer-events-auto absolute bg-transparent"
              style={settingsContentRectStyle(
                settingsCanvasToCropRect(row.canvas),
              )}
              onClick={() => handleActivateSettingsRow(row)}
            />
          ))}
        </div>
      </div>

      <button
        type="button"
        aria-label="설정 닫기"
        className="absolute z-[70] bg-transparent"
        style={figmaNavRectStyle(SETTINGS_CLOSE_HIT)}
        onClick={() => {
          playTapSfx()
          onClose()
        }}
      />

      <CurriculumBottomNav activeId="menu" onSelect={onSelectNav} />

      {openDoc ? (
        <TermsDocSheet
          label={
            openDoc === 'privacy'
              ? '개인정보 처리방침'
              : openDoc === 'terms'
                ? '서비스 이용약관'
                : '마케팅 정보 수신 안내'
          }
          docUrl={SETTINGS_DOC_URLS[openDoc]!}
          onClose={() => setOpenDoc(null)}
        />
      ) : null}
    </div>
  )
}
