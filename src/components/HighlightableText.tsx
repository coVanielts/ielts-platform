import type { UseHighlightReturn } from '@/hooks/useHighlight'
import { useHighlight } from '@/hooks/useHighlight'
import React, { useEffect, useMemo, useRef } from 'react'

interface HighlightableTextProps {
  text: string
  className?: string
  style?: React.CSSProperties
  onHighlight?: (text: string) => void
  highlightHook?: UseHighlightReturn
  enableInternalHighlight?: boolean
}

export const HighlightableText: React.FC<HighlightableTextProps> = ({
  text,
  className = '',
  style,
  onHighlight,
  highlightHook,
  enableInternalHighlight = false,
}) => {
  const containerRef = useRef<HTMLSpanElement>(null)
  // Create an internal hook once and reuse it when enabled
  const internal = useHighlight()
  const effectiveHook = useMemo<UseHighlightReturn | undefined>(() => {
    if (highlightHook) return highlightHook
    if (enableInternalHighlight) return internal
    return undefined
  }, [highlightHook, enableInternalHighlight, internal])

  const isHighlightingEnabled = effectiveHook !== undefined
  const { getHighlightedText, handleTextSelection } =
    effectiveHook ||
    ({ getHighlightedText: () => [text], handleTextSelection: () => {} } as unknown as UseHighlightReturn)

  useEffect(() => {
    if (!isHighlightingEnabled) return

    const container = containerRef.current
    if (!container) return

    const handleMouseUp = () => {
      if (containerRef.current && handleTextSelection) {
        handleTextSelection(containerRef as React.RefObject<HTMLElement>)
        const selection = window.getSelection()
        if (selection && !selection.isCollapsed && onHighlight) {
          onHighlight(selection.toString())
        }
      }
    }

    container.addEventListener('mouseup', handleMouseUp)

    return () => {
      container.removeEventListener('mouseup', handleMouseUp)
    }
  }, [handleTextSelection, onHighlight, isHighlightingEnabled])

  return (
    <span
      ref={containerRef}
      className={`select-text cursor-text reading-passage ${className}`}
      style={{ userSelect: 'text', ...style }}>
      {isHighlightingEnabled ? getHighlightedText(text) : text}
    </span>
  )
}
