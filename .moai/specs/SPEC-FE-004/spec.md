---
id: SPEC-FE-004
title: "Learning Materials and Markdown Engine"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: critical
tags: [frontend, markdown, materials, react-markdown, syntax-highlighting, katex, toc, inline-qa, reading-progress, material-viewer, material-editor, material-upload]
related_specs: [SPEC-FE-001, SPEC-FE-002, SPEC-UI-001, SPEC-FE-005, SPEC-FE-006]
---

## HISTORY

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 2.0.0 | 2026-02-19 | MoAI | Full rewrite: align file paths, store naming, role strings, and conventions with FE-001/FE-002 implementation; fix lib/api directory structure; correct duplicate component references; add HISTORY section |
| 1.0.0 | 2026-02-19 | MoAI | Initial SPEC draft |

---

# SPEC-FE-004: Learning Materials and Markdown Engine

## 1. Environment

### 1.1 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Runtime | Node.js | 20.x LTS |
| Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| CSS Framework | Tailwind CSS | 4.x |
| Component Library | shadcn/ui (Radix UI) | latest |
| State Management | Zustand | 5.x |
| Data Fetching | TanStack Query | v5 |
| Form Handling | React Hook Form + Zod | latest |
| Icons | Lucide React | latest |
| Testing | Vitest + React Testing Library | latest |
| E2E Testing | Playwright | latest |
| Markdown Parser | react-markdown | 9.x |
| GFM Extension | remark-gfm | 4.x |
| Math Extension | remark-math + rehype-katex | latest |
| Syntax Highlighting | rehype-highlight (highlight.js) | latest |
| Table of Contents | Custom remark plugin or remark-toc | latest |
| Sanitization | rehype-sanitize | latest |
| Markdown Editor | @uiw/react-md-editor or CodeMirror 6 | latest |

### 1.2 Scope Boundary

This SPEC covers the `/materials` domain within `apps/web/`:

```
apps/web/
  app/
    (dashboard)/
      courses/
        [courseId]/
          materials/
            page.tsx                    # Material list
            [materialId]/
              page.tsx                  # Material viewer
            upload/
              page.tsx                  # Instructor upload
            [materialId]/
              edit/
                page.tsx                # Instructor editor
  components/
    markdown/                           # Markdown engine components
    materials/                          # Material-domain components
  lib/
    markdown/                           # Markdown processing utilities
    api/
      materials.ts                      # Material API client functions
  hooks/
    materials/                          # Material-domain hooks
  stores/
    material.store.ts                   # Material viewer state
  styles/
    markdown.css                        # Long-form reading typography
```

Shared package additions:
```
packages/shared/src/
  types/
    material.types.ts                   # Enriched material types (this SPEC)
  validators/
    material.schema.ts                  # Material Zod schemas (this SPEC)
```

Path alias convention: `~` maps to `apps/web/` root (e.g., `~/lib/api/materials`, `~/stores/material.store`).

### 1.3 Design References

The following `.pen` design files define the visual specification for this domain. These files are used as design references and must NOT be read programmatically:

| Screen | .pen File | Purpose |
|--------|-----------|---------|
| Material Viewer | `design/screens/material/material-viewer.pen` | Core learning experience with inline Q&A |
| Material List | `design/screens/material/material-list.pen` | Course material catalog |
| Material Upload | `design/screens/material/material-upload.pen` | Instructor upload flow |
| Material Editor | `design/screens/material/material-editor.pen` | Markdown editing with live preview |

### 1.4 Responsive Design Constraints

| Breakpoint | Viewport | Grid | Sidebar | ToC Behavior |
|-----------|----------|------|---------|-------------|
| Mobile | 375px-767px | 4-col | Bottom Tab | Hidden (drawer toggle) |
| Tablet | 768px-1279px | 8-col | Collapsed sidebar | Optional floating panel |
| Desktop | 1280px+ | 12-col | Expanded sidebar | Fixed right panel |

---

## 2. Assumptions

### 2.1 Foundation Dependencies

- SPEC-FE-001 is implemented: design tokens, layout system, shadcn/ui components, providers, Zustand stores, API client (`apps/web/lib/api.ts` fetch-based singleton), and `packages/shared/src/utils/markdown.ts` skeleton are all in place.
- SPEC-FE-002 (Authentication) is implemented: instructor vs. student role detection is available via the auth store (`apps/web/stores/auth.store.ts`) and Next.js session (next-auth v5, JWT strategy, CredentialsProvider). Route-level role guards protect instructor-only pages (`/upload`, `/edit`).
- The API client (`apps/web/lib/api.ts`) connects to the Fastify backend; material CRUD endpoints are assumed to exist with the response shapes defined in Section 4.5.
- The base API client at `apps/web/lib/api.ts` will be restructured to `apps/web/lib/api/index.ts` (re-exporting the singleton client) to support domain-specific API modules such as `apps/web/lib/api/materials.ts`.

### 2.2 Markdown Content Assumptions

- All lecture materials are stored as Markdown text (UTF-8) in the backend database.
- Material content may include: headings, paragraphs, lists, tables, blockquotes, fenced code blocks with language identifiers, inline code, bold/italic, links, images (hosted on CDN or relative paths), and math expressions (LaTeX enclosed in `$...$` and `$$...$$`).
- Image URLs in Markdown point to publicly accessible CDN endpoints; `next/image` optimization via `remotePatterns` is configured in `next.config.ts`.
- Material file uploads accept `.md` files (UTF-8) and plain text paste. Maximum file size: 10 MB.
- Custom callout syntax (educational extensions): `> [!NOTE]`, `> [!WARNING]`, `> [!TIP]`, `> [!IMPORTANT]` as per GitHub Flavored Markdown alert convention.

### 2.3 Inline Q&A Integration Assumptions

- The Q&A popup system is defined in SPEC-FE-006. This SPEC defines the text selection trigger mechanism only (the glue layer), not the popup UI or Q&A data layer.
- The trigger contract: when a user selects text in the material viewer, a floating action button (or tooltip) appears. Clicking it invokes `openQaPopup(selectedText, anchorRect, materialId, sectionId)` from the Q&A store defined in FE-006.
- On mobile (< 768px), text selection triggers a native context-menu-like action sheet instead of a floating button.

### 2.4 Scope Exclusions

- WebSocket real-time updates for Q&A threads within the viewer are out of scope (FE-006).
- Collaborative editing (real-time shared editor) is out of scope.
- PDF or non-Markdown format support is out of scope.
- Version history diff view is out of scope for this SPEC.
- Print-friendly styles are optional (marked [OPTIONAL] in requirements).

---

## 3. Requirements

### 3.1 Markdown Rendering Engine (REQ-FE-300 through REQ-FE-314)

#### REQ-FE-300: Core Markdown Renderer Component

The system shall provide a `MarkdownRenderer` component that transforms Markdown text into semantically correct, styled HTML using react-markdown with the configured plugin pipeline.

- Located at `apps/web/components/markdown/MarkdownRenderer.tsx`
- Accepts props: `content: string`, `className?: string`, `components?: MarkdownComponents`
- Plugin pipeline (in order):
  1. `remark-gfm` -- tables, strikethrough, task lists, autolinks
  2. `remark-math` -- math block and inline delimiter parsing
  3. Custom `remark-callout` plugin -- converts `> [!TYPE]` blocks to callout nodes
  4. `rehype-katex` -- renders math nodes to KaTeX HTML
  5. `rehype-highlight` -- applies syntax highlighting CSS classes
  6. `rehype-sanitize` -- sanitizes output to prevent XSS
- All rendering is done on the client side (Client Component) to support interactive features (text selection, scroll spy)

#### REQ-FE-301: GitHub Flavored Markdown Support

The system shall render all GFM elements correctly.

- Tables with responsive horizontal scroll wrapper on mobile
- Strikethrough text
- Task list checkboxes (read-only in viewer, editable in editor)
- Autolinked URLs

#### REQ-FE-302: Syntax Highlighting for Code Blocks

The system shall apply syntax highlighting to fenced code blocks using highlight.js via `rehype-highlight`.

- Language auto-detection fallback when language identifier is absent
- Supported languages: JavaScript/TypeScript, Python, Java, C/C++, Go, Rust, SQL, Shell/Bash, JSON, YAML, HTML/CSS, Markdown (minimum set)
- Copy-to-clipboard button overlaid on each code block (top-right corner)
- Line numbers display (optional, toggled by user or always-on setting)
- Code block scrolls horizontally on overflow (no line wrapping)
- Dark mode syntax theme aligned with the design token dark palette

#### REQ-FE-303: Math and LaTeX Rendering

The system shall render LaTeX math expressions using KaTeX via `rehype-katex`.

- Inline math: `$...$` delimiter
- Block math: `$$...$$` delimiter
- KaTeX CSS loaded globally in `globals.css` (or via dynamic import)
- Graceful error fallback: if KaTeX fails to parse, display the raw expression in a `<code>` element with an error indicator
- If KaTeX is not configured, the system shall not display blank spaces where math should appear

#### REQ-FE-304: Educational Callout Blocks

The system shall render educational callout blocks for the `> [!TYPE]` GFM alert syntax.

- Supported types: `NOTE` (blue/info), `TIP` (green/emerald), `WARNING` (amber), `IMPORTANT` (violet), `CAUTION` (red)
- Each callout renders with: colored left border, icon (Lucide React), colored background tint, bold type label, and body text
- Design tokens sourced from semantic color palette (SPEC-UI-001)

#### REQ-FE-305: Custom Image Rendering

**When** the Markdown content includes an image, **then** the system shall render it using `next/image` for optimization.

- Custom `img` renderer in `MarkdownRenderer` `components` prop
- Width and height inferred or set to a responsive default
- `alt` text preserved for accessibility
- `loading="lazy"` for images below the fold
- Images are wrapped in a `<figure>` with optional `<figcaption>` if alt text is present

#### REQ-FE-306: Typography Optimization for Long-Form Reading

The system shall apply typography styles optimized for long-form reading within the material viewer.

- `apps/web/styles/markdown.css` or Tailwind `prose` equivalent with design token overrides
- Line height: 1.75-1.875 for body text within Markdown
- Maximum content width: 72ch (approximately 700px) centered within the content area
- Heading spacing: generous top margin for `h2`, `h3`, `h4` to visually separate sections
- Link underline style: underline on hover only (desktop); always underlined on mobile
- Blockquote: left border + italic + muted text color

#### REQ-FE-307: Markdown Processing Utility Module

The system shall provide a utility module for Markdown processing operations.

- Located at `apps/web/lib/markdown/index.ts`
- Functions:
  - `extractHeadings(content: string): TocItem[]` -- parse headings for ToC generation
  - `extractTextContent(content: string): string` -- strip markdown syntax for plain text
  - `estimateReadingTime(content: string): number` -- word count / 200 wpm, returns minutes
  - `sanitizeMarkdown(content: string): string` -- basic input sanitization before storage
- All functions are pure (no React dependencies), usable in both client and server contexts

#### REQ-FE-308: Code Block Copy Functionality

**When** a user clicks the copy button on a code block, **then** the system shall copy the code content to the clipboard and display a transient "Copied!" confirmation.

- Copy button appears on hover (desktop) or is always visible (mobile)
- Confirmation tooltip fades out after 2 seconds
- Uses the Clipboard API with graceful fallback (`execCommand` for older browsers)
- The button is keyboard accessible (Tab-focusable, Enter/Space triggers copy)

#### REQ-FE-309: Markdown Sanitization

**If** the Markdown content contains potentially dangerous HTML or scripts, **then** the system shall sanitize the output before rendering to prevent XSS attacks.

- `rehype-sanitize` with a permissive allowlist that allows: standard HTML elements, `class` attribute for code blocks, `id` attributes for heading anchors, `data-*` attributes for callouts
- Inline `<script>` and `<style>` tags are always stripped
- `javascript:` href values are stripped from links
- Event handler attributes (`onclick`, `onload`, etc.) are always stripped

#### REQ-FE-310: Heading Anchor Links

The system shall add anchor links to all headings (`h2`, `h3`, `h4`) in the rendered Markdown.

- Auto-generated `id` attribute from heading text (slug: lowercase, spaces to hyphens, special chars stripped)
- A `#` anchor icon appears to the right of the heading text on hover
- Clicking the anchor copies the URL with the fragment to the clipboard
- Heading IDs are used by the Table of Contents scroll spy

---

### 3.2 Material Viewer (REQ-FE-315 through REQ-FE-329)

#### REQ-FE-315: Material Viewer Page

The system shall provide a material viewer page at `(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx` that renders a full-screen reading experience for a single lecture material.

- Server Component: fetches material metadata on the server
- Client Component boundary at `MaterialViewerClient.tsx` for interactive features
- Page `<title>`: `{material.title} | {course.title} | lecture-moa`
- TanStack Query key: `['materials', courseId, materialId]`

#### REQ-FE-316: Table of Contents (ToC) Component

**While** the material content has two or more headings at `h2` or deeper level, the system shall display a Table of Contents component.

- Located at `apps/web/components/materials/TableOfContents.tsx`
- Desktop (>= 1280px): fixed right panel (240px wide), sticky positioned
- Tablet (768px-1279px): collapsible floating panel triggered by a ToC button in the top toolbar
- Mobile (< 768px): accessible via a dedicated "Table of Contents" bottom sheet (Sheet from shadcn/ui)
- ToC items: rendered as a nested list reflecting heading hierarchy (`h2` > `h3` > `h4`)
- Active item: highlighted based on scroll position (scroll spy)
- Clicking a ToC item: smooth scrolls to the corresponding heading anchor

#### REQ-FE-317: Scroll Spy for Active ToC Item

**While** the user is scrolling through the material content, the system shall highlight the ToC item corresponding to the currently visible section.

- `useScrollSpy` hook at `apps/web/hooks/materials/useScrollSpy.ts`
- Observes heading elements using `IntersectionObserver` with `rootMargin: '-10% 0px -80% 0px'`
- Updates the active heading ID in the material Zustand store
- Debounced to prevent excessive re-renders during fast scrolling

#### REQ-FE-318: Reading Progress Indicator

The system shall display a reading progress indicator showing the user's scroll position within the material.

- Thin progress bar at the top of the viewport (full width), height: 3px
- Color: primary brand color (from design tokens)
- Progress calculated as: `scrollY / (documentHeight - viewportHeight) * 100`
- Located at `apps/web/components/materials/ReadingProgressBar.tsx`
- Accessible: `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`

#### REQ-FE-319: Material Toolbar

The system shall provide a top toolbar in the material viewer with navigation and utility actions.

- Located at `apps/web/components/materials/MaterialToolbar.tsx`
- Elements:
  - Back navigation (chevron left + course name)
  - Material title (truncated)
  - Reading time estimate (from `estimateReadingTime()`)
  - ToC toggle button (tablet/mobile)
  - Font size toggle (sm / md / lg)
  - Fullscreen toggle (optional)
  - For instructors: Edit button linking to `/edit`
- Sticky at the top of the content area (below the app header)

#### REQ-FE-320: Inline Q&A Text Selection Trigger

**When** a student selects text in the material viewer content area, the system shall display a floating action button that allows them to initiate a Q&A question linked to the selected passage.

- Located at `apps/web/components/materials/QaSelectionTrigger.tsx`
- Detects `selectionchange` event via `document.addEventListener`
- **If** no text is selected or selection is collapsed, **then** the trigger button shall not be visible
- Trigger button appears near the selection end point (via `getBoundingClientRect()` of the selection range)
- Button label: "Ask a question" with a chat icon (Lucide `MessageCircleQuestion`)
- On click: calls `openQaPopup(selectedText, anchorRect, materialId, headingId)` -- contract defined in SPEC-FE-006
- **Where** the device is touch-based (mobile), the trigger uses a long-press gesture or appears in the native text selection menu via `SelectionChangeEvent`
- **If** the user role is `"instructor"` (role check from auth store), the trigger shall not be shown

#### REQ-FE-321: Material Viewer Zustand Store

The system shall manage material viewer UI state in a dedicated Zustand store.

- Located at `apps/web/stores/material.store.ts`
- State:
  - `activeHeadingId: string | null` -- currently visible section (scroll spy)
  - `isTocOpen: boolean` -- ToC panel visibility (tablet/mobile)
  - `fontSize: 'sm' | 'md' | 'lg'` -- user reading preference
  - `isFullscreen: boolean` -- fullscreen reading mode
  - `selectedText: string | null` -- current text selection for Q&A trigger
  - `selectionAnchorRect: DOMRect | null` -- position data for Q&A popup
- Actions: `setActiveHeading`, `toggleToc`, `setTocOpen`, `setFontSize`, `toggleFullscreen`, `setSelection`, `clearSelection`
- `fontSize` preference persisted to localStorage via Zustand `persist` middleware
- Store follows `*.store.ts` naming convention (e.g., `material.store.ts`)

#### REQ-FE-322: Material Navigation (Previous / Next)

The system shall provide navigation controls to move between materials within the same course.

- Previous and Next material links at the bottom of the material content
- Displays previous/next material titles with truncation
- Fetched from the material list (ordering by course position)
- Keyboard shortcut: left/right arrow keys (when not in an input) navigate previous/next material

#### REQ-FE-323: Material Metadata Display

The system shall display material metadata above the main content.

- Material title (heading level 1)
- Author name and avatar
- Created/updated date (formatted via `packages/shared/src/utils/date.ts`)
- Read time estimate
- Tag list (Badge components from SPEC-FE-001)
- Status badge (published / draft) -- only visible to instructors

#### REQ-FE-324: Loading State for Material Viewer

**When** the material content is being fetched, the system shall display skeleton loading states for the material viewer.

- `MaterialViewerSkeleton.tsx` component at `apps/web/components/materials/`
- Skeleton items: toolbar skeleton, ToC skeleton (desktop), title skeleton, paragraph skeleton lines (8-12 rows), metadata skeleton
- Consistent with SPEC-UI-001 loading state design

#### REQ-FE-325: Error State for Material Viewer

**If** the material fetch fails or the material is not found, the system shall display an appropriate error state.

- 404 state: "Material not found" with a link back to the course materials list
- Network error state: retry button + error message
- Access denied state (student accessing draft): "This material is not yet published"

#### REQ-FE-326: Font Size Adjustment

**When** the user changes the font size setting in the material toolbar, the system shall adjust the reading typography size.

- Three sizes: `sm` (15px body), `md` (16px body, default), `lg` (18px body)
- CSS custom property `--material-font-size` applied to the content container
- Preference persisted in the material store (localStorage)

#### REQ-FE-327: Keyboard Navigation in Material Viewer

The system shall support keyboard navigation shortcuts within the material viewer.

- `[` / `]`: Previous / Next section (jumps to previous/next heading)
- `t`: Toggle Table of Contents panel (tablet/mobile)
- `f`: Toggle fullscreen mode
- Shortcuts are disabled when focus is inside an input, textarea, or contenteditable element

#### REQ-FE-328: Print-Friendly Styles [OPTIONAL]

**Where** print-friendly rendering is desired, the system shall provide CSS print styles for material content.

- `@media print` styles in `markdown.css`
- Hide: sidebar, toolbar, ToC panel, reading progress bar, Q&A trigger button
- Show: full material content with page breaks at major headings
- Font size: 12pt; line height: 1.5; maximum width: 100%

#### REQ-FE-329: Material Viewer Accessibility

The system shall ensure the material viewer meets WCAG 2.1 AA standards.

- All interactive elements are keyboard accessible and have visible focus indicators
- `aria-label` on icon-only buttons (copy, font size, ToC toggle)
- Reading progress bar has `role="progressbar"` with `aria-valuenow`
- Q&A trigger button has `aria-label="Ask a question about the selected text"`
- Heading anchor links have `aria-label="{heading text}, anchor link"`
- Skip navigation link to main content area

---

### 3.3 Material List Page (REQ-FE-330 through REQ-FE-337)

#### REQ-FE-330: Material List Page

The system shall provide a material list page at `(dashboard)/courses/[courseId]/materials/page.tsx` showing all materials in a course.

- Server Component for initial data, Client Component boundary for interactive filtering
- Page title: `Materials | {course.title}`
- TanStack Query key: `['materials', courseId, { search, filter, sort }]`
- Default sort: `position ASC` (course-defined order)
- Pagination: infinite scroll or page-based (preference: infinite scroll with `useInfiniteQuery`)

#### REQ-FE-331: Material Card Component

The system shall provide a `MaterialCard` component for displaying a single material in the list.

- Located at `apps/web/components/materials/MaterialCard.tsx`
- Displays:
  - Material title
  - Excerpt (first 150 characters of plain text, via `extractTextContent()`)
  - Estimated read time
  - Author avatar and name
  - Last updated date
  - Tag badges
  - Status badge (draft/published) -- instructor only
  - Q&A count indicator
- Card click navigates to material viewer
- Instructor actions (edit, delete, toggle publish) in a dropdown menu on the card

#### REQ-FE-332: Material Search

**When** the user types in the search input on the material list page, the system shall filter materials by title and content.

- Search input with debounce (300ms) using `useDebounce` hook
- Search is performed server-side via API query parameter `?search=`
- Search clears when the input is emptied
- "No results" empty state with search query displayed

#### REQ-FE-333: Material Filtering and Sorting

The system shall provide filter and sort controls for the material list.

- Filter: by tag (multi-select), by status (published/draft, instructor only)
- Sort: by position (default), by title A-Z, by date (newest first, oldest first), by read time
- Filters and sort state persist in URL search params (via `useSearchParams` + `useRouter`)
- "Clear filters" button when any filter is active

#### REQ-FE-334: Material List Empty State

**If** the course has no materials, the system shall display an empty state with a call-to-action.

- Empty state illustration or icon
- Message: "No materials yet" for students; "No materials yet. Upload your first material." for instructors
- Instructor: Primary "Upload Material" button linking to `/upload`
- Student: Secondary text suggesting they check back later

#### REQ-FE-335: Material List Loading State

**When** materials are being fetched, the system shall display skeleton loading cards.

- 4 skeleton `MaterialCard` placeholders
- Consistent with SPEC-UI-001 loading state design

#### REQ-FE-336: Material Deletion (Instructor Only)

**When** an instructor selects "Delete" from the material card dropdown menu, **then** the system shall prompt for confirmation before deleting.

- Confirmation Dialog (shadcn/ui Dialog) with material title and irreversibility warning
- On confirm: optimistic delete from TanStack Query cache, then API call
- On API error: rollback optimistic update, display error toast
- **If** the user role is `"student"`, **then** the delete option shall not be rendered in the DOM

#### REQ-FE-337: Material Publish Toggle (Instructor Only)

**When** an instructor toggles the publish status of a material, the system shall update the material status immediately.

- Toggle accessible from material card dropdown and material viewer toolbar (instructor view)
- Optimistic update in TanStack Query cache
- Toast notification on success/failure

---

### 3.4 Material Upload Page (Instructor Only) (REQ-FE-340 through REQ-FE-348)

#### REQ-FE-340: Material Upload Page

The system shall provide a material upload page at `(dashboard)/courses/[courseId]/materials/upload/page.tsx` accessible only to instructors.

- Route guard: **If** the current user role is not `"instructor"`, **then** redirect to the materials list page
- Page title: `Upload Material | {course.title}`
- Two upload modes: File Upload and Paste/Write (tab switcher)

#### REQ-FE-341: Markdown File Upload

**When** an instructor uploads a `.md` file, the system shall parse and preview the content before submission.

- Drag-and-drop upload area using a custom `DropZone` component (or `react-dropzone`)
- Accepted MIME types: `text/markdown`, `text/plain` with `.md` extension
- Maximum file size: 10 MB (validated client-side before upload)
- On file drop/selection: read file as UTF-8 text, populate the content field
- **If** file exceeds 10 MB, **then** display an error and reject the file without uploading
- **If** file is not a recognized Markdown format, **then** display an error

#### REQ-FE-342: Material Metadata Form

The system shall provide a form for material metadata alongside the content.

- Fields (React Hook Form + Zod validation):
  - `title` (required, 1-200 characters)
  - `tags` (optional, max 10 tags, each max 50 characters)
  - `status` (`draft` | `published`, default: `draft`)
  - `position` (optional integer; ordering within the course)
- All fields validated on submit and on blur
- Error messages displayed inline below each field

#### REQ-FE-343: Upload Preview

**When** content is loaded (via file upload or pasting), the system shall display a live Markdown preview.

- Split-pane layout: form + content textarea on the left, rendered preview on the right
- Preview uses the same `MarkdownRenderer` component as the viewer
- On mobile: tabs toggle between "Edit" and "Preview"
- Preview updates are debounced (500ms) to prevent excessive re-renders during rapid typing

#### REQ-FE-344: Upload Submission

**When** the instructor submits the upload form, the system shall validate all fields and send the material to the API.

- Submit button shows loading spinner during API call
- On success: redirect to the newly created material viewer
- On validation error: display inline field errors, do not submit
- On API error: display error toast with the error message

#### REQ-FE-345: Upload Form Validation Schema

The system shall validate material upload using a Zod schema in the shared package.

- Located at `packages/shared/src/validators/material.schema.ts`
- `CreateMaterialSchema`:
  - `title`: `z.string().min(1).max(200)`
  - `content`: `z.string().min(1).max(1_000_000)` (max 1 MB of text)
  - `tags`: `z.array(z.string().max(50)).max(10).optional()`
  - `status`: `z.enum(['draft', 'published']).default('draft')`
  - `position`: `z.number().int().min(0).optional()`

#### REQ-FE-346: Upload Drag-and-Drop Accessibility

The system shall make the upload drop zone accessible via keyboard.

- Drop zone is keyboard focusable (Tab order)
- `Enter` or `Space` opens the file picker
- `role="button"` and `aria-label="Upload Markdown file. Drag and drop or press Enter to browse."`
- Visual focus indicator consistent with design tokens

#### REQ-FE-347: Upload Content Size Warning

**If** the pasted or loaded content exceeds 500 KB, the system shall display a warning about potential rendering performance impact.

- Warning banner (amber callout style) above the preview pane
- Warning does not block submission (the hard limit is 1 MB)

#### REQ-FE-348: Upload Unsaved Changes Warning

**If** the upload form has unsaved changes and the user attempts to navigate away, the system shall prompt for confirmation.

- Uses `useBeforeUnload` hook and App Router navigation guard pattern
- Confirmation Dialog: "You have unsaved changes. Are you sure you want to leave?"

---

### 3.5 Material Editor Page (Instructor Only) (REQ-FE-350 through REQ-FE-358)

#### REQ-FE-350: Material Editor Page

The system shall provide a Markdown editor page at `(dashboard)/courses/[courseId]/materials/[materialId]/edit/page.tsx` accessible only to instructors.

- Route guard: same as upload page (instructor only)
- Page title: `Edit: {material.title}`
- Fetches existing material content on load via TanStack Query

#### REQ-FE-351: Markdown Editor Component

The system shall provide a Markdown editor component with syntax highlighting and toolbar.

- Located at `apps/web/components/markdown/MarkdownEditor.tsx`
- Editor library: `@uiw/react-md-editor` (preferred for its built-in toolbar) or a CodeMirror 6 custom implementation
- Features:
  - Syntax highlighting in the editor pane (editor-side highlighting)
  - Toolbar: Bold, Italic, Strikethrough, Heading (h2/h3/h4), Link, Image, Code, Code Block, Ordered List, Unordered List, Task List, Table, Horizontal Rule, Math Block, Callout (custom toolbar button)
  - Full-screen editor mode
  - Line numbers (optional toggle)
  - Word count display in the status bar

#### REQ-FE-352: Live Preview Pane

**While** the editor is active, the system shall display a live preview pane using the `MarkdownRenderer` component.

- Split-pane layout (50/50 by default, resizable drag handle optional)
- Preview debounced 500ms after last keystroke
- Scroll sync between editor and preview (optional, best-effort)
- On mobile: toggle between editor and preview tabs

#### REQ-FE-353: Editor Autosave

**While** the editor has unsaved changes, the system shall automatically save a draft to localStorage every 30 seconds.

- Autosave indicator in the toolbar: "Saving..." then "Saved {time}" then "Unsaved changes"
- On page load: **If** a localStorage draft for the same `materialId` exists and is newer than the server version, prompt to restore
- Draft key: `material-draft-{materialId}`

#### REQ-FE-354: Editor Save and Publish

The system shall provide explicit save controls in the editor.

- "Save Draft" button: saves with `status: 'draft'`, does not redirect
- "Save and Publish" button: saves with `status: 'published'`, shows confirmation dialog if currently draft
- Both buttons show loading state during API call
- On success: update TanStack Query cache for the material, display success toast
- On error: display error toast, retain editor content

#### REQ-FE-355: Editor Keyboard Shortcuts

The system shall support standard Markdown editor keyboard shortcuts.

- `Ctrl/Cmd + B`: Bold
- `Ctrl/Cmd + I`: Italic
- `Ctrl/Cmd + K`: Insert link
- `Ctrl/Cmd + S`: Save draft (intercept browser save)
- `Ctrl/Cmd + Shift + P`: Toggle preview mode
- `Ctrl/Cmd + Shift + F`: Toggle fullscreen

#### REQ-FE-356: Editor Image Upload

**When** an instructor pastes an image or uses the image toolbar button, the system shall upload the image to the backend and insert the Markdown image syntax.

- Paste event handler on the editor container
- Image file accepted types: `image/png`, `image/jpeg`, `image/gif`, `image/webp`
- On paste/drop: POST image to `POST /api/courses/:courseId/materials/images`
- On success: insert `![alt text](imageUrl)` at cursor position
- Loading indicator while uploading
- **If** upload fails, display error toast and do not insert broken image syntax

#### REQ-FE-357: Editor Conflict Detection

**If** the material was updated on the server while the editor was open, the system shall notify the instructor.

- On editor open: store the `updatedAt` timestamp from the fetched material
- Before save: compare with server's current `updatedAt` (via TanStack Query `refetch`)
- **If** timestamps differ: display a conflict warning dialog with options to overwrite or discard local changes

#### REQ-FE-358: Editor Unsaved Changes Warning

Same as REQ-FE-348 -- applies to the editor page as well.

---

### 3.6 Shared Types Enrichment (REQ-FE-360 through REQ-FE-365)

#### REQ-FE-360: Material Type Definitions

The system shall provide comprehensive TypeScript type definitions for the material domain.

- Located at `packages/shared/src/types/material.types.ts`
- Types:

```typescript
export type MaterialStatus = 'draft' | 'published';

export interface Material {
  id: string;
  courseId: string;
  title: string;
  content: string;          // Full Markdown text
  excerpt: string;          // First 150 chars of plain text (server-generated)
  status: MaterialStatus;
  position: number;
  tags: string[];
  readTimeMinutes: number;  // Server or client-computed
  authorId: string;
  author: {
    id: string;
    name: string;
    avatarUrl: string | null;
  };
  qaCount: number;
  createdAt: string;        // ISO 8601
  updatedAt: string;        // ISO 8601
}

export interface MaterialListItem extends Omit<Material, 'content'> {
  // List view excludes full content for performance
}

export interface CreateMaterialDto {
  title: string;
  content: string;
  tags?: string[];
  status?: MaterialStatus;
  position?: number;
}

export interface UpdateMaterialDto extends Partial<CreateMaterialDto> {
  id: string;
}

export interface TocItem {
  id: string;
  level: 2 | 3 | 4;
  text: string;
  children: TocItem[];
}

export interface MaterialFilters {
  search?: string;
  tags?: string[];
  status?: MaterialStatus;
}

export type MaterialSortKey = 'position' | 'title' | 'createdAt' | 'updatedAt' | 'readTimeMinutes';
export type SortOrder = 'asc' | 'desc';

export interface MaterialSortOptions {
  key: MaterialSortKey;
  order: SortOrder;
}
```

#### REQ-FE-361: Material Validation Schema

The system shall provide Zod validation schemas for material operations.

- Located at `packages/shared/src/validators/material.schema.ts`
- Schemas:
  - `CreateMaterialSchema` (see REQ-FE-345)
  - `UpdateMaterialSchema`: all fields optional except `id`
  - `MaterialFiltersSchema`: optional search, tags array, status enum
  - `MaterialSortSchema`: key enum + order enum

#### REQ-FE-362: TanStack Query Hooks for Materials

The system shall provide custom TanStack Query hooks for material data operations.

- Located at `apps/web/hooks/materials/`
- Hooks:
  - `useMaterial(courseId, materialId)` -- fetch single material with full content
  - `useMaterials(courseId, filters, sort)` -- fetch paginated material list
  - `useCreateMaterial()` -- mutation for material creation
  - `useUpdateMaterial()` -- mutation for material update
  - `useDeleteMaterial()` -- mutation for material deletion
  - `useToggleMaterialStatus()` -- mutation for publish/unpublish
  - `useUploadMaterialImage()` -- mutation for image upload within editor

#### REQ-FE-363: Material API Client Functions

The system shall provide typed API client functions for material operations.

- Located at `apps/web/lib/api/materials.ts`
- Imports the base API client singleton from `~/lib/api` (restructured from `lib/api.ts` to `lib/api/index.ts`)
- Functions:
  - `getMaterials(courseId, params): Promise<PaginatedResponse<MaterialListItem>>`
  - `getMaterial(courseId, materialId): Promise<Material>`
  - `createMaterial(courseId, dto): Promise<Material>`
  - `updateMaterial(courseId, materialId, dto): Promise<Material>`
  - `deleteMaterial(courseId, materialId): Promise<void>`
  - `toggleMaterialStatus(courseId, materialId): Promise<Material>`
  - `uploadMaterialImage(courseId, file: File): Promise<{ url: string }>`

#### REQ-FE-364: useScrollSpy Hook

The system shall provide a reusable `useScrollSpy` hook for tracking active headings.

- Located at `apps/web/hooks/materials/useScrollSpy.ts`
- Signature: `useScrollSpy(headingIds: string[], options?: IntersectionObserverInit): string | null`
- Returns the `id` of the currently active (visible) heading
- Uses `IntersectionObserver` for performance over scroll event listeners
- Cleans up observers on unmount

#### REQ-FE-365: useReadingProgress Hook

The system shall provide a `useReadingProgress` hook for calculating scroll-based reading progress.

- Located at `apps/web/hooks/materials/useReadingProgress.ts`
- Signature: `useReadingProgress(containerRef?: RefObject<HTMLElement>): number`
- Returns a number from 0 to 100 representing percentage
- Uses `requestAnimationFrame` for smooth updates
- Falls back to `document.documentElement` if no container ref is provided

---

### 3.7 Unwanted Behavior Requirements

#### REQ-FE-N10: No Raw HTML Injection

**If** the Markdown content contains inline HTML that is not in the sanitization allowlist, **then** the system shall not render it.

#### REQ-FE-N11: No Blocking Render for KaTeX Failure

**If** KaTeX fails to parse a math expression, **then** the system shall not block the rest of the material from rendering.

#### REQ-FE-N12: No Full Page Re-render on ToC Click

**When** a user clicks a ToC item, the system shall not trigger a full page navigation or re-render; only the scroll position shall change.

#### REQ-FE-N13: No Instructor-Only Actions for Students

**If** the current user's role is `"student"`, **then** the edit, delete, and publish toggle controls shall not be rendered in the DOM.

#### REQ-FE-N14: No Unsanitized Content in localStorage

**If** material draft content is stored in localStorage, the system shall not store unvalidated or potentially malicious content without first applying `sanitizeMarkdown()`.

#### REQ-FE-N15: No Material Content in List API Response

The material list API response shall not include the full `content` field to avoid large payload sizes; only `MaterialListItem` (content excluded) is returned.

---

## 4. Specifications

### 4.1 Component Architecture

```
apps/web/components/
  markdown/
    MarkdownRenderer.tsx           # Core rendering engine
    MarkdownEditor.tsx             # Editor component (instructor)
    CodeBlock.tsx                  # Code block with copy button
    MathBlock.tsx                  # KaTeX math block wrapper
    Callout.tsx                    # Educational callout block
    HeadingWithAnchor.tsx          # Heading with anchor link
  materials/
    MaterialCard.tsx               # Material list card
    MaterialToolbar.tsx            # Viewer top toolbar
    TableOfContents.tsx            # ToC panel
    ReadingProgressBar.tsx         # Scroll progress indicator
    QaSelectionTrigger.tsx         # Text selection Q&A trigger
    MaterialViewerSkeleton.tsx     # Loading skeleton
    MaterialCardSkeleton.tsx       # List card skeleton
    MaterialMetadata.tsx           # Title, author, date, tags
    MaterialNavigation.tsx         # Prev/next navigation
    DropZone.tsx                   # File upload drop zone
```

### 4.2 Page Structure

```
apps/web/app/(dashboard)/courses/[courseId]/materials/
  page.tsx                         # Material list page
  loading.tsx                      # List skeleton
  error.tsx                        # List error boundary
  upload/
    page.tsx                       # Upload page (instructor)
  [materialId]/
    page.tsx                       # Material viewer
    loading.tsx                    # Viewer skeleton
    error.tsx                      # Viewer error boundary
    not-found.tsx                  # 404 for invalid materialId
    edit/
      page.tsx                     # Editor page (instructor)
```

### 4.3 Library Files

```
apps/web/lib/
  markdown/
    index.ts                       # Barrel: extractHeadings, extractTextContent, estimateReadingTime, sanitizeMarkdown
    plugins/
      remark-callout.ts            # Custom remark plugin for callout blocks
    highlight-theme.css            # highlight.js theme (matches design tokens)
  api/
    index.ts                       # Re-export base API client singleton (restructured from lib/api.ts)
    materials.ts                   # API client functions for materials
apps/web/styles/
  markdown.css                     # Long-form reading typography, code block styles, callout styles, print styles
```

### 4.4 Hooks

```
apps/web/hooks/
  materials/
    useScrollSpy.ts                # IntersectionObserver-based heading tracker
    useReadingProgress.ts          # Scroll-based reading progress (0-100)
    useMaterial.ts                 # TanStack Query: single material
    useMaterials.ts                # TanStack Query: paginated list
    useCreateMaterial.ts           # Mutation hook
    useUpdateMaterial.ts           # Mutation hook
    useDeleteMaterial.ts           # Mutation hook
    useToggleMaterialStatus.ts     # Mutation hook
    useUploadMaterialImage.ts      # Mutation hook
  useDebounce.ts                   # Generic debounce hook (if not already in FE-001)
  useBeforeUnload.ts               # Navigation guard hook
```

### 4.5 API Contract (Expected Backend Endpoints)

The following REST endpoints are expected from the Fastify backend (apps/api). This SPEC defines the contract; the backend implementation is out of scope here.

| Method | Path | Auth | Body | Response |
|--------|------|------|------|----------|
| GET | `/api/courses/:courseId/materials` | Any authenticated | -- | `PaginatedResponse<MaterialListItem>` |
| GET | `/api/courses/:courseId/materials/:materialId` | Any authenticated | -- | `Material` |
| POST | `/api/courses/:courseId/materials` | instructor | `CreateMaterialDto` | `Material` |
| PATCH | `/api/courses/:courseId/materials/:materialId` | instructor | `UpdateMaterialDto` | `Material` |
| DELETE | `/api/courses/:courseId/materials/:materialId` | instructor | -- | `204 No Content` |
| PATCH | `/api/courses/:courseId/materials/:materialId/status` | instructor | `{ status: MaterialStatus }` | `Material` |
| POST | `/api/courses/:courseId/materials/images` | instructor | `multipart/form-data` | `{ url: string }` |

Query parameters for `GET /materials`:
- `search?: string`
- `tags?: string` (comma-separated)
- `status?: 'draft' | 'published'` (instructor only; students always see `published`)
- `sort?: MaterialSortKey`
- `order?: 'asc' | 'desc'`
- `page?: number` (default: 1)
- `limit?: number` (default: 20, max: 100)

### 4.6 Zustand Store Specification

```typescript
// apps/web/stores/material.store.ts
interface MaterialState {
  activeHeadingId: string | null;
  isTocOpen: boolean;
  fontSize: 'sm' | 'md' | 'lg';
  isFullscreen: boolean;
  selectedText: string | null;
  selectionAnchorRect: DOMRect | null;
}

interface MaterialActions {
  setActiveHeading: (id: string | null) => void;
  toggleToc: () => void;
  setTocOpen: (open: boolean) => void;
  setFontSize: (size: 'sm' | 'md' | 'lg') => void;
  toggleFullscreen: () => void;
  setSelection: (text: string, rect: DOMRect) => void;
  clearSelection: () => void;
}
```

Persistence: `fontSize` key persisted to localStorage via Zustand `persist` middleware.

### 4.7 Markdown Plugin Pipeline Configuration

```typescript
// apps/web/components/markdown/MarkdownRenderer.tsx (conceptual)

// remark plugins (transform AST before HTML conversion):
const remarkPlugins = [
  remarkGfm,          // GFM: tables, strikethrough, task lists
  remarkMath,         // Math: $...$ and $$...$$
  remarkCallout,      // Custom: > [!NOTE] callout blocks
];

// rehype plugins (transform HTML AST):
const rehypePlugins = [
  [rehypeKatex, { strict: false, throwOnError: false }],
  [rehypeHighlight, { detect: true, ignoreMissing: true }],
  [rehypeSanitize, customSanitizeSchema],  // allowlist-based
];
```

### 4.8 Responsive Layout for Material Viewer

```
Desktop (>= 1280px):
+----------------------------------------------------------+
|  [App Sidebar 256px]  |  [Material Content 72ch max]  |  [ToC Panel 240px]  |
+----------------------------------------------------------+

Tablet (768px-1279px):
+----------------------------------------------+
|  [Collapsed Sidebar 64px]  |  [Material Content]  [ToC Button]  |
+----------------------------------------------+
  (ToC opens as floating panel or sheet)

Mobile (< 768px):
+---------------------+
|  [Material Content] |
|  [Bottom Tab Nav]   |
+---------------------+
  (ToC accessible via bottom sheet)
```

### 4.9 Traceability Matrix

| Requirement | Design Reference (.pen) | Related SPEC |
|------------|------------------------|-------------|
| REQ-FE-300-310 (Markdown Engine) | material-viewer.pen (content area) | SPEC-FE-001 (foundation utilities) |
| REQ-FE-315 (Viewer Page) | material-viewer.pen | SPEC-FE-005 (courses contain materials) |
| REQ-FE-316 (Table of Contents) | material-viewer.pen (right panel) | SPEC-UI-001 (spacing tokens) |
| REQ-FE-317 (Scroll Spy) | material-viewer.pen (ToC highlights) | -- |
| REQ-FE-318 (Reading Progress) | material-viewer.pen (top progress bar) | SPEC-UI-001 (primary color token) |
| REQ-FE-319 (Toolbar) | material-viewer.pen (top bar) | SPEC-FE-001 (Lucide icons, Button) |
| REQ-FE-320 (Q&A Selection Trigger) | material-viewer.pen (selection popup) | SPEC-FE-006 (Q&A popup system) |
| REQ-FE-321 (Material Store) | -- | SPEC-FE-001 (Zustand patterns) |
| REQ-FE-330 (Material List) | material-list.pen | SPEC-FE-005 (course detail) |
| REQ-FE-331 (Material Card) | material-list.pen (card component) | SPEC-UI-001 (Card, Badge, Avatar) |
| REQ-FE-332-333 (Search/Filter) | material-list.pen (filter bar) | SPEC-FE-001 (Input, Select components) |
| REQ-FE-340-348 (Upload) | material-upload.pen | SPEC-FE-002 (instructor role guard) |
| REQ-FE-350-358 (Editor) | material-editor.pen | SPEC-FE-002 (instructor role guard) |
| REQ-FE-360-365 (Types and Hooks) | -- | SPEC-FE-001 (shared package foundation) |

---

## 5. Out of Scope

The following items are explicitly excluded from SPEC-FE-004:

| Item | Covered By |
|------|-----------|
| Q&A popup UI and Q&A data management | SPEC-FE-006 |
| Course page embedding the material list | SPEC-FE-005 |
| WebSocket real-time Q&A thread updates | SPEC-FE-006 |
| Authentication / role guard implementation | SPEC-FE-002 |
| Design token system and layout infrastructure | SPEC-FE-001 |
| Quiz inline embeds within materials | Future SPEC (FE-007 or FE-008) |
| Backend API implementation (Fastify) | Backend SPEC (separate) |
| AI-based material analysis / summarization | Backend/AI SPEC (separate) |
