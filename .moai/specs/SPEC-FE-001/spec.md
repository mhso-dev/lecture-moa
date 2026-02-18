---
id: SPEC-FE-001
title: "Next.js Frontend Foundation"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: critical
tags: [frontend, nextjs, design-tokens, layout, shadcn-ui, providers, monorepo, foundation]
related_specs: [SPEC-UI-001]
---

# SPEC-FE-001: Next.js Frontend Foundation

## 1. Environment

### 1.1 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 20.x LTS |
| Package Manager | pnpm | 9.x |
| Build System | Turborepo | latest |
| Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| CSS Framework | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (Radix UI) | latest |
| State Management | Zustand | latest |
| Data Fetching | TanStack Query | v5 |
| Form Handling | React Hook Form + Zod | latest |
| Authentication | next-auth (Auth.js) | v5 |
| Dark Mode | next-themes | latest |
| Icons | Lucide React | latest |
| Linting | ESLint + Prettier | latest |
| Testing | Vitest | latest |

### 1.2 Monorepo Structure

```
lecture-moa/
  apps/
    web/              # Next.js 15 frontend (this SPEC)
    api/              # Fastify backend (future SPEC)
    ai/               # Python FastAPI AI service (future SPEC)
  packages/
    shared/           # Shared types, constants, validators (this SPEC)
  turbo.json
  pnpm-workspace.yaml
  package.json
  tsconfig.base.json
  .env.example
```

### 1.3 Design Constraints

- **Responsive Breakpoints**: Mobile 375px, Tablet 768px, Desktop 1280px+
- **Grid System**: 4-column (Mobile), 8-column (Tablet), 12-column (Desktop)
- **Max Content Width**: 1280px (max-w-7xl)
- **Sidebar Width**: 256px (expanded), 64px (collapsed)
- **Design Tokens**: HSL-based CSS Variables for Light/Dark mode
- **Accessibility**: WCAG 2.1 AA compliance
- **Dark Mode**: Light-first design with Dark variant token support

### 1.4 Parent SPEC Reference

This SPEC implements the design system and layout patterns defined in SPEC-UI-001. All design tokens, color palettes, typography scales, spacing values, component tokens, and navigation patterns are sourced from the .pen design files created under SPEC-UI-001.

---

## 2. Assumptions

### 2.1 Project State

- The monorepo does not yet contain any `apps/web/` or `packages/shared/` source code
- SPEC-UI-001 is complete with all 44 .pen design files (5 design system + 3 navigation + 36 screens)
- pnpm 9.x is available in the development environment
- Node.js 20.x LTS is the target runtime

### 2.2 Design Assumptions

- shadcn/ui base theme is extended with lecture-moa design tokens (not replaced)
- CSS Variables use HSL format for runtime theme switching (light/dark)
- Tailwind CSS 4 `@theme` directive is used for design token integration
- Inter (English) + Pretendard (Korean) are the primary font families
- Fira Code or JetBrains Mono is used for code blocks
- Lucide React is the exclusive icon library (no custom icons)

### 2.3 Technical Assumptions

- Next.js App Router with Server Components as the default rendering model
- Route groups `(auth)` and `(dashboard)` organize authentication and dashboard pages
- TanStack Query manages server state; Zustand manages client UI state
- The API client (`lib/api.ts`) targets the Fastify backend at a configurable base URL
- Environment variables are validated at build time using `@t3-oss/env-nextjs`
- next-auth v5 handles authentication on the Next.js side

### 2.4 Scope Assumptions

- This SPEC covers ONLY the foundation layer (scaffolding, tokens, layout, core components, providers, shared package)
- Individual screen/page implementations are separate SPECs (FE-002 through FE-008)
- Backend API integration is out of scope
- Authentication flow implementation is out of scope (FE-002)
- Markdown rendering engine is out of scope (FE-004)
- WebSocket client implementation is out of scope

---

## 3. Requirements

### 3.1 Project Setup & Configuration (REQ-FE-001 through REQ-FE-005)

#### REQ-FE-001: pnpm Workspace Configuration

The system shall provide a pnpm workspace configuration that defines `apps/*` and `packages/*` as workspace packages.

- `pnpm-workspace.yaml` at repository root
- Root `package.json` with workspace scripts (`dev`, `build`, `lint`, `test`, `format`)
- `.npmrc` with `strict-peer-dependencies=false` and `auto-install-peers=true`

#### REQ-FE-002: Turborepo Configuration

The system shall provide a Turborepo configuration that defines task pipelines for `build`, `dev`, `lint`, `test`, and `format` with appropriate dependency ordering and caching.

- `turbo.json` at repository root
- `build` task depends on `^build` (topological)
- `dev` task runs as persistent (no caching)
- `lint` and `test` tasks are cacheable
- Output directories configured for `.next/` and `dist/`

#### REQ-FE-003: TypeScript Base Configuration

The system shall provide a base TypeScript configuration at the repository root that enforces strict mode and is extended by all workspace packages.

- `tsconfig.base.json` with `strict: true`, `noUncheckedIndexedAccess: true`, `forceConsistentCasingInFileNames: true`
- Path aliases: `@shared/*` maps to `packages/shared/src/*`
- Each workspace package extends `tsconfig.base.json`

#### REQ-FE-004: ESLint & Prettier Configuration

The system shall provide shared ESLint and Prettier configurations at the repository root.

- ESLint flat config with TypeScript, React, and Next.js rules
- Prettier config with consistent formatting (singleQuote, trailingComma, semi)
- `.eslintignore` and `.prettierignore` for build artifacts and node_modules

#### REQ-FE-005: Environment Variable Setup

The system shall provide environment variable templates and type-safe validation.

- `.env.example` with all required variables documented
- `apps/web/src/env.ts` using `@t3-oss/env-nextjs` with Zod schemas
- Variables: `NEXT_PUBLIC_API_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL`

---

### 3.2 Next.js App Scaffolding (REQ-FE-006 through REQ-FE-009)

#### REQ-FE-006: App Router Structure

The system shall scaffold the Next.js application with App Router directory structure including route groups.

- `apps/web/app/layout.tsx` as root layout with providers, fonts, and metadata
- `apps/web/app/page.tsx` as landing page entry point
- `apps/web/app/(auth)/layout.tsx` for authentication page layout
- `apps/web/app/(dashboard)/layout.tsx` for dashboard layout with sidebar navigation
- `apps/web/app/not-found.tsx` for global 404 handling
- `apps/web/next.config.ts` with Turborepo and image optimization settings

#### REQ-FE-007: Global Error Boundaries

**When** an unhandled error occurs in a route segment, **then** the system shall display a user-friendly error page with retry and navigation options.

- `apps/web/app/error.tsx` for global error boundary
- `apps/web/app/global-error.tsx` for root layout error boundary
- Error UI consistent with SPEC-UI-001 error page designs (SCR-COMMON-001, SCR-COMMON-002)

#### REQ-FE-008: Loading States

The system shall provide loading UI components for route transitions.

- `apps/web/app/loading.tsx` for global loading state
- Skeleton components consistent with SPEC-UI-001 loading state designs (SCR-COMMON-005)

#### REQ-FE-009: Next.js Package Configuration

The system shall provide proper Next.js package configuration with all required dependencies.

- `apps/web/package.json` with all frontend dependencies
- `apps/web/tsconfig.json` extending base config with Next.js-specific settings
- `apps/web/next.config.ts` with transpilePackages for shared package

---

### 3.3 Design Token Implementation (REQ-FE-010 through REQ-FE-015)

#### REQ-FE-010: CSS Variable Color Tokens

The system shall implement color design tokens as CSS custom properties in HSL format, supporting both light and dark themes.

- `apps/web/styles/tokens/colors.css` defining all color variables
- Light theme on `:root` selector
- Dark theme on `.dark` selector
- Color token values sourced from SPEC-UI-001 REQ-UI-001 (colors.pen):
  - Primary: Blue (Slate Blue family)
  - Secondary: Indigo/Violet
  - Accent: Emerald (CTA)
  - Semantic: Green/Amber/Red/Blue
  - Neutral: Slate 50-950

#### REQ-FE-011: CSS Variable Typography Tokens

The system shall implement typography design tokens as CSS custom properties.

- `apps/web/styles/tokens/typography.css` defining font families, sizes, weights, and line heights
- Font families: Inter (English), Pretendard (Korean), Fira Code / JetBrains Mono (code)
- Scale from SPEC-UI-001 REQ-UI-002:
  - Display: 36px/48px
  - H1: 30px, H2: 24px, H3: 20px, H4: 18px
  - Body-L: 18px, Body: 16px, Body-S: 14px
  - Caption: 12px

#### REQ-FE-012: CSS Variable Spacing Tokens

The system shall implement spacing design tokens as CSS custom properties.

- `apps/web/styles/tokens/spacing.css` defining spacing scale and layout tokens
- 4px unit base (matching Tailwind defaults)
- Container max-width: 1280px
- Sidebar widths: 256px (expanded), 64px (collapsed)
- Grid column definitions per breakpoint (4/8/12)

#### REQ-FE-013: CSS Variable Component Tokens

The system shall implement component-level design tokens as CSS custom properties.

- `apps/web/styles/tokens/components.css` defining border-radius, shadow, and component-specific tokens
- Border radius: sm(6px), md(8px), lg(12px), xl(16px), full
- Shadow: sm, md, lg, xl (elevation scale)
- Button, Input, Card, Dialog, Badge, Avatar, Toast token definitions from SPEC-UI-001 REQ-UI-004

#### REQ-FE-014: Tailwind CSS 4 Theme Integration

The system shall integrate design tokens with Tailwind CSS 4 using the `@theme` directive and configuration extension.

- `apps/web/styles/globals.css` with `@theme` block referencing CSS variables
- `apps/web/tailwind.config.ts` extending theme with design token references
- Custom color utilities mapping to CSS variables
- Custom font utilities for Inter, Pretendard, and code fonts
- Custom shadow and radius utilities

#### REQ-FE-015: Global Styles and Font Loading

The system shall provide global styles with CSS reset, font loading, and base element styling.

- `apps/web/styles/globals.css` with CSS reset and base styles
- Font loading via `next/font/google` for Inter and `next/font/local` for Pretendard
- Base body styles (background, text color, font family)
- Smooth scroll behavior
- Custom scrollbar styling (optional)
- CSS imports for all token files

---

### 3.4 Layout & Navigation System (REQ-FE-020 through REQ-FE-025)

#### REQ-FE-020: AppLayout Component

The system shall provide a responsive application layout component that adapts navigation based on viewport width.

- `apps/web/components/layout/AppLayout.tsx` as the main layout wrapper
- Renders desktop sidebar for viewports >= 1280px
- Renders collapsible sidebar for viewports >= 768px and < 1280px
- Renders bottom tab navigation for viewports < 768px
- Manages sidebar collapse state via Zustand store

#### REQ-FE-021: Desktop Sidebar Navigation

**While** the viewport width is >= 1280px, the system shall display a fixed sidebar navigation with 256px expanded width and 64px collapsed width.

- `apps/web/components/layout/Sidebar.tsx`
- Navigation items: Dashboard, Courses, Materials, Q&A, Quizzes, Teams, Memos
- User avatar and profile section at bottom
- Collapse/expand toggle button
- Active route highlighting
- Lucide React icons for each navigation item
- Consistent with SPEC-UI-001 desktop-sidebar.pen design

#### REQ-FE-022: Mobile Bottom Tab Navigation

**While** the viewport width is < 768px, the system shall display a fixed bottom tab navigation with 5 primary tabs.

- `apps/web/components/layout/BottomTab.tsx`
- 5 tabs: Dashboard, Courses, Q&A, Quizzes, More (hamburger menu)
- Active tab indicator
- Badge indicators for notifications
- Consistent with SPEC-UI-001 mobile-bottom-tab.pen design

#### REQ-FE-023: Tablet Collapsible Sidebar

**While** the viewport width is >= 768px and < 1280px, the system shall display a collapsible sidebar that defaults to collapsed (64px) state.

- Reuses `Sidebar.tsx` component with collapsed default state
- Overlay mode when expanded on tablet
- Touch gesture support for open/close (optional)
- Consistent with SPEC-UI-001 tablet-sidebar.pen design

#### REQ-FE-024: ContentLayout Component

The system shall provide a content area layout component that adjusts width based on sidebar state.

- `apps/web/components/layout/ContentLayout.tsx`
- Responsive padding based on breakpoint
- Max content width enforcement (max-w-7xl)
- Scroll area management
- Header slot for page-specific top bar content

#### REQ-FE-025: Navigation State Management

The system shall manage navigation state (sidebar collapse, active route, mobile menu) via a Zustand store.

- `apps/web/stores/navigation.store.ts`
- State: `isSidebarCollapsed`, `isMobileMenuOpen`, `activeRoute`
- Actions: `toggleSidebar`, `setSidebarCollapsed`, `toggleMobileMenu`, `setActiveRoute`
- Persistence of sidebar preference via localStorage

---

### 3.5 shadcn/ui Component Library (REQ-FE-030 through REQ-FE-035)

#### REQ-FE-030: shadcn/ui Installation and Configuration

The system shall install and configure shadcn/ui with the project's design tokens.

- `components.json` configuration file with path aliases and style settings
- shadcn/ui CLI configured for `apps/web/components/ui/` output directory
- Theme customization using design token CSS variables
- Tailwind CSS integration with shadcn/ui convention

#### REQ-FE-031: Core Button Component

The system shall provide a Button component with 5 variants matching SPEC-UI-001 design tokens.

- Variants: Primary (default), Secondary, Ghost, Destructive, Outline
- Sizes: sm, md (default), lg, icon
- States: default, hover, active, disabled, loading
- `apps/web/components/ui/button.tsx` customized with design tokens

#### REQ-FE-032: Core Form Components

The system shall provide form input components with 4 states matching SPEC-UI-001 design tokens.

- Input component: Default, Error, Disabled, Focused states
- Label component with required indicator
- Form component with React Hook Form integration
- Select, Textarea, Checkbox, RadioGroup, Switch components
- All components in `apps/web/components/ui/`

#### REQ-FE-033: Core Display Components

The system shall provide display components matching SPEC-UI-001 component tokens.

- Card: with CardHeader, CardContent, CardFooter, CardTitle, CardDescription
- Badge: info, success, warning, error, and role variants (instructor, student)
- Avatar: sizes xs, sm, md, lg, xl
- Skeleton: for loading state placeholders
- All components in `apps/web/components/ui/`

#### REQ-FE-034: Core Overlay Components

The system shall provide overlay components matching SPEC-UI-001 component tokens.

- Dialog/Modal: overlay, content, animation tokens
- Toast: success, error, warning, info variants via Sonner or shadcn toast
- DropdownMenu: for context menus and action menus
- Tooltip: for supplementary information
- Sheet: for mobile slide-over panels
- All components in `apps/web/components/ui/`

#### REQ-FE-035: Theme Customization Layer

The system shall provide a theme customization layer that bridges shadcn/ui with the design token system.

- `apps/web/lib/utils.ts` with `cn()` utility (clsx + tailwind-merge)
- CSS variable overrides in globals.css matching shadcn/ui naming convention
- Custom variants added to relevant components (e.g., Badge role variants)
- Dark mode compatibility verified for all components

---

### 3.6 Provider Infrastructure (REQ-FE-040 through REQ-FE-045)

#### REQ-FE-040: ThemeProvider Setup

The system shall provide a ThemeProvider wrapping the application for light/dark mode switching.

- `apps/web/providers/ThemeProvider.tsx` using `next-themes`
- System preference detection
- Theme toggle component: `apps/web/components/layout/ThemeToggle.tsx`
- Theme persistence via localStorage
- `attribute="class"` strategy for Tailwind dark mode

#### REQ-FE-041: QueryClientProvider Setup

The system shall provide a TanStack Query provider with configured defaults.

- `apps/web/providers/QueryProvider.tsx`
- QueryClient with defaults: `staleTime: 5 * 60 * 1000`, `retry: 1`, `refetchOnWindowFocus: false`
- React Query Devtools (development only)
- Error boundary integration

#### REQ-FE-042: Zustand Store Skeleton

The system shall provide Zustand store files with initial structure for client state management.

- `apps/web/stores/navigation.store.ts` (sidebar, active route)
- `apps/web/stores/auth.store.ts` (user session, role)
- `apps/web/stores/ui.store.ts` (global UI state: modals, toasts, loading)
- All stores use TypeScript interfaces for state and actions
- devtools middleware enabled in development

#### REQ-FE-043: API Client Configuration

The system shall provide a configured API client for backend communication.

- `apps/web/lib/api.ts` with base URL from environment variables
- Request/response interceptors for authentication headers
- Error handling with typed error responses
- Request timeout configuration
- Content-Type defaults (JSON)

#### REQ-FE-044: Root Provider Composition

The system shall compose all providers in the root layout with proper nesting order.

- `apps/web/providers/index.tsx` composing all providers
- Nesting order (outermost to innermost): ThemeProvider, QueryProvider, AuthProvider (skeleton), ToastProvider
- Server/client boundary correctly managed (providers as client components)

#### REQ-FE-045: Authentication Provider Skeleton

The system shall provide a skeleton authentication provider for future implementation.

- `apps/web/providers/AuthProvider.tsx` skeleton using next-auth SessionProvider
- `apps/web/lib/auth.ts` with next-auth configuration placeholder
- `apps/web/app/api/auth/[...nextauth]/route.ts` API route placeholder
- Type definitions for session, user, and role in shared package

---

### 3.7 Shared Package (REQ-FE-050 through REQ-FE-055)

#### REQ-FE-050: Shared Package Structure

The system shall provide a shared package at `packages/shared/` with TypeScript types, Zod schemas, and constants.

- `packages/shared/package.json` with proper exports configuration
- `packages/shared/tsconfig.json` extending base config
- `packages/shared/src/index.ts` barrel export

#### REQ-FE-051: Auth Type Definitions

The system shall provide shared authentication type definitions.

- `packages/shared/src/types/auth.types.ts`
- Types: `User`, `UserRole` (enum: INSTRUCTOR, STUDENT), `Session`, `LoginRequest`, `RegisterRequest`, `AuthResponse`
- Role-based permission type mappings

#### REQ-FE-052: API Type Definitions

The system shall provide shared API request/response type definitions.

- `packages/shared/src/types/api.types.ts`
- Types: `ApiResponse<T>`, `ApiError`, `PaginatedResponse<T>`, `PaginationParams`
- HTTP method type utilities

#### REQ-FE-053: Zod Validation Schema Skeletons

The system shall provide Zod validation schema skeletons for shared validation.

- `packages/shared/src/validators/auth.schema.ts` with login and register schemas
- `packages/shared/src/validators/course.schema.ts` skeleton
- `packages/shared/src/validators/quiz.schema.ts` skeleton

#### REQ-FE-054: Shared Constants

The system shall provide shared constants for roles, permissions, and event names.

- `packages/shared/src/constants/roles.ts` with role definitions
- `packages/shared/src/constants/permissions.ts` with permission mappings per role
- `packages/shared/src/constants/events.ts` with WebSocket event name constants

#### REQ-FE-055: Shared Utility Functions

The system shall provide shared utility functions used across frontend and backend.

- `packages/shared/src/utils/date.ts` with date formatting utilities
- `packages/shared/src/utils/markdown.ts` skeleton for markdown utility types

---

### 3.8 Unwanted Behavior Requirements

#### REQ-FE-N01: No Arbitrary Style Values

The system shall not use arbitrary CSS values (magic numbers) outside the defined design token system.

#### REQ-FE-N02: No Client-Only Data Fetching in Server Components

The system shall not perform client-side-only data fetching in components that could be Server Components.

#### REQ-FE-N03: No Untyped API Responses

The system shall not accept untyped responses from the API client; all responses must match shared type definitions.

#### REQ-FE-N04: No Layout Breakage

The system shall not produce layout overflow or content clipping in the 375px to 1920px viewport range.

---

## 4. Specifications

### 4.1 File Structure (apps/web/)

```
apps/web/
  app/
    layout.tsx                     # Root layout (providers, fonts, metadata)
    page.tsx                       # Landing page entry
    loading.tsx                    # Global loading state
    error.tsx                      # Global error boundary
    global-error.tsx               # Root error boundary
    not-found.tsx                  # 404 page
    (auth)/
      layout.tsx                   # Auth layout (centered, no sidebar)
    (dashboard)/
      layout.tsx                   # Dashboard layout (with sidebar)
    api/
      auth/
        [...nextauth]/
          route.ts                 # NextAuth API route
  components/
    layout/
      AppLayout.tsx                # Main responsive layout
      Sidebar.tsx                  # Desktop/Tablet sidebar
      BottomTab.tsx                # Mobile bottom navigation
      ContentLayout.tsx            # Main content area
      ThemeToggle.tsx              # Light/Dark toggle
    ui/                            # shadcn/ui components
      button.tsx
      input.tsx
      card.tsx
      dialog.tsx
      badge.tsx
      avatar.tsx
      skeleton.tsx
      toast.tsx (or sonner.tsx)
      dropdown-menu.tsx
      tooltip.tsx
      sheet.tsx
      label.tsx
      select.tsx
      textarea.tsx
      checkbox.tsx
      radio-group.tsx
      switch.tsx
      form.tsx
  hooks/
    useMediaQuery.ts               # Responsive breakpoint hook
    useScrollPosition.ts           # Scroll tracking hook
  lib/
    api.ts                         # API client configuration
    auth.ts                        # NextAuth configuration
    utils.ts                       # cn() and general utilities
  providers/
    index.tsx                      # Provider composition
    ThemeProvider.tsx               # next-themes wrapper
    QueryProvider.tsx               # TanStack Query provider
    AuthProvider.tsx                # NextAuth SessionProvider
  stores/
    navigation.store.ts            # Sidebar, route state
    auth.store.ts                  # Auth session state
    ui.store.ts                    # Global UI state
  styles/
    globals.css                    # Global styles, @theme, token imports
    tokens/
      colors.css                   # Color CSS variables
      typography.css               # Typography CSS variables
      spacing.css                  # Spacing CSS variables
      components.css               # Component CSS variables
  next.config.ts
  tailwind.config.ts
  tsconfig.json
  components.json                  # shadcn/ui config
  package.json
```

### 4.2 File Structure (packages/shared/)

```
packages/shared/
  src/
    index.ts                       # Barrel export
    types/
      auth.types.ts                # Auth types
      api.types.ts                 # API response types
      course.types.ts              # Course types (skeleton)
      material.types.ts            # Material types (skeleton)
      qa.types.ts                  # Q&A types (skeleton)
      memo.types.ts                # Memo types (skeleton)
      quiz.types.ts                # Quiz types (skeleton)
      team.types.ts                # Team types (skeleton)
      dashboard.types.ts           # Dashboard types (skeleton)
    constants/
      roles.ts                     # Role definitions
      permissions.ts               # Permission mappings
      events.ts                    # WebSocket event names
    validators/
      auth.schema.ts               # Auth Zod schemas
      course.schema.ts             # Course Zod schemas (skeleton)
      quiz.schema.ts               # Quiz Zod schemas (skeleton)
    utils/
      date.ts                      # Date utilities
      markdown.ts                  # Markdown utilities (skeleton)
  tsconfig.json
  package.json
```

### 4.3 Responsive Breakpoint Specification

| Breakpoint | Min Width | Grid Columns | Navigation | Content Padding | Container Max |
|-----------|-----------|-------------|------------|-----------------|---------------|
| Mobile | 0px | 4 | Bottom Tab (fixed) | 16px horizontal | 100% |
| Tablet | 768px | 8 | Collapsible Sidebar (default collapsed) | 24px horizontal | 100% |
| Desktop | 1280px | 12 | Fixed Sidebar (256px, collapsible to 64px) | 32px horizontal | 1280px |

### 4.4 Design Token CSS Variable Naming Convention

All design tokens follow this naming pattern:

- Colors: `--color-{category}-{shade}` (e.g., `--color-primary-500`, `--color-neutral-100`)
- Typography: `--font-{property}-{variant}` (e.g., `--font-size-h1`, `--font-family-sans`)
- Spacing: `--spacing-{size}` (e.g., `--spacing-4`, `--spacing-sidebar`)
- Components: `--{component}-{property}` (e.g., `--card-radius`, `--button-height-md`)
- Shadows: `--shadow-{size}` (e.g., `--shadow-sm`, `--shadow-lg`)
- Radius: `--radius-{size}` (e.g., `--radius-sm`, `--radius-lg`)

shadcn/ui compatibility variables use the `--` prefix convention as required by shadcn/ui (e.g., `--background`, `--foreground`, `--primary`, `--muted`, etc.).

### 4.5 Traceability Matrix

| SPEC-FE-001 Requirement | SPEC-UI-001 Source | .pen File Reference |
|-------------------------|-------------------|-------------------|
| REQ-FE-010 (Color Tokens) | REQ-UI-001 | design/design-system/colors.pen |
| REQ-FE-011 (Typography Tokens) | REQ-UI-002 | design/design-system/typography.pen |
| REQ-FE-012 (Spacing Tokens) | REQ-UI-003 | design/design-system/spacing.pen |
| REQ-FE-013 (Component Tokens) | REQ-UI-004 | design/design-system/components.pen |
| REQ-FE-014 (Tailwind Integration) | REQ-UI-001~004 | All design-system/*.pen |
| REQ-FE-020 (AppLayout) | REQ-UI-005 | All navigation/*.pen |
| REQ-FE-021 (Desktop Sidebar) | REQ-UI-005 | design/navigation/desktop-sidebar.pen |
| REQ-FE-022 (Mobile Bottom Tab) | REQ-UI-005 | design/navigation/mobile-bottom-tab.pen |
| REQ-FE-023 (Tablet Sidebar) | REQ-UI-005 | design/navigation/tablet-sidebar.pen |
| REQ-FE-024 (ContentLayout) | REQ-UI-003 | design/design-system/spacing.pen |
| REQ-FE-031 (Button) | REQ-UI-004 | design/design-system/components.pen |
| REQ-FE-033 (Badge, Avatar) | REQ-UI-004 | design/design-system/components.pen |
| REQ-FE-034 (Dialog, Toast) | REQ-UI-004 | design/design-system/components.pen |
| REQ-FE-007 (Error Boundaries) | REQ-UI-090, REQ-UI-091 | design/screens/common/404.pen, 500.pen |
| REQ-FE-008 (Loading States) | REQ-UI-094 | design/screens/common/loading-states.pen |
