---
spec_id: SPEC-BE-004
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-BE-004 Acceptance Criteria: Q&A System Supabase Backend Integration

## Quality Gates

- 테스트 통과: 기존 테스트 + 신규 테스트 모두 pass
- 커버리지: `lib/supabase/qa.ts`, `lib/supabase/realtime.ts` 각 85%+
- Q&A hooks 전체 85%+
- TypeScript: 컴파일 오류 0개
- ESLint: 새로운 경고 0개
- REST API 호출 코드 완전 제거: Q&A hooks 내 `/api/v1/qa` 참조 0개
- Supabase Realtime 채널 구독/해제 정상 동작

---

## AC-001: Vote/Answer Count 트리거

**연관 요구사항**: REQ-BE-004-001~007

### Scenario 1: Vote INSERT 시 upvote_count 증가

**Given** questions 테이블에 upvote_count=0인 질문이 존재하고
**When** votes 테이블에 해당 질문에 대한 투표(value=1, target_type='question')가 INSERT되면
**Then** 해당 질문의 upvote_count가 1로 업데이트되어야 한다

### Scenario 2: Vote DELETE 시 upvote_count 감소

**Given** questions 테이블에 upvote_count=3인 질문이 존재하고
**When** votes 테이블에서 해당 질문에 대한 투표(value=1) 하나가 DELETE되면
**Then** 해당 질문의 upvote_count가 2로 업데이트되어야 한다

### Scenario 3: Answer INSERT 시 answer_count 증가

**Given** questions 테이블에 answer_count=0인 질문이 존재하고
**When** answers 테이블에 해당 질문에 대한 답변이 INSERT되면
**Then** 해당 질문의 answer_count가 1로 업데이트되어야 한다

### Scenario 4: Answer DELETE 시 answer_count 감소

**Given** questions 테이블에 answer_count=2인 질문이 존재하고
**When** answers 테이블에서 해당 질문의 답변 하나가 DELETE되면
**Then** 해당 질문의 answer_count가 1로 업데이트되어야 한다

### Scenario 5: Answer vote count 트리거

**Given** answers 테이블에 upvote_count=0인 답변이 존재하고
**When** votes 테이블에 해당 답변에 대한 투표(value=1, target_type='answer')가 INSERT되면
**Then** 해당 답변의 upvote_count가 1로 업데이트되어야 한다

### Scenario 6: 마이그레이션 파일 존재

**Given** 구현이 완료되고
**When** `supabase/migrations/` 디렉토리를 확인하면
**Then** `00014_create_vote_count_triggers.sql` 파일이 존재해야 한다
**And** `supabase migration up` 명령으로 오류 없이 적용 가능해야 한다

---

## AC-002: Supabase 쿼리 레이어

**연관 요구사항**: REQ-BE-004-008~009, REQ-BE-004-032~033

### Scenario 1: qa.ts 파일 존재

**Given** Phase B 구현이 완료되고
**When** `apps/web/lib/supabase/` 디렉토리를 확인하면
**Then** `qa.ts`와 `realtime.ts` 파일이 모두 존재해야 한다

### Scenario 2: getQuestions 기본 동작

**Given** Supabase 클라이언트가 mock되고 questions 데이터가 준비되었을 때
**When** `getQuestions({ page: 0, limit: 20 })` 함수를 호출하면
**Then** `{ data: QAListItem[], nextPage: number | null, total: number }` 형태가 반환되어야 한다
**And** 각 항목의 `courseName`이 courses JOIN에서 매핑되어야 한다
**And** 각 항목의 `materialTitle`이 materials JOIN에서 매핑되어야 한다
**And** 각 항목의 `author.name`이 profiles.display_name에서 매핑되어야 한다

### Scenario 3: getQuestions 필터링

**Given** `{ courseId: 'c1', status: 'OPEN', sort: 'upvotes' }` 파라미터로 호출할 때
**When** `getQuestions(params)` 함수가 실행되면
**Then** Supabase 쿼리에 `course_id = 'c1'` AND `status = 'OPEN'` 필터가 포함되어야 한다
**And** `upvote_count DESC` 정렬이 적용되어야 한다

### Scenario 4: getQuestions 검색

**Given** `{ q: '인증', page: 0, limit: 20 }` 파라미터로 호출할 때
**When** `getQuestions(params)` 함수가 실행되면
**Then** Supabase 쿼리에 title 또는 content에 대한 ILIKE 검색이 포함되어야 한다

### Scenario 5: getQuestionDetail 응답 구조

**Given** questionId에 해당하는 질문과 3개의 답변(1개는 AI 생성)이 존재하고
**When** `getQuestionDetail(questionId, userId)` 함수를 호출하면
**Then** 반환값에 `aiSuggestion` 필드가 AI 생성 답변으로 설정되어야 한다
**And** `answers` 배열에는 AI 생성이 아닌 2개의 답변만 포함되어야 한다
**And** `context` 필드가 `{ materialId, headingId, selectedText }` nested 구조여야 한다

### Scenario 6: getQuestionDetail isUpvoted 계산

**Given** 현재 사용자가 해당 질문에 투표한 상태이고
**When** `getQuestionDetail(questionId, userId)` 함수를 호출하면
**Then** `isUpvoted`가 `true`로 반환되어야 한다
**And** 투표한 답변의 `isUpvoted`도 `true`로 반환되어야 한다

### Scenario 7: createQuestion context 매핑

**Given** `{ courseId, materialId, title, content, context: { materialId, headingId: 'h2-1', selectedText: '선택된 텍스트' } }` 페이로드로 호출할 때
**When** `createQuestion(payload, authorId)` 함수가 실행되면
**Then** DB INSERT 시 `heading_id = 'h2-1'`, `selected_text = '선택된 텍스트'`로 flat 매핑되어야 한다

### Scenario 8: Supabase 에러 전파

**Given** Supabase 클라이언트가 오류를 반환하도록 mock되고
**When** 쿼리 레이어 함수가 호출되면
**Then** `Error` 객체가 throw되어야 한다
**And** 오류 메시지에 Supabase 에러 내용이 포함되어야 한다

### Scenario 9: 쿼리 레이어 테스트 커버리지

**Given** 구현이 완료되고
**When** `pnpm --filter web test --coverage lib/supabase/qa` 커버리지를 측정하면
**Then** `qa.ts` 85% 이상이어야 한다

---

## AC-003: Question Hooks 전환

**연관 요구사항**: REQ-BE-004-010~014

### Scenario 1: useQAList Supabase 사용

**Given** `useQAList()` 훅이 수정되고
**When** 컴포넌트에서 `useQAList({ courseId: 'c1', status: 'OPEN' })`를 호출하면
**Then** REST API(`/api/v1/qa/questions`) 대신 `getQuestions()` Supabase 쿼리가 실행되어야 한다
**And** useInfiniteQuery 기반 페이지네이션이 정상 동작해야 한다

### Scenario 2: useQAList 무한 스크롤

**Given** 총 50개 질문이 존재하고 limit=20으로 설정될 때
**When** `fetchNextPage()`를 호출하면
**Then** 다음 20개 질문이 추가 로드되어야 한다
**And** `hasNextPage`가 올바르게 계산되어야 한다

### Scenario 3: useQADetail 답변 포함 반환

**Given** `useQADetail(questionId)` 훅이 수정되고
**When** 컴포넌트에서 호출되면
**Then** 질문 상세 정보와 함께 답변 목록이 반환되어야 한다
**And** AI 생성 답변은 `aiSuggestion` 필드로 분리되어야 한다

### Scenario 4: useCreateQuestion 사용자 ID 바인딩

**Given** 인증된 사용자 ID가 존재하고
**When** `useCreateQuestion()` mutation을 실행하면
**Then** `createQuestion(payload, authorId)` 함수에 현재 사용자 ID가 전달되어야 한다
**And** 성공 시 질문 목록 캐시가 무효화되어야 한다

### Scenario 5: useUpdateQuestion RLS 보호

**Given** 다른 사용자가 작성한 질문에 대해
**When** `useUpdateQuestion()` mutation을 실행하면
**Then** RLS 정책에 의해 오류가 반환되어야 한다

### Scenario 6: 기존 Query Key 호환성

**Given** hooks가 Supabase로 전환된 후
**When** 기존 컴포넌트가 `qaKeys.list(params)` 또는 `qaKeys.detail(questionId)` 키로 캐시를 invalidate하면
**Then** 정상적으로 캐시 무효화가 작동해야 한다

---

## AC-004: Answer + Status Hooks 전환

**연관 요구사항**: REQ-BE-004-015~019

### Scenario 1: useCreateAnswer Supabase 사용

**Given** `useCreateAnswer(questionId)` 훅이 수정되고
**When** `mutate({ content: '답변 내용' })`을 실행하면
**Then** `createAnswer(questionId, payload, authorId)` Supabase 함수가 호출되어야 한다
**And** 성공 시 질문 상세 캐시가 무효화되어야 한다

### Scenario 2: useAcceptAnswer 채택 동작

**Given** `useAcceptAnswer(questionId, answerId)` mutation이 수정되고
**When** mutation을 실행하면
**Then** 해당 answer의 `is_accepted`가 true로 설정되어야 한다
**And** 동일 question의 다른 answer들은 `is_accepted`가 false로 설정되어야 한다
**And** 해당 question의 `status`가 'RESOLVED'로 업데이트되어야 한다

### Scenario 3: useChangeQuestionStatus 상태 변경

**Given** `useChangeQuestionStatus(questionId)` mutation이 수정되고
**When** `mutate({ status: 'CLOSED' })`를 실행하면
**Then** DB에서 해당 질문의 `status`가 'CLOSED'로 업데이트되어야 한다

### Scenario 4: useChangeQuestionStatus RLS 보호

**Given** 질문 작성자도 아니고 강사도 아닌 사용자가
**When** `useChangeQuestionStatus()` mutation을 실행하면
**Then** RLS 정책에 의해 오류가 반환되어야 한다

---

## AC-005: Vote Hooks 전환

**연관 요구사항**: REQ-BE-004-020~023

### Scenario 1: useUpvoteQuestion 투표 토글 (추가)

**Given** 현재 사용자가 해당 질문에 투표하지 않은 상태이고
**When** `useUpvoteQuestion(questionId)` mutation을 실행하면
**Then** votes 테이블에 새 레코드가 INSERT되어야 한다
**And** UI에서 즉시 `isUpvoted=true`, `upvoteCount +1`로 표시되어야 한다 (optimistic)

### Scenario 2: useUpvoteQuestion 투표 토글 (취소)

**Given** 현재 사용자가 해당 질문에 이미 투표한 상태이고
**When** `useUpvoteQuestion(questionId)` mutation을 실행하면
**Then** votes 테이블에서 해당 레코드가 DELETE되어야 한다
**And** UI에서 즉시 `isUpvoted=false`, `upvoteCount -1`로 표시되어야 한다 (optimistic)

### Scenario 3: useUpvoteAnswer 투표 토글

**Given** 현재 사용자가 해당 답변에 투표하지 않은 상태이고
**When** `useUpvoteAnswer(questionId, answerId)` mutation을 실행하면
**Then** votes 테이블에 target_type='answer' 레코드가 INSERT되어야 한다
**And** UI에서 즉시 isUpvoted/upvoteCount가 갱신되어야 한다

### Scenario 4: Optimistic Update 롤백

**Given** Supabase 쿼리가 에러를 반환하도록 설정되고
**When** `useUpvoteQuestion()` mutation이 실패하면
**Then** UI가 이전 상태(isUpvoted, upvoteCount)로 정확히 롤백되어야 한다

### Scenario 5: UNIQUE 제약 보호

**Given** 동일 사용자가 동일 질문에 대해
**When** votes 테이블에 직접 중복 INSERT를 시도하면
**Then** UNIQUE(user_id, target_type, target_id) 제약에 의해 오류가 발생해야 한다

---

## AC-006: Supabase Realtime

**연관 요구사항**: REQ-BE-004-024~029, REQ-BE-004-037~038

### Scenario 1: Realtime 상수 파일 존재

**Given** 구현이 완료되고
**When** `packages/shared/src/constants/realtime.ts` 파일을 확인하면
**Then** `QA_CHANNELS` 및 `QA_REALTIME_FILTERS` 상수가 정의되어야 한다

### Scenario 2: 질문 상세 페이지 채널 구독

**Given** 사용자가 질문 상세 페이지에 진입하고
**When** `useQAWebSocket(questionId)` 훅이 실행되면
**Then** `subscribeToQuestion(questionId, callbacks)` 함수가 호출되어야 한다
**And** Supabase Realtime 채널이 활성화되어야 한다

### Scenario 3: 새 답변 실시간 수신

**Given** 질문 상세 페이지에서 Realtime 채널이 구독 중이고
**When** 다른 사용자가 해당 질문에 새 답변을 작성하면
**Then** answers INSERT postgres_changes 이벤트가 수신되어야 한다
**And** 질문 상세 쿼리 캐시가 invalidate되어 최신 답변이 표시되어야 한다

### Scenario 4: 질문 상태 변경 실시간 수신

**Given** 질문 상세 페이지에서 Realtime 채널이 구독 중이고
**When** 질문 작성자가 답변을 채택하여 status가 'RESOLVED'로 변경되면
**Then** questions UPDATE postgres_changes 이벤트가 수신되어야 한다
**And** UI에서 status 표시가 자동으로 갱신되어야 한다

### Scenario 5: 페이지 이탈 시 채널 해제

**Given** 질문 상세 페이지에서 Realtime 채널이 구독 중이고
**When** 사용자가 해당 페이지를 떠나면
**Then** `unsubscribeFromChannel(channel)` 함수가 호출되어야 한다
**And** Supabase Realtime 채널이 해제되어야 한다

### Scenario 6: Realtime 유틸리티 테스트 커버리지

**Given** 구현이 완료되고
**When** `pnpm --filter web test --coverage lib/supabase/realtime` 커버리지를 측정하면
**Then** `realtime.ts` 85% 이상이어야 한다

---

## AC-007: AI Suggestion 스텁

**연관 요구사항**: REQ-BE-004-030~031

### Scenario 1: AI Suggestion 요청 시 graceful failure

**Given** `useRequestAISuggestion(questionId)` mutation이 수정되고
**When** mutation을 실행하면
**Then** "AI 추천 기능은 준비 중입니다" 메시지와 함께 에러 상태가 되어야 한다

### Scenario 2: REST API 호출 제거

**Given** `useRequestAISuggestion.ts` 파일을 확인하고
**When** 코드 내용을 검사하면
**Then** `/api/v1/qa/questions/:id/ai-suggest` REST API 호출이 존재하지 않아야 한다

---

## AC-008: 타입 정렬

**연관 요구사항**: REQ-BE-004-032~033

### Scenario 1: QAQuestion 타입 호환성

**Given** `lib/supabase/qa.ts`의 매핑 함수가 구현되고
**When** `getQuestionDetail()` 함수의 반환 타입을 확인하면
**Then** `QAQuestion` 타입과 완전히 호환되어야 한다 (TypeScript 컴파일 오류 없음)

### Scenario 2: QAListItem 타입 호환성

**Given** `lib/supabase/qa.ts`의 매핑 함수가 구현되고
**When** `getQuestions()` 함수의 반환값 내 data 배열의 요소 타입을 확인하면
**Then** `QAListItem` 타입과 완전히 호환되어야 한다

### Scenario 3: QAAnswer 타입 호환성

**Given** `lib/supabase/qa.ts`의 매핑 함수가 구현되고
**When** answers 매핑 결과의 타입을 확인하면
**Then** `QAAnswer` 타입과 완전히 호환되어야 한다

---

## AC-009: 레거시 REST 참조 제거

**연관 요구사항**: REQ-BE-004-034~036

### Scenario 1: REST API 호출 제거 확인

**Given** 모든 Q&A hooks가 Supabase로 전환된 후
**When** Q&A hooks 디렉토리에서 `/api/v1/qa` 패턴을 검색하면
**Then** 해당 패턴이 발견되지 않아야 한다

### Scenario 2: REST import 제거 확인

**Given** 모든 Q&A hooks가 전환된 후
**When** Q&A hooks 디렉토리에서 `lib/api` import 패턴을 검색하면
**Then** 해당 import가 발견되지 않아야 한다

### Scenario 3: TypeScript 컴파일 성공

**Given** REST 참조가 제거된 후
**When** `pnpm --filter web tsc --noEmit`을 실행하면
**Then** Q&A 관련 새로운 타입 오류가 없어야 한다

### Scenario 4: 기존 테스트 모두 통과

**Given** 모든 전환과 정리가 완료된 후
**When** `pnpm test`를 실행하면
**Then** 기존 테스트가 모두 통과해야 한다
**And** 새로운 테스트 실패가 없어야 한다

---

## Definition of Done (완료 기준)

SPEC-BE-004가 완료된 것으로 간주하는 최소 조건:

**필수 조건 (Primary Goals)**

- [ ] `supabase/migrations/00014_create_vote_count_triggers.sql`: 트리거 마이그레이션 파일 존재 및 적용 가능
- [ ] `apps/web/lib/supabase/qa.ts`: 10개 쿼리 함수 모두 구현 (getQuestions, getQuestionDetail, createQuestion, updateQuestion, changeQuestionStatus, createAnswer, acceptAnswer, toggleQuestionVote, toggleAnswerVote + 매핑 함수)
- [ ] `apps/web/lib/supabase/realtime.ts`: subscribeToQuestion, unsubscribeFromChannel 구현
- [ ] `packages/shared/src/constants/realtime.ts`: QA_CHANNELS, QA_REALTIME_FILTERS 상수 정의
- [ ] 4개 Question hooks 전환 완료 (REST API 호출 없음)
- [ ] 3개 Answer/Status hooks 전환 완료 (REST API 호출 없음)
- [ ] 2개 Vote hooks 전환 완료 (optimistic update 포함)
- [ ] 1개 WebSocket hook 재구현 완료 (Supabase Realtime)
- [ ] TypeScript 컴파일: 새로운 오류 0개
- [ ] ESLint: 새로운 경고 0개
- [ ] 기존 테스트 모두 통과

**권장 조건 (Secondary Goals)**

- [ ] `useRequestAISuggestion` graceful failure 처리 완료
- [ ] Q&A hooks 내 모든 REST API 참조 제거 확인
- [ ] `lib/supabase/qa.ts` 테스트 커버리지 85%+
- [ ] `lib/supabase/realtime.ts` 테스트 커버리지 85%+
- [ ] Q&A hooks 테스트 커버리지 85%+
- [ ] `qa.types.ts` 타입 정렬 검증 완료

**검증 방법**

```bash
# 1. 타입 검사
pnpm --filter web tsc --noEmit

# 2. 린트 검사
pnpm --filter web lint

# 3. 테스트 실행
pnpm test

# 4. 커버리지 확인
pnpm --filter web test --coverage

# 5. REST API 참조 확인 (0이어야 함)
grep -r "api\.get.*\/api\/v1\/qa" apps/web/hooks/qa/
grep -r "api\.post.*\/api\/v1\/qa" apps/web/hooks/qa/
grep -r "api\.patch.*\/api\/v1\/qa" apps/web/hooks/qa/
grep -r "lib/api" apps/web/hooks/qa/

# 6. Realtime 상수 확인
cat packages/shared/src/constants/realtime.ts

# 7. 트리거 마이그레이션 확인
ls supabase/migrations/00014_create_vote_count_triggers.sql
```
