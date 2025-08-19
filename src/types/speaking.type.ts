import { Question, QuestionGroupBase } from './question.type'

export interface SpeakingQuestion extends Question {
  type: 'speaking'
  questionText: string
  preparationTime?: number // in seconds
  speakingTime?: number // in seconds
  audioResponse?: string // URL of uploaded audio
  questionRange: string
  instructions: string
}

export interface SpeakingQuestionGroup extends QuestionGroupBase {
  type: 'speaking'
  questionType: 'part1' | 'part2' | 'part3'
  questions: SpeakingQuestion[]
  title: string
  instruction: string
}
