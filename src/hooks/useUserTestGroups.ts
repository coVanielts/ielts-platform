import { initializeDirectus } from '@/libs/directus'
import { Tests } from '@/types/collections.type'
import { readItems, readMe } from '@directus/sdk'
import { useQuery } from 'react-query'

export interface UserTestGroup {
  id: string
  name: string
  status: string
  is_practice_test: boolean
  tests: Array<{
    id: string
    name: string
    type: string
    date_created: string
    due_date: string
    time_limit: number
    is_practice_test: boolean
  }>
  classId?: number
  totalTests: number
  completedTests: number
}

async function fetchUserTestGroups(): Promise<UserTestGroup[]> {
  try {
    const directus = await initializeDirectus()

    // Get current user
    const currentUser = await directus.request(readMe())
    const userId = currentUser.id

    // Get user's classes and their test groups
    const userClasses = await directus.request(
      readItems('classes_translations_directus_users', {
        filter: {
          directus_users_id: {
            _eq: userId,
          },
        },
        fields: [
          '*',
          {
            classes_translations_id: [
              'id',
              {
                classes_id: [
                  'id',
                  {
                    test_groups: [
                      {
                        test_groups_id: [
                          '*',
                          {
                            tests: [
                              {
                                tests_id: ['*'],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      }),
    )

    // Process the data to extract test groups
    const userTestGroups: UserTestGroup[] = []
    const testGroupIds = new Set<string>()

    interface TestGroupData {
      id: string
      name: string
      status: string
      is_practice_test: boolean
      tests: Array<{
        tests_id: {
          id: string
          name: string
          type: string
          date_created: string
          due_date: string
          time_limit: number
          is_practice_test: boolean
        }
      }>
    }

    interface EnrollmentData {
      classes_translations_id: {
        id: number
        classes_id: {
          id: number
          test_groups: Array<{
            test_groups_id: TestGroupData
          }>
        }
      }
    }

    userClasses.forEach((enrollment: unknown) => {
      const enrollmentData = enrollment as EnrollmentData
      const classTranslation = enrollmentData.classes_translations_id
      const classData = classTranslation?.classes_id
      if (classData?.test_groups) {
        classData.test_groups.forEach((testGroupLink: { test_groups_id: TestGroupData }) => {
          const testGroup = testGroupLink.test_groups_id
          if (testGroup && !testGroupIds.has(testGroup.id)) {
            testGroupIds.add(testGroup.id)

            const tests =
              testGroup.tests?.map(
                (testLink: {
                  tests_id: {
                    id: string
                    name: string
                    type: string
                    date_created: string
                    due_date: string
                    time_limit: number
                    is_practice_test: boolean
                  }
                }) => testLink.tests_id,
              ) || []

            userTestGroups.push({
              id: testGroup.id,
              name: testGroup.name ?? 'Unnamed Test Group',
              status: 'assigned',
              is_practice_test: testGroup.is_practice_test ?? false,
              classId: classTranslation.id,
              totalTests: tests.length,
              completedTests: 0,
              tests,
            })
          }
        })
      }
    })

    for (const testGroup of userTestGroups) {
      try {
        const dueDate = testGroup.tests.reduce((acc, test) => {
          if (test.due_date && new Date(test.due_date) < new Date(acc)) {
            return test.due_date
          }
          return acc
        }, new Date().toISOString())

        // Check if overdue
        if (dueDate && new Date(dueDate) < new Date()) {
          testGroup.status = 'overdue'
        }

        // Check results
        const results = await directus.request(
          readItems('results', {
            filter: {
              student: { _eq: userId },
              test: { _in: testGroup.tests.map(test => parseInt(test.id)) },
              test_group: { _eq: parseInt(testGroup.id) },
            },
            limit: 4,
          }),
        )

        if (results.length === testGroup.tests.length) {
          testGroup.status = 'completed'
        }

        const progress = await directus.request(
          readItems('tests_progress', {
            filter: {
              student: { _eq: userId },
              test: { _in: testGroup.tests.map(test => parseInt(test.id)) },
              test_group: { _eq: parseInt(testGroup.id) },
            },
            fields: ['id', 'test', { test: ['id', 'type'] }, 'remaining_time'],
            limit: 1,
          }),
        )

        const currentProgress = progress?.[0]
        if (currentProgress?.remaining_time) {
          const currentSkill = (currentProgress.test as Tests)?.type

          if (currentSkill === 'Listening') {
            testGroup.completedTests++
          }
          if (currentSkill === 'Reading') {
            testGroup.completedTests++
          }
          if (currentSkill === 'Writing') {
            testGroup.completedTests++
          }
          if (currentSkill === 'Speaking') {
            testGroup.completedTests++
          }

          testGroup.status = 'in_progress'
        }
      } catch (error) {
        console.error(`Error fetching progress/results for test ${testGroup.id}:`, error)
      }
    }

    return userTestGroups
  } catch (error) {
    console.error('Error fetching user test groups:', error)
    throw new Error('Failed to fetch test groups')
  }
}

export function useUserTestGroups() {
  return useQuery({
    queryKey: ['user-test-groups'],
    queryFn: fetchUserTestGroups,
  })
}
