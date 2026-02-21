---
spec_id: SPEC-BE-005
version: "1.0.0"
created: "2026-02-21"
updated: "2026-02-21"
---

# SPEC-BE-005 Acceptance Criteria: Quiz System Supabase Backend Integration

## Quality Gates

- 테스트 통과: 기존 테스트 + 신규 테스트 모두 pass
- 커버리지: `lib/supabase/quizzes.ts` 85%+
- TypeScript: 컴파일 오류 0개 (신규 코드 기준)
- ESLint: 새로운 경고 0개
- REST API 호출 코드 완전 제거: `lib/api/quiz.api.ts` 삭제 확인
- DB 함수 3개 정상 동작 확인

---

## AC-001: PL/pgSQL DB 함수

**연관 요구사항**: REQ-BE-005-001~006

### Scenario 1: start_quiz_attempt 정상 시작

**Given** published 상태의 퀴즈가 존재하고, 마감일이 지나지 않았고
**When** 인증된 학생이 `start_quiz_attempt(quiz_id)` RPC를 호출하면
**Then** 새 `quiz_attempts` 레코드가 생성되어야 한다
**And** `status`가 `'in_progress'`여야 한다
**And** `started_at`이 현재 시간이어야 한다

### Scenario 2: start_quiz_attempt 기존 attempt 재개

**Given** 학생이 이미 `in_progress` 상태의 attempt를 가지고 있고
**When** 동일 퀴즈에 대해 `start_quiz_attempt(quiz_id)`를 호출하면
**Then** 새 레코드를 생성하지 않고 기존 attempt를 반환해야 한다

### Scenario 3: start_quiz_attempt 미발행 퀴즈 거부

**Given** `draft` 상태의 퀴즈가 존재하고
**When** `start_quiz_attempt(quiz_id)`를 호출하면
**Then** `Quiz is not published` 메시지와 함께 EXCEPTION이 raise되어야 한다

### Scenario 4: start_quiz_attempt 마감일 초과 거부

**Given** `due_date`가 과거인 published 퀴즈가 존재하고
**When** `start_quiz_attempt(quiz_id)`를 호출하면
**Then** `Quiz deadline has passed` 메시지와 함께 EXCEPTION이 raise되어야 한다

### Scenario 5: start_quiz_attempt 재응시 불가 거부

**Given** `allow_reattempt`가 false이고, 학생이 이미 `graded` 상태의 attempt를 가지고 있고
**When** `start_quiz_attempt(quiz_id)`를 호출하면
**Then** `Reattempt not allowed for this quiz` 메시지와 함께 EXCEPTION이 raise되어야 한다

### Scenario 6: submit_and_grade_quiz multiple_choice 채점

**Given** `in_progress` 상태의 attempt에 multiple_choice 답안이 저장되어 있고
**When** `submit_and_grade_quiz(attempt_id)`를 호출하면
**Then** 학생 답안과 `correct_answer`가 정확히 일치하는 경우 `is_correct = true`로 설정되어야 한다
**And** 일치하지 않는 경우 `is_correct = false`로 설정되어야 한다
**And** `points_earned`가 정답인 경우 해당 문제의 `points`, 오답인 경우 0이어야 한다

### Scenario 7: submit_and_grade_quiz true_false 채점

**Given** true_false 문제의 답안이 저장되어 있고
**When** `submit_and_grade_quiz(attempt_id)`를 호출하면
**Then** 대소문자를 무시하고 비교하여 채점해야 한다
**And** `"True"`와 `"true"`는 동일하게 처리되어야 한다

### Scenario 8: submit_and_grade_quiz short_answer 채점

**Given** short_answer 문제의 답안이 저장되어 있고
**When** `submit_and_grade_quiz(attempt_id)`를 호출하면
**Then** 앞뒤 공백을 제거하고 대소문자를 무시하여 비교해야 한다
**And** `" Answer "` 와 `"answer"`는 동일하게 처리되어야 한다

### Scenario 9: submit_and_grade_quiz fill_in_the_blank 채점

**Given** fill_in_the_blank 문제의 답안이 저장되어 있고
**When** `submit_and_grade_quiz(attempt_id)`를 호출하면
**Then** 앞뒤 공백을 제거하고 대소문자를 무시하여 비교해야 한다

### Scenario 10: submit_and_grade_quiz 총 점수 계산

**Given** 3개 문제 (각 10점)에 대해 2개 정답, 1개 오답인 attempt에서
**When** `submit_and_grade_quiz(attempt_id)`를 호출하면
**Then** `score`는 20이어야 한다
**And** `total_points`는 30이어야 한다
**And** `status`는 `'graded'`여야 한다
**And** `submitted_at`이 현재 시간이어야 한다

### Scenario 11: submit_and_grade_quiz 권한 검증

**Given** 다른 학생 소유의 attempt_id가 존재하고
**When** 현재 학생이 `submit_and_grade_quiz(attempt_id)`를 호출하면
**Then** `Not authorized` 메시지와 함께 EXCEPTION이 raise되어야 한다

### Scenario 12: submit_and_grade_quiz 이미 제출된 attempt 거부

**Given** `graded` 상태의 attempt가 존재하고
**When** `submit_and_grade_quiz(attempt_id)`를 호출하면
**Then** `Attempt already submitted` 메시지와 함께 EXCEPTION이 raise되어야 한다

### Scenario 13: duplicate_quiz 정상 복제

**Given** 5개 문제를 포함한 퀴즈가 존재하고
**When** 퀴즈 생성자가 `duplicate_quiz(quiz_id)`를 호출하면
**Then** 새 퀴즈 레코드가 생성되어야 한다
**And** 새 퀴즈의 `title`이 원본 title + ` (Copy)`여야 한다
**And** 새 퀴즈의 `status`가 `'draft'`여야 한다
**And** 5개 문제가 모두 복제되어야 한다
**And** 복제된 문제의 `quiz_id`가 새 퀴즈 ID여야 한다

### Scenario 14: duplicate_quiz 권한 검증

**Given** 다른 강사가 생성한 퀴즈가 존재하고
**When** 현재 강사가 `duplicate_quiz(quiz_id)`를 호출하면
**Then** `Not authorized to duplicate this quiz` 메시지와 함께 EXCEPTION이 raise되어야 한다

---

## AC-002: Supabase 쿼리 레이어

**연관 요구사항**: REQ-BE-005-007~008, REQ-BE-005-026~027

### Scenario 1: quizzes.ts 파일 존재

**Given** Phase B 구현이 완료되고
**When** `apps/web/lib/supabase/` 디렉토리를 확인하면
**Then** `quizzes.ts` 파일이 존재해야 한다

### Scenario 2: getQuizzes 기본 동작

**Given** Supabase 클라이언트가 mock되고 quiz 데이터가 준비되었을 때
**When** `getQuizzes()` 함수를 호출하면
**Then** `{ data: QuizListItem[], total: number, page: number, limit: number }` 형태가 반환되어야 한다
**And** 각 항목의 `courseId`가 DB의 `course_id`에서 매핑되어야 한다
**And** `courseName`이 DB의 `courses.title`에서 JOIN으로 채워져야 한다
**And** `questionCount`가 `quiz_questions` COUNT 집계 결과여야 한다

### Scenario 3: getQuizzes 페이지네이션

**Given** `{ page: 2, limit: 10 }` 파라미터로 호출할 때
**When** `getQuizzes(params)` 함수가 실행되면
**Then** `.range(10, 19)` 쿼리가 실행되어야 한다

### Scenario 4: getQuiz 문제 포함

**Given** 3개 문제를 포함한 퀴즈가 존재하고
**When** `getQuiz(quizId)` 함수를 호출하면
**Then** 퀴즈 정보와 함께 3개 문제가 반환되어야 한다
**And** 각 문제의 `questionText`가 DB의 `content`에서 매핑되어야 한다
**And** 각 문제의 `type`이 DB의 `question_type`에서 매핑되어야 한다

### Scenario 5: mapOptionsFromDB 학생용 (정답 제외)

**Given** DB options가 `[{text: "A", isCorrect: true}, {text: "B", isCorrect: false}]`이고
**When** `mapOptionsFromDB(options, false)` 함수를 호출하면
**Then** `options`는 `[{id: "opt_0", text: "A"}, {id: "opt_1", text: "B"}]`여야 한다
**And** `correctOptionId`는 반환되지 않아야 한다

### Scenario 6: mapOptionsFromDB 결과/강사용 (정답 포함)

**Given** DB options가 `[{text: "A", isCorrect: true}, {text: "B", isCorrect: false}]`이고
**When** `mapOptionsFromDB(options, true)` 함수를 호출하면
**Then** `options`는 `[{id: "opt_0", text: "A"}, {id: "opt_1", text: "B"}]`여야 한다
**And** `correctOptionId`는 `"opt_0"`이어야 한다

### Scenario 7: mapOptionsToDB 변환

**Given** frontend options `[{id: "opt_0", text: "A"}, {id: "opt_1", text: "B"}]`와 correctOptionId `"opt_0"`이
**When** `mapOptionsToDB(options, correctOptionId)` 함수를 호출하면
**Then** `[{text: "A", isCorrect: true}, {text: "B", isCorrect: false}]`이 반환되어야 한다

### Scenario 8: mapOptionsFromDB 엣지 케이스 (빈 배열)

**Given** DB options가 빈 배열 `[]`이고
**When** `mapOptionsFromDB([], false)` 함수를 호출하면
**Then** `{ options: [] }`이 반환되어야 한다

### Scenario 9: saveDraftAnswers upsert 동작

**Given** attempt에 대한 기존 답안이 존재하고
**When** 동일 question_id에 대해 `saveDraftAnswers(attemptId, [{questionId, answer: 'new'}])` 호출 시
**Then** 기존 답안이 새 답안으로 업데이트되어야 한다
**And** 중복 레코드가 생성되지 않아야 한다

### Scenario 10: Supabase 에러 전파

**Given** Supabase 클라이언트가 오류를 반환하도록 mock되고
**When** 쿼리 레이어 함수가 호출되면
**Then** `Error` 객체가 throw되어야 한다
**And** 오류 메시지가 포함되어야 한다

### Scenario 11: 쿼리 레이어 테스트 커버리지

**Given** 구현이 완료되고
**When** `pnpm --filter web test --coverage lib/supabase/quizzes` 커버리지를 측정하면
**Then** `quizzes.ts` 85% 이상이어야 한다

---

## AC-003: Quiz 조회/CRUD/상태 Hooks 전환

**연관 요구사항**: REQ-BE-005-009~018, REQ-BE-005-025

### Scenario 1: useQuizList Supabase 사용

**Given** `useQuizList()` 훅이 수정되고
**When** 컴포넌트에서 `useQuizList({ page: 1 })`를 호출하면
**Then** REST API(`fetchQuizList`) 대신 `getQuizzes()` Supabase 쿼리가 실행되어야 한다
**And** 반환 타입이 기존 인터페이스와 호환되어야 한다

### Scenario 2: useQuizDetail 문제 포함

**Given** `useQuizDetail(quizId)` 훅이 수정되고
**When** 컴포넌트에서 호출되면
**Then** 퀴즈 정보와 함께 문제 목록이 반환되어야 한다
**And** multiple_choice 문제의 options가 `[{id, text}]` 형태여야 한다

### Scenario 3: useInstructorQuizzes 전체 status 포함

**Given** `useInstructorQuizzes()` 훅이 수정되고
**When** 강사가 호출하면
**Then** draft, published, closed 모든 상태의 퀴즈가 반환되어야 한다

### Scenario 4: useQuizMutations.createQuiz 정상 생성

**Given** `useQuizMutations()` 훅이 수정되고
**When** `createQuiz` mutation에 퀴즈 데이터와 문제 목록을 전달하면
**Then** `createQuiz()` Supabase 함수가 호출되어야 한다
**And** 문제의 options가 DB 형태로 변환되어 저장되어야 한다
**And** 성공 시 퀴즈 목록 캐시가 무효화되어야 한다

### Scenario 5: useQuizMutations.publishQuiz 상태 변경

**Given** `useQuizMutations()` 훅이 수정되고
**When** `publishQuiz` mutation에 quizId를 전달하면
**Then** 해당 퀴즈의 `status`가 `'published'`로 변경되어야 한다

### Scenario 6: useQuizMutations.closeQuiz 상태 변경

**Given** `useQuizMutations()` 훅이 수정되고
**When** `closeQuiz` mutation에 quizId를 전달하면
**Then** 해당 퀴즈의 `status`가 `'closed'`로 변경되어야 한다

### Scenario 7: useQuizMutations.duplicateQuiz RPC 호출

**Given** `useQuizMutations()` 훅이 수정되고
**When** `duplicateQuiz` mutation에 quizId를 전달하면
**Then** `duplicate_quiz` RPC가 호출되어야 한다
**And** 성공 시 강사 퀴즈 목록 캐시가 무효화되어야 한다

### Scenario 8: useQuizMutations.deleteQuiz 삭제

**Given** `useQuizMutations()` 훅이 수정되고
**When** `deleteQuiz` mutation에 quizId를 전달하면
**Then** 해당 퀴즈가 삭제되어야 한다
**And** 연관 questions, attempts, answers가 CASCADE 삭제되어야 한다

### Scenario 9: useSubmissions 제출 현황

**Given** `useSubmissions(quizId)` 훅이 수정되고
**When** 강사가 호출하면
**Then** 학생별 최신 attempt 정보가 반환되어야 한다
**And** 각 항목에 학생 이름, 점수, 상태, 제출 시간이 포함되어야 한다

### Scenario 10: 기존 Query Key 호환성

**Given** hooks가 Supabase로 전환된 후
**When** 기존 컴포넌트가 동일한 query key로 캐시를 invalidate하면
**Then** 정상적으로 캐시 무효화가 작동해야 한다
**And** UI 컴포넌트 코드를 변경하지 않아도 된다

---

## AC-004: Quiz 응시/결과 Hooks 전환

**연관 요구사항**: REQ-BE-005-019~024

### Scenario 1: useQuizSubmission.startAttempt 정상 시작

**Given** `useQuizSubmission()` 훅이 수정되고
**When** `startAttempt` mutation에 quizId를 전달하면
**Then** `start_quiz_attempt` RPC가 호출되어야 한다
**And** 성공 시 attempt 레코드가 반환되어야 한다

### Scenario 2: useQuizSubmission.startAttempt 에러 처리

**Given** published가 아닌 퀴즈에 대해
**When** `startAttempt` mutation이 실행되면
**Then** 사용자 친화적 오류 메시지가 반환되어야 한다
**And** mutation이 error 상태가 되어야 한다

### Scenario 3: useQuizSubmission.submitAttempt 채점 결과

**Given** 답안이 저장된 in_progress attempt에서
**When** `submitAttempt` mutation을 실행하면
**Then** `submit_and_grade_quiz` RPC가 호출되어야 한다
**And** 반환된 attempt의 `status`가 `'graded'`여야 한다
**And** `score`와 `total_points`가 포함되어야 한다

### Scenario 4: useQuizAutoSave 3초 debounce

**Given** `useQuizAutoSave()` 훅이 수정되고
**When** 학생이 답안을 빠르게 변경하면
**Then** 마지막 변경 후 3초 경과 시 `saveDraftAnswers` Supabase upsert가 실행되어야 한다
**And** 3초 이내 추가 변경 시 이전 저장이 취소되고 새 타이머가 시작되어야 한다

### Scenario 5: useQuizAutoSave Supabase upsert 사용

**Given** `useQuizAutoSave()` 훅이 수정되고
**When** 자동저장이 트리거되면
**Then** REST API(`saveDraftAnswers`) 대신 Supabase `quiz_answers` upsert가 실행되어야 한다

### Scenario 6: useQuizAutoSave 저장 실패 시 재시도

**Given** Supabase upsert가 네트워크 오류로 실패하고
**When** 자동저장이 트리거되면
**Then** 최대 3회 재시도해야 한다
**And** 재시도 실패 시 로컬 상태(Zustand)에 답안이 유지되어야 한다

### Scenario 7: useQuizResult 채점 결과 표시

**Given** `useQuizResult(quizId, attemptId)` 훅이 수정되고
**When** graded 상태의 attempt에 대해 호출하면
**Then** 문제별 학생 답안, 정답, 정오답 여부, 획득 점수가 반환되어야 한다
**And** 총 점수, 총 배점, 통과 여부(passing_score 대비)가 포함되어야 한다

### Scenario 8: useQuizResult show_answers_after_submit false

**Given** `show_answers_after_submit`가 false인 퀴즈의 결과를 조회할 때
**When** `useQuizResult(quizId, attemptId)` 훅이 호출되면
**Then** 정답과 해설이 제외되어야 한다
**And** 총 점수와 통과 여부만 표시되어야 한다

---

## AC-005: 레거시 REST 클라이언트 제거

**연관 요구사항**: REQ-BE-005-028~030

### Scenario 1: quiz.api.ts REST 파일 삭제

**Given** 모든 Quiz hooks가 Supabase로 전환된 후
**When** `apps/web/lib/api/quiz.api.ts` 파일을 확인하면
**Then** 해당 파일이 존재하지 않아야 한다 (삭제되어야 한다)

### Scenario 2: 삭제 후 import 오류 없음

**Given** `lib/api/quiz.api.ts`가 삭제된 후
**When** `pnpm --filter web tsc --noEmit`을 실행하면
**Then** 삭제된 파일을 참조하는 import 오류가 없어야 한다

### Scenario 3: REST API 호출 제거 확인

**Given** 코드베이스 전체를 grep하면
**When** quiz hooks 디렉토리에서 `quiz.api` 또는 `lib/api/quiz` import 패턴을 검색하면
**Then** 해당 패턴이 발견되지 않아야 한다

### Scenario 4: 기존 테스트 모두 통과

**Given** 레거시 파일 제거 후
**When** `pnpm test`를 실행하면
**Then** 기존 테스트가 모두 통과해야 한다
**And** 새로운 테스트 실패가 없어야 한다

---

## Definition of Done (완료 기준)

SPEC-BE-005가 완료된 것으로 간주하는 최소 조건:

**필수 조건 (Primary Goals)**

- [ ] `supabase/migrations/00014_create_quiz_functions.sql`: 3개 DB 함수 (start_quiz_attempt, submit_and_grade_quiz, duplicate_quiz) 구현 및 적용 가능
- [ ] `apps/web/lib/supabase/quizzes.ts`: ~15개 쿼리 함수 모두 구현
- [ ] 매핑 함수 구현: mapQuizRow, mapQuestionRow, mapOptionsFromDB, mapOptionsToDB
- [ ] 8개 Quiz hooks 전환 완료 (REST API 호출 없음):
  - [ ] useQuizList.ts
  - [ ] useQuizDetail.ts
  - [ ] useInstructorQuizzes.ts
  - [ ] useQuizMutations.ts (6개 mutation)
  - [ ] useQuizResult.ts
  - [ ] useSubmissions.ts
  - [ ] useQuizSubmission.ts
  - [ ] useQuizAutoSave.ts
- [ ] TypeScript 컴파일: 새로운 오류 0개
- [ ] ESLint: 새로운 경고 0개
- [ ] 기존 테스트 모두 통과

**권장 조건 (Secondary Goals)**

- [ ] `lib/api/quiz.api.ts` 삭제 완료
- [ ] `lib/supabase/quizzes.ts` 테스트 커버리지 85%+
- [ ] Quiz hooks 테스트 커버리지 85%+
- [ ] 매핑 함수 (mapOptionsFromDB, mapOptionsToDB) 엣지 케이스 테스트

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
grep -r "quiz.api" apps/web/hooks/quiz/
grep -r "lib/api/quiz" apps/web/hooks/quiz/
grep -r "fetchQuizList\|fetchQuizDetail\|fetchInstructorQuizzes\|startQuizAttempt\|saveDraftAnswers\|submitQuizAttempt\|fetchQuizResult\|fetchSubmissions\|createQuiz\|updateQuiz\|deleteQuiz\|publishQuiz\|closeQuiz\|duplicateQuiz" apps/web/lib/api/ 2>/dev/null

# 6. 삭제 파일 확인
ls apps/web/lib/api/quiz.api.ts 2>/dev/null && echo "NOT DELETED" || echo "DELETED"

# 7. DB 함수 존재 확인 (로컬 Supabase)
# psql -h localhost -p 54322 -U postgres -d postgres -c "\df public.start_quiz_attempt"
# psql -h localhost -p 54322 -U postgres -d postgres -c "\df public.submit_and_grade_quiz"
# psql -h localhost -p 54322 -U postgres -d postgres -c "\df public.duplicate_quiz"
```
