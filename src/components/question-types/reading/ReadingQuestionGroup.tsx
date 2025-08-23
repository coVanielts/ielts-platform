import type {
  MatchingQuestion,
  MultipleChoiceMultipleAnswersQuestion,
  ParagraphOrderingQuestion,
  ReadingComprehensionQuestion,
  ReadingMultipleChoiceQuestion as ReadingMultipleChoiceQuestionType,
  ReadingQuestionGroup as ReadingQuestionGroupType,
  SentenceTransformationQuestion,
  TrueFalseNotGivenQuestion as TrueFalseNotGivenQuestionType,
  WordFormationQuestion,
  WordGapQuestion,
} from '@/types/test.type'
import { useEffect, useRef, useState } from 'react'
import {
  Matching,
  MatchingLettersDragDrop,
  MultipleChoiceMultipleAnswers,
  ParagraphOrdering,
  ReadingComprehension,
  ReadingMultipleChoiceQuestion,
  SentenceTransformation,
  WordFormation,
  WordGap,
} from './index'

interface ReadingQuestionGroupProps {
  group: ReadingQuestionGroupType & { sequentialQuestionMap?: Map<string, number> }
  onAnswerChange: (questionId: string, answer: unknown) => void
  isReadOnly?: boolean
  currentQuestion?: number
  answers?: Record<string, unknown>
}

export default function ReadingQuestionGroup({
  group,
  onAnswerChange,
  isReadOnly = false,
  currentQuestion,
  answers,
}: ReadingQuestionGroupProps) {
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const [localAnswers, setLocalAnswers] = useState<Record<string, unknown>>(answers || {})

  useEffect(() => {
    // Keep local answers in sync with global answers from parent
    if (answers) setLocalAnswers(answers)
  }, [answers])

  useEffect(() => {
    // Chỉ scroll khi currentQuestion được chỉ định rõ ràng
    if (currentQuestion && questionRefs.current[currentQuestion]) {
      console.log(`Scrolling to question ${currentQuestion}`)
      // Thêm delay nhỏ để đảm bảo DOM đã render
      setTimeout(() => {
        questionRefs.current[currentQuestion]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center', // Changed from 'start' to 'center' to avoid header overlap
        })
      }, 100)
    }
  }, [currentQuestion])

  const setQuestionRef = (questionNumber: number) => (el: HTMLDivElement | null) => {
    questionRefs.current[questionNumber] = el
  }

  const handleLocalAnswerChange = (questionId: string, answer: unknown) => {
    console.log('Local answer change:', { questionId, answer }) // Debug log
    setLocalAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: answer }
      console.log('New local answers:', newAnswers) // Debug log
      return newAnswers
    })
    onAnswerChange(questionId, answer)
  }

  console.log('ReadingQuestionGroup switch case for questionType:', group.questionType)

  switch (group.questionType) {
    case 'matching': {
      // Find the question that has the passages and questions data
      const matchingQuestionWithData = group.questions.find(q => (q as MatchingQuestion).passages) as MatchingQuestion

      if (!matchingQuestionWithData) {
        // If no question has passages data, return empty div
        return <div ref={setQuestionRef(group.questions[0].questionNumber)} />
      }

      return (
        <div ref={setQuestionRef(group.questions[0].questionNumber)}>
          <Matching
            questionRange={matchingQuestionWithData.questionRange}
            instructions={matchingQuestionWithData.instructions}
            passages={matchingQuestionWithData.passages}
            questions={matchingQuestionWithData.questions}
            onAnswerChange={(questionId: number, value: string) => {
              // Find the corresponding question in group.questions and use its ID
              const correspondingQuestion = group.questions.find(q => q.questionNumber === questionId)
              if (correspondingQuestion) {
                handleLocalAnswerChange(correspondingQuestion.id, value)
              }
            }}
            selectedAnswers={matchingQuestionWithData.questions.reduce((acc, question) => {
              // Find the corresponding question in group.questions
              const correspondingQuestion = group.questions.find(q => q.questionNumber === question.id)
              return {
                ...acc,
                [question.id]: correspondingQuestion ? (answers || localAnswers)[correspondingQuestion.id] || '' : '',
              }
            }, {})}
          />
        </div>
      )
    }

    case 'matching_letters': {
      const groupData = group as ReadingQuestionGroupType & {
        answers?: string[]
        letters?: string[]
      }

      return (
        <div ref={setQuestionRef(group.questions[0].questionNumber)}>
          <MatchingLettersDragDrop
            questionRange={(() => {
              // Check if we have sequential mapping available
              if (group.sequentialQuestionMap && group.questions.length > 0) {
                const firstSequential = group.sequentialQuestionMap.get(group.questions[0].id)
                const lastSequential = group.sequentialQuestionMap.get(group.questions[group.questions.length - 1].id)
                if (firstSequential && lastSequential) {
                  return `Questions ${firstSequential}-${lastSequential}`
                }
              }
              // Fallback to original question numbers
              return `Questions ${group.questions[0]?.questionNumber}-${group.questions[group.questions.length - 1]?.questionNumber}`
            })()}
            instructions={
              typeof group.titleDoc === 'object' && group.titleDoc
                ? // Extract text from TipTap JSON
                  JSON.stringify(group.titleDoc)
                    .replace(/[{}"\[\]]/g, '')
                    .replace(/type:|text:|content:/g, '')
                    .replace(/paragraph|hardBreak/g, '')
                : group.title || 'Match each statement with the correct option.'
            }
            answers={groupData.answers || []}
            letters={groupData.letters || []}
            questions={group.questions.map(q => {
              // Use sequential number if available, otherwise use original
              const sequentialOrder = group.sequentialQuestionMap?.get(q.id)
              return {
                id: q.id,
                order: sequentialOrder || (q as unknown as { order: number }).order || q.questionNumber,
              }
            })}
            onAnswerChange={(questionId: string, value: string) => {
              handleLocalAnswerChange(questionId, value)
            }}
            selectedAnswers={group.questions.reduce(
              (acc, q) => {
                acc[q.id] = ((answers || localAnswers)[q.id] as string) || ''
                return acc
              },
              {} as Record<string, string>,
            )}
            keepMatchingChoices={group.keep_matching_choices}
          />
        </div>
      )
    }

    case 'paragraph_ordering': {
      const q = group.questions[0] as ParagraphOrderingQuestion

      const selectedAnswers = group.questions.reduce(
        (acc, question) => {
          const answer = (answers || localAnswers)[question.id] as string | undefined
          if (typeof answer === 'string' && answer.trim() !== '') {
            acc[question.questionNumber] = answer
          }
          return acc
        },
        {} as Record<number, string>,
      )

      return (
        <div ref={setQuestionRef(q.questionNumber)}>
          <ParagraphOrdering
            questionRange={q.questionRange}
            instructions={q.instructions}
            passage={q.passage}
            paragraphOptions={q.paragraphOptions}
            gapPositions={q.gapPositions}
            onAnswerChange={(gapId: number, value: string) => {
              // Find the question that corresponds to this gap position
              const question = group.questions.find(q => q.questionNumber === gapId)
              if (question) {
                console.log('Paragraph ordering answer change:', {
                  questionId: question.id,
                  gapId,
                  value,
                  questionNumber: question.questionNumber,
                })
                handleLocalAnswerChange(question.id, value)
              }
            }}
            selectedAnswers={selectedAnswers}
          />
        </div>
      )
    }

    case 'reading_comprehension': {
      // Find the question that has the passage and questions data
      const readingQuestionWithData = group.questions.find(
        q => (q as ReadingComprehensionQuestion).passage,
      ) as ReadingComprehensionQuestion

      if (!readingQuestionWithData) {
        // If no question has passage data, return empty div
        return <div ref={setQuestionRef(group.questions[0].questionNumber)} />
      }

      return (
        <div ref={setQuestionRef(group.questions[0].questionNumber)}>
          <ReadingComprehension
            questionRange={readingQuestionWithData.questionRange}
            instructions={readingQuestionWithData.instructions}
            passage={readingQuestionWithData.passage}
            questions={readingQuestionWithData.questions}
            onAnswerChange={(questionId: number, value: string) => {
              // Find the corresponding question in group.questions and use its ID
              const correspondingQuestion = group.questions.find(q => q.questionNumber === questionId)
              if (correspondingQuestion) {
                handleLocalAnswerChange(correspondingQuestion.id, value)
              }
            }}
            selectedAnswers={readingQuestionWithData.questions.reduce((acc, question) => {
              // Find the corresponding question in group.questions
              const correspondingQuestion = group.questions.find(q => q.questionNumber === question.id)
              return {
                ...acc,
                [question.id]: correspondingQuestion
                  ? ((answers || localAnswers)[correspondingQuestion.id] as string) || ''
                  : '',
              }
            }, {})}
          />
        </div>
      )
    }

    case 'sentence_transformation': {
      // Find the question that has the questions data
      const sentenceQuestionWithData = group.questions.find(
        q => (q as SentenceTransformationQuestion).questions,
      ) as SentenceTransformationQuestion

      if (!sentenceQuestionWithData) {
        // If no question has questions data, return empty div
        return <div ref={setQuestionRef(group.questions[0].questionNumber)} />
      }

      return (
        <div ref={setQuestionRef(group.questions[0].questionNumber)}>
          <SentenceTransformation
            questionRange={sentenceQuestionWithData.questionRange}
            instructions={sentenceQuestionWithData.instructions}
            questions={sentenceQuestionWithData.questions}
            onAnswerChange={(questionId: number, value: string) => {
              // Find the corresponding question in group.questions and use its ID
              const correspondingQuestion = group.questions.find(q => q.questionNumber === questionId)
              if (correspondingQuestion) {
                handleLocalAnswerChange(correspondingQuestion.id, value)
              }
            }}
            answers={sentenceQuestionWithData.questions.reduce((acc, question) => {
              // Find the corresponding question in group.questions
              const correspondingQuestion = group.questions.find(q => q.questionNumber === question.id)
              return {
                ...acc,
                [question.id]: correspondingQuestion ? (answers || localAnswers)[correspondingQuestion.id] || '' : '',
              }
            }, {})}
          />
        </div>
      )
    }

    case 'word_formation': {
      // Find the question that has the content and keywords data
      const wordFormationQuestionWithData = group.questions.find(
        q => (q as WordFormationQuestion).content,
      ) as WordFormationQuestion

      if (!wordFormationQuestionWithData) {
        // If no question has content data, return empty div
        return <div ref={setQuestionRef(group.questions[0].questionNumber)} />
      }

      return (
        <div ref={setQuestionRef(group.questions[0].questionNumber)}>
          <WordFormation
            questionRange={wordFormationQuestionWithData.questionRange}
            instructions={wordFormationQuestionWithData.instructions}
            title={wordFormationQuestionWithData.title}
            content={wordFormationQuestionWithData.content}
            keywords={wordFormationQuestionWithData.keywords}
            onAnswerChange={(keywordId: number, value: string) => {
              // Find the corresponding question in group.questions and use its ID
              const correspondingQuestion = group.questions.find(q => q.questionNumber === keywordId)
              if (correspondingQuestion) {
                handleLocalAnswerChange(correspondingQuestion.id, value)
              }
            }}
            answers={wordFormationQuestionWithData.keywords.reduce((acc, keyword) => {
              // Find the corresponding question in group.questions
              const correspondingQuestion = group.questions.find(q => q.questionNumber === keyword.id)
              return {
                ...acc,
                [keyword.id]: correspondingQuestion ? (answers || localAnswers)[correspondingQuestion.id] || '' : '',
              }
            }, {})}
          />
        </div>
      )
    }

    case 'gap_fill_write_words': {
      console.log('Rendering WordGap component for questionType:', group.questionType)

      // Build number -> questionId map for inline gaps
      // For API data, need to extract gap numbers from content and map to questions by order
      let numberToId: Record<number, string> = {}

      if (
        (group.questionType === 'gap_fill_write_words' || group.questionType === 'word_gap') &&
        (group as ReadingQuestionGroupType).contentDoc
      ) {
        // Extract gap numbers from TipTap content
        const contentStr = JSON.stringify((group as ReadingQuestionGroupType).contentDoc)
        const gapMatches = contentStr.match(/\[(\d+)\]/g)
        if (gapMatches) {
          const gapNumbers = gapMatches.map(match => parseInt(match.slice(1, -1), 10)).sort((a, b) => a - b)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sortedQuestions = [...group.questions].sort((a: any, b: any) => a.order - b.order) // API data has order field

          console.log('Gap numbers from content:', gapNumbers)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          console.log(
            'Sorted questions:',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            sortedQuestions.map(q => ({ id: q.id, order: (q as any).order })),
          )

          // Map gap numbers directly to question IDs by order
          gapNumbers.forEach((gapNum, index) => {
            if (sortedQuestions[index]) {
              numberToId[gapNum] = sortedQuestions[index].id
            }
          })
        }
      } else {
        // Fallback to questionNumber for mock data
        numberToId = group.questions.reduce(
          (acc, q) => {
            acc[q.questionNumber] = q.id
            return acc
          },
          {} as Record<number, string>,
        )
      }

      // If group has TipTap contentDoc, render it with inline gaps; else fallback to existing content on the first question
      const q0 = group.questions[0] as WordGapQuestion
      return (
        <div ref={setQuestionRef(group.questions[0].questionNumber)}>
          <WordGap
            questionRange={q0.questionRange}
            instructions={q0.instructions}
            title={q0.title}
            content={q0.content}
            contentDoc={(group as ReadingQuestionGroupType).contentDoc}
            numberToId={numberToId}
            onAnswerChange={(gapId, value) => {
              const correspondingQuestion = group.questions.find(q => q.id === gapId)
              if (correspondingQuestion) {
                handleLocalAnswerChange(correspondingQuestion.id, value)
              }
            }}
            selectedAnswersById={group.questions.reduce(
              (acc, q) => {
                acc[q.id] = ((answers || localAnswers)[q.id] as string) || ''
                return acc
              },
              {} as Record<string, string>,
            )}
            answers={answers as Record<string, string> | undefined}
          />
        </div>
      )
    }

    case 'multiple_choice': {
      console.log('Reading MC - answers object:', answers || localAnswers)
      const firstQuestion = group.questions[0] as ReadingMultipleChoiceQuestionType
      return (
        <div className="space-y-6">
          {/* Instructions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">{firstQuestion.instructions}</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="mb-2">Choose the correct answer for each question from {firstQuestion.questionRange}</p>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-6">
            {group.questions.map(q => {
              const question = q as ReadingMultipleChoiceQuestionType
              return (
                <div key={question.id} ref={setQuestionRef(question.questionNumber)}>
                  <ReadingMultipleChoiceQuestion
                    questionNumber={question.questionNumber}
                    question={question.question}
                    options={question.options}
                    selectedAnswer={(() => {
                      const rawAnswer = (answers || localAnswers)[question.id]
                      // Handle both string and array formats (API returns arrays)
                      let answer: string | undefined
                      if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
                        answer = String(rawAnswer[0])
                      } else if (typeof rawAnswer === 'string') {
                        answer = rawAnswer
                      }
                      console.log(`Reading MC Question ${question.id} selectedAnswer:`, { rawAnswer, answer })
                      return answer
                    })()}
                    onAnswerChange={answer => handleLocalAnswerChange(question.id, answer)}
                    isReadOnly={isReadOnly}
                    passageReference={question.passageReference}
                  />
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    case 'multiple_choice_multiple_answers': {
      // For this question type, we treat the entire group as one question with shared choices
      const groupTitle = typeof group.titleDoc === 'object' && group.titleDoc ? group.titleDoc : group.title
      const firstQuestion = group.questions[0] as MultipleChoiceMultipleAnswersQuestion
      
      // Compute display question range from remapped question numbers across parts
      const minQ = Math.min(...group.questions.map(q => q.questionNumber))
      const maxQ = Math.max(...group.questions.map(q => q.questionNumber))

      // Extract instructions from group title (rich text)
      let instructions = group.title || 'Choose the correct answers'
      let questionText = ''

      if (typeof groupTitle === 'object' && groupTitle) {
        // Parse rich text to extract instructions and question
        const extractText = (node: unknown): string => {
          if (!node) return ''
          if (typeof node === 'string') return node
          if (Array.isArray(node)) return node.map(extractText).join('')
          if (typeof node === 'object') {
            const obj = node as { type?: string; text?: string; content?: unknown[] }
            if (obj.type === 'text' && obj.text) return obj.text
            if (obj.type === 'hardBreak') return '\n'
            if (obj.content) return obj.content.map(extractText).join('')
          }
          return ''
        }

        const fullText = extractText(groupTitle)
        const lines = fullText.split('\n').filter(line => line.trim())
        if (lines.length >= 2) {
          instructions = lines[0] || instructions
          questionText = lines[1] || questionText
        } else {
          instructions = fullText || instructions
        }
      }

      // Map option IDs to question IDs - use cyclic mapping to handle more options than questions
      const optionToQuestionMap = new Map<string, string>()
      if (firstQuestion?.options) {
        // Sort options and questions by their IDs and order respectively
        const sortedOptions = [...firstQuestion.options].sort((a, b) => a.id.localeCompare(b.id))
        const sortedQuestions = [...group.questions].sort((a, b) => a.questionNumber - b.questionNumber)

        if (sortedQuestions.length > 0) {
          sortedOptions.forEach((option, index) => {
            // Use cyclic mapping: if more options than questions, cycle back to first question
            const questionIndex = index % sortedQuestions.length
            const mappedQuestion = sortedQuestions[questionIndex]
            optionToQuestionMap.set(option.id, mappedQuestion.id)
            console.log(`MCMA: Option ${option.id} → Question ${mappedQuestion.id} (cyclic index: ${questionIndex})`)
          })
        }
      }

      console.log('MCMA: optionToQuestionMap:', optionToQuestionMap)

      // Create selectedAnswers object by mapping question answers to option IDs
      const selectedAnswersObj = {
        [group.id]: [] as string[],
      }

      // For each question in the group, check if it has an answer and map it back to option ID
      if (firstQuestion?.options) {
        group.questions.forEach(q => {
          const rawAnswer = (answers || localAnswers)[q.id]
          // Handle both string and array formats (API returns arrays)
          let answer: string | undefined
          if (Array.isArray(rawAnswer) && rawAnswer.length > 0) {
            answer = String(rawAnswer[0])
          } else if (typeof rawAnswer === 'string') {
            answer = rawAnswer
          }

          // If this question has an answer, add the corresponding option ID to selectedAnswers
          if (answer && answer.trim() !== '') {
            // Find the option that corresponds to this answer
            const matchingOption = firstQuestion.options.find(option => option.id === answer)
            if (matchingOption && !selectedAnswersObj[group.id].includes(answer)) {
              selectedAnswersObj[group.id].push(answer)
            }
          }
        })
      }

      console.log(
        'MCMA selectedAnswersObj reconstructed:',
        selectedAnswersObj,
        'from answers:',
        answers || localAnswers,
      )

      return (
        <div ref={setQuestionRef(group.questions[0]?.questionNumber || 1)}>
          <MultipleChoiceMultipleAnswers
            // Always show the range based on the current group's questionNumbers (mapped across parts)
            questionRange={`Questions ${minQ}${minQ !== maxQ ? ` - ${maxQ}` : ''}`}
            instructions={instructions}
            questions={[
              {
                id: group.id, // Use group ID for this single compound question
                questionNumber: group.questions[0]?.questionNumber || 1,
                question: questionText,
                options: firstQuestion?.options || [],
                maxAnswers: firstQuestion?.maxAnswers,
                minAnswers: firstQuestion?.minAnswers,
              },
            ]}
            selectedAnswers={selectedAnswersObj}
            onAnswerChange={(questionId: string, selectedOptions: string[]) => {
              console.log('🔥 MCMA onAnswerChange called:', { questionId, selectedOptions })
              console.log('🔥 Current optionToQuestionMap:', optionToQuestionMap)
              console.log(
                '🔥 Group questions:',
                group.questions.map(q => ({ id: q.id, number: q.questionNumber })),
              )

              // Tạo một bản sao của options để tránh bị thay đổi
              const optionsCopy = [...selectedOptions]

              // Map các option đã chọn vào các question tương ứng
              const questionToOptionMap = new Map<string, string>()

              // Lưu các question đã có option được chọn
              const assignedQuestions = new Set<string>()

              // Sắp xếp các option đã chọn theo thứ tự alphabet (A < B < C < D < E)
              const sortedSelectedOptions = [...optionsCopy].sort((a, b) => a.localeCompare(b))
              const sortedQuestions = [...group.questions].sort((a, b) => a.questionNumber - b.questionNumber)

              console.log(`MCMA: Sorted selected options:`, sortedSelectedOptions)
              console.log(
                `MCMA: Sorted questions:`,
                sortedQuestions.map(q => ({ id: q.id, number: q.questionNumber })),
              )

              // Map các option đã sắp xếp vào các question theo thứ tự
              sortedSelectedOptions.forEach((optionId, index) => {
                if (sortedQuestions[index]) {
                  const questionId = sortedQuestions[index].id
                  questionToOptionMap.set(questionId, optionId)
                  assignedQuestions.add(questionId)
                  console.log(`MCMA: ✓ Mapping option ${optionId} to question ${questionId} (index: ${index})`)
                } else {
                  console.log(`MCMA: ✗ No question available for option ${optionId} at index ${index}`)
                }
              })

              // Cập nhật answers cho các questions có option được chọn
              console.log('🔥 Before updating - current answers state:', answers || localAnswers)

              // Cập nhật lại answers cho các option được chọn
              console.log('🔥 questionToOptionMap final:', questionToOptionMap)
              questionToOptionMap.forEach((optionId, questionId) => {
                console.log(`🔥 Setting answer for question ${questionId} to:`, optionId)
                handleLocalAnswerChange(questionId, optionId)
              })
            }}
            isReadOnly={isReadOnly}
          />
        </div>
      )
    }

    case 'true_false_not_given': {
      return (
        <div className="space-y-4 text-[13px]">
          {/* Questions */}
          <div className="space-y-3">
            {group.questions.map(q => {
              const question = q as TrueFalseNotGivenQuestionType
              return (
                <div
                  key={question.id}
                  ref={setQuestionRef(question.questionNumber)}
                  className="bg-white border border-gray-200 rounded-md p-3">
                  <div className="flex items-start space-x-3">
                    <span className="font-bold text-gray-700 mt-1 text-[13px]">{question.questionNumber}.</span>
                    <div className="flex-1">
                      <p className="text-gray-800 mb-2 leading-relaxed">{question.statement}</p>
                      <select
                        value={((answers || localAnswers)[question.id] as string) || ''}
                        onChange={e => handleLocalAnswerChange(question.id, e.target.value)}
                        disabled={isReadOnly}
                        className="form-select w-full max-w-[200px] px-2.5 py-1.5 text-[13px] border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white transition-colors">
                        <option value="" disabled>
                          Select answer
                        </option>
                        <option value="T">T</option>
                        <option value="F">F</option>
                        <option value="NG">NG</option>
                      </select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )
    }

    default:
      return null
  }
}
