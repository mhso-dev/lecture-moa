---
id: SPEC-FE-007
title: "Quiz System - Acceptance Criteria"
spec_ref: SPEC-FE-007
---

# SPEC-FE-007: Quiz System — Acceptance Criteria

All scenarios follow Given-When-Then format. Tests are implemented with Vitest + React Testing Library for unit/integration and Playwright for E2E critical paths.

---

## AC-600: Quiz Domain Types Compile

**Given** the `packages/shared/src/types/quiz.types.ts` file is implemented per REQ-FE-600
**When** TypeScript compilation runs (`pnpm tsc --noEmit`)
**Then** zero type errors are reported
**And** all discriminated union types (`Question`, `DraftAnswer`) have exhaustive switch coverage verified by `never` type guards

---

## AC-601: Quiz Zod Schemas Validate Correctly

### AC-601-01: Valid quiz creation data passes

**Given** a `CreateQuizSchema` instance
**When** validated with `{ title: "Midterm Exam", courseId: "uuid-v4", timeLimitMinutes: 90, passingScore: 60, allowReattempt: false, shuffleQuestions: true, showAnswersAfterSubmit: true, focusLossWarning: false }`
**Then** `safeParse` returns `{ success: true }`

### AC-601-02: Short title fails validation

**Given** a `CreateQuizSchema` instance
**When** validated with `{ title: "AB", courseId: "uuid-v4" }` (title < 3 chars)
**Then** `safeParse` returns `{ success: false }` with an error on the `title` path

### AC-601-03: Multiple choice question requires min 2 options

**Given** a `QuestionSchema` for type `multiple_choice`
**When** validated with one option only
**Then** validation fails with an error on the `options` path

### AC-601-04: Generation options require at least one material

**Given** a `GenerationOptionsSchema` instance
**When** validated with `{ materialIds: [], count: 10, difficulty: "medium", questionTypes: ["multiple_choice"] }`
**Then** `safeParse` returns `{ success: false }` with error on `materialIds`

---

## AC-602: Quiz List Data Fetching

### AC-602-01: Loading skeleton renders during fetch

**Given** the student quiz list page is mounted
**When** the API request is in flight
**Then** skeleton card components are visible (minimum 3)
**And** no quiz content is rendered yet

### AC-602-02: Quiz list renders after successful fetch

**Given** the API returns 5 quiz items
**When** the fetch completes
**Then** 5 `QuizCard` components are rendered
**And** skeleton cards are no longer visible

### AC-602-03: Error state has retry button

**Given** the API request fails with a 500 error
**When** the error is rendered
**Then** an error message is displayed
**And** a "Retry" button is visible
**When** the retry button is clicked
**Then** the API request is fired again

---

## AC-603: Quiz List Filtering

### AC-603-01: Status filter updates URL params

**Given** the quiz list page is displayed
**When** the user selects the "Upcoming" status filter
**Then** the URL changes to include `?status=upcoming`
**And** the API is called with `status=upcoming`

### AC-603-02: Course filter is applied alongside status filter

**Given** status filter is "Upcoming"
**When** the user selects a course from the course dropdown
**Then** the URL includes both `?status=upcoming&courseId={courseId}`
**And** the API is called with both parameters

### AC-603-03: Filter state survives page refresh

**Given** the URL is `/quizzes?status=completed&courseId=abc`
**When** the page is refreshed
**Then** the status filter shows "Completed"
**And** the course filter shows the corresponding course name

---

## AC-604: Quiz Card Display

### AC-604-01: Student card shows last attempt score

**Given** a published quiz with a completed student attempt (score: 85, max: 100)
**When** the quiz card renders for the student
**Then** the card shows "85/100" in the score badge
**And** a "View Results" button is visible

### AC-604-02: Student card shows "Not attempted" for new quiz

**Given** a published quiz with no student attempt
**When** the quiz card renders for the student
**Then** the card shows "Not attempted"
**And** a "Take Quiz" button is visible

### AC-604-03: Past-due quiz disables Take Quiz

**Given** a published quiz with `dueDate` in the past and no submitted attempt
**When** the quiz card renders for the student
**Then** the "Take Quiz" button is disabled
**And** a "Past due" indicator is visible

### AC-604-04: Instructor card shows management actions

**Given** an instructor viewing their quiz list
**When** a quiz card renders
**Then** "Edit" and "Manage" action buttons are visible
**And** no "Take Quiz" button is present

---

## AC-607: Role-Based Route Access

### AC-607-01: Student cannot access instructor quiz routes

**Given** an authenticated student user
**When** the student navigates to `/instructor/quizzes`
**Then** the system redirects to `/quizzes` or displays a 403 page
**And** no instructor management UI is rendered

### AC-607-02: Instructor cannot access student quiz taking

**Given** an authenticated instructor user
**When** the instructor navigates to `/quizzes/{id}` (quiz taking route)
**Then** the system redirects to the instructor management page

---

## AC-610: Quiz Attempt Initialization

### AC-610-01: New attempt is created on first visit

**Given** a student with no existing attempt for quiz `quiz-123`
**When** the student navigates to `/quizzes/quiz-123`
**Then** `POST /api/quizzes/quiz-123/attempts` is called
**And** the `attemptId` is stored in the quiz-taking Zustand store
**And** all questions are displayed with empty answers

### AC-610-02: Existing in-progress attempt is resumed

**Given** the student has an `in_progress` attempt for quiz `quiz-123` with 3 saved answers
**When** the student navigates to `/quizzes/quiz-123`
**Then** `POST /api/quizzes/quiz-123/attempts` is NOT called
**And** the 3 previously saved answers are restored in the store
**And** the question navigator shows 3 answered questions (filled)

### AC-610-03: Unpublished quiz redirects with toast

**Given** a quiz with status `draft`
**When** the student navigates to the quiz taking page
**Then** the system redirects to `/quizzes`
**And** a toast notification "This quiz is not available." is displayed

---

## AC-612: Question Display

### AC-612-01: Multiple choice renders radio options

**Given** a `multiple_choice` question with 4 options
**When** the question is rendered
**Then** 4 radio inputs are displayed with labels "A", "B", "C", "D"
**And** no option is selected initially

### AC-612-02: MCQ answer selection updates store

**Given** a rendered multiple choice question
**When** the student clicks option "B"
**Then** the store `answers` for this question is `{ type: 'multiple_choice', selectedOptionId: 'option-b-id' }`
**And** `isDirty` is `true` in the store

### AC-612-03: True/False renders two radio buttons

**Given** a `true_false` question
**When** the question is rendered
**Then** exactly two radio buttons labeled "True" and "False" are visible

### AC-612-04: Fill-in-the-blank renders inline inputs

**Given** a fill-in-the-blank question text "The capital of France is ___ and its river is ___."
**When** the question is rendered
**Then** 2 text inputs are rendered inline within the sentence
**And** each input replaces one `___` placeholder

### AC-612-05: Short answer renders textarea

**Given** a `short_answer` question
**When** the question is rendered
**Then** a textarea with minimum 3 rows is rendered
**And** character input updates the store answer text

---

## AC-613: Question Navigator

### AC-613-01: Unanswered questions show outline style

**Given** a quiz with 10 questions and 0 answered
**When** the question navigator renders
**Then** all 10 buttons have outline/unfilled styling
**And** no button has the filled accent styling

### AC-613-02: Answered questions show filled style

**Given** a quiz where questions 1, 3, 5 have answers in the store
**When** the question navigator renders
**Then** buttons for questions 1, 3, 5 have filled accent styling
**And** buttons for questions 2, 4, 6-10 have outline styling

### AC-613-03: Click navigates to correct question

**Given** the quiz taking page is showing question 1
**When** the student clicks the button for question 7 in the navigator
**Then** question 7 is displayed
**And** `currentQuestionIndex` in the store is 6 (zero-indexed)

### AC-613-04: Mobile bottom sheet behavior

**Given** the viewport is 375px width
**When** the quiz taking page renders
**Then** the question navigator is a bottom sheet (not a side column)
**And** the bottom sheet can be opened/closed by tapping a trigger button

---

## AC-614: Quiz Timer

### AC-614-01: Timer counts down from configured limit

**Given** a quiz with `timeLimitMinutes: 30` and a new attempt
**When** the quiz taking page renders
**Then** the timer displays "30:00"
**And** after 1 second, the timer displays "29:59"

### AC-614-02: Timer turns amber at 2 minutes remaining

**Given** the timer is counting down
**When** remaining time reaches exactly 120 seconds
**Then** the timer display changes to amber color
**And** an `aria-live="assertive"` announcement reads "2 minutes remaining"

### AC-614-03: Timer turns red at 1 minute remaining

**Given** the timer is counting down
**When** remaining time reaches exactly 60 seconds
**Then** the timer display changes to red color
**And** a pulsing animation is applied to the timer

### AC-614-04: Timer auto-submits at 0

**Given** remaining time is at 1 second
**When** the timer ticks to 0
**Then** `timerStatus` in the store becomes `expired`
**And** the submission flow is triggered automatically
**And** a "Time's up" notification is displayed

### AC-614-05: Quiz without timer shows no timer UI

**Given** a quiz with `timeLimitMinutes: null`
**When** the quiz taking page renders
**Then** no timer component is visible

---

## AC-616: Auto-Save Draft Answers

### AC-616-01: Auto-save triggers after debounce

**Given** the student is taking a quiz with `isDirty: false`
**When** the student selects an answer (setting `isDirty: true`)
**And** 3 seconds pass without further changes
**Then** `PUT /api/quizzes/:id/attempts/:attemptId` is called with current answers
**And** `isDirty` becomes `false`
**And** `lastSavedAt` is updated

### AC-616-02: Rapid changes debounce correctly

**Given** the student changes answers 5 times within 2 seconds
**When** 3 seconds pass after the last change
**Then** exactly 1 API call is made (not 5)

### AC-616-03: Failed save shows retry toast

**Given** auto-save triggers
**When** the API returns a 500 error
**Then** a toast notification "Changes not saved. Will retry shortly." is displayed
**And** a retry attempt is made after 5 seconds

---

## AC-617: Quiz Submission

### AC-617-01: Submit dialog shows unanswered warning

**Given** a 10-question quiz with 7 answers filled
**When** the student clicks "Submit Quiz"
**Then** the submit confirmation dialog is displayed
**And** the dialog contains the message "3 questions unanswered"

### AC-617-02: Confirm submission navigates to results

**Given** the submit confirmation dialog is open
**When** the student clicks "Confirm Submit"
**Then** `POST /api/quizzes/:id/attempts/:attemptId/submit` is called
**And** on success, the student is navigated to `/quizzes/[id]/results?attemptId=[attemptId]`
**And** the quiz-taking store is reset

### AC-617-03: Submission failure keeps student on quiz page

**Given** the confirm submit is clicked
**When** the API returns a 500 error
**Then** an error toast is displayed
**And** the student remains on the quiz taking page
**And** the store is NOT reset

---

## AC-618: Anti-Cheat Focus Detection

### AC-618-01: Focus loss increments counter and shows warning

**Given** a quiz with `focusLossWarning: true`
**When** the user switches to another browser tab (`visibilitychange` fires)
**Then** `focusLossCount` in the store increments by 1
**And** a modal dialog "Focus loss detected. This event has been recorded." is displayed

### AC-618-02: Warning modal dismisses with Continue Quiz

**Given** the focus loss warning modal is displayed
**When** the student clicks "Continue Quiz"
**Then** the modal closes
**And** the quiz remains on the current question

### AC-618-03: Focus detection disabled when setting is off

**Given** a quiz with `focusLossWarning: false`
**When** the user switches to another browser tab
**Then** no warning modal is displayed
**And** `focusLossCount` remains 0

---

## AC-619: Keyboard Navigation

### AC-619-01: Arrow keys navigate between questions

**Given** the quiz taking page is displaying question 3
**When** the right arrow key is pressed
**Then** question 4 is displayed

**When** the left arrow key is pressed
**Then** question 3 is displayed again

### AC-619-02: Number keys select MCQ options

**Given** question 1 is a multiple choice question with 4 options
**And** the question area has focus
**When** the user presses "2"
**Then** option B is selected

### AC-619-03: Escape closes submit dialog

**Given** the submit confirmation dialog is open
**When** the Escape key is pressed
**Then** the dialog closes
**And** the student is returned to the quiz

---

## AC-621: Results Summary Card

### AC-621-01: Score and percentage display correctly

**Given** a quiz result with score 72 and maxScore 100
**When** the results summary renders
**Then** "72 / 100 points" is displayed in large typography
**And** "72%" is displayed

### AC-621-02: Pass badge displays when passing score is met

**Given** a quiz with `passingScore: 60` and a result with `percentage: 72`
**When** the results summary renders
**Then** a green "Passed" badge is displayed

### AC-621-03: Fail badge displays when passing score is not met

**Given** a quiz with `passingScore: 60` and a result with `percentage: 45`
**When** the results summary renders
**Then** a red "Failed" badge is displayed

### AC-621-04: No pass/fail badge when passing score is not configured

**Given** a quiz with `passingScore: null`
**When** the results summary renders
**Then** no pass/fail badge is displayed

---

## AC-622: Question-by-Question Review

### AC-622-01: Correct answer shown when setting is enabled

**Given** `showAnswersAfterSubmit: true`
**And** the student answered question 1 incorrectly
**When** the results breakdown renders
**Then** the student's answer is displayed (highlighted in red)
**And** the correct answer is displayed (highlighted in green)
**And** the explanation text is shown (if present)

### AC-622-02: Correct answer hidden when setting is disabled

**Given** `showAnswersAfterSubmit: false`
**And** the student answered question 1 incorrectly
**When** the results breakdown renders
**Then** only the "Incorrect" indicator is shown
**And** the correct answer text is NOT visible

### AC-622-03: Short answer shows pending grading label

**Given** a `short_answer` question in the results
**When** the results breakdown renders
**Then** "Pending manual grading" is displayed instead of a correct/incorrect indicator

---

## AC-630: Quiz Metadata Form

### AC-630-01: Title validation error shown inline

**Given** the quiz creation form is displayed
**When** the instructor submits with a 2-character title
**Then** an inline error "Title must be at least 3 characters" is displayed below the title field
**And** the form is not submitted

### AC-630-02: Time limit toggle enables/disables field

**Given** the quiz creation form with time limit toggle set to OFF
**When** the instructor turns the toggle ON
**Then** the minutes number input becomes enabled and focused
**When** the instructor turns the toggle OFF
**Then** the minutes input is disabled and its value is cleared

---

## AC-631: Question Editor

### AC-631-01: Question type change clears previous type-specific fields

**Given** a question editor set to `multiple_choice` with 3 options entered
**When** the question type is changed to `true_false`
**Then** the options list is removed
**And** True/False radio buttons are shown
**And** the options data is NOT preserved in the form state

---

## AC-632: Question List Drag-and-Drop

### AC-632-01: Drag reorders questions

**Given** a quiz with questions ordered [Q1, Q2, Q3]
**When** Q3 is dragged and dropped above Q1
**Then** the order becomes [Q3, Q1, Q2]
**And** the `order` field values are updated accordingly

---

## AC-634: Quiz Publish Action

### AC-634-01: Publish requires at least one question

**Given** a quiz with 0 questions
**When** the instructor views the publish button
**Then** the button is disabled
**And** a tooltip reads "Add at least one question before publishing."

### AC-634-02: Publish confirmation dialog shown

**Given** a quiz with 3 questions
**When** the instructor clicks "Publish Quiz"
**Then** a confirmation dialog is shown: "Publishing makes the quiz available to students. Continue?"
**When** the instructor clicks "Confirm"
**Then** `POST /api/quizzes/:id/publish` is called
**And** the status badge updates to "Published"

---

## AC-640: Material Selection

### AC-640-01: Materials grouped by course

**Given** the AI generation page for a quiz assigned to Course A
**And** Course A has 3 materials
**When** the material selector renders
**Then** all 3 materials are listed under a "Course A" group header

### AC-640-02: Empty state links to material upload

**Given** no materials exist for any of the instructor's courses
**When** the material selector renders
**Then** an empty state message is shown
**And** a link to the materials upload page (SPEC-FE-004) is visible

---

## AC-642: AI Generation Request

### AC-642-01: Loading state shown during generation

**Given** the generation form is submitted
**When** the API request is in flight
**Then** a full-page loading indicator is displayed
**And** the message "Generating quiz questions with AI…" is visible

### AC-642-02: Client-side timeout after 60 seconds

**Given** the generation request has been sent
**When** 60 seconds pass with no response
**Then** the loading state is replaced with an error message "Generation timed out."
**And** a "Retry" button is visible

---

## AC-650: Quiz Management Table

### AC-650-01: All columns render with correct data

**Given** the instructor has 3 quizzes (1 draft, 1 published, 1 closed)
**When** the management table renders
**Then** 3 rows are displayed
**And** each row shows the correct status badge (Draft / Published / Closed)
**And** action buttons (Edit, Manage Submissions, Duplicate, Delete) are visible per row

---

## AC-654: Results CSV Export

### AC-654-01: CSV download is triggered

**Given** the instructor is viewing the submissions list with 5 student submissions
**When** the instructor clicks "Export CSV"
**Then** a file download is triggered in the browser
**And** the file is named `quiz-{quizTitle}-results.csv`
**And** the CSV contains 5 data rows plus a header row with columns: Student Name, Score, Percentage, Submitted At

---

## AC-660: Keyboard Navigation (Accessibility)

### AC-660-01: All interactive elements are keyboard-reachable

**Given** the quiz taking page
**When** the user tabs through all interactive elements
**Then** every button, input, radio, and textarea receives focus in logical order
**And** each focused element has a visible focus ring (`:focus-visible` style)

### AC-660-02: Submit dialog traps focus

**Given** the submit confirmation dialog is open
**When** the user presses Tab repeatedly
**Then** focus cycles only between the "Confirm Submit" and "Continue Quiz" buttons
**And** focus does not leave the dialog

---

## AC-661: ARIA Labeling

### AC-661-01: Timer has correct ARIA role

**Given** the quiz timer component is rendered
**When** inspected by screen reader tooling (axe-core)
**Then** the timer element has `role="timer"`
**And** `aria-label="Time remaining"`

### AC-661-02: Progress bar has ARIA progressbar role

**Given** 3 of 10 questions are answered
**When** the progress bar is rendered
**Then** the element has `role="progressbar"`, `aria-valuenow="3"`, `aria-valuemin="0"`, `aria-valuemax="10"`

---

## AC-670: Network Interruption

### AC-670-01: Offline banner appears when connection is lost

**Given** the student is actively taking a quiz
**When** the browser goes offline (`navigator.onLine` becomes `false`)
**Then** a banner "You are offline. Answers are saved locally." appears

### AC-670-02: Submit button is disabled while offline

**Given** the student is offline
**When** the student attempts to click "Submit Quiz"
**Then** the button is visually disabled
**And** a tooltip reads "No internet connection."

---

## Definition of Done

A requirement is considered DONE when:

1. All acceptance criteria for that requirement pass.
2. Unit tests cover the core logic (happy path + minimum 2 edge cases).
3. Component renders without errors in Storybook (if applicable).
4. axe-core reports zero accessibility violations on the component.
5. No TypeScript errors (`tsc --noEmit` passes).
6. No ESLint errors or warnings introduced.
7. The component is responsive across Mobile (375px), Tablet (768px), and Desktop (1280px+).

## Test Coverage Targets

| Area | Target |
|------|--------|
| `packages/shared/src/validators/quiz.schema.ts` | 95% (schema boundary testing) |
| `apps/web/stores/quiz-taking.store.ts` | 90% (all actions + selectors) |
| `apps/web/hooks/use-quiz-timer.ts` | 90% (tick, thresholds, auto-submit) |
| `apps/web/components/quiz/**` | 80% (component rendering + interactions) |
| `apps/web/lib/api/quiz.api.ts` | 85% (mocked API calls) |
| E2E (Playwright) | Critical paths: student quiz flow, instructor creation |
