import { useAudioUrl } from '@/utils/audio.utils'
import React, { FC, RefObject, useEffect, useRef, useState } from 'react'

interface ListeningAudioPlayerProps {
  audioRef: RefObject<HTMLAudioElement | null>
  audioUrl: string
  onEnd: () => void
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
  disableControls = true,
  initialAudioTime,
  audioRef,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const seekTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  // Use the audio hook to handle Directus audio fetching from Directus assets
  const { audioUrl, isLoading } = useAudioUrl(audioSource)

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const handlePlay = () => {
    if (audioRef.current) {
      if (!isPlaying) {
        audioRef.current.play()
        setIsPlaying(true)
      } else if (!disableControls) {
        audioRef.current.pause()
        setIsPlaying(false)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (audioRef.current && !disableControls) {
      const newProgress = parseInt(e.target.value)
      const newTime = (newProgress / 100) * (audioRef.current.duration as any)
      audioRef.current.currentTime = newTime

      // Clear timeout cũ nếu có
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only prevent text selection, not the input functionality
    e.stopPropagation()
  }

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  const handleSkipBackward = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (audioRef.current && !disableControls) {
      const newTime = Math.max(0, audioRef.current.currentTime - 10)
      audioRef.current.currentTime = newTime

      // Clear timeout cũ nếu có
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }
    }
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
    }

    if (audio.readyState >= 3) {
      handleReady()
    } else {
      audio.addEventListener('loadedmetadata', handleReady)
    }

    return () => {
      audio.removeEventListener('loadedmetadata', handleReady)
    }
  }, [initialAudioTime, audioRef.current?.duration])

  const handleSkipForward = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (audioRef.current && !disableControls) {
      const newTime = Math.min(audioRef.current.duration as any, audioRef.current.currentTime + 10)
      audioRef.current.currentTime = newTime

      // Clear timeout cũ nếu có
      if (seekTimeoutRef.current) {
        clearTimeout(seekTimeoutRef.current)
      }
    }
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
            className="p-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-100 focus:outline-none select-none"
            title="Skip back 10 seconds"
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

        {/* Play/Pause Button */}
        <button
          onClick={handlePlay}
          className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 transition-colors duration-100 shadow-md hover:shadow-lg focus:outline-none select-none"
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

        {/* Skip Forward Button (only in practice mode) */}
        {!disableControls && (
          <button
            onClick={handleSkipForward}
            className="p-1.5 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 active:bg-gray-300 transition-colors duration-100 focus:outline-none select-none"
            title="Skip forward 10 seconds"
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

        {/* Progress Bar */}
        <div className="flex-1 px-2">
          <input
            type="range"
            min="0"
            max={Number.isFinite(audioRef.current?.duration) ? audioRef.current!.duration : 0}
            value={audioRef.current?.currentTime ?? 0}
            onChange={handleSeek}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            disabled={disableControls}
            className={`
                w-full h-2 rounded-lg appearance-none cursor-pointer transition-all duration-100 select-none
                bg-gradient-to-r from-blue-500 to-gray-200 focus:outline-none
                ${disableControls ? 'opacity-50 cursor-not-allowed' : 'hover:from-blue-600'}
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
                ${!disableControls ? '[&::-webkit-slider-thumb]:hover:bg-blue-700 [&::-webkit-slider-thumb]:hover:shadow-lg [&::-webkit-slider-thumb]:active:cursor-grabbing' : ''}
              `}
            style={{
              background: `linear-gradient(to right, #3B82F6 0%, #3B82F6 ${((audioRef.current?.currentTime ?? 0) / (audioRef.current?.duration ?? 1)) * 100}%, #E5E7EB ${((audioRef.current?.currentTime ?? 0) / (audioRef.current?.duration ?? 1)) * 100}%, #E5E7EB 100%)`,
              userSelect: 'none',
              WebkitUserSelect: 'none',
              outline: 'none',
            }}
          />
        </div>

        {/* Time Display */}
        <div className="text-sm font-medium text-gray-600 min-w-[70px] text-right">
          {(audioRef.current?.duration as any) > 0
            ? `${formatTime(audioRef.current?.currentTime ?? 0)} / ${formatTime(audioRef.current?.duration as any)}`
            : '0:00 / 0:00'}
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        preload="metadata"
        autoPlay={true}
        onEnded={() => {
          setIsPlaying(false)
          onEnd()
        }}>
        <track kind="captions" srcLang="en" label="English captions" default />
      </audio>
    </div>
  )
}
