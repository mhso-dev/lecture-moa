# Pencil MCP Lessons

## CRITICAL: Do NOT use open_document() to switch files
- `open_document()` breaks the WebSocket connection to the Pencil app
- After calling `open_document()`, ALL subsequent Pencil MCP calls fail with "No handler found for method"
- **Fix**: Use `filePath` parameter in `batch_get()` and `batch_design()` to work on any .pen file without switching
- Example: `batch_get(filePath: "design/screens/course/course-detail.pen", ...)`

## Variable Reference Bug in .pen files
- All .pen files in this project were created with broken variable references
- Variables stored as `\$variable-name` (with backslash) instead of `$variable-name`
- This causes all colors to render as `#00000000` (transparent)
- **Fix**: Use `U(nodeId, {fill: "$variable-name"})` to update each node's fill
- Background fills with explicit hex colors work fine; only variable-based fills are broken

## course-list.pen Status: FIXED
- Desktop (vlbUZ), Tablet (ibcCd), Mobile (kr5dE): all 3 breakpoints restored

## course-detail.pen Status: FIXED
- Desktop (diHAv): sidebar/nav/header fixed prev session; content areas (curriculum+sidebar) restructured this session
  - Curriculum (h6Lhc): ndZk2 + offoK(Module1) + p4D4r(Module2) + QHtAe(About)
  - Sidebar (QSaWB): mAq2D (Instructor Card) with avatar/contact/bio
- Tablet (H4cnD) and Mobile (jn0NQ): ALREADY had correct $variable refs, no fix needed

## Copy Trick (When batch_get/snapshot_layout Unavailable)
- C("nodeId", "anyParent", {name: "probe"}) → response includes children depth 2 with IDs
- Fix variables in copy (you have the IDs), then M() swap or D() originals
- Use M("fixedCopy", "originalParent", index) + D("originalBroken") for cleanup

## Remaining Files
- course-create.pen: NOT YET FIXED (user must open in Pencil)
- course-settings.pen: NOT YET FIXED (user must open in Pencil)
