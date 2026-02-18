import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "~/components/auth/AuthCard";
import { PasswordResetConfirmForm } from "~/components/auth/PasswordResetConfirmForm";

export const metadata: Metadata = {
  title: "Set New Password | Lecture Moa",
  description: "Set a new password for your account",
};

/**
 * Password Reset Confirm Page
 * REQ-FE-125: Set new password with reset token
 */
interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ResetPasswordConfirmPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;

  if (!token) {
    redirect("/reset-password");
  }

  return (
    <AuthCard
      title="Set new password"
      description="Enter your new password"
    >
      <PasswordResetConfirmForm token={token} />
    </AuthCard>
  );
}
