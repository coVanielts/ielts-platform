import React from 'react'

interface GapOption {
  id: number
  options: string[]
}

interface ListeningMultipleChoiceGapFillProps {
  questionRange: string
  instructions: string
  title: string
  content: string
  gaps: GapOption[]
  onGapChange?: (gapId: number, value: string) => void
  values?: Record<number, string>
  isReadOnly?: boolean
}

const ListeningMultipleChoiceGapFill: React.FC<ListeningMultipleChoiceGapFillProps> = ({
  questionRange,
  instructions,
  title,
  content,
  gaps,
  onGapChange,
  values = {},
  isReadOnly = false,
}) => {
  const [showDropdown, setShowDropdown] = React.useState<number | null>(null)

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.gap-dropdown-container')) {
        setShowDropdown(null)
      }
    }

    if (showDropdown !== null) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => document.removeEventListener('click', handleClickOutside)
  }, [showDropdown])

  const handleGapClick = (gapId: number, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!isReadOnly) {
      setShowDropdown(showDropdown === gapId ? null : gapId)
    }
  }

  const handleOptionSelect = (gapId: number, option: string) => {
    if (onGapChange && !isReadOnly) {
      onGapChange(gapId, option.trim())
    }
    setShowDropdown(null)
  }

  const renderGapButton = (gapId: number) => {
    const gapData = gaps.find(g => g.id === gapId)
    if (!gapData) {
      return null
    }

    const currentValue = values[gapId]
    const hasAnswer = !!currentValue && currentValue.trim() !== ''

    return (
      <div className="relative inline-block mx-1 gap-dropdown-container">
        <button
          onClick={e => handleGapClick(gapId, e)}
          disabled={isReadOnly}
          className={`border rounded px-3 py-1 text-sm min-w-[60px] transition-colors ${
            hasAnswer
              ? 'bg-green-100 border-green-400 text-green-800 hover:bg-green-200'
              : 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100'
          } ${isReadOnly ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
          data-testid={`listening-gap-${gapId}`}
          data-has-answer={hasAnswer}>
          {currentValue || `Gap ${gapId}`}
        </button>

        {showDropdown === gapId && !isReadOnly && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-50 min-w-[140px] max-h-48 overflow-y-auto">
            <div className="py-1">
              {gapData.options.map((option, index) => (
                <button
                  key={index}
                  onClick={e => {
                    e.stopPropagation()
                    handleOptionSelect(gapId, option)
                  }}
                  className={`block w-full text-left px-3 py-2 hover:bg-blue-50 text-sm border-none transition-colors ${
                    currentValue === option
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:text-blue-700'
                  }`}>
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderContentWithGaps = () => {
    if (!content) {
      return <p className="text-gray-500 italic">No content available</p>
    }

    // Split content into paragraphs first
    const paragraphs = content.split('\n\n')

    return paragraphs.map((paragraph, pIndex) => {
      // Split each paragraph by gap markers [1], [2], etc.
      const parts = paragraph.split(/(\[\d+\])/)

      const processedParts = parts.map(part => {
        const gapMatch = part.match(/\[(\d+)\]/)
        if (gapMatch) {
          const gapId = parseInt(gapMatch[1])
          return renderGapButton(gapId)
        }
        return part
      })

      return (
        <p key={pIndex} className="mb-4 leading-relaxed">
          {processedParts.map((part, index) => {
            if (React.isValidElement(part)) {
              return React.cloneElement(part, { key: `${pIndex}-${index}` })
            }
            return <span key={`${pIndex}-${index}`}>{part}</span>
          })}
        </p>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* Question Header */}
      <div className="bg-gray-50 border-b border-gray-200 p-4 rounded-t-lg">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{questionRange}</h3>
            <p className="text-gray-600 text-sm">{instructions}</p>
          </div>
          {isReadOnly && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">Review Mode</span>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        <div className="max-w-full">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>

          <div className="text-gray-800 leading-relaxed space-y-4">
            <div>{renderContentWithGaps()}</div>
          </div>

          {/* Gap Fill Instructions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How to answer:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Click on each gap to see the available options</li>
              <li>• Select the most appropriate option for each gap</li>
              <li>• Your answers will be highlighted in green when selected</li>
              <li>• You can change your answers by clicking the gap again</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ListeningMultipleChoiceGapFill
