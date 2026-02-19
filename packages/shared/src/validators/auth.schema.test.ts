import { describe, expect, it } from "vitest";
import {
  changePasswordSchema,
  loginSchema,
  passwordResetRequestSchema,
  passwordResetSchema,
  registerSchema,
  updateProfileSchema,
} from "./auth.schema";

describe("loginSchema", () => {
  it("should validate valid login data", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = loginSchema.safeParse({
      email: "invalid-email",
      password: "Password123",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({
      email: "test@example.com",
      password: "Pass12",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  it("should validate valid registration data", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      name: "Test User",
      role: "student",
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched passwords", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "DifferentPassword",
      name: "Test User",
      role: "student",
    });
    expect(result.success).toBe(false);
  });

  it("should reject password without uppercase, lowercase, and number", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "password",
      confirmPassword: "password",
      name: "Test User",
      role: "student",
    });
    expect(result.success).toBe(false);
  });

  it("should reject invalid role", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "Password123",
      confirmPassword: "Password123",
      name: "Test User",
      role: "admin",
    });
    expect(result.success).toBe(false);
  });
});

describe("passwordResetRequestSchema", () => {
  it("should validate valid email", () => {
    const result = passwordResetRequestSchema.safeParse({
      email: "test@example.com",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid email", () => {
    const result = passwordResetRequestSchema.safeParse({
      email: "invalid-email",
    });
    expect(result.success).toBe(false);
  });
});

describe("passwordResetSchema", () => {
  it("should validate valid reset data", () => {
    const result = passwordResetSchema.safeParse({
      token: "reset-token",
      password: "NewPassword123",
      confirmPassword: "NewPassword123",
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched passwords", () => {
    const result = passwordResetSchema.safeParse({
      token: "reset-token",
      password: "NewPassword123",
      confirmPassword: "DifferentPassword",
    });
    expect(result.success).toBe(false);
  });
});

describe("updateProfileSchema", () => {
  it("should validate valid profile update data", () => {
    const result = updateProfileSchema.safeParse({
      name: "Updated Name",
      image: "https://example.com/avatar.png",
    });
    expect(result.success).toBe(true);
  });

  it("should allow partial updates", () => {
    const result = updateProfileSchema.safeParse({
      name: "Updated Name",
    });
    expect(result.success).toBe(true);
  });

  it("should reject invalid URL", () => {
    const result = updateProfileSchema.safeParse({
      image: "not-a-url",
    });
    expect(result.success).toBe(false);
  });
});

describe("changePasswordSchema", () => {
  it("should validate valid password change data", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "NewPassword456",
      confirmNewPassword: "NewPassword456",
    });
    expect(result.success).toBe(true);
  });

  it("should reject mismatched new passwords", () => {
    const result = changePasswordSchema.safeParse({
      currentPassword: "OldPassword123",
      newPassword: "NewPassword456",
      confirmNewPassword: "DifferentPassword",
    });
    expect(result.success).toBe(false);
  });
});
