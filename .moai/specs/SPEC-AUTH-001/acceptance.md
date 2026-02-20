---
id: SPEC-AUTH-001
type: acceptance
version: "1.0.0"
created: "2026-02-20"
updated: "2026-02-20"
author: mhso-dev
---

# SPEC-AUTH-001: 인수 기준

## 1. 기능 테스트 시나리오

### AC-01: 이메일/비밀번호 로그인 성공

**관련 요구사항**: REQ-E01, REQ-S04

```gherkin
Given 유효한 이메일과 비밀번호를 가진 등록된 사용자가 존재한다
When 사용자가 로그인 폼에 이메일과 비밀번호를 입력하고 로그인 버튼을 클릭한다
Then supabase.auth.signInWithPassword()가 성공적으로 호출된다
And Supabase 세션 쿠키가 브라우저에 설정된다
And Zustand auth store에 사용자 정보가 동기화된다
And API 클라이언트에 access_token이 설정된다
And 사용자가 /dashboard로 리다이렉트된다
```

### AC-02: 이메일/비밀번호 로그인 실패

**관련 요구사항**: REQ-N02

```gherkin
Given 잘못된 비밀번호를 입력한 사용자가 로그인을 시도한다
When 사용자가 로그인 폼을 제출한다
Then supabase.auth.signInWithPassword()가 에러를 반환한다
And 사용자에게 "이메일 또는 비밀번호가 올바르지 않습니다" 메시지가 표시된다
And 사용자가 로그인 페이지에 머문다
And Zustand auth store에 사용자 정보가 설정되지 않는다
```

### AC-03: 미인증 사용자의 보호 경로 접근

**관련 요구사항**: REQ-N01, REQ-E05

```gherkin
Given 인증되지 않은 사용자가 있다 (Supabase 세션 없음)
When 사용자가 /dashboard, /courses, /materials 등 보호된 경로에 접근한다
Then 미들웨어에서 supabase.auth.getUser()가 null을 반환한다
And 사용자가 /login?callbackUrl={원래경로}로 리다이렉트된다
```

### AC-04: 역할 기반 접근 제어 (학생이 강사 전용 경로 접근)

**관련 요구사항**: REQ-S03, REQ-U05

```gherkin
Given role이 'student'인 인증된 사용자가 있다
When 사용자가 /courses/create, /materials/upload 등 강사 전용 경로에 접근한다
Then 미들웨어에서 사용자의 user_metadata.role이 'student'임을 확인한다
And 사용자가 /dashboard로 리다이렉트된다
```

### AC-05: 역할 기반 접근 제어 (강사가 학생 전용 경로 접근)

**관련 요구사항**: REQ-S03

```gherkin
Given role이 'instructor'인 인증된 사용자가 있다
When 사용자가 /quizzes/taking 등 학생 전용 경로에 접근한다
Then 사용자가 /dashboard로 리다이렉트된다
```

### AC-06: 세션 자동 갱신

**관련 요구사항**: REQ-O02, REQ-E05

```gherkin
Given 인증된 사용자의 세션 토큰이 만료에 근접한 상태이다
When 사용자가 보호된 페이지에 HTTP 요청을 보낸다
Then 미들웨어의 updateSession() 헬퍼가 세션 쿠키를 자동으로 갱신한다
And 갱신된 쿠키가 응답에 포함되어 브라우저에 저장된다
And 사용자는 중단 없이 서비스를 계속 이용할 수 있다
```

### AC-07: next-auth 완전 제거 확인

**관련 요구사항**: REQ-U03, REQ-N03, REQ-N04

```gherkin
Given 모든 인증 마이그레이션 작업이 완료되었다
When 프로젝트에서 다음 검증을 수행한다
Then `grep -r "next-auth" apps/web/src apps/web/app apps/web/components apps/web/hooks apps/web/lib apps/web/providers apps/web/stores` 결과가 비어 있다
And `grep -r "NEXTAUTH" apps/web/` 결과가 비어 있다
And apps/web/package.json에 "next-auth" 의존성이 없다
And apps/web/app/api/auth/[...nextauth]/ 디렉토리가 존재하지 않는다
And `pnpm build` 명령이 에러 없이 성공한다
```

### AC-08: 소셜 로그인 (Google)

**관련 요구사항**: REQ-E03, REQ-E06

```gherkin
Given Supabase 프로젝트에 Google OAuth 프로바이더가 설정되어 있다
When 사용자가 "Google로 로그인" 버튼을 클릭한다
Then supabase.auth.signInWithOAuth({ provider: 'google' })가 호출된다
And 사용자가 Google 인증 페이지로 리다이렉트된다
And Google 인증 완료 후 /auth/callback으로 리다이렉트된다
And /auth/callback Route Handler에서 code를 세션으로 교환한다
And 사용자가 /dashboard로 리다이렉트된다
And Zustand auth store에 사용자 정보가 동기화된다
```

### AC-09: 소셜 로그인 (GitHub)

**관련 요구사항**: REQ-E03, REQ-E06

```gherkin
Given Supabase 프로젝트에 GitHub OAuth 프로바이더가 설정되어 있다
When 사용자가 "GitHub로 로그인" 버튼을 클릭한다
Then supabase.auth.signInWithOAuth({ provider: 'github' })가 호출된다
And 사용자가 GitHub 인증 페이지로 리다이렉트된다
And GitHub 인증 완료 후 /auth/callback으로 리다이렉트된다
And /auth/callback Route Handler에서 code를 세션으로 교환한다
And 사용자가 /dashboard로 리다이렉트된다
```

### AC-10: 로그아웃 후 세션 정리

**관련 요구사항**: REQ-E04

```gherkin
Given 인증된 사용자가 서비스를 이용 중이다
When 사용자가 로그아웃 버튼을 클릭한다
Then supabase.auth.signOut()가 호출된다
And Supabase 세션 쿠키가 브라우저에서 제거된다
And Zustand auth store가 초기 상태로 리셋된다 (user: null, isAuthenticated: false)
And TanStack Query 캐시가 클리어된다
And API 클라이언트의 auth token이 null로 설정된다
And 사용자가 / (홈 페이지)로 리다이렉트된다
```

### AC-11: 회원가입 및 프로필 생성

**관련 요구사항**: REQ-E02, REQ-U05

```gherkin
Given 새로운 사용자가 회원가입 폼을 작성한다
When 사용자가 이메일, 비밀번호, 이름, 역할(student/instructor)을 입력하고 가입 버튼을 클릭한다
Then supabase.auth.signUp()이 user_metadata에 { name, role }을 포함하여 호출된다
And auth.users 테이블에 새 사용자가 생성된다
And Supabase trigger를 통해 profiles 테이블에 프로필이 자동 생성된다
And 사용자에게 가입 성공 메시지가 표시된다
```

### AC-12: 인증된 사용자의 로그인 페이지 접근

**관련 요구사항**: REQ-S02

```gherkin
Given 이미 인증된 사용자가 있다
When 사용자가 /login 또는 /register 페이지에 접근한다
Then 미들웨어에서 사용자가 인증된 상태임을 확인한다
And 사용자가 /dashboard로 리다이렉트된다
```

### AC-13: onAuthStateChange 동기화

**관련 요구사항**: REQ-S04

```gherkin
Given AuthProvider가 마운트되어 onAuthStateChange 리스너가 활성 상태이다
When Supabase Auth에서 SIGNED_IN 이벤트가 발생한다
Then Zustand auth store의 user 필드가 세션 사용자 정보로 업데이트된다
And Zustand auth store의 isAuthenticated가 true로 설정된다
And API 클라이언트의 auth token이 세션의 access_token으로 설정된다

When Supabase Auth에서 SIGNED_OUT 이벤트가 발생한다
Then Zustand auth store가 초기 상태로 리셋된다
And API 클라이언트의 auth token이 null로 설정된다

When Supabase Auth에서 TOKEN_REFRESHED 이벤트가 발생한다
Then API 클라이언트의 auth token이 새로운 access_token으로 업데이트된다
```

## 2. 성능 기준

| Metric | Target | Measurement |
|--------|--------|-------------|
| 로그인 응답 시간 | < 2초 | signInWithPassword() 호출부터 리다이렉트까지 |
| 회원가입 응답 시간 | < 2초 | signUp() 호출부터 완료 메시지까지 |
| 미들웨어 세션 검증 | < 200ms | updateSession() + getUser() 처리 시간 |
| OAuth 콜백 처리 | < 1초 | code 교환 및 리다이렉트 시간 |
| 로그아웃 처리 | < 1초 | signOut() 호출부터 홈 리다이렉트까지 |

## 3. Quality Gate 기준

### 3.1 테스트 커버리지

| Area | Target | Files |
|------|--------|-------|
| Auth Core | 85%+ | lib/auth.ts, providers/AuthProvider.tsx |
| Auth Hooks | 85%+ | hooks/useAuth.ts, hooks/useCurrentUser.ts |
| Middleware | 85%+ | middleware.ts |
| Auth Components | 80%+ | components/auth/*.tsx |

### 3.2 빌드 검증

- `pnpm build` 성공 (zero errors)
- `pnpm lint` 성공 (zero errors)
- TypeScript strict mode 컴파일 성공
- next-auth import 잔존 없음

### 3.3 보안 검증

- 서버 측 인증 검증에 getUser() 사용 (getSession() 미사용)
- 민감한 데이터가 클라이언트 Zustand store에 persist되지 않음
- OAuth 콜백에서 PKCE 플로우 사용
- 세션 쿠키에 httpOnly, secure, sameSite 속성 설정 (Supabase 기본)

## 4. Definition of Done

- [ ] 모든 AC (AC-01 ~ AC-13) 시나리오가 수동 또는 자동 테스트로 검증됨
- [ ] next-auth 패키지가 package.json에서 완전히 제거됨
- [ ] `grep -r "next-auth"` 결과가 빈 값 (SPEC 문서 및 CHANGELOG 제외)
- [ ] `grep -r "NEXTAUTH"` 결과가 빈 값
- [ ] `pnpm build` 성공
- [ ] `pnpm lint` 성공
- [ ] 성능 기준 충족 (모든 인증 작업 < 2초)
- [ ] 테스트 커버리지 85%+ (Auth Core, Auth Hooks, Middleware)
- [ ] 코드 리뷰 완료
- [ ] SPEC-AUTH-001 status를 "completed"로 업데이트

## 5. Traceability

| Acceptance Criteria | Requirements |
|--------------------|--------------|
| AC-01 | REQ-E01, REQ-S04 |
| AC-02 | REQ-N02 |
| AC-03 | REQ-N01, REQ-E05 |
| AC-04 | REQ-S03, REQ-U05 |
| AC-05 | REQ-S03 |
| AC-06 | REQ-O02, REQ-E05 |
| AC-07 | REQ-U03, REQ-N03, REQ-N04 |
| AC-08 | REQ-E03, REQ-E06 |
| AC-09 | REQ-E03, REQ-E06 |
| AC-10 | REQ-E04 |
| AC-11 | REQ-E02, REQ-U05 |
| AC-12 | REQ-S02 |
| AC-13 | REQ-S04 |
