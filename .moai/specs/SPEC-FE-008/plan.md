---
id: SPEC-FE-008
title: "Team and Memo System — Implementation Plan"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-008: Team and Memo System — Implementation Plan

> TAG: SPEC-FE-008

## History

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | 2026-02-19 | Complete rewrite aligned with spec.md v2.0.0. Fixed 12 critical discrepancies: (1) Routes corrected to `app/(dashboard)/teams/`, `app/(dashboard)/memos/`. (2) API endpoints corrected to `/api/v1/teams/`, `/api/v1/memos/`. (3) Hooks directory corrected to subdirectory pattern `hooks/team/`, `hooks/memo/`. (4) EXISTING markers added for EditorWithPreview, MarkdownEditor, useBeforeUnload, useDebounce, dashboard team widgets/hooks. (5) MemoEditor renamed to MemoEditorWrapper (wraps existing EditorWithPreview). (6) useAutoSave renamed to useAutoSaveDraft. (7) useBeforeUnload marked as EXISTING (not created). (8) Role references corrected from TEAM_LEAD/MEMBER to `"leader"`/`"member"`. (9) WebSocket events corrected to namespace:action pattern. (10) API response types referenced from existing api.types.ts. |
| 1.0.0 | 2026-02-19 | Initial draft |

---

## 1. Implementation Strategy

### 1.1 Development Methodology

This SPEC uses **Hybrid mode** (as configured in `.moai/config/sections/quality.yaml`):
- New files and components -> TDD (RED-GREEN-REFACTOR)
- Extending existing shared types and stores -> DDD (ANALYZE-PRESERVE-IMPROVE)

### 1.2 Domain Decomposition

The implementation is divided into four logical domains, each independently testable:

| Domain | Scope | Priority |
|--------|-------|----------|
| A. Shared Types & Constants | Type definitions + Zod schemas + event constants in `packages/shared` | High |
| B. Team Feature | Team list, creation, detail, membership, stores, hooks | High |
| C. Team Memo Board | Team memo board, WebSocket skeleton, real-time indicators | High |
| D. Personal Memo | Memo list, memo editor wrapper, auto-save, view page | Medium |

### 1.3 Rendering Strategy per Route

| Route | Strategy | Rationale |
|-------|----------|-----------|
| `app/(dashboard)/teams/page.tsx` | Server Component + Client shell | SSR initial data, client filters |
| `app/(dashboard)/teams/new/page.tsx` | Client Component | Form-heavy, no SEO benefit |
| `app/(dashboard)/teams/[teamId]/page.tsx` | Server Component + Client tabs | SSR team metadata, client interactivity |
| `app/(dashboard)/memos/page.tsx` | Server Component + Client filters | SSR first page, client-side search |
| `app/(dashboard)/memos/new/page.tsx` | Client Component | Editor state, auto-save |
| `app/(dashboard)/memos/[memoId]/page.tsx` | Server Component | Static content, SEO |
| `app/(dashboard)/memos/[memoId]/edit/page.tsx` | Client Component | Editor state |

### 1.4 EXISTING vs NEW Summary

Components, hooks, types, and stores referenced in this plan fall into two categories:

**EXISTING (reuse, do not recreate):**

- `components/markdown/MarkdownEditor.tsx` -- @uiw/react-md-editor (371 lines)
- `components/markdown/EditorWithPreview.tsx` -- Write/Preview/Split modes (266 lines)
- `components/markdown/MarkdownRenderer.tsx` -- rendering pipeline
- `components/dashboard/team/` -- 4 dashboard team widgets
- `hooks/dashboard/useTeamDashboard.ts` -- team dashboard data
- `hooks/dashboard/useTeamRealtimeUpdates.ts` -- team real-time WebSocket updates
- `hooks/useBeforeUnload.ts` -- navigation guard for unsaved changes
- `hooks/useDebounce.ts` -- debounce utility
- `hooks/useMediaQuery.ts` -- responsive breakpoint detection
- `packages/shared/src/types/dashboard.types.ts` -- TeamOverview, TeamMember, TeamMemberRole, etc.
- `packages/shared/src/types/api.types.ts` -- ApiResponse<T>, PaginatedResponse<T>
- `packages/shared/src/constants/events.ts` -- EVENTS object (to be extended)
- `stores/auth.store.ts`, `stores/ui.store.ts` -- existing stores (ui.store extended)
- `lib/api-endpoints.ts` -- TEAM_DASHBOARD_ENDPOINTS already defined

**NEW (create in this SPEC):**

- `packages/shared/src/types/team.types.ts` -- full team domain types
- `packages/shared/src/types/memo.types.ts` -- full memo domain types
- `packages/shared/src/validators/team.schema.ts` -- team Zod schemas
- `packages/shared/src/validators/memo.schema.ts` -- memo Zod schemas
- `components/team/` -- 8 new team components
- `components/memo/` -- 7 new memo components
- `hooks/team/` -- 6 new team hooks
- `hooks/memo/` -- 3 new memo hooks
- `stores/team.store.ts` -- team client state
- `stores/memo.store.ts` -- memo editor state
- All route pages under `app/(dashboard)/teams/` and `app/(dashboard)/memos/`

---

## 2. Primary Goal — Foundation (Domain A + B Core)

**Objective**: Shared types ready, team list and creation functional, team detail page skeleton.

### 2.1 Domain A: Shared Type Definitions & Constants

**Requirements covered**: REQ-FE-700 through REQ-FE-704

#### Tasks

1. **[NEW]** Create `packages/shared/src/types/team.types.ts`:
   - Import and re-export `TeamMemberRole`, `TeamOverview`, `TeamMember`, `TeamActivityItem` from `dashboard.types.ts` [EXISTING]
   - Define `Team` extending `TeamOverview` with `maxMembers`, `courseIds`, `createdBy`, `updatedAt`
   - Define `TeamMemberDetail` extending `TeamMember` with `userId`, `teamId`, `joinedAt`, `email`
   - Define `TeamInvitation`, `TeamActivity` (extends `TeamActivityItem`), `TeamDetailResponse`, `TeamListResponse`

2. **[NEW]** Create `packages/shared/src/types/memo.types.ts`:
   - Define `MemoVisibility` (`"personal" | "team"`), `Memo`, `MemoLinkTarget`, `MemoDetailResponse`, `MemoFilterParams`, `CreateMemoRequest`, `UpdateMemoRequest`

3. **[NEW]** Create `packages/shared/src/validators/team.schema.ts`:
   - `CreateTeamSchema` (name: min 2/max 50, description: optional/max 500, maxMembers: min 2/max 100/default 10, courseIds: optional UUID array)
   - `UpdateTeamSchema` (partial of CreateTeamSchema)

4. **[NEW]** Create `packages/shared/src/validators/memo.schema.ts`:
   - `CreateMemoSchema` (title: required/max 200, content: required/min 1, tags: max 10 items/max 30 chars each, materialId/anchorId/teamId: optional UUID, visibility: enum)
   - `UpdateMemoSchema` (partial of CreateMemoSchema)

5. **[EXISTING - EXTEND]** Update `packages/shared/src/constants/events.ts`:
   - Add 5 new event constants using `namespace:action` format: `TEAM_MEMO_CREATED: "team_memo:created"`, `TEAM_MEMO_UPDATED: "team_memo:updated"`, `TEAM_MEMO_DELETED: "team_memo:deleted"`, `TEAM_MEMBER_JOINED: "team:member_joined"`, `TEAM_MEMBER_LEFT: "team:member_left"`
   - Add `TEAM` and `MEMO` to `EVENT_CATEGORIES`

6. **[EXISTING - EXTEND]** Update `packages/shared/src/types/index.ts`:
   - Add `export * from "./team.types"` and `export * from "./memo.types"`

7. **[EXISTING - EXTEND]** Update `packages/shared/src/validators/index.ts`:
   - Add `export * from "./team.schema"` and `export * from "./memo.schema"`

**Verification**: TypeScript compiles without errors across all workspace packages (`pnpm -w exec tsc --noEmit`).

### 2.2 Domain B Core: Zustand Stores + TanStack Query Hooks

**Requirements covered**: REQ-FE-780 through REQ-FE-789

#### Tasks

1. **[NEW]** Create `apps/web/stores/team.store.ts`:
   - State: `currentTeamId`, `activeTab: TeamDetailTab`
   - Actions: `setCurrentTeam`, `setActiveTab`

2. **[NEW]** Create `apps/web/stores/memo.store.ts`:
   - State: `editorMode`, `isDirty`, `lastSavedAt`
   - Actions: `setEditorMode`, `setDirty`, `setLastSaved`

3. **[EXISTING - EXTEND]** Extend `apps/web/stores/ui.store.ts`:
   - Add `teamSocketStatus: 'connected' | 'disconnected' | 'connecting' | 'error'`
   - Add `setTeamSocketStatus` action

4. **[NEW]** Create `apps/web/hooks/team/useTeams.ts`:
   - `useMyTeams()`: GET `/api/v1/teams/?member=me`, key `['teams', 'my']`
   - `useAvailableTeams(search?)`: GET `/api/v1/teams/?available=true&search={q}`, key `['teams', 'available', search]`

5. **[NEW]** Create `apps/web/hooks/team/useTeam.ts`:
   - `useTeamDetail(teamId)`: GET `/api/v1/teams/{teamId}`, key `['team', teamId]`
   - `useTeamMembers(teamId)`: GET `/api/v1/teams/{teamId}/members`, key `['team', teamId, 'members']`
   - `useTeamActivity(teamId, page)`: GET `/api/v1/teams/{teamId}/activity`, key `['team', teamId, 'activity']`

6. **[NEW]** Create `apps/web/hooks/team/useTeamMutations.ts`:
   - `useCreateTeam()`: POST `/api/v1/teams/`, invalidates `['teams']`
   - `useUpdateTeam(teamId)`: PATCH `/api/v1/teams/{teamId}`, invalidates `['team', teamId]`
   - `useDeleteTeam(teamId)`: DELETE `/api/v1/teams/{teamId}`, invalidates `['teams']`

7. **[NEW]** Create `apps/web/hooks/team/useTeamMembership.ts`:
   - `joinTeam`, `leaveTeam`, `inviteMember`, `removeMember`, `changeMemberRole`
   - Each uses `useMutation` with cache invalidation on `['team', teamId]` or `['team', teamId, 'members']`

8. **[NEW]** Create `apps/web/hooks/memo/useMemos.ts`:
   - `usePersonalMemos(filters)`: GET `/api/v1/memos/?visibility=personal&...`, uses `useInfiniteQuery`
   - `useTeamMemos(teamId)`: GET `/api/v1/memos/?teamId={teamId}`, uses `useInfiniteQuery`

9. **[NEW]** Create `apps/web/hooks/memo/useMemoDetail.ts`:
   - `useMemoDetail(memoId)`: GET `/api/v1/memos/{memoId}`, key `['memo', memoId]`
   - `useCreateMemo()`: POST `/api/v1/memos/`, invalidates `['memos']`
   - `useUpdateMemo(memoId)`: PATCH `/api/v1/memos/{memoId}`, invalidates `['memo', memoId]`
   - `useDeleteMemo()`: DELETE `/api/v1/memos/{memoId}`, invalidates `['memos']`

### 2.3 Domain B: Team List Page

**Requirements covered**: REQ-FE-710 through REQ-FE-714

#### Tasks

1. **[NEW]** Create `apps/web/components/team/TeamCard.tsx`
2. **[NEW]** Create `app/(dashboard)/teams/page.tsx` (Server Component, initial data fetch via GET `/api/v1/teams/?member=me`)
3. **[NEW]** Create client shell for My Teams and Browse Teams sections
4. Implement search input with 300ms debounce using `useDebounce` [EXISTING] from `hooks/useDebounce.ts`
5. **[NEW]** Create `apps/web/hooks/team/useTeamSearch.ts` (debounced search with TanStack Query)
6. Handle empty states for both sections
7. Handle join/view button states based on membership

### 2.4 Domain B: Team Creation Form

**Requirements covered**: REQ-FE-715 through REQ-FE-718

#### Tasks

1. **[NEW]** Create `app/(dashboard)/teams/new/page.tsx` with access guard (redirect to `/login?next=/teams/new` if unauthenticated)
2. Implement form using React Hook Form + `CreateTeamSchema` [NEW]
3. Implement multi-select course association picker
4. Connect form submission to `useCreateTeam` mutation, POST `/api/v1/teams/`
5. Handle success redirect to `/teams/{newTeamId}` and error toast display

---

## 3. Secondary Goal — Team Detail + Team Memo Board (Domain B Full + C)

**Objective**: Team detail fully functional with all 4 tabs; team memo board with WebSocket skeleton.

### 3.1 Domain B: Team Detail Page

**Requirements covered**: REQ-FE-720 through REQ-FE-727

#### Tasks

1. **[NEW]** Create `app/(dashboard)/teams/[teamId]/layout.tsx` (team header with breadcrumb)
2. **[NEW]** Create `app/(dashboard)/teams/[teamId]/page.tsx` (Server Component, initial team data via GET `/api/v1/teams/{teamId}`)
3. **[NEW]** Create `apps/web/components/team/TeamDetailTabs.tsx` with URL hash sync (`#members`, `#materials`, `#memos`, `#activity`)
4. Implement **Members Tab**:
   - **[NEW]** `MemberListItem.tsx` with role badge (`"leader"` / `"member"`) and actions
   - **[NEW]** `InviteMemberModal.tsx` with email input validation
   - Role change + remove member actions (`"leader"` only), POST `/api/v1/teams/{teamId}/members/invite`, PATCH/DELETE `/api/v1/teams/{teamId}/members/{userId}`
5. **[NEW]** Implement `SharedMaterialsTab.tsx`:
   - Read-only for `"member"` role; `"leader"` can remove shared materials
   - GET `/api/v1/teams/{teamId}/materials`, POST/DELETE for managing materials
6. Implement **Activity Tab**:
   - **[NEW]** `ActivityFeedItem.tsx` with relative timestamps
   - "Load more" pagination via GET `/api/v1/teams/{teamId}/activity`
   - Activity types: `"memo_created" | "memo_updated" | "member_joined" | "qa_asked"` from existing `TeamActivityItemType` [EXISTING]

### 3.2 Domain C: Team Memo Board

**Requirements covered**: REQ-FE-740 through REQ-FE-745

#### Tasks

1. **[NEW]** Create `apps/web/components/team/TeamMemoBoard.tsx`
   - Fetches via GET `/api/v1/memos/?teamId={teamId}` using TanStack Query
2. **[NEW]** Create `apps/web/components/memo/MemoCard.tsx` (used in team board)
   - Markdown stripping for plain text preview (150 chars)
   - Action menu: Edit (author only), Delete (author or `"leader"` only)
3. **[NEW]** Create `apps/web/hooks/team/useTeamMemoSocket.ts`:
   - WebSocket connection following pattern from `hooks/dashboard/useTeamRealtimeUpdates.ts` [EXISTING]
   - Subscribes to `"team_memo:created"`, `"team_memo:updated"`, `"team_memo:deleted"` events
   - On event: invalidate `['memos', { teamId }]` TanStack Query cache
   - Reconnection: exponential backoff, max 5 retries
4. **[NEW]** Create `apps/web/components/team/LiveIndicator.tsx`
   - Green dot + "Live" when connected; "Reconnecting..." when disconnected
5. Implement infinite scroll with Intersection Observer and `useInfiniteQuery` (page size: 20)
6. Handle empty state: "No team memos yet" + "Create First Memo" button

---

## 4. Final Goal — Personal Memo System (Domain D)

**Objective**: Full personal memo list, editor (wrapping existing markdown infrastructure), and view page.

### 4.1 Domain D: Personal Memo List

**Requirements covered**: REQ-FE-750 through REQ-FE-754

#### Tasks

1. **[NEW]** Create `app/(dashboard)/memos/page.tsx` (Server Component)
2. **[NEW]** Create `apps/web/components/memo/MemoFilterSidebar.tsx` (desktop filter panel)
3. **[NEW]** Create `apps/web/components/memo/MemoFilterSheet.tsx` (mobile bottom sheet, uses `useMediaQuery` [EXISTING])
4. **[NEW]** Create `apps/web/components/memo/MemoListItem.tsx`:
   - Markdown stripping for plain text preview (100 chars)
   - Hover actions: Edit, Delete with confirmation dialog
5. Implement multi-filter: search (debounced 300ms via `useDebounce` [EXISTING]), course, material, tags, visibility
6. Filter state persisted in URL search params
7. Handle all empty state variations (no memos, no results, no course memos)
8. Implement sort controls: "Newest", "Oldest", "Last modified", "Title A-Z"

### 4.2 Domain D: Memo Editor

**Requirements covered**: REQ-FE-760 through REQ-FE-768

#### Tasks

1. **[NEW]** Create `app/(dashboard)/memos/new/page.tsx` (redirect to `/login?next=/memos/new` if unauthenticated)
2. **[NEW]** Create `app/(dashboard)/memos/[memoId]/edit/page.tsx`
3. **[NEW]** Create `apps/web/components/memo/MemoEditorWrapper.tsx`:
   - WRAPS `EditorWithPreview` [EXISTING] from `components/markdown/EditorWithPreview.tsx`
   - Write/Preview/Split modes already provided by EditorWithPreview
   - Preview rendering via `MarkdownRenderer` [EXISTING]
   - Keyboard shortcuts (Ctrl+B/I/K/S) already provided by `MarkdownEditor` [EXISTING]
   - No new markdown editor component created
4. Implement form fields: Title, Tags (chip input), Link Material, Team toggle
   - Validated by `CreateMemoSchema` [NEW] via React Hook Form + Zod
5. **[NEW]** Create `apps/web/components/memo/MaterialLinkDialog.tsx`:
   - Step 1: Select course -> Step 2: Select material -> Step 3: Optional anchor selection
6. **[NEW]** Create `apps/web/hooks/memo/useAutoSaveDraft.ts`:
   - Uses `useDebounce` [EXISTING] for 30-second auto-save to localStorage
   - Storage key: `memo-draft-${userId}-${memoId}` or `memo-draft-${userId}-new`
   - Returns: `{ hasDraft, clearDraft, restoreDraft }`
7. Navigation guard: uses `useBeforeUnload` [EXISTING] from `hooks/useBeforeUnload.ts` (no creation needed)
8. **[NEW]** Create `apps/web/components/memo/DraftRestoreBanner.tsx`:
   - "Restore Draft" / "Discard" buttons
9. Wire `Ctrl+S` to memo save mutation (keyboard shortcuts already in `MarkdownEditor` [EXISTING])
10. Connect form to `useCreateMemo` / `useUpdateMemo` mutations:
    - Create: POST `/api/v1/memos/`, redirect to `/memos/{newMemoId}`
    - Update: PATCH `/api/v1/memos/{memoId}`, stay on editor with success toast
11. **[NEW]** Implement memo delete: DELETE `/api/v1/memos/{memoId}` with confirmation dialog

### 4.3 Domain D: Memo View Page

**Requirements covered**: REQ-FE-770 through REQ-FE-772

#### Tasks

1. **[NEW]** Create `app/(dashboard)/memos/[memoId]/page.tsx` (Server Component)
2. Render memo content with `MarkdownRenderer` [EXISTING] from `components/markdown/`
3. Implement linked material navigation card:
   - Clicking navigates to `/courses/{courseId}/materials/{materialId}#{anchorId}`
4. Implement social actions: copy link (clipboard API + "Copied!" toast), tag navigation (to `/memos?tags={tag}`), visibility badge

---

## 5. Technical Approach

### 5.1 Infinite Scroll Implementation

Uses TanStack Query v5 `useInfiniteQuery`:
- `fetchNextPage` triggered by Intersection Observer at list bottom
- `getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined`
- Renders flat list from `pages[].items`
- Applied in: team memo board (REQ-FE-744), personal memo list (REQ-FE-751)

### 5.2 Markdown Stripping for Previews

Lightweight regex-based stripping utility:
- Location: `packages/shared/src/utils/markdown.ts` -> `stripMarkdown(content: string): string`
- Removes headings, bold, italic, links, code blocks, images
- Applied in: `MemoCard` (150 chars) and `MemoListItem` (100 chars) preview rendering
- Ensures REQ-FE-N704 compliance (no raw Markdown in list views)

### 5.3 Auto-Save Architecture (useAutoSaveDraft)

- Hook: `apps/web/hooks/memo/useAutoSaveDraft.ts` [NEW]
- Uses `useDebounce` [EXISTING] with 30-second interval
- Storage key: `memo-draft-${userId}-${memoId}` (existing) or `memo-draft-${userId}-new` (new)
- Cleanup on unmount
- Returns: `{ hasDraft, clearDraft, restoreDraft }`
- Navigation guard: `useBeforeUnload` [EXISTING] (already at `hooks/useBeforeUnload.ts`)

### 5.4 WebSocket Integration

- Hook: `apps/web/hooks/team/useTeamMemoSocket.ts` [NEW]
- Follows pattern from `hooks/dashboard/useTeamRealtimeUpdates.ts` [EXISTING]
- Subscribes to events using `namespace:action` format:
  - `"team_memo:created"`, `"team_memo:updated"`, `"team_memo:deleted"`
  - `"team:member_joined"`, `"team:member_left"`
- Event listeners invalidate TanStack Query caches (no complex state sync)
- Connection status tracked in `ui.store.ts` [EXISTING - EXTENDED] as `teamSocketStatus`
- Reconnection: exponential backoff, max 5 retries
- Error handling: log errors, do not crash UI

### 5.5 Tag Chip Input

No external library required:
- Controlled `<input>` that appends tags on `Enter` or `,`
- Tags stored as `string[]` in React Hook Form's `control`
- Displayed as dismissible `Badge` chips (shadcn/ui `Badge` component)
- Max 10 tags enforced in Zod schema (`CreateMemoSchema`) + UI feedback

### 5.6 Access Control Pattern

- Server Component pages: check session, redirect to `/login?next={path}` if unauthenticated
- Client Components: `useAuthStore` [EXISTING] from `stores/auth.store.ts` for `{ user, role }`
- Team membership role (`"leader"` / `"member"`) is checked via team detail API response
- System role (`STUDENT` / `INSTRUCTOR`) is separate from team membership role

---

## 6. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Markdown infrastructure API changes in SPEC-FE-004 | Low | Medium | MemoEditorWrapper wraps EditorWithPreview; adapter pattern absorbs changes |
| SPEC-FE-005 course types not yet available | Medium | Low | Use `string` placeholder for courseId; graceful degradation |
| WebSocket backend not ready during development | High | Low | Mock WebSocket events in development using MSW or local event emitter |
| Auto-save localStorage conflict across tabs | Low | Low | Include `userId` in storage key: `memo-draft-${userId}-${memoId}` |
| Team memo infinite scroll performance | Low | Medium | Virtualize list with `@tanstack/react-virtual` if > 100 items per team |
| Dashboard types (dashboard.types.ts) change | Low | Medium | team.types.ts extends via interface inheritance; changes propagate automatically |

---

## 7. Definition of Done

### Per Task
- [ ] Component/hook renders without TypeScript errors
- [ ] Vitest unit test written and passing (TDD for new code, DDD for existing code modifications)
- [ ] WCAG 2.1 AA: aria-labels, keyboard navigation verified
- [ ] Responsive: tested at 375px, 768px, 1280px
- [ ] Design token compliance: no arbitrary CSS values

### Per Domain
- [ ] All requirements in domain implemented and testable
- [ ] TanStack Query cache invalidation verified with React Query DevTools
- [ ] Error states (API failure, network error) handled with toast notifications
- [ ] Empty states rendered for all data-dependent components
- [ ] All API calls use `/api/v1/` prefix consistently
- [ ] All routes use `(dashboard)` route group layout

### SPEC-FE-008 Complete
- [ ] All REQ-FE-700 through REQ-FE-789 and REQ-FE-N700 through REQ-FE-N704 implemented
- [ ] Shared types compile without errors across all workspace packages
- [ ] 85%+ test coverage on new components and hooks
- [ ] No `any` types in TypeScript (strict mode compliance)
- [ ] EXISTING components/hooks reused (not recreated): EditorWithPreview, MarkdownEditor, MarkdownRenderer, useBeforeUnload, useDebounce, useMediaQuery
- [ ] team.types.ts correctly extends dashboard.types.ts (TeamOverview, TeamMember, TeamActivityItem)
- [ ] TeamMemberRole is `"leader" | "member"` string union throughout
- [ ] WebSocket events use `namespace:action` format consistently
- [ ] TRUST 5 quality gates passed (Tested, Readable, Unified, Secured, Trackable)
