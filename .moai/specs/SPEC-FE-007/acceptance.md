---
id: SPEC-FE-007
title: "Quiz System - Acceptance Criteria"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-007: Quiz System -- Acceptance Criteria

## Quality Gate Criteria

- Unit test coverage: >= 85% for all hooks (`hooks/quiz/`), store (`quiz-taking.store.ts`), and utility functions
- TypeScript: zero type errors (strict mode)
- ESLint: zero errors
- WCAG 2.1 AA: axe-core passes with zero violations
- Responsive: verified at 375px, 768px, 1280px
- Role-based correctness: verified for STUDENT and INSTRUCTOR roles
- All API calls use `/api/v1/quiz/` prefix
- Existing hooks reused (`useBeforeUnload`, `useDebounce`, `useMediaQuery`), no recreation

---

## AC-600: Quiz Domain Types Compile

### AC-600-01: Core Types Compilation

```gherkin
Given packages/shared/src/types/quiz.types.ts is implemented with all quiz domain types
When TypeScript compiler runs on packages/shared (pnpm tsc --noEmit)
Then compilation succeeds with zero errors
And QuizListItem, QuizDetail, Question, DraftAnswer, QuizAttempt, QuizResult, QuestionResult types are exported
And Question type is a discriminated union of MultipleChoiceQuestion | TrueFalseQuestion | ShortAnswerQuestion | FillInBlankQuestion
And DraftAnswer type is a discriminated union matching all four question types
And exhaustive switch coverage is verified by never type guards
And quiz.types.ts references ApiResponse and PaginatedResponse from api.types.ts without redefining them
```

### AC-600-02: Instructor Types Compilation

```gherkin
Given packages/shared/src/types/quiz.types.ts includes instructor types
When TypeScript compiler runs
Then GeneratedQuestion, QuizSubmissionSummary, CreateQuizInput, GenerationOptions types are exported
And GeneratedQuestion has tempId (string, client-side only)
```

---

## AC-601: Quiz Zod Schemas Validate Correctly

### AC-601-01: Valid quiz creation data passes

```gherkin
Given a CreateQuizSchema instance from packages/shared/src/validators/quiz.schema.ts
When validated with { title: "Midterm Exam", courseId: "uuid-v4", timeLimitMinutes: 90, passingScore: 60, allowReattempt: false, shuffleQuestions: true, showAnswersAfterSubmit: true, focusLossWarning: false }
Then safeParse returns { success: true }
```

### AC-601-02: Short title fails validation

```gherkin
Given a CreateQuizSchema instance
When validated with { title: "AB", courseId: "uuid-v4" } (title < 3 chars)
Then safeParse returns { success: false } with an error on the title path
```

### AC-601-03: Multiple choice question requires min 2 options

```gherkin
Given a QuestionSchema for type multiple_choice
When validated with only one option
Then validation fails with an error on the options path
And the error message indicates minimum 2 options required
```

### AC-601-04: Generation options require at least one material

```gherkin
Given a GenerationOptionsSchema instance
When validated with { materialIds: [], count: 10, difficulty: "medium", questionTypes: ["multiple_choice"] }
Then safeParse returns { success: false } with error on materialIds
```

### AC-601-05: Time limit must be between 1 and 300

```gherkin
Given a CreateQuizSchema instance
When validated with { title: "Valid Title", courseId: "uuid-v4", timeLimitMinutes: 0 }
Then safeParse returns { success: false } with error on timeLimitMinutes
When validated with { title: "Valid Title", courseId: "uuid-v4", timeLimitMinutes: 301 }
Then safeParse returns { success: false } with error on timeLimitMinutes
```

### AC-601-06: Generation count must be between 1 and 50

```gherkin
Given a GenerationOptionsSchema instance
When validated with { materialIds: ["uuid"], count: 0, difficulty: "easy", questionTypes: ["true_false"] }
Then safeParse returns { success: false } with error on count
When validated with { materialIds: ["uuid"], count: 51, difficulty: "easy", questionTypes: ["true_false"] }
Then safeParse returns { success: false } with error on count
```

---

## AC-602: Quiz List Data Fetching

### AC-602-01: Loading skeleton renders during fetch

```gherkin
Given the student quiz list page is mounted at /quizzes
When the GET /api/v1/quiz/quizzes request is in flight
Then skeleton card components are visible (minimum 3)
And no quiz content is rendered yet
```

### AC-602-02: Quiz list renders after successful fetch

```gherkin
Given the GET /api/v1/quiz/quizzes API returns 5 quiz items
When the fetch completes
Then 5 QuizCard components are rendered
And skeleton cards are no longer visible
```

### AC-602-03: Error state has retry button

```gherkin
Given the GET /api/v1/quiz/quizzes request fails with a 500 error
When the error state is rendered
Then an error message is displayed
And a "Retry" button is visible
When the retry button is clicked
Then the GET /api/v1/quiz/quizzes request is fired again
```

---

## AC-603: Quiz List Filtering

### AC-603-01: Status filter updates URL params

```gherkin
Given the quiz list page is displayed at /quizzes
When the user selects the "Upcoming" status filter
Then the URL changes to include ?status=upcoming
And GET /api/v1/quiz/quizzes is called with status=upcoming query parameter
```

### AC-603-02: Course filter is applied alongside status filter

```gherkin
Given status filter is "Upcoming"
When the user selects a course from the course dropdown
Then the URL includes both ?status=upcoming&courseId={courseId}
And GET /api/v1/quiz/quizzes is called with both parameters
```

### AC-603-03: Filter state survives page refresh

```gherkin
Given the URL is /quizzes?status=completed&courseId=abc
When the page is refreshed
Then the status filter shows "Completed"
And the course filter shows the corresponding course name
And the API call includes both filter parameters
```

---

## AC-604: Quiz Card Display

### AC-604-01: Student card shows last attempt score

```gherkin
Given a published quiz with a completed student attempt (score: 85, max: 100)
When the quiz card renders for the student
Then the card shows "85/100" in the score badge
And a "View Results" button is visible
```

### AC-604-02: Student card shows "Not attempted" for new quiz

```gherkin
Given a published quiz with no student attempt
When the quiz card renders for the student
Then the card shows "Not attempted"
And a "Take Quiz" button is visible
```

### AC-604-03: Past-due quiz disables Take Quiz

```gherkin
Given a published quiz with dueDate in the past and no submitted attempt
When the quiz card renders for the student
Then the "Take Quiz" button is disabled
And a "Past due" indicator is visible
```

### AC-604-04: Instructor card shows management actions

```gherkin
Given an instructor viewing their quiz list at /instructor/quizzes
When a quiz card renders
Then "Edit" and "Manage" action buttons are visible
And no "Take Quiz" button is present
```

### AC-604-05: Card displays all metadata fields

```gherkin
Given a quiz with title "Midterm", courseName "CS101", questionCount 20, timeLimitMinutes 60, dueDate "2026-03-01T00:00:00Z"
When the quiz card renders
Then the title "Midterm" is displayed
And "CS101" course name is displayed
And "20 questions" count is displayed
And "60 min" time limit is displayed
And due date is displayed with relative time (e.g., "Due in X days")
```

---

## AC-605: Empty State

### AC-605-01: No quizzes at all

```gherkin
Given the student has no quizzes available (empty API response)
When the quiz list renders
Then the empty state shows "No quizzes available"
```

### AC-605-02: Filtered empty state

```gherkin
Given quizzes exist but none match the applied filters
When the filtered quiz list renders
Then "No quizzes match your filters" is displayed
And a clear-filters link is visible
```

### AC-605-03: Instructor empty state shows create button

```gherkin
Given an instructor with no quizzes
When the instructor quiz list renders
Then "No quizzes yet" message is displayed
And a "Create Quiz" button is visible
```

---

## AC-606: Quiz List Pagination

### AC-606-01: Load more button appears with additional pages

```gherkin
Given the GET /api/v1/quiz/quizzes response includes a nextCursor value
When the quiz list renders
Then a "Load more" button is visible below the list
When the "Load more" button is clicked
Then additional quiz items are fetched and appended to the list
And the loading state is shown during fetch
```

---

## AC-607: Role-Based Route Access

### AC-607-01: Student cannot access instructor quiz routes

```gherkin
Given an authenticated student user
When the student navigates to /instructor/quizzes
Then the RequireRole guard redirects to /quizzes
And no instructor management UI is rendered
```

### AC-607-02: Instructor cannot access student quiz taking

```gherkin
Given an authenticated instructor user
When the instructor navigates to /quizzes/{id} (quiz taking route)
Then the system redirects to the instructor management page
And no quiz taking UI is rendered
```

---

## AC-610: Quiz Attempt Initialization

### AC-610-01: New attempt is created on first visit

```gherkin
Given a student with no existing attempt for quiz quiz-123
When the student navigates to /quizzes/quiz-123
Then POST /api/v1/quiz/quizzes/quiz-123/attempts is called
And the attemptId is stored in the quiz-taking Zustand store
And all questions are displayed with empty answers
```

### AC-610-02: Existing in-progress attempt is resumed

```gherkin
Given the student has an in_progress attempt for quiz quiz-123 with 3 saved answers
When the student navigates to /quizzes/quiz-123
Then POST /api/v1/quiz/quizzes/quiz-123/attempts is NOT called
And the 3 previously saved answers are restored in the store
And the question navigator shows 3 answered questions (filled style)
```

### AC-610-03: Unpublished quiz redirects with toast

```gherkin
Given a quiz with status draft
When the student navigates to /quizzes/{id}
Then the system redirects to /quizzes
And a toast notification "This quiz is not available." is displayed
```

### AC-610-04: Completed quiz with no reattempt redirects to results

```gherkin
Given a quiz with allowReattempt: false and the student has a submitted attempt
When the student navigates to /quizzes/{id}
Then the system redirects to /quizzes/{id}/results?attemptId={lastAttemptId}
```

---

## AC-611: Quiz Taking Store

### AC-611-01: Store initialization and reset

```gherkin
Given the quiz-taking store is initialized for quiz quiz-123 with attempt att-456
When the store state is inspected
Then quizId equals "quiz-123"
And attemptId equals "att-456"
And currentQuestionIndex equals 0
And answers is an empty object
And isDirty is false
And focusLossCount is 0

When reset() is called
Then quizId is null
And attemptId is null
And answers is an empty object
And timerStatus is "idle"
```

### AC-611-02: Set answer updates state correctly

```gherkin
Given the quiz-taking store is initialized
When setAnswer("q1", { questionId: "q1", type: "multiple_choice", selectedOptionId: "opt-a" }) is called
Then answers["q1"] equals the provided draft answer
And isDirty is true
```

---

## AC-612: Question Display

### AC-612-01: Multiple choice renders radio options

```gherkin
Given a multiple_choice question with 4 options
When the question is rendered by QuestionDisplay
Then 4 radio inputs are displayed with labels "A", "B", "C", "D"
And no option is selected initially
And the radio group has role="radiogroup" with aria-labelledby pointing to the question text
```

### AC-612-02: MCQ answer selection updates store

```gherkin
Given a rendered multiple choice question
When the student clicks option "B"
Then the store answers for this questionId is { type: "multiple_choice", selectedOptionId: "option-b-id" }
And isDirty is true in the store
```

### AC-612-03: True/False renders two radio buttons

```gherkin
Given a true_false question
When the question is rendered by QuestionDisplay
Then exactly two radio buttons labeled "True" and "False" are visible
And neither is selected initially
```

### AC-612-04: Fill-in-the-blank renders inline inputs

```gherkin
Given a fill_in_the_blank question text "The capital of France is ___ and its river is ___."
When the question is rendered by QuestionDisplay
Then 2 text inputs are rendered inline within the sentence
And each input replaces one ___ placeholder
And typing in the first input updates the store answer filledAnswers for the first blank id
```

### AC-612-05: Short answer renders textarea

```gherkin
Given a short_answer question
When the question is rendered by QuestionDisplay
Then a textarea with minimum 3 rows is rendered
And character input updates the store answer text
```

### AC-612-06: Question text renders lightweight Markdown

```gherkin
Given a question with questionText containing "The **bold** concept of `code` block"
When the question is rendered by QuestionDisplay
Then bold text is rendered as bold (not raw asterisks)
And code is rendered as inline code (not raw backticks)
And the rendering uses MarkdownRenderer from components/markdown/ (EXISTING)
```

---

## AC-613: Question Navigator

### AC-613-01: Unanswered questions show outline style

```gherkin
Given a quiz with 10 questions and 0 answered
When the question navigator renders
Then all 10 buttons have outline/unfilled styling
And no button has the filled accent styling
```

### AC-613-02: Answered questions show filled style

```gherkin
Given a quiz where questions 1, 3, 5 have answers in the store
When the question navigator renders
Then buttons for questions 1, 3, 5 have filled accent styling
And buttons for questions 2, 4, 6-10 have outline styling
```

### AC-613-03: Click navigates to correct question

```gherkin
Given the quiz taking page is showing question 1
When the student clicks the button for question 7 in the navigator
Then question 7 is displayed in the content area
And currentQuestionIndex in the store is 6 (zero-indexed)
```

### AC-613-04: Mobile bottom sheet behavior

```gherkin
Given the viewport is 375px width
When the quiz taking page renders
Then the question navigator is rendered as a Sheet (bottom sheet, not a side column)
And the bottom sheet can be opened/closed by tapping a trigger button
And useMediaQuery (EXISTING) determines the mobile variant
```

### AC-613-05: Desktop sidebar behavior

```gherkin
Given the viewport is 1280px width
When the quiz taking page renders
Then the question navigator is rendered as a fixed sidebar (240px width)
And the sidebar is always visible (no toggle needed)
```

### AC-613-06: Navigator button ARIA labels

```gherkin
Given question 3 is answered and question 4 is unanswered
When the navigator renders
Then the button for question 3 has aria-label="Question 3, answered"
And the button for question 4 has aria-label="Question 4, unanswered"
```

---

## AC-614: Quiz Timer

### AC-614-01: Timer counts down from configured limit

```gherkin
Given a quiz with timeLimitMinutes: 30 and a new attempt
When the quiz taking page renders
Then the timer displays "30:00"
And after 1 second, the timer displays "29:59"
And the useQuizTimer hook (hooks/quiz/useQuizTimer.ts) manages the setInterval
```

### AC-614-02: Timer turns amber at 2 minutes remaining

```gherkin
Given the timer is counting down
When remaining time reaches exactly 120 seconds
Then the timer display changes to amber color
And an aria-live="assertive" announcement reads "2 minutes remaining"
```

### AC-614-03: Timer turns red at 1 minute remaining

```gherkin
Given the timer is counting down
When remaining time reaches exactly 60 seconds
Then the timer display changes to red color
And a pulsing animation is applied to the timer
And an aria-live="assertive" announcement reads "1 minute remaining"
```

### AC-614-04: Timer auto-submits at 0

```gherkin
Given remaining time is at 1 second
When the timer ticks to 0
Then timerStatus in the store becomes "expired"
And the submission flow is triggered automatically (same as REQ-FE-617)
And a "Time's up" notification is displayed
```

### AC-614-05: Quiz without timer shows no timer UI

```gherkin
Given a quiz with timeLimitMinutes: null
When the quiz taking page renders
Then no timer component is visible
And no setInterval is running
```

### AC-614-06: Timer has correct ARIA attributes

```gherkin
Given the quiz timer component is rendered
When inspected by screen reader tooling (axe-core)
Then the timer element has role="timer"
And aria-label="Time remaining"
And aria-live="off" (announcements only at threshold changes via separate live region)
```

---

## AC-615: Progress Bar

### AC-615-01: Progress bar shows correct fraction

```gherkin
Given a 10-question quiz with 3 questions answered
When the progress bar renders
Then it displays "3 / 10" as text
And the bar width represents 30%
And the element has role="progressbar", aria-valuenow="3", aria-valuemin="0", aria-valuemax="10"
```

### AC-615-02: Progress bar animates on answer change

```gherkin
Given 3 of 10 questions are answered (bar at 30%)
When the student answers question 4
Then the bar width transitions from 30% to 40%
And the transition uses CSS transition (300ms ease-in-out)
```

---

## AC-616: Auto-Save Draft Answers

### AC-616-01: Auto-save triggers after debounce

```gherkin
Given the student is taking a quiz with isDirty: false
When the student selects an answer (setting isDirty: true)
And 3 seconds pass without further changes (debounced via useDebounce - EXISTING)
Then PUT /api/v1/quiz/quizzes/:id/attempts/:attemptId is called with current answers
And isDirty becomes false
And lastSavedAt is updated
```

### AC-616-02: Rapid changes debounce correctly

```gherkin
Given the student changes answers 5 times within 2 seconds
When 3 seconds pass after the last change
Then exactly 1 PUT /api/v1/quiz/quizzes/:id/attempts/:attemptId call is made (not 5)
```

### AC-616-03: Failed save shows retry toast

```gherkin
Given auto-save triggers via PUT /api/v1/quiz/quizzes/:id/attempts/:attemptId
When the API returns a 500 error
Then a toast notification "Changes not saved. Will retry shortly." is displayed
And a retry attempt is made after 5 seconds
```

### AC-616-04: Forced save on page leave

```gherkin
Given the student has unsaved changes (isDirty: true)
When the student attempts to navigate away from the quiz page
Then useBeforeUnload (EXISTING) triggers an immediate save (non-debounced)
And PUT /api/v1/quiz/quizzes/:id/attempts/:attemptId is called before navigation
```

---

## AC-617: Quiz Submission

### AC-617-01: Submit dialog shows unanswered warning

```gherkin
Given a 10-question quiz with 7 answers filled
When the student clicks "Submit Quiz"
Then the QuizSubmitDialog confirmation dialog is displayed
And the dialog contains the text "3 questions unanswered"
And "Confirm Submit" and "Continue Quiz" buttons are visible
```

### AC-617-02: Confirm submission navigates to results

```gherkin
Given the submit confirmation dialog is open
When the student clicks "Confirm Submit"
Then a final forced save is triggered for current answers
And POST /api/v1/quiz/quizzes/:id/attempts/:attemptId/submit is called
And on success, the student is navigated to /quizzes/{id}/results?attemptId={attemptId}
And the quiz-taking store is reset via store.reset()
```

### AC-617-03: Submission failure keeps student on quiz page

```gherkin
Given the confirm submit is clicked
When the POST /api/v1/quiz/quizzes/:id/attempts/:attemptId/submit API returns a 500 error
Then an error toast is displayed
And the student remains on the quiz taking page
And the store is NOT reset
```

### AC-617-04: All questions answered shows no warning

```gherkin
Given a 10-question quiz with all 10 answers filled
When the student clicks "Submit Quiz"
Then the submit dialog shows total answered as "10 / 10"
And no unanswered warning is displayed
```

---

## AC-618: Anti-Cheat Focus Detection

### AC-618-01: Focus loss increments counter and shows warning

```gherkin
Given a quiz with focusLossWarning: true
When the user switches to another browser tab (document.visibilitychange fires)
Then focusLossCount in the store increments by 1
And a modal dialog "Focus loss detected. This event has been recorded." is displayed
And the modal has a single "Continue Quiz" dismiss button
```

### AC-618-02: Warning modal dismisses with Continue Quiz

```gherkin
Given the focus loss warning modal is displayed
When the student clicks "Continue Quiz"
Then the modal closes
And the quiz remains on the current question
```

### AC-618-03: Focus detection disabled when setting is off

```gherkin
Given a quiz with focusLossWarning: false
When the user switches to another browser tab
Then no warning modal is displayed
And focusLossCount remains 0
And no visibilitychange or blur event listeners are attached
```

### AC-618-04: Focus loss count included in auto-save

```gherkin
Given focusLossCount is 3 in the store
When auto-save triggers
Then the PUT /api/v1/quiz/quizzes/:id/attempts/:attemptId payload includes focusLossCount: 3
```

---

## AC-619: Keyboard Navigation

### AC-619-01: Arrow keys navigate between questions

```gherkin
Given the quiz taking page is displaying question 3
When the right arrow key is pressed
Then question 4 is displayed

When the left arrow key is pressed
Then question 3 is displayed again
```

### AC-619-02: Number keys select MCQ options

```gherkin
Given question 1 is a multiple choice question with 4 options
And the question area has focus
When the user presses "2"
Then option B is selected
And the store answer is updated to { type: "multiple_choice", selectedOptionId: option-b-id }
```

### AC-619-03: T/F keys select True/False options

```gherkin
Given question 2 is a true_false question
And the question area has focus
When the user presses "T"
Then the "True" option is selected
When the user presses "F"
Then the "False" option is selected
```

### AC-619-04: Escape closes submit dialog

```gherkin
Given the submit confirmation dialog is open
When the Escape key is pressed
Then the dialog closes
And the student is returned to the quiz
```

---

## AC-620: Results Data Fetching

### AC-620-01: Results loading skeleton

```gherkin
Given the results page is mounted at /quizzes/{id}/results?attemptId={attemptId}
When GET /api/v1/quiz/quizzes/:id/attempts/:attemptId/results is in flight
Then a ResultsSummarySkeleton loading state is displayed
```

### AC-620-02: Unauthorized attempt redirects

```gherkin
Given the attemptId does not belong to the authenticated user
When the results page loads
Then the system redirects to /quizzes
And a 403 error toast is displayed
```

---

## AC-621: Results Summary Card

### AC-621-01: Score and percentage display correctly

```gherkin
Given a quiz result with score 72 and maxScore 100
When the ResultsSummary renders
Then "72 / 100 points" is displayed in large typography
And "72%" is displayed
```

### AC-621-02: Pass badge displays when passing score is met

```gherkin
Given a quiz with passingScore: 60 and a result with percentage: 72
When the ResultsSummary renders
Then a green "Passed" badge is displayed
```

### AC-621-03: Fail badge displays when passing score is not met

```gherkin
Given a quiz with passingScore: 60 and a result with percentage: 45
When the ResultsSummary renders
Then a red "Failed" badge is displayed
```

### AC-621-04: No pass/fail badge when passing score is not configured

```gherkin
Given a quiz with passingScore: null
When the ResultsSummary renders
Then no pass/fail badge is displayed
```

### AC-621-05: Retake button visibility

```gherkin
Given a quiz with allowReattempt: true and status: "published"
When the results page renders
Then a "Retake Quiz" button is visible

Given a quiz with allowReattempt: false
When the results page renders
Then no "Retake Quiz" button is visible
```

---

## AC-622: Question-by-Question Review

### AC-622-01: Correct answer shown when setting is enabled

```gherkin
Given showAnswersAfterSubmit: true
And the student answered question 1 incorrectly
When the ResultsBreakdown renders
Then the student's answer is displayed (highlighted in red/destructive color)
And the correct answer is displayed (highlighted in green/success color)
And the explanation text is shown (if present)
And earned points vs possible points are displayed (e.g., "0 / 10 pts")
```

### AC-622-02: Correct answer hidden when setting is disabled

```gherkin
Given showAnswersAfterSubmit: false
And the student answered question 1 incorrectly
When the ResultsBreakdown renders
Then only the "Incorrect" indicator icon is shown
And the correct answer text is NOT visible
And the explanation text is NOT shown
```

### AC-622-03: Short answer shows pending grading label

```gherkin
Given a short_answer question in the results
When the ResultsBreakdown renders for this question
Then "Pending manual grading" is displayed instead of a correct/incorrect indicator
```

---

## AC-623: Results Score Chart

### AC-623-01: SVG donut chart renders correctly

```gherkin
Given a quiz result with 7 correct, 2 incorrect, and 1 unanswered out of 10 questions
When the ResultsChart renders
Then an SVG donut chart is displayed
And the chart has a green segment representing 70% (correct)
And a red segment representing 20% (incorrect)
And a muted segment representing 10% (unanswered)
And the chart has aria-hidden="true"
And a screen-reader-accessible text alternative is provided
```

---

## AC-624: Instructor Results View

### AC-624-01: Instructor sees student info panel

```gherkin
Given an instructor navigates to /instructor/quizzes/{id}/submissions/{attemptId}
When the page renders
Then the same results breakdown is shown as the student view
And an additional panel shows student name and submission timestamp
And previous/next student submission navigation buttons are visible
```

---

## AC-630: Quiz Metadata Form

### AC-630-01: Title validation error shown inline

```gherkin
Given the quiz creation form is displayed at /instructor/quizzes/new
When the instructor submits with a 2-character title
Then an inline error "Title must be at least 3 characters" is displayed below the title field
And the form is not submitted to the API
```

### AC-630-02: Time limit toggle enables/disables field

```gherkin
Given the quiz creation form with time limit toggle set to OFF
When the instructor turns the toggle ON
Then the minutes number input becomes enabled and focused
When the instructor turns the toggle OFF
Then the minutes input is disabled and its value is cleared
```

### AC-630-03: Form saves as draft when no questions exist

```gherkin
Given the quiz metadata form is filled with valid data
And no questions have been added
When the instructor clicks "Save"
Then POST /api/v1/quiz/quizzes is called with status "draft"
And the instructor is navigated to the question editing section
```

---

## AC-631: Question Editor

### AC-631-01: Question type change clears previous type-specific fields

```gherkin
Given a question editor set to multiple_choice with 3 options entered
When the question type is changed to true_false
Then the options list is removed from the form
And True/False radio buttons are shown
And the options data is NOT preserved in the form state
```

### AC-631-02: Fill-in-the-blank auto-detects blanks

```gherkin
Given a question editor set to fill_in_the_blank
When the instructor types "The capital of ___ is ___ city" in the question text
Then 2 blank answer fields are automatically generated below the question text
And each blank field corresponds to one ___ placeholder
```

---

## AC-632: Question List Drag-and-Drop

### AC-632-01: Drag reorders questions

```gherkin
Given a quiz with questions ordered [Q1, Q2, Q3]
When Q3 is dragged and dropped above Q1 using @dnd-kit
Then the order becomes [Q3, Q1, Q2]
And the order field values are updated accordingly
And the form is marked as dirty
```

### AC-632-02: Add and delete questions

```gherkin
Given a quiz with 3 questions
When the instructor clicks "Add Question"
Then a new empty question editor is appended (question 4)
And the question count badge shows "4"

When the instructor clicks "Delete" on question 2 (which has content)
Then a confirmation dialog appears
When the instructor confirms deletion
Then the question is removed and remaining questions are reordered
```

### AC-632-03: Duplicate question

```gherkin
Given a quiz with question 1 of type multiple_choice with 3 options
When the instructor clicks "Duplicate" on question 1
Then a new question is appended with the same type, text, and options as question 1
And the new question has a unique order value
```

---

## AC-633: Quiz Form Auto-Save

### AC-633-01: Auto-save triggers on dirty state

```gherkin
Given the instructor is editing a quiz with unsaved changes
When 30 seconds pass since the last save
Then the quiz is auto-saved to the backend
And a "Saving..." indicator appears briefly, then changes to "Saved"
```

---

## AC-634: Quiz Publish Action

### AC-634-01: Publish requires at least one question

```gherkin
Given a quiz with 0 questions
When the instructor views the publish button
Then the button is disabled
And a tooltip reads "Add at least one question before publishing."
```

### AC-634-02: Publish confirmation dialog shown

```gherkin
Given a quiz with 3 questions
When the instructor clicks "Publish Quiz"
Then a confirmation dialog is shown: "Publishing makes the quiz available to students. Continue?"
When the instructor clicks "Confirm"
Then POST /api/v1/quiz/quizzes/:id/publish is called
And the status badge updates to "Published"
And a success toast is displayed
```

---

## AC-635: Quiz Edit Page

### AC-635-01: Edit page pre-populated with existing data

```gherkin
Given a quiz with title "Midterm", 5 questions, and timeLimitMinutes: 60
When the instructor navigates to /instructor/quizzes/{id}/edit
Then the form is pre-populated with the quiz title "Midterm"
And 5 question editors are rendered with existing question data
And the time limit toggle is ON with value 60
```

### AC-635-02: Warning for editing published quiz

```gherkin
Given a published quiz with student submissions
When the instructor saves edits
Then a warning dialog appears: "Editing a published quiz may affect students currently taking it. Save anyway?"
When the instructor confirms
Then PUT /api/v1/quiz/quizzes/:id is called with the updated data
```

---

## AC-636: Quiz Deletion

### AC-636-01: Delete with undo toast

```gherkin
Given the instructor clicks "Delete" on a draft quiz
When the instructor confirms the deletion dialog
Then DELETE /api/v1/quiz/quizzes/:id is called
And the quiz is removed from the TanStack Query cache
And a success toast with "Undo" button appears
And the undo button is available for 5 seconds
```

---

## AC-640: Material Selection

### AC-640-01: Materials grouped by course

```gherkin
Given the AI generation page for a quiz
And Course A has 3 materials and Course B has 2 materials
When the MaterialSelector renders
Then materials are listed under "Course A" and "Course B" group headers
And each material shows a preview snippet (first 100 chars)
```

### AC-640-02: Empty state links to material upload

```gherkin
Given no materials exist for any of the instructor's courses
When the MaterialSelector renders
Then an empty state message is shown
And a link to the materials upload page (SPEC-FE-004) is visible
```

---

## AC-641: Generation Configuration

### AC-641-01: Form validates generation options

```gherkin
Given the generation configuration form is displayed
When the instructor submits with 0 materials selected
Then validation fails with "At least one material is required"
And the API is not called

When the instructor selects 1 material, sets count to 10, difficulty to "medium", and at least 1 question type
Then the form validates successfully
```

---

## AC-642: AI Generation Request

### AC-642-01: Loading state shown during generation

```gherkin
Given the generation form is submitted with valid options
When POST /api/v1/quiz/ai-generate is in flight
Then a full-page loading indicator is displayed
And the message "Generating quiz questions with AI..." is visible
```

### AC-642-02: Client-side timeout after 60 seconds

```gherkin
Given the generation request has been sent
When 60 seconds pass with no response
Then the loading state is replaced with an error message "Generation timed out."
And a "Retry" button is visible
```

### AC-642-03: Generation failure returns to form

```gherkin
Given the generation request fails with a non-timeout error (e.g., 500)
When the error is handled
Then an error toast with the error message is displayed
And the instructor is returned to the generation form with previous settings preserved
```

---

## AC-643: Generated Question Review

### AC-643-01: Generated questions are editable

```gherkin
Given AI generation succeeds with 10 generated questions
When the GeneratedQuestionReview renders
Then 10 QuestionEditor components are rendered (pre-populated with AI content)
And each editor is fully editable (text, options, points, explanation)
And a delete button exists on each generated question
```

### AC-643-02: Accept All adds all questions to quiz

```gherkin
Given 10 generated questions are displayed
When the instructor clicks "Accept All"
Then all 10 questions are appended to the quiz's question list
And the instructor is navigated to the quiz edit page with the new questions visible
```

### AC-643-03: Accept Selected adds only checked questions

```gherkin
Given 10 generated questions are displayed
And the instructor checks questions 2, 5, and 8
When the instructor clicks "Accept Selected"
Then only questions 2, 5, and 8 are appended to the quiz
```

---

## AC-644: Generation History

### AC-644-01: Navigation away prompts confirmation

```gherkin
Given generated questions are displayed (not yet accepted)
When the instructor attempts to navigate away
Then a confirmation dialog appears: "Leaving this page will discard generated questions. Leave anyway?"
When the instructor clicks "Leave"
Then navigation proceeds and generated questions are discarded
```

---

## AC-645: Regeneration

### AC-645-01: Regeneration returns to pre-filled form

```gherkin
Given generated questions are displayed
When the instructor clicks "Regenerate"
Then the generation configuration form is shown
And the form is pre-filled with the previous settings (materials, count, difficulty, types)
```

---

## AC-650: Quiz Management Table

### AC-650-01: All columns render with correct data

```gherkin
Given the instructor has 3 quizzes (1 draft, 1 published, 1 closed)
When the QuizManageTable renders at /instructor/quizzes
Then 3 rows are displayed
And each row shows columns: Title, Course, Status badge, Questions count, Submissions count, Due Date, Actions
And action buttons (Edit, Manage Submissions, Duplicate, Delete) are visible per row
```

### AC-650-02: Column sorting works

```gherkin
Given the management table has 5 rows
When the instructor clicks the "Submissions" column header
Then rows are sorted by submission count (descending)
When clicked again
Then rows are sorted by submission count (ascending)
```

---

## AC-651: Submissions View

### AC-651-01: Submission list renders correctly

```gherkin
Given a quiz with 5 student submissions
When the instructor navigates to the submissions view
Then 5 rows are displayed showing: student name, avatar, submission time, score, percentage, pass/fail badge
And a "View Details" link is visible per row leading to /instructor/quizzes/{id}/submissions/{attemptId}
```

### AC-651-02: Submissions sortable by score and time

```gherkin
Given the submissions list has 5 entries
When the instructor sorts by score descending
Then the highest score appears first
When the instructor sorts by submission time
Then the most recent submission appears first
```

---

## AC-652: Quiz Status Toggle

### AC-652-01: Status transitions work correctly

```gherkin
Given a draft quiz in the management table
When the instructor clicks "Publish"
Then the publish confirmation flow executes (REQ-FE-634)
And the QuizStatusBadge optimistically updates to "Published"

Given a published quiz
When the instructor clicks "Close"
Then POST /api/v1/quiz/quizzes/:id/close is called
And the badge optimistically updates to "Closed"

Given a closed quiz
When the instructor clicks "Reopen"
Then POST /api/v1/quiz/quizzes/:id/publish is called
And the badge optimistically updates to "Published"
```

---

## AC-653: Quiz Duplication

### AC-653-01: Duplicate creates draft copy

```gherkin
Given the instructor clicks "Duplicate" on a quiz titled "Midterm"
When POST /api/v1/quiz/quizzes/:id/duplicate is called
Then a new quiz "Midterm (Copy)" appears in the list as "Draft"
And a success toast with a direct edit link is displayed
And the instructor quiz list cache is invalidated
```

---

## AC-654: Results CSV Export

### AC-654-01: CSV download is triggered

```gherkin
Given the instructor is viewing the submissions list with 5 student submissions
When the instructor clicks "Export CSV"
Then a file download is triggered in the browser
And the file is named quiz-{quizTitle}-results.csv
And the CSV contains a header row: Student Name, Score, Percentage, Submitted At
And the CSV contains 5 data rows matching the displayed submissions
And the CSV is generated client-side using Blob and URL.createObjectURL
```

---

## AC-655: Bulk Actions

### AC-655-01: Bulk delete with confirmation

```gherkin
Given the management table has 5 quizzes
And the instructor checks rows for quizzes 1, 3, and 5
When the instructor clicks "Delete Selected"
Then a confirmation dialog shows "Delete 3 quizzes?"
When the instructor confirms
Then DELETE is called for each selected quiz
And the 3 quizzes are removed from the list
```

---

## AC-660: Keyboard Navigation (Accessibility)

### AC-660-01: All interactive elements are keyboard-reachable

```gherkin
Given the quiz taking page
When the user tabs through all interactive elements
Then every button, input, radio, and textarea receives focus in logical order
And each focused element has a visible focus ring (:focus-visible style)
```

### AC-660-02: Submit dialog traps focus

```gherkin
Given the submit confirmation dialog is open
When the user presses Tab repeatedly
Then focus cycles only between the "Confirm Submit" and "Continue Quiz" buttons
And focus does not leave the dialog
```

---

## AC-661: ARIA Labeling

### AC-661-01: Timer has correct ARIA role

```gherkin
Given the quiz timer component is rendered with time remaining
When inspected by axe-core
Then the timer element has role="timer"
And aria-label="Time remaining"
```

### AC-661-02: Progress bar has ARIA progressbar role

```gherkin
Given 3 of 10 questions are answered
When the progress bar is rendered
Then the element has role="progressbar", aria-valuenow="3", aria-valuemin="0", aria-valuemax="10"
```

---

## AC-662: Color Contrast

### AC-662-01: All text meets WCAG AA contrast ratios

```gherkin
Given all quiz components are rendered
When color contrast is measured
Then normal text has minimum 4.5:1 contrast ratio
And large text (>= 18px or >= 14px bold) has minimum 3:1 contrast ratio
And UI components (buttons, badges, form controls) have minimum 3:1 contrast ratio
And this applies to: quiz status badges, timer color states (amber, red), correct/incorrect highlights, progress bar fill
```

---

## AC-663: Screen Reader Announcements

### AC-663-01: Question navigation announced

```gherkin
Given the student navigates from question 3 to question 4
When the QuestionDisplay updates
Then an aria-live="polite" region announces "Question 4 of 10"
```

### AC-663-02: Timer threshold changes announced

```gherkin
Given the timer reaches 120 seconds remaining
When the threshold is detected
Then an aria-live="assertive" region announces the time warning
And the same announcement occurs at 60 seconds and 0 seconds
```

---

## AC-670: Network Interruption

### AC-670-01: Offline banner appears when connection is lost

```gherkin
Given the student is actively taking a quiz
When the browser goes offline (navigator.onLine becomes false)
Then a banner "You are offline. Answers are saved locally." appears
And auto-save requests are queued for retry when connectivity restores
```

### AC-670-02: Submit button is disabled while offline

```gherkin
Given the student is offline
When the student views the "Submit Quiz" button
Then the button is visually disabled
And a tooltip reads "No internet connection."
And clicking the button has no effect
```

---

## AC-671: Session Expiry During Quiz

### AC-671-01: Session expiry dialog preserves state

```gherkin
Given the student is taking a quiz
When the authentication session expires
Then a dialog appears: "Your session has expired. Please log in again to continue."
And a "Log In" button opens the login page in a new tab
And the current quiz state is preserved in the Zustand store (via sessionStorage)
```

---

## AC-672: Concurrent Attempt Prevention

### AC-672-01: Second tab shows conflict message

```gherkin
Given the student is taking a quiz in Tab 1
When the student opens the same quiz in Tab 2
Then Tab 2 displays "You are already taking this quiz in another tab. Please continue there."
And no new attempt is created
```

---

## AC-673: Large Quiz Performance

### AC-673-01: 50+ questions use content-visibility optimization

```gherkin
Given a quiz with 60 questions
When the quiz taking page renders
Then the question navigator grid items use CSS content-visibility: auto
And only the current question body is rendered (not all 60 simultaneously)
And navigation between questions is responsive (no layout thrashing)
```

---

## AC-N600: Unwanted Behavior Verification

### AC-N600-01: No quiz taking on draft quizzes

```gherkin
Given a quiz with status "draft"
When a student navigates to /quizzes/{id}
Then the system redirects to /quizzes
And a toast notification "This quiz is not available." is displayed
And the quiz taking UI does not render
```

### AC-N600-02: No quiz taking on closed quizzes

```gherkin
Given a quiz with status "closed"
When a student navigates to /quizzes/{id}
Then the system redirects to /quizzes
And a toast notification "This quiz is not available." is displayed
```

### AC-N601-01: No duplicate submissions

```gherkin
Given a quiz submission is in progress (POST /api/v1/quiz/quizzes/:id/attempts/:attemptId/submit in flight)
When the student clicks "Submit Quiz" again
Then the mutation is NOT called a second time
And the submit button shows a loading state and is disabled
```

### AC-N602-01: No student access to instructor routes

```gherkin
Given an authenticated student user
When the student navigates to /instructor/quizzes
Then the RequireRole guard redirects to /quizzes
And no instructor management UI elements are present in the DOM
```

### AC-N603-01: No timer manipulation

```gherkin
Given a quiz with timeLimitMinutes: 30
When the quiz taking page renders
Then the timer state is NOT stored in localStorage or sessionStorage
And modifying remainingSeconds via browser DevTools does not affect the server timer
And the server's response determines the actual remaining time on submission
```

### AC-N604-01: No self-grading

```gherkin
Given a student viewing their quiz results at /quizzes/{id}/results
When the results page renders
Then no edit or modification controls are present for score or answers
And results data is read-only from the server
```

### AC-N605-01: No instructor quiz taking

```gherkin
Given an authenticated instructor user
When the instructor navigates to /quizzes/{id} (student quiz taking route)
Then the system does not render the quiz taking interface
And the instructor is redirected to the instructor management routes
```

### AC-N606-01: No answer modification after submission

```gherkin
Given a quiz attempt with status "submitted"
When the student navigates back to /quizzes/{id}
Then the quiz taking store is not re-initialized with the submitted answers
And the student is redirected to the results page
And answers are read-only in the results view
```

### AC-N607-01: No reckless deletion of published quiz with submissions

```gherkin
Given a published quiz with 15 student submissions
When the instructor clicks "Delete"
Then the confirmation dialog shows: "This quiz has 15 student submissions. Deleting it will remove all submission records. This action cannot be undone."
And the dialog requires explicit confirmation before proceeding
```

### AC-N608-01: No empty quiz publishing

```gherkin
Given a quiz with zero questions
When the instructor views the Publish button
Then the button is disabled
And a tooltip explains "Add at least one question before publishing."
And POST /api/v1/quiz/quizzes/:id/publish is NOT callable
```

---

## Responsive Acceptance Criteria

### AC-RESP-01: Mobile Quiz List (375px)

```gherkin
Given viewport width is 375px
When the quiz list page renders
Then quiz cards stack vertically (single column)
And filter controls collapse or stack appropriately
And no horizontal overflow occurs
```

### AC-RESP-02: Mobile Quiz Taking (375px)

```gherkin
Given viewport width is 375px
When the quiz taking page renders
Then the question navigator is a Sheet (bottom sheet, not sidebar)
And the timer and progress bar fit within the mobile header
And answer inputs are full-width and touch-friendly
And the submit button is easily accessible
```

### AC-RESP-03: Tablet Quiz Taking (768px)

```gherkin
Given viewport width is 768px
When the quiz taking page renders
Then all quiz content renders without horizontal overflow
And the question navigator may be a collapsible sidebar or overlay
And form inputs and buttons are appropriately sized
```

### AC-RESP-04: Desktop Quiz Taking (1280px)

```gherkin
Given viewport width is 1280px
When the quiz taking page renders
Then the question navigator is a fixed sidebar (240px width)
And the question display area occupies the remaining space
And all components render at full desktop fidelity
```

### AC-RESP-05: Mobile Quiz Creation (375px)

```gherkin
Given viewport width is 375px
When the quiz creation form renders
Then all form fields stack vertically
And drag-and-drop question reordering is accessible (touch-supported via @dnd-kit)
And the settings panel is usable without horizontal scrolling
```

### AC-RESP-06: Mobile Quiz Results (375px)

```gherkin
Given viewport width is 375px
When the quiz results page renders
Then the score summary card is full-width
And the SVG donut chart scales proportionally
And the question-by-question breakdown stacks vertically
```

---

## Integration Acceptance Criteria

### AC-INTEG-01: Existing Hooks Reused

```gherkin
Given the implementation is complete
When the hooks directory is inspected
Then apps/web/hooks/useBeforeUnload.ts is unchanged
And apps/web/hooks/useDebounce.ts is unchanged
And apps/web/hooks/useMediaQuery.ts is unchanged
And all new quiz hooks are in apps/web/hooks/quiz/ directory
And no quiz-specific hooks are created in the root hooks/ directory
```

### AC-INTEG-02: Existing Shared Types Referenced

```gherkin
Given the implementation is complete
When packages/shared/src/types/quiz.types.ts is inspected
Then it does NOT redefine ApiResponse or PaginatedResponse
And it imports or references types from api.types.ts where appropriate
```

### AC-INTEG-03: Existing Events Constants Used

```gherkin
Given the implementation is complete
When packages/shared/src/constants/events.ts is inspected
Then the existing EVENTS.QUIZ_STARTED, QUIZ_SUBMITTED, QUIZ_GRADED constants are unchanged
And no new quiz event constants are added by this SPEC
```

### AC-INTEG-04: API Endpoint Consistency

```gherkin
Given the implementation is complete
When all quiz API calls are inspected
Then every endpoint uses the /api/v1/quiz/ prefix
And apps/web/lib/api-endpoints.ts dashboard quiz endpoints remain unchanged
And apps/web/lib/api/quiz.api.ts uses the base API client from apps/web/lib/api.ts
```

---

## Test Coverage Targets

| Area | Target | Test File Location |
|------|--------|--------------------|
| `packages/shared/src/validators/quiz.schema.ts` | 95% | `packages/shared/src/validators/__tests__/quiz.schema.test.ts` |
| `apps/web/stores/quiz-taking.store.ts` | 90% | `apps/web/stores/__tests__/quiz-taking.store.test.ts` |
| `apps/web/hooks/quiz/useQuizTimer.ts` | 90% | `apps/web/hooks/quiz/__tests__/useQuizTimer.test.ts` |
| `apps/web/hooks/quiz/useQuizAutoSave.ts` | 85% | `apps/web/hooks/quiz/__tests__/useQuizAutoSave.test.ts` |
| `apps/web/hooks/quiz/useFocusDetection.ts` | 85% | `apps/web/hooks/quiz/__tests__/useFocusDetection.test.ts` |
| `apps/web/components/quiz/**` | 80% | `apps/web/components/quiz/**/__tests__/*.test.tsx` |
| `apps/web/lib/api/quiz.api.ts` | 85% | `apps/web/lib/api/__tests__/quiz.api.test.ts` |
| E2E (Playwright) | Critical paths | `apps/web/e2e/quiz-student-flow.spec.ts`, `apps/web/e2e/quiz-instructor-flow.spec.ts` |

---

## Definition of Done

A requirement is considered DONE when:

1. All acceptance criteria for that requirement pass.
2. Unit tests cover the core logic (happy path + minimum 2 edge cases).
3. Component renders without errors in dev server.
4. axe-core reports zero accessibility violations on the component.
5. No TypeScript errors (`pnpm tsc --noEmit` passes).
6. No ESLint errors or warnings introduced.
7. The component is responsive across Mobile (375px), Tablet (768px), and Desktop (1280px+).
8. All API calls use the `/api/v1/quiz/` prefix.
9. Existing hooks (`useBeforeUnload`, `useDebounce`, `useMediaQuery`) are reused, not recreated.
10. All new quiz hooks are in `apps/web/hooks/quiz/` directory.
