'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface UseResizablePanesOptions {
  initialLeftWidth?: number
  minWidth?: number
  maxWidth?: number
}

export function useResizablePanes({
  initialLeftWidth = 50,
  minWidth = 20,
  maxWidth = 80,
}: UseResizablePanesOptions = {}) {
  const [leftWidth, setLeftWidth] = useState(initialLeftWidth)
  const [isResizing, setIsResizing] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }, [])

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing || !containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const newLeftWidth = ((e.clientX - rect.left) / rect.width) * 100

      const clampedWidth = Math.max(minWidth, Math.min(maxWidth, newLeftWidth))
      setLeftWidth(clampedWidth)
    },
    [isResizing, minWidth, maxWidth],
  )

  const handleMouseUp = useCallback(() => {
    setIsResizing(false)
  }, [])

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'

      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
        document.body.style.cursor = ''
        document.body.style.userSelect = ''
      }
    }
  }, [isResizing, handleMouseMove, handleMouseUp])

  return {
    leftWidth,
    rightWidth: 100 - leftWidth,
    isResizing,
    containerRef,
    startResize,
  }
}
