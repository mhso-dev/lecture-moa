---
id: SPEC-FE-008
title: "Team and Memo System — Acceptance Criteria"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-008: Team and Memo System — Acceptance Criteria

> TAG: SPEC-FE-008

## History

| Version | Date | Description |
|---------|------|-------------|
| 2.0.0 | 2026-02-19 | Complete rewrite aligned with spec.md v2.0.0. Fixed 12 critical discrepancies: (1) All route paths corrected to `(dashboard)` group. (2) All API endpoints corrected to `/api/v1/` prefix. (3) WebSocket event value corrected from `"TEAM_MEMO_CREATED"` to `"team_memo:created"` namespace:action format. (4) Role references corrected from TEAM_LEAD to `"leader"`. (5) Editor acceptance criteria updated to reference EditorWithPreview [EXISTING] and MemoEditorWrapper [NEW]. (6) useBeforeUnload referenced as [EXISTING] hook. (7) All API endpoint paths include trailing slash. (8) Added EXISTING/NEW markers throughout. |
| 1.0.0 | 2026-02-19 | Initial draft |

---

## Quality Gate Criteria

| Gate | Threshold | Tool |
|------|-----------|------|
| Test Coverage | 85%+ on new files | Vitest --coverage |
| TypeScript | Zero type errors | tsc --noEmit |
| Lint | Zero ESLint errors | eslint (flat config) |
| Accessibility | WCAG 2.1 AA | axe-core / manual audit |
| Bundle Size | No unintentional size regression | next build analysis |

---

## 1. Shared Type Definitions (REQ-FE-700 through REQ-FE-704)

### AC-FE-700: Team Type Definitions [NEW]

**Given** `packages/shared/src/types/team.types.ts` is created with types extending `dashboard.types.ts` [EXISTING],
**When** a TypeScript consumer imports `Team`, `TeamMemberDetail`, `TeamActivity` from `@shared/types/team.types`,
**Then** all types resolve correctly and compile without errors in both `apps/web` and `apps/api`,
**And** `Team` extends `TeamOverview` [EXISTING from dashboard.types.ts],
**And** `TeamMemberDetail` extends `TeamMember` [EXISTING from dashboard.types.ts],
**And** `TeamActivity` extends `TeamActivityItem` [EXISTING from dashboard.types.ts],
**And** `TeamMemberRole` is re-exported as `"leader" | "member"` string union (not enum).

**Given** the `CreateTeamSchema` Zod schema is defined in `packages/shared/src/validators/team.schema.ts` [NEW],
**When** a valid team creation payload `{ name: "Study Group A", maxMembers: 10 }` is parsed,
**Then** the parsed result matches the expected shape with no validation errors.

**Given** an invalid payload `{ name: "", maxMembers: 1 }` is parsed with `CreateTeamSchema`,
**When** `safeParse` is called,
**Then** the result has `success: false` with errors on both `name` (min length 2) and `maxMembers` (min 2) fields.

### AC-FE-701: Memo Type Definitions [NEW]

**Given** `packages/shared/src/types/memo.types.ts` is created,
**When** a consumer imports `Memo` with `teamId: null` (personal memo),
**Then** TypeScript accepts this as a valid `Memo` (nullable field) without type assertion.

**Given** `CreateMemoSchema` is validated with a payload containing 11 tags,
**When** `safeParse` is called,
**Then** the result has `success: false` with an error on the `tags` field (max 10).

### AC-FE-704: WebSocket Event Constants [NEW extension of EXISTING]

**Given** `packages/shared/src/constants/events.ts` [EXISTING] is extended with team and memo events,
**When** `EVENTS.TEAM_MEMO_CREATED` is imported in `apps/web/hooks/team/useTeamMemoSocket.ts`,
**Then** it equals the string `"team_memo:created"` (namespace:action format),
**And** TypeScript infers it as a `const` string literal.

**Given** `EVENT_CATEGORIES` is extended,
**When** `TEAM` and `MEMO` categories are accessed,
**Then** `EVENT_CATEGORIES.TEAM` equals `"team"` and `EVENT_CATEGORIES.MEMO` equals `"memo"`.

---

## 2. Team List Page (REQ-FE-710 through REQ-FE-714)

### AC-FE-710: Team List Page Renders [NEW]

**Given** a logged-in user navigates to `/teams` (resolved to `app/(dashboard)/teams/page.tsx`),
**When** the page renders,
**Then** two sections are visible: "My Teams" and "Browse Teams",
**And** the page title is "Teams",
**And** a "Create Team" button is present.

### AC-FE-711: My Teams Section — Populated [NEW]

**Given** the user is a member of 2 teams,
**When** the My Teams section renders,
**Then** exactly 2 team cards are displayed,
**And** each card shows the team name, description (truncated to fit), member count, and a role badge (`"leader"` or `"member"`).

### AC-FE-711: My Teams Section — Empty State [NEW]

**Given** the user has not joined any teams,
**When** the My Teams section renders,
**Then** the text "You haven't joined any teams yet. Browse available teams below." is displayed,
**And** no team cards are rendered.

### AC-FE-712: Browse Teams — Search Filters [NEW]

**Given** the Browse Teams section is visible with 5 available teams,
**When** the user types "math" in the search input,
**Then** after a 300ms debounce (using `useDebounce` [EXISTING]), only teams with "math" in the name or description are shown,
**And** teams not matching are hidden.

### AC-FE-712: Browse Teams — Full Team [NEW]

**Given** a team with `currentMemberCount === maxMembers`,
**When** its card is rendered in the Browse Teams section,
**Then** the "Join" button is disabled,
**And** a tooltip with text "Team is full" is shown on hover.

### AC-FE-712: Browse Teams — Already Member [NEW]

**Given** the current user is already a member of a team listed in Browse Teams,
**When** its card is rendered,
**Then** the button shows "View" instead of "Join".

### AC-FE-713: TeamCard Component [NEW]

**Given** `TeamCard` is rendered with a team that has 3 members,
**When** the component renders,
**Then** up to 3 member avatar images are shown in a stacked group,
**And** the member count chip shows "3 / {maxMembers}".

---

## 3. Team Creation Form (REQ-FE-715 through REQ-FE-718)

### AC-FE-715: Team Creation Route Access [NEW]

**Given** an unauthenticated user navigates to `/teams/new` (resolved to `app/(dashboard)/teams/new/page.tsx`),
**When** the page loads,
**Then** the user is redirected to `/login?next=/teams/new`.

### AC-FE-716: Team Creation Form Validation — Name Empty [NEW]

**Given** the user submits the team creation form with an empty `name` field,
**When** form validation runs (React Hook Form + `CreateTeamSchema` [NEW]),
**Then** an inline error message "Name is required" appears below the name input,
**And** the form is not submitted to the API.

### AC-FE-716: Team Creation Form Validation — Name Too Short [NEW]

**Given** the user enters a single character in the name field,
**When** the user submits,
**Then** an error "Name must be at least 2 characters" is shown.

### AC-FE-717: Successful Team Creation [NEW]

**Given** the user fills in a valid team name "Frontend Study" and sets max members to 5,
**When** the user clicks "Create Team",
**Then** a POST request is sent to `/api/v1/teams/` with the correct payload,
**And** the user is redirected to `/teams/{newTeamId}`,
**And** the `['teams']` query cache is invalidated.

### AC-FE-717: Team Creation API Error [NEW]

**Given** the API returns a 500 error on team creation,
**When** the form is submitted to `/api/v1/teams/`,
**Then** a toast notification appears with "Failed to create team. Please try again.",
**And** the user remains on the creation form.

---

## 4. Team Detail Page (REQ-FE-720 through REQ-FE-727)

### AC-FE-720: Team Detail Page Renders [NEW]

**Given** a team member navigates to `/teams/{teamId}` (resolved to `app/(dashboard)/teams/[teamId]/page.tsx`),
**When** the page renders,
**Then** the team name and description are displayed in the header,
**And** the member count chip shows the current and maximum members,
**And** four tabs are visible: Members, Shared Materials, Team Memos, Activity.

### AC-FE-721: Team Leader Actions Visible [NEW]

**Given** the current user's team role is `"leader"`,
**When** the team detail header renders,
**Then** a settings icon button is visible,
**And** no "Leave Team" button is shown in the main header.

### AC-FE-721: Team Member Actions Visible [NEW]

**Given** the current user's team role is `"member"`,
**When** the team detail header renders,
**Then** a "Leave Team" button with confirmation dialog is visible,
**And** no settings icon button is shown.

### AC-FE-721: Non-Member Sees Join Button [NEW]

**Given** the current user is not a member of the team and the team is not full,
**When** the team detail header renders,
**Then** a "Join Team" button is visible.

### AC-FE-722: Members Tab — Remove Member (Leader Only) [NEW]

**Given** the current user's team role is `"leader"` and the Members tab is active,
**When** the user clicks the three-dot menu on a member row and selects "Remove Member",
**Then** a confirmation dialog appears: "Remove {memberName} from the team?",
**And** clicking "Remove" sends a DELETE request to `/api/v1/teams/{teamId}/members/{userId}`,
**And** the member list is refreshed after success (invalidates `['team', teamId, 'members']`).

### AC-FE-722: Member Invite Modal [NEW]

**Given** the current user's team role is `"leader"` and clicks "Invite Member",
**When** the invite modal opens,
**Then** an email input with "Send Invite" button is displayed,
**And** entering an invalid email shows an inline validation error,
**And** submitting a valid email sends a POST to `/api/v1/teams/{teamId}/members/invite`.

### AC-FE-725: Activity Tab — Feed Items [NEW]

**Given** the team has 5 recent activities,
**When** the Activity tab is selected,
**Then** 5 activity items are displayed with relative timestamps,
**And** each item shows the actor's avatar, actor name, and a description of the action,
**And** activity types follow existing `TeamActivityItemType` [EXISTING]: `"memo_created" | "memo_updated" | "member_joined" | "qa_asked"`.

### AC-FE-726: Tab Navigation — URL Hash Sync [NEW]

**Given** the user navigates to `/teams/{teamId}#memos`,
**When** the page loads,
**Then** the "Team Memos" tab is active by default.

### AC-FE-726: Tab Navigation — Hash Updates on Click [NEW]

**Given** the user is on the Members tab,
**When** the user clicks the "Activity" tab,
**Then** the URL hash changes to `#activity` without a full page navigation.

---

## 5. Team Memo Board (REQ-FE-740 through REQ-FE-745)

### AC-FE-740: Team Memo Board Renders in Tab [NEW]

**Given** the Team Memos tab is selected on the team detail page,
**When** the `TeamMemoBoard` [NEW] component renders,
**Then** a list of team memos is displayed (fetched via GET `/api/v1/memos/?teamId={teamId}`),
**And** a "New Team Memo" button is visible.

### AC-FE-741: Memo Card — Plain Text Preview [NEW]

**Given** a memo with content `**Bold text** and *italic*`,
**When** the `MemoCard` [NEW] renders the content preview,
**Then** the preview shows "Bold text and italic" with no Markdown symbols,
**And** the preview is truncated at 150 characters.

### AC-FE-741: Memo Card — Author Only Edit [NEW]

**Given** a memo authored by User A is displayed in the team board,
**When** User B (a different team member) opens the three-dot menu on the card,
**Then** the "Edit" action is not present for User B,
**And** "Delete" is shown only if User B's team role is `"leader"`.

### AC-FE-742: WebSocket — Live Indicator Appears [NEW]

**Given** the `useTeamMemoSocket` [NEW] hook connects successfully to the WebSocket server,
**When** the Team Memos tab renders,
**Then** a green "Live" badge is displayed next to the section heading (via `LiveIndicator` [NEW]).

### AC-FE-742: WebSocket — Disconnected State [NEW]

**Given** the WebSocket connection fails or is lost,
**When** `teamSocketStatus` in `ui.store.ts` [EXISTING - EXTENDED] is set to `'error'` or `'disconnected'`,
**Then** the "Live" badge is replaced with a "Reconnecting..." indicator.

### AC-FE-742: WebSocket — Cache Invalidation on Event [NEW]

**Given** the team memo board is open and a `"team_memo:created"` event is received via WebSocket,
**When** the event handler fires in `useTeamMemoSocket` [NEW],
**Then** the `['memos', { teamId }]` TanStack Query cache is invalidated,
**And** the board automatically refetches and displays the new memo.

### AC-FE-744: Infinite Scroll — Next Page Load [NEW]

**Given** the team has more than 20 memos,
**When** the user scrolls to the bottom of the memo board,
**Then** the next page of 20 memos is fetched automatically via `useInfiniteQuery`,
**And** a loading skeleton is shown during the fetch.

### AC-FE-745: Team Memo Board Empty State [NEW]

**Given** the team has no memos,
**When** `TeamMemoBoard` [NEW] renders,
**Then** the text "No team memos yet" is displayed,
**And** a "Create First Memo" button is visible and navigates to the memo creation form.

---

## 6. Personal Memo List (REQ-FE-750 through REQ-FE-754)

### AC-FE-750: Memo List Page Renders [NEW]

**Given** an authenticated user navigates to `/memos` (resolved to `app/(dashboard)/memos/page.tsx`),
**When** the page renders,
**Then** the user's personal memos are displayed,
**And** a filter sidebar (Desktop) or filter icon button (Mobile) is present.

### AC-FE-751: Responsive Layout — Desktop [NEW]

**Given** the viewport width is 1280px,
**When** the memo list page renders,
**Then** the `MemoFilterSidebar` [NEW] is visible on the left side (desktop layout),
**And** the memo list is visible on the right.

### AC-FE-751: Responsive Layout — Mobile Filter Sheet [NEW]

**Given** the viewport width is 375px (detected via `useMediaQuery` [EXISTING]),
**When** the user taps the filter icon button,
**Then** the `MemoFilterSheet` [NEW] (bottom sheet) slides up containing all filter controls.

### AC-FE-752: Search Filter [NEW]

**Given** the user has 10 memos with varied titles,
**When** the user types "react" in the search input,
**Then** after 300ms debounce (via `useDebounce` [EXISTING]), only memos with "react" in the title or content are shown.

### AC-FE-752: Tag Filter [NEW]

**Given** the user applies a tag filter "javascript",
**When** the memo list updates,
**Then** only memos tagged with "javascript" are shown,
**And** the "javascript" tag appears as a dismissible chip in the active filters area.

### AC-FE-752: Clear All Filters [NEW]

**Given** the user has 3 active filters applied,
**When** the user clicks "Clear all",
**Then** all filters are reset,
**And** the full memo list is restored.

### AC-FE-752: Filter State in URL [NEW]

**Given** the user applies a tag filter "typescript" and a search "hooks",
**When** the URL is inspected,
**Then** the search params include `?tags=typescript&search=hooks`,
**And** navigating to that URL directly restores the filter state.

### AC-FE-753: Empty State — No Memos [NEW]

**Given** the user has no memos at all,
**When** the memo list renders,
**Then** the text "You haven't created any memos yet." is displayed,
**And** a "Create your first memo" button is present and links to `/memos/new`.

### AC-FE-754: Memo List Item — Plain Text Preview [NEW]

**Given** a memo with content `# Heading\n\nSome **bold** content`,
**When** the `MemoListItem` [NEW] renders,
**Then** the preview shows "Heading Some bold content" (stripped),
**And** the preview is truncated at 100 characters.

### AC-FE-754: Memo List Item — Quick Delete [NEW]

**Given** the user hovers over a memo list item,
**When** the delete button becomes visible and is clicked,
**Then** a confirmation dialog appears before any deletion occurs,
**And** confirming sends DELETE `/api/v1/memos/{memoId}`.

---

## 7. Memo Editor (REQ-FE-760 through REQ-FE-768)

### AC-FE-761: Editor Split Mode (via EditorWithPreview [EXISTING]) [NEW wrapper]

**Given** the user opens the memo editor and selects "Split" mode,
**When** `MemoEditorWrapper` [NEW] renders wrapping `EditorWithPreview` [EXISTING],
**Then** a write pane is visible on the left half of the editor,
**And** a live Markdown preview (via `MarkdownRenderer` [EXISTING]) is visible on the right half.

### AC-FE-761: Editor Write Mode [NEW wrapper]

**Given** the user selects "Write" mode,
**When** the editor renders via `EditorWithPreview` [EXISTING],
**Then** only the editor is visible (full width),
**And** no preview is shown.

### AC-FE-761: Editor Preview Mode [NEW wrapper]

**Given** the user selects "Preview" mode,
**When** the editor renders via `EditorWithPreview` [EXISTING],
**Then** only the Markdown preview pane is visible (read-only via `MarkdownRenderer` [EXISTING]),
**And** the editor is hidden.

### AC-FE-762: Tag Chip Input — Add Tag [NEW]

**Given** the user types "react" and presses Enter in the tag input,
**When** the tag is added,
**Then** a dismissible "react" chip appears below the input,
**And** the input is cleared.

### AC-FE-762: Tag Chip Input — Max Tags [NEW]

**Given** the user has 10 tags already entered,
**When** the user attempts to type an 11th tag and press Enter,
**Then** the tag is not added,
**And** an inline message "Maximum 10 tags allowed" is displayed.

### AC-FE-762: Form Validation — Title Required [NEW]

**Given** the user submits the memo form without a title,
**When** validation runs (React Hook Form + `CreateMemoSchema` [NEW]),
**Then** an error "Title is required" appears below the title input,
**And** the form is not submitted.

### AC-FE-763: Auto-Save — Draft Written [NEW]

**Given** the user has typed content in the memo editor and 30 seconds have passed,
**When** the `useAutoSaveDraft` [NEW] hook fires (using `useDebounce` [EXISTING]),
**Then** the content is saved to localStorage under `memo-draft-${userId}-${memoId}`,
**And** a "Draft saved" label appears below the editor and fades after 3 seconds.

### AC-FE-763: Unsaved Changes Guard [EXISTING hook usage]

**Given** the user has made changes to the memo (`isDirty = true` in `memo.store.ts` [NEW]) and clicks a browser navigation action,
**When** the `useBeforeUnload` [EXISTING] hook fires,
**Then** the browser displays its native "Leave site?" confirmation dialog.

### AC-FE-764: Draft Restore Banner [NEW]

**Given** a draft exists in localStorage for the current memo context,
**When** the user opens the memo editor,
**Then** the `DraftRestoreBanner` [NEW] is displayed: "You have an unsaved draft.",
**And** "Restore Draft" and "Discard" buttons are present.

**Given** the user clicks "Restore Draft",
**When** the editor loads,
**Then** the editor content is populated from the localStorage draft.

**Given** the user clicks "Discard",
**When** the action completes,
**Then** the localStorage draft is cleared,
**And** the banner disappears.

### AC-FE-765: Successful Memo Save (New) [NEW]

**Given** the user fills in a valid title and content and clicks "Save",
**When** the mutation completes successfully,
**Then** a POST request was sent to `/api/v1/memos/` with the correct payload,
**And** the user is redirected to `/memos/{newMemoId}`,
**And** the localStorage draft is cleared.

### AC-FE-765: Successful Memo Save (Edit) [NEW]

**Given** the user edits an existing memo and clicks "Save",
**When** the mutation completes successfully,
**Then** a PATCH request was sent to `/api/v1/memos/{memoId}` with the changed fields,
**And** the user stays on the editor page with a success toast,
**And** the `['memo', memoId]` query cache is invalidated.

### AC-FE-765: Keyboard Save Shortcut [EXISTING functionality]

**Given** the memo editor is focused,
**When** the user presses `Ctrl+S` (Windows/Linux) or `Cmd+S` (macOS),
**Then** the save action is triggered (Ctrl+S already provided by `MarkdownEditor` [EXISTING], wired to memo save mutation).

### AC-FE-766: Material Link Dialog — Selection Flow [NEW]

**Given** the user clicks "Link Material" in the memo editor,
**When** the `MaterialLinkDialog` [NEW] opens,
**Then** a course dropdown is shown as Step 1,
**And** selecting a course populates a material list as Step 2,
**And** clicking "Link" sets the `materialId` on the form and shows the link as "{materialTitle}".

### AC-FE-767: Bold Keyboard Shortcut [EXISTING functionality]

**Given** the user selects the text "important" in the editor,
**When** the user presses `Ctrl+B` (or `Cmd+B`),
**Then** the selected text is wrapped: `**important**` (handled by `MarkdownEditor` [EXISTING]).

### AC-FE-768: Memo Delete Confirmation [NEW]

**Given** the user clicks "Delete" on a memo from the view page,
**When** the confirmation dialog appears with the memo title,
**Then** clicking "Delete" sends DELETE `/api/v1/memos/{memoId}`,
**And** the user is redirected to `/memos` on success,
**And** a "Memo deleted." toast is shown.

**Given** the user clicks "Cancel" on the delete confirmation,
**When** the dialog is dismissed,
**Then** the memo is not deleted and the user remains on the view page.

---

## 8. Memo View Page (REQ-FE-770 through REQ-FE-772)

### AC-FE-770: Memo View Page — Author Edit Button [NEW]

**Given** the current user is the author of the memo and is on the view page at `/memos/{memoId}` (resolved to `app/(dashboard)/memos/[memoId]/page.tsx`),
**When** the page renders,
**Then** an "Edit" button is visible linking to `/memos/{memoId}/edit`.

**Given** the current user is not the author of the memo,
**When** the page renders,
**Then** no "Edit" button is visible.

### AC-FE-770: Memo View Page — Markdown Rendered [EXISTING renderer]

**Given** a memo with Markdown content `## Section\n\n- item 1\n- item 2`,
**When** the view page renders using `MarkdownRenderer` [EXISTING],
**Then** the content is rendered as HTML (an `<h2>` heading and an unordered list),
**And** no raw Markdown syntax is visible.

### AC-FE-771: Linked Material Navigation [NEW]

**Given** a memo has a linked material and the view page renders,
**When** the user sees the link card at the top,
**Then** clicking the card navigates to `/courses/{courseId}/materials/{materialId}` (with `#{anchorId}` if set).

### AC-FE-772: Copy Link [NEW]

**Given** the user is on the memo view page and clicks "Copy link",
**When** the action completes,
**Then** the current page URL is copied to the clipboard,
**And** a toast "Copied!" is shown for 3 seconds.

### AC-FE-772: Tag Navigation [NEW]

**Given** the memo has a tag "typescript",
**When** the user clicks the "typescript" chip on the view page,
**Then** the user is navigated to `/memos?tags=typescript` (filtered personal memo list).

---

## 9. Unwanted Behavior Verification (REQ-FE-N700 through REQ-FE-N704)

### AC-FE-N700: Non-Member Team Memo Access Blocked

**Given** a user who is not a team member attempts to access `/teams/{teamId}` (resolved to `app/(dashboard)/teams/[teamId]/page.tsx`),
**When** the server-side session and membership check runs,
**Then** the server returns a 403 error page or redirects to the team list.

### AC-FE-N701: Unsaved Changes Confirmed Before Navigation

**Given** the user has `isDirty = true` in `memo.store.ts` [NEW],
**When** the user attempts any navigation away from the editor,
**Then** the `useBeforeUnload` [EXISTING] hook triggers the browser's native "Leave site?" dialog before navigation proceeds.

### AC-FE-N702: No Live Indicator on Disconnected WebSocket

**Given** the WebSocket connection has failed (`teamSocketStatus` in `ui.store.ts` [EXISTING - EXTENDED] is `'error'` or `'disconnected'`),
**When** the Team Memos tab renders,
**Then** the `LiveIndicator` [NEW] does not show the green "Live" indicator,
**And** the "Reconnecting..." indicator is shown instead.

### AC-FE-N703: Tag Count Enforcement

**Given** the memo tag input already has 10 tags,
**When** the user types and presses Enter for an 11th tag,
**Then** the 11th tag is not added to the form state,
**And** `CreateMemoSchema.safeParse` [NEW] returns an error for the `tags` field.

### AC-FE-N704: No Raw Markdown in List Previews

**Given** a memo with content `**Bold** and _italic_ with [link](http://example.com)`,
**When** rendered in `MemoCard` [NEW] or `MemoListItem` [NEW] preview,
**Then** the preview text is "Bold and italic with link" -- no `**`, `_`, `[]`, or `()` symbols visible.

---

## 10. Accessibility Checks

### AC-FE-A01: Team List — Keyboard Navigation

**Given** the team list page is loaded at `/teams` (resolved to `app/(dashboard)/teams/page.tsx`),
**When** the user tabs through the page,
**Then** all interactive elements (search input, team cards, join buttons) are reachable via keyboard in a logical order.

### AC-FE-A02: Memo Editor — Textarea Accessibility

**Given** the memo editor is rendered via `MemoEditorWrapper` [NEW] wrapping `EditorWithPreview` [EXISTING],
**When** inspected with axe-core,
**Then** the editor has proper ARIA labeling,
**And** no WCAG 2.1 AA violations are reported.

### AC-FE-A03: LiveIndicator — Screen Reader Announcement

**Given** the WebSocket status changes from connected to disconnected,
**When** the `LiveIndicator` [NEW] status changes,
**Then** an `aria-live="polite"` region announces the status change to screen readers.

### AC-FE-A04: Confirmation Dialogs — Focus Management

**Given** a confirmation dialog opens (e.g., delete memo, leave team, remove member),
**When** the dialog appears,
**Then** focus is moved to the first focusable element within the dialog,
**And** when the dialog is dismissed, focus returns to the trigger element.

---

## 11. Responsive Acceptance Tests

### AC-FE-R01: Team List — Mobile (375px)

**Given** the viewport width is 375px,
**When** the team list page renders at `app/(dashboard)/teams/page.tsx`,
**Then** both sections (My Teams, Browse Teams) stack vertically without horizontal overflow,
**And** team cards span the full content width.

### AC-FE-R02: Memo Editor — Tablet (768px)

**Given** the viewport width is 768px,
**When** `MemoEditorWrapper` [NEW] renders in Split mode (via `EditorWithPreview` [EXISTING]),
**Then** the write pane and preview pane are displayed side by side without overflow.

### AC-FE-R03: Team Detail — Desktop (1280px)

**Given** the viewport width is 1280px,
**When** the team detail page renders at `app/(dashboard)/teams/[teamId]/page.tsx`,
**Then** the content area is within the max-w-7xl container,
**And** all four tabs (Members, Shared Materials, Team Memos, Activity) are visible in a single row without wrapping.

### AC-FE-R04: Memo List — Mobile Filter (375px)

**Given** the viewport width is 375px (detected via `useMediaQuery` [EXISTING]),
**When** the memo list page renders at `app/(dashboard)/memos/page.tsx`,
**Then** the `MemoFilterSidebar` [NEW] is hidden,
**And** a filter icon button is shown that opens `MemoFilterSheet` [NEW] as a bottom sheet.
