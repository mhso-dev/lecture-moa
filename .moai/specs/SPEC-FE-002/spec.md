---
id: SPEC-FE-002
title: "Authentication Flow"
version: 2.0.0
status: completed
created: 2026-02-19
updated: 2026-02-19
author: MoAI
priority: critical
tags: [frontend, nextjs, authentication, next-auth, zustand, react-hook-form, zod, jwt]
related_specs: [SPEC-FE-001, SPEC-UI-001]
---

## HISTORY

| Version | Date | Author | Description |
|---------|------|--------|-------------|
| 2.0.0 | 2026-02-19 | MoAI | SPEC 전면 재작성: 코드 예제 제거, 5개 모듈 구조로 통합, 파일 상태 정확히 반영, UserRole 소문자 union type 반영, 라이브러리 버전 명시, 경로 통일 |
| 1.0.0 | 2026-02-19 | MoAI | 초기 SPEC 작성 |

---

# SPEC-FE-002: Authentication Flow

## 1. Environment

### 1.1 Technology Stack

| Category | Technology | Version |
|----------|-----------|---------|
| Framework | Next.js (App Router) | 15.x |
| UI Library | React | 19.x |
| Language | TypeScript | 5.x |
| Authentication | next-auth (Auth.js) | v5 |
| Form Handling | React Hook Form | 7.x |
| Validation | Zod | 3.x |
| State Management | Zustand | 5.x |
| Data Fetching | TanStack Query | v5 |
| Component Library | shadcn/ui (Radix UI) | - |
| CSS Framework | Tailwind CSS | 4.x |
| Icons | Lucide React | - |
| Testing | Vitest + React Testing Library | - |

### 1.2 Relevant File Paths (SPEC-FE-001 기반)

각 파일의 현재 상태를 정확히 표기한다. 상태 구분은 다음과 같다:

- **COMPLETE**: 구현이 완료되어 있으며, 검증 후 필요 시 확장
- **PARTIAL**: 일부 구현되어 있으며, 누락된 필드나 메서드 추가 필요
- **SKELETON**: 파일 구조만 존재하고, 본문 구현이 필요
- **PLACEHOLDER**: 자리잡기용 코드만 있으며, 교체 필요
- **NEW**: 아직 존재하지 않으며, 새로 생성

#### 구현 보강 대상 파일

| 파일 경로 | 상태 | 설명 |
|-----------|------|------|
| `apps/web/lib/auth.ts` | SKELETON | next-auth v5 설정 파일. providers와 callbacks가 비어 있음. CredentialsProvider 설정, JWT/Session 콜백 전체 구현 필요 |
| `apps/web/app/api/auth/[...nextauth]/route.ts` | SKELETON | NextAuth API route 핸들러. auth.ts에서 handlers를 export하는 구조만 존재 |
| `apps/web/app/(auth)/login/page.tsx` | SKELETON | 로그인 페이지. form 구조는 있으나 react-hook-form 연동 및 signIn 호출 미구현 |
| `apps/web/providers/AuthProvider.tsx` | PLACEHOLDER | children만 렌더링하는 placeholder. SessionProvider 래핑 및 store 동기화 구현 필요 |
| `apps/web/stores/auth.store.ts` | PARTIAL | user, isAuthenticated, isLoading 상태 존재. devtools+persist 미들웨어 적용됨. `role` 필드와 `clearAuth()` 메서드 누락 |
| `apps/web/lib/api.ts` | COMPLETE | fetch 기반 API 클라이언트 구현 완료. 토큰 주입(Authorization 헤더) 로직만 추가 필요 |
| `packages/shared/src/types/auth.types.ts` | COMPLETE | UserRole union type (`"student" | "instructor" | "admin"`), User, Session, 각종 Request/Response 타입 정의 완료. 검증 후 필요 시 확장 |
| `packages/shared/src/validators/auth.schema.ts` | COMPLETE | loginSchema, registerSchema, passwordResetRequestSchema, passwordResetSchema 정의 완료. 검증 후 필요 시 확장 |

#### 신규 생성 대상 파일

| 파일 경로 | 설명 |
|-----------|------|
| `apps/web/middleware.ts` | Next.js 미들웨어. 인증/역할 기반 라우트 보호 |
| `apps/web/app/(auth)/register/page.tsx` | 회원가입 페이지 |
| `apps/web/app/(auth)/reset-password/page.tsx` | 비밀번호 재설정 요청 페이지 |
| `apps/web/app/(auth)/reset-password/confirm/page.tsx` | 비밀번호 재설정 확인 페이지 |
| `apps/web/app/(dashboard)/profile/page.tsx` | 프로필 설정 페이지 |
| `apps/web/components/auth/LoginForm.tsx` | 로그인 폼 컴포넌트 |
| `apps/web/components/auth/RegisterForm.tsx` | 회원가입 폼 컴포넌트 |
| `apps/web/components/auth/RoleSelector.tsx` | 역할 선택 컴포넌트 |
| `apps/web/components/auth/PasswordResetForm.tsx` | 비밀번호 재설정 요청 폼 |
| `apps/web/components/auth/PasswordResetConfirmForm.tsx` | 비밀번호 재설정 확인 폼 |
| `apps/web/components/auth/SocialLoginButtons.tsx` | 소셜 로그인 버튼 (선택적) |
| `apps/web/components/auth/AuthCard.tsx` | 인증 페이지 공통 카드 래퍼 |
| `apps/web/components/profile/ProfileForm.tsx` | 프로필 정보 폼 |
| `apps/web/components/profile/AvatarUpload.tsx` | 아바타 업로드 컴포넌트 |
| `apps/web/components/profile/PasswordChangeForm.tsx` | 비밀번호 변경 폼 |
| `apps/web/hooks/useAuth.ts` | 인증 상태 훅 |
| `apps/web/hooks/useCurrentUser.ts` | 현재 사용자 데이터 훅 |
| `apps/web/types/next-auth.d.ts` | next-auth 타입 확장 |

### 1.3 Design References (.pen 파일 - 직접 읽지 말 것)

아래 디자인 파일이 이 SPEC의 시각적 사양을 정의한다. 구현 시 디자인 참조하되, 시각적 세부사항이 필요하면 Pencil MCP를 사용하여 검사한다:

- `design/screens/auth/landing.pen` - 히어로 섹션, 기능 하이라이트, CTA 버튼이 포함된 랜딩 페이지
- `design/screens/auth/login.pen` - 로그인 폼 (이메일/비밀번호, 소셜 로그인 옵션, 비밀번호 찾기 링크)
- `design/screens/auth/register.pen` - 회원가입 폼 (역할 선택, 이름, 이메일, 비밀번호)
- `design/screens/auth/password-reset.pen` - 비밀번호 재설정 플로우 (요청 + 확인 화면)
- `design/screens/auth/profile-settings.pen` - 프로필 설정 (이름, 아바타, 비밀번호 변경)

### 1.4 Responsive Design Constraints

| Breakpoint | Width | Grid | Auth Layout |
|-----------|-------|------|-------------|
| Mobile | 375px+ | 4-column | 중앙 정렬 단일 컬럼 카드 |
| Tablet | 768px+ | 8-column | 중앙 카드 (max-w-md) |
| Desktop | 1280px+ | 12-column | 분할 레이아웃 (왼쪽 히어로, 오른쪽 폼) 또는 중앙 카드 |

- WCAG 2.1 AA 준수 필수
- 포커스 관리: 논리적 탭 순서, 가시적 포커스 링, 스킵 링크 제공
- 에러 메시지: aria-describedby를 통해 입력 필드와 연결
- 스크린 리더: 폼 라벨, 에러 상태, 성공 메시지가 올바르게 전달되어야 함

---

## 2. Assumptions

### 2.1 Foundation Assumptions

- SPEC-FE-001이 완전히 구현되어 있다: 모노레포 구조, 디자인 토큰, 레이아웃 시스템, shadcn/ui 컴포넌트, provider skeleton이 갖추어져 있다
- Fastify API 백엔드가 인증 관련 REST 엔드포인트를 제공한다 (login, register, reset password, profile update)
- 백엔드 인증 엔드포인트 패턴: POST /api/auth/login, POST /api/auth/register, POST /api/auth/reset-password, POST /api/auth/reset-password/confirm, GET /api/users/me, PATCH /api/users/me
- JWT 토큰이 세션 관리에 사용되며, next-auth가 JWT 저장과 갱신을 관리한다
- API base URL은 NEXT_PUBLIC_API_URL 환경 변수를 통해 접근 가능하다

### 2.2 Authentication Strategy Assumptions

- next-auth v5가 CredentialsProvider를 주요 인증 방식으로 사용한다
- 소셜 로그인(Google, GitHub)은 선택적이며, NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN 환경 변수로 기능 플래그된다
- JWT 전략을 사용하며 (데이터베이스 세션이 아님), session.strategy를 jwt로 설정한다
- NEXTAUTH_SECRET이 필수이며 환경에 설정되어 있어야 한다
- NEXTAUTH_URL이 리다이렉트 처리를 위해 애플리케이션 URL로 설정되어 있다
- 백엔드에서 받은 access token과 refresh token은 JWT payload에 저장되어 API 클라이언트에 전달된다

### 2.3 Role Model Assumptions

- 코드베이스에 정의된 UserRole은 소문자 union type이다: "student" | "instructor"
- admin 역할도 타입에 존재하지만 이 SPEC의 범위 밖이다 (관리자 기능은 별도 SPEC에서 다룬다)
- 역할은 회원가입 시 선택되며 JWT/세션에 저장된다
- 역할에 따라 사이드바의 네비게이션 항목이 결정된다 (AppLayout에서 처리)
- 역할 기반 라우트 보호는 미들웨어 레벨에서 수행된다
- 역할 변경은 셀프서비스가 아니다 (관리자 기능, 범위 밖)

### 2.4 Password Reset Assumptions

- 비밀번호 재설정은 이메일 기반이다: 백엔드가 시간 제한이 있는 토큰이 포함된 재설정 링크를 발송한다
- 재설정 플로우는 두 페이지로 구성된다: (1) 이메일 입력으로 재설정 요청, (2) 토큰 + 새 비밀번호로 재설정 확인
- 토큰은 쿼리 파라미터로 전달된다: /reset-password/confirm?token=TOKEN_VALUE
- 토큰 만료는 백엔드가 처리하며, 프론트엔드는 만료 시 적절한 에러를 표시한다

### 2.5 Profile Settings Assumptions

- 프로필 설정 페이지는 인증된 사용자만 접근 가능하다 (보호된 라우트)
- 아바타 업로드는 백엔드를 통해 저장되며, URL이 반환되어 사용자 프로필에 저장된다
- 비밀번호 변경 시 현재 비밀번호 확인이 필요하다
- 표시 이름 변경은 다음 세션 갱신 시 즉시 반영된다
- 이메일 변경은 범위 밖이다 (이메일 인증 워크플로우가 필요하기 때문)

### 2.6 Scope Boundaries

- 이 SPEC은 오직 인증 UI, next-auth 설정, auth store, 미들웨어, 프로필 설정만을 다룬다
- 백엔드 API 구현은 범위 밖이다
- 이메일 발송 인프라는 범위 밖이다
- 이중 인증(2FA)은 범위 밖이다
- OAuth 토큰 갱신 로직은 next-auth 내장 메커니즘에 위임된다
- 관리자 사용자 관리는 범위 밖이다

---

## 3. Requirements

### Module 1: Auth Infrastructure (REQ-FE-101 ~ REQ-FE-108)

이 모듈은 next-auth v5 설정, JWT 콜백, 세션 관리, API 라우트, 소셜 로그인 옵션, 미들웨어, 역할 가드, API 클라이언트 인증 헤더 주입을 다룬다.

---

#### REQ-FE-101: CredentialsProvider Configuration

시스템은 next-auth v5에 CredentialsProvider를 설정하여 백엔드 API에 대해 인증해야 한다.

**파일**: `apps/web/lib/auth.ts` (SKELETON - 전체 구현 필요)

**구현 사항**:
- next-auth v5의 NextAuth 함수를 호출하여 handlers, signIn, signOut, auth를 export하는 구조로 구성한다
- CredentialsProvider에 email(type email)과 password(type password) credential 필드를 정의한다
- authorize 콜백에서 Zod loginSchema로 입력을 검증한 후, POST /api/auth/login 엔드포인트를 호출한다
- 백엔드 응답 성공 시 User 객체(id, name, email, role, image 포함)를 반환하며, 실패 시 null을 반환하여 next-auth의 에러 처리를 트리거한다
- 백엔드 응답에서 받은 accessToken을 JWT 콜백을 통해 저장한다
- 세션에는 user.id, user.role, user.name, user.email, user.image, accessToken이 포함된다
- pages 설정에서 signIn을 /login으로, error를 /login으로 지정한다

---

#### REQ-FE-102: JWT Callback and Token Enrichment

**WHEN** 사용자가 로그인하면, **THEN** 시스템은 JWT 토큰에 백엔드 제공 사용자 데이터와 access token을 보강해야 한다.

**파일**: `apps/web/lib/auth.ts` (SKELETON - JWT 콜백 구현 필요)

**구현 사항**:
- jwt 콜백에서 sign-in 트리거 시 accessToken, refreshToken, user.id, user.role을 토큰에 저장한다
- 후속 요청에서는 보강된 토큰을 그대로 반환한다 (갱신이 필요한 경우 제외)
- 토큰 만료는 exp 필드로 추적하며, 만료 5분 전에 갱신 로직을 트리거한다
- TypeScript 모듈 확장으로 next-auth의 Session과 JWT 타입에 커스텀 필드를 추가한다

---

#### REQ-FE-103: Session Callback and Client Session Shape

시스템은 클라이언트와 서버 양쪽에서 useSession() 또는 auth()를 통해 접근 가능한 타입이 지정된 세션 객체를 제공해야 한다.

**파일**: `apps/web/lib/auth.ts` (SKELETON - session 콜백 구현 필요)

**구현 사항**:
- session 콜백에서 JWT 필드를 세션 객체에 매핑한다
- 세션 shape: user 객체(id, name, email, image, role 포함)와 accessToken, expires로 구성한다
- Session 타입 확장은 apps/web/types/next-auth.d.ts에 정의한다 (NEW 파일)
- Server Components와 API 라우트에서는 auth() 함수로 세션에 접근한다
- Client Components에서는 useSession()으로 세션에 접근한다

---

#### REQ-FE-104: NextAuth API Route

시스템은 모든 인증 요청을 처리하는 NextAuth API 라우트 핸들러를 제공해야 한다.

**파일**: `apps/web/app/api/auth/[...nextauth]/route.ts` (SKELETON - 전체 연결 필요)

**구현 사항**:
- auth.ts에서 export된 handlers 객체의 GET과 POST를 re-export한다
- Next.js 15 App Router 핸들러 패턴과 호환된다
- signIn, signOut, session retrieval, callback processing을 처리한다

---

#### REQ-FE-105: Optional Social Login Configuration

**가능하면** NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true가 설정된 경우, 시스템은 Google과 GitHub OAuth 프로바이더를 활성화해야 한다.

**파일**: `apps/web/lib/auth.ts`, `apps/web/src/env.ts` (소셜 로그인 환경 변수 추가 필요)

**구현 사항**:
- GoogleProvider에 GOOGLE_CLIENT_ID와 GOOGLE_CLIENT_SECRET을 설정한다
- GitHubProvider에 GITHUB_CLIENT_ID와 GITHUB_CLIENT_SECRET을 설정한다
- OAuth 콜백 URL을 NEXTAUTH_URL/api/auth/callback/PROVIDER 형식으로 등록한다
- 소셜 로그인 사용자에게는 기본적으로 "student" 역할을 할당한다 (백엔드에서 재정의하지 않는 한)
- env.ts에 소셜 로그인 관련 환경 변수(GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET)를 추가한다

---

#### REQ-FE-106: Next.js Middleware for Route Protection

시스템은 Next.js 미들웨어를 통해 대시보드 라우트를 보호하고, 미인증 사용자를 로그인 페이지로 리다이렉트해야 한다.

**파일**: `apps/web/middleware.ts` (NEW - 새로 생성)

**구현 사항**:
- auth.ts에서 가져온 auth 함수를 미들웨어로 사용한다
- 보호 대상 라우트 패턴: /dashboard, /profile, /courses, /materials, /quizzes, /teams, /memos, /qa로 시작하는 경로
- 미인증 요청은 /login?callbackUrl=ENCODED_ORIGINAL_URL로 리다이렉트한다
- 인증 라우트 패턴: /login, /register로 시작하는 경로에 인증된 사용자가 접근하면 /dashboard로 리다이렉트한다
- 공개 라우트 (랜딩 페이지 /, API 라우트 /api, 비밀번호 재설정 /reset-password)는 보호 대상에서 제외한다
- matcher 설정에서 api, _next/static, _next/image, favicon.ico를 제외한다

---

#### REQ-FE-107: Role-Based Route Guard

**IF** 사용자가 인증된 상태에서, **AND WHEN** 특정 역할로 제한된 라우트에 접근하면, **THEN** 시스템은 해당 사용자를 역할에 맞는 대시보드로 리다이렉트해야 한다.

**파일**: `apps/web/middleware.ts` (NEW)

**구현 사항**:
- instructor 전용 라우트(예: 강의 생성)에 "student" 역할 사용자가 접근하면 해당 사용자의 대시보드로 리다이렉트한다
- student 전용 라우트에 "instructor" 역할 사용자가 접근하면 해당 사용자의 대시보드로 리다이렉트한다
- 역할 확인은 미들웨어에서 세션의 user.role 필드를 사용하여 수행한다
- 미인가 리다이렉트 대상은 /dashboard이며, toast 알림과 함께 처리한다

---

#### REQ-FE-108: API Client Auth Header Injection

**IF** 사용자 세션이 활성 상태이면, **THEN** 시스템은 모든 API 클라이언트 요청에 자동으로 Authorization: Bearer ACCESS_TOKEN 헤더를 주입해야 한다.

**파일**: `apps/web/lib/api.ts` (COMPLETE - 토큰 주입 로직만 추가)

**구현 사항**:
- 요청 인터셉터에서 next-auth 세션으로부터 access token을 읽는다
- 서버 사이드 요청에서는 auth() 함수로 토큰을 가져온다
- 클라이언트 사이드 요청에서는 next-auth/react의 getSession()으로 토큰을 가져온다
- 토큰이 없거나 만료된 경우, 인터셉터가 sign-out 플로우를 트리거한다

---

### Module 2: Auth State Management (REQ-FE-109 ~ REQ-FE-114)

이 모듈은 Zustand store 보강, store 동기화, useAuth 훅, 타입 정의, Zod 스키마, next-auth 타입 확장을 다룬다.

---

#### REQ-FE-109: Auth Store State Enhancement

시스템은 Zustand auth store에 누락된 필드와 메서드를 추가하여 next-auth 세션을 클라이언트 사이드 UI에서 접근할 수 있도록 해야 한다.

**파일**: `apps/web/stores/auth.store.ts` (PARTIAL - role 필드와 clearAuth 추가 필요)

**현재 상태**: user, isAuthenticated, isLoading 상태가 존재하며, devtools+persist 미들웨어가 적용되어 있다. role 필드와 clearAuth() 메서드가 누락되어 있다.

**추가 사항**:
- 상태에 role 필드를 추가한다 (타입: UserRole 또는 null, 기본값 null)
- clearAuth() 액션을 추가한다: user를 null로, isAuthenticated를 false로, isLoading을 false로, role을 null로 초기화한다
- 기존 setUser 액션이 user를 설정할 때 role도 user.role에서 추출하여 함께 설정하도록 보강한다
- Zustand devtools 미들웨어는 개발 환경에서 유지한다

---

#### REQ-FE-110: Auth Store Synchronization with next-auth Session

**WHEN** next-auth 세션이 변경되면 (로그인, 로그아웃, 세션 업데이트), **THEN** 시스템은 Zustand auth store를 현재 세션 상태와 동기화해야 한다.

**파일**: `apps/web/providers/AuthProvider.tsx` (PLACEHOLDER - 전체 교체 필요)

**구현 사항**:
- next-auth의 SessionProvider로 children을 래핑한다
- useSession()을 구독하여 세션 변경 시 store를 업데이트한다
- 세션 로드 완료 시 setLoading(false)와 setUser(session.user)를 호출한다
- 로그아웃 시 clearAuth()로 store를 초기 상태로 리셋한다
- 세션 폴링 간격: 5분 (refetchInterval로 설정 가능)

---

#### REQ-FE-111: useAuth Hook

시스템은 Zustand store에서 현재 인증 상태와 액션을 반환하는 useAuth 훅을 제공해야 한다.

**파일**: `apps/web/hooks/useAuth.ts` (NEW)

**구현 사항**:
- 반환값: user, isAuthenticated, isLoading, role, signIn, signOut, updateUser
- signIn(credentials)은 next-auth/react의 signIn()을 에러 처리와 함께 래핑한다
- signOut()은 next-auth/react의 signOut()을 호출하고 store를 클리어한다
- updateUser(data)는 store를 낙관적으로 업데이트한 후 프로필 API를 호출한다

---

#### REQ-FE-112: Auth Type Definitions

시스템은 packages/shared/src/types/auth.types.ts의 인증 타입 정의를 검증하고, 필요 시 확장해야 한다.

**파일**: `packages/shared/src/types/auth.types.ts` (COMPLETE - 검증 및 필요 시 확장)

**현재 상태**: UserRole이 소문자 union type으로 정의되어 있다 ("student" | "instructor" | "admin"). User, Session, LoginRequest, RegisterRequest, AuthResponse, ResetPasswordRequest, ResetPasswordConfirmRequest, UpdateProfileRequest, ChangePasswordRequest 등의 타입이 정의 완료 상태이다.

**검증 사항**:
- UserRole은 "student" | "instructor" | "admin"으로 정의되어 있으며, 이 SPEC에서는 "student"과 "instructor"만 사용한다. "admin"은 범위 밖이지만 타입 정의는 유지한다
- User 인터페이스에 id, name, email, image(옵션), role, createdAt 필드가 포함되어 있는지 확인한다
- 누락된 타입이 있으면 추가한다

---

#### REQ-FE-113: Zod Validation Schema

시스템은 packages/shared/src/validators/auth.schema.ts의 Zod 검증 스키마를 검증하고, 필요 시 확장해야 한다.

**파일**: `packages/shared/src/validators/auth.schema.ts` (COMPLETE - 검증 및 필요 시 확장)

**현재 상태**: loginSchema, registerSchema, passwordResetRequestSchema, passwordResetSchema가 정의 완료 상태이다.

**검증 사항**:
- loginSchema: email(유효한 이메일 형식), password(최소 8자)
- registerSchema: name(최소 2자, 최대 50자), email(유효한 이메일), password(최소 8자, 대문자 1개 이상, 숫자 1개 이상), role("instructor" 또는 "student" 검증)
- passwordResetRequestSchema: email(유효한 이메일 형식)
- passwordResetSchema: token(비어 있지 않은 문자열), password(최소 8자, 대문자 1개 이상, 숫자 1개 이상), confirmPassword(.refine()을 통한 일치 검증)
- 다음 스키마가 누락되어 있으면 추가한다: updateProfileSchema (name 옵션, image 옵션 URL 형식), changePasswordSchema (currentPassword 필수, newPassword 검증, confirmNewPassword .refine() 일치 확인)
- 모든 스키마에서 추론된 TypeScript 타입을 export한다

---

#### REQ-FE-114: next-auth Type Augmentation

시스템은 next-auth의 세션과 JWT에 커스텀 필드를 포함하기 위한 TypeScript 모듈 확장을 제공해야 한다.

**파일**: `apps/web/types/next-auth.d.ts` (NEW)

**구현 사항**:
- next-auth 모듈을 확장한다
- Session.user에 id(string), role(UserRole), image(옵션 string)를 추가한다
- Session에 accessToken(string)을 추가한다
- JWT에 accessToken(string), refreshToken(옵션 string), role(UserRole), userId(string)를 추가한다

---

### Module 3: Auth Pages (REQ-FE-115 ~ REQ-FE-126)

이 모듈은 로그인 페이지/폼, 회원가입 페이지/폼/RoleSelector, 비밀번호 재설정 요청, 비밀번호 재설정 확인, 소셜 로그인 버튼, 접근성을 다룬다.

---

#### REQ-FE-115: Login Page Route and Layout

시스템은 (auth) 라우트 그룹 내에서 /login에 로그인 페이지를 제공해야 한다.

**파일**: `apps/web/app/(auth)/login/page.tsx` (SKELETON - react-hook-form 연동 및 signIn 통합 필요)

**구현 사항**:
- Server Component로 구성한다
- (auth) 레이아웃을 사용한다 (중앙 정렬, 사이드바 없음)
- 페이지 메타데이터: title "Login | Lecture Moa", description "Sign in to your account"
- 인증된 사용자는 미들웨어(REQ-FE-106)를 통해 /dashboard로 리다이렉트된다
- 디자인 참조: design/screens/auth/login.pen

---

#### REQ-FE-116: Login Form Component

시스템은 이메일/비밀번호 필드와 유효성 검증을 갖춘 로그인 폼을 제공해야 한다.

**파일**: `apps/web/components/auth/LoginForm.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 필드: email (type email, autocomplete email), password (type password, autocomplete current-password)
- React Hook Form과 loginSchema(Zod) 검증을 통합한다
- 각 입력 필드 아래에 인라인 필드 레벨 에러 메시지를 표시하며, aria-describedby로 연결한다
- 제출 버튼: "Sign in" 라벨, 제출 중 로딩 스피너 표시, 로딩 시 비활성화
- "Forgot password?" 링크는 /reset-password로 이동한다
- 폼 제출 시 next-auth의 signIn을 credentials provider와 email, password, redirect false 옵션으로 호출한다
- CredentialsSignin 에러 발생 시: "Invalid email or password" toast를 표시한다
- 성공 시: callbackUrl 또는 /dashboard로 리다이렉트한다

---

#### REQ-FE-117: Social Login Integration

**가능하면** NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true가 설정된 경우, 로그인 페이지에 소셜 로그인 옵션을 표시해야 한다.

**파일**: `apps/web/components/auth/SocialLoginButtons.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- "Continue with Google" 버튼: Google 아이콘(SVG), signIn("google") 호출
- "Continue with GitHub" 버튼: GitHub 아이콘(Lucide), signIn("github") 호출
- 소셜 로그인과 자격 증명 섹션 사이에 "Or continue with" 구분선을 표시한다
- 버튼은 shadcn/ui Button 컴포넌트의 variant="outline" 스타일을 따른다

---

#### REQ-FE-118: Login Page Accessibility

시스템은 로그인 페이지가 WCAG 2.1 AA 표준을 충족하도록 해야 한다.

**구현 사항**:
- form 요소에 aria-label="Sign in form"을 설정한다
- 모든 입력에 연결된 label 요소가 있어야 한다
- 에러 메시지는 aria-describedby와 role="alert"로 연결한다
- 폼 제출 실패 시 첫 번째 에러 필드로 포커스를 설정한다
- 탭 순서: Email, Password, Forgot Password 링크, Submit 버튼, Social login 버튼 순
- 모든 텍스트 요소의 색상 대비 비율이 4.5:1 이상이어야 한다

---

#### REQ-FE-119: Registration Page Route and Layout

시스템은 (auth) 라우트 그룹 내에서 /register에 회원가입 페이지를 제공해야 한다.

**파일**: `apps/web/app/(auth)/register/page.tsx` (NEW)

**구현 사항**:
- Server Component로 구성한다
- (auth) 레이아웃을 사용한다
- 페이지 메타데이터: title "Create Account | Lecture Moa", description "Create your account to start learning or teaching"
- 로그인 페이지 링크: "Already have an account? Sign in"
- 디자인 참조: design/screens/auth/register.pen

---

#### REQ-FE-120: Registration Form Component

시스템은 이름, 이메일, 비밀번호, 역할 선택 필드를 갖춘 회원가입 폼을 제공해야 한다.

**파일**: `apps/web/components/auth/RegisterForm.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 필드: name, email, password, confirmPassword
- React Hook Form과 registerSchema(Zod) 검증을 통합한다
- 인라인 필드 레벨 에러 메시지를 aria-describedby로 연결한다
- 비밀번호 강도 표시기 (weak/medium/strong 시각적 바)를 포함한다
- 제출 버튼: "Create account", 로딩 상태, 로딩 시 비활성화
- 폼 제출 시 API 클라이언트를 통해 POST /api/auth/register를 호출하고, 성공 시 signIn("credentials")을 호출한다
- 성공 시: /dashboard로 리다이렉트하며 환영 toast 알림을 표시한다

---

#### REQ-FE-121: Role Selector Component

시스템은 사용자가 instructor 또는 student를 선택할 수 있는 역할 선택 컴포넌트를 제공해야 한다.

**파일**: `apps/web/components/auth/RoleSelector.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 두 개의 역할 카드: "Instructor"와 "Student"
- 각 카드에는 역할 아이콘(Lucide), 역할 제목, 간략한 설명(1-2문장)을 표시한다
- 선택된 카드는 강조된 테두리(primary color)와 체크마크 표시가 있다
- 미선택 카드는 기본 테두리를 갖는다
- 역할 선택은 registerSchema 검증의 일부이다 (필수)
- 키보드 네비게이션: Space/Enter로 선택, 화살표 키로 역할 간 전환
- 디자인 참조: design/screens/auth/register.pen 역할 선택 섹션

---

#### REQ-FE-122: Registration Form Accessibility

시스템은 회원가입 폼이 WCAG 2.1 AA 표준을 충족하도록 해야 한다.

**구현 사항**:
- 역할 선택기는 radiogroup과 radio ARIA 역할을 사용한다
- 비밀번호 강도 표시기는 aria-label과 aria-valuenow/aria-valuemax 속성을 갖는다
- 모든 입력에 연결된 label이 있어야 한다
- 검증 에러는 aria-live="polite" 영역을 통해 전달된다
- 탭 순서: Name, Email, Password, Confirm Password, Role selector 카드, Submit 순

---

#### REQ-FE-123: Password Reset Request Page

시스템은 /reset-password에 비밀번호 재설정 요청 페이지를 제공해야 한다.

**파일**: `apps/web/app/(auth)/reset-password/page.tsx` (NEW)

**구현 사항**:
- Server Component로 구성한다
- 페이지 메타데이터: title "Reset Password | Lecture Moa"
- 단일 이메일 필드와 제출 버튼으로 구성된 폼
- 디자인 참조: design/screens/auth/password-reset.pen (요청 상태)

---

#### REQ-FE-124: Password Reset Request Form

시스템은 비밀번호 재설정 요청 폼 컴포넌트를 제공해야 한다.

**파일**: `apps/web/components/auth/PasswordResetForm.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 필드: email (type email)
- React Hook Form과 passwordResetRequestSchema 검증을 통합한다
- 제출 시: API 클라이언트를 통해 POST /api/auth/reset-password를 호출한다
- 성공 시: 폼을 확인 메시지("Check your email for reset instructions")로 교체한다
- 에러 시: "If an account exists with this email, you will receive a reset link" toast를 표시한다
- "Back to login" 링크를 포함한다
- 제출 버튼: "Send reset link", 로딩 상태

---

#### REQ-FE-125: Password Reset Confirm Page

시스템은 /reset-password/confirm에 비밀번호 재설정 확인 페이지를 제공해야 한다.

**파일**: `apps/web/app/(auth)/reset-password/confirm/page.tsx` (NEW)

**구현 사항**:
- Server Component로 구성한다
- token 쿼리 파라미터를 읽으며, 없으면 /reset-password로 리다이렉트한다
- 페이지 메타데이터: title "Set New Password | Lecture Moa"
- 디자인 참조: design/screens/auth/password-reset.pen (확인 상태)

---

#### REQ-FE-126: Password Reset Confirm Form Component

시스템은 비밀번호 재설정 확인 폼 컴포넌트를 제공해야 한다.

**파일**: `apps/web/components/auth/PasswordResetConfirmForm.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 부모 페이지에서 token prop을 전달받는다
- 필드: newPassword, confirmPassword
- React Hook Form과 passwordResetSchema(resetPasswordConfirmSchema) 검증을 통합한다
- 제출 시: token과 newPassword를 POST /api/auth/reset-password/confirm으로 전송한다
- 성공 시: 성공 메시지와 "Go to login" 링크를 표시하고, 3초 후 /login으로 자동 리다이렉트한다
- 에러 (만료된 토큰) 시: "This reset link has expired. Request a new one." 메시지와 /reset-password 링크를 표시한다
- 제출 버튼: "Set new password", 로딩 상태

---

### Module 4: Profile Settings (REQ-FE-127 ~ REQ-FE-131)

이 모듈은 프로필 설정 페이지, 프로필 폼, 아바타 업로드, 비밀번호 변경, useCurrentUser 훅을 다룬다.

---

#### REQ-FE-127: Profile Settings Page Route

시스템은 (dashboard) 라우트 그룹 내에서 /profile에 프로필 설정 페이지를 제공해야 한다.

**파일**: `apps/web/app/(dashboard)/profile/page.tsx` (NEW)

**구현 사항**:
- Server Component로 구성한다
- 보호된 라우트이다 (미들웨어를 통한 인증 필수)
- auth()를 통해 현재 사용자 데이터를 가져와 초기 렌더링에 사용한다
- 페이지 메타데이터: title "Profile Settings | Lecture Moa"
- 대시보드 레이아웃(사이드바 네비게이션 포함)을 사용한다
- 디자인 참조: design/screens/auth/profile-settings.pen

---

#### REQ-FE-128: Profile Form Component

시스템은 프로필 정보 폼 컴포넌트를 제공해야 한다.

**파일**: `apps/web/components/profile/ProfileForm.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 필드: name (텍스트 입력, 세션에서 미리 채워짐), email (읽기 전용, 텍스트로 표시, 편집 불가)
- React Hook Form과 updateProfileSchema 검증을 통합한다
- 제출 시: API 클라이언트를 통해 PATCH /api/users/me를 호출한다
- 성공 시: next-auth/react의 update()로 next-auth 세션을 업데이트하고, 성공 toast를 표시하며, auth store를 업데이트한다
- 에러 시: 에러 메시지와 함께 에러 toast를 표시한다
- 제출 버튼: "Save changes", 로딩 상태, 변경사항이 없으면 비활성화

---

#### REQ-FE-129: Avatar Upload Component

시스템은 프로필 설정 내에 아바타 업로드 컴포넌트를 제공해야 한다.

**파일**: `apps/web/components/profile/AvatarUpload.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 현재 아바타를 표시한다 (아바타가 없으면 이니셜 placeholder)
- "Change avatar" 버튼이 파일 입력을 트리거한다 (accept: image/jpeg, image/png, image/webp)
- 클라이언트 사이드 파일 크기 검증: 최대 5MB, 초과 시 에러 표시
- 미리보기: 업로드 전 선택한 이미지를 표시한다 (URL.createObjectURL 사용)
- 업로드: FormData를 사용하여 POST /api/users/me/avatar를 호출하고, 응답에서 URL을 수신한다
- 성공 시: 프로필 폼의 image 필드를 업데이트하고 성공 toast를 표시한다
- 에러 시: 이전 아바타로 복원하고 에러 toast를 표시한다

---

#### REQ-FE-130: Password Change Form Component

시스템은 프로필 설정 페이지 내에 비밀번호 변경 섹션을 제공해야 한다.

**파일**: `apps/web/components/profile/PasswordChangeForm.tsx` (NEW)

**구현 사항**:
- Client Component로 구성한다
- 필드: currentPassword, newPassword, confirmNewPassword
- React Hook Form과 changePasswordSchema 검증을 통합한다
- 제출 시: API 클라이언트를 통해 POST /api/users/me/password를 호출한다
- 성공 시: 폼 필드를 리셋하고 "Password changed successfully" 성공 toast를 표시한다
- 401 에러 시: "Current password is incorrect"를 표시한다
- 기타 에러 시: 일반 에러 toast를 표시한다
- 제출 버튼: "Change password", 로딩 상태

---

#### REQ-FE-131: useCurrentUser Hook

시스템은 현재 사용자 프로필을 가져오고 캐싱하는 useCurrentUser 훅을 제공해야 한다.

**파일**: `apps/web/hooks/useCurrentUser.ts` (NEW)

**구현 사항**:
- TanStack Query의 useQuery를 사용하며, 쿼리 키는 ["users", "me"]이다
- auth 헤더와 함께 GET /api/users/me를 호출한다
- 반환값: data(User 또는 undefined), isLoading, error, refetch
- staleTime: 5분
- 401 에러 시: useAuth()의 signOut()을 트리거한다

---

### Module 5: Landing Page Integration & Security (REQ-FE-132, REQ-FE-133, REQ-FE-N10 ~ REQ-FE-N14)

이 모듈은 랜딩 페이지 CTA, 인증 상태 감지, 보안 관련 비허용 동작 요구사항을 다룬다.

---

#### REQ-FE-132: Landing Page with Auth CTAs

시스템은 랜딩 페이지(app/page.tsx)에 인증 관련 CTA(Call-to-Action) 요소를 포함하도록 업데이트해야 한다.

**파일**: `apps/web/app/page.tsx` (기존 파일 업데이트)

**구현 사항**:
- 히어로 섹션에 "Get Started"(/register 링크)와 "Sign In"(/login 링크) 버튼을 배치한다
- 기능 하이라이트 섹션 (디자인에 맞게 3-4개 기능)
- 인증된 사용자에게는 "Get Started" 대신 "Go to Dashboard"를 표시한다
- 디자인 참조: design/screens/auth/landing.pen

---

#### REQ-FE-133: Landing Page Auth State Detection

**WHEN** 사용자가 랜딩 페이지를 방문하면, **THEN** 시스템은 인증 상태를 감지하여 적절한 CTA를 표시해야 한다.

**파일**: `apps/web/app/page.tsx`

**구현 사항**:
- Server Component에서 next-auth의 auth()를 통해 세션을 읽는다
- 인증됨: "Go to Dashboard" CTA를 표시하며, /dashboard로 이동한다
- 미인증: "Get Started"와 "Sign In" CTA를 표시한다

---

#### REQ-FE-N10: No Client-Side Token Storage

시스템은 JWT 토큰을 localStorage 또는 sessionStorage에 저장**하지 않아야 한다**. 토큰 저장은 next-auth의 보안 쿠키 메커니즘에 위임한다.

---

#### REQ-FE-N11: No Plain-Text Password Logging

시스템은 비밀번호 또는 인증 토큰을 콘솔이나 로깅 서비스에 기록**하지 않아야 한다**.

---

#### REQ-FE-N12: No Unauthenticated Dashboard Access

**IF** 사용자가 유효한 세션 없이 (dashboard) 라우트에 접근하려 하면, **THEN** 시스템은 원래 URL을 callbackUrl로 포함하여 /login으로 리다이렉트해야 한다.

---

#### REQ-FE-N13: No Role Bypass

**IF** "student" 역할의 사용자가 instructor 전용 라우트에 접근하면, **THEN** 시스템은 해당 사용자를 대시보드로 리다이렉트해야 하며, 보호된 콘텐츠를 렌더링**하지 않아야 한다**.

---

#### REQ-FE-N14: No Stale Auth State After Sign-Out

**WHEN** 사용자가 로그아웃하면, **THEN** 시스템은 Zustand auth store를 클리어하고, 모든 TanStack Query 캐시를 무효화하며, 랜딩 페이지 /로 리다이렉트해야 한다.

---

## 4. Specifications

### 4.1 File Structure (SPEC-FE-001 대비 전체 변경분)

아래 목록은 이 SPEC에서 변경하거나 생성하는 모든 파일을 정리한 것이다. 각 파일의 변경 유형(UPDATED, NEW)을 표기한다.

**apps/web/ 디렉토리**:

| 파일 경로 | 유형 | 설명 |
|-----------|------|------|
| `app/page.tsx` | UPDATED | 랜딩 페이지에 인증 CTA 추가 |
| `app/(auth)/login/page.tsx` | UPDATED | 로그인 페이지 전체 구현 (기존 SKELETON) |
| `app/(auth)/register/page.tsx` | NEW | 회원가입 페이지 |
| `app/(auth)/reset-password/page.tsx` | NEW | 비밀번호 재설정 요청 페이지 |
| `app/(auth)/reset-password/confirm/page.tsx` | NEW | 비밀번호 재설정 확인 페이지 |
| `app/(dashboard)/profile/page.tsx` | NEW | 프로필 설정 페이지 |
| `app/api/auth/[...nextauth]/route.ts` | UPDATED | NextAuth 핸들러 완성 (기존 SKELETON) |
| `components/auth/AuthCard.tsx` | NEW | 인증 페이지 공통 카드 래퍼 |
| `components/auth/LoginForm.tsx` | NEW | 로그인 폼 |
| `components/auth/RegisterForm.tsx` | NEW | 회원가입 폼 |
| `components/auth/RoleSelector.tsx` | NEW | 역할 선택 컴포넌트 |
| `components/auth/PasswordResetForm.tsx` | NEW | 비밀번호 재설정 요청 폼 |
| `components/auth/PasswordResetConfirmForm.tsx` | NEW | 비밀번호 재설정 확인 폼 |
| `components/auth/SocialLoginButtons.tsx` | NEW | 소셜 로그인 버튼 (선택적) |
| `components/profile/ProfileForm.tsx` | NEW | 프로필 정보 폼 |
| `components/profile/AvatarUpload.tsx` | NEW | 아바타 업로드 컴포넌트 |
| `components/profile/PasswordChangeForm.tsx` | NEW | 비밀번호 변경 폼 |
| `hooks/useAuth.ts` | NEW | 인증 상태 훅 |
| `hooks/useCurrentUser.ts` | NEW | 현재 사용자 데이터 훅 |
| `lib/auth.ts` | UPDATED | next-auth 전체 설정 (기존 SKELETON) |
| `lib/api.ts` | UPDATED | 토큰 주입 로직 추가 (기존 COMPLETE) |
| `middleware.ts` | NEW | 라우트 보호 미들웨어 |
| `providers/AuthProvider.tsx` | UPDATED | SessionProvider + store 동기화 (기존 PLACEHOLDER) |
| `stores/auth.store.ts` | UPDATED | role 필드, clearAuth 추가 (기존 PARTIAL) |
| `types/next-auth.d.ts` | NEW | next-auth 타입 확장 |

**packages/shared/src/ 디렉토리**:

| 파일 경로 | 유형 | 설명 |
|-----------|------|------|
| `types/auth.types.ts` | UPDATED | 검증 후 필요 시 확장 (기존 COMPLETE) |
| `validators/auth.schema.ts` | UPDATED | 검증 후 필요 시 확장 (기존 COMPLETE) |

### 4.2 next-auth v5 Configuration Shape

auth.ts 파일은 NextAuth 함수를 호출하여 handlers, signIn, signOut, auth를 export한다. providers 배열에는 CredentialsProvider가 필수로 포함되며, email과 password credential 필드를 정의한다. authorize 콜백에서 Zod loginSchema로 입력을 검증한 후 백엔드 API를 호출하고, 성공 시 User 객체를 반환하며 실패 시 null을 반환한다. 소셜 로그인 프로바이더(Google, GitHub)는 환경 변수 조건부로 추가한다.

session 설정의 strategy는 "jwt"로 지정한다.

callbacks 객체에는 jwt 콜백과 session 콜백을 정의한다. jwt 콜백에서는 sign-in 트리거 시 토큰에 사용자 정보와 accessToken을 보강하고, 후속 요청에서는 기존 토큰을 반환하며, 토큰 만료 임박 시 갱신 로직을 실행한다. session 콜백에서는 JWT 필드를 세션 객체에 매핑한다.

pages 설정에서 signIn은 /login으로, error는 /login으로 지정한다.

### 4.3 Zustand Auth Store Shape

auth.store.ts의 상태 인터페이스는 다음 필드로 구성된다:

- user: User 또는 null
- isAuthenticated: boolean
- isLoading: boolean
- role: UserRole 또는 null

액션은 다음과 같다:

- setUser(user): user를 설정하고, isAuthenticated를 user 존재 여부로 설정하며, role을 user.role에서 추출한다
- setLoading(isLoading): 로딩 상태를 설정한다
- clearAuth(): 모든 상태를 초기값(user null, isAuthenticated false, isLoading false, role null)으로 리셋한다

store는 Zustand의 devtools 미들웨어로 래핑되며, 스토어 이름은 "auth-store"로 설정한다. 기존에 적용된 persist 미들웨어는 유지한다.

### 4.4 Middleware Configuration

middleware.ts는 auth.ts에서 가져온 auth 함수를 미들웨어로 사용한다.

보호 로직:
- 보호 대상 라우트(/dashboard, /profile, /courses, /materials, /quizzes, /teams, /memos, /qa로 시작하는 경로)에 미인증 접근 시, /login으로 리다이렉트하며 원래 경로를 callbackUrl 쿼리 파라미터로 인코딩하여 포함한다
- 인증 라우트(/login, /register로 시작하는 경로)에 인증된 사용자가 접근 시, /dashboard로 리다이렉트한다
- 그 외 요청은 통과시킨다

matcher 설정: api, _next/static, _next/image, favicon.ico를 제외한 모든 경로를 매칭한다.

### 4.5 Component State and Data Flow

**Landing Page** (Server Component): auth()로 세션을 읽어, 인증되었으면 "Go to Dashboard" CTA를, 미인증이면 "Get Started"와 "Sign In" CTA를 렌더링한다.

**Login Page** (Server Component): LoginForm(Client Component)을 포함하며, LoginForm은 useForm()과 loginSchema를 사용한다. 폼 제출 시 signIn("credentials")을 호출하고, 성공 시 callbackUrl 또는 /dashboard로 이동하며, 에러 시 toast를 표시한다. SocialLoginButtons는 조건부로 포함된다.

**Register Page** (Server Component): RegisterForm(Client Component)을 포함하며, RegisterForm은 useForm()과 registerSchema를 사용한다. RoleSelector(Client Component)는 라디오 그룹으로 키보드 네비게이션을 지원한다. 폼 제출 시 POST /api/auth/register를 호출하고, 성공 시 signIn("credentials")으로 자동 로그인 후 /dashboard로 이동한다.

**Profile Page** (Server Component): auth()로 세션을 읽어 초기 데이터를 제공한다. ProfileForm(Client Component)은 useCurrentUser()로 최신 데이터를 가져오고, PATCH /api/users/me로 업데이트한다. AvatarUpload(Client Component)는 POST /api/users/me/avatar로 아바타를 업로드한다. PasswordChangeForm(Client Component)은 POST /api/users/me/password로 비밀번호를 변경한다.

**AuthProvider** (Client Component, providers 내부): useSession() 구독을 통해 세션 변경 시 useAuthStore.setUser()를 호출하고, 로그아웃 시 useAuthStore.clearAuth()를 호출한다.

### 4.6 Environment Variables

**필수 환경 변수**:

| 변수명 | 설명 | 예시 |
|--------|------|------|
| NEXTAUTH_SECRET | next-auth 암호화 키 (32바이트 랜덤 문자열) | 랜덤 생성 |
| NEXTAUTH_URL | 애플리케이션 URL | http://localhost:3000 |
| NEXT_PUBLIC_API_URL | 백엔드 API URL | http://localhost:4000 |
| NEXT_PUBLIC_APP_URL | 프론트엔드 앱 URL | http://localhost:3000 |

**선택적 환경 변수 (소셜 로그인)**:

| 변수명 | 설명 | 기본값 |
|--------|------|--------|
| NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN | 소셜 로그인 활성화 플래그 | false |
| GOOGLE_CLIENT_ID | Google OAuth 클라이언트 ID | 빈 문자열 |
| GOOGLE_CLIENT_SECRET | Google OAuth 클라이언트 시크릿 | 빈 문자열 |
| GITHUB_CLIENT_ID | GitHub OAuth 클라이언트 ID | 빈 문자열 |
| GITHUB_CLIENT_SECRET | GitHub OAuth 클라이언트 시크릿 | 빈 문자열 |

### 4.7 Error State Mapping

| Scenario | UI Response |
|----------|-------------|
| 잘못된 자격 증명 | Toast: "Invalid email or password" |
| 계정 미존재 | Toast: "Invalid email or password" (보안을 위해 동일 메시지) |
| 네트워크 에러 | Toast: "Unable to connect. Please try again." |
| 이미 등록된 이메일 | 이메일 필드 인라인 에러: "An account with this email already exists" |
| 약한 비밀번호 | 요구사항 목록이 포함된 인라인 에러 |
| 만료된 재설정 토큰 | 페이지 메시지 + 새 재설정 요청 링크 |
| 미인가 역할 접근 | 대시보드로 리다이렉트 + Toast: "You don't have access to that page" |
| 파일 크기 초과 (아바타) | 인라인 에러: "File must be smaller than 5MB" |
| 잘못된 파일 타입 (아바타) | 인라인 에러: "Please upload a JPEG, PNG, or WebP image" |

---

## 5. Traceability

### 5.1 Requirement to Design Mapping

| Requirement | Design Reference | Screen/Component |
|------------|-----------------|------------------|
| REQ-FE-115, REQ-FE-116, REQ-FE-117, REQ-FE-118 | `design/screens/auth/login.pen` | 로그인 페이지 + 폼 |
| REQ-FE-119, REQ-FE-120, REQ-FE-121, REQ-FE-122 | `design/screens/auth/register.pen` | 회원가입 페이지 + 폼 |
| REQ-FE-123, REQ-FE-124 | `design/screens/auth/password-reset.pen` (요청 상태) | 비밀번호 재설정 요청 |
| REQ-FE-125, REQ-FE-126 | `design/screens/auth/password-reset.pen` (확인 상태) | 비밀번호 재설정 확인 |
| REQ-FE-127, REQ-FE-128, REQ-FE-129, REQ-FE-130 | `design/screens/auth/profile-settings.pen` | 프로필 설정 페이지 |
| REQ-FE-132, REQ-FE-133 | `design/screens/auth/landing.pen` | 랜딩 페이지 인증 CTA |

### 5.2 Requirement to Foundation SPEC Mapping

| This SPEC | Foundation SPEC (FE-001) | Relationship |
|-----------|--------------------------|-------------|
| REQ-FE-101 ~ REQ-FE-105 | REQ-FE-045 (AuthProvider skeleton, auth.ts skeleton) | SKELETON의 전체 구현 |
| REQ-FE-109 ~ REQ-FE-111 | REQ-FE-042 (auth.store.ts skeleton) | PARTIAL 상태에서 보강 |
| REQ-FE-112 ~ REQ-FE-113 | REQ-FE-051, REQ-FE-053 (shared type/schema skeletons) | COMPLETE 검증 후 확장 |
| REQ-FE-115 ~ REQ-FE-133 | REQ-FE-006 (App Router structure, (auth) layout) | 기존 라우트 그룹에 페이지 추가 |
| REQ-FE-106, REQ-FE-107 | REQ-FE-006 (route groups) | 라우트 구조를 강제하는 새 미들웨어 |
| REQ-FE-108 | REQ-FE-043 (API client) | 기존 클라이언트에 인터셉터 구현 |

### 5.3 Acceptance Criteria Tags

| Requirement | Acceptance File Reference |
|------------|--------------------------|
| REQ-FE-101 ~ REQ-FE-108 | acceptance.md#AC-FE-101 ~ AC-FE-108 |
| REQ-FE-109 ~ REQ-FE-114 | acceptance.md#AC-FE-109 ~ AC-FE-114 |
| REQ-FE-115 ~ REQ-FE-118 | acceptance.md#AC-FE-115 ~ AC-FE-118 |
| REQ-FE-119 ~ REQ-FE-122 | acceptance.md#AC-FE-119 ~ AC-FE-122 |
| REQ-FE-123 ~ REQ-FE-126 | acceptance.md#AC-FE-123 ~ AC-FE-126 |
| REQ-FE-127 ~ REQ-FE-131 | acceptance.md#AC-FE-127 ~ AC-FE-131 |
| REQ-FE-132 ~ REQ-FE-133 | acceptance.md#AC-FE-132 ~ AC-FE-133 |
| REQ-FE-N10 ~ REQ-FE-N14 | acceptance.md#AC-FE-N10 ~ AC-FE-N14 |

---

## 6. Implementation Notes

### 6.1 Implementation Summary

- **Completed**: 2026-02-19
- **Files changed**: 29 total (19 added, 10 modified)
- **Quality gates**: TypeScript typecheck PASS (0 errors), ESLint PASS (0 warnings/errors)

### 6.2 Files Added (19)

| File | Description |
|------|-------------|
| `apps/web/app/(auth)/register/page.tsx` | Registration page |
| `apps/web/app/(auth)/reset-password/page.tsx` | Password reset request page |
| `apps/web/app/(auth)/reset-password/confirm/page.tsx` | Password reset confirm page |
| `apps/web/app/(dashboard)/profile/page.tsx` | Profile settings page |
| `apps/web/components/auth/AuthCard.tsx` | Auth page card wrapper |
| `apps/web/components/auth/LoginForm.tsx` | Login form component |
| `apps/web/components/auth/PasswordResetConfirmForm.tsx` | Password reset confirm form |
| `apps/web/components/auth/PasswordResetForm.tsx` | Password reset request form |
| `apps/web/components/auth/RegisterForm.tsx` | Registration form |
| `apps/web/components/auth/RoleSelector.tsx` | Role selection component |
| `apps/web/components/auth/SocialLoginButtons.tsx` | Social login buttons |
| `apps/web/components/profile/AvatarUpload.tsx` | Avatar upload component |
| `apps/web/components/profile/PasswordChangeForm.tsx` | Password change form |
| `apps/web/components/profile/ProfileForm.tsx` | Profile form |
| `apps/web/components/profile/ProfileSection.tsx` | Profile section wrapper (unplanned addition, see 6.4) |
| `apps/web/hooks/useAuth.ts` | Auth state hook |
| `apps/web/hooks/useCurrentUser.ts` | Current user data hook |
| `apps/web/middleware.ts` | Next.js middleware for route protection |
| `apps/web/types/next-auth.d.ts` | next-auth type augmentation |

### 6.3 Files Modified (10)

| File | Change |
|------|--------|
| `apps/web/app/(auth)/login/page.tsx` | Full implementation from SKELETON |
| `apps/web/app/page.tsx` | Landing page with auth CTAs |
| `apps/web/hooks/index.ts` | Barrel export update |
| `apps/web/lib/api.ts` | Auth header injection added |
| `apps/web/lib/auth.ts` | next-auth v5 full configuration |
| `apps/web/providers/AuthProvider.tsx` | SessionProvider + Zustand store sync |
| `apps/web/src/env.ts` | Social login env vars added |
| `apps/web/stores/auth.store.ts` | role field and clearAuth action added |
| `packages/shared/src/types/auth.types.ts` | Auth types extended |
| `packages/shared/src/validators/auth.schema.ts` | Schemas extended |

### 6.4 Divergence from SPEC

| Item | Type | Notes |
|------|------|-------|
| `components/profile/ProfileSection.tsx` | Minor addition | Utility wrapper component not in original SPEC. Added to improve layout composition within the profile page. No SPEC requirements affected. |
| `hooks/index.ts` barrel export | Minor modification | Barrel export file updated to include new hooks. Trivial change not originally listed in SPEC file table. |

### 6.5 Deferred Items

- **Tests**: No test files were created as part of this implementation. Unit and integration tests for the authentication flow are deferred to a dedicated testing SPEC (to be planned separately).
