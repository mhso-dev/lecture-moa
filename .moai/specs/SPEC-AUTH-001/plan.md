---
id: SPEC-AUTH-001
type: plan
version: "1.0.0"
created: "2026-02-20"
updated: "2026-02-20"
author: mhso-dev
---

# SPEC-AUTH-001: 구현 계획

## 1. 개요

NextAuth v5에서 Supabase Auth로의 인증 시스템 전면 전환 구현 계획이다.
점진적 마이그레이션이 불가능하므로 all-or-nothing 방식으로 한 번에 전환한다.

## 2. 마일스톤

### Primary Goal (핵심 목표)

| Task | Description | Priority |
|------|-------------|----------|
| T1 | Middleware 전환 | Priority High |
| T2 | Auth Core 전환 | Priority High |
| T3 | Auth Hooks/API Client 전환 | Priority High |

### Secondary Goal (부차 목표)

| Task | Description | Priority |
|------|-------------|----------|
| T4 | Auth UI 컴포넌트 전환 | Priority High |
| T5 | useSession 마이그레이션 | Priority Medium |

### Final Goal (최종 목표)

| Task | Description | Priority |
|------|-------------|----------|
| T6 | Cleanup 및 검증 | Priority High |

## 3. Task 상세

### T1: Middleware 전환

**목표**: NextAuth의 auth() 래퍼를 Supabase Auth의 updateSession() + 커스텀 경로 보호 로직으로 교체

**대상 파일**:
- `apps/web/middleware.ts` (수정)

**구현 방향**:
1. NextAuth의 `auth()` 래퍼 import를 제거
2. 기존 `lib/supabase/middleware.ts`의 `updateSession()` 헬퍼를 호출하여 세션 쿠키 갱신
3. `supabase.auth.getUser()`로 인증 상태 확인 (getSession() 사용 금지)
4. 기존 경로 보호 로직(PROTECTED_PREFIXES, AUTH_ROUTES, INSTRUCTOR_ONLY_PREFIXES, STUDENT_ONLY_PREFIXES) 유지
5. 인증되지 않은 사용자의 보호 경로 접근 시 `/login`으로 리다이렉트
6. 역할 기반 접근 제어 로직 유지 (사용자 메타데이터의 role 필드 활용)

**기술 결정**:
- 미들웨어에서 `createServerClient`를 사용하여 요청/응답 쿠키를 직접 관리
- `getUser()` 호출로 서버 측 세션 검증 (보안상 `getSession()` 대신 사용)
- updateSession() 호출 후 반환된 response에 경로 보호 로직 추가

**관련 요구사항**: REQ-U01, REQ-U02, REQ-U04, REQ-E05, REQ-S02, REQ-S03, REQ-N01

---

### T2: Auth Core 전환

**목표**: NextAuth 설정, AuthProvider, Auth Store를 Supabase Auth 기반으로 교체

**대상 파일**:
- `apps/web/lib/auth.ts` (전면 재작성)
- `apps/web/providers/AuthProvider.tsx` (전면 재작성)
- `apps/web/stores/auth.store.ts` (수정)

**구현 방향**:

**lib/auth.ts 재작성**:
1. NextAuth 설정을 모두 제거
2. Supabase Auth 헬퍼 함수들로 교체:
   - `getUser()`: Server Component/Route Handler에서 현재 사용자 조회
   - `getSession()`: 세션 토큰 조회 (API 호출용)
   - `signInWithPassword()`: 이메일/비밀번호 로그인
   - `signInWithOAuth()`: 소셜 로그인
   - `signUp()`: 회원가입
   - `signOut()`: 로그아웃
3. 서버 측 인증 유틸리티 함수 제공

**AuthProvider.tsx 재작성**:
1. NextAuth의 `SessionProvider`와 `useSession`을 모두 제거
2. Supabase의 `onAuthStateChange` 리스너를 사용하여 인증 상태 변경 감지
3. 인증 상태 변경 시 Zustand store와 API 클라이언트 토큰을 자동 동기화
4. Browser Client를 생성하여 클라이언트 측 인증 상태 관리

**auth.store.ts 수정**:
1. 기본 구조 유지 (Zustand + devtools + persist)
2. NextAuth 관련 주석 및 참조 제거
3. Supabase 세션 기반 상태 관리로 주석 업데이트
4. persist partialize 로직 유지 (보안상 민감 데이터 미저장)

**관련 요구사항**: REQ-U01, REQ-U02, REQ-U05, REQ-E01, REQ-E02, REQ-E03, REQ-E04, REQ-S04

---

### T3: Auth Hooks/API Client 전환

**목표**: useAuth, useCurrentUser 훅과 API 클라이언트의 인증 토큰 관리를 Supabase 기반으로 전환

**대상 파일**:
- `apps/web/hooks/useAuth.ts` (전면 재작성)
- `apps/web/hooks/useCurrentUser.ts` (수정)
- `apps/web/lib/api/index.ts` (수정)

**구현 방향**:

**useAuth.ts 재작성**:
1. `next-auth/react`의 `signIn`, `signOut` import 제거
2. Supabase Browser Client를 사용한 인증 액션 구현:
   - `signIn`: `supabase.auth.signInWithPassword()` 호출
   - `signInWithOAuth`: `supabase.auth.signInWithOAuth()` 호출
   - `signOut`: `supabase.auth.signOut()` + store 초기화 + query cache 클리어
   - `signUp`: `supabase.auth.signUp()` 호출
3. Zustand store에서 user, isAuthenticated, isLoading, role 읽기 유지

**useCurrentUser.ts 수정**:
1. Supabase의 `getUser()`를 사용하여 현재 사용자 프로필 조회
2. profiles 테이블에서 사용자 정보를 가져오도록 변경
3. 401 에러 시 자동 로그아웃 로직 유지

**api/index.ts 수정**:
1. module-level `_authToken` 관리 방식을 유지하되, Supabase 세션의 access_token을 사용
2. `setApiAuthToken` 함수는 AuthProvider의 onAuthStateChange에서 호출
3. Supabase 클라이언트가 직접 처리하는 API 호출과 외부 API(apps/ai 등) 호출을 구분

**관련 요구사항**: REQ-E01, REQ-E04, REQ-S01, REQ-N02, REQ-N03

---

### T4: Auth UI 컴포넌트 전환

**목표**: 로그인, 회원가입, 소셜 로그인 UI 컴포넌트를 Supabase Auth 호출로 전환

**대상 파일**:
- `apps/web/components/auth/LoginForm.tsx` (수정)
- `apps/web/components/auth/RegisterForm.tsx` (수정)
- `apps/web/components/auth/SocialLoginButtons.tsx` (수정)

**구현 방향**:

**LoginForm.tsx**:
1. `useAuth().signIn()` 호출을 유지하되, 내부 구현이 Supabase로 변경됨
2. 에러 처리를 Supabase Auth의 에러 코드 기반으로 업데이트
3. 로그인 성공 후 `router.push('/dashboard')` 또는 callbackUrl로 리다이렉트

**RegisterForm.tsx**:
1. `useAuth().signUp()` 호출로 변경
2. Supabase Auth의 회원가입 응답 처리 (이메일 확인 필요 여부 등)
3. 회원가입 시 user_metadata에 name, role 포함

**SocialLoginButtons.tsx**:
1. `useAuth().signInWithOAuth()` 호출로 변경
2. OAuth 리다이렉트 URL을 `/auth/callback`으로 설정
3. Google, GitHub 프로바이더 지원

**신규 파일**:
- `apps/web/app/auth/callback/route.ts` (OAuth 콜백 핸들러)

**관련 요구사항**: REQ-E01, REQ-E02, REQ-E03, REQ-E06, REQ-N02

---

### T5: useSession 마이그레이션

**목표**: next-auth/react의 useSession을 사용하는 모든 컴포넌트를 Supabase Auth 기반으로 전환

**대상 파일 (8+ 컴포넌트)**:
- `next-auth/react`에서 `useSession`을 import하는 모든 대시보드/코스 컴포넌트
- 정확한 파일 목록은 구현 시 `grep`으로 확인

**구현 방향**:
1. `useSession()` 호출을 `useAuth()` 또는 `useAuthStore()`로 교체
2. `session?.user` 접근을 `user` (from useAuth/useAuthStore)로 변경
3. `status === "authenticated"` 체크를 `isAuthenticated`로 변경
4. `status === "loading"` 체크를 `isLoading`으로 변경

**관련 요구사항**: REQ-N03, REQ-S04

---

### T6: Cleanup 및 검증

**목표**: NextAuth 관련 모든 코드와 의존성을 완전히 제거하고 빌드 검증

**대상 파일**:
- `apps/web/app/api/auth/[...nextauth]/route.ts` (삭제)
- `apps/web/package.json` (next-auth 의존성 제거)
- `apps/web/src/env.ts` (NEXTAUTH_* 환경 변수 제거)
- `.env`, `.env.local` 등 환경 파일 (NEXTAUTH_* 변수 제거)

**구현 방향**:
1. NextAuth API 라우트 파일 삭제
2. `pnpm remove next-auth` 실행
3. env.ts에서 NEXTAUTH_SECRET, NEXTAUTH_URL 스키마 제거
4. 환경 파일에서 NEXTAUTH_* 변수 제거
5. `pnpm build` 실행하여 빌드 성공 확인
6. `grep -r "next-auth" apps/web/` 실행하여 잔존 참조 없음 확인
7. `grep -r "NEXTAUTH" apps/web/` 실행하여 환경 변수 잔존 확인

**관련 요구사항**: REQ-U03, REQ-N03, REQ-N04

## 4. 기술 결정

### 4.1 세션 관리 패턴

**결정**: @supabase/ssr의 쿠키 기반 세션 관리 사용

**근거**:
- Next.js App Router의 Server Component, Route Handler, Middleware 모두에서 동작
- 자동 세션 갱신 (미들웨어에서 updateSession() 호출)
- PKCE 플로우를 통한 안전한 OAuth 토큰 교환

### 4.2 인증 상태 동기화

**결정**: onAuthStateChange + Zustand store 동기화

**근거**:
- Supabase의 onAuthStateChange는 로그인, 로그아웃, 토큰 갱신 등 모든 인증 이벤트를 감지
- 기존 Zustand store 구조를 유지하여 컴포넌트 변경 최소화
- NextAuth의 SessionProvider 폴링보다 이벤트 기반으로 더 효율적

### 4.3 서버 측 인증 검증

**결정**: getUser()를 통한 서버 측 검증 (getSession() 금지)

**근거**:
- Supabase 공식 문서 권장사항: getUser()는 매번 Auth 서버에 요청하여 토큰을 재검증
- getSession()은 로컬 JWT만 확인하므로 토큰 무효화를 감지하지 못함
- 미들웨어와 서버 컴포넌트 모두에서 getUser() 사용 통일

### 4.4 OAuth 콜백 처리

**결정**: /auth/callback Route Handler에서 code-to-session 교환

**근거**:
- Supabase OAuth는 인증 후 code 파라미터와 함께 콜백 URL로 리다이렉트
- Route Handler에서 서버 측 Supabase 클라이언트로 code를 세션으로 교환
- 클라이언트 측 노출 없이 안전한 토큰 교환 가능

## 5. 파일 영향 분석

### 수정 대상 파일 (~15개)

| File | Action | Impact |
|------|--------|--------|
| `apps/web/middleware.ts` | Rewrite | High - 경로 보호 로직 전면 변경 |
| `apps/web/lib/auth.ts` | Rewrite | High - NextAuth 설정 완전 제거, Supabase 헬퍼로 교체 |
| `apps/web/providers/AuthProvider.tsx` | Rewrite | High - SessionProvider를 onAuthStateChange로 교체 |
| `apps/web/stores/auth.store.ts` | Modify | Low - 주석 및 참조 업데이트 |
| `apps/web/hooks/useAuth.ts` | Rewrite | High - Supabase Auth 액션으로 전면 교체 |
| `apps/web/hooks/useCurrentUser.ts` | Modify | Medium - Supabase 프로필 조회로 변경 |
| `apps/web/lib/api/index.ts` | Modify | Medium - 토큰 소스 변경 |
| `apps/web/components/auth/LoginForm.tsx` | Modify | Medium - 에러 처리 업데이트 |
| `apps/web/components/auth/RegisterForm.tsx` | Modify | Medium - signUp 호출 변경 |
| `apps/web/components/auth/SocialLoginButtons.tsx` | Modify | Medium - OAuth 호출 변경 |
| `apps/web/src/env.ts` | Modify | Low - NEXTAUTH_* 변수 제거 |
| `apps/web/package.json` | Modify | Low - next-auth 의존성 제거 |
| 8+ dashboard/course components | Modify | Low - useSession -> useAuth/useAuthStore |

### 신규 파일 (~1개)

| File | Purpose |
|------|---------|
| `apps/web/app/auth/callback/route.ts` | OAuth 콜백 처리 Route Handler |

### 삭제 대상 파일 (~1개)

| File | Reason |
|------|--------|
| `apps/web/app/api/auth/[...nextauth]/route.ts` | NextAuth API 라우트 불필요 |

## 6. 리스크 분석

### Risk 1: 세션 무효화 시점 차이

- **설명**: NextAuth의 JWT 기반 세션에서 Supabase의 쿠키 기반 세션으로 전환 시, 세션 갱신 타이밍이 달라질 수 있다
- **영향**: Medium
- **대응**: 미들웨어에서 모든 요청에 대해 updateSession()을 호출하여 세션 갱신을 보장

### Risk 2: 소셜 로그인 재설정

- **설명**: Google, GitHub OAuth는 Supabase Dashboard에서 별도로 프로바이더를 설정해야 한다
- **영향**: Medium
- **대응**: Supabase Dashboard에서 OAuth 프로바이더 설정 확인 후 구현 시작, 콜백 URL을 /auth/callback으로 통일

### Risk 3: 역할(Role) 데이터 소스 변경

- **설명**: NextAuth에서는 JWT token.role로 역할을 관리했으나, Supabase에서는 user_metadata.role 또는 profiles.role을 사용해야 한다
- **영향**: High
- **대응**: 회원가입 시 user_metadata에 role을 설정하고, Supabase trigger로 profiles.role과 자동 동기화

### Risk 4: 기존 컴포넌트 누락

- **설명**: useSession()을 사용하는 컴포넌트를 빠짐없이 찾아 전환해야 한다
- **영향**: Medium
- **대응**: T6에서 `grep -r "next-auth" apps/web/` 실행하여 잔존 참조 확인

## 7. 마이그레이션 전략

이 전환은 **all-or-nothing** 방식으로 수행한다. 이유는 다음과 같다:

1. NextAuth의 `auth()` 미들웨어 래퍼와 Supabase의 `updateSession()` 미들웨어를 동시에 사용할 수 없다
2. `SessionProvider`와 Supabase `onAuthStateChange`가 충돌할 수 있다
3. JWT 기반 세션(NextAuth)과 쿠키 기반 세션(Supabase)은 메커니즘이 다르다

따라서 하나의 feature branch에서 모든 변경을 수행하고, 전체 빌드 및 테스트 통과 후 머지한다.

## 8. Traceability

- [SPEC-AUTH-001] spec.md의 모든 요구사항이 Task에 매핑됨
- T1: REQ-U01, REQ-U02, REQ-U04, REQ-E05, REQ-S02, REQ-S03, REQ-N01
- T2: REQ-U01, REQ-U02, REQ-U05, REQ-E01~E04, REQ-S04
- T3: REQ-E01, REQ-E04, REQ-S01, REQ-N02, REQ-N03
- T4: REQ-E01~E03, REQ-E06, REQ-N02
- T5: REQ-N03, REQ-S04
- T6: REQ-U03, REQ-N03, REQ-N04
