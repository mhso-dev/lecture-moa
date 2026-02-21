/**
 * Quiz Domain Type Definitions
 * REQ-FE-600: Quiz Domain Types
 *
 * TypeScript types for the quiz domain covering quiz entities,
 * questions (discriminated union), attempts, answers, and results.
 */

// ============================================================================
// Enum-like Types
// ============================================================================

/**
 * Supported question types
 */
export type QuestionType = "multiple_choice" | "true_false" | "short_answer" | "fill_in_the_blank";

/**
 * Quiz lifecycle status
 */
export type QuizStatus = "draft" | "published" | "closed";

/**
 * Quiz attempt status
 */
export type AttemptStatus = "in_progress" | "submitted" | "graded";

// ============================================================================
// Question Types (Discriminated Union)
// ============================================================================

/**
 * Base fields shared by all question types
 */
export interface BaseQuestion {
  id: string;
  quizId: string;
  order: number;
  questionText: string;
  points: number;
  explanation: string | null;
}

/**
 * Multiple choice question with selectable options
 */
export interface MultipleChoiceQuestion extends BaseQuestion {
  type: "multiple_choice";
  options: { id: string; text: string }[];
  correctOptionId: string;
}

/**
 * True/false question
 */
export interface TrueFalseQuestion extends BaseQuestion {
  type: "true_false";
  correctAnswer: boolean;
}

/**
 * Short answer question requiring text response
 */
export interface ShortAnswerQuestion extends BaseQuestion {
  type: "short_answer";
  sampleAnswer: string | null;
}

/**
 * Fill-in-the-blank question with multiple blanks
 */
export interface FillInBlankQuestion extends BaseQuestion {
  type: "fill_in_the_blank";
  blanks: { id: string; answer: string }[];
}

/**
 * Discriminated union of all question types
 * Use `question.type` to narrow the type
 */
export type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | FillInBlankQuestion;

// ============================================================================
// Draft Answer Types (Discriminated Union)
// ============================================================================

/**
 * Answer for multiple choice question
 */
export interface MultipleChoiceDraftAnswer {
  questionId: string;
  type: "multiple_choice";
  selectedOptionId: string | null;
}

/**
 * Answer for true/false question
 */
export interface TrueFalseDraftAnswer {
  questionId: string;
  type: "true_false";
  selectedAnswer: boolean | null;
}

/**
 * Answer for short answer question
 */
export interface ShortAnswerDraftAnswer {
  questionId: string;
  type: "short_answer";
  text: string;
}

/**
 * Answer for fill-in-the-blank question
 */
export interface FillInBlankDraftAnswer {
  questionId: string;
  type: "fill_in_the_blank";
  filledAnswers: Record<string, string>;
}

/**
 * Discriminated union of all draft answer types
 * Use `answer.type` to narrow the type
 */
export type DraftAnswer =
  | MultipleChoiceDraftAnswer
  | TrueFalseDraftAnswer
  | ShortAnswerDraftAnswer
  | FillInBlankDraftAnswer;

// ============================================================================
// Quiz Types
// ============================================================================

/**
 * Quiz list item for displaying in quiz lists
 */
export interface QuizListItem {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  status: QuizStatus;
  questionCount: number;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  dueDate: string | null;
  attemptCount: number;
  myLastAttemptScore: number | null;
  createdAt: string;
}

/**
 * Full quiz detail with all configuration and questions
 */
export interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  courseName: string;
  status: QuizStatus;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  allowReattempt: boolean;
  shuffleQuestions: boolean;
  showAnswersAfterSubmit: boolean;
  focusLossWarning: boolean;
  dueDate: string | null;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Quiz Attempt Types
// ============================================================================

/**
 * Quiz attempt tracking student progress
 */
export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  status: AttemptStatus;
  answers: DraftAnswer[];
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
}

// ============================================================================
// Result Types
// ============================================================================

/**
 * Per-question result in a completed quiz
 */
export interface QuestionResult {
  questionId: string;
  questionText: string;
  type: QuestionType;
  isCorrect: boolean | null;
  points: number;
  earnedPoints: number;
  studentAnswer: DraftAnswer;
  correctAnswer: unknown;
  explanation: string | null;
}

/**
 * Full quiz result after submission
 * Use this for the quiz results page, not dashboard summaries
 */
export interface QuizModuleResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean | null;
  timeTaken: number;
  questionResults: QuestionResult[];
}

// ============================================================================
// Instructor Types
// ============================================================================

/**
 * AI-generated question before being added to quiz
 */
export interface GeneratedQuestion {
  tempId: string;
  type: QuestionType;
  questionText: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  correctAnswer?: boolean;
  sampleAnswer?: string;
  blanks?: { id: string; answer: string }[];
  explanation: string | null;
  points: number;
}

/**
 * Student submission summary for instructor view
 */
export interface QuizSubmissionSummary {
  userId: string;
  userName: string;
  attemptId: string;
  score: number;
  percentage: number;
  passed: boolean | null;
  submittedAt: string;
}

// ============================================================================
// Input Types
// ============================================================================

/**
 * Quiz creation/update input
 */
export interface CreateQuizInput {
  title: string;
  description?: string;
  courseId: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  allowReattempt: boolean;
  shuffleQuestions: boolean;
  showAnswersAfterSubmit: boolean;
  focusLossWarning: boolean;
  dueDate?: string;
}

/**
 * AI question generation options
 */
export interface GenerationOptions {
  materialIds: string[];
  count: number;
  difficulty: "easy" | "medium" | "hard";
  questionTypes: QuestionType[];
}
