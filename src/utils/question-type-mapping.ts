// Helper function to map server question group types to client types
export const mapServerQuestionGroupType = (serverType: string): string => {
  const typeMapping: Record<string, string> = {
    // Server type -> Client type
    map_labelling: 'map_labeling',
    gap_fill_mcq: 'gap_fill',
    gap_fill_write_words: 'gap_fill_write_words',
    multiple_choices_t_f_ng: 'true_false_not_given',
    multiple_choices_multiple_answers: 'multiple_choice_multiple_answers',
    matching_letters: 'matching_letters',
    multiple_choices: 'multiple_choice',

    // Writing types
    task1: 'task1',
    task2: 'task2',

    // Speaking types
    part1: 'part1',
    part2: 'part2',
    part3: 'part3',

    // Reading types (additional)
    paragraph_ordering: 'paragraph_ordering',
    reading_comprehension: 'reading_comprehension',
    sentence_transformation: 'sentence_transformation',
    word_formation: 'word_formation',
  }

  return typeMapping[serverType] || serverType
}

// Validate if a question group type is supported
export const isSupportedQuestionGroupType = (type: string): boolean => {
  const supportedTypes = [
    // Listening types
    'map_labeling',
    'gap_fill',
    'gap_fill_write_words',
    'multiple_choice',
    'multiple_choice_multiple_answers',
    'matching',
    'matching_letters',
    'true_false_not_given',

    // Reading types
    'true_false_not_given',
    'paragraph_ordering',
    'reading_comprehension',
    'sentence_transformation',
    'word_formation',

    // Writing types
    'task1',
    'task2',

    // Speaking types
    'part1',
    'part2',
    'part3',
  ]

  return supportedTypes.includes(type)
}
