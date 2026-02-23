# SPEC-FE-009: Acceptance Criteria

**SPEC**: SPEC-FE-009 Q&A Highlight Rendering

---

## Definition of Done

- [ ] 모든 EARS 요구사항(U01-U02, E01-E03, S01-S03, N01-N03, C01)이 구현되어 있다
- [ ] rehype-qa-highlights 플러그인 단위 테스트 통과
- [ ] highlight-text-matcher 유틸리티 단위 테스트 통과
- [ ] useQAHighlights 훅 테스트 통과
- [ ] QAHighlightTooltip 컴포넌트 테스트 통과
- [ ] MarkdownRenderer 통합 테스트 통과 (하이라이트 렌더링 검증)
- [ ] 코드 블록, 수식, 링크 내부가 하이라이트되지 않는 것을 확인
- [ ] Supabase Realtime을 통한 실시간 하이라이트 추가 동작 확인
- [ ] 모바일 반응형 동작 확인 (바텀시트)
- [ ] 85%+ 테스트 커버리지

---

## Test Scenarios

### TC-001: 기본 하이라이트 렌더링

```gherkin
Given 강의자료에 질문이 등록되어 있고
  And 질문의 selected_text가 "중요한 개념"이고
  And 질문의 heading_id가 "introduction"일 때
When 학생이 해당 강의자료 페이지를 열면
Then "중요한 개념" 텍스트가 <mark> 요소로 래핑되어 하이라이트로 표시된다
  And 하이라이트에 data-highlight-id 속성이 질문 ID로 설정된다
  And 하이라이트에 data-status 속성이 질문 상태로 설정된다
```

### TC-002: 코드 블록 내 텍스트 제외

```gherkin
Given 강의자료에 코드 블록이 포함되어 있고
  And 질문의 selected_text가 코드 블록 내부 텍스트와 동일할 때
When 강의자료가 렌더링되면
Then 코드 블록 내부의 텍스트는 하이라이트되지 않는다
  And 코드 블록의 구문 강조(syntax highlighting)가 정상 동작한다
```

### TC-003: 실시간 하이라이트 추가

```gherkin
Given 학생이 강의자료 페이지를 보고 있을 때
When 다른 학생이 해당 자료에서 텍스트를 드래그하여 새 질문을 등록하면
Then Supabase Realtime을 통해 새 질문 데이터가 수신되고
  And TanStack Query highlights 캐시가 자동 갱신되고
  And 페이지 새로고침 없이 새 하이라이트가 마크다운 내에 표시된다
```

### TC-004: 하이라이트 클릭 - 툴팁 표시

```gherkin
Given 하이라이트된 텍스트가 표시되어 있을 때
When 사용자가 하이라이트된 텍스트를 클릭하면
Then 해당 하이라이트에 연결된 질문 목록이 포함된 팝오버가 표시된다
  And 팝오버에 각 질문의 제목, 상태, 답변 수가 표시된다
  And 팝오버가 클릭 위치 근처에 뷰포트를 벗어나지 않게 위치한다
```

### TC-005: 툴팁에서 질문 상세로 이동

```gherkin
Given 하이라이트 툴팁이 열려 있고 질문 목록이 표시될 때
When 사용자가 질문 항목을 클릭하면
Then 해당 질문의 Q&A 상세 페이지로 라우팅된다
  And 툴팁이 닫힌다
```

### TC-006: 복수 질문 뱃지

```gherkin
Given 동일한 selected_text에 대해 3개의 질문이 등록되어 있을 때
When 강의자료가 렌더링되면
Then 해당 텍스트의 하이라이트에 "3" 숫자 뱃지가 표시된다
  And data-question-count 속성이 "3"으로 설정된다
  And 클릭 시 3개 질문 모두 툴팁에 표시된다
```

### TC-007: heading_id 없는 질문의 폴백 매칭

```gherkin
Given 질문의 heading_id가 null이고 selected_text가 "전역 매칭 테스트"일 때
When 강의자료가 렌더링되면
Then 전체 문서에서 "전역 매칭 테스트" 텍스트를 검색한다
  And 첫 번째 매칭 위치에 하이라이트가 표시된다
```

### TC-008: 매칭 실패 시 Graceful Degradation

```gherkin
Given 질문의 selected_text가 현재 자료 내용에 존재하지 않을 때
When 강의자료가 렌더링되면
Then 해당 하이라이트는 무시된다
  And 에러가 발생하지 않는다
  And 다른 하이라이트는 정상적으로 표시된다
  And 마크다운 렌더링이 완전히 완료된다
```

### TC-009: 수식 영역 제외

```gherkin
Given 강의자료에 KaTeX 수식이 포함되어 있고
  And 질문의 selected_text가 수식 내부 텍스트와 동일할 때
When 강의자료가 렌더링되면
Then 수식 내부의 텍스트는 하이라이트되지 않는다
  And 수식 렌더링이 정상 동작한다
```

### TC-010: 렌더링 에러 격리

```gherkin
Given rehype-qa-highlights 플러그인 내부에서 예외가 발생할 때
When 강의자료가 렌더링되면
Then 하이라이트 없이 기본 마크다운 렌더링이 완료된다
  And 콘솔에 경고 로그가 기록된다
  And 사용자에게 에러 UI가 표시되지 않는다
```

### TC-011: 모바일 하이라이트 인터랙션

```gherkin
Given 모바일 디바이스에서 강의자료를 보고 있고
  And 하이라이트된 텍스트가 표시되어 있을 때
When 사용자가 하이라이트를 탭하면
Then 데스크톱 팝오버 대신 바텀시트가 표시된다
  And 바텀시트에 질문 목록이 표시된다
  And 바텀시트를 아래로 스와이프하면 닫힌다
```

---

## Quality Gate Criteria

| Gate | Criteria | Threshold |
|------|----------|-----------|
| Tested | 단위 + 통합 테스트 | 85%+ coverage |
| Readable | 명확한 네이밍, 영문 코멘트 | ruff/eslint pass |
| Unified | Tailwind/shadcn 컨벤션 | formatter pass |
| Secured | XSS 방지 (sanitize) | sanitize schema 검증 |
| Trackable | Conventional commits | SPEC-FE-009 reference |

---

## Verification Methods

| Method | Tool | Target |
|--------|------|--------|
| Unit Test | Vitest | rehype plugin, text matcher, hooks |
| Component Test | Testing Library | QAHighlightTooltip |
| Integration Test | Vitest + react-markdown | MarkdownRenderer with highlights |
| Visual Regression | Manual (opt: Playwright screenshot) | Highlight styling |
| E2E Test | Playwright (optional) | Full flow: 질문 등록 -> 하이라이트 표시 -> 클릭 -> 이동 |
