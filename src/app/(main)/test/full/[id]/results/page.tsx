'use client'

import { useTestResults } from '@/components/api/useTestResults.api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useTestGroupDetail } from '@/hooks/useTestGroupDetail'
import { ArrowLeft, Award, BarChart3, BookOpen, CheckCircle, Headphones, PenTool, TrendingUp, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface FullTestResult {
  listening?: {
    testId: number
    bandScore: number | null
    percentage: number
    timeSpent: string
    completedAt: string
    status: 'completed' | 'pending' | 'graded'
  }
  reading?: {
    testId: number
    bandScore: number | null
    percentage: number
    timeSpent: string
    completedAt: string
    status: 'completed' | 'pending' | 'graded'
  }
  writing?: {
    testId: number
    bandScore: number | null
    percentage: number
    timeSpent: string
    completedAt: string
    status: 'completed' | 'pending' | 'graded'
  }
  overallBandScore: number | null
  completedAt: string
}

export default function FullTestResultsPage() {
  const params = useParams()
  const router = useRouter()
  const [fullTestResult, setFullTestResult] = useState<FullTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fetch test group data to get individual test IDs
  const { data: testGroupData, isLoading: groupLoading } = useTestGroupDetail(params.id as string)

  const listeningTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'listening')?.tests_id?.id
  const readingTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'reading')?.tests_id?.id
  const writingTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'writing')?.tests_id?.id

  // Fetch results for each individual test
  const { data: listeningResult } = useTestResults(listeningTestId?.toString() || '', undefined, params.id as string)
  const { data: readingResult } = useTestResults(readingTestId?.toString() || '', undefined, params.id as string)
  const { data: writingResult } = useTestResults(writingTestId?.toString() || '', undefined, params.id as string)

  useEffect(() => {
    if (!groupLoading && testGroupData) {
      const result: FullTestResult = {
        completedAt: new Date().toISOString(),
        overallBandScore: null,
      }

      // Process listening results
      if (listeningResult && listeningTestId) {
        result.listening = {
          testId: listeningTestId,
          bandScore: listeningResult.bandScore as number,
          percentage: listeningResult.percentage,
          timeSpent: listeningResult.timeSpent,
          completedAt: listeningResult.completedAt,
          status: listeningResult.bandScore !== null ? 'graded' : 'completed',
        }
      }

      // Process reading results
      if (readingResult && readingTestId) {
        result.reading = {
          testId: readingTestId,
          bandScore: readingResult.bandScore as number,
          percentage: readingResult.percentage,
          timeSpent: readingResult.timeSpent,
          completedAt: readingResult.completedAt,
          status: readingResult.bandScore !== null ? 'graded' : 'completed',
        }
      }

      // Process writing results
      if (writingResult && writingTestId) {
        result.writing = {
          testId: writingTestId,
          bandScore: writingResult.bandScore as number,
          percentage: writingResult.percentage,
          timeSpent: writingResult.timeSpent,
          completedAt: writingResult.completedAt,
          status: writingResult.bandScore !== null ? 'graded' : 'pending', // Writing usually needs manual grading
        }
      }

      // Calculate overall band score
      const bandScores = [result.listening?.bandScore, result.reading?.bandScore, result.writing?.bandScore].filter(
        score => score !== null && score !== undefined,
      ) as number[]

      if (bandScores.length > 0) {
        const averageBandScore = bandScores.reduce((sum, score) => sum + score, 0) / bandScores.length
        result.overallBandScore = Math.round(averageBandScore * 2) / 2 // Round to nearest 0.5
      }

      // Use the latest completion time
      const completionTimes = [
        result.listening?.completedAt,
        result.reading?.completedAt,
        result.writing?.completedAt,
      ].filter(time => time) as string[]

      if (completionTimes.length > 0) {
        result.completedAt = completionTimes.sort().pop() || new Date().toISOString()
      }

      setFullTestResult(result)
      setIsLoading(false)
    }
  }, [
    listeningResult,
    readingResult,
    writingResult,
    testGroupData,
    groupLoading,
    listeningTestId,
    readingTestId,
    writingTestId,
  ])

  const getBandScoreColor = (score: number | null) => {
    if (!score) return 'text-gray-500 bg-gray-100'
    if (score >= 8.5) return 'text-green-600 bg-green-100'
    if (score >= 7.0) return 'text-blue-600 bg-blue-100'
    if (score >= 6.0) return 'text-yellow-600 bg-yellow-100'
    if (score >= 5.0) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getBandScoreLabel = (score: number | null) => {
    if (!score) return 'Not Graded'
    if (score >= 8.5) return 'Expert User'
    if (score >= 7.0) return 'Good User'
    if (score >= 6.0) return 'Competent User'
    if (score >= 5.0) return 'Modest User'
    return 'Limited User'
  }

  const getSkillIcon = (skill: string) => {
    switch (skill) {
      case 'listening':
        return <Headphones className="w-5 h-5" />
      case 'reading':
        return <BookOpen className="w-5 h-5" />
      case 'writing':
        return <PenTool className="w-5 h-5" />
      default:
        return <BarChart3 className="w-5 h-5" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (isLoading || groupLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading your results..." className="py-12" />
      </div>
    )
  }

  if (!fullTestResult) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">No Results Found</h2>
          <p className="text-neutral-600 mb-4">Complete your full test to see results here.</p>
          <Link href="/dashboard" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard" className="inline-flex items-center text-neutral-600 hover:text-neutral-900 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="text-center">
            <Award className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-neutral-900 mb-2">IELTS Full Test Results</h1>
            <p className="text-neutral-600">Completed on {formatDate(fullTestResult.completedAt)}</p>
          </div>
        </div>

        {/* Overall Score */}
        {fullTestResult.overallBandScore && (
          <div className="bg-white rounded-lg border border-neutral-200 p-6 mb-6 text-center">
            <div className="flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6 text-primary-600 mr-2" />
              <h2 className="text-xl font-semibold text-neutral-900">Overall Band Score</h2>
            </div>
            <div
              className={`inline-flex items-center px-6 py-3 rounded-full text-2xl font-bold ${getBandScoreColor(fullTestResult.overallBandScore)}`}>
              {fullTestResult.overallBandScore}
            </div>
            <p className="text-neutral-600 mt-2">{getBandScoreLabel(fullTestResult.overallBandScore)}</p>
          </div>
        )}

        {/* Individual Skills Results */}
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
          {/* Listening */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {getSkillIcon('listening')}
                <h3 className="text-lg font-semibold text-neutral-900 ml-2">Listening</h3>
              </div>
              {fullTestResult.listening?.status === 'pending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
              )}
            </div>

            {fullTestResult.listening ? (
              <div className="space-y-3">
                <div
                  className={`text-center py-3 px-4 rounded-lg ${getBandScoreColor(fullTestResult.listening.bandScore)}`}>
                  <div className="text-2xl font-bold">{fullTestResult.listening.bandScore || 'N/A'}</div>
                  <div className="text-sm">Band Score</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Accuracy:</span>
                    <span className="font-medium">{fullTestResult.listening.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time Spent:</span>
                    <span className="font-medium">{fullTestResult.listening.timeSpent}</span>
                  </div>
                </div>
                <Link
                  href={`/test/${fullTestResult.listening.testId}/results`}
                  className="block w-full text-center py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                  View Detailed Results
                </Link>
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-8">
                <span>Not completed</span>
              </div>
            )}
          </div>

          {/* Reading */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {getSkillIcon('reading')}
                <h3 className="text-lg font-semibold text-neutral-900 ml-2">Reading</h3>
              </div>
              {fullTestResult.reading?.status === 'pending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
              )}
            </div>

            {fullTestResult.reading ? (
              <div className="space-y-3">
                <div
                  className={`text-center py-3 px-4 rounded-lg ${getBandScoreColor(fullTestResult.reading.bandScore)}`}>
                  <div className="text-2xl font-bold">{fullTestResult.reading.bandScore || 'N/A'}</div>
                  <div className="text-sm">Band Score</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Accuracy:</span>
                    <span className="font-medium">{fullTestResult.reading.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time Spent:</span>
                    <span className="font-medium">{fullTestResult.reading.timeSpent}</span>
                  </div>
                </div>
                <Link
                  href={`/test/${fullTestResult.reading.testId}/results`}
                  className="block w-full text-center py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                  View Detailed Results
                </Link>
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-8">
                <span>Not completed</span>
              </div>
            )}
          </div>

          {/* Writing */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                {getSkillIcon('writing')}
                <h3 className="text-lg font-semibold text-neutral-900 ml-2">Writing</h3>
              </div>
              {fullTestResult.writing?.status === 'pending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending Review</span>
              )}
            </div>

            {fullTestResult.writing ? (
              <div className="space-y-3">
                <div
                  className={`text-center py-3 px-4 rounded-lg ${getBandScoreColor(fullTestResult.writing.bandScore)}`}>
                  <div className="text-2xl font-bold">{fullTestResult.writing.bandScore || 'Pending'}</div>
                  <div className="text-sm">Band Score</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Accuracy:</span>
                    <span className="font-medium">{fullTestResult.writing.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time Spent:</span>
                    <span className="font-medium">{fullTestResult.writing.timeSpent}</span>
                  </div>
                </div>
                <Link
                  href={`/test/${fullTestResult.writing.testId}/results`}
                  className="block w-full text-center py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                  View Detailed Results
                </Link>
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-8">
                <span>Not completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Answer Overview */}
        {(listeningResult?.questions || readingResult?.questions) && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4 mt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Answer Overview</h3>
            
            {/* Listening Answers Table */}
            {listeningResult?.questions && (
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Headphones className="w-4 h-4 mr-2" />
                  <h4 className="font-medium text-neutral-800 text-sm">Listening ({listeningResult.questions.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-300">
                        <th className="text-left py-1 px-2 font-semibold text-neutral-700 w-8">#</th>
                        <th className="text-left py-1 px-2 font-semibold text-neutral-700">Your</th>
                        <th className="text-left py-1 px-2 font-semibold text-neutral-700">Key</th>
                        <th className="text-center py-1 px-2 font-semibold text-neutral-700 w-8">✓</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listeningResult.questions.slice(0, 15).map((question, index) => (
                        <tr key={index} className={`border-b border-neutral-100 hover:bg-neutral-50 ${question.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                          <td className="py-1 px-2 font-medium text-neutral-600 text-xs">{index + 1}</td>
                          <td className={`py-1 px-2 font-medium text-xs ${question.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {Array.isArray(question.userAnswer) ? question.userAnswer.join(', ') : question.userAnswer?.toString() || '-'}
                          </td>
                          <td className="py-1 px-2 font-medium text-green-700 text-xs">
                            {question.correctAnswer !== null 
                              ? (Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer?.toString())
                              : '-'}
                          </td>
                          <td className="py-1 px-2 text-center">
                            {question.isCorrect ? (
                              <span className="text-green-600 font-bold text-xs">✓</span>
                            ) : (
                              <span className="text-red-600 font-bold text-xs">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {listeningResult.questions.length > 15 && (
                        <tr>
                          <td colSpan={4} className="py-1 px-2 text-center text-neutral-500 text-xs">
                            ... +{listeningResult.questions.length - 15} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  <span className="text-green-600 font-medium">✓ {listeningResult.questions.filter(q => q.isCorrect).length}</span>
                  {' / '}
                  <span className="font-medium">{listeningResult.questions.length}</span>
                </div>
              </div>
            )}
            
            {/* Reading Answers Table */}
            {readingResult?.questions && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <h4 className="font-medium text-neutral-800 text-sm">Reading ({readingResult.questions.length})</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-neutral-300">
                        <th className="text-left py-1 px-2 font-semibold text-neutral-700 w-8">#</th>
                        <th className="text-left py-1 px-2 font-semibold text-neutral-700">Your</th>
                        <th className="text-left py-1 px-2 font-semibold text-neutral-700">Key</th>
                        <th className="text-center py-1 px-2 font-semibold text-neutral-700 w-8">✓</th>
                      </tr>
                    </thead>
                    <tbody>
                      {readingResult.questions.slice(0, 15).map((question, index) => (
                        <tr key={index} className={`border-b border-neutral-100 hover:bg-neutral-50 ${question.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                          <td className="py-1 px-2 font-medium text-neutral-600 text-xs">{index + 1}</td>
                          <td className={`py-1 px-2 font-medium text-xs ${question.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                            {Array.isArray(question.userAnswer) ? question.userAnswer.join(', ') : question.userAnswer?.toString() || '-'}
                          </td>
                          <td className="py-1 px-2 font-medium text-green-700 text-xs">
                            {question.correctAnswer !== null 
                              ? (Array.isArray(question.correctAnswer) ? question.correctAnswer.join(', ') : question.correctAnswer?.toString())
                              : '-'}
                          </td>
                          <td className="py-1 px-2 text-center">
                            {question.isCorrect ? (
                              <span className="text-green-600 font-bold text-xs">✓</span>
                            ) : (
                              <span className="text-red-600 font-bold text-xs">✗</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {readingResult.questions.length > 15 && (
                        <tr>
                          <td colSpan={4} className="py-1 px-2 text-center text-neutral-500 text-xs">
                            ... +{readingResult.questions.length - 15} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  <span className="text-green-600 font-medium">✓ {readingResult.questions.filter(q => q.isCorrect).length}</span>
                  {' / '}
                  <span className="font-medium">{readingResult.questions.length}</span>
                </div>
              </div>
            )}
            
            {/* Writing Status */}
            {writingResult && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <PenTool className="w-4 h-4 mr-2" />
                  <h4 className="font-medium text-neutral-800 text-sm">Writing</h4>
                </div>
                <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                  {writingResult.bandScore 
                    ? `Band: ${writingResult.bandScore}` 
                    : 'Pending assessment'}
                </div>
              </div>
            )}
            
            <div className="text-xs text-neutral-500 mt-3 pt-2 border-t border-neutral-200">
              Click "View Detailed Results" above for full analysis
            </div>
          </div>
        )}

        {/* Performance Summary */}
        <div className="bg-white rounded-lg border border-neutral-200 p-6 mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Performance Summary</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {[fullTestResult.listening, fullTestResult.reading, fullTestResult.writing].filter(Boolean).length}
              </div>
              <div className="text-sm text-neutral-600">Sections Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round(
                  [
                    fullTestResult.listening?.percentage || 0,
                    fullTestResult.reading?.percentage || 0,
                    fullTestResult.writing?.percentage || 0,
                  ].reduce((sum, p) => sum + p, 0) / 3,
                )}
                %
              </div>
              <div className="text-sm text-neutral-600">Average Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{fullTestResult.overallBandScore || 'TBD'}</div>
              <div className="text-sm text-neutral-600">Overall Band Score</div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-neutral-900 mb-3">Next Steps</h3>
          <ul className="space-y-2 text-neutral-700">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Review your detailed results for each skill to identify areas for improvement
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Practice more tests to improve your weaker skills
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-primary-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
              Consider taking another full test to track your progress
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}
