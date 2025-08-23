import { initializeDirectus } from '@/libs/directus'
import { handleDirectusError } from '@/utils/auth-error.utils'
import { createItem, readItem, readItems, readMe } from '@directus/sdk'
import { useMutation, UseMutationOptions } from 'react-query'

type CreateResultParams = {
  testId: number
  studentId: string
  attempt: number
  timeSpentSeconds?: number
  type?: string
  testGroupId?: number
}

async function createResult({ testId, studentId, attempt, timeSpentSeconds, type, testGroupId }: CreateResultParams) {
  try {
    const directus = await initializeDirectus()

    const user = await directus.request(readMe())
    const userId = user.id

    // Get user's class translations
    const userEnrollments = await directus.request(
      readItems('classes_translations_directus_users', {
        filter: { directus_users_id: userId },
        fields: ['classes_translations_id'],
      }),
    )

    const testEnrollments = await directus.request(
      readItems('classes_translations_tests', {
        filter: {
          _and: [
            {
              classes_translations_id: {
                _in: userEnrollments.map(enrollment => enrollment.classes_translations_id),
              },
            },
            { tests_id: { _eq: testId } },
          ],
        },
        fields: ['classes_translations_id'],
      }),
    )

    const classTranslationId = testEnrollments?.[0]?.classes_translations_id as number

    const classTranslations = await directus.request(
      readItem('classes_translations', classTranslationId, {
        fields: ['classes_id'],
      }),
    )

    const classId = classTranslations.classes_id

    // Get answers for this attempt
    const answers = await directus.request(
      readItems('answers', {
        filter: {
          test: { _eq: testId },
          student: { _eq: studentId },
          attempt: { _eq: attempt },
          ...(testGroupId ? { test_group: { _eq: testGroupId } } : {}),
        },
        fields: ['id'],
      }),
    )

    // Create the result with answers linked
    const created = await directus.request(
      createItem('results', {
        test: testId,
        student: studentId,
        test_group: testGroupId,
        attempt,
        time_spent: timeSpentSeconds ?? null,
        type: type ? type.charAt(0).toUpperCase() + type.slice(1) : null,
        answers: answers.map(answer => answer.id),
        class: classId,
      }),
    )
    return { id: (created as any)?.id as number }
  } catch (error) {
    handleDirectusError(error)
    throw error
  }
}

export const useCreateResult = (options?: UseMutationOptions<{ id: number }, Error, CreateResultParams>) =>
  useMutation({ mutationFn: createResult, ...options })
