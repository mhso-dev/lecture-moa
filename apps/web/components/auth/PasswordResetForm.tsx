"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
    resolver: zodResolver(passwordResetRequestSchema as any),
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
          "If an account exists with this email, you will receive a reset link"
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
          <h3 className="text-sm font-medium">Check your email</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            If an account exists with that email, we sent instructions to reset
            your password.
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          Back to login
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="Password reset request form"
      >
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
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
          Send reset link
        </Button>

        <div className="text-center">
          <Link
            href="/login"
            className="text-sm text-[var(--color-muted-foreground)] hover:underline"
          >
            Back to login
          </Link>
        </div>
      </form>
    </Form>
  );
}
