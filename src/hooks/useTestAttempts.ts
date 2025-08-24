import { initializeDirectus } from '@/libs/directus'
import { readItem, readItems, readMe } from '@directus/sdk'
import { useQuery } from 'react-query'

export interface TestAttempt {
  id: number
  attempt: number
  date_created: string
  time_spent: number | null
  score?: number
  band_score?: number
  number_of_correct_answers?: number
}

export interface TestInfo {
  id: number
  name: string
  tests?: any[]
  type?: string
  time_limit?: number
}

export interface MergedAttempt extends TestAttempt {
  mergedAttempts: TestAttempt[]
  totalTimeSpent: number
  averageScore?: number
  averageBandScore?: number
}

export interface TestAttemptsData {
  testInfo: TestInfo
  attempts: (TestAttempt | MergedAttempt)[]
}

// Fetch attempts for a single test
const fetchSingleTestAttempts = async (testId: string, userId: string) => {
  const directus = await initializeDirectus()

  // Fetch test info
  const testData = await directus.request(
    readItems('tests', {
      filter: {
        id: { _eq: parseInt(testId) },
      },
      fields: ['id', 'name', 'type', 'time_limit'],
    }),
  )

  if (!testData || testData.length === 0) {
    throw new Error('Test not found')
  }

  const testInfo = testData[0] as TestInfo

  // Fetch results for this test
  const resultsData = await directus.request(
    readItems('results', {
      filter: {
        test: { _eq: parseInt(testId) },
        student: { _eq: userId },
      },
      sort: ['-date_created'],
      fields: ['id', 'attempt', 'date_created', 'time_spent', 'band_score', 'number_of_correct_answers'],
    }),
  )

  return {
    testInfo,
    attempts: resultsData as TestAttempt[],
  }
}

// Fetch attempts for a test group (full test)
const fetchTestGroupAttempts = async (testGroupId: string, userId: string) => {
  const directus = await initializeDirectus()

  // Fetch test group info
  const testData = await directus.request(
    readItem('test_groups', parseInt(testGroupId), {
      fields: ['id', 'name', 'tests'],
    }),
  )

  if (!testData) {
    throw new Error('Test group not found')
  }

  const testInfo = testData as TestInfo

  // Fetch results for this test group
  const resultsData = await directus.request(
    readItems('results', {
      filter: {
        test_group: { _eq: parseInt(testGroupId) },
        student: { _eq: userId },
      },
      sort: ['-date_created'],
      fields: ['id', 'attempt', 'date_created', 'time_spent', 'band_score', 'number_of_correct_answers'],
    }),
  )

  const attempts = resultsData as TestAttempt[]

  // Merge attempts by attempt number for full tests
  const mergedAttempts: MergedAttempt[] = []
  const attemptGroups = new Map<number, TestAttempt[]>()

  // Group attempts by attempt number
  attempts.forEach((attempt) => {
    const attemptNumber = attempt.attempt || 1
    if (!attemptGroups.has(attemptNumber)) {
      attemptGroups.set(attemptNumber, [])
    }
    attemptGroups.get(attemptNumber)!.push(attempt)
  })

  // Merge each group
  attemptGroups.forEach((groupAttempts, attemptNumber) => {
    if (groupAttempts.length === 1) {
      // Single attempt, no merging needed
      const attempt = groupAttempts[0]
      mergedAttempts.push({
        ...attempt,
        mergedAttempts: [attempt],
        totalTimeSpent: attempt.time_spent || 0,
      })
    } else {
      // Multiple attempts for the same attempt number, merge them
      const totalTimeSpent = groupAttempts.reduce((sum, attempt) => sum + (attempt.time_spent || 0), 0)
      const scores = groupAttempts
        .map((attempt) => attempt.number_of_correct_answers)
        .filter((score) => score !== undefined)
      const bandScores = groupAttempts
        .map((attempt) => attempt.band_score)
        .filter((score) => score !== undefined)

      const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score!, 0) / scores.length : undefined
      const averageBandScore = bandScores.length > 0 ? bandScores.reduce((sum, score) => sum + score!, 0) / bandScores.length : undefined

      // Use the most recent attempt as the base
      const baseAttempt = groupAttempts[0]

      mergedAttempts.push({
        ...baseAttempt,
        mergedAttempts: groupAttempts,
        totalTimeSpent,
        averageScore,
        averageBandScore,
        // Use average scores for display
        number_of_correct_answers: averageScore,
        band_score: averageBandScore,
      })
    }
  })

  // Sort by attempt number (descending)
  mergedAttempts.sort((a, b) => (b.attempt || 0) - (a.attempt || 0))

  return {
    testInfo,
    attempts: mergedAttempts,
  }
}

export function useTestAttempts(testId: string, isTestGroup = false) {
  return useQuery<TestAttemptsData, Error>({
    queryKey: ['test-attempts', testId, isTestGroup],
    queryFn: async () => {
      const directus = await initializeDirectus()
      const user = await directus.request(readMe())
      const userId = user.id

      if (isTestGroup) {
        return fetchTestGroupAttempts(testId, userId)
      } else {
        return fetchSingleTestAttempts(testId, userId)
      }
    },
    enabled: !!testId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
