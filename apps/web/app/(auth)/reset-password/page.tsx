import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "~/components/auth/AuthCard";
import { PasswordResetForm } from "~/components/auth/PasswordResetForm";

export const metadata: Metadata = {
  title: "Reset Password | Lecture Moa",
  description: "Reset your password to regain access to your account",
};

/**
 * Password Reset Page
 * REQ-FE-123: Password reset request
 */
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your email to receive a reset link"
      footer={
        <Link
          href="/login"
          className="text-sm text-[var(--color-muted-foreground)] hover:underline"
        >
          Back to login
        </Link>
      }
    >
      <PasswordResetForm />
    </AuthCard>
  );
}
