import type { ReactNode } from 'react'
import { PhoneCanvas, PHONE_FRAME_H, PHONE_FRAME_W } from '../components/PhoneCanvas'
import {
  BACK_BUTTON_HIT,
  BACK_CHEVRON,
  BACK_CHEVRON_COLOR,
  figmaNavRectStyle,
} from '../components/navigation/figma-navigation'
import {
  EXERCISE_PROGRESS_BAR,
  figmaRectStyle,
} from '../components/exercise/ExerciseProgressBar'

/**
 * 개발 전용 — 뒤로가기 위치·대비·연쇄 레이아웃을 한눈에 본다.
 * `npm run dev` 후 `/__back-button-preview` 로 연다. 배포 빌드에는 라우트가 없다.
 */

const SCREENS = [
  '단어 짝맞추기 / TTS / 퀴즈 / 스펠',
  '본문 A / B / C',
  '문법 유형1 / 유형2',
  '파트·문법 완료',
  '복습 메인',
  '설정',
  '헬스장 시작(오답 풀기)',
  '연속·칭찬 캘린더',
  '온보딩(학생·선생님·회원유형)',
] as const

function pct(rect: { x: number; y: number; w: number; h: number }) {
  return figmaNavRectStyle(rect)
}

function BackChevron() {
  const cx = BACK_BUTTON_HIT.w / 2
  const cy = BACK_BUTTON_HIT.h / 2
  const halfW = BACK_CHEVRON.w / 2
  const halfH = BACK_CHEVRON.h / 2
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${BACK_BUTTON_HIT.w} ${BACK_BUTTON_HIT.h}`}
      className="h-full w-full"
      fill="none"
    >
      <path
        d={`M${cx + halfW} ${cy - halfH}L${cx - halfW} ${cy}L${cx + halfW} ${cy + halfH}`}
        stroke={BACK_CHEVRON_COLOR}
        strokeWidth={BACK_CHEVRON.strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function StatusBarBand() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 z-[50] border-b border-dashed border-red-400/70 bg-red-500/10"
      style={{ height: `${(54 / PHONE_FRAME_H) * 100}%` }}
    >
      <span className="absolute left-3 top-2 text-[10px] font-semibold text-red-600">
        OS 상태바 대략 y0–54
      </span>
    </div>
  )
}

function PhoneMock({
  title,
  bg,
  children,
}: {
  title: string
  bg: string
  children?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-center text-sm font-bold text-slate-800">{title}</p>
      <div
        className="relative mx-auto overflow-hidden rounded-[28px] border border-slate-200 shadow-lg"
        style={{
          width: 280,
          height: (280 * PHONE_FRAME_H) / PHONE_FRAME_W,
          background: bg,
        }}
      >
        <div className="absolute inset-0">
          <StatusBarBand />
          <button
            type="button"
            aria-label="뒤로가기"
            className="absolute z-[100] bg-transparent p-0"
            style={pct(BACK_BUTTON_HIT)}
          >
            <BackChevron />
          </button>
          {children}
        </div>
      </div>
    </div>
  )
}

export function BackButtonPreviewScreen() {
  return (
    <div className="min-h-full overflow-y-auto bg-slate-100 px-4 py-6">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-xl font-extrabold text-slate-900">
          뒤로가기 수정 미리보기
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          공통 좌표 <code className="rounded bg-white px-1">BACK_BUTTON_HIT</code>{' '}
          y=74 (옛 56) · 색{' '}
          <code className="rounded bg-white px-1">{BACK_CHEVRON_COLOR}</code> ·
          획 {BACK_CHEVRON.strokeWidth}. 빨간 점선은 상태바 대역입니다.
        </p>

        <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <PhoneMock title="문제 화면 (흰 배경)" bg="#FFFFFF">
            <div
              className="absolute z-[20] rounded-full bg-[#E3E7EA]"
              style={figmaRectStyle(EXERCISE_PROGRESS_BAR)}
            >
              <p className="flex h-full items-center justify-center text-[10px] font-semibold text-[#9E9FA7]">
                46%
              </p>
            </div>
            <div
              className="absolute z-30 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#F59E0B]"
              style={{
                right: `${(14 / PHONE_FRAME_W) * 100}%`,
                top: `${(156 / PHONE_FRAME_H) * 100}%`,
              }}
            >
              🔥4콤보
            </div>
            <p
              className="absolute text-[11px] text-slate-400"
              style={{
                left: '6%',
                top: `${(160 / PHONE_FRAME_H) * 100}%`,
              }}
            >
              본문/타일 영역 시작 ↓
            </p>
          </PhoneMock>

          <PhoneMock
            title="완료 화면 (하늘 그라데이션)"
            bg="linear-gradient(180deg, #ECFAFF 0%, #E2F7FF 100%)"
          />

          <PhoneMock title="온보딩 / 설정 톤 (흰)" bg="#FFFFFF">
            <p
              className="absolute text-[13px] font-bold text-slate-800"
              style={{
                left: `${(58 / PHONE_FRAME_W) * 100}%`,
                top: `${(86 / PHONE_FRAME_H) * 100}%`,
              }}
            >
              설정 · 복습 제목 줄
            </p>
          </PhoneMock>
        </div>

        <section className="mt-10 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">적용되는 화면</h2>
          <p className="mt-1 text-xs text-slate-500">
            `FigmaAssetFrame` / `BackButtonOverlay` / 온보딩·설정이 공통 HIT를 씁니다.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {SCREENS.map((label) => (
              <li
                key={label}
                className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                {label}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="text-base font-bold text-slate-900">연쇄 조정</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>
              게이지 <code>EXERCISE_PROGRESS_BAR</code> y 106→126 (뒤로가기 아래)
            </li>
              <li>콤보 배지 — 게이지 한 줄 아래(top 156), 막대와 안 겹침</li>
            <li>본문 A/B/C 상단(스피커·제시문·박스) +20px — 게이지와 겹침 방지</li>
            <li>온보딩 쉐브론도 공통 색·획으로 통일</li>
          </ul>
        </section>

        {/* 앱 셸과 같은 PhoneCanvas로도 한 장 */}
        <section className="mt-8">
          <h2 className="mb-3 text-base font-bold text-slate-900">
            PhoneCanvas 실측 (앱과 동일 비율)
          </h2>
          <div className="mx-auto h-[640px] max-w-[393px] overflow-hidden rounded-[32px] border border-slate-300 bg-white shadow-xl">
            <PhoneCanvas topBleedClassName="bg-white" bottomBleedClassName="bg-white">
              <StatusBarBand />
              <button
                type="button"
                aria-label="뒤로가기"
                className="absolute z-[100] bg-transparent p-0"
                style={pct(BACK_BUTTON_HIT)}
              >
                <BackChevron />
              </button>
              <div
                className="absolute z-[20] rounded-full bg-[#E3E7EA]"
                style={figmaRectStyle(EXERCISE_PROGRESS_BAR)}
              >
                <p className="flex h-full items-center justify-center text-[11px] font-semibold text-[#9E9FA7]">
                  46%
                </p>
              </div>
            </PhoneCanvas>
          </div>
        </section>
      </div>
    </div>
  )
}
