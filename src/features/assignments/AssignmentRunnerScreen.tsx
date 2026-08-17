import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { BodyTextAScreen } from '../../components/body-text-a/BodyTextAScreen'
import { BodyTextBScreen } from '../../components/body-text-b/BodyTextBScreen'
import { BodyTextCScreen } from '../../components/body-text-c/BodyTextCScreen'
import { GrammarType1Screen } from '../../components/grammar-type-1/GrammarType1Screen'
import { GrammarType2Screen } from '../../components/grammar-type-2/GrammarType2Screen'
import { WordMatchScreen } from '../../components/word-match/WordMatchScreen'
import { WordListenMatchScreen } from '../../components/word-listen-match/WordListenMatchScreen'
import { WordQuizScreen } from '../../components/word-quiz/WordQuizScreen'
import { WordSpellScreen } from '../../components/word-spell/WordSpellScreen'
import { LearningCompleteScreen } from '../../components/learning-complete/LearningCompleteScreen'
import { formatStudyMinutes } from '../../components/learning-complete/learning-complete'
import { PartCompleteScreen } from '../../components/part-complete/PartCompleteScreen'
import {
  resolvePartCompleteBadgeLabel,
  type PartCompleteKind,
} from '../../components/part-complete/part-complete'
import type { LearnedWordPartItem } from '../../components/exercise/session-results'
import { playComboSfx } from '../../components/exercise/answer-sfx'
import {
  isComboMilestone,
  COMBO_BURST_MS,
  maxComboFromAnswerResults,
} from '../../components/exercise/combo'
import {
  ComboProvider,
  type ComboState,
} from '../../components/exercise/ComboContext'
import { stopEnglishWordAudio } from '../../components/word-quiz/word-quiz'
import {
  clearPracticeProgress,
  loadPracticeProgress,
  practiceProgressKey,
  savePracticeProgress,
} from '../../lib/practice-progress'
import {
  completeAttempt,
  fetchAnsweredQuestionIds,
  fetchTrailingCorrectStreak,
  fetchWrongQuestionIds,
  recordAnswer,
  startOrResumeAttempt,
  touchAttemptMaxCombo,
} from '../../lib/sync/student-api'
import type { AttemptProgress, StudentAssignment } from '../../lib/sync/types'
import {
  buildAssignmentSections,
  countSectionQuestions,
  listSectionQuestionIds,
  type AssignmentSection,
} from './build-session-sections'
import { filterAssignmentSectionsByQuestionIds } from './filter-assignment-questions'
import { expandGrammarType2Steps } from '../../components/grammar-type-2/grammar-type-2'
import { partOfSection } from './assignment-parts'

export type AssignmentRunnerCompleteInfo = {
  wrongQuestionIds: string[]
  /** true면 틀린문제만 연습 — 점수·attempt에 반영하지 않음 */
  practiceOnly?: boolean
  /** 이번 풀이의 최고 연속 정답 — 종합 완료 화면 「연속 정답」 배지용 */
  maxCombo?: number
  /**
   * 이번 세션에서 출제된 문항 id.
   * 복습 오답률 갱신 시 「틀린 것 / 맞힌 것」을 가르는 데 쓴다.
   */
  answeredQuestionIds?: string[]
}

type AssignmentRunnerScreenProps = {
  assignment: StudentAssignment
  /** 있으면 해당 question_id만 출제 (틀린문제만) */
  onlyQuestionIds?: string[] | null
  /**
   * 있으면 이 파트의 첫 섹션부터 시작한다 (맵의 「파트별 입장하기」).
   * 없으면 예전처럼 처음부터 — 이어풀기 필터를 거친 뒤의 첫 섹션이다.
   */
  startPart?: PartCompleteKind | null
  /**
   * true면 서버 attempt/점수를 건드리지 않는 연습.
   * 복습 탭은 합성 스냅샷에 분류 문항만 담으므로 onlyQuestionIds 없이 이 플래그만 켠다.
   */
  practiceOnly?: boolean
  /**
   * true면 **파트 완료 화면을 건너뛰고** 종합 완료만 띄운다.
   *
   * 헬스장(오답 재출제)이 이걸 쓴다. 틀린 것만 모아 놓은 묶음이라 「단어 파트 완료」
   * 같은 중간 화면이 어울리지 않는다(사용자 결정 2026-08-12).
   * `practiceOnly`와 다르다 — 이건 **점수는 그대로 기록**한다. 재출제 결과를
   * 선생님이 봐야 하기 때문이다.
   */
  skipPartComplete?: boolean
  /**
   * true면 새 attempt를 연다 (재도전).
   * 안 열면 이전 in_progress를 이어받아 진행률 바가 100%로 시작할 수 있다.
   */
  forceNewAttempt?: boolean
  onExit: () => void
  onCompleted: (info?: AssignmentRunnerCompleteInfo) => void
}

/**
 * 파트 완료 화면용 정답/문항 수.
 * 문장은 A·B·C 섹션을 합쳐 센다 — `onAnswer` 누적만 믿으면 유형·이어풀기에서
 * 문항 수가 줄어 보일 수 있다.
 */
function summarizePartCompletion(
  sections: AssignmentSection[],
  part: PartCompleteKind,
  wrongQuestionIds: readonly string[],
): { correct: number; total: number } {
  const partSections = sections.filter(
    (section) => partOfSection(section.kind) === part,
  )
  const total = countSectionQuestions(partSections)
  if (total <= 0) return { correct: 0, total: 0 }

  const partQuestionIds = new Set(listSectionQuestionIds(partSections))
  const wrongCount = wrongQuestionIds.reduce(
    (count, id) => count + (partQuestionIds.has(id) ? 1 : 0),
    0,
  )
  return { correct: Math.max(0, total - wrongCount), total }
}

/** `${word.id}:match` 같은 문항 id에서 원본 단어 id만 떼어낸다 */
function baseWordId(questionId: string): string {
  return questionId.replace(/:(?:match|listen|choice|spell)$/, '')
}

function filterSection(
  section: AssignmentSection,
  answeredIds: Set<string>,
): AssignmentSection | null {
  switch (section.kind) {
    case 'word-match': {
      const remaining = section.pairs.filter((pair) => !answeredIds.has(pair.id))
      if (!remaining.length) return null
      return { ...section, pairs: remaining }
    }
    case 'word-listen-match': {
      const remaining = section.pairs.filter((pair) => !answeredIds.has(pair.id))
      if (!remaining.length) return null
      return { ...section, pairs: remaining }
    }
    case 'word-quiz': {
      const questions = section.questions.filter((q) => !answeredIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'word-spell': {
      const questions = section.questions.filter((q) => !answeredIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-a': {
      const questions = section.questions.filter((q) => !answeredIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-b': {
      const questions = section.questions.filter((q) => !answeredIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-c': {
      const questions = section.questions.filter((q) => !answeredIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'grammar-type-1': {
      const questions = section.questions.filter((q) => !answeredIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'grammar-type-2': {
      // OX 답만 기록된 경우에도 :fix 교정 스텝이 남도록 펼친 뒤 필터
      const remaining = expandGrammarType2Steps(section.questions).filter(
        (question) => !answeredIds.has(question.id),
      )
      return remaining.length ? { ...section, questions: remaining } : null
    }
  }
}

export function AssignmentRunnerScreen({
  assignment,
  onlyQuestionIds = null,
  startPart = null,
  practiceOnly = false,
  skipPartComplete = false,
  forceNewAttempt = false,
  onExit,
  onCompleted,
}: AssignmentRunnerScreenProps) {
  const onlyIdsKey = onlyQuestionIds?.slice().sort().join('|') ?? ''
  const hasOnlyQuestionFilter = Boolean(onlyQuestionIds?.length)
  /** 연습 이어풀기 키 — 과제 + 출제 범위 */
  const practiceKey = practiceProgressKey(assignment.assignmentId, onlyIdsKey)
  /**
   * **복습 탭의 합성 과제**(`review:`)인가.
   *
   * 이 스냅샷에는 해당 분류 문항만 담겨 있어서, `onlyQuestionIds`로 한 번 더 거르면
   * 0문항이 될 수 있다 — 그래서 여기서만 필터를 건너뛴다.
   *
   * 예전엔 여기에 `practiceOnly ||`가 붙어 있었다. 그런데 그 prop은 **「틀린문제만」에도
   * 켜진다.** 그 바람에 틀린문제만이 필터를 통째로 건너뛰고 **전체 문항을 다시 냈다.**
   * 「연습이라 기록을 안 남긴다」와 「이미 걸러진 합성본이다」는 서로 다른 이야기라
   * 두 개로 갈랐다.
   */
  const isReviewSynthetic = assignment.assignmentId.startsWith('review:')
  /** 틀린문제만·복습 — attempt/점수 없음 · 파트 완료 화면 skip */
  const isPracticeOnly =
    practiceOnly || isReviewSynthetic || hasOnlyQuestionFilter
  const skipPartCompleteRef = useRef(isPracticeOnly || skipPartComplete)
  skipPartCompleteRef.current = isPracticeOnly || skipPartComplete
  const forceNewAttemptRef = useRef(forceNewAttempt)
  forceNewAttemptRef.current = forceNewAttempt

  const allSections = useMemo(() => {
    const snapshot = assignment.contentSnapshot
    const built = buildAssignmentSections({
      ...snapshot,
      problemTypes: {
        words: snapshot.problemTypes?.words ?? [],
        sentences: snapshot.problemTypes?.sentences ?? [],
        grammar: snapshot.problemTypes?.grammar ?? [],
      },
      words: snapshot.words ?? [],
      sentences: snapshot.sentences ?? [],
      grammar: snapshot.grammar ?? [],
    })
    // 복습 합성본은 이미 분류 문항만 담김 — onlyQuestionIds로 한 번 더 걸러 0문항이 되지 않게
    if (isReviewSynthetic) return built
    if (!onlyQuestionIds?.length) return built
    return filterAssignmentSectionsByQuestionIds(built, onlyQuestionIds)
  }, [
    assignment.contentSnapshot,
    onlyIdsKey,
    onlyQuestionIds,
    isReviewSynthetic,
  ])

  const questionTotal = useMemo(
    () => countSectionQuestions(allSections),
    [allSections],
  )

  const [attempt, setAttempt] = useState<AttemptProgress | null>(null)
  const attemptIdRef = useRef<string | null>(null)
  const [sections, setSections] = useState<AssignmentSection[]>([])
  const [sectionIndex, setSectionIndex] = useState(0)
  /** 파트 완료 화면 표시 중 — 계속하기를 누르면 nextIndex로 넘어간다 */
  const [partGate, setPartGate] = useState<{
    part: PartCompleteKind
    nextIndex: number
  } | null>(null)
  /** Answered count at load — progress bar offset must not double-count live answers. */
  const [baseAnsweredCount, setBaseAnsweredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wrongQuestionIdsRef = useRef<string[]>([])
  /** 연습 모드에서 이미 푼 문항 — 이어풀기용 로컬 기록 */
  const practiceAnsweredRef = useRef<string[]>([])
  const onCompletedRef = useRef(onCompleted)
  onCompletedRef.current = onCompleted
  const onExitRef = useRef(onExit)
  onExitRef.current = onExit

  useEffect(() => {
    attemptIdRef.current = attempt?.id ?? null
  }, [attempt])

  /**
   * 단어 A/B 짝맞추기 — 짝마다 콤보를 올리지 않고, 보드를 **전부 첫 시도에 맞추면**
   * 끝날 때 1콤보만 올린다. 오답이 하나라도 있으면 그 짝을 맞춘 시점에 콤보가 끊긴다.
   */
  const matchBoardHadWrongRef = useRef(false)

  /**
   * 연속 정답 콤보. 러너가 들고 있으므로 **파트(섹션)를 넘어가도 이어진다.**
   * 오답이 하나라도 나오면 0으로 끊긴다. 규칙은 `components/exercise/combo.ts`.
   */
  const [combo, setCombo] = useState(0)
  const comboRef = useRef(0)
  /**
   * 세션 최고 콤보(MAX COMBO) — 오답으로 끊겨도 남는다.
   * 종합 완료 화면 「연속 정답」 배지는 **끝에서 유지 중인 콤보가 아니라** 이 값을 쓴다.
   */
  const maxComboRef = useRef(0)
  /** handleCombo에 넘긴 정·오답 순서 — 완료 시 peak를 다시 계산하는 근거 */
  const answerResultsRef = useRef<boolean[]>([])
  const [comboBurst, setComboBurst] = useState<ComboState['burst']>(null)
  const comboBurstIdRef = useRef(0)
  const comboBurstTimerRef = useRef<number | null>(null)

  useEffect(
    () => () => {
      if (comboBurstTimerRef.current !== null) {
        window.clearTimeout(comboBurstTimerRef.current)
      }
    },
    [],
  )

  /** 현재 시퀀스 기준 최고 콤보 — ref와 로그 중 큰 쪽(이어풀기 시 서버 peak 포함) */
  const resolvePeakCombo = () =>
    Math.max(
      maxComboRef.current,
      maxComboFromAnswerResults(answerResultsRef.current),
    )

  /**
   * `setCombo`의 updater 안에서 소리·버스트를 건드리지 않는다 — StrictMode에서 updater가 두 번
   * 불려 이펙트가 겹친다. 다음 값을 ref로 먼저 확정하고 부수효과는 밖에서 낸다.
   */
  const handleCombo = (isCorrect: boolean) => {
    answerResultsRef.current.push(isCorrect)
    const next = isCorrect ? comboRef.current + 1 : 0
    comboRef.current = next
    // 끝 콤보(next)가 아니라 지금까지의 peak만 올린다
    const prevPeak = maxComboRef.current
    const peak = Math.max(prevPeak, next)
    maxComboRef.current = peak
    setCombo(next)

    // 이어풀기·재진입 대비 — peak가 오를 때만 서버에 남긴다
    if (peak > prevPeak && attemptIdRef.current) {
      void touchAttemptMaxCombo(attemptIdRef.current, peak)
    }

    if (!isCorrect || !isComboMilestone(next)) return

    comboBurstIdRef.current += 1
    setComboBurst({ combo: next, id: comboBurstIdRef.current })
    playComboSfx(next)

    if (comboBurstTimerRef.current !== null) {
      window.clearTimeout(comboBurstTimerRef.current)
    }
    comboBurstTimerRef.current = window.setTimeout(() => {
      setComboBurst(null)
      comboBurstTimerRef.current = null
    }, COMBO_BURST_MS)
  }
  /** 파트별 정답/전체 — 파트 완료 화면 점수용 */
  const partStatsRef = useRef<
    Partial<Record<PartCompleteKind, { correct: number; total: number }>>
  >({})
  /** 파트 시작 시각 — 단어 파트 「공부 시간」용 */
  const partStartedAtRef = useRef<Partial<Record<PartCompleteKind, number>>>({})

  /** 스냅샷 내용이 바뀌었을 때만 재로드 — 콜백 identity 변경으로 리셋되지 않게 */
  const snapshotKey = useMemo(
    () => JSON.stringify(assignment.contentSnapshot),
    [assignment.contentSnapshot],
  )

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      wrongQuestionIdsRef.current = []
      partStatsRef.current = {}
      partStartedAtRef.current = {}
      comboRef.current = 0
      maxComboRef.current = 0
      answerResultsRef.current = []
      setCombo(0)
      setComboBurst(null)
      setPartGate(null)

      // 연습(틀린문제만·복습) = 로컬만. attempt를 열거나 답안을 올리지 않음.
      if (isPracticeOnly) {
        setAttempt(null)

        /*
          **연습도 이어 푼다**(2026-08-11). attempt가 없어 서버에는 근거가 없으므로
          `sessionStorage`에 남겨 둔 진행을 쓴다. 이게 없던 동안은 나갔다 들어올 때마다
          처음부터 다시 풀렸고 콤보도 0으로 끊겼다.
        */
        const saved = loadPracticeProgress(practiceKey)
        const answeredIds = new Set(saved?.answeredIds ?? [])
        const remaining = answeredIds.size
          ? allSections
              .map((section) => filterSection(section, answeredIds))
              .filter((section): section is AssignmentSection => section != null)
          : allSections

        practiceAnsweredRef.current = [...answeredIds]
        wrongQuestionIdsRef.current = [...(saved?.wrongIds ?? [])]
        if (saved && saved.combo > 0) {
          comboRef.current = saved.combo
          setCombo(saved.combo)
        }
        if (saved && saved.maxCombo > maxComboRef.current) {
          maxComboRef.current = saved.maxCombo
        }

        setBaseAnsweredCount(answeredIds.size)
        setSections(remaining.length > 0 ? remaining : allSections)
        setSectionIndex(0)
        setLoading(false)
        if (allSections.length === 0 || questionTotal === 0) {
          // 복습은 완료로 맵에 던지지 말고 나가기 — 호출 측이 복습 탭을 다시 연다
          if (isReviewSynthetic) {
            setError('이 분류에서 출제할 문제를 만들지 못했어요.')
            return
          }
          setError('출제할 수 있는 문제가 없어요.')
        }
        return
      }

      const started = await startOrResumeAttempt({
        assignmentId: assignment.assignmentId,
        questionTotal,
        forceNew: forceNewAttemptRef.current,
      })
      if (cancelled) return
      if (!started) {
        setError('과제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
        setLoading(false)
        return
      }

      // 재도전(forceNew)은 처음부터 — 이전 답안·진행률을 이어받지 않는다
      if (forceNewAttemptRef.current) {
        wrongQuestionIdsRef.current = []
        setAttempt(started)
        setBaseAnsweredCount(0)
        setSections(allSections)
        const startIndex = startPart
          ? allSections.findIndex(
              (section) => partOfSection(section.kind) === startPart,
            )
          : -1
        setSectionIndex(startIndex >= 0 ? startIndex : 0)
        setLoading(false)
        if (allSections.length === 0 || questionTotal === 0) {
          setError('출제할 수 있는 문제가 없어요.')
        }
        return
      }

      const answeredIds = new Set(await fetchAnsweredQuestionIds(started.id))
      // 이어풀기 시에도 파트 완료 「N문제 중 M개」가 전체 문항 기준으로 맞게
      wrongQuestionIdsRef.current = await fetchWrongQuestionIds(started.id)

      /*
        나갔다 들어와도 **콤보를 이어 준다**(2026-08-11).
        콤보는 이 컴포넌트 메모리에만 있어서, 이어풀기로 돌아오면 0부터 시작했다.
        답안 기록에서 마지막 연속 정답 수를 다시 세어 그 자리에서 잇는다.
        최고 콤보(`maxComboRef`)도 같이 올려 둬야 완료 시 저장값이 뒷걸음치지 않는다.
      */
      const resumedCombo = await fetchTrailingCorrectStreak(started.id)
      if (cancelled) return
      if (resumedCombo > 0) {
        comboRef.current = resumedCombo
        setCombo(resumedCombo)
        if (resumedCombo > maxComboRef.current) {
          maxComboRef.current = resumedCombo
        }
      }
      const remaining = allSections
        .map((section) => filterSection(section, answeredIds))
        .filter((section): section is AssignmentSection => section != null)

      setAttempt(started)
      /*
        남은 문항이 없는데 allSections로 폴백하면, answeredIds.size가 곧 전체라
        진행률이 100%로 고정된다. 그 경우는 이어풀기가 아니라 완료로 보낸다.
      */
      if (remaining.length === 0 && answeredIds.size > 0) {
        setBaseAnsweredCount(0)
        setSections([])
        setSectionIndex(0)
        setLoading(false)
        // 이 세션에서 답을 안 냈으므로 서버에 남은 회차 peak를 쓴다
        const peak = Math.max(maxComboRef.current, started.maxCombo ?? 0)
        if (started.status !== 'completed') {
          await completeAttempt(started.id, peak)
        }
        if (cancelled) return
        onCompletedRef.current({
          wrongQuestionIds: [...wrongQuestionIdsRef.current],
          maxCombo: peak,
        })
        return
      }

      // 이어풀기 — 이전에 쌓아 둔 회차 MAX COMBO는 유지(현재 연속은 0부터)
      maxComboRef.current = Math.max(maxComboRef.current, started.maxCombo ?? 0)
      setBaseAnsweredCount(answeredIds.size)
      const nextSections = remaining.length > 0 ? remaining : allSections
      setSections(nextSections)
      /*
        맵에서 「단어 파트 입장하기」로 들어온 경우 그 파트부터 시작한다.
        인덱스는 **이어풀기 필터를 거친 뒤의** 배열에서 찾아야 한다 —
        원본 배열 기준으로 잡으면 이미 푼 섹션이 빠진 만큼 엉뚱한 파트로 들어간다.
        그 파트가 남아 있지 않으면(다 푼 파트) 0으로 두어 남은 첫 섹션부터 푼다.
      */
      const startIndex = startPart
        ? nextSections.findIndex(
            (section) => partOfSection(section.kind) === startPart,
          )
        : -1
      setSectionIndex(startIndex >= 0 ? startIndex : 0)
      setLoading(false)

      if (
        remaining.length === 0 &&
        (started.status === 'completed' || questionTotal === 0)
      ) {
        onCompletedRef.current({ wrongQuestionIds: [] })
      }
    })()

    return () => {
      cancelled = true
      stopEnglishWordAudio()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
  }, [
    assignment.assignmentId,
    snapshotKey,
    questionTotal,
    onlyIdsKey,
    isPracticeOnly,
    forceNewAttempt,
  ])

  const current = sections[sectionIndex]

  useEffect(() => {
    if (
      current?.kind === 'word-match' ||
      current?.kind === 'word-listen-match'
    ) {
      matchBoardHadWrongRef.current = false
    }
  }, [current?.id, current?.kind])

  const priorQuestionCount = useMemo(() => {
    return countSectionQuestions(sections.slice(0, sectionIndex))
  }, [sections, sectionIndex])

  /** 단어 파트 완료 화면의 「오늘 배운 단어」 — 실제 출제된 단어만 */
  const learnedWords = useMemo<LearnedWordPartItem[]>(() => {
    const wordIds = new Set<string>()
    for (const section of sections) {
      if (partOfSection(section.kind) !== 'word') continue
      if (section.kind === 'word-match' || section.kind === 'word-listen-match') {
        for (const pair of section.pairs) wordIds.add(baseWordId(pair.id))
      } else if (section.kind === 'word-quiz' || section.kind === 'word-spell') {
        for (const question of section.questions) {
          wordIds.add(baseWordId(question.id))
        }
      }
    }
    return assignment.contentSnapshot.words
      .filter((word) => wordIds.has(word.id))
      .map((word) => ({
        id: word.id,
        english: word.english.trim(),
        meaningKo: word.korean.trim(),
      }))
  }, [sections, assignment.contentSnapshot])

  // 파트 첫 문항을 보여주는 시점에 시작 시각을 남긴다 (단어 파트 「공부 시간」)
  const currentPart = current ? partOfSection(current.kind) : null
  if (currentPart && partStartedAtRef.current[currentPart] == null) {
    partStartedAtRef.current[currentPart] = Date.now()
  }

  const recordStep = async (questionId: string, isCorrect: boolean) => {
    if (!isCorrect && !wrongQuestionIdsRef.current.includes(questionId)) {
      wrongQuestionIdsRef.current.push(questionId)
    }
    if (currentPart) {
      const stats = partStatsRef.current[currentPart] ?? { correct: 0, total: 0 }
      stats.total += 1
      if (isCorrect) stats.correct += 1
      partStatsRef.current[currentPart] = stats
    }
    if (isPracticeOnly) {
      // 서버에는 안 올린다(점수 오염 방지) — 대신 로컬에 남겨 이어풀 수 있게 한다
      if (!practiceAnsweredRef.current.includes(questionId)) {
        practiceAnsweredRef.current.push(questionId)
      }
      savePracticeProgress({
        key: practiceKey,
        answeredIds: [...practiceAnsweredRef.current],
        wrongIds: [...wrongQuestionIdsRef.current],
        combo: comboRef.current,
        maxCombo: maxComboRef.current,
      })
      return
    }
    if (!attempt) return

    const updated = await recordAnswer({
      attemptId: attempt.id,
      questionId,
      /*
        **문항당 한 줄.** 예전엔 뒤에 `Date.now()`를 붙였는데, 그러면 같은 문항을 다시
        풀 때마다 매번 새 행이 생겼다. `answers`는 `client_answer_id`로 upsert하므로
        시각이 섞이면 덮어쓰기가 영영 안 걸린다. 그 결과 한 번 틀린 문항은 나중에
        맞혀도 **오답 행이 그대로 남아**, 「틀린문제만」이 이미 맞힌 것까지 다시 냈다.
        (푼 문항 수·점수가 부풀던 것도 같은 원인이다.)
      */
      clientAnswerId: `${attempt.id}:${questionId}`,
      payload: { kind: current?.kind, questionId },
      isCorrect,
    })
    if (updated) setAttempt(updated)
  }

  const finishAssignment = async () => {
    // 연습을 끝냈으면 이어풀 게 없다 — 다음에 다시 들어오면 처음부터가 맞다
    if (isPracticeOnly) clearPracticeProgress()
    // 끝에서 유지 중인 comboRef가 아니라 시퀀스 peak(MAX COMBO)
    const peak = resolvePeakCombo()
    maxComboRef.current = peak
    if (!isPracticeOnly && attempt) {
      await completeAttempt(attempt.id, peak)
    }
    onCompletedRef.current({
      wrongQuestionIds: [...wrongQuestionIdsRef.current],
      practiceOnly: isPracticeOnly,
      maxCombo: peak,
      answeredQuestionIds: listSectionQuestionIds(sections),
    })
  }

  const advanceSection = async () => {
    const nextIndex = sectionIndex + 1
    const finishedPart = current ? partOfSection(current.kind) : null
    const nextPart =
      nextIndex < sections.length
        ? partOfSection(sections[nextIndex]!.kind)
        : null

    // 파트 경계 — 단어/문장/문법 완료 화면을 한 번 거친다.
    // 틀린문제만·복습은 파트 완료를 전부 skip하고, 호출측 종합 완료만 연다.
    if (
      !skipPartCompleteRef.current &&
      finishedPart &&
      finishedPart !== nextPart
    ) {
      setPartGate({ part: finishedPart, nextIndex })
      return
    }

    if (nextIndex >= sections.length) {
      await finishAssignment()
      return
    }
    setSectionIndex(nextIndex)
  }

  /** 파트 완료 화면의 「계속하기」 — 다음 파트, 마지막이면 종합 완료화면으로 */
  const continueFromPartGate = async () => {
    if (!partGate) return
    const { nextIndex } = partGate
    // 단어 완료 화면의 카드 TTS가 다음 화면까지 이어지지 않게
    stopEnglishWordAudio()
    if (nextIndex >= sections.length) {
      setPartGate(null)
      await finishAssignment()
      return
    }
    setPartGate(null)
    setSectionIndex(nextIndex)
  }

  if (loading) {
    return (
      <div className="flex min-h-full items-center justify-center bg-[#E2F7FF] text-[#1274A9]">
        과제를 불러오는 중…
      </div>
    )
  }

  // 연습 모드에서는 파트 완료 UI를 절대 그리지 않는다 (단어/문장/문법)
  if (partGate && !isPracticeOnly) {
    const stats = summarizePartCompletion(
      allSections,
      partGate.part,
      wrongQuestionIdsRef.current,
    )
    const badgeLabel = resolvePartCompleteBadgeLabel(
      partGate.part,
      assignment.title || assignment.contentSnapshot.title || '',
    )
    const onContinue = () => {
      void continueFromPartGate()
    }

    if (partGate.part === 'word') {
      return (
        <LearningCompleteScreen
          badgeLabel={badgeLabel}
          wordCount={learnedWords.length}
          studyMinutes={formatStudyMinutes(
            partStartedAtRef.current.word ?? null,
          )}
          words={learnedWords}
          onContinue={onContinue}
          onHome={onExit}
        />
      )
    }

    return (
      <PartCompleteScreen
        part={partGate.part}
        badgeLabel={badgeLabel}
        correctCount={stats.correct}
        totalCount={stats.total}
        onContinue={onContinue}
        onHome={onExit}
      />
    )
  }

  if (error || !current) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-4 bg-[#E2F7FF] px-6 text-center">
        <p className="text-[#C52B2B]">
          {error ||
            (questionTotal === 0
              ? '출제할 수 있는 문제가 없어요. 선생님 데이터를 확인해 주세요.'
              : '풀 문제가 없어요.')}
        </p>
        <button
          type="button"
          className="rounded-xl bg-[#1AA7F2] px-5 py-3 font-bold text-white"
          onClick={onExit}
        >
          맵으로 돌아가기
        </button>
      </div>
    )
  }

  const commonProps = {
    sessionOffset: baseAnsweredCount + priorQuestionCount,
    sessionTotalSteps: questionTotal,
    onAnswer: (questionId: string, isCorrect: boolean) => {
      handleCombo(isCorrect)
      void recordStep(questionId, isCorrect)
    },
    onComplete: () => {
      void advanceSection()
    },
  }

  /** 단어 A/B 짝맞추기 — 채점은 짝마다, 콤보는 보드 완료 시 최대 1 */
  const matchProps = {
    sessionOffset: baseAnsweredCount + priorQuestionCount,
    sessionTotalSteps: questionTotal,
    onAnswer: (questionId: string, isCorrect: boolean) => {
      if (!isCorrect) {
        matchBoardHadWrongRef.current = true
        handleCombo(false)
      }
      void recordStep(questionId, isCorrect)
    },
    onComplete: () => {
      if (!matchBoardHadWrongRef.current) {
        handleCombo(true)
      }
      matchBoardHadWrongRef.current = false
      void advanceSection()
    },
  }

  const comboState: ComboState = { combo, burst: comboBurst }

  // 들여쓰기를 그대로 두려고 IIFE로 감쌌다 — 아래 switch 본문은 손대지 않은 원래 코드다.
  const sectionScreen = ((): ReactNode => {
  switch (current.kind) {
    case 'word-match':
      return (
        <WordMatchScreen
          key={current.id}
          pairs={current.pairs}
          fillPool={current.fillPool}
          answerIdForPair={(pairId) => pairId}
          {...matchProps}
        />
      )
    case 'word-listen-match':
      return (
        <WordListenMatchScreen
          key={current.id}
          pairs={current.pairs}
          fillPool={current.fillPool}
          answerIdForPair={(pairId) => pairId}
          {...matchProps}
        />
      )
    case 'word-quiz':
      return (
        <WordQuizScreen
          key={current.id}
          questions={current.questions}
          answerIdForQuestion={(questionId) => questionId}
          {...commonProps}
        />
      )
    case 'word-spell':
      return (
        <WordSpellScreen
          key={current.id}
          questions={current.questions}
          answerIdForQuestion={(questionId) => questionId}
          {...commonProps}
        />
      )
    case 'body-text-a':
      return (
        <BodyTextAScreen
          key={current.id}
          questions={current.questions}
          answerIdForQuestion={(questionId) => questionId}
          {...commonProps}
        />
      )
    case 'body-text-b':
      return (
        <BodyTextBScreen
          key={current.id}
          questions={current.questions}
          answerIdForQuestion={(questionId) => questionId}
          {...commonProps}
        />
      )
    case 'body-text-c':
      return (
        <BodyTextCScreen
          key={current.id}
          questions={current.questions}
          answerIdForQuestion={(questionId) => questionId}
          {...commonProps}
        />
      )
    case 'grammar-type-1':
      return (
        <GrammarType1Screen
          key={current.id}
          questions={current.questions}
          {...commonProps}
        />
      )
    case 'grammar-type-2':
      return (
        <GrammarType2Screen
          key={current.id}
          questions={current.questions}
          {...commonProps}
        />
      )
  }
  })()

  // 콤보 배지·버스트는 `FigmaAssetFrame`이 컨텍스트를 읽어 그린다 — 문제 화면 10개는 그대로다.
  return <ComboProvider value={comboState}>{sectionScreen}</ComboProvider>
}

/** Expose question id list for progress helpers / tests */
export function listAssignmentQuestionIds(assignment: StudentAssignment) {
  return listSectionQuestionIds(
    buildAssignmentSections(assignment.contentSnapshot),
  )
}
