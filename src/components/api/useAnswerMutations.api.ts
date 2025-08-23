import { initializeDirectus } from '@/libs/directus'
import { handleDirectusError } from '@/utils/auth-error.utils'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { useMutation, UseMutationOptions, useQueryClient } from 'react-query'

type UpsertAnswerParams = {
  testId: number
  studentId: string
  attempt: number
  questionId: number
  answer: unknown
  attachment?: string
  writing_submission?: string
  testGroupId?: number
}

async function upsertAnswer({
  testId,
  studentId,
  attempt,
  questionId,
  answer,
  attachment,
  writing_submission,
  testGroupId,
}: UpsertAnswerParams) {
  try {
    const directus = await initializeDirectus()
    // Try find existing answer record for this question in current attempt
    const existing = await directus.request(
      readItems('answers', {
        filter: {
          test: { _eq: testId },
          student: { _eq: studentId },
          attempt: { _eq: attempt },
          question: { _eq: questionId },
          ...(testGroupId ? { test_group: { _eq: testGroupId } } : {}),
        },
        limit: 1,
        fields: ['id'],
      }),
    )

    if (Array.isArray(existing) && existing.length > 0) {
      const id = existing[0].id as number
      await directus.request(updateItem('answers', id, { answers: [answer], attachment, writing_submission }))
      return { id }
    }

    const created = await directus.request(
      createItem('answers', {
        test: testId,
        student: studentId,
        test_group: testGroupId,
        attempt,
        question: questionId,
        answers: [answer],
        attachment,
        writing_submission,
      }),
    )
    return { id: (created as any)?.id as number }
  } catch (error) {
    handleDirectusError(error)
    throw error
  }
}

export const useUpsertAnswer = (options?: UseMutationOptions<{ id: number }, Error, UpsertAnswerParams>) => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: upsertAnswer,
    onSuccess: () => {
      qc.invalidateQueries('useCurrentAttempt')
    },
    onError: (error, variables) => {
      console.error('Failed to save answer for question:', variables.questionId, error)
    },
    ...options,
  })
}
