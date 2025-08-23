interface ListeningQuestionBase {
  id: string
  questionNumber: number
  type:
    | 'multiple_choice'
    | 'gap_fill_write_words'
    | 'matching'
    | 'matching_letters'
    | 'multiple_choice_multiple_answers'
    | 'map_labeling'
    | 'true_false_not_given'
  questionRange: string
  instructions: string
}

export interface ListeningMultipleChoiceQuestion extends ListeningQuestionBase {
  type: 'multiple_choice'
  extract?: {
    id: number
    context: string
  }
  question: string
  // Optional TipTap doc for rich title
  questionDoc?: unknown
  choices: {
    id: string
    text: string
  }[]
}

interface ListeningMultipleChoiceMultipleAnswersQuestion extends ListeningQuestionBase {
  type: 'multiple_choice_multiple_answers'
  extract?: {
    id: number
    context: string
  }
  question: string
  options: {
    id: string
    text: string
  }[]
  maxAnswers?: number
  minAnswers?: number
}

export interface ListeningWordGapQuestion extends ListeningQuestionBase {
  type: 'gap_fill_write_words'
  text: string
}

export interface ListeningMatchingQuestion extends ListeningQuestionBase {
  type: 'matching'
  speaker: number
  options: string[]
  taskNumber: number
  // Optional prompt/label to display for each item (e.g., show name)
  prompt?: string
}

interface ListeningMatchingLettersQuestion extends ListeningQuestionBase {
  type: 'matching_letters'
  statement: string
  // Optional prompt/label to display for each item
  prompt?: string
}

interface ListeningMapLabelingQuestion extends ListeningQuestionBase {
  type: 'map_labeling'
  content?: string // HTML content from editor
  mapDescription?: string
  label: string // Position label on map (A, B, C, etc.)
  options?: string[] // Word bank if provided
  description?: string // Description for this specific question/label
  images?: Array<{ id: string; url: string }> // Directus images
}

interface ListeningTrueFalseNotGivenQuestion extends ListeningQuestionBase {
  type: 'true_false_not_given'
  statement: string
}

export interface ListeningQuestionGroup {
  id: string
  type: 'listening'
  questionType:
    | 'multiple_choice'
    | 'gap_fill_write_words'
    | 'matching'
    | 'matching_letters'
    | 'multiple_choice_multiple_answers'
    | 'map_labeling'
    | 'true_false_not_given'
  questionRange?: string
  instructions?: string
  title: string
  instruction: string
  // Optional rich content (e.g., TipTap doc) for word-gap style questions with numbered blanks [1]..[n]
  content?: unknown
  // For matching_letters questions - the list of available options to match
  letters?: string[]
  // For matching_letters questions - the list of statements to match (API format)
  answers?: string[]
  // Whether to keep matching choices visible after selection (for drag-drop)
  keep_matching_choices?: boolean
  questions: (
    | ListeningMultipleChoiceQuestion
    | ListeningWordGapQuestion
    | ListeningMatchingQuestion
    | ListeningMatchingLettersQuestion
    | ListeningMultipleChoiceMultipleAnswersQuestion
    | ListeningMapLabelingQuestion
    | ListeningTrueFalseNotGivenQuestion
  )[]
}

export interface ListeningTestPart {
  id: string
  partNumber: number
  title: string
  instruction: string
  questionGroups: ListeningQuestionGroup[]
}

export interface ListeningTestData {
  id: string
  title: string
  type: 'listening'
  instruction: string
  timeLimit: number
  parts: ListeningTestPart[]
  audioUrl: string
}
