import { ListeningMatchingQuestion } from '@/types/listening.type'
import React from 'react'
import { HighlightableText } from '../../HighlightableText'

interface ListeningMatchingProps {
  task1Questions: ListeningMatchingQuestion[]
  task2Questions: ListeningMatchingQuestion[]
  onAnswerChange: (questionId: string, answer: string) => void
  isReadOnly?: boolean
  selectedAnswers?: { [key: string]: string }
}

export const ListeningMatching: React.FC<ListeningMatchingProps> = ({
  task1Questions,
  task2Questions,
  onAnswerChange,
  isReadOnly = false,
  selectedAnswers = {},
}) => {
  const handleHighlight = (text: string) => {}

  const renderTask = (taskNumber: number, questions: ListeningMatchingQuestion[]) => {
    if (questions.length === 0) return null

    const options = questions[0].options

    return (
      <div>
        <h2 className="text-xl font-semibold mb-6">Task {taskNumber}</h2>
        <div className="grid grid-cols-[auto,1fr] gap-x-8 gap-y-4">
          {/* Headers */}
          <div></div>
          <div className="grid grid-cols-5 gap-4">
            {questions.map(q => (
              <div key={q.id} className="text-center font-medium">
                Speaker {q.speaker}
              </div>
            ))}
          </div>

          {/* Options with radio buttons */}
          {options.map((option, index) => (
            <React.Fragment key={index}>
              <div className="py-2">
                <HighlightableText text={option} className="inline" onHighlight={handleHighlight} />
              </div>
              <div className="grid grid-cols-5 gap-4">
                {questions.map(question => (
                  <div key={question.id} className="flex justify-center">
                    <input
                      type="radio"
                      name={`question-${question.id}`}
                      value={option}
                      checked={selectedAnswers[question.id] === option}
                      onChange={e => !isReadOnly && onAnswerChange(question.id, e.target.value)}
                      disabled={isReadOnly}
                      className={`
                        w-4 h-4 border focus:ring-2 focus:ring-offset-2
                        ${
                          isReadOnly
                            ? 'text-gray-400 border-gray-300 cursor-not-allowed'
                            : 'text-blue-600 border-gray-300 focus:ring-blue-500'
                        }
                      `}
                    />
                  </div>
                ))}
              </div>
            </React.Fragment>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-12">
      {renderTask(1, task1Questions)}
      {renderTask(2, task2Questions)}
    </div>
  )
}
