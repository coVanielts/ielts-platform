import React, { useCallback, useState } from 'react'

interface HighlightRange {
  id: string
  startOffset: number
  endOffset: number
  text: string
  color: string
  note?: string
}

export interface UseHighlightReturn {
  highlights: HighlightRange[]
  addHighlight: (range: HighlightRange) => void
  removeHighlight: (id: string) => void
  clearHighlights: () => void
  getHighlightedText: (text: string) => React.ReactElement[]
  handleTextSelection: (containerRef: React.RefObject<HTMLElement>) => void
  hasOverlap: (start: number, end: number) => boolean
}

const HIGHLIGHT_COLORS = [
  '#fbbf24', // Amber 400 - warm yellow
  '#34d399', // Emerald 400 - soft green
  '#60a5fa', // Blue 400 - sky blue
  '#f472b6', // Pink 400 - soft pink
  '#a78bfa', // Violet 400 - light purple
  '#fb7185', // Rose 400 - coral
  '#fcd34d', // Yellow 400 - bright yellow
  '#4ade80', // Green 400 - lime green
]

export const useHighlight = (): UseHighlightReturn => {
  const [highlights, setHighlights] = useState<HighlightRange[]>([])
  const [colorIndex, setColorIndex] = useState(0)

  const addHighlight = useCallback((range: HighlightRange) => {
    setHighlights(prev => [...prev, range])
  }, [])

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => prev.filter(h => h.id !== id))
  }, [])

  const clearHighlights = useCallback(() => {
    setHighlights([])
    setColorIndex(0)
  }, [])

  const getNextColor = useCallback(() => {
    const color = HIGHLIGHT_COLORS[colorIndex]
    setColorIndex(prev => (prev + 1) % HIGHLIGHT_COLORS.length)
    return color
  }, [colorIndex])

  const getHighlightedText = useCallback(
    (text: string): React.ReactElement[] => {
      if (highlights.length === 0) {
        return [React.createElement('span', { key: 'text' }, text)]
      }

      // Create a merged highlight map to handle overlaps
      const mergedHighlights: { [key: number]: { color: string; ids: string[] } } = {}

      highlights.forEach(highlight => {
        for (let i = highlight.startOffset; i < highlight.endOffset; i++) {
          if (!mergedHighlights[i]) {
            mergedHighlights[i] = { color: highlight.color, ids: [highlight.id] }
          } else {
            // Keep the first color when there's overlap
            mergedHighlights[i].ids.push(highlight.id)
          }
        }
      })

      // Convert merged map to segments
      const segments: Array<{ start: number; end: number; color?: string; ids?: string[] }> = []
      let currentStart = 0
      let currentColor: string | undefined
      let currentIds: string[] = []

      for (let i = 0; i <= text.length; i++) {
        const highlight = mergedHighlights[i]
        const hasColorChange = (highlight && highlight.color !== currentColor) || (!highlight && currentColor)

        if (hasColorChange && i > currentStart) {
          segments.push({
            start: currentStart,
            end: i,
            color: currentColor,
            ids: [...currentIds],
          })
          currentStart = i
        }

        if (highlight) {
          currentColor = highlight.color
          currentIds = highlight.ids
        } else {
          currentColor = undefined
          currentIds = []
        }
      }

      // Add final segment if needed
      if (currentStart < text.length) {
        segments.push({
          start: currentStart,
          end: text.length,
          color: currentColor,
          ids: [...currentIds],
        })
      }

      // Create React elements from segments
      const elements: React.ReactElement[] = []

      segments.forEach((segment, index) => {
        const segmentText = text.slice(segment.start, segment.end)

        if (segment.color && segment.ids) {
          elements.push(
            React.createElement(
              'span',
              {
                key: `segment-${index}`,
                className: 'highlight-text cursor-pointer transition-opacity hover:opacity-80',
                style: {
                  backgroundColor: segment.color,
                  padding: '2px 0',
                  borderRadius: '2px',
                },
                title: `Highlighted text (${segment.ids.length} highlight${segment.ids.length > 1 ? 's' : ''}). Click to remove.`,
                onClick: () => {
                  // Remove all highlights that contribute to this segment
                  segment.ids?.forEach(id => removeHighlight(id))
                },
              },
              segmentText,
            ),
          )
        } else {
          elements.push(React.createElement('span', { key: `text-${index}` }, segmentText))
        }
      })

      return elements
    },
    [highlights, removeHighlight],
  )

  const hasOverlap = useCallback(
    (start: number, end: number): boolean => {
      return highlights.some(
        highlight =>
          (start < highlight.endOffset && end > highlight.startOffset) ||
          (highlight.startOffset < end && highlight.endOffset > start),
      )
    },
    [highlights],
  )

  const handleTextSelection = useCallback(
    (containerRef: React.RefObject<HTMLElement>) => {
      const selection = window.getSelection()
      if (!selection || selection.isCollapsed || !containerRef.current) return

      const range = selection.getRangeAt(0)
      const selectedText = selection.toString().trim()

      if (selectedText.length === 0) return

      // Calculate offsets relative to container
      const beforeRange = document.createRange()
      beforeRange.selectNodeContents(containerRef.current)
      beforeRange.setEnd(range.startContainer, range.startOffset)
      const startOffset = beforeRange.toString().length

      const endOffset = startOffset + selectedText.length

      // Check for existing highlight that covers this exact range
      const existingHighlight = highlights.find(h => h.startOffset === startOffset && h.endOffset === endOffset)

      if (existingHighlight) {
        // Remove existing highlight if selecting the same text
        removeHighlight(existingHighlight.id)
        selection.removeAllRanges()
        return
      }

      // Check if this selection overlaps with existing highlights
      if (hasOverlap(startOffset, endOffset)) {
      }

      const highlightRange: HighlightRange = {
        id: `highlight-${Date.now()}`,
        startOffset,
        endOffset,
        text: selectedText,
        color: getNextColor(),
      }

      addHighlight(highlightRange)
      selection.removeAllRanges()
    },
    [addHighlight, getNextColor, highlights, hasOverlap, removeHighlight],
  )

  return {
    highlights,
    addHighlight,
    removeHighlight,
    clearHighlights,
    getHighlightedText,
    handleTextSelection,
    hasOverlap,
  }
}
