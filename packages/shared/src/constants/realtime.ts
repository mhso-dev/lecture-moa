// Q&A Realtime channels
export const QA_CHANNELS = {
  // Individual question detail channel: receive new answers, status changes in real-time
  questionDetail: (questionId: string) =>
    `qa:question:${questionId}` as const,
} as const;

// Realtime postgres_changes event filters
export const QA_REALTIME_FILTERS = {
  // Detect new answers for a specific question
  newAnswer: (questionId: string) => ({
    event: 'INSERT' as const,
    schema: 'public',
    table: 'answers',
    filter: `question_id=eq.${questionId}`,
  }),
  // Detect question status/upvote changes
  questionUpdate: (questionId: string) => ({
    event: 'UPDATE' as const,
    schema: 'public',
    table: 'questions',
    filter: `id=eq.${questionId}`,
  }),
  // Detect answer updates (acceptance, etc.) for a specific question
  answerUpdate: (questionId: string) => ({
    event: 'UPDATE' as const,
    schema: 'public',
    table: 'answers',
    filter: `question_id=eq.${questionId}`,
  }),
} as const;
