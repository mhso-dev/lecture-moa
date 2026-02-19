---
id: SPEC-FE-007
title: "Quiz System"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: high
tags: [frontend, nextjs, quiz, timer, ai-generation, instructor, student, react-hook-form, zod, tanstack-query]
related_specs: [SPEC-FE-001, SPEC-FE-002, SPEC-FE-004, SPEC-FE-005, SPEC-UI-001]
requirement_prefix: REQ-FE-6
---

# SPEC-FE-007: Quiz System

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

### 1.2 File Locations

```
apps/web/
  app/
    (dashboard)/
      quizzes/
        page.tsx                          # Quiz list page (student view)
        [id]/
          page.tsx                        # Quiz taking interface
          results/
            page.tsx                     # Quiz results page
      courses/
        [courseId]/
          quizzes/
            page.tsx                     # Course-specific quiz list
      instructor/
        quizzes/
          page.tsx                       # Quiz management (instructor)
          new/
            page.tsx                     # Quiz creation form
          [id]/
            edit/
              page.tsx                   # Edit quiz
            generate/
              page.tsx                   # AI quiz generation
  components/
    quiz/
      quiz-card.tsx                      # Quiz list item card
      quiz-list.tsx                      # Quiz list container
      quiz-filters.tsx                   # Filter bar (status, course)
      quiz-taking/
        quiz-taking-shell.tsx            # Quiz taking layout wrapper
        question-display.tsx             # Single question renderer
        question-navigator.tsx           # Question navigation sidebar/bar
        quiz-timer.tsx                   # Countdown timer component
        answer-input.tsx                 # Answer input variants (MCQ/TF/short/fill)
        quiz-submit-dialog.tsx           # Submit confirmation dialog
        quiz-progress-bar.tsx            # Progress bar (answered / total)
      quiz-results/
        results-summary.tsx              # Score summary card
        results-breakdown.tsx            # Question-by-question review
        results-chart.tsx                # Score visualization
      quiz-create/
        quiz-form.tsx                    # Quiz metadata form
        question-editor.tsx              # Individual question editor
        question-list.tsx                # Ordered question list with drag-and-drop
        question-type-selector.tsx       # Question type picker
        quiz-settings-panel.tsx          # Time limit, passing score, assignment
      quiz-generate/
        material-selector.tsx            # Source material picker
        generation-options.tsx           # Difficulty, count, type config
        generated-question-review.tsx    # Review / edit generated questions
      quiz-manage/
        quiz-manage-table.tsx            # Instructor quiz management table
        submission-list.tsx              # Student submission list
        quiz-status-badge.tsx            # Published / Draft / Closed badge
  hooks/
    use-quiz-timer.ts                    # Timer state hook
    use-quiz-answers.ts                  # Draft answer management hook
    use-quiz-submission.ts               # Submission orchestration hook
  stores/
    quiz-taking.store.ts                 # Quiz session state (answers, timer, page)
  lib/
    api/
      quiz.api.ts                        # Quiz API client functions

packages/shared/
  src/
    types/
      quiz.types.ts                      # Quiz, Question, Attempt, Answer types (enriched)
    validators/
      quiz.schema.ts                     # Zod schemas for quiz domain (enriched)
```

### 1.3 Design References

The following .pen design files define the UI patterns for this SPEC. Do NOT read these files; reference them for implementation guidance only:

| Design File | Description |
|-------------|-------------|
| `design/screens/quiz/quiz-list.pen` | Quiz list page (upcoming, completed, course filter) |
| `design/screens/quiz/quiz-taking.pen` | Quiz taking interface (timer, progress, question nav) |
| `design/screens/quiz/quiz-results.pen` | Results page (score summary, Q&A breakdown) |
| `design/screens/quiz/quiz-create.pen` | Quiz creation form (instructor, manual questions) |
| `design/screens/quiz/quiz-generate.pen` | AI quiz generation (material selection, config) |
| `design/screens/quiz/quiz-manage.pen` | Quiz management (instructor, submissions, publish) |

### 1.4 Responsive Grid

| Breakpoint | Width | Grid Columns | Quiz Layout Notes |
|------------|-------|--------------|-------------------|
| Mobile | 375px | 4 columns | Single-column question view, bottom progress bar |
| Tablet | 768px | 8 columns | Side navigator collapsed by default |
| Desktop | 1280px+ | 12 columns | Side navigator always visible |

---

## 2. Assumptions

### 2.1 Foundation Assumptions

- SPEC-FE-001 is complete and provides: design tokens, layout system, shadcn/ui components, Zustand setup, TanStack Query provider, API client base, and shared type conventions.
- SPEC-FE-002 is complete and provides: authentication context, `useAuth` hook, role guards (`RequireAuth`, `RequireRole`), and `session.user.role` accessible as `"student"` or `"instructor"`.
- SPEC-FE-005 is complete and provides: course context (`useCourse`), course-quiz association, and course enrollment data.
- SPEC-FE-004 is complete and provides: the list of available materials for AI quiz generation source selection.

### 2.2 API Contract Assumptions

- The Fastify backend exposes the following REST endpoints (not yet implemented):
  - `GET /api/quizzes` — list quizzes (student: enrolled courses; instructor: own quizzes)
  - `GET /api/quizzes/:id` — quiz detail with questions
  - `POST /api/quizzes` — create quiz
  - `PUT /api/quizzes/:id` — update quiz
  - `DELETE /api/quizzes/:id` — delete quiz
  - `POST /api/quizzes/:id/publish` — publish quiz
  - `POST /api/quizzes/:id/attempts` — start quiz attempt
  - `PUT /api/quizzes/:id/attempts/:attemptId` — save draft answers
  - `POST /api/quizzes/:id/attempts/:attemptId/submit` — submit quiz
  - `GET /api/quizzes/:id/attempts/:attemptId/results` — get results
  - `GET /api/quizzes/:id/submissions` — instructor: list all student submissions
  - `POST /api/ai/quiz-generate` — AI generation request (proxied to apps/ai)
- API responses follow the shared `ApiResponse<T>` wrapper type from SPEC-FE-001.
- Quiz attempt auto-save calls `PUT /api/quizzes/:id/attempts/:attemptId` with a debounce of 3 seconds.

### 2.3 Quiz Domain Assumptions

- **Question types**: `multiple_choice` (single answer), `true_false`, `short_answer`, `fill_in_the_blank`.
- **Attempt model**: one active attempt per student per quiz at a time; re-attempts allowed if instructor configures it.
- **Timer**: optional per quiz; when enabled, stored server-side; client-side timer is display-only for resilience.
- **Passing score**: optional threshold (0–100 integer); if not set, no pass/fail distinction shown.
- **AI generation**: the AI service returns a list of draft `GeneratedQuestion` objects; the instructor reviews and edits before saving.
- **Anti-cheat**: focus-loss detection and tab-switch warning are optional features (controlled by quiz settings).
- Quizzes have statuses: `draft`, `published`, `closed`.
- Student can only take `published` quizzes in courses they are enrolled in.

### 2.4 Scope Boundaries

- This SPEC covers frontend pages and components for the Quiz System only.
- Backend API implementation and database schema are out of scope.
- Real-time quiz submission notifications (WebSocket) are out of scope (future).
- Proctoring or advanced anti-cheat beyond basic focus detection is out of scope.
- Grading of `short_answer` and `fill_in_the_blank` by AI is out of scope (manual grading UI is not implemented; auto-score only for `multiple_choice` and `true_false`).
- Quiz import/export from external tools (e.g., LMS formats) is out of scope.

---

## 3. Requirements

### 3.1 Shared Types & Validators (REQ-FE-600 – REQ-FE-601)

#### REQ-FE-600: Quiz Domain Types

The system shall define and export the following TypeScript types from `packages/shared/src/types/quiz.types.ts`:

```typescript
// Question type discriminated union
type QuestionType = 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_in_the_blank';
type QuizStatus = 'draft' | 'published' | 'closed';
type AttemptStatus = 'in_progress' | 'submitted';

interface QuizListItem {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  status: QuizStatus;
  questionCount: number;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  dueDate: string | null;          // ISO 8601
  attemptCount: number;            // student: own attempts; instructor: total submissions
  myLastAttemptScore: number | null; // null if not yet attempted
  createdAt: string;
}

interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  courseId: string;
  courseName: string;
  status: QuizStatus;
  timeLimitMinutes: number | null;
  passingScore: number | null;
  allowReattempt: boolean;
  shuffleQuestions: boolean;
  showAnswersAfterSubmit: boolean;
  focusLossWarning: boolean;       // anti-cheat: warn on tab switch / focus loss
  dueDate: string | null;
  questions: Question[];
  createdAt: string;
  updatedAt: string;
}

type Question =
  | MultipleChoiceQuestion
  | TrueFalseQuestion
  | ShortAnswerQuestion
  | FillInBlankQuestion;

interface BaseQuestion {
  id: string;
  quizId: string;
  order: number;
  questionText: string;
  points: number;
  explanation: string | null;
}

interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: { id: string; text: string }[];
  correctOptionId: string;          // hidden from student during attempt
}

interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer: boolean;           // hidden from student during attempt
}

interface ShortAnswerQuestion extends BaseQuestion {
  type: 'short_answer';
  sampleAnswer: string | null;      // shown after submission
}

interface FillInBlankQuestion extends BaseQuestion {
  type: 'fill_in_the_blank';
  blanks: { id: string; answer: string }[]; // answers hidden during attempt
}

interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  status: AttemptStatus;
  answers: DraftAnswer[];
  startedAt: string;
  submittedAt: string | null;
  score: number | null;
  passed: boolean | null;
}

type DraftAnswer =
  | { questionId: string; type: 'multiple_choice'; selectedOptionId: string | null }
  | { questionId: string; type: 'true_false'; selectedAnswer: boolean | null }
  | { questionId: string; type: 'short_answer'; text: string }
  | { questionId: string; type: 'fill_in_the_blank'; filledAnswers: Record<string, string> };

interface QuizResult {
  attemptId: string;
  quizId: string;
  quizTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean | null;
  timeTaken: number;                // seconds
  questionResults: QuestionResult[];
}

interface QuestionResult {
  questionId: string;
  questionText: string;
  type: QuestionType;
  isCorrect: boolean | null;        // null for short_answer (manual grading)
  points: number;
  earnedPoints: number;
  studentAnswer: DraftAnswer;
  correctAnswer: unknown;           // revealed post-submission per showAnswersAfterSubmit
  explanation: string | null;
}

// Instructor types
interface GeneratedQuestion {
  tempId: string;                   // client-side only, not persisted
  type: QuestionType;
  questionText: string;
  options?: { id: string; text: string }[];
  correctOptionId?: string;
  correctAnswer?: boolean;
  sampleAnswer?: string;
  blanks?: { id: string; answer: string }[];
  explanation: string | null;
  points: number;
}

interface QuizSubmissionSummary {
  userId: string;
  userName: string;
  attemptId: string;
  score: number;
  percentage: number;
  passed: boolean | null;
  submittedAt: string;
}
```

#### REQ-FE-601: Quiz Zod Schemas

The system shall define and export Zod schemas from `packages/shared/src/validators/quiz.schema.ts` that correspond to the types in REQ-FE-600, used for:

- Client-side form validation in quiz creation and AI generation configuration
- API response parsing in TanStack Query fetchers

Required schemas:

- `CreateQuizSchema` — title (min 3, max 200), description (optional, max 1000), courseId (uuid), timeLimitMinutes (optional, 1–300 integer), passingScore (optional, 0–100 integer), allowReattempt (boolean), shuffleQuestions (boolean), showAnswersAfterSubmit (boolean), focusLossWarning (boolean), dueDate (optional ISO date string)
- `QuestionSchema` — discriminated union by `type` for all four question types; questionText (min 5, max 2000), points (1–100 integer), explanation (optional, max 2000)
- `MultipleChoiceOptionSchema` — text (min 1, max 500), non-empty options array (min 2, max 8 options)
- `GenerationOptionsSchema` — materialIds (min 1 uuid array), count (1–50 integer), difficulty (`easy | medium | hard`), questionTypes (non-empty array of QuestionType)
- `DraftAnswerSchema` — discriminated union matching DraftAnswer type

---

### 3.2 Quiz List Page (REQ-FE-602 – REQ-FE-607)

#### REQ-FE-602: Quiz List Data Fetching

The system shall fetch and display quiz lists using TanStack Query with the following query key structure:

- Student view: `['quizzes', { status, courseId }]`
- Instructor view: `['instructor', 'quizzes', { status, courseId }]`

**When** the quiz list page mounts, **then** the system shall fetch quizzes from `GET /api/quizzes` with query parameters `status` and `courseId`.

**When** the fetch is in progress, **then** the system shall display skeleton loading cards matching the `QuizCard` layout.

**If** the fetch fails, **then** the system shall display an error state with a retry button.

#### REQ-FE-603: Quiz List Filtering

The system shall provide filter controls for the quiz list:

- **Status filter**: `All`, `Upcoming` (published, not yet attempted or attempt in progress), `Completed` (submitted attempt exists), `Draft` (instructor only)
- **Course filter**: dropdown populated from enrolled courses (student) or own courses (instructor)

**When** a filter changes, **then** the system shall update the URL query parameters (`?status=upcoming&courseId=xxx`) and re-fetch with new parameters.

The system shall preserve filter state in URL query parameters to support page refresh and sharing.

#### REQ-FE-604: Quiz Card Display

The system shall render a `QuizCard` component for each quiz displaying:

- Quiz title
- Course name
- Question count and time limit (if set)
- Due date with relative time (e.g., "Due in 2 days") using `date-fns`
- Status badge (`Published`, `Draft`, `Closed`) for instructors
- Last attempt score badge for students (e.g., "85/100") or "Not attempted" label
- Action button: `Take Quiz` (student, published), `View Results` (student, completed), `Edit` (instructor), `Manage` (instructor)

**If** a quiz is past its due date and not submitted, **then** the system shall display the quiz card with a "Past due" indicator and disable the `Take Quiz` action.

#### REQ-FE-605: Empty State

**If** the filtered quiz list is empty, **then** the system shall display an empty state illustration with context-appropriate messaging:

- No quizzes at all: "No quizzes yet" with create button (instructor) or "No quizzes available" (student)
- Filtered result is empty: "No quizzes match your filters" with a clear-filters link

#### REQ-FE-606: Quiz List Pagination

The system shall support cursor-based pagination for the quiz list, displaying a "Load more" button when additional pages are available. The system shall use TanStack Query's `useInfiniteQuery` for pagination.

#### REQ-FE-607: Role-Based Quiz List Views

**If** the authenticated user role is `instructor`, **then** the system shall render the instructor quiz list at `/instructor/quizzes` showing own quizzes with management actions.

**If** the authenticated user role is `student`, **then** the system shall render the student quiz list at `/quizzes` showing enrolled course quizzes with take/view actions.

The system shall use the `RequireRole` guard from SPEC-FE-002 to enforce route-level access control.

---

### 3.3 Quiz Taking Interface (REQ-FE-610 – REQ-FE-619)

#### REQ-FE-610: Quiz Attempt Initialization

**When** a student navigates to `/quizzes/[id]`, **then** the system shall:

1. Fetch quiz detail from `GET /api/quizzes/:id`.
2. Check for an existing `in_progress` attempt.
3. **If** no in-progress attempt exists, **then** POST to `/api/quizzes/:id/attempts` to create a new attempt and store the `attemptId` in the quiz-taking Zustand store.
4. **If** an in-progress attempt exists, **then** resume it and restore saved draft answers into the store.
5. Initialize the timer state if `timeLimitMinutes` is set.

**If** the quiz status is not `published`, **then** the system shall redirect to the quiz list with a toast notification "This quiz is not available."

**If** the student has already submitted an attempt and `allowReattempt` is `false`, **then** the system shall redirect to the results page.

#### REQ-FE-611: Quiz Taking Store

The system shall implement a Zustand store (`quiz-taking.store.ts`) with the following state shape:

```typescript
interface QuizTakingState {
  quizId: string | null;
  attemptId: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  answers: Record<string, DraftAnswer>;      // keyed by questionId
  remainingSeconds: number | null;           // null if no timer
  timerStatus: 'idle' | 'running' | 'paused' | 'expired';
  focusLossCount: number;
  isDirty: boolean;                          // unsaved changes since last auto-save
  lastSavedAt: Date | null;
  // Actions
  setAnswer: (questionId: string, answer: DraftAnswer) => void;
  navigateToQuestion: (index: number) => void;
  markSaved: () => void;
  tickTimer: () => void;
  pauseTimer: () => void;
  resumeTimer: () => void;
  incrementFocusLoss: () => void;
  reset: () => void;
}
```

The store shall be initialized fresh for each quiz session and reset on component unmount.

#### REQ-FE-612: Question Display

The system shall render a `QuestionDisplay` component that adapts its input UI based on the question type:

| Question Type | Input UI |
|--------------|----------|
| `multiple_choice` | Radio group with labeled options (A, B, C, D…) |
| `true_false` | Two radio buttons labeled "True" and "False" |
| `short_answer` | Multi-line textarea (min 3 rows) |
| `fill_in_the_blank` | Inline text inputs replacing `___` placeholders in question text |

The question text shall support basic Markdown rendering (bold, italic, code, links) using a lightweight renderer.

**When** an answer is selected or typed, **then** the system shall update the store via `setAnswer` and set `isDirty: true`.

#### REQ-FE-613: Question Navigator

The system shall render a `QuestionNavigator` component displaying all question numbers as a grid of buttons:

- Answered question: filled accent color
- Unanswered question: outline style
- Current question: highlighted border
- Flagged question (future): flag icon overlay

**When** a question number button is clicked, **then** the system shall call `navigateToQuestion` and scroll the question display into view.

On Mobile (375px), the navigator shall be rendered as a collapsible bottom sheet. On Desktop (1280px+), it shall be rendered as a fixed sidebar (240px width).

#### REQ-FE-614: Quiz Timer

**While** `timeLimitMinutes` is set and `timerStatus` is `running`, **then** the system shall display a countdown timer with MM:SS format.

The timer shall tick once per second using a `setInterval` managed inside the `useQuizTimer` hook, calling `tickTimer` on each tick.

**When** remaining time reaches 120 seconds, **then** the system shall display the timer in amber color as a visual warning.

**When** remaining time reaches 60 seconds, **then** the system shall display the timer in red color and apply a subtle pulsing animation.

**When** remaining time reaches 0, **then** the system shall automatically trigger quiz submission (same flow as REQ-FE-617) with a "Time's up" notification.

The system shall use `document.visibilitychange` and `window.blur` events to detect potential timer gaming; these events shall trigger the focus-loss handler (REQ-FE-618) but shall NOT pause the server-authoritative timer.

#### REQ-FE-615: Progress Bar

The system shall display a progress bar showing `answeredCount / totalQuestions` as a fraction and percentage.

**When** the count of answered questions changes, **then** the system shall animate the progress bar width transition using CSS transitions (duration 300ms ease-in-out).

#### REQ-FE-616: Auto-Save Draft Answers

**While** the quiz attempt is `in_progress` and `isDirty` is `true`, **then** the system shall debounce auto-save calls to `PUT /api/quizzes/:id/attempts/:attemptId` with the current `answers` state.

The debounce delay shall be 3000ms. The system shall reset `isDirty` to `false` and update `lastSavedAt` on successful save.

**If** the auto-save request fails, **then** the system shall display a non-blocking toast warning "Changes not saved. Will retry shortly." and retry after 5 seconds.

The system shall trigger a final forced save immediately before navigation away from the quiz page (via `beforeunload` and route change guard).

#### REQ-FE-617: Quiz Submission

**When** the student clicks "Submit Quiz", **then** the system shall display a `QuizSubmitDialog` confirmation that shows:

- Total questions answered vs total questions
- Warning if any questions are unanswered (with count)
- "Confirm Submit" and "Continue Quiz" buttons

**When** the student confirms submission, **then** the system shall:

1. Trigger a final forced save of current answers.
2. POST to `/api/quizzes/:id/attempts/:attemptId/submit`.
3. On success, navigate to the results page at `/quizzes/[id]/results?attemptId=[attemptId]`.
4. Reset the quiz-taking store.

**If** the submission request fails, **then** the system shall display an error toast and keep the student on the quiz page.

#### REQ-FE-618: Anti-Cheat Focus Detection

**Where** `focusLossWarning` is `true` on the quiz, **then** the system shall:

- Listen to `document.visibilitychange` (tab switch) and `window.blur` (window focus loss) events.
- **When** focus is lost, **then** the system shall increment `focusLossCount` in the store and display a modal warning: "Focus loss detected. This event has been recorded."
- The warning modal shall have a single "Continue Quiz" dismiss button.
- The focus loss count shall be included in the auto-save payload for server recording.

**If** `focusLossWarning` is `false`, **then** the system shall NOT attach focus-detection event listeners.

#### REQ-FE-619: Keyboard Navigation

The system shall support the following keyboard shortcuts during quiz taking:

| Key | Action |
|-----|--------|
| `←` / `→` Arrow keys | Navigate to previous / next question |
| `1`–`9` | Select option A–I for multiple choice (when focused on question) |
| `T` | Select True for true/false |
| `F` | Select False for true/false |
| `Escape` | Close any open dialog (submit confirmation, focus warning) |

---

### 3.4 Quiz Results Page (REQ-FE-620 – REQ-FE-624)

#### REQ-FE-620: Results Data Fetching

**When** the results page mounts with `?attemptId=xxx`, **then** the system shall fetch quiz results from `GET /api/quizzes/:id/attempts/:attemptId/results`.

**While** the fetch is in progress, **then** the system shall display a `ResultsSummarySkeleton` loading state.

**If** the `attemptId` does not belong to the authenticated user, **then** the system shall redirect to the quiz list with a 403 error toast.

#### REQ-FE-621: Results Summary Card

The system shall render a `ResultsSummary` component displaying:

- Quiz title and course name
- Score: `X / Y points` and percentage with large typography
- Pass/Fail badge (only when `passingScore` is configured): green "Passed" or red "Failed"
- Time taken (formatted as MM:SS or H:MM:SS)
- Number of correct / incorrect / unanswered questions
- "Retake Quiz" button (visible only if `allowReattempt` is `true` and quiz is still `published`)
- "Back to Quizzes" link

#### REQ-FE-622: Question-by-Question Review

**Where** `showAnswersAfterSubmit` is `true`, **then** the system shall render a `ResultsBreakdown` list of all questions showing:

- Question number, text, and type
- Student's answer (highlighted)
- Correct answer (green highlight)
- Correct/Incorrect indicator icon
- Points earned vs possible (e.g., "5 / 10 pts")
- Explanation text (if provided)

**Where** `showAnswersAfterSubmit` is `false`, **then** the system shall display only the question text and whether the answer was correct or not, without revealing the correct answer.

**For** `short_answer` questions, the system shall display "Pending manual grading" instead of a correct/incorrect indicator.

#### REQ-FE-623: Results Score Chart

The system shall render a `ResultsChart` component using a donut chart (SVG-based, no external charting library) showing:

- Correct answers (accent/green segment)
- Incorrect answers (red/destructive segment)
- Unanswered (neutral/muted segment)

The chart shall be decorative (aria-hidden) with a screen-reader-accessible text alternative.

#### REQ-FE-624: Results Sharing (Instructor View)

**If** the authenticated user role is `instructor` and accesses a student's results via `/instructor/quizzes/[id]/submissions/[attemptId]`, **then** the system shall render the same results breakdown with an additional panel showing:

- Student name and submission timestamp
- Navigation to previous/next student submission

---

### 3.5 Quiz Creation Form (REQ-FE-630 – REQ-FE-636)

#### REQ-FE-630: Quiz Metadata Form

The system shall render a quiz creation/edit form for instructors using React Hook Form with `CreateQuizSchema` (REQ-FE-601) for validation.

Form fields:

| Field | Component | Validation |
|-------|-----------|-----------|
| Title | TextInput | Required, 3–200 chars |
| Description | Textarea | Optional, max 1000 chars |
| Course assignment | Select (searchable) | Required, courseId uuid |
| Time limit | NumberInput with "minutes" suffix + toggle | Optional, 1–300 |
| Passing score | NumberInput with "%" suffix + toggle | Optional, 0–100 |
| Allow reattempt | Toggle switch | Boolean |
| Shuffle questions | Toggle switch | Boolean |
| Show answers after submit | Toggle switch | Boolean |
| Focus loss warning | Toggle switch | Boolean |
| Due date | DatePicker | Optional, future date |

**When** the form is submitted with valid data and no questions exist, **then** the system shall save as `draft` and navigate to the question editing section.

#### REQ-FE-631: Question Editor

The system shall render a `QuestionEditor` component for each question with:

- `QuestionTypeSelector`: segmented control for selecting question type
- Shared fields: question text (rich textarea with Markdown preview toggle), points, explanation (optional)
- Type-specific fields:
  - `multiple_choice`: option list with add/remove buttons, radio group to select correct option
  - `true_false`: radio group for correct answer (True / False)
  - `short_answer`: sample answer textarea (shown to students after submit)
  - `fill_in_the_blank`: question text with `___` syntax highlighted; blanks auto-detected and answer fields generated

**When** question type changes, **then** the system shall clear type-specific answer fields and display the appropriate input UI.

#### REQ-FE-632: Question List Management

The system shall render a `QuestionList` component showing all questions in order with:

- Drag-and-drop reordering using the HTML5 Drag and Drop API (or `@dnd-kit/core`)
- Add new question button (appends to end)
- Duplicate question action
- Delete question action (with confirmation for non-empty questions)
- Question count badge

**When** question order changes via drag-and-drop, **then** the system shall update the `order` field of affected questions and mark the form as dirty.

#### REQ-FE-633: Quiz Form Auto-Save

**While** the instructor is editing a quiz, **then** the system shall auto-save the draft to the backend every 30 seconds if there are unsaved changes, displaying a subtle "Saving…" / "Saved" status indicator in the form header.

#### REQ-FE-634: Quiz Publish Action

The system shall provide a "Publish Quiz" button in the quiz form/management page.

**When** the instructor clicks "Publish Quiz", **then** the system shall:

1. Validate that at least one question exists.
2. Show a confirmation dialog: "Publishing makes the quiz available to students. Continue?"
3. On confirm, POST to `/api/quizzes/:id/publish`.
4. Update the quiz status badge to `Published` and show a success toast.

**If** the quiz has no questions, **then** the system shall disable the Publish button and display a tooltip: "Add at least one question before publishing."

#### REQ-FE-635: Quiz Edit Page

The system shall render the quiz edit page at `/instructor/quizzes/[id]/edit` pre-populated with existing quiz data using TanStack Query's `initialData` or `placeholderData` from the quiz list cache.

**When** the instructor saves edits to a `published` quiz, **then** the system shall display a warning: "Editing a published quiz may affect students currently taking it. Save anyway?" before submitting the update.

#### REQ-FE-636: Quiz Deletion

The system shall provide a delete action accessible from the quiz management table.

**When** the instructor confirms deletion of a quiz, **then** the system shall DELETE `/api/quizzes/:id`, remove the quiz from the TanStack Query cache, and display a success toast with an undo option (5-second window before the deletion is irreversible, using `useTimeout`).

---

### 3.6 AI Quiz Generation (REQ-FE-640 – REQ-FE-645)

#### REQ-FE-640: Material Selection

The system shall render a `MaterialSelector` component on the AI generation page (`/instructor/quizzes/new/generate` or accessible from quiz edit) showing:

- List of available materials from the instructor's courses (fetched from SPEC-FE-004 cache)
- Multi-select checkboxes for source material selection
- Material preview snippet (first 100 chars of content)
- Course grouping headers

**If** no materials are available, **then** the system shall display an empty state with a link to upload materials (SPEC-FE-004).

#### REQ-FE-641: Generation Configuration

The system shall render a `GenerationOptions` form with `GenerationOptionsSchema` validation:

| Field | Component | Validation |
|-------|-----------|-----------|
| Selected materials | (from REQ-FE-640) | Min 1 required |
| Question count | NumberInput | 1–50, default 10 |
| Difficulty | Segmented control | easy / medium / hard |
| Question types | Multi-checkbox | At least 1 type |

#### REQ-FE-642: AI Generation Request

**When** the instructor submits the generation form, **then** the system shall:

1. Show a full-page loading state with spinner and message "Generating quiz questions with AI…"
2. POST to `/api/ai/quiz-generate` with the configuration payload.
3. Set a 60-second client-side timeout; **if** no response within 60 seconds, **then** display a timeout error with a retry button.

**If** the generation request fails (non-timeout error), **then** the system shall display an error toast with the error message and return the instructor to the generation form.

#### REQ-FE-643: Generated Question Review

**When** AI generation succeeds, **then** the system shall render a `GeneratedQuestionReview` list displaying all `GeneratedQuestion` items with:

- Full `QuestionEditor` UI for each question (pre-populated with AI content, editable)
- Delete individual generated question button
- "Accept All" button to add all questions to the quiz
- "Accept Selected" button with checkboxes per question

**When** the instructor accepts questions, **then** the system shall append the accepted `GeneratedQuestion` items to the quiz's question list (converting `tempId` to server-assigned IDs on save).

#### REQ-FE-644: Generation History

The system shall retain the current generation session result in component state during the review. If the instructor navigates away before accepting, the system shall prompt a confirmation: "Leaving this page will discard generated questions. Leave anyway?"

#### REQ-FE-645: Regeneration

The system shall provide a "Regenerate" button on the review page that returns the instructor to the generation configuration form (pre-filled with previous settings) to adjust parameters and generate again.

---

### 3.7 Quiz Management Page (REQ-FE-650 – REQ-FE-655)

#### REQ-FE-650: Quiz Management Table

The system shall render a `QuizManageTable` for instructors at `/instructor/quizzes` displaying columns:

| Column | Description |
|--------|-------------|
| Title | Clickable, links to edit page |
| Course | Course name |
| Status | `QuizStatusBadge` (Draft / Published / Closed) |
| Questions | Count |
| Submissions | Count of student submissions |
| Due Date | Formatted, "No due date" if null |
| Actions | Edit, Manage Submissions, Duplicate, Delete |

The table shall support column sorting (client-side for current page) by Title, Status, Submissions, Due Date.

#### REQ-FE-651: Submissions View

The system shall render a `SubmissionList` for a specific quiz at accessible via the "Manage Submissions" action, displaying:

- Student name and avatar
- Submission time
- Score and percentage
- Pass/Fail badge (if passing score is set)
- "View Details" link to the instructor results view (REQ-FE-624)

The submissions list shall support sorting by score (desc/asc) and submission time.

#### REQ-FE-652: Quiz Status Toggle

The system shall provide inline status change actions in the management table:

- `Draft` → "Publish" button (same flow as REQ-FE-634)
- `Published` → "Close" button (POST to `/api/quizzes/:id/close`)
- `Closed` → "Reopen" button (POST to `/api/quizzes/:id/publish` again)

**When** a status change is confirmed, **then** the system shall optimistically update the `QuizStatusBadge` in the table and invalidate the quiz list cache.

#### REQ-FE-653: Quiz Duplication

**When** the instructor clicks "Duplicate" in the management table, **then** the system shall POST to `/api/quizzes/:id/duplicate`, add the duplicated quiz to the list cache (as `draft` with "(Copy)" appended to the title), and display a success toast with a direct edit link.

#### REQ-FE-654: Results Export

The system shall provide an "Export CSV" button on the submissions view that downloads a CSV file containing student names, scores, percentages, and submission timestamps.

The CSV export shall be generated client-side from the fetched submission data using a `Blob` and `URL.createObjectURL` approach (no server-side CSV generation required).

#### REQ-FE-655: Bulk Actions

The system shall support bulk quiz deletion from the management table via row checkboxes and a "Delete Selected" action with a confirmation dialog showing the count of quizzes to be deleted.

---

### 3.8 Accessibility & WCAG Compliance (REQ-FE-660 – REQ-FE-663)

#### REQ-FE-660: Keyboard Navigation

The system shall ensure all quiz-related interactive elements are reachable and operable by keyboard alone:

- All buttons, inputs, selects, and checkboxes shall have visible focus rings (`:focus-visible` styles).
- The question navigator buttons shall be in logical tab order.
- The quiz submit dialog shall trap focus within the dialog when open.

#### REQ-FE-661: ARIA Labeling

The system shall apply appropriate ARIA attributes:

- `QuizTimer`: `role="timer"`, `aria-label="Time remaining"`, `aria-live="off"` (announce only on threshold changes)
- `QuizProgressBar`: `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`
- `QuestionNavigator` buttons: `aria-label="Question N, answered/unanswered"`
- Answer radio/checkbox groups: `role="radiogroup"` or `role="group"` with `aria-labelledby` pointing to question text

#### REQ-FE-662: Color Contrast

All text and interactive elements shall meet WCAG 2.1 AA minimum contrast ratios (4.5:1 for normal text, 3:1 for large text and UI components). This applies to:

- Quiz status badges
- Timer color states (amber, red)
- Correct/incorrect answer highlights in results
- Progress bar fill

#### REQ-FE-663: Screen Reader Announcements

**When** the student navigates between questions, **then** the system shall announce the new question number and total via an `aria-live="polite"` region.

**When** the timer threshold changes (120s, 60s, 0s), **then** the system shall announce the time warning via an `aria-live="assertive"` region.

---

### 3.9 Error Handling & Edge Cases (REQ-FE-670 – REQ-FE-673)

#### REQ-FE-670: Network Interruption During Quiz

**While** the student is taking a quiz and a network interruption occurs, **then** the system shall:

- Display a non-blocking banner: "You are offline. Answers are saved locally."
- Queue auto-save requests and retry when connectivity is restored.
- Prevent submission while offline and display a disabled "Submit" button with tooltip "No internet connection."

#### REQ-FE-671: Session Expiry During Quiz

**If** the authentication session expires while the student is taking a quiz, **then** the system shall display a dialog: "Your session has expired. Please log in again to continue." with a "Log In" button that opens the login page in a new tab, preserving the current quiz state in the Zustand store (persisted via sessionStorage).

#### REQ-FE-672: Concurrent Attempt Prevention

**If** the student attempts to open the same quiz in a second browser tab, **then** the system shall detect the conflict via the existing attempt ID in the backend response and display: "You are already taking this quiz in another tab. Please continue there."

#### REQ-FE-673: Large Quiz Performance

**If** a quiz has more than 50 questions, **then** the system shall virtualize the question navigator grid using CSS `content-visibility: auto` to prevent layout thrashing. The question display area shall render only the current question (not all questions simultaneously).

---

## 4. Specifications

### 4.1 Quiz Taking Store Implementation

The `quiz-taking.store.ts` Zustand store shall be implemented with the following patterns:

- Uses `immer` middleware for nested state mutations (answer map updates).
- `answers` map is keyed by `questionId` for O(1) lookup.
- Timer tick is implemented via `setInterval(store.getState().tickTimer, 1000)` managed in the `useQuizTimer` hook, NOT inside the store itself.
- Store is reset (via `reset()` action) in the quiz page component's `useEffect` cleanup.
- Auto-save `isDirty` flag is set by `setAnswer` and cleared by `markSaved`.

### 4.2 API Client Functions

`apps/web/lib/api/quiz.api.ts` shall export the following typed functions using the base API client from SPEC-FE-001:

```typescript
// Student
fetchQuizList(params: { status?: QuizStatus; courseId?: string; cursor?: string }): Promise<PaginatedResponse<QuizListItem>>
fetchQuizDetail(quizId: string): Promise<QuizDetail>
startQuizAttempt(quizId: string): Promise<QuizAttempt>
saveDraftAnswers(quizId: string, attemptId: string, answers: DraftAnswer[]): Promise<void>
submitQuizAttempt(quizId: string, attemptId: string): Promise<QuizResult>
fetchQuizResult(quizId: string, attemptId: string): Promise<QuizResult>

// Instructor
fetchInstructorQuizzes(params: { status?: QuizStatus; courseId?: string; cursor?: string }): Promise<PaginatedResponse<QuizListItem>>
createQuiz(data: CreateQuizInput): Promise<QuizDetail>
updateQuiz(quizId: string, data: Partial<CreateQuizInput>): Promise<QuizDetail>
deleteQuiz(quizId: string): Promise<void>
publishQuiz(quizId: string): Promise<void>
closeQuiz(quizId: string): Promise<void>
duplicateQuiz(quizId: string): Promise<QuizDetail>
fetchSubmissions(quizId: string): Promise<QuizSubmissionSummary[]>
generateQuizWithAI(options: GenerationOptions): Promise<GeneratedQuestion[]>
```

### 4.3 Route Structure

```
app/(dashboard)/
  quizzes/
    page.tsx                  # Student: Quiz list (REQ-FE-602 to REQ-FE-607)
    [id]/
      page.tsx                # Student: Quiz taking (REQ-FE-610 to REQ-FE-619)
      results/
        page.tsx              # Student: Quiz results (REQ-FE-620 to REQ-FE-623)
  courses/
    [courseId]/
      quizzes/
        page.tsx              # Student: Course-filtered quiz list
  instructor/
    quizzes/
      page.tsx                # Instructor: Quiz management (REQ-FE-650 to REQ-FE-655)
      new/
        page.tsx              # Instructor: New quiz form (REQ-FE-630 to REQ-FE-636)
      [id]/
        edit/
          page.tsx            # Instructor: Edit quiz (REQ-FE-635)
        generate/
          page.tsx            # Instructor: AI generation (REQ-FE-640 to REQ-FE-645)
        submissions/
          page.tsx            # Instructor: Submission list (REQ-FE-651)
          [attemptId]/
            page.tsx          # Instructor: Student result detail (REQ-FE-624)
```

### 4.4 TanStack Query Key Conventions

```typescript
// Student
['quizzes']                                 // quiz list (all)
['quizzes', { status, courseId }]           // quiz list (filtered)
['quizzes', quizId]                         // quiz detail
['quizzes', quizId, 'result', attemptId]    // quiz result

// Instructor
['instructor', 'quizzes']                   // instructor quiz list
['instructor', 'quizzes', quizId]           // instructor quiz detail
['instructor', 'quizzes', quizId, 'submissions'] // submissions list
```

### 4.5 Component Architecture Decisions

- `QuizTakingShell` is a Client Component (`'use client'`) wrapping all quiz-taking sub-components; the quiz detail fetch happens in the parent Server Component.
- `QuestionDisplay` is a Client Component that reads from the Zustand store via `useQuizAnswers` hook.
- `QuizTimer` is a Client Component with its own `useQuizTimer` hook managing the `setInterval`.
- `ResultsBreakdown` is a Server Component (no interactivity needed, renders static result data).
- `QuizForm` and `QuestionEditor` are Client Components due to React Hook Form usage.
- `MaterialSelector` is a Client Component that reads from the existing materials cache.

---

## 5. Traceability Matrix

| Requirement ID | Title | Design Reference | Depends On | Acceptance Criteria |
|---------------|-------|-----------------|-----------|---------------------|
| REQ-FE-600 | Quiz Domain Types | — | SPEC-FE-001 types | All TypeScript interfaces compile without errors; discriminated unions are exhaustive |
| REQ-FE-601 | Quiz Zod Schemas | — | REQ-FE-600 | All schemas validate valid data; reject invalid data per constraints |
| REQ-FE-602 | Quiz List Data Fetching | quiz-list.pen | SPEC-FE-001 API client | Skeleton renders during fetch; error state has retry button |
| REQ-FE-603 | Quiz List Filtering | quiz-list.pen | REQ-FE-602 | URL params update on filter change; page refresh preserves filter |
| REQ-FE-604 | Quiz Card Display | quiz-list.pen | REQ-FE-602, REQ-FE-600 | All card fields render correctly per role; past-due card is disabled |
| REQ-FE-605 | Empty State | quiz-list.pen | REQ-FE-602 | Correct empty state per filter context |
| REQ-FE-606 | Quiz List Pagination | quiz-list.pen | REQ-FE-602 | Load more button appears; infinite scroll loads next page |
| REQ-FE-607 | Role-Based Quiz List Views | quiz-list.pen | SPEC-FE-002 auth | Instructor sees management view; student sees take/view view |
| REQ-FE-610 | Quiz Attempt Initialization | quiz-taking.pen | REQ-FE-600, SPEC-FE-002 | New attempt created; existing attempt resumed with saved answers |
| REQ-FE-611 | Quiz Taking Store | — | — | Store state shape matches spec; reset on unmount |
| REQ-FE-612 | Question Display | quiz-taking.pen | REQ-FE-611 | All 4 question type UIs render; answer updates stored in Zustand |
| REQ-FE-613 | Question Navigator | quiz-taking.pen | REQ-FE-611 | Answered/unanswered states visible; click navigates to question; mobile bottom sheet |
| REQ-FE-614 | Quiz Timer | quiz-taking.pen | REQ-FE-611 | Timer counts down; color changes at 120s and 60s; auto-submit at 0s |
| REQ-FE-615 | Progress Bar | quiz-taking.pen | REQ-FE-611 | Bar width animates on answer change; fraction shown |
| REQ-FE-616 | Auto-Save Draft Answers | — | REQ-FE-611 | Auto-save triggers after 3s debounce; retry on failure |
| REQ-FE-617 | Quiz Submission | quiz-taking.pen | REQ-FE-611, REQ-FE-616 | Submit dialog shows unanswered count; POST on confirm; navigate to results |
| REQ-FE-618 | Anti-Cheat Focus Detection | quiz-taking.pen | REQ-FE-611 | Focus loss increments counter and shows modal when enabled; no listeners when disabled |
| REQ-FE-619 | Keyboard Navigation | — | REQ-FE-612, REQ-FE-613 | Arrow keys navigate; number keys select MCQ options; Escape closes dialogs |
| REQ-FE-620 | Results Data Fetching | quiz-results.pen | REQ-FE-617, SPEC-FE-002 | Skeleton shown during fetch; 403 redirects to list |
| REQ-FE-621 | Results Summary Card | quiz-results.pen | REQ-FE-620 | Score, percentage, time taken, pass/fail badge render correctly |
| REQ-FE-622 | Question-by-Question Review | quiz-results.pen | REQ-FE-620 | Correct answers revealed per showAnswersAfterSubmit; short_answer shows pending label |
| REQ-FE-623 | Results Score Chart | quiz-results.pen | REQ-FE-620 | SVG donut chart renders with correct segments; aria-hidden with text alternative |
| REQ-FE-624 | Results Sharing (Instructor) | quiz-results.pen | REQ-FE-620, SPEC-FE-002 | Instructor view adds student info and prev/next navigation |
| REQ-FE-630 | Quiz Metadata Form | quiz-create.pen | SPEC-FE-001, REQ-FE-601 | All form fields validate per schema; form submits and saves as draft |
| REQ-FE-631 | Question Editor | quiz-create.pen | REQ-FE-601 | All 4 question types render correct input UIs; type change clears previous answers |
| REQ-FE-632 | Question List Management | quiz-create.pen | REQ-FE-631 | Drag-and-drop reorders questions; add/duplicate/delete actions work |
| REQ-FE-633 | Quiz Form Auto-Save | — | REQ-FE-630 | Auto-save triggers every 30s with unsaved changes; status indicator visible |
| REQ-FE-634 | Quiz Publish Action | quiz-manage.pen | REQ-FE-630 | Requires at least 1 question; confirmation dialog shown; status updates to published |
| REQ-FE-635 | Quiz Edit Page | quiz-create.pen | REQ-FE-630 | Pre-populated with existing data; warning shown before saving published quiz |
| REQ-FE-636 | Quiz Deletion | quiz-manage.pen | REQ-FE-650 | Confirmation dialog; cache updated; success toast with 5s undo |
| REQ-FE-640 | Material Selection | quiz-generate.pen | SPEC-FE-004 | Materials listed by course; multi-select works; empty state links to upload |
| REQ-FE-641 | Generation Configuration | quiz-generate.pen | REQ-FE-601 | Form validates per GenerationOptionsSchema |
| REQ-FE-642 | AI Generation Request | quiz-generate.pen | REQ-FE-641 | Loading state shown; 60s timeout with retry; error returns to form |
| REQ-FE-643 | Generated Question Review | quiz-generate.pen | REQ-FE-642 | All generated questions shown in editable editors; accept all/selected works |
| REQ-FE-644 | Generation History | quiz-generate.pen | REQ-FE-643 | Navigation away prompts confirmation when questions not accepted |
| REQ-FE-645 | Regeneration | quiz-generate.pen | REQ-FE-641 | Regenerate button returns to form with previous settings |
| REQ-FE-650 | Quiz Management Table | quiz-manage.pen | SPEC-FE-002, REQ-FE-600 | All columns render; sorting works; action buttons trigger correct flows |
| REQ-FE-651 | Submissions View | quiz-manage.pen | REQ-FE-650 | Submission list renders with score/pass data; sort works |
| REQ-FE-652 | Quiz Status Toggle | quiz-manage.pen | REQ-FE-650 | Status change buttons appear per current status; optimistic update applied |
| REQ-FE-653 | Quiz Duplication | quiz-manage.pen | REQ-FE-650 | Duplicated quiz appears as draft with "(Copy)" suffix; cache updated |
| REQ-FE-654 | Results Export | quiz-manage.pen | REQ-FE-651 | CSV download triggered; file contains correct columns and data |
| REQ-FE-655 | Bulk Actions | quiz-manage.pen | REQ-FE-650 | Row checkboxes work; bulk delete shows count; confirmation required |
| REQ-FE-660 | Keyboard Navigation (A11y) | — | All interactive components | All elements keyboard-reachable; focus trapped in dialogs |
| REQ-FE-661 | ARIA Labeling | — | REQ-FE-612 to REQ-FE-615 | ARIA attributes verified by axe-core in tests |
| REQ-FE-662 | Color Contrast | — | All visual components | All text meets 4.5:1; UI components meet 3:1 |
| REQ-FE-663 | Screen Reader Announcements | — | REQ-FE-613, REQ-FE-614 | aria-live regions announce navigation and timer warnings |
| REQ-FE-670 | Network Interruption | — | REQ-FE-616, REQ-FE-617 | Offline banner; queued saves retry on reconnect; submit disabled offline |
| REQ-FE-671 | Session Expiry | — | SPEC-FE-002, REQ-FE-611 | Session expiry dialog preserves quiz state in sessionStorage |
| REQ-FE-672 | Concurrent Attempt Prevention | — | REQ-FE-610 | Second-tab detection shows informational message |
| REQ-FE-673 | Large Quiz Performance | — | REQ-FE-612, REQ-FE-613 | 50+ question navigator uses content-visibility; only current question renders |
