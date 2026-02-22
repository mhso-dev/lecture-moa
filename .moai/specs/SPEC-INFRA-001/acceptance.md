# SPEC-INFRA-001: Acceptance Criteria

| Field    | Value                                          |
| -------- | ---------------------------------------------- |
| SPEC ID  | SPEC-INFRA-001                                 |
| Title    | Supabase Backend Verification & MCP Integration |
| Status   | Completed                                      |

---

## Definition of Done

SPEC-INFRA-001은 아래의 모든 수용 기준이 충족되었을 때 완료로 간주한다.

---

## Acceptance Criteria Checklist

### Infrastructure Setup

- [x] **AC-001**: Supabase CLI가 설치되어 있으며 `supabase --version`이 유효한 버전을 반환한다
- [x] **AC-002**: 모든 마이그레이션 파일이 고유한 순차 번호를 가진다 (중복 없음)

### Migration Validation

- [x] **AC-003**: `supabase db reset`이 오류 없이 완료된다
- [x] **AC-004**: 로컬 데이터베이스에 15개 테이블이 모두 존재한다
- [x] **AC-005**: 모든 RLS 정책이 적용되어 있다 (profiles, courses, enrollments, materials, questions, answers, votes, teams, team_members, memos, quizzes, quiz_questions, quiz_attempts, quiz_answers, notifications)
- [x] **AC-006**: 모든 헬퍼 함수가 존재한다 (get_user_role, is_course_instructor, is_course_enrolled, is_team_member, set_updated_at)
- [x] **AC-007**: 모든 Quiz RPC 함수가 존재한다 (start_quiz_attempt, submit_and_grade_quiz, duplicate_quiz)
- [x] **AC-008**: Vote count 트리거가 정상 동작한다
- [x] **AC-009**: Storage 버킷이 존재한다 (course-images, material-images)
- [x] **AC-010**: Seed 데이터가 채워져 있다 (3명의 사용자, 2개의 강의, 교재, Q&A, 팀, 퀴즈)

### Type System

- [x] **AC-011**: 생성된 TypeScript 타입이 모든 테이블, 함수, enum을 포함한다

### MCP Integration

- [x] **AC-012**: Supabase MCP가 .mcp.json에 설정되어 있다
- [x] **AC-013**: Supabase MCP가 프로젝트 데이터베이스 스키마를 조회할 수 있다

### Test & Runtime Validation

- [x] **AC-014**: `pnpm test`가 apps/web의 모든 테스트를 통과한다
- [x] **AC-015**: 개발 서버가 Supabase 연결 오류 없이 시작된다

### Cleanup

- [x] **AC-016**: 고아 vitest.setup.ts가 제거되었다

---

## Test Scenarios (Given-When-Then)

### Scenario 1: Migration File Uniqueness

```gherkin
Given 마이그레이션 디렉토리에 모든 SQL 파일이 존재할 때
When 파일명에서 번호를 추출하여 정렬하면
Then 00001부터 00015까지 중복 없이 연속된 번호가 존재해야 한다
```

### Scenario 2: Database Reset

```gherkin
Given Supabase 로컬 환경이 실행 중일 때
When `supabase db reset` 명령어를 실행하면
Then 모든 마이그레이션이 순서대로 적용되어야 한다
And seed.sql이 정상적으로 실행되어야 한다
And 에러 메시지가 출력되지 않아야 한다
```

### Scenario 3: Table Existence Verification

```gherkin
Given 마이그레이션이 성공적으로 완료되었을 때
When information_schema.tables에서 public 스키마의 테이블을 조회하면
Then profiles, courses, enrollments, materials, questions, answers, votes, teams, team_members, memos, quizzes, quiz_questions, quiz_attempts, quiz_answers, notifications 15개 테이블이 모두 존재해야 한다
```

### Scenario 4: RLS Policy Verification

```gherkin
Given 모든 테이블이 생성되었을 때
When pg_policies에서 각 테이블의 RLS 정책을 조회하면
Then 각 테이블에 최소 1개 이상의 RLS 정책이 존재해야 한다
And 각 테이블에 RLS가 활성화(rls_enabled = true)되어 있어야 한다
```

### Scenario 5: Helper Functions Verification

```gherkin
Given 데이터베이스가 초기화되었을 때
When pg_proc에서 public 스키마의 함수를 조회하면
Then get_user_role, is_course_instructor, is_course_enrolled, is_team_member, set_updated_at 함수가 존재해야 한다
```

### Scenario 6: Quiz RPC Functions Verification

```gherkin
Given 데이터베이스가 초기화되었을 때
When pg_proc에서 Quiz 관련 RPC 함수를 조회하면
Then start_quiz_attempt, submit_and_grade_quiz, duplicate_quiz 함수가 존재해야 한다
```

### Scenario 7: Vote Count Trigger

```gherkin
Given seed 데이터가 채워져 있고 질문과 답변이 존재할 때
When 특정 질문에 대해 투표를 추가하면
Then 해당 질문의 vote_count가 자동으로 1 증가해야 한다
And 투표를 삭제하면 vote_count가 자동으로 1 감소해야 한다
```

### Scenario 8: TypeScript Type Generation

```gherkin
Given Supabase 로컬 환경이 실행 중이고 모든 마이그레이션이 적용되었을 때
When `supabase gen types typescript --local` 명령어를 실행하면
Then 생성된 타입 파일에 15개 테이블에 대한 타입이 포함되어야 한다
And start_quiz_attempt, submit_and_grade_quiz, duplicate_quiz RPC 함수 타입이 포함되어야 한다
And get_user_role, is_course_instructor, is_course_enrolled, is_team_member 함수 타입이 포함되어야 한다
```

### Scenario 9: Supabase MCP Configuration

```gherkin
Given .mcp.json에 Supabase MCP가 설정되었을 때
When Claude Code 세션에서 Supabase MCP 도구를 사용하면
Then 프로젝트의 데이터베이스 테이블 목록을 조회할 수 있어야 한다
And 테이블 스키마 정보를 가져올 수 있어야 한다
```

### Scenario 10: Test Suite Pass

```gherkin
Given 타입 재생성 및 코드 수정이 완료되었을 때
When apps/web 디렉토리에서 `pnpm test`를 실행하면
Then 모든 테스트가 통과해야 한다
And 실패한 테스트가 0건이어야 한다
```

### Scenario 11: Dev Server Connection

```gherkin
Given Supabase 연결 정보가 .env.local에 설정되어 있을 때
When `pnpm dev`로 개발 서버를 시작하면
Then Next.js 서버가 정상적으로 시작되어야 한다
And 브라우저 콘솔에 Supabase 연결 관련 에러가 없어야 한다
And 네트워크 탭에서 Supabase API 호출이 성공 응답을 반환해야 한다
```

### Scenario 12: Storage Buckets

```gherkin
Given 마이그레이션이 완료되었을 때
When storage.buckets 테이블을 조회하면
Then course-images, material-images 버킷이 존재해야 한다
```

---

## Quality Gate Criteria

| Gate | Criteria | Threshold |
| ---- | -------- | --------- |
| Migration | 모든 마이그레이션 순차 실행 성공 | 0 errors |
| Type Safety | TypeScript 컴파일 오류 없음 | 0 type errors |
| Test Suite | 전체 테스트 통과 | 0 failures |
| Runtime | 개발 서버 연결 오류 없음 | 0 connection errors |
| MCP | Supabase MCP 스키마 조회 가능 | Functional |

---

## Verification Methods

| AC | Method | Tool |
| -- | ------ | ---- |
| AC-001 | CLI 명령어 실행 | `supabase --version` |
| AC-002 | 파일명 검사 | `ls supabase/migrations/` |
| AC-003 | CLI 명령어 실행 | `supabase db reset` |
| AC-004 | SQL 쿼리 | `SELECT tablename FROM pg_tables WHERE schemaname = 'public'` |
| AC-005 | SQL 쿼리 | `SELECT * FROM pg_policies` |
| AC-006 | SQL 쿼리 | `SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace` |
| AC-007 | SQL 쿼리 | 동일 (RPC 함수 확인) |
| AC-008 | SQL 쿼리 + DML | 투표 INSERT 후 count 확인 |
| AC-009 | SQL 쿼리 | `SELECT * FROM storage.buckets` |
| AC-010 | SQL 쿼리 | 각 테이블 레코드 수 확인 |
| AC-011 | 파일 내용 검사 | 타입 파일 grep |
| AC-012 | 파일 내용 검사 | `.mcp.json` 확인 |
| AC-013 | MCP 도구 실행 | Claude Code에서 MCP 도구 호출 |
| AC-014 | 테스트 실행 | `pnpm test` |
| AC-015 | 서버 시작 | `pnpm dev` + 콘솔 확인 |
| AC-016 | 파일 존재 확인 | `ls apps/web/vitest.setup.ts` |

---

## Traceability

| Tag | Related |
| --- | ------- |
| SPEC-INFRA-001 | 본 SPEC |
| SPEC-BE-004 | Q&A 마이그레이션 (선행 완료) |
| SPEC-BE-005 | Quiz 마이그레이션 (선행 완료) |
| SPEC-BE-006 | Team+Memo 마이그레이션 (선행 완료) |
