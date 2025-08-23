'use client'

import LoadingSpinner from '@/components/LoadingSpinner'
import { initializeDirectus } from '@/libs/directus'
import { Tests } from '@/types/collections.type'
import { readItem, readItems, readMe } from '@directus/sdk'
import { ArrowLeft, Calendar, Clock, FileText, Play, Plus } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

interface TestAttempt {
  id: number
  attempt: number
  date_created: string
  time_spent: number | null
  score?: number
  band_score?: number
  number_of_correct_answers?: number
}

interface TestInfo {
  id: number
  name: string
  tests: Tests[]
}

export default function TestGroupAttemptsPage() {
  const params = useParams()
  const testGroupId = params.id as string
  const [loading, setLoading] = useState(true)
  const [attempts, setAttempts] = useState<TestAttempt[]>([])
  const [testInfo, setTestInfo] = useState<TestInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        setLoading(true)

        // Initialize Directus client
        const directus = await initializeDirectus()

        // Get current user
        const user = await directus.request(readMe())
        const userId = user.id

        // Fetch test info
        const testData = await directus.request(
          readItem('test_groups', parseInt(testGroupId), {
            fields: ['id', 'name', 'tests'],
          }),
        )

        if (testData) {
          setTestInfo(testData as TestInfo)
        } else {
          throw new Error('Test not found')
        }

        // Fetch results for this test
        const resultsData = await directus.request(
          readItems('results', {
            filter: {
              test_group: { _eq: parseInt(testGroupId) },
              student: { _eq: userId },
            },
            sort: ['-date_created'],
            fields: ['id', 'attempt', 'date_created', 'time_spent', 'band_score', 'number_of_correct_answers'],
          }),
        )

        if (resultsData && resultsData.length > 0) {
          setAttempts(resultsData as TestAttempt[])
        }

        setLoading(false)
      } catch (error) {
        console.error('Error fetching attempts:', error)
        setError('An error occurred while loading test attempts.')
        setLoading(false)
      }
    }

    fetchAttempts()
  }, [testGroupId])

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

  if (loading) {
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
          <p className="text-neutral-600 mb-4">{error}</p>
          <Link href="/dashboard" className="btn btn-primary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      {/* Header */}
      <header className="ielts-header">
        <div className="container">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn btn-outline btn-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Test Attempts</h1>
                <p className="text-sm text-neutral-600">{testInfo?.name}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div className="max-w-4xl mx-auto">
          {/* Test Info Card */}
          <div className="card mb-8">
            <div className="card-body">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-neutral-900 mb-2">{testInfo?.name}</h2>
                  <div className="flex items-center space-x-4 text-sm text-neutral-600">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{testInfo?.tests?.length} tests</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="w-4 h-4" />
                      <span>{attempts.length} attempts</span>
                    </div>
                  </div>
                </div>
                <Link href={`/test/full/${testGroupId}`} className="btn btn-primary">
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
                          href={`/test/full/${testGroupId}/results?attempt=${attempt.attempt || 1}`}
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
                  <Link href={`/test/full/${testGroupId}`} className="btn btn-primary">
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
