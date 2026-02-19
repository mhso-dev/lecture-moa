# Expert Frontend Agent Memory

## Pencil MCP Critical Findings

### Variable references DO NOT work in batch_design U() either
- `replace_all_matching_properties` with `$variable` references: DOES NOT render correctly
- `batch_design` U() with `$variable` syntax: ALSO DOES NOT work - nodes keep old values or become #000000
- The U() call with `$variable` silently fails; the node value is NOT updated on disk
- Copying nodes with C() loses ALL styling (fills become #000000) - must re-apply hex colors manually
- Lesson: Keep hardcoded hex colors in nodes. Use `set_variables` only for code generation metadata. After C(), re-apply correct hex colors via U().

### Design Token Variables Schema
Variables must include `type` property:
```json
{"varName": {"type": "color", "value": "#HEX"}}
{"varName": {"type": "number", "value": 8}}
```

### Standard Design Tokens (lecture-moa project)
- primary: #3B82F6, primary-dark: #2563EB, primary-light: #EFF6FF
- bg-page: #F8FAFC, bg-card: #FFFFFF, bg-dark: #0F172A
- text-primary: #0F172A, text-secondary: #64748B, text-muted: #94A3B8, text-white: #FFFFFF
- border: #E2E8F0, border-light: #F1F5F9
- success: #10B981, success-light: #F0FDF4
- warning: #F59E0B, warning-light: #FEF3C7
- accent-purple: #6366F1, accent-purple-light: #EDE9FE
- error: #EF4444, error-light: #FEF2F2
- radius-md: 8, radius-lg: 12, radius-xl: 16, radius-pill: 20

## Responsive Breakpoint Patterns
- Desktop: 1280px width
- Tablet: 768px width (reduce padding, hide nav links, stack 2-column to 1-column where needed)
- Mobile: 375px width (single column, minimal padding 16-20px, reduced font sizes)
- Copy desktop with C(), then adapt with U() operations
- For tablet login/register: hide brand panel, center form
- For mobile: make cards fill_container, reduce padding to 20px, stack vertical layouts
