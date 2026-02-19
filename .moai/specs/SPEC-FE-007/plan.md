---
id: SPEC-FE-007
title: "Quiz System - Implementation Plan"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-007: Quiz System -- Implementation Plan

## 1. Implementation Strategy

### 1.1 Development Approach

This SPEC follows the Hybrid methodology:

- **New files**: TDD (RED -> GREEN -> REFACTOR)
- **Extended files** (`quiz.types.ts`, `events.ts`, `api-endpoints.ts`): DDD (ANALYZE -> PRESERVE -> IMPROVE)

The Quiz System is a major product feature spanning both student and instructor flows. Implementation priority reflects the student quiz-taking flow as the highest-value user path.

### 1.2 Technical Approach

**Dependency Order**: The Quiz System has no inline integration dependency on existing pages (unlike SPEC-FE-006 Q&A). All quiz routes and components are new. However, it depends on the auth system (SPEC-FE-002), course context (SPEC-FE-005), and material hooks (SPEC-FE-004) for runtime data.

**State Architecture**:

- Server state (quiz lists, details, results, submissions): TanStack Query
- Client quiz session state (current question, draft answers, timer): Zustand `quiz-taking.store`
- URL-based filter state: Next.js `useSearchParams` (no Zustand needed)

**Timer Strategy**:

- Display-only client-side countdown; server maintains the authoritative timer
- `useQuizTimer` hook (in `hooks/quiz/`) owns the `setInterval` lifecycle
- Timer state (remaining seconds, status) lives in Zustand store
- On reconnect after disconnection, server's remaining time is fetched and local timer is corrected
- Timer is NOT exposed in localStorage or sessionStorage (prevents manipulation)

**Auto-Save Strategy (REUSE EXISTING)**:

Auto-save leverages existing hooks from SPEC-FE-001:

- `useDebounce` from `hooks/useDebounce.ts` for 3-second debounced save triggers
- `useBeforeUnload` from `hooks/useBeforeUnload.ts` for forced save on page leave
- New `useQuizAutoSave` hook in `hooks/quiz/` orchestrates the debounce + forced-save pattern
- Failed saves retry after 5 seconds with toast notification

**Drag-and-Drop Strategy**:

- `@dnd-kit/core` and `@dnd-kit/sortable` for question list reordering
- Chosen over `react-beautiful-dnd` (unmaintained) and HTML5 native DnD (poor mobile support)
- Sort order committed to backend on blur/save, not on every drag event
- `@dnd-kit/accessibility` keyboard sensor for WCAG compliance

**AI Generation Strategy**:

- Two-step UX: Configure (material + parameters) -> Review (edit + accept)
- Generated questions held in component state with `tempId` until accepted
- 60-second client-side timeout with retry button
- On acceptance, questions appended to quiz via standard question creation API

### 1.3 Existing Assets (DO NOT RECREATE)

The following files already exist and must only be reused or integrated with, not recreated:

| File | Status | Action |
|------|--------|--------|
| `apps/web/hooks/useBeforeUnload.ts` | Complete | Reuse for quiz navigation guard (forced save on page leave) |
| `apps/web/hooks/useDebounce.ts` | Complete | Reuse for auto-save debouncing (3s delay) |
| `apps/web/hooks/useMediaQuery.ts` | Complete | Reuse for responsive variant detection (mobile Sheet vs desktop sidebar) |
| `apps/web/hooks/useScrollPosition.ts` | Complete | Available if needed for scroll-based interactions |
| `apps/web/lib/api.ts` | Complete | Use as base API client for all quiz API calls |
| `apps/web/lib/api-endpoints.ts` | Complete | Dashboard quiz endpoints already defined (quizResults, upcomingQuizzes, quizPerformance) |
| `apps/web/stores/auth.store.ts` | Complete | Read `user` and `role` for role-based UI |
| `packages/shared/src/types/api.types.ts` | Complete | Use `ApiResponse<T>`, `PaginatedResponse<T>`, `Pagination`, `PaginationParams` |
| `packages/shared/src/constants/events.ts` | Complete | Existing `EVENTS.QUIZ_STARTED`, `QUIZ_SUBMITTED`, `QUIZ_GRADED` (no new events needed) |
| `apps/web/components/markdown/MarkdownRenderer.tsx` | Complete | Reuse for lightweight Markdown in question text |

---

## 2. Implementation Milestones

### Primary Goal -- Foundation: Types, Schemas, Store, Hooks

Covers: REQ-FE-600 through REQ-FE-601, REQ-FE-611

**Tasks**:

1. Create `packages/shared/src/types/quiz.types.ts` with all quiz domain types (discriminated unions for Question and DraftAnswer)
2. Create `packages/shared/src/validators/quiz.schema.ts` with `CreateQuizSchema`, `QuestionSchema`, `MultipleChoiceOptionSchema`, `GenerationOptionsSchema`, `DraftAnswerSchema`
3. Create `apps/web/lib/api/quiz.api.ts` with all typed API client functions using `/api/v1/quiz/` prefix
4. Create `apps/web/stores/quiz-taking.store.ts` with Zustand (quiz session state, answers map, timer, focus loss)
5. Implement all TanStack Query hooks in `apps/web/hooks/quiz/`:
   - `useQuizList.ts` -- student quiz list with cursor-based pagination
   - `useQuizDetail.ts` -- quiz detail fetch
   - `useQuizResult.ts` -- quiz result fetch
   - `useInstructorQuizzes.ts` -- instructor quiz list
   - `useQuizMutations.ts` -- create/update/delete/publish/close/duplicate mutations
   - `useSubmissions.ts` -- instructor submissions list
   - `useAIGeneration.ts` -- AI generation mutation with 60s timeout
6. Create `apps/web/hooks/quiz/useQuizTimer.ts` managing `setInterval` -> store `tickTimer()`
7. Create `apps/web/hooks/quiz/useQuizAnswers.ts` for answer state management
8. Create `apps/web/hooks/quiz/useQuizAutoSave.ts` orchestrating `useDebounce` (EXISTING) + `useBeforeUnload` (EXISTING)
9. Create `apps/web/hooks/quiz/useQuizSubmission.ts` for submission orchestration
10. Create `apps/web/hooks/quiz/useFocusDetection.ts` for anti-cheat focus loss detection
11. Write unit tests for all Zod schemas (valid/invalid cases) and store actions

**Quality gate**: TypeScript compilation passes with zero errors, unit tests for store actions pass, hook types match API contracts, Zod schemas correctly validate/reject boundary cases

---

### Primary Goal -- Student Quiz List Page

Covers: REQ-FE-602 through REQ-FE-607

**Tasks**:

1. Create `app/(dashboard)/quizzes/page.tsx` (Server Component with prefetch)
2. Implement `components/quiz/quiz-card.tsx` with role-based display (student vs instructor actions)
3. Implement `components/quiz/quiz-list.tsx` with `useInfiniteQuery` cursor-based pagination
4. Implement `components/quiz/quiz-filters.tsx` with URL search params (status, courseId)
5. Implement loading skeleton matching `QuizCard` layout
6. Implement empty state (no quizzes, filtered empty, instructor create CTA)
7. Create `app/(dashboard)/courses/[courseId]/quizzes/page.tsx` (course-filtered quiz list)
8. Verify role-based route access with `RequireRole` guard (SPEC-FE-002)

**Quality gate**: All filter combinations render correctly, URL params preserved on refresh, responsive layout at 375/768/1280px, keyboard navigation in filter dropdowns, "Load more" button works with cursor pagination

---

### Primary Goal -- Quiz Taking Interface

Covers: REQ-FE-610 through REQ-FE-619, REQ-FE-670 through REQ-FE-673

**Tasks**:

1. Create `app/(dashboard)/quizzes/[id]/page.tsx` (Server Component -- fetches quiz detail, checks attempt status)
2. Implement `components/quiz/quiz-taking/quiz-taking-shell.tsx` (Client Component wrapping all quiz-taking sub-components)
3. Implement `quiz-taking/question-display.tsx` rendering all 4 question types
4. Implement `quiz-taking/answer-input.tsx` with MCQ RadioGroup, TF RadioGroup, Short Answer Textarea, Fill-in-the-Blank inline inputs
5. Implement `quiz-taking/question-navigator.tsx` with:
   - Desktop: fixed sidebar (240px width)
   - Mobile: Sheet (bottom sheet) using `useMediaQuery` (EXISTING)
6. Implement `quiz-taking/quiz-timer.tsx` with `useQuizTimer` hook (in `hooks/quiz/`)
   - MM:SS format, amber at 120s, red + pulse at 60s, auto-submit at 0s
7. Implement `quiz-taking/quiz-progress-bar.tsx` with animated progress (CSS transitions 300ms)
8. Implement `quiz-taking/quiz-submit-dialog.tsx` (AlertDialog) with unanswered count warning
9. Wire auto-save: `useQuizAutoSave` -> `useDebounce` (EXISTING) + `useBeforeUnload` (EXISTING)
10. Wire focus detection: `useFocusDetection` -> store `incrementFocusLoss`
11. Implement keyboard navigation (arrow keys, number keys for MCQ, T/F shortcuts, Escape)
12. Implement offline detection banner (REQ-FE-670)
13. Implement session expiry dialog with sessionStorage resilience (REQ-FE-671)
14. Implement concurrent attempt detection (REQ-FE-672)
15. Implement `content-visibility: auto` for 50+ question navigators (REQ-FE-673)

**Quality gate**: All 4 question type UIs render correctly, timer auto-submits at 0s, auto-save triggers after 3s debounce, focus detection fires on tab switch (when enabled), mobile Sheet navigator works at 375px, keyboard shortcuts functional

---

### Primary Goal -- Quiz Results Page

Covers: REQ-FE-620 through REQ-FE-624

**Tasks**:

1. Create `app/(dashboard)/quizzes/[id]/results/page.tsx` (Server Component)
2. Implement `components/quiz/quiz-results/results-summary.tsx` -- score, percentage, pass/fail badge, time taken
3. Implement `quiz-results/results-breakdown.tsx` -- question-by-question review with correct/incorrect highlights
4. Implement `quiz-results/results-chart.tsx` -- SVG donut chart (aria-hidden, no external charting library)
5. Implement conditional answer display per `showAnswersAfterSubmit` setting
6. Implement "Pending manual grading" label for `short_answer` questions
7. Implement "Retake Quiz" button (visible when `allowReattempt && quiz.status === 'published'`)
8. Create instructor results view at `app/(dashboard)/instructor/quizzes/[id]/submissions/[attemptId]/page.tsx`
   - Student info panel with prev/next navigation

**Quality gate**: Score/percentage display correctly, pass/fail badge per passingScore config, correct answers shown/hidden per showAnswersAfterSubmit, SVG donut segments accurate, instructor view shows student info

---

### Secondary Goal -- Instructor Quiz Creation & Management

Covers: REQ-FE-630 through REQ-FE-636, REQ-FE-650 through REQ-FE-655

**Tasks**:

1. Create `app/(dashboard)/instructor/quizzes/new/page.tsx` (Client Component)
2. Implement `components/quiz/quiz-create/quiz-form.tsx` -- React Hook Form with `CreateQuizSchema` validation
3. Implement `quiz-create/quiz-settings-panel.tsx` -- toggles for time limit, passing score, etc.
4. Implement `quiz-create/question-type-selector.tsx` -- segmented control for question type
5. Implement `quiz-create/question-editor.tsx` -- all 4 question types with type-specific fields
6. Implement `quiz-create/question-list.tsx` -- `@dnd-kit/sortable` drag-and-drop reordering
7. Implement quiz form auto-save (30s interval with status indicator)
8. Implement publish action (REQ-FE-634) -- requires 1+ question, confirmation dialog
9. Create `app/(dashboard)/instructor/quizzes/[id]/edit/page.tsx` -- pre-populated edit form (REQ-FE-635)
10. Implement `components/quiz/quiz-manage/quiz-manage-table.tsx` -- sortable columns (REQ-FE-650)
11. Implement `quiz-manage/quiz-status-badge.tsx` -- Draft/Published/Closed (REQ-FE-652)
12. Implement `quiz-manage/submission-list.tsx` with sort by score/time (REQ-FE-651)
13. Create `app/(dashboard)/instructor/quizzes/page.tsx` -- management page
14. Create `app/(dashboard)/instructor/quizzes/[id]/submissions/page.tsx` -- submissions page
15. Implement CSV export from submissions list (REQ-FE-654) -- client-side Blob generation
16. Implement bulk delete with row checkboxes (REQ-FE-655)
17. Implement quiz duplication (REQ-FE-653)
18. Implement quiz deletion with 5-second undo toast (REQ-FE-636)

**Quality gate**: Form validates per CreateQuizSchema, drag-and-drop reorders correctly, publish disabled when 0 questions, management table columns sortable, CSV export contains correct data, bulk delete confirmation works

---

### Secondary Goal -- AI Quiz Generation

Covers: REQ-FE-640 through REQ-FE-645

**Tasks**:

1. Implement `components/quiz/quiz-generate/material-selector.tsx` -- multi-select with course grouping (REQ-FE-640)
2. Implement `quiz-generate/generation-options.tsx` -- difficulty, count, type config with `GenerationOptionsSchema` validation (REQ-FE-641)
3. Create `app/(dashboard)/instructor/quizzes/[id]/generate/page.tsx` -- AI generation page
4. Implement full-page loading state with 60s client-side timeout (REQ-FE-642)
5. Implement `quiz-generate/generated-question-review.tsx` -- editable pre-populated QuestionEditors (REQ-FE-643)
6. Implement "Accept All" / "Accept Selected" actions with checkbox per question
7. Implement navigation guard for unsaved generated questions (REQ-FE-644)
8. Implement regeneration flow with pre-filled form (REQ-FE-645)
9. Implement empty state for no materials with link to material upload (SPEC-FE-004)

**Quality gate**: Material selector shows course-grouped materials, 60s timeout displays retry, generated questions are editable, accepted questions append to quiz, navigation away prompts confirmation

---

### Final Goal -- Accessibility, Quality, and Polish

Covers: REQ-FE-660 through REQ-FE-663, REQ-FE-N600 through REQ-FE-N608, WCAG 2.1 AA + TRUST 5

**Tasks**:

1. ARIA audit for all quiz components:
   - `QuizTimer`: `role="timer"`, `aria-label="Time remaining"`, `aria-live="off"`
   - `QuizProgressBar`: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`
   - `QuestionNavigator` buttons: `aria-label="Question N, answered/unanswered"`
   - Answer radio/checkbox groups: `role="radiogroup"` or `role="group"` with `aria-labelledby`
2. Keyboard navigation test: Tab order through quiz taking, creation, management
3. Screen reader test with VoiceOver (macOS) or NVDA (Windows)
   - Question navigation announcements via `aria-live="polite"`
   - Timer threshold announcements via `aria-live="assertive"` (120s, 60s, 0s)
4. Color contrast verification for:
   - Quiz status badges (Draft/Published/Closed)
   - Timer color states (amber, red)
   - Correct/incorrect answer highlights in results
   - Progress bar fill
5. Focus management audit (submit dialog focus trap, question navigation focus)
6. Verify all unwanted behavior requirements (REQ-FE-N600 through REQ-FE-N608):
   - No taking draft/closed quizzes
   - No duplicate submissions
   - No student access to instructor routes
   - No timer manipulation
   - No self-grading
   - No instructor quiz taking
   - No post-submit answer modification
   - No reckless deletion of published quizzes with submissions
   - No empty quiz publishing
7. Unit test coverage audit (target 85%)
8. E2E smoke test: quiz list -> take quiz -> answer questions -> submit -> view results

---

## 3. Technical Architecture

### 3.1 Component Dependency Graph

#### Quiz Taking Flow

```
app/(dashboard)/quizzes/[id]/page.tsx (Server Component)
    |
    +-- Fetches quiz detail (GET /api/v1/quiz/quizzes/:id)
    +-- Checks attempt status
    |
    +-- QuizTakingShell (Client Component - 'use client')
          +-- Quiz Header
          |     +-- Quiz title + course name
          |     +-- QuizTimer (Client Component)
          |     |     +-- useQuizTimer hook (hooks/quiz/)
          |     |           +-- setInterval -> store.tickTimer()
          |     +-- QuizProgressBar
          |           +-- role="progressbar" + aria attributes
          |
          +-- Content Area
          |     +-- QuestionDisplay (Client Component)
          |           +-- Question text (lightweight Markdown via MarkdownRenderer - EXISTING)
          |           +-- AnswerInput (variant by question.type)
          |                 +-- MCQ: RadioGroup (A, B, C, D...)
          |                 +-- TF: RadioGroup (True / False)
          |                 +-- Short: Textarea (min 3 rows)
          |                 +-- Fill: Inline inputs replacing ___
          |
          +-- Navigator
          |     +-- QuestionNavigator (Client Component)
          |           +-- Desktop: fixed sidebar (240px)
          |           +-- Mobile: Sheet (bottom sheet)
          |                 +-- useMediaQuery (EXISTING) determines variant
          |
          +-- QuizSubmitDialog (AlertDialog)
          |     +-- Unanswered count warning
          |
          +-- Hooks Integration
                +-- useQuizAnswers -> store.setAnswer
                +-- useQuizAutoSave -> useDebounce (EXISTING)
                +-- useFocusDetection -> store.incrementFocusLoss
                +-- useBeforeUnload (EXISTING) -> forced save
```

#### Quiz Results Flow

```
app/(dashboard)/quizzes/[id]/results/page.tsx (Server Component)
    |
    +-- Fetches results (GET /api/v1/quiz/quizzes/:id/attempts/:attemptId/results)
    |
    +-- Results Layout
          +-- ResultsSummary (Server Component)
          |     +-- Score / MaxScore / Percentage
          |     +-- Pass/Fail Badge (if passingScore set)
          |     +-- Time taken
          |     +-- Retake / Back buttons
          |
          +-- ResultsChart (Server Component)
          |     +-- SVG donut chart (aria-hidden)
          |
          +-- ResultsBreakdown (Server Component)
                +-- QuestionResult (* N)
                      +-- Student answer (highlighted)
                      +-- Correct answer (if showAnswersAfterSubmit)
                      +-- Explanation text
```

#### Instructor Quiz Creation Flow

```
app/(dashboard)/instructor/quizzes/new/page.tsx (Client Component)
    |
    +-- QuizForm (Client Component - React Hook Form)
          +-- Quiz Metadata Fields
          |     +-- Title, Description, Course Select
          |     +-- QuizSettingsPanel
          |           +-- Toggles: time limit, passing score, etc.
          |
          +-- QuestionList (Client Component)
          |     +-- @dnd-kit/sortable for drag-and-drop
          |     +-- QuestionEditor (* N, Client Component)
          |           +-- QuestionTypeSelector (segmented control)
          |           +-- Question text (Markdown textarea)
          |           +-- Points input
          |           +-- Type-specific fields
          |                 +-- MCQ: Options + correct answer radio
          |                 +-- TF: Correct answer radio
          |                 +-- Short: Sample answer textarea
          |                 +-- Fill: ___ detection + blank answer fields
          |
          +-- Action Bar
                +-- Save Draft
                +-- Publish Quiz (REQ-FE-634)
                +-- Auto-save indicator ("Saving..." / "Saved")
```

#### Instructor Quiz Management Flow

```
app/(dashboard)/instructor/quizzes/page.tsx (Server Component)
    |
    +-- QuizManageTable (Client Component)
          +-- Column Headers (sortable): Title, Course, Status, Questions, Submissions, Due Date, Actions
          +-- QuizManageRow (* N)
          |     +-- QuizStatusBadge (Draft / Published / Closed)
          |     +-- Action Buttons: Edit, Manage Submissions, Duplicate, Delete
          |
          +-- Bulk Actions Bar (visible when rows selected)
          |     +-- "Delete Selected" with confirmation dialog
          |
          +-- Row Checkboxes for bulk selection
```

### 3.2 Optimistic Update Strategy

| Action | Optimistic Update | Rollback |
|--------|-------------------|---------|
| Publish quiz | Set status to `published` in cache | Revert to `draft` |
| Close quiz | Set status to `closed` in cache | Revert to `published` |
| Duplicate quiz | Append "(Copy)" quiz to list cache | Remove from list |
| Delete quiz | Remove from list cache | Re-add to list |
| Save draft answers | Set `isDirty: false`, update `lastSavedAt` | Set `isDirty: true`, show retry toast |
| Submit quiz | N/A (navigate to results) | Show error toast, stay on quiz |

### 3.3 Auto-Save Architecture

```
Student answers a question
    |
    v
store.setAnswer(questionId, answer)
    |
    +-- Sets isDirty: true
    |
    v
useQuizAutoSave hook
    |
    +-- Watches isDirty via useEffect
    +-- Calls useDebounce (EXISTING, 3000ms)
    |     |
    |     v (after 3s without new changes)
    |     PUT /api/v1/quiz/quizzes/:id/attempts/:attemptId
    |       |
    |       +-- Success: store.markSaved() -> isDirty: false, lastSavedAt: now
    |       +-- Failure: Toast "Changes not saved. Will retry shortly." -> retry after 5s
    |
    +-- useBeforeUnload (EXISTING)
          +-- On page leave: immediate (non-debounced) save if isDirty
```

### 3.4 Timer Architecture

```
Quiz Taking Page mounts
    |
    v
useQuizTimer hook (hooks/quiz/useQuizTimer.ts)
    |
    +-- Reads remainingSeconds from quiz-taking.store
    +-- Starts setInterval(store.getState().tickTimer, 1000)
    |
    +-- On each tick:
    |     +-- store.tickTimer() -> remainingSeconds -= 1
    |     +-- if remainingSeconds === 120 -> amber color
    |     +-- if remainingSeconds === 60 -> red color + pulse
    |     +-- if remainingSeconds === 0 -> auto-submit (REQ-FE-617 flow)
    |
    +-- On unmount: clearInterval
    |
    +-- On visibility/blur events:
          +-- useFocusDetection -> store.incrementFocusLoss (if focusLossWarning enabled)
          +-- Timer continues (NOT paused -- server is authoritative)
```

---

## 4. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Timer drift over long quiz sessions (>1 hour) | Medium | High | Re-sync timer from server on reconnect; server-authoritative final check on submit |
| Auto-save conflicts with rapid answer changes | Medium | Medium | Debounce 3s via `useDebounce` (EXISTING); cancel pending save on new change before debounce fires |
| `fill_in_the_blank` blank detection regex edge cases | Medium | Medium | Thorough unit tests for `___` parsing function; document supported syntax |
| `@dnd-kit` accessibility for question reordering | Low | High | Use `@dnd-kit/accessibility` keyboard sensor; test with VoiceOver and NVDA |
| AI generation timeout on slow backend | High | Medium | 60s client timeout with user-facing retry; backend should stream partial results if possible |
| Large quiz (50+ questions) navigator performance | Low | Medium | `content-visibility: auto` on navigator items; render only current question body |
| `useBeforeUnload` browser compatibility | Low | Medium | Hook already verified in SPEC-FE-001; Chrome, Firefox, Safari support `beforeunload` |
| React Hook Form integration with @dnd-kit | Medium | Medium | Use `useFieldArray` for question list; sync `@dnd-kit` sort with RHF field array swap |

---

## 5. Definition of Done

- All requirements REQ-FE-600 through REQ-FE-673 implemented
- All unwanted behavior requirements REQ-FE-N600 through REQ-FE-N608 verified
- TypeScript strict mode: zero type errors
- ESLint: zero errors
- Unit test coverage: >= 85% for hooks (`hooks/quiz/`), store (`quiz-taking.store.ts`), and utility functions
- Component tests: QuizTakingShell, QuestionDisplay, AnswerInput (all 4 types), QuizTimer, QuestionNavigator, ResultsSummary, QuizForm, QuestionEditor
- E2E test: quiz list -> take quiz -> answer questions -> auto-save fires -> submit -> view results
- E2E test: instructor creates quiz -> adds questions (drag-and-drop reorder) -> publishes -> views submissions
- WCAG 2.1 AA: passes axe-core audit with zero violations
- Responsive layout: verified at 375px, 768px, 1280px
- Role-based UI: verified for STUDENT and INSTRUCTOR sessions
- Design tokens: no hardcoded colors or spacing values
- Existing hooks reused: `useBeforeUnload`, `useDebounce`, `useMediaQuery` from root `hooks/`
- No new hooks created in root `hooks/` directory -- all quiz hooks in `hooks/quiz/`
- Existing shared types referenced: `ApiResponse<T>`, `PaginatedResponse<T>` from `api.types.ts`
- Existing events constants used: `EVENTS.QUIZ_STARTED`, `EVENTS.QUIZ_SUBMITTED`, `EVENTS.QUIZ_GRADED`
- All API calls use `/api/v1/quiz/` prefix
- Dashboard quiz endpoints in `api-endpoints.ts` remain unchanged

---

## 6. Key Dependencies

| Dependency | Type | Source SPEC |
|-----------|------|-------------|
| Auth context, role guards (`RequireAuth`, `RequireRole`) | Runtime | SPEC-FE-002 |
| Course list for assignment dropdown | Runtime | SPEC-FE-005 |
| Material list for AI generation source picker | Runtime | SPEC-FE-004 |
| Design tokens, layout, shadcn/ui (24 components) | Foundation | SPEC-FE-001 |
| API client base (`apps/web/lib/api.ts`), TanStack Query setup | Foundation | SPEC-FE-001 |
| `useBeforeUnload`, `useDebounce`, `useMediaQuery` hooks | Foundation | SPEC-FE-001 |
| `ApiResponse<T>`, `PaginatedResponse<T>` shared types | Foundation | SPEC-FE-001 |
| `EVENTS.QUIZ_*` constants | Foundation | SPEC-FE-001 |
| `MarkdownRenderer` for question text rendering | Component | SPEC-FE-004 |

---

## 7. File Ownership

For implementation via Agent Teams, file ownership boundaries:

| Domain | Files |
|--------|-------|
| Shared / Types | `packages/shared/src/types/quiz.types.ts`, `packages/shared/src/validators/quiz.schema.ts` |
| API Layer | `apps/web/lib/api/quiz.api.ts` |
| Store | `apps/web/stores/quiz-taking.store.ts` |
| Quiz Hooks | `apps/web/hooks/quiz/**` |
| Quiz Taking Components | `apps/web/components/quiz/quiz-taking/**` |
| Quiz Results Components | `apps/web/components/quiz/quiz-results/**` |
| Quiz List Components | `apps/web/components/quiz/quiz-card.tsx`, `quiz-list.tsx`, `quiz-filters.tsx` |
| Quiz Creation Components | `apps/web/components/quiz/quiz-create/**` |
| Quiz Generation Components | `apps/web/components/quiz/quiz-generate/**` |
| Quiz Management Components | `apps/web/components/quiz/quiz-manage/**` |
| Student Pages | `apps/web/app/(dashboard)/quizzes/**` |
| Instructor Pages | `apps/web/app/(dashboard)/instructor/quizzes/**` |
| Tests | `apps/web/**/*.test.tsx`, `packages/shared/**/*.test.ts` |
