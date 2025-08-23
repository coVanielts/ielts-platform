'use client'

import { getDeepTestById } from '@/libs/tests.sdk'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function TestInstructionPage() {
  const params = useParams()
  const router = useRouter()
  const testId = Number(params.id)

  const [testData, setTestData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (Number.isNaN(testId)) return

    const load = async () => {
      try {
        const raw = await getDeepTestById(testId)
        setTestData(raw)
      } catch (error) {
        console.error('Failed to load test:', error)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [testId])

  const handleStartTest = () => {
    router.push(`/test/${testId}/take`)
  }

  if (Number.isNaN(testId)) {
    return <div>Invalid test ID</div>
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    )
  }

  if (!testData) {
    return <div>Test not found</div>
  }

  // testData loaded

  const isListening = String(testData.type).toLowerCase() === 'listening'
  const isReading = String(testData.type).toLowerCase() === 'reading'
  const isWriting = String(testData.type).toLowerCase() === 'writing'
  const isSpeaking = String(testData.type).toLowerCase() === 'speaking'

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-lg shadow-md max-w-lg">
        {/* Back button */}
        <div className="w-full mb-4">
          <Link href="/dashboard" className="btn btn-outline btn-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-4">
          {isListening ? (
            <svg className="w-16 h-16 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.536 8.464a5 5 0 010 7.072M12 18.364a7 7 0 010-12.728M8.464 15.536a5 5 0 010-7.072"
              />
            </svg>
          ) : isReading ? (
            <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          ) : isWriting ? (
            <svg className="w-16 h-16 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          ) : isSpeaking ? (
            <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
          ) : (
            <svg className="w-16 h-16 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          IELTS {testData.type.charAt(0).toUpperCase() + testData.type.slice(1)} Test
        </h2>

        <div className="text-center text-gray-600 mb-6 space-y-2">
          <p>
            <strong>Instructions:</strong>
          </p>
          {isListening && (
            <>
              <p>• This test has 4 sections with 10 questions each (40 questions total)</p>
              <p>• You will hear the audio once only</p>
              <p>• After the audio ends, you will have 2 minutes to review your answers</p>
              <p>• Make sure your audio is working and volume is comfortable</p>
              {testData.isPractice && (
                <p className="text-green-600 font-medium">
                  • 🎯 Practice Mode: You can pause, play, and seek through the audio
                </p>
              )}
            </>
          )}
          {isReading && (
            <>
              <p>• This test has 3 passages with 40 questions total</p>
              <p>• You have {testData.timeLimit} minutes to complete all questions</p>
              <p>• Read the passages carefully and answer all questions</p>
              <p>• You can navigate between passages and questions freely</p>
            </>
          )}
          {String(testData.type).toLowerCase() === 'writing' && (
            <>
              <p>• This test has 2 tasks: Task 1 and Task 2</p>
              <p>• Task 1: Write at least 150 words (20 minutes recommended)</p>
              <p>• Task 2: Write at least 250 words (40 minutes recommended)</p>
              <p>• You have {testData.timeLimit} minutes total to complete both tasks</p>
              <p>• Plan your time carefully and check your work before submitting</p>
              <p>• Use formal academic language and proper essay structure</p>
            </>
          )}
          {String(testData.type).toLowerCase() === 'speaking' && (
            <>
              <p>• This test has 3 parts: Introduction, Individual Long Turn, and Two-Way Discussion</p>
              <p>• Part 1: Answer questions about familiar topics (4-5 minutes)</p>
              <p>• Part 2: Speak for 2 minutes on a given topic with 1 minute preparation</p>
              <p>• Part 3: Discuss abstract topics in depth (4-5 minutes)</p>
              <p>• You have {testData.timeLimit} minutes total for the entire speaking test</p>
              <p>• Speak clearly and naturally, using a range of vocabulary and grammar</p>
              <p>• Make sure your microphone is working and in a quiet environment</p>
            </>
          )}
          {!isListening &&
            !isReading &&
            String(testData.type).toLowerCase() !== 'writing' &&
            String(testData.type).toLowerCase() !== 'speaking' && (
              <>
                <p>• Follow the instructions for each question carefully</p>
                <p>• You have {testData.timeLimit} minutes to complete the test</p>
                <p>• Make sure to answer all questions before submitting</p>
              </>
            )}
        </div>

        <button
          onClick={handleStartTest}
          className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
          Start {testData.type.charAt(0).toUpperCase() + testData.type.slice(1)} Test
        </button>
      </div>
    </div>
  )
}
