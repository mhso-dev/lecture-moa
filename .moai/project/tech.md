# Technology Stack: lecture-moa

## Overview

lecture-moa is built as a TypeScript monorepo with a Next.js frontend, Supabase as the backend platform, a Python FastAPI AI microservice, and a shared types/utilities package. The stack prioritizes developer experience, type safety, real-time capabilities, and extensibility for AI features. Rather than building and operating a custom backend server, the project leverages Supabase as a fully managed Backend-as-a-Service platform that provides authentication, a PostgreSQL database, real-time subscriptions, file storage, and serverless edge functions in a single integrated offering.

## Frontend

### Next.js 15 (App Router)
**Rationale**: Next.js provides server-side rendering for SEO and initial load performance, file-system-based routing for intuitive page organization, React Server Components for optimized data fetching, and built-in API routes useful for backend-for-frontend patterns and webhook handling.

### React 19
**Rationale**: The dominant UI library with the largest ecosystem. React 19 brings improved server component support and concurrent features that benefit the interactive highlighting and Q&A popup experiences.

### Tailwind CSS 4
**Rationale**: Utility-first CSS framework that enables rapid UI development with consistent design tokens. Works well with component libraries and supports responsive design out of the box.

### shadcn/ui
**Rationale**: High-quality, accessible, and customizable UI component library built on Radix UI primitives. Not a dependency but rather copy-paste components that can be fully customized. Provides consistent design for forms, modals, dropdowns, and other UI elements.

### Markdown Rendering: react-markdown + remark/rehype
**Rationale**: react-markdown provides a React-native Markdown rendering pipeline. Combined with remark plugins (for parsing extensions) and rehype plugins (for HTML transformations), it supports GFM, syntax highlighting, math expressions, and custom rendering needed for the text highlighting and Q&A popup feature.

Key plugins:
- remark-gfm: GitHub Flavored Markdown support
- remark-math + rehype-katex: Mathematical expression rendering
- rehype-highlight or rehype-prism-plus: Code syntax highlighting
- Custom rehype plugin: Text selection and highlight anchor support

Custom rehype plugin pattern (SPEC-FE-009):
The project implements HAST-level text transformation via custom rehype plugins. `rehype-qa-highlights` walks the HAST tree, locates text nodes within the target heading scope, wraps matched text in `<mark>` elements with `data-*` attributes, and skips code/pre blocks to prevent false positives. The sanitize schema is extended to allow `mark` tags with the custom `data-*` attributes while maintaining XSS protection. Slug generation logic is extracted to a shared utility (`lib/markdown/utils/slug.ts`) so the plugin and the MarkdownRenderer component produce identical heading IDs.

### State Management: Zustand
**Rationale**: Lightweight, TypeScript-friendly state management with minimal boilerplate. Suitable for managing client-side state such as active highlights, popup visibility, memo drafts, and Supabase Realtime subscription state. Simpler than Redux for the scope of this application.

### Data Fetching: TanStack Query (React Query) v5
**Rationale**: Provides caching, background refetching, optimistic updates, and pagination support for API interactions. Reduces boilerplate compared to manual fetch management and integrates well with Supabase Realtime for live data updates.

### Form Handling: React Hook Form + Zod
**Rationale**: React Hook Form provides performant form management with minimal re-renders. Zod schemas from the shared package are reused for client-side validation, ensuring consistency with server-side validation enforced by Supabase Edge Functions.

## Backend Platform: Supabase

Supabase is a fully managed open-source Firebase alternative built on PostgreSQL. Rather than maintaining a custom Node.js backend, the project delegates authentication, database access, real-time communication, file storage, and serverless compute to Supabase. This eliminates the operational overhead of running and scaling a backend server while providing enterprise-grade infrastructure.

### PostgreSQL Database
**Rationale**: Supabase provides a fully managed PostgreSQL 16 database. PostgreSQL supports complex queries, full-text search (useful for searching lecture materials and Q&A), JSON/JSONB columns (useful for flexible memo content and quiz configurations), and strong data integrity through foreign keys and constraints. Database schema changes are managed via SQL migrations tracked in the supabase/migrations/ directory.

Key features leveraged:
- Full-text search for lecture material and Q&A search
- JSONB columns for flexible quiz question formats and memo metadata
- Row Level Security (RLS) policies for multi-tenant authorization
- Excellent Supabase client library support with auto-generated TypeScript types

### Authentication: Supabase Auth
**Rationale**: Supabase Auth replaces NextAuth.js as the authentication provider. It handles credential-based login, session management, and JWT token issuance natively integrated with the database. Role-based access control is enforced through custom JWT claims and Row Level Security policies, eliminating the need for a separate authentication middleware layer. The @supabase/ssr package provides helper utilities for session management in Next.js App Router environments, including server components, API routes, and middleware.

### Row Level Security (RLS)
**Rationale**: PostgreSQL Row Level Security policies, enabled and managed through Supabase, enforce authorization rules at the database layer rather than in application code. This ensures that even if application logic is bypassed, database rows are never exposed to unauthorized users. RLS policies leverage the authenticated user's JWT claims to filter data automatically on every query.

### Supabase Realtime
**Rationale**: Supabase Realtime replaces the custom WebSocket server by providing managed WebSocket channels backed by PostgreSQL's logical replication. Clients subscribe to channels and receive updates when database rows change. This eliminates the need for a separate Redis pub/sub layer to scale WebSocket connections across multiple server instances.

Use cases:
- Q&A notification delivery to instructors when new questions are posted
- Live comment and thread updates for students viewing the same material
- Team collaboration synchronization for shared memo editing
- Dashboard data live refresh

### Supabase Storage
**Rationale**: Supabase Storage provides an S3-compatible object storage service integrated with Supabase Auth for access control. Storage bucket policies use the same RLS concepts as the database, ensuring that file access is governed by the same authorization rules. Eliminates the need for a separate file storage service.

Use cases:
- Lecture material attachments and uploaded files
- User avatar images
- Course cover images

### Supabase Edge Functions
**Rationale**: Edge Functions are Deno-based TypeScript serverless functions deployed to Supabase's global edge network. They handle complex business logic that cannot be expressed as database queries or RLS policies, and serve as the secure proxy layer between the frontend and the Python AI service. Edge Functions validate Supabase Auth JWTs, apply rate limiting, and then call the FastAPI service using an internal API key, preventing the AI service from being exposed publicly.

Key use cases:
- AI feature proxy: Validates user authentication, forwards requests to the Python FastAPI service with an internal API key, and returns results to the client
- Complex business logic: Operations requiring transactional behavior across multiple tables
- Webhook handlers: Processing external events from third-party services

### Communication Pattern
The frontend communicates directly with Supabase for all standard operations (data reads, writes, authentication, real-time subscriptions, and file uploads). For AI-powered features, the frontend calls a Supabase Edge Function, which validates the request and proxies it to the Python FastAPI AI service using an internal API key. This keeps the FastAPI service off the public internet and centralizes authentication enforcement in the Edge Function layer.

```
Client → Supabase (Auth, DB, Realtime, Storage)
Client → Supabase Edge Function → FastAPI AI Service (internal, API key protected)
```

### Client Libraries
- **@supabase/supabase-js**: The primary JavaScript client for all Supabase services. Provides typed clients for database queries, authentication, realtime subscriptions, and storage operations.
- **@supabase/ssr**: Server-Side Rendering helpers for Next.js App Router. Provides utilities for creating Supabase clients in Server Components, API Route Handlers, Server Actions, and Next.js Middleware with proper cookie-based session management.

## AI Service

### Python FastAPI Microservice
**Rationale**: AI/ML features are served by a separate Python FastAPI microservice rather than being embedded in Edge Functions. Python provides access to the richest AI/ML ecosystem, including LangChain, Hugging Face, and other advanced libraries. This separation enables independent scaling, deployment, and development of AI features.

Key architecture decisions:
- **Separate process**: The AI service runs as its own Docker container, not directly accessible from the public internet
- **Python 3.13+**: Leverages the latest Python features and performance improvements
- **FastAPI**: High-performance async web framework with automatic OpenAPI documentation, request validation via Pydantic, and native async/await support
- **LangChain (Python)**: The Python version of LangChain provides the most comprehensive LLM orchestration capabilities, including chain composition, prompt management, output parsers, and memory management
- **Internal API key**: The AI service requires an internal API key for all requests, ensuring only Edge Functions can call it

### Use Cases
- **Quiz Generation**: Takes lecture material as input, generates quiz questions with answers
- **Q&A Assistant**: Provides initial AI-powered answers to student questions based on lecture content
- **Material Analyzer**: Summarizes lecture content, extracts key concepts, suggests study focus areas

### LLM Provider: OpenAI API (default, configurable)
**Rationale**: Widely available, well-documented, and supported by LangChain. The provider is abstracted through LangChain so it can be swapped for Anthropic Claude, Google Gemini, or local models without code changes.

## Build and Development Tools

### pnpm
**Rationale**: Fast, disk-efficient package manager with built-in workspace support for monorepos. Strict dependency resolution prevents phantom dependencies. Faster than npm and yarn for installation.

### Turborepo
**Rationale**: High-performance monorepo build system that provides:
- Parallel task execution across packages
- Intelligent caching (local and remote) for faster builds
- Dependency-aware task ordering
- Incremental builds that only rebuild changed packages

### TypeScript 5.x
**Rationale**: Strict type checking across the entire codebase with shared type definitions. Supabase auto-generates TypeScript types from the database schema via `supabase gen types typescript`, providing end-to-end type safety from database to frontend. Project references in tsconfig enable efficient incremental compilation across packages.

### ESLint + Prettier
**Rationale**: ESLint for code quality rules and Prettier for consistent formatting. Shared configuration at the root level ensures consistency across all packages.

### Vitest
**Rationale**: Fast, TypeScript-native testing framework compatible with the Vite ecosystem. Provides Jest-compatible API with better performance and ESM support. Used for frontend component testing and Edge Function unit testing.

### Playwright
**Rationale**: End-to-end testing framework for testing critical user flows including the text highlighting and Q&A popup interaction, which requires precise DOM interaction testing.

### Supabase CLI
**Rationale**: The Supabase CLI provides local development with a full Supabase stack running in Docker (PostgreSQL, Auth, Storage, Realtime, Edge Functions). It manages database migrations, generates TypeScript types from the schema, and handles Edge Function deployment. This replaces the need for manual Docker Compose orchestration of individual backend services.

## Infrastructure and Deployment

### Supabase Hosted Platform
**Rationale**: The Supabase cloud platform provides managed hosting for the PostgreSQL database, authentication service, realtime engine, storage service, and edge function runtime. No infrastructure provisioning or server management is required. Supabase handles backups, scaling, and availability.

### Docker (AI Service Only)
**Rationale**: Docker is used exclusively for the Python FastAPI AI service, which requires a containerized Python environment with its dependencies. The Docker container is deployed to a container hosting service and communicates with Supabase Edge Functions via internal API key authentication.

### Environment Management: dotenv + @t3-oss/env-nextjs
**Rationale**: Type-safe environment variable validation using Zod schemas. Prevents runtime errors from missing or malformed environment variables. The @t3-oss/env package provides build-time validation.

## Key Dependencies Summary

### Frontend (apps/web)
- next: 15.x
- react: 19.x
- tailwindcss: 4.x
- @radix-ui/*: UI primitives (via shadcn/ui)
- react-markdown: Markdown rendering
- remark-gfm, remark-math: Markdown extensions
- rehype-katex, rehype-highlight: HTML transformations
- zustand: State management
- @tanstack/react-query: Data fetching
- react-hook-form: Form management
- zod: Validation (shared)
- @supabase/supabase-js: Supabase client library
- @supabase/ssr: Supabase SSR helpers for Next.js

### AI Service (apps/ai)
- fastapi: Async web framework
- uvicorn: ASGI server
- langchain: LLM orchestration framework
- langchain-openai: OpenAI provider for LangChain
- pydantic: Data validation and settings management

### Shared (packages/shared)
- zod: Schema validation
- typescript: Type definitions

### Development
- turbo: Monorepo build system
- pnpm: Package manager
- typescript: 5.x
- eslint: Linting
- prettier: Formatting
- vitest: Unit/integration testing
- @testing-library/react: Component testing
- playwright: E2E testing
- supabase: Supabase CLI for local development and migrations

## Development Environment Requirements

- Node.js: 20.x LTS or later
- pnpm: 9.x or later
- Python: 3.13 or later
- uv or pip: Python package management (uv recommended for speed)
- Docker: 24.x or later (required for Supabase local stack and AI service)
- Supabase CLI: Latest version (for local development, migrations, and type generation)
- Git: 2.x or later
- OS: macOS, Linux, or Windows (WSL2 recommended)
- LLM API Key: OpenAI API key (or alternative provider key) for AI features
- Supabase Project: A Supabase project for staging/production environments
