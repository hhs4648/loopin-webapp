import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FigmaAssetFrame } from '../components/FigmaAssetFrame'
import { ClassRoundPillLabel } from '../components/main-home/ClassRoundPillLabel'
import {
  PRAISE_CALENDAR_FRAME_RECT,
  PraiseCalendarButton,
} from '../components/main-home/PraiseCalendarButton'
import { figmaRectStyle } from '../components/main-home/session-round-dropdown'
import { AssignmentReceivedScreen } from '../components/main-home/AssignmentReceivedScreen'
import type { CompletedCastleTarget } from '../components/main-home/AssignmentReceivedScreen'
import { MainHomeMapStartBackdrop } from '../components/main-home/MainHomeMapStartBackdrop'
import { MAIN_HOME_SKY } from '../components/main-home/session-round-dropdown'
import { WordMatchScreen } from '../components/word-match/WordMatchScreen'
import { WordListenMatchScreen } from '../components/word-listen-match/WordListenMatchScreen'
import { WordQuizScreen } from '../components/word-quiz/WordQuizScreen'
import { WordSpellScreen } from '../components/word-spell/WordSpellScreen'
import { LearningCompleteScreen } from '../components/learning-complete/LearningCompleteScreen'
import { BodyTextAScreen } from '../components/body-text-a/BodyTextAScreen'
import { BodyTextBScreen } from '../components/body-text-b/BodyTextBScreen'
import { BodyTextCScreen } from '../components/body-text-c/BodyTextCScreen'
import { BodyTextCompleteScreen } from '../components/body-text-complete/BodyTextCompleteScreen'
import { GrammarCompleteScreen } from '../components/grammar-complete/GrammarCompleteScreen'
import { GrammarType1Screen } from '../components/grammar-type-1/GrammarType1Screen'
import { GrammarType2Screen } from '../components/grammar-type-2/GrammarType2Screen'
import {
  preloadEnglishWordAudio,
  speakEnglishWord,
  stopEnglishWordAudio,
  WORD_QUIZ_QUESTIONS,
} from '../components/word-quiz/word-quiz'
import { CastleLearningScreen } from '../components/castle-learning/CastleLearningScreen'
import { stopKoreanSpeech } from '../components/castle-learning/speech-ko'
import { useBackNavigation } from '../components/navigation/BackNavigationProvider'
import { PraiseCalendarScreen } from '../components/praise-calendar/PraiseCalendarScreen'
import { NEXT_BTN } from '../components/onboarding/onboarding-ui'
import { SESSION_SECTION_OFFSETS, resolveDemoSessionStartStep } from '../components/exercise/session-questions'
import {
  buildRetrySectionSnapshot,
  getFirstRetrySection,
  getNextRetrySectionAfter,
  getWrongGrammarType2Questions,
  isFinalRetrySection as checkIsFinalRetrySection,
  sessionBodyTextAId,
  sessionBodyTextBId,
  sessionBodyTextCId,
  summarizeSessionResults,
  type RetrySection,
  type RetrySectionSnapshot,
  type SessionResults,
} from '../components/exercise/session-results'
import { BODY_TEXT_A_QUESTIONS } from '../components/body-text-a/body-text-a'
import { BODY_TEXT_B_QUESTIONS } from '../components/body-text-b/body-text-b'
import { BODY_TEXT_C_QUESTIONS } from '../components/body-text-c/body-text-c'
import type { RetryWrongExerciseProps } from '../components/exercise/retry-wrong-ui'
import { AssignmentRunnerScreen } from '../features/assignments/AssignmentRunnerScreen'
import {
  enrollWithInviteCode,
  fetchMyEnrollments,
  fetchPraisePassThreshold,
  fetchStudentAssignments,
  fetchWrongQuestionIds,
  resolveActiveClassId,
} from '../lib/sync/student-api'
import { isSyncEnabled } from '../lib/sync/supabase-client'
import type { StudentAssignment } from '../lib/sync/types'
import { DEFAULT_PASS_SCORE_THRESHOLD, resolveCalendarStartMonth } from '../components/praise-calendar/praise-calendar'

const ASSETS = {
  /** 초대 UI 오버레이(딤·입력·CTA) — 맵 배경은 `MainHomeMapStartBackdrop` */
  invite: '/assets/main-home-invite-ui.svg?v=1',
  waiting: '/assets/main-home-invite-entered.svg?v=2',
} as const

/** Figma 393×852 — 초대코드 입력 필드 (x=66 y=383 w=262 h=49) */
const INVITE_INPUT =
  'absolute left-[16.79%] top-[44.95%] h-[5.75%] w-[66.67%] rounded-[10px] bg-white px-4 text-base uppercase tracking-wide text-[#1e1e1e] outline-none'

/** Figma 393×852 — 입장하기 버튼 (x=30 y=659 w=333 h=60) */
const INVITE_SUBMIT = NEXT_BTN.replace('top-[86.97%]', 'top-[77.35%]')

type MainStep =
  | 'invite'
  | 'waiting'
  | 'assignment'
  | 'assignment-runner'
  | 'word-match'
  | 'word-listen-match'
  | 'word-quiz'
  | 'word-spell'
  | 'learning-complete'
  | 'body-text-a'
  | 'body-text-b'
  | 'body-text-c'
  | 'body-text-complete'
  | 'grammar-type-1'
  | 'grammar-type-2'
  | 'grammar-complete'
  | 'learning-1'
  | 'learning-2'
  | 'learning-3'
  | 'learning-4'
  | 'praise-calendar'

type MainNavigationSnapshot = {
  step: MainStep
  skipQuizInitialSpeak: boolean
  retryWrongOnly: boolean
  retrySnapshot: RetrySectionSnapshot | null
  isFinalRetrySection: boolean
}

function sanitizeInviteCode(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function retrySnapshotKey(snapshot: RetrySectionSnapshot): string {
  switch (snapshot.section) {
    case 'word-match':
    case 'word-listen-match':
      return snapshot.pairIds.join('-')
    case 'word-quiz':
    case 'word-spell':
    case 'body-text-a':
    case 'body-text-b':
    case 'body-text-c':
    case 'grammar-type-1':
    case 'grammar-type-2':
      return snapshot.questions.map((question) => question.id).join('-')
  }
}

/** 재도전/오답만 진입 시 학습 화면 강제 리마운트용 key */
function exerciseRemountKey(
  sessionEpoch: number,
  kind: string,
  retryWrongOnly: boolean,
  retrySnapshot: RetrySectionSnapshot | null,
) {
  const suffix =
    retryWrongOnly && retrySnapshot
      ? retrySnapshotKey(retrySnapshot)
      : 'all'
  return `${kind}-${sessionEpoch}-${suffix}`
}

/**
 * 오답 모드: 스냅샷 섹션이 맞으면 그 문항만, 아니면 [] (스킵).
 * undefined 를 절대 반환하지 않음 → 전체 은행 fallback 방지.
 * 일반 모드: undefined → 화면이 전체 은행 사용.
 */
function questionsForRetrySection<T extends { id: string }>(
  retryWrongOnly: boolean,
  retrySnapshot: RetrySectionSnapshot | null,
  section: RetrySection,
): T[] | undefined {
  if (!retryWrongOnly) return undefined
  if (
    retrySnapshot &&
    retrySnapshot.section === section &&
    'questions' in retrySnapshot
  ) {
    return retrySnapshot.questions as unknown as T[]
  }
  return []
}

function pairIdsForRetrySection(
  retryWrongOnly: boolean,
  retrySnapshot: RetrySectionSnapshot | null,
  section: 'word-match' | 'word-listen-match',
): string[] | undefined {
  if (!retryWrongOnly) return undefined
  if (
    retrySnapshot &&
    retrySnapshot.section === section &&
    'pairIds' in retrySnapshot
  ) {
    return retrySnapshot.pairIds
  }
  return []
}

function snapshotHasItems(snapshot: RetrySectionSnapshot): boolean {
  return 'questions' in snapshot
    ? snapshot.questions.length > 0
    : snapshot.pairIds.length > 0
}

export function MainHomeScreen() {
  const location = useLocation()
  // 온보딩 "선생님 초대를 받았어요" 선택 직후에는 기존에 남아있던 활성
  // 클래스/과제와 무관하게 항상 초대코드 입력 화면을 먼저 보여준다.
  const forceInviteStepRef = useRef(
    Boolean((location.state as { forceInviteStep?: boolean } | null)?.forceInviteStep),
  )
  const [step, setStep] = useState<MainStep>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [serverAssignments, setServerAssignments] = useState<StudentAssignment[]>(
    [],
  )
  const [activeClassName, setActiveClassName] = useState('A반')
  const [praisePassThreshold, setPraisePassThreshold] = useState(
    DEFAULT_PASS_SCORE_THRESHOLD,
  )
  /** 반 가입일들 — 칭찬 캘린더 시작 달 계산용 */
  const [enrolledAtList, setEnrolledAtList] = useState<string[]>([])
  const [activeAssignment, setActiveAssignment] =
    useState<StudentAssignment | null>(null)
  /** 서버 과제 오답 question_id — 「틀린문제만」활성화·필터용 */
  const [assignmentWrongQuestionIds, setAssignmentWrongQuestionIds] = useState<
    string[]
  >([])
  /** 과제 러너에 넘길 오답만 필터 (null = 전체) */
  const [assignmentOnlyQuestionIds, setAssignmentOnlyQuestionIds] = useState<
    string[] | null
  >(null)
  const [skipQuizInitialSpeak, setSkipQuizInitialSpeak] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResults>({})
  const [retryWrongOnly, setRetryWrongOnly] = useState(false)
  const [retrySnapshot, setRetrySnapshot] = useState<RetrySectionSnapshot | null>(null)
  const [isFinalRetrySection, setIsFinalRetrySection] = useState(false)
  /** 재도전/오답만 진입 시 학습 화면 강제 리마운트 */
  const [sessionEpoch, setSessionEpoch] = useState(0)
  const [round1MissionCompleted, setRound1MissionCompleted] = useState(false)
  const [star2LearningCompleted, setStar2LearningCompleted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  /** 완료 성 재도전 중 — 맵 「현재 위치」는 유지하고 해당 성에만 표시 */
  const [retryingAssignmentId, setRetryingAssignmentId] = useState<string | null>(
    null,
  )
  const [retryingDemoIndex, setRetryingDemoIndex] = useState<0 | 1 | null>(null)
  /** 완료 성에서 연 완료 화면 — 재도전 시 해당 과제/데모로 복귀 */
  const [completedCastleSource, setCompletedCastleSource] =
    useState<CompletedCastleTarget | null>(null)
  const prevStepRef = useRef<MainStep>(step)
  const stepRef = useRef<MainStep>(step)
  const sessionResultsRef = useRef(sessionResults)
  /** 완료 화면 진입 시점의 결과 — 틀린문제만은 이 스냅샷 기준 */
  const completeResultsRef = useRef<SessionResults | null>(null)
  const retryWrongOnlyRef = useRef(false)
  const retrySnapshotRef = useRef<RetrySectionSnapshot | null>(null)
  const navigationStackRef = useRef<MainNavigationSnapshot[]>([])
  /** 재도전 직후 뒤로가기 오발 방지 (화면 전환 클릭 관통) */
  const blockBackUntilRef = useRef(0)

  stepRef.current = step
  retryWrongOnlyRef.current = retryWrongOnly
  retrySnapshotRef.current = retrySnapshot

  const goToStep = (
    nextStep: MainStep,
    options: { replace?: boolean } = {},
  ) => {
    if (nextStep === stepRef.current) return
    setSettingsOpen(false)
    if (!options.replace) {
      navigationStackRef.current.push({
        step: stepRef.current,
        skipQuizInitialSpeak,
        retryWrongOnly,
        retrySnapshot,
        isFinalRetrySection,
      })
    }
    stepRef.current = nextStep
    setStep(nextStep)
  }

  const goBack = () => {
    if (Date.now() < blockBackUntilRef.current) return
    if (settingsOpen) {
      setSettingsOpen(false)
      return
    }
    const previous = navigationStackRef.current.pop()
    if (!previous) return

    stopEnglishWordAudio()
    stopKoreanSpeech()
    setSkipQuizInitialSpeak(previous.skipQuizInitialSpeak)
    setRetryWrongOnly(previous.retryWrongOnly)
    setRetrySnapshot(previous.retrySnapshot)
    setIsFinalRetrySection(previous.isFinalRetrySection)
    stepRef.current = previous.step
    setStep(previous.step)
  }

  /** 홈 → 학원/학교 메인 맵 (`/student/home`, 구어 student/main) */
  const goToStudentMain = () => {
    setSettingsOpen(false)
    if (stepRef.current === 'assignment') return
    navigationStackRef.current = []
    stepRef.current = 'assignment'
    setStep('assignment')
  }

  useBackNavigation(
    goBack,
    settingsOpen ||
      (step !== 'invite' && navigationStackRef.current.length > 0),
  )

  useEffect(() => {
    sessionResultsRef.current = sessionResults
  }, [sessionResults])

  const sessionScoreStats = useMemo(() => {
    const fromState = summarizeSessionResults(sessionResults)
    const fromRef = summarizeSessionResults(sessionResultsRef.current)
    const stateAnswered = fromState.correctCount + fromState.wrongCount
    const refAnswered = fromRef.correctCount + fromRef.wrongCount
    return refAnswered > stateAnswered ? fromRef : fromState
  }, [sessionResults])

  const [completeScoreStats, setCompleteScoreStats] = useState<ReturnType<
    typeof summarizeSessionResults
  > | null>(null)

  const openGrammarComplete = () => {
    const results = { ...sessionResultsRef.current }
    completeResultsRef.current = results
    const stats = summarizeSessionResults(results)
    setCompleteScoreStats(stats)
    setCompletedCastleSource(null)
    setSettingsOpen(false)
    // goToStep 조기 return에 막히지 않도록 완료 화면은 항상 진입
    if (stepRef.current !== 'grammar-complete') {
      navigationStackRef.current.push({
        step: stepRef.current,
        skipQuizInitialSpeak,
        retryWrongOnly: retryWrongOnlyRef.current,
        retrySnapshot: retrySnapshotRef.current,
        isFinalRetrySection,
      })
    }
    stepRef.current = 'grammar-complete'
    setStep('grammar-complete')
  }

  /** 맵에서 완료된 성 탭 → 세션 완료와 동일한 `GrammarCompleteScreen` */
  const openCompletedCastle = (
    target: CompletedCastleTarget,
    options: { replace?: boolean } = {},
  ) => {
    setCompletedCastleSource(target)
    setSettingsOpen(false)

    if (target.kind === 'assignment') {
      const totalCount = Math.max(0, target.assignment.questionTotal)
      const scoreRaw =
        target.assignment.latestScore ?? target.assignment.firstScore ?? 0
      const score = Math.max(0, Math.min(100, scoreRaw))
      const correctCount =
        totalCount <= 0 ? 0 : Math.round((score / 100) * totalCount)
      const wrongCount = Math.max(0, totalCount - correctCount)
      setCompleteScoreStats({
        correctCount,
        wrongCount,
        totalCount,
        score,
      })
      completeResultsRef.current = null

      const attemptId = target.assignment.latestAttemptId
      if (attemptId) {
        void fetchWrongQuestionIds(attemptId).then((ids) => {
          if (ids.length === 0) return
          setAssignmentWrongQuestionIds(ids)
          if (totalCount <= 0) return
          const nextWrong = ids.length
          const nextCorrect = Math.max(0, totalCount - nextWrong)
          setCompleteScoreStats({
            correctCount: nextCorrect,
            wrongCount: nextWrong,
            totalCount,
            score: Math.round((nextCorrect / totalCount) * 100),
          })
        })
      }
    } else if (target.index === 0) {
      const results = { ...sessionResultsRef.current }
      const stats = summarizeSessionResults(results)
      if (stats.correctCount + stats.wrongCount > 0) {
        completeResultsRef.current = results
        setCompleteScoreStats(stats)
      } else {
        completeResultsRef.current = null
        setCompleteScoreStats({
          correctCount: 0,
          wrongCount: 0,
          totalCount: stats.totalCount,
          score: 0,
        })
      }
    } else {
      // 2회차 성 학습 완료 — 퀴즈 점수 없음
      completeResultsRef.current = null
      setCompleteScoreStats({
        correctCount: 1,
        wrongCount: 0,
        totalCount: 1,
        score: 100,
      })
    }

    if (options.replace) {
      seedBackToAssignment()
    } else if (stepRef.current !== 'grammar-complete') {
      navigationStackRef.current.push({
        step: stepRef.current,
        skipQuizInitialSpeak,
        retryWrongOnly: retryWrongOnlyRef.current,
        retrySnapshot: retrySnapshotRef.current,
        isFinalRetrySection,
      })
    }
    stepRef.current = 'grammar-complete'
    setStep('grammar-complete')
  }

  const bodyTextCorrectCount = useMemo(() => {
    const ids = [
      ...BODY_TEXT_A_QUESTIONS.map((question) => sessionBodyTextAId(question.id)),
      ...BODY_TEXT_B_QUESTIONS.map((question) => sessionBodyTextBId(question.id)),
      ...BODY_TEXT_C_QUESTIONS.map((question) => sessionBodyTextCId(question.id)),
    ]
    return ids.filter((id) => sessionResults[id] === true).length
  }, [sessionResults])

  const handleSessionAnswer = (stepId: string, isCorrect: boolean) => {
    setSessionResults((prev) => {
      const next = { ...prev, [stepId]: isCorrect }
      sessionResultsRef.current = next
      return next
    })
  }

  const resetFullSession = () => {
    setSessionResults({})
    sessionResultsRef.current = {}
    completeResultsRef.current = null
    setRetryWrongOnly(false)
    setRetrySnapshot(null)
    setIsFinalRetrySection(false)
    setRound1MissionCompleted(false)
    setCompleteScoreStats(null)
  }

  const seedBackToAssignment = () => {
    navigationStackRef.current = [
      {
        step: 'assignment',
        skipQuizInitialSpeak: false,
        retryWrongOnly: false,
        retrySnapshot: null,
        isFinalRetrySection: false,
      },
    ]
  }

  /** 문제가 있는 첫 섹션부터 전체 세션 진입 (재도전·맵 진입 공용) */
  const enterFullDemoSession = (options?: { markRetrying?: boolean }) => {
    const markRetrying = Boolean(options?.markRetrying)
    resetFullSession()
    // 재도전 중엔 1성 완료 표시를 유지해 「재도전 중!」·캐릭터 후퇴가 보이도록 함
    if (markRetrying) {
      setRound1MissionCompleted(true)
      setRetryingDemoIndex(0)
    } else {
      setRetryingDemoIndex(null)
    }
    seedBackToAssignment()
    setSkipQuizInitialSpeak(false)
    setSessionEpoch((n) => n + 1)
    setSettingsOpen(false)
    // 완료 화면 하단 CTA → 퀴즈 전환 시 클릭 관통해 뒤로가기/홈이 눌리는 것 방지
    blockBackUntilRef.current = Date.now() + 600
    const start = resolveDemoSessionStartStep()
    stepRef.current = start
    setStep(start)
  }

  const handleRetryFlowHome = () => {
    setRound1MissionCompleted(true)
    setRetryingDemoIndex((prev) => (prev === 0 ? null : prev))
    setRetryWrongOnly(false)
    setRetrySnapshot(null)
    setIsFinalRetrySection(false)
    completeResultsRef.current = null
    goToStep('assignment')
  }

  const beginRetrySection = (
    section: RetrySection | 'grammar-complete',
    results: SessionResults,
  ) => {
    if (section === 'grammar-complete') {
      setRetryWrongOnly(false)
      setRetrySnapshot(null)
      setIsFinalRetrySection(false)
      openGrammarComplete()
      return
    }

    const snapshot = buildRetrySectionSnapshot(section, results)
    setRetryWrongOnly(true)
    setRetrySnapshot(snapshot)
    setIsFinalRetrySection(checkIsFinalRetrySection(section, results))
    // 스냅샷·스텝을 같은 틱에 맞추고, goToStep 조기 return 회피
    if (stepRef.current === section) {
      setSessionEpoch((n) => n + 1)
    }
    goToStep(section)
  }

  const advanceAfterRetrySection = (completedSection: RetrySection) => {
    const results =
      completeResultsRef.current ?? sessionResultsRef.current
    // 재시도 중 덮어쓴 최신 결과 우선
    const merged = { ...results, ...sessionResultsRef.current }
    const next = getNextRetrySectionAfter(completedSection, merged)
    beginRetrySection(next, merged)
  }

  const handleGrammarType1Complete = () => {
    if (retryWrongOnly) {
      const merged = {
        ...(completeResultsRef.current ?? {}),
        ...sessionResultsRef.current,
      }
      const type2Wrong = getWrongGrammarType2Questions(merged)
      if (type2Wrong.length > 0) {
        beginRetrySection('grammar-type-2', merged)
        return
      }
      advanceAfterRetrySection('grammar-type-1')
      return
    }

    goToStep('grammar-type-2')
  }

  const handleRetryAll = () => {
    const source = completedCastleSource
    setCompletedCastleSource(null)

    if (source?.kind === 'assignment') {
      seedBackToAssignment()
      setRetryingAssignmentId(source.assignment.assignmentId)
      setRetryingDemoIndex(null)
      setAssignmentOnlyQuestionIds(null)
      setActiveAssignment(source.assignment)
      setSettingsOpen(false)
      blockBackUntilRef.current = Date.now() + 600
      // 맵에 「재도전 중」이 먼저 보이도록 한 뒤 풀이 진입
      stepRef.current = 'assignment'
      setStep('assignment')
      window.setTimeout(() => {
        if (stepRef.current !== 'assignment') return
        stepRef.current = 'assignment-runner'
        setStep('assignment-runner')
      }, 700)
      return
    }

    if (source?.kind === 'demo' && source.index === 1) {
      seedBackToAssignment()
      setRetryingAssignmentId(null)
      setRetryingDemoIndex(1)
      setSettingsOpen(false)
      blockBackUntilRef.current = Date.now() + 600
      stepRef.current = 'assignment'
      setStep('assignment')
      window.setTimeout(() => {
        if (stepRef.current !== 'assignment') return
        stepRef.current = 'learning-1'
        setStep('learning-1')
      }, 700)
      return
    }

    // 전체 처음부터 — 맵에 재도전 표시 후 세션 진입
    seedBackToAssignment()
    setRound1MissionCompleted(true)
    setRetryingDemoIndex(0)
    setSettingsOpen(false)
    blockBackUntilRef.current = Date.now() + 600
    stepRef.current = 'assignment'
    setStep('assignment')
    window.setTimeout(() => {
      if (stepRef.current !== 'assignment') return
      enterFullDemoSession({ markRetrying: true })
    }, 700)
  }

  const handleRetryWrongOnly = () => {
    if (completedCastleSource?.kind === 'demo' && completedCastleSource.index === 1) {
      return
    }

    // 서버 과제 — 오답 question_id만 다시 출제
    if (completedCastleSource?.kind === 'assignment') {
      const source = completedCastleSource
      const wrongIds = assignmentWrongQuestionIds
      if (wrongIds.length <= 0) return
      setCompletedCastleSource(null)
      seedBackToAssignment()
      setRetryingAssignmentId(source.assignment.assignmentId)
      setRetryingDemoIndex(null)
      setAssignmentOnlyQuestionIds(wrongIds)
      setActiveAssignment(source.assignment)
      setSettingsOpen(false)
      blockBackUntilRef.current = Date.now() + 600
      stepRef.current = 'assignment'
      setStep('assignment')
      window.setTimeout(() => {
        if (stepRef.current !== 'assignment') return
        stepRef.current = 'assignment-runner'
        setStep('assignment-runner')
      }, 700)
      return
    }

    // 완료 화면 점수와 동일한 스냅샷 기준
    const results =
      completeResultsRef.current ?? sessionResultsRef.current
    const stats = summarizeSessionResults(results)
    if (stats.wrongCount <= 0) return

    const firstSection = getFirstRetrySection(results)
    if (!firstSection) return

    const snapshot = buildRetrySectionSnapshot(firstSection, results)
    if (!snapshotHasItems(snapshot)) return

    setCompletedCastleSource(null)
    setRetryWrongOnly(true)
    setRetrySnapshot(snapshot)
    setIsFinalRetrySection(checkIsFinalRetrySection(firstSection, results))
    seedBackToAssignment()
    setSessionEpoch((n) => n + 1)
    setSettingsOpen(false)
    setSkipQuizInitialSpeak(false)
    setRetryingDemoIndex(0)
    blockBackUntilRef.current = Date.now() + 600
    stepRef.current = firstSection
    setStep(firstSection)
  }

  const handleGoHome = (options?: { markRound1Complete?: boolean }) => {
    setCompletedCastleSource(null)
    resetFullSession()
    if (options?.markRound1Complete) {
      setRound1MissionCompleted(true)
      setRetryingDemoIndex((prev) => (prev === 0 ? null : prev))
    }
    goToStep('assignment')
  }

  const retryExerciseProps: RetryWrongExerciseProps = retryWrongOnly
    ? {
        hideProgressBar: true,
        isFinalRetrySection,
        onRetryFlowHome: handleRetryFlowHome,
      }
    : {}

  const calendarStart = useMemo(
    () =>
      resolveCalendarStartMonth({
        enrolledAtList,
        lessonDates: serverAssignments.map((a) => a.lessonDate),
      }),
    [enrolledAtList, serverAssignments],
  )

  const refreshAssignments = async () => {
    const classId = await resolveActiveClassId()
    if (!classId) {
      setServerAssignments([])
      return
    }
    const [list, threshold, enrollments] = await Promise.all([
      fetchStudentAssignments(classId),
      fetchPraisePassThreshold(classId),
      fetchMyEnrollments(),
    ])
    setServerAssignments(list)
    setPraisePassThreshold(threshold)
    const active = enrollments.find((e) => e.classId === classId)
    if (active?.className) setActiveClassName(active.className)
    setEnrolledAtList(enrollments.map((e) => e.enrolledAt).filter(Boolean))
  }

  useEffect(() => {
    if (!isSyncEnabled()) return
    if (forceInviteStepRef.current) return
    let cancelled = false
    void (async () => {
      const classId = await resolveActiveClassId()
      if (cancelled || !classId) return
      const [list, threshold, enrollments] = await Promise.all([
        fetchStudentAssignments(classId),
        fetchPraisePassThreshold(classId),
        fetchMyEnrollments(),
      ])
      if (cancelled) return
      setServerAssignments(list)
      setPraisePassThreshold(threshold)
      const active = enrollments.find((e) => e.classId === classId)
      if (active?.className) setActiveClassName(active.className)
      setEnrolledAtList(enrollments.map((e) => e.enrolledAt).filter(Boolean))
      setStep((current) => (current === 'invite' ? 'assignment' : current))
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // 성 맵(assignment) 화면에 진입할 때마다 과제 목록 재조회
  useEffect(() => {
    if (step !== 'assignment' || !isSyncEnabled()) return
    let cancelled = false
    void (async () => {
      const classId = await resolveActiveClassId()
      if (cancelled || !classId) return
      const [list, threshold] = await Promise.all([
        fetchStudentAssignments(classId),
        fetchPraisePassThreshold(classId),
      ])
      if (cancelled) return
      setServerAssignments(list)
      setPraisePassThreshold(threshold)
    })()
    return () => {
      cancelled = true
    }
  }, [step])

  useEffect(() => {
    if (step !== 'waiting') return
    // waiting is only used as a brief success flash before assignment
  }, [step])

  useEffect(() => {
    if (step !== 'word-match' && step !== 'word-listen-match') return
    void preloadEnglishWordAudio()
  }, [step])

  useEffect(() => {
    const prevStep = prevStepRef.current
    prevStepRef.current = step

    if (
      (prevStep === 'word-quiz' && step !== 'word-quiz') ||
      (prevStep === 'word-listen-match' && step !== 'word-listen-match')
    ) {
      stopEnglishWordAudio()
      if (prevStep === 'word-quiz') {
        setSkipQuizInitialSpeak(false)
      }
    }

    const wasLearning =
      prevStep === 'learning-1' ||
      prevStep === 'learning-2' ||
      prevStep === 'learning-3' ||
      prevStep === 'learning-4'
    const isLearning =
      step === 'learning-1' ||
      step === 'learning-2' ||
      step === 'learning-3' ||
      step === 'learning-4'
    if (wasLearning && !isLearning) {
      stopKoreanSpeech()
    }
  }, [step])

  const tryEnter = () => {
    const cleaned = sanitizeInviteCode(inviteCode)
    if (!cleaned) {
      setInviteError('초대코드를 입력해 주세요.')
      return
    }
    setInviteError(null)
    setInviteLoading(true)

    void (async () => {
      if (!isSyncEnabled()) {
        setInviteLoading(false)
        setInviteError('서버 연결이 없어요. .env.local을 확인해 주세요.')
        return
      }

      const result = await enrollWithInviteCode(cleaned)
      if (result.ok || result.code === 'ALREADY_ENROLLED') {
        if (result.class?.id) {
          // active class already set in enroll helper
        }
        await refreshAssignments()
        setInviteLoading(false)
        goToStep('assignment', { replace: true })
        return
      }

      setInviteLoading(false)
      setInviteError(result.message)
    })()
  }

  if (step === 'waiting') {
    return (
      <FigmaAssetFrame
        src={ASSETS.waiting}
        alt="초대코드 입력 후 메인 화면"
        bgClassName="bg-[#E2F7FF]"
        backButton="labeled"
      >
        <ClassRoundPillLabel
          surface="dimmed"
          classLabel={activeClassName}
          roundLabel="과제"
        />
        <PraiseCalendarButton
          surface="dimmed"
          style={figmaRectStyle(PRAISE_CALENDAR_FRAME_RECT)}
        />
      </FigmaAssetFrame>
    )
  }

  if (step === 'assignment-runner' && activeAssignment) {
    const running = activeAssignment
    const onlyIds = assignmentOnlyQuestionIds
    return (
      <AssignmentRunnerScreen
        assignment={running}
        onlyQuestionIds={onlyIds}
        onExit={() => {
          setActiveAssignment(null)
          setAssignmentOnlyQuestionIds(null)
          void refreshAssignments()
          goToStep('assignment', { replace: true })
        }}
        onCompleted={(info) => {
          setRetryingAssignmentId(null)
          setActiveAssignment(null)
          setAssignmentOnlyQuestionIds(null)
          setAssignmentWrongQuestionIds(info?.wrongQuestionIds ?? [])
          void (async () => {
            let next: StudentAssignment = {
              ...running,
              status: 'completed',
            }
            if (isSyncEnabled()) {
              try {
                const list = await fetchStudentAssignments(running.classId)
                setServerAssignments(list)
                const updated = list.find(
                  (a) => a.assignmentId === running.assignmentId,
                )
                if (updated) next = updated
              } catch {
                /* 목록 갱신 실패해도 완료 화면은 연다 */
              }
            }
            openCompletedCastle(
              { kind: 'assignment', assignment: next },
              { replace: true },
            )
          })()
        }}
      />
    )
  }

  if (step === 'grammar-complete') {
    const stats = completeScoreStats ?? sessionScoreStats
    const isDemoLearningCastle =
      completedCastleSource?.kind === 'demo' &&
      completedCastleSource.index === 1
    const isAssignmentCastle = completedCastleSource?.kind === 'assignment'
    const allowWrongOnly = isDemoLearningCastle
      ? false
      : isAssignmentCastle
        ? assignmentWrongQuestionIds.length > 0
        : true
    const displayWrongCount =
      isAssignmentCastle && assignmentWrongQuestionIds.length > 0
        ? assignmentWrongQuestionIds.length
        : stats.wrongCount
    const displayCorrectCount =
      isAssignmentCastle &&
      assignmentWrongQuestionIds.length > 0 &&
      stats.totalCount > 0
        ? Math.max(0, stats.totalCount - assignmentWrongQuestionIds.length)
        : stats.correctCount
    return (
      <GrammarCompleteScreen
        key={
          completedCastleSource
            ? `castle-${completedCastleSource.kind}-${
                completedCastleSource.kind === 'assignment'
                  ? completedCastleSource.assignment.assignmentId
                  : completedCastleSource.index
              }`
            : 'session-complete'
        }
        correctCount={displayCorrectCount}
        wrongCount={displayWrongCount}
        totalCount={stats.totalCount}
        roundNumber={1}
        className={activeClassName}
        assignments={isSyncEnabled() ? serverAssignments : undefined}
        onRetryAll={handleRetryAll}
        onRetryWrongOnly={allowWrongOnly ? handleRetryWrongOnly : undefined}
        onHome={() =>
          handleGoHome({
            markRound1Complete:
              completedCastleSource == null ||
              (completedCastleSource.kind === 'demo' &&
                completedCastleSource.index === 0),
          })
        }
      />
    )
  }

  if (step === 'grammar-type-2') {
    return (
      <GrammarType2Screen
        key={exerciseRemountKey(sessionEpoch, 'g2', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.grammarType2}
        questions={questionsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'grammar-type-2',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('grammar-type-2')
            return
          }
          openGrammarComplete()
        }}
      />
    )
  }

  if (step === 'grammar-type-1') {
    return (
      <GrammarType1Screen
        key={exerciseRemountKey(sessionEpoch, 'g1', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.grammarType1}
        questions={questionsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'grammar-type-1',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={handleGrammarType1Complete}
      />
    )
  }

  if (step === 'body-text-complete') {
    return (
      <BodyTextCompleteScreen
        correctCount={bodyTextCorrectCount}
        onContinue={() => goToStep('grammar-type-1')}
      />
    )
  }

  if (step === 'body-text-c') {
    return (
      <BodyTextCScreen
        key={exerciseRemountKey(sessionEpoch, 'c', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.bodyTextC}
        questions={questionsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'body-text-c',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('body-text-c')
            return
          }
          goToStep('body-text-complete')
        }}
      />
    )
  }

  if (step === 'body-text-b') {
    return (
      <BodyTextBScreen
        key={exerciseRemountKey(sessionEpoch, 'b', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.bodyTextB}
        questions={questionsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'body-text-b',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('body-text-b')
            return
          }
          goToStep('body-text-c')
        }}
      />
    )
  }

  if (step === 'body-text-a') {
    return (
      <BodyTextAScreen
        key={exerciseRemountKey(sessionEpoch, 'a', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.bodyTextA}
        questions={questionsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'body-text-a',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('body-text-a')
            return
          }
          goToStep('body-text-b')
        }}
      />
    )
  }

  if (step === 'learning-complete') {
    return (
      <LearningCompleteScreen
        onContinue={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-spell')
            return
          }
          goToStep('body-text-a')
        }}
      />
    )
  }

  if (step === 'word-spell') {
    return (
      <WordSpellScreen
        key={exerciseRemountKey(sessionEpoch, 'spell', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.wordSpell}
        questions={questionsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'word-spell',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-spell')
            return
          }
          goToStep('learning-complete')
        }}
      />
    )
  }

  if (step === 'word-quiz') {
    return (
      <WordQuizScreen
        key={exerciseRemountKey(sessionEpoch, 'quiz', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.wordQuiz}
        questions={questionsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'word-quiz',
        )}
        onAnswer={handleSessionAnswer}
        skipInitialSpeak={skipQuizInitialSpeak}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-quiz')
            return
          }
          goToStep('word-spell')
        }}
      />
    )
  }

  if (step === 'word-listen-match') {
    return (
      <WordListenMatchScreen
        key={exerciseRemountKey(
          sessionEpoch,
          'listen',
          retryWrongOnly,
          retrySnapshot,
        )}
        sessionOffset={SESSION_SECTION_OFFSETS.wordListenMatch}
        retryPairIds={pairIdsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'word-listen-match',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-listen-match')
            return
          }

          speakEnglishWord(WORD_QUIZ_QUESTIONS[0].word, { force: true })
          setSkipQuizInitialSpeak(true)
          goToStep('word-quiz')
        }}
      />
    )
  }

  if (step === 'word-match') {
    return (
      <WordMatchScreen
        key={exerciseRemountKey(sessionEpoch, 'match', retryWrongOnly, retrySnapshot)}
        sessionOffset={SESSION_SECTION_OFFSETS.wordMatch}
        retryPairIds={pairIdsForRetrySection(
          retryWrongOnly,
          retrySnapshot,
          'word-match',
        )}
        onAnswer={handleSessionAnswer}
        {...retryExerciseProps}
        onComplete={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-match')
            return
          }

          goToStep('word-listen-match')
        }}
      />
    )
  }

  if (step === 'learning-4') {
    return (
      <CastleLearningScreen
        stepId={4}
        onComplete={() => {
          setStar2LearningCompleted(true)
          setRetryingDemoIndex((prev) => (prev === 1 ? null : prev))
          goToStep('assignment')
        }}
      />
    )
  }

  if (step === 'learning-3') {
    return (
      <CastleLearningScreen
        stepId={3}
        onComplete={() => goToStep('learning-4')}
      />
    )
  }

  if (step === 'learning-2') {
    return (
      <CastleLearningScreen
        stepId={2}
        onComplete={() => goToStep('learning-3')}
      />
    )
  }

  if (step === 'learning-1') {
    return (
      <CastleLearningScreen
        stepId={1}
        onComplete={() => goToStep('learning-2')}
      />
    )
  }

  if (step === 'praise-calendar') {
    return (
      <PraiseCalendarScreen
        assignments={serverAssignments}
        passThreshold={praisePassThreshold}
        startYear={calendarStart.year}
        startMonthIndex={calendarStart.monthIndex}
      />
    )
  }

  if (step === 'assignment') {
    return (
      <AssignmentReceivedScreen
        assignments={isSyncEnabled() ? serverAssignments : undefined}
        className={activeClassName}
        star1Completed={round1MissionCompleted}
        star2Completed={star2LearningCompleted}
        retryingAssignmentId={retryingAssignmentId}
        retryingDemoIndex={retryingDemoIndex}
        onOpenAssignment={(assignment, options) => {
          if (options?.isRetry) {
            setRetryingAssignmentId(assignment.assignmentId)
          } else {
            // 다른 과제를 새로 시작할 때만 재도전 상태 해제
            setRetryingAssignmentId((prev) =>
              prev != null && prev !== assignment.assignmentId ? null : prev,
            )
          }
          setRetryingDemoIndex(null)
          setAssignmentOnlyQuestionIds(null)
          setActiveAssignment(assignment)
          goToStep('assignment-runner')
        }}
        onOpenCompletedCastle={openCompletedCastle}
        onOpenWordMatch={(options) => {
          if (!options?.isRetry) setRetryingAssignmentId(null)
          enterFullDemoSession({ markRetrying: Boolean(options?.isRetry) })
        }}
        onOpenCastleLearning={(options) => {
          if (!options?.isRetry) setRetryingAssignmentId(null)
          setRetryingDemoIndex(options?.isRetry ? 1 : null)
          goToStep('learning-1')
        }}
        onOpenPraiseCalendar={() => goToStep('praise-calendar')}
        settingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        onGoMain={goToStudentMain}
        onOpenSettings={() => setSettingsOpen(true)}
      />
    )
  }

  return (
    <div
      className="flex min-h-dvh w-full justify-center"
      style={{ background: MAIN_HOME_SKY }}
    >
      <div
        className="relative aspect-[393/852] w-full max-w-[540px] self-center overflow-hidden"
        style={{ background: MAIN_HOME_SKY }}
      >
        <MainHomeMapStartBackdrop />
        <img
          src={ASSETS.invite}
          alt=""
          aria-hidden
          draggable={false}
          className="pointer-events-none absolute inset-0 z-10 h-full w-full select-none"
        />
        <ClassRoundPillLabel
          surface="dimmed"
          classLabel={activeClassName}
          roundLabel="과제"
        />
        <PraiseCalendarButton
          surface="dimmed"
          style={figmaRectStyle(PRAISE_CALENDAR_FRAME_RECT)}
        />
        <input
          type="text"
          inputMode="text"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="characters"
          spellCheck={false}
          aria-label="초대코드"
          placeholder=""
          value={inviteCode}
          disabled={inviteLoading}
          onChange={(e) => {
            setInviteError(null)
            setInviteCode(sanitizeInviteCode(e.target.value))
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') tryEnter()
          }}
          className={`z-20 ${INVITE_INPUT}`}
        />
        {inviteError ? (
          <p className="absolute left-[16.79%] top-[52%] z-20 w-[66.67%] text-center text-sm font-bold text-[#C52B2B]">
            {inviteError}
          </p>
        ) : null}
        {inviteLoading ? (
          <p className="absolute left-[16.79%] top-[52%] z-20 w-[66.67%] text-center text-sm font-bold text-[#1274A9]">
            가입 중…
          </p>
        ) : null}
        <button
          type="button"
          aria-label="입장하기"
          disabled={inviteLoading}
          className={`z-20 ${INVITE_SUBMIT} cursor-pointer bg-transparent disabled:cursor-wait`}
          onClick={tryEnter}
        />
      </div>
    </div>
  )
}
