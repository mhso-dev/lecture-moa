---
id: SPEC-FE-004
title: "Learning Materials and Markdown Engine - Implementation Plan"
version: 2.0.0
status: draft
created: 2026-02-19
updated: 2026-02-19
---

## HISTORY

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 2.0.0 | 2026-02-19 | MoAI | Full rewrite: align file paths, store naming, role strings, and conventions with FE-001/FE-002 implementation; remove duplicate MarkdownRenderer reference; clarify lib/api restructuring; add HISTORY section |
| 1.0.0 | 2026-02-19 | MoAI | Initial implementation plan |

---

# SPEC-FE-004: Implementation Plan

## 1. Implementation Strategy

### 1.1 Development Approach

SPEC-FE-004 covers the core reading experience of the platform. The implementation follows the Hybrid methodology (TDD for new utilities, DDD for integration):

- Markdown processing utilities (`lib/markdown/`) and hooks (`useScrollSpy`, `useReadingProgress`) are new code -- TDD (RED-GREEN-REFACTOR)
- Pages and components are new code building on SPEC-FE-001 foundation -- TDD for core logic, DDD for UI integration
- Shared type enrichments (`material.types.ts`) extend existing skeletons -- DDD (ANALYZE-PRESERVE-IMPROVE)

### 1.2 Dependency Order

The implementation must follow this order due to internal dependencies:

1. Shared types and validation schemas (packages/shared)
2. API client restructuring (`lib/api.ts` -> `lib/api/index.ts` + domain modules)
3. Markdown processing utilities and plugins (`lib/markdown/`)
4. Reusable Markdown components (`components/markdown/`)
5. Material Zustand store and hooks
6. Material viewer page and interactive components (`components/materials/`)
7. Material list page
8. Upload page (instructor)
9. Editor page (instructor)

### 1.3 Key Technical Risks

| Risk | Mitigation |
|------|-----------|
| KaTeX CSS conflicts with Tailwind reset | Load KaTeX CSS in a scoped container; test in both light/dark mode |
| `rehype-sanitize` blocking valid KaTeX HTML | Configure custom sanitize schema to allow KaTeX-generated classes |
| Text selection API inconsistencies on mobile | Test on iOS Safari and Android Chrome; use `selectionchange` event with fallback |
| Editor library bundle size impact | Use dynamic import for `@uiw/react-md-editor`; measure bundle impact |
| `IntersectionObserver` scroll spy accuracy | Tune `rootMargin` values; add integration tests with mocked scroll positions |
| `lib/api.ts` to `lib/api/` restructuring | Must be coordinated with any in-progress work on other SPECs using the API client |

---

## 2. Milestones

### Primary Goal: Markdown Engine and Material Viewer

**Scope: Implement the core Markdown rendering pipeline and material viewer experience.**

Deliverables:
- `packages/shared/src/types/material.types.ts` -- full type definitions (REQ-FE-360)
- `packages/shared/src/validators/material.schema.ts` -- Zod schemas (REQ-FE-361)
- `apps/web/lib/api/index.ts` -- restructured base API client (re-export from existing `lib/api.ts`)
- `apps/web/lib/api/materials.ts` -- material-specific API client functions (REQ-FE-363)
- `apps/web/lib/markdown/index.ts` -- processing utilities (REQ-FE-307)
- `apps/web/lib/markdown/plugins/remark-callout.ts` -- custom remark plugin (REQ-FE-304)
- `apps/web/components/markdown/MarkdownRenderer.tsx` -- core renderer (REQ-FE-300)
- `apps/web/components/markdown/CodeBlock.tsx` -- code block with copy (REQ-FE-302, REQ-FE-308)
- `apps/web/components/markdown/Callout.tsx` -- educational callout (REQ-FE-304)
- `apps/web/components/markdown/HeadingWithAnchor.tsx` -- anchor headings (REQ-FE-310)
- `apps/web/components/markdown/MathBlock.tsx` -- KaTeX wrapper (REQ-FE-303)
- `apps/web/styles/markdown.css` -- typography and code styles (REQ-FE-306)
- `apps/web/lib/markdown/highlight-theme.css` -- syntax highlighting theme
- `apps/web/stores/material.store.ts` -- Zustand store (REQ-FE-321)
- `apps/web/hooks/materials/useScrollSpy.ts` (REQ-FE-364)
- `apps/web/hooks/materials/useReadingProgress.ts` (REQ-FE-365)
- All material viewer hooks in `apps/web/hooks/materials/` (REQ-FE-362)
- `apps/web/components/materials/MaterialToolbar.tsx` (REQ-FE-319)
- `apps/web/components/materials/TableOfContents.tsx` (REQ-FE-316)
- `apps/web/components/materials/ReadingProgressBar.tsx` (REQ-FE-318)
- `apps/web/components/materials/QaSelectionTrigger.tsx` (REQ-FE-320)
- `apps/web/components/materials/MaterialMetadata.tsx` (REQ-FE-323)
- `apps/web/components/materials/MaterialNavigation.tsx` (REQ-FE-322)
- `apps/web/components/materials/MaterialViewerSkeleton.tsx` (REQ-FE-324)
- `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx` (REQ-FE-315)
- Associated `loading.tsx`, `error.tsx`, `not-found.tsx`

Note: The core `MarkdownRenderer` component lives in `components/markdown/MarkdownRenderer.tsx`. The material viewer page imports it from there. Material-specific wrapper components live in `components/materials/`.

Quality gate: All Markdown rendering tests pass. Material viewer renders correctly for GFM, math, code, callout content. WCAG 2.1 AA verified for viewer interactions.

### Secondary Goal: Material List Page

**Scope: Implement the browsable material catalog for a course.**

Deliverables:
- `apps/web/components/materials/MaterialCard.tsx` (REQ-FE-331)
- `apps/web/components/materials/MaterialCardSkeleton.tsx` (REQ-FE-335)
- `apps/web/app/(dashboard)/courses/[courseId]/materials/page.tsx` (REQ-FE-330)
- Search, filter, sort integration (REQ-FE-332, REQ-FE-333)
- Empty state (REQ-FE-334)
- Delete confirmation dialog -- instructor role only (REQ-FE-336)
- Publish toggle -- instructor role only (REQ-FE-337)
- Associated `loading.tsx`, `error.tsx`

Quality gate: Material list renders with mock data. Filters update URL search params. Role-based actions (edit, delete, publish) conditionally render for `"instructor"` role only.

### Tertiary Goal: Material Upload Page (Instructor)

**Scope: Implement the instructor material upload flow.**

Deliverables:
- `apps/web/components/materials/DropZone.tsx` (REQ-FE-341)
- Upload page at `apps/web/app/(dashboard)/courses/[courseId]/materials/upload/page.tsx` (REQ-FE-340)
- Metadata form with React Hook Form + Zod (REQ-FE-342)
- Upload preview (REQ-FE-343)
- Form validation (REQ-FE-345)
- Submit flow (REQ-FE-344)
- Unsaved changes warning (REQ-FE-348)
- File size warning (REQ-FE-347)

Quality gate: Upload form validates all fields. File upload accepts .md files and rejects others. Route guard restricts access to `"instructor"` role.

### Final Goal: Material Editor Page (Instructor)

**Scope: Implement the full Markdown editor for material creation and editing.**

Deliverables:
- `apps/web/components/markdown/MarkdownEditor.tsx` (REQ-FE-351)
- Editor page at `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/edit/page.tsx` (REQ-FE-350)
- Live preview pane (REQ-FE-352)
- Autosave to localStorage (REQ-FE-353)
- Save and Publish controls (REQ-FE-354)
- Keyboard shortcuts (REQ-FE-355)
- Image paste/upload to `POST /api/courses/:courseId/materials/images` (REQ-FE-356)
- Conflict detection (REQ-FE-357)
- Unsaved changes warning (REQ-FE-358)

Quality gate: Editor renders with full toolbar. Autosave writes to localStorage. Image paste flow works. Conflict detection alerts on server-side change. Route guard restricts access to `"instructor"` role.

### Optional Goal: Print Styles and Advanced Enhancements

**Scope: Optional polish items contingent on milestone completion.**

Deliverables:
- Print-friendly CSS styles (REQ-FE-328)
- Scroll sync between editor and preview (REQ-FE-352 enhancement)
- Resizable split-pane in editor (REQ-FE-352 enhancement)
- Editor line numbers toggle

---

## 3. Technical Approach

### 3.1 Markdown Plugin Architecture

The rendering pipeline is stateless and configured at module level to avoid recreating plugin instances on each render:

```
MarkdownRenderer (components/markdown/MarkdownRenderer.tsx)
  └── react-markdown
        ├── remarkPlugins: [remarkGfm, remarkMath, remarkCallout]
        └── rehypePlugins: [rehypeKatex, rehypeHighlight, rehypeSanitize]
              └── components: {
                    code: CodeBlock,
                    h2/h3/h4: HeadingWithAnchor,
                    img: OptimizedImage,
                    blockquote: CalloutOrBlockquote,
                  }
```

Custom `remark-callout` plugin transforms:
```
> [!NOTE]
> This is a note.
```
Into a custom AST node `callout` with `type: 'NOTE'` and `children` containing the body, which the `Callout` React component then renders.

### 3.2 ToC and Scroll Spy Architecture

The ToC generation is a two-phase process:
1. `extractHeadings(content)` in `lib/markdown/index.ts` parses the raw Markdown string to build the `TocItem[]` tree (no React dependency; runs on mount or when content changes).
2. `useScrollSpy(headingIds)` observes the rendered heading DOM elements and tracks the currently visible one.

The `TableOfContents` component receives the pre-built `TocItem[]` and the active heading ID from the Zustand store (`material.store.ts`, updated by `useScrollSpy`).

### 3.3 Q&A Selection Trigger Architecture

The `QaSelectionTrigger` component:
1. Registers a `selectionchange` event listener on `document` (within a `useEffect`).
2. On selection change, reads `window.getSelection()` and checks if the selection is within the material content container (ref comparison).
3. If valid selection exists, updates `material.store` -- `selectedText` and `selectionAnchorRect` with the selection's `getBoundingClientRect()`.
4. Renders an absolutely positioned floating button based on `selectionAnchorRect`.
5. On button click, calls the Q&A store's `openQaPopup(...)` -- the contract bridge to SPEC-FE-006.

### 3.4 Editor Library Decision

`@uiw/react-md-editor` is the preferred choice because:
- It provides a production-ready toolbar with all required actions.
- It supports split-pane and preview modes built-in.
- It uses CodeMirror 5 internally (acceptable performance; CodeMirror 6 fork exists if needed).
- Bundle size impact: ~150 KB gzipped (mitigated with dynamic import).

Alternative: A pure CodeMirror 6 implementation offers better performance and customization but requires significant custom toolbar development. Use if bundle size becomes a blocking concern.

### 3.5 Image Optimization Strategy

Custom `img` renderer in `MarkdownRenderer`:
- Wraps the Markdown `![alt](src)` in a `next/image` component.
- Sets `width={0}` `height={0}` with `sizes="100vw"` and `style={{ width: '100%', height: 'auto' }}` for natural responsive sizing.
- `next.config.ts` must include `remotePatterns` for the CDN domain.

### 3.6 Bundle Size Management

| Dependency | Strategy |
|-----------|----------|
| KaTeX CSS | Import in `globals.css` (always loaded); small ~40KB |
| highlight.js | Use `rehype-highlight` with `core` import + specific language registration to reduce from 1MB to ~100KB |
| `@uiw/react-md-editor` | Dynamic import with `next/dynamic`, no SSR -- only loaded on `/edit` pages |
| `react-markdown` + remark/rehype | Statically imported (needed for viewer) |

### 3.7 API Client Restructuring

The current codebase has a flat `lib/api.ts` fetch-based singleton. This SPEC introduces the first domain-specific API module (`lib/api/materials.ts`). The restructuring approach:

1. Move `lib/api.ts` to `lib/api/index.ts` (preserve existing exports, re-export base client)
2. Create `lib/api/materials.ts` importing the base client from `~/lib/api`
3. Update existing imports across the codebase (alias `~/lib/api` still resolves to `lib/api/index.ts`)

This enables future SPECs to add their own domain modules (`lib/api/courses.ts`, `lib/api/quizzes.ts`, etc.) without modifying the base client.

---

## 4. Risk Register

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| `rehype-sanitize` strips KaTeX classes | High | High | Pre-test sanitize schema; add `katex` class to allowlist |
| Mobile text selection API varies by browser | Medium | Medium | Wrap in try/catch; add `pointerup` fallback for touch events |
| `@uiw/react-md-editor` breaks with React 19 | Medium | High | Pin to tested version; evaluate CodeMirror 6 alternative if broken |
| Large Markdown files (100KB+) cause slow render | Low | Medium | Add character limit warning in upload; consider virtual rendering for very long content |
| KaTeX not loading in production (CDN block) | Low | Low | Self-host KaTeX CSS; include in `globals.css` via npm package |
| `lib/api.ts` to `lib/api/` restructuring breaks imports | Medium | Medium | Update path aliases; verify `~/lib/api` resolves correctly after move |

---

## 5. Testing Strategy

### 5.1 Unit Tests (Vitest)

Files to test:
- `apps/web/lib/markdown/index.ts` -- `extractHeadings`, `extractTextContent`, `estimateReadingTime`, `sanitizeMarkdown`
- `apps/web/lib/markdown/plugins/remark-callout.ts` -- plugin transforms `> [!NOTE]` correctly
- `apps/web/hooks/materials/useScrollSpy.ts` -- mocked `IntersectionObserver`
- `apps/web/hooks/materials/useReadingProgress.ts` -- mocked scroll events
- `packages/shared/src/validators/material.schema.ts` -- schema validation edge cases

### 5.2 Component Tests (Vitest + React Testing Library)

Components to test:
- `MarkdownRenderer` -- renders GFM, math, code blocks, callouts from fixture content
- `CodeBlock` -- copy button clipboard interaction
- `TableOfContents` -- active item highlighting, click navigation
- `QaSelectionTrigger` -- selection detection, button appearance, Q&A store call
- `MaterialCard` -- role-based action rendering (`"instructor"` vs. `"student"`)
- Upload form -- validation errors, file rejection, success flow

### 5.3 Integration Tests (Vitest + MSW)

- Material viewer page -- full render with mocked API
- Material list page -- search/filter URL param sync
- Upload page -- form submission flow

### 5.4 E2E Tests (Playwright)

Priority flows:
1. Student reads a material: navigate to viewer, verify ToC renders, click ToC item, verify scroll, select text, verify Q&A trigger button appears
2. Student reads code block: verify syntax highlighting, click copy, verify clipboard
3. Instructor uploads a material: drop .md file, fill metadata, submit, verify redirect to viewer
4. Instructor edits a material: open editor, change content, save draft, verify autosave indicator

---

## 6. Architecture Decisions

### ADR-FE-004-001: react-markdown over Marked or Unified standalone

**Decision**: Use `react-markdown` as the Markdown rendering layer.

**Rationale**: `react-markdown` integrates natively with React's component model, allowing custom renderers for every element (code blocks, headings, images). The unified/remark/rehype plugin ecosystem is first-class. `marked` and `showdown` produce raw HTML strings, requiring `dangerouslySetInnerHTML` which bypasses React's XSS protections and makes custom component rendering impossible without additional parsing.

**Consequences**: Slightly larger bundle than `marked` (~30 KB vs ~10 KB gzipped). Accepted given the need for custom renderers and plugin pipeline.

### ADR-FE-004-002: Client-side rendering for MarkdownRenderer

**Decision**: `MarkdownRenderer` is a Client Component (`'use client'`).

**Rationale**: Interactive features (text selection, scroll spy, copy buttons) require DOM access. Server-rendering Markdown is possible with react-markdown, but the interactive overlays (Q&A trigger, copy buttons) would need client-side hydration anyway. Rendering the full component on the client simplifies the architecture and avoids hydration mismatches.

**Consequences**: Initial load requires JS execution before content is visible. Mitigated with skeleton loading state and `Suspense` boundaries.

### ADR-FE-004-003: IntersectionObserver for scroll spy over scroll events

**Decision**: Use `IntersectionObserver` for scroll spy instead of `scroll` event listeners.

**Rationale**: `scroll` events fire at high frequency and require manual throttling/debouncing. `IntersectionObserver` is hardware-accelerated, fires only when elements enter/leave the viewport, and has excellent browser support (all target browsers). This avoids layout thrashing from `getBoundingClientRect()` calls in scroll handlers.

**Consequences**: Less granular control over "active" boundary (mitigated by `rootMargin` tuning). Acceptable trade-off.

### ADR-FE-004-004: Domain-specific API client modules

**Decision**: Restructure `lib/api.ts` into `lib/api/index.ts` with domain-specific modules (e.g., `lib/api/materials.ts`).

**Rationale**: A single `lib/api.ts` file does not scale as the application grows. SPEC-FE-004 introduces 8+ API endpoints for materials alone. Keeping all API functions in one file would create a maintenance bottleneck. Domain-specific modules align with the backend's module organization (`apps/api/src/modules/material/`) and the shared types structure (`packages/shared/src/types/material.types.ts`).

**Consequences**: Requires a one-time migration of existing imports. The `~/lib/api` path alias resolves to the new `lib/api/index.ts` seamlessly. Future SPECs benefit from the established pattern.
