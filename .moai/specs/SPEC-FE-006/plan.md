---
id: SPEC-FE-006
title: "Q&A System - Implementation Plan"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-006: Q&A System -- Implementation Plan

## 1. Implementation Strategy

### 1.1 Development Approach

This SPEC follows the Hybrid methodology:

- **New files**: TDD (RED -> GREEN -> REFACTOR)
- **Extended files** (`qa.types.ts`, `events.ts`, material page): DDD (ANALYZE -> PRESERVE -> IMPROVE)

The Q&A system is the core differentiating feature of lecture-moa. Implementation priority reflects its criticality to the product.

### 1.2 Technical Approach

**Dependency Order**: The inline popup integration requires the existing `QaSelectionTrigger` component from SPEC-FE-004 (already complete). The material page already integrates the trigger with a placeholder callback -- this SPEC replaces the placeholder.

**State Architecture**:

- Server state (question data, answers): TanStack Query
- Client UI state (popup visibility, notifications): Zustand `qa.store`
- URL-based filter state: Next.js `useSearchParams` (no Zustand needed)

**Real-Time Strategy**:

- Primary: WebSocket subscriptions following the pattern in `apps/web/hooks/dashboard/` (e.g., `useTeamRealtimeUpdates.ts`, `useStudentRealtimeUpdates.ts`)
- Fallback: Polling with `refetchInterval` (30s for detail, 15s when AI pending)
- No singleton WebSocket client file needed -- hook-based pattern used

**Markdown Rendering (REUSE EXISTING)**:

All markdown infrastructure is already available from SPEC-FE-004:

- `EditorWithPreview` from `components/markdown/EditorWithPreview.tsx` for write/preview toggle in Q&A popup and answer form
- `MarkdownRenderer` from `components/markdown/MarkdownRenderer.tsx` for all read-only markdown display
- `MarkdownEditor` from `components/markdown/MarkdownEditor.tsx` for simpler editor needs
- Libraries already installed: react-markdown, remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-sanitize
- No new markdown editor component is created

### 1.3 Existing Assets (DO NOT RECREATE)

The following files already exist and must only be extended or integrated with, not recreated:

| File | Status | Action |
|------|--------|--------|
| `apps/web/components/materials/QaSelectionTrigger.tsx` | Complete | Integrate via `onOpenQaPopup` callback |
| `apps/web/stores/material.store.ts` | Complete | Read `selectedText`/`selectionAnchorRect` (no changes) |
| `apps/web/components/markdown/*` (entire directory) | Complete | Reuse MarkdownRenderer, EditorWithPreview, MarkdownEditor |
| `packages/shared/src/constants/events.ts` | Complete | Extend EVENTS object with 2 new constants |
| `apps/web/lib/api.ts` | Complete | Use for API calls |
| `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx` | Complete | Replace `openQaPopupPlaceholder` with real handler |

---

## 2. Implementation Milestones

### Primary Goal -- Foundation: Types, Store, Hooks

Covers: REQ-FE-500 through REQ-FE-504

**Tasks**:

1. Enrich `packages/shared/src/types/qa.types.ts` with all Q&A types (using `headingId` not `sectionAnchor`)
2. Create `packages/shared/src/validators/qa.schema.ts` with `CreateQuestionSchema`, `CreateAnswerSchema`, `QAListFilterSchema`
3. Extend existing `EVENTS` object in `packages/shared/src/constants/events.ts` with `QA_AI_SUGGESTION_READY` and `QA_QUESTION_RESOLVED`
4. Create `apps/web/stores/qa.store.ts` with Zustand (popup, notifications, ws state)
5. Implement all TanStack Query hooks in `apps/web/hooks/qa/`
6. Create `apps/web/hooks/qa/useQAWebSocket.ts` following the pattern from `hooks/dashboard/`

**Quality gate**: TypeScript compilation passes, unit tests for store actions pass, hook types match API contracts

---

### Primary Goal -- Q&A List Page

Covers: REQ-FE-520 through REQ-FE-526

**Tasks**:

1. Create `app/(dashboard)/qa/page.tsx` (Server Component with prefetch)
2. Implement `QAFilterBar.tsx` with URL search params
3. Implement `QAListItem.tsx` with all metadata fields
4. Implement `QAListSkeleton.tsx`
5. Implement `QANotificationBadge.tsx`
6. Integrate infinite scroll pagination with intersection observer
7. Add empty state and sort controls

**Quality gate**: All filter combinations render correctly, responsive layout at 375/768/1280px, keyboard navigation in filter dropdowns

---

### Primary Goal -- Q&A Detail Page

Covers: REQ-FE-530 through REQ-FE-540

**Tasks**:

1. Create `app/(dashboard)/qa/[questionId]/page.tsx` (Server Component)
2. Implement `QuestionCard.tsx` with upvote, context block, Markdown body (using `MarkdownRenderer`)
3. Implement `AIAnswerCard.tsx` with pending skeleton and instructor approve actions
4. Implement `AnswerThread.tsx` + `AnswerCard.tsx` with accept/upvote
5. Implement `AnswerForm.tsx` using `EditorWithPreview` from `components/markdown/`
6. Implement `QuestionEditForm.tsx` (inline edit using `EditorWithPreview`)
7. Implement instructor moderation actions (status change, delete)
8. Wire real-time updates (WebSocket subscription + polling fallback)

**Quality gate**: Role-based UI renders correctly for STUDENT/INSTRUCTOR, accepted answer pins to top, optimistic updates revert on error

---

### Primary Goal -- Inline Q&A Popup

Covers: REQ-FE-510 through REQ-FE-516

**Tasks**:

1. Implement `QAInlinePopup.tsx` with positioning algorithm
2. Implement `QAInlinePopupMobile.tsx` (Sheet variant)
3. Replace `openQaPopupPlaceholder` in material page with real handler that:
   - Validates `selectedText.length >= 5`
   - Calls `qa.store.openInlinePopup(anchorRect, context)` with `{ materialId, headingId, selectedText }`
4. Integrate popup form with `useCreateQuestion` hook
5. Reuse `EditorWithPreview` from `components/markdown/` for content input (with `initialTab="editor"` for compact mode)
6. Add focus management and keyboard navigation (Escape to close)

**Note**: No new MarkdownEditor component is created. The existing `EditorWithPreview` and `MarkdownEditor` from `components/markdown/` are reused directly.

**Quality gate**: Popup positions correctly across viewport sizes, mobile Sheet renders, focus trap works, form validation prevents submission of short text

---

### Secondary Goal -- Notification System

Covers: REQ-FE-545 through REQ-FE-548

**Tasks**:

1. Implement `useQAWebSocket.ts` hook following `hooks/dashboard/` patterns (NOT creating a singleton ws-client)
2. Wire WebSocket events to store (`addNotification`)
3. Implement Toast notifications for new answers and AI suggestions
4. Badge count in sidebar Q&A nav item
5. Polling fallback when WebSocket unavailable

**Quality gate**: Notifications appear within 1s of WebSocket event, badge count accurate, polling activates when WS disconnects

---

### Final Goal -- Accessibility and Quality

Covers: WCAG 2.1 AA + TRUST 5

**Tasks**:

1. ARIA audit for all Q&A components (roles, labels, live regions)
2. Keyboard navigation test: Tab order through popup, detail page actions
3. Screen reader test with VoiceOver (macOS) or NVDA (Windows)
4. Color contrast verification for status badges and AI suggestion block
5. Focus management audit (popup open/close, answer submission)
6. Unit test coverage audit (target 85%)
7. E2E smoke test: text selection -> floating button -> click -> popup -> submit question -> detail page

---

## 3. Technical Architecture

### 3.1 Component Dependency Graph

```
Material Page (courses/[courseId]/materials/[materialId]/page.tsx)
    ├── QaSelectionTrigger (EXISTING - components/materials/)
    │     └── onOpenQaPopup ──▶ handleOpenQaPopup (NEW handler)
    │                              └── qa.store.openInlinePopup()
    └── QAInlinePopup (NEW - components/qa/)
          ├── EditorWithPreview (EXISTING - components/markdown/)
          └── useCreateQuestion (NEW hook)

app/(dashboard)/qa/page.tsx
    ├── QAFilterBar
    ├── QAListItem (* N)
    │     └── QAStatusBadge
    ├── QANotificationBadge
    └── QAListSkeleton

app/(dashboard)/qa/[questionId]/page.tsx
    ├── QuestionCard
    │     ├── MarkdownRenderer (EXISTING - components/markdown/)
    │     └── QuestionEditForm
    │           └── EditorWithPreview (EXISTING)
    ├── AIAnswerCard
    │     └── MarkdownRenderer (EXISTING)
    ├── AnswerThread
    │     └── AnswerCard (* N)
    │           └── MarkdownRenderer (EXISTING)
    └── AnswerForm
          └── EditorWithPreview (EXISTING)
```

### 3.2 Real-Time Architecture

```
WebSocket Server (apps/api)
    |
    v
useQAWebSocket.ts (hook, follows hooks/dashboard/ pattern)
    |
    +---> qa.store.addNotification() ---> QANotificationBadge
    |
    +---> queryClient.invalidateQueries(['qa', 'detail', id])
    |        +---> QuestionCard refresh
    |        +---> AIAnswerCard refresh
    |        +---> AnswerThread refresh
    |
    +---> Toast notification (Sonner)
```

### 3.3 Optimistic Update Strategy

| Action | Optimistic Update | Rollback |
|--------|-------------------|---------|
| Upvote question | Increment count + toggle state | Revert to previous count |
| Upvote answer | Increment count + toggle state | Revert to previous count |
| Accept answer | Set `isAccepted: true` on answer | Revert to false |
| Create question | N/A (navigate to detail) | Show error toast |
| Create answer | Append to answer list | Remove from list |

### 3.4 Material Page Integration

The material page at `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx` currently has:

```typescript
// Placeholder to be replaced:
const openQaPopupPlaceholder = (
  _selectedText: string,
  _anchorRect: DOMRect,
  _materialId: string,
  _headingId: string | null
) => {
  console.log("Q&A popup will be implemented in SPEC-FE-006");
};
```

SPEC-FE-006 replaces this with a real handler:

```
1. Import useQAStore from ~/stores/qa.store
2. Define handleOpenQaPopup that:
   a. Validates selectedText.length >= 5
   b. Constructs QAQuestionContext: { materialId, headingId, selectedText }
   c. Calls qaStore.openInlinePopup(anchorRect, context)
3. Render QAInlinePopup component conditioned on qaStore.inlinePopup.isOpen
4. Pass handleOpenQaPopup as onOpenQaPopup to QaSelectionTrigger
```

---

## 4. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Popup positioning on edge cases (near viewport boundaries) | High | Medium | Implement viewport-aware flip algorithm, test at 375px |
| WebSocket connection reliability | Medium | Medium | Polling fallback with `refetchInterval` following `hooks/dashboard/` patterns |
| Markdown XSS in user content | Low | High | Already mitigated: `rehype-sanitize` configured in existing `MarkdownRenderer` |
| AI suggestion latency (>10s) | High | Medium | Pending skeleton with "AI가 생성 중..." label, polling |
| Optimistic update conflicts (concurrent upvotes) | Low | Low | Server count is authoritative; UI reverts on error |
| EditorWithPreview size in popup | Medium | Low | Use `initialTab="editor"` and constrained height for compact mode |

---

## 5. Definition of Done

- All requirements REQ-FE-500 through REQ-FE-548 implemented
- TypeScript strict mode: zero type errors
- ESLint: zero errors
- Unit test coverage: >= 85% for hooks, store, and utility functions
- Component tests: QAInlinePopup, QAListItem, QuestionCard, AnswerCard, AnswerForm
- E2E test: text selection -> floating button click -> question submit -> answer submit -> accept answer flow
- WCAG 2.1 AA: passes axe-core audit with zero violations
- Responsive layout: verified at 375px, 768px, 1280px
- Role-based UI: verified for STUDENT and INSTRUCTOR sessions
- Real-time: WebSocket event handling verified in integration tests
- Design tokens: no hardcoded colors or spacing values
- No new markdown editor created -- existing `components/markdown/` components reused
- Material page placeholder replaced with functional Q&A popup integration
- `EVENTS` object extended (not new namespace created)
- All `sectionAnchor` references replaced with `headingId`
