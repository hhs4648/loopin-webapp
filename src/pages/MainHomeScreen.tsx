import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FigmaAssetFrame } from '../components/FigmaAssetFrame'
import {
  PRAISE_CALENDAR_FRAME_RECT,
  PraiseCalendarButton,
} from '../components/main-home/PraiseCalendarButton'
import {
  figmaRectStyle,
  MAIN_HOME_SKY,
  type MainHomeNavTabId,
} from '../components/main-home/assignment-home'
import { AssignmentReceivedScreen } from '../components/main-home/AssignmentReceivedScreen'
import type { CompletedCastleTarget } from '../components/main-home/AssignmentReceivedScreen'
import { MainHomeMapStartBackdrop } from '../components/main-home/MainHomeMapStartBackdrop'
import { MainHomeBottomNav } from '../components/main-home/MainHomeBottomNav'
import {
  NavNoticeToast,
  VOCAB_COMING_SOON,
} from '../components/main-home/NavNoticeToast'
import { ReviewMainWindow } from '../components/review/ReviewMainWindow'
import { SettingsWindow } from '../components/settings/SettingsWindow'
import { WordMatchScreen } from '../components/word-match/WordMatchScreen'
import { WordListenMatchScreen } from '../components/word-listen-match/WordListenMatchScreen'
import { WordQuizScreen } from '../components/word-quiz/WordQuizScreen'
import { WordSpellScreen } from '../components/word-spell/WordSpellScreen'
import { LearningCompleteScreen } from '../components/learning-complete/LearningCompleteScreen'
import { formatStudyMinutes } from '../components/learning-complete/learning-complete'
import { BodyTextAScreen } from '../components/body-text-a/BodyTextAScreen'
import { BodyTextBScreen } from '../components/body-text-b/BodyTextBScreen'
import { BodyTextCScreen } from '../components/body-text-c/BodyTextCScreen'
import { BodyTextCompleteScreen } from '../components/body-text-complete/BodyTextCompleteScreen'
import { GrammarCompleteScreen } from '../components/grammar-complete/GrammarCompleteScreen'
import { GymCompleteScreen } from '../components/gym/GymCompleteScreen'
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
import { StreakCalendarScreen } from '../components/streak-calendar/StreakCalendarScreen'
import { NEXT_BTN } from '../components/onboarding/onboarding-ui'
import { SESSION_SECTION_OFFSETS, resolveDemoSessionStartStep } from '../components/exercise/session-questions'
import {
  buildRetrySectionSnapshot,
  countWordPartUniqueWords,
  getFirstRetrySection,
  getNextRetrySectionAfter,
  getWrongGrammarType2Questions,
  isFinalRetrySection as checkIsFinalRetrySection,
  listLearnedWordPartWords,
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
import type { PartCompleteKind } from '../components/part-complete/part-complete'
import { buildAssignmentSections } from '../features/assignments/build-session-sections'
import { resolvePresentQuestionIds } from '../features/assignments/filter-assignment-questions'
import { isWrongReissue } from '../features/assignments/wrong-reissue'
import {
  isReviewAssignmentId,
  type ReviewSession,
} from '../features/review/build-review-session'
import { persistReviewSessionOutcome } from '../features/review/persist-review-outcome'
import { StreakCelebrationScreen } from '../components/streak-celebration/StreakCelebrationScreen'
import {
  resolveStreakCelebration,
  type StreakCelebration,
} from '../components/streak-celebration/streak-celebration'
import {
  enrollWithInviteCode,
  fetchMyEnrollments,
  fetchPraisePassThreshold,
  fetchStudentAssignments,
  fetchWrongQuestionIds,
  resolveActiveClassId,
  subscribeStudentClassRealtime,
} from '../lib/sync/student-api'
import { isSyncEnabled } from '../lib/sync/supabase-client'
import type { StudentAssignment } from '../lib/sync/types'
import {
  clearCastleRetrySession,
  loadCastleRetrySession,
  saveCastleRetrySession,
} from '../lib/castle-retry-session'
import { DEFAULT_PASS_SCORE_THRESHOLD, resolveCalendarStartMonth } from '../components/praise-calendar/praise-calendar'
import { SplashBrandFrame } from '../components/SplashBrandFrame'

const ASSETS = {
  /** 초대 UI 오버레이(딤·입력·CTA) — 맵 배경은 `MainHomeMapStartBackdrop` */
  invite: '/assets/main-home-invite-ui.svg?v=1',
  waiting: '/assets/main-home-invite-entered.svg?v=4',
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
  | 'streak-calendar'

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
  /*
    **이 신호는 한 번만 쓴다.**

    `navigate(..., { state })`로 넘어온 값은 브라우저 히스토리 항목에 그대로 저장돼서
    **새로고침해도 되살아난다.** 지우지 않으면 이미 반에 가입한 학생이 `/student/home`을
    새로고침할 때마다 이 플래그가 다시 참이 되어 등록 조회를 통째로 건너뛰고
    초대코드 화면부터 다시 뜬다 — 초대코드를 계속 입력하게 되는 증상의 직접 원인이다.
    (라우터의 in-memory 상태는 그대로 두므로 이번 진입에서는 의도대로 초대코드부터 뜬다.)
  */
  useEffect(() => {
    if (!forceInviteStepRef.current) return
    const historyState = window.history.state as Record<string, unknown> | null
    window.history.replaceState({ ...(historyState ?? {}), usr: null }, '')
  }, [])
  const [step, setStep] = useState<MainStep>('invite')
  const [inviteCode, setInviteCode] = useState('')
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [serverAssignments, setServerAssignments] = useState<StudentAssignment[]>(
    [],
  )
  const [praisePassThreshold, setPraisePassThreshold] = useState(
    DEFAULT_PASS_SCORE_THRESHOLD,
  )
  /** 반 가입일들 — 칭찬 캘린더 시작 달 계산용 */
  const [enrolledAtList, setEnrolledAtList] = useState<string[]>([])
  const [activeAssignment, setActiveAssignment] =
    useState<StudentAssignment | null>(null)
  /**
   * **채점된 회차**의 오답 개수 — 종합 완료 화면의 점수·정답 수 표시용.
   *
   * `assignmentWrongQuestionIds`와 갈라 둔다. 그건 「틀린문제만」이 **다음에 낼 문항**
   * 이라 연습을 하면 줄어드는데, 예전에는 화면 점수도 그 값으로 다시 계산해서
   * **연습할 때마다 종합 점수가 바뀌었다.** 연습은 기록이 아니므로 점수는 그대로여야 한다.
   */
  const [gradedWrongCount, setGradedWrongCount] = useState<number | null>(null)
  /** 서버 과제 오답 question_id — 「틀린문제만」활성화·필터용 */
  const [assignmentWrongQuestionIds, setAssignmentWrongQuestionIds] = useState<
    string[]
  >([])
  /** 과제 러너에 넘길 오답만 필터 (null = 전체) */
  const [assignmentOnlyQuestionIds, setAssignmentOnlyQuestionIds] = useState<
    string[] | null
  >(() => loadCastleRetrySession()?.onlyQuestionIds ?? null)
  const [skipQuizInitialSpeak, setSkipQuizInitialSpeak] = useState(false)
  const [sessionResults, setSessionResults] = useState<SessionResults>({})
  const [retryWrongOnly, setRetryWrongOnly] = useState(false)
  const [retrySnapshot, setRetrySnapshot] = useState<RetrySectionSnapshot | null>(null)
  const [isFinalRetrySection, setIsFinalRetrySection] = useState(false)
  /** 재도전/오답만 진입 시 학습 화면 강제 리마운트 */
  const [sessionEpoch, setSessionEpoch] = useState(0)
  const [round1MissionCompleted, setRound1MissionCompleted] = useState(
    () => loadCastleRetrySession()?.round1MissionCompleted === true,
  )
  const [star2LearningCompleted, setStar2LearningCompleted] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [reviewOpen, setReviewOpen] = useState(false)
  /** 아직 화면이 없는 탭을 눌렀을 때의 안내 (초대코드 화면용) */
  const [navNotice, setNavNotice] = useState<string | null>(null)
  /** 하단 내비 「헬스장」 — 복습하기와 같은 풀스크린 오버레이 */
  const [gymOpen, setGymOpen] = useState(false)
  /** 완료 성 재도전 중 — 맵 「현재 위치」는 유지하고 해당 성에만 표시 */
  const [retryingAssignmentId, setRetryingAssignmentId] = useState<string | null>(
    () => loadCastleRetrySession()?.retryingAssignmentId ?? null,
  )
  /**
   * **이번 한 번만** 새 attempt로 열 과제.
   *
   * 예전엔 `retryingAssignmentId`로 이걸 겸했는데, 그건 맵의 「재도전 중!」 표시용이라
   * 완료할 때까지 남는다. 그래서 재도전이나 틀린문제만을 한 번 누르고 중간에 나가면,
   * 그 과제는 **세션 내내** 들어갈 때마다 새 attempt가 열렸다. 새 attempt에는 답안이
   * 없으니 이어풀기 필터가 아무것도 못 걸러서, 단어 파트를 다 끝내고 나왔는데도
   * 다시 들어가면 **단어 문제부터** 다시 나왔다.
   *
   * 「재도전을 시작한다」와 「재도전 중이다」는 다른 얘기라 갈랐다. 이 값은
   * sessionStorage에 남기지 않는다 — 새로고침은 이어풀기지 재시작이 아니다.
   */
  const [forceNewAssignmentId, setForceNewAssignmentId] = useState<
    string | null
  >(null)
  /**
   * **틀린문제만 푸는 중인 과제.**
   *
   * 예전엔 `retryingAssignmentId`를 같이 썼다. 그래서 (1) 성 위에 「재도전 중!」이라고
   * 잘못 떴고, (2) 그 성을 다시 누르면 재도전 분기로 들어가 **오답 필터 없이 전체
   * 과제**가 열렸다 — 풀다 나오면 전부 다시 풀어야 했던 원인이다.
   */
  const [wrongOnlyAssignmentId, setWrongOnlyAssignmentId] = useState<
    string | null
  >(null)
  const [retryingDemoIndex, setRetryingDemoIndex] = useState<0 | 1 | null>(
    () => loadCastleRetrySession()?.retryingDemoIndex ?? null,
  )
  /** 재도전 sessionStorage 복원이 끝나기 전엔 덮어쓰지 않음 */
  const [retrySessionReady, setRetrySessionReady] = useState(
    () => !isSyncEnabled(),
  )
  /**
   * **가입 여부를 확인하는 동안은 아무 화면도 확정하지 않는다.**
   *
   * `step`의 초기값이 `'invite'`라서, 예전에는 이미 반에 가입한 학생도 열 때마다
   * 초대코드 입력칸을 한 번 봤다가 서버 조회가 끝나면 맵으로 튕겨 갔다. 코드를 다시
   * 넣어야 하는 줄 알게 만드는 화면이라, **모르는 동안에는 묻지 않는다** —
   * 앱의 다른 로딩 구간과 같은 브랜드 화면을 보여 주고, 답이 온 뒤에 화면을 정한다.
   *
   * 동기화가 없거나(`isSyncEnabled()` false) 온보딩 직후처럼 초대코드부터 보여야 하는
   * 경우에는 기다릴 것이 없으므로 처음부터 false다.
   */
  const [bootstrapping, setBootstrapping] = useState(
    () => isSyncEnabled() && !forceInviteStepRef.current,
  )
  /** 서버 과제 목록을 한 번이라도 받은 뒤 — 삭제된 재도전/풀이 상태 정리용 */
  const [assignmentsHydrated, setAssignmentsHydrated] = useState(
    () => !isSyncEnabled(),
  )
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
  /** 단어 파트(A~D) 시작 시각 — 공부 시간(분) 계산 */
  const wordSectionStartedAtRef = useRef<number | null>(null)

  stepRef.current = step
  retryWrongOnlyRef.current = retryWrongOnly
  retrySnapshotRef.current = retrySnapshot

  const markWordSectionStarted = () => {
    if (wordSectionStartedAtRef.current == null) {
      wordSectionStartedAtRef.current = Date.now()
    }
  }

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
    if (gymOpen) {
      setGymOpen(false)
      return
    }
    if (reviewOpen) {
      setReviewOpen(false)
      return
    }
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
    setReviewOpen(false)
    if (stepRef.current === 'assignment') return
    // 초대코드 전에는 맵으로 보내지 않음
    if (stepRef.current === 'invite') return
    navigationStackRef.current = []
    stepRef.current = 'assignment'
    setStep('assignment')
  }

  /** 초대코드 화면 하단 내비 — 홈은 초대에 머무름 */
  const handleInviteNavSelect = (id: MainHomeNavTabId) => {
    if (id === 'home') {
      setReviewOpen(false)
      setSettingsOpen(false)
      return
    }
    if (id === 'review') {
      setSettingsOpen(false)
      setReviewOpen(true)
      return
    }
    if (id === 'menu') {
      setReviewOpen(false)
      setSettingsOpen(true)
      return
    }
    if (id === 'vocab') setNavNotice(VOCAB_COMING_SOON)
  }

  /** 과제/복습 러너 종료 — 맵으로 복귀, 복습이면 복습 탭 다시 연다 */
  const exitAssignmentRunner = () => {
    const running = activeAssignment
    const wasReview =
      running != null && isReviewAssignmentId(running.assignmentId)
    setActiveAssignment(null)
    setAssignmentOnlyQuestionIds(null)
    // 새 attempt는 이미 열렸다 — 다시 들어오면 재시작이 아니라 이어풀기다
    setForceNewAssignmentId(null)
    void refreshAssignments()
    goToStep('assignment', { replace: true })
    if (wasReview) setReviewOpen(true)
  }

  useBackNavigation(() => {
    if (gymOpen) {
      setGymOpen(false)
      return
    }
    if (reviewOpen) {
      setReviewOpen(false)
      return
    }
    if (settingsOpen) {
      setSettingsOpen(false)
      return
    }
    // 복습·과제 러너는 스택을 안 쌓는 경로가 있어 goBack만으로는 no-op이 된다
    if (stepRef.current === 'assignment-runner') {
      if (Date.now() < blockBackUntilRef.current) return
      exitAssignmentRunner()
      return
    }
    goBack()
  }, settingsOpen ||
      reviewOpen ||
      gymOpen ||
      step === 'assignment-runner' ||
      (step !== 'invite' && navigationStackRef.current.length > 0))
  useEffect(() => {
    if (
      step === 'word-match' ||
      step === 'word-listen-match' ||
      step === 'word-quiz' ||
      step === 'word-spell'
    ) {
      markWordSectionStarted()
    }
  }, [step])

  useEffect(() => {
    sessionResultsRef.current = sessionResults
  }, [sessionResults])

  // 재도전 중 상태를 새로고침 후에도 유지
  useEffect(() => {
    if (!retrySessionReady) return
    const isReviewPractice = isReviewAssignmentId(activeAssignment?.assignmentId)
    saveCastleRetrySession({
      retryingAssignmentId,
      retryingDemoIndex,
      // 복습 합성 과제는 새로고침 복원 대상이 아님
      activeAssignmentId: isReviewPractice
        ? null
        : (activeAssignment?.assignmentId ?? null),
      onlyQuestionIds: isReviewPractice ? null : assignmentOnlyQuestionIds,
      resumeRunner:
        step === 'assignment-runner' &&
        activeAssignment != null &&
        !isReviewPractice,
      round1MissionCompleted:
        retryingDemoIndex === 0 ? true : round1MissionCompleted,
    })
  }, [
    retrySessionReady,
    retryingAssignmentId,
    retryingDemoIndex,
    activeAssignment,
    assignmentOnlyQuestionIds,
    step,
    round1MissionCompleted,
  ])

  /**
   * 교사가 과제를 삭제하면 목록에서 빠지는데, 재도전/풀이 로컬 상태가
   * sessionStorage·state에 남아 「재도전 중」이 고이는 문제를 막는다.
   */
  useEffect(() => {
    if (!assignmentsHydrated || !isSyncEnabled()) return

    const ids = new Set(serverAssignments.map((a) => a.assignmentId))
    let leaveToMap = false

    if (retryingAssignmentId != null && !ids.has(retryingAssignmentId)) {
      setRetryingAssignmentId(null)
    }

    // 복습 합성 과제는 서버 목록에 없는 게 정상이라 이 검사에서 빼야 한다.
    // 안 그러면 「지금 시작하기」로 러너에 들어가는 즉시 「삭제된 과제」로 몰려 맵으로 튕긴다.
    if (
      activeAssignment != null &&
      !isReviewAssignmentId(activeAssignment.assignmentId) &&
      !ids.has(activeAssignment.assignmentId)
    ) {
      setActiveAssignment(null)
      setAssignmentOnlyQuestionIds(null)
      if (stepRef.current === 'assignment-runner') {
        leaveToMap = true
      }
    }

    if (
      completedCastleSource?.kind === 'assignment' &&
      !ids.has(completedCastleSource.assignment.assignmentId)
    ) {
      setCompletedCastleSource(null)
      if (stepRef.current === 'grammar-complete') {
        leaveToMap = true
      }
    }

    if (leaveToMap && stepRef.current !== 'assignment') {
      navigationStackRef.current = []
      stepRef.current = 'assignment'
      setStep('assignment')
    }
  }, [
    assignmentsHydrated,
    serverAssignments,
    retryingAssignmentId,
    activeAssignment,
    completedCastleSource,
  ])

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

  /**
   * 종합 완료 화면 「연속 정답」 배지에 쓸 최고 콤보.
   * 방금 푼 세션에서만 의미가 있으므로, 맵에서 완료된 성을 다시 열 때는 0으로 지운다
   * (지난 점수는 서버에서 오지만 콤보는 저장하지 않는다).
   */
  const [completeMaxCombo, setCompleteMaxCombo] = useState(0)

  /** 맵에서 파트를 골라 들어왔을 때 러너가 시작할 파트 */
  const [runnerStartPart, setRunnerStartPart] = useState<PartCompleteKind | null>(
    null,
  )

  /**
   * 연속 학습 축하 화면 — 과제를 끝내고 **스트릭을 늘린 그 한 번**만 뜬다.
   * 축하를 닫으면 원래 가려던 곳(종합 완료 화면)으로 이어 간다.
   */
  const [streakCelebration, setStreakCelebration] =
    useState<StreakCelebration | null>(null)
  const afterStreakCelebrationRef = useRef<(() => void) | null>(null)

  const openGrammarComplete = () => {
    const results = { ...sessionResultsRef.current }
    completeResultsRef.current = results
    const stats = summarizeSessionResults(results)
    setCompleteScoreStats(stats)
    // 데모 세션 화면들은 `ComboProvider` 밖에서 그려져 콤보를 세지 않는다
    setCompleteMaxCombo(0)
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
    options: {
      replace?: boolean
      maxCombo?: number
      /** 방금 푼 회차 오답 — fetch 전에 버튼이 바로 살아 있게 */
      seedWrongQuestionIds?: string[]
      /**
       * 연습(틀린문제만)으로 열렸을 때 `true`.
       * 「틀린문제만」이 낼 문항만 갱신하고 **점수는 건드리지 않는다.**
       */
      practiceResult?: boolean
      /**
       * 이번 세션에서 낸 문항 수. 헬스장 「틀린문제만」연습 완료 화면 요약용.
       * 성 맵 종합 점수는 `practiceResult`가 막으므로 여기로만 쓴다.
       */
      sessionQuestionCount?: number
    } = {},
  ) => {
    setCompletedCastleSource(target)
    setSettingsOpen(false)
    // 방금 푼 러너 peak와 서버 회차 peak 중 큰 값 — 둘 다 MAX COMBO(끝 콤보 아님).
    // 데모 성은 서버 기록이 없어 0(배지 숨김).
    const fromRunner = options.maxCombo
    const fromServer =
      target.kind === 'assignment'
        ? (target.assignment.latestMaxCombo ?? 0)
        : 0
    setCompleteMaxCombo(
      fromRunner != null ? Math.max(fromRunner, fromServer) : fromServer,
    )

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

      // 이전 과제·복습 연습 오답이 섞이지 않게 비운 뒤, 시드 → 서버 순으로 채운다
      const seeded = options.seedWrongQuestionIds ?? []
      setAssignmentWrongQuestionIds(seeded)
      if (options.practiceResult) {
        // 연습 결과 — 다음에 낼 문항만 바꾸고 점수·정답 수는 그대로 둔다.
        // 헬스장만 이번 연습 라운드 요약을 보여 준다(성 맵 점수는 건드리지 않음).
        if (isWrongReissue(target.assignment)) {
          const wrong = seeded.length
          const total = Math.max(options.sessionQuestionCount ?? 0, wrong)
          if (total > 0) {
            setCompleteScoreStats({
              correctCount: Math.max(0, total - wrong),
              wrongCount: wrong,
              totalCount: total,
              score: Math.round(((total - wrong) / total) * 100),
            })
          }
        }
        return
      }
      setGradedWrongCount(seeded.length > 0 ? seeded.length : null)
      if (seeded.length > 0 && totalCount > 0) {
        const nextCorrect = Math.max(0, totalCount - seeded.length)
        setCompleteScoreStats({
          correctCount: nextCorrect,
          wrongCount: seeded.length,
          totalCount,
          score: Math.round((nextCorrect / totalCount) * 100),
        })
      }

      /*
        **방금 푼 결과가 있으면 서버를 다시 보지 않는다.**
        「틀린문제만」은 연습이라 attempt를 열지 않으므로 `latestAttemptId`는 여전히
        *예전* 회차를 가리킨다. 그걸 조회하면 방금 맞힌 문항까지 오답으로 되돌아와,
        다시 「틀린문제만」을 눌렀을 때 원래 오답 전부가 또 나왔다.
        시드는 이번 회차의 결과이므로 서버 값보다 정확하다.
      */
      const attemptId = target.assignment.latestAttemptId
      if (attemptId && options.seedWrongQuestionIds === undefined) {
        void fetchWrongQuestionIds(attemptId).then((ids) => {
          setAssignmentWrongQuestionIds(ids)
          setGradedWrongCount(ids.length > 0 ? ids.length : null)
          if (totalCount <= 0) return
          if (ids.length === 0) {
            // 점수 추정값으로 되돌림 (오답 id가 없으면 틀린문제만 비활성)
            setCompleteScoreStats({
              correctCount,
              wrongCount,
              totalCount,
              score,
            })
            return
          }
          const nextWrong = ids.length
          const nextCorrect = Math.max(0, totalCount - nextWrong)
          setCompleteScoreStats({
            correctCount: nextCorrect,
            wrongCount: nextWrong,
            totalCount,
            score: Math.round((nextCorrect / totalCount) * 100),
          })
        })
      } else if (seeded.length === 0) {
        setAssignmentWrongQuestionIds([])
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
    // 틀린문제만 연습은 세션 정답률(완료 화면 점수)을 덮어쓰지 않음
    if (retryWrongOnlyRef.current) return
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
    setCompleteMaxCombo(0)
    wordSectionStartedAtRef.current = null
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
    wordSectionStartedAtRef.current = Date.now()
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
      // 틀린문제만 연습이 끝나면 파트 완료 없이 종합 완료 화면만
      setRetryWrongOnly(false)
      setRetrySnapshot(null)
      setIsFinalRetrySection(false)
      setRetryingDemoIndex((prev) => (prev === 0 ? null : prev))
      const frozen = completeResultsRef.current ?? results
      completeResultsRef.current = frozen
      setCompleteScoreStats(summarizeSessionResults(frozen))
      setCompleteMaxCombo(0)
      setCompletedCastleSource({ kind: 'demo', index: 0 })
      setSettingsOpen(false)
      seedBackToAssignment()
      stepRef.current = 'grammar-complete'
      setStep('grammar-complete')
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
      setForceNewAssignmentId(source.assignment.assignmentId)
      setWrongOnlyAssignmentId(null)
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
        setRunnerStartPart(null)
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

  /** 복습 탭 — 해당 분류 문항만 연습 모드로 출제 (과제 점수에 영향 없음) */
  const startReviewSession = (session: ReviewSession) => {
    if (session.questionIds.length === 0) return
    setReviewOpen(false)
    setSettingsOpen(false)
    setCompletedCastleSource(null)
    setRetryingAssignmentId(null)
    setRetryingDemoIndex(null)
    // 합성 스냅샷에 분류 문항만 들어 있음 — onlyQuestionIds로 재필터하면 0문항이 될 수 있어 비움
    setAssignmentOnlyQuestionIds(null)
    seedBackToAssignment()
    setActiveAssignment(session.assignment)
    setRunnerStartPart(null)
    blockBackUntilRef.current = Date.now() + 600
    stepRef.current = 'assignment-runner'
    setStep('assignment-runner')
  }

  /**
   * 오답 문항만 연습으로 연다. 완료 화면의 「틀린문제만」과, 맵에서 그 성을 다시
   * 누를 때(이어풀기) **같은 경로**를 쓴다 — 갈리면 한쪽이 전체 과제를 열게 된다.
   * 출제할 오답이 없으면 아무것도 하지 않고 `false`.
   */
  const startWrongOnlyPractice = (
    assignment: StudentAssignment,
    options?: { immediate?: boolean },
  ): boolean => {
    const sections = buildAssignmentSections(assignment.contentSnapshot)
    const wrongIds = resolvePresentQuestionIds(
      sections,
      assignmentWrongQuestionIds,
    )
    if (wrongIds.length <= 0) return false
    seedBackToAssignment()
    setRetryingAssignmentId(null)
    setForceNewAssignmentId(null)
    setRetryingDemoIndex(null)
    setAssignmentOnlyQuestionIds(wrongIds)
    setActiveAssignment(assignment)
    setSettingsOpen(false)
    setRunnerStartPart(null)
    blockBackUntilRef.current = Date.now() + 600
    if (options?.immediate) {
      // 헬스장 완료 — 맵 「틀린문제 푸는중!」배지·지연 없이 바로 오답만 연다
      setWrongOnlyAssignmentId(null)
      setCompletedCastleSource(null)
      setGymOpen(false)
      stepRef.current = 'assignment-runner'
      setStep('assignment-runner')
      return true
    }
    setWrongOnlyAssignmentId(assignment.assignmentId)
    // 맵에 「틀린문제 푸는중!」이 먼저 보이도록 한 뒤 풀이 진입
    stepRef.current = 'assignment'
    setStep('assignment')
    window.setTimeout(() => {
      if (stepRef.current !== 'assignment') return
      stepRef.current = 'assignment-runner'
      setStep('assignment-runner')
    }, 700)
    return true
  }

  const handleRetryWrongOnly = () => {
    if (completedCastleSource?.kind === 'demo' && completedCastleSource.index === 1) {
      return
    }

    // 서버 과제 — 오답 question_id만 다시 출제
    if (completedCastleSource?.kind === 'assignment') {
      const source = completedCastleSource
      if (startWrongOnlyPractice(source.assignment)) {
        setCompletedCastleSource(null)
      }
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

  /** 헬스장 완료 CTA·내비 — 맵으로 나간 뒤 해당 탭을 연다 */
  const leaveGymComplete = (next: MainHomeNavTabId | 'done' = 'done') => {
    handleGoHome()
    if (next === 'done' || next === 'gym') {
      setReviewOpen(false)
      setSettingsOpen(false)
      setGymOpen(true)
      return
    }
    setGymOpen(false)
    if (next === 'home') return
    if (next === 'review') {
      setSettingsOpen(false)
      setReviewOpen(true)
      return
    }
    if (next === 'menu') {
      setReviewOpen(false)
      setSettingsOpen(true)
    }
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
      setAssignmentsHydrated(true)
      return
    }
    const [list, threshold, enrollments] = await Promise.all([
      fetchStudentAssignments(classId),
      fetchPraisePassThreshold(classId),
      fetchMyEnrollments(),
    ])
    setServerAssignments(list)
    setAssignmentsHydrated(true)
    setPraisePassThreshold(threshold)
    setEnrolledAtList(enrollments.map((e) => e.enrolledAt).filter(Boolean))
  }

  /** 첫 조회가 끝났다 — 화면을 확정하고 재도전 세션 저장도 연다 */
  const finishBootstrap = () => {
    setRetrySessionReady(true)
    setBootstrapping(false)
  }

  useEffect(() => {
    if (!isSyncEnabled()) {
      finishBootstrap()
      return
    }
    if (forceInviteStepRef.current) {
      finishBootstrap()
      return
    }
    let cancelled = false
    /*
      **응답이 안 와도 화면은 준다.** 이 조회가 끝나야 화면이 정해지므로, 요청이
      매달려 있으면 브랜드 화면에 갇힌다. 그 경우 초대코드 화면이라도 보여 주는 게
      아무것도 없는 것보다 낫다. (정상 경로에서는 훨씬 먼저 finishBootstrap이 돈다)
    */
    const watchdog = window.setTimeout(finishBootstrap, 8000)
    void (async () => {
      const classId = await resolveActiveClassId()
      if (cancelled) return
      if (!classId) {
        finishBootstrap()
        return
      }
      const [list, threshold, enrollments] = await Promise.all([
        fetchStudentAssignments(classId),
        fetchPraisePassThreshold(classId),
        fetchMyEnrollments(),
      ])
      if (cancelled) return
      setServerAssignments(list)
      setAssignmentsHydrated(true)
      setPraisePassThreshold(threshold)
      setEnrolledAtList(enrollments.map((e) => e.enrolledAt).filter(Boolean))

      const saved = loadCastleRetrySession()
      const listIds = new Set(list.map((a) => a.assignmentId))

      // 삭제된 과제에 묶인 재도전/이어풀기 세션은 복원하지 않음
      if (
        saved?.retryingAssignmentId &&
        !listIds.has(saved.retryingAssignmentId)
      ) {
        setRetryingAssignmentId(null)
      }
      if (
        saved?.activeAssignmentId &&
        !listIds.has(saved.activeAssignmentId)
      ) {
        clearCastleRetrySession()
        setActiveAssignment(null)
        setAssignmentOnlyQuestionIds(null)
        setRetryingAssignmentId(null)
      }

      if (saved?.resumeRunner && saved.activeAssignmentId) {
        const target = list.find(
          (a) => a.assignmentId === saved.activeAssignmentId,
        )
        if (target) {
          setActiveAssignment(target)
          setAssignmentOnlyQuestionIds(saved.onlyQuestionIds)
          if (
            saved.retryingAssignmentId &&
            listIds.has(saved.retryingAssignmentId)
          ) {
            setRetryingAssignmentId(saved.retryingAssignmentId)
          }
          seedBackToAssignment()
          setRunnerStartPart(null)
          stepRef.current = 'assignment-runner'
          setStep('assignment-runner')
          finishBootstrap()
          return
        }
        clearCastleRetrySession()
        setRetryingAssignmentId(null)
        setActiveAssignment(null)
        setAssignmentOnlyQuestionIds(null)
      }

      setStep((current) => (current === 'invite' ? 'assignment' : current))
      finishBootstrap()
    })().catch((error) => {
      // 조회가 던지고 끝나면 화면이 영영 안 정해진다 — 던져도 화면은 준다
      console.warn('[sync] 첫 조회 실패', error)
      finishBootstrap()
    })
    return () => {
      cancelled = true
      window.clearTimeout(watchdog)
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
      setAssignmentsHydrated(true)
      setPraisePassThreshold(threshold)
    })()
    return () => {
      cancelled = true
    }
  }, [step])

  // 맵에 머무는 동안 교사 부여 반영 (Realtime + focus/visibility 폴백)
  // 풀이 중(assignment-runner 등)에는 목록을 건드리지 않아 화면 리셋 방지
  useEffect(() => {
    if (!isSyncEnabled()) return
    let cancelled = false
    let unsub: (() => void) | undefined

    /*
      **포커스가 돌아올 때마다 다 받지는 않는다.**

      과제 목록은 `content_snapshot`(그 과제의 단어·문장·문법 원문, 건당 10KB 안팎)을
      통째로 물고 온다. 학생이 앱을 잠깐 나갔다 오기만 해도 전부 다시 받는데, 30명이
      수업 한 시간 동안 앱을 들락거리면 이것만으로 수백 MB가 나간다
      (Supabase 무료 티어 egress는 월 5GB다).

      **Realtime은 throttle하지 않는다** — 그건 「실제로 뭔가 바뀌었다」는 신호라
      드물게 오고, 교사가 방금 낸 과제가 늦게 뜨면 그게 더 큰 문제다.
      focus/visibility는 「혹시 놓쳤을까 봐」 하는 폴백이라 간격을 둔다.
    */
    const PULL_MIN_INTERVAL_MS = 60_000
    let lastPullAt = Date.now()

    const pull = (options?: { force?: boolean }) => {
      if (stepRef.current !== 'assignment') return
      if (!options?.force && Date.now() - lastPullAt < PULL_MIN_INTERVAL_MS) {
        return
      }
      lastPullAt = Date.now()
      void refreshAssignments()
    }

    void (async () => {
      const classId = await resolveActiveClassId()
      if (cancelled || !classId) return
      unsub = subscribeStudentClassRealtime(classId, () => pull({ force: true }))
    })()

    const onFocus = () => pull()
    const onVisible = () => {
      if (document.visibilityState === 'visible') pull()
    }
    // 이벤트 핸들러는 등록·해제에 **같은 참조**를 써야 한다.
    // (pageshow는 이벤트 객체를 넘기므로 그대로 pull에 물리면 options로 새어 들어간다)
    const onPageShow = () => pull()
    document.addEventListener('visibilitychange', onVisible)
    window.addEventListener('focus', onFocus)
    window.addEventListener('pageshow', onPageShow)

    return () => {
      cancelled = true
      unsub?.()
      document.removeEventListener('visibilitychange', onVisible)
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('pageshow', onPageShow)
    }
  }, [])

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

  /*
    **가입 여부를 모르는 동안에는 초대코드를 묻지 않는다.**
    `step` 초기값이 'invite'라서, 이 게이트가 없으면 이미 가입한 학생도 열 때마다
    입력칸을 봤다가 맵으로 튕겨 간다. 라우트 전환 때와 같은 화면이라 이어져 보인다.
  */
  if (bootstrapping) {
    return <SplashBrandFrame />
  }

  /*
    연속 학습 축하 — step보다 **먼저** 가로챈다. 과제 완료 직후 종합 완료 화면으로 가는
    길목에 한 장 끼우는 것이라, step은 이미 완료 화면을 가리키고 있어도 된다.
  */
  if (streakCelebration) {
    return (
      <StreakCelebrationScreen
        celebration={streakCelebration}
        onDone={() => {
          setStreakCelebration(null)
          const next = afterStreakCelebrationRef.current
          afterStreakCelebrationRef.current = null
          next?.()
        }}
      />
    )
  }

  if (step === 'waiting') {
    return (
      <FigmaAssetFrame
        src={ASSETS.waiting}
        alt="초대코드 입력 후 메인 화면"
        bgClassName="bg-[#E2F7FF]"
        backButton="labeled"
      >
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
        startPart={runnerStartPart}
        // 재도전은 새 attempt — 이전 풀이 진행률(100%)을 이어받으면 바가 고정된다.
        // 「재도전 중」 표시(retryingAssignmentId)가 아니라 일회성 플래그를 본다.
        forceNewAttempt={forceNewAssignmentId === running.assignmentId}
        /*
          헬스장(오답 재출제)은 **파트 완료를 건너뛰고 종합 완료만** 띄운다.
          틀린 것만 모아 놓은 묶음이라 중간 완료 화면이 어울리지 않는다.
          연습 모드와 달리 **점수는 기록한다** — 선생님이 재출제 결과를 봐야 한다.
        */
        skipPartComplete={isWrongReissue(running)}
        // 틀린문제만·복습은 반드시 연습 모드 — 안 그러면 파트 완료가 뜨고 attempt가 열려 「진행중」이 된다
        practiceOnly={
          isReviewAssignmentId(running.assignmentId) ||
          Boolean(onlyIds?.length)
        }
        onExit={() => {
          exitAssignmentRunner()
        }}
        onCompleted={(info) => {
          const practiceOnly = Boolean(info?.practiceOnly)
          const wasReview = isReviewAssignmentId(running.assignmentId)
          setRetryingAssignmentId(null)
          setForceNewAssignmentId(null)
          setWrongOnlyAssignmentId(null)
          setRetryingDemoIndex(null)
          clearCastleRetrySession()
          // 연습에서 다시 틀린 것만 로컬에 남김(서버 점수는 그대로)
          // 복습 연습 오답은 과제 오답 목록을 덮지 않는다 — 덮으면 틀린문제만이 0문항이 된다
          if (practiceOnly) {
            if (!wasReview) {
              // 틀린문제만 — 파트 완료 skip, 종합 완료만. 로컬 상태는 완료 유지
              const finishedWrongIds = info?.wrongQuestionIds ?? []
              const completedAssignment: StudentAssignment = {
                ...running,
                status: 'completed',
              }
              setServerAssignments((prev) =>
                prev.map((a) =>
                  a.assignmentId === running.assignmentId
                    ? { ...a, status: 'completed' }
                    : a,
                ),
              )
              setActiveAssignment(null)
              setAssignmentOnlyQuestionIds(null)
              openCompletedCastle(
                { kind: 'assignment', assignment: completedAssignment },
                {
                  replace: true,
                  maxCombo: info?.maxCombo ?? 0,
                  seedWrongQuestionIds: finishedWrongIds,
                  practiceResult: true,
                  sessionQuestionCount: info?.answeredQuestionIds?.length,
                },
              )
              return
            }
            // 복습 결과 저장 후 탭을 연다 — 저장 전에 열면 오답률이 옛값으로 보인다
            const wrongIds = info?.wrongQuestionIds ?? []
            const answeredIds = info?.answeredQuestionIds ?? []
            void (async () => {
              const classId = await resolveActiveClassId()
              if (classId) {
                persistReviewSessionOutcome(
                  classId,
                  running.assignmentId,
                  answeredIds,
                  wrongIds,
                )
              }
              exitAssignmentRunner()
            })()
            return
          }
          setActiveAssignment(null)
          setAssignmentOnlyQuestionIds(null)
          const finishedWrongIds = info?.wrongQuestionIds ?? []
          setAssignmentWrongQuestionIds(finishedWrongIds)
          void (async () => {
            let next: StudentAssignment = {
              ...running,
              status: 'completed',
            }
            if (isSyncEnabled()) {
              try {
                const list = await fetchStudentAssignments(running.classId)
                setServerAssignments(list)
                setAssignmentsHydrated(true)
                const updated = list.find(
                  (a) => a.assignmentId === running.assignmentId,
                )
                if (updated) next = updated
              } catch {
                /* 목록 갱신 실패해도 완료 화면은 연다 */
              }
            }
            const openComplete = () =>
              openCompletedCastle(
                { kind: 'assignment', assignment: next },
                {
                  replace: true,
                  maxCombo: info?.maxCombo ?? 0,
                  seedWrongQuestionIds: finishedWrongIds,
                },
              )

            // 축하는 완료 화면 **앞**에 끼운다 — 점수를 보고 나면 이미 끝난 기분이라 늦다.
            // 조회가 실패하거나 오늘 이미 축하했으면 null이고 그냥 완료 화면으로 간다.
            const celebration = await resolveStreakCelebration()
            if (celebration) {
              afterStreakCelebrationRef.current = openComplete
              setStreakCelebration(celebration)
              return
            }
            openComplete()
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
    const isGymComplete =
      completedCastleSource?.kind === 'assignment' &&
      isWrongReissue(completedCastleSource.assignment)
    const allowWrongOnly = isDemoLearningCastle
      ? false
      : isAssignmentCastle
        ? assignmentWrongQuestionIds.length > 0
        : true
    /*
      표시는 **채점된 회차** 기준이다. 「틀린문제만」으로 연습해도 이 값은 안 바뀐다 —
      연습은 기록이 아니다. (`assignmentWrongQuestionIds`는 다음에 낼 문항일 뿐이다.)
    */
    const displayWrongCount =
      isAssignmentCastle && gradedWrongCount != null
        ? gradedWrongCount
        : stats.wrongCount
    const displayCorrectCount =
      isAssignmentCastle && gradedWrongCount != null && stats.totalCount > 0
        ? Math.max(0, stats.totalCount - gradedWrongCount)
        : stats.correctCount

    if (isGymComplete) {
      const gymWrongCount = assignmentWrongQuestionIds.length
      const gymTotalCount = stats.totalCount
      const gymCorrectCount = Math.max(0, gymTotalCount - gymWrongCount)
      return (
        <GymCompleteScreen
          perfect={gymWrongCount === 0}
          snapshot={completedCastleSource.assignment.contentSnapshot}
          correctCount={gymCorrectCount}
          totalCount={gymTotalCount}
          wrongCount={gymWrongCount}
          onRetryWrongOnly={
            gymWrongCount > 0
              ? () => {
                  startWrongOnlyPractice(completedCastleSource.assignment, {
                    immediate: true,
                  })
                }
              : undefined
          }
          onHome={() => leaveGymComplete('home')}
          onDone={() => leaveGymComplete('done')}
          onSelectNav={(id) => leaveGymComplete(id)}
        />
      )
    }

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
        maxCombo={completeMaxCombo}
        roundNumber={1}
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
    const learnedWords = listLearnedWordPartWords(sessionResults)
    const wordCount = countWordPartUniqueWords(sessionResults)
    const studyMinutes = formatStudyMinutes(wordSectionStartedAtRef.current)
    return (
      <LearningCompleteScreen
        wordCount={wordCount}
        studyMinutes={studyMinutes}
        words={learnedWords}
        onContinue={() => {
          if (retryWrongOnly) {
            advanceAfterRetrySection('word-spell')
            return
          }
          goToStep('body-text-a')
        }}
        onHome={() => handleGoHome()}
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

  if (step === 'streak-calendar') {
    return (
      <StreakCalendarScreen
        onSelectNav={(id) => {
          /*
            여기는 맵 위에 얹힌 창이 아니라 별도 step이다. 복습·전체는 맵에서 열리는
            창이므로 **맵으로 돌아간 뒤** 그 창을 연다 — 안 그러면 캘린더 위에 겹친다.
          */
          goBack()
          handleInviteNavSelect(id)
        }}
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
        star1Completed={round1MissionCompleted}
        star2Completed={star2LearningCompleted}
        retryingAssignmentId={retryingAssignmentId}
        retryingDemoIndex={retryingDemoIndex}
        wrongOnlyAssignmentId={wrongOnlyAssignmentId}
        onOpenAssignment={(assignment, options) => {
          // 틀린문제만 이어풀기 — 오답 필터를 유지한 채 다시 연다
          if (options?.isWrongOnly) {
            if (!startWrongOnlyPractice(assignment)) {
              setWrongOnlyAssignmentId(null)
            }
            return
          }
          setWrongOnlyAssignmentId(null)
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
          // 맵의 「파트별 입장하기」 — 러너가 이 파트부터 시작한다
          setRunnerStartPart(options?.part ?? null)
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
        onOpenStreakCalendar={() => goToStep('streak-calendar')}
        settingsOpen={settingsOpen}
        onCloseSettings={() => setSettingsOpen(false)}
        gymOpen={gymOpen}
        onCloseGym={() => setGymOpen(false)}
        onOpenGym={() => {
          setSettingsOpen(false)
          setReviewOpen(false)
          setGymOpen(true)
        }}
        reviewOpen={reviewOpen}
        onCloseReview={() => setReviewOpen(false)}
        onOpenReview={() => {
          setSettingsOpen(false)
          setReviewOpen(true)
        }}
        onGoMain={goToStudentMain}
        onOpenSettings={() => {
          setReviewOpen(false)
          setSettingsOpen(true)
        }}
        onStartReview={startReviewSession}
      />
    )
  }

  return (
    <div
      className="flex min-h-full w-full justify-center"
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

        {!settingsOpen && !reviewOpen && !gymOpen ? (
          <MainHomeBottomNav activeId="home" onSelect={handleInviteNavSelect} />
        ) : null}
        <NavNoticeToast
          message={navNotice}
          onHide={() => setNavNotice(null)}
        />

        {reviewOpen ? (
          <ReviewMainWindow
            onSelectNav={(id) => handleInviteNavSelect(id)}
            onStartReview={startReviewSession}
          />
        ) : null}

        {settingsOpen ? (
          <SettingsWindow
            onClose={() => setSettingsOpen(false)}
            onSelectNav={(id) => handleInviteNavSelect(id)}
          />
        ) : null}
      </div>
    </div>
  )
}
