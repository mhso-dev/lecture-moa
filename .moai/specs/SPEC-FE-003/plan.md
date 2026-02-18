---
id: SPEC-FE-003
title: "Dashboard Views - Implementation Plan"
version: 2.0.0
spec_ref: SPEC-FE-003
updated: 2026-02-19
---

## HISTORY

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 2.0.0 | 2026-02-19 | MoAI | Full rewrite: align role values to lowercase (`"student"` / `"instructor"`), fix path alias from `@` to `~`, verify all file paths against codebase conventions |
| 1.0.0 | 2026-02-19 | MoAI | Initial implementation plan |

---

# SPEC-FE-003: Dashboard Views -- Implementation Plan

## Technical Approach

### Architecture Overview

Dashboard views are composed of three independent page modules (Student, Instructor, Team) sharing a common widget infrastructure layer. The architecture separates concerns into:

1. **Route layer**: Server Components for auth-gated redirects and page metadata
2. **Widget infrastructure**: Reusable `DashboardWidget`, `DashboardGrid`, `EmptyState` components
3. **Domain widgets**: Role-scoped widget components per dashboard
4. **Data layer**: TanStack Query hooks per domain, typed against shared types
5. **State layer**: Zustand `dashboard.store.ts` for UI-only state

All data flows from TanStack Query hooks into widget components. Widgets own their own query calls (they do not receive data via props) for independence and simpler code splitting.

### Key Technical Decisions

- **Server-side role redirect**: Use Next.js 15 `redirect()` in async Server Components (not client-side routing) for dashboard root redirect. This avoids flash-of-wrong-content.
- **Skeleton as `loading.tsx`**: Each dashboard sub-route has a dedicated `loading.tsx` that renders a skeleton matching the widget grid. This leverages Next.js streaming Suspense boundaries automatically.
- **Widget isolation**: Each widget imports its own TanStack Query hook. No prop-drilling of data. Enables per-widget error boundaries and independent refetch.
- **Empty states always defined**: Every widget has an explicit empty state component embedded. This is a design requirement, not an afterthought.
- **Real-time as skeleton only**: Hooks return `{ isConnected: false }`. No actual socket code is written. This keeps the door open for a future WebSocket SPEC without polluting current implementation.
- **Path alias**: All imports from the `apps/web` root use the `~` alias (e.g., `~/lib/auth`, `~/stores/dashboard.store`), consistent with SPEC-FE-001 and SPEC-FE-002 established convention.
- **Role values**: Role checks use lowercase string values (`"student"`, `"instructor"`) matching the `UserRole` type defined in `packages/shared/src/types/auth.types.ts`.
- **Store naming**: The dashboard store follows the `*.store.ts` naming convention established by `auth.store.ts`, `navigation.store.ts`, and `ui.store.ts`.

---

## Implementation Milestones

### Primary Goal: Shared Infrastructure

Implement the foundation components that all three dashboards depend on:

1. **DashboardWidget component** (`apps/web/components/dashboard/DashboardWidget.tsx`)
   - Card wrapper with title, subtitle, optional header action
   - Loading state with Skeleton overlay
   - Error state with retry button
   - Wraps shadcn/ui `Card` from SPEC-FE-001

2. **DashboardGrid component** (`apps/web/components/dashboard/DashboardGrid.tsx`)
   - CSS Grid with configurable responsive columns
   - Default presets for Student/Instructor (3-col) and Team (2-col)

3. **EmptyState component** (`apps/web/components/dashboard/EmptyState.tsx`)
   - Icon + title + optional description + optional action button
   - Used by all data-presenting widgets

4. **Dashboard Zustand store** (`apps/web/stores/dashboard.store.ts`)
   - `activeTab`, `notificationCount`, `isRefreshing` state
   - Actions for notification management

5. **Shared types** (`packages/shared/src/types/dashboard.types.ts`)
   - All student, instructor, and team data types defined in one file

6. **API endpoint constants** (`apps/web/lib/api-endpoints.ts`)
   - Dashboard endpoint path constants

### Secondary Goal: Student Dashboard

Implement student-facing dashboard in this order (dependencies respected):

1. Route redirect hub (`apps/web/app/(dashboard)/dashboard/page.tsx`)
2. Student page and loading skeleton (`apps/web/app/(dashboard)/dashboard/student/page.tsx`, `loading.tsx`)
3. Student TanStack Query hooks (`apps/web/hooks/dashboard/useStudentDashboard.ts`)
4. Student widgets (implement in parallel; each is independent):
   - `EnrolledCoursesWidget`
   - `RecentQAWidget`
   - `QuizScoresWidget`
   - `StudyProgressWidget`
   - `UpcomingQuizzesWidget`
   - `QANotificationsWidget`
5. Student real-time hook skeleton (`apps/web/hooks/dashboard/useStudentRealtimeUpdates.ts`)

### Tertiary Goal: Instructor Dashboard

Implement instructor-facing dashboard after Student dashboard is complete (shares infrastructure):

1. Instructor page and loading skeleton (`apps/web/app/(dashboard)/dashboard/instructor/page.tsx`, `loading.tsx`)
2. Instructor route protection (role check with `"instructor"` value)
3. Instructor TanStack Query hooks (`apps/web/hooks/dashboard/useInstructorDashboard.ts`)
4. Instructor widgets (implement in parallel):
   - `MyCoursesWidget`
   - `StudentActivityWidget`
   - `PendingQAWidget`
   - `QuizPerformanceWidget`
   - `ActivityFeedWidget` (includes pagination / "Load more")
   - `QuickActionsWidget`
5. Instructor real-time hook skeleton (`apps/web/hooks/dashboard/useInstructorRealtimeUpdates.ts`)

### Final Goal: Team Dashboard

Implement team dashboard last (shares all infrastructure; simplest scope):

1. Team page and loading skeleton (`apps/web/app/(dashboard)/dashboard/team/page.tsx`, `loading.tsx`)
2. Team route protection (requires `"student"` role)
3. Team TanStack Query hooks (`apps/web/hooks/dashboard/useTeamDashboard.ts`)
4. Team widgets:
   - `TeamOverviewWidget`
   - `TeamMembersWidget`
   - `SharedMemosFeedWidget`
   - `TeamActivityWidget`
5. Team real-time hook skeleton (`apps/web/hooks/dashboard/useTeamRealtimeUpdates.ts`)

### Optional Goal: Accessibility & Polish

After all dashboard views are functionally complete:

1. Keyboard navigation audit across all three dashboards
2. Screen reader testing with live regions for notification badge
3. Touch target size verification (44x44px minimum)
4. Heading hierarchy review (`h1` -> `h2` -> `h3` per page)
5. Color contrast check for semantic badge colors (score indicators)

---

## Technical Approach Details

### Data Fetching Strategy

Each widget hook uses TanStack Query `useQuery` with:
- `queryKey`: namespaced array (see spec.md section 4.3)
- `staleTime`: 2 minutes for metrics/counts; 30-60 seconds for activity feeds
- `retry: 1`: single retry on failure
- `enabled`: conditional on session being available (no fetch when unauthenticated)

No server-side data fetching (`fetch` in Server Components) for dashboard data in this iteration. Client-side fetching via TanStack Query is preferred to simplify auth header injection via the existing API client interceptor in `~/lib/api.ts`.

### Role Protection Implementation

The dashboard root redirect hub (`apps/web/app/(dashboard)/dashboard/page.tsx`) is an async Server Component:

- Reads session via `auth()` imported from `~/lib/auth`
- Checks `session.user.role` against lowercase role values: `'instructor'` and `'student'`
- `'instructor'` role -> `redirect('/dashboard/instructor')`
- `'student'` role -> `redirect('/dashboard/student')`
- No session -> `redirect('/login')`

Individual sub-routes (`/dashboard/instructor`, `/dashboard/student`, `/dashboard/team`) perform their own `auth()` check and redirect if role mismatches. This provides defense-in-depth.

Note: The existing `apps/web/middleware.ts` (from SPEC-FE-002) already protects all `/dashboard/*` routes from unauthenticated access. The server component checks in this SPEC add role-level protection on top of that.

### Widget Error Handling

Each widget wraps its content in the `DashboardWidget` component which handles three states:

- `isLoading`: renders `Skeleton` placeholders sized to approximate final content
- `error`: renders an error card with message and "Retry" button that calls `refetch()`
- `data`: renders the widget content; if data array is empty, renders `EmptyState`

No global error boundary wrapping all widgets together -- each widget fails independently.

### API Mocking for Development

Since the Fastify backend is not yet implemented, hooks should use MSW (Mock Service Worker) or return mock data from a local fixture when `NEXT_PUBLIC_API_URL` is not set or when `NODE_ENV === 'development'`. This unblocks frontend development.

Implementation detail: add `apps/web/mocks/dashboard/` directory with fixture JSON files. Hooks check `process.env.NEXT_PUBLIC_USE_MOCK_DATA === 'true'` to return mock data directly.

### Import Path Convention

All internal imports within `apps/web` use the `~` alias:

| Import Type | Pattern |
|-------------|---------|
| Lib utilities | `~/lib/api`, `~/lib/auth`, `~/lib/utils`, `~/lib/api-endpoints` |
| Stores | `~/stores/dashboard.store`, `~/stores/auth.store` |
| Components | `~/components/dashboard/DashboardWidget`, `~/components/ui/card` |
| Hooks | `~/hooks/dashboard/useStudentDashboard`, `~/hooks/useAuth` |
| Providers | `~/providers/QueryProvider` |

Shared package imports use the `@shared` alias:

| Import Type | Pattern |
|-------------|---------|
| Types | `@shared` (barrel export) or `@shared/types/dashboard.types` |

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Backend API not available during development | High | Medium | Mock Service Worker (MSW) fixtures in development mode |
| Widget layout shift during loading -> data transition | Medium | Medium | Skeleton dimensions match final content layout; avoid dynamic height widgets |
| Role-based redirect causes navigation flicker | Low | Medium | Server-side redirect in async Server Component (no client hydration needed) |
| `dashboard.types.ts` grows too large | Low | Low | Split into `student.types.ts`, `instructor.types.ts`, `team.types.ts` within `packages/shared/src/types/dashboard/` if > 300 lines |
| Accessibility failures for color-coded scores | Medium | Medium | All score indicators include text label alongside color; tested with axe-core |
| Existing `(dashboard)/page.tsx` conflicts with new `/dashboard` route | Medium | Low | The existing `(dashboard)/page.tsx` serves as a generic placeholder from FE-001. This SPEC replaces it with the redirect hub at `(dashboard)/dashboard/page.tsx`. The original file may need to be removed or repurposed |
