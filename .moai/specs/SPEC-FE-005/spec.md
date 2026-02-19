---
id: SPEC-FE-005
title: "Course Management"
version: 2.0.0
status: completed
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: high
tags: [frontend, nextjs, course, management, enrollment, role-based, progress]
related_specs: [SPEC-FE-001, SPEC-FE-002, SPEC-FE-003, SPEC-FE-004, SPEC-UI-001]
---

## HISTORY

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 2.0.0 | 2026-02-19 | MoAI | SPEC 전면 재작성: 경로를 실제 코드베이스 컨벤션에 맞게 수정 (src/ 제거, (main) -> (dashboard)), store 네이밍을 *.store.ts 패턴으로 통일, API 클라이언트 참조 수정, FE-001/FE-002 구현 결과 반영 |
| 1.0.0 | 2026-02-19 | MoAI | 초기 SPEC 작성 |

---

# SPEC-FE-005: Course Management

## 1. Environment

### 1.1 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| CSS Framework | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (Radix UI) | latest |
| State Management | Zustand | 5.x |
| Data Fetching | TanStack Query | v5 |
| Form Handling | React Hook Form + Zod | latest |
| Authentication | next-auth (Auth.js) | v5 |
| Icons | Lucide React | latest |
| Testing | Vitest + React Testing Library | latest |

### 1.2 Monorepo Scope

```
lecture-moa/
  apps/
    web/
      app/
        (dashboard)/
          courses/
            page.tsx                        # Course list page
            create/
              page.tsx                      # Course create page (instructor)
            [courseId]/
              page.tsx                      # Course detail page
              settings/
                page.tsx                    # Course settings (instructor)
              error.tsx                     # Course detail error boundary
      components/
        course/
          CourseCard.tsx                    # Grid/list course card
          CourseGrid.tsx                    # Grid layout for courses
          CourseList.tsx                    # List layout for courses
          CourseFilter.tsx                  # Category/sort filter bar
          CourseSearchBar.tsx               # Search input
          CourseSyllabus.tsx                # Syllabus/outline section
          CourseProgressBar.tsx             # Progress indicator
          CourseEnrollButton.tsx            # Enroll / join via code CTA
          CourseStudentRoster.tsx           # Student list (instructor view)
          CourseInviteCode.tsx              # Invite code display & copy
          CourseCreateForm.tsx              # Course creation form
          CourseSettingsForm.tsx            # Course settings form
      hooks/
        useCourses.ts                       # Course list query hook
        useCourse.ts                        # Single course query hook
        useCourseProgress.ts               # Progress query hook
        useCourseEnrollment.ts             # Enrollment mutation hook
        useCourseInviteCode.ts             # Invite code hooks
        useCourseStudents.ts               # Student roster hook (instructor)
        useCreateCourse.ts                 # Course creation mutation
        useUpdateCourse.ts                 # Course update mutation
        useArchiveCourse.ts                # Archive mutation
        useDeleteCourse.ts                 # Delete mutation
        useRemoveStudent.ts                # Remove student mutation
      stores/
        course.store.ts                    # Zustand course UI state
  packages/
    shared/
      src/
        types/
          course.types.ts                   # Course domain types
        validators/
          course.schema.ts                  # Course Zod schemas
```

### 1.3 Responsive Breakpoints

- **Mobile**: 375px, 4-column grid
- **Tablet**: 768px, 8-column grid
- **Desktop**: 1280px+, 12-column grid

### 1.4 Design References

Design specifications are defined in the following `.pen` files (SPEC-UI-001):

| Screen | File Path |
|--------|-----------|
| Course List | `design/screens/course/course-list.pen` |
| Course Detail | `design/screens/course/course-detail.pen` |
| Course Create | `design/screens/course/course-create.pen` |
| Course Settings | `design/screens/course/course-settings.pen` |

### 1.5 Foundation Dependency

This SPEC builds on top of SPEC-FE-001 (Next.js Frontend Foundation) which provides:

- Design tokens, layout system, and sidebar navigation
- shadcn/ui component library configured
- Zustand store patterns and providers (`apps/web/stores/*.store.ts`)
- TanStack Query client and API client (`apps/web/lib/api.ts`)
- Shared type infrastructure (`packages/shared/src/types/`)
- Auth session context and middleware (from SPEC-FE-002)

---

## 2. Assumptions

### 2.1 API Contract

- The Fastify backend (`apps/api`) exposes RESTful endpoints under `/api/v1/courses`
- Endpoints follow the convention established by SPEC-FE-001's API client (`apps/web/lib/api.ts`, fetch-based singleton)
- Pagination uses `page` / `limit` query parameters with `{ data, total, page, limit }` response shape
- Authentication token is injected automatically by the API client (SPEC-FE-002, REQ-FE-108)

### 2.2 Role System

- UserRole is a union type: `"student" | "instructor" | "admin"` (defined in `packages/shared/src/types/auth.types.ts`)
- This SPEC uses only `"instructor"` and `"student"` roles; `"admin"` is out of scope
- Role information is available via the auth session (`useSession()` from SPEC-FE-002) and Zustand auth store (`apps/web/stores/auth.store.ts`)
- Instructors can create, edit, archive, and delete courses they own
- Students can view public courses, enroll, and track their own progress
- Role-based UI rendering is client-side gating only; server enforces authorization

### 2.3 Course States

- Courses have a `status` field: `draft` | `published` | `archived`
- Students can only enroll in `published` courses
- `draft` and `archived` courses are only visible to their instructor owner

### 2.4 Enrollment Mechanism

- **Public enrollment**: Any authenticated user can enroll in a `visibility: public` course
- **Invite code enrollment**: User must submit a valid invite code (6-character alphanumeric) to enroll in `visibility: invite_only` courses
- Each course can have at most one active invite code at a time

### 2.5 Progress Tracking

- Progress is computed server-side as `(completedMaterials / totalMaterials) * 100`
- The frontend displays progress but does not compute it locally
- Instructor dashboard shows per-student and class-average progress

### 2.6 Material Relationship

- Materials (SPEC-FE-004 domain) are displayed within the course detail page as a read-only list
- CRUD operations on materials belong to SPEC-FE-004; this SPEC only renders the material list

### 2.7 Route Group

- Course pages reside under the `(dashboard)` route group, which applies the dashboard layout with sidebar navigation (SPEC-FE-001, REQ-FE-006)
- The `(dashboard)` layout is defined at `apps/web/app/(dashboard)/layout.tsx`
- Route protection for `/courses` prefix is handled by Next.js middleware (SPEC-FE-002, REQ-FE-106)

---

## 3. Requirements

### 3.1 Course List Page

#### REQ-FE-400: Course List Display

The system shall render a course catalog page at `/courses` that displays available courses to authenticated users.

#### REQ-FE-401: Grid and List View Toggle

**WHEN** the user clicks the view toggle control, **THEN** the system shall switch between grid and list layout without page reload, persisting the preference in Zustand store (`apps/web/stores/course.store.ts`).

#### REQ-FE-402: Course Search

**WHEN** the user types in the search input, **THEN** the system shall debounce the input by 300ms and filter the course list by matching the query against course title and description via API call.

#### REQ-FE-403: Category Filter

**WHEN** the user selects a category from the filter bar, **THEN** the system shall request the filtered course list from the API and update the course grid/list.

#### REQ-FE-404: Sort Options

**WHEN** the user selects a sort option (recent, popular, alphabetical), **THEN** the system shall re-fetch the course list with the selected sort parameter and re-render.

#### REQ-FE-405: Pagination

**WHEN** the user navigates to a different page via the pagination control, **THEN** the system shall load the corresponding page of courses and scroll to the top of the course list.

#### REQ-FE-406: Empty State

**IF** the API returns an empty course list, **THEN** the system shall display an empty state illustration with an appropriate message and, for instructors, a call-to-action button to create a course.

#### REQ-FE-407: Loading Skeleton

**WHILE** a course list query is in-flight, **THEN** the system shall display skeleton cards matching the current layout (grid or list) to prevent layout shift.

#### REQ-FE-408: Role-based Create Button

**IF** the authenticated user has the `instructor` role, **THEN** the system shall display a "Create Course" button in the course list page header.

### 3.2 Course Detail Page

#### REQ-FE-410: Course Detail Display

The system shall render a course detail page at `/courses/[courseId]` that shows course metadata (title, description, thumbnail, category, instructor name, creation date).

#### REQ-FE-411: Syllabus/Outline Section

The system shall render the course syllabus as an ordered list of sections and their associated material titles.

#### REQ-FE-412: Material List in Course Context

The system shall display the list of materials belonging to the course with title, type indicator, and completion status (for enrolled students).

#### REQ-FE-413: Student Enrollment Status

**WHEN** an authenticated `student` user views a course detail page, **THEN** the system shall display their enrollment status (enrolled / not enrolled) and current progress percentage if enrolled.

#### REQ-FE-414: Enroll Button (Public)

**IF** the course `visibility` is `public` and the student is not enrolled, **THEN** the system shall display an "Enroll" button that calls the enrollment API and updates the UI optimistically.

#### REQ-FE-415: Join via Invite Code

**IF** the course `visibility` is `invite_only` and the student is not enrolled, **THEN** the system shall display an invite code input form; **WHEN** the user submits a valid 6-character code, **THEN** the system shall enroll the student and redirect to the course content.

#### REQ-FE-416: Student Roster (Instructor View)

**IF** the authenticated user is the course instructor, **THEN** the system shall display a student roster section showing enrolled student names and individual progress percentages.

#### REQ-FE-417: Instructor Quick Actions

**IF** the authenticated user is the course instructor, **THEN** the system shall display action buttons to navigate to Course Settings and Add Material.

#### REQ-FE-418: Not Found Handling

**IF** the `courseId` does not match any course or the course is not accessible to the current user, **THEN** the system shall render the 404 error page.

### 3.3 Course Create Page

#### REQ-FE-420: Create Page Access Control

**IF** the authenticated user does not have the `instructor` role, **THEN** the system shall redirect them away from `/courses/create` to `/courses`.

#### REQ-FE-421: Course Creation Form

The system shall render a form at `/courses/create` with the following fields: title (required), description (required), category (required, select), thumbnail (optional, image upload), visibility (required, radio: public / invite_only).

#### REQ-FE-422: Form Validation

**WHEN** the user submits the creation form, **THEN** the system shall validate all required fields using Zod schema before making an API call; **IF** validation fails, **THEN** display inline error messages per field.

#### REQ-FE-423: Thumbnail Upload Preview

**WHEN** the user selects a thumbnail image file, **THEN** the system shall display a live preview of the image before submission.

#### REQ-FE-424: Successful Creation Redirect

**WHEN** the course creation API call succeeds, **THEN** the system shall redirect the user to the newly created course's detail page (`/courses/[newCourseId]`) and invalidate the course list query cache.

#### REQ-FE-425: Creation Error Handling

**IF** the course creation API call fails, **THEN** the system shall display a toast notification with the error message and keep the form populated with the user's input.

### 3.4 Course Settings Page

#### REQ-FE-430: Settings Page Access Control

**IF** the authenticated user is not the owner instructor of the course, **THEN** the system shall redirect them away from `/courses/[courseId]/settings` to `/courses/[courseId]`.

#### REQ-FE-431: Edit Course Information

The system shall render an editable form in the settings page pre-populated with existing course data (title, description, category, thumbnail, visibility).

#### REQ-FE-432: Save Settings

**WHEN** the user submits the settings form, **THEN** the system shall validate and send a PATCH request; **WHEN** the update succeeds, **THEN** invalidate the course detail query and display a success toast.

#### REQ-FE-433: Invite Code Management

**IF** the course `visibility` is `invite_only`, **THEN** the system shall display the current invite code (if one exists) with a copy button, and provide a "Generate New Code" button.

#### REQ-FE-434: Generate New Invite Code

**WHEN** the instructor clicks "Generate New Code", **THEN** the system shall call the invite code generation API, display the new code, and replace the old code.

#### REQ-FE-435: Remove Student

**WHEN** the instructor clicks "Remove" next to a student in the enrollment management section, **THEN** the system shall display a confirmation dialog; **WHEN** confirmed, remove the student via API and update the roster.

#### REQ-FE-436: Archive Course

**WHEN** the instructor clicks "Archive Course", **THEN** the system shall display a confirmation dialog; **WHEN** confirmed, call the archive API, redirect to `/courses`, and invalidate the course list cache.

#### REQ-FE-437: Delete Course

**WHEN** the instructor clicks "Delete Course", **THEN** the system shall display a destructive confirmation dialog requiring the instructor to type the course title; **WHEN** confirmed, delete the course, redirect to `/courses`, and invalidate the course list cache.

### 3.5 Shared & Cross-Cutting Requirements

#### REQ-FE-440: Optimistic Updates

**WHEN** the user performs an enrollment or progress action, **THEN** the system shall apply an optimistic UI update immediately and roll back if the API call fails.

#### REQ-FE-441: Error Boundary

The system shall wrap each course page in a React Error Boundary that displays the `design/screens/common/500.pen`-aligned error UI when an unexpected rendering error occurs.

#### REQ-FE-442: Accessibility

The system shall ensure all interactive course elements are keyboard-navigable and include appropriate ARIA labels, meeting WCAG 2.1 AA standards.

#### REQ-FE-443: Course Progress Display

**WHILE** the student is enrolled in a course, **THEN** the system shall display a progress bar showing completion percentage on both the course list card and the course detail page.

#### REQ-FE-444: Type Safety

The system shall define and use TypeScript interfaces for all course domain entities in `packages/shared/src/types/course.types.ts`, and all API response shapes shall be typed.

#### REQ-FE-445: Zod Schema Enrichment

The system shall define Zod validation schemas in `packages/shared/src/validators/course.schema.ts` covering course creation, course update, invite code, and enrollment payloads.

---

## 4. Specifications

### 4.1 Course Domain Types (`packages/shared/src/types/course.types.ts`)

```typescript
// Course visibility
export type CourseVisibility = 'public' | 'invite_only';

// Course status
export type CourseStatus = 'draft' | 'published' | 'archived';

// Category (extend as needed)
export type CourseCategory =
  | 'programming'
  | 'design'
  | 'business'
  | 'science'
  | 'language'
  | 'other';

// Sort option for course list
export type CourseSortOption = 'recent' | 'popular' | 'alphabetical';

// Minimal instructor info embedded in course
export interface CourseInstructor {
  id: string;
  name: string;
  avatarUrl?: string;
}

// Material summary embedded in course
export interface CourseMaterialSummary {
  id: string;
  title: string;
  type: 'markdown' | 'video' | 'quiz';
  order: number;
}

// Syllabus section
export interface CourseSyllabusSection {
  id: string;
  title: string;
  order: number;
  materials: CourseMaterialSummary[];
}

// Course list item (lightweight)
export interface CourseListItem {
  id: string;
  title: string;
  description: string;
  category: CourseCategory;
  status: CourseStatus;
  visibility: CourseVisibility;
  thumbnailUrl?: string;
  instructor: CourseInstructor;
  enrolledCount: number;
  materialCount: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// Full course detail
export interface Course extends CourseListItem {
  syllabus: CourseSyllabusSection[];
  inviteCode?: string; // Only included for course owner
}

// Enrollment record
export interface CourseEnrollment {
  courseId: string;
  userId: string;
  enrolledAt: string;
  progressPercent: number; // 0-100
  completedMaterialIds: string[];
}

// Student progress (instructor view)
export interface StudentProgress {
  userId: string;
  name: string;
  avatarUrl?: string;
  enrolledAt: string;
  progressPercent: number;
}

// Course list query params
export interface CourseListParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: CourseCategory;
  sort?: CourseSortOption;
  status?: CourseStatus;
}

// Paginated course list response
export interface PaginatedCourseList {
  data: CourseListItem[];
  total: number;
  page: number;
  limit: number;
}

// Course create payload
export interface CreateCoursePayload {
  title: string;
  description: string;
  category: CourseCategory;
  thumbnailUrl?: string;
  visibility: CourseVisibility;
}

// Course update payload (partial)
export interface UpdateCoursePayload {
  title?: string;
  description?: string;
  category?: CourseCategory;
  thumbnailUrl?: string;
  visibility?: CourseVisibility;
  status?: CourseStatus;
}

// Invite code response
export interface InviteCodeResponse {
  code: string;
  expiresAt?: string;
}

// Enroll via invite code payload
export interface EnrollWithCodePayload {
  code: string;
}
```

### 4.2 Zod Schemas (`packages/shared/src/validators/course.schema.ts`)

```typescript
import { z } from 'zod';

export const CourseCategorySchema = z.enum([
  'programming', 'design', 'business', 'science', 'language', 'other',
]);

export const CourseVisibilitySchema = z.enum(['public', 'invite_only']);

export const CourseSortOptionSchema = z.enum(['recent', 'popular', 'alphabetical']);

export const CreateCourseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: CourseCategorySchema,
  thumbnailUrl: z.string().url().optional().or(z.literal('')),
  visibility: CourseVisibilitySchema,
});

export const UpdateCourseSchema = CreateCourseSchema.partial().extend({
  status: z.enum(['draft', 'published', 'archived']).optional(),
});

export const EnrollWithCodeSchema = z.object({
  code: z.string().length(6, 'Invite code must be exactly 6 characters').toUpperCase(),
});

export const CourseListParamsSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  search: z.string().optional(),
  category: CourseCategorySchema.optional(),
  sort: CourseSortOptionSchema.optional(),
});

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>;
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>;
export type EnrollWithCodeInput = z.infer<typeof EnrollWithCodeSchema>;
export type CourseListParamsInput = z.infer<typeof CourseListParamsSchema>;
```

### 4.3 API Endpoints (to be consumed)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/v1/courses` | Required | List/search/filter courses |
| POST | `/api/v1/courses` | Instructor | Create a new course |
| GET | `/api/v1/courses/:id` | Required | Get course detail |
| PATCH | `/api/v1/courses/:id` | Instructor (owner) | Update course |
| DELETE | `/api/v1/courses/:id` | Instructor (owner) | Delete course |
| POST | `/api/v1/courses/:id/archive` | Instructor (owner) | Archive course |
| GET | `/api/v1/courses/:id/students` | Instructor (owner) | List enrolled students |
| DELETE | `/api/v1/courses/:id/students/:userId` | Instructor (owner) | Remove student |
| POST | `/api/v1/courses/:id/enroll` | Student | Public enrollment |
| POST | `/api/v1/courses/:id/enroll/code` | Student | Enroll via invite code |
| DELETE | `/api/v1/courses/:id/enroll` | Student | Unenroll |
| GET | `/api/v1/courses/:id/progress` | Student | Get own progress |
| POST | `/api/v1/courses/:id/invite-code` | Instructor (owner) | Generate new invite code |

### 4.4 Route Structure (`apps/web/app`)

```
app/
  (dashboard)/
    courses/
      page.tsx            # REQ-FE-400 ~ REQ-FE-408 (Course List)
      create/
        page.tsx          # REQ-FE-420 ~ REQ-FE-425 (Course Create)
      [courseId]/
        page.tsx          # REQ-FE-410 ~ REQ-FE-418 (Course Detail)
        error.tsx         # REQ-FE-441 (Error Boundary)
        settings/
          page.tsx        # REQ-FE-430 ~ REQ-FE-437 (Course Settings)
```

### 4.5 Zustand Store (`apps/web/stores/course.store.ts`)

```typescript
// UI state only -- server state lives in TanStack Query
interface CourseUIState {
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  // Filter/sort state (synced to URL params as source of truth for shareability)
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedCategory: CourseCategory | null;
  setSelectedCategory: (cat: CourseCategory | null) => void;
  sortOption: CourseSortOption;
  setSortOption: (opt: CourseSortOption) => void;
}
```

**Note**: URL search params are the primary source of truth for filter/sort state to enable deep linking. The Zustand store mirrors these values for component convenience and persists `viewMode` to `localStorage`.

### 4.6 TanStack Query Hook Signatures

```typescript
// hooks/useCourses.ts
function useCourses(params: CourseListParams): UseQueryResult<PaginatedCourseList>

// hooks/useCourse.ts
function useCourse(courseId: string): UseQueryResult<Course>

// hooks/useCourseProgress.ts
function useCourseProgress(courseId: string): UseQueryResult<CourseEnrollment>

// hooks/useCourseStudents.ts (instructor)
function useCourseStudents(courseId: string): UseQueryResult<StudentProgress[]>

// Mutations
function useEnrollCourse(): UseMutationResult<void, Error, { courseId: string }>
function useEnrollWithCode(): UseMutationResult<void, Error, { courseId: string; code: string }>
function useCreateCourse(): UseMutationResult<Course, Error, CreateCoursePayload>
function useUpdateCourse(): UseMutationResult<Course, Error, { courseId: string } & UpdateCoursePayload>
function useArchiveCourse(): UseMutationResult<void, Error, { courseId: string }>
function useDeleteCourse(): UseMutationResult<void, Error, { courseId: string }>
function useGenerateInviteCode(): UseMutationResult<InviteCodeResponse, Error, { courseId: string }>
function useRemoveStudent(): UseMutationResult<void, Error, { courseId: string; userId: string }>
```

### 4.7 Component Breakdown

#### CourseCard (used in Grid and List views)

| Prop | Type | Description |
|------|------|-------------|
| course | CourseListItem | Course data |
| variant | 'grid' \| 'list' | Layout variant |
| showProgress | boolean | Show progress bar (enrolled student) |
| progressPercent | number? | Progress value 0-100 |

- Renders thumbnail (with fallback placeholder), title, instructor name, category badge, enrolled count, material count
- Progress bar visible when `showProgress=true`
- Links to `/courses/[course.id]`

#### CourseFilter

- Category filter tabs (All + category enum values)
- Sort select dropdown
- All filter changes update URL params (pushState) and invalidate query

#### CourseCreateForm / CourseSettingsForm

- Uses React Hook Form + Zod resolver
- `CourseCreateForm` starts with empty defaults
- `CourseSettingsForm` receives a `defaultValues: Course` prop

#### CourseInviteCode

- Displays code in a monospace badge
- Copy button uses `navigator.clipboard.writeText`
- "Generate New Code" button triggers `useGenerateInviteCode` mutation

### 4.8 Role-Based Rendering Pattern

```tsx
// Pattern used consistently throughout course pages
const { data: session } = useSession(); // from SPEC-FE-002
const isInstructor = session?.user?.role === 'instructor';
const isOwner = isInstructor && course.instructor.id === session?.user?.id;

// Render gating
{isOwner && <CourseStudentRoster courseId={course.id} />}
{!isEnrolled && course.visibility === 'public' && <EnrollButton />}
{!isEnrolled && course.visibility === 'invite_only' && <InviteCodeForm />}
```

### 4.9 Optimistic Update Pattern (Enrollment)

```typescript
// useEnrollCourse mutation with optimistic update
const queryClient = useQueryClient();

mutationFn: (courseId) => api.post(`/courses/${courseId}/enroll`),
onMutate: async (courseId) => {
  await queryClient.cancelQueries({ queryKey: ['course', courseId] });
  const previous = queryClient.getQueryData<Course>(['course', courseId]);
  queryClient.setQueryData(['course', courseId], (old) => ({
    ...old,
    enrolledCount: (old?.enrolledCount ?? 0) + 1,
  }));
  return { previous };
},
onError: (_, courseId, context) => {
  queryClient.setQueryData(['course', courseId], context?.previous);
  toast.error('Enrollment failed. Please try again.');
},
onSettled: (_, __, courseId) => {
  queryClient.invalidateQueries({ queryKey: ['course', courseId] });
},
```

---

## 5. Traceability Matrix

| Requirement | Design File | Component(s) | Hook(s) | Store Slice |
|-------------|-------------|--------------|---------|-------------|
| REQ-FE-400 | course-list.pen | `CourseGrid`, `CourseList` | `useCourses` | `course.store` |
| REQ-FE-401 | course-list.pen | `CourseGrid`, `CourseList` | -- | `viewMode` |
| REQ-FE-402 | course-list.pen | `CourseSearchBar` | `useCourses` | `searchQuery` |
| REQ-FE-403 | course-list.pen | `CourseFilter` | `useCourses` | `selectedCategory` |
| REQ-FE-404 | course-list.pen | `CourseFilter` | `useCourses` | `sortOption` |
| REQ-FE-405 | course-list.pen | `Pagination` (shadcn) | `useCourses` | -- |
| REQ-FE-406 | course-list.pen | `EmptyState` | `useCourses` | -- |
| REQ-FE-407 | course-list.pen | `CourseCard` (skeleton) | `useCourses` | -- |
| REQ-FE-408 | course-list.pen | Page header | -- | -- |
| REQ-FE-410 | course-detail.pen | Course detail page | `useCourse` | -- |
| REQ-FE-411 | course-detail.pen | `CourseSyllabus` | `useCourse` | -- |
| REQ-FE-412 | course-detail.pen | Material list (read-only) | `useCourse` | -- |
| REQ-FE-413 | course-detail.pen | `CourseProgressBar` | `useCourseProgress` | -- |
| REQ-FE-414 | course-detail.pen | `CourseEnrollButton` | `useEnrollCourse` | -- |
| REQ-FE-415 | course-detail.pen | `CourseEnrollButton` (code form) | `useEnrollWithCode` | -- |
| REQ-FE-416 | course-detail.pen | `CourseStudentRoster` | `useCourseStudents` | -- |
| REQ-FE-417 | course-detail.pen | Instructor action bar | -- | -- |
| REQ-FE-418 | common/404.pen | `notFound()` (Next.js) | -- | -- |
| REQ-FE-420 | course-create.pen | Create page | -- | -- |
| REQ-FE-421 | course-create.pen | `CourseCreateForm` | `useCreateCourse` | -- |
| REQ-FE-422 | course-create.pen | `CourseCreateForm` | -- | -- |
| REQ-FE-423 | course-create.pen | Thumbnail preview | -- | -- |
| REQ-FE-424 | course-create.pen | `CourseCreateForm` | `useCreateCourse` | -- |
| REQ-FE-425 | course-create.pen | Toast notification | `useCreateCourse` | -- |
| REQ-FE-430 | course-settings.pen | Settings page | -- | -- |
| REQ-FE-431 | course-settings.pen | `CourseSettingsForm` | `useCourse` | -- |
| REQ-FE-432 | course-settings.pen | `CourseSettingsForm` | `useUpdateCourse` | -- |
| REQ-FE-433 | course-settings.pen | `CourseInviteCode` | `useCourse` | -- |
| REQ-FE-434 | course-settings.pen | `CourseInviteCode` | `useGenerateInviteCode` | -- |
| REQ-FE-435 | course-settings.pen | `CourseStudentRoster` | `useRemoveStudent` | -- |
| REQ-FE-436 | course-settings.pen | Archive action | `useArchiveCourse` | -- |
| REQ-FE-437 | course-settings.pen | Delete action | `useDeleteCourse` | -- |
| REQ-FE-440 | -- | All mutation hooks | All enrollment mutations | -- |
| REQ-FE-441 | common/500.pen | `error.tsx` files | -- | -- |
| REQ-FE-442 | -- | All interactive components | -- | -- |
| REQ-FE-443 | course-list/detail.pen | `CourseProgressBar` | `useCourseProgress` | -- |
| REQ-FE-444 | -- | `course.types.ts` | -- | -- |
| REQ-FE-445 | -- | `course.schema.ts` | -- | -- |
