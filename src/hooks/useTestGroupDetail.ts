import { getDeepTestGroupById } from '@/libs/tests.sdk'
import { useQuery } from 'react-query'

interface TestGroupDetail {
  id: number
  name: string
  status: string
  is_practice_test: boolean
  date_created: string
  date_updated: string
  user_created: string
  user_updated: string
  tests: Array<{
    tests_id: {
      id: number
      name: string
      type: string
      time_limit: number
      audio?: string | null
      is_practice_test: boolean
      test_parts: Array<{
        test_parts_id: {
          id: number
          order: number | null
          paragraph: unknown
          question_groups: Array<{
            question_groups_id: {
              id: number
              type: string
              title: unknown
              content: unknown
              order: number
              answers: unknown
              choices: unknown
              letters: unknown
              paragraphs: unknown
              max_number_of_words: number | null
              speaking_time: number | null
              questions: Array<{
                id: number
                order: number
                title: unknown
                choices: unknown
                correct_answers: unknown
              }>
              images: Array<{ directus_files_id: string | null }>
            }
          }>
        }
      }>
    }
  }>
}

async function fetchTestGroupDetail(testGroupId: string): Promise<TestGroupDetail> {
  try {
    const testGroupIdNumber = parseInt(testGroupId)

    if (!testGroupIdNumber || isNaN(testGroupIdNumber)) {
      console.error('Invalid test group ID:', testGroupId)
      throw new Error('Invalid test group ID')
    }

    const testGroupData = await getDeepTestGroupById(testGroupIdNumber)

    return testGroupData as unknown as TestGroupDetail
  } catch (error) {
    console.error('Error fetching test group detail:', error)
    throw new Error('Failed to fetch test group detail')
  }
}

export function useTestGroupDetail(testGroupId: string) {
  return useQuery({
    queryKey: ['test-group-detail', testGroupId],
    queryFn: () => fetchTestGroupDetail(testGroupId),
    enabled: !!testGroupId,
    retry: 3,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  })
}
