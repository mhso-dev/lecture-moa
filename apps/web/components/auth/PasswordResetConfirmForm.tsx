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
      .min(1, "Password is required")
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain at least one uppercase letter, one lowercase letter, and one number"
      ),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
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
            : "An unexpected error occurred. Please try again.";
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
          <h3 className="text-sm font-medium">Password updated</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Your password has been reset successfully. Redirecting to login...
          </p>
        </div>
        <Link
          href="/login"
          className="inline-block text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          Go to login
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
          <h3 className="text-sm font-medium">Link expired</h3>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            This reset link has expired. Please request a new one.
          </p>
        </div>
        <Link
          href="/reset-password"
          className="inline-block text-sm font-medium text-[var(--color-primary-600)] hover:underline"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="Set new password form"
      >
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your new password"
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your new password"
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
          Set new password
        </Button>
      </form>
    </Form>
  );
}
