import { initializeDirectus } from '@/libs/directus'
import { fetchAudioFromDirectus } from '@/utils/audio.utils'
import { handleDirectusError } from '@/utils/auth-error.utils'
import { readItems } from '@directus/sdk'
import { useQuery } from 'react-query'

type AttemptData = {
  attempt: number
  answers: Array<{ id: number; question: number; answers: unknown }>
}

const fetchAttempt = async (params: {
  testId: number
  studentId: string
  testGroupId: number
}): Promise<AttemptData> => {
  const { testId, studentId, testGroupId } = params
  try {
    const directus = await initializeDirectus()

    const [results, answers] = await Promise.all([
      directus.request(
        readItems('results', {
          filter: {
            test: { _eq: testId },
            student: { _eq: studentId },
            ...(testGroupId ? { test_group: { _eq: testGroupId } } : {}),
          },
          sort: ['-attempt'],
          limit: 1,
          fields: ['id', 'attempt'],
        }),
      ),
      directus.request(
        readItems('answers', {
          filter: {
            test: { _eq: testId },
            student: { _eq: studentId },
            ...(testGroupId ? { test_group: { _eq: testGroupId } } : {}),
          },
          sort: ['-attempt'],
          limit: 50,
          fields: ['id', 'attempt', 'question', 'answers', 'attachment', 'writing_submission'],
        }),
      ),
    ])

    const maxAttemptResult = results?.[0]?.attempt ? Number(results[0].attempt) : 0
    const maxAttemptAnswer = answers?.reduce((m, a: any) => Math.max(m, Number(a.attempt || 0)), 0)

    // If there are existing answers with an attempt higher than results, resume that attempt; else next attempt after results
    const currentAttempt = Math.max(maxAttemptResult + 1, maxAttemptAnswer ?? 0) ?? 1

    const currentAttemptAnswers = Array.isArray(answers)
      ? (answers as any[])
          .filter(a => Number(a.attempt || 0) === currentAttempt)
          .map(a => ({
            id: a.id as number,
            question: Number(a.question),
            answers:
              a.writing_submission ?? (a.attachment ? fetchAudioFromDirectus(a.attachment as string) : a.answers),
          }))
      : []

    return { attempt: currentAttempt, answers: currentAttemptAnswers }
  } catch (error) {
    handleDirectusError(error)
    throw error
  }
}

export const useCurrentAttempt = (testId?: number, studentId?: string, testGroupId?: number) =>
  useQuery<AttemptData, Error>({
    queryKey: ['useCurrentAttempt', testId, testGroupId, studentId],
    queryFn: () =>
      fetchAttempt({ testId: testId as number, studentId: studentId as string, testGroupId: testGroupId as number }),
    enabled: typeof testId === 'number' && !!studentId && !Number.isNaN(testId),
    staleTime: 0,
  })
