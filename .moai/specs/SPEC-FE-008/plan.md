---
id: SPEC-FE-008
title: "Team and Memo System — Implementation Plan"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-008: Team and Memo System — Implementation Plan

> TAG: SPEC-FE-008

## 1. Implementation Strategy

### 1.1 Development Methodology

This SPEC uses **Hybrid mode** (as configured in `.moai/config/sections/quality.yaml`):
- New files and components → TDD (RED-GREEN-REFACTOR)
- Enriching existing shared types → DDD (ANALYZE-PRESERVE-IMPROVE)

### 1.2 Domain Decomposition

The implementation is divided into four logical domains, each independently testable:

| Domain | Scope | Priority |
|--------|-------|----------|
| A. Shared Types | Type enrichment + Zod schemas in `packages/shared` | High |
| B. Team Feature | Team list, creation, detail, membership | High |
| C. Team Memo Board | Team memo board, WebSocket skeleton | High |
| D. Personal Memo | Memo list, memo editor, auto-save, view | Medium |

### 1.3 Rendering Strategy per Route

| Route | Strategy | Rationale |
|-------|----------|-----------|
| `app/teams/page.tsx` | Server Component + Client shell | SSR initial data, client filters |
| `app/teams/new/page.tsx` | Client Component | Form-heavy, no SEO benefit |
| `app/teams/[teamId]/page.tsx` | Server Component + Client tabs | SSR team metadata, client interactivity |
| `app/memos/page.tsx` | Server Component + Client filters | SSR first page, client-side search |
| `app/memos/new/page.tsx` | Client Component | Editor state, auto-save |
| `app/memos/[memoId]/page.tsx` | Server Component | Static content, SEO |
| `app/memos/[memoId]/edit/page.tsx` | Client Component | Editor state |

---

## 2. Primary Goal — Foundation (Domain A + B Core)

**Objective**: Shared types ready, team list and creation functional, team detail page skeleton.

### 2.1 Domain A: Shared Type Enrichment

**Requirements covered**: REQ-FE-700 through REQ-FE-704

#### Tasks

1. Analyze existing `packages/shared/src/types/team.types.ts` and `memo.types.ts` skeletons
2. Enrich `team.types.ts` with full `Team`, `TeamMember`, `TeamRole`, `TeamActivity` types
3. Enrich `memo.types.ts` with full `Memo`, `MemoTag`, `MemoVisibility`, `MemoLinkTarget` types
4. Create `packages/shared/src/validators/team.schema.ts` with `CreateTeamSchema`, `UpdateTeamSchema`
5. Create `packages/shared/src/validators/memo.schema.ts` with `CreateMemoSchema`, `UpdateMemoSchema`
6. Add team API response types to `packages/shared/src/types/api.types.ts`
7. Add memo API response types and `MemoFilterParams` type
8. Add WebSocket event constants to `packages/shared/src/constants/events.ts`
9. Update barrel export `packages/shared/src/index.ts`

**Verification**: TypeScript compiles without errors across all workspace packages.

### 2.2 Domain B Core: Zustand Stores + TanStack Query Hooks

**Requirements covered**: REQ-FE-780 through REQ-FE-789

#### Tasks

1. Create `apps/web/stores/team.store.ts` (currentTeamId, activeTab)
2. Create `apps/web/stores/memo.store.ts` (editorMode, isDirty, lastSavedAt)
3. Extend `apps/web/stores/ui.store.ts` with `teamSocketStatus`
4. Create `apps/web/hooks/useTeams.ts` (useMyTeams, useAvailableTeams)
5. Create `apps/web/hooks/useTeam.ts` (useTeamDetail, useTeamMembers, useTeamActivity)
6. Create `apps/web/hooks/useTeamMutations.ts` (useCreateTeam, useUpdateTeam, useDeleteTeam)
7. Create `apps/web/hooks/useTeamMembership.ts` (joinTeam, leaveTeam, inviteMember, removeMember, changeMemberRole)
8. Create `apps/web/hooks/useMemos.ts` (usePersonalMemos, useTeamMemos with useInfiniteQuery)
9. Create `apps/web/hooks/useMemo.ts` (useMemoDetail, useCreateMemo, useUpdateMemo, useDeleteMemo)

### 2.3 Domain B: Team List Page

**Requirements covered**: REQ-FE-710 through REQ-FE-714

#### Tasks

1. Create `apps/web/components/team/TeamCard.tsx`
2. Create `app/teams/page.tsx` (Server Component, initial data fetch)
3. Create client shell for My Teams and Browse Teams sections
4. Implement search input with 300ms debounce
5. Handle empty states for both sections
6. Handle join/view button states based on membership

### 2.4 Domain B: Team Creation Form

**Requirements covered**: REQ-FE-715 through REQ-FE-718

#### Tasks

1. Create `app/teams/new/page.tsx` with access guard (redirect if unauthenticated)
2. Implement form using React Hook Form + `CreateTeamSchema`
3. Implement multi-select course association picker
4. Connect form submission to `useCreateTeam` mutation
5. Handle success redirect and error toast display

---

## 3. Secondary Goal — Team Detail + Team Memo Board (Domain B Full + C)

**Objective**: Team detail fully functional with all 4 tabs; team memo board with WebSocket skeleton.

### 3.1 Domain B: Team Detail Page

**Requirements covered**: REQ-FE-720 through REQ-FE-727

#### Tasks

1. Create `app/teams/[teamId]/layout.tsx` (team header, breadcrumb)
2. Create `app/teams/[teamId]/page.tsx` (Server Component, initial team data)
3. Create `apps/web/components/team/TeamDetailTabs.tsx` with URL hash sync
4. Implement **Members Tab**:
   - `MemberListItem.tsx` with role badge and actions
   - `InviteMemberModal.tsx` with email input
   - Role change + remove member actions (TEAM_LEAD only)
5. Implement **Shared Materials Tab** (read-only material list with link)
6. Implement **Activity Tab**:
   - `ActivityFeedItem.tsx` with relative timestamps
   - "Load more" pagination

### 3.2 Domain C: Team Memo Board

**Requirements covered**: REQ-FE-740 through REQ-FE-745

#### Tasks

1. Create `apps/web/components/team/TeamMemoBoard.tsx`
2. Create `apps/web/components/memo/MemoCard.tsx` (used in team board)
3. Implement `useTeamMemoSocket.ts` (WebSocket connection, event handling)
4. Create `apps/web/components/team/LiveIndicator.tsx`
5. Implement infinite scroll with Intersection Observer
6. Handle empty state for team memo board

---

## 4. Final Goal — Personal Memo System (Domain D)

**Objective**: Full personal memo list, editor (with auto-save), and view page.

### 4.1 Domain D: Personal Memo List

**Requirements covered**: REQ-FE-750 through REQ-FE-754

#### Tasks

1. Create `app/memos/page.tsx` (Server Component)
2. Create client filter sidebar/sheet component
3. Implement `MemoListItem.tsx` (with Markdown stripping for preview)
4. Implement multi-filter: search, course, material, tags, visibility
5. Handle all empty state variations
6. Implement sort controls (Newest, Oldest, Last modified, Title A-Z)

### 4.2 Domain D: Memo Editor

**Requirements covered**: REQ-FE-760 through REQ-FE-768

#### Tasks

1. Create `app/memos/new/page.tsx` (redirect if unauthenticated)
2. Create `app/memos/[memoId]/edit/page.tsx`
3. Create `apps/web/components/memo/MemoEditor.tsx` (split-pane: write | preview | split modes)
4. Implement form fields: Title, Tags (chip input), Link Material, Team toggle
5. Create `MaterialLinkDialog.tsx` (course → material → anchor picker)
6. Implement `useAutoSave.ts` hook (localStorage, 30s interval)
7. Implement `useBeforeUnload.ts` hook (unsaved changes guard)
8. Implement `DraftRestoreBanner` component
9. Implement keyboard shortcuts (Ctrl+B, Ctrl+I, Ctrl+K, Ctrl+S, Tab)
10. Connect form to `useCreateMemo` / `useUpdateMemo` mutations

### 4.3 Domain D: Memo View Page

**Requirements covered**: REQ-FE-770 through REQ-FE-772

#### Tasks

1. Create `app/memos/[memoId]/page.tsx` (Server Component)
2. Render memo with `MarkdownRenderer` from SPEC-FE-004
3. Implement linked material navigation card
4. Implement social actions: copy link, tag navigation, visibility badge

---

## 5. Technical Approach

### 5.1 Infinite Scroll Implementation

```
useInfiniteQuery (TanStack Query v5)
  → fetchNextPage when Intersection Observer fires
  → getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined
  → Renders flat list from pages[].items
```

### 5.2 Markdown Stripping for Previews

Use a lightweight regex-based stripping function in a shared utility:
- `packages/shared/src/utils/markdown.ts` → add `stripMarkdown(content: string): string`
- Removes headings, bold, italic, links, code blocks, images
- Applied in `MemoCard` and `MemoListItem` preview rendering

### 5.3 Auto-Save Architecture

```
useAutoSave(content, memoId, intervalMs = 30000)
  → setInterval → save to localStorage
  → cleanup on unmount (clearInterval)
  → returns { hasDraft, clearDraft, restoreDraft }
```

### 5.4 WebSocket Integration

The WebSocket client from SPEC-FE-001 (`lib/websocket.ts`) is extended minimally:
- `useTeamMemoSocket` wraps the client and exposes connection status
- Event listeners invalidate TanStack Query caches (no complex state sync)
- This avoids requiring a full collaborative editing library in this SPEC

### 5.5 Tag Chip Input

No external library required. Implemented as:
- Controlled `<input>` that appends tags on `Enter` or `,`
- Tags stored as `string[]` in React Hook Form's `control`
- Displayed as dismissible `Badge` chips (shadcn/ui `Badge` component)
- Max 10 tags enforced in Zod schema + UI feedback

### 5.6 Access Control Pattern

```typescript
// Server Component page guard pattern
const session = await getServerSession(authOptions)
if (!session) redirect('/login?next=/teams/new')

// Client Component guard via useAuth hook (SPEC-FE-002)
const { user, isAuthenticated } = useAuth()
if (!isAuthenticated) return <Redirect to="/login" />
```

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| SPEC-FE-004 MarkdownRenderer API not finalized | Medium | High | Wrap in adapter component; use fallback `<pre>` if unavailable |
| SPEC-FE-005 course types not yet available | Medium | Low | Use `string` placeholder for courseId; graceful degradation |
| WebSocket backend not ready during development | High | Low | Mock WebSocket events in development using MSW or local event emitter |
| Auto-save localStorage conflict across tabs | Low | Low | Include `userId` in storage key: `memo-draft-${userId}-${memoId}` |
| Team memo infinite scroll performance | Low | Medium | Virtualize list with `@tanstack/react-virtual` if > 100 items per team |

---

## 7. Definition of Done

### Per Task
- [ ] Component/hook renders without TypeScript errors
- [ ] Vitest unit test written and passing (TDD: test before implementation)
- [ ] WCAG 2.1 AA: aria-labels, keyboard navigation verified
- [ ] Responsive: tested at 375px, 768px, 1280px
- [ ] Design token compliance: no arbitrary CSS values

### Per Domain
- [ ] All requirements in domain implemented and testable
- [ ] TanStack Query cache invalidation verified with React Query DevTools
- [ ] Error states (API failure, network error) handled with toast notifications
- [ ] Empty states rendered for all data-dependent components

### SPEC-FE-008 Complete
- [ ] All REQ-FE-700 through REQ-FE-789 implemented
- [ ] Shared types compile without errors across all workspace packages
- [ ] 85%+ test coverage on new components and hooks
- [ ] No `any` types in TypeScript (strict mode compliance)
- [ ] TRUST 5 quality gates passed (Tested, Readable, Unified, Secured, Trackable)
