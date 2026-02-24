/**
 * Supabase Query Layer for Q&A
 *
 * Provides direct Supabase database access for all Q&A operations.
 * Replaces REST API calls with typed Supabase client queries.
 * Uses browser client for all client-side operations (RLS enforced by Supabase).
 */

import { createClient } from "./client";
import type { Database } from "~/types/supabase";
import type {
  QAListItem,
  QAQuestion,
  QAAnswer,
  QAAuthorInfo,
  QAStatus,
  QAHighlightData,
  QAListFilter,
  QACreateRequest,
  QAAnswerRequest,
  UserRole,
} from "@shared";

type QuestionRow = Database["public"]["Tables"]["questions"]["Row"];
type AnswerRow = Database["public"]["Tables"]["answers"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];

// ---------------------------------------------------------------------------
// Internal Mapping Functions
// ---------------------------------------------------------------------------

/**
 * Map a profiles row to QAAuthorInfo.
 */
function mapProfileToAuthor(profile: ProfileRow): QAAuthorInfo {
  return {
    id: profile.id,
    name: profile.display_name,
    avatarUrl: profile.avatar_url,
    role: profile.role as UserRole,
  };
}

/**
 * Map a question row (with joined relations) to QAListItem.
 *
 * @param row - Raw Supabase row with joined author, course, material data
 */
function mapQuestionRowToListItem(
  row: Record<string, unknown>,
): QAListItem {
  const questionRow = row as QuestionRow & {
    author: ProfileRow | null;
    course: { title: string } | null;
    material: { title: string } | null;
    has_ai_answer?: boolean;
  };

  const author: QAAuthorInfo = questionRow.author
    ? mapProfileToAuthor(questionRow.author)
    : {
        id: questionRow.author_id,
        name: "Unknown",
        avatarUrl: null,
        role: "student" as UserRole,
      };

  return {
    id: questionRow.id,
    courseId: questionRow.course_id,
    courseName: questionRow.course?.title ?? "",
    materialId: questionRow.material_id,
    materialTitle: questionRow.material?.title ?? "",
    author,
    title: questionRow.title,
    context: {
      selectedText: questionRow.selected_text ?? "",
    },
    status: questionRow.status as QAStatus,
    upvoteCount: questionRow.upvote_count,
    answerCount: questionRow.answer_count,
    hasAiSuggestion: Boolean(questionRow.has_ai_answer),
    createdAt: questionRow.created_at,
  };
}

/**
 * Map a question row (with joined relations) to full QAQuestion detail.
 *
 * @param row - Raw Supabase row with joined data
 * @param userQuestionVotes - Set of question IDs the current user has voted on
 */
function mapQuestionRowToDetail(
  row: Record<string, unknown>,
  userQuestionVotes?: Set<string>,
): QAQuestion {
  const questionRow = row as QuestionRow & {
    author: ProfileRow | null;
    course: { title: string } | null;
    material: { title: string } | null;
  };

  const author: QAAuthorInfo = questionRow.author
    ? mapProfileToAuthor(questionRow.author)
    : {
        id: questionRow.author_id,
        name: "Unknown",
        avatarUrl: null,
        role: "student" as UserRole,
      };

  return {
    id: questionRow.id,
    courseId: questionRow.course_id,
    courseName: questionRow.course?.title ?? "",
    materialId: questionRow.material_id,
    materialTitle: questionRow.material?.title ?? "",
    authorId: questionRow.author_id,
    author,
    title: questionRow.title,
    content: questionRow.content,
    context: {
      materialId: questionRow.material_id,
      headingId: questionRow.heading_id,
      selectedText: questionRow.selected_text ?? "",
    },
    status: questionRow.status as QAStatus,
    upvoteCount: questionRow.upvote_count,
    isUpvoted: userQuestionVotes?.has(questionRow.id) ?? false,
    answerCount: questionRow.answer_count,
    aiSuggestion: null, // populated separately from answers
    aiSuggestionPending: false, // client-side state, not from DB
    createdAt: questionRow.created_at,
    updatedAt: questionRow.updated_at,
  };
}

/**
 * Map an answer row (with joined author) to QAAnswer.
 *
 * @param row - Raw Supabase row with joined author data
 * @param userAnswerVotes - Set of answer IDs the current user has voted on
 */
function mapAnswerRow(
  row: Record<string, unknown>,
  userAnswerVotes?: Set<string>,
): QAAnswer {
  const answerRow = row as AnswerRow & {
    author: ProfileRow | null;
  };

  const author: QAAuthorInfo = answerRow.author
    ? mapProfileToAuthor(answerRow.author)
    : {
        id: answerRow.author_id,
        name: "Unknown",
        avatarUrl: null,
        role: "student" as UserRole,
      };

  return {
    id: answerRow.id,
    questionId: answerRow.question_id,
    authorId: answerRow.author_id,
    author,
    content: answerRow.content,
    isAccepted: answerRow.is_accepted,
    isAiGenerated: answerRow.is_ai_generated,
    upvoteCount: answerRow.upvote_count,
    isUpvoted: userAnswerVotes?.has(answerRow.id) ?? false,
    createdAt: answerRow.created_at,
    updatedAt: answerRow.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Question Query Functions
// ---------------------------------------------------------------------------

/**
 * Fetch a paginated list of questions with filters and sorting.
 * Designed for useInfiniteQuery compatibility with offset-based pagination.
 *
 * JOIN: profiles (author), courses (courseName), materials (materialTitle)
 * Batch queries AI-generated answers for hasAiSuggestion field.
 */
export async function getQuestions(
  params: QAListFilter,
): Promise<{ data: QAListItem[]; nextPage: number | null; total: number }> {
  const supabase = createClient();

  const page = params.page;
  const limit = params.limit;
  const from = page * limit;
  const to = from + limit - 1;

  // Build question query with JOINs
  let query = supabase
    .from("questions")
    .select(
      "*, author:profiles!questions_author_id_fkey(*), course:courses!questions_course_id_fkey(title), material:materials!questions_material_id_fkey(title)",
      { count: "exact" },
    );

  // Apply filters
  if (params.courseId) {
    query = query.eq("course_id", params.courseId);
  }
  if (params.materialId) {
    query = query.eq("material_id", params.materialId);
  }
  if (params.status && params.status !== "ALL") {
    query = query.eq("status", params.status);
  }
  if (params.q) {
    query = query.or(
      `title.ilike.%${params.q}%,content.ilike.%${params.q}%`,
    );
  }

  // Apply sorting
  switch (params.sort) {
    case "upvotes":
      query = query.order("upvote_count", { ascending: false });
      break;
    case "answers":
      query = query.order("answer_count", { ascending: false });
      break;
    case "unanswered":
      query = query
        .eq("status", "OPEN")
        .order("answer_count", { ascending: true })
        .order("created_at", { ascending: false });
      break;
    case "newest":
    default:
      query = query.order("created_at", { ascending: false });
  }

  // Apply pagination
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch questions: ${error.message}`);
  }

  // Batch query: check for AI-generated answers for all question IDs
  const questionIds = data.map((row: { id: string }) => row.id);

  let aiAnswerSet = new Set<string>();
  if (questionIds.length > 0) {
    const { data: aiAnswers } = await supabase
      .from("answers")
      .select("question_id")
      .in("question_id", questionIds)
      .eq("is_ai_generated", true);

    if (aiAnswers) {
      aiAnswerSet = new Set(aiAnswers.map((a: { question_id: string }) => a.question_id));
    }
  }

  const total = count ?? 0;
  const items: QAListItem[] = data.map((row: Record<string, unknown> & { id: string }) => {
    const enriched = { ...row, has_ai_answer: aiAnswerSet.has(row.id) };
    return mapQuestionRowToListItem(enriched);
  });

  return {
    data: items,
    nextPage: from + limit < total ? page + 1 : null,
    total,
  };
}

/**
 * Fetch a single question with full detail and all answers.
 * Splits is_ai_generated=true answer into aiSuggestion field.
 */
export async function getQuestionDetail(
  questionId: string,
  userId?: string,
): Promise<QAQuestion & { answers: QAAnswer[] }> {
  const supabase = createClient();

  // Fetch question with JOINs
  const { data: questionData, error: questionError } = await supabase
    .from("questions")
    .select(
      "*, author:profiles!questions_author_id_fkey(*), course:courses!questions_course_id_fkey(title), material:materials!questions_material_id_fkey(title)",
    )
    .eq("id", questionId)
    .single();

  if (questionError) {
    throw new Error(
      `Failed to fetch question detail: ${questionError.message}`,
    );
  }

  // Fetch all answers for this question with author JOINs
  const { data: answersData, error: answersError } = await supabase
    .from("answers")
    .select("*, author:profiles!answers_author_id_fkey(*)")
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  if (answersError) {
    throw new Error(`Failed to fetch answers: ${answersError.message}`);
  }

  // Fetch user votes for the question AND all its answers
  let userQuestionVotes = new Set<string>();
  let userAnswerVotes = new Set<string>();

  if (userId) {
    const answerIds = answersData.map((a: { id: string }) => a.id);

    // Fetch question vote and answer votes in parallel
    const [questionVoteResult, answerVoteResult] = await Promise.all([
      supabase
        .from("votes")
        .select("target_id")
        .eq("user_id", userId)
        .eq("target_type", "question")
        .eq("target_id", questionId),
      answerIds.length > 0
        ? supabase
            .from("votes")
            .select("target_id")
            .eq("user_id", userId)
            .eq("target_type", "answer")
            .in("target_id", answerIds)
        : Promise.resolve({ data: [] as { target_id: string }[] }),
    ]);

    if (questionVoteResult.data) {
      userQuestionVotes = new Set(
        questionVoteResult.data.map((v: { target_id: string }) => v.target_id),
      );
    }
    if (answerVoteResult.data) {
      userAnswerVotes = new Set(
        answerVoteResult.data.map((v: { target_id: string }) => v.target_id),
      );
    }
  }

  // Map question
  const question = mapQuestionRowToDetail(
    questionData,
    userQuestionVotes,
  );

  // Map answers and separate AI suggestion
  const allAnswers: QAAnswer[] = answersData.map((row: Record<string, unknown>) =>
    mapAnswerRow(row, userAnswerVotes),
  );

  const aiSuggestion =
    allAnswers.find((a: QAAnswer) => a.isAiGenerated) ?? null;
  const humanAnswers = allAnswers.filter((a: QAAnswer) => !a.isAiGenerated);

  return {
    ...question,
    aiSuggestion,
    answers: humanAnswers,
  };
}

// ---------------------------------------------------------------------------
// Question Mutation Functions
// ---------------------------------------------------------------------------

/**
 * Create a new question.
 * Maps context.headingId -> heading_id, context.selectedText -> selected_text.
 */
export async function createQuestion(
  payload: QACreateRequest,
  authorId: string,
): Promise<QAQuestion> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("questions")
    .insert({
      course_id: payload.courseId,
      material_id: payload.materialId,
      author_id: authorId,
      title: payload.title,
      content: payload.content,
      heading_id: payload.context.headingId,
      selected_text: payload.context.selectedText,
      status: "OPEN",
    })
    .select(
      "*, author:profiles!questions_author_id_fkey(*), course:courses!questions_course_id_fkey(title), material:materials!questions_material_id_fkey(title)",
    )
    .single();

  if (error) {
    throw new Error(`Failed to create question: ${error.message}`);
  }

  return mapQuestionRowToDetail(data);
}

/**
 * Update a question's title and/or content.
 */
export async function updateQuestion(
  questionId: string,
  payload: { title?: string; content?: string },
): Promise<QAQuestion> {
  const supabase = createClient();

  const updateData: Database["public"]["Tables"]["questions"]["Update"] = {};
  if (payload.title !== undefined) updateData.title = payload.title;
  if (payload.content !== undefined) updateData.content = payload.content;
  updateData.updated_at = new Date().toISOString();

  const { data, error } = await supabase
    .from("questions")
    .update(updateData)
    .eq("id", questionId)
    .select(
      "*, author:profiles!questions_author_id_fkey(*), course:courses!questions_course_id_fkey(title), material:materials!questions_material_id_fkey(title)",
    )
    .single();

  if (error) {
    throw new Error(`Failed to update question: ${error.message}`);
  }

  return mapQuestionRowToDetail(data);
}

/**
 * Change a question's status (OPEN, RESOLVED, CLOSED).
 */
export async function changeQuestionStatus(
  questionId: string,
  status: QAStatus,
): Promise<void> {
  const supabase = createClient();

  const { error } = await supabase
    .from("questions")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", questionId);

  if (error) {
    throw new Error(`Failed to change question status: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Answer Functions
// ---------------------------------------------------------------------------

/**
 * Create an answer for a question.
 */
export async function createAnswer(
  questionId: string,
  payload: QAAnswerRequest,
  authorId: string,
): Promise<QAAnswer> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("answers")
    .insert({
      question_id: questionId,
      author_id: authorId,
      content: payload.content,
      is_accepted: false,
      is_ai_generated: false,
    })
    .select("*, author:profiles!answers_author_id_fkey(*)")
    .single();

  if (error) {
    throw new Error(`Failed to create answer: ${error.message}`);
  }

  return mapAnswerRow(data);
}

/**
 * Accept an answer for a question.
 * Sets all answers for the question to is_accepted=false first,
 * then sets the target answer to is_accepted=true,
 * and updates the question status to RESOLVED.
 */
export async function acceptAnswer(
  questionId: string,
  answerId: string,
): Promise<void> {
  const supabase = createClient();

  // Step 1: Unaccept all answers for this question
  const { error: unacceptError } = await supabase
    .from("answers")
    .update({ is_accepted: false })
    .eq("question_id", questionId);

  if (unacceptError) {
    throw new Error(
      `Failed to unaccept previous answers: ${unacceptError.message}`,
    );
  }

  // Step 2: Accept the target answer
  const { error: acceptError } = await supabase
    .from("answers")
    .update({ is_accepted: true })
    .eq("id", answerId);

  if (acceptError) {
    throw new Error(`Failed to accept answer: ${acceptError.message}`);
  }

  // Step 3: Set question status to RESOLVED
  const { error: statusError } = await supabase
    .from("questions")
    .update({ status: "RESOLVED", updated_at: new Date().toISOString() })
    .eq("id", questionId);

  if (statusError) {
    throw new Error(
      `Failed to update question status: ${statusError.message}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Vote Functions
// ---------------------------------------------------------------------------

/**
 * Toggle a vote on a question.
 * If existing vote: DELETE (cancel). If no vote: INSERT (value=1).
 * Returns current voted state and the new upvote count.
 */
export async function toggleQuestionVote(
  questionId: string,
  userId: string,
): Promise<{ voted: boolean; newCount: number }> {
  const supabase = createClient();

  // Check for existing vote
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", "question")
    .eq("target_id", questionId)
    .maybeSingle();

  if (existingVote) {
    // Vote exists -> cancel (DELETE)
    const { error: deleteError } = await supabase
      .from("votes")
      .delete()
      .eq("id", existingVote.id);

    if (deleteError) {
      throw new Error(`Failed to remove vote: ${deleteError.message}`);
    }

    // Fetch updated count
    const { data: question } = await supabase
      .from("questions")
      .select("upvote_count")
      .eq("id", questionId)
      .single();

    return { voted: false, newCount: question?.upvote_count ?? 0 };
  } else {
    // No vote -> INSERT
    const { error: insertError } = await supabase.from("votes").insert({
      user_id: userId,
      target_type: "question",
      target_id: questionId,
      value: 1,
    });

    if (insertError) {
      throw new Error(`Failed to add vote: ${insertError.message}`);
    }

    // Fetch updated count
    const { data: question } = await supabase
      .from("questions")
      .select("upvote_count")
      .eq("id", questionId)
      .single();

    return { voted: true, newCount: question?.upvote_count ?? 0 };
  }
}

/**
 * Toggle a vote on an answer.
 * Same toggle logic as toggleQuestionVote but with target_type='answer'.
 */
export async function toggleAnswerVote(
  answerId: string,
  userId: string,
): Promise<{ voted: boolean; newCount: number }> {
  const supabase = createClient();

  // Check for existing vote
  const { data: existingVote } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", userId)
    .eq("target_type", "answer")
    .eq("target_id", answerId)
    .maybeSingle();

  if (existingVote) {
    // Vote exists -> cancel (DELETE)
    const { error: deleteError } = await supabase
      .from("votes")
      .delete()
      .eq("id", existingVote.id);

    if (deleteError) {
      throw new Error(`Failed to remove vote: ${deleteError.message}`);
    }

    // Fetch updated count
    const { data: answer } = await supabase
      .from("answers")
      .select("upvote_count")
      .eq("id", answerId)
      .single();

    return { voted: false, newCount: answer?.upvote_count ?? 0 };
  } else {
    // No vote -> INSERT
    const { error: insertError } = await supabase.from("votes").insert({
      user_id: userId,
      target_type: "answer",
      target_id: answerId,
      value: 1,
    });

    if (insertError) {
      throw new Error(`Failed to add vote: ${insertError.message}`);
    }

    // Fetch updated count
    const { data: answer } = await supabase
      .from("answers")
      .select("upvote_count")
      .eq("id", answerId)
      .single();

    return { voted: true, newCount: answer?.upvote_count ?? 0 };
  }
}

// ---------------------------------------------------------------------------
// Highlights
// ---------------------------------------------------------------------------

/**
 * Fetch Q&A highlight data for a specific material.
 * REQ-FE-009: Returns highlight data needed for rendering <mark> elements.
 *
 * Only fetches questions that have non-null selected_text (i.e., text-based questions).
 * Returns minimal data needed for highlight rendering (no full content/answers).
 */
export async function getHighlightsForMaterial(
  materialId: string,
): Promise<QAHighlightData[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("questions")
    .select("id, selected_text, heading_id, status, title")
    .eq("material_id", materialId)
    .not("selected_text", "is", null)
    .neq("selected_text", "")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch highlights: ${error.message}`);
  }

  return data.map(
    (row: {
      id: string;
      selected_text: string | null;
      heading_id: string | null;
      status: string;
      title: string;
    }): QAHighlightData => ({
      id: row.id,
      selectedText: row.selected_text ?? "",
      headingId: row.heading_id,
      status: row.status as QAStatus,
      title: row.title,
    }),
  );
}
