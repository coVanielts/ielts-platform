'use client'

import { useTestResults } from '@/components/api/useTestResults.api'
import LoadingSpinner from '@/components/LoadingSpinner'
import { appPaths } from '@/constants/appPaths'
import { normalizeAnswer } from '@/utils/tfng-answer.utils'
import { ArrowLeft, Award, CheckCircle, Clock, PenTool, Target, TrendingUp, XCircle } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestResultsPage() {
  const params = useParams()
  const router = useRouter()
  const testId = params.id as string
  const [showContent, setShowContent] = useState(false)

  // Get attempt from query params if available
  const searchParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
  const attemptParam = searchParams.get('attempt')
  const attemptNumber = attemptParam ? parseInt(attemptParam) : undefined

  // Use React Query hook to fetch test results
  const { data: results, isLoading, error: queryError } = useTestResults(testId, attemptNumber)

  // Animation effect for showing content
  useEffect(() => {
    if (results && !isLoading) {
      setTimeout(() => setShowContent(true), 200)
    }
  }, [results, isLoading])

  // Redirect to dashboard if error occurs
  useEffect(() => {
    if (queryError) {
      const t = setTimeout(() => router.replace(appPaths.dashboard), 1200)
      return () => clearTimeout(t)
    }
  }, [queryError, router])

  // This useEffect is replaced by the one above that handles queryError

  const getBandScoreColor = (score: number) => {
    if (score >= 8.5) return 'text-green-600 bg-green-100'
    if (score >= 7.0) return 'text-blue-600 bg-blue-100'
    if (score >= 6.0) return 'text-yellow-600 bg-yellow-100'
    if (score >= 5.0) return 'text-orange-600 bg-orange-100'
    return 'text-red-600 bg-red-100'
  }

  const getPerformanceLevel = (percentage: number) => {
    if (percentage >= 90) return { level: 'Excellent', color: 'text-green-600' }
    if (percentage >= 80) return { level: 'Very Good', color: 'text-blue-600' }
    if (percentage >= 70) return { level: 'Good', color: 'text-yellow-600' }
    if (percentage >= 60) return { level: 'Satisfactory', color: 'text-orange-600' }
    return { level: 'Needs Improvement', color: 'text-red-600' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <LoadingSpinner size="lg" text="Calculating your results..." className="py-12" />
      </div>
    )
  }

  if (queryError) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">Unable to load results</h2>
          <p className="text-neutral-600 mb-4">An error occurred while loading results. Returning to dashboard...</p>
        </div>
      </div>
    )
  }

  // Extra safety: if no results and no error, render nothing
  if (!results) return null

  const performance = getPerformanceLevel(results.percentage)

  // Check if any question has a correctAnswer (indicating answers can be revealed)
  const canRevealAnswers = results.questions.some(q => q.correctAnswer !== null)

  // Helper function to format answers for display
  const formatAnswer = (answer: any): string => {
    if (Array.isArray(answer)) {
      return answer.map(item => normalizeAnswer(item?.toString()) || item).join(', ')
    }
    
    const answerStr = answer?.toString()
    return normalizeAnswer(answerStr) || answerStr || '-'
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
                <h1 className="text-lg font-semibold text-neutral-900">Test Results</h1>
                <p className="text-sm text-neutral-600">{results.testTitle}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        <div
          className={`max-w-4xl mx-auto transition-opacity duration-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {results.testType === 'writing' && results.totalScore === 0
                ? 'Essay Submitted for Review!'
                : 'Test Completed Successfully!'}
            </h2>
            <p className="text-neutral-600">
              Completed on{' '}
              {new Date(results.completedAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>

          {/* For Writing and Speaking Tests */}
          {results.testType === 'writing' || results.testType === 'speaking' ? (
            <>
              {/* Show pending message if no band score */}
              {!results.bandScore ? (
                <div className="card mb-8">
                  <div className="card-body text-center py-12">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {results.testType === 'writing' ? (
                        <PenTool className="w-8 h-8 text-blue-600" />
                      ) : (
                        <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                      )}
                    </div>
                    <h3 className="text-xl font-semibold text-neutral-900 mb-3">
                      {results.testType === 'writing'
                        ? 'Essay Submitted Successfully'
                        : 'Speaking Test Submitted Successfully'}
                    </h3>
                    <p className="text-neutral-600 mb-4 max-w-md mx-auto">
                      Your {results.testType} test has been submitted and will be reviewed by our qualified teachers.
                      Results will be available within 24-48 hours.
                    </p>
                    <div className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Time spent: {results.timeSpent}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Show detailed results for Writing */}
                  {results.testType === 'writing' && (
                    <div className="card mb-8">
                      <div className="card-header">
                        <h3 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
                          <PenTool className="w-5 h-5" />
                          <span>Writing Assessment Results</span>
                        </h3>
                      </div>
                      <div className="card-body">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Task 1 */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-medium text-neutral-900 border-b pb-2">Task 1</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Task Achievement</p>
                                <p className="font-semibold text-neutral-900">{results.task_1_TA || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Coherence & Cohesion</p>
                                <p className="font-semibold text-neutral-900">{results.task_1_CC || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Lexical Resource</p>
                                <p className="font-semibold text-neutral-900">{results.task_1_LR || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Grammar Range & Accuracy</p>
                                <p className="font-semibold text-neutral-900">{results.task_1_GRA || 'N/A'}</p>
                              </div>
                            </div>
                          </div>

                          {/* Task 2 */}
                          <div className="space-y-4">
                            <h4 className="text-lg font-medium text-neutral-900 border-b pb-2">Task 2</h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Task Achievement</p>
                                <p className="font-semibold text-neutral-900">{results.task_2_TA || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Coherence & Cohesion</p>
                                <p className="font-semibold text-neutral-900">{results.task_2_CC || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Lexical Resource</p>
                                <p className="font-semibold text-neutral-900">{results.task_2_LR || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-sm text-neutral-600 mb-1">Grammar Range & Accuracy</p>
                                <p className="font-semibold text-neutral-900">{results.task_2_GRA || 'N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Overall Band Score */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="text-center">
                            <p className="text-sm text-neutral-600 mb-2">Overall Writing Band Score</p>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full">
                              <span className="text-2xl font-bold text-blue-600">{results.bandScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show detailed results for Speaking */}
                  {results.testType === 'speaking' && (
                    <div className="card mb-8">
                      <div className="card-header">
                        <h3 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                            />
                          </svg>
                          <span>Speaking Assessment Results</span>
                        </h3>
                      </div>
                      <div className="card-body">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                          <div>
                            <p className="text-sm text-neutral-600 mb-1">Fluency & Coherence</p>
                            <p className="font-semibold text-neutral-900">{results.FC || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-600 mb-1">Lexical Resource</p>
                            <p className="font-semibold text-neutral-900">{results.LR || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-600 mb-1">Grammar Range & Accuracy</p>
                            <p className="font-semibold text-neutral-900">{results.GRA || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-neutral-600 mb-1">Pronunciation</p>
                            <p className="font-semibold text-neutral-900">{results.P || 'N/A'}</p>
                          </div>
                        </div>

                        {/* Overall Band Score */}
                        <div className="mt-6 pt-6 border-t border-gray-200">
                          <div className="text-center">
                            <p className="text-sm text-neutral-600 mb-2">Overall Speaking Band Score</p>
                            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
                              <span className="text-2xl font-bold text-red-600">{results.bandScore}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            <>
              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Overall Score */}
                <div className="card text-center">
                  <div className="card-body">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Award className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-1">
                      {results.totalScore}/{results.maxScore}
                    </h3>
                    <p className="text-sm text-neutral-600 mb-2">Overall Score</p>
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${performance.color} bg-opacity-10`}>
                      {performance.level}
                    </span>
                  </div>
                </div>

                {/* Band Score */}
                {results.bandScore && (
                  <div className="card text-center">
                    <div className="card-body">
                      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Target className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-neutral-900 mb-1">{results.bandScore}</h3>
                      <p className="text-sm text-neutral-600 mb-2">IELTS Band Score</p>
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getBandScoreColor(results.bandScore)}`}>
                        Band {results.bandScore}
                      </span>
                    </div>
                  </div>
                )}

                {/* Percentage */}
                <div className="card text-center">
                  <div className="card-body">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-neutral-900 mb-1">{results.percentage}%</h3>
                    <p className="text-sm text-neutral-600 mb-2">Accuracy</p>
                    <div className="w-full bg-neutral-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${results.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Test Info */}
              <div className="card mb-8">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-neutral-900 flex items-center space-x-2">
                    <Clock className="w-5 h-5" />
                    <span>Test Information</span>
                  </h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">Test Type</p>
                      <p className="font-medium text-neutral-900 capitalize">{results.testType}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">Time Spent</p>
                      <p className="font-medium text-neutral-900">{results.timeSpent}</p>
                    </div>
                    <div>
                      <p className="text-sm text-neutral-600 mb-1">Questions Answered</p>
                      <p className="font-medium text-neutral-900">{results.questions.length} questions</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Answer Sheet Table - Only show if answers can be revealed */}
              {canRevealAnswers && (
                <div className="card mb-8">
                  <div className="card-header">
                    <h3 className="text-lg font-semibold text-neutral-900">Answer Sheet</h3>
                  </div>
                  <div className="card-body">
                    {/* Split questions into chunks of 10 and display them in a grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      {Array.from({ length: Math.ceil(results.questions.length / 10) }, (_, chunkIndex) => {
                        const startIndex = chunkIndex * 10
                        const endIndex = Math.min(startIndex + 10, results.questions.length)
                        const chunkQuestions = results.questions.slice(startIndex, endIndex)
                        
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
                                {chunkQuestions.map((question, index) => (
                                  <tr 
                                    key={question.questionNumber}
                                    className={`border-b border-neutral-200 ${
                                      question.isCorrect ? 'bg-green-50/50' : 'bg-red-50/50'
                                    }`}>
                                    <td className="py-1 px-2 font-medium text-neutral-600 text-xs border-r border-neutral-200">
                                      {startIndex + index + 1}
                                    </td>
                                    <td className={`py-1 px-2 font-medium text-xs border-r border-neutral-200 ${
                                      question.isCorrect ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                      {formatAnswer(question.userAnswer) || '-'}
                                    </td>
                                    <td className="py-1 px-2 font-medium text-green-700 text-xs border-r border-neutral-200">
                                      {question.correctAnswer !== null 
                                        ? formatAnswer(question.correctAnswer)
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
                                {/* Fill empty rows if less than 10 questions in this chunk */}
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
                    
                    {/* Compact Summary */}
                    <div className="mt-3 pt-2 border-t border-neutral-200">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-3">
                          <span className="text-green-600 font-medium">
                            ✓ {results.questions.filter(q => q.isCorrect).length}
                          </span>
                          <span className="text-red-600 font-medium">
                            ✗ {results.questions.filter(q => !q.isCorrect).length}
                          </span>
                        </div>
                        <span className="text-neutral-600 font-medium">
                          Total: {results.questions.length}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Action Buttons */}
          <div className="text-center mt-8">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard" className="btn btn-primary">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
