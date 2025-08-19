import { appConfig } from '@/configs/appConfigs.config'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const tokenKey = 'directus_session_token'

// Helper function to handle 401 errors consistently
const handleApiError = (response: Response, context: string) => {
  if (response.status === 401) {
    return NextResponse.json({ success: false, error: 'Unauthorized', requiresLogin: true }, { status: 401 })
  }

  if (!response.ok) {
    return NextResponse.json({ success: false, error: `Failed to ${context}` }, { status: response.status })
  }

  return null
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(tokenKey)?.value

    if (!token) {
      return NextResponse.json({ success: false, error: 'No token found', requiresLogin: true }, { status: 401 })
    }

    // Get current user first
    const userResponse = await fetch(`${appConfig.directusUrl}users/me`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    const errorResponse = handleApiError(userResponse, 'fetch user data')
    if (errorResponse) return errorResponse

    const userData = await userResponse.json()
    const userId = userData.data.id

    // Get user's classes through classes_translations_directus_users (same as tests API)
    const classesResponse = await fetch(
      `${appConfig.directusUrl}items/classes_translations_directus_users?filter[directus_users_id][_eq]=${userId}&fields=*,classes_translations_id.id,classes_translations_id.test_groups.test_groups_id.*,classes_translations_id.test_groups.test_groups_id.tests.tests_id.*`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    const classesErrorResponse = handleApiError(classesResponse, 'fetch user classes')
    if (classesErrorResponse) return classesErrorResponse

    const classesData = await classesResponse.json()

    // Also try to get test groups directly to see if they exist
    const directTestGroupsResponse = await fetch(
      `${appConfig.directusUrl}items/test_groups?fields=*,tests.tests_id.*`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      },
    )

    if (directTestGroupsResponse.ok) {
      const directTestGroupsData = await directTestGroupsResponse.json()
    }

    // Extract test groups from user's classes
    interface UserTestGroupData {
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

    const userTestGroups: UserTestGroupData[] = []
    const testGroupIds = new Set() // To avoid duplicates

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
        test_groups: Array<{
          test_groups_id: TestGroupData
        }>
      }
    }

    classesData.data.forEach((enrollment: EnrollmentData) => {
      const classTranslation = enrollment.classes_translations_id

      if (classTranslation && classTranslation.test_groups) {
        classTranslation.test_groups.forEach((testGroupLink: { test_groups_id: TestGroupData }) => {
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
              name: testGroup.name,
              status: testGroup.status,
              is_practice_test: testGroup.is_practice_test || false,
              tests: tests,
              classId: classTranslation.id,
              totalTests: tests.length,
              completedTests: 0, // Will be calculated below
            })
          }
        })
      }
    })

    // Get completion status for each test group
    for (const testGroup of userTestGroups) {
      let completedCount = 0

      for (const test of testGroup.tests) {
        try {
          // Check if test is completed by looking at results
          const resultsResponse = await fetch(
            `${appConfig.directusUrl}items/results?filter[student][_eq]=${userId}&filter[test][_eq]=${test.id}`,
            {
              method: 'GET',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            },
          )

          if (resultsResponse.ok) {
            const resultsData = await resultsResponse.json()
            if (resultsData.data && resultsData.data.length > 0) {
              completedCount++
            }
          }
        } catch (error) {
          console.error(`Error fetching results for test ${test.id}:`, error)
        }
      }

      testGroup.completedTests = completedCount
    }

    return NextResponse.json({
      success: true,
      data: userTestGroups,
    })
  } catch (error) {
    console.error('Test Groups API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
