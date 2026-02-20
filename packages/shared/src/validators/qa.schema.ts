/**
 * Q&A Zod Validation Schemas
 * REQ-FE-501: Zod schemas for Q&A validation
 */

import { z } from 'zod';

/**
 * Create Question Schema
 * Validates question creation requests
 */
export const CreateQuestionSchema = z.object({
  title: z
    .string()
    .min(10, '제목은 최소 10자 이상이어야 합니다')
    .max(200, '제목은 최대 200자까지 입력 가능합니다'),
  content: z.string().min(20, '내용은 최소 20자 이상이어야 합니다'),
  courseId: z.string().min(1, '강좌를 선택해주세요'),
  materialId: z.string().min(1, '자료를 선택해주세요'),
  context: z.object({
    materialId: z.string(),
    headingId: z.string().nullable(),
    selectedText: z
      .string()
      .min(1, '선택된 텍스트가 필요합니다')
      .max(500, '선택된 텍스트는 최대 500자까지 가능합니다'),
  }),
});

export type CreateQuestionInput = z.infer<typeof CreateQuestionSchema>;

/**
 * Create Answer Schema
 * Validates answer creation requests
 */
export const CreateAnswerSchema = z.object({
  content: z.string().min(10, '답변 내용은 최소 10자 이상이어야 합니다'),
});

export type CreateAnswerInput = z.infer<typeof CreateAnswerSchema>;

/**
 * QA List Filter Schema
 * Validates query parameters for Q&A list
 */
export const QAListFilterSchema = z.object({
  courseId: z.string().optional(),
  materialId: z.string().optional(),
  status: z.enum(['ALL', 'OPEN', 'RESOLVED', 'CLOSED']).optional(),
  q: z.string().optional(),
  sort: z.enum(['newest', 'upvotes', 'answers', 'unanswered']).optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type QAListFilterInput = z.infer<typeof QAListFilterSchema>;
