import { useAudioUrl } from '@/utils/audio.utils'
import React, { FC, RefObject, useEffect, useRef, useState } from 'react'

interface ListeningAudioPlayerProps {
  audioRef: RefObject<HTMLAudioElement | null>
  audioUrl: string
  onEnd: () => void
  onAudioConfirm?: () => void
  disableControls?: boolean
  initialAudioTime?: number
}

export interface ListeningAudioPlayerRef {
  startPlaying: () => void
  getCurrentTime: () => number | undefined
  getRemainingTime: () => number | undefined
}

export const ListeningAudioPlayer: FC<ListeningAudioPlayerProps> = ({
  audioUrl: audioSource,
  onEnd,
  onAudioConfirm,
  disableControls = true,
  initialAudioTime,
  audioRef,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAudioReady, setIsAudioReady] = useState(false)
  const [showContinueDialog, setShowContinueDialog] = useState(false)
  const [userConfirmed, setUserConfirmed] = useState(false)
  const [isSeeking, setIsSeeking] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use the audio hook to handle Directus audio fetching from Directus assets
  const { audioUrl, isLoading } = useAudioUrl(audioSource)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlay = () => {
    if (audioRef.current && userConfirmed) {
      if (!isPlaying) {
        audioRef.current.play()
        setIsPlaying(true)
        setShowContinueDialog(false) // Hide dialog when user starts playing
      } else if (!disableControls) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const handleContinueListening = () => {
    setShowContinueDialog(false)
    if (audioRef.current && isAudioReady) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }

  const handlePauseListening = () => {
    setShowContinueDialog(false)
    // Audio remains paused
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && !disableControls && userConfirmed) {
      const newTime = parseFloat(e.target.value)
      audioRef.current.currentTime = newTime
      setCurrentTime(newTime) // Update state immediately for responsive UI
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSeeking(true)
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsSeeking(false)
  }

  const handleSkip = (seconds: number) => {
    if (audioRef.current && !disableControls && userConfirmed) {
      const newTime = Math.max(0, Math.min(audioRef.current.duration || 0, audioRef.current.currentTime + seconds))
      audioRef.current.currentTime = newTime
    }
  }

  const handleSkipBackward = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSkip(-10)
  }

  const handleSkipBackward5s = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSkip(-5)
  }

  const handleSkipForward5s = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSkip(5)
  }

  const handleSkipForward = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    handleSkip(10)
  }

  useEffect(() => {
    console.log('comeeee11')

    const audio = audioRef.current
    if (!audio) return
    console.log('comeeee1')

    const handleReady = () => {
      const duration = audio.duration || 0
      const offset = initialAudioTime || 0
      console.log(duration, offset)

      if (offset === 0) return
      audio.currentTime = Math.max(0, duration - offset)
      setCurrentTime(audio.currentTime) // Update state when setting initial time
      setIsAudioReady(true)
    }

    const handleCanPlay = () => {
      setIsAudioReady(true)
      setCurrentTime(audio.currentTime) // Initialize currentTime
    }

    if (audio.readyState >= 3) {
      handleReady()
    } else {
      audio.addEventListener('loadedmetadata', handleReady)
      audio.addEventListener('canplay', handleCanPlay)
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleReady)
      audio.removeEventListener('canplay', handleCanPlay)
    }
  }, [initialAudioTime, audioRef.current?.duration])

  // Show continue dialog when audio is ready
  useEffect(() => {
    if (isAudioReady && !userConfirmed && !showContinueDialog) {
      setShowContinueDialog(true)
    }
  }, [isAudioReady, userConfirmed, showContinueDialog])

  // Auto-play audio when user confirms
  useEffect(() => {
    if (isAudioReady && userConfirmed && audioRef.current && !isPlaying) {
      audioRef.current.play()
      setIsPlaying(true)
    }
  }, [isAudioReady, userConfirmed, audioRef.current, isPlaying])

  // Update current time for progress bar
  useEffect(() => {
    if (!audioRef.current) return

    const audio = audioRef.current
    const updateTime = () => {
      if (!isSeeking) {
        setCurrentTime(audio.currentTime)
      }
    }

    audio.addEventListener('timeupdate', updateTime)
    return () => audio.removeEventListener('timeupdate', updateTime)
  }, [isSeeking])

  const handleContinueConfirm = () => {
    setUserConfirmed(true)
    setShowContinueDialog(false)
    onAudioConfirm?.() // Call the callback to resume timer
  }

  const handleContinueCancel = () => {
    setShowContinueDialog(false)
    // Optionally handle cancel action (e.g., redirect or show instructions)
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center justify-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">Loading audio...</span>
        </div>
      </div>
    )
  }

  // Don't render if no audio URL available
  if (!audioUrl) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6M7 8a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2-2H9a2 2 0 01-2-2V8z"
            />
          </svg>
          <span className="text-sm text-gray-500">No audio available</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white">
      <div className="flex items-center space-x-3">
        {/* Skip Backward Button (only in practice mode) */}
        {!disableControls && (
          <button
            onClick={handleSkipBackward}
            className={`p-1.5 rounded-full text-gray-700 transition-colors duration-100 focus:outline-none select-none ${
              !userConfirmed ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
            }`}
            title="Skip back 10 seconds"
            disabled={!userConfirmed}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
            <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8L12.066 11.2z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8L4.066 11.2z"
              />
            </svg>
          </button>
        )}

        {/* Skip Backward 5s Button (only in practice mode) */}
        {!disableControls && (
          <button
            onClick={handleSkipBackward5s}
            className={`p-1.5 rounded-full text-gray-700 transition-colors duration-100 focus:outline-none select-none ${
              !userConfirmed ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
            }`}
            title="Skip back 5 seconds"
            disabled={!userConfirmed}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
            <span className="text-xs font-medium pointer-events-none">-5s</span>
          </button>
        )}

        {/* Play/Pause Button */}
        <button
          onClick={handlePlay}
          className={`p-2 rounded-full text-white transition-colors duration-100 shadow-md focus:outline-none select-none ${
            !userConfirmed ? 'bg-gray-400 opacity-50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 hover:shadow-lg'
          }`}
          disabled={!userConfirmed}
          style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
          {isPlaying ? (
            <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6" />
            </svg>
          ) : (
            <svg className="w-5 h-5 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </button>

        {/* Skip Forward 5s Button (only in practice mode) */}
        {!disableControls && (
          <button
            onClick={handleSkipForward5s}
            className={`p-1.5 rounded-full text-gray-700 transition-colors duration-100 focus:outline-none select-none ${
              !userConfirmed ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
            }`}
            title="Skip forward 5 seconds"
            disabled={!userConfirmed}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
            <span className="text-xs font-medium pointer-events-none">+5s</span>
          </button>
        )}

        {/* Skip Forward Button (only in practice mode) */}
        {!disableControls && (
          <button
            onClick={handleSkipForward}
            className={`p-1.5 rounded-full text-gray-700 transition-colors duration-100 focus:outline-none select-none ${
              !userConfirmed ? 'bg-gray-50 opacity-50 cursor-not-allowed' : 'bg-gray-100 hover:bg-gray-200 active:bg-gray-300'
            }`}
            title="Skip forward 10 seconds"
            disabled={!userConfirmed}
            style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
            <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z"
              />
            </svg>
          </button>
        )}

        {/* Progress Bar with Skip Controls */}
        <div className="flex-1 px-2">
          <div className="flex items-center space-x-2">
            {/* Skip Backward 5s on Progress */}
            {!disableControls && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSkip(-5)
                }}
                className={`p-1.5 rounded-full text-gray-500 transition-colors duration-100 focus:outline-none ${
                  !userConfirmed ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Skip back 5 seconds"
                disabled={!userConfirmed}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Progress Bar */}
            <input
              type="range"
              min="0"
              max={Number.isFinite(audioRef.current?.duration) ? audioRef.current!.duration : 0}
              value={currentTime}
              onChange={handleSeek}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              disabled={disableControls || !userConfirmed}
              className={`
                  flex-1 h-2 rounded-lg appearance-none cursor-pointer transition-all duration-100 select-none
                  bg-gradient-to-r from-blue-500 to-gray-200 focus:outline-none
                  ${disableControls || !userConfirmed ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600'}
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-4
                  [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-blue-600
                  [&::-webkit-slider-thumb]:cursor-grab
                  [&::-webkit-slider-thumb]:shadow-md
                  [&::-webkit-slider-thumb]:transition-all
                  [&::-webkit-slider-thumb]:duration-100
                  [&::-webkit-slider-thumb]:border-0
                  [&::-webkit-slider-thumb]:outline-none
                  [&::-webkit-slider-thumb]:focus:outline-none
                  [&::-webkit-slider-track]:bg-transparent
                  [&::-webkit-slider-track]:border-0
                  [&::-webkit-slider-track]:outline-none
                  ${!disableControls && userConfirmed ? '[&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:shadow-lg [&::-webkit-slider-thumb]:active:cursor-grabbing' : ''}
                `}
              style={{
                background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${(currentTime / (audioRef.current?.duration ?? 1)) * 100}%, #E5E7EB ${(currentTime / (audioRef.current?.duration ?? 1)) * 100}%, #E5E7EB 100%)`,
                userSelect: 'none',
                WebkitUserSelect: 'none',
                outline: 'none',
              }}
            />

            {/* Skip Forward 5s on Progress */}
            {!disableControls && (
              <button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSkip(5)
                }}
                className={`p-1.5 rounded-full text-gray-500 transition-colors duration-100 focus:outline-none ${
                  !userConfirmed ? 'opacity-50 cursor-not-allowed' : 'hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Skip forward 5 seconds"
                disabled={!userConfirmed}
                style={{ userSelect: 'none', WebkitUserSelect: 'none' }}>
                <svg className="w-4 h-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Time Display */}
        <div className="text-sm font-medium text-gray-600 min-w-[70px] text-right">
          {(audioRef.current?.duration as any) > 0
            ? `${formatTime(currentTime)} / ${formatTime(audioRef.current?.duration as any)}`
            : '0:00 / 0:00'}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        onEnded={() => {
          setIsPlaying(false)
          onEnd()
        }}>
        <track kind="captions" srcLang="en" label="English captions" default />
      </audio>

      {/* Continue Dialog Modal */}
      {showContinueDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Sẵn sàng để bắt đầu?
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Nhấn "Bắt đầu" để phát audio và bắt đầu đếm thời gian làm bài. Timer sẽ được tạm dừng cho đến khi bạn sẵn sàng.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={handleContinueCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500">
                  Hủy
                </button>
                <button
                  onClick={handleContinueConfirm}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  Bắt đầu
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
