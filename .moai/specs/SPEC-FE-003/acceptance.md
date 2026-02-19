---
id: SPEC-FE-003
title: "Dashboard Views - Acceptance Criteria"
spec_ref: SPEC-FE-003
---

# SPEC-FE-003: Dashboard Views — Acceptance Criteria

## Quality Gates

- All Vitest tests pass with 0 failures
- TypeScript: zero type errors (`tsc --noEmit`)
- ESLint: zero lint errors
- No layout shift (CLS) during skeleton → content transition
- WCAG 2.1 AA: axe-core reports 0 violations on all three dashboard pages

---

## AC-FE-200: Dashboard Root Redirect

**Given** an authenticated user with role `INSTRUCTOR` visits `/dashboard`
**When** the Server Component evaluates the session
**Then** the browser is redirected to `/dashboard/instructor` without rendering any dashboard UI

---

**Given** an authenticated user with role `STUDENT` visits `/dashboard`
**When** the Server Component evaluates the session
**Then** the browser is redirected to `/dashboard/student`

---

**Given** an unauthenticated user visits `/dashboard`
**When** the Server Component evaluates the session
**Then** the browser is redirected to `/login`

---

## AC-FE-201: Route Protection

**Given** an authenticated `STUDENT` user navigates directly to `/dashboard/instructor`
**When** the instructor page Server Component evaluates the role
**Then** the browser is redirected to `/dashboard/student` without rendering the instructor dashboard

---

**Given** an authenticated `INSTRUCTOR` user navigates directly to `/dashboard/student`
**When** the student page Server Component evaluates the role
**Then** the browser is redirected to `/dashboard/instructor`

---

## AC-FE-203: Dashboard Loading States

**Given** the student dashboard is loading data (API calls in flight)
**When** the page first renders
**Then** skeleton placeholders are displayed in the same grid positions as the final widgets
**And** no real content is shown until data resolves
**And** there is no significant layout shift when skeleton transitions to content

---

## AC-FE-210: Student Dashboard Page

**Given** an authenticated `STUDENT` visits `/dashboard/student`
**When** all data queries resolve
**Then** six widgets are visible: Enrolled Courses, Recent Q&A, Quiz Scores, Study Progress, Upcoming Quizzes, Q&A Notifications
**And** on desktop the widgets are arranged in a 3-column grid
**And** on mobile the widgets are stacked in a single column

---

## AC-FE-211: Enrolled Courses Widget

**Given** the student is enrolled in three courses with varying progress
**When** the Enrolled Courses widget renders
**Then** each course displays: course name, instructor name, progress percentage, last accessed date
**And** the widget shows a maximum of 5 courses
**And** a "View all courses" link to `/courses` is present

---

**Given** the student is not enrolled in any courses
**When** the Enrolled Courses widget renders
**Then** the empty state message "You haven't enrolled in any courses yet." is displayed
**And** a CTA button linking to `/courses` is rendered

---

## AC-FE-212: Recent Q&A Widget

**Given** the student has submitted Q&A items (mix of answered and pending)
**When** the Recent Q&A widget renders
**Then** each item shows: question excerpt (max 80 chars), course name, status badge, timestamp
**And** answered items show a green badge labeled "Answered"
**And** pending items show an amber badge labeled "Pending"

---

**Given** the student has no Q&A history
**When** the Recent Q&A widget renders
**Then** the empty state "No Q&A activity yet." is displayed

---

## AC-FE-213: Quiz Scores Widget

**Given** the student has taken quizzes with scores of 90%, 65%, and 45%
**When** the Quiz Scores widget renders
**Then** the 90% score shows a green badge
**And** the 65% score shows an amber badge
**And** the 45% score shows a red badge
**And** each row also shows the score as text (e.g., "9 / 10") alongside the color indicator

---

**Given** the student has no quiz history
**When** the Quiz Scores widget renders
**Then** the empty state "No quiz results yet." is displayed

---

## AC-FE-214: Study Progress Widget

**Given** the student has a 7-day study streak and 23 total sessions
**When** the Study Progress widget renders
**Then** current streak "7 days" is displayed
**And** total sessions "23" is displayed
**And** visual progress indicators (bars or rings) are rendered

---

**Given** the student has no study activity
**When** the Study Progress widget renders
**Then** the empty state "Start studying to build your streak!" is displayed

---

## AC-FE-215: Upcoming Quizzes Widget

**Given** the student has 3 pending quizzes
**When** the Upcoming Quizzes widget renders
**Then** each pending quiz shows: quiz title, course name, question count
**And** quizzes with a due date display the due date

---

**Given** the student has no pending quizzes
**When** the Upcoming Quizzes widget renders
**Then** the empty state "No upcoming quizzes." is displayed

---

## AC-FE-216: Q&A Notifications Widget

**Given** the student has 2 unread and 1 read notification
**When** the Q&A Notifications widget renders
**Then** the 2 unread notifications have a blue left border
**And** a "Mark all as read" button is present and clickable
**When** the user clicks "Mark all as read"
**Then** all notifications lose the blue border (visual read state)

---

**Given** the student has no notifications
**When** the Q&A Notifications widget renders
**Then** the empty state "No new notifications." is displayed

---

## AC-FE-217: Student Dashboard API Hooks

**Given** the student dashboard page mounts
**When** hooks are initialized
**Then** each hook fires a query with the correct namespaced key (`['dashboard', 'student', ...]`)
**And** staleTime is 2 minutes for metrics hooks
**And** staleTime is 30 seconds for `useQANotifications()`

---

## AC-FE-220: Instructor Dashboard Page

**Given** an authenticated `INSTRUCTOR` visits `/dashboard/instructor`
**When** all data queries resolve
**Then** six widgets are visible: My Courses, Student Activity, Pending Q&A, Quiz Performance, Activity Feed, Quick Actions
**And** on desktop the widgets are arranged in a 3-column grid

---

## AC-FE-221: My Courses Widget

**Given** the instructor has 2 published and 1 draft course
**When** the My Courses widget renders
**Then** each course shows: name, enrolled count, materials count, pending Q&A count, published/draft badge
**And** a "Create new course" button is present linking to `/courses/new`

---

**Given** the instructor has no courses
**When** the My Courses widget renders
**Then** the empty state "You haven't created any courses yet." is displayed
**And** a "Create Course" CTA button is visible

---

## AC-FE-222: Student Enrollment & Activity Widget

**Given** the instructor has courses with student activity data
**When** the Student Activity widget renders
**Then** the widget shows: total enrolled students, active students (last 7 days), average completion rate, study sessions this week
**And** each metric is presented as a number with a descriptive label

---

## AC-FE-223: Pending Q&A Widget

**Given** a Q&A question has been unanswered for more than 48 hours
**When** the Pending Q&A widget renders
**Then** that question displays an "Urgent" badge
**And** questions are ordered oldest-first

---

**Given** there are no pending Q&A questions
**When** the Pending Q&A widget renders
**Then** the empty state "No pending questions." with a green checkmark icon is displayed

---

## AC-FE-224: Quiz Performance Widget

**Given** the instructor's courses have quiz submission data
**When** the Quiz Performance widget renders
**Then** each quiz shows: title, course name, average score, submission count, pass rate

---

## AC-FE-225: Activity Feed Widget

**Given** there are 15 recent student activities
**When** the Activity Feed widget renders
**Then** 10 items are visible initially
**And** a "Load more" button is present
**When** the user clicks "Load more"
**Then** additional items are appended to the feed

---

## AC-FE-226: Quick Actions Widget

**Given** the instructor visits the instructor dashboard
**When** the Quick Actions widget renders
**Then** four action buttons are visible: "Upload Material", "Create Quiz", "View All Q&A", "Manage Courses"
**And** each button has an icon and a descriptive label
**And** each button links to its respective route

---

## AC-FE-230: Team Dashboard Page

**Given** an authenticated `STUDENT` who is a team member visits `/dashboard/team`
**When** all data queries resolve
**Then** four widgets are visible: Team Overview, Team Members, Shared Memos Feed, Team Activity Timeline
**And** on desktop the widgets are arranged in a 2-column grid

---

**Given** an authenticated `STUDENT` who is not a team member visits `/dashboard/team`
**When** the Team Overview widget renders
**Then** the "no team" empty state is displayed: "You are not a member of any team."
**And** a "Browse Teams" CTA is visible

---

## AC-FE-231: Team Overview Widget

**Given** the student belongs to team "Alpha" in course "Introduction to AI"
**When** the Team Overview widget renders
**Then** the widget shows: team name "Alpha", course name "Introduction to AI", member count, creation date
**And** a "Manage Team" link to `/teams/{teamId}` is present

---

## AC-FE-232: Team Members Widget

**Given** a team has 5 members, 2 of whom were active in the last 24 hours
**When** the Team Members widget renders
**Then** all 5 members are listed with avatar, name, and last active time
**And** the 2 recently active members show a green activity indicator dot
**And** the team leader has a "Leader" badge

---

## AC-FE-233: Shared Memos Feed Widget

**Given** the team has 3 shared memos
**When** the Shared Memos Feed widget renders
**Then** each memo shows: title, author name, excerpt (max 100 chars), last updated time
**And** a "View all memos" link is present
**And** a "Create Memo" button linking to `/memos/create` is present

---

**Given** the team has no shared memos
**When** the Shared Memos Feed widget renders
**Then** the empty state "No shared memos yet." is displayed with a "Create the first memo" CTA

---

## AC-FE-234: Team Activity Timeline Widget

**Given** there are 5 recent team activities
**When** the Team Activity Timeline widget renders
**Then** each activity shows: type icon, actor name, description, time ago
**And** activities are in reverse chronological order (newest first)

---

## AC-FE-240: DashboardWidget Component

**Given** a widget component uses `DashboardWidget` with `isLoading={true}`
**When** the widget mounts
**Then** Skeleton placeholders are rendered inside the Card body
**And** the widget title and header are still visible during loading

---

**Given** a widget encounters an API error
**When** `DashboardWidget` receives a non-null `error` prop
**Then** an error message is displayed within the card
**And** a "Retry" button is visible that calls the query's `refetch` function

---

## AC-FE-241: DashboardGrid Layout

**Given** the DashboardGrid is rendered with `columns={{ mobile: 1, tablet: 2, desktop: 3 }}`
**When** the viewport is 375px wide
**Then** children are rendered in a single column

**When** the viewport is 768px wide
**Then** children are rendered in 2 columns

**When** the viewport is 1280px wide
**Then** children are rendered in 3 columns

---

## AC-FE-242: EmptyState Component

**Given** a widget has no data
**When** `EmptyState` is rendered with a title, description, and action button
**Then** the icon, title, and description are centered within the widget body
**And** the action button is focusable and keyboard-navigable

---

## AC-FE-243: Dashboard Zustand Store

**Given** the dashboard store is initialized
**When** `setNotificationCount(5)` is called
**Then** `notificationCount` equals 5

**When** `markAllNotificationsRead()` is called
**Then** `notificationCount` equals 0

---

## AC-FE-245: Accessibility

**Given** any of the three dashboard pages is rendered
**When** audited with axe-core
**Then** 0 accessibility violations are reported

---

**Given** the student dashboard quiz scores widget renders scores with color coding
**When** a screen reader reads the score badge
**Then** the badge text includes both the semantic label ("Excellent", "Needs Improvement") and the score (e.g., "9 / 10") so color is not the sole conveyor of meaning

---

**Given** any dashboard page is loaded
**When** a user navigates using Tab key only
**Then** all interactive elements (buttons, links) receive focus in a logical top-to-bottom, left-to-right order
**And** no interactive element is skipped or unreachable via keyboard

---

## AC-FE-N10: No Role Checks in Widgets

**Given** any widget component file is inspected
**Then** there is no import or usage of `useSession`, `auth()`, or role-comparison logic within widget component files
**And** role-based access is handled exclusively in page-level Server Components

---

## AC-FE-N11: No Hardcoded Data

**Given** the API returns an empty array for any widget endpoint
**When** the widget renders
**Then** the empty state is displayed (not placeholder numbers or fabricated names)
**And** no hardcoded data appears in production component files (mock data only in `apps/web/mocks/` fixtures)

---

## AC-FE-N12: No Layout Shift

**Given** the dashboard page renders skeletons, then transitions to real content
**When** measured with Lighthouse or web-vitals
**Then** the Cumulative Layout Shift (CLS) score is ≤ 0.1

---

## AC-FE-N13: No Cross-Role Data Leakage

**Given** a `STUDENT` user session is active
**When** the student dashboard page and its hooks are inspected in browser DevTools (Network tab)
**Then** no API requests are made to instructor-only endpoints (e.g., `instructorCourses`, `studentActivity`)

---

## Definition of Done

- [ ] All three dashboard pages render correctly (Student, Instructor, Team)
- [ ] Role-based redirect works for all role/route combinations
- [ ] All widgets implement loading, error, empty, and data states
- [ ] All TanStack Query hooks have correct query keys and stale times
- [ ] All shared types are defined in `packages/shared/src/types/dashboard.types.ts`
- [ ] Real-time hook skeletons exist for all three dashboards
- [ ] Dashboard Zustand store implemented with all specified state and actions
- [ ] DashboardWidget, DashboardGrid, EmptyState components implemented
- [ ] Responsive grid verified at 375px, 768px, and 1280px viewports
- [ ] WCAG 2.1 AA: 0 axe-core violations
- [ ] TypeScript: 0 type errors
- [ ] ESLint: 0 lint errors
- [ ] Vitest tests passing for store actions and hook query key shapes
