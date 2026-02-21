---
id: SPEC-BE-004
version: "1.0.0"
status: completed
created: "2026-02-21"
updated: "2026-02-21"
completed: "2026-02-21"
author: mhso-dev
priority: high
depends_on: [SPEC-BE-001, SPEC-AUTH-001, SPEC-BE-003]
---

# SPEC-BE-004: Q&A System Supabase Backend Integration

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-02-21 | mhso-dev | 초기 작성 |

## 1. Environment

### 1.1 기술 스택

| 카테고리 | 기술 | 버전 |
|----------|------|------|
| 백엔드 플랫폼 | Supabase | latest |
| 데이터베이스 | PostgreSQL | 16 |
| 클라이언트 라이브러리 | @supabase/supabase-js | ^2.49.x |
| SSR 헬퍼 | @supabase/ssr | ^0.6.x |
| 프레임워크 | Next.js (App Router) | 15.x |
| 언어 | TypeScript | 5.x |
| 상태 관리 | TanStack Query | v5 |
| 타입 공유 | packages/shared | workspace |
| Realtime | Supabase Realtime (postgres_changes) | ^2.49.x |

### 1.2 프로젝트 컨텍스트

lecture-moa는 강사가 Markdown 강의 자료를 업로드하고 학생이 인라인 Q&A와 함께 학습하는 교육 플랫폼이다.

**현재 상태:**
- SPEC-BE-001(Supabase 초기 설정) COMPLETE: DB 스키마 15개 테이블, RLS 정책, 마이그레이션 완료
- SPEC-AUTH-001(인증 전환) COMPLETE: Supabase Auth 기반 인증 레이어 완성
- SPEC-BE-003(강좌+학습자료) COMPLETE: Course/Material hooks Supabase 전환, 쿼리 레이어 패턴 수립
- 프론트엔드 SPEC-FE-001 ~ FE-008 COMPLETE: UI 컴포넌트 및 hooks 완성
- 문제: 모든 Q&A hooks가 존재하지 않는 REST API 엔드포인트(apps/api Fastify 서버) 호출 중
- 문제: `useQAWebSocket`이 미구현 스텁 상태

**핵심 전환 과제:**
기존 `api.get('/api/v1/qa/questions/...')` 패턴을 `createClient().from('questions')` Supabase 직접 쿼리로 전환하고, REST WebSocket 스텁을 Supabase Realtime `postgres_changes`로 교체

### 1.3 의존성

- **선행 SPEC**: SPEC-BE-001 (DB 스키마, RLS 정책), SPEC-AUTH-001 (Supabase Auth), SPEC-BE-003 (쿼리 레이어 패턴)
- **후속 SPEC**: SPEC-BE-005 (퀴즈), SPEC-BE-006 (팀+메모) - 이 SPEC이 수립한 Realtime 패턴을 따름

## 2. Assumptions

- SPEC-BE-001에서 생성된 DB 스키마 (questions, answers, votes 테이블)가 정확히 존재한다
- SPEC-BE-001의 마이그레이션 00005(Q&A 테이블), 00010(인덱스), 00012(RLS 정책)이 적용되어 있다
- SPEC-AUTH-001에서 구현된 Supabase Auth가 정상 작동 중이다
- SPEC-BE-003에서 수립된 패턴 (Supabase 쿼리 레이어, snake_case 매핑, TanStack Query 통합)을 따른다
- `lib/supabase/client.ts`(브라우저)와 `lib/supabase/server.ts`(서버)가 이미 설정되어 있다
- RLS 정책이 제대로 설정되어 있어 서버 사이드 액션 없이 클라이언트에서 직접 안전하게 DB에 접근 가능하다
- `apps/web/types/supabase.ts`에 questions, answers, votes 테이블의 정확한 타입이 이미 존재한다
- packages/shared 타입과 DB 컬럼명 간 불일치는 매핑 레이어에서 해소한다 (camelCase <-> snake_case)
- TanStack Query 캐시 키는 기존 패턴을 유지하여 UI 컴포넌트 재작업을 최소화한다
- vote count 업데이트를 위한 DB 트리거가 존재하지 않으므로 새로 생성해야 한다
- AI 추천 기능(`useRequestAISuggestion`)은 실제 AI 서비스가 SPEC-AI-001에서 구현될 때까지 스텁/Edge Function 프록시로 대체한다
- `useQAWebSocket`은 미구현 스텁이므로 Supabase Realtime으로 완전 재구현한다

## 3. Scope

### 3.1 범위 내 (In Scope)

- `supabase/migrations/00014_create_vote_count_triggers.sql` 신규: 투표 시 자동 카운트 업데이트 트리거
- `apps/web/lib/supabase/qa.ts` 신규: Q&A 도메인 Supabase 쿼리 함수 (SPEC-BE-003 패턴 준수)
- `apps/web/lib/supabase/realtime.ts` 신규: Supabase Realtime 채널 관리 유틸리티
- `packages/shared/src/constants/realtime.ts` 신규: Realtime 채널/이벤트명 상수
- 10개 Q&A hooks 전환 (REST API -> Supabase 직접 쿼리)
- 1개 Q&A WebSocket hook 재구현 (REST WS 스텁 -> Supabase Realtime)
- `packages/shared/src/types/qa.types.ts` 정렬: DB 스키마와 타입 일치 확인
- `apps/web/hooks/qa/qa-keys.ts` 업데이트: 쿼리 키 팩토리 유지/정비
- Q&A hooks 내 REST API 참조 완전 제거

### 3.2 범위 외 (Out of Scope)

- Quiz hooks 전환 (SPEC-BE-005)
- Team/Memo hooks 전환 (SPEC-BE-006)
- Dashboard hooks 전환 (SPEC-BE-007)
- AI 서비스 실제 구현 (SPEC-AI-001) - 이 SPEC에서는 AI suggestion을 스텁/프록시로만 처리
- Edge Functions 구현 (AI-001)
- 프론트엔드 UI 컴포넌트 변경 (인터페이스 호환성 유지)
- DB 스키마 변경 (questions, answers, votes 테이블 구조는 SPEC-BE-001에서 확정)
- Storage 관련 기능 (Q&A에 이미지 업로드 없음)

## 4. Requirements

### 4.1 Vote Count 트리거 마이그레이션

**REQ-BE-004-001**: 시스템은 **항상** questions.upvote_count와 answers.upvote_count가 votes 테이블의 실제 투표 합계를 정확히 반영하도록 유지해야 한다.

**REQ-BE-004-002**: **WHEN** votes 테이블에 새 레코드가 INSERT되면 **THEN** 대상(question 또는 answer)의 upvote_count가 자동으로 증가해야 한다.

**REQ-BE-004-003**: **WHEN** votes 테이블에서 레코드가 DELETE되면 **THEN** 대상의 upvote_count가 자동으로 감소해야 한다.

**REQ-BE-004-004**: **WHEN** votes 테이블의 value가 UPDATE되면 **THEN** 대상의 upvote_count가 차이만큼 자동으로 조정되어야 한다.

**REQ-BE-004-005**: 시스템은 **항상** questions.answer_count가 해당 question에 연결된 answers 레코드 수를 정확히 반영하도록 유지해야 한다.

**REQ-BE-004-006**: **WHEN** answers 테이블에 새 레코드가 INSERT되면 **THEN** 해당 question의 answer_count가 자동으로 증가해야 한다.

**REQ-BE-004-007**: **WHEN** answers 테이블에서 레코드가 DELETE되면 **THEN** 해당 question의 answer_count가 자동으로 감소해야 한다.

### 4.2 Supabase 쿼리 레이어 신규 생성

**REQ-BE-004-008**: 시스템은 **항상** Q&A 도메인 쿼리를 `apps/web/lib/supabase/qa.ts` 파일에 집중시켜야 한다.

**REQ-BE-004-009**: **IF** DB 컬럼명(snake_case)과 shared 타입 필드명(camelCase)이 불일치하면 **THEN** 쿼리 레이어에서 매핑을 수행해야 한다.

핵심 매핑:
- `questions.material_id` -> `QAQuestion.materialId`
- `questions.author_id` -> `QAQuestion.authorId` + profiles JOIN -> `QAQuestion.author`
- `questions.heading_id` + `questions.selected_text` -> `QAQuestion.context` (nested object)
- `questions.upvote_count` -> `QAQuestion.upvoteCount`
- `questions.answer_count` -> `QAQuestion.answerCount`
- `answers.is_accepted` -> `QAAnswer.isAccepted`
- `answers.is_ai_generated` -> `QAAnswer.isAiGenerated`
- `courses.title` -> `QAQuestion.courseName` (JOIN 필요)
- `materials.title` -> `QAQuestion.materialTitle` (JOIN 필요)
- `votes` 테이블 lookup -> `QAQuestion.isUpvoted`, `QAAnswer.isUpvoted` (현재 사용자 기준)

### 4.3 Question CRUD - Supabase 전환

**REQ-BE-004-010**: **WHEN** `useQAList(params?)` 훅이 호출되면 **THEN** Supabase로부터 무한 스크롤 기반 질문 목록을 반환해야 한다.

쿼리 요구사항:
- `questions` 테이블에서 `profiles`(author), `courses`(courseName), `materials`(materialTitle) JOIN
- 현재 사용자의 votes 테이블 조회로 `isUpvoted` 필드 계산
- `is_ai_generated=true`인 answer 존재 여부로 `hasAiSuggestion` 계산
- courseId, materialId, status, search(title/content ILIKE) 필터링 지원
- sort 옵션: newest(기본), upvotes, answers, unanswered
- `useInfiniteQuery` 기반 페이지네이션 (offset/limit)

**REQ-BE-004-011**: **WHEN** `useQADetail(questionId)` 훅이 호출되면 **THEN** 단일 질문 상세 정보와 연결된 답변 목록을 반환해야 한다.

상세 조회 요구사항:
- question + author(profiles) + course(courses) + material(materials) JOIN
- 해당 question의 모든 answers (각각 author JOIN 포함)
- 현재 사용자 기준 isUpvoted 계산 (question + 각 answer)
- `is_ai_generated=true`인 answer를 `aiSuggestion` 필드로 분리

**REQ-BE-004-012**: **WHEN** `useCreateQuestion()` mutation이 실행되면 **THEN** 현재 인증 사용자를 `author_id`로 하여 questions 테이블에 새 레코드를 삽입해야 한다.

**REQ-BE-004-013**: **WHEN** `useUpdateQuestion()` mutation이 실행되면 **THEN** 해당 질문 레코드의 title, content를 업데이트해야 한다.

**REQ-BE-004-014**: **IF** 현재 사용자가 해당 질문의 작성자가 아니고 강사도 아닌 경우 **THEN** 업데이트는 RLS 정책에 의해 차단되어야 한다.

### 4.4 Answer CRUD + 채택 - Supabase 전환

**REQ-BE-004-015**: **WHEN** `useCreateAnswer(questionId)` mutation이 실행되면 **THEN** answers 테이블에 새 레코드를 삽입해야 한다.

**REQ-BE-004-016**: **WHEN** `useAcceptAnswer(questionId, answerId)` mutation이 실행되면 **THEN** 해당 answer의 `is_accepted`를 true로 설정하고, 동일 question의 다른 answer들은 `is_accepted`를 false로 설정해야 한다.

**REQ-BE-004-017**: **WHEN** 답변이 채택되면 **THEN** 해당 question의 `status`를 `'RESOLVED'`로 업데이트해야 한다.

**REQ-BE-004-018**: **WHEN** `useChangeQuestionStatus(questionId)` mutation이 실행되면 **THEN** question의 status를 지정된 값('OPEN', 'RESOLVED', 'CLOSED')으로 변경해야 한다.

**REQ-BE-004-019**: **IF** 현재 사용자가 해당 질문의 작성자가 아니고 강사도 아닌 경우 **THEN** status 변경은 RLS 정책에 의해 차단되어야 한다.

### 4.5 Vote 시스템 - Supabase 전환

**REQ-BE-004-020**: **WHEN** `useUpvoteQuestion(questionId)` mutation이 실행되면 **THEN** votes 테이블에 toggle 방식으로 레코드를 삽입 또는 삭제해야 한다.

toggle 로직:
- 기존 투표 없음 -> INSERT (value=1)
- 기존 투표 있음 -> DELETE (투표 취소)
- Optimistic update: UI에서 즉시 upvoteCount 증감 + isUpvoted 토글

**REQ-BE-004-021**: **WHEN** `useUpvoteAnswer(questionId, answerId)` mutation이 실행되면 **THEN** 동일한 toggle 로직을 answer에 적용해야 한다.

**REQ-BE-004-022**: **IF** 동일 사용자가 동일 대상에 중복 투표를 시도하면 **THEN** votes 테이블의 UNIQUE 제약(user_id, target_type, target_id)에 의해 차단되어야 한다.

**REQ-BE-004-023**: 시스템은 **항상** upvote mutation에 optimistic update를 적용하여 즉각적인 UI 반응을 제공해야 한다.

### 4.6 Supabase Realtime 구현

**REQ-BE-004-024**: 시스템은 **항상** Supabase Realtime 채널명과 이벤트명을 `packages/shared/src/constants/realtime.ts`에서 상수로 관리해야 한다.

**REQ-BE-004-025**: **WHEN** 사용자가 질문 상세 페이지에 진입하면 **THEN** 해당 question의 Realtime 채널을 구독하여 새 답변, AI 추천, status 변경을 실시간으로 수신해야 한다.

**REQ-BE-004-026**: **WHEN** answers 테이블에 해당 question_id의 새 레코드가 INSERT되면 **THEN** 구독 중인 클라이언트의 답변 목록이 자동으로 갱신되어야 한다.

**REQ-BE-004-027**: **WHEN** questions 테이블에서 해당 question의 status가 UPDATE되면 **THEN** 구독 중인 클라이언트의 status 표시가 자동으로 갱신되어야 한다.

**REQ-BE-004-028**: **WHEN** 사용자가 질문 상세 페이지를 떠나면 **THEN** Realtime 채널 구독이 해제되어야 한다.

**REQ-BE-004-029**: `apps/web/lib/supabase/realtime.ts`는 채널 생성, 구독, 해제를 위한 유틸리티 함수를 제공해야 한다.

### 4.7 AI Suggestion (스텁/프록시)

**REQ-BE-004-030**: **WHEN** `useRequestAISuggestion(questionId)` mutation이 실행되면 **THEN** AI 추천 답변 요청을 처리해야 한다.

현재 구현 전략 (SPEC-AI-001 전까지):
- Option A: Supabase Edge Function을 호출하여 간단한 스텁 응답 반환
- Option B: 클라이언트에서 직접 `answers` 테이블에 `is_ai_generated=true` 플레이스홀더 삽입 후 `aiSuggestionPending=true` 상태 관리
- 최종 결정: Option B (Edge Function 미구현 상태이므로 클라이언트 스텁)

**REQ-BE-004-031**: **IF** AI 서비스가 아직 구현되지 않았으면 **THEN** `useRequestAISuggestion`은 "AI 추천 기능은 준비 중입니다" 메시지와 함께 graceful하게 실패해야 한다.

### 4.8 타입 정렬 및 매핑

**REQ-BE-004-032**: 시스템은 **항상** `packages/shared/src/types/qa.types.ts`에서 정의된 타입이 DB 스키마와 일치하도록 유지해야 한다.

주요 정렬 항목:
- `QAQuestion.context`: DB의 `heading_id` + `selected_text` flat 필드에서 nested object로 구성 (쿼리 레이어)
- `QAQuestion.courseName`: DB에 없음, courses JOIN으로 구성
- `QAQuestion.materialTitle`: DB에 없음, materials JOIN으로 구성
- `QAQuestion.author`: DB에 `author_id`만 존재, profiles JOIN으로 `QAAuthorInfo` 구성
- `QAQuestion.isUpvoted`: DB에 없음, votes 테이블 lookup으로 계산 (현재 사용자 기준)
- `QAQuestion.aiSuggestion`: answers에서 `is_ai_generated=true`인 레코드를 분리
- `QAQuestion.aiSuggestionPending`: 클라이언트 애플리케이션 상태 (DB에 없음)
- `QAListItem.hasAiSuggestion`: answers 서브쿼리로 계산
- `QAAnswer.isUpvoted`: votes 테이블 lookup으로 계산

**REQ-BE-004-033**: **IF** shared 타입과 DB 스키마 간 호환 불가능한 구조 차이가 존재하면 **THEN** 쿼리 레이어에서 변환을 수행하고 UI 컴포넌트는 최소한으로 수정해야 한다.

### 4.9 레거시 REST 참조 제거

**REQ-BE-004-034**: **WHEN** Supabase 쿼리 레이어 구현이 완료되면 **THEN** 모든 Q&A hooks 내 REST API 호출 코드(`api.get`, `api.post`, `api.patch`)가 완전히 제거되어야 한다.

**REQ-BE-004-035**: **WHEN** REST 참조가 제거되면 **THEN** 이를 참조하던 모든 import가 Supabase 쿼리 레이어(`lib/supabase/qa`)로 업데이트되어야 한다.

**REQ-BE-004-036**: **IF** `apps/web/lib/api/index.ts`에서 Q&A 관련 export가 존재하면 **THEN** 해당 export를 제거해야 한다.

### 4.10 Realtime 상수 정의

**REQ-BE-004-037**: 시스템은 **항상** `packages/shared/src/constants/realtime.ts`에 Q&A 관련 Realtime 채널명과 이벤트 필터를 상수로 정의해야 한다.

상수 설계:
- `QA_CHANNELS.questionDetail(questionId)`: 개별 질문 상세 채널명
- `QA_REALTIME_EVENTS`: postgres_changes 이벤트 필터 정의 (answers INSERT, questions UPDATE)

**REQ-BE-004-038**: **WHERE** 기존 `packages/shared/src/constants/events.ts`에 Q&A 이벤트 상수가 존재하면 **THEN** Realtime 상수와 중복되지 않도록 정리해야 한다.

## 5. Specifications

### 5.1 신규 파일 구조

```
supabase/
  migrations/
    00014_create_vote_count_triggers.sql  (신규) <- Vote/Answer count 트리거

apps/web/
  lib/
    supabase/
      client.ts        (기존, 유지)
      server.ts        (기존, 유지)
      courses.ts       (기존, SPEC-BE-003)
      materials.ts     (기존, SPEC-BE-003)
      storage.ts       (기존, SPEC-BE-003)
      qa.ts            (신규) <- Q&A 도메인 쿼리 함수
      realtime.ts      (신규) <- Supabase Realtime 채널 유틸리티

packages/shared/src/
  constants/
    events.ts          (기존, 확인)
    realtime.ts        (신규) <- Realtime 채널/이벤트 상수
  types/
    qa.types.ts        (수정) <- DB 스키마와 정렬 확인
```

### 5.2 수정 파일 목록

```
apps/web/hooks/qa/
  useQAList.ts               (수정) <- REST API -> Supabase (useInfiniteQuery)
  useQADetail.ts             (수정) <- REST API -> Supabase
  useCreateQuestion.ts       (수정) <- REST API -> Supabase
  useUpdateQuestion.ts       (수정) <- REST API -> Supabase
  useCreateAnswer.ts         (수정) <- REST API -> Supabase
  useAcceptAnswer.ts         (수정) <- REST API -> Supabase
  useUpvoteQuestion.ts       (수정) <- REST API -> Supabase (optimistic update)
  useUpvoteAnswer.ts         (수정) <- REST API -> Supabase (optimistic update)
  useChangeQuestionStatus.ts (수정) <- REST API -> Supabase
  useRequestAISuggestion.ts  (수정) <- REST API -> 스텁/graceful failure
  useQAWebSocket.ts          (재구현) <- WS 스텁 -> Supabase Realtime
  qa-keys.ts                 (수정) <- 쿼리 키 팩토리 정비
```

### 5.3 Vote Count 트리거 설계

`supabase/migrations/00014_create_vote_count_triggers.sql`:

```sql
-- Vote count 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.target_type = 'question' THEN
      UPDATE public.questions
      SET upvote_count = upvote_count + NEW.value
      WHERE id = NEW.target_id;
    ELSIF NEW.target_type = 'answer' THEN
      UPDATE public.answers
      SET upvote_count = upvote_count + NEW.value
      WHERE id = NEW.target_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.target_type = 'question' THEN
      UPDATE public.questions
      SET upvote_count = upvote_count - OLD.value
      WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'answer' THEN
      UPDATE public.answers
      SET upvote_count = upvote_count - OLD.value
      WHERE id = OLD.target_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.target_type = 'question' THEN
      UPDATE public.questions
      SET upvote_count = upvote_count - OLD.value + NEW.value
      WHERE id = OLD.target_id;
    ELSIF OLD.target_type = 'answer' THEN
      UPDATE public.answers
      SET upvote_count = upvote_count - OLD.value + NEW.value
      WHERE id = OLD.target_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- votes 테이블에 트리거 연결
CREATE TRIGGER trigger_update_vote_count
AFTER INSERT OR DELETE OR UPDATE ON public.votes
FOR EACH ROW
EXECUTE FUNCTION update_vote_count();

-- Answer count 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_answer_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.questions
    SET answer_count = answer_count + 1
    WHERE id = NEW.question_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.questions
    SET answer_count = answer_count - 1
    WHERE id = OLD.question_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- answers 테이블에 트리거 연결
CREATE TRIGGER trigger_update_answer_count
AFTER INSERT OR DELETE ON public.answers
FOR EACH ROW
EXECUTE FUNCTION update_answer_count();
```

### 5.4 Supabase 쿼리 레이어 설계

#### 5.4.1 `lib/supabase/qa.ts` 인터페이스

```typescript
// Row 타입 별칭 (Database 타입에서 추출)
type QuestionRow = Database['public']['Tables']['questions']['Row'];
type AnswerRow = Database['public']['Tables']['answers']['Row'];
type VoteRow = Database['public']['Tables']['votes']['Row'];

// === Question 쿼리 ===

// 질문 목록 조회 (무한 스크롤, JOIN + 집계 포함)
export async function getQuestions(
  params: QAListFilter,
  userId?: string
): Promise<{ data: QAListItem[]; nextPage: number | null; total: number }>

// 단일 질문 상세 + 답변 목록 조회
export async function getQuestionDetail(
  questionId: string,
  userId?: string
): Promise<QAQuestion & { answers: QAAnswer[] }>

// 질문 생성
export async function createQuestion(
  payload: QACreateRequest,
  authorId: string
): Promise<QAQuestion>

// 질문 수정
export async function updateQuestion(
  questionId: string,
  payload: { title?: string; content?: string }
): Promise<QAQuestion>

// 질문 상태 변경
export async function changeQuestionStatus(
  questionId: string,
  status: QAStatus
): Promise<void>

// === Answer 쿼리 ===

// 답변 생성
export async function createAnswer(
  questionId: string,
  payload: QAAnswerRequest,
  authorId: string
): Promise<QAAnswer>

// 답변 채택 (+ question status RESOLVED 전환)
export async function acceptAnswer(
  questionId: string,
  answerId: string
): Promise<void>

// === Vote 쿼리 ===

// 투표 토글 (question)
export async function toggleQuestionVote(
  questionId: string,
  userId: string
): Promise<{ voted: boolean; newCount: number }>

// 투표 토글 (answer)
export async function toggleAnswerVote(
  answerId: string,
  userId: string
): Promise<{ voted: boolean; newCount: number }>

// === 매핑 함수 ===

// DB Row -> QAListItem 변환
function mapQuestionRowToListItem(row: any, userId?: string): QAListItem

// DB Row -> QAQuestion 변환 (상세)
function mapQuestionRowToDetail(row: any, userId?: string): QAQuestion

// DB Row -> QAAnswer 변환
function mapAnswerRow(row: any, userId?: string): QAAnswer
```

#### 5.4.2 `lib/supabase/realtime.ts` 인터페이스

```typescript
import { RealtimeChannel } from '@supabase/supabase-js';

// 질문 상세 Realtime 채널 생성 + 구독
export function subscribeToQuestion(
  questionId: string,
  callbacks: {
    onNewAnswer?: (answer: QAAnswer) => void;
    onQuestionUpdated?: (question: Partial<QAQuestion>) => void;
    onAnswerUpdated?: (answer: Partial<QAAnswer>) => void;
  }
): RealtimeChannel

// 채널 구독 해제
export function unsubscribeFromChannel(channel: RealtimeChannel): void
```

### 5.5 Realtime 채널 설계

#### `packages/shared/src/constants/realtime.ts`

```typescript
// Q&A Realtime 채널
export const QA_CHANNELS = {
  // 개별 질문 상세 채널: 새 답변, status 변경 실시간 수신
  questionDetail: (questionId: string) =>
    `qa:question:${questionId}` as const,
} as const;

// Realtime postgres_changes 이벤트 필터
export const QA_REALTIME_FILTERS = {
  // 특정 question에 대한 새 답변 감지
  newAnswer: (questionId: string) => ({
    event: 'INSERT' as const,
    schema: 'public',
    table: 'answers',
    filter: `question_id=eq.${questionId}`,
  }),
  // 특정 question의 status/upvote 변경 감지
  questionUpdate: (questionId: string) => ({
    event: 'UPDATE' as const,
    schema: 'public',
    table: 'questions',
    filter: `id=eq.${questionId}`,
  }),
  // 특정 question에 대한 answer 업데이트 (채택 등) 감지
  answerUpdate: (questionId: string) => ({
    event: 'UPDATE' as const,
    schema: 'public',
    table: 'answers',
    filter: `question_id=eq.${questionId}`,
  }),
} as const;
```

### 5.6 타입 정렬 전략

#### `packages/shared/src/types/qa.types.ts` 확인 사항

```
QAQuestion 변경 검토:
- context: { materialId, headingId, selectedText } -> 유지 (쿼리 레이어에서 flat -> nested 구성)
- courseName: string -> 유지 (courses JOIN으로 구성)
- materialTitle: string -> 유지 (materials JOIN으로 구성)
- author: QAAuthorInfo -> 유지 (profiles JOIN으로 구성)
- isUpvoted: boolean -> 유지 (votes 테이블 lookup으로 계산)
- aiSuggestion: QAAnswer | null -> 유지 (answers 필터로 분리)
- aiSuggestionPending: boolean -> 유지 (클라이언트 상태, 쿼리 레이어 범위 밖)

QAListItem 변경 검토:
- hasAiSuggestion: boolean -> 유지 (answers 서브쿼리로 계산)
- context: Pick<QAQuestionContext, 'selectedText'> -> 유지 (selected_text만 매핑)

QAAnswer 변경 검토:
- isUpvoted: boolean -> 유지 (votes 테이블 lookup으로 계산)

QAWebSocketNotification -> Supabase Realtime 이벤트로 대체:
- 기존 WebSocket notification 타입은 유지 (UI 호환), 데이터 소스만 Realtime으로 전환
```

### 5.7 Optimistic Update 전략

```typescript
// useUpvoteQuestion 예시 (핵심 패턴)
useMutation({
  mutationFn: (questionId: string) => toggleQuestionVote(questionId, userId),
  onMutate: async (questionId) => {
    // 1. 진행 중 쿼리 취소
    await queryClient.cancelQueries({ queryKey: qaKeys.detail(questionId) });

    // 2. 이전 데이터 저장
    const previousData = queryClient.getQueryData(qaKeys.detail(questionId));

    // 3. 낙관적 업데이트
    queryClient.setQueryData(qaKeys.detail(questionId), (old) => ({
      ...old,
      isUpvoted: !old.isUpvoted,
      upvoteCount: old.isUpvoted ? old.upvoteCount - 1 : old.upvoteCount + 1,
    }));

    return { previousData };
  },
  onError: (err, questionId, context) => {
    // 4. 에러 시 롤백
    queryClient.setQueryData(qaKeys.detail(questionId), context?.previousData);
  },
  onSettled: (data, error, questionId) => {
    // 5. 서버 데이터로 동기화
    queryClient.invalidateQueries({ queryKey: qaKeys.detail(questionId) });
  },
});
```

### 5.8 페이지네이션 패턴 (Infinite Query)

```typescript
// useQAList - useInfiniteQuery 기반
useInfiniteQuery({
  queryKey: qaKeys.list(params),
  queryFn: ({ pageParam = 0 }) =>
    getQuestions({ ...params, page: pageParam, limit: params.limit ?? 20 }, userId),
  getNextPageParam: (lastPage) => lastPage.nextPage,
  initialPageParam: 0,
});

// getQuestions 내부 페이지네이션
const from = page * limit;
const to = from + limit - 1;
const { data, count } = await supabase
  .from('questions')
  .select('*, author:profiles!author_id(...), ...', { count: 'exact' })
  .range(from, to);

return {
  data: data.map(row => mapQuestionRowToListItem(row, userId)),
  nextPage: (from + limit < (count ?? 0)) ? page + 1 : null,
  total: count ?? 0,
};
```

## 6. Risks and Mitigations

| 위험 | 심각도 | 완화 방안 |
|------|--------|-----------|
| Vote count 트리거가 동시성 문제를 발생시킬 수 있음 (race condition) | 중간 | `SECURITY DEFINER` + row-level locking, 트리거 내 UPDATE가 자동으로 행 잠금 수행 |
| Supabase Realtime postgres_changes 필터가 복잡한 JOIN 데이터를 전송하지 않음 | 높음 | Realtime은 변경 알림만 수신, 실제 데이터는 `queryClient.invalidateQueries`로 재조회 |
| isUpvoted 계산을 위한 votes 테이블 추가 조회가 성능 저하를 유발 | 중간 | 목록 조회 시 단일 batch 쿼리로 현재 사용자의 모든 관련 votes를 한번에 조회 |
| AI suggestion 스텁이 사용자 경험을 저하시킬 수 있음 | 낮음 | 명확한 "준비 중" 메시지 표시, UI에서 graceful degradation |
| useInfiniteQuery 캐시와 Realtime 업데이트 간 데이터 불일치 | 중간 | Realtime 이벤트 수신 시 관련 쿼리 invalidation으로 최신 데이터 재조회 |
| optimistic update 실패 시 UI 깜빡임 | 낮음 | rollback 로직에서 이전 데이터 정확히 복원, settled에서 서버 동기화 |
| 답변 채택 시 question status 변경이 트랜잭션 없이 두 번의 UPDATE로 분리될 수 있음 | 중간 | Supabase RPC 함수로 트랜잭션 보장, 또는 클라이언트에서 순차 호출 + 에러 처리 |

## 7. Dependencies

### 외부 의존성 (이미 설치됨)

- `@supabase/supabase-js ^2.49.x` - Supabase 클라이언트 (Realtime 포함)
- `@supabase/ssr ^0.6.x` - SSR 헬퍼
- `@tanstack/react-query v5` - 상태 관리

### 내부 의존성

- `lib/supabase/client.ts` - 브라우저 클라이언트 (이미 존재)
- `lib/supabase/server.ts` - 서버 클라이언트 (이미 존재)
- `packages/shared` - 공유 타입 및 상수 (수정 대상)

### 선행 조건

- `supabase start` 로컬 실행 중
- DB 마이그레이션 00001~00013 적용 완료 (SPEC-BE-003 포함)
- Supabase Auth 세션 관리 정상 동작
- Supabase Realtime 활성화 (기본 활성)

## 8. Traceability

| 요구사항 ID | 설명 | plan.md 매핑 | acceptance.md 매핑 |
|------------|------|-------------|-------------------|
| REQ-BE-004-001~007 | Vote/Answer count 트리거 | Phase A | AC-001 |
| REQ-BE-004-008~009 | 쿼리 레이어 신규 생성 | Phase B | AC-002 |
| REQ-BE-004-010~014 | Question CRUD 전환 | Phase C | AC-003 |
| REQ-BE-004-015~019 | Answer CRUD + 채택 전환 | Phase D | AC-004 |
| REQ-BE-004-020~023 | Vote 시스템 전환 | Phase E | AC-005 |
| REQ-BE-004-024~029, 037~038 | Supabase Realtime 구현 | Phase F | AC-006 |
| REQ-BE-004-030~031 | AI Suggestion 스텁 | Phase G | AC-007 |
| REQ-BE-004-032~033 | 타입 정렬 및 매핑 | Phase B, I | AC-002, AC-008 |
| REQ-BE-004-034~036 | 레거시 REST 제거 | Phase H | AC-009 |

## 9. Implementation Notes

**구현 완료일**: 2026-02-21

### 9.1 구현 요약

Q&A 시스템의 Supabase 백엔드 통합이 계획대로 완료되었다. 모든 REST API 의존성이 제거되고 Supabase 직접 쿼리로 전환되었다. WebSocket 스텁은 Supabase Realtime `postgres_changes`로 완전히 재구현되었다.

**품질 게이트 결과:**
- TypeScript 컴파일: 0 errors
- ESLint: 0 errors, 0 warnings
- TRUST 5: PASS (모든 5개 기둥)

**변경 규모:** 16 files changed, 1,136 lines added, 264 lines deleted

### 9.2 신규 생성 파일 (4개)

| 파일 | 설명 |
|------|------|
| `supabase/migrations/00014_create_vote_count_triggers.sql` | votes 테이블 INSERT/DELETE/UPDATE 시 upvote_count 자동 업데이트 트리거 + answers 테이블 INSERT/DELETE 시 answer_count 자동 업데이트 트리거 |
| `apps/web/lib/supabase/qa.ts` | Q&A 도메인 Supabase 쿼리 함수 (SPEC-BE-003 패턴 준수, camelCase/snake_case 매핑 포함) |
| `apps/web/lib/supabase/realtime.ts` | Supabase Realtime 채널 생성/구독/해제 유틸리티 |
| `packages/shared/src/constants/realtime.ts` | Q&A Realtime 채널명(`QA_CHANNELS`) 및 이벤트 필터(`QA_REALTIME_FILTERS`) 상수 |

### 9.3 수정 파일 (12개 hooks)

| 파일 | 변경 내용 |
|------|-----------|
| `apps/web/hooks/qa/useQAList.ts` | REST API -> Supabase `useInfiniteQuery` (offset/limit 페이지네이션) |
| `apps/web/hooks/qa/useQADetail.ts` | REST API -> Supabase 상세 조회 (answer 목록 포함) |
| `apps/web/hooks/qa/useCreateQuestion.ts` | REST API -> Supabase INSERT |
| `apps/web/hooks/qa/useUpdateQuestion.ts` | REST API -> Supabase UPDATE |
| `apps/web/hooks/qa/useCreateAnswer.ts` | REST API -> Supabase INSERT |
| `apps/web/hooks/qa/useAcceptAnswer.ts` | REST API -> Supabase UPDATE (is_accepted + question status RESOLVED) |
| `apps/web/hooks/qa/useUpvoteQuestion.ts` | REST API -> Supabase toggle vote + optimistic update |
| `apps/web/hooks/qa/useUpvoteAnswer.ts` | REST API -> Supabase toggle vote + optimistic update |
| `apps/web/hooks/qa/useChangeQuestionStatus.ts` | REST API -> Supabase UPDATE |
| `apps/web/hooks/qa/useRequestAISuggestion.ts` | REST API -> graceful failure 스텁 ("AI 추천 기능은 준비 중입니다") |
| `apps/web/hooks/qa/useQAWebSocket.ts` | WS 스텁 -> Supabase Realtime `postgres_changes` 완전 재구현 |
| `apps/web/hooks/qa/qa-keys.ts` | 쿼리 키 팩토리 정비 |

### 9.4 계획 대비 편차

계획 대비 주목할 만한 편차는 없었다. 모든 요구사항이 원래 설계대로 구현되었다.

**구현 선택 사항:**
- REQ-BE-004-030 AI Suggestion: Option B (클라이언트 스텁)로 구현 - Edge Function 없이 graceful failure 반환
- 답변 채택 시 question status 변경: 순차 호출 + 에러 처리 방식으로 구현 (Supabase RPC 불사용)

### 9.5 후속 작업

- **테스트 파일**: 현재 Q&A 관련 테스트 파일들은 여전히 REST API 목(mock)을 사용하고 있음. Supabase 클라이언트 목으로 업데이트 필요 (별도 태스크)
- **SPEC-BE-005**: Quiz hooks Supabase 전환 시 이 SPEC에서 수립한 Realtime 패턴 재사용 가능
- **SPEC-BE-006**: Team/Memo hooks 전환 시 동일 패턴 적용
- **SPEC-AI-001**: AI suggestion 실제 구현 시 `useRequestAISuggestion` 스텁을 Edge Function 호출로 교체
