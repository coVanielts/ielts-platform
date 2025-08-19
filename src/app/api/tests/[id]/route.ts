import { getDeepTestById } from '@/libs/tests.sdk'
import { NextResponse } from 'next/server'

export async function GET(
	_req: Request,
	context: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await context.params
		const idParam = id
		const testId = Number(idParam)

		if (!idParam || Number.isNaN(testId)) {
			return NextResponse.json({ success: false, error: 'Invalid test id' }, { status: 400 })
		}

		const data = await getDeepTestById(testId)
		return NextResponse.json({ success: true, data })
	} catch (error) {
		console.error('GET /api/tests/[id] error:', error)
		return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
	}
}

