---
id: SPEC-BE-001
type: acceptance
version: "1.0.0"
status: draft
created: "2026-02-20"
updated: "2026-02-20"
author: mhso-dev
---

# SPEC-BE-001 수락 기준: Supabase 초기 설정

## 1. 수락 기준 목록

### AC-001: Supabase 프로젝트 초기화

**Given** supabase CLI가 설치되어 있고 Docker가 실행 중일 때
**When** `supabase start` 명령을 프로젝트 루트에서 실행하면
**Then** 로컬 Supabase 스택이 기동되어야 한다 (PostgreSQL, Auth, Realtime, Storage, Studio)

**Given** Supabase 로컬 스택이 실행 중일 때
**When** Supabase Studio (http://localhost:54323)에 접속하면
**Then** 대시보드가 정상적으로 표시되어야 한다

**검증 방법**: `supabase status` 명령으로 서비스 상태 확인

---

### AC-002: 데이터베이스 스키마 생성 (15개 테이블)

**Given** Supabase 로컬 스택이 실행 중일 때
**When** `supabase db reset` 명령을 실행하면
**Then** 15개 테이블이 모두 생성되어야 한다:
1. profiles
2. courses
3. course_enrollments
4. materials
5. questions
6. answers
7. votes
8. teams
9. team_members
10. memos
11. quizzes
12. quiz_questions
13. quiz_attempts
14. quiz_answers
15. notifications

**Given** 마이그레이션이 적용된 상태일 때
**When** 다음 SQL 쿼리를 실행하면:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```
**Then** 15개 테이블 이름이 모두 반환되어야 한다

**Given** profiles 테이블이 생성된 상태일 때
**When** profiles 테이블의 id 컬럼 FK를 확인하면
**Then** auth.users(id)를 참조하고 ON DELETE CASCADE 설정이 되어 있어야 한다

**Given** updated_at 컬럼이 있는 테이블에서
**When** 행을 UPDATE하면
**Then** updated_at 값이 자동으로 현재 시간으로 갱신되어야 한다

**검증 방법**: SQL 쿼리로 테이블 목록 조회 + FK 제약 조건 확인 + updated_at 트리거 테스트

---

### AC-003: RLS 보안 - 비인증 사용자 차단

**Given** RLS가 활성화된 상태에서
**When** 인증되지 않은 사용자(anon key만)가 profiles 테이블을 SELECT하면
**Then** 빈 결과가 반환되어야 한다 (행 접근 차단)

**Given** RLS가 활성화된 상태에서
**When** 인증되지 않은 사용자가 courses 테이블에 INSERT를 시도하면
**Then** 권한 오류가 발생해야 한다

**Given** RLS가 활성화된 상태에서
**When** 인증되지 않은 사용자가 notifications 테이블을 SELECT하면
**Then** 빈 결과가 반환되어야 한다

**검증 방법**: Supabase 클라이언트에서 anon key로 쿼리 실행

---

### AC-004: RLS 보안 - 역할 기반 접근 제어

**Given** 학생(student)으로 인증된 상태에서
**When** 다른 학생의 개인 메모(visibility='personal')를 조회하면
**Then** 해당 메모가 결과에 포함되지 않아야 한다

**Given** 강사(instructor)로 인증된 상태에서
**When** 본인이 만든 강좌의 materials를 조회하면
**Then** 해당 강좌의 모든 자료(draft 포함)가 반환되어야 한다

**Given** 학생(student)으로 인증된 상태에서
**When** 수강 등록하지 않은 강좌의 materials를 조회하면
**Then** 빈 결과가 반환되어야 한다

**Given** 학생(student)으로 인증된 상태에서
**When** 수강 등록된 강좌의 published materials를 조회하면
**Then** published 상태의 자료만 반환되어야 한다

**Given** 강사(instructor)로 인증된 상태에서
**When** 다른 강사의 강좌에 material을 INSERT하면
**Then** 권한 오류가 발생해야 한다

**Given** 팀 멤버(team member)로 인증된 상태에서
**When** 본인이 속한 팀의 팀 메모(visibility='team')를 조회하면
**Then** 팀 메모가 정상적으로 반환되어야 한다

**Given** 팀에 속하지 않은 사용자로 인증된 상태에서
**When** 해당 팀의 팀 메모를 조회하면
**Then** 빈 결과가 반환되어야 한다

**Given** 학생(student)으로 인증된 상태에서
**When** 본인의 quiz_attempts만 조회하면
**Then** 본인 시도만 반환되어야 한다

**Given** 강사(instructor)로 인증된 상태에서
**When** 본인 강좌의 모든 quiz_attempts를 조회하면
**Then** 해당 강좌의 전체 학생 시도가 반환되어야 한다

**검증 방법**: 각 역할별 Supabase 클라이언트로 CRUD 쿼리 실행

---

### AC-005: 시드 데이터

**Given** 마이그레이션이 적용된 상태에서
**When** `supabase db reset` (시드 데이터 포함)을 실행하면
**Then** 다음 데이터가 존재해야 한다:
- auth.users에 3명 (강사 1, 학생 2)
- profiles에 3건
- courses에 2건 (published 1, draft 1)
- course_enrollments에 2건
- materials에 3건 (published 2, draft 1)
- questions에 2건
- answers에 3건
- teams에 1건
- team_members에 2건
- memos에 2건 (personal 1, team 1)
- quizzes에 1건
- quiz_questions에 3건
- quiz_attempts에 1건

**Given** 시드 데이터가 로드된 상태에서
**When** 테스트 강사 계정으로 로그인하면
**Then** 본인이 만든 강좌와 자료가 조회 가능해야 한다

**검증 방법**: SQL COUNT 쿼리로 각 테이블 행 수 확인

---

### AC-006: Supabase 클라이언트 설정

**Given** @supabase/supabase-js와 @supabase/ssr이 설치된 상태에서
**When** `apps/web/lib/supabase/client.ts`를 import하면
**Then** createBrowserClient 함수가 Supabase 클라이언트를 반환해야 한다

**Given** Supabase 환경 변수가 설정된 상태에서
**When** `apps/web/lib/supabase/server.ts`를 import하면
**Then** createServerClient 함수가 서버용 Supabase 클라이언트를 반환해야 한다

**Given** src/env.ts가 업데이트된 상태에서
**When** NEXT_PUBLIC_SUPABASE_URL 또는 NEXT_PUBLIC_SUPABASE_ANON_KEY가 누락되면
**Then** 환경 변수 검증 오류가 발생해야 한다

**Given** .env.example 파일이 업데이트된 상태에서
**When** 파일 내용을 확인하면
**Then** NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY 항목이 포함되어야 한다

**검증 방법**: TypeScript 컴파일 + import 테스트 + 환경 변수 누락 시 에러 확인

---

### AC-007: TypeScript 타입 자동 생성

**Given** 로컬 Supabase가 실행 중이고 마이그레이션이 적용된 상태에서
**When** `pnpm db:types` 스크립트를 실행하면
**Then** `apps/web/types/supabase.ts` 파일이 생성되어야 한다

**Given** supabase.ts 타입 파일이 생성된 상태에서
**When** 파일 내용을 확인하면
**Then** 15개 테이블 모두의 Row, Insert, Update 타입이 포함되어야 한다

**Given** root package.json에 db: 스크립트가 추가된 상태에서
**When** 다음 스크립트들을 실행하면
**Then** 각각 정상 동작해야 한다:
- `pnpm db:start` -> Supabase 로컬 스택 시작
- `pnpm db:stop` -> Supabase 로컬 스택 중지
- `pnpm db:reset` -> 데이터베이스 초기화 (마이그레이션 + 시드)
- `pnpm db:types` -> TypeScript 타입 파일 생성

**검증 방법**: 스크립트 실행 + 생성된 파일 내 테이블 타입 존재 여부 확인

---

### AC-008: Docker 미실행 에러 처리

**Given** Docker가 실행되지 않은 상태에서
**When** `supabase start` 명령을 실행하면
**Then** Docker 실행이 필요하다는 명확한 에러 메시지가 출력되어야 한다

**검증 방법**: Docker 서비스 중지 후 `supabase start` 실행

---

## 2. 품질 게이트

### 2.1 코드 품질

- [ ] TypeScript 컴파일 오류 없음 (`pnpm typecheck` 통과)
- [ ] ESLint 경고/에러 없음 (`pnpm lint` 통과)
- [ ] 모든 SQL 마이그레이션 파일이 순서대로 적용 가능

### 2.2 보안 품질

- [ ] 모든 15개 테이블에 RLS 정책 적용 확인
- [ ] 비인증 사용자가 어떤 테이블에도 접근 불가
- [ ] SUPABASE_SERVICE_ROLE_KEY가 서버 전용 환경 변수로 설정

### 2.3 데이터 무결성

- [ ] 모든 FK 참조 무결성 확인
- [ ] UNIQUE 제약 조건 동작 확인 (course_enrollments, team_members, votes)
- [ ] CHECK 제약 조건 동작 확인 (enum 값 범위)

### 2.4 개발 환경

- [ ] `supabase start` / `supabase stop` 정상 동작
- [ ] `supabase db reset` 마이그레이션 + 시드 데이터 정상 적용
- [ ] `db:types` 타입 파일 생성 정상 동작

## 3. Definition of Done

SPEC-BE-001은 다음 조건이 모두 충족되면 완료로 간주한다:

1. supabase/ 디렉토리가 표준 구조로 생성됨
2. 12개 SQL 마이그레이션 파일이 `supabase db reset`으로 오류 없이 적용됨
3. 15개 테이블이 모두 생성되고 FK/UNIQUE/CHECK 제약 조건이 동작함
4. 모든 테이블에 RLS 정책이 적용되고 기본 보안 테스트 통과
5. seed.sql로 테스트 데이터가 정상 삽입됨
6. Supabase 클라이언트 3개 파일(client.ts, server.ts, middleware.ts)이 작성됨
7. env.ts에 Supabase 환경 변수가 추가되고 검증이 동작함
8. `db:types` 스크립트로 15개 테이블의 TypeScript 타입이 생성됨
9. root package.json에 db: 스크립트가 추가됨
10. TypeScript 컴파일 및 ESLint 검사 통과
