import { ListeningQuestionGroup as ListeningQuestionGroupType } from '@/types/listening.type'
import React, { useEffect, useRef, useState } from 'react'
import ListeningMapLabeling from './ListeningMapLabeling'
import { ListeningMatching } from './ListeningMatching'
import ListeningMatchingLettersDragDrop from './ListeningMatchingLettersDragDrop'
import { ListeningMultipleChoice } from './ListeningMultipleChoice'
import ListeningMultipleChoiceMultipleAnswers from './ListeningMultipleChoiceMultipleAnswers'
import ListeningTrueFalseNotGiven from './ListeningTrueFalseNotGiven'
import { ListeningWordGap } from './ListeningWordGap'

interface ListeningQuestionGroupProps {
  group: ListeningQuestionGroupType
  onAnswerChange: (questionId: string, answer: unknown) => void
  isReadOnly?: boolean
  currentQuestion?: number
  answers?: Record<string, unknown>
}

export const ListeningQuestionGroup: React.FC<ListeningQuestionGroupProps> = ({
  group,
  onAnswerChange,
  isReadOnly = false,
  currentQuestion,
  answers,
}) => {
  const questionRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})
  const [localAnswers, setLocalAnswers] = useState<Record<string, unknown>>(answers || {})

  useEffect(() => {
    // Keep local answers in sync with global answers from parent
    // Only update if there are actual changes to prevent unnecessary re-renders
    if (answers) {
      setLocalAnswers(prev => {
        const hasChanges = Object.keys(answers).some(key => prev[key] !== answers[key]) ||
                          Object.keys(prev).some(key => !(key in answers))
        
        if (hasChanges) {
          return answers
        }
        return prev
      })
    }
  }, [answers])

  useEffect(() => {
    if (currentQuestion && questionRefs.current[currentQuestion]) {
      questionRefs.current[currentQuestion]?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' // Changed from 'start' to 'center' to avoid header overlap
      })
    }
  }, [currentQuestion])

  const setQuestionRef = (questionNumber: number) => (el: HTMLDivElement | null) => {
    questionRefs.current[questionNumber] = el
  }

  const handleLocalAnswerChange = (questionId: string, answer: unknown) => {
    setLocalAnswers(prev => {
      const newAnswers = { ...prev, [questionId]: answer }
      return newAnswers
    })
    onAnswerChange(questionId, answer)
  }

  switch (group.questionType) {
    case 'multiple_choice': {
      const questions = group.questions.filter(q => q.type === 'multiple_choice')
      if (questions.length === 0) return null

      // Group questions by extract
      const extractGroups = questions.reduce(
        (acc, q) => {
          const extractId = q.extract?.id || 'no-extract'
          if (!acc[extractId]) {
            acc[extractId] = {
              extract: q.extract,
              questions: [],
            }
          }
          acc[extractId].questions.push(q)
          return acc
        },
        {} as Record<string | number, { extract?: { id: number; context: string }; questions: typeof questions }>,
      )

      return (
        <div>
          {Object.values(extractGroups).map((extractGroup, index) => (
            <div key={index} ref={setQuestionRef(extractGroup.questions[0].questionNumber)}>
              <ListeningMultipleChoice
                questionRange={group.questionRange || ''}
                instructions={group.title || group.instructions || group.instruction}
                extract={extractGroup.extract}
                questions={extractGroup.questions}
                onAnswerChange={handleLocalAnswerChange}
                isReadOnly={isReadOnly}
                selectedAnswers={(answers || localAnswers) as Record<string, string>}
              />
            </div>
          ))}
        </div>
      )
    }

    case 'gap_fill_write_words': {
      const questions = group.questions.filter(q => q.type === 'gap_fill_write_words')
      if (questions.length === 0) return null

      return (
        <div ref={setQuestionRef(questions[0].questionNumber)}>
          <ListeningWordGap
            questionRange={group.questionRange || ''}
            instructions={group.title || group.instructions || group.instruction}
            questions={questions}
            onAnswerChange={handleLocalAnswerChange}
            isReadOnly={isReadOnly}
            content={group.content}
            selectedAnswers={(answers || localAnswers) as Record<string, string>}
          />
        </div>
      )
    }

    case 'matching': {
      const questions = group.questions.filter(q => q.type === 'matching')
      if (questions.length === 0) return null

      // Group questions by task
      const task1Questions = questions.filter(q => q.taskNumber === 1)
      const task2Questions = questions.filter(q => q.taskNumber === 2)

      return (
        <div ref={setQuestionRef(questions[0].questionNumber)}>
          <ListeningMatching
            task1Questions={task1Questions}
            task2Questions={task2Questions}
            onAnswerChange={handleLocalAnswerChange}
            isReadOnly={isReadOnly}
            selectedAnswers={(answers || localAnswers) as unknown as { [key: string]: string }}
          />
        </div>
      )
    }

    case 'matching_letters': {
      const questions = group.questions
      if (questions.length === 0) return null

      // Transform questions to match the component interface
      const transformedQuestions = questions.map((q, index) => ({
        id: q.id,
        order: q.questionNumber || index + 1,
      }))

      // Handle both API and mock data structures:
      // API structure: statements in 'answers' array, options in 'letters' array
      // Mock structure: statements in individual question 'statement' fields, options in 'letters' array

      let statements: string[] = []
      let letters: string[] = []

      if (group.answers && group.answers.length > 0) {
        // API data structure
        statements = group.answers
        letters = group.letters || []
      } else {
        // Mock data structure - extract statements from individual questions
        statements = questions
          .filter(q => q.type === 'matching_letters')
          .map(q => {
            const matchingQ = q as { statement?: string }
            return matchingQ.statement || ''
          })
          .filter(statement => statement)
        letters = group.letters || []
      }

      return (
        <div ref={setQuestionRef(questions[0].questionNumber)}>
          <ListeningMatchingLettersDragDrop
            questionRange={group.questionRange || ''}
            instructions={group.title || group.instructions || group.instruction}
            statements={statements}
            letters={letters}
            questions={transformedQuestions}
            selectedAnswers={(answers || localAnswers) as unknown as Record<string, string>}
            onAnswerChange={handleLocalAnswerChange}
            keepMatchingChoices={group.keep_matching_choices}
          />
        </div>
      )
    }

    case 'multiple_choice_multiple_answers': {
      const questions = group.questions.filter(q => q.type === 'multiple_choice_multiple_answers')
      if (questions.length === 0) return null

      // Transform questions to match the component interface
      const transformedQuestions = questions.map(q => ({
        id: q.id,
        questionNumber: q.questionNumber,
        question: q.question || '',
        extract: q.extract,
        options:
          q.options?.map(opt => ({
            id: opt.id,
            text: opt.text,
          })) || [],
        maxAnswers: q.maxAnswers,
        minAnswers: q.minAnswers,
      }))

      const handleMultipleAnswerChange = (questionId: string, selectedOptions: string[]) => {
        handleLocalAnswerChange(questionId, selectedOptions)
      }

      return (
        <div ref={setQuestionRef(questions[0].questionNumber)}>
          <ListeningMultipleChoiceMultipleAnswers
            questionRange={group.questionRange || ''}
            instructions={group.instructions || group.instruction}
            questions={transformedQuestions}
            selectedAnswers={(answers || localAnswers) as unknown as Record<string, string[]>}
            onAnswerChange={handleMultipleAnswerChange}
            isReadOnly={isReadOnly}
          />
        </div>
      )
    }

    case 'map_labeling': {
      const questions = group.questions.filter(q => q.type === 'map_labeling')
      if (questions.length === 0) return null

      // Transform questions to match the component interface
      const transformedQuestions = questions.map(q => ({
        id: q.id,
        questionNumber: q.questionNumber,
        label: q.label,
        description: q.description,
      }))

      // Get content, options, and images from the first question (assuming all share same content/options)
      const firstQuestion = questions[0]
      const content = firstQuestion.content
      const options = firstQuestion.options || []
      const mapDescription = firstQuestion.mapDescription
      const images = firstQuestion.images || []

      return (
        <div ref={setQuestionRef(questions[0].questionNumber)}>
          <ListeningMapLabeling
            questionRange={group.questionRange || ''}
            instructions={group.title || group.instructions || group.instruction}
            questions={transformedQuestions}
            options={options}
            selectedAnswers={(answers || localAnswers) as unknown as Record<string, string>}
            onAnswerChange={handleLocalAnswerChange}
            isReadOnly={isReadOnly}
            content={content}
            mapDescription={mapDescription}
            images={images}
          />
        </div>
      )
    }

    case 'true_false_not_given': {
      const questions = group.questions.filter(q => q.type === 'true_false_not_given')
      if (questions.length === 0) return null

      return (
        <div>
          {questions.map((question, index) => (
            <div key={question.id} ref={setQuestionRef(question.questionNumber)}>
              <ListeningTrueFalseNotGiven
                questionNumber={question.questionNumber}
                statement={question.statement || ''}
                selectedAnswer={localAnswers[question.id] as 'T' | 'F' | 'NG'}
                onAnswerChange={(answer) => handleLocalAnswerChange(question.id, answer)}
                isReadOnly={isReadOnly}
                instructions={group.title || group.instructions || group.instruction}
              />
            </div>
          ))}
        </div>
      )
    }

    default:
      return null
  }
}
