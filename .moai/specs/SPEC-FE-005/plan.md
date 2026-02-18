---
id: SPEC-FE-005
title: "Course Management - Implementation Plan"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

## HISTORY

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 2.0.0 | 2026-02-19 | MoAI | 구현 계획 전면 재작성: 경로를 실제 코드베이스 컨벤션에 맞게 수정 (src/ 제거, (main) -> (dashboard)), store 네이밍을 *.store.ts 패턴으로 통일, API 클라이언트 참조를 apps/web/lib/api.ts로 수정 |
| 1.0.0 | 2026-02-19 | MoAI | 초기 구현 계획 작성 |

---

# SPEC-FE-005: Course Management -- Implementation Plan

## 1. Overview

This plan covers the implementation of the Course Management domain for the lecture-moa frontend. Work is divided into four priority milestones aligned with the four screens defined in the SPEC. Implementation follows the **Hybrid** development mode (TDD for new code, DDD for any existing foundation code being extended).

All tasks build on SPEC-FE-001 (foundation) and SPEC-FE-002 (authentication). SPEC-FE-004 (materials) must be referenced but not blocked upon -- the material list rendered inside the course detail page is read-only.

### Established Conventions

This implementation strictly follows the conventions established by SPEC-FE-001 and SPEC-FE-002:

| Convention | Pattern |
|-----------|---------|
| App path | `apps/web/app/` (no `src/` prefix) |
| Route groups | `(auth)` for authentication, `(dashboard)` for protected pages |
| Store naming | `*.store.ts` (e.g., `course.store.ts`) |
| Store location | `apps/web/stores/` |
| Components | PascalCase in `apps/web/components/` |
| Hooks | `apps/web/hooks/use*.ts` |
| Shared types | `packages/shared/src/types/*.types.ts` |
| API client | `apps/web/lib/api.ts` (fetch-based singleton) |
| Path alias | `~` (for apps/web root) |
| UI library | shadcn/ui with Tailwind CSS 4 |
| Forms | React Hook Form + Zod validation |
| State | Zustand (client), TanStack Query v5 (server) |

---

## 2. Milestones

### Primary Goal -- Shared Types, Schemas, and Hooks

Establish the data contract layer shared across all course screens. This must be completed before any UI component work begins.

**Deliverables:**

1. `packages/shared/src/types/course.types.ts`
   - All TypeScript interfaces as specified in `spec.md 4.1`
   - Export from `packages/shared/src/types/index.ts`

2. `packages/shared/src/validators/course.schema.ts`
   - Zod schemas as specified in `spec.md 4.2`
   - Export from `packages/shared/src/validators/index.ts`

3. TanStack Query hooks (`apps/web/hooks/`)
   - `useCourses.ts` -- paginated course list with filter/sort params
   - `useCourse.ts` -- single course detail
   - `useCourseProgress.ts` -- student progress
   - `useCourseStudents.ts` -- instructor roster
   - `useCreateCourse.ts` -- create mutation with cache invalidation
   - `useUpdateCourse.ts` -- update mutation
   - `useArchiveCourse.ts` -- archive mutation
   - `useDeleteCourse.ts` -- delete mutation with redirect
   - `useEnrollCourse.ts` -- public enrollment with optimistic update
   - `useEnrollWithCode.ts` -- invite code enrollment
   - `useGenerateInviteCode.ts` -- generate invite code
   - `useRemoveStudent.ts` -- remove student mutation

4. Zustand store slice (`apps/web/stores/course.store.ts`)
   - `viewMode`, `searchQuery`, `selectedCategory`, `sortOption`
   - `viewMode` persisted to `localStorage` via `persist` middleware
   - devtools middleware enabled in development (consistent with `auth.store.ts` pattern)

**Technical Approach:**

- All hooks wrap the API client at `apps/web/lib/api.ts` (fetch-based singleton established by SPEC-FE-001)
- Query keys follow the convention: `['courses', params]` for list, `['course', courseId]` for detail
- Optimistic update pattern for enrollment (see `spec.md 4.9`)
- Use `queryClient.invalidateQueries` on all successful mutations
- Import types using the `~` path alias (e.g., `import { api } from '~/lib/api'`)

---

### Secondary Goal -- Course List Page

Implement the course catalog at `/courses` with full search, filter, sort, view toggle, and pagination.

**Deliverables:**

1. `apps/web/app/(dashboard)/courses/page.tsx`
   - Server Component wrapper; passes search params to client components
   - Metadata: `export const metadata = { title: 'Courses | LectureMoa' }`

2. `apps/web/components/course/`
   - `CourseCard.tsx` -- grid and list variant with progress bar
   - `CourseGrid.tsx` -- responsive grid wrapper (2-col mobile, 3-col tablet, 4-col desktop)
   - `CourseList.tsx` -- list layout wrapper
   - `CourseSearchBar.tsx` -- debounced (300ms) search input
   - `CourseFilter.tsx` -- category tabs + sort select, updates URL search params

3. Skeleton loading states for `CourseCard` in both variants

4. Empty state component (with instructor CTA)

**Technical Approach:**

- URL search params are the source of truth for filter/sort state
- `useRouter().push()` and `useSearchParams()` hook manage URL state
- `CourseFilter` changes trigger URL update -> `useCourses` re-fetches via param change
- View mode toggle stored in `course.store.ts` (Zustand) + `localStorage`
- Pagination: shadcn/ui `Pagination` component, page param in URL

**Responsive Layout:**

| Breakpoint | Grid Columns |
|-----------|-------------|
| Mobile (< 768px) | 1 column (list only) or 2-col grid |
| Tablet (768px) | 2-col grid |
| Desktop (1280px+) | 3-col or 4-col grid |

---

### Tertiary Goal -- Course Detail and Enrollment

Implement the course detail page with role-based views and enrollment flows.

**Deliverables:**

1. `apps/web/app/(dashboard)/courses/[courseId]/page.tsx`
   - Server Component with `generateMetadata` for SEO
   - `notFound()` call for inaccessible courses

2. `apps/web/components/course/`
   - `CourseSyllabus.tsx` -- ordered sections with material list
   - `CourseProgressBar.tsx` -- progress indicator with percentage label
   - `CourseEnrollButton.tsx` -- public enroll or invite code form (visibility-aware)
   - `CourseStudentRoster.tsx` -- instructor-only student list with progress
   - `CourseInviteCode.tsx` -- instructor-only invite code display + copy + generate

3. `apps/web/app/(dashboard)/courses/[courseId]/error.tsx` -- Error boundary page

**Technical Approach:**

- Session role from `useSession()` (SPEC-FE-002) drives conditional rendering
- `isOwner` check: `session.user.role === 'instructor' && course.instructor.id === session.user.id`
- Invite code form: React Hook Form + `EnrollWithCodeSchema`, 6-char uppercase input
- Enrollment mutations use optimistic update pattern from `spec.md 4.9`
- Instructor action bar (Edit Settings, Add Material) is a sticky bar on desktop, bottom sheet on mobile

---

### Final Goal -- Course Create and Settings Pages

Implement instructor-only management forms for course creation and settings.

**Deliverables:**

1. `apps/web/app/(dashboard)/courses/create/page.tsx`
   - Redirect to `/courses` if user is not instructor (middleware or server-side redirect)

2. `apps/web/app/(dashboard)/courses/[courseId]/settings/page.tsx`
   - Redirect to `/courses/[courseId]` if user is not the owner instructor

3. `apps/web/components/course/`
   - `CourseCreateForm.tsx` -- React Hook Form + `CreateCourseSchema`
   - `CourseSettingsForm.tsx` -- React Hook Form + `UpdateCourseSchema`, pre-populated

4. Thumbnail upload preview (using `FileReader` API or URL.createObjectURL)

5. Confirmation dialogs:
   - Archive: shadcn `AlertDialog` with warning message
   - Delete: shadcn `AlertDialog` requiring title re-type for destructive confirmation
   - Remove student: shadcn `AlertDialog`

**Technical Approach:**

- Both forms share field definitions; consider extracting a shared `CourseFormFields` component
- `CourseSettingsForm` receives `defaultValues: Course` prop and pre-populates fields
- On successful create -> `router.push('/courses/' + newCourse.id)` + `queryClient.invalidateQueries(['courses'])`
- On successful delete/archive -> `router.push('/courses')` + `queryClient.invalidateQueries(['courses'])`
- Toast notifications via `sonner` (installed as part of SPEC-FE-001)

---

### Optional Goal -- Enhancements

Items that improve quality but are not blocking for core functionality:

- Infinite scroll as an alternative to pagination (opt-in via feature flag)
- Course thumbnail fallback using course initials in a colored placeholder
- Share course link button with clipboard copy
- Deep link support for "enroll and go to first material"

---

## 3. Technical Approach

### Data Flow

```
URL Params (search, category, sort, page)
        |
CourseFilter / CourseSearchBar (URL pushState)
        |
useCourses(params) -> TanStack Query
        |
API: GET /api/v1/courses?...
        |
PaginatedCourseList -> CourseGrid / CourseList -> CourseCard[]
```

### Query Key Convention

```typescript
// List (invalidate all when course is created/updated)
queryKey: ['courses', { page, limit, search, category, sort }]

// Detail (invalidate specific course on update)
queryKey: ['course', courseId]

// Progress (user-specific)
queryKey: ['course-progress', courseId, userId]

// Students (instructor-specific)
queryKey: ['course-students', courseId]
```

### Role-Based Route Protection

For `/courses/create` and `/courses/[courseId]/settings`:

```typescript
// Server component approach (preferred for Next.js App Router)
import { auth } from '~/lib/auth'; // SPEC-FE-002 auth helper
import { redirect } from 'next/navigation';

const session = await auth();
if (session?.user?.role !== 'instructor') {
  redirect('/courses');
}
```

### Error States

| Scenario | Behavior |
|---------|---------|
| Course not found (404) | `notFound()` -> Next.js 404 page |
| API error on list | Error message in place of grid/list |
| API error on mutation | Toast notification, form preserved |
| Unauthorized access | Server-side redirect |
| Unexpected render error | `error.tsx` boundary (500-style UI) |

---

## 4. Architecture Design Direction

### Component Architecture

- **Server Components** for page-level data fetching (course detail, settings pre-population)
- **Client Components** for interactive elements (filter bar, enrollment, forms, view toggle)
- **Colocation**: Each course component lives in `apps/web/components/course/`
- **Shared**: Types and schemas in `packages/shared/`

### Form Architecture

Both `CourseCreateForm` and `CourseSettingsForm` use:
- `react-hook-form` with `zodResolver`
- Field-level error display via shadcn `FormField`, `FormItem`, `FormMessage`
- Submission state tracked via `useCreateCourse.isPending` / `useUpdateCourse.isPending`

### State Architecture

| State Type | Location |
|-----------|---------|
| Server data (courses, progress) | TanStack Query cache |
| UI preferences (view mode) | Zustand (`course.store.ts`) + localStorage |
| URL-driven filters (search, category, sort, page) | URL search params |
| Form state | React Hook Form (local) |
| Auth session | Next-auth session (SPEC-FE-002) |

### File Path Summary

All files created or modified by this SPEC:

**packages/shared/src/**

| File Path | Type | Description |
|-----------|------|-------------|
| `types/course.types.ts` | NEW | Course domain TypeScript interfaces |
| `validators/course.schema.ts` | UPDATED | Course Zod validation schemas (existing skeleton) |

**apps/web/**

| File Path | Type | Description |
|-----------|------|-------------|
| `app/(dashboard)/courses/page.tsx` | NEW | Course list page |
| `app/(dashboard)/courses/create/page.tsx` | NEW | Course create page |
| `app/(dashboard)/courses/[courseId]/page.tsx` | NEW | Course detail page |
| `app/(dashboard)/courses/[courseId]/error.tsx` | NEW | Course detail error boundary |
| `app/(dashboard)/courses/[courseId]/settings/page.tsx` | NEW | Course settings page |
| `components/course/CourseCard.tsx` | NEW | Grid/list course card |
| `components/course/CourseGrid.tsx` | NEW | Grid layout wrapper |
| `components/course/CourseList.tsx` | NEW | List layout wrapper |
| `components/course/CourseFilter.tsx` | NEW | Category/sort filter bar |
| `components/course/CourseSearchBar.tsx` | NEW | Debounced search input |
| `components/course/CourseSyllabus.tsx` | NEW | Syllabus/outline section |
| `components/course/CourseProgressBar.tsx` | NEW | Progress indicator |
| `components/course/CourseEnrollButton.tsx` | NEW | Enroll / invite code CTA |
| `components/course/CourseStudentRoster.tsx` | NEW | Student list (instructor) |
| `components/course/CourseInviteCode.tsx` | NEW | Invite code display/copy |
| `components/course/CourseCreateForm.tsx` | NEW | Course creation form |
| `components/course/CourseSettingsForm.tsx` | NEW | Course settings form |
| `hooks/useCourses.ts` | NEW | Paginated course list query |
| `hooks/useCourse.ts` | NEW | Single course detail query |
| `hooks/useCourseProgress.ts` | NEW | Student progress query |
| `hooks/useCourseStudents.ts` | NEW | Student roster query |
| `hooks/useCreateCourse.ts` | NEW | Create course mutation |
| `hooks/useUpdateCourse.ts` | NEW | Update course mutation |
| `hooks/useArchiveCourse.ts` | NEW | Archive course mutation |
| `hooks/useDeleteCourse.ts` | NEW | Delete course mutation |
| `hooks/useEnrollCourse.ts` | NEW | Public enrollment mutation |
| `hooks/useEnrollWithCode.ts` | NEW | Invite code enrollment |
| `hooks/useGenerateInviteCode.ts` | NEW | Generate invite code mutation |
| `hooks/useRemoveStudent.ts` | NEW | Remove student mutation |
| `stores/course.store.ts` | NEW | Course UI state (Zustand) |

---

## 5. Risks and Mitigations

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| API contract differs from spec | Medium | Align with backend team before hook implementation; use typed API client |
| Role check bypassed client-side | Low | Server-side redirect in page components; backend enforces authorization |
| Stale course data after mutation | Low | `queryClient.invalidateQueries` on all mutations |
| Thumbnail upload size/format | Medium | Client-side file size validation (< 5MB, jpg/png/webp); server validates too |
| Invite code race condition | Low | Server generates unique codes; client only displays |
| WCAG violations | Medium | Use shadcn/ui ARIA-compliant primitives; audit with axe after implementation |

---

## 6. Definition of Done

- All 45 requirements (REQ-FE-400 through REQ-FE-445) are implemented
- Vitest unit tests pass for all hooks and form validation logic
- No TypeScript compilation errors (`tsc --noEmit`)
- ESLint passes with zero errors
- All four course pages render correctly on Mobile (375px), Tablet (768px), Desktop (1280px+)
- Role-based rendering verified for both `instructor` and `student` roles
- Keyboard navigation and ARIA labels verified for all interactive elements
- TanStack Query cache invalidation confirmed for all mutations
- Optimistic update rollback tested for enrollment failure scenario
- All file paths follow established conventions (no `src/` prefix, `(dashboard)` route group, `*.store.ts` naming)
