import {
  closestCenter,
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import React, { useState } from 'react'
import RichTextViewer from '../../RichTextViewer'

interface MatchingLettersDragDropProps {
  questionRange?: string
  instructions?: string
  answers: string[]      // List of questions/statements to be matched
  letters: string[]      // List of options to drag and drop
  onAnswerChange?: (questionId: string, value: string) => void
  selectedAnswers?: { [key: string]: string }
  questions: Array<{
    id: string
    order: number
  }>
  keepMatchingChoices?: boolean // When true, keep choices available after use
}

interface DraggableItemProps {
  id: string
  children: React.ReactNode
  isOverlay?: boolean
}

interface DroppableZoneProps {
  id: string
  isOver?: boolean
  answer?: string | string[]
  children?: React.ReactNode
  letters?: string[]
}

// Draggable component for letters
const DraggableItem: React.FC<DraggableItemProps> = ({ id, children, isOverlay = false }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-blue-100 border border-blue-300 rounded-md px-2.5 py-2 cursor-move
        hover:bg-blue-200 transition-colors duration-200
        ${isDragging ? 'shadow-lg' : 'shadow-sm'}
        ${isOverlay ? 'rotate-3' : ''}
      `}
    >
      <span className="font-medium text-blue-800 text-[12px] leading-none">{children}</span>
    </div>
  )
}

// Droppable zone for each question
const DroppableZone: React.FC<DroppableZoneProps> = ({ id, isOver, answer, children, letters = [] }) => {
  const { setNodeRef } = useDroppable({
    id,
  })

  // Helper to get full text for display
  const getAnswerDisplayText = (letterAnswer: string | undefined | string[]) => {
    // Handle array input - extract first element
    let actualLetter: string
    if (Array.isArray(letterAnswer)) {
      actualLetter = letterAnswer[0] || ''
    } else {
      actualLetter = letterAnswer || ''
    }
    
    // Early return for invalid inputs
    if (!actualLetter || typeof actualLetter !== 'string') {
      return actualLetter || ''
    }
    
    // Early return if no letters available
    if (!letters || !Array.isArray(letters) || letters.length === 0) {
      return actualLetter
    }
    
    // Find the letter index (A=0, B=1, etc.)
    const letterIndex = actualLetter.charCodeAt(0) - 65
    
    // Validate index and return full text
    if (letterIndex >= 0 && letterIndex < letters.length && letters[letterIndex]) {
      return `${actualLetter}. ${letters[letterIndex]}`
    }
    
    // Fallback to just the letter
    return actualLetter
  }

  // If this is the available letters area, render children directly
  if (id === 'available-letters') {
    return (
      <div ref={setNodeRef}>
        {children}
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      className={`
        border-2 border-dashed rounded-md p-2.5 min-h-[44px]
        flex items-center justify-center transition-colors duration-200
        ${isOver ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}
        ${answer ? 'border-blue-400 bg-blue-50' : ''}
      `}
    >
      {answer ? (
        <div className="bg-blue-100 border border-blue-300 rounded-md px-2 py-1">
          <span className="font-medium text-blue-800 text-[10px] leading-tight">
            {getAnswerDisplayText(answer)}
          </span>
        </div>
      ) : (
        <span className="text-gray-400 text-[12px] leading-none">Drop here</span>
      )}
    </div>
  )
}

const MatchingLettersDragDrop: React.FC<MatchingLettersDragDropProps> = ({
  questionRange,
  instructions,
  answers = [],
  letters = [],
  onAnswerChange,
  selectedAnswers = {},
  questions = [],
  keepMatchingChoices = false,
}) => {
  const [activeId, setActiveId] = useState<string | null>(null)

  // Helper function to get letter label (A, B, C, etc.)
  const getLetterLabel = (index: number) => {
    return String.fromCharCode(65 + index); // A=65, B=66, etc.
  };

  // Helper function to get display text with letter prefix
  const getDisplayText = (letter: string, index: number) => {
    return `${getLetterLabel(index)}. ${letter}`;
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeId = active.id as string
    const overId = over.id as string

    // Convert full text back to letter (A, B, C, D)
    const letterIndex = letters.findIndex(letter => letter === activeId)
    const letterAnswer = letterIndex >= 0 ? getLetterLabel(letterIndex) : activeId

    // If dropping on a question zone
    if (overId.startsWith('question-')) {
      const questionIndex = parseInt(overId.replace('question-', ''), 10)
      const question = questions[questionIndex]
      
      if (question && onAnswerChange) {
        // Find previous question assignment (handle array or string values)
        const previousQuestionId = Object.keys(selectedAnswers).find(key => {
          const val = selectedAnswers[key]
          if (Array.isArray(val)) {
            return val[0] === letterAnswer
          }
          return val === letterAnswer
        })

        // Update the answer for this question with letter (A, B, C, D)
        onAnswerChange(question.id, letterAnswer)

        // If reuse is NOT allowed, clear previous assignment so letter can't appear twice
        if (!keepMatchingChoices && previousQuestionId && previousQuestionId !== question.id) {
          onAnswerChange(previousQuestionId, '')
        }
      }
    }
    // If dropping back to available letters area
    else if (overId === 'available-letters') {
      // Find which question this letter was assigned to and clear it
      const assignedQuestionId = Object.keys(selectedAnswers).find(
        key => selectedAnswers[key] === letterAnswer
      )
      
      if (assignedQuestionId && onAnswerChange) {
        onAnswerChange(assignedQuestionId, '')
      }
    }

    setActiveId(null)
  }

  // Determine how to handle letter availability based on keepMatchingChoices flag
  // This logic works on initial render (including page reload) and after each drag action
  const unassignedLetters = (() => {
    if (keepMatchingChoices) {
      // TRUE: Always show all letters (allow reuse)
      // User can drag the same letter to multiple questions
      return letters
    } else {
      // FALSE: Remove already assigned letters from available choices
      // Letters disappear when used, preventing reuse
      // This works on reload because selectedAnswers contains existing answers
      
      // Extract actual used letters, handling both string and array values
      const usedLetters = Object.values(selectedAnswers).map(answer => {
        if (Array.isArray(answer)) {
          return answer[0] || '' // Extract first element if array
        }
        return answer || '' // Use directly if string
      }).filter(letter => letter !== '') // Remove empty values
      
      const availableLetters = letters.filter((letter, index) => {
        const letterLabel = getLetterLabel(index)
        const isAlreadyUsed = usedLetters.includes(letterLabel)
        return !isAlreadyUsed; // Only show letters that haven't been used
      })
      
  return availableLetters
    }
  })()

  // Compute display range if not provided
  const displayRange = (() => {
    if (questionRange && questionRange.trim()) return questionRange
    if (questions && questions.length) {
      const orders = questions.map(q => q.order).filter(n => typeof n === 'number') as number[]
      if (orders.length) {
        const min = Math.min(...orders)
        const max = Math.max(...orders)
        return `Questions ${min} - ${max}`
      }
    }
    return ''
  })()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-[260px_1fr] gap-4 items-start">
        {/* Available Letters (sticky left) */}
        <div className="md:sticky md:top-2 self-start">
          <h4 className="text-sm font-semibold mb-2 text-gray-700">Available Options:</h4>
          <SortableContext items={unassignedLetters} strategy={verticalListSortingStrategy}>
            <DroppableZone id="available-letters" answer="">
              <div className="grid grid-cols-2 gap-2 p-2 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                {unassignedLetters.map((letter, index) => {
                  const originalIndex = letters.findIndex(l => l === letter)
                  return (
                    <DraggableItem key={letter} id={letter}>
                      {getDisplayText(letter, originalIndex)}
                    </DraggableItem>
                  )
                })}
              </div>
            </DroppableZone>
          </SortableContext>
        </div>

        {/* Questions (right) */}
        <div className="space-y-3 text-[13px]">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-gray-700">Match each statement with the correct option:</h4>
          </div>
          {answers.map((answer, index) => {
            const question = questions[index]
            const assignedLetter = question ? selectedAnswers[question.id] : ''

            return (
              <div key={index} className="border border-gray-200 rounded-md p-2.5 bg-white">
                <div className="flex gap-3 items-start">
                  {/* Number */}
                  <div className="flex-shrink-0 w-7 text-right">
                    <span className="font-bold text-gray-700 text-[13px]">
                      {question?.order || index + 1}.
                    </span>
                  </div>

                  {/* Text */}
                  <div className="flex-1 leading-snug">
                    <RichTextViewer content={answer} enableSelectionHighlight />
                  </div>

                  {/* Drop Zone */}
                  <div className="flex-shrink-0 w-44">
                    <DroppableZone id={`question-${index}`} answer={assignedLetter} letters={letters} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeId ? (
            <DraggableItem id={activeId} isOverlay>
              {(() => {
                const letterIndex = letters.findIndex(letter => letter === activeId)
                return letterIndex >= 0 ? getDisplayText(activeId, letterIndex) : activeId
              })()}
            </DraggableItem>
          ) : null}
        </DragOverlay>
      </div>
    </DndContext>
  )
}

export default MatchingLettersDragDrop
