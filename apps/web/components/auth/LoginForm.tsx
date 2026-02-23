"use client";

import { useRouter, useSearchParams } from "next/navigation";
import type { Route } from "next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { ZodType } from "zod";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { loginSchema, type LoginSchema } from "@shared";
import { useAuth } from "~/hooks/useAuth";
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
 * LoginForm - Client component for email/password login
 *
 * Features:
 * - react-hook-form + Zod validation
 * - Loading state with spinner
 * - Redirects to callbackUrl or /dashboard on success
 * - Toast notification on error
 * - Focus first error field on validation failure
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn } = useAuth();

  const form = useForm<LoginSchema>({
    // Zod 3.25.x type system changes require assertion for hookform resolvers compatibility
    resolver: zodResolver(loginSchema as unknown as ZodType<LoginSchema>),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = form;

  const onSubmit = async (data: LoginSchema) => {
    const result = await signIn(data);

    if (result.success) {
      const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
      router.push(callbackUrl as Route);
    } else {
      toast.error(result.error ?? "이메일 또는 비밀번호가 올바르지 않습니다");
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="로그인 양식"
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <div className="flex items-center justify-between">
                <FormLabel>비밀번호</FormLabel>
                <Link
                  href="/reset-password"
                  className="text-xs text-[var(--color-primary-600)] hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>
              <FormControl>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting}
        >
          {isSubmitting && <Loader2 className="animate-spin" />}
          로그인
        </Button>
      </form>
    </Form>
  );
}
