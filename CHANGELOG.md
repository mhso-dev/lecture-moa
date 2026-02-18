# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

---

## [0.1.0] - 2026-02-19

### SPEC-FE-001: Next.js Frontend Foundation

Implements the complete foundation layer for the lecture-moa frontend application.
Commit: `4c5a6d2` | Branch: `feature/SPEC-FE-001`

#### Added

**Monorepo Infrastructure**
- pnpm workspace configuration (`pnpm-workspace.yaml`) defining `apps/*` and `packages/*`
- Turborepo pipeline (`turbo.json`) with build, dev, lint, test, format tasks
- Base TypeScript configuration (`tsconfig.base.json`) with strict mode and `@shared/*` path alias
- Root ESLint flat config (`eslint.config.mjs`) for TypeScript, React, and Next.js rules
- Prettier configuration (`.prettierrc`) with consistent formatting rules
- `.npmrc` with `strict-peer-dependencies=false` and `auto-install-peers=true`

**Next.js Application (`apps/web`)**
- App Router directory structure with `(auth)` and `(dashboard)` route groups
- Root layout (`app/layout.tsx`) with providers, Inter/Pretendard font loading, and metadata
- Landing page entry point (`app/page.tsx`)
- Auth route group layout (`app/(auth)/layout.tsx`) - centered, no sidebar
- Dashboard route group layout (`app/(dashboard)/layout.tsx`) - with sidebar navigation
- Global error boundary (`app/error.tsx`) and root error boundary (`app/global-error.tsx`)
- Global loading state (`app/loading.tsx`) with skeleton components
- 404 not-found page (`app/not-found.tsx`)
- NextAuth API route placeholder (`app/api/auth/[...nextauth]/route.ts`)
- Next.js configuration (`next.config.ts`) with Turborepo and image optimization

**Design Token System**
- Color CSS variables (`styles/tokens/colors.css`) - HSL format, light and dark themes
  - Primary (Slate Blue), Secondary (Indigo/Violet), Accent (Emerald), Semantic, Neutral
- Typography CSS variables (`styles/tokens/typography.css`)
  - Inter (English), Pretendard (Korean), Fira Code/JetBrains Mono (code)
  - Scale: Display 36/48px, H1-H4, Body-L/Body/Body-S, Caption
- Spacing CSS variables (`styles/tokens/spacing.css`)
  - 4px base unit, container 1280px, sidebar widths 256px/64px
- Component CSS variables (`styles/tokens/components.css`)
  - Border radius scale, shadow elevation, per-component token definitions
- Global styles (`styles/globals.css`) with `@theme` directive and Tailwind CSS 4 integration
- Tailwind configuration (`tailwind.config.ts`) extending theme with design token references

**Layout and Navigation System**
- `AppLayout.tsx` - responsive main layout wrapper (sidebar/bottom tab switching)
- `Sidebar.tsx` - desktop/tablet sidebar with collapse state, Lucide icons, active route highlighting
- `BottomTab.tsx` - mobile fixed bottom navigation with 5 primary tabs and badge indicators
- `ContentLayout.tsx` - content area with responsive padding, max-w-7xl, scroll management
- `ThemeToggle.tsx` and `theme-provider.tsx` - light/dark mode toggle
- Navigation Zustand store (`stores/navigation.store.ts`) with localStorage persistence

**shadcn/ui Component Library (18 components)**
- Form components: `button`, `input`, `form`, `label`, `select`, `textarea`, `checkbox`, `radio-group`, `switch`
- Display components: `card`, `badge`, `avatar`, `skeleton`
- Overlay components: `dialog`, `sonner` (toast), `dropdown-menu`, `tooltip`, `sheet`
- `components.json` shadcn/ui configuration
- `lib/utils.ts` with `cn()` (clsx + tailwind-merge)

**Provider Infrastructure**
- `ThemeProvider.tsx` - next-themes wrapper with system preference detection
- `QueryProvider.tsx` - TanStack Query v5 with staleTime, retry, devtools
- `AuthProvider.tsx` - NextAuth SessionProvider skeleton
- `providers/index.tsx` - composed provider tree (Theme > Query > Auth > Toast)
- Zustand stores: `navigation.store.ts`, `auth.store.ts`, `ui.store.ts`
- API client (`lib/api.ts`) with base URL, auth interceptors, typed error handling
- NextAuth config placeholder (`lib/auth.ts`)
- Type-safe env validation (`src/env.ts`) using `@t3-oss/env-nextjs`

**Shared Package (`packages/shared`)**
- Auth types: `User`, `UserRole` (INSTRUCTOR/STUDENT enum), `Session`, `LoginRequest`, `RegisterRequest`
- API types: `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`, `PaginationParams`
- Zod validators: login and register schemas (`validators/auth.schema.ts`)
- Constants: `roles.ts`, `permissions.ts`, `events.ts` (WebSocket event names)
- Utilities: `utils/date.ts` with date formatting functions

**Custom Hooks**
- `useMediaQuery.ts` - responsive breakpoint hook
- `useScrollPosition.ts` - scroll tracking hook

---

[Unreleased]: https://github.com/mhso-dev/lecture-moa/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/mhso-dev/lecture-moa/releases/tag/v0.1.0
