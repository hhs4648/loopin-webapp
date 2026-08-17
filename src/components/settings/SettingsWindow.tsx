import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAuth,
  getStoredAuth,
  resolveDisplayName,
  socialProviderLabel,
  type SocialProvider,
} from '../../lib/auth'
import {
  getCachedStudentProfile,
  upsertStudentProfile,
} from '../../lib/sync/student-api'
import { playTapSfx } from '../exercise/answer-sfx'
import { MainHomeBottomNav } from '../main-home/MainHomeBottomNav'
import {
  FRAME_H,
  NAV_H,
  type MainHomeNavTabId,
} from '../main-home/assignment-home'
import { BackButtonOverlay } from '../navigation/BackButtonOverlay'
import { BACK_MASK_SETTINGS } from '../navigation/figma-navigation'
import { SettingsGradeSheet } from './SettingsGradeSheet'
import {
  SETTINGS_ACCOUNT_VALUE_CLASS,
  SETTINGS_DISPLAY_NAME_MAX,
  SETTINGS_DOC_URLS,
  SETTINGS_GRADE_HIT,
  SETTINGS_GRADE_OPTIONS,
  SETTINGS_GRADE_VALUE,
  SETTINGS_LINKED_VALUE,
  SETTINGS_LIST_ROWS,
  SETTINGS_NICKNAME_VALUE,
  SETTINGS_PROFILE_BADGE,
  SETTINGS_PROFILE_BADGE_CLASS,
  SETTINGS_PROFILE_NAME,
  SETTINGS_PROFILE_NAME_CLASS,
  SETTINGS_PROFILE_NAME_PATCH,
  SETTINGS_PROFILE_STRIP,
  SETTINGS_WINDOW_ASSET,
  formatSettingsGradeLabel,
  openSettingsContactMail,
  parseSettingsGradeId,
  settingsCanvasToCropRect,
  settingsContentRectStyle,
  settingsWindowImageStyle,
  type SettingsListRow,
  type SettingsMiddleGradeId,
} from './settings'
import { TermsDocSheet } from '../onboarding/TermsDocSheet'

type SettingsWindowProps = {
  onClose: () => void
  /** 하단 내비 탭 — 학원/학교 메인과 동일 */
  onSelectNav: (id: MainHomeNavTabId) => void
}

function providerBadgeClass(provider: SocialProvider): string {
  if (provider === 'kakao') {
    return 'bg-[#FEE500] text-[#191919]'
  }
  if (provider === 'apple') {
    return 'bg-black text-white'
  }
  // google
  return 'border border-[#DADCE0] bg-white text-[#3C4043]'
}

/**
 * Figma `설정 창` 오버레이.
 * 이름·연동 = 온보딩/로그인 값 · 그 외 문구는 에셋 베이크 · 하단=`MainHomeBottomNav`.
 */
export function SettingsWindow({ onClose: _onClose, onSelectNav }: SettingsWindowProps) {
  const bodyBottomPct = (NAV_H / FRAME_H) * 100
  const navigate = useNavigate()

  const [openDoc, setOpenDoc] = useState<
    'privacy' | 'terms' | 'marketing' | null
  >(null)
  const [gradeSheetOpen, setGradeSheetOpen] = useState(false)

  const user = getStoredAuth()
  const profile = getCachedStudentProfile()
  const displayName = resolveDisplayName(user, profile?.displayName).slice(
    0,
    SETTINGS_DISPLAY_NAME_MAX,
  )
  const provider: SocialProvider = user?.provider ?? 'kakao'
  const providerLabel = socialProviderLabel(provider)
  const [gradeValue, setGradeValue] = useState(profile?.grade ?? null)
  const gradeLabel = formatSettingsGradeLabel(gradeValue)
  const selectedGradeId = parseSettingsGradeId(gradeValue)

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
  const gradeStyle = settingsContentRectStyle(
    settingsCanvasToCropRect(SETTINGS_GRADE_VALUE),
  )
  const gradeHitStyle = settingsContentRectStyle(
    settingsCanvasToCropRect(SETTINGS_GRADE_HIT),
  )

  function handleActivateSettingsRow(row: SettingsListRow) {
    playTapSfx()

    if (row.action === 'mailto') {
      openSettingsContactMail()
      return
    }

    if (row.action === 'logout') {
      clearAuth()
      navigate('/login', { replace: true })
      return
    }

    if (row.action === 'privacy' || row.action === 'terms' || row.action === 'marketing') {
      setOpenDoc(row.action)
    }
  }

  async function handleSelectGrade(id: SettingsMiddleGradeId) {
    const option = SETTINGS_GRADE_OPTIONS.find((row) => row.id === id)
    if (!option) return

    setGradeValue(option.value)
    setGradeSheetOpen(false)

    await upsertStudentProfile({
      displayName: displayName || '학생',
      grade: option.value,
      birthdate: profile?.birthdate,
    })
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

        {/*
          시안에 구워진 가짜 상태바(시계·배터리)를 흰색으로 덮는다.
          **시계·아이콘은 그리지 않는다** — 실기기에서는 OS가 진짜 상태바를 그리므로
          우리가 그리면 두 겹이 되고, 하드코딩된 시각이 실제와 달라 고장처럼 보인다
          (2026-08-11 제거). 이 자리는 그냥 비워 둔다.
        */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[14] bg-white"
          style={{ height: `${(53 / FRAME_H) * 100}%` }}
          aria-hidden
        />

        {/* 베이크 이름·연동 뱃지 — 하늘 복제 패치로 가린 뒤 온보딩/로그인 값 */}
        <img
          src={SETTINGS_PROFILE_NAME_PATCH}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute z-[11] select-none"
          style={{
            ...stripStyle,
            objectFit: 'fill',
          }}
        />
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end overflow-hidden"
          style={nameStyle}
          aria-hidden
        >
          <span
            className={SETTINGS_PROFILE_NAME_CLASS}
            style={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            {displayName}
          </span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-center"
          style={badgeStyle}
          aria-hidden
        >
          <span
            className={`${SETTINGS_PROFILE_BADGE_CLASS} ${providerBadgeClass(provider)}`}
            style={{
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
            }}
          >
            {providerLabel}
          </span>
        </div>

        {/* 계정 행 우측 값 — 닉네임·연동·학년 동일 18px · 좌측 라벨과 세로 맞춤 */}
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={nickStyle}
          aria-hidden
        >
          <span
            className={SETTINGS_ACCOUNT_VALUE_CLASS}
            style={{ WebkitFontSmoothing: 'antialiased' }}
          >
            {displayName}
          </span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={linkedStyle}
          aria-hidden
        >
          <span
            className={SETTINGS_ACCOUNT_VALUE_CLASS}
            style={{ WebkitFontSmoothing: 'antialiased' }}
          >
            {providerLabel}
          </span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={gradeStyle}
          aria-hidden
        >
          <span
            className={SETTINGS_ACCOUNT_VALUE_CLASS}
            style={{ WebkitFontSmoothing: 'antialiased' }}
          >
            {gradeLabel}
          </span>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10">
          <button
            type="button"
            aria-label="학년 변경"
            className="pointer-events-auto absolute bg-transparent"
            style={gradeHitStyle}
            onClick={() => {
              playTapSfx()
              setGradeSheetOpen(true)
            }}
          />
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

      <BackButtonOverlay mask={BACK_MASK_SETTINGS} />

      <MainHomeBottomNav activeId="menu" onSelect={onSelectNav} />

      {gradeSheetOpen ? (
        <SettingsGradeSheet
          selectedId={selectedGradeId}
          onSelect={(id) => {
            void handleSelectGrade(id)
          }}
          onClose={() => setGradeSheetOpen(false)}
        />
      ) : null}

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
