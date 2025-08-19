import { getDeepTestGroupById } from '@/libs/tests.sdk'
import { NextResponse } from 'next/server'

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const testGroupId = Number(id)
    
    if (!testGroupId || isNaN(testGroupId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid test group ID' },
        { status: 400 }
      )
    }

    const testGroupData = await getDeepTestGroupById(testGroupId)

  return NextResponse.json({ success: true, data: testGroupData })
  } catch (error) {
    console.error('Test Group API error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch test group' },
      { status: 500 }
    )
  }
}
