import { useEffect, useMemo, useRef, useState } from 'react'
import { BodyTextAScreen } from '../../components/body-text-a/BodyTextAScreen'
import { BodyTextBScreen } from '../../components/body-text-b/BodyTextBScreen'
import { BodyTextCScreen } from '../../components/body-text-c/BodyTextCScreen'
import { GrammarType1Screen } from '../../components/grammar-type-1/GrammarType1Screen'
import { GrammarType2Screen } from '../../components/grammar-type-2/GrammarType2Screen'
import { WordMatchScreen } from '../../components/word-match/WordMatchScreen'
import { WordListenMatchScreen } from '../../components/word-listen-match/WordListenMatchScreen'
import { WordQuizScreen } from '../../components/word-quiz/WordQuizScreen'
import { WordSpellScreen } from '../../components/word-spell/WordSpellScreen'
import { stopEnglishWordAudio } from '../../components/word-quiz/word-quiz'
import {
  completeAttempt,
  fetchAnsweredQuestionIds,
  recordAnswer,
  startOrResumeAttempt,
} from '../../lib/sync/student-api'
import type { AttemptProgress, StudentAssignment } from '../../lib/sync/types'
import {
  buildAssignmentSections,
  countSectionQuestions,
  listSectionQuestionIds,
  type AssignmentSection,
} from './build-session-sections'
import { fillMatchPage } from '../../components/word-match/word-match'
import { expandGrammarType2Steps } from '../../components/grammar-type-2/grammar-type-2'

export type AssignmentRunnerCompleteInfo = {
  wrongQuestionIds: string[]
}

type AssignmentRunnerScreenProps = {
  assignment: StudentAssignment
  /** 있으면 해당 question_id만 출제 (틀린문제만) */
  onlyQuestionIds?: string[] | null
  onExit: () => void
  onCompleted: (info?: AssignmentRunnerCompleteInfo) => void
}

function filterSection(
  section: AssignmentSection,
  answeredIds: Set<string>,
): AssignmentSection | null {
  switch (section.kind) {
    case 'word-match': {
      const remaining = section.pairs.filter((pair) => !answeredIds.has(pair.id))
      if (!remaining.length) return null
      return {
        ...section,
        pairs: fillMatchPage(remaining, section.fillPool, `${section.id}:resume`, answeredIds),
      }
    }
    case 'word-listen-match': {
      const remaining = section.pairs.filter((pair) => !answeredIds.has(pair.id))
      if (!remaining.length) return null
      return {
        ...section,
        pairs: fillMatchPage(
          remaining,
          section.fillPool,
          `${section.id}:resume`,
          answeredIds,
        ),
      }
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

/** 틀린문제만 — keepIds에 있는 문항만 남김 */
function keepOnlyQuestionIds(
  section: AssignmentSection,
  keepIds: Set<string>,
): AssignmentSection | null {
  switch (section.kind) {
    case 'word-match': {
      const remaining = section.pairs.filter((pair) => keepIds.has(pair.id))
      if (!remaining.length) return null
      return {
        ...section,
        pairs: fillMatchPage(
          remaining,
          section.fillPool,
          `${section.id}:wrong-only`,
          new Set(),
        ),
      }
    }
    case 'word-listen-match': {
      const remaining = section.pairs.filter((pair) => keepIds.has(pair.id))
      if (!remaining.length) return null
      return {
        ...section,
        pairs: fillMatchPage(
          remaining,
          section.fillPool,
          `${section.id}:wrong-only`,
          new Set(),
        ),
      }
    }
    case 'word-quiz': {
      const questions = section.questions.filter((q) => keepIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'word-spell': {
      const questions = section.questions.filter((q) => keepIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-a': {
      const questions = section.questions.filter((q) => keepIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-b': {
      const questions = section.questions.filter((q) => keepIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'body-text-c': {
      const questions = section.questions.filter((q) => keepIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'grammar-type-1': {
      const questions = section.questions.filter((q) => keepIds.has(q.id))
      return questions.length ? { ...section, questions } : null
    }
    case 'grammar-type-2': {
      const remaining = expandGrammarType2Steps(section.questions).filter((q) =>
        keepIds.has(q.id),
      )
      return remaining.length ? { ...section, questions: remaining } : null
    }
  }
}

export function AssignmentRunnerScreen({
  assignment,
  onlyQuestionIds = null,
  onExit,
  onCompleted,
}: AssignmentRunnerScreenProps) {
  const onlyIdsKey = onlyQuestionIds?.slice().sort().join('|') ?? ''
  const allSections = useMemo(() => {
    const built = buildAssignmentSections(assignment.contentSnapshot)
    if (!onlyQuestionIds?.length) return built
    const keep = new Set(onlyQuestionIds)
    return built
      .map((section) => keepOnlyQuestionIds(section, keep))
      .filter((section): section is AssignmentSection => section != null)
  }, [assignment.contentSnapshot, onlyIdsKey, onlyQuestionIds])

  const questionTotal = useMemo(
    () => countSectionQuestions(allSections),
    [allSections],
  )

  const [attempt, setAttempt] = useState<AttemptProgress | null>(null)
  const [sections, setSections] = useState<AssignmentSection[]>([])
  const [sectionIndex, setSectionIndex] = useState(0)
  /** Answered count at load — progress bar offset must not double-count live answers. */
  const [baseAnsweredCount, setBaseAnsweredCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const wrongQuestionIdsRef = useRef<string[]>([])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      wrongQuestionIdsRef.current = []
      const started = await startOrResumeAttempt({
        assignmentId: assignment.assignmentId,
        questionTotal,
      })
      if (cancelled) return
      if (!started) {
        setError('과제를 시작하지 못했어요. 잠시 후 다시 시도해 주세요.')
        setLoading(false)
        return
      }

      // 틀린문제만 모드는 필터된 섹션 전체를 새 attempt로 풀이
      if (onlyQuestionIds?.length) {
        setAttempt(started)
        setBaseAnsweredCount(0)
        setSections(allSections)
        setSectionIndex(0)
        setLoading(false)
        if (allSections.length === 0 || questionTotal === 0) {
          onCompleted({ wrongQuestionIds: [] })
        }
        return
      }

      const answeredIds = new Set(await fetchAnsweredQuestionIds(started.id))
      const remaining = allSections
        .map((section) => filterSection(section, answeredIds))
        .filter((section): section is AssignmentSection => section != null)

      setAttempt(started)
      setBaseAnsweredCount(answeredIds.size)
      setSections(remaining.length > 0 ? remaining : allSections)
      setSectionIndex(0)
      setLoading(false)

      if (
        remaining.length === 0 &&
        (started.status === 'completed' || questionTotal === 0)
      ) {
        onCompleted({ wrongQuestionIds: [] })
      }
    })()

    return () => {
      cancelled = true
      stopEnglishWordAudio()
    }
  }, [
    assignment.assignmentId,
    allSections,
    questionTotal,
    onCompleted,
    onlyIdsKey,
    onlyQuestionIds,
  ])

  const current = sections[sectionIndex]
  const priorQuestionCount = useMemo(() => {
    return countSectionQuestions(sections.slice(0, sectionIndex))
  }, [sections, sectionIndex])

  const recordStep = async (questionId: string, isCorrect: boolean) => {
    if (!attempt) return
    if (!isCorrect && !wrongQuestionIdsRef.current.includes(questionId)) {
      wrongQuestionIdsRef.current.push(questionId)
    }
    const updated = await recordAnswer({
      attemptId: attempt.id,
      questionId,
      clientAnswerId: `${attempt.id}:${questionId}:${Date.now()}`,
      payload: { kind: current?.kind, questionId },
      isCorrect,
    })
    if (updated) setAttempt(updated)
  }

  const advanceSection = async () => {
    if (!attempt) return
    const nextIndex = sectionIndex + 1
    if (nextIndex >= sections.length) {
      await completeAttempt(attempt.id)
      onCompleted({ wrongQuestionIds: [...wrongQuestionIdsRef.current] })
      return
    }
    setSectionIndex(nextIndex)
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#E2F7FF] text-[#1274A9]">
        과제를 불러오는 중…
      </div>
    )
  }

  if (error || !current) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[#E2F7FF] px-6 text-center">
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
      void recordStep(questionId, isCorrect)
    },
    onComplete: () => {
      void advanceSection()
    },
  }

  switch (current.kind) {
    case 'word-match':
      return (
        <WordMatchScreen
          key={current.id}
          pairs={current.pairs}
          fillPool={current.fillPool}
          answerIdForPair={(pairId) => pairId}
          {...commonProps}
        />
      )
    case 'word-listen-match':
      return (
        <WordListenMatchScreen
          key={current.id}
          pairs={current.pairs}
          fillPool={current.fillPool}
          answerIdForPair={(pairId) => pairId}
          {...commonProps}
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
}

/** Expose question id list for progress helpers / tests */
export function listAssignmentQuestionIds(assignment: StudentAssignment) {
  return listSectionQuestionIds(
    buildAssignmentSections(assignment.contentSnapshot),
  )
}
