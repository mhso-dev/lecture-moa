---
id: SPEC-FE-004
title: "Learning Materials and Markdown Engine - Acceptance Criteria"
version: 1.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

# SPEC-FE-004: Acceptance Criteria

## 1. Markdown Rendering Engine

### AC-FE-300: MarkdownRenderer — Core Rendering

**Requirement**: REQ-FE-300

```gherkin
Given a valid Markdown string is passed to MarkdownRenderer
When the component renders
Then the output is semantically correct HTML
And the remark-gfm plugin processes GFM syntax
And the remark-math plugin processes $...$ and $$...$$ delimiters
And the remark-callout plugin converts > [!NOTE] blocks
And the rehype-katex plugin renders math nodes
And the rehype-highlight plugin applies syntax highlighting classes
And the rehype-sanitize plugin removes dangerous HTML
```

```gherkin
Given a Markdown string with no content
When MarkdownRenderer renders
Then it renders an empty container without errors
```

---

### AC-FE-301: GFM Element Rendering

**Requirement**: REQ-FE-301

```gherkin
Given a Markdown string with a GFM table
When MarkdownRenderer renders
Then the table is wrapped in a horizontally scrollable container on viewports below 768px
And the table renders with proper <thead>, <tbody>, and <th>/<td> elements

Given a Markdown string with a GFM task list
When MarkdownRenderer renders
Then checkboxes are rendered as read-only (disabled) in the viewer context
And checked items have the [x] state reflected visually
```

---

### AC-FE-302: Syntax Highlighting

**Requirement**: REQ-FE-302

```gherkin
Given a fenced code block with a language identifier (e.g., ```typescript)
When MarkdownRenderer renders
Then the code block has highlight.js CSS classes applied
And the language label is displayed in the top-right of the code block

Given a fenced code block without a language identifier
When MarkdownRenderer renders
Then auto-detection is attempted
And the code block is still displayed without errors if detection fails

Given any rendered code block
When the user hovers over it on desktop
Then the copy button becomes visible in the top-right corner
```

---

### AC-FE-303: Math and LaTeX Rendering

**Requirement**: REQ-FE-303

```gherkin
Given Markdown content with a valid inline math expression $E = mc^2$
When MarkdownRenderer renders
Then KaTeX renders the expression inline within the paragraph

Given Markdown content with a valid block math expression $$\int_0^\infty$$
When MarkdownRenderer renders
Then KaTeX renders the expression as a display-mode block

Given Markdown content with an invalid KaTeX expression $\invalidcommand$
When MarkdownRenderer renders
Then the rest of the material content renders correctly
And the invalid expression is displayed as raw text in a <code> element
And no JavaScript error is thrown to the console
```

---

### AC-FE-304: Educational Callout Blocks

**Requirement**: REQ-FE-304

```gherkin
Given a Markdown block with > [!NOTE] syntax
When MarkdownRenderer renders
Then a callout container is displayed with a blue/info color scheme
And the Lucide Info icon is shown
And the label "Note" is displayed in bold
And the body text is rendered correctly

Given each callout type (NOTE, TIP, WARNING, IMPORTANT, CAUTION)
When MarkdownRenderer renders each
Then each type has the appropriate color: blue, green, amber, violet, red respectively
And each type has the appropriate Lucide icon
```

---

### AC-FE-308: Code Block Copy

**Requirement**: REQ-FE-308

```gherkin
Given a rendered code block in the material viewer
When the user clicks the copy button
Then the code content (without line numbers if shown) is copied to the clipboard
And a "Copied!" tooltip appears near the button
And the tooltip disappears after 2 seconds
And the button returns to its default state

Given the copy button is present
When the user navigates to it via keyboard Tab
And presses Enter or Space
Then the copy action is triggered
```

---

### AC-FE-309: XSS Prevention via Sanitization

**Requirement**: REQ-FE-309

```gherkin
Given Markdown content containing <script>alert('xss')</script>
When MarkdownRenderer renders
Then no script element is present in the output DOM
And no alert is triggered

Given Markdown content containing <a href="javascript:void(0)">click</a>
When MarkdownRenderer renders
Then the href attribute is stripped or the link is rendered without the javascript: scheme

Given Markdown content containing <div onclick="alert('xss')">text</div>
When MarkdownRenderer renders
Then the onclick attribute is not present in the output DOM
```

---

### AC-FE-310: Heading Anchor Links

**Requirement**: REQ-FE-310

```gherkin
Given a rendered h2 heading "## Introduction"
When the user hovers over the heading on desktop
Then a # anchor icon appears to the right of the heading text

Given the heading with id "introduction"
When the user clicks the anchor icon
Then the URL fragment is updated to #introduction
And the fragment URL is copied to the clipboard

Given a heading "## Complex: Title! Here?"
When MarkdownRenderer generates the anchor id
Then the id is "complex-title-here" (lowercase, special chars stripped, spaces to hyphens)
```

---

## 2. Material Viewer

### AC-FE-315: Material Viewer Page

**Requirement**: REQ-FE-315

```gherkin
Given an authenticated user navigates to /courses/[courseId]/materials/[materialId]
When the page loads
Then the page title is "{material.title} | {course.title} | lecture-moa"
And the MarkdownRenderer renders the material content
And the MaterialMetadata component shows author, date, and read time
And the MaterialToolbar is sticky at the top
```

---

### AC-FE-316: Table of Contents

**Requirement**: REQ-FE-316

```gherkin
Given a material with three or more h2/h3 headings
When the viewer renders on desktop (≥ 1280px)
Then the ToC panel is visible on the right side (240px wide)
And the ToC shows nested heading items reflecting the hierarchy

Given the same material on mobile (< 768px)
When the viewer renders
Then the ToC panel is not visible by default
And a "Table of Contents" button in the toolbar opens a bottom sheet
And the bottom sheet contains the full ToC

Given a material with fewer than two h2/h3 headings
When the viewer renders
Then the ToC panel is not displayed on any breakpoint
```

---

### AC-FE-317: Scroll Spy for Active ToC Item

**Requirement**: REQ-FE-317

```gherkin
Given the material viewer is open with a visible ToC
When the user scrolls to a section with heading id "chapter-2"
Then the ToC item for "chapter-2" is highlighted as active
And the previously active item is no longer highlighted

Given the user has not scrolled (at top of page)
When the viewer first renders
Then the first h2 heading is the active ToC item
```

---

### AC-FE-318: Reading Progress Bar

**Requirement**: REQ-FE-318

```gherkin
Given the material viewer is open
When the page is at the top (scroll position 0)
Then the reading progress bar shows 0% width

When the user scrolls to the middle of the material
Then the progress bar width is approximately 50%

When the user scrolls to the bottom
Then the progress bar width is 100%

Given the progress bar element
Then it has role="progressbar" attribute
And aria-valuenow reflects the current percentage
And aria-valuemin is "0"
And aria-valuemax is "100"
```

---

### AC-FE-319: Material Toolbar

**Requirement**: REQ-FE-319

```gherkin
Given the material viewer page is open
When the user scrolls down past the viewport height
Then the MaterialToolbar remains visible at the top of the content area (sticky)

Given an authenticated student is viewing a material
When the toolbar renders
Then the Edit button is not displayed

Given an authenticated instructor is viewing a material
When the toolbar renders
Then the Edit button is visible and links to the /edit route
```

---

### AC-FE-320: Inline Q&A Text Selection Trigger

**Requirement**: REQ-FE-320

```gherkin
Given a student is viewing a material
When they select text within the material content area
Then a floating "Ask a question" button appears near the selection end point

When the user clears the selection (clicks elsewhere)
Then the floating button disappears

When the "Ask a question" button is clicked
Then openQaPopup is called with the selected text, anchor rect, materialId, and headingId

Given an instructor is viewing a material
When they select text
Then the "Ask a question" button is NOT displayed
```

```gherkin
Given a student on a mobile device (touch)
When they long-press on text to select it
Then the Q&A trigger button appears below the selection
And it remains accessible without interfering with native text selection handles
```

---

### AC-FE-322: Material Navigation

**Requirement**: REQ-FE-322

```gherkin
Given a material that has a next material in the course
When the viewer renders
Then a "Next:" navigation block is displayed at the bottom with the next material's title

Given a material that is the first in the course
When the viewer renders
Then no "Previous" navigation block is displayed

Given the user presses the right arrow key while not in an input
When the current material has a next material
Then the browser navigates to the next material
```

---

### AC-FE-324: Material Viewer Loading State

**Requirement**: REQ-FE-324

```gherkin
Given the material API request is in-flight
When the material viewer page renders
Then the MaterialViewerSkeleton is displayed
And the skeleton includes placeholder shapes for the toolbar, content paragraphs, and ToC
And no content flicker occurs when the data resolves
```

---

### AC-FE-325: Material Viewer Error States

**Requirement**: REQ-FE-325

```gherkin
Given the API returns 404 for the materialId
When the viewer renders
Then the not-found.tsx page is displayed with "Material not found" message
And a link back to the course materials list is shown

Given a student navigates to a draft material URL
When the viewer renders
Then "This material is not yet published" message is displayed
And the material content is NOT shown

Given a network error occurs during material fetch
When the viewer renders
Then an error message is displayed
And a "Try again" retry button is shown
```

---

### AC-FE-326: Font Size Adjustment

**Requirement**: REQ-FE-326

```gherkin
Given the material viewer is open (default font size: md)
When the user selects "Large" font size from the toolbar
Then the material body text increases to 18px
And the preference is saved and persists after page reload

When the user selects "Small" font size
Then the material body text decreases to 15px
```

---

### AC-FE-329: Material Viewer Accessibility

**Requirement**: REQ-FE-329

```gherkin
Given the material viewer page
When a keyboard user navigates via Tab
Then all interactive elements (copy button, anchor links, ToC items, font size toggle) are reachable
And each interactive element has a visible focus indicator

Given the page is read by a screen reader
When the ToC toggle button is reached
Then the button has a descriptive aria-label indicating its purpose

Given the Q&A trigger button appears after text selection
When the button is present
Then it has aria-label="Ask a question about the selected text"
```

---

## 3. Material List Page

### AC-FE-330: Material List Page

**Requirement**: REQ-FE-330

```gherkin
Given an authenticated user navigates to /courses/[courseId]/materials
When the page loads
Then a list of published materials for the course is displayed
And materials are ordered by their course position (default sort)
And each material is represented by a MaterialCard
```

---

### AC-FE-331: Material Card

**Requirement**: REQ-FE-331

```gherkin
Given a material card in the list
When it renders
Then it displays the material title
And a text excerpt (max 150 characters of plain text)
And the estimated read time
And the author avatar and name
And the last updated date in a human-readable format
And tag badges if tags exist

Given the current user is a student
When the material card renders
Then no edit, delete, or publish toggle options are visible in the dropdown

Given the current user is an instructor
When the material card renders
Then the card dropdown menu contains: Edit, Delete, and Toggle Publish options
```

---

### AC-FE-332: Material Search

**Requirement**: REQ-FE-332

```gherkin
Given the user is on the material list page
When they type "python" in the search input
Then after a 300ms debounce, the API is called with ?search=python
And only materials matching "python" in title or content are displayed

When the user clears the search input
Then all materials are displayed again

When the search returns zero results
Then an empty state message is shown: "No materials found for '{query}'"
```

---

### AC-FE-333: Material Filtering and Sorting

**Requirement**: REQ-FE-333

```gherkin
Given filter and sort controls are present
When the user selects a tag filter "python"
Then the URL updates to include ?tags=python
And only materials with the "python" tag are shown

When the user selects sort "Newest First"
Then the URL updates to include ?sort=updatedAt&order=desc
And materials are ordered newest first

When any filter is active
Then a "Clear filters" button is visible
And clicking it resets all filters and sort to defaults
```

---

### AC-FE-334: Material List Empty State

**Requirement**: REQ-FE-334

```gherkin
Given a course with no materials
When a student views the materials page
Then the empty state message "No materials yet" is displayed

Given a course with no materials
When an instructor views the materials page
Then the message "No materials yet. Upload your first material." is displayed
And a primary "Upload Material" button is shown
```

---

### AC-FE-336: Material Deletion (Instructor)

**Requirement**: REQ-FE-336

```gherkin
Given an instructor clicks "Delete" on a material card
When the confirmation dialog appears
Then the dialog displays the material title and a warning about irreversibility

When the instructor confirms deletion
Then the material is optimistically removed from the list
And a DELETE request is sent to the API
And a success toast is shown on API success

When the API returns an error
Then the deleted material reappears in the list (rollback)
And an error toast is displayed with the error message
```

---

## 4. Material Upload Page (Instructor)

### AC-FE-340: Upload Page Access Control

**Requirement**: REQ-FE-340

```gherkin
Given a student navigates to /courses/[courseId]/materials/upload
When the page loads
Then the student is redirected to the materials list page
And no upload UI is displayed
```

---

### AC-FE-341: Markdown File Upload

**Requirement**: REQ-FE-341

```gherkin
Given an instructor is on the upload page
When they drag and drop a valid .md file onto the drop zone
Then the file content is read as UTF-8 text
And the content field is populated with the file's content
And a preview renders in the preview pane

When they drop a file larger than 10 MB
Then an error message is displayed: "File exceeds the 10 MB limit"
And the content field is not populated

When they drop a non-Markdown file (e.g., .pdf)
Then an error message is displayed: "Only .md files are accepted"
And the content field is not populated
```

---

### AC-FE-342: Metadata Form Validation

**Requirement**: REQ-FE-342

```gherkin
Given the upload form is displayed
When the user submits without entering a title
Then a validation error "Title is required" appears below the title field

When the user enters a title longer than 200 characters
Then a validation error "Title must be 200 characters or less" appears

When the user adds more than 10 tags
Then a validation error "Maximum 10 tags allowed" appears
```

---

### AC-FE-343: Upload Preview

**Requirement**: REQ-FE-343

```gherkin
Given content is present in the upload form
When the content textarea has content
Then the preview pane renders the Markdown using MarkdownRenderer

When the content changes
Then the preview updates after a 500ms debounce

On mobile viewport (< 768px)
When the user switches to the "Preview" tab
Then the rendered preview is shown full-width
```

---

### AC-FE-344: Upload Submission

**Requirement**: REQ-FE-344

```gherkin
Given all required fields are filled and valid
When the instructor clicks "Upload Material"
Then a loading spinner appears on the submit button
And a POST request is sent to the materials API
And on success, the browser navigates to the newly created material's viewer page

When the API returns a 400 error
Then no redirect occurs
And an error toast displays the API error message
And the submit button returns to its normal state
```

---

### AC-FE-348: Unsaved Changes Warning (Upload)

**Requirement**: REQ-FE-348

```gherkin
Given the instructor has entered content in the upload form
When they click the browser back button or navigate to another route
Then a confirmation dialog appears: "You have unsaved changes. Are you sure you want to leave?"

When the instructor confirms leaving
Then navigation proceeds and form data is lost

When the instructor cancels
Then they remain on the upload page with their data intact
```

---

## 5. Material Editor Page (Instructor)

### AC-FE-350: Editor Page Access Control

**Requirement**: REQ-FE-350

```gherkin
Given a student navigates to /courses/[courseId]/materials/[materialId]/edit
When the page loads
Then the student is redirected to the material viewer page
```

---

### AC-FE-351: Markdown Editor Features

**Requirement**: REQ-FE-351

```gherkin
Given an instructor opens the material editor
When the editor loads
Then the existing material content is populated in the editor
And the toolbar displays all required formatting buttons
And a word count is visible in the status bar

When the instructor clicks the Bold toolbar button
Then the selected text is wrapped with ** markdown bold syntax
Or if no text is selected, ** ** is inserted at the cursor
```

---

### AC-FE-352: Live Preview Pane

**Requirement**: REQ-FE-352

```gherkin
Given the instructor is typing in the editor
When they pause for 500ms
Then the preview pane updates with the rendered Markdown

On desktop (≥ 768px)
When the editor opens
Then both the editor and preview panes are visible side-by-side

On mobile (< 768px)
When the editor opens
Then only the editor tab is active by default
And toggling to "Preview" tab shows the rendered preview
```

---

### AC-FE-353: Editor Autosave

**Requirement**: REQ-FE-353

```gherkin
Given the instructor has made unsaved changes in the editor
When 30 seconds pass
Then "Saving..." appears in the toolbar autosave indicator
And the content is saved to localStorage under the key "material-draft-{materialId}"
And the indicator changes to "Saved {time}"

Given the instructor returns to the editor after navigating away
When a localStorage draft exists for the material and is newer than the server version
Then a dialog appears: "A newer local draft was found. Restore it?"
And if confirmed, the editor populates with the draft content
```

---

### AC-FE-354: Save and Publish

**Requirement**: REQ-FE-354

```gherkin
Given the instructor clicks "Save Draft"
When the API responds with success
Then the material status remains 'draft'
And a success toast "Draft saved" appears
And the editor remains open

Given a draft material
When the instructor clicks "Save and Publish"
Then a confirmation dialog appears: "This will publish the material to students. Continue?"
And on confirm, the material is updated with status: 'published'
And a success toast "Material published" appears
```

---

### AC-FE-355: Editor Keyboard Shortcuts

**Requirement**: REQ-FE-355

```gherkin
Given the editor has focus
When the user presses Ctrl+B (or Cmd+B on Mac)
Then selected text is bold-formatted

When the user presses Ctrl+S (or Cmd+S on Mac)
Then the browser's native save dialog is suppressed
And the "Save Draft" action is triggered

When the user presses Ctrl+Shift+P (or Cmd+Shift+P on Mac)
Then the editor toggles between edit and preview mode
```

---

### AC-FE-356: Image Paste Upload

**Requirement**: REQ-FE-356

```gherkin
Given the editor has focus
When the user pastes an image from the clipboard
Then a loading indicator appears in the editor
And the image is POSTed to POST /api/courses/:courseId/materials/images
And on success, the Markdown syntax ![Pasted image](url) is inserted at the cursor

When the image upload fails
Then an error toast is displayed
And no broken image syntax is inserted into the editor
```

---

### AC-FE-357: Editor Conflict Detection

**Requirement**: REQ-FE-357

```gherkin
Given the editor is open and the instructor has unsaved changes
When a different session updates the material on the server
And the instructor attempts to save
Then the system detects the updatedAt mismatch
And a conflict dialog appears with options: "Overwrite server version" or "Discard my changes"

When the instructor selects "Overwrite server version"
Then the save proceeds with the local content

When the instructor selects "Discard my changes"
Then the editor is refreshed with the server's current content
```

---

## 6. Shared Types and Hooks

### AC-FE-360: Material Type Definitions

**Requirement**: REQ-FE-360

```gherkin
Given the material.types.ts is implemented
When a TypeScript file imports Material from @shared/types/material.types
Then the type includes all required fields: id, courseId, title, content, excerpt, status, position, tags, readTimeMinutes, authorId, author, qaCount, createdAt, updatedAt
And MaterialListItem excludes the content field
And CreateMaterialDto and UpdateMaterialDto are correctly typed
```

---

### AC-FE-361: Validation Schema

**Requirement**: REQ-FE-361

```gherkin
Given a valid CreateMaterialDto object
When parsed through CreateMaterialSchema
Then parsing succeeds with no errors

Given a CreateMaterialDto with title = "" (empty)
When parsed through CreateMaterialSchema
Then a ZodError is thrown with message "Title is required"

Given a CreateMaterialDto with content = "" (empty)
When parsed through CreateMaterialSchema
Then a ZodError is thrown

Given a CreateMaterialDto with tags = ["a","b","c","d","e","f","g","h","i","j","k"] (11 tags)
When parsed through CreateMaterialSchema
Then a ZodError is thrown with message about max 10 tags
```

---

### AC-FE-364: useScrollSpy Hook

**Requirement**: REQ-FE-364

```gherkin
Given useScrollSpy is called with an array of heading IDs
When the IntersectionObserver fires for heading "chapter-2"
Then the hook returns "chapter-2"

When no heading is intersecting
Then the hook returns null

When the component unmounts
Then all IntersectionObserver instances are disconnected
```

---

### AC-FE-365: useReadingProgress Hook

**Requirement**: REQ-FE-365

```gherkin
Given useReadingProgress is called with no arguments
When the page is at the top (scrollY = 0)
Then the hook returns 0

When the page is scrolled to the bottom
Then the hook returns 100

When the document height equals the viewport height (no scrollable content)
Then the hook returns 100 (fully read by default)
```

---

## 7. Definition of Done

A requirement in SPEC-FE-004 is considered done when:

1. All acceptance criteria for the requirement pass
2. Unit tests cover the requirement's core logic (85%+ coverage for new utilities)
3. Component tests verify the UI behavior
4. TypeScript compiles with zero type errors (`tsc --noEmit`)
5. ESLint reports zero errors
6. The component renders correctly on all three breakpoints: 375px, 768px, 1280px
7. WCAG 2.1 AA is verified for all interactive elements in the requirement
8. Dark mode rendering is verified for all visual components
9. The implementation uses only design tokens defined in SPEC-FE-001 (no magic numbers)
10. Role-based access (instructor vs. student) is correctly enforced

The entire SPEC-FE-004 is considered done when all Primary, Secondary, Tertiary, and Final Goals in `plan.md` are complete and all acceptance criteria in this document pass.
