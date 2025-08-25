'use client'

import LoadingSpinner from '@/components/LoadingSpinner'
import { appPaths } from '@/constants/appPaths'
import { useTestAttempts } from '@/hooks/useTestAttempts'
import { ArrowLeft, Calendar, Clock, FileText, Play, Plus } from 'lucide-react'
import AppHeader from '@/components/layout/AppHeader'
import Link from 'next/link'
import { useParams } from 'next/navigation'

export default function TestAttemptsPage() {
  const params = useParams()
  const testId = params.id as string

  // Use React Query hook
  const { data, isLoading, error } = useTestAttempts(testId, false)

  const formatTime = (seconds: number | null): string => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading test attempts..." className="py-12" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Unable to load attempts</h2>
          <p className="text-neutral-600 mb-4">{error.message}</p>
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  const { testInfo, attempts } = data!

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <AppHeader
        title="Test Attempts"
        subtitle={testInfo?.name}
        left={(
          <Link href="/dashboard" className="btn btn-outline btn-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        )}
      />

      {/* Main Content */}
      <main className="container py-8">
  <div className="container">
          {/* Test Info Card */}
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 mb-2">{testInfo?.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-neutral-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{testInfo?.time_limit} minutes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="w-4 h-4" />
                      <span>Type: {testInfo?.type}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{attempts.length} attempts</span>
                    </div>
                  </div>
                </div>
                <Link
                  href={
                    testInfo?.type?.toLowerCase() === 'full' ? `/test/full/${testId}` : `${appPaths.tests}/${testId}`
                  }
                  className="btn btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Take Test Again
                </Link>
              </div>
            </div>
          </div>

          {/* Attempts List */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-neutral-900">Your Attempts</h3>
            </div>
            <div className="card-body p-0">
              {attempts.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {attempts.map((attempt, index) => (
                    <div key={attempt.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-neutral-900">Attempt #{attempt.attempt || index + 1}</h4>
                            {index === 0 && (
                              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                                Latest
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-neutral-600">
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(attempt.date_created)}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>Time spent: {formatTime(attempt.time_spent)}</span>
                            </div>
                            {attempt.number_of_correct_answers !== undefined && (
                              <div className="font-medium text-green-600">
                                Score: {attempt.number_of_correct_answers}
                              </div>
                            )}
                            {attempt.band_score !== undefined && (
                              <div className="font-medium text-blue-600">Band: {attempt.band_score}</div>
                            )}
                          </div>
                        </div>
                        <Link
                          href={`/test/${testId}/results?attempt=${attempt.attempt || 1}`}
                          className="btn btn-outline btn-sm">
                          <FileText className="w-4 h-4 mr-2" />
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <FileText className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-neutral-900 mb-2">No attempts yet</h3>
                  <p className="text-neutral-600 mb-4">You haven't taken this test yet.</p>
                  <Link
                    href={
                      testInfo?.type?.toLowerCase() === 'full' ? `/test/full/${testId}` : `${appPaths.tests}/${testId}`
                    }
                    className="btn btn-primary">
                    <Play className="w-4 h-4 mr-2" />
                    Take Test
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
