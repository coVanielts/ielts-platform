// Common types
export type TestType = 'listening' | 'reading' | 'writing' | 'speaking' | 'full'

// Question types
export type QuestionType =
  | 'gap_fill'
  | 'matching'
  | 'paragraph_ordering'
  | 'reading_comprehension'
  | 'sentence_transformation'
  | 'word_formation'
  | 'multiple_choice'
  | 'multiple_choice_multiple_answers'
  | 'true_false_not_given'
  | 'task1'
  | 'task2'
  | 'speaking'

// Base question interface
export interface Question {
  id: string
  questionNumber: number
  type: QuestionType
  questionRange: string
  instructions: string
  questionText?: string
  speakingTime?: number // Add optional speakingTime property
}

// Base question group interface
interface QuestionGroupBase {
  id: string
  type: 'reading' | 'listening' | 'writing' | 'speaking'
  title: string
  instruction: string
  questionType: string
  keep_matching_choices?: boolean
  questions: Question[]
}

// Writing types
interface WritingTask1Question {
  id: string
  questionNumber: number
  type: 'task1'
  instruction: string
  prompt: string
  imageUrl?: string
  chartData?: string
  minWords: number
  timeLimit: number
  questionRange: string
  instructions: string
}

interface WritingTask2Question {
  id: string
  questionNumber: number
  type: 'task2'
  question: string
  taskType: 'opinion' | 'discussion' | 'problem_solution' | 'advantages_disadvantages'
  minWords: number
  timeLimit: number
  questionRange: string
  instructions: string
}

type WritingQuestion = WritingTask1Question | WritingTask2Question

import type { TransformedWritingQuestion } from './writing.type'

export interface WritingQuestionGroup {
  id: string
  type: 'writing'
  title: string
  instruction: string
  questionType: 'task1' | 'task2'
  content: string
  questions: TransformedWritingQuestion[]
}

// Reading question types
export type ReadingQuestionType =
  | 'gap_fill'
  | 'gap_fill_write_words'
  | 'matching'
  | 'matching_letters'
  | 'paragraph_ordering'
  | 'reading_comprehension'
  | 'sentence_transformation'
  | 'word_formation'
  | 'gap_fill_write_words'
  | 'multiple_choice'
  | 'multiple_choice_multiple_answers'
  | 'true_false_not_given'
  | 'task1'
  | 'task2'

// New Reading Part structure
export interface ReadingPart {
  id: string
  partNumber: 1 | 2 | 3
  passage: {
    title: string
    content: string // Single string content
    contentDoc?: unknown // TipTap JSON document when available
  }
  questionGroups: ReadingQuestionGroup[] // Multiple question types for one passage
  totalQuestions: number // 12-15 questions per part
}

// New Reading Section structure
interface ReadingSection {
  id: string
  title: string
  type: 'reading'
  instruction: string
  timeLimit: number
  parts: ReadingPart[] // 3 parts total
  totalQuestions: number
}

// Updated Reading specific interfaces
export interface ReadingQuestionGroup extends QuestionGroupBase {
  type: 'reading'
  questionType: ReadingQuestionType
  keep_matching_choices?: boolean
  passageReference?: string // Reference to which part of the passage this group relates to
  startQuestion: number // Starting question number
  endQuestion: number // Ending question number
  // Optional rich content/title documents from API
  titleDoc?: unknown
  contentDoc?: unknown
  // For matching_letters question type
  answers?: string[] // Array of statements/questions to match
  letters?: string[] // Array of options to drag and drop
}

// Gap Fill Question
interface GapFillQuestion extends Question {
  type: 'gap_fill'
  title: string
  content: string
  gaps: Array<{
    id: number
    options: string[]
  }>
}

// Matching Question
export interface MatchingQuestion extends Question {
  type: 'matching'
  passages: Array<{
    author: string
    content: string
  }>
  questions: Array<{
    id: number
    statement: string
  }>
}

// Paragraph Ordering Question
export interface ParagraphOrderingQuestion extends Question {
  type: 'paragraph_ordering'
  passage: {
    title: string
    subtitle?: string
    content: string[]
  }
  paragraphOptions: Array<{
    id: string
    content: string
  }>
  gapPositions: number[]
}

// Reading Comprehension Question
export interface ReadingComprehensionQuestion extends Question {
  type: 'reading_comprehension'
  passage: {
    title: string
    content: string[]
  }
  questions: Array<{
    id: number
    question: string
    options: string[]
  }>
}

// Sentence Transformation Question
export interface SentenceTransformationQuestion extends Question {
  type: 'sentence_transformation'
  questions: Array<{
    id: number
    originalSentence: string
    keyWord: string
    transformedStart: string
    transformedEnd: string
  }>
}

// Word Formation Question
export interface WordFormationQuestion extends Question {
  type: 'word_formation'
  title: string
  content: string
  keywords: Array<{
    id: number
    word: string
  }>
}

// Word Gap Question
export interface WordGapQuestion extends Question {
  title: string
  content: string
}

// Multiple Choice Question
export interface ReadingMultipleChoiceQuestion extends Question {
  type: 'multiple_choice'
  question: string
  options: {
    id: string
    text: string
  }[]
  selectedAnswer?: string
  passageReference?: string
}

// Multiple Choice Multiple Answers Question
export interface MultipleChoiceMultipleAnswersQuestion extends Question {
  type: 'multiple_choice_multiple_answers'
  question: string
  options: {
    id: string
    text: string
  }[]
  maxAnswers?: number
  minAnswers?: number
  selectedAnswers?: string[]
}

// True/False/Not Given Question
export interface TrueFalseNotGivenQuestion extends Question {
  type: 'true_false_not_given'
  statement: string
  selectedAnswer?: 'T' | 'F' | 'NG'
  passage?: {
    title: string
    content: string[]
  }
}

// ==============================
// Directus deep response types
// Minimal shapes matching our deep-read fields in tests.sdk.ts
// ==============================

export type DirectusQuestion = {
  id: number
  order: number
  title?: unknown
  choices?: unknown
  correct_answers?: unknown
}

type DirectusQuestionGroup = {
  id: number
  type: string
  title?: unknown
  content?: unknown
  keep_matching_choices?: boolean
  questions?: DirectusQuestion[]
  images?: Array<{ directus_files_id?: string | null }>
  // optional extras we sometimes request
  answers?: unknown
  choices?: unknown
  letters?: unknown
  paragraphs?: unknown
  max_number_of_words?: number | null
  speaking_time?: number | null
}

export type DirectusTestPart = {
  id: number
  order?: number | null
  paragraph?: unknown
  question_groups?: Array<{ question_groups_id: DirectusQuestionGroup }>
}
