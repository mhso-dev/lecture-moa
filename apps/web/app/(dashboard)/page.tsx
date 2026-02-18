import { BookOpen, Users, FileText, TrendingUp } from "lucide-react";

/**
 * Dashboard Page
 * Main dashboard with overview cards and statistics
 */
export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-h1 font-semibold text-foreground">Dashboard</h1>
        <p className="mt-2 text-body text-neutral-500">
          Welcome back! Here's your learning overview.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Active Courses"
          value="12"
          icon={BookOpen}
          trend="+2 this month"
        />
        <StatCard
          title="Study Hours"
          value="48"
          icon={TrendingUp}
          trend="+8h this week"
        />
        <StatCard
          title="Memos Created"
          value="156"
          icon={FileText}
          trend="+24 this week"
        />
        <StatCard
          title="Team Members"
          value="8"
          icon={Users}
          trend="2 pending invites"
        />
      </div>

      {/* Recent Activity */}
      <section>
        <h2 className="text-h3 mb-4 font-semibold text-foreground">
          Recent Activity
        </h2>
        <div className="rounded-lg border border-border bg-card-background p-6">
          <p className="text-body text-neutral-500">
            Your recent learning activity will appear here.
          </p>
        </div>
      </section>

      {/* Continue Learning */}
      <section>
        <h2 className="text-h3 mb-4 font-semibold text-foreground">
          Continue Learning
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <CourseCard
            title="Introduction to Machine Learning"
            progress={75}
            lessonsLeft={5}
          />
          <CourseCard
            title="Advanced TypeScript Patterns"
            progress={42}
            lessonsLeft={12}
          />
          <CourseCard
            title="System Design Fundamentals"
            progress={10}
            lessonsLeft={18}
          />
        </div>
      </section>
    </div>
  );
}

/**
 * Stat Card Component
 */
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card-background p-6">
      <div className="flex items-center justify-between">
        <span className="text-body-sm text-neutral-500">{title}</span>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="mt-2">
        <span className="text-display font-semibold text-foreground">
          {value}
        </span>
      </div>
      {trend && (
        <p className="mt-1 text-caption text-neutral-400">{trend}</p>
      )}
    </div>
  );
}

/**
 * Course Card Component
 */
interface CourseCardProps {
  title: string;
  progress: number;
  lessonsLeft: number;
}

function CourseCard({ title, progress, lessonsLeft }: CourseCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card-background p-4 transition-shadow hover:shadow-card">
      <h3 className="font-medium text-foreground line-clamp-2">{title}</h3>
      <div className="mt-3">
        {/* Progress Bar */}
        <div className="h-2 w-full rounded-full bg-neutral-200 dark:bg-neutral-700">
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${String(progress)}%` }}
          />
        </div>
        <p className="mt-2 text-caption text-neutral-500">
          {progress}% complete • {lessonsLeft} lessons left
        </p>
      </div>
    </div>
  );
}
