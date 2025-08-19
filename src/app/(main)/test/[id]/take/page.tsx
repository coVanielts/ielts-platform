'use client'

import TestRunnerWithoutInstructions from '@/components/test/TestRunnerWithoutInstructions'
import { useParams } from 'next/navigation'

export default function TestTakePage() {
  const params = useParams()
  const id = Number(params.id)

  if (Number.isNaN(id)) {
    return <div>Invalid test ID</div>
  }

  return <TestRunnerWithoutInstructions testId={id} />
}
