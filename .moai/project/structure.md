# Project Structure: lecture-moa

## Overview

lecture-moa uses a monorepo architecture managed with pnpm workspaces and Turborepo. The project is organized into three primary areas: a Next.js frontend application, a Python FastAPI AI microservice, and a shared package for types, utilities, and constants. Backend responsibilities (authentication, database, real-time, storage) are delegated to Supabase, whose configuration and migrations live in the top-level supabase/ directory.

## Directory Structure

```
lecture-moa/
├── apps/
│   ├── web/                          # Next.js frontend application
│   │   ├── app/                      # App Router pages and layouts
│   │   │   ├── (auth)/               # Authentication route group
│   │   │   │   ├── login/
│   │   │   │   └── register/
│   │   │   ├── (dashboard)/          # Dashboard route group
│   │   │   │   ├── instructor/
│   │   │   │   └── student/
│   │   │   ├── courses/              # Course browsing and management
│   │   │   │   └── [courseId]/
│   │   │   │       ├── materials/
│   │   │   │       │   └── [materialId]/
│   │   │   │       ├── quizzes/
│   │   │   │       └── teams/
│   │   │   ├── api/                  # Next.js API routes (webhooks, BFF)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── components/               # React components
│   │   │   ├── auth/                 # Login, Register, Password Reset forms; AuthCard wrapper; SocialLoginButtons; RoleSelector
│   │   │   ├── profile/              # ProfileForm, AvatarUpload, PasswordChangeForm, ProfileSection
│   │   │   ├── course/               # Course cards, lists
│   │   │   ├── dashboard/            # Dashboard widgets, charts
│   │   │   ├── editor/               # Markdown editor components
│   │   │   ├── material/             # Lecture material viewer
│   │   │   │   ├── HighlightPopup/   # Text highlight Q&A popup
│   │   │   │   └── MarkdownRenderer/ # Markdown rendering engine
│   │   │   ├── memo/                 # Memo and note components
│   │   │   ├── qa/                   # Q&A thread components
│   │   │   ├── quiz/                 # Quiz display and submission
│   │   │   ├── team/                 # Team management UI
│   │   │   └── ui/                   # Shared UI primitives
│   │   ├── hooks/                    # Custom React hooks
│   │   │   ├── useAuth.ts            # Auth state and actions (signIn, signOut, updateUser)
│   │   │   └── useCurrentUser.ts     # Current user profile data via TanStack Query
│   │   ├── middleware.ts             # Next.js middleware for route protection and role-based guards
│   │   ├── lib/                      # Client-side utilities
│   │   │   ├── supabase/             # Supabase client configuration and query layers
│   │   │   │   ├── client.ts         # Browser-side Supabase client (singleton)
│   │   │   │   ├── server.ts         # Server-side Supabase client (RSC, Route Handlers, Server Actions)
│   │   │   │   ├── middleware.ts     # Auth session refresh helper for Next.js middleware
│   │   │   │   ├── courses.ts        # Course domain Supabase query functions (SPEC-BE-003)
│   │   │   │   ├── materials.ts      # Material domain Supabase query functions (SPEC-BE-003)
│   │   │   │   ├── storage.ts        # Storage upload/download helpers (SPEC-BE-003)
│   │   │   │   ├── qa.ts             # Q&A domain Supabase query functions with camelCase mapping (SPEC-BE-004)
│   │   │   │   └── realtime.ts       # Supabase Realtime channel create/subscribe/unsubscribe utilities (SPEC-BE-004)
│   │   │   └── api.ts                # API client helpers for Edge Function calls
│   │   ├── providers/                # React context providers
│   │   ├── styles/                   # Global styles and themes
│   │   ├── types/
│   │   │   └── supabase.ts           # Auto-generated database types (supabase gen types typescript)
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── ai/                           # Python FastAPI AI service
│       ├── app/
│       │   ├── main.py               # FastAPI application entry
│       │   ├── config.py             # Configuration management
│       │   ├── routers/              # API route handlers
│       │   │   ├── quiz.py           # Quiz generation endpoints
│       │   │   ├── qa.py             # Q&A assistant endpoints
│       │   │   └── analysis.py       # Material analysis endpoints
│       │   ├── chains/               # LangChain chain definitions
│       │   │   ├── quiz_generator.py
│       │   │   ├── qa_assistant.py
│       │   │   └── material_analyzer.py
│       │   ├── prompts/              # LLM prompt templates
│       │   ├── models/               # Pydantic models
│       │   └── services/             # Business logic
│       ├── tests/
│       ├── pyproject.toml
│       ├── Dockerfile
│       └── README.md
│
├── supabase/                         # Supabase project configuration
│   ├── migrations/                   # Database migrations (SQL, version-controlled)
│   │   └── 20240101000000_initial_schema.sql
│   ├── functions/                    # Supabase Edge Functions (Deno/TypeScript)
│   │   ├── quiz-generate/            # AI quiz generation proxy
│   │   │   └── index.ts
│   │   ├── qa-suggest/               # AI Q&A suggestion proxy
│   │   │   └── index.ts
│   │   ├── material-analyze/         # AI material analysis proxy
│   │   │   └── index.ts
│   │   └── _shared/                  # Shared Edge Function utilities
│   │       ├── auth.ts               # JWT validation helpers
│   │       └── ai-client.ts          # FastAPI AI service client
│   ├── seed.sql                      # Database seed data for local development
│   └── config.toml                   # Supabase local development configuration
│
├── packages/
│   └── shared/                       # Shared package
│       ├── src/
│       │   ├── types/                # Shared TypeScript types
│       │   │   ├── auth.types.ts
│       │   │   ├── course.types.ts
│       │   │   ├── material.types.ts
│       │   │   ├── qa.types.ts
│       │   │   ├── memo.types.ts
│       │   │   ├── quiz.types.ts
│       │   │   ├── team.types.ts
│       │   │   ├── dashboard.types.ts
│       │   │   └── api.types.ts      # API request/response types
│       │   ├── constants/            # Shared constants
│       │   │   ├── roles.ts
│       │   │   ├── permissions.ts
│       │   │   └── realtime.ts       # Supabase Realtime channel and event names
│       │   ├── validators/           # Shared validation schemas (Zod)
│       │   │   ├── auth.schema.ts
│       │   │   ├── course.schema.ts
│       │   │   └── quiz.schema.ts
│       │   └── utils/                # Shared utility functions
│       │       ├── markdown.ts
│       │       └── date.ts
│       ├── tsconfig.json
│       └── package.json
│
├── docs/                             # Project documentation (Nextra)
│   ├── pages/
│   └── theme.config.tsx
│
├── .moai/                            # MoAI-ADK configuration
│   ├── config/
│   ├── project/
│   └── specs/
│
├── .claude/                          # Claude Code configuration
│   ├── agents/
│   ├── rules/
│   └── skills/
│
├── turbo.json                        # Turborepo configuration
├── pnpm-workspace.yaml               # pnpm workspace definition
├── package.json                      # Root package.json
├── tsconfig.base.json                # Base TypeScript configuration
├── .env.example                      # Environment variable template
├── .gitignore
├── CLAUDE.md
└── README.md
```

## Directory Purposes

### apps/web/ - Frontend Application
The Next.js application using the App Router for file-system-based routing. Route groups with parentheses organize authentication pages, dashboard views, and course content separately. Components are organized by domain feature (auth, course, material, qa, quiz, team) with shared UI primitives in the ui directory. The HighlightPopup and MarkdownRenderer components are critical to the core user experience of inline Q&A on lecture materials.

All data access goes through the Supabase client libraries configured in lib/supabase/. Server-side pages and actions use the server client, while client components use the browser client. Authentication state is managed through @supabase/ssr cookie helpers in the Next.js middleware.

### apps/ai/ - AI Service
A separate Python FastAPI microservice responsible for all LLM-powered features. Contains LangChain chain definitions for quiz generation, Q&A assistance, and material analysis. Organized with FastAPI routers for endpoint handling, a chains directory for LangChain orchestration logic, prompt templates for LLM interactions, Pydantic models for request/response validation, and a services layer for business logic.

The AI service does not communicate directly with the frontend. It is accessed exclusively through Supabase Edge Functions, which validate the user's Supabase Auth JWT before proxying the request to the AI service using an internal API key. The AI service is deployed as its own Docker container.

### supabase/ - Supabase Project Configuration
Contains all Supabase-managed resources tracked in version control. The migrations/ directory holds SQL migration files that define and evolve the database schema. These are applied in sequence by the Supabase CLI and represent the authoritative history of the database schema.

The functions/ directory contains Supabase Edge Functions written in Deno TypeScript. Each top-level subdirectory (quiz-generate, qa-suggest, material-analyze) corresponds to a separately deployed Edge Function that acts as a secure proxy to the Python AI service. The _shared/ directory contains utilities shared across multiple Edge Functions, such as JWT validation helpers and the AI service HTTP client.

### packages/shared/ - Shared Package
Contains TypeScript types, constants, validation schemas, and utilities shared between the frontend and Edge Functions. Using Zod for validation schemas ensures consistent validation rules on both client and server. The types directory provides a single source of truth for all data structures used across the application. Database-level types are auto-generated from the Supabase schema and stored in apps/web/types/supabase.ts.

### docs/ - Documentation
A Nextra-based documentation site for developer and user documentation. Organized with file-system routing for automatic navigation generation.

## Module Organization Strategy

### Supabase-Centric Architecture
The architecture is organized around Supabase as the central backend platform rather than a custom application server. Domain logic is distributed across three layers:

- **Database layer**: Schema definitions, constraints, indexes, and Row Level Security policies in supabase/migrations/
- **Edge Function layer**: Complex business logic, external service integration, and AI feature proxying in supabase/functions/
- **Frontend layer**: UI rendering, client-side state, and direct Supabase client calls in apps/web/

This eliminates the traditional controller-service-repository pattern of a Node.js backend. For simple CRUD operations, the frontend queries the Supabase database directly using the typed client and RLS policies enforce authorization. For complex operations requiring server-side logic, Edge Functions provide a lightweight serverless compute layer.

### Authorization Strategy
Authorization is enforced at the database layer through PostgreSQL Row Level Security policies defined in migrations. Each table has RLS policies that reference the authenticated user's JWT claims to filter rows automatically. Edge Functions validate the Supabase Auth JWT before processing requests, applying an additional application-level authorization check where needed.

### Shared Code Strategy
Code shared across the application lives in two places:
- **packages/shared/**: For types, validators, and constants shared between the frontend and Edge Functions
- **supabase/functions/_shared/**: For Edge Function utilities shared across multiple serverless functions

### Real-Time Architecture
Real-time features are implemented using Supabase Realtime channels rather than a custom WebSocket server. The frontend subscribes to Realtime channels corresponding to specific database tables or custom broadcast channels. When database rows change (for example, a new Q&A question is inserted), Supabase Realtime automatically pushes the change to subscribed clients. Channel and event names are defined as constants in packages/shared/constants/realtime.ts to ensure consistency between the frontend subscription setup and the database event source.
