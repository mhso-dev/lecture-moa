---
id: SPEC-BE-001
type: plan
version: "1.0.0"
status: draft
created: "2026-02-20"
updated: "2026-02-20"
author: mhso-dev
---

# SPEC-BE-001 구현 계획: Supabase 초기 설정

## 1. 개요

이 문서는 SPEC-BE-001의 구현 계획을 정의한다. Supabase CLI 초기화부터 DB 스키마 생성, RLS 정책 적용, 시드 데이터, 프론트엔드 클라이언트 설정, TypeScript 타입 자동 생성까지의 전체 과정을 다룬다.

## 2. 기술 사양

### 2.1 핵심 패키지

| 패키지 | 버전 | 용도 |
|--------|------|------|
| @supabase/supabase-js | ^2.49.x | Supabase 클라이언트 (DB, Auth, Realtime, Storage) |
| @supabase/ssr | ^0.6.x | Next.js App Router용 SSR 헬퍼 |
| supabase (CLI) | latest | 로컬 개발, 마이그레이션, 타입 생성 |

### 2.2 기존 패키지 (변경 없음)

| 패키지 | 용도 |
|--------|------|
| @t3-oss/env-nextjs | 환경 변수 타입 안전 검증 |
| zod | 환경 변수 스키마 정의 |

## 3. 구현 단계

### Phase A: Supabase CLI 초기화 [Priority: Critical]

**목표**: supabase/ 디렉토리 구조 생성

**작업 목록**:
- A-1: Supabase CLI 설치 확인 및 `supabase init` 실행
- A-2: config.toml 설정 조정 (포트, 프로젝트 이름 등)
- A-3: .gitignore에 Supabase 관련 항목 추가 (.supabase/, .env.local)

**영향 파일**:
- `supabase/config.toml` (신규)
- `.gitignore` (수정)

**의존성**: 없음

---

### Phase B: 데이터베이스 스키마 마이그레이션 [Priority: Critical]

**목표**: 15개 테이블을 의존성 순서에 맞게 SQL 마이그레이션으로 생성

**작업 목록**:
- B-1: updated_at 자동 갱신 트리거 함수 생성 + profiles 테이블 (00001)
- B-2: courses 테이블 (00002)
- B-3: course_enrollments 테이블 (00003)
- B-4: materials 테이블 (00004)
- B-5: questions, answers, votes 테이블 (00005)
- B-6: teams, team_members 테이블 (00006)
- B-7: memos 테이블 (00007)
- B-8: quizzes, quiz_questions, quiz_attempts, quiz_answers 테이블 (00008)
- B-9: notifications 테이블 (00009)
- B-10: 성능 인덱스 생성 (00010)
- B-11: 각 마이그레이션에 updated_at 트리거 적용

**영향 파일**:
- `supabase/migrations/00001_create_profiles.sql` (신규)
- `supabase/migrations/00002_create_courses.sql` (신규)
- `supabase/migrations/00003_create_enrollments.sql` (신규)
- `supabase/migrations/00004_create_materials.sql` (신규)
- `supabase/migrations/00005_create_qa.sql` (신규)
- `supabase/migrations/00006_create_teams.sql` (신규)
- `supabase/migrations/00007_create_memos.sql` (신규)
- `supabase/migrations/00008_create_quizzes.sql` (신규)
- `supabase/migrations/00009_create_notifications.sql` (신규)
- `supabase/migrations/00010_create_indexes.sql` (신규)

**의존성**: Phase A 완료

**마이그레이션 순서 근거**:
- profiles는 auth.users에 의존 (Supabase Auth가 제공)
- courses는 profiles에 의존 (instructor_id FK)
- course_enrollments는 courses, profiles에 의존
- materials는 courses에 의존
- questions는 materials, courses, profiles에 의존
- answers는 questions, profiles에 의존
- votes는 profiles에 의존
- teams는 courses, profiles에 의존
- team_members는 teams, profiles에 의존
- memos는 profiles, materials, teams에 의존
- quizzes는 courses, profiles, materials에 의존
- quiz_questions는 quizzes에 의존
- quiz_attempts는 quizzes, profiles에 의존
- quiz_answers는 quiz_attempts, quiz_questions에 의존
- notifications는 profiles에 의존

---

### Phase C: RLS 헬퍼 함수 및 정책 [Priority: Critical]

**목표**: 모든 15개 테이블에 대한 행 수준 보안 정책 설정

**작업 목록**:
- C-1: RLS 헬퍼 함수 4개 생성 (get_user_role, is_course_instructor, is_course_enrolled, is_team_member)
- C-2: profiles RLS 정책 (SELECT: all authenticated, UPDATE: own only)
- C-3: courses RLS 정책 (SELECT: published for all, all for instructor; INSERT/UPDATE/DELETE: instructor only)
- C-4: course_enrollments RLS 정책
- C-5: materials RLS 정책 (enrolled or instructor)
- C-6: questions, answers, votes RLS 정책
- C-7: teams, team_members RLS 정책
- C-8: memos RLS 정책 (personal: author only, team: team members)
- C-9: quizzes, quiz_questions, quiz_attempts, quiz_answers RLS 정책
- C-10: notifications RLS 정책 (own only)

**영향 파일**:
- `supabase/migrations/00011_create_rls_helpers.sql` (신규)
- `supabase/migrations/00012_create_rls_policies.sql` (신규)

**의존성**: Phase B 완료

---

### Phase D: 시드 데이터 [Priority: High]

**목표**: 로컬 개발을 위한 테스트 데이터 제공

**작업 목록**:
- D-1: auth.users에 테스트 사용자 3명 생성 (강사 1, 학생 2)
- D-2: profiles 시드 데이터
- D-3: courses, course_enrollments 시드 데이터
- D-4: materials 시드 데이터 (Markdown 샘플 포함)
- D-5: questions, answers 시드 데이터
- D-6: teams, team_members 시드 데이터
- D-7: memos 시드 데이터
- D-8: quizzes, quiz_questions, quiz_attempts 시드 데이터

**영향 파일**:
- `supabase/seed.sql` (신규)

**의존성**: Phase B 완료

---

### Phase E: 프론트엔드 Supabase 클라이언트 설정 [Priority: Critical]

**목표**: Next.js App Router에서 Supabase를 사용할 수 있는 클라이언트 설정

**작업 목록**:
- E-1: @supabase/supabase-js 및 @supabase/ssr 패키지 설치 (apps/web)
- E-2: `lib/supabase/client.ts` 작성 (createBrowserClient 싱글톤)
- E-3: `lib/supabase/server.ts` 작성 (createServerClient - RSC, Route Handler, Server Action)
- E-4: `lib/supabase/middleware.ts` 작성 (updateSession 헬퍼)
- E-5: `src/env.ts` 업데이트 (Supabase 환경 변수 추가)
- E-6: `.env.example` 업데이트 (Supabase 변수 템플릿 추가)

**영향 파일**:
- `apps/web/package.json` (수정)
- `apps/web/lib/supabase/client.ts` (신규 - 기존 디렉토리 구조에 맞게)
- `apps/web/lib/supabase/server.ts` (신규)
- `apps/web/lib/supabase/middleware.ts` (신규)
- `apps/web/src/env.ts` (수정)
- `.env.example` (수정)

**의존성**: Phase A 완료

**참고**: 기존 `apps/web/lib/supabase/` 디렉토리가 structure.md에 정의되어 있으므로 해당 경로를 사용

---

### Phase F: TypeScript 타입 생성 및 스크립트 [Priority: High]

**목표**: Supabase 스키마에서 TypeScript 타입 자동 생성 설정 및 개발 편의 스크립트 추가

**작업 목록**:
- F-1: root package.json에 db: 스크립트 추가
- F-2: `supabase gen types typescript --local` 실행하여 초기 타입 파일 생성
- F-3: `apps/web/types/supabase.ts` 생성 확인

**영향 파일**:
- `package.json` (root, 수정)
- `apps/web/types/supabase.ts` (자동 생성)

**의존성**: Phase B, Phase E 완료

---

### Phase G: 검증 및 테스트 [Priority: High]

**목표**: 전체 설정의 정합성 검증

**작업 목록**:
- G-1: `supabase start` 실행하여 로컬 스택 기동 확인
- G-2: `supabase db reset` 실행하여 마이그레이션 + 시드 데이터 적용 확인
- G-3: 15개 테이블 생성 확인 (SQL 쿼리)
- G-4: RLS 정책 동작 확인 (인증/비인증 사용자 테스트)
- G-5: `db:types` 스크립트 실행하여 타입 파일 생성 확인
- G-6: Supabase 클라이언트 import 및 연결 확인
- G-7: TypeScript 컴파일 오류 없음 확인

**영향 파일**: 없음 (검증만)

**의존성**: Phase A~F 모두 완료

## 4. 마일스톤

| 마일스톤 | Phase | 우선순위 | 산출물 |
|---------|-------|---------|--------|
| Primary Goal | A, B | Critical | supabase/ 초기화 + 15개 테이블 마이그레이션 |
| Secondary Goal | C | Critical | RLS 헬퍼 함수 + 정책 |
| Third Goal | D, E | Critical/High | 시드 데이터 + 클라이언트 설정 |
| Final Goal | F, G | High | 타입 생성 + 검증 |

## 5. 리스크 분석

### 5.1 마이그레이션 순서 오류

**리스크**: FK 참조 테이블이 아직 생성되지 않은 상태에서 마이그레이션 실행 시 실패
**대응**: 마이그레이션 파일에 번호를 부여하여 실행 순서 보장. profiles -> courses -> enrollments 순서 엄수.

### 5.2 Docker 미설치

**리스크**: `supabase start`는 Docker를 필요로 하며, Docker가 없으면 실패
**대응**: 구현 시 Docker 설치 여부를 사전 확인하고, 미설치 시 명확한 에러 메시지 제공

### 5.3 RLS 정책 복잡도

**리스크**: 15개 테이블에 대한 RLS 정책이 복잡하여 누락 또는 과도한 제한 발생 가능
**대응**: 헬퍼 함수로 공통 로직 추출. 각 테이블별 정책을 독립적으로 테스트 가능하도록 구성.

### 5.4 타입 생성 불일치

**리스크**: Supabase CLI 타입 생성 결과와 packages/shared 타입 간 불일치
**대응**: spec.md의 타입 매핑 테이블(5.3절)을 기준으로 검증. 추후 SPEC에서 어댑터 레이어 구현.

### 5.5 기존 NextAuth와의 공존

**리스크**: 기존 env.ts에 NEXTAUTH_SECRET, NEXTAUTH_URL 등이 있어 Supabase 변수 추가 시 충돌 가능
**대응**: 이 SPEC에서는 기존 NextAuth 변수를 유지하면서 Supabase 변수를 추가만 함. NextAuth 교체는 BE-002 범위.

## 6. 파일 영향 분석 요약

### 신규 파일 (약 16개)

| 파일 | 설명 |
|------|------|
| supabase/config.toml | Supabase 로컬 설정 |
| supabase/migrations/00001~00012.sql | DB 마이그레이션 12개 |
| supabase/seed.sql | 시드 데이터 |
| apps/web/lib/supabase/client.ts | 브라우저 클라이언트 |
| apps/web/lib/supabase/server.ts | 서버 클라이언트 |
| apps/web/lib/supabase/middleware.ts | 미들웨어 헬퍼 |
| apps/web/types/supabase.ts | 자동 생성 타입 |

### 수정 파일 (약 4개)

| 파일 | 변경 내용 |
|------|-----------|
| package.json (root) | db: 스크립트 추가 |
| apps/web/package.json | @supabase/supabase-js, @supabase/ssr 추가 |
| apps/web/src/env.ts | Supabase 환경 변수 추가 |
| .env.example | Supabase 환경 변수 템플릿 추가 |
| .gitignore | Supabase 관련 무시 항목 추가 |

## 7. 아키텍처 설계 방향

### 7.1 클라이언트 패턴

```
Browser (CSR)  -> client.ts (createBrowserClient, 싱글톤)
Server (RSC)   -> server.ts (createServerClient, 요청별 인스턴스)
Middleware      -> middleware.ts (updateSession, 세션 갱신)
```

### 7.2 마이그레이션 전략

- 각 도메인별 마이그레이션 파일 분리 (단일 거대 파일 회피)
- 번호 기반 순서 보장 (00001~00012)
- RLS 헬퍼와 정책은 스키마 생성 후 별도 마이그레이션으로 분리

### 7.3 보안 레이어

```
Client -> Supabase (anon key) -> RLS 정책 -> PostgreSQL
              |
              +-> auth.uid() 기반 행 수준 접근 제어
```

## 8. Expert 컨설팅 권장사항

이 SPEC은 백엔드 인프라 설정을 포함하므로 다음 전문가 컨설팅을 권장한다:

- **expert-backend**: DB 스키마 설계 검토, RLS 정책 검증, 인덱스 전략 최적화
- **expert-security**: RLS 정책 보안 감사, 인증 흐름 검증
