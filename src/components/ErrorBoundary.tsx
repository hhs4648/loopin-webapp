import { Component, type ErrorInfo, type ReactNode } from 'react'

/**
 * 렌더 중 예외를 받아 **흰 화면 대신 되돌아갈 길**을 보여 준다.
 *
 * 없던 동안은 예외 하나에 React가 트리를 통째로 내려서 아무것도 없는 흰 화면이
 * 남았다. 학생은 앱이 죽은 걸로 보고, 무슨 일이 있었는지 알 방법도 없었다.
 *
 * 오류는 **한 번 누르면 서버로 간다**(`error_reports`). 학생이 말해 주지 않으면
 * 묻히던 것을 개발자가 바로 볼 수 있게 하려는 것이다. 보내고 나면 짧은 신고 번호를
 * 보여 준다 — 학생이 선생님께 그 번호만 말하면 대시보드에서 바로 찾을 수 있다.
 *
 * 보내는 건 고장 난 정황뿐이다. 입력한 내용이나 푼 문제는 담지 않는다.
 */

type Props = {
  children: ReactNode
  /**
   * 이 값이 바뀌면 오류 상태를 푼다. 화면(경로)이 바뀌면 다시 그려 볼 만하다는 뜻 —
   * 없으면 한 번 깨진 뒤로 앱 전체가 오류 화면에 갇힌다.
   */
  resetKey?: unknown
}

type SendState =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'sent'; code: string }
  | { kind: 'failed'; offline: boolean; detail: string | null }

type State = {
  error: Error | null
  /** 되짚기용 컴포넌트 스택 — 어느 화면에서 났는지 알려 준다 */
  componentStack: string | null
  send: SendState
}

/** 오류 화면에서 부를 수 있게, 소리를 멈추는 쪽은 실패해도 무시한다 */
function stopAllAudio() {
  try {
    window.speechSynthesis?.cancel()
  } catch {
    /* no-op */
  }
  try {
    document.querySelectorAll('audio').forEach((el) => {
      el.pause()
    })
  } catch {
    /* no-op */
  }
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null, send: { kind: 'idle' } }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    /*
      **소리를 먼저 끊는다.** 문제 풀이 중에 터지면 TTS가 계속 흘러나오는데,
      화면은 오류인데 영어 단어만 읽히면 더 고장 같아 보인다.
    */
    stopAllAudio()
    this.setState({ componentStack: info.componentStack ?? null })
    console.error('[haksup] 화면을 그리다 오류', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) {
      this.setState({ error: null, componentStack: null, send: { kind: 'idle' } })
    }
  }

  private handleSend = async () => {
    const { error, componentStack } = this.state
    if (!error || this.state.send.kind === 'sending') return
    this.setState({ send: { kind: 'sending' } })
    /*
      신고 모듈을 **누를 때 불러온다.** 최상단에서 import하면 Supabase 클라이언트가
      첫 화면 묶음에 딸려 들어간다 — 평소엔 쓰지도 않는 220KB를 모든 학생이 앱을
      열 때마다 받게 된다.
    */
    const { sendErrorReport } = await import('../lib/sync/error-report')
    const result = await sendErrorReport({ error, componentStack })
    this.setState({
      send: result.ok
        ? { kind: 'sent', code: result.code }
        : {
            kind: 'failed',
            offline: result.reason === 'offline',
            // 개발 중에는 이유가 보여야 한다 — 표가 없는 건지 정책에 막힌 건지 구분된다
            detail: import.meta.env.DEV ? (result.detail ?? null) : null,
          },
    })
  }

  private report(): string {
    const { error, componentStack } = this.state
    return [
      `학습 오류 신고`,
      `화면: ${window.location.pathname}`,
      `시각: ${new Date().toISOString()}`,
      `기기: ${navigator.userAgent}`,
      `내용: ${error?.name}: ${error?.message}`,
      ``,
      (error?.stack ?? '').slice(0, 1200),
      (componentStack ?? '').slice(0, 800),
    ].join('\n')
  }

  /** 신고 영역 — 보내기 전/보내는 중/보낸 뒤/실패 */
  private renderReporter(): ReactNode {
    const { send } = this.state

    if (send.kind === 'sent') {
      return (
        <div className="flex flex-col items-center gap-1.5" aria-live="polite">
          <p className="font-sans text-[14px] font-bold text-white">
            보냈어요. 고마워요!
          </p>
          <p className="font-sans text-[13px] font-medium text-white/75">
            신고 번호{' '}
            <span className="font-mono font-bold tracking-[0.08em] text-white">
              {send.code}
            </span>
          </p>
        </div>
      )
    }

    if (send.kind === 'failed') {
      return (
        <div className="flex flex-col items-center gap-2.5" aria-live="polite">
          <p className="font-sans text-[13px] font-medium text-white/80">
            {send.offline
              ? '인터넷이 끊겨서 못 보냈어요.'
              : '신고를 보내지 못했어요.'}
          </p>
          {send.detail ? (
            <p className="max-w-[320px] break-words font-mono text-[11px] leading-relaxed text-white/70">
              {send.detail}
            </p>
          ) : null}
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => void this.handleSend()}
              className="cursor-pointer font-sans text-[13px] font-semibold text-white underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              다시 보내기
            </button>
            {/* 끝내 못 보내면 손으로 옮길 수 있게 — 문의 메일에 붙이면 된다 */}
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard?.writeText(this.report())
              }}
              className="cursor-pointer font-sans text-[13px] font-semibold text-white/70 underline underline-offset-4 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              내용 복사
            </button>
          </div>
        </div>
      )
    }

    return (
      <button
        type="button"
        disabled={send.kind === 'sending'}
        onClick={() => void this.handleSend()}
        className="cursor-pointer font-sans text-[14px] font-bold text-white underline underline-offset-4 transition-opacity disabled:cursor-default disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {send.kind === 'sending' ? '보내는 중…' : '개발자에게 알리기'}
      </button>
    )
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children

    return (
      <div className="flex min-h-full w-full justify-center bg-[#2AA3FF]">
        <div className="flex w-full max-w-[540px] flex-col items-center justify-center gap-7 px-8 py-16 text-center">
          <div
            aria-hidden
            className="flex h-[72px] w-[72px] items-center justify-center rounded-full bg-white/20 font-sans text-[34px]"
          >
            😵
          </div>

          <div className="flex flex-col gap-2.5">
            <h1 className="font-sans text-[24px] font-extrabold leading-[1.35] tracking-[-0.02em] text-white">
              앗, 화면을 여는 데 실패했어요
            </h1>
            <p className="font-sans text-[15px] font-medium leading-[1.65] text-white/85">
              잠깐 문제가 생겼어요. 다시 시도해 볼까요?
              <br />
              풀던 내용은 저장돼 있어요.
            </p>
          </div>

          <div className="flex w-full max-w-[320px] flex-col gap-2.5">
            <button
              type="button"
              onClick={() =>
                this.setState({
                  error: null,
                  componentStack: null,
                  send: { kind: 'idle' },
                })
              }
              className="h-[52px] w-full cursor-pointer rounded-xl bg-white font-sans text-[16px] font-bold text-[#2AA3FF] transition-colors hover:bg-[#F1F8FF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              다시 시도하기
            </button>
            <button
              type="button"
              /*
                여기서는 라우터를 못 쓴다 — 라우터 안쪽이 깨져서 이 화면이 떴을 수도
                있어서, 통째로 다시 여는 편이 확실하다.
              */
              onClick={() => window.location.assign('/')}
              className="h-[52px] w-full cursor-pointer rounded-xl border-2 border-white/45 font-sans text-[16px] font-bold text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              처음 화면으로
            </button>
          </div>

          {this.renderReporter()}

          {import.meta.env.DEV ? (
            <pre className="max-h-48 w-full overflow-auto rounded-lg bg-black/25 p-3 text-left font-mono text-[11px] leading-relaxed text-white/90">
              {error.stack ?? `${error.name}: ${error.message}`}
            </pre>
          ) : null}
        </div>
      </div>
    )
  }
}
