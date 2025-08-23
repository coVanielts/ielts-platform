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
}

interface DraggableItemProps {
  id: string
  children: React.ReactNode
  isOverlay?: boolean
}

interface DroppableZoneProps {
  id: string
  isOver?: boolean
  answer?: string
  children?: React.ReactNode
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
const DroppableZone: React.FC<DroppableZoneProps> = ({ id, isOver, answer, children }) => {
  const { setNodeRef } = useDroppable({
    id,
  })

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
        <div className="bg-blue-100 border border-blue-300 rounded-md px-2.5 py-1.5">
          <span className="font-medium text-blue-800 text-[12px] leading-none">{answer}</span>
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
        // Remove from previous question if it was already assigned
        const previousQuestionId = Object.keys(selectedAnswers).find(
          key => selectedAnswers[key] === letterAnswer
        )
        
        // Update the answer for this question with letter (A, B, C, D)
        onAnswerChange(question.id, letterAnswer)
        
        // If the letter was previously assigned to another question, clear that assignment
        if (previousQuestionId && previousQuestionId !== question.id) {
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

  // Check if we have fewer drop zones (questions) than drag items (letters)
  const hasFewerQuestionsThanLetters = answers.length < letters.length
  
  // If we have fewer questions than letters, remove assigned letters (letters disappear when used)
  // If we have more or equal questions, keep all letters available for reuse
  const unassignedLetters = hasFewerQuestionsThanLetters 
    ? letters.filter((letter, index) => {
        const letterLabel = getLetterLabel(index)
        return !Object.values(selectedAnswers).includes(letterLabel)
      }) // Remove assigned letters when questions < letters
    : letters // Keep all letters available for reuse when questions >= letters

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
                  <div className="flex-shrink-0 w-36">
                    <DroppableZone id={`question-${index}`} answer={assignedLetter} />
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
