---
id: SPEC-BE-005
version: "1.0.0"
status: completed
created: "2026-02-21"
updated: "2026-02-21"
completed: "2026-02-21"
author: mhso-dev
priority: high
depends_on: [SPEC-BE-001, SPEC-AUTH-001, SPEC-BE-003]
---

# SPEC-BE-005: Quiz System Supabase Backend Integration

## HISTORY

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0.0 | 2026-02-21 | mhso-dev | 초기 작성 |
| 1.1.0 | 2026-02-21 | mhso-dev | 구현 완료: DB 마이그레이션 + 쿼리 레이어 + 8개 hooks 전환 + 149개 테스트 통과 |

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

### 1.2 프로젝트 컨텍스트

lecture-moa는 강사가 Markdown 강의 자료를 업로드하고 학생이 인라인 Q&A와 함께 학습하는 교육 플랫폼이다.

**현재 상태:**
- SPEC-BE-001(Supabase 초기 설정) COMPLETE: DB 스키마 15개 테이블, RLS 정책, 마이그레이션 완료
- SPEC-AUTH-001(인증 전환) COMPLETE: Supabase Auth 기반 인증 레이어 완성
- SPEC-BE-003(Course + Material 전환) COMPLETE: Supabase 쿼리 레이어 패턴 수립, 19개 hooks 전환 완료
- 문제: 모든 Quiz hooks가 존재하지 않는 REST API 엔드포인트(apps/api Fastify 서버) 호출 중

**핵심 전환 과제:**
기존 `api.get('/api/v1/quizzes/...')` 패턴을 `createClient().from('quizzes')` Supabase 직접 쿼리로 전환하고, 복잡한 비즈니스 로직(퀴즈 시작, 채점, 복제)을 PL/pgSQL DB 함수로 구현

### 1.3 의존성

- **선행 SPEC**: SPEC-BE-001 (DB 스키마, RLS 정책), SPEC-AUTH-001 (Supabase Auth), SPEC-BE-003 (Supabase 쿼리 레이어 패턴)
- **후속 SPEC**: SPEC-AI-001 (AI 퀴즈 생성), SPEC-BE-006 (팀+메모)
- **연관 SPEC**: SPEC-AI-001 (useAIGeneration hook은 이 SPEC 범위 외)

## 2. Assumptions

- SPEC-BE-001에서 생성된 DB 스키마 (quizzes, quiz_questions, quiz_attempts, quiz_answers 4개 테이블)가 정확히 존재한다
- SPEC-AUTH-001에서 구현된 Supabase Auth가 정상 작동 중이다
- SPEC-BE-003에서 수립된 Supabase 쿼리 레이어 패턴 (snake_case 매핑, 에러 처리, TanStack Query 통합)을 그대로 따른다
- `lib/supabase/client.ts`(브라우저)와 `lib/supabase/server.ts`(서버)가 이미 설정되어 있다
- RLS 정책이 4개 quiz 테이블에 제대로 설정되어 있어 클라이언트에서 직접 안전하게 DB에 접근 가능하다
- `apps/web/types/supabase.ts`에 quiz 관련 테이블 타입이 정확히 포함되어 있다 (SPEC-BE-003에서 재생성됨)
- packages/shared 타입과 DB 컬럼명 간 불일치는 매핑 레이어에서 해소한다 (camelCase <-> snake_case)
- TanStack Query 캐시 키는 기존 패턴을 유지하여 UI 컴포넌트 재작업을 최소화한다
- quiz_questions.options JSONB 포맷은 `[{text: string, isCorrect: boolean}]` 형태로 DB에 저장되어 있다
- 복잡한 트랜잭션 로직 (퀴즈 시작, 채점, 복제)은 PL/pgSQL DB 함수(RPC)로 구현한다

## 3. Scope

### 3.1 범위 내 (In Scope)

- `apps/web/lib/supabase/quizzes.ts` 신규: Quiz 도메인 Supabase 쿼리 함수 (~15개)
- `supabase/migrations/00014_create_quiz_functions.sql` 신규: 3개 PL/pgSQL DB 함수
- 8개 Quiz hooks 전환 (REST API -> Supabase 직접 쿼리)
- `packages/shared/src/types/quiz.types.ts` 정렬: DB 스키마와 타입 최소 수정
- `apps/web/lib/api/quiz.api.ts` 삭제 (REST 클라이언트 제거)

### 3.2 범위 외 (Out of Scope)

- AI 퀴즈 생성 기능 (SPEC-AI-001)
- useAIGeneration hook 전환 (SPEC-AI-001)
- Edge Functions for AI proxy (SPEC-AI-001)
- 로컬 전용 hooks (useQuizAnswers, useQuizTimer, useFocusDetection) - Zustand/브라우저 이벤트만 사용하므로 전환 불필요
- UI 컴포넌트 변경 (인터페이스 호환성 유지)
- Dashboard 통계 (SPEC-BE-007)
- Realtime 구독 (이 SPEC 범위 외)

## 4. Requirements

### 4.1 PL/pgSQL DB 함수 생성

**REQ-BE-005-001**: 시스템은 **항상** 퀴즈 시작, 채점, 복제를 위한 트랜잭셔널 DB 함수를 제공해야 한다.

**REQ-BE-005-002**: **WHEN** `start_quiz_attempt(p_quiz_id UUID)` RPC가 호출되면 **THEN** 다음 로직을 수행해야 한다:
- 퀴즈가 `published` 상태인지 검증
- `due_date`가 설정된 경우 현재 시간이 마감일 이전인지 검증
- `allow_reattempt`가 false인 경우 기존 `submitted` 또는 `graded` 상태의 attempt가 없는지 검증
- 기존 `in_progress` 상태의 attempt가 있으면 새로 생성하지 않고 해당 attempt를 반환 (재개)
- 모든 검증 통과 시 새 `quiz_attempts` 레코드를 생성하고 반환

**REQ-BE-005-003**: **IF** 퀴즈가 `published` 상태가 아니거나, 마감일이 지났거나, 재응시가 불가능한데 이미 제출된 attempt가 있으면 **THEN** DB 함수는 적절한 오류 메시지와 함께 EXCEPTION을 raise해야 한다.

**REQ-BE-005-004**: **WHEN** `submit_and_grade_quiz(p_attempt_id UUID)` RPC가 호출되면 **THEN** 다음 로직을 수행해야 한다:
- attempt가 존재하고 현재 사용자 소유이며 `in_progress` 상태인지 검증
- 해당 attempt의 모든 `quiz_answers` 레코드를 순회하며:
  - `quiz_questions.question_type`별 채점 로직 적용:
    - `multiple_choice`: 선택한 답과 `correct_answer` 정확히 일치
    - `true_false`: 불리언 비교
    - `short_answer`: 대소문자 무시 정확히 일치 (LOWER 비교)
    - `fill_in_the_blank`: 모든 빈칸이 대소문자 무시 일치
  - `quiz_answers.is_correct`와 `quiz_answers.points_earned` 업데이트
- 총 점수(sum of points_earned)와 총 배점(sum of question points) 계산
- `quiz_attempts` 레코드 업데이트: `score`, `total_points`, `status='graded'`, `submitted_at=now()`
- 채점된 attempt 레코드 반환

**REQ-BE-005-005**: **IF** attempt가 존재하지 않거나, 현재 사용자 소유가 아니거나, `in_progress` 상태가 아니면 **THEN** DB 함수는 적절한 오류와 함께 EXCEPTION을 raise해야 한다.

**REQ-BE-005-006**: **WHEN** `duplicate_quiz(p_quiz_id UUID)` RPC가 호출되면 **THEN** 다음 로직을 수행해야 한다:
- 원본 `quizzes` 레코드를 복사 (새 id, `status='draft'`, `title = title || ' (Copy)'`)
- 원본의 모든 `quiz_questions` 레코드를 복사 (새 id, 새 quiz_id 참조)
- 새로 생성된 quiz 레코드 반환

### 4.2 Supabase 쿼리 레이어 신규 생성

**REQ-BE-005-007**: 시스템은 **항상** Quiz 도메인 쿼리를 `apps/web/lib/supabase/quizzes.ts` 파일에 집중시켜야 한다.

**REQ-BE-005-008**: **IF** DB 컬럼명(snake_case)과 shared 타입 필드명(camelCase)이 불일치하면 **THEN** 쿼리 레이어에서 매핑을 수행해야 한다.

핵심 매핑 테이블:

| DB 컬럼 (snake_case) | 공유 타입 필드 (camelCase) | 비고 |
|----------------------|--------------------------|------|
| quizzes.course_id | QuizListItem.courseId | 직접 매핑 |
| courses.title (JOIN) | QuizListItem.courseName | courses JOIN 필요 |
| COUNT(quiz_questions) | QuizListItem.questionCount | 집계 쿼리 |
| COUNT(quiz_attempts WHERE student_id=me) | QuizListItem.attemptCount | 조건부 집계 |
| quiz_attempts.score (latest) | QuizListItem.myLastAttemptScore | 서브쿼리 또는 별도 쿼리 |
| quizzes.created_by | - | profiles JOIN으로 creator 정보 |
| quizzes.time_limit_minutes | Quiz.timeLimitMinutes | 직접 매핑 |
| quizzes.passing_score | Quiz.passingScore | 직접 매핑 (default 70) |
| quizzes.allow_reattempt | Quiz.allowReattempt | 직접 매핑 |
| quizzes.shuffle_questions | Quiz.shuffleQuestions | 직접 매핑 |
| quizzes.show_answers_after_submit | Quiz.showAnswersAfterSubmit | 직접 매핑 |
| quizzes.focus_loss_warning | Quiz.focusLossWarning | 직접 매핑 |
| quizzes.is_ai_generated | Quiz.isAiGenerated | 직접 매핑 |
| quizzes.source_material_id | Quiz.sourceMaterialId | 직접 매핑 |

Question 타입 매핑 (복잡):

| DB 컬럼 | 공유 타입 필드 | 변환 로직 |
|---------|--------------|----------|
| quiz_questions.content | Question.questionText | 필드명 변환 |
| quiz_questions.question_type | Question.type | 필드명 변환 |
| quiz_questions.order_index | Question.order | 필드명 변환 |
| quiz_questions.options (JSONB) | MultipleChoiceQuestion.options | `[{text, isCorrect}]` -> `[{id, text}]` + correctOptionId 변환 |
| quiz_questions.correct_answer | varies by type | true_false: correctAnswer, short_answer: sampleAnswer, fill_in_blank: blanks |
| quiz_questions.explanation | Question.explanation | 직접 매핑 |
| quiz_questions.points | Question.points | 직접 매핑 |

### 4.3 Quiz 목록/상세 조회 - Supabase 전환

**REQ-BE-005-009**: **WHEN** `useQuizList(params?)` 훅이 호출되면 **THEN** Supabase로부터 학생용 페이지네이션된 퀴즈 목록을 반환해야 한다.

쿼리 요구사항:
- `quizzes` 테이블에서 `courses` 테이블 JOIN (courseName)
- `quiz_questions` COUNT 집계 (questionCount)
- 현재 사용자의 `quiz_attempts` COUNT 집계 (attemptCount)
- 현재 사용자의 최근 attempt score (myLastAttemptScore)
- 학생에게는 `status = 'published'` 퀴즈만 표시
- RLS 정책이 접근 제어 처리
- 페이지네이션: `.range()` 기반

**REQ-BE-005-010**: **WHEN** `useQuizDetail(quizId)` 훅이 호출되면 **THEN** 단일 퀴즈 상세 정보와 문제 목록을 반환해야 한다.

쿼리 요구사항:
- `quizzes` 레코드 + `quiz_questions` 전체 목록
- `shuffle_questions`가 true이면 클라이언트에서 문제 순서 셔플 (DB 함수 불필요)
- 학생에게는 정답 정보 제외 (show_answers_after_submit 고려)
- question_type별 options JSONB 변환

**REQ-BE-005-011**: **WHEN** `useInstructorQuizzes(params?)` 훅이 호출되면 **THEN** 강사용 전체 퀴즈 목록을 반환해야 한다.

쿼리 요구사항:
- 모든 status (draft, published, closed) 포함
- 강사 본인이 생성한 퀴즈만 (RLS 정책)
- 각 퀴즈별 제출 수, 평균 점수 집계

### 4.4 Quiz CRUD - Supabase 전환

**REQ-BE-005-012**: **WHEN** `useQuizMutations().createQuiz` mutation이 실행되면 **THEN** 현재 인증 사용자를 `created_by`로 하여 `quizzes` 테이블에 새 레코드를 삽입하고, 포함된 questions를 `quiz_questions` 테이블에 삽입해야 한다.

**REQ-BE-005-013**: **WHEN** `useQuizMutations().updateQuiz` mutation이 실행되면 **THEN** 해당 퀴즈 레코드와 관련 questions를 업데이트해야 한다.

**REQ-BE-005-014**: **WHEN** `useQuizMutations().deleteQuiz` mutation이 실행되면 **THEN** 해당 퀴즈를 삭제해야 한다 (CASCADE 삭제로 연관 questions, attempts, answers 포함).

**REQ-BE-005-015**: **IF** 현재 사용자가 해당 퀴즈의 `created_by`가 아닌 경우 **THEN** CRUD 작업은 RLS 정책에 의해 차단되어야 한다.

### 4.5 Quiz 상태 관리 - Supabase 전환

**REQ-BE-005-016**: **WHEN** `useQuizMutations().publishQuiz` mutation이 실행되면 **THEN** 퀴즈의 `status`를 `'published'`로 업데이트해야 한다.

**REQ-BE-005-017**: **WHEN** `useQuizMutations().closeQuiz` mutation이 실행되면 **THEN** 퀴즈의 `status`를 `'closed'`로 업데이트해야 한다.

**REQ-BE-005-018**: **WHEN** `useQuizMutations().duplicateQuiz` mutation이 실행되면 **THEN** `duplicate_quiz(quiz_id)` DB 함수(RPC)를 호출하여 퀴즈와 문제를 복제해야 한다.

### 4.6 Quiz 응시 - Supabase 전환

**REQ-BE-005-019**: **WHEN** `useQuizSubmission().startAttempt` mutation이 실행되면 **THEN** `start_quiz_attempt(quiz_id)` DB 함수(RPC)를 호출해야 한다.

**REQ-BE-005-020**: **IF** 퀴즈가 published가 아니거나, 마감일이 지났거나, 재응시 불가능한데 이미 제출된 attempt가 있으면 **THEN** 적절한 오류 메시지가 사용자에게 표시되어야 한다.

**REQ-BE-005-021**: **WHEN** `useQuizAutoSave`의 자동저장이 트리거되면 **THEN** 현재 답안을 `quiz_answers` 테이블에 upsert해야 한다.

자동저장 요구사항:
- 3초 debounce로 답안 변경 시 자동 저장
- `quiz_answers` 테이블에 `ON CONFLICT (attempt_id, question_id) DO UPDATE` 패턴 사용
- 저장 실패 시 재시도 (최대 3회)
- 네트워크 오류 시 로컬 상태 유지 (Zustand)

**REQ-BE-005-022**: **WHEN** `useQuizSubmission().submitAttempt` mutation이 실행되면 **THEN** `submit_and_grade_quiz(attempt_id)` DB 함수(RPC)를 호출하여 채점을 수행해야 한다.

**REQ-BE-005-023**: **IF** submit 중 네트워크 오류가 발생하면 **THEN** 시스템은 답안이 저장된 상태를 유지하고 사용자에게 재시도 안내를 제공해야 한다.

### 4.7 Quiz 결과 조회 - Supabase 전환

**REQ-BE-005-024**: **WHEN** `useQuizResult(quizId, attemptId)` 훅이 호출되면 **THEN** 채점된 attempt 결과를 문제별 정오답 정보와 함께 반환해야 한다.

쿼리 요구사항:
- `quiz_attempts` + `quiz_answers` + `quiz_questions` JOIN
- 각 문제별: 학생 답안, 정답, 정오답 여부, 획득 점수, 해설
- 총 점수, 총 배점, 통과 여부 (passing_score 대비)
- `show_answers_after_submit`가 false이면 정답/해설 제외

### 4.8 Quiz 제출 현황 조회 (강사용) - Supabase 전환

**REQ-BE-005-025**: **WHEN** `useSubmissions(quizId)` 훅이 호출되면 **THEN** 해당 퀴즈의 전체 학생 제출 현황을 반환해야 한다.

쿼리 요구사항:
- `quiz_attempts` + `profiles` JOIN
- 학생별 최신 attempt의 score, status, submitted_at
- 강사 본인이 생성한 퀴즈만 (RLS)

### 4.9 타입 정렬 및 매핑

**REQ-BE-005-026**: 시스템은 **항상** `packages/shared/src/types/quiz.types.ts`에서 정의된 타입이 DB 스키마와 호환되도록 유지해야 한다.

주요 정렬 항목:
- `QuizListItem`: DB JOIN 집계 결과와 호환되는 구조 확보
- `Question` discriminated union: DB의 단일 `quiz_questions` 테이블에서 `question_type`별로 적절한 변환
- `QuizAttempt`: DB `quiz_attempts` 컬럼과 camelCase 매핑
- `QuizAnswer`: DB `quiz_answers` 컬럼과 camelCase 매핑

**REQ-BE-005-027**: **IF** shared 타입과 DB 스키마 간 호환 불가능한 구조 차이가 존재하면 **THEN** 쿼리 레이어에서 변환을 수행하고 UI 컴포넌트는 최소한으로 수정해야 한다.

Question options 변환 상세:

```
DB 저장 형태 (quiz_questions.options JSONB):
[
  { "text": "보기 A", "isCorrect": true },
  { "text": "보기 B", "isCorrect": false },
  { "text": "보기 C", "isCorrect": false },
  { "text": "보기 D", "isCorrect": false }
]

쿼리 레이어 출력 (학생용 - 정답 제외):
{
  options: [
    { id: "opt_0", text: "보기 A" },
    { id: "opt_1", text: "보기 B" },
    { id: "opt_2", text: "보기 C" },
    { id: "opt_3", text: "보기 D" }
  ]
}

쿼리 레이어 출력 (채점 결과 / 강사용):
{
  options: [
    { id: "opt_0", text: "보기 A" },
    { id: "opt_1", text: "보기 B" },
    { id: "opt_2", text: "보기 C" },
    { id: "opt_3", text: "보기 D" }
  ],
  correctOptionId: "opt_0"
}
```

### 4.10 레거시 REST 클라이언트 제거

**REQ-BE-005-028**: **WHEN** Supabase 쿼리 레이어 구현이 완료되면 **THEN** `apps/web/lib/api/quiz.api.ts` 파일을 삭제해야 한다.

**REQ-BE-005-029**: **WHEN** REST 클라이언트 파일이 제거되면 **THEN** 이를 참조하던 모든 import가 Supabase 쿼리 레이어로 업데이트되어야 한다.

**REQ-BE-005-030**: **IF** `apps/web/lib/api/index.ts`에서 quiz 관련 export만 남아있으면 **THEN** 해당 파일도 정리해야 한다.

## 5. Specifications

### 5.1 신규 파일 구조

```
apps/web/
  lib/
    supabase/
      client.ts        (기존, 유지)
      server.ts        (기존, 유지)
      courses.ts       (기존, SPEC-BE-003)
      materials.ts     (기존, SPEC-BE-003)
      storage.ts       (기존, SPEC-BE-003)
      quizzes.ts       (신규) <- Quiz 도메인 쿼리 함수 (~15개)

supabase/
  migrations/
    00014_create_quiz_functions.sql  (신규) <- 3개 PL/pgSQL DB 함수
```

### 5.2 수정 파일 목록

```
apps/web/hooks/quiz/
  useQuizList.ts          (수정) <- REST API -> Supabase
  useQuizDetail.ts        (수정) <- REST API -> Supabase
  useInstructorQuizzes.ts (수정) <- REST API -> Supabase
  useQuizMutations.ts     (수정) <- REST API -> Supabase (6개 mutation)
  useQuizResult.ts        (수정) <- REST API -> Supabase
  useSubmissions.ts       (수정) <- REST API -> Supabase
  useQuizSubmission.ts    (수정) <- REST API -> Supabase (start + submit)
  useQuizAutoSave.ts      (수정) <- REST API -> Supabase (upsert 패턴)

packages/shared/src/types/
  quiz.types.ts           (수정) <- DB 스키마와 정렬 (최소 변경)
```

### 5.3 삭제 파일 목록

```
apps/web/lib/api/
  quiz.api.ts    (삭제) <- Supabase 쿼리 레이어로 대체
```

### 5.4 변경 불필요 파일 (로컬 전용 hooks)

```
apps/web/hooks/quiz/
  useQuizAnswers.ts     (변경 없음) <- Zustand store only
  useQuizTimer.ts       (변경 없음) <- setInterval + Zustand
  useFocusDetection.ts  (변경 없음) <- 브라우저 이벤트 only
  useAIGeneration.ts    (변경 없음) <- SPEC-AI-001 범위
```

### 5.5 DB 함수 마이그레이션 설계

`supabase/migrations/00014_create_quiz_functions.sql`:

#### 5.5.1 start_quiz_attempt

```sql
CREATE OR REPLACE FUNCTION public.start_quiz_attempt(p_quiz_id UUID)
RETURNS quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_quiz quizzes%ROWTYPE;
  v_existing_attempt quiz_attempts%ROWTYPE;
  v_new_attempt quiz_attempts%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  -- 1. 퀴즈 존재 및 상태 검증
  SELECT * INTO v_quiz FROM quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_quiz.status != 'published' THEN
    RAISE EXCEPTION 'Quiz is not published' USING ERRCODE = 'P0003';
  END IF;

  -- 2. 마감일 검증
  IF v_quiz.due_date IS NOT NULL AND v_quiz.due_date < NOW() THEN
    RAISE EXCEPTION 'Quiz deadline has passed' USING ERRCODE = 'P0004';
  END IF;

  -- 3. 재응시 가능 여부 검증
  IF NOT v_quiz.allow_reattempt THEN
    SELECT * INTO v_existing_attempt
    FROM quiz_attempts
    WHERE quiz_id = p_quiz_id
      AND student_id = v_user_id
      AND status IN ('submitted', 'graded');
    IF FOUND THEN
      RAISE EXCEPTION 'Reattempt not allowed for this quiz' USING ERRCODE = 'P0005';
    END IF;
  END IF;

  -- 4. 기존 in_progress attempt 확인 (재개)
  SELECT * INTO v_existing_attempt
  FROM quiz_attempts
  WHERE quiz_id = p_quiz_id
    AND student_id = v_user_id
    AND status = 'in_progress';
  IF FOUND THEN
    RETURN v_existing_attempt;
  END IF;

  -- 5. 새 attempt 생성
  INSERT INTO quiz_attempts (quiz_id, student_id, status, started_at)
  VALUES (p_quiz_id, v_user_id, 'in_progress', NOW())
  RETURNING * INTO v_new_attempt;

  RETURN v_new_attempt;
END;
$$;
```

#### 5.5.2 submit_and_grade_quiz

```sql
CREATE OR REPLACE FUNCTION public.submit_and_grade_quiz(p_attempt_id UUID)
RETURNS quiz_attempts
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_attempt quiz_attempts%ROWTYPE;
  v_answer RECORD;
  v_question quiz_questions%ROWTYPE;
  v_is_correct BOOLEAN;
  v_points_earned INTEGER;
  v_total_score INTEGER := 0;
  v_total_points INTEGER := 0;
  v_user_id UUID := auth.uid();
BEGIN
  -- 1. attempt 검증
  SELECT * INTO v_attempt FROM quiz_attempts WHERE id = p_attempt_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Attempt not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_attempt.student_id != v_user_id THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = 'P0006';
  END IF;

  IF v_attempt.status != 'in_progress' THEN
    RAISE EXCEPTION 'Attempt already submitted' USING ERRCODE = 'P0007';
  END IF;

  -- 2. 각 답안 채점
  FOR v_answer IN
    SELECT qa.id AS answer_id, qa.question_id, qa.answer
    FROM quiz_answers qa
    WHERE qa.attempt_id = p_attempt_id
  LOOP
    SELECT * INTO v_question
    FROM quiz_questions
    WHERE id = v_answer.question_id;

    IF NOT FOUND THEN CONTINUE; END IF;

    -- question_type별 채점
    v_is_correct := FALSE;
    v_points_earned := 0;

    CASE v_question.question_type
      WHEN 'multiple_choice' THEN
        v_is_correct := (v_answer.answer = v_question.correct_answer);
      WHEN 'true_false' THEN
        v_is_correct := (LOWER(v_answer.answer) = LOWER(v_question.correct_answer));
      WHEN 'short_answer' THEN
        v_is_correct := (LOWER(TRIM(v_answer.answer)) = LOWER(TRIM(v_question.correct_answer)));
      WHEN 'fill_in_the_blank' THEN
        v_is_correct := (LOWER(TRIM(v_answer.answer)) = LOWER(TRIM(v_question.correct_answer)));
    END CASE;

    IF v_is_correct THEN
      v_points_earned := v_question.points;
    END IF;

    -- 답안 업데이트
    UPDATE quiz_answers
    SET is_correct = v_is_correct,
        points_earned = v_points_earned
    WHERE id = v_answer.answer_id;

    v_total_score := v_total_score + v_points_earned;
  END LOOP;

  -- 3. 총 배점 계산
  SELECT COALESCE(SUM(points), 0) INTO v_total_points
  FROM quiz_questions
  WHERE quiz_id = v_attempt.quiz_id;

  -- 4. attempt 업데이트
  UPDATE quiz_attempts
  SET score = v_total_score,
      total_points = v_total_points,
      status = 'graded',
      submitted_at = NOW()
  WHERE id = p_attempt_id
  RETURNING * INTO v_attempt;

  RETURN v_attempt;
END;
$$;
```

#### 5.5.3 duplicate_quiz

```sql
CREATE OR REPLACE FUNCTION public.duplicate_quiz(p_quiz_id UUID)
RETURNS quizzes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_original quizzes%ROWTYPE;
  v_new_quiz quizzes%ROWTYPE;
  v_user_id UUID := auth.uid();
BEGIN
  -- 1. 원본 퀴즈 조회
  SELECT * INTO v_original FROM quizzes WHERE id = p_quiz_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quiz not found' USING ERRCODE = 'P0002';
  END IF;

  -- 2. 권한 검증 (생성자만 복제 가능)
  IF v_original.created_by != v_user_id THEN
    RAISE EXCEPTION 'Not authorized to duplicate this quiz' USING ERRCODE = 'P0006';
  END IF;

  -- 3. 퀴즈 복제
  INSERT INTO quizzes (
    course_id, created_by, title, description,
    time_limit_minutes, passing_score, allow_reattempt,
    shuffle_questions, show_answers_after_submit,
    focus_loss_warning, status, is_ai_generated,
    source_material_id
  )
  VALUES (
    v_original.course_id, v_user_id,
    v_original.title || ' (Copy)', v_original.description,
    v_original.time_limit_minutes, v_original.passing_score,
    v_original.allow_reattempt, v_original.shuffle_questions,
    v_original.show_answers_after_submit, v_original.focus_loss_warning,
    'draft', v_original.is_ai_generated, v_original.source_material_id
  )
  RETURNING * INTO v_new_quiz;

  -- 4. 문제 복제
  INSERT INTO quiz_questions (
    quiz_id, question_type, content, options,
    correct_answer, explanation, points, order_index
  )
  SELECT
    v_new_quiz.id, question_type, content, options,
    correct_answer, explanation, points, order_index
  FROM quiz_questions
  WHERE quiz_id = p_quiz_id
  ORDER BY order_index;

  RETURN v_new_quiz;
END;
$$;
```

### 5.6 Supabase 쿼리 레이어 설계

#### 5.6.1 `lib/supabase/quizzes.ts` 인터페이스

```typescript
// === 조회 함수 ===

// 학생용: 퀴즈 목록 (published만, 집계 포함)
export async function getQuizzes(params?: QuizListParams): Promise<PaginatedQuizList>

// 단일 퀴즈 + questions 조회 (학생용: 정답 제외)
export async function getQuiz(quizId: string): Promise<QuizDetail>

// 강사용: 전체 퀴즈 목록 (모든 status, 제출 통계 포함)
export async function getInstructorQuizzes(params?: InstructorQuizParams): Promise<PaginatedInstructorQuizList>

// 퀴즈 결과 조회 (attempt + answers + questions JOIN)
export async function getQuizResult(quizId: string, attemptId: string): Promise<QuizResult>

// 강사용: 학생 제출 현황 (attempts + profiles JOIN)
export async function getSubmissions(quizId: string): Promise<QuizSubmission[]>

// === Mutation 함수 ===

// 퀴즈 생성 (quiz + questions 삽입)
export async function createQuiz(data: CreateQuizPayload): Promise<Quiz>

// 퀴즈 수정 (quiz + questions 업데이트)
export async function updateQuiz(quizId: string, data: UpdateQuizPayload): Promise<Quiz>

// 퀴즈 삭제
export async function deleteQuiz(quizId: string): Promise<void>

// 퀴즈 발행 (status -> 'published')
export async function publishQuiz(quizId: string): Promise<void>

// 퀴즈 마감 (status -> 'closed')
export async function closeQuiz(quizId: string): Promise<void>

// 퀴즈 복제 (RPC 호출)
export async function duplicateQuiz(quizId: string): Promise<Quiz>

// === 응시 함수 ===

// 퀴즈 시작 (RPC 호출)
export async function startQuizAttempt(quizId: string): Promise<QuizAttempt>

// 답안 임시 저장 (upsert)
export async function saveDraftAnswers(
  attemptId: string,
  answers: { questionId: string; answer: string }[]
): Promise<void>

// 퀴즈 제출 + 채점 (RPC 호출)
export async function submitQuizAttempt(attemptId: string): Promise<QuizAttempt>
```

#### 5.6.2 매핑 함수 설계

```typescript
// DB Row -> QuizListItem 변환
function mapQuizRow(row: QuizRow & {
  courses: { title: string };
  questionCount: { count: number }[];
  attemptCount: { count: number }[];
}): QuizListItem

// DB Row -> QuizDetail 변환 (questions 포함)
function mapQuizDetailRow(row: QuizRow & {
  quiz_questions: QuestionRow[];
}): QuizDetail

// DB QuestionRow -> Question 변환 (question_type별 discriminated union)
function mapQuestionRow(row: QuestionRow, includeAnswer: boolean): Question

// DB options JSONB -> frontend options 변환
function mapOptionsFromDB(
  options: Array<{ text: string; isCorrect: boolean }>,
  includeAnswer: boolean
): { options: Array<{ id: string; text: string }>; correctOptionId?: string }

// frontend options -> DB options JSONB 변환 (생성/수정 시)
function mapOptionsToDB(
  options: Array<{ id: string; text: string }>,
  correctOptionId: string
): Array<{ text: string; isCorrect: boolean }>
```

### 5.7 Quiz options JSONB 양방향 변환 상세

**DB -> Frontend (조회 시):**

```
입력: quiz_questions.options = [
  {"text": "보기 A", "isCorrect": true},
  {"text": "보기 B", "isCorrect": false}
]

출력 (학생용): {
  options: [{id: "opt_0", text: "보기 A"}, {id: "opt_1", text: "보기 B"}]
}

출력 (결과/강사): {
  options: [{id: "opt_0", text: "보기 A"}, {id: "opt_1", text: "보기 B"}],
  correctOptionId: "opt_0"
}
```

**Frontend -> DB (생성/수정 시):**

```
입력: {
  options: [{id: "opt_0", text: "보기 A"}, {id: "opt_1", text: "보기 B"}],
  correctOptionId: "opt_0"
}

출력: quiz_questions.options = [
  {"text": "보기 A", "isCorrect": true},
  {"text": "보기 B", "isCorrect": false}
]
```

### 5.8 답안 자동저장 (Auto-Save) 설계

```typescript
// upsert 패턴: attempt_id + question_id가 unique constraint
// ON CONFLICT 시 answer만 업데이트

async function saveDraftAnswers(
  attemptId: string,
  answers: { questionId: string; answer: string }[]
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from('quiz_answers')
    .upsert(
      answers.map(a => ({
        attempt_id: attemptId,
        question_id: a.questionId,
        answer: a.answer,
      })),
      { onConflict: 'attempt_id,question_id' }
    );
  if (error) throw new Error(`Failed to save answers: ${error.message}`);
}
```

### 5.9 페이지네이션 패턴

SPEC-BE-003에서 수립된 `.range()` 패턴 재사용:

```typescript
const from = (page - 1) * limit;
const to = from + limit - 1;

const { data, count } = await supabase
  .from('quizzes')
  .select(
    `
    *,
    courses!course_id(title),
    questionCount:quiz_questions(count),
    attemptCount:quiz_attempts!inner(count)
    `,
    { count: 'exact' }
  )
  .eq('status', 'published')
  .range(from, to);
```

## 6. Risks and Mitigations

| 위험 | 심각도 | 완화 방안 |
|------|--------|-----------|
| quiz_questions.options JSONB 포맷 불일치로 인한 변환 오류 | 높음 | 양방향 변환 함수를 TDD로 먼저 작성, 엣지 케이스(빈 배열, null) 철저 테스트 |
| submit_and_grade_quiz 채점 정확도 문제 (4가지 question_type) | 높음 | 각 question_type별 단위 테스트 작성, 특히 fill_in_the_blank 다중 빈칸 케이스 |
| 네트워크 오류 중 submit 트랜잭션 불완전 처리 | 중간 | SECURITY DEFINER + 단일 DB 함수 내 트랜잭션으로 원자성 보장; 클라이언트 재시도 로직 |
| Question discriminated union 타입 변환 복잡도 | 중간 | 쿼리 레이어에서 question_type별 매핑 함수 분리, TypeScript strict 타입 검증 |
| 퀴즈 목록 쿼리 성능 (다중 JOIN + 집계) | 낮음 | SPEC-BE-001에서 이미 인덱스 생성; 필요시 DB View 활용 |
| 자동저장 upsert 동시성 이슈 (빠른 연타 입력) | 낮음 | 3초 debounce로 제어, unique constraint가 데이터 무결성 보장 |

## 7. Dependencies

### 외부 의존성 (이미 설치됨)

- `@supabase/supabase-js ^2.49.x` - Supabase 클라이언트
- `@supabase/ssr ^0.6.x` - SSR 헬퍼
- `@tanstack/react-query v5` - 상태 관리

### 내부 의존성

- `lib/supabase/client.ts` - 브라우저 클라이언트 (이미 존재)
- `lib/supabase/server.ts` - 서버 클라이언트 (이미 존재)
- `packages/shared` - 공유 타입 (수정 대상)
- `lib/supabase/courses.ts` - Course 쿼리 레이어 (SPEC-BE-003, course_id JOIN에 활용)

### 선행 조건

- `supabase start` 로컬 실행 중
- DB 마이그레이션 00001~00013 적용 완료
- Supabase Auth 세션 관리 정상 동작
- quiz 4개 테이블 + RLS 정책 존재 (SPEC-BE-001)

## 8. Traceability

| 요구사항 ID | 설명 | plan.md 매핑 | acceptance.md 매핑 |
|------------|------|-------------|-------------------|
| REQ-BE-005-001~006 | PL/pgSQL DB 함수 | Phase A | AC-001 |
| REQ-BE-005-007~008 | 쿼리 레이어 신규 생성 | Phase B | AC-002 |
| REQ-BE-005-009~011 | Quiz 목록/상세 조회 전환 | Phase C | AC-003 |
| REQ-BE-005-012~015 | Quiz CRUD 전환 | Phase C | AC-003 |
| REQ-BE-005-016~018 | Quiz 상태 관리 전환 | Phase C | AC-003 |
| REQ-BE-005-019~023 | Quiz 응시 전환 | Phase D | AC-004 |
| REQ-BE-005-024~025 | Quiz 결과/제출 현황 전환 | Phase D | AC-004 |
| REQ-BE-005-026~027 | 타입 정렬 및 매핑 | Phase B | AC-002 |
| REQ-BE-005-028~030 | 레거시 REST 제거 | Phase E | AC-005 |
