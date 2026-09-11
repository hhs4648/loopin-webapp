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
import { useCurrentBackNavigation } from '../navigation/BackNavigationProvider'
import {
  BACK_BUTTON_HIT,
  BACK_CHEVRON,
  BACK_CHEVRON_COLOR,
  BACK_MASK_SETTINGS,
} from '../navigation/figma-navigation'
import { SettingsAccountSheet } from './SettingsAccountSheet'
import { SettingsDeleteSheet } from './SettingsDeleteSheet'
import { SettingsGradeSheet } from './SettingsGradeSheet'
import { SettingsNameSheet } from './SettingsNameSheet'
import {
  SETTINGS_ACCOUNT_VALUE_CLASS,
  SETTINGS_DELETE_ASSET,
  SETTINGS_DELETE_HIT,
  SETTINGS_DELETE_IMAGE,
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
  const { visible: backVisible, onBack } = useCurrentBackNavigation()

  const [openDoc, setOpenDoc] = useState<
    'privacy' | 'terms' | 'marketing' | null
  >(null)
  const [gradeSheetOpen, setGradeSheetOpen] = useState(false)
  const [nameSheetOpen, setNameSheetOpen] = useState(false)
  const [accountSheetOpen, setAccountSheetOpen] = useState(false)
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false)

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
   *
   * 도착지는 `/`(스플래시)가 아니라 **탈퇴 완료 화면**. 스플래시로 가면 예전에 쓰다
   * 남은 로그인 딥링크가 PKCE 오류 「로그인 실패」로 떨어지는 경우가 있었다.
   */
  async function handleDeleteAccount(): Promise<{
    ok: boolean
    message?: string
  }> {
    const result = await deleteOwnAccount()
    if (!result.ok) return result
    window.location.replace('/account-deleted')
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
          상태바 밴드를 크롭했으므로 뒤로가기도 설정 패널 좌표로 둔다.
          (공통 BackButtonOverlay 의 y=56 은 크롭 전 기준이라 어긋난다.)
        */}
        {backVisible ? (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute z-[99]"
              style={{
                ...settingsContentRectStyle(
                  settingsCanvasToCropRect(BACK_MASK_SETTINGS.rect),
                ),
                background: BACK_MASK_SETTINGS.color,
              }}
            />
            <button
              type="button"
              aria-label="뒤로가기"
              className="absolute z-[100] cursor-pointer bg-transparent p-0"
              style={settingsContentRectStyle(
                settingsCanvasToCropRect(BACK_BUTTON_HIT),
              )}
              onClick={onBack}
            >
              <svg
                aria-hidden
                viewBox={`0 0 ${BACK_BUTTON_HIT.w} ${BACK_BUTTON_HIT.h}`}
                className="h-full w-full"
                fill="none"
              >
                <path
                  d={`M${BACK_BUTTON_HIT.w / 2 + BACK_CHEVRON.w / 2} ${BACK_BUTTON_HIT.h / 2 - BACK_CHEVRON.h / 2}L${BACK_BUTTON_HIT.w / 2 - BACK_CHEVRON.w / 2} ${BACK_BUTTON_HIT.h / 2}L${BACK_BUTTON_HIT.w / 2 + BACK_CHEVRON.w / 2} ${BACK_BUTTON_HIT.h / 2 + BACK_CHEVRON.h / 2}`}
                  stroke={BACK_CHEVRON_COLOR}
                  strokeWidth={BACK_CHEVRON.strokeWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </>
        ) : null}

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
          <span className={`${SETTINGS_PROFILE_BADGE_CLASS} ${providerBadgeClass(provider)}`}>
            {providerLabel}
          </span>
        </div>

        {/* 계정 행 우측 값 — 닉네임·연동·학년. `>` 왼쪽만 쓰고 넘치면 자른다. */}
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end overflow-hidden"
          style={nickStyle}
          aria-hidden
        >
          <span className={SETTINGS_ACCOUNT_VALUE_CLASS}>{displayName}</span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end overflow-hidden"
          style={linkedStyle}
          aria-hidden
        >
          <span className={SETTINGS_ACCOUNT_VALUE_CLASS}>{providerLabel}</span>
        </div>
        <div
          className="pointer-events-none absolute z-[12] flex items-center justify-end overflow-hidden"
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
            aria-label="연동 계정"
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
          {/* 회원탈퇴 — Figma `회원탈퇴.svg` 오버레이 + 투명 히트 */}
          <img
            src={SETTINGS_DELETE_ASSET}
            alt=""
            aria-hidden
            draggable={false}
            className="pointer-events-none absolute z-[11] select-none"
            style={settingsContentRectStyle(
              settingsCanvasToCropRect(SETTINGS_DELETE_IMAGE),
            )}
          />
          <button
            type="button"
            aria-label="회원탈퇴"
            className="pointer-events-auto absolute z-[12] bg-transparent"
            style={settingsContentRectStyle(
              settingsCanvasToCropRect(SETTINGS_DELETE_HIT),
            )}
            onClick={() => {
              playTapSfx()
              setDeleteSheetOpen(true)
            }}
          />
        </div>
      </div>

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
          onClose={() => setAccountSheetOpen(false)}
        />
      ) : null}

      {deleteSheetOpen ? (
        <SettingsDeleteSheet
          onDeleteAccount={handleDeleteAccount}
          onClose={() => setDeleteSheetOpen(false)}
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
