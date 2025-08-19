import React from 'react'

interface MultipleChoiceMultipleAnswersProps {
  questionRange: string
  instructions: string
  questions: Array<{
    id: string
    questionNumber: number
    question: string
    options: Array<{
      id: string
      text: string
    }>
    maxAnswers?: number // Maximum number of answers allowed
    minAnswers?: number // Minimum number of answers required
  }>
  selectedAnswers: Record<string, string[]> // questionId -> array of selected option ids
  onAnswerChange: (questionId: string, selectedOptions: string[]) => void
  isReadOnly?: boolean
}

const MultipleChoiceMultipleAnswers: React.FC<MultipleChoiceMultipleAnswersProps> = ({
  questionRange,
  instructions,
  questions,
  selectedAnswers,
  onAnswerChange,
  isReadOnly = false,
}) => {
  const handleOptionToggle = (questionId: string, optionId: string, maxAnswers?: number) => {
    if (isReadOnly) return

    const currentAnswers = [...(selectedAnswers[questionId] || [])]
    let newAnswers: string[]

    if (currentAnswers.includes(optionId)) {
      // Remove if already selected
      newAnswers = currentAnswers.filter(id => id !== optionId)
    } else {
      // Add if not selected, but check max limit
      if (maxAnswers && currentAnswers.length >= maxAnswers) {
        // If at max limit, replace the first selected option
        newAnswers = [...currentAnswers.slice(1), optionId]
        console.log(`Max answers (${maxAnswers}) reached. Replacing first option with ${optionId}`)
      } else {
        // Add to selection
        newAnswers = [...currentAnswers, optionId]
      }
    }

    console.log(`Updating answers for question ${questionId}:`, newAnswers)

    // Đảm bảo rằng newAnswers không bị thay đổi sau khi gọi onAnswerChange
    onAnswerChange(questionId, [...newAnswers])
  }

  // Debug log
  console.log('MultipleChoiceMultipleAnswers rendering with selectedAnswers:', selectedAnswers)
  console.log('MultipleChoiceMultipleAnswers questions:', questions)

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Question Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 rounded-t-lg">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{questionRange}</h3>
            <p className="text-gray-600 text-sm">{instructions}</p>
          </div>
          {isReadOnly && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Review Mode</span>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="p-6 space-y-6">
        {questions.map(question => {
          const currentAnswers = selectedAnswers[question.id] || []
          const maxAnswers = question.maxAnswers
          const minAnswers = question.minAnswers || 1
          const isComplete = currentAnswers.length >= minAnswers

          return (
            <div key={question.id} className="border-b border-gray-100 pb-6 last:border-b-0">
              {/* Question */}
              <div className="mb-4">
                <div className="flex items-start gap-3">
                  <span className="font-bold text-gray-700 mt-1">{question.questionNumber}.</span>
                  <div className="flex-1">
                    <p className="text-gray-800 mb-2">{question.question}</p>
                    {maxAnswers && (
                      <p className="text-sm text-blue-600 mb-3">
                        Choose up to {maxAnswers} answer{maxAnswers > 1 ? 's' : ''}
                        {minAnswers > 1 && ` (minimum ${minAnswers})`}
                      </p>
                    )}
                  </div>
                  {/* Progress indicator */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-3 h-3 rounded-full ${isComplete ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={isComplete ? 'Complete' : 'Incomplete'}
                    />
                    {maxAnswers && (
                      <span className="text-xs text-gray-500">
                        {currentAnswers.length}/{maxAnswers}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-6">
                {question.options.map(option => {
                  const isSelected = currentAnswers.includes(option.id)
                  // Luôn cho phép select, nếu đã đạt max thì sẽ thay thế option đầu tiên
                  const canSelect = true

                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-3 p-3 rounded border cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-900'
                          : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-800'
                      } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                      htmlFor={`${question.id}-${option.id}`}>
                      <input
                        id={`${question.id}-${option.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleOptionToggle(question.id, option.id, question.maxAnswers)}
                        disabled={isReadOnly}
                        className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                        aria-labelledby={`${question.id}-${option.id}-label`}
                      />
                      <div className="flex-1" id={`${question.id}-${option.id}-label`}>
                        <span className="font-medium text-gray-700 mr-2">{option.id.toUpperCase()}.</span>
                        <span className={isSelected ? 'font-medium' : ''}>{option.text}</span>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Warning for max selections */}
              {maxAnswers && currentAnswers.length >= maxAnswers && (
                <div className="mt-3 ml-6 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
                  Maximum {maxAnswers} answer{maxAnswers > 1 ? 's' : ''} selected. Selecting another option will replace
                  the earliest selected option.
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default MultipleChoiceMultipleAnswers
