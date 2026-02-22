# SPEC-INFRA-001: Implementation Plan

| Field    | Value                                          |
| -------- | ---------------------------------------------- |
| SPEC ID  | SPEC-INFRA-001                                 |
| Title    | Supabase Backend Verification & MCP Integration |
| Status   | Completed                                      |

---

## Implementation Strategy

순차적 6단계 접근. 각 Phase는 이전 Phase의 성공에 의존하므로 병렬 실행이 불가하다.

---

## Phase 1: Infrastructure Fixes (Primary Goal - 선행 조건)

모든 후속 작업의 전제 조건. 이 Phase가 완료되어야 Phase 2 이후 진행이 가능하다.

### Task 1.1: Supabase CLI 설치

- 명령어: `brew install supabase/tap/supabase`
- 검증: `supabase --version`이 유효한 버전을 반환하는지 확인
- 위험 요소: Homebrew 업데이트가 필요할 수 있음

### Task 1.2: 마이그레이션 파일 번호 수정

- 작업: `supabase/migrations/00014_create_quiz_functions.sql`을 `00015_create_quiz_functions.sql`로 변경
- 이유: 00014 번호가 `00014_create_vote_count_triggers.sql`과 중복됨
- 검증: 마이그레이션 디렉토리에서 중복 번호가 없는지 확인

### Task 1.3: 고아 파일 삭제

- 작업: `apps/web/vitest.setup.ts` 삭제
- 이유: `vitest.config.ts`에서 참조되지 않는 고아 파일
- 검증: vitest 설정에서 해당 파일 참조가 없는지 확인

---

## Phase 2: Local Supabase Startup & Migration Validation (Primary Goal)

로컬 Supabase 환경을 시작하고 전체 마이그레이션이 정상 동작하는지 확인한다.

### Task 2.1: Supabase 로컬 시작

- 명령어: `supabase start`
- 검증: Docker 컨테이너들이 정상 시작되는지 확인
- 위험 요소: Docker Desktop이 실행 중이어야 함

### Task 2.2: 마이그레이션 실행 및 검증

- 명령어: `supabase db reset`
- 검증: 모든 마이그레이션(00001-00015)이 오류 없이 실행되는지 확인
- 출력: seed.sql이 정상 적용되었는지 확인

### Task 2.3: 테이블 존재 확인

- SQL 쿼리로 15개 테이블 존재 확인
- 대상 테이블: profiles, courses, enrollments, materials, questions, answers, votes, teams, team_members, memos, quizzes, quiz_questions, quiz_attempts, quiz_answers, notifications

### Task 2.4: RLS 정책 확인

- SQL 쿼리로 각 테이블에 RLS 정책이 적용되었는지 확인
- 모든 15개 테이블에 대한 정책 존재 검증

### Task 2.5: 함수 및 트리거 확인

- 헬퍼 함수 확인: get_user_role, is_course_instructor, is_course_enrolled, is_team_member, set_updated_at
- Quiz RPC 함수 확인: start_quiz_attempt, submit_and_grade_quiz, duplicate_quiz
- Vote count 트리거 동작 확인
- Storage 버킷 확인: course-images, material-images

---

## Phase 3: Type System Update (Secondary Goal)

Supabase 로컬 환경에서 TypeScript 타입을 재생성하고 코드 호환성을 확인한다.

### Task 3.1: 타입 재생성

- 명령어: `supabase gen types typescript --local > apps/web/types/supabase.ts`
- 전제 조건: Phase 2 완료 (로컬 Supabase가 실행 중이어야 함)

### Task 3.2: 타입 차이 분석

- 새로 생성된 타입과 기존 타입의 diff 확인
- 추가/변경/제거된 타입 식별
- 3개 RPC 함수 타입 포함 여부 확인

### Task 3.3: 타입 오류 수정

- 타입 변경으로 인한 소스 코드 오류 수정
- `tsc --noEmit`으로 전체 타입 검사 수행
- 영향 받는 파일 목록 정리 및 순차 수정

---

## Phase 4: Supabase MCP Setup (Secondary Goal)

개발 생산성 향상을 위한 Supabase MCP 서버를 구성한다.

### Task 4.1: MCP 설정 추가

- 파일: `.mcp.json`
- 추가 내용:
  ```json
  "supabase": {
    "url": "https://mcp.supabase.com/mcp"
  }
  ```

### Task 4.2: Supabase 인증

- 브라우저 OAuth 플로우를 통한 Supabase 계정 인증
- 프로젝트 연결 확인

### Task 4.3: MCP 도구 검증

- Claude Code에서 Supabase MCP 도구 사용 가능 여부 확인
- 테이블 목록 조회, 스키마 쿼리 테스트

---

## Phase 5: Test Suite Verification (Final Goal)

전체 테스트 스위트를 실행하여 모든 변경이 기존 기능에 영향을 주지 않는지 확인한다.

### Task 5.1: 의존성 동기화

- 명령어: `pnpm install`
- 변경된 타입 파일에 대한 의존성 확인

### Task 5.2: 테스트 실행

- 명령어: `pnpm test` (apps/web 디렉토리)
- 모든 Supabase 관련 테스트 통과 확인

### Task 5.3: 실패 테스트 수정

- 타입 변경으로 인한 테스트 실패 수정
- import 경로 변경이 필요한 경우 수정

### Task 5.4: 테스트 커버리지 확인

- 커버리지 리포트 확인
- 새로 추가된 RPC 함수에 대한 테스트 존재 여부 확인

---

## Phase 6: Integration Smoke Test (Final Goal)

전체 시스템이 통합적으로 동작하는지 최종 검증한다.

### Task 6.1: 개발 서버 시작

- 명령어: `pnpm dev`
- Next.js 개발 서버 정상 시작 확인

### Task 6.2: Supabase 연결 확인

- 브라우저 콘솔에서 Supabase 연결 오류 없음 확인
- 네트워크 탭에서 Supabase API 호출 정상 확인

### Task 6.3: 기본 기능 확인

- 로그인/로그아웃 플로우
- 강의 목록 조회
- Q&A 기능 동작 확인

---

## Files to Modify

| File | Action | Reason |
| ---- | ------ | ------ |
| `supabase/migrations/00014_create_quiz_functions.sql` | Rename to 00015 | 중복 마이그레이션 번호 해결 |
| `.mcp.json` | Edit | Supabase MCP 서버 추가 |
| `apps/web/types/supabase.ts` | Regenerate | 타입 재생성 (RPC 함수 포함) |
| `apps/web/vitest.setup.ts` | Delete | 고아 파일 제거 |
| 타입 오류 관련 파일들 | Edit | 타입 재생성 후 호환성 수정 |

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
| ---- | ---------- | ------ | ---------- |
| Docker 리소스 부족 | Low | High | Docker Desktop 리소스 설정 확인 |
| 마이그레이션 실행 순서 오류 | Medium | High | 번호 변경 후 db reset으로 전체 재실행 |
| 타입 재생성 후 대량 수정 필요 | Medium | Medium | diff를 먼저 확인하고 영향 범위 파악 |
| MCP 인증 실패 | Low | Low | Supabase 계정 상태 확인 |
| 기존 테스트 실패 | Medium | Medium | 테스트별 실패 원인 분석 후 수정 |

---

## Traceability

| Tag | Related |
| --- | ------- |
| SPEC-INFRA-001 | 본 SPEC |
| SPEC-BE-004 | Q&A 마이그레이션 (선행 완료) |
| SPEC-BE-005 | Quiz 마이그레이션 (선행 완료) |
| SPEC-BE-006 | Team+Memo 마이그레이션 (선행 완료) |
