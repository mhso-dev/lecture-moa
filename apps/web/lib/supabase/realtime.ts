import { RealtimeChannel } from '@supabase/supabase-js';

import { QA_CHANNELS, QA_REALTIME_FILTERS } from '@shared/constants/realtime';

import { createClient } from './client';

/**
 * Callbacks for question real-time subscription events.
 *
 * REQ-BE-004-025: Subscribe to new answers, question updates, and answer updates
 * when a user enters the question detail page.
 */
export interface QuestionRealtimeCallbacks {
  /**
   * Called when a new answer is inserted for the subscribed question.
   * REQ-BE-004-026: answers table INSERT event for the specific question_id.
   */
  onNewAnswer?: (payload: unknown) => void;

  /**
   * Called when the question's status or upvote count is updated.
   * REQ-BE-004-027: questions table UPDATE event for the specific question id.
   */
  onQuestionUpdated?: (payload: unknown) => void;

  /**
   * Called when an answer belonging to the question is updated (e.g., accepted).
   * answers table UPDATE event filtered by question_id.
   */
  onAnswerUpdated?: (payload: unknown) => void;
}

/**
 * Subscribe to real-time updates for a specific question.
 *
 * Listens for:
 * - New answers (INSERT on answers table filtered by question_id)
 * - Question status/upvote changes (UPDATE on questions table filtered by id)
 * - Answer updates such as acceptance (UPDATE on answers table filtered by question_id)
 *
 * REQ-BE-004-024: Channel names are managed via QA_CHANNELS constants.
 * REQ-BE-004-025: Subscribes to the question detail channel on page entry.
 * REQ-BE-004-029: Provides channel creation and subscription utilities.
 *
 * @param questionId - The ID of the question to subscribe to
 * @param callbacks - Event handler callbacks for each change type
 * @returns The created RealtimeChannel instance (keep a reference for cleanup)
 */
export function subscribeToQuestion(
  questionId: string,
  callbacks: QuestionRealtimeCallbacks,
): RealtimeChannel {
  const supabase = createClient();
  const channelName = QA_CHANNELS.questionDetail(questionId);

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      QA_REALTIME_FILTERS.newAnswer(questionId),
      (payload) => {
        callbacks.onNewAnswer?.(payload);
      },
    )
    .on(
      'postgres_changes',
      QA_REALTIME_FILTERS.questionUpdate(questionId),
      (payload) => {
        callbacks.onQuestionUpdated?.(payload);
      },
    )
    .on(
      'postgres_changes',
      QA_REALTIME_FILTERS.answerUpdate(questionId),
      (payload) => {
        callbacks.onAnswerUpdated?.(payload);
      },
    )
    .subscribe();

  return channel;
}

/**
 * Unsubscribe from a Realtime channel and release its resources.
 *
 * REQ-BE-004-028: The channel must be unsubscribed when the user leaves
 * the question detail page to prevent memory leaks and unnecessary connections.
 * REQ-BE-004-029: Provides channel unsubscription utilities.
 *
 * @param channel - The RealtimeChannel instance returned by subscribeToQuestion
 */
export async function unsubscribeFromChannel(channel: RealtimeChannel): Promise<void> {
  const supabase = createClient();
  await supabase.removeChannel(channel);
}
