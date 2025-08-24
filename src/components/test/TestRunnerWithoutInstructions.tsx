'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useUpsertAnswer } from '@/components/api/useAnswerMutations.api'
import { useCurrentAttempt } from '@/components/api/useCurrentAttempt.api'
import { uploadFile } from '@/components/api/useFiles'
import { useDeleteProgress, useGetProgress, useUpsertProgress } from '@/components/api/useProgress.api'
import { useCreateResult } from '@/components/api/useResultsMutations.api'
import { ListeningAudioPlayer } from '@/components/question-types/listening/ListeningAudioPlayer'
import ListeningTestLayout from '@/components/question-types/listening/ListeningTestLayout'
import { QuestionGroup } from '@/components/question-types/QuestionGroup'
import ReadingTestLayout from '@/components/question-types/reading/ReadingTestLayout'
import WritingTestLayout from '@/components/question-types/writing/WritingTestLayout'
import { useUser } from '@/hooks/auth'
import { getDeepTestById } from '@/libs/tests.sdk'
import {
  transformDirectusListeningTest,
  transformDirectusReadingTest,
  transformDirectusSpeakingTest,
  transformDirectusWritingTest,
} from '@/utils/api-transform.utils'
import { fetchAudioFromDirectus } from '@/utils/audio.utils'
import { AlertCircle, ArrowLeft, Clock, Send } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

type Props = {
  testId: number
  testGroupId?: number
  onCompleted?: () => void
}

export default function TestRunnerWithoutInstructions({ testId, testGroupId, onCompleted }: Props) {
  const router = useRouter()
  const { data: user } = useUser()
  const studentId = user?.id as string | undefined
  const audioRef = useRef<HTMLAudioElement>(null)
  const timeRemainingRef = useRef(0)
  const [testData, setTestData] = useState<any>(null)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [currentPart, setCurrentPart] = useState(1)
  const [currentQuestion, setCurrentQuestion] = useState(1)
  const [audioEnded, setAudioEnded] = useState(false)
  const [reviewTimeStarted, setReviewTimeStarted] = useState(false)
  const [reviewTimeRemaining, setReviewTimeRemaining] = useState(120)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTimerPaused, setIsTimerPaused] = useState(true) // Timer starts paused
  const [userConfirmedAudio, setUserConfirmedAudio] = useState(false)
  // Load test and auto-start
  useEffect(() => {
    const load = async () => {
      const numericId = Number(testId)
      const raw = await getDeepTestById(numericId)
      const type = String(raw.type || '').toLowerCase()

      let transformed
      switch (type) {
        case 'listening':
          transformed = transformDirectusListeningTest(raw)
          break
        case 'reading':
          transformed = transformDirectusReadingTest(raw)
          break
        case 'writing':
          transformed = transformDirectusWritingTest(raw as any)
          break
        case 'speaking':
          transformed = transformDirectusSpeakingTest(raw as any)
          break
        default:
          transformed = transformDirectusReadingTest(raw)
      }

      setTestData({
        id: (transformed as any).id || raw.id,
        title: (transformed as any).title || raw.name || 'Test Title',
        type: (transformed as any).type || raw.type,
        instruction:
          (transformed as any).instruction !== undefined ? (transformed as any).instruction : 'Test instructions',
        timeLimit: (transformed as any).timeLimit || raw.time_limit || 60,
        parts: (transformed as any).parts || [],
        questionGroups: (transformed as any).questionGroups || [],
        isPractice: raw.is_practice_test || false, // Add practice test check
        ...(type === 'listening' ? { audioUrl: (transformed as any).audioUrl } : {}),
      })

      setStartTime(new Date())
    }
    load()
  }, [testId])

  // Track pending answer updates to prevent race conditions
  const pendingAnswersRef = useRef<Record<string, unknown>>({})

  // Attempt and preload answers
  const { data: attemptData } = useCurrentAttempt(testId, studentId, testGroupId)
  useEffect(() => {
    if (!attemptData) return
    setAnswers(prev => {
      const merged = { ...prev }
      for (const a of attemptData.answers) {
        const questionId = String(a.question)
        // Only update if we don't have a pending change for this question
        if (!(questionId in pendingAnswersRef.current)) {
          merged[questionId] = a.answers
        }
      }
      return merged
    })
  }, [attemptData])

  const { data: progress, isLoading: progressLoading } = useGetProgress(testId, studentId, testGroupId)
  const [progressInitialized, setProgressInitialized] = useState(false)

  useEffect(() => {
    // Wait for both testData and progress to load
    if (!testData || progressLoading || progressInitialized) return

    if (progress && typeof progress.remaining_time === 'number' && progress.remaining_time > 0) {
      setTimeRemaining(progress.remaining_time)
      timeRemainingRef.current = progress.remaining_time

      if (progress.current_part && progress.current_part > 0) {
        setCurrentPart(progress.current_part)
      }
    } else {
      // No progress found, set initial time from testData
      const initialTime = (testData.timeLimit || 60) * 60
      setTimeRemaining(initialTime)
      timeRemainingRef.current = initialTime
    }

    // For non-listening tests, start timer immediately
    if (String(testData.type).toLowerCase() !== 'listening') {
      setIsTimerPaused(false)
      setUserConfirmedAudio(true)
    }

    setProgressInitialized(true)
  }, [progress, progressLoading, testData, studentId, testId, progressInitialized])

  // Keep ref in sync with state
  useEffect(() => {
    timeRemainingRef.current = timeRemaining
  }, [timeRemaining])

  // Mutations
  const { mutate: upsertAnswer } = useUpsertAnswer()
  const { mutate: upsertProgress } = useUpsertProgress()
  const { mutate: deleteProgress } = useDeleteProgress()
  const { mutate: createResult } = useCreateResult()

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleConfirmSubmit = useCallback(() => {
    if (!testData || isSubmitting) return

    // Mark that we're submitting to prevent duplicate progress creation
    isSubmittingRef.current = true
    setIsSubmitting(true)

    // Persist result
    if (attemptData && studentId) {
      // Calculate time spent based on initial time limit minus remaining time
      const initialTimeSeconds = (testData.timeLimit || 60) * 60
      const timeSpentSeconds = initialTimeSeconds - timeRemainingRef.current

      createResult(
        {
          testId,
          studentId,
          attempt: attemptData.attempt,
          timeSpentSeconds: timeSpentSeconds,
          type: String(testData.type || ''),
          testGroupId,
        },
        {
          onSuccess: () => {
            if (studentId) {
              deleteProgress({ testId, studentId, testGroupId })
            }

            // Navigate after successful submission
            if (onCompleted) onCompleted()
            else router.push(`/test/${testId}/results`)
          },
          onError: error => {
            console.error('Failed to create result:', error)
            setIsSubmitting(false)
            // Still navigate even if there's an error
            if (onCompleted) onCompleted()
            else router.push(`/test/${testId}/results`)
          },
        },
      )
    } else {
      // No attempt data, just navigate
      if (onCompleted) onCompleted()
      else router.push(`/test/${testId}/results`)
    }
  }, [
    attemptData,
    createResult,
    deleteProgress,
    isSubmitting,
    onCompleted,
    router,
    startTime,
    studentId,
    testData,
    testId,
  ])

  const handleSubmit = useCallback(() => {
    setShowConfirmModal(true)
  }, [])

  // Timers
  useEffect(() => {
    if (startTime && timeRemaining > 0 && !isTimerPaused) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          const newValue = prev - 1
          // Log every 10 seconds
          // periodic updates handled silently
          if (newValue <= 1) {
            clearInterval(timer)
            handleConfirmSubmit()
            return 0
          }
          return newValue
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [startTime, timeRemaining, isTimerPaused, handleConfirmSubmit])

  useEffect(() => {
    if (reviewTimeStarted && reviewTimeRemaining > 0) {
      const timer = setInterval(() => {
        setReviewTimeRemaining(prev => {
          if (prev <= 1) {
            clearInterval(timer)
            handleConfirmSubmit()
            return 0
          }
          return prev - 1
        })
      }, 1000)
      return () => clearInterval(timer)
    }
  }, [reviewTimeStarted, reviewTimeRemaining, handleConfirmSubmit])

  // Track if test is being submitted to prevent duplicate progress creation
  const isSubmittingRef = useRef(false)

  // Save progress when user leaves/closes page
  useEffect(() => {
    if (!studentId || !testId) return

    const saveProgress = () => {
      if (isSubmittingRef.current) {
        return
      }

      const currentTime = timeRemainingRef.current
      if (currentTime > 0) {
        const progressData: any = {
          testId,
          studentId,
          remainingTime: currentTime,
          testGroupId,
          currentPart,
        }

        const currentAudioTime = audioRef.current?.currentTime ?? 0
        const duration = audioRef.current?.duration ?? 0

        const audio = Math.ceil(duration - currentAudioTime)

        if (audio > 0 && currentAudioTime > 0) {
          progressData.remainingAudioTime = audio
        }

        if (navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify(progressData)], {
            type: 'application/json',
          })
          navigator.sendBeacon('/api/progress/save', blob)
        }

        // upsertProgress(progressData)
      }
    }

    // Add event listeners for various ways user can leave
    window.addEventListener('beforeunload', saveProgress)
    window.addEventListener('pagehide', saveProgress)
    window.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        saveProgress()
      }
    })

    // Save when component unmounts (back to dashboard, route change)
    return () => {
      window.removeEventListener('beforeunload', saveProgress)
      window.removeEventListener('pagehide', saveProgress)
      window.removeEventListener('visibilitychange', saveProgress)
      saveProgress()
    }
  }, [studentId, testId, testData, currentPart])

  // Store separate timeout IDs for each question to avoid cancellation
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})

  // Save answer with per-question debounce
  const saveAnswerDebounced = (questionId: string, answer: unknown, type?: 'writing' | 'speaking') => {
    // Clear existing timeout for this question
    if (timeoutRefs.current[questionId]) {
      clearTimeout(timeoutRefs.current[questionId])
    }

    // Set new timeout for this question
    timeoutRefs.current[questionId] = setTimeout(async () => {
      if (attemptData && studentId) {
        const qid = Number(questionId)

        const payload: any = {
          testId,
          testGroupId,
          studentId,
          attempt: attemptData.attempt,
          questionId: qid,
          answer,
        }

        if (type === 'speaking') {
          if (answer) {
            const file = await uploadFile({ raw_file: answer as File })
            payload.attachment = file
          } else {
            payload.attachment = null
          }

          payload.answer = ''
        }

        if (type === 'writing') {
          payload.writing_submission = answer as string
          payload.answer = ''
        }

        upsertAnswer(payload, {
          onSuccess: () => {
            // Remove from pending after successful save
            delete pendingAnswersRef.current[questionId]
            delete timeoutRefs.current[questionId]
          },
          onError: error => {
            console.error('Failed to save answer for question:', qid, error)
            delete timeoutRefs.current[questionId]
            // Keep the current UI state on error, don't revert
          },
        })
      }
    }, 500)
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  const handleAnswerChange = (questionId: string, answer: unknown, type?: 'writing' | 'speaking') => {
    // Update UI immediately (optimistic update)
    setAnswers(prev => ({ ...prev, [questionId]: answer }))

    // Track this as a pending update
    pendingAnswersRef.current[questionId] = answer

    // Save to API with per-question debounce (prevents cancellation)
    saveAnswerDebounced(questionId, answer, type)
  }

  const handleListeningEnd = () => {
    setAudioEnded(true)
    setReviewTimeStarted(true)
  }

  const handleAudioConfirm = () => {
    setUserConfirmedAudio(true)
    setIsTimerPaused(false) // Resume timer when user confirms
  }

  const scrollToQuestion = (questionNumber: number) => {
    const element = document.getElementById(`question-${questionNumber}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  const handleJumpToQuestion = (questionNumber: number) => {
    if (testData.type === 'reading' && testData.parts) {
      // For reading tests, find the part and question based on sequential numbering
      let globalQuestionNumber = 1
      for (let partIndex = 0; partIndex < testData.parts.length; partIndex++) {
        const part = testData.parts[partIndex]
        const partQuestions = part.questionGroups.flatMap((qg: any) => qg.questions || [])
        // Check if target question is in this part
        if (questionNumber >= globalQuestionNumber && questionNumber < globalQuestionNumber + partQuestions.length) {
          // Switch to this part if not already there
          if (currentPart !== partIndex + 1) {
            setCurrentPart(partIndex + 1)
          }
          // Find the question within this part
          const questionIndexInPart = questionNumber - globalQuestionNumber
          const targetQuestion = partQuestions[questionIndexInPart]
          if (targetQuestion) {
            // Use original questionNumber for scrolling since DOM elements use original numbers
            setTimeout(() => scrollToQuestion(targetQuestion.questionNumber), 100)
          }
          return
        }
        globalQuestionNumber += partQuestions.length
      }
    } else {
      // For other test types, use original logic
      scrollToQuestion(questionNumber)
    }
  }

  const handlePartChange = (partId: number) => {
    setCurrentPart(partId)

    // For tests with parts structure (listening and reading)
    if ((testData?.type === 'listening' || testData?.type === 'reading') && testData.parts) {
      const part = testData.parts[partId - 1]
      if (part && part.questionGroups.length > 0 && part.questionGroups[0].questions.length > 0) {
        setCurrentQuestion(part.questionGroups[0].questions[0].questionNumber)
      }
    } else {
      // For other test types with questionGroups structure
      const group = testData?.questionGroups?.[partId - 1]
      if (group?.questions?.length > 0) {
        setCurrentQuestion(group.questions[0].questionNumber)
      }
    }
  }

  const handleQuestionChange = (questionId: number) => {
    setCurrentQuestion(questionId)
  }

  if (!testData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="loading-spinner w-8 h-8" />
      </div>
    )
  }

  const isListening = String(testData.type).toLowerCase() === 'listening'
  const currentGroup =
    isListening && testData.parts
      ? testData.parts[currentPart - 1]?.questionGroups?.[0]
      : testData?.questionGroups?.[currentPart - 1]

  return (
    <div className="min-h-screen flex flex-col">
      <header className="ielts-header sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-4">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="btn btn-outline btn-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">{testData.title}</h1>
                {testData.type !== 'speaking' && String(testData.instruction || '')?.trim().length > 0 && (
                  <p className="text-sm text-neutral-600">{testData.instruction}</p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {isListening && audioEnded && reviewTimeStarted && (
                <div className="flex items-center space-x-2 text-sm bg-yellow-100 px-3 py-1 rounded">
                  <Clock className="w-4 h-4 text-yellow-600" />
                  <span className="text-yellow-800">Review time: {formatTime(reviewTimeRemaining)}</span>
                </div>
              )}

              <div className="flex items-center space-x-2 text-sm">
                <Clock className="w-4 h-4 text-neutral-600" />
                <span className={timeRemaining < 300 ? 'text-red-600 font-medium' : 'text-neutral-600'}>
                  {formatTime(timeRemaining)}
                  {isListening && isTimerPaused && !userConfirmedAudio && (
                    <span className="ml-2 text-xs text-orange-600 font-medium">(Paused)</span>
                  )}
                </span>
              </div>
              <button onClick={handleSubmit} className="btn btn-primary btn-sm">
                <Send className="w-4 h-4 mr-2" />
                Submit Test
              </button>
            </div>
          </div>
        </div>
      </header>

      {isListening && (
        <div className="bg-white border-b shadow-sm sticky top-20 z-30">
          <div className="max-w-screen-2xl mx-auto px-4 py-4">
            <ListeningAudioPlayer
              audioRef={audioRef}
              audioUrl={fetchAudioFromDirectus(testData.audioUrl)}
              onEnd={handleListeningEnd}
              onAudioConfirm={handleAudioConfirm}
              disableControls={!testData.isPractice}
              initialAudioTime={progress?.remaining_audio_time || undefined}
            />
          </div>
        </div>
      )}

      <div className="flex-1 min-h-0">
        {String(testData.type).toLowerCase() === 'reading' ? (
          (() => {
            // Calculate sequential question mapping for reading
            let globalSequentialNumber = 1
            const sequentialQuestionMap = new Map<string, number>()

            testData.parts.forEach((part: any) => {
              const partQuestions = part.questionGroups.flatMap((qg: any) => qg.questions || [])
              partQuestions.forEach((question: any) => {
                sequentialQuestionMap.set(question.id, globalSequentialNumber)
                globalSequentialNumber++
              })
            })

            return (
              <ReadingTestLayout
                part={testData.parts[currentPart - 1]}
                currentQuestionGroup={0}
                currentPart={currentPart}
                onAnswerChange={handleAnswerChange}
                answers={answers}
                currentQuestion={currentQuestion}
                sequentialQuestionMap={sequentialQuestionMap}
              />
            )
          })()
        ) : isListening && testData.parts ? (
          <ListeningTestLayout
            part={testData.parts[currentPart - 1]}
            currentQuestionGroup={0}
            currentPartNumber={currentPart}
            onAnswerChange={handleAnswerChange}
            answers={answers}
            currentQuestion={currentQuestion}
          />
        ) : String(testData.type).toLowerCase() === 'writing' ? (
          <WritingTestLayout
            part={testData.parts[currentPart - 1]}
            currentQuestionGroup={0}
            onAnswerChange={handleAnswerChange}
            answers={answers as Record<string, string>}
            currentQuestion={currentQuestion}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-screen-2xl mx-auto px-4 py-6 pb-24">
              {currentGroup && (
                <QuestionGroup
                  group={{ ...currentGroup, type: String(testData.type).toLowerCase() }}
                  onAnswerChange={handleAnswerChange}
                  isReadOnly={false}
                  currentQuestion={currentQuestion}
                  answers={answers}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4 text-amber-600">
              <AlertCircle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-medium">Confirm Submission</h3>
            </div>
            <p className="mb-6 text-gray-700">
              Are you sure you want to submit your test? Once submitted, you will not be able to return and make
              changes.
            </p>
            <div className="flex justify-end space-x-3">
              <button onClick={() => setShowConfirmModal(false)} className="btn btn-outline">
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmModal(false)
                  handleConfirmSubmit()
                }}
                className="btn btn-primary">
                Submit Test
              </button>
            </div>
          </div>
        </div>
      )}

      <nav
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 w-full z-50"
        aria-label="Questions">
        <div className="max-w-screen-2xl mx-auto">
          <div className="flex w-full overflow-x-auto justify-start gap-2">
            {(() => {
              if (testData.type === 'reading' && testData.parts) {
                let globalQuestionNumber = 1

                return testData.parts.map((part: any, index: number) => {
                  const partQuestions = part.questionGroups.flatMap((qg: any) => qg.questions || [])
                  const currentPartStartNumber = globalQuestionNumber

                  // Create sequential mapping for this part
                  const sequentialQuestions = partQuestions.map((question: any, qIndex: number) => ({
                    ...question,
                    displayNumber: currentPartStartNumber + qIndex,
                  }))

                  interface SequentialQuestion {
                    id: string
                    questionNumber: number
                    displayNumber: number
                  }

                  // navigation debug suppressed for part preview

                  // Update global counter for next part
                  globalQuestionNumber += partQuestions.length

                  return (
                    <div
                      key={index}
                      className={`flex items-center transition-all duration-200 ${
                        currentPart === index + 1 ? 'flex-shrink-0 w-auto max-w-fit' : 'flex-shrink-0 w-auto'
                      }`}
                      style={{ minWidth: 0 }}>
                      {/* Part Button */}
                      <button
                        role="tab"
                        onClick={() => handlePartChange(index + 1)}
                        className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded transition-colors mr-2 ${
                          currentPart === index + 1
                            ? 'bg-blue-100 text-blue-700 border border-blue-300'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`}>
                        <span>
                          <span aria-hidden="true" className="section-prefix">
                            Part{' '}
                          </span>
                          <span className="sectionNr" aria-hidden="true">
                            {index + 1}
                          </span>
                          <span className="ml-2 text-xs text-gray-500">
                            {partQuestions.filter((q: { id: string }) => answers[q.id]).length} of{' '}
                            {partQuestions.length}
                          </span>
                        </span>
                      </button>

                      {/* Question Buttons - Only show for current part */}
                      {currentPart === index + 1 && (
                        <div className="flex gap-1 flex-shrink-0">
                          {sequentialQuestions.map(
                            (question: { id: string; questionNumber: number; displayNumber: number }) => (
                              <button
                                key={question.id}
                                onClick={() => handleJumpToQuestion(question.displayNumber)}
                                className={`
                              w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                              ${answers[question.id] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                              hover:bg-blue-50 hover:text-blue-700
                            `}>
                                <span className="sr-only">Question {question.displayNumber}</span>
                                <span aria-hidden="true">{question.displayNumber}</span>
                              </button>
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )
                })
              }

              // Listening and other tests fall back to original rendering
              if (isListening && testData.parts) {
                return testData.parts.map((part: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center transition-all duration-200 ${
                      currentPart === index + 1 ? 'flex-shrink-0 w-auto max-w-fit' : 'flex-shrink-0 w-auto'
                    }`}
                    style={{ minWidth: 0 }}>
                    {/* Part Button */}
                    <button
                      role="tab"
                      onClick={() => handlePartChange(index + 1)}
                      className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded transition-colors mr-2 ${
                        currentPart === index + 1
                          ? 'bg-blue-100 text-blue-700 border border-blue-300'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                      }`}>
                      <span>
                        <span aria-hidden="true" className="section-prefix">
                          Part{' '}
                        </span>
                        <span className="sectionNr" aria-hidden="true">
                          {index + 1}
                        </span>
                        <span className="ml-2 text-xs text-gray-500">
                          {
                            part.questionGroups
                              .flatMap((qg: any) => qg.questions || [])
                              .filter((q: { id: string }) => answers[q.id]).length
                          }{' '}
                          of {part.questionGroups.flatMap((qg: any) => qg.questions || []).length}
                        </span>
                      </span>
                    </button>

                    {/* Question Buttons - Only show for current part */}
                    {currentPart === index + 1 && (
                      <div className="flex gap-1 flex-shrink-0">
                        {part.questionGroups
                          .flatMap((qg: any) => qg.questions || [])
                          .map((question: { id: string; questionNumber: number }) => (
                            <button
                              key={question.id}
                              onClick={() => handleQuestionChange(question.questionNumber)}
                              className={`
                            w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                            ${answers[question.id] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                            hover:bg-blue-50 hover:text-blue-700
                          `}>
                              <span className="sr-only">Question {question.questionNumber}</span>
                              <span aria-hidden="true">{question.questionNumber}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                ))
              }

              // suppressed testData debug

              // Other Test Types Navigation
              return testData.questionGroups?.map((group: any, index: number) => (
                <div
                  key={index}
                  className={`flex items-center transition-all duration-200 ${
                    currentPart === index + 1 ? 'flex-shrink-0 w-auto max-w-fit' : 'flex-shrink-0 w-auto'
                  }`}
                  style={{ minWidth: 0 }}>
                  {/* Part Button */}
                  <button
                    role="tab"
                    onClick={() => handlePartChange(index + 1)}
                    className={`flex-shrink-0 px-3 py-2 text-sm font-medium rounded transition-colors mr-2 ${
                      currentPart === index + 1
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                    <span>
                      <span aria-hidden="true" className="section-prefix">
                        Part{' '}
                      </span>
                      <span className="sectionNr" aria-hidden="true">
                        {index + 1}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {group.questions?.filter((q: { id: string }) => answers[q.id]).length} of{' '}
                        {group.questions?.length || 0}
                      </span>
                    </span>
                  </button>

                  {/* Question Buttons - Only show for current part */}
                  {currentPart === index + 1 && group.questions && (
                    <div className="flex gap-1 flex-shrink-0">
                      {group.questions.map((question: { id: string; questionNumber: number }) => (
                        <button
                          key={question.id}
                          onClick={() => handleQuestionChange(question.questionNumber)}
                          className={`
                          w-8 h-8 flex items-center justify-center rounded-full text-sm font-medium
                          ${answers[question.id] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'}
                          hover:bg-blue-50 hover:text-blue-700
                        `}>
                          <span className="sr-only">Question {question.questionNumber}</span>
                          <span aria-hidden="true">{question.questionNumber}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))
            })()}
          </div>
        </div>
      </nav>
    </div>
  )
}
