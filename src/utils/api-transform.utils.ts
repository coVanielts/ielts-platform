import { Tests } from '@/types/collections.type'
import { ListeningQuestionGroup, ListeningTestData, ListeningTestPart } from '@/types/listening.type'
import type { SpeakingQuestionGroup } from '@/types/speaking.type'
import type {
  DirectusQuestion,
  DirectusTestPart,
  Question,
  QuestionType,
  ReadingPart,
  ReadingQuestionGroup,
  ReadingQuestionType,
  TestType,
} from '@/types/test.type'
import type { DirectusWritingTestData, TiptapContent, TransformedWritingData } from '@/types/writing.type'
import { mapServerQuestionGroupType } from '@/utils/question-type-mapping'

// use Directus* types from '@/types/test.type'

// Minimal transformer: Directus deep test (reading) -> reading UI structure
export function transformDirectusReadingTest(data: Tests): {
  id: string
  title: string
  type: TestType
  instruction: string
  timeLimit: number
  parts: Array<ReadingPart>
} {
  const type: TestType = 'reading'

  const parts: ReadingPart[] = (data.test_parts || [])
    .map((tp: any) => tp.test_parts_id as unknown as DirectusTestPart)
    .filter(Boolean)
    .map((tp: any, index: any) => {
      // Use test part paragraph as passage content (TipTap JSON when available)
      const firstGroup = (tp.question_groups || [])[0]?.question_groups_id
      const passageTitle = firstGroup?.title != null ? String(firstGroup.title) : `Passage ${index + 1}`

      // Build reading groups
      const extractText = (doc: unknown): string => {
        const recur = (n: unknown): string => {
          if (n == null) return ''
          if (typeof n === 'string') return n
          if (Array.isArray(n)) return n.map(recur).join('')
          if (typeof n === 'object') {
            const node = n as { type?: string; text?: unknown; content?: unknown[] }
            if (node.type === 'text' && typeof node.text === 'string') return node.text
            if (Array.isArray(node.content)) return node.content.map(recur).join('')
          }
          return ''
        }
        return recur(doc)
      }

      const readingGroups: ReadingQuestionGroup[] = (tp.question_groups || []).map(
        ({ question_groups_id: gg }: any) => {
          const clientType = (mapServerQuestionGroupType(gg?.type || '') || 'multiple_choice') as ReadingQuestionType

          // Build questions per type
          const qList: DirectusQuestion[] = Array.isArray(gg?.questions) ? (gg?.questions as DirectusQuestion[]) : []
          const questions: Question[] = qList.map((q, qi) => {
            const base = {
              id: String(q.id),
              questionNumber: q.order ?? qi + 1,
              type: clientType as unknown as QuestionType,
              questionRange: '',
              instructions: '',
            }
            if (clientType === 'true_false_not_given') {
              return {
                ...base,
                statement: typeof q.title === 'string' ? q.title : extractText(q.title),
              } as unknown as Question
            }
            if (clientType === 'multiple_choice') {
              const rawChoices = Array.isArray(q.choices) ? (q.choices as unknown[]) : []
              const letters = ['A', 'B', 'C', 'D', 'E', 'F']
              const options = rawChoices.map((c, i) => ({ id: letters[i] ?? String(i + 1), text: String(c) }))
              return {
                ...base,
                question: typeof q.title === 'string' ? q.title : extractText(q.title),
                options,
              } as unknown as Question
            }
            if (clientType === 'multiple_choice_multiple_answers') {
              // For multiple choice multiple answers, choices are at group level, not question level
              const groupChoices = Array.isArray(gg?.choices) ? (gg?.choices as unknown[]) : []
              const letters = ['A', 'B', 'C', 'D', 'E', 'F']
              const options = groupChoices.map((c, i) => ({ id: letters[i] ?? String(i + 1), text: String(c) }))

              // Extract max answers from title/instructions if specified (e.g., "Choose TWO letters")
              const titleText = typeof gg?.title === 'string' ? gg.title : extractText(gg?.title)
              const twoMatch = titleText.match(/choose\s+two/i)
              const threeMatch = titleText.match(/choose\s+three/i)
              const maxAnswers = twoMatch ? 2 : threeMatch ? 3 : undefined

              return {
                ...base,
                question: typeof q.title === 'string' ? q.title : extractText(q.title),
                options,
                maxAnswers,
                minAnswers: maxAnswers, // Same as max for most cases
              } as unknown as Question
            }
            // Default: return base only (e.g., gap_fill_write_words uses group.contentDoc for rendering)
            return base as unknown as Question
          })

          const start = questions[0]?.questionNumber ?? 1
          const end = questions[questions.length - 1]?.questionNumber ?? start

          return {
            id: String(gg.id),
            type: 'reading',
            title: typeof gg.title === 'string' ? gg.title : '',
            titleDoc: typeof gg.title === 'object' ? gg.title : undefined,
            instruction: '',
            questionType: clientType,
            questions,
            startQuestion: start,
            endQuestion: end,
            contentDoc: gg && typeof gg.content === 'object' ? gg.content : undefined,
            // Add matching_letters specific fields
            answers: Array.isArray(gg?.answers) ? (gg.answers as string[]) : undefined,
            letters: Array.isArray(gg?.letters) ? (gg.letters as string[]) : undefined,
          } as ReadingQuestionGroup
        },
      )

      const totalQuestions = readingGroups.reduce((acc, g) => acc + (g.questions?.length || 0), 0)

      return {
        id: String(tp.id),
        partNumber: tp.order as 1 | 2 | 3,
        passage: {
          title: passageTitle,
          content:
            typeof tp.paragraph === 'string' ? tp.paragraph : tp.paragraph != null ? extractText(tp.paragraph) : '',
          contentDoc: tp.paragraph && typeof tp.paragraph === 'object' ? tp.paragraph : undefined,
        },
        questionGroups: readingGroups,
        totalQuestions,
      }
    })

  return {
    id: String(data.id),
    title: data.name ?? 'Untitled Test',
    type,
    instruction: '',
    timeLimit: data.time_limit ?? 60,
    parts,
  }
}

// Transformer: Directus deep test (listening) -> listening UI structure
export function transformDirectusListeningTest(data: Tests): ListeningTestData {
  type DQuestion = { id: number; order: number; title?: unknown; choices?: unknown; correct_answers?: unknown }
  type DGroup = {
    id: number
    type: string
    title?: unknown
    content?: unknown
    questions?: DQuestion[]
    images?: Array<{ directus_files_id?: string | null }>
    answers?: unknown
    letters?: unknown
  }
  type DPart = { id: number; order?: number | null; question_groups?: Array<{ question_groups_id: DGroup }> }

  const toStringArray = (val: unknown): string[] => (Array.isArray(val) ? val.map(v => String(v)) : [])

  // Extract text from TipTap JSON format
  const extractText = (doc: unknown): string => {
    const recur = (n: unknown): string => {
      if (n == null) return ''
      if (typeof n === 'string') return n
      if (Array.isArray(n)) return n.map(recur).join('')
      if (typeof n === 'object') {
        const node = n as { type?: string; text?: unknown; content?: unknown[] }
        if (node.type === 'text' && typeof node.text === 'string') return node.text
        if (Array.isArray(node.content)) return node.content.map(recur).join('')
      }
      return ''
    }
    return recur(doc)
  }

  let globalQuestionNumber = 0
  const nextQn = () => {
    globalQuestionNumber += 1
    return globalQuestionNumber
  }

  const parts: ListeningTestPart[] = (data.test_parts || []).map((tp: any, index: any) => {
    const testPart = tp.test_parts_id as unknown as DPart

    const groups: ListeningQuestionGroup[] = (testPart.question_groups || []).map(({ question_groups_id: gg }) => {
      const mappedType = mapServerQuestionGroupType(gg.type || '')

      // Build base group
      const base: Omit<ListeningQuestionGroup, 'questions'> & { questions: unknown[] } = {
        id: String(gg.id),
        type: 'listening',
        questionType: mappedType as ListeningQuestionGroup['questionType'],
        questionRange: '',
        instructions: '',
        title: gg.title ? (typeof gg.title === 'string' ? gg.title : extractText(gg.title)) : '',
        instruction: '',
        content: gg.content ?? undefined,
        questions: [],
      }

      // Map questions
      const qList: DQuestion[] = Array.isArray(gg.questions) ? (gg.questions as DQuestion[]) : []

      if (base.questionType === 'gap_fill_write_words') {
        base.questions = qList.map(q => ({
          id: String(q.id),
          // Assign a global question number across parts to match IELTS 1..40
          questionNumber: nextQn(),
          type: 'gap_fill_write_words' as const,
          questionRange: '',
          instructions: '',
          // Keep a token as a fallback; actual inline rendering uses [n] found in content
          text: `[${globalQuestionNumber}]`,
        }))
      } else if (base.questionType === 'multiple_choice') {
        const letters = ['A', 'B', 'C', 'D', 'E', 'F']
        base.questions = qList.map(q => {
          const rawChoices = Array.isArray(q.choices) ? (q.choices as unknown[]) : []
          const mappedChoices = rawChoices.map((c, i) => ({ id: letters[i] ?? String(i), text: String(c) }))
          return {
            id: String(q.id),
            questionNumber: nextQn(),
            type: 'multiple_choice' as const,
            questionRange: '',
            instructions: '',
            question: typeof q.title === 'string' ? q.title : '',
            questionDoc: typeof q.title === 'object' ? q.title : undefined,
            choices: mappedChoices,
          }
        })
      } else if (base.questionType === 'matching') {
        // Build a word bank (letters) from questions' correct answers or use a default A-F bank
        const defaultOptions = ['A', 'B', 'C', 'D', 'E', 'F']
        const unionLetters = Array.from(new Set(qList.flatMap(q => toStringArray(q.correct_answers))))
        const options = unionLetters.length > 0 ? unionLetters : defaultOptions

        // Create one task (Task 1) with N speakers = number of questions
        base.questions = qList.map(q => ({
          id: String(q.id),
          questionNumber: nextQn(),
          type: 'matching' as const,
          questionRange: '',
          instructions: '',
          // Use sequential speakers 1..N to fit current UI; semantically these are the items to match
          speaker: 1,
          options,
          taskNumber: 1,
          prompt:
            typeof q.title === 'string'
              ? q.title
              : q.title != null
                ? (() => {
                    try {
                      return JSON.stringify(q.title)
                    } catch {
                      return String(q.title)
                    }
                  })()
                : undefined,
        }))
      } else if (base.questionType === 'map_labeling') {
        const defaultOptions = ['A', 'B', 'C', 'D', 'E', 'F']
        const letters = ['A', 'B', 'C', 'D', 'E', 'F']
        const unionOptions = Array.from(
          new Set(qList.flatMap(q => (Array.isArray(q.choices) ? (q.choices as unknown[]).map(String) : []))),
        )
        const options = unionOptions.length > 0 ? unionOptions : defaultOptions

        // Handle images from the group
        const images = Array.isArray(gg.images)
          ? gg.images
              .map(img => {
                const baseUrl = process.env.NEXT_PUBLIC_DIRECTUS_URL || 'http://18.139.226.174:8055'
                const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
                return {
                  id: img.directus_files_id || '',
                  url: img.directus_files_id
                    ? `${cleanBaseUrl}/assets/${img.directus_files_id}`
                    : '',
                }
              })
              .filter(img => img.id)
          : []

        // Only pass through if it's already HTML; otherwise leave undefined so UI shows placeholder
        const contentValue = typeof gg.content === 'string' && gg.content.includes('<') ? gg.content : undefined

        base.questions = qList.map((q, idx: number) => {
          const descList = Array.isArray(q.choices) ? (q.choices as unknown[]) : []
          const description = descList.length > 0 ? String(descList[0]) : ''
          return {
            id: String(q.id),
            questionNumber: nextQn(),
            type: 'map_labeling' as const,
            questionRange: '',
            instructions: '',
            content: contentValue,
            mapDescription: undefined,
            label: letters[idx] ?? String(idx + 1),
            options,
            description,
            images, // Add images to each question
          }
        })
      } else if (base.questionType === 'matching_letters') {
        // Add specific handling for matching_letters
        const answersFromGroup = Array.isArray(gg.answers) ? (gg.answers as string[]) : []
        const lettersFromGroup = Array.isArray(gg.letters) ? (gg.letters as string[]) : []

        // Include both answers and letters arrays from group level for API data
        base.answers = answersFromGroup
        base.letters = lettersFromGroup

        base.questions = qList.map(q => ({
          id: String(q.id),
          questionNumber: nextQn(),
          type: 'matching_letters' as const,
          questionRange: '',
          instructions: '',
          statement: typeof q.title === 'string' ? q.title : '',
        }))
      } else {
        // For now, only gap_fill_write_words is mapped for listening (as per provided payload)
        base.questions = []
      }

      return base as ListeningQuestionGroup
    })

    return {
      id: String(testPart.id),
      partNumber: (testPart.order ?? index) + 1,
      title: `Part ${(testPart.order ?? index) + 1}`,
      instruction: '',
      questionGroups: groups,
    }
  })

  return {
    id: String(data.id),
    title: data.name ?? 'Untitled Listening Test',
    type: 'listening',
    instruction: '',
    timeLimit: data.time_limit ?? 30,
    parts,
    audioUrl: typeof data.audio === 'string' ? data.audio : data.audio?.id || '/assets/audio/listening_test.mp3',
  }
}

// Transform Directus writing test response to WritingTestData
export function transformDirectusWritingTest(data: DirectusWritingTestData): TransformedWritingData {
  const extractText = (doc: unknown): string => {
    const recur = (n: unknown): string => {
      if (n == null) return ''
      if (typeof n === 'string') return n
      if (Array.isArray(n)) return n.map(recur).join('')
      if (typeof n === 'object') {
        const node = n as { type?: string; text?: unknown; content?: unknown[] }
        if (node.type === 'text' && typeof node.text === 'string') return node.text
        if (Array.isArray(node.content)) return node.content.map(recur).join('')
      }
      return ''
    }
    return recur(doc)
  }

  const parts = (data.test_parts || [])
    .map((tp: unknown) => (tp as { test_parts_id: unknown }).test_parts_id)
    .filter(Boolean)
    .map((part: unknown) => {
      const partData = part as {
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
            images?: Array<{ id?: string; url?: string }>
          }
        }>
      }

      return {
        id: String(partData.id),
        order: partData.order || 1,
        questionGroups: (partData.question_groups || [])
          .map((qg: unknown) => (qg as { question_groups_id: unknown }).question_groups_id)
          .filter(Boolean)
          .map((group: unknown) => {
            const groupData = group as {
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
              images?: Array<{ id?: string; url?: string }>
            }

            return {
              id: String(groupData.id),
              type: 'writing' as const,
              order: groupData.order || 1,
              title: extractText(groupData.title) || '',
              titleDoc: groupData.title,
              content: extractText(groupData.content) || '',
              contentDoc: groupData.content,
              maxWords: groupData.max_number_of_words,
              questions: (groupData.questions || []).map((q: unknown) => {
                const questionData = q as {
                  id: number
                  order: number
                  title?: TiptapContent
                }

                return {
                  id: String(questionData.id),
                  order: questionData.order || 1,
                  title: extractText(questionData.title) || '',
                  titleDoc: questionData.title,
                }
              }),
              images: groupData.images || [],
            }
          }),
      }
    })

  return {
    id: String(data.id),
    title: data.name || 'Writing Test',
    type: 'Writing',
    instruction: '',
    timeLimit: data.time_limit || 60,
    questionGroups: parts.map(p => p.questionGroups) as any,
    parts,
  }
}

// Transformer: Directus deep test (speaking) -> speaking UI structure
export function transformDirectusSpeakingTest(data: Tests): {
  id: string
  title: string
  type: 'speaking'
  instruction: string
  timeLimit: number
  questionGroups: SpeakingQuestionGroup[]
} {
  // Extract text from TipTap JSON format
  const extractText = (doc: unknown): string => {
    const recur = (n: unknown): string => {
      if (n == null) return ''
      if (typeof n === 'string') return n
      if (Array.isArray(n)) return n.map(recur).join('')
      if (typeof n === 'object') {
        const node = n as { type?: string; text?: unknown; content?: unknown[] }
        if (node.type === 'text' && typeof node.text === 'string') return node.text
        if (Array.isArray(node.content)) return node.content.map(recur).join('')
      }
      return ''
    }
    return recur(doc)
  }

  let globalQn = 0
  const nextQn = () => {
    globalQn += 1
    return globalQn
  }

  const parts = (data.test_parts || []).map(tp => tp.test_parts_id as unknown as DirectusTestPart).filter(Boolean)

  const questionGroups: SpeakingQuestionGroup[] = parts.map((tp, idx) => {
    const order = tp.order && tp.order > 0 ? tp.order : idx + 1
    const qGroups = (tp.question_groups || []).map(qg => qg.question_groups_id).filter(Boolean) as Array<{
      id: number
      type?: string
      speaking_time?: number | null
      questions?: Array<{ id: number; order?: number | null; title?: unknown }>
      title?: unknown
      content?: unknown
    }>

    // Flatten questions across all groups within the part (usually there's only one)
    const questions = qGroups.flatMap(gg => (gg.questions || []).map(q => ({ gg, q })))

    const speakingTime = qGroups.find(g => typeof g.speaking_time === 'number')?.speaking_time || undefined

    const mappedQuestions = questions.map(({ q }) => ({
      id: String(q.id),
      type: 'speaking' as const,
      questionNumber: nextQn(),
      questionText: typeof q.title === 'string' ? (q.title as string) : extractText(q.title),
      speakingTime: speakingTime ?? undefined,
      questionRange: `Question ${globalQn}`,
      instructions: speakingTime ? `Speak for up to ${speakingTime} seconds` : '',
    }))

    // Prefer instruction from group content/title; fallback to speaking_time hint
    const groupTitleFromServer = qGroups.map(g => extractText(g.title)).find(t => t && t.trim().length > 0)
    const groupContentFromServer = qGroups.map(g => extractText(g.content)).find(c => c && c.trim().length > 0)
    const derivedInstruction =
      (groupContentFromServer && groupContentFromServer.trim()) ||
      (groupTitleFromServer && groupTitleFromServer.trim()) ||
      (speakingTime ? `Speak for up to ${speakingTime} seconds` : '')

    const group: SpeakingQuestionGroup = {
      id: String(tp.id),
      type: 'speaking',
      questionType: `part${order}` as SpeakingQuestionGroup['questionType'],
      title: groupTitleFromServer && groupTitleFromServer.trim().length > 0 ? groupTitleFromServer : `Part ${order}`,
      instruction: derivedInstruction,
      questions: mappedQuestions,
    }

    return group
  })

  return {
    id: String(data.id),
    title: data.name || 'Speaking Test',
    type: 'speaking',
    instruction: '',
    timeLimit: data.time_limit ?? 15,
    questionGroups,
  }
}
