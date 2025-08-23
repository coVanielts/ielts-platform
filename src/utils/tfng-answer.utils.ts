/**
 * Helper functions for True/False/Not Given answer format conversion
 */

/**
 * Convert from old format (TRUE/FALSE/NOT_GIVEN) to new format (T/F/NG)
 */
export const convertToShortFormat = (answer: string | null | undefined): string | null => {
  if (!answer) return null
  
  switch (answer.toUpperCase()) {
    case 'TRUE':
      return 'T'
    case 'FALSE':
      return 'F'
    case 'NOT_GIVEN':
    case 'NOT GIVEN':
      return 'NG'
    default:
      return answer
  }
}

/**
 * Convert from new format (T/F/NG) to old format (TRUE/FALSE/NOT_GIVEN)
 * This is useful for backward compatibility when sending to APIs that expect the old format
 */
export const convertToLongFormat = (answer: string | null | undefined): string | null => {
  if (!answer) return null
  
  switch (answer.toUpperCase()) {
    case 'T':
      return 'TRUE'
    case 'F':
      return 'FALSE'
    case 'NG':
      return 'NOT_GIVEN'
    default:
      return answer
  }
}

/**
 * Normalize answer format to ensure consistency
 * Can handle both old and new formats and convert to the desired format
 */
export const normalizeAnswer = (answer: string | null | undefined, targetFormat: 'short' | 'long' = 'short'): string | null => {
  if (!answer) return null
  
  // First normalize to short format
  const shortFormat = convertToShortFormat(answer)
  
  // Then convert to target format if needed
  if (targetFormat === 'long') {
    return convertToLongFormat(shortFormat)
  }
  
  return shortFormat
}

/**
 * Check if an answer is a True/False/Not Given type answer
 */
export const isTFNGAnswer = (answer: string | null | undefined): boolean => {
  if (!answer) return false
  
  const normalized = answer.toUpperCase().trim()
  return ['TRUE', 'FALSE', 'NOT_GIVEN', 'NOT GIVEN', 'T', 'F', 'NG'].includes(normalized)
}
