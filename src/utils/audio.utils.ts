import { appConfig } from '@/configs/appConfigs.config'
import React from 'react'

/**
 * Fetches audio file from Directus by ID and returns the full URL
 * @param audioId - The Directus file ID
 * @returns Promise<string> - The full audio URL or throws an error
 */
export function fetchAudioFromDirectus(audioId: string): string {
  try {
    // If audioId is already a full URL, return it as is
    if (audioId.startsWith('http://') || audioId.startsWith('https://')) {
      return audioId
    }

    // If audioId is a relative path or already includes directus assets path
    if (audioId.startsWith('/assets/') || audioId.includes('/assets/')) {
      return `${appConfig.directusUrl.replace(/\/$/, '')}${audioId.startsWith('/') ? audioId : `/${audioId}`}`
    }

    return `${appConfig.directusUrl.replace(/\/$/, '')}/assets/${audioId}`
  } catch (error) {
    console.error('Error fetching audio from Directus:', error)
    throw new Error(`Failed to fetch audio file: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Validates if an audio URL is accessible
 * @param audioUrl - The audio URL to validate
 * @returns Promise<boolean> - True if audio is accessible
 */
async function validateAudioUrl(audioUrl: string): Promise<boolean> {
  try {
    const response = await fetch(audioUrl, { method: 'HEAD' })
    const contentType = response.headers.get('content-type')
    return response.ok && (contentType?.startsWith('audio/') ?? false)
  } catch (error) {
    console.error('Error validating audio URL:', error)
    return false
  }
}

/**
 * Hook to manage audio URL fetching and validation
 */
export function useAudioUrl(audioSource: string | undefined) {
  const [audioUrl, setAudioUrl] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  // If the provided audioSource already looks like a URL or a public path, set it immediately so
  // the <audio> element can have a src during the same user gesture that triggers play(). This
  // increases the chance browsers will allow playback initiated by a click.
  React.useEffect(() => {
    if (!audioSource) return
    const looksLikeUrl = audioSource.startsWith('http://') || audioSource.startsWith('https://') || audioSource.startsWith('/') || audioSource.startsWith('./')
    if (looksLikeUrl) {
      setAudioUrl(audioSource)
    }
  }, [audioSource])

  React.useEffect(() => {
    if (!audioSource) {
      setAudioUrl(null)
      setError(null)
      return
    }

    const loadAudio = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const url = await fetchAudioFromDirectus(audioSource)

        // Validate the URL
        const isValid = await validateAudioUrl(url)
        if (!isValid) {
          throw new Error('Audio file is not accessible or not a valid audio format')
        }

        setAudioUrl(url)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load audio'
        setError(errorMessage)
        setAudioUrl(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadAudio()
  }, [audioSource])

  return { audioUrl, isLoading, error }
}

/**
 * Get audio URL from file ID or URL, with fallback
 * @param audioSource - File ID, URL, or undefined
 * @param fallbackUrl - Fallback URL if primary source fails
 * @returns Promise<string> - The audio URL to use
 */
export async function getAudioUrl(audioSource: string | undefined, fallbackUrl: string = '/assets/audio/listening_test.mp3'): Promise<string> {
  if (!audioSource) {
    return fallbackUrl
  }

  try {
    const audioUrl = await fetchAudioFromDirectus(audioSource)
    
    // Validate the URL
    const isValid = await validateAudioUrl(audioUrl)
    if (!isValid) {
      console.warn(`Audio file ${audioSource} is not accessible, using fallback`)
      return fallbackUrl
    }
    
    return audioUrl
  } catch (error) {
    console.warn(`Failed to fetch audio ${audioSource}, using fallback:`, error)
    return fallbackUrl
  }
}
