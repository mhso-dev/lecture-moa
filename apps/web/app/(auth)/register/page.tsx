import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "~/components/auth/AuthCard";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { SocialLoginButtons } from "~/components/auth/SocialLoginButtons";

export const metadata: Metadata = {
  title: "Create Account | Lecture Moa",
  description: "Create your account to start learning or teaching",
};

/**
 * Register Page
 * REQ-FE-119: User registration with role selection
 */
export default function RegisterPage() {
  return (
    <AuthCard
      title="Create account"
      description="Get started with Lecture MoA"
      footer={
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-primary-600)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <RegisterForm />
      <SocialLoginButtons />
    </AuthCard>
  );
}
