'use client'

import { HighlightableText } from '@/components/HighlightableText'
import { RichTextViewer } from '@/components/RichTextViewer'
import { QuestionGroup } from '@/components/question-types/QuestionGroup'
import { useHighlight } from '@/hooks/useHighlight'
import { useResizablePanes } from '@/hooks/useResizablePanes'
import { ListeningTestPart } from '@/types/listening.type'
import { useEffect, useRef } from 'react'

interface ListeningTestLayoutProps {
  part: ListeningTestPart
  currentQuestionGroup: number
  currentPartNumber?: number
  onAnswerChange: (questionId: string, answer: unknown) => void
  answers?: Record<string, unknown>
  currentQuestion?: number
  onQuestionChange?: (questionNumber: number) => void
  savingQuestions?: Set<string>
}

export default function ListeningTestLayout({
  part,
  currentPartNumber,
  onAnswerChange,
  currentQuestion,
  answers,
  savingQuestions,
}: ListeningTestLayoutProps) {
  const { leftWidth, rightWidth, isResizing, containerRef, startResize } = useResizablePanes({
    initialLeftWidth: 40, // Listening usually needs less space for content
    minWidth: 25,
    maxWidth: 60,
  })

  const highlightHook = useHighlight()
  const rightPanelScrollRef = useRef<HTMLDivElement>(null)
  const leftPanelScrollRef = useRef<HTMLDivElement>(null)
  const lastPartRef = useRef<string | null>(null)
  
  const hasContent = part.questionGroups.some(
    (group: { content?: unknown; questionType?: string }) => group.content && group.questionType !== 'gap_fill_write_words',
  )

  // Calculate the actual part number to display
  const displayPartNumber = currentPartNumber || part.partNumber

  // Simple scroll to top when part changes
  useEffect(() => {
    const currentPartId = `listening-part-${displayPartNumber}`
    const partChanged = lastPartRef.current !== currentPartId
    
    if (partChanged) {
      lastPartRef.current = currentPartId
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Always scroll to top when part changes, with offset to account for fixed headers
        if (rightPanelScrollRef.current) {
          rightPanelScrollRef.current.scrollTop = 0
        }
        if (leftPanelScrollRef.current) {
          leftPanelScrollRef.current.scrollTop = 0
        }
        
        // Use setTimeout to override question scrollIntoView (which has 100ms delay)
        // The increased padding (pt-12, pt-8) ensures content is visible above fixed headers
        setTimeout(() => {
          if (rightPanelScrollRef.current) {
            rightPanelScrollRef.current.scrollTop = 0
          }
          if (leftPanelScrollRef.current) {
            leftPanelScrollRef.current.scrollTop = 0
          }
        }, 150)
      })
    }
  }, [part.id, displayPartNumber])

  // If no content, render single column layout
  if (!hasContent) {
    return (
      <div className="h-full overflow-y-auto" key={`listening-single-layout-${part.id}`}>
        <div className="max-w-screen-2xl mx-auto px-4 py-6 pb-24">
          {/* Current Part Title */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Part {displayPartNumber} of 4</h2>
            <p className="text-gray-600">{part.instruction}</p>
          </div>

          {/* Render all question groups */}
          <div className="space-y-8">
            {part.questionGroups.map(group => (
              <div key={group.id}>
                <QuestionGroup
                  group={{ ...group, type: 'listening' }}
                  onAnswerChange={onAnswerChange}
                  isReadOnly={false}
                  currentQuestion={currentQuestion}
                  answers={answers}
                  savingQuestions={savingQuestions}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Split-screen layout when content exists
  return (
    <div
      ref={containerRef}
      className={`flex h-screen max-h-screen overflow-hidden ${isResizing ? 'select-none' : ''}`}
      key={`listening-split-layout-${part.id}`}>
      {/* Left Panel - Listening Content/Passage */}
      <div
        className="min-w-0 bg-white border-r border-gray-300 shadow-sm transition-all duration-150 flex flex-col"
        style={{ width: `${leftWidth}%` }}>
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Listening Part {displayPartNumber}</h2>
          <p className="text-sm text-gray-600">
            Questions{' '}
            {part.questionGroups
              .flatMap(g => g.questions)
              .map(q => q.questionNumber)
              .sort((a, b) => a - b)[0] || ''}{' '}
            -{' '}
            {part.questionGroups
              .flatMap(g => g.questions)
              .map(q => q.questionNumber)
              .sort((a, b) => b - a)[0] || ''}
          </p>
        </div>

        {/* Scrollable Content */}
        <div ref={leftPanelScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="px-6 pt-12 pb-20">{/* Increased top padding from py-6 to pt-12 */}
            {part.questionGroups.map(group => {
              if (!group.content) return null

              return (
                <div key={`content-${group.id}`} className="mb-8">
                  {/* Group Title if exists */}
                  {group.title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{group.title}</h3>}

                  {/* Render content based on type */}
                  {typeof group.content === 'object' && group.content ? (
                    <div className="prose prose-gray max-w-none">
                      <RichTextViewer content={group.content} enableSelectionHighlight />
                    </div>
                  ) : typeof group.content === 'string' ? (
                    <div className="prose prose-gray max-w-none">
                      <HighlightableText
                        text={group.content}
                        className="text-base leading-relaxed text-gray-800 select-text"
                        highlightHook={highlightHook}
                      />
                    </div>
                  ) : null}
                </div>
              )
            })}
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

      {/* Right Panel - Questions */}
      <div className="min-w-0 bg-gray-50 transition-all duration-150 flex flex-col" style={{ width: `${rightWidth}%` }}>
        {/* Fixed Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 shadow-sm flex-shrink-0">
          <h3 className="text-md font-semibold text-gray-900 mb-1">Part {displayPartNumber} Questions</h3>
          <p className="text-xs text-gray-500">
            Questions{' '}
            {part.questionGroups
              .flatMap(g => g.questions)
              .map(q => q.questionNumber)
              .sort((a, b) => a - b)[0] || ''}{' '}
            -{' '}
            {part.questionGroups
              .flatMap(g => g.questions)
              .map(q => q.questionNumber)
              .sort((a, b) => b - a)[0] || ''}
          </p>
        </div>

        {/* Scrollable Content */}
        <div ref={rightPanelScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="px-4 pt-8 pb-20">{/* Increased top padding from py-4 to pt-8 */}
            {/* Render All Question Groups */}
            <div className="space-y-4">
              {part.questionGroups.map(group => (
                <div key={group.id} className="bg-white rounded-lg border border-gray-200 shadow-sm">
                  {/* Question Group Header */}
                  <div className="border-b border-gray-100 px-4 py-2 bg-white rounded-t-lg">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {group.questionType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </h4>
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        Questions {group.questions.map(q => q.questionNumber).sort((a, b) => a - b)[0]} -{' '}
                        {group.questions.map(q => q.questionNumber).sort((a, b) => b - a)[0]}
                      </span>
                    </div>

                    {/* Group Title/Instructions */}
                    {group.title && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                        <p className="text-xs text-blue-800">
                          <strong>Instructions:</strong>{' '}
                          <HighlightableText text={group.title} enableInternalHighlight />
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Question Group Content */}
                  <div className="px-4 py-3">
                    <QuestionGroup
                      group={{ ...group, type: 'listening' }}
                      onAnswerChange={onAnswerChange}
                      isReadOnly={false}
                      currentQuestion={currentQuestion}
                      answers={answers}
                      savingQuestions={savingQuestions}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
