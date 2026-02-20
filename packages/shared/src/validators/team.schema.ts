/**
 * Team Validation Schemas
 * REQ-FE-702: Zod schemas for team validation
 */

import { z } from "zod";

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid();

/**
 * Create team validation schema
 * REQ-FE-702: Validates team creation payload
 */
export const CreateTeamSchema = z.object({
  name: z
    .string()
    .min(2, "Team name must be at least 2 characters")
    .max(50, "Team name must be 50 characters or less"),
  description: z
    .string()
    .max(500, "Description must be 500 characters or less")
    .optional(),
  maxMembers: z
    .number()
    .int("Max members must be an integer")
    .min(2, "Team must have at least 2 members")
    .max(100, "Team cannot have more than 100 members")
    .default(10),
  courseIds: z.array(uuidSchema).optional(),
});

export type CreateTeamSchema = z.infer<typeof CreateTeamSchema>;

/**
 * Update team validation schema
 * REQ-FE-702: All fields optional for partial updates
 */
export const UpdateTeamSchema = CreateTeamSchema.partial();

export type UpdateTeamSchema = z.infer<typeof UpdateTeamSchema>;
