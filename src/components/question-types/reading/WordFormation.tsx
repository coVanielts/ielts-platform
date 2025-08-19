'use client'

import { RichTextViewer } from '@/components/RichTextViewer'
import { useState } from 'react'

interface WordFormationProps {
  questionRange?: string
  instructions?: string
  title?: string
  content?: string
  keywords?: Array<{
    id: number
    word: string
    expectedAnswer?: string
  }>
  onAnswerChange?: (keywordId: number, value: string) => void
  answers?: Record<number, string>
}

export default function WordFormation({
  questionRange = 'Questions 17–24',
  instructions = 'For each question, use the word in CAPITALS on the right to form a word that fits in the gap.',
  title = 'Word Formation',
  content = '',
  keywords = [],
  onAnswerChange,
  answers: externalAnswers = {},
}: WordFormationProps) {
  const [localAnswers, setLocalAnswers] = useState<Record<number, string>>(externalAnswers)

  // Use either external or local answers
  const answers = externalAnswers || localAnswers

  const handleAnswerChange = (id: number, value: string) => {
    setLocalAnswers(prev => ({
      ...prev,
      [id]: value,
    }))

    if (onAnswerChange) {
      onAnswerChange(id, value)
    }
  }

  const renderContentWithBlanks = () => {
    let processedContent = content

    keywords.forEach(keyword => {
      const placeholder = `[${keyword.id}]`
      processedContent = processedContent.replace(placeholder, `__BLANK_${keyword.id}__`)
    })

    return processedContent.split(/(__BLANK_\d+__)/).map((part, index) => {
      const blankMatch = part.match(/^__BLANK_(\d+)__$/)
      if (blankMatch) {
        const id = parseInt(blankMatch[1])
        const keyword = keywords.find(k => k.id === id)
        return (
          <span key={`blank-${id}`} className="inline-block mx-1">
            <input
              type="text"
              value={answers[id] || ''}
              onChange={e => handleAnswerChange(id, e.target.value)}
              className="w-24 px-2 py-1 border border-gray-300 rounded text-center"
              placeholder={`${id}`}
            />
            {keyword && <span className="ml-1 text-xs text-blue-600 font-semibold">({keyword.word})</span>}
          </span>
        )
      }
      return <span key={index}>{part}</span>
    })
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="font-semibold text-lg mb-2">{questionRange}</h3>
        <p className="text-sm text-gray-600 mb-2">{instructions}</p>
        <div className="font-medium text-gray-800">
          <RichTextViewer content={title} className="prose max-w-none" />
        </div>
      </div>

      <div className="border rounded-lg p-6">
        <div className="text-base leading-relaxed">{renderContentWithBlanks()}</div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <h5 className="font-medium text-gray-800 mb-3">Word Bank:</h5>
          <div className="grid grid-cols-2 gap-2">
            {keywords.map(keyword => (
              <div key={keyword.id} className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-blue-600">{keyword.id}.</span>
                <span className="text-sm font-bold text-gray-800">{keyword.word}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
