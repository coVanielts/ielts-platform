import { HighlightableText } from '@/components/HighlightableText'
import React from 'react'

interface ReadingComprehensionProps {
  questionRange: string
  instructions: string
  passage?: {
    title: string
    content: string[]
  }
  questions?: Array<{
    id: number
    question: string
    options: string[]
  }>
  onAnswerChange?: (questionId: number, value: string) => void
  selectedAnswers?: { [key: number]: string }
}

const ReadingComprehension: React.FC<ReadingComprehensionProps> = ({
  questionRange,
  instructions,
  passage,
  questions = [],
  onAnswerChange,
  selectedAnswers: externalAnswers = {},
}) => {
  const [localAnswers, setLocalAnswers] = React.useState<Record<number, string>>(externalAnswers)

  // Use either external or local answers
  const answers = externalAnswers || localAnswers

  const handleAnswerSelect = (questionId: number, option: string) => {
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: option,
    }))
    if (onAnswerChange) {
      onAnswerChange(questionId, option)
    }
  }

  return (
    <div className="space-y-6">
      {/* Debug info - can be removed later */}
      <div className="hidden">
        {questionRange && <span>Range: {questionRange}</span>}
        {instructions && <span>Instructions: {instructions}</span>}
        {passage && <span>Passage: {passage.title}</span>}
      </div>

      {/* Questions Only - Passage is now shown on left side of layout */}
      <div className="space-y-6">
        {questions.map(question => (
          <div key={question.id} className="border-b border-gray-200 pb-6">
            <div className="mb-4">
              <span className="font-medium text-gray-900">{question.id}</span>
              <span className="ml-2 text-gray-800">
                <HighlightableText text={question.question} enableInternalHighlight />
              </span>
            </div>

            <div className="space-y-2">
              {question.options.map((option, index) => (
                <label key={index} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={option}
                    checked={answers[question.id] === option}
                    onChange={() => handleAnswerSelect(question.id, option)}
                    className="mt-1 text-blue-600"
                  />
                  <span className="text-gray-800">
                    <HighlightableText text={option} enableInternalHighlight />
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default ReadingComprehension
