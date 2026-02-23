"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { z } from "zod";
import { api, ApiClientError } from "~/lib/api";
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

/**
 * Password reset confirm schema (client-side only, token comes from props)
 */
const resetConfirmFormSchema = z
  .object({
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

type ResetConfirmFormValues = z.infer<typeof resetConfirmFormSchema>;

/**
 * PasswordResetConfirmForm - Set a new password using a reset token
 *
 * Features:
 * - New password + confirm password fields
 * - Success state with auto-redirect to /login after 3 seconds
 * - Expired token handling with link to request a new one
 */
interface PasswordResetConfirmFormProps {
  token: string;
}

export function PasswordResetConfirmForm({ token }: PasswordResetConfirmFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<"form" | "success" | "expired">("form");

  const form = useForm<ResetConfirmFormValues>({
    resolver: zodResolver(resetConfirmFormSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  // Auto-redirect to login after success
  useEffect(() => {
    if (status !== "success") return;

    const timer = setTimeout(() => {
      router.push("/login");
    }, 3000);

    return () => {
      clearTimeout(timer);
    };
  }, [status, router]);

  const onSubmit = async (data: ResetConfirmFormValues) => {
    try {
      await api.post("/api/auth/reset-password/confirm", {
        token,
        password: data.password,
      });
      setStatus("success");
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 410) {
        setStatus("expired");
      } else {
        const message =
          error instanceof ApiClientError
            ? error.message
            : "예상치 못한 오류가 발생했습니다. 다시 시도해 주세요.";
        toast.error(message);
      }
    }
  };

  if (status === "success") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-100)] dark:bg-[var(--color-success-500)]/20">
          <CheckCircle2 className="h-6 w-6 text-[var(--color-success-600)]" />
        </div>
        <div>
          <h3 className="text-sm font-medium">비밀번호가 변경되었습니다</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            비밀번호가 성공적으로 재설정되었습니다. 로그인 페이지로 이동합니다...
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          로그인으로 이동
        </Link>
      </div>
    );
  }

  if (status === "expired") {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-warning-100)] dark:bg-[var(--color-warning-500)]/20">
          <AlertTriangle className="h-6 w-6 text-[var(--color-warning-600)]" />
        </div>
        <div>
          <h3 className="text-sm font-medium">링크가 만료되었습니다</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            이 재설정 링크가 만료되었습니다. 새 링크를 요청해 주세요.
          </p>
        </div>
        <Link
          href="/reset-password"
          className="inline-block text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          새 링크 요청하기
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="새 비밀번호 설정 양식"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>새 비밀번호</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="새 비밀번호를 입력하세요"
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>비밀번호 확인</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="새 비밀번호를 다시 입력하세요"
                  autoComplete="new-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          새 비밀번호 설정
        </Button>
      </form>
    </Form>
  );
}
