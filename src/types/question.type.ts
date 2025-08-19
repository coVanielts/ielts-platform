type QuestionType =
  | 'multiple_choice'
  | 'multiple_choice_multiple_answers'
  | 'gap_fill'
  | 'matching'
  | 'paragraph_ordering'
  | 'word_formation'
  | 'sentence_transformation'
  | 'true_false_not_given'
  | 'gap_fill_write_words'
  | 'map_labeling'
  | 'task1'
  | 'task2'
  | 'speaking'

export interface Question {
  id: string
  type: QuestionType
  questionNumber: number
}

export interface QuestionGroupBase {
  id: string
  type: 'reading' | 'listening' | 'writing' | 'speaking'
  questionType: string
  questions: Question[]
  instructions?: string
  questionRange?: string
}

interface TestDataBase {
  id: string
  title: string
  type: 'reading' | 'listening'
  instruction: string
  timeLimit: number
  questionGroups: QuestionGroupBase[]
}

// Common props for components
interface QuestionComponentProps {
  isReadOnly?: boolean
  onAnswerChange: (questionId: string, answer: string) => void
}

interface MultipleChoiceQuestionProps extends QuestionComponentProps {
  question: string
  choices: {
    id: string
    text: string
  }[]
  context?: string
  passageReference?: string
}

interface GapFillQuestionProps extends QuestionComponentProps {
  text: string
  gaps?: string[]
  content?: string
  title?: string
}

interface MatchingQuestionProps extends QuestionComponentProps {
  questions: {
    id: string
    text?: string
    statement?: string
    speaker?: number
  }[]
  options: string[]
  passages?: {
    id: string
    content: string
  }[]
  taskNumber?: number
}

interface QuestionGroupProps {
  group: QuestionGroupBase
  onAnswerChange: (questionId: string, answer: any) => void
  isReadOnly?: boolean
  currentQuestion?: number
}
