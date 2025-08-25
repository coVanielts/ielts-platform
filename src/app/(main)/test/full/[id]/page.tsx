'use client'

import { useDeleteProgress, useGetProgress } from '@/components/api/useProgress.api'
import TestRunnerWithoutInstructions from '@/components/test/TestRunnerWithoutInstructions'
import { useUser } from '@/hooks/auth'
import { useTestGroupDetail } from '@/hooks/useTestGroupDetail'
import { ArrowLeft, Clock } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type TestSection = 'listening' | 'reading' | 'writing'

export default function FullTestPage() {
  const params = useParams()
  const router = useRouter()

  // Get user info
  const { data: user } = useUser()
  const studentId = user?.id as string | undefined

  // State
  const [currentSection, setCurrentSection] = useState<TestSection>('listening')

  // Section completion states
  const [listeningCompleted, setListeningCompleted] = useState(false)
  const [readingCompleted, setReadingCompleted] = useState(false)
  const [writingCompleted, setWritingCompleted] = useState(false)

  // Instruction page states
  const [showListeningInstructions, setShowListeningInstructions] = useState(true)
  const [showReadingInstructions, setShowReadingInstructions] = useState(false)
  const [showWritingInstructions, setShowWritingInstructions] = useState(false)

  const testGroupId = params.id as string

  // Fetch test group data
  const { data: testGroupData, isLoading, error } = useTestGroupDetail(testGroupId)

  // Get progress for individual tests to determine current skill
  const listeningTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'listening')?.tests_id?.id
  const readingTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'reading')?.tests_id?.id
  const writingTestId = testGroupData?.tests?.find(t => t.tests_id.type?.toLowerCase() === 'writing')?.tests_id?.id

  const { data: listeningProgress } = useGetProgress(listeningTestId, studentId, parseInt(testGroupId))
  const { data: readingProgress } = useGetProgress(readingTestId, studentId, parseInt(testGroupId))
  const { data: writingProgress } = useGetProgress(writingTestId, studentId, parseInt(testGroupId))

  const { mutate: deleteProgress } = useDeleteProgress()

  // Determine current skill based on progress
  useEffect(() => {
    if (!studentId || !listeningTestId || !readingTestId || !writingTestId) return

    // Check which skill should be active based on progress
    if (listeningProgress && listeningProgress.remaining_time && listeningProgress.remaining_time > 0) {
      // Listening in progress
      setCurrentSection('listening')
      setShowListeningInstructions(false) // Skip instructions if resuming
    } else if (readingProgress && readingProgress.remaining_time && readingProgress.remaining_time > 0) {
      // Reading in progress (listening completed)
      setCurrentSection('reading')
      setListeningCompleted(true)
      setShowListeningInstructions(false)
      setShowReadingInstructions(false) // Skip instructions if resuming
    } else if (writingProgress && writingProgress.remaining_time && writingProgress.remaining_time > 0) {
      // Writing in progress (listening and reading completed)
      setCurrentSection('writing')
      setListeningCompleted(true)
      setReadingCompleted(true)
      setShowListeningInstructions(false)
      setShowReadingInstructions(false)
      setShowWritingInstructions(false) // Skip instructions if resuming
    } else {
      // No progress found, start from listening
      setCurrentSection('listening')
    }
  }, [listeningProgress, readingProgress, writingProgress, studentId, listeningTestId, readingTestId, writingTestId])

  const handleStartTest = () => {
    setShowListeningInstructions(false)
  }

  const handleStartReading = () => {
    setShowReadingInstructions(false)
    setCurrentSection('reading')

    // Delete listening progress when moving to reading
    if (studentId && listeningTestId) {
      deleteProgress({ testId: listeningTestId, studentId, testGroupId: parseInt(testGroupId) })
    }
  }

  const handleStartWriting = () => {
    setShowWritingInstructions(false)
    setCurrentSection('writing')

    // Delete reading progress when moving to writing
    if (studentId && readingTestId) {
      deleteProgress({ testId: readingTestId, studentId, testGroupId: parseInt(testGroupId) })
    }
  }

  // Early returns for loading, error, and invalid data states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4" />
          <p className="text-neutral-600">Loading test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Failed to load test group</h2>
          <p className="text-neutral-600 mb-6">{(error as Error)?.message || 'An unexpected error occurred'}</p>
          <Link href="/dashboard" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (!testGroupData?.tests || !listeningTestId || !readingTestId || !writingTestId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-neutral-900 mb-4">Invalid test group</h2>
          <p className="text-neutral-600 mb-6">This test group is missing required test sections</p>
          <Link href="/dashboard" className="btn btn-primary">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Show listening instructions
  if (showListeningInstructions) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
  <div className="flex flex-col items-center justify-center p-12 container">
          <div className="mb-8">
            <Clock className="w-20 h-20 text-blue-500 mx-auto" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">IELTS Listening Test</h1>
          <div className="bg-blue-50 p-8 rounded-lg w-full mb-8">
            <div className="space-y-4 text-lg text-blue-800">
              <p>
                • The Listening test lasts approximately <strong>30 minutes</strong>, plus <strong>2 minutes</strong>{' '}
                extra time to review your answers.
              </p>
              <p>
                • You will hear the recording <strong>only once</strong>.
              </p>
              <p>
                • Write your answers while listening as there is <strong>no time</strong> at the end to copy answers.
              </p>
              <p>• After the audio ends, you will have 2 minutes to review your answers.</p>
            </div>
          </div>

          <button
            onClick={handleStartTest}
            className="px-12 py-4 bg-blue-600 text-white text-xl rounded-lg font-medium hover:bg-blue-700 transition-colors">
            Start Listening Test
          </button>
        </div>
      </div>
    )
  }

  // Show reading instructions
  if (showReadingInstructions) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
  <div className="flex flex-col items-center justify-center p-12 container">
          <div className="mb-8">
            <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-3xl font-bold">📖</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">IELTS Reading Test</h1>
          <div className="bg-green-50 p-8 rounded-lg w-full mb-8">
            <div className="space-y-4 text-lg text-green-800">
              <p>
                • You have <strong>60 minutes</strong> to complete the Reading test.
              </p>
              <p>
                • There are <strong>3 passages</strong> with 40 questions in total.
              </p>
              <p>• You can move freely between passages and questions.</p>
              <p>• Manage your time carefully - spend about 20 minutes on each passage.</p>
            </div>
          </div>

          <button
            onClick={handleStartReading}
            className="px-12 py-4 bg-green-600 text-white text-xl rounded-lg font-medium hover:bg-green-700 transition-colors">
            Start Reading Test
          </button>
        </div>
      </div>
    )
  }

  // Show writing instructions
  if (showWritingInstructions) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
  <div className="flex flex-col items-center justify-center p-12 container">
          <div className="mb-8">
            <div className="w-20 h-20 bg-purple-500 rounded-full flex items-center justify-center mx-auto">
              <span className="text-white text-3xl font-bold">✍️</span>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">IELTS Writing Test</h1>
          <div className="bg-purple-50 p-8 rounded-lg w-full mb-8">
            <div className="space-y-4 text-lg text-purple-800">
              <p>
                • You have <strong>60 minutes</strong> to complete both writing tasks.
              </p>
              <p>
                • <strong>Task 1:</strong> Write at least 150 words (spend about 20 minutes).
              </p>
              <p>
                • <strong>Task 2:</strong> Write at least 250 words (spend about 40 minutes).
              </p>
              <p>• Task 2 carries more weight in your overall Writing score.</p>
              <p>• Plan your time carefully and leave time to review your answers.</p>
            </div>
          </div>

          <button
            onClick={handleStartWriting}
            className="px-12 py-4 bg-purple-600 text-white text-xl rounded-lg font-medium hover:bg-purple-700 transition-colors">
            Start Writing Test
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white border-b border-gray-200">
  <div className="container">
          <div className="flex space-x-1">
            <div className="px-6 py-3 text-sm font-medium border-b-2 border-blue-500 text-blue-600">
              {currentSection === 'listening' && 'Listening Test'}
              {currentSection === 'reading' && 'Reading Test'}
              {currentSection === 'writing' && 'Writing Test'}
              {listeningCompleted && currentSection === 'listening' && <span className="ml-2 text-green-500">✓</span>}
              {readingCompleted && currentSection === 'reading' && <span className="ml-2 text-green-500">✓</span>}
              {writingCompleted && currentSection === 'writing' && <span className="ml-2 text-green-500">✓</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        {currentSection === 'listening' && listeningTestId ? (
          <TestRunnerWithoutInstructions
            testId={listeningTestId}
            onCompleted={() => {
              setListeningCompleted(true)
              setCurrentSection('reading')
              setShowReadingInstructions(true)
            }}
            testGroupId={parseInt(testGroupId)}
          />
        ) : currentSection === 'reading' && readingTestId ? (
          <TestRunnerWithoutInstructions
            testId={readingTestId}
            onCompleted={() => {
              setReadingCompleted(true)
              setCurrentSection('writing')
              setShowWritingInstructions(true)
            }}
            testGroupId={parseInt(testGroupId)}
          />
        ) : currentSection === 'writing' && writingTestId ? (
          <TestRunnerWithoutInstructions
            testId={writingTestId}
            onCompleted={() => {
              setWritingCompleted(true)
              // Delete writing progress when completed
              if (studentId && writingTestId) {
                deleteProgress({ testId: writingTestId, studentId, testGroupId: parseInt(testGroupId) })
              }
              // Navigate to results page
              router.push(`/test/full/${params.id}/results`)
            }}
            testGroupId={parseInt(testGroupId)}
          />
        ) : (
          // Fallback content
          <div className="h-full overflow-y-auto flex items-center justify-center">
            <p className="text-gray-500">Loading test section...</p>
          </div>
        )}
      </div>
    </div>
  )
}
