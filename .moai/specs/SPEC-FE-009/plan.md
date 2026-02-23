# SPEC-FE-009: Implementation Plan

**SPEC**: SPEC-FE-009 Q&A Highlight Rendering
**Scope**: Medium
**Domain**: Frontend (expert-frontend)

---

## Milestone 1: Highlight Data Layer (Primary Goal)

새 Supabase 쿼리 및 React 훅을 통해 하이라이트 데이터를 Material Viewer에서 사용할 수 있도록 한다.

### Tasks

1. **Supabase 쿼리 함수 추가** (`apps/web/lib/supabase/qa.ts`)
   - `getHighlightsForMaterial(materialId: string)` 함수 추가
   - 반환 타입: `QAHighlightData[]`
   - SELECT: `id, selected_text, heading_id, status, title`
   - WHERE: `material_id = $materialId`
   - 정렬: `created_at ASC` (먼저 등록된 질문이 우선)

2. **공유 타입 정의** (`packages/shared/src/types/qa.types.ts`)
   - `QAHighlightData` 인터페이스 추가:
     ```
     { id: string; selectedText: string; headingId: string | null; status: QAStatus; title: string }
     ```

3. **TanStack Query 훅 생성** (`apps/web/hooks/qa/useQAHighlights.ts`)
   - `useQAHighlights(materialId: string)` 훅
   - staleTime: 30s (useQAList와 동일)
   - Supabase Realtime 구독과 연동하여 자동 invalidate

4. **qa-keys 업데이트** (`apps/web/hooks/qa/qa-keys.ts`)
   - `highlights(materialId)` 키 패턴 추가

### Deliverables
- `getHighlightsForMaterial()` 쿼리 함수
- `QAHighlightData` 타입
- `useQAHighlights()` 훅
- 단위 테스트

---

## Milestone 2: rehype Plugin 개발 (Primary Goal)

커스텀 rehype 플러그인을 통해 HAST 레벨에서 질문 텍스트를 하이라이트 마크업으로 변환한다.

### Tasks

1. **rehype-qa-highlights 플러그인 생성** (`apps/web/lib/markdown/plugins/rehype-qa-highlights.ts`)
   - 입력: 플러그인 옵션으로 `QAHighlightData[]` 수신
   - 처리 로직:
     a. HAST 트리를 순회하며 heading 요소(`h2`, `h3`, `h4`)의 `id` 속성으로 섹션 경계 식별
     b. 각 섹션 내 텍스트 노드를 연결(concatenate)하여 `selectedText` 매칭
     c. 매칭된 텍스트 범위를 `<mark>` 요소로 분할 래핑
     d. `data-highlight-id`, `data-question-count`, `data-status` 속성 부여
   - 제외 규칙:
     - `<code>`, `<pre>` 내부 텍스트 노드는 스킵
     - `<a>` 내부 텍스트는 스킵 (링크 동작 보존)
     - KaTeX 렌더링 요소 (`.katex`, `.math-inline`, `.math-display`) 스킵
   - 동일 텍스트 복수 질문: `data-question-count` 속성에 질문 수 기록

2. **텍스트 매칭 유틸리티** (`apps/web/lib/markdown/plugins/highlight-text-matcher.ts`)
   - `findTextInSection(sectionNodes, searchText)`: 섹션 내 HAST 노드에서 텍스트 위치 탐색
   - `splitTextNode(node, matchStart, matchEnd)`: 텍스트 노드를 분할하여 `<mark>` 삽입
   - 부분 매칭 처리: 텍스트가 여러 노드에 걸쳐 있는 경우 각 노드 부분별 래핑

3. **플러그인 단위 테스트**
   - 기본 텍스트 매칭 / 코드 블록 제외 / 수식 제외 / 복수 질문 매핑 / 매칭 실패 시 graceful 처리

### Technical Design

```
Input HAST:
  <h2 id="introduction">Introduction</h2>
  <p>This is important concept that students often ask about.</p>

Highlights: [{ selectedText: "important concept", headingId: "introduction", ... }]

Output HAST:
  <h2 id="introduction">Introduction</h2>
  <p>This is <mark data-highlight-id="q-123" data-question-count="1" data-status="OPEN">important concept</mark> that students often ask about.</p>
```

### Deliverables
- `rehype-qa-highlights` 플러그인
- `highlight-text-matcher` 유틸리티
- 플러그인 단위 테스트 (HAST 변환 검증)

---

## Milestone 3: MarkdownRenderer 통합 (Primary Goal)

MarkdownRenderer 컴포넌트에 하이라이트 플러그인을 통합하고 sanitize schema를 확장한다.

### Tasks

1. **MarkdownRenderer Props 확장** (`apps/web/components/markdown/MarkdownRenderer.tsx`)
   - `highlights?: QAHighlightData[]` prop 추가
   - `useMemo`로 highlights 변경 시에만 rehype plugins 배열 재생성
   - rehype-qa-highlights를 rehypeSanitize **이전**에 배치 (sanitize가 mark 태그를 허용하도록)
   - Plugin 순서: `rehypeKatex -> rehypeHighlight -> rehypeQaHighlights -> rehypeSanitize`

2. **Sanitize Schema 확장**
   - `customSanitizeSchema.tagNames`에 `"mark"` 추가
   - `customSanitizeSchema.attributes.mark`에 `["data-highlight-id", "data-question-count", "data-status"]` 추가

3. **Material Viewer Page 연동** (`apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx`)
   - `useQAHighlights(materialId)` 훅 호출
   - `MarkdownRenderer`에 `highlights` prop 전달

### Deliverables
- 확장된 MarkdownRenderer (하이라이트 지원)
- Material Viewer Page 연동
- 통합 테스트

---

## Milestone 4: 하이라이트 스타일링 및 인터랙션 (Secondary Goal)

하이라이트 시각적 스타일링과 클릭 인터랙션을 구현한다.

### Tasks

1. **하이라이트 CSS 스타일** (`apps/web/lib/markdown/highlight-qa.css` 또는 Tailwind 유틸리티)
   - 기본: `background-color: var(--highlight-qa-open)` (반투명 노란색)
   - ANSWERED: `background-color: var(--highlight-qa-answered)` (반투명 초록색)
   - 호버: opacity 증가 + cursor pointer
   - 질문 수 뱃지: `::after` pseudo-element 또는 인라인 badge

2. **QAHighlightTooltip 컴포넌트** (`apps/web/components/material/QAHighlightTooltip.tsx`)
   - shadcn/ui Popover 기반
   - 클릭한 하이라이트의 질문 목록 표시
   - 각 항목: 질문 제목, 상태 뱃지, 답변 수
   - 항목 클릭 시 Q&A 상세 페이지 라우팅

3. **이벤트 위임 핸들러** (Material Viewer Page)
   - `#material-content` 컨테이너에 클릭 핸들러
   - `mark[data-highlight-id]` 타겟 감지
   - Popover 위치 계산 (클릭 좌표 기반)
   - 모바일: Popover 대신 바텀시트 사용

4. **Zustand Store 확장** (`apps/web/stores/qa.store.ts`)
   - `activeHighlight` 상태 추가: `{ highlightId: string; anchorRect: DOMRect } | null`
   - `openHighlightTooltip`, `closeHighlightTooltip` 액션 추가

### Deliverables
- 하이라이트 CSS 스타일
- QAHighlightTooltip 컴포넌트
- 이벤트 위임 핸들러
- QA Store 확장

---

## Milestone 5: Realtime 연동 및 Edge Cases (Secondary Goal)

실시간 업데이트와 엣지 케이스를 처리한다.

### Tasks

1. **Realtime 캐시 무효화**
   - 기존 `useQAWebSocket` 훅에서 `NEW_QUESTION` 이벤트 수신 시 highlights 쿼리 키 invalidate
   - `qaKeys.highlights(materialId)` 자동 리패치

2. **Edge Cases 처리**
   - 빈 `selected_text`인 질문 필터링
   - 매우 긴 `selected_text` (500자)의 성능 최적화
   - 동일 텍스트가 문서 내 여러 번 등장하는 경우: `heading_id`로 범위 한정, 그래도 복수면 첫 번째 매칭
   - 마크다운 편집 후 `selected_text`가 더 이상 매칭되지 않는 경우: 조용히 스킵

3. **성능 최적화**
   - `useMemo`로 highlight 그룹핑 결과 캐싱
   - rehype plugin 내부에서 섹션별 인덱스 구축 (O(n) 대신 O(1) 섹션 룩업)
   - 대량 하이라이트 (50+) 시에도 렌더링 성능 보장

### Deliverables
- Realtime 연동
- Edge case 처리
- 성능 최적화

---

## Architecture Design Direction

### Data Flow

```
Supabase (questions table)
  |
  v
getHighlightsForMaterial()  -- Supabase query layer
  |
  v
useQAHighlights()  -- TanStack Query hook (캐싱 + 자동 리패치)
  |
  v
MaterialViewerPage  -- highlights prop 전달
  |
  v
MarkdownRenderer(content, highlights)
  |
  v
rehype-qa-highlights plugin  -- HAST 변환
  |
  v
<mark data-highlight-id="..." data-status="...">highlighted text</mark>
  |
  v (Click)
QAHighlightTooltip  -- 질문 목록 팝오버
```

### File Change Summary

| Type | Path | Description |
|------|------|-------------|
| New | `apps/web/lib/markdown/plugins/rehype-qa-highlights.ts` | Custom rehype plugin |
| New | `apps/web/lib/markdown/plugins/highlight-text-matcher.ts` | Text matching utility |
| New | `apps/web/hooks/qa/useQAHighlights.ts` | Highlight data hook |
| New | `apps/web/components/material/QAHighlightTooltip.tsx` | Tooltip/popover component |
| New | `apps/web/lib/markdown/highlight-qa.css` | Highlight styles |
| Modify | `apps/web/lib/supabase/qa.ts` | Add `getHighlightsForMaterial()` |
| Modify | `apps/web/components/markdown/MarkdownRenderer.tsx` | Add highlights prop + plugin |
| Modify | `apps/web/app/(dashboard)/courses/[courseId]/materials/[materialId]/page.tsx` | Wire highlights |
| Modify | `apps/web/stores/qa.store.ts` | Add highlight tooltip state |
| Modify | `apps/web/hooks/qa/qa-keys.ts` | Add highlights key |
| Modify | `apps/web/hooks/qa/index.ts` | Export useQAHighlights |
| Modify | `packages/shared/src/types/qa.types.ts` | Add QAHighlightData type |

---

## Risk Assessment

| Risk | Severity | Likelihood | Mitigation |
|------|----------|------------|------------|
| 텍스트 매칭 실패 (마크다운 편집 후) | Medium | Medium | Graceful degradation - 매칭 실패 시 조용히 스킵 |
| rehype plugin 간 간섭 (katex, highlight) | High | Low | 플러그인 실행 순서 보장 + 코드/수식 영역 명시적 제외 |
| 대량 하이라이트 렌더링 성능 | Medium | Low | 섹션별 인덱스 + useMemo 캐싱 |
| 크로스-엘리먼트 텍스트 매칭 복잡도 | High | Medium | MVP에서는 단일 텍스트 노드 내 매칭만 지원, 추후 크로스 노드 확장 |
| sanitize 정책과의 충돌 | Medium | Low | mark 태그/속성을 명시적으로 허용 목록에 추가 |
| 모바일 터치 인터랙션 (하이라이트 클릭 vs 텍스트 선택) | Medium | Medium | 터치 이벤트 분리: 빠른 탭 = 하이라이트 클릭, 롱프레스 = 텍스트 선택 |

---

## Expert Consultation Recommendations

- **expert-frontend**: rehype plugin HAST 조작, react-markdown 통합 패턴, 성능 최적화
- **expert-testing**: rehype plugin 단위 테스트 전략 (HAST 변환 검증)
