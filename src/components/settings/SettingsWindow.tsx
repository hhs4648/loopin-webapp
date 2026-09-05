import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAuth,
  getStoredAuth,
  resolveDisplayName,
  saveAuth,
  socialProviderLabel,
  type SocialProvider,
} from '../../lib/auth'
import { deleteOwnAccount } from '../../lib/sync/account-api'
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
import { SettingsAccountSheet } from './SettingsAccountSheet'
import { SettingsGradeSheet } from './SettingsGradeSheet'
import { SettingsNameSheet } from './SettingsNameSheet'
import {
  SETTINGS_ACCOUNT_VALUE_CLASS,
  SETTINGS_DISPLAY_NAME_MAX,
  SETTINGS_DOC_URLS,
  SETTINGS_GRADE_HIT,
  SETTINGS_GRADE_OPTIONS,
  SETTINGS_GRADE_VALUE,
  SETTINGS_LINKED_HIT,
  SETTINGS_LINKED_VALUE,
  SETTINGS_LIST_ROWS,
  SETTINGS_NICKNAME_HIT,
  SETTINGS_NICKNAME_VALUE,
  SETTINGS_PROFILE_BADGE,
  SETTINGS_PROFILE_BADGE_CLASS,
  SETTINGS_PROFILE_NAME,
  SETTINGS_PROFILE_NAME_CLASS,
  SETTINGS_PROFILE_STRIP,
  SETTINGS_PROFILE_STRIP_BG,
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
  const [nameSheetOpen, setNameSheetOpen] = useState(false)
  const [accountSheetOpen, setAccountSheetOpen] = useState(false)

  const user = getStoredAuth()
  const profile = getCachedStudentProfile()
  /*
    이름은 **상태로 들고 있는다.** 설정 안에서 바꿀 수 있게 되면서, 저장소 값을 매 렌더
    다시 읽는 것만으로는 시트를 닫은 뒤 화면이 안 바뀐다.
  */
  const [displayName, setDisplayName] = useState(() =>
    resolveDisplayName(user, profile?.displayName).slice(
      0,
      SETTINGS_DISPLAY_NAME_MAX,
    ),
  )
  const provider: SocialProvider = user?.provider ?? 'kakao'
  /*
    선생님이 「학생으로 임시 참여」로 들어온 경우는 소셜 계정이 아니라 익명 세션이다.
    그대로 두면 연동 계정 자리에 로그인한 적 없는 provider 이름이 뜬다.
  */
  const isTemporary = user?.temporary === true
  const providerLabel = isTemporary ? '임시 참여' : socialProviderLabel(provider)
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

  /**
   * 이름 변경 — **서버가 먼저**다.
   * 로컬만 바꾸면 앱에서는 새 이름인데 선생님 명단에는 옛 이름이 남는다.
   */
  async function handleSaveName(
    name: string,
  ): Promise<{ ok: boolean; message?: string }> {
    const saved = await upsertStudentProfile({
      displayName: name,
      grade: gradeValue ?? undefined,
      birthdate: profile?.birthdate,
    })
    if (!saved) {
      return {
        ok: false,
        message: '이름을 저장하지 못했어요. 인터넷 연결을 확인해 주세요.',
      }
    }

    // `resolveDisplayName`이 로컬 auth를 먼저 보므로 여기도 같이 고쳐야 한다
    const current = getStoredAuth()
    if (current) saveAuth({ ...current, displayName: name })
    setDisplayName(name.slice(0, SETTINGS_DISPLAY_NAME_MAX))
    return { ok: true }
  }

  /**
   * 회원탈퇴 — 성공하면 돌아올 화면이 없다.
   *
   * **라우터로 넘기지 않고 앱을 통째로 다시 띄운다.** 이 화면 뒤에서는 과제 목록이
   * 주기적으로 다시 조회되는데, 그 경로가 세션이 없으면 `signInAnonymously()`로
   * **익명 사용자를 새로 만든다.** 방금 계정을 지운 직후에 그게 돌면 탈퇴하자마자
   * 빈 계정이 하나 생기고 토큰이 다시 저장된다. 새로고침이 그 타이머들을 확실히 끊는다.
   * 첫 화면(스플래시)은 세션이 없으면 로그인으로 보낸다.
   */
  async function handleDeleteAccount(): Promise<{
    ok: boolean
    message?: string
  }> {
    const result = await deleteOwnAccount()
    if (!result.ok) return result
    window.location.replace('/')
    return { ok: true }
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
          decoding="async"
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

        {/* 베이크 이름·연동 뱃지 — 하늘톤으로 가린 뒤 온보딩/로그인 값 */}
        <div
          className="pointer-events-none absolute z-[11]"
          style={{
            ...stripStyle,
            background: SETTINGS_PROFILE_STRIP_BG,
          }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end overflow-hidden"
          style={nameStyle}
          aria-hidden
        >
          <span className={SETTINGS_PROFILE_NAME_CLASS}>{displayName}</span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-center"
          style={badgeStyle}
          aria-hidden
        >
          <span
            className={`${SETTINGS_PROFILE_BADGE_CLASS} ${
              isTemporary
                ? 'bg-[#EEF1F5] text-[#5A6472]'
                : providerBadgeClass(provider)
            }`}
          >
            {providerLabel}
          </span>
        </div>

        {/* 계정 행 우측 값 — 닉네임·연동·학년 */}
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={nickStyle}
          aria-hidden
        >
          <span className={SETTINGS_ACCOUNT_VALUE_CLASS}>{displayName}</span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={linkedStyle}
          aria-hidden
        >
          <span className={SETTINGS_ACCOUNT_VALUE_CLASS}>{providerLabel}</span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end bg-white"
          style={gradeStyle}
          aria-hidden
        >
          <span className={SETTINGS_ACCOUNT_VALUE_CLASS}>{gradeLabel}</span>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10">
          <button
            type="button"
            aria-label="닉네임 변경"
            className="pointer-events-auto absolute bg-transparent"
            style={settingsContentRectStyle(
              settingsCanvasToCropRect(SETTINGS_NICKNAME_HIT),
            )}
            onClick={() => {
              playTapSfx()
              setNameSheetOpen(true)
            }}
          />
          <button
            type="button"
            aria-label="연동 계정, 회원탈퇴"
            className="pointer-events-auto absolute bg-transparent"
            style={settingsContentRectStyle(
              settingsCanvasToCropRect(SETTINGS_LINKED_HIT),
            )}
            onClick={() => {
              playTapSfx()
              setAccountSheetOpen(true)
            }}
          />
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

      {nameSheetOpen ? (
        <SettingsNameSheet
          initialName={displayName}
          onSubmit={handleSaveName}
          onClose={() => setNameSheetOpen(false)}
        />
      ) : null}

      {accountSheetOpen ? (
        <SettingsAccountSheet
          providerLabel={providerLabel}
          temporary={isTemporary}
          onDeleteAccount={handleDeleteAccount}
          onClose={() => setAccountSheetOpen(false)}
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
