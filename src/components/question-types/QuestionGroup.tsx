import type { ListeningQuestionGroup } from '@/types/listening.type'
import type { SpeakingQuestionGroup } from '@/types/speaking.type'
import type { ReadingQuestionGroup } from '@/types/test.type'
import { isSupportedQuestionGroupType, mapServerQuestionGroupType } from '@/utils/question-type-mapping'
import React, { useEffect, useRef } from 'react'
import { ListeningQuestionGroup as ListeningQuestionGroupComponent } from './listening/ListeningQuestionGroup'
import ReadingQuestionGroupComponent from './reading/ReadingQuestionGroup'
import { SpeakingQuestionGroup as SpeakingQuestionGroupComponent } from './speaking/SpeakingQuestionGroup'

type MinimalGroup = {
  id: string
  type: 'reading' | 'listening' | 'writing' | 'speaking'
  questionType: string
} & Record<string, unknown>

interface QuestionGroupProps {
  group: MinimalGroup
  onAnswerChange: (questionId: string, answer: unknown, type?: 'writing' | 'speaking') => void
  isReadOnly?: boolean
  currentQuestion?: number
  answers?: Record<string, unknown>
}

export const QuestionGroup: React.FC<QuestionGroupProps> = ({
  group,
  onAnswerChange,
  isReadOnly,
  currentQuestion,
  answers,
}) => {
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  useEffect(() => {
    if (currentQuestion && questionRefs.current[currentQuestion]) {
      questionRefs.current[currentQuestion]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [currentQuestion])

  // Map server question type to client type
  const mappedQuestionType = mapServerQuestionGroupType(group.questionType)

  // Create a group with mapped question type
  const mappedGroup: MinimalGroup = {
    ...group,
    questionType: mappedQuestionType,
  }

  // Check if the question type is supported
  if (!isSupportedQuestionGroupType(mappedQuestionType)) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="text-yellow-800 font-medium">Unsupported Question Type</h3>
        <p className="text-yellow-700 text-sm mt-1">
          Question type &quot;{group.questionType}&quot; (mapped to &quot;{mappedQuestionType}&quot;) is not yet
          supported.
        </p>
      </div>
    )
  }

  switch (group.type) {
    case 'reading':
      return (
        <ReadingQuestionGroupComponent
          group={mappedGroup as unknown as ReadingQuestionGroup}
          onAnswerChange={onAnswerChange}
          isReadOnly={isReadOnly}
          currentQuestion={currentQuestion}
          answers={answers as Record<string, unknown> | undefined}
        />
      )
    case 'listening':
      return (
        <ListeningQuestionGroupComponent
          group={mappedGroup as unknown as ListeningQuestionGroup}
          onAnswerChange={onAnswerChange}
          isReadOnly={isReadOnly}
          currentQuestion={currentQuestion}
          answers={answers as Record<string, unknown> | undefined}
        />
      )
    case 'speaking':
      return (
        <SpeakingQuestionGroupComponent
          group={mappedGroup as unknown as SpeakingQuestionGroup}
          onAnswerChange={onAnswerChange}
          isReadOnly={isReadOnly}
          currentQuestion={currentQuestion}
          answers={answers}
        />
      )
    default:
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h3 className="text-red-800 font-medium">Unknown Section Type</h3>
          <p className="text-red-700 text-sm mt-1">Section type &quot;{group.type}&quot; is not recognized.</p>
        </div>
      )
  }
}
