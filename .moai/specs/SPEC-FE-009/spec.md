# SPEC-FE-009: Q&A Highlight Rendering

**ID**: SPEC-FE-009
**Title**: Q&A Highlight Rendering in Material Viewer
**Status**: Planned
**Priority**: High
**Created**: 2026-02-23
**Domain**: Frontend (apps/web)

---

## Environment

- **Platform**: Next.js 15 (App Router) + React 19
- **Rendering**: react-markdown + rehype/remark plugin pipeline
- **State Management**: Zustand (qa.store.ts), TanStack Query v5
- **Backend**: Supabase PostgreSQL (questions table with `selected_text`, `heading_id` columns)
- **Realtime**: Supabase Realtime subscriptions (already configured)
- **Styling**: Tailwind CSS 4, CSS custom properties

## Assumptions

1. `questions.selected_text` (max 500 chars)와 `questions.heading_id`가 하이라이트 위치를 특정하기에 충분하다
2. MarkdownRenderer의 heading slug 생성 로직(`generateUniqueSlug`)이 Q&A 등록 시점과 렌더링 시점에 동일한 ID를 생성한다
3. 기존 rehype plugin pipeline (katex, highlight, sanitize)과 새 하이라이트 플러그인이 충돌하지 않는다
4. 동일 섹션 내 `selected_text`가 유일하게 매칭되는 경우가 대부분이다 (중복 시 첫 번째 매칭)
5. QAListItem 타입에 현재 `headingId`가 포함되지 않으므로, 하이라이트 전용 경량 쿼리가 필요하다

## Requirements

### Ubiquitous Requirements

- **REQ-FE-009-U01**: 시스템은 **항상** 강의자료 렌더링 시 해당 자료에 등록된 모든 질문의 `selected_text`를 하이라이트로 표시해야 한다
- **REQ-FE-009-U02**: 시스템은 **항상** 하이라이트 렌더링이 기존 마크다운 요소(코드 블록, 수식, 링크, 테이블)의 기능을 보존해야 한다

### Event-Driven Requirements

- **REQ-FE-009-E01**: **WHEN** 새로운 질문이 Supabase Realtime을 통해 수신되면 **THEN** TanStack Query 캐시가 갱신되고 해당 하이라이트가 자동으로 렌더링에 추가되어야 한다
- **REQ-FE-009-E02**: **WHEN** 사용자가 하이라이트된 텍스트를 클릭하면 **THEN** 해당 질문 목록이 포함된 툴팁/팝오버가 표시되어야 한다
- **REQ-FE-009-E03**: **WHEN** 툴팁 내 질문 항목을 클릭하면 **THEN** Q&A 상세 페이지로 이동해야 한다

### State-Driven Requirements

- **REQ-FE-009-S01**: **IF** 동일 텍스트 영역에 복수 질문이 매핑되면 **THEN** 하이라이트에 질문 수 뱃지(badge)를 표시해야 한다
- **REQ-FE-009-S02**: **IF** `heading_id`로 섹션을 특정할 수 없으면 (null인 경우) **THEN** 전체 문서에서 `selected_text`를 검색하여 매칭해야 한다
- **REQ-FE-009-S03**: **IF** `selected_text`가 현재 렌더링된 콘텐츠에서 매칭되지 않으면 **THEN** 해당 하이라이트를 무시하고 오류 없이 렌더링을 완료해야 한다

### Optional Requirements

- **REQ-FE-009-O01**: **가능하면** 하이라이트 색상을 질문 상태(OPEN: 노란색, ANSWERED: 초록색)에 따라 구분 제공
- **REQ-FE-009-O02**: **가능하면** 하이라이트에 호버 시 질문 제목 미리보기 툴팁 제공

### Unwanted Behavior Requirements

- **REQ-FE-009-N01**: 시스템은 하이라이트 플러그인으로 인해 코드 블록 내부 텍스트를 하이라이트**하지 않아야 한다**
- **REQ-FE-009-N02**: 시스템은 하이라이트 렌더링 실패 시 전체 마크다운 렌더링을 중단**하지 않아야 한다** (graceful degradation)
- **REQ-FE-009-N03**: 시스템은 하이라이트로 인해 기존 sanitize 정책을 우회**하지 않아야 한다**

### Complex Requirements (Combined Patterns)

- **REQ-FE-009-C01**: **IF** 사용자가 모바일 디바이스를 사용 중이고 **AND WHEN** 하이라이트를 탭하면 **THEN** 데스크톱과 동일한 툴팁 대신 바텀시트로 질문 목록을 표시해야 한다

## Specifications

### Technical Approach: rehype Plugin 기반 HAST 변환

1. **rehype-qa-highlights 커스텀 플러그인** 생성
   - react-markdown의 rehype plugin pipeline에 통합
   - HAST (HTML Abstract Syntax Tree) 레벨에서 텍스트 노드를 분석
   - `heading_id`로 섹션 범위를 좁힌 후 `selected_text` 매칭
   - 매칭된 텍스트 노드를 `<mark>` 요소로 래핑

2. **하이라이트 데이터 흐름**
   - 새 경량 Supabase 쿼리 (`getHighlightsForMaterial`) -> `useQAHighlights` 훅
   - 데이터: `{ questionId, selectedText, headingId, status, title }[]`
   - `headingId`별로 그룹핑하여 rehype 플러그인 옵션으로 전달
   - TanStack Query로 캐싱 + Supabase Realtime으로 자동 갱신

3. **MarkdownRenderer 확장**
   - `highlights` prop 추가 (선택적)
   - `useMemo`로 highlights가 변경될 때만 rehype plugin 배열 재생성
   - sanitize schema에 `mark` 태그와 `data-*` 속성 허용 추가

4. **클릭 인터랙션**
   - 이벤트 위임 (markdown container에 단일 핸들러)
   - `mark[data-highlight-id]` 클릭 감지
   - Popover/Tooltip 컴포넌트로 질문 목록 표시

### Database Changes

- **스키마 변경: 없음** - 기존 `selected_text`, `heading_id` 컬럼 활용
- **쿼리 추가**: `getHighlightsForMaterial(materialId)` - 경량 하이라이트 전용 쿼리
  - SELECT: `id, selected_text, heading_id, status, title`
  - WHERE: `material_id = $1`
  - 페이지네이션 불필요 (자료당 전체 질문 수 제한적)

### Sanitize Schema 확장

```
mark: ["data-highlight-id", "data-question-count", "data-status"]
```

### Traceability

| Requirement | Component | Test |
|---|---|---|
| REQ-FE-009-U01 | rehype-qa-highlights plugin | TC-001 |
| REQ-FE-009-U02 | rehype-qa-highlights (skipCodeBlocks) | TC-002 |
| REQ-FE-009-E01 | useQAHighlights + Realtime | TC-003 |
| REQ-FE-009-E02 | QAHighlightTooltip | TC-004 |
| REQ-FE-009-E03 | QAHighlightTooltip navigation | TC-005 |
| REQ-FE-009-S01 | rehype-qa-highlights (grouping) | TC-006 |
| REQ-FE-009-S02 | rehype-qa-highlights (fallback) | TC-007 |
| REQ-FE-009-S03 | rehype-qa-highlights (graceful) | TC-008 |
| REQ-FE-009-N01 | rehype-qa-highlights (exclusion) | TC-009 |
| REQ-FE-009-N02 | Error boundary integration | TC-010 |
| REQ-FE-009-C01 | QAHighlightTooltip (responsive) | TC-011 |
