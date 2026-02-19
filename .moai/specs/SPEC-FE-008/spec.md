---
id: SPEC-FE-008
title: "Team and Memo System"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: medium
tags: [frontend, nextjs, team, memo, collaboration, markdown-editor, websocket, real-time]
related_specs: [SPEC-FE-001, SPEC-FE-002, SPEC-FE-004, SPEC-FE-005, SPEC-UI-001]
---

# SPEC-FE-008: Team and Memo System

## 1. Environment

### 1.1 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| CSS Framework | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (Radix UI) | latest |
| State Management | Zustand | latest |
| Data Fetching | TanStack Query | v5 |
| Form Handling | React Hook Form + Zod | latest |
| Icons | Lucide React | latest |
| Testing | Vitest + React Testing Library | latest |
| Authentication | next-auth (Auth.js) | v5 |

### 1.2 Foundation Dependencies (SPEC-FE-001)

This SPEC builds directly on the foundation provided by SPEC-FE-001:

- **Design Tokens**: Color, typography, spacing, component CSS variables
- **Layout System**: AppLayout, Sidebar, BottomTab, ContentLayout
- **UI Components**: shadcn/ui button, card, dialog, badge, avatar, input, textarea, skeleton, toast
- **Providers**: ThemeProvider, QueryProvider, AuthProvider
- **Stores**: navigation.store, auth.store, ui.store
- **API Client**: `apps/web/lib/api.ts`
- **Shared Types**: `packages/shared/src/types/` (team.types.ts, memo.types.ts enriched by this SPEC)

### 1.3 Design Constraints

- **Responsive Breakpoints**: Mobile 375px (4-col), Tablet 768px (8-col), Desktop 1280px+ (12-col)
- **Accessibility**: WCAG 2.1 AA compliance required
- **Markdown Editor**: Simpler than material editor — write + live preview pane
- **Real-Time Preparation**: WebSocket skeleton for team memo collaboration (non-blocking)
- **Auto-save**: Draft memos auto-saved to localStorage every 30 seconds

### 1.4 Design File References

The following .pen files from SPEC-UI-001 define the visual design for this SPEC. They are referenced for design intent only and are not read directly during implementation.

| .pen File | Screen |
|-----------|--------|
| `design/screens/team/team-list.pen` | Team list page (my teams, browse teams) |
| `design/screens/team/team-detail.pen` | Team detail page (members, shared materials, team memos, activity) |
| `design/screens/team/team-create.pen` | Team creation form |
| `design/screens/team/team-memo.pen` | Team memo board (shared notes within a team) |
| `design/screens/memo/memo-list.pen` | Personal memo list (individual study notes) |
| `design/screens/memo/memo-editor.pen` | Memo editor (Markdown-based note taking) |

---

## 2. Assumptions

### 2.1 Foundation State

- SPEC-FE-001 is complete: design tokens, layout system, shadcn/ui components, providers, API client, and Zustand stores are available.
- SPEC-FE-002 is complete: authentication context (`useAuth`, `useSession`) and role-based access (`UserRole.STUDENT`, `UserRole.INSTRUCTOR`) are available.
- SPEC-FE-004 is complete: the Markdown rendering engine (`MarkdownRenderer` component, remark/rehype pipeline) is available for reuse in memo preview.
- SPEC-FE-005 is complete or in progress: course-associated team data structures and course API types are accessible.

### 2.2 API Assumptions

- The Fastify backend exposes `/api/teams` and `/api/memos` REST endpoints.
- Team membership operations (join, leave, invite, role change) use `/api/teams/:id/members` endpoints.
- Memo CRUD operations use `/api/memos` with query parameters for filtering (by course, material, tag).
- Team memos are a subset of memos with a `teamId` property; personal memos have `teamId: null`.
- The backend supports WebSocket events for team memo collaboration via the existing gateway (`apps/api/src/websocket/gateway.ts`).

### 2.3 Data Model Assumptions

- A team can optionally be associated with one or more courses (`courseIds: string[]`).
- Team membership roles are: `TEAM_LEAD` (creator) and `MEMBER`.
- A memo can have: a `materialId` (link to a specific material) and an `anchorId` (link to a section within that material).
- Memo tags are free-form strings (no predefined taxonomy).
- Personal memos are private to the author; team memos are visible to all team members.
- Auto-save stores draft content in `localStorage` keyed by memo ID (`memo-draft-${id}`).

### 2.4 Scope Assumptions

- This SPEC covers the Team and Memo feature domain for the `apps/web/` frontend only.
- Real-time collaboration is implemented as a WebSocket skeleton (connection setup, event type definitions) — full collaborative editing (like Yjs/OT) is out of scope.
- File attachments in memos are out of scope.
- Team-level notification settings are out of scope.
- The memo editor does not implement a full rich-text editor (WYSIWYG); it uses a Markdown textarea + live preview model.

---

## 3. Requirements

### 3.1 Shared Type Enrichment (REQ-FE-700 through REQ-FE-704)

#### REQ-FE-700: Team Type Definitions

The system shall enrich `packages/shared/src/types/team.types.ts` with complete Team domain types.

- Types: `Team`, `TeamMember`, `TeamRole` (enum: `TEAM_LEAD`, `MEMBER`), `TeamInvitation`, `TeamActivity`
- `Team`: `id`, `name`, `description`, `maxMembers`, `currentMemberCount`, `courseIds`, `createdBy`, `createdAt`, `updatedAt`
- `TeamMember`: `userId`, `teamId`, `role`, `joinedAt`, `user` (nested `User` type)
- `TeamActivity`: `id`, `teamId`, `actorId`, `actorName`, `action`, `payload`, `createdAt`
- Zod schema: `CreateTeamSchema`, `UpdateTeamSchema` in `packages/shared/src/validators/team.schema.ts`

#### REQ-FE-701: Memo Type Definitions

The system shall enrich `packages/shared/src/types/memo.types.ts` with complete Memo domain types.

- Types: `Memo`, `MemoTag`, `MemoVisibility` (enum: `PERSONAL`, `TEAM`), `MemoLinkTarget`
- `Memo`: `id`, `title`, `content`, `authorId`, `teamId` (nullable), `materialId` (nullable), `anchorId` (nullable), `tags`, `visibility`, `isDraft`, `createdAt`, `updatedAt`
- `MemoLinkTarget`: `materialId`, `materialTitle`, `anchorId`, `anchorText`
- Zod schema: `CreateMemoSchema`, `UpdateMemoSchema` in `packages/shared/src/validators/memo.schema.ts`

#### REQ-FE-702: Team API Type Definitions

The system shall provide API request/response types for team operations in `packages/shared/src/types/api.types.ts` extension.

- `TeamListResponse`: `PaginatedResponse<Team>` with `myTeams` and `availableTeams` arrays
- `TeamDetailResponse`: `Team & { members: TeamMember[]; recentActivity: TeamActivity[] }`
- `TeamMemberUpdateRequest`: `{ userId: string; role: TeamRole }`
- `TeamInviteRequest`: `{ email: string }`

#### REQ-FE-703: Memo API Type Definitions

The system shall provide API request/response types for memo operations.

- `MemoListResponse`: `PaginatedResponse<Memo>` with filter metadata (`activeCourseFilter`, `activeMaterialFilter`)
- `MemoDetailResponse`: `Memo & { linkTarget?: MemoLinkTarget }`
- `MemoFilterParams`: `{ courseId?: string; materialId?: string; tags?: string[]; visibility?: MemoVisibility; search?: string }`

#### REQ-FE-704: WebSocket Event Types for Team Memo

The system shall add team memo WebSocket event type constants to `packages/shared/src/constants/events.ts`.

- `TEAM_MEMO_CREATED`: emitted when a new team memo is posted
- `TEAM_MEMO_UPDATED`: emitted when a team memo is edited
- `TEAM_MEMO_DELETED`: emitted when a team memo is removed
- `TEAM_MEMBER_JOINED`: emitted when a member joins the team
- `TEAM_MEMBER_LEFT`: emitted when a member leaves the team

---

### 3.2 Team List Page (REQ-FE-710 through REQ-FE-714)

#### REQ-FE-710: Team List Page Route

The system shall implement the team list page at `app/teams/page.tsx`.

- Server Component that fetches initial team list data (SSR)
- Page title: "Teams" with action button to create a new team
- Two sections: "My Teams" (teams the current user belongs to) and "Browse Teams" (available public teams)
- Consistent with `design/screens/team/team-list.pen`

#### REQ-FE-711: My Teams Section

**When** a user navigates to the team list page, **then** the system shall display all teams the user is a member of, ordered by most recently active.

- Each team card shows: team name, description (truncated), member count / max members, role badge (Lead or Member), and associated course names
- Empty state: "You haven't joined any teams yet. Browse available teams below."
- Loading skeleton using `Skeleton` component from SPEC-FE-001

#### REQ-FE-712: Browse Teams Section

**When** a user views the Browse Teams section, **then** the system shall display teams available to join with search and filter functionality.

- Search input: filter teams by name or description (client-side debounce 300ms)
- Team card shows: name, description, member count / max members, associated courses, join button
- **If** the team is full (currentMemberCount >= maxMembers), **then** the join button shall be disabled with tooltip "Team is full"
- **If** the user is already a member, **then** the join button shall show "View" instead

#### REQ-FE-713: Team Card Component

The system shall provide a reusable `TeamCard` component for displaying team summary information.

- `apps/web/components/team/TeamCard.tsx`
- Props: `team: Team`, `currentUserId: string`, `onJoin?: () => void`, `onView?: () => void`
- Displays: avatar group (first 3 member avatars), team name, description, course badges, member count
- Role badge (TEAM_LEAD or MEMBER) only shown in My Teams section

#### REQ-FE-714: Team Search Hook

The system shall provide a custom hook for team search and filtering.

- `apps/web/hooks/useTeamSearch.ts`
- Uses TanStack Query with debounced search query
- Returns: `teams`, `isLoading`, `searchQuery`, `setSearchQuery`
- Integrates with `/api/teams?search={query}&available=true` endpoint

---

### 3.3 Team Creation Form (REQ-FE-715 through REQ-FE-718)

#### REQ-FE-715: Team Creation Route

The system shall implement the team creation form at `app/teams/new/page.tsx`.

- Client Component with React Hook Form + Zod validation using `CreateTeamSchema`
- Accessible via "Create Team" button on team list page
- Consistent with `design/screens/team/team-create.pen`

#### REQ-FE-716: Team Creation Form Fields

The system shall provide form fields for team creation with inline validation.

- **Name** (required): text input, min 2 / max 50 characters
- **Description** (optional): textarea, max 500 characters, character counter shown
- **Max Members** (required): number input, min 2 / max 100, default 10
- **Course Association** (optional): multi-select dropdown showing available courses the user is enrolled in or teaches
- Submit button: "Create Team" — disabled while submitting
- Cancel link: returns to team list page

#### REQ-FE-717: Team Creation Submission

**When** the user submits the team creation form with valid data, **then** the system shall send a POST request to `/api/teams` and redirect to the newly created team's detail page.

- Optimistic UI: show loading spinner on submit button
- **If** the API returns a validation error, **then** display field-level error messages
- **If** the API returns a server error, **then** display a toast notification: "Failed to create team. Please try again."
- On success: invalidate `teams` query cache and redirect to `/teams/{newTeamId}`

#### REQ-FE-718: Team Creation Access Control

**If** the current user does not have an authenticated session, **then** the system shall redirect to the login page before accessing team creation.

- Redirect target: `/login?next=/teams/new`
- Both student and instructor roles may create teams

---

### 3.4 Team Detail Page (REQ-FE-720 through REQ-FE-727)

#### REQ-FE-720: Team Detail Page Route

The system shall implement the team detail page at `app/teams/[teamId]/page.tsx`.

- Server Component with initial data fetch
- Four sections accessible via tab navigation: Members, Shared Materials, Team Memos, Activity
- Consistent with `design/screens/team/team-detail.pen`

#### REQ-FE-721: Team Detail Header

The system shall display a team detail header with team identity and membership actions.

- Team name, description, course association badges
- Member count chip: "X / Y members"
- If the user is TEAM_LEAD: settings icon button linking to team settings
- If the user is MEMBER: "Leave Team" button with confirmation dialog
- If the user is not a member: "Join Team" button (or "Team Full" disabled state)

#### REQ-FE-722: Members Tab

**When** the user selects the Members tab, **then** the system shall display all team members with their roles and join dates.

- Member list item: avatar, display name, role badge (Lead / Member), joined date
- If the current user is TEAM_LEAD:
  - "Change Role" action (promote to Lead / demote to Member)
  - "Remove Member" action with confirmation dialog
  - "Invite Member" button that opens an invite modal
- Member invite modal: email input with validation, "Send Invite" button
- Empty state: "No members yet. Invite people to join your team."

#### REQ-FE-723: Shared Materials Tab

**When** the user selects the Shared Materials tab, **then** the system shall display materials that team members have linked or recommended within the team context.

- Material card: title, course name, author, date linked, link to view material
- "Add Material" button (opens a course material picker dialog)
- This tab is read-only for MEMBER role; TEAM_LEAD can remove shared materials
- Reuses `MaterialCard` component pattern from SPEC-FE-004 if available; otherwise uses a simplified card

#### REQ-FE-724: Team Memos Tab

**When** the user selects the Team Memos tab, **then** the system shall display the team memo board and allow creating new team memos.

- Rendered by the `TeamMemoBoard` component (REQ-FE-740)
- Consistent with `design/screens/team/team-memo.pen`

#### REQ-FE-725: Activity Tab

**When** the user selects the Activity tab, **then** the system shall display a chronological feed of team activities.

- Activity items: member joined/left, memo created/updated, material shared
- Each item: actor avatar, actor name, action description, timestamp (relative: "2 hours ago")
- Pagination: load 20 items at a time with "Load more" button
- Empty state: "No activity yet."

#### REQ-FE-726: Team Detail Tab Navigation

The system shall implement tab navigation for the team detail page using shadcn/ui `Tabs` component.

- `apps/web/components/team/TeamDetailTabs.tsx`
- Tabs: Members | Shared Materials | Team Memos | Activity
- URL hash synchronization: `#members`, `#materials`, `#memos`, `#activity`
- Default active tab: Members

#### REQ-FE-727: Team Membership Actions Hook

The system shall provide a custom hook encapsulating team membership mutation logic.

- `apps/web/hooks/useTeamMembership.ts`
- Actions: `joinTeam`, `leaveTeam`, `inviteMember`, `removeMember`, `changeMemberRole`
- Each action uses TanStack Query `useMutation`
- On success: invalidate `['team', teamId]` query
- On error: display toast notification with action-specific error message

---

### 3.5 Team Memo Board (REQ-FE-740 through REQ-FE-745)

#### REQ-FE-740: Team Memo Board Component

The system shall provide a `TeamMemoBoard` component that displays all memos shared within a team.

- `apps/web/components/team/TeamMemoBoard.tsx`
- Fetches memos via `/api/memos?teamId={teamId}` using TanStack Query
- Displays memos as a feed (newest first)
- "New Team Memo" button triggers the memo editor in team-memo mode
- Consistent with `design/screens/team/team-memo.pen`

#### REQ-FE-741: Team Memo Card

The system shall provide a `MemoCard` component for displaying memo summary in the board view.

- `apps/web/components/memo/MemoCard.tsx`
- Displays: author avatar + name, memo title, content preview (first 150 characters, Markdown stripped), tags, timestamp
- Action menu (three-dot): Edit (author only), Delete (author or TEAM_LEAD only)
- Click on card: navigate to `/memos/{memoId}` for full view

#### REQ-FE-742: WebSocket Connection for Team Memo Real-Time Updates

The system shall implement a WebSocket connection skeleton for receiving real-time team memo updates.

- `apps/web/hooks/useTeamMemoSocket.ts`
- Connects to `ws://api/ws/teams/{teamId}` using the existing WebSocket client (`lib/websocket.ts`)
- Subscribes to `TEAM_MEMO_CREATED`, `TEAM_MEMO_UPDATED`, `TEAM_MEMO_DELETED` events
- On event received: invalidate `['memos', { teamId }]` TanStack Query cache to trigger refetch
- Connection lifecycle: connect on component mount, disconnect on unmount
- Error handling: log WebSocket errors; do not crash UI on connection failure

#### REQ-FE-743: Real-Time Indicator

**While** the WebSocket connection to the team memo board is active, **then** the system shall display a "Live" indicator badge.

- Green dot + "Live" label adjacent to the "Team Memos" section heading
- **If** the WebSocket connection is disconnected or failed, **then** display a "Reconnecting..." indicator
- Indicator component: `apps/web/components/team/LiveIndicator.tsx`

#### REQ-FE-744: Team Memo Pagination

The system shall implement infinite scroll pagination for the team memo board.

- Uses TanStack Query `useInfiniteQuery` for paginated fetching
- Page size: 20 memos per page
- Intersection Observer–based trigger at the bottom of the list
- Loading skeleton displayed while fetching the next page

#### REQ-FE-745: Team Memo Board Empty State

**When** a team has no memos, **then** the system shall display an empty state with a prompt to create the first team memo.

- Illustration area, heading "No team memos yet", subtext "Share insights and notes with your team."
- "Create First Memo" button

---

### 3.6 Personal Memo List (REQ-FE-750 through REQ-FE-754)

#### REQ-FE-750: Personal Memo List Page Route

The system shall implement the personal memo list page at `app/memos/page.tsx`.

- Server Component for initial render; client-side filtering via query params
- Displays all memos authored by the current user with `visibility: PERSONAL`
- Consistent with `design/screens/memo/memo-list.pen`

#### REQ-FE-751: Memo List Layout

The system shall display personal memos in a two-column layout on Desktop, one-column on Mobile.

- Left panel (Desktop): filter sidebar (search, course filter, material filter, tag filter, visibility toggle)
- Right panel (Desktop): memo card list with sort controls
- Mobile: filter bar collapses into a bottom sheet accessed via filter icon button
- Sort options: "Newest", "Oldest", "Last modified", "Title A-Z"

#### REQ-FE-752: Memo Search and Filter

**When** a user applies filters on the memo list, **then** the system shall display only memos matching all active filters.

- Search: full-text search against title and content, debounce 300ms
- Course filter: dropdown selecting from courses the user is enrolled in
- Material filter: subordinate to course filter; shows materials within the selected course
- Tag filter: multi-select chip input for tag-based filtering
- Visibility toggle: "Personal" | "Team" (shows team memos the user has authored)
- Active filters: displayed as dismissible chips above the memo list
- Clear all: single button to reset all filters

#### REQ-FE-753: Memo List Empty States

The system shall display contextual empty states depending on filter and data conditions.

- No memos at all: "You haven't created any memos yet." + "Create your first memo" button
- No results for filters: "No memos match your filters." + "Clear filters" button
- No memos in selected course: "No memos linked to this course yet."

#### REQ-FE-754: Memo List Item

The system shall display each memo as a list card with summary information and quick actions.

- `apps/web/components/memo/MemoListItem.tsx`
- Displays: title, content preview (100 chars, Markdown stripped), tags (up to 3, "+N more"), linked material name (if set), last modified timestamp
- Hover actions: Edit button, Delete button
- Click on item: navigate to `/memos/{memoId}` for full view / edit

---

### 3.7 Memo Editor (REQ-FE-760 through REQ-FE-768)

#### REQ-FE-760: Memo Editor Page Routes

The system shall implement memo editor routes for creating and editing memos.

- Create personal memo: `app/memos/new/page.tsx`
- Edit existing memo: `app/memos/[memoId]/edit/page.tsx`
- Create team memo: accessible via the Team Memo Board; uses the same editor in team mode
- View memo: `app/memos/[memoId]/page.tsx` (read-only, with edit button for author)
- Consistent with `design/screens/memo/memo-editor.pen`

#### REQ-FE-761: Memo Editor Component

The system shall provide a `MemoEditor` component implementing a split-pane Markdown editor with live preview.

- `apps/web/components/memo/MemoEditor.tsx`
- Left pane: `<textarea>` for Markdown input with monospace font and line numbers (optional)
- Right pane: Markdown preview using the `MarkdownRenderer` from SPEC-FE-004
- Toggle button: switch between "Write", "Preview", and "Split" modes
- Consistent with `design/screens/memo/memo-editor.pen`

#### REQ-FE-762: Memo Editor Form Fields

The system shall provide the following form fields in the memo editor, validated using `CreateMemoSchema`.

- **Title** (required): text input, max 200 characters
- **Tags**: comma-separated tag input, each tag max 30 characters, max 10 tags total
  - Tags displayed as dismissible chips below the input
- **Link to Material** (optional): "Link Material" button opens a material picker dialog
  - Picker shows courses → materials hierarchy
  - Selected link shown as: "{materialTitle} › {anchorText or section}"
- **Team Memo Toggle** (optional): "Share with team" checkbox; only visible when `teamId` context is provided
- **Visibility**: auto-set based on team toggle (PERSONAL or TEAM)

#### REQ-FE-763: Memo Auto-Save

**While** the user is editing a memo, the system shall auto-save the draft to localStorage every 30 seconds.

- Storage key: `memo-draft-${memoId}` for existing memos, `memo-draft-new` for new memos
- Draft indicator: "Draft saved" label shown below the editor after each save, fades after 3 seconds
- **When** the user navigates away with unsaved changes, **then** the system shall show a browser "Leave site?" confirmation dialog (using `useBeforeUnload` hook)
- **When** the user returns to an in-progress draft, **then** the system shall offer to restore the draft

#### REQ-FE-764: Memo Draft Restore Prompt

**When** a draft exists in localStorage for the current memo context, **then** the system shall prompt the user to restore or discard the draft.

- Displayed as a dismissible banner at the top of the editor
- "Restore Draft" button: loads draft content into the editor
- "Discard" button: clears localStorage draft and proceeds with empty/current content

#### REQ-FE-765: Memo Save and Publish

**When** the user saves a memo, **then** the system shall send a POST (create) or PATCH (update) request to the API and display a success notification.

- On create: POST `/api/memos`, redirect to `/memos/{newMemoId}` on success
- On update: PATCH `/api/memos/{memoId}`, stay on editor with success toast
- **If** the API returns a validation error, **then** display field-level error messages
- **If** the API returns a server error, **then** display a toast: "Failed to save memo."
- Keyboard shortcut: `Ctrl+S` / `Cmd+S` triggers save

#### REQ-FE-766: Memo Material Link Dialog

**When** the user clicks "Link Material" in the memo editor, **then** the system shall display a dialog for selecting a material and optional section anchor.

- `apps/web/components/memo/MaterialLinkDialog.tsx`
- Step 1: Select course from dropdown
- Step 2: Select material from list within the course
- Step 3 (optional): Select section/heading anchor from material's table of contents
- "Link" button: sets `materialId` and `anchorId` on the memo form
- "Clear Link" button: removes the existing link

#### REQ-FE-767: Memo Editor Keyboard Shortcuts

The system shall support the following keyboard shortcuts in the Markdown textarea.

- `Ctrl+B` / `Cmd+B`: wrap selection with `**bold**`
- `Ctrl+I` / `Cmd+I`: wrap selection with `*italic*`
- `Ctrl+K` / `Cmd+K`: wrap selection with `[text](url)` link template
- `Ctrl+S` / `Cmd+S`: trigger save
- `Tab`: insert 2 spaces (prevent focus leaving textarea)

#### REQ-FE-768: Memo Delete

**When** the author triggers memo deletion, **then** the system shall display a confirmation dialog before deleting.

- Confirmation dialog: "Delete Memo?" with memo title, "Delete" (destructive) and "Cancel" buttons
- On confirm: DELETE `/api/memos/{memoId}`, redirect to `/memos` on success, invalidate memo list cache
- Toast on success: "Memo deleted."

---

### 3.8 Memo View Page (REQ-FE-770 through REQ-FE-772)

#### REQ-FE-770: Memo View Page

The system shall implement a read-only memo view page at `app/memos/[memoId]/page.tsx`.

- Renders memo title, author info (avatar + name + date), tags, linked material link, and full Markdown content
- Uses `MarkdownRenderer` from SPEC-FE-004 for content rendering
- "Edit" button: visible to memo author, links to `/memos/{memoId}/edit`
- "Back" breadcrumb: returns to `/memos` list

#### REQ-FE-771: Memo Linked Material Navigation

**When** a memo has a linked material, **then** the system shall display a contextual link to the source material.

- Link card at the top of the memo: "{materialTitle}" with optional "{anchorText}" subheading
- Clicking the link navigates to `/courses/{courseId}/materials/{materialId}#{anchorId}` (if anchor is set)
- Uses `Link` component from Next.js

#### REQ-FE-772: Memo Social Actions

The system shall display social/meta actions on the memo view page.

- Copy link button: copies `window.location.href` to clipboard, shows "Copied!" toast
- Tag chips: clicking a tag navigates to `/memos?tags={tag}` (filtered list)
- Visibility badge: "Personal" or "Team: {teamName}"

---

### 3.9 Zustand Store Extensions (REQ-FE-780 through REQ-FE-782)

#### REQ-FE-780: Team Store

The system shall provide a Zustand store for team-related client state.

- `apps/web/stores/team.store.ts`
- State: `currentTeamId: string | null`, `activeTab: TeamDetailTab`
- Actions: `setCurrentTeam`, `setActiveTab`
- `TeamDetailTab`: enum `'members' | 'materials' | 'memos' | 'activity'`

#### REQ-FE-781: Memo Editor Store

The system shall provide a Zustand store for memo editor state.

- `apps/web/stores/memo.store.ts`
- State: `editorMode: 'write' | 'preview' | 'split'`, `isDirty: boolean`, `lastSavedAt: Date | null`
- Actions: `setEditorMode`, `setDirty`, `setLastSaved`
- `isDirty` set to `true` on any content change; `false` after successful save

#### REQ-FE-782: Team WebSocket Store

The system shall extend the Zustand UI store to track team WebSocket connection status.

- Extension to `apps/web/stores/ui.store.ts`
- State: `teamSocketStatus: 'connected' | 'disconnected' | 'connecting' | 'error'`
- Action: `setTeamSocketStatus`

---

### 3.10 TanStack Query Hooks (REQ-FE-785 through REQ-FE-789)

#### REQ-FE-785: useTeams Hook

The system shall provide a `useTeams` hook for fetching paginated team lists.

- `apps/web/hooks/useTeams.ts`
- `useMyTeams()`: fetches `/api/teams?member=me`
- `useAvailableTeams(search?: string)`: fetches `/api/teams?available=true&search={query}`
- Returns: `{ data, isLoading, isError, refetch }`

#### REQ-FE-786: useTeam Hook

The system shall provide a `useTeam` hook for fetching a single team's details.

- `apps/web/hooks/useTeam.ts`
- `useTeamDetail(teamId: string)`: fetches `/api/teams/{teamId}`
- `useTeamMembers(teamId: string)`: fetches `/api/teams/{teamId}/members`
- `useTeamActivity(teamId: string, page: number)`: fetches `/api/teams/{teamId}/activity`

#### REQ-FE-787: useMemos Hook

The system shall provide a `useMemos` hook for fetching memo lists with filtering.

- `apps/web/hooks/useMemos.ts`
- `usePersonalMemos(filters: MemoFilterParams)`: fetches `/api/memos?visibility=PERSONAL&...filters`
- `useTeamMemos(teamId: string)`: fetches `/api/memos?teamId={teamId}`
- Uses `useInfiniteQuery` for pagination

#### REQ-FE-788: useMemo Hook

The system shall provide a `useMemo` hook for fetching and mutating a single memo.

- `apps/web/hooks/useMemo.ts`
- `useMemoDetail(memoId: string)`: fetches `/api/memos/{memoId}`
- `useCreateMemo()`: mutation for POST `/api/memos`
- `useUpdateMemo(memoId: string)`: mutation for PATCH `/api/memos/{memoId}`
- `useDeleteMemo()`: mutation for DELETE `/api/memos/{memoId}`

#### REQ-FE-789: useTeamMutations Hook

The system shall provide a `useTeamMutations` hook for team CRUD mutations.

- `apps/web/hooks/useTeamMutations.ts`
- `useCreateTeam()`: mutation for POST `/api/teams`
- `useUpdateTeam(teamId: string)`: mutation for PATCH `/api/teams/{teamId}`
- `useDeleteTeam(teamId: string)`: mutation for DELETE `/api/teams/{teamId}`

---

### 3.11 Unwanted Behavior Requirements

#### REQ-FE-N700: No Unguarded Team Memo Access

The system shall not allow access to team memo content without verifying that the current user is an active member of the team.

- **If** a non-member attempts to access a team's memos, **then** display a 403 error page.

#### REQ-FE-N701: No Data Loss on Navigation

**If** the user has unsaved changes in the memo editor and attempts to navigate away, **then** the system shall not navigate without displaying a confirmation prompt.

#### REQ-FE-N702: No Stale WebSocket State

**If** the WebSocket connection drops, **then** the system shall not display the "Live" indicator and must attempt reconnection.

#### REQ-FE-N703: No Unbounded Tag Inputs

The system shall not permit more than 10 tags on a single memo or team.

#### REQ-FE-N704: No Unformatted Markdown in Previews

List view previews (MemoCard, MemoListItem) shall strip Markdown syntax and display plain text only; they shall not render raw Markdown symbols to the user.

---

## 4. Specifications

### 4.1 File Structure (Team Feature)

```
apps/web/
  app/
    teams/
      page.tsx                           # Team list page (My Teams + Browse)
      new/
        page.tsx                         # Team creation form
      [teamId]/
        page.tsx                         # Team detail page
        layout.tsx                       # Team detail layout (with header)
  components/
    team/
      TeamCard.tsx                       # Team summary card component
      TeamDetailTabs.tsx                 # Tab navigation for team detail
      TeamMemoBoard.tsx                  # Team memo board (REQ-FE-740)
      LiveIndicator.tsx                  # WebSocket connection status badge
      MemberListItem.tsx                 # Single member row in Members tab
      InviteMemberModal.tsx              # Email-based member invitation modal
      ActivityFeedItem.tsx               # Single activity item in Activity tab
  hooks/
    useTeamSearch.ts                     # Team search with debounce (REQ-FE-714)
    useTeamMembership.ts                 # Team membership mutations (REQ-FE-727)
    useTeamMemoSocket.ts                 # WebSocket hook for team memos (REQ-FE-742)
    useTeams.ts                          # Team list queries (REQ-FE-785)
    useTeam.ts                           # Team detail queries (REQ-FE-786)
    useTeamMutations.ts                  # Team CRUD mutations (REQ-FE-789)
  stores/
    team.store.ts                        # Team client state (REQ-FE-780)
```

### 4.2 File Structure (Memo Feature)

```
apps/web/
  app/
    memos/
      page.tsx                           # Personal memo list (REQ-FE-750)
      new/
        page.tsx                         # Create new personal memo
      [memoId]/
        page.tsx                         # Memo view (read-only) (REQ-FE-770)
        edit/
          page.tsx                       # Memo editor (edit existing) (REQ-FE-760)
  components/
    memo/
      MemoCard.tsx                       # Memo card for team memo board (REQ-FE-741)
      MemoListItem.tsx                   # Memo item for personal list (REQ-FE-754)
      MemoEditor.tsx                     # Split-pane Markdown editor (REQ-FE-761)
      MaterialLinkDialog.tsx             # Material picker dialog (REQ-FE-766)
  hooks/
    useMemos.ts                          # Memo list queries (REQ-FE-787)
    useMemo.ts                           # Single memo queries + mutations (REQ-FE-788)
    useAutoSave.ts                       # LocalStorage auto-save hook (REQ-FE-763)
    useBeforeUnload.ts                   # Unsaved changes guard (REQ-FE-763)
  stores/
    memo.store.ts                        # Memo editor state (REQ-FE-781)
```

### 4.3 File Structure (Shared Package)

```
packages/shared/
  src/
    types/
      team.types.ts                      # Enriched Team types (REQ-FE-700)
      memo.types.ts                      # Enriched Memo types (REQ-FE-701)
    validators/
      team.schema.ts                     # CreateTeamSchema, UpdateTeamSchema (REQ-FE-700)
      memo.schema.ts                     # CreateMemoSchema, UpdateMemoSchema (REQ-FE-701)
    constants/
      events.ts                          # + TEAM_MEMO_* events (REQ-FE-704)
```

### 4.4 Component Hierarchy

```
TeamListPage (Server)
  └─ ClientTeamList (Client)
       ├─ TeamSearchInput
       ├─ MyTeamsSection
       │    └─ TeamCard (x N)
       └─ AvailableTeamsSection
            └─ TeamCard (x N)

TeamDetailPage (Server)
  └─ TeamDetailTabs (Client)
       ├─ MembersTab
       │    ├─ MemberListItem (x N)
       │    └─ InviteMemberModal
       ├─ SharedMaterialsTab
       ├─ TeamMemosTab
       │    └─ TeamMemoBoard
       │         ├─ LiveIndicator
       │         └─ MemoCard (x N, infinite)
       └─ ActivityTab
            └─ ActivityFeedItem (x N)

MemoListPage (Server)
  └─ MemoListClient (Client)
       ├─ MemoFilterSidebar / MemoFilterSheet
       └─ MemoListItem (x N, infinite)

MemoEditorPage (Client)
  └─ MemoEditor
       ├─ DraftRestoreBanner
       ├─ MemoEditorForm
       │    ├─ TitleInput
       │    ├─ TagInput
       │    ├─ MaterialLinkButton → MaterialLinkDialog
       │    └─ TeamToggle
       └─ EditorPreviewPane
            ├─ Textarea (write pane)
            └─ MarkdownRenderer (preview pane)
```

### 4.5 API Endpoint Mapping

| Action | Method | Endpoint | SPEC Requirement |
|--------|--------|----------|-----------------|
| List my teams | GET | `/api/teams?member=me` | REQ-FE-785 |
| Browse available teams | GET | `/api/teams?available=true&search={q}` | REQ-FE-712 |
| Create team | POST | `/api/teams` | REQ-FE-717 |
| Get team detail | GET | `/api/teams/{teamId}` | REQ-FE-786 |
| Update team | PATCH | `/api/teams/{teamId}` | REQ-FE-789 |
| Delete team | DELETE | `/api/teams/{teamId}` | REQ-FE-789 |
| Get members | GET | `/api/teams/{teamId}/members` | REQ-FE-722 |
| Invite member | POST | `/api/teams/{teamId}/members/invite` | REQ-FE-722 |
| Remove member | DELETE | `/api/teams/{teamId}/members/{userId}` | REQ-FE-722 |
| Change member role | PATCH | `/api/teams/{teamId}/members/{userId}` | REQ-FE-722 |
| Join team | POST | `/api/teams/{teamId}/join` | REQ-FE-712 |
| Leave team | DELETE | `/api/teams/{teamId}/leave` | REQ-FE-721 |
| Get team activity | GET | `/api/teams/{teamId}/activity?page={n}` | REQ-FE-725 |
| List personal memos | GET | `/api/memos?visibility=PERSONAL&...` | REQ-FE-787 |
| List team memos | GET | `/api/memos?teamId={teamId}` | REQ-FE-740 |
| Get memo detail | GET | `/api/memos/{memoId}` | REQ-FE-788 |
| Create memo | POST | `/api/memos` | REQ-FE-765 |
| Update memo | PATCH | `/api/memos/{memoId}` | REQ-FE-765 |
| Delete memo | DELETE | `/api/memos/{memoId}` | REQ-FE-768 |

### 4.6 WebSocket Event Flow

```
Client (useTeamMemoSocket)          Server (WebSocket Gateway)
        |                                    |
        |-- WS connect /ws/teams/{teamId} -->|
        |                                    |
        |<-- TEAM_MEMO_CREATED event --------|
        |   invalidate ['memos', {teamId}]   |
        |                                    |
        |<-- TEAM_MEMO_UPDATED event --------|
        |   invalidate ['memos', {teamId}]   |
        |                                    |
        |<-- TEAM_MEMBER_JOINED event --------|
        |   invalidate ['team', teamId]       |
        |                                    |
        |-- WS disconnect on unmount ------->|
```

### 4.7 Auto-Save State Machine

```
[User types]
      |
      v
[isDirty = true]
      |
      v (30s timer)
[Save to localStorage]
      |
      v
["Draft saved" toast appears → fades after 3s]
      |
      v
[User navigates away?]
      |
     Yes → [Confirm dialog: "Leave site?"]
      |
      No → [Continue editing]
```

### 4.8 Traceability Matrix

| Requirement | Design File Reference | SPEC-FE-001 Component Used |
|-------------|----------------------|---------------------------|
| REQ-FE-710 (Team List Page) | `design/screens/team/team-list.pen` | AppLayout, ContentLayout |
| REQ-FE-711 (My Teams Section) | `design/screens/team/team-list.pen` | Card, Skeleton, Badge |
| REQ-FE-712 (Browse Teams) | `design/screens/team/team-list.pen` | Card, Button, Input, Tooltip |
| REQ-FE-715 (Team Create Form) | `design/screens/team/team-create.pen` | Dialog, Form, Input, Textarea, Button |
| REQ-FE-720 (Team Detail Page) | `design/screens/team/team-detail.pen` | AppLayout, Tabs |
| REQ-FE-722 (Members Tab) | `design/screens/team/team-detail.pen` | Avatar, Badge, Button, Dialog |
| REQ-FE-724 (Team Memos Tab) | `design/screens/team/team-memo.pen` | Card, Button |
| REQ-FE-740 (TeamMemoBoard) | `design/screens/team/team-memo.pen` | Card, Button, Skeleton |
| REQ-FE-741 (MemoCard) | `design/screens/team/team-memo.pen` | Card, Avatar, Badge, DropdownMenu |
| REQ-FE-750 (Personal Memo List) | `design/screens/memo/memo-list.pen` | AppLayout, ContentLayout |
| REQ-FE-751 (Memo List Layout) | `design/screens/memo/memo-list.pen` | Sheet (mobile filter) |
| REQ-FE-754 (Memo List Item) | `design/screens/memo/memo-list.pen` | Card, Badge, Button |
| REQ-FE-760 (Memo Editor Routes) | `design/screens/memo/memo-editor.pen` | AppLayout, ContentLayout |
| REQ-FE-761 (MemoEditor Component) | `design/screens/memo/memo-editor.pen` | Button, Textarea |
| REQ-FE-766 (MaterialLinkDialog) | `design/screens/memo/memo-editor.pen` | Dialog, Select, Button |
| REQ-FE-770 (Memo View Page) | `design/screens/memo/memo-editor.pen` | Card, Badge, Button, Avatar |

---

## 5. Dependency Map

```
SPEC-FE-008 (Team & Memo System)
  ├── SPEC-FE-001 (Foundation) [REQUIRED]
  │     design tokens, layout, shadcn/ui, providers, API client, stores
  ├── SPEC-FE-002 (Auth) [REQUIRED]
  │     useAuth hook, session context, UserRole, access guards
  ├── SPEC-FE-004 (Markdown Rendering) [REQUIRED]
  │     MarkdownRenderer component, rehype/remark pipeline
  └── SPEC-FE-005 (Course Feature) [SOFT DEPENDENCY]
        Course types and API hooks for course association in teams/memos
        (Gracefully degraded if FE-005 types are not yet available)
```
