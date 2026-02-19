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
      label: "Weak",
    },
    medium: {
      width: "w-2/3",
      color: "bg-[var(--color-warning-500)]",
      label: "Medium",
    },
    strong: {
      width: "w-full",
      color: "bg-[var(--color-success-500)]",
      label: "Strong",
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
        Password strength: {current.label}
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
  const { signIn } = useAuth();

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
      await api.post("/api/auth/register", {
        name: data.name,
        email: data.email,
        password: data.password,
        role: data.role,
      });

      // Auto sign-in after successful registration
      const signInResult = await signIn({
        email: data.email,
        password: data.password,
      });

      if (signInResult.success) {
        toast.success("Welcome! Account created successfully.");
        router.push("/dashboard" as Route);
      } else {
        // Registration succeeded but sign-in failed -- redirect to login
        toast.success("Account created! Please sign in.");
        router.push("/login");
      }
    } catch (error) {
      if (error instanceof ApiClientError && error.statusCode === 409) {
        setError("email", {
          message: "An account with this email already exists",
        });
      } else {
        const message =
          error instanceof ApiClientError
            ? error.message
            : "An unexpected error occurred. Please try again.";
        toast.error(message);
      }
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        aria-label="Create account form"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  placeholder="Your name"
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

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Create a password"
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
              <FormLabel>Confirm Password</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Confirm your password"
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
              <FormLabel>I am a...</FormLabel>
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
          Create account
        </Button>
      </form>
    </Form>
  );
}
