/**
 * Authentication Validation Schemas
 * REQ-FE-053: Zod schemas for auth validation
 */

import { z } from "zod";

/**
 * Login validation schema
 */
export const loginSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
  password: z
    .string()
    .min(1, "비밀번호를 입력해주세요")
    .min(8, "비밀번호는 최소 8자 이상이어야 합니다"),
});

export type LoginSchema = z.infer<typeof loginSchema>;

/**
 * Register validation schema
 */
export const registerSchema = z
  .object({
    email: z.string().email("올바른 이메일 주소를 입력해주세요"),
    password: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "비밀번호에 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다"
      ),
    confirmPassword: z.string().min(1, "비밀번호를 다시 입력해주세요"),
    name: z
      .string()
      .min(1, "이름을 입력해주세요")
      .min(2, "이름은 최소 2자 이상이어야 합니다")
      .max(50, "이름은 50자 이하여야 합니다"),
    role: z.enum(["instructor", "student"]),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export type RegisterSchema = z.infer<typeof registerSchema>;

/**
 * Password reset request schema
 */
export const passwordResetRequestSchema = z.object({
  email: z.string().email("올바른 이메일 주소를 입력해주세요"),
});

export type PasswordResetRequestSchema = z.infer<typeof passwordResetRequestSchema>;

/**
 * Password reset schema
 */
export const passwordResetSchema = z
  .object({
    token: z.string().min(1, "재설정 토큰이 필요합니다"),
    password: z
      .string()
      .min(1, "비밀번호를 입력해주세요")
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "비밀번호에 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다"
      ),
    confirmPassword: z.string().min(1, "비밀번호를 다시 입력해주세요"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  });

export type PasswordResetSchema = z.infer<typeof passwordResetSchema>;

/**
 * Update profile validation schema
 */
export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "이름은 최소 2자 이상이어야 합니다")
    .max(50, "이름은 50자 이하여야 합니다")
    .optional(),
  image: z.string().url("올바른 이미지 URL을 입력해주세요").optional(),
});

export type UpdateProfileSchema = z.infer<typeof updateProfileSchema>;

/**
 * Change password validation schema
 */
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
    newPassword: z
      .string()
      .min(1, "새 비밀번호를 입력해주세요")
      .min(8, "비밀번호는 최소 8자 이상이어야 합니다")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "비밀번호에 대문자, 소문자, 숫자를 각각 하나 이상 포함해야 합니다"
      ),
    confirmNewPassword: z
      .string()
      .min(1, "새 비밀번호를 다시 입력해주세요"),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmNewPassword"],
  });

export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;
