import { initializeDirectus } from '@/libs/directus'
import { readItems, readMe } from '@directus/sdk'
import { useQuery } from 'react-query'

export interface UserTest {
  id: string
  title: string
  type: 'listening' | 'reading' | 'writing' | 'speaking' | 'full'
  status: 'assigned' | 'in_progress' | 'completed' | 'overdue'
  assignedDate: string
  dueDate: string
  duration: number // in minutes
  totalQuestions: number
  score?: number
  maxScore: number
  classId?: number
}

export const USER_TESTS_QUERY_KEY = 'user-tests'

const fetchUserTests = async (): Promise<UserTest[]> => {
  try {
    const directus = await initializeDirectus()

    // Get current user
    const user = await directus.request(readMe())
    const userId = user.id

    // Get user's classes through classes_translations_directus_users
    const userEnrollments = await directus.request(
      readItems('classes_translations_directus_users', {
        filter: {
          directus_users_id: {
            _eq: userId,
          },
        },
      }),
    )

    // Get class translation IDs
    const classTranslationIds = userEnrollments.map(enrollment => enrollment.classes_translations_id)

    if (classTranslationIds.length === 0) {
      return []
    }

    // Get tests from these classes
    const classTests = await directus.request(
      readItems('classes_translations_tests', {
        filter: {
          classes_translations_id: {
            _in: classTranslationIds,
          },
        },
      }),
    )

    // Get unique test IDs
    const testIds = [
      ...new Set(classTests.map(ct => ct.tests_id).filter((id): id is number => id !== null && id !== undefined)),
    ]

    if (testIds.length === 0) {
      return []
    }

    // Get test details
    const tests = await directus.request(
      readItems('tests', {
        filter: {
          id: {
            _in: testIds,
          },
        },
      }),
    )

    // Helper function to normalize test type
    const normalizeTestType = (type: string | null | undefined): UserTest['type'] => {
      if (!type) return 'reading'

      const lowerType = type.toLowerCase()
      switch (lowerType) {
        case 'listening':
          return 'listening'
        case 'reading':
          return 'reading'
        case 'writing':
          return 'writing'
        case 'speaking':
          return 'speaking'
        case 'full':
          return 'full'
        default:
          return 'reading'
      }
    }

    // Convert to UserTest format
    const userTests: UserTest[] = tests.map(test => ({
      id: test.id.toString(),
      title: test.name || 'Untitled Test',
      type: normalizeTestType(test.type),
      status: 'assigned' as const,
      assignedDate: test.date_created || new Date().toISOString(),
      dueDate: test.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      duration: test.time_limit || 30,
      totalQuestions: 40,
      maxScore: 40,
    }))

    // Get progress and results for each test to determine status
    for (const test of userTests) {
      try {
        // Check if overdue
        if (test.dueDate && new Date(test.dueDate) < new Date() && test.status !== 'completed') {
          test.status = 'overdue'
        }

        // Check results
        const results = await directus.request(
          readItems('results', {
            filter: {
              student: { _eq: userId },
              test: { _eq: parseInt(test.id) },
              test_group: { _null: true },
            },
            limit: 1,
          }),
        )

        if (results.length > 0) {
          test.status = 'completed'
          test.score = results[0].number_of_correct_answers || 0
        }

        // Check progress
        const progress = await directus.request(
          readItems('tests_progress', {
            filter: {
              student: { _eq: userId },
              test: { _eq: parseInt(test.id) },
              test_group: { _null: true },
            },
            limit: 1,
          }),
        )

        if (progress.length > 0 && progress[0].remaining_time !== null && progress[0].remaining_time !== undefined) {
          if (progress[0].remaining_time < test.duration * 60) {
            test.status = 'in_progress'
          }
        }
      } catch (error) {
        console.error(`Error fetching progress/results for test ${test.id}:`, error)
      }
    }

    return userTests
  } catch (error) {
    console.error('Error fetching user tests:', error)
    throw new Error('Failed to fetch user tests')
  }
}

export function useUserTests() {
  return useQuery({
    queryKey: [USER_TESTS_QUERY_KEY],
    queryFn: fetchUserTests,
  })
}
