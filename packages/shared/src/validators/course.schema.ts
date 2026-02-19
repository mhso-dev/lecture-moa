/**
 * Course Zod Validation Schemas
 * REQ-FE-445: Zod Schema Enrichment
 */

import { z } from 'zod';

/**
 * Course category enum schema
 */
export const CourseCategorySchema = z.enum([
  'programming',
  'design',
  'business',
  'science',
  'language',
  'other',
]);

/**
 * Course visibility enum schema
 */
export const CourseVisibilitySchema = z.enum(['public', 'invite_only']);

/**
 * Course sort option enum schema
 */
export const CourseSortOptionSchema = z.enum([
  'recent',
  'popular',
  'alphabetical',
]);

/**
 * Course creation schema
 */
export const CreateCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000),
  category: CourseCategorySchema,
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  visibility: CourseVisibilitySchema,
});

/**
 * Course update schema (partial)
 */
export const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

/**
 * Enroll with invite code schema
 */
export const EnrollWithCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Invite code must be exactly 6 characters')
    .toUpperCase(),
});

/**
 * Course list params schema
 */
export const CourseListParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  search: z.string().optional(),
  category: CourseCategorySchema.optional(),
  sort: CourseSortOptionSchema.optional(),
});

// Infer types from schemas
export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type EnrollWithCodeInput = z.infer<typeof EnrollWithCodeSchema>;
export type CourseListParamsInput = z.infer<typeof CourseListParamsSchema>;
