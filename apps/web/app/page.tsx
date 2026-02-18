import Link from "next/link";
import type { Route } from "next";
import { MessageSquare, Brain, Users, Sparkles } from "lucide-react";
import { auth } from "~/lib/auth";
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
    title: "Interactive Q&A",
    description:
      "Ask questions directly on lecture materials and get instant answers from instructors and peers.",
  },
  {
    icon: Brain,
    title: "Smart Quizzes",
    description:
      "AI-generated quizzes that adapt to your learning progress and help reinforce key concepts.",
  },
  {
    icon: Users,
    title: "Team Collaboration",
    description:
      "Study together with team memos, shared notes, and collaborative learning tools.",
  },
  {
    icon: Sparkles,
    title: "AI-Powered Learning",
    description:
      "Leverage AI to summarize materials, generate study guides, and personalize your learning path.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  const isAuthenticated = !!session?.user;

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
          AI-powered learning platform for interactive courses
        </p>

        <div className="mt-8 flex items-center gap-4">
          {isAuthenticated ? (
            <Button asChild size="lg">
              <Link href={"/dashboard" as Route}>Go to Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button asChild size="lg">
                <Link href="/register">Get Started</Link>
              </Button>
              <Button asChild variant="ghost" size="lg">
                <Link href="/login">Sign In</Link>
              </Button>
            </>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="border-t border-border bg-card-background px-4 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-h2 font-semibold text-foreground">
            Everything you need to learn effectively
          </h2>
          <p className="mt-2 text-center text-body text-muted-foreground">
            A comprehensive platform designed for modern education.
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
          &copy; {new Date().getFullYear()} Lecture MoA. All rights reserved.
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
