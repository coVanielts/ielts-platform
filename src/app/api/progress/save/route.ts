import { initializeDirectus } from '@/libs/directus'
import { handleDirectusError } from '@/utils/auth-error.utils'
import { createItem, readItems, updateItem } from '@directus/sdk'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // Handle both JSON and plain text from sendBeacon
    const contentType = request.headers.get('content-type')
    let body

    if (contentType?.includes('application/json')) {
      body = await request.json()
    } else {
      // sendBeacon sends as text/plain by default
      const textBody = await request.text()
      try {
        body = JSON.parse(textBody)
      } catch {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
      }
    }

    const { testId, testGroupId, studentId, remainingTime, remainingAudioTime, currentPart } = body

    if (!testId || !studentId || typeof remainingTime !== 'number') {
      return NextResponse.json({ error: 'Missing required fields: testId, studentId, remainingTime' }, { status: 400 })
    }

    const directus = await initializeDirectus()

    // Check if progress record exists
    const existing = await directus.request(
      readItems('tests_progress', {
        filter: {
          test: { _eq: testId },
          student: { _eq: studentId },
          ...(testGroupId ? { test_group: { _eq: testGroupId } } : {}),
        },
        limit: 1,
        fields: ['id', 'remaining_time', 'remaining_audio_time', 'current_part'],
      }),
    )

    const updateData: any = { remaining_time: remainingTime }
    if (remainingAudioTime !== undefined) updateData.remaining_audio_time = remainingAudioTime
    if (currentPart !== undefined) updateData.current_part = currentPart

    if (Array.isArray(existing) && existing.length > 0) {
      // Update existing progress only if new time is less than current time (progress made)
      const id = existing[0].id as number
      const currentRemainingTime = existing[0].remaining_time as number | null

      if (currentRemainingTime === null || currentRemainingTime === undefined || remainingTime < currentRemainingTime) {
        await directus.request(updateItem('tests_progress', id, updateData))
        return NextResponse.json({
          success: true,
          action: 'updated',
          id,
          previousTime: currentRemainingTime,
          newTime: remainingTime,
        })
      } else {
        // Still update other fields even if remaining_time doesn't change
        const otherFields: any = {}

        if (remainingAudioTime !== undefined) otherFields.remaining_audio_time = remainingAudioTime
        if (currentPart !== undefined) otherFields.current_part = currentPart
        if (Object.keys(otherFields).length > 0) {
          await directus.request(updateItem('tests_progress', id, otherFields))
          return NextResponse.json({
            success: true,
            action: 'partial_update',
            id,
            updatedFields: Object.keys(otherFields),
          })
        }
        // Don't update if new time is greater (would be going backwards)
        return NextResponse.json({
          success: true,
          action: 'skipped',
          id,
          reason: 'New time is greater than current time',
          currentTime: currentRemainingTime,
          attemptedTime: remainingTime,
        })
      }
    } else {
      // Create new progress record
      const created = await directus.request(
        createItem('tests_progress', {
          test: testId,
          student: studentId,
          remaining_time: remainingTime,
          test_group: testGroupId,
          ...(remainingAudioTime !== undefined && { remaining_audio_time: remainingAudioTime }),
          ...(currentPart !== undefined && { current_part: currentPart }),
        }),
      )
      return NextResponse.json({ success: true, action: 'created', id: (created as any)?.id })
    }
  } catch (error) {
    console.error('Progress save API error:', error)
    handleDirectusError(error)
    return NextResponse.json({ error: 'Failed to save progress' }, { status: 500 })
  }
}
