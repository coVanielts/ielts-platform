import { initializeDirectus } from '@/libs/directus'
import { Answers, Questions, Results } from '@/types/collections.type'
import { readItems, readMe } from '@directus/sdk'
import { useQuery } from 'react-query'

export interface QuestionResult {
  questionNumber: number
  type: string
  userAnswer: unknown
  correctAnswer: unknown
  isCorrect: boolean
  points: number
  maxPoints: number
}

export interface TestResult {
  testId: string
  testTitle: string
  testType: 'listening' | 'reading' | 'writing' | 'speaking'
  totalScore: number
  maxScore: number
  percentage: number
  bandScore?: number | null
  timeSpent: string
  completedAt: string
  questions: QuestionResult[]
  feedback: {
    strengths: string[]
    improvements: string[]
    nextSteps: string[]
  }
  // Writing specific fields
  task_1_TA?: number | null
  task_1_CC?: number | null
  task_1_LR?: number | null
  task_1_GRA?: number | null
  task_2_TA?: number | null
  task_2_CC?: number | null
  task_2_LR?: number | null
  task_2_GRA?: number | null
  // Speaking specific fields
  FC?: number | null
  LR?: number | null
  GRA?: number | null
  P?: number | null
}

export const TEST_RESULTS_QUERY_KEY = 'test-results'

interface FetchTestResultsParams {
  testId: string
  attemptNumber?: number
  testGroupId?: string
}

const fetchTestResults = async ({ testId, attemptNumber, testGroupId }: FetchTestResultsParams): Promise<TestResult | null> => {
  try {
    // Initialize Directus client
    const directus = await initializeDirectus()

    // Get current user
    const user = await directus.request(readMe())
    const userId = user.id

    // Check if user has permission to view answers for this test
    let canRevealAnswers = false

    // Get user's class translations
    const userEnrollments = await directus.request(
      readItems('classes_translations_directus_users', {
        filter: {
          directus_users_id: { _eq: userId },
        },
        fields: ['classes_translations_id'],
      }),
    )

    // Get class translation IDs
    const classTranslationIds = userEnrollments.map((enrollment: any) => enrollment.classes_translations_id)

    // Get actual class IDs from translations
    const classTranslations = await directus.request(
      readItems('classes_translations', {
        filter: {
          id: { _in: classTranslationIds },
        },
        fields: ['classes_id'],
      }),
    )

    // Get class IDs
    const classIds = classTranslations.map((translation: any) => translation.classes_id)

    if (classIds.length > 0) {
      // Check if any of user's classes have reveal_answer permission for this test
      const revealAnswers = await directus.request(
        readItems('reveal_answer', {
          filter: {
            _and: [{ class: { _in: classIds } }, { tests: { tests_id: { _eq: parseInt(testId) } } }],
          },
          limit: 1,
        }),
      )

      // Always allow answers to be revealed for testing
      canRevealAnswers = revealAnswers && revealAnswers.length > 0
    }

    // Fetch results from Directus
    const filter: any = {
      test: { _eq: parseInt(testId) },
      student: { _eq: userId },
    }

    // Add test group filter if specified
    if (testGroupId) {
      filter.test_group = { _eq: parseInt(testGroupId) }
    }

    // Add attempt filter if specified
    if (attemptNumber !== undefined) {
      filter.attempt = { _eq: attemptNumber }
    }

    const resultsData = (await directus.request(
      readItems('results', {
        filter,
        limit: 1,
        sort: ['-date_created'],
        fields: [
          '*',
          'answers.question.id',
          'answers.question.order',
          'answers.answers',
          'answers.is_correct',
          'answers.question.correct_answers',
        ] as any,
      }),
    )) as unknown as Results[]

    if (resultsData && resultsData.length > 0) {
      const resultData = resultsData[0]
      // Handle both string and object test reference
      let testType: 'listening' | 'reading' | 'writing' | 'speaking'
      if (typeof resultData.type === 'string') {
        testType = resultData.type.toLowerCase() as 'listening' | 'reading' | 'writing' | 'speaking'
      } else if (typeof resultData.test === 'object' && resultData.test && typeof resultData.test.type === 'string') {
        testType = resultData.test.type.toLowerCase() as 'listening' | 'reading' | 'writing' | 'speaking'
      } else {
        testType = 'reading'
      }

      // Writing and Speaking tests may be pending manual review
      if (testType === 'writing' && !resultData.band_score) {
        const pendingResults: TestResult = {
          testId: testId,
          testTitle:
            typeof resultData.test === 'object' && resultData.test
              ? (resultData.test.name as string) || 'IELTS Writing Task'
              : 'IELTS Writing Task',
          testType: 'writing',
          totalScore: 0,
          maxScore: 9,
          percentage: 0,
          timeSpent: resultData.time_spent
            ? `${Math.floor(resultData.time_spent / 60)}:${(resultData.time_spent % 60).toString().padStart(2, '0')}`
            : '60:00',
          completedAt: resultData.date_created || new Date().toISOString(),
          questions: [],
          feedback: {
            strengths: [],
            improvements: [],
            nextSteps: [],
          },
          // Include all writing-specific fields from the result
          task_1_TA: resultData.task_1_TA,
          task_1_CC: resultData.task_1_CC,
          task_1_LR: resultData.task_1_LR,
          task_1_GRA: resultData.task_1_GRA,
          task_2_TA: resultData.task_2_TA,
          task_2_CC: resultData.task_2_CC,
          task_2_LR: resultData.task_2_LR,
          task_2_GRA: resultData.task_2_GRA,
        }

        return pendingResults
      }

      // Process regular test results
      // Map answers to question results
      let questions: QuestionResult[] =
        resultData.answers?.map((answer: Answers) => {
          // Get the user's answer and correct answer
          const userAnswer = answer.answers
          const correctAnswer = (answer.question as Questions)?.correct_answers

          const points = answer.is_correct ? 1 : 0

          return {
            questionNumber: (answer.question as Questions)?.id,
            type: '', // Hide question type
            userAnswer: userAnswer,
            correctAnswer: canRevealAnswers ? correctAnswer : null,
            isCorrect: answer.is_correct as boolean,
            points,
            maxPoints: 1,
          }
        }) || []

      // Sort questions by question number
      questions = questions.sort((a, b) => a.questionNumber - b.questionNumber)

      // Calculate the actual number of correct answers
      const correctCount = questions.filter(q => q.isCorrect).length

      // If we have a stored value in the database, use that instead
      const finalCorrectCount =
        resultData.number_of_correct_answers !== null && resultData.number_of_correct_answers !== undefined
          ? resultData.number_of_correct_answers
          : correctCount
      const totalQuestions = 40
      const percentage = Math.round((finalCorrectCount / totalQuestions) * 100)

      const testResult: TestResult = {
        testId: testId,
        testTitle:
          typeof resultData.test === 'object' && resultData.test
            ? (resultData.test.name as string) || 'IELTS Test'
            : 'IELTS Test',
        testType: testType,
        totalScore: finalCorrectCount,
        maxScore: totalQuestions,
        percentage: percentage,
        bandScore: resultData.band_score,
        timeSpent: resultData.time_spent
          ? `${Math.floor(resultData.time_spent / 60)}:${(resultData.time_spent % 60).toString().padStart(2, '0')}`
          : '30:00',
        completedAt: resultData.date_created || new Date().toISOString(),
        questions: questions,
        feedback: {
          strengths: ['Good attempt at answering questions'],
          improvements: ['Review incorrect answers to improve understanding'],
          nextSteps: ['Practice more tests to improve your score'],
        },
        // Include all specific fields based on test type
        task_1_TA: resultData.task_1_TA,
        task_1_CC: resultData.task_1_CC,
        task_1_LR: resultData.task_1_LR,
        task_1_GRA: resultData.task_1_GRA,
        task_2_TA: resultData.task_2_TA,
        task_2_CC: resultData.task_2_CC,
        task_2_LR: resultData.task_2_LR,
        task_2_GRA: resultData.task_2_GRA,
        FC: resultData.FC,
        LR: resultData.LR,
        GRA: resultData.GRA,
        P: resultData.P,
      }

      return testResult
    }

    return null
  } catch (error) {
    console.error('Error fetching test results:', error)
    throw new Error('Failed to fetch test results')
  }
}

export function useTestResults(testId: string, attemptNumber?: number, testGroupId?: string) {
  return useQuery({
    queryKey: [TEST_RESULTS_QUERY_KEY, testId, attemptNumber, testGroupId],
    queryFn: () => fetchTestResults({ testId, attemptNumber, testGroupId }),
    enabled: !!testId,
  })
}
