/**
 * Material Validation Schemas
 * REQ-FE-345, REQ-FE-361: Zod schemas for material validation
 */

import { z } from "zod";

/**
 * Material status enum schema
 */
export const MaterialStatusSchema = z.enum(["draft", "published"]);

/**
 * Create material validation schema
 * REQ-FE-345: Validates material creation payload
 */
export const CreateMaterialSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(200, "Title must be 200 characters or less"),
  content: z
    .string()
    .min(1, "Content is required")
    .max(1_000_000, "Content exceeds maximum size"),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: MaterialStatusSchema.default("draft"),
  position: z.number().int().min(0).optional(),
});

export type CreateMaterialSchema = z.infer<typeof CreateMaterialSchema>;

/**
 * Update material validation schema
 * REQ-FE-361: All fields optional except id
 */
export const UpdateMaterialSchema = CreateMaterialSchema.partial().extend({
  id: z.string().min(1, "Material ID is required"),
});

export type UpdateMaterialSchema = z.infer<typeof UpdateMaterialSchema>;

/**
 * Material filters validation schema
 * REQ-FE-361: Validates filter parameters
 */
export const MaterialFiltersSchema = z.object({
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: MaterialStatusSchema.optional(),
});

export type MaterialFiltersSchema = z.infer<typeof MaterialFiltersSchema>;

/**
 * Material sort validation schema
 * REQ-FE-361: Validates sort parameters
 */
export const MaterialSortSchema = z.object({
  key: z.enum([
    "position",
    "title",
    "createdAt",
    "updatedAt",
    "readTimeMinutes",
  ]),
  order: z.enum(["asc", "desc"]),
});

export type MaterialSortSchema = z.infer<typeof MaterialSortSchema>;

/**
 * Materials query params validation schema
 * Combines filters, sort, and pagination
 */
export const MaterialsQueryParamsSchema = MaterialFiltersSchema.extend({
  sort: MaterialSortSchema.shape.key.optional(),
  order: MaterialSortSchema.shape.order.optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export type MaterialsQueryParamsSchema = z.infer<
  typeof MaterialsQueryParamsSchema
>;
