import { initializeDirectus } from '@/libs/directus'
import { Tests } from '@/types/collections.type'
import { readItem } from '@directus/sdk'

export async function getDeepTestById(testId: number): Promise<Tests> {
  if (!testId || Number.isNaN(testId)) {
    throw new Error('Invalid testId')
  }

  const directus = await initializeDirectus()

  const data = await directus.request(
    readItem('tests', testId, {
      fields: [
        '*',
        {
          test_parts: [
            'test_parts_id.*',
            {
              'test_parts_id.question_groups': [
                'question_groups_id.*',
                {
                  'question_groups_id.questions': ['*'],
                  'question_groups_id.images': ['directus_files_id'],
                },
              ],
            },
          ],
        },
      ],
    }),
  )
  return data as unknown as Tests
}

export async function getDeepTestGroupById(testGroupId: number) {
  const directus = await initializeDirectus()

  try {
    const data = await directus.request(
      readItem('test_groups', testGroupId, {
        fields: [
          '*',
          {
            tests: [
              'tests_id.*',
              {
                'tests_id.test_parts': [
                  'test_parts_id.*',
                  {
                    'test_parts_id.question_groups': [
                      'question_groups_id.*',
                      {
                        'question_groups_id.questions': ['*'],
                        'question_groups_id.images': ['directus_files_id'],
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

    return data
  } catch (error) {
    console.error('SDK: Error fetching test group:', error)
    throw error
  }
}
