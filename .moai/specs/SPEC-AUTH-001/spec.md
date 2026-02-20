---
id: SPEC-AUTH-001
version: "1.0.0"
status: approved
created: "2026-02-20"
updated: "2026-02-20"
author: mhso-dev
priority: P0
tags: auth, supabase, migration, next-auth, ssr
dependencies:
  - SPEC-BE-001
---

## HISTORY

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-02-20 | mhso-dev | Initial SPEC creation |

---

# SPEC-AUTH-001: NextAuth에서 Supabase Auth로 인증 시스템 전환

## 1. Overview

**Title**: 인증 시스템 마이그레이션 (NextAuth v5 -> Supabase Auth)

**Description**: 현재 NextAuth v5 (beta 25) 기반의 인증 시스템을 Supabase Auth + @supabase/ssr 기반으로 완전히 전환한다. 이 전환을 통해 인증, 데이터베이스, 실시간 기능이 단일 Supabase 플랫폼으로 통합되어 아키텍처가 단순화되고, RLS(Row Level Security) 정책과 인증이 자연스럽게 연동된다.

**Scope**: apps/web 패키지 내 인증 관련 모든 파일의 전환 및 next-auth 의존성 완전 제거

## 2. Background

### 2.1 전환 배경

현재 lecture-moa 프로젝트는 NextAuth v5 (beta 25)를 사용하여 인증을 처리하고 있다. 그러나 SPEC-BE-001의 완료로 Supabase 인프라(PostgreSQL 16, RLS 정책 15개 테이블, profiles 테이블)가 이미 구축되어 있어, 이중 인증 레이어가 존재하는 상태이다.

### 2.2 현재 상태

- **인증 라이브러리**: NextAuth v5 (beta 25) - JWT 기반 세션 전략
- **세션 관리**: NextAuth의 JWT 토큰 + SessionProvider 폴링
- **API 인증**: module-level auth token 주입 방식 (Bearer 토큰)
- **미들웨어**: NextAuth의 auth() 래퍼를 통한 경로 보호
- **소셜 로그인**: Google, GitHub 프로바이더 (조건부 로딩)
- **상태 관리**: Zustand auth store + NextAuth SessionProvider 동기화

### 2.3 전환 이점

- **아키텍처 단순화**: 인증, DB, 실시간 기능이 단일 Supabase 플랫폼으로 통합
- **RLS 자동 연동**: Supabase Auth 세션이 RLS 정책과 자동으로 연결
- **쿠키 기반 세션**: @supabase/ssr의 쿠키 기반 세션 관리로 서버 컴포넌트 호환성 향상
- **베타 의존성 제거**: NextAuth v5 beta 의존성을 안정적인 Supabase Auth로 대체
- **Edge Function 연동**: Supabase Edge Function에서 동일한 인증 체계 사용 가능

## 3. Requirements

### 3.1 Ubiquitous Requirements (항상 적용)

- REQ-U01: 시스템은 **항상** Supabase Auth를 유일한 인증 제공자로 사용해야 한다.
- REQ-U02: 시스템은 **항상** @supabase/ssr 패키지를 통해 쿠키 기반 세션을 관리해야 한다.
- REQ-U03: 시스템은 next-auth 패키지에 의존**하지 않아야 한다** (패키지 완전 제거).
- REQ-U04: 시스템은 **항상** Supabase의 getUser()를 통해 서버 측 인증 상태를 검증해야 한다 (getSession() 사용 금지).
- REQ-U05: 시스템은 **항상** 역할 기반 접근 제어(RBAC)를 Supabase 사용자 메타데이터의 role 필드를 통해 적용해야 한다.

### 3.2 Event-Driven Requirements (이벤트 기반)

- REQ-E01: **WHEN** 사용자가 이메일/비밀번호로 로그인을 요청하면 **THEN** 시스템은 supabase.auth.signInWithPassword()를 호출하여 인증하고, 성공 시 대시보드로 리다이렉트해야 한다.
- REQ-E02: **WHEN** 사용자가 회원가입을 요청하면 **THEN** 시스템은 supabase.auth.signUp()을 호출하여 계정을 생성하고, Supabase trigger를 통해 profiles 테이블에 자동으로 프로필이 생성되어야 한다.
- REQ-E03: **WHEN** 사용자가 Google 또는 GitHub로 소셜 로그인을 요청하면 **THEN** 시스템은 supabase.auth.signInWithOAuth()를 호출하여 OAuth 플로우를 시작해야 한다.
- REQ-E04: **WHEN** 사용자가 로그아웃을 요청하면 **THEN** 시스템은 supabase.auth.signOut()을 호출하고, Zustand store를 초기화하며, TanStack Query 캐시를 클리어하고, 홈 페이지로 리다이렉트해야 한다.
- REQ-E05: **WHEN** 미들웨어에서 HTTP 요청이 수신되면 **THEN** 시스템은 updateSession() 헬퍼를 통해 Supabase 세션 쿠키를 갱신해야 한다.
- REQ-E06: **WHEN** OAuth 콜백 URL로 리다이렉트되면 **THEN** 시스템은 /auth/callback 라우트 핸들러에서 code를 세션으로 교환해야 한다.

### 3.3 State-Driven Requirements (상태 기반)

- REQ-S01: **IF** 사용자가 인증된 상태이면 **THEN** API 클라이언트는 Supabase 세션의 access_token을 자동으로 요청 헤더에 포함해야 한다.
- REQ-S02: **IF** 사용자가 인증된 상태에서 로그인/회원가입 페이지에 접근하면 **THEN** 시스템은 대시보드로 리다이렉트해야 한다.
- REQ-S03: **IF** 사용자 역할이 'student'인 상태에서 강사 전용 경로에 접근하면 **THEN** 시스템은 대시보드로 리다이렉트해야 한다.
- REQ-S04: **IF** Supabase Auth의 onAuthStateChange 이벤트가 발생하면 **THEN** AuthProvider는 Zustand store와 API 클라이언트 토큰을 즉시 동기화해야 한다.

### 3.4 Unwanted Behavior Requirements (원치 않는 동작 방지)

- REQ-N01: 시스템은 만료된 세션 토큰으로 보호된 API를 호출**하지 않아야 한다** - 미들웨어에서 세션 갱신이 실패하면 로그인 페이지로 리다이렉트해야 한다.
- REQ-N02: 시스템은 인증 실패 시 구체적인 오류 메시지 없이 실패**하지 않아야 한다** - 사용자에게 "이메일 또는 비밀번호가 올바르지 않습니다" 등의 명확한 메시지를 표시해야 한다.
- REQ-N03: 시스템은 next-auth/react의 useSession, signIn, signOut을 코드 어디에서도 import**하지 않아야 한다**.
- REQ-N04: 시스템은 NEXTAUTH_SECRET, NEXTAUTH_URL 등 NextAuth 관련 환경 변수를 참조**하지 않아야 한다**.

### 3.5 Optional/Complex Requirements (선택/복합)

- REQ-O01: **가능하면** 비밀번호 재설정 기능을 supabase.auth.resetPasswordForEmail()을 통해 제공한다.
- REQ-O02: **IF** 인증된 상태 **AND WHEN** 세션 토큰이 만료에 근접하면 **THEN** @supabase/ssr의 미들웨어가 자동으로 세션을 갱신해야 한다.
- REQ-O03: **가능하면** 이메일 확인(Email Confirmation) 기능을 Supabase Auth의 이메일 확인 플로우를 통해 제공한다.

## 4. Technical Constraints

### 4.1 프레임워크 제약

- Next.js 15 App Router 환경에서 동작해야 한다
- Server Component, Route Handler, Server Action, Middleware 모두에서 Supabase Auth가 작동해야 한다
- @supabase/ssr의 쿠키 기반 세션 관리 패턴을 따라야 한다

### 4.2 데이터베이스 제약

- SPEC-BE-001에서 생성된 기존 15개 테이블의 RLS 정책과 호환되어야 한다
- auth.users와 public.profiles 테이블 간의 FK 관계가 유지되어야 한다
- 기존 profiles 테이블의 role 컬럼을 user_metadata.role로 활용해야 한다

### 4.3 마이그레이션 제약

- 점진적 마이그레이션이 불가능하다 (NextAuth와 Supabase Auth의 병행 사용 불가)
- All-or-nothing 방식으로 한 번에 전환해야 한다
- 전환 완료 후 next-auth 패키지가 완전히 제거되어야 한다

### 4.4 기존 인프라

- Supabase 클라이언트 파일이 이미 존재: lib/supabase/client.ts, server.ts, middleware.ts
- @supabase/supabase-js (^2.97.0) 및 @supabase/ssr (^0.8.0)이 이미 설치됨
- Supabase 프로젝트에 Google, GitHub OAuth 프로바이더 설정이 필요함

## 5. Dependencies

| SPEC ID | Description | Status | Relationship |
|---------|-------------|--------|-------------|
| SPEC-BE-001 | Supabase Initial Setup | Completed | 선행 의존 - RLS 정책, profiles 테이블, auth.users 연동 |
| SPEC-FE-001 | Next.js Frontend Foundation | Completed | 연관 - 프론트엔드 기본 구조 |

## 6. Out of Scope

- 백엔드 API 서버(apps/api) 인증 변경 (해당 SPEC은 apps/web만 대상)
- Supabase Dashboard에서의 OAuth 프로바이더 설정 (인프라 설정은 별도)
- 사용자 데이터 마이그레이션 (기존 사용자가 없는 개발 단계)
- 이메일 템플릿 커스터마이징
- MFA(Multi-Factor Authentication) 구현
- apps/ai (FastAPI) 서비스의 인증 변경

## 7. Traceability

- [SPEC-AUTH-001] -> [SPEC-BE-001] (Supabase 인프라 의존)
- [SPEC-AUTH-001] -> plan.md (구현 계획)
- [SPEC-AUTH-001] -> acceptance.md (인수 기준)
