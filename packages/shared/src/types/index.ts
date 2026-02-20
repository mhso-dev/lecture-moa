/**
 * Types Index
 * Export all shared type definitions
 */

export * from "./auth.types";
export * from "./api.types";
export * from "./dashboard.types";
export * from "./material.types";
export * from "./course.types";
export * from "./qa.types";

// Quiz types - explicitly export to avoid conflict with dashboard QuizResult
export type {
  QuestionType,
  QuizStatus,
  AttemptStatus,
  BaseQuestion,
  MultipleChoiceQuestion,
  TrueFalseQuestion,
  ShortAnswerQuestion,
  FillInBlankQuestion,
  Question,
  DraftAnswer,
  MultipleChoiceDraftAnswer,
  TrueFalseDraftAnswer,
  ShortAnswerDraftAnswer,
  FillInBlankDraftAnswer,
  QuizListItem,
  QuizDetail,
  QuizAttempt,
  QuizModuleResult,
  QuestionResult,
  GeneratedQuestion,
  QuizSubmissionSummary,
  CreateQuizInput,
  GenerationOptions,
} from "./quiz.types";

// REQ-FE-700, REQ-FE-701: Team and Memo types
export * from "./team.types";
export * from "./memo.types";
