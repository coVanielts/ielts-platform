import { SpeakingQuestion, SpeakingQuestionGroup as SpeakingQuestionGroupType } from '@/types/speaking.type'
import React, { useEffect, useRef } from 'react'
import { AudioUploader } from './AudioUploader'

interface SpeakingQuestionGroupProps {
  group: SpeakingQuestionGroupType
  onAnswerChange: (questionId: string, audioUrl: any, type?: 'writing' | 'speaking') => void
  isReadOnly?: boolean
  currentQuestion?: number
  answers?: Record<string, unknown>
  savingQuestions?: Set<string>
}

export const SpeakingQuestionGroup: React.FC<SpeakingQuestionGroupProps> = ({
  group,
  onAnswerChange,
  isReadOnly = false,
  currentQuestion,
  answers = {},
  savingQuestions = new Set(),
}) => {
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (currentQuestion && questionRefs.current[currentQuestion]) {
      questionRefs.current[currentQuestion]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentQuestion])

  const handleAudioUpload = async (questionId: string, audio: File | null) => {
    console.log('SpeakingQuestionGroup - handleAudioUpload:', { questionId, audio, hasAudio: !!audio })
    onAnswerChange(questionId, audio, 'speaking')
  }

  const hasAnswer = (questionId: string) => {
    const answer = answers[questionId]
    const result = answer != null && answer !== undefined && answer !== ''
    console.log('SpeakingQuestionGroup - hasAnswer:', { questionId, answer, result, allAnswers: answers })
    return result
  }

  const isQuestionSaving = (questionId: string) => {
    return savingQuestions.has(questionId)
  }

  return (
    <div className="space-y-8">
      {/* Instructions */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {group.title || `Part ${group.questionType.replace('part', '')}`}
        </h3>
        <p className="text-gray-700">{group.instruction}</p>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        {group.questions.map((question: SpeakingQuestion) => (
          <div
            key={question.id}
            ref={el => {
              questionRefs.current[question.questionNumber] = el
            }}
            className={`bg-white p-6 rounded-lg shadow-sm border-l-4 transition-all duration-200 ${
              currentQuestion === question.questionNumber 
                ? 'border-l-blue-500 ring-2 ring-blue-100' 
                : hasAnswer(question.id)
                ? 'border-l-green-500'
                : 'border-l-gray-200'
            }`}>
            <div className="space-y-4">
              {/* Question Number and Text */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="text-base font-medium text-gray-900">Question {question.questionNumber}</h4>
                  </div>
                  <p className="text-gray-700">{question.questionText}</p>
                </div>
              </div>
              
              {/* Audio Upload */}
              <div className="mt-4">
                <AudioUploader
                  questionId={question.id}
                  onAudioUpload={handleAudioUpload}
                  currentAudioUrl={answers[question.id] as string}
                  isDisabled={isReadOnly}
                  isLoading={isQuestionSaving(question.id)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
