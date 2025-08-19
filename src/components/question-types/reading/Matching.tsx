import { HighlightableText } from '@/components/HighlightableText'
import React from 'react'

interface MatchingProps {
  questionRange?: string
  instructions?: string
  passages?: Array<{
    author: string
    content: string
  }>
  questions?: Array<{
    id: number
    statement: string
  }>
  onAnswerChange?: (questionId: number, value: string) => void
  selectedAnswers?: { [key: number]: string }
}

const Matching: React.FC<MatchingProps> = ({
  passages = [],
  questions = [],
  onAnswerChange,
  selectedAnswers: externalAnswers = {},
}) => {
  const [localAnswers, setLocalAnswers] = React.useState<Record<number, string>>(externalAnswers)

  const handleAnswerSelect = (questionId: number, author: string) => {
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: author,
    }))
    if (onAnswerChange) {
      onAnswerChange(questionId, author)
    }
  }

  // highlighting handled inline by HighlightableText wrappers

  const authors = passages.map(p => p.author)

  // Use either external or local answers
  const answers = externalAnswers || localAnswers

  return (
    <div className="space-y-6">
      {/* Questions Only - Passages are shown on left side of layout */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Who says the following about the internet?</h3>

        <div className="space-y-6">
          {questions.map(question => (
            <div key={question.id} className="border-b border-gray-200 pb-6">
              <div className="mb-4">
                <span className="font-medium text-gray-900">{question.id}</span>
                <span className="ml-2 text-gray-800">
                  <HighlightableText text={question.statement} enableInternalHighlight />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {authors.map(author => (
                  <label
                    key={author}
                    className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={author}
                      checked={answers[question.id] === author}
                      onChange={() => handleAnswerSelect(question.id, author)}
                      className="text-blue-600"
                    />
                    <span className="text-gray-800">
                      <HighlightableText text={author} enableInternalHighlight />
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Matching
