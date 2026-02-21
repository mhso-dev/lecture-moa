# SPEC-INFRA-001: Supabase Backend Verification & MCP Integration

| Field    | Value                                          |
| -------- | ---------------------------------------------- |
| SPEC ID  | SPEC-INFRA-001                                 |
| Title    | Supabase Backend Verification & MCP Integration |
| Type     | Infrastructure / Verification                  |
| Status   | Draft                                          |
| Priority | High                                           |
| Created  | 2026-02-21                                     |

---

## Context

lecture-moa 프로젝트는 Supabase 백엔드 마이그레이션 Phase 2를 완료했다 (SPEC-BE-004 Q&A, SPEC-BE-005 Quiz, SPEC-BE-006 Team+Memo). 세 개의 병렬 worktree 브랜치가 main에 병합되었다. Phase 3(Dashboard + AI)로 진행하기 전에 전체 Supabase 백엔드가 정상 동작하는지 검증하고, 개발 생산성을 위한 Supabase MCP를 구성해야 한다.

---

## Environment

- Docker Desktop: 실행 중 (확인됨)
- Homebrew: macOS 패키지 관리자 (설치됨)
- Supabase 호스팅: yhgwfxxrqsuzstshfhhk.supabase.co (현재 .env.local 대상)
- Node.js / pnpm: 모노레포 패키지 관리
- 프로젝트 구조: apps/web (Next.js 15), apps/api (Fastify), apps/ai (FastAPI), packages/shared

---

## Assumptions

- Docker Desktop이 실행 중이며 Supabase 로컬 개발 환경을 구동할 수 있다
- Homebrew를 통해 Supabase CLI를 설치할 수 있다
- Supabase 계정이 있으며 MCP 인증을 위한 OAuth 플로우를 수행할 수 있다
- 현재 .env.local의 호스팅 Supabase 연결 정보가 유효하다
- Phase 2에서 병합된 마이그레이션 파일들이 모두 main 브랜치에 존재한다

---

## Current State Issues

| Severity | Issue | Description |
| -------- | ----- | ----------- |
| CRITICAL | 중복 마이그레이션 번호 00014 | 00014_create_vote_count_triggers.sql과 00014_create_quiz_functions.sql이 동일 번호 사용 |
| HIGH | Supabase CLI 미설치 | 로컬 환경에 Supabase CLI가 설치되어 있지 않음 |
| MEDIUM | supabase.ts 타입 정의 누락 | 3개 RPC 함수 누락 (start_quiz_attempt, submit_and_grade_quiz, duplicate_quiz) |
| MEDIUM | Supabase MCP 미구성 | .mcp.json에 Supabase MCP 서버가 설정되어 있지 않음 |
| LOW | 고아 vitest.setup.ts 파일 | vitest.config.ts에서 참조되지 않는 설정 파일 |
| INFO | .env.local 호스팅 연결 | 현재 호스팅 Supabase(yhgwfxxrqsuzstshfhhk.supabase.co)를 가리킴 |

---

## Requirements (EARS Format)

### REQ-INFRA-001-010: Migration Execution

**WHEN** 개발자가 `supabase db reset`을 실행하면, **THEN** 모든 마이그레이션(00001-00015)이 순서대로 오류 없이 실행되어야 하며 **AND** seed.sql이 테스트 데이터를 성공적으로 채워야 한다.

### REQ-INFRA-001-020: Migration File Uniqueness

**WHEN** 마이그레이션 파일을 검사하면, **THEN** 각 마이그레이션은 중복 없는 고유한 순차 번호를 가져야 한다.

### REQ-INFRA-001-030: TypeScript Type Generation

**WHEN** `supabase gen types typescript --local`이 실행되면, **THEN** 생성된 타입은 15개 테이블, 모든 RLS 헬퍼 함수, 3개의 새로운 Quiz RPC 함수를 포함해야 한다.

### REQ-INFRA-001-040: Supabase MCP Configuration

**WHEN** Supabase MCP가 .mcp.json에 구성되면, **THEN** Claude Code가 프로젝트 데이터베이스 스키마를 조회하고 읽기 전용 쿼리를 실행할 수 있어야 한다.

### REQ-INFRA-001-050: Test Suite Validation

**WHEN** 전체 테스트 스위트가 실행되면 (`pnpm test` in apps/web), **THEN** 모든 Supabase 관련 테스트가 실패 없이 통과해야 한다.

### REQ-INFRA-001-060: Development Server Connection

**WHEN** Next.js 개발 서버가 시작되면, **THEN** Supabase(로컬 또는 호스팅)에 연결 오류 없이 성공적으로 연결해야 한다.

---

## Technical Approach

### Phase 1: Infrastructure Issues 수정

- Supabase CLI 설치: `brew install supabase/tap/supabase`
- 마이그레이션 파일 번호 수정: 00014_create_quiz_functions.sql을 00015_create_quiz_functions.sql로 변경
- 고아 vitest.setup.ts 파일 삭제

### Phase 2: Local Supabase Validation

- `supabase start`로 로컬 Docker 컨테이너 시작
- `supabase db reset`으로 모든 마이그레이션 및 시드 데이터 적용
- 모든 테이블, RLS 정책, 함수, 트리거 존재 확인

### Phase 3: Type Regeneration

- `supabase gen types typescript --local > apps/web/types/supabase.ts` 실행
- 생성된 타입을 이전 버전과 비교
- 변경으로 인한 import/type 오류 수정

### Phase 4: Supabase MCP Configuration

- .mcp.json에 Supabase MCP 추가:
  ```json
  "supabase": {
    "url": "https://mcp.supabase.com/mcp"
  }
  ```
- 브라우저 OAuth 플로우를 통한 인증
- MCP가 프로젝트 스키마를 조회할 수 있는지 확인

### Phase 5: Test Suite Validation

- `pnpm install`로 의존성 동기화
- apps/web에서 `pnpm test` 실행
- 타입 변경 또는 import 경로 관련 테스트 실패 수정

### Phase 6: Frontend Verification

- `pnpm dev`로 개발 서버 시작
- Supabase 연결 확인 (콘솔 에러 없음)
- 기본 인증 플로우, 강의 목록 테스트

---

## Out of Scope

- 새로운 기능 개발
- 성능 최적화
- 프로덕션 배포
- Edge Functions 배포

---

## Dependencies

| Dependency | Status | Notes |
| ---------- | ------ | ----- |
| Docker Desktop | 실행 중 | 확인됨 |
| Homebrew | 설치됨 | Supabase CLI 설치용 |
| Supabase 계정 | 필요 | MCP 인증용 |

---

## Traceability

| Tag | Related |
| --- | ------- |
| SPEC-BE-004 | Q&A Supabase 마이그레이션 (완료) |
| SPEC-BE-005 | Quiz Supabase 마이그레이션 (완료) |
| SPEC-BE-006 | Team+Memo Supabase 마이그레이션 (완료) |
