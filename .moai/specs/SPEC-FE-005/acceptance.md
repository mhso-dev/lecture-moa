# SPEC-FE-005: Course Management - Acceptance Criteria

**Version**: 2.0.0
**Last Updated**: 2026-02-19
**Status**: Draft

## Overview

This document defines the acceptance criteria for SPEC-FE-005 Course Management feature using Given-When-Then format.

---

## REQ-FE-400: Course List Display

### Scenario: View Course Catalog

```gherkin
Given the user is authenticated
When the user navigates to /courses
Then the system displays the course catalog page
And each course card shows title, description, thumbnail, instructor name, and enrollment count
```

### Scenario: Empty Course List (Student)

```gherkin
Given the user is authenticated as a student
And no courses are available
When the user navigates to /courses
Then the system displays an empty state illustration
And shows a message "No courses available"
```

### Scenario: Empty Course List (Instructor)

```gherkin
Given the user is authenticated as an instructor
And no courses exist
When the user navigates to /courses
Then the system displays an empty state with a "Create Course" call-to-action button
```

---

## REQ-FE-401: Grid and List View Toggle

### Scenario: Toggle View Mode

```gherkin
Given the user is on the course list page
When the user clicks the view toggle button
Then the layout switches between grid and list view
And the preference is persisted in localStorage
And the view mode is stored in Zustand
```

---

## REQ-FE-402: Course Search

### Scenario: Search Courses

```gherkin
Given the user is on the course list page
When the user types "TypeScript" in the search input
Then the system debounces the input by 300ms
And sends an API request with search query
And updates the URL with ?q=TypeScript parameter
And displays matching courses
```

### Scenario: Clear Search

```gherkin
Given the search input contains "TypeScript"
When the user clicks the clear button or presses Escape
Then the search input is cleared
And the URL parameter is removed
And all courses are displayed
```

---

## REQ-FE-403: Category Filter

### Scenario: Filter by Category

```gherkin
Given the user is on the course list page
When the user selects "programming" category from the filter
Then the system requests filtered courses from the API
And updates the URL with ?category=programming
And displays only programming courses
```

---

## REQ-FE-404: Sort Options

### Scenario: Sort Courses

```gherkin
Given the user is on the course list page
When the user selects "popular" from the sort dropdown
Then the system re-fetches courses with sort=popular parameter
And displays courses sorted by popularity
```

---

## REQ-FE-405: Pagination

### Scenario: Navigate Pages

```gherkin
Given there are more than 20 courses
When the user clicks page 2 in the pagination control
Then the system loads the second page of courses
And updates the URL with ?page=2
And scrolls to the top of the course list
```

---

## REQ-FE-410: Course Detail Display

### Scenario: View Course Details

```gherkin
Given the user is authenticated
When the user navigates to /courses/{courseId}
Then the system displays course metadata
And shows title, description, thumbnail, category, instructor name, and creation date
```

---

## REQ-FE-411: Syllabus Display

### Scenario: View Course Syllabus

```gherkin
Given the user is viewing a course detail page
Then the system renders the syllabus as collapsible sections
And each section shows an ordered list of materials
```

---

## REQ-FE-413: Student Enrollment Status

### Scenario: Enrolled Student Views Progress

```gherkin
Given the user is authenticated as a student
And the user is enrolled in the course
When the user views the course detail page
Then the system displays enrollment status "Enrolled"
And shows current progress percentage
And displays a progress bar
```

---

## REQ-FE-414: Enroll Button (Public)

### Scenario: Public Course Enrollment

```gherkin
Given the user is authenticated as a student
And the course visibility is "public"
And the user is not enrolled
When the user clicks the "Enroll" button
Then the system calls the enrollment API
And updates the UI optimistically
And shows a success toast notification
```

---

## REQ-FE-415: Join via Invite Code

### Scenario: Invite-Only Course Enrollment

```gherkin
Given the user is authenticated as a student
And the course visibility is "invite_only"
And the user is not enrolled
When the user enters a valid 6-character invite code
And clicks "Join"
Then the system validates the code
And enrolls the user if valid
And redirects to the course content
```

### Scenario: Invalid Invite Code

```gherkin
Given the user is on an invite-only course page
When the user enters an invalid invite code
And clicks "Join"
Then the system displays an error message "Invalid invite code"
```

---

## REQ-FE-416: Student Roster (Instructor View)

### Scenario: View Student Roster

```gherkin
Given the user is authenticated as the course instructor
When the user views the course detail page
Then the system displays a student roster section
And shows each student's name and individual progress percentage
```

---

## REQ-FE-420: Create Page Access Control

### Scenario: Instructor Access Create Page

```gherkin
Given the user is authenticated as an instructor
When the user navigates to /courses/create
Then the system displays the course creation form
```

### Scenario: Student Blocked from Create Page

```gherkin
Given the user is authenticated as a student
When the user attempts to navigate to /courses/create
Then the system redirects to /courses
```

---

## REQ-FE-421: Course Creation Form

### Scenario: Create New Course

```gherkin
Given the instructor is on the course creation page
When the instructor fills in:
  | Field       | Value                    |
  | Title       | "Advanced TypeScript"    |
  | Description | "Master TypeScript..."   |
  | Category    | "programming"            |
  | Visibility  | "public"                 |
And clicks "Create Course"
Then the system validates all required fields using Zod schema
And sends a POST request to /api/v1/courses
And redirects to /courses/{newCourseId}
And invalidates the course list query cache
```

---

## REQ-FE-422: Form Validation

### Scenario: Validation Error on Create

```gherkin
Given the instructor is on the course creation page
When the instructor submits with:
  | Field       | Value     |
  | Title       | "AB"      |
  | Description | ""        |
Then the system displays inline errors:
  | Field       | Error                                    |
  | Title       | "Title must be at least 3 characters"    |
  | Description | "Description must be at least 10 characters" |
```

---

## REQ-FE-430: Settings Page Access Control

### Scenario: Instructor Access Settings Page

```gherkin
Given the user is authenticated as the course instructor
When the user navigates to /courses/{courseId}/settings
Then the system displays the course settings form
```

### Scenario: Non-Owner Blocked from Settings

```gherkin
Given the user is authenticated as a different instructor
When the user attempts to navigate to /courses/{courseId}/settings
Then the system redirects to /courses/{courseId}
```

---

## REQ-FE-433: Invite Code Management

### Scenario: View Invite Code

```gherkin
Given the instructor is viewing settings for an invite_only course
When an invite code exists
Then the system displays the current 6-character invite code
And shows a copy button
```

### Scenario: Generate New Invite Code

```gherkin
Given the instructor is viewing settings for an invite_only course
When the instructor clicks "Generate New Code"
Then the system calls the invite code generation API
And displays the new code
And replaces the old code
```

---

## REQ-FE-435: Remove Student

### Scenario: Remove Student from Course

```gherkin
Given the instructor is viewing the student roster
When the instructor clicks "Remove" next to a student
Then the system displays a confirmation dialog
When the instructor confirms
Then the system removes the student via API
And updates the roster
```

---

## REQ-FE-436: Archive Course

### Scenario: Archive a Course

```gherkin
Given the instructor is on the course settings page
When the instructor clicks "Archive Course"
Then the system displays a confirmation dialog
When the instructor confirms
Then the system calls the archive API
And redirects to /courses
And invalidates the course list cache
```

---

## REQ-FE-437: Delete Course

### Scenario: Delete a Course

```gherkin
Given the instructor is on the course settings page
When the instructor clicks "Delete Course"
Then the system displays a destructive confirmation dialog
And requires typing the course title
When the instructor types the exact title and confirms
Then the system deletes the course via API
And redirects to /courses
And invalidates the course list cache
```

---

## REQ-FE-440: Optimistic Updates

### Scenario: Optimistic Enrollment

```gherkin
Given the student clicks "Enroll"
When the API request is in-flight
Then the system immediately updates the UI to show "Enrolled" status
If the API call fails
Then the system rolls back to "Enroll" button
And displays an error toast
```

---

## REQ-FE-442: Accessibility

### Scenario: Keyboard Navigation

```gherkin
Given the user is on the course list page
When the user presses Tab key
Then focus moves through all interactive elements
And all buttons have visible focus indicators
And ARIA labels are present for screen readers
```

---

## REQ-FE-443: Course Progress Display

### Scenario: View Progress on List Card

```gherkin
Given the student is enrolled in a course
When the student views the course list
Then the course card displays a progress bar
And shows the completion percentage
```

---

## Summary

| Requirement ID | Status | Acceptance Criteria |
|----------------|--------|---------------------|
| REQ-FE-400 | Implemented | Course list display |
| REQ-FE-401 | Implemented | Grid/list toggle |
| REQ-FE-402 | Implemented | Search with debounce |
| REQ-FE-403 | Implemented | Category filter |
| REQ-FE-404 | Implemented | Sort options |
| REQ-FE-405 | Implemented | Pagination support |
| REQ-FE-406 | Implemented | Empty state |
| REQ-FE-407 | Implemented | Loading skeleton |
| REQ-FE-408 | Implemented | Role-based create button |
| REQ-FE-410 | Implemented | Course detail display |
| REQ-FE-411 | Implemented | Syllabus section |
| REQ-FE-412 | Implemented | Material list |
| REQ-FE-413 | Implemented | Enrollment status |
| REQ-FE-414 | Implemented | Enroll button (public) |
| REQ-FE-415 | Implemented | Invite code enrollment |
| REQ-FE-416 | Implemented | Student roster |
| REQ-FE-417 | Implemented | Instructor quick actions |
| REQ-FE-418 | Implemented | Not found handling |
| REQ-FE-420 | Implemented | Create page access control |
| REQ-FE-421 | Implemented | Course creation form |
| REQ-FE-422 | Implemented | Form validation |
| REQ-FE-423 | Implemented | Thumbnail preview |
| REQ-FE-424 | Implemented | Successful creation redirect |
| REQ-FE-425 | Implemented | Creation error handling |
| REQ-FE-430 | Implemented | Settings page access control |
| REQ-FE-431 | Implemented | Edit course information |
| REQ-FE-432 | Implemented | Save settings |
| REQ-FE-433 | Implemented | Invite code display |
| REQ-FE-434 | Implemented | Generate new invite code |
| REQ-FE-435 | Implemented | Remove student |
| REQ-FE-436 | Implemented | Archive course |
| REQ-FE-437 | Implemented | Delete course |
| REQ-FE-440 | Implemented | Optimistic updates |
| REQ-FE-441 | Implemented | Error boundary |
| REQ-FE-442 | Implemented | Accessibility |
| REQ-FE-443 | Implemented | Progress display |
| REQ-FE-444 | Implemented | Type safety |
| REQ-FE-445 | Implemented | Zod schema validation |
