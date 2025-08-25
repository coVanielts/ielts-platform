'use client'

import { useTestResults } from '@/components/api/useTestResults.api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { useTestGroupDetail } from '@/hooks/useTestGroupDetail'
import { normalizeAnswer } from '@/utils/tfng-answer.utils'
import { ArrowLeft, Award, BarChart3, BookOpen, Headphones, PenTool, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
    feedbackFiles?: Array<{
      id: string
      filename: string
      url: string
    }>
    task_1_TA?: number | null
    task_1_CC?: number | null
    task_1_LR?: number | null
    task_1_GRA?: number | null
    task_1_TA_feedback?: string | null
    task_1_CC_feedback?: string | null
    task_1_LR_feedback?: string | null
    task_1_GRA_feedback?: string | null
    task_2_TA?: number | null
    task_2_CC?: number | null
    task_2_LR?: number | null
    task_2_GRA?: number | null
    task_2_TA_feedback?: string | null
    task_2_CC_feedback?: string | null
    task_2_LR_feedback?: string | null
    task_2_GRA_feedback?: string | null
  }
  speaking?: {
    testId: number
    bandScore: number | null
    percentage: number
    timeSpent: string
    completedAt: string
    status: 'completed' | 'pending' | 'graded'
    feedbackFiles?: Array<{
      id: string
      filename: string
      url: string
    }>
    FC?: number | null
    LR?: number | null
    GRA?: number | null
    P?: number | null
    FC_feedback?: string | null
    LR_feedback?: string | null
    GRA_feedback?: string | null
    P_feedback?: string | null
  }
  overallBandScore: number | null
  completedAt: string
}

export default function FullTestResultsPage() {
  const params = useParams()
  const [fullTestResult, setFullTestResult] = useState<FullTestResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const testGroupId = params.id as string
  // Fetch test group data to get individual test IDs
  const { data: testGroupData, isLoading: groupLoading } = useTestGroupDetail(testGroupId)

  const listeningTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'listening')?.tests_id?.id
  const readingTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'reading')?.tests_id?.id
  const writingTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'writing')?.tests_id?.id
  const speakingTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'speaking')?.tests_id?.id

  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const attemptParam = searchParams.get('attempt')
  const attemptNumber = attemptParam ? parseInt(attemptParam) : undefined

  // Fetch results for each individual test
  const { data: listeningResult } = useTestResults(listeningTestId?.toString() ?? '', testGroupId, attemptNumber)
  const { data: readingResult } = useTestResults(readingTestId?.toString() ?? '', testGroupId, attemptNumber)
  const { data: writingResult } = useTestResults(writingTestId?.toString() ?? '', testGroupId, attemptNumber)
  const { data: speakingResult } = useTestResults(speakingTestId?.toString() ?? '', testGroupId, attemptNumber)

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
          feedbackFiles: writingResult.feedbackFiles || [],
          task_1_TA: writingResult.task_1_TA,
          task_1_CC: writingResult.task_1_CC,
          task_1_LR: writingResult.task_1_LR,
          task_1_GRA: writingResult.task_1_GRA,
          task_1_TA_feedback: writingResult.task_1_TA_feedback,
          task_1_CC_feedback: writingResult.task_1_CC_feedback,
          task_1_LR_feedback: writingResult.task_1_LR_feedback,
          task_1_GRA_feedback: writingResult.task_1_GRA_feedback,
          task_2_TA: writingResult.task_2_TA,
          task_2_CC: writingResult.task_2_CC,
          task_2_LR: writingResult.task_2_LR,
          task_2_GRA: writingResult.task_2_GRA,
          task_2_TA_feedback: writingResult.task_2_TA_feedback,
          task_2_CC_feedback: writingResult.task_2_CC_feedback,
          task_2_LR_feedback: writingResult.task_2_LR_feedback,
          task_2_GRA_feedback: writingResult.task_2_GRA_feedback,
        }
      }

      // Process speaking results
      if (speakingResult && speakingTestId) {
        result.speaking = {
          testId: speakingTestId,
          bandScore: speakingResult.bandScore as number,
          percentage: speakingResult.percentage,
          timeSpent: speakingResult.timeSpent,
          completedAt: speakingResult.completedAt,
          status: speakingResult.bandScore !== null ? 'graded' : 'pending', // Speaking usually needs manual grading
          feedbackFiles: speakingResult.feedbackFiles || [],
          FC: speakingResult.FC,
          LR: speakingResult.LR,
          GRA: speakingResult.GRA,
          P: speakingResult.P,
          FC_feedback: speakingResult.FC_feedback,
          LR_feedback: speakingResult.LR_feedback,
          GRA_feedback: speakingResult.GRA_feedback,
          P_feedback: speakingResult.P_feedback,
        }
      }

      // Calculate overall band score when all skills have band scores (include speaking if available)
      const bandScores = [result.listening?.bandScore, result.reading?.bandScore, result.writing?.bandScore, result.speaking?.bandScore].filter(
        score => score !== null && score !== undefined,
      ) as number[]

      // Compute overall when we have at least 3 band scores
      if (bandScores.length >= 3) {
        const averageBandScore = bandScores.reduce((sum, score) => sum + score, 0) / bandScores.length
        result.overallBandScore = Math.round(averageBandScore * 2) / 2 // Round to nearest 0.5
      } else {
        result.overallBandScore = null
      }

      // Use the latest completion time
      const completionTimes = [
        result.listening?.completedAt,
        result.reading?.completedAt,
        result.writing?.completedAt,
        result.speaking?.completedAt,
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
    speakingResult,
    testGroupData,
    groupLoading,
    listeningTestId,
    readingTestId,
    writingTestId,
    speakingTestId,
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
    if (score >= 8.5) return 'Expert Student'
    if (score >= 7.0) return 'Good Student'
    if (score >= 6.0) return 'Competent Student'
    if (score >= 5.0) return 'Modest Student'
    return 'Noob Student'
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

  const canRevealAnswers =
    !!(listeningResult?.questions?.some((q: any) => q.correctAnswer !== null) ||
      readingResult?.questions?.some((q: any) => q.correctAnswer !== null))

  const formatAnswer = (answer: any): string => {
    if (Array.isArray(answer)) {
      return answer.map((item: any) => normalizeAnswer(item?.toString()) || item).join(', ')
    }

    const answerStr = answer?.toString()
    return normalizeAnswer(answerStr) || answerStr || '-'
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
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
                {canRevealAnswers && (
                  <Link
                    href={`/test/${fullTestResult.listening.testId}/results`}
                    className="block w-full text-center py-2 px-4 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium">
                    View Detailed Results
                  </Link>
                )}
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
                {canRevealAnswers && (
                  <Link
                    href={`/test/${fullTestResult.reading.testId}/results`}
                    className="block w-full text-center py-2 px-4 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-medium">
                    View Detailed Results
                  </Link>
                )}
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
                {canRevealAnswers && (
                  <Link
                    href={`/test/${fullTestResult.writing.testId}/results`}
                    className="block w-full text-center py-2 px-4 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium">
                    View Detailed Results
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-8">
                <span>Not completed</span>
              </div>
            )}
          </div>

          {/* Speaking */}
          <div className="bg-white rounded-lg border border-neutral-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-neutral-900 ml-2">Speaking</h3>
              </div>
              {fullTestResult.speaking?.status === 'pending' && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">Pending</span>
              )}
            </div>

            {fullTestResult.speaking ? (
              <div className="space-y-3">
                <div
                  className={`text-center py-3 px-4 rounded-lg ${getBandScoreColor(fullTestResult.speaking.bandScore)}`}>
                  <div className="text-2xl font-bold">{fullTestResult.speaking.bandScore || 'N/A'}</div>
                  <div className="text-sm">Band Score</div>
                </div>

                {/* Speaking Detailed Scores */}
                {(fullTestResult.speaking.FC || fullTestResult.speaking.LR || fullTestResult.speaking.GRA || fullTestResult.speaking.P) && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-neutral-700 uppercase tracking-wide">Detailed Scores</h5>
                    <div className="grid grid-cols-2 gap-1">
                      {fullTestResult.speaking.FC && (
                        <div className="p-2 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs font-medium text-blue-700">FC</div>
                          <div className="text-sm font-bold text-blue-800">{fullTestResult.speaking.FC}</div>
                        </div>
                      )}
                      {fullTestResult.speaking.LR && (
                        <div className="p-2 bg-green-50 rounded border border-green-200">
                          <div className="text-xs font-medium text-green-700">LR</div>
                          <div className="text-sm font-bold text-green-800">{fullTestResult.speaking.LR}</div>
                        </div>
                      )}
                      {fullTestResult.speaking.GRA && (
                        <div className="p-2 bg-purple-50 rounded border border-purple-200">
                          <div className="text-xs font-medium text-purple-700">GRA</div>
                          <div className="text-sm font-bold text-purple-800">{fullTestResult.speaking.GRA}</div>
                        </div>
                      )}
                      {fullTestResult.speaking.P && (
                        <div className="p-2 bg-orange-50 rounded border border-orange-200">
                          <div className="text-xs font-medium text-orange-700">P</div>
                          <div className="text-sm font-bold text-orange-800">{fullTestResult.speaking.P}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Accuracy:</span>
                    <span className="font-medium">{fullTestResult.speaking.percentage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Time Spent:</span>
                    <span className="font-medium">{fullTestResult.speaking.timeSpent}</span>
                  </div>
                </div>
                {canRevealAnswers && (
                  <Link
                    href={`/test/${fullTestResult.speaking.testId}/results`}
                    className="block w-full text-center py-2 px-4 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium">
                    View Detailed Results
                  </Link>
                )}
              </div>
            ) : (
              <div className="text-center text-neutral-500 py-8">
                <span>Not completed</span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Answer Overview - only when server allowed reveal */}
        {canRevealAnswers && (listeningResult?.questions || readingResult?.questions) && (
          <div className="bg-white rounded-lg border border-neutral-200 p-4 mt-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">Answer Overview</h3>

            {/* Listening chunked tables */}
            {listeningResult?.questions && (
              <div className="mb-6">
                <div className="flex items-center mb-2">
                  <Headphones className="w-4 h-4 mr-2" />
                  <h4 className="font-medium text-neutral-800 text-sm">Listening ({listeningResult.questions.length})</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                  {Array.from({ length: Math.ceil(listeningResult.questions.length / 10) }, (_, chunkIndex) => {
                    const startIndex = chunkIndex * 10
                    const endIndex = Math.min(startIndex + 10, listeningResult.questions.length)
                    const chunkQuestions = listeningResult.questions.slice(startIndex, endIndex)

                    return (
                      <div key={chunkIndex} className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-neutral-300">
                          <thead>
                            <tr className="bg-neutral-100">
                              <th className="text-left py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300 w-8">#</th>
                              <th className="text-left py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300">Your</th>
                              <th className="text-left py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300">Key</th>
                              <th className="text-center py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300 w-6">✓</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunkQuestions.map((question: any, index: number) => (
                              <tr key={question.questionNumber ?? index} className={`border-b border-neutral-200 ${question.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                                <td className="py-1 px-2 font-medium text-neutral-600 text-xs border-r border-neutral-200">{startIndex + index + 1}</td>
                                <td className={`py-1 px-2 font-medium text-xs border-r border-neutral-200 ${question.isCorrect ? 'text-green-700' : 'text-red-700'}`}>{formatAnswer(question.userAnswer) || '-'}</td>
                                <td className="py-1 px-2 font-medium text-green-700 text-xs border-r border-neutral-200">{question.correctAnswer !== null ? formatAnswer(question.correctAnswer) : '-'}</td>
                                <td className="py-1 px-2 text-center">{question.isCorrect ? <span className="text-green-600 font-bold text-xs">✓</span> : <span className="text-red-600 font-bold text-xs">✗</span>}</td>
                              </tr>
                            ))}

                            {chunkQuestions.length < 10 && Array.from({ length: 10 - chunkQuestions.length }, (_, emptyIndex) => (
                              <tr key={`empty-${emptyIndex}`} className="border-b border-neutral-200">
                                <td className="py-1 px-2 text-xs border-r border-neutral-200 text-neutral-400">-</td>
                                <td className="py-1 px-2 text-xs border-r border-neutral-200 text-neutral-400">-</td>
                                <td className="py-1 px-2 text-xs border-r border-neutral-200 text-neutral-400">-</td>
                                <td className="py-1 px-2 text-center text-neutral-400">-</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  <span className="text-green-600 font-medium">✓ {listeningResult.questions.filter((q: any) => q.isCorrect).length}</span>
                  {' / '}
                  <span className="font-medium">{listeningResult.questions.length}</span>
                </div>
              </div>
            )}

            {/* Reading chunked tables */}
            {readingResult?.questions && (
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <BookOpen className="w-4 h-4 mr-2" />
                  <h4 className="font-medium text-neutral-800 text-sm">Reading ({readingResult.questions.length})</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-x-auto">
                  {Array.from({ length: Math.ceil(readingResult.questions.length / 10) }, (_, chunkIndex) => {
                    const startIndex = chunkIndex * 10
                    const endIndex = Math.min(startIndex + 10, readingResult.questions.length)
                    const chunkQuestions = readingResult.questions.slice(startIndex, endIndex)

                    return (
                      <div key={chunkIndex} className="overflow-x-auto">
                        <table className="w-full text-xs border-collapse border border-neutral-300">
                          <thead>
                            <tr className="bg-neutral-100">
                              <th className="text-left py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300 w-8">#</th>
                              <th className="text-left py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300">Your</th>
                              <th className="text-left py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300">Key</th>
                              <th className="text-center py-1 px-2 font-semibold text-neutral-700 border-b border-neutral-300 w-6">✓</th>
                            </tr>
                          </thead>
                          <tbody>
                            {chunkQuestions.map((question: any, index: number) => (
                              <tr key={question.questionNumber ?? index} className={`border-b border-neutral-200 ${question.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'}`}>
                                <td className="py-1 px-2 font-medium text-neutral-600 text-xs border-r border-neutral-200">{startIndex + index + 1}</td>
                                <td className={`py-1 px-2 font-medium text-xs border-r border-neutral-200 ${question.isCorrect ? 'text-green-700' : 'text-red-700'}`}>{formatAnswer(question.userAnswer) || '-'}</td>
                                <td className="py-1 px-2 font-medium text-green-700 text-xs border-r border-neutral-200">{question.correctAnswer !== null ? formatAnswer(question.correctAnswer) : '-'}</td>
                                <td className="py-1 px-2 text-center">{question.isCorrect ? <span className="text-green-600 font-bold text-xs">✓</span> : <span className="text-red-600 font-bold text-xs">✗</span>}</td>
                              </tr>
                            ))}

                            {chunkQuestions.length < 10 && Array.from({ length: 10 - chunkQuestions.length }, (_, emptyIndex) => (
                              <tr key={`empty-${emptyIndex}`} className="border-b border-neutral-200">
                                <td className="py-1 px-2 text-xs border-r border-neutral-200 text-neutral-400">-</td>
                                <td className="py-1 px-2 text-xs border-r border-neutral-200 text-neutral-400">-</td>
                                <td className="py-1 px-2 text-xs border-r border-neutral-200 text-neutral-400">-</td>
                                <td className="py-1 px-2 text-center text-neutral-400">-</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )
                  })}
                </div>
                <div className="mt-2 text-xs text-neutral-600">
                  <span className="text-green-600 font-medium">✓ {readingResult.questions.filter((q: any) => q.isCorrect).length}</span>
                  {' / '}
                  <span className="font-medium">{readingResult.questions.length}</span>
                </div>
              </div>
            )}

            {/* Writing status */}
            {writingResult && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <PenTool className="w-4 h-4 mr-2" />
                  <h4 className="font-medium text-neutral-800 text-sm">Writing</h4>
                </div>
                
                {/* Task 1 Breakdown */}
                {(fullTestResult.writing?.task_1_TA || fullTestResult.writing?.task_1_CC || fullTestResult.writing?.task_1_LR || fullTestResult.writing?.task_1_GRA) && (
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Task 1</h5>
                    
                    {/* Task 1 Scores Row */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Scores</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-xs font-medium text-blue-700">TA</span>
                          <span className="text-xs font-bold text-blue-800">{fullTestResult.writing.task_1_TA || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-xs font-medium text-green-700">CC</span>
                          <span className="text-xs font-bold text-green-800">{fullTestResult.writing.task_1_CC || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded border border-purple-200">
                          <span className="text-xs font-medium text-purple-700">LR</span>
                          <span className="text-xs font-bold text-purple-800">{fullTestResult.writing.task_1_LR || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200">
                          <span className="text-xs font-medium text-orange-700">GRA</span>
                          <span className="text-xs font-bold text-orange-800">{fullTestResult.writing.task_1_GRA || '-'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Task 1 Feedback Row */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Feedback</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                        <div className="p-2 bg-blue-50 rounded border border-blue-200 min-h-[60px]">
                          <div className="text-xs font-medium text-blue-700 mb-1">TA</div>
                          <div className="text-xs text-blue-600">{fullTestResult.writing.task_1_TA_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded border border-green-200 min-h-[60px]">
                          <div className="text-xs font-medium text-green-700 mb-1">CC</div>
                          <div className="text-xs text-green-600">{fullTestResult.writing.task_1_CC_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-purple-50 rounded border border-purple-200 min-h-[60px]">
                          <div className="text-xs font-medium text-purple-700 mb-1">LR</div>
                          <div className="text-xs text-purple-600">{fullTestResult.writing.task_1_LR_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-orange-50 rounded border border-orange-200 min-h-[60px]">
                          <div className="text-xs font-medium text-orange-700 mb-1">GRA</div>
                          <div className="text-xs text-orange-600">{fullTestResult.writing.task_1_GRA_feedback || 'No feedback'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Task 2 Breakdown */}
                {(fullTestResult.writing?.task_2_TA || fullTestResult.writing?.task_2_CC || fullTestResult.writing?.task_2_LR || fullTestResult.writing?.task_2_GRA) && (
                  <div className="mb-4">
                    <h5 className="text-xs font-semibold text-neutral-700 mb-2 uppercase tracking-wide">Task 2</h5>
                    
                    {/* Task 2 Scores Row */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Scores</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-xs font-medium text-blue-700">TA</span>
                          <span className="text-xs font-bold text-blue-800">{fullTestResult.writing.task_2_TA || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-xs font-medium text-green-700">CC</span>
                          <span className="text-xs font-bold text-green-800">{fullTestResult.writing.task_2_CC || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded border border-purple-200">
                          <span className="text-xs font-medium text-purple-700">LR</span>
                          <span className="text-xs font-bold text-purple-800">{fullTestResult.writing.task_2_LR || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200">
                          <span className="text-xs font-medium text-orange-700">GRA</span>
                          <span className="text-xs font-bold text-orange-800">{fullTestResult.writing.task_2_GRA || '-'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Task 2 Feedback Row */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Feedback</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                        <div className="p-2 bg-blue-50 rounded border border-blue-200 min-h-[60px]">
                          <div className="text-xs font-medium text-blue-700 mb-1">TA</div>
                          <div className="text-xs text-blue-600">{fullTestResult.writing.task_2_TA_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded border border-green-200 min-h-[60px]">
                          <div className="text-xs font-medium text-green-700 mb-1">CC</div>
                          <div className="text-xs text-green-600">{fullTestResult.writing.task_2_CC_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-purple-50 rounded border border-purple-200 min-h-[60px]">
                          <div className="text-xs font-medium text-purple-700 mb-1">LR</div>
                          <div className="text-xs text-purple-600">{fullTestResult.writing.task_2_LR_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-orange-50 rounded border border-orange-200 min-h-[60px]">
                          <div className="text-xs font-medium text-orange-700 mb-1">GRA</div>
                          <div className="text-xs text-orange-600">{fullTestResult.writing.task_2_GRA_feedback || 'No feedback'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Writing Status */}
                {!fullTestResult.writing?.task_1_TA && !fullTestResult.writing?.task_2_TA && (
                  <div className="p-2 bg-blue-50 border border-blue-200 rounded text-xs text-blue-700">
                    {writingResult.bandScore ? `Band: ${writingResult.bandScore}` : 'Pending assessment'}
                  </div>
                )}
                
                {/* Feedback Files */}
                {writingResult.feedbackFiles && writingResult.feedbackFiles.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-xs font-medium text-neutral-600 mb-1">Teacher Feedback:</h5>
                    <div className="space-y-1">
                      {writingResult.feedbackFiles.map((file, index) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-xs text-blue-700">{file.filename}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Speaking status */}
            {speakingResult && (
              <div className="mb-3">
                <div className="flex items-center mb-2">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                  <h4 className="font-medium text-neutral-800 text-sm">Speaking</h4>
                </div>
                
                {/* Speaking Breakdown */}
                {(fullTestResult.speaking?.FC || fullTestResult.speaking?.LR || fullTestResult.speaking?.GRA || fullTestResult.speaking?.P) && (
                  <div className="mb-4">
                    
                    {/* Speaking Scores Row */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Scores</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                        <div className="flex justify-between items-center p-2 bg-blue-50 rounded border border-blue-200">
                          <span className="text-xs font-medium text-blue-700">FC</span>
                          <span className="text-xs font-bold text-blue-800">{fullTestResult.speaking.FC || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-green-50 rounded border border-green-200">
                          <span className="text-xs font-medium text-green-700">LR</span>
                          <span className="text-xs font-bold text-green-800">{fullTestResult.speaking.LR || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded border border-purple-200">
                          <span className="text-xs font-medium text-purple-700">GRA</span>
                          <span className="text-xs font-bold text-purple-800">{fullTestResult.speaking.GRA || '-'}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded border border-orange-200">
                          <span className="text-xs font-medium text-orange-700">P</span>
                          <span className="text-xs font-bold text-orange-800">{fullTestResult.speaking.P || '-'}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Speaking Feedback Row */}
                    <div className="mb-3">
                      <div className="text-xs font-medium text-neutral-600 mb-1">Feedback</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-1">
                        <div className="p-2 bg-blue-50 rounded border border-blue-200 min-h-[60px]">
                          <div className="text-xs font-medium text-blue-700 mb-1">FC</div>
                          <div className="text-xs text-blue-600">{fullTestResult.speaking.FC_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-green-50 rounded border border-green-200 min-h-[60px]">
                          <div className="text-xs font-medium text-green-700 mb-1">LR</div>
                          <div className="text-xs text-green-600">{fullTestResult.speaking.LR_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-purple-50 rounded border border-purple-200 min-h-[60px]">
                          <div className="text-xs font-medium text-purple-700 mb-1">GRA</div>
                          <div className="text-xs text-purple-600">{fullTestResult.speaking.GRA_feedback || 'No feedback'}</div>
                        </div>
                        <div className="p-2 bg-orange-50 rounded border border-orange-200 min-h-[60px]">
                          <div className="text-xs font-medium text-orange-700 mb-1">P</div>
                          <div className="text-xs text-orange-600">{fullTestResult.speaking.P_feedback || 'No feedback'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Overall Speaking Status */}
                {!fullTestResult.speaking?.FC && !fullTestResult.speaking?.LR && !fullTestResult.speaking?.GRA && !fullTestResult.speaking?.P && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                    {speakingResult.bandScore ? `Band: ${speakingResult.bandScore}` : 'Pending assessment'}
                  </div>
                )}
                
                {/* Feedback Files */}
                {speakingResult.feedbackFiles && speakingResult.feedbackFiles.length > 0 && (
                  <div className="mt-2">
                    <h5 className="text-xs font-medium text-neutral-600 mb-1">Teacher Feedback:</h5>
                    <div className="space-y-1">
                      {speakingResult.feedbackFiles.map((file, index) => (
                        <div key={file.id} className="flex items-center justify-between p-2 bg-red-50 rounded border border-red-200">
                          <span className="text-xs text-red-700">{file.filename}</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => window.open(file.url, '_blank')}
                              className="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                            >
                              View
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="text-xs text-neutral-500 mt-3 pt-2 border-t border-neutral-200">Click "View Detailed Results" above for full analysis</div>
          </div>
        )}
      </div>
    </div>
  )
}
