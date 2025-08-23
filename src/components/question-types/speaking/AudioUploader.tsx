import { Pause, Play, X } from 'lucide-react'
import React, { useCallback, useRef, useState } from 'react'

interface AudioUploaderProps {
  questionId: string
  onAudioUpload: (questionId: string, audio: File | null) => void
  currentAudioUrl: string | null
  isDisabled?: boolean
}

export const AudioUploader: React.FC<AudioUploaderProps> = ({
  questionId,
  onAudioUpload,
  currentAudioUrl,
  isDisabled = false,
}) => {
  const [isPlaying, setIsPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const openFilePicker = () => {
    if (isDisabled) return
    // Create a temporary input to avoid layout/overlay issues
    const tmp = document.createElement('input')
    tmp.type = 'file'
    tmp.accept = '.mp3,.wav,audio/mpeg,audio/wav,audio/*'
    tmp.style.position = 'fixed'
    tmp.style.left = '50%'
    tmp.style.top = '50%'
    tmp.style.width = '1px'
    tmp.style.height = '1px'
    tmp.style.opacity = '0'
    tmp.style.zIndex = '2147483647'

    const cleanup = () => {
      try {
        tmp.removeEventListener('change', onTmpChange)
      } catch {}
      try {
        if (tmp.parentNode) tmp.parentNode.removeChild(tmp)
      } catch {}
    }
    const onTmpChange = () => {
      processSelectedFile(tmp)
      cleanup()
    }
    tmp.addEventListener('change', onTmpChange)
    document.body.appendChild(tmp)
    try {
      const withPicker = tmp as HTMLInputElement & { showPicker?: () => void }
      if (typeof withPicker.showPicker === 'function') {
        withPicker.showPicker()
      } else {
        tmp.click()
      }
    } catch {
      cleanup()
    }
  }

  // Use a temporary input per click; no persistent body input needed

  const processSelectedFile = useCallback(
    async (el: HTMLInputElement) => {
      const file = el.files?.[0]
      if (!file) return

      // Validate file type - check both MIME type and extension
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/wave', 'audio/x-wav']
      const validExtensions = ['.mp3', '.wav']
      const fileExtension = file.name.toLowerCase().split('.').pop()

      if (!validTypes.includes(file.type) && !validExtensions.includes(`.${fileExtension}`)) {
        setError('Please select an MP3 or WAV file')
        return
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB')
        return
      }

      try {
        const audioUrl = URL.createObjectURL(file)
        onAudioUpload(questionId, file)
        setError(null)
      } catch {
        setError('Failed to upload audio file')
      } finally {
        // Reset value so selecting the same file again still triggers change
        try {
          el.value = ''
        } catch {}
      }
    },
    [onAudioUpload, questionId],
  )

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    await processSelectedFile(event.target)
  }

  const handlePlayPause = () => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleAudioEnded = () => {
    setIsPlaying(false)
  }

  const handleRemoveAudio = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onAudioUpload(questionId, null)
  }

  return (
    <div className="space-y-3">
      {/* File Input */}
      <div className="flex items-center space-x-3">
        {/* Visible action button */}
        <button
          type="button"
          onClick={openFilePicker}
          disabled={isDisabled}
          className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${
            isDisabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'
          }`}>
          Choose Audio File
        </button>
        {/* Hidden in-DOM input as secondary fallback */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp3,.wav,audio/mpeg,audio/wav,audio/*"
          onChange={handleFileChange}
          disabled={isDisabled}
          id={`audio-upload-${questionId}`}
          className="sr-only"
        />

        {currentAudioUrl && typeof currentAudioUrl === 'string' && (
          <>
            <button onClick={handlePlayPause} className="p-2 rounded-full hover:bg-gray-100" disabled={isDisabled}>
              {isPlaying ? <Pause className="w-5 h-5 text-gray-600" /> : <Play className="w-5 h-5 text-gray-600" />}
            </button>
            <button
              onClick={handleRemoveAudio}
              className="p-2 rounded-full hover:bg-gray-100 text-red-500"
              disabled={isDisabled}>
              <X className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Error Message */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Audio Element */}
      {currentAudioUrl && (
        <audio ref={audioRef} src={currentAudioUrl} onEnded={handleAudioEnded} className="hidden">
          <track kind="captions" srcLang="en" label="English captions" />
        </audio>
      )}
    </div>
  )
}
