---
id: SPEC-FE-002
title: "Authentication Flow - Implementation Plan"
version: 2.0.0
related_spec: SPEC-FE-002
updated: 2026-02-19
---

# SPEC-FE-002: Authentication Flow - Implementation Plan

## 1. Implementation Strategy

### 1.1 Development Approach

SPEC-FE-002는 SPEC-FE-001이 구축한 foundation 위에서 인증 플로우 전체를 구현한다. Hybrid 방법론을 적용하여, 기존 skeleton/partial 파일에는 DDD(characterization test 선행), 신규 파일에는 TDD(test 선행)를 적용한다.

**DDD 대상 (기존 파일 보강)**:
- lib/auth.ts (SKELETON), auth.store.ts (PARTIAL), AuthProvider.tsx (PLACEHOLDER), login/page.tsx (SKELETON), api/auth/[...nextauth]/route.ts (SKELETON), lib/api.ts (COMPLETE)

**TDD 대상 (신규 파일 생성)**:
- middleware.ts, useAuth.ts, useCurrentUser.ts, next-auth.d.ts
- 모든 auth 컴포넌트 (LoginForm, RegisterForm, RoleSelector, PasswordResetForm, PasswordResetConfirmForm, SocialLoginButtons, AuthCard)
- 모든 profile 컴포넌트 (ProfileForm, AvatarUpload, PasswordChangeForm)
- 모든 신규 페이지 (register, reset-password, profile)

### 1.2 Dependency Order

구현은 하드 의존성을 존중하는 순서로 진행한다. 각 단계는 이전 단계의 산출물에 의존하며, 동일 단계 내 파일은 병렬 작업이 가능하다.

| 순서 | 작업 | 모듈 | 의존 대상 |
|------|------|------|-----------|
| 1 | Shared types/schemas 검증 및 확장 | M2 | 없음 |
| 2 | next-auth v5 config + NextAuth API route | M1 | 순서 1 (스키마 참조) |
| 3 | next-auth 타입 확장 (next-auth.d.ts) | M2 | 순서 2 (세션 shape 확정) |
| 4 | Auth store 보강 (role, clearAuth) | M2 | 순서 1 (UserRole 타입) |
| 5 | AuthProvider 전체 구현 | M2 | 순서 2, 4 (세션 + store) |
| 6 | Middleware (라우트 보호 + 역할 가드) | M1 | 순서 2 (auth 함수) |
| 7 | API client 토큰 주입 | M1 | 순서 2 (세션 토큰) |
| 8 | useAuth hook | M2 | 순서 4, 5 (store + provider) |
| 9 | Auth 페이지 및 폼 컴포넌트 | M3 | 순서 1, 2, 8 (스키마 + auth + hook) |
| 10 | useCurrentUser hook + Profile 페이지/컴포넌트 | M4 | 순서 7, 8 (API client + useAuth) |
| 11 | Landing page 인증 CTA 업데이트 | M5 | 순서 2 (auth 함수) |

---

## 2. Milestones

### Primary Goal: M1 + M2 - Auth Infrastructure & State Management

인증 백본 전체를 구축한다. 이후의 모든 인증 관련 기능이 이 milestone에 의존한다.

**M1 - Auth Infrastructure 산출물** (REQ-FE-101 ~ REQ-FE-108):
- lib/auth.ts: CredentialsProvider 설정, JWT/session 콜백, 페이지 설정 완성
- app/api/auth/[...nextauth]/route.ts: NextAuth 핸들러 연결 완성
- middleware.ts: 보호 라우트 리다이렉트, 인증 라우트 리다이렉트, 역할 가드
- lib/api.ts: Authorization 헤더 자동 주입 로직 추가

**M2 - Auth State Management 산출물** (REQ-FE-109 ~ REQ-FE-114):
- auth.types.ts: 검증 완료, 누락 타입 추가 시 확장
- auth.schema.ts: 검증 완료, updateProfileSchema/changePasswordSchema 추가
- types/next-auth.d.ts: Session/JWT 타입 확장
- auth.store.ts: role 필드, clearAuth() 추가
- AuthProvider.tsx: SessionProvider 래핑, store 동기화
- hooks/useAuth.ts: 인증 상태 및 액션 훅

**Quality Gate**:
- Zod 스키마 단위 테스트: 모든 유효/무효 케이스 통과
- auth store 단위 테스트: 모든 액션 및 상태 전이 통과
- next-auth 콜백 테스트: jwt, session 콜백 mock 테스트 통과
- middleware 단위 테스트: 라우트 매칭 및 리다이렉트 로직 통과
- TypeScript 컴파일 에러 없음 (tsc --noEmit)

---

### Secondary Goal: M3 - Auth Pages

사용자 대면 인증 화면 전체를 구현한다.

**산출물** (REQ-FE-115 ~ REQ-FE-126):
- components/auth/AuthCard.tsx: 인증 페이지 공통 카드 래퍼
- components/auth/LoginForm.tsx + login/page.tsx 완성
- components/auth/RegisterForm.tsx + RoleSelector.tsx + register/page.tsx
- components/auth/PasswordResetForm.tsx + reset-password/page.tsx
- components/auth/PasswordResetConfirmForm.tsx + reset-password/confirm/page.tsx
- components/auth/SocialLoginButtons.tsx (feature-flagged)

**Quality Gate**:
- 모든 폼 컴포넌트가 에러 없이 렌더링
- React Hook Form + Zod 검증이 모든 스키마에서 정상 동작
- 접근성 감사 통과 (axe-core): critical violation 0건
- .pen 디자인 파일과의 시각적 일치 검증
- 반응형 레이아웃: 375px, 768px, 1280px 뷰포트에서 정상 렌더링

---

### Final Goal: M4 + M5 - Profile Settings & Landing Integration

인증된 사용자 경험을 완성하고 랜딩 페이지를 업데이트한다.

**M4 - Profile Settings 산출물** (REQ-FE-127 ~ REQ-FE-131):
- hooks/useCurrentUser.ts: TanStack Query 기반 사용자 데이터 훅
- components/profile/ProfileForm.tsx: 프로필 정보 폼
- components/profile/AvatarUpload.tsx: 아바타 업로드
- components/profile/PasswordChangeForm.tsx: 비밀번호 변경 폼
- app/(dashboard)/profile/page.tsx: 프로필 설정 페이지

**M5 - Landing Page Integration & Security 산출물** (REQ-FE-132 ~ REQ-FE-133, N10 ~ N14):
- app/page.tsx: 인증 상태 감지 + CTA 업데이트
- 보안 요구사항 검증: 클라이언트 토큰 미저장, 비밀번호 미로깅, 역할 우회 방지, 로그아웃 후 상태 정리

**Quality Gate**:
- Profile 페이지: 인증된 사용자만 접근 가능 (middleware 검증)
- 아바타 업로드: 클라이언트 사이드 미리보기 동작
- 모든 에러 상태: 적절한 ARIA 속성과 함께 렌더링
- 보안 테스트: localStorage/sessionStorage에 토큰 미저장 확인
- 로그아웃 후: Zustand store 초기화, TanStack Query 캐시 무효화, 랜딩 페이지 리다이렉트

---

### Optional Goal: Social Login

Google 및 GitHub OAuth 플로우를 구현한다.

**산출물**:
- lib/auth.ts에 GoogleProvider, GitHubProvider 추가 (환경 변수 플래그 기반)
- SocialLoginButtons.tsx와 프로바이더 연결
- 환경 변수 문서화

**Quality Gate**:
- NEXT_PUBLIC_ENABLE_SOCIAL_LOGIN=true일 때만 소셜 로그인 버튼 렌더링
- OAuth 리다이렉트 플로우가 개발 환경에서 테스트 자격 증명으로 정상 동작

---

## 3. Technical Approach

### 3.1 Authentication Architecture

인증 아키텍처는 Browser, Next.js App, Backend API 세 계층으로 구성된다.

**인증 플로우**: 브라우저에서 자격 증명이 POST /api/auth/callback/credentials 경로로 전송되면, Next.js App의 CredentialsProvider authorize 콜백이 백엔드 POST /api/auth/login을 호출한다. 백엔드가 user 객체와 accessToken을 반환하면, jwt 콜백이 이를 JWT에 보강하고, session 콜백이 클라이언트 접근 가능한 세션 shape로 매핑한다. 최종적으로 HttpOnly, Secure 쿠키로 next-auth 세션이 설정된다.

**클라이언트 상태 동기화**: AuthProvider가 useSession()을 구독하여 세션 변경 시 Zustand auth store의 setUser()를 호출하고, 로그아웃 시 clearAuth()를 호출한다. 이로써 Client Component 어디에서든 useAuthStore selector를 통해 동기적으로 인증 상태에 접근할 수 있다.

**토큰 전파**: API 클라이언트의 요청 인터셉터가 세션에서 accessToken을 읽어 Authorization: Bearer 헤더를 자동 주입한다. 서버 사이드에서는 auth() 함수, 클라이언트 사이드에서는 getSession()을 사용한다.

### 3.2 Architecture Decisions

**Decision 1: JWT Strategy over Database Sessions**

session.strategy를 "jwt"로 설정한다. 백엔드 Fastify API도 JWT 기반 인가를 사용하므로, next-auth JWT에 백엔드 access token을 저장하면 깔끔한 토큰 전파 경로가 만들어진다. 데이터베이스 세션은 별도의 세션 테이블 인프라가 필요하므로 배제한다. Trade-off: JWT 개별 폐기가 불가하므로, 짧은 만료 시간(15분)과 refresh token rotation으로 완화한다.

**Decision 2: Zustand Mirror Store alongside next-auth Session**

next-auth 세션과 별도로 Zustand auth store를 동기화 유지한다. useSession()은 Client Component에서만 사용 가능하고, 비 React 코드나 selector 기반 조건부 렌더링에는 Zustand store가 더 적합하다. AuthProvider가 유일한 동기화 지점이며, AuthProvider 외부에서의 직접 store 변경은 금지한다. Trade-off: 경미한 상태 중복이 발생하지만, 단일 동기화 지점으로 일관성을 보장한다.

**Decision 3: Middleware-First Route Protection**

개별 페이지의 getServerSession() 체크 대신 middleware.ts에서 중앙화된 라우트 보호를 수행한다. 미들웨어 방식은 페이지가 실수로 보호 없이 노출될 가능성을 제거한다. Trade-off: 미들웨어가 매칭 패턴의 모든 요청에 실행되지만, 교육 플랫폼의 중간 수준 트래픽에서 성능 비용은 무시할 수 있다.

### 3.3 Form Validation Strategy

모든 폼은 schema-first 접근법을 따른다. Zod 스키마를 packages/shared/src/validators/auth.schema.ts에 정의하고, 해당 스키마에서 TypeScript 타입을 추론한다. React Hook Form의 zodResolver에 스키마를 전달하여 useForm을 구성하며, formState.errors에서 필드별 에러를 렌더링한다. 이 방식으로 클라이언트와 서버 간 검증 로직을 일원화한다.

### 3.4 Error Handling Strategy

| 에러 소스 | 처리 위치 | 사용자 피드백 |
|----------|----------|-------------|
| Zod 검증 실패 | 필드 레벨 | 입력 필드 아래 인라인 에러 메시지 |
| API 4xx 에러 | 폼 제출 핸들러 | Toast 알림 |
| API 5xx 에러 | 폼 제출 핸들러 | Toast: "Something went wrong, try again" |
| 네트워크 에러 | API 클라이언트 인터셉터 | Toast: "Unable to connect" |
| Auth 에러 | next-auth error page 경유 /login?error= | 로그인 페이지 마운트 시 Toast |
| 파일 크기 초과 | 파일 입력 change 핸들러 | 인라인 에러: "File must be smaller than 5MB" |
| 잘못된 파일 타입 | 파일 입력 change 핸들러 | 인라인 에러: "Please upload a JPEG, PNG, or WebP image" |
| 만료된 재설정 토큰 | API 응답 처리 | 페이지 메시지 + 새 재설정 요청 링크 |
| 미인가 역할 접근 | Middleware | 대시보드 리다이렉트 + Toast |

### 3.5 Responsive Layout Strategy

(auth) 레이아웃은 모든 인증 페이지에 중앙 정렬 카드 레이아웃을 제공한다.

| Breakpoint | Width | 레이아웃 |
|-----------|-------|---------|
| Mobile | 375px+ | 전체 너비 카드, 16px 수평 패딩, 뷰포트 대부분 차지 |
| Tablet | 768px+ | max-w-md 중앙 카드, 수직 중앙 정렬 |
| Desktop | 1280px+ | 로그인/회원가입 분할 레이아웃(왼쪽 히어로, 오른쪽 폼) 또는 max-w-md 중앙 카드 (.pen 디자인 사양에 따름) |

(dashboard) 레이아웃의 프로필 페이지는 사이드바 네비게이션 내에서 콘텐츠 영역에 폼을 배치한다.

### 3.6 Testing Strategy

| 테스트 대상 | 도구 | Coverage 목표 |
|-----------|------|-------------|
| Zod 스키마 | Vitest | 100% - 모든 유효/무효 케이스 |
| Zustand store | Vitest | 100% - 모든 액션 및 상태 전이 |
| next-auth 콜백 | Vitest (mock) | 90% - jwt, session 콜백 |
| Middleware | Vitest | 90% - 라우트 매칭, 리다이렉트 로직 |
| React 컴포넌트 | React Testing Library | 85% - 렌더링, 인터랙션, 에러 상태 |
| 폼 제출 | React Testing Library | 85% - 제출, 성공, 에러 경로 |
| 접근성 | jest-axe / axe-core | critical violation 0건 |

백엔드 미구현 상태를 고려하여, Vitest 테스트에서는 MSW(Mock Service Worker)를 사용하여 API 응답을 mock한다. 개발 환경에서는 필요 시 apps/web/app/api/mock/ 경로에 mock API 핸들러를 생성한다.

---

## 4. Risk and Mitigation

### Risk 1: next-auth v5 API Differences

**리스크**: next-auth v5는 v4 대비 breaking change가 있으며, 문서가 불완전할 수 있다.

**완화 방안**: Context7 MCP를 사용하여 lib/auth.ts 구현 전 최신 next-auth v5 문서를 조회한다. 최소한의 CredentialsProvider 설정으로 시작하여 점진적으로 확장한다. 의존 컴포넌트를 만들기 전에 로컬에서 인증 플로우를 테스트한다.

### Risk 2: Backend API Unavailability During Development

**리스크**: Fastify 백엔드(apps/api)가 이 SPEC 실행 시점에 구현되지 않았을 수 있다.

**완화 방안**: 로컬 개발용 mock API 핸들러를 apps/web/app/api/mock/ 경로에 생성한다. Vitest 테스트에서 MSW를 사용하여 API 응답을 mock한다. Mock 엔드포인트를 명확히 문서화하여 향후 제거를 용이하게 한다.

### Risk 3: next-auth Cookie vs JWT Token Propagation

**리스크**: next-auth JWT에서 API 클라이언트로의 access token 전달에 edge case가 있을 수 있다.

**완화 방안**: API 라우트에서 next-auth의 getToken 함수를 사용하여 서버 사이드에서 JWT를 추출한다. Server Component와 Client Component 양쪽 컨텍스트에서 토큰 전파를 테스트한다. 개발 모드에서 민감하지 않은 토큰 존재/부재 여부를 로깅한다.

### Risk 4: Design File Visual Discrepancy

**리스크**: .pen 디자인 파일은 Pencil MCP를 통해 검사해야 하며, 시각적 세부사항이 불명확할 수 있다.

**완화 방안**: SPEC-UI-001의 컴포넌트 토큰을 기준 스타일링으로 참조한다. shadcn/ui 기본 variant를 디자인 토큰에 맞춰 폼과 카드에 적용한다. 초기 구현 후 시각적 불일치를 디자인 리뷰 항목으로 플래그한다.

---

## 5. Expert Consultation Recommendations

이 SPEC은 frontend 도메인 집중형이지만, 다음 영역에서 전문가 자문이 유익할 수 있다:

**expert-frontend**: Auth 페이지 구현 시 React 19 Server/Client Component 패턴, next-auth v5 통합 패턴, 접근성 구현 검토

**expert-security**: JWT 토큰 전파 전략, 클라이언트 사이드 보안 요구사항(N10~N14) 구현 검증, OWASP 인증 패턴 준수 확인

**design-uiux**: .pen 디자인 파일과의 시각적 일치 검증, WCAG 2.1 AA 준수 확인, 반응형 레이아웃 전략 리뷰

---

## 6. Module-Requirement Traceability

| Milestone | 모듈 | Requirements | 산출 파일 수 |
|-----------|------|-------------|-------------|
| Primary Goal | M1: Auth Infrastructure | REQ-FE-101 ~ REQ-FE-108 | 4 (lib/auth.ts, route.ts, middleware.ts, lib/api.ts) |
| Primary Goal | M2: Auth State Management | REQ-FE-109 ~ REQ-FE-114 | 6 (auth.types.ts, auth.schema.ts, next-auth.d.ts, auth.store.ts, AuthProvider.tsx, useAuth.ts) |
| Secondary Goal | M3: Auth Pages | REQ-FE-115 ~ REQ-FE-126 | 10 (LoginForm, RegisterForm, RoleSelector, PasswordResetForm, PasswordResetConfirmForm, SocialLoginButtons, AuthCard, login/page, register/page, reset-password pages) |
| Final Goal | M4: Profile Settings | REQ-FE-127 ~ REQ-FE-131 | 5 (ProfileForm, AvatarUpload, PasswordChangeForm, profile/page, useCurrentUser) |
| Final Goal | M5: Landing & Security | REQ-FE-132 ~ REQ-FE-133, N10 ~ N14 | 1 (app/page.tsx) + 보안 검증 |
| Optional Goal | Social Login | REQ-FE-105, REQ-FE-117 | 2 (lib/auth.ts 확장, SocialLoginButtons 연결) |
