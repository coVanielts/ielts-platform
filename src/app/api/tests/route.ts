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

    // Get user's classes through classes_translations_directus_users
    const classesResponse = await fetch(
      `${appConfig.directusUrl}items/classes_translations_directus_users?filter[directus_users_id][_eq]=${userId}&fields=*,classes_translations_id.id,classes_translations_id.tests.tests_id.*`,
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

    // Extract tests from user's classes
    interface UserTestData {
      id: string
      title: string
      type: string
      status: string
      assignedDate: string
      dueDate: string
      duration: number
      totalQuestions: number
      maxScore: number
      classId?: number
      score?: number
    }

    const userTests: UserTestData[] = []
    const testIds = new Set() // To avoid duplicates

    interface EnrollmentData {
      classes_translations_id: {
        id: number
        tests: Array<{
          tests_id: {
            id: string
            name: string
            type: string
            date_created: string
            due_date: string
            time_limit: number
          }
        }>
      }
    }

    classesData.data.forEach((enrollment: EnrollmentData) => {
      const classTranslation = enrollment.classes_translations_id
      if (classTranslation && classTranslation.tests) {
        classTranslation.tests.forEach(
          (testLink: {
            tests_id: {
              id: string
              name: string
              type: string
              date_created: string
              due_date: string
              time_limit: number
            }
          }) => {
            const test = testLink.tests_id
            if (test && !testIds.has(test.id)) {
              testIds.add(test.id)
              userTests.push({
                id: test.id,
                title: test.name,
                type: test.type || 'reading', // Default to reading if type is null
                status: 'assigned', // Default status, we'll need to check progress
                assignedDate: test.date_created,
                dueDate: test.due_date,
                duration: test.time_limit || 60,
                totalQuestions: 0, // We'll need to calculate this from test parts
                maxScore: 40, // Default, should be calculated
                classId: classTranslation.id,
              })
            }
          },
        )
      }
    })

    // Get progress for each test to determine status
    for (const test of userTests) {
      try {
        const progressResponse = await fetch(
          `${appConfig.directusUrl}items/tests_progress?filter[student][_eq]=${userId}&filter[test][_eq]=${test.id}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        )

        // Check if test is overdue
        if (test.dueDate && new Date(test.dueDate) < new Date() && test.status !== 'completed') {
          test.status = 'overdue'
        }

        if (progressResponse.ok) {
          const progressData = await progressResponse.json()

          if (progressData.data && progressData.data.length > 0) {
            const progress = progressData.data[0]
            if (progress.remaining_time !== null && progress.remaining_time < test.duration * 60) {
              test.status = 'in_progress'
            }
          }
        }

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
            const result = resultsData.data[0]
            test.status = 'completed'
            test.score = result.number_of_correct_answers || 0
          }
        }
      } catch (error) {
        console.error(`Error fetching progress/results for test ${test.id}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      data: userTests,
    })
  } catch (error) {
    console.error('Tests API error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}
