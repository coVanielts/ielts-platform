import { initializeDirectus } from '@/libs/directus'
import { handleDirectusError } from '@/utils/auth-error.utils'
import { createItem, deleteItems, readItems, updateItem } from '@directus/sdk'
import { useMutation, UseMutationOptions, useQuery, UseQueryOptions } from 'react-query'

type ProgressRecord = {
  id: number
  remaining_time?: number | null
  remaining_audio_time?: number | null
  current_part?: number | null
  student?: string | null
  test?: number | null
}

export const useGetProgress = (
  testId: number | undefined,
  studentId: string | undefined,
  options?: UseQueryOptions<ProgressRecord | null, Error>,
) =>
  useQuery<ProgressRecord | null, Error>({
    queryKey: ['useGetProgress', testId, studentId],
    enabled: typeof testId === 'number' && !!studentId && !Number.isNaN(testId),
    queryFn: async () => {
      try {
        const directus = await initializeDirectus()
        const res = await directus.request(
          readItems('tests_progress', {
            filter: { test: { _eq: testId }, student: { _eq: studentId } },
            limit: 1,
            fields: ['id', 'remaining_time', 'remaining_audio_time', 'current_part', 'student', 'test'],
          }),
        )
        const result = Array.isArray(res) && res.length > 0 ? (res[0] as ProgressRecord) : null
        return result
      } catch (error) {
        handleDirectusError(error)
        throw error
      }
    },
    ...options,
  })

type UpsertProgressParams = {
  testId: number
  studentId: string
  remainingTime: number
  remainingAudioTime?: number
  currentPart?: number
}

async function upsertProgress({
  testId,
  studentId,
  remainingTime,
  remainingAudioTime,
  currentPart,
}: UpsertProgressParams) {
  try {
    const directus = await initializeDirectus()
    const existing = await directus.request(
      readItems('tests_progress', {
        filter: { test: { _eq: testId }, student: { _eq: studentId } },
        limit: 1,
        fields: ['id', 'remaining_time', 'remaining_audio_time', 'current_part'],
      }),
    )

    const updateData: any = { remaining_time: remainingTime }
    if (remainingAudioTime !== undefined) updateData.remaining_audio_time = remainingAudioTime
    if (currentPart !== undefined) updateData.current_part = currentPart

    if (Array.isArray(existing) && existing.length > 0) {
      const id = existing[0].id as number
      const currentRemainingTime = existing[0].remaining_time as number | null

      // Only update if new time is less than current time (progress made) or if current time is null
      if (currentRemainingTime === null || currentRemainingTime === undefined || remainingTime < currentRemainingTime) {
        await directus.request(updateItem('tests_progress', id, updateData))
      } else {
        // Still update other fields even if remaining_time doesn't change
        const otherFields: any = {}
        if (remainingAudioTime !== undefined) otherFields.remaining_audio_time = remainingAudioTime
        if (currentPart !== undefined) otherFields.current_part = currentPart
        if (Object.keys(otherFields).length > 0) {
          await directus.request(updateItem('tests_progress', id, otherFields))
        }
      }
      return { id }
    }
    const created = await directus.request(
      createItem('tests_progress', {
        test: testId,
        student: studentId,
        remaining_time: remainingTime,
        ...(remainingAudioTime !== undefined && { remaining_audio_time: remainingAudioTime }),
        ...(currentPart !== undefined && { current_part: currentPart }),
      }),
    )
    return { id: (created as any)?.id as number }
  } catch (error) {
    handleDirectusError(error)
    throw error
  }
}

export const useUpsertProgress = (options?: UseMutationOptions<{ id: number }, Error, UpsertProgressParams>) =>
  useMutation({ mutationFn: upsertProgress, ...options })

// Delete progress when test is completed
type DeleteProgressParams = { testId: number; studentId: string }

async function deleteProgress({ testId, studentId }: DeleteProgressParams) {
  try {
    const directus = await initializeDirectus()
    const existing = await directus.request(
      readItems('tests_progress', {
        filter: { test: { _eq: testId }, student: { _eq: studentId } },
        fields: ['id'],
      }),
    )

  // existing progress fetched

    if (Array.isArray(existing) && existing.length > 0) {
      await directus.request(
        deleteItems(
          'tests_progress',
          existing.map(e => e.id),
        ),
      )
      return { deleted: true }
    }
    return { deleted: false }
  } catch (error) {
    handleDirectusError(error)
    throw error
  }
}

export const useDeleteProgress = (options?: UseMutationOptions<{ deleted: boolean }, Error, DeleteProgressParams>) =>
  useMutation({ mutationFn: deleteProgress, ...options })
