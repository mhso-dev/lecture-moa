import Link from "next/link";
import type { Route } from "next";
import { MessageSquare, Brain, Users, Sparkles } from "lucide-react";
import { getUser } from "~/lib/auth";
import { Button } from "~/components/ui/button";
import { ThemeToggle } from "~/components/theme-toggle";

/**
 * Landing Page (Server Component)
 *
 * - Hero section with auth-aware CTAs
 * - Feature highlights grid
 * - Footer with copyright
 * - Responsive: stack on mobile, grid on tablet/desktop
 */

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: MessageSquare,
    title: "인터랙티브 Q&A",
    description:
      "강의 자료에서 바로 질문하고 강사와 동료로부터 즉시 답변을 받으세요.",
  },
  {
    icon: Brain,
    title: "스마트 퀴즈",
    description:
      "학습 진도에 맞춰 AI가 생성하는 퀴즈로 핵심 개념을 강화하세요.",
  },
  {
    icon: Users,
    title: "팀 협업",
    description:
      "팀 메모, 공유 노트, 협업 학습 도구로 함께 공부하세요.",
  },
  {
    icon: Sparkles,
    title: "AI 기반 학습",
    description:
      "AI로 자료를 요약하고, 학습 가이드를 생성하고, 맞춤형 학습 경로를 만드세요.",
  },
];

export default async function LandingPage() {
  const user = await getUser();
  const isAuthenticated = !!user;

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      {/* Theme Toggle */}
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <section className="flex flex-1 flex-col items-center justify-center px-4 py-20 text-center">
        <h1 className="text-display font-bold tracking-tight text-foreground">
          Lecture{" "}
          <span className="text-gradient">MoA</span>
        </h1>
        <p className="mt-4 max-w-lg text-body-lg text-muted-foreground">
          인터랙티브 강의를 위한 AI 기반 학습 플랫폼
        </p>

        <div className="mt-8 flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild size="lg">
              <Link href={"/dashboard" as Route}>대시보드로 이동</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/register">시작하기</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/login">로그인</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card-background px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-h2 font-semibold text-foreground">
            효과적인 학습에 필요한 모든 것
          </h2>
          <p className="mt-2 text-center text-body text-muted-foreground">
            현대 교육을 위해 설계된 종합 플랫폼입니다.
          </p>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-6 text-center">
        <p className="text-caption text-muted-foreground">
          &copy; {new Date().getFullYear()} Lecture MoA. All rights reserved. (모든 권리 보유)
        </p>
      </footer>
    </main>
  );
}

function FeatureCard({ icon: Icon, title, description }: Feature) {
  return (
    <div className="flex flex-col items-center rounded-xl p-6 text-center transition-colors hover:bg-muted/50">
      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        <Icon className="h-6 w-6 text-primary" />
      </div>
      <h3 className="mt-4 text-h4 font-medium text-foreground">{title}</h3>
      <p className="mt-2 text-body-sm text-muted-foreground">{description}</p>
    </div>
  );
}
