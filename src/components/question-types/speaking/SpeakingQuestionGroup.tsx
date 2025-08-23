import { SpeakingQuestion, SpeakingQuestionGroup as SpeakingQuestionGroupType } from '@/types/speaking.type'
import React, { useEffect, useRef, useState } from 'react'
import { AudioUploader } from './AudioUploader'

interface SpeakingQuestionGroupProps {
  group: SpeakingQuestionGroupType
  onAnswerChange: (questionId: string, audioUrl: any, type?: 'writing' | 'speaking') => void
  isReadOnly?: boolean
  currentQuestion?: number
  answers?: Record<string, unknown>
}

export const SpeakingQuestionGroup: React.FC<SpeakingQuestionGroupProps> = ({
  group,
  onAnswerChange,
  isReadOnly = false,
  currentQuestion,
  answers,
}) => {
  const [localAnswers, setLocalAnswers] = useState<Record<string, unknown>>(answers || {})
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (answers) {
      setLocalAnswers(answers)
    }
  }, [answers, setLocalAnswers])

  useEffect(() => {
    if (currentQuestion && questionRefs.current[currentQuestion]) {
      questionRefs.current[currentQuestion]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentQuestion])

  const handleAudioUpload = async (questionId: string, audio: File | null) => {
    if (audio) {
      setLocalAnswers(prev => ({
        ...prev,
        [questionId]: URL.createObjectURL(audio),
      }))
    } else {
      setLocalAnswers(prev => ({ ...prev, [questionId]: null }))
    }

    onAnswerChange(questionId, audio, 'speaking')
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
            className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-4">
              {/* Question Number and Text */}
              <div>
                <h4 className="text-base font-medium text-gray-900 mb-2">Question {question.questionNumber}</h4>
                <p className="text-gray-700">{question.questionText}</p>
              </div>
              {/* Audio Upload */}
              <div className="mt-4">
                <AudioUploader
                  questionId={question.id}
                  onAudioUpload={handleAudioUpload}
                  currentAudioUrl={localAnswers[question.id] as string}
                  isDisabled={isReadOnly}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
