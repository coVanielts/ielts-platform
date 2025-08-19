import { ListeningMultipleChoiceQuestion } from '@/types/listening.type'
import React, { useEffect, useState } from 'react'
import { HighlightableText } from '../../HighlightableText'
import RichTextViewer from '../../RichTextViewer'

interface ListeningMultipleChoiceProps {
  questionRange?: string
  instructions?: string
  extract?: {
    id: number
    context: string
  }
  questions: ListeningMultipleChoiceQuestion[]
  onAnswerChange: (questionId: string, answer: string) => void
  isReadOnly?: boolean
  selectedAnswers?: Record<string, string | string[]>
}

export const ListeningMultipleChoice: React.FC<ListeningMultipleChoiceProps> = ({
  questionRange,
  instructions,
  extract,
  questions,
  onAnswerChange,
  isReadOnly = false,
  selectedAnswers: selectedAnswersProp = {},
}) => {
  // Process initial selectedAnswers to handle arrays
  const processInitialAnswers = (answers: Record<string, string | string[]>): Record<string, string> => {
    const processed: Record<string, string> = {}
    Object.entries(answers).forEach(([questionId, value]) => {
      if (Array.isArray(value) && value.length > 0) {
        processed[questionId] = value[0]
      } else if (typeof value === 'string') {
        processed[questionId] = value
      }
    })
    return processed
  }

  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>(
    processInitialAnswers(selectedAnswersProp),
  )

  // keep local state in sync if parent answers change
  useEffect(() => {
    if (selectedAnswersProp) {
      const processedAnswers: Record<string, string> = {}
      Object.entries(selectedAnswersProp).forEach(([questionId, value]) => {
        // Handle both string and array values
        if (Array.isArray(value) && value.length > 0) {
          processedAnswers[questionId] = value[0] // Take first element from array
        } else if (typeof value === 'string') {
          processedAnswers[questionId] = value
        }
      })
      setSelectedAnswers(processedAnswers)
    }
  }, [selectedAnswersProp])

  const handleChange = (questionId: string, choiceId: string) => {
    if (isReadOnly) return
    setSelectedAnswers(prev => ({ ...prev, [questionId]: choiceId }))
    onAnswerChange(questionId, choiceId)
  }

  const handleHighlight = () => {}

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Question Header */}
      {(questionRange || instructions) && (
        <div className="bg-gray-50 border-b border-gray-200 p-3 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              {questionRange && <h3 className="text-md font-medium text-gray-900 mb-1">{questionRange}</h3>}
              {instructions && (
                <div className="text-gray-600 text-xs">
                  <HighlightableText text={instructions} enableInternalHighlight />
                </div>
              )}
            </div>
            {isReadOnly && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Review Mode</span>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-4">
        {extract && (
          <div className="bg-neutral-50 p-3 rounded-lg">
            <HighlightableText
              text={extract.context}
              className="text-neutral-700 text-sm block"
              onHighlight={handleHighlight}
            />
          </div>
        )}

        {questions.map(question => {
          const choices =
            question.choices && question.choices.length > 0
              ? question.choices
              : [
                  { id: 'A', text: 'Option A' },
                  { id: 'B', text: 'Option B' },
                  { id: 'C', text: 'Option C' },
                ]
          return (
            <div key={question.id} className="bg-white border border-neutral-200 rounded-lg p-4">
              {/* Question Header */}
              <div className="flex items-start space-x-3 mb-3">
                <span className="inline-flex items-center justify-center w-5 h-5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                  {question.questionNumber}
                </span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-neutral-600 font-medium">Multiple Choice</span>
                    </div>
                  </div>
                  {question.questionDoc ? (
                    <RichTextViewer
                      content={question.questionDoc}
                      className="select-text cursor-text reading-passage text-neutral-900 text-sm font-medium block"
                    />
                  ) : (
                    <HighlightableText
                      text={question.question}
                      className="text-neutral-900 text-sm font-medium block"
                      onHighlight={handleHighlight}
                    />
                  )}
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-8">
                {choices.map((choice, index) => (
                  <label
                    key={choice.id}
                    className={`flex items-start space-x-2 p-2 rounded-lg border cursor-pointer transition-colors ${
                      selectedAnswers[question.id] === choice.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-25'
                    } ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}`}>
                    <span className="sr-only">{choice.text}</span>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name={`question-${question.id}`}
                        value={choice.id}
                        checked={selectedAnswers[question.id] === choice.id}
                        onChange={() => handleChange(question.id, choice.id)}
                        disabled={isReadOnly}
                        className="mt-0.5 h-3 w-3 text-primary-600 focus:ring-primary-500 border-neutral-300"
                      />
                      <span className="w-5 h-5 flex items-center justify-center bg-neutral-100 rounded-full text-xs font-medium text-neutral-600">
                        {String.fromCharCode(65 + index)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <span className="text-neutral-900 text-sm">{choice.text}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
