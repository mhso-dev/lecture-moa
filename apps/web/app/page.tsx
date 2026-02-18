import { ThemeToggle } from "~/components/theme-toggle";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-container space-y-8 text-center">
        {/* Theme Toggle */}
        <div className="absolute right-4 top-4">
          <ThemeToggle />
        </div>

        {/* Brand */}
        <div className="space-y-4">
          <h1 className="text-display font-bold text-foreground">
            Lecture <span className="text-gradient">MoA</span>
          </h1>
          <p className="text-body-lg text-muted-foreground">
            AI-powered learning platform
          </p>
        </div>

        {/* Color Palette Preview */}
        <div className="grid grid-cols-2 gap-4 rounded-xl bg-card p-6 shadow-card md:grid-cols-4">
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg bg-primary-500" />
            <p className="text-caption font-medium">Primary</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg bg-secondary-500" />
            <p className="text-caption font-medium">Secondary</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg bg-accent-500" />
            <p className="text-caption font-medium">Accent</p>
          </div>
          <div className="space-y-2">
            <div className="h-16 w-full rounded-lg bg-neutral-500" />
            <p className="text-caption font-medium">Neutral</p>
          </div>
        </div>

        {/* Semantic Colors */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <div className="flex items-center gap-2 rounded-lg bg-success-500 px-4 py-2 text-white">
            <span className="font-medium">Success</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-warning-500 px-4 py-2 text-white">
            <span className="font-medium">Warning</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-error-500 px-4 py-2 text-white">
            <span className="font-medium">Error</span>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-info-500 px-4 py-2 text-white">
            <span className="font-medium">Info</span>
          </div>
        </div>

        {/* Typography Scale */}
        <div className="space-y-4 rounded-xl bg-card p-6 text-left shadow-card">
          <p className="text-display font-bold">Display 48px</p>
          <p className="text-h1 font-bold">Heading 1 - 30px</p>
          <p className="text-h2 font-semibold">Heading 2 - 24px</p>
          <p className="text-h3 font-semibold">Heading 3 - 20px</p>
          <p className="text-h4 font-medium">Heading 4 - 18px</p>
          <p className="text-body-lg">Body Large - 18px</p>
          <p className="text-body">Body Regular - 16px</p>
          <p className="text-body-sm text-muted-foreground">Body Small - 14px</p>
          <p className="text-caption text-muted-foreground">Caption - 12px</p>
        </div>

        {/* Korean Typography */}
        <div className="space-y-4 rounded-xl bg-card p-6 text-left shadow-card">
          <p className="text-h1 font-bold">한국어 텍스트 테스트</p>
          <p className="text-kr-body">
            프레텐다드(Pretendard) 폰트는 크로스 플랫폼 환경에서 일관적인
            타이포그래피를 제공합니다.
          </p>
          <p className="text-kr-body-sm text-muted-foreground">
            본문 작은 크기 - 가독성을 위해 적절한 줄높이가 적용됩니다.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-wrap justify-center gap-4">
          <button className="rounded-button bg-primary-600 px-4 py-2 font-medium text-white transition-colors hover:bg-primary-700">
            Primary Button
          </button>
          <button className="rounded-button border border-border bg-card px-4 py-2 font-medium transition-colors hover:bg-muted">
            Secondary Button
          </button>
          <button className="rounded-button px-4 py-2 font-medium text-primary-600 transition-colors hover:bg-primary-50">
            Ghost Button
          </button>
        </div>

        {/* Spacing Preview */}
        <div className="space-y-2">
          <p className="text-caption text-muted-foreground">Spacing Scale (4px base unit)</p>
          <div className="flex items-end gap-2">
            <div className="h-4 w-1 bg-primary-300" title="4px" />
            <div className="h-4 w-2 bg-primary-400" title="8px" />
            <div className="h-4 w-3 bg-primary-500" title="12px" />
            <div className="h-4 w-4 bg-primary-600" title="16px" />
            <div className="h-4 w-5 bg-primary-700" title="20px" />
            <div className="h-4 w-6 bg-primary-800" title="24px" />
            <div className="h-4 w-8 bg-primary-900" title="32px" />
          </div>
        </div>
      </div>
    </main>
  );
}
