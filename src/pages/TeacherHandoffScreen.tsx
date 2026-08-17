import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LoopinLogo } from '../components/LoopinLogo'
import { getPostAuthPath, getStoredAuth } from '../lib/auth'

/**
 * 선생님 안내 — **앱에는 선생님 화면이 없다.**
 *
 * 온보딩까지는 앱에서 받고, 실제 수업 준비(반·문제집·과제)는 선생님 웹에서 한다.
 * 예전에는 여기서 `MainHomeScreen`을 그대로 띄워서 선생님이 **학생용 성 맵**을
 * 보게 됐다 — 로그인은 됐는데 할 수 있는 게 없는 화면이었다.
 *
 * 링크만 걸어 두지 않고 **주소 복사**를 같이 두는 이유: 선생님 웹은 1557×973
 * 데스크톱 레이아웃이라 폰에서 열면 쓸 수가 없다. 대부분 PC로 옮겨 가야 한다.
 */

/** 배포 주소는 환경변수로 — 도메인이 정해지면 `.env`만 고치면 된다 */
const TEACHER_WEB_URL = import.meta.env.VITE_TEACHER_WEB_URL?.trim() ?? ''

export function TeacherHandoffScreen() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getStoredAuth())
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const stored = getStoredAuth()
    if (!stored) {
      navigate('/login', { replace: true })
      return
    }
    if (stored.memberType !== 'teacher') {
      navigate(getPostAuthPath(stored), { replace: true })
      return
    }
    setUser(stored)
  }, [navigate])

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), 2000)
    return () => window.clearTimeout(timer)
  }, [copied])

  if (!user || user.memberType !== 'teacher') return null

  const handleCopy = async () => {
    if (!TEACHER_WEB_URL) return
    try {
      await navigator.clipboard.writeText(TEACHER_WEB_URL)
      setCopied(true)
    } catch {
      // 클립보드를 막아 둔 브라우저 — 주소는 화면에 그대로 보이니 직접 옮기면 된다
      setCopied(false)
    }
  }

  return (
    <div className="flex min-h-full w-full justify-center bg-[#2AA3FF]">
      <div className="relative flex w-full max-w-[540px] flex-col px-7 pb-10 pt-16">
        <div className="h-[52px] w-[136px] shrink-0">
          <LoopinLogo variant="splash" />
        </div>

        <div className="mt-9 flex flex-col gap-2">
          <h1 className="font-sans text-[26px] font-extrabold leading-[1.35] tracking-[-0.02em] text-white">
            {user.displayName ? `${user.displayName} 선생님,` : '선생님,'}
            <br />
            준비가 끝났어요
          </h1>
          <p className="font-sans text-[15px] font-medium leading-[1.6] text-white/85">
            반 만들기와 문제 출제는 <b className="font-bold">선생님 웹</b>에서 해요.
            {user.schoolName ? (
              <>
                <br />
                {user.schoolName}으로 등록되었어요.
              </>
            ) : null}
          </p>
        </div>

        <div className="mt-8 rounded-[20px] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
          {TEACHER_WEB_URL ? (
            <>
              <p className="font-sans text-[14px] font-semibold leading-[1.6] text-[#5A6472]">
                화면이 넓어야 시간표와 문제집이 한눈에 들어와요.
                <br />
                <b className="font-bold text-[#1E242F]">
                  컴퓨터에서 열어 주세요.
                </b>
              </p>

              <div className="mt-4 rounded-xl bg-[#F2F6FA] px-4 py-3">
                <p className="break-all font-mono text-[13px] font-medium leading-[1.5] text-[#3B4654]">
                  {TEACHER_WEB_URL}
                </p>
              </div>

              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  className="h-[52px] w-full cursor-pointer rounded-xl bg-[#2AA3FF] font-sans text-[16px] font-bold text-white transition-colors hover:bg-[#1B93EE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1B93EE]"
                >
                  {copied ? '주소를 복사했어요' : '주소 복사하기'}
                </button>
                <a
                  href={TEACHER_WEB_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-[52px] w-full items-center justify-center rounded-xl border-2 border-[#D7E3EE] font-sans text-[16px] font-bold text-[#3B7DBE] transition-colors hover:bg-[#F4F9FE] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#3B7DBE]"
                >
                  지금 바로 열기
                </a>
              </div>
            </>
          ) : (
            <p className="font-sans text-[15px] font-semibold leading-[1.7] text-[#5A6472]">
              선생님 웹 주소가 아직 연결되지 않았어요.
              <br />
              <span className="text-[13px] font-medium text-[#8A94A2]">
                배포 설정에 <code className="font-mono">VITE_TEACHER_WEB_URL</code>
                을 넣으면 이 자리에 표시돼요.
              </span>
            </p>
          )}
        </div>

        <div className="flex-1" />

        <button
          type="button"
          onClick={() => navigate('/onboarding/member-type', { replace: true })}
          className="mt-8 h-[46px] w-full cursor-pointer rounded-xl bg-white/15 font-sans text-[14px] font-semibold text-white/90 transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          학생으로 시작할래요
        </button>
      </div>
    </div>
  )
}
