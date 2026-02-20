/**
 * Quiz Zod Validation Schemas
 * REQ-FE-601: Zod schemas for quiz domain validation
 *
 * Provides runtime validation for:
 * - Quiz creation/update (CreateQuizSchema)
 * - Question types (QuestionSchema discriminated union)
 * - Multiple choice options (MultipleChoiceOptionSchema)
 * - AI generation options (GenerationOptionsSchema)
 * - Draft answers (DraftAnswerSchema discriminated union)
 */

import { z } from "zod";

// ============================================================================
// Enum Schemas
// ============================================================================

/**
 * Question type enum schema
 */
export const QuestionTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "short_answer",
  "fill_in_the_blank",
]);

/**
 * Quiz status enum schema
 */
export const QuizStatusSchema = z.enum(["draft", "published", "closed"]);

/**
 * Difficulty level schema
 */
export const DifficultySchema = z.enum(["easy", "medium", "hard"]);

// ============================================================================
// Multiple Choice Option Schema
// ============================================================================

/**
 * Multiple choice option schema
 * REQ-FE-601: text (min 1, max 500), 2-8 options
 */
export const MultipleChoiceOptionSchema = z.object({
  id: z.string().uuid(),
  text: z.string().min(1, "Option text is required").max(500, "Option text must be 500 characters or less"),
});

/**
 * Options array refinement: min 2, max 8 options
 */
const OptionsArraySchema = z.array(MultipleChoiceOptionSchema)
  .min(2, "At least 2 options are required")
  .max(8, "Maximum 8 options allowed");

// ============================================================================
// Question Schema (Discriminated Union)
// ============================================================================

/**
 * Base question fields schema
 * REQ-FE-601: questionText (min 5, max 2000), points (1-100), explanation (optional, max 2000)
 */
const BaseQuestionFieldsSchema = z.object({
  id: z.string().uuid(),
  quizId: z.string().uuid(),
  order: z.number().int().min(0),
  questionText: z.string()
    .min(5, "Question text must be at least 5 characters")
    .max(2000, "Question text must be 2000 characters or less"),
  points: z.number().int().min(1, "Points must be at least 1").max(100, "Points cannot exceed 100"),
  explanation: z.string().max(2000, "Explanation must be 2000 characters or less").nullable(),
});

/**
 * Multiple choice question schema
 */
const MultipleChoiceQuestionSchema = BaseQuestionFieldsSchema.extend({
  type: z.literal("multiple_choice"),
  options: OptionsArraySchema,
  correctOptionId: z.string().uuid(),
});

/**
 * True/false question schema
 */
const TrueFalseQuestionSchema = BaseQuestionFieldsSchema.extend({
  type: z.literal("true_false"),
  correctAnswer: z.boolean(),
});

/**
 * Short answer question schema
 */
const ShortAnswerQuestionSchema = BaseQuestionFieldsSchema.extend({
  type: z.literal("short_answer"),
  sampleAnswer: z.string().max(2000, "Sample answer must be 2000 characters or less").nullable(),
});

/**
 * Fill-in-the-blank question schema
 */
const FillInBlankQuestionSchema = BaseQuestionFieldsSchema.extend({
  type: z.literal("fill_in_the_blank"),
  blanks: z.array(z.object({
    id: z.string(),
    answer: z.string().min(1, "Blank answer is required"),
  })),
});

/**
 * Discriminated union of all question types
 * REQ-FE-601: discriminated union by `type` for all four question types
 */
export const QuestionSchema = z.discriminatedUnion("type", [
  MultipleChoiceQuestionSchema,
  TrueFalseQuestionSchema,
  ShortAnswerQuestionSchema,
  FillInBlankQuestionSchema,
]);

// ============================================================================
// Create Quiz Schema
// ============================================================================

/**
 * Quiz creation input schema
 * REQ-FE-601:
 * - title (min 3, max 200)
 * - description (optional, max 1000)
 * - courseId (uuid)
 * - timeLimitMinutes (optional, 1-300 integer)
 * - passingScore (optional, 0-100 integer)
 * - allowReattempt (boolean)
 * - shuffleQuestions (boolean)
 * - showAnswersAfterSubmit (boolean)
 * - focusLossWarning (boolean)
 * - dueDate (optional ISO date string)
 */
export const CreateQuizSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(200, "Title must be 200 characters or less"),

  description: z.string()
    .max(1000, "Description must be 1000 characters or less")
    .optional(),

  courseId: z.string().uuid("Course ID must be a valid UUID"),

  timeLimitMinutes: z.number()
    .int("Time limit must be an integer")
    .min(1, "Time limit must be at least 1 minute")
    .max(300, "Time limit cannot exceed 300 minutes")
    .optional(),

  passingScore: z.number()
    .int("Passing score must be an integer")
    .min(0, "Passing score cannot be negative")
    .max(100, "Passing score cannot exceed 100")
    .optional(),

  allowReattempt: z.boolean(),
  shuffleQuestions: z.boolean(),
  showAnswersAfterSubmit: z.boolean(),
  focusLossWarning: z.boolean(),

  dueDate: z.string()
    .datetime({ message: "Due date must be a valid ISO date string" })
    .optional(),
});

// ============================================================================
// Generation Options Schema
// ============================================================================

/**
 * AI generation options schema
 * REQ-FE-601:
 * - materialIds (min 1 uuid array)
 * - count (1-50 integer)
 * - difficulty (easy | medium | hard)
 * - questionTypes (non-empty array of QuestionType)
 */
export const GenerationOptionsSchema = z.object({
  materialIds: z.array(z.string().uuid())
    .min(1, "At least one material is required"),

  count: z.number()
    .int("Question count must be an integer")
    .min(1, "At least 1 question is required")
    .max(50, "Maximum 50 questions allowed"),

  difficulty: DifficultySchema,

  questionTypes: z.array(QuestionTypeSchema)
    .min(1, "At least one question type is required"),
});

// ============================================================================
// Draft Answer Schema (Discriminated Union)
// ============================================================================

/**
 * Multiple choice draft answer schema
 */
const MultipleChoiceDraftAnswerSchema = z.object({
  questionId: z.string().uuid(),
  type: z.literal("multiple_choice"),
  selectedOptionId: z.string().uuid().nullable(),
});

/**
 * True/false draft answer schema
 */
const TrueFalseDraftAnswerSchema = z.object({
  questionId: z.string().uuid(),
  type: z.literal("true_false"),
  selectedAnswer: z.boolean().nullable(),
});

/**
 * Short answer draft answer schema
 */
const ShortAnswerDraftAnswerSchema = z.object({
  questionId: z.string().uuid(),
  type: z.literal("short_answer"),
  text: z.string(),
});

/**
 * Fill-in-the-blank draft answer schema
 */
const FillInBlankDraftAnswerSchema = z.object({
  questionId: z.string().uuid(),
  type: z.literal("fill_in_the_blank"),
  filledAnswers: z.record(z.string()),
});

/**
 * Discriminated union of all draft answer types
 * REQ-FE-601: discriminated union matching DraftAnswer type
 */
export const DraftAnswerSchema = z.discriminatedUnion("type", [
  MultipleChoiceDraftAnswerSchema,
  TrueFalseDraftAnswerSchema,
  ShortAnswerDraftAnswerSchema,
  FillInBlankDraftAnswerSchema,
]);

// ============================================================================
// Inferred Types (suffixed with Schema to avoid conflict with domain types)
// ============================================================================

export type QuestionTypeSchemaInput = z.infer<typeof QuestionTypeSchema>;
export type DifficultySchemaInput = z.infer<typeof DifficultySchema>;
export type CreateQuizSchemaInput = z.infer<typeof CreateQuizSchema>;
export type GenerationOptionsSchemaInput = z.infer<typeof GenerationOptionsSchema>;
export type DraftAnswerSchemaInput = z.infer<typeof DraftAnswerSchema>;
export type QuestionSchemaInput = z.infer<typeof QuestionSchema>;
