---
id: SPEC-FE-008
title: "Team & Memo System"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: medium
tags: [frontend, nextjs, team, memo, collaboration, markdown-editor, websocket, real-time, zustand, tanstack-query]
related_specs: [SPEC-FE-001, SPEC-FE-002, SPEC-FE-004, SPEC-FE-005, SPEC-UI-001]
requirement_prefix: REQ-FE-7
---

# SPEC-FE-008: Team & Memo System

## History

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | 2026-02-19 | Complete rewrite. Fixed 12 critical discrepancies with actual codebase: (1) Route structure corrected from `app/teams/` to `app/(dashboard)/teams/`. (2) API endpoints corrected from `/api/teams` to `/api/v1/teams/`. (3) EVENTS format corrected from `TEAM_MEMO_CREATED` string constants to `namespace:action` pattern (`"team_memo:created"`, `"team:member_joined"`). (4) EditorWithPreview component marked as EXISTING (266 lines at `components/markdown/EditorWithPreview.tsx`). (5) MarkdownEditor marked as EXISTING with `@uiw/react-md-editor` (371 lines). (6) useBeforeUnload hook marked as EXISTING at `hooks/useBeforeUnload.ts`. (7) useDebounce hook marked as EXISTING at `hooks/useDebounce.ts`. (8) API response types (ApiResponse, PaginatedResponse) referenced from existing `api.types.ts` instead of redefined. (9) Hooks directory corrected to subdirectory pattern `hooks/team/`, `hooks/memo/`. (10) TeamMemberRole corrected from enum `TEAM_LEAD/MEMBER` to string union `"leader"/"member"`. (11) Dashboard team types (TeamOverview, TeamMember, SharedMemo, TeamActivityItem) marked as EXISTING in `dashboard.types.ts`. (12) Dashboard team widgets and hooks marked as EXISTING. Added History section, EXISTING/NEW markers, Role-based Feature Matrix, types moved to Section 4. |
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
| Markdown Editor | @uiw/react-md-editor (already installed) | latest |
| Markdown Rendering | react-markdown + remark/rehype (already installed) | latest |
| Icons | Lucide React | latest |
| Testing | Vitest + React Testing Library | latest |

### 1.2 Screen Design References

| Screen | .pen File | Description |
|--------|-----------|-------------|
| Team List | `design/screens/team/team-list.pen` | Team list page (my teams, browse teams) |
| Team Detail | `design/screens/team/team-detail.pen` | Team detail page (members, shared materials, team memos, activity) |
| Team Create | `design/screens/team/team-create.pen` | Team creation form |
| Team Memo | `design/screens/team/team-memo.pen` | Team memo board (shared notes within a team) |
| Memo List | `design/screens/memo/memo-list.pen` | Personal memo list (individual study notes) |
| Memo Editor | `design/screens/memo/memo-editor.pen` | Memo editor (Markdown-based note taking) |

> Note: .pen files are Pencil MCP design artifacts. Reference for component structure, layout, and visual tokens only. Do not attempt to read directly.

### 1.3 System Architecture Context

```
apps/web/                          # Next.js 15 (this SPEC)
  app/(dashboard)/
    teams/                          # Team routes (NEW in this SPEC)
    memos/                          # Memo routes (NEW in this SPEC)
  components/
    dashboard/team/                 # EXISTING: Dashboard team widgets
      TeamOverviewWidget.tsx        # EXISTING: team overview for dashboard
      TeamMembersWidget.tsx         # EXISTING: team members for dashboard
      SharedMemosFeedWidget.tsx     # EXISTING: shared memos feed for dashboard
      TeamActivityWidget.tsx        # EXISTING: team activity for dashboard
    markdown/                       # EXISTING: full markdown editor/renderer suite
      MarkdownEditor.tsx            # EXISTING: @uiw/react-md-editor (371 lines)
      EditorWithPreview.tsx         # EXISTING: Write/Preview/Split modes (266 lines)
      MarkdownRenderer.tsx          # EXISTING: rendering with remark-gfm, math, katex, highlight, sanitize
      CodeBlock.tsx                 # EXISTING: Code block component
      Callout.tsx                   # EXISTING: Callout component
      HeadingWithAnchor.tsx         # EXISTING: Heading anchor component
      MathBlock.tsx                 # EXISTING: Math rendering
      index.ts                     # EXISTING: exports all components
    team/                           # NEW: Team management components
    memo/                           # NEW: Memo components
  hooks/
    dashboard/
      useTeamDashboard.ts           # EXISTING: team dashboard data hook
      useTeamRealtimeUpdates.ts     # EXISTING: team real-time WebSocket updates
    useBeforeUnload.ts              # EXISTING: navigation guard for unsaved changes (REQ-FE-348)
    useDebounce.ts                  # EXISTING: debounce utility hook (REQ-FE-332)
    useMediaQuery.ts                # EXISTING: responsive breakpoint detection
    useScrollPosition.ts            # EXISTING: scroll position tracking
    team/                           # NEW: Team-specific hooks
    memo/                           # NEW: Memo-specific hooks
  stores/
    navigation.store.ts             # EXISTING
    auth.store.ts                   # EXISTING: useAuthStore (user, role)
    dashboard.store.ts              # EXISTING
    ui.store.ts                     # EXISTING
    material.store.ts               # EXISTING: selectedText, selectionAnchorRect
    course.store.ts                 # EXISTING
    team.store.ts                   # NEW: team client state
    memo.store.ts                   # NEW: memo editor state
  lib/
    api-endpoints.ts                # EXISTING: TEAM_DASHBOARD_ENDPOINTS already defined

apps/api/                          # Fastify backend
  routes/teams/                    # Team REST endpoints (out of scope)
  routes/memos/                    # Memo REST endpoints (out of scope)

packages/shared/
  src/
    types/
      api.types.ts                 # EXISTING: ApiResponse<T>, PaginatedResponse<T>, Pagination, PaginationParams
      dashboard.types.ts           # EXISTING: TeamOverview, TeamMember, SharedMemo, TeamActivityItem, TeamMemberRole
      team.types.ts                # NEW: Full Team domain types (extends dashboard types)
      memo.types.ts                # NEW: Full Memo domain types
    validators/
      team.schema.ts               # NEW: Team Zod schemas
      memo.schema.ts               # NEW: Memo Zod schemas
    constants/
      events.ts                    # EXISTING: EVENTS object with namespace:action format
```

### 1.4 Design Constraints

- **Responsive Breakpoints**: Mobile 375px (4-col), Tablet 768px (8-col), Desktop 1280px+ (12-col)
- **Accessibility**: WCAG 2.1 AA compliance -- keyboard navigable, focus management, ARIA labels
- **Route Group**: All routes use `(dashboard)` route group layout
- **API Prefix**: All endpoints use `/api/v1/` prefix consistently
- **Markdown**: Memo editor WRAPS/REUSES existing `EditorWithPreview` and `MarkdownEditor` from `components/markdown/`; no new editor component is created
- **Real-Time Preparation**: WebSocket skeleton for team memo collaboration (non-blocking)
- **Auto-save**: Draft memos auto-saved to localStorage every 30 seconds using existing `useDebounce` hook
- **Role-Based UI**: Both `"leader"` and `"member"` roles can create teams; only leaders can manage members
- **Existing Hooks**: Reuse `useBeforeUnload`, `useDebounce`, `useMediaQuery` from `apps/web/hooks/`

---

## 2. Assumptions

### 2.1 Foundation Dependencies (SPEC-FE-001)

SPEC-FE-001 (foundation) is complete and provides:

- Design tokens, layout system, responsive grid
- shadcn/ui components: `Button`, `Card`, `Dialog`, `AlertDialog`, `Sheet`, `Input`, `Textarea`, `Select`, `Badge`, `Avatar`, `Skeleton`, `Toast` (Sonner), `Tabs`, `DropdownMenu`, `Tooltip`, `Form`, `Label`
- TanStack Query `QueryProvider` and `apps/web/lib/api.ts` API client
- Zustand store infrastructure and devtools setup
- Shared types from `packages/shared/src/types/api.types.ts`: `ApiResponse<T>`, `PaginatedResponse<T>`, `Pagination`, `PaginationParams`

### 2.2 Auth Dependency (SPEC-FE-002)

SPEC-FE-002 (auth) is complete and provides:

- `useAuthStore` exposing `{ user, role }` from `apps/web/stores/auth.store.ts`
- `UserRole` types from `@shared/types/auth.types`
- `RequireAuth` and `RequireRole` guard components for route-level access control
- Authenticated API client with Bearer token injection

### 2.3 Material Viewer Dependency (SPEC-FE-004)

SPEC-FE-004 (material viewer) is complete and provides:

- Complete markdown infrastructure at `apps/web/components/markdown/`:
  - `MarkdownEditor` (371 lines) -- full editor with `@uiw/react-md-editor`, toolbar, keyboard shortcuts (Ctrl+B/I/K/S), fullscreen, word count, image upload
  - `EditorWithPreview` (266 lines) -- Write/Preview/Split modes, mobile responsive, debounced preview
  - `MarkdownRenderer` -- rendering with remark-gfm, remark-math, rehype-katex, rehype-highlight, rehype-sanitize
- All markdown libraries already installed: `react-markdown`, `remark-gfm`, `remark-math`, `rehype-katex`, `rehype-highlight`, `rehype-sanitize`, `@uiw/react-md-editor`
- Material data accessible via existing TanStack Query hooks in `apps/web/hooks/materials/`

### 2.4 Course Management Dependency (SPEC-FE-005)

SPEC-FE-005 (course management) is complete and provides:

- Course context (`useCourse` hook), course-team association
- Course enrollment data for determining team membership eligibility
- Course routes under `/courses/[courseId]/`

### 2.5 Dashboard Team Types and Widgets (EXISTING)

`packages/shared/src/types/dashboard.types.ts` already defines:

- `TeamMemberRole = "leader" | "member"` (string union type, NOT enum)
- `TeamOverview` -- `{ id, name, courseName, memberCount, description?, createdAt }`
- `TeamMember` -- `{ id, name, avatarUrl?, role: TeamMemberRole, lastActiveAt }`
- `SharedMemo` -- `{ id, title, authorName, excerpt, updatedAt }`
- `TeamActivityItemType = "memo_created" | "memo_updated" | "member_joined" | "qa_asked"`
- `TeamActivityItem` -- `{ id, type, actorName, description, createdAt }`
- `TeamDashboardData` -- `{ overview, members, sharedMemos, activityFeed }`

Dashboard team widgets already implemented:

- `components/dashboard/team/TeamOverviewWidget.tsx` [EXISTING]
- `components/dashboard/team/TeamMembersWidget.tsx` [EXISTING]
- `components/dashboard/team/SharedMemosFeedWidget.tsx` [EXISTING]
- `components/dashboard/team/TeamActivityWidget.tsx` [EXISTING]

Dashboard hooks:

- `hooks/dashboard/useTeamDashboard.ts` [EXISTING]
- `hooks/dashboard/useTeamRealtimeUpdates.ts` [EXISTING]

New `team.types.ts` MUST be COMPATIBLE with and EXTEND (not duplicate) these existing types.

### 2.6 Existing Reusable Hooks

The following hooks already exist and shall be reused:

- `useBeforeUnload` at `apps/web/hooks/useBeforeUnload.ts` [EXISTING] -- for memo unsaved changes guard
- `useDebounce` at `apps/web/hooks/useDebounce.ts` [EXISTING] -- for auto-save debouncing and search debounce
- `useMediaQuery` at `apps/web/hooks/useMediaQuery.ts` [EXISTING] -- for responsive behavior (mobile sheet vs desktop sidebar)
- `useScrollPosition` at `apps/web/hooks/useScrollPosition.ts` [EXISTING] -- available if needed

### 2.7 WebSocket Events (Existing Pattern)

`packages/shared/src/constants/events.ts` already defines the `EVENTS` object using `namespace:action` format:

- `AUTH_LOGIN: "auth:login"`, `COURSE_CREATED: "course:created"`, `QA_QUESTION_POSTED: "qa:question_posted"`, etc.
- `EVENT_CATEGORIES` defines category constants: `AUTH`, `COURSE`, `MATERIAL`, `QUIZ`, `QA`, `NOTIFICATION`, `PRESENCE`

This SPEC extends the `EVENTS` object with team and memo events following the same `namespace:action` pattern. Adds `TEAM` and `MEMO` to `EVENT_CATEGORIES`.

### 2.8 Backend API Assumptions

REST endpoints available at `NEXT_PUBLIC_API_URL/api/v1/teams/` and `/api/v1/memos/`:

**Team endpoints:**

- `GET /api/v1/teams/` -- list teams (member=me for my teams, available=true for browsable)
- `POST /api/v1/teams/` -- create team
- `GET /api/v1/teams/:teamId` -- team detail
- `PATCH /api/v1/teams/:teamId` -- update team
- `DELETE /api/v1/teams/:teamId` -- delete team
- `GET /api/v1/teams/:teamId/members` -- list members
- `POST /api/v1/teams/:teamId/join` -- join team
- `DELETE /api/v1/teams/:teamId/leave` -- leave team
- `POST /api/v1/teams/:teamId/members/invite` -- invite member by email
- `DELETE /api/v1/teams/:teamId/members/:userId` -- remove member
- `PATCH /api/v1/teams/:teamId/members/:userId` -- change member role
- `GET /api/v1/teams/:teamId/activity` -- team activity feed (paginated)
- `GET /api/v1/teams/:teamId/materials` -- shared materials list
- `POST /api/v1/teams/:teamId/materials` -- add shared material
- `DELETE /api/v1/teams/:teamId/materials/:materialId` -- remove shared material

**Memo endpoints:**

- `GET /api/v1/memos/` -- list memos (with filter params: visibility, teamId, courseId, materialId, tags, search)
- `POST /api/v1/memos/` -- create memo
- `GET /api/v1/memos/:memoId` -- memo detail
- `PATCH /api/v1/memos/:memoId` -- update memo
- `DELETE /api/v1/memos/:memoId` -- delete memo

API responses follow the shared `ApiResponse<T>` wrapper type from `packages/shared/src/types/api.types.ts`.

### 2.9 Scope Assumptions

- This SPEC covers the Team and Memo feature domain for the `apps/web/` frontend only
- Backend API implementation is out of scope
- Real-time collaboration is implemented as a WebSocket skeleton (connection setup, event handling) -- full collaborative editing (Yjs/OT) is out of scope
- File attachments in memos are out of scope
- Team-level notification settings are out of scope
- The memo editor does not create a new editor component; it wraps/reuses existing `EditorWithPreview` and `MarkdownEditor` from `components/markdown/`

---

## 3. Requirements

### 3.1 Shared Type Definitions (REQ-FE-700 -- REQ-FE-704)

#### REQ-FE-700: Team Type Definitions [NEW]

The system shall define full Team domain types in `packages/shared/src/types/team.types.ts` that are COMPATIBLE with and EXTEND the existing dashboard types in `dashboard.types.ts`.

- Re-exports `TeamMemberRole` from `dashboard.types.ts` (value: `"leader" | "member"`)
- `Team` extends `TeamOverview` with additional fields: `maxMembers`, `courseIds`, `createdBy`, `updatedAt`
- `TeamMemberDetail` extends `TeamMember` with: `userId`, `teamId`, `joinedAt`, `email`
- `TeamInvitation`: `id`, `teamId`, `email`, `status`, `invitedBy`, `createdAt`
- `TeamActivity` extends `TeamActivityItem` with: `teamId`, `actorId`, `payload`

#### REQ-FE-701: Memo Type Definitions [NEW]

The system shall define complete Memo domain types in `packages/shared/src/types/memo.types.ts`.

- Types: `Memo`, `MemoTag`, `MemoVisibility` (`"personal" | "team"` string union), `MemoLinkTarget`
- `Memo`: `id`, `title`, `content`, `authorId`, `authorName`, `authorAvatarUrl`, `teamId` (nullable), `materialId` (nullable), `anchorId` (nullable), `tags`, `visibility`, `isDraft`, `createdAt`, `updatedAt`
- `MemoLinkTarget`: `materialId`, `materialTitle`, `courseId`, `anchorId`, `anchorText`

#### REQ-FE-702: Team Zod Schema Definitions [NEW]

The system shall provide Zod validation schemas in `packages/shared/src/validators/team.schema.ts`.

Required schemas:

- `CreateTeamSchema` -- validates `name` (min 2, max 50 chars), `description` (optional, max 500 chars), `maxMembers` (min 2, max 100, default 10), `courseIds` (optional string array of UUIDs)
- `UpdateTeamSchema` -- partial of `CreateTeamSchema`

#### REQ-FE-703: Memo Zod Schema Definitions [NEW]

The system shall provide Zod validation schemas in `packages/shared/src/validators/memo.schema.ts`.

Required schemas:

- `CreateMemoSchema` -- validates `title` (required, max 200 chars), `content` (required, min 1 char), `tags` (optional, max 10 items, each tag max 30 chars), `materialId` (optional UUID), `anchorId` (optional string), `teamId` (optional UUID), `visibility` (enum: `"personal" | "team"`)
- `UpdateMemoSchema` -- partial of `CreateMemoSchema`

#### REQ-FE-704: WebSocket Event Constants [NEW]

The system shall extend the existing `EVENTS` object in `packages/shared/src/constants/events.ts` with team and memo event constants using the `namespace:action` pattern.

New constants to add to the existing `EVENTS` object:

- `TEAM_MEMO_CREATED: "team_memo:created"` -- broadcast when a new team memo is posted
- `TEAM_MEMO_UPDATED: "team_memo:updated"` -- broadcast when a team memo is edited
- `TEAM_MEMO_DELETED: "team_memo:deleted"` -- broadcast when a team memo is removed
- `TEAM_MEMBER_JOINED: "team:member_joined"` -- broadcast when a member joins
- `TEAM_MEMBER_LEFT: "team:member_left"` -- broadcast when a member leaves

New categories to add to `EVENT_CATEGORIES`:

- `TEAM: "team"`
- `MEMO: "memo"`

---

### 3.2 Team List Page (REQ-FE-710 -- REQ-FE-714)

#### REQ-FE-710: Team List Page Route [NEW]

The system shall implement the team list page at `app/(dashboard)/teams/page.tsx`.

- Server Component that fetches initial team list data (SSR)
- Page title: "Teams" with action button to create a new team
- Two sections: "My Teams" (teams the current user belongs to) and "Browse Teams" (available public teams)
- Consistent with `design/screens/team/team-list.pen`

#### REQ-FE-711: My Teams Section [NEW]

**When** a user navigates to the team list page, **then** the system shall display all teams the user is a member of, ordered by most recently active.

- Each team card shows: team name, description (truncated), member count / max members, role badge (`"leader"` or `"member"`), and associated course names
- Empty state: "You haven't joined any teams yet. Browse available teams below."
- Loading skeleton using `Skeleton` component from SPEC-FE-001

#### REQ-FE-712: Browse Teams Section [NEW]

**When** a user views the Browse Teams section, **then** the system shall display teams available to join with search and filter functionality.

- Search input: filter teams by name or description (debounced 300ms using existing `useDebounce` hook from `apps/web/hooks/useDebounce.ts`)
- Team card shows: name, description, member count / max members, associated courses, join button
- **If** the team is full (`currentMemberCount >= maxMembers`), **then** the join button shall be disabled with tooltip "Team is full"
- **If** the user is already a member, **then** the button shall show "View" instead of "Join"

#### REQ-FE-713: Team Card Component [NEW]

The system shall provide a reusable `TeamCard` component for displaying team summary information.

- `apps/web/components/team/TeamCard.tsx`
- Props: `team: Team`, `currentUserId: string`, `onJoin?: () => void`, `onView?: () => void`
- Displays: avatar group (first 3 member avatars), team name, description, course badges, member count
- Role badge (`"leader"` or `"member"`) only shown in My Teams section

#### REQ-FE-714: Team Search Hook [NEW]

The system shall provide a custom hook for team search and filtering.

- `apps/web/hooks/team/useTeamSearch.ts`
- Uses TanStack Query with debounced search query (using existing `useDebounce` hook)
- Returns: `teams`, `isLoading`, `searchQuery`, `setSearchQuery`
- Integrates with `GET /api/v1/teams/?search={query}&available=true` endpoint

---

### 3.3 Team Creation Form (REQ-FE-715 -- REQ-FE-718)

#### REQ-FE-715: Team Creation Route [NEW]

The system shall implement the team creation form at `app/(dashboard)/teams/new/page.tsx`.

- Client Component with React Hook Form + Zod validation using `CreateTeamSchema`
- Accessible via "Create Team" button on team list page
- Consistent with `design/screens/team/team-create.pen`

#### REQ-FE-716: Team Creation Form Fields [NEW]

The system shall provide form fields for team creation with inline validation.

- **Name** (required): text input, min 2 / max 50 characters
- **Description** (optional): textarea, max 500 characters, character counter shown
- **Max Members** (required): number input, min 2 / max 100, default 10
- **Course Association** (optional): multi-select dropdown showing available courses the user is enrolled in or teaches
- Submit button: "Create Team" -- disabled while submitting
- Cancel link: returns to team list page

#### REQ-FE-717: Team Creation Submission [NEW]

**When** the user submits the team creation form with valid data, **then** the system shall send a POST request to `/api/v1/teams/` and redirect to the newly created team's detail page.

- Optimistic UI: show loading spinner on submit button
- **If** the API returns a validation error, **then** display field-level error messages
- **If** the API returns a server error, **then** display a toast notification: "Failed to create team. Please try again."
- On success: invalidate `['teams']` query cache and redirect to `/teams/{newTeamId}`

#### REQ-FE-718: Team Creation Access Control [NEW]

**If** the current user does not have an authenticated session, **then** the system shall redirect to the login page before accessing team creation.

- Redirect target: `/login?next=/teams/new`
- Both student and instructor roles may create teams

---

### 3.4 Team Detail Page (REQ-FE-720 -- REQ-FE-727)

#### REQ-FE-720: Team Detail Page Route [NEW]

The system shall implement the team detail page at `app/(dashboard)/teams/[teamId]/page.tsx`.

- Server Component with initial data fetch
- Four sections accessible via tab navigation: Members, Shared Materials, Team Memos, Activity
- Consistent with `design/screens/team/team-detail.pen`

#### REQ-FE-721: Team Detail Header [NEW]

The system shall display a team detail header with team identity and membership actions.

- Team name, description, course association badges
- Member count chip: "X / Y members"
- If the user role is `"leader"`: settings icon button linking to team settings
- If the user role is `"member"`: "Leave Team" button with confirmation dialog
- If the user is not a member: "Join Team" button (or "Team Full" disabled state)

#### REQ-FE-722: Members Tab [NEW]

**When** the user selects the Members tab, **then** the system shall display all team members with their roles and join dates.

- Member list item: avatar, display name, role badge (`"leader"` / `"member"`), joined date
- If the current user role is `"leader"`:
  - "Change Role" action (promote to leader / demote to member)
  - "Remove Member" action with confirmation dialog
  - "Invite Member" button that opens an invite modal
- Member invite modal: email input with validation, "Send Invite" button
- Empty state: "No members yet. Invite people to join your team."

#### REQ-FE-723: Shared Materials Tab [NEW]

**When** the user selects the Shared Materials tab, **then** the system shall display materials that team members have linked or recommended within the team context.

- Material card: title, course name, author, date linked, link to view material
- "Add Material" button (opens a course material picker dialog)
- This tab is read-only for `"member"` role; `"leader"` can remove shared materials

#### REQ-FE-724: Team Memos Tab [NEW]

**When** the user selects the Team Memos tab, **then** the system shall display the team memo board and allow creating new team memos.

- Rendered by the `TeamMemoBoard` component (REQ-FE-740)
- Consistent with `design/screens/team/team-memo.pen`

#### REQ-FE-725: Activity Tab [NEW]

**When** the user selects the Activity tab, **then** the system shall display a chronological feed of team activities.

- Activity items: member joined/left, memo created/updated, material shared
- Each item: actor avatar, actor name, action description, timestamp (relative: "2 hours ago")
- Activity types follow existing `TeamActivityItemType`: `"memo_created" | "memo_updated" | "member_joined" | "qa_asked"`
- Pagination: load 20 items at a time with "Load more" button
- Empty state: "No activity yet."

#### REQ-FE-726: Team Detail Tab Navigation [NEW]

The system shall implement tab navigation for the team detail page using shadcn/ui `Tabs` component.

- `apps/web/components/team/TeamDetailTabs.tsx`
- Tabs: Members | Shared Materials | Team Memos | Activity
- URL hash synchronization: `#members`, `#materials`, `#memos`, `#activity`
- Default active tab: Members

#### REQ-FE-727: Team Membership Actions Hook [NEW]

The system shall provide a custom hook encapsulating team membership mutation logic.

- `apps/web/hooks/team/useTeamMembership.ts`
- Actions: `joinTeam`, `leaveTeam`, `inviteMember`, `removeMember`, `changeMemberRole`
- Each action uses TanStack Query `useMutation`
- On success: invalidate `['team', teamId]` query
- On error: display toast notification with action-specific error message

---

### 3.5 Team Memo Board (REQ-FE-740 -- REQ-FE-745)

#### REQ-FE-740: Team Memo Board Component [NEW]

The system shall provide a `TeamMemoBoard` component that displays all memos shared within a team.

- `apps/web/components/team/TeamMemoBoard.tsx`
- Fetches memos via `GET /api/v1/memos/?teamId={teamId}` using TanStack Query
- Displays memos as a feed (newest first)
- "New Team Memo" button triggers the memo editor in team-memo mode
- Consistent with `design/screens/team/team-memo.pen`

#### REQ-FE-741: Team Memo Card [NEW]

The system shall provide a `MemoCard` component for displaying memo summary in the board view.

- `apps/web/components/memo/MemoCard.tsx`
- Displays: author avatar + name, memo title, content preview (first 150 characters, Markdown stripped), tags, timestamp
- Action menu (three-dot): Edit (author only), Delete (author or `"leader"` only)
- Click on card: navigate to `/memos/{memoId}` for full view

#### REQ-FE-742: WebSocket Connection for Team Memo Real-Time Updates [NEW]

The system shall implement a WebSocket connection skeleton for receiving real-time team memo updates.

- `apps/web/hooks/team/useTeamMemoSocket.ts`
- WebSocket connection management follows the pattern established in `apps/web/hooks/dashboard/useTeamRealtimeUpdates.ts` [EXISTING]
- Subscribes to `EVENTS.TEAM_MEMO_CREATED` (`"team_memo:created"`), `EVENTS.TEAM_MEMO_UPDATED` (`"team_memo:updated"`), `EVENTS.TEAM_MEMO_DELETED` (`"team_memo:deleted"`) events
- On event received: invalidate `['memos', { teamId }]` TanStack Query cache to trigger refetch
- Connection lifecycle: connect on component mount, disconnect on unmount
- Reconnection logic: exponential backoff, max 5 retries
- Error handling: log WebSocket errors; do not crash UI on connection failure

#### REQ-FE-743: Real-Time Indicator [NEW]

**While** the WebSocket connection to the team memo board is active, **then** the system shall display a "Live" indicator badge.

- Green dot + "Live" label adjacent to the "Team Memos" section heading
- **If** the WebSocket connection is disconnected or failed, **then** display a "Reconnecting..." indicator
- Indicator component: `apps/web/components/team/LiveIndicator.tsx`

#### REQ-FE-744: Team Memo Pagination [NEW]

The system shall implement infinite scroll pagination for the team memo board.

- Uses TanStack Query `useInfiniteQuery` for paginated fetching
- Page size: 20 memos per page
- Intersection Observer-based trigger at the bottom of the list
- Loading skeleton displayed while fetching the next page

#### REQ-FE-745: Team Memo Board Empty State [NEW]

**When** a team has no memos, **then** the system shall display an empty state with a prompt to create the first team memo.

- Illustration area, heading "No team memos yet", subtext "Share insights and notes with your team."
- "Create First Memo" button

---

### 3.6 Personal Memo List (REQ-FE-750 -- REQ-FE-754)

#### REQ-FE-750: Personal Memo List Page Route [NEW]

The system shall implement the personal memo list page at `app/(dashboard)/memos/page.tsx`.

- Server Component for initial render; client-side filtering via query params
- Displays all memos authored by the current user with `visibility: "personal"`
- Consistent with `design/screens/memo/memo-list.pen`

#### REQ-FE-751: Memo List Layout [NEW]

The system shall display personal memos in a two-column layout on Desktop, one-column on Mobile.

- Left panel (Desktop): filter sidebar (search, course filter, material filter, tag filter, visibility toggle)
- Right panel (Desktop): memo card list with sort controls
- Mobile: filter bar collapses into a bottom sheet accessed via filter icon button (uses `useMediaQuery` hook [EXISTING])
- Sort options: "Newest", "Oldest", "Last modified", "Title A-Z"

#### REQ-FE-752: Memo Search and Filter [NEW]

**When** a user applies filters on the memo list, **then** the system shall display only memos matching all active filters.

- Search: full-text search against title and content, debounce 300ms (using existing `useDebounce` hook from `apps/web/hooks/useDebounce.ts`)
- Course filter: dropdown selecting from courses the user is enrolled in
- Material filter: subordinate to course filter; shows materials within the selected course
- Tag filter: multi-select chip input for tag-based filtering
- Visibility toggle: "Personal" | "Team" (shows team memos the user has authored)
- Active filters: displayed as dismissible chips above the memo list
- Clear all: single button to reset all filters
- Filter state persisted in URL search params

#### REQ-FE-753: Memo List Empty States [NEW]

The system shall display contextual empty states depending on filter and data conditions.

- No memos at all: "You haven't created any memos yet." + "Create your first memo" button
- No results for filters: "No memos match your filters." + "Clear filters" button
- No memos in selected course: "No memos linked to this course yet."

#### REQ-FE-754: Memo List Item [NEW]

The system shall display each memo as a list card with summary information and quick actions.

- `apps/web/components/memo/MemoListItem.tsx`
- Displays: title, content preview (100 chars, Markdown stripped), tags (up to 3, "+N more"), linked material name (if set), last modified timestamp
- Hover actions: Edit button, Delete button
- Click on item: navigate to `/memos/{memoId}` for full view / edit

---

### 3.7 Memo Editor (REQ-FE-760 -- REQ-FE-768)

#### REQ-FE-760: Memo Editor Page Routes [NEW]

The system shall implement memo editor routes for creating and editing memos.

- Create personal memo: `app/(dashboard)/memos/new/page.tsx`
- Edit existing memo: `app/(dashboard)/memos/[memoId]/edit/page.tsx`
- Create team memo: accessible via the Team Memo Board; uses the same editor in team mode
- View memo: `app/(dashboard)/memos/[memoId]/page.tsx` (read-only, with edit button for author)
- Consistent with `design/screens/memo/memo-editor.pen`

#### REQ-FE-761: Memo Editor Component (Reusing Existing Markdown Infrastructure) [NEW]

The system shall provide a `MemoEditorWrapper` component that WRAPS the existing `EditorWithPreview` from `apps/web/components/markdown/EditorWithPreview.tsx`.

- `apps/web/components/memo/MemoEditorWrapper.tsx`
- Wraps `EditorWithPreview` [EXISTING] for the memo-specific editor experience
- The `EditorWithPreview` component already provides Write/Preview/Split modes with mobile responsive layout
- `MarkdownRenderer` from `components/markdown/MarkdownRenderer.tsx` [EXISTING] handles preview rendering
- No new markdown editor component is created; all editing uses existing `components/markdown/` infrastructure
- Keyboard shortcuts (Ctrl+B/I/K/S) already provided by `MarkdownEditor` [EXISTING]

#### REQ-FE-762: Memo Editor Form Fields [NEW]

The system shall provide the following form fields in the memo editor, validated using `CreateMemoSchema`.

- **Title** (required): text input, max 200 characters
- **Tags**: comma-separated tag input, each tag max 30 characters, max 10 tags total
  - Tags displayed as dismissible chips below the input
- **Link to Material** (optional): "Link Material" button opens a material picker dialog
  - Picker shows courses -> materials hierarchy
  - Selected link shown as: "{materialTitle} > {anchorText or section}"
- **Team Memo Toggle** (optional): "Share with team" checkbox; only visible when `teamId` context is provided
- **Visibility**: auto-set based on team toggle (`"personal"` or `"team"`)

#### REQ-FE-763: Memo Auto-Save [NEW]

**While** the user is editing a memo, the system shall auto-save the draft to localStorage every 30 seconds.

- Uses existing `useDebounce` hook from `apps/web/hooks/useDebounce.ts` [EXISTING] for debounced save
- Storage key: `memo-draft-${userId}-${memoId}` for existing memos, `memo-draft-${userId}-new` for new memos
- Draft indicator: "Draft saved" label shown below the editor after each save, fades after 3 seconds
- **When** the user navigates away with unsaved changes, **then** the system shall show a browser "Leave site?" confirmation dialog (using existing `useBeforeUnload` hook from `apps/web/hooks/useBeforeUnload.ts` [EXISTING])
- **When** the user returns to an in-progress draft, **then** the system shall offer to restore the draft

#### REQ-FE-764: Memo Draft Restore Prompt [NEW]

**When** a draft exists in localStorage for the current memo context, **then** the system shall prompt the user to restore or discard the draft.

- Displayed as a dismissible banner at the top of the editor
- "Restore Draft" button: loads draft content into the editor
- "Discard" button: clears localStorage draft and proceeds with empty/current content

#### REQ-FE-765: Memo Save and Publish [NEW]

**When** the user saves a memo, **then** the system shall send a POST (create) or PATCH (update) request to the API and display a success notification.

- On create: POST `/api/v1/memos/`, redirect to `/memos/{newMemoId}` on success
- On update: PATCH `/api/v1/memos/{memoId}`, stay on editor with success toast
- **If** the API returns a validation error, **then** display field-level error messages
- **If** the API returns a server error, **then** display a toast: "Failed to save memo."
- Keyboard shortcut: `Ctrl+S` / `Cmd+S` triggers save (already handled by `MarkdownEditor` [EXISTING])

#### REQ-FE-766: Memo Material Link Dialog [NEW]

**When** the user clicks "Link Material" in the memo editor, **then** the system shall display a dialog for selecting a material and optional section anchor.

- `apps/web/components/memo/MaterialLinkDialog.tsx`
- Step 1: Select course from dropdown
- Step 2: Select material from list within the course
- Step 3 (optional): Select section/heading anchor from material's table of contents
- "Link" button: sets `materialId` and `anchorId` on the memo form
- "Clear Link" button: removes the existing link

#### REQ-FE-767: Memo Editor Keyboard Shortcuts [NEW]

The system shall support keyboard shortcuts in the memo editor. The existing `MarkdownEditor` [EXISTING] already provides:

- `Ctrl+B` / `Cmd+B`: bold
- `Ctrl+I` / `Cmd+I`: italic
- `Ctrl+K` / `Cmd+K`: link
- `Ctrl+S` / `Cmd+S`: save (wired to memo save action)

No additional keyboard shortcut implementation is needed beyond wiring `Ctrl+S` to the memo save mutation.

#### REQ-FE-768: Memo Delete [NEW]

**When** the author triggers memo deletion, **then** the system shall display a confirmation dialog before deleting.

- Confirmation dialog: "Delete Memo?" with memo title, "Delete" (destructive) and "Cancel" buttons
- On confirm: DELETE `/api/v1/memos/{memoId}`, redirect to `/memos` on success, invalidate memo list cache
- Toast on success: "Memo deleted."

---

### 3.8 Memo View Page (REQ-FE-770 -- REQ-FE-772)

#### REQ-FE-770: Memo View Page [NEW]

The system shall implement a read-only memo view page at `app/(dashboard)/memos/[memoId]/page.tsx`.

- Renders memo title, author info (avatar + name + date), tags, linked material link, and full Markdown content
- Uses `MarkdownRenderer` from `components/markdown/` [EXISTING] for content rendering
- "Edit" button: visible to memo author, links to `/memos/{memoId}/edit`
- "Back" breadcrumb: returns to `/memos` list

#### REQ-FE-771: Memo Linked Material Navigation [NEW]

**When** a memo has a linked material, **then** the system shall display a contextual link to the source material.

- Link card at the top of the memo: "{materialTitle}" with optional "{anchorText}" subheading
- Clicking the link navigates to `/courses/{courseId}/materials/{materialId}#{anchorId}` (if anchor is set)

#### REQ-FE-772: Memo Social Actions [NEW]

The system shall display social/meta actions on the memo view page.

- Copy link button: copies `window.location.href` to clipboard, shows "Copied!" toast
- Tag chips: clicking a tag navigates to `/memos?tags={tag}` (filtered personal memo list)
- Visibility badge: "Personal" or "Team: {teamName}"

---

### 3.9 Zustand Store Extensions (REQ-FE-780 -- REQ-FE-782)

#### REQ-FE-780: Team Store [NEW]

The system shall provide a Zustand store for team-related client state.

- `apps/web/stores/team.store.ts`
- State: `currentTeamId: string | null`, `activeTab: TeamDetailTab`
- Actions: `setCurrentTeam`, `setActiveTab`
- `TeamDetailTab`: `'members' | 'materials' | 'memos' | 'activity'`

#### REQ-FE-781: Memo Editor Store [NEW]

The system shall provide a Zustand store for memo editor state.

- `apps/web/stores/memo.store.ts`
- State: `editorMode: 'write' | 'preview' | 'split'`, `isDirty: boolean`, `lastSavedAt: Date | null`
- Actions: `setEditorMode`, `setDirty`, `setLastSaved`
- `isDirty` set to `true` on any content change; `false` after successful save

#### REQ-FE-782: Team WebSocket Store [NEW]

The system shall extend the Zustand UI store to track team WebSocket connection status.

- Extension to `apps/web/stores/ui.store.ts` [EXISTING]
- State: `teamSocketStatus: 'connected' | 'disconnected' | 'connecting' | 'error'`
- Action: `setTeamSocketStatus`

---

### 3.10 TanStack Query Hooks (REQ-FE-785 -- REQ-FE-789)

#### REQ-FE-785: useTeams Hook [NEW]

The system shall provide a `useTeams` hook for fetching paginated team lists.

- `apps/web/hooks/team/useTeams.ts`
- `useMyTeams()`: fetches `GET /api/v1/teams/?member=me`
- `useAvailableTeams(search?: string)`: fetches `GET /api/v1/teams/?available=true&search={query}`
- Returns: `{ data, isLoading, isError, refetch }`

#### REQ-FE-786: useTeam Hook [NEW]

The system shall provide a `useTeam` hook for fetching a single team's details.

- `apps/web/hooks/team/useTeam.ts`
- `useTeamDetail(teamId: string)`: fetches `GET /api/v1/teams/{teamId}`
- `useTeamMembers(teamId: string)`: fetches `GET /api/v1/teams/{teamId}/members`
- `useTeamActivity(teamId: string, page: number)`: fetches `GET /api/v1/teams/{teamId}/activity`

#### REQ-FE-787: useMemos Hook [NEW]

The system shall provide a `useMemos` hook for fetching memo lists with filtering.

- `apps/web/hooks/memo/useMemos.ts`
- `usePersonalMemos(filters: MemoFilterParams)`: fetches `GET /api/v1/memos/?visibility=personal&...filters`
- `useTeamMemos(teamId: string)`: fetches `GET /api/v1/memos/?teamId={teamId}`
- Uses `useInfiniteQuery` for pagination

#### REQ-FE-788: useMemo Hook [NEW]

The system shall provide a `useMemoDetail` hook for fetching and mutating a single memo.

- `apps/web/hooks/memo/useMemoDetail.ts`
- `useMemoDetail(memoId: string)`: fetches `GET /api/v1/memos/{memoId}`
- `useCreateMemo()`: mutation for POST `/api/v1/memos/`
- `useUpdateMemo(memoId: string)`: mutation for PATCH `/api/v1/memos/{memoId}`
- `useDeleteMemo()`: mutation for DELETE `/api/v1/memos/{memoId}`

#### REQ-FE-789: useTeamMutations Hook [NEW]

The system shall provide a `useTeamMutations` hook for team CRUD mutations.

- `apps/web/hooks/team/useTeamMutations.ts`
- `useCreateTeam()`: mutation for POST `/api/v1/teams/`
- `useUpdateTeam(teamId: string)`: mutation for PATCH `/api/v1/teams/{teamId}`
- `useDeleteTeam(teamId: string)`: mutation for DELETE `/api/v1/teams/{teamId}`

---

### 3.11 Unwanted Behavior Requirements (REQ-FE-N700 -- REQ-FE-N704)

#### REQ-FE-N700: No Unguarded Team Memo Access

**If** a non-member attempts to access a team's memos, **then** the system shall not allow access and shall display a 403 error page.

#### REQ-FE-N701: No Data Loss on Navigation

**If** the user has unsaved changes in the memo editor and attempts to navigate away, **then** the system shall not navigate without displaying a confirmation prompt (using existing `useBeforeUnload` hook [EXISTING]).

#### REQ-FE-N702: No Stale WebSocket State

**If** the WebSocket connection drops, **then** the system shall not display the "Live" indicator and must attempt reconnection.

#### REQ-FE-N703: No Unbounded Tag Inputs

The system shall not permit more than 10 tags on a single memo or team.

#### REQ-FE-N704: No Unformatted Markdown in Previews

List view previews (`MemoCard`, `MemoListItem`) shall strip Markdown syntax and display plain text only; they shall not render raw Markdown symbols to the user.

---

## 4. Specifications

### 4.1 Type Definitions

#### 4.1.1 Team Types (packages/shared/src/types/team.types.ts) [NEW]

```typescript
// packages/shared/src/types/team.types.ts
// COMPATIBLE with and EXTENDS existing dashboard.types.ts

import type {
  TeamMemberRole,
  TeamOverview,
  TeamMember,
  TeamActivityItem,
  TeamActivityItemType,
} from "./dashboard.types";

// Re-export dashboard types for convenience
export type { TeamMemberRole, TeamOverview, TeamMember, TeamActivityItem, TeamActivityItemType };

// Full Team entity (extends TeamOverview from dashboard)
export interface Team extends TeamOverview {
  maxMembers: number;
  courseIds: string[];
  createdBy: string;
  updatedAt: Date;
}

// Extended team member with additional fields (extends TeamMember from dashboard)
export interface TeamMemberDetail extends TeamMember {
  userId: string;
  teamId: string;
  joinedAt: Date;
  email?: string;
}

// Team invitation
export interface TeamInvitation {
  id: string;
  teamId: string;
  email: string;
  status: "pending" | "accepted" | "rejected";
  invitedBy: string;
  createdAt: Date;
}

// Extended team activity (extends TeamActivityItem from dashboard)
export interface TeamActivity extends TeamActivityItem {
  teamId: string;
  actorId: string;
  payload?: Record<string, unknown>;
}

// Team detail response (API)
export interface TeamDetailResponse {
  team: Team;
  members: TeamMemberDetail[];
  recentActivity: TeamActivity[];
}

// Team list response
export interface TeamListResponse {
  myTeams: Team[];
  availableTeams: Team[];
}

// Team member update request
export interface TeamMemberUpdateRequest {
  userId: string;
  role: TeamMemberRole;
}

// Team invite request
export interface TeamInviteRequest {
  email: string;
}
```

#### 4.1.2 Memo Types (packages/shared/src/types/memo.types.ts) [NEW]

```typescript
// packages/shared/src/types/memo.types.ts

// Memo visibility (string union, not enum)
export type MemoVisibility = "personal" | "team";

// Memo entity
export interface Memo {
  id: string;
  title: string;
  content: string; // Markdown
  authorId: string;
  authorName: string;
  authorAvatarUrl: string | null;
  teamId: string | null; // null = personal memo
  materialId: string | null;
  anchorId: string | null;
  tags: string[];
  visibility: MemoVisibility;
  isDraft: boolean;
  createdAt: string; // ISO 8601
  updatedAt: string;
}

// Memo link target (material reference)
export interface MemoLinkTarget {
  materialId: string;
  materialTitle: string;
  courseId: string;
  anchorId: string | null;
  anchorText: string | null;
}

// Memo detail response (API)
export interface MemoDetailResponse {
  memo: Memo;
  linkTarget?: MemoLinkTarget;
}

// Memo filter params
export interface MemoFilterParams {
  courseId?: string;
  materialId?: string;
  tags?: string[];
  visibility?: MemoVisibility;
  search?: string;
  teamId?: string;
}

// Create/Update request payloads
export interface CreateMemoRequest {
  title: string;
  content: string;
  tags?: string[];
  materialId?: string;
  anchorId?: string;
  teamId?: string;
  visibility: MemoVisibility;
}

export interface UpdateMemoRequest {
  title?: string;
  content?: string;
  tags?: string[];
  materialId?: string | null;
  anchorId?: string | null;
  visibility?: MemoVisibility;
}
```

### 4.2 WebSocket Event Constants Extension

Add to the existing `EVENTS` object in `packages/shared/src/constants/events.ts`:

```typescript
// Inside existing EVENTS object:
export const EVENTS = {
  // ... existing events unchanged ...

  // Team events (NEW - added by SPEC-FE-008)
  TEAM_MEMBER_JOINED: "team:member_joined",
  TEAM_MEMBER_LEFT: "team:member_left",

  // Team memo events (NEW - added by SPEC-FE-008)
  TEAM_MEMO_CREATED: "team_memo:created",
  TEAM_MEMO_UPDATED: "team_memo:updated",
  TEAM_MEMO_DELETED: "team_memo:deleted",

  // ... rest of existing events ...
} as const;

// Inside existing EVENT_CATEGORIES:
export const EVENT_CATEGORIES = {
  // ... existing categories ...
  TEAM: "team",      // NEW
  MEMO: "memo",      // NEW
} as const;
```

### 4.3 File Structure

```
apps/web/
  app/
    (dashboard)/
      teams/
        page.tsx                           # NEW: Team list page (My Teams + Browse)
        new/
          page.tsx                         # NEW: Team creation form
        [teamId]/
          page.tsx                         # NEW: Team detail page
          layout.tsx                       # NEW: Team detail layout (with header)
      memos/
        page.tsx                           # NEW: Personal memo list
        new/
          page.tsx                         # NEW: Create new personal memo
        [memoId]/
          page.tsx                         # NEW: Memo view (read-only)
          edit/
            page.tsx                       # NEW: Memo editor (edit existing)

  components/
    dashboard/team/
      TeamOverviewWidget.tsx               # EXISTING: dashboard team overview
      TeamMembersWidget.tsx                # EXISTING: dashboard team members
      SharedMemosFeedWidget.tsx            # EXISTING: dashboard shared memos feed
      TeamActivityWidget.tsx               # EXISTING: dashboard team activity
    markdown/
      MarkdownEditor.tsx                   # EXISTING: @uiw/react-md-editor (371 lines)
      EditorWithPreview.tsx                # EXISTING: Write/Preview/Split modes (266 lines)
      MarkdownRenderer.tsx                 # EXISTING: rendering with remark pipeline
      index.ts                             # EXISTING: exports all markdown components
    team/                                  # NEW: Team management components
      TeamCard.tsx                         # NEW: Team summary card
      TeamDetailTabs.tsx                   # NEW: Tab navigation for team detail
      TeamMemoBoard.tsx                    # NEW: Team memo board
      LiveIndicator.tsx                    # NEW: WebSocket connection status badge
      MemberListItem.tsx                   # NEW: Single member row in Members tab
      InviteMemberModal.tsx                # NEW: Email-based member invitation modal
      ActivityFeedItem.tsx                 # NEW: Single activity item in Activity tab
      SharedMaterialsTab.tsx               # NEW: Shared materials tab content
    memo/                                  # NEW: Memo components
      MemoCard.tsx                         # NEW: Memo card for team memo board
      MemoListItem.tsx                     # NEW: Memo item for personal list
      MemoEditorWrapper.tsx                # NEW: Wraps EditorWithPreview for memo context
      MaterialLinkDialog.tsx               # NEW: Material picker dialog
      DraftRestoreBanner.tsx               # NEW: Draft restore prompt banner
      MemoFilterSidebar.tsx                # NEW: Filter sidebar for desktop
      MemoFilterSheet.tsx                  # NEW: Filter bottom sheet for mobile

  hooks/
    dashboard/
      useTeamDashboard.ts                  # EXISTING: team dashboard data
      useTeamRealtimeUpdates.ts            # EXISTING: team real-time updates
    useBeforeUnload.ts                     # EXISTING: navigation guard
    useDebounce.ts                         # EXISTING: debounce utility
    useMediaQuery.ts                       # EXISTING: responsive breakpoint detection
    useScrollPosition.ts                   # EXISTING: scroll position tracking
    team/                                  # NEW: Team-specific hooks
      useTeams.ts                          # NEW: Team list queries
      useTeam.ts                           # NEW: Team detail queries
      useTeamMutations.ts                  # NEW: Team CRUD mutations
      useTeamMembership.ts                 # NEW: Team membership mutations
      useTeamSearch.ts                     # NEW: Team search with debounce
      useTeamMemoSocket.ts                 # NEW: WebSocket hook for team memos
    memo/                                  # NEW: Memo-specific hooks
      useMemos.ts                          # NEW: Memo list queries
      useMemoDetail.ts                     # NEW: Single memo queries + mutations
      useAutoSaveDraft.ts                  # NEW: LocalStorage auto-save hook

  stores/
    navigation.store.ts                    # EXISTING
    auth.store.ts                          # EXISTING
    dashboard.store.ts                     # EXISTING
    ui.store.ts                            # EXISTING (extended with teamSocketStatus)
    material.store.ts                      # EXISTING
    course.store.ts                        # EXISTING
    team.store.ts                          # NEW: Team client state
    memo.store.ts                          # NEW: Memo editor state

  lib/
    api-endpoints.ts                       # EXISTING: TEAM_DASHBOARD_ENDPOINTS already defined

packages/shared/
  src/
    types/
      api.types.ts                         # EXISTING: ApiResponse<T>, PaginatedResponse<T>
      dashboard.types.ts                   # EXISTING: TeamOverview, TeamMember, SharedMemo, TeamActivityItem, TeamMemberRole
      team.types.ts                        # NEW: Full Team types (extends dashboard types)
      memo.types.ts                        # NEW: Full Memo types
      index.ts                             # EXISTING: needs team + memo exports added
    validators/
      team.schema.ts                       # NEW: CreateTeamSchema, UpdateTeamSchema
      memo.schema.ts                       # NEW: CreateMemoSchema, UpdateMemoSchema
      index.ts                             # EXISTING: needs team + memo exports added
    constants/
      events.ts                            # EXISTING: EVENTS object extended with 5 new team/memo events
```

### 4.4 Component Architecture

#### Team List Page

```
app/(dashboard)/teams/page.tsx (Server Component)
  |
  +-- Fetches initial team data (GET /api/v1/teams/?member=me)
  |
  +-- ClientTeamList (Client Component - 'use client')
        |
        +-- MyTeamsSection
        |     +-- TeamCard (x N) [NEW]
        |           +-- Avatar group, team name, description, member count
        |           +-- Role badge ("leader" / "member")
        |
        +-- BrowseTeamsSection
        |     +-- Search input (useDebounce [EXISTING])
        |     +-- TeamCard (x N) [NEW]
        |           +-- Join / View button
        |
        +-- Empty states per section
```

#### Team Detail Page

```
app/(dashboard)/teams/[teamId]/page.tsx (Server Component)
  |
  +-- Fetches team detail (GET /api/v1/teams/:teamId)
  |
  +-- TeamDetailTabs (Client Component - 'use client') [NEW]
        |
        +-- MembersTab
        |     +-- MemberListItem (x N) [NEW]
        |     +-- InviteMemberModal [NEW]
        |
        +-- SharedMaterialsTab [NEW]
        |
        +-- TeamMemosTab
        |     +-- TeamMemoBoard [NEW]
        |           +-- LiveIndicator [NEW]
        |           +-- MemoCard (x N, infinite) [NEW]
        |
        +-- ActivityTab
              +-- ActivityFeedItem (x N) [NEW]
```

#### Memo Editor Page

```
app/(dashboard)/memos/new/page.tsx (Client Component)
  |
  +-- DraftRestoreBanner [NEW]
  |
  +-- MemoEditorForm (React Hook Form + CreateMemoSchema)
  |     +-- Title input
  |     +-- Tag chip input
  |     +-- MaterialLinkButton -> MaterialLinkDialog [NEW]
  |     +-- Team toggle (when teamId context provided)
  |
  +-- MemoEditorWrapper [NEW]
  |     +-- EditorWithPreview [EXISTING] (components/markdown/)
  |           +-- Write mode / Preview mode / Split mode
  |           +-- MarkdownRenderer [EXISTING] for preview
  |
  +-- Hooks integration
        +-- useAutoSaveDraft [NEW] -> useDebounce [EXISTING]
        +-- useBeforeUnload [EXISTING] -> unsaved changes guard
        +-- useCreateMemo / useUpdateMemo [NEW]
```

### 4.5 API Endpoint Mapping

| Hook | Method | Endpoint | Query Key |
|------|--------|----------|-----------|
| `useMyTeams` | GET | `/api/v1/teams/?member=me` | `['teams', 'my']` |
| `useAvailableTeams` | GET | `/api/v1/teams/?available=true&search={q}` | `['teams', 'available', search]` |
| `useCreateTeam` | POST | `/api/v1/teams/` | invalidates `['teams']` |
| `useTeamDetail` | GET | `/api/v1/teams/:teamId` | `['team', teamId]` |
| `useUpdateTeam` | PATCH | `/api/v1/teams/:teamId` | invalidates `['team', teamId]` |
| `useDeleteTeam` | DELETE | `/api/v1/teams/:teamId` | invalidates `['teams']` |
| `useTeamMembers` | GET | `/api/v1/teams/:teamId/members` | `['team', teamId, 'members']` |
| `joinTeam` | POST | `/api/v1/teams/:teamId/join` | invalidates `['team', teamId]` |
| `leaveTeam` | DELETE | `/api/v1/teams/:teamId/leave` | invalidates `['team', teamId]` |
| `inviteMember` | POST | `/api/v1/teams/:teamId/members/invite` | invalidates `['team', teamId, 'members']` |
| `removeMember` | DELETE | `/api/v1/teams/:teamId/members/:userId` | invalidates `['team', teamId, 'members']` |
| `changeMemberRole` | PATCH | `/api/v1/teams/:teamId/members/:userId` | invalidates `['team', teamId, 'members']` |
| `useTeamActivity` | GET | `/api/v1/teams/:teamId/activity` | `['team', teamId, 'activity']` |
| `usePersonalMemos` | GET | `/api/v1/memos/?visibility=personal&...` | `['memos', 'personal', filters]` |
| `useTeamMemos` | GET | `/api/v1/memos/?teamId={teamId}` | `['memos', { teamId }]` |
| `useMemoDetail` | GET | `/api/v1/memos/:memoId` | `['memo', memoId]` |
| `useCreateMemo` | POST | `/api/v1/memos/` | invalidates `['memos']` |
| `useUpdateMemo` | PATCH | `/api/v1/memos/:memoId` | invalidates `['memo', memoId]` |
| `useDeleteMemo` | DELETE | `/api/v1/memos/:memoId` | invalidates `['memos']` |

### 4.6 WebSocket Event Flow

```
Client (useTeamMemoSocket)          Server (WebSocket Gateway)
        |                                    |
        |-- WS connect (team scope) -------->|
        |                                    |
        |<-- "team_memo:created" event ------|
        |   invalidate ['memos', {teamId}]   |
        |                                    |
        |<-- "team_memo:updated" event ------|
        |   invalidate ['memos', {teamId}]   |
        |                                    |
        |<-- "team_memo:deleted" event ------|
        |   invalidate ['memos', {teamId}]   |
        |                                    |
        |<-- "team:member_joined" event -----|
        |   invalidate ['team', teamId]      |
        |                                    |
        |<-- "team:member_left" event -------|
        |   invalidate ['team', teamId]      |
        |                                    |
        |-- WS disconnect on unmount ------->|
```

### 4.7 Zustand Store Shapes

#### Team Store (apps/web/stores/team.store.ts) [NEW]

```typescript
type TeamDetailTab = 'members' | 'materials' | 'memos' | 'activity';

interface TeamStore {
  currentTeamId: string | null;
  activeTab: TeamDetailTab;
  setCurrentTeam: (teamId: string | null) => void;
  setActiveTab: (tab: TeamDetailTab) => void;
}
```

#### Memo Editor Store (apps/web/stores/memo.store.ts) [NEW]

```typescript
interface MemoEditorStore {
  editorMode: 'write' | 'preview' | 'split';
  isDirty: boolean;
  lastSavedAt: Date | null;
  setEditorMode: (mode: 'write' | 'preview' | 'split') => void;
  setDirty: (dirty: boolean) => void;
  setLastSaved: (date: Date) => void;
}
```

#### UI Store Extension (apps/web/stores/ui.store.ts) [EXISTING - EXTENDED]

```typescript
// Add to existing UIStore:
interface UIStore {
  // ... existing state ...
  teamSocketStatus: 'connected' | 'disconnected' | 'connecting' | 'error';
  setTeamSocketStatus: (status: 'connected' | 'disconnected' | 'connecting' | 'error') => void;
}
```

### 4.8 Role-Based Feature Matrix

| Feature | STUDENT | INSTRUCTOR |
|---------|---------|------------|
| View team list | Yes | Yes |
| Create team | Yes | Yes |
| Browse and join teams | Yes | Yes |
| Leave team | Yes (member) | Yes (member) |
| Invite members | Yes (leader only) | Yes (leader only) |
| Remove members | Yes (leader only) | Yes (leader only) |
| Change member roles | Yes (leader only) | Yes (leader only) |
| Delete team | Yes (leader only) | Yes (leader only) |
| View shared materials | Yes (team member) | Yes (team member) |
| Add shared material | Yes (team member) | Yes (team member) |
| Remove shared material | Yes (leader only) | Yes (leader only) |
| View team memos | Yes (team member) | Yes (team member) |
| Create team memo | Yes (team member) | Yes (team member) |
| Edit own team memo | Yes | Yes |
| Delete own team memo | Yes | Yes |
| Delete any team memo | Yes (leader only) | Yes (leader only) |
| View personal memos | Yes (own only) | Yes (own only) |
| Create personal memo | Yes | Yes |
| Edit own personal memo | Yes | Yes |
| Delete own personal memo | Yes | Yes |
| Link memo to material | Yes | Yes |
| View team activity | Yes (team member) | Yes (team member) |

> Note: Team membership roles (`"leader"` / `"member"`) are separate from user roles (`STUDENT` / `INSTRUCTOR`). Any user can be a team leader or member regardless of their system role.

### 4.9 Auto-Save State Machine

```
[User types in editor]
      |
      v
[isDirty = true]
      |
      v (30s debounce via useDebounce [EXISTING])
[Save to localStorage: memo-draft-${userId}-${memoId}]
      |
      v
["Draft saved" indicator appears -> fades after 3s]
      |
      v
[User navigates away?]
      |
     Yes -> [useBeforeUnload [EXISTING]: "Leave site?" dialog]
      |
      No -> [Continue editing]
```

### 4.10 Traceability Matrix

| Requirement | Design File Reference | Foundation Dependency |
|-------------|----------------------|----------------------|
| REQ-FE-700 (Team Types) | -- | EXISTING `dashboard.types.ts` types |
| REQ-FE-701 (Memo Types) | -- | SPEC-FE-001 `@shared/types` |
| REQ-FE-704 (WS Events) | -- | EXISTING `EVENTS` object in `@shared/constants/events` |
| REQ-FE-710 (Team List) | `team-list.pen` | SPEC-FE-001 AppLayout, ContentLayout |
| REQ-FE-711 (My Teams) | `team-list.pen` | SPEC-FE-001 Card, Skeleton, Badge |
| REQ-FE-712 (Browse Teams) | `team-list.pen` | SPEC-FE-001 Card, Button, Input, Tooltip; `useDebounce` [EXISTING] |
| REQ-FE-715 (Team Create) | `team-create.pen` | SPEC-FE-001 Dialog, Form, Input, Textarea, Button |
| REQ-FE-720 (Team Detail) | `team-detail.pen` | SPEC-FE-001 AppLayout, Tabs |
| REQ-FE-722 (Members Tab) | `team-detail.pen` | SPEC-FE-001 Avatar, Badge, Button, Dialog |
| REQ-FE-724 (Team Memos) | `team-memo.pen` | SPEC-FE-001 Card, Button |
| REQ-FE-740 (TeamMemoBoard) | `team-memo.pen` | SPEC-FE-001 Card, Button, Skeleton |
| REQ-FE-741 (MemoCard) | `team-memo.pen` | SPEC-FE-001 Card, Avatar, Badge, DropdownMenu |
| REQ-FE-742 (WebSocket) | -- | `useTeamRealtimeUpdates` [EXISTING] pattern |
| REQ-FE-750 (Memo List) | `memo-list.pen` | SPEC-FE-001 AppLayout, ContentLayout |
| REQ-FE-751 (Memo Layout) | `memo-list.pen` | SPEC-FE-001 Sheet (mobile); `useMediaQuery` [EXISTING] |
| REQ-FE-754 (Memo List Item) | `memo-list.pen` | SPEC-FE-001 Card, Badge, Button |
| REQ-FE-760 (Memo Editor) | `memo-editor.pen` | SPEC-FE-004 `EditorWithPreview` [EXISTING], `MarkdownRenderer` [EXISTING] |
| REQ-FE-761 (MemoEditorWrapper) | `memo-editor.pen` | `components/markdown/EditorWithPreview` [EXISTING] |
| REQ-FE-763 (Auto-Save) | -- | `useDebounce` [EXISTING], `useBeforeUnload` [EXISTING] |
| REQ-FE-766 (MaterialLinkDialog) | `memo-editor.pen` | SPEC-FE-001 Dialog, Select, Button |
| REQ-FE-770 (Memo View) | `memo-editor.pen` | `MarkdownRenderer` [EXISTING], SPEC-FE-001 Card, Badge, Button, Avatar |

---

## 5. Dependency Map

```
SPEC-FE-008 (Team & Memo System)
  +-- SPEC-FE-001 (Foundation) [REQUIRED]
  |     design tokens, layout, shadcn/ui, providers, API client, stores
  +-- SPEC-FE-002 (Auth) [REQUIRED]
  |     useAuthStore, session context, UserRole, access guards
  +-- SPEC-FE-004 (Material Viewer) [REQUIRED]
  |     MarkdownRenderer, EditorWithPreview, MarkdownEditor, markdown libraries
  +-- SPEC-FE-005 (Course Feature) [SOFT DEPENDENCY]
  |     Course types and API hooks for course association in teams/memos
  +-- Dashboard Team Implementation [EXISTING]
        TeamOverview, TeamMember, TeamMemberRole, TeamActivityItem types
        Dashboard team widgets and hooks
```
