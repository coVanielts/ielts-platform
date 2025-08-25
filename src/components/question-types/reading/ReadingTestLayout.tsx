'use client'

import { HighlightableText } from '@/components/HighlightableText'
import { RichTextViewer } from '@/components/RichTextViewer'
import { QuestionGroup } from '@/components/question-types/QuestionGroup'
import { useHighlight } from '@/hooks/useHighlight'
import { useResizablePanes } from '@/hooks/useResizablePanes'
import type { ReadingPart } from '@/types/test.type'
import { useEffect, useRef } from 'react'

interface ReadingTestLayoutProps {
  part: ReadingPart
  currentQuestionGroup: number
  onAnswerChange: (questionId: string, answer: unknown) => void
  answers?: Record<string, unknown>
  currentQuestion?: number
  onQuestionChange?: (questionNumber: number) => void
  currentPart?: number
  sequentialQuestionMap?: Map<string, number>
  savingQuestions?: Set<string>
}

export default function ReadingTestLayout({ 
  part, 
  currentQuestionGroup, 
  onAnswerChange, 
  currentQuestion, 
  answers,
  currentPart,
  sequentialQuestionMap,
  savingQuestions
}: ReadingTestLayoutProps) {
  const { leftWidth, rightWidth, isResizing, containerRef, startResize } = useResizablePanes({
    initialLeftWidth: 40,
    minWidth: 30,
    maxWidth: 70,
  })

  const highlightHook = useHighlight()
  const rightPanelScrollRef = useRef<HTMLDivElement>(null)
  const leftPanelScrollRef = useRef<HTMLDivElement>(null)
  const lastPartRef = useRef<string | null>(null)

  // Calculate sequential range for the current part from the provided mapping
  const partQuestions = part.questionGroups.flatMap(qg => qg.questions || [])
  const partSequentialStart = sequentialQuestionMap ? 
    (partQuestions.length > 0 ? sequentialQuestionMap.get(partQuestions[0].id) || 1 : 1) : 1
  const partSequentialEnd = sequentialQuestionMap ? 
    (partQuestions.length > 0 ? sequentialQuestionMap.get(partQuestions[partQuestions.length - 1].id) || partQuestions.length : partQuestions.length) : partQuestions.length
  
  // Simple scroll to top when part changes
  useEffect(() => {
    const currentPartId = `reading-part-${currentPart || part.partNumber}`
    const partChanged = lastPartRef.current !== currentPartId
    
    if (partChanged) {
      lastPartRef.current = currentPartId
      
      // Use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => {
        // Always scroll to top when part changes
        if (rightPanelScrollRef.current) {
          rightPanelScrollRef.current.scrollTop = 0
        }
        if (leftPanelScrollRef.current) {
          leftPanelScrollRef.current.scrollTop = 0
        }
        
        // Use setTimeout to override question scrollIntoView (which has 100ms delay)
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
  }, [part.id, part.partNumber, currentPart, currentQuestionGroup])

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleHighlight = (_text: string) => {}

  return (
    <div
      ref={containerRef}
      className={`flex h-screen max-h-screen overflow-hidden ${isResizing ? 'select-none' : ''}`}
      key={`reading-layout-${part.id}`} // Force re-render when part changes
    >
      {/* Left Panel - Reading Passage */}
      <div
        className="min-w-0 bg-white border-r border-gray-300 shadow-sm transition-all duration-150 flex flex-col"
        style={{ width: `${leftWidth}%` }}>
        {/* Fixed Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm flex-shrink-0">
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Reading Passage {part.partNumber}</h2>

          <p className="text-sm text-gray-600">
            Questions {partSequentialStart} - {partSequentialEnd}
          </p>
        </div>

        {/* Scrollable Content */}
        <div ref={leftPanelScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="px-4 pt-8 pb-16">{/* Increased top padding from py-4 to pt-8 */}
            {part.passage.contentDoc ? (
              <div className="prose prose-gray max-w-3xl mx-auto text-[13px] leading-snug">
                <RichTextViewer content={part.passage.contentDoc} enableSelectionHighlight className="text-[13px] leading-snug" />
              </div>
            ) : (
              <div className="prose prose-gray max-w-none text-[13px] leading-snug">
                <HighlightableText
                  text={part.passage.content || ''}
                  onHighlight={handleHighlight}
                  className="text-[13px] leading-snug text-gray-800 select-text"
                  highlightHook={highlightHook}
                />
              </div>
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

      {/* Right Panel - Questions */}
      <div
        className="min-w-0 bg-gray-50 transition-all duration-150 flex flex-col text-[13px]"
        style={{ width: `${rightWidth}%` }}
      >
        {/* Fixed Header */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-3 shadow-sm flex-shrink-0">
          <h3 className="text-base font-semibold text-gray-900 mb-0.5">Part {part.partNumber} Questions</h3>
          <p className="text-[13px] text-gray-500">
            Questions {partSequentialStart} - {partSequentialEnd}
          </p>
        </div>

        {/* Scrollable Content */}
        <div ref={rightPanelScrollRef} className="flex-1 overflow-y-auto overflow-x-hidden scroll-smooth">
          <div className="px-2.5 pt-6 pb-14">{/* Increased top padding from py-3 to pt-6 */}
            {/* Render All Question Groups */}
            <div className="space-y-2.5">
              {part.questionGroups.map(group => (
                <div key={group.id} className="bg-white rounded-md border border-gray-200">
                  {/* Question Group Header */}
                  <div className="border-b border-gray-100 px-3.5 py-2.5 bg-white rounded-t-md">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[14px] font-semibold text-gray-900">
                        {group.questionType.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </h4>
                      <span className="text-[11px] text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                        Questions {(() => {
                          const groupQuestions = group.questions || []
                          if (groupQuestions.length === 0) return `${group.startQuestion || ''} - ${group.endQuestion || ''}`
                          if (sequentialQuestionMap) {
                            const firstSequential = sequentialQuestionMap.get(groupQuestions[0].id)
                            const lastSequential = sequentialQuestionMap.get(groupQuestions[groupQuestions.length - 1].id)
                            if (firstSequential && lastSequential) {
                              return `${firstSequential} - ${lastSequential}`
                            }
                          }
                          // Fallback to original question numbers
                          return `${group.startQuestion || ''} - ${group.endQuestion || ''}`
                        })()} 
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-2">
                      {group.titleDoc ? (
                        <RichTextViewer
                          content={group.titleDoc}
                          className="prose max-w-none text-blue-800 text-[12px]"
                          enableSelectionHighlight
                        />
                      ) : (
                        <p className="text-[12px] text-blue-800">
                          <strong>Instructions:</strong>{' '}
                          <HighlightableText
                            text={
                              group.instruction ||
                              (typeof (group as unknown as { title?: string }).title === 'string'
                                ? (group as unknown as { title?: string }).title
                                : '') ||
                              ''
                            }
                            enableInternalHighlight
                          />
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Question Group Content */}
                  <div className="px-4 py-3">
                    <QuestionGroup
                      group={{ ...group, type: 'reading', sequentialQuestionMap }}
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
