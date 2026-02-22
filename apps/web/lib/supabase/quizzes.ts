/**
 * Supabase Query Layer for Quizzes
 *
 * Provides direct Supabase database access for all quiz-related operations.
 * Replaces REST API calls with typed Supabase client queries.
 * Uses browser client by default; accepts optional client for Server Components.
 */

import { createClient } from "./client";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "~/types/supabase";
import type {
  QuizListItem,
  QuizDetail,
  QuizAttempt,
  QuizModuleResult,
  QuizSubmissionSummary,
  QuestionResult,
  QuizStatus,
  AttemptStatus,
  Question,
  DraftAnswer,
} from "@shared";

// ---------------------------------------------------------------------------
// Database Row Type Aliases
// ---------------------------------------------------------------------------

type QuizRow = Database["public"]["Tables"]["quizzes"]["Row"];
type QuestionRow = Database["public"]["Tables"]["quiz_questions"]["Row"];
type AttemptRow = Database["public"]["Tables"]["quiz_attempts"]["Row"];
type CourseRow = Database["public"]["Tables"]["courses"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// Intermediate types for embedded resource query results
type QuizWithCourseAndCounts = QuizRow & {
  course: Pick<CourseRow, "title"> | null;
  quiz_questions: { count: number }[];
};

type QuizWithCourseAndAllCounts = QuizWithCourseAndCounts & {
  quiz_attempts: { count: number }[];
};

type AnswerWithQuestion = Database["public"]["Tables"]["quiz_answers"]["Row"] & {
  question: QuestionRow | null;
};

type AttemptWithStudent = AttemptRow & {
  student: Pick<ProfileRow, "display_name"> | null;
};

// ---------------------------------------------------------------------------
// Local Types (query params, payloads)
// ---------------------------------------------------------------------------

export interface QuizListParams {
  status?: QuizStatus;
  courseId?: string;
  page?: number;
  limit?: number;
}

export interface InstructorQuizParams {
  status?: QuizStatus;
  courseId?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedQuizList {
  data: QuizListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface CreateQuizPayload {
  title: string;
  description?: string;
  courseId: string;
  timeLimitMinutes?: number;
  passingScore?: number;
  allowReattempt?: boolean;
  shuffleQuestions?: boolean;
  showAnswersAfterSubmit?: boolean;
  focusLossWarning?: boolean;
  dueDate?: string;
  questions?: QuestionPayload[];
}

export interface UpdateQuizPayload {
  title?: string;
  description?: string;
  timeLimitMinutes?: number | null;
  passingScore?: number;
  allowReattempt?: boolean;
  shuffleQuestions?: boolean;
  showAnswersAfterSubmit?: boolean;
  focusLossWarning?: boolean;
  dueDate?: string | null;
  questions?: QuestionPayload[];
}

export interface QuestionPayload {
  id?: string;
  type: string;
  questionText: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  correctAnswer?: boolean | string;
  sampleAnswer?: string;
  blanks?: { id: string; answer: string }[];
  explanation?: string | null;
  points?: number;
  order?: number;
}

// ---------------------------------------------------------------------------
// Mapping Utilities (TASK-003)
// ---------------------------------------------------------------------------

/**
 * Convert DB options JSONB to frontend options format.
 * Student view: no correctOptionId
 * Instructor/result view: includes correctOptionId
 */
function mapOptionsFromDB(
  options: { text: string; isCorrect: boolean }[],
  includeAnswer: boolean
): { options: { id: string; text: string }[]; correctOptionId?: string } {
  const mapped = options.map((opt, index) => ({
    id: `opt_${String(index)}`,
    text: opt.text,
  }));

  if (includeAnswer) {
    const correctIndex = options.findIndex((opt) => opt.isCorrect);
    return {
      options: mapped,
      correctOptionId: correctIndex >= 0 ? `opt_${String(correctIndex)}` : undefined,
    };
  }

  return { options: mapped };
}

/**
 * Convert frontend options back to DB JSONB format.
 * Used when creating or updating quiz questions.
 */
function mapOptionsToDB(
  options: { id: string; text: string }[],
  correctOptionId: string
): { text: string; isCorrect: boolean }[] {
  return options.map((opt) => ({
    text: opt.text,
    isCorrect: opt.id === correctOptionId,
  }));
}

/**
 * Map a DB quiz_questions row to the frontend Question discriminated union.
 * Handles each question_type distinctly.
 */
function mapQuestionRow(row: QuestionRow, includeAnswer: boolean): Question {
  const base = {
    id: row.id,
    quizId: row.quiz_id,
    order: row.order_index,
    questionText: row.content,
    points: row.points,
    explanation: row.explanation,
  };

  switch (row.question_type) {
    case "multiple_choice": {
      const dbOptions = row.options as { text: string; isCorrect: boolean }[];
      const { options, correctOptionId } = mapOptionsFromDB(dbOptions, includeAnswer);
      return {
        ...base,
        type: "multiple_choice" as const,
        options,
        correctOptionId: correctOptionId ?? "",
      };
    }
    case "true_false": {
      return {
        ...base,
        type: "true_false" as const,
        correctAnswer: includeAnswer
          ? row.correct_answer?.toLowerCase() === "true"
          : false,
      };
    }
    case "short_answer": {
      return {
        ...base,
        type: "short_answer" as const,
        sampleAnswer: includeAnswer ? (row.correct_answer ?? null) : null,
      };
    }
    case "fill_in_the_blank": {
      let blanks: { id: string; answer: string }[] = [];
      if (includeAnswer && row.correct_answer) {
        try {
          blanks = JSON.parse(row.correct_answer) as { id: string; answer: string }[];
        } catch {
          blanks = [{ id: "blank_0", answer: row.correct_answer }];
        }
      }
      return {
        ...base,
        type: "fill_in_the_blank" as const,
        blanks,
      };
    }
    default: {
      // Fallback for unexpected types
      return {
        ...base,
        type: "short_answer" as const,
        sampleAnswer: null,
      };
    }
  }
}

/**
 * Map a DB quizzes row to the frontend QuizListItem type.
 */
function mapQuizRow(
  row: QuizRow,
  courseName: string,
  questionCount: number,
  attemptCount: number,
  myLastAttemptScore: number | null
): QuizListItem {
  return {
    id: row.id,
    title: row.title,
    courseId: row.course_id,
    courseName,
    status: row.status as QuizStatus,
    questionCount,
    timeLimitMinutes: row.time_limit_minutes,
    passingScore: row.passing_score,
    dueDate: row.due_date,
    attemptCount,
    myLastAttemptScore,
    createdAt: row.created_at,
  };
}

/**
 * Map a DB quizzes row with joined questions to the frontend QuizDetail type.
 */
function mapQuizDetailRow(
  row: QuizRow,
  courseName: string,
  questions: QuestionRow[],
  includeAnswer: boolean
): QuizDetail {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    courseId: row.course_id,
    courseName,
    status: row.status as QuizStatus,
    timeLimitMinutes: row.time_limit_minutes,
    passingScore: row.passing_score,
    allowReattempt: row.allow_reattempt,
    shuffleQuestions: row.shuffle_questions,
    showAnswersAfterSubmit: row.show_answers_after_submit,
    focusLossWarning: row.focus_loss_warning,
    dueDate: row.due_date,
    questions: questions
      .sort((a, b) => a.order_index - b.order_index)
      .map((q) => mapQuestionRow(q, includeAnswer)),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Map a QuestionPayload (frontend input) to the DB insert format for quiz_questions.
 */
function mapQuestionPayloadToDB(
  q: QuestionPayload,
  quizId: string,
  index: number
): Database["public"]["Tables"]["quiz_questions"]["Insert"] {
  let options: unknown = null;
  let correctAnswer: string | null = null;

  switch (q.type) {
    case "multiple_choice": {
      if (q.options && q.correctOptionId) {
        options = mapOptionsToDB(q.options, q.correctOptionId);
      }
      // Store the correctOptionId index-based reference as correct_answer
      if (q.correctOptionId && q.options) {
        const correctIdx = q.options.findIndex(
          (opt) => opt.id === q.correctOptionId
        );
        correctAnswer = correctIdx >= 0 ? `opt_${String(correctIdx)}` : q.correctOptionId;
      }
      break;
    }
    case "true_false": {
      correctAnswer = String(q.correctAnswer ?? "true");
      break;
    }
    case "short_answer": {
      correctAnswer = q.sampleAnswer ?? q.correctAnswer?.toString() ?? null;
      break;
    }
    case "fill_in_the_blank": {
      correctAnswer = q.blanks ? JSON.stringify(q.blanks) : null;
      break;
    }
  }

  return {
    quiz_id: quizId,
    question_type: q.type,
    content: q.questionText,
    options: options as Database["public"]["Tables"]["quiz_questions"]["Insert"]["options"],
    correct_answer: correctAnswer,
    explanation: q.explanation ?? null,
    points: q.points ?? 1,
    order_index: q.order ?? index,
  };
}

// ---------------------------------------------------------------------------
// Query Functions (TASK-004)
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of quizzes for students.
 * Only shows published quizzes with aggregate counts.
 */
export async function getQuizzes(
  params?: QuizListParams,
  client?: SupabaseClient<Database>
): Promise<PaginatedQuizList> {
  const supabase = client ?? createClient();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // Build base query with course join and question count
  let query = supabase
    .from("quizzes")
    .select(
      "*, course:courses!quizzes_course_id_fkey(title), quiz_questions(count)",
      { count: "exact" }
    )
    .eq("status", "published");

  // Apply filters
  if (params?.courseId) {
    query = query.eq("course_id", params.courseId);
  }

  // Apply pagination and ordering
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch quizzes: ${error.message}`);
  }

  // Get current user for attempt counts
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Build quiz list items with per-user aggregates
  const rows = data as unknown as QuizWithCourseAndCounts[];
  const items: QuizListItem[] = await Promise.all(
    rows.map(async (row: QuizWithCourseAndCounts) => {
      const courseName = row.course?.title ?? "Unknown Course";
      const questionCount = row.quiz_questions[0]?.count ?? 0;

      let attemptCount = 0;
      let myLastAttemptScore: number | null = null;

      if (user) {
        // Fetch user-specific attempt data
        const { data: attempts } = await supabase
          .from("quiz_attempts")
          .select("id, score, status")
          .eq("quiz_id", row.id)
          .eq("student_id", user.id)
          .order("created_at", { ascending: false });

        if (attempts) {
          attemptCount = attempts.length;
          // Find latest graded attempt score
          const gradedAttempt = attempts.find(
            (a: { status: string; score: number | null }) =>
              a.status === "graded" || a.status === "submitted"
          );
          myLastAttemptScore = gradedAttempt?.score ?? null;
        }
      }

      return mapQuizRow(
        row,
        courseName,
        questionCount,
        attemptCount,
        myLastAttemptScore
      );
    })
  );

  return {
    data: items,
    total: count ?? 0,
    page,
    limit,
  };
}

/**
 * Fetch a single quiz with its questions.
 * Student view: answers excluded.
 */
export async function getQuiz(
  quizId: string,
  client?: SupabaseClient<Database>
): Promise<QuizDetail> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase
    .from("quizzes")
    .select(
      "*, course:courses!quizzes_course_id_fkey(title), quiz_questions(*)"
    )
    .eq("id", quizId)
    .single();

  if (error) {
    throw new Error(`Failed to fetch quiz: ${error.message}`);
  }

  const courseData = data.course as Pick<CourseRow, "title"> | null;
  const courseName = courseData?.title ?? "Unknown Course";
  const questions = data.quiz_questions as unknown as QuestionRow[];

  // Student view: do not include answers
  return mapQuizDetailRow(data as unknown as QuizRow, courseName, questions, false);
}

/**
 * Fetch a paginated list of quizzes for the instructor (all statuses).
 * Includes submission statistics per quiz.
 */
export async function getInstructorQuizzes(
  params?: InstructorQuizParams,
  client?: SupabaseClient<Database>
): Promise<PaginatedQuizList> {
  const supabase = client ?? createClient();

  const page = params?.page ?? 1;
  const limit = params?.limit ?? 20;
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = supabase
    .from("quizzes")
    .select(
      "*, course:courses!quizzes_course_id_fkey(title), quiz_questions(count), quiz_attempts(count)",
      { count: "exact" }
    );

  // Apply filters
  if (params?.status) {
    query = query.eq("status", params.status);
  }
  if (params?.courseId) {
    query = query.eq("course_id", params.courseId);
  }

  // Order and paginate
  query = query.order("created_at", { ascending: false }).range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch instructor quizzes: ${error.message}`);
  }

  const instructorRows = data as unknown as QuizWithCourseAndAllCounts[];
  const items: QuizListItem[] = instructorRows.map(
    (row: QuizWithCourseAndAllCounts) => {
      const courseName = row.course?.title ?? "Unknown Course";
      const questionCount = row.quiz_questions[0]?.count ?? 0;
      const attemptCount = row.quiz_attempts[0]?.count ?? 0;

      return mapQuizRow(
        row,
        courseName,
        questionCount,
        attemptCount,
        null // Instructor view does not show personal score
      );
    }
  );

  return {
    data: items,
    total: count ?? 0,
    page,
    limit,
  };
}

/**
 * Fetch a quiz result with per-question breakdown.
 * Joins quiz_attempts, quiz_answers, and quiz_questions.
 */
export async function getQuizResult(
  quizId: string,
  attemptId: string,
  client?: SupabaseClient<Database>
): Promise<QuizModuleResult> {
  const supabase = client ?? createClient();

  // Fetch attempt
  const { data: attempt, error: attemptError } = await supabase
    .from("quiz_attempts")
    .select("*")
    .eq("id", attemptId)
    .eq("quiz_id", quizId)
    .single();

  if (attemptError) {
    throw new Error(`Failed to fetch quiz attempt: ${attemptError.message}`);
  }

  // Fetch quiz info
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("title, passing_score, show_answers_after_submit")
    .eq("id", quizId)
    .single();

  if (quizError) {
    throw new Error(`Failed to fetch quiz: ${quizError.message}`);
  }

  // Fetch answers with questions
  const { data: answers, error: answersError } = await supabase
    .from("quiz_answers")
    .select(
      "*, question:quiz_questions!quiz_answers_question_id_fkey(*)"
    )
    .eq("attempt_id", attemptId);

  if (answersError) {
    throw new Error(`Failed to fetch quiz answers: ${answersError.message}`);
  }

  const includeAnswers = quiz.show_answers_after_submit;

  // Fetch all questions for total points calculation
  const { data: allQuestions } = await supabase
    .from("quiz_questions")
    .select("id, points")
    .eq("quiz_id", quizId);

  const maxScore = (allQuestions ?? []).reduce(
    (sum: number, q: { id: string; points: number }) => sum + q.points,
    0
  );

  const answerRows = answers as unknown as AnswerWithQuestion[];
  const questionResults: QuestionResult[] = answerRows.map(
    (ans: AnswerWithQuestion) => {
      const questionData = ans.question;
      const mappedQuestion = questionData
        ? mapQuestionRow(questionData, includeAnswers)
        : null;

      // Build student's draft answer
      const studentAnswer = buildDraftAnswer(
        questionData,
        ans.answer
      );

      return {
        questionId: ans.question_id,
        questionText: questionData?.content ?? "",
        type: (questionData?.question_type ?? "short_answer") as QuestionResult["type"],
        isCorrect: ans.is_correct,
        points: questionData?.points ?? 0,
        earnedPoints: ans.points_earned,
        studentAnswer,
        correctAnswer: includeAnswers && mappedQuestion
          ? getCorrectAnswer(mappedQuestion)
          : null,
        explanation: includeAnswers ? (questionData?.explanation ?? null) : null,
      };
    }
  );

  const score = attempt.score ?? 0;
  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const passed = quiz.passing_score
    ? percentage >= quiz.passing_score
    : null;

  // Calculate time taken
  const startedAt = new Date(attempt.started_at).getTime();
  const submittedAt = attempt.submitted_at
    ? new Date(attempt.submitted_at).getTime()
    : Date.now();
  const timeTaken = Math.floor((submittedAt - startedAt) / 1000);

  return {
    attemptId: attempt.id,
    quizId: attempt.quiz_id,
    quizTitle: quiz.title,
    score,
    maxScore,
    percentage,
    passed,
    timeTaken,
    questionResults,
  };
}

/**
 * Build a DraftAnswer object from DB answer data and question metadata.
 */
function buildDraftAnswer(
  question: QuestionRow | null,
  answer: string | null
): DraftAnswer {
  const questionId = question?.id ?? "";
  const questionType = question?.question_type ?? "short_answer";

  switch (questionType) {
    case "multiple_choice":
      return {
        questionId,
        type: "multiple_choice",
        selectedOptionId: answer ?? null,
      };
    case "true_false":
      return {
        questionId,
        type: "true_false",
        selectedAnswer: answer != null ? answer.toLowerCase() === "true" : null,
      };
    case "short_answer":
      return {
        questionId,
        type: "short_answer",
        text: answer ?? "",
      };
    case "fill_in_the_blank": {
      let filledAnswers: Record<string, string> = {};
      if (answer) {
        try {
          filledAnswers = JSON.parse(answer) as Record<string, string>;
        } catch {
          filledAnswers = { blank_0: answer };
        }
      }
      return {
        questionId,
        type: "fill_in_the_blank",
        filledAnswers,
      };
    }
    default:
      return {
        questionId,
        type: "short_answer",
        text: answer ?? "",
      };
  }
}

/**
 * Extract the correct answer from a mapped Question for result display.
 */
function getCorrectAnswer(question: Question): unknown {
  switch (question.type) {
    case "multiple_choice":
      return question.correctOptionId;
    case "true_false":
      return question.correctAnswer;
    case "short_answer":
      return question.sampleAnswer;
    case "fill_in_the_blank":
      return question.blanks;
    default:
      return null;
  }
}

/**
 * Fetch all student submissions for a quiz (instructor view).
 * Joins quiz_attempts with profiles for student info.
 */
export async function getSubmissions(
  quizId: string,
  client?: SupabaseClient<Database>
): Promise<QuizSubmissionSummary[]> {
  const supabase = client ?? createClient();

  // Fetch quiz passing_score for pass/fail calculation
  const { data: quiz, error: quizError } = await supabase
    .from("quizzes")
    .select("passing_score")
    .eq("id", quizId)
    .single();

  if (quizError) {
    throw new Error(`Failed to fetch quiz: ${quizError.message}`);
  }

  const { data, error } = await supabase
    .from("quiz_attempts")
    .select(
      "*, student:profiles!quiz_attempts_student_id_fkey(display_name)"
    )
    .eq("quiz_id", quizId)
    .in("status", ["submitted", "graded"])
    .order("submitted_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch submissions: ${error.message}`);
  }

  const submissionRows = data as unknown as AttemptWithStudent[];
  return submissionRows.map((row: AttemptWithStudent) => {
    const score = row.score ?? 0;
    const totalPoints = row.total_points || 1; // prevent division by zero
    const percentage = Math.round((score / totalPoints) * 100);

    return {
      userId: row.student_id,
      userName: row.student?.display_name ?? "Unknown Student",
      attemptId: row.id,
      score,
      percentage,
      passed: quiz.passing_score ? percentage >= quiz.passing_score : null,
      submittedAt: row.submitted_at ?? row.created_at,
    };
  });
}

// ---------------------------------------------------------------------------
// Mutation / RPC Functions (TASK-005)
// ---------------------------------------------------------------------------

/**
 * Create a new quiz with questions.
 * Sets created_by from the current auth session.
 */
export async function createQuiz(
  data: CreateQuizPayload,
  client?: SupabaseClient<Database>
): Promise<QuizDetail> {
  const supabase = client ?? createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError ?? !user) {
    throw new Error("Authentication required to create a quiz");
  }

  // Insert quiz record
  const insertData: Database["public"]["Tables"]["quizzes"]["Insert"] = {
    course_id: data.courseId,
    created_by: user.id,
    title: data.title,
    description: data.description ?? null,
    time_limit_minutes: data.timeLimitMinutes ?? null,
    passing_score: data.passingScore ?? 70,
    allow_reattempt: data.allowReattempt ?? true,
    shuffle_questions: data.shuffleQuestions ?? false,
    show_answers_after_submit: data.showAnswersAfterSubmit ?? true,
    focus_loss_warning: data.focusLossWarning ?? false,
    due_date: data.dueDate ?? null,
    status: "draft",
  };

  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .insert(insertData)
    .select("*, course:courses!quizzes_course_id_fkey(title)")
    .single();

  if (quizError) {
    throw new Error(`Failed to create quiz: ${quizError.message}`);
  }

  // Insert questions if provided
  let questionRows: QuestionRow[] = [];
  if (data.questions && data.questions.length > 0) {
    const questionInserts = data.questions.map((q, index) =>
      mapQuestionPayloadToDB(q, quizData.id, index)
    );

    const { data: insertedQuestions, error: qError } = await supabase
      .from("quiz_questions")
      .insert(questionInserts)
      .select("*");

    if (qError) {
      throw new Error(`Failed to create quiz questions: ${qError.message}`);
    }

    questionRows = insertedQuestions as QuestionRow[];
  }

  const courseData = quizData.course as Pick<CourseRow, "title"> | null;
  const courseName = courseData?.title ?? "Unknown Course";

  return mapQuizDetailRow(
    quizData as unknown as QuizRow,
    courseName,
    questionRows,
    true // Instructor creating - include answers
  );
}

/**
 * Update an existing quiz and optionally its questions.
 */
export async function updateQuiz(
  quizId: string,
  data: UpdateQuizPayload,
  client?: SupabaseClient<Database>
): Promise<QuizDetail> {
  const supabase = client ?? createClient();

  // Build update object only for provided fields
  const updateData: Database["public"]["Tables"]["quizzes"]["Update"] = {};
  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.timeLimitMinutes !== undefined)
    updateData.time_limit_minutes = data.timeLimitMinutes;
  if (data.passingScore !== undefined)
    updateData.passing_score = data.passingScore;
  if (data.allowReattempt !== undefined)
    updateData.allow_reattempt = data.allowReattempt;
  if (data.shuffleQuestions !== undefined)
    updateData.shuffle_questions = data.shuffleQuestions;
  if (data.showAnswersAfterSubmit !== undefined)
    updateData.show_answers_after_submit = data.showAnswersAfterSubmit;
  if (data.focusLossWarning !== undefined)
    updateData.focus_loss_warning = data.focusLossWarning;
  if (data.dueDate !== undefined) updateData.due_date = data.dueDate;

  const { data: quizData, error: quizError } = await supabase
    .from("quizzes")
    .update(updateData)
    .eq("id", quizId)
    .select("*, course:courses!quizzes_course_id_fkey(title)")
    .single();

  if (quizError) {
    throw new Error(`Failed to update quiz: ${quizError.message}`);
  }

  // If questions are provided, replace all existing questions
  let questionRows: QuestionRow[] = [];
  if (data.questions !== undefined) {
    // Delete existing questions
    const { error: deleteError } = await supabase
      .from("quiz_questions")
      .delete()
      .eq("quiz_id", quizId);

    if (deleteError) {
      throw new Error(`Failed to delete existing questions: ${deleteError.message}`);
    }

    // Insert new questions
    if (data.questions.length > 0) {
      const questionInserts = data.questions.map((q, index) =>
        mapQuestionPayloadToDB(q, quizId, index)
      );

      const { data: insertedQuestions, error: qError } = await supabase
        .from("quiz_questions")
        .insert(questionInserts)
        .select("*");

      if (qError) {
        throw new Error(`Failed to insert questions: ${qError.message}`);
      }

      questionRows = insertedQuestions as QuestionRow[];
    }
  } else {
    // Fetch existing questions if not replacing
    const { data: existingQuestions } = await supabase
      .from("quiz_questions")
      .select("*")
      .eq("quiz_id", quizId)
      .order("order_index", { ascending: true });

    questionRows = (existingQuestions ?? []) as QuestionRow[];
  }

  const courseData = quizData.course as Pick<CourseRow, "title"> | null;
  const courseName = courseData?.title ?? "Unknown Course";

  return mapQuizDetailRow(
    quizData as unknown as QuizRow,
    courseName,
    questionRows,
    true // Instructor updating - include answers
  );
}

/**
 * Delete a quiz by ID. CASCADE handles related records.
 */
export async function deleteQuiz(
  quizId: string,
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? createClient();

  const { error } = await supabase
    .from("quizzes")
    .delete()
    .eq("id", quizId);

  if (error) {
    throw new Error(`Failed to delete quiz: ${error.message}`);
  }
}

/**
 * Publish a quiz (set status to 'published').
 */
export async function publishQuiz(
  quizId: string,
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ status: "published" as const })
    .eq("id", quizId);

  if (error) {
    throw new Error(`Failed to publish quiz: ${error.message}`);
  }
}

/**
 * Close a quiz (set status to 'closed').
 */
export async function closeQuiz(
  quizId: string,
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? createClient();

  const { error } = await supabase
    .from("quizzes")
    .update({ status: "closed" as const })
    .eq("id", quizId);

  if (error) {
    throw new Error(`Failed to close quiz: ${error.message}`);
  }
}

/**
 * Duplicate a quiz via the duplicate_quiz RPC function.
 * Copies quiz and all its questions.
 */
export async function duplicateQuiz(
  quizId: string,
  client?: SupabaseClient<Database>
): Promise<QuizDetail> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase.rpc("duplicate_quiz", {
    p_quiz_id: quizId,
  });

  if (error) {
    throw new Error(`Failed to duplicate quiz: ${error.message}`);
  }

  const quizRow = data as QuizRow;

  // Fetch full detail of the duplicated quiz
  return getQuiz(quizRow.id, supabase);
}

/**
 * Start a quiz attempt via the start_quiz_attempt RPC function.
 * Returns existing in_progress attempt or creates a new one.
 */
export async function startQuizAttempt(
  quizId: string,
  client?: SupabaseClient<Database>
): Promise<QuizAttempt> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase.rpc("start_quiz_attempt", {
    p_quiz_id: quizId,
  });

  if (error) {
    throw new Error(`Failed to start quiz attempt: ${error.message}`);
  }

  const attemptRow = data as AttemptRow;

  return {
    id: attemptRow.id,
    quizId: attemptRow.quiz_id,
    userId: attemptRow.student_id,
    status: attemptRow.status as AttemptStatus,
    answers: [],
    startedAt: attemptRow.started_at,
    submittedAt: attemptRow.submitted_at,
    score: attemptRow.score,
    passed: null,
  };
}

/**
 * Save draft answers using upsert pattern.
 * Uses ON CONFLICT (attempt_id, question_id) DO UPDATE.
 */
export async function saveDraftAnswers(
  attemptId: string,
  answers: { questionId: string; answer: string }[],
  client?: SupabaseClient<Database>
): Promise<void> {
  const supabase = client ?? createClient();

  const { error } = await supabase.from("quiz_answers").upsert(
    answers.map((a) => ({
      attempt_id: attemptId,
      question_id: a.questionId,
      answer: a.answer,
    })),
    { onConflict: "attempt_id,question_id" }
  );

  if (error) {
    throw new Error(`Failed to save draft answers: ${error.message}`);
  }
}

/**
 * Submit and grade a quiz attempt via the submit_and_grade_quiz RPC function.
 */
export async function submitQuizAttempt(
  attemptId: string,
  client?: SupabaseClient<Database>
): Promise<QuizAttempt> {
  const supabase = client ?? createClient();

  const { data, error } = await supabase.rpc("submit_and_grade_quiz", {
    p_attempt_id: attemptId,
  });

  if (error) {
    throw new Error(`Failed to submit quiz attempt: ${error.message}`);
  }

  const attemptRow = data as AttemptRow;

  // Calculate passed status
  let passed: boolean | null = null;
  if (attemptRow.score != null && attemptRow.total_points > 0) {
    // Fetch passing score from quiz
    const { data: quiz } = await supabase
      .from("quizzes")
      .select("passing_score")
      .eq("id", attemptRow.quiz_id)
      .single();

    if (quiz?.passing_score) {
      const percentage = Math.round(
        (attemptRow.score / attemptRow.total_points) * 100
      );
      passed = percentage >= quiz.passing_score;
    }
  }

  return {
    id: attemptRow.id,
    quizId: attemptRow.quiz_id,
    userId: attemptRow.student_id,
    status: attemptRow.status as AttemptStatus,
    answers: [],
    startedAt: attemptRow.started_at,
    submittedAt: attemptRow.submitted_at,
    score: attemptRow.score,
    passed,
  };
}
