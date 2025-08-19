'use client'

import { useGetProgress } from '@/components/api/useProgress.api'
import { useUser } from '@/hooks/auth'
import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function TestPage() {
  const params = useParams()
  const router = useRouter()
  const { data: user } = useUser()
  const id = Number(params.id)

  const { data: progress, isLoading: progressLoading } = useGetProgress(id, user?.id)

  useEffect(() => {
    if (Number.isNaN(id)) return
    if (progressLoading || !user) return

    if (progress && typeof progress.remaining_time === 'number' && progress.remaining_time > 0) {
      router.replace(`/test/${id}/take`)
    } else {
      router.replace(`/test/${id}/instruction`)
    }
  }, [id, progress, progressLoading, user, router])

  if (Number.isNaN(id)) {
    return <div>Invalid test ID</div>
  }

  if (progressLoading || !user) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    )
  }

  // This should not be reached due to redirects above
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="loading-spinner w-8 h-8" />
    </div>
  )
}
