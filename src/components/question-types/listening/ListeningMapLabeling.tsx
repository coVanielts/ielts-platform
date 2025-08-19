import Image from 'next/image'
import React, { useState } from 'react'
import { HighlightableText } from '../../HighlightableText'

interface MapLabelingProps {
  questionRange: string
  instructions: string
  questions: Array<{
    id: string
    questionNumber: number
    label: string
    description?: string
  }>
  options?: string[]
  selectedAnswers: Record<string, string>
  onAnswerChange: (questionId: string, answer: string) => void
  isReadOnly?: boolean
  content?: string // HTML content from editor (can include map image, diagrams, etc.)
  mapDescription?: string
  images?: Array<{ id: string; url: string }> // Directus images
}

const ListeningMapLabeling: React.FC<MapLabelingProps> = ({
  questionRange,
  instructions,
  questions,
  selectedAnswers,
  onAnswerChange,
  isReadOnly = false,
  content,
  mapDescription,
  images = [],
}) => {
  const [imageError, setImageError] = useState<Record<string, boolean>>({})

  const handleAnswerChange = (questionId: string, value: string) => {
    if (isReadOnly) return
    onAnswerChange(questionId, value)
  }

  // Remove validation and completion logic

  const handleImageError = (imageId: string) => {
    setImageError(prev => ({ ...prev, [imageId]: true }))
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Question Header */}
      {(questionRange || instructions) && (
        <div className="bg-gray-50 border-b border-gray-200 p-4 rounded-t-lg">
          <div className="flex items-start justify-between">
            <div>
              {questionRange && <h3 className="text-lg font-semibold text-gray-900 mb-1">{questionRange}</h3>}
              {instructions && (
                <div className="text-gray-600 text-sm">
                  <HighlightableText text={instructions} enableInternalHighlight />
                </div>
              )}
            </div>
            {isReadOnly && (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Review Mode</span>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Map Display */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">🗺️ Map/Diagram</h4>

            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              {images.length > 0 ? (
                <div className="space-y-4">
                  {images.map((image, index) => (
                    <div key={image.id || index} className="w-full">
                      {!imageError[image.id] ? (
                        <div className="relative">
                          <Image
                            width={600}
                            height={600}
                            src={image.url}
                            alt={`Map ${index + 1}`}
                            className="w-full h-auto max-h-96 object-contain rounded"
                            onError={() => handleImageError(image.id)}
                          />
                        </div>
                      ) : (
                        <div className="w-full h-80 bg-gray-200 rounded flex items-center justify-center">
                          <div className="text-center p-8">
                            <div className="text-4xl mb-2">🗺️</div>
                            <p className="text-sm text-gray-600">Map image (Authentication required)</p>
                            <p className="text-xs text-gray-500 mt-1">File ID: {image.id}</p>
                            <button
                              onClick={() => window.open(image.url, '_blank')}
                              className="mt-2 text-xs text-blue-600 hover:text-blue-800 underline">
                              View in new tab
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : content ? (
                <div className="w-full min-h-80 rounded" dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                <div className="w-full h-80 bg-gray-200 rounded flex items-center justify-center">
                  <div className="text-center p-8">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-sm text-gray-600">Archaeological Dig Site Map</p>
                  </div>
                </div>
              )}
              {mapDescription && <p className="text-sm text-gray-600 mt-2 italic">{mapDescription}</p>}
            </div>
          </div>

          {/* Questions Section */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">📝 Answer Sheet</h4>

            {/* Questions List */}
            <div className="space-y-3">
              {questions.map(question => {
                const currentAnswer = selectedAnswers[question.id] || ''

                return (
                  <div
                    key={question.id}
                    className="border rounded-lg p-4 border-gray-200 bg-white hover:border-gray-300 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-700">{question.questionNumber}.</span>
                      </div>

                      <div className="flex-1">
                        {question.description && (
                          <p className="text-sm text-gray-700 font-medium">{question.description}</p>
                        )}
                      </div>

                      <div className="w-48">
                        <input
                          type="text"
                          value={currentAnswer}
                          onChange={e => handleAnswerChange(question.id, e.target.value)}
                          disabled={isReadOnly}
                          className={`w-full px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors font-medium ${
                            isReadOnly ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
                          } border-gray-300`}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListeningMapLabeling
