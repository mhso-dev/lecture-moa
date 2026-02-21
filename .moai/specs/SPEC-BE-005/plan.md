---
spec_id: SPEC-BE-005
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-BE-005 Implementation Plan: Quiz System Supabase Backend Integration

## Development Methodology

**Hybrid Mode**:
- 기존 hooks 전환 (DDD): ANALYZE-PRESERVE-IMPROVE 사이클 적용
- 신규 파일 (TDD): DB 함수, 쿼리 레이어 먼저 테스트 작성 후 구현

**품질 목표**: 85%+ 테스트 커버리지

---

## Phase Overview

| Phase | 내용 | 우선순위 |
|-------|------|---------|
| A | PL/pgSQL DB 함수 마이그레이션 | Primary Goal |
| B | Supabase 쿼리 레이어 신규 생성 | Primary Goal |
| C | Quiz 조회/CRUD/상태 hooks 전환 (5개) | Primary Goal |
| D | Quiz 응시/결과/제출 hooks 전환 (3개) | Primary Goal |
| E | 레거시 REST 클라이언트 제거 | Secondary Goal |
| F | 테스트 커버리지 달성 | Secondary Goal |

---

## Phase A: PL/pgSQL DB 함수 마이그레이션 (Primary Goal)

**목표**: 복잡한 비즈니스 로직을 트랜잭셔널 DB 함수로 구현

### 작업 목록

1. **마이그레이션 파일 작성**
   - `supabase/migrations/00014_create_quiz_functions.sql` 생성
   - 3개 함수 정의:
     - `start_quiz_attempt(p_quiz_id UUID)`: 퀴즈 시작/재개
     - `submit_and_grade_quiz(p_attempt_id UUID)`: 제출 + 채점
     - `duplicate_quiz(p_quiz_id UUID)`: 퀴즈 복제

2. **start_quiz_attempt 구현**
   - 퀴즈 상태 검증 (published 여부)
   - 마감일 검증 (due_date vs NOW())
   - 재응시 가능 여부 검증 (allow_reattempt)
   - 기존 in_progress attempt 재개 로직
   - 새 attempt 생성 및 반환

3. **submit_and_grade_quiz 구현**
   - attempt 소유권 및 상태 검증
   - question_type별 채점 로직:
     - multiple_choice: 정확 일치
     - true_false: 대소문자 무시 비교
     - short_answer: LOWER(TRIM()) 비교
     - fill_in_the_blank: LOWER(TRIM()) 비교
   - quiz_answers 업데이트 (is_correct, points_earned)
   - 총 점수/배점 계산
   - quiz_attempts 상태 업데이트 (graded)

4. **duplicate_quiz 구현**
   - 원본 퀴즈 + 권한 검증
   - quizzes 레코드 복사 (새 id, status=draft, title + Copy)
   - quiz_questions 전체 복사 (새 ids)
   - 새 퀴즈 반환

5. **마이그레이션 적용 및 검증**
   - `supabase migration up` 또는 `pnpm db:reset` 실행
   - Supabase Dashboard에서 함수 생성 확인
   - `supabase db test` 또는 수동 RPC 호출로 기본 동작 확인

**요구사항 매핑**: REQ-BE-005-001~006

---

## Phase B: Supabase 쿼리 레이어 신규 생성 (Primary Goal)

**목표**: hooks가 사용할 Supabase 쿼리 함수 모듈 작성 (TDD 방식)

### 작업 목록

#### B-1: 매핑 유틸리티 함수 작성 (TDD)

1. **mapQuizRow 테스트 -> 구현**
   - DB quizzes Row -> QuizListItem 변환
   - snake_case -> camelCase 매핑
   - courses JOIN 결과에서 courseName 추출
   - 집계 결과 (questionCount, attemptCount) 변환

2. **mapQuestionRow 테스트 -> 구현**
   - DB quiz_questions Row -> Question discriminated union 변환
   - question_type별 분기 처리
   - options JSONB 양방향 변환 (mapOptionsFromDB, mapOptionsToDB)
   - includeAnswer 플래그에 따른 정답 포함/제외

3. **mapOptionsFromDB / mapOptionsToDB 테스트 -> 구현**
   - DB `[{text, isCorrect}]` -> Frontend `[{id, text}]` + correctOptionId
   - Frontend -> DB 역변환
   - 엣지 케이스: 빈 배열, null options, 정답 없음

#### B-2: 조회 함수 작성 (TDD)

1. `getQuizzes(params?)` 테스트 -> 구현
   - quizzes + courses JOIN (courseName)
   - quiz_questions COUNT (questionCount)
   - quiz_attempts COUNT WHERE student_id=me (attemptCount)
   - 페이지네이션: .range() 기반
   - 필터: status='published' (학생용 기본)
   - DB Row -> QuizListItem 매핑

2. `getQuiz(quizId)` 테스트 -> 구현
   - quizzes + quiz_questions 전체 조회
   - question_type별 변환
   - 학생용: 정답 정보 제외 (show_answers_after_submit 고려)

3. `getInstructorQuizzes(params?)` 테스트 -> 구현
   - 모든 status 포함
   - 제출 수, 평균 점수 집계
   - 페이지네이션

4. `getQuizResult(quizId, attemptId)` 테스트 -> 구현
   - quiz_attempts + quiz_answers + quiz_questions JOIN
   - 문제별 정오답, 학생 답안, 해설
   - show_answers_after_submit false 시 정답/해설 제외

5. `getSubmissions(quizId)` 테스트 -> 구현
   - quiz_attempts + profiles JOIN
   - 학생별 최신 attempt

#### B-3: Mutation 함수 작성 (TDD)

1. `createQuiz(data)` 테스트 -> 구현
   - quizzes INSERT + quiz_questions 배치 INSERT
   - options frontend -> DB 변환
   - auth.uid()를 created_by로

2. `updateQuiz(quizId, data)` 테스트 -> 구현
   - quizzes UPDATE
   - quiz_questions: 삭제 후 재삽입 또는 개별 upsert

3. `deleteQuiz(quizId)` 테스트 -> 구현
   - CASCADE 삭제

4. `publishQuiz(quizId)` 테스트 -> 구현
   - status -> 'published' UPDATE

5. `closeQuiz(quizId)` 테스트 -> 구현
   - status -> 'closed' UPDATE

6. `duplicateQuiz(quizId)` 테스트 -> 구현
   - RPC 호출: `supabase.rpc('duplicate_quiz', { p_quiz_id: quizId })`

#### B-4: 응시 함수 작성 (TDD)

1. `startQuizAttempt(quizId)` 테스트 -> 구현
   - RPC 호출: `supabase.rpc('start_quiz_attempt', { p_quiz_id: quizId })`
   - 에러 처리 (published 아님, 마감, 재응시 불가)

2. `saveDraftAnswers(attemptId, answers)` 테스트 -> 구현
   - quiz_answers upsert (ON CONFLICT attempt_id, question_id)
   - 배치 처리

3. `submitQuizAttempt(attemptId)` 테스트 -> 구현
   - RPC 호출: `supabase.rpc('submit_and_grade_quiz', { p_attempt_id: attemptId })`
   - 채점된 attempt 반환

**요구사항 매핑**: REQ-BE-005-007~008, REQ-BE-005-026~027

---

## Phase C: Quiz 조회/CRUD/상태 Hooks 전환 (Primary Goal)

**목표**: 5개 Quiz hooks를 REST API -> Supabase 쿼리 레이어로 전환

**DDD 접근법** (기존 코드이므로):
- ANALYZE: 각 hook의 현재 동작과 TanStack Query 키 확인
- PRESERVE: query key 형식 유지, 반환 타입 인터페이스 유지
- IMPROVE: REST API 호출 -> `lib/supabase/quizzes.ts` 함수 호출

### 전환 대상 (5개)

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `useQuizList.ts` | `fetchQuizList(params)` from quiz.api | `getQuizzes(params)` |
| `useQuizDetail.ts` | `fetchQuizDetail(quizId)` from quiz.api | `getQuiz(quizId)` |
| `useInstructorQuizzes.ts` | `fetchInstructorQuizzes(params)` from quiz.api | `getInstructorQuizzes(params)` |
| `useQuizMutations.ts` | 6개 REST API 호출 | 6개 Supabase 함수 호출 |
| `useSubmissions.ts` | `fetchSubmissions(quizId)` from quiz.api | `getSubmissions(quizId)` |

### useQuizMutations 내부 6개 mutation 상세

| Mutation | 현재 | 변경 후 |
|----------|------|---------|
| createQuiz | `createQuiz(data)` REST | `createQuiz(data)` Supabase |
| updateQuiz | `updateQuiz(quizId, data)` REST | `updateQuiz(quizId, data)` Supabase |
| deleteQuiz | `deleteQuiz(quizId)` REST | `deleteQuiz(quizId)` Supabase |
| publishQuiz | `publishQuiz(quizId)` REST | `publishQuiz(quizId)` Supabase |
| closeQuiz | `closeQuiz(quizId)` REST | `closeQuiz(quizId)` Supabase |
| duplicateQuiz | `duplicateQuiz(quizId)` REST | `duplicateQuiz(quizId)` Supabase RPC |

**요구사항 매핑**: REQ-BE-005-009~018, REQ-BE-005-025

---

## Phase D: Quiz 응시/결과 Hooks 전환 (Primary Goal)

**목표**: 3개 Quiz 응시 관련 hooks를 REST API -> Supabase 쿼리 레이어로 전환

### 전환 대상 (3개)

| 파일 | 현재 | 변경 후 |
|------|------|---------|
| `useQuizSubmission.ts` | `startQuizAttempt(quizId)` + `submitQuizAttempt(quizId, attemptId)` from quiz.api | `startQuizAttempt(quizId)` RPC + `submitQuizAttempt(attemptId)` RPC |
| `useQuizAutoSave.ts` | `saveDraftAnswers(quizId, attemptId, answers)` from quiz.api | `saveDraftAnswers(attemptId, answers)` Supabase upsert |
| `useQuizResult.ts` | `fetchQuizResult(quizId, attemptId)` from quiz.api | `getQuizResult(quizId, attemptId)` Supabase |

### 주의사항

- **useQuizSubmission**: startAttempt의 에러 응답을 사용자 친화적 메시지로 변환 (RPC EXCEPTION -> Error)
- **useQuizAutoSave**: 3초 debounce 로직 유지, saveDraftAnswers만 Supabase upsert로 교체
- **useQuizResult**: show_answers_after_submit 플래그에 따른 정답 표시 분기 유지

**요구사항 매핑**: REQ-BE-005-019~024

---

## Phase E: 레거시 REST 클라이언트 제거 (Secondary Goal)

**목표**: 더 이상 사용하지 않는 REST API 클라이언트 파일 제거

### 작업 목록

1. **`apps/web/lib/api/quiz.api.ts` 삭제 검증**
   - 이 파일을 import하는 곳이 없는지 grep 확인
   - 파일 삭제

2. **`apps/web/lib/api/index.ts` 검토**
   - quiz 관련 export 제거
   - 다른 도메인(Q&A, Team 등) API가 남아있는지 확인
   - 안전한 경우에만 정리

3. **TypeScript 컴파일 재확인**
   - `pnpm --filter web tsc --noEmit`
   - ESLint: `pnpm --filter web lint`

4. **REST API 참조 잔여 확인**
   - quiz hooks 디렉토리에서 `/api/` import 패턴 검색
   - `quiz.api` import 패턴 검색
   - 0건이어야 함

**요구사항 매핑**: REQ-BE-005-028~030

---

## Phase F: 테스트 커버리지 달성 (Secondary Goal)

**목표**: Quiz 쿼리 레이어 85%+, Quiz hooks 85%+

### 테스트 전략

**신규 쿼리 레이어** (TDD - Phase B에서 먼저 작성):
- `lib/supabase/quizzes.ts`: 각 함수별 vitest 단위 테스트
  - Mock: Supabase client mock (vitest.mock)
  - 정상 케이스 + 에러 케이스
  - 매핑 함수 독립 테스트 (mapQuizRow, mapQuestionRow, mapOptionsFromDB, mapOptionsToDB)

**기존 hooks** (DDD - 전환 후 검증):
- 각 hook별 Supabase 함수 호출 검증
- TanStack Query 캐시 키 호환성 확인
- 에러 상태 전파 확인

**DB 함수 테스트** (Phase A):
- 각 DB 함수에 대한 SQL 레벨 테스트
- 정상 시나리오 + 에러 시나리오 (EXCEPTION raise 확인)

### 커버리지 목표

| 모듈 | 현재 | 목표 |
|------|------|------|
| `lib/supabase/quizzes.ts` | - (신규) | 85%+ |
| `hooks/quiz/useQuizList.ts` | 미확인 | 85%+ |
| `hooks/quiz/useQuizDetail.ts` | 미확인 | 85%+ |
| `hooks/quiz/useInstructorQuizzes.ts` | 미확인 | 85%+ |
| `hooks/quiz/useQuizMutations.ts` | 미확인 | 85%+ |
| `hooks/quiz/useQuizResult.ts` | 미확인 | 85%+ |
| `hooks/quiz/useSubmissions.ts` | 미확인 | 85%+ |
| `hooks/quiz/useQuizSubmission.ts` | 미확인 | 85%+ |
| `hooks/quiz/useQuizAutoSave.ts` | 미확인 | 85%+ |

---

## Technical Approach

### Supabase 쿼리 패턴 (SPEC-BE-003 패턴 재사용)

**집계 포함 SELECT (퀴즈 목록)**:
```typescript
const { data, count } = await supabase
  .from('quizzes')
  .select(
    `
    *,
    courses!course_id(title),
    questionCount:quiz_questions(count),
    attemptCount:quiz_attempts(count)
    `,
    { count: 'exact' }
  )
  .eq('status', 'published')
  .range(from, to);
```

**RPC 호출 패턴 (DB 함수)**:
```typescript
const { data, error } = await supabase
  .rpc('start_quiz_attempt', { p_quiz_id: quizId });
if (error) {
  // PostgreSQL EXCEPTION -> Supabase 에러 변환
  throw new Error(error.message);
}
return data;
```

**Upsert 패턴 (답안 자동저장)**:
```typescript
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
```

**snake_case -> camelCase 매핑 (SPEC-BE-003 패턴 재사용)**:
```typescript
function mapQuizRow(row: QuizRow): QuizListItem {
  return {
    id: row.id,
    courseId: row.course_id,
    courseName: row.courses?.title ?? '',
    title: row.title,
    description: row.description ?? '',
    status: row.status as QuizStatus,
    timeLimitMinutes: row.time_limit_minutes,
    passingScore: row.passing_score,
    questionCount: row.questionCount[0]?.count ?? 0,
    attemptCount: row.attemptCount[0]?.count ?? 0,
    isAiGenerated: row.is_ai_generated ?? false,
    dueDate: row.due_date,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
```

### 에러 처리 패턴

```typescript
// Supabase 쿼리 에러
const { data, error } = await supabase.from('quizzes').select('*');
if (error) throw new Error(`Failed to fetch quizzes: ${error.message}`);

// RPC 에러 (DB EXCEPTION 포함)
const { data, error } = await supabase.rpc('start_quiz_attempt', { p_quiz_id: quizId });
if (error) {
  // DB EXCEPTION 메시지가 error.message에 포함됨
  // 예: "Quiz is not published", "Reattempt not allowed for this quiz"
  throw new Error(error.message);
}
```

### TanStack Query 키 전략

기존 키 패턴 유지 (UI 컴포넌트 변경 최소화):
- 퀴즈 목록: `['quizzes', params]`
- 단일 퀴즈: `['quiz', quizId]`
- 강사 퀴즈 목록: `['instructor-quizzes', params]`
- 퀴즈 결과: `['quiz-result', quizId, attemptId]`
- 제출 현황: `['quiz-submissions', quizId]`

---

## Priority Order

### Primary Goal (필수 - run phase 완료 조건)

1. Phase A: DB 함수 마이그레이션 (RPC 기반이므로 가장 먼저)
2. Phase B: 쿼리 레이어 신규 생성 (hooks가 의존)
3. Phase C: Quiz 조회/CRUD/상태 hooks 5개 전환
4. Phase D: Quiz 응시/결과 hooks 3개 전환

### Secondary Goal (품질 향상)

5. Phase E: 레거시 REST 제거
6. Phase F: 테스트 커버리지 달성

### Optional Goal

- Quiz 성능 최적화 (목록 쿼리에 DB View 도입)
- 퀴즈 시간제한 서버사이드 검증 (현재 클라이언트만)
- fill_in_the_blank 고급 채점 (유사 답안 허용)

---

## Implementation Notes

### 주의사항

1. **SECURITY DEFINER**: DB 함수는 `SECURITY DEFINER`로 실행되어 RLS를 우회. `auth.uid()` 검증은 함수 내부에서 명시적으로 수행
2. **타입 안전성**: Supabase 클라이언트에 `Database` 제네릭 타입 전달 필수
3. **서버 vs 클라이언트**: hooks는 클라이언트 컴포넌트에서 실행되므로 `createClient()`(browser) 사용
4. **RPC 에러 변환**: PostgreSQL EXCEPTION의 message가 `error.message`에 전달됨 (사용자 친화적 메시지로 변환 필요)
5. **options JSONB**: DB 저장 형태 `[{text, isCorrect}]`와 프론트엔드 `[{id, text}] + correctOptionId` 간 양방향 변환 필수
6. **자동저장 idempotent**: upsert 패턴으로 동일 (attempt_id, question_id) 조합은 항상 덮어쓰기
7. **useAIGeneration 제외**: SPEC-AI-001 범위이므로 이 SPEC에서 변경하지 않음

### 파일 수정 순서 (의존성 기반)

```
00014_create_quiz_functions.sql (DB 함수 먼저)
  |
lib/supabase/quizzes.ts (쿼리 레이어)
  |
packages/shared/src/types/quiz.types.ts (최소 정렬)
  |
hooks/quiz/ (각 hook 파일 전환)
  |
lib/api/quiz.api.ts (삭제)
```

### 테스트 실행 명령어

```bash
# 전체 테스트
pnpm test

# 특정 모듈 테스트
pnpm --filter web test lib/supabase/quizzes
pnpm --filter web test hooks/quiz

# 커버리지 확인
pnpm --filter web test --coverage

# 타입 체크
pnpm --filter web tsc --noEmit

# ESLint
pnpm --filter web lint
```
