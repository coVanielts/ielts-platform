import { HighlightableText } from '@/components/HighlightableText'

interface ListeningTrueFalseNotGivenProps {
  questionNumber: number
  statement: string
  selectedAnswer?: 'T' | 'F' | 'NG'
  onAnswerChange: (answer: 'T' | 'F' | 'NG') => void
  isReadOnly?: boolean
  instructions?: string
}

export default function ListeningTrueFalseNotGiven({
  questionNumber,
  statement,
  selectedAnswer,
  onAnswerChange,
  isReadOnly = false,
}: ListeningTrueFalseNotGivenProps) {
  const options = [
    { value: 'T', label: 'T' },
    { value: 'F', label: 'F' },
    { value: 'NG', label: 'NG' },
  ] as const

  return (
    <div className="space-y-6">
      {/* Question */}
      <div className="flex items-start space-x-3">
        <span className="font-bold text-gray-700">{questionNumber}.</span>
        <div className="flex-1">
          <p className="text-gray-800 mb-2">
            <HighlightableText text={statement} enableInternalHighlight />
          </p>
          <select
            value={selectedAnswer || ''}
            onChange={e => onAnswerChange(e.target.value as 'T' | 'F' | 'NG')}
            disabled={isReadOnly}
            className="form-select w-full max-w-[200px] px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white">
            <option value="" disabled>
              Select answer
            </option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
