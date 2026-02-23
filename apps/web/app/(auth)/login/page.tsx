import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthCard } from "~/components/auth/AuthCard";
import { LoginForm } from "~/components/auth/LoginForm";
import { SocialLoginButtons } from "~/components/auth/SocialLoginButtons";

export const metadata: Metadata = {
  title: "로그인 | Lecture Moa",
  description: "계정에 로그인하세요",
};

/**
 * Login Page
 * REQ-FE-115: Email/password login with social login support
 */
export default function LoginPage() {
  return (
    <AuthCard
      title="다시 오신 것을 환영합니다"
      description="계정에 로그인하세요"
      footer={
        <p className="text-sm text-[var(--color-muted-foreground)]">
          계정이 없으신가요?{" "}
          <Link
            href="/register"
            className="font-medium text-[var(--color-primary-600)] hover:underline"
          >
            회원가입
          </Link>
        </p>
      }
    >
      <Suspense>
        <LoginForm />
      </Suspense>
      <SocialLoginButtons />
    </AuthCard>
  );
}
