---
spec_id: SPEC-BE-004
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-BE-004 Implementation Plan: Q&A System Supabase Backend Integration

## Development Methodology

**Hybrid Mode**:
- 기존 hooks 전환 (DDD): ANALYZE-PRESERVE-IMPROVE 사이클 적용
- 신규 파일 (TDD): 쿼리 함수, Realtime 유틸리티 먼저 테스트 작성 후 구현

**품질 목표**: 85%+ 테스트 커버리지

---

## Phase Overview

| Phase | 내용 | 우선순위 |
|-------|------|---------|
| A | Vote/Answer count 트리거 마이그레이션 | Primary Goal |
| B | Supabase 쿼리 레이어 신규 생성 (qa.ts) | Primary Goal |
| C | Question hooks 전환 (4개) | Primary Goal |
| D | Answer + Status hooks 전환 (3개) | Primary Goal |
| E | Vote hooks 전환 (2개) | Primary Goal |
| F | Supabase Realtime 구현 | Primary Goal |
| G | AI Suggestion hook 스텁 처리 | Secondary Goal |
| H | 레거시 REST 참조 제거 | Secondary Goal |
| I | 타입 정렬 확인 | Secondary Goal |
| J | 테스트 커버리지 달성 | Secondary Goal |

---

## Phase A: Vote/Answer Count 트리거 마이그레이션 (Primary Goal)

**목표**: votes INSERT/DELETE/UPDATE 시 자동으로 upvote_count 업데이트, answers INSERT/DELETE 시 answer_count 업데이트

### 작업 목록

1. **마이그레이션 파일 작성**
   - `supabase/migrations/00014_create_vote_count_triggers.sql` 생성
   - `update_vote_count()` 트리거 함수: INSERT/DELETE/UPDATE에 따라 question 또는 answer의 upvote_count 조정
   - `update_answer_count()` 트리거 함수: INSERT/DELETE에 따라 question의 answer_count 조정
   - `SECURITY DEFINER`로 RLS 우회 (트리거 내부 UPDATE)

2. **마이그레이션 적용**
   - `supabase migration up` 또는 `pnpm db:reset` 실행
   - 로컬 DB에서 트리거 동작 확인

3. **트리거 동작 검증**
   - votes INSERT 후 questions.upvote_count 확인
   - votes DELETE 후 questions.upvote_count 감소 확인
   - answers INSERT 후 questions.answer_count 확인

**요구사항 매핑**: REQ-BE-004-001~007

---

## Phase B: Supabase 쿼리 레이어 신규 생성 (Primary Goal)

**목표**: hooks가 사용할 Supabase 쿼리 함수 모듈 작성 (TDD 방식, SPEC-BE-003 패턴 준수)

### 작업 목록

#### B-1: `apps/web/lib/supabase/qa.ts` 작성

작성 순서 (TDD):

1. **Row 타입 별칭 및 매핑 함수 작성**
   - QuestionRow, AnswerRow, VoteRow 타입 별칭
   - `mapQuestionRowToListItem()`: flat DB row -> QAListItem 변환
   - `mapQuestionRowToDetail()`: flat DB row -> QAQuestion 변환 (context nested, author JOIN)
   - `mapAnswerRow()`: flat DB row -> QAAnswer 변환

2. **`getQuestions(params, userId?)` 테스트 -> 구현**
   - questions + profiles(author) + courses(courseName) + materials(materialTitle) JOIN
   - votes 테이블에서 현재 사용자의 투표 여부 batch 조회
   - answers에서 is_ai_generated=true 존재 여부로 hasAiSuggestion 계산
   - 필터: courseId, materialId, status, search(ILIKE)
   - 정렬: newest(created_at DESC), upvotes(upvote_count DESC), answers(answer_count DESC), unanswered(answer_count ASC + status='OPEN')
   - 페이지네이션: .range() 기반 (useInfiniteQuery 호환)

3. **`getQuestionDetail(questionId, userId?)` 테스트 -> 구현**
   - question + author + course + material JOIN
   - 해당 question의 모든 answers (각각 author JOIN)
   - 현재 사용자 기준 isUpvoted 계산 (question + 각 answer)
   - is_ai_generated=true인 answer를 aiSuggestion으로 분리

4. **`createQuestion(payload, authorId)` 테스트 -> 구현**
   - questions INSERT
   - context.headingId -> heading_id, context.selectedText -> selected_text 매핑

5. **`updateQuestion(questionId, payload)` 테스트 -> 구현**
   - questions UPDATE (title, content)

6. **`changeQuestionStatus(questionId, status)` 테스트 -> 구현**
   - questions UPDATE (status)

7. **`createAnswer(questionId, payload, authorId)` 테스트 -> 구현**
   - answers INSERT
   - answer_count는 트리거가 자동 처리

8. **`acceptAnswer(questionId, answerId)` 테스트 -> 구현**
   - 해당 question의 모든 answers: is_accepted = false
   - 대상 answer: is_accepted = true
   - question: status = 'RESOLVED'
   - 트랜잭션 보장 필요 (RPC 함수 또는 순차 호출)

9. **`toggleQuestionVote(questionId, userId)` 테스트 -> 구현**
   - votes에서 기존 투표 조회
   - 있으면 DELETE, 없으면 INSERT(value=1, target_type='question')
   - upvote_count는 트리거가 자동 처리
   - 반환: { voted: boolean, newCount: number }

10. **`toggleAnswerVote(answerId, userId)` 테스트 -> 구현**
    - 동일 toggle 로직 (target_type='answer')

#### B-2: `packages/shared/src/constants/realtime.ts` 작성

- QA_CHANNELS 상수 정의
- QA_REALTIME_FILTERS 상수 정의
- 기존 events.ts와 중복 확인 및 정리

#### B-3: `apps/web/lib/supabase/realtime.ts` 작성

작성 순서 (TDD):

1. **`subscribeToQuestion(questionId, callbacks)` 테스트 -> 구현**
   - createClient()에서 channel 생성
   - postgres_changes: answers INSERT, questions UPDATE, answers UPDATE 구독
   - 각 이벤트에 대해 적절한 callback 호출

2. **`unsubscribeFromChannel(channel)` 테스트 -> 구현**
   - channel.unsubscribe() 호출

**요구사항 매핑**: REQ-BE-004-008~009, REQ-BE-004-024~029, REQ-BE-004-032~033, REQ-BE-004-037~038

---

## Phase C: Question Hooks 전환 (Primary Goal)

**목표**: 4개 Question hooks를 REST API -> Supabase 쿼리 레이어로 전환

**DDD 접근법** (기존 코드이므로):
- ANALYZE: 각 hook의 현재 동작과 TanStack Query 키 확인
- PRESERVE: query key 형식 유지, 반환 타입 인터페이스 유지
- IMPROVE: REST API 호출 -> `lib/supabase/qa.ts` 함수 호출

### 전환 대상 (4개)

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `useQAList.ts` | `api.get('/api/v1/qa/questions')` (useInfiniteQuery) | `getQuestions(params, userId)` |
| `useQADetail.ts` | `api.get('/api/v1/qa/questions/:id')` | `getQuestionDetail(questionId, userId)` |
| `useCreateQuestion.ts` | `api.post('/api/v1/qa/questions')` | `createQuestion(payload, authorId)` |
| `useUpdateQuestion.ts` | `api.patch('/api/v1/qa/questions/:id')` | `updateQuestion(questionId, payload)` |

**요구사항 매핑**: REQ-BE-004-010~014

---

## Phase D: Answer + Status Hooks 전환 (Primary Goal)

**목표**: 3개 Answer/Status hooks를 REST API -> Supabase 쿼리 레이어로 전환

### 전환 대상 (3개)

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `useCreateAnswer.ts` | `api.post('/api/v1/qa/questions/:id/answers')` | `createAnswer(questionId, payload, authorId)` |
| `useAcceptAnswer.ts` | `api.patch('/api/v1/qa/questions/:id/answers/:aid/accept')` | `acceptAnswer(questionId, answerId)` |
| `useChangeQuestionStatus.ts` | `api.patch('/api/v1/qa/questions/:id/status')` | `changeQuestionStatus(questionId, status)` |

**요구사항 매핑**: REQ-BE-004-015~019

---

## Phase E: Vote Hooks 전환 (Primary Goal)

**목표**: 2개 Vote hooks를 REST API -> Supabase 쿼리 레이어로 전환 (optimistic update 포함)

### 전환 대상 (2개)

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `useUpvoteQuestion.ts` | `api.post('/api/v1/qa/questions/:id/upvote')` (full optimistic) | `toggleQuestionVote(questionId, userId)` |
| `useUpvoteAnswer.ts` | `api.post('/api/v1/qa/questions/:id/answers/:aid/upvote')` | `toggleAnswerVote(answerId, userId)` |

핵심 구현:
- Optimistic update: onMutate에서 캐시 즉시 업데이트 (isUpvoted 토글, upvoteCount +/- 1)
- onError에서 이전 데이터로 롤백
- onSettled에서 서버 데이터로 재동기화

**요구사항 매핑**: REQ-BE-004-020~023

---

## Phase F: Supabase Realtime 구현 (Primary Goal)

**목표**: REST WebSocket 스텁을 Supabase Realtime으로 완전 재구현

### 작업 목록

1. **`useQAWebSocket.ts` 재구현**
   - 기존 WS 스텁 코드 전체 교체
   - `subscribeToQuestion(questionId, callbacks)` 호출
   - 콜백에서 TanStack Query 캐시 invalidation 수행
     - onNewAnswer: `qaKeys.detail(questionId)` invalidate
     - onQuestionUpdated: `qaKeys.detail(questionId)` + `qaKeys.lists()` invalidate
     - onAnswerUpdated: `qaKeys.detail(questionId)` invalidate
   - cleanup: 컴포넌트 언마운트 시 `unsubscribeFromChannel(channel)` 호출

2. **Realtime 이벤트 -> 쿼리 캐시 갱신 전략**
   - Realtime은 변경 알림(row 데이터 포함)만 수신
   - JOIN 데이터는 포함되지 않으므로 invalidateQueries로 전체 재조회
   - 빈번한 invalidation 방지: debounce 또는 `refetchInterval` 활용

**요구사항 매핑**: REQ-BE-004-024~029

---

## Phase G: AI Suggestion Hook 스텁 처리 (Secondary Goal)

**목표**: `useRequestAISuggestion` 훅을 graceful failure 패턴으로 전환

### 작업 목록

1. **`useRequestAISuggestion.ts` 수정**
   - REST API 호출 제거
   - 구현 전략: 호출 시 "AI 추천 기능은 준비 중입니다" 에러를 throw
   - UI에서 해당 에러를 감지하여 사용자에게 안내 메시지 표시
   - SPEC-AI-001 구현 시 실제 Edge Function 호출로 교체

**요구사항 매핑**: REQ-BE-004-030~031

---

## Phase H: 레거시 REST 참조 제거 (Secondary Goal)

**목표**: Q&A hooks 내 모든 REST API 호출 코드 완전 제거

### 작업 목록

1. **REST API 참조 검색**
   - grep으로 Q&A hooks 디렉토리에서 `api.get`, `api.post`, `api.patch`, `api.delete` 패턴 검색
   - `/api/v1/qa` 패턴 검색
   - `lib/api` import 검색

2. **잔여 참조 제거**
   - 발견된 모든 REST 참조를 Supabase 쿼리 레이어로 교체
   - import 경로 업데이트

3. **`apps/web/lib/api/index.ts` 검토**
   - Q&A 관련 export가 있으면 제거
   - 다른 도메인 API가 남아있으면 파일 유지

4. **TypeScript 컴파일 재확인**
   - `pnpm --filter web tsc --noEmit`
   - ESLint: `pnpm --filter web lint`

**요구사항 매핑**: REQ-BE-004-034~036

---

## Phase I: 타입 정렬 확인 (Secondary Goal)

**목표**: `packages/shared/src/types/qa.types.ts`와 DB 스키마 정합성 확인

### 작업 목록

1. **qa.types.ts 필드별 DB 매핑 확인**
   - QAQuestion: 모든 필드가 쿼리 레이어에서 올바르게 구성되는지 확인
   - QAListItem: 목록 조회 시 모든 필드가 채워지는지 확인
   - QAAnswer: author JOIN, isUpvoted 계산 확인
   - QACreateRequest: context 필드가 flat DB 컬럼으로 분해되는지 확인

2. **불필요한 타입 필드 정리**
   - `QAWebSocketNotification`: Supabase Realtime으로 대체되었으나, UI 호환을 위해 유지할지 결정
   - `aiSuggestionPending`: 클라이언트 상태로 유지 (DB 반영 없음)

3. **TypeScript 컴파일 검증**
   - 모든 매핑 함수의 반환 타입이 shared 타입과 일치하는지 확인

**요구사항 매핑**: REQ-BE-004-032~033

---

## Phase J: 테스트 커버리지 달성 (Secondary Goal)

**목표**: Q&A 쿼리 레이어 및 hooks 85%+ 커버리지

### 테스트 전략

**신규 쿼리 레이어** (TDD - Phase B에서 먼저 작성):
- `lib/supabase/qa.ts`: 각 함수별 vitest 단위 테스트
  - Mock: Supabase client mock (vitest.mock)
  - 정상 케이스 + 에러 케이스 + 매핑 검증
- `lib/supabase/realtime.ts`: 채널 생성/구독/해제 테스트
  - Mock: Supabase channel mock

**기존 hooks** (DDD - 전환 후 검증):
- Q&A hooks: 전환 후 기존 테스트 통과 확인
- 신규 테스트: optimistic update 동작, Realtime 통합

### 커버리지 목표

| 모듈 | 현재 | 목표 |
|------|------|------|
| `lib/supabase/qa.ts` | - (신규) | 85%+ |
| `lib/supabase/realtime.ts` | - (신규) | 85%+ |
| `hooks/qa/**` | 0%~미확인 | 85%+ |

---

## Technical Approach

### Supabase 쿼리 패턴 (SPEC-BE-003 기반)

**Question 목록 JOIN 쿼리**:
```typescript
const { data, count } = await supabase
  .from('questions')
  .select(
    `
    *,
    author:profiles!author_id(id, display_name, avatar_url, role),
    course:courses!course_id(title),
    material:materials!material_id(title)
    `,
    { count: 'exact' }
  )
  .eq('course_id', params.courseId)  // 필터 (조건부)
  .range(from, to)
  .order('created_at', { ascending: false });
```

**현재 사용자 votes 일괄 조회**:
```typescript
// 별도 쿼리로 현재 사용자의 투표 목록 가져오기
const { data: userVotes } = await supabase
  .from('votes')
  .select('target_id, target_type, value')
  .eq('user_id', userId)
  .in('target_id', questionIds);

// 매핑 시 활용
const isUpvoted = userVotes?.some(v => v.target_id === questionId) ?? false;
```

**Vote 토글 로직**:
```typescript
// 기존 투표 확인
const { data: existing } = await supabase
  .from('votes')
  .select('id')
  .eq('user_id', userId)
  .eq('target_type', 'question')
  .eq('target_id', questionId)
  .maybeSingle();

if (existing) {
  // 투표 취소
  await supabase.from('votes').delete().eq('id', existing.id);
  return { voted: false, newCount: currentCount - 1 };
} else {
  // 새 투표
  await supabase.from('votes').insert({
    user_id: userId,
    target_type: 'question',
    target_id: questionId,
    value: 1,
  });
  return { voted: true, newCount: currentCount + 1 };
}
```

**snake_case -> camelCase 매핑** (SPEC-BE-003 패턴 준수):
```typescript
function mapQuestionRowToListItem(row: any, userId?: string): QAListItem {
  return {
    id: row.id,
    courseId: row.course_id,
    courseName: row.course?.title ?? '',
    materialId: row.material_id,
    materialTitle: row.material?.title ?? '',
    author: {
      id: row.author.id,
      name: row.author.display_name,
      avatarUrl: row.author.avatar_url ?? null,
      role: row.author.role,
    },
    title: row.title,
    context: { selectedText: row.selected_text ?? '' },
    status: row.status as QAStatus,
    upvoteCount: row.upvote_count,
    answerCount: row.answer_count,
    hasAiSuggestion: false, // 별도 서브쿼리 또는 JOIN으로 계산
    createdAt: row.created_at,
  };
}
```

### 에러 처리 패턴

```typescript
const { data, error } = await supabase.from('questions').select('*');
if (error) {
  throw new Error(`Failed to fetch questions: ${error.message}`);
}
return data;
```

### TanStack Query 키 전략

기존 키 패턴 유지 (qa-keys.ts):
- 질문 목록: `qaKeys.list(params)`
- 질문 상세: `qaKeys.detail(questionId)`
- 질문 답변: `qaKeys.answers(questionId)`

---

## Priority Order

### Primary Goal (필수 - run phase 완료 조건)

1. Phase A: Vote/Answer count 트리거 마이그레이션 (모든 것의 기반)
2. Phase B: Supabase 쿼리 레이어 신규 생성 (hooks가 의존)
3. Phase C: Question hooks 4개 전환
4. Phase D: Answer + Status hooks 3개 전환
5. Phase E: Vote hooks 2개 전환 (optimistic update)
6. Phase F: Supabase Realtime 구현 (useQAWebSocket 재구현)

### Secondary Goal (품질 향상)

7. Phase G: AI Suggestion hook 스텁 처리
8. Phase H: 레거시 REST 참조 제거
9. Phase I: 타입 정렬 확인
10. Phase J: 테스트 커버리지 달성

### Optional Goal

- Realtime presence (현재 질문을 보고 있는 사용자 표시)
- Answer count badge Realtime 업데이트 (목록 페이지에서)
- Vote count Realtime 업데이트 (다른 사용자의 투표가 실시간 반영)

---

## Implementation Notes

### 주의사항

1. **RLS 정책 신뢰**: 별도 권한 체크 불필요, Supabase RLS가 처리
2. **타입 안전성**: Supabase 클라이언트에 `Database` 제네릭 타입 전달 필수
3. **서버 vs 클라이언트**: hooks는 클라이언트 컴포넌트에서 실행되므로 `createClient()`(browser) 사용
4. **Realtime 채널 관리**: 컴포넌트 언마운트 시 반드시 unsubscribe (메모리 누수 방지)
5. **Optimistic Update**: vote 관련 mutation은 반드시 rollback 로직 포함
6. **AI Suggestion**: SPEC-AI-001 전까지 스텁으로 처리, graceful failure 보장
7. **트리거 SECURITY DEFINER**: vote count 트리거는 RLS를 우회해야 하므로 SECURITY DEFINER 사용

### 파일 수정 순서 (의존성 기반)

```
00014_create_vote_count_triggers.sql (트리거 마이그레이션)
  |
packages/shared/src/constants/realtime.ts (Realtime 상수)
  |
lib/supabase/qa.ts (Q&A 쿼리 함수)
lib/supabase/realtime.ts (Realtime 유틸리티)
  |
hooks/qa/ (각 hook 파일 전환)
  |
REST 참조 제거 + 타입 정렬 확인
```

### 테스트 실행 명령어

```bash
# 전체 테스트
pnpm test

# 특정 모듈 테스트
pnpm --filter web test lib/supabase/qa
pnpm --filter web test lib/supabase/realtime
pnpm --filter web test hooks/qa

# 커버리지 확인
pnpm --filter web test --coverage

# 타입 체크
pnpm --filter web tsc --noEmit

# ESLint
pnpm --filter web lint
```
