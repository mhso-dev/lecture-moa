---
id: SPEC-FE-002
title: "Authentication Flow - Acceptance Criteria"
version: 2.0.0
related_spec: SPEC-FE-002
updated: 2026-02-19
---

# SPEC-FE-002: Authentication Flow - Acceptance Criteria

## Module 1: Auth Infrastructure (AC-FE-101 ~ AC-FE-108)

next-auth v5 설정, JWT 콜백, 세션 관리, API 라우트, 소셜 로그인, 미들웨어 라우트 보호, API 클라이언트 인증 헤더 주입에 대한 인수 기준이다.

---

### AC-FE-101: CredentialsProvider Configuration

**Given** `lib/auth.ts` 파일이 완전히 구현되어 있다
**When** 유효한 이메일과 비밀번호가 credentials provider를 통해 제출되면
**Then** `authorize` 콜백이 백엔드 `POST /api/auth/login` 엔드포인트를 호출하고, user 객체와 access token을 수신하며, 타입이 지정된 `User` 객체를 반환한다

**Given** 잘못된 이메일 또는 비밀번호가 제출되었다
**When** `authorize` 콜백이 자격 증명을 처리하면
**Then** `null`을 반환하고 next-auth가 `/login?error=CredentialsSignin`으로 리다이렉트한다

**Given** 백엔드에 연결할 수 없다
**When** `authorize` 콜백이 API 호출을 시도하면
**Then** 에러를 캐치하고, 민감하지 않은 메시지를 로깅하며, `null`을 반환한다

---

### AC-FE-102: JWT Callback Token Enrichment

**Given** 사용자가 성공적으로 로그인했다
**When** `jwt` 콜백이 `trigger === "signIn"`으로 실행되면
**Then** 반환된 토큰에 백엔드 응답의 `accessToken`, `refreshToken`, `userId`, `role` 필드가 포함된다

**Given** 기존 세션이 읽히고 있다 (sign-in 트리거가 아님)
**When** `jwt` 콜백이 실행되면
**Then** 토큰이 변경 없이 반환된다 (불필요한 백엔드 호출 없음)

**Given** access token이 만료 5분 이내이다
**When** `jwt` 콜백이 요청에서 실행되면
**Then** 콜백이 `refreshToken`을 사용하여 토큰 갱신을 시도한다

---

### AC-FE-103: Session Object Shape

**Given** 사용자가 인증되어 있다
**When** Client Component에서 `useSession()`이 호출되면
**Then** 세션 객체에 `session.user.id`, `session.user.name`, `session.user.email`, `session.user.role`, `session.user.image`, `session.accessToken`이 포함된다

**Given** Server Component에서 `getServerSession()`이 호출된다
**When** 사용자가 인증되어 있으면
**Then** 모든 필수 필드가 올바르게 타입 지정된 동일한 세션 shape가 반환된다

---

### AC-FE-104: NextAuth API Route

**Given** NextAuth 라우트 핸들러가 설정되어 있다
**When** `GET /api/auth/session`이 호출되면
**Then** 인증된 사용자에게는 현재 세션 JSON을, 미인증 사용자에게는 `{}`를 반환한다

**When** `POST /api/auth/signin`이 credentials와 함께 호출되면
**Then** sign-in 플로우를 처리하고 auth 쿠키를 설정한다

**When** `POST /api/auth/signout`이 호출되면
**Then** auth 쿠키를 제거하고 세션을 무효화한다

---

### AC-FE-105: Social Login Optional

**Given** `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=false`이다
**When** 로그인 페이지가 렌더링되면
**Then** `SocialLoginButtons` 컴포넌트가 DOM에 렌더링되지 않는다

**Given** `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true`이고 유효한 OAuth 자격 증명이 설정되어 있다
**When** "Continue with Google" 버튼이 클릭되면
**Then** next-auth가 Google OAuth 플로우를 시작하고 Google 동의 화면으로 리다이렉트한다

---

### AC-FE-106: Unauthenticated Dashboard Redirect

**Given** 사용자가 인증되지 않았다
**When** `/dashboard`로 이동하면
**Then** 미들웨어가 `/login?callbackUrl=%2Fdashboard`로 리다이렉트한다

**Given** 사용자가 인증되지 않았다
**When** `/courses`, `/materials`, `/quizzes`, `/teams`, `/memos`, `/qa` 라우트 중 하나로 이동하면
**Then** 미들웨어가 `/login?callbackUrl={encoded_path}`로 리다이렉트한다

**Given** 사용자가 인증되지 않았다
**When** `/` (랜딩 페이지)로 이동하면
**Then** 미들웨어가 요청을 통과시킨다 (공개 라우트)

---

### AC-FE-107: Auth Page Redirect for Authenticated Users

**Given** 사용자가 인증되어 있다
**When** `/login`으로 이동하면
**Then** 미들웨어가 `/dashboard`로 리다이렉트한다

**Given** 사용자가 인증되어 있다
**When** `/register`로 이동하면
**Then** 미들웨어가 `/dashboard`로 리다이렉트한다

---

### AC-FE-108: API Client Auth Header Injection

**Given** 사용자가 유효한 access token으로 인증되어 있다
**When** API 클라이언트가 백엔드에 요청을 보내면
**Then** 요청에 `Authorization: Bearer {accessToken}` 헤더가 포함된다

**Given** access token이 없거나 만료되었다
**When** API 클라이언트가 요청을 보내면
**Then** 인터셉터가 `signOut()`을 트리거하고 `/login`으로 리다이렉트한다

---

## Module 2: Auth State Management (AC-FE-109 ~ AC-FE-114)

Zustand auth store 상태 관리, 세션 동기화, useAuth 훅, 타입 정의, Zod 스키마 검증, next-auth 타입 확장에 대한 인수 기준이다.

---

### AC-FE-109: Auth Store Initial State

**Given** auth store가 초기화되었다
**When** 세션이 없으면
**Then** `user`는 `null`, `isAuthenticated`는 `false`, `isLoading`은 `true`, `role`은 `null`이다

---

### AC-FE-110: Auth Store Session Synchronization

**Given** 사용자가 로그인했다
**When** `AuthProvider`가 `useSession()`에서 새 세션을 수신하면
**Then** `setUser()`가 세션 user와 함께 호출되어 `isAuthenticated: true`와 `role`을 사용자의 역할로 설정한다

**Given** 사용자가 로그아웃했다
**When** `AuthProvider`가 세션이 `null`임을 감지하면
**Then** `clearAuth()`가 호출되어 모든 상태를 초기값으로 리셋한다

**Given** 세션이 로딩 중이다
**When** `AuthProvider`가 마운트되면
**Then** `isLoading`은 `useSession()`이 resolve될 때까지 `true`를 유지한다

---

### AC-FE-111: useAuth Hook

**Given** 사용자가 인증되어 있다
**When** Client Component에서 `useAuth()`가 호출되면
**Then** `{ user, isAuthenticated: true, role, isLoading: false, signIn, signOut, updateUser }`를 반환한다

**Given** `useAuth().signIn({ email, password })`가 호출되었다
**When** 자격 증명이 유효하면
**Then** next-auth `signIn("credentials")`이 호출되고, auth store가 업데이트되며, 사용자가 리다이렉트된다

**Given** `useAuth().signOut()`이 호출되었다
**When** 실행되면
**Then** next-auth `signOut()`이 호출되고, store에서 `clearAuth()`가 실행되며, 모든 TanStack Query 캐시가 무효화된다

---

### AC-FE-112: Auth Type Definitions

**Given** `packages/shared/src/types/auth.types.ts`가 import되었다
**When** TypeScript가 프로젝트를 컴파일하면
**Then** 모든 타입 (`User`, `UserRole`, `Session`, `LoginRequest`, `RegisterRequest`, `AuthResponse`, `ResetPasswordRequest`, `ResetPasswordConfirmRequest`, `UpdateProfileRequest`, `ChangePasswordRequest`)이 에러 없이 resolve된다

**Given** `UserRole`이 switch 문에서 사용된다
**When** `"admin"` 값이 "student" | "instructor" 컨텍스트에 할당되면
**Then** TypeScript가 타입 에러를 보고한다 (strict enum enforcement)

---

### AC-FE-113: Zod Schema Validation

**Given** `loginSchema.parse({ email: "not-an-email", password: "123" })`가 실행된다
**When** 파싱이 수행되면
**Then** Zod가 `email`과 `password` 필드 모두에 에러가 있는 `ZodError`를 throw한다

**Given** `registerSchema.parse({ name: "a", email: "user@example.com", password: "Password1", confirmPassword: "Password2", role: "student" })`가 실행된다
**When** 파싱이 수행되면
**Then** Zod가 `confirmPassword`에 에러가 있는 `ZodError`를 throw한다 (비밀번호 불일치)

**Given** `changePasswordSchema.parse({ currentPassword: "old", newPassword: "NewPass1", confirmNewPassword: "NewPass1" })`가 실행된다
**When** 파싱이 수행되면
**Then** Zod가 에러 없이 성공적으로 파싱한다

**Given** 모든 스키마에 추론된 타입이 export되어 있다
**When** `type LoginSchema = z.infer<typeof loginSchema>`가 사용되면
**Then** 에러 없이 `{ email: string, password: string }`으로 resolve된다

---

### AC-FE-114: next-auth Type Augmentation

**Given** `types/next-auth.d.ts`의 타입 확장이 로드되어 있다
**When** TypeScript에서 `session.user.role`에 접근하면
**Then** `string | undefined`가 아닌 `UserRole`로 타입 지정되어 있다

**When** `session.accessToken`에 접근하면
**Then** `string | undefined`가 아닌 `string`으로 타입 지정되어 있다

---

## Module 3: Auth Pages (AC-FE-115 ~ AC-FE-126)

로그인 페이지/폼, 회원가입 페이지/폼, RoleSelector, 비밀번호 재설정 요청/확인, 소셜 로그인 버튼, 접근성에 대한 인수 기준이다.

---

### AC-FE-115: Login Page Route

**Given** 사용자가 `/login`으로 이동한다
**When** 페이지가 렌더링되면
**Then** 페이지 제목이 "Login | Lecture Moa"이고 로그인 폼이 표시된다

**Given** 인증된 사용자가 `/login`으로 이동한다
**When** 미들웨어가 요청을 처리하면
**Then** `/dashboard`로 리다이렉트된다 (로그인 폼이 렌더링되지 않음을 확인)

---

### AC-FE-116: Login Form Behavior

**Given** 로그인 폼이 렌더링되어 있다
**When** 사용자가 빈 이메일 필드로 폼을 제출하면
**Then** 이메일 입력 아래에 "Please enter a valid email address" 에러 메시지가 나타난다

**Given** 8자 미만의 비밀번호로 폼이 제출되었다
**When** Zod 검증이 실행되면
**Then** 비밀번호 입력 아래에 "Password must be at least 8 characters" 에러 메시지가 나타난다

**Given** 유효한 자격 증명이 입력되었다
**When** 폼이 제출되면
**Then** 제출 버튼에 로딩 스피너가 표시되고, 버튼이 비활성화되며, 폼을 다시 제출할 수 없다

**Given** 유효한 자격 증명이 제출되었다
**When** 백엔드가 성공 응답을 반환하면
**Then** 사용자가 `callbackUrl` 쿼리 파라미터 값으로 리다이렉트되거나, callback이 없으면 `/dashboard`로 리다이렉트된다

**Given** 잘못된 자격 증명이 제출되었다
**When** next-auth가 `error: "CredentialsSignin"`을 반환하면
**Then** "Invalid email or password" toast 알림이 나타난다

---

### AC-FE-117: Social Login Buttons

**Given** `NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true`이다
**When** 로그인 페이지가 렌더링되면
**Then** "Continue with Google"과 "Continue with GitHub" 버튼이 각각의 아이콘과 함께 표시된다

**Given** "Continue with Google" 버튼이 클릭되었다
**When** 클릭 핸들러가 실행되면
**Then** `next-auth signIn("google")`이 적절한 redirect 설정과 함께 호출된다

---

### AC-FE-118: Login Page Accessibility

**Given** 로그인 페이지가 렌더링되어 있다
**When** axe-core로 접근성 감사가 실행되면
**Then** critical violation이 0개이다

**Given** 로그인 폼에 검증 에러가 있다
**When** 에러 메시지가 나타나면
**Then** `role="alert"` 속성이 있고 `aria-describedby`를 통해 입력 필드에 연결되어 있다

**Given** 사용자가 이메일 입력에서 Tab을 누른다
**When** 폼을 탐색하면
**Then** 포커스가 Email -> Password -> "Forgot password?" 링크 -> Submit 버튼 순서로 이동한다

---

### AC-FE-119: Registration Page Route

**Given** 사용자가 `/register`로 이동한다
**When** 페이지가 렌더링되면
**Then** 페이지 제목이 "Create Account | Lecture Moa"이고 회원가입 폼이 표시된다

**Given** 페이지가 렌더링되어 있다
**When** "Already have an account? Sign in" 링크가 클릭되면
**Then** 사용자가 `/login`으로 이동한다

---

### AC-FE-120: Registration Form Behavior

**Given** 2자 미만의 이름으로 회원가입 폼이 제출되었다
**When** Zod 검증이 실행되면
**Then** "Name must be at least 2 characters" 인라인 에러가 나타난다

**Given** password와 confirmPassword 필드가 일치하지 않는다
**When** 폼이 제출되면
**Then** confirmPassword 필드에 "Passwords don't match" 인라인 에러가 나타난다

**Given** "weakpass" (대문자 없음, 숫자 없음) 비밀번호가 입력되었다
**When** 사용자가 비밀번호 필드에 입력하면
**Then** 비밀번호 강도 표시기가 "Weak" 상태를 표시한다

**Given** 유효한 폼 데이터가 제출되었다
**When** 백엔드 `POST /api/auth/register`가 201을 반환하면
**Then** `signIn("credentials")`이 자동으로 호출되고 사용자가 환영 toast와 함께 `/dashboard`로 리다이렉트된다

**Given** 이메일이 이미 등록되어 있다
**When** 백엔드가 409 conflict 응답을 반환하면
**Then** 이메일 필드에 "An account with this email already exists" 인라인 에러가 나타난다

---

### AC-FE-121: Role Selector Accessibility and Behavior

**Given** RoleSelector가 렌더링되어 있다
**When** 사용자가 Tab을 눌러 역할 선택기에 포커스하면
**Then** 첫 번째 역할 카드가 가시적 포커스 링과 함께 포커스를 받는다

**Given** "instructor" 역할 카드에 포커스가 있다
**When** 사용자가 Space 또는 Enter를 누르면
**Then** instructor 역할이 선택된다 (강조된 테두리, 체크마크 표시)

**Given** "student" 역할 카드에 포커스가 있다
**When** 사용자가 오른쪽 또는 아래쪽 화살표 키를 누르면
**Then** "instructor" 역할 카드로 포커스가 이동한다 (또는 반대), radiogroup 키보드 네비게이션을 따른다

**Given** 역할이 선택되지 않은 상태에서 폼이 제출되었다
**When** Zod 검증이 실행되면
**Then** 역할 선택기 근처에 "Please select your role" 에러가 표시된다

---

### AC-FE-122: Registration Form Accessibility

**Given** 회원가입 폼이 렌더링되어 있다
**When** axe-core 접근성 감사가 실행되면
**Then** critical violation이 0개이다

**Given** 검증 에러가 발생했다
**When** 에러 메시지가 나타나면
**Then** `aria-live="polite"`를 통해 스크린 리더에 전달된다

---

### AC-FE-123: Password Reset Request Page

**Given** 사용자가 `/reset-password`로 이동한다
**When** 페이지가 렌더링되면
**Then** 페이지 제목이 "Reset Password | Lecture Moa"이고 이메일 입력 폼이 표시된다

---

### AC-FE-124: Password Reset Request Form

**Given** 잘못된 이메일 형식이 입력되었다
**When** 폼이 제출되면
**Then** "Please enter a valid email address" 인라인 에러가 나타난다

**Given** 유효한 이메일이 제출되었다
**When** 백엔드가 200을 반환하면
**Then** 폼이 "Check your email for reset instructions" 메시지로 교체된다

**Given** 백엔드가 어떤 응답이든 반환한다 (이메일 열거 방지를 위해)
**When** 폼 제출이 완료되면
**Then** 이메일 존재 여부와 관계없이 항상 동일한 성공 메시지가 표시된다

**Given** "Back to login" 링크가 표시되어 있다
**When** 클릭되면
**Then** 사용자가 `/login`으로 이동한다

---

### AC-FE-125: Password Reset Confirm Page

**Given** 사용자가 `/reset-password/confirm?token=abc123`으로 이동한다
**When** 페이지가 렌더링되면
**Then** 비밀번호 재설정 확인 폼이 token과 함께 표시된다

**Given** 사용자가 token 파라미터 없이 `/reset-password/confirm`으로 이동한다
**When** Server Component가 요청을 처리하면
**Then** 사용자가 `/reset-password`로 리다이렉트된다

---

### AC-FE-126: Password Reset Confirm Form

**Given** 새 비밀번호와 확인 비밀번호 필드가 일치하지 않는다
**When** 폼이 제출되면
**Then** "Passwords don't match" 인라인 에러가 나타난다

**Given** 유효한 token과 일치하는 비밀번호가 제출되었다
**When** 백엔드가 재설정을 성공적으로 확인하면
**Then** 성공 메시지가 표시되고 3초 후 사용자가 자동으로 `/login`으로 리다이렉트된다

**Given** token이 만료되었다
**When** 백엔드가 token 만료를 나타내는 400 또는 401 응답을 반환하면
**Then** "This reset link has expired. Request a new one." 메시지가 `/reset-password` 링크와 함께 표시된다

---

## Module 4: Profile Settings (AC-FE-127 ~ AC-FE-131)

프로필 설정 페이지 라우트 보호, 프로필 폼, 아바타 업로드, 비밀번호 변경, useCurrentUser 훅에 대한 인수 기준이다.

---

### AC-FE-127: Profile Page Route Protection

**Given** 미인증 사용자가 `/profile`로 이동한다
**When** 미들웨어가 요청을 처리하면
**Then** 사용자가 `/login?callbackUrl=%2Fprofile`로 리다이렉트된다

**Given** 인증된 사용자가 `/profile`로 이동한다
**When** 페이지가 렌더링되면
**Then** 현재 이름과 이메일이 프로필 폼에 표시된다 (이메일은 읽기 전용)

---

### AC-FE-128: Profile Form Behavior

**Given** 현재 사용자의 이름으로 프로필 폼이 렌더링되어 있다
**When** 이름이 변경되지 않고 폼이 제출되면
**Then** 제출 버튼이 비활성화된다 (변경사항 없음 감지)

**Given** 새 이름이 입력되고 폼이 제출되었다
**When** 백엔드 `PATCH /api/users/me`가 200을 반환하면
**Then** "Profile updated" 성공 toast가 나타나고, `update()`를 통해 next-auth 세션이 업데이트되며, auth store가 동기화된다

**Given** 백엔드가 에러를 반환한다
**When** 폼 제출이 실패하면
**Then** 에러 메시지와 함께 toast가 나타난다

---

### AC-FE-129: Avatar Upload Behavior

**Given** 사용자가 5MB보다 큰 파일을 선택한다
**When** 파일 입력 change 핸들러가 실행되면
**Then** "File must be smaller than 5MB" 인라인 에러가 나타나고 업로드 요청이 발생하지 않는다

**Given** 사용자가 지원되지 않는 타입의 파일을 선택한다 (예: .gif)
**When** 파일 입력 change 핸들러가 실행되면
**Then** "Please upload a JPEG, PNG, or WebP image" 인라인 에러가 나타난다

**Given** 유효한 이미지 파일이 선택되었다
**When** 파일이 선택되면
**Then** 선택된 이미지의 미리보기가 현재 아바타 표시를 즉시 교체한다 (업로드 전)

**Given** 업로드가 성공적으로 완료되었다
**When** 백엔드가 새 아바타 URL을 반환하면
**Then** 프로필 폼의 image 필드가 업데이트되고 성공 toast가 나타난다

---

### AC-FE-130: Password Change Form Behavior

**Given** 현재 비밀번호가 잘못되었다
**When** 백엔드가 401 응답을 반환하면
**Then** 현재 비밀번호 필드에 "Current password is incorrect" 에러가 나타난다

**Given** 비밀번호 변경이 성공했다
**When** 백엔드가 200을 반환하면
**Then** 세 개의 비밀번호 필드가 모두 비워지고 "Password changed successfully" 성공 toast가 나타난다

**Given** 새 비밀번호와 확인 비밀번호가 일치하지 않는다
**When** 폼이 제출되면
**Then** API 호출 전에 인라인 에러가 나타난다

---

### AC-FE-131: useCurrentUser Hook

**Given** 훅이 인증된 컨텍스트에서 호출되었다
**When** TanStack Query가 `GET /api/users/me`를 fetch하면
**Then** 사용자 데이터가 반환되고 5분간 캐시된다 (stale time)

**Given** API가 401 응답을 반환한다
**When** 훅이 에러를 처리하면
**Then** `useAuth().signOut()`이 자동으로 트리거된다

---

## Module 5: Landing Page Integration & Security (AC-FE-132, AC-FE-133, AC-FE-N10 ~ AC-FE-N14)

랜딩 페이지 인증 CTA 렌더링, 네비게이션, 보안 관련 비허용 동작 요구사항에 대한 인수 기준이다.

---

### AC-FE-132: Landing Page CTA Rendering

**Given** 인증된 사용자가 `/`를 방문한다
**When** Server Component가 세션을 읽으면
**Then** "Go to Dashboard" 버튼이 렌더링된다 ("Get Started"나 "Sign In" 버튼 없음)

**Given** 미인증 사용자가 `/`를 방문한다
**When** Server Component가 세션을 읽는다 (`null` 반환)
**Then** "Get Started" (`/register` 링크)와 "Sign In" (`/login` 링크) 버튼이 렌더링된다

---

### AC-FE-133: Landing Page Navigation

**Given** 미인증 사용자가 "Get Started"를 클릭한다
**When** 버튼이 활성화되면
**Then** 사용자가 `/register`로 이동한다

**Given** 인증된 사용자가 "Go to Dashboard"를 클릭한다
**When** 버튼이 활성화되면
**Then** 사용자가 `/dashboard`로 이동한다

---

### AC-FE-N10: No Client-Side Token Storage

**Given** 사용자가 인증되어 있다
**When** 브라우저 개발자 도구에서 localStorage와 sessionStorage를 검사하면
**Then** 어느 스토리지에도 JWT 토큰이나 access token이 존재하지 않는다 (토큰은 HttpOnly 쿠키에만 저장됨)

---

### AC-FE-N11: No Password Logging

**Given** 로그인 폼이 제출되었다
**When** 브라우저 콘솔과 서버 로그를 검사하면
**Then** 어떤 로그 출력에도 비밀번호, 토큰 또는 민감한 자격 증명이 나타나지 않는다

---

### AC-FE-N12: No Unauthenticated Dashboard Access

**Given** 사용자가 auth 쿠키를 수동으로 삭제한다
**When** 대시보드 라우트를 새로고침하면
**Then** 적절한 `callbackUrl`과 함께 `/login`으로 리다이렉트된다

---

### AC-FE-N13: No Role Bypass

**Given** "student" 역할의 사용자가 인증되어 있다
**When** instructor 전용 URL (예: `/courses/create`)로 수동 이동하면
**Then** `/dashboard`로 리다이렉트되고 "You don't have access to that page" toast가 나타난다

---

### AC-FE-N14: Clean State After Sign-Out

**Given** 사용자가 프로필 데이터가 로드된 상태로 인증되어 있다
**When** `useAuth().signOut()`이 호출되면
**Then** 다음이 모두 수행된다: Zustand auth store가 초기 상태로 리셋되고, TanStack Query 캐시가 클리어되며 (모든 쿼리 무효화), 사용자가 `/`로 리다이렉트된다

---

## 11. Definition of Done

요구사항이 완료된 것으로 간주되는 기준:

1. 구현이 `spec.md`의 요구사항 명세와 일치한다
2. 해당 요구사항의 모든 인수 기준이 통과한다
3. Vitest 단위 테스트가 구현을 커버한다 (85%+ line coverage)
4. TypeScript 에러가 없다 (`tsc --noEmit`이 코드 0으로 종료)
5. ESLint 에러가 없다 (`eslint`이 코드 0으로 종료)
6. 접근성 감사에서 critical violation이 0개이다 (axe-core)
7. 컴포넌트/기능이 375px, 768px, 1280px viewport에서 올바르게 렌더링된다
8. 에러 상태가 처리되고 적절한 사용자 피드백이 렌더링된다
9. 변경사항이 자체 완결적이며 기존 SPEC-FE-001 기능을 깨뜨리지 않는다
