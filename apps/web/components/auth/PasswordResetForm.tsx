"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { passwordResetRequestSchema, type PasswordResetRequestSchema } from "@shared";
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
 * PasswordResetForm - Request a password reset link
 *
 * Features:
 * - Single email field with Zod validation
 * - Shows success message after submission
 * - Does not reveal whether the account exists (security)
 */
export function PasswordResetForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  const form = useForm<PasswordResetRequestSchema>({
    // Zod 3.25.x type system changes require assertion for hookform resolvers compatibility
    resolver: zodResolver(passwordResetRequestSchema as unknown as ZodType<PasswordResetRequestSchema>),
    defaultValues: {
      email: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: PasswordResetRequestSchema) => {
    try {
      await api.post("/api/auth/reset-password", { email: data.email });
      setIsSubmitted(true);
    } catch (error) {
      // Do not reveal whether an account exists
      if (error instanceof ApiClientError) {
        // Silently succeed for security - the user sees the same message regardless
        setIsSubmitted(true);
      } else {
        toast.error(
          "해당 이메일로 등록된 계정이 있다면 재설정 링크를 보내드립니다"
        );
        setIsSubmitted(true);
      }
    }
  };

  if (isSubmitted) {
    return (
      <div className="space-y-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-success-100)] dark:bg-[var(--color-success-500)]/20">
          <MailCheck className="h-6 w-6 text-[var(--color-success-600)]" />
        </div>
        <div>
          <h3 className="text-sm font-medium">이메일을 확인해 주세요</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            해당 이메일로 등록된 계정이 있다면 비밀번호 재설정 안내를
            보내드렸습니다.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          로그인으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="비밀번호 재설정 요청 양식"
      >
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

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          재설정 링크 보내기
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-[var(--color-muted-foreground)] hover:underline"
          >
            로그인으로 돌아가기
          </Link>
        </div>
      </form>
    </Form>
  );
}
