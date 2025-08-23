import { useCallback, useRef } from 'react'

interface ScrollPosition {
  left: number
  right: number
}

interface ScrollMemoryHook {
  saveScrollPosition: (partId: string) => void
  restoreScrollPosition: (partId: string, isFirstVisit: boolean) => void
  clearScrollMemory: () => void
}

export const useScrollMemory = (
  leftPanelRef: React.RefObject<HTMLDivElement | null>,
  rightPanelRef: React.RefObject<HTMLDivElement | null>
): ScrollMemoryHook => {
  const scrollPositions = useRef<Record<string, ScrollPosition>>({})
  const visitedParts = useRef<Set<string>>(new Set())

  const saveScrollPosition = useCallback((partId: string) => {
    if (leftPanelRef.current && rightPanelRef.current) {
      const leftScroll = leftPanelRef.current.scrollTop
      const rightScroll = rightPanelRef.current.scrollTop
      
      // Only save if the scroll positions are valid (not negative and not too large)
      if (leftScroll >= 0 && rightScroll >= 0) {
        scrollPositions.current[partId] = {
          left: leftScroll,
          right: rightScroll,
        }
        visitedParts.current.add(partId)
      }
    }
  }, [leftPanelRef, rightPanelRef])

  const restoreScrollPosition = useCallback((partId: string, isFirstVisit: boolean) => {
    
    if (isFirstVisit) {
      // First visit - just scroll to top
      if (leftPanelRef.current) {
        leftPanelRef.current.scrollTop = 0
      }
      if (rightPanelRef.current) {
        rightPanelRef.current.scrollTop = 0
      }
      visitedParts.current.add(partId)
    } else {
      // Restore saved position
      const savedPosition = scrollPositions.current[partId]
      
      if (savedPosition && savedPosition.left >= 0 && savedPosition.right >= 0) {
        if (leftPanelRef.current) {
          leftPanelRef.current.scrollTop = savedPosition.left
        }
        if (rightPanelRef.current) {
          rightPanelRef.current.scrollTop = savedPosition.right
        }
      } else {
        // No valid saved position, scroll to top
        if (leftPanelRef.current) {
          leftPanelRef.current.scrollTop = 0
        }
        if (rightPanelRef.current) {
          rightPanelRef.current.scrollTop = 0
        }
      }
    }
  }, [leftPanelRef, rightPanelRef])

  const clearScrollMemory = useCallback(() => {
    scrollPositions.current = {}
    visitedParts.current.clear()
  }, [])

  return {
    saveScrollPosition,
    restoreScrollPosition,
    clearScrollMemory,
  }
}
