import React from 'react'

interface ListeningMultipleChoiceMultipleAnswersProps {
  questionRange: string
  instructions: string
  questions: Array<{
    id: string
    questionNumber: number
    question: string
    extract?: {
      id: number
      context: string
    }
    options: Array<{
      id: string
      text: string
    }>
  }>
  selectedAnswers: Record<string, string[]> // questionId -> array of selected option ids
  onAnswerChange: (questionId: string, selectedOptions: string[]) => void
  isReadOnly?: boolean
}

const ListeningMultipleChoiceMultipleAnswers: React.FC<ListeningMultipleChoiceMultipleAnswersProps> = ({
  questionRange,
  instructions,
  questions,
  selectedAnswers,
  onAnswerChange,
  isReadOnly = false,
}) => {
  const handleOptionToggle = (questionId: string, optionId: string) => {
    if (isReadOnly) return

    const currentAnswers = selectedAnswers[questionId] || []
    let newAnswers: string[]

    if (currentAnswers.includes(optionId)) {
      // Remove if already selected
      newAnswers = currentAnswers.filter(id => id !== optionId)
    } else {
      // Add if not selected
      newAnswers = [...currentAnswers, optionId]
    }

    onAnswerChange(questionId, newAnswers)
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Question Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-3 rounded-t-lg">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-md font-medium text-gray-900 mb-1">{questionRange}</h3>
            <p className="text-gray-600 text-xs">{instructions}</p>
          </div>
          {isReadOnly && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Review Mode</span>
          )}
        </div>
      </div>

      {/* Questions */}
      <div className="p-4 space-y-4">
        {questions.map(question => {
          const currentAnswers = selectedAnswers[question.id] || []

          return (
            <div key={question.id} className="border-b border-gray-100 pb-4 last:border-b-0">
              {/* Extract/Context (if available) */}
              {question.extract && (
                <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-semibold text-gray-500 mt-1">EXTRACT {question.extract.id}</span>
                    <p className="text-xs text-gray-700 italic leading-relaxed">
                      &ldquo;{question.extract.context}&rdquo;
                    </p>
                  </div>
                </div>
              )}

              {/* Question */}
              <div className="mb-3">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-gray-700 text-sm mt-1">{question.questionNumber}.</span>
                  <div className="flex-1">
                    <p className="text-gray-800 mb-2 text-sm leading-relaxed">{question.question}</p>
                  </div>
                  {/* Progress indicator */}
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-2 h-2 rounded-full ${currentAnswers.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}
                      title={currentAnswers.length > 0 ? 'Answered' : 'Not answered'}
                    />
                    <span className="text-xs text-gray-500 bg-gray-100 px-1 py-0.5 rounded">
                      {currentAnswers.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2 ml-5">
                {question.options.map(option => {
                  const isSelected = currentAnswers.includes(option.id)

                  return (
                    <label
                      key={option.id}
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all duration-200 ${
                        isSelected
                          ? 'bg-green-50 border-green-300 text-green-900 shadow-sm'
                          : 'bg-white border-gray-200 hover:bg-blue-50 hover:border-blue-300 text-gray-800'
                      } ${isReadOnly ? 'cursor-not-allowed' : ''}`}
                      htmlFor={`listening-${question.id}-${option.id}`}>
                      <input
                        id={`listening-${question.id}-${option.id}`}
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleOptionToggle(question.id, option.id)}
                        disabled={isReadOnly}
                        className={`mt-0.5 h-3 w-3 border-2 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed ${
                          isSelected ? 'text-green-600 border-green-500' : 'text-blue-600 border-gray-300'
                        }`}
                        aria-labelledby={`listening-${question.id}-${option.id}-label`}
                      />
                      <div className="flex-1" id={`listening-${question.id}-${option.id}-label`}>
                        <div className="flex items-start gap-2">
                          <span className="font-bold text-gray-700 text-xs min-w-[20px]">
                            {option.id.toUpperCase()}.
                          </span>
                          <span className={`text-sm leading-relaxed ${isSelected ? 'font-medium' : ''}`}>{option.text}</span>
                        </div>
                      </div>
                      {/* Selected indicator */}
                      {isSelected && (
                        <span className="text-green-600 text-xs bg-green-100 px-1 py-0.5 rounded font-medium">
                          ✓
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

    </div>
  )
}

export default ListeningMultipleChoiceMultipleAnswers
