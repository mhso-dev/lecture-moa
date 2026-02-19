---
id: SPEC-FE-006
title: "Q&A System - Acceptance Criteria"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-006: Q&A System — Acceptance Criteria

## Quality Gate Criteria

- Unit test coverage: >= 85% for all hooks, store, and utility functions
- TypeScript: zero type errors (strict mode)
- ESLint: zero errors
- WCAG 2.1 AA: axe-core passes with zero violations
- Responsive: verified at 375px, 768px, 1280px
- Role-based correctness: verified for STUDENT and INSTRUCTOR roles

---

## AC-500: Q&A Type Definitions

### AC-500-01: Core Types Compilation

```gherkin
Given packages/shared/src/types/qa.types.ts is updated with Q&A types
When TypeScript compiler runs on packages/shared
Then compilation succeeds with zero errors
And QAQuestion, QAAnswer, QAListItem, QAStatus, QAAuthorInfo, QAListFilter types are exported
And qa.types.ts imports UserRole from auth.types.ts without circular dependency
```

### AC-500-02: Zod Schema Validation

```gherkin
Given CreateQuestionSchema is defined in qa.schema.ts
When a valid question payload is parsed (title >= 10 chars, content >= 20 chars, context.selectedText non-empty)
Then safeParse returns success: true

Given CreateQuestionSchema is defined
When title has fewer than 10 characters
Then safeParse returns success: false with error on the title field

Given CreateAnswerSchema is defined
When content has fewer than 10 characters
Then safeParse returns success: false with error on the content field
```

### AC-500-03: WebSocket Event Constants

```gherkin
Given events.ts is updated with QA_EVENTS constants
When QA_EVENTS.NEW_ANSWER, QA_EVENTS.AI_SUGGESTION_READY, QA_EVENTS.QUESTION_RESOLVED are accessed
Then each returns a unique string constant
And no existing event constant is overwritten
```

---

## AC-501: Zustand Q&A Store

### AC-501-01: Popup State Management

```gherkin
Given the qa.store is initialized with inlinePopup.isOpen = false
When openInlinePopup(anchorRect, context) is called
Then inlinePopup.isOpen becomes true
And inlinePopup.anchorRect equals the provided DOMRect
And inlinePopup.context.selectedText equals the provided context

Given inlinePopup.isOpen is true
When closeInlinePopup() is called
Then inlinePopup.isOpen becomes false
And inlinePopup.context becomes null
```

### AC-501-02: Notification State Management

```gherkin
Given pendingNotifications is empty
When addNotification({ id: '1', type: 'NEW_ANSWER', ... }) is called
Then pendingNotifications has length 1
And pendingNotifications[0].id equals '1'

When clearNotification('1') is called
Then pendingNotifications becomes empty
```

---

## AC-510: Text Selection Trigger

### AC-510-01: Popup Opens on Valid Selection

```gherkin
Given a student is viewing a material page
And the material viewer exposes onSelectionIntent callback
When the student selects 10 characters of text and releases the mouse
Then onSelectionIntent is called with the selection context
And the Q&A inline popup opens anchored to the selection
And focus moves to the question title input field
```

### AC-510-02: Short Selection Does Not Open Popup

```gherkin
Given a student is viewing a material page
When the student selects fewer than 5 characters
And releases the mouse
Then the Q&A popup does not open
And no error is shown
```

### AC-510-03: Popup Dismissed by Escape Key

```gherkin
Given the Q&A inline popup is open
When the user presses the Escape key
Then the popup closes
And focus returns to the material viewer
And no question is submitted
```

### AC-510-04: Popup Dismissed by Click Outside

```gherkin
Given the Q&A inline popup is open
When the user clicks outside the popup bounds
Then the popup closes
And the form content is not saved
```

---

## AC-511: Inline Popup Layout

### AC-511-01: Desktop Positioning

```gherkin
Given the viewport width is >= 768px
And the inline popup is triggered by text selection
When the popup renders
Then the popup has width of 480px
And the popup appears below the selected text when there is sufficient space
And the popup flips above the selection when bottom would exceed viewport boundary
And the popup shifts left when right edge would exceed viewport boundary
```

### AC-511-02: Mobile Sheet Variant

```gherkin
Given the viewport width is < 768px
When the Q&A popup is triggered
Then a Sheet component slides up from the bottom of the screen
And the Sheet occupies full width
And the context snippet and form fields are visible within the Sheet
```

### AC-511-03: Context Snippet Display

```gherkin
Given the popup is open with selectedText = "Transformers are a type of neural network..."
When the popup renders
Then a styled blockquote displays the selected text
And the text is truncated to 3 lines with an ellipsis if longer
```

---

## AC-512: Popup Accessibility

### AC-512-01: ARIA Attributes

```gherkin
Given the Q&A popup is open
When the popup DOM is inspected
Then the popup container has role="dialog"
And role="dialog" element has aria-modal="true"
And the dialog has aria-label or aria-labelledby referencing "질문하기"
```

### AC-512-02: Focus Trap

```gherkin
Given the Q&A popup is open and focus is on the last focusable element (Submit button)
When the user presses Tab
Then focus moves to the first focusable element inside the popup (title input)
And focus does not escape to the background page
```

---

## AC-513: Popup Question Form Submission

### AC-513-01: Successful Submission

```gherkin
Given the Q&A popup is open
And the student enters a title of at least 10 characters
And the student enters content of at least 20 characters
When the student clicks "제출" (Submit)
Then useCreateQuestion mutation is called with { courseId, materialId, title, content, context }
And a loading spinner appears on the Submit button
And the form fields are disabled during submission
And on success the popup closes
And a success Toast appears: "질문이 등록되었습니다"
And the Q&A list query is invalidated
```

### AC-513-02: Validation Error Display

```gherkin
Given the Q&A popup is open
And the student leaves the title field empty
When the student clicks Submit
Then the popup does not close
And an error message appears below the title field
And the mutation is not called
```

### AC-513-03: Duplicate Submission Prevention

```gherkin
Given the Q&A popup form is being submitted (loading state)
When the user clicks Submit again
Then the mutation is not called a second time
And the Submit button remains disabled until the first call completes
```

---

## AC-520: Q&A List Page

### AC-520-01: Page Renders

```gherkin
Given a user navigates to /qa
When the page loads
Then the Q&A list page renders within the dashboard layout
And the page title "Q&A" is visible
And the filter bar is visible
And at least a loading skeleton or question list items are displayed
```

### AC-520-02: Filter by Status

```gherkin
Given the Q&A list page is loaded with questions of mixed statuses
When the user selects "Resolved" from the status tabs
Then only questions with status RESOLVED are shown
And the URL updates with ?status=RESOLVED
```

### AC-520-03: Filter by Course

```gherkin
Given the user selects a course from the Course dropdown
When the filter is applied
Then only questions from that course are shown
And the Material dropdown becomes enabled
```

### AC-520-04: Search

```gherkin
Given the Q&A list page is open
When the user types "transformer" in the search input
And waits 300ms (debounce)
Then the list fetches with q=transformer parameter
And matching questions are displayed
```

### AC-520-05: Infinite Scroll

```gherkin
Given more than 20 questions match the current filter
When the user scrolls to the bottom of the list
Then additional questions load automatically
And a loading skeleton appears briefly during fetch
And newly loaded items are appended to the list
```

### AC-520-06: Empty State

```gherkin
Given no questions match the active filters
When the list renders
Then an empty state illustration and "아직 질문이 없습니다" message are shown
And for students, a "첫 번째 질문하기" button is visible
```

---

## AC-522: Q&A List Items

### AC-522-01: List Item Content

```gherkin
Given questions are loaded in the list
When a QAListItem renders
Then it shows: status badge, question title, author avatar + name + role badge,
  course/material label, context snippet (selected text, 1 line max), answer count, upvote count,
  relative timestamp, and AI suggestion indicator if hasAiSuggestion is true
```

### AC-522-02: Navigation from List

```gherkin
Given the Q&A list is rendered
When the user clicks a list item
Then the browser navigates to /qa/[questionId]
```

---

## AC-530: Q&A Detail Page

### AC-530-01: Question Detail Renders

```gherkin
Given a user navigates to /qa/[questionId]
When the page loads
Then the full question title is shown as the page heading
And the context block shows the source material link and selected text quote
And the question body is rendered as Markdown (not raw text)
And the author avatar, name, role badge, and timestamp are shown
And the status badge is shown
```

### AC-530-02: 404 for Missing Question

```gherkin
Given a user navigates to /qa/invalid-id-xyz
When the server component fetches the question
Then the not-found.tsx component is rendered
And the HTTP response status is 404
```

---

## AC-532: AI Answer Suggestion

### AC-532-01: AI Suggestion Display

```gherkin
Given a question has an AI suggestion available (aiSuggestion is not null)
When the detail page renders
Then an AIAnswerCard is shown above human answers
And the card has a visual AI indicator (sparkle icon or gradient border)
And "AI 제안 답변" label is visible
And the AI answer content is rendered as Markdown
```

### AC-532-02: AI Suggestion Pending State

```gherkin
Given a question has aiSuggestionPending = true
When the detail page renders
Then a pulsing skeleton with "AI가 답변을 생성 중..." label is shown where the AI answer will appear
```

### AC-532-03: Instructor Accept AI Answer

```gherkin
Given an instructor is viewing a question with an available AI suggestion
When the instructor clicks "채택하기" on the AI answer card
Then useAcceptAnswer mutation is called with the AI answer's ID
And the AI answer card shows the "채택된 답변" badge
And question status updates to RESOLVED
And a success Toast appears
```

### AC-532-04: Student Cannot Accept AI Answer

```gherkin
Given a student is viewing a question with an available AI suggestion
When the AIAnswerCard renders
Then the "채택하기" button is not visible
And the student sees the AI answer as read-only content
```

---

## AC-533: Answer Thread

### AC-533-01: Accepted Answer Pinned First

```gherkin
Given a question has one accepted answer and multiple other answers
When the answer thread renders
Then the accepted answer appears first
And it has a "채택된 답변" badge
And remaining answers appear in upvote-count descending order
```

### AC-533-02: Upvote Answer Toggle

```gherkin
Given a student is viewing an answer they did not write
When the student clicks the upvote button
Then the upvote count increments immediately (optimistic update)
And the button state changes to "upvoted"
When the student clicks the upvote button again
Then the upvote count decrements
And the button returns to "not upvoted" state
```

### AC-533-03: Author Cannot Upvote Own Answer

```gherkin
Given a student is viewing an answer they authored
When the answer card renders
Then the upvote button is disabled
And no tooltip explanation is required (UI convention)
```

---

## AC-534: Answer Submission Form

### AC-534-01: Successful Answer Submission

```gherkin
Given an authenticated user is viewing an open question
When the user types a valid answer (>= 10 chars) in MarkdownEditor
And clicks "답변 등록"
Then useCreateAnswer mutation is called with the content
And on success the answer appears in the thread
And the form resets to empty
And the viewport scrolls to the new answer
```

### AC-534-02: Form Disabled for Closed Question

```gherkin
Given a question has status CLOSED
When the detail page renders
Then the answer form is displayed as read-only (all fields disabled)
And a notice "이 질문은 종료되었습니다" is shown above the form
```

### AC-534-03: Unauthenticated User Cannot Submit

```gherkin
Given the user is not authenticated
When the Q&A detail page renders
Then the answer form is not rendered
And instead a "로그인하면 답변할 수 있습니다" message with a login link is shown
```

---

## AC-535: Accept Answer

### AC-535-01: Instructor Accepts Any Answer

```gherkin
Given an instructor is viewing a question with unaccepted answers
When the instructor clicks "채택하기" on an answer
Then useAcceptAnswer mutation is called
And the answer card shows "채택된 답변" badge immediately (optimistic)
And the question status updates to RESOLVED
And a success Toast "답변이 채택되었습니다" appears
```

### AC-535-02: Question Author Accepts Answer

```gherkin
Given a student is viewing their own question
When the student clicks "채택하기" on an answer
Then the same accept flow executes as for an instructor
```

### AC-535-03: Non-Author Student Cannot Accept

```gherkin
Given a student is viewing a question they did not author
When the answer thread renders
Then no "채택하기" button is visible on any answer card
```

---

## AC-537: Real-Time Answer Updates

### AC-537-01: New Answer Appears Without Refresh

```gherkin
Given User A is viewing a question detail page
And User B posts an answer to the same question
When the WebSocket event QA_EVENTS.NEW_ANSWER is received
Then the new answer appears in User A's answer thread without page refresh
And the answer count increments
```

### AC-537-02: Polling Fallback

```gherkin
Given WebSocket connection is unavailable (connection refused)
And a user is viewing a question detail page
When 30 seconds elapse
Then the question detail is re-fetched automatically
And any new answers that appeared server-side are shown
```

---

## AC-540: Instructor Moderation

### AC-540-01: Status Change Available to Instructor

```gherkin
Given an instructor is viewing a question detail page
When the QuestionCard action menu renders
Then a status change control is visible (Open / Resolved / Closed options)
And selecting "Closed" opens a confirmation dialog
```

### AC-540-02: Status Change Not Available to Student

```gherkin
Given a student is viewing a question detail page
When the QuestionCard action menu renders
Then no status change control is visible
```

### AC-540-03: Instructor Deletes Any Question

```gherkin
Given an instructor is viewing a question detail page
When the instructor selects "삭제" from the action menu
Then a confirmation dialog appears: "질문과 모든 답변이 삭제됩니다"
When the instructor confirms deletion
Then the question and all answers are deleted
And the user is navigated back to /qa
And the Q&A list query is invalidated
```

---

## AC-545: WebSocket Notifications

### AC-545-01: Toast on New Answer (Author)

```gherkin
Given User A authored a question
And User A is authenticated and on any page
When User B posts an answer and the server sends QA_EVENTS.NEW_ANSWER
Then User A sees a Toast notification: "[User B 이름]님이 답변했습니다"
And the Toast includes a link to the question
And clicking the Toast navigates to /qa/[questionId]
```

### AC-545-02: Toast on AI Suggestion Ready

```gherkin
Given a user requested an AI suggestion for a question
When the server sends QA_EVENTS.AI_SUGGESTION_READY
Then a Toast appears: "AI가 [질문 제목]에 답변을 제안했습니다"
And clicking navigates to /qa/[questionId] and scrolls to AIAnswerCard
```

### AC-545-03: Notification Badge Clears on Visit

```gherkin
Given qa.store has 2 pending notifications
When the user navigates to /qa (the Q&A list page)
Then pendingNotifications is cleared
And the Q&A navigation badge disappears
```

---

## AC-514: MarkdownEditor Component

### AC-514-01: Write/Preview Toggle

```gherkin
Given MarkdownEditor is rendered with initial value "**Hello**"
When the user clicks the "Preview" tab
Then the rendered output shows bold "Hello" text (not raw asterisks)
When the user clicks the "Write" tab
Then the textarea is shown again with the raw Markdown value
```

### AC-514-02: Toolbar Bold Shortcut

```gherkin
Given the user has selected the word "test" in the MarkdownEditor textarea
When the user clicks the Bold toolbar button
Then the textarea value changes to "**test**"
And the cursor is positioned after the closing asterisks
```

### AC-514-03: Disabled State

```gherkin
Given MarkdownEditor is rendered with disabled=true
When the user attempts to type in the textarea
Then no input is accepted
And the toolbar buttons are not interactive
```

---

## AC-N500: Unwanted Behavior Verification

### AC-N500-01: No Popup on Short Selection

```gherkin
Given a user selects exactly 3 characters in the material viewer
When the selection ends
Then the Q&A popup does not open
And qa.store.inlinePopup.isOpen remains false
```

### AC-N502-01: No Instructor Controls for Students

```gherkin
Given a student is viewing a question detail page
When the page renders
Then the following are NOT present in the DOM:
  - Status change dropdown
  - "채택하기" button on AI answer card
  - "이 질문 닫기" action
```

### AC-N505-01: No Raw Markdown Display

```gherkin
Given a question content contains "**bold** text and `code`"
When QuestionCard renders the content
Then the user sees bold text and code formatting
And the raw asterisks and backticks are not visible
```

### AC-N506-01: Answer Form Disabled for Closed

```gherkin
Given a question has status CLOSED
When AnswerForm renders
Then all form fields are disabled
And the submit button is disabled
And the notice "이 질문은 종료되었습니다" is present
```

---

## Responsive Acceptance Criteria

### AC-RESP-01: Mobile Q&A List

```gherkin
Given viewport width is 375px
When the Q&A list page renders
Then the filter bar collapses to a single "Filter" button
And clicking "Filter" opens a Sheet from the bottom
And list items display without horizontal overflow
```

### AC-RESP-02: Mobile Inline Popup

```gherkin
Given viewport width is 375px
When a student triggers the Q&A popup
Then a Sheet slides up from the bottom (not a floating popup)
And the Sheet contains the context snippet, title input, and content editor
```

### AC-RESP-03: Tablet Q&A Detail

```gherkin
Given viewport width is 768px
When the Q&A detail page renders
Then all content (QuestionCard, AIAnswerCard, AnswerThread, AnswerForm) renders without horizontal overflow
And the answer form Markdown editor is usable with a visible toolbar
```
