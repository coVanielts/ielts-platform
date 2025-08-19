'use client'

import { RichTextViewer } from '@/components/RichTextViewer'
import { useResizablePanes } from '@/hooks/useResizablePanes'
import type { TiptapContent } from '@/types/writing.type'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
interface WritingQuestion {
  id: number
  order: number
  title?: TiptapContent
  choices?: unknown
  correct_answers?: unknown[]
  question_group: number
  titleDoc?: TiptapContent
}

interface WritingQuestionGroup {
  id: number
  type: string
  order: number
  title?: TiptapContent
  content?: TiptapContent
  titleDoc?: TiptapContent
  contentDoc?: TiptapContent
  answers?: unknown
  letters?: unknown
  max_number_of_words?: number
  speaking_time?: number
  choices?: unknown
  questions: WritingQuestion[]
  images?: Array<{ id?: string; url?: string }>
}

interface WritingTestPart {
  id: number
  order: number
  paragraph?: unknown
  question_groups: Array<{ question_groups_id: WritingQuestionGroup }>
}

interface WritingTestLayoutProps {
  part: WritingTestPart
  currentQuestionGroup: number
  onAnswerChange: (questionId: string, answer: string, type?: 'writing' | 'speaking') => void
  answers?: Record<string, string>
  currentQuestion?: number
  onQuestionChange?: (questionNumber: number) => void
}

export default function WritingTestLayout({ part, onAnswerChange, answers = {} }: WritingTestLayoutProps) {
  const { leftWidth, rightWidth, isResizing, containerRef, startResize } = useResizablePanes({
    initialLeftWidth: 50,
    minWidth: 30,
    maxWidth: 70,
  })

  const rightPanelScrollRef = useRef<HTMLDivElement>(null)
  const leftPanelScrollRef = useRef<HTMLDivElement>(null)
  const [localAnswers, setLocalAnswers] = useState<Record<string, string>>((answers as Record<string, string>) || {})

  // Debounce timeouts for each question
  const timeoutRefs = useRef<Record<string, NodeJS.Timeout>>({})

  useEffect(() => {
    if (answers) {
      setLocalAnswers(answers)
    }
  }, [answers])

  useEffect(() => {
    if (rightPanelScrollRef.current) {
      rightPanelScrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }

    // Scroll left panel (content) to top
    if (leftPanelScrollRef.current) {
      leftPanelScrollRef.current.scrollTo({
        top: 0,
        behavior: 'smooth',
      })
    }
  }, [part.id, part.order])

  // Debounced answer change handler
  const handleAnswerChangeDebounced = useCallback(
    (questionId: string, answer: string) => {
      // Clear existing timeout for this question
      if (timeoutRefs.current[questionId]) {
        clearTimeout(timeoutRefs.current[questionId])
      }

      // Set new timeout for this question
      timeoutRefs.current[questionId] = setTimeout(() => {
        onAnswerChange(questionId, answer, 'writing')
      }, 1000) // 1 second debounce
    },
    [onAnswerChange],
  )

  const handleAnswerChange = (questionId: string, answer: unknown) => {
    const answerText = answer as string
    setLocalAnswers(prev => ({
      ...prev,
      [questionId]: answerText,
    }))
    // Call debounced function instead of immediate save
    handleAnswerChangeDebounced(questionId, answerText)
  }

  // Get task type and requirements
  const getTaskInfo = (questionGroup: WritingQuestionGroup) => {
    const taskType = questionGroup.id === 10 ? 'Task 1' : 'Task 2'
    const minWords = questionGroup.id === 10 ? 150 : 250
    const timeLimit = questionGroup.id === 10 ? 20 : 40

    return { taskType, minWords, timeLimit }
  }

  // Calculate word count for a given text
  const getWordCount = (text: string) => {
    return text
      .trim()
      .split(/\s+/)
      .filter(word => word.length > 0).length
  }

  // Get word count color based on requirements
  const getWordCountColor = (count: number, minWords: number) => {
    if (count >= minWords) return 'text-green-600'
    if (count >= minWords * 0.8) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      Object.values(timeoutRefs.current).forEach(timeout => clearTimeout(timeout))
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className={`flex h-full overflow-hidden ${isResizing ? 'select-none' : ''}`}
      key={`writing-layout-${part.id}`}>
      {/* Left Panel - Writing Instructions and Content */}
      <div
        className="min-w-0 bg-white border-r border-gray-300 shadow-sm transition-all duration-150 flex flex-col"
        style={{ width: `${leftWidth}%` }}>
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">Writing Test - Part {part.order}</h2>
          </div>
        </div>

        {/* Scrollable Content */}
        <div ref={leftPanelScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="px-6 py-6 pb-20 space-y-8">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {((part as any).question_groups || (part as any).questionGroups || []).map(
              (groupWrapper: any, index: number) => {
                const group = groupWrapper.question_groups_id || groupWrapper

                return (
                  <div key={group.id} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                    {/* Instructions */}
                    {group.titleDoc && (
                      <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
                        <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                          <RichTextViewer
                            content={group.titleDoc}
                            className="prose prose-blue max-w-none text-blue-800"
                          />
                        </div>
                      </div>
                    )}

                    {/* Main Content */}
                    {group.contentDoc && (
                      <div className="px-6 py-6">
                        <div className="prose prose-gray max-w-none">
                          <RichTextViewer content={group.contentDoc} />
                        </div>
                      </div>
                    )}

                    {/* Images if any */}
                    {group.images && group.images.length > 0 && (
                      <div className="px-6 py-4 border-t border-gray-100">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {group.images &&
                            group.images.map((image: { id?: string; url?: string }, imageIndex: number) => (
                              <div key={imageIndex} className="border border-gray-200 rounded-lg overflow-hidden">
                                <Image
                                  src={image.url || ''}
                                  alt={`Task ${index + 1} visual ${imageIndex + 1}`}
                                  className="w-full h-auto"
                                  width={400}
                                  height={300}
                                />
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              },
            )}
          </div>
        </div>
      </div>

      {/* Resizable Divider */}
      <button
        type="button"
        className={`w-1 bg-gray-300 hover:bg-blue-400 cursor-col-resize transition-colors flex-shrink-0 ${
          isResizing ? 'bg-blue-500' : ''
        }`}
        onMouseDown={startResize}
        aria-label="Resize panels">
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-0.5 h-8 bg-gray-400 rounded"></div>
        </div>
      </button>

      {/* Right Panel - Writing Area */}
      <div className="min-w-0 bg-gray-50 transition-all duration-150 flex flex-col" style={{ width: `${rightWidth}%` }}>
        {/* Scrollable Content */}
        <div ref={rightPanelScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="px-6 py-6 pb-20">
            {/* Render All Question Groups */}
            <div className="space-y-6">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {((part as any).question_groups || (part as any).questionGroups || []).map(
                (groupWrapper: any, groupIndex: number) => {
                  const group = groupWrapper.question_groups_id || groupWrapper
                  const { taskType, minWords } = getTaskInfo(group)

                  return (
                    <div key={group.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                      {/* Writing Questions */}
                      <div className="px-6 py-4 space-y-4">
                        {group.questions.map((question: WritingQuestion, questionIndex: number) => {
                          const questionId = question.id?.toString() || `${group.id}-${questionIndex}`
                          const currentAnswer = localAnswers[questionId] || ''
                          const wordCount = getWordCount(currentAnswer)

                          return (
                            <div key={questionId} id={`writing-q-${group.id}-${questionIndex}`} className="space-y-3">
                              {/* Question Title */}
                              {question.titleDoc && (
                                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                  <RichTextViewer
                                    content={question.titleDoc}
                                    className="prose max-w-none text-green-800"
                                  />
                                </div>
                              )}

                              {/* Word Count Display */}
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-600">
                                  Write your {taskType.toLowerCase().includes('task 1') ? 'report' : 'essay'} here:
                                </span>
                                <span className={`font-medium ${getWordCountColor(wordCount, minWords)}`}>
                                  📝 Words: {wordCount}/{minWords}
                                </span>
                              </div>

                              {/* Writing Textarea */}
                              <textarea
                                value={currentAnswer}
                                onChange={e => handleAnswerChange(questionId, e.target.value)}
                                className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                style={{ minHeight: '400px' }}
                                placeholder={`Write your ${taskType.toLowerCase().includes('task 1') ? 'report' : 'essay'} here...\n\nRemember to:\n• Write at least ${minWords} words\n• Structure your response clearly\n• Use appropriate vocabulary and grammar\n• Stay on topic\n• Check your spelling and grammar`}
                                aria-label={`Writing area for ${taskType}`}
                              />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                },
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
