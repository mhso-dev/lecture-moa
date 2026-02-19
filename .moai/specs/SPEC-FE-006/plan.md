---
id: SPEC-FE-006
title: "Q&A System - Implementation Plan"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-006: Q&A System — Implementation Plan

## 1. Implementation Strategy

### 1.1 Development Approach

This SPEC follows the Hybrid methodology:
- **New files**: TDD (RED → GREEN → REFACTOR)
- **Extended files** (`qa.types.ts`, `events.ts`): DDD (ANALYZE → PRESERVE → IMPROVE)

The Q&A system is the core differentiating feature of lecture-moa. Implementation priority reflects its criticality to the product.

### 1.2 Technical Approach

**Dependency Order**: The inline popup depends on SPEC-FE-004 (material viewer). All other Q&A work (list, detail, types, store) can proceed in parallel with FE-004.

**State Architecture**:
- Server state (question data, answers): TanStack Query
- Client UI state (popup visibility, notifications): Zustand `qa.store`
- URL-based filter state: Next.js `useSearchParams` (no Zustand needed)

**Real-Time Strategy**:
- Primary: WebSocket via `lib/ws-client.ts`
- Fallback: Polling with `refetchInterval` (30s for detail, 15s when AI pending)
- The ws-client singleton is initialized once in the root layout

**Markdown Rendering**:
- `MarkdownEditor` (write mode): textarea + toolbar shortcuts
- Preview mode and read-only display: `react-markdown` with `remark-gfm` and `rehype-highlight`
- Reuse the plugin configuration established in SPEC-FE-004

---

## 2. Implementation Milestones

### Primary Goal — Foundation: Types, Store, Hooks

Covers: REQ-FE-500 through REQ-FE-504

**Tasks**:
1. Enrich `packages/shared/src/types/qa.types.ts` with all Q&A types
2. Add `CreateQuestionSchema`, `CreateAnswerSchema`, `QAListFilterSchema` to `packages/shared/src/validators/qa.schema.ts`
3. Add `QA_EVENTS` constants to `packages/shared/src/constants/events.ts`
4. Implement `apps/web/stores/qa.store.ts` with Zustand (popup, notifications, ws state)
5. Implement all TanStack Query hooks in `apps/web/hooks/qa/`
6. Extend `apps/web/lib/ws-client.ts` with Q&A event subscription support

**Quality gate**: TypeScript compilation passes, unit tests for store actions pass, hook types match API contracts

---

### Primary Goal — Q&A List Page

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

### Primary Goal — Q&A Detail Page

Covers: REQ-FE-530 through REQ-FE-540

**Tasks**:
1. Create `app/(dashboard)/qa/[questionId]/page.tsx` (Server Component)
2. Implement `QuestionCard.tsx` with upvote, context block, Markdown body
3. Implement `AIAnswerCard.tsx` with pending skeleton and instructor approve actions
4. Implement `AnswerThread.tsx` + `AnswerCard.tsx` with accept/upvote
5. Implement `AnswerForm.tsx` with `MarkdownEditor`
6. Implement `QuestionEditForm.tsx` (inline edit)
7. Implement instructor moderation actions (status change, delete)
8. Wire real-time updates (WebSocket subscription + polling fallback)

**Quality gate**: Role-based UI renders correctly for STUDENT/INSTRUCTOR, accepted answer pins to top, optimistic updates revert on error

---

### Primary Goal — Inline Q&A Popup

Covers: REQ-FE-510 through REQ-FE-516

**Tasks**:
1. Implement `MarkdownEditor.tsx` as a standalone reusable component
2. Implement `QAInlinePopup.tsx` with positioning algorithm
3. Implement `QAInlinePopupMobile.tsx` (Sheet variant)
4. Wire `onSelectionIntent` callback from MaterialViewer
5. Integrate popup form with `useCreateQuestion` hook
6. Add focus management and keyboard navigation (Escape to close)

**Dependencies**: Requires SPEC-FE-004 to expose `onSelectionIntent`

**Quality gate**: Popup positions correctly across viewport sizes, mobile Sheet renders, focus trap works, form validation prevents submission of short text

---

### Secondary Goal — Notification System

Covers: REQ-FE-545 through REQ-FE-548

**Tasks**:
1. Implement `useQAWebSocket.ts` hook with event routing
2. Wire WebSocket events to store (`addNotification`)
3. Implement Toast notifications for new answers and AI suggestions
4. Badge count in sidebar Q&A nav item
5. Polling fallback when WebSocket unavailable

**Quality gate**: Notifications appear within 1s of WebSocket event, badge count accurate, polling activates when WS disconnects

---

### Final Goal — Accessibility and Quality

Covers: WCAG 2.1 AA + TRUST 5

**Tasks**:
1. ARIA audit for all Q&A components (roles, labels, live regions)
2. Keyboard navigation test: Tab order through popup, detail page actions
3. Screen reader test with VoiceOver (macOS) or NVDA (Windows)
4. Color contrast verification for status badges and AI suggestion block
5. Focus management audit (popup open/close, answer submission)
6. Unit test coverage audit (target 85%)
7. E2E smoke test: text selection → popup → submit question → detail page

---

## 3. Technical Architecture

### 3.1 Component Dependency Graph

```
MaterialViewer (FE-004)
    └─ onSelectionIntent ──▶ QAInlinePopup
                                 └─ MarkdownEditor
                                 └─ useCreateQuestion

app/(dashboard)/qa/page.tsx
    └─ QAFilterBar
    └─ QAListItem (× N)
        └─ QAStatusBadge
        └─ QANotificationBadge
    └─ QAListSkeleton

app/(dashboard)/qa/[questionId]/page.tsx
    └─ QuestionCard
        └─ MarkdownEditor (edit mode)
        └─ QAStatusBadge
    └─ AIAnswerCard
    └─ AnswerThread
        └─ AnswerCard (× N)
    └─ AnswerForm
        └─ MarkdownEditor
```

### 3.2 Real-Time Architecture

```
WebSocket Server (apps/api)
    │
    ▼
ws-client.ts (singleton, apps/web/lib)
    │
    ▼
useQAWebSocket.ts (hook, subscribes per Q&A events)
    │
    ├──▶ qa.store.addNotification() ──▶ QANotificationBadge
    │
    ├──▶ queryClient.invalidateQueries(['qa', 'detail', id])
    │        └──▶ QuestionCard refresh
    │        └──▶ AIAnswerCard refresh
    │        └──▶ AnswerThread refresh
    │
    └──▶ Toast notification (Sonner)
```

### 3.3 Optimistic Update Strategy

| Action | Optimistic Update | Rollback |
|--------|-------------------|---------|
| Upvote question | Increment count + toggle state | Revert to previous count |
| Upvote answer | Increment count + toggle state | Revert to previous count |
| Accept answer | Set `isAccepted: true` on answer | Revert to false |
| Create question | N/A (navigate to detail) | Show error toast |
| Create answer | Append to answer list | Remove from list |

---

## 4. Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| FE-004 popup trigger API changes | Medium | High | Define interface contract in this SPEC (REQ-FE-510) early |
| Popup positioning on edge cases (near viewport boundaries) | High | Medium | Implement viewport-aware flip algorithm, test at 375px |
| WebSocket connection reliability | Medium | Medium | Polling fallback with `refetchInterval` |
| Markdown XSS in user content | Low | High | `rehype-sanitize` plugin added to react-markdown pipeline |
| AI suggestion latency (>10s) | High | Medium | Pending skeleton with "AI가 생성 중..." label, polling |
| Optimistic update conflicts (concurrent upvotes) | Low | Low | Server count is authoritative; UI reverts on error |

---

## 5. Definition of Done

- All requirements REQ-FE-500 through REQ-FE-548 implemented
- TypeScript strict mode: zero type errors
- ESLint: zero errors
- Unit test coverage: >= 85% for hooks, store, and utility functions
- Component tests: QAInlinePopup, QAListItem, QuestionCard, AnswerCard, MarkdownEditor
- E2E test: text selection → question submit → answer submit → accept answer flow
- WCAG 2.1 AA: passes axe-core audit with zero violations
- Responsive layout: verified at 375px, 768px, 1280px
- Role-based UI: verified for STUDENT and INSTRUCTOR sessions
- Real-time: WebSocket event handling verified in integration tests
- Design tokens: no hardcoded colors or spacing values
