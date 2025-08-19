import { HighlightableText } from '@/components/HighlightableText'
interface TrueFalseNotGivenQuestionProps {
  questionNumber: number
  statement: string
  selectedAnswer?: 'TRUE' | 'FALSE' | 'NOT_GIVEN'
  onAnswerChange: (answer: 'TRUE' | 'FALSE' | 'NOT_GIVEN') => void
  isReadOnly?: boolean
  passage?: {
    title: string
    content: string[]
  }
  instructions?: string
}

export default function TrueFalseNotGivenQuestion({
  questionNumber,
  statement,
  selectedAnswer,
  onAnswerChange,
  isReadOnly = false,
}: TrueFalseNotGivenQuestionProps) {
  const options = [
    { value: 'TRUE', label: 'TRUE' },
    { value: 'FALSE', label: 'FALSE' },
    { value: 'NOT_GIVEN', label: 'NOT GIVEN' },
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
            onChange={e => onAnswerChange(e.target.value as 'TRUE' | 'FALSE' | 'NOT_GIVEN')}
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
