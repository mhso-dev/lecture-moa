---
id: SPEC-FE-001
title: "Next.js Frontend Foundation - Implementation Plan"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
tags: [frontend, nextjs, design-tokens, layout, shadcn-ui, providers, monorepo, foundation]
---

# SPEC-FE-001: Implementation Plan

## Overview

This plan organizes the frontend foundation implementation into 5 milestones ordered by dependency. Each milestone builds on the previous one, ensuring a stable foundation before adding higher-level abstractions.

---

## Milestone 1: Monorepo Scaffolding & Toolchain

**Priority**: Critical (all other milestones depend on this)
**Requirements**: REQ-FE-001 through REQ-FE-005, REQ-FE-009

### Objective

Establish the monorepo structure, build pipeline, TypeScript configuration, and development tooling so that `pnpm dev` runs a working Next.js development server.

### File Creation List

**Root Configuration Files:**

| File | Purpose |
|------|---------|
| `pnpm-workspace.yaml` | Workspace package definitions |
| `package.json` | Root scripts (dev, build, lint, test, format) |
| `.npmrc` | pnpm settings (strict-peer-dependencies, auto-install-peers) |
| `turbo.json` | Turborepo pipeline configuration |
| `tsconfig.base.json` | Base TypeScript config (strict mode, path aliases) |
| `eslint.config.mjs` | ESLint flat config for TypeScript + React + Next.js |
| `.prettierrc` | Prettier formatting rules |
| `.prettierignore` | Prettier ignore patterns |
| `.eslintignore` | ESLint ignore patterns |
| `.env.example` | Environment variable template |
| `.gitignore` | Updated gitignore for monorepo artifacts |

**apps/web/ Scaffolding:**

| File | Purpose |
|------|---------|
| `apps/web/package.json` | Frontend dependencies |
| `apps/web/tsconfig.json` | Next.js TypeScript config extending base |
| `apps/web/next.config.ts` | Next.js configuration (transpilePackages, images) |
| `apps/web/src/env.ts` | Type-safe env validation (@t3-oss/env-nextjs) |
| `apps/web/app/layout.tsx` | Root layout (minimal: html, body, metadata) |
| `apps/web/app/page.tsx` | Placeholder landing page |

**packages/shared/ Scaffolding:**

| File | Purpose |
|------|---------|
| `packages/shared/package.json` | Shared package config with exports |
| `packages/shared/tsconfig.json` | TypeScript config extending base |
| `packages/shared/src/index.ts` | Barrel export |

### Verification

- `pnpm install` completes without errors
- `pnpm dev` starts Next.js dev server at localhost:3000
- `pnpm build` compiles all packages successfully
- `pnpm lint` runs ESLint across all packages
- `pnpm format` runs Prettier check
- TypeScript strict mode active with no type errors
- Shared package importable from apps/web via `@shared/*` alias

---

## Milestone 2: Design Token System

**Priority**: Critical (layout and components depend on tokens)
**Requirements**: REQ-FE-010 through REQ-FE-015

### Objective

Implement the complete design token system as CSS custom properties, integrate with Tailwind CSS 4, and set up font loading. After this milestone, all design tokens from SPEC-UI-001 are available as Tailwind utilities.

### File Creation List

| File | Purpose |
|------|---------|
| `apps/web/styles/tokens/colors.css` | Color palette: Primary (Blue), Secondary (Indigo/Violet), Accent (Emerald), Semantic, Neutral (Slate 50-950), Light + Dark variants |
| `apps/web/styles/tokens/typography.css` | Font families, size scale (Display through Caption), weights, line heights |
| `apps/web/styles/tokens/spacing.css` | 4px-base spacing scale, container widths, sidebar dimensions, grid columns |
| `apps/web/styles/tokens/components.css` | Border radius (sm/md/lg/xl/full), shadow scale (sm/md/lg/xl), component-specific tokens (button heights, input heights, card padding) |
| `apps/web/styles/globals.css` | @import token files, @theme directive, CSS reset, base element styles, shadcn/ui CSS variable bridge |
| `apps/web/tailwind.config.ts` | Extended theme mapping CSS variables to Tailwind utilities |
| `apps/web/app/layout.tsx` | Updated with font loading (Inter via next/font/google, Pretendard via next/font/local) |

### Design Token Source Mapping

| Token Category | Source .pen File | CSS File |
|---------------|-----------------|----------|
| Colors | design/design-system/colors.pen | tokens/colors.css |
| Typography | design/design-system/typography.pen | tokens/typography.css |
| Spacing | design/design-system/spacing.pen | tokens/spacing.css |
| Components | design/design-system/components.pen | tokens/components.css |
| Icons | design/design-system/icons.pen | (Lucide React, no CSS needed) |

### Architecture Decision: CSS Variables + Tailwind @theme

CSS custom properties (HSL-based) are the single source of truth for design tokens. Tailwind CSS 4's `@theme` directive maps these variables into the Tailwind utility system. This approach enables:

- Runtime theme switching (light/dark) without JavaScript
- Full compatibility with shadcn/ui theming convention
- Design token changes propagate automatically to all components
- No duplication between CSS and Tailwind config

### Verification

- All color tokens render correctly in light mode
- Dark mode toggle switches all colors via `.dark` class
- Typography scale matches SPEC-UI-001 specifications
- Tailwind utilities (e.g., `bg-primary`, `text-heading-h1`) resolve to correct CSS variable values
- No hardcoded color, font, or spacing values in any component
- Font loading (Inter + Pretendard) works in browser

---

## Milestone 3: Layout & Navigation Components

**Priority**: High (screen implementations depend on layout)
**Requirements**: REQ-FE-020 through REQ-FE-025

### Objective

Implement the responsive layout system with desktop sidebar, tablet collapsible sidebar, and mobile bottom tab navigation. After this milestone, any page can be wrapped in the layout system and render correctly at all breakpoints.

### File Creation List

| File | Purpose |
|------|---------|
| `apps/web/components/layout/AppLayout.tsx` | Responsive layout orchestrator (breakpoint detection, renders correct navigation) |
| `apps/web/components/layout/Sidebar.tsx` | Desktop/Tablet sidebar with navigation items, user section, collapse toggle |
| `apps/web/components/layout/BottomTab.tsx` | Mobile bottom tab with 5 tabs and active indicator |
| `apps/web/components/layout/ContentLayout.tsx` | Main content area with responsive padding and max-width |
| `apps/web/components/layout/ThemeToggle.tsx` | Light/Dark mode toggle button |
| `apps/web/hooks/useMediaQuery.ts` | Custom hook for responsive breakpoint detection |
| `apps/web/hooks/useScrollPosition.ts` | Scroll position tracking hook |
| `apps/web/stores/navigation.store.ts` | Zustand store for sidebar state, active route, mobile menu |
| `apps/web/app/(dashboard)/layout.tsx` | Dashboard route group layout using AppLayout |
| `apps/web/app/(auth)/layout.tsx` | Auth route group layout (centered, no sidebar) |

### Component Hierarchy

```
RootLayout (app/layout.tsx)
  Providers (providers/index.tsx)
    (dashboard)/layout.tsx
      AppLayout
        Sidebar (Desktop/Tablet)  OR  BottomTab (Mobile)
        ContentLayout
          {page content}
    (auth)/layout.tsx
      {centered auth content}
```

### Navigation Items Specification

| Label | Icon (Lucide) | Route | Badge |
|-------|------|-------|-------|
| Dashboard | LayoutDashboard | /(dashboard) | - |
| Courses | BookOpen | /courses | - |
| Materials | FileText | - (nested under courses) | - |
| Q&A | MessageCircleQuestion | - (contextual) | unread count |
| Quizzes | ClipboardCheck | - (nested under courses) | pending count |
| Teams | Users | - (nested under courses) | - |
| Memos | StickyNote | /memos | - |

### Responsive Behavior Summary

| Viewport | Navigation Type | Sidebar State | Content Offset |
|----------|----------------|---------------|----------------|
| < 768px | Bottom Tab (fixed) | Hidden | Full width, bottom padding for tab bar |
| 768px - 1279px | Collapsible Sidebar | Default collapsed (64px) | Offset by sidebar width |
| >= 1280px | Fixed Sidebar | Default expanded (256px) | Offset by sidebar width |

### Verification

- Desktop (1280px+): Sidebar visible at 256px, collapses to 64px on toggle
- Tablet (768px-1279px): Sidebar collapsed by default, expands as overlay
- Mobile (<768px): Bottom tab visible, sidebar hidden
- Content area adjusts width/padding at each breakpoint
- Active route highlights correctly in navigation
- Theme toggle switches between light and dark modes
- No layout breakage across the 375px to 1920px range

---

## Milestone 4: shadcn/ui Component Library

**Priority**: High (screen implementations use these components)
**Requirements**: REQ-FE-030 through REQ-FE-035

### Objective

Install, configure, and customize shadcn/ui components with the project's design tokens. After this milestone, a complete set of themed UI primitives is available for screen implementations.

### File Creation List

| File | Purpose |
|------|---------|
| `apps/web/components.json` | shadcn/ui CLI configuration |
| `apps/web/lib/utils.ts` | `cn()` utility (clsx + tailwind-merge) |
| `apps/web/components/ui/button.tsx` | Button: 5 variants, 4 sizes, loading state |
| `apps/web/components/ui/input.tsx` | Text input with error/disabled/focused states |
| `apps/web/components/ui/label.tsx` | Form label with required indicator |
| `apps/web/components/ui/card.tsx` | Card with Header, Content, Footer, Title, Description |
| `apps/web/components/ui/dialog.tsx` | Modal dialog with overlay and animations |
| `apps/web/components/ui/badge.tsx` | Badge: semantic + role variants |
| `apps/web/components/ui/avatar.tsx` | Avatar: 5 sizes (xs, sm, md, lg, xl) |
| `apps/web/components/ui/skeleton.tsx` | Skeleton loading placeholder |
| `apps/web/components/ui/sonner.tsx` | Toast notifications (Sonner integration) |
| `apps/web/components/ui/dropdown-menu.tsx` | Dropdown context menu |
| `apps/web/components/ui/tooltip.tsx` | Tooltip for supplementary info |
| `apps/web/components/ui/sheet.tsx` | Mobile slide-over panel |
| `apps/web/components/ui/select.tsx` | Select dropdown |
| `apps/web/components/ui/textarea.tsx` | Multiline text input |
| `apps/web/components/ui/checkbox.tsx` | Checkbox |
| `apps/web/components/ui/radio-group.tsx` | Radio button group |
| `apps/web/components/ui/switch.tsx` | Toggle switch |
| `apps/web/components/ui/form.tsx` | React Hook Form integration wrapper |

### Customization Strategy

1. **Install via shadcn CLI**: Use `npx shadcn@latest add <component>` for base installation
2. **Token Override**: CSS variables in `globals.css` map to shadcn/ui expected variable names
3. **Variant Extension**: Add custom variants (e.g., Badge `role` variant) post-installation
4. **Size Extension**: Add custom sizes where needed (e.g., Avatar `xs`, `xl`)
5. **Theme Verification**: Every component tested in both light and dark modes

### Architecture Decision: shadcn/ui as Customizable Base

shadcn/ui components are copied into the project (not installed as a dependency). This enables:

- Full control over component implementation
- Design token integration at the source level
- Custom variant additions without library conflicts
- No breaking changes from upstream updates

### Verification

- All 19 components render correctly with design tokens
- Button variants match SPEC-UI-001 component token specifications
- Badge variants include both semantic (info, success, warning, error) and role (instructor, student)
- Avatar sizes render at correct pixel dimensions
- All components pass accessibility checks (keyboard navigation, ARIA attributes)
- Dark mode styling correct for all components
- Form components integrate with React Hook Form + Zod validation

---

## Milestone 5: Providers & Shared Package

**Priority**: High (screen implementations need providers and types)
**Requirements**: REQ-FE-040 through REQ-FE-055, REQ-FE-006 through REQ-FE-008

### Objective

Set up all provider infrastructure, complete the shared package with types and validation schemas, and finalize the App Router structure with error boundaries and loading states. After this milestone, the foundation is complete for screen implementation SPECs.

### File Creation List

**Providers:**

| File | Purpose |
|------|---------|
| `apps/web/providers/ThemeProvider.tsx` | next-themes wrapper with class attribute strategy |
| `apps/web/providers/QueryProvider.tsx` | TanStack Query client with defaults |
| `apps/web/providers/AuthProvider.tsx` | NextAuth SessionProvider skeleton |
| `apps/web/providers/index.tsx` | Provider composition with correct nesting |

**Stores:**

| File | Purpose |
|------|---------|
| `apps/web/stores/auth.store.ts` | User session and role state |
| `apps/web/stores/ui.store.ts` | Global UI state (modals, loading, toasts) |

**API Client:**

| File | Purpose |
|------|---------|
| `apps/web/lib/api.ts` | Fetch-based API client with interceptors |
| `apps/web/lib/auth.ts` | NextAuth configuration placeholder |

**App Router Structure:**

| File | Purpose |
|------|---------|
| `apps/web/app/layout.tsx` | Finalized root layout with all providers |
| `apps/web/app/loading.tsx` | Global loading skeleton |
| `apps/web/app/error.tsx` | Global error boundary |
| `apps/web/app/global-error.tsx` | Root layout error boundary |
| `apps/web/app/not-found.tsx` | 404 page |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | NextAuth API route |

**Shared Package Types:**

| File | Purpose |
|------|---------|
| `packages/shared/src/types/auth.types.ts` | User, UserRole, Session, LoginRequest, RegisterRequest |
| `packages/shared/src/types/api.types.ts` | ApiResponse, ApiError, PaginatedResponse |
| `packages/shared/src/types/course.types.ts` | Course type skeleton |
| `packages/shared/src/types/material.types.ts` | Material type skeleton |
| `packages/shared/src/types/qa.types.ts` | Q&A type skeleton |
| `packages/shared/src/types/memo.types.ts` | Memo type skeleton |
| `packages/shared/src/types/quiz.types.ts` | Quiz type skeleton |
| `packages/shared/src/types/team.types.ts` | Team type skeleton |
| `packages/shared/src/types/dashboard.types.ts` | Dashboard type skeleton |

**Shared Package Validators:**

| File | Purpose |
|------|---------|
| `packages/shared/src/validators/auth.schema.ts` | Login and register Zod schemas |
| `packages/shared/src/validators/course.schema.ts` | Course schema skeleton |
| `packages/shared/src/validators/quiz.schema.ts` | Quiz schema skeleton |

**Shared Package Constants:**

| File | Purpose |
|------|---------|
| `packages/shared/src/constants/roles.ts` | INSTRUCTOR, STUDENT role constants |
| `packages/shared/src/constants/permissions.ts` | Role-based permission mappings |
| `packages/shared/src/constants/events.ts` | WebSocket event name constants |

**Shared Package Utilities:**

| File | Purpose |
|------|---------|
| `packages/shared/src/utils/date.ts` | Date formatting utilities |
| `packages/shared/src/utils/markdown.ts` | Markdown utility types skeleton |

### Verification

- All providers compose correctly in root layout
- ThemeProvider enables light/dark switching via ThemeToggle
- QueryProvider mounts without errors; devtools visible in development
- API client sends requests to configured base URL
- Shared package types importable in apps/web via `@shared/*`
- Zod schemas validate correctly in both frontend and backend contexts
- Error boundaries display error UI with retry option
- 404 page displays for unknown routes
- Loading states display skeleton UI during navigation

---

## Risk Analysis

### Risk 1: Tailwind CSS 4 Compatibility

**Description**: Tailwind CSS 4 introduces the `@theme` directive and CSS-first configuration which differs significantly from v3.

**Likelihood**: Medium
**Impact**: High (affects all styling)

**Mitigation**:
- Verify `@theme` directive support in the installed Tailwind CSS version
- Fall back to `tailwind.config.ts` extension if `@theme` support is incomplete
- Keep design tokens in CSS variables regardless (works with both approaches)

### Risk 2: shadcn/ui Version Compatibility

**Description**: shadcn/ui components may require specific Tailwind CSS or Radix UI versions that conflict with other dependencies.

**Mitigation**:
- Lock shadcn/ui component versions at installation time
- Test each component after installation
- Maintain a component installation log for reproducibility

### Risk 3: Font Loading Performance

**Description**: Loading Inter + Pretendard + code fonts may impact initial page load performance.

**Mitigation**:
- Use `next/font` for automatic optimization and subsetting
- Load Pretendard as a local font (avoid external CDN)
- Use `font-display: swap` for non-blocking rendering
- Consider variable fonts to reduce total font file size

### Risk 4: Shared Package Build Order

**Description**: Turborepo must build packages/shared before apps/web, or import resolution fails.

**Mitigation**:
- Configure `turbo.json` with `^build` dependency for topological ordering
- Use TypeScript project references for incremental compilation
- Verify build order with `turbo run build --dry`

### Risk 5: Dark Mode Token Inconsistency

**Description**: Dark mode tokens may not have sufficient contrast or may miss some component states.

**Mitigation**:
- Audit all CSS variable pairs (light/dark) for contrast compliance
- Test every shadcn/ui component in both themes
- Use browser DevTools to simulate forced color modes

---

## Architecture Decision Records

### ADR-001: Monorepo with pnpm + Turborepo

**Decision**: Use pnpm workspaces with Turborepo for monorepo management.

**Rationale**: pnpm provides strict dependency resolution and disk efficiency. Turborepo adds incremental builds and parallel execution. This is the established pattern from tech.md.

**Alternatives Considered**:
- npm workspaces: Slower, no strict resolution
- yarn workspaces: Good but pnpm has better disk usage
- Nx: More complex than needed for this project size

### ADR-002: CSS Variables as Token Source of Truth

**Decision**: Store all design tokens as CSS custom properties in dedicated token files, bridged to Tailwind via `@theme`.

**Rationale**: CSS variables enable runtime theme switching without JavaScript re-renders. The shadcn/ui convention already uses CSS variables. This creates a single source of truth that works with both Tailwind utilities and raw CSS.

**Alternatives Considered**:
- Tailwind config only: No runtime theme switching, harder to bridge with shadcn/ui
- CSS-in-JS tokens: Adds runtime overhead, conflicts with Server Components
- Design token JSON files: Adds a build step for compilation

### ADR-003: Zustand for Client State

**Decision**: Use Zustand for client-side UI state management.

**Rationale**: Zustand is lightweight, TypeScript-native, and requires minimal boilerplate. The project scope (navigation state, UI toggles, auth state) does not justify Redux complexity.

**Alternatives Considered**:
- Redux Toolkit: Too much boilerplate for the state complexity
- Jotai: Good for atomic state but less ergonomic for store-based patterns
- React Context: Sufficient for simple state but causes unnecessary re-renders

### ADR-004: TanStack Query for Server State

**Decision**: Use TanStack Query v5 for all server state management.

**Rationale**: Provides caching, background refetching, optimistic updates, and pagination. Integrates well with the fetch-based API client and reduces boilerplate compared to manual state management.

### ADR-005: Fetch-Based API Client

**Decision**: Build the API client on native `fetch` rather than Axios.

**Rationale**: Native fetch is supported in Server Components and Edge Runtime. Next.js extends fetch with caching and revalidation. Reduces bundle size by avoiding third-party HTTP library.

**Alternatives Considered**:
- Axios: Better interceptor API but adds bundle weight and incompatible with Server Components
- ky: Lightweight fetch wrapper but adds unnecessary abstraction

---

## Milestone Dependency Graph

```
M1: Monorepo Scaffolding
  |
  v
M2: Design Token System
  |
  +-----+-----+
  |           |
  v           v
M3: Layout   M4: shadcn/ui
  |           |
  +-----+-----+
        |
        v
M5: Providers & Shared Package
```

M1 must complete first. M2 must follow M1. M3 and M4 can proceed in parallel after M2 (both depend on design tokens but not on each other). M5 depends on M3 and M4 (providers compose layout + components, shared package finalizes types used across all layers).
