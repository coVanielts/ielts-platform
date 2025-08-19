import React from 'react'

interface ParagraphOrderingProps {
  questionRange?: string
  instructions?: string
  passage?: {
    title: string
    subtitle?: string
    content: string[]
  }
  paragraphOptions?: Array<{
    id: string
    content: string
  }>
  gapPositions?: number[]
  onAnswerChange?: (gapId: number, value: string) => void
  selectedAnswers?: Record<number, string>
}

const ParagraphOrdering: React.FC<ParagraphOrderingProps> = ({
  questionRange,
  instructions,
  paragraphOptions = [],
  gapPositions = [],
  onAnswerChange,
  selectedAnswers: externalAnswers = {},
}) => {
  const [localAnswers, setLocalAnswers] = React.useState<Record<number, string>>(externalAnswers)

  // Use either external or local answers
  const selectedParagraphs = externalAnswers || localAnswers

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, paragraphId: string) => {
    e.dataTransfer.setData('text/plain', paragraphId)
    e.currentTarget.classList.add('opacity-50')
  }

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('opacity-50')
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.currentTarget.classList.add('bg-blue-100')
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-blue-100')
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, gapId: number) => {
    e.preventDefault()
    e.currentTarget.classList.remove('bg-blue-100')
    const paragraphId = e.dataTransfer.getData('text/plain')

    // If this gap already has a paragraph, swap them
    const existingGapId = Object.entries(selectedParagraphs).find(([, id]) => id === paragraphId)?.[0]
    if (existingGapId) {
      // Remove from old position
      if (onAnswerChange) {
        onAnswerChange(parseInt(existingGapId), '')
      }
      // Place in new position
      if (onAnswerChange) {
        onAnswerChange(gapId, paragraphId)
      }

      const newAnswers = {
        ...selectedParagraphs,
        [parseInt(existingGapId)]: selectedParagraphs[gapId] || '',
        [gapId]: paragraphId,
      }
      setLocalAnswers(newAnswers)

      // If there was a paragraph in the new position, move it to the old position
      if (selectedParagraphs[gapId]) {
        if (onAnswerChange) {
          onAnswerChange(parseInt(existingGapId), selectedParagraphs[gapId])
        }
      }
    } else {
      // Simple placement in empty gap
      const newAnswers = {
        ...selectedParagraphs,
        [gapId]: paragraphId,
      }
      setLocalAnswers(newAnswers)
      if (onAnswerChange) {
        onAnswerChange(gapId, paragraphId)
      }
    }
  }

  const handleRemoveParagraph = (gapId: number) => {
    const newAnswers = { ...selectedParagraphs }
    delete newAnswers[gapId]
    setLocalAnswers(newAnswers)
    if (onAnswerChange) {
      onAnswerChange(gapId, '')
    }
  }

  const renderGap = (gapId: number) => (
    <div
      key={`gap-${gapId}`}
      className={`my-3 px-3 py-2 border-2 rounded transition-colors ${
        selectedParagraphs[gapId] ? 'bg-white border-gray-300' : 'bg-blue-50 border-blue-300'
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={e => handleDrop(e, gapId)}>
      <div className="flex items-center justify-between">
        <button className="bg-blue-600 text-white px-2 py-0.5 rounded text-sm font-medium mr-2">{gapId}</button>
        {selectedParagraphs[gapId] ? (
          <button onClick={() => handleRemoveParagraph(gapId)} className="text-red-600 hover:text-red-800 text-sm">
            ✕
          </button>
        ) : (
          <span className="text-gray-500 text-sm">Drop a paragraph here</span>
        )}
      </div>
      {selectedParagraphs[gapId] && (
        <div className="mt-1 text-gray-800 text-sm">
          {paragraphOptions.find(p => p.id === selectedParagraphs[gapId])?.content}
        </div>
      )}
    </div>
  )

  // Get all used paragraph IDs
  const usedParagraphIds = Object.values(selectedParagraphs).filter(id => id !== '')

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{questionRange}</h3>
        <p className="text-sm text-gray-600">{instructions}</p>
        <p className="text-sm text-blue-600 mt-2">Drag paragraphs from below to fill the gaps in the passage</p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium text-gray-800">Available Paragraphs:</h4>

        <div className="grid gap-4">
          {paragraphOptions
            .filter(paragraph => !usedParagraphIds.includes(paragraph.id))
            .map(paragraph => (
              <div
                key={paragraph.id}
                draggable
                onDragStart={e => handleDragStart(e, paragraph.id)}
                onDragEnd={handleDragEnd}
                className="bg-white border border-gray-300 rounded p-3 cursor-move hover:bg-gray-50 transition-colors">
                <div className="text-sm text-gray-800 leading-relaxed">
                  <span className="font-semibold mr-2">{paragraph.id}.</span>
                  {paragraph.content}
                </div>
              </div>
            ))}
        </div>

        <div className="mt-6">
          <h4 className="font-medium text-gray-800 mb-4">Gap Positions:</h4>
          <div className="space-y-3">{gapPositions.map(gapId => renderGap(gapId))}</div>
        </div>
      </div>
    </div>
  )
}

export default ParagraphOrdering
