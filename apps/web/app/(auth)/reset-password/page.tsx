import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "~/components/auth/AuthCard";
import { PasswordResetForm } from "~/components/auth/PasswordResetForm";

export const metadata: Metadata = {
  title: "비밀번호 재설정 | Lecture Moa",
  description: "계정에 다시 접근하려면 비밀번호를 재설정하세요",
};

/**
 * Password Reset Page
 * REQ-FE-123: Password reset request
 */
export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="비밀번호 재설정"
      description="재설정 링크를 받으려면 이메일을 입력하세요"
      footer={
        <Link
          href="/login"
          className="text-sm text-[var(--color-muted-foreground)] hover:underline"
        >
          로그인으로 돌아가기
        </Link>
      }
    >
      <PasswordResetForm />
    </AuthCard>
  );
}
