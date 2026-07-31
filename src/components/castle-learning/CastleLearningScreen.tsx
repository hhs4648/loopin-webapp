import { useEffect, useRef, useState } from 'react'
import { FigmaAssetFrame } from '../FigmaAssetFrame'
import { playAnswerSfx, playTapSfx } from '../exercise/answer-sfx'
import {
  CASTLE_HEADER_BACK_HIT,
  CASTLE_LEARNING_STEPS,
  type CastleLearningStepId,
  figmaRectStyle,
} from './castle-learning'
import { speakKoreanText, stopKoreanSpeech } from './speech-ko'

type CastleLearningScreenProps = {
  stepId: CastleLearningStepId
  onComplete?: () => void
}

type QuizResult = 'idle' | 'correct' | 'wrong'

function optionFrameClass(result: QuizResult, isSelected: boolean) {
  if (result === 'correct' && isSelected) {
    return 'rounded-[24px] border-[3px] border-[#22C55E]'
  }
  if (result === 'wrong' && isSelected) {
    return 'rounded-[24px] border-[3px] border-[#EF4444]'
  }
  if (isSelected) {
    return 'rounded-[24px] border-[3px] border-[#3B6FF5]/70 shadow-[0_0_0_3px_rgba(59,111,245,0.18)]'
  }
  return 'rounded-[24px] border-[3px] border-transparent'
}

export function CastleLearningScreen({ stepId, onComplete }: CastleLearningScreenProps) {
  const step = CASTLE_LEARNING_STEPS[stepId]
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [quizResult, setQuizResult] = useState<QuizResult>('idle')
  const [quizLocked, setQuizLocked] = useState(false)
  const feedbackTimerRef = useRef<number | null>(null)

  useEffect(() => {
    setSelectedOptionId(null)
    setQuizResult('idle')
    setQuizLocked(false)
    speakKoreanText(step.narration, { force: true })

    return () => {
      if (feedbackTimerRef.current !== null) {
        window.clearTimeout(feedbackTimerRef.current)
        feedbackTimerRef.current = null
      }
      stopKoreanSpeech()
    }
  }, [stepId, step.narration])

  const handleContinue = () => {
    if (step.kind === 'quiz') return
    playTapSfx()
    stopKoreanSpeech()
    onComplete?.()
  }

  const handleQuizOptionClick = (optionId: string) => {
    if (step.kind !== 'quiz' || quizLocked) return

    playTapSfx()
    setSelectedOptionId(optionId)
    setQuizResult('idle')
  }

  const handleQuizConfirm = () => {
    if (step.kind !== 'quiz' || quizLocked || !selectedOptionId) return

    playTapSfx()
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current)
    }

    if (selectedOptionId === step.correctOptionId) {
      setQuizLocked(true)
      setQuizResult('correct')
      playAnswerSfx(true)
      feedbackTimerRef.current = window.setTimeout(() => {
        feedbackTimerRef.current = null
        stopKoreanSpeech()
        onComplete?.()
      }, 500)
      return
    }

    setQuizResult('wrong')
    playAnswerSfx(false)
    feedbackTimerRef.current = window.setTimeout(() => {
      feedbackTimerRef.current = null
      setSelectedOptionId(null)
      setQuizResult('idle')
    }, 500)
  }

  return (
    <FigmaAssetFrame
      src={step.asset}
      alt={`학습 ${stepId}`}
      bgClassName="bg-white"
      backButtonHit={CASTLE_HEADER_BACK_HIT}
    >
      {step.kind === 'info' ? (
        <>
          <button
            type="button"
            aria-label="화면 터치로 계속하기"
            className="absolute inset-0 z-[1] cursor-pointer bg-transparent"
            onClick={handleContinue}
          />
          <button
            type="button"
            aria-label="계속하기"
            className="absolute z-[2] cursor-pointer bg-transparent"
            style={figmaRectStyle(step.continueButton)}
            onClick={handleContinue}
          />
        </>
      ) : (
        <>
          {step.options.map((option) => {
            const isSelected = selectedOptionId === option.id

            return (
              <button
                key={option.id}
                type="button"
                aria-label={option.label}
                disabled={quizLocked}
                className={`absolute z-[2] bg-transparent ${optionFrameClass(
                  quizResult,
                  isSelected,
                )} ${quizLocked ? 'cursor-default' : 'cursor-pointer'}`}
                style={figmaRectStyle(option.box)}
                onClick={() => handleQuizOptionClick(option.id)}
              />
            )
          })}
          <button
            type="button"
            aria-label="확인"
            disabled={quizLocked || !selectedOptionId}
            className={`absolute z-[2] bg-transparent ${
              quizLocked || !selectedOptionId ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={figmaRectStyle(step.confirmButton)}
            onClick={handleQuizConfirm}
          />
        </>
      )}
    </FigmaAssetFrame>
  )
}
