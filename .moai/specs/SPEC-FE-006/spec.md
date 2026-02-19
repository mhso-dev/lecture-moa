---
id: SPEC-FE-006
title: "Q&A System"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: critical
tags: [frontend, qa, inline-popup, text-selection, ai-answer, websocket, real-time, markdown, role-based]
related_specs: [SPEC-UI-001, SPEC-FE-001, SPEC-FE-002, SPEC-FE-004, SPEC-FE-005]
---

# SPEC-FE-006: Q&A System

## History

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | 2026-02-19 | Complete rewrite. Fixed 6 critical discrepancies with actual codebase: text selection trigger integration (QaSelectionTrigger.onOpenQaPopup), markdown editor reuse (components/markdown/), WebSocket event naming (EVENTS object), WebSocket client path, markdown libraries already installed, 2-step selection trigger flow. Changed sectionAnchor to headingId throughout. |
| 1.0.0 | 2026-02-19 | Initial draft |

---

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
| Markdown | react-markdown + remark/rehype (already installed) | latest |
| Icons | Lucide React | latest |
| Testing | Vitest + React Testing Library | latest |

### 1.2 Screen Design References

| Screen | .pen File | Description |
|--------|-----------|-------------|
| Q&A List | design/screens/qa/qa-list.pen | Q&A list page with course/material/status filters |
| Q&A Detail | design/screens/qa/qa-detail.pen | Q&A thread (question + answers + AI suggestion) |
| Q&A Popup | design/screens/qa/qa-popup.pen | Inline popup triggered by text selection trigger button |

> Note: .pen files are Pencil MCP design artifacts. Reference for component structure, layout, and visual tokens only. Do not attempt to read directly.

### 1.3 System Architecture Context

```
apps/web/                          # Next.js 15 (this SPEC)
  app/(dashboard)/
    courses/[courseId]/materials/[materialId]/
      page.tsx                     # Material viewer (already integrates QaSelectionTrigger)
    qa/                            # Q&A list and detail pages
  components/
    materials/
      QaSelectionTrigger.tsx       # EXISTING: floating "Ask" button on text selection
    markdown/                      # EXISTING: full markdown editor/renderer suite
      MarkdownEditor.tsx           # Full editor with toolbar, shortcuts
      EditorWithPreview.tsx        # Write/preview toggle component
      MarkdownRenderer.tsx         # Rendering with remark-gfm, math, katex, highlight, sanitize
      CodeBlock.tsx                # Code block component
      Callout.tsx                  # Callout component
      HeadingWithAnchor.tsx        # Heading anchor component
      MathBlock.tsx                # Math rendering
      index.ts                    # Exports all components
    qa/                            # Q&A-specific components (NEW in this SPEC)
  stores/
    material.store.ts              # EXISTING: selectedText, selectionAnchorRect state
    qa.store.ts                    # Q&A client state (NEW in this SPEC)

apps/api/                          # Fastify backend
  routes/qa/                       # Q&A REST endpoints + WebSocket events

apps/ai/                           # Python FastAPI AI microservice
  routes/qa-assist/                # AI answer generation endpoint

packages/shared/
  src/types/qa.types.ts            # Q&A shared types (enriched by this SPEC)
  src/validators/qa.schema.ts      # Q&A Zod schemas (NEW in this SPEC)
  src/constants/events.ts          # EXISTING: EVENTS object (extended by this SPEC)
```

### 1.4 Design Constraints

- **Responsive Breakpoints**: Mobile 375px (4-col), Tablet 768px (8-col), Desktop 1280px+ (12-col)
- **Accessibility**: WCAG 2.1 AA compliance -- keyboard navigable popup, focus management, ARIA labels
- **Popup Anchor**: Inline popup anchors to highlighted text position within the material viewer
- **Markdown**: Questions and answers use existing `components/markdown/` infrastructure for both input and display
- **Real-time**: New answers and AI suggestions delivered via WebSocket (polling fallback)
- **Role-based UI**: Students see ask/upvote actions; Instructors see moderate/approve/edit actions
- **Text Selection Context**: Captures material ID, heading ID, and selected text content
- **2-Step Trigger**: Text selection shows floating button; user clicks button to open popup

---

## 2. Assumptions

### 2.1 Foundation Dependencies (SPEC-FE-001)

SPEC-FE-001 (foundation) is complete and provides:

- `Dialog`, `Sheet` components from shadcn/ui for the inline popup overlay
- `Toast` (Sonner) for Q&A notifications
- `Badge`, `Avatar`, `Card` components for Q&A list and detail rendering
- TanStack Query `QueryProvider` and `apps/web/lib/api.ts` API client
- Zustand store infrastructure and devtools setup

### 2.2 Auth Dependency (SPEC-FE-002)

SPEC-FE-002 (auth) is complete and provides:

- `useAuthStore` exposing `{ user, role }` from `apps/web/stores/auth.store.ts`
- `UserRole` types from `@shared/types/auth.types`
- Authenticated API client with Bearer token injection

### 2.3 Material Viewer Dependency (SPEC-FE-004)

SPEC-FE-004 (material viewer) is complete and provides:

- `QaSelectionTrigger` component at `apps/web/components/materials/QaSelectionTrigger.tsx`
  - Exposes `onOpenQaPopup` callback: `(selectedText, anchorRect, materialId, headingId) => void`
  - Floating "Ask" button appears near text selection end
  - Hidden for instructor role (returns null when `role === "instructor"`)
  - Clears browser selection after calling `onOpenQaPopup`
- `material.store.ts` at `apps/web/stores/material.store.ts`
  - Manages `selectedText` and `selectionAnchorRect` state
  - `setSelection(text, rect)` and `clearSelection()` actions
- Material page at `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx`
  - Already integrates `QaSelectionTrigger` with a placeholder `onOpenQaPopup` callback
  - SPEC-FE-006 replaces the placeholder with actual popup logic
- Complete markdown infrastructure at `apps/web/components/markdown/`:
  - `MarkdownEditor` (370 lines) -- full editor with toolbar and shortcuts
  - `EditorWithPreview` -- write/preview toggle with split-pane layout
  - `MarkdownRenderer` -- rendering with remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-sanitize
  - All markdown libraries already installed: react-markdown, remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-sanitize

### 2.4 Course Management Dependency (SPEC-FE-005)

SPEC-FE-005 (course management) is complete and provides:

- Course routes under `/courses/[courseId]/`
- Material routes under `/courses/[courseId]/materials/[materialId]`

### 2.5 WebSocket Events (Existing)

`packages/shared/src/constants/events.ts` already defines:

- `EVENTS.QA_QUESTION_POSTED: "qa:question_posted"`
- `EVENTS.QA_ANSWER_POSTED: "qa:answer_posted"`

This SPEC extends the `EVENTS` object with additional Q&A events. No new namespace is created.

### 2.6 Backend API Assumptions

REST endpoints available at `NEXT_PUBLIC_API_URL/api/v1/qa`:

- `GET /questions` -- paginated list with filter params
- `POST /questions` -- create new question
- `GET /questions/[id]` -- question detail with answers
- `POST /questions/[id]/answers` -- post an answer
- `PATCH /questions/[id]/answers/[answerId]/accept` -- accept answer (instructor/author)
- `POST /questions/[id]/upvote` -- upvote question
- `POST /questions/[id]/answers/[answerId]/upvote` -- upvote answer
- `PATCH /questions/[id]` -- update question (author only)
- `PATCH /questions/[id]/status` -- change status (instructor only)
- `DELETE /questions/[id]` -- delete question (author or instructor)
- AI answer endpoint: `POST /api/v1/qa/questions/[id]/ai-suggest`
- WebSocket events delivered via existing `@fastify/websocket` connection

### 2.7 AI Service Assumptions

- AI answer suggestions are generated asynchronously by `apps/ai` (Python FastAPI)
- The backend notifies the frontend via WebSocket when AI suggestion is ready
- Frontend polls `GET /questions/[id]` as fallback if WebSocket is unavailable
- AI suggestions are stored server-side and retrieved as part of the question detail response

### 2.8 Scope Assumptions

- This SPEC covers only the frontend Q&A feature (pages, components, state, types)
- Backend API implementation is out of scope
- AI microservice implementation is out of scope
- Real-time WebSocket server implementation is out of scope; frontend implements the client-side subscription and polling fallback
- Full-text search across Q&A is out of scope (search UI included, backed by backend `q` param)
- Push notification (browser notification API) is out of scope
- Q&A moderation tools beyond status change are out of scope

---

## 3. Requirements

### 3.1 Q&A Type Definitions (REQ-FE-500 through REQ-FE-504)

#### REQ-FE-500: Core Q&A Type Enrichment

The system shall provide complete Q&A domain types in `packages/shared/src/types/qa.types.ts` used across frontend and backend.

#### REQ-FE-501: Q&A Zod Schema Definitions

The system shall provide Zod validation schemas in `packages/shared/src/validators/qa.schema.ts`.

Required schemas:

- `CreateQuestionSchema` -- validates `title` (min 10, max 200 chars), `content` (min 20 chars, Markdown), `context.selectedText` (min 1, max 500 chars), `courseId`, `materialId`
- `CreateAnswerSchema` -- validates `content` (min 10 chars, Markdown)
- `QAListFilterSchema` -- validates filter/pagination params with defaults

#### REQ-FE-502: WebSocket Q&A Event Constants

The system shall extend the existing `EVENTS` object in `packages/shared/src/constants/events.ts` with additional Q&A event constants.

New constants to add to the existing `EVENTS` object:

- `QA_AI_SUGGESTION_READY: "qa:ai_suggestion_ready"` -- broadcast when AI suggestion is available
- `QA_QUESTION_RESOLVED: "qa:question_resolved"` -- broadcast when question status changes to RESOLVED

Existing constants already available (no changes needed):

- `QA_QUESTION_POSTED: "qa:question_posted"` -- broadcast on new question
- `QA_ANSWER_POSTED: "qa:answer_posted"` -- broadcast on new answer

#### REQ-FE-503: Q&A API Hook Definitions

The system shall provide TanStack Query hooks in `apps/web/hooks/qa/` for all Q&A API interactions.

Required hooks:

- `useQAList(filter: QAListFilter)` -- paginated query with filter support
- `useQADetail(questionId: string)` -- question detail with answers
- `useCreateQuestion()` -- mutation for new question creation
- `useCreateAnswer(questionId: string)` -- mutation for posting an answer
- `useAcceptAnswer()` -- mutation for accepting an answer (instructor/author)
- `useUpvoteQuestion()` -- optimistic mutation for upvoting
- `useUpvoteAnswer()` -- optimistic mutation for upvoting answer
- `useChangeQuestionStatus()` -- mutation for status change (instructor)
- `useRequestAISuggestion(questionId: string)` -- mutation to trigger AI suggestion

#### REQ-FE-504: Q&A Zustand Store

The system shall provide a Zustand store in `apps/web/stores/qa.store.ts` for client-side Q&A state.

Required state:

- `inlinePopup: { isOpen, anchorRect, context: QAQuestionContext | null }` -- popup visibility and position
- `activeQuestionId: string | null` -- currently viewed question in detail view
- `wsConnected: boolean` -- WebSocket connection status
- `pendingNotifications: QANotification[]` -- unread Q&A notifications

Required actions:

- `openInlinePopup(anchorRect, context)` -- triggered by QaSelectionTrigger button click
- `closeInlinePopup()` -- dismiss popup
- `setActiveQuestion(id)` / `clearActiveQuestion()`
- `addNotification(notification)` / `clearNotification(id)`
- `setWsConnected(connected)`

---

### 3.2 Inline Q&A Popup (REQ-FE-510 through REQ-FE-516)

#### REQ-FE-510: Text Selection Trigger Integration

**When** a user selects text in the material viewer and clicks the floating "Ask" button (`QaSelectionTrigger`), **then** the system shall display the inline Q&A popup anchored to the selection position.

- Integration point: `QaSelectionTrigger.onOpenQaPopup` callback at `apps/web/components/materials/QaSelectionTrigger.tsx`
- 2-step flow:
  1. User selects text in material viewer -- `QaSelectionTrigger` renders a floating button near selection end
  2. User clicks the floating button -- `onOpenQaPopup(selectedText, anchorRect, materialId, headingId)` is called
- SPEC-FE-006 replaces the placeholder in `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx` with a real handler that calls `qa.store.openInlinePopup(anchorRect, context)`
- Context captured: `{ materialId, headingId, selectedText }`
- On popup open, focus moves to the question title input (keyboard accessibility)
- Minimum selected text length: 5 characters (validated before opening popup)

#### REQ-FE-511: Inline Popup Layout

The system shall render the inline Q&A popup as a floating panel anchored near the selected text, consistent with `design/screens/qa/qa-popup.pen`.

Required structure:

- `apps/web/components/qa/QAInlinePopup.tsx` -- main popup container
- Positioning: absolute or fixed, uses `anchorRect` from store; prefers rendering below selection, flips above if insufficient viewport space
- Width: 480px (desktop/tablet), full screen width (mobile, rendered as bottom Sheet)
- Sections:
  1. Context snippet -- selected text shown in a styled blockquote (max 3 lines, truncated)
  2. Question title input -- single line, required
  3. Question content editor -- uses existing `EditorWithPreview` from `components/markdown/`
  4. Action bar -- Cancel and Submit buttons

Mobile variant: renders as a `Sheet` sliding up from bottom (SPEC-FE-001 `Sheet` component).

#### REQ-FE-512: Popup Accessibility

The system shall implement WCAG 2.1 AA accessibility for the inline popup.

- `role="dialog"` with `aria-modal="true"` and `aria-label="질문하기"`
- Focus trap within popup while open; focus returns to trigger element on close
- Escape key closes the popup
- Selected context text has `aria-label` describing the snippet source

#### REQ-FE-513: Popup Question Form

The system shall provide a question submission form within the inline popup using React Hook Form + Zod.

- Schema: `CreateQuestionSchema` from `@shared/validators/qa.schema`
- Fields:
  - `title` (required, min 10 chars, max 200 chars)
  - `content` (required, min 20 chars) -- uses `EditorWithPreview` component from `components/markdown/`
- On submit: calls `useCreateQuestion()` mutation
- Loading state: Submit button shows spinner, fields disabled
- On success: popup closes, success Toast shown, Q&A list query invalidated
- On error: inline error messages per field

#### REQ-FE-514: Markdown Editor Reuse

**Where** the content editor is rendered in the inline popup or answer form, the system shall reuse the existing markdown components from `apps/web/components/markdown/`.

- `EditorWithPreview` from `components/markdown/EditorWithPreview.tsx` for write/preview toggle in the Q&A popup (using `initialTab="editor"` for compact mode)
- `MarkdownRenderer` from `components/markdown/MarkdownRenderer.tsx` for read-only rendering of question and answer content
- `MarkdownEditor` from `components/markdown/MarkdownEditor.tsx` available for simpler editor needs
- No new markdown editor component is created in `components/qa/`
- All markdown rendering uses the same remark/rehype plugin pipeline (remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-sanitize) already configured in SPEC-FE-004

#### REQ-FE-515: Popup Dismiss Behavior

**When** a user clicks outside the popup, presses Escape, or clicks the Cancel button, **then** the system shall close the popup without submitting.

- Click outside: `useOnClickOutside` hook targeting popup container
- Draft content is not persisted on dismiss (no local storage for draft in popup)
- Dismissal resets form state

#### REQ-FE-516: Popup Loading Context

**If** the text selection context is unavailable or invalid, **then** the system shall not open the popup and shall silently ignore the trigger.

- Validation: `context.selectedText` must be non-empty and at least 5 characters
- `materialId` must be a valid ID string
- No error toast shown for silent failures (selection corner cases)

---

### 3.3 Q&A List Page (REQ-FE-520 through REQ-FE-526)

#### REQ-FE-520: Q&A List Page Route

The system shall provide the Q&A list page at route `/qa` within the dashboard layout.

- `apps/web/app/(dashboard)/qa/page.tsx` -- Server Component with initial data prefetch
- `apps/web/app/(dashboard)/qa/layout.tsx` -- optional layout for Q&A section
- Page title: "Q&A" with question count badge
- Breadcrumb: Dashboard > Q&A
- Consistent with `design/screens/qa/qa-list.pen`

#### REQ-FE-521: Q&A List Filter Bar

The system shall provide a filter bar on the Q&A list page that allows filtering by course, material, and status.

- `apps/web/components/qa/QAFilterBar.tsx`
- Filter controls:
  - **Course** dropdown -- lists enrolled/teaching courses, "All Courses" default
  - **Material** dropdown -- lists materials in selected course, "All Materials" default, disabled when no course selected
  - **Status** tabs/segmented control -- All | Open | Resolved
  - **Search** input -- full-text search (debounced 300ms, updates `q` filter param)
- Filter state persisted in URL search params (`?courseId=&materialId=&status=&q=`)
- Responsive: filters collapse into a "Filter" button on mobile, opens a Sheet

#### REQ-FE-522: Q&A List Items

The system shall render Q&A questions as list items showing key metadata, consistent with `design/screens/qa/qa-list.pen`.

- `apps/web/components/qa/QAListItem.tsx`
- Displayed per item:
  - Status badge (`OPEN` -> blue, `RESOLVED` -> green, `CLOSED` -> gray)
  - Question title (truncated to 2 lines)
  - Author avatar + name + role badge
  - Course/Material source label
  - Context snippet (selected text, max 1 line, truncated)
  - Answer count with icon
  - Upvote count with icon
  - Relative timestamp (e.g., "3 hours ago")
  - AI suggestion indicator (sparkle icon if AI suggestion available)
- Clicking an item navigates to `/qa/[questionId]`

#### REQ-FE-523: Q&A List Pagination

The system shall support infinite-scroll pagination for the Q&A list using TanStack Query `useInfiniteQuery`.

- Page size: 20 items per page
- "Load more" trigger: intersection observer on sentinel element at list bottom
- Shows loading skeleton cards while fetching next page
- Shows empty state when no questions match filters
- Empty state: illustration + "아직 질문이 없습니다" message + "첫 번째 질문하기" CTA (student only)

#### REQ-FE-524: Q&A List Sort

The system shall provide sort options for the Q&A list.

- Sort options: Newest, Most Upvoted, Most Answers, Unanswered
- Default: Newest
- Sort selection persisted in URL search param (`?sort=newest`)

#### REQ-FE-525: Q&A Notification Badge

**When** a new Q&A notification exists (new answer, AI suggestion ready), **then** the system shall display a badge indicator on the Q&A navigation item.

- `apps/web/components/qa/QANotificationBadge.tsx`
- Count sourced from `qa.store.pendingNotifications`
- Updates via WebSocket `EVENTS.QA_ANSWER_POSTED` and `EVENTS.QA_AI_SUGGESTION_READY` events
- Badge disappears when user visits the Q&A list page

#### REQ-FE-526: Q&A List Skeleton Loading

The system shall display skeleton loading cards while the Q&A list is fetching.

- `apps/web/components/qa/QAListSkeleton.tsx`
- 5 skeleton cards shown on initial load
- Skeleton matches `QAListItem` layout proportions
- Uses `Skeleton` component from SPEC-FE-001

---

### 3.4 Q&A Detail Page (REQ-FE-530 through REQ-FE-540)

#### REQ-FE-530: Q&A Detail Page Route

The system shall provide the Q&A detail page at route `/qa/[questionId]`.

- `apps/web/app/(dashboard)/qa/[questionId]/page.tsx` -- Server Component
- `apps/web/app/(dashboard)/qa/[questionId]/loading.tsx` -- skeleton state
- `apps/web/app/(dashboard)/qa/[questionId]/not-found.tsx` -- 404 for missing questions
- Page title: truncated question title
- Breadcrumb: Dashboard > Q&A > [Question Title]
- Consistent with `design/screens/qa/qa-detail.pen`

#### REQ-FE-531: Question Display

The system shall render the full question content on the Q&A detail page.

- `apps/web/components/qa/QuestionCard.tsx`
- Displayed content:
  - Status badge (top-right)
  - Question title (H1-level heading)
  - Context block: styled blockquote with material name + heading anchor link + selected text
  - Question body: rendered via `MarkdownRenderer` from `components/markdown/`
  - Author info: avatar + name + role badge + "Asked [timestamp]"
  - Upvote button + count (student/instructor can upvote, author cannot)
  - Answer count
  - Action menu (three-dot): Edit (author only), Delete (author or instructor), Change Status (instructor only)

#### REQ-FE-532: AI Answer Suggestion Display

**When** an AI suggestion is available for a question, **then** the system shall render it in a visually distinct AI suggestion block above the human answers.

- `apps/web/components/qa/AIAnswerCard.tsx`
- Distinctive styling: gradient border or AI sparkle icon, "AI 제안 답변" label
- Content: rendered via `MarkdownRenderer` from `components/markdown/`
- Instructor-only actions: "채택하기" (accept as official answer), "수정 후 채택" (edit then accept)
- Students see AI answer as read-only
- **If** no AI suggestion exists yet, the system shall show a "AI 답변 요청" button (student/instructor can trigger)
- **While** AI suggestion is being generated, the system shall show a pulsing skeleton with "AI가 답변을 생성 중..." label

#### REQ-FE-533: Answer Thread Display

The system shall render the answer thread below the question content.

- `apps/web/components/qa/AnswerThread.tsx` -- container
- `apps/web/components/qa/AnswerCard.tsx` -- individual answer
- Answer card displays:
  - Accepted badge ("채택된 답변") for accepted answers (shown first, pinned)
  - Answer body: rendered via `MarkdownRenderer` from `components/markdown/`
  - Author info: avatar + name + role badge + timestamp
  - Upvote button + count
  - Action menu: Edit (author only), Delete (author or instructor)
  - "채택하기" button on unaccepted answers (visible to question author or instructor, only one accepted per question)
- Sort order: accepted answer first, then by upvote count descending, then by created date

#### REQ-FE-534: Answer Submission Form

**When** a user is authenticated, **then** the system shall display an answer submission form below the answer thread.

- `apps/web/components/qa/AnswerForm.tsx`
- Schema: `CreateAnswerSchema` from `@shared/validators/qa.schema`
- Uses `EditorWithPreview` from `components/markdown/` for content input
- Submit button: "답변 등록"
- **If** question status is `CLOSED`, the system shall disable the answer form and show a "이 질문은 종료되었습니다" notice
- On success: answer list refreshed, form reset, scroll to new answer
- On error: inline error message

#### REQ-FE-535: Accept Answer Action

**When** an instructor or question author clicks "채택하기" on an answer, **then** the system shall mark that answer as accepted and update the question status to `RESOLVED`.

- Optimistic update: immediately shows accepted state, reverts on error
- Only one answer can be accepted per question
- Toast: "답변이 채택되었습니다"
- `useAcceptAnswer()` mutation from REQ-FE-503

#### REQ-FE-536: Upvote Interaction

**When** a user clicks the upvote button on a question or answer, **then** the system shall toggle the upvote state with optimistic update.

- Upvote is a toggle: click once to add, click again to remove
- Optimistic update: count changes immediately, reverts on error
- Author cannot upvote their own question/answer (button disabled)
- Unauthenticated users: clicking redirects to login

#### REQ-FE-537: Real-Time Answer Updates

**While** a user is viewing a Q&A detail page, the system shall automatically display new answers as they are posted by other users.

- Subscribe to `EVENTS.QA_ANSWER_POSTED` WebSocket event for the active question
- On event receipt: invalidate `useQADetail` query to refetch
- New answer indicated by smooth scroll to it after refetch
- **If** WebSocket unavailable: poll `GET /questions/[id]` every 30 seconds

#### REQ-FE-538: AI Suggestion Real-Time Update

**While** a user is viewing a Q&A detail page and an AI suggestion is being generated, the system shall automatically display the suggestion when ready.

- Subscribe to `EVENTS.QA_AI_SUGGESTION_READY` WebSocket event
- On event receipt: invalidate query and scroll to AI suggestion block
- **If** WebSocket unavailable: poll every 15 seconds for questions with pending AI suggestion

#### REQ-FE-539: Question Edit Flow

**When** a question author clicks "수정" on their question, **then** the system shall switch the question display to an inline edit form.

- `apps/web/components/qa/QuestionEditForm.tsx`
- Pre-fills current title and content
- Uses `EditorWithPreview` from `components/markdown/` for content editing
- Same `CreateQuestionSchema` validation
- "저장" and "취소" buttons
- Context (selected text, material) is not editable
- On save: optimistic update with server sync

#### REQ-FE-540: Instructor Moderation Actions

**Where** the authenticated user has `INSTRUCTOR` role, the system shall provide additional moderation controls on the Q&A detail page.

- Status change dropdown: Open -> Resolved -> Closed
- "Close" action shows confirmation dialog
- Delete question: confirmation dialog ("질문과 모든 답변이 삭제됩니다")
- Delete answer: confirmation dialog
- Instructor badge shown next to instructor responses for trust signaling

---

### 3.5 Q&A Notification System (REQ-FE-545 through REQ-FE-548)

#### REQ-FE-545: WebSocket Connection for Q&A

The system shall establish a WebSocket subscription to receive Q&A events when the user is authenticated.

- `apps/web/hooks/qa/useQAWebSocket.ts` -- React hook subscribing to Q&A-specific WebSocket events
- WebSocket connection management follows the pattern established in `apps/web/hooks/dashboard/` (e.g., `useTeamRealtimeUpdates.ts`, `useStudentRealtimeUpdates.ts`)
- Reconnection logic: exponential backoff, max 5 retries
- Subscribes to: `EVENTS.QA_ANSWER_POSTED`, `EVENTS.QA_AI_SUGGESTION_READY`, `EVENTS.QA_QUESTION_RESOLVED`

#### REQ-FE-546: In-App Toast Notifications

**When** the user receives a `EVENTS.QA_ANSWER_POSTED` event for a question they authored, **then** the system shall show a Toast notification.

- Toast content: "[답변자 이름]님이 답변했습니다" with link to the question
- Uses Sonner toast from SPEC-FE-001
- Toast duration: 6 seconds
- Clicking toast navigates to the Q&A detail page

#### REQ-FE-547: AI Suggestion Toast Notification

**When** the user receives a `EVENTS.QA_AI_SUGGESTION_READY` event, **then** the system shall show a Toast notification.

- Toast content: "AI가 [질문 제목]에 답변을 제안했습니다"
- Duration: 8 seconds
- Clicking toast navigates to Q&A detail page, scrolling to AI suggestion block

#### REQ-FE-548: Notification Persistence in Store

The system shall track unread Q&A notifications in `qa.store.pendingNotifications` until the user visits the relevant page.

- On `QA_ANSWER_POSTED` event: add to store if user is not currently viewing that question
- On `QA_AI_SUGGESTION_READY` event: add to store if user is not currently viewing that question
- Notifications cleared when user visits the Q&A list or the specific question's detail page

---

### 3.6 Unwanted Behavior Requirements

#### REQ-FE-N500: No Popup on Short Selection

**If** the selected text length is fewer than 5 characters, **then** the system shall not open the inline Q&A popup.

#### REQ-FE-N501: No Duplicate Submissions

**If** a question or answer submission is in progress, **then** the system shall prevent duplicate submission by disabling the submit button.

#### REQ-FE-N502: No Student Moderation Actions

**If** the authenticated user role is `STUDENT`, **then** the system shall not render instructor-only moderation controls (status change, close, approve AI answer).

#### REQ-FE-N503: No Unauthenticated Submissions

**If** the user is not authenticated, **then** the system shall not render the answer form or the Q&A popup's submit flow; redirect to login instead.

#### REQ-FE-N504: No Self-Upvote

**If** the authenticated user is the author of a question or answer, **then** the system shall disable the upvote button for that item.

#### REQ-FE-N505: No Unrendered Markdown

The system shall not display raw Markdown syntax to end users; all Markdown content must be rendered through `MarkdownRenderer` from `components/markdown/` before display.

#### REQ-FE-N506: No Answer on Closed Questions

**If** a question has `CLOSED` status, **then** the system shall disable the answer submission form and render it as read-only.

---

## 4. Specifications

### 4.1 Type Definitions

```typescript
// packages/shared/src/types/qa.types.ts

// Status
export enum QAStatus {
  OPEN = 'OPEN',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

// Context captured from material viewer text selection
export interface QAQuestionContext {
  materialId: string;
  headingId: string | null;     // heading anchor ID from QaSelectionTrigger
  selectedText: string;          // original selected text (max 500 chars)
}

// Author info embedded in questions and answers
export interface QAAuthorInfo {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: UserRole;               // from @shared/types/auth.types
}

// Full question (detail view)
export interface QAQuestion {
  id: string;
  courseId: string;
  courseName: string;
  materialId: string;
  materialTitle: string;
  authorId: string;
  author: QAAuthorInfo;
  title: string;
  content: string;              // Markdown
  context: QAQuestionContext;
  status: QAStatus;
  upvoteCount: number;
  isUpvoted: boolean;
  answerCount: number;
  aiSuggestion: QAAnswer | null;
  aiSuggestionPending: boolean;
  createdAt: string;            // ISO 8601
  updatedAt: string;
}

// List item (abbreviated for list rendering)
export interface QAListItem {
  id: string;
  courseId: string;
  courseName: string;
  materialId: string;
  materialTitle: string;
  author: QAAuthorInfo;
  title: string;
  context: Pick<QAQuestionContext, 'selectedText'>;
  status: QAStatus;
  upvoteCount: number;
  answerCount: number;
  hasAiSuggestion: boolean;
  createdAt: string;
}

// Answer (human or AI-generated)
export interface QAAnswer {
  id: string;
  questionId: string;
  authorId: string;
  author: QAAuthorInfo;
  content: string;              // Markdown
  isAccepted: boolean;
  isAiGenerated: boolean;
  upvoteCount: number;
  isUpvoted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Request payloads
export interface QACreateRequest {
  courseId: string;
  materialId: string;
  title: string;
  content: string;
  context: QAQuestionContext;
}

export interface QAAnswerRequest {
  content: string;
}

// List filter params
export interface QAListFilter {
  courseId?: string;
  materialId?: string;
  status?: QAStatus | 'ALL';
  q?: string;
  sort?: 'newest' | 'upvotes' | 'answers' | 'unanswered';
  page: number;
  limit: number;
}

// Notification payload from WebSocket
export interface QANotification {
  id: string;
  type: 'NEW_ANSWER' | 'AI_SUGGESTION_READY' | 'QUESTION_RESOLVED';
  questionId: string;
  questionTitle: string;
  actorName?: string;
  receivedAt: string;
}
```

### 4.2 WebSocket Event Constants Extension

Add to the existing `EVENTS` object in `packages/shared/src/constants/events.ts`:

```typescript
// Inside existing EVENTS object:
export const EVENTS = {
  // ... existing events unchanged ...

  // Q&A events (existing)
  QA_QUESTION_POSTED: "qa:question_posted",
  QA_ANSWER_POSTED: "qa:answer_posted",

  // Q&A events (NEW - added by SPEC-FE-006)
  QA_AI_SUGGESTION_READY: "qa:ai_suggestion_ready",
  QA_QUESTION_RESOLVED: "qa:question_resolved",

  // ... rest of existing events ...
} as const;
```

### 4.3 File Structure

```
apps/web/
  app/
    (dashboard)/
      courses/[courseId]/materials/[materialId]/
        page.tsx                        # EXISTING: replace openQaPopupPlaceholder with real handler
      qa/
        page.tsx                        # NEW: Q&A list page (Server Component)
        layout.tsx                      # NEW: Q&A section layout (optional)
        loading.tsx                     # NEW: Q&A list skeleton
        [questionId]/
          page.tsx                      # NEW: Q&A detail page (Server Component)
          loading.tsx                   # NEW: Q&A detail skeleton
          not-found.tsx                 # NEW: 404 for invalid question ID

  components/
    materials/
      QaSelectionTrigger.tsx            # EXISTING: no changes needed
    markdown/
      MarkdownEditor.tsx               # EXISTING: reused by Q&A forms
      EditorWithPreview.tsx            # EXISTING: reused by Q&A popup and answer form
      MarkdownRenderer.tsx             # EXISTING: reused for rendering Q&A content
      index.ts                         # EXISTING: exports all markdown components
    qa/                                # NEW: Q&A-specific components
      QAInlinePopup.tsx                # Inline popup triggered by QaSelectionTrigger
      QAInlinePopupMobile.tsx          # Mobile Sheet variant
      QAFilterBar.tsx                  # List filter bar (course/material/status/search)
      QAListItem.tsx                   # Q&A question list row
      QAListSkeleton.tsx              # Skeleton for list loading
      QANotificationBadge.tsx          # Badge for nav item
      QuestionCard.tsx                 # Full question display (detail page)
      QuestionEditForm.tsx             # Inline edit form for question
      AIAnswerCard.tsx                 # AI suggestion display block
      AnswerThread.tsx                 # Answer list container
      AnswerCard.tsx                   # Individual answer display
      AnswerForm.tsx                   # Answer submission form
      QAStatusBadge.tsx               # Status badge (open/resolved/closed)
      QAAIRequestButton.tsx            # "AI 답변 요청" trigger button

  hooks/qa/                            # NEW: Q&A query/mutation hooks
    useQAList.ts                       # TanStack Query: paginated Q&A list
    useQADetail.ts                     # TanStack Query: question detail + answers
    useCreateQuestion.ts               # Mutation: create question
    useCreateAnswer.ts                 # Mutation: post answer
    useAcceptAnswer.ts                 # Mutation: accept answer
    useUpvoteQuestion.ts               # Mutation: upvote question (optimistic)
    useUpvoteAnswer.ts                 # Mutation: upvote answer (optimistic)
    useChangeQuestionStatus.ts         # Mutation: change question status
    useRequestAISuggestion.ts          # Mutation: trigger AI suggestion
    useQAWebSocket.ts                  # WebSocket subscription for Q&A events

  stores/
    material.store.ts                  # EXISTING: selectedText, selectionAnchorRect
    qa.store.ts                        # NEW: Zustand: popup, notifications, WS state

packages/shared/
  src/
    types/
      qa.types.ts                      # Q&A type definitions (enriched)
    validators/
      qa.schema.ts                     # NEW: Q&A Zod schemas
    constants/
      events.ts                        # EXISTING: EVENTS object extended with 2 new Q&A events
```

### 4.4 Component Architecture

#### QAInlinePopup Integration with QaSelectionTrigger

```
Material Page (app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx)
  ├── QaSelectionTrigger (EXISTING - components/materials/)
  │     └── User selects text -> floating button appears
  │     └── User clicks button -> onOpenQaPopup callback fires
  │
  ├── handleOpenQaPopup (NEW - replaces openQaPopupPlaceholder)
  │     └── Validates selectedText.length >= 5
  │     └── Calls qa.store.openInlinePopup(anchorRect, context)
  │
  └── QAInlinePopup (NEW - components/qa/)
        ├── Reads state from qa.store.inlinePopup
        ├── Context snippet (blockquote)
        ├── Title input (React Hook Form)
        ├── EditorWithPreview (EXISTING - components/markdown/)
        └── Submit / Cancel buttons
```

#### QAInlinePopup Positioning Algorithm

```
1. Get anchorRect from qa.store.inlinePopup.anchorRect
2. Calculate preferred position: { top: anchorRect.bottom + 8, left: anchorRect.left }
3. If popup bottom > window.innerHeight - 20px: flip to above (top: anchorRect.top - popupHeight - 8)
4. If popup right > window.innerWidth - 20px: shift left to fit
5. On mobile (< 768px): ignore positioning, render as Sheet (bottom slide-up)
```

#### useQAWebSocket Hook Signature

```typescript
function useQAWebSocket(options: {
  onNewAnswer?: (payload: { questionId: string; answerId: string; actorName: string }) => void;
  onAiSuggestionReady?: (payload: { questionId: string }) => void;
  onQuestionResolved?: (payload: { questionId: string }) => void;
}): { isConnected: boolean }
```

### 4.5 Q&A Store Shape

```typescript
interface QAStore {
  // Inline popup
  inlinePopup: {
    isOpen: boolean;
    anchorRect: DOMRect | null;
    context: QAQuestionContext | null;
  };
  // Navigation
  activeQuestionId: string | null;
  // Real-time
  wsConnected: boolean;
  pendingNotifications: QANotification[];
  // Actions
  openInlinePopup: (anchorRect: DOMRect, context: QAQuestionContext) => void;
  closeInlinePopup: () => void;
  setActiveQuestion: (id: string) => void;
  clearActiveQuestion: () => void;
  setWsConnected: (connected: boolean) => void;
  addNotification: (notification: QANotification) => void;
  clearNotification: (id: string) => void;
  clearAllNotifications: () => void;
}
```

### 4.6 API Endpoint Mapping

| Hook | Method | Endpoint | Query Key |
|------|--------|----------|-----------|
| `useQAList` | GET | `/api/v1/qa/questions` | `['qa', 'list', filter]` |
| `useQADetail` | GET | `/api/v1/qa/questions/:id` | `['qa', 'detail', id]` |
| `useCreateQuestion` | POST | `/api/v1/qa/questions` | invalidates `['qa', 'list']` |
| `useCreateAnswer` | POST | `/api/v1/qa/questions/:id/answers` | invalidates `['qa', 'detail', id]` |
| `useAcceptAnswer` | PATCH | `/api/v1/qa/questions/:id/answers/:aid/accept` | invalidates detail |
| `useUpvoteQuestion` | POST | `/api/v1/qa/questions/:id/upvote` | optimistic update on detail |
| `useUpvoteAnswer` | POST | `/api/v1/qa/questions/:id/answers/:aid/upvote` | optimistic update |
| `useChangeQuestionStatus` | PATCH | `/api/v1/qa/questions/:id/status` | invalidates detail + list |
| `useRequestAISuggestion` | POST | `/api/v1/qa/questions/:id/ai-suggest` | invalidates detail |

### 4.7 WebSocket Event Payload Shapes

```typescript
// EVENTS.QA_ANSWER_POSTED (existing event name)
{
  type: 'QA_ANSWER_POSTED',
  questionId: string,
  answerId: string,
  actorName: string,
  questionTitle: string,
  recipientIds: string[],
}

// EVENTS.QA_AI_SUGGESTION_READY (new event)
{
  type: 'QA_AI_SUGGESTION_READY',
  questionId: string,
  questionTitle: string,
  recipientIds: string[],
}

// EVENTS.QA_QUESTION_RESOLVED (new event)
{
  type: 'QA_QUESTION_RESOLVED',
  questionId: string,
  courseId: string,
}
```

### 4.8 Role-Based Feature Matrix

| Feature | STUDENT | INSTRUCTOR |
|---------|---------|------------|
| View Q&A list | Yes | Yes |
| Filter Q&A list | Yes | Yes |
| Open inline popup (via QaSelectionTrigger) | Yes | No (trigger hidden) |
| Submit question via popup | Yes | No (trigger hidden) |
| Submit question via Q&A list page | Yes | Yes |
| Edit own question | Yes | Yes |
| Delete own question | Yes | Yes |
| Delete any question | No | Yes |
| Upvote question | Yes (not own) | Yes (not own) |
| View AI suggestion | Yes (read-only) | Yes |
| Request AI suggestion | Yes | Yes |
| Approve/accept AI suggestion | No | Yes |
| Submit answer | Yes | Yes |
| Edit own answer | Yes | Yes |
| Delete own answer | Yes | Yes |
| Delete any answer | No | Yes |
| Accept answer (mark as resolved) | Yes (own question only) | Yes (any) |
| Upvote answer | Yes (not own) | Yes (not own) |
| Change question status | No | Yes |
| Close question | No | Yes |

> Note: The `QaSelectionTrigger` component is hidden for instructor role (`role === "instructor"` returns null). However, instructors can still ask questions via the Q&A list page using a "New Question" button that does not require text selection context.

### 4.9 Traceability Matrix

| Requirement | Design Reference | Foundation Dependency |
|------------|-----------------|----------------------|
| REQ-FE-510 (Text Selection Trigger) | design/screens/qa/qa-popup.pen | SPEC-FE-004 `QaSelectionTrigger.onOpenQaPopup` |
| REQ-FE-511 (Popup Layout) | design/screens/qa/qa-popup.pen | SPEC-FE-001 Dialog, Sheet |
| REQ-FE-512 (Popup A11y) | WCAG 2.1 AA | SPEC-FE-001 Dialog (Radix UI) |
| REQ-FE-513 (Popup Form) | design/screens/qa/qa-popup.pen | SPEC-FE-001 Form, React Hook Form |
| REQ-FE-514 (Markdown Reuse) | -- | SPEC-FE-004 `components/markdown/` suite |
| REQ-FE-520 (Q&A List Route) | design/screens/qa/qa-list.pen | SPEC-FE-001 layout |
| REQ-FE-521 (Filter Bar) | design/screens/qa/qa-list.pen | SPEC-FE-001 Select, Sheet |
| REQ-FE-522 (List Items) | design/screens/qa/qa-list.pen | SPEC-FE-001 Card, Badge, Avatar |
| REQ-FE-523 (Pagination) | design/screens/qa/qa-list.pen | SPEC-FE-001 QueryProvider |
| REQ-FE-525 (Notification Badge) | design/screens/qa/qa-list.pen | SPEC-FE-001 Badge |
| REQ-FE-530 (Detail Route) | design/screens/qa/qa-detail.pen | SPEC-FE-001 layout |
| REQ-FE-531 (Question Display) | design/screens/qa/qa-detail.pen | SPEC-FE-001 Card, Badge, Avatar |
| REQ-FE-532 (AI Answer) | design/screens/qa/qa-detail.pen | SPEC-FE-001 Skeleton |
| REQ-FE-533 (Answer Thread) | design/screens/qa/qa-detail.pen | SPEC-FE-001 Card, Avatar |
| REQ-FE-534 (Answer Form) | design/screens/qa/qa-detail.pen | SPEC-FE-004 `EditorWithPreview` |
| REQ-FE-535 (Accept Answer) | design/screens/qa/qa-detail.pen | SPEC-FE-001 Toast |
| REQ-FE-537 (Real-Time Updates) | -- | SPEC-FE-001 QueryProvider |
| REQ-FE-545 (WebSocket) | -- | `hooks/dashboard/` real-time patterns |
| REQ-FE-546 (Toast Notifications) | -- | SPEC-FE-001 Toast (Sonner) |
| REQ-FE-500 (Type Definitions) | -- | SPEC-FE-001 `@shared/types` |
| REQ-FE-502 (WS Events) | -- | Existing `EVENTS` object in `@shared/constants/events` |
| REQ-FE-540 (Moderation) | design/screens/qa/qa-detail.pen | SPEC-FE-002 role check via `useAuthStore` |
