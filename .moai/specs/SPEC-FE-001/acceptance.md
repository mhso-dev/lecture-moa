---
id: SPEC-FE-001
title: "Next.js Frontend Foundation - Acceptance Criteria"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
tags: [frontend, nextjs, design-tokens, layout, shadcn-ui, providers, monorepo, foundation]
---

# SPEC-FE-001: Acceptance Criteria

## 1. Monorepo & Toolchain (REQ-FE-001 through REQ-FE-005, REQ-FE-009)

### AC-001: pnpm Workspace

```gherkin
Feature: pnpm Workspace Configuration

  Scenario: Install dependencies across workspace
    Given the repository root contains pnpm-workspace.yaml
    And pnpm-workspace.yaml defines "apps/*" and "packages/*" as packages
    When the developer runs "pnpm install"
    Then all workspace packages install without errors
    And node_modules/.pnpm contains dependencies from all packages

  Scenario: Workspace scripts execute
    Given root package.json defines "dev", "build", "lint", "test", and "format" scripts
    When the developer runs "pnpm build"
    Then Turborepo executes build across all packages in dependency order
    And no errors are reported
```

### AC-002: Turborepo Pipeline

```gherkin
Feature: Turborepo Build Pipeline

  Scenario: Cached build
    Given a successful previous build exists
    When the developer runs "pnpm build" without changing source files
    Then Turborepo reports cache hits for all packages
    And build completes in under 5 seconds

  Scenario: Topological build order
    Given packages/shared is a dependency of apps/web
    When the developer runs "pnpm build"
    Then packages/shared builds before apps/web
```

### AC-003: TypeScript Strict Mode

```gherkin
Feature: TypeScript Configuration

  Scenario: Strict mode enforcement
    Given tsconfig.base.json has "strict": true
    And all workspace tsconfigs extend tsconfig.base.json
    When the developer runs "pnpm exec tsc --noEmit" in any workspace
    Then no type errors are reported

  Scenario: Path alias resolution
    Given tsconfig.base.json defines "@shared/*" path alias
    When apps/web imports from "@shared/types/auth.types"
    Then the import resolves to packages/shared/src/types/auth.types.ts
    And TypeScript provides correct type inference
```

### AC-004: ESLint & Prettier

```gherkin
Feature: Code Quality Tools

  Scenario: Lint check passes
    Given ESLint flat config is defined at the repository root
    When the developer runs "pnpm lint"
    Then ESLint checks all TypeScript and TSX files
    And zero warnings or errors are reported on clean code

  Scenario: Format check passes
    Given Prettier config is defined at the repository root
    When the developer runs "pnpm format"
    Then all files conform to Prettier formatting rules
```

### AC-005: Environment Variables

```gherkin
Feature: Type-Safe Environment Variables

  Scenario: Valid environment
    Given .env.local contains all required variables from .env.example
    When the developer starts the Next.js dev server
    Then the server starts without environment validation errors

  Scenario: Missing required variable
    Given .env.local is missing NEXT_PUBLIC_API_URL
    When the developer starts the Next.js dev server
    Then the build fails with a descriptive error identifying the missing variable
```

---

## 2. Design Token System (REQ-FE-010 through REQ-FE-015)

### AC-010: Color Tokens

```gherkin
Feature: Color Design Tokens

  Scenario: Light mode colors render correctly
    Given the application loads with light mode active
    When the developer inspects the :root CSS selector
    Then --color-primary-500 contains the HSL value for Primary Blue
    And --color-accent-500 contains the HSL value for Emerald CTA
    And --color-neutral-50 through --color-neutral-950 define the Slate scale

  Scenario: Dark mode colors switch correctly
    Given the application is in light mode
    When the user toggles dark mode via ThemeToggle
    Then the .dark class is applied to the html element
    And --color-neutral-50 inverts to the dark Slate value
    And --background and --foreground CSS variables update accordingly
    And no color values are hardcoded in components

  Scenario: Semantic colors are available
    Given the color token file is loaded
    When the developer uses Tailwind class "bg-success" or "text-error"
    Then the colors resolve to Green and Red respectively per SPEC-UI-001
```

### AC-011: Typography Tokens

```gherkin
Feature: Typography Design Tokens

  Scenario: Font families load correctly
    Given layout.tsx configures Inter via next/font/google
    And Pretendard is loaded via next/font/local
    When the page renders in the browser
    Then English text renders in Inter
    And Korean text renders in Pretendard
    And code blocks render in Fira Code or JetBrains Mono

  Scenario: Type scale matches specification
    Given typography.css defines the type scale
    When an H1 element uses the heading style
    Then the computed font-size is 30px
    And the line-height matches the SPEC-UI-001 specification
    And the font-weight is 700 (bold)
```

### AC-012: Spacing Tokens

```gherkin
Feature: Spacing Design Tokens

  Scenario: Spacing scale follows 4px base
    Given spacing.css defines the spacing scale
    When the developer uses Tailwind class "p-4"
    Then the computed padding is 16px (4 * 4px)
    And "p-6" computes to 24px

  Scenario: Container max-width enforced
    Given ContentLayout wraps page content
    When the viewport width exceeds 1280px
    Then the content area max-width is 1280px
    And the content is centered horizontally
```

### AC-013: Component Tokens

```gherkin
Feature: Component Design Tokens

  Scenario: Border radius tokens
    Given components.css defines radius tokens
    When a Card component renders
    Then border-radius matches --radius-lg (12px)
    And a Button component uses --radius-md (8px)

  Scenario: Shadow tokens
    Given components.css defines shadow tokens
    When a Card component renders with default elevation
    Then box-shadow matches --shadow-sm
    And a Dialog overlay uses --shadow-xl
```

### AC-014: Tailwind Theme Integration

```gherkin
Feature: Tailwind CSS 4 Theme Integration

  Scenario: Custom utilities resolve to CSS variables
    Given tailwind.config.ts extends theme with design token references
    When the developer uses "bg-primary" class
    Then the background-color resolves to var(--color-primary-500)
    And the color value changes between light and dark modes

  Scenario: shadcn/ui CSS variable bridge
    Given globals.css maps design tokens to shadcn/ui variable names
    When a shadcn/ui Button renders with "default" variant
    Then --primary, --primary-foreground resolve to design token values
```

---

## 3. Layout & Navigation System (REQ-FE-020 through REQ-FE-025)

### AC-020: Desktop Sidebar (>= 1280px)

```gherkin
Feature: Desktop Sidebar Navigation

  Scenario: Sidebar renders at correct width
    Given the viewport width is 1440px
    When the dashboard page loads
    Then the sidebar is visible with 256px width
    And all navigation items with Lucide icons are displayed
    And the active route item is visually highlighted

  Scenario: Sidebar collapses
    Given the sidebar is expanded (256px)
    When the user clicks the collapse toggle
    Then the sidebar width transitions to 64px
    And navigation labels are hidden, only icons remain
    And the content area expands to fill available width

  Scenario: Sidebar collapse persists
    Given the user collapsed the sidebar
    When the page is refreshed
    Then the sidebar remains in collapsed state
    And the preference is stored in localStorage
```

### AC-021: Mobile Bottom Tab (< 768px)

```gherkin
Feature: Mobile Bottom Tab Navigation

  Scenario: Bottom tab renders on mobile
    Given the viewport width is 375px
    When the dashboard page loads
    Then a fixed bottom tab bar is visible
    And exactly 5 tabs are displayed (Dashboard, Courses, Q&A, Quizzes, More)
    And the sidebar is not visible

  Scenario: Tab selection
    Given the bottom tab bar is visible
    When the user taps the Courses tab
    Then the Courses tab shows active indicator styling
    And the page navigates to the courses route

  Scenario: Notification badges
    Given there are unread Q&A notifications
    When the bottom tab bar renders
    Then the Q&A tab displays a badge with the unread count
```

### AC-022: Tablet Sidebar (768px - 1279px)

```gherkin
Feature: Tablet Collapsible Sidebar

  Scenario: Default collapsed state
    Given the viewport width is 1024px
    When the dashboard page loads
    Then the sidebar renders in collapsed state (64px)
    And only navigation icons are visible

  Scenario: Expand on tablet
    Given the sidebar is in collapsed state on tablet
    When the user clicks the expand toggle
    Then the sidebar expands to 256px as an overlay
    And the content area is dimmed behind the overlay
```

### AC-023: Content Area Responsiveness

```gherkin
Feature: Content Area Layout

  Scenario: Desktop content with expanded sidebar
    Given the viewport is 1440px and sidebar is expanded (256px)
    When a page renders in ContentLayout
    Then the content area starts at 256px offset
    And max-width is 1280px with 32px horizontal padding

  Scenario: Mobile content with bottom tab
    Given the viewport is 375px
    When a page renders in ContentLayout
    Then the content area is full width with 16px horizontal padding
    And bottom padding accounts for the tab bar height
```

---

## 4. shadcn/ui Component Library (REQ-FE-030 through REQ-FE-035)

### AC-030: Button Component

```gherkin
Feature: Button Component Variants

  Scenario: Primary button renders
    Given a Button component with variant="default"
    When it renders in light mode
    Then background color matches Primary Blue token
    And text color is white (primary-foreground)
    And border-radius matches --radius-md

  Scenario: All 5 variants render
    Given Button components with variants: default, secondary, ghost, destructive, outline
    When all render in a row
    Then each variant has distinct visual styling
    And all variants have hover, active, and disabled states

  Scenario: Loading state
    Given a Button with loading={true}
    When it renders
    Then a spinner icon is displayed
    And the button is disabled
    And the button text remains visible alongside the spinner
```

### AC-031: Card Component

```gherkin
Feature: Card Component

  Scenario: Card with all sections
    Given a Card with CardHeader, CardTitle, CardDescription, CardContent, CardFooter
    When it renders
    Then border-radius matches --radius-lg (12px)
    And box-shadow matches --shadow-sm
    And padding matches component token specification
    And all sections are correctly stacked vertically
```

### AC-032: Badge Component

```gherkin
Feature: Badge Component Variants

  Scenario: Semantic badges
    Given Badge components with variant: info, success, warning, error
    When all render
    Then info uses Blue, success uses Green, warning uses Amber, error uses Red

  Scenario: Role badges
    Given Badge components for role: instructor, student
    When rendered
    Then instructor badge uses a distinct color from student badge
    And text content displays the role label
```

### AC-033: Form Components Integration

```gherkin
Feature: Form Components with React Hook Form

  Scenario: Form validation
    Given a Form component wrapping Input and Label
    And the form uses Zod schema from shared package for validation
    When the user submits with an invalid email
    Then the Input enters error state with red border
    And an error message displays below the input

  Scenario: Disabled state
    Given an Input component with disabled={true}
    When it renders
    Then the input has reduced opacity
    And the input does not accept user input
```

### AC-034: Toast Notifications

```gherkin
Feature: Toast Notifications

  Scenario: Success toast
    Given the toast system is initialized via Sonner provider
    When toast.success("Item created") is called
    Then a success toast appears with green styling
    And the toast auto-dismisses after the configured duration

  Scenario: Error toast
    When toast.error("Something went wrong") is called
    Then an error toast appears with red styling
    And a close button is available
```

### AC-035: Dark Mode Component Compatibility

```gherkin
Feature: Components in Dark Mode

  Scenario: All components render correctly in dark mode
    Given the application is in dark mode
    When each shadcn/ui component is inspected
    Then background colors use dark theme tokens
    And text colors use dark theme foreground tokens
    And borders use dark theme border tokens
    And no component has unreadable text (contrast ratio >= 4.5:1)
```

---

## 5. Providers & Shared Package (REQ-FE-040 through REQ-FE-055)

### AC-040: Theme Provider

```gherkin
Feature: Theme Provider

  Scenario: System preference detection
    Given the user's OS is set to dark mode
    And ThemeProvider is configured with "system" default
    When the application loads for the first time
    Then the application renders in dark mode

  Scenario: Manual theme toggle
    Given the application is in light mode
    When the user clicks the ThemeToggle button
    Then the application transitions to dark mode
    And the preference is persisted in localStorage
    And subsequent page loads respect the stored preference
```

### AC-041: Query Provider

```gherkin
Feature: TanStack Query Provider

  Scenario: QueryClient defaults
    Given QueryProvider wraps the application
    When a query executes
    Then staleTime is 5 minutes
    And retry count is 1
    And refetchOnWindowFocus is false

  Scenario: DevTools available in development
    Given the application runs in development mode
    When the developer opens React Query Devtools
    Then active queries and their cache state are visible
```

### AC-042: API Client

```gherkin
Feature: API Client Configuration

  Scenario: Base URL configuration
    Given NEXT_PUBLIC_API_URL is set to "http://localhost:4000"
    When the API client sends a request to "/api/users"
    Then the full URL is "http://localhost:4000/api/users"

  Scenario: Error handling
    Given the API returns a 401 status
    When the API client processes the response
    Then a typed ApiError object is returned
    And the error contains status code and message fields
```

### AC-043: Shared Package Types

```gherkin
Feature: Shared Type Definitions

  Scenario: Auth types are available
    Given packages/shared exports auth types
    When apps/web imports User, UserRole from "@shared/types/auth.types"
    Then TypeScript provides full type inference
    And UserRole enum contains INSTRUCTOR and STUDENT values

  Scenario: API response types are available
    Given packages/shared exports API types
    When apps/web imports ApiResponse<T> from "@shared/types/api.types"
    Then the generic type wraps data, error, and pagination fields correctly
```

### AC-044: Zod Validation Schemas

```gherkin
Feature: Shared Validation Schemas

  Scenario: Login schema validation
    Given auth.schema.ts defines loginSchema with email and password
    When a valid email and password are parsed
    Then the schema returns a typed object with email and password

  Scenario: Login schema rejection
    Given auth.schema.ts defines loginSchema
    When an invalid email format is parsed
    Then the schema throws a ZodError with field-level error messages
```

### AC-045: Error Boundaries

```gherkin
Feature: Error Boundaries

  Scenario: Route error boundary
    Given a route component throws an unhandled error
    When the error propagates to app/error.tsx
    Then an error page displays with the error message
    And a "Try Again" button is available
    And clicking "Try Again" resets the error boundary

  Scenario: 404 page
    Given a user navigates to a non-existent route
    When the route fails to match
    Then app/not-found.tsx renders
    And the page displays a "Page Not Found" message
    And a "Go Home" button navigates to the landing page
```

---

## 6. Cross-Cutting Quality Criteria

### QC-001: Responsive Rendering

```gherkin
Feature: Responsive Rendering

  Scenario Outline: Breakpoints render correctly
    Given the viewport width is <width>px
    When the dashboard page loads
    Then the navigation type is <navigation>
    And the content padding is <padding>
    And no horizontal overflow occurs

    Examples:
      | width | navigation      | padding   |
      | 375   | Bottom Tab      | 16px      |
      | 768   | Collapsed Sidebar | 24px    |
      | 1280  | Fixed Sidebar   | 32px      |
      | 1920  | Fixed Sidebar   | 32px      |
```

### QC-002: Dark Mode Coverage

```gherkin
Feature: Dark Mode Toggle

  Scenario: Full theme switch
    Given the application is in light mode
    When the user toggles dark mode
    Then every visible element updates to dark theme colors
    And no element retains light mode styling
    And the theme transition is smooth (CSS transition)
```

### QC-003: Performance

```gherkin
Feature: Lighthouse Performance

  Scenario: Landing page performance
    Given the application is deployed in production mode
    When Lighthouse audits the landing page
    Then the Performance score is >= 90
    And the Accessibility score is >= 90
    And LCP is under 2.5 seconds
    And CLS is under 0.1
```

### QC-004: TypeScript Strict Compliance

```gherkin
Feature: TypeScript Strict Mode

  Scenario: Zero type errors
    Given all workspace packages have TypeScript configured
    When "pnpm exec tsc --noEmit" runs across the entire monorepo
    Then zero type errors are reported
    And all function parameters and return types are explicitly typed
```

### QC-005: Design Token Compliance

```gherkin
Feature: Design Token Adherence

  Scenario: No arbitrary values
    Given all source files in apps/web/components/
    When searched for inline style values or arbitrary Tailwind values (e.g., "[16px]")
    Then zero matches are found for hardcoded color values
    And zero matches are found for hardcoded font sizes
    And zero matches are found for hardcoded spacing values
    And all values reference design tokens via Tailwind utilities or CSS variables
```

### QC-006: Accessibility

```gherkin
Feature: WCAG 2.1 AA Compliance

  Scenario: Color contrast
    Given all text elements on the page
    When contrast ratio is measured against background
    Then normal text has contrast ratio >= 4.5:1
    And large text has contrast ratio >= 3:1

  Scenario: Keyboard navigation
    Given interactive elements (buttons, links, inputs)
    When the user navigates using Tab key
    Then focus indicator is visible on every interactive element
    And all interactive elements are reachable via keyboard
```

---

## 7. Definition of Done

The following checklist must be fully satisfied before SPEC-FE-001 is considered complete:

### Build & Configuration

- [ ] `pnpm install` succeeds with zero errors
- [ ] `pnpm build` succeeds with zero errors across all workspace packages
- [ ] `pnpm lint` reports zero errors
- [ ] `pnpm format` reports no formatting violations
- [ ] TypeScript strict mode passes with zero type errors
- [ ] All environment variables documented in `.env.example`
- [ ] Environment validation works via `@t3-oss/env-nextjs`

### Design Tokens

- [ ] All color tokens from SPEC-UI-001 implemented as CSS variables
- [ ] Light and dark theme tokens defined and switching works
- [ ] Typography tokens match SPEC-UI-001 scale exactly
- [ ] Spacing tokens follow 4px base system
- [ ] Component tokens (radius, shadow) match SPEC-UI-001
- [ ] Tailwind CSS 4 integration maps all tokens to utility classes
- [ ] Fonts (Inter, Pretendard, code font) load and render correctly

### Layout & Navigation

- [ ] Desktop sidebar renders at 256px, collapses to 64px
- [ ] Tablet sidebar defaults to collapsed, expands as overlay
- [ ] Mobile bottom tab renders with 5 tabs
- [ ] Content area responds correctly at all three breakpoints
- [ ] Active route highlighting works in all navigation components
- [ ] Sidebar collapse state persists across page loads
- [ ] No layout breakage from 375px to 1920px

### Components

- [ ] All 19 shadcn/ui components installed and themed
- [ ] Button: 5 variants, 4 sizes, loading state work correctly
- [ ] Badge: semantic (4) and role (2) variants work correctly
- [ ] Avatar: 5 sizes (xs, sm, md, lg, xl) render correctly
- [ ] All form components integrate with React Hook Form
- [ ] Toast/Sonner notifications work for all 4 types
- [ ] All components pass dark mode visual verification

### Providers & Infrastructure

- [ ] ThemeProvider enables system detection and manual toggle
- [ ] QueryProvider configures TanStack Query with correct defaults
- [ ] API client sends requests with proper base URL and headers
- [ ] Auth provider skeleton is in place (SessionProvider)
- [ ] Zustand stores (navigation, auth, ui) have correct TypeScript interfaces
- [ ] Error boundaries display user-friendly error pages
- [ ] Loading states display skeleton UI

### Shared Package

- [ ] Auth types (User, UserRole, Session) exported and usable
- [ ] API types (ApiResponse, ApiError, PaginatedResponse) exported and usable
- [ ] Domain type skeletons (course, material, qa, memo, quiz, team, dashboard) created
- [ ] Zod auth schemas (login, register) validate correctly
- [ ] Constants (roles, permissions, events) exported and usable
- [ ] Utility functions (date) exported and usable

### Quality

- [ ] Lighthouse Performance score >= 90 (production build)
- [ ] Lighthouse Accessibility score >= 90
- [ ] WCAG 2.1 AA color contrast compliance verified
- [ ] Keyboard navigation works for all interactive elements
- [ ] No hardcoded style values in component source files
- [ ] All design token values match SPEC-UI-001 specifications exactly
