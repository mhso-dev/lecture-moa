"use client";

import { useRouter } from "next/navigation";
import type { Route } from "next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { registerSchema, type RegisterSchema } from "@shared";
import { useAuth } from "~/hooks/useAuth";
import { ApiClientError } from "~/lib/api";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { RoleSelector } from "~/components/auth/RoleSelector";
import { useMemo } from "react";
import { cn } from "~/lib/utils";

/**
 * Password strength level
 */
type PasswordStrength = "weak" | "medium" | "strong";

/**
 * Calculate password strength based on length and character variety
 */
function getPasswordStrength(password: string): PasswordStrength {
  if (!password) return "weak";

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (password.length >= 12 && hasUpper && hasLower && hasNumber && hasSpecial) {
    return "strong";
  }

  if (password.length >= 10 || hasSpecial) {
    return "medium";
  }

  return "weak";
}

/**
 * PasswordStrengthIndicator - Visual bar showing password strength
 */
function PasswordStrengthIndicator({ password }: { password: string }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const config: Record<PasswordStrength, { width: string; color: string; label: string }> = {
    weak: {
      width: "w-1/3",
      color: "bg-[var(--color-error-500)]",
      label: "약함",
    },
    medium: {
      width: "w-2/3",
      color: "bg-[var(--color-warning-500)]",
      label: "보통",
    },
    strong: {
      width: "w-full",
      color: "bg-[var(--color-success-500)]",
      label: "강함",
    },
  };

  const current = config[strength];

  return (
    <div className="mt-2 space-y-1">
      <div className="h-1.5 w-full rounded-full bg-[var(--color-neutral-200)] dark:bg-[var(--color-neutral-700)]">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            current.width,
            current.color
          )}
        />
      </div>
      <p className="text-xs text-[var(--color-muted-foreground)]">
        비밀번호 강도: {current.label}
      </p>
    </div>
  );
}

/**
 * RegisterForm - Client component for user registration
 *
 * Features:
 * - react-hook-form + Zod validation with registerSchema
 * - RoleSelector for instructor/student selection
 * - Password strength indicator
 * - Auto sign-in after successful registration
 * - Handles 409 conflict (email already exists)
 */
export function RegisterForm() {
  const router = useRouter();
  const { signUp } = useAuth();

  const form = useForm<RegisterSchema>({
    // Zod 3.25.x type system changes require assertion for hookform resolvers compatibility
    resolver: zodResolver(registerSchema as unknown as ZodType<RegisterSchema>),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: undefined,
    },
  });

  const {
    handleSubmit,
    watch,
    setError,
    formState: { isSubmitting },
  } = form;

  const passwordValue = watch("password");

  const onSubmit = async (data: RegisterSchema) => {
    try {
      const result = await signUp({
        email: data.email,
        password: data.password,
        name: data.name,
        role: data.role,
      });

      if (result.success) {
        toast.success("환영합니다! 계정이 성공적으로 생성되었습니다.");
        router.push("/dashboard" as Route);
      } else {
        // Check for duplicate email error
        if (result.error?.includes("\uC774\uBBF8 \uB4F1\uB85D\uB41C")) {
          setError("email", {
            message: "이미 등록된 이메일입니다",
          });
        } else {
          toast.error(result.error ?? "예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.");
        }
      }
    } catch (error) {
      const message =
        error instanceof ApiClientError
          ? error.message
          : "예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.";
      toast.error(message);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="회원가입 양식"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이름</FormLabel>
              <FormControl>
                <Input
                  placeholder="이름을 입력하세요"
                  autoComplete="name"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <PasswordStrengthIndicator password={passwordValue} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호 확인</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>역할 선택</FormLabel>
              <FormControl>
                <RoleSelector
                  value={field.value as string}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          계정 만들기
        </Button>
      </form>
    </Form>
  );
}
