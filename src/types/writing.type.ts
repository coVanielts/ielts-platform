// Writing test data types for TipTap rich text editor

import { WritingQuestionGroup } from '@/types/test.type'

export interface TiptapContent {
  type: string
  content?: TiptapContent[]
  attrs?: Record<string, unknown>
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>
  text?: string
}

interface WritingImageData {
  id?: string
  url?: string
}

export interface TransformedWritingQuestion {
  id: string
  order: number
  title: string
  titleDoc?: TiptapContent
}

interface TransformedWritingQuestionGroup {
  id: string
  type: 'writing'
  order: number
  title: string
  titleDoc?: TiptapContent
  content: string
  contentDoc?: TiptapContent
  maxWords?: number
  questions: TransformedWritingQuestion[]
  images?: WritingImageData[]
}

interface TransformedWritingPart {
  id: string
  order: number
  questionGroups: TransformedWritingQuestionGroup[]
}

export interface TransformedWritingData {
  id: string
  title: string
  type: 'Writing'
  timeLimit: number
  instruction?: string
  parts: TransformedWritingPart[]
  questionGroups: WritingQuestionGroup[]
}

// For API response transformation
export interface DirectusWritingTestData {
  id: number
  name: string
  type: string
  time_limit: number
  test_parts: Array<{
    test_parts_id: {
      id: number
      order: number
      question_groups: Array<{
        question_groups_id: {
          id: number
          type: string
          order: number
          title?: TiptapContent
          content?: TiptapContent
          max_number_of_words?: number
          questions: Array<{
            id: number
            order: number
            title?: TiptapContent
          }>
          images?: Array<{
            id?: string
            url?: string
          }>
        }
      }>
    }
  }>
}

// Helper function to extract text from TipTap content
function extractTextFromTiptap(content: TiptapContent | undefined): string {
  if (!content) return ''

  if (content.text) return content.text

  if (content.content) {
    return content.content.map(extractTextFromTiptap).join('')
  }

  return ''
}
