import { initializeDirectus } from '@/libs/directus'
import { handleDirectusError } from '@/utils/auth-error.utils'
import { createItem, readItems } from '@directus/sdk'
import { useMutation, UseMutationOptions } from 'react-query'

type CreateResultParams = {
  testId: number
  studentId: string
  attempt: number
  timeSpentSeconds?: number
  type?: string
}

async function createResult({ testId, studentId, attempt, timeSpentSeconds, type }: CreateResultParams) {
  try {
    const directus = await initializeDirectus()

    // Get answers for this attempt
    const answers = await directus.request(
      readItems('answers', {
        filter: {
          test: { _eq: testId },
          student: { _eq: studentId },
          attempt: { _eq: attempt },
        },
        fields: ['id'],
      }),
    )

    // Create the result with answers linked
    const created = await directus.request(
      createItem('results', {
        test: testId,
        student: studentId,
        attempt,
        time_spent: timeSpentSeconds ?? null,
        type: type ? type.charAt(0).toUpperCase() + type.slice(1) : null,
        answers: answers.map(answer => answer.id),
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
