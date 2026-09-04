import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { HaksupLogo } from '../components/HaksupLogo'
import { getPostAuthPath, getStoredAuth } from '../lib/auth'
import { startTemporaryStudent } from '../lib/temporary-student'

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

/**
 * 선생님 웹 주소.
 *
 * **기본값을 코드에 둔다.** 예전에는 `VITE_TEACHER_WEB_URL`만 봤는데, 이 값은
 * **빌드할 때** 있어야 한다 — 앱은 Codemagic이 빌드하므로 거기 환경변수가 비어 있으면
 * 배포본에 「아직 연결되지 않았어요」가 그대로 나간다. 공개 주소라 숨길 이유도 없다.
 * 환경변수가 있으면 그쪽이 이긴다(스테이징 등에서 갈아끼울 수 있게).
 */
const DEFAULT_TEACHER_WEB_URL = 'https://loopin-web-zeta.vercel.app'

const TEACHER_WEB_URL =
  import.meta.env.VITE_TEACHER_WEB_URL?.trim() || DEFAULT_TEACHER_WEB_URL

export function TeacherHandoffScreen() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => getStoredAuth())
  const [copied, setCopied] = useState(false)
  const [studentAsking, setStudentAsking] = useState(false)
  const [switching, setSwitching] = useState(false)

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

  /**
   * **학생으로 임시 참여.**
   *
   * 선생님 계정 그대로는 반에 못 들어간다(가입 RPC가 학생 역할만 받는다). 역할을
   * 바꾸면 두 앱이 공유하는 프로필이 뒤엉키므로, 로그아웃하고 임시 학생으로 시작한다.
   * 선생님 계정은 서버에 그대로 있어서 다시 로그인하면 이 화면으로 돌아온다.
   */
  const handleStartTemporaryStudent = async () => {
    if (switching) return
    setSwitching(true)
    await startTemporaryStudent()
    // 이름·학년을 받아야 반에 가입할 수 있다 — 학생 온보딩을 그대로 태운다
    navigate('/onboarding/student', { replace: true })
  }

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
        <div className="h-16 w-16 shrink-0">
          <HaksupLogo />
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
          onClick={() => setStudentAsking(true)}
          className="mt-8 h-[46px] w-full cursor-pointer rounded-xl bg-white/15 font-sans text-[14px] font-semibold text-white/90 transition-colors hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          학생으로 임시 참여하기
        </button>
      </div>

      {studentAsking ? (
        <div
          className="absolute inset-0 z-50 flex items-end justify-center bg-black/40 px-5 pb-8"
          role="dialog"
          aria-modal="true"
          aria-label="학생으로 임시 참여"
        >
          <div className="w-full max-w-[500px] rounded-[20px] bg-white p-6 shadow-[0_8px_24px_rgba(0,0,0,0.18)]">
            <h2 className="font-sans text-[18px] font-bold text-[#1E242F]">
              학생으로 임시 참여할까요?
            </h2>
            <p className="mt-2 font-sans text-[14px] font-medium leading-[1.6] text-[#5A6472]">
              초대코드를 넣으면 학생에게 보이는 화면을 그대로 볼 수 있어요.
            </p>
            <ul className="mt-3 flex flex-col gap-1 rounded-xl bg-[#F2F6FA] px-4 py-3 font-sans text-[13px] font-medium leading-[1.6] text-[#5A6472]">
              <li>· 선생님 계정에서 <b className="font-bold">로그아웃</b>돼요.</li>
              <li>· 임시 학생으로 푼 기록은 선생님 계정과 이어지지 않아요.</li>
              <li>
                · 선생님으로 돌아오려면 <b className="font-bold">다시 로그인</b>하면 돼요.
                반과 문제집은 그대로예요.
              </li>
            </ul>
            <div className="mt-4 flex gap-2.5">
              <button
                type="button"
                disabled={switching}
                onClick={() => setStudentAsking(false)}
                className="h-[52px] flex-1 cursor-pointer rounded-xl border-2 border-[#D7E3EE] font-sans text-[16px] font-bold text-[#5A6472] disabled:opacity-50"
              >
                취소
              </button>
              <button
                type="button"
                disabled={switching}
                onClick={() => void handleStartTemporaryStudent()}
                className="h-[52px] flex-1 cursor-pointer rounded-xl bg-[#2AA3FF] font-sans text-[16px] font-bold text-white disabled:opacity-50"
              >
                {switching ? '준비 중…' : '임시 참여하기'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
