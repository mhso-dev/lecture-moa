---
id: SPEC-FE-007
title: "Quiz System - Implementation Plan"
spec_ref: SPEC-FE-007
---

# SPEC-FE-007: Quiz System — Implementation Plan

## 1. Overview

This plan outlines the implementation approach for the Quiz System frontend (SPEC-FE-007). The work is decomposed into five milestone phases ordered by dependency and user-facing value. All implementation follows the Hybrid methodology (TDD for new code, DDD for extended code).

## 2. Technical Approach

### 2.1 Architecture Strategy

The Quiz System is decomposed into four functional areas implemented in dependency order:

1. **Shared Layer** — types and Zod schemas in `packages/shared` (no UI dependencies)
2. **Data Layer** — API client functions, TanStack Query hooks, Zustand store
3. **Student Flow** — quiz list → quiz taking → quiz results
4. **Instructor Flow** — quiz management → quiz creation → AI generation

The student flow is prioritized over the instructor flow because it requires all foundational pieces and represents the highest-value user path.

### 2.2 State Management Architecture

Two state scopes for the Quiz System:

| Scope | Tool | Lifetime | Data |
|-------|------|----------|------|
| Server state | TanStack Query | Request | Quiz lists, details, results, submissions |
| Quiz session state | Zustand (`quiz-taking.store.ts`) | Page session | Current question, draft answers, timer |

The quiz-taking store is intentionally reset on every quiz page mount to prevent stale state from a previous session. `sessionStorage` is used for session-expiry resilience only (REQ-FE-671).

### 2.3 Timer Architecture

The timer is a **display-only** client-side counter. The authoritative timer lives on the server. This prevents timer manipulation via browser DevTools. The implementation:

- `useQuizTimer` hook owns the `setInterval` lifecycle.
- Timer state (remaining seconds, status) lives in Zustand.
- On reconnect after disconnection, the server's remaining time is fetched and the local timer is corrected.

### 2.4 Auto-Save Architecture

Auto-save uses a debounced approach:

- Answer changes set `isDirty: true` in the store.
- A `useEffect` watches `isDirty` and schedules a debounced save (3s).
- A `beforeunload` handler triggers an immediate (non-debounced) save.
- Failed saves are retried with exponential backoff (max 3 retries).

### 2.5 AI Generation Architecture

The AI generation flow uses a two-step UX pattern:

1. **Configure** — instructor sets material sources and generation parameters.
2. **Review** — instructor edits AI-generated questions before accepting.

Generated questions are held in component state with a `tempId` until accepted. On acceptance, they are saved via the standard question creation API (not a batch-accept endpoint).

### 2.6 Drag-and-Drop for Question Ordering

`@dnd-kit/core` and `@dnd-kit/sortable` are used for question list reordering. This library is chosen over `react-beautiful-dnd` (unmaintained) and HTML5 native DnD (poor mobile support). The sort order is committed to the backend on blur/save, not on every drag event.

## 3. Milestones

### Milestone 1 — Shared Foundation (Priority: High)

**Goal**: Establish the shared type and validation layer. No UI work.

Tasks:
- [ ] Enrich `packages/shared/src/types/quiz.types.ts` with all interfaces from REQ-FE-600
- [ ] Create `packages/shared/src/validators/quiz.schema.ts` with all schemas from REQ-FE-601
- [ ] Create `apps/web/lib/api/quiz.api.ts` with all typed API client functions
- [ ] Define TanStack Query key factory for quiz queries
- [ ] Write unit tests for all Zod schemas (valid/invalid cases)

Dependencies: SPEC-FE-001 shared package structure

Acceptance: TypeScript compiles with zero errors; Zod schema tests pass.

---

### Milestone 2 — Quiz Taking Store & Hooks (Priority: High)

**Goal**: Implement the stateful quiz session layer before any UI that depends on it.

Tasks:
- [ ] Implement `apps/web/stores/quiz-taking.store.ts` (REQ-FE-611)
- [ ] Implement `apps/web/hooks/use-quiz-timer.ts` (REQ-FE-614)
- [ ] Implement `apps/web/hooks/use-quiz-answers.ts` (REQ-FE-612)
- [ ] Implement `apps/web/hooks/use-quiz-submission.ts` (REQ-FE-617)
- [ ] Write Vitest unit tests for store actions and derived selectors
- [ ] Write unit test for timer tick, threshold detection, and auto-submit trigger

Dependencies: Milestone 1

Acceptance: All store unit tests pass; timer correctly detects 120s/60s/0s thresholds.

---

### Milestone 3 — Student Quiz Flow (Priority: High)

**Goal**: Complete the end-to-end student experience: list → take → results.

Tasks:
- [ ] Build `components/quiz/quiz-card.tsx` and `quiz-list.tsx` (REQ-FE-604)
- [ ] Build `components/quiz/quiz-filters.tsx` (REQ-FE-603)
- [ ] Build `app/(dashboard)/quizzes/page.tsx` — quiz list page (REQ-FE-602 to REQ-FE-607)
- [ ] Build `quiz-taking/quiz-taking-shell.tsx` — quiz session layout (REQ-FE-610)
- [ ] Build `quiz-taking/question-display.tsx` — all 4 question types (REQ-FE-612)
- [ ] Build `quiz-taking/answer-input.tsx` — MCQ, TF, short answer, fill-blank
- [ ] Build `quiz-taking/question-navigator.tsx` — desktop sidebar + mobile bottom sheet (REQ-FE-613)
- [ ] Build `quiz-taking/quiz-timer.tsx` — countdown with color thresholds (REQ-FE-614)
- [ ] Build `quiz-taking/quiz-progress-bar.tsx` — animated progress (REQ-FE-615)
- [ ] Build `quiz-taking/quiz-submit-dialog.tsx` — confirmation dialog (REQ-FE-617)
- [ ] Build `app/(dashboard)/quizzes/[id]/page.tsx` — quiz taking page (REQ-FE-610 to REQ-FE-619)
- [ ] Build `quiz-results/results-summary.tsx` (REQ-FE-621)
- [ ] Build `quiz-results/results-breakdown.tsx` (REQ-FE-622)
- [ ] Build `quiz-results/results-chart.tsx` — SVG donut (REQ-FE-623)
- [ ] Build `app/(dashboard)/quizzes/[id]/results/page.tsx` (REQ-FE-620 to REQ-FE-623)
- [ ] Implement keyboard navigation (REQ-FE-619)
- [ ] Implement focus-loss detection (REQ-FE-618)
- [ ] Implement ARIA attributes on timer, progress bar, navigator (REQ-FE-660 to REQ-FE-663)
- [ ] Implement offline detection banner (REQ-FE-670)
- [ ] Implement session expiry dialog (REQ-FE-671)

Dependencies: Milestone 2, SPEC-FE-002 auth

Acceptance: Student can list, take, and review results for a quiz; auto-save works; timer auto-submits.

---

### Milestone 4 — Instructor Quiz Creation & Management (Priority: High)

**Goal**: Complete the instructor-facing creation and management screens.

Tasks:
- [ ] Build `components/quiz/quiz-create/quiz-form.tsx` — metadata form (REQ-FE-630)
- [ ] Build `quiz-create/question-type-selector.tsx` (REQ-FE-631)
- [ ] Build `quiz-create/question-editor.tsx` — all 4 types (REQ-FE-631)
- [ ] Build `quiz-create/question-list.tsx` — with `@dnd-kit` drag-and-drop (REQ-FE-632)
- [ ] Build `quiz-create/quiz-settings-panel.tsx` — toggles and date picker
- [ ] Build `app/(dashboard)/instructor/quizzes/new/page.tsx` — quiz creation (REQ-FE-630 to REQ-FE-636)
- [ ] Build `app/(dashboard)/instructor/quizzes/[id]/edit/page.tsx` — quiz edit (REQ-FE-635)
- [ ] Build `components/quiz/quiz-manage/quiz-manage-table.tsx` (REQ-FE-650)
- [ ] Build `quiz-manage/submission-list.tsx` (REQ-FE-651)
- [ ] Build `quiz-manage/quiz-status-badge.tsx` (REQ-FE-652)
- [ ] Build `app/(dashboard)/instructor/quizzes/page.tsx` — management page (REQ-FE-650 to REQ-FE-655)
- [ ] Implement CSV export (REQ-FE-654)
- [ ] Implement bulk delete (REQ-FE-655)
- [ ] Implement quiz duplication (REQ-FE-653)

Dependencies: Milestone 2, SPEC-FE-005 course context

Acceptance: Instructor can create, publish, edit, manage, and delete quizzes; submission list renders.

---

### Milestone 5 — AI Quiz Generation (Priority: Medium)

**Goal**: Complete the AI-powered quiz generation flow.

Tasks:
- [ ] Build `components/quiz/quiz-generate/material-selector.tsx` (REQ-FE-640)
- [ ] Build `quiz-generate/generation-options.tsx` (REQ-FE-641)
- [ ] Build `quiz-generate/generated-question-review.tsx` (REQ-FE-643)
- [ ] Build `app/(dashboard)/instructor/quizzes/[id]/generate/page.tsx` (REQ-FE-640 to REQ-FE-645)
- [ ] Implement 60-second client-side timeout for generation request (REQ-FE-642)
- [ ] Implement navigation guard for unsaved generated questions (REQ-FE-644)
- [ ] Implement regeneration flow with pre-filled form (REQ-FE-645)

Dependencies: Milestone 4, SPEC-FE-004 materials

Acceptance: Instructor can generate, review, edit, and accept AI-generated questions into a quiz.

---

## 4. Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Timer drift over long quiz sessions | Medium | High | Re-sync timer from server on reconnect; server-authoritative final check on submit |
| Auto-save conflicts with rapid answer changes | Medium | Medium | Debounce 3s; cancel pending save on new change before debounce fires |
| `fill_in_the_blank` blank detection regex edge cases | Medium | Medium | Thorough unit tests for the `___` parsing function; document supported syntax |
| `@dnd-kit` accessibility for question reordering | Low | High | Use `@dnd-kit/accessibility` keyboard sensor; test with VoiceOver and NVDA |
| AI generation timeout on slow backend | High | Medium | 60s client timeout with user-facing retry; backend should stream partial results if possible |
| Large quiz (50+ questions) navigator performance | Low | Medium | `content-visibility: auto` on navigator items; only render current question body |

## 5. Key Dependencies

| Dependency | Type | Source SPEC |
|-----------|------|-------------|
| Auth context, role guards | Runtime | SPEC-FE-002 |
| Course list for assignment dropdown | Runtime | SPEC-FE-005 |
| Material list for AI generation source picker | Runtime | SPEC-FE-004 |
| Design tokens, layout, shadcn/ui | Foundation | SPEC-FE-001 |
| API client base, TanStack Query setup | Foundation | SPEC-FE-001 |

## 6. File Ownership

For implementation via Agent Teams, file ownership boundaries:

| Domain | Files |
|--------|-------|
| Shared / Types | `packages/shared/src/types/quiz.types.ts`, `packages/shared/src/validators/quiz.schema.ts` |
| API Layer | `apps/web/lib/api/quiz.api.ts`, `apps/web/stores/quiz-taking.store.ts` |
| Quiz Taking Components | `apps/web/components/quiz/quiz-taking/**` |
| Quiz Results Components | `apps/web/components/quiz/quiz-results/**` |
| Quiz List Components | `apps/web/components/quiz/quiz-card.tsx`, `quiz-list.tsx`, `quiz-filters.tsx` |
| Quiz Creation Components | `apps/web/components/quiz/quiz-create/**` |
| Quiz Generation Components | `apps/web/components/quiz/quiz-generate/**` |
| Quiz Management Components | `apps/web/components/quiz/quiz-manage/**` |
| Pages | `apps/web/app/(dashboard)/quizzes/**`, `apps/web/app/(dashboard)/instructor/quizzes/**` |
| Tests | `apps/web/**/*.test.tsx`, `packages/shared/**/*.test.ts` |
