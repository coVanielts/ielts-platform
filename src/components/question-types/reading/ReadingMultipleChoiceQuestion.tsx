import { HighlightableText } from '@/components/HighlightableText'
import { useEffect, useState } from 'react'

interface ReadingMultipleChoiceQuestionProps {
  questionNumber: number
  question: string
  options: Array<{
    id: string
    text: string
  }>
  selectedAnswer?: string
  onAnswerChange: (answer: string) => void
  isReadOnly?: boolean
  passageReference?: string
}

export default function ReadingMultipleChoiceQuestion({
  questionNumber,
  question,
  options,
  selectedAnswer: selectedAnswerProp,
  onAnswerChange,
  isReadOnly = false,
  passageReference,
}: ReadingMultipleChoiceQuestionProps) {
  // Local state to handle immediate UI updates
  const [selectedAnswer, setSelectedAnswer] = useState<string | undefined>(selectedAnswerProp)

  // Keep local state in sync with props
  useEffect(() => {
    setSelectedAnswer(selectedAnswerProp)
  }, [selectedAnswerProp])

  const handleChange = (answer: string) => {
    if (isReadOnly) return
    setSelectedAnswer(answer)
    onAnswerChange(answer)
  }
  return (
    <div className="card mb-6">
      <div className="card-body">
        {/* Question Header */}
        <div className="flex items-start space-x-3 mb-4">
          <span className="inline-flex items-center justify-center w-6 h-6 bg-green-100 text-green-700 text-sm font-medium rounded-full">
            {questionNumber}
          </span>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-neutral-600 font-medium">Multiple Choice</span>
              </div>
            </div>
            <p className="text-neutral-900 font-medium">
              <HighlightableText text={question} enableInternalHighlight />
            </p>
            {passageReference && <p className="text-sm text-neutral-600 mt-1">{passageReference}</p>}
          </div>
        </div>

        {/* Options */}
        <div className="space-y-3 ml-9">
          {options.map((option, index) => (
            <label
              key={option.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                selectedAnswer === option.id
                  ? 'border-primary-500 bg-primary-50'
                  : 'border-neutral-200 hover:border-primary-300 hover:bg-primary-25'
              } ${isReadOnly ? 'cursor-not-allowed opacity-60' : ''}`}>
              <div className="flex items-center space-x-3">
                <input
                  type="radio"
                  name={`question-${questionNumber}`}
                  value={option.id}
                  checked={selectedAnswer === option.id}
                  onChange={() => handleChange(option.id)}
                  disabled={isReadOnly}
                  className="mt-0.5 h-4 w-4 text-primary-600 focus:ring-primary-500 border-neutral-300"
                  aria-labelledby={`option-label-${questionNumber}-${option.id}`}
                />
                <span className="w-6 h-6 flex items-center justify-center bg-neutral-100 rounded-full text-sm font-medium text-neutral-600">
                  {String.fromCharCode(65 + index)}
                </span>
              </div>
              <div className="flex-1">
                <span id={`option-label-${questionNumber}-${option.id}`} className="text-neutral-900">
                  <HighlightableText text={option.text} enableInternalHighlight />
                </span>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  )
}
