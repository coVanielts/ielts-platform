import React from 'react'

interface SentenceTransformationProps {
  questionRange?: string
  instructions?: string
  questions?: Array<{
    id: number
    originalSentence: string
    keyWord: string
    transformedStart: string
    transformedEnd: string
  }>
  onAnswerChange?: (questionId: number, value: string) => void
  answers?: { [key: number]: string }
}

const SentenceTransformation: React.FC<SentenceTransformationProps> = ({
  questionRange,
  // instructions,
  questions = [],
  onAnswerChange,
  answers: externalAnswers = {},
}) => {
  const [localAnswers, setLocalAnswers] = React.useState<Record<number, string>>(externalAnswers)

  // Use either external or local answers
  const answers = externalAnswers || localAnswers

  const handleAnswerChange = (questionId: number, value: string) => {
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }))
    if (onAnswerChange) {
      onAnswerChange(questionId, value)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{questionRange}</h3>
        <div className="text-sm text-gray-600">
          <p>For each question, complete the second sentence so that it means the same as the first.</p>
          <p className="mt-1">
            <span className="font-semibold">Do not change the word given.</span> You must use between{' '}
            <span className="font-semibold">three</span> and <span className="font-semibold">eight</span> words,
            including the word given.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map(question => (
          <div key={question.id} className="border border-gray-200 rounded-lg p-4">
            <div className="space-y-3">
              <p className="text-gray-800 text-base">{question.originalSentence}</p>

              <div className="flex items-center space-x-2">
                <span className="font-bold text-base bg-blue-100 px-2 py-1 rounded">{question.keyWord}</span>
              </div>

              <div className="flex items-center space-x-2 flex-wrap">
                <span className="text-gray-800 text-base">{question.transformedStart}</span>
                <input
                  type="text"
                  value={answers[question.id] || ''}
                  onChange={e => handleAnswerChange(question.id, e.target.value)}
                  className="flex-1 min-w-[200px] px-3 py-2 border border-blue-300 rounded bg-blue-50 text-base focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  placeholder="Complete the sentence..."
                />
                <span className="text-gray-800 text-base">{question.transformedEnd}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SentenceTransformation
