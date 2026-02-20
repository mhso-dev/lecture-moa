/**
 * Memo Validation Schemas
 * REQ-FE-703: Zod schemas for memo validation
 */

import { z } from "zod";

/**
 * Memo visibility enum schema
 * REQ-FE-703: String union for memo visibility
 */
export const MemoVisibilitySchema = z.enum(["personal", "team"]);

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid();

/**
 * Create memo validation schema
 * REQ-FE-703: Validates memo creation payload
 */
export const CreateMemoSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  content: z
    .string()
    .min(1, "Content is required"),
  tags: z
    .array(z.string().max(30, "Each tag must be 30 characters or less"))
    .max(10, "Cannot have more than 10 tags")
    .optional(),
  materialId: uuidSchema.optional(),
  anchorId: z.string().optional(),
  teamId: uuidSchema.optional(),
  visibility: MemoVisibilitySchema,
});

export type CreateMemoSchema = z.infer<typeof CreateMemoSchema>;

/**
 * Update memo validation schema
 * REQ-FE-703: All fields optional for partial updates
 */
export const UpdateMemoSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title must be 200 characters or less")
    .optional(),
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .optional(),
  tags: z
    .array(z.string().max(30, "Each tag must be 30 characters or less"))
    .max(10, "Cannot have more than 10 tags")
    .optional(),
  materialId: uuidSchema.optional(),
  anchorId: z.string().optional(),
  teamId: uuidSchema.optional(),
  visibility: MemoVisibilitySchema.optional(),
  isDraft: z.boolean().optional(),
});

export type UpdateMemoSchema = z.infer<typeof UpdateMemoSchema>;
