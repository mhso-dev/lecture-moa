import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthCard } from "~/components/auth/AuthCard";
import { PasswordResetConfirmForm } from "~/components/auth/PasswordResetConfirmForm";

export const metadata: Metadata = {
  title: "새 비밀번호 설정 | Lecture Moa",
  description: "계정의 새 비밀번호를 설정하세요",
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
      title="새 비밀번호 설정"
      description="새 비밀번호를 입력하세요"
    >
      <PasswordResetConfirmForm token={token} />
    </AuthCard>
  );
}
