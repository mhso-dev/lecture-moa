import type { Metadata } from "next";
import Link from "next/link";
import { AuthCard } from "~/components/auth/AuthCard";
import { RegisterForm } from "~/components/auth/RegisterForm";
import { SocialLoginButtons } from "~/components/auth/SocialLoginButtons";

export const metadata: Metadata = {
  title: "회원가입 | Lecture Moa",
  description: "학습 또는 강의를 시작하려면 계정을 만드세요",
};

/**
 * Register Page
 * REQ-FE-119: User registration with role selection
 */
export default function RegisterPage() {
  return (
    <AuthCard
      title="회원가입"
      description="Lecture MoA 시작하기"
      footer={
        <p className="text-sm text-[var(--color-muted-foreground)]">
          이미 계정이 있으신가요?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--color-primary-600)] hover:underline"
          >
            로그인
          </Link>
        </p>
      }
    >
      <RegisterForm />
      <SocialLoginButtons />
    </AuthCard>
  );
}
